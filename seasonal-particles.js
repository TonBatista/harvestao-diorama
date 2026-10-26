import * as T from './three.module.js';

export const SEASONAL_PARTICLE_LIMITS = Object.freeze({leaves:116, snow:320, groundLeaves:960});
const TAU = Math.PI * 2;
const fract = n => n - Math.floor(n);
const random = (i, salt = 0) => fract(Math.sin(i * 127.1 + salt * 311.7 + 29.53) * 43758.5453);
const wrap = (n, span) => ((n % span) + span) % span;
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
const normalizeSeason = value => Number.isInteger(value) && value >= 0 && value < 4 ? value : 0;

/** Deterministic, allocation-free when a target is supplied. Bounds are [minX,maxX,minZ,maxZ]. */
export function sampleSeasonalParticle(index, time, options = {}, target = {}) {
 if (options.indoors) return null;
 const season = normalizeSeason(options.season), player = options.center || options.player;
 const cx = finite(player?.x, 0), cz = finite(player?.z, 0), bounds = options.bounds;
 let minX = cx - 14, maxX = cx + 14, minZ = cz - 14, maxZ = cz + 14;
 if (bounds?.length >= 4 && bounds.every(Number.isFinite)) {
  minX = Math.max(minX, bounds[0] + .12); maxX = Math.min(maxX, bounds[1] - .12);
  minZ = Math.max(minZ, bounds[2] + .12); maxZ = Math.min(maxZ, bounds[3] - .12);
  if (maxX <= minX) {minX = bounds[0]; maxX = Math.max(minX + .01, bounds[1]);}
  if (maxZ <= minZ) {minZ = bounds[2]; maxZ = Math.max(minZ + .01, bounds[3]);}
 }
 const width = Math.max(.01, maxX - minX), depth = Math.max(.01, maxZ - minZ);
 const i = finite(index, 0), t = finite(time, 0), phase = random(i, 1), drift = random(i, 2);
 const height = season === 3 ? 10.8 : season === 2 ? 8.8 : season === 0 ? 6.8 : 3.4;
 const fall = season === 3 ? .7 + random(i, 3) * .55 : season === 2 ? .45 + random(i, 3) * .65 : .24 + random(i, 3) * .25;
 const wind = season === 3 ? .28 : season === 2 ? .4 : .15;
 target.x = minX + wrap(phase * 28 + t * wind + Math.sin(t * .61 + drift * TAU) * .72 - minX, width);
 target.z = minZ + wrap(drift * 28 + t * .08 + Math.sin(t * .47 + phase * TAU) * .53 - minZ, depth);
 target.y = season === 1 ? .25 + wrap(phase * height + t * .055, height) : .16 + height - wrap(phase * height + t * fall, height);
 target.rotation = t * (.65 + drift) + phase * TAU;
 target.tilt = Math.sin(t * 1.7 + drift * TAU) * .65;
 return target;
}

function leafGeometry() {
 const shape = new T.Shape();
 const outline = [[-.025,-.52],[.07,-.25],[.28,-.3],[.25,-.08],[.48,.12],[.25,.15],[.32,.37],[.1,.31],[0,.58],[-.1,.31],[-.32,.37],[-.25,.15],[-.48,.12],[-.25,-.08],[-.28,-.3],[-.07,-.25]];
 shape.moveTo(...outline[0]);
 for (let i = 1; i < outline.length; i++) shape.lineTo(...outline[i]);
 shape.closePath();
 return new T.ShapeGeometry(shape);
}

/** Two visible draw calls at most; buffers and geometries are reused across seasons. */
export function createSeasonalParticles(scene, {coarse = false} = {}) {
 const root = new T.Group(); root.name = 'seasonal-weather'; root.visible = false;
 const geometry = leafGeometry();
 const leafMaterial = new T.MeshBasicMaterial({color:0xffffff, side:T.DoubleSide, toneMapped:false});
 const groundMaterial = new T.MeshBasicMaterial({color:0xffffff, side:T.DoubleSide, toneMapped:false});
 const leafCount = coarse ? 82 : SEASONAL_PARTICLE_LIMITS.leaves;
 const snowCount = coarse ? 190 : SEASONAL_PARTICLE_LIMITS.snow;
 const groundCount = coarse ? 480 : SEASONAL_PARTICLE_LIMITS.groundLeaves;
 const leaves = new T.InstancedMesh(geometry, leafMaterial, leafCount);
 leaves.name = 'falling-leaves-and-petals'; leaves.frustumCulled = false;
 leaves.instanceMatrix.setUsage(T.DynamicDrawUsage); leaves.visible = false;
 const ground = new T.InstancedMesh(geometry, groundMaterial, groundCount);
 ground.name = 'fallen-autumn-leaves'; ground.frustumCulled = false; ground.visible = false; ground.count = 0;
 const pointGeometry = new T.BufferGeometry();
 const positions = new Float32Array(snowCount * 3), sizes = new Float32Array(snowCount);
 for (let i = 0; i < snowCount; i++) sizes[i] = 2 + random(i, 9) * 2.2;
 const pointPosition = new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage);
 pointGeometry.setAttribute('position', pointPosition);
 pointGeometry.setAttribute('particleSize', new T.BufferAttribute(sizes, 1));
 const pointMaterial = new T.ShaderMaterial({
  uniforms:{particleColor:{value:new T.Color('#ffffff')},opacity:{value:.85},sizeScale:{value:Math.min(2, finite(globalThis.devicePixelRatio, 1))}},
  vertexShader:'attribute float particleSize; uniform float sizeScale; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_PointSize = particleSize * sizeScale; }',
  fragmentShader:'uniform vec3 particleColor; uniform float opacity; void main(){ float radius=length(gl_PointCoord-vec2(0.5)); float edge=1.0-smoothstep(0.28,0.5,radius); if(edge<0.02) discard; gl_FragColor=vec4(particleColor,opacity*edge); }',
  transparent:true, depthWrite:false, toneMapped:false
 });
 const flakes = new T.Points(pointGeometry, pointMaterial); flakes.name = 'snowflakes-and-pollen'; flakes.frustumCulled = false; flakes.visible = false;
 root.add(leaves, ground, flakes); scene.add(root);
 const dummy = new T.Object3D(), color = new T.Color(), sample = {};
 const center = {x:0,z:0}, sampling = {season:0,center,bounds:null};
 const autumnColors = ['#cf6c25','#e79432','#b44920','#e6ac48','#a64e24'];
 const springColors = ['#f5d5c8','#f5e4cb','#eec1b9','#fae5dc'];
 let elapsed = 0, currentSeason = -1, disposed = false, areaBounds = null, areaTrees = null;

 function setLeafColors(season) {
  const palette = season === 0 ? springColors : autumnColors;
  for (let i = 0; i < leafCount; i++) {color.set(palette[Math.floor(random(i, 10) * palette.length)]); leaves.setColorAt(i, color);}
  leaves.instanceColor.needsUpdate = true;
 }
 function buildCarpet() {
  if (!areaBounds) {ground.count = 0; return;}
  const b = areaBounds, width = b[1] - b[0], depth = b[3] - b[2];
  const validTrees = Array.isArray(areaTrees) ? areaTrees.filter(p => Number.isFinite(Array.isArray(p) ? p[0] : p?.x) && Number.isFinite(Array.isArray(p) ? p[1] : p?.z)) : [];
  let count = 0;
  for (let i = 0; i < groundCount; i++) {
   const a = random(i, 15) * TAU, radius = .28 + Math.sqrt(random(i, 16)) * 1.8;
   let x, z;
   if (validTrees.length) {
    const tree = validTrees[i % validTrees.length];
    x = (Array.isArray(tree) ? tree[0] : tree.x) + Math.cos(a) * radius;
    z = (Array.isArray(tree) ? tree[1] : tree.z) + Math.sin(a) * radius;
   } else {
    // A sparse border carpet remains useful for older area metadata without tree positions.
    const edge = i % 4, along = random(i, 17), inset = .25 + random(i, 18) * 2;
    x = edge < 2 ? b[0] + along * width : edge === 2 ? b[0] + inset : b[1] - inset;
    z = edge >= 2 ? b[2] + along * depth : edge === 0 ? b[2] + inset : b[3] - inset;
   }
   if (x < b[0] + .1 || x > b[1] - .1 || z < b[2] + .1 || z > b[3] - .1) continue;
   const size = .13 + random(i, 19) * .16;
   dummy.position.set(x, .032 + random(i, 20) * .009, z);
   dummy.rotation.set(-Math.PI / 2, 0, a); dummy.scale.set(size, size * (.7 + random(i, 21) * .4), size);
   dummy.updateMatrix(); ground.setMatrixAt(count, dummy.matrix);
   color.set(autumnColors[Math.floor(random(i, 22) * autumnColors.length)]); ground.setColorAt(count, color); count++;
  }
  ground.count = count; ground.instanceMatrix.needsUpdate = true;
  if (ground.instanceColor) ground.instanceColor.needsUpdate = true;
 }
 function setArea({bounds = null, treePositions = null, trees = treePositions} = {}) {
  if (disposed) return;
  areaTrees = trees;
  areaBounds = bounds?.length >= 4 && bounds.every(Number.isFinite) && bounds[1] > bounds[0] && bounds[3] > bounds[2] ? Array.from(bounds) : null;
  sampling.bounds = areaBounds; buildCarpet();
 }
 function boundsChanged(bounds) {

  if (!bounds && !areaBounds) return false;
  return !bounds || !areaBounds || bounds.length !== 4 || bounds.some((n,i) => n !== areaBounds[i]);
 }
 function update(dt, {season = 0, indoors = false, player, bounds, treePositions, trees = treePositions} = {}) {
  if (disposed) return;
  root.visible = !indoors;
  if (indoors) return; // No simulation, instance uploads, or buffer updates in buildings.
  season = normalizeSeason(season);
  if ((bounds !== undefined && boundsChanged(bounds)) || (trees !== undefined && trees !== areaTrees)) setArea({bounds:bounds || areaBounds,trees:trees === undefined ? areaTrees : trees});
  elapsed += Math.max(0, Math.min(.1, finite(dt, 0)));
  center.x = finite(player?.x, center.x); center.z = finite(player?.z, center.z); sampling.season = season;
  if (season !== currentSeason) {
   currentSeason = season;
   leaves.visible = season === 0 || season === 2; ground.visible = season === 2 && ground.count > 0;
   flakes.visible = season === 1 || season === 3;
   leaves.count = season === 0 ? (coarse ? 22 : 34) : leafCount;
   pointGeometry.setDrawRange(0, season === 1 ? (coarse ? 18 : 30) : snowCount);
   if (leaves.visible) setLeafColors(season);
   pointMaterial.uniforms.particleColor.value.set(season === 3 ? '#ffffff' : '#f5e9b1');
   pointMaterial.uniforms.opacity.value = season === 3 ? .88 : .42;
  }
  ground.visible = season === 2 && ground.count > 0;
  if (leaves.visible) {
   for (let i = 0; i < leaves.count; i++) {
    sampleSeasonalParticle(i, elapsed, sampling, sample);
    const size = season === 0 ? .08 + random(i, 6) * .08 : .17 + random(i, 6) * .16;
    dummy.position.set(sample.x,sample.y,sample.z);
    dummy.rotation.set(sample.tilt + .55, sample.rotation * .55, sample.rotation);
    dummy.scale.set(size, size * (.8 + random(i, 7) * .5), size); dummy.updateMatrix(); leaves.setMatrixAt(i,dummy.matrix);
   }
   leaves.instanceMatrix.needsUpdate = true;
  }
  if (flakes.visible) {
   const count = pointGeometry.drawRange.count;
   for (let i = 0; i < count; i++) {
    sampleSeasonalParticle(i,elapsed,sampling,sample);
    const offset = i * 3; positions[offset] = sample.x; positions[offset+1] = sample.y; positions[offset+2] = sample.z;
   }
   pointPosition.needsUpdate = true;
  }
 }
 function dispose() {
  if (disposed) return; disposed = true; scene.remove(root);
  leaves.dispose(); ground.dispose(); geometry.dispose(); leafMaterial.dispose(); groundMaterial.dispose(); pointGeometry.dispose(); pointMaterial.dispose(); root.clear();
 }
 return {update,setArea,dispose,root};
}
