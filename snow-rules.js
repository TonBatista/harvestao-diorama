import {fieldForState,canCultivate,TILE} from './cultivation-layout.js?v=0.46';
export const snowDay=s=>[s.year,s.season,s.day].join(':');
export function snowRecord(s){s.gathered??={};const id='snow-cleared:'+(s.region==='homestead'?s.homesteads?.selected||'lake':'farm');let r=s.gathered[id];if(!r||r.day!==snowDay(s)||!Array.isArray(r.tiles))r=s.gathered[id]={day:snowDay(s),tiles:[]};return r}
export function snowCovered(s,p){return s.season===3&&p&&!snowRecord(s).tiles.includes(p.z*fieldForState(s).cols+p.x)}
export function clearSnow(s,x=s.player.x,z=s.player.z,radius=.8){if(s.season!==3||!['farm','homestead'].includes(s.region))return false;const f=fieldForState(s),r=snowRecord(s),known=new Set(r.tiles);let changed=false;for(const p of s.plots){if(!canCultivate(s,p)||Math.hypot(f.x+p.x*TILE-x,f.z+p.z*TILE-z)>radius)continue;const id=p.z*f.cols+p.x;if(!known.has(id)){known.add(id);r.tiles.push(id);changed=true}}return changed}
