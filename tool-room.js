import * as T from './three.module.js';
import {createInteriorRoom,group,C,table,shelf,rug,vase,lantern} from './rural-room.js?v=0.33';
function hangingTool(k,parent,x,y,z,kind){
 const timber='#a88c61',metal='#7b8d83';
 if(kind==='water'){k.cyl(parent,'#879c91',x,y-.02,z,.15,.25);k.beam(parent,'#879c91',[x+.1,y,z],[x+.31,y+.12,z],.045);const handle=k.cyl(parent,metal,x,y+.15,z,.14,.025);handle.rotation.x=Math.PI/2;return;}
 k.beam(parent,timber,[x,y-.45,z],[x,y+.36,z],.027,'wood');
 if(kind==='hoe'){k.box(parent,metal,x+.10,y+.35,z,.37,.095,.15);k.box(parent,'#b9c5b4',x+.25,y+.29,z,.07,.19,.16);}
 else if(kind==='axe'){k.box(parent,metal,x+.13,y+.24,z,.29,.29,.075);k.box(parent,'#bbc3b1',x+.28,y+.23,z,.05,.27,.08);}
 else if(kind==='sickle'){for(let i=0;i<7;i++){const a=-1.1+i*.33;k.ball(parent,metal,x+.12+Math.cos(a)*.17,y+.26+Math.sin(a)*.17,z,.055,.035,.027);}}
 else k.box(parent,metal,x,y+.29,z,.32,.17,.16);
}
function seedPackets(k,parent,x,y,z){
 for(let i=0;i<5;i++){const xx=x+(i-2)*.28,packet=k.box(parent,['#c4d1a8','#d8bf86','#c1a8bc','#b8c8be','#dec6a4'][i],xx,y,z,.23,.34,.055,'fabric');packet.rotation.z=(i-2)*.035;k.box(parent,'#eee2be',xx,y+.1,z+.035,.17,.045,.012);k.ball(parent,['#b69466','#8da178','#b57867','#a8859e','#c6a25f'][i],xx,y-.015,z+.035,.055,.06,.012);k.box(parent,'#778b61',xx,y+.055,z+.05,.025,.055,.008);}
}
export function buildToolRoom(){
 const k=createInteriorRoom({id:'toolroom',label:'Quarto de ferramentas',w:10,d:9,wall:'#d4c4a2',floor:'#b49970',wallKind:'wood',returnTo:'farm',returnSpawn:[6,-17],windows:true}),F=k.fixed;
 const seeds=shelf(k,-2.8,-3.85,2.85,'packets');for(let row=0;row<3;row++)seedPackets(k,seeds,0,.36+row*.63,.12);
 k.box(F,'#a38860',2.15,1.73,-4.22,3.6,1.68,.13,'wood');for(let i=0;i<5;i++){k.cyl(F,'#716d53',.85+i*.65,2.2,-4.09,.025,.13).rotation.x=Math.PI/2;hangingTool(k,F,.85+i*.65,1.70,-3.98,['hoe','axe','hammer','sickle','water'][i]);}
 const work=table(k,-3.78,-.25,1.52,2.55,.82);k.box(work,'#c9b084',0,.91,0,1.65,.08,2.64,'wood');k.box(work,'#b9c5af',0,.97,.35,.94,.035,.61,'fabric');k.beam(work,'#99794f',[-.35,1.01,-.75],[.35,1.01,-.20],.04,'wood');k.box(work,'#718376',-.35,1.01,-.75,.25,.13,.21);k.cyl(work,'#a78c60',.4,1.10,-.88,.12,.31,'wood');
 const boots=group(F,-3.6,0,2.1);for(const s of[-1,1]){k.cyl(boots,'#697b64',s*.21,.30,0,.14,.54);k.ball(boots,'#6f8066',s*.21,.09,.12,.16,.10,.25);k.cyl(boots,'#56664e',s*.21,.58,0,.145,.055);}k.solid(-3.6,2.1,.82,.65,{height:.65});
 const cold=group(F,3.65,0,-.45);k.box(cold,'#b1c2b5',0,.66,0,1.75,1.28,1.28);k.box(cold,'#d4d8c3',0,1.34,0,1.86,.14,1.38);k.box(cold,'#7c9385',0,1.42,.08,1.43,.025,1.0);k.box(cold,'#5f786d',0,1.46,.22,.55,.045,.075);k.box(cold,'#e4d5ab',0,.88,.65,.72,.21,.015);for(const xx of[-.66,.66])k.box(cold,'#73877b',xx,.09,0,.15,.17,1.15);k.solid(3.65,-.45,1.91,1.43,{height:1.48});
 // Chilled bottles, a basket of lemons and a small linen cloth.
 const drinks=table(k,3.65,-2.75,1.85,.88,.74);k.box(drinks,'#d8c5a5',0,.82,0,1.53,.03,.62,'fabric');for(let i=0;i<3;i++){k.cyl(drinks,i%2?'#8aa99d':'#a8c1b3',-.57+i*.34,1.01,-.06,.085,.34);k.cyl(drinks,'#c4b58d',-.57+i*.34,1.20,-.06,.045,.05);}for(let i=0;i<4;i++)k.ball(drinks,'#d0bf75',.3+(i%2)*.21,.91+Math.floor(i/2)*.07,.14,.1,.08,.08);vase(k,F,-4.37,.03,3.32,'#b08c6d');lantern(k,.25,2.33,-4.1);
 rug(k,0,2.50,2.4,1.38,'#969c7e');k.box(F,'#d8ccaa',-.2,1.72,-4.25,.82,.93,.04,'fabric');for(let i=0;i<4;i++)k.box(F,'#a9ad88',-.2,1.91-i*.14,-4.20,.52,.025,.015);
 k.interact({x:2,z:-2.95,type:'toolRack',label:'Escolher ou guardar ferramentas',radius:1.55});
 k.interact({x:-2.8,z:-2.55,type:'storage',label:'Prateleira de sementes',radius:1.55});
 k.interact({x:3.65,z:1.03,type:'cooler',label:'Pegar uma bebida refrescante',radius:1.4});
 k.interact({x:-3,z:1.28,type:'info',label:'Bancada de manutenção',radius:1.1,data:{name:'Bancada de manutenção',text:'Cabos encerados, botas secas e uma bancada cheirando a madeira. Aqui cada ferramenta ganha um lugar para esperar o próximo dia no campo.'}});
 return k.finishRoom();
}