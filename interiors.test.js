import test from 'node:test';
import assert from 'node:assert/strict';

// Only canvas painting is stubbed: geometry, materials, transforms, colliders,
// animation callbacks and path finding all run against the real Three module.
const noop=()=>{};
const context={};
for(const method of ['fillRect','clearRect','strokeRect','beginPath','closePath','moveTo','lineTo','arc','ellipse','roundRect','fill','stroke','save','restore','translate','rotate','scale','drawImage','fillText','strokeText','bezierCurveTo','quadraticCurveTo'])context[method]=noop;
context.createLinearGradient=context.createRadialGradient=()=>({addColorStop:noop});
context.measureText=text=>({width:String(text).length*8});
context.createImageData=(w,h)=>({data:new Uint8ClampedArray(w*h*4)});
context.putImageData=noop;
globalThis.document={createElement(name){assert.equal(name,'canvas');return {width:256,height:256,getContext(){return context}}}};

const civic=await import('./interiors-civic.js');
const homes=await import('./interiors-homes.js');
const workshops=await import('./interiors-workshops.js');
const builders=[civic.buildChapel,civic.buildLibrary,civic.buildClinic,homes.buildInn,homes.buildRosaHouse,homes.buildFisherHouse,workshops.buildSmithy,workshops.buildCarpenter,workshops.buildMine,workshops.buildLighthouse];

function fits(region,x,z){
 const b=region.bounds;
 if(x<b[0]+.25||x>b[1]-.25||z<b[2]+.25||z>b[3]-.25)return false;
 for(const c of region.colliders){
  if(c.r&&Math.hypot(x-c.x,z-c.z)<c.r+.24)return false;
  if(c.w&&Math.abs(x-c.x)<c.w/2+.22&&Math.abs(z-c.z)<c.d/2+.22)return false;
 }
 return true;
}
function reachableCells(region,step=.15){
 const b=region.bounds,cols=Math.floor((b[1]-b[0]-.5)/step)+1,rows=Math.floor((b[3]-b[2]-.5)/step)+1,grid=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=b[0]+.25+col*step,z=b[2]+.25+row*step;grid.push({x,z,open:fits(region,x,z),col,row})}
 let start=-1,dist=Infinity;
 for(let i=0;i<grid.length;i++)if(grid[i].open){const d=Math.hypot(grid[i].x-region.spawn[0],grid[i].z-region.spawn[1]);if(d<dist){dist=d;start=i}}
 assert.ok(dist<step*1.5,region.id+': entrance has no nearby walkable grid cell');
 const queue=[start],seen=new Set(queue),reachable=[];
 for(let head=0;head<queue.length;head++){
  const i=queue[head],p=grid[i];reachable.push(p);
  for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){
   const col=p.col+dx,row=p.row+dz;if(col<0||col>=cols||row<0||row>=rows)continue;
   const n=row*cols+col;if(seen.has(n)||!grid[n].open)continue;
   // Confirm midpoint clearance so a narrow solid cannot be skipped by the grid.
   if(!fits(region,(p.x+grid[n].x)/2,(p.z+grid[n].z)/2))continue;
   seen.add(n);queue.push(n);
  }
 }
 return reachable;
}
function selectedPoint(points,cell){
 let closest=null,distance=Infinity;
 for(const p of points){const d=Math.hypot(cell.x-p.x,cell.z-p.z);if(d<(p.radius??1.6)&&d<distance){closest=p;distance=d}}
 return closest;
}
for(const build of builders){
 test(build.name+': finite real geometry, animation and safe disposal',()=>{
  const r=build();assert.ok(r.indoors);assert.ok(r.root.isObject3D);let vertices=0,meshes=0;
  for(const time of [0,1,120]){
   r.update(1/60,time);r.root.updateMatrixWorld(true);
   r.root.traverse(o=>{
    assert.ok(o.matrixWorld.elements.every(Number.isFinite),r.id+': transform '+o.name);
    if(o.geometry)for(const [name,a]of Object.entries(o.geometry.attributes))for(const n of a.array)assert.ok(Number.isFinite(n),r.id+': '+name);
    if(time===0&&o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count}
   });
  }
  assert.ok(meshes>100,r.id+': room must contain furnished geometry');assert.ok(vertices<900000,r.id+': excessive geometry');
  r.dispose();assert.equal(r.root.children.length,0);
 });
 test(build.name+': exit and every interaction reachable from entrance',()=>{
  const r=build();
  assert.ok(fits(r,...r.spawn),r.id+': blocked entrance');assert.equal(r.portals.length,1,r.id+': needs one unambiguous exit');
  const exit=r.portals[0];assert.ok(fits(r,exit.x,exit.z),r.id+': blocked exit');assert.notEqual(exit.to,r.id);
  const cells=reachableCells(r),points=[...r.portals,...r.interactions];
  assert.ok(cells.length>80,r.id+': not enough walkable floor');assert.ok(r.interactions.length>=4,r.id+': expected resident and local details');
  const selected=new Set();for(const cell of cells){const p=selectedPoint(points,cell);if(p)selected.add(p)}
  for(const p of points)assert.ok(selected.has(p),r.id+': unreachable or permanently obscured interaction '+p.label);
  r.dispose();
 });
}
const {INTERIOR_DESTINATIONS}=await import('./interior-catalog.js');
const {buildVillage}=await import('./region-village.js');
const {buildMountain,buildBeach}=await import('./region-nature.js');
const {buildLake}=await import('./region-homesteads.js');
const {freshState}=await import('./simulation.js');

test('all ten real exterior doorways are reachable and return to clear ground',()=>{
 const exteriors=new Map([['village',buildVillage()],['mountain',buildMountain()],['beach',buildBeach()],['lake',buildLake(freshState(false))]]);
 const rooms=new Map(builders.map(build=>{const room=build();return [room.id,room]}));
 try{
  assert.equal(INTERIOR_DESTINATIONS.length,10);
  const reachable=new Map();
  for(const [id,region]of exteriors)reachable.set(id,reachableCells(region,.30));
  for(const destination of INTERIOR_DESTINATIONS){
   const outside=exteriors.get(destination.exterior),room=rooms.get(destination.id);
   assert.ok(outside,destination.id+': missing exterior');assert.ok(room,destination.id+': missing room builder');
   const entries=outside.portals.filter(p=>p.to===destination.id);
   assert.equal(entries.length,1,destination.id+': exterior needs exactly one doorway');
   const entrance=entries[0],cells=reachable.get(destination.exterior),points=[...outside.portals,...outside.interactions];
   assert.ok(cells.some(cell=>selectedPoint(points,cell)===entrance),destination.id+': doorway cannot be selected from reachable exterior ground');
   const exit=room.portals[0];
   assert.equal(exit.to,destination.exterior,destination.id+': wrong return region');
   assert.deepEqual(exit.spawn,destination.returnSpawn,destination.id+': catalog and room return coordinates differ');
   assert.ok(fits(outside,...exit.spawn),destination.id+': return lands inside an obstacle');
   assert.ok(cells.some(cell=>Math.hypot(cell.x-exit.spawn[0],cell.z-exit.spawn[1])<.45),destination.id+': return point isolated from exterior walking area');
   for(const replaced of destination.replaces)assert.ok(!outside.interactions.some(p=>p.label===replaced),destination.id+': obsolete door info still masks entry');
  }
 }finally{for(const r of exteriors.values())r.dispose();for(const r of rooms.values())r.dispose()}
});