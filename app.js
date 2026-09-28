let fields=['나라','성별','외모/신체','가정 환경','재산','재능','성격','직업','결혼여부','특별 이벤트'];
const state={active:0,round:1,results:Array(fields.length).fill(null),pools:Array.from({length:fields.length},()=>new Map()),enabled:Array(fields.length).fill(true),manualAnswers:Array(fields.length).fill(''),manualConfirmed:Array(fields.length).fill(false),checking:false,connecting:false,collecting:false,until:0,rolling:false,modal:null,spin:null,streamerName:'',connectedStreamer:'',status:'주소를 입력하고 방송에 연결해 주세요.'};
const $=id=>document.getElementById(id);
const isOverlay=false;
let controller,drawTimer,reelFrame,toastTimer,generation=0,chatSequence=0,modalOpen=false,pendingWinner=null,pendingIndex=-1,lastOverlaySpin='';
const sample=[
 ['대한민국','캐나다','프랑스','뉴질랜드','아이슬란드','브라질','스위스','이름 모를 무인도','달나라 제3구역','고양이 왕국','편의점 냉동고 안','와이파이가 한 칸만 잡히는 나라'],
 ['여성','남성','논바이너리','성별 없는 정령','필요할 때마다 바뀜','본인도 아직 모름','공식 서류마다 다르게 적힘','로봇이라 해당 없음','고양이가 정해 줌','주말에만 다른 성별','관찰하는 순간 결정됨','비밀로 유지됨'],
 ['아이돌 비주얼','건강한 운동 체형','모델 같은 비율','귀여운 인상','키 2미터','작고 단단한 체격','눈썹만 세계 최고','팔이 유난히 김','사진마다 얼굴이 다름','머리카락이 기분에 따라 색이 바뀜','웃으면 주변 조명이 켜짐','얼굴 대신 이모티콘이 뜸'],
 ['화목한 대가족','다정한 부모님과 외동','형제자매가 많은 집','조부모님과 함께 사는 집','왕실의 막내','고양이에게 입양됨','가족 전원이 유튜버','매일 가족회의가 열림','명절이 365일인 집','부모님이 사실 시간여행자','반려동물이 실질적 가장','가족 단톡방이 48개'],
 ['평범한 중산층','저축이 넉넉함','건물 세 채','세계적인 재벌','통장 잔고 500원','빚 10억','게임 머니만 부자','매달 복권 5등 당첨','재산이 전부 치킨 쿠폰','금괴 대신 붕어빵을 보유','돈은 없지만 포인트가 3억','동전만으로 집 한 채 분량'],
 ['절대음감','뛰어난 운동신경','천재적인 그림 실력','다국어 능력','순간이동','모든 동물과 대화','라면 물을 항상 정확히 맞춤','USB를 한 번에 꽂음','재채기로 날씨를 예측','잠든 지 3초 만에 숙면','택배 도착 시간을 감지','모든 리모컨을 찾아냄'],
 ['낙천적','다정하고 배려심 많음','차분하고 신중함','호기심 대장','완벽주의자','강한 리더십','칭찬을 받으면 충전됨','배고프면 철학자가 됨','아무 말이나 명언처럼 함','낯가림이 있지만 외계인과는 친함','결정을 동전에게 맡김','웃음 참기 능력 0점'],
 ['의사','교사','개발자','카페 사장','우주비행사','마법사','전문 고양이 통역사','구름 모양 감별사','라면 스프 배합 연구원','용사 파티의 회계 담당','월요일 퇴치 전문가','왕실 공식 낮잠 관리자'],
 ['운명적인 결혼','오랜 연애 끝에 결혼','비혼으로 행복하게 삶','평생 솔로','세 번 결혼','첫눈에 반해 일주일 만에 결혼','게임 속 캐릭터와 약혼','결혼식 날 상대를 처음 만남','반려동물이 배우자를 선택','매년 같은 사람과 재혼','일과 결혼했다고 주장','청첩장만 만들고 결혼은 안 함'],
 ['복권 1등','세계 여행','평생의 꿈을 이룸','유명인과 우연히 친구가 됨','외계인 조우','타임머신 발견','자고 일어나니 왕이 됨','길에서 주운 돌이 국보로 판정','배달 음식에서 황금 티켓 발견','평범한 하루가 뮤지컬로 변함','전 세계 고양이의 선택을 받음','집 냉장고가 다른 차원과 연결됨']
];

function publish(){}
function toast(text){$('toast').textContent=text;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3000)}
function openConnectionModal(){$('connectionModal').classList.add('open');$('connectionModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>$('streamer').focus(),0)}
function closeConnectionModal(){if(state.checking)return;$('connectionModal').classList.remove('open');$('connectionModal').setAttribute('aria-hidden','true');if(!modalOpen)document.body.style.overflow=''}

function openModal(mode='collect'){
 if(isOverlay)return;modalOpen=true;$('drawModal').classList.add('open');$('drawModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
 state.modal={phase:mode,index:state.active};
 $('modalTitle').textContent=mode==='collect'?`${fields[state.active]} 후보를 모으는 중이에요`:`${fields[state.active]} 운명을 다시 고를게요`;
 $('modalSubtitle').textContent=mode==='collect'?'시청자들의 채팅이 실시간으로 도착하고 있어요!':'모아둔 채팅들이 빙글빙글 돌아가요!';
 pendingWinner=null;pendingIndex=-1;$('modalActions').classList.remove('show');$('modalKicker').textContent=mode==='collect'?'CHAT COLLECTION':'DESTINY ROULETTE';$('winner').className='winner';$('winner').innerHTML='';
 $('startRoulette').classList.remove('show');$('modalRoulette').classList.remove('show');$('modalChat').style.display='block';$('countdown').parentElement.style.display='block';
 $('modalStatus').textContent=mode==='collect'?'SOOP 채팅방을 확인하고 있어요.':'잠시만 기다려 주세요.';render();
}
function closeModal(){if(state.connecting||state.collecting||state.rolling)return;modalOpen=false;$('drawModal').classList.remove('open');$('drawModal').setAttribute('aria-hidden','true');document.body.style.overflow='';if(!isOverlay){state.modal=null;state.spin=null;publish()}}

function add(id,name,text){
 if(!state.collecting||Date.now()>=state.until||state.rolling)return;
 text=String(text).replace(/[\x00-\x1f]/g,' ').trim();id=String(id||'').trim();if(!id||!text||[...text].length>80)return;
 const pool=state.pools[state.active];if(pool.size>=2000)return;const candidateId=`${id}-${Date.now()}-${++chatSequence}`;pool.set(candidateId,{id:candidateId,userId:id,name:String(name||'시청자').slice(0,40),text});render();
}

async function connectBroadcast(){
 if(state.checking||state.connecting||state.collecting||state.rolling)return;
 const value=$('streamer').value.trim();if(!value)return toast('SOOP 방송국 ID나 라이브 주소를 입력해 주세요.');
 state.checking=true;state.streamerName='';state.connectedStreamer='';state.status='방송 정보를 확인하고 있어요…';render();
 try{
  const response=await fetch('/api/info',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({streamer:value})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'방송 연결에 실패했습니다.');
  state.streamerName=data.streamerName;state.connectedStreamer=data.streamer;state.status=`${data.streamerName} 방송에 연결됐어요.`;state.checking=false;toast(`${data.streamerName} 방송 연결 완료!`);closeConnectionModal();
 }catch(error){state.status=error.message;toast(error.message)}finally{state.checking=false;render()}
}

async function startCollection(index=state.active){
 if(state.connecting||state.collecting||state.rolling)return;
 const streamer=$('streamer').value.trim();if(!streamer)return toast('SOOP 방송국 ID나 라이브 주소를 입력해 주세요.');
 if(!state.streamerName||!state.connectedStreamer)return toast('먼저 방송 연결 버튼을 눌러 주세요.');
 state.active=index;const manual=state.manualAnswers[index].trim();if(!manual)return toast('후보를 하나 입력해 주세요.');
 const token=++generation;controller=new AbortController();state.pools[index].clear();state.results[index]=null;state.manualConfirmed[index]=true;state.pools[index].set(`manual-${index}`,{id:`manual-${index}`,name:'직접 등록',text:manual});state.connecting=true;state.status='전체 채팅을 수집할 준비 중…';openModal('collect');render();
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
    if(event.type==='done'){state.connecting=false;state.collecting=false;state.until=0;state.status=`${event.message} · ${state.pools[state.active].size}개 후보`;showSpinReady(state.active)}
    if(event.type==='error')throw Error(event.message);render();
   }
  }
 }catch(error){if(token!==generation||error.name==='AbortError')return;state.status=error.message;toast(error.message)}
 finally{if(token===generation){state.connecting=false;state.collecting=false;state.until=0;controller=null;render()}}
}

function cancelCollection(){generation++;controller?.abort();controller=null;state.connecting=false;state.collecting=false;state.until=0}
function cancelActiveCollection(){if(!state.connecting&&!state.collecting)return;cancelCollection();state.status='채팅 수집을 취소했어요.';state.modal=null;closeModal();render();toast('채팅 수집을 취소했어요.')}
function reset(all=true){cancelCollection();clearTimeout(drawTimer);cancelAnimationFrame(reelFrame);const first=state.enabled.findIndex(Boolean);Object.assign(state,{active:first<0?0:first,round:all?1:state.round+1,results:Array(fields.length).fill(null),pools:Array.from({length:fields.length},()=>new Map()),manualConfirmed:Array(fields.length).fill(false),modal:null,spin:null,rolling:false,status:'초기화했어요. 항목 설정과 방송 주소는 그대로 남아 있어요.'});$('reelTrack').style.transform='';closeModal();render()}
function random(pool){const max=0x100000000-(0x100000000%pool.length);let n;do n=crypto.getRandomValues(new Uint32Array(1))[0];while(n>=max);return pool[n%pool.length]}

function viewerName(name){const value=String(name||'시청자');return value.endsWith('님')?value:value+' 님'}
function showSpinReady(index=state.active){
 state.active=index;state.modal={phase:'ready',index};modalOpen=true;$('drawModal').classList.add('open');$('drawModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('modalKicker').textContent='COLLECTION COMPLETE';$('modalTitle').textContent=`${fields[index]} 후보 수집 완료!`;$('modalSubtitle').textContent='준비가 되면 버튼을 눌러 룰렛을 돌려 주세요.';$('countdown').parentElement.style.display='none';$('modalChat').style.display='block';$('modalRoulette').classList.remove('show');$('winner').className='winner';$('winner').innerHTML='';$('modalActions').classList.remove('show');$('startRoulette').classList.add('show');$('modalStatus').textContent=`${state.pools[index].size}개의 후보가 준비됐어요.`;render();
}
function spin(){
 const index=state.active,pool=[...state.pools[index].values()];if(!pool.length)return toast('수집된 후보가 없어요.');
 if(!modalOpen)openModal('reroll');state.modal={phase:'roulette',index};pendingWinner=null;pendingIndex=index;$('modalActions').classList.remove('show');$('winner').className='winner';$('winner').innerHTML='';const winner=random(pool),reel=Array.from({length:38},()=>random(pool));reel.push(winner);const duration=4300;state.rolling=true;state.spin={id:`${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,index,entries:reel,winner,startedAt:Date.now(),duration,phase:'rolling'};
 $('modalKicker').textContent='DESTINY ROULETTE';$('modalTitle').textContent='두근두근, 운명을 고르는 중!';$('modalSubtitle').textContent='어떤 채팅이 선택될까요?';$('startRoulette').classList.remove('show');$('modalChat').style.display='none';$('countdown').parentElement.style.display='none';$('modalRoulette').classList.add('show');$('modalStatus').textContent='룰렛이 멈출 때까지 기다려 주세요.';
 $('reelTrack').style.transform='';$('reelTrack').replaceChildren(...reel.map(x=>{const d=document.createElement('div');d.className='reel-item';d.append(document.createTextNode(x.text));const n=document.createElement('small');n.textContent=viewerName(x.name);d.append(n);return d}));render();
 const started=performance.now();function frame(now){const t=Math.min(1,(now-started)/duration),p=1-Math.pow(1-t,3),h=$('reelTrack').firstElementChild.offsetHeight;$('reelTrack').style.transform=`translateY(${-p*(reel.length-1)*h}px)`;if(t<1)reelFrame=requestAnimationFrame(frame)}reelFrame=requestAnimationFrame(frame);
 drawTimer=setTimeout(()=>{pendingWinner=winner;state.rolling=false;state.spin={...state.spin,phase:'result'};$('modalTitle').textContent=`${fields[index]} 운명이 정해졌어요!`;$('modalSubtitle').textContent='시청자와 함께 결과를 확인해 보세요.';$('winner').innerHTML=`<span>♥ ${fields[index]} 당첨 결과 ♥</span><strong>${escapeHtml(winner.text)}</strong><small>${escapeHtml(viewerName(winner.name))}의 채팅</small>`;$('winner').classList.add('show');$('modalActions').classList.add('show');$('modalStatus').textContent='리롤하거나 이 결과를 확정해 주세요.';render()},duration);
}
function confirmResult(){if(!pendingWinner||pendingIndex<0||state.rolling)return;state.results[pendingIndex]=pendingWinner;state.status=`${fields[pendingIndex]} 결과를 확정했어요.`;pendingWinner=null;pendingIndex=-1;closeModal();render()}
function syncOverlayModal(){
 if(!isOverlay)return;const spin=state.spin,modal=state.modal;
 if(!spin&&modal?.phase==='collect'){
  const index=modal.index??state.active,pool=[...state.pools[index].values()];modalOpen=true;$('drawModal').classList.add('open');$('drawModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('modalKicker').textContent='CHAT COLLECTION';$('modalTitle').textContent=`${fields[index]} 후보를 모으는 중이에요`;$('modalSubtitle').textContent='시청자들의 채팅이 실시간으로 도착하고 있어요!';$('modalRoulette').classList.remove('show');$('winner').className='winner';$('winner').innerHTML='';$('modalActions').classList.remove('show');$('modalChat').style.display='block';$('countdown').parentElement.style.display='block';$('modalChat').replaceChildren(...(pool.length?candidateRows(pool,false):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':'채팅을 기다리고 있어요…'})]));$('modalChat').scrollTop=$('modalChat').scrollHeight;$('modalStatus').textContent=state.status;return
 }
 if(!spin){lastOverlaySpin='';modalOpen=false;$('drawModal').classList.remove('open');$('drawModal').setAttribute('aria-hidden','true');document.body.style.overflow='';return}
 modalOpen=true;$('drawModal').classList.add('open');$('drawModal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('modalKicker').textContent='DESTINY ROULETTE';$('modalTitle').textContent=spin.phase==='result'?`${fields[spin.index]} 운명이 정해졌어요!`:'두근두근, 운명을 고르는 중!';$('modalSubtitle').textContent=spin.phase==='result'?'시청자와 함께 결과를 확인해 보세요.':'어떤 채팅이 선택될까요?';$('modalChat').style.display='none';$('countdown').parentElement.style.display='none';$('modalRoulette').classList.add('show');$('modalActions').classList.remove('show');
 if(lastOverlaySpin!==spin.id){lastOverlaySpin=spin.id;cancelAnimationFrame(reelFrame);$('winner').className='winner';$('winner').innerHTML='';$('reelTrack').style.transform='';$('reelTrack').replaceChildren(...spin.entries.map(x=>{const d=document.createElement('div');d.className='reel-item';d.append(document.createTextNode(x.text));const n=document.createElement('small');n.textContent=viewerName(x.name);d.append(n);return d}));const elapsed=Math.max(0,Date.now()-spin.startedAt);const start=performance.now()-Math.min(elapsed,spin.duration);function frame(now){const t=Math.min(1,(now-start)/spin.duration),p=1-Math.pow(1-t,3),h=$('reelTrack').firstElementChild.offsetHeight;$('reelTrack').style.transform=`translateY(${-p*(spin.entries.length-1)*h}px)`;if(t<1&&state.spin?.id===spin.id)reelFrame=requestAnimationFrame(frame)}reelFrame=requestAnimationFrame(frame)}
 if(spin.phase==='result'){$('winner').innerHTML=`<span>♥ ${fields[spin.index]} 당첨 결과 ♥</span><strong>${escapeHtml(spin.winner.text)}</strong><small>${escapeHtml(viewerName(spin.winner.name))}의 채팅</small>`;$('winner').classList.add('show');$('modalStatus').textContent='컨트롤 화면에서 리롤 또는 확정을 선택해 주세요.'}else $('modalStatus').textContent='룰렛이 멈출 때까지 기다려 주세요.';
}
function escapeHtml(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}

function candidateRows(pool,removable=true){return pool.slice().reverse().map(x=>{const row=document.createElement('div');row.className='candidate';const d=document.createElement('div'),n=document.createElement('b'),p=document.createElement('p');n.textContent=x.name;p.textContent=x.text;d.append(n,p);row.append(d);if(removable){const del=document.createElement('button');del.textContent='×';del.disabled=state.connecting||state.collecting||state.rolling||isOverlay;del.onclick=()=>{state.pools[state.active].delete(x.id);state.results[state.active]=null;render()};row.append(del)}return row})}

function renderCards(busy){
 $('cards').replaceChildren(...fields.map((name,i)=>{
  const card=document.createElement('div'),enabled=state.enabled[i],result=state.results[i];card.className='card '+(enabled&&i===state.active?'active ':'')+(result?'done ':'')+(!enabled?'inactive':'');
  const toggle=document.createElement('label');toggle.className='condition-toggle card-toggle';toggle.title=enabled?'이번 환생에서 제외':'이번 환생에 포함';const check=document.createElement('input');check.type='checkbox';check.checked=enabled;check.disabled=busy||isOverlay;const slider=document.createElement('span');check.onchange=()=>{if(!check.checked&&state.enabled.filter(Boolean).length===1){check.checked=true;return toast('최소 한 개의 항목은 켜 두어야 해요.')}state.enabled[i]=check.checked;if(!check.checked&&state.active===i){const next=state.enabled.findIndex(Boolean);state.active=next<0?0:next}render()};toggle.append(check,slider);
  const num=document.createElement('span');num.className='num';num.textContent=String(i+1).padStart(2,'0');
  const info=document.createElement('div');info.className='card-info';const title=document.createElement('b');title.textContent=name;const value=document.createElement('div');value.className='value '+(!result?'pending':'');value.textContent=!enabled?'이번 환생에서 제외':result?.text||(i===state.active?'후보를 입력하고 등록해 주세요':'아직 정해지지 않았어요');if(result&&enabled){const n=document.createElement('small');n.textContent=viewerName(result.name);value.append(n)}info.append(title,value);if(!busy&&!isOverlay&&enabled)info.onclick=()=>{state.active=i;render()};
  const controls=document.createElement('div');controls.className='card-register setup-only';const input=document.createElement('input');input.className='manual-answer';input.placeholder='후보 하나 입력';input.maxLength=80;input.value=state.manualAnswers[i]||'';input.disabled=busy||!enabled;const register=document.createElement('button');register.type='button';register.className='answer-complete '+(state.manualConfirmed[i]?'confirmed':'');register.textContent=state.manualConfirmed[i]?'다시 등록':'등록';register.disabled=busy||!enabled||!input.value.trim();input.oninput=()=>{state.manualAnswers[i]=input.value;state.manualConfirmed[i]=false;register.textContent='등록';register.classList.remove('confirmed');register.disabled=!input.value.trim();publish()};register.onclick=()=>startCollection(i);controls.append(input,register);
  const mark=document.createElement('span');mark.className='card-mark';mark.textContent=!enabled?'OFF':result?'♥':i===state.active?'✦':'·';const manual=document.createElement('span');manual.className='manual-display';manual.textContent=state.manualConfirmed[i]&&state.manualAnswers[i]?`직접 답변 : ${state.manualAnswers[i]}`:'';
  card.append(toggle,num,info,controls,mark,manual);return card
 }));
}

function render(){
 const pool=[...state.pools[state.active].values()],result=state.results[state.active],enabledCount=state.enabled.filter(Boolean).length,done=state.results.filter((r,i)=>r&&state.enabled[i]).length,busy=state.checking||state.connecting||state.collecting||state.rolling;
 $('round').textContent='ROUND '+String(state.round).padStart(2,'0');$('streamerName').textContent=state.streamerName?state.streamerName+' 방송 연결됨':'방송 연결 대기';$('progress').textContent=done+' / '+enabledCount+' 완성';$('status').textContent=state.status;$('collectState').textContent=state.checking?'확인 중':state.connecting?'채팅 연결 중':state.collecting?'수집 중':state.rolling?'추첨 중':state.streamerName?'연결됨':'대기';
 $('openConnection').disabled=busy;$('openConnection').classList.toggle('connected',!!state.streamerName);$('connect').disabled=busy;$('connect').textContent=state.checking?'확인 중…':state.streamerName?'다시 연결':'방송 연결';$('connect').classList.toggle('connected',!!state.streamerName&&!busy);$('closeConnection').disabled=state.checking;$('cancelCollectionButton').classList.toggle('show',state.connecting||state.collecting);$('startRoulette').disabled=busy||!pool.length;$('modalReroll').disabled=state.rolling||!pool.length;$('confirmWinner').disabled=state.rolling||!pendingWinner;$('demo').disabled=busy;
 renderCards(busy);
 if(modalOpen&&!state.rolling){$('modalChat').replaceChildren(...(pool.length?candidateRows(pool,false):[Object.assign(document.createElement('p'),{textContent:state.connecting?'방송에 연결하고 있어요…':'채팅을 기다리고 있어요…'})]));$('modalChat').scrollTop=0}
 $('closeModal').disabled=busy;if(modalOpen&&!state.rolling&&!$('winner').classList.contains('show'))$('modalStatus').textContent=state.status;tick();publish();syncOverlayModal();
}
function tick(){const left=Math.max(0,Math.ceil((state.until-Date.now())/1000));if(state.collecting)$('collectState').textContent=`수집 중 · ${left}초`;if(modalOpen){$('modalSeconds').textContent=state.connecting?'…':String(left).padStart(2,'0');$('countdown').style.setProperty('--progress',state.collecting?left/30:1)}}

$('openConnection').onclick=openConnectionModal;$('closeConnection').onclick=closeConnectionModal;$('connectionBackdrop').onclick=closeConnectionModal;$('connect').onclick=connectBroadcast;$('streamer').addEventListener('input',()=>{if(state.streamerName){state.streamerName='';state.connectedStreamer='';state.status='주소가 바뀌었어요. 다시 방송에 연결해 주세요.';render()}});$('cancelCollectionButton').onclick=cancelActiveCollection;$('startRoulette').onclick=spin;$('modalReroll').onclick=spin;$('confirmWinner').onclick=confirmResult;$('resetAll').onclick=()=>reset(true);$('closeModal').onclick=closeModal;$('modalBackdrop').onclick=closeModal;
$('addConditionForm').onsubmit=event=>{event.preventDefault();const name=$('newCondition').value.trim();if(!name)return toast('추가할 항목 이름을 입력해 주세요.');if(fields.length>=30)return toast('항목은 최대 30개까지 추가할 수 있어요.');fields.push(name);state.results.push(null);state.pools.push(new Map());state.enabled.push(true);state.manualAnswers.push('');state.manualConfirmed.push(false);$('newCondition').value='';state.status=`'${name}' 항목을 추가했어요.`;render()};
$('demo').onclick=()=>{const i=state.active;state.pools[i].clear();const list=sample[i]||['행운 가득','평범하지만 행복','상상도 못한 결과'];list.forEach((text,j)=>state.pools[i].set('demo-'+i+'-'+j,{id:'demo-'+i+'-'+j,name:'테스트 '+(j+1),text}));const manual=state.manualAnswers[i].trim();if(manual&&state.manualConfirmed[i])state.pools[i].set('manual-'+i,{id:'manual-'+i,name:'직접 추가',text:manual});state.results[i]=null;state.status='테스트 후보가 준비됐어요. 룰렛 돌리기를 눌러 주세요.';showSpinReady(i)};
setInterval(tick,100);render();
