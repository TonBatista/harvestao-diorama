import * as T from './three.module.js';
import {part,mergeParts} from './wildlife-art.js?v=0.27';
const boxGeometry=new T.BoxGeometry(1,1,1),dummyMaterial=new T.MeshBasicMaterial();
function box(g,c,x,y,z,w,h,d){const m=new T.Mesh(boxGeometry,dummyMaterial);m.position.set(x,y,z);m.scale.set(w,h,d);m.userData.featherColor=c;g.add(m);return m}
function wheel(parent,x,z,r,width){const w=new T.Group();w.position.set(x,r,z);parent.add(w);let tire=part(w,'cylinder','#383d35',0,0,0,r,width,r);tire.rotation.z=Math.PI/2;const side=Math.sign(x);let hub=part(w,'cylinder','#b68b56',side*(width/2+.006),0,0,r*.49,.025,r*.49);hub.rotation.z=Math.PI/2;for(let i=0;i<12;i++){const a=i*Math.PI/6,b=box(w,'#45483e',0,Math.cos(a)*r*.96,Math.sin(a)*r*.96,width*1.05,.065,r*.23);b.rotation.x=a}mergeParts(w);return w}
export function createTractor(){
 const root=new T.Group();root.name='little-vintage-tractor';const body=new T.Group();root.add(body);
 box(body,'#516852',0,.45,0,.75,.18,1.65);box(body,'#859b73',0,.94,.55,.72,.62,1.02);box(body,'#a3b48a',0,1.265,.55,.69,.05,1.02);
 box(body,'#424c42',0,.91,1.074,.60,.43,.025);for(let i=0;i<7;i++)box(body,'#bac0a1',-.25+i*.083,.91,1.094,.024,.38,.022);
 for(const side of [-1,1]){box(body,'#82956b',side*.55,.84,-.54,.39,.09,.89);box(body,'#647b5e',side*.37,.53,-.15,.22,.10,.65);part(body,'oval','#e9d8a6',side*.27,1.12,1.10,.085,.075,.025)}
 box(body,'#655b48',0,.87,-.52,.45,.12,.37);const back=box(body,'#6e6250',0,1.055,-.73,.45,.36,.08);back.rotation.x=-.12;
 const steering=part(body,'cylinder','#5f6355',0,.98,-.10,.025,.43,.025);steering.rotation.x=-.4;
 const ring=new T.Mesh(new T.TorusGeometry(.16,.024,5,14),dummyMaterial);ring.userData.featherColor='#4d5849';ring.position.set(0,1.16,-.16);ring.rotation.x=.9;body.add(ring);
 part(body,'cylinder','#666f5b',.22,1.52,.74,.045,.66,.045);part(body,'cylinder','#a5a88c',.22,1.87,.74,.065,.045,.065);box(body,'#b79563',0,.48,-1.05,.15,.12,.40);
 for(let i=0;i<5;i++)box(body,'#b4aa8a',-.365,.98,.26+i*.13,.018,.12,.045);
 mergeParts(body);
 const wheels=[wheel(root,-.57,-.59,.48,.27),wheel(root,.57,-.59,.48,.27),wheel(root,-.46,.78,.30,.20),wheel(root,.46,.78,.30,.20)];
 const cutter=new T.Group();root.add(cutter);box(cutter,'#8d9d72',0,.17,-1.23,1.58,.16,.62);box(cutter,'#6f7f58',0,.14,-1.48,1.63,.10,.06);mergeParts(cutter);
 const trailer=new T.Group();root.add(trailer);trailer.position.z=-2.75;const frame=new T.Group();trailer.add(frame);
 box(frame,'#a39168',0,.47,0,1.36,.12,1.75);for(const side of [-1,1]){box(frame,'#a79770',side*.67,.73,0,.07,.44,1.84);box(frame,'#c0ac7c',side*.67,.98,0,.09,.08,1.84)}for(const z of[-.86,.86])box(frame,'#9c8b63',0,.73,z,1.40,.44,.08);box(frame,'#767d62',0,.31,1.24,.10,.12,.75);mergeParts(frame);
 const trailerWheels=[wheel(trailer,-.74,-.05,.29,.19),wheel(trailer,.74,-.05,.29,.19)];const cargo=new T.Group();trailer.add(cargo);cargo.position.set(0,.52,0);let cargoKey;
 function setCargo(value){const key=value?.species||value?.speciesId||(value?'cow':'');if(key===cargoKey)return;cargoKey=key;for(const child of cargo.children)child.geometry?.dispose();cargo.clear();if(!key)return;const g=new T.Group();cargo.add(g);const sheep=key==='sheep',chicken=key==='chicken';if(chicken){part(g,'oval','#efe3be',0,.24,0,.22,.23,.27);part(g,'oval','#eee7d1',0,.46,.18,.13,.14,.13);part(g,'cone','#c8a15d',0,.44,.31,.055,.15,.055).rotation.x=Math.PI/2;part(g,'oval','#b7785d',0,.59,.17,.055,.07,.04)}else{part(g,'oval',sheep?'#dfdbc3':'#e6dfc9',0,.37,0,.39,.32,.57);part(g,'oval',sheep?'#a99f7b':'#e6ddc4',0,.59,.48,.26,.25,.25);part(g,'oval',sheep?'#b5aa88':'#c3a28a',0,.52,.67,.22,.14,.14);for(const side of[-1,1]){part(g,'oval','#9a8b6f',side*.28,.65,.48,.11,.05,.09);part(g,'oval','#3e4538',side*.15,.65,.65,.022,.028,.015);for(const z of[-.33,.31])part(g,'cylinder','#9c9378',side*.23,.12,z,.065,.25,.065)}if(!sheep){for(const [x,y,z]of[[-.27,.52,-.17],[.23,.53,.11],[-.08,.63,-.32]])part(g,'oval','#646b59',x,y,z,.16,.10,.17)}}mergeParts(g)}
 return {root,cutter,trailer,setCargo,animate(distance,cutterOn,trailerDistance=distance){wheels.forEach((w,i)=>w.rotation.x+=distance/(i<2?.48:.30));trailerWheels.forEach(w=>w.rotation.x+=trailerDistance/.29);cutter.visible=cutterOn;}};
}