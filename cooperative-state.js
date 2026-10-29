import {migrateFarmStumps,validFarmStumps} from './farm-stumps.js?v=0.31';
import {CROPS,ITEMS,TOOLS,validSave} from './simulation.js?v=0.31';
import {ANIMALS} from './animal-care.js?v=0.31';

// Network data has its own schema. Visual release numbers never participate in
// compatibility checks, and aliases/local settings never cross the wire.
const SHARED=['version','farmName','day','season','year','minutes','weather','money','shipping','earned','lumber','seedChest','seedStorageVersion','homePlots','homesteads','animalCare','animalLocations','animalWander','herdRoutes','tractor','coopDriver','farmPets','nightVisits','eggCollections','gathered','farmStumps'];
const CLOCK=new Set(['day','season','year','minutes','weather']);
const PERSONAL=['inventory','held','bags','seed','tool','carryingHay','stamina','fatigue','water'];
const BAD=new Set(['__proto__','prototype','constructor']);
const ANIMAL_IDS=new Set(ANIMALS.map(a=>a.id)),LOT_IDS=new Set(['willow','sunrise','pine']);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const own=(v,k)=>v!==null&&typeof v==='object'&&Object.hasOwn(v,k);
const clone=v=>JSON.parse(JSON.stringify(v));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const item=v=>typeof v==='string'&&own(ITEMS,v);
const crop=v=>typeof v==='string'&&own(CROPS,v);
const location=v=>typeof v==='string'&&(v==='barn'||v==='farm'||v==='trailer'||/^homestead(?:Barn)?:(willow|sunrise|pine)$/.test(v));
function bounded(value){
 let nodes=0;
 function visit(v,depth){
  if(++nodes>40000||depth>22)return false;
  if(v===null||typeof v==='boolean')return true;
  if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=1e12;
  if(typeof v==='string')return v.length<=500;
  if(Array.isArray(v))return v.length<=5000&&v.every(x=>visit(x,depth+1));
  if(!object(v)||Object.keys(v).length>600)return false;
  return Object.entries(v).every(([k,x])=>!BAD.has(k)&&k.length<=100&&visit(x,depth+1));
 }
 return visit(value,0)&&JSON.stringify(value).length<=300000;
}
function counts(v){return object(v)&&Object.entries(v).every(([id,n])=>crop(id)&&integer(n,0,99999))}
function plots(v){return Array.isArray(v)&&v.length===144&&v.every((p,i)=>object(p)&&p.x===i%12&&p.z===Math.floor(i/12)&&typeof p.tilled==='boolean'&&typeof p.wet==='boolean'&&(p.crop===null||crop(p.crop))&&number(p.age,0,10000)&&[null,'weed','stone','branch'].includes(p.obstacle))}
function validShared(v){
 if(!object(v)||!bounded(v)||Object.keys(v).some(k=>!SHARED.includes(k))||!validFarmStumps(v.farmStumps))return false;
 if(v.version!==2||typeof v.farmName!=='string'||!v.farmName.trim()||Array.from(v.farmName).length>24||/[<>\u0000-\u001f]/u.test(v.farmName))return false;
 if(!integer(v.day,1,30)||!integer(v.season,0,3)||!integer(v.year,1,999999)||!number(v.minutes,0,2000)||!['sun','rain'].includes(v.weather))return false;
 if(!['money','shipping','earned','lumber'].every(k=>number(v[k],0,1e12))||!counts(v.seedChest)||v.seedStorageVersion!==1||!plots(v.homePlots))return false;
 if(!object(v.homesteads)||Object.keys(v.homesteads).some(k=>!['owned','lots'].includes(k))||!Array.isArray(v.homesteads.owned)||v.homesteads.owned.length>3||new Set(v.homesteads.owned).size!==v.homesteads.owned.length||!object(v.homesteads.lots))return false;
 if(Object.keys(v.homesteads.lots).some(id=>!LOT_IDS.has(id)))return false;
 for(const id of v.homesteads.owned){const p=v.homesteads.lots[id];if(!LOT_IDS.has(id)||!object(p)||typeof p.house!=='boolean'||typeof p.barn!=='boolean'||!plots(p.plots)||!Array.isArray(p.cleared)||p.cleared.length>16||p.cleared.some(i=>!integer(i,0,15)))return false}
 const care=v.animalCare;if(!object(care)||care.schema!==1||!object(care.animals)||ANIMALS.some(a=>{const p=care.animals[a.id];return !object(p)||!number(p.happiness,0,100)||[p.fedDay,p.petDay].some(d=>d!==null&&(typeof d!=='string'||!/^\d+-[0-3]-\d{1,2}$/.test(d)))}))return false;
 if(!object(v.animalLocations)||Object.entries(v.animalLocations).some(([id,l])=>!ANIMAL_IDS.has(id)||!location(l)))return false;
 if(!object(v.herdRoutes)||Object.entries(v.herdRoutes).some(([id,r])=>!ANIMAL_IDS.has(id)||!object(r)||typeof r.property!=='string'||!location(r.property)||!location(r.from)||!location(r.to)||!number(r.duration,0.001,120)||!number(r.elapsed,0,1e8)))return false;
 for(const r of Object.values(v.herdRoutes)){if(r.version===2&&(!Array.isArray(r.sections)||r.sections.length<1||r.sections.length>3||!integer(r.section,0,r.sections.length-1)||!number(r.distance,0,1e8)||r.sections.some(section=>!object(section)||!Array.isArray(section.points)||section.points.length<1||section.points.length>1702||section.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(n=>number(n,-100,100))))))return false}
 if(!object(v.animalWander)||Object.entries(v.animalWander).some(([id,p])=>!ANIMAL_IDS.has(id)||!object(p)||!number(p.x,-100,100)||!number(p.z,-100,100)))return false;
 if(!object(v.tractor)||(v.tractor.cargo!==null&&!ANIMAL_IDS.has(v.tractor.cargo))||typeof v.tractor.trailer!=='boolean')return false;
 if(['x','z','trailerX','trailerZ'].some(k=>own(v.tractor,k)&&!number(v.tractor[k],-100,100)))return false;
 if(v.tractor.cargo&&(!v.tractor.trailer||v.animalLocations[v.tractor.cargo]!=='trailer'))return false;
 if(Object.entries(v.animalLocations).some(([id,l])=>l==='trailer'&&id!==v.tractor.cargo))return false;
 if(v.coopDriver!==null&&(typeof v.coopDriver!=='string'||v.coopDriver.length>100))return false;
 if(!['animalCare','farmPets','nightVisits','eggCollections','gathered'].every(k=>object(v[k])))return false;
 return validSave({...v,player:{x:0,z:0},plots:v.homePlots});
}
export function sharedSnapshot(state){
 const h=state.homesteads||{},tractor=state.tractor||{};
 const value={version:2,farmName:state.profile?.farmName||'Fazenda Girassol',day:state.day,season:state.season,year:state.year,minutes:state.minutes,weather:state.weather,money:state.money,shipping:state.shipping||0,earned:state.earned||0,lumber:state.lumber||0,seedChest:state.seedChest||{},seedStorageVersion:1,homePlots:state.homePlots||state.plots,homesteads:{owned:h.owned||[],lots:h.lots||{}},animalCare:state.animalCare||{},animalLocations:state.animalLocations||Object.fromEntries(ANIMALS.map(a=>[a.id,'barn'])),animalWander:state.animalWander||{},herdRoutes:state.herdRoutes||{},tractor:{...tractor,trailer:tractor.trailer===true,cargo:tractor.cargo||null},coopDriver:state.coopDriver||null,farmPets:state.farmPets||{},nightVisits:state.nightVisits||{},eggCollections:state.eggCollections||{},gathered:state.gathered||{},farmStumps:migrateFarmStumps(state)};
 return clone(value);
}
export function applyShared(state,snapshot){
 if(!validShared(snapshot))return false;
 const next=clone(snapshot),selected=state.homesteads?.selected;
 for(const key of SHARED){if(key==='farmName'||key==='homesteads')continue;state[key]=next[key]}
 state.profile={...(state.profile||{}),farmName:next.farmName};
 state.homesteads={...next.homesteads,selected:next.homesteads.owned.includes(selected)?selected:next.homesteads.owned[0]||'willow'};
 state.plots=state.region==='homestead'&&state.homesteads.lots[state.homesteads.selected]?state.homesteads.lots[state.homesteads.selected].plots:state.homePlots;
 if(state.tractor.cargo){delete state.herdRoutes[state.tractor.cargo];delete state.animalWander[state.tractor.cargo]}
 return true;
}
const entry=(parent,key)=>own(parent,key)?{exists:true,value:clone(parent[key])}:{exists:false};
function routeIdentity(r){return object(r)?[r.property,r.from,r.to,r.order??0,r.start||null]:null}
export function diffShared(before,after){
 const patches=[];
 function walk(a,b,path){
  if(equal(a,b))return;
  const top=path[0];if(CLOCK.has(top)||top==='animalWander'||top==='version'||top==='seedStorageVersion')return;
  if(top==='herdRoutes'&&path.length===2&&equal(routeIdentity(a),routeIdentity(b)))return;
  const plotArray=path.at(-1)==='homePlots'||path.at(-1)==='plots';
  if(plotArray&&Array.isArray(a)&&Array.isArray(b)&&a.length===144&&b.length===144){for(let i=0;i<144;i++)if(!equal(a[i],b[i]))patches.push({path:[...path,i],before:{exists:true,value:clone(a[i])},after:{exists:true,value:clone(b[i])}});return}
  if(object(a)&&object(b)&&!((top==='herdRoutes'||top==='farmStumps')&&path.length===2)){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
    if(BAD.has(key))continue;
    if(!own(a,key)||!own(b,key)){patches.push({path:[...path,key],before:entry(a,key),after:entry(b,key)});continue}
    walk(a[key],b[key],[...path,key]);
   }
   return;
  }
  patches.push({path,before:{exists:true,value:clone(a)},after:{exists:true,value:clone(b)}});
 }
 for(const key of SHARED)if(!CLOCK.has(key)&&key!=='animalWander'&&key!=='version'&&key!=='seedStorageVersion')walk(before[key],after[key],[key]);
 return patches;
}
function validPersonal(value){
 if(!object(value)||!bounded(value)||Object.keys(value).some(k=>!PERSONAL.includes(k)))return false;
 if(!Array.isArray(value.inventory)||value.inventory.length>24||!value.inventory.every(item)||(value.held!==null&&!item(value.held))||!counts(value.bags)||!crop(value.seed)||!TOOLS.includes(value.tool))return false;
 if(typeof value.carryingHay!=='boolean'||value.carryingHay&&value.held)return false;
 return ['stamina','fatigue','water'].every(k=>number(value[k],0,100));
}
export function capturePersonal(state){return clone({inventory:state.inventory||[],held:state.held||null,bags:state.bags||{},seed:crop(state.seed)?state.seed:'turnip',tool:TOOLS.includes(state.tool)?state.tool:'hand',carryingHay:state.carryingHay===true,stamina:state.stamina??100,fatigue:state.fatigue??0,water:state.water??100})}
export function applyPersonal(state,data){if(!validPersonal(data))return false;Object.assign(state,clone(data));return true}
export function resetVisitorPersonal(state){const data={inventory:[],held:null,bags:{},seed:'turnip',tool:'hand',carryingHay:false,stamina:100,fatigue:0,water:100};Object.assign(state,data);return capturePersonal(state)}
function readPath(root,path){let parent=root;for(const key of path.slice(0,-1)){if(!own(parent,key)||!object(parent[key])&&!Array.isArray(parent[key]))return null;parent=parent[key]}return {parent,key:path.at(-1)}}
function validEntry(v){return object(v)&&typeof v.exists==='boolean'&&Object.keys(v).every(k=>k==='exists'||k==='value')&&(!v.exists||own(v,'value')&&bounded(v.value))}
/** Validate every comparison and the final model before mutating anything. The
 * caller rolls back its optimistic personal inventory when ok is false. */
export function applyTransaction(state,transaction,expectedPersonal){
 const conflict={ok:false,message:'A fazenda mudou enquanto você agia. Seu inventário foi restaurado; tente novamente.'};
 if(!object(transaction)||!Array.isArray(transaction.patches)||transaction.patches.length>400||!validPersonal(transaction.personal))return {ok:false,message:'Ação multiplayer inválida.'};
 if(expectedPersonal!==undefined&&!validPersonal(expectedPersonal))return {ok:false,message:'Sessão do visitante inválida.'};
 if(transaction.beforePersonal!==undefined&&expectedPersonal!==undefined&&!equal(transaction.beforePersonal,expectedPersonal))return conflict;
 const current=sharedSnapshot(state),candidate=clone(current),seen=new Set();
 for(const patch of transaction.patches){
  if(!object(patch)||!Array.isArray(patch.path)||patch.path.length<1||patch.path.length>9||patch.path.some(k=>typeof k!=='string'&&!Number.isInteger(k)||BAD.has(k)||typeof k==='number'&&(k<0||k>143)))return {ok:false,message:'Caminho de ação inválido.'};
  const top=patch.path[0];if(top==='farmStumps'&&(patch.path.length!==2||typeof patch.path[1]!=='string'))return {ok:false,message:'Mova um toco inteiro de cada vez.'};if(!SHARED.includes(top)||CLOCK.has(top)||['version','seedStorageVersion','animalWander'].includes(top)||!validEntry(patch.before)||!validEntry(patch.after))return {ok:false,message:'Esta ação pertence ao dono da sala.'};
  const key=JSON.stringify(patch.path);if(seen.has(key))return {ok:false,message:'Ação repetida.'};seen.add(key);
  const actual=readPath(current,patch.path),target=readPath(candidate,patch.path);if(!actual||!target)return conflict;
  const found=entry(actual.parent,actual.key);
  const route=top==='herdRoutes'&&patch.path.length===2&&found.exists&&patch.before.exists;
  if(found.exists!==patch.before.exists||found.exists&&!(route?equal(routeIdentity(found.value),routeIdentity(patch.before.value)):equal(found.value,patch.before.value)))return conflict;
  if(patch.after.exists){if(Array.isArray(target.parent)&&!Number.isInteger(target.key))return {ok:false,message:'Índice de ação inválido.'};target.parent[target.key]=clone(patch.after.value)}else{if(Array.isArray(target.parent))return {ok:false,message:'Não é possível remover um quadrado.'};delete target.parent[target.key]}
 }
 // Ancestor/descendant patches are never emitted by diffShared and are rejected
 // rather than allowing a crafted packet to bypass a previous comparison.
 const paths=transaction.patches.map(p=>p.path);for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++){const a=paths[i],b=paths[j];if(a.length!==b.length&&a.slice(0,Math.min(a.length,b.length)).every((k,n)=>k===b[n]))return {ok:false,message:'Ação sobreposta inválida.'}}
 if(!validShared(candidate))return {ok:false,message:'A alteração não forma uma fazenda válida.'};
 if(!applyShared(state,candidate))return {ok:false,message:'Não foi possível aplicar a alteração.'};
 return {ok:true,message:'Ação confirmada.',personal:clone(transaction.personal)};
}