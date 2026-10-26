import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './three.module.js';
import {createSeasonalParticles,sampleSeasonalParticle,SEASONAL_PARTICLE_LIMITS} from './seasonal-particles.js';

test('seasonal particle paths are deterministic and stay inside the outdoor area',()=>{
 const options={season:2,player:{x:3,z:-4},bounds:[-10,14,-13,13]};
 assert.deepEqual(sampleSeasonalParticle(7,18,options),sampleSeasonalParticle(7,18,options));
 const target={};
 for(let season=0;season<4;season++)for(let i=0;i<320;i+=3)for(const time of [0,.1,10,100,1e5]){
  options.season=season;
  assert.equal(sampleSeasonalParticle(i,time,options,target),target);
  assert.ok(target.x>=-10&&target.x<=14);assert.ok(target.z>=-13&&target.z<=13);
  assert.ok(target.y>=.15&&target.y<=11);assert.ok(Number.isFinite(target.rotation));
 }
 assert.equal(sampleSeasonalParticle(1,3,{indoors:true}),null);
});

test('seasonal renderer uses fixed buffers and stops every upload indoors',()=>{
 const scene=new T.Scene(),weather=createSeasonalParticles(scene);
 const options={season:2,indoors:false,player:{x:0,z:0},bounds:[-10,14,-13,13],trees:[{x:-7,z:5},{x:10,z:8}]};
 weather.update(1/60,options);
 const [leaves,ground,flakes]=weather.root.children;
 assert.equal(leaves.count,SEASONAL_PARTICLE_LIMITS.leaves);assert.ok(ground.count>0);
 assert.equal(leaves.visible,true);assert.equal(ground.visible,true);assert.equal(flakes.visible,false);
 assert.equal(leaves.frustumCulled,false);assert.equal(flakes.frustumCulled,false);
 const matrices=leaves.instanceMatrix.array,positions=flakes.geometry.attributes.position.array;
 const versions=[leaves.instanceMatrix.version,ground.instanceMatrix.version,flakes.geometry.attributes.position.version];
 weather.update(1/60,{...options,indoors:true,season:3});
 assert.equal(weather.root.visible,false);
 assert.deepEqual([leaves.instanceMatrix.version,ground.instanceMatrix.version,flakes.geometry.attributes.position.version],versions);
 weather.update(1/60,{...options,season:3});
 assert.equal(weather.root.visible,true);assert.equal(leaves.visible,false);assert.equal(ground.visible,false);assert.equal(flakes.visible,true);
 assert.equal(flakes.geometry.drawRange.count,SEASONAL_PARTICLE_LIMITS.snow);
 assert.equal(flakes.material.uniforms.particleColor.value.getHex(),0xffffff);
 assert.equal(leaves.instanceMatrix.array,matrices);assert.equal(flakes.geometry.attributes.position.array,positions);
 for(const value of positions)assert.ok(Number.isFinite(value));
 weather.dispose();weather.dispose();assert.equal(scene.children.length,0);assert.doesNotThrow(()=>weather.update(1/60,options));
});

test('coarse devices reduce particle counts and static carpet uploads only on area change',()=>{
 const scene=new T.Scene(),weather=createSeasonalParticles(scene,{coarse:true});
 const bounds=[-8,8,-8,8],trees=[[0,0],[3,4]];
 weather.setArea({bounds,treePositions:trees});
 weather.update(1/60,{season:2,player:{x:0,z:0},bounds,trees});
 const [leaves,ground,flakes]=weather.root.children,version=ground.instanceMatrix.version;
 assert.ok(leaves.count>=80&&leaves.count<SEASONAL_PARTICLE_LIMITS.leaves);
 assert.ok(ground.count<=480&&ground.count>0);
 for(let i=0;i<60;i++)weather.update(1/60,{season:2,player:{x:1,z:1},bounds,trees});
 assert.equal(ground.instanceMatrix.version,version);
 weather.update(1/60,{season:2,player:{x:2,z:2}});assert.equal(ground.instanceMatrix.version,version);
 weather.update(1/60,{season:3,player:{x:0,z:0},bounds,trees});assert.equal(flakes.geometry.drawRange.count,190);
 weather.update(1/60,{season:0,player:{x:0,z:0},bounds,trees});assert.equal(leaves.count,22);assert.equal(flakes.visible,false);
 weather.dispose();
});
