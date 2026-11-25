/** One reusable, deterministic reaction; no physics bodies or per-frame allocations. */
export function createShippingReaction(){
 let object=null,time=0,baseY=0,scale=null;
 function reset(){if(object){object.position.y=baseY;object.scale.copy(scale)}object=null}
 return {start(box){reset();if(!box)return;object=box;time=0;baseY=box.position.y;scale=box.scale.clone()},update(dt){
  if(!object)return false;time+=dt;const t=time/.72;
  if(t>=1){reset();return true}
  const hop=t<.13?0:Math.sin(Math.PI*Math.min(1,(t-.13)/.66))*.28;
  const squash=t<.13?-Math.sin(t/.13*Math.PI)*.17:t<.72?Math.sin((t-.13)/.59*Math.PI)*.11:-Math.sin((t-.72)/.28*Math.PI)*.10;
  object.position.y=baseY+Math.max(0,hop);object.scale.set(scale.x*(1-squash*.55),scale.y*(1+squash),scale.z*(1-squash*.55));return true;
 }};
}
