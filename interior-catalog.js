export const INTERIOR_DESTINATIONS=[
 {id:'chapel',label:'Capela das Estações',description:'Vitral, flores e memórias da comunidade',icon:'✧',exterior:'village',entry:[-9.5,-7.5],returnSpawn:[-9.5,-6.5],replaces:['Capela da vila']},
 {id:'library',label:'Biblioteca do Vale',description:'Livros, herbário e cadernos de aves',icon:'▤',exterior:'village',entry:[2.3,-8],returnSpawn:[2.3,-7.3],replaces:['Ler na biblioteca']},
 {id:'clinic',label:'Clínica da Clara',description:'Botica, ervas e cuidados do campo',icon:'✚',exterior:'village',entry:[-10.7,12.5],returnSpawn:[-10.7,12.5],replaces:['Clínica da Clara']},
 {id:'inn',label:'Pousada Girassol',description:'Café, tortas, recepção e quarto de hóspedes',icon:'☕',exterior:'village',entry:[9.5,2.1],returnSpawn:[9.5,2.1],replaces:['Pousada Girassol']},
 {id:'rosaHouse',label:'Casa da Rosa',description:'Costura, cozinha e colchas artesanais',icon:'⌂',exterior:'village',entry:[10.75,-7.1],returnSpawn:[10.75,-7],replaces:[]},
 {id:'smithy',label:'Ferraria do Miguel',description:'Forja, bigorna e ferramentas',icon:'⚒',exterior:'village',entry:[9,13.5],returnSpawn:[9,13.3],replaces:['Bancada da ferraria']},
 {id:'fisherHouse',label:'Casa do Pescador',description:'Redes, conchas e lembranças do mar',icon:'≈',exterior:'beach',entry:[-10,-1.3],returnSpawn:[-10,-1.3],replaces:['Visitar a casa do pescador']},
 {id:'lighthouse',label:'Farol da Maré',description:'Cartas náuticas, escada e lente do farol',icon:'☼',exterior:'beach',entry:[-2.5,-9.1],returnSpawn:[-2.5,-9.1],replaces:['Olhar o farol']},
 {id:'carpenter',label:'Oficina do Tomé',description:'Madeira, projetos e construções',icon:'⌂',exterior:'lake',entry:[-31,-22.2],returnSpawn:[-31,-22.2],replaces:[]},
 {id:'mine',label:'Mina da Lua',description:'Galeria de entrada, vagoneta e cristais',icon:'◆',exterior:'mountain',entry:[.1,-8.2],returnSpawn:[.1,-8.2],replaces:['Examinar a mina']}
].map(place=>({...place,interior:true}));
export function addInteriorEntrances(k,area){for(const place of INTERIOR_DESTINATIONS){if(place.exterior!==area)continue;for(let i=k.interactions.length-1;i>=0;i--)if(place.replaces.includes(k.interactions[i].label))k.interactions.splice(i,1);k.portal({x:place.entry[0],z:place.entry[1],to:place.id,label:'Entrar em '+place.label,radius:1.4})}}