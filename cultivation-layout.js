import {farmFootprints,farmPaths} from './farm-customization.js?v=0.33';
import {colliderContains} from './scene-collisions.js?v=0.33';
export const TILE=1.25;
export const LEGACY_FIELD=Object.freeze({x:-6,z:-3,cols:12,rows:12});
export const MAIN_FIELD=Object.freeze({x:-19.75,z:-23,cols:36,rows:38});
export const MAIN_PLOT_COUNT=MAIN_FIELD.cols*MAIN_FIELD.rows;
export const LEGACY_PLOT_COUNT=LEGACY_FIELD.cols*LEGACY_FIELD.rows;
const isGrid=p=>Array.isArray(p)&&(p.length===MAIN_PLOT_COUNT||p.length===LEGACY_PLOT_COUNT);
export function fieldForProperty(property='farm'){return property==='farm'?MAIN_FIELD:LEGACY_FIELD}
export function fieldForState(state){return state?.plots?.length===MAIN_PLOT_COUNT?MAIN_FIELD:state?.plots?.length===LEGACY_PLOT_COUNT?LEGACY_FIELD:state?.region==='homestead'?LEGACY_FIELD:MAIN_FIELD}
function blank(x,z){return {x,z,tilled:false,wet:false,crop:null,age:0,obstacle:null}}
function expand(source){
 if(Array.isArray(source)&&source.length===MAIN_PLOT_COUNT)return source;
 const result=Array.from({length:MAIN_PLOT_COUNT},(_,i)=>blank(i%MAIN_FIELD.cols,Math.floor(i/MAIN_FIELD.cols)));
 if(Array.isArray(source)&&source.length===LEGACY_PLOT_COUNT)for(const cell of source){if(!cell||!Number.isInteger(cell.x)||!Number.isInteger(cell.z)||cell.x<0||cell.x>=12||cell.z<0||cell.z>=12)continue;const x=cell.x+11,z=cell.z+16;result[z*MAIN_FIELD.cols+x]={...cell,x,z}}
 return result;
}
/** Main and lake plots have different dimensions. Rebind JSON-lost aliases without
 * ever interpreting the active lake plot as the household's main field. */
export function migrateCultivation(state){
 const lot=state.region==='homestead'?state.homesteads?.lots?.[state.homesteads?.selected]:null;
 const source=(!lot&&state.plots?.length===MAIN_PLOT_COUNT)?state.plots:state.homePlots?.length===MAIN_PLOT_COUNT?state.homePlots:!lot&&isGrid(state.plots)?state.plots:isGrid(state.homePlots)?state.homePlots:null;
 state.homePlots=expand(source);
 if(lot){if(Array.isArray(state.plots)&&state.plots.length===LEGACY_PLOT_COUNT)lot.plots=state.plots;state.plots=lot.plots}else state.plots=state.homePlots;
 return state.homePlots;
}
const defaultFarm={};
export function isPlantablePlot(plot,field=MAIN_FIELD,state=defaultFarm){
 if(!plot||!Number.isInteger(plot.x)||!Number.isInteger(plot.z)||plot.x<0||plot.z<0||plot.x>=field.cols||plot.z>=field.rows)return false;
 if(field.cols===LEGACY_FIELD.cols&&field.rows===LEGACY_FIELD.rows)return true;
 const x=field.x+plot.x*TILE,z=field.z+plot.z*TILE;
 return !farmFootprints(state).some(r=>colliderContains(r,x,z,.32))&&!farmPaths(state).some(r=>colliderContains(r,x,z,.12));
}
export function canCultivate(state,plot){
 const field=fieldForState(state);if(!isPlantablePlot(plot,field,state))return false;
 if(field===MAIN_FIELD){const x=field.x+plot.x*TILE,z=field.z+plot.z*TILE;for(const p of Object.values(state.farmStumps||{}))if(Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&Math.hypot(p.x-x,p.z-z)<.65)return false}
 return true;
}
