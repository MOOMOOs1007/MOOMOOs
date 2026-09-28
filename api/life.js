export const config={maxDuration:10};

function cleanConditions(value){
 if(!Array.isArray(value)||value.length<1||value.length>30)throw Error('완성된 환생 조건이 필요합니다.');
 return value.map(item=>({label:String(item?.label||'').trim().slice(0,30),value:String(item?.value||'').trim().slice(0,120)})).filter(item=>item.label&&item.value);
}

function hash(text){let h=2166136261;for(const ch of text){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
function random(seed){let n=seed||1;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function pick(list,rng){return list[Math.floor(rng()*list.length)]}
function escapeXml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]))}
function get(map,label,fallback){return map.get(label)||fallback}

function createStory(conditions,seed){
 const rng=random(seed),map=new Map(conditions.map(item=>[item.label,item.value]));
 const country=get(map,'나라',conditions[0].value),gender=get(map,'성별','비밀스러운 인물'),body=get(map,'외모/신체','한번 보면 잊기 힘든 인상');
 const family=get(map,'가정 환경','평범하지만 정 많은 집안'),wealth=get(map,'재산','필요할 때 묘하게 생기는 생활비');
 const talent=get(map,'재능','위기 때 빛나는 순발력'),personality=get(map,'성격','엉뚱하지만 다정한 성격'),job=get(map,'직업','세상에 하나뿐인 직업');
 const marriage=get(map,'결혼여부','인연은 운명에게 맡김'),event=get(map,'특별 이벤트','예상 밖의 대사건');
 const title=pick([`《${job}, 두 번째 생을 접수하다》`,`《${country}에서 시작된 기묘한 전설》`,`《운명이 너무 열심히 만든 사람》`,`《이번 생은 설정값부터 심상치 않다》`],rng);
 const openings=[`${country}의 어느 유난히 화창한 날, ${family}에서 한 아이가 태어났다. 사람들은 이 아이를 ${gender}이라고 불렀고, ${body} 덕분에 첫 등장부터 동네의 시선을 한몸에 받았다.`,`${country}에서 ${family}의 기대를 받으며 새로운 생이 시작됐다. 주인공은 ${gender}으로 태어나 ${body}라는 강렬한 첫인상을 남겼다.`];
 const childhood=[`어린 시절부터 ${talent}을 보였다. ${personality} 탓에 조용히 넘어가는 날은 드물었지만, 그 엉뚱한 사건들은 훗날 결정적인 경험이 되었다.`,`학교에 들어가자 ${talent}이 빠르게 드러났다. ${personality} 때문에 선생님은 매일 놀랐고 친구들은 매일 새로운 이야깃거리를 얻었다.`];
 const rise=[`성인이 된 뒤 선택한 길은 ${job}. 처음에는 모두가 고개를 갸웃했지만, 주인공은 ${talent}을 무기로 자기만의 방식을 만들어 냈다. 가진 재산은 '${wealth}'였으나 이상하게도 중요한 순간마다 필요한 것은 꼭 손에 들어왔다.`,`주인공은 마침내 ${job}의 세계에 뛰어들었다. ${wealth}라는 재정 상태는 모험에 긴장감을 더했고, ${talent}과 ${personality}은 아무도 흉내 내지 못할 필살기가 되었다.`];
 const climax=[`그러던 어느 날 '${event}'이 벌어졌다. 보통 사람이라면 도망쳤겠지만 주인공은 오히려 한복판으로 걸어 들어갔다. 황당할 만큼 대담한 선택은 위기를 전설로 바꾸었고, 그날 이후 이름을 모르는 사람이 없었다.`,`인생의 방향을 뒤집은 사건은 '${event}'이었다. 준비된 계획은 하나도 없었지만 ${talent}이 작동했고, 믿기 어려운 우연까지 편을 들며 사건은 통쾌하게 마무리됐다.`];
 const love=[`사랑과 결혼에 대한 운명은 '${marriage}'. 어떤 결말이든 곁에는 주인공의 별난 선택을 웃으며 받아 주는 사람들이 남았고, 함께한 시간은 재산보다 귀한 보물이 됐다.`,`관계의 결론은 '${marriage}'으로 기록됐다. 주인공은 인연의 모양을 억지로 정하지 않았고, 대신 마음이 맞는 사람들과 오래 웃는 쪽을 택했다.`];
 const endings=[`세월이 흐른 뒤 사람들은 이 삶을 성공이나 실패 한마디로 설명하지 못했다. ${country}에서 시작해 ${job}으로 이름을 남기고, ${event}까지 지나온 생은 그 자체로 완벽한 방송 한 편이었다. 마지막 장에는 이렇게 적혔다. “설정은 무작위였지만, 살아낸 방식은 주인공의 선택이었다.”`,`훗날 이 인생은 '${personality}'의 힘으로 운명을 웃겨 버린 이야기로 전해졌다. 시작 조건은 제멋대로였지만 모든 장면을 이어 붙이자 세상에 단 하나뿐인 멋진 일대기가 완성됐다.`];
 return [title,pick(openings,rng),pick(childhood,rng),pick(rise,rng),pick(climax,rng),pick(love,rng),pick(endings,rng)].join('\n\n');
}

function createImage(conditions,seed){
 const rng=random(seed^0xA5A5A5A5),palette=pick([['#ff8f83','#ffd5c9','#fff7e9'],['#ff9db5','#ffd2df','#fff7ec'],['#ff9d72','#ffe0b5','#fff8eb']],rng);
 const main=conditions.slice(0,6),cx=512,cy=390;
 const badges=main.map((item,index)=>{const angle=(Math.PI*2*index/main.length)-Math.PI/2,x=Math.round(cx+330*Math.cos(angle)),y=Math.round(cy+285*Math.sin(angle));return `<g transform="translate(${x-105} ${y-34})"><rect width="210" height="68" rx="28" fill="#fff" fill-opacity=".92" stroke="#fff" stroke-width="4"/><text x="105" y="27" text-anchor="middle" font-size="18" font-weight="700" fill="#a44b47">${escapeXml(item.label)}</text><text x="105" y="51" text-anchor="middle" font-size="16" fill="#5d4140">${escapeXml(item.value.slice(0,13))}</text></g>`}).join('');
 const stars=Array.from({length:26},()=>{const x=Math.round(rng()*980+22),y=Math.round(rng()*930+20),r=Math.round(rng()*6+2);return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${(.3+rng()*.6).toFixed(2)}"/>`}).join('');
 const initials=escapeXml(conditions[0].value.slice(0,2));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[0]}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#a84d48" flood-opacity=".22"/></filter></defs><rect width="1024" height="1024" rx="80" fill="url(#bg)"/>${stars}<circle cx="512" cy="405" r="215" fill="${palette[2]}" stroke="#fff" stroke-width="16" filter="url(#shadow)"/><circle cx="512" cy="342" r="82" fill="#ffd1b8"/><path d="M425 340c8-96 166-116 183 0-45-38-142-39-183 0" fill="#7c514c"/><path d="M365 600c22-128 273-128 295 0" fill="${palette[0]}"/><circle cx="482" cy="347" r="8" fill="#65413f"/><circle cx="542" cy="347" r="8" fill="#65413f"/><path d="M487 384q25 21 50 0" fill="none" stroke="#bf665f" stroke-width="8" stroke-linecap="round"/><text x="512" y="690" text-anchor="middle" font-size="58" font-weight="900" fill="#fff">환생 완료!</text><text x="512" y="750" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">${initials}의 새로운 인생</text>${badges}<text x="512" y="970" text-anchor="middle" font-size="20" fill="#fff" opacity=".85">FREE REBIRTH STORY CARD</text></svg>`;
 return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST만 지원합니다.'});}
 try{
  const conditions=cleanConditions(req.body?.conditions);if(!conditions.length)throw Error('완성된 환생 조건이 필요합니다.');
  const seed=hash(JSON.stringify(conditions))+Date.now();
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({story:createStory(conditions,seed),image:createImage(conditions,seed),mode:'free'});
 }catch(error){return res.status(400).json({error:error?.message||'무료 환생 일대기를 만들지 못했습니다.'});}
}
