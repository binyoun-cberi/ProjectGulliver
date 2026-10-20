/* Contextual, Canva-like editing without a second canvas engine. All mutations use native controls/adapter. */
(()=>{
'use strict';
const A=window.GulliverStudioAdapter,stage=document.getElementById('stage');
if(!A||!stage)return;
const $=id=>document.getElementById(id),make=(tag,cls,text)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
};
const toolbar=make('div','canvas-quick-edit');toolbar.id='canvasQuickEdit';toolbar.hidden=true;
toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','선택한 요소 빠른 편집');
const title=make('strong','quick-edit-title','선택 편집');toolbar.append(title);
function button(label,action,tooltip){
 const el=make('button','quick-edit-button',label);el.type='button';el.dataset.quickAction=action;el.title=tooltip||label;
 toolbar.append(el);return el;
}
function line(){toolbar.append(make('span','quick-edit-divider'))}
function input(kind,attr,label){
 const wrap=make('label','quick-edit-field');wrap.title=label;
 const field=document.createElement(kind);field.dataset.quickInput=attr;field.setAttribute('aria-label',label);
 wrap.append(field);toolbar.append(wrap);return field;
}
const font=input('select','fontFamily','글꼴');
for(const [v,t]of [['sans','깔끔한 고딕'],['rounded','부드러운 고딕'],['serif','바탕체'],['mono','고정폭']]){
 const o=document.createElement('option');o.value=v;o.textContent=t;font.append(o);
}
const fontSize=input('input','fontSize','글씨 크기');fontSize.type='number';fontSize.min=10;fontSize.max=160;fontSize.step=1;
const bold=button('B','bold','글씨 굵게');
const italic=button('I','italic','기울임');
const underline=button('U','underline','밑줄');
const alignment=button('☰','align','글씨 정렬');
const fill=input('input','fill','글씨 또는 도형 색');fill.type='color';
const stroke=input('input','stroke','테두리 색');stroke.type='color';
const border=button('테두리','border','테두리 굵기');
const mask=input('select','mask','사진 틀');
for(const [v,t]of [['none','사각형 틀'],['rounded','둥근 틀'],['circle','원형 틀']]){
 const o=document.createElement('option');o.value=v;o.textContent=t;mask.append(o);
}
const crop=button('자르기','crop','사진 자르기');
line();
const position=button('위치','position','앞뒤 순서');
const duplicate=button('복제','duplicate');
const remove=button('삭제','delete');
const more=button('⋯','more','더 많은 편집 기능');
const popup=make('div','canvas-quick-border');popup.id='canvasQuickBorder';popup.hidden=true;
const widthLabel=make('label','', '테두리 굵기 ');
const widthOutput=make('output','','0');
const widthInput=document.createElement('input');widthInput.type='range';widthInput.min=0;widthInput.max=12;widthInput.step=1;
widthInput.setAttribute('aria-label','테두리 굵기');widthLabel.append(widthOutput,widthInput);
popup.append(widthLabel);toolbar.append(popup);
document.body.append(toolbar);
const menu=make('div','canvas-unified-menu');menu.id='canvasUnifiedMenu';menu.hidden=true;menu.setAttribute('role','menu');
menu.setAttribute('aria-label','요소 편집 메뉴');
const groups=[
 [['copy','복사'],['paste','붙여넣기'],['duplicate','복제'],['delete','삭제']],
 [['up','한 칸 앞으로'],['down','한 칸 뒤로'],['front','맨 앞으로'],['back','맨 뒤로']],
 [['group','묶기'],['ungroup','묶음 풀기'],['lock','잠금'],['background','사진을 맨 뒤에 깔기']]
];
for(let i=0;i<groups.length;i++){
 if(i)menu.append(make('div','canvas-menu-divider'));
 for(const [action,label]of groups[i]){
  const b=make('button','',label);b.type='button';b.dataset.canvasAction=action;b.setAttribute('role','menuitem');menu.append(b);
 }
}
document.body.append(menu);
let menuTarget=null,lastId='',frame=0;
function activeElements(){
 return A.getQuickSelection?.()||[];
}
function current(){
 const items=activeElements();return items.length===1?items[0]:null;
}
function clamp(x,min,max){return Math.max(min,Math.min(max,x))}
function update(){
 frame=0;
 const items=activeElements(),e=items.length===1?items[0]:null;
 if(!items.length||stage.classList.contains('playing')||document.querySelector('#teacherLiveDialog[open]')){
  toolbar.hidden=true;popup.hidden=true;return;
 }
 toolbar.hidden=false;
 toolbar.dataset.kind=e?.type||'multi';
 title.textContent=e?({text:'글씨',image:'사진',rect:'네모',ellipse:'동그라미',triangle:'세모',star:'별',line:'선'}[e.type]||'편집'):items.length+'개 선택';
 const set=(field,value)=>{if(document.activeElement!==field)field.value=value};
 if(e){
  set(font,e.fontFamily||'sans');set(fontSize,e.fontSize||38);
  set(fill,e.fill||'#253650');set(stroke,e.stroke||'#334155');set(mask,e.mask||'none');
  set(widthInput,e.borderWidth??window.GulliverUnifiedCore.strokeWidth(e));
  widthOutput.textContent=String(e.borderWidth??window.GulliverUnifiedCore.strokeWidth(e));
  for(const [btn,name,on]of [[bold,'bold',Number(e.fontWeight)>=700],[italic,'italic',e.italic],[underline,'underline',e.underline]]){
   btn.setAttribute('aria-pressed',String(Boolean(on)));
  }
  alignment.title='글씨 정렬 · '+(e.align==='left'?'왼쪽':e.align==='right'?'오른쪽':'가운데');
 }
 const sel=[...stage.querySelectorAll('.item.selected')][0];
 const rect=sel?.getBoundingClientRect()||stage.getBoundingClientRect();
 const headerBottom=document.getElementById('gulliverAppHeader')?.getBoundingClientRect().bottom||0;
 const toolsBottom=document.querySelector('.top-tools')?.getBoundingClientRect().bottom||0;
 if(matchMedia('(max-width:700px)').matches){
  toolbar.style.left='8px';toolbar.style.top=Math.max(58,headerBottom+8,toolsBottom+8)+'px';toolbar.style.width='calc(100vw - 16px)';
 }else{
  // Keep the toolbar near the selection and inside the working viewport.
  toolbar.style.width='';
  const work=document.querySelector('.work').getBoundingClientRect();
  const width=Math.min(800,Math.max(360,toolbar.scrollWidth||620));
  toolbar.style.left=clamp(rect.left+rect.width/2-width/2,work.left+8,Math.max(work.left+8,innerWidth-width-8))+'px';
  toolbar.style.top=clamp(rect.top-65,Math.max(66,work.top+7,headerBottom+8),Math.max(66,innerHeight-110))+'px';
 }
}
function schedule(){if(frame)return;frame=requestAnimationFrame(update)}
function setControl(id,value,checkbox=false){
 const el=$(id);if(!el)return;
 if(checkbox)el.checked=Boolean(value);else el.value=value;
 // Native number/select/color properties persist on 'input'; 'change' only
 // creates the undo checkpoint. Keep exactly the existing editor semantics.
 if(!checkbox)el.dispatchEvent(new Event('input',{bubbles:true}));
 el.dispatchEvent(new Event('change',{bubbles:true}));
 schedule();
}
function openProperties(photo=false){
 popup.hidden=true;
 window.GulliverCanvasShell?.activate?.('properties');
 if(photo){$('photoStylePanel').open=true;$('propertyCropZoom')?.focus({preventScroll:true})}
 else $('propertyText')?.focus({preventScroll:true});
}
function openMenu(id,x,y){
 menuTarget=id||A.getSelectedLayerInfo?.()?.id||null;menu.hidden=false;popup.hidden=true;
 const e=current(),selected=activeElements(),photo=e?.type==='image';
 for(const b of menu.querySelectorAll('button[data-canvas-action]')){
  const action=b.dataset.canvasAction;
  b.hidden=action==='background'&&!photo;
  b.disabled=action==='paste'?!A.quickClipboardAvailable?.()
   :!selected.length&&!(menuTarget&&action!=='group'&&action!=='ungroup')
    ||(action==='group'&&selected.length<2)||(action==='ungroup'&&!selected.some(x=>x.groupId));
 }
 menu.style.left=clamp(x,8,Math.max(8,innerWidth-226))+'px';
 const minTop=(document.getElementById('gulliverAppHeader')?.getBoundingClientRect().bottom||0)+8;
 menu.style.top=clamp(y,minTop,Math.max(minTop,innerHeight-355))+'px';
}
function run(action,id){
 if(action==='more'||action==='position'){openMenu(id,parseFloat(toolbar.style.left)||innerWidth/2,(parseFloat(toolbar.style.top)||80)+50);return}
 if(action==='border'){popup.hidden=!popup.hidden;menu.hidden=true;return}
 if(action==='crop')return openProperties(true);
 if(['bold','italic','underline','align'].includes(action)){
  const e=current();if(!e||e.type!=='text')return;
  if(action==='bold')setControl('propertyFontWeight',Number(e.fontWeight)>=700?'400':'700');
  if(action==='italic')setControl('propertyItalic',!e.italic,true);
  if(action==='underline')setControl('propertyUnderline',!e.underline,true);
  if(action==='align')setControl('propertyAlign',e.align==='left'?'center':e.align==='center'?'right':'left');
  return;
 }
 A.quickElementAction?.(action,id||undefined);schedule();
}
toolbar.addEventListener('click',event=>{
 const target=event.target.closest('[data-quick-action]');if(target){run(target.dataset.quickAction);return}
 if(!popup.hidden&&!popup.contains(event.target)&&event.target!==widthInput)popup.hidden=true;
});
toolbar.addEventListener('change',event=>{
 const key=event.target.dataset.quickInput;if(!key)return;
 if(key==='fontFamily')setControl('propertyFontFamily',event.target.value);
 if(key==='fontSize')setControl('propertyFont',event.target.value);
 if(key==='fill')setControl('propertyFill',event.target.value);
 if(key==='stroke')setControl('propertyStroke',event.target.value);
 if(key==='mask')setControl('propertyMask',event.target.value);
});
widthInput.addEventListener('input',()=>{widthOutput.textContent=widthInput.value});
widthInput.addEventListener('change',()=>setControl('propertyBorderWidth',widthInput.value));
menu.addEventListener('click',event=>{
 const b=event.target.closest('[data-canvas-action]');if(!b||b.disabled)return;
 const action=b.dataset.canvasAction;menu.hidden=true;
 A.quickElementAction?.(action,menuTarget||undefined);menuTarget=null;schedule();
});
stage.addEventListener('contextmenu',event=>{
 const target=event.target.closest('.item');if(!target)return;
 event.preventDefault();event.stopPropagation();
 // Keep an existing multi-selection if the clicked element belongs to it.
 const selected=activeElements(),id=target.dataset.id;
 if(!selected.some(e=>e.id===id)){
  A.selectQuickTarget?.(id);
 }
 schedule();openMenu(id,event.clientX,event.clientY);
});
document.addEventListener('pointerdown',event=>{
 if(!menu.hidden&&!menu.contains(event.target)&&!event.target.closest('[data-quick-action="more"],[data-quick-action="position"]'))menu.hidden=true;
 if(!popup.hidden&&!popup.contains(event.target)&&!event.target.closest('[data-quick-action="border"]'))popup.hidden=true;
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){menu.hidden=true;popup.hidden=true}
 if(event.shiftKey&&event.key==='F10'&&current()){
  event.preventDefault();const r=stage.querySelector('.item.selected')?.getBoundingClientRect();
  openMenu(A.getSelectedLayerInfo?.()?.id,r?.left||innerWidth/2,r?.bottom||90);
 }
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='v'
    &&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)
    &&A.quickClipboardAvailable?.()&&!document.querySelector('dialog[open]')){
   event.preventDefault();run('paste');
 }
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='c'
   &&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&activeElements().length){
   event.preventDefault();run('copy');
 }
});
new MutationObserver(schedule).observe(stage,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
stage.addEventListener('pointerup',()=>requestAnimationFrame(schedule));
window.addEventListener('resize',schedule);
document.querySelector('#pageStrip')?.addEventListener('click',schedule);
window.GulliverCanvasQuick={openMenu,refresh:schedule};
schedule();
})();