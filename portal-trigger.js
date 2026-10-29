/** Proximity transitions arm only after the player leaves an arrival portal. */
export function createPortalTrigger({cooldown=1.2,exitMargin=.35}={}){
 let area=null,armed=false,remaining=0;
 const radius=p=>Number.isFinite(p.autoRadius)?Math.max(.25,p.autoRadius):Math.min(.85,Number.isFinite(p.radius)?p.radius:1.4);
 function reset(){area=null;armed=false;remaining=cooldown}
 function update({areaKey,portals=[],player,dt=0,enabled=true,allowed=()=>true}){
  remaining=Math.max(0,remaining-Math.max(0,Math.min(.25,dt)));
  if(areaKey!==area){area=areaKey;armed=false;remaining=cooldown}
  if(!enabled||!player||!Number.isFinite(player.x)||!Number.isFinite(player.z))return null;
  const distance=p=>Math.hypot(player.x-p.x,player.z-p.z),valid=portals.filter(p=>p&&p.type==='portal'&&typeof p.to==='string'&&Number.isFinite(p.x)&&Number.isFinite(p.z));
  if(!armed){if(valid.every(p=>distance(p)>radius(p)+exitMargin))armed=true;return null}
  if(remaining>0)return null;
  let match=null,best=Infinity;for(const p of valid){const d=distance(p);if(d<=radius(p)&&d<best&&allowed(p)){best=d;match=p}}
  if(match){armed=false;remaining=cooldown}return match;
 }
 return {update,reset,get armed(){return armed}};
}