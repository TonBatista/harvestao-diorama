// Circle footprints against rounded obstacle boundaries. Decorations never enlarge a vehicle.
export function contact(point,c){
 const a=c.angle||0,cs=Math.cos(a),sn=Math.sin(a),dx=point.x-c.x,dz=point.z-c.z;
 const x=dx*cs-dz*sn,z=dx*sn+dz*cs,r=point.r||0;
 if(c.passages?.some(p=>contact({...point,r:r+.02},p).depth>r*2))return {depth:0,nx:0,nz:0};
 let depth=0,nx=0,nz=0;
 if(Number.isFinite(c.r)){
  const length=Math.hypot(dx,dz);depth=c.r+r-length;nx=length?dx/length:1;nz=length?dz/length:0;
 }else if(Number.isFinite(c.rx)&&Number.isFinite(c.rz)){
  const rx=c.rx+r,rz=c.rz+r,d=Math.hypot(x/rx,z/rz);
  depth=(1-d)*Math.min(rx,rz);const len=Math.hypot(x/(rx*rx),z/(rz*rz))||1;
  const lx=x/(rx*rx)/len,lz=z/(rz*rz)/len;nx=lx*cs+lz*sn;nz=-lx*sn+lz*cs;
 }else if(Number.isFinite(c.w)&&Number.isFinite(c.d)){
  const hx=c.w/2,hz=c.d/2,qx=Math.abs(x)-hx,qz=Math.abs(z)-hz;
  const ox=Math.max(0,qx),oz=Math.max(0,qz),length=Math.hypot(ox,oz);
  depth=r-(length+Math.min(0,Math.max(qx,qz)));
  let lx,lz;if(length>1e-7){lx=Math.sign(x)*ox/length;lz=Math.sign(z)*oz/length}
  else if(qx>qz){lx=Math.sign(x)||1;lz=0}else{lx=0;lz=Math.sign(z)||1}
  nx=lx*cs+lz*sn;nz=-lx*sn+lz*cs;
 }
 return {depth:Math.max(0,depth),nx,nz};
}
export function collisionField(solids,bounds){
 const depth=(points,c)=>points.reduce((n,p)=>Math.max(n,contact(p,c).depth),0);
 const boundary=points=>points.reduce((n,p)=>Math.max(n,bounds[0]-p.x+p.r,p.x+p.r-bounds[1],bounds[2]-p.z+p.r,p.z+p.r-bounds[3]),0);
 return {
  allows(after,before=[]){
   if(boundary(after)>boundary(before)+.0005)return false;
   return solids.every(c=>depth(after,c)<=depth(before,c)+.0005);
  },
  slide(points,dx,dz){
   const contacts=[];for(const c of solids)for(const p of points){const hit=contact(p,c);if(hit.depth>0)contacts.push(hit)}
   contacts.sort((a,b)=>b.depth-a.depth);
   for(const hit of contacts.slice(0,6)){const into=dx*hit.nx+dz*hit.nz;if(into<0){dx-=hit.nx*into;dz-=hit.nz*into}}
   return [dx,dz];
  }
 };
}
export function tractorFootprint(p,trailer=null){
 const cs=Math.cos(p.angle),sn=Math.sin(p.angle),points=[-.63,0,.67].map(z=>({x:p.x+sn*z,z:p.z+cs*z,r:.53}));
 if(trailer){const c=Math.cos(trailer.angle),s=Math.sin(trailer.angle);for(const [x,z]of[[-.53,-.65],[.53,-.65],[-.53,.65],[.53,.65],[0,0]])points.push({x:trailer.x+x*c+z*s,z:trailer.z-x*s+z*c,r:.25})}
 return points;
}
