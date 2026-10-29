import {createMultiplayerConnection,BUILD} from './multiplayer-connection.js?v=0.31';
import {mountMultiplayerMenu} from './multiplayer-menu.js?v=0.31';
import {sharedSnapshot,applyShared,diffShared,applyTransaction,capturePersonal,applyPersonal,resetVisitorPersonal} from './cooperative-state.js?v=0.31';
import {FIELD,TILE} from './simulation.js?v=0.31';
import {validRemotePose} from './remote-farmer.js?v=0.31';
const copy=value=>JSON.parse(JSON.stringify(value)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const dayKey=s=>[s.year,s.season,s.day].join(':');
const vehicleKeys=['x','z','angle','area','lotId','trailerX','trailerZ','trailerAngle','trailerArea','trailerLot'];
function areaStamp(s){return JSON.stringify([s.homesteads?.owned,Object.entries(s.homesteads?.lots||{}).map(([id,l])=>[id,l.house,l.barn,l.cleared]),s.animalLocations,Object.keys(s.herdRoutes||{}).sort()])}
export function mountCooperative({state,world,notify,writeLocal,refresh,beforeOpen,onProfile}){
 let connection,menu,backup=null,applying=false,pending=null,baseline=null,personalBaseline=null,revision=0,remoteRevision=-1,sequence=0,lastSeq=0,lastAck=null,lastShared='',networkTime=0,publishAt=0,lastAction=0,remoteName='',day=dayKey(state),mountPosition=null,closed=false;
 let guestId=null,flushQueued=false,statusText='Sua fazenda está pronta.',lastPose=null;
 // Leases are live-session data, never restored from a previous browser run.
 state.coopDriver=null;
 const slots=()=>{if(!state.coopGuests||typeof state.coopGuests!=='object'||Array.isArray(state.coopGuests))state.coopGuests={};return state.coopGuests};
 const ui=()=>{menu?.update({role:connection?.role||'solo',ready:connection?.ready||false,code:connection?.code||'',status:statusText,remoteName});const active=connection?.role!=='solo';for(const id of ['newButton','confirmNew','importSave']){const e=document.getElementById(id);if(e)e.disabled=active}const farm=document.getElementById('profileFarmName');if(farm)farm.disabled=connection?.role==='guest'};
 function snapshot(){const value=sharedSnapshot(state),text=JSON.stringify(value);if(text!==lastShared){lastShared=text;revision++}return {snapshot:value,revision}}
 function publish(){if(connection?.role==='host'&&connection.ready)connection.send({type:'snapshot',...snapshot()})}
 function restore(){if(!backup)return;applying=true;try{const profile={...state.profile,farmName:backup.profile.farmName},birding=state.birding;world.cancelVehicleControl?.();Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,backup);state.profile=profile;if(birding)state.birding=birding;backup=null;state.coopDriver=null;refresh({restore:true,full:true});writeLocal()}finally{applying=false;pending=null;baseline=null;personalBaseline=null;remoteRevision=-1;sequence=0}}
 function acceptSnapshot(packet,{personal=null,full=false}={}){
  if(!packet||!Number.isSafeInteger(packet.revision)||packet.revision<remoteRevision)return false;
  if(personal&&!applyPersonal({},personal))return false;
  const before=areaStamp(state),previousDay=dayKey(state),vehicle=world.driving&&state.coopDriver===connection.selfId?Object.fromEntries(vehicleKeys.map(k=>[k,state.tractor[k]])):null;
  applying=true;try{
   if(!applyShared(state,packet.snapshot))return false;
   if(personal&&!applyPersonal(state,personal))return false;
   if(previousDay!==dayKey(state)){state.stamina=100;state.fatigue=0}
   if(vehicle&&state.coopDriver===connection.selfId&&world.driving)Object.assign(state.tractor,vehicle);
   if(world.driving&&state.coopDriver!==connection.selfId){world.cancelVehicleControl?.();if(mountPosition)Object.assign(state.player,mountPosition)}
   remoteRevision=packet.revision;baseline=copy(packet.snapshot);personalBaseline=capturePersonal(state);day=dayKey(state);
   refresh({full,rebuildArea:before!==areaStamp(state)});return true;
  }finally{applying=false}
 }
 function visitorSave(){
  if(applying)return true;
  if(connection.role!=='guest'){if(!world.driving&&state.coopDriver===connection.selfId)state.coopDriver=null;return false}
  if(!flushQueued){flushQueued=true;queueMicrotask(()=>{flushQueued=false;flushVisit()})}return true;
 }
 function flushVisit(){
  if(applying)return true;
  if(connection.role!=='guest'){if(!world.driving&&state.coopDriver===connection.selfId)state.coopDriver=null;return false}
  if(!backup||!connection.ready||pending)return true;
  if(!world.driving&&state.coopDriver===connection.selfId)state.coopDriver=null;
  const current=sharedSnapshot(state),personal=capturePersonal(state),ownVehicle=world.driving&&state.coopDriver===connection.selfId;
  const patches=diffShared(baseline,current).filter(p=>!(p.path[0]==='tractor'&&vehicleKeys.includes(p.path[1]))&&!(ownVehicle&&(p.path[0]==='homePlots'||p.path[0]==='homesteads')&&p.before?.value?.obstacle==='weed'&&p.after?.value?.obstacle===null));
  if(!patches.length&&same(personal,personalBaseline))return true;
  const packet={type:'transaction',seq:++sequence,day:dayKey(state),patches,beforePersonal:copy(personalBaseline),personal};pending={packet,beforePersonal:copy(personalBaseline),at:networkTime,retries:0};
  if(!connection.send(packet)){pending=null;closed=true;notify('Conexão interrompida. Abra Menu → Multiplayer para sair com segurança.')}return true;
 }
 function applyVehicle(pose,sender){
  const v=pose?.vehicle;if(state.coopDriver!==sender||!pose.driving||!v||typeof v!=='object')return;
  if(!['farm','homestead','lake','village','mountain','beach'].includes(v.area)||['x','z','angle','trailerX','trailerZ','trailerAngle'].some(k=>!Number.isFinite(v[k])||Math.abs(v[k])>100)||v.area==='homestead'&&!['willow','sunrise','pine'].includes(v.lotId)||v.trailerArea!==undefined&&!['farm','homestead','lake','village','mountain','beach'].includes(v.trailerArea)||v.trailerLot!=null&&!['willow','sunrise','pine'].includes(v.trailerLot))return;
  for(const k of vehicleKeys)if(Object.hasOwn(v,k))state.tractor[k]=v[k];
  if(connection.role==='host'&&state.tractor.cutter){const plots=v.area==='farm'?state.homePlots:v.area==='homestead'?state.homesteads?.lots[v.lotId]?.plots:null;if(plots)for(const p of plots)if(p.obstacle==='weed'&&Math.hypot(FIELD.x+p.x*TILE-v.x,FIELD.z+p.z*TILE-v.z)<1.18)p.obstacle=null;world.rebuild()}
  world.refreshVehicle();
 }
 function receive(packet){
  if(connection.role==='host'){
   if(packet.type==='resync'){publish();return}
   if(packet.type!=='transaction'||!Number.isSafeInteger(packet.seq)||packet.seq<1||!Array.isArray(packet.patches)||packet.patches.length>400)return;
   if(packet.seq===lastSeq&&lastAck){connection.send(lastAck);return}
   if(packet.seq!==lastSeq+1){connection.send({type:'resync-required',message:'A conexão precisa sincronizar novamente. Saia da visita e entre com o mesmo código.'});return}
   const store=slots(),slot=store[guestId];if(!slot)return;
   const before=areaStamp(state);let result;
   if(networkTime-lastAction<.045)result={ok:false,message:'Aguarde um instante antes da próxima ação.'};
   else if(packet.day!==dayKey(state))result={ok:false,message:'O dia mudou. Sua ação foi desfeita com segurança; tente novamente.'};
   else if(packet.patches?.some(p=>p.path?.[0]==='coopDriver'&&p.after?.exists&&p.after.value!==null&&p.after.value!==guestId))result={ok:false,message:'O trator está sendo usado por outro jogador.'};
   else result=applyTransaction(state,packet,slot.personal);
   lastAction=networkTime;lastSeq=packet.seq;if(result.ok)slot.personal=result.personal;slot.updated=Date.now();
   const snap=snapshot();lastAck={type:'ack',seq:lastSeq,ok:result.ok,message:result.message,personal:copy(slot.personal),...snap};connection.send(lastAck);
   if(result.ok){refresh({rebuildArea:before!==areaStamp(state)});writeLocal()}return;
  }
  if(packet.type==='snapshot'){if(!pending)acceptSnapshot(packet);return}
  if(packet.type==='ack'&&pending&&packet.seq===pending.packet.seq){const old=pending;pending=null;if(!packet.ok)applyPersonal(state,old.beforePersonal);if(!acceptSnapshot(packet,{personal:packet.personal||old.beforePersonal})){closed=true;notify('A sincronização falhou. Saia da sala para restaurar sua fazenda.');return}if(!packet.ok)notify(packet.message||'A ação foi desfeita porque a fazenda mudou. Tente novamente.');ui();return}
  if(packet.type==='resync-required'){closed=true;statusText=packet.message;ui();menu.open()}
 }
 connection=createMultiplayerConnection({
  hello:()=>({profile:state.profile}),
  onRole(role){world.setNetworkRole?.(role);if(role==='solo')restore();ui()},
  onStatus(message){statusText=message;ui()},
  onHello({selfId,hello}){guestId=selfId;lastSeq=0;lastAck=null;lastAction=-1;const store=slots();if(['__proto__','constructor','prototype'].includes(selfId))throw Error('Identidade inválida');if(!Object.hasOwn(store,selfId)||!applyPersonal({},store[selfId]?.personal)){const temp={};resetVisitorPersonal(temp);store[selfId]={personal:capturePersonal(temp),updated:Date.now()}}for(const id of Object.keys(store).sort((a,b)=>(store[b].updated||0)-(store[a].updated||0)).slice(8))delete store[id];remoteName=String(hello?.profile?.playerName||'Visitante').slice(0,24);writeLocal();return {...snapshot(),personal:copy(store[selfId].personal),spawn:{x:10.7,z:3.3,angle:Math.PI}}},
  onWelcome(payload){if(!payload||!payload.snapshot)return false;backup??=copy({...state,player:world.safePlayer});sequence=0;remoteRevision=-1;pending=null;closed=false;state.region='farm';state.buildingReturn=null;state.farmReturn=null;state.player={x:10.7,z:3.3,angle:Math.PI};if(!acceptSnapshot(payload,{personal:payload.personal,full:true})){restore();return false}return true},
  onReady(){closed=false;ui();if(connection.role==='host')publish();notify(connection.role==='host'?'Seu amigo entrou na fazenda.':'Conectado! Sua fazenda pessoal está guardada.')},
  onPacket:receive,
  onRemote(pose){if(pose===null){world.clearRemotePose?.();return}if(!validRemotePose(pose))return;lastPose=pose;remoteName=String(pose.profile?.playerName||'Visitante').slice(0,24);applyVehicle(pose,connection.remoteId);world.setRemotePose?.(pose);ui()},
  onClose({role,reason,remoteId}){world.clearRemotePose?.();lastPose=null;if(role==='host'){if(state.coopDriver===remoteId)state.coopDriver=null;writeLocal()}else if(reason!=='left'&&backup){closed=true;world.cancelVehicleControl?.();statusText='Visita pausada: conexão perdida. Saia para voltar à sua fazenda; depois entre novamente.';ui();menu?.open()}remoteName='';ui()}
 });
 menu=mountMultiplayerMenu({build:BUILD,beforeOpen,onProfile,onSolo:()=>{if(connection.role!=='solo')connection.leave()},onContinue:()=>{},onHost:async()=>{beforeOpen();writeLocal();closed=false;revision=0;lastShared='';await connection.host();ui()},onJoin:async code=>{beforeOpen();closed=false;await connection.join(code);ui()},onLeave:()=>{connection.leave();state.coopDriver=null;closed=false;pending=null;ui()}});
 world.setVehiclePermission?.(()=>{if(connection.role==='guest'&&(!connection.ready||pending||closed))return false;if(connection.role==='solo')return true;if(state.coopDriver&&state.coopDriver!==connection.selfId)return false;mountPosition={...world.safePlayer};state.coopDriver=connection.selfId;return true});
 // Lock mutations while one transaction is awaiting its authoritative reply.
 // The room menu remains usable so a dropped network never traps the player.
 const guard=e=>{if(!blocked())return;const target=e.target instanceof Element?e.target:null;if(target?.closest('#titleScreen,#startMenu,#menuButton,#multiplayerButton,#resume,#menu .close'))return;if(e.type==='keydown'&&['Escape','KeyY'].includes(e.code))return;e.preventDefault();e.stopImmediatePropagation()};
 for(const event of ['click','pointerdown','keydown'])document.addEventListener(event,guard,true);
 function blocked(){return connection.role==='guest'&&(!connection.ready||!!pending||closed)}
 const invited=new URLSearchParams(location.search).get('sala');if(/^HV[A-F0-9]{6}$/i.test(invited||'')){const input=menu.element.querySelector('#mpRoomCode');input.value=invited.toUpperCase();statusText='Convite recebido. Clique em Entrar para visitar esta fazenda.'}
 ui();
 return {menu,save:visitorSave,get role(){return connection.role},get ready(){return connection.ready},get blocked(){return blocked()},get selfId(){return connection.selfId},open:()=>menu.open(),leave:()=>connection.leave(),
  tick(dt,moving){networkTime+=dt;world.multiplayerTick?.(dt);if(connection.ready){const pose=world.localNetworkPose;pose.moving=!!moving;pose.vehicle=world.driving?Object.fromEntries(vehicleKeys.map(k=>[k,state.tractor[k]])):null;connection.sendRemote(pose);if(connection.role==='host'&&networkTime-publishAt>.75){publishAt=networkTime;if(day!==dayKey(state)){day=dayKey(state);for(const slot of Object.values(slots())){slot.personal.stamina=100;slot.personal.fatigue=0}}publish()}if(connection.role==='guest'&&!pending&&networkTime-publishAt>1){publishAt=networkTime;visitorSave()}}
   if(pending&&networkTime-pending.at>3){if(pending.retries<2){pending.retries++;pending.at=networkTime;connection.send(pending.packet)}else{closed=true;statusText='Ação sem confirmação. Saia e entre novamente; sua fazenda pessoal está protegida.';ui();menu.open();pending.at=networkTime}}
  }
 };
}