const START='\x1b\x09', SEP='\x0c';
export function packet(code,payload){
 const size=Buffer.byteLength(payload,'utf8');
 return Buffer.from(START+String(code).padStart(4,'0')+String(size).padStart(6,'0')+'00'+payload,'utf8');
}
export const connectPacket=()=>packet(1,SEP.repeat(3)+'16'+SEP);
export const joinPacket=chatNo=>packet(2,SEP+chatNo+SEP.repeat(5));
export const pingPacket=()=>packet(0,SEP);
export function parsePacket(input){
 const data=Buffer.isBuffer(input)?input:Buffer.from(input);
 if(data.length<14||data[0]!==0x1b||data[1]!==0x09)return null;
 const code=Number(data.subarray(2,6).toString('ascii'));
 const size=Number(data.subarray(6,12).toString('ascii'));
 if(!Number.isInteger(code)||!Number.isInteger(size)||size<0||data.length<14+size)return null;
 return {code,parts:data.subarray(14,14+size).toString('utf8').split(SEP)};
}
export function parseStreamer(value){
 let id=String(value||'').trim();
 if(/^https?:\/\//i.test(id)){
  const url=new URL(id);
  if(!/(^|\.)(sooplive\.com|sooplive\.co\.kr|afreecatv\.com)$/i.test(url.hostname))throw Error('SOOP 방송 주소를 입력하세요.');
  id=url.pathname.split('/').filter(Boolean)[0]||'';
 }
 if(!/^[A-Za-z0-9_]{2,50}$/.test(id))throw Error('올바른 방송국 ID를 입력하세요.');
 return id;
}
