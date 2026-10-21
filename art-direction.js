import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js';

const random=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const textures=new Map(),materials=new Map();
function surfaceTexture(kind){
 if(textures.has(kind))return textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');q.fillStyle='#d8d3c6';q.fillRect(0,0,256,256);
 for(let i=0;i<6000;i++){q.fillStyle=i%2?'#ffffff14':'#30261916';q.fillRect(random(i)*256,random(i+8000)*256,1+random(i+40)*2,1)}
 if(kind==='wood')for(let i=0;i<100;i++){q.strokeStyle=i%3?'#604b2920':'#fff5db28';q.lineWidth=.4+random(i+10);q.beginPath();for(let y=0;y<=256;y+=8){const x=i*2.6+Math.sin(y*.025+i)*1.4+Math.sin(y*.07+i)*.5;y?q.lineTo(x,y):q.moveTo(x,y)}q.stroke()}
 if(kind==='leaf')for(let i=0;i<800;i++){q.fillStyle=i%3?'#78915c2e':'#ffffff30';q.beginPath();q.ellipse(random(i)*256,random(i+20)*256,2+random(i+42)*4,1+random(i+56)*3,random(i+30)*6,0,Math.PI*2);q.fill()}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;textures.set(kind,map);return map;
}
export function artisanMaterial(color,kind='stone'){
 const key=kind+color;if(!materials.has(key)){
  const photograph=miniatureTexture(kind==='siding'?'wood':kind);let map=photograph||surfaceTexture(kind==='siding'?'wood':kind);const tint=new T.Color(color);
  if(kind==='siding'){if(!textures.has('siding')){const horizontal=map.clone();horizontal.center.set(.5,.5);horizontal.rotation=Math.PI/2;textures.set('siding',horizontal)}map=textures.get('siding')}
  // The atlas already supplies the material's natural color. A light tint
  // retains the palette without multiplying dark wood and stone twice.
  if(photograph)tint.lerp(new T.Color('#fff9ee'),kind==='leaf'?.38:kind==='bark'?.38:kind==='wood'||kind==='siding'?.64:kind==='clay'?.57:.58);
  materials.set(key,new T.MeshStandardMaterial({color:tint,map,bumpMap:map,bumpScale:kind==='fabric'?.007:kind==='leaf'?.011:kind==='wood'||kind==='siding'?.026:kind==='bark'?.055:.033,roughness:kind==='clay'?.98:1}));
 }return materials.get(key);
}
const square=new T.Shape();square.moveTo(-.46,-.46);square.lineTo(.46,-.46);square.lineTo(.46,.46);square.lineTo(-.46,.46);square.closePath();
const softBox=new T.ExtrudeGeometry(square,{depth:.92,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.04,bevelThickness:.04});softBox.translate(0,0,-.46);
const roofTile=new T.ExtrudeGeometry(square,{depth:.9,bevelEnabled:true,bevelSegments:2,steps:2,bevelSize:.045,bevelThickness:.035});roofTile.translate(0,0,-.45);
const tilePositions=roofTile.attributes.position;
for(let i=0;i<tilePositions.count;i++){const x=tilePositions.getX(i),z=tilePositions.getZ(i);tilePositions.setY(i,tilePositions.getY(i)+.2*(1-4*z*z)+.025*Math.sin(x*7+z*4))}roofTile.computeVertexNormals();
const sphere=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,12);
const windowGlass=new T.MeshStandardMaterial({color:'#b7ba9c',emissive:'#b88137',emissiveIntensity:.18,roughness:.34,metalness:.02});
function add(parent,geo,material,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function block(p,color,x,y,z,sx,sy,sz,kind='wood'){return add(p,softBox,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}
function round(p,color,x,y,z,sx,sy,sz,kind='stone'){return add(p,sphere,artisanMaterial(color,kind),x,y,z,sx,sy,sz)}

export function cottage(x,z,w,d,color,roof){
 const g=new T.Group();g.position.set(x,0,z);
 const wallBase=new T.Color(color).lerp(new T.Color('#dfdfd0'),.72),wallPalette=[-.035,0,.035].map(v=>'#'+wallBase.clone().offsetHSL(-.012,-.06,v).getHexString());
 const frame='#8e856d',door='#baa88a';
 block(g,'#b4b09d',0,.16,0,w+.2,.32,d+.2,'stone');
 for(const side of [-1,1])for(let i=0;i<Math.ceil(d/.55);i++){const stone=block(g,i%2?'#c8c3b0':'#aaa998',side*(w/2+.04),.17,-d/2+(i+.5)*d/Math.ceil(d/.55),.15,.24,d/Math.ceil(d/.55)-.03,'stone');stone.rotation.z=(random(i+13)-.5)*.025}
 block(g,wallPalette[1],0,1.37,0,w,2.36,d);
 for(let i=0;i<10;i++){
  const y=.3+i*.23,plank=wallPalette[i%3];block(g,plank,0,y,d/2+.035,w,.215,.07,'siding');
  for(const side of [-1,1])block(g,wallPalette[(i+(side>0?1:0))%3],side*(w/2+.035),y,0,.07,.215,d,'siding');
 }
 for(const sx of [-1,1])for(const sz of [-1,1])block(g,frame,sx*(w/2-.035),1.37,sz*(d/2+.04),.16,2.38,.17);
 // Roof slabs follow the same pitch as the overlapping shingles.
 const half=w/2+.34,rise=1.14,angle=Math.atan2(rise,half),length=Math.hypot(half,rise),depth=d+.68;
 for(const side of [-1,1]){
  const slab=block(g,'#6e503a',side*half/2,3.12,0,length,.13,depth);slab.rotation.z=-side*angle;
  const rows=6,cols=Math.ceil(depth/.43),roofBase=new T.Color(roof).lerp(new T.Color('#b6aa98'),.36);
  const roofPalette=Array.from({length:6},(_,i)=>artisanMaterial('#'+roofBase.clone().offsetHSL((i%3-1)*.012,-.09,(i-2.5)*.022).getHexString(),'clay'));
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const n=row*31+col+side*173,u=(row+.5)/rows,xx=side*half*u,zz=-depth/2+(col+.5)*depth/cols+(random(n+20)-.5)*.025;
   const tile=add(g,roofTile,roofPalette[Math.floor(random(n)*roofPalette.length)],xx,3.69-rise*u+.06+(random(n+10)-.5)*.032,zz,length/rows*1.16,.075,depth/cols-.012);tile.rotation.z=-side*(angle+.045)+(random(n+9)-.5)*.02;tile.rotation.x=(random(n+14)-.5)*.025;
  }
  for(const sz of [-1,1]){const fascia=block(g,'#795b3c',side*half/2,3.1,sz*(depth/2+.025),length+.08,.14,.11);fascia.rotation.z=-side*angle}
  block(g,'#765a3d',side*half,2.55,0,.14,.17,depth+.1);
 }
 for(let i=0;i<Math.ceil(depth/.3);i++){const ridge=add(g,cylinder,artisanMaterial(roof,'clay'),0,3.74,-depth/2+(i+.5)*depth/Math.ceil(depth/.3),.11,.31,.11);ridge.rotation.x=Math.PI/2}
 // Wooden gables and a small round attic vent.
 const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-w/2,2.55,d/2, w/2,2.55,d/2, 0,3.65,d/2, -w/2,2.55,-d/2, 0,3.65,-d/2, w/2,2.55,-d/2],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,.8,0,0,.5,.8,1,0],2));gable.computeVertexNormals();const ends=new T.Mesh(gable,artisanMaterial(wallPalette[1],'wood'));g.add(ends);
 round(g,'#735938',0,2.98,d/2+.045,.23,.23,.04,'wood');round(g,'#4b5744',0,2.98,d/2+.083,.16,.16,.02);block(g,'#cab78b',0,2.98,d/2+.11,.026,.3,.022);
 // Recessed plank door, brass handle, doorstep and shuttered window.
 block(g,frame,-.5,.91,d/2+.09,1.02,1.83,.18);block(g,door,-.5,.87,d/2+.19,.79,1.64,.08);
 for(let i=0;i<4;i++)block(g,'#80613c',-.79+i*.19,.87,d/2+.24,.012,1.56,.014);
 block(g,'#c5ad7a',-.5,1.52,d/2+.255,.7,.08,.035);round(g,'#d4ba74',-.22,.89,d/2+.285,.04,.04,.04);
 block(g,'#a3a18c',-.5,.07,d/2+.34,1.1,.12,.46,'stone');
 const wx=w*.28;block(g,'#68553c',wx,1.53,d/2+.09,1.03,1.01,.17);add(g,softBox,windowGlass,wx,1.53,d/2+.19,.79,.77,.035);
 for(const sx of [-1,1]){block(g,'#687957',wx+sx*.62,1.53,d/2+.13,.23,.99,.09);for(let j=0;j<5;j++)block(g,'#82916a',wx+sx*.62,1.19+j*.16,d/2+.19,.24,.04,.025)}
 block(g,'#e3d4b3',wx,1.53,d/2+.24,.045,.81,.04);block(g,'#e3d4b3',wx,1.53,d/2+.24,.82,.045,.04);
 // The side window makes the near wall read as a lived-in cottage at the
 // game's diagonal camera angle, while remaining inside its existing trim.
 block(g,frame,w/2+.075,1.47,-.15,.15,1.03,1.12);add(g,softBox,windowGlass,w/2+.16,1.47,-.15,.025,.81,.9);
 block(g,'#e2d9c3',w/2+.19,1.47,-.15,.035,.86,.042);block(g,'#e2d9c3',w/2+.19,1.47,-.15,.035,.044,.94);
 block(g,frame,w/2+.16,.91,-.15,.32,.1,1.22);
 block(g,'#82643f',wx,.97,d/2+.29,1.15,.24,.39);
 for(let i=0;i<7;i++){const xx=wx-.45+i*.15;round(g,'#5d7d45',xx,1.13,d/2+.3,.17,.15,.17,'leaf');for(let j=0;j<5;j++){const a=j*Math.PI*2/5;round(g,i%2?'#e6c97b':'#d4aebc',xx+Math.sin(a)*.045,1.26+Math.cos(a)*.045,d/2+.37,.033,.035,.025)}round(g,'#b3964e',xx,1.26,d/2+.4,.023,.023,.02)}
 // Brick chimney, with a dark opening instead of a solid cap.
 for(let row=0;row<5;row++)for(let col=0;col<2;col++){block(g,row%2?'#a18c77':'#b09c82',w*.25+(col-.5)*.27,3.35+row*.19,-d*.2,.25,.17,.51,'stone')}
 block(g,'#746b5b',w*.25,4.22,-d*.2,.65,.14,.66,'stone');block(g,'#383b31',w*.25,4.295,-d*.2,.39,.012,.38,'stone');
 // Climbing leaves and low foundation shrubs stay within the house footprint.
 for(let i=0;i<26;i++){const y=.45+i*.075,xx=-w/2+.23+Math.sin(i*.55)*.11;const leaf=round(g,i%3?'#698052':'#8a9a66',xx,y,d/2+.14,.1,.055,.035,'leaf');leaf.rotation.z=i%2?.55:-.55}
 for(let i=0;i<8;i++)round(g,i%2?'#667b4c':'#7c915a',w/2+.03,.25,-d/2+.3+i*(d-.5)/8,.23,.25,.3,'leaf');
 return g;
}

export function canopyGeometry(){
 const g=new T.SphereGeometry(1,14,10),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.075*Math.sin(x*13+z*4)*Math.sin(y*11-z*6)+.045*Math.cos(z*17+x*7);p.setXYZ(i,x*r,y*r,z*r)}g.computeVertexNormals();return g;
}
let crownPalette;
const crownCore=new T.SphereGeometry(1,8,6),crownPoints=crownCore.attributes.position;
for(let i=0;i<crownPoints.count;i++){const x=crownPoints.getX(i),y=crownPoints.getY(i),z=crownPoints.getZ(i),r=.94+.095*Math.sin(x*8+z*5)*Math.cos(y*9-x*3)+.055*Math.cos(z*13-y*6);crownPoints.setXYZ(i,x*r,y*r,z*r)}crownCore.computeVertexNormals();
const crownLeaf=new T.BufferGeometry();
crownLeaf.setAttribute('position',new T.Float32BufferAttribute([0,0,-.5,-.35,.05,-.16,-.28,.1,.18,0,.14,.5,.28,.1,.18,.35,.05,-.16,0,.18,0],3));
crownLeaf.setAttribute('uv',new T.Float32BufferAttribute([.5,0,0,.34,.1,.68,.5,1,.9,.68,1,.34,.5,.5],2));
crownLeaf.setIndex([6,0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0]);crownLeaf.computeVertexNormals();
export function treeCrown(seed=0){
 if(!crownPalette){
  const moss=miniatureTexture('moss',3)||surfaceTexture('leaf'),leaf=miniatureTexture('leaf')||surfaceTexture('leaf');
  crownPalette=['#a5b18b','#c4c79e'].map(color=>new T.MeshStandardMaterial({color,map:moss,bumpMap:moss,bumpScale:.035,roughness:1}));
  for(const color of ['#c3cf9f','#e4dfb5'])crownPalette.push(new T.MeshStandardMaterial({color,map:leaf,bumpMap:leaf,bumpScale:.008,roughness:1,side:T.DoubleSide}));
 }
 const g=new T.Group();
 // Small irregular inner masses supply density; their tiled moss map has no
 // enlarged leaf silhouette. Individual leaflets break the edge into sprays.
 const clusters=[[-.38,-.05,-.13,.64,.56,.59],[.34,-.02,.14,.65,.57,.59],[-.13,.35,.04,.63,.45,.56],[.06,-.33,-.1,.65,.35,.54]];
 clusters.forEach(([x,y,z,sx,sy,sz],i)=>{const m=add(g,crownCore,crownPalette[i%2],x,y,z,sx,sy,sz);m.rotation.set(random(seed+i)*.5,random(seed+i+2)*6,random(seed+i+4)*.4)});
 const up=new T.Vector3(0,1,0),normal=new T.Vector3();
 for(let i=0;i<160;i++){
  const n=i+seed*173,u=(i+.5)/160,y=1-2*u,a=i*2.399963+seed*.17,r=Math.sqrt(1-y*y),edge=.89+random(n+4)*.12;
  const x=Math.cos(a)*r*.94*edge,z=Math.sin(a)*r*.83*edge,yy=y*.65*edge+.045*Math.sin(a*3),size=.18+random(n+10)*.1;
  const m=add(g,crownLeaf,crownPalette[2+(i%3===0?1:0)],x,yy,z,size*(.85+random(n+15)*.25),size,size);
  normal.set(x*.65,yy+.15,z*.65).normalize();m.quaternion.setFromUnitVectors(up,normal);m.rotateY(random(n+30)*Math.PI*2);m.rotateX((random(n+40)-.5)*.55);
 }
 return g;
}
export function meadowGeometry(){
 const points=[],uv=[];for(let i=0;i<3;i++){const angle=i*2.094,c=Math.cos(angle),s=Math.sin(angle),width=.025;
 for(const [x,y,z] of [[-width,0,0],[width,0,0],[width*.55,.15,.025],[-width,0,0],[width*.55,.15,.025],[-width*.55,.15,.025],[-width*.55,.15,.025],[width*.55,.15,.025],[0,.29,.095]]){points.push(x*c+z*s,y,z*c-x*s);uv.push(x/width*.5+.5,y/.29)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
