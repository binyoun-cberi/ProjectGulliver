(() => {
'use strict';
const C=window.GulliverStudioCore,S=window.GulliverStudioStorage,T=window.GulliverStudioTransfer,O=window.GulliverOfficialProjectCore,U=window.GulliverUnifiedCore,$=id=>document.getElementById(id);
if(!C||!S||!T||!O)throw Error('제작실 파일을 불러오지 못했어요.');
const frame=$('editorFrame');
let advancedOfficial=false,openingOfficialId='',latestOfficial=[];
let activeKind='',activeProject=null,latestProjects=[],latestAssets=[],live=false,lastSnapshot='',busy=false,token=0,pulse=null,pendingSave=Promise.resolve(),previews=[],saveInFlight=0,navigationBusy=false,saveFailure=false,pendingTransfer=null,transferBusy=false,pendingPdf=null;
function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=String(text);return e;}
function uuid(){return window.crypto?.randomUUID?.()||'studio-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function status(message,error=false){$('message').textContent=message;$('message').className=error?'error':'success';}
function saveLabel(text,error=false){
 const label=$('saveStatus');if(!label)return;
 label.textContent=text;label.dataset.state=error?'error':'ok';
}
function saveError(e){
 saveFailure=true;
 const message='기기 내 자동 저장에 실패했어요. '+(e?.message||e)+' 원본 JSON을 직접 저장해 주세요.';
 saveLabel('저장 실패 — 원본을 백업하세요',true);status(message,true);
}
function download(value,name,mime){
 const blob=value instanceof Blob?value:new Blob([value],{type:mime});
 const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),25000);
}
const toolItems=Object.entries(C.TOOLS);
function setupMenu(){
 $('canvasLibraryToggle').addEventListener('click',()=>{
  const open=document.body.classList.toggle('canvas-library-open');
  $('canvasLibraryToggle').setAttribute('aria-expanded',String(open));
 });
 $('canvasTransferToggle').addEventListener('click',()=>{
  const open=document.body.classList.toggle('canvas-transfer-open');
  $('canvasTransferToggle').setAttribute('aria-expanded',String(open));
 });
 for(const [kind,tool] of toolItems){
  const b=node('button','',tool.icon+'  '+tool.label);
  b.type='button';b.dataset.kind=kind;b.setAttribute('aria-current','false');
  b.addEventListener('click',()=>start(kind));
  $('toolNav').append(b);
  const opt=node('option','',tool.label);opt.value=kind;$('mobileTool').append(opt);
  const card=node('button','start-card');
  const icon=node('span','start-icon',tool.icon),copy=node('span');
  copy.append(node('strong','',tool.label),node('small','',tool.export));
  card.type='button';card.append(icon,copy);card.addEventListener('click',()=>start(kind));$('startCards').append(card);
 }
 $('mobileTool').addEventListener('change',e=>e.target.value?start(e.target.value):home());
 $('navHome').addEventListener('click',home);
 $('exitEditor').addEventListener('click',home);
 $('newProject').addEventListener('click',()=>start(activeKind));
 $('manualSave').addEventListener('click',async()=>{
  try{await sync(true);}catch(e){/* Error has already been displayed. */}
 });
 $('renameProject').addEventListener('click',renameCurrent);
 $('exportProject').addEventListener('click',exportCurrent);
 $('importProject').addEventListener('change',importLegacy);
 $('assetUpload').addEventListener('change',uploadAssets);
 $('saveImageToShelf').addEventListener('click',()=>shareCurrent(''));
 $('sendToTool').addEventListener('click',()=>shareCurrent($('transferTarget').value));
 $('sendAllSlides').addEventListener('click',shareAllSlides);
 $('docPdfImport').addEventListener('change',importPrintedPdf);
 $('docPdfGuide').addEventListener('click',()=>{
  if(activeKind!=='document')return;
  status('먼저 인쇄 창에서 “PDF로 저장”을 선택해 주세요. 저장한 파일은 왼쪽 PDF 뚝딱에 들어가 “PDF 파일 추가”로 불러올 수 있어요.');
  try{frame.contentDocument?.getElementById('savePdf')?.click()}catch(e){status('문서의 PDF / 인쇄 버튼을 이용해 파일을 저장해 주세요.',true)}
 });
 frame.addEventListener('load',onFrameLoad);
}
function updateOfficialMode(mode){
 advancedOfficial=!!mode;
 updateNav();
 if(advancedOfficial){
  $('frameHelp').textContent='고급 편집기 작업은 별도로 저장·보관한 사본만 내 작업에 남아요. 편집 내용은 자동으로 동기화되지 않습니다.';
  status('고급 작업을 마친 뒤 프로젝트 파일을 내 작업에 보관해 주세요.');
 }
}
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 const data=event.data;
 if(!data||data.kind!==activeKind||!['video','music'].includes(activeKind))return;
 if(data.type==='gulliver:official-saved'){refreshOfficial().catch(()=>{});return}
 if(data.type==='gulliver:official-media')updateOfficialMode(data.advanced);
});
function updateNav(){
 const canvas=activeKind==='canvas';
 document.body.classList.toggle('studio-canvas',canvas);
 if(!canvas){document.body.classList.remove('canvas-library-open','canvas-transfer-open')}
 $('canvasLibraryToggle').hidden=!canvas;
 $('canvasTransferToggle').hidden=!canvas;
 $('canvasLibraryToggle').setAttribute('aria-expanded',String(canvas&&document.body.classList.contains('canvas-library-open')));
 $('canvasTransferToggle').setAttribute('aria-expanded',String(canvas&&document.body.classList.contains('canvas-transfer-open')));
 document.querySelectorAll('#toolNav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.kind===activeKind)));
 $('navHome').setAttribute('aria-current',String(!activeKind));
 $('mobileTool').value=activeKind||'';
 const tool=C.TOOLS[activeKind];
 $('workspaceTitle').textContent=tool?tool.label:'뚝딱 제작실';
 $('workspaceSubtitle').textContent=tool?tool.export:'필요한 자료를 골라 만들고 다시 꺼내 보세요.';
 $('studioHome').hidden=!!tool;$('editorArea').hidden=!tool;
 $('saveStatus').hidden=!tool||!tool.managed||advancedOfficial||!!openingOfficialId;
 const targets=T.destinations(activeKind),canShare=targets.length>0&&!advancedOfficial;
 $('transferBar').hidden=!canShare;
 $('pictureShareLabel').hidden=activeKind!=='picture';
 $('sendAllSlides').hidden=!['slides','canvas'].includes(activeKind)||!canShare;
 $('saveImageToShelf').hidden=activeKind==='music';
 $('sendToTool').textContent=activeKind==='music'?'배경음악 보내기 →':'이미지 보내기 →';
 $('docPdfGuide').hidden=activeKind!=='document';
 $('docPdfImportLabel').hidden=activeKind!=='document';
 const select=$('transferTarget'),prior=select.value;
 select.replaceChildren();
 for(const target of targets){const option=node('option','',T.DEST_NAMES[target]);option.value=target;select.append(option)}
 if(targets.includes(prior))select.value=prior;
 $('sendToTool').disabled=!canShare||transferBusy;
 $('saveImageToShelf').disabled=!canShare||transferBusy;
 $('newProject').hidden=!tool||!tool.managed;
 $('renameProject').hidden=!tool||!tool.managed;
 $('manualSave').hidden=!tool||!tool.managed;
 $('exportProject').hidden=!tool||!tool.managed;
 if(tool&&['video','music'].includes(activeKind)&&(advancedOfficial||openingOfficialId)){
  $('newProject').hidden=true;
  $('renameProject').hidden=true;
  $('manualSave').hidden=true;
  $('exportProject').hidden=true;
 }

 $('openOriginal').hidden=!tool;
 if(tool){$('openOriginal').href=tool.href;$('editorFrame').title=tool.label+' 편집기';}
 $('frameHelp').textContent=(advancedOfficial||openingOfficialId)?'공식 프로젝트를 내 작업에 보관할 수 있어요. 이후 편집 내용은 자동 동기화되지 않아요.':tool?(activeKind==='canvas'?'한 공간에서 글씨·사진·장면 시간을 수정하고 애니메이션과 음악을 재생하세요. 변경사항은 자동 저장돼요.':tool.managed?'왼쪽 템플릿과 오른쪽 속성을 이용해 편집하세요. 변경 내용은 기기에 자동 저장돼요.':'그림·PDF의 원본은 자동 보관되지 않아요. 각 도구 안에서 직접 저장해 주세요.'):'';
 window.GulliverStudioLayout?.toolChanged(activeKind);
}
async function refreshProjects(){
 try{latestProjects=(await S.projects()).map(x=>{try{return C.normalizeProject(x)}catch{return null}}).filter(Boolean)}
 catch(e){latestProjects=[];status('이 기기의 프로젝트 보관 기능을 사용할 수 없어요. 도구 안에서 원본을 내려받아 주세요.',true)}
 renderProjects();
}
async function refreshOfficial(){
 try{latestOfficial=await S.official()}catch(e){latestOfficial=[];status('고급 작업 보관함을 읽지 못했어요: '+(e.message||e),true)}
 window.GulliverStudioLibrary?.renderOfficial();
}
async function openOfficial(kind,id){
 const record=await S.getOfficial(id);
 if(!record||record.kind!==kind||!O.TYPES[kind])throw Error('보관한 공식 프로젝트를 찾을 수 없어요.');
 return start(kind,null,id);
}
function projectCard(p){
 const item=node('article','project-item'+(activeProject?.id===p.id?' active':''));
 const head=node('div');head.append(node('strong','',p.title),node('small','',C.TOOLS[p.kind].name+' · '+new Date(p.updatedAt).toLocaleDateString('ko-KR')));
 const actions=node('div','row-actions');
 const open=node('button','tiny open','열기');open.type='button';open.addEventListener('click',()=>start(p.kind,p));
 const copy=node('button','tiny','복제');copy.type='button';copy.addEventListener('click',async()=>{
  try{
   if(activeProject?.id===p.id)await sync(true);
   const source=activeProject?.id===p.id?activeProject:p;
   const clone={...source,id:uuid(),title:C.safeTitle(source.title+' (복사)'),createdAt:Date.now(),updatedAt:Date.now()};
   await S.saveProject(clone);await refreshProjects();status('작업을 복제했어요.');
  }catch(e){status(e.message,true)}
 });
 const del=node('button','tiny','삭제');del.type='button';del.addEventListener('click',async()=>{
  if(!confirm('“'+p.title+'” 작업을 이 기기에서 삭제할까요?'))return;
  try{
   if(activeProject?.id===p.id)await leave(false);
   await pendingSave;
   await S.deleteProject(p.id);await refreshProjects();status('선택한 작업을 삭제했어요.');
  }catch(e){status(e.message,true)}
 });
 if(U&&['design','slides'].includes(p.kind)){
  const convert=node('button','tiny','통합에서 편집');convert.type='button';
  convert.title='원본을 그대로 두고 선택 가능한 글씨·도형·사진이 있는 통합 프로젝트로 복사';
  convert.addEventListener('click',()=>importIntoCanvas(p));actions.append(convert);
 }
 const folder=node('button','tiny','폴더 이동');folder.type='button';
 folder.addEventListener('click',()=>window.GulliverStudioLibrary?.moveProject(p));
 actions.append(open,copy,folder,del);item.append(head,actions);return item;
}
async function importIntoCanvas(source){
 try{
  if(!U)throw Error('통합 캔버스 엔진이 준비되지 않았어요.');
  if(activeProject?.id===source.id&&live)await sync(true);
  const fresh=await S.getProject(source.id),payload=U.fromLegacy(fresh.kind,fresh.payload);
  const now=Date.now(),converted=C.normalizeProject({id:uuid(),kind:'canvas',title:C.safeTitle(fresh.title+' · 통합'),payload,
   folderId:fresh.folderId||'',createdAt:now,updatedAt:now});
  await S.saveProject(converted);
  await refreshProjects();
  await start('canvas',converted);
  status('기존 '+C.TOOLS[source.kind].name+' 원본은 보관하고, 통합 캔버스에서 요소를 직접 편집할 수 있는 복사본을 만들었어요.');
 }catch(e){status('통합 캔버스로 가져오지 못했어요: '+(e.message||e),true)}
}
function renderProjects(){
 $('projectList').replaceChildren();
 $('recentProjects').replaceChildren();
 if(!latestProjects.length){
  $('projectList').append(node('div','empty','아직 저장한 작업이 없어요. 도안·발표·문서를 열어 시작해 보세요.'));
  $('recentProjects').append(node('p','note','최근 작업이 없어요. 원하는 제작실을 선택해 보세요.'));
  window.GulliverStudioLibrary?.renderProjects();
  return;
 }
 latestProjects.slice(0,30).forEach(p=>$('projectList').append(projectCard(p)));
 window.GulliverStudioLibrary?.renderProjects();
 const recent=node('div','project-list');
 latestProjects.slice(0,3).forEach(p=>recent.append(projectCard(p)));
 $('recentProjects').append(recent);
}
function clearPulse(){clearInterval(pulse);pulse=null;live=false;}
async function sync(force=false){
 if(!activeKind||!C.managed(activeKind)||!live||busy){
  if(force)throw Error('편집기 로딩이 끝나면 다시 저장해 주세요.');
  return false;
 }
 const a=frame.contentWindow?.GulliverStudioAdapter;
 if(!a||a.kind!==activeKind){
  if(force)throw Error('편집기 저장 연결이 준비되지 않았어요.');
  return false;
 }
 let json='',next;
 try{
  const payload=a.capture();
  json=JSON.stringify(payload);
  if(!force&&json===lastSnapshot){await pendingSave;return true;}
  if(new Blob([json]).size>C.MAX_PROJECT_BYTES)throw Error('프로젝트가 26MB를 넘었어요. 사진을 줄이거나 원본을 직접 저장해 주세요.');
  const kind=activeKind,now=Date.now(),prev=activeProject;
  next=C.normalizeProject({id:prev?.id||uuid(),kind,title:C.safeTitle(payload.title,C.TOOLS[kind].name+' 작업'),payload,folderId:prev?.folderId||'',createdAt:prev?.createdAt||now,updatedAt:now});
  activeProject=next;
  saveInFlight++;saveLabel('저장 중…');
  // Serialize every IndexedDB write. This prevents an older snapshot from
  // overwriting a newer change when async events arrive quickly.
  const write=pendingSave.catch(()=>{}).then(()=>S.saveProject(next));
  pendingSave=write;
  await write;
  if(kind===activeKind && activeProject?.id===next.id){
   lastSnapshot=json;saveFailure=false;
   saveLabel('기기에 저장됨 · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}));
   await refreshProjects();
  }
  if(force)status('현재 작업을 기기에 저장했어요.');
  return true;
 }catch(e){
  lastSnapshot='';saveError(e);throw e;
 }finally{if(next)saveInFlight=Math.max(0,saveInFlight-1)}
}
async function leave(save=true){
 // Do not discard a live editor until its latest state was committed.
 if(C.managed(activeKind)&&save&&live)await sync(true);
 await pendingSave;
 clearPulse();token++;
 advancedOfficial=false;openingOfficialId='';activeKind='';activeProject=null;lastSnapshot='';saveFailure=false;
 frame.removeAttribute('src');updateNav();renderProjects();
 return true;
}
async function moveAway(){
 if(navigationBusy)return false;
 if(advancedOfficial&&['video','music'].includes(activeKind)&&
    !confirm('공식 ArtCraft 고급 편집기의 작업은 뚝딱 제작실에 자동 저장되지 않아요. 공식 편집기에서 프로젝트를 별도로 저장하고 이동하시겠어요?'))return false;
 navigationBusy=true;
 try{await leave();return true}
 catch(e){saveError(e);return false}
 finally{navigationBusy=false}
}
async function home(){
 if(activeKind&& !C.managed(activeKind) && !confirm('그림·PDF 도구는 자동 저장되지 않아요. 편집한 원본을 먼저 저장했나요?'))return;
 if(await moveAway())status('제작실 홈으로 돌아왔어요.');
}
async function start(kind,existing=null,officialId=''){
 if(!C.TOOLS[kind])return;
 if(activeKind&& !C.managed(activeKind) && !(activeKind==='picture'&&pendingTransfer?.target===kind) && !confirm('그림·PDF 작업은 자동 저장되지 않아요. 작업 결과를 저장하고 이동하시겠어요?'))return;
 if(!(await moveAway()))return false;
 advancedOfficial=false;openingOfficialId=officialId;
 activeKind=kind;activeProject=existing?C.normalizeProject(existing):null;busy=true;
 saveLabel(C.managed(kind)?'편집기 시작 중…':'도구 내에서 직접 저장');
 updateNav();renderProjects();
 const path=C.TOOLS[kind].href;
 // Saved quick-edit projects must reopen in the editor that created them.
 // A separate official FilmCraft/SoundCraft session is never this saved payload.
 const quickProject=(!!existing&&(kind==='video'||kind==='music'))||(pendingTransfer?.target===kind&&kind==='video');
 frame.src=path+'?studio=1'+(officialId?'&officialId='+encodeURIComponent(officialId):(quickProject?'&editor=simple':''));
 status(C.managed(kind)?'작업을 여는 중이에요. 변경 사항은 자동으로 저장돼요.':'편집기를 불러오고 있어요. 파일은 해당 도구 안에서 저장해 주세요.');
 return true;
}
function onFrameLoad(){
 if(!activeKind)return;
 const expected=activeKind,signature=++token;
 let child;
 try{child=frame.contentWindow;const doc=frame.contentDocument;
  // Ignore about:blank load events from unloading the previous editor.
  if(!doc||!doc.body||!doc.location?.search?.includes('studio=1'))return;
  const style=doc.createElement('style');style.id='gulliver-studio-inset';
  style.textContent='body>header,body>section.hero,body>section.intro,body>footer,body>section.advanced,body>.advanced,body>.topbar,body>.hero{display:none!important}body{margin:0!important;background:#fff!important}body>main,body>.workspace,body>.layout,body>.panels{max-width:none!important;width:100%!important;margin:0!important;padding:14px!important;gap:12px!important}body>.workspace{grid-template-columns:190px minmax(0,1fr) 230px!important}body>.layout{grid-template-columns:1fr!important}body>.panels{grid-template-columns:1fr!important}@media(max-width:1150px){body>.workspace{display:flex!important;flex-direction:column!important}body>.workspace>*{width:100%!important}}';
  if(expected!=='video'&&expected!=='music')doc.head.append(style);
 }catch(e){busy=false;status('편집기 화면에 접근하지 못했어요. 새 창에서 열기를 이용해 주세요.',true);return;}
 if(openingOfficialId&&['video','music'].includes(expected)){
  busy=false;live=false;window.GulliverStudioLayout?.toolChanged(expected);
  return; // Original native project runs inside official WASM; never create a quick-edit autosave.
 }
 if(!C.managed(expected)){
  busy=false;window.GulliverStudioLayout?.toolChanged(expected);
  if(expected==='pdf'){
   if(pendingTransfer?.target===expected)finishTransfer(expected,child.GulliverStudioAdapter).catch(()=>{});
   else if(pendingPdf)finishPrintedPdf(child.GulliverStudioAdapter).catch(()=>{});
  }
  return;
 }
 const adapter=child.GulliverStudioAdapter;
 if(!adapter||adapter.kind!==expected){busy=false;status('이 제작실의 자동 저장 연결을 찾을 수 없어요. 개별 원본 저장을 사용해 주세요.',true);return;}
 try{
  if(activeProject?.payload)adapter.apply(activeProject.payload);
  if(signature!==token||expected!==activeKind)return;
  lastSnapshot='';
  busy=false;live=true;
  window.GulliverStudioLayout?.mount(expected,frame);
  clearInterval(pulse);
  pulse=setInterval(()=>{if(expected===activeKind)sync().catch(()=>{})},1500);
  let debounceTimer=null;
  const debounce=()=>{
   clearTimeout(debounceTimer);
   debounceTimer=setTimeout(()=>{if(expected===activeKind)sync().catch(()=>{})},350);
  };
  for(const eventName of ['input','change','pointerup','keyup'])frame.contentDocument.addEventListener(eventName,debounce,{passive:true});
  // Imported legacy JSON may not exist in IndexedDB yet. Always commit it
  // after its adapter has validated and applied the payload.
  sync(true).then(async()=>{
   if(signature!==token||expected!==activeKind)return;
   if(pendingTransfer?.target===expected)await finishTransfer(expected,adapter);
   else status('작업을 열고 기기에 저장했어요.');
  }).catch(()=>{});
  
 }catch(err){
  busy=false;status('저장한 프로젝트를 열지 못했어요. '+(err.message||err),true);
 }
}
async function renameCurrent(){
 if(!activeKind||!C.managed(activeKind))return;
 const value=prompt('이 작업의 이름을 입력해 주세요.',activeProject?.title||C.TOOLS[activeKind].name+' 작업');
 if(value===null)return;
 try{
  const a=frame.contentWindow?.GulliverStudioAdapter;
  if(!a){status('편집기 로딩이 끝나면 다시 시도해 주세요.',true);return}
  a.rename(C.safeTitle(value));lastSnapshot='';await sync(true);
 }catch(e){status(e.message,true)}
}
async function exportCurrent(){
 try{
  await sync(true);
  if(!activeProject)throw Error('먼저 작업을 열어 주세요.');
  if(activeProject.kind==='video')throw Error('영상 원본 파일은 개별 JSON에 들어가지 않아요. 내 작업의 “전체 백업 저장”을 사용해 주세요.');
  const {id,kind,title,payload,folderId,createdAt,updatedAt}=activeProject;
  download(JSON.stringify({version:1,id,kind,title,payload,folderId,createdAt,updatedAt},null,2),C.safeTitle(title).replace(/[\\/:*?"<>|]/g,'_')+'.gulliver.json','application/json');
  status('통합 작업 원본을 내려받았어요.');
 }catch(e){status(e.message,true)}
}
async function importLegacy(e){
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>C.MAX_PROJECT_BYTES)return status('프로젝트 파일은 최대 26MB까지 가져올 수 있어요.',true);
 try{
  const raw=JSON.parse(await file.text());
  const kind=raw.version===1&&C.managed(raw.kind)&&raw.payload?raw.kind:C.detectLegacy(raw);
  if(!kind||!C.managed(kind))throw Error('도안·발표·문서의 JSON 원본만 가져올 수 있어요.');
  const payload=raw.payload||raw;
  const title=C.safeTitle(raw.title||payload.title||'가져온 작업');
  const now=Date.now();
  if(kind==='video')throw Error('영상의 원본 파일까지 복원하려면 “전체 백업 복원”을 이용해 주세요.');
  await start(kind,{id:uuid(),kind,title,payload,folderId:'',createdAt:now,updatedAt:now});
  if(activeKind===kind)status('원본을 불러오는 중이에요. 열리면 자동 저장돼요.');
 }catch(err){status('파일을 가져오지 못했어요. '+(err.message||err),true)}
}
// Bound images are passed between editors through IndexedDB, not a remote server.
// A failed destination insert leaves the asset in the shelf for manual recovery.
async function normalizeSharedImage(value){
 if(!value||!['image/png','image/jpeg'].includes(value.type)||!Number.isFinite(value.size)||value.size<=0)
  throw Error('사진을 내보내지 못했어요.');
 let blob=new Blob([await value.arrayBuffer()],{type:value.type});
 if(T.validImage(blob))return blob;
 const objectUrl=URL.createObjectURL(blob);
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('큰 이미지를 줄이지 못했어요.'));image.src=objectUrl;});
  for(const [max,q] of [[1100,.84],[850,.77],[680,.7]]){
   const scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('이미지 축소를 지원하지 않는 브라우저예요.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',q));
   if(T.validImage(blob))return blob;
  }
  throw Error('제작물이 너무 커서 공유할 수 없어요. 원본 파일을 저장해 주세요.');
 }finally{URL.revokeObjectURL(objectUrl)}
}
async function createSharedAsset(){
 const kind=activeKind;
 if(!T.destinations(kind).length||!live||busy)throw Error('도안 또는 발표 편집기를 열어 주세요.');
 await sync(true);
 const adapter=frame.contentWindow?.GulliverStudioAdapter;
 if(!adapter?.exportImage)throw Error('현재 제작실에서 이미지를 추출할 수 없어요.');
 const blob=await normalizeSharedImage(await adapter.exportImage());
 const id=uuid(),name=T.imageFilename(activeProject?.title||C.TOOLS[kind].name,blob.type==='image/jpeg'?'jpeg':'png');
 const asset={id,name,mime:blob.type,blob,createdAt:Date.now(),from:kind};
 await S.saveAsset(asset);await refreshAssets();
 return asset;
}
async function pictureAsset(){
 const file=$('pictureShareFile').files?.[0];
 if(!file)throw Error('그림 뚝딱에서 PNG·JPG 파일을 먼저 저장하고 위 버튼으로 선택해 주세요.');
 const blob=await normalizeSharedImage(file);
 const asset={id:uuid(),name:T.imageFilename(file.name.replace(/\.(png|jpe?g)$/i,''),blob.type==='image/jpeg'?'jpeg':'png'),
  mime:blob.type,blob,createdAt:Date.now(),from:'picture'};
 await S.saveAsset(asset);await refreshAssets();
 return asset;
}
async function shareAllSlides(){
 if(transferBusy||!['slides','canvas'].includes(activeKind)||advancedOfficial)return;
 transferBusy=true;
 try{
  await sync(true);
  const adapter=frame.contentWindow?.GulliverStudioAdapter;
  if(!adapter?.exportSlides)throw Error('슬라이드 일괄 내보내기 기능이 없어요.');
  const images=await adapter.exportSlides(),assets=[];
  for(const [i,result] of images.entries()){
   const blob=await normalizeSharedImage(result.blob);
   const asset={id:uuid(),name:(i+1)+'_슬라이드.'+(blob.type==='image/jpeg'?'jpg':'png'),mime:blob.type,blob,createdAt:Date.now(),from:'slides'};
   await S.saveAsset(asset);assets.push(asset);
  }
  await refreshAssets();
  pendingTransfer={target:'video',assets};
  if(!(await start('video')))throw Error('영상 제작실로 이동하지 못했어요.');
  status(assets.length+'개 슬라이드를 영상 장면으로 전달하는 중이에요.');
 }catch(e){pendingTransfer=null;status('슬라이드 전달 실패: '+(e?.message||e),true)}
 finally{transferBusy=false;updateNav()}
}
async function shareCurrent(target){
 if(transferBusy)return;
 transferBusy=true;$('sendToTool').disabled=true;$('saveImageToShelf').disabled=true;
 try{
  const source=activeKind;
  if(target)T.safeHandoff(source,target);
  status('현재 작업을 저장하고 공유할 이미지를 준비하고 있어요.');
  let asset=null,audio=null;
  if(source==='music'){
   if(advancedOfficial)throw Error('SoundCraft 고급 편집에서는 WAV를 별도로 저장한 뒤 영상에서 가져와 주세요.');
   await sync(true);
   const adapter=frame.contentWindow?.GulliverStudioAdapter;
   if(!adapter?.exportAudio)throw Error('간편 음악 제작실이 준비되지 않았어요.');
   const blob=await adapter.exportAudio();
   if(!window.GulliverMediaCore.audioAllowed(blob))throw Error('음악 파일이 15MB를 넘거나 WAV 형식이 아니에요.');
   if((await S.media()).length>=window.GulliverMediaCore.MEDIA_COUNT)throw Error('미디어 보관함이 가득 찼어요.');
   audio={id:uuid(),name:C.safeTitle(activeProject?.title||'배경음악')+'.wav',mime:'audio/wav',blob,createdAt:Date.now()};
   await S.saveMedia(audio);
  }else if(source==='picture')asset=await pictureAsset();
  else asset=await createSharedAsset();
  if(!target){
   if(!asset)throw Error('음악은 영상에 보내거나 WAV로 내려받아 주세요.');
   window.GulliverStudioLayout?.setRight('assets');
   status('현재 작업 이미지를 소재함에 보관했어요. 다른 제작실에서 다시 사용할 수 있어요.');
   return;
  }
  pendingTransfer={target,asset,audio};
  const ok=await start(target);
  if(!ok){pendingTransfer=null;throw Error('다음 제작실로 이동하지 못했어요. 소재함에 이미지를 보관해 뒀어요.');}
  status('새 제작실을 여는 중이에요. 이미지는 자동으로 전달돼요.');
 }catch(e){
  pendingTransfer=null;
  status('제작물 공유 실패: '+(e?.message||e),true);
 }finally{
  transferBusy=false;$('sendToTool').disabled=false;$('saveImageToShelf').disabled=false;
 }
}
async function finishTransfer(expected,adapter){
 if(!pendingTransfer||pendingTransfer.target!==expected)return;
 const transfer=pendingTransfer;pendingTransfer=null;
 try{
  if(!adapter)throw Error('받는 제작실이 준비되지 않았어요.');
  if(expected==='video'&&transfer.audio){
   if(typeof adapter.attachStoredAudio!=='function')throw Error('영상 제작실 배경음악 연결 기능이 없어요.');
   await adapter.attachStoredAudio(transfer.audio);
   await sync(true);
  }else if(expected==='video'&&transfer.assets){
   if(typeof adapter.insertImage!=='function')throw Error('영상 장면 삽입 기능이 없어요.');
   for(const asset of transfer.assets)await adapter.insertImage(new File([asset.blob],asset.name,{type:asset.mime}));
   await sync(true);
  }else if(expected==='pdf'){
   if(typeof adapter.insertImagePdf!=='function')throw Error('PDF 이미지 변환 기능을 불러오지 못했어요.');
   await adapter.insertImagePdf(transfer.asset.blob,transfer.asset.name.replace(/\.(png|jpe?g)$/i,''));
  }else{
   if(!live||typeof adapter.insertImage!=='function')throw Error('사진 삽입 기능이 준비되지 않았어요.');
   const file=new File([transfer.asset.blob],transfer.asset.name,{type:transfer.asset.mime});
   await adapter.insertImage(file);
   await sync(true);
  }
  status((transfer.audio?'배경음악을 ':transfer.assets?'슬라이드 '+transfer.assets.length+'장을 ':'이미지를 ')+T.DEST_NAMES[expected]+'에 전달했어요. 기존 제작물은 그대로 보관돼요.');
 }catch(e){
  status('이미지를 자동으로 넣지 못했어요. 소재함에 보관돼 있으니 다시 넣을 수 있어요: '+(e?.message||e),true);
 }
}
async function importPrintedPdf(event){
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 if(activeKind!=='document'){status('문서 제작실에서 PDF를 저장한 뒤 가져와 주세요.',true);return;}
 if(!(/\.pdf$/i.test(file.name)||file.type==='application/pdf')||file.size<=0||file.size>70*1024*1024){
  status('70MB 이하 PDF 파일을 선택해 주세요.',true);return;
 }
 try{
  await sync(true);
  pendingPdf=file;
  const ok=await start('pdf');
  if(!ok){pendingPdf=null;throw Error('편집기를 열지 못했어요. 저장한 PDF 파일은 그대로 보존돼요.');}
  status('저장한 PDF 파일을 PDF 뚝딱으로 가져오는 중이에요.');
 }catch(e){pendingPdf=null;status('PDF 파일 전달 실패: '+(e?.message||e),true)}
}
async function finishPrintedPdf(adapter){
 const file=pendingPdf;pendingPdf=null;if(!file)return;
 try{
  if(!adapter?.insertPdf)throw Error('PDF 파일을 받는 기능을 불러오지 못했어요.');
  await adapter.insertPdf(file);
  status('한글 문서에서 저장한 PDF를 편집기로 가져왔어요.');
 }catch(e){status('PDF 파일을 불러오지 못했어요. PDF 뚝딱의 파일 추가를 이용해 주세요: '+(e?.message||e),true)}
}
async function uploadAssets(e){
 const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
 let count=0;
 for(const file of files){
  if(!C.recognizeAsset(file)){status('JPG·PNG 이미지 중 파일당 2MB 이하만 보관할 수 있어요.',true);continue}
  try{await S.saveAsset({id:uuid(),name:C.assetName(file.name),mime:file.type,blob:file,createdAt:Date.now()});count++}
  catch(err){status('사진을 보관하지 못했어요. '+err.message,true)}
 }
 await refreshAssets();if(count)status(count+'개 사진을 기기의 소재함에 보관했어요.');
}
function freePreviews(){previews.forEach(u=>URL.revokeObjectURL(u));previews=[]}
async function refreshAssets(){
 try{latestAssets=await S.assets()}catch(e){latestAssets=[];}
 renderAssets();
}
function renderAssets(){
 freePreviews();$('assetList').replaceChildren();
 if(!latestAssets.length){$('assetList').append(node('div','empty','등록한 사진이 없어요. JPG·PNG를 추가하면 여러 제작실에서 다시 사용할 수 있어요.'));return}
 latestAssets.slice(0,80).forEach(asset=>{
  const card=node('div','asset-item');
  const img=node('img');const u=URL.createObjectURL(asset.blob);previews.push(u);img.src=u;img.alt='';
  const text=node('div');text.append(node('strong','',asset.name),node('small','',Math.ceil(asset.blob.size/1024)+'KB'));
  const actions=node('div','asset-buttons');
  const insert=node('button','tiny open','현재 도구에 넣기');insert.type='button';insert.addEventListener('click',()=>insertAsset(asset));
  const save=node('button','tiny','내려받기');save.type='button';save.addEventListener('click',()=>download(asset.blob,asset.name,asset.mime));
  const del=node('button','tiny','삭제');del.type='button';del.addEventListener('click',async()=>{
   if(!confirm('소재함에서 이 이미지를 삭제할까요?'))return;
   try{await S.deleteAsset(asset.id);await refreshAssets()}catch(e){status(e.message,true)}
  });
  actions.append(insert,save,del);card.append(img,text,actions);$('assetList').append(card);
 });
}
async function insertAsset(asset){
 const selector={design:'addPhoto',slides:'slideImage',document:'addImage',video:'clipFiles'}[activeKind];
 if(!selector&&activeKind!=='pdf')return status('사진을 넣으려면 도안·발표·문서·영상·PDF 제작실을 선택해 주세요.',true);
 try{
  const child=frame.contentWindow,input=frame.contentDocument?.getElementById(selector);
  if(!input&&activeKind!=='pdf')throw Error('해당 제작실의 사진 넣기 기능이 준비되지 않았어요.');
  const adapter=child.GulliverStudioAdapter;
  if(activeKind==='pdf'){
   if(!adapter?.insertImagePdf)throw Error('PDF 변환기가 준비되지 않았어요.');
   await adapter.insertImagePdf(asset.blob,asset.name.replace(/\.(png|jpe?g)$/i,''));
   status('소재함 이미지를 PDF로 추가했어요.');
   return;
  }
  if(adapter?.insertImage){
   await adapter.insertImage(new File([asset.blob],asset.name,{type:asset.mime}));
   await sync(true);
   status('사진을 넣고 작업을 기기에 저장했어요.');
   return;
  }
  if(typeof child.DataTransfer!=='function')throw Error('이 브라우저의 파일 전달 기능이 제한돼 있어요.');
  const dt=new child.DataTransfer();
  const file=new child.File([asset.blob],asset.name,{type:asset.mime});
  dt.items.add(file);input.files=dt.files;
  input.dispatchEvent(new child.Event('change',{bubbles:true}));
  status('사진을 편집기에 전달했어요. 작업을 확인해 주세요.');
 }catch(e){status('사진을 바로 전달하지 못했어요. 소재함에서 내려받아 직접 넣어 주세요. '+e.message,true)}
}
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'&&activeKind&&C.managed(activeKind)){
  sync(true).catch(()=>{});
 }
});
window.addEventListener('pagehide',()=>{
 if(activeKind&&C.managed(activeKind))sync(true).catch(()=>{});
 freePreviews();
});
// Browsers cannot guarantee asynchronous database writes during tab close.
// Warn instead of claiming success if a snapshot has not been committed.
window.addEventListener('beforeunload',e=>{
 if(advancedOfficial){e.preventDefault();e.returnValue='';return;}
 if(!activeKind||!C.managed(activeKind)||!live)return;
 try{
  const a=frame.contentWindow?.GulliverStudioAdapter;
  if(saveFailure||saveInFlight>0||(a&&JSON.stringify(a.capture())!==lastSnapshot)){
   e.preventDefault();e.returnValue='';
  }
 }catch(e){}
});
window.GulliverStudioBridge={
 getState:()=>({activeKind,activeProject,latestProjects:[...latestProjects],latestAssets:[...latestAssets],latestOfficial:[...latestOfficial]}),
 sync,refreshProjects,refreshAssets,refreshOfficial,openOfficial,projectCard,download,status,uuid,start,
 updateActiveFolder:(id,folderId)=>{if(activeProject?.id===id)activeProject.folderId=folderId}
};
setupMenu();
updateNav();refreshProjects();refreshAssets();refreshOfficial();
})();
