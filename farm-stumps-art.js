import * as T from './three.module.js';
import {FARM_STUMP_DEFAULTS,migrateFarmStumps} from './farm-stumps.js?v=0.35';
const rand=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
/** Three shared instance draws keep a movable fence as inexpensive as scenery. */
export function createFarmStumpArt(state,{barkMaterial,cutMaterial,rootMaterial}){
 const root=new T.Group();root.name='farm-stumps';root.userData.seasonSurface='wood';
 const trunkGeometry=new T.CylinderGeometry(.88,1,1,15,3),capGeometry=new T.CylinderGeometry(.89,.89,.012,32),rootGeometry=new T.SphereGeometry(1,8,5),count=FARM_STUMP_DEFAULTS.length;
 const trunks=new T.InstancedMesh(trunkGeometry,barkMaterial,count),caps=new T.InstancedMesh(capGeometry,cutMaterial,count),roots=new T.InstancedMesh(rootGeometry,rootMaterial,count*3);root.add(trunks,caps,roots);
 for(const mesh of [trunks,caps,roots]){mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage)}
 const dummy=new T.Object3D(),metadata=new Map(),colliders=[];
 for(const definition of FARM_STUMP_DEFAULTS){const seed=definition.x*31+definition.z*67,height=.33+rand(seed)*.12,radius=.21+rand(seed+8)*.035,c={x:definition.x,z:definition.z,r:radius+.015,height:height+.013,jumpable:true,kind:'low-stump',stumpId:definition.id};metadata.set(definition.id,{...definition,seed,height,radius,collider:c});colliders.push(c)}
 let lastSignature='';
 function sync(selected=null){const locations=migrateFarmStumps(state),signature=FARM_STUMP_DEFAULTS.map(d=>d.id+':'+locations[d.id].x+','+locations[d.id].z).join('|')+'|'+(selected||'');if(signature===lastSignature)return false;lastSignature=signature;
  FARM_STUMP_DEFAULTS.forEach((definition,i)=>{const p=locations[definition.id],m=metadata.get(definition.id),hidden=selected===definition.id;m.collider.x=p.x;m.collider.z=p.z;
   dummy.position.set(p.x,m.height/2,p.z);dummy.rotation.set(0,rand(m.seed+2)*Math.PI*2,0);dummy.scale.set(m.radius,hidden?0:m.height,m.radius);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
   dummy.position.set(p.x,m.height+.007,p.z);dummy.rotation.set(0,rand(m.seed+4)*Math.PI*2,0);dummy.scale.set(m.radius,hidden?0:1,m.radius);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);
   for(let j=0;j<3;j++){const a=j*2.1+m.seed;dummy.position.set(p.x+Math.sin(a)*m.radius*.7,.045,p.z+Math.cos(a)*m.radius*.7);dummy.rotation.set(0,a,0);dummy.scale.set(.04,hidden?0:.045,.105);dummy.updateMatrix();roots.setMatrixAt(i*3+j,dummy.matrix)}
  });for(const mesh of [trunks,caps,roots]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}return true;
 }
 function carry(id){const m=metadata.get(id);if(!m)return null;const g=new T.Group();g.name='carried-fence-stump';g.userData.seasonalExclude=true;const trunk=new T.Mesh(trunkGeometry,barkMaterial),cap=new T.Mesh(capGeometry,cutMaterial);trunk.scale.set(m.radius,m.height,m.radius);trunk.position.y=m.height/2;cap.scale.set(m.radius,1,m.radius);cap.position.y=m.height+.007;g.add(trunk,cap);return g}
 sync();return {root,colliders,sync,carry};
}