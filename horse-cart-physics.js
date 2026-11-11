import {TRAILER_DRAWBAR,MAX_ARTICULATION,wrapAngle} from './trailer-physics.js?v=0.47';
export const HORSE_HITCH=.66,CART_AXLE_OFFSET=.16;
export function solveHorseCart(h,previous={},reset=false){
 const heading=Number.isFinite(h.angle)?h.angle:0;
 const hitchX=h.x-Math.sin(heading)*HORSE_HITCH,hitchZ=h.z-Math.cos(heading)*HORSE_HITCH;
 const valid=[previous.x,previous.z,previous.angle].every(Number.isFinite);
 let angle=heading,wheelTravel=0;
 if(valid&&!reset&&Math.hypot(hitchX-previous.x,hitchZ-previous.z)<8){
  const dx=hitchX-previous.x,dz=hitchZ-previous.z;
  const lateral=dx*Math.cos(previous.angle)-dz*Math.sin(previous.angle);
  const next=previous.angle+Math.atan2(lateral,TRAILER_DRAWBAR);
  angle=wrapAngle(heading+Math.max(-MAX_ARTICULATION,Math.min(MAX_ARTICULATION,wrapAngle(next-heading))));
  wheelTravel=dx*Math.sin(angle)+dz*Math.cos(angle)-TRAILER_DRAWBAR;
 }
 const x=hitchX-Math.sin(angle)*TRAILER_DRAWBAR,z=hitchZ-Math.cos(angle)*TRAILER_DRAWBAR;
 return cartWorldPose({x,z,angle,wheelTravel});
}
export function cartWorldPose(p){
 return {...p,rootX:p.x+Math.sin(p.angle)*CART_AXLE_OFFSET,rootZ:p.z+Math.cos(p.angle)*CART_AXLE_OFFSET};
}
export function cartSamples(p){
 const c=Math.cos(p.angle),s=Math.sin(p.angle);
 return [[0,0],[-.78,-.84],[0,-.88],[.78,-.84],[-.83,0],[.83,0],[-.78,.84],[0,.88],[.78,.84]]
  .map(([x,z])=>({x:p.rootX+x*c+z*s,z:p.rootZ-x*s+z*c,r:.16}));
}
