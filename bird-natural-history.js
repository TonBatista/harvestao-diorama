// Original summaries; source links identify the field references, not imported media.
const cornell=name=>'https://www.allaboutbirds.org/guide/'+name+'/id';
const brasilia='https://www.gov.br/icmbio/pt-br/centrais-de-conteudo/publicacoes/guias-de-aves/guia-aves-pnb-completo.pdf/@@download/file';
export const NEW_BIRDS=[
 {id:'canario',name:'Canário-da-terra',scientificName:'Sicalis flaveola',habitat:'Fazendas e jardins',description:'Procura sementes no chão em pequenos grupos e usa cercas como poleiros.',sourceUrl:cornell('Saffron_Finch')},
 {id:'rolinha',name:'Rolinha-roxa',scientificName:'Columbina talpacoti',habitat:'Praças e áreas abertas',description:'Caminha em busca de sementes. Pode ser vista em pares e pequenos bandos.',sourceUrl:cornell('Ruddy_Ground_Dove')},
 {id:'joaobarro',name:'João-de-barro',scientificName:'Furnarius rufus',habitat:'Campos e caminhos',description:'Anda pelo solo procurando alimento; o casal constrói seu conhecido ninho de barro.',sourceUrl:'https://journal.afonet.org/vol95/iss4/art2/'},
 {id:'sanhaco',name:'Sanhaço-cinzento',scientificName:'Thraupis sayaca',habitat:'Árvores de jardins e pomares',description:'Procura frutos entre os ramos e ajuda a dispersar sementes.',sourceUrl:brasilia},
 {id:'coruja',name:'Coruja-buraqueira',scientificName:'Athene cunicularia',habitat:'Campos baixos',description:'Vigia o terreno perto de tocas. Pode caçar de dia ou à noite.',sourceUrl:'https://www.allaboutbirds.org/guide/Burrowing_Owl/lifehistory'},
 {id:'garca',name:'Garça-branca-grande',scientificName:'Ardea alba',habitat:'Margens do lago e riachos',description:'Avança lentamente e espera junto à água antes de capturar pequenos animais com o bico.',sourceUrl:'https://www.allaboutbirds.org/guide/Great_Egret/lifehistory'},
 {id:'martim',name:'Martim-pescador-pequeno',scientificName:'Chloroceryle americana',habitat:'Margens arborizadas',description:'Observa a água de um poleiro e mergulha para capturar pequenos peixes.',sourceUrl:'https://www.allaboutbirds.org/guide/Green_Kingfisher/lifehistory'},
 {id:'ticotico',name:'Tico-tico',scientificName:'Zonotrichia capensis',habitat:'Jardins, caminhos e campos',description:'Dá pequenos saltos pelo chão perto de arbustos, parques e estradas.',sourceUrl:'https://nationalzoo.si.edu/animals/rufous-collared-sparrow'},
 {id:'carcara',name:'Carcará',scientificName:'Caracara plancus',habitat:'Campos abertos e fazendas',description:'Procura alimento também caminhando no chão e observa áreas abertas de pontos altos.',sourceUrl:'https://biodiversidade.unespar.edu.br/colecoes/zoologica/aves/carcara-caracara-plancus/'},
 {id:'beijaflor',name:'Beija-flor-tesoura',scientificName:'Eupetomena macroura',habitat:'Jardins floridos',description:'Visita flores em busca de néctar e também captura pequenos insetos; defende suas fontes de alimento.',sourceUrl:'https://lapid.museunacional.ufrj.br/hortobotanico/aves/epetomenamacroura.html'},
 {id:'picapau',name:'Pica-pau-verde-barrado',scientificName:'Colaptes melanochloros',habitat:'Bosques e bordas arborizadas',description:'Procura alimento em árvores e também no solo; sua plumagem apresenta barras e manchas escuras.',sourceUrl:'https://zoo.df.gov.br/pica-pau-verde-barrado'},
 {id:'queroquero',name:'Quero-quero',scientificName:'Vanellus chilensis',habitat:'Campos e margens úmidas',description:'Procura alimento no chão de áreas abertas, alternando caminhadas com pausas de vigilância.',sourceUrl:'https://educacao.curitiba.pr.gov.br/conteudo/quero-quero/12873'}
].map(s=>Object.freeze({...s,kind:'bird',icon:'🪶'}));

// Gameplay scale and animation profiles, not measurements or abundance estimates.
const open=['farm','homestead','village','valleyTrail','haras'],woods=['mountain','lake','valleyTrail','farm'],wet=['lake','mountain','beach'];
export const BIRD_PROFILES={
 bemtevi:{areas:[...open,'mountain'],behavior:'sally',body:'#675b41',belly:'#d3bc4c',head:'#343e37',scale:1},
 sabia:{areas:[...open,'mountain'],behavior:'hop',body:'#82715c',belly:'#c88856',head:'#7b7467',scale:1},
 urutau:{areas:woods,behavior:'camouflage',body:'#887d69',belly:'#a79b80',head:'#756f61',scale:1.45,night:true},
 gull:{areas:['beach'],behavior:'glide',body:'#d4dad5',belly:'#f1eee0',head:'#eee9d9',scale:1.55},
 canario:{areas:open,behavior:'peck',body:'#bca446',belly:'#e3ca50',head:'#e2ac3e',scale:.8,group:2},
 rolinha:{areas:open,behavior:'walk',body:'#a66d56',belly:'#c6a08a',head:'#9b9890',scale:.9,group:2},
 joaobarro:{areas:open,behavior:'walk',body:'#a66640',belly:'#c9aa83',head:'#a6714d',scale:1},
 sanhaco:{areas:[...woods,'village','homestead'],behavior:'fruit',body:'#86a7a3',belly:'#bbc7be',head:'#9eb9b5',scale:.9},
 coruja:{areas:[...open,'mountain'],behavior:'watch',body:'#9f8f70',belly:'#c9bca0',head:'#8c8168',scale:1.1},
 garca:{areas:wet,behavior:'wade',body:'#e8e6dc',belly:'#f0eade',head:'#f0ebdf',scale:1.6},
 martim:{areas:wet,behavior:'dive',body:'#416f59',belly:'#c68b63',head:'#37664f',scale:.85},
 ticotico:{areas:open,behavior:'hop',body:'#8b7157',belly:'#d3c5a7',head:'#a9aaa1',scale:.8},
 carcara:{areas:[...open,'mountain'],behavior:'patrol',body:'#4b4436',belly:'#bfb6a0',head:'#403d33',scale:1.55},
 beijaflor:{areas:[...open,'lake'],behavior:'hover',body:'#4b8b69',belly:'#509575',head:'#426280',scale:.6},
 picapau:{areas:woods,behavior:'tap',body:'#7f8c4e',belly:'#b7b16c',head:'#bb5f4a',scale:1.05},
 queroquero:{areas:[...open,'lake'],behavior:'watchwalk',body:'#9c9d8c',belly:'#e0ddcd',head:'#6c7772',scale:1.15}
};
