import * as T from './three.module.js';
const TAU=Math.PI*2;
const signDisk=new T.CylinderGeometry(1,1,1,36);
signDisk.userData.shared=true;
const oval=(x,y,w,h)=>{const shape=new T.Shape();shape.absellipse(x,y,w,h,0,TAU,false,0);return shape};
function polygon(points){
 const shape=new T.Shape();
 points.forEach(([x,y],i)=>i===0?shape.moveTo(x,y):shape.lineTo(x,y));
 shape.closePath();
 return shape;
}
const rectangle=(x,y,w,h)=>polygon([[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]]);
export function serviceSign(k,a){
 const group=new T.Group(),x=a.x+2.15,z=a.z+2.42,y=2.03;
 group.position.set(x,-1.2+y,z);group.rotation.y=.08;k.fixed.add(group);
 const disk=k.mesh(group,signDisk,'#96643d',0,0,0,.53,.13,.53,'wood');
 disk.rotation.x=Math.PI/2;
 const face=k.mesh(group,signDisk,'#c49861',0,0,.069,.48,.035,.48,'wood');
 face.rotation.x=Math.PI/2;
 const rim=k.mesh(group,new T.TorusGeometry(.493,.018,6,36),'#6f513c',0,0,.069,1,1,1,'wood');
 rim.castShadow=true;
 k.box(group,'#594d3f',0,.66,-.21,.10,.34,.055);
 k.beam(group,'#544d40',[0,.71,-.23],[0,.71,.05],.028);
 k.beam(group,'#584b3c',[0,.55,-.22],[0,.70,.025],.019);
 for(const hook of [-.18,.18]){
  k.beam(group,'#5e503f',[0,.70,.02],[hook,.50,.02],.014);
  k.ball(group,'#735e47',hook,.466,.077,.022,.024,.014);
 }
 function carve(shape,color,z=.087){
  const geometry=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSegments:1,bevelSize:.010,bevelThickness:.010,curveSegments:10});
  k.mesh(group,geometry,color,0,0,z,1,1,1);
 }
 if(a.id==='agroShop'){
  carve(polygon([[-.19,.25],[.19,.25],[.16,.14],[.22,-.23],[.13,-.28],[-.15,-.28],[-.22,-.23],[-.16,.14]]),'#ede0ac');
  carve(rectangle(0,.20,.35,.045),'#a17e4b',.111);
  carve(rectangle(0,-.045,.033,.22),'#627e4d',.111);
  carve(oval(-.067,.035,.080,.038),'#739454',.114);
  carve(oval(.071,.082,.087,.040),'#8ba360',.114);
 }else if(a.id==='vetClinic'){
  carve(oval(-.050,-.055,.16,.119),'#688f88');
  for(const [px,py] of [[-.215,.102],[-.103,.189],[.032,.194],[.149,.113]])carve(oval(px,py,.054,.068),'#7da69a');
  carve(rectangle(.175,-.179,.19,.052),'#b36455',.113);
  carve(rectangle(.175,-.179,.052,.19),'#b36455',.114);
 }else if(a.id==='clothesShop'){
  carve(polygon([[-.15,.23],[-.073,.27],[-.053,.17],[.053,.17],[.073,.27],[.15,.23],[.28,.083],[.168,.010],[.121,.067],[.135,-.23],[-.135,-.23],[-.121,.067],[-.168,.010],[-.28,.083]]),'#9877a5');
  carve(rectangle(0,-.026,.025,.34),'#c5a5c7',.111);
  carve(rectangle(-.077,.016,.063,.060),'#b28cbd',.111);
  for(const yy of [.07,-.05,-.16])carve(oval(.001,yy,.014,.014),'#e3cca1',.133);
 }else if(a.id==='artSchool'){
  const palette=oval(-.045,-.025,.285,.215);
  const hole=new T.Path();hole.absellipse(-.168,-.081,.044,.058,0,TAU,true,0);palette.holes.push(hole);
  carve(palette,'#ad7950');
  for(const [px,py,c] of [[-.204,.065,'#b56867'],[-.078,.116,'#e4bb66'],[.043,.087,'#859b64'],[.088,-.050,'#779cae']])carve(oval(px,py,.045,.043),c,.112);
  carve(polygon([[.023,-.265],[.246,.190],[.276,.169],[.073,-.279]]),'#6f5947',.117);
  carve(polygon([[.231,.15],[.244,.239],[.305,.291],[.317,.213],[.278,.129]]),'#d3a77c',.126);
 }else if(a.id==='birdClub'){
  carve(polygon([[-.105,-.080],[-.316,.006],[-.254,-.137],[-.112,-.153]]),'#537a68');
  carve(oval(-.034,-.061,.196,.120),'#7c9d78');
  carve(oval(.127,.071,.109,.105),'#9eae80');
  carve(oval(-.084,-.081,.117,.064),'#628374',.111);
  carve(polygon([[.22,.104],[.329,.058],[.219,.035]]),'#d2a355');
  carve(oval(.151,.108,.019,.021),'#353d36',.117);
  carve(rectangle(-.036,-.202,.265,.032),'#85603e');
 }else{
  carve(polygon([[-.27,-.20],[-.235,-.26],[-.165,-.248],[.119,.044],[.229,.057],[.294,.134],[.298,.238],[.198,.148],[.132,.210],[.202,.300],[.103,.273],[.037,.197],[.041,.107]]),'#899e9a');
  carve(polygon([[.157,-.259],[.199,-.222],[-.131,.130],[-.173,.094]]),'#ab7f51',.115);
  carve(polygon([[-.173,.094],[-.243,.167],[-.258,.226],[-.205,.231],[-.130,.132]]),'#c0c1b2',.116);
 }
 const point={type:'info',x,z:z+.70,radius:1.3,label:a.name,data:{name:a.name,text:a.detail},
  sign:{x,y:y-1.2,z:z+.105,width:1.08,height:1.10,rotation:.08}};
 k.interactions.push(point);k.signs.push(point);
 return group;
}
export function serviceFrontage(k,a){const F=k.fixed,out=a.x+(a.x<0?-4.1:4.1),z=a.z,side=a.x<0?-1:1;serviceSign(k,a);
 if(a.id==='agroShop'){for(let i=0;i<3;i++){k.cyl(F,['#b7a472','#c6b88a','#a89a74'][i],out,-.7,z-1+i*.8,.30,.9,'fabric');k.roundSolid(out,z-1+i*.8,.33)}k.box(F,'#a59574',out,-.2,z+1.45,.85,.65,.75,'wood');k.solid(out,z+1.45,.9,.8)}
 if(a.id==='vetClinic'){for(const dx of[-1.6,1.6]){const p=k.plant(a.x+dx,z+2.75,.8,'#aab68b');p.position.y=-1.15}for(let i=0;i<6;i++)k.box(F,i%2?'#deeee5':'#86aca2',a.x-2.8+(i+.5)*.93,1.0,z+2.1,.95,.10,1.15,'fabric');k.box(F,'#99b2a9',out,-.70,z,.9,1,.5,'wood');k.roundSolid(out,z,.55)}
 if(a.id==='clothesShop'){for(const p of[-1,1])k.cyl(F,'#a58b69',out,-.05,z+p*1.5,.05,2.3,'wood');k.beam(F,'#847a5b',[out,1,z-1.5],[out,1,z+1.5],.015);for(let i=0;i<3;i++){k.box(F,['#ad91b6','#91a89a','#d3b882'][i],out,.5,z-1+i,.16,.76,.65,'fabric');k.box(F,['#ad91b6','#91a89a','#d3b882'][i],out,.77,z-1+i,.18,.22,1.0,'fabric')}k.solid(out,z,.5,3.3)}
 if(a.id==='artSchool'){for(const d of[-.4,.4])k.beam(F,'#a98c63',[out+d,-1.2,z+.3],[out+d*.7,.65,z],.045);k.box(F,'#b8976a',out,-.1,z,1.15,1.3,.10,'wood');k.box(F,'#e4d6b7',out,-.1,z+.065,1.0,1.15,.025);k.ball(F,'#8ca584',out-.1,-.14,z+.09,.36,.25,.015);k.ball(F,'#cba6a5',out+.2,.1,z+.10,.20,.16,.015);k.solid(out,z,1.3,.8);const p=k.plant(out,z+1.6,.9,'#d3b570');p.position.y=-1.15}
 if(a.id==='birdClub'){k.cyl(F,'#a58a61',out,-.20,z,.09,2.0,'wood');k.box(F,'#b89b70',out,.64,z,1.2,.10,.9,'wood');k.box(F,'#c6ab80',out,.88,z,.65,.48,.56,'wood');k.ball(F,'#5f7260',out,.9,z+.29,.12,.13,.02);const roof=k.box(F,'#8e9e80',out,1.18,z,.95,.13,.75,'wood');roof.rotation.z=-.13;k.roundSolid(out,z,.32);for(let i=0;i<4;i++){const p=k.plant(out+side*.5,z+1.5+i*.5,.6,'#8ea67b');p.position.y=-1.15}}
 if(a.id==='mechanic'){for(let i=0;i<3;i++){k.cyl(F,'#5b645d',out,-.95+i*.27,z,.48,.24);k.cyl(F,'#9a9f8c',out,-.82+i*.27,z,.22,.025)}k.roundSolid(out,z,.5);k.box(F,'#91a49a',out,-.1,z+1.6,1.1,1.8,.16);for(let i=0;i<3;i++)k.box(F,'#c5c0a6',out-.32+i*.32,-.1,z+1.72,.065,.75,.08);k.solid(out,z+1.6,1.2,.3)}
 for(let i=0;i<5;i++){const p=k.plant(a.x+(i-2)*.55,z-2.6,.52,i%2?'#af9ab1':'#a0af79');p.position.y=-1.15}
}
