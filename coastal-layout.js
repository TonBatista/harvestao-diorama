export const BEACH_BOUNDS=Object.freeze([-51,17,-15,15]);
export const ALFORRIA=Object.freeze({x:-31,z:-7,height:1.22,door:[-31,-3.28],returnSpawn:[-31,-2.35],circle:[-31,8]});
/** The visible six stair treads and avatar feet share exactly this height. */
export function coastalGroundHeight(x,z){if(x>=-36.4&&x<=-25.6&&z>=-4&&z<=-1)return ALFORRIA.height;if(x>=-32.4&&x<=-29.6&&z>-1&&z<=2.9){const tread=Math.min(5,Math.max(0,Math.floor((z+1)/.65)));return ALFORRIA.height*(6-tread)/6}return 0}