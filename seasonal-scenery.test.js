import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './three.module.js';
import {createSeasonalScenery} from './seasonal-scenery.js';
import {SEASON_LOOKS,normalizeSeason,getSeasonLook} from './seasonal-palette.js';

const material=kind=>{const m=new T.MeshStandardMaterial({color:'#91aa70'});m.userData.seasonSurface=kind;return m};
const mesh=m=>new T.Mesh(new T.BoxGeometry(),m);
function compile(m){
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 m.onBeforeCompile(shader,{});return shader;
}

test('each season has a distinct shared palette and valid seasons normalize consistently',()=>{
 assert.equal(SEASON_LOOKS.length,4);
 for(let i=0;i<4;i++){assert.equal(normalizeSeason(i),i);assert.equal(getSeasonLook(i),SEASON_LOOKS[i])}
 assert.equal(normalizeSeason(undefined),0);assert.equal(normalizeSeason(NaN),0);
 assert.notDeepEqual(getSeasonLook(0),getSeasonLook(2));assert.notDeepEqual(getSeasonLook(1),getSeasonLook(3));
});

test('outdoor binding clones cached materials once and leaves other scene roots intact',()=>{
 const root=new T.Group(),otherRoot=new T.Group(),source=material('leaf'),a=mesh(source),b=mesh(source),actor=mesh(source);
 root.add(a,b);otherRoot.add(actor);
 const scenery=createSeasonalScenery({season:2});scenery.bind(root);
 assert.notEqual(a.material,source);assert.equal(a.material,b.material);assert.equal(actor.material,source);
 assert.equal(source.color.getHexString(),'91aa70');assert.equal(source.userData.seasonSurface,'leaf');
 const first=a.material,counts=scenery.inspect();scenery.bind(root);
 assert.equal(a.material,first);assert.equal(scenery.inspect().materials,counts.materials);
 assert.equal(scenery.inspect().roots,1);
 scenery.release(root);assert.equal(a.material,source);assert.equal(b.material,source);assert.equal(scenery.inspect().roots,0);
 scenery.dispose();
});

test('roof and ground shaders preserve prior material callbacks and snow follows seasons',()=>{
 const root=new T.Group(),roof=material('roof'),ground=material('ground');let callbacks=0;
 roof.onBeforeCompile=shader=>{callbacks++;shader.fragmentShader='// original-roof-callback\n'+shader.fragmentShader};
 const a=mesh(roof),b=mesh(ground);root.add(a,b);
 const scenery=createSeasonalScenery({season:0});scenery.bind(root);
 const roofShader=compile(a.material),groundShader=compile(b.material);
 assert.equal(callbacks,1);assert.match(roofShader.fragmentShader,/original-roof-callback/);
 for(const shader of[roofShader,groundShader]){
  assert.ok(shader.uniforms.seasonSnow);assert.ok(shader.uniforms.seasonEnabled);
  assert.match(shader.fragmentShader,/seasonSnow/);assert.match(shader.vertexShader,/season/);
  assert.equal(shader.uniforms.seasonSnow.value,0);
 }
 const roofVersion=a.material.version,groundVersion=b.material.version;
 scenery.setSeason(3);assert.ok(roofShader.uniforms.seasonSnow.value>0);assert.ok(groundShader.uniforms.seasonSnow.value>0);
 scenery.setSeason(1);assert.equal(roofShader.uniforms.seasonSnow.value,0);
 scenery.setSeason(2);assert.equal(groundShader.uniforms.seasonSnow.value,0);
 scenery.setSeason(0);assert.equal(roofShader.uniforms.seasonSnow.value,0);assert.equal(groundShader.uniforms.seasonSnow.value,0);
 assert.equal(a.material.version,roofVersion);assert.equal(b.material.version,groundVersion);
 assert.equal(roof.onBeforeCompile.toString().includes('original-roof-callback'),true);
 scenery.dispose();
});

test('foliage autumn color and winter snow can be disabled inside without leaking into actors',()=>{
 const sceneryRoot=new T.Group(),actorRoot=new T.Group(),interiorRoot=new T.Group(),leaf=material('leaf'),ground=material('ground');
 const tree=mesh(leaf),actor=mesh(leaf),interior=mesh(ground);sceneryRoot.add(tree);actorRoot.add(actor);interiorRoot.add(interior);
 const scenery=createSeasonalScenery({season:2});scenery.bind(sceneryRoot);
 const shader=compile(tree.material);assert.ok(shader.uniforms.seasonFoliageMix.value>0);
 scenery.setSeason(3);assert.ok(shader.uniforms.seasonSnow.value>0);
 scenery.setIndoors(true);assert.equal(shader.uniforms.seasonEnabled.value,0);
 scenery.setIndoors(false);assert.equal(shader.uniforms.seasonEnabled.value,1);
 scenery.setSeason(0);assert.equal(shader.uniforms.seasonSnow.value,0);
 assert.equal(actor.material,leaf);assert.equal(interior.material,ground);
 scenery.dispose();
});

test('release and disposal restore all material slots and retain shared textures',()=>{
 const root=new T.Group(),texture=new T.Texture(),source=material('stone'),second=material('wood');source.map=source.bumpMap=texture;
 const a=mesh(source),b=mesh([source,second]);root.add(a,b);let sourceDisposals=0,textureDisposals=0,cloneDisposals=0;
 source.addEventListener('dispose',()=>sourceDisposals++);texture.addEventListener('dispose',()=>textureDisposals++);
 const scenery=createSeasonalScenery({season:3});scenery.bind(root);
 const clone=a.material;clone.addEventListener('dispose',()=>cloneDisposals++);
 assert.equal(clone.map,texture);assert.equal(clone.bumpMap,texture);
 scenery.release(root);assert.equal(a.material,source);assert.deepEqual(b.material,[source,second]);assert.equal(cloneDisposals,1);
 scenery.bind(root);scenery.dispose();assert.equal(a.material,source);assert.deepEqual(b.material,[source,second]);
 assert.equal(sourceDisposals,0);assert.equal(textureDisposals,0);assert.equal(scenery.inspect().roots,0);
});

test('binding filters and excluded surfaces preserve actor, water and fabric materials',()=>{
 const root=new T.Group(),source=material('stone'),actor=mesh(source),wall=mesh(source),fabric=material('fabric'),water=material('water');
 water.transparent=true;water.opacity=.65;const awning=mesh(fabric),lake=mesh(water);actor.userData.actor=true;root.add(actor,wall,awning,lake);
 const scenery=createSeasonalScenery({season:3});scenery.bind(root,{filter:o=>!o.userData.actor});
 assert.equal(actor.material,source);assert.notEqual(wall.material,source);assert.equal(awning.material,fabric);assert.equal(lake.material,water);
 scenery.dispose();assert.equal(wall.material,source);
});
test('shared artisan, region and farm materials identify their seasonal surfaces',async()=>{
 const noop=()=>{},context=new Proxy({},{get:(object,key)=>object[key]??noop}),previous=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
 try{
  const [{artisanMaterial,treeCrown},{createKit},{farmGround,countryTrack,farmMeadow}]=await Promise.all([import('./art-direction.js'),import('./region-kit.js'),import('./farm-landscape.js')]);
  for(const[kind,surface]of[['clay','roof'],['leaf','leaf'],['moss','grass'],['wood','wood'],['siding','wood'],['bark','wood'],['stone','stone'],['cottageStone','stone'],['fabric','fabric']])assert.equal(artisanMaterial('#aabbcc',kind).userData.seasonSurface,surface,kind);
  const crown=treeCrown(7);let leafCount=0;crown.traverse(o=>{if(o.isMesh&&o.material.userData.seasonSurface==='leaf')leafCount++});assert.ok(leafCount>0);
  const k=createKit(),ground=k.floor('#aabbcc',5,5,0,0,0,'moss'),sand=k.floor('#ccbbaa',4,4,8,0,0,'sand'),path=k.path(0,0,1,3);
  assert.equal(ground.material.userData.seasonSurface,'ground');assert.equal(sand.material.userData.seasonSurface,'sand');assert.equal(path.material.userData.seasonSurface,'path');
  const tree=k.tree(1,2,1.25);assert.equal(tree.userData.seasonTree,true);assert.equal(k.treePositions.length,1);assert.equal(k.treePositions[0].scale,1.25);assert.equal(k.root.userData.treePositions,k.treePositions);
  assert.equal(farmGround(k,4,4).material.userData.seasonSurface,'ground');assert.equal(countryTrack(k,0,0,1,3).material.userData.seasonSurface,'path');
  assert.equal(farmMeadow(k,{width:2,depth:2,count:3}).material.userData.seasonSurface,'grass');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous}
});