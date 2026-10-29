import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js?v=0.32';
import {meadowGeometry} from './art-direction.js?v=0.32';
import {FIELD,TILE} from './simulation.js?v=0.32';

const rand=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const owned=options=>{const m=new T.MeshStandardMaterial(options);m.userData.regionOwned=true;return m};
// Region-owned clones preserve the shared main-farm atlas during travel/disposal.
function atlas(kind,repeat){const map=miniatureTexture(kind,repeat)?.clone()||null;if(map){map.needsUpdate=true;map.anisotropy=8}return map}
function surface(kind,repeat,color,bumpScale){const map=atlas(kind,repeat),m=owned({map,bumpMap:map,color,roughness:1,bumpScale});m.userData.noShadow=true;m.userData.seasonSurface=({moss:'ground',earth:'soil',bark:'wood'})[kind]||kind;return m}
function add(k,geometry,material,x,y,z){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.receiveShadow=true;k.fixed.add(m);return m}
export function farmGround(k,width=70,depth=70,x=0,z=0){return add(k,new T.BoxGeometry(width,.4,depth),surface('moss',32,'#bbd2a2',.09),x,-.22,z)}
export function farmSoil(k,x=.875,z=3.875,size=16.8){
 const geometry=new T.PlaneGeometry(size,size,128,128);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const xx=p.getX(i),zz=p.getZ(i);p.setY(i,.012*Math.sin(xx*7.1+zz*8.3)+.009*Math.sin(zz*14.3-xx*7)+.009*Math.sin(xx*2.9-zz*3.7))}
 geometry.computeVertexNormals();const m=add(k,geometry,surface('earth',6,'#d7c7ac',.065),x,.035,z);m.name='main-farm-soil';return m;
}
export function countryTrack(k,x,z,width,depth){
 const map=atlas('earth',6);if(map)map.repeat.set(width/2.3,depth/2.3);
 const material=owned({map,bumpMap:map,bumpScale:.065,roughness:1,color:'#d7c7ac'});material.userData.noShadow=true;material.userData.seasonSurface='path';
 const geometry=new T.PlaneGeometry(width,depth);geometry.rotateX(-Math.PI/2);const m=add(k,geometry,material,x,.042,z);m.name='worn-earth-track';return m;
}
function instances(k,geometry,material,items,name){const mesh=new T.InstancedMesh(geometry,material,items.length),dummy=new T.Object3D(),color=new T.Color();items.forEach((p,i)=>{dummy.position.set(p.x,p.y||0,p.z);dummy.rotation.set(p.rx||0,p.a||0,p.rz||0);dummy.scale.set(p.sx||1,p.sy||p.sx||1,p.sz||p.sx||1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.color)mesh.setColorAt(i,color.set(p.color));else if(p.hue!==undefined)mesh.setColorAt(i,color.setHSL(p.hue,p.sat,p.light))});mesh.name=name;if(/meadow|weeds|reed-beds/.test(name))material.userData.seasonSurface='grass';if(/pebbles|stones/.test(name))material.userData.seasonSurface='stone';if(name==='stump-endgrain')material.userData.seasonSurface='wood';mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();k.fixed.add(mesh);return mesh}
export function farmMeadow(k,{x=0,z=0,width=29,depth=29,count=21000,seed=0,exclude=()=>false}={}){
 if(typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches)count=Math.floor(count*.60);const items=[];for(let i=0;i<count*8&&items.length<count;i++){const n=i+seed,xx=x+(rand(n*3)-.5)*width,zz=z+(rand(n*3+1)-.5)*depth;if(exclude(xx,zz))continue;items.push({x:xx,y:-.015,z:zz,a:rand(n+30)*6,rx:(rand(n+18)-.5)*.4,rz:(rand(n+20)-.5)*.4,sx:.72+rand(n+28)*.55,sy:.72+rand(n+29)*.68,sz:.72+rand(n+31)*.55,hue:.25+rand(n)*.035,sat:.60,light:.34+rand(n+2)*.14})}
 return instances(k,meadowGeometry(),owned({color:'#acc779',roughness:1,side:T.DoubleSide}),items,'farm-meadow');
}
function soilFringe(k,x,z,seed=0){const items=[];for(let i=0;i<800;i++){const n=i+seed,side=i%4,u=rand(n+601),j=(rand(n+602)-.5)*1.15,xx=side<2?x-8.375+u*16.7:(side===2?x-8.375:x+8.375)+j,zz=side<2?(side===0?z-8.375:z+8.375)+j:z-8.375+u*16.7,size=.025+rand(n+605)*.10;items.push({x:xx,y:.025,z:zz,a:rand(n+604)*6,sx:size,sy:.009+rand(n+606)*.022,sz:size*(.4+rand(n+610)*.7),hue:.22+rand(n+607)*.035,sat:.38,light:.42+rand(n+608)*.12})}instances(k,new T.IcosahedronGeometry(1,1),surface('moss',1,'#d2d7a6',.05),items,'moss-clearing-fringe')}
export function homesteadLandscape(k){
 farmGround(k);farmSoil(k);countryTrack(k,0,-6.7,22,2.1);countryTrack(k,10,0,2.4,15);
 farmMeadow(k,{exclude:(x,z)=>(x>-7.55&&x<9.3&&z>-4.55&&z<12.3)||(z>-7.8&&z<-5.6&&x>-11&&x<12)||(x>8.8&&x<11.2&&z>-7.8&&z<7.5)||(z<-7.6&&z>-12.3&&x>-10&&x<13)});
 soilFringe(k,.875,3.875);for(let i=0;i<19;i++)k.tree(-19+i*2.2,-13-rand(i)*2,1+rand(i+8)*.55);for(let i=0;i<11;i++){k.tree(-13-rand(i+17)*2,-8+i*2.6,1.1);k.tree(16+rand(i+9)*2,-7+i*2.8,.9+rand(i)*.4)}
 // A sparse rim of natural timber and stones leaves the entire field usable.
 const stones=[],bark=[],caps=[];for(let i=0;i<35;i++){const a=i*2.399963,x=i%2?-8.9:13.4,z=-4+rand(i+201)*16,size=.075+rand(i+202)*.11;stones.push({x,y:size*.36,z,a,sx:size,sy:size*.60,sz:size*.8,color:i%2?'#a4ab98':'#929b83'})}
 for(let i=0;i<12;i++){const x=i<6?-9.6:13.4,z=-3+(i%6)*2.8,h=.22+rand(i)*.12,r=.13+rand(i+8)*.06;bark.push({x,y:h/2,z,sx:r,sy:h,sz:r,a:i});caps.push({x,y:h+.006,z,sx:r*.87,sy:.012,sz:r*.87,a:i});k.roundSolid(x,z,r,{jumpable:true,height:h+.012,label:'boundary-stump'})}
 instances(k,new T.IcosahedronGeometry(1,1),owned({color:'#a4ab98',roughness:1}),stones,'boundary-pebbles');instances(k,new T.CylinderGeometry(1,1,1,9),surface('bark',1,'#c7b89a',.035),bark,'natural-stumps');instances(k,new T.CylinderGeometry(1,1,1,12),owned({color:'#c6aa7c',roughness:1}),caps,'stump-endgrain');
}
export function lakeLotLandscape(k,lot,progress,index=0,debris=[]){
 const x=lot.x-.125,z=lot.z+3.875;farmSoil(k,x,z);soilFringe(k,x,z,index*311);
 farmMeadow(k,{x:lot.x,z:lot.z,width:22.8,depth:24.6,count:4200,seed:index*413,exclude:(xx,zz)=>(Math.abs(xx-x)<8.45&&Math.abs(zz-z)<8.45)||(Math.abs(xx-lot.x)<1.5&&zz>lot.z+9)||(progress?.house&&Math.abs(xx-(lot.x+.0))<3&&Math.abs(zz-(lot.z-10))<2.2)||(progress?.barn&&Math.abs(xx-(lot.x-8.5))<2.5&&Math.abs(zz-(lot.z-9))<2.2)});
 const rocks=[],logs=[],caps=[],tufts=[];for(let i=0;i<34;i++){const n=index*71+i,xx=lot.x-9.6+rand(n+31)*19.2,zz=lot.z-10.2+rand(n+44)*20.3;if(Math.abs(xx-x)<8.3&&Math.abs(zz-z)<8.3)continue;if(Math.abs(xx-lot.x)<1.3&&zz>lot.z+8)continue;if(progress?.house&&Math.abs(xx-lot.x)<3&&zz<lot.z-7)continue;if(progress?.barn&&xx<lot.x-5&&zz<lot.z-6)continue;const size=.09+rand(n+57)*.17;rocks.push({x:xx,y:size*.35,z:zz,a:n,sx:size,sy:size*.7,sz:size*.85,color:i%3?'#a4ab98':'#889563'});if(i%6===0){logs.push({x:xx,y:.13,z:zz,a:n,rx:Math.PI/2,sx:.075,sy:.8,sz:.075});caps.push({x:xx+.25,y:.14,z:zz-.3,a:n,sx:.18,sy:.27,sz:.18});k.solid(xx,zz,.16,.8,{angle:n,jumpable:true,height:.21,label:'fallen-log'});k.roundSolid(xx+.25,zz-.3,.18,{jumpable:true,height:.28,label:'natural-stump'})}}
 // Match visible clearing progress in the lake overview instead of re-growing removed weeds.
 const obstacle=(kind,xx,zz,n)=>{if(kind==='weed')tufts.push({x:xx,y:.04,z:zz,a:n,sx:1.7,sy:1.7,sz:1.7});else if(kind==='stone')rocks.push({x:xx,y:.11,z:zz,a:n,sx:.34,sy:.25,sz:.3,color:'#a4ab98'}),k.roundSolid(xx,zz,.34);else if(kind==='branch'){logs.push({x:xx,y:.11,z:zz,a:n,rx:Math.PI/2,sx:.075,sy:.7,sz:.075});k.solid(xx,zz,.17,.72,{height:.19,label:'uncleared-branch'})}};for(const p of progress?.plots||[])obstacle(p.obstacle,lot.x-1+FIELD.x+p.x*TILE,lot.z+FIELD.z+p.z*TILE,p.x+p.z);debris.forEach((p,i)=>{if(!progress?.cleared.includes(i))obstacle(p.kind,lot.x-1+p.x,lot.z+p.z,i)})
 if(!progress)for(let i=0;i<110;i++){const xx=x+(rand(i+index*171)-.5)*16.1,zz=z+(rand(i+713)-.5)*16.1;tufts.push({x:xx,y:.04,z:zz,a:i,sx:1.5,sy:1.7,sz:1.5})}
 instances(k,new T.IcosahedronGeometry(1,1),owned({color:'#a4ab98',roughness:1}),rocks,'lot-natural-stones');instances(k,new T.CylinderGeometry(1,1,1,7),surface('bark',1,'#9f8d69',.025),logs,'lot-fallen-branches');instances(k,new T.CylinderGeometry(.86,1,1,9),surface('bark',1,'#c7b89a',.025),caps,'lot-old-stumps');instances(k,meadowGeometry(),owned({color:'#92a45e',roughness:1,side:T.DoubleSide}),tufts,'lot-wild-weeds');
 for(const [dx,dz,s]of[[-9.5,-10.4,.95],[9.5,-9.5,1.1],[-10.2,6,.88],[9.8,7.4,1.02]])k.tree(lot.x+dx,lot.z+dz,s);
}
export function lakeShorePlants(k){
 const reeds=[],heads=[],stones=[];for(let i=0;i<240;i++){const a=rand(i+781)*Math.PI*2,r=17.2+rand(i+771)*1.25,x=Math.cos(a)*r,z=Math.sin(a)*r*.80;if(Math.abs(x)<1.6&&z<-12.8)continue;const h=.40+rand(i+63)*.48;reeds.push({x,y:h/2+.03,z,a,sx:.018,sy:h,sz:.018,color:i%3?'#7f9765':'#a0ab73'});if(i%3===0)heads.push({x,y:h+.015,z,a,sx:.033,sy:.14,sz:.033})}
 for(let i=0;i<140;i++){const a=i*2.399963,r=17.8+rand(i+862)*.85,s=.05+rand(i+993)*.13;stones.push({x:Math.cos(a)*r,y:.025,z:Math.sin(a)*r*.81,a,sx:s,sy:s*.32,sz:s*.7,color:i%2?'#b2b29b':'#a2aa8c'})}
 instances(k,new T.CylinderGeometry(.65,1,1,5),owned({color:'#8b9f68',roughness:1}),reeds,'lake-reed-beds');instances(k,new T.CylinderGeometry(.8,1,1,6),owned({color:'#9d8a62',roughness:1}),heads,'reed-seedheads');instances(k,new T.IcosahedronGeometry(1,0),owned({color:'#b9b894',roughness:1}),stones,'shore-pebbles');
}
