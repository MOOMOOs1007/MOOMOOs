let fields=['나라','성별','외모/신체','가정 환경','재산','재능','성격','직업','결혼여부','특별 이벤트','말년'];
const state={active:0,round:1,results:Array(fields.length).fill(null),pools:Array.from({length:fields.length},()=>new Map()),enabled:Array(fields.length).fill(true),manualAnswers:Array(fields.length).fill(''),checking:false,connecting:false,collecting:false,until:0,rolling:false,filterPrefix:'',streamerName:'',connectedStreamer:'',status:'주소를 입력하고 방송에 연결해 주세요.'};
const $=id=>document.getElementById(id);
const isOverlay=new URLSearchParams(location.search).has('overlay');
const syncKey='rebirth-roulette-live-v1';
const syncChannel='BroadcastChannel' in window?new BroadcastChannel(syncKey):null;
let controller,drawTimer,reelFrame,toastTimer,generation=0,modalOpen=false;
const sample=[['대한민국','아이슬란드','달나라','고양이 왕국'],['여성','남성','성별 없는 정령'],['아이돌 비주얼','키 2미터','작고 단단한 체격'],['화목한 대가족','왕실의 막내','고양이에게 입양됨'],['통장 잔고 500원','건물 세 채','빚 10억'],['순간이동','절대음감','모든 동물과 대화'],['낙천적','완벽주의자','호기심 대장'],['우주비행사','마법사','카페 사장'],['운명적인 결혼','평생 솔로','세 번 결혼'],['복권 1등','외계인 조우','세계 여행'],['행복한 노년','전설로 남음','불로불사']];

if(isOverlay)document.body.classList.add('overlay');

function snapshot(){return {fields,active:state.active,round:state.round,results:state.results,pools:state.pools.map(pool=>[...pool.values()]),enabled:state.enabled,manualAnswers:state.manualAnswers,checking:state.checking,connecting:state.connecting,collecting:state.collecting,until:state.until,rolling:state.rolling,filterPrefix:state.filterPrefix,streamerName:state.streamerName,connectedStreamer:state.connectedStreamer,status:state.status}}
function publish(){if(isOverlay)return;const data=JSON.stringify(snapshot());try{localStorage.setItem(syncKey,data)}catch{}syncChannel?.postMessage(data)}
function applySnapshot(data){if(!isOverlay)return;try{const next=typeof data==='string'?JSON.parse(data):data;if(!next||!Array.isArray(next.pools))return;if(Array.isArray(next.fields))fields=next.fields;Object.assign(state,next,{pools:next.pools.map(list=>new Map(list.map(item=>[item.id,item])))});render()}catch{}}
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
 text=String(text).replace(/[\x00-\x1f]/g,' ').trim();id=String(id||'').trim();if(!id||!text||[...text].length>80||(state.filterPrefix&&!text.startsWith(state.filterPrefix)))return;
 const pool=state.pools[state.active];if(pool.size>=2000&&!pool.has(id))return;pool.set(id,{id,name:String(name||'시청자').slice(0,40),text});render();
}

async function connectBroadcast(){
 if(state.checking||state.connecting||state.collecting||state.rolling)return;
 const value=$('streamer').value.trim();if(!value)return toast('SOOP 방송국 ID나 라이브 주소를 입력해 주세요.');
 state.checking=true;state.streamerName='';state.connectedStreamer='';state.status='방송 정보를 확인하고 있어요…';render();
 try{
  const response=await fetch('/api/info',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({streamer:value})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'방송 연결에 실패했습니다.');
  state.streamerName=data.streamerName;state.connectedStreamer=data.streamer;state.status=`${data.streamerName} 방송에 연결됐어요. 채팅 수집을 눌러 주세요.`;toast(`${data.streamerName} 방송 연결 완료!`);
 }catch(error){state.status=error.message;toast(error.message)}finally{state.checking=false;render()}
}

async function startCollection(){
 if(state.connecting||state.collecting||state.rolling)return;
 const streamer=$('streamer').value.trim();if(!streamer)return toast('SOOP 방송국 ID나 라이브 주소를 입력해 주세요.');
 if(!state.streamerName||!state.connectedStreamer)return toast('먼저 방송 연결 버튼을 눌러 주세요.');
 const token=++generation;controller=new AbortController();state.pools[state.active].clear();state.results[state.active]=null;const manual=state.manualAnswers[state.active].trim();if(manual)state.pools[state.active].set(`manual-${state.active}`,{id:`manual-${state.active}`,name:'직접 추가',text:manual});state.connecting=true;state.status=state.filterPrefix?`'${state.filterPrefix}'로 시작하는 채팅을 수집할 준비 중…`:'전체 채팅을 수집할 준비 중…';render();
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
    if(event.type==='done'){state.connecting=false;state.collecting=false;state.until=0;state.status=state.pools[state.active].size?`${event.message} · ${state.pools[state.active].size}개 수집`:'수집된 채팅이 없어요. 다시 시도해 주세요.';render()}
    if(event.type==='error')throw Error(event.message);render();
   }
  }
 }catch(error){if(token!==generation||error.name==='AbortError')return;state.status=error.message;toast(error.message)}
 finally{if(token===generation){state.connecting=false;state.collecting=false;state.until=0;controller=null;render()}}
}

function cancelCollection(){generation++;controller?.abort();controller=null;state.connecting=false;state.collecting=false;state.until=0}
function reset(all=true){cancelCollection();clearTimeout(drawTimer);cancelAnimationFrame(reelFrame);const first=state.enabled.findIndex(Boolean);Object.assign(state,{active:first<0?0:first,round:all?1:state.round+1,results:Array(fields.length).fill(null),pools:Array.from({length:fields.length},()=>new Map()),rolling:false,status:'초기화했어요. 항목 설정과 방송 주소는 그대로 남아 있어요.'});$('reelTrack').style.transform='';closeModal();render()}
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

function renderSettings(busy){
 $('conditionSettings').replaceChildren(...fields.map((name,i)=>{const row=document.createElement('div');row.className='condition-row';const order=document.createElement('span');order.className='condition-order';order.textContent=String(i+1).padStart(2,'0');const toggle=document.createElement('label');toggle.className='condition-toggle';const check=document.createElement('input');check.type='checkbox';check.checked=state.enabled[i];check.disabled=busy||isOverlay;const slider=document.createElement('span');check.onchange=()=>{if(!check.checked&&state.enabled.filter(Boolean).length===1){check.checked=true;return toast('최소 한 개의 항목은 켜 두어야 해요.')}state.enabled[i]=check.checked;if(!check.checked&&state.active===i){const next=state.enabled.findIndex(Boolean);state.active=next<0?0:next}render()};toggle.append(check,slider);const label=document.createElement('span');label.className='condition-name';label.textContent=name;const answer=document.createElement('input');answer.className='manual-answer';answer.placeholder='직접 답변 1개';answer.maxLength=80;answer.value=state.manualAnswers[i]||'';answer.disabled=busy||isOverlay||!state.enabled[i];answer.oninput=()=>{state.manualAnswers[i]=answer.value;publish()};row.append(order,toggle,label,answer);return row}));
}

function render(){
 const pool=[...state.pools[state.active].values()],result=state.results[state.active],enabledCount=state.enabled.filter(Boolean).length,done=state.results.filter((r,i)=>r&&state.enabled[i]).length,busy=state.checking||state.connecting||state.collecting||state.rolling;
 $('round').textContent='ROUND '+String(state.round).padStart(2,'0');$('streamerName').textContent=state.streamerName?state.streamerName+' 방송 연결됨':'방송 연결 대기';$('progress').textContent=done+' / '+enabledCount+' 완성';$('count').textContent=pool.length;$('status').textContent=state.status;$('collectState').textContent=state.checking?'확인 중':state.connecting?'채팅 연결 중':state.collecting?'수집 중':state.rolling?'추첨 중':state.streamerName?'연결됨':'대기';
 $('connect').disabled=busy||isOverlay;$('connect').textContent=state.checking?'확인 중…':state.streamerName?'✓ 연결됨':'방송 연결';$('connect').classList.toggle('connected',!!state.streamerName&&!busy);$('collect').disabled=busy||isOverlay||!state.streamerName;$('collect').textContent=state.connecting?'채팅 연결 중…':state.collecting?'30초 남음':pool.length?'다시 수집':'채팅 수집';document.querySelectorAll('.prefix-filter').forEach(input=>{input.disabled=busy||isOverlay;input.checked=input.value===state.filterPrefix});$('draw').disabled=busy||isOverlay||!pool.length||!!result;$('reroll').disabled=busy||isOverlay||!pool.length||!result;$('next').disabled=busy||isOverlay||done===enabledCount;$('clear').disabled=busy||isOverlay;$('demo').disabled=busy||isOverlay;
 renderSettings(busy);$('cards').replaceChildren(...fields.map((f,i)=>{const b=document.createElement('button'),r=state.results[i],enabled=state.enabled[i];b.className='card '+(enabled&&i===state.active?'active ':'')+(r?'done ':'')+(!enabled?'inactive':'');b.disabled=busy||isOverlay||!enabled;b.onclick=()=>{state.active=i;render()};b.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><b>${f}</b>`;const v=document.createElement('div');v.className='value '+(!r?'pending':'');v.textContent=!enabled?'이번 환생에서 제외':r?.text||(i===state.active?'채팅으로 운명을 정해 보세요':'아직 정해지지 않았어요');if(r&&enabled){const n=document.createElement('small');n.textContent=viewerName(r.name);v.append(n)}b.append(v,document.createTextNode(!enabled?'OFF':r?'♥':i===state.active?'✦':'·'));return b}));
 $('candidates').replaceChildren(...(pool.length?candidateRows(pool):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':state.collecting?'채팅을 기다리고 있어요…':'아직 모인 채팅이 없어요 ♡'})]));
 if(modalOpen&&!state.rolling){$('modalChat').replaceChildren(...(pool.length?candidateRows(pool,false):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':'채팅을 기다리고 있어요…'})]));$('modalChat').scrollTop=$('modalChat').scrollHeight}
 $('closeModal').disabled=busy;if(modalOpen&&!state.rolling&&!$('winner').classList.contains('show'))$('modalStatus').textContent=state.status;tick();publish();
}
function tick(){const left=Math.max(0,Math.ceil((state.until-Date.now())/1000));if(state.collecting){$('collectState').textContent=`수집 중 · ${left}초`;$('collect').textContent=`${left}초 남음`}if(modalOpen){$('modalSeconds').textContent=state.connecting?'…':String(left).padStart(2,'0');$('countdown').style.setProperty('--progress',state.collecting?left/30:1)}}

$('connect').onclick=connectBroadcast;$('collect').onclick=startCollection;document.querySelectorAll('.prefix-filter').forEach(input=>input.addEventListener('change',()=>{state.filterPrefix=input.checked?input.value:'';state.status=state.filterPrefix?`'${state.filterPrefix}'로 시작하는 채팅만 수집합니다.`:'전체 채팅을 수집합니다.';render()}));$('streamer').addEventListener('input',()=>{if(state.streamerName){state.streamerName='';state.connectedStreamer='';state.status='주소가 바뀌었어요. 다시 방송에 연결해 주세요.';render()}});$('draw').onclick=spin;$('reroll').onclick=spin;$('next').onclick=()=>{const candidates=state.results.map((r,i)=>({r,i})).filter(x=>state.enabled[x.i]&&!x.r);const after=candidates.find(x=>x.i>state.active);if(candidates.length)state.active=(after||candidates[0]).i;render()};$('resetAll').onclick=()=>reset(true);$('clear').onclick=()=>{state.pools[state.active].clear();state.results[state.active]=null;render()};$('closeModal').onclick=closeModal;$('modalBackdrop').onclick=closeModal;
$('addConditionForm').onsubmit=event=>{event.preventDefault();const name=$('newCondition').value.trim();if(!name)return toast('추가할 항목 이름을 입력해 주세요.');if(fields.length>=30)return toast('항목은 최대 30개까지 추가할 수 있어요.');fields.push(name);state.results.push(null);state.pools.push(new Map());state.enabled.push(true);state.manualAnswers.push('');$('newCondition').value='';state.status=`'${name}' 항목을 추가했어요.`;render()};
$('demo').onclick=()=>{const i=state.active;state.pools[i].clear();const list=sample[i]||['행운 가득','평범하지만 행복','상상도 못한 결과'];list.forEach((text,j)=>state.pools[i].set('demo-'+i+'-'+j,{id:'demo-'+i+'-'+j,name:'테스트 '+(j+1),text}));const manual=state.manualAnswers[i].trim();if(manual)state.pools[i].set('manual-'+i,{id:'manual-'+i,name:'직접 추가',text:manual});state.results[i]=null;state.status='테스트 후보로 룰렛을 시작했어요.';openModal('reroll');spin()};
syncChannel&&(syncChannel.onmessage=event=>applySnapshot(event.data));addEventListener('storage',event=>{if(event.key===syncKey&&event.newValue)applySnapshot(event.newValue)});if(isOverlay){const saved=localStorage.getItem(syncKey);if(saved)applySnapshot(saved)}setInterval(tick,100);render();
