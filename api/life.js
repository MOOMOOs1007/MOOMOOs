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
 const rng=random(seed^0xA5A5A5A5),map=new Map(conditions.map(item=>[item.label,item.value]));
 const country=get(map,'나라','환상의 나라'),gender=get(map,'성별',''),look=get(map,'외모/신체',''),job=get(map,'직업','모험가');
 const c=country.toLowerCase(),g=gender.toLowerCase(),l=look.toLowerCase(),j=job.toLowerCase();
 const palette=pick([['#ff8f83','#ffd8cf','#fff7e9'],['#f58fb0','#ffd4e1','#fff8ef'],['#ff9d72','#ffe0b5','#fff9ea']],rng);
 const hair=pick(['#49332f','#6c4437','#352f44','#9a603d','#d99a49'],rng),skin=pick(['#ffd8bf','#f4c7a7','#e7ad87','#bb7b5c'],rng);
 const isWoman=/여|여자|여성|woman|female|공주|소녀/.test(g),isMan=/남|남자|남성|man|male|왕자|소년/.test(g);
 const glasses=/안경|glasses/.test(l),bald=/대머리|민머리|bald/.test(l),muscular=/근육|우락부락|muscular/.test(l),chubby=/통통|뚱|chubby/.test(l),animal=/고양이|토끼|강아지|수인/.test(l);
 const clouds=`<g fill="#fff" opacity=".72"><ellipse cx="150" cy="185" rx="92" ry="35"/><ellipse cx="835" cy="135" rx="115" ry="42"/><circle cx="105" cy="165" r="38"/><circle cx="790" cy="112" r="44"/></g>`;
 let landmark='';
 if(/한국|대한민국|korea/.test(c))landmark=`<g transform="translate(90 430)"><path d="M0 130h310v150H0z" fill="#f7e7ce"/><path d="M-35 130h380L270 55H40z" fill="#405c68"/><path d="M25 130h260" stroke="#e16e62" stroke-width="18"/><rect x="120" y="175" width="72" height="105" rx="6" fill="#8b4b3f"/><circle cx="156" cy="228" r="28" fill="#f2c95c"/></g><path d="M650 570q105-230 260 0" fill="#78aa96"/><path d="M690 570q75-165 165 0" fill="#91c2a8"/>`;
 else if(/일본|japan/.test(c))landmark=`<g transform="translate(80 410)" fill="none" stroke="#d64d59" stroke-width="28"><path d="M30 40h280M70 40v240M270 40v240M50 100h240"/></g><g fill="#f8a9bd">${Array.from({length:18},()=>`<circle cx="${Math.round(rng()*900+60)}" cy="${Math.round(rng()*430+100)}" r="${Math.round(rng()*9+5)}"/>`).join('')}</g>`;
 else if(/프랑스|france|파리/.test(c))landmark=`<g transform="translate(90 300)" fill="none" stroke="#667080" stroke-width="18"><path d="M160 0L35 320M160 0l125 320M75 225h170M42 320h236M125 105h70"/></g>`;
 else if(/미국|usa|america|뉴욕/.test(c))landmark=`<g transform="translate(35 330)"><path d="M0 280V120h75v160M80 280V40h95v240M180 280V150h80v130M265 280V80h105v200" fill="#8293b0"/><path d="M127 40V0" stroke="#8293b0" stroke-width="14"/></g>`;
 else if(/중국|china/.test(c))landmark=`<g transform="translate(65 365)"><path d="M20 245h330v35H20zM55 190h260v55H55zM85 125h200v65H85zM120 60h130v65H120z" fill="#dd5b55"/><path d="M35 190h300l-35-35H70zM65 125h240l-30-32H95zM100 60h170L235 28h-100z" fill="#405864"/></g>`;
 else if(/영국|england|uk|런던/.test(c))landmark=`<g transform="translate(95 300)"><rect x="45" y="35" width="150" height="315" fill="#806e7f"/><path d="M35 35h170L120 0z" fill="#5a5264"/><circle cx="120" cy="115" r="42" fill="#fff6df" stroke="#544c5d" stroke-width="10"/><path d="M120 115l0-26M120 115l22 12" stroke="#544c5d" stroke-width="7"/></g>`;
 else if(/이집트|egypt/.test(c))landmark=`<path d="M35 650L210 300l180 350z" fill="#e7b765"/><path d="M205 650L395 380l205 270z" fill="#f2ca7f"/><circle cx="820" cy="150" r="80" fill="#ffe29a"/>`;
 else if(/우주|화성|달|space|mars|moon/.test(c))landmark=`<g fill="#fff" opacity=".8">${Array.from({length:35},()=>`<circle cx="${Math.round(rng()*960+30)}" cy="${Math.round(rng()*600+30)}" r="${Math.round(rng()*5+2)}"/>`).join('')}</g><circle cx="180" cy="180" r="95" fill="#ffe2a5"/><path d="M735 190c100-80 205-15 210 70-115 55-220 20-210-70z" fill="#8ac7d5"/><path d="M705 240q150 55 270-25" fill="none" stroke="#f8d4a6" stroke-width="18"/>`;
 else landmark=`<path d="M0 610Q150 430 300 610T600 610T1024 610V760H0z" fill="#91c9a5"/><g fill="#fff" opacity=".75"><circle cx="155" cy="210" r="55"/><circle cx="220" cy="205" r="75"/><circle cx="285" cy="220" r="48"/></g>`;
 let jobOutfit='',prop='';
 if(/의사|간호|doctor|nurse/.test(j)){jobOutfit='#fff';prop=`<rect x="594" y="590" width="18" height="95" rx="9" fill="#e95d67"/><path d="M555 628h96M603 580v96" stroke="#e95d67" stroke-width="14"/>`}
 else if(/요리|셰프|chef/.test(j)){jobOutfit='#fff7e8';prop=`<path d="M430 340q-25-65 35-65 45-55 92 0 70 0 45 65z" fill="#fff" stroke="#e4d7c8" stroke-width="8"/><circle cx="635" cy="670" r="48" fill="#555"/><path d="M674 697l70 55" stroke="#555" stroke-width="22" stroke-linecap="round"/>`}
 else if(/우주|astronaut/.test(j)){jobOutfit='#eef5ff';prop=`<circle cx="512" cy="438" r="178" fill="none" stroke="#d7e8f6" stroke-width="30"/><rect x="600" y="600" width="70" height="100" rx="20" fill="#8abbd0"/>`}
 else if(/해적|pirate/.test(j)){jobOutfit='#8a3744';prop=`<path d="M398 312q114-90 228 0l-35 38H430z" fill="#3c3340"/><circle cx="512" cy="317" r="26" fill="#fff"/><path d="M494 299l36 36M530 299l-36 36" stroke="#3c3340" stroke-width="9"/><path d="M670 630q80 45 15 150" fill="none" stroke="#e1b75e" stroke-width="16"/>`}
 else if(/마법|wizard|마녀/.test(j)){jobOutfit='#6e54a4';prop=`<path d="M405 330h215L525 155z" fill="#5d478e"/><path d="M610 655l105-120" stroke="#765132" stroke-width="16"/><path d="M718 527l15 32 35 5-26 25 7 35-31-17-32 17 7-35-25-25 35-5z" fill="#ffe383"/>`}
 else if(/프로그래머|개발자|programmer/.test(j)){jobOutfit='#6d7ea8';prop=`<rect x="570" y="625" width="180" height="105" rx="12" fill="#49556c"/><path d="M570 730h180" stroke="#c9d8ef" stroke-width="14"/><text x="660" y="690" text-anchor="middle" font-size="42" fill="#9fe2cb">&lt;/&gt;</text>`}
 else if(/교사|선생|teacher/.test(j)){jobOutfit='#e3a65f';prop=`<path d="M610 610h125v150H610z" fill="#df6f6a"/><path d="M625 628h95" stroke="#fff1d6" stroke-width="8"/><path d="M625 650h70" stroke="#fff1d6" stroke-width="8"/>`}
 else if(/가수|아이돌|방송|streamer|idol/.test(j)){jobOutfit='#f17fab';prop=`<circle cx="690" cy="615" r="34" fill="#596073"/><path d="M670 640l-45 105" stroke="#596073" stroke-width="22" stroke-linecap="round"/><path d="M365 580l-18-40 38 18 25-35 8 42" fill="#ffe082"/>`}
 else if(/왕|여왕|king|queen/.test(j)){jobOutfit='#7e59a6';prop=`<path d="M420 305l25-85 67 60 67-60 25 85z" fill="#ffd45e" stroke="#fff0a0" stroke-width="8"/><circle cx="512" cy="264" r="14" fill="#ef6b6b"/>`}
 else {jobOutfit=palette[0];prop=`<rect x="625" y="625" width="115" height="90" rx="18" fill="#8c6655"/><path d="M655 625v-24h55v24" fill="none" stroke="#8c6655" stroke-width="14"/>`}
 const bodyWidth=chubby?300:muscular?330:250,longHair=isWoman&&!bald,shortHair=!isWoman&&!bald;
 const ears=animal?`<path d="M402 320l20-85 70 78M622 320l-20-85-70 78" fill="${hair}" stroke="#fff" stroke-width="8"/>`:'';
 const hairBack=longHair?`<ellipse cx="512" cy="430" rx="150" ry="185" fill="${hair}"/>`:'';
 const hairFront=bald?'':shortHair?`<path d="M392 385q20-175 120-168 112-4 124 168-48-58-93-69-64 65-151 69z" fill="${hair}"/>`:`<path d="M382 405q5-190 130-188 132 0 132 188-42-63-91-92-78 78-171 92z" fill="${hair}"/>`;
 const glassesSvg=glasses?`<g fill="none" stroke="#594a51" stroke-width="12"><circle cx="458" cy="418" r="43"/><circle cx="566" cy="418" r="43"/><path d="M501 418h22"/></g>`:'';
 const labelCountry=escapeXml(country.slice(0,16)),labelJob=escapeXml(job.slice(0,18));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#6f4545" flood-opacity=".25"/></filter></defs><rect width="1024" height="1024" rx="72" fill="url(#sky)"/>${clouds}${landmark}<path d="M0 735q250-65 512 0t512 0v289H0z" fill="${palette[0]}" opacity=".72"/><g filter="url(#shadow)">${ears}${hairBack}<ellipse cx="512" cy="705" rx="${bodyWidth/2}" ry="178" fill="${jobOutfit}" stroke="#fff" stroke-width="14"/><path d="M410 680q-95 40-105 125M614 680q95 40 105 125" fill="none" stroke="${skin}" stroke-width="58" stroke-linecap="round"/><ellipse cx="512" cy="420" rx="132" ry="145" fill="${skin}" stroke="#fff" stroke-width="14"/>${hairFront}<ellipse cx="458" cy="424" rx="17" ry="25" fill="#483b45"/><ellipse cx="566" cy="424" rx="17" ry="25" fill="#483b45"/><circle cx="452" cy="415" r="6" fill="#fff"/><circle cx="560" cy="415" r="6" fill="#fff"/>${glassesSvg}<ellipse cx="415" cy="475" rx="25" ry="13" fill="#ef8f91" opacity=".55"/><ellipse cx="609" cy="475" rx="25" ry="13" fill="#ef8f91" opacity=".55"/><path d="M474 482q38 42 76 0" fill="#fff" stroke="#b85e68" stroke-width="9" stroke-linejoin="round"/>${prop}</g><g transform="translate(92 820)"><rect width="840" height="136" rx="48" fill="#fff" fill-opacity=".92"/><text x="420" y="54" text-anchor="middle" font-size="28" font-weight="800" fill="#a75151">${labelCountry}에서 다시 태어난</text><text x="420" y="101" text-anchor="middle" font-size="42" font-weight="900" fill="#523f46">SD ${labelJob}</text></g></svg>`;
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
