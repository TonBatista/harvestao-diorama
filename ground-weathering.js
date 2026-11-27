// Painted into the shared texture once: no decal meshes or per-frame work.
const noise=n=>{const v=Math.sin(n*71.173+23.71)*14537.31;return v-Math.floor(v)};
export function weatherStone(ctx,x,y,w,h,seed){
 const n=noise(seed+901),small=w<15;
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,w-2,h-2);ctx.clip();
 if(n>.965){
  // A missing paving stone reveals recessed soil and loose gravel.
  ctx.fillStyle='#71634d';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#403d3299';ctx.lineWidth=small?1:2;ctx.strokeRect(x+2,y+2,w-4,h-4);
  for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#a6987b':'#565443';ctx.beginPath();ctx.ellipse(x+w*noise(seed+i*17),y+h*noise(seed+i*31),w*.06,h*.045,0,0,Math.PI*2);ctx.fill()}
 }else if(n>.78){
  ctx.strokeStyle='#3f443a88';ctx.lineWidth=small?.5:.9;
  const ax=x+w*.25,bx=x+w*.46,by=y+h*.48;
  ctx.beginPath();ctx.moveTo(ax,y);ctx.lineTo(bx,by);ctx.lineTo(x+w*.33,y+h*.74);ctx.lineTo(x+w*.58,y+h);ctx.moveTo(bx,by);ctx.lineTo(x+w*.78,y+h*.38);ctx.stroke();
  ctx.strokeStyle='#eee5c633';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(ax+1,y);ctx.lineTo(bx+1,by);ctx.stroke();
 }
 if(noise(seed+553)>.8){
  for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#69794e77':'#87936477';ctx.beginPath();ctx.ellipse(x+w*(.04+noise(seed+i)*.24),y+h*noise(seed+i+71),w*(.02+noise(i+seed)*.06),h*.06,noise(seed+i)*3,0,Math.PI*2);ctx.fill()}
 }
 if(n>.95){ctx.strokeStyle='#667e46';ctx.lineWidth=small?.6:1;for(let i=0;i<4;i++){const px=x+w*.16+i*w*.05;ctx.beginPath();ctx.moveTo(px,y+h*.8);ctx.quadraticCurveTo(px-1,y+h*.6,px+(i-1)*2,y+h*(.4+i*.06));ctx.stroke()}}
 ctx.restore();
}
export function weatherSoil(ctx,size,kind){
 const scale=size/512;
 for(let i=0;i<48;i++){
  const x=noise(i+521)*size,y=noise(i+691)*size,r=(2+noise(i)*6)*scale;
  ctx.fillStyle=kind==='moss'?'#d2c4a128':'#5b604c26';ctx.beginPath();ctx.ellipse(x,y,r*2,r*.6,noise(i)*Math.PI,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=i%3?'#b3aa8766':'#6e705a55';ctx.beginPath();ctx.ellipse(x,y,r*.45,r*.22,.4,0,Math.PI*2);ctx.fill();
 }
 for(let i=0;i<16;i++){const x=noise(i+123)*size,y=noise(i+987)*size;ctx.strokeStyle='#5f503126';ctx.lineWidth=.8*scale;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5*scale,y+6*scale);ctx.lineTo(x+2*scale,y+11*scale);ctx.lineTo(x+8*scale,y+16*scale);ctx.stroke()}
}
