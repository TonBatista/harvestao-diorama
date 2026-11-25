import * as T from './three.module.js';
import {addStreetDetails} from './village-street-details.js?v=0.54.0';
import {PLAZA,VILLAGE_BOUNDS,VILLAGE_BEACH,VILLAGE_BRIDGE,villageWalkHeight,distanceToStream} from './village-layout.js?v=0.50';

const SIDEWALK=2.45,GUTTER=.18,VERGE=SIDEWALK+GUTTER;
const plazaNorth=PLAZA.z-PLAZA.depth/2,plazaSouth=PLAZA.z+PLAZA.depth/2;
const inner=PLAZA.width/2+VERGE,outer=inner+6.8;
const upper=plazaNorth-VERGE,lower=plazaSouth+VERGE;
const [west,east,,south]=VILLAGE_BOUNDS;
const streets=[
 {axis:'x',lo:west,hi:outer+VERGE,a:upper-6.8,b:upper},
 {axis:'x',lo:-outer-VERGE,hi:outer+VERGE,a:lower,b:lower+6.8},
 {axis:'z',lo:upper-6.8,hi:lower+6.8,a:-outer,b:-inner},
 {axis:'z',lo:upper-6.8,hi:lower+6.8,a:inner,b:outer},
 {axis:'x',lo:outer-.1,hi:east,a:VILLAGE_BEACH.z-3.6,b:VILLAGE_BEACH.z+3.6},
 {axis:'z',lo:lower+3.4,hi:south,a:-3.8,b:3.8}
];
const walks=[
 [-20.4,-18.45,-20,-18.25],[1.55,3.35,-20,-18.25],[19.9,21.7,-20,-18.25],
 [-24.7,-21.9,.8,3.2],[21.9,24.8,1.8,4.2],
 [-24.65,-21.9,12.05,14.15],[21.9,24.3,12.6,14.9],
 [-16.6,16.6,42.1,43.55],
 ...[51,68,85].map(z=>[-10.8,10.8,z+2.5,z+4.05])
];
const priority={plaza:0,walk:1,gutter:2,road:4};
const noise=n=>{const f=Math.sin(n*91.173+39.3)*16453.495;return f-Math.floor(f)};
function pavingTexture(kind){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 const mosaic=kind==='walk';
 ctx.fillStyle=mosaic?'#a39b83':'#666760';
 ctx.fillRect(0,0,256,256);
 if(kind==='gutter'){
  ctx.fillStyle='#555a55';ctx.fillRect(0,0,256,256);
  ctx.fillStyle='#777c72';ctx.fillRect(12,0,232,256);
  ctx.fillStyle='#909082';ctx.fillRect(21,0,27,256);ctx.fillRect(208,0,27,256);
  ctx.fillStyle='#666b62';ctx.fillRect(51,0,154,256);
 }else{
  const cols=mosaic?32:8,rows=mosaic?32:10,dx=256/cols,dz=256/rows;
  const stone=kind==='plaza'?['#c4bda9','#c0b8a4','#b6ae9e','#d0c7b4']:['#9a9b94','#8e918d','#a5a7a0','#878d87','#969991'];
  const cream=['#e0d4b6','#e8ddc2','#d5c7a9','#cfc3a7','#f0e1c2'];
  for(let row=0;row<rows;row++)for(let col=-1;col<cols;col++){
   const c=(col+cols)%cols,n=row*cols+c,x=col*dx+(row%2)*dx*.5,y=row*dz;
   const u=(col+(row%2)*.5)/cols,v=row/rows;
   const wave=((u-.22*Math.sin(v*Math.PI*2))%1+1)%1;
   const dark=mosaic&&wave<.30;
   const palette=dark?['#333633','#43443e','#535149']:mosaic?cream:stone;
   ctx.fillStyle=palette[Math.floor(noise(n)*palette.length)];
   ctx.beginPath();if(mosaic){const jitter=()=>.8+noise(n+ctx.currentSeed++)*1.1;ctx.currentSeed=1;ctx.moveTo(x+jitter(),y+jitter());ctx.lineTo(x+dx-jitter(),y+jitter());ctx.lineTo(x+dx-jitter(),y+dz-jitter());ctx.lineTo(x+jitter(),y+dz-jitter());ctx.closePath()}else ctx.roundRect(x+1,y+1,dx-2,dz-2,5);ctx.fill();
   ctx.save();ctx.clip();
   ctx.fillStyle=dark?'#ffffff18':'#ffffff32';ctx.fillRect(x+4,y+2,dx-8,1.2);
   // Occasional worn stones, rather than noise on every tile.
   if(noise(n+1901)>.91){ctx.strokeStyle='#44483c88';ctx.lineWidth=mosaic?.55:1;ctx.beginPath();ctx.moveTo(x+dx*.36,y);ctx.lineTo(x+dx*.48,y+dz*.42);ctx.lineTo(x+dx*.29,y+dz*.68);ctx.lineTo(x+dx*.53,y+dz);ctx.stroke()}
   if(noise(n+2107)>.94){ctx.fillStyle='#68775177';ctx.beginPath();ctx.ellipse(x+dx*.18,y+dz*.79,dx*.24,dz*.2,-.3,0,Math.PI*2);ctx.fill()}
   if(noise(n+3011)>.94){ctx.fillStyle='#62675a';ctx.beginPath();ctx.moveTo(x,y+dz);ctx.lineTo(x+dx*.28,y+dz);ctx.lineTo(x,y+dz*.72);ctx.fill()}
   ctx.restore();
  }
 }
 const map=new T.CanvasTexture(canvas);
 map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;
 return map;
}
function section(street,x,z){
 const along=street.axis==='z'?z:x,across=street.axis==='z'?x:z;
 if(along<street.lo||along>street.hi)return null;
 const distance=Math.max(street.a-across,across-street.b,0);
 if(distance===0)return {kind:'road',street};
 if(distance<GUTTER)return {kind:'gutter',street};
 if(distance<VERGE)return {kind:'walk',street};
 return null;
}
function pavement(x,z){
 let best=null;
 for(const street of streets){
  const mark=section(street,x,z);
  if(mark&&(!best||priority[mark.kind]>priority[best.kind]))best=mark;
 }
 if(best)return best;
 if(walks.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d))return {kind:'walk'};
 if(Math.abs(x)<PLAZA.width/2&&z>plazaNorth&&z<plazaSouth)return {kind:'plaza'};
 return null;
}
export function onVillagePavement(x,z){return pavement(x,z)!==null||distanceToStream(x,z)<1.20}
function breaks(axis){
 const values=new Set();
 for(const street of streets){
  if(street.axis===axis){values.add(street.lo);values.add(street.hi)}
  else for(const offset of [0,GUTTER,VERGE]){
   values.add(street.a-offset);values.add(street.b+offset);
  }
 }
 for(const walk of walks){const i=axis==='x'?0:2;values.add(walk[i]);values.add(walk[i+1])}
 if(axis==='x'){values.add(-PLAZA.width/2);values.add(PLAZA.width/2)}
 else for(const z of [plazaNorth,plazaSouth,22.4,26.8,VILLAGE_BRIDGE.start,VILLAGE_BRIDGE.end])values.add(z);
 return [...values].sort((a,b)=>a-b);
}
export function addVillageStreets(region){
 if(region.id!=='village')return;
 const buffers=Object.fromEntries(Object.keys(priority).map(kind=>[kind,{position:[],uv:[],index:[]}]));
 const xs=breaks('x'),zs=breaks('z');
 for(let j=1;j<zs.length;j++)for(let i=1;i<xs.length;i++){
  const x0=xs[i-1],x1=xs[i],z0=zs[j-1],z1=zs[j],x=(x0+x1)/2,z=(z0+z1)/2;
  if(x1-x0<1e-5||z1-z0<1e-5)continue;
  const mark=pavement(x,z);
  if(!mark)continue;
  const {kind,street}=mark,b=buffers[kind],crosswise=street?.axis==='x';
  const strips=Math.max(1,Math.ceil((z1-z0)/.55)),base=b.position.length/3;
  for(let k=0;k<=strips;k++){
   const zz=z0+(z1-z0)*k/strips;
   for(const xx of [x0,x1]){
    const lift=kind==='walk'?.043:kind==='gutter'?.018:.029;
    b.position.push(xx,villageWalkHeight(xx,zz)+lift,zz);
    if(kind==='gutter'){
     const across=crosswise?zz:xx,along=crosswise?xx:zz;
     const side=(crosswise?z:x)<street.a;
     const width=GUTTER,edge=side?street.a:street.b;
     b.uv.push(Math.abs(across-edge)/width,along/1.2);
    }else if(kind==='walk')b.uv.push(zz/3.6,-xx/3.6);else b.uv.push(xx/2.35,zz/2.35);
   }
   if(k<strips){const n=base+k*2;b.index.push(n,n+2,n+1,n+1,n+2,n+3)}
  }
 }
 for(const [kind,b] of Object.entries(buffers)){
  if(!b.position.length)continue;
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(b.position,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));
  geometry.setIndex(b.index);geometry.computeVertexNormals();
  const map=pavingTexture(kind),material=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,roughness:.91});
  material.userData.regionOwned=true;material.userData.seasonSurface='path';
  const mesh=new T.Mesh(geometry,material);
  mesh.name='village-'+kind;mesh.receiveShadow=true;region.fixed.add(mesh);
 }
 addStreetDetails(region,pavement);
}
