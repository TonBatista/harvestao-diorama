import * as T from './three.module.js';
import {miniatureTexture} from './miniature-materials.js';

// All art lives below the original animation pivots. The controller owns those
// pivots, so the farmer can keep running, blinking and using every existing tool.
const geometries=new Map();
function roundedBox(w,h,d,r){
 const key=[w,h,d,r].join('/');if(geometries.has(key))return geometries.get(key);
 const g=new T.BoxGeometry(w,h,d,6,6,4),p=g.attributes.position,core=new T.Vector3(w/2-r,h/2-r,d/2-r),v=new T.Vector3(),q=new T.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(T.MathUtils.clamp(v.x,-core.x,core.x),T.MathUtils.clamp(v.y,-core.y,core.y),T.MathUtils.clamp(v.z,-core.z,core.z));v.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z)}
 g.computeVertexNormals();geometries.set(key,g);return g;
}
const sphere=new T.SphereGeometry(1,28,20),smallSphere=new T.SphereGeometry(1,8,6);
function material(color,kind='plain'){
 const m=new T.MeshStandardMaterial({color,roughness:kind==='metal'?.64:kind==='skin'?.75:1,metalness:kind==='metal'?.48:0});
 if(kind==='fabric'){m.map=miniatureTexture('fabric',3);m.bumpMap=m.map;m.bumpScale=.0045}
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
 const c=curve(points),positions=[],uv=[],indices=[],n=18,sides=10;
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
  hair:material('#5b402e'),hairLight:material('#745139'),hairFine:material('#876548'),
  cap:material('#76815d','fabric'),capShade:material('#5d6b4c','fabric'),capSeam:material('#9aa17a','fabric'),
  shirt:material('#d6bb88','fabric'),shirtShade:material('#bda16d','fabric'),shirtLight:material('#e2c99b','fabric'),
  overall:material('#778364','fabric'),overallDark:material('#5f6c50','fabric'),overallLight:material('#8a9475','fabric'),
  thread:material('#b0ad89','fabric'),clothThread:material('#dfcbaa','fabric'),
  scarf:material('#896b94','fabric'),scarfShade:material('#70557c','fabric'),scarfLight:material('#aa8bb2','fabric'),
  boot:material('#79583f'),bootDark:material('#5e4635'),bootLight:material('#9d7c58'),sole:material('#494236'),lace:material('#c1ae85','fabric'),
  brass:material('#b4a073','metal'),metalDark:material('#8b8065','metal'),
  pack:material('#ad7e5e','fabric'),packFade:material('#bb9170','fabric'),packShade:material('#8f6d53','fabric'),packEdge:material('#b09878','fabric'),patch:material('#c3b08b','fabric'),
  eye:material('#342d25'),iris:material('#59432d'),glint:material('#f6e8c7'),mouth:material('#966953','skin')
 };
 const packMap=wornCanvas();for(const key of ['pack','packFade','packShade']){M[key].map=M[key].bumpMap=packMap;M[key].bumpScale=.006}
 const leatherMap=nubuck();for(const key of ['boot','bootDark','bootLight']){M[key].map=M[key].bumpMap=leatherMap;M[key].bumpScale=.002}
 M.glint.roughness=.45;M.eye.roughness=.5;
 const farmer=new T.Group(),body=new T.Group(),torso=new T.Group();farmer.name='farmer';farmer.scale.setScalar(.82);farmer.add(body);body.add(torso);scene.add(farmer);
 // A tapered shirt and gathered waist replace the old stacked toy spheres.
 const torsoGeometry=new T.LatheGeometry([new T.Vector2(.20,.57),new T.Vector2(.25,.62),new T.Vector2(.272,.73),new T.Vector2(.275,.92),new T.Vector2(.255,1.045),new T.Vector2(.20,1.10),new T.Vector2(.12,1.115)],36);
 const shirt=add(torso,torsoGeometry,M.shirt);shirt.scale.z=.77;
 ellipsoid(torso,M.skin,0,1.13,0,.12,.13,.12);
 ellipsoid(torso,M.overall,0,.645,.005,.276,.196,.21);
 // Curved bib, a real sewn pocket, and straps that wrap over both shoulders.
 softBox(torso,M.overall,0,.861,.196,.354,.308,.050,.018);
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
 const bagGeo=new T.SphereGeometry(1,36,28),bp=bagGeo.attributes.position;
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
 // Gentle cheek/jaw shaping and asymmetric chestnut locks give the face a
 // sculpted handmade look while retaining the original head anchor.
 const head=new T.Group();head.position.y=1.49;body.add(head);const headArt=new T.Group();head.add(headArt);
 const faceGeo=new T.SphereGeometry(1,40,28),fp=faceGeo.attributes.position;
 for(let i=0;i<fp.count;i++){const x=fp.getX(i),y=fp.getY(i),z=fp.getZ(i),jaw=1-.10*T.MathUtils.smoothstep(-y,.25,1),cheek=1+.025*Math.exp(-Math.pow((y+.21)*4,2));fp.setXYZ(i,x*.372*jaw*cheek,y*.369,z*(z>0?.309:.296))}faceGeo.computeVertexNormals();const faceMaterial=M.skin.clone();faceMaterial.map=complexion();add(headArt,faceGeo,faceMaterial);
 for(const side of [-1,1]){
  const ear=ellipsoid(headArt,M.skin,side*.36,-.032,-.012,.069,.088,.059);ear.rotation.z=side*-.16;
  ellipsoid(headArt,M.ear,side*.391,-.034,.029,.022,.045,.016);
 }
 ellipsoid(headArt,M.nose,0,-.088,.306,.034,.038,.034);
 ellipsoid(headArt,M.skin,-.007,-.077,.332,.023,.023,.017);
 seam(headArt,M.mouth,[[-.042,-.198,.263],[-.018,-.209,.268],[.015,-.209,.268],[.040,-.196,.263]],.0045,16);
 seam(headArt,M.skin,[[-.028,-.218,.259],[0,-.222,.263],[.024,-.215,.259]],.0045,12);
 // Dark eyes use a tiny upper highlight; the complete eye scales for blinking.
 const eyes=[];
 for(const side of [-1,1]){
  const e=new T.Group();e.position.set(side*.133,-.024,.294);e.scale.y=.083;head.add(e);eyes.push(e);
  ellipsoid(e,M.iris,0,0,0,.041,.76,.021);
  ellipsoid(e,M.eye,side*.002,-.015,.009,.030,.67,.017);
  ellipsoid(e,M.glint,-.010,.29,.024,.008,.105,.006);
  ellipsoid(e,M.glint,.008,-.25,.024,.0037,.045,.003);
  seam(headArt,M.hair,[[side*.102,.072,.290],[side*.143,.082,.280],[side*.178,.069,.266]],.0095,12);
 }
 for(let i=0;i<5;i++){const x=-.23+i*.115,z=-Math.sqrt(Math.max(.01,1-(x/.39)**2))*.29;add(headArt,lockGeometry([[x,.15,z],[x+.015,.015,z-.004],[x+.025,-.095,z+.03]],.049,.019),i%2?M.hair:M.hairLight)}
 const hairGeo=new T.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.77);
 add(headArt,hairGeo,M.hair,0,.122,-.045,.369,.252,.301);
 for(const side of [-1,1]){
  add(headArt,lockGeometry([[side*.31,.17,.10],[side*.347,.07,.106],[side*.336,-.044,.096]],.055,.031),M.hairLight);
  add(headArt,lockGeometry([[side*.299,.13,-.16],[side*.327,.015,-.172],[side*.267,-.087,-.196]],.057,.029),M.hair);
 }
 const locks=[
  [[-.289,.186,.175],[-.257,.111,.238],[-.217,.069,.264]],
  [[-.218,.216,.216],[-.166,.126,.279],[-.130,.078,.291]],
  [[-.124,.225,.253],[-.060,.160,.299],[.009,.126,.304]],
  [[-.006,.231,.267],[.062,.174,.298],[.112,.112,.291]],
  [[.102,.231,.245],[.164,.163,.272],[.219,.116,.249]],
  [[.214,.203,.199],[.269,.142,.221],[.295,.061,.205]]
 ];
 locks.forEach((points,i)=>{add(headArt,lockGeometry(points,.055+i%2*.008,.025),i%3?M.hairLight:M.hair);const line=points.map((p,j)=>[p[0]-.014,p[1]+.005,p[2]+.018*(1-j*.15)]);seam(headArt,M.hairFine,line,.0020,16)});
 // Backwards moss cap: six stitched panels, rounded crown, worn curved bill.
 const capGeo=new T.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI*.545);
 add(headArt,capGeo,M.cap,0,.244,-.035,.389,.242,.327);
 const band=[];for(let i=0;i<=42;i++){const a=i/42*Math.PI*2;band.push([Math.sin(a)*.384,.211+Math.cos(a)*.003,-.035+Math.cos(a)*.321])}seam(headArt,M.capShade,band,.017,60);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,points=[];for(let j=0;j<=9;j++){const u=j/9*Math.PI*.52;points.push([Math.sin(a)*Math.sin(u)*.391,.244+Math.cos(u)*.243,-.035+Math.cos(a)*Math.sin(u)*.329])}seam(headArt,M.capSeam,points,.0027,24)}
 ellipsoid(headArt,M.capShade,0,.491,-.035,.027,.018,.027);
 ellipsoid(headArt,M.cap,0,.499,-.035,.019,.010,.019);
 const brimPositions=[],brimUv=[],brimIndex=[],nx=32,ny=6;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const a=(i/nx-.5)*Math.PI*.94,u=j/ny,r=.175+u*.195,x=Math.sin(a)*r,z=-.223-Math.cos(a)*r*.85,y=.219-u*.035+Math.sin(a)**2*.014;brimPositions.push(x,y,z);brimUv.push(i/nx,u)}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;brimIndex.push(a,b,a+1,b,b+1,a+1)}
 const brim=new T.BufferGeometry();brim.setAttribute('position',new T.Float32BufferAttribute(brimPositions,3));brim.setAttribute('uv',new T.Float32BufferAttribute(brimUv,2));brim.setIndex(brimIndex);brim.computeVertexNormals();M.capShade.side=T.DoubleSide;add(headArt,brim,M.capShade);const topBrim=add(headArt,brim,M.cap);topBrim.position.y=.007;
 const brimEdge=[];for(let i=0;i<=30;i++){const a=(i/30-.5)*Math.PI*.94;brimEdge.push([Math.sin(a)*.354,.196+Math.sin(a)**2*.014,-.223-Math.cos(a)*.354*.85])}seam(headArt,M.capSeam,brimEdge,.0025,38);
 softBox(headArt,M.shirtShade,0,.212,.292,.130,.039,.017,.006);
 seam(headArt,M.capShade,[[-.054,.211,.304],[.054,.211,.304]],.0030,10);
 for(const x of [-.028,0,.028])ellipsoid(headArt,M.capShade,x,.210,.305,.0025,.0035,.0025);
 // Original arm/hip/knee/ankle positions, with soft fabric volumes and boots.
 const arms=[],legs=[],knees=[],feet=[];
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.32,1.01,0);body.add(arm);arms.push(arm);const armArt=new T.Group();arm.add(armArt);
  const sleeve=ellipsoid(armArt,M.shirt,side*.008,-.126,-.008,.123,.197,.124);sleeve.rotation.z=side*.055;
  ellipsoid(armArt,M.shirtShade,0,-.247,.009,.108,.026,.112);
  const cuff=softBox(armArt,M.shirtLight,0,-.251,.008,.205,.050,.204,.021);cuff.rotation.z=side*.025;
  seam(armArt,M.clothThread,[[-.075,-.259,.09],[0,-.264,.111],[.075,-.259,.09]],.0027,14);
  ellipsoid(armArt,M.skin,0,-.335,.019,.095,.108,.097);
  const thumb=ellipsoid(armArt,M.nose,-side*.079,-.327,.070,.038,.060,.038);thumb.rotation.z=side*.3;
  seam(armArt,M.nose,[[-side*.018,-.381,.095],[side*.037,-.377,.092]],.0024,8);
  seam(armArt,M.shirtShade,[[side*.102,-.08,.004],[side*.107,-.143,.034],[side*.094,-.188,.04]],.0032,12);
  bakePart(armArt);
  const leg=new T.Group();leg.position.set(side*.155,.49,0);body.add(leg);legs.push(leg);const thighArt=new T.Group();leg.add(thighArt);
  ellipsoid(thighArt,M.overall,0,-.104,-.004,.123,.155,.125);
  seam(thighArt,M.thread,[[side*.105,-.02,.033],[side*.115,-.10,.04],[side*.103,-.20,.036]],.0024,14);
  seam(thighArt,M.overallLight,[[-.075,-.155,.097],[0,-.165,.121],[.07,-.151,.099]],.0028,12);
  bakePart(thighArt);
  const knee=new T.Group();knee.position.y=-.22;leg.add(knee);knees.push(knee);const shinArt=new T.Group();knee.add(shinArt);
  ellipsoid(shinArt,M.overall,0,-.064,-.004,.108,.128,.109);
  ellipsoid(shinArt,M.overallDark,0,-.143,-.001,.109,.028,.106);
  seam(shinArt,M.overallLight,[[-.073,-.133,.076],[0,-.140,.103],[.073,-.133,.076]],.0030,14);
  seam(shinArt,M.thread,[[side*.094,-.012,.038],[side*.099,-.076,.039],[side*.095,-.123,.033]],.0024,10);
  bakePart(shinArt);
  const foot=new T.Group();foot.position.y=-.21;knee.add(foot);feet.push(foot);
  softBox(foot,M.sole,0,-.055,.063,.249,.046,.332,.020);
  softBox(foot,M.bootDark,0,-.029,.067,.246,.037,.329,.017);
  const upper=ellipsoid(foot,M.boot,0,.020,.072,.121,.092,.168);upper.rotation.x=.03;
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
