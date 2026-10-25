import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState} from './simulation.js';
import {ANIMALS} from './animal-care.js';
import {migrateTransport,hitchTrailer,loadAnimal,unloadAnimal,ringHerd,advanceHerd,herdPose,indoorLocation} from './transport-rules.js';
const fresh=()=>{const s=freshState(false);s.region='farm';s.animalCare={preserved:{happiness:73,fedDay:'1-0-1'}};migrateTransport(s);return s};
function tick(s,seconds=60){for(let i=0;i<seconds*20;i++)advanceHerd(s,.05)}
test('bell sends the local herd out and brings it back with no duplicate animals',()=>{
 const s=fresh(),care=JSON.stringify(s.animalCare);assert.equal(ringHerd(s,'farm').changed,true);assert.equal(ringHerd(s,'farm').changed,false);tick(s);
 assert.ok(ANIMALS.every(a=>s.animalLocations[a.id]==='farm'));assert.equal(Object.keys(s.herdRoutes||{}).length,0);
 assert.equal(ringHerd(s,'farm').changed,true);tick(s);assert.ok(ANIMALS.every(a=>s.animalLocations[a.id]==='barn'));assert.equal(JSON.stringify(s.animalCare),care);
});
test('bell skips the trailer passenger and animals belonging to another property',()=>{
 const s=fresh();s.homesteads={owned:['willow'],selected:'willow',lots:{willow:{barn:true}}};s.animalLocations.mimosa='homesteadBarn:willow';hitchTrailer(s);assert.equal(loadAnimal(s,'nuvem','barn').changed,true);
 assert.equal(ringHerd(s,'farm').changed,true);tick(s);assert.equal(s.tractor.cargo,'nuvem');assert.equal(s.animalLocations.nuvem,'trailer');assert.equal(s.animalLocations.mimosa,'homesteadBarn:willow');
 assert.ok(!s.herdRoutes?.nuvem);assert.ok(!s.herdRoutes?.mimosa);assert.equal(s.animalLocations.estrela,'farm');
});
test('save roundtrip resumes the walking route and preserves care',()=>{
 const s=fresh();ringHerd(s,'farm');tick(s,1);const saved=JSON.parse(JSON.stringify(s));migrateTransport(saved);assert.ok(Object.keys(saved.herdRoutes||{}).length>0);assert.deepEqual(saved.animalCare,s.animalCare);tick(saved);assert.ok(ANIMALS.every(a=>saved.animalLocations[a.id]==='farm'));assert.equal(Object.keys(saved.herdRoutes||{}).length,0);
});
test('unloading chooses barn or pasture while requiring a built destination barn',()=>{
 const s=fresh();hitchTrailer(s);loadAnimal(s,'mimosa','barn');assert.equal(unloadAnimal(s,'farm','barn').changed,true);tick(s);assert.equal(s.animalLocations.mimosa,'barn');
 assert.equal(loadAnimal(s,'mimosa','barn').changed,true);assert.equal(unloadAnimal(s,'farm','outside').changed,true);tick(s);assert.equal(s.animalLocations.mimosa,'farm');
 s.homesteads={owned:['willow'],selected:'willow',lots:{willow:{barn:false}}};assert.equal(loadAnimal(s,'mimosa','farm').changed,true);assert.equal(unloadAnimal(s,'homestead','barn').changed,false);s.homesteads.lots.willow.barn=true;assert.equal(unloadAnimal(s,'homestead','barn').changed,true);tick(s);assert.equal(s.animalLocations.mimosa,'homesteadBarn:willow');
});
test('walking route has finite changing positions in front of the barn and inside',()=>{
 const s=fresh();ringHerd(s,'farm');const points=new Set();let walking=false;
 for(let i=0;i<500;i++){for(const area of['farm','barn']){const p=herdPose(s,'mimosa',area);if(p?.visible){assert.ok([p.x,p.z,p.angle].every(Number.isFinite));points.add(p.x.toFixed(3)+','+p.z.toFixed(3));walking ||= !!p.walking}}advanceHerd(s,.05)}
 assert.ok(walking);assert.ok(points.size>10);assert.equal(indoorLocation(s,'farm'),'barn');s.homesteads={owned:['willow'],selected:'willow',lots:{willow:{barn:true}}};assert.equal(indoorLocation(s,'homestead'),'homesteadBarn:willow');
});