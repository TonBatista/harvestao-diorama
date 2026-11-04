import * as T from './three.module.js';
import {ALFORRIA} from './coastal-layout.js?v=0.43';
import {logoPanel} from './alforria-logo.js?v=0.43';
import {createInteriorRoom,group,C,lantern} from './rural-room.js?v=0.43';
import {addResident} from './new-residents.js?v=0.43';
function ring(k,parent,x,y,z,r,color='#eee2bd',width=.045){const geometry=new T.RingGeometry(r-width,r+width,80),material=new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide});material.userData.regionOwned=true;const m=new T.Mesh(geometry,material);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m}
function berimbau(k,parent,x,y,z,scale=1){const g=group(parent,x,y,z);g.scale.setScalar(scale);const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,0,0),new T.Vector3(.22,.95,0),new T.Vector3(.01,1.85,0)),bow=new T.Mesh(new T.TubeGeometry(curve,20,.018,5,false),k.box(g,'#9b754d',0,0,0,.001,.001,.001,'wood').material);bow.castShadow=true;g.add(bow);k.beam(g,'#c8c1a2',[0,0,0],[.01,1.85,0],.004,'plain');k.ball(g,'#ac8350',.035,.47,.03,.17,.20,.17,'wood');k.ball(g,'#5e4934',.035,.47,.19,.10,.13,.018);k.beam(g,'#a18458',[-.16,.17,.06],[.16,.37,.06],.008,'wood');return g}
export function buildAcademyExterior(k){const {x,z,height:h}=ALFORRIA,F=k.fixed;const house=k.house(x,z,9.6,6,'#bca076','#6b7d7c');house.position.y=h;
 // Move this cottage's complete front window (frame, shutters and flower box), leaving the emblem in place.
 for(const piece of house.children)if(piece.isMesh&&Math.abs(piece.position.x-9.6*.28)<.95&&piece.position.z>3.07&&piece.position.z<3.48&&piece.position.y>.8&&piece.position.y<2.2){piece.position.x-=9.6*.56;piece.name='academy-front-window-piece'}

 for(const dx of[-4.7,0,4.7])for(const zz of[-9.2,-4.4,-1.3]){k.cyl(F,'#826a4c',x+dx,.59,zz,.14,1.18,'wood');k.cyl(F,'#928d79',x+dx,.08,zz,.21,.16,'stone')}
 k.box(F,'#7f6c51',x,1.10,-2.5,10.8,.16,3,'wood');for(let i=0;i<36;i++)k.box(F,i%3?'#b19a72':'#9b8967',x-5.25+i*.3,1.20,-2.5,.283,.04,2.96,'wood');
 for(let i=0;i<6;i++){const top=h*(6-i)/6,zz=-1+.65*(i+.5);k.box(F,i%2?'#ad9671':'#bca47c',x,top-.08,zz,2.8,.16,.64,'wood');for(const dx of[-1.28,1.28])k.ball(F,'#6e6857',x+dx,top+.004,zz,.018,.006,.018)}
 for(const side of[-1,1]){const xx=x+side*5.37;for(const zz of[-3.8,-2.4,-1.1])k.cyl(F,'#927653',xx,h+.52,zz,.065,1.05,'wood');for(const yy of[h+.43,h+.86])k.box(F,'#b29a71',xx,yy,-2.5,.08,.10,2.98,'wood');k.solid(xx,-2.5,.14,3.1);
 const cx=x+side*3.5;for(const dx of[-1.7,1.7])k.cyl(F,'#927653',cx+dx,h+.52,-1.1,.065,1.05,'wood');for(const yy of[h+.43,h+.86])k.box(F,'#b29a71',cx,yy,-1.1,3.5,.10,.08,'wood');k.solid(cx,-1.1,3.5,.14);
 k.beam(F,'#b49a71',[x+side*1.5,h+.82,-.9],[x+side*1.5,.94,2.75],.045,'wood');for(const zz of[-.8,1,2.75]){const t=(2.9-zz)/3.9;k.cyl(F,'#917954',x+side*1.5,.46+h*t,zz,.055,.92,'wood')}k.solid(x+side*1.53,.95,.13,4.0)}
 const badge=group(F,x+2.45,2.80,-3.86);const backing=k.cyl(badge,'#8d7353',0,0,0,.48,.08,'wood');backing.rotation.x=Math.PI/2;const logo=logoPanel(badge,0,0,.052,.84,.84);logo.geometry=new T.CircleGeometry(.42,48);k.sign(x-4.4,3.8,'Grupo Alforria · capoeira');
 for(const xx of[x-4.6,x+4.6]){k.cyl(F,'#b79269',xx,h+.24,-1.8,.23,.48,'clay');for(let i=0;i<5;i++)k.plant(xx+Math.sin(i*2.4)*.15,-1.8+Math.cos(i*2.4)*.15,.4,'#8a9a6d')}
 // Weathered boards form a route from the older beach to the new veranda.
 const points=[[-17.8,8.5],[-22,8.5],[-25.7,4.4],[-31,3.35]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);for(let j=0;j<Math.ceil(len/.33);j++){const t=(j+.5)/Math.ceil(len/.33),board=k.box(F,j%4?'#b3a17a':'#a39470',a[0]+dx*t,.055,a[1]+dz*t,1.65,.09,.30,'wood');board.rotation.y=angle}}
 ring(k,F,x,.026,8,3.15,'#bbac85',.032);
}
export function buildCapoeiraHall(state={}){const k=createInteriorRoom({id:'capoeiraHall',label:'Grupo Alforria · salão de treino',w:15,d:12,wall:'#b99b70',wallKind:'wood',floor:'#b99c71',returnTo:'beach',returnSpawn:ALFORRIA.returnSpawn}),F=k.fixed;
 ring(k,F,0,.043,.15,2.72);ring(k,F,0,.044,.15,.30,'#e4d2a7',.018);for(const x of[-.28,.28])k.box(F,'#dfcca3',x,.044,3.06,.38,.007,.055);
 const wallBanner=group(F,0,2.0,-5.82);k.box(wallBanner,'#765b41',0,0,0,2.0,2.0,.08,'wood');logoPanel(wallBanner,0,0,.046,1.83,1.83);
 for(const [i,x]of[-5.9,-4.8,-3.7].entries()){k.box(F,'#7e654b',x,2.55,-5.72,.28,.10,.24,'wood');berimbau(k,F,x,1.0,-5.60,.90+i*.04)}
 const drum=group(F,4.9,0,-4.55);k.cyl(drum,'#9c7750',0,.70,0,.39,1.4,'wood');k.cyl(drum,'#6e583f',0,.14,0,.30,.20,'wood');k.cyl(drum,'#c1a67b',0,1.40,0,.43,.12,'wood');k.cyl(drum,'#e1d0ab',0,1.47,0,.365,.028,'fabric');for(let i=0;i<12;i++){const a=i*Math.PI/6;k.beam(drum,'#d2c1a0',[Math.sin(a)*.40,1.35,Math.cos(a)*.40],[Math.sin(a+.26)*.30,.20,Math.cos(a+.26)*.30],.012,'plain')}k.roundSolid(4.9,-4.55,.48);
 for(const x of[-5.7,5.7]){k.box(F,'#9b7f58',x,.47,2.2,2.0,.14,.65,'wood');for(const dx of[-.73,.73])k.box(F,'#795e42',x+dx,.23,2.2,.12,.46,.50,'wood');k.solid(x,2.2,2.05,.70)}lantern(k,-6.8,2.4,-3.9);lantern(k,6.8,2.4,-3.9);
 k.interact({x:-4.8,z:-4.5,type:'info',label:'Berimbaus do Grupo Alforria',data:{name:'Berimbaus do Grupo Alforria',text:'Gunga, médio e viola descansam nos suportes de madeira. O berimbau conduz o ritmo e a escuta na roda.'},radius:1.5});k.interact({x:4.7,z:-3.4,type:'info',label:'Atabaque',data:{name:'Atabaque',text:'Um tambor de madeira e cordas acompanha as palmas e os instrumentos do Grupo Alforria.'},radius:1.3});addResident(k,'emerson',state,{x:3.6,z:-2.7,indoors:true,centerX:0,centerZ:.15,text:'Bem-vindo à casa do Grupo Alforria! Aqui no salão a madeira guarda o compasso dos nossos encontros. A roda é um espaço de respeito, cultura e amizade.'});return k.finishRoom()}
