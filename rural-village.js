import {artisanMaterial} from './art-direction.js?v=0.47';
import {mergeParts} from './wildlife-art.js?v=0.47';
import * as T from './three.module.js';
import {createInteriorRoom,group,C,table,chair,shelf,rug,vase,lantern,npc} from './rural-room.js?v=0.47';
import {addResident,NEW_RESIDENTS} from './new-residents.js?v=0.47';
import {colliderContains} from './scene-collisions.js?v=0.47';

export const GAZEBO=Object.freeze({x:0,z:1.7,radius:2.65,floor:.45,columnRadius:2.45,stairHalfWidth:.92,tread:.48});
export function gazeboFloorHeight(x,z){
 const dx=x-GAZEBO.x,dz=z-GAZEBO.z,a=GAZEBO.radius*Math.cos(Math.PI/8);
 if(Math.abs(dx)<=a&&Math.abs(dz)<=a&&(Math.abs(dx)+Math.abs(dz))<=a*Math.SQRT2)return GAZEBO.floor;
 const front=GAZEBO.z+a;if(Math.abs(dx)<=GAZEBO.stairHalfWidth&&z>=front&&z<front+GAZEBO.tread*2)return z<front+GAZEBO.tread?GAZEBO.floor*2/3:GAZEBO.floor/3;
 return 0;
}
export function buildGazebo(k,state={}){
 const F=k.fixed,G=GAZEBO,a=G.radius*Math.cos(Math.PI/8),front=G.z+a;
 const base=k.mesh(F,new T.CylinderGeometry(G.radius+.10,G.radius+.10,.26,8),'#b5aa8d',0,.13,G.z,1,1,1,'stone');base.rotation.y=Math.PI/8;
 const deck=k.mesh(F,new T.CylinderGeometry(G.radius,G.radius,.18,8),'#bea577',0,G.floor-.09,G.z,1,1,1,'wood');deck.rotation.y=Math.PI/8;
 for(let dz=-2.16;dz<=2.17;dz+=.27){const half=Math.min(a,a*Math.SQRT2-Math.abs(dz))-.05;k.box(F,'#a99169',0,G.floor+.006,G.z+dz,half*2,.014,.016,'wood')}
 for(let i=0;i<8;i++){const angle=(i+.5)*Math.PI/4,x=Math.sin(angle)*G.columnRadius,z=G.z+Math.cos(angle)*G.columnRadius;
  k.cyl(F,'#998061',x,1.64,z,.075,2.40,'wood');k.ball(F,'#d0bb91',x,2.90,z,.13,.12,.13,'wood');k.roundSolid(x,z,.09);
  if(i!==7){const next=angle+Math.PI/4,xx=Math.sin(next)*G.columnRadius,zz=G.z+Math.cos(next)*G.columnRadius;for(const y of[.95,1.30])k.beam(F,'#c5b08a',[x,y,z],[xx,y,zz],.045,'wood');for(let j=1;j<5;j++){const t=j/5;k.cyl(F,'#b69d75',x+(xx-x)*t,.98,z+(zz-z)*t,.026,.66,'wood')}k.solid((x+xx)/2,(z+zz)/2,.11,Math.hypot(xx-x,zz-z),{angle:Math.atan2(xx-x,zz-z)})}
 }
 for(let i=0;i<2;i++){const z=front+(i+.5)*G.tread,top=gazeboFloorHeight(0,z);k.box(F,i?'#b6a27f':'#c3ae85',0,top-.07,z,G.stairHalfWidth*2,.14,G.tread+.008,'wood')}
 for(const side of[-1,1]){k.beam(F,'#bca582',[side*.94,1.18,front-.18],[side*1.04,.88,front+G.tread*2],.035,'wood');k.solid(side*1.04,front+G.tread,.09,G.tread*2)}
 // Only posts and rails block movement; the deck and both treads share the walker's height function.
 const roofMat=artisanMaterial('#78836f','clay').clone();roofMat.map=roofMat.map?.clone();roofMat.bumpMap=roofMat.map;roofMat.bumpScale=.035;roofMat.transparent=true;roofMat.opacity=1;roofMat.userData={regionOwned:true};
 const roof=k.mesh(k.dynamic,new T.ConeGeometry(3.24,1.28,8),roofMat,0,3.42,G.z,1,1,1);roof.rotation.y=Math.PI/8;roof.userData.seasonalExclude=true;
 k.cyl(F,'#d5bb85',0,4.18,G.z,.075,.30,'wood');k.ball(F,'#cab27d',0,4.43,G.z,.12,.14,.12);
 let roofOpen=false;k.animate(dt=>{const p=state.player,onDeck=p&&gazeboFloorHeight(p.x,p.z)===G.floor;if(!onDeck)roofOpen=false;else if(Math.hypot(p.x-G.x,p.z-G.z)<1.2)roofOpen=true;const target=roofOpen?.5:1;roofMat.opacity+=(target-roofMat.opacity)*(1-Math.exp(-dt*7));roofMat.depthWrite=roofMat.opacity>.98});
 k.interact({x:0,z:front+1.35,type:'info',label:'Praça São Benedito',data:{name:'Praça São Benedito',text:'Suba os degraus e aproveite o coreto da Vila Santa Cruz. As árvores floridas deixam espaço para a música, os encontros e as histórias da praça.'},radius:1.1});
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
 k.interact({x,z:z+.7,type:'talk',label:'Fazer carinho na Laika',data:{name:'Laika',text:'Au! Laika abana o rabinho e recebe você na casa da Vó Cidinha e do Vô Batista.'},radius:1.25});const body=group(g);for(const o of [...g.children])if(o.isMesh)body.add(o);for(const part of[body,...legs,tail]){part.traverse(o=>{if(o.isMesh)o.userData.featherColor='#'+o.material.color.getHexString()});mergeParts(part)}g.traverse(o=>o.userData.seasonalExclude=true);k.animate((dt,time)=>{tail.rotation.y=Math.sin(time*7)*.43;g.rotation.y=.3+Math.sin(time*.45)*.12;g.position.y=Math.sin(time*2)*.007;legs.forEach((l,i)=>l.rotation.x=Math.sin(time*1.5+i)*.025)});
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
 const k=createInteriorRoom({id:'residentHome',label:'Casa de '+h.names,w:12,d:10,wall:family?'#b7c9a1':h.color,returnTo:state.residentHomeArea||'valleyTrail',returnSpawn:state.residentHomeDoor||[0,12]}),F=k.fixed;
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

// Small alpha-cutout atlases: foliage sprays and flowers, shared within the active scenery.
function cherryCardAtlas(flower=false){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d');q.clearRect(0,0,256,256);
 if(flower){q.translate(128,128);for(let i=0;i<5;i++){q.save();q.rotate(i*Math.PI*2/5);q.fillStyle='#fff5ef';q.beginPath();q.ellipse(0,-48,38,53,0,0,Math.PI*2);q.fill();q.strokeStyle='#e2c3ce';q.lineWidth=2;q.stroke();q.restore()}q.fillStyle='#ddc080';q.beginPath();q.arc(0,0,23,0,Math.PI*2);q.fill();for(let i=0;i<9;i++){const a=i*2.4;q.fillStyle='#bba36a';q.beginPath();q.arc(Math.sin(a)*14,Math.cos(a)*14,3,0,Math.PI*2);q.fill()}}
 else{
  q.lineCap='round';q.strokeStyle='#b3afa4';q.lineWidth=3.4;q.beginPath();q.moveTo(128,247);q.quadraticCurveTo(113,125,133,20);q.stroke();
  function leaf(x,y,angle,length,width,shade){q.save();q.translate(x,y);q.rotate(angle);q.fillStyle=shade;q.beginPath();q.moveTo(0,0);q.bezierCurveTo(width,-length*.22,width*.80,-length*.76,0,-length);q.bezierCurveTo(-width*.85,-length*.77,-width,-length*.20,0,0);q.fill();q.strokeStyle='#c0c4b8';q.lineWidth=1;q.beginPath();q.moveTo(0,-2);q.quadraticCurveTo(2,-length*.5,0,-length+4);q.stroke();q.restore()}
  for(let i=0;i<9;i++){const y=227-i*22;for(const side of[-1,1]){const x=127+side*(40+(i%3)*13);q.strokeStyle='#b7b6a8';q.lineWidth=2;q.beginPath();q.moveTo(126,y+8);q.quadraticCurveTo(x,y+2,x,y-8);q.stroke();leaf(x,y-6,side*(.58+(i%2)*.15),43+(i%3)*5,15+(i%2)*3,i%2?'#f4f5ed':'#e2e7db');if(i%2===0)leaf(126+side*17,y+8,side*.24,32,9,'#fcfcf3')}}leaf(132,48,.02,40,10,'#f5f6ee');
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;return texture;
}
export function leafNormalMap(texture){const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const q=canvas.getContext('2d'),src=texture.image.getContext('2d').getImageData(0,0,256,256).data,out=q.createImageData(256,256);const height=(x,y)=>{x=Math.max(0,Math.min(255,x));y=Math.max(0,Math.min(255,y));const i=(y*256+x)*4;return src[i+3]/255*(.35+src[i]/255*.4)};for(let y=0;y<256;y++)for(let x=0;x<256;x++){let nx=(height(x-1,y)-height(x+1,y))*2.2,ny=(height(x,y-1)-height(x,y+1))*2.2,nz=1,l=Math.hypot(nx,ny,nz),i=(y*256+x)*4;out.data[i]=(nx/l*.5+.5)*255;out.data[i+1]=(ny/l*.5+.5)*255;out.data[i+2]=(nz/l*.5+.5)*255;out.data[i+3]=255}q.putImageData(out,0,0);return new T.CanvasTexture(canvas)}
// Fixed instance counts keep the wind and petals light even when the whole farm is visible.
export function addCherryScenery(region,state,heightAt=()=>0){
 if(region.indoors)return;const b=region.bounds,trees=[],plaza=region.id==='village';
 if(plaza)for(const x of[-4.25,4.25])for(const z of[-1.95,5.05])trees.push({x,z,s:1.05,plaza:true});
 const candidates=region.id==='farm'?[[-20,-21],[-20,-7],[-20,18],[24,-23],[24,-2],[24,15],[-9,24],[3,24]]:Array.from({length:8},(_,i)=>{const t=(Math.floor(i/2)+.8)/4.8;return[i%2?b[1]-2.4:b[0]+2.4,b[2]+2.6+t*(b[3]-b[2]-5.2)]});
 for(const [x,z]of candidates){if((region.portals||[]).some(p=>Math.hypot(x-p.x,z-p.z)<3)||(region.colliders||[]).some(c=>colliderContains(c,x,z,.8)))continue;trees.push({x,z,s:.9+(trees.length%3)*.09})}
 if(!trees.length)return;const root=new T.Group();root.name='winter-cherries';region.root.add(root);const matrix=new T.Matrix4(),pos=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion(),up=new T.Vector3(0,1,0);
 const owned=color=>{const m=new T.MeshStandardMaterial({color,roughness:1});m.userData.regionOwned=true;return m};
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,8),owned('#8b705b'),trees.length*4);trunk.userData.seasonalExclude=true;trunk.castShadow=trunk.receiveShadow=true;root.add(trunk);
 const leafMap=cherryCardAtlas(),normalMap=leafNormalMap(leafMap),flowerMap=cherryCardAtlas(true),geometry=new T.PlaneGeometry(1.75,1.4,1,2),vertices=geometry.attributes.position;
 for(let i=0;i<vertices.count;i++)vertices.setZ(i,.075*Math.sin((vertices.getY(i)+.7)/1.4*Math.PI));geometry.computeVertexNormals();
 const cards=[[],[],[]],kinds=[[],[],[]],crowns=[0,1,2].map(()=>{const material=owned('#ffffff');material.map=leafMap;material.normalMap=normalMap;material.normalScale.set(.24,.24);material.side=T.DoubleSide;material.alphaTest=.42;material.alphaToCoverage=true;const m=new T.InstancedMesh(geometry,material,trees.length*9);m.userData.seasonalExclude=true;m.castShadow=m.receiveShadow=true;m.frustumCulled=false;root.add(m);return m});let ti=0;
 const blooms=[];
 for(const tree of trees){const {x,z,s}=tree,y=heightAt(region.id,x,z);region.colliders.push({x,z,r:.27*s,height:3.1*s});
  function branch(a,b,r){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);q.setFromUnitVectors(up,v.clone().normalize());matrix.compose(mid,q,new T.Vector3(r,v.length(),r));trunk.setMatrixAt(ti++,matrix)}
  branch([x,y,z],[x+.12*s,y+2.8*s,z],.17*s);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;branch([x,y+1.9*s,z],[x+Math.sin(a)*1.05*s,y+3.0*s,z+Math.cos(a)*1.05*s],.07*s)}
  const count=tree.plaza?18:13;
  for(let i=0;i<count;i++){const a=i*2.4,j=i%3,r=tree.plaza?.64:i<4?.45:1,cy=tree.plaza?3.20+(i%3)*.20:3+(i%4)*.22,sz=(tree.plaza?.92:1)*s;cards[j].push({x:x+Math.sin(a)*r*s,y:y+cy*s,z:z+Math.cos(a)*r*s,size:sz,turn:a,phase:i+x*.41+z*.21});kinds[j].push(!!tree.plaza)}
  if(tree.plaza)for(let i=0;i<18;i++){const a=i*2.4;blooms.push({x:x+Math.sin(a)*(.45+(i%3)*.18)*s,y:y+(3.16+(i%3)*.21)*s,z:z+Math.cos(a)*(.45+(i%3)*.18)*s,turn:a,phase:i+x*.41+z*.21})}
 }
 trunk.count=ti;trunk.instanceMatrix.needsUpdate=true;trunk.computeBoundingSphere();crowns.forEach((m,i)=>m.count=cards[i].length);
 const bloomMaterial=owned('#eac6d2');bloomMaterial.map=flowerMap;bloomMaterial.side=T.DoubleSide;bloomMaterial.alphaTest=.42;const flowers=new T.InstancedMesh(new T.PlaneGeometry(.31,.31),bloomMaterial,Math.max(1,blooms.length));flowers.count=blooms.length;flowers.userData.seasonalExclude=true;flowers.frustumCulled=false;root.add(flowers);
 const petalCount=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches?32:64,petalMat=owned('#efd0dd');petalMat.side=T.DoubleSide;petalMat.transparent=true;petalMat.opacity=.85;const petals=new T.InstancedMesh(new T.PlaneGeometry(.11,.065),petalMat,petalCount);petals.userData.seasonalExclude=true;petals.frustumCulled=false;root.add(petals);let season=-1;
 function update(time){
  if(season!==state.season){season=state.season;const c=new T.Color(),green=['#91a877','#a7b98a','#7e9968'],pink=['#dfb0c2','#efd0dc','#d5a5bb'];crowns.forEach((m,j)=>{for(let i=0;i<m.count;i++)m.setColorAt(i,c.set(kinds[j][i]?green[j]:season===3?pink[j]:season===2?['#c39a69','#c5ac73','#ad8866'][j]:green[j]));m.instanceColor.needsUpdate=true})}
  crowns.forEach((m,j)=>{cards[j].forEach((card,i)=>{const wind=Math.sin(time*1.22+card.phase)*.065+Math.sin(time*2.1+card.phase*.7)*.022;pos.set(card.x+wind*.22,card.y+Math.sin(time*.9+card.phase)*.014,card.z);q.setFromEuler(new T.Euler((i%4===0?-1.0:i%4===1?-.35:.32)+wind,card.turn+wind*.4,wind*.55));scale.set(card.size,card.size,card.size);matrix.compose(pos,q,scale);m.setMatrixAt(i,matrix)});m.instanceMatrix.needsUpdate=true});
  blooms.forEach((flower,i)=>{const wind=Math.sin(time*1.22+flower.phase)*.065;pos.set(flower.x+wind*.22,flower.y,flower.z);q.setFromEuler(new T.Euler(wind,flower.turn+wind*.4,wind*.55));matrix.compose(pos,q,new T.Vector3(1,1,1));flowers.setMatrixAt(i,matrix)});flowers.instanceMatrix.needsUpdate=true;
  petals.visible=season===3||plaza;if(!petals.visible)return;const sources=season===3?trees:trees.filter(t=>t.plaza);
  for(let i=0;i<petalCount;i++){const tree=sources[i%sources.length],phase=(time*.12+i*.127)%1,y=heightAt(region.id,tree.x,tree.z);pos.set(tree.x+Math.sin(i*2.4+phase*3)*1.1*tree.s+phase*.9,y+(3.9-3.65*phase)*tree.s,tree.z+Math.cos(i*1.7+phase*4)*1.1*tree.s);q.setFromEuler(new T.Euler(time*.7+i,time*.4+i*2.4,phase*4));matrix.compose(pos,q,new T.Vector3(1,1,1));petals.setMatrixAt(i,matrix)}petals.instanceMatrix.needsUpdate=true;
 }
 const previous=region.update.bind(region);region.update=(dt,time)=>{previous(dt,time);update(time)};update(0);
}
