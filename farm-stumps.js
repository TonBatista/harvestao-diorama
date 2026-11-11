import {MAIN_FARM_BOUNDS} from './farm-layout.js?v=0.47';
const defaults=[];
for(let i=0;i<16;i++){defaults.push({id:'L-'+i,x:-7.8,z:-3+i});if(i<5||i>8)defaults.push({id:'R-'+i,x:9.6,z:-3+i})}
for(let i=0;i<16;i++){const x=-7.6+i*1.1;if(x>-.8&&x<2.5)continue;defaults.push({id:'T-'+i,x:Math.round(x*1000)/1000,z:-4.55})}
export const FARM_STUMP_DEFAULTS=Object.freeze(defaults.map(Object.freeze));
export const STUMP_MIN_SPACING=1,STUMP_HORIZONTAL_STEP=1.1,STUMP_VERTICAL_STEP=1;
const RESET_KEY='farm-stumps-aligned-v2';
const ids=new Set(defaults.map(p=>p.id)),own=(v,k)=>v!==null&&typeof v==='object'&&Object.hasOwn(v,k),record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function inBounds(p){const b=MAIN_FARM_BOUNDS;return record(p)&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=b[0]+.5&&p.x<=b[1]-.5&&p.z>=b[2]+.5&&p.z<=b[3]-.5}
export function validFarmStumps(value){
 if(!record(value)||Object.keys(value).length!==ids.size||Object.keys(value).some(id=>!ids.has(id)))return false;
 for(const d of defaults){const p=value[d.id];if(!inBounds(p)||Object.keys(p).some(k=>k!=='x'&&k!=='z'))return false}
 const points=Object.values(value);return points.every((p,i)=>points.slice(i+1).every(q=>Math.hypot(p.x-q.x,p.z-q.z)>=.55-1e-9));
}
export function migrateFarmStumps(state){
 state.gathered??={};if(state.gathered[RESET_KEY]!==1){state.farmStumps=Object.fromEntries(defaults.map(d=>[d.id,{x:d.x,z:d.z}]));state.gathered[RESET_KEY]=1;return state.farmStumps}
 if(validFarmStumps(state.farmStumps))return state.farmStumps;
 const prior=record(state.farmStumps)?state.farmStumps:{},next={};
 for(const d of defaults){const p=own(prior,d.id)&&inBounds(prior[d.id])?prior[d.id]:d;next[d.id]={x:p.x,z:p.z}}
 // Invalid imported overlaps fall back to the known layout rather than spawning
 // inaccessible or overlapping solids. Normal saves preserve every placement.
 if(!validFarmStumps(next))for(const d of defaults)next[d.id]={x:d.x,z:d.z};
 state.farmStumps=next;return next;
}
export function findFarmStump(state,px,pz,range=1.1){
 if(!Number.isFinite(px)||!Number.isFinite(pz)||!Number.isFinite(range)||range<=0)return null;
 let found=null;for(const[id,p]of Object.entries(migrateFarmStumps(state))){const distance=Math.hypot(p.x-px,p.z-pz);if(distance<=range&&(!found||distance<found.distance))found={id,x:p.x,z:p.z,distance}}return found;
}
export function moveFarmStump(state,id,x,z,{expected,canPlace}={}){
 const current=migrateFarmStumps(state),p=current[id];if(!ids.has(id)||!p)return{changed:false,message:'Este toco não está disponível.'};
 if(expected&&(!Number.isFinite(expected.x)||!Number.isFinite(expected.z)||p.x!==expected.x||p.z!==expected.z))return{changed:false,stale:true,message:'Outro jogador já moveu este toco. Pegue-o novamente.'};
 if(!Number.isFinite(x)||!Number.isFinite(z))return {changed:false,message:'Escolha um lugar livre dentro da sua fazenda.'};const target=snapFarmStump(state,id,x,z);if(!inBounds(target))return{changed:false,message:'Escolha um lugar livre dentro da sua fazenda.'};
 if(Object.entries(current).some(([other,q])=>other!==id&&Math.hypot(q.x-target.x,q.z-target.z)<STUMP_MIN_SPACING-1e-8))return{changed:false,message:'Deixe ao menos um espaço inteiro entre os tocos. Siga a prévia no chão.'};
 if(canPlace){const allowed=canPlace(target.x,target.z,id);if(allowed===false||typeof allowed==='string')return{changed:false,message:typeof allowed==='string'?allowed:'Esse espaço está ocupado. Escolha outro lugar.'}}
 if(p.x===target.x&&p.z===target.z)return{changed:false,message:'O toco continua no mesmo lugar.'};
 current[id]={x:target.x,z:target.z};return{changed:true,id,message:'Toco alinhado à cerca, com o espaçamento original.'};
}
/** Use nearby fence rows as rails; isolated pieces keep the original rectangular grid. */
export function snapFarmStump(state,id,x,z){
 const points=migrateFarmStumps(state),definition=defaults.find(d=>d.id===id)||defaults[0],round=n=>Math.round(n*1000)/1000;
 if(!Number.isFinite(x)||!Number.isFinite(z))return {x:NaN,z:NaN};
 const others=Object.entries(points).filter(([key])=>key!==id),candidates=[];
 for(const [key,q]of others){if(Math.hypot(x-q.x,z-q.z)>3.2)continue;
  const vertical=others.some(([k,p])=>k!==key&&Math.abs(p.x-q.x)<.025&&Math.abs(p.z-q.z)>.95&&Math.abs(p.z-q.z)<2.05),horizontal=others.some(([k,p])=>k!==key&&Math.abs(p.z-q.z)<.025&&Math.abs(p.x-q.x)>1.05&&Math.abs(p.x-q.x)<2.25);
  if(Math.abs(x-q.x)<=.8&&(vertical||!horizontal)){const p={x:q.x,z:round(q.z+Math.round(z-q.z)),axis:'vertical'};candidates.push({...p,score:Math.hypot(p.x-x,p.z-z)-(vertical?.12:0)})}
  if(Math.abs(z-q.z)<=.8&&(horizontal||!vertical)){const p={x:round(q.x+Math.round((x-q.x)/1.1)*1.1),z:q.z,axis:'horizontal'};candidates.push({...p,score:Math.hypot(p.x-x,p.z-z)-(horizontal?.12:0)})}
 }
 candidates.sort((a,b)=>a.score-b.score||a.x-b.x||a.z-b.z);const p=candidates[0];return p?{x:round(p.x),z:round(p.z),axis:p.axis}:{x:round(definition.x+Math.round((x-definition.x)/1.1)*1.1),z:round(definition.z+Math.round(z-definition.z)),axis:definition.id.startsWith('T-')?'horizontal':'vertical'};
}
