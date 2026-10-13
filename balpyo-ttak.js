(() => {
'use strict';
const C=window.BalpyoCore,$=id=>document.getElementById(id);
if(!C)throw Error('발표 자료 편집 모듈을 불러오지 못했어요.');
let deck=C.starter('lesson'),index=0,dirty=false,showing=false,creatingPptx=false,lastTemplate='lesson';
const MAX_IMAGE_BYTES=2*1024*1024;
function current(){return deck.slides[index];}
function say(message,error=false){$('message').textContent=message;$('message').className='message'+(error?' error':' success');}
function notifyChange(){dirty=true;drawStage();drawList();}
function node(tag,className,text){
 const x=document.createElement(tag);
 if(className)x.className=className;
 if(text!==undefined)x.textContent=text;
 return x;
}
function slideEl(s,i){
 const theme=C.THEMES[deck.theme]||C.THEMES.sky;
 const outer=node('div','slide');
 outer.dataset.layout=s.layout;
 outer.style.background=theme.background;
 outer.style.color=theme.foreground;
 outer.style.setProperty('--accent-theme',theme.accent);
 const edge=node('div','line'),pattern=node('div','pattern');
 outer.append(edge,pattern);
 const content=node('div','content');
 if(s.layout==='picture'){
  const photo=node('div','picture-box');
  if(s.image){const img=node('img');img.src=s.image;img.alt=s.title||'선택한 사진';photo.append(img);}
  else photo.append(node('span','', '사진을 선택해 넣어 보세요'));
  const info=node('div','picture-copy');
  info.append(node('span','label',s.eyebrow),node('h2','heading',s.title),node('p','description',s.body));
  content.append(photo,info);
 }else{
  content.append(node('span','label',s.eyebrow),node('h2','heading',s.title));
  if(s.layout==='content'){
   const ul=node('ul','bullet-lines');
   for(const text of C.lines(s.body).slice(0,8))ul.append(node('li','',text));
   content.append(ul);
  }else content.append(node('p','description',s.body));
 }
 outer.append(content,node('span','page-number',String(i+1)));
 return outer;
}
function drawStage(){const root=$('slideStage');root.replaceChildren(slideEl(current(),index));$('currentCounter').textContent=(index+1)+' / '+deck.slides.length+' 슬라이드';$('previous').disabled=index===0;$('next').disabled=index===deck.slides.length-1;}
function drawList(){
 const list=$('slidesList');list.replaceChildren();
 deck.slides.forEach((s,i)=>{
  const li=node('div','thumb'+(index===i?' selected':''));
  li.setAttribute('role','group');li.setAttribute('aria-label',(i+1)+'번째 슬라이드');
  const main=node('div','thumb-main');
  const select=node('button','', (i+1)+'. '+C.slideSummary(s));
  select.type='button';select.className='thumb-title';
  select.title=C.slideSummary(s);select.setAttribute('aria-current',index===i?'true':'false');
  select.addEventListener('click',()=>selectSlide(i));
  main.append(select);
  const row=node('div','thumb-actions');
  const prev=node('button','', '↑');prev.type='button';prev.title='앞으로 옮기기';
  prev.disabled=i===0;prev.addEventListener('click',()=>moveSlide(i,-1));
  const next=node('button','', '↓');next.type='button';next.title='뒤로 옮기기';
  next.disabled=i===deck.slides.length-1;next.addEventListener('click',()=>moveSlide(i,1));
  row.append(prev,next);
  li.append(main,row);list.append(li);
 });
}
function setFields(){
 const s=current();
 $('deckTitle').value=deck.title;
 $('layout').value=s.layout;
 $('eyebrow').value=s.eyebrow;
 $('slideTitle').value=s.title;
 $('slideBody').value=s.body;
 $('slideNotes').value=s.notes;
 $('theme').value=deck.theme;
 $('removeImage').disabled=!s.image;
 $('deleteSlide').disabled=deck.slides.length===1;
}
function render(){setFields();drawStage();drawList();}
function selectSlide(i){
 if(i<0||i>=deck.slides.length)return;
 index=i;render();
}
function moveSlide(i,delta){
 const j=i+delta;if(j<0||j>=deck.slides.length)return;
 [deck.slides[i],deck.slides[j]]=[deck.slides[j],deck.slides[i]];
 if(index===i)index=j;else if(index===j)index=i;
 dirty=true;render();
}
for(const [field,key] of [['eyebrow','eyebrow'],['slideTitle','title'],['slideBody','body'],['slideNotes','notes']]){
 $(field).addEventListener('input',()=>{
  current()[key]=$(field).value.slice(0,{eyebrow:100,title:170,body:1400,notes:2000}[key]);
  notifyChange();
 });
}
$('deckTitle').addEventListener('input',()=>{deck.title=$('deckTitle').value.slice(0,90)||'나만의 발표';dirty=true;});
$('layout').addEventListener('change',()=>{current().layout=$('layout').value;notifyChange();});
$('theme').addEventListener('change',()=>{deck.theme=$('theme').value;notifyChange();});
$('addSlide').addEventListener('click',()=>{
 if(deck.slides.length>=C.MAX_SLIDES)return say('슬라이드는 최대 40장까지 만들 수 있어요.',true);
 deck.slides.splice(index+1,0,C.slide('content','새 슬라이드','여기에 내용을 적어 보세요.',''));
 index++;dirty=true;render();say('새 슬라이드를 추가했어요.');
});
$('duplicateSlide').addEventListener('click',()=>{
 if(deck.slides.length>=C.MAX_SLIDES)return say('슬라이드는 최대 40장까지 만들 수 있어요.',true);
 const cloned={...current(),id:'copy-'+Date.now()+'-'+index};
 deck.slides.splice(index+1,0,cloned);index++;dirty=true;render();say('현재 슬라이드를 복제했어요.');
});
$('deleteSlide').addEventListener('click',()=>{
 if(deck.slides.length<=1)return;
 if(!confirm('현재 슬라이드를 삭제할까요?'))return;
 deck.slides.splice(index,1);index=Math.min(index,deck.slides.length-1);dirty=true;render();say('슬라이드를 삭제했어요.');
});
$('previous').addEventListener('click',()=>selectSlide(index-1));
$('next').addEventListener('click',()=>selectSlide(index+1));
document.querySelectorAll('[data-starter]').forEach(button=>button.addEventListener('click',()=>{
 const kind=button.dataset.starter;
 if(dirty&&!confirm('현재 발표가 바뀌어요. 저장하지 않은 내용을 버리고 시작할까요?'))return;
 deck=C.starter(kind);index=0;dirty=false;lastTemplate=kind;
 document.querySelectorAll('[data-starter]').forEach(b=>b.classList.toggle('selected',b===button));
 render();say('새 발표 템플릿을 준비했어요.');
}));
function download(content,filename,mime){
 const blob=content instanceof Blob?content:new Blob([content],{type:mime});
 const url=URL.createObjectURL(blob),a=node('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),25000);
}
$('saveProject').addEventListener('click',()=>{
 download(JSON.stringify(deck,null,2),C.filename(deck.title,'json'),'application/json;charset=utf-8');
 dirty=false;say('다시 편집할 수 있는 발표 원본을 내려받았어요.');
});
$('loadProject').addEventListener('change',async event=>{
 const file=event.target.files?.[0];event.target.value='';
 if(!file)return;
 if(file.size>C.MAX_JSON_BYTES)return say('너무 큰 발표 파일이에요. 5MB 이하를 선택해 주세요.',true);
 if(dirty&&!confirm('현재 발표를 불러온 자료로 교체할까요?'))return;
 try{
  const data=JSON.parse(await file.text());
  deck=C.validateDeck(data);index=0;dirty=false;lastTemplate='';
  document.querySelectorAll('[data-starter]').forEach(b=>b.classList.remove('selected'));
  render();say('저장한 발표 자료를 불러왔어요.');
 }catch(err){say('발표 자료를 열지 못했어요: '+String(err.message||err),true);}
});
async function insertSlideImage(file){
 if(!file||!['image/jpeg','image/png'].includes(file.type)||file.size>MAX_IMAGE_BYTES||file.size<=0)
  throw Error('PNG·JPG 사진 중 2MB 이하를 선택해 주세요.');
 const uri=await new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(Error('이미지 파일을 읽지 못했어요.'));
  reader.readAsDataURL(file);
 });
 if(!C.imageSafe(uri))throw Error('지원되지 않는 그림 파일이에요.');
 const others=deck.slides.reduce((n,s,i)=>n+(i===index?0:s.image.length),0);
 if(others+uri.length>40_000_000)throw Error('발표 자료 사진의 전체 용량이 너무 커요.');
 current().image=uri;current().layout='picture';
 dirty=true;render();say('사진을 넣었어요. 슬라이드 종류를 그림·사진으로 변경했어요.');
}
$('slideImage').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{await insertSlideImage(file)}catch(err){say(err.message||'사진을 넣지 못했어요.',true)}
});
$('removeImage').addEventListener('click',()=>{current().image='';dirty=true;render();say('현재 슬라이드 사진을 지웠어요.');});
function show(indexValue){
 index=indexValue;showing=true;$('presentation').hidden=false;
 document.body.style.overflow='hidden';
 renderPresentation();
 $('presentation').focus();
}
function renderPresentation(){
 $('presentationSlide').replaceChildren(slideEl(current(),index));
 $('presentCounter').textContent=(index+1)+' / '+deck.slides.length;
 $('presentPrev').disabled=index===0;
 $('presentNext').disabled=index===deck.slides.length-1;
}
function closePresentation(){
 showing=false;$('presentation').hidden=true;document.body.style.overflow='';
 render();$('present').focus();
}
$('present').addEventListener('click',()=>show(index));
$('presentPrev').addEventListener('click',()=>{if(index>0){index--;renderPresentation();}});
$('presentNext').addEventListener('click',()=>{if(index<deck.slides.length-1){index++;renderPresentation();}});
$('presentClose').addEventListener('click',closePresentation);
document.addEventListener('keydown',e=>{
 if(!showing)return;
 if(e.key==='Escape'){e.preventDefault();closePresentation();return;}
 if(['ArrowRight','PageDown',' ','Enter'].includes(e.key)&&index<deck.slides.length-1){e.preventDefault();index++;renderPresentation();}
 if(['ArrowLeft','PageUp','Backspace'].includes(e.key)&&index>0){e.preventDefault();index--;renderPresentation();}
});
let touchStart=null;
$('presentation').addEventListener('touchstart',e=>{touchStart=e.touches[0]?.clientX??null;},{passive:true});
$('presentation').addEventListener('touchend',e=>{
 if(touchStart===null)return;
 const delta=(e.changedTouches[0]?.clientX??touchStart)-touchStart;touchStart=null;
 if(Math.abs(delta)<65)return;
 if(delta<0&&index<deck.slides.length-1){index++;renderPresentation();}
 if(delta>0&&index>0){index--;renderPresentation();}
},{passive:true});
function renderPrintDeck(){
 const root=$('printSlides');root.replaceChildren();
 deck.slides.forEach((s,i)=>{const page=node('section','print-page');page.append(slideEl(s,i));root.append(page);});
}
$('printDeck').addEventListener('click',()=>{renderPrintDeck();say('인쇄 창에서 PDF로 저장하거나 발표 자료를 출력해 주세요.');window.print();});
window.addEventListener('afterprint',()=>{$('printSlides').replaceChildren();});
function colorHex(s){return s.replace(/^#/,'').toUpperCase();}
function addTextSafe(slide,text,x,y,w,h,fontSize,color,opt={}){
 if(!text)return;
 slide.addText(String(text),{x,y,w,h,margin:0,breakLine:false,fontFace:'Malgun Gothic',fontSize,color:colorHex(color),bold:!!opt.bold,
  valign:opt.valign||'mid',align:opt.align||'left',breakLine:false,fit:'shrink',lineSpacingMultiple:1.1});
}
function addPptxSlide(pptx,s,i){
 const T=C.THEMES[deck.theme]||C.THEMES.sky;
 const page=pptx.addSlide();
 page.background={color:colorHex(T.background)};
 // Design: top ribbon, small eyebrow, high contrast, numbered footer.
 page.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.16,fill:{color:colorHex(T.accent)},line:{color:colorHex(T.accent),transparency:100}});
 const picture=s.layout==='picture';
 if(s.layout==='question')page.addShape(pptx.ShapeType.roundRect,{x:.8,y:.95,w:3.0,h:.48,rectRadius:.18,
  fill:{color:colorHex(T.accent)},line:{color:colorHex(T.accent)}});
 addTextSafe(page,s.eyebrow,.85,picture?.6:.75,picture?4.8:11,picture?.55:.6,16,
  s.layout==='question'?'#FFFFFF':T.accent,{bold:true});
 const titleY=(s.layout==='title'||s.layout==='closing')?2.45:1.7;
 if(picture){
  if(s.image){try{page.addImage({data:s.image,x:.78,y:1.55,w:5.2,h:4.6});}catch(e){}}
  else page.addShape(pptx.ShapeType.rect,{x:.78,y:1.55,w:5.2,h:4.6,fill:{color:'EBF0F6'},line:{color:'B2C8DE',dash:'dash'}});
  addTextSafe(page,s.title,6.45,1.9,6.1,2.05,32,T.foreground,{bold:true});
  addTextSafe(page,s.body,6.45,4.05,6.0,2.35,21,T.foreground);
 }else{
  addTextSafe(page,s.title,.85,titleY,11.65,s.layout==='title'?1.8:1.45,
   (s.layout==='title'||s.layout==='closing')?42:36,T.foreground,{bold:true});
  if(s.layout==='content'){
   const lines=C.lines(s.body).slice(0,8);
   const body=lines.map(x=>'•  '+x).join('\n');
   addTextSafe(page,body,1.1,3.35,11.4,3.6,23,T.foreground);
  }else addTextSafe(page,s.body,.87,(s.layout==='title'||s.layout==='closing')?4.4:3.53,11.4,2.1,23,T.foreground);
 }
 addTextSafe(page,String(i+1),12.55,6.95,.45,.2,10,T.muted,{align:'right'});
}
$('exportPptx').addEventListener('click',async()=>{
 if(creatingPptx)return;
 const Pptx=window.pptxgen||window.PptxGenJS;
 if(typeof Pptx!=='function')return say('파워포인트 저장 도구가 아직 설치되지 않았어요. 잠시 후 다시 시도해 주세요.',true);
 creatingPptx=true;$('exportPptx').disabled=true;$('exportPptx').textContent='PPTX 만드는 중…';
 try{
  const pptx=new Pptx();pptx.layout='LAYOUT_WIDE';
  pptx.author='뚝딱교실';pptx.subject='교사용 수업 발표 자료';
  pptx.title=deck.title;pptx.lang='ko-KR';
  pptx.theme={headFontFace:'Malgun Gothic',bodyFontFace:'Malgun Gothic',lang:'ko-KR'};
  deck.slides.forEach((s,i)=>addPptxSlide(pptx,s,i));
  await pptx.writeFile({fileName:C.filename(deck.title,'pptx')});
  say('PPTX 발표 자료를 저장했어요. 파워포인트에서 열어 수정할 수 있어요.');
 }catch(err){say('PPTX 저장에 실패했어요: '+String(err?.message||err),true);}
 finally{creatingPptx=false;$('exportPptx').disabled=false;$('exportPptx').textContent='PPTX 저장';}
});
$('openAdvanced').addEventListener('click',async()=>{
 const area=$('advancedArea'),btn=$('openAdvanced'),status=$('advancedStatus');
 if(!area.hidden){area.hidden=true;$('advancedFrame').removeAttribute('src');btn.textContent='고급 편집기 열기';return;}
 area.hidden=false;btn.disabled=true;status.textContent='DeckCraft 설치 파일을 확인하고 있어요.';
 try{
  const res=await fetch('assets/artcraft/deckcraft/gulliver-install.json',{cache:'no-store'});
  if(!res.ok)throw Error('고급 편집기를 아직 배포하지 않았어요.');
  const manifest=await res.json();
  if(manifest.source!=='storytold/deckcraft'||manifest.version!=='0.6.1')throw Error('지원하지 않는 DeckCraft 버전이에요.');
  $('advancedFrame').src='assets/artcraft/deckcraft/index.html?blank';
  status.textContent='DeckCraft를 불러오는 중이에요. 모바일에서는 실행이 느릴 수 있어요.';
  btn.textContent='고급 편집기 닫기';
 }catch(err){status.textContent=err.message||'고급 편집기를 실행하지 못했어요.';status.className='message error';}
 finally{btn.disabled=false;}
});
// Build a portable, self-contained image for sharing a single slide.
// The graphic preserves title/text/photo but is not a pixel-identical PPTX screenshot.
function writeLines(ctx,value,x,y,maxWidth,lineHeight,maxLines){
 const lines=String(value||'').split(/\n/);let list=[];
 for(const source of lines){
  let buffer='';
  for(const ch of source){
   const test=buffer+ch;
   if(buffer&&ctx.measureText(test).width>maxWidth){list.push(buffer);buffer=ch;}
   else buffer=test;
   if(list.length>=maxLines)break;
  }
  if(buffer&&list.length<maxLines)list.push(buffer);
  if(list.length>=maxLines)break;
 }
 for(const [i,line] of list.entries())ctx.fillText(line,x,y+i*lineHeight);
}
async function exportSlideImage(slideIndex=index){
 const slide=deck.slides[slideIndex],theme=C.THEMES[deck.theme]||C.THEMES.sky;
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('이미지 편집 기능을 사용할 수 없어요.');
 ctx.fillStyle=theme.background;ctx.fillRect(0,0,960,540);
 ctx.fillStyle=theme.accent;ctx.fillRect(0,0,960,12);
 ctx.font='700 22px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
 ctx.fillStyle=theme.accent;
 const photo=slide.layout==='picture';
 if(slide.eyebrow)writeLines(ctx,slide.eyebrow,photo?515:60,photo?94:90,photo?385:840,30,2);
 if(photo){
  ctx.fillStyle='#e9eff7';ctx.fillRect(42,100,430,360);
  if(slide.image){
   const picture=new Image();picture.src=slide.image;
   await new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(Error('슬라이드의 사진을 불러오지 못했어요.'));});
   const ratio=Math.min(430/picture.naturalWidth,360/picture.naturalHeight);
   const w=picture.naturalWidth*ratio,h=picture.naturalHeight*ratio;
   ctx.drawImage(picture,42+(430-w)/2,100+(360-h)/2,w,h);
  }
 }
 ctx.fillStyle=theme.foreground;
 ctx.font='800 42px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
 writeLines(ctx,slide.title,photo?515:60,photo?185:205,photo?385:840,54,3);
 ctx.font='25px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
 writeLines(ctx,slide.body,photo?515:68,photo?325:322,photo?375:805,38,4);
 ctx.fillStyle=theme.muted;ctx.font='18px sans-serif';ctx.fillText(String(slideIndex+1),906,509);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob)throw Error('슬라이드 이미지를 만들 수 없어요.');
 return blob;
}
async function exportSlides(){
  if(deck.slides.length>5)throw Error('간편 영상은 장면 5개까지 지원해요. 발표 슬라이드를 5장 이하로 정리한 뒤 다시 보내 주세요.');
  const images=[];
  for(let i=0;i<deck.slides.length;i++)images.push({name:(i+1)+'번째 슬라이드.png',blob:await exportSlideImage(i)});
  return images;
 }
 window.GulliverStudioAdapter={kind:'slides',insertImage:insertSlideImage,exportImage:exportSlideImage,exportSlides,capture:()=>JSON.parse(JSON.stringify(deck)),apply:raw=>{
 deck=C.validateDeck(raw);index=0;dirty=false;render();
},rename:value=>{deck.title=String(value).slice(0,90);dirty=true;render();}};
window.addEventListener('beforeunload',e=>{if(dirty&&!new URLSearchParams(location.search).has('studio')){e.preventDefault();e.returnValue='';}});
render();
if(!(window.pptxgen||window.PptxGenJS)){
 $('exportPptx').disabled=true;$('exportPptx').title='PptxGenJS 웹 실행 파일이 필요해요.';
 say('화면은 사용할 수 있지만 PPTX 저장 라이브러리가 배포되기 전이에요.',true);
}
})();
