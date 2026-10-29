import {MAIN_FARM_BOUNDS} from './farm-layout.js?v=0.35';
const defaults=[];
for(let i=0;i<16;i++){defaults.push({id:'L-'+i,x:-7.8,z:-3+i});if(i<5||i>8)defaults.push({id:'R-'+i,x:9.6,z:-3+i})}
for(let i=0;i<16;i++){const x=-7.6+i*1.1;if(x>-.8&&x<2.5)continue;defaults.push({id:'T-'+i,x:Math.round(x*1000)/1000,z:-4.55})}
export const FARM_STUMP_DEFAULTS=Object.freeze(defaults.map(Object.freeze));
const ids=new Set(defaults.map(p=>p.id)),own=(v,k)=>v!==null&&typeof v==='object'&&Object.hasOwn(v,k),record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function inBounds(p){const b=MAIN_FARM_BOUNDS;return record(p)&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=b[0]+.5&&p.x<=b[1]-.5&&p.z>=b[2]+.5&&p.z<=b[3]-.5}
export function validFarmStumps(value){
 if(!record(value)||Object.keys(value).length!==ids.size||Object.keys(value).some(id=>!ids.has(id)))return false;
 for(const d of defaults){const p=value[d.id];if(!inBounds(p)||Object.keys(p).some(k=>k!=='x'&&k!=='z'))return false}
 const points=Object.values(value);return points.every((p,i)=>points.slice(i+1).every(q=>Math.hypot(p.x-q.x,p.z-q.z)>=.55-1e-9));
}
export function migrateFarmStumps(state){
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
 const target={x:Math.round(x*1000)/1000,z:Math.round(z*1000)/1000};if(!inBounds(target))return{changed:false,message:'Escolha um lugar livre dentro da sua fazenda.'};
 if(Object.entries(current).some(([other,q])=>other!==id&&Math.hypot(q.x-target.x,q.z-target.z)<.55))return{changed:false,message:'Deixe um pequeno espaço entre os tocos.'};
 if(canPlace){const allowed=canPlace(target.x,target.z,id);if(allowed===false||typeof allowed==='string')return{changed:false,message:typeof allowed==='string'?allowed:'Esse espaço está ocupado. Escolha outro lugar.'}}
 if(p.x===target.x&&p.z===target.z)return{changed:false,message:'O toco continua no mesmo lugar.'};
 current[id]=target;return{changed:true,id,message:'Toco colocado. Você pode pegar e mudar de lugar outra vez.'};
}
