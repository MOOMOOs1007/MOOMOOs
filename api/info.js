import {parseStreamer} from './protocol.js';

const LIVE_API='https://live.sooplive.com/afreeca/player_live_api.php';

async function getBroadcastInfo(streamer){
 const body=new URLSearchParams({bid:streamer,type:'live',pwd:'',player_type:'html5',stream_type:'common',quality:'HD',mode:'landing',from_api:'0',is_revive:'false'});
 const response=await fetch(`${LIVE_API}?bjid=${encodeURIComponent(streamer)}`,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'Mozilla/5.0 RebirthRoulette/1.0'},body,signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('SOOP 방송 정보를 불러오지 못했습니다.');
 const channel=(await response.json())?.CHANNEL;
 if(Number(channel?.RESULT)!==1)throw Error('현재 방송 중인 공개 방송을 찾지 못했습니다.');
 return {streamer,streamerName:String(channel.BJNICK||streamer).trim().slice(0,60)};
}

export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST만 지원합니다.'});}
 try{const streamer=parseStreamer(req.body?.streamer);return res.status(200).json(await getBroadcastInfo(streamer));}
 catch(error){return res.status(400).json({error:error?.message||'방송 정보를 확인하지 못했습니다.'});}
}
