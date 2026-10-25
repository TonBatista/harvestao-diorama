export const TRAILER_DRAWBAR=1.55,TRACTOR_HITCH=1.23,MAX_ARTICULATION=Math.PI*.44;
export const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function solveTrailer(tractor,previous={},reset=false){
 const x=Number.isFinite(tractor.x)?tractor.x:0,z=Number.isFinite(tractor.z)?tractor.z:0,angle=Number.isFinite(tractor.angle)?wrapAngle(tractor.angle):0,hitchX=x-Math.sin(angle)*TRACTOR_HITCH,hitchZ=z-Math.cos(angle)*TRACTOR_HITCH;
 const valid=[previous.x,previous.z,previous.angle].every(Number.isFinite),teleport=valid&&Math.hypot(hitchX-previous.x,hitchZ-previous.z)>8;
 let nextAngle=angle;if(valid&&!reset&&!teleport){const dx=hitchX-previous.x,dz=hitchZ-previous.z;nextAngle=Math.hypot(dx,dz)>.00001?Math.atan2(dx,dz):previous.angle;nextAngle=wrapAngle(angle+Math.max(-MAX_ARTICULATION,Math.min(MAX_ARTICULATION,wrapAngle(nextAngle-angle))))}
 const axleX=hitchX-Math.sin(nextAngle)*TRAILER_DRAWBAR,axleZ=hitchZ-Math.cos(nextAngle)*TRAILER_DRAWBAR,travel=valid&&!reset&&!teleport?(axleX-previous.x)*Math.sin(nextAngle)+(axleZ-previous.z)*Math.cos(nextAngle):0;
 return{x:axleX,z:axleZ,angle:nextAngle,wheelTravel:travel,hitchX,hitchZ,articulation:wrapAngle(nextAngle-angle)};
}