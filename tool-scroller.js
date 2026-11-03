export function mountToolScroller(toolbar){
 let pointer=null,suppressUntil=0;const wrap=toolbar.parentElement;
 const refresh=()=>{wrap.classList.toggle('tools-before',toolbar.scrollLeft>3);wrap.classList.toggle('tools-after',toolbar.scrollLeft+toolbar.clientWidth<toolbar.scrollWidth-3)};
 toolbar.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,left:toolbar.scrollLeft,drag:false}});
 toolbar.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x;if(!pointer.drag&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(e.clientY-pointer.y)){pointer.drag=true;toolbar.setPointerCapture?.(e.pointerId);toolbar.classList.add('tool-dragging')}if(pointer.drag){e.preventDefault();toolbar.scrollLeft=pointer.left-dx;refresh()}},{passive:false});
 function finish(e){if(!pointer||e.pointerId!==pointer.id)return;if(pointer.drag){suppressUntil=performance.now()+450;if(toolbar.hasPointerCapture?.(e.pointerId))toolbar.releasePointerCapture(e.pointerId)}pointer=null;toolbar.classList.remove('tool-dragging');refresh()}
 toolbar.addEventListener('pointerup',finish);toolbar.addEventListener('pointercancel',finish);toolbar.addEventListener('lostpointercapture',()=>{pointer=null;toolbar.classList.remove('tool-dragging')});
 toolbar.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
 toolbar.addEventListener('contextmenu',e=>e.preventDefault());toolbar.addEventListener('scroll',refresh,{passive:true});
 toolbar.addEventListener('wheel',e=>{if(toolbar.scrollWidth<=toolbar.clientWidth)return;e.preventDefault();toolbar.scrollLeft+=e.deltaX||e.deltaY;refresh()},{passive:false});
 toolbar.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.code))return;const buttons=[...toolbar.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(i<0)return;e.preventDefault();e.stopPropagation();buttons[Math.max(0,Math.min(buttons.length-1,i+(e.code==='ArrowRight'?1:-1)))].focus()});
 const observer=new ResizeObserver(refresh);observer.observe(toolbar);refresh();return {reveal(id){toolbar.querySelector('[data-tool="'+id+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});refresh()}};
}
