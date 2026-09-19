import WebSocket from 'ws';
import {connectPacket,joinPacket,parsePacket,parseStreamer} from './protocol.js';
export const config={maxDuration:45};
const LIVE_API='https://live.sooplive.com/afreeca/player_live_api.php';
function send(res,data){if(!res.writableEnded)res.write(JSON.stringify(data)+'\n');}
async function discover(streamer){
 const body=new URLSearchParams({bid:streamer,type:'live',pwd:'',player_type:'html5',stream_type:'common',quality:'HD',mode:'landing',from_api:'0',is_revive:'false'});
 const response=await fetch(`${LIVE_API}?bjid=${encodeURIComponent(streamer)}`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'Mozilla/5.0 RebirthRoulette/1.0'},body,signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('SOOP 방송 정보를 불러오지 못했습니다.');
 const channel=(await response.json())?.CHANNEL;
 if(Number(channel?.RESULT)!==1)throw Error('현재 방송 중인 공개 방송을 찾지 못했습니다.');
 const domain=String(channel.CHDOMAIN||'');const port=Number(channel.CHPT)+1;const chatNo=String(channel.CHATNO||'');
 if(!/^[a-z0-9.-]+$/i.test(domain)||!/(^|\.)(sooplive\.com|sooplive\.co\.kr|afreecatv\.com)$/i.test(domain))throw Error('채팅 서버 주소가 올바르지 않습니다.');
 if(!Number.isInteger(port)||port<1||port>65535||!/^\d+$/.test(chatNo))throw Error('채팅방 정보가 올바르지 않습니다.');
 return {domain,port,chatNo};
}
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST만 지원합니다.'});}
 res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');res.setHeader('Cache-Control','no-cache, no-store');res.setHeader('X-Accel-Buffering','no');res.flushHeaders?.();
 let socket,deadline,collectionTimer,finished=false,entered=false;
 const finish=(type,message)=>{if(finished)return;finished=true;clearTimeout(deadline);clearTimeout(collectionTimer);send(res,{type,message});try{socket?.close();}catch{}res.end();};
 req.on('aborted',()=>{if(!res.writableEnded){finished=true;clearTimeout(deadline);clearTimeout(collectionTimer);try{socket?.close();}catch{}}});
 res.on('close',()=>{if(!res.writableEnded){finished=true;clearTimeout(deadline);clearTimeout(collectionTimer);try{socket?.close();}catch{}}});
 try{
  const streamer=parseStreamer(req.body?.streamer);send(res,{type:'status',message:'방송 정보 확인 중…'});
  const {domain,port,chatNo}=await discover(streamer);if(finished)return;
  socket=new WebSocket(`wss://${domain}:${port}/Websocket/${streamer}`,'chat',{handshakeTimeout:10000,perMessageDeflate:false});
  deadline=setTimeout(()=>finish('error','채팅방 입장 시간이 초과되었습니다.'),15000);
  socket.on('open',()=>{send(res,{type:'status',message:'채팅 서버 연결됨 · 입장 확인 중…'});socket.send(connectPacket());});
  socket.on('message',data=>{const p=parsePacket(data);if(!p)return;
   if(p.code===1){socket.send(joinPacket(chatNo));return;}
   if(p.code===2&&!entered){entered=true;clearTimeout(deadline);send(res,{type:'entered',streamer,duration:30,message:'채팅 수집 시작 · 30초'});collectionTimer=setTimeout(()=>finish('done','30초 채팅 수집 완료'),30000);return;}
   if(p.code===5&&entered&&p.parts.length>=7){const text=String(p.parts[1]||'').replace(/[\x00-\x1f]/g,' ').trim();const id=String(p.parts[2]||'').replace(/\(\d+\)$/,'').trim();const name=String(p.parts[6]||'시청자').trim().slice(0,40);if(id&&text&&[...text].length<=80)send(res,{type:'chat',id,name,text});}
   if(p.code===3)finish('error','SOOP 채팅 서버가 연결을 종료했습니다.');
  });
  socket.on('error',error=>finish('error','채팅 연결 오류: '+error.message));
  socket.on('close',()=>{if(!finished)finish('error',entered?'수집 중 채팅 연결이 끊겼습니다.':'채팅방에 입장하지 못했습니다.');});
 }catch(error){finish('error',error?.message||'채팅 수집을 시작하지 못했습니다.');}
}
