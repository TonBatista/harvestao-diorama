const STORAGE_KEY='harvestao-camera-zoom';
export function mountZoomControls(canvas,world,isPaused){
 const out=document.getElementById('zoomOut'),reset=document.getElementById('zoomReset'),into=document.getElementById('zoomIn'),slider=document.getElementById('zoomSlider');
 const rail=slider?.closest('.zoom-rail');let idleTimer;const wake=()=>{rail?.classList.remove('zoom-idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>rail?.classList.add('zoom-idle'),1800)};
 rail?.classList.add('zoom-idle');rail?.addEventListener('pointerenter',wake);rail?.addEventListener('pointerdown',wake);rail?.addEventListener('focusin',wake);rail?.addEventListener('pointermove',wake);
 let saveTimer;
 function apply(value,persist=true){
  if(persist)wake();const target=world.setZoom(value),{min,max}=world.zoom;
  reset.textContent=Math.round(target*100)+'%';if(slider){slider.min=Math.round(min*100);slider.max=Math.round(max*100);slider.value=Math.round(target*100);slider.setAttribute('aria-valuetext',Math.round(target*100)+'%');}out.disabled=target<=min+.001;into.disabled=target>=max-.001;
  if(persist){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,String(world.zoom.target))}catch{}},150)}
 }
 slider?.addEventListener('input',()=>{if(!isPaused())apply(Number(slider.value)/100)});
 try{const stored=Number.parseFloat(localStorage.getItem(STORAGE_KEY));if(Number.isFinite(stored))apply(stored,false)}catch{}
 apply(world.zoom.target,false);
 out.addEventListener('click',()=>apply(world.zoom.target/1.2));into.addEventListener('click',()=>apply(world.zoom.target*1.2));reset.addEventListener('click',()=>apply(1));
 canvas.addEventListener('wheel',e=>{if(isPaused()||e.ctrlKey||e.metaKey)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);apply(world.zoom.target*Math.exp(-Math.max(-150,Math.min(150,delta))*.0015))},{passive:false});
 addEventListener('keydown',e=>{if(isPaused()||e.ctrlKey||e.metaKey||e.altKey)return;if(['Equal','NumpadAdd'].includes(e.code)){e.preventDefault();apply(world.zoom.target*1.2)}else if(['Minus','NumpadSubtract'].includes(e.code)){e.preventDefault();apply(world.zoom.target/1.2)}else if(['Digit0','Numpad0'].includes(e.code)){e.preventDefault();apply(1)}});
 const pointers=new Map();let pinch=null;
 const beginPinch=()=>{if(pointers.size!==2){pinch=null;return}const [a,b]=pointers.values();pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:world.zoom.target}};
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||isPaused())return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);beginPinch()});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;if(isPaused()){pointers.clear();pinch=null;return}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&pointers.size===2&&pinch.distance>10){const [a,b]=pointers.values();apply(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance)}});
 const end=e=>{pointers.delete(e.pointerId);beginPinch()};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
 addEventListener('blur',()=>{pointers.clear();pinch=null});
}
