// This script stays outside the module graph so even an import failure is visible.
(() => {
 // Older mobile browsers have WebGL2 but not the newer 2D roundRect method.
 if(typeof CanvasRenderingContext2D!=='undefined'&&!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r=0){
   r=Math.max(0,Math.min(Number(Array.isArray(r)?r[0]:r)||0,Math.abs(w)/2,Math.abs(h)/2));
   if(w<0){x+=w;w=-w}if(h<0){y+=h;h=-h}
   this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.quadraticCurveTo(x+w,y,x+w,y+r);
   this.lineTo(x+w,y+h-r);this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
   this.lineTo(x+r,y+h);this.quadraticCurveTo(x,y+h,x,y+h-r);
   this.lineTo(x,y+r);this.quadraticCurveTo(x,y,x+r,y);this.closePath();return this;
  };
 }
 let failed=false;
 function loading(){let box=document.getElementById('loading');if(!box){box=document.createElement('div');box.id='loading';document.body.append(box)}return box}
 function failure(error){
  if(failed)return;failed=true;console.error('Falha ao abrir Harvestão:',error);
  const box=loading();box.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background:#eee3c7;color:#493725;text-align:center;overflow:auto';box.replaceChildren();
  const title=document.createElement('strong');title.textContent='Não foi possível abrir a fazenda';
  const hint=document.createElement('span');hint.textContent='Seu progresso não foi apagado. Tente o modo leve abaixo.';
  const details=document.createElement('code');details.style.cssText='font-size:12px;max-width:95%;overflow-wrap:anywhere;white-space:pre-wrap';details.textContent='0.55.1 · '+String(error?.message||error||'Falha desconhecida').slice(0,500);
  const retry=document.createElement('button');retry.textContent='Abrir em modo leve';retry.onclick=()=>{const url=new URL(location.href);url.searchParams.set('leve','1');url.searchParams.set('v','0.55.1');location.replace(url.href)};
  box.append(title,hint,details,retry);
 }
 window.addEventListener('error',event=>{if(!window.farmReady&&event.error)failure(event.error)});
 window.addEventListener('unhandledrejection',event=>{if(!window.farmReady)failure(event.reason)});
 document.getElementById('farm').addEventListener('webglcontextlost',event=>{event.preventDefault();failure(new Error('O navegador interrompeu os gráficos (WebGL).'))});
 setTimeout(()=>{if(!window.farmReady&&!failed){const strong=document.querySelector('#loading strong'),span=document.querySelector('#loading span');if(strong)strong.textContent='Carregando a fazenda…';if(span)span.textContent='A primeira abertura pode levar mais tempo na conexão móvel.'}},15000);
 import('./game.js?v=0.55.1').catch(failure);
})();
