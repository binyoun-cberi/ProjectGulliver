/* Accessible mobile navigation for the existing studio.
   All editing/save actions go through GulliverStudioBridge and GulliverStudioLayout. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const bridge=window.GulliverStudioBridge;
const layout=window.GulliverStudioLayout;
const tools=window.GulliverStudioCore?.TOOLS;
if(!bridge||!tools)return;
const bar=$('studioMobileBar'),picker=$('studioToolPicker'),shade=$('canvasMobileShade');
const current=()=>bridge.getState().activeKind||'';
function sync(){
 const kind=current();
 const edit=$('studioBottomEdit');
 if(edit){
  const label=kind==='canvas'?'편집 화면':(['design','slides','document'].includes(kind)?'요소':'작업 화면');
  edit.querySelector('.studio-bottom-label').textContent=label;
 }
 if(bar){
  bar.querySelectorAll('[data-studio-action]').forEach(b=>{
   const action=b.dataset.studioAction;
   b.setAttribute('aria-current',String(action==='edit'&&!!kind));
  });
 }
 if(shade)shade.hidden=!(matchMedia('(max-width: 620px)').matches&&document.body.classList.contains('canvas-library-open'));
}
function openPicker(){
 if(picker?.showModal&&!picker.open)picker.showModal();
}
function showProjects(){
 const kind=current();
 if(kind==='canvas'){
  if(!$('canvasLibraryToggle').hidden)$('canvasLibraryToggle').click();
  else bridge.status('통합 캔버스의 작업 목록을 여는 중이에요.');
 }else if(['design','slides','document'].includes(kind)){
  layout?.setRight('projects');
  $('openInspector')?.click();
 }else if(kind==='picture'||kind==='pdf'){
  bridge.status('그림·PDF는 자동으로 프로젝트가 저장되지 않아요. 편집기에서 파일을 내려받아 보관해 주세요.');
  alert('그림·PDF는 자동으로 내 작업에 저장되지 않아요. 편집기 안의 저장 기능을 사용해 주세요.');
 }else{
  $('recentProjects')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 sync();
}
function editPanel(){
 const kind=current();
 if(['design','slides','document'].includes(kind)){
  layout?.setPalette('add');
  $('openPalette')?.click();
 }else if(kind){
  $('editorArea')?.scrollIntoView({behavior:'smooth',block:'start'});
  $('editorFrame')?.focus({preventScroll:true});
 }else{
  openPicker();
 }
}
function newWork(){
 const kind=current();
 if(kind&&window.GulliverStudioCore?.managed(kind)&&!$('newProject').hidden){
  $('newProject').click();
 }else openPicker();
}
if(bar)bar.addEventListener('click',e=>{
 const button=e.target.closest('[data-studio-action]');
 if(!button)return;
 const action=button.dataset.studioAction;
 if(action==='home')$('navHome').click();
 if(action==='tools')openPicker();
 if(action==='edit')editPanel();
 if(action==='projects')showProjects();
 if(action==='new')newWork();
});
if(picker){
 const grid=picker.querySelector('.picker-grid');
 for(const [kind,tool] of Object.entries(tools)){
  const b=document.createElement('button');b.type='button';b.dataset.kind=kind;
  const span=document.createElement('span');span.textContent=tool.icon;span.setAttribute('aria-hidden','true');
  b.append(span,document.createTextNode(tool.label));
  b.addEventListener('click',async()=>{
   // The existing bridge asks for confirmation before discarding unsaved picture/PDF edits.
   const opened=await bridge.start(kind);
   if(opened)picker.close();
   sync();
  });
  grid.append(b);
 }
 picker.querySelector('[data-close-picker]')?.addEventListener('click',()=>picker.close());
}
shade?.addEventListener('click',()=>{
 if(document.body.classList.contains('canvas-library-open'))$('canvasLibraryToggle').click();
 sync();
});
$('canvasLibraryToggle')?.addEventListener('click',()=>queueMicrotask(sync));
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
new MutationObserver(sync).observe($('workspaceTitle'),{childList:true});
window.addEventListener('resize',sync);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.body.classList.contains('canvas-library-open'))$('canvasLibraryToggle').click();
});
const params=new URLSearchParams(location.search);
const requested=params.get('new');
if(requested&&Object.prototype.hasOwnProperty.call(tools,requested)){
 Promise.resolve(bridge.start(requested)).then(ok=>{
  if(ok){
   const url=new URL(location.href);url.searchParams.delete('new');
   history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  sync();
 }).catch(error=>bridge.status('편집기를 열지 못했어요: '+(error.message||error),true));
}
sync();
})();