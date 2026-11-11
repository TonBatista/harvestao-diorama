export const VILLAGE_BOUNDS=Object.freeze([-37,37,-27,94]);
export const PLAZA=Object.freeze({x:0,z:1.7,width:20,depth:16.905});
export const VILLAGE_STAIRS=Object.freeze({x:8.6,start:22.4,tread:.55,count:8,width:3.6,drop:1.2});
export const VILLAGE_RAMP=Object.freeze({start:22.4,end:26.8,width:13.0});
export const VILLAGE_BRIDGE=Object.freeze({x:0,start:29.5,end:35.5,width:13.0,waterZ:32.5});
export const VILLAGE_MOUNTAIN=Object.freeze({x:-35.75,z:-12.75,arrival:[-29.65,-12.75]});
export const VILLAGE_BEACH=Object.freeze({x:35.75,z:6.8,arrival:[32.7,6.8]});
export const streamPoints=Object.freeze([[-33,-27],[-33,6],[-33,20],[-32,27],[-27,31],[-19,32.5],[37,32.5]]);
const clamp=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>a+(b-a)*t;
export function villageLandHeight(x,z){
 const stair=VILLAGE_STAIRS,ramp=VILLAGE_RAMP;
 if(z<ramp.start)return .48*clamp((-z-24)/3);
 if(Math.abs(x)<=ramp.width/2)return -stair.drop*clamp((z-ramp.start)/(ramp.end-ramp.start));
 if(Math.abs(x-stair.x)<=stair.width/2)return -Math.min(stair.count,Math.floor((z-stair.start)/stair.tread)+1)*stair.drop/stair.count;
 return z<24.6?0:-stair.drop;
}
export function villageBridgeHeight(x,z){
 const b=VILLAGE_BRIDGE;
 if(Math.abs(x)>b.width/2||z<b.start||z>b.end)return null;
 return -1.2+.32*Math.sin(Math.PI*(z-b.start)/(b.end-b.start))**2;
}
export function villageWalkHeight(x,z){return villageBridgeHeight(x,z)??villageLandHeight(x,z)}
export function distanceToStream(x,z){
 let best=Infinity;
 for(let i=1;i<streamPoints.length;i++){
  const a=streamPoints[i-1],b=streamPoints[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));
  best=Math.min(best,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));
 }
 return best;
}
export function villageGroundHeight(x,z){
 const land=villageLandHeight(x,z),distance=distanceToStream(x,z);
 return land-(z<26.8?.46:.71)*(1-clamp((distance-.87)/.46));
}
export function villageWaterHeight(z){
 if(z<22.4)return villageLandHeight(-33,z)-.10;
 return lerp(-.10,-1.37,clamp((z-22.4)/4.4));
}
