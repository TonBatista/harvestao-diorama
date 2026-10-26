import {createSeasonalScenery} from './seasonal-scenery.js?v=0.23';
import {createSeasonalParticles} from './seasonal-particles.js?v=0.23';
import {propertyKey} from './transport-rules.js?v=0.23';
import {solveTrailer} from './trailer-physics.js?v=0.23';
import * as T from './three.module.js';
import {createTractor} from './tractor-art.js?v=0.23';
import {ANIMALS} from './animal-care.js?v=0.23';
import {createTransportDisplay} from './transport-art.js?v=0.23';
import {createRegionManager} from './region-manager.js?v=0.23';
import {terrainTexture} from './terrain-materials.js?v=0.23';
import {loadMiniatureMaterials,miniatureTexture,miniatureLens,contactTexture,soilEdgeTexture} from './miniature-materials.js?v=0.23';
import {artisanMaterial,cottage,canopyGeometry,meadowGeometry,treeCrown} from './art-direction.js?v=0.23';
import {FIELD,TILE,CROPS,frontTile} from './simulation.js?v=0.23';
import {createCropArt} from './crop-art.js?v=0.23';
import {createFarmer} from './farmer-art.js?v=0.23';
const seedGeo=new T.SphereGeometry(1,5,3);
const geo={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,16,12),cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,12),leaf:new T.SphereGeometry(1,8,5)};
const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.9}));return materials.get(c)}
function mesh(parent,g,color,x,y,z,sx=1,sy=sx,sz=sx){const m=new T.Mesh(g,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=Math.max(sx,sy,sz)>.12;m.receiveShadow=true;parent.add(m);return m}
const box=(p,c,x,y,z,sx,sy,sz)=>mesh(p,geo.box,c,x,y,z,sx,sy,sz),ball=(p,c,x,y,z,sx,sy=sx,sz=sx)=>mesh(p,geo.ball,c,x,y,z,sx,sy,sz),cyl=(p,c,x,y,z,r,h)=>mesh(p,geo.cylinder,c,x,y,z,r,h,r);
const rand=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
function texture(a,b,repeat){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=a;g.fillRect(0,0,256,256);for(let i=0;i<9000;i++){g.fillStyle=i%2?b:'#ffffff12';g.beginPath();g.ellipse(rand(i)*256,rand(i+999)*256,.3+rand(i+777)*2,.3+rand(i+444)*1.2,rand(i+111)*6,0,7);g.fill()}const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat,repeat);tex.colorSpace=T.SRGBColorSpace;return tex}
// Preserve indexed vertices while merging each visible region. This avoids
// temporary geometry clones and repeated vertex transforms when a crop changes.
function bake(group,cellSize=Infinity){
 group.updateMatrixWorld(true);const buckets=new Map(),preservedInstances=[];
 group.traverse(o=>{
  if(o.isInstancedMesh){preservedInstances.push({object:o,matrix:o.matrixWorld.clone()});return;}if(!o.isMesh)return;let owner=o;while(owner.parent&&owner.parent!==group)owner=owner.parent;
  const x=owner.matrixWorld.elements[12],z=owner.matrixWorld.elements[14],shadow=o.castShadow&&!o.material.userData.noShadow,key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize)+':'+o.material.id+':'+(shadow?1:0);
  let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket={material:o.material,shadow,objects:[]});bucket.objects.push(o);
 });
 const result=new T.Group(),normalMatrix=new T.Matrix3();
 for(const {material,shadow,objects} of buckets.values()){
  let vertexCount=0,indexCount=0;for(const o of objects){vertexCount+=o.geometry.attributes.position.count;indexCount+=o.geometry.index?.count||o.geometry.attributes.position.count}
  const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2),indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
  let vertexOffset=0,indexOffset=0;
  for(const o of objects){
   const g=o.geometry,p=g.attributes.position.array,n=g.attributes.normal?.array,uv=g.attributes.uv?.array,m=o.matrixWorld.elements;normalMatrix.getNormalMatrix(o.matrixWorld);const q=normalMatrix.elements,count=g.attributes.position.count;
   for(let i=0;i<count;i++){
    const j=i*3,k=(vertexOffset+i)*3,x=p[j],y=p[j+1],z=p[j+2];positions[k]=m[0]*x+m[4]*y+m[8]*z+m[12];positions[k+1]=m[1]*x+m[5]*y+m[9]*z+m[13];positions[k+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
    if(n){const nx=q[0]*n[j]+q[3]*n[j+1]+q[6]*n[j+2],ny=q[1]*n[j]+q[4]*n[j+1]+q[7]*n[j+2],nz=q[2]*n[j]+q[5]*n[j+1]+q[8]*n[j+2],length=Math.hypot(nx,ny,nz)||1;normals[k]=nx/length;normals[k+1]=ny/length;normals[k+2]=nz/length}
    if(uv){const v=(vertexOffset+i)*2;uvs[v]=uv[i*2];uvs[v+1]=uv[i*2+1]}
   }
   const sourceIndex=g.index?.array,indexLength=sourceIndex?sourceIndex.length:count;for(let i=0;i<indexLength;i++)indices[indexOffset+i]=vertexOffset+(sourceIndex?sourceIndex[i]:i);indexOffset+=indexLength;vertexOffset+=count;
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setAttribute('uv',new T.BufferAttribute(uvs,2));geometry.setIndex(new T.BufferAttribute(indices,1));geometry.computeBoundingSphere();
  const o=new T.Mesh(geometry,material);o.castShadow=shadow;o.receiveShadow=true;o.matrixAutoUpdate=false;result.add(o);
 }
 for(const {object,matrix} of preservedInstances){result.add(object);object.matrix.copy(matrix);matrix.decompose(object.position,object.quaternion,object.scale);object.matrixAutoUpdate=false;}result.updateMatrixWorld(true);result.matrixAutoUpdate=false;return result;
}
export async function createWorld(canvas,state){await loadMiniatureMaterials();const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});const maximumPixelRatio=Math.min(devicePixelRatio,matchMedia('(pointer: coarse)').matches?1.25:1.5);renderer.setPixelRatio(maximumPixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;let renderDirty=true,shadowElapsed=0;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;const lens=miniatureLens(renderer);
const scene=new T.Scene();scene.background=new T.Color('#a9b798');scene.fog=new T.FogExp2('#a9b798',.012);const camera=new T.OrthographicCamera(-10,10,10,-10,.1,100);const ambient=new T.HemisphereLight('#f5f2e8','#667657',1.18);scene.add(ambient);const sun=new T.DirectionalLight('#fff3df',3.25);sun.position.set(-10,19,9);sun.castShadow=true;const shadowSize=matchMedia('(pointer: coarse)').matches?1024:2048;sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:65});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=4;sun.shadow.blurSamples=8;scene.add(sun);scene.add(sun.target);
const fixed=new T.Group(),forest=new T.Group(),colliders=[],farmTrees=[];
const soilMap=miniatureTexture('earth',6),grassMap=miniatureTexture('moss',32);
for(const map of [soilMap,grassMap])map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const groundMaterial=new T.MeshStandardMaterial({map:grassMap,color:'#bbd2a2',roughness:1,bumpMap:grassMap,bumpScale:.09});
box(fixed,groundMaterial,0,-.22,0,70,.4,70);
const soilMaterial=new T.MeshStandardMaterial({map:soilMap,bumpMap:soilMap,bumpScale:.065,roughness:1,color:'#d7c7ac'});soilMaterial.userData.noShadow=true;groundMaterial.userData.noShadow=true;soilMaterial.userData.seasonSurface='soil';groundMaterial.userData.seasonSurface='ground';
const earthGeometry=new T.PlaneGeometry(16.8,16.8,128,128);earthGeometry.rotateX(-Math.PI/2);const ep=earthGeometry.attributes.position;
for(let i=0;i<ep.count;i++){const x=ep.getX(i),z=ep.getZ(i);ep.setY(i,.012*Math.sin(x*7.1+z*8.3)+.009*Math.sin(z*14.3-x*7)+.009*Math.sin(x*2.9-z*3.7))}earthGeometry.computeVertexNormals();mesh(fixed,earthGeometry,soilMaterial,.875,.035,3.875);
// Worn paths and individually set stepping stones.
function pathSurface(x,z,width,depth){const map=soilMap.clone();map.repeat.set(width/2.3,depth/2.3);const material=soilMaterial.clone();material.map=material.bumpMap=map;const path=new T.Mesh(new T.PlaneGeometry(width,depth),material);path.rotation.x=-Math.PI/2;path.position.set(x,.042,z);path.receiveShadow=true;fixed.add(path)}
pathSurface(0,-6.7,22,2.1);pathSurface(10,0,2.4,15);
for(let i=0;i<12;i++){const m=mesh(fixed,new T.IcosahedronGeometry(1,i%3?1:0),artisanMaterial(i%2?'#a6a994':'#969c87'),1+Math.sin(i)*.22,.045,-8+i*.48+Math.cos(i*3)*.055,.25+rand(i+22)*.10,.045+rand(i+18)*.025,.19+rand(i+25)*.07);m.rotation.y=i*.7;m.scale.x*=.85+rand(i)*.25}
function tree(x,z,size=1){farmTrees.push({x,z,scale:size,evergreen:false});const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);cyl(g,artisanMaterial('#a5987b','bark'),0,1,0,.20,2);for(let i=0;i<5;i++){const a=i*1.256;let root=ball(g,artisanMaterial('#a5987b','bark'),Math.sin(a)*.15,.065,Math.cos(a)*.15,.08,.065,.29);root.rotation.y=a}const crown=treeCrown(x*13+z*7);crown.position.y=2.55;g.add(crown);forest.add(g);colliders.push({x,z,r:.38*size})}
for(let i=0;i<19;i++)tree(-19+i*2.2,-13-rand(i)*2,1+rand(i+8)*.55);for(let i=0;i<11;i++){tree(-13-rand(i+17)*2,-8+i*2.6,1.1);tree(16+rand(i+9)*2,-7+i*2.8,.9+rand(i)*.4)}
// End grain follows irregular growth rings and radial hairline cracks.
const cutMap=document.createElement('canvas');cutMap.width=cutMap.height=256;const cq=cutMap.getContext('2d');
cq.fillStyle='#c6aa7c';cq.fillRect(0,0,256,256);
for(let i=0;i<3300;i++){cq.fillStyle=i%2?'#fff0cd15':'#79573612';cq.fillRect(rand(i+777)*256,rand(i+111)*256,1.5,1)}
for(let r=9;r<155;r+=6+rand(r)*4){cq.strokeStyle=r%2?'#82603d88':'#9b764b99';cq.lineWidth=.7+rand(r+1)*1.4;cq.beginPath();for(let k=0;k<=100;k++){const a=k*Math.PI*2/100,rr=r+Math.sin(a*3+r)*1.1+Math.sin(a*7-r)*.5,x=119+Math.cos(a)*rr,y=132+Math.sin(a)*rr*.96;k?cq.lineTo(x,y):cq.moveTo(x,y)}cq.stroke()}
for(let i=0;i<5;i++){const a=rand(i+882)*6.28;cq.strokeStyle='#65482b99';cq.lineWidth=.75;cq.beginPath();cq.moveTo(119+Math.cos(a)*(57+rand(i)*35),132+Math.sin(a)*(57+rand(i)*35));cq.lineTo(119+Math.cos(a)*155,132+Math.sin(a)*155);cq.stroke()}
const cutTexture=new T.CanvasTexture(cutMap);cutTexture.colorSpace=T.SRGBColorSpace;
const cutMaterial=new T.MeshStandardMaterial({map:cutTexture,bumpMap:cutTexture,bumpScale:.008,roughness:1});
function stump(x,z){
 const seed=x*31+z*67,height=.33+rand(seed)*.12,radius=.21+rand(seed+8)*.035;
 const bark=new T.CylinderGeometry(radius*.88,radius,height,15,3),bp=bark.attributes.position;
 for(let i=0;i<bp.count;i++){const xx=bp.getX(i),zz=bp.getZ(i),a=Math.atan2(zz,xx),factor=1+.045*Math.sin(a*7+seed)+.035*Math.sin(a*11-seed);bp.setX(i,xx*factor);bp.setZ(i,zz*factor)}bark.computeVertexNormals();
 const trunk=mesh(fixed,bark,artisanMaterial('#c7b89a','bark'),x,height/2,z);trunk.rotation.y=rand(seed+2)*6.28;
 const cap=mesh(fixed,new T.CylinderGeometry(radius*.89,radius*.89,.012,32),cutMaterial,x,height+.007,z);cap.rotation.y=rand(seed+4)*6.28;
 for(let j=0;j<3;j++){const a=j*2.1+seed,root=mesh(fixed,geo.ball,artisanMaterial('#bcaa8c','bark'),x+Math.sin(a)*radius*.7,.045,z+Math.cos(a)*radius*.7,.04,.045,.105);root.rotation.y=a}
}
for(let i=0;i<16;i++){stump(-7.8,-3+i);if(i<5||i>8)stump(9.6,-3+i)}
for(let i=0;i<16;i++){const x=-7.6+i*1.1;if(x>-.8&&x<2.5)continue;stump(x,-4.55)}
function fence(x,z,rot=0){let g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;for(const dx of [-1,1]){box(g,'#a48048',dx,.48,0,.16,.96,.17);mesh(g,geo.cone,'#c3a16b',dx,1.01,0,.12,.16,.12)}for(const y of [.38,.76])box(g,'#bd9c63',0,y,0,2.1,.13,.11);fixed.add(g)}
for(let i=0;i<11;i++)fence(-10+i*2,14);for(let i=0;i<7;i++)fence(-10,-1+i*2,Math.PI/2);
function building(x,z,w,d,color,roof){fixed.add(cottage(x,z,w,d,color,roof));colliders.push({x,z,w:w+.5,d:d+.5})}
building(1,-10,4.5,3.6,'#e1c79c','#a76b4e');building(-7.5,-9,3.8,3.2,'#b4966b','#617575');building(11,-8.5,3,2.9,'#d8bb83','#9a7848');
// Shipping crate, stone well and water.
const shipping=new T.Group();shipping.position.set(5.2,0,-6.3);box(shipping,artisanMaterial('#857456','wood'),0,.52,0,1.6,1.04,1.1);for(let j=0;j<4;j++){box(shipping,artisanMaterial('#c0a679','wood'),0,.15+j*.24,.57,1.7,.21,.08);box(shipping,artisanMaterial('#ae946b','wood'),.86,.15+j*.24,0,.08,.21,1.12)}box(shipping,artisanMaterial('#c5b287','wood'),0,1.08,0,1.85,.14,1.28);box(shipping,'#483b26',0,1.16,0,1.3,.025,.7);box(shipping,'#edd29c',0,.63,.625,.8,.36,.025);fixed.add(shipping);colliders.push({x:5.2,z:-6.3,w:1.8,d:1.3});
const well=new T.Group();well.position.set(11.6,0,-.8);for(let j=0;j<3;j++)for(let i=0;i<12;i++){let a=(i+(j%2)*.5)*Math.PI/6;let b=box(well,artisanMaterial(['#a4a693','#b2af9b','#beb9a3'][i%3],'stone'),Math.sin(a)*.72,.16+j*.24,Math.cos(a)*.72,.4,.22,.31);b.rotation.y=a}for(const x of [-.9,.9])box(well,'#755438',x,1.12,0,.13,2.24,.16);for(const side of [-1,1]){let roof=box(well,'#9d6747',side*.5,2.35,0,1.15,.12,1.7);roof.rotation.z=-side*.45}fixed.add(well);colliders.push({x:11.6,z:-.8,r:1});const waterMat=new T.MeshStandardMaterial({color:'#6baca5',roughness:.22,metalness:.15,transparent:true,opacity:.85});cyl(scene,waterMat,11.6,.18,-.8,.61,.04);
// Long blades, clover and small meadow flowers rendered in one instanced draw call.
const blade=meadowGeometry(),grassMaterial=new T.MeshStandardMaterial({color:'#acc779',roughness:1,side:T.DoubleSide});
grassMaterial.userData.seasonSurface='grass';const grassCells=new Map(),dummy=new T.Object3D(),grassColor=new T.Color();let k=0;
for(let i=0;k<30000&&i<150000;i++){
 const x=rand(i*3)*29-13,z=rand(i*3+1)*29-14;
 if(x>-7.55&&x<9.3&&z>-4.55&&z<12.3)continue;
 if(z>-7.8&&z<-5.6&&x>-11&&x<12)continue;
 if(x>8.8&&x<11.2&&z>-7.8&&z<7.5)continue;
 if(z<-7.6&&z>-12.3&&x>-10&&x<13)continue;
 const key=Math.floor(x/4)+':'+Math.floor(z/4);let cell=grassCells.get(key);if(!cell)grassCells.set(key,cell=[]);cell.push({i,x,z});k++;
}
const meadow=new T.Group();meadow.name='meadow-regions';
for(const cell of grassCells.values()){
 const grass=new T.InstancedMesh(blade,grassMaterial,cell.length);
 for(let j=0;j<cell.length;j++){const {i,x,z}=cell[j];dummy.position.set(x,-.015,z);dummy.rotation.set((rand(i+18)-.5)*.4,rand(i+30)*6,(rand(i+20)-.5)*.4);dummy.scale.set(.72+rand(i+28)*.55,.72+rand(i+29)*.68,.72+rand(i+31)*.55);dummy.updateMatrix();grass.setMatrixAt(j,dummy.matrix);grass.setColorAt(j,grassColor.setHSL(.25+rand(i)*.035,.60,.34+rand(i+2)*.14))}
 grass.computeBoundingSphere();grass.receiveShadow=true;grass.matrixAutoUpdate=false;meadow.add(grass);
}
scene.add(meadow);
for(let i=0;i<75;i++){const x=-9.5+rand(i*7)*1,z=-4+rand(i*7+1)*17;ball(fixed,i%3?'#ead694':'#b994be',x,.22,z,.065,.07,.065)}
for(let i=0;i<170;i++){const x=-7.3+rand(i+180)*16,z=rand(i+190)>.5?-4.1:12.2;if(rand(i+200)>.4){const pebble=ball(fixed,['#9b8a6c','#b09b74','#887c63'][i%3],x,.07,z+(rand(i+210)-.5)*.5,.045+rand(i+220)*.05,.035,.06);pebble.rotation.y=i}}
for(let i=0;i<100;i++){const x=-9+rand(i+240)*.8,z=-4+rand(i+250)*17;for(let j=0;j<3;j++){let leaf=mesh(fixed,geo.leaf,'#789545',x+Math.sin(j*2.1)*.07,.08,z+Math.cos(j*2.1)*.07,.07,.025,.1);leaf.rotation.y=j*2.1}}
// Low moss clusters soften the transition around the cultivated clearing.
const moss=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({map:miniatureTexture('moss',1),bumpMap:miniatureTexture('moss',1),bumpScale:.05,color:'#d2d7a6',roughness:1}),900);
for(let i=0;i<900;i++){const side=i%4,u=rand(i+601),j=(rand(i+602)-.5)*1.15;
const x=side<2?-7.5+u*16.7:(side===2?-7.5:9.25)+j;
const z=side<2?(side===0?-4.5:12.25)+j:-4.5+u*16.7;
dummy.position.set(x,.025,z);dummy.rotation.set(0,rand(i+604)*6,0);
const size=.025+rand(i+605)*.10;dummy.scale.set(size,.009+rand(i+606)*.022,size*(.4+rand(i+610)*.7));dummy.updateMatrix();moss.setMatrixAt(i,dummy.matrix);
moss.setColorAt(i,new T.Color().setHSL(.22+rand(i+607)*.035,.38,.42+rand(i+608)*.12));}
moss.material.userData.seasonSurface='grass';moss.receiveShadow=true;scene.add(moss);
const staticArt=bake(fixed);staticArt.name='static-art';scene.add(staticArt);const forestArt=bake(forest,8);forestArt.name='forest-regions';scene.add(forestArt);
let seasonalScenery=null;
const plots=new T.Group();scene.add(plots);const plotChunks=new Map();let plotBuilds=0;
const contactMaterial=new T.MeshBasicMaterial({map:contactTexture(),transparent:true,opacity:.23,depthWrite:false});
const shadowGeometry=new T.PlaneGeometry(1.05,1.05);shadowGeometry.rotateX(-Math.PI/2);
const cropShadows=new T.InstancedMesh(shadowGeometry,contactMaterial,144);cropShadows.renderOrder=1;scene.add(cropShadows);const shadowDummy=new T.Object3D();
const {cropModel,weedModel}=createCropArt();
const dry=new T.MeshStandardMaterial({map:miniatureTexture('earth',.55),roughness:1});dry.bumpMap=dry.map;dry.bumpScale=.075;dry.color.set('#9b886d');dry.alphaMap=soilEdgeTexture();dry.transparent=true;dry.depthWrite=false;dry.userData.noShadow=true;dry.userData.seasonSurface='soil';const wet=new T.MeshStandardMaterial({map:dry.map,bumpMap:dry.map,bumpScale:.025,color:'#8f8674',roughness:.76,alphaMap:dry.alphaMap,transparent:true,depthWrite:false});wet.userData.noShadow=true;wet.userData.seasonSurface='soil';
// Rounded soil mounds with shallow, continuous furrows.
const bedGeometry=new T.PlaneGeometry(1.18,1.18,12,12);bedGeometry.rotateX(-Math.PI/2);
const bedPositions=bedGeometry.attributes.position;
for(let i=0;i<bedPositions.count;i++){let x=bedPositions.getX(i),z=bedPositions.getZ(i);const cx=Math.max(0,Math.abs(x)-.45),cz=Math.max(0,Math.abs(z)-.45),len=Math.hypot(cx,cz);if(len>.14){x=Math.sign(x)*(.45+cx/len*.14);z=Math.sign(z)*(.45+cz/len*.14)}const edge=Math.max(0,1-Math.pow(Math.abs(x)/.59,8))*Math.max(0,1-Math.pow(Math.abs(z)/.59,8));bedPositions.setXYZ(i,x+Math.sin(z*37+x*11)*.015*(1-edge),.001+edge*(.064+.019*Math.cos(x*Math.PI*7)+.012*Math.sin(z*14+x*9)),z+Math.cos(x*29-z*13)*.015*(1-edge))}bedGeometry.computeVertexNormals();
function rebuild(){
 let shadowCount=0;
 for(const p of state.plots){if(!p.crop)continue;const growth=Math.min(1,p.age/CROPS[p.crop].days);if(growth<.15)continue;shadowDummy.position.set(FIELD.x+p.x*TILE,.087,FIELD.z+p.z*TILE);shadowDummy.scale.setScalar(.25+growth*.48);shadowDummy.updateMatrix();cropShadows.setMatrixAt(shadowCount++,shadowDummy.matrix)}
 cropShadows.count=shadowCount;cropShadows.instanceMatrix.needsUpdate=true;
 const regions=new Map();for(const p of state.plots){const key=Math.floor(p.x/4)+':'+Math.floor(p.z/4);let items=regions.get(key);if(!items)regions.set(key,items=[]);items.push(p)}
 let changed=false;
 for(const [key,items] of regions){
  const signature=items.map(p=>[p.x,p.z,p.tilled,p.wet,p.crop,p.age,p.obstacle].join(',')).join(';'),old=plotChunks.get(key);
  if(old?.signature===signature)continue;
  if(old){seasonalScenery?.release(old.art);plots.remove(old.art);old.art.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
  const g=new T.Group();for(const p of items){const x=FIELD.x+p.x*TILE,z=FIELD.z+p.z*TILE;if(p.tilled){mesh(g,bedGeometry,p.wet?wet:dry,x,.045,z);for(let i=0;i<9;i++){const seed=p.x*97+p.z*13+i;mesh(g,seedGeo,p.wet?'#66533b':'#8b6a45',x+(rand(seed)-.5)*.96,.083,z+(rand(seed+30)-.5)*.96,.018+rand(seed+50)*.018,.013,.025)}}if(p.crop)cropModel(g,p,x,z);if(p.obstacle==='stone'){const rock=mesh(g,new T.IcosahedronGeometry(1,2),artisanMaterial('#a4ab98','stone'),x,.21,z,.32,.26,.3);rock.rotation.y=p.x;ball(g,'#7d864f',x+.12,.23,z+.1,.13,.06,.1)}if(p.obstacle==='branch'){let b=cyl(g,artisanMaterial('#9f8d69','bark'),x,.11,z,.09,.7);b.rotation.z=1.35;b.rotation.y=.5;let b2=cyl(g,'#b59055',x+.15,.12,z+.15,.045,.38);b2.rotation.z=.9;b2.rotation.y=-.6}if(p.obstacle==='weed')weedModel(g,x,z)}
  const art=bake(g);art.name='plots-'+key;seasonalScenery?.bind(art,{filter:object=>object.material?.userData?.seasonSurface==='soil'});plots.add(art);plotChunks.set(key,{signature,art});plotBuilds++;changed=true;
 }
 for(const [key,old] of plotChunks)if(!regions.has(key)){seasonalScenery?.release(old.art);plots.remove(old.art);old.art.traverse(o=>{if(o.isMesh)o.geometry.dispose()});plotChunks.delete(key);changed=true}
 if(changed){renderDirty=true;renderer.shadowMap.needsUpdate=true}
}
rebuild();
const farmArt=new T.Group();farmArt.name="farm-art";for(const child of [...scene.children])if(child.isMesh||child.isGroup||child.isPoints)farmArt.add(child);scene.add(farmArt);scene.add(plots,cropShadows);
seasonalScenery=createSeasonalScenery({season:state.season});for(const {art} of plotChunks.values())seasonalScenery.bind(art,{filter:object=>object.material?.userData?.seasonSurface==='soil'});const seasonalParticles=createSeasonalParticles(scene,{coarse:matchMedia('(pointer: coarse)').matches});
const seasonalSkies=['#b6c6a1','#aec5ad','#c9b796','#d8e4e9'],seasonalSun=['#fff2df','#fff2d5','#ffdfa9','#dbe9ff'].map(c=>new T.Color(c)),seasonalGround=['#667657','#65734e','#89734d','#9caebd'];let seasonalArea=null;
function seasonalMesh(object){if(object.isInstancedMesh)return !!object.material.userData.seasonSurface;for(let p=object;p&&p!==seasonalArea;p=p.parent)if(p.name==='static-art'||p.name==='forest-regions'||p.name==='meadow-regions'||p.name==='farm-destinations'||p.name.endsWith('-static'))return true;return false}
function setSeasonalArea(next){seasonalScenery.setSeason(state.season);seasonalScenery.setIndoors(!!next.indoors);seasonalArea=next.id==='farm'?farmArt:next.root;if(!next.indoors)seasonalScenery.bind(seasonalArea,{filter:seasonalMesh});seasonalParticles.setArea({bounds:next.bounds,treePositions:next.id==='farm'?farmTrees:next.treePositions||[]});renderDirty=true}
// Refined art uses the same joint hierarchy and animation pivots.
const {farmer,body,head,eyes,scarf,tail,arms,legs,knees,feet}=createFarmer(scene);
const wrapAngle=angle=>T.MathUtils.euclideanModulo(angle+Math.PI,Math.PI*2)-Math.PI;state.player.angle=Number.isFinite(state.player.angle)?wrapAngle(state.player.angle):Math.PI;farmer.rotation.y=state.player.angle;
const waterHandleGeometry=new T.TorusGeometry(.15,.025,5,14);const equipment=new T.Group();arms[1].add(equipment);function toolModel(id){renderDirty=true;renderer.shadowMap.needsUpdate=true;equipment.clear();if(id==='hand'||id==='seed')return;if(id==='camera'){box(equipment,'#6d7b69',0,-.38,.13,.36,.23,.19);box(equipment,'#414b42',0,-.39,.245,.30,.15,.06);const lens=cyl(equipment,'#33413f',0,-.39,.30,.10,.10);lens.rotation.x=Math.PI/2;const glass=cyl(equipment,'#9fb8af',0,-.39,.357,.071,.012);glass.rotation.x=Math.PI/2;box(equipment,'#c5c0a7',.10,-.245,.13,.075,.035,.07);box(equipment,'#c9c1a2',-.11,-.29,.235,.065,.045,.018);return}if(id==='water'){cyl(equipment,'#6f9293',0,-.43,.15,.17,.29);const handle=new T.Mesh(waterHandleGeometry,mat('#9fb2a5'));handle.position.set(0,-.25,.15);equipment.add(handle);let spout=cyl(equipment,'#a3b7ab',0,-.4,.4,.035,.3);spout.rotation.x=1.1;ball(equipment,'#b8c5ae',0,-.33,.54,.09,.035,.07)}else{let h=cyl(equipment,'#a6824b',0,-.34,.3,.035,.85);h.rotation.x=Math.PI/2;if(id==='hoe')box(equipment,'#879390',0,-.35,.7,.27,.2,.055);if(id==='axe')box(equipment,'#8c9992',.03,-.34,.65,.31,.07,.24);if(id==='hammer')box(equipment,'#7c8782',0,-.34,.65,.4,.2,.22);if(id==='sickle'){let blade=box(equipment,'#bcc6ab',.1,-.34,.65,.37,.035,.08);blade.rotation.y=.5}}}toolModel(state.tool);
const playerShadow=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({map:contactTexture(),transparent:true,opacity:.30,depthWrite:false}));playerShadow.scale.set(.67,.67,.67);playerShadow.renderOrder=1;scene.add(playerShadow);
const carried=new T.Group();body.add(carried);let lastHeld=null;function heldModel(){renderDirty=true;renderer.shadowMap.needsUpdate=true;carried.clear();if(state.held){cropModel(carried,{crop:state.held,age:CROPS[state.held].days},0,0,true);carried.position.set(0,2.05,.08)}lastHeld=state.held}
const target=new T.Mesh(new T.PlaneGeometry(1.18,1.18),new T.MeshBasicMaterial({color:'#ffe6a1',transparent:true,opacity:.065,depthWrite:false,side:T.DoubleSide}));target.rotation.x=-Math.PI/2;target.position.y=.14;scene.add(target);const border=new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1.16,1.16)),new T.LineBasicMaterial({color:'#fff0ad',transparent:true,opacity:.55}));border.rotation.x=-Math.PI/2;border.position.y=.145;scene.add(border);
const pollenGeometry=new T.BufferGeometry(),pollenPosition=new Float32Array(120*3);for(let i=0;i<120;i++){pollenPosition[i*3]=rand(i+301)*28-14;pollenPosition[i*3+1]=.4+rand(i+401)*3;pollenPosition[i*3+2]=rand(i+501)*26-12}pollenGeometry.setAttribute('position',new T.BufferAttribute(pollenPosition,3));const pollen=new T.Points(pollenGeometry,new T.PointsMaterial({color:'#fff0b5',size:.035,transparent:true,opacity:.5,depthWrite:false}));farmArt.add(pollen);
const particles=[];function effect(type){pendingEffect={type,delay:.36}}
function emitEffect(type){const p=frontTile(state);const x=p?FIELD.x+p.x*TILE:state.player.x,z=p?FIELD.z+p.z*TILE:state.player.z;for(let i=0;i<12;i++){const m=ball(scene,type==='water'?'#bbebed':type==='leaf'?'#94ac51':'#c4a36d',x,.5,z,.035);particles.push({m,v:new T.Vector3((rand(i+t)*2-1)*1.2,.6+rand(i+2)*1.3,(rand(i+3)*2-1)*1.2),life:.65})}}
let zoomValue=1,zoomTarget=1;const minimumZoom=.7,maximumZoom=3.4;
function setZoom(value){if(!Number.isFinite(value))return zoomTarget;const next=T.MathUtils.clamp(value,minimumZoom,maximumZoom);if(next!==zoomTarget){zoomTarget=next;renderDirty=true}return zoomTarget}
let regions=null;let viewHeight=12,t=0,actionTime=0,actionTool=state.tool,pendingEffect=null,gait=0,isRunning=true,motion=0,travel=0,runBlend=0,speed=0;const velocity=new T.Vector3(),desired=new T.Vector3(),displacement=new T.Vector3(),deltaVelocity=new T.Vector3(),playerTarget=new T.Vector3(),look=new T.Vector3();const actionKeys=[[0,0],[.22,-2.4],[.38,-2.4],[.52,-.65],[.72,-.75],[1,0]];const follow=new T.Vector3(state.player.x,0,state.player.z),offset=new T.Vector3(9,13,9),right=new T.Vector3(.707,0,-.707),down=new T.Vector3(.707,0,.707);function resize(){renderDirty=true;const a=innerWidth/innerHeight;viewHeight=(regions?.active.viewHeight||12)*(a<.7?1.125:1);camera.left=-viewHeight*a/2;camera.right=viewHeight*a/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}resize();addEventListener('resize',resize);
const tractor=createTractor();scene.add(tractor.root);let driving=false,vehicleTravel=0,lastVehicleCargo=null,lastTrailerAttached=false;
function tractorData(){const previous=state.tractor;if(!previous||typeof previous!=='object'||Array.isArray(previous))state.tractor={};const d=state.tractor;if(!Number.isFinite(d.x))d.x=11.6;if(!Number.isFinite(d.z))d.z=4.7;if(!Number.isFinite(d.angle))d.angle=Math.PI;if(typeof d.area!=='string')d.area='farm';d.cutter=d.cutter===true;d.trailer=d.trailer===true;return d}
tractorData();const transportedHerd=createTransportDisplay(state);scene.add(transportedHerd.root);
function nearTractor(){const d=tractorData();return regions&&d.area===regions.active.id&&(d.area!=='homestead'||d.lotId===state.homesteads?.selected)&&Math.hypot(state.player.x-d.x,state.player.z-d.z)<2.05}
function toggleTractor(){const d=tractorData();if(driving){const candidates=[[-1.25,0],[1.25,0],[0,1.6],[0,-1.6]];let point=null;for(const [x,z]of candidates){const a=d.angle,p=[d.x+x*Math.cos(a)+z*Math.sin(a),d.z-x*Math.sin(a)+z*Math.cos(a)];if(!blocked(...p)){point=p;break}}if(!point)return {changed:false,message:'Estacione em um espaço livre para descer.'};driving=false;state.player.x=point[0];state.player.z=point[1];stop();renderDirty=true;renderer.shadowMap.needsUpdate=true;return {changed:true,message:'Você desceu do trator. Aproxime-se e use B para dirigir.'}}
if(!nearTractor())return {changed:false,message:'Aproxime-se do trator estacionado na fazenda.'};if(state.held||state.carryingHay)return {changed:false,message:'Guarde o que está nas mãos antes de subir no trator.'};driving=true;state.player.x=d.x;state.player.z=d.z;state.player.angle=d.angle;actionTime=0;stop();renderDirty=true;renderer.shadowMap.needsUpdate=true;return {changed:true,message:'No trator! Direcional dirige · A liga/desliga a roçadeira · B desce.'}}
function vehicleAction(){const d=tractorData();if(!driving)return {changed:false,message:'Entre no trator para usar a roçadeira.'};d.cutter=!d.cutter;renderDirty=true;return {changed:true,message:d.cutter?'Roçadeira ligada. Passe sobre as ervas; pedras e galhos precisam de ferramentas.':'Roçadeira desligada.'}}
function toggleTrailer(){const d=tractorData();if(!driving&&!nearTractor())return {changed:false,message:'Aproxime-se do trator para acoplar a carretinha.'};if(d.cargo&&!d.trailer)return {changed:false,message:'Descarregue o animal antes de desacoplar.'};if(d.cargo&&d.trailer)return {changed:false,message:'Descarregue o animal antes de desacoplar.'};d.trailer=!d.trailer;renderDirty=true;renderer.shadowMap.needsUpdate=true;return {changed:true,message:d.trailer?'Carretinha acoplada. Leve um animal do celeiro até outro pasto.':'Carretinha desacoplada.'}}
function updateTractor(distance){const d=tractorData();if(driving){d.x=state.player.x;d.z=state.player.z;d.angle=state.player.angle;d.area=regions?.active.id||'farm';d.lotId=d.area==='homestead'?state.homesteads?.selected:null}tractor.root.visible=d.area===(regions?.active.id||'farm')&&(d.area!=='homestead'||d.lotId===state.homesteads?.selected);tractor.root.position.set(d.x,0,d.z);tractor.root.rotation.y=d.angle;
 if(tractor.trailer.parent!==scene)scene.add(tractor.trailer);let trailerDistance=0;if(d.trailer){const reset=!lastTrailerAttached||d.trailerArea!==d.area||d.trailerLot!==d.lotId,p=solveTrailer(d,{x:d.trailerX,z:d.trailerZ,angle:d.trailerAngle},reset);d.trailerX=p.x;d.trailerZ=p.z;d.trailerAngle=p.angle;d.trailerArea=d.area;d.trailerLot=d.lotId;trailerDistance=p.wheelTravel;tractor.trailer.visible=tractor.root.visible}else{if(!Number.isFinite(d.trailerX))d.trailerX=11.6;if(!Number.isFinite(d.trailerZ))d.trailerZ=7.8;if(!Number.isFinite(d.trailerAngle))d.trailerAngle=Math.PI;tractor.trailer.visible=(d.trailerArea||'farm')===(regions?.active.id||'farm')&&(d.trailerArea!=='homestead'||d.trailerLot===state.homesteads?.selected)}tractor.trailer.position.set(d.trailerX,0,d.trailerZ);tractor.trailer.rotation.y=d.trailerAngle;lastTrailerAttached=d.trailer;tractor.animate(distance,d.cutter,trailerDistance);
 const animal=ANIMALS.find(a=>a.id===d.cargo);if(lastVehicleCargo!==d.cargo){tractor.setCargo(animal||(d.cargo?{species:'cow'}:null));lastVehicleCargo=d.cargo}if(driving&&d.cutter&&(regions?.isFarm||regions?.active.id==='homestead')){let changed=false;for(const p of state.plots)if(p.obstacle==='weed'&&Math.hypot(FIELD.x+p.x*TILE-d.x,FIELD.z+p.z*TILE-d.z)<1.18){p.obstacle=null;changed=true}if(changed)rebuild()}}
function blocked(x,z){for(const c of transportedHerd.colliders||[])if(Math.hypot(x-c.x,z-c.z)<c.r+(driving?.6:.23))return true;if(regions&&!regions.isFarm){if(!regions.fits(regions.active,x,z))return true;if(regions.active.id!=='homestead')return false}else if(x<-10||x>14||z<-13||z>13)return true;for(const c of (regions&&!regions.isFarm?[]:colliders)){if(c.r&&Math.hypot(x-c.x,z-c.z)<c.r+.23)return true;if(c.w&&Math.abs(x-c.x)<c.w/2+.2&&Math.abs(z-c.z)<c.d/2+.2)return true}for(const p of state.plots){if((!p.obstacle||(driving&&tractorData().cutter&&p.obstacle==='weed'))&&!(p.crop&&p.age>=CROPS[p.crop].days*.5))continue;const px=FIELD.x+p.x*TILE,pz=FIELD.z+p.z*TILE;if(Math.abs(x-px)<.44&&Math.abs(z-pz)<.44)return true}return false}
function stop(){velocity.set(0,0,0);speed=0;}
function move(dx,dy,dt,run){
 isRunning=run;if(actionTime>0){stop();return false}if(dt<=0)return false;
 const oldX=state.player.x,oldZ=state.player.z;
 desired.copy(right).multiplyScalar(dx).addScaledVector(down,dy);
 const strength=Math.min(1,desired.length()),active=strength>.045;
 if(active){desired.normalize();const angle=Math.atan2(desired.x,desired.z);if(driving){const delta=wrapAngle(angle-state.player.angle);state.player.angle=wrapAngle(state.player.angle+T.MathUtils.clamp(delta,-dt*2.6,dt*2.6));desired.set(Math.sin(state.player.angle),0,Math.cos(state.player.angle)).multiplyScalar(6.3*strength*(1-Math.min(.65,Math.abs(delta)*.22)))}else{desired.multiplyScalar((run?4.6:2.4)*strength);state.player.angle=angle}}else desired.set(0,0,0);
 // Exact exponential integration keeps acceleration consistent at 30, 60 and 120 fps.
 const rate=active?(driving?5:14):(driving?8:30),decay=Math.exp(-rate*dt);
 displacement.copy(desired).multiplyScalar(dt).addScaledVector(deltaVelocity.copy(velocity).sub(desired),(1-decay)/rate);
 velocity.lerp(desired,1-decay);
 if(!active&&velocity.length()<.025)velocity.set(0,0,0);
 const nx=oldX+displacement.x,nz=oldZ+displacement.z;
 if(!blocked(nx,oldZ))state.player.x=nx;else velocity.x=0;
 if(!blocked(state.player.x,nz))state.player.z=nz;else velocity.z=0;
 const distance=Math.hypot(state.player.x-oldX,state.player.z-oldZ);
 speed=distance/dt;travel+=distance;if(driving)vehicleTravel+=distance;
 const blend=T.MathUtils.smoothstep(speed,2.1,4.2);
 gait+=distance/(1.05+blend*.47)*Math.PI*2;
 return distance>1e-6;
}
function update(dt,moving){if(dt===0&&!renderDirty&&lastHeld===state.held)return;t+=dt;alertTime=Math.max(0,alertTime-dt);alertSprite.visible=alertTime>0;if(alertTime>0){alertSprite.position.set(state.player.x,1.82+Math.sin((1.45-alertTime)*5)*.035,state.player.z);const pop=Math.min(1,(1.45-alertTime)*9);alertSprite.scale.set(.32*pop,.48*pop,1);alertMaterial.opacity=Math.min(1,alertTime*4)}regions?.update(dt,t);transportedHerd.update(dt,t,regions?.active.id);equipment.visible=!driving&&(state.tool==='camera'||!regions||regions.isFarm||regions.active.id==='homestead');pollen.visible=state.season===0||state.season===1;pollen.rotation.y=Math.sin(t*.05)*.025;pollen.position.y=Math.sin(t*.3)*.05;actionTime=Math.max(0,actionTime-dt);if(pendingEffect){pendingEffect.delay-=dt;if(pendingEffect.delay<=0){emitEffect(pendingEffect.type);pendingEffect=null}}updateTractor(vehicleTravel);vehicleTravel=0;farmer.position.set(state.player.x-(driving?Math.sin(state.player.angle)*.50:0),driving?.52:.05,state.player.z-(driving?Math.cos(state.player.angle)*.50:0));playerShadow.position.set(state.player.x,.06,state.player.z);if(!Number.isFinite(state.player.angle))state.player.angle=Number.isFinite(farmer.rotation.y)?farmer.rotation.y:Math.PI;if(!Number.isFinite(farmer.rotation.y))farmer.rotation.y=state.player.angle;const diff=wrapAngle(state.player.angle-farmer.rotation.y);farmer.rotation.y=wrapAngle(farmer.rotation.y+diff*(1-Math.exp(-dt*18)));motion+=((moving?Math.min(1,speed/2.4):0)-motion)*(1-Math.exp(-dt*20));runBlend+=(T.MathUtils.smoothstep(speed,2.1,4.2)-runBlend)*(1-Math.exp(-dt*12));const bounce=(1-Math.cos(gait*2))*(.006+runBlend*.012)*motion;
const blinkPhase=t%4.7,blink=blinkPhase>4.49?1-Math.sin((blinkPhase-4.49)/.21*Math.PI)*.94:1;for(const eye of eyes)eye.scale.y=.083*blink;body.position.y=bounce+Math.sin(t*2.1)*.005*(1-motion);body.rotation.x=(.035+runBlend*.065)*motion;head.rotation.z=Math.sin(gait)*.018*motion;
const actionProgress=1-actionTime/.72,hit=actionTime>0?Math.sin(Math.max(0,(actionProgress-.24)/.76)*Math.PI):0;
body.scale.set(1+hit*.018,1-hit*.025,1+hit*.018);if(actionTime>0&&(actionTool==='hand'||actionTool==='seed'))body.rotation.x=Math.sin(actionProgress*Math.PI)*.28;
for(let i=0;i<2;i++){const cycle=((gait/(Math.PI*2)+i*.5)%1+1)%1,stance=.62-runBlend*.14,stride=.20+runBlend*.08;
 const stancePhase=Math.min(1,cycle/stance),swingPhase=Math.max(0,(cycle-stance)/(1-stance));
 const u=swingPhase,m=-2*(1-stance)/stance;
 const swing=-1+6*u*u-4*u*u*u+m*(2*u*u*u-3*u*u+u);
 const footZ=stride*(cycle<stance?1-2*stancePhase:swing)*motion;
 const lift=(cycle<stance?0:Math.sin(swingPhase*Math.PI)**2*(.10+runBlend*.07))*motion;
 const fy=-.43-bounce+lift,fz=footZ-.015,L1=.22,L2=.23,dist=Math.min(.449,Math.hypot(fy,fz));
 const bend=Math.acos(Math.max(-1,Math.min(1,(dist*dist-L1*L1-L2*L2)/(2*L1*L2))));
 const hip=Math.atan2(-fz,-fy)-Math.atan2(L2*Math.sin(bend),L1+L2*Math.cos(bend));
 legs[i].rotation.x=hip;knees[i].rotation.x=bend;feet[i].rotation.x=-hip-bend-body.rotation.x;
 let arm=-Math.sin(gait+i*Math.PI)*(.35+runBlend*.3)*motion;
if(actionTime>0){if(actionTool==='water')arm=-.9*Math.sin(Math.min(1,actionProgress/.2)*Math.PI/2)*Math.min(1,(1-actionProgress)/.2);
else if(actionTool==='camera')arm=-1.48*Math.sin(Math.min(1,actionProgress/.20)*Math.PI/2)*Math.min(1,(1-actionProgress)/.20);
else if(actionTool==='hand'||actionTool==='seed')arm=-1.1*Math.sin(actionProgress*Math.PI);
else{const keys=actionKeys;let at=keys.findIndex(k=>k[0]>=actionProgress);at=Math.max(1,at);const a=keys[at-1],b=keys[at],t=(actionProgress-a[0])/(b[0]-a[0]);arm=a[1]+(b[1]-a[1])*t;if(i===0)arm*=.78;}}
arms[i].rotation.x=state.held?-2.3:state.carryingHay?-1.12:state.tool==='camera'?Math.min(-.82,arm):arm;
 arms[i].rotation.z=(i===0?1:-1)*.06;}
if(driving){body.position.y=0;body.rotation.x=0;for(let i=0;i<2;i++){legs[i].rotation.x=-1.25;knees[i].rotation.x=1.45;feet[i].rotation.x=-.20;arms[i].rotation.x=-.95;arms[i].rotation.z=(i===0?1:-1)*-.07}}
scarf.rotation.y=Math.sin(gait-.4)*.07*motion;tail.rotation.x=Math.sin(gait-.5)*.15*motion;
if(lastHeld!==state.held)heldModel();let p=(!driving&&(!regions||regions.isFarm||regions.active.id==='homestead'))?frontTile(state):null;target.visible=border.visible=!!p;if(p){target.position.x=border.position.x=FIELD.x+p.x*TILE;target.position.z=border.position.z=FIELD.z+p.z*TILE}for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.v.y-=dt*3;q.m.position.addScaledVector(q.v,dt);q.m.scale.multiplyScalar(.97);if(q.life<0){scene.remove(q.m);particles.splice(i,1)}}if(Math.abs(zoomValue-zoomTarget)>.0001){zoomValue+=(zoomTarget-zoomValue)*(1-Math.exp(-dt*10));if(Math.abs(zoomValue-zoomTarget)<.001)zoomValue=zoomTarget;camera.zoom=zoomValue;camera.updateProjectionMatrix()}follow.lerp(playerTarget.set(state.player.x,0,state.player.z),1-Math.exp(-dt*8));const closeView=T.MathUtils.smoothstep(zoomValue,1,2.8);look.copy(follow);look.y+=.2+.55*closeView;look.z-=.9*(1-closeView);camera.position.copy(look).add(offset);camera.lookAt(look);const evening=Math.max(0,Math.min(1,(state.minutes-960)/360));sun.intensity=3.25-evening*2.85;sun.color.set(state.weather==='rain'?'#e4e9d9':evening>.3?'#ffc08b':'#fff2df');ambient.intensity=state.weather==='rain'?1.25:1.18-evening*.55;scene.background.set(evening>.8?'#65747d':'#a9b798');if(regions?.indoors){sun.intensity=1.55;sun.color.set("#ffe4b5");ambient.intensity=1.6;scene.background.set("#b8ac94");scene.fog.density=0}else scene.fog.density=.012;shadowElapsed+=dt;const shadowInterval=(moving||motion>.05||actionTime>0)?1/30:.5;if(shadowElapsed>=shadowInterval){renderer.shadowMap.needsUpdate=true;shadowElapsed%=shadowInterval}if(renderer.shadowMap.needsUpdate){const texel=28/shadowSize,cx=Math.round(state.player.x/texel)*texel,cz=Math.round(state.player.z/texel)*texel;sun.position.set(cx-10,19,cz+9);sun.target.position.set(cx,0,cz)}seasonalScenery.setSeason(state.season);seasonalScenery.setIndoors(!!regions?.indoors);seasonalParticles.update(dt,{season:state.season,indoors:!!regions?.indoors,player:state.player});if(!regions?.indoors){scene.background.set(evening>.8?'#687786':seasonalSkies[state.season]);scene.fog.color.copy(scene.background);sun.color.lerp(seasonalSun[state.season],.25);ambient.groundColor.set(seasonalGround[state.season]);}else ambient.groundColor.set('#667657');lens.render(scene,camera);renderDirty=false}
let frameAverage=16.7,slowSeconds=0,fastSeconds=0,qualityCooldown=0;
function observeFrame(milliseconds){
 if(!Number.isFinite(milliseconds)||milliseconds<1)return;const seconds=Math.min(.25,milliseconds/1000),sample=Math.min(100,milliseconds);
 frameAverage+=(sample-frameAverage)*.08;qualityCooldown=Math.max(0,qualityCooldown-seconds);
 slowSeconds=frameAverage>27?slowSeconds+seconds:0;fastSeconds=frameAverage<18.5?fastSeconds+seconds:0;
 const ratio=renderer.getPixelRatio(),floor=Math.min(.8,maximumPixelRatio);
 if(!qualityCooldown&&slowSeconds>1.6&&ratio>floor+.01){renderer.setPixelRatio(Math.max(floor,Math.round((ratio-.15)*100)/100));slowSeconds=fastSeconds=0;qualityCooldown=5;renderDirty=true}
 else if(!qualityCooldown&&fastSeconds>10&&ratio<maximumPixelRatio-.01){renderer.setPixelRatio(Math.min(maximumPixelRatio,Math.round((ratio+.1)*100)/100));slowSeconds=fastSeconds=0;qualityCooldown=10;renderDirty=true}
}
regions=createRegionManager({scene,state,bake,farmRoot:farmArt,farmColliders:colliders,onLeave(previous){seasonalScenery.release(previous.id==='farm'?farmArt:previous.root)},onChange(next){setSeasonalArea(next);transportedHerd.setBarnResidents?.(next.residentIds||[]);if(driving){if(next.indoors){driving=false;tractorData().cutter=false}else{const d=tractorData();d.area=next.id;d.lotId=next.id==='homestead'?state.homesteads?.selected:null;d.x=state.player.x;d.z=state.player.z;d.angle=state.player.angle}}plots.visible=cropShadows.visible=next.id==='farm'||next.id==='homestead';rebuild();stop();follow.set(state.player.x,0,state.player.z);farmer.rotation.y=state.player.angle;pendingEffect=null;actionTime=0;for(const q of particles)scene.remove(q.m);particles.length=0;renderDirty=true;renderer.shadowMap.needsUpdate=true;resize()}});resize();
function animalCanWalk(x,z,radius=.5,id,area,property){if(property&&property!==propertyKey(state,area))return true;if(!regions||area!==regions.active.id||area==='barn')return true;const b=regions.active.bounds;if(x<b[0]+radius||x>b[1]-radius||z<b[2]+radius||z>b[3]-radius)return false;for(const c of regions.active.colliders){if(c.r&&Math.hypot(x-c.x,z-c.z)<c.r+radius)return false;if(c.w&&Math.abs(x-c.x)<c.w/2+radius&&Math.abs(z-c.z)<c.d/2+radius)return false}const reach=.48+radius,minCol=Math.max(0,Math.ceil((x-reach-FIELD.x)/TILE)),maxCol=Math.min(FIELD.cols-1,Math.floor((x+reach-FIELD.x)/TILE)),minRow=Math.max(0,Math.ceil((z-reach-FIELD.z)/TILE)),maxRow=Math.min(FIELD.rows-1,Math.floor((z+reach-FIELD.z)/TILE));for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++){const p=state.plots[row*FIELD.cols+col];if(p&&(p.crop||p.obstacle)&&Math.abs(x-(FIELD.x+p.x*TILE))<reach&&Math.abs(z-(FIELD.z+p.z*TILE))<reach)return false}if(!state.herdRoutes?.[id]&&Math.hypot(x-state.player.x,z-state.player.z)<radius+.30)return false;return true}
transportedHerd.setWalkability?.(animalCanWalk);
const alertCanvas=document.createElement('canvas');alertCanvas.width=64;alertCanvas.height=96;const aq=alertCanvas.getContext('2d');aq.fillStyle='#f7e3ac';aq.beginPath();aq.roundRect(6,4,52,76,23);aq.fill();aq.strokeStyle='#9e7d4e';aq.lineWidth=3;aq.stroke();aq.fillStyle='#725735';aq.font='bold 61px Georgia';aq.textAlign='center';aq.fillText('!',32,65);const alertMap=new T.CanvasTexture(alertCanvas),alertMaterial=new T.SpriteMaterial({map:alertMap,transparent:true,depthTest:false,toneMapped:false}),alertSprite=new T.Sprite(alertMaterial);alertSprite.visible=false;alertSprite.renderOrder=25;scene.add(alertSprite);let alertTime=0;function showAlert(kind='bird'){alertTime=1.45;alertSprite.visible=true;alertMaterial.color.set(kind==='danger'?'#f2c7a4':'#fff4cf');renderDirty=true}
const photographPosition=new T.Vector3(),photographClip=new T.Vector3(),photoCanvas=document.createElement('canvas');photoCanvas.width=384;photoCanvas.height=256;const photoContext=photoCanvas.getContext('2d');
function photoTargets(){const subjects=[...(regions?.active.photoSubjects||[]),...transportedHerd.photoSubjects],result=[];for(const subject of subjects){if(!subject.object)continue;let visible=true;for(let o=subject.object;o;o=o.parent)if(!o.visible){visible=false;break}if(!visible)continue;subject.object.getWorldPosition(photographPosition);photographPosition.y+=subject.offsetY||0;const distance=Math.hypot(photographPosition.x-state.player.x,photographPosition.z-state.player.z);if(distance>10)continue;photographClip.copy(photographPosition).project(camera);const screenX=(photographClip.x+1)/2,screenY=(1-photographClip.y)/2,inFrame=photographClip.z>=-1&&photographClip.z<=1&&screenX>.04&&screenX<.96&&screenY>.06&&screenY<.93,centering=Math.max(0,1-Math.hypot(screenX-.5,screenY-.5)*1.5),score=Math.round(100*(centering*.65+Math.max(0,1-distance/10)*.35));result.push({id:subject.id,speciesId:subject.speciesId,name:subject.name,area:subject.area||regions.active.id,screenX,screenY,distance,inFrame,score})}return result}
function capturePhoto(subject){lens.render(scene,camera);const source=renderer.domElement,w=source.width,h=source.height,cropW=Math.min(w,h*1.5)*.75,cropH=cropW*2/3,cx=Math.max(cropW/2,Math.min(w-cropW/2,(subject?.screenX??.5)*w)),cy=Math.max(cropH/2,Math.min(h-cropH/2,(subject?.screenY??.5)*h));photoContext.drawImage(source,cx-cropW/2,cy-cropH/2,cropW,cropH,0,0,384,256);return photoCanvas.toDataURL('image/jpeg',.55)}
function pickSign(clientX,clientY){const rect=canvas.getBoundingClientRect();let best=null,score=Infinity;for(const point of regions.active.signs||[]){const s=point.sign;if(!s)continue;const corners=[];for(const side of[-1,1])for(const up of[-1,1]){const dx=side*s.width/2,v=new T.Vector3(s.x+Math.cos(s.rotation)*dx,s.y+up*s.height/2,s.z-Math.sin(s.rotation)*dx).project(camera);if(v.z>=-1&&v.z<=1)corners.push([rect.left+(v.x+1)*rect.width/2,rect.top+(1-v.y)*rect.height/2])}if(corners.length!==4)continue;const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),left=Math.min(...xs)-9,right=Math.max(...xs)+9,top=Math.min(...ys)-9,bottom=Math.max(...ys)+9;if(clientX>=left&&clientX<=right&&clientY>=top&&clientY<=bottom){const d=Math.hypot(clientX-(left+right)/2,clientY-(top+bottom)/2);if(d<score){best=point;score=d}}}return best}
return {get seasonVisual(){return seasonalScenery.inspect()},pickSign,toggleTractor,vehicleAction,toggleTrailer,get driving(){return driving},get tractorStatus(){return {...tractorData(),driving}},renderer,scene,camera,photoTargets,capturePhoto,showAlert,observeFrame,setZoom,travel:(id,spawn,restore=false)=>regions.travel(id,spawn,restore),nearby:()=>{let point=regions.nearby(),distance=point?Math.hypot(state.player.x-point.x,state.player.z-point.z):Infinity;for(const candidate of transportedHerd.interactions){const d=Math.hypot(state.player.x-candidate.x,state.player.z-candidate.z);if(d<(candidate.radius||1.6)&&d<distance){point=candidate;distance=d}}return point||(driving||nearTractor()?{type:'tractor',label:driving?'Descer do trator':'Dirigir trator'}:null)},get area(){return regions.active.id},get region(){return regions.active},get destinations(){return regions.destinations},get zoom(){return {value:zoomValue,target:zoomTarget,min:minimumZoom,max:maximumZoom}},get performance(){return {pixelRatio:renderer.getPixelRatio(),maximumPixelRatio,frameAverage,plotBuilds,plotRegions:plotChunks.size,grassRegions:grassCells.size}},get animation(){return {moving:motion>.05,running:isRunning,phase:gait,travel,speed,actionTime,hips:legs.map(l=>l.rotation.x),knees:knees.map(l=>l.rotation.x)}},rebuild,move,stop,update,toolModel,effect,act(id=state.tool){stop();actionTool=id;actionTime=.72},locations:{house:{x:.5,z:-7.5},shipping:{x:5.2,z:-5.3},well:{x:11.6,z:.4}},get busy(){return actionTime>0}};
}
