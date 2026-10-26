import * as T from './three.module.js';
export const TRACK_LIFETIME=26;
export function trackFade(age){return Math.max(0,1-Math.max(0,age)/TRACK_LIFETIME)**2}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** Distance sampling leaves continuous treads at every frame rate, never a bridge after travel. */
export function createTrackSampler({spacing=.30,maxStep=3.5}={}){
 let previous=null,remainder=0;
 function reset(){previous=null;remainder=0}
 function advance(pose,enabled,emit){
  if(!enabled||!pose||![pose.x,pose.z,pose.angle].every(Number.isFinite)){reset();return 0}
  if(!previous){previous={x:pose.x,z:pose.z,angle:pose.angle};return 0}
  const dx=pose.x-previous.x,dz=pose.z-previous.z,distance=Math.hypot(dx,dz);let count=0;
  if(distance>maxStep){previous.x=pose.x;previous.z=pose.z;previous.angle=pose.angle;remainder=0;return 0}
  if(distance>1e-6){const turn=wrap(pose.angle-previous.angle);for(let along=spacing-remainder;along<=distance+1e-8;along+=spacing){const t=along/distance;emit(previous.x+dx*t,previous.z+dz*t,previous.angle+turn*t);count++}remainder=(remainder+distance)%spacing;if(remainder<1e-8||spacing-remainder<1e-8)remainder=0}
  previous.x=pose.x;previous.z=pose.z;previous.angle=pose.angle;return count;
 }
 return {advance,reset,get remainder(){return remainder}};
}
function treadGeometry(){const p=[],n=[],uv=[];function rect(cx,cz,angle){const cs=Math.cos(angle),sn=Math.sin(angle),corners=[[-.078,-.022],[.078,-.022],[.078,.022],[-.078,.022]],verts=corners.map(([x,z])=>[cx+x*cs-z*sn,.024,cz+x*sn+z*cs]);for(const i of[0,1,2,0,2,3]){p.push(...verts[i]);n.push(0,1,0);uv.push((i===0||i===3)?0:1,i<2?0:1)}}for(let row=0;row<4;row++)for(const side of[-1,1])rect(side*.071,-.15+row*.10,side*.42);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g}
export function createTractorTracks(scene,{coarse=false}={}){
 const capacity=coarse?120:220,geometry=treadGeometry(),births=new Float32Array(capacity).fill(-1000),birthAttribute=new T.InstancedBufferAttribute(births,1);geometry.setAttribute('trackBirth',birthAttribute);
 const uniforms={trackNow:{value:0},trackLife:{value:TRACK_LIFETIME}},material=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.33,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='attribute float trackBirth; uniform float trackNow; uniform float trackLife; varying float vTrackFade;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vTrackFade=pow(clamp(1.0-(trackNow-trackBirth)/trackLife,0.0,1.0),2.0);');shader.fragmentShader='varying float vTrackFade;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.a*=vTrackFade;');};material.customProgramCacheKey=()=> 'temporary-tractor-treads-v1';
 const root=new T.InstancedMesh(geometry,material,capacity),matrix=new T.Matrix4(),quaternion=new T.Quaternion(),position=new T.Vector3(),scale=new T.Vector3(1,1,1),up=new T.Vector3(0,1,0),color=new T.Color(),sampler=createTrackSampler();root.name='temporary-tractor-treads';root.frustumCulled=false;root.renderOrder=1;root.castShadow=false;root.receiveShadow=false;root.userData.seasonalExclude=true;root.instanceMatrix.setUsage(T.DynamicDrawUsage);birthAttribute.setUsage(T.DynamicDrawUsage);matrix.makeScale(0,0,0);for(let i=0;i<capacity;i++){root.setMatrixAt(i,matrix);root.setColorAt(i,color)}scene.add(root);
 let time=0,cursor=0,total=0,area=null,disposed=false;
 function clear(){births.fill(-1000);birthAttribute.needsUpdate=true;cursor=0;sampler.reset()}
 function setArea(next){if(next!==area){area=next;clear()}}
 function update(dt,options={}){if(disposed)return;time+=Math.max(0,Math.min(.2,Number(dt)||0));uniforms.trackNow.value=time;const {tractor,driving,indoors,season=0,groundAt,heightAt}=options;setArea(options.area);let changed=false;const enabled=Boolean(driving&&!indoors&&typeof groundAt==='function'&&tractor);
  sampler.advance(tractor,enabled,(x,z,angle)=>{const half=(Number.isFinite(tractor.wheelSpacing)?tractor.wheelSpacing:1.03)/2;for(const side of[-1,1]){const xx=x+Math.cos(angle)*half*side,zz=z-Math.sin(angle)*half*side,ground=groundAt(xx,zz);if(ground!=='soil'&&ground!=='grass')continue;const sampledY=typeof heightAt==='function'?heightAt(xx,zz):NaN;position.set(xx,Number.isFinite(sampledY)?sampledY:ground==='soil'?.05:0,zz);quaternion.setFromAxisAngle(up,angle);matrix.compose(position,quaternion,scale);root.setMatrixAt(cursor,matrix);color.set(season===3?'#758684':ground==='grass'?'#63704a':'#796044');root.setColorAt(cursor,color);births[cursor]=time;cursor=(cursor+1)%capacity;total++;changed=true}});
  if(changed){root.instanceMatrix.needsUpdate=true;root.instanceColor.needsUpdate=true;birthAttribute.needsUpdate=true}root.visible=!indoors&&births.some(b=>time-b<TRACK_LIFETIME);
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);root.dispose();geometry.dispose();material.dispose()}
 return {root,update,setArea,dispose,get stats(){let active=0;for(const birth of births)if(time-birth<TRACK_LIFETIME)active++;return {capacity,active,total,time,area}}};
}