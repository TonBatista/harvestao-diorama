import * as T from './three.module.js';

// Seamless layers of seeded value noise: broad earthy variation with fine grain.
const hash=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*17.7)*43758.5453;return n-Math.floor(n)};
const smooth=t=>t*t*(3-2*t);
function noise(x,y,period,seed){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);const at=(a,b)=>hash((a+period)%period,(b+period)%period,seed);return T.MathUtils.lerp(T.MathUtils.lerp(at(ix,iy),at(ix+1,iy),u),T.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),u),v)-.5}
export function terrainTexture(kind,repeat){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(512,512);
 const moss=kind==='moss',base=moss?[101,119,61]:kind==='tilled'?[115,87,59]:[151,125,90];
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  let n=0;for(const [period,amplitude] of [[4,22],[12,15],[32,9],[96,6]])n+=noise(x/512*period,y/512*period,period,moss?9:3)*amplitude;
  n+=(hash(x,y,13)-.5)*(moss?13:9);const i=(y*512+x)*4;
  data.data[i]=base[0]+n;data.data[i+1]=base[1]+n;data.data[i+2]=base[2]+n*.8;data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);
 // Sparse flecks retain a tactile surface without the high-contrast gravel pattern.
 for(let i=0;i<2400;i++){const x=hash(i,1,5)*512,y=hash(i,2,5)*512;ctx.fillStyle=moss?(i%2?'#d1d99b18':'#263d2018'):(i%2?'#e8d6b51c':'#4f38221a');ctx.beginPath();ctx.ellipse(x,y,.4+hash(i,3,5)*1.2,.3+hash(i,4,5)*.6,hash(i,5,5)*6.28,0,Math.PI*2);ctx.fill()}
 const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(repeat,repeat);map.colorSpace=T.SRGBColorSpace;return map;
}
