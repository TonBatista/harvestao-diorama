import * as T from './three.module.js';
import {part,mergeParts} from './wildlife-art.js?v=0.47';
import {speciesById} from './birding.js?v=0.55.0';
import {BIRD_PROFILES} from './bird-natural-history.js?v=0.55.0';
import {colliderContains} from './scene-collisions.js?v=0.47';

function makeBird(p){
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),wings=[];
 root.add(body,head);root.scale.setScalar(p.scale);
 const tall=p.behavior==='wade',owl=['watch','camouflage'].includes(p.behavior),long=p.behavior==='hover';
 const lift=tall?.34:0;
 part(body,'oval',p.body,0,.20+lift,0,.17,.23,.21);
 part(body,'oval',p.belly,0,.18+lift,.12,.14,.18,.09);
 for(const side of [-1,1])part(body,'cylinder',tall?'#4e5547':'#a18b62',side*.07,tall?.24:.065,.02,.018,tall?.44:.13,.018);
 head.position.set(0,.42+lift+(tall?.27:0),.07);
 if(tall)part(body,'oval',p.body,0,.58,.08,.06,.32,.065);
 part(head,'oval',p.head,0,0,0,owl?.20:.14,owl?.17:.14,.14);
 if(p.behavior==='sally'||p.behavior==='hop')part(head,'oval','#e6dcc1',0,-.035,.125,.13,.027,.025);
 for(const side of [-1,1]){
  if(owl)part(head,'oval','#d3b552',side*.09,.018,.122,.065,.065,.025);
  part(head,'oval','#252b25',side*(owl?.09:.09),.025,.13,owl?.027:.018,owl?.041:.025,.017);
  if(owl)part(head,'oval','#eee6c7',side*.082,.04,.148,.011,.012,.006);
 }
 const beak=part(head,'cone',tall?'#c7a34e':long?'#353e36':'#b49a61',0,-.045,long?.28:.20,long?.017:.035,long?.34:tall?.27:.12,.025);beak.rotation.x=Math.PI/2;
 for(const side of [-1,1]){
  const wing=new T.Group();wing.position.set(side*.15,.25+lift,-.03);root.add(wing);
  part(wing,'oval',p.body,side*.10,-.06,-.025,long?.17:.13,.045,long?.25:.24);
  part(wing,'oval',p.behavior==='glide'?'#555f5d':p.body,side*.18,-.06,-.1,.075,.028,.16);mergeParts(wing);wings.push(wing);
 }
 for(const side of (long?[-1,1]:[0])){const tail=part(body,'oval',p.body,side*.055,.06,-.23,.065,long?.31:.19,.028);tail.rotation.x=-.8;tail.rotation.z=side*.18}
 if(p.behavior==='tap'||owl)for(let i=0;i<12;i++)part(body,'spot',i%2?'#3e4734':'#d4c5a0',Math.sin(i*2.4)*.14,.11+(i%4)*.085,.19,.014,.014,.008);
 if(p.behavior==='patrol'){part(head,'oval','#d39662',0,-.045,.12,.11,.065,.035);part(head,'oval','#2e352c',0,.12,-.02,.15,.05,.16)}
 mergeParts(body);mergeParts(head);
 return {root,head,wings,animate(t,flight=false){
  const beating=flight||long,rate=long?48:flight?17:0;
  wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(beating?.45+Math.sin(t*rate)*.65:.08));
  head.rotation.x=p.behavior==='tap'?Math.max(0,Math.sin(t*16))*.38:['peck','walk','hop'].includes(p.behavior)?Math.max(0,Math.sin(t*3))*.35:0;
  head.rotation.y=p.behavior==='camouflage'?Math.sin(t*.3)*.025:owl?Math.sin(t*.8)*.8:Math.sin(t*.8)*.17;
 },dispose(){root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose()});root.removeFromParent()}};
}

/** Four bounded encounter slots. Observation starts a single five-second timer;
 * photographing, changing tools and leaving the frame never restart that timer. */
export function attachBirdEncounters(region,state,heightAt){
 if(region.indoors||region.birdEncounters)return;
 const candidates=Object.entries(BIRD_PROFILES).filter(([,p])=>p.areas.includes(region.id));if(!candidates.length)return;
 for(const subject of region.photoSubjects||[])if(speciesById(subject.speciesId)?.kind==='bird')subject.object.visible=false;
 region.photoSubjects=(region.photoSubjects||[]).filter(s=>speciesById(s.speciesId)?.kind!=='bird');
 const parent=region.dynamic||region.root,slots=Array.from({length:4},(_,i)=>({wait:2+i*5+Math.random()*5,model:null}));
 let clock=0,serial=0,disposed=false;
 const rand=(a,b)=>a+Math.random()*(b-a);
 const inside=(x,z)=>x>region.bounds[0]+1&&x<region.bounds[1]-1&&z>region.bounds[2]+1&&z<region.bounds[3]-1;
 const free=(x,z)=>inside(x,z)&&!region.colliders.some(c=>colliderContains(c,x,z,.25))&&!region.portals.some(p=>Math.hypot(x-p.x,z-p.z)<1.7);
 const trees=()=>region.treePositions||region.root.userData.treePositions||[];
 function choose(){const night=state.minutes>=1080||state.minutes<360,weighted=candidates.map(([id,p])=>({id,p,w:night?(id==='urutau'?5:id==='coruja'?3:.1):id==='urutau'?.25:1}));let n=Math.random()*weighted.reduce((s,a)=>s+a.w,0);return weighted.find(a=>(n-=a.w)<=0)||weighted[0]}
 function spot(p){
  const treeMode=['fruit','tap','camouflage','sally'].includes(p.behavior);
  if(treeMode){const near=trees().filter(q=>inside(q.x,q.z)&&Math.hypot(q.x-state.player.x,q.z-state.player.z)>5&&Math.hypot(q.x-state.player.x,q.z-state.player.z)<20);if(near.length){const t=near[Math.floor(Math.random()*near.length)];return {x:t.x+.35,z:t.z+.25,perch:p.behavior==='tap'?1.1:1.8,tree:true}}if(p.behavior==='tap'||p.behavior==='fruit')return null}
  // Water birds choose banks, never the middle of a field or a building.
  if(['wade','dive'].includes(p.behavior)){
   const banks=region.id==='lake'?[[-17.8,0],[-16,-6.4],[16,6.4],[12,10.7],[-10,12],[0,-14.5]]:region.id==='mountain'?[[-7,0],[-5,2.5],[-2,3]]:[[-2,1],[-2,8],[-3,-7]];
   const points=banks.filter(([x,z])=>free(x,z)&&Math.hypot(x-state.player.x,z-state.player.z)>5);if(!points.length)return null;const [x,z]=points[Math.floor(Math.random()*points.length)];return {x,z,perch:p.behavior==='dive'?.75:0};
  }
  for(let i=0;i<24;i++){const a=rand(0,Math.PI*2),r=rand(7,17),x=state.player.x+Math.sin(a)*r,z=state.player.z+Math.cos(a)*r;if(free(x,z))return {x,z,perch:treeMode?.7:['hover','glide'].includes(p.behavior)?p.behavior==='hover'?.6:2.4:0}}
  return null;
 }
 function retire(slot){if(slot.subject){const i=region.photoSubjects.indexOf(slot.subject);if(i>=0)region.photoSubjects.splice(i,1)}slot.model?.dispose();slot.marker?.removeFromParent();if(slot.marker)slot.marker.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose()});slot.model=slot.subject=slot.marker=null;slot.wait=rand(14,38)}
 function spawn(slot,chosen=null,place=null){
  const {id,p}=chosen||choose(),at=place||spot(p);if(!at)return false;
  const model=makeBird(p);parent.add(model.root);const species=speciesById(id);
  Object.assign(slot,{model,p,x:at.x,z:at.z,y:heightAt(region.id,at.x,at.z)+(at.perch||0),born:clock,seen:null,flying:null,phase:rand(0,6.28),angle:rand(0,6.28),flightX:0,flightZ:0});
  if(p.behavior==='tap')slot.angle=Math.atan2(-.35,-.25);
  model.root.position.set(slot.x,slot.y+2,slot.z);model.root.rotation.y=slot.angle;
  const subject={id:region.id+'-encounter-'+(++serial),speciesId:id,name:species.name,area:region.id,object:model.root,offsetY:.25*p.scale};slot.subject=subject;region.photoSubjects.push(subject);
  if(at.perch&&!at.tree&&['dive','sally','camouflage'].includes(p.behavior)){
   const marker=new T.Group();marker.position.set(at.x,heightAt(region.id,at.x,at.z),at.z);parent.add(marker);
   part(marker,'cylinder','#8d7959',0,at.perch/2,0,.065,at.perch,.065);part(marker,'oval','#ad9470',0,at.perch-.02,0,.24,.035,.065);mergeParts(marker);slot.marker=marker;
  }
  if(p.behavior==='hover'){
   const marker=new T.Group();marker.position.set(at.x,heightAt(region.id,at.x,at.z),at.z);parent.add(marker);
   for(let j=0;j<3;j++){part(marker,'cylinder','#738b51',(j-1)*.14,.15,0,.018,.3,.018);part(marker,'oval',['#d6adbb','#d6ba78','#c9a8c4'][j],(j-1)*.14,.32,0,.07,.045,.07)}mergeParts(marker);slot.marker=marker;
  }
  if(!chosen&&p.group){const other=slots.find(s=>s!==slot&&!s.model);if(other&&free(at.x+.65,at.z+.35))spawn(other,{id,p},{...at,x:at.x+.65,z:at.z+.35})}
  return true;
 }
 function fly(slot){slot.flying=clock;slot.flightX=slot.model.root.position.x;slot.flightZ=slot.model.root.position.z;slot.flightY=slot.model.root.position.y;slot.angle=Math.atan2(slot.flightX-state.player.x,slot.flightZ-state.player.z);slot.model.root.rotation.y=slot.angle}
 const updateBefore=region.update,disposeBefore=region.dispose;
 region.update=(dt,t)=>{updateBefore?.(dt,t);if(disposed||dt<=0)return;clock+=dt;
  for(const slot of slots){
   if(!slot.model){slot.wait-=dt;if(slot.wait<=0){slot.wait=rand(4,9);spawn(slot)}continue}
   const age=clock-slot.born,seenAge=slot.seen===null?0:clock-slot.seen;
   if(slot.flying===null&&(slot.seen!==null?seenAge>=5:age>65))fly(slot);
   if(slot.flying!==null){const f=clock-slot.flying;slot.model.root.position.set(slot.flightX+Math.sin(slot.angle)*f*3.8,slot.flightY+f*2,slot.flightZ+Math.cos(slot.angle)*f*3.8);slot.model.root.rotation.x=-.15;slot.model.animate(clock+slot.phase,true);if(f>3)retire(slot);continue}
   const b=slot.p.behavior,root=slot.model.root,phase=clock+slot.phase;let x=slot.x,z=slot.z,y=slot.y;
   if(['walk','hop','peck','patrol','watchwalk','wade'].includes(b)){
    const radius=b==='wade'?.18:b==='patrol'?.85:.36,px=slot.x+Math.sin(phase*.7)*radius,pz=slot.z+Math.cos(phase*.5)*radius;
    if(free(px,pz)){x=px;z=pz;y=heightAt(region.id,x,z)}
    root.rotation.y=Math.atan2(Math.cos(phase*.7)*.7,-Math.sin(phase*.5)*.5);if(b==='hop')y+=Math.max(0,Math.sin(phase*5))*.09;
   }else if(b==='hover'){x+=Math.sin(phase*1.7)*.16;z+=Math.cos(phase)*.13;y+=Math.sin(phase*5)*.04}
   else if(b==='glide'){x+=Math.sin(phase*.8)*1.2;z+=Math.cos(phase*.8)*1.2;root.rotation.y=phase*.8+Math.PI/2}
   else if(b==='sally'){const f=Math.max(0,Math.sin(phase*.9));x+=f*.5;y+=f*.18}
   else if(b==='fruit'){y+=Math.max(0,Math.sin(phase*2))*.06;root.rotation.y=slot.angle+Math.sin(phase)*.3}
   else if(b==='dive'){const f=Math.max(0,Math.sin(phase*.8));y-=f*.5;root.rotation.x=f*.6}
   if(age<1)y+=(1-age)*2;
   root.position.set(x,y,z);slot.model.animate(phase,age<1||b==='glide'||b==='dive'&&Math.sin(phase*.8)>0);
  }
 };
 region.birdEncounters={observe(id){const slot=slots.find(s=>s.subject?.id===id);if(!slot||slot.seen!==null||slot.flying!==null||clock-slot.born<1)return false;slot.seen=clock;return true},get activeCount(){return slots.filter(s=>s.model).length}};
 if(disposeBefore)region.dispose=()=>{disposed=true;slots.forEach(retire);disposeBefore()};
}
