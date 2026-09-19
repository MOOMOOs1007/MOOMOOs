const fields=['나라','성별','재산','가정 환경','재능'];
const state={active:0,round:1,results:Array(5).fill(null),pools:Array.from({length:5},()=>new Map()),checking:false,connecting:false,collecting:false,until:0,rolling:false,streamerName:'',connectedStreamer:'',status:'주소를 입력하고 방송에 연결해 주세요.'};
const $=id=>document.getElementById(id);
const isOverlay=new URLSearchParams(location.search).has('overlay');
const syncKey='rebirth-roulette-live-v1';
const syncChannel='BroadcastChannel' in window?new BroadcastChannel(syncKey):null;
let controller,drawTimer,reelFrame,toastTimer,generation=0,modalOpen=false;
const sample=[['대한민국','아이슬란드','달나라','고양이 왕국'],['여성','남성','성별 없는 정령'],['통장 잔고 500원','건물 세 채','빚 10억'],['화목한 대가족','왕실의 막내','고양이에게 입양됨'],['순간이동','절대음감','모든 동물과 대화']];

if(isOverlay)document.body.classList.add('overlay');

function snapshot(){return {active:state.active,round:state.round,results:state.results,pools:state.pools.map(pool=>[...pool.values()]),checking:state.checking,connecting:state.connecting,collecting:state.collecting,until:state.until,rolling:state.rolling,streamerName:state.streamerName,connectedStreamer:state.connectedStreamer,status:state.status}}
function publish(){if(isOverlay)return;const data=JSON.stringify(snapshot());try{localStorage.setItem(syncKey,data)}catch{}syncChannel?.postMessage(data)}
function applySnapshot(data){if(!isOverlay)return;try{const next=typeof data==='string'?JSON.parse(data):data;if(!next||!Array.isArray(next.pools))return;Object.assign(state,next,{pools:next.pools.map(list=>new Map(list.map(item=>[item.id,item])))});render()}catch{}}
function toast(text){$('toast').textContent=text;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3000)}

function openModal(mode='collect'){
 if(isOverlay)return;modalOpen=true;$('drawModal').classList.add('open');$('drawModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
 $('modalTitle').textContent=mode==='collect'?`${fields[state.active]} 후보를 모으는 중이에요`:`${fields[state.active]} 운명을 다시 고를게요`;
 $('modalSubtitle').textContent=mode==='collect'?'시청자들의 채팅이 실시간으로 도착하고 있어요!':'모아둔 채팅들이 빙글빙글 돌아가요!';
 $('modalKicker').textContent=mode==='collect'?'CHAT COLLECTION':'DESTINY ROULETTE';$('winner').className='winner';$('winner').innerHTML='';
 $('modalRoulette').classList.remove('show');$('modalChat').style.display='block';$('countdown').parentElement.style.display='block';
 $('modalStatus').textContent=mode==='collect'?'SOOP 채팅방을 확인하고 있어요.':'잠시만 기다려 주세요.';render();
}
function closeModal(){if(state.connecting||state.collecting||state.rolling)return;modalOpen=false;$('drawModal').classList.remove('open');$('drawModal').setAttribute('aria-hidden','true');document.body.style.overflow=''}

function add(id,name,text){
 if(!state.collecting||Date.now()>=state.until||state.rolling)return;
 text=String(text).replace(/[\x00-\x1f]/g,' ').trim();id=String(id||'').trim();if(!id||!text||[...text].length>80)return;
 const pool=state.pools[state.active];if(pool.size>=2000&&!pool.has(id))return;pool.set(id,{id,name:String(name||'시청자').slice(0,40),text});render();
}

async function startCollection(){
 if(state.connecting||state.collecting||state.rolling)return;
 const streamer=$('streamer').value.trim();if(!streamer)return toast('SOOP 방송국 ID나 라이브 주소를 입력해 주세요.');
 const token=++generation;controller=new AbortController();state.pools[state.active].clear();state.results[state.active]=null;state.connecting=true;state.status='방송 정보를 확인하고 있어요…';openModal('collect');render();
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({streamer}),signal:controller.signal});
  if(!response.ok){let message='수집 요청에 실패했습니다.';try{message=(await response.json()).error||message}catch{}throw Error(message)}
  if(!response.body)throw Error('스트리밍 응답을 받을 수 없습니다.');
  const reader=response.body.pipeThrough(new TextDecoderStream()).getReader();let buffer='';
  while(true){const {value,done}=await reader.read();if(done)break;if(token!==generation){reader.cancel();break}buffer+=value;let end;
   while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);if(!line)continue;let event;try{event=JSON.parse(line)}catch{continue}
    if(event.type==='status')state.status=event.message;
    if(event.type==='entered'){state.connecting=false;state.collecting=true;state.until=Date.now()+Number(event.duration||30)*1000;state.streamerName=event.streamerName||event.streamer||'';state.connectedStreamer=event.streamer||streamer;state.status=event.message}
    if(event.type==='chat')add(event.id,event.name,event.text);
    if(event.type==='done'){state.connecting=false;state.collecting=false;state.until=0;state.status=state.pools[state.active].size?`${event.message} · ${state.pools[state.active].size}개 수집`:'수집된 채팅이 없어요. 다시 시도해 주세요.';$('modalTitle').textContent='채팅 수집이 끝났어요!';$('modalSubtitle').textContent=state.pools[state.active].size?'모인 채팅에서 뽑기 버튼을 눌러 주세요.':'방송 채팅이 올라올 때 다시 수집해 주세요.';render();setTimeout(closeModal,1200)}
    if(event.type==='error')throw Error(event.message);render();
   }
  }
 }catch(error){if(token!==generation||error.name==='AbortError')return;state.status=error.message;$('modalStatus').textContent=error.message;toast(error.message)}
 finally{if(token===generation){state.connecting=false;state.collecting=false;state.until=0;controller=null;render()}}
}

function cancelCollection(){generation++;controller?.abort();controller=null;state.connecting=false;state.collecting=false;state.until=0}
function reset(all=true){cancelCollection();clearTimeout(drawTimer);cancelAnimationFrame(reelFrame);Object.assign(state,{active:0,round:all?1:state.round+1,results:Array(5).fill(null),pools:Array.from({length:5},()=>new Map()),rolling:false,status:'초기화했어요. 방송 주소는 그대로 남아 있어요.'});$('reelTrack').style.transform='';closeModal();render()}
function random(pool){const max=0x100000000-(0x100000000%pool.length);let n;do n=crypto.getRandomValues(new Uint32Array(1))[0];while(n>=max);return pool[n%pool.length]}

function viewerName(name){const value=String(name||'시청자');return value.endsWith('님')?value:value+' 님'}
function spin(){
 const index=state.active,pool=[...state.pools[index].values()];if(!pool.length)return toast('수집된 후보가 없어요.');
 if(!modalOpen)openModal('reroll');const winner=random(pool),reel=Array.from({length:38},()=>random(pool));reel.push(winner);state.rolling=true;
 $('modalKicker').textContent='DESTINY ROULETTE';$('modalTitle').textContent='두근두근, 운명을 고르는 중!';$('modalSubtitle').textContent='어떤 채팅이 선택될까요?';$('modalChat').style.display='none';$('countdown').parentElement.style.display='none';$('modalRoulette').classList.add('show');$('modalStatus').textContent='룰렛이 멈출 때까지 기다려 주세요.';
 $('reelTrack').style.transform='';$('reelTrack').replaceChildren(...reel.map(x=>{const d=document.createElement('div');d.className='reel-item';d.append(document.createTextNode(x.text));const n=document.createElement('small');n.textContent=viewerName(x.name);d.append(n);return d}));render();
 const started=performance.now(),duration=4300;function frame(now){const t=Math.min(1,(now-started)/duration),p=1-Math.pow(1-t,3),h=$('reelTrack').firstElementChild.offsetHeight;$('reelTrack').style.transform=`translateY(${-p*(reel.length-1)*h}px)`;if(t<1)reelFrame=requestAnimationFrame(frame)}reelFrame=requestAnimationFrame(frame);
 drawTimer=setTimeout(()=>{state.results[index]=winner;state.rolling=false;$('winner').innerHTML=`<span>♥ ${fields[index]} 당첨 결과 ♥</span><strong>${escapeHtml(winner.text)}</strong><small>${escapeHtml(viewerName(winner.name))}의 채팅</small>`;$('winner').classList.add('show');$('modalStatus').textContent='새로운 운명이 정해졌어요!';render()},duration);
}
function escapeHtml(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}

function candidateRows(pool,removable=true){return pool.slice().reverse().map(x=>{const row=document.createElement('div');row.className='candidate';const d=document.createElement('div'),n=document.createElement('b'),p=document.createElement('p');n.textContent=x.name;p.textContent=x.text;d.append(n,p);row.append(d);if(removable){const del=document.createElement('button');del.textContent='×';del.disabled=state.connecting||state.collecting||state.rolling||isOverlay;del.onclick=()=>{state.pools[state.active].delete(x.id);state.results[state.active]=null;render()};row.append(del)}return row})}

function render(){
 const pool=[...state.pools[state.active].values()],result=state.results[state.active],done=state.results.filter(Boolean).length,busy=state.checking||state.connecting||state.collecting||state.rolling;
 $('round').textContent='ROUND '+String(state.round).padStart(2,'0');$('streamerName').textContent=state.streamerName?state.streamerName+' 방송 연결됨':'방송 연결 대기';$('progress').textContent=done+' / 5 완성';$('count').textContent=pool.length;$('status').textContent=state.status;$('collectState').textContent=state.checking?'확인 중':state.connecting?'입장 중':state.collecting?'수집 중':state.rolling?'추첨 중':state.streamerName?'연결됨':'대기';
 $('connect').disabled=busy||isOverlay;$('connect').textContent=state.connecting?'연결 중…':state.collecting?'수집 중…':pool.length?'다시 수집':'방송 연결';$('connect').classList.toggle('connected',!!state.streamerName&&!busy);$('draw').disabled=busy||isOverlay||!pool.length||!!result;$('reroll').disabled=busy||isOverlay||!pool.length||!result;$('next').disabled=busy||isOverlay||done===5;$('clear').disabled=busy||isOverlay;$('demo').disabled=busy||isOverlay;
 $('cards').replaceChildren(...fields.map((f,i)=>{const b=document.createElement('button'),r=state.results[i];b.className='card '+(i===state.active?'active ':'')+(r?'done':'');b.disabled=busy||isOverlay;b.onclick=()=>{state.active=i;render()};b.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><b>${f}</b>`;const v=document.createElement('div');v.className='value '+(!r?'pending':'');v.textContent=r?.text||(i===state.active?'채팅으로 운명을 정해 보세요':'아직 정해지지 않았어요');if(r){const n=document.createElement('small');n.textContent=viewerName(r.name);v.append(n)}b.append(v,document.createTextNode(r?'♥':i===state.active?'✦':'·'));return b}));
 $('candidates').replaceChildren(...(pool.length?candidateRows(pool):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':state.collecting?'채팅을 기다리고 있어요…':'아직 모인 채팅이 없어요 ♡'})]));
 if(modalOpen&&!state.rolling){$('modalChat').replaceChildren(...(pool.length?candidateRows(pool,false):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':'채팅을 기다리고 있어요…'})]));$('modalChat').scrollTop=$('modalChat').scrollHeight}
 $('closeModal').disabled=busy;if(modalOpen&&!state.rolling&&!$('winner').classList.contains('show'))$('modalStatus').textContent=state.status;tick();publish();
}
function tick(){const left=Math.max(0,Math.ceil((state.until-Date.now())/1000));if(modalOpen){$('modalSeconds').textContent=state.connecting?'…':String(left).padStart(2,'0');$('countdown').style.setProperty('--progress',state.collecting?left/30:1)}}

$('connect').onclick=startCollection;$('streamer').addEventListener('input',()=>{if(state.streamerName){state.streamerName='';state.connectedStreamer='';state.status='주소가 바뀌었어요. 다시 방송에 연결해 주세요.';render()}});$('draw').onclick=spin;$('reroll').onclick=spin;$('next').onclick=()=>{const n=state.results.findIndex((r,i)=>!r&&i>state.active);state.active=n<0?state.results.findIndex(r=>!r):n;render()};$('resetAll').onclick=()=>reset(true);$('clear').onclick=()=>{state.pools[state.active].clear();state.results[state.active]=null;render()};$('closeModal').onclick=closeModal;$('modalBackdrop').onclick=closeModal;
$('demo').onclick=()=>{const i=state.active;state.pools[i].clear();sample[i].forEach((text,j)=>state.pools[i].set('demo-'+i+'-'+j,{id:'demo-'+i+'-'+j,name:'테스트 '+(j+1),text}));state.results[i]=null;state.status='테스트 후보로 룰렛을 시작했어요.';openModal('reroll');spin()};
syncChannel&&(syncChannel.onmessage=event=>applySnapshot(event.data));addEventListener('storage',event=>{if(event.key===syncKey&&event.newValue)applySnapshot(event.newValue)});if(isOverlay){const saved=localStorage.getItem(syncKey);if(saved)applySnapshot(saved)}setInterval(tick,100);render();
