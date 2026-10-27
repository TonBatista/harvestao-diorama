/** Footprints only: all coordinates are in scenery space, never inferred from decorative meshes. */
export function colliderContains(c,x,z,margin=.23){
 if(!c||!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(c.passages)for(const passage of c.passages)if(colliderContains(passage,x,z,-Math.abs(margin)))return false;
 const dx=x-c.x,dz=z-c.z,a=Number.isFinite(c.angle)?c.angle:0,cs=a?Math.cos(a):1,sn=a?Math.sin(a):0,lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
 if(Number.isFinite(c.rx)&&Number.isFinite(c.rz)){const rx=c.rx+margin,rz=c.rz+margin;return rx>0&&rz>0&&(lx/rx)**2+(lz/rz)**2<1}
 if(Number.isFinite(c.r)){const r=c.r+margin;return r>0&&dx*dx+dz*dz<r*r}
 if(Number.isFinite(c.w)&&Number.isFinite(c.d)){const w=c.w/2+margin,d=c.d/2+margin;return w>0&&d>0&&Math.abs(lx)<w&&Math.abs(lz)<d}
 return false;
}
/** Exact duplicate footprints are compacted once on build, keeping per-frame collision work bounded. */
export function compactSceneColliders(colliders){
 const seen=new Map(),result=[];for(const c of colliders){if(!c||!Number.isFinite(c.x)||!Number.isFinite(c.z))continue;if(c.passages||c.rx){result.push(c);continue}const center=c.x.toFixed(4)+'/'+c.z.toFixed(4),key=Number.isFinite(c.r)?'r/'+center:'b/'+center+'/'+c.w+'/'+c.d+'/'+(c.angle||0),old=seen.get(key);if(!old){seen.set(key,c);result.push(c);continue}if(Number.isFinite(c.r))old.r=Math.max(old.r,c.r);old.jumpable=old.jumpable===true&&c.jumpable===true;if(Number.isFinite(c.height))old.height=Math.max(old.height||0,c.height)}colliders.length=0;colliders.push(...result);return colliders;
}