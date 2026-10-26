import * as T from './three.module.js';
import {part,mergeParts} from './wildlife-art.js?v=0.24';
const TAU=Math.PI*2,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const finitePoint=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function dogSegmentClear(a,b,blocked=()=>false){const distance=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(distance/.14));for(let i=1;i<=n;i++){const t=i/n;if(blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false}return true}
/** Local A* has a strict search budget and only runs when the direct route is blocked. */
export function findDogPath(start,goal,blocked=()=>false,{step=.42,maxNodes=640}={}){
 if(!finitePoint(start)||!finitePoint(goal)||blocked(goal.x,goal.z))return [];
 if(dogSegmentClear(start,goal,blocked))return [{x:goal.x,z:goal.z}];
 const tx=Math.round((goal.x-start.x)/step),tz=Math.round((goal.z-start.z)/step),margin=7,minX=Math.min(0,tx)-margin,maxX=Math.max(0,tx)+margin,minZ=Math.min(0,tz)-margin,maxZ=Math.max(0,tz)+margin;
 const key=(x,z)=>x+','+z,open=[{x:0,z:0,g:0,f:Math.hypot(tx,tz),parent:null}],cost=new Map([[key(0,0),0]]);let end=null,visited=0;
 while(open.length&&visited++<maxNodes){let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;const node=open.splice(best,1)[0],world={x:start.x+node.x*step,z:start.z+node.z*step};if(Math.hypot(world.x-goal.x,world.z-goal.z)<step*1.3&&dogSegmentClear(world,goal,blocked)){end=node;break}
  for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=node.x+dx,z=node.z+dz;if(x<minX||x>maxX||z<minZ||z>maxZ)continue;const g=node.g+(dx&&dz?Math.SQRT2:1),id=key(x,z);if(g>=(cost.get(id)??Infinity))continue;const next={x:start.x+x*step,z:start.z+z*step};if(!dogSegmentClear(world,next,blocked))continue;cost.set(id,g);open.push({x,z,g,f:g+Math.hypot(tx-x,tz-z),parent:node})}
 }
 if(!end)return [];const result=[{x:goal.x,z:goal.z}];for(let n=end;n?.parent;n=n.parent)result.push({x:start.x+n.x*step,z:start.z+n.z*step});return result.reverse();
}
function safeNear(player,blocked,driving=false){const angle=Number.isFinite(player.angle)?player.angle:0,d=driving?2:1.15,preferred={x:player.x-Math.sin(angle)*d+Math.cos(angle)*.40,z:player.z-Math.cos(angle)*d-Math.sin(angle)*.40};if(!blocked(preferred.x,preferred.z))return preferred;for(const radius of[.70,1.10,1.5,2,2.6])for(let i=0;i<16;i++){const a=angle+Math.PI+i*TAU/16,x=player.x+Math.sin(a)*radius,z=player.z+Math.cos(a)*radius;if(!blocked(x,z))return{x,z}}return null}
function targetPoint(target){const p=target?.worldPosition||target?.position||target;return finitePoint(p)?{x:p.x,z:p.z}:null}
function makeDog(){
 const root=new T.Group();root.name='companion-caramelo';root.userData.seasonalExclude=true;const body=new T.Group();root.add(body);
 part(body,'oval','#b58d58',0,.40,-.03,.23,.235,.40);part(body,'oval','#c7a16a',0,.49,.20,.24,.25,.22);part(body,'oval','#d7ba88',0,.32,.26,.17,.16,.105);part(body,'oval','#8d9c74',0,.505,.285,.225,.10,.095);part(body,'oval','#c7ab69',0,.39,.368,.045,.057,.014);mergeParts(body);
 const head=new T.Group();head.position.set(0,.59,.34);root.add(head);part(head,'oval','#c29b62',0,.08,0,.235,.22,.22);part(head,'oval','#d8b980',0,-.035,.18,.17,.115,.18);part(head,'oval','#493e30',0,.012,.319,.085,.055,.045);part(head,'oval','#dfc48e',0,-.10,.205,.12,.045,.11);part(head,'oval','#78563c',0,-.095,.306,.045,.012,.013);mergeParts(head);
 const eyes=new T.Group();head.add(eyes);for(const s of[-1,1]){part(eyes,'oval','#493c2c',s*.105,.117,.187,.046,.053,.028);part(eyes,'oval','#f0e5c7',s*.092,.135,.213,.012,.015,.008);const brow=part(eyes,'oval','#a77e4b',s*.11,.185,.16,.075,.025,.034);brow.rotation.z=s*-.16}mergeParts(eyes);
 const ears=[];for(const s of[-1,1]){const ear=new T.Group();ear.position.set(s*.20,.13,-.035);head.add(ear);const flap=part(ear,'oval','#a87c49',s*.025,-.11,-.005,.095,.19,.12);flap.rotation.z=s*.16;part(ear,'oval','#b58b57',s*.045,-.16,.067,.055,.11,.034);mergeParts(ear);ears.push(ear)}
 const legs=[];for(const side of[-1,1])for(const z of[-.28,.23]){const leg=new T.Group();leg.position.set(side*.16,.33,z);root.add(leg);part(leg,'oval',z>0?'#c5a06c':'#aa814d',0,-.09,0,.085,.18,.09);part(leg,'oval','#cdab75',0,-.245,.038,.09,.067,.13);for(let j=-1;j<=1;j++)part(leg,'oval','#b18b58',j*.034,-.242,.137,.012,.023,.015);mergeParts(leg);legs.push(leg)}
 const tail=new T.Group();tail.position.set(0,.47,-.38);root.add(tail);const t1=part(tail,'oval','#b48b54',0,.085,-.14,.065,.075,.23);t1.rotation.x=.36;const t2=part(tail,'oval','#d0ad77',0,.22,-.31,.061,.14,.11);t2.rotation.x=.35;mergeParts(tail);
 const shadowMaterial=new T.MeshBasicMaterial({color:'#4a3e2c',transparent:true,opacity:.15,depthWrite:false}),shadow=new T.Mesh(new T.CircleGeometry(.47,24),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.scale.set(.69,1.42,1);shadow.position.y=.018;root.add(shadow);
 return{root,body,head,eyes,ears,legs,tail,shadowMaterial};
}
/** Separate from region roots, so travelling never disposes this companion. */
export function createCompanionDog(scene,state={}){
 if(!state.companion||typeof state.companion!=='object'||Array.isArray(state.companion))state.companion={name:'Caramelo'};state.companion.name='Caramelo';
 const art=makeDog(),{root,body,head,eyes,ears,legs,tail}=art;scene.add(root);root.visible=false;
 let area=null,time=0,angle=0,phase=0,speed=0,moving=false,barkSerial=0,guard=null,repath=0,path=[],lastGoal=null,accumulator=0,lastPlayer={x:0,z:0,angle:0},lastBlocked=()=>false,lastDriving=false;const repelled=new Map();
 function travel({player=lastPlayer,area:nextArea=area,blocked=lastBlocked}={}){if(!finitePoint(player))return false;lastPlayer=player;lastBlocked=blocked||(()=>false);area=nextArea;const point=safeNear(player,lastBlocked,lastDriving);root.visible=!!point;if(point)root.position.set(point.x,0,point.z);angle=Number.isFinite(player.angle)?player.angle:0;root.rotation.y=angle;speed=0;moving=false;guard=null;path=[];lastGoal=null;repath=0;accumulator=0;repelled.clear();return !!point}
 function defend(target){if(!target||!['snake','spider'].includes(target.speciesId)||!root.visible||(target.area&&area&&target.area!==area))return false;const id=String(target.id||target.speciesId);if((repelled.get(id)||0)>time)return false;let point=targetPoint(target);if(!point)point={x:lastPlayer.x+Math.sin(lastPlayer.angle||0)*1.8,z:lastPlayer.z+Math.cos(lastPlayer.angle||0)*1.8};if(Math.hypot(point.x-lastPlayer.x,point.z-lastPlayer.z)>4.8)return false;guard={id,point,until:time+3.4};repelled.set(id,time+12);while(repelled.size>16)repelled.delete(repelled.keys().next().value);barkSerial++;path=[];repath=0;return true}
 function repels(id){return(repelled.get(String(id))||0)>time}
 function step(dt,player,blocked,driving,indoors){
  time+=dt;for(const[id,until]of repelled)if(until<=time)repelled.delete(id);if(guard&&guard.until<=time)guard=null;
  let goal=safeNear(player,blocked,driving);if(!goal){speed=0;moving=false;return}
  if(guard){const dx=guard.point.x-player.x,dz=guard.point.z-player.z,length=Math.hypot(dx,dz)||1,point={x:player.x+dx/length*.82,z:player.z+dz/length*.82};if(length<4.8&&!blocked(point.x,point.z))goal=point}
  const apart=Math.hypot(root.position.x-player.x,root.position.z-player.z);if(apart>(indoors?16:24)){root.position.set(goal.x,0,goal.z);path=[];lastGoal=null;speed=0}
  repath-=dt;const goalChange=lastGoal?Math.hypot(goal.x-lastGoal.x,goal.z-lastGoal.z):Infinity;
  if(repath<=0||goalChange>.55){path=findDogPath(root.position,goal,blocked);lastGoal={...goal};repath=.42}
  while(path.length&&Math.hypot(path[0].x-root.position.x,path[0].z-root.position.z)<.12)path.shift();const target=path[0],distance=target?Math.hypot(target.x-root.position.x,target.z-root.position.z):0,finalDistance=Math.hypot(goal.x-root.position.x,goal.z-root.position.z),desired=target&&finalDistance>.17?Math.min(driving?8.6:6.2,finalDistance*3.4+.1):0;speed+=(desired-speed)*(1-Math.exp(-dt*11));let moved=0;
  if(target&&distance>.001){const travel=Math.min(distance,speed*dt),dx=target.x-root.position.x,dz=target.z-root.position.z,nx=root.position.x+dx/distance*travel,nz=root.position.z+dz/distance*travel;if(dogSegmentClear(root.position,{x:nx,z:nz},blocked)){root.position.x=nx;root.position.z=nz;moved=travel;const wanted=Math.atan2(dx,dz);angle=wrap(angle+wrap(wanted-angle)*(1-Math.exp(-dt*13)))}else{speed=0;repath=0;path=[]}}
  if(guard&&moved<.006){const wanted=Math.atan2(guard.point.x-root.position.x,guard.point.z-root.position.z);angle=wrap(angle+wrap(wanted-angle)*(1-Math.exp(-dt*10)))}
  root.rotation.y=angle;phase+=moved*11;moving=moved>.0008;const stride=Math.min(1,speed/3.1),bounce=Math.sin(phase*2)*.014*stride;body.position.y=bounce;head.position.y=.59+bounce;head.rotation.x=guard?-.07:Math.sin(time*.8)*.035;head.rotation.y=guard?0:Math.sin(time*.6)*.05;
  legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(phase+([0,Math.PI,Math.PI,0][i]))*.49*stride});ears.forEach((ear,i)=>{ear.rotation.z=(i?1:-1)*(.12+Math.sin(phase*2+i)*.05*stride)});tail.rotation.y=Math.sin(time*(guard?11:6))*(guard ? .22 : .53);tail.rotation.x=-.10+Math.sin(time*3)*.045;const blink=time%5.6;eyes.scale.y=blink>5.42?Math.max(.08,Math.abs(blink-5.51)/.09):1;
 }
 function update(dt,{player=lastPlayer,area:nextArea=area,driving=false,blocked=lastBlocked,targets=[],indoors=false}={}){if(!finitePoint(player))return;lastPlayer=player;lastBlocked=typeof blocked==='function'?blocked:()=>false;lastDriving=!!driving;if(nextArea!==area||!root.visible)travel({player,area:nextArea,blocked:lastBlocked});for(const target of targets)if(['snake','spider'].includes(target.speciesId)&&target.distance<3)defend(target);accumulator+=clamp(Number.isFinite(dt)?dt:0,0,.20);let frames=0;while(accumulator>=1/60&&frames++<12){step(1/60,player,lastBlocked,driving,indoors);accumulator-=1/60}}
 function dispose(){scene.remove(root);root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose()});art.shadowMaterial.dispose();root.clear();repelled.clear()}
 return{root,update,travel,defend,repels,get status(){return{area,x:root.position.x,z:root.position.z,angle,moving,guarding:!!guard,protectedId:guard?.id||null,barkSerial}},dispose};
}