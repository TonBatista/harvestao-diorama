import {MAIN_FARM_BOUNDS} from './farm-layout.js?v=0.35';
import {FARM_GATES,FARM_EDGE_TREES,farmFootprints,farmPoint,migrateFarmLayout} from './farm-customization.js?v=0.35';
import {MAIN_FIELD,LEGACY_FIELD,TILE} from './cultivation-layout.js?v=0.35';
import {colliderContains} from './scene-collisions.js?v=0.35';
const RECOVERY_VERSION=1;
/** Recover an old save once; normal parking remains untouched on later loads. */
export function recoverTractorOnce(state){
 if(state.tractorRecoveryVersion>=RECOVERY_VERSION)return false;
 migrateFarmLayout(state);const vehicle=state.tractor&&typeof state.tractor==='object'&&!Array.isArray(state.tractor)?state.tractor:(state.tractor={});
 const ground=state.homePlots||state.plots||[],field=ground.length===144?LEGACY_FIELD:MAIN_FIELD,footprints=farmFootprints(state),bounds=MAIN_FARM_BOUNDS,doors=[...Object.values(FARM_GATES),...['house','barn','toolroom'].map(id=>farmPoint(state,id,0,2.6))],stumps=Object.values(state.farmStumps||{});
 function clear(x,z,w,d){
  if(x-w/2-.4<bounds[0]||x+w/2+.4>bounds[1]||z-d/2-.4<bounds[2]||z+d/2+.4>bounds[3])return false;
  const area={x,z,w:w+.6,d:d+.6};if(doors.some(p=>Math.hypot(p.x-x,p.z-z)<4.5))return false;
  if(footprints.some(c=>{for(const xx of[-w/2-.45,0,w/2+.45])for(const zz of[-d/2-.45,0,d/2+.45])if(colliderContains(c,x+xx,z+zz,.25))return true;return colliderContains(area,c.x,c.z,Math.hypot(c.w,c.d)/2)}))return false;
  if([...FARM_EDGE_TREES,...stumps].some(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&colliderContains(area,p.x,p.z,.4)))return false;
  return !ground.some(p=>(p.crop||p.obstacle||p.tilled)&&colliderContains(area,field.x+p.x*TILE,field.z+p.z*TILE,.5));
 }
 const candidates=[[20.5,5],[18,4.7],[18,0],[18,12],[18,17],[-18,-6],[-18,2],[-18,-11],[21,19],[21,-11],[14,15],[0,-16],[7,-16],[-7,-16]];
 for(let z=-22;z<=21;z+=3)for(let x=-18;x<=22;x+=3)candidates.push([x,z]);
 const point=candidates.find(([x,z])=>clear(x,z,1.35,2.1)&&clear(x,z+2.8,1.6,1.92))||[18,4.7];
 Object.assign(vehicle,{x:point[0],z:point[1],angle:Math.PI,area:'farm',lotId:null,cutter:false,trailerX:point[0],trailerZ:point[1]+2.8,trailerAngle:Math.PI,trailerArea:'farm',trailerLot:null});
 state.coopDriver=null;state.tractorRecoveryVersion=RECOVERY_VERSION;return true;
}