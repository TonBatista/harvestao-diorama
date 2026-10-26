import * as T from './three.module.js';
import {getSeasonLook, normalizeSeason} from './seasonal-palette.js';

const SURFACES = new Set(['ground','grass','leaf','pine','path','soil','roof','stone','wood','sand','water','exclude']);
const ALIASES = {moss:'ground', earth:'ground', tilled:'soil', bark:'wood', siding:'wood', clay:'roof', foliage:'leaf', evergreen:'pine', rock:'stone', fence:'wood', fabric:'exclude'};
const PROFILES = {
  ground: [.04, -.08, .50, .99], grass: [1, -.08, .50, .99],
  leaf: [.23, -.10, .65, .98], pine: [.16, -.08, .68, .99],
  path: [.02, -.05, .50, .99], soil: [.02, -.05, .50, .99],
  sand: [.02, -.05, .50, .99], roof: [.015, -.05, .56, .99],
  stone: [.015, .05, .65, .98], wood: [.045, .16, .70, .98],
};

function tagKind(tag) {
  if (tag === false) return 'exclude';
  if (typeof tag === 'string') return ALIASES[tag] || (SURFACES.has(tag) ? tag : null);
  if (tag && typeof tag === 'object') {
    if (tag.exclude || tag.water) return tag.water ? 'water' : 'exclude';
    if (tag.kind || tag.type) return tagKind(tag.kind || tag.type);
    for (const key of Object.keys(tag)) if (tag[key] && (SURFACES.has(key) || ALIASES[key])) return tagKind(key);
  }
  return null;
}

function surfaceKind(material, object) {
  const explicit = tagKind(object.userData?.seasonSurface) || tagKind(material.userData?.seasonSurface);
  if (explicit) return explicit;
  const name = material.name.toLowerCase();
  if (/water|glass|window|emissive/.test(name)) return 'exclude';
  if (/pine|evergreen/.test(name)) return 'pine';
  if (/leaf|foliage/.test(name)) return 'leaf';
  if (/grass/.test(name)) return 'grass';
  // Older baked scenery has only a tint; green is a conservative foliage fallback.
  if (material.color) {
    const hsl = material.color.getHSL({});
    if (hsl.h >= .16 && hsl.h <= .46 && hsl.s > .12 && hsl.l > .035 && hsl.l < .92) return 'leaf';
  }
  return 'stone';
}

const vertexDeclarations = `
varying vec3 vSeasonWorldNormal;
varying vec3 vSeasonWorldPosition;
`;

const vertexSurface = `
#include <begin_vertex>
// Apply the same inverse-scale correction as Three's defaultnormal_vertex.
// This also covers non-uniformly scaled grass/tree instances.
vec3 seasonObjectNormal = normal;
#ifdef USE_BATCHING
  mat3 seasonBatchNormal = mat3( batchingMatrix );
  seasonObjectNormal /= vec3( dot( seasonBatchNormal[0], seasonBatchNormal[0] ), dot( seasonBatchNormal[1], seasonBatchNormal[1] ), dot( seasonBatchNormal[2], seasonBatchNormal[2] ) );
  seasonObjectNormal = seasonBatchNormal * seasonObjectNormal;
#endif
#ifdef USE_INSTANCING
  mat3 seasonInstanceNormal = mat3( instanceMatrix );
  seasonObjectNormal /= vec3( dot( seasonInstanceNormal[0], seasonInstanceNormal[0] ), dot( seasonInstanceNormal[1], seasonInstanceNormal[1] ), dot( seasonInstanceNormal[2], seasonInstanceNormal[2] ) );
  seasonObjectNormal = seasonInstanceNormal * seasonObjectNormal;
#endif
vSeasonWorldNormal = inverseTransformDirection( normalize( normalMatrix * seasonObjectNormal ), viewMatrix );
vec4 seasonWorldPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  seasonWorldPosition = batchingMatrix * seasonWorldPosition;
#endif
#ifdef USE_INSTANCING
  seasonWorldPosition = instanceMatrix * seasonWorldPosition;
#endif
vSeasonWorldPosition = ( modelMatrix * seasonWorldPosition ).xyz;
`;

const fragmentDeclarations = `
varying vec3 vSeasonWorldNormal;
varying vec3 vSeasonWorldPosition;
uniform float seasonEnabled;
uniform float seasonSnow;
uniform float seasonFoliageMix;
uniform float seasonVariation;
uniform vec3 seasonTintA;
uniform vec3 seasonTintB;
uniform vec3 seasonTintC;
uniform vec3 seasonSnowColor;
uniform float seasonSnowBase;
uniform float seasonSnowStrength;
uniform vec2 seasonSnowThreshold;
`;

const fragmentSurface = `
#include <color_fragment>
if ( seasonEnabled > .5 ) {
  float seasonLuminance = clamp( dot( diffuseColor.rgb, vec3( .2126, .7152, .0722 ) ), 0.0, 1.0 );
  if ( seasonFoliageMix > .001 ) {
    float seasonPatch = fract( sin( dot( floor( vSeasonWorldPosition.xz * .16 ), vec2( 12.9898, 78.233 ) ) ) * 43758.5453 + seasonVariation );
    vec3 seasonPlantColor = seasonPatch < .5 ? mix( seasonTintA, seasonTintB, seasonPatch * 2.0 ) : mix( seasonTintB, seasonTintC, ( seasonPatch - .5 ) * 2.0 );
    // Retain the atlas's grain, replacing its green/brown pigment with the palette.
    seasonPlantColor *= .72 + seasonLuminance * .56;
    diffuseColor.rgb = mix( diffuseColor.rgb, seasonPlantColor, seasonFoliageMix );
  }
  if ( seasonSnow > .001 ) {
    float seasonUp = normalize( vSeasonWorldNormal ).y;
    float seasonCoverage = mix( seasonSnowBase, 1.0, smoothstep( seasonSnowThreshold.x, seasonSnowThreshold.y, seasonUp ) );
    seasonCoverage *= seasonSnow * seasonSnowStrength;
    vec3 seasonSnowDetail = seasonSnowColor * ( .97 + seasonLuminance * .03 );
    diffuseColor.rgb = mix( diffuseColor.rgb, seasonSnowDetail, clamp( seasonCoverage, 0.0, 1.0 ) );
  }
}
`;

function supported(material) {
  return material?.isMaterial && !material.isShaderMaterial && (
    material.isMeshStandardMaterial || material.isMeshLambertMaterial || material.isMeshPhongMaterial ||
    material.isMeshToonMaterial || material.isMeshBasicMaterial || material.isMeshMatcapMaterial
  );
}

/** Decorates only roots explicitly bound by the world, without geometry or render passes. */
export function createSeasonalScenery({season = 0, indoors = false} = {}) {
  let currentSeason = normalizeSeason(season), inside = Boolean(indoors);
  const roots = new Map(), owners = new WeakMap();

  function updateMaterial(entry) {
    const look = getSeasonLook(currentSeason), {kind, uniforms} = entry;
    const vegetation = kind === 'leaf' || kind === 'pine';
    const ground = kind === 'ground' || kind === 'grass';
    const colors = kind === 'pine' ? look.pine : vegetation ? look.foliage : look.ground;
    uniforms.seasonTintA.value.set(colors[0]);
    uniforms.seasonTintB.value.set(colors[1]);
    uniforms.seasonTintC.value.set(colors[2]);
    uniforms.seasonSnowColor.value.set(look.snowColor);
    uniforms.seasonSnow.value = look.snow;
    uniforms.seasonEnabled.value = inside ? 0 : 1;
    uniforms.seasonFoliageMix.value = kind === 'pine' ? .55 : vegetation ? .94 : ground ? (currentSeason === 2 ? .68 : .48) : 0;
  }

  function decorate(source, kind) {
    const material = source.clone(), profile = PROFILES[kind] || PROFILES.stone;
    const uniforms = {
      seasonEnabled: {value: 1}, seasonSnow: {value: 0}, seasonFoliageMix: {value: 0},
      seasonVariation: {value: ((source.color?.getHex() || 0) % 997) / 997},
      seasonTintA: {value: new T.Color()}, seasonTintB: {value: new T.Color()}, seasonTintC: {value: new T.Color()},
      seasonSnowColor: {value: new T.Color()}, seasonSnowBase: {value: profile[0]},
      seasonSnowStrength: {value: profile[3]}, seasonSnowThreshold: {value: new T.Vector2(profile[1], profile[2])},
    };
    const priorCompile = source.onBeforeCompile;
    const priorKey = source.customProgramCacheKey?.call(source) || '';
    material.onBeforeCompile = function(shader, renderer) {
      priorCompile?.call(this, shader, renderer);
      if (!shader.vertexShader.includes('#include <begin_vertex>') || !shader.fragmentShader.includes('#include <color_fragment>')) return;
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = vertexDeclarations + shader.vertexShader.replace('#include <begin_vertex>', vertexSurface);
      shader.fragmentShader = fragmentDeclarations + shader.fragmentShader.replace('#include <color_fragment>', fragmentSurface);
    };
    material.customProgramCacheKey = () => `${priorKey}|seasonal-scenery-v1`;
    material.userData.seasonalScenery = {kind};
    const entry = {source, material, kind, uniforms};
    updateMaterial(entry);
    return entry;
  }

  function bind(root, options = {}) {
    if (!root?.traverse) return root;
    const filter = typeof options === 'function' ? options : options.filter;
    let record = roots.get(root);
    if (!record) { record = {bindings: [], materials: new Map()}; roots.set(root, record); }
    function visit(object) {
      const tag = tagKind(object.userData?.seasonSurface);
      if (tag === 'exclude' || tag === 'water' || object.userData?.seasonalExclude) return;
      if (object.isMesh && !object.isSkinnedMesh && !owners.has(object) && (!filter || filter(object))) {
        const original = object.material, sources = Array.isArray(original) ? original : [original];
        let changed = false;
        const replacements = sources.map(source => {
          if (!supported(source)) return source;
          const kind = surfaceKind(source, object);
          if (kind === 'exclude' || kind === 'water' || (source.transparent && kind !== 'soil')) return source;
          const key = `${source.uuid}:${kind}`;
          let entry = record.materials.get(key);
          if (!entry) { entry = decorate(source, kind); record.materials.set(key, entry); }
          changed = true;
          return entry.material;
        });
        if (changed) {
          const replacement = Array.isArray(original) ? replacements : replacements[0];
          object.material = replacement;
          record.bindings.push({object, original, replacement});
          owners.set(object, root);
        }
      }
      for (const child of object.children || []) visit(child);
    }
    visit(root);
    return root;
  }

  function setSeason(value) {
    const next = normalizeSeason(value);
    if (next === currentSeason) return false;
    currentSeason = next;
    for (const record of roots.values()) for (const entry of record.materials.values()) updateMaterial(entry);
    return true;
  }

  function setIndoors(value) {
    const next = Boolean(value);
    if (next === inside) return false;
    inside = next;
    for (const record of roots.values()) for (const entry of record.materials.values()) entry.uniforms.seasonEnabled.value = inside ? 0 : 1;
    return true;
  }

  // Restore the region's own material references before its normal disposal path.
  function release(root) {
    const record = roots.get(root);
    if (!record) return false;
    for (const {object, original, replacement} of record.bindings) {
      if (object.material === replacement) object.material = original;
      owners.delete(object);
    }
    for (const entry of record.materials.values()) entry.material.dispose();
    record.bindings.length = 0;
    record.materials.clear();
    roots.delete(root);
    return true;
  }

  function inspect() {
    let materials = 0, meshes = 0;
    for (const record of roots.values()) { materials += record.materials.size; meshes += record.bindings.length; }
    return {season:currentSeason, indoors:inside, roots:roots.size, materials, meshes, bindings:meshes};
  }

  function dispose() { for (const root of [...roots.keys()]) release(root); }
  return {bind, setSeason, setIndoors, release, disposeRoot:release, dispose, inspect};
}