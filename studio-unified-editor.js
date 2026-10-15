(()=>{
'use strict';
const C=window.GulliverUnifiedCore,$=id=>document.getElementById(id);
if(!C)throw Error('공통 캔버스 엔진을 불러오지 못했어요.');
const preset=new URLSearchParams(location.search).get('preset');
let model=C.starter(['blank','presentation','worksheet'].includes(preset)?preset:'presentation'),selected='',selectedIds=new Set(),multiSelectMode=false,snapGuides=[],collapsedGroups=new Set(),undoStack=[],redoStack=[],scale=1,drag=null,editing=false,timeline=null,videoController=null;
let mediaProvider=id=>window.GulliverStudioStorage.getMedia(id),pageChange=()=>{},playbackChange=()=>{};
const stage=$('stage'),textEditor=$('editText'),stackLimit=80;
const clone=obj=>JSON.parse(JSON.stringify(obj)),page=()=>model.pages[model.active],
  current=()=>selectedIds.size===1?page().elements.find(e=>e.id===selected&&!e.locked&&!e.hidden)||null:null;
function selectable(e){return !!e&&!e.locked&&!e.hidden}
function membersOf(e){if(!e)return [];const items=e.groupId?page().elements.filter(x=>x.groupId===e.groupId):[e];return items.every(selectable)?items:[]}
function selectedItems(){return page().elements.filter(e=>selectedIds.has(e.id)&&selectable(e))}
function choose(ids){selectedIds=new Set(page().elements.filter(e=>selectable(e)&&ids.includes(e.id)).map(e=>e.id));selected=[...selectedIds][0]||''}
function clearSelection(){selected='';selectedIds.clear()}
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
 if(selectId!==undefined)choose(selectId?[selectId]:[]);
 checkpoint(before);timeline?.syncToActive();render();return result;
}
function undo(){
 timeline?.halt();closeEditor();
 if(!undoStack.length)return;
 redoStack.push(clone(model));model=undoStack.pop();clearSelection();
 timeline?.syncToActive();render();emit();notice('마지막 편집을 취소했어요.');
}
function redo(){
 timeline?.halt();closeEditor();
 if(!redoStack.length)return;
 undoStack.push(clone(model));model=redoStack.pop();clearSelection();
 timeline?.syncToActive();render();emit();notice('다시 실행했어요.');
}
function size(){
 const base=C.LAYOUTS[model.layout],view=$('stageView'),width=Math.max(240,view.clientWidth-20);
 const immersive=document.fullscreenElement===view||view.classList.contains('lesson-fallback');
 const availH=immersive?Math.max(170,view.clientHeight-115):580;
 scale=immersive?Math.min(width/base.w,availH/base.h):Math.min(1,width/base.w,580/base.h);
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
 const node=document.createElement('div');
 node.className='item'+(selectedIds.has(e.id)?' selected':'');
 node.dataset.id=e.id;node.dataset.type=e.type;node.dataset.locked=e.locked?'true':'false';node.title=e.type==='text'?'두 번 눌러 글씨 수정':'끌어서 이동 · 모서리에서 크기 조절';
 Object.assign(node.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',opacity:e.opacity,
  color:e.fill,textAlign:e.align,fontSize:e.fontSize+'px',fontWeight:e.type==='text'?'650':'400',
  transform:'rotate('+(e.rotation||0)+'deg)'});
 if(e.locked)node.classList.add('locked');
 if(e.type==='text'){node.textContent=e.content;node.style.justifyContent=e.align==='left'?'flex-start':e.align==='right'?'flex-end':'center'}
 else if(e.type==='image'){
  const img=document.createElement('img');img.src=e.src;img.alt='업로드한 사진';img.className='item-photo';img.draggable=false;node.append(img);
 }else if(e.type==='line'){
  const line=document.createElementNS('http://www.w3.org/2000/svg','svg');
  line.setAttribute('viewBox','0 0 '+e.w+' '+e.h);line.setAttribute('preserveAspectRatio','none');line.classList.add('item-line');
  const stroke=document.createElementNS('http://www.w3.org/2000/svg','line');
  for(const [key,value] of Object.entries({x1:'0',y1:'0',x2:String(e.w),y2:String(e.h),stroke:e.stroke,'stroke-width':'3'}))stroke.setAttribute(key,value);
  line.append(stroke);node.append(line);
 }else{
  node.style.background=e.fill;node.style.border=e.type==='ellipse'?'2px solid '+e.stroke:'2px solid '+e.stroke;
  if(e.type==='ellipse')node.style.borderRadius='50%';
  if(e.type==='triangle'||e.type==='star')node.style.clipPath=shapePoints(e.type);
 }
 if(selectedIds.size===1&&selectedIds.has(e.id))addHandles(node);
 return node;
}
function addHandles(node){
 const grip=document.createElement('span');grip.className='grip';grip.setAttribute('aria-label','크기 조절');
 const rotation=document.createElement('span');rotation.className='rotate-grip';rotation.setAttribute('aria-label','드래그하여 회전');
 rotation.title='회전 · Shift를 누르면 15° 단위';node.append(grip,rotation);
}
function drawSelectionFrame(){
 const items=selectedItems();if(items.length<2)return;
 const b=C.selectionBounds(items),frame=document.createElement('div');frame.className='selection-frame';
 Object.assign(frame.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px'});
 const grip=document.createElement('span');grip.className='grip';grip.setAttribute('aria-label','선택한 요소 전체 크기 조절');
 frame.append(grip);stage.append(frame);
 const rotation=document.createElement('span');rotation.className='rotate-grip';rotation.title='그룹 회전 · Shift는 15° 단위';rotation.setAttribute('aria-label','그룹 회전');frame.append(rotation);
}
function drawSnapGuides(){
 for(const guide of snapGuides){
  const node=document.createElement('div');node.className='snap-guide '+(guide.axis==='x'?'vertical':'horizontal');
  node.style[guide.axis==='x'?'left':'top']=guide.position+'px';stage.append(node);
 }
}
function layerName(e){return e.type==='text'?(e.content||'빈 글씨').slice(0,22):({image:'사진',rect:'네모',ellipse:'원',triangle:'세모',star:'별',line:'선'}[e.type]||'요소')}
function layerUnit(e){return page().elements.filter(x=>e.groupId&&x.groupId===e.groupId||!e.groupId&&x.id===e.id)}
function layerSelect(e){
 const items=layerUnit(e);
 if(items.some(x=>x.locked||x.hidden))return notice('잠긴 요소나 숨긴 요소는 편집할 수 없어요. 먼저 풀어 주세요.',true);
 choose(items.map(x=>x.id));render();
}
function setLayerFlag(e,key,value){
 const ids=new Set(layerUnit(e).map(x=>x.id));
 edit(()=>{for(const item of page().elements)if(ids.has(item.id)){if(value)item[key]=true;else delete item[key]}});
}
function moveLayer(e,direction){
 const ids=layerUnit(e).map(x=>x.id);
 edit(()=>{page().elements=C.reorderLayers(page().elements,ids,direction)});
}
function renderLayers(){
 const root=$('layerList');if(!root)return;
 const entries=[],listedGroups=new Set();
 for(const e of [...page().elements].reverse()){
  if(e.groupId){
   if(listedGroups.has(e.groupId))continue;
   listedGroups.add(e.groupId);entries.push({item:e,group:true,members:layerUnit(e)});
  }else entries.push({item:e,group:false,members:[e]});
 }
 const fragment=document.createDocumentFragment();
 for(const entry of entries){
  const {item,members,group}=entry,locked=members.some(x=>x.locked),hidden=members.every(x=>x.hidden);
  const container=document.createElement('div');container.className='v4b-layer-entry';
  const row=document.createElement('div');row.className='v4b-layer-row';row.setAttribute('role','listitem');
  if(members.some(x=>selectedIds.has(x.id)))row.classList.add('active');
  const main=document.createElement('button');main.type='button';main.className='v4b-layer-title';
  main.textContent=(group?'▣ '+members.length+'개 묶음':'▤ '+layerName(item));main.title=group?'그룹 선택':layerName(item);
  main.addEventListener('click',()=>layerSelect(item));row.append(main);
  if(group){
   const fold=document.createElement('button');fold.type='button';fold.className='v4b-layer-icon';fold.title='그룹 접기·펼치기';
   fold.textContent=collapsedGroups.has(item.groupId)?'▸':'▾';
   fold.addEventListener('click',()=>{if(collapsedGroups.has(item.groupId))collapsedGroups.delete(item.groupId);else collapsedGroups.add(item.groupId);renderLayers()});
   row.insertBefore(fold,main);
  }
  const action=(caption,title,callback,active=false)=>{
   const button=document.createElement('button');button.type='button';button.textContent=caption;button.title=title;
   button.className='v4b-layer-icon'+(active?' toggled':'');button.setAttribute('aria-label',title);
   button.addEventListener('click',callback);row.append(button);
  };
  action('↑','위 레이어로',()=>moveLayer(item,'up'));
  action('↓','아래 레이어로',()=>moveLayer(item,'down'));
  action(hidden?'◌':'◉',hidden?'레이어 보이기':'레이어 숨기기',()=>setLayerFlag(item,'hidden',!hidden),hidden);
  action(locked?'▣':'▢',locked?'잠금 해제':'레이어 잠금',()=>setLayerFlag(item,'locked',!locked),locked);
  container.append(row);
  if(group&&!collapsedGroups.has(item.groupId)){
   const children=document.createElement('div');children.className='v4b-layer-children';
   for(const member of [...members].reverse()){
    const label=document.createElement('div');label.className='v4b-layer-child';label.textContent=layerName(member);
    if(member.locked)label.textContent+=' · 잠김';if(member.hidden)label.textContent+=' · 숨김';
    children.append(label);
   }
   container.append(children);
  }
  fragment.append(container);
 }
 root.replaceChildren(fragment);
}
function selectionUnits(){
 const units=[],seen=new Set();
 for(const item of selectedItems()){
  const key=item.groupId||item.id;if(seen.has(key))continue;seen.add(key);
  const members=selectedItems().filter(x=>(x.groupId||x.id)===key);
  units.push({id:key,members,...C.selectionBounds(members)});
 }
 return units;
}
function alignSelected(mode){
 const units=selectionUnits();if(!units.length)return;
 const dim=units.length===1?C.LAYOUTS[model.layout]:null;
 const changed=C.alignSelection(units,mode,dim);
 edit(()=>{for(let i=0;i<units.length;i++){
  const dx=changed[i].x-units[i].x,dy=changed[i].y-units[i].y;
  for(const member of units[i].members){const e=page().elements.find(x=>x.id===member.id);e.x+=dx;e.y+=dy}
 }});
}
function distributeSelected(axis){
 const units=selectionUnits();if(units.length<3)return notice('간격 맞춤은 독립된 요소나 그룹 3개 이상을 선택해 주세요.',true);
 const changed=C.distributeSelection(units,axis);
 edit(()=>{for(let i=0;i<units.length;i++){
  const dx=changed[i].x-units[i].x,dy=changed[i].y-units[i].y;
  for(const member of units[i].members){const e=page().elements.find(x=>x.id===member.id);e.x+=dx;e.y+=dy}
 }});
}
function rotateSelected(delta){
 const items=selectedItems();if(!items.length)return;
 const updates=C.rotateSelection(items,delta);
 edit(()=>{for(const change of updates)Object.assign(page().elements.find(e=>e.id===change.id),change)});
}
function renderPages(){
 const strip=$('pageStrip');strip.replaceChildren();
 for(const [i,p] of model.pages.entries()){
  const button=document.createElement('button');button.className='page'+(i===model.active?' active':'');
  const thumb=document.createElement('span');thumb.className='mini';thumb.style.background=p.background;
  thumb.textContent=p.elements.find(e=>e.type==='text')?.content?.slice(0,24)||'빈 페이지';
  const label=document.createElement('span');label.textContent=(i+1)+'. '+p.name.slice(0,20);
  button.append(thumb,label);button.type='button';button.title=(i+1)+'번째 페이지 열기';
  button.addEventListener('click',()=>{timeline?.halt();closeEditor();model.active=i;clearSelection();timeline?.syncToActive();render();emit()});
  strip.append(button);
 }
 const add=document.createElement('button');add.textContent='＋ 페이지 추가';add.type='button';add.addEventListener('click',addPage);strip.append(add);
}
function properties(){
 const e=current(),items=selectedItems(),onlyText=!!e&&e.type==='text';
 document.querySelector('.properties').classList.toggle('has-selection',items.length>0);
 $('selectionCount').textContent=items.length?items.length+'개 선택됨':'요소를 선택하세요';
 $('groupSelection').disabled=items.length<2;$('ungroupSelection').disabled=!items.some(x=>x.groupId);
 $('multiSelectMode').setAttribute('aria-pressed',String(multiSelectMode));
 $('multiSelectMode').classList.toggle('active',multiSelectMode);
 $('propertyHint').textContent=items.length>1?'선택한 요소들을 함께 이동하거나 보라색 손잡이로 크기를 조절하세요.':e?'선택한 '+({text:'글씨',rect:'네모',ellipse:'동그라미',triangle:'세모',star:'별',line:'선',image:'사진'}[e.type]||'요소')+'의 속성이에요.':'글씨·도형을 직접 클릭하면 속성이 나타나요.';
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
 for(const key of ['delete','duplicate'])$(key).disabled=!items.length;
 for(const key of ['bringForward','sendBack','layerFront','layerBack'])$(key).disabled=!items.length;
 $('propertyRotation').disabled=!items.length;
 if(document.activeElement!==$('propertyRotation'))$('propertyRotation').value=items.length?Math.round((items[0].rotation||0)*10)/10:0;
 const units=selectionUnits().length;
 for(const button of document.querySelectorAll('[data-align]'))button.disabled=!units;
 for(const button of document.querySelectorAll('[data-distribute]'))button.disabled=units<3;
 $('undo').disabled=!undoStack.length;$('redo').disabled=!redoStack.length;
 $('layout').value=model.layout;
 $('designTitle').value=model.title;
}
function render(){
 size();stage.style.background=page().background;
 if(!selected)selectedIds.clear();
 else{const available=new Set(page().elements.filter(selectable).map(e=>e.id));
  selectedIds=new Set([...selectedIds].filter(id=>available.has(id)));
  if(!selectedIds.size)clearSelection();else if(!selectedIds.has(selected))selected=[...selectedIds][0];}
 stage.querySelectorAll('.item,.selection-frame,.selection-marquee,.snap-guide').forEach(el=>el.remove());
 for(const e of page().elements)if(!e.hidden)stage.append(drawItem(e));
 drawSelectionFrame();drawSnapGuides();
 window.GulliverCanvasMedia?.placeVideo?.();
 renderPages();properties();renderLayers();timeline?.refresh();window.GulliverCanvasMedia?.refresh?.();
 window.GulliverMultiTrack?.refresh?.();
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
 edit(()=>{const p=clone(page()),groups=new Map();p.id=C.id();p.name+=' 복사';
  p.elements=p.elements.map(e=>{const next={...e,id:C.id()};if(e.groupId){if(!groups.has(e.groupId))groups.set(e.groupId,C.groupId());next.groupId=groups.get(e.groupId)}return next});
  model.pages.splice(model.active+1,0,p);model.active++},'');
}
function removePage(){
 if(model.pages.length===1){notice('마지막 페이지는 삭제할 수 없어요.',true);return}
 if(!confirm('현재 페이지를 삭제할까요? 실행 취소로 되돌릴 수 있어요.'))return;
 edit(()=>{model.pages.splice(model.active,1);model.active=Math.min(model.active,model.pages.length-1)},'');
}
function cleanOrphanGroups(){
 const counts=new Map();for(const e of page().elements)if(e.groupId)counts.set(e.groupId,(counts.get(e.groupId)||0)+1);
 for(const e of page().elements)if(e.groupId&&counts.get(e.groupId)<2)delete e.groupId;
}
function deleteSelected(){
 const ids=new Set(selectedItems().map(e=>e.id));if(!ids.size)return;
 edit(()=>{page().elements=page().elements.filter(e=>!ids.has(e.id));cleanOrphanGroups()},'');
}
function duplicateSelected(){
 const items=selectedItems();if(!items.length)return;
 if(page().elements.length+items.length>C.MAX_ITEMS)return notice('요소를 더 추가할 수 없어요.',true);
 const groups=new Map(),copies=items.map(e=>{
  const copy={...clone(e),id:C.id(),x:e.x+18,y:e.y+18};
  if(e.groupId){if(!groups.has(e.groupId))groups.set(e.groupId,C.groupId());copy.groupId=groups.get(e.groupId)}
  return copy;
 });
 edit(()=>page().elements.push(...copies),'');
 choose(copies.map(e=>e.id));render();
}
function groupSelected(){
 const items=selectedItems();if(items.length<2)return;
 const group=C.groupId(),ids=new Set(items.map(e=>e.id));
 edit(()=>{const p=page(),picked=p.elements.filter(e=>ids.has(e.id)),last=p.elements.reduce((at,e,i)=>ids.has(e.id)?i:at,-1);
  for(const e of picked)e.groupId=group;
  const rest=p.elements.filter(e=>!ids.has(e.id));
  const prior=p.elements.slice(0,last+1).filter(e=>!ids.has(e.id)).length;
  rest.splice(prior,0,...picked);p.elements=rest;cleanOrphanGroups()});
 notice(items.length+'개 요소를 그룹으로 묶었어요.');
}
function ungroupSelected(){
 const groups=new Set(selectedItems().map(e=>e.groupId).filter(Boolean));if(!groups.size)return;
 edit(()=>{for(const e of page().elements)if(groups.has(e.groupId))delete e.groupId});
 notice('그룹을 해제했어요. 요소는 그대로 남아 있어요.');
}
function arrange(direction){
 const chosen=selectedItems();if(!chosen.length)return;
 const ids=chosen.map(e=>e.id);
 edit(()=>{page().elements=C.reorderLayers(page().elements,ids,direction>0?'up':'down')});
}
function canvasPoint(event){const r=stage.getBoundingClientRect();return{x:(event.clientX-r.left)/scale,y:(event.clientY-r.top)/scale}}
function showSelectionWithoutReplacingTextNode(){
 const items=selectedItems();
 for(const node of stage.querySelectorAll('.item')){
  const active=selectedIds.has(node.dataset.id);node.classList.toggle('selected',active);node.querySelector('.grip')?.remove();
  node.querySelector('.rotate-grip')?.remove();
  if(active&&items.length===1)addHandles(node);
 }
 stage.querySelector('.selection-frame')?.remove();
 if(items.length>1)drawSelectionFrame();
 properties();timeline?.refresh();
}
function startMove(event){
 if(event.button!==0&&event.pointerType==='mouse')return;
 if(editing||stage.classList.contains('playing'))return;
 const rotating=!!event.target.closest('.rotate-grip'),frameGrip=event.target.closest('.selection-frame .grip'),target=event.target.closest('.item');
 if(!target&&!frameGrip&&!rotating){
  if(event.target!==stage)return;
  if(!event.shiftKey&&!multiSelectMode)clearSelection();
  const p=canvasPoint(event),marquee=document.createElement('div');marquee.className='selection-marquee';stage.append(marquee);
  drag={marquee,start:p,pointerId:event.pointerId,additive:event.shiftKey||multiSelectMode,existing:[...selectedIds]};
  event.preventDefault();showSelectionWithoutReplacingTextNode();return;
 }
 const e=target?page().elements.find(x=>x.id===target.dataset.id):null;
 if(e&&!selectable(e))return;
 const resizing=!!frameGrip||!!event.target.closest('.grip');
 if(!rotating&&!frameGrip&&e&&(event.shiftKey||multiSelectMode)&&!resizing){
  const members=membersOf(e),ids=new Set(selectedIds),remove=members.every(x=>ids.has(x.id));
  for(const member of members){if(remove)ids.delete(member.id);else ids.add(member.id)}
  choose([...ids]);showSelectionWithoutReplacingTextNode();event.preventDefault();return;
 }
 if(e&&(!selectedIds.has(e.id)||(e.groupId&&selectedItems().length===1)))choose(membersOf(e).map(x=>x.id));
 const items=selectedItems();if(!items.length)return;
 event.preventDefault();
 const bounds=C.selectionBounds(items),origin={x:bounds.x+bounds.w/2,y:bounds.y+bounds.h/2};
 const pointer=canvasPoint(event);
 drag={pointerId:event.pointerId,resizing,rotating,x:event.clientX,y:event.clientY,before:clone(model),
   items:items.map(x=>clone(x)),bounds,origin,startAngle:Math.atan2(pointer.y-origin.y,pointer.x-origin.x)};
 // Replacing the text node at pointerdown would stop dblclick from firing.
 showSelectionWithoutReplacingTextNode();
}
function moveDrag(event){
 if(!drag||event.pointerId!==drag.pointerId)return;
 if(drag.marquee){
  const a=drag.start,b=canvasPoint(event),x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
  Object.assign(drag.marquee.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});return;
 }
 const dx=(event.clientX-drag.x)/scale,dy=(event.clientY-drag.y)/scale;
 if(drag.rotating){
  const pointer=canvasPoint(event),angle=Math.atan2(pointer.y-drag.origin.y,pointer.x-drag.origin.x);
  let delta=C.normalizeAngle((angle-drag.startAngle)*180/Math.PI);
  if(event.shiftKey)delta=Math.round(delta/15)*15;
  for(const changed of C.rotateSelection(drag.items,delta)){
   const original=page().elements.find(e=>e.id===changed.id);if(original)Object.assign(original,changed);
  }
  snapGuides=[];render();return;
 }
 const limit=C.LAYOUTS[model.layout],initial=drag.bounds;
 let next=drag.resizing?
  {x:initial.x,y:initial.y,w:Math.max(24,Math.min(limit.w+300,Math.round(initial.w+dx))),h:Math.max(20,Math.min(limit.h+300,Math.round(initial.h+dy)))}:
  {x:Math.max(-100,Math.min(limit.w-15,Math.round(initial.x+dx))),y:Math.max(-100,Math.min(limit.h-15,Math.round(initial.y+dy))),w:initial.w,h:initial.h};
 snapGuides=[];
 if($('snapEnabled').checked&&!event.altKey&&!drag.resizing){
  const selectedSet=new Set(drag.items.map(e=>e.id));
  const others=page().elements.filter(e=>!selectedSet.has(e.id)&&!e.hidden);
  const snap=C.snapSelection(next,others,limit,8/scale);
  next={...next,x:snap.x,y:snap.y};snapGuides=snap.guides;
 }
 for(const changed of C.transformSelection(drag.items,initial,next)){
  const item=page().elements.find(x=>x.id===changed.id);if(item)Object.assign(item,changed);
 }
 render();
}
function finishDrag(event){
 if(!drag||event.pointerId!==drag.pointerId)return;
 const entry=drag;drag=null;snapGuides=[];
 if(entry.marquee){
  entry.marquee.remove();
  const a=entry.start,b=canvasPoint(event),x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
  const ids=new Set(entry.additive?entry.existing:[]);
  if(w>=4||h>=4)for(const e of page().elements)
   if(selectable(e)&&e.x<x+w&&e.x+e.w>x&&e.y<y+h&&e.y+e.h>y)
    for(const member of membersOf(e))ids.add(member.id);
  choose([...ids]);render();return;
 }
 checkpoint(entry.before);render();
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
 if(!e||e.type!=='text'||!selectable(e))return;
 closeEditor();choose([e.id]);editing=true;
 Object.assign(textEditor.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px',
  fontSize:e.fontSize+'px',color:e.fill,textAlign:e.align,transform:'rotate('+(e.rotation||0)+'deg)',transformOrigin:'center center'});
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
  if(e.hidden)continue;
  const rotation=e.rotation||0;
  if(rotation)items+='<g transform="rotate('+rotation+' '+(e.x+e.w/2)+' '+(e.y+e.h/2)+')">';
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
  if(rotation)items+='</g>';
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
 $('groupSelection').addEventListener('click',groupSelected);$('ungroupSelection').addEventListener('click',ungroupSelected);
 $('multiSelectMode').addEventListener('click',()=>{multiSelectMode=!multiSelectMode;properties();notice(multiSelectMode?'여러 개 선택: 요소를 하나씩 눌러 추가하세요.':'일반 선택으로 돌아왔어요.')});
 $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
 $('bringForward').addEventListener('click',()=>arrange(1));$('sendBack').addEventListener('click',()=>arrange(-1));
 $('layerFront').addEventListener('click',()=>{const ids=selectedItems().map(e=>e.id);if(ids.length)edit(()=>{page().elements=C.reorderLayers(page().elements,ids,'front')})});
 $('layerBack').addEventListener('click',()=>{const ids=selectedItems().map(e=>e.id);if(ids.length)edit(()=>{page().elements=C.reorderLayers(page().elements,ids,'back')})});
 for(const button of document.querySelectorAll('[data-align]'))button.addEventListener('click',()=>alignSelected(button.dataset.align));
 for(const button of document.querySelectorAll('[data-distribute]'))button.addEventListener('click',()=>distributeSelected(button.dataset.distribute));
 $('propertyRotation').addEventListener('change',ev=>{
  const items=selectedItems();if(!items.length)return;
  const angle=Math.max(-180,Math.min(180,Number(ev.target.value)||0));
  rotateSelected(C.normalizeAngle(angle-(items[0].rotation||0)));
 });

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
 $('exportPng').addEventListener('click',async()=>{try{timeline?.halt();closeEditor();if(model.tracks?.length)throw Error('다중 트랙이 있는 자료는 PNG 이미지로 저장할 수 없어요. 완성본 영상 출력은 후속 단계에서 지원해요.');if(page().videoClip)throw Error('동영상이 있는 장면의 PNG 추출은 아직 지원하지 않아요. 영상 클립을 제거하거나 일반 페이지를 선택해 주세요.');const blob=await pagePng(page());download(blob,(model.title||'수업자료').replace(/[\\/:*?"<>|]/g,'_')+'.png');notice('PNG를 저장했어요.')}catch(e){notice(e.message,true)}});
 $('printPdf').addEventListener('click',()=>{
  timeline?.halt();closeEditor();if(model.tracks?.length){notice('다중 트랙이 있는 자료는 PDF로 출력할 수 없어요. 일반 디자인으로 저장해 주세요.',true);return}if(model.pages.some(p=>p.videoClip)){notice('영상이 포함된 자료는 PDF에 움직임을 담을 수 없어요. 영상 없는 페이지에서 인쇄해 주세요.',true);return}document.getElementById('print-page-size')?.remove();
  document.getElementById('printPages')?.remove();
  const sheets=document.createElement('div');sheets.id='printPages';
  const dims=C.LAYOUTS[model.layout],factor=model.layout==='a4'?1.333:1.16;
  for(const source of model.pages){
   const sheet=document.createElement('section');sheet.className='print-sheet';sheet.style.background=source.background;
   sheet.style.width=model.layout==='a4'?'210mm':'297mm';sheet.style.height=model.layout==='a4'?'297mm':'210mm';
   const content=document.createElement('div');content.className='print-sheet-content';
   Object.assign(content.style,{width:dims.w+'px',height:dims.h+'px',background:source.background,transform:'scale('+factor+')'});
   for(const element of source.elements){if(element.hidden)continue;const item=drawItem(element);item.classList.remove('selected');item.querySelector('.grip')?.remove();content.append(item)}
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
  catch(e){
   if(window.GulliverPresentationTools?.enterFallback?.()){timeline?.play();return}
   notice('발표 화면을 열지 못했어요. 타임라인의 재생 버튼을 이용해 주세요.',true)
  }
 });
 window.addEventListener('resize',size);
 document.addEventListener('fullscreenchange',()=>{
  size();
  if(!document.fullscreenElement&&!$('stageView').classList.contains('lesson-fallback')&&timeline?.isPlaying())timeline.pause();
 });
 document.addEventListener('keydown',e=>{
  const inside=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return}
  if(inside||document.getElementById('teacherLiveDialog')?.open||document.getElementById('lessonToolPicker')?.hidden===false)return;
  if(document.fullscreenElement&&e.code==='Space'){
   e.preventDefault();if(timeline?.isPlaying())timeline.pause();else timeline?.play();return
  }
  if(document.fullscreenElement&&['ArrowLeft','ArrowRight'].includes(e.key)){
   e.preventDefault();const jump=Math.max(0,Math.min(model.pages.length-1,model.active+(e.key==='ArrowRight'?1:-1)));
   timeline?.seek(model.pages.slice(0,jump).reduce((t,p)=>t+p.duration,0));return
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='g'){e.preventDefault();if(e.shiftKey)ungroupSelected();else groupSelected();return}
  if(e.key==='Escape'){clearSelection();render();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelected()}
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected()}
 });
}
timeline=window.GulliverUnifiedTimeline?.create({
 getModel:()=>model,getSelected:()=>selected,edit,showPage:i=>{model.active=i;clearSelection();render();pageChange(i)},notice,stage,onPlaybackChange:playing=>playbackChange(playing)
});
function ensureMultitrack(){
 if(!Array.isArray(model.tracks))model.tracks=[];
 const tracks=model.tracks,pages=model.pages;
 let offset=0;
 for(const p of pages){
  if(p.videoClip){
   const clip=p.videoClip;
   tracks.push(C.cleanTrack({id:C.id(),kind:'video',mediaId:clip.mediaId,mime:clip.mime,
    name:clip.name,start:offset,duration:Math.min(clip.duration,p.duration),trimStart:clip.inPoint,
    x:clip.x,y:clip.y,w:clip.w,h:clip.h,stack:clip.stack,muted:true}));
   delete p.videoClip;
  }
  offset+=p.duration;
 }
 if(model.audio){
  const music=model.audio;
  tracks.push(C.cleanTrack({id:C.id(),kind:'audio',mediaId:music.mediaId,mime:'audio/wav',
    name:music.name,start:0,duration:Math.min(offset,music.trimDuration||60),
    trimStart:music.trimStart||0,volume:music.volume}));
  model.audio=null;
 }
 model.tracks=tracks;
}
function changeTrack(id,patch){
 const track=model.tracks?.find(x=>x.id===id);if(!track)throw Error('수정할 클립이 없어요.');
 const normalized=C.cleanTrack({...track,...patch});
 if(normalized.start+normalized.duration>C.totalDuration(model)+.05)throw Error('클립이 수업 전체 길이를 넘어요. 페이지를 추가하거나 길이를 줄여 주세요.');
 Object.assign(track,normalized);
}
window.GulliverStudioAdapter={
 kind:'canvas',
 capture:()=>C.validate(model),
 appendTeacherPages:result=>{
  if(!result||!Array.isArray(result.pages)||!result.pages.length)throw Error('캔버스에 추가할 자료가 없어요.');
  if(result.layout!==model.layout)throw Error('캔버스 크기가 일치하지 않아요. 자료를 다시 만들어 주세요.');
  if(model.pages.length+result.pages.length>C.MAX_PAGES)throw Error('이 작업에 남은 페이지가 부족해요. 최대 40장까지 사용할 수 있어요.');
  const pages=result.pages.map(p=>C.makePage(p.name,p.elements,p.background));
  const trial=C.validate({...model,pages:[...model.pages,...pages],active:model.pages.length});
  const before=clone(model);
  timeline?.halt();closeEditor();
  model=trial;clearSelection();checkpoint(before);timeline?.syncToActive();render();
  notice(pages.length+'장 추가했어요. 글씨·도형은 자유롭게 편집할 수 있어요.');
  return pages.length;
 },
 getTracks:()=>model.tracks||[],
 multitrackEnabled:()=>Array.isArray(model.tracks),
 adoptLegacyMedia:()=>edit(()=>ensureMultitrack()),
 getSceneTime:()=>timeline?.getTime?.()||0,
 seekPresentationTime:seconds=>timeline?.seek?.(seconds),
 isPresentationActive:()=>document.fullscreenElement===$('stageView')||$('stageView').classList.contains('lesson-fallback'),
 resizePresentation:size,
 addTrack:raw=>edit(()=>{
  ensureMultitrack();
  if(model.tracks.length>=C.MAX_TRACKS)throw Error('최대 '+C.MAX_TRACKS+'개 클립까지 추가할 수 있어요.');
  const next=C.cleanTrack({...raw,id:C.id()});
  if(next.start+next.duration>C.totalDuration(model)+.05)throw Error('타임라인의 끝을 넘어요. 페이지 길이를 늘려 주세요.');
  model.tracks.push(next);
  return next.id;
 }),
 updateTrack:(id,patch)=>edit(()=>{ensureMultitrack();changeTrack(id,patch)}),
 removeTrack:id=>edit(()=>{ensureMultitrack();model.tracks=model.tracks.filter(x=>x.id!==id)}),
 expandTimeline:()=>edit(()=>{
  if(C.totalDuration(model)<12){const p=model.pages[0];p.duration=Math.min(20,p.duration+(12-C.totalDuration(model)))}
 }),

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
 addMusicFile:file=>timeline?.importWav(file),
 selectMusicFile:id=>timeline?.selectAudio(id),
 setMediaProvider:provider=>{mediaProvider=provider;timeline?.setMediaProvider(provider)},
 setMediaSink:sink=>timeline?.setMediaSink(sink),
 onPageChange:callback=>{pageChange=callback},
 onPlaybackChange:callback=>{playbackChange=callback;callback(timeline?.isPlaying()||false)},
 seekPage:index=>{const i=Math.max(0,Math.min(model.pages.length-1,index));timeline?.seek(model.pages.slice(0,i).reduce((sum,p)=>sum+p.duration,0));pageChange(i)},
 play:()=>timeline?.play(),pause:()=>timeline?.pause(),isPlaying:()=>timeline?.isPlaying()||false,
 apply:raw=>{timeline?.halt();closeEditor();model=C.validate(raw);clearSelection();undoStack=[];redoStack=[];timeline?.syncToActive();render();timeline?.refreshSoundShelf().then(()=>timeline?.prepareAudio?.()).catch(()=>{})},
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
