import test from 'node:test';
import assert from 'node:assert/strict';
import {CROPS,SEASONS,FIELD,TILE,cropsForSeason,freshState,buy,useTool,sleep,pick,ship,validSave} from './simulation.js?v=0.17';

function plantingState(id){
 const s=freshState(false);s.season=CROPS[id].season;s.money=10000;s.seed=id;s.tool='seed';s.bags={};
 const p=s.plots.find(q=>q.x===4&&q.z===4);p.tilled=true;p.obstacle=null;
 s.player={x:FIELD.x+4*TILE,z:FIELD.z+4*TILE,angle:0};return {s,p};
}

test('all four seasons have usable seed choices and consistent numeric metadata',()=>{
 assert.equal(Object.keys(CROPS).length,16);
 for(let season=0;season<4;season++){
  const entries=cropsForSeason(season);assert.ok(entries.length>=3,SEASONS[season]);
  for(const [id,c] of entries){assert.ok(id&&c.name);assert.equal(c.season,season);assert.ok(c.days>0&&c.days<=30);assert.ok(c.price>0&&c.bag>0);assert.ok(c.regrow>=0&&c.regrow<c.days)}
 }
 assert.deepEqual(cropsForSeason(-1),[]);
});

test('any seasonal seed can be purchased year round and stored without equipping it',()=>{
 for(let season=0;season<4;season++)for(const [id,c] of Object.entries(CROPS)){
  const s=freshState(false);s.season=season;s.money=10000;const before=s.bags[id]||0;
  const result=buy(s,id);assert.equal(result.changed,true,id);assert.equal(s.money,10000-c.bag);assert.equal(s.bags[id],before+1);assert.equal(s.seed,'turnip');
  if(c.season!==season)assert.match(result.message,new RegExp(SEASONS[c.season].toLowerCase()));
  assert.equal(validSave(JSON.parse(JSON.stringify(s))),true);
 }
});

test('planting out of season explains the correct season and preserves seed bags and resources',()=>{
 for(const [id,c] of Object.entries(CROPS)){
  const {s,p}=plantingState(id);s.season=(c.season+1)%4;s.bags[id]=1;const stamina=s.stamina;
  const result=useTool(s);assert.equal(result.changed,undefined,id);assert.match(result.message,new RegExp(SEASONS[c.season].toLowerCase()));assert.equal(s.bags[id],1);assert.equal(s.stamina,stamina);assert.equal(p.crop,null);
 }
});

test('each catalog crop plants, grows only with water, harvests, regrows correctly, and ships at its price',()=>{
 for(const [id,c] of Object.entries(CROPS)){
  const {s,p}=plantingState(id);buy(s,id);assert.equal(useTool(s).changed,true,id);assert.equal(p.crop,id);assert.equal(s.bags[id],0);
  sleep(s);assert.equal(p.age,0,id+' stayed dry');
  for(let day=0;day<c.days;day++){p.wet=true;sleep(s)}
  assert.equal(p.age,c.days,id+' reached maturity');
  s.player={x:FIELD.x+4*TILE,z:FIELD.z+3*TILE,angle:0};assert.equal(pick(s).changed,true,id);assert.equal(s.held,id);
  if(c.regrow){assert.equal(p.crop,id);assert.equal(p.age,c.days-c.regrow)}else{assert.equal(p.crop,null);assert.equal(p.age,0)}
  assert.equal(ship(s).changed,true,id);assert.equal(s.shipping,c.price);assert.equal(s.held,null);
 }
});

test('calendar rollover removes the old plants but preserves seeds bought for the next season',()=>{
 const s=freshState(false);s.season=3;s.day=30;s.money=1000;buy(s,'turnip');const bags=s.bags.turnip;s.plots[0].crop='kale';s.plots[0].age=8;
 sleep(s);assert.equal(s.season,0);assert.equal(s.day,1);assert.equal(s.year,2);assert.equal(s.plots[0].crop,null);assert.equal(s.bags.turnip,bags);
});

test('unknown and prototype crop names are rejected without modifying money or seed inventory',()=>{
 const s=freshState(false),money=s.money,bags=JSON.stringify(s.bags);
 for(const id of ['unknown','__proto__','constructor',null,undefined]){assert.equal(buy(s,id).changed,undefined);s.seed=id;s.tool='seed';assert.doesNotThrow(()=>useTool(s));assert.equal(useTool(s).changed,undefined)}
 assert.equal(s.money,money);assert.equal(JSON.stringify(s.bags),bags);
});

test('version 2 saves retain the old seven crops and accept every new crop in the field, hands, and bag',()=>{
 const old=freshState();delete old.inventory;assert.equal(validSave(JSON.parse(JSON.stringify(old))),true);
 for(const id of Object.keys(CROPS)){const s=freshState(false);s.plots[0].crop=id;s.held=id;s.seed=id;s.inventory=[id];assert.equal(validSave(JSON.parse(JSON.stringify(s))),true,id)}
 const s=freshState();assert.equal(validSave({...s,plots:{length:144}}),false);assert.equal(validSave({...s,seed:'__proto__'}),false);assert.equal(validSave({...s,season:4}),false);s.plots[0].crop='__proto__';assert.equal(validSave(s),false);
});

test('all crop graphics and held models have finite shared geometry at every growth stage',async()=>{
 const noop=()=>{};
 const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(object,key)=>object[key]??noop});
 const previous=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 try{
  const [{createCropArt},T]=await Promise.all([import('./crop-art.js'),import('./three.module.js')]);const {cropModel}=createCropArt();
  for(const [id,c] of Object.entries(CROPS))for(const fraction of [0,.25,.6,.85,1]){
   const group=new T.Group();cropModel(group,{crop:id,age:c.days*fraction},0,0);
   assert.ok(group.children.length>0,id+' '+fraction);
   group.traverse(object=>{if(!object.isMesh)return;for(const v of object.geometry.attributes.position.array)assert.ok(Number.isFinite(v));for(const v of [...object.position.toArray(),...object.scale.toArray()])assert.ok(Number.isFinite(v))});
  }
  for(const [id,c] of Object.entries(CROPS)){const group=new T.Group();cropModel(group,{crop:id,age:c.days},0,0,true);assert.ok(group.children.length>0,id+' held')}
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}
});