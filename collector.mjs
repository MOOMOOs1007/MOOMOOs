import {spawn} from 'node:child_process';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
export function collect(streamer,onEvent){
 const token=randomBytes(32).toString('hex');
 let stopped=false,reported=false,child,authorized=false;
 const peers=new Set();
 const server=net.createServer(socket=>{
  if(stopped||authorized){socket.destroy();return;}
  peers.add(socket);let authed=false,buffer='';socket.setEncoding('utf8');socket.setTimeout(5000);
  socket.on('timeout',()=>socket.destroy());socket.on('error',()=>{});
  socket.on('close',()=>{peers.delete(socket);if(authed&&!stopped&&!reported)onEvent({type:'disconnected',message:'수집기 연결이 종료되었습니다. 다시 연결하세요.'});});
  socket.on('data',chunk=>{
   buffer+=chunk;if(buffer.length>1024*1024){socket.destroy();return;}
   let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);let e;try{e=JSON.parse(line);}catch{socket.destroy();return;}
    if(!authed){if(authorized||e.type!=='auth'||e.token!==token){socket.destroy();return;}authed=true;authorized=true;socket.setTimeout(0);clearTimeout(startup);server.close();continue;}
    if(stopped)return;
    if(['starting','connecting','entered','chat','error','disconnected','reconnecting'].includes(e.type)){reported=e.type==='error'||e.type==='disconnected';onEvent(e);}
   }
  });
 });
 const stop=()=>{if(stopped)return;stopped=true;clearTimeout(startup);for(const p of peers)p.destroy();server.close();child?.kill();};
 const startup=setTimeout(()=>{if(!authorized&&!stopped){onEvent({type:'error',message:'Java 수집기를 시작하지 못했습니다. runtime 폴더를 확인하세요.'});stop();}},15000);
 server.on('error',error=>{if(!stopped){onEvent({type:'error',message:'수집기 연결 준비 실패: '+error.message});stop();}});
 server.listen(0,'127.0.0.1',()=>{
  if(stopped){server.close();return;}
  const java=process.platform==='win32'?path.join(root,'runtime/bin/java.exe'):'java';
  try{child=spawn(java,['-Dfile.encoding=UTF-8','-cp',[path.join(root,'bridge'),path.join(root,'lib/*')].join(path.delimiter),'SoopBridge',streamer,String(server.address().port),token],{cwd:root,windowsHide:true,stdio:'ignore'});}
  catch(error){onEvent({type:'error',message:'Java 수집기 실행 실패: '+error.message});stop();return;}
  child.on('error',error=>{if(!stopped){onEvent({type:'error',message:'Java 수집기 실행 실패: '+error.message});stop();}});
  child.on('exit',code=>{if(!stopped){if(!reported)onEvent({type:'disconnected',message:'수집기 종료 (코드 '+code+'). 다시 연결하세요.'});stop();}});
 });
 return stop;
}
