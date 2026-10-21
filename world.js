import * as T from './three.module.js';
import {terrainTexture} from './terrain-materials.js';
import {loadMiniatureMaterials,miniatureTexture,miniatureLens,contactTexture,soilEdgeTexture} from './miniature-materials.js';
import {artisanMaterial,cottage,canopyGeometry,meadowGeometry,treeCrown} from './art-direction.js';
import {FIELD,TILE,CROPS,frontTile} from './simulation.js';
import {createCropArt} from './crop-art.js';
import {createFarmer} from './farmer-art.js';
const seedGeo=new T.SphereGeometry(1,5,3);
const geo={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,16,12),cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,12),leaf:new T.SphereGeometry(1,8,5)};
const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.9}));return materials.get(c)}
function mesh(parent,g,color,x,y,z,sx=1,sy=sx,sz=sx){const m=new T.Mesh(g,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const box=(p,c,x,y,z,sx,sy,sz)=>mesh(p,geo.box,c,x,y,z,sx,sy,sz),ball=(p,c,x,y,z,sx,sy=sx,sz=sx)=>mesh(p,geo.ball,c,x,y,z,sx,sy,sz),cyl=(p,c,x,y,z,r,h)=>mesh(p,geo.cylinder,c,x,y,z,r,h,r);
const rand=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
function texture(a,b,repeat){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=a;g.fillRect(0,0,256,256);for(let i=0;i<9000;i++){g.fillStyle=i%2?b:'#ffffff12';g.beginPath();g.ellipse(rand(i)*256,rand(i+999)*256,.3+rand(i+777)*2,.3+rand(i+444)*1.2,rand(i+111)*6,0,7);g.fill()}const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(repeat,repeat);tex.colorSpace=T.SRGBColorSpace;return tex}
function bake(group){group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);let a=buckets.get(o.material);if(!a)buckets.set(o.material,a=[]);a.push(g)});const result=new T.Group();for(const [m,gs] of buckets){const count=gs.reduce((n,g)=>n+g.attributes.position.count,0),geometry=new T.BufferGeometry();for(const [name,size] of [['position',3],['normal',3],['uv',2]]){const arr=new Float32Array(count*size);let off=0;for(const g of gs){const v=g.attributes[name];if(v)arr.set(v.array,off);off+=g.attributes.position.count*size}geometry.setAttribute(name,new T.BufferAttribute(arr,size))}const o=new T.Mesh(geometry,m);o.castShadow=!m.userData.noShadow;o.receiveShadow=true;result.add(o);gs.forEach(g=>g.dispose())}return result}
export async function createWorld(canvas,state){await loadMiniatureMaterials();const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;const lens=miniatureLens(renderer);
const scene=new T.Scene();scene.background=new T.Color('#a9b798');scene.fog=new T.FogExp2('#a9b798',.012);const camera=new T.OrthographicCamera(-10,10,10,-10,.1,100);const ambient=new T.HemisphereLight('#f5f2e8','#667657',1.18);scene.add(ambient);const sun=new T.DirectionalLight('#fff3df',3.25);sun.position.set(-10,19,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:65});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=4;sun.shadow.blurSamples=8;scene.add(sun);scene.add(sun.target);
const fixed=new T.Group(),colliders=[],canopy=canopyGeometry();
const soilMap=miniatureTexture('earth',6),grassMap=miniatureTexture('moss',32);
for(const map of [soilMap,grassMap])map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const groundMaterial=new T.MeshStandardMaterial({map:grassMap,color:'#bbd2a2',roughness:1,bumpMap:grassMap,bumpScale:.09});
box(fixed,groundMaterial,0,-.22,0,70,.4,70);
const soilMaterial=new T.MeshStandardMaterial({map:soilMap,bumpMap:soilMap,bumpScale:.065,roughness:1,color:'#d7c7ac'});soilMaterial.userData.noShadow=true;groundMaterial.userData.noShadow=true;
const earthGeometry=new T.PlaneGeometry(16.8,16.8,128,128);earthGeometry.rotateX(-Math.PI/2);const ep=earthGeometry.attributes.position;
for(let i=0;i<ep.count;i++){const x=ep.getX(i),z=ep.getZ(i);ep.setY(i,.012*Math.sin(x*7.1+z*8.3)+.009*Math.sin(z*14.3-x*7)+.009*Math.sin(x*2.9-z*3.7))}earthGeometry.computeVertexNormals();mesh(fixed,earthGeometry,soilMaterial,.875,.035,3.875);
// Worn paths and individually set stepping stones.
function pathSurface(x,z,width,depth){const map=soilMap.clone();map.repeat.set(width/2.3,depth/2.3);const material=soilMaterial.clone();material.map=material.bumpMap=map;const path=new T.Mesh(new T.PlaneGeometry(width,depth),material);path.rotation.x=-Math.PI/2;path.position.set(x,.042,z);path.receiveShadow=true;fixed.add(path)}
pathSurface(0,-6.7,22,2.1);pathSurface(10,0,2.4,15);
for(let i=0;i<12;i++){const m=mesh(fixed,new T.IcosahedronGeometry(1,i%3?1:0),artisanMaterial(i%2?'#a6a994':'#969c87'),1+Math.sin(i)*.22,.045,-8+i*.48+Math.cos(i*3)*.055,.25+rand(i+22)*.10,.045+rand(i+18)*.025,.19+rand(i+25)*.07);m.rotation.y=i*.7;m.scale.x*=.85+rand(i)*.25}
function tree(x,z,size=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);cyl(g,artisanMaterial('#a5987b','bark'),0,1,0,.20,2);for(let i=0;i<5;i++){const a=i*1.256;let root=ball(g,artisanMaterial('#a5987b','bark'),Math.sin(a)*.15,.065,Math.cos(a)*.15,.08,.065,.29);root.rotation.y=a}const crown=treeCrown(x*13+z*7);crown.position.y=2.55;g.add(crown);fixed.add(g);colliders.push({x,z,r:.38*size})}
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
const blade=meadowGeometry(),grassMaterial=new T.MeshStandardMaterial({color:'#acc779',roughness:1});grassMaterial.side=T.DoubleSide;const grass=new T.InstancedMesh(blade,grassMaterial,30000),dummy=new T.Object3D();let k=0;for(let i=0;k<30000&&i<150000;i++){let x=rand(i*3)*29-13,z=rand(i*3+1)*29-14;if(x>-7.55&&x<9.3&&z>-4.55&&z<12.3)continue;if(z>-7.8&&z<-5.6&&x>-11&&x<12)continue;if(x>8.8&&x<11.2&&z>-7.8&&z<7.5)continue;if(z<-7.6&&z>-12.3&&x>-10&&x<13)continue;dummy.position.set(x,-.015,z);dummy.rotation.set((rand(i+18)-.5)*.4,rand(i+30)*6,(rand(i+20)-.5)*.4);dummy.scale.set(.72+rand(i+28)*.55,.72+rand(i+29)*.68,.72+rand(i+31)*.55);dummy.updateMatrix();grass.setMatrixAt(k++,dummy.matrix);grass.setColorAt(k-1,new T.Color().setHSL(.25+rand(i)*.035,.60,.34+rand(i+2)*.14))}grass.count=k;grass.receiveShadow=true;scene.add(grass);
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
moss.receiveShadow=true;scene.add(moss);
scene.add(bake(fixed));
const plots=new T.Group();scene.add(plots);let plotCombined=null;
const contactMaterial=new T.MeshBasicMaterial({map:contactTexture(),transparent:true,opacity:.23,depthWrite:false});
const shadowGeometry=new T.PlaneGeometry(1.05,1.05);shadowGeometry.rotateX(-Math.PI/2);
const cropShadows=new T.InstancedMesh(shadowGeometry,contactMaterial,144);cropShadows.renderOrder=1;scene.add(cropShadows);const shadowDummy=new T.Object3D();
const {cropModel,weedModel}=createCropArt();
const dry=new T.MeshStandardMaterial({map:miniatureTexture('earth',.55),roughness:1});dry.bumpMap=dry.map;dry.bumpScale=.075;dry.color.set('#9b886d');dry.alphaMap=soilEdgeTexture();dry.transparent=true;dry.depthWrite=false;dry.userData.noShadow=true;const wet=new T.MeshStandardMaterial({map:dry.map,bumpMap:dry.map,bumpScale:.025,color:'#8f8674',roughness:.76,alphaMap:dry.alphaMap,transparent:true,depthWrite:false});wet.userData.noShadow=true;
// Rounded soil mounds with shallow, continuous furrows.
const bedGeometry=new T.PlaneGeometry(1.18,1.18,12,12);bedGeometry.rotateX(-Math.PI/2);
const bedPositions=bedGeometry.attributes.position;
for(let i=0;i<bedPositions.count;i++){let x=bedPositions.getX(i),z=bedPositions.getZ(i);const cx=Math.max(0,Math.abs(x)-.45),cz=Math.max(0,Math.abs(z)-.45),len=Math.hypot(cx,cz);if(len>.14){x=Math.sign(x)*(.45+cx/len*.14);z=Math.sign(z)*(.45+cz/len*.14)}const edge=Math.max(0,1-Math.pow(Math.abs(x)/.59,8))*Math.max(0,1-Math.pow(Math.abs(z)/.59,8));bedPositions.setXYZ(i,x+Math.sin(z*37+x*11)*.015*(1-edge),.001+edge*(.064+.019*Math.cos(x*Math.PI*7)+.012*Math.sin(z*14+x*9)),z+Math.cos(x*29-z*13)*.015*(1-edge))}bedGeometry.computeVertexNormals();
function rebuild(){let shadowCount=0;for(const p of state.plots){if(!p.crop)continue;const growth=Math.min(1,p.age/CROPS[p.crop].days);if(growth<.15)continue;shadowDummy.position.set(FIELD.x+p.x*TILE,.087,FIELD.z+p.z*TILE);shadowDummy.scale.setScalar(.25+growth*.48);shadowDummy.updateMatrix();cropShadows.setMatrixAt(shadowCount++,shadowDummy.matrix)}cropShadows.count=shadowCount;cropShadows.instanceMatrix.needsUpdate=true;if(plotCombined){scene.remove(plotCombined);plotCombined.traverse(m=>{if(m.isMesh)m.geometry.dispose()})}const g=new T.Group();for(const p of state.plots){const x=FIELD.x+p.x*TILE,z=FIELD.z+p.z*TILE;if(p.tilled){mesh(g,bedGeometry,p.wet?wet:dry,x,.045,z);for(let i=0;i<9;i++){const seed=p.x*97+p.z*13+i;mesh(g,seedGeo,p.wet?'#66533b':'#8b6a45',x+(rand(seed)-.5)*.96,.083,z+(rand(seed+30)-.5)*.96,.018+rand(seed+50)*.018,.013,.025)}}if(p.crop)cropModel(g,p,x,z);if(p.obstacle==='stone'){const rock=mesh(g,new T.IcosahedronGeometry(1,2),artisanMaterial('#a4ab98','stone'),x,.21,z,.32,.26,.3);rock.rotation.y=p.x;ball(g,'#7d864f',x+.12,.23,z+.1,.13,.06,.1)}if(p.obstacle==='branch'){let b=cyl(g,artisanMaterial('#9f8d69','bark'),x,.11,z,.09,.7);b.rotation.z=1.35;b.rotation.y=.5;let b2=cyl(g,'#b59055',x+.15,.12,z+.15,.045,.38);b2.rotation.z=.9;b2.rotation.y=-.6}if(p.obstacle==='weed')weedModel(g,x,z)}plotCombined=bake(g);scene.add(plotCombined)}rebuild();
// Refined art uses the same joint hierarchy and animation pivots.
const {farmer,body,head,eyes,scarf,tail,arms,legs,knees,feet}=createFarmer(scene);
const equipment=new T.Group();arms[1].add(equipment);function toolModel(id){equipment.clear();if(id==='hand'||id==='seed')return;if(id==='water'){cyl(equipment,'#6f9293',0,-.43,.15,.17,.29);const handle=new T.Mesh(new T.TorusGeometry(.15,.025,5,14),mat('#9fb2a5'));handle.position.set(0,-.25,.15);equipment.add(handle);let spout=cyl(equipment,'#a3b7ab',0,-.4,.4,.035,.3);spout.rotation.x=1.1;ball(equipment,'#b8c5ae',0,-.33,.54,.09,.035,.07)}else{let h=cyl(equipment,'#a6824b',0,-.34,.3,.035,.85);h.rotation.x=Math.PI/2;if(id==='hoe')box(equipment,'#879390',0,-.35,.7,.27,.2,.055);if(id==='axe')box(equipment,'#8c9992',.03,-.34,.65,.31,.07,.24);if(id==='hammer')box(equipment,'#7c8782',0,-.34,.65,.4,.2,.22);if(id==='sickle'){let blade=box(equipment,'#bcc6ab',.1,-.34,.65,.37,.035,.08);blade.rotation.y=.5}}}toolModel(state.tool);
const playerShadow=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({map:contactTexture(),transparent:true,opacity:.30,depthWrite:false}));playerShadow.scale.set(.67,.67,.67);playerShadow.renderOrder=1;scene.add(playerShadow);
const carried=new T.Group();body.add(carried);let lastHeld=null;function heldModel(){carried.clear();if(state.held){cropModel(carried,{crop:state.held,age:CROPS[state.held].days},0,0,true);carried.position.set(0,2.05,.08)}lastHeld=state.held}
const target=new T.Mesh(new T.PlaneGeometry(1.18,1.18),new T.MeshBasicMaterial({color:'#ffe6a1',transparent:true,opacity:.065,depthWrite:false,side:T.DoubleSide}));target.rotation.x=-Math.PI/2;target.position.y=.14;scene.add(target);const border=new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1.16,1.16)),new T.LineBasicMaterial({color:'#fff0ad',transparent:true,opacity:.55}));border.rotation.x=-Math.PI/2;border.position.y=.145;scene.add(border);
const pollenGeometry=new T.BufferGeometry(),pollenPosition=new Float32Array(120*3);for(let i=0;i<120;i++){pollenPosition[i*3]=rand(i+301)*28-14;pollenPosition[i*3+1]=.4+rand(i+401)*3;pollenPosition[i*3+2]=rand(i+501)*26-12}pollenGeometry.setAttribute('position',new T.BufferAttribute(pollenPosition,3));const pollen=new T.Points(pollenGeometry,new T.PointsMaterial({color:'#fff0b5',size:.035,transparent:true,opacity:.5,depthWrite:false}));scene.add(pollen);
const particles=[];function effect(type){pendingEffect={type,delay:.36}}
function emitEffect(type){const p=frontTile(state);const x=p?FIELD.x+p.x*TILE:state.player.x,z=p?FIELD.z+p.z*TILE:state.player.z;for(let i=0;i<12;i++){const m=ball(scene,type==='water'?'#bbebed':type==='leaf'?'#94ac51':'#c4a36d',x,.5,z,.035);particles.push({m,v:new T.Vector3((rand(i+t)*2-1)*1.2,.6+rand(i+2)*1.3,(rand(i+3)*2-1)*1.2),life:.65})}}
let viewHeight=12,t=0,actionTime=0,actionTool=state.tool,pendingEffect=null,gait=0,isRunning=true,motion=0,travel=0,runBlend=0,speed=0;const velocity=new T.Vector3();const follow=new T.Vector3(state.player.x,0,state.player.z),offset=new T.Vector3(9,13,9),right=new T.Vector3(.707,0,-.707),down=new T.Vector3(.707,0,.707);function resize(){const a=innerWidth/innerHeight;viewHeight=a<.7?13.5:12;camera.left=-viewHeight*a/2;camera.right=viewHeight*a/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}resize();addEventListener('resize',resize);
function blocked(x,z){if(x<-10||x>14||z<-13||z>13)return true;for(const c of colliders){if(c.r&&Math.hypot(x-c.x,z-c.z)<c.r+.23)return true;if(c.w&&Math.abs(x-c.x)<c.w/2+.2&&Math.abs(z-c.z)<c.d/2+.2)return true}for(const p of state.plots){if(!p.obstacle&&!(p.crop&&p.age>=CROPS[p.crop].days*.5))continue;const px=FIELD.x+p.x*TILE,pz=FIELD.z+p.z*TILE;if(Math.abs(x-px)<.44&&Math.abs(z-pz)<.44)return true}return false}
function stop(){velocity.set(0,0,0);speed=0;}
function move(dx,dy,dt,run){
 isRunning=run;if(actionTime>0){stop();return false}if(dt<=0)return false;
 const oldX=state.player.x,oldZ=state.player.z;
 const desired=right.clone().multiplyScalar(dx).addScaledVector(down,dy);
 const strength=Math.min(1,desired.length()),active=strength>.045;
 if(active){desired.normalize().multiplyScalar((run?4.6:2.4)*strength);state.player.angle=Math.atan2(desired.x,desired.z)}else desired.set(0,0,0);
 // Exact exponential integration keeps acceleration consistent at 30, 60 and 120 fps.
 const rate=active?14:30,decay=Math.exp(-rate*dt);
 const displacement=desired.clone().multiplyScalar(dt).addScaledVector(velocity.clone().sub(desired),(1-decay)/rate);
 velocity.lerp(desired,1-decay);
 if(!active&&velocity.length()<.025)velocity.set(0,0,0);
 const nx=oldX+displacement.x,nz=oldZ+displacement.z;
 if(!blocked(nx,oldZ))state.player.x=nx;else velocity.x=0;
 if(!blocked(state.player.x,nz))state.player.z=nz;else velocity.z=0;
 const distance=Math.hypot(state.player.x-oldX,state.player.z-oldZ);
 speed=distance/dt;travel+=distance;
 const blend=T.MathUtils.smoothstep(speed,2.1,4.2);
 gait+=distance/(1.05+blend*.47)*Math.PI*2;
 return distance>1e-6;
}
function update(dt,moving){t+=dt;pollen.rotation.y=Math.sin(t*.05)*.025;pollen.position.y=Math.sin(t*.3)*.05;actionTime=Math.max(0,actionTime-dt);if(pendingEffect){pendingEffect.delay-=dt;if(pendingEffect.delay<=0){emitEffect(pendingEffect.type);pendingEffect=null}}farmer.position.set(state.player.x,.05,state.player.z);playerShadow.position.set(state.player.x,.06,state.player.z);let diff=Math.atan2(Math.sin(state.player.angle-farmer.rotation.y),Math.cos(state.player.angle-farmer.rotation.y));farmer.rotation.y+=diff*(1-Math.exp(-dt*18));motion+=((moving?Math.min(1,speed/2.4):0)-motion)*(1-Math.exp(-dt*20));runBlend+=(T.MathUtils.smoothstep(speed,2.1,4.2)-runBlend)*(1-Math.exp(-dt*12));const bounce=(1-Math.cos(gait*2))*(.006+runBlend*.012)*motion;
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
else if(actionTool==='hand'||actionTool==='seed')arm=-1.1*Math.sin(actionProgress*Math.PI);
else{const keys=[[0,0],[.22,-2.4],[.38,-2.4],[.52,-.65],[.72,-.75],[1,0]];let at=keys.findIndex(k=>k[0]>=actionProgress);at=Math.max(1,at);const a=keys[at-1],b=keys[at],t=(actionProgress-a[0])/(b[0]-a[0]);arm=a[1]+(b[1]-a[1])*t;if(i===0)arm*=.78;}}
arms[i].rotation.x=state.held?-2.3:arm;
 arms[i].rotation.z=(i===0?1:-1)*.06;}
scarf.rotation.y=Math.sin(gait-.4)*.07*motion;tail.rotation.x=Math.sin(gait-.5)*.15*motion;
if(lastHeld!==state.held)heldModel();let p=frontTile(state);target.visible=border.visible=!!p;if(p){target.position.x=border.position.x=FIELD.x+p.x*TILE;target.position.z=border.position.z=FIELD.z+p.z*TILE}for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.v.y-=dt*3;q.m.position.addScaledVector(q.v,dt);q.m.scale.multiplyScalar(.97);if(q.life<0){scene.remove(q.m);particles.splice(i,1)}}follow.lerp(new T.Vector3(state.player.x,0,state.player.z),1-Math.exp(-dt*8));const look=follow.clone().add(new T.Vector3(0,.2,-.9));camera.position.copy(look).add(offset);camera.lookAt(look);const evening=Math.max(0,Math.min(1,(state.minutes-960)/360));sun.intensity=3.25-evening*2.85;sun.color.set(state.weather==='rain'?'#e4e9d9':evening>.3?'#ffc08b':'#fff2df');ambient.intensity=state.weather==='rain'?1.25:1.18-evening*.55;scene.background.set(evening>.8?'#65747d':'#a9b798');lens.render(scene,camera)}
return {renderer,scene,camera,get animation(){return {moving:motion>.05,running:isRunning,phase:gait,travel,speed,actionTime,hips:legs.map(l=>l.rotation.x),knees:knees.map(l=>l.rotation.x)}},rebuild,move,stop,update,toolModel,effect,act(id=state.tool){stop();actionTool=id;actionTime=.72},locations:{house:{x:.5,z:-7.5},shipping:{x:5.2,z:-5.3},well:{x:11.6,z:.4}},get busy(){return actionTime>0}};
}

