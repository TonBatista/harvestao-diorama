import * as T from './three.module.js';
import {CROPS} from './simulation.js?v=0.17';
import {miniatureTexture} from './miniature-materials.js?v=0.17';

// Every shape and material is shared: world.js can merge a whole field by material.
const random=n=>{const v=Math.sin(n*127.1+34.2)*43758.5453;return v-Math.floor(v)};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

function leafGeometry(kind){
 const position=[],uv=[],indices=[],compact=kind==='sepal',rows=compact?4:10,columns=compact?3:4,stride=(rows+1)*(columns+1);
 // Cupped, fleshy blades have an underside and a raised midrib.
 for(let side=0;side<2;side++)for(let i=0;i<=rows;i++){
  const t=i/rows,s=Math.max(0,Math.sin(Math.PI*t));
  let width=.39*Math.pow(s,.69),rise=.245*s+.055*t*t;
  if(kind==='turnip')width=.39*Math.pow(s,.57)*(1+.09*Math.sin(t*Math.PI*7));
  if(kind==='strawberry')width=.48*Math.pow(s,.57)*(1-.085*Math.abs(Math.sin(t*Math.PI*16)));
  if(kind==='lance'||kind==='sepal')width=.20*Math.pow(s,.81);
  if(kind==='vine')width=.51*Math.pow(s,.54)*(1+.13*Math.cos(t*Math.PI*5));
  if(kind==='corn'){width=.16*Math.pow(s,.7);rise=.43*Math.sin(t*Math.PI*.87)-t*.11}
  for(let j=0;j<=columns;j++){
   const u=j/columns*2-1,edge=Math.pow(Math.abs(u),1.5),rib=Math.exp(-u*u*95)*s*.025;
   const fold=-edge*s*.145,wrinkle=Math.sin(t*39+Math.abs(u)*7)*edge*s*.018;
   const thickness=s*(1-u*u)*.014*(side?-1:1);
   position.push(u*width,rise+fold+wrinkle+rib+thickness,t+Math.sin(t*8)*u*s*.016);
   uv.push(j/columns,1-t);
  }
 }
 for(let side=0;side<2;side++)for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
  const a=side*stride+i*(columns+1)+j,b=a+1,c=a+columns+1,d=c+1;
  indices.push(...(side?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function leafTexture(base,bump=false){
 const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');
 q.fillStyle=bump?'#828282':'#587c46';q.fillRect(0,0,512,512);
 if(base?.image){q.globalAlpha=bump?.22:.32;q.drawImage(base.image,0,0,512,512);q.globalAlpha=1}
 // The veins follow the leaf UVs, so they stay coherent on the curved surface.
 for(let side=-1;side<=1;side+=2)for(let i=0;i<8;i++){
  const y=92+i*45,tipy=y-58,tipx=256+side*(88+Math.sin(i*.44)*72);
  q.strokeStyle=bump?'#b0b0b0':'#b4c78d66';q.lineWidth=3.8;q.beginPath();q.moveTo(256,y+28);q.quadraticCurveTo(256+side*65,y,tipx,tipy);q.stroke();
  for(let j=0;j<3;j++){const t=.32+j*.20,x=256+(tipx-256)*t,yy=y+28+(tipy-y-28)*t;q.lineWidth=1.2;q.strokeStyle=bump?'#969696':'#a0b67b40';q.beginPath();q.moveTo(x,yy);q.lineTo(x+side*28,yy-31);q.stroke()}
 }
 q.strokeStyle=bump?'#cacaca':'#b6ca8e99';q.lineWidth=6;q.beginPath();q.moveTo(256,512);q.bezierCurveTo(260,335,253,140,256,0);q.stroke();
 const map=new T.CanvasTexture(c);map.colorSpace=bump?T.NoColorSpace:T.SRGBColorSpace;map.anisotropy=8;return map;
}

function fruitTexture(kind,bump=false){
 const size=512,c=document.createElement('canvas');c.width=c.height=size;
 const q=c.getContext('2d'),image=q.createImageData(size,size);
 const palette=kind==='berry'?[184,31,23]:kind==='turnip'?[226,224,204]:kind==='cucumber'?[66,95,37]:kind==='potato'?[156,121,75]:[142,69,74];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,noise=(random(x*7+y*11)-.5)*13;
  let variation=noise;
  if(kind==='berry')variation+=Math.sin(x*.035)*5+Math.cos(y*.018)*6;
  if(kind==='cucumber')variation+=Math.pow((1+Math.cos(x/size*Math.PI*16))/2,8)*22;
  const shade=kind==='turnip'?Math.sin(y/size*Math.PI)*7:0;
  for(let k=0;k<3;k++)image.data[i+k]=bump?128+noise:palette[k]+variation+shade;
  image.data[i+3]=255;
 }
 q.putImageData(image,0,0);
 if(kind==='turnip'&&!bump){const g=q.createLinearGradient(0,0,0,size);g.addColorStop(0,'#bfa8b54d');g.addColorStop(.35,'#e4dbd100');g.addColorStop(.65,'#a7a08208');g.addColorStop(1,'#77634780');q.fillStyle=g;q.fillRect(0,0,size,size)}
 if(kind==='berry')for(let row=0;row<14;row++){
  const y=52+row*28,count=23;
  for(let col=0;col<count;col++){
   const id=row*count+col,x=(col+.5+(row%2)*.5)*size/count+random(id+3)*3;
   q.save();q.translate(x,y+random(id+700)*5);q.rotate((random(id+411)-.5)*.5);
   q.fillStyle=bump?'#656565':'#5f160e88';q.beginPath();q.ellipse(0,1,3.1,5.1,0,0,Math.PI*2);q.fill();
   q.fillStyle=bump?'#c6c6c6':'#d9b66d';q.beginPath();q.ellipse(-.35,-.35,1.5,3.1,0,0,Math.PI*2);q.fill();
   q.restore();
  }
 }
 if(kind==='potato')for(let i=0;i<32;i++){const x=random(i+33)*size,y=random(i+99)*size;q.fillStyle=bump?'#626262':'#75522e66';q.beginPath();q.ellipse(x,y,2.7,1.7,.3,0,Math.PI*2);q.fill()}
 const map=new T.CanvasTexture(c);map.colorSpace=bump?T.NoColorSpace:T.SRGBColorSpace;map.anisotropy=8;return map;
}

export function createCropArt(){
 const baseLeaf=miniatureTexture('leaf');
 const leafMap=leafTexture(baseLeaf),leafBump=leafTexture(baseLeaf,true);
 const greens=['#d0dfc4','#bdcea8','#a7c099','#dde7c9'].map(color=>new T.MeshStandardMaterial({color,map:leafMap,bumpMap:leafBump,bumpScale:.009,roughness:.74,side:T.DoubleSide}));
 const stems=new T.MeshStandardMaterial({color:'#6e8740',roughness:.83});
 const gold=new T.MeshStandardMaterial({color:'#d8aa43',roughness:.82});
 const flowerWhite=new T.MeshStandardMaterial({color:'#f1ebd4',roughness:.84,side:T.DoubleSide});
 const purpleStem=new T.MeshStandardMaterial({color:'#88735a',roughness:.95});
 const berryMap=fruitTexture('berry'),berryBump=fruitTexture('berry',true);
 const berries=['#fff0df','#d6d8bd'].map(color=>new T.MeshStandardMaterial({color,map:berryMap,bumpMap:berryBump,bumpScale:.0045,roughness:.56}));
 const turnipMap=fruitTexture('turnip'),root=new T.MeshStandardMaterial({map:turnipMap,roughness:.87,bumpMap:turnipMap,bumpScale:.002});
 const potatoMap=fruitTexture('potato'),potato=new T.MeshStandardMaterial({map:potatoMap,bumpMap:potatoMap,bumpScale:.003,roughness:.92});
 const sweetMap=fruitTexture('sweetpotato'),sweet=new T.MeshStandardMaterial({map:sweetMap,bumpMap:sweetMap,bumpScale:.003,roughness:.91});
 const cucumberMap=fruitTexture('cucumber'),cucumber=new T.MeshStandardMaterial({map:cucumberMap,bumpMap:cucumberMap,bumpScale:.003,roughness:.73});
 const tomatoRed=new T.MeshStandardMaterial({color:'#c24328',roughness:.54});
 const tomatoGreen=new T.MeshStandardMaterial({color:'#8ca351',roughness:.72});
 const onionSkin=new T.MeshStandardMaterial({color:'#caa264',roughness:.86});
 const carrotSkin=new T.MeshStandardMaterial({color:'#cf792e',roughness:.83});
 const pumpkinSkin=new T.MeshStandardMaterial({color:'#c57e38',roughness:.77});
 const eggplantSkin=new T.MeshStandardMaterial({color:'#65506e',roughness:.55});
 const leekWhite=new T.MeshStandardMaterial({color:'#e8e6c4',roughness:.88});
 const seedMaterial=new T.MeshStandardMaterial({color:'#b9925d',roughness:1});
 const shapes=Object.fromEntries(['turnip','strawberry','oval','lance','vine','corn','sepal'].map(kind=>[kind,leafGeometry(kind)]));
 const sphere=new T.SphereGeometry(1,12,8),smallSphere=new T.SphereGeometry(1,8,6),stemGeometry=new T.CylinderGeometry(.8,1,1,5,1),cone=new T.ConeGeometry(1,1,7);
 const strawberryGeometry=new T.SphereGeometry(1,16,10),sp=strawberryGeometry.attributes.position;
 for(let i=0;i<sp.count;i++){
  const y=sp.getY(i),angle=Math.atan2(sp.getZ(i),sp.getX(i)),taper=.54+.46*(y+1)/2;
  const ridge=1+Math.cos(angle*5)*.018;
  sp.setXYZ(i,sp.getX(i)*taper*ridge,y,sp.getZ(i)*taper*ridge);
 }
 strawberryGeometry.computeVertexNormals();
 // One shared ribbed mesh gives every pumpkin a carved silhouette without extra pieces.
 const pumpkinGeometry=sphere.clone(),pp=pumpkinGeometry.attributes.position;
 for(let i=0;i<pp.count;i++){const a=Math.atan2(pp.getZ(i),pp.getX(i)),rib=1+.09*Math.cos(a*8);pp.setXYZ(i,pp.getX(i)*rib,pp.getY(i),pp.getZ(i)*rib)}
 pumpkinGeometry.computeVertexNormals();
 const up=new T.Vector3(0,1,0),direction=new T.Vector3();
 function mesh(parent,g,material,x,y,z,sx=1,sy=sx,sz=sx){const m=new T.Mesh(g,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
 function stem(parent,a,b,r=.007,material=stems){direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const m=mesh(parent,stemGeometry,material,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,direction.length(),r);m.quaternion.setFromUnitVectors(up,direction.normalize());return m}
 function leaf(parent,kind,x,y,z,length,angle,tilt=-.2,color=0,width=1,roll=0){const m=mesh(parent,shapes[kind],greens[color%greens.length],x,y,z,length*width,length,length);m.rotation.set(tilt,angle,roll,'YXZ');return m}
 function calyx(parent,x,y,z,size=.07){for(let i=0;i<5;i++)leaf(parent,'sepal',x,y,z,size,i*Math.PI*.4,.12,i%4,1.35)}
 function flower(parent,x,y,z,size=.035){for(let i=0;i<5;i++){const a=i*Math.PI*.4;mesh(parent,smallSphere,flowerWhite,x+Math.sin(a)*size*.65,y,z+Math.cos(a)*size*.65,size*.65,size*.16,size*.53)}mesh(parent,smallSphere,gold,x,y+.004,z,size*.33,size*.22,size*.33)}
 function strawberry(parent,x,y,z,r=.135,color=0){mesh(parent,strawberryGeometry,berries[color%2],x,y,z,r,r*1.13,r);calyx(parent,x,y+r*1.03,z,r*.62)}
 function bulb(parent,x,y,z,size=1){mesh(parent,sphere,root,x,y,z,.175*size,.12*size,.175*size);mesh(parent,cone,root,x,y-.13*size,z,.027*size,.12*size,.025*size).rotation.z=Math.PI}
 function turnipLeaves(parent,x,z,stage,seed,y=.25,held=false){
  const growth=.25+stage*.75,count=stage<.32?4:stage<.65?7:10;
  for(let i=0;i<count;i++){
   const a=i*2.399+random(seed)*2+(random(seed+i*17)-.5)*.42,inner=i>=6,length=(inner?.29:.405)*growth*(.81+random(seed+i)*.28),tilt=inner?-.88-random(i+seed)*.24:-.25-random(i+seed)*.36;
   const dx=Math.sin(a)*(inner?.012:.035),dz=Math.cos(a)*(inner?.012:.035);
   stem(parent,[x,y-.07,z],[x+dx,y+.012,z+dz],.010*growth);
   leaf(parent,'turnip',x+dx,y+(inner?.025:0)+(random(seed+i*11)-.5)*.045*growth,z+dz,length,a,tilt,i,inner?1.12:1.20,(random(seed+i*3)-.5)*.31);
  }
 }
 function strawberryPlant(parent,x,z,stage,seed){
  const growth=.24+stage*.76,count=stage<.35?2:3;
  for(let j=0;j<count;j++){
   const a=j*2.15+random(seed)*2+(random(seed+j+21)-.5)*.4,r=(.10+random(seed+j)*.055)*growth,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r,y=.12+growth*(.14+j*.058)+random(seed+j)*.025;
   stem(parent,[x,.10,z],[xx,y,zz],.009);
   // Three separate, serrated leaflets meet at each petiole.
   for(let k=-1;k<=1;k++){
    const angle=a+k*1.03,length=(k===0?.29:.25)*growth*(.88+random(seed+j*17+k+50)*.24);
    leaf(parent,'strawberry',xx,y,zz,length,angle,-.07-(k===0?.18:0)-random(seed+j*7+k+31)*.22,(j+k+4)%4,1.10,(random(seed+j+k)-.5)*.36);
   }
  }
  if(stage>.5)for(let i=0;i<2;i++)leaf(parent,'strawberry',x,.20+growth*(.12+i*.045),z,(.20+i*.035)*growth,i*2.4+seed,-.65-i*.12,i+1,1.08);
  if(stage>.64){
   const fruits=stage>=1?7:3;
   for(let j=0;j<fruits;j++){
    const a=Math.floor(j/2)*2.08+(j%2)*.57+.35+random(seed)*3,r=.25+random(seed+j+9)*.07,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
    if(stage>=1){const size=.118+random(seed+j+2)*.025,yy=.12+random(seed+j*7+4)*.065;stem(parent,[x,.31,z],[xx,yy+size*.90,zz],.006);strawberry(parent,xx,yy,zz,size,j)}
    else {flower(parent,xx,.20,zz,.040);stem(parent,[x,.18,z],[xx,.20,zz],.004)}
   }
  }
 }
 function potatoPlant(parent,x,z,stage,seed){
  const growth=.25+stage*.75;
  for(let j=0;j<4;j++){
   const a=j*2.4+seed,dx=Math.sin(a)*.11,dz=Math.cos(a)*.11,h=(.40+random(seed+j)*.11)*growth;
   stem(parent,[x,.06,z],[x+dx,h,z+dz],.012);
   for(let k=0;k<3;k++){
    const y=.14*growth+k*.10*growth,spread=.05+k*.015;
    for(const side of [-1,1])leaf(parent,'oval',x+dx*(k/3)+Math.sin(a+1.57)*spread*side,y,z+dz*(k/3)+Math.cos(a+1.57)*spread*side,(.24+k*.015)*growth,a+side*1.15,-.18,k+j,1.20);
   }
   leaf(parent,'oval',x+dx,h-.02,z+dz,.24*growth,a,-.50,j,1.12);
   if(stage>=.85&&j!==1)flower(parent,x+dx,h+.025,z+dz,.035);
  }
 }
 function vinePlant(parent,x,z,stage,seed,sweetPotato=false){
  const growth=.3+.7*stage;
  for(let j=0;j<4;j++){
   const a=j*2.4+random(seed)*3,tipx=x+Math.sin(a)*.24*growth,tipz=z+Math.cos(a)*.24*growth;
   stem(parent,[x,.07,z],[tipx,.13,tipz],.009,sweetPotato?purpleStem:stems);
   for(let k=0;k<3;k++){
    const t=(k+1)/3,xx=x+(tipx-x)*t,zz=z+(tipz-z)*t;
    leaf(parent,'vine',xx,.12+random(seed+k)*.06,zz,(.24+random(seed+k)*.04)*growth,a+(k%2?1:-1)*.8,-.12,j+k,sweetPotato?.94:1.08);
   }
   if(!sweetPotato&&stage>=.7){const xx=x+Math.sin(a)*.23,zz=z+Math.cos(a)*.23;if(stage>=1){const fruit=mesh(parent,sphere,cucumber,xx,.14,zz,.075,.24,.075);fruit.rotation.set(.85,a,.1);flower(parent,xx+Math.sin(a)*.15,.13,zz+Math.cos(a)*.15,.021)}else flower(parent,tipx,.2,tipz,.033)}
  }
 }
 function tomatoPlant(parent,x,z,stage,seed){
  const growth=.24+.76*stage,h=.88*growth;
  stem(parent,[x,.05,z],[x+.025,h,z],.013);
  stem(parent,[x+.10,.06,z],[x+.10,h+.06,z],.015,purpleStem);
  for(let j=0;j<6;j++){
   const a=j*2.4+random(seed)*2,y=.19*growth+j*.10*growth,r=.14*growth,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
   stem(parent,[x,y-.03,z],[xx,y+.03,zz],.006);
   for(let k=-1;k<=1;k++)leaf(parent,'turnip',xx,y+.02,zz,(k===0?.23:.17)*growth,a+k*1.1,-.15,j+k+4,.75);
  }
  if(stage>.65)for(let j=0;j<4;j++){const a=j*2.4+.5,r=.19,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r,y=.23+(j%3)*.14,size=stage>=1?.115:.075;stem(parent,[x,y+.1,z],[xx,y+.09,zz],.005);mesh(parent,sphere,stage>=1?tomatoRed:tomatoGreen,xx,y,zz,size,size*.85,size);calyx(parent,xx,y+size*.81,zz,size*.58)}
 }
 function cornPlant(parent,x,z,stage,seed){
  const growth=.2+.8*stage,h=1.20*growth;
  stem(parent,[x,.05,z],[x,h,z],.018);
  for(let j=0;j<7;j++){const a=j*Math.PI+.38,y=.16+j*.13*growth;leaf(parent,'corn',x,y,z,(.48-j*.025)*growth,a,-.10,j,1.2)}
  if(stage>.7)for(let j=0;j<2;j++){
   const side=j?1:-1,xx=x+side*.065,yy=.58+j*.19;
   const cob=mesh(parent,sphere,gold,xx,yy,z,.06,.16,.06);cob.rotation.z=side*-.25;
   for(let k=0;k<3;k++)leaf(parent,'lance',xx,yy-.13,z,.31,k*2.1,-1.1,k,.8);
  }
  if(stage>.8)for(let j=0;j<7;j++){const a=j*2.4;stem(parent,[x,h-.1,z],[x+Math.sin(a)*.085,h+.10+random(seed+j)*.04,z+Math.cos(a)*.085],.004,gold)}
 }
 function seasonalRoot(parent,x,y,z,kind,size=1){
  if(kind==='onion'){
   mesh(parent,sphere,onionSkin,x,y,z,.16*size,.15*size,.16*size);
   const neck=mesh(parent,cone,onionSkin,x,y+.17*size,z,.065*size,.18*size,.065*size);neck.rotation.z=.13;
   mesh(parent,cone,purpleStem,x,y-.15*size,z,.026*size,.07*size,.026*size).rotation.z=Math.PI;
  }else if(kind==='carrot'){
   mesh(parent,cone,carrotSkin,x,y-.04*size,z,.075*size,.33*size,.075*size).rotation.z=Math.PI;
   mesh(parent,sphere,carrotSkin,x,y+.10*size,z,.076*size,.055*size,.076*size);
  }else{
   mesh(parent,sphere,root,x,y,z,.10*size,.18*size,.10*size);
   mesh(parent,cone,root,x,y-.19*size,z,.045*size,.16*size,.045*size).rotation.z=Math.PI;
  }
 }
 function rootPlant(parent,x,z,stage,seed,kind){
  const growth=.25+stage*.75;
  if(stage>.48)seasonalRoot(parent,x,kind==='carrot'?.08:.13,z,kind,(stage-.25)/.75);
  const count=kind==='carrot'?6:kind==='onion'?5:7;
  for(let i=0;i<count;i++){
   const a=i*2.399+random(seed)*3,h=(.34+random(seed+i)*.13)*growth;
   if(kind==='carrot'){
    stem(parent,[x,.14,z],[x+Math.sin(a)*.06,h,z+Math.cos(a)*.06],.008);
    for(let j=0;j<3;j++)leaf(parent,'lance',x+Math.sin(a)*.03,.20*growth+j*.065,z+Math.cos(a)*.03,.18*growth,a+(j%2?1:-1)*.8,-.55,i,.65);
   }else leaf(parent,kind==='onion'?'corn':'turnip',x,.16,z,h,a,-.75-random(seed+i)*.35,i,kind==='onion'?.48:.87);
  }
 }
 function pumpkin(parent,x,y,z,size=1){
  mesh(parent,pumpkinGeometry,pumpkinSkin,x,y,z,.28*size,.20*size,.28*size);
  const stalk=mesh(parent,stemGeometry,purpleStem,x,y+.22*size,z,.028*size,.11*size,.028*size);stalk.rotation.z=.2;
 }
 function pumpkinPlant(parent,x,z,stage,seed){
  const growth=.24+stage*.76;
  for(let i=0;i<6;i++){const a=i*2.399+random(seed)*2,r=.17*growth,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;stem(parent,[x,.08,z],[xx,.13,zz],.009);leaf(parent,'vine',xx,.14,zz,(.32+random(seed+i)*.05)*growth,a,-.24,i,1.14)}
  if(stage>.72)pumpkin(parent,x+.08,.17,z-.02,stage>=1?1:.65);
  else if(stage>.56)flower(parent,x+.18,.18,z,.05);
 }
 function pineapple(parent,x,y,z,size=1){
  mesh(parent,sphere,gold,x,y,z,.14*size,.24*size,.14*size);
  // Tiny shared scales catch the light; no extra texture allocation per fruit.
  for(let row=0;row<3;row++)for(let j=0;j<6;j++){const a=(j+(row%2)*.5)*Math.PI/3;mesh(parent,smallSphere,onionSkin,x+Math.sin(a)*.135*size,y+(row-1)*.105*size,z+Math.cos(a)*.135*size,.028*size,.038*size,.028*size)}
  for(let j=0;j<5;j++)leaf(parent,'corn',x,y+.20*size,z,.25*size,j*2.399,-.88,j,.75);
 }
 function pineapplePlant(parent,x,z,stage,seed){
  const growth=.3+stage*.7;
  for(let j=0;j<9;j++)leaf(parent,'corn',x,.08,z,.46*growth,j*2.399+random(seed),j<5?-.27:-.73,j,1.35);
  if(stage>.78){stem(parent,[x,.12,z],[x,.45,z],.025);pineapple(parent,x,.50,z,stage>=1?1:.64)}
 }
 function eggplant(parent,x,y,z,size=1){
  const fruit=mesh(parent,sphere,eggplantSkin,x,y,z,.105*size,.21*size,.10*size);fruit.rotation.z=.18;
  calyx(parent,x-.02*size,y+.19*size,z,.10*size);
 }
 function eggplantPlant(parent,x,z,stage,seed){
  const growth=.26+stage*.74,h=.64*growth;stem(parent,[x,.05,z],[x,h,z],.017,purpleStem);
  for(let j=0;j<7;j++){const a=j*2.399+random(seed),y=.14+j*.064*growth;leaf(parent,'vine',x,y,z,.28*growth,a,-.25,j,.92)}
  if(stage>.68)for(let j=0;j<3;j++){const a=j*2.1+seed,xx=x+Math.sin(a)*.17,zz=z+Math.cos(a)*.17,y=.25+(j%2)*.14;stem(parent,[x,y+.17,z],[xx,y+.14,zz],.006);if(stage>=1)eggplant(parent,xx,y,zz,.83);else flower(parent,xx,y+.1,zz,.025)}
 }
 function leafyPlant(parent,x,z,stage,seed,kale=false){
  const growth=.25+stage*.75,count=kale?9:7;
  if(kale)stem(parent,[x,.05,z],[x,.32*growth,z],.023);
  for(let j=0;j<count;j++){const a=j*2.399+random(seed),inner=j>4,y=kale?(.07+j*.025)*growth:.07;leaf(parent,kale?'turnip':'oval',x,y,z,(inner?.29:.39)*growth,a,inner?-.95:-.35,j,kale?1.10:.94,(random(seed+j)-.5)*.3)}
 }
 function leekPlant(parent,x,z,stage,seed){
  const growth=.25+stage*.75;
  for(let j=0;j<3;j++){const a=j*2.1,xx=x+Math.sin(a)*.055,zz=z+Math.cos(a)*.055;stem(parent,[xx,.035,zz],[xx,.34*growth,zz],.025,leekWhite);for(let k=0;k<2;k++)leaf(parent,'corn',xx,.25*growth,zz,.49*growth,a+k*2.0+random(seed),-.72-k*.16,j,1.1)}
 }
 function heldCrop(parent,id,x,z){
  if(id==='turnip'){bulb(parent,x,.15,z,1.05);turnipLeaves(parent,x,z,1,2,.28,true);return}
  if(id==='onion'||id==='carrot'||id==='winterradish'){seasonalRoot(parent,x,.18,z,id,1.15);for(let j=0;j<4;j++)leaf(parent,id==='onion'?'corn':'turnip',x,.32,z,.29,j*2.399,-.88,j,id==='onion'?.5:.75);return}
  if(id==='pumpkin'){pumpkin(parent,x,.20,z,1.1);return}
  if(id==='pineapple'){pineapple(parent,x,.25,z,1.05);return}
  if(id==='eggplant'){eggplant(parent,x,.23,z,1.3);return}
  if(id==='spinach'||id==='kale'){leafyPlant(parent,x,z,1,2,id==='kale');return}
  if(id==='leek'){leekPlant(parent,x,z,1,2);return}
  if(id==='strawberry'){strawberry(parent,x,.17,z,.21);return}
  if(id==='tomato'){mesh(parent,sphere,tomatoRed,x,.14,z,.22,.19,.22);calyx(parent,x,.32,z,.13);return}
  if(id==='potato'||id==='sweetpotato'){const m=mesh(parent,sphere,id==='potato'?potato:sweet,x,.13,z,id==='potato'?.23:.13,id==='potato'?.15:.29,.16);m.rotation.z=id==='potato'?.14:.9;return}
  if(id==='cucumber'){const m=mesh(parent,sphere,cucumber,x,.14,z,.105,.36,.105);m.rotation.z=.78;return}
  if(id==='corn'){const m=mesh(parent,sphere,gold,x,.18,z,.12,.34,.12);m.rotation.z=.45;for(let i=0;i<3;i++)leaf(parent,'corn',x,.02,z,.50,i*2.1,-.9,i,1.7);return}
 }
 function cropModel(parent,p,x,z,held=false){
  const definition=CROPS[p.crop];if(!definition)return;
  if(held){heldCrop(parent,p.crop,x,z);return}
  const stage=clamp(p.age/definition.days),seed=x*11+z*31;
  if(stage<.13){for(let i=0;i<3;i++)mesh(parent,smallSphere,seedMaterial,x+(i-1)*.09,.072,z+random(seed+i)*.025,.023,.014,.016);return}
  if(p.crop==='turnip'){
   if(stage>.5)bulb(parent,x,.125,z,(stage-.3)/.7);
   turnipLeaves(parent,x,z,stage,seed,.12+stage*.14);
  }else if(p.crop==='strawberry')strawberryPlant(parent,x,z,stage,seed);
  else if(p.crop==='potato')potatoPlant(parent,x,z,stage,seed);
  else if(p.crop==='cucumber'||p.crop==='sweetpotato')vinePlant(parent,x,z,stage,seed,p.crop==='sweetpotato');
  else if(p.crop==='tomato')tomatoPlant(parent,x,z,stage,seed);
  else if(p.crop==='corn')cornPlant(parent,x,z,stage,seed);
  else if(p.crop==='onion'||p.crop==='carrot'||p.crop==='winterradish')rootPlant(parent,x,z,stage,seed,p.crop);
  else if(p.crop==='pumpkin')pumpkinPlant(parent,x,z,stage,seed);
  else if(p.crop==='pineapple')pineapplePlant(parent,x,z,stage,seed);
  else if(p.crop==='eggplant')eggplantPlant(parent,x,z,stage,seed);
  else if(p.crop==='spinach'||p.crop==='kale')leafyPlant(parent,x,z,stage,seed,p.crop==='kale');
  else if(p.crop==='leek')leekPlant(parent,x,z,stage,seed);
 }
 function weedModel(parent,x,z){
  const seed=x*17+z*11;
  for(let i=0;i<9;i++){const a=i*2.399+random(seed)*2;leaf(parent,'lance',x,.075,z,.24+random(seed+i)*.13,a,-.12-random(seed+i+3)*.42,i,1.8,(random(seed+i+7)-.5)*.18)}
  for(let i=0;i<3;i++)leaf(parent,'lance',x,.09,z,.21,i*2.1,-1.05,i,1.3);
 }
 return {cropModel,weedModel};
}
