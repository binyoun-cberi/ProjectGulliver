(() => {
'use strict';
const C=window.MunseoCore,$=id=>document.getElementById(id);
if(!C)throw Error('문서 편집 도구를 불러오지 못했어요.');
let doc=C.template('notice'),active=null,undo=[],redo=[],dirty=false,processing=false;
function announce(s,error=false){$('status').textContent=s;$('status').className='status '+(error?'error':'success');}
function snapshot(){return JSON.stringify(doc);}
function pushHistory(before){
 if(before!==snapshot()){undo.push(before);if(undo.length>35)undo.shift();redo=[];dirty=true;}
 updateButtons();
}
function updateButtons(){
 $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;
 const i=doc.blocks.findIndex(b=>b.id===active);
 $('moveUp').disabled=i<=0;
 $('moveDown').disabled=i<0||i>=doc.blocks.length-1;
 $('removeBlock').disabled=i<0||doc.blocks.length<=1;
 $('selectionDescription').textContent=i<0?'문서 안의 요소를 선택해 주세요.':(['heading','paragraph','list','table','image','rule'].map((k,j)=>[k,['소제목','본문','목록','표','사진','구분선'][j]]).find(x=>x[0]===doc.blocks[i].type)?.[1]||'문서 요소')+' 선택됨';
}
function el(tag,className,text){
 const e=document.createElement(tag);if(className)e.className=className;
 if(text!==undefined)e.textContent=String(text);return e;
}
function findActive(){return doc.blocks.find(b=>b.id===active);}
function select(id){
 active=id;
 document.querySelectorAll('#blocks .block').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));
 updateButtons();
}
function onEdit(target,getter,put){
 let before='';
 target.addEventListener('focus',()=>{before=snapshot();select(getter().id);});
 target.addEventListener('input',()=>put(target.textContent||''));
 target.addEventListener('blur',()=>{
  put(target.textContent||'');pushHistory(before||snapshot());render();
 });
}
function editable(text,label){
 const d=el('div','editable',text);
 d.contentEditable='true';d.spellcheck=true;d.setAttribute('role','textbox');
 d.setAttribute('aria-label',label);
 d.setAttribute('aria-multiline','true');
 return d;
}
function renderBlock(b){
 const root=el('section','block '+b.type);
 root.dataset.id=b.id;
 root.addEventListener('pointerdown',()=>select(b.id));
 if(['heading','paragraph','list'].includes(b.type)){
  const box=editable(b.text,b.type==='heading'?'소제목 편집':b.type==='list'?'목록 편집':'본문 편집');
  onEdit(box,()=>b,value=>{b.text=value.slice(0,4000);dirty=true;});
  root.append(box);
 }else if(b.type==='table'){
  const t=el('table'),tbody=el('tbody');
  b.rows.forEach((row,i)=>{
   const tr=el('tr');
   row.forEach((value,j)=>{
    const td=el('td'),cell=editable(value,(i+1)+'행 '+(j+1)+'열');
    onEdit(cell,()=>b,text=>{b.rows[i][j]=text.slice(0,500);dirty=true;});
    td.append(cell);tr.append(td);
   });
   tbody.append(tr);
  });
  t.append(tbody);root.append(t);
 }else if(b.type==='image'){
  if(b.src){const img=el('img');img.src=b.src;img.alt=b.caption||'첨부한 사진';root.append(img);}
  const caption=editable(b.caption||'사진 설명', '사진 설명 편집');
  caption.classList.add('caption');
  onEdit(caption,()=>b,value=>{b.caption=value.slice(0,180);dirty=true;});
  root.append(caption);
 }else if(b.type==='rule'){
  root.append(el('hr'));
 }
 return root;
}
function render(){
 const theme=C.THEMES[doc.theme]||C.THEMES.blue;
 $('paper').style.setProperty('--document-accent',theme.accent);
 $('paperTitle').textContent=doc.title;
 $('paperSubtitle').textContent=doc.subtitle;
 $('titleInput').value=doc.title;
 $('subtitleInput').value=doc.subtitle;
 $('themeInput').value=doc.theme;
 const parent=$('blocks');parent.replaceChildren();
 for(const b of doc.blocks)parent.append(renderBlock(b));
 select(active);
}
function add(type,options={}){
 if(doc.blocks.length>=C.MAX_BLOCKS)return announce('한 문서에는 요소를 90개까지 사용할 수 있어요.',true);
 const before=snapshot();
 let b;
 if(type==='table')b=C.block('table','',{rows:[['항목','내용'],['',''],['','']]});
 else if(type==='image')b=C.block('image','',options);
 else b=C.block(type,{heading:'새 소제목',paragraph:'본문을 입력하세요.',list:'첫 번째 항목\n두 번째 항목',rule:''}[type]||'');
 const idx=doc.blocks.findIndex(x=>x.id===active);
 doc.blocks.splice(idx>=0?idx+1:doc.blocks.length,0,b);
 active=b.id;pushHistory(before);render();
 const root=document.querySelector('#blocks [data-id="'+b.id+'"]');
 root?.scrollIntoView({behavior:'smooth',block:'center'});
 root?.querySelector('[contenteditable]')?.focus();
 announce('문서 요소를 추가했어요.');
}
for(const [btn,type] of [['addHeading','heading'],['addParagraph','paragraph'],['addList','list'],['addTable','table'],['addRule','rule']]){
 $(btn).addEventListener('click',()=>add(type));
}
for(const [input,key,max] of [['titleInput','title',120],['subtitleInput','subtitle',200]]){
 let before='';
 $(input).addEventListener('focus',()=>{before=snapshot();});
 $(input).addEventListener('input',()=>{doc[key]=$(input).value.slice(0,max);$(key==='title'?'paperTitle':'paperSubtitle').textContent=doc[key];dirty=true;});
 $(input).addEventListener('change',()=>pushHistory(before));
}
$('themeInput').addEventListener('change',()=>{
 const before=snapshot();doc.theme=$('themeInput').value;pushHistory(before);render();
});
function reorder(diff){
 const i=doc.blocks.findIndex(x=>x.id===active),j=i+diff;
 if(i<0||j<0||j>=doc.blocks.length)return;
 const before=snapshot();[doc.blocks[i],doc.blocks[j]]=[doc.blocks[j],doc.blocks[i]];
 pushHistory(before);render();
}
$('moveUp').addEventListener('click',()=>reorder(-1));
$('moveDown').addEventListener('click',()=>reorder(1));
$('removeBlock').addEventListener('click',()=>{
 const i=doc.blocks.findIndex(x=>x.id===active);
 if(i<0||doc.blocks.length<=1)return;
 const before=snapshot();doc.blocks.splice(i,1);active=doc.blocks[Math.min(i,doc.blocks.length-1)]?.id||null;
 pushHistory(before);render();announce('선택한 요소를 삭제했어요.');
});
function stepHistory(direction){
 const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;
 if(!from.length)return;
 to.push(snapshot());
 doc=C.validate(JSON.parse(from.pop()));active=null;dirty=true;render();
 announce(direction==='undo'?'이전 상태로 돌아갔어요.':'다시 실행했어요.');
}
$('undo').addEventListener('click',()=>stepHistory('undo'));
$('redo').addEventListener('click',()=>stepHistory('redo'));
document.querySelectorAll('[data-template]').forEach(button=>button.addEventListener('click',()=>{
 if(dirty&&!confirm('현재 문서가 바뀝니다. 저장하지 않은 작업을 버리고 새로 시작할까요?'))return;
 const id=button.dataset.template;
 doc=C.template(id);active=null;undo=[];redo=[];dirty=false;
 document.querySelectorAll('[data-template]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 render();announce('새 문서 틀을 준비했어요. 내용을 눌러 바꿔 보세요.');
}));
function download(content,filename,mime){
 const b=content instanceof Blob?content:new Blob([content],{type:mime});
 const url=URL.createObjectURL(b),a=el('a');a.href=url;a.download=filename;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);
}
$('saveProject').addEventListener('click',()=>{
 download(JSON.stringify(doc,null,2),C.filename(doc.title,'json'),'application/json;charset=utf-8');
 dirty=false;announce('편집 가능한 문서 원본을 저장했어요.');
});
$('loadProject').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>C.MAX_JSON_BYTES)return announce('문서 원본 파일은 25MB 이하여야 해요.',true);
 if(dirty&&!confirm('현재 문서를 불러온 자료로 바꿀까요?'))return;
 try{
  const data=C.validate(JSON.parse(await file.text()));
  doc=data;active=null;undo=[];redo=[];dirty=false;
  document.querySelectorAll('[data-template]').forEach(b=>b.setAttribute('aria-pressed','false'));
  render();announce('저장한 문서를 불러왔어요.');
 }catch(err){announce('문서를 불러오지 못했어요: '+String(err.message||err),true);}
});
function imageToData(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(Error('이미지를 읽지 못했어요.'));
  reader.readAsDataURL(file);
 });
}
$('addImage').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';
 if(!file)return;
 if(!['image/png','image/jpeg'].includes(file.type)||file.size>2_000_000)return announce('2MB 이하 JPG 또는 PNG 사진을 선택해 주세요.',true);
 try{
  const data=await imageToData(file);
  if(!C.safeImage(data))throw Error('지원하지 않는 이미지 형식이에요.');
  const total=doc.blocks.reduce((n,b)=>n+(b.src||'').length,0);
  if(total+data.length>20_000_000)throw Error('첨부한 사진의 전체 용량이 너무 커요.');
  add('image',{src:data,caption:'사진 설명'});
 }catch(err){announce(String(err.message||err),true);}
});
function cleanPaste(e){
 const target=e.target.closest('[contenteditable]');
 if(!target)return;
 e.preventDefault();
 const text=e.clipboardData?.getData('text/plain')||'';
 const selection=window.getSelection();
 if(!selection?.rangeCount)return;
 const range=selection.getRangeAt(0);
 if(!target.contains(range.commonAncestorContainer))return;
 range.deleteContents();
 const node=document.createTextNode(text.slice(0,5000));
 range.insertNode(node);
 range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
 target.dispatchEvent(new Event('input',{bubbles:true}));
}
$('blocks').addEventListener('paste',cleanPaste);
$('savePdf').addEventListener('click',()=>{announce('인쇄 창에서 PDF로 저장을 선택해 주세요.');window.print();});
function docxAvailable(){return window.docx&&typeof window.docx.Document==='function'&&window.docx.Packer;}
function docxTextParagraphs(d,txt,opts){
 return C.paragraphLines(txt).map(line=>new d.Paragraph({...opts,children:[new d.TextRun({text:line,font:'Malgun Gothic',size:22})]}));
}
function docxTable(d,b){
 const rowCount=Math.max(1,b.rows.length);
 const rows=b.rows.slice(0,25).map((items,row)=>new d.TableRow({children:items.map(cell=>new d.TableCell({
  children:[new d.Paragraph({children:[new d.TextRun({text:String(cell),font:'Malgun Gothic',size:20,bold:row===0})]})],
  shading:row===0?{fill:'E8F0F7'}:undefined,
  margins:{top:90,bottom:90,left:100,right:100}
 }))}));
 return new d.Table({rows,width:{size:100,type:d.WidthType.PERCENTAGE}});
}
function docxImage(d,b){
 if(!b.src)return [];
 try{
  const match=/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(b.src);
  if(!match)return [];
  const binary=atob(match[2]),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return [
   new d.Paragraph({children:[new d.ImageRun({data:bytes,type:match[1],transformation:{width:370,height:250},altText:{title:b.caption||'문서 이미지',description:b.caption||'문서 이미지',name:'이미지'}})],alignment:d.AlignmentType.CENTER,spacing:{after:100}}),
   new d.Paragraph({text:b.caption||'',alignment:d.AlignmentType.CENTER,spacing:{after:150}})
  ];
 }catch(e){return [new d.Paragraph({text:'[그림을 문서에 넣지 못했습니다]'})];}
}
function toDocx(){
 const d=window.docx;
 const accent=(C.THEMES[doc.theme]||C.THEMES.blue).accent.replace('#','');
 const children=[
  new d.Paragraph({children:[new d.TextRun({text:doc.title,font:'Malgun Gothic',bold:true,color:accent,size:42})],spacing:{after:110},alignment:d.AlignmentType.CENTER}),
  new d.Paragraph({children:[new d.TextRun({text:doc.subtitle,font:'Malgun Gothic',size:22,color:'5F6E7D'})],spacing:{after:300},alignment:d.AlignmentType.CENTER})
 ];
 for(const b of doc.blocks){
  if(b.type==='heading')children.push(new d.Paragraph({children:[new d.TextRun({text:b.text,font:'Malgun Gothic',size:29,color:accent,bold:true})],spacing:{before:230,after:120},keepNext:true}));
  else if(b.type==='paragraph')children.push(...docxTextParagraphs(d,b.text,{spacing:{after:115,line:330}}));
  else if(b.type==='list'){
   for(const line of C.paragraphLines(b.text)){
    if(!line.trim())continue;
    children.push(new d.Paragraph({children:[new d.TextRun({text:'•  '+line,font:'Malgun Gothic',size:22})],indent:{left:320},spacing:{after:75}}));
   }
  }else if(b.type==='table')children.push(docxTable(d,b));
  else if(b.type==='image')children.push(...docxImage(d,b));
  else if(b.type==='rule')children.push(new d.Paragraph({text:'─────────────────────────────────',spacing:{before:100,after:100}}));
 }
 return new d.Document({
  creator:'뚝딱교실',
  title:doc.title,
  styles:{default:{document:{run:{font:'Malgun Gothic',size:22}}}},
  sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children}]
 });
}
$('saveHwpx').addEventListener('click',async()=>{
 if(processing)return;
 processing=true;
 const button=$('saveHwpx');button.disabled=true;button.textContent='HWPX 만드는 중…';
 try{
  // Imported only on demand; nothing leaves the browser.
  const {makeHwpx}=await import('./munseo-hwpx.js');
  const bytes=await makeHwpx(doc);
  download(new Blob([bytes],{type:'application/octet-stream'}),C.filename(doc.title,'hwpx'),'application/octet-stream');
  announce('HWPX를 저장했어요. 한글 프로그램에서 열어 서식과 사진을 확인해 주세요.');
 }catch(err){
  announce('HWPX 저장에 실패했어요: '+String(err?.message||err),true);
 }finally{
  processing=false;button.disabled=false;button.textContent='HWPX 저장';
 }
});
$('saveDocx').addEventListener('click',async()=>{
 if(processing)return;
 if(!docxAvailable())return announce('DOCX 저장 도구가 아직 배포되지 않았어요. 잠시 후 다시 시도해 주세요.',true);
 processing=true;$('saveDocx').disabled=true;$('saveDocx').textContent='DOCX 만드는 중…';
 try{
  const blob=await window.docx.Packer.toBlob(toDocx());
  download(blob,C.filename(doc.title,'docx'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  announce('DOCX 파일을 저장했어요. Word·한글에서 열어 서식을 확인해 주세요.');
 }catch(err){announce('DOCX 저장에 실패했어요: '+String(err.message||err),true);}
 finally{processing=false;$('saveDocx').disabled=false;$('saveDocx').textContent='DOCX 저장';}
});
$('openAdvanced').addEventListener('click',async()=>{
 const area=$('advancedArea'),btn=$('openAdvanced'),status=$('advancedStatus');
 if(!area.hidden){area.hidden=true;$('advancedFrame').removeAttribute('src');btn.textContent='고급 편집기 열기';return;}
 area.hidden=false;btn.disabled=true;status.textContent='WordCraft 설치 파일을 확인 중이에요.';
 try{
  const response=await fetch('assets/artcraft/wordcraft/gulliver-install.json',{cache:'no-store'});
  if(!response.ok)throw Error('고급 편집기 파일이 아직 배포되지 않았어요.');
  const m=await response.json();
  if(m.source!=='storytold/wordcraft'||m.version!=='0.6.1')throw Error('지원하지 않는 WordCraft 버전이에요.');
  $('advancedFrame').src='assets/artcraft/wordcraft/index.html';
  status.textContent='WordCraft를 불러오는 중이에요. 처음 실행할 때 시간이 걸릴 수 있어요.';
  btn.textContent='고급 편집기 닫기';
 }catch(err){status.textContent=String(err.message||err);status.className='status error';}
 finally{btn.disabled=false;}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
render();
if(!docxAvailable()){announce('문서 편집은 사용할 수 있지만 DOCX 저장 라이브러리가 아직 배포되지 않았어요.',true);$('saveDocx').disabled=true;}
})();
