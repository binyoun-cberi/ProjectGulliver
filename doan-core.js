(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.DoanCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=595,H=842,MAX_OBJECTS=200;
const PALETTE=['#ffffff','#26384f','#367db4','#f1b64a','#ee7e83','#7cc9ae','#e9eefd','#ffdfe7'];
const types=['rect','ellipse','triangle','star','line','text','image'];
const sizes={A4:{w:595,h:842},A5:{w:420,h:595}};
let seed=1;
const nextId=()=> 'shape-'+(seed++);
const rect=(x,y,w,h,fill='#ffffff',stroke='#cbd6e3',sw=2,r=10)=>({id:nextId(),type:'rect',x,y,w,h,fill,stroke,strokeWidth:sw,r});
const ellipse=(x,y,w,h,fill='#ffffff',stroke='#26384f',sw=2)=>({id:nextId(),type:'ellipse',x,y,w,h,fill,stroke,strokeWidth:sw});
const text=(x,y,w,h,value,size=26,fill='#26384f',align='middle')=>({id:nextId(),type:'text',x,y,w,h,text:value,fontSize:size,fill,align});
const line=(x,y,w,h,stroke='#64748b',sw=2)=>({id:nextId(),type:'line',x,y,w,h,fill:'none',stroke,strokeWidth:sw});
const star=(x,y,w,h,fill='#ffd778')=>({id:nextId(),type:'star',x,y,w,h,fill,stroke:'#d18b27',strokeWidth:2});
const triangle=(x,y,w,h,fill='#eaf4ff')=>({id:nextId(),type:'triangle',x,y,w,h,fill,stroke:'#457cb2',strokeWidth:2});
const imageShape=(x,y,w,h,src)=>({id:nextId(),type:'image',x,y,w,h,src,fill:'none',stroke:'none',strokeWidth:0});
function makeTemplate(which='vocabulary'){
 const objects=[];
 const add=(...items)=>objects.push(...items);
 const heading=(headingText,sub)=>{add(text(42,38,511,46,headingText,30),text(42,89,511,23,sub,13,'#73869a'));add(line(43,124,509,0,'#d9e4ef',2));};
 if(which==='vocabulary'){
  heading('낱말 그림카드','그림·단어를 바꿔 나만의 학습카드를 만들어요');
  for(let i=0;i<4;i++){const x=42+(i%2)*261,y=157+Math.floor(i/2)*304;
   add(rect(x,y,249,288,'#ffffff','#9cbad0',2,16),rect(x+15,y+15,219,185,['#f4f9ff','#fff8f1','#f4fbf5','#fff5f8'][i],'none',0,10));
   add(text(x+30,y+76,189,62,['그림을 넣어요','동물','식물','도구'][i],22,'#4f6d89'));
   add(text(x+17,y+218,215,45,['낱말 1','낱말 2','낱말 3','낱말 4'][i],26));
  }
 }else if(which==='emotion'){
  heading('내 마음을 표현해요','표정과 문구를 바꿔 감정 그림카드를 만들어요');
  for(let i=0;i<2;i++){const x=42+i*262,y=169;add(rect(x,y,249,460,'#ffffff','#d0dcea',2,18));
   add(ellipse(x+34,y+35,180,180,i?'#c9e9fa':'#ffe6a3','#455d72',3));
   add(ellipse(x+84,y+107,13,20,'#34485b','none',0),ellipse(x+151,y+107,13,20,'#34485b','none',0));
   add(line(x+105,y+(i?169:161),50,i?-15:18,'#34485b',5));
   add(text(x+20,y+251,209,53,i?'싫어요':'좋아요',31));
   add(text(x+15,y+322,219,72,i?'기분이 불편해요':'기분이 좋아요',20,'#536d81'));
  }
  add(text(60,679,475,42,'내 마음을 말로 표현해요',20));
 }else if(which==='schedule'){
  heading('하루 순서표','활동의 순서와 이름을 자유롭게 바꿔 보세요');
  for(let i=0;i<5;i++){const y=151+i*119;add(rect(43,y,509,105,i%2?'#f4f8fd':'#ffffff','#b8cee0',2,14));
   add(ellipse(58,y+18,68,68,['#d8eafd','#ffe9c3','#d5f3e9','#ffdde4','#ebddff'][i],'none',0));
   add(text(64,y+25,56,52,String(i+1),29));
   add(text(144,y+19,372,64,['등원','자유놀이','이야기 나누기','바깥놀이','귀가'][i],25,'#26384f','start'));
  }
 }else if(which==='name'){
  heading('이름표 만들기','인쇄한 뒤 오려서 사용하세요');
  for(let i=0;i<8;i++){const x=42+i%2*261,y=159+Math.floor(i/2)*151;
   add(rect(x,y,249,137,['#f2f8ff','#fff7ed','#f2faf6','#fff3f5'][i%4],'#aebdca',2,15));
   add(text(x+22,y+16,205,35,'우리 반',16,'#56718a'));
   add(text(x+20,y+50,209,62,'이름',31));
  }
 }else if(which==='geometry'){
  heading('도형 탐험 활동지','도형의 크기와 색깔을 바꿔 보세요');
  add(text(43,147,509,42,'같은 모양을 찾아 동그라미 해 보세요',20,'#33455b','start'));
  for(let i=0;i<3;i++){let x=61+i*176;add(rect(x,220,153,158,'#ffffff','#d8e1eb',2,10));
    if(i===0)add(ellipse(x+24,248,105,105,'#f9db76','#c89935',2));
    if(i===1)add(triangle(x+22,249,109,102,'#bce5ff'));
    if(i===2)add(star(x+22,244,109,109,'#ffd6e3'));
  }
  add(line(50,446,495,0,'#cbd5e1',2),text(50,475,495,43,'아래에 원하는 모양을 그려 보세요',19));
  for(let i=0;i<3;i++)add(rect(52+i*179,554,135,168,'#ffffff','#b9cadb',2,4));
 }else{
  heading('나만의 교실 도안','여기에 자유롭게 도형과 글씨를 넣어 보세요');
 }
 return {title:{vocabulary:'낱말 그림카드',emotion:'감정 카드',schedule:'하루 순서표',name:'이름표',geometry:'도형 탐험',blank:'빈 A4 도안'}[which]||'빈 A4 도안',size:'A4',objects};
}
function safeColor(value,fallback='#ffffff'){return typeof value==='string' && (/^#[0-9a-fA-F]{6}$/.test(value)||value==='none')?value:fallback;}
function safeImage(value){return typeof value==='string'&&/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value)&&value.length<=3000000?value:'';}
function num(v,min,max,fallback){return Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;}
function cleanObject(raw,index){
 if(!raw||typeof raw!=='object'||!types.includes(raw.type))throw Error('지원하지 않는 도형이 들어 있어요.');
 return {id:'object-'+index,type:raw.type,
  x:num(raw.x,-1000,1600,40),y:num(raw.y,-1000,1600,40),
  w:num(raw.w,1,1300,100),h:num(raw.h,-1000,1300,100),
  fill:safeColor(raw.fill,raw.type==='text'?'#26384f':'#ffffff'),
  stroke:safeColor(raw.stroke,'#a7bdd0'),
  strokeWidth:num(raw.strokeWidth,0,25,2),
  r:num(raw.r,0,100,10),
  fontSize:num(raw.fontSize,8,130,25),
  align:['start','middle','end'].includes(raw.align)?raw.align:'middle',
  text:String(raw.text??'').slice(0,400),
  src:raw.type==='image'?safeImage(raw.src):''
 };
}
function validateProject(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.objects)||raw.objects.length>MAX_OBJECTS)throw Error('올바른 도안 파일이 아니거나 요소가 너무 많아요.');
 const objects=raw.objects.map(cleanObject);
 if(objects.some(o=>o.type==='image'&&!o.src))throw Error('지원하지 않는 이미지 데이터가 들어 있어요.');
 if(objects.reduce((sum,o)=>sum+o.src.length,0)>20000000)throw Error('도안의 이미지 용량이 너무 커요.');
 return {title:String(raw.title||'교실 도안').slice(0,80),size:['A4','A5'].includes(raw.size)?raw.size:'A4',objects};
}
function xml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function points(o,count=5,inner=0.48){
 const cx=o.x+o.w/2,cy=o.y+o.h/2,rx=Math.abs(o.w)/2,ry=Math.abs(o.h)/2;
 return Array.from({length:count*2},(_,i)=>{const angle=-Math.PI/2+Math.PI*i/count,k=i%2?inner:1;return (cx+rx*k*Math.cos(angle)).toFixed(1)+','+(cy+ry*k*Math.sin(angle)).toFixed(1)}).join(' ');
}
function shape(o){
 const at=' fill="'+xml(safeColor(o.fill))+'" stroke="'+xml(safeColor(o.stroke,'#a7bdd0'))+'" stroke-width="'+num(o.strokeWidth,0,25,2)+'"';
 if(o.type==='image')return o.src?'<image x="'+o.x+'" y="'+o.y+'" width="'+o.w+'" height="'+o.h+'" preserveAspectRatio="xMidYMid meet" href="'+xml(safeImage(o.src))+'"/>':'';
 if(o.type==='rect')return '<rect x="'+o.x+'" y="'+o.y+'" width="'+o.w+'" height="'+o.h+'" rx="'+o.r+'"'+at+'/>';
 if(o.type==='ellipse')return '<ellipse cx="'+(o.x+o.w/2)+'" cy="'+(o.y+o.h/2)+'" rx="'+Math.abs(o.w/2)+'" ry="'+Math.abs(o.h/2)+'"'+at+'/>';
 if(o.type==='triangle')return '<polygon points="'+(o.x+o.w/2)+','+o.y+' '+(o.x+o.w)+','+(o.y+o.h)+' '+o.x+','+(o.y+o.h)+'"'+at+'/>';
 if(o.type==='star')return '<polygon points="'+points(o)+'"'+at+'/>';
 if(o.type==='line')return '<line x1="'+o.x+'" y1="'+o.y+'" x2="'+(o.x+o.w)+'" y2="'+(o.y+o.h)+'" stroke="'+xml(safeColor(o.stroke,'#26384f'))+'" stroke-width="'+num(o.strokeWidth,0,25,2)+'" stroke-linecap="round"/>';
 if(o.type==='text'){
 const x=o.align==='start'?o.x:o.align==='end'?o.x+o.w:o.x+o.w/2;
 const lines=String(o.text??'').split('\n').slice(0,8);
 const dy=num(o.fontSize,8,130,25)*1.15;
 return '<text x="'+x+'" y="'+(o.y+o.h/2-(lines.length-1)*dy/2)+'" fill="'+xml(safeColor(o.fill,'#26384f'))+'" font-size="'+o.fontSize+'" font-family="sans-serif" text-anchor="'+o.align+'" dominant-baseline="middle">'+lines.map((l,i)=>'<tspan x="'+x+'" dy="'+(i?dy:0)+'">'+xml(l)+'</tspan>').join('')+'</text>';
 }
 return '';
}
function drawObjects(project){return project.objects.map(o=>'<g data-shape="'+xml(o.id)+'">'+shape(o)+'</g>').join('');}
function svg(project){
 const p=validateProject(project),sz=sizes[p.size];
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+(p.size==='A4'?'210mm':'148mm')+'" height="'+(p.size==='A4'?'297mm':'210mm')+'" viewBox="0 0 '+sz.w+' '+sz.h+'"><rect width="'+sz.w+'" height="'+sz.h+'" fill="#ffffff"/>'+drawObjects(p)+'</svg>';
}
return {W,H,sizes,types,PALETTE,makeTemplate,validateProject,cleanObject,rect,ellipse,text,line,star,triangle,imageShape,safeImage,drawObjects,svg,xml,num};
});
