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
// Moving between major screens must await the studio's latest IndexedDB
// commit. Native picture/PDF editors and advanced projects warn before exit.
document.addEventListener('click',async event=>{
 const link=event.target.closest('.gulliver-nav a[href],.gx-brand,.shell a[href="index.html"],.shell a[href="내 보관함.html"]');
 if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==='_blank')return;
 event.preventDefault();
 if(link.getAttribute('aria-current')==='page'&&new URL(link.href).pathname===location.pathname){
  $('navHome')?.click();return;
 }
 if(await bridge.navigateAway())location.assign(link.href);
});
const parentHeader=document.querySelector('.center .top');
if(parentHeader){
 const heading=parentHeader.querySelector('.heading');
 const back=document.createElement('button');back.type='button';back.id='canvasParentBack';
 back.textContent='⌂';back.title='제작실 홈';back.setAttribute('aria-label','제작실 홈으로');
 back.addEventListener('click',()=>$('navHome')?.click());
 heading?.prepend(back);
 const switcher=document.createElement('button');switcher.type='button';switcher.id='canvasParentTools';
 switcher.textContent='다른 도구';switcher.setAttribute('aria-label','다른 제작 도구 선택');
 switcher.addEventListener('click',()=>openPicker());
 parentHeader.querySelector('.actions')?.prepend(switcher);
}

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
 if(shade)shade.hidden=!document.body.classList.contains('canvas-library-open');
}
function openPicker(){
 if(document.body.classList.contains('canvas-library-open'))$('canvasLibraryToggle')?.click();
 if(document.body.classList.contains('canvas-transfer-open'))$('canvasTransferToggle')?.click();
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
  alert('그림·PDF 원본은 자동으로 보관되지 않아요. 편집기 안의 저장 기능을 사용해 주세요.');
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
 // Keep bottom navigation interactive even with a side panel displayed.
 if(!$('drawerShade').hidden)$('drawerShade').click();
 if(action!=='projects'&&document.body.classList.contains('canvas-library-open'))$('canvasLibraryToggle').click();
 if(action==='home')$('navHome').click();
 if(action==='tools')openPicker();
 if(action==='edit')editPanel();
 if(action==='projects')showProjects();
 if(action==='new')newWork();
});
if(picker){
 const grid=picker.querySelector('.picker-grid');
 for(const [kind,tool] of Object.entries(tools)){
  if(kind==='canvas')continue;
  const b=document.createElement('button');b.type='button';b.dataset.kind=kind;
  const span=document.createElement('span');span.textContent=tool.icon;span.setAttribute('aria-hidden','true');
  const itemText=document.createElement('span');itemText.textContent=tool.label;
  const description=document.createElement('small');description.textContent='전문 편집 화면';itemText.append(document.createElement('br'),description);
  b.append(span,itemText);
  b.addEventListener('click',async()=>{
   // The existing bridge asks for confirmation before discarding unsaved picture/PDF edits.
   const opened=await bridge.start(kind);
   if(opened)picker.close();
   sync();
  });
  grid.append(b);
 }
 picker.querySelectorAll('[data-canvas-template]').forEach(button=>button.addEventListener('click',async()=>{
  const preset=button.dataset.canvasTemplate;
  if(!['blank','presentation','worksheet'].includes(preset))return;
  const ok=await bridge.start('canvas',null,'',preset);
  if(ok){picker.close();sync()}
 }));
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
const requestedProject=params.get('project');
const requestedOfficial=params.get('official');
const requestedLibrary=params.get('library');
function afterOpen(result){
 if(result)sync();
}
if(requested&&Object.prototype.hasOwnProperty.call(tools,requested)){
 const preset=params.get('template');
 Promise.resolve(bridge.start(requested,null,'',preset)).then(ok=>{
  if(ok){
   const url=new URL(location.href);url.searchParams.delete('new');url.searchParams.delete('template');
   history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  sync();
 }).catch(error=>bridge.status('편집기를 열지 못했어요: '+(error.message||error),true));
}else if(requestedProject){
 Promise.resolve(window.GulliverStudioStorage.getProject(requestedProject)).then(item=>{
  if(!item||!tools[item.kind])throw Error('이 기기의 보관함에서 작업을 찾지 못했어요.');
  return bridge.start(item.kind,item);
 }).then(afterOpen).catch(error=>bridge.status('저장한 자료를 열지 못했어요: '+(error.message||error),true));
}else if(requestedOfficial){
 const separator=requestedOfficial.indexOf(':'),kind=requestedOfficial.slice(0,separator),id=requestedOfficial.slice(separator+1);
 if(separator<1||!['video','music'].includes(kind)||!id)bridge.status('고급 프로젝트 연결이 올바르지 않아요.',true);
 else Promise.resolve(bridge.openOfficial(kind,id)).then(afterOpen).catch(error=>bridge.status('고급 프로젝트를 열지 못했어요: '+(error.message||error),true));
}else if(requestedLibrary==='backup'||requestedLibrary==='assets'){
 layout?.setRight(requestedLibrary==='assets'?'assets':'projects');
 const pane=$(requestedLibrary==='assets'?'inspectorAssets':'inspectorProjects');
 if(window.matchMedia('(max-width: 620px)').matches){
  document.body.classList.add('studio-library-open');
  if(shade){
   shade.hidden=false;
   shade.addEventListener('click',()=>{document.body.classList.remove('studio-library-open');shade.hidden=true},{once:true});
  }
 }
 requestAnimationFrame(()=>{
  if(requestedLibrary==='backup')$('libraryZipBackup')?.scrollIntoView({block:'center'});
  else $('assetList')?.scrollIntoView({block:'nearest'});
  pane?.setAttribute('data-library-request','true');
 });
}
sync();
})();
