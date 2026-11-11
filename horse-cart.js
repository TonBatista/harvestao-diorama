import {solveHorseCart,cartSamples,cartWorldPose} from './horse-cart-physics.js?v=0.50';
import * as T from './three.module.js';
import {economyState} from './rural-economy.js?v=0.51';
import {terrainHeight} from './valley-terrain.js?v=0.50';
export function horseModel(){const root=new T.Group(),horse=new T.Group(),cart=new T.Group(),legs=[],wheels=[],mats=new Map(),sphere=new T.SphereGeometry(1,12,8),box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,12);root.add(horse,cart);
 function part(p,g,c,x,y,z,sx,sy,sz){let m=mats.get(c);if(!m){m=new T.MeshStandardMaterial({color:c,roughness:.85});mats.set(c,m)}const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o}
 const oval=(p,c,x,y,z,a,b,d)=>part(p,sphere,c,x,y,z,a,b,d),beam=(p,c,x,y,z,w,h,d)=>part(p,box,c,x,y,z,w,h,d);
 oval(horse,'#9d7151',0,1.12,.40,.46,.52,.85);oval(horse,'#ae805c',0,1.65,1.02,.29,.68,.32).rotation.x=-.30;oval(horse,'#b88d69',0,2.05,1.30,.27,.35,.39);oval(horse,'#c09c79',0,1.85,1.60,.28,.20,.32);
 for(const s of[-1,1]){oval(horse,'#ac805d',s*.17,2.39,1.20,.095,.25,.095);oval(horse,'#8a6655',s*.17,2.40,1.23,.046,.17,.035);oval(horse,'#343a35',s*.25,2.08,1.46,.025,.036,.025);oval(horse,'#f2ead3',s*.25,2.095,1.48,.008,.01,.009);oval(horse,'#5c4f40',s*.14,1.87,1.87,.035,.028,.019);for(const z of[-.15,.96]){const g=new T.Group();g.position.set(s*.29,.94,z);horse.add(g);beam(g,'#9d7151',0,-.30,0,.15,.70,.16);beam(g,'#4e4d41',0,-.77,.035,.19,.22,.25);legs.push(g)}}
 for(let i=0;i<9;i++)oval(horse,'#584939',0,2.12-i*.09,1.03-i*.027,.09,.14,.11);oval(horse,'#554638',0,.97,-.42,.13,.52,.14).rotation.x=-.35;beam(horse,'#645a49',0,1.56,.22,.69,.11,.70);oval(horse,'#7e6652',0,1.57,.22,.37,.13,.38);
 for(const s of[-1,1]){beam(horse,'#695945',s*.43,1.06,.25,.05,.77,.16);beam(horse,'#766c52',s*.27,1.94,1.49,.025,.035,.56)}
 cart.position.z=-2.05;beam(cart,'#8f7654',0,.78,0,1.75,.17,2.2);for(let i=0;i<8;i++)beam(cart,i%2?'#af9066':'#b99b70',0,.90,-.93+i*.27,1.75,.06,.24);for(const s of[-1,1]){beam(cart,'#957851',s*.83,1.08,0,.11,.47,2.22);beam(cart,'#b69b70',s*.83,1.35,0,.14,.09,2.3);beam(cart,'#a68961',s*.60,.68,1.70,.08,.10,2.3);const wheelRig=new T.Group();wheelRig.position.set(s*1.02,.52,-.16);cart.add(wheelRig);const wheel=part(wheelRig,cyl,'#5e5c4a',0,0,0,.50,.16,.50);wheel.rotation.z=Math.PI/2;wheels.push(wheelRig);for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=beam(wheelRig,'#b69b70',s*.10,Math.cos(a)*.21,Math.sin(a)*.21,.04,.46,.045);spoke.rotation.x=-a}}beam(cart,'#785d45',0,.52,-.16,2.25,.12,.12);beam(cart,'#79644f',0,1.17,.52,1.36,.15,.47);beam(cart,'#ac9069',0,1.47,.29,1.36,.45,.08);
 return {root,horse,cart,wheels,animate(distance,time=0){for(let i=0;i<legs.length;i++)legs[i].rotation.x=Math.sin(time*8+(i%2)*Math.PI+(i>1?Math.PI:0))*Math.min(.55,distance*10);horse.position.y=distance?Math.abs(Math.sin(time*8))*.035:0;for(const w of wheels)w.rotation.x+=distance/.50}};
}
const attached=h=>h.cart===true&&h.cartAttached!==false&&h.owned;
const savedPose=h=>[h.cartPose?.x,h.cartPose?.z,h.cartPose?.angle].every(Number.isFinite);
const horseSamples=h=>[-.26,.44,1.13,1.66].map((offset,i)=>({
 x:h.x+Math.sin(h.angle)*offset,z:h.z+Math.cos(h.angle)*offset,r:i===3?.24:.37
}));
export function createHorseCart(scene,state){
 const art=horseModel();
 scene.add(art.root,art.cart);
 let wheelPhase=0,cartTravel=0;
 const horseState=()=>economyState(state).horse;
 const parked=h=>savedPose(h)?cartWorldPose(h.cartPose):solveHorseCart(h,{},true);
 const parkArea=h=>h.cartArea||h.area;
 function pose(h,position=h){
  if(!attached(h))return parked(h);
  if(parkArea(h)!==h.area||!savedPose(h))return solveHorseCart(position,{},true);
  return position===h?parked(h):solveHorseCart(position,h.cartPose);
 }
 function savePose(h,p){h.cartPose={x:p.x,z:p.z,angle:p.angle};h.cartArea=h.area}
 function colliders(area){
  const h=horseState(),p=pose(h),result=[];
  if(h.owned&&h.area===area)result.push({x:h.x+Math.sin(h.angle)*.5,z:h.z+Math.cos(h.angle)*.5,w:.92,d:2.28,angle:h.angle});
  if(h.cart&&(attached(h)?h.area:parkArea(h))===area)result.push({x:p.rootX,z:p.rootZ,w:2.2,d:2.25,angle:p.angle});
  return result;
 }
 return {
  ...art,
  get attached(){return attached(horseState())},
  colliders,
  update(dt,area,mounted,moving,time,persist=true){
   const h=horseState(),p=pose(h),cartArea=attached(h)?h.area:parkArea(h);
   art.root.visible=h.owned&&area===h.area;
   art.cart.visible=h.cart&&area===cartArea;
   art.root.position.set(h.x,terrainHeight(h.area,h.x,h.z),h.z);
   art.root.rotation.y=h.angle;
   if(persist&&attached(h)&&(!savedPose(h)||parkArea(h)!==h.area))savePose(h,p);
   if(art.cart.visible){
    art.cart.position.set(p.rootX,terrainHeight(cartArea,p.rootX,p.rootZ),p.rootZ);
    art.cart.rotation.y=p.angle;
   }
   art.animate(0,time);
   let legIndex=0;
   for(const leg of art.horse.children)if(leg.isGroup){
    leg.rotation.x=moving?Math.sin(time*8+(legIndex===0||legIndex===3?0:Math.PI))*.50:0;
    legIndex++;
   }
   if(moving)art.horse.position.y=Math.abs(Math.sin(time*8))*.025;
   wheelPhase+=cartTravel;
   cartTravel=0;
   for(const wheel of art.wheels)wheel.rotation.x=wheelPhase/.50;
  },
  samples(h,position=h){
   const points=horseSamples(position);
   if(attached(h))points.push(...cartSamples(pose(h,position)));
   return points;
  },
  commit(h,position){
   if(attached(h)){
    const p=pose(h,position);
    savePose(h,p);
    cartTravel+=p.wheelTravel||0;
   }
   Object.assign(h,position);
  },
  toggle(area,mounted,canAttach){
   const h=horseState(),player=state.player,p=pose(h);
   if(!h.owned||!h.cart||h.area!==area)return {changed:false,message:'O cavalo e a carroça precisam estar neste cenário.'};
   if(!mounted&&Math.hypot(player.x-h.x,player.z-h.z)>3&&(!attached(h)||Math.hypot(player.x-p.rootX,player.z-p.rootZ)>2.5))return {changed:false,message:'Aproxime-se do cavalo.'};
   if(attached(h)){
    savePose(h,p);
    h.cartAttached=false;
    return {changed:true,message:'Carroça estacionada. Agora você pode andar só com o cavalo.'};
   }
   const next=solveHorseCart(h,{},true);
   if(parkArea(h)!==area||Math.hypot(p.x-next.x,p.z-next.z)>1.9)return {changed:false,message:'Leve o cavalo até a frente da carroça, com a traseira voltada para o engate.'};
   if(!canAttach(cartSamples(next),cartSamples(p)))return {changed:false,message:'Precisa de espaço livre em volta da carroça para acoplar.'};
   savePose(h,next);
   h.cartAttached=true;
   return {changed:true,message:'Carroça acoplada.'};
  },
  get driverPose(){
   const h=horseState(),p=pose(h);
   return attached(h)?{x:p.rootX+Math.sin(p.angle)*.52,z:p.rootZ+Math.cos(p.angle)*.52,angle:p.angle,y:1.05}:
    {x:h.x+Math.sin(h.angle)*.22,z:h.z+Math.cos(h.angle)*.22,angle:h.angle,y:1.55};
  },
  point(area){
   const h=horseState();
   if(!h.owned||h.area!==area)return null;
   const p=pose(h),cartNear=attached(h)&&Math.hypot(state.player.x-p.rootX,state.player.z-p.rootZ)<2.2;
   return {type:'horse',x:cartNear?p.rootX:h.x,z:cartNear?p.rootZ:h.z,radius:2.5,label:attached(h)?'Cavalo e carroça':'Cavalo',data:{}};
  }
 };
}
