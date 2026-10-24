// Animal care is kept in the version-2 save without changing crop progress.
export const ANIMALS=Object.freeze([
 {id:'mimosa',name:'Mimosa',species:'cow',feedLabel:'Cocho de Mimosa'},
 {id:'estrela',name:'Estrela',species:'cow',feedLabel:'Cocho de Estrela'},
 {id:'amora',name:'Amora',species:'cow',feedLabel:'Cocho de Amora'},
 {id:'nuvem',name:'Nuvem',species:'sheep',feedLabel:'Cocho de Nuvem'},
 {id:'algodao',name:'Algodão',species:'sheep',feedLabel:'Cocho de Algodão'},
 {id:'pipoca',name:'Pipoca',species:'chicken',feedLabel:'Comedouro de Pipoca'},
 {id:'pacoca',name:'Paçoca',species:'chicken',feedLabel:'Comedouro de Paçoca'},
 {id:'canela',name:'Canela',species:'chicken',feedLabel:'Comedouro de Canela'}
].map(a=>Object.freeze(a)));
const byId=new Map(ANIMALS.map(a=>[a.id,a]));
const dayKey=s=>`${s.year}-${s.season}-${s.day}`;
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
const validDay=x=>typeof x==='string'&&/^\d+-[0-3]-\d{1,2}$/.test(x)?x:null;
const clamp=x=>Math.max(0,Math.min(100,Math.round(x)));
export function migrateAnimalCare(s){
 const old=record(s.animalCare)?s.animalCare:{},prior=record(old.animals)?old.animals:{},animals={};
 for(const a of ANIMALS){const p=record(prior[a.id])?prior[a.id]:{};animals[a.id]={happiness:Number.isFinite(p.happiness)?clamp(p.happiness):50,fedDay:validDay(p.fedDay)||validDay(old.feedDay),petDay:validDay(p.petDay)}}
 s.animalCare={schema:1,animals,settledDay:validDay(old.settledDay)};
 // A harvest and a hay portion cannot occupy the same hands in an imported save.
 s.carryingHay=s.carryingHay===true&&!s.held;
 return s.animalCare;
}
function care(s){return s.animalCare?.schema===1&&record(s.animalCare.animals)?s.animalCare:migrateAnimalCare(s)}
export function animalStatus(s,id){
 const a=byId.get(id);if(!a)return null;const p=care(s).animals[id],fed=p.fedDay===dayKey(s);
 return {...a,hungry:!fed,fed,happiness:p.happiness,hearts:Math.round(p.happiness/20),petted:p.petDay===dayKey(s),fedDay:p.fedDay,petDay:p.petDay};
}
export function pickHay(s){
 care(s);if(s.held)return {changed:false,message:'Guarde a colheita na mochila para pegar o feno.'};
 if(s.carryingHay)return {changed:false,message:'Você já carrega uma porção. Leve ao cocho ou devolva ao feno.'};
 s.carryingHay=true;return {changed:true,message:'Uma porção de feno nas mãos. Leve ao cocho de um animal com fome.'};
}
export function returnHay(s){
 care(s);if(!s.carryingHay)return {changed:false,message:'Você não está carregando feno.'};
 s.carryingHay=false;return {changed:true,message:'Feno devolvido ao depósito. Suas mãos estão livres.'};
}
export function feedAnimal(s,id){
 const a=byId.get(id);if(!a)return {changed:false,message:'Este cocho não pertence a um animal.'};
 const p=care(s).animals[id];if(p.fedDay===dayKey(s))return {changed:false,message:`${a.name} já comeu hoje. Guarde esta porção para outro animal.`};
 if(!s.carryingHay)return {changed:false,message:'Pegue uma porção de feno no depósito antes de encher este cocho.'};
 s.carryingHay=false;p.fedDay=dayKey(s);p.happiness=clamp(p.happiness+8);
 return {changed:true,message:`Você encheu o cocho de ${a.name}. Bem alimentado por hoje! ♥`};
}
export function petAnimal(s,id){
 const a=byId.get(id);if(!a)return {changed:false,message:'Este animal não está por perto.'};
 const p=care(s).animals[id];if(s.carryingHay)return {changed:false,message:'Coloque primeiro o feno em um cocho para fazer carinho.'};
 if(s.held)return {changed:false,message:'Guarde a colheita para fazer carinho com as mãos livres.'};
 if(p.petDay===dayKey(s))return {changed:false,message:`${a.name} já recebeu seu carinho hoje. ♥`};
 p.petDay=dayKey(s);p.happiness=clamp(p.happiness+3);return {changed:true,message:`${a.name} gostou do seu carinho! ♥`};
}
// Call once BEFORE simulation.sleep changes the calendar. Repeated calls are safe.
export function advanceAnimalDay(s){
 const c=care(s),day=dayKey(s);if(c.settledDay===day)return {changed:false,message:''};
 let hungry=0;for(const a of ANIMALS){const p=c.animals[a.id];if(p.fedDay!==day){p.happiness=clamp(p.happiness-10);hungry++}}
 c.settledDay=day;s.carryingHay=false;
 return {changed:true,message:hungry?`${hungry} ${hungry===1?'animal ficou':'animais ficaram'} sem comida e ${hungry===1?'perdeu':'perderam'} felicidade.`:'Todos os animais passaram o dia bem alimentados.'};
}
