(()=>{
'use strict';
const C=window.GulliverUnifiedCore,$=id=>document.getElementById(id);
if(!C)throw Error('공통 캔버스 엔진을 불러오지 못했어요.');
const preset=new URLSearchParams(location.search).get('preset');
let model=C.starter(['blank','presentation','worksheet'].includes(preset)?preset:'presentation'),selected='',undoStack=[],redoStack=[],scale=1,drag=null,editing=false,timeline=null,videoController=null;
let mediaProvider=id=>window.GulliverStudioStorage.getMedia(id),pageChange=()=>{},playbackChange=()=>{};
const stage=$('stage'),textEditor=$('editText'),stackLimit=80;
const clone=obj=>JSON.parse(JSON.stringify(obj)),page=()=>model.pages[model.active],
  current=()=>page().elements.find(e=>e.id===selected)||null;
function notice(s,error=false){$('status').textContent=s;$('status').style.color=error?'#b91c1c':'#51647a'}
function emit(){document.dispatchEvent(new Event('input',{bubbles:true}))}
function checkpoint(previous){
 const before=JSON.stringify(previous),after=JSON.stringify(model);
 if(before===after)return false;
 undoStack.push(previous);if(undoStack.length>stackLimit)undoStack.shift();
 redoStack=[];emit();return true;
}
function edit(fn,selectId){
 timeline?.halt();closeEditor();
 const before=clone(model);
 const result=fn();
 if(selectId!==undefined)selected=selectId;
 checkpoint(before);timeline?.syncToActive();render();return result;
}
function undo(){
 timeline?.halt();closeEditor();
 if(!undoStack.length)return;
 redoStack.push(clone(model));model=undoStack.pop();selected='';
 timeline?.syncToActive();render();emit();notice('마지막 편집을 취소했어요.');
}
function redo(){
 timeline?.halt();closeEditor();
 if(!redoStack.length)return;
 undoStack.push(clone(model));model=redoStack.pop();selected='';
 timeline?.syncToActive();render();emit();notice('다시 실행했어요.');
}
function size(){
 const base=C.LAYOUTS[model.layout],width=Math.max(240,$('stageView').clientWidth-10);
 scale=Math.min(1,width/base.w,580/base.h);
 if(!Number.isFinite(scale)||scale<=0)scale=.5;
 $('stageSpace').style.width=Math.round(base.w*scale)+'px';
 $('stageSpace').style.height=Math.round(base.h*scale)+'px';
 stage.style.width=base.w+'px';stage.style.height=base.h+'px';
 stage.style.transform='scale('+scale+')';
}
function shapePoints(type){
 if(type==='triangle')return 'polygon(50% 0,100% 100%,0 100%)';
 if(type==='star')return 'polygon(50% 0,63% 35%,100% 38%,72% 62%,81% 100%,50% 80%,19% 100%,28% 62%,0 38%,37% 35%)';
 return '';
}
function drawItem(e){
 const node=document.createElement(e.type==='image'?'img':'div');
 node.className='item'+(e.id===selected?' selected':'');
 node.dataset.id=e.id;node.dataset.type=e.type;node.title=e.type==='text'?'두 번 눌러 글씨 수정':'끌어서 이동 · 모서리에서 크기 조절';
 Object.assign(node.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',opacity:e.opacity,
  color:e.fill,textAlign:e.align,fontSize:e.fontSize+'px',fontWeight:e.type==='text'?'650':'400'});
 if(e.type==='text'){node.textContent=e.content;node.style.justifyContent=e.align==='left'?'flex-start':e.align==='right'?'flex-end':'center'}
 else if(e.type==='image'){node.src=e.src;node.alt='업로드한 사진'}
 else if(e.type==='line'){
  node.style.height='3px';node.style.background=e.stroke;
  node.style.transform='rotate('+Math.atan2(e.h,e.w)+'rad)';node.style.transformOrigin='top left';
  node.style.width=Math.hypot(e.w,e.h)+'px';
 }else{
  node.style.background=e.fill;node.style.border=e.type==='ellipse'?'2px solid '+e.stroke:'2px solid '+e.stroke;
  if(e.type==='ellipse')node.style.borderRadius='50%';
  if(e.type==='triangle'||e.type==='star')node.style.clipPath=shapePoints(e.type);
 }
 if(e.id===selected){const grip=document.createElement('span');grip.className='grip';grip.setAttribute('aria-label','크기 조절');node.append(grip)}
 return node;
}
function renderPages(){
 const strip=$('pageStrip');strip.replaceChildren();
 for(const [i,p] of model.pages.entries()){
  const button=document.createElement('button');button.className='page'+(i===model.active?' active':'');
  const thumb=document.createElement('span');thumb.className='mini';thumb.style.background=p.background;
  thumb.textContent=p.elements.find(e=>e.type==='text')?.content?.slice(0,24)||'빈 페이지';
  const label=document.createElement('span');label.textContent=(i+1)+'. '+p.name.slice(0,20);
  button.append(thumb,label);button.type='button';button.title=(i+1)+'번째 페이지 열기';
  button.addEventListener('click',()=>{timeline?.halt();closeEditor();model.active=i;selected='';timeline?.syncToActive();render();emit()});
  strip.append(button);
 }
 const add=document.createElement('button');add.textContent='＋ 페이지 추가';add.type='button';add.addEventListener('click',addPage);strip.append(add);
}
function properties(){
 const e=current(),onlyText=!!e&&e.type==='text';
 document.querySelector('.properties').classList.toggle('has-selection',!!e);
 $('propertyHint').textContent=e?'선택한 '+({text:'글씨',rect:'네모',ellipse:'동그라미',triangle:'세모',star:'별',line:'선',image:'사진'}[e.type]||'요소')+'의 속성이에요.':'글씨·도형을 직접 클릭하면 속성이 나타나요.';
 const mapping={propertyText:e?.content||'',propertyFill:e?.fill||'#253650',propertyStroke:e?.stroke||'#334155',
  propertyFont:e?.fontSize??38,propertyOpacity:e?.opacity??1,propertyX:e?.x??0,
  propertyY:e?.y??0,propertyW:e?.w??100,propertyH:e?.h??70,propertyAlign:e?.align||'center',
  background:page().background};
 for(const [key,value] of Object.entries(mapping)){
  const control=$(key);if(document.activeElement!==control)control.value=value;
 }
 $('propertyText').disabled=!onlyText;
 $('propertyFont').disabled=!onlyText;$('propertyAlign').disabled=!onlyText;
 for(const key of ['propertyFill','propertyStroke','propertyOpacity','propertyX','propertyY','propertyW','propertyH'])$(key).disabled=!e;
 for(const key of ['delete','duplicate','bringForward','sendBack'])$(key).disabled=!e;
 $('undo').disabled=!undoStack.length;$('redo').disabled=!redoStack.length;
 $('layout').value=model.layout;
 $('designTitle').value=model.title;
}
function render(){
 size();stage.style.background=page().background;
 stage.querySelectorAll('.item').forEach(el=>el.remove());
 for(const e of page().elements)stage.append(drawItem(e));
 window.GulliverCanvasMedia?.placeVideo?.();
 renderPages();properties();timeline?.refresh();window.GulliverCanvasMedia?.refresh?.();
}
function placeNewText(e){
 const blockers=page().elements.filter(item=>item.type==='text');
 if(e.type!=='text'||!blockers.length)return e;
 const layout=C.LAYOUTS[model.layout],bottom=Math.max(32,Math.round(layout.h*.67)),right=Math.max(32,layout.w-e.w-40);
 const positions=[[e.x,e.y],[e.x,bottom],[right,e.y],[right,bottom],[32,32]];
 const overlap=([x,y])=>blockers.reduce((sum,item)=>sum+
  Math.max(0,Math.min(x+e.w,item.x+item.w)-Math.max(x,item.x))*
  Math.max(0,Math.min(y+e.h,item.y+item.h)-Math.max(y,item.y)),0);
 const [x,y]=positions.reduce((best,candidate)=>overlap(candidate)<overlap(best)?candidate:best);
 return{...e,x,y};
}
function addElement(type,partial){
 if(page().elements.length>=C.MAX_ITEMS){notice('페이지당 최대 150개 요소만 넣을 수 있어요.',true);return}
 const e=partial?C.element(type,partial):placeNewText(C.element(type));
 edit(()=>page().elements.push(e),e.id);notice('요소가 추가됐어요. 화면에서 이동하거나 크기를 바꾸세요.');
}
function addPage(){
 if(model.pages.length>=C.MAX_PAGES){notice('최대 40페이지까지 만들 수 있어요.',true);return}
 edit(()=>{model.pages.push(C.makePage('페이지 '+(model.pages.length+1)));model.active=model.pages.length-1},'');
}
function clonePage(){
 if(model.pages.length>=C.MAX_PAGES){notice('최대 40페이지까지 만들 수 있어요.',true);return}
 edit(()=>{const p=clone(page());p.id=C.id();p.name+=' 복사';p.elements=p.elements.map(e=>({...e,id:C.id()}));model.pages.splice(model.active+1,0,p);model.active++},'');
}
function removePage(){
 if(model.pages.length===1){notice('마지막 페이지는 삭제할 수 없어요.',true);return}
 if(!confirm('현재 페이지를 삭제할까요? 실행 취소로 되돌릴 수 있어요.'))return;
 edit(()=>{model.pages.splice(model.active,1);model.active=Math.min(model.active,model.pages.length-1)},'');
}
function deleteSelected(){
 if(!current())return;
 edit(()=>{page().elements=page().elements.filter(e=>e.id!==selected)},'');
}
function duplicateSelected(){
 const source=current();if(!source)return;
 if(page().elements.length>=C.MAX_ITEMS)return notice('요소를 더 추가할 수 없어요.',true);
 const copy={...clone(source),id:C.id(),x:source.x+18,y:source.y+18};
 edit(()=>page().elements.push(copy),copy.id);
}
function arrange(direction){
 const at=page().elements.findIndex(e=>e.id===selected);if(at<0)return;
 const target=at+direction;if(target<0||target>=page().elements.length)return;
 edit(()=>{const [e]=page().elements.splice(at,1);page().elements.splice(target,0,e)});
}
function startMove(event){
 timeline?.halt();
 if(event.button!==0&&event.pointerType==='mouse')return;
 if(editing)return;
 const target=event.target.closest('.item');
 if(!target){selected='';render();return}
 const e=page().elements.find(x=>x.id===target.dataset.id);if(!e)return;
 event.preventDefault();
 const before=clone(model),resizing=!!event.target.closest('.grip');
 selected=e.id;drag={id:e.id,before,resizing,x:event.clientX,y:event.clientY,original:{x:e.x,y:e.y,w:e.w,h:e.h},pointerId:event.pointerId};
 // Keep the SAME DOM node through both pointerdowns: replacing it prevents
 // the browser from delivering a dblclick for inline text editing.
 for(const item of stage.querySelectorAll('.item')){
  const active=item.dataset.id===selected;item.classList.toggle('selected',active);
  item.querySelector('.grip')?.remove();
  if(active){const grip=document.createElement('span');grip.className='grip';grip.setAttribute('aria-label','크기 조절');item.append(grip)}
 }
 properties();timeline?.refresh();
}
function moveDrag(event){
 if(!drag||event.pointerId!==drag.pointerId)return;
 const e=page().elements.find(x=>x.id===drag.id);if(!e)return;
 const dx=(event.clientX-drag.x)/scale,dy=(event.clientY-drag.y)/scale;
 const limit=C.LAYOUTS[model.layout];
 if(drag.resizing){e.w=Math.max(24,Math.min(limit.w+300,Math.round(drag.original.w+dx)));e.h=Math.max(20,Math.min(limit.h+300,Math.round(drag.original.h+dy)))}
 else{e.x=Math.max(-100,Math.min(limit.w-15,Math.round(drag.original.x+dx)));e.y=Math.max(-100,Math.min(limit.h-15,Math.round(drag.original.y+dy)))}
 render();
}
function finishDrag(event){
 if(!drag||event.pointerId!==drag.pointerId)return;
 const initial=drag.before;drag=null;
 checkpoint(initial);properties();
}
function closeEditor(){
 if(!editing)return;
 const entry=current();if(!entry){editing=false;textEditor.hidden=true;return}
 const before=clone(model),value=textEditor.value.slice(0,800);
 editing=false;textEditor.hidden=true;
 if(entry.content!==value){entry.content=value;checkpoint(before)}
 render();
}
function beginText(event){
 const target=event.target.closest('.item');if(!target)return;
 const e=page().elements.find(x=>x.id===target.dataset.id);
 if(!e||e.type!=='text')return;
 closeEditor();selected=e.id;editing=true;
 Object.assign(textEditor.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',
  fontSize:e.fontSize+'px',color:e.fill,textAlign:e.align});
 textEditor.hidden=false;textEditor.value=e.content;textEditor.focus();textEditor.select();
}
function changeSelected(key,value){
 if(!current())return;
 edit(()=>{const e=current();e[key]=value});
}
function control(key,field,transform){
 const input=$(key);let before=null;
 const patch=()=>{
  if(!current())return;
  if(!before)before=clone(model);
  const e=current();e[field]=transform(input.value);
  // Directly redraw stage without replacing the focused property input.
  const focus=document.activeElement;render();
  if(document.activeElement!==focus)focus?.focus?.();
  emit();
 };
 input.addEventListener('focus',()=>{before=null});
 input.addEventListener('input',patch);
 input.addEventListener('change',()=>{
  if(before){checkpoint(before);before=null}properties();
 });
 input.addEventListener('blur',()=>{if(before){checkpoint(before);before=null}properties()});
}
function xml(v){return String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]))}
function pathFor(e){
 if(e.type==='triangle')return `<polygon points="${e.x+e.w/2},${e.y} ${e.x+e.w},${e.y+e.h} ${e.x},${e.y+e.h}" />`;
 if(e.type==='star'){
  const out=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?.43:1;
   out.push((e.x+e.w/2+Math.cos(a)*e.w*k/2).toFixed(1)+','+(e.y+e.h/2+Math.sin(a)*e.h*k/2).toFixed(1))}
  return '<polygon points="'+out.join(' ')+'" />';
 }
 return '';
}
function svg(pageValue){
 const dim=C.LAYOUTS[model.layout];
 let items='<rect width="100%" height="100%" fill="'+pageValue.background+'"/>';
 for(const e of pageValue.elements){
  const basic=' fill="'+e.fill+'" stroke="'+e.stroke+'" stroke-width="2" opacity="'+e.opacity+'"';
  if(e.type==='rect')items+='<rect x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'"'+basic+'/>';
  else if(e.type==='ellipse')items+='<ellipse cx="'+(e.x+e.w/2)+'" cy="'+(e.y+e.h/2)+'" rx="'+e.w/2+'" ry="'+e.h/2+'"'+basic+'/>';
  else if(e.type==='triangle'||e.type==='star')items+='<g'+basic+'>'+pathFor(e)+'</g>';
  else if(e.type==='line')items+='<line x1="'+e.x+'" y1="'+e.y+'" x2="'+(e.x+e.w)+'" y2="'+(e.y+e.h)+'" stroke="'+e.stroke+'" stroke-width="3" opacity="'+e.opacity+'"/>';
  else if(e.type==='image')items+='<image x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'" href="'+xml(e.src)+'" preserveAspectRatio="xMidYMid meet" opacity="'+e.opacity+'"/>';
  else if(e.type==='text'){
   const lines=e.content.split('\n').slice(0,16),anchor=e.align==='left'?'start':e.align==='right'?'end':'middle',
    x=e.align==='left'?e.x:e.align==='right'?e.x+e.w:e.x+e.w/2,step=e.fontSize*1.22;
   let y=e.y+e.h/2-(lines.length-1)*step/2;
   items+='<text fill="'+e.fill+'" font-family="sans-serif" font-weight="650" font-size="'+e.fontSize+'" text-anchor="'+anchor+'" dominant-baseline="middle" opacity="'+e.opacity+'">'+
    lines.map((line,i)=>'<tspan x="'+x+'" y="'+(y+i*step)+'">'+xml(line)+'</tspan>').join('')+'</text>';
  }
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+dim.w+'" height="'+dim.h+'" viewBox="0 0 '+dim.w+' '+dim.h+'">'+items+'</svg>';
}
async function pagePng(pageValue){
 if(pageValue.videoClip)throw Error('이 장면에는 영상 클립이 있어요. 이미지로 저장하면 영상이 사라지므로 현재는 지원하지 않아요.');
 const markup=svg(pageValue),url=URL.createObjectURL(new Blob([markup],{type:'image/svg+xml'}));
 try{
  const dim=C.LAYOUTS[model.layout],img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('이미지 렌더링에 실패했어요.'));img.src=url});
  const canvas=document.createElement('canvas');canvas.width=dim.w;canvas.height=dim.h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('캔버스를 사용할 수 없어요.');
  ctx.drawImage(img,0,0);
  const file=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!file)throw Error('PNG 파일을 만들 수 없어요.');return file;
 }finally{URL.revokeObjectURL(url)}
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),18000)}
async function addImageFile(file){
 if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>2_000_000||file.size<1)throw Error('2MB 이하 PNG 또는 JPG만 추가할 수 있어요.');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('이미지 파일을 읽지 못했어요.'));reader.readAsDataURL(file)});
 if(!C.image(data))throw Error('이미지를 안전하게 열 수 없어요.');
 addElement('image',{x:145,y:105,w:320,h:240,src:data,fill:'#ffffff'});
}
function bind(){
 $('nameTags').addEventListener('click',()=>$('rosterDialog').showModal());
 $('closeRoster').addEventListener('click',()=>$('rosterDialog').close());
 $('loadRoster').addEventListener('click',()=>{
  const names=window.Gulliver?.getNames?.()||[];
  if(!names.length)return notice('우리 반 명단이 비어 있어요. 이름을 직접 입력하거나 우리 반에서 학생을 추가해 주세요.',true);
  $('rosterNames').value=names.join('\n');notice(names.length+'명의 이름을 불러왔어요.');
 });
 $('createRoster').addEventListener('click',()=>{
  try{
   const names=$('rosterNames').value.split(/\r?\n/),project=C.nameTags(names,Number($('rosterCount').value));
   if(!confirm('현재 캔버스를 이름표로 바꿀까요? 실행 취소로 되돌릴 수 있어요.'))return;
   edit(()=>{model=project},'');$('rosterDialog').close();notice('이름표 '+names.filter(n=>n.trim()).length+'개를 만들었어요. PDF·인쇄로 출력하세요.');
  }catch(e){notice(e.message,true)}
 });
 document.querySelectorAll('[data-template]').forEach(b=>b.addEventListener('click',()=>{
  if(!confirm('현재 전체 페이지를 선택한 템플릿으로 바꿀까요? 실행 취소로 되돌릴 수 있어요.'))return;
  edit(()=>{model=C.starter(b.dataset.template)},'');notice('새 템플릿을 적용했어요. 이전 작업은 실행 취소로 되돌릴 수 있어요.');
 }));
 document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>addElement(b.dataset.add)));
 $('addPhoto').addEventListener('click',()=>$('photoPicker').click());
 $('photoPicker').addEventListener('change',async ev=>{const file=ev.target.files?.[0];ev.target.value='';try{await addImageFile(file)}catch(e){notice(e.message,true)}});
 $('newPage').addEventListener('click',addPage);$('clonePage').addEventListener('click',clonePage);
 $('removePage').addEventListener('click',removePage);
 $('duplicate').addEventListener('click',duplicateSelected);$('delete').addEventListener('click',deleteSelected);
 $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
 $('bringForward').addEventListener('click',()=>arrange(1));$('sendBack').addEventListener('click',()=>arrange(-1));
 $('layout').addEventListener('change',ev=>{
  const target=ev.target.value;if(!C.LAYOUTS[target]||target===model.layout)return;
  edit(()=>{
   const old=C.LAYOUTS[model.layout],next=C.LAYOUTS[target];
   for(const p of model.pages)for(const e of p.elements){e.x=Math.round(e.x*next.w/old.w);e.y=Math.round(e.y*next.h/old.h);
    e.w=Math.round(e.w*next.w/old.w);e.h=Math.round(e.h*next.h/old.h)}
   model.layout=target;
  });
 });
 $('designTitle').addEventListener('change',e=>edit(()=>{model.title=e.target.value.trim().slice(0,90)||'통합 제작물'}));
 $('background').addEventListener('change',e=>edit(()=>{page().background=C.color(e.target.value,'#ffffff')}));
 const numeric=(str,low,hi)=>Math.max(low,Math.min(hi,Number(str)||low));
 control('propertyText','content',v=>v.slice(0,800));
 control('propertyFill','fill',v=>C.color(v,'#253650'));
 control('propertyStroke','stroke',v=>C.color(v,'#334155'));
 control('propertyFont','fontSize',v=>numeric(v,10,160));
 control('propertyOpacity','opacity',v=>numeric(v,0,1));
 for(const [input,field] of [['propertyX','x'],['propertyY','y'],['propertyW','w'],['propertyH','h']])
  control(input,field,v=>numeric(v,field==='w'||field==='h'?10:-1500,2000));
 control('propertyAlign','align',v=>['left','center','right'].includes(v)?v:'center');
 stage.addEventListener('pointerdown',startMove);
 window.addEventListener('pointermove',moveDrag);
 window.addEventListener('pointerup',finishDrag);
 window.addEventListener('pointercancel',finishDrag);
 stage.addEventListener('dblclick',beginText);
 textEditor.addEventListener('blur',closeEditor);
 textEditor.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeEditor()}});
 $('exportWebm').addEventListener('click',async()=>{
  if(videoController)return;
  const V=window.GulliverUnifiedVideo,S=window.GulliverStudioStorage;
  if(!V||!S){notice('영상 제작 기능을 불러오지 못했어요.',true);return}
  const panel=$('videoProgressPanel'),button=$('exportWebm'),cancel=$('cancelWebm');
  try{
   timeline?.halt();closeEditor();const snapshot=C.validate(model);
   V.plan(snapshot);if(!V.mimeType())throw Error('이 브라우저는 WebM 출력을 지원하지 않아요. PC Chrome이나 Edge를 이용해 주세요.');
   const controller=new AbortController();videoController=controller;
   button.disabled=true;cancel.hidden=false;panel.hidden=false;
   $('videoProgress').value=0;$('videoProgressText').textContent='0%';
   notice('장면을 영상으로 만드는 중이에요. 탭을 닫지 마세요.');
   const movie=await V.exportWebM(snapshot,{getMedia:mediaProvider,signal:controller.signal,
    onProgress:p=>{const value=Math.round(p*100);$('videoProgress').value=value;$('videoProgressText').textContent=value+'%'}});
   download(movie,(snapshot.title||'수업영상').replace(/[\\/:*?"<>|]/g,'_')+'.webm');
   notice('영상 클립·글씨·장면 효과'+(snapshot.audio?'·WAV 배경음악을':'을')+' 합친 WebM 영상을 저장했어요. 원본 영상 소리는 포함하지 않아요.');
  }catch(e){notice('영상 저장 실패: '+(e.message||e),true)}
  finally{videoController=null;button.disabled=false;cancel.hidden=true;panel.hidden=true}
 });
 $('cancelWebm').addEventListener('click',()=>{videoController?.abort();notice('영상 저장을 취소하는 중이에요.')});
 $('exportPng').addEventListener('click',async()=>{try{timeline?.halt();closeEditor();if(page().videoClip)throw Error('동영상이 있는 장면의 PNG 추출은 아직 지원하지 않아요. 영상 클립을 제거하거나 일반 페이지를 선택해 주세요.');const blob=await pagePng(page());download(blob,(model.title||'수업자료').replace(/[\\/:*?"<>|]/g,'_')+'.png');notice('PNG를 저장했어요.')}catch(e){notice(e.message,true)}});
 $('printPdf').addEventListener('click',()=>{
  timeline?.halt();closeEditor();if(model.pages.some(p=>p.videoClip)){notice('영상이 포함된 자료는 PDF에 움직임을 담을 수 없어요. 영상 없는 페이지에서 인쇄해 주세요.',true);return}document.getElementById('print-page-size')?.remove();
  document.getElementById('printPages')?.remove();
  const sheets=document.createElement('div');sheets.id='printPages';
  const dims=C.LAYOUTS[model.layout],factor=model.layout==='a4'?1.333:1.16;
  for(const source of model.pages){
   const sheet=document.createElement('section');sheet.className='print-sheet';sheet.style.background=source.background;
   sheet.style.width=model.layout==='a4'?'210mm':'297mm';sheet.style.height=model.layout==='a4'?'297mm':'210mm';
   const content=document.createElement('div');content.className='print-sheet-content';
   Object.assign(content.style,{width:dims.w+'px',height:dims.h+'px',background:source.background,transform:'scale('+factor+')'});
   for(const element of source.elements){const item=drawItem(element);item.classList.remove('selected');item.querySelector('.grip')?.remove();content.append(item)}
   sheet.append(content);sheets.append(sheet);
  }
  document.body.append(sheets);document.body.classList.add('printing-pages');
  const style=document.createElement('style');style.id='print-page-size';
  style.textContent='@page { size: '+(model.layout==='a4'?'A4 portrait':'A4 landscape')+'; margin: 0 }';
  document.head.append(style);window.print();
 });
 window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-pages');document.getElementById('printPages')?.remove();document.getElementById('print-page-size')?.remove()});
 $('present').addEventListener('click',async()=>{
  try{await $('stageView').requestFullscreen();timeline?.play()}
  catch(e){notice('전체 화면을 사용할 수 없는 브라우저예요. 아래 타임라인의 재생 버튼을 눌러 주세요.',true)}
 });
 window.addEventListener('resize',size);
 document.addEventListener('fullscreenchange',()=>{size();if(!document.fullscreenElement&&timeline?.isPlaying())timeline.pause()});
 document.addEventListener('keydown',e=>{
  const inside=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return}
  if(inside)return;
  if(document.fullscreenElement&&e.code==='Space'){
   e.preventDefault();if(timeline?.isPlaying())timeline.pause();else timeline?.play();return
  }
  if(document.fullscreenElement&&['ArrowLeft','ArrowRight'].includes(e.key)){
   e.preventDefault();const jump=Math.max(0,Math.min(model.pages.length-1,model.active+(e.key==='ArrowRight'?1:-1)));
   timeline?.seek(model.pages.slice(0,jump).reduce((t,p)=>t+p.duration,0));return
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected()}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected()}
 });
}
timeline=window.GulliverUnifiedTimeline?.create({
 getModel:()=>model,getSelected:()=>selected,edit,showPage:i=>{model.active=i;selected='';render();pageChange(i)},notice,stage,onPlaybackChange:playing=>playbackChange(playing)
});
window.GulliverStudioAdapter={
 kind:'canvas',
 capture:()=>C.validate(model),
 setSceneVideoClip:clip=>edit(()=>{
  if(clip){
   const original=page().videoClip||{},base=C.LAYOUTS[model.layout];
   page().videoClip=C.cleanVideoClip({...{x:0,y:0,w:base.w,h:base.h,stack:0},...original,...clip});
   page().duration=Math.min(20,Math.max(1,Math.round(clip.duration*10)/10));
  }else delete page().videoClip
 },''),
 setSceneVideoLayout:patch=>edit(()=>{
  if(!page().videoClip)return;
  const dims=C.LAYOUTS[model.layout],item=page().videoClip;
  const proposed={...item,...patch};
  proposed.w=Math.min(dims.w*2,Math.max(60,Number(proposed.w)||dims.w));
  proposed.h=Math.min(dims.h*2,Math.max(40,Number(proposed.h)||dims.h));
  proposed.x=Math.max(-dims.w,Math.min(dims.w,Number(proposed.x)||0));
  proposed.y=Math.max(-dims.h,Math.min(dims.h,Number(proposed.y)||0));
  page().videoClip=C.cleanVideoClip(proposed);
 }),
 arrangeMediaLayer:(id,action)=>edit(()=>{
  const p=page(),videoId='__video__',hasVideo=!!p.videoClip;
  const ids=p.elements.map(e=>e.id);
  if(hasVideo)ids.splice(Math.min(ids.length,p.videoClip.stack||0),0,videoId);
  const from=ids.indexOf(id);if(from<0)return;
  let to=from;
  if(action==='front')to=ids.length-1;
  if(action==='back')to=0;
  if(action==='up')to=Math.min(ids.length-1,from+1);
  if(action==='down')to=Math.max(0,from-1);
  ids.splice(from,1);ids.splice(to,0,id);
  if(hasVideo)p.videoClip.stack=ids.indexOf(videoId);
  p.elements=ids.filter(x=>x!==videoId).map(x=>p.elements.find(item=>item.id===x));
 }),
 setImageAsBackground:id=>edit(()=>{
  const p=page(),index=p.elements.findIndex(e=>e.id===id);
  if(index<0||p.elements[index].type!=='image')return;
  const [image]=p.elements.splice(index,1),dim=C.LAYOUTS[model.layout];
  Object.assign(image,{x:0,y:0,w:dim.w,h:dim.h});
  p.elements.unshift(image);if(p.videoClip)p.videoClip.stack=Math.max(1,p.videoClip.stack);
 }),
 getMedia:id=>mediaProvider(id),
 getSceneVideoClip:()=>page().videoClip||null,
 getSelectedLayerInfo:()=>current()?{id:selected,type:current().type}:null,
 setMusicTrim:patch=>edit(()=>{if(model.audio)model.audio={...model.audio,...patch}}),
 setMediaProvider:provider=>{mediaProvider=provider;timeline?.setMediaProvider(provider)},
 setMediaSink:sink=>timeline?.setMediaSink(sink),
 onPageChange:callback=>{pageChange=callback},
 onPlaybackChange:callback=>{playbackChange=callback;callback(timeline?.isPlaying()||false)},
 seekPage:index=>{const i=Math.max(0,Math.min(model.pages.length-1,index));timeline?.seek(model.pages.slice(0,i).reduce((sum,p)=>sum+p.duration,0));pageChange(i)},
 play:()=>timeline?.play(),pause:()=>timeline?.pause(),isPlaying:()=>timeline?.isPlaying()||false,
 apply:raw=>{timeline?.halt();closeEditor();model=C.validate(raw);selected='';undoStack=[];redoStack=[];timeline?.syncToActive();render();timeline?.refreshSoundShelf().then(()=>timeline?.prepareAudio?.()).catch(()=>{})},
 rename:title=>edit(()=>{model.title=String(title).slice(0,90)}),
 insertImage:addImageFile,
 exportImage:async()=>{closeEditor();return pagePng(page())},
 exportVideo:async()=>{throw Error('영상 저장은 통합 캔버스 안의 “영상 저장 (WebM)” 버튼에서 진행해 주세요.')},
 exportSlides:async()=>{
  if(model.pages.length>5)throw Error('영상으로 한 번에 보낼 수 있는 페이지는 최대 5장이에요.');
   if(model.pages.some(p=>p.videoClip))throw Error('영상 클립이 들어 있는 페이지를 이미지 슬라이드로 전달하는 것은 아직 지원하지 않아요.');
  const pages=model.pages;const files=[];
  for(let i=0;i<pages.length;i++)files.push({name:(i+1)+'_페이지.png',blob:await pagePng(pages[i])});
  return files;
 }
};
bind();render();
})();
