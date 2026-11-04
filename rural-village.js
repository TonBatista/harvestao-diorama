import * as T from './three.module.js';
import {createInteriorRoom,group,C,table,chair,shelf,rug,vase,lantern,npc} from './rural-room.js?v=0.43';
import {addResident,NEW_RESIDENTS} from './new-residents.js?v=0.43';
import {colliderContains} from './scene-collisions.js?v=0.43';

export function buildGazebo(k){
 const F=k.fixed,z=1.7;
 k.cyl(F,'#b5aa8d',0,.12,z,2.02,.24,'stone');k.cyl(F,'#beaa7b',0,.29,z,1.88,.13,'wood');
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.sin(a)*1.73,zz=z+Math.cos(a)*1.73;k.cyl(F,'#998061',x,1.61,zz,.07,2.60,'wood');k.ball(F,'#d0bb91',x,2.77,zz,.13,.12,.13,'wood');if(i!==0&&i!==7){const b=a+Math.PI/4,xx=Math.sin(b)*1.73,z2=z+Math.cos(b)*1.73;for(const y of[.78,1.13])k.beam(F,'#c5b08a',[x,y,zz],[xx,y,z2],.045,'wood');for(let j=1;j<4;j++){const t=j/4;k.cyl(F,'#b69d75',x+(xx-x)*t,.79,zz+(z2-zz)*t,.026,.66,'wood')}}}
 k.mesh(F,new T.ConeGeometry(2.35,1.22,8),'#7b8e78',0,3.28,z,1,1,1,'clay');k.cyl(F,'#d5bb85',0,3.96,z,.08,.35,'wood');k.ball(F,'#cab27d',0,4.18,z,.13,.17,.13);
 k.box(F,'#b0a17e',0,.07,3.93,1.25,.14,.60,'stone');k.box(F,'#c4b18a',0,.19,3.58,1.25,.12,.42,'wood');
 // The raised platform is an architectural object; its perimeter stays solid.
 k.roundSolid(0,z,1.87);k.interact({x:0,z:4.65,type:'info',label:'Praça São Benedito',data:{name:'Praça São Benedito',text:'O coreto da Vila Santa Cruz reúne música, histórias e encontros à sombra das quatro árvores floridas.'},radius:1.45});
}
const home=(id,names,ids=[],color='#c9c1a4')=>({id,names,ids,color});
const groups={
 'farm:village':[home('joana','Joana'),home('clara','Clara'),home('miguel','Miguel'),home('lia','Lia'),home('helena','Helena',['helena']),home('cecilia','Dona Cecília',['cecilia'])],
 'mountain:village':[home('aurora','Aurora',['aurora']),home('ravi','Ravi',['ravi']),home('celia','Dona Célia'),home('olivia','Olívia')],
 'beach:village':[home('emerson','Mestre Emerson',['emerson']),home('bianca','Bianca',['bianca']),home('monica','Mônica',['monica']),home('thomas','Thomas',['nico']),home('dandara','Dandara',['dandara']),home('davi','Davi',['davi'])],
 'lake:mountain':[home('familia','Vó Cidinha e Vô Batista',['cidinha','batista'],'#83a279'),home('caio','Caio',['caio'])],
 'beach:farm':[home('antonio','Seu Antônio',['antonio']),home('bento','Bento e Marina')],
 'farm:mountain':[home('tome','Tomé')]
};
const allHomes=Object.values(groups).flat();
function flowerPot(k,x,z,s=1){k.cyl(k.fixed,'#b68c69',x,.18*s,z,.23*s,.36*s,'clay');for(let i=0;i<5;i++){const a=i*2.4,xx=x+Math.sin(a)*.21*s,zz=z+Math.cos(a)*.21*s;k.plant(xx,zz,.52*s,'#7d9a60');for(let j=0;j<5;j++){const b=j*Math.PI*2/5;k.ball(k.fixed,i%2?'#d7a7b5':'#e3d69d',xx+Math.sin(b)*.06*s,.54*s,zz+Math.cos(b)*.06*s,.055*s,.025*s,.055*s)}}}
function laika(k,x,z){
 const g=group(k.dynamic,x,0,z,.3);g.name='Laika';g.userData.seasonalExclude=true;
 k.ball(g,'#ede7d8',0,.43,0,.24,.25,.43);k.ball(g,'#c5a47c',.14,.52,-.13,.14,.13,.20);k.ball(g,'#e8e2d3',0,.68,.38,.23,.24,.22);k.ball(g,'#eee8db',0,.60,.58,.15,.105,.16);k.ball(g,'#473e34',0,.65,.71,.065,.045,.037);
 for(const side of[-1,1]){k.ball(g,'#c5a47c',side*.20,.65,.36,.09,.17,.11);k.ball(g,'#3b3933',side*.092,.76,.557,.027,.036,.017)}
 const legs=[];for(const sx of[-.17,.17])for(const zz of[-.27,.25]){const l=group(g,sx,.31,zz);k.cyl(l,'#e8e2d3',0,-.12,0,.068,.25);k.ball(l,'#eee6d7',0,-.245,.045,.09,.065,.13);legs.push(l)}
 const tail=group(g,0,.53,-.39);const t=k.ball(tail,'#c3a47b',0,.09,-.11,.065,.11,.17);t.rotation.x=.5;k.cyl(g,'#a092b4',0,.48,.26,.245,.07,'fabric').rotation.x=Math.PI/2;
 k.interact({x,z:z+.7,type:'talk',label:'Fazer carinho na Laika',data:{name:'Laika',text:'Au! Laika abana o rabinho e recebe você na casa da Vó Cidinha e do Vô Batista.'},radius:1.25});g.traverse(o=>o.userData.seasonalExclude=true);k.animate((dt,time)=>{tail.rotation.y=Math.sin(time*7)*.43;g.rotation.y=.3+Math.sin(time*.45)*.12;g.position.y=Math.sin(time*2)*.007;legs.forEach((l,i)=>l.rotation.x=Math.sin(time*1.5+i)*.025)});
}
export function buildLaneHomes(k,state,route){
 const list=groups[[route.from,route.to].sort().join(':')]||[],lots=[];
 list.forEach((h,i)=>{const x=i%2?8.4:-8.4,z=-17+Math.floor(i/2)*15;
  // Clear only decorative foliage under a new homestead, preserving the main trail.
  const inside=(px,pz)=>Math.abs(px-x)<3.4&&Math.abs(pz-z)<4.1;
  for(const o of [...k.fixed.children])if(inside(o.position.x,o.position.z))k.fixed.remove(o);
  for(let j=k.colliders.length-1;j>=0;j--)if(inside(k.colliders[j].x,k.colliders[j].z))k.colliders.splice(j,1);
  for(let j=k.treePositions.length-1;j>=0;j--)if(inside(k.treePositions[j].x,k.treePositions[j].z))k.treePositions.splice(j,1);
  k.house(x,z,4.6,3.6,h.color,i%2?'#8b7890':'#82917c');
  k.path(x,z+2.9,1.35,2.2,'#bba580');const edge=x>0?x-2.8:x+2.8;k.path((x+edge)/2,z+3.65,Math.abs(x-edge)+1.2,1.3,'#bba580');
  // A short garden path connects each door with the winding shared lane.
  const roadX=3.6*Math.sin((z+3.65)*Math.PI/28)*Math.sin(Math.PI*Math.max(0,Math.min(1,(z+33.65)/60)));
  k.path((edge+roadX)/2,z+3.65,Math.abs(edge-roadX)+.7,1.1,'#bba580');
  for(const sx of[-1,1]){flowerPot(k,x+sx*1.85,z+2.10);k.plant(x+sx*2.65,z-.4,.85,'#8b9e6c')}
  k.sign(x+2.55,z+2.2,'Casa de '+h.names);k.portal({x,z:z+2.50,to:'residentHome',label:'Casa de '+h.names,radius:1.1,autoRadius:.65,data:{homeId:h.id,returnSpawn:[x,z+3.7]}});
  if(h.id==='familia'){
   const dish=group(k.fixed,x+1.05,4.1,z-.5,-.4);const bowl=new T.Mesh(new T.SphereGeometry(1.12,24,12,0,Math.PI*2,0,Math.PI*.43),new T.MeshStandardMaterial({color:'#d3d4c4',side:T.DoubleSide,roughness:.75}));bowl.material.userData.regionOwned=true;bowl.rotation.x=.5;dish.add(bowl);k.cyl(dish,'#7e8477',0,-.65,0,.055,1.3);for(let j=0;j<3;j++){const a=j*Math.PI*2/3;k.beam(dish,'#8b9184',[Math.sin(a)*.80,.2,Math.cos(a)*.80],[0,1.1,.35],.018,'plain')}k.ball(dish,'#979e90',0,1.1,.35,.10,.10,.17);
   for(let j=0;j<8;j++)flowerPot(k,x-2.7+(j%4)*1.8,z-2.7+Math.floor(j/4)*5.7,.8);laika(k,x-1.15,z+3.1);
  }
  lots.push({x,z,id:h.id});
 });return lots;
}
export function buildResidentHome(state={}){
 const h=allHomes.find(h=>h.id===state.residentHome)||allHomes[0],family=h.id==='familia';
 const k=createInteriorRoom({id:'residentHome',label:'Casa de '+h.names,w:12,d:10,wall:family?'#b7c9a1':h.color,returnTo:'valleyTrail',returnSpawn:state.residentHomeDoor||[0,12]}),F=k.fixed;
 rug(k,0,1.5,3.2,3.5,family?'#baa276':'#9fa88a');shelf(k,-4.5,-4.3,2.1,'books');
 const tea=table(k,1.4,.7,2.8,1.6,.8);chair(k,1.4,-.6);chair(k,1.4,2,Math.PI);vase(k,tea,0,.9,0,'#a58db1');for(const dx of[-.8,.8]){k.cyl(tea,'#ded9bd',dx,.97,.1,.11,.19);k.cyl(tea,'#72583d',dx,1.07,.1,.084,.008)}
 k.box(F,'#8f9f79',3.8,.6,-3.7,2.8,1.2,1.0,'wood');k.box(F,C.trim,3.8,1.24,-3.7,3,.12,1.15,'wood');k.solid(3.8,-3.7,3,1.15);vase(k,F,4.5,1.32,-3.7);
 const couch=group(F,-3.8,0,1.6);k.box(couch,'#9c9d79',0,.46,0,1.35,.38,2.5,'fabric');k.box(couch,C.oak,-.62,.75,0,.15,.85,2.6,'wood');k.solid(-3.8,1.6,1.5,2.65);
 for(const x of[-4.8,4.8])vase(k,F,x,.0,3.7,'#bca16d');lantern(k,-.8,2.2,-4.75);
 if(family){addResident(k,'cidinha',state,{x:-1.7,z:-2.6,indoors:true,text:'Entre, meu bem! Esta é nossa casinha verde. Eu e o Batista cuidamos destas plantas, e a Laika gosta de receber as visitas no jardim.'});addResident(k,'batista',state,{x:1,z:-2.8,indoors:true,text:'A Cidinha já passou o café! A parabólica no telhado pega as notícias, mas a prosa boa mesmo acontece aqui na varanda.'})}
 else if(h.ids.length)h.ids.forEach((id,i)=>addResident(k,id,state,{x:-1+i*2,z:-2.6,indoors:true,text:'Seja bem-vindo à minha casa! Gosto de morar aqui no caminho, perto da natureza e dos vizinhos da Vila Santa Cruz.'}));
 else npc(k,{name:h.names.split(' e ')[0],text:'Entre para tomar um café! Esta casinha faz parte da Vila Santa Cruz. Os caminhos do vale são nosso quintal.',x:-.7,z:-2.7});
 k.interact({x:-4,z:3.25,type:'info',label:'Lembranças de casa',data:{name:h.names,text:family?'Flores, retratos da família e uma manta feita à mão. Esta é a casa da Vó Cidinha, do Vô Batista e da Laika.':'Livros, plantas e lembranças guardam as pequenas histórias de quem vive no campo.'},radius:1.2});return k.finishRoom();
}

// At most six draws for all flowering trees and a fixed petal pool in the active map.
export function addCherryScenery(region,state,heightAt=()=>0){
 if(region.indoors)return;const b=region.bounds,trees=[],plaza=region.id==='village';
 if(plaza)for(const x of[-4.25,4.25])for(const z of[-1.95,5.05])trees.push({x,z,s:1.65,plaza:true});
 const candidates=region.id==='farm'?[[-20,-21],[-20,-7],[-20,18],[24,-23],[24,-2],[24,15],[-9,24],[3,24]]:Array.from({length:8},(_,i)=>{const t=(Math.floor(i/2)+.8)/4.8;return[i%2?b[1]-2.4:b[0]+2.4,b[2]+2.6+t*(b[3]-b[2]-5.2)]});
 for(const [x,z]of candidates){if((region.portals||[]).some(p=>Math.hypot(x-p.x,z-p.z)<3)||(region.colliders||[]).some(c=>colliderContains(c,x,z,.8)))continue;trees.push({x,z,s:.9+(trees.length%3)*.09})}
 if(!trees.length)return;const root=new T.Group();root.name='winter-cherries';region.root.add(root);const matrix=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion(),up=new T.Vector3(0,1,0);
 const owned=color=>{const m=new T.MeshStandardMaterial({color,roughness:1});m.userData.regionOwned=true;return m};
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,8),owned('#8b705b'),trees.length*4);trunk.userData.seasonalExclude=true;trunk.castShadow=trunk.receiveShadow=true;root.add(trunk);
 const geometry=new T.IcosahedronGeometry(1,2),crowns=[0,1,2].map(()=>{const m=new T.InstancedMesh(geometry,owned('#ffffff'),trees.length*5);m.userData.seasonalExclude=true;m.castShadow=true;m.receiveShadow=true;root.add(m);return m});let ti=0;const ci=[0,0,0],kinds=[[],[],[]];
 for(const tree of trees){const {x,z,s}=tree,y=heightAt(region.id,x,z);region.colliders.push({x,z,r:.27*s,height:3.1*s});
  function branch(a,b,r){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);q.setFromUnitVectors(up,v.clone().normalize());matrix.compose(mid,q,new T.Vector3(r,v.length(),r));trunk.setMatrixAt(ti++,matrix)}
  branch([x,y,z],[x+.12*s,y+2.8*s,z],.17*s);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;branch([x,y+1.9*s,z],[x+Math.sin(a)*1.05*s,y+3.0*s,z+Math.cos(a)*1.05*s],.07*s)}
  for(let i=0;i<13;i++){const a=i*2.4,j=i%3,r=i<4?.45:1.0;pos.set(x+Math.sin(a)*r*s,y+(3.0+(i%4)*.24)*s,z+Math.cos(a)*r*s);scale.set(.76*s,.64*s,.77*s);q.setFromAxisAngle(up,a);matrix.compose(pos,q,scale);crowns[j].setMatrixAt(ci[j],matrix);kinds[j][ci[j]++]=tree.plaza===true}
 }
 trunk.count=ti;trunk.instanceMatrix.needsUpdate=true;trunk.computeBoundingSphere();crowns.forEach((m,i)=>{m.count=ci[i];m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()});
 const petalCount=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches?32:64,petalMat=owned('#efd0dd');petalMat.side=T.DoubleSide;petalMat.transparent=true;petalMat.opacity=.85;const petals=new T.InstancedMesh(new T.PlaneGeometry(.11,.065),petalMat,petalCount);petals.userData.seasonalExclude=true;petals.frustumCulled=false;root.add(petals);let season=-1;
 function update(time){if(season!==state.season){season=state.season;const c=new T.Color(),green=['#8fa66d','#a3b77c','#7e995f'],pink=['#e0a9bd','#f0cbd5','#d7a0b4'];crowns.forEach((m,j)=>{for(let i=0;i<m.count;i++)m.setColorAt(i,c.set(kinds[j][i]||season===3?pink[j]:season===2?['#c39a69','#c5ac73','#ad8866'][j]:green[j]));m.instanceColor.needsUpdate=true})}petals.visible=season===3||plaza;if(!petals.visible)return;
  for(let i=0;i<petalCount;i++){const tree=trees[i%trees.length],phase=(time*.12+i*.127)%1,y=heightAt(region.id,tree.x,tree.z);pos.set(tree.x+Math.sin(i*2.4+phase*3)*1.3*tree.s+phase*1.1,y+(3.9-3.65*phase)*tree.s,tree.z+Math.cos(i*1.7+phase*4)*1.3*tree.s);q.setFromEuler(new T.Euler(time*.7+i,time*.4+i*2.4,phase*4));matrix.compose(pos,q,new T.Vector3(1,1,1));petals.setMatrixAt(i,matrix)}petals.instanceMatrix.needsUpdate=true;
 }
 const previous=region.update.bind(region);region.update=(dt,time)=>{previous(dt,time);update(time)};update(0);
}
