import {solveTrailer} from './trailer-physics.js?v=0.47';
export const HORSE_HITCH=.66,CART_AXLE_OFFSET=.16;
export function solveHorseCart(h,previous={},reset=false){
 const a=Number.isFinite(h.angle)?h.angle:0;
 // Reuse the tractor's drawbar constraint, placing the hitch at the rear harness.
 const leader={x:h.x+Math.sin(a)*(1.23-HORSE_HITCH),z:h.z+Math.cos(a)*(1.23-HORSE_HITCH),angle:a};
 const p=solveTrailer(leader,previous,reset);
 return {...p,rootX:p.x+Math.sin(p.angle)*CART_AXLE_OFFSET,rootZ:p.z+Math.cos(p.angle)*CART_AXLE_OFFSET};
}
export function cartSamples(p){const c=Math.cos(p.angle),s=Math.sin(p.angle);return [[0,0],[-.78,-.78],[.78,-.78],[-.78,.78],[.78,.78]].map(([x,z])=>({x:p.rootX+x*c+z*s,z:p.rootZ-x*s+z*c}))}
