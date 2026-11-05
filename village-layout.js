export const VILLAGE_BOUNDS=Object.freeze([-17,17,-15,45]);
export const VILLAGE_STAIRS=Object.freeze({x:0,start:14.8,tread:.55,count:8,width:6.8,drop:1.2});
export const VILLAGE_BRIDGE=Object.freeze({x:0,start:29.5,end:35.5,width:6.6,waterZ:32.5,waterWidth:2.6});
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export function villageLandHeight(x,z){
 if(z<14.8)return .95*smooth(2,12,-z);
 if(z<19.2&&Math.abs(x)<=3.4)return -Math.min(8,Math.floor((z-14.8)/.55)+1)*.15;
 return z<17?0:-1.2;
}
export function villageBridgeHeight(x,z){const b=VILLAGE_BRIDGE;if(Math.abs(x)>b.width/2||z<b.start||z>b.end)return null;return -1.2+.45*Math.sin(Math.PI*(z-b.start)/(b.end-b.start))**2}
export function villageWalkHeight(x,z){return x<=-13.5&&z>=-12.6&&z<=-9.4?villageLandHeight(x,z)+.04:villageBridgeHeight(x,z)??villageLandHeight(x,z)}
export const streamPoints=Object.freeze([[-16,-15],[-16,-5],[-16,8],[-16,15],[-16,18.5],[-16,26],[-15,29.5],[-12,32.5],[-6,32.5],[0,32.5],[8,32.5],[17,32.5]]);
export function distanceToStream(x,z){let best=Infinity;for(let i=1;i<streamPoints.length;i++){const a=streamPoints[i-1],b=streamPoints[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t))}return best}
export function villageGroundHeight(x,z){return distanceToStream(x,z)<1.1?(z<17?villageLandHeight(x,z)-.40:-1.9):villageLandHeight(x,z)}
export function villageWaterHeight(z){if(z<16.5)return villageLandHeight(-16,z)-.06;if(z<18.7)return -.06-(z-16.5)/2.2*1.32;return -1.38}
