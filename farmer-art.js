import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js';

// All art lives below the original animation pivots. The controller owns those
// pivots, so the farmer can keep running, blinking and using every existing tool.
const geometries=new Map();
function roundedBox(w,h,d,r){
 const key=[w,h,d,r].join('/');if(geometries.has(key))return geometries.get(key);
 const g=new T.BoxGeometry(w,h,d,4,4,3),p=g.attributes.position,core=new T.Vector3(w/2-r,h/2-r,d/2-r),v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-core.x,core.x),T.MathUtils.clamp(v.y,-core.y,core.y),T.MathUtils.clamp(v.z,-core.z,core.z));v.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z)}
 g.computeVertexNormals();geometries.set(key,g);return g;
}
const sphere=new T.SphereGeometry(1,20,14),smallSphere=new T.SphereGeometry(1,6,4);
let clothGrain;
function fineCloth(){
 if(clothGrain)return clothGrain;
 const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');q.fillStyle='#fcfaf5';q.fillRect(0,0,256,256);
 for(let i=0;i<256;i+=2){q.fillStyle=i%4?'#c5bfa408':'#ffffff16';q.fillRect(i,0,1,256);q.fillRect(0,i,256,1)}
 clothGrain=new T.CanvasTexture(c);clothGrain.colorSpace=T.SRGBColorSpace;clothGrain.wrapS=clothGrain.wrapT=T.RepeatWrapping;clothGrain.repeat.set(3,3);clothGrain.anisotropy=8;return clothGrain;
}
function material(color,kind='plain'){
 const m=new T.MeshStandardMaterial({color,roughness:kind==='metal'?.64:kind==='skin'?.67:.83,metalness:kind==='metal'?.48:0});
 if(kind==='fabric'){m.map=fineCloth();m.bumpMap=m.map;m.bumpScale=.0007}
 return m;
}
function add(parent,geometry,mat,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ellipsoid(parent,mat,x,y,z,sx,sy=sx,sz=sx){return add(parent,sphere,mat,x,y,z,sx,sy,sz)}
function softBox(parent,mat,x,y,z,w,h,d,r=Math.min(w,h,d)*.38){return add(parent,roundedBox(w,h,d,r),mat,x,y,z)}
function clothPanel(parent,mat,x,y,z,w,h,d,r){
 const s=new T.Shape(),a=-w/2,b=-h/2;
 s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
 const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:Math.min(d*.24,.004),bevelThickness:Math.min(d*.24,.004),bevelSegments:3,curveSegments:8});g.translate(0,0,-d/2);return add(parent,g,mat,x,y,z);
}
function curve(points){return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal')}
function seam(parent,mat,points,r=.003,steps=20){return add(parent,new T.TubeGeometry(curve(points),steps,r,4,false),mat)}
function stitches(parent,mat,points,size=.006,count=14){
 const path=curve(points);
 for(let i=0;i<count;i++){const u=(i+.5)/count,p=path.getPointAt(u),d=path.getTangentAt(u),m=add(parent,smallSphere,mat,p.x,p.y,p.z,size*.38,size*.38,size);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d)}
}
function ribbon(parent,mat,points,width=.045,depth=.009,steps=24){
 const path=curve(points),pos=[],uv=[],indices=[],normal=new T.Vector3(1,0,0);
 for(let i=0;i<=steps;i++){const u=i/steps,p=path.getPoint(u),t=path.getTangent(u);normal.set(1,0,0).addScaledVector(t,-t.x).normalize();for(const side of [-1,1]){const v=p.clone().addScaledVector(normal,side*width/2);pos.push(v.x,v.y,v.z);uv.push(side===-1?0:1,u)}}
 for(let i=0;i<steps;i++){let a=i*2;indices.push(a,a+1,a+3,a,a+3,a+2)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=add(parent,g,mat);m.material.side=T.DoubleSide;
 // Round piping gives the strap thickness and a padded canvas silhouette.
 for(const side of [-1,1]){const edge=[];for(let i=0;i<=10;i++){const u=i/10,p=path.getPoint(u),t=path.getTangent(u);normal.set(1,0,0).addScaledVector(t,-t.x).normalize();p.addScaledVector(normal,side*width/2);edge.push([p.x,p.y,p.z])}seam(parent,mat,edge,depth,24)}
 return m;
}
function buckle(parent,mat,x,y,z,w=.043,h=.055){
 const r=.005;
 seam(parent,mat,[[x-w/2,y-h/2+r,z],[x-w/2,y+h/2-r,z],[x-w/2+r,y+h/2,z],[x+w/2-r,y+h/2,z],[x+w/2,y+h/2-r,z],[x+w/2,y-h/2+r,z],[x+w/2-r,y-h/2,z],[x-w/2+r,y-h/2,z],[x-w/2,y-h/2+r,z]],r,32);
 seam(parent,mat,[[x,y-h/2,z],[x,y+h*.08,z-.002]],.003,4);
}
function lockGeometry(points,width,thickness){
 const c=curve(points),positions=[],uv=[],indices=[],n=16,sides=8;
 for(let i=0;i<=n;i++){const u=i/n,p=c.getPoint(u),t=c.getTangent(u),side=new T.Vector3().crossVectors(t,new T.Vector3(0,0,1)).normalize(),out=new T.Vector3().crossVectors(side,t).normalize(),r=(.76+.24*Math.sin(u*Math.PI))*(.04+.96*Math.pow(1-u,.45));
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,v=p.clone().addScaledVector(side,Math.cos(a)*width*r).addScaledVector(out,Math.sin(a)*thickness*r);positions.push(v.x,v.y,v.z);uv.push(j/sides,u)}
 }
 for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function wornCanvas(){
 const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');q.drawImage(miniatureTexture('fabric',1).image,0,0,512,512);
 // Broad sun fading, little dust at the hem, and individual damaged yarns.
 const noise=n=>{const v=Math.sin(n*127.1+48.3)*43758.5453;return v-Math.floor(v)};
 for(let i=0;i<58;i++){const x=noise(i)*512,y=noise(i+200)*512,r=6+noise(i+900)*45,g=q.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'#fff1d517':'#79664915');g.addColorStop(1,'#ffffff00');q.fillStyle=g;q.fillRect(x-r,y-r,r*2,r*2)}
 for(let i=0;i<100;i++){const x=noise(i+400)*512,y=noise(i+600)*512;q.strokeStyle=i%3?'#efdfc02b':'#8b7b5c20';q.lineWidth=.7;q.beginPath();q.moveTo(x,y);q.lineTo(x+2+noise(i+500)*8,y+(noise(i+300)-.5)*3);q.stroke()}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.repeat.set(1.4,1.4);map.anisotropy=8;return map;
}
function complexion(){
 const c=document.createElement('canvas');c.width=512;c.height=256;const q=c.getContext('2d');q.fillStyle='#fff9ee';q.fillRect(0,0,512,256);
 for(const x of [.145,.355]){const y=.615,g=q.createRadialGradient(x*512,y*256,0,x*512,y*256,20);g.addColorStop(0,'#c77e6666');g.addColorStop(.42,'#d08b7140');g.addColorStop(1,'#dfab8a00');q.fillStyle=g;q.fillRect(x*512-21,y*256-21,42,42)}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function nubuck(){
 const c=document.createElement('canvas');c.width=c.height=128;const q=c.getContext('2d');q.fillStyle='#e6decd';q.fillRect(0,0,128,128);for(let i=0;i<2400;i++){const n=Math.sin(i*127.1+34.2)*43758.5453,x=(n-Math.floor(n))*128,m=Math.sin(i*83.3+91)*17822.11,y=(m-Math.floor(m))*128;q.fillStyle=i%3?'#ffffff16':'#68533f12';q.fillRect(x,y,.6,.6)}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);return tex;
}
// Baking only the static art in each articulated part keeps the new details
// inexpensive. No animated parent, eye or scarf pivot is folded into a mesh.
function bakePart(root){
 root.updateWorldMatrix(true,true);const inv=root.matrixWorld.clone().invert(),byMaterial=new Map();
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(g)});
 root.clear();
 for(const [mat,parts] of byMaterial){const g=new T.BufferGeometry(),count=parts.reduce((n,p)=>n+p.attributes.position.count,0);for(const [name,width] of [['position',3],['normal',3],['uv',2]]){const data=new Float32Array(count*width);let cursor=0;for(const p of parts){if(p.attributes[name])data.set(p.attributes[name].array,cursor);cursor+=p.attributes.position.count*width}g.setAttribute(name,new T.BufferAttribute(data,width))}g.computeBoundingSphere();add(root,g,mat);parts.forEach(g=>g.dispose())}
}

export function createFarmer(scene){
 const M={
  skin:material('#e8bf96','skin'),ear:material('#d69b7b','skin'),nose:material('#e2ae88','skin'),blush:material('#d99f83','skin'),
  hair:material('#513421'),hairLight:material('#694226'),hairFine:material('#95633d'),
  cap:material('#6e846e','fabric'),capShade:material('#576b57','fabric'),capSeam:material('#829780','fabric'),
  shirt:material('#eee7d3','fabric'),shirtShade:material('#d5cbb1','fabric'),shirtLight:material('#f4eedc','fabric'),
  glove:material('#f2eddf','fabric'),gloveShade:material('#d4ccba','fabric'),
  overall:material('#7c8b76','fabric'),overallDark:material('#616f5d','fabric'),overallLight:material('#8c9a83','fabric'),
  thread:material('#b0ad89','fabric'),clothThread:material('#dfcbaa','fabric'),
  scarf:material('#896b94','fabric'),scarfShade:material('#70557c','fabric'),scarfLight:material('#aa8bb2','fabric'),
  boot:material('#64442f'),bootDark:material('#503a2b'),bootLight:material('#806044'),sole:material('#494236'),lace:material('#c1ae85','fabric'),
  brass:material('#b4a073','metal'),metalDark:material('#8b8065','metal'),
  pack:material('#ad7e5e','fabric'),packFade:material('#bb9170','fabric'),packShade:material('#8f6d53','fabric'),packEdge:material('#b09878','fabric'),patch:material('#c3b08b','fabric'),
  eye:material('#282b25'),iris:material('#5a4a36'),eyeWhite:material('#f4edda'),glint:material('#fffbea'),mouth:material('#966953','skin')
 };
 const packMap=wornCanvas();for(const key of ['pack','packFade','packShade']){M[key].map=M[key].bumpMap=packMap;M[key].bumpScale=.002}
 const leatherMap=nubuck();for(const key of ['boot','bootDark','bootLight']){M[key].map=M[key].bumpMap=leatherMap;M[key].bumpScale=.002}
 M.glint.roughness=.45;M.eye.roughness=.5;
 const farmer=new T.Group(),body=new T.Group(),torso=new T.Group();farmer.name='farmer';farmer.scale.setScalar(.82);farmer.add(body);body.add(torso);scene.add(farmer);
 // Short, softly gathered overalls follow the compact miniature silhouette.
 const torsoGeometry=new T.LatheGeometry([new T.Vector2(.20,.57),new T.Vector2(.25,.62),new T.Vector2(.258,.73),new T.Vector2(.25,.92),new T.Vector2(.237,1.045),new T.Vector2(.18,1.10),new T.Vector2(.12,1.115)],36);
 const shirt=add(torso,torsoGeometry,M.shirt);shirt.scale.z=.77;
 ellipsoid(torso,M.skin,0,1.13,0,.12,.13,.12);
 ellipsoid(torso,M.overall,0,.645,.005,.263,.176,.205);
 // Curved bib, a real sewn pocket, and straps that wrap over both shoulders.
 softBox(torso,M.overall,0,.846,.193,.339,.329,.050,.018);
 softBox(torso,M.overallDark,0,.795,.231,.186,.135,.018,.008);
 softBox(torso,M.overallLight,0,.802,.240,.164,.114,.009,.004);
 seam(torso,M.thread,[[-.087,.855,.249],[-.087,.765,.25],[0,.748,.251],[.087,.765,.25],[.087,.855,.249]],.0028);
 stitches(torso,M.thread,[[-.083,.848,.251],[-.083,.773,.252],[0,.756,.253],[.083,.773,.252],[.083,.848,.251]],.0048,24);
 for(const side of [-1,1]){
  const x=side*.151;
  ribbon(torso,M.overallDark,[[x,.86,.212],[x,.99,.188],[x,1.091,.094],[x,1.093,-.055],[x,.99,-.166],[x,.78,-.19]],.058,.005);
  seam(torso,M.thread,[[x+side*.020,.91,.225],[x+side*.02,1.015,.17],[x+side*.02,1.09,.07],[x+side*.02,1.078,-.095]],.0021);
  ellipsoid(torso,M.brass,x,.902,.242,.020,.020,.009);
  ellipsoid(torso,M.metalDark,x,.902,.251,.004,.004,.003);
  seam(torso,M.overallDark,[[side*.25,.67,.11],[side*.27,.72,.08],[side*.267,.8,.045]],.007);
  seam(torso,M.overallLight,[[side*.216,.60,.124],[side*.235,.65,.14],[side*.252,.695,.12]],.0035);
 }
 // The small rucksack is soft canvas: a slumped body, gussets, faded flap,
 // stitched outside pocket, worn piping and restrained aged brass hardware.
 const backpack=new T.Group();backpack.name='small-worn-orange-backpack';torso.add(backpack);
 const bagGeo=new T.SphereGeometry(1,26,20),bp=bagGeo.attributes.position;
 for(let i=0;i<bp.count;i++){const rawX=bp.getX(i),rawY=bp.getY(i),rawZ=bp.getZ(i),x=Math.sign(rawX)*Math.pow(Math.abs(rawX),.52)*.215,y=Math.sign(rawY)*Math.pow(Math.abs(rawY),.50)*.25,z=Math.sign(rawZ)*Math.pow(Math.abs(rawZ),.65)*.105,shoulder=1-.10*T.MathUtils.smoothstep(y,.05,.25);bp.setXYZ(i,x*shoulder,y+Math.cos(x*12)*.005,z+(z<0?-.009*Math.cos(y*13)*Math.cos(x*7):0))}bagGeo.computeVertexNormals();
 add(backpack,bagGeo,M.pack,0,.85,-.365);
 ellipsoid(backpack,M.packShade,0,.85,-.248,.178,.214,.052);
 for(const side of [-1,1]){
  const gusset=softBox(backpack,M.packShade,side*.194,.825,-.362,.018,.300,.138,.008);gusset.rotation.z=side*.035;
  seam(backpack,M.packEdge,[[side*.178,.622,-.405],[side*.211,.677,-.44],[side*.208,.90,-.45],[side*.17,1.073,-.435]],.0031);
  seam(backpack,M.packShade,[[side*.185,.69,-.46],[side*.17,.81,-.475],[side*.178,.92,-.455]],.0028);
 }
 const flap=clothPanel(backpack,M.packFade,0,.992,-.481,.387,.199,.024,.042);flap.rotation.z=-.025;
 const flapEdge=[[-.179,1.058,-.499],[-.182,.953,-.500],[-.14,.906,-.501],[.128,.908,-.501],[.178,.951,-.500],[.178,1.058,-.499]];
 seam(backpack,M.packEdge,flapEdge,.003);stitches(backpack,M.clothThread,flapEdge,.0042,37);
 clothPanel(backpack,M.packFade,-.015,.744,-.484,.269,.164,.031,.034);
 const pocketEdge=[[-.139,.802,-.506],[-.139,.698,-.507],[-.109,.675,-.507],[.084,.675,-.507],[.116,.698,-.507],[.116,.802,-.506]];
 seam(backpack,M.packEdge,pocketEdge,.0024);stitches(backpack,M.clothThread,pocketEdge,.0041,30);
 softBox(backpack,M.packShade,.047,.891,-.506,.037,.167,.014,.006);
 softBox(backpack,M.packFade,.047,.897,-.515,.026,.162,.008,.003);
 buckle(backpack,M.brass,.047,.856,-.522,.041,.045);
 ellipsoid(backpack,M.metalDark,.047,.918,-.522,.0035,.004,.002);
 ellipsoid(backpack,M.metalDark,.047,.941,-.522,.0035,.004,.002);
 const tag=softBox(backpack,M.patch,-.062,.762,-.509,.067,.035,.006,.002);tag.rotation.z=.035;
 seam(backpack,M.packShade,[[-.083,.765,-.514],[-.043,.765,-.514]],.0017,4);
 // Little frayed yarns at two corners, kept subtle at the playable scale.
 for(let i=0;i<6;i++){const x=-.11+i*.008;seam(backpack,M.packEdge,[[x,.677,-.507],[x-.004,.665-(i%2)*.005,-.508],[x-.002,.660-(i%2)*.004,-.507]],.0015,4)}
 ribbon(backpack,M.packShade,[[-.062,1.072,-.354],[-.061,1.143,-.355],[0,1.154,-.358],[.061,1.143,-.355],[.062,1.072,-.354]],.023,.0035,22);
 for(const side of [-1,1]){
  const points=[[side*.163,1.02,-.292],[side*.216,1.085,-.168],[side*.229,1.09,-.02],[side*.247,1.015,.137],[side*.244,.88,.188],[side*.24,.737,.17],[side*.231,.681,-.06],[side*.194,.722,-.281]];
  ribbon(torso,M.packShade,points,.040,.0049,36);
  seam(torso,M.packEdge,[[side*.239,1.074,-.1],[side*.249,1.06,.07],[side*.266,.97,.16],[side*.264,.82,.185]],.0020);
  buckle(torso,M.metalDark,side*.245,.813,.201,.033,.040);
 }
 // A folded violet kerchief remains independent for the existing cloth sway.
 const scarf=new T.Group();scarf.position.set(0,1.137,0);body.add(scarf);
 const scarfRing=new T.Mesh(new T.TorusGeometry(.166,.047,10,38),M.scarf);scarfRing.rotation.x=Math.PI/2;scarfRing.scale.set(1.13,1,.9);scarf.add(scarfRing);
 seam(scarf,M.scarfLight,[[-.15,-.009,.115],[-.08,-.03,.16],[.06,-.026,.17],[.15,.008,.12]],.004);
 seam(scarf,M.scarfShade,[[-.16,.018,.1],[-.08,.008,.18],[.10,.013,.164]],.0045);
 const knot=ellipsoid(scarf,M.scarfLight,.092,-.012,.165,.058,.049,.043);knot.rotation.z=.4;
 const tail=new T.Group();tail.position.set(.064,1.105,.187);tail.rotation.z=-.28;body.add(tail);
 add(tail,lockGeometry([[0,0,0],[-.010,-.09,.035],[-.057,-.181,.022]],.046,.011),M.scarf);
 add(tail,lockGeometry([[.035,0,0],[.072,-.055,.018],[.096,-.123,.011]],.035,.010),M.scarfShade);
 seam(tail,M.scarfLight,[[-.021,-.025,.017],[-.033,-.095,.04],[-.060,-.157,.032]],.0024);
 // The head is deliberately sculpted around the reference: a huge rounded
 // backwards cap, an open adjustment arch, and just two sweeping chestnut locks.
 const head=new T.Group();head.position.y=1.49;body.add(head);const headArt=new T.Group();head.add(headArt);
 const faceGeo=new T.SphereGeometry(1,32,24),fp=faceGeo.attributes.position;
 for(let i=0;i<fp.count;i++){const x=fp.getX(i),y=fp.getY(i),z=fp.getZ(i),jaw=1-.14*T.MathUtils.smoothstep(-y,.18,1),cheek=1+.04*Math.exp(-Math.pow((y+.2)*4,2));fp.setXYZ(i,x*.357*jaw*cheek,y*.347,z*(z>0?.295:.283))}faceGeo.computeVertexNormals();const faceMaterial=M.skin.clone();faceMaterial.map=complexion();add(headArt,faceGeo,faceMaterial);
 for(const side of [-1,1]){
  const ear=ellipsoid(headArt,M.skin,side*.349,-.015,-.004,.069,.085,.055);ear.rotation.z=side*-.16;
  ellipsoid(headArt,M.ear,side*.381,-.016,.033,.021,.040,.014);
 }
 ellipsoid(headArt,M.nose,0,-.084,.294,.030,.033,.029);
 ellipsoid(headArt,M.skin,-.006,-.075,.313,.019,.018,.015);
 seam(headArt,M.mouth,[[-.030,-.191,.247],[-.013,-.198,.252],[.014,-.198,.252],[.031,-.188,.247]],.0031,16);
 // Every eye layer remains under its original blink pivot (.083 vertically).
 const eyes=[];
 for(const side of [-1,1]){
  const e=new T.Group();e.position.set(side*.133,-.024,.294);e.scale.y=.083;head.add(e);eyes.push(e);
  const eyeArt=new T.Group();eyeArt.position.set(-side*.006,.015/.083,-.017);e.add(eyeArt);
  ellipsoid(eyeArt,M.eyeWhite,0,0,0,.043,.99,.021);
  ellipsoid(eyeArt,M.iris,-side*.004,-.055,.015,.033,.88,.017);
  ellipsoid(eyeArt,M.eye,-side*.006,-.075,.024,.027,.79,.014);
  ellipsoid(eyeArt,M.glint,-.011,.34,.036,.008,.135,.006);
  ellipsoid(eyeArt,M.glint,.008,-.37,.036,.0038,.050,.003);
  seam(headArt,M.hair,[[side*.100,.095,.273],[side*.134,.103,.264],[side*.165,.092,.254]],.0060,12);
 }
 const hairGeo=new T.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.77);
 add(headArt,hairGeo,M.hair,0,.136,-.037,.352,.230,.292);
 for(const side of [-1,1]){
  add(headArt,lockGeometry([[side*.301,.186,.088],[side*.324,.070,.086],[side*.305,-.014,.061]],.046,.028),M.hair);
  add(headArt,lockGeometry([[side*.269,.147,-.157],[side*.302,.038,-.184],[side*.245,-.053,-.205]],.049,.023),M.hair);
 }
 // Broad, clean locks are curved solids, rather than a fringe of small spikes.
 add(headArt,lockGeometry([[.015,.222,.277],[-.200,.294,.317],[-.420,.243,.315],[-.555,.086,.265]],.108,.063),M.hairLight);
 add(headArt,lockGeometry([[-.121,.219,.303],[-.285,.154,.343],[-.335,.019,.342],[-.403,-.111,.290]],.097,.059),M.hairLight);
 add(headArt,lockGeometry([[-.113,.227,.312],[-.233,.241,.352],[-.371,.204,.360],[-.469,.144,.317]],.058,.034),M.hair);
 // Parametric crown: the opening at the front is actual missing cloth. Its
 // little bridge and snap holes sit over the dark hair, as on a backward cap.
 const capPos=[],capUv=[],capIndex=[],around=48,rows=24;
 function capHem(a){const x=Math.sin(a)*.428;return .202+(Math.cos(a)>0?.104*Math.exp(-Math.pow(x/.112,4)):0)}
 for(let j=0;j<=rows;j++)for(let i=0;i<=around;i++){
  const a=i/around*Math.PI*2,t=j/rows*Math.acos((capHem(a)-.239)/.315);capPos.push(Math.sin(a)*Math.sin(t)*.428,.239+Math.cos(t)*.315,-.042+Math.cos(a)*Math.sin(t)*.365);capUv.push(i/around,j/rows);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<around;i++){const a=j*(around+1)+i,b=a+around+1;capIndex.push(a,b,a+1,b,b+1,a+1)}
 const capGeo=new T.BufferGeometry();capGeo.setAttribute('position',new T.Float32BufferAttribute(capPos,3));capGeo.setAttribute('uv',new T.Float32BufferAttribute(capUv,2));capGeo.setIndex(capIndex);capGeo.computeVertexNormals();add(headArt,capGeo,M.cap);
 const band=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,t=Math.acos((capHem(a)-.239)/.315);band.push([Math.sin(a)*Math.sin(t)*.428,capHem(a),-.042+Math.cos(a)*Math.sin(t)*.365])}seam(headArt,M.capShade,band,.0085,72);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,points=[],end=Math.acos((capHem(a)-.239)/.315);for(let j=0;j<=12;j++){const t=j/12*end;points.push([Math.sin(a)*Math.sin(t)*.429,.239+Math.cos(t)*.316,-.042+Math.cos(a)*Math.sin(t)*.366])}seam(headArt,M.capSeam,points,.0016,30)}
 ellipsoid(headArt,M.capShade,0,.552,-.042,.024,.013,.024);
 ellipsoid(headArt,M.cap,0,.559,-.042,.018,.008,.018);
 const brimPositions=[],brimUv=[],brimIndex=[],nx=32,ny=6;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const a=(i/nx-.5)*Math.PI*.94,u=j/ny,r=.191+u*.215,x=Math.sin(a)*r,z=-.241-Math.cos(a)*r*.85,y=.207-u*.029+Math.sin(a)**2*.014;brimPositions.push(x,y,z);brimUv.push(i/nx,u)}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;brimIndex.push(a,b,a+1,b,b+1,a+1)}
 const brim=new T.BufferGeometry();brim.setAttribute('position',new T.Float32BufferAttribute(brimPositions,3));brim.setAttribute('uv',new T.Float32BufferAttribute(brimUv,2));brim.setIndex(brimIndex);brim.computeVertexNormals();M.capShade.side=T.DoubleSide;add(headArt,brim,M.capShade);const topBrim=add(headArt,brim,M.cap);topBrim.position.y=.007;
 const brimEdge=[];for(let i=0;i<=30;i++){const a=(i/30-.5)*Math.PI*.94;brimEdge.push([Math.sin(a)*.406,.184+Math.sin(a)**2*.014,-.241-Math.cos(a)*.406*.85])}seam(headArt,M.capSeam,brimEdge,.0018,38);
 softBox(headArt,M.capShade,0,.208,.325,.221,.036,.016,.006);
 softBox(headArt,M.cap,.023,.212,.337,.169,.029,.010,.004);
 for(const x of [-.021,.011,.043])ellipsoid(headArt,M.capShade,x,.212,.344,.0038,.0045,.002);
 // Original arm/hip/knee/ankle positions, with soft fabric volumes and boots.
 const arms=[],legs=[],knees=[],feet=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.32,1.01,0);body.add(arm);arms.push(arm);const armArt=new T.Group();arm.add(armArt);
  const sleeve=ellipsoid(armArt,M.shirt,side*.008,-.073,-.008,.116,.133,.116);sleeve.rotation.z=side*.12;
  const cuff=ellipsoid(armArt,M.shirtLight,side*.012,-.161,.005,.111,.031,.112);cuff.rotation.z=side*.055;
  // A visible short forearm, then a padded cream work glove with a rolled cuff.
  ellipsoid(armArt,M.skin,0,-.220,.014,.076,.098,.079);
  ellipsoid(armArt,M.gloveShade,0,-.290,.015,.093,.030,.095);
  ellipsoid(armArt,M.glove,0,-.293,.018,.096,.027,.098);
  ellipsoid(armArt,M.glove,0,-.361,.023,.102,.096,.101);
  const thumb=ellipsoid(armArt,M.glove,-side*.084,-.348,.071,.039,.060,.040);thumb.rotation.z=side*.3;
  seam(armArt,M.gloveShade,[[-side*.032,-.388,.109],[side*.031,-.388,.109]],.0015,8);
  bakePart(armArt);
  const leg=new T.Group();leg.position.set(side*.155,.49,0);body.add(leg);legs.push(leg);const thighArt=new T.Group();leg.add(thighArt);
  ellipsoid(thighArt,M.overall,0,-.117,-.004,.123,.177,.126);
  seam(thighArt,M.thread,[[side*.105,-.02,.033],[side*.115,-.10,.04],[side*.103,-.20,.036]],.0024,14);
  seam(thighArt,M.overallLight,[[-.075,-.155,.097],[0,-.165,.121],[.07,-.151,.099]],.0028,12);
  bakePart(thighArt);
  const knee=new T.Group();knee.position.y=-.22;leg.add(knee);knees.push(knee);const shinArt=new T.Group();knee.add(shinArt);
  ellipsoid(shinArt,M.overall,0,-.063,-.004,.111,.140,.113);
  ellipsoid(shinArt,M.overallDark,0,-.143,-.001,.109,.028,.106);
  seam(shinArt,M.overallLight,[[-.073,-.133,.076],[0,-.140,.103],[.073,-.133,.076]],.0030,14);
  seam(shinArt,M.thread,[[side*.094,-.012,.038],[side*.099,-.076,.039],[side*.095,-.123,.033]],.0024,10);
  bakePart(shinArt);
  const foot=new T.Group();foot.position.y=-.21;knee.add(foot);feet.push(foot);
  softBox(foot,M.sole,0,-.055,.069,.263,.042,.351,.020);
  softBox(foot,M.bootDark,0,-.029,.074,.260,.035,.349,.017);
  const upper=ellipsoid(foot,M.boot,0,.024,.083,.132,.111,.181);upper.rotation.x=.03;
  ellipsoid(foot,M.boot,0,.071,-.008,.099,.101,.107);
  softBox(foot,M.bootDark,0,.111,.023,.104,.055,.089,.012);
  seam(foot,M.bootDark,[[-.098,.003,.146],[-.073,.056,.182],[0,.073,.193],[.073,.056,.182],[.098,.003,.146]],.0031,20);
  seam(foot,M.lace,[[-.103,-.034,.16],[-.080,-.034,.207],[0,-.034,.225],[.080,-.034,.207],[.103,-.034,.16]],.0028,24);
  for(let i=0;i<3;i++){
   const z=.039+i*.034,y=.128-i*.010;
   for(const x of [-.048,.048])ellipsoid(foot,M.metalDark,x,y,z,.009,.004,.007);
   seam(foot,M.lace,[[-.045,y+.004,z],[0,y+.014,z+.017],[.045,y+.004,z+.025]],.0040,10);
   seam(foot,M.lace,[[.045,y+.004,z],[-.045,y+.004,z+.025]],.0036,8);
  }
  seam(foot,M.bootLight,[[side*.106,-.005,-.035],[side*.113,.050,-.034],[side*.088,.112,-.035]],.0023,14);
  softBox(foot,M.bootDark,0,.132,-.080,.035,.055,.018,.006);
  bakePart(foot);
 }
 bakePart(torso);bakePart(headArt);bakePart(scarf);bakePart(tail);
 return {farmer,body,head,eyes,scarf,tail,arms,legs,knees,feet};
}
