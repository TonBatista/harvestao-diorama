import * as T from './three.module.js';
import {colliderContains} from './scene-collisions.js?v=0.47';

const finite=Number.isFinite;
const width=c=>c.w||2*(c.r||c.rx||.3),depth=c=>c.d||2*(c.r||c.rz||.3);
const key=c=>[c.x,c.z,width(c),depth(c)].map(n=>n.toFixed(3)).join(':');
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function turn(x,z,a){const cs=Math.cos(a),sn=Math.sin(a);return {x:x*cs+z*sn,z:-x*sn+z*cs}}
function boxesOverlap(a,b){
 const aa=a.angle||0,ba=b.angle||0,axes=[[Math.cos(aa),-Math.sin(aa)],[Math.sin(aa),Math.cos(aa)],[Math.cos(ba),-Math.sin(ba)],[Math.sin(ba),Math.cos(ba)]];
 const radius=(c,axis)=>{const angle=c.angle||0;return c.w/2*Math.abs(axis[0]*Math.cos(angle)-axis[1]*Math.sin(angle))+c.d/2*Math.abs(axis[0]*Math.sin(angle)+axis[1]*Math.cos(angle))};
 return axes.every(axis=>Math.abs((b.x-a.x)*axis[0]+(b.z-a.z)*axis[1])<radius(a,axis)+radius(b,axis)+.025);
}
/** Keep furnishings separate from the room bake, with their original collision and interaction records. */
export function prepareInteriorFurniture(region,state){
 // Public shops, neighbours' homes and civic buildings are never editable.
 if(!region.indoors||!['house','barn','coop','toolroom'].includes(region.id))return;
 const roomKey=region.id+':'+(state.buildingReturn?.lotId||'main')+':'+(region.id==='residentHome'?state.residentHome||'':'');
 const saved=state.interiorLayout?.[roomKey]||{},items=[],used=new Set();
 region.root.updateMatrixWorld(true);
 for(const c of region.colliders){
  const w=width(c),d=depth(c);
  if(w<.38||d<.38||w>4.4||d>4.4||w/d>7||d/w>7)continue;
  let node=region.fixed.children.find(o=>o.isGroup&&!used.has(o)&&Math.hypot(o.position.x-c.x,o.position.z-c.z)<.12);
  if(!node)continue;
  // Decorative wall brackets, signs and living residents are never furniture.
  const bounds=new T.Box3().setFromObject(node);
  if(bounds.min.y>.45||bounds.max.y>3.3||node.userData.signPoint)continue;
  used.add(node);const origin={x:node.position.x,z:node.position.z,angle:node.rotation.y};
  const item={id:key(c),node,collider:c,origin,colliderAngle:c.angle||0,passages:c.passages?.map(p=>({...p})),points:[],width:w,depth:d};
  node.userData.interiorItem=item;region.dynamic.add(node);items.push(item);
 }
 // Assign each interaction to one furnishing, using distance to its footprint, not its center.
 for(const point of region.interactions){
  if(['pet','talk','barnBell','info','portal','tutorialBooks'].includes(point.type))continue;
  const ranked=items.map(item=>({item,d:Math.hypot(Math.max(0,Math.abs(point.x-item.origin.x)-item.width/2),Math.max(0,Math.abs(point.z-item.origin.z)-item.depth/2))})).sort((a,b)=>a.d-b.d);
  const owner=ranked[0];if(owner&&owner.d<1.1)owner.item.points.push({point,x:point.x,z:point.z,sign:point.sign?{...point.sign}:null});
 }
 function transformed(item,x,z,angle,px,pz){const p=turn(px-item.origin.x,pz-item.origin.z,angle-item.origin.angle);return {x:x+p.x,z:z+p.z}}
 function move(item,x,z,angle=item.node.rotation.y){
  angle=finite(angle)?wrap(angle):item.origin.angle;const delta=angle-item.origin.angle;
  item.node.position.x=x;item.node.position.z=z;item.node.rotation.y=angle;item.collider.x=x;item.collider.z=z;item.collider.angle=item.colliderAngle+delta;
  if(item.passages)item.collider.passages=item.passages.map(p=>({...p,...transformed(item,x,z,angle,p.x,p.z),angle:(p.angle||0)+delta}));
  for(const link of item.points){Object.assign(link.point,transformed(item,x,z,angle,link.x,link.z));if(link.sign){Object.assign(link.point.sign,transformed(item,x,z,angle,link.sign.x,link.sign.z));link.point.sign.rotation=(link.sign.rotation||0)+delta}}
  item.node.updateMatrix();item.node.updateMatrixWorld(true);
 }
 function fits(item,x,z,player=null,angle=item.node.rotation.y){
  if(!finite(x)||!finite(z)||!finite(angle))return false;const c={...item.collider,x,z,angle:item.colliderAngle+angle-item.origin.angle,passages:undefined},b=region.bounds,a=c.angle||0,cs=Math.cos(a),sn=Math.sin(a),w=item.width/2,d=item.depth/2;
  const samples=[];for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++)samples.push([x+ix*w*cs+iz*d*sn,z-ix*w*sn+iz*d*cs]);
  if(samples.some(([px,pz])=>px<b[0]+.1||px>b[1]-.1||pz<b[2]+.1||pz>b[3]-.1))return false;
  if(region.portals.some(p=>colliderContains(c,p.x,p.z,1.05)))return false;
  if(player&&colliderContains(c,player.x,player.z,.45))return false;
  return !region.colliders.some(other=>{
   if(other===item.collider)return false;
   if(c.w&&other.w&&!other.passages)return boxesOverlap(c,other);
   return samples.some(([px,pz])=>colliderContains(other,px,pz,.03))||colliderContains(c,other.x,other.z,.03);
  });
 }
 // Restore the complete arrangement before checking it, so swapped places remain valid.
 for(const item of items){const p=saved[item.id];if(p&&finite(p.x)&&finite(p.z))move(item,p.x,p.z,finite(p.angle)?p.angle:item.origin.angle)}
 for(const item of items)if(!fits(item,item.node.position.x,item.node.position.z))move(item,item.origin.x,item.origin.z,item.origin.angle);
 region.furniture={items,move,fits,commit(item){state.interiorLayout??={};state.interiorLayout[roomKey]??={};state.interiorLayout[roomKey][item.id]={x:item.node.position.x,z:item.node.position.z,angle:item.node.rotation.y}},mapPoint(x,z,anchorX,anchorZ,inverse=false){const item=items.find(i=>Math.hypot(i.origin.x-anchorX,i.origin.z-anchorZ)<.15);if(!item)return {x,z,angle:0};const angle=item.node.rotation.y-item.origin.angle;if(inverse){const p=turn(x-item.node.position.x,z-item.node.position.z,-angle);return {x:p.x+item.origin.x,z:p.z+item.origin.z,angle}}return {...transformed(item,item.node.position.x,item.node.position.z,item.node.rotation.y,x,z),angle}}};
}
