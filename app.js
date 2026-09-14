const $=id=>document.getElementById(id);
const overlay=new URLSearchParams(location.search).has('overlay');
if(overlay)document.body.classList.add('overlay');
let current,online=false,toastTimer,reelId=null,frame;
function toast(text){$('toast').textContent=text;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',5000);}
async function action(action,data={}){try{const r=await fetch('/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});const result=await r.json();if(!r.ok)throw Error(result.error);render(result);}catch(e){toast(e.message||'로컬 프로그램과 연결할 수 없습니다.');}}
function el(tag,cls,text){const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;}
function updateClock(){if(!current)return;const left=Math.max(0,Math.ceil((current.collectUntil-Date.now())/1000));$('countdown').textContent=current.collecting?left+'초 남음':current.rolling?'운명을 고르는 중…':'30초 수집 → 뽑기';$('collectionBadge').textContent=current.collecting?left+'초 남음':'수집 대기';$('collect').textContent=current.collecting?'채팅 수집 중 · '+left+'초':'채팅 수집 · 30초';}
function showReel(s){
 const spin=s.spin?.index===s.active?s.spin:null;
 $('roulette').classList.toggle('spinning',s.rolling&&!!spin);
 $('reelLabel').textContent=s.fields[s.active]+(s.rolling?' · 룰렛 추첨':s.results[s.active]?' · 선택된 운명':' · 채팅 룰렛');
 if(!spin){reelId=null;cancelAnimationFrame(frame);$('reelTrack').style.transform='';$('reelTrack').replaceChildren(el('div','reel-item',s.results[s.active]?.text||(s.collecting?'시청자의 운명을 모으고 있어요':'채팅을 모은 뒤 뽑기를 눌러주세요')));return;}
 if(reelId===spin.id)return;
 reelId=spin.id;cancelAnimationFrame(frame);
 $('reelTrack').replaceChildren(...spin.entries.map(item=>{const row=el('div','reel-item');row.append(el('strong','',item.text),el('small','',item.name));return row;}));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function animate(){if(reelId!==spin.id)return;const t=Math.max(0,Math.min(1,(Date.now()-spin.startedAt)/spin.duration));const progress=reduced?(t===1?1:0):1-Math.pow(1-t,3);const height=$('reelTrack').firstElementChild.getBoundingClientRect().height;$('reelTrack').style.transform=`translateY(${-progress*(spin.entries.length-1)*height}px)`;if(t<1)frame=requestAnimationFrame(animate);}
 animate();
}
function render(s){
 current=s;const busy=s.rolling||s.collecting,winner=s.results[s.active],items=s.pools[s.active]||[],count=s.counts[s.active],done=s.results.filter(Boolean).length;
 $('badge').textContent=s.demo?'TEST MODE':s.connected?'LIVE CHAT':'OFFLINE';$('dot').classList.toggle('on',s.connected);$('status').textContent=s.status;
 $('received').textContent='실제 채팅 수신 '+s.received+'건'+(s.lastReceived?' · 마지막 '+new Date(s.lastReceived).toLocaleTimeString('ko-KR'):'');
 $('round').textContent='/ ROUND '+String(s.round).padStart(2,'0');$('progress').textContent=done+' / 5 확정';$('notice').textContent=s.notice;
 $('next').textContent=s.fields[s.active]+' · '+(s.collecting?'30초 수집 중':s.rolling?'추첨 중':winner?'추첨 완료':'추첨 준비');
 $('mode').value=s.mode;$('mode').disabled=busy;
 $('rule').textContent=s.mode==='tagged'?'예: !'+s.fields[s.active].replaceAll(' ','')+' 원하는 답변 · 현재 항목만 수집':'30초 동안 현재 항목에 수집 · 1인 1후보 · 마지막 답변 반영';
 $('count').textContent=count;$('draw').disabled=!online||busy||!count||!!winner;$('draw').textContent=s.rolling?'룰렛 추첨 중…':'✦ '+s.fields[s.active]+' 뽑기';
 $('reroll').disabled=!online||busy||!count||!winner;
 $('collect').disabled=!online||busy||!s.connected;
 const next=s.fields.findIndex((_,i)=>i>s.active&&!s.results[i]);const fallback=s.results.findIndex((r,i)=>!r&&i!==s.active);const nextIndex=next<0?fallback:next;
 $('nextField').disabled=busy||nextIndex<0;$('nextField').onclick=()=>action('select',{index:nextIndex});
 $('cards').replaceChildren(...s.fields.map((field,i)=>{const result=s.results[i],card=el('button','card'+(i===s.active?' active':'')+(result?' done':''));card.disabled=overlay||busy;card.onclick=()=>action('select',{index:i});card.append(el('span','num',String(i+1).padStart(2,'0')),el('span','label',field));const content=el('div');content.append(el('div','value'+(!result?' pending':''),result?result.text:i===s.active?(s.collecting?'채팅을 모으고 있어요':s.rolling?'룰렛이 돌아가고 있어요':'채팅 수집을 시작해 주세요'):'아직 정해지지 않았어요'));if(result)content.append(el('div','author',result.name+' 님의 운명'));card.append(content,el('span','arrow',result?'✓':i===s.active?'↗':'—'));return card;}));
 $('candidates').replaceChildren(...(items.length?items.slice().reverse().map(item=>{const row=el('div','candidate'),text=el('div');text.append(el('strong','',item.name),el('p','',item.text));const remove=el('button','','×');remove.title='후보 제외';remove.setAttribute('aria-label',item.text+' 후보 제외');remove.disabled=busy;remove.onclick=()=>action('remove',{id:item.id});row.append(text,remove);return row;}):[el('div','empty',s.collecting?'채팅을 기다리고 있습니다.':'채팅 수집 버튼을 눌러\n30초 동안 후보를 모아주세요.')]));
 for(const id of ['clear','demo','connect'])$(id).disabled=busy;
 $('resetAll').disabled=!online;$('reset').disabled=!online;
 showReel(s);updateClock();
}
$('connectForm').onsubmit=e=>{e.preventDefault();action('connect',{id:$('streamer').value});};
$('disconnect').onclick=()=>action('disconnect');$('draw').onclick=()=>action('draw');$('reroll').onclick=()=>action('reroll');$('collect').onclick=()=>action('collect');
$('mode').onchange=e=>{if(confirm('수집 방식을 바꾸면 모인 후보가 비워집니다. 계속할까요?'))action('mode',{mode:e.target.value});else e.target.value=current.mode;};
$('clear').onclick=()=>{if(confirm('현재 항목의 후보를 모두 비울까요?'))action('clear');};
$('demo').onclick=()=>{if(confirm('연결과 결과를 초기화하고 테스트 후보를 넣을까요?'))action('demo');};
$('reset').onclick=()=>action('reset');$('resetAll').onclick=()=>action('resetAll');
setInterval(updateClock,100);
if(location.protocol==='file:'){$('status').textContent='실행.cmd를 먼저 실행한 뒤 http://127.0.0.1:3210 으로 접속하세요.';for(const id of ['draw','reroll','collect','resetAll'])$(id).disabled=true;}
else{const events=new EventSource('/events');events.onmessage=e=>{online=true;render(JSON.parse(e.data));};events.onerror=()=>{online=false;$('status').textContent='로컬 프로그램 연결 끊김 · 자동 재연결 대기';$('badge').textContent='서버 연결 끊김';for(const id of ['draw','reroll','collect','resetAll','reset'])$(id).disabled=true;};}
