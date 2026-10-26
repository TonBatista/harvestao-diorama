import * as T from './three.module.js';
import {createInteriorRoom,group,C,table,chair,shelf,rug,vase,lantern,npc} from './rural-room.js?v=0.24';

const botanicals=['#80936c','#9ea57d','#bc9b8d','#d6c68d'];
function info(k,x,z,name,text,radius=1.35){k.interact({x,z,label:name,type:'info',data:{name,text},radius})}
function book(k,p,x,y,z,color='#8c9874',open=false){
 const b=group(p,x,y,z);k.box(b,color,0,0,0,.49,.065,.37,'fabric');k.box(b,'#e6d9ba',0,.045,0,.45,.045,.33);
 if(open){for(const s of[-1,1]){const page=k.box(b,'#efe1c1',s*.125,.079,0,.235,.012,.31);page.rotation.z=s*.07;for(let i=0;i<4;i++)k.box(b,'#b9ab8b',s*.125,.089,-.10+i*.062,.16,.003,.008)}k.box(b,'#b7926a',0,.092,.015,.017,.012,.35)}
 else{k.box(b,color,0,.08,0,.49,.022,.37,'fabric');k.box(b,'#c9b788',-.20,.084,0,.018,.008,.32)}return b;
}
function pew(k,x,z,w=3.3){const p=group(k.fixed,x,0,z);for(const dx of[-w*.39,w*.39]){k.box(p,C.dark,dx,.25,0,.13,.50,.67,'wood');k.box(p,C.oak,dx,.65,-.31,.13,.81,.12,'wood')}k.box(p,'#b19467',0,.51,.02,w,.13,.71,'wood');for(const y of[.74,.97])k.box(p,'#aa875a',0,y,-.29,w,.19,.12,'wood');for(const dx of[-w*.48,w*.48]){k.box(p,C.oak,dx,.76,.02,.14,.12,.77,'wood');k.box(p,C.oak,dx,.64,.30,.12,.35,.12,'wood')}k.solid(x,z,w+.06,.83);return p}
function cupboard(k,x,z,w=2.4){const g=group(k.fixed,x,0,z);k.box(g,C.dark,0,1,-.25,w,2,.1,'wood');for(const s of[-1,1])k.box(g,C.oak,s*(w/2-.05),1,0,.1,2,.65,'wood');for(const y of[.18,.78,1.38,2.03])k.box(g,C.trim,0,y,.02,w,.10,.72,'wood');k.solid(x,z,w,.76);return g}
function bottle(k,p,x,y,z,color='#a0b7a5',r=.10){k.cyl(p,color,x,y+r*1.5,z,r,r*3);k.cyl(p,color,x,y+r*3.1,z,r*.40,r*.46);k.box(p,'#e5d5b5',x,y+r*1.6,z+r+.003,r*1.2,r*.8,.012);k.cyl(p,'#a38c62',x,y+r*3.4,z,r*.5,r*.25)}
function leafPrint(k,x,z){const g=group(k.fixed,x,1.78,z);k.box(g,C.oak,0,0,0,1.22,1.46,.08,'wood');k.box(g,'#e2d5b6',0,0,.046,1.07,1.30,.018);for(let i=0;i<5;i++){const y=-.4+i*.19,s=i%2?-1:1;k.beam(g,'#85946a',[0,-.5,.061],[0,.48,.061],.012,'plain');const l=k.ball(g,'#8fa177',s*.14,y,.064,.21,.065,.019);l.rotation.z=s*.4}return g}

export function buildChapel(){
 const k=createInteriorRoom({id:'chapel',label:'Capela das Estações',w:12,d:11,wall:'#ded6bd',returnTo:'village',returnSpawn:[-9.5,-6.5]}),F=k.fixed;
 rug(k,0,.35,1.65,8.5,'#a69b82');for(const x of[-.72,.72])k.box(F,'#d5c398',x,.068,.35,.035,.01,8.2);
 for(const z of[-.75,1.35,3.45])for(const s of[-1,1])pew(k,s*3.15,z,3.25);
 // A timber-framed stained glass garden catches the warm afternoon light.
 const glass=group(F,0,0,-5.35);k.box(glass,C.dark,0,2.03,0,2.65,2.55,.14,'wood');
 const glassColors=['#a0b4a1','#c2a37e','#b5a2b4','#d6c58d','#9fbfc0','#b2be91'];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){const c=glassColors[(row*3+col)%glassColors.length],m=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.22,roughness:.48});m.userData.regionOwned=true;k.box(glass,m,-.78+col*.78,1.22+row*.75,.09,.72,.68,.025)}
 for(const x of[-1.21,-.4,.4,1.21])k.box(glass,C.trim,x,2.02,.12,.055,2.40,.06,'wood');for(const y of[.84,1.60,2.36,3.18])k.box(glass,C.trim,0,y,.12,2.49,.055,.06,'wood');
 const rosette=k.cyl(glass,'#d2b77b',0,2.10,.18,.27,.035);rosette.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4,petal=k.ball(glass,i%2?'#c5a39e':'#a9bb93',Math.cos(a)*.40,2.1+Math.sin(a)*.4,.19,.21,.115,.018);petal.rotation.z=a}
 const altar=table(k,0,-3.83,3.4,1.22,1.02);k.box(altar,'#ece0c7',0,1.105,0,3.50,.055,1.30,'fabric');for(const s of[-1,1])k.box(altar,'#c3b68f',s*1.52,.90,.61,.18,.42,.025,'fabric');vase(k,altar,0,1.15,-.13,'#b69c7c');
 const flames=[];for(const s of[-1,1]){k.cyl(altar,'#b4a173',s*1.15,1.17,.02,.15,.055);k.cyl(altar,'#e7d6ac',s*1.15,1.37,.02,.065,.37);const flame=k.ball(k.dynamic,'#e4b86b',s*1.15,1.62,-3.81,.045,.10,.045);flame.material.emissive?.set('#b57931');flame.material.emissiveIntensity=.25;flames.push(flame)}k.animate((dt,time)=>flames.forEach((f,i)=>{f.scale.y=.10+Math.sin(time*3.2+i)*.012;f.rotation.z=Math.sin(time*2.3+i)*.09}));
 const lectern=group(F,-4.33,0,-3.85);k.box(lectern,C.dark,0,.18,0,.85,.18,.72,'wood');k.box(lectern,C.oak,0,.74,0,.24,1.05,.24,'wood');const lecternTop=k.box(lectern,C.trim,0,1.30,0,1.08,.10,.72,'wood');lecternTop.rotation.x=.14;book(k,lectern,0,1.41,.02,'#947d6c',true);k.solid(-4.33,-3.85,1.1,.80);
 for(const s of[-1,1]){const stand=table(k,s*4.65,-2.0,.64,.64,.72);vase(k,stand,0,.81,0,s>0?'#a9b99b':'#b398a0');lantern(k,s*5.70,2.20,-.8)}
 const memories=table(k,4.65,3.75,1.35,.9,.77);book(k,memories,0,.90,0,'#9a9e7f',true);k.cyl(memories,'#aa8b63',-.42,.96,-.20,.045,.19);k.beam(memories,'#6a7062',[-.42,1.03,-.20],[-.36,1.29,-.21],.012,'plain');
 npc(k,{name:'Dona Célia',text:'Toda estação traz um presente. Na primavera, plantamos flores; no outono, dividimos a colheita. Esta porta fica sempre aberta para uma pausa.',x:3.55,z:-3.55,shirt:'#a198ac',hair:'#a9a08a',seed:2});
 info(k,0,-2.65,'Flores das estações','As famílias da vila trazem flores de seus quintais. Ramos secos e sementes guardam as lembranças do último outono.');
 info(k,-4.3,-2.8,'Caderno de gratidão','Entre as páginas estão receitas, agradecimentos pela chuva e desenhos das primeiras colheitas de cada família.');
 info(k,4.65,2.70,'Livro de lembranças','Cada viajante deixa uma lembrança do vale. Há uma pena de bem-te-vi, uma folha de ipê e um desenho da antiga ponte.');
 return k.finishRoom();
}

export function buildLibrary(){
 const k=createInteriorRoom({id:'library',label:'Biblioteca do Vale',w:13,d:10.5,wall:'#d3d8c0',returnTo:'village',returnSpawn:[2.3,-7.3]}),F=k.fixed;
 for(const [x,w]of[[-5.4,1.65],[0,2.6],[5.4,1.65]])shelf(k,x,-4.55,w,'books');
 rug(k,.7,.45,4.35,4.25,'#9da58a');for(const x of[-1.24,2.64])k.box(F,'#d5c8a2',x,.066,.45,.055,.012,3.91);
 const reading=table(k,2.10,-.20,2.6,1.9,.80);for(const [x,z,a]of[[2.10,1.35,Math.PI],[3.90,-.2,-Math.PI/2]])chair(k,x,z,a);book(k,reading,-.60,.91,.22,'#8b9a77',true);book(k,reading,.60,.91,-.24,'#aa8b75',true);vase(k,reading,0,.92,-.53,'#b3a07b');
 const desk=table(k,-4.35,-1.35,2.35,1.2,.84);chair(k,-4.35,-2.30);book(k,desk,-.30,.95,.05,'#8c987a',true);for(let j=0;j<3;j++)book(k,desk,.72,.94+j*.10,-.15,['#b0957c','#8da295','#aa93a3'][j]);k.cyl(desk,'#686e62',-.85,1,-.28,.075,.13);k.beam(desk,'#c5b58f',[-.85,1.04,-.28],[-.72,1.39,-.30],.012,'plain');
 const card=table(k,-4.5,2.13,2.45,1.15,.72);for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=-.85+col*.57,y=.92+row*.28;k.box(card,'#b39b70',x,y,0,.52,.24,.76,'wood');k.box(card,C.dark,x,y,.392,.15,.045,.035);k.box(card,'#e1d4b2',x,y+.067,.398,.30,.065,.009)}k.solid(-4.5,2.13,2.45,1.15);
 leafPrint(k,-6.35,-2.65);lantern(k,-6.28,2.25,1.0);lantern(k,3.1,2.55,-5.1);
 // The herbarium's pressed leaves and bird models are simple baked silhouettes.
 const display=table(k,4.85,2.25,1.65,1.2,.79);book(k,display,-.32,.90,.08,'#829273',true);for(let i=0;i<3;i++){const a=.3+i*.6,l=k.ball(display,botanicals[i],-.40+Math.sin(a)*.10,.997,-.02+i*.10,.12,.009,.04);l.rotation.y=a}k.cyl(display,C.trim,.47,.92,-.17,.20,.06);k.ball(display,'#ae9b75',.47,1.09,-.17,.18,.14,.22);k.ball(display,'#b2a382',.47,1.25,-.01,.11,.12,.10);k.ball(display,'#424c3a',.42,1.27,.07,.017,.025,.013);k.beam(display,'#a68a62',[.47,1.20,.07],[.47,1.20,.22],.025,'plain');
 const clock=group(k.dynamic,-6.20,2.05,.1);k.box(clock,C.oak,0,0,0,.19,1.14,.61,'wood');const pendulum=k.ball(clock,'#b6a173',.13,-.23,.01,.05,.13,.15);k.animate((dt,time)=>{pendulum.rotation.x=Math.sin(time*2)*.18;pendulum.position.z=Math.sin(time*2)*.08});
 npc(k,{name:'Lia',text:'Separei um herbário e os cadernos das aves do vale. Quem observa a natureza com calma sempre encontra uma história para contar.',x:4.85,z:-2.35,shirt:'#819ba0',hair:'#7a624b',seed:4});
 info(k,-4.35,-.15,'Almanaque do campo','As margens guardam anotações dos agricultores: semear na estação certa, devolver folhas à terra e observar a chuva antes de regar.');
 info(k,1.65,2.25,'Mesa de leitura','Há um mapa desenhado à mão, histórias dos primeiros moradores e um caderno para registrar o canto dos pássaros ao amanhecer.');
 info(k,4.85,3.45,'Herbário e aves do vale','Folhas prensadas e desenhos ajudam a reconhecer espécies. O Urutau se confunde com os troncos; o bem-te-vi costuma anunciar a manhã.');
 info(k,-4.5,3.22,'Arquivo de sementes','Pequenos envelopes guardam sementes antigas trocadas entre famílias. Cada gaveta tem uma estação, um nome e uma lembrança.');
 return k.finishRoom();
}

export function buildClinic(){
 const k=createInteriorRoom({id:'clinic',label:'Clínica da Clara',w:12,d:10,wall:'#d8ddca',returnTo:'village',returnSpawn:[-10.7,12.5]}),F=k.fixed;
 rug(k,1.5,2.10,3.1,2.75,'#a0af9b');
 const bed=group(F,-3.72,0,-.65);for(const sx of[-.90,.90])for(const sz of[-1.36,1.36])k.cyl(bed,'#81948b',sx,.42,sz,.06,.80);k.box(bed,C.iron,0,.68,0,2.05,.12,3.08);k.box(bed,'#e3dfc7',0,.86,0,2.0,.28,3.0,'fabric');k.box(bed,'#b0bfa7',0,1.03,.42,2.04,.095,2.12,'fabric');k.box(bed,'#efe7cf',0,1.075,-1.04,1.61,.19,.65,'fabric');for(const sx of[-.92,.92])k.beam(bed,'#8b9c92',[sx,.65,-1.51],[sx,1.45,-1.51],.045,'plain');k.beam(bed,'#8b9c92',[-.92,1.43,-1.51],[.92,1.43,-1.51],.045,'plain');k.solid(-3.72,-.65,2.15,3.15);
 const screen=group(F,-2.15,0,-3.6);for(let col=0;col<3;col++){const x=-.63+col*.63,section=group(screen,x,0,(col%2)*.12);section.rotation.y=col%2?-.16:.16;for(const s of[-1,1])k.cyl(section,C.oak,s*.31,.90,0,.035,1.75);k.box(section,'#becab2',0,1.05,0,.56,1.18,.04,'fabric');for(const y of[.42,1.68])k.box(section,C.trim,0,y,0,.60,.055,.065,'wood')}k.solid(-2.15,-3.6,2.02,.48);
 const medicines=cupboard(k,3.85,-4.33,2.8);for(let row=0;row<3;row++)for(let col=0;col<6;col++){const x=-1.05+col*.42,y=.24+row*.60; bottle(k,medicines,x,y,.08,['#8fa99a','#c0b082','#a996aa','#9bb0ab'][(row+col)%4],.08+(col%2)*.012)}
 const basin=group(F,-.10,0,-4.25);k.box(basin,'#b2b99e',0,.50,0,1.85,1,.85,'wood');k.box(basin,'#dedbc6',0,1.05,0,1.98,.12,.97,'stone');k.ball(basin,'#dce2d6',-.27,1.13,0,.59,.10,.34);k.ball(basin,'#9fbdb6',-.27,1.16,0,.42,.018,.25);k.beam(basin,'#87968f',[.36,1.14,-.21],[.36,1.48,-.21],.035,'plain');k.beam(basin,'#87968f',[.36,1.48,-.21],[.09,1.48,-.21],.035,'plain');bottle(k,basin,.69,1.14,.13,'#bdc8a7',.075);k.solid(-.10,-4.25,1.98,1.03);
 const desk=table(k,2.68,-1.88,2.36,1.28,.80);chair(k,2.68,-2.96);book(k,desk,-.46,.92,.08,'#a1ab8b',true);k.box(desk,'#ece3cb',.48,.90,.17,.53,.035,.39);k.box(desk,'#9eaa9c',.48,.95,.17,.13,.017,.34);k.box(desk,'#9eaa9c',.48,.95,.17,.34,.017,.13);k.cyl(desk,'#aaa183',.83,.99,-.32,.10,.22);for(let i=0;i<3;i++)k.beam(desk,['#918475','#839a8f','#b2997f'][i],[.77+i*.05,1.05,-.32],[.79+i*.05,1.29,-.32],.012,'plain');
 pew(k,3.7,1.85,2.7);const waiting=table(k,4.85,3.48,.8,.7,.61);vase(k,waiting,0,.69,0,'#bba58c');
 const care=table(k,-3.73,2.18,1.72,.88,.70);for(let j=0;j<3;j++)k.box(care,'#ece2cb',-.45+j*.42,.83,.10,.30,.12,.43,'fabric');k.box(care,'#a0ad9c',.10,.85,-.23,.62,.18,.28);k.box(care,'#dedcc1',.10,.952,-.23,.14,.018,.21);k.box(care,'#dedcc1',.10,.952,-.23,.33,.018,.08);leafPrint(k,-5.85,1.55);lantern(k,-5.85,2.25,-2.3);
 // A tiny kettle breathes above a shelf of mountain herbs; just two cheap meshes move.
 const tea=table(k,-4.48,-4.25,1.72,.82,.74);k.cyl(tea,'#9f967f',0,.93,0,.19,.28);k.cyl(tea,'#b5a78b',0,1.10,0,.20,.06);k.ball(tea,'#8d846d',0,1.15,0,.045,.045,.045);const steam=[];for(let i=0;i<2;i++){const puff=k.ball(k.dynamic,'#dce0d0',-4.48+i*.08,1.32+i*.18,-4.25,.05,.12,.05);puff.castShadow=false;steam.push(puff)}k.animate((dt,time)=>steam.forEach((p,i)=>{p.position.y=1.30+((time*.13+i*.22)%.65);p.position.x=-4.48+Math.sin(time*.8+i)*.055;p.scale.set(.04,.10,.04)}));
 npc(k,{name:'Clara',text:'Aqui até o chá tem gosto de montanha. Cuide do corpo como cuida da terra: água, alimento e descanso fazem parte de uma boa colheita.',x:.86,z:-1.90,shirt:'#d7ddcd',hair:'#8a735b',seed:1});
 info(k,-3.73,3.24,'Cuidados da fazenda','Panos limpos, ataduras e uma caixinha de primeiros socorros ficam prontos para os pequenos arranhões da rotina no campo.');
 info(k,3.85,-3.18,'Botica da Clara','Potes de camomila, erva-cidreira e folhas secas da montanha. Cada etiqueta traz a data da coleta e o nome de quem trouxe as ervas.');
 info(k,-.10,-3.08,'Lavar as mãos','A bacia de cerâmica recebe água fresca do poço. Um sabonete de lavanda perfuma a sala de atendimento.');
 info(k,3.70,3.05,'Sala de espera','Um banco de madeira, uma manta e histórias da vila tornam a espera mais acolhedora. Pela janela entram os sons da praça.');
 return k.finishRoom();
}