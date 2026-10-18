(() => {
'use strict';
const C=window.GulliverStudioCore,S=window.GulliverStudioStorage,L=window.GulliverStudioLibraryCore,
 B=window.GulliverStudioBridge,W=window.ClassroomWorkspace,M=window.GulliverMediaCore,O=window.GulliverOfficialProjectCore,U=window.GulliverUnifiedCore,LS=window.LessonStorage,LA=window.GulliverLessonArchive,LC=window.LessonCore,$=id=>document.getElementById(id);
if(!C||!S||!L||!B||!W||!M||!O||!U||!LS||!LA||!LC)throw Error('작업 보관함을 불러오지 못했어요.');
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
function renderOfficial(){
 const root=$('officialProjectList');root.replaceChildren();
 const state=B.getState(),filter=currentFilter();
 const results=state.latestOfficial.filter(p=>{
  if(filter.kind!=='all'&&filter.kind!==p.kind)return false;
  if(filter.folder!=='all'&&(filter.folder==='unfiled'?!!p.folderId:p.folderId!==filter.folder))return false;
  return !filter.query||(p.title+' '+p.name).toLocaleLowerCase('ko').includes(filter.query.trim().toLocaleLowerCase('ko'));
 }).sort((a,b)=>filter.sort==='name'?a.title.localeCompare(b.title,'ko'):filter.sort==='old'?a.updatedAt-b.updatedAt:b.updatedAt-a.updatedAt);
 if(!results.length){root.append(el('div','empty','표시할 고급 작업이 없어요. 공식 편집기에서 저장한 .fcproj 또는 .scraftz 파일을 보관할 수 있어요.'));return}
 for(const p of results){
  const card=el('article','project-item'),info=el('div'),name=el('strong','',p.title);
  const folder=folders.find(f=>f.id===p.folderId)?.name||'미분류';
  info.append(name,el('small','',(p.kind==='video'?'FilmCraft · ':'SoundCraft · ')+Math.ceil(p.size/1024)+'KB · '+folder));
  const actions=el('div','row-actions');
  function action(label,fn){const b=el('button','tiny',label);b.type='button';b.addEventListener('click',()=>Promise.resolve(fn()).catch(e=>B.status(e.message||String(e),true)));actions.append(b)}
  action('열기',()=>B.openOfficial(p.kind,p.id));
  action('폴더 이동',()=>openMove({...p,native:true}));
  action('원본 내려받기',async()=>{const original=await S.getOfficial(p.id);if(!original)throw Error('프로젝트 원본이 없어요.');B.download(original.blob,original.name,original.blob.type)});
  action('이름 수정',async()=>{
   const input=prompt('보관함에 표시할 이름',p.title);if(input===null)return;
   const original=await S.getOfficial(p.id);if(!original)throw Error('프로젝트 원본이 없어요.');
   original.title=C.safeTitle(input);original.updatedAt=Date.now();
   await S.saveOfficial(original);await B.refreshOfficial();
  });
  action('삭제',async()=>{
   if(!confirm('“'+p.title+'” 보관 사본을 삭제할까요? 공식 원본을 내려받았는지 확인해 주세요.'))return;
   await S.deleteOfficial(p.id);await B.refreshOfficial();B.status('고급 작업 보관 사본을 삭제했어요.');
  });
  card.append(info,actions);root.append(card);
 }
}
async function importOfficial(event){
 const files=Array.from(event.target.files||[]);event.target.value='';if(!files.length)return;
 if(working)return B.status('전체 백업·복원 중에는 고급 원본을 추가할 수 없어요.',true);
 working=true;let saved=0;
 try{
  if((await S.official()).length+files.length>O.MAX_ITEMS)throw Error('고급 프로젝트는 이 기기에 30개까지만 보관할 수 있어요.');
  for(const file of files)await O.validateFile(file);
  for(const file of files){
   const kind=O.kindForName(file.name),now=Date.now(),name=O.safeName(file.name,kind);
   await S.saveOfficial({id:uid(),kind,name,title:name.replace(/\.(fcproj|scraftz)$/i,''),size:file.size,
    createdAt:now,updatedAt:now,folderId:'',blob:new Blob([file],{type:O.TYPES[kind].mime})});saved++;
  }
  await B.refreshOfficial();B.status('공식 프로젝트 '+saved+'개를 내 작업에 보관했어요. 원본 파일은 별도로 백업하세요.');
 }catch(e){await B.refreshOfficial();B.status('고급 작업 보관 실패: '+(e.message||e)+(saved?' · '+saved+'개는 보관됐어요.':''),true)}
 finally{working=false}
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
function render(){renderProjects();renderOfficial();renderActivities()}
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
  await B.refreshProjects();await B.refreshOfficial();await refreshFolders();
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
  if(!p.native&&B.getState().activeProject?.id===p.id)await B.sync(true);
  const fresh=p.native?await S.getOfficial(p.id):await S.getProject(p.id);
  if(!fresh)throw Error('이 작업을 찾지 못했어요.');
  fresh.folderId=folderId;fresh.updatedAt=Date.now();
  // Update the in-memory autosave source before the persistent write so a
  // concurrent autosave cannot silently move this project back to old folder.
  if(p.native){await S.saveOfficial(fresh);await B.refreshOfficial()}
  else{B.updateActiveFolder(p.id,folderId);await S.saveProject(C.normalizeProject(fresh));await B.refreshProjects()}
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
 if(!M.mediaAllowed(item.blob))throw Error('지원하지 않는 영상 소재가 있어요. '+(item.name||''));
 const bytes=new Uint8Array(await item.blob.arrayBuffer());
 return 'data:'+item.mime+';base64,'+bytesTo64(bytes);
}
async function uriToMedia(value){
 if(!value||![...M.VIDEO_MIME,...M.AUDIO_MIME].includes(value.mime)||typeof value.data!=='string'||!value.data.startsWith('data:'+value.mime+';base64,'))
  throw Error('영상 소재의 형식이 올바르지 않아요.');
 const base64=value.data.slice(value.data.indexOf(',')+1);
 if(base64.length>Math.ceil(M.VIDEO_MAX*4/3)+12||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))
  throw Error('영상 소재가 너무 크거나 잘못됐어요.');
 const decoded=atob(base64),bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 const blob=new Blob([bytes],{type:value.mime});
 if(!M.mediaAllowed(blob))throw Error('영상·음원 소재 크기가 올바르지 않아요.');
 return blob;
}
async function nativeToUri(value){
 await O.validateFile(new File([value.blob],value.name,{type:value.blob.type}),value.kind);
 const bytes=new Uint8Array(await value.blob.arrayBuffer());
 return 'data:application/octet-stream;base64,'+bytesTo64(bytes);
}
async function uriToNative(entry){
 const raw=O.checkedBundle(entry),encoded=raw.data.slice('data:application/octet-stream;base64,'.length);
 const decoded=atob(encoded),bytes=new Uint8Array(decoded.length);
 for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
 const file=new File([bytes],raw.name,{type:O.TYPES[raw.kind].mime});
 await O.validateFile(file,raw.kind);
 return{kind:raw.kind,name:raw.name,title:raw.title,blob:new Blob([file],{type:file.type}),size:file.size};
}
async function saveArchive(){
 if(working)return;working=true;$('libraryBackup').disabled=true;
 try{
  const state=B.getState();
  if(C.managed(state.activeKind))await B.sync(true);
  const projects=(await S.projects()).map(C.normalizeProject),assets=await S.assets(),storedFolders=await S.folders(),media=await S.media(),official=await S.official();
  if(projects.length>L.MAX_PROJECTS||assets.length>L.MAX_ASSETS||storedFolders.length>L.MAX_FOLDERS||media.length>M.MEDIA_COUNT||official.length>O.MAX_ITEMS)throw Error('백업 가능한 개수를 넘었어요. 폴더별로 정리한 뒤 다시 시도해 주세요.');
  // Refuse oversized backups before base64 allocation.
  const byteTotal=[...assets,...media,...official].reduce((n,x)=>n+(x.blob?.size||0),0);
  const metaBytes=new Blob([JSON.stringify({projects,folders:storedFolders,activities:W.read()})]).size;
  if(Math.ceil(byteTotal*4/3)+metaBytes+1024*128>L.MAX_BUNDLE_BYTES)
   throw Error('고급 원본을 포함하면 120MB 전체 백업 한도를 넘어요. 고급 프로젝트를 개별 내려받아 보관하고 불필요한 사본을 정리해 주세요. 일부 파일을 몰래 제외하지 않아요.');
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
  const native=[];
  for(const project of official)native.push({id:project.id,kind:project.kind,name:project.name,title:project.title,
   createdAt:project.createdAt,updatedAt:project.updatedAt,folderId:project.folderId||'',data:await nativeToUri(project)});
  const activities=W.read();
  const value={format:L.MAGIC,version:L.VERSION,createdAt:new Date().toISOString(),folders:storedFolders,projects,assets:images,media:videoMedia,official:native,activities};
  const json=JSON.stringify(value);
  if(new Blob([json]).size>L.MAX_BUNDLE_BYTES)throw Error('백업 파일이 120MB를 넘었어요. 프로젝트별 JSON도 별도로 내려받아 주세요.');
  const stamp=new Date().toISOString().slice(0,10);
  B.download(json,'뚝딱제작실-전체백업-'+stamp+'.json','application/json');
  B.status('전체 백업을 내려받았어요. '+L.summary(value).projects+'개 프로젝트, '+L.summary(value).assets+'개 사진, 기존 내 활동 '+L.summary(value).activities+'개, 영상 원본 '+L.summary(value).media+'개, 고급 프로젝트 '+L.summary(value).official+'개가 포함돼요.');
 }catch(e){B.status('전체 백업 실패: '+(e.message||e),true)}
 finally{working=false;$('libraryBackup').disabled=false}
}
async function restoreArchive(event){
 const file=event.target.files?.[0];event.target.value='';if(!file||working)return;
 const isZip=/\.zip$/i.test(file.name);
 if(file.size>(isZip?window.GulliverStudioZip.MAX_BYTES:L.MAX_BUNDLE_BYTES)){
  B.status(isZip?'ZIP 전체 백업은 512MB 이하만 복원할 수 있어요.':'구형 JSON 통합 백업은 120MB 이하만 복원할 수 있어요.',true);return
 }
 working=true;
 try{
  const value=isZip?await window.GulliverStudioZipBackup.loadZip(file):L.checkedManifest(JSON.parse(await file.text()));
  const counts=L.summary(value);
  const lessonCount=value.lessons?.length||0;
  if(!confirm('제작실 작업 '+counts.projects+'개, 고급 원본 '+counts.official+'개, 사진 '+counts.assets+'개, 교사 활동 '+counts.activities+'개, 수업 '+lessonCount+'개를 추가할까요? 기존 자료는 삭제되지 않아요.'))return;
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
   const blob=isZip?source.blob:await uriToMedia(source),id=uid();
   if(!M.mediaAllowed(blob))throw Error('백업 영상·음원 파일이 올바르지 않아요.');
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
    if(project.payload.audio){
     if(!mediaIdMap.has(project.payload.audio.mediaId))throw Error('영상 배경음악 원본이 백업에 빠져 있어요.');
     project.payload.audio.mediaId=mediaIdMap.get(project.payload.audio.mediaId);
    }
   }
   if(project.kind==='canvas'){
    project.payload=U.validate(project.payload);
    if(project.payload.audio){
     if(!mediaIdMap.has(project.payload.audio.mediaId))throw Error('통합 캔버스의 배경음악 WAV가 백업에 포함되지 않았어요.');
     project.payload.audio.mediaId=mediaIdMap.get(project.payload.audio.mediaId);
    }
    for(const track of project.payload.tracks||[]){
     if(track.kind==='caption')continue;
     if(!mediaIdMap.has(track.mediaId))throw Error('다중 트랙 원본이 백업에 빠져 있어요.');
     track.mediaId=mediaIdMap.get(track.mediaId);
    }
    for(const page of project.payload.pages){
     if(!page.videoClip)continue;
     if(!mediaIdMap.has(page.videoClip.mediaId))throw Error('통합 캔버스 영상 클립 원본이 백업에 빠져 있어요.');
     page.videoClip.mediaId=mediaIdMap.get(page.videoClip.mediaId);
    }
   }
   if(project.kind==='music')project.payload=M.validateMusic(project.payload);
   newProjects.push({...project,id:uid(),folderId:map.get(project.folderId)||'',updatedAt:Date.now()});
  }
  const newAssets=[];
  for(const a of value.assets){
   const mime=a?.mime;
   const blob=isZip?a.blob:await uriToBlob(a?.data,mime);
   if(!C.recognizeAsset(blob))throw Error('백업 이미지 원본이 올바르지 않아요.');
   newAssets.push({id:uid(),name:C.assetName(a.name),mime,blob,createdAt:Date.now()});
  }
  const newOfficial=[];
  for(const entry of value.official||[]){
   const source=isZip?{kind:entry.kind,name:entry.name,title:entry.title,blob:entry.blob,size:entry.size}:await uriToNative(entry);
   await O.validateFile(new File([source.blob],source.name,{type:source.blob.type}),source.kind);
   if(entry.folderId&&!map.has(entry.folderId))throw Error('공식 프로젝트의 폴더 연결이 손상됐어요.');
   const now=Date.now();newOfficial.push({...source,id:uid(),folderId:map.get(entry.folderId)||'',createdAt:now,updatedAt:now});
  }
  if((await S.official()).length+newOfficial.length>O.MAX_ITEMS)throw Error('고급 프로젝트는 이 기기에 30개까지만 보관할 수 있어요.');
  // Prepare and validate every lesson and binary reference before the first write.
  // LessonStorage has its own IndexedDB, so cross-database atomicity is impossible.
  // Report any partial restore explicitly rather than claiming everything succeeded.
  const validators={canvas:U.validate,slides:window.BalpyoCore.validateDeck,document:window.MunseoCore.validate,design:window.DoanCore.validateProject};
  const lessonRestore=LA.prepare(value.lessons||[],value.lessonAssets||[],uid,source=>LC.normalize(source,validators));
  let studioCommitted=false;
  // All IndexedDB assets, folders, and projects are written in one transaction.
  // On failure it rolls back. Original projects and assets are never overwritten.
  await S.importBatch({projects:newProjects,assets:newAssets,folders:newFolders,media:newMedia,official:newOfficial});
  studioCommitted=true;
  try{
   if(lessonRestore.lessons.length||lessonRestore.assets.length)
    await LS.importBatch(lessonRestore.lessons,lessonRestore.assets);
  }catch(e){
   throw Error('제작실 자료 복원은 끝났지만 수업 저장소 복원에는 실패했어요. 이 파일을 다시 복원하면 제작실 자료는 추가로 복제될 수 있어요. '+(e.message||e));
  }
  // Complete legacy activity restoration before refreshing the unified UI.
  // Partial cross-store states must not be presented as a finished restore.
  let legacyMessage='';
  if(value.activities?.activities?.length){
   try{
    const added=W.importBundle(value.activities);
    legacyMessage=' 기존 내 활동 '+added+'개도 추가했어요.';
   }catch(e){
    legacyMessage=' 단, 기존 내 활동은 저장하지 못했어요: '+(e.message||e);
   }
  }
  await B.refreshProjects();await B.refreshAssets();await B.refreshOfficial();await refreshFolders();
  renderActivities();
  B.status('전체 백업 복원 완료: 프로젝트 '+newProjects.length+'개, 사진 '+newAssets.length+'개, 미디어 원본 '+newMedia.length+'개, 고급 원본 '+newOfficial.length+'개, 수업 '+lessonRestore.lessons.length+'개와 첨부 파일 '+lessonRestore.assets.length+'개를 추가했어요.'+legacyMessage);
 }catch(e){B.status('백업 복원 실패: '+(e.message||e),true)}
 finally{working=false}
}
controls.forEach(id=>$(id).addEventListener(id==='librarySearch'?'input':'change',render));
$('addLibraryFolder').addEventListener('click',createFolder);
$('deleteLibraryFolder').addEventListener('click',deleteFolder);
$('folderForm').addEventListener('submit',completeMove);
$('folderCancel').addEventListener('click',()=>$('folderDialog').close());
$('officialImport').addEventListener('change',importOfficial);
$('libraryBackup').addEventListener('click',saveArchive);
$('libraryRestore').addEventListener('change',restoreArchive);
window.GulliverStudioLibrary={refreshFolders,renderProjects,renderOfficial,moveProject};
refreshFolders();
})();
