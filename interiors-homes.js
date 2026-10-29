import * as T from './three.module.js';
import {createInteriorRoom,group,C,table,chair,shelf,rug,vase,lantern,npc} from './rural-room.js?v=0.35';

// Small domestic objects reuse the room kit and are merged with its static art.
function cup(k,p,x,y,z,color='#d9cfb3'){
 k.cyl(p,color,x,y+.075,z,.09,.15);k.cyl(p,'#6f5740',x,y+.153,z,.068,.008);
 const h=new T.Mesh(new T.TorusGeometry(.059,.018,5,10),k.box(p,color,x,y,z,.001,.001,.001).material);h.position.set(x+.105,y+.08,z);p.add(h);return h;
}
function plate(k,p,x,y,z,r=.24){k.cyl(p,'#ddd3b9',x,y,z,r,.035);k.cyl(p,'#c6c5a6',x,y+.02,z,r*.77,.008)}
function loaf(k,p,x,y,z){const b=k.ball(p,'#c49a60',x,y,z,.30,.13,.17);for(let i=-1;i<=1;i++){const cut=k.box(p,'#e0bd82',x+i*.13,y+.105,z,.025,.012,.22);cut.rotation.y=-.35}return b}
function pie(k,p,x,y,z){k.cyl(p,'#98765c',x,y,z,.32,.10);k.cyl(p,'#bf825f',x,y+.065,z,.28,.04);for(let i=-1;i<=1;i++)for(const a of [-.7,.7]){const strip=k.box(p,'#d7b17a',x+i*.12,y+.092,z,.045,.018,.48);strip.rotation.y=a}}
function bed(k,x,z,color='#939680',w=2.0,d=3.05){const p=group(k.fixed,x,0,z);for(const xx of [-w*.42,w*.42])for(const zz of [-d*.43,d*.43])k.box(p,C.dark,xx,.22,zz,.12,.44,.12,'wood');k.box(p,C.oak,0,.43,0,w+.16,.20,d+.15,'wood');k.ball(p,'#ded6bf',0,.62,0,w*.49,.18,d*.48);k.box(p,color,0,.81,.45,w,.16,d*.64,'fabric');k.ball(p,'#eee4cc',0,.91,-d*.32,w*.38,.13,.35);k.box(p,C.oak,0,.89,-d*.52,w+.2,.90,.13,'wood');for(const xx of [-w*.42,w*.42])k.ball(p,C.trim,xx,1.38,-d*.52,.105,.105,.105,'wood');k.solid(x,z,w+.2,d+.2);return p}
function basket(k,p,x,y,z){k.box(p,'#ab8d62',x,y,z,.66,.34,.46,'wood');for(let i=0;i<4;i++)k.box(p,'#c9ae7b',x,y-.12+i*.08,z+.24,.67,.025,.018,'wood');k.box(p,'#645942',x,y+.18,z,.55,.012,.36);return p}
function teapot(k,p,x,y,z,color='#a6b092'){k.ball(p,color,x,y+.15,z,.23,.20,.20);k.cyl(p,C.cream,x,y+.32,z,.12,.035);k.ball(p,C.dark,x,y+.37,z,.045,.04,.045);k.beam(p,color,[x+.12,y+.15,z],[x+.33,y+.27,z],.055,'plain');const h=new T.Mesh(new T.TorusGeometry(.13,.03,6,16),k.box(p,color,x,y,z,.001,.001,.001).material);h.position.set(x-.20,y+.17,z);p.add(h)}
function barrel(k,x,z,s=1){k.cyl(k.fixed,'#997b55',x,.48*s,z,.39*s,.94*s,'wood');for(const y of [.13,.48,.83])k.cyl(k.fixed,'#73756a',x,y*s,z,.405*s,.055*s);k.cyl(k.fixed,'#b99b6c',x,.965*s,z,.39*s,.04*s,'wood');k.roundSolid(x,z,.43*s,{height:.99*s})}
function info(k,x,z,name,text){k.interact({x,z,type:'info',label:name,data:{name,text},radius:1.4})}

export function buildInn(){
 const k=createInteriorRoom({id:'inn',label:'Pousada Girassol',w:14,d:11,wall:'#ded0ad',returnTo:'village',returnSpawn:[9.5,2.1]}),F=k.fixed;
 rug(k,0,1.3,2.0,5.1,'#9b7768');rug(k,3,-.3,4.6,3.5,'#9caa88');
 const desk=group(F,-4.45,0,-3.75);k.box(desk,C.dark,0,.58,0,3.5,1.16,1.03,'wood');for(let i=0;i<10;i++)k.box(desk,i%2?C.oak:C.trim,-1.54+i*.34,.55,.53,.28,.97,.035,'wood');k.box(desk,'#c8aa76',0,1.21,0,3.75,.15,1.21,'wood');k.solid(-4.45,-3.75,3.75,1.21);
 const ledger=k.box(desk,'#8c9a7d',-.55,1.32,.18,.67,.09,.50,'fabric');ledger.rotation.y=.15;k.box(desk,'#e5d7b6',-.55,1.374,.18,.59,.014,.43);for(let i=0;i<5;i++)k.box(desk,'#a19878',-.55,1.386,.03+i*.075,.43,.003,.008);
 k.cyl(desk,'#b89a58',.7,1.34,.15,.13,.15);k.ball(desk,'#d0b66e',.7,1.43,.15,.15,.09,.15);k.ball(desk,C.dark,.7,1.54,.15,.035,.035,.035);
 for(let i=0;i<5;i++){k.box(F,C.oak,-5.8+i*.42,1.98,-5.34,.32,.53,.10,'wood');k.ball(F,'#c7a76d',-5.8+i*.42,1.93,-5.26,.035,.035,.025)}
 shelf(k,-6.05,-1.20,1.1,'jars');barrel(k,-5.8,4.25,.8);vase(k,F,-5.8,.85,4.25,'#c7ac78');
 const breakfast=table(k,-4.05,.4,3.5,1.35,.85);for(let i=0;i<3;i++){plate(k,breakfast,-1.08+i*1.0,.93,0,.29);if(i===1)pie(k,breakfast,-.06,1.00,0);else loaf(k,breakfast,-1.08+i*1.0,1.06,0)}basket(k,breakfast,1.05,1.18,.07);k.ball(breakfast,'#bb8e64',.91,1.41,.05,.11,.105,.10);k.ball(breakfast,'#a9b16f',1.12,1.40,.07,.10,.10,.10);
 const tea=table(k,3,.0,3.6,1.6,.83);for(const dx of [-1,1])for(const zz of [-1.35,1.35])chair(k,3+dx,.0+zz,zz>0?0:Math.PI);for(const dx of [-.9,.9]){plate(k,tea,dx,.91,0);cup(k,tea,dx,.94,-.45)}teapot(k,tea,0,.94,0,'#9ba98c');vase(k,tea,1.35,.93,.18,'#b59b72');
 const guest=bed(k,4.65,-3.82,'#9b8796',2.1,2.45);for(let i=0;i<4;i++)k.box(guest,'#c5acb7',-.75+i*.5,.9,.55,.022,.014,1.2);k.box(F,C.oak,2.93,1.32,-3.87,.10,2.64,2.65,'wood');k.solid(2.93,-3.87,.12,2.65,{height:2.64});for(let i=0;i<5;i++)k.box(F,'#c1b694',2.92,1.53,-4.8+i*.47,.04,1.79,.40,'fabric');
 const clock=group(F,.5,1.97,-5.32);k.box(clock,C.dark,0,0,0,.73,1.13,.19,'wood');k.cyl(clock,'#ded3ad',0,.20,.11,.28,.035).rotation.x=Math.PI/2;k.beam(clock,C.dark,[0,.20,.135],[0,.39,.135],.012,'plain');k.beam(clock,C.dark,[0,.20,.136],[.16,.16,.136],.014,'plain');const pendulum=group(k.dynamic,.5,1.78,-5.18);k.beam(pendulum,'#b69b65',[0,0,0],[0,-.45,0],.018,'plain');k.ball(pendulum,'#c8ae70',0,-.45,0,.095,.095,.035);k.animate((dt,t)=>pendulum.rotation.z=Math.sin(t*2.4)*.15);
 lantern(k,-1.6,2.2,-5.2);lantern(k,5.8,2.2,-5.2);
 npc(k,{name:'Olívia',text:'Seja bem-vindo à Pousada Girassol! O pão acabou de sair do forno. Os viajantes deixam histórias tão boas quanto as receitas da vila.',x:-4.6,z:-4.9,shirt:'#a29079',hair:'#79604b',seed:1});
 info(k,-3.9,1.55,'Mesa do café da manhã','Pão de milho, torta de frutas e geleia da estação. Olívia compra a colheita dos vizinhos para servir um café com gosto do campo.');
 info(k,-4.4,-2.35,'Caderno de hóspedes','Entre nomes e pequenas dedicatórias, um viajante desenhou uma ave azul perto do lago. Cada visita deixa uma lembrança na pousada.');
 info(k,4.8,-1.9,'Quarto dos viajantes','Colchas costuradas à mão, roupa de cama ao sol e um ramo de lavanda no travesseiro. Aqui, a pressa fica do lado de fora.');
 return k.finishRoom();
}

export function buildRosaHouse(){
 const k=createInteriorRoom({id:'rosaHouse',label:'Casa da Rosa',w:12,d:10,wall:'#ddd4bd',returnTo:'village',returnSpawn:[10.75,-7.0]}),F=k.fixed;
 rug(k,2.8,1.9,3.7,3.8,'#a58b96');rug(k,-3.3,-2.1,3.8,2.4,'#a3a585');
 const sew=table(k,-3.7,-3.1,3.35,1.25,.83);k.box(sew,'#b78e9a',.7,.92,.1,1.23,.055,.88,'fabric');for(let i=0;i<5;i++)k.box(sew,'#e1c7bd',.2+i*.23,.955,.1,.012,.006,.82);k.box(sew,'#596a63',-.55,1.01,0,.88,.16,.48);k.box(sew,'#53635c',-.77,1.31,-.04,.20,.55,.20);k.box(sew,'#53635c',-.49,1.53,-.04,.75,.18,.21);k.box(sew,'#53635c',-.15,1.36,-.04,.15,.38,.19);k.beam(sew,'#c3c7b2',[-.15,1.23,.01],[-.15,1.08,.01],.012,'plain');const handwheel=k.cyl(sew,C.dark,-.97,1.51,-.04,.20,.06);handwheel.rotation.z=Math.PI/2;for(let i=0;i<3;i++)k.cyl(sew,['#a68caa','#b4b486','#c58d7d'][i],.3+i*.24,1.08,-.35,.08,.23);chair(k,-3.7,-1.75);
 shelf(k,-4.55,-4.55,2.3,'jars');for(let j=0;j<3;j++)k.box(F,['#ae9aaf','#9ca77f','#c9ae88'][j],-4.9+j*.55,1.0,-4.2,.46,.15,.46,'fabric');
 const kitchen=group(F,3.65,0,-3.83);k.box(kitchen,'#a3a58a',0,.52,0,3.1,1.04,1.18,'wood');k.box(kitchen,C.trim,0,1.09,0,3.24,.12,1.28,'wood');for(const x of [-.95,0,.95]){k.box(kitchen,'#b7b799',x,.55,.61,.82,.78,.035,'wood');k.ball(kitchen,C.dark,x+.27,.59,.647,.035,.035,.026)}k.cyl(kitchen,'#a3b4a7',.65,1.18,0,.36,.08);k.cyl(kitchen,'#5e7c75',.65,1.225,0,.29,.012);k.beam(kitchen,C.iron,[.65,1.2,-.39],[.65,1.55,-.39],.026,'plain');k.beam(kitchen,C.iron,[.65,1.55,-.39],[.65,1.55,-.11],.026,'plain');k.solid(3.65,-3.83,3.24,1.28);vase(k,kitchen,-1.05,1.17,0,'#c39a80');
 for(let i=0;i<4;i++){const x=2.35+i*.7;k.box(F,C.oak,x,2.14,-4.77,.61,.83,.26,'wood');k.box(F,'#b5b6a0',x,2.13,-4.61,.49,.68,.035);k.ball(F,C.dark,x+.17,2.12,-4.57,.025,.025,.018)}
 const b=bed(k,3.7,1.6,'#9d8eaa',2.15,2.85);for(let row=0;row<3;row++)for(let col=0;col<4;col++)k.box(b,['#c3afa9','#acb29a','#b8a5c1','#d0bc9c'][(row+col)%4],-.80+col*.53,.90,-.16+row*.58,.49,.015,.54,'fabric');k.box(F,C.oak,5.1,.47,3.7,1.0,.94,.70,'wood');vase(k,F,5.1,.96,3.7,'#9ba7a1');k.solid(5.1,3.7,1,.7);
 const tea=table(k,-3.2,2.5,2.25,1.35,.78);teapot(k,tea,0,.88,-.10,'#b3a4b5');cup(k,tea,-.64,.87,.17);cup(k,tea,.67,.87,.17);plate(k,tea,.47,.88,-.24,.23);for(let i=0;i<3;i++)k.ball(tea,'#c8a16d',.35+i*.11,.92,-.2,.065,.025,.07);chair(k,-3.2,1.2,Math.PI);chair(k,-3.2,3.8);
 const wheel=group(F,-5.0,0,.15);k.box(wheel,C.dark,0,.17,0,.6,.16,.9,'wood');k.beam(wheel,C.oak,[0,.2,-.32],[0,1.15,0],.045);k.beam(wheel,C.oak,[0,.2,.32],[0,1.15,0],.045);const spin=group(k.dynamic,-5.0,.91,.15);const ring=new T.Mesh(new T.TorusGeometry(.49,.036,6,28),k.box(wheel,C.oak,0,.1,0,.001,.001,.001,'wood').material);spin.add(ring);for(let i=0;i<8;i++){const a=i*Math.PI/4;k.beam(spin,C.oak,[0,0,0],[Math.cos(a)*.47,Math.sin(a)*.47,0],.018)}k.solid(-5,.15,1.0,1.0);k.animate((dt,t)=>spin.rotation.z=t*.24);
 lantern(k,-1.8,2.2,-4.76);
 npc(k,{name:'Rosa',text:'Entre, a chaleira está no fogo! Conserto as roupas da vila e aproveito cada retalhinho. Esta colcha tem um pedaço da história de cada vizinho.',x:.0,z:-3.2,shirt:'#aa8b9b',hair:'#76604d',seed:2});
 info(k,-3.4,-.6,'Ateliê de costura','Carretéis de linha, retalhos floridos e uma máquina antiga bem cuidada. Rosa transforma roupa gasta em aventais para mais uma colheita.');
 info(k,-2.0,2.6,'Chá de erva-cidreira','O perfume das ervas secando na cozinha se mistura ao dos biscoitos. Uma boa conversa deixa a tarde do campo mais leve.');
 info(k,2.15,2.8,'Colcha de memórias','Quadradinhos em verde, lilás e terracota. Rosa costurou a primeira peça no inverno em que a vila plantou o pomar comunitário.');
 return k.finishRoom();
}

export function buildFisherHouse(){
 const k=createInteriorRoom({id:'fisherHouse',label:'Casa do Pescador',w:12,d:10,wall:'#d0d1bc',returnTo:'beach',returnSpawn:[-10,-1.3]}),F=k.fixed;
 rug(k,0,1.4,2.15,4.1,'#91a5a0');
 const gear=group(F,-3.75,0,-3.75);k.box(gear,C.oak,0,.24,0,3.4,.15,.78,'wood');k.box(gear,C.oak,0,1.72,-.25,3.4,.12,.15,'wood');for(const x of [-1.45,1.45])k.box(gear,C.dark,x,.91,-.25,.11,1.8,.14,'wood');for(let i=0;i<5;i++){const x=-1.17+i*.53;k.beam(gear,i%2?'#a48d60':'#7e7054',[x,.3,.04],[x+.23,2.75,-.04],.023,'wood');k.ball(gear,C.iron,x+.04,.68,.11,.07,.07,.032);k.beam(gear,'#cec7a7',[x+.23,2.75,-.04],[x+.23,.76,.08],.004,'plain');k.ball(gear,'#b77d62',x+.23,.83,.08,.025,.07,.025)}k.solid(-3.75,-3.75,3.6,.95);
 // Hanging net: a single static lattice, baked into the room instead of simulated rope.
 for(let i=0;i<9;i++){const x=-5.55+i*.42;const y=2.78-Math.sin(i/8*Math.PI)*.40;k.beam(F,'#b9b18a',[x,y,-4.73],[x+.18,.88,-4.73],.009,'plain')}for(let row=0;row<6;row++)for(let i=0;i<8;i++){const x=-5.55+i*.42,yy=2.65-row*.29-Math.sin(i/8*Math.PI)*.4;k.beam(F,'#b9b18a',[x,yy,-4.73],[x+.42,yy-.05,-4.73],.009,'plain')}
 barrel(k,-5.1,-1.0);barrel(k,-4.15,-1.3,.8);
 const rack=table(k,-4.25,1.4,2.0,1.0,.65);basket(k,rack,0,.91,0);for(let i=0;i<3;i++)k.ball(rack,['#9bafa5','#a7b9ad','#bbc3aa'][i],-.21+i*.21,1.12,.03,.08,.045,.23);
 for(let i=0;i<3;i++){const coil=group(F,-4.9+i*.55,.065,3.5);for(let j=0;j<3;j++){const loop=new T.Mesh(new T.TorusGeometry(.22-j*.055,.022,5,18),k.box(coil,'#b39c6d',0,0,0,.001,.001,.001).material);loop.rotation.x=Math.PI/2;loop.position.y=j*.022;coil.add(loop)}}
 bed(k,3.8,-3.2,'#7c9899',2.05,2.6);k.box(F,C.oak,5.0,.46,-.95,.90,.92,.65,'wood');lantern(k,5.0,1.2,-.95);k.solid(5,-.95,.9,.65);
 const map=table(k,3.65,1.65,3.0,1.7,.82);k.box(map,'#d9cca4',0,.915,0,1.95,.025,1.22);for(let i=0;i<9;i++){const a=i*.63;k.beam(map,'#87a9a1',[Math.sin(a)*.63,.933,Math.cos(a)*.38],[Math.sin(a+.5)*.63,.933,Math.cos(a+.5)*.38],.018,'plain')}k.box(map,'#80946f',.25,.94,.08,.48,.012,.31);k.box(map,'#a5ac7a',-.32,.942,-.12,.34,.012,.25);cup(k,map,1.02,.93,-.30,'#9aa9a0');k.cyl(map,C.iron,-1.09,1.0,.27,.12,.11);k.cyl(map,'#e0d2a6',-1.09,1.065,.27,.10,.012);chair(k,3.65,3.12);
 const boat=group(F,.05,1.61,-4.7);k.box(boat,C.oak,0,0,0,2.1,.18,.30,'wood');for(const side of [-1,1])k.beam(boat,'#b19a6e',[-1.0,0,side*.11],[.80,0,side*.21],.065,'wood');k.ball(boat,'#bca77e',.97,.02,0,.22,.085,.16,'wood');k.beam(boat,C.dark,[0,.07,0],[0,1.05,0],.024,'wood');k.box(boat,'#ddd6b9',.23,.59,.025,.43,.69,.018,'fabric');k.box(boat,'#9caa97',-.2,.45,.025,.34,.44,.018,'fabric');k.box(F,C.trim,0,1.42,-4.70,2.5,.10,.54,'wood');
 for(let i=0;i<5;i++)k.ball(F,i%2?'#d8c9b3':'#baaa9b',-.84+i*.38,1.51,-4.42,.12,.06,.09);
 npc(k,{name:'Marina',text:'Bento está lá no píer. Eu remendo as redes enquanto escuto o mar. A madeira deste barquinho veio de um tronco que a maré trouxe para a praia.',x:1.65,z:-1.5,shirt:'#8ca39c',hair:'#796248',hat:'#c4af7e',seed:3});
 info(k,-3.65,-2.3,'Varas e redes de pesca','Cada vara tem uma história. As redes remendadas secam ao abrigo do sal, prontas para acompanhar a próxima maré.');
 info(k,1.0,1.65,'Carta do litoral','Marina marcou os bancos de areia, o píer e o farol. Pequenos círculos de lápis mostram onde os peixes costumam se reunir ao amanhecer.');
 info(k,0,-3.2,'Barquinho de madeira','Um pequeno barco feito à mão, cercado de conchas de muitas cores. Um lembrete de que o mar sempre devolve alguma surpresa.');
 return k.finishRoom();
}