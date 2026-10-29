import {MAIN_FARM_BOUNDS} from './farm-layout.js?v=0.33';
import {colliderContains} from './scene-collisions.js?v=0.33';
export const FARM_OBJECTS=Object.freeze([
 {id:'house',name:'Casa principal',w:5,d:4.1,default:{x:-3,z:-21,angle:0}},
 {id:'barn',name:'Celeiro',w:4.3,d:3.7,default:{x:-13.5,z:-20.5,angle:0}},
 {id:'toolroom',name:'Quarto de ferramentas',w:3.5,d:3.4,default:{x:6,z:-21,angle:0}},
 {id:'hammock',name:'Árvores e rede',w:6.2,d:2.4,default:{x:-13.5,z:-13,angle:0}},
 {id:'shipping',name:'Caixa de entregas',w:1.8,d:1.3,default:{x:2,z:-17.7,angle:0}},
 {id:'well',name:'Poço',w:2.1,d:2.2,default:{x:15,z:-21,angle:0}}
]);
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),TAU=Math.PI*2,byId=new Map(FARM_OBJECTS.map(d=>[d.id,d]));
const normalize=a=>((a%TAU)+TAU)%TAU;
export function validFarmLayout(value){return record(value)&&Object.keys(value).length===FARM_OBJECTS.length&&FARM_OBJECTS.every(d=>{const p=value[d.id];return record(p)&&Object.keys(p).every(k=>['x','z','angle'].includes(k))&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.angle)&&p.x>=MAIN_FARM_BOUNDS[0]&&p.x<=MAIN_FARM_BOUNDS[1]&&p.z>=MAIN_FARM_BOUNDS[2]&&p.z<=MAIN_FARM_BOUNDS[3]&&Math.abs(p.angle)<=TAU})}
export function migrateFarmLayout(s){
 if(!record(s.farmLayout)){s.farmLayout={};for(const r of Object.values(s.herdRoutes||{}))if(r.property==='farm')delete r.version;}for(const d of FARM_OBJECTS){const p=s.farmLayout[d.id];if(!record(p)||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!Number.isFinite(p.angle)||Math.abs(p.x)>40||Math.abs(p.z)>40)s.farmLayout[d.id]={...d.default};else if(p.angle<0||p.angle>=TAU)p.angle=normalize(p.angle)}
 for(const id of Object.keys(s.farmLayout))if(!byId.has(id))delete s.farmLayout[id];return s.farmLayout;
}
export function farmObject(s,id){return migrateFarmLayout(s)[id]||null}
export function farmPoint(s,id,dx=0,dz=0){const p=farmObject(s,id);if(!p)return {x:0,z:0};const c=Math.cos(p.angle),n=Math.sin(p.angle);return{x:p.x+c*dx+n*dz,z:p.z-n*dx+c*dz}}
export function farmFootprints(s){const map=migrateFarmLayout(s);return FARM_OBJECTS.map(d=>({x:map[d.id].x,z:map[d.id].z,w:d.w,d:d.d,angle:map[d.id].angle,farmObject:d.id,kind:'farm-building'}))}
export const FARM_GATES=Object.freeze({village:{x:24.9,z:-15},beach:{x:12,z:24.8},mountain:{x:-20.9,z:8}});
export const FARM_EDGE_TREES=Object.freeze([...[-19,-15,-10,-5,1,7,13,19,24].map(x=>({x,z:-25.1})),...[-18,-11,-4,3,20,25].map(x=>({x,z:25.1})),...[-19,-12,-5,2,15,22].map(z=>({x:-21.1,z})),...[-23,-8,0,8,16,23].map(z=>({x:25.1,z}))]);
const fixedPaths=[{x:3.5,z:-16,w:43,d:2},{x:24,z:-15.5,w:3.8,d:2},{x:18,z:4.4,w:2,d:40.8},{x:15,z:24.4,w:8,d:2},{x:-18,z:-4,w:2,d:24},{x:-19.5,z:8,w:5,d:2}];
const pathsCache=new WeakMap();
const onRect=(p,x,z,margin=0)=>colliderContains(p,x,z,margin);
function routeToLane(start,footprints){
 const step=.8,b=MAIN_FARM_BOUNDS,cell=p=>[Math.round(p.x/step),Math.round(p.z/step)],key=(x,z)=>x+','+z,open=(x,z)=>x*step>b[0]+.4&&x*step<b[1]-.4&&z*step>b[2]+.4&&z*step<b[3]-.4&&!footprints.some(p=>onRect(p,x*step,z*step,.3));
 let origin=cell(start);if(!open(...origin)){let found=null;for(let r=1;r<=3&&!found;r++)for(let dx=-r;dx<=r&&!found;dx++)for(let dz=-r;dz<=r;dz++)if(open(origin[0]+dx,origin[1]+dz)){found=[origin[0]+dx,origin[1]+dz];break}if(!found)return [];origin=found}
 const queue=[origin],previous=new Map([[key(...origin),null]]);let end=null;
 for(let at=0;at<queue.length&&at<5000;at++){const p=queue[at];if(fixedPaths.some(r=>onRect(r,p[0]*step,p[1]*step,-.15))){end=p;break}for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=p[0]+dx,z=p[1]+dz,k=key(x,z);if(previous.has(k)||!open(x,z))continue;previous.set(k,p);queue.push([x,z])}}
 if(!end)return [];const points=[];for(let p=end;p;p=previous.get(key(...p)))points.push({x:p[0]*step,z:p[1]*step});points.reverse();points.unshift(start);for(let i=points.length-2;i>0;i--){const a=points[i-1],p=points[i],b=points[i+1];if(Math.abs((p.x-a.x)*(b.z-p.z)-(p.z-a.z)*(b.x-p.x))<.00001)points.splice(i,1)}const result=[];for(let i=1;i<points.length;i++){const a=points[i-1],q=points[i],distance=Math.hypot(q.x-a.x,q.z-a.z);if(distance<.01)continue;result.push({x:(a.x+q.x)/2,z:(a.z+q.z)/2,w:1.5,d:distance+1.45,angle:Math.atan2(q.x-a.x,q.z-a.z)})}return result;
}
export function farmPaths(s){
 const map=migrateFarmLayout(s),stamp=JSON.stringify(map),cached=pathsCache.get(s);if(cached?.stamp===stamp)return cached.value;
 const footprints=farmFootprints(s),value=fixedPaths.map(p=>({...p,angle:0}));for(const d of FARM_OBJECTS){const p=farmPoint(s,d.id,0,d.d/2+.85);value.push(...routeToLane(p,footprints))}pathsCache.set(s,{stamp,value});return value;
}
function corners(c,padding=0){const result=[],cs=Math.cos(c.angle||0),sn=Math.sin(c.angle||0);for(const dx of[-c.w/2-padding,c.w/2+padding])for(const dz of[-c.d/2-padding,c.d/2+padding])result.push({x:c.x+cs*dx+sn*dz,z:c.z-sn*dx+cs*dz});return result}
function overlaps(a,b,padding=.3){const ca=corners(a,padding),cb=corners(b),axes=[a.angle||0,(a.angle||0)+Math.PI/2,b.angle||0,(b.angle||0)+Math.PI/2];return axes.every(angle=>{const cs=Math.cos(angle),sn=Math.sin(angle),pa=ca.map(p=>p.x*cs+p.z*sn),pb=cb.map(p=>p.x*cs+p.z*sn);return Math.max(...pa)>Math.min(...pb)&&Math.max(...pb)>Math.min(...pa)})}
export function validateFarmLayout(s,map){
 if(!validFarmLayout(map))return {ok:false,message:'Escolha uma posição e rotação válidas.'};const preview={...s,farmLayout:map},footprints=farmFootprints(preview),b=MAIN_FARM_BOUNDS;
 for(let i=0;i<footprints.length;i++){const c=footprints[i],name=byId.get(c.farmObject).name;if(corners(c,.4).some(p=>p.x<b[0]||p.x>b[1]||p.z<b[2]||p.z>b[3]))return {ok:false,message:name+' precisa ficar dentro da cerca da fazenda.'};for(let j=i+1;j<footprints.length;j++)if(overlaps(c,footprints[j],.55))return {ok:false,message:'Deixe espaço entre '+name.toLowerCase()+' e '+byId.get(footprints[j].farmObject).name.toLowerCase()+'.'};if(fixedPaths.some(p=>overlaps(c,p,.02)))return {ok:false,message:name+' está sobre um caminho principal. Mova um pouco para o lado.'};
  if(FARM_EDGE_TREES.some(t=>onRect(c,t.x,t.z,.5)))return {ok:false,message:'Deixe espaço para as árvores da borda ao posicionar '+name.toLowerCase()+'.'};
  if(['house','barn','toolroom'].includes(c.farmObject)){for(const distance of[2.8,3.5,4.2]){const p=farmPoint(preview,c.farmObject,0,distance);if(p.x<b[0]+.4||p.x>b[1]-.4||p.z<b[2]+.4||p.z>b[3]-.4||footprints.some(other=>other!==c&&onRect(other,p.x,p.z,.7)))return {ok:false,message:'Deixe a porta e a passagem em frente de '+name.toLowerCase()+' livres.'}}}
  const source=s.homePlots||s.plots||[],old=source.length===144,ox=old?-6:-19.75,oz=old?-3:-23;for(const p of source)if(p?.crop&&onRect(c,ox+p.x*1.25,oz+p.z*1.25,.7))return {ok:false,message:'Colha a plantação antes de colocar '+name.toLowerCase()+' nesse lugar.'};
  for(const p of Object.values(s.farmStumps||{}))if(Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&onRect(c,p.x,p.z,.3))return {ok:false,message:'Mova os tocos desse espaço antes de colocar '+name.toLowerCase()+'.'};
  const vehicles=[s.tractor,s.tractor?.trailer?{x:s.tractor.trailerX,z:s.tractor.trailerZ}:null];if(vehicles.some(v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.z)&&(!s.tractor?.area||s.tractor.area==='farm')&&onRect(c,v.x,v.z,.8)))return {ok:false,message:'Estacione o trator e a carreta longe desse espaço primeiro.'};
 }
 return {ok:true,message:'Posição livre. Pode salvar a organização.'};
}
export function applyFarmLayout(s,map){const result=validateFarmLayout(s,map);if(!result.ok)return result;s.farmLayout=Object.fromEntries(FARM_OBJECTS.map(d=>[d.id,{x:map[d.id].x,z:map[d.id].z,angle:normalize(map[d.id].angle)}]));for(const r of Object.values(s.herdRoutes||{}))if(r.property==='farm')delete r.version;for(const p of Object.values(s.animalWander||{}))if(p.property==='farm')delete p.path;return {ok:true,changed:true,message:'Organização da fazenda salva.'}}