import * as T from './three.module.js';
import {villageWalkHeight,distanceToStream} from './village-layout.js?v=0.50';
import {colliderContains} from './scene-collisions.js?v=0.47';

/** Small, non-solid street life. Reused geometry keeps the extra draw calls bounded. */
export function addStreetDetails(region,pavement){
 let seed=54019;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const blocked=(x,z,r=.25)=>region.colliders.some(c=>colliderContains(c,x,z,r));
 const safe=(x,z)=>x>region.bounds[0]+1&&x<region.bounds[1]-1&&z>region.bounds[2]+1&&z<region.bounds[3]-1&&distanceToStream(x,z)>1.8&&!blocked(x,z);
 const sites=[];
 for(let i=0;i<5200&&sites.length<230;i++){
  const x=region.bounds[0]+random()*(region.bounds[1]-region.bounds[0]),z=region.bounds[2]+random()*(region.bounds[3]-region.bounds[2]),mark=pavement(x,z);
  if(!safe(x,z)||!mark||mark.kind==='road'||mark.kind==='plaza')continue;
  if(![[.5,0],[-.5,0],[0,.5],[0,-.5]].some(([dx,dz])=>!pavement(x+dx,z+dz)))continue;
  sites.push({x,z,y:villageWalkHeight(x,z)+.05,s:.65+random()*.65,a:random()*Math.PI*2});
 }
 const grassGeometry=new T.BufferGeometry(),vertices=[];
 for(let i=0;i<5;i++){
  const a=i*2.4,x=Math.sin(a)*.07,z=Math.cos(a)*.07,h=.14+(i%3)*.045;
  vertices.push(x-.025,0,z,x+.025,0,z,x+Math.sin(a)*.08,h,z+Math.cos(a)*.08);
 }
 grassGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));grassGeometry.computeVertexNormals();
 const grassMat=new T.MeshStandardMaterial({color:'#71834c',roughness:1,side:T.DoubleSide});grassMat.userData.regionOwned=true;
 const grass=new T.InstancedMesh(grassGeometry,grassMat,sites.length),dummy=new T.Object3D();
 grass.name='weeds-in-sidewalk-joints';grass.receiveShadow=true;
 sites.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.a,0);dummy.scale.setScalar(p.s);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix)});
 grass.computeBoundingSphere();region.dynamic.add(grass);
 const flowerSites=sites.filter((_,i)=>i%5===0),flowerMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.9});flowerMat.userData.regionOwned=true;
 const flowers=new T.InstancedMesh(new T.SphereGeometry(1,5,3),flowerMat,flowerSites.length*6),color=new T.Color();
 flowerSites.forEach((p,i)=>{for(let j=0;j<6;j++){const a=j*Math.PI*2/5;dummy.position.set(p.x+(j<5?Math.sin(a)*.043:0),p.y+.17*p.s,p.z+(j<5?Math.cos(a)*.043:0));dummy.scale.set(j<5?.034:.023,.018,j<5?.034:.023);dummy.updateMatrix();const n=i*6+j;flowers.setMatrixAt(n,dummy.matrix);flowers.setColorAt(n,color.set(j===5?'#d5a54d':['#eee3be','#c99eaf','#e3cea5'][i%3]))}});
 flowers.name='small-verge-flowers';flowers.computeBoundingSphere();region.dynamic.add(flowers);

 // Birds are supplied by the shared, timed wildlife encounters.
}
