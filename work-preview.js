/* Render a lightweight first-page preview from saved editable data, without running editors. */
(()=>{'use strict';const NS='http://www.w3.org/2000/svg';
function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=String(text);return e}
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const color=(v,d='#ffffff')=>/^#[\da-f]{3,8}$/i.test(v||'')?v:d;
function make(kind,payload){
 if(!payload)return null;if(kind==='design'&&window.DoanCore){try{const parsed=new DOMParser().parseFromString(DoanCore.svg(payload),'image/svg+xml');return document.importNode(parsed.documentElement,true)}catch{return null}};let w=960,h=540;const svg=node('svg',{viewBox:'0 0 960 540',role:'img','aria-label':'저장한 자료 첫 페이지 미리보기'});
 function text(value,x,y,size=28,fill='#292535'){svg.append(node('text',{x,y,'font-size':size,fill,'font-family':'sans-serif'},String(value||'').slice(0,90)))}
 if(kind==='canvas'){
  if(payload.layout==='a4'){w=595;h=842}const page=payload.pages?.[0];if(!page)return null;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.append(node('rect',{width:w,height:h,fill:color(page.background)}));
  for(const e of (page.elements||[]).slice(0,200)){
   if(e.hidden)continue;const x=num(e.x),y=num(e.y),ew=Math.max(1,num(e.w,100)),eh=Math.max(1,num(e.h,60)),g=node('g',{opacity:Math.min(1,Math.max(0,num(e.opacity,1))),transform:`rotate(${num(e.rotation)} ${x+ew/2} ${y+eh/2})`});
   const attrs={fill:color(e.fill,'#bfa9ef'),stroke:color(e.stroke,'none'),'stroke-width':Math.min(20,num(e.strokeWidth))};
   if(e.type==='image'&&/^data:image\/(png|jpeg);base64,/.test(e.src||''))g.append(node('image',{x,y,width:ew,height:eh,href:e.src,preserveAspectRatio:'xMidYMid slice'}));
   else if(e.type==='text'){const size=num(e.fontSize,28),lines=String(e.content||'').split('\n').slice(0,12);lines.forEach((line,i)=>g.append(node('text',{x:x+(e.align==='center'?ew/2:e.align==='right'?ew:0),y:y+size*(1+i*1.25),'font-size':size,fill:color(e.fill,'#292535'),'font-weight':e.bold?'bold':'normal','text-anchor':e.align==='center'?'middle':e.align==='right'?'end':'start','font-family':'sans-serif'},line.slice(0,120))))}
   else if(e.type==='ellipse')g.append(node('ellipse',{cx:x+ew/2,cy:y+eh/2,rx:ew/2,ry:eh/2,...attrs}));
   else if(e.type==='triangle')g.append(node('polygon',{points:`${x+ew/2},${y} ${x+ew},${y+eh} ${x},${y+eh}`,...attrs}));
   else if(e.type==='line')g.append(node('line',{x1:x,y1:y,x2:x+ew,y2:y+eh,...attrs}));
   else if(e.type==='activity')g.append(node('rect',{x,y,width:ew,height:eh,rx:12,fill:'#eee7ff'}),node('text',{x:x+15,y:y+42,'font-size':26,fill:'#49316f'},e.activity?.title||e.activity?.kind||'수업 활동'));
   else g.append(node('rect',{x,y,width:ew,height:eh,...attrs}));svg.append(g);
  }
 }else{
  if(['document','design'].includes(kind)){w=595;h=842;svg.setAttribute('viewBox',`0 0 ${w} ${h}`)}svg.append(node('rect',{width:w,height:h,fill:'#ffffff'}));
  if(kind==='slides'){const first=payload.slides?.[0];text(first?.eyebrow,55,85,22);text(first?.title||payload.title,55,180,46);String(first?.body||'').split('\n').slice(0,7).forEach((v,i)=>text(v,55,260+i*34,25))}
  else if(kind==='document'){text(payload.title,42,70,30);let y=120;for(const block of (payload.blocks||[]).slice(0,10)){if(block.type==='table'){for(const row of (block.rows||[]).slice(0,5)){text(row.join('  |  '),42,y,16);y+=28}}else{for(const line of String(block.text||'').split('\n').slice(0,4)){text(line,42,y,block.type==='heading'?23:16);y+=29}}y+=12}}
  else if(kind==='quiz'){text(payload.cards?.[0]?.front,55,210,42);text('퀴즈 · '+(payload.cards?.length||0)+'장',55,330,25)}
  else return null;
 }
 return svg;
}
window.GulliverWorkPreview={make};})();
