import {migrateFarmLayout,farmPoint} from './farm-customization.js?v=0.35';
import {buildToolRoom} from './tool-room.js?v=0.35';
import {migrateCultivation} from './cultivation-layout.js?v=0.35';
import {MAIN_FARM_BOUNDS} from './farm-layout.js?v=0.35';
import {colliderContains,compactSceneColliders} from './scene-collisions.js?v=0.35';
import {buildLighthouseUpper} from './lighthouse-upper.js?v=0.35';
import {INTERIOR_DESTINATIONS} from './interior-catalog.js?v=0.35';
import {buildChapel,buildLibrary,buildClinic} from './interiors-civic.js?v=0.35';
import {buildInn,buildRosaHouse,buildFisherHouse} from './interiors-homes.js?v=0.35';
import {buildSmithy,buildCarpenter,buildMine,buildLighthouse} from './interiors-workshops.js?v=0.35';
import {buildLake,buildHomestead} from './region-homesteads.js?v=0.35';
import {migrateHomesteads,lotState} from './homestead-rules.js?v=0.35';
import {addMapFauna} from './fauna-art.js?v=0.35';
import {createKit} from './region-kit.js?v=0.35';
import {buildHouse,buildBarn} from './region-interiors.js?v=0.35';
import {buildVillage} from './region-village.js?v=0.35';
import {buildMountain,buildBeach} from './region-nature.js?v=0.35';
import {buildMarket} from './region-market.js?v=0.35';
export const DESTINATIONS=[{id:'farm',label:'Sua fazenda',description:'Cultivo amplo, construções e caminhos até as bordas',icon:'✿'},{id:'house',label:'Sua casa',description:'Cozinha, lareira, quarto e descanso',icon:'⌂'},{id:'barn',label:'Celeiro',description:'Vacas, ovelhas, galinhas e cuidados',icon:'♧'},{id:'toolroom',label:'Quarto de ferramentas',description:'Prateleiras, sementes e bebidas refrescantes',icon:'⚒'},{id:'village',label:'Vila Mineral',description:'Praça, lojas, igreja e moradores',icon:'♜'},{id:'market',label:'Mercado da Vila',description:'Prateleiras e sementes das quatro estações',icon:'♧'},{id:'mountain',label:'Montanha da Lua',description:'Bosque, riacho, mina e águas termais',icon:'▲'},{id:'beach',label:'Praia das Conchas',description:'Mar, píer, barco e pescador',icon:'≈'}];
DESTINATIONS.push({id:'lake',label:'Lago dos Ipês',description:'Terrenos à venda e oficina do lenhador',icon:'≈'},{id:'homestead',label:'Sua fazenda do lago',description:'Limpar, plantar e construir do zero',icon:'⌂'});
DESTINATIONS.push(...INTERIOR_DESTINATIONS);
const builders={toolroom:buildToolRoom,lighthouseUpper:buildLighthouseUpper,chapel:buildChapel,library:buildLibrary,clinic:buildClinic,inn:buildInn,rosaHouse:buildRosaHouse,fisherHouse:buildFisherHouse,smithy:buildSmithy,carpenter:buildCarpenter,mine:buildMine,lighthouse:buildLighthouse,lake:buildLake,homestead:buildHomestead,market:buildMarket,house:buildHouse,barn:buildBarn,village:buildVillage,mountain:buildMountain,beach:buildBeach};
const outdoorAreas=new Set(['farm','village','mountain','beach','lake','homestead']);
export function isIndoorArea(id){return typeof id==='string'&&Object.hasOwn(builders,id)&&!outdoorAreas.has(id)}
export function createRegionManager({scene,state,bake,farmRoot,farmColliders,onChange,onLeave,canTravel=()=>true}){
 migrateHomesteads(state);migrateCultivation(state);migrateFarmLayout(state);state.homePlots??=state.plots;if(state.region==='homestead'&&lotState(state))lotState(state).plots=state.plots;else state.homePlots=state.plots;
 const faunaKit=createKit(),farmPhotoSubjects=addMapFauna(faunaKit,'farm');farmColliders.push(...faunaKit.colliders);farmRoot.add(faunaKit.dynamic);const faunaArt=bake(faunaKit.fixed);faunaArt.name='farm-fauna';farmRoot.add(faunaArt);
 const farm={photoSubjects:farmPhotoSubjects,id:'farm',label:'Sua fazenda',root:farmRoot,bounds:[...MAIN_FARM_BOUNDS],spawn:[-.8,1.6],viewHeight:12,indoors:false,colliders:farmColliders,portals:[],interactions:[],signs:[],update(){}};let active=farm,portalVisit=0,markers=null;
 function refreshFarmLayout(){
  migrateFarmLayout(state);if(markers){farmRoot.remove(markers);markers.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose()});markers=null}
  for(let i=farmColliders.length-1;i>=0;i--)if(farmColliders[i].farmMarker)farmColliders.splice(i,1);
  const k=createKit();
  const sign=(id,dx,dz,label)=>{const p=farmPoint(state,id,dx,dz);k.sign(p.x,p.z,label)};
  const entry=(id,dz,label,spawn)=>{const p=farmPoint(state,id,0,dz);k.portal({...p,to:id,spawn,autoRadius:id==='barn'?.70:.65,label})};
  sign('house',-3.15,2.5,'Sua casa');sign('barn',3.0,2.4,'Celeiro');sign('toolroom',2.5,2.2,'Quarto de ferramentas');
  entry('house',2.6,'Entrar em casa',[0,3.3]);entry('barn',2.5,'Entrar no celeiro',[0,4.4]);entry('toolroom',2.3,'Entrar no quarto de ferramentas',[0,3.3]);
  k.sign(23,-17,'Vila Mineral →');k.sign(-20.5,5.8,'← Montanha');k.sign(9.6,24.5,'Praia ↓');
  k.portal({x:24.9,z:-15,to:'village',spawn:[0,12.4],label:'Caminho da cidade',radius:1.4});
  k.portal({x:-20.9,z:8,to:'mountain',spawn:[0,13],label:'Trilha da montanha',radius:1.4});
  k.portal({x:12,z:24.8,to:'beach',spawn:[-13.5,9],label:'Trilha da praia',radius:1.4});
  const shipping=farmPoint(state,'shipping',0,1.5),well=farmPoint(state,'well',0,1.5),hammock=farmPoint(state,'hammock',0,1.7);
  k.interact({...shipping,type:'shipping',label:'Entregar colheita na caixa de vendas',radius:1.5});
  k.interact({...well,type:'well',label:'Encher o regador no poço',radius:1.5});
  k.interact({...hammock,type:'hammock',label:'Deitar e descansar na rede',radius:1.6});
  for(const c of k.colliders)c.farmMarker=true;farmColliders.push(...k.colliders);compactSceneColliders(farmColliders);
  farm.portals=k.portals;farm.interactions=k.interactions;farm.signs=k.signs;farm.portalVisit=++portalVisit;
  if(['house','barn','toolroom'].includes(active.id)&&state.buildingReturn?.area!=='homestead'){const door=farmPoint(state,active.id,0,4.2);for(const p of active.portals||[])if(p.to==='farm')p.spawn=[door.x,door.z];}
  markers=bake(k.fixed);markers.name='farm-destinations';farmRoot.add(markers);return farm;
 }
 refreshFarmLayout();
 function fits(region,x,z,ignoreJumpable=false){if(!Number.isFinite(x)||!Number.isFinite(z))return false;if(region.id==='lighthouseUpper'&&Math.hypot(x,z)>4.85)return false;const b=region.bounds;if(x<b[0]+.25||x>b[1]-.25||z<b[2]+.25||z>b[3]-.25)return false;for(const c of region.colliders){if(ignoreJumpable&&c.jumpable===true)continue;if(colliderContains(c,x,z,.23))return false}return true}
 function safeSpawn(region,desired){if(desired&&fits(region,...desired))return desired;if(fits(region,...region.spawn))return region.spawn;for(let r=.5;r<7;r+=.5)for(let i=0;i<16;i++){const a=i*Math.PI/8,p=[region.spawn[0]+Math.sin(a)*r,region.spawn[1]+Math.cos(a)*r];if(fits(region,...p))return p}throw Error('Área sem ponto de entrada: '+region.id)}
 function travel(id,spawn,restore=false){
  if(!restore&&canTravel(id)===false)return active;
  migrateHomesteads(state);state.homePlots??=state.plots;if(id==='homestead'&&!lotState(state))id='lake';if(id!=='farm'&&!builders[id])id='farm';if(active.id===id&&!restore&&!spawn&&(id!=='homestead'||active.lotId===state.homesteads.selected))return active;
  if(!restore){if(active.id==='farm')state.homePlots=state.plots;if(active.id==='homestead'&&state.homesteads.lots[active.lotId])state.homesteads.lots[active.lotId].plots=state.plots;}
  state.plots=id==='homestead'?lotState(state).plots:state.homePlots;
  if(['house','barn','toolroom'].includes(id)){if(active.id==='homestead')state.buildingReturn={area:'homestead',lotId:active.lotId};else if(!['house','barn','toolroom'].includes(active.id))state.buildingReturn=null;}
  const next=id==='farm'?farm:builders[id](state);
  if(next.indoors&&state.buildingReturn?.area==='homestead'){for(const p of next.portals)if(p.to==='farm'){p.to='homestead';p.spawn=[10,10];}}
  else if(['house','barn','toolroom'].includes(id)){const door=farmPoint(state,id,0,4.2);for(const p of next.portals)if(p.to==='farm')p.spawn=[door.x,door.z];}
  if(id!=='farm'){const art=bake(next.fixed,8);art.name=id+'-static';next.root.remove(next.fixed);next.fixed.clear();next.root.add(art)}
  const requested=spawn||(restore?[state.player.x,state.player.z]:id==='farm'&&state.farmReturn?[state.farmReturn.x,state.farmReturn.z]:null),position=safeSpawn(next,requested);
  onLeave?.(active);if(active.id==='farm'&&id!=='farm'&&!restore)state.farmReturn={x:state.player.x,z:state.player.z,angle:state.player.angle};if(active.id!=='farm'){scene.remove(active.root);active.dispose()}farmRoot.visible=id==='farm';if(id!=='farm')scene.add(next.root);active=next;next.portalVisit=++portalVisit;state.region=id;state.player.x=position[0];state.player.z=position[1];if(!restore)state.player.angle=id==='farm'&&state.farmReturn&&Number.isFinite(state.farmReturn.angle)?state.farmReturn.angle:Math.PI/4;state.visited=Array.from(new Set([...(Array.isArray(state.visited)?state.visited.filter(x=>DESTINATIONS.some(d=>d.id===x)):[]),id]));onChange?.(next);return next;
 }
 function nearby(){let best=null,dist=Infinity;for(const p of [...active.portals,...active.interactions]){const d=Math.hypot(state.player.x-p.x,state.player.z-p.z);if(d<(p.radius??1.6)&&d<dist){best=p;dist=d}}return best}
 const saved=state.region;travel(saved||'farm',undefined,true);
 return {travel,refreshFarmLayout,nearby,fits,get active(){return active},get destinations(){return DESTINATIONS},get isFarm(){return active.id==='farm'},get indoors(){return !!active.indoors},update(dt,time){active.update(dt,time)}};
}