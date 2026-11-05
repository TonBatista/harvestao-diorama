import {villageGroundHeight,villageWalkHeight} from './village-layout.js?v=0.46';
import {buildLaneHomes,gazeboFloorHeight} from './rural-village.js?v=0.46';
import {coastalGroundHeight} from './coastal-layout.js?v=0.46';
import * as T from './three.module.js';
import {createKit} from './region-kit.js?v=0.46';
import {artisanMaterial} from './art-direction.js?v=0.46';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
// All walkers and ground vertices sample this same continuous surface.
function landHeight(area,x,z){if(area==='beach')return coastalGroundHeight(x,z);if(area==='mountain')return 3.5*smooth(-1,13,-z);if(area==='village')return villageGroundHeight(x,z);if(area==='valleyTrail')return 1.15*Math.sin(Math.PI*Math.max(0,Math.min(1,(z+30)/60)))**2;return 0}
// Structural ground stays below raised walkable platforms.
export function terrainHeight(area,x,z){return area==='village'?villageWalkHeight(x,z)+gazeboFloorHeight(x,z):landHeight(area,x,z)}
export function applyRelief(region){
 if(region.indoors||!['mountain','village','valleyTrail'].includes(region.id)||region.root.userData.reliefApplied)return;
 region.root.userData.reliefApplied=true;region.root.updateMatrixWorld(true);
 const bounds=new T.Box3(),pos=new T.Vector3(),matrix=new T.Matrix4();
 // Work before batching: terrain is tessellated; furniture, houses and trees stay rigid.
 for(const o of [...region.fixed.children]){
  bounds.setFromObject(o);const w=bounds.max.x-bounds.min.x,d=bounds.max.z-bounds.min.z;
  if(o.userData.reliefSurface){const g=o.geometry,a=g.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+landHeight(region.id,a.getX(i),a.getZ(i)));g.computeVertexNormals();g.computeBoundingSphere()}else if(o.isMesh&&bounds.max.y<.13&&w>.5&&d>.5){
   const inv=o.matrixWorld.clone().invert(),g=new T.PlaneGeometry(w,d,Math.max(1,Math.ceil(w*2)),Math.max(1,Math.ceil(d*2)));g.rotateX(-Math.PI/2);
   const a=g.attributes.position,uv=g.attributes.uv,cx=(bounds.min.x+bounds.max.x)/2,cz=(bounds.min.z+bounds.max.z)/2,y=bounds.max.y;
   for(let i=0;i<a.count;i++){const x=a.getX(i)+cx,z=a.getZ(i)+cz;pos.set(x,y+landHeight(region.id,x,z),z).applyMatrix4(inv);a.setXYZ(i,pos.x,pos.y,pos.z);uv.setXY(i,x/1.7,z/1.7)}
   g.computeVertexNormals();g.computeBoundingSphere();if(!o.geometry.userData.shared)o.geometry.dispose();o.geometry=g;
  }else{o.position.y+=landHeight(region.id,o.position.x,o.position.z);o.updateMatrix()}
 }
 for(const p of region.signs||[])if(p.sign)p.sign.y+=landHeight(region.id,p.sign.x,p.sign.z);
 const last=new WeakMap();
 for(const o of region.dynamic.children)if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);pos.setFromMatrixPosition(matrix);matrix.elements[13]+=landHeight(region.id,pos.x,pos.z);o.setMatrixAt(i,matrix)}o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere()}
 const previous=region.update.bind(region);region.update=(dt,time)=>{for(const o of region.dynamic.children){const p=last.get(o);if(p&&o.position.y===p.y)o.position.y-=p.h}previous(dt,time);for(const o of region.dynamic.children){if(o.isInstancedMesh)continue;const h=landHeight(region.id,o.position.x,o.position.z);o.position.y+=h;last.set(o,{y:o.position.y,h})}};
}
const center=z=>3.6*Math.sin(z*Math.PI/28)*Math.sin(Math.PI*Math.max(0,Math.min(1,(z+30)/60)));
export function buildValleyTrail(state){
 const route=state.valleyRoute||{from:'farm',to:'village',returnSpawn:[22.3,-15],spawn:[0,12.4]},reverse=route.from>route.to,k=createKit();k.floor('#9eaf79',26,64,0,0,0,'moss');
 const road=artisanMaterial('#bca47c','earth');road.userData.seasonSurface='path';
 const verge=artisanMaterial('#9f9e6d','moss');verge.userData.seasonSurface='ground';
 function ribbon(width,material,y){const p=[],uv=[],idx=[];for(let i=0;i<=120;i++){const z=-31+i*62/120,x=center(z);p.push(x-width/2,y,z,x+width/2,y,z);uv.push(0,i*.30,1.8,i*.30);if(i<120){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,material);m.receiveShadow=true;m.userData.reliefSurface=true;k.fixed.add(m);return m}
 ribbon(5.5,verge,.013);ribbon(4.0,road,.025);
 for(let i=0;i<28;i++){const z=-26+i*1.95,x=center(z);for(const side of[-1,1]){const edge=x+side*(3.1+(i%3)*.25);k.plant(edge,z,.75+(i%3)*.1);if(i%2===0)k.tree(x+side*(7.3+(i%3)*.6),z,.8+(i%4)*.08);if(i%4===0)k.rock(x+side*5.2,z,.5);for(let j=0;j<2;j++){const xx=edge+side*.45+j*.19;k.ball(k.fixed,['#dfcc8a','#d4b0bd','#ede6cd'][i%3],xx,.20,z+j*.32,.065,.065,.065);k.cyl(k.fixed,'#7d925e',xx,.09,z+j*.32,.013,.18)}}}
 // Wide unobstructed landings make both ends usable on foot and with a trailer.
 k.sign(4.2,25,'Voltar');k.sign(-4.2,-25,route.label||'Próximo destino');
 k.portal({x:0,z:reverse?-30.5:30.5,to:route.from,spawn:route.returnSpawn,label:'Voltar pela trilha',radius:2.6,autoRadius:2.5});
 k.portal({x:0,z:reverse?30.5:-30.5,to:route.to,spawn:route.spawn,label:route.label||'Continuar pelo vale',radius:2.6,autoRadius:2.5});
 if([route.from,route.to].includes('mountain'))for(let i=0;i<9;i++)k.rock(-10,-24+i*6,1.4+(i%3)*.25);
 buildLaneHomes(k,state,route);
 const r=k.finish({id:'valleyTrail',label:'Caminhos do vale',bounds:[-12,12,-32,32],spawn:[0,reverse?-24.5:24.5],viewHeight:15,indoors:false});
 // Meadow exclusion follows the curved strip, instead of rectangular paving tiles.
 r.dynamic.traverse(o=>{if(!o.isInstancedMesh)return;const m=new T.Matrix4(),v=new T.Vector3();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);v.setFromMatrixPosition(m);if(Math.abs(v.x-center(v.z))<2.3){m.scale(new T.Vector3(0,0,0));o.setMatrixAt(i,m)}}o.instanceMatrix.needsUpdate=true});return r;
}
export function routeForPortal(state,area,p){const outdoors=['farm','village','mountain','beach','lake','homestead'];if(!outdoors.includes(area)||!outdoors.includes(p.to))return null;return {from:area,to:p.to,entryZ:area>p.to?-24.5:24.5,spawn:p.spawn,returnSpawn:[state.player.x,state.player.z],label:p.label,lotId:p.data?.lotId}}
