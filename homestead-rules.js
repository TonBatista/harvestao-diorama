import {FIELD,TILE} from './simulation.js?v=0.24';
export const LOTS=Object.freeze([
 {id:'willow',name:'Recanto dos Salgueiros',price:300,x:-33,z:1},
 {id:'sunrise',name:'Margem do Amanhecer',price:1800,x:33,z:1},
 {id:'pine',name:'Clareira dos Pinheiros',price:2400,x:0,z:32}
].map(Object.freeze));
export const BUILDINGS=Object.freeze({house:{label:'Casa de campo',price:450,lumber:12},barn:{label:'Celeiro',price:650,lumber:18}});
// The first eight obstacles occupy the two construction pads.
export const DEBRIS=Object.freeze([
 {x:-.2,z:-9.7,kind:'weed'},{x:1.8,z:-9.9,kind:'branch'},{x:.6,z:-10.7,kind:'stone'},{x:2.4,z:-8.9,kind:'weed'},
 {x:-8.1,z:-9.3,kind:'branch'},{x:-6.9,z:-9.9,kind:'stone'},{x:-7.7,z:-8.3,kind:'weed'},{x:-6.5,z:-8.9,kind:'weed'},
 {x:11,z:3,kind:'branch'},{x:11.8,z:5,kind:'stone'},{x:10.7,z:8,kind:'weed'},{x:-8.8,z:6,kind:'weed'},
 {x:5,z:-6.5,kind:'branch'},{x:8.8,z:-7.4,kind:'weed'},{x:-4,z:-6.5,kind:'stone'},{x:-9,z:.5,kind:'branch'}
].map(Object.freeze));
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
function newPlots(){const plots=[];for(let z=0;z<FIELD.rows;z++)for(let x=0;x<FIELD.cols;x++){const n=(x*11+z*19)%13;plots.push({x,z,tilled:false,wet:false,crop:null,age:0,obstacle:n<3?'weed':n===4?'branch':n===7?'stone':null})}return plots}
export function migrateHomesteads(s){
 const prior=record(s.homesteads)?s.homesteads:{},lots=record(prior.lots)?prior.lots:{},owned=Array.isArray(prior.owned)?prior.owned.filter(id=>LOTS.some(l=>l.id===id)):[];
 for(const id of owned){const p=record(lots[id])?lots[id]:{};lots[id]={cleared:Array.isArray(p.cleared)?[...new Set(p.cleared.filter(i=>Number.isInteger(i)&&i>=0&&i<DEBRIS.length))]:[],house:p.house===true,barn:p.barn===true,plots:Array.isArray(p.plots)&&p.plots.length===144?p.plots:newPlots()}}
 s.homesteads={owned:[...new Set(owned)],selected:owned.includes(prior.selected)?prior.selected:owned[0]||LOTS[0].id,lots};return s.homesteads;
}
function registry(s){return record(s.homesteads)&&Array.isArray(s.homesteads.owned)&&record(s.homesteads.lots)?s.homesteads:migrateHomesteads(s)}
export function lotState(s,id=registry(s).selected){const h=registry(s);return h.owned.includes(id)?h.lots[id]:null}
export function purchaseLot(s,id){const l=LOTS.find(l=>l.id===id),h=registry(s);if(!l)return {changed:false,message:'Terreno indisponível.'};if(h.owned.includes(id)){h.selected=id;return {changed:true,owned:true,message:l.name+' já é seu. Entre pelo portão para começar.'}}if(s.money<l.price)return {changed:false,message:'Você precisa de '+l.price+' G para comprar este terreno.'};s.money-=l.price;h.owned.push(id);h.selected=id;h.lots[id]={cleared:[],house:false,barn:false,plots:newPlots()};return {changed:true,purchased:true,message:l.name+' agora é seu! Limpe o terreno e encomende as construções ao lenhador.'}}
export function selectLot(s,id){const h=registry(s);if(!h.owned.includes(id))return false;h.selected=id;return true}
export function clearLotDebris(s,index,tool=s.tool){const p=lotState(s),item=DEBRIS[index];if(!p||!item||!Number.isInteger(index))return {changed:false,message:'Compre este terreno primeiro.'};if(p.cleared.includes(index))return {changed:false,message:'Este ponto já está limpo.'};const allowed=item.kind==='weed'?['hand','sickle']:item.kind==='branch'?['axe']:['hammer'];if(!allowed.includes(tool))return {changed:false,message:item.kind==='weed'?'Use as mãos ou a foice para retirar o mato.':item.kind==='branch'?'Equipe o machado para recolher a madeira.':'Equipe o martelo para quebrar a pedra.'};p.cleared.push(index);if(item.kind==='branch')s.lumber=(Number.isFinite(s.lumber)?s.lumber:0)+3;s.stamina=Math.max(0,(s.stamina||0)-2);return {changed:true,message:item.kind==='branch'?'+3 madeiras. Terreno limpo.':'Obstáculo removido. O espaço agora está livre.'}}
export function constructBuilding(s,building){const p=lotState(s),b=BUILDINGS[building];if(!p||!b)return {changed:false,message:'Compre um terreno antes de construir.'};if(p[building])return {changed:false,message:'Esta construção já está pronta.'};const required=building==='house'?[0,1,2,3]:[4,5,6,7];if(required.some(i=>!p.cleared.includes(i)))return {changed:false,message:'Limpe primeiro o mato, os galhos e as pedras no local da '+b.label.toLowerCase()+'.'};if(s.money<b.price||(s.lumber||0)<b.lumber)return {changed:false,message:b.label+': precisa de '+b.price+' G e '+b.lumber+' madeiras. O lenhador vende madeira e ajuda na construção.'};s.money-=b.price;s.lumber-=b.lumber;p[building]=true;return {changed:true,built:true,message:b.label+' construída pelo lenhador! Você já pode entrar.'}}
export function buyLumber(s,quantity=10){if(!Number.isInteger(quantity)||quantity<1||quantity>100)return {changed:false,message:'Quantidade inválida.'};const cost=quantity*15;if(s.money<cost)return {changed:false,message:quantity+' madeiras custam '+cost+' G.'};s.money-=cost;s.lumber=(s.lumber||0)+quantity;return {changed:true,message:'O lenhador entregou '+quantity+' madeiras por '+cost+' G.'}}