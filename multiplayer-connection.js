// Connection protocol is independent from cosmetic/game build numbers.
// Only a validated hello -> welcome -> ready exchange opens the data channel.
export const PROTOCOL='harvestao-world-2';
export const BUILD='0.31.0';
const PEER_URL='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
const ROOM=/^HV[A-F0-9]{6}$/;
const ID=/^[a-zA-Z0-9_-]{8,80}$/;
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const nonce=()=>globalThis.crypto?.randomUUID?.()||'hv_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
let peerLibrary;
function loadPeer(){
 if(typeof globalThis.Peer==='function')return Promise.resolve(globalThis.Peer);
 if(peerLibrary)return peerLibrary;
 peerLibrary=new Promise((resolve,reject)=>{
  const script=document.createElement('script');let done=false;
  script.src=PEER_URL;script.async=true;script.crossOrigin='anonymous';script.dataset.harvestaoPeer='1.5.5';
  const finish=error=>{if(done)return;done=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();peerLibrary=null;reject(error)}else resolve(globalThis.Peer)};
  const timer=setTimeout(()=>finish(new Error('Biblioteca de conexão demorou para carregar. Confira a internet e tente novamente.')),20000);
  script.onload=()=>finish(typeof globalThis.Peer==='function'?null:new Error('A biblioteca de conexão não pôde iniciar.'));
  script.onerror=()=>finish(new Error('Não foi possível baixar a biblioteca de conexão. Confira a internet.'));
  document.head.append(script);
 });return peerLibrary;
}
// Session storage separates two players opened in different tabs on the same PC.
function identity(){try{let id=sessionStorage.getItem('harvestao-coop-identity');if(!ID.test(id||'')){id=nonce();sessionStorage.setItem('harvestao-coop-identity',id)}return id}catch{return nonce()}}
function errorMessage(type){return ({'peer-unavailable':'Sala não encontrada. Confira o código e mantenha o jogo do dono aberto.','unavailable-id':'Este código já está em uso. Crie outra sala.','network':'O servidor de salas está temporariamente sem conexão.','server-error':'O servidor de salas não respondeu. Tente novamente.','socket-error':'Não foi possível falar com o servidor de salas.','socket-closed':'A conexão com o servidor de salas foi interrompida.','browser-incompatible':'Este navegador não oferece a conexão necessária. Use um navegador atualizado.','webrtc':'A conexão direta entre os aparelhos falhou. Tente outra rede; algumas redes precisam de um servidor de retransmissão.','ssl-unavailable':'É necessário abrir o jogo pelo endereço seguro HTTPS.','invalid-id':'O código da sala não é válido.'})[type]||'Não foi possível estabelecer a conexão. Confira a internet e tente novamente.'}
export function createMultiplayerConnection({onStatus=()=>{},onRole=()=>{},onHello=()=>null,onWelcome=()=>{},onPacket=()=>{},onRemote=()=>{},onClose=()=>{},hello=()=>null,onReady=()=>{}}={}){
 const selfId=identity();let role='solo',room='',peer=null,channel=null,remoteId=null,remoteBuild=null,ready=false,phase='solo',epoch=0,session=null,helloNonce=null;
 let lastSeen=0,openAt=0,startedAt=0,retryCount=0,retryTimer=null,destroyed=false,pendingResolve=null,latestWelcome=null,handshakeActive=0;
 let lastTimer=Date.now(),lastHeartbeat=0,lastPose=0;
 function status(message,next=phase){phase=next;onStatus(message,{phase,code:room,role,ready,remoteId,build:remoteBuild})}
 function setRole(next){if(role!==next){role=next;onRole(role)}}
 function settle(value){const resolve=pendingResolve;pendingResolve=null;resolve?.(value)}
 function raw(packet,c=channel){
  if(!c?.open)return false;
  try{
   const data={...packet,protocol:PROTOCOL,build:BUILD};if(session&&!Object.hasOwn(data,'session'))data.session=session;
   const json=JSON.stringify(data);if(json.length>1500000)return false;
   // JSON data channels do not inherit PeerJS's binary-message chunker.
   // Small explicit chunks keep complete farms below browser message limits.
   if(json.length<=24000)c.send(data);
   else{const id=nonce(),total=Math.ceil(json.length/12000);for(let index=0;index<total;index++)c.send({type:'_chunk',protocol:PROTOCOL,id,index,total,part:json.slice(index*12000,(index+1)*12000)})}
   return true;
  }catch{return false}
 }
 function connectionIs(c,myEpoch){return !destroyed&&channel===c&&epoch===myEpoch}
 function closeChannel(reason='A conexão foi encerrada.',notify=true,delay=0){
  const old=channel,oldRemote=remoteId;channel=null;ready=false;session=null;latestWelcome=null;helloNonce=null;remoteId=null;remoteBuild=null;handshakeActive=0;
  if(delay)setTimeout(()=>{try{old?.close()}catch{}},delay);else try{old?.close()}catch{}settle(false);
  if(notify){onRemote(null);onClose({role,reason,remoteId:oldRemote});if(role==='host')status(reason+' A sala '+room+' continua aberta.','waiting');else if(role==='guest')status(reason+' Use Reconectar ou saia para voltar à sua fazenda.','disconnected')}
 }
 function refuse(c,message,reason='busy'){
  const reject=()=>{try{c.send({type:'reject',protocol:PROTOCOL,build:BUILD,reason,message})}catch{}setTimeout(()=>{try{c.close()}catch{}},150)};
  if(c.open)reject();else c.on('open',reject);
 }
 function markReady(){ready=true;lastSeen=Date.now();handshakeActive=0;status(role==='host'?'Visitante conectado · sala '+room:'Conectado à fazenda do dono','connected');settle(true);onReady({role,remoteId,build:remoteBuild})}
 function bind(c,isHost,myEpoch){
  if(destroyed||myEpoch!==epoch||channel){refuse(c,'Esta fazenda já está recebendo outro visitante.','busy');return}
  channel=c;session=null;ready=false;remoteId=null;remoteBuild=null;latestWelcome=null;handshakeActive=0;lastSeen=openAt=Date.now();phase=isHost?'awaiting-hello':'connecting';
  const onOpen=()=>{
   if(!connectionIs(c,myEpoch))return;openAt=lastSeen=Date.now();handshakeActive=0;
   if(isHost)status('Validando o visitante…','awaiting-hello');
   else{helloNonce=nonce();status('Sincronizando com o dono…','awaiting-welcome');let extra=null;try{extra=hello()}catch{}raw({type:'hello',selfId,nonce:helloNonce,hello:extra})}
  };
  c.on('open',onOpen);if(c.open)queueMicrotask(onOpen);
  const chunks=new Map();
  c.on('data',async data=>{
   if(!connectionIs(c,myEpoch)||!record(data)||typeof data.type!=='string')return;
   if(data.type==='_chunk'){
    if(data.protocol!==PROTOCOL||!ID.test(data.id||'')||!Number.isInteger(data.total)||data.total<1||data.total>125||!Number.isInteger(data.index)||data.index<0||data.index>=data.total||typeof data.part!=='string'||data.part.length>12000)return;
    const now=Date.now();for(const [id,entry]of chunks)if(now-entry.at>15000)chunks.delete(id);
    let entry=chunks.get(data.id);if(!entry){if(chunks.size>=4)return;entry={total:data.total,parts:Array(data.total).fill(null),count:0,at:now};chunks.set(data.id,entry)}
    if(entry.total!==data.total){chunks.delete(data.id);return}
    if(entry.parts[data.index]===null){entry.parts[data.index]=data.part;entry.count++}
    if(entry.count!==entry.total)return;chunks.delete(data.id);
    try{data=JSON.parse(entry.parts.join(''))}catch{return}
    if(!record(data)||typeof data.type!=='string')return;
   }
   // Legacy/unknown packets cannot eject an already compatible session.
   if(data.type==='hello'&&isHost&&!ready&&data.protocol!==PROTOCOL){refuse(c,'Protocolo incompatível. Abram os dois aparelhos pelo link atualizado do jogo.','protocol');closeChannel('O visitante precisa abrir o link atualizado.',false,180);status('O visitante usa um protocolo incompatível. A sala continua aberta.','waiting');return}
   if(data.protocol!==PROTOCOL)return;
   if(data.type==='reject'&&!ready&&!isHost){const msg=typeof data.message==='string'?data.message.slice(0,240):'Não foi possível entrar nesta sala.';closeChannel(msg);return}
   if(isHost&&data.type==='hello'&&!ready){
    if(!ID.test(data.selfId||'')||!ID.test(data.nonce||''))return;
    if(phase==='awaiting-ready'&&data.selfId===remoteId&&data.nonce===helloNonce){raw(latestWelcome);return}
    if(phase!=='awaiting-hello')return;
    helloNonce=data.nonce;remoteId=data.selfId;remoteBuild=String(data.build||'').slice(0,32);session=nonce();
    let payload;try{payload=onHello({selfId:remoteId,build:remoteBuild,hello:data.hello})}catch{closeChannel('Não foi possível preparar esta visita.');return}
    if(payload&&typeof payload.then==='function'){closeChannel('O dono não conseguiu preparar a visita.');return}
    latestWelcome={type:'welcome',selfId,session,replyTo:helloNonce,payload};status('Enviando a fazenda ao visitante…','awaiting-ready');raw(latestWelcome);return;
   }
   if(!isHost&&data.type==='welcome'&&!ready&&phase==='awaiting-welcome'){
    if(data.replyTo!==helloNonce||!ID.test(data.selfId||'')||!ID.test(data.session||''))return;
    remoteId=data.selfId;remoteBuild=String(data.build||'').slice(0,32);session=data.session;status('Abrindo a fazenda compartilhada…','applying-welcome');
    try{const applied=await onWelcome(data.payload,{remoteId,build:remoteBuild});if(applied===false)throw Error('Snapshot rejeitado');if(!connectionIs(c,myEpoch))return;if(!raw({type:'ready',session}))throw Error('Conexão fechada');markReady()}catch{if(connectionIs(c,myEpoch))closeChannel('Não foi possível sincronizar a fazenda. Seu progresso pessoal foi preservado.')}return;
   }
   if(isHost&&data.type==='ready'&&!ready&&phase==='awaiting-ready'&&data.session===session){markReady();return}
   if(!ready||data.session!==session)return;
   lastSeen=Date.now();
   if(data.type==='ping'){raw({type:'pong',at:data.at});return}
   if(data.type==='pong')return;
   if(data.type==='pose'){onRemote(data.pose);return}
   if(['hello','welcome','ready','reject'].includes(data.type))return;
   onPacket(data);
  });
  c.on('close',()=>{if(connectionIs(c,myEpoch))closeChannel('A conexão com o outro aparelho foi encerrada.')});
  c.on('error',()=>{if(connectionIs(c,myEpoch))closeChannel('A conexão direta entre os aparelhos falhou.')});
 }
 function scheduleReconnect(p,myEpoch){
  if(retryTimer||retryCount>=3||destroyed||peer!==p||epoch!==myEpoch)return;
  retryTimer=setTimeout(()=>{retryTimer=null;if(peer!==p||epoch!==myEpoch||p.destroyed||!p.disconnected)return;retryCount++;try{p.reconnect()}catch{}if(p.disconnected)scheduleReconnect(p,myEpoch)},1000+retryCount*2500);
 }
 async function start(isHost,input=''){
  if(destroyed)return null;
  const code=isHost?'HV'+nonce().replace(/[^a-f0-9]/gi,'').slice(0,6).toUpperCase():String(input).trim().toUpperCase().replace(/[\s-]/g,'');
  if(!ROOM.test(code)){status('Digite HV seguido dos seis caracteres do código da sala.');return null}
  if(role!=='solo')leave();
  const myEpoch=++epoch;status('Preparando conexão…','loading');
  let PeerConstructor;try{PeerConstructor=await loadPeer()}catch(error){if(epoch===myEpoch)status(error.message,'error');return null}
  if(epoch!==myEpoch||destroyed)return null;
  room=code;startedAt=lastSeen=Date.now();retryCount=0;handshakeActive=0;setRole(isHost?'host':'guest');status(isHost?'Abrindo sua sala…':'Procurando a sala…','opening');
  const result=new Promise(resolve=>{pendingResolve=resolve});
  try{
   const p=new PeerConstructor(isHost?'harvestao-world2-'+room:undefined,{debug:0});peer=p;
   p.on('open',()=>{
    if(peer!==p||epoch!==myEpoch)return;retryCount=0;startedAt=Date.now();
    if(isHost){status('Sala '+room+' aberta · envie o código ao amigo','waiting');settle(room)}
    else if(!channel){try{bind(p.connect('harvestao-world2-'+room,{reliable:true,serialization:'json',metadata:{protocol:PROTOCOL}}),false,myEpoch)}catch{closeChannel('Não foi possível procurar esta sala.')}}
   });
   p.on('connection',c=>{if(isHost&&peer===p&&epoch===myEpoch)bind(c,true,myEpoch);else refuse(c,'Este aparelho não está recebendo visitantes.','not-host')});
   p.on('error',error=>{
    if(peer!==p||epoch!==myEpoch)return;const type=String(error?.type||'');
    if(ready&&['network','socket-error','socket-closed','server-error'].includes(type)){status(errorMessage(type)+' A partida direta continua conectada.','connected');scheduleReconnect(p,myEpoch);return}
    const message=errorMessage(type);if(isHost&&!p.open){const old=peer;peer=null;try{old?.destroy()}catch{}settle(null);room='';setRole('solo');status(message,'error')}
    else closeChannel(message);
   });
   p.on('disconnected',()=>{if(peer!==p||epoch!==myEpoch)return;status(ready?'Servidor de salas desconectado; a partida direta continua. Tentando recuperar…':'Reconectando ao servidor de salas…',ready?'connected':'opening');scheduleReconnect(p,myEpoch)});
   p.on('close',()=>{if(peer===p&&epoch===myEpoch){peer=null;closeChannel('O servidor de conexão foi fechado.')}});
  }catch(error){const message=errorMessage(error?.type);settle(null);setRole('solo');status(message,'error')}
  return result;
 }
 function leave(){
  const wasRole=role,oldRemote=remoteId;epoch++;clearTimeout(retryTimer);retryTimer=null;retryCount=0;
  closeChannel('',false);const old=peer;peer=null;try{old?.destroy()}catch{}room='';phase='solo';startedAt=0;onRemote(null);setRole('solo');status('Sua fazenda · jogando sozinho','solo');if(wasRole!=='solo')onClose({role:wasRole,reason:'left',remoteId:oldRemote});
 }
 const timer=setInterval(()=>{
  const now=Date.now(),delta=Math.min(6000,Math.max(0,now-lastTimer));lastTimer=now;
  if(destroyed||document.hidden)return;
  if(channel&&!ready){handshakeActive+=delta;if(handshakeActive>45000)closeChannel('A conexão demorou demais. Confiram o código e tentem outra rede se necessário.')}
  else if(ready&&channel?.open){if(now-lastHeartbeat>=5000){lastHeartbeat=now;raw({type:'ping',at:now})}if(now-lastSeen>120000)closeChannel('O outro aparelho ficou sem responder por dois minutos.')}
  else if(role==='guest'&&phase==='opening'&&startedAt&&now-startedAt>45000){closeChannel('Não foi possível localizar a sala. Confira se o dono está com o jogo aberto.')}
  else if(role==='host'&&phase==='opening'&&startedAt&&now-startedAt>45000){settle(null);status('O servidor de salas demorou para abrir. Saia e tente novamente.','error')}
 },1000);
 function visibility(){lastTimer=Date.now();lastSeen=Date.now();handshakeActive=0;if(ready){raw({type:'ping',at:lastSeen});if(!document.hidden)raw({type:'resync'})}}
 document.addEventListener('visibilitychange',visibility);
 function pagehide(event){if(!event.persisted)leave()}
 addEventListener('pagehide',pagehide);
 return {host:()=>start(true),join:code=>start(false,code),leave,
  send(packet){return ready&&record(packet)&&typeof packet.type==='string'&&!['hello','welcome','ready','reject','pose'].includes(packet.type)?raw(packet):false},
  sendRemote(pose){const now=Date.now();if(!ready||now-lastPose<90)return false;lastPose=now;return raw({type:'pose',pose})},
  get role(){return role},get ready(){return ready},get connected(){return ready&&!!channel?.open},get connecting(){return ['loading','opening','connecting','awaiting-hello','awaiting-welcome','awaiting-ready','applying-welcome'].includes(phase)},get code(){return room},get selfId(){return selfId},get remoteId(){return remoteId},
  destroy(){if(destroyed)return;leave();destroyed=true;clearInterval(timer);clearTimeout(retryTimer);document.removeEventListener('visibilitychange',visibility);removeEventListener('pagehide',pagehide)}
 };
}