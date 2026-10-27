import {SPECIES,migrateBirding,recordSighting,listRecords,getBirdingProgress} from './birding.js?v=0.25';

const cameraIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13.5" r="4"/><path d="M17.5 10h1"/></svg>';
const bookIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zM12 5v15M6 8h3M6 11h3"/><path d="M15.3 10.1c1.7-1.2 3.3-.2 2.7 1.3-.4 1-1.5 1.8-2.7 2.2-1.1-.4-2-1.3-2.2-2.2"/></svg>';
const birdIcon='<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M17 42c4-10 8-14 17-16 2-10 11-14 19-9 4 2 6 6 6 10l9 5-10 3c-2 16-24 22-35 11l-12 4z"/><path d="M30 31c10-3 19 2 19 9-11 5-18 1-19-9z"/><circle cx="51" cy="25" r="1.6"/><path d="M36 49v9m9-11 1 11m-15 0h9m2 0h9"/></svg>';
const animalIcon='<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M17 28c3-9 12-12 25-9l9 7c11-8 20 1 16 12l-7 6-4 12h-7l-1-13H32l-3 13h-7l-1-17-6-5z"/><path d="m52 24-1-9 8 6m4 4 9-7-1 12M14 30l-5 9"/><circle cx="59" cy="31" r="1.5"/></svg>';
const places={farm:'Fazenda',house:'Casa',barn:'Celeiro',village:'Vila Mineral',mountain:'Floresta da Montanha da Lua',beach:'Praia das Conchas',market:'Mercado da vila'};
const seasons=['Primavera','Verão','Outono','Inverno'];
const PAGE_SIZE=50;
const photoSource=value=>typeof value==='string'&&/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(value)?value:null;
const element=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
const button=(className,text,label)=>{const el=element('button',className,text);el.type='button';if(label)el.setAttribute('aria-label',label);return el;};
const dateLabel=value=>{if(!value||typeof value!=='object')return 'Neste vale';const time=Number.isFinite(value.minutes)?' · '+String(Math.floor(value.minutes/60)).padStart(2,'0')+':'+String(Math.floor(value.minutes%60)).padStart(2,'0'):'';return 'Dia '+(value.day||1)+' · '+(seasons[value.season]||'Primavera')+' · Ano '+(value.year||1)+time;};

export function mountPhotographyUI({state,world,notify=()=>{},save=()=>{},isPaused=()=>false,selectTool=()=>{},beforeOpen=()=>{}}){
 migrateBirding(state);
 const albumButton=button('bird-album-button',undefined,'Abrir caderno de aves e animais');albumButton.id='birdAlbumButton';albumButton.title='Caderno de campo (P)';albumButton.innerHTML=bookIcon;
 const badge=element('span','photo-album-badge','0');badge.setAttribute('aria-hidden','true');albumButton.append(badge);document.querySelector('.top-actions')?.append(albumButton);
 const finder=element('section','photo-viewfinder');finder.hidden=true;finder.setAttribute('aria-label','Visor da câmera fotográfica');
 const frame=element('div','photo-framing');frame.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)frame.append(element('i','photo-corner photo-corner-'+i));
 const caption=element('div','photo-caption');const cameraMark=element('span','photo-camera-mark');cameraMark.innerHTML=cameraIcon;
 const captionCopy=element('div','photo-caption-copy');const captionTitle=element('strong',null,'Caderno de campo');const captionHint=element('small',null,'Enquadre uma ave ou animal');captionCopy.append(captionTitle,captionHint);caption.append(cameraMark,captionCopy);
 const targetRing=element('div','photo-target-ring');targetRing.hidden=true;targetRing.setAttribute('aria-hidden','true');targetRing.innerHTML='<i></i><i></i><i></i><i></i>';
 const shutter=button('photo-shutter',undefined,'Fotografar ave ou animal enquadrado');shutter.innerHTML=cameraIcon;shutter.title='Fotografar (X)';
 const shutterHint=element('span','photo-shutter-hint','FOTOGRAFAR');const flash=element('div','photo-flash');flash.setAttribute('aria-hidden','true');
 finder.append(frame,caption,targetRing,shutter,shutterHint,flash);document.body.append(finder);
 const album=element('dialog','photo-album');album.id='birdAlbum';album.setAttribute('aria-labelledby','birdAlbumTitle');
 const closeButton=button('close','×','Fechar caderno de campo');
 const eyebrow=element('div','dialog-eyebrow','SEU OLHAR SOBRE O VALE');const title=element('h2',null,'Caderno de campo');title.id='birdAlbumTitle';
 const introduction=element('p','photo-album-intro','Encontre aves e animais, enquadre com a câmera e guarde sua descoberta. Cada espécie fotografada ganha um ✓ na coleção.');
 const summary=element('div','photo-album-summary');const total=element('strong');const birdCount=element('span');const photoCount=element('span');summary.append(total,birdCount,photoCount);
 const progress=element('div','photo-collection-progress');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','Espécies fotografadas');const progressFill=element('i');progress.append(progressFill);
 const filterBar=element('div','photo-filter-bar');const search=element('input','photo-search');search.type='search';search.placeholder='Procurar espécie ou habitat';search.setAttribute('aria-label','Procurar espécie ou habitat');search.autocomplete='off';search.spellcheck=false;
 const observedLabel=element('label','photo-observed-filter');const observedOnly=element('input');observedOnly.type='checkbox';observedLabel.append(observedOnly,document.createTextNode('Só fotografadas'));filterBar.append(search,observedLabel);
 const tabs=element('div','photo-kind-tabs');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Filtrar tipo de espécie');
 const kindButtons=[['all','Todas'],['bird','Aves'],['animal','Outros animais']].map(([kind,text])=>{const tab=button(null,text);tab.dataset.kind=kind;tab.setAttribute('aria-pressed',String(kind==='all'));tabs.append(tab);return tab;});
 const detail=element('section','photo-species-detail');detail.hidden=true;detail.setAttribute('aria-label','Detalhes da espécie');
 const resultCount=element('p','photo-result-count');resultCount.setAttribute('aria-live','polite');const list=element('div','photo-species-grid');
 const pagination=element('nav','photo-pagination');pagination.setAttribute('aria-label','Páginas do catálogo');const prev=button('secondary','← Anterior');const pageLabel=element('span');const next=button('secondary','Próxima →');pagination.append(prev,pageLabel,next);
 const footnote=element('small','footnote','As fotografias e descobertas ficam neste navegador e acompanham seu arquivo de progresso. Novas espécies poderão entrar neste caderno.');
 const equipButton=button('primary photo-equip-camera','Pegar a câmera e explorar →');
 album.append(closeButton,eyebrow,title,introduction,summary,progress,filterBar,tabs,detail,resultCount,list,pagination,equipButton,footnote);document.body.append(album);
 let selected=null,cooldown=0,busy=false,elapsed=.2,badgeElapsed=2,lastCaption='',lastTarget='',lastBadge='',filterKind='all',page=0,searchTimer=0,lastTool=null;

 function getCandidates(){const targets=world.photoTargets?.();return Array.isArray(targets)?targets.filter(subject=>subject&&subject.inFrame&&Number.isFinite(subject.distance)&&subject.distance<=10&&Number.isFinite(subject.screenX)&&Number.isFinite(subject.screenY)):[];}
 function chooseTarget(){return getCandidates().filter(subject=>subject.screenX>=.2&&subject.screenX<=.8&&subject.screenY>=.2&&subject.screenY<=.8).sort((a,b)=>Math.hypot(a.screenX-.5,a.screenY-.5)-Math.hypot(b.screenX-.5,b.screenY-.5)||a.distance-b.distance)[0]||null;}
 function blockedMessage(){return state.carryingHay?'Entregue ou devolva o feno antes de fotografar.':state.held?'Guarde sua colheita para segurar a câmera.':'';}
 function refreshBadge(){const p=getBirdingProgress(state),key=p.registered+'/'+p.total;if(key!==lastBadge){lastBadge=key;badge.textContent=String(p.registered);albumButton.setAttribute('aria-label','Abrir caderno de campo · '+p.registered+' de '+p.total+' espécies fotografadas');}}
 function setCaption(heading,hint){const key=heading+'|'+hint;if(key===lastCaption)return;lastCaption=key;captionTitle.textContent=heading;captionHint.textContent=hint;}
 function refreshFinder(){
  const show=state.tool==='camera'&&!isPaused();finder.hidden=!show;if(!show){selected=null;targetRing.hidden=true;return;}
  const blocked=blockedMessage();selected=blocked?null:chooseTarget();shutter.disabled=!!blocked||busy||cooldown>0||!selected;finder.classList.toggle('photo-ready',!!selected&&!blocked);
  if(blocked)setCaption('Mãos ocupadas',blocked);
  else if(busy||cooldown>0)setCaption('Um instante…','Guardando a lembrança no caderno');
  else if(selected){const species=SPECIES.find(species=>species.id===selected.speciesId);setCaption(species?.name||selected.name||'Vida no vale',Math.round(selected.distance*10)/10+' m · Pronto para fotografar');}
  else if(getCandidates().length)setCaption('Enquadre com calma','Traga a ave ou animal para dentro dos quatro cantos.');
  else setCaption('Procure a vida no vale','Aproxime-se de uma ave ou animal e ajuste o zoom.');
  targetRing.hidden=!selected;
  if(selected){const key=selected.id+'|'+Math.round(selected.screenX*1000)+'|'+Math.round(selected.screenY*1000);if(key!==lastTarget){lastTarget=key;targetRing.style.left=(selected.screenX*100)+'%';targetRing.style.top=(selected.screenY*100)+'%';}}
 }
 function recordMap(){return new Map(listRecords(state).map(record=>[record.speciesId,record]));}
 function renderDetail(species,record){
  detail.replaceChildren();detail.hidden=false;
  const heading=element('div','photo-detail-heading');heading.append(element('div','dialog-eyebrow',record?'ESPÉCIE REGISTRADA ✓':'UMA DESCOBERTA À SUA ESPERA'),element('h3',null,species.name),element('em',null,species.scientificName||''));detail.append(heading);
  const src=photoSource(record?.bestPhoto);if(src){const image=element('img','photo-detail-image');image.src=src;image.alt='Seu registro de '+species.name;image.decoding='async';image.width=256;image.height=144;detail.append(image);}
  else{const silhouette=element('div','photo-detail-silhouette');silhouette.innerHTML=species.kind==='bird'?birdIcon:animalIcon;silhouette.append(element('span',null,record?'Registro sem miniatura':'Ainda não fotografada'));detail.append(silhouette);}
  detail.append(element('p','photo-description',species.description||'Observe esta espécie em seu habitat e registre sua presença.'));
  const metadata=element('dl','photo-detail-metadata');const row=(label,value)=>metadata.append(element('dt',null,label),element('dd',null,value));
  row('Habitat',species.habitat||'Pelo vale');
  if(record){row('Primeiro encontro',dateLabel(record.firstSeen));row('Local do registro',places[record.area]||record.area||'Neste vale');row('Fotografias',String(record.count||1));}
  else row('Como registrar','Equipe a câmera, aproxime-se e enquadre a espécie.');
  detail.append(metadata);const fold=button('photo-detail-fold','Fechar detalhes ↑');fold.onclick=()=>{detail.hidden=true;};detail.append(fold);
 }
 function renderAlbum(){
  const p=getBirdingProgress(state),records=recordMap();total.textContent=p.registered+' de '+p.total+' espécies';birdCount.textContent='Aves · '+p.birdsRegistered+'/'+p.birdsTotal;photoCount.textContent=p.photos+' '+(p.photos===1?'fotografia':'fotografias');
  progress.setAttribute('aria-valuenow',String(p.registered));progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(p.total));progressFill.style.width=(p.total?100*p.registered/p.total:0)+'%';
  const query=search.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const filtered=SPECIES.filter(species=>(filterKind==='all'||species.kind===filterKind)&&(!observedOnly.checked||records.has(species.id))&&(!query||[species.name,species.scientificName,species.habitat].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(query)));
  const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));page=Math.min(page,pages-1);list.replaceChildren();detail.hidden=true;
  resultCount.textContent=filtered.length+' '+(filtered.length===1?'espécie':'espécies')+(query?' encontradas':' no catálogo');
  if(!filtered.length){const empty=element('div','photo-empty');empty.append(element('strong',null,'O caderno está esperando uma descoberta.'),element('p',null,query?'Tente outro nome ou habitat.':'Leve sua câmera à floresta ou ao celeiro e faça seu primeiro registro.'));list.append(empty);}
  for(const species of filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){
   const record=records.get(species.id),card=button('photo-species-card'+(record?' is-recorded':''));card.setAttribute('aria-label',species.name+' · '+(record?'Fotografada, abrir registro':'Ainda não fotografada, ver habitat'));
   const picture=element('span','photo-species-picture'),src=photoSource(record?.bestPhoto);
   if(src){const image=element('img');image.src=src;image.alt='';image.loading='lazy';image.decoding='async';image.width=256;image.height=144;picture.append(image);}
   else{const silhouette=element('span','photo-species-silhouette');silhouette.innerHTML=species.kind==='bird'?birdIcon:animalIcon;picture.append(silhouette);}
   const check=element('span','photo-species-check',record?'✓':'');check.setAttribute('aria-hidden','true');picture.append(check);
   const body=element('span','photo-species-copy');body.append(element('strong',null,species.name),element('em',null,species.scientificName||''),element('small',null,record?'✓ Fotografada · '+(record.count||1)+' registro'+(record.count===1?'':'s'):species.habitat||'Ainda não fotografada'));
   card.append(picture,body);card.onclick=()=>{renderDetail(species,record);detail.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};list.append(card);
  }
  pagination.hidden=pages<=1;prev.disabled=page<=0;next.disabled=page>=pages-1;pageLabel.textContent=(page+1)+' / '+pages;
  refreshBadge();
 }
 function openAlbum(){if(isPaused())return;beforeOpen();world.stop?.();renderAlbum();album.showModal();}
 function close(){if(album.open)album.close();}
 async function shoot(){
  if(state.tool!=='camera'||isPaused()||busy||cooldown>0)return {changed:false};
  const blocked=blockedMessage();if(blocked){notify(blocked);return {changed:false};}
  const target=chooseTarget();if(!target){notify('Aproxime-se e enquadre uma ave ou animal dentro dos quatro cantos.');return {changed:false};}
  busy=true;cooldown=.8;refreshFinder();
  try{
   const capture=world.capturePhoto?.(target);const image=photoSource(capture&&typeof capture.then==='function'?await capture:capture);
   if(!image){notify('A câmera não conseguiu guardar a imagem. Tente fotografar de novo.');return {changed:false};}
   const result=recordSighting(state,target,image);
   if(result.changed){world.act?.('camera');save();notify(result.message||'Fotografia guardada no caderno.');flash.classList.remove('show');void flash.offsetWidth;flash.classList.add('show');refreshBadge();}
   else if(result.message)notify(result.message);
   return result;
  }catch(error){console.error('Não foi possível fotografar.',error);notify('Não foi possível guardar a fotografia. Tente novamente.');return {changed:false};}
  finally{busy=false;refreshFinder();}
 }
 function update(dt=0){const step=Number.isFinite(dt)?Math.max(0,dt):0;cooldown=Math.max(0,cooldown-step);elapsed+=step;badgeElapsed+=step;if(state.tool!==lastTool||elapsed>=.1){lastTool=state.tool;elapsed=0;refreshFinder();}if(badgeElapsed>=1){badgeElapsed=0;refreshBadge();}}
 albumButton.onclick=openAlbum;closeButton.onclick=close;shutter.onclick=shoot;equipButton.onclick=()=>{close();selectTool('camera');};
 observedOnly.onchange=()=>{page=0;renderAlbum();};search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=0;renderAlbum();},120);};
 for(const tab of kindButtons)tab.onclick=()=>{filterKind=tab.dataset.kind;page=0;kindButtons.forEach(button=>button.setAttribute('aria-pressed',String(button===tab)));renderAlbum();};
 prev.onclick=()=>{if(page>0){page--;renderAlbum();}};next.onclick=()=>{page++;renderAlbum();};
 album.addEventListener('close',()=>{detail.hidden=true;refreshFinder();});refreshBadge();
 return {update,shoot,openAlbum,close};
}
