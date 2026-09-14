import http from 'node:http';
import {collect} from './collector.mjs';
import {readFile} from 'node:fs/promises';
import {randomInt} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const HOST='127.0.0.1', PORT=3210;
const fields=['나라','성별','재산','가정 환경','재능'];
const pools=fields.map(()=>new Map());
const state={fields,results:fields.map(()=>null),active:0,collecting:false,collectUntil:null,spin:null,mode:'current',status:'방송 연결 전',connected:false,demo:false,streamer:'',received:0,lastReceived:null,rolling:false,notice:'방송 ID를 입력하거나 테스트 채팅으로 시작하세요.',round:1};
const clients=new Set();
let stopCollector,generation=0,drawTimer,collectTimer,spinSequence=0;
export function snapshot(){return {...state,counts:pools.map(p=>p.size),pools:pools.map(p=>[...p.values()].slice(-100))};}
let pendingPublish;
function publish(){if(pendingPublish)return;pendingPublish=setTimeout(()=>{pendingPublish=null;const data='data: '+JSON.stringify(snapshot())+'\n\n';for(const c of clients){if(c.writableLength>1024*1024){c.destroy();clients.delete(c);}else c.write(data);}},100);}
export function add(user,name,text){if(!state.collecting||state.rolling||Date.now()>=state.collectUntil)return; user=String(user||'').replace(/\(\d+\)$/,'');text=String(text).replace(/[\x00-\x1f]/g,' ').trim();let index=state.active;
 if(state.mode==='tagged'){const match=text.match(/^!(나라|성별|재산|가정\s*환경|재능)\s+(.+)$/);if(!match)return;index=fields.indexOf(match[1].replace(/가정\s*환경/,'가정 환경'));text=match[2].trim();}
 if(index!==state.active||index<0||index>=5||state.results[index]||!text||Array.from(text).length>80||!user)return;
 const p=pools[index];if(p.size>=2000&&!p.has(user))return;p.set(user,{id:user,name:String(name||'시청자').slice(0,40),text});publish();
}
function disconnect(){generation++;if(stopCollector){stopCollector();stopCollector=null;}state.connected=false;}
function connect(id){const gen=generation;state.status='soop4j 수집기 시작 중…';state.received=0;state.lastReceived=null;publish();
 stopCollector=collect(id,event=>{if(gen===generation)receive(event);});
}
export function receive(event){
  if(event.type==='chat') {state.connected=true;state.received++;state.lastReceived=Date.now();state.status='SOOP 채팅 수신 중 · soop4j';add(event.id,event.name,event.text);}
  else if(event.type==='entered'){state.connected=true;state.status=event.message;}
  else {state.connected=false;state.status=event.message||'연결 끊김 · 다시 연결하세요.';}
  publish();
}
function stopCollection(){clearTimeout(collectTimer);state.collecting=false;state.collectUntil=null;}
function reset(all=false){clearTimeout(drawTimer);stopCollection();state.rolling=false;state.spin=null;state.results=fields.map(()=>null);state.active=0;pools.forEach(p=>p.clear());state.round=all?1:state.round+1;if(all){state.received=0;state.lastReceived=null;state.mode='current';}}
function startDraw(reroll){
 const i=state.active,items=[...pools[i].values()];
 if(state.collecting)throw Error('30초 수집이 끝난 뒤 뽑아주세요.');
 if(reroll&&!state.results[i])throw Error('먼저 한 번 뽑아주세요.');
 if(!reroll&&state.results[i])throw Error('다시 뽑으려면 리롤을 눌러주세요.');
 if(!items.length)throw Error('후보가 없습니다. 채팅 수집을 먼저 눌러주세요.');
 const winner=items[randomInt(items.length)];
 const entries=Array.from({length:40},()=>items[randomInt(items.length)]);entries.push(winner);
 state.rolling=true;state.spin={id:++spinSequence,index:i,startedAt:Date.now(),duration:4200,entries};state.notice=fields[i]+(reroll?' 리롤 중…':' 추첨 중…');
 drawTimer=setTimeout(()=>{state.results[i]=winner;state.rolling=false;state.notice='리롤로 다시 뽑거나 다음 항목으로 이동하세요.';publish();},4200);
}
export function command(action,data={}){
 if(state.rolling&&!['disconnect','resetAll','reset'].includes(action))throw Error('추첨이 끝난 뒤 조작하세요.');
 if(state.collecting&&['select','mode','clear','remove','demo'].includes(action))throw Error('30초 수집이 끝난 뒤 조작하세요.');
 switch(action){
 case 'connect':{let id=String(data.id||'').trim();if(/^https?:/.test(id)){const url=new URL(id);if(!/(^|\.)(sooplive\.com|sooplive\.co\.kr|afreecatv\.com)$/.test(url.hostname))throw Error('SOOP 방송 주소를 입력하세요.');id=url.pathname.split('/').filter(Boolean)[0]||'';}
 if(!/^[a-zA-Z0-9_]{2,50}$/.test(id))throw Error('올바른 방송국 ID를 입력하세요.');disconnect();reset();state.demo=false;state.mode='current';state.streamer=id;state.notice='채팅 수집을 누르면 30초 동안 후보를 모읍니다.';connect(id);break;}
 case 'disconnect':disconnect();state.status='연결 해제';break;
 case 'collect':{
 if(state.collecting)throw Error('이미 채팅을 수집하고 있습니다.');
 if(!state.connected)throw Error('방송을 먼저 연결하세요.');
 const i=state.active;pools[i].clear();state.results[i]=null;state.spin=null;state.collecting=true;state.collectUntil=Date.now()+30000;state.notice=fields[i]+' 채팅 수집 중 · 30초';
 collectTimer=setTimeout(()=>{stopCollection();state.notice=pools[i].size?'수집 완료! 뽑기 버튼을 눌러주세요.':'수집된 후보가 없습니다. 다시 수집해 주세요.';publish();},30000);break;
 }
 case 'mode':if(!['current','tagged'].includes(data.mode))throw Error('수집 방식 오류');state.mode=data.mode;pools.forEach(p=>p.clear());break;
 case 'select':if(!Number.isInteger(data.index)||data.index<0||data.index>4)throw Error('항목을 선택하세요.');state.active=data.index;state.spin=null;break;
 case 'remove':pools[state.active]?.delete(data.id);break;
 case 'clear':pools[state.active]?.clear();break;
 case 'reset':reset();state.notice='새 라운드 · 채팅 수집을 눌러주세요.';break;
 case 'resetAll':reset(true);state.notice='전체 초기화 완료 · 방송 연결은 유지됩니다.';break;
 case 'demo':{disconnect();reset();state.demo=true;state.status='테스트 모드 · 실제 채팅 아님';state.streamer='';state.received=0;state.lastReceived=null;state.mode='tagged';const samples=[['대한민국','아이슬란드','고양이 왕국','뉴질랜드','달나라'],['여성','남성','성별 없는 정령'],['통장 잔고 500원','건물 세 채','빚 10억','매일 100만원이 생김'],['화목한 대가족','왕실의 막내','고양이에게 입양됨','부모님이 세계 여행 중'],['순간이동','절대음감','누우면 바로 잠듦','모든 동물과 대화']];samples.forEach((list,i)=>list.forEach((text,j)=>pools[i].set('demo'+j,{id:'demo'+j,name:'테스트 시청자 '+(j+1),text})));state.mode='current';state.notice='테스트 후보입니다. 실제 방송 연결 시 모두 초기화됩니다.';break;}
 case 'draw':startDraw(false);break;
 case 'reroll':startDraw(true);break;
 default:throw Error('알 수 없는 동작');}
 publish();return snapshot();
}
const server=http.createServer(async(req,res)=>{
 const origin=`http://${HOST}:${PORT}`;if(req.headers.host!==`${HOST}:${PORT}`&&req.headers.host!==`localhost:${PORT}`){res.writeHead(403).end();return;}
 const url=new URL(req.url,origin);
 if(req.method==='GET'&&url.pathname==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write('data: '+JSON.stringify(snapshot())+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
 if(req.method==='POST'&&url.pathname==='/action'){
 if(![origin,`http://localhost:${PORT}`].includes(req.headers.origin)||req.headers['content-type']!=='application/json'){res.writeHead(403).end();return;}
 try{let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error('요청이 너무 큽니다.');}const data=JSON.parse(body);const result=command(data.action,data);res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(result));}catch(e){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({error:e.message}));}return;}
 const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/roulette.css':'roulette.css'};
 if(req.method!=='GET'||!files[url.pathname]){res.writeHead(404).end();return;}
 const name=files[url.pathname];res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(new URL(name,import.meta.url)));
});
if(process.argv[1]===fileURLToPath(import.meta.url)){server.listen(PORT,HOST,()=>console.log(`환생 연구소: http://${HOST}:${PORT}\n방송용 화면: http://${HOST}:${PORT}/?overlay=1\n종료: Ctrl+C`));server.on('error',e=>{console.error('실행 실패:',e.message);process.exit(1);});setInterval(()=>{for(const c of clients)c.write(': heartbeat\n\n');},15000).unref();}


process.once('exit',()=>{if(stopCollector)stopCollector();});
