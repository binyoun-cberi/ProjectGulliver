(function(root,factory){
'use strict';const lib=factory(root);if(typeof module==='object'&&module.exports)module.exports=lib;
root.GulliverStudioStorage=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const DB_NAME='gulliver-studio-v1',DB_VERSION=4;
const OPFS_THRESHOLD=24*1024*1024,OPFS_DIR='gulliver-studio-native-v24';
let connection=null;
function open(){
 if(!root.indexedDB)return Promise.reject(Error('이 브라우저에서는 기기 내 프로젝트 보관을 사용할 수 없습니다.'));
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
  const req=root.indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'id'});
   if(!db.objectStoreNames.contains('assets'))db.createObjectStore('assets',{keyPath:'id'});
   if(!db.objectStoreNames.contains('folders'))db.createObjectStore('folders',{keyPath:'id'});
   if(!db.objectStoreNames.contains('media'))db.createObjectStore('media',{keyPath:'id'});
   if(!db.objectStoreNames.contains('official'))db.createObjectStore('official',{keyPath:'id'});
  };
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null};resolve(db)};
  req.onerror=()=>reject(req.error||Error('저장소 연결 오류'));
  req.onblocked=()=>reject(Error('기존 제작실 탭을 닫고 다시 시도해 주세요.'));
 }).catch(err=>{connection=null;throw err});
 return connection;
}
async function action(table,mode,apply){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(table,mode),store=tx.objectStore(table);
  let req;try{req=apply(store)}catch(e){reject(e);return}
  let result;
  req.onsuccess=()=>{result=req.result};
  tx.oncomplete=()=>resolve(result);
  tx.onerror=()=>reject(tx.error||req.error||Error('저장에 실패했습니다.'));
  tx.onabort=()=>reject(tx.error||Error('저장이 중단됐습니다.'));
 });
}
async function all(table){return(action(table,'readonly',s=>s.getAll()))}
async function get(table,id){return(action(table,'readonly',s=>s.get(id)))}
async function put(table,item){await action(table,'readwrite',s=>s.put(item));return item}
async function remove(table,id){await action(table,'readwrite',s=>s.delete(id))}
async function projects(){
 const items=await all('projects');return items.sort((a,b)=>b.updatedAt-a.updatedAt);
}
async function assets(){
 const items=await all('assets');return items.sort((a,b)=>b.createdAt-a.createdAt);
}
async function media(){return (await all('media')).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}
async function folders(){return (await all('folders')).sort((a,b)=>a.name.localeCompare(b.name,'ko'))}
async function opfsDirectory(){
 try{
  if(typeof root.navigator?.storage?.getDirectory!=='function')return null;
  const base=await root.navigator.storage.getDirectory();
  return await base.getDirectoryHandle(OPFS_DIR,{create:true});
 }catch(e){return null}
}
async function hydratedNative(raw){
 if(!raw)return raw;
 if(!raw.opfsKey)return raw;
 if(!/^native-[\w-]{3,110}\.bin$/.test(raw.opfsKey))throw Error('고급 프로젝트의 파일 연결이 손상됐어요.');
 const dir=await opfsDirectory();
 if(!dir)throw Error('이 브라우저에서 고급 원본 파일 저장소(OPFS)를 열지 못했어요.');
 try{
  const file=await (await dir.getFileHandle(raw.opfsKey)).getFile();
  if(raw.size!==file.size)throw Error('원본 크기가 저장 기록과 다릅니다.');
  return {...raw,blob:file};
 }catch(e){throw Error('“'+raw.title+'” 고급 원본 파일을 찾지 못했어요. ZIP 백업으로 복원해 주세요. '+(e.message||e))}
}
async function official(){return Promise.all((await all('official')).sort((a,b)=>b.updatedAt-a.updatedAt).map(hydratedNative))}
async function stageNative(record){
 if(!record?.blob||!(record.blob instanceof Blob))throw Error('고급 원본 Blob을 찾지 못했어요.');
 if(record.blob.size<OPFS_THRESHOLD)return {data:{...record,opfsKey:null},key:null,dir:null};
 const dir=await opfsDirectory();
 if(!dir)return {data:{...record,opfsKey:null},key:null,dir:null}; // Safari/private mode: IndexedDB fallback
 const key='native-'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))+'.bin';
 const handle=await dir.getFileHandle(key,{create:true});
 try{
  const writer=await handle.createWritable();
  try{await writer.write(record.blob);await writer.close()}
  catch(e){await writer.abort().catch(()=>{});throw e}
  return{data:{...record,blob:null,opfsKey:key},key,dir};
 }catch(e){await dir.removeEntry(key).catch(()=>{});throw Error('로컬 대용량 파일 저장 실패: '+(e.message||e))}
}
async function cleanupStaged(entries){
 for(const item of entries)if(item.key&&item.dir)await item.dir.removeEntry(item.key).catch(()=>{});
}
async function saveOfficial(record){
 if(!record||!record.id)throw Error('고급 프로젝트 정보가 올바르지 않아요.');
 const old=await get('official',record.id);
 if(old?.opfsKey&&old.opfsKey===record.opfsKey){
  // Renaming and moving folders must not rewrite 66MB native session files.
  await put('official',{...record,blob:null,opfsKey:old.opfsKey});return record;
 }
 const entry=await stageNative(record);
 try{await put('official',entry.data)}
 catch(e){await cleanupStaged([entry]);throw e}
 if(old?.opfsKey&&old.opfsKey!==entry.key){
  const dir=await opfsDirectory();if(dir)await dir.removeEntry(old.opfsKey).catch(()=>{});
 }
 return record;
}
async function deleteOfficial(id){
 const old=await get('official',id);
 await remove('official',id);
 if(old?.opfsKey){const dir=await opfsDirectory();if(dir)await dir.removeEntry(old.opfsKey).catch(()=>{})}
}
async function storageInfo(){
 const nav=root.navigator?.storage;
 let estimate={usage:0,quota:0},persisted=false;
 try{estimate=await nav?.estimate?.()||estimate}catch(e){}
 try{persisted=!!(await nav?.persisted?.())}catch(e){}
 const native=await all('official'),clips=await all('media'),pictures=await all('assets');
 return {
  usage:Number(estimate.usage)||0,quota:Number(estimate.quota)||0,persisted,
  opfs:!!(await opfsDirectory()),
  officialBytes:native.reduce((n,x)=>n+(x.size||x.blob?.size||0),0),
  mediaBytes:clips.reduce((n,x)=>n+(x.blob?.size||0),0),
  assetBytes:pictures.reduce((n,x)=>n+(x.blob?.size||0),0),
  officialCount:native.length
 };
}
async function requestPersistentStorage(){
 try{return !!(await root.navigator?.storage?.persist?.())}catch(e){return false}
}
async function removeFolder(id){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['folders','projects','official'],'readwrite');
  tx.objectStore('folders').delete(id);
  const cursor=tx.objectStore('projects').openCursor();
  cursor.onsuccess=()=>{
   const c=cursor.result;
   if(c){if(c.value.folderId===id){c.value.folderId='';c.update(c.value)}c.continue()}
  };
  cursor.onerror=()=>{try{tx.abort()}catch(e){}};
  const native=tx.objectStore('official').openCursor();
  native.onsuccess=()=>{
   const c=native.result;
   if(c){if(c.value.folderId===id){c.value.folderId='';c.update(c.value)}c.continue()}
  };
  native.onerror=()=>{try{tx.abort()}catch(e){}};
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('폴더를 삭제하지 못했어요.'));
  tx.onabort=()=>reject(tx.error||Error('폴더 정리가 중단됐어요.'));
 });
}
async function importBatch({projects=[],assets=[],folders=[],media:mediaItems=[],official:officialItems=[]}){
 // Stage OPFS files first, then commit every metadata store in ONE IndexedDB
 // transaction. If the commit fails, staged new OPFS files are deleted.
 const staged=[];
 try{for(const row of officialItems)staged.push(await stageNative(row))}
 catch(e){await cleanupStaged(staged);throw e}
 try{
  const db=await open();
  await new Promise((resolve,reject)=>{
  const tx=db.transaction(['folders','projects','assets','media','official'],'readwrite');
  try{
   const f=tx.objectStore('folders'),p=tx.objectStore('projects'),a=tx.objectStore('assets'),m=tx.objectStore('media'),o=tx.objectStore('official');
   folders.forEach(item=>f.add(item));
   projects.forEach(item=>p.add(item));
   assets.forEach(item=>a.add(item));
   mediaItems.forEach(item=>m.add(item));
   staged.forEach(item=>o.add(item.data));
  }catch(e){try{tx.abort()}catch{}reject(e);return}
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('복원을 완료하지 못했어요.'));
  tx.onabort=()=>reject(tx.error||Error('복원을 중단했어요. 저장 내용은 변경되지 않았어요.'));
 });}
 catch(e){await cleanupStaged(staged);throw e}
}
return{open,projects,assets,folders,media,official,storageInfo,requestPersistentStorage,
 getProject:id=>get('projects',id),saveProject:p=>put('projects',p),deleteProject:id=>remove('projects',id),
 saveAsset:a=>put('assets',a),getAsset:id=>get('assets',id),deleteAsset:id=>remove('assets',id),
 saveFolder:f=>put('folders',f),deleteFolder:removeFolder,
 getMedia:id=>get('media',id),saveMedia:x=>put('media',x),deleteMedia:id=>remove('media',id),
 getOfficial:async id=>hydratedNative(await get('official',id)),saveOfficial,deleteOfficial,importBatch};

});
