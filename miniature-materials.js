import * as T from './three.module.js';
const sources=new Map(),maps=new Map();
export async function loadMiniatureMaterials(){
 const definitions=[['./material-atlas-v07.png',['earth','bark','moss','leaf']],['./cottage-atlas-v07.png',['stone','wood','clay','fabric']]];
 await Promise.all(definitions.map(async([url,names])=>{const img=new Image();img.src=new URL(url,import.meta.url);await img.decode();names.forEach((name,i)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=768;const q=canvas.getContext('2d');q.drawImage(img,(i%2)*img.width/2,Math.floor(i/2)*img.height/2,img.width/2,img.height/2,0,0,768,768);sources.set(name,canvas)})}));
}
export function miniatureTexture(kind,repeat=1){
 const key=kind+repeat;if(maps.has(key))return maps.get(key);
 const original=sources.get(kind==='tilled'?'earth':kind);if(!original)return null;
 const c=document.createElement('canvas');c.width=c.height=768;const q=c.getContext('2d');
 q.filter=kind==='earth'?'contrast(.6) brightness(1.05) saturate(.65)':kind==='tilled'?'contrast(.75) brightness(.90) saturate(.7)':kind==='moss'?'contrast(.88) brightness(1.16) saturate(1.05)':kind==='leaf'?'brightness(1.15) saturate(.85)':'none';q.drawImage(original,0,0);q.filter='none';
 if(kind==='earth'){q.fillStyle='#927b5c55';q.fillRect(0,0,768,768)}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.repeat.set(repeat,repeat);map.anisotropy=8;maps.set(key,map);return map;
}
export function contactTexture(){const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#202416b0');g.addColorStop(.38,'#20241670');g.addColorStop(1,'#20241600');q.fillStyle=g;q.fillRect(0,0,64,64);return new T.CanvasTexture(c)}
export function soilEdgeTexture(){const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d'),im=q.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const edge=Math.max(Math.abs(x/127*2-1),Math.abs(y/127*2-1)),jitter=Math.sin(x*.6+y*.4)*.017+Math.sin(y*.83-x*.2)*.015,v=255*T.MathUtils.smoothstep(1-edge+jitter,0,.22);const i=(y*128+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}q.putImageData(im,0,0);return new T.CanvasTexture(c)}

// The game and HUD remain sharp around the player; only the scene goes through the lens.
export function miniatureLens(renderer){
 renderer.info.autoReset=false;
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:2,depthTexture:new T.DepthTexture(1,1)});
 const uniforms={sceneMap:{value:target.texture},depthMap:{value:target.depthTexture},pixel:{value:new T.Vector2(1,1)},depthRange:{value:99.9},blurScale:{value:1}};
 const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`varying vec2 vUv;uniform sampler2D sceneMap,depthMap;uniform vec2 pixel;uniform float depthRange,blurScale;
 float depthAt(vec2 uv){return texture2D(depthMap,uv).r*depthRange;}
 void main(){
  float z=depthAt(vUv);vec2 slope=vec2(dFdx(z),dFdy(z));float ao=0.;
  for(int i=0;i<8;i++){float a=float(i)*2.399963;vec2 offset=vec2(cos(a),sin(a))*(3.+float(i)*1.2);float delta=z+dot(slope,offset)-depthAt(vUv+offset*pixel);ao+=smoothstep(.025,.10,delta)*(1.-smoothstep(.15,.65,delta));}
  float coc=smoothstep(.22,.49,abs(vUv.y-.51))*3.0*blurScale;
  vec3 color=texture2D(sceneMap,vUv).rgb*2.;float total=2.;
  for(int i=0;i<12;i++){float a=float(i)*2.399963;vec2 offset=vec2(cos(a),sin(a))*sqrt((float(i)+.5)/12.)*coc;float other=depthAt(vUv+offset*pixel);float weight=1.-smoothstep(1.,3.,abs(other-z));color+=texture2D(sceneMap,vUv+offset*pixel).rgb*weight;total+=weight;}
  color/=total;color*=1.-ao*.045;float vignette=1.-.10*smoothstep(.32,.72,length((vUv-.5)*vec2(.85,1.)));
  gl_FragColor=vec4(color*vignette,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const scene=new T.Scene();scene.add(new T.Mesh(new T.PlaneGeometry(2,2),material));const camera=new T.Camera();let width=0,height=0;
 return {render(world,view){renderer.info.reset();const size=renderer.getDrawingBufferSize(new T.Vector2());if(width!==size.x||height!==size.y){width=size.x;height=size.y;target.setSize(width,height);uniforms.pixel.value.set(1/width,1/height);uniforms.blurScale.value=height/900}uniforms.depthRange.value=view.far-view.near;renderer.setRenderTarget(target);renderer.render(world,view);renderer.setRenderTarget(null);renderer.render(scene,camera)}};
}
