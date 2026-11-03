import * as T from './three.module.js';
import {artisanMaterial} from './art-direction.js?v=0.38';
import {FARM_GATES} from './farm-customization.js?v=0.38';
const noise=n=>{const v=Math.sin(n*127.1+53.8)*43758.5453;return v-Math.floor(v)};
const GEO={box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(1,1,1,10),ball:new T.SphereGeometry(1,8,5)};
function part(parent,geo,color,x,y,z,sx,sy,sz,kind='wood'){const mesh=new T.Mesh(geo,artisanMaterial(color,kind));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh}
const box=(p,c,x,y,z,w,h,d,k)=>part(p,GEO.box,c,x,y,z,w,h,d,k);
const ball=(p,c,x,y,z,sx,sy,sz,k)=>part(p,GEO.ball,c,x,y,z,sx,sy,sz,k);
function beam(parent,color,from,to,width,depth=width){const a=new T.Vector3(...from),b=new T.Vector3(...to),delta=b.clone().sub(a),mid=a.add(b).multiplyScalar(.5),mesh=box(parent,color,mid.x,mid.y,mid.z,width,delta.length(),depth);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh}
// Merge each material once. The entrance stays static and adds no per-frame work.
function mergeStatic(source){
 source.updateMatrixWorld(true);const buckets=new Map();source.traverse(o=>{if(!o.isMesh)return;const key=o.material.id+':'+Number(o.castShadow);if(!buckets.has(key))buckets.set(key,{material:o.material,shadow:o.castShadow,parts:[]});const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(o.matrixWorld);buckets.get(key).parts.push(g)});const root=new T.Group();root.name='farm-entrance-static';
 for(const b of buckets.values()){const count=b.parts.reduce((n,g)=>n+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2);let offset=0;for(const g of b.parts){const n=g.attributes.position.count;positions.set(g.attributes.position.array,offset*3);normals.set(g.attributes.normal.array,offset*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,offset*2);offset+=n;g.dispose()}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,b.material);mesh.castShadow=b.shadow;mesh.receiveShadow=true;root.add(mesh)}return root;
}
export function createFarmEntrance(){
 const gate=FARM_GATES.village,source=new T.Group(),colliders=[];source.position.set(gate.x,0,gate.z);
 for(const side of[-1,1]){
  const z=side*2.25;box(source,'#9d8159',0,1.04,z,.29,2.08,.31);box(source,'#bea272',0,2.13,z,.39,.13,.40);box(source,'#8e977a',0,.13,z,.47,.18,.48,'stone');
  // Both hand-built leaves swing inward and leave the center open for the tractor.
  const leaf=new T.Group(),angle=side*1.22;leaf.position.set(0,0,z);leaf.rotation.y=angle;source.add(leaf);
  for(let i=0;i<5;i++){const board=box(leaf,['#b89c6b','#aa8d5f','#c4aa78'][i%3],0,.77,-side*(.18+i*.35),.12,1.02+(i%2)*.09,.29);board.rotation.x=(i%3-1)*.018;for(const y of[.46,1.08])ball(leaf,'#696e5a',.079,y,-side*(.18+i*.35),.018,.018,.018,'plain')}
  for(const y of[.44,1.11])box(leaf,'#917956',.09,y,-side*.93,.09,.12,1.94);beam(leaf,'#a0875e',[.15,.43,-side*.05],[.15,1.17,-side*1.76],.07,.07);
  for(const y of[.44,1.14])box(source,'#68705d',-.17,y,z,.055,.11,.32,'plain');
  colliders.push({x:gate.x,z:gate.z+z,r:.23,kind:'entrance-post'});
  const middle=-side*.91;colliders.push({x:gate.x+Math.sin(angle)*middle,z:gate.z+z+Math.cos(angle)*middle,w:.23,d:1.92,angle,kind:'entrance-leaf'});
  for(const dz of[side*.60,side*1.25]){const rail=box(source,'#a78b60',0,.58,z+dz,.10,.11,.80);rail.rotation.x=side*.035;box(source,'#ae9267',0,.98,z+dz,.10,.11,.80)}
  box(source,'#a68b61',0,.66,side*3.78,.19,1.32,.20);box(source,'#bfa373',0,1.35,side*3.78,.25,.09,.25);
  colliders.push({x:gate.x,z:gate.z+side*3.12,w:.20,d:1.86,kind:'entrance-fence'});
  // Loose grass and a few low flowers soften the edge of the dirt entrance.
  for(let i=0;i<7;i++){const x=-.2-noise(i+120)*2.3,zz=z+side*(.20+noise(i+220)*.28);for(let j=0;j<3;j++){const grass=ball(source,'#8da96c',x+(j-1)*.045,.12,zz,.025,.14,.019,'leaf');grass.rotation.z=(j-1)*.4}if(i%2)ball(source,i%3?'#d8c796':'#bba2b6',x,.25,zz,.043,.04,.043,'plain')}
 }
 return {root:mergeStatic(source),colliders};
}