(() => {
'use strict';
const C=window.GulliverStudioCore,S=window.GulliverStudioStorage,$=id=>document.getElementById(id);
if(!C||!S)throw Error('제작실 파일을 불러오지 못했어요.');
const frame=$('editorFrame');
let activeKind='',activeProject=null,latestProjects=[],latestAssets=[],live=false,lastSnapshot='',busy=false,token=0,pulse=null,pendingSave=Promise.resolve(),previews=[];
function node(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=String(text);return e;}
function uuid(){return window.crypto?.randomUUID?.()||'studio-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function status(message,error=false){$('message').textContent=message;$('message').className=error?'error':'success';}
function download(value,name,mime){
 const blob=value instanceof Blob?value:new Blob([value],{type:mime});
 const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),25000);
}
const toolItems=Object.entries(C.TOOLS);
function setupMenu(){
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
 $('manualSave').addEventListener('click',async()=>{await sync(true);status('현재 작업을 기기에 저장했어요.');});
 $('renameProject').addEventListener('click',renameCurrent);
 $('exportProject').addEventListener('click',exportCurrent);
 $('importProject').addEventListener('change',importLegacy);
 $('assetUpload').addEventListener('change',uploadAssets);
 frame.addEventListener('load',onFrameLoad);
}
function updateNav(){
 document.querySelectorAll('#toolNav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.kind===activeKind)));
 $('navHome').setAttribute('aria-current',String(!activeKind));
 $('mobileTool').value=activeKind||'';
 const tool=C.TOOLS[activeKind];
 $('workspaceTitle').textContent=tool?tool.label:'뚝딱 제작실';
 $('workspaceSubtitle').textContent=tool?tool.export:'필요한 자료를 골라 만들고 다시 꺼내 보세요.';
 $('studioHome').hidden=!!tool;$('editorArea').hidden=!tool;
 $('newProject').hidden=!tool||!tool.managed;
 $('renameProject').hidden=!tool||!tool.managed;
 $('manualSave').hidden=!tool||!tool.managed;
 $('exportProject').hidden=!tool||!tool.managed;
 $('openOriginal').hidden=!tool;
 if(tool){$('openOriginal').href=tool.href;$('editorFrame').title=tool.label+' 편집기';}
 $('frameHelp').textContent=tool?(tool.managed?'현재 작업은 기기에 자동 저장돼요. 오른쪽에서 다른 작업을 열 수 있어요.':'이 도구의 원본 파일은 자동 저장되지 않아요. 도구 안에서 직접 저장해 주세요.'):'';
}
async function refreshProjects(){
 try{latestProjects=(await S.projects()).map(x=>{try{return C.normalizeProject(x)}catch{return null}}).filter(Boolean)}
 catch(e){latestProjects=[];status('이 기기의 프로젝트 보관 기능을 사용할 수 없어요. 도구 안에서 원본을 내려받아 주세요.',true)}
 renderProjects();
}
function projectCard(p){
 const item=node('article','project-item'+(activeProject?.id===p.id?' active':''));
 const head=node('div');head.append(node('strong','',p.title),node('small','',C.TOOLS[p.kind].name+' · '+new Date(p.updatedAt).toLocaleDateString('ko-KR')));
 const actions=node('div','row-actions');
 const open=node('button','tiny open','열기');open.type='button';open.addEventListener('click',()=>start(p.kind,p));
 const copy=node('button','tiny','복제');copy.type='button';copy.addEventListener('click',async()=>{
  try{
   const clone={...p,id:uuid(),title:C.safeTitle(p.title+' (복사)'),createdAt:Date.now(),updatedAt:Date.now()};
   await S.saveProject(clone);await refreshProjects();status('작업을 복제했어요.');
  }catch(e){status(e.message,true)}
 });
 const del=node('button','tiny','삭제');del.type='button';del.addEventListener('click',async()=>{
  if(!confirm('“'+p.title+'” 작업을 이 기기에서 삭제할까요?'))return;
  try{
   if(activeProject?.id===p.id){await leave(false)}
   await S.deleteProject(p.id);await refreshProjects();status('선택한 작업을 삭제했어요.');
  }catch(e){status(e.message,true)}
 });
 actions.append(open,copy,del);item.append(head,actions);return item;
}
function renderProjects(){
 $('projectList').replaceChildren();
 $('recentProjects').replaceChildren();
 if(!latestProjects.length){
  $('projectList').append(node('div','empty','아직 저장한 작업이 없어요. 도안·발표·문서를 열어 시작해 보세요.'));
  $('recentProjects').append(node('p','note','최근 작업이 없어요. 원하는 제작실을 선택해 보세요.'));
  return;
 }
 latestProjects.slice(0,30).forEach(p=>$('projectList').append(projectCard(p)));
 const recent=node('div','project-list');
 latestProjects.slice(0,3).forEach(p=>recent.append(projectCard(p)));
 $('recentProjects').append(recent);
}
function clearPulse(){clearInterval(pulse);pulse=null;live=false;}
async function sync(force=false){
 if(!activeKind||!C.managed(activeKind)||!live||busy)return;
 const a=frame.contentWindow?.GulliverStudioAdapter;
 if(!a||a.kind!==activeKind)return;
 try{
  const payload=a.capture();
  const json=JSON.stringify(payload);
  if(!force&&json===lastSnapshot)return;
  const size=new Blob([json]).size;
  if(size>C.MAX_PROJECT_BYTES)throw Error('이 프로젝트는 26MB를 넘었어요. 필요 없는 사진을 지우거나 원본을 직접 저장해 주세요.');
  lastSnapshot=json;
  const now=Date.now(),prev=activeProject;
  const next={id:prev?.id||uuid(),kind:activeKind,title:C.safeTitle(payload.title,C.TOOLS[activeKind].name+' 작업'),payload,createdAt:prev?.createdAt||now,updatedAt:now};
  const validated=C.normalizeProject(next);
  activeProject=validated;
  pendingSave=pendingSave.catch(()=>{}).then(()=>S.saveProject(validated));
  await pendingSave;await refreshProjects();
  if(force)status('저장이 완료됐어요.');
 }catch(e){lastSnapshot='';status('기기 내 저장에 실패했어요. '+(e?.message||e)+' 도구 안에서 JSON 원본을 내려받아 주세요.',true)}
}
async function leave(save=true){
 if(C.managed(activeKind)&&save&&live)await sync();
 clearPulse();token++;
 const previous=activeKind;activeKind='';activeProject=null;lastSnapshot='';
 frame.removeAttribute('src');updateNav();renderProjects();return previous;
}
async function home(){
 if(activeKind&& !C.managed(activeKind) && !confirm('그림·PDF 도구는 자동 저장되지 않아요. 편집한 원본을 먼저 저장했나요?'))return;
 await leave();status('제작실 홈으로 돌아왔어요.');
}
async function start(kind,existing=null){
 if(!C.TOOLS[kind])return;
 if(activeKind&& !C.managed(activeKind) && !confirm('그림·PDF 작업은 자동 저장되지 않아요. 작업 결과를 저장하고 이동하시겠어요?'))return;
 await leave();
 activeKind=kind;activeProject=existing?C.normalizeProject(existing):null;busy=true;
 updateNav();renderProjects();
 const path=C.TOOLS[kind].href;
 frame.src=path+'?studio=1';
 status(C.managed(kind)?'작업을 여는 중이에요. 변경 사항은 자동으로 저장돼요.':'편집기를 불러오고 있어요. 파일은 해당 도구 안에서 저장해 주세요.');
}
function onFrameLoad(){
 if(!activeKind)return;
 const expected=activeKind,signature=++token;
 let child;
 try{child=frame.contentWindow;const doc=frame.contentDocument;
  if(!doc||!doc.body)return;
  const style=doc.createElement('style');style.id='gulliver-studio-inset';
  style.textContent='body>header,body>section.hero,body>section.intro,body>footer,body>section.advanced,body>.advanced,body>.topbar,body>.hero{display:none!important}body{margin:0!important;background:#fff!important}body>main,body>.workspace,body>.layout,body>.panels{max-width:none!important;width:100%!important;margin:0!important;padding:14px!important;gap:12px!important}body>.workspace{grid-template-columns:190px minmax(0,1fr) 230px!important}body>.layout{grid-template-columns:1fr!important}body>.panels{grid-template-columns:1fr!important}@media(max-width:1150px){body>.workspace{display:flex!important;flex-direction:column!important}body>.workspace>*{width:100%!important}}';
  doc.head.append(style);
 }catch(e){busy=false;status('편집기 화면에 접근하지 못했어요. 새 창에서 열기를 이용해 주세요.',true);return;}
 if(!C.managed(expected)){busy=false;return;}
 const adapter=child.GulliverStudioAdapter;
 if(!adapter||adapter.kind!==expected){busy=false;status('이 제작실의 자동 저장 연결을 찾을 수 없어요. 개별 원본 저장을 사용해 주세요.',true);return;}
 try{
  if(activeProject?.payload)adapter.apply(activeProject.payload);
  if(signature!==token||expected!==activeKind)return;
  lastSnapshot=activeProject?JSON.stringify(adapter.capture()):'';
  busy=false;live=true;
  clearInterval(pulse);
  pulse=setInterval(()=>{if(expected===activeKind)sync()},1900);
  const debounce=()=>setTimeout(()=>{if(expected===activeKind)sync()},450);
  for(const eventName of ['input','change','pointerup','keyup'])frame.contentDocument.addEventListener(eventName,debounce,{passive:true});
  if(!activeProject)sync(true);
  else status('보관한 작업을 다시 열었어요.');
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
  await sync();
  if(!activeProject)throw Error('먼저 작업을 열어 주세요.');
  const {id,kind,title,payload,createdAt,updatedAt}=activeProject;
  download(JSON.stringify({version:1,id,kind,title,payload,createdAt,updatedAt},null,2),C.safeTitle(title).replace(/[\\/:*?"<>|]/g,'_')+'.gulliver.json','application/json');
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
  await start(kind,{id:uuid(),kind,title,payload,createdAt:now,updatedAt:now});
  status('이전 원본을 불러오는 중이에요. 화면이 열리면 기기에 저장돼요.');
 }catch(err){status('파일을 가져오지 못했어요. '+(err.message||err),true)}
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
 const selector={design:'addPhoto',slides:'slideImage',document:'addImage'}[activeKind];
 if(!selector)return status('사진을 넣으려면 도안·발표·문서 제작실을 먼저 선택해 주세요.',true);
 try{
  const child=frame.contentWindow,input=frame.contentDocument?.getElementById(selector);
  if(!input)throw Error('해당 제작실의 사진 넣기 기능이 준비되지 않았어요.');
  const dt=new child.DataTransfer();
  const file=new child.File([asset.blob],asset.name,{type:asset.mime});
  dt.items.add(file);input.files=dt.files;
  input.dispatchEvent(new child.Event('change',{bubbles:true}));
  status('사진을 편집기에 전달했어요. 작업을 확인해 주세요.');
 }catch(e){status('사진을 바로 전달하지 못했어요. 소재함에서 내려받아 직접 넣어 주세요. '+e.message,true)}
}
setupMenu();
updateNav();refreshProjects();refreshAssets();
})();