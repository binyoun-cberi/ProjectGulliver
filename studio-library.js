(() => {
'use strict';
const C=window.GulliverStudioCore,S=window.GulliverStudioStorage,L=window.GulliverStudioLibraryCore,
 B=window.GulliverStudioBridge,W=window.ClassroomWorkspace,M=window.GulliverMediaCore,$=id=>document.getElementById(id);
if(!C||!S||!L||!B||!W||!M)throw Error('작업 보관함을 불러오지 못했어요.');
let folders=[],moving=null,working=false;
const uid=()=>window.crypto?.randomUUID?.()||'lib_'+Date.now().toString(36)+Math.random().toString(36).slice(2);
const el=(tag,cls,body)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(body!==undefined)n.textContent=String(body);return n};
const controls=['librarySearch','libraryFolder','libraryKind','librarySort'];
function currentFilter(){
 return{query:$('librarySearch').value,folder:$('libraryFolder').value,kind:$('libraryKind').value,sort:$('librarySort').value};
}
function renderProjects(){
 const projects=L.filterProjects(B.getState().latestProjects,currentFilter());
 const root=$('projectList');root.replaceChildren();
 const total=B.getState().latestProjects.length;
 $('libraryCount').textContent=projects.length+'개 표시 · 전체 '+total+'개 작업';
 if(!projects.length){root.append(el('div','empty',total?'검색·폴더 조건에 맞는 작업이 없어요.':'저장된 도안·발표·문서가 아직 없어요.'));return}
 for(const p of projects.slice(0,500)){
  const card=B.projectCard(p),label=folders.find(f=>f.id===p.folderId)?.name||'미분류';
  card.querySelector('small')?.append(' · '+label);
  root.append(card);
 }
}
function renderActivities(){
 const root=$('legacyActivityList');root.replaceChildren();
 const needle=$('librarySearch').value.trim().toLocaleLowerCase('ko');
 let activities=[];
 try{activities=W.list().filter(a=>!needle||a.title.toLocaleLowerCase('ko').includes(needle)).slice(0,100)}catch(e){}
 if(!activities.length){
  root.append(el('div','empty','표시할 기존 내 활동이 없어요. 이전 활동은 뚝딱교실 홈에서도 관리할 수 있어요.'));
  return;
 }
 for(const a of activities){
  const card=el('div','legacy-item'),link=el('a','',a.title);
  const href=W.openUrl(a);
  link.href=href;link.target='_blank';link.rel='noopener noreferrer';
  link.title='활동을 새 창에서 열기';
  card.append(link,el('small','',W.kinds[a.kind]?.name||'기존 활동'));
  root.append(card);
 }
}
function render(){renderProjects();renderActivities()}
async function refreshFolders(){
 try{folders=await S.folders()}catch(e){folders=[];B.status('폴더를 불러오지 못했어요: '+(e.message||e),true)}
 const choice=$('libraryFolder'),old=choice.value;
 choice.replaceChildren();
 for(const [value,label] of [['all','전체 폴더'],['unfiled','미분류']]){
  const n=el('option','',label);n.value=value;choice.append(n);
 }
 for(const f of folders){
  const option=el('option','',f.name);option.value=f.id;choice.append(option);
 }
 choice.value=[...choice.options].some(o=>o.value===old)?old:'all';
 render();
}
function openMove(p){
 moving=p;
 const select=$('folderMoveSelect');select.replaceChildren();
 const base=el('option','','미분류');base.value='';select.append(base);
 for(const f of folders){
  const o=el('option','',f.name);o.value=f.id;select.append(o);
 }
 select.value=p.folderId||'';
 $('folderDialogTitle').textContent='“'+p.title+'” 폴더 이동';
 $('folderDialog').showModal();
}
async function createFolder(){
 const name=L.folderName(prompt('새 폴더 이름을 적어 주세요.','수업 자료'));
 if(!name)return;
 if(folders.some(f=>f.name===name)){B.status('같은 이름의 폴더가 이미 있어요.',true);return}
 try{
  await S.saveFolder({id:uid(),name,createdAt:Date.now()});
  await refreshFolders();B.status('“'+name+'” 폴더를 만들었어요.');
 }catch(e){B.status('폴더 생성 실패: '+e.message,true)}
}
async function deleteFolder(){
 const selected=$('libraryFolder').value,folder=folders.find(f=>f.id===selected);
 if(!folder){B.status('삭제할 폴더를 선택해 주세요. 미분류·전체 폴더는 삭제할 수 없어요.',true);return}
 if(!confirm('“'+folder.name+'” 폴더를 지울까요? 작업은 삭제되지 않고 미분류로 옮겨져요.'))return;
 try{
  if(C.managed(B.getState().activeKind))await B.sync(true);
  await S.deleteFolder(folder.id);
  B.getState().latestProjects.filter(p=>p.folderId===folder.id).forEach(p=>B.updateActiveFolder(p.id,''));
  await B.refreshProjects();await refreshFolders();
  B.status('폴더만 삭제했어요. 작업은 미분류에 남아 있어요.');
 }catch(e){B.status('폴더 삭제 실패: '+e.message,true)}
}
async function moveProject(p){
 openMove(p);
}
async function completeMove(e){
 e.preventDefault();const p=moving;moving=null;$('folderDialog').close();if(!p)return;
 const folderId=$('folderMoveSelect').value;
 if(folderId&&!folders.some(f=>f.id===folderId))return B.status('폴더를 다시 선택해 주세요.',true);
 try{
  if(B.getState().activeProject?.id===p.id)await B.sync(true);
  const fresh=await S.getProject(p.id);
  if(!fresh)throw Error('이 작업을 찾지 못했어요.');
  fresh.folderId=folderId;fresh.updatedAt=Date.now();
  // Update the in-memory autosave source before the persistent write so a
  // concurrent autosave cannot silently move this project back to old folder.
  B.updateActiveFolder(p.id,folderId);
  await S.saveProject(C.normalizeProject(fresh));
  await B.refreshProjects();
  B.status('작업을 선택한 폴더로 옮겼어요.');
 }catch(e){B.status('폴더 이동 실패: '+e.message,true)}
}
function bytesTo64(bytes){
 let out='';
 for(let i=0;i<bytes.length;i+=0x6000)
  out+=String.fromCharCode(...bytes.subarray(i,i+0x6000));
 return btoa(out);
}
async function blobToUri(blob){
 if(!C.recognizeAsset(blob))throw Error('소재함에 지원하지 않는 이미지가 있어요. 해당 사진을 확인해 주세요.');
 const bytes=new Uint8Array(await blob.arrayBuffer());
 return 'data:'+blob.type+';base64,'+bytesTo64(bytes);
}
async function uriToBlob(uri,mime){
 if(!L.dataUriValid(uri,mime))throw Error('백업 파일에 잘못된 사진 데이터가 있어요.');
 const encoded=uri.slice(uri.indexOf(',')+1);
 const decoded=atob(encoded),bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 const blob=new Blob([bytes],{type:mime});
 if(!C.recognizeAsset(blob))throw Error('사진 크기 또는 형식이 올바르지 않아요.');
 return blob;
}
async function mediaBlobToUri(item){
 if(!M.fileAllowed(item.blob))throw Error('지원하지 않는 영상 소재가 있어요. '+(item.name||''));
 const bytes=new Uint8Array(await item.blob.arrayBuffer());
 return 'data:'+item.mime+';base64,'+bytesTo64(bytes);
}
async function uriToMedia(value){
 if(!value||!M.VIDEO_MIME.includes(value.mime)||typeof value.data!=='string'||!value.data.startsWith('data:'+value.mime+';base64,'))
  throw Error('영상 소재의 형식이 올바르지 않아요.');
 const base64=value.data.slice(value.data.indexOf(',')+1);
 if(base64.length>Math.ceil(M.VIDEO_MAX*4/3)+12||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
  throw Error('영상 소재가 너무 크거나 잘못됐어요.');
 const decoded=atob(base64),bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 const blob=new Blob([bytes],{type:value.mime});
 if(!M.fileAllowed(blob))throw Error('영상 소재 크기가 올바르지 않아요.');
 return blob;
}
async function saveArchive(){
 if(working)return;working=true;$('libraryBackup').disabled=true;
 try{
  const state=B.getState();
  if(C.managed(state.activeKind))await B.sync(true);
  const projects=(await S.projects()).map(C.normalizeProject),assets=await S.assets(),storedFolders=await S.folders(),media=await S.media();
  if(projects.length>L.MAX_PROJECTS||assets.length>L.MAX_ASSETS||storedFolders.length>L.MAX_FOLDERS||media.length>M.MEDIA_COUNT)throw Error('백업 가능한 개수를 넘었어요. 폴더별로 정리한 뒤 다시 시도해 주세요.');
  const images=[];
  for(const asset of assets){
   images.push({name:C.assetName(asset.name),mime:asset.mime,createdAt:asset.createdAt||Date.now(),data:await blobToUri(asset.blob)});
  }
  // All local video source clips are included. Their binary data is never
  // silently omitted from a user-facing complete backup.
  if(media.reduce((n,item)=>n+(item.blob?.size||0),0)>86*1024*1024)
   throw Error('영상 원본 용량이 커서 JSON 전체 백업 한도를 넘었어요. 영상 파일은 따로 보관해 주세요.');
  const videoMedia=[];
  for(const item of media){
   videoMedia.push({id:item.id,name:String(item.name||'영상').slice(0,90),mime:item.mime,
    createdAt:item.createdAt||Date.now(),data:await mediaBlobToUri(item)});
  }
  // Read only. No destructive migration of legacy classroom activities.
  const activities=W.read();
  const value={format:L.MAGIC,version:L.VERSION,createdAt:new Date().toISOString(),folders:storedFolders,projects,assets:images,media:videoMedia,activities};
  const json=JSON.stringify(value);
  if(new Blob([json]).size>L.MAX_BUNDLE_BYTES)throw Error('백업 파일이 120MB를 넘었어요. 프로젝트별 JSON도 별도로 내려받아 주세요.');
  const stamp=new Date().toISOString().slice(0,10);
  B.download(json,'뚝딱제작실-전체백업-'+stamp+'.json','application/json');
  B.status('전체 백업을 내려받았어요. '+L.summary(value).projects+'개 프로젝트, '+L.summary(value).assets+'개 사진, 기존 내 활동 '+L.summary(value).activities+'개, 영상 원본 '+L.summary(value).media+'개가 포함돼요.');
 }catch(e){B.status('전체 백업 실패: '+(e.message||e),true)}
 finally{working=false;$('libraryBackup').disabled=false}
}
async function restoreArchive(event){
 const file=event.target.files?.[0];event.target.value='';if(!file||working)return;
 if(file.size>L.MAX_BUNDLE_BYTES){B.status('통합 백업은 120MB 이하만 복원할 수 있어요.',true);return}
 working=true;
 try{
  const value=L.checkedManifest(JSON.parse(await file.text()));
  const counts=L.summary(value);
  if(!confirm('프로젝트 '+counts.projects+'개, 사진 '+counts.assets+'개, 폴더 '+counts.folders+'개, 기존 내 활동 '+counts.activities+'개를 현재 기기에 추가할까요? 기존 자료는 삭제되지 않아요.'))return;
  const existingFolders=await S.folders(),nameToId=new Map(existingFolders.map(f=>[f.name,f.id]));
  const map=new Map(),newFolders=[];
  for(const item of value.folders){
   const name=L.folderName(item?.name);
   if(!name||typeof item.id!=='string'||map.has(item.id))throw Error('백업 폴더 정보가 손상됐어요.');
   let id=nameToId.get(name);
   if(!id){id=uid();nameToId.set(name,id);newFolders.push({id,name,createdAt:Date.now()})}
   map.set(item.id,id);
  }
  const mediaIdMap=new Map(),newMedia=[];
  for(const source of value.media||[]){
   if(typeof source.id!=='string'||!source.id||mediaIdMap.has(source.id))throw Error('영상 파일 식별자가 올바르지 않아요.');
   const blob=await uriToMedia(source),id=uid();
   mediaIdMap.set(source.id,id);
   newMedia.push({id,name:String(source.name||'영상').slice(0,90),mime:source.mime,blob,createdAt:Date.now()});
  }
  const newProjects=[];
  for(const entry of value.projects){
   const project=C.normalizeProject(entry);
   const payloadSize=new Blob([JSON.stringify(project.payload)]).size;
   if(payloadSize>C.MAX_PROJECT_BYTES)throw Error('프로젝트 하나가 26MB를 넘었어요.');
   if(project.folderId&&!map.has(project.folderId))throw Error('프로젝트의 폴더 연결이 손상됐어요.');
   if(project.kind==='video'){
    project.payload=M.validateVideo(project.payload);
    for(const clip of project.payload.clips){
     if(!mediaIdMap.has(clip.mediaId))throw Error('영상 프로젝트의 원본 파일이 백업에 빠져 있어요.');
     clip.mediaId=mediaIdMap.get(clip.mediaId);
    }
   }
   if(project.kind==='music')project.payload=M.validateMusic(project.payload);
   newProjects.push({...project,id:uid(),folderId:map.get(project.folderId)||'',updatedAt:Date.now()});
  }
  const newAssets=[];
  for(const a of value.assets){
   const mime=a?.mime;
   const blob=await uriToBlob(a?.data,mime);
   newAssets.push({id:uid(),name:C.assetName(a.name),mime,blob,createdAt:Date.now()});
  }
  // All IndexedDB assets, folders, and projects are written in one transaction.
  // On failure it rolls back. Original projects and assets are never overwritten.
  await S.importBatch({projects:newProjects,assets:newAssets,folders:newFolders,media:newMedia});
  await B.refreshProjects();await B.refreshAssets();await refreshFolders();
  let legacyMessage='';
  if(value.activities?.activities?.length){
   try{
    const added=W.importBundle(value.activities);
    legacyMessage=' 기존 내 활동 '+added+'개도 추가했어요.';
   }catch(e){
    legacyMessage=' 단, 기존 내 활동은 저장하지 못했어요: '+(e.message||e);
   }
  }
  renderActivities();
  B.status('통합 백업 복원 완료: 프로젝트 '+newProjects.length+'개, 사진 '+newAssets.length+'개, 영상 원본 '+newMedia.length+'개를 추가했어요.'+legacyMessage);
 }catch(e){B.status('백업 복원 실패: '+(e.message||e),true)}
 finally{working=false}
}
controls.forEach(id=>$(id).addEventListener(id==='librarySearch'?'input':'change',render));
$('addLibraryFolder').addEventListener('click',createFolder);
$('deleteLibraryFolder').addEventListener('click',deleteFolder);
$('folderForm').addEventListener('submit',completeMove);
$('folderCancel').addEventListener('click',()=>$('folderDialog').close());
$('libraryBackup').addEventListener('click',saveArchive);
$('libraryRestore').addEventListener('change',restoreArchive);
window.GulliverStudioLibrary={refreshFolders,renderProjects,moveProject};
refreshFolders();
})();
