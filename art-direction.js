import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js?v=0.26';

const random=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const textures=new Map(),materials=new Map();
function surfaceTexture(kind){
 if(textures.has(kind))return textures.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');q.fillStyle='#d8d3c6';q.fillRect(0,0,256,256);
 for(let i=0;i<6000;i++){q.fillStyle=i%2?'#ffffff14':'#30261916';q.fillRect(random(i)*256,random(i+8000)*256,1+random(i+40)*2,1)}
 if(kind==='wood')for(let i=0;i<100;i++){q.strokeStyle=i%3?'#604b2920':'#fff5db28';q.lineWidth=.4+random(i+10);q.beginPath();for(let y=0;y<=256;y+=8){const x=i*2.6+Math.sin(y*.025+i)*1.4+Math.sin(y*.07+i)*.5;y?q.lineTo(x,y):q.moveTo(x,y)}q.stroke()}
 if(kind==='leaf')for(let i=0;i<800;i++){q.fillStyle=i%3?'#78915c2e':'#ffffff30';q.beginPath();q.ellipse(random(i)*256,random(i+20)*256,2+random(i+42)*4,1+random(i+56)*3,random(i+30)*6,0,Math.PI*2);q.fill()}
 if(kind==='cottageStone'){
 q.fillStyle='#8d8a7b';q.fillRect(0,0,256,256);const shades=['#c4c1af','#bbb8a5','#d0cbb7','#b2b09f','#c9c6b5'];
 for(let row=0;row<6;row++)for(let col=-1;col<5;col++){const n=row*7+col+101,x=col*64+(row%2)*32,y=row*256/6,h=256/6;q.fillStyle=shades[Math.floor(random(n)*shades.length)];q.beginPath();q.roundRect(x+2.1,y+2.1,59.8,h-4.2,4+random(n+8)*3);q.fill();q.strokeStyle='#f3ecd333';q.lineWidth=1.4;q.beginPath();q.moveTo(x+7,y+4);q.lineTo(x+56,y+4);q.stroke();q.strokeStyle='#4e4b3b2b';q.beginPath();q.moveTo(x+60,y+8);q.lineTo(x+60,y+h-5);q.lineTo(x+7,y+h-5);q.stroke()}
 for(let i=0;i<5000;i++){q.fillStyle=i%3?'#ffffff13':'#4c4b3a12';q.fillRect(random(i+200)*256,random(i+7200)*256,1+random(i+55)*2,1)}
 }
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;textures.set(kind,map);return map;
}
const archedDoorShape=new T.Shape();archedDoorShape.moveTo(-.41,0);archedDoorShape.lineTo(.41,0);archedDoorShape.lineTo(.41,1.19);archedDoorShape.absarc(0,1.19,.41,0,Math.PI,false);archedDoorShape.lineTo(-.41,0);
const archedDoorGeometry=new T.ExtrudeGeometry(archedDoorShape,{depth:.06,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.012});archedDoorGeometry.userData.shared=true;
export function artisanMaterial(color,kind='stone'){
 const key=kind+color;if(!materials.has(key)){
  const photograph=miniatureTexture(kind==='siding'?'wood':kind);let map=photograph||surfaceTexture(kind==='siding'?'wood':kind);const tint=new T.Color(color);
  if(kind==='siding'){if(!textures.has('siding')){const horizontal=map.clone();horizontal.center.set(.5,.5);horizontal.rotation=Math.PI/2;textures.set('siding',horizontal)}map=textures.get('siding')}
  // The atlas already supplies the material's natural color. A light tint
  // retains the palette without multiplying dark wood and stone twice.
  if(photograph)tint.lerp(new T.Color('#fff9ee'),kind==='leaf'?.38:kind==='bark'?.38:kind==='wood'||kind==='siding'?.64:kind==='clay'?.57:.58);
  const material=new T.MeshStandardMaterial({color:tint,map,bumpMap:map,bumpScale:kind==='fabric'?.007:kind==='leaf'?.011:kind==='wood'||kind==='siding'?.026:kind==='bark'?.055:.033,roughness:kind==='clay'?.98:1});
  material.userData.seasonSurface=({leaf:'leaf',moss:'grass',clay:'roof',wood:'wood',siding:'wood',bark:'wood',stone:'stone',cottageStone:'stone',earth:'soil',fabric:'fabric'})[kind]||kind;materials.set(key,material);
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
 const frame='#8a6b46',door='#b89561',houseSeed=x*3.17+z*1.83;
 block(g,'#a7a18b',0,.16,0,w+.2,.32,d+.2,'stone');
 for(const side of [-1,1])for(let i=0;i<Math.ceil(d/.55);i++){const stone=block(g,i%2?'#c8c3b0':'#aaa998',side*(w/2+.04),.17,-d/2+(i+.5)*d/Math.ceil(d/.55),.15,.24,d/Math.ceil(d/.55)-.03,'stone');stone.rotation.z=(random(i+13)-.5)*.025}
 block(g,wallPalette[1],0,1.37,0,w,2.36,d,'cottageStone');
 for(const sx of [-1,1])for(const sz of [-1,1])block(g,frame,sx*(w/2-.035),1.37,sz*(d/2+.04),.18,2.4,.19);
 block(g,'#92724d',0,.39,d/2+.035,w,.12,.11);block(g,frame,0,2.49,d/2+.055,w+.12,.16,.16);
 for(const side of [-1,1]){block(g,frame,side*(w/2+.035),2.49,0,.14,.16,d);block(g,'#92724d',side*(w/2+.035),.39,0,.11,.12,d)}
 // Roof slabs follow the same pitch as the overlapping shingles.
 const half=w/2+.34,rise=1.14,angle=Math.atan2(rise,half),length=Math.hypot(half,rise),depth=d+.68;
 for(const side of [-1,1]){
  const slab=block(g,'#6e503a',side*half/2,3.12,0,length,.13,depth);slab.rotation.z=-side*angle;
  const rows=6,cols=Math.ceil(depth/.43),roofBase=new T.Color(roof).lerp(new T.Color('#b6aa98'),.36);
  const roofPalette=Array.from({length:6},(_,i)=>artisanMaterial('#'+roofBase.clone().offsetHSL((i%3-1)*.012,-.09,(i-2.5)*.022).getHexString(),'clay'));
  const mossPalette=['#829363','#9ca66b'].map(c=>artisanMaterial(c,'moss'));
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const n=row*31+col+side*173,u=(row+.5)/rows,xx=side*half*u,zz=-depth/2+(col+.5)*depth/cols+(random(n+20)-.5)*.025;
   const moss=Math.sin(col*.76+row*.53+houseSeed)*.42+Math.cos(col*.39-row*.61+houseSeed*.4)*.35,tileMaterial=moss>.24+(side>0?.08:-.06)?mossPalette[(col+row)%2]:roofPalette[Math.floor(random(n)*roofPalette.length)];
   const tile=add(g,roofTile,tileMaterial,xx,3.69-rise*u+.06+(random(n+10)-.5)*.032,zz,length/rows*1.16,.075,depth/cols-.012);tile.rotation.z=-side*(angle+.045)+(random(n+9)-.5)*.02;tile.rotation.x=(random(n+14)-.5)*.025;
  }
  for(const sz of [-1,1]){const fascia=block(g,'#795b3c',side*half/2,3.1,sz*(depth/2+.025),length+.08,.14,.11);fascia.rotation.z=-side*angle}
  block(g,'#765a3d',side*half,2.55,0,.14,.17,depth+.1);
 }
 for(let i=0;i<Math.ceil(depth/.3);i++){const ridge=add(g,cylinder,artisanMaterial(roof,'clay'),0,3.74,-depth/2+(i+.5)*depth/Math.ceil(depth/.3),.11,.31,.11);ridge.rotation.x=Math.PI/2}
 // Wooden gables and a small round attic vent.
 const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-w/2,2.55,d/2, w/2,2.55,d/2, 0,3.65,d/2, -w/2,2.55,-d/2, 0,3.65,-d/2, w/2,2.55,-d/2],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,.8,0,0,.5,.8,1,0],2));gable.computeVertexNormals();const ends=new T.Mesh(gable,artisanMaterial(wallPalette[1],'wood'));g.add(ends);
 for(const side of [-1,1]){const brace=block(g,frame,side*w*.21,2.99,d/2+.07,Math.hypot(w*.42,1.02),.095,.1);brace.rotation.z=-side*Math.atan2(1.02,w*.42)}
 block(g,frame,0,3.01,d/2+.08,.12,1.12,.13);
 round(g,'#735938',0,2.98,d/2+.045,.23,.23,.04,'wood');round(g,'#4b5744',0,2.98,d/2+.083,.16,.16,.02);block(g,'#cab78b',0,2.98,d/2+.11,.026,.3,.022);
 // Arched plank door with a stone surround.
 add(g,archedDoorGeometry,artisanMaterial('#72563b','wood'),-.5,.18,d/2+.085,1.2,1.14,1);
 add(g,archedDoorGeometry,artisanMaterial(door,'wood'),-.5,.23,d/2+.19,1,1,1);
 for(let i=0;i<4;i++)block(g,'#80613c',-.79+i*.19,.84,d/2+.275,.012,1.15,.014);
 block(g,'#c5ad7a',-.5,.48,d/2+.285,.71,.07,.035);round(g,'#d4ba74',-.22,.91,d/2+.3,.042,.042,.034);
 for(let i=0;i<7;i++){const a=(i+.5)*Math.PI/7,stone=block(g,i%2?'#c5bd9f':'#b3aa90',-.5+Math.cos(a)*.555,1.42+Math.sin(a)*.555,d/2+.15,.21,.21,.22,'stone');stone.rotation.z=a-Math.PI/2}
 for(const side of [-1,1])for(let i=0;i<4;i++)block(g,i%2?'#c5bd9f':'#b3aa90',-.5+side*.565,.38+i*.26,d/2+.14,.19,.235,.2,'stone');
 block(g,'#a3a18c',-.5,.07,d/2+.34,1.28,.12,.46,'stone');
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
// A broad, folded leaf carries the silhouette itself. The crown has no solid
// balls under its foliage, so small gaps reveal forks and overlapping sprays.
const crownLeaf=new T.BufferGeometry(),leafPoints=[],leafUV=[],leafIndices=[];
for(let row=0;row<7;row++){
 const v=row/6,width=Math.pow(Math.sin(v*Math.PI),.75)*.31+.002,curve=.085*Math.sin(v*Math.PI)-.065*v*v;
 for(let col=0;col<3;col++){
  const side=col-1;leafPoints.push(side*width,curve+.055*(1-side*side)*Math.sin(v*Math.PI)-.012*side*side+.009*Math.sin(v*13+side*3),v-.48);leafUV.push(col/2,v);
 }
 if(row<6)for(let col=0;col<2;col++){const n=row*3+col;leafIndices.push(n,n+3,n+1,n+1,n+3,n+4)}
}
crownLeaf.setAttribute('position',new T.Float32BufferAttribute(leafPoints,3));crownLeaf.setAttribute('uv',new T.Float32BufferAttribute(leafUV,2));crownLeaf.setIndex(leafIndices);crownLeaf.computeVertexNormals();
const branchGeometry=new T.CylinderGeometry(1,1,1,7);
export function treeCrown(seed=0){
 if(!crownPalette){
  const source=miniatureTexture('leaf')||surfaceTexture('leaf'),canvas=document.createElement('canvas');canvas.width=canvas.height=512;const q=canvas.getContext('2d');q.filter='contrast(.8) saturate(.9)';q.drawImage(source.image,0,0,512,512);const leaf=new T.CanvasTexture(canvas);leaf.colorSpace=T.SRGBColorSpace;leaf.anisotropy=4;
  crownPalette=['#b9cea7','#cddbb7','#d4dfb9','#a6c398'].map(color=>{const m=new T.MeshStandardMaterial({color,map:leaf,bumpMap:leaf,bumpScale:.014,roughness:.73,side:T.DoubleSide});m.userData.seasonSurface='leaf';return m});
 }
 const g=new T.Group(),up=new T.Vector3(0,1,0),normal=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),mid=new T.Vector3(),bark=artisanMaterial('#9b8b6c','bark');
 const branch=(a,b,r)=>{start.fromArray(a);end.fromArray(b);mid.subVectors(end,start);const m=add(g,branchGeometry,bark,(start.x+end.x)/2,(start.y+end.y)/2,(start.z+end.z)/2,r,mid.length(),r*.8);m.quaternion.setFromUnitVectors(up,mid.normalize());return m};
 branch([0,-.74,0],[.025,.24,-.025],.073);
 const clusters=[[-.63,-.15,-.13,.38,.30,.37],[.58,-.10,.20,.40,.32,.37],[-.34,.40,.04,.42,.34,.39],[.23,.47,-.23,.40,.35,.40],[-.13,-.37,.37,.43,.28,.37],[.11,-.23,-.48,.43,.31,.37],[-.65,.19,.30,.36,.31,.35],[.62,.23,-.27,.36,.32,.35]];
 clusters.forEach(([cx,cy,cz,rx,ry,rz],cluster)=>{
  const phase=seed*.11,turn=new T.Vector3(cx,cy,cz).applyAxisAngle(up,phase),x=turn.x,y=turn.y,z=turn.z;
  branch([.025,-.38+cluster*.045,-.025],[x*.88,y,z*.88],.021+random(seed+cluster)*.014);
  for(let i=0;i<60;i++){
   const n=seed*173+cluster*97+i,a=i*2.399963+cluster*1.1,yy=1-2*(i+.5)/60,r=Math.sqrt(1-yy*yy),depth=.50+.50*Math.cbrt(random(n+40));
   const dx=Math.cos(a)*r*rx*depth,dz=Math.sin(a)*r*rz*depth,dy=yy*ry*depth,size=.19+random(n+18)*.11;
   const m=add(g,crownLeaf,crownPalette[(cluster+(i%5===0?1:0))%4],x+dx,y+dy,z+dz,size*(.90+random(n+15)*.22),size,size);
   normal.set(dx*.7,.14+dy*.8,dz*.7).normalize();m.quaternion.setFromUnitVectors(up,normal);m.rotateY(a+(random(n+30)-.5)*1.6);m.rotateX((random(n+32)-.5)*.65);
  }
 });
 return g;
}
export function meadowGeometry(){
 const points=[],uv=[],indices=[];
 for(let i=0;i<5;i++){
  const angle=i*2.399963,c=Math.cos(angle),s=Math.sin(angle),h=.20+random(i+70)*.15,w=.013+random(i+93)*.008,bend=.065+random(i+31)*.07,spread=.018+random(i+11)*.022,base=points.length/3;
  for(let row=0;row<3;row++){
   const v=row/2,width=w*(row===0?1:row===1?.63:.035),z=spread+bend*v*v;
   for(const side of [-1,1]){const x=side*width;points.push(x*c+z*s,v*h,z*c-x*s);uv.push((side+1)/2,v)}
  }
  indices.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3,base+3,base+4,base+5);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
