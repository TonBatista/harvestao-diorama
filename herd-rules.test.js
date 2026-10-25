import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState} from './simulation.js';
import {ANIMALS} from './animal-care.js';
import {migrateTransport,hitchTrailer,loadAnimal,unloadAnimal,ringHerd,advanceHerd,herdPose,indoorLocation,bodyRadius,ANIMAL_STALLS,updateAnimalWander} from './transport-rules.js';
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
test('species-sized queue never overlaps at the doorway or either route direction',()=>{
 const s=fresh();for(let journey=0;journey<2;journey++){assert.equal(ringHerd(s,'farm').changed,true);let seenQueue=false;for(let frame=0;frame<1500&&Object.keys(s.herdRoutes).length;frame++){
  for(const area of ['farm','barn']){const poses=ANIMALS.map(a=>({id:a.id,...herdPose(s,a.id,area)})).filter(p=>p.visible);for(let i=0;i<poses.length;i++)for(let j=i+1;j<poses.length;j++){const a=poses[i],b=poses[j],gap=Math.hypot(a.x-b.x,a.z-b.z);assert.ok(gap>=bodyRadius(a.id)+bodyRadius(b.id)+.099,`${journey} ${area}: ${a.id}/${b.id} gap ${gap}`)}}
  const routes=Object.values(s.herdRoutes);seenQueue ||= routes.some(r=>!r.walking)&&routes.some(r=>r.walking);advanceHerd(s,.04)
 }assert.equal(Object.keys(s.herdRoutes).length,0);assert.ok(seenQueue)}
 assert.ok(bodyRadius('mimosa')>bodyRadius('nuvem'));assert.ok(bodyRadius('nuvem')>bodyRadius('pipoca'));
});
test('return paths finish at every exact original stall and retain property identities',()=>{
 const s=fresh();ringHerd(s,'farm');tick(s);ringHerd(s,'farm');tick(s);
 const expected={mimosa:[-4.85,-3.08],estrela:[-4.85,.07],amora:[4.9,-3.1],nuvem:[4.37,.02],algodao:[5.65,.72],pipoca:[-4.6,3.4],pacoca:[-3.45,2.8],canela:[4,3.15]};
 for(const a of ANIMALS){const p=herdPose(s,a.id,'barn');assert.equal(p.visible,true);assert.deepEqual([p.x,p.z],expected[a.id]);assert.deepEqual([p.x,p.z,p.angle],[ANIMAL_STALLS[a.id].x,ANIMAL_STALLS[a.id].z,ANIMAL_STALLS[a.id].angle]);assert.equal(herdPose(s,a.id,'farm').visible,false)}
});
test('wander explores broad walkable farm space while avoiding obstacles, player and animals',()=>{
 const s=fresh();for(const a of ANIMALS)s.animalLocations[a.id]='farm';const obstacle={x:0,z:0,w:5,d:7},player={x:-4,z:4,r:.4},seen=new Map();
 const walkable=(x,z,r)=>x-r>=-10&&x+r<=14&&z-r>=-13&&z+r<=13&&!(Math.abs(x-obstacle.x)<obstacle.w/2+r&&Math.abs(z-obstacle.z)<obstacle.d/2+r)&&Math.hypot(x-player.x,z-player.z)>=r+player.r;
 for(let frame=0;frame<3600;frame++){updateAnimalWander(s,.1,'farm',walkable);const poses=ANIMALS.map(a=>({id:a.id,...herdPose(s,a.id,'farm')}));for(let i=0;i<poses.length;i++){const a=poses[i];assert.ok(walkable(a.x,a.z,bodyRadius(a.id)),`${a.id} in blocked space`);const list=seen.get(a.id)||[];list.push([a.x,a.z]);seen.set(a.id,list);for(let j=0;j<i;j++){const b=poses[j];assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=bodyRadius(a.id)+bodyRadius(b.id)+.099)}}}
 const all=[...seen.values()].flat(),xs=all.map(p=>p[0]),zs=all.map(p=>p[1]);assert.ok(Math.max(...xs)-Math.min(...xs)>15);assert.ok(Math.max(...zs)-Math.min(...zs)>15);
 const saved=JSON.parse(JSON.stringify(s));migrateTransport(saved);for(const a of ANIMALS){assert.equal(saved.animalWander[a.id].x,s.animalWander[a.id].x);assert.equal(saved.animalLocations[a.id],'farm')}
 const before=Object.fromEntries(ANIMALS.map(a=>[a.id,[s.animalWander[a.id].x,s.animalWander[a.id].z]]));ringHerd(s,'farm');for(const a of ANIMALS){const p=herdPose(s,a.id,'farm');assert.deepEqual([p.x,p.z],before[a.id])}
});