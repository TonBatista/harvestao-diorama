import * as T from './three.module.js';
import {createInteriorRoom,group,C} from './rural-room.js?v=0.55.0';
import {chicken,barnCareDisplay} from './region-interiors.js?v=0.55.0';
import {ANIMALS,animalStatus,migrateAnimalCare} from './animal-care.js?v=0.52.0';
import {migrateTransport,indoorStall,transportRoster} from './transport-rules.js?v=0.52.0';
import {availableEggs} from './simulation.js?v=0.53.0';
export function buildCoop(state){
 migrateAnimalCare(state);migrateTransport(state);
 const k=createInteriorRoom({id:'coop',label:'Galinheiro',w:10,d:9,wall:'#ac8257',floor:'#ac936c',floorKind:'earth',wallKind:'wood',returnTo:'farm',returnSpawn:[-12.85,24.3]}),F=k.fixed;
 // Golden window panes and dirt/straw floor; no extra shadow-casting lights.
 for(const x of[-2.7,2.7]){
  const pane=k.box(F,'#f3d690',x,1.88,-4.19,1.48,1.22,.025);pane.material=pane.material.clone();pane.material.emissive.set('#e9b65d');pane.material.emissiveIntensity=.35;pane.material.userData.regionOwned=true;
  for(const dx of[-.73,0,.73])k.box(F,C.trim,x+dx,1.88,-4.13,.06,1.30,.055,'wood');k.box(F,C.trim,x,1.88,-4.13,1.5,.06,.055,'wood');
 }
 const haySlots=[],residents=[],eggMeshes=[],assigned=new Set(transportRoster(state,'coop').map(a=>a.id));
 for(const [i,hen]of ANIMALS.filter(a=>a.species==='chicken').entries()){
  const x=-2.7+i*2.7,nest=group(F,x,0,-3.45);
  k.box(nest,C.dark,0,.45,-.48,2.05,.88,.10,'wood');
  for(const sx of[-1,1])k.box(nest,C.oak,sx*.98,.30,0,.10,.60,1.05,'wood');
  k.box(nest,C.oak,0,.12,.49,2.05,.24,.10,'wood');k.box(nest,'#c7ae74',0,.08,0,1.88,.09,.93,'earth');
  for(let j=0;j<45;j++){const a=j*2.4,straw=k.box(nest,j%2?'#d9bf79':'#b69b5b',Math.sin(a)*.84,.14+(j%3)*.009,Math.cos(j*3.1)*.40,.012,.009,.14+(j%4)*.04);straw.rotation.y=a;straw.castShadow=false}
  k.solid(x,-3.45,2.08,1.08,{height:.88});
  const egg=k.ball(nest,'#f2e5c5',0,.28,.20,.11,.15,.11);eggMeshes.push({hen:hen.id,egg});
  k.interact({x,z:-2.2,type:'eggs',radius:1.3,label:'Recolher ovo de '+hen.name,data:{animalId:hen.id}});
  const dish=group(F,x,0,1.75);k.cyl(dish,'#ab6d4e',0,.12,0,.34,.22);k.cyl(dish,'#79563a',0,.235,0,.28,.02);
  const grain=k.cyl(dish,'#d9b975',0,.25,0,.27,.035);haySlots.push({id:hen.id,filled:grain});
  k.roundSolid(x,1.75,.36,{height:.24});
  if(assigned.has(hen.id))k.interact({x,z:2.4,type:'feed',radius:.95,label:'Ração de '+hen.name,data:{animalId:hen.id}});
  if(state.animalLocations[hen.id]==='barn'&&!state.herdRoutes?.[hen.id]&&animalStatus(state,hen.id).alive){const p=indoorStall(hen.id),object=chicken(k,p.x,p.z,i*2,false,hen.id);residents.push({id:hen.id,object,height:1.15})}
 }
 k.animate(()=>{const eggs=new Set(availableEggs(state,'farm').map(a=>a.id));for(const {hen,egg}of eggMeshes)egg.visible=eggs.has(hen)});
 barnCareDisplay(k,state,residents,haySlots);
 const chest=group(F,-4.15,0,3.1);k.box(chest,'#b69a71',0,.39,0,1.0,.78,1.03,'wood');k.box(chest,'#d2ba87',0,.81,0,1.10,.08,1.1,'wood');k.solid(-4.15,3.1,1.12,1.13);
 k.interact({x:-3.1,z:3.05,type:'chickenSilo',radius:1.15,label:'Ração do silo · pegar uma porção'});
 const sign=k.sign(1.55,3.7,'Galinheiro');sign.userData.signPoint.type='barnBell';sign.userData.signPoint.data.area='coop';
 const room=k.finishRoom();room.residentIds=residents.map(a=>a.id);room.photoSubjects=residents.map(a=>({id:'barn-'+a.id,name:ANIMALS.find(h=>h.id===a.id).name,speciesId:'chicken',object:a.object,offsetY:.50}));return room;
}
