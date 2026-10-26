const danger=id=>id==='snake'||id==='spider';
/** A bark makes nearby wildlife retreat; subjects are restored safely for later encounters. */
export function createWildlifeDefense({state,getRegion,dog,canWalk=()=>true}){
 const fleeing=new Map();
 function clear(){for(const r of fleeing.values()){r.subject.object.position.set(r.x,r.y,r.z);r.subject.object.visible=r.visible}fleeing.clear()}
 function defend(target){const region=getRegion();if(fleeing.size>=4||!target||!danger(target.speciesId)||!region||target.area!==region.id||target.distance>3.2)return false;const subject=(region.photoSubjects||[]).find(s=>s.id===target.id);if(!subject?.object||fleeing.has(target.id))return false;if(dog.status&&Math.hypot(dog.status.x-target.x,dog.status.z-target.z)>5.5)return false;if(!dog.defend(target))return false;const o=subject.object,p=o.position,dx=p.x-state.player.x,dz=p.z-state.player.z,length=Math.hypot(dx,dz)||1;let ex=p.x,ez=p.z;for(const step of[1.4,.9,.45]){const xx=p.x+dx/length*step,zz=p.z+dz/length*step;if(canWalk(xx,zz)){ex=xx;ez=zz;break}}fleeing.set(target.id,{subject,x:p.x,y:p.y,z:p.z,visible:o.visible,ex,ez,time:0});return true}
 function update(dt){if(!(dt>0))return;for(const [id,r]of fleeing){r.time+=Math.min(dt,.2);const o=r.subject.object;if(r.time<.8){const u=1-(1-r.time/.8)**2;o.position.x=r.x+(r.ex-r.x)*u;o.position.z=r.z+(r.ez-r.z)*u}else o.visible=false;if(r.time>=16&&Math.hypot(state.player.x-r.x,state.player.z-r.z)>4.5){o.position.set(r.x,r.y,r.z);o.visible=r.visible;fleeing.delete(id)}}}
 return {defend,update,clear,get active(){return fleeing.size}};
}