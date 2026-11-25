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
 for(let i=0;i<3500&&sites.length<165;i++){
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

 // Three pigeons stroll and peck; they are decorative and never block vehicles.
 const birds=[],parts=[
  [0,.19,0,.13,.16,.22,'#9ba4a2'],[0,.36,.13,.09,.095,.1,'#657d78'],
  [0,.36,.23,.032,.025,.065,'#d1b889'],[-.105,.2,-.015,.035,.11,.17,'#626e72'],
  [.105,.2,-.015,.035,.11,.17,'#626e72'],[-.055,.055,.04,.018,.055,.025,'#ae816f'],[.055,.055,.04,.018,.055,.025,'#ae816f']
 ];
 for(let i=0;i<160&&birds.length<3;i++){const x=-9+random()*18,z=-4+random()*12;if(safe(x,z)&&pavement(x,z))birds.push({x,z,tx:x,tz:z,angle:random()*6.28,wait:random()*3,phase:random()*6.28})}
 const birdMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95});birdMat.userData.regionOwned=true;
 const mesh=new T.InstancedMesh(new T.SphereGeometry(1,8,6),birdMat,birds.length*parts.length);mesh.name='village-pigeons';mesh.frustumCulled=false;
 parts.forEach((p,j)=>birds.forEach((_,i)=>mesh.setColorAt(i*parts.length+j,color.set(p[6]))));region.dynamic.add(mesh);
 let elapsed=0;const previous=region.update;
 region.update=(dt,time)=>{previous(dt,time);elapsed+=dt;if(elapsed<.05)return;const step=Math.min(.15,elapsed);elapsed=0;
  birds.forEach((b,i)=>{
   let distance=Math.hypot(b.tx-b.x,b.tz-b.z);b.wait-=step;
   if(distance<.08&&b.wait<=0){b.wait=1.5+random()*3;for(let j=0;j<8;j++){const x=b.x+(random()-.5)*4,z=b.z+(random()-.5)*4;if(safe(x,z)&&pavement(x,z)){b.tx=x;b.tz=z;break}}}
   const moving=distance>.08;
   if(moving){const dx=(b.tx-b.x)/distance,dz=(b.tz-b.z)/distance,nx=b.x+dx*step*.48,nz=b.z+dz*step*.48;if(safe(nx,nz)){b.x=nx;b.z=nz;b.angle=Math.atan2(dx,dz);b.phase+=step*11}else{b.tx=b.x;b.tz=b.z}}
   const sn=Math.sin(b.angle),cs=Math.cos(b.angle),y=villageWalkHeight(b.x,b.z)+.05;
   parts.forEach((p,j)=>{const bob=moving?Math.sin(b.phase)*.014:0,peck=!moving&&j===1?Math.max(0,Math.sin(time*3+i))*.09:0;
    dummy.position.set(b.x+p[0]*cs+p[2]*sn,y+p[1]+bob-peck,b.z-p[0]*sn+p[2]*cs);dummy.rotation.set(0,b.angle,0);dummy.scale.set(p[3],p[4],p[5]);dummy.updateMatrix();mesh.setMatrixAt(i*parts.length+j,dummy.matrix);
   });
  });mesh.instanceMatrix.needsUpdate=true;
 };
 // Populate the instance matrices immediately, before the first rendered frame.
 region.update(.05,0);
}
