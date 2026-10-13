(function(root,factory){
'use strict';const lib=factory(root);if(typeof module==='object'&&module.exports)module.exports=lib;
root.GulliverStudioStorage=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const DB_NAME='gulliver-studio-v1',DB_VERSION=2;
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
async function folders(){return (await all('folders')).sort((a,b)=>a.name.localeCompare(b.name,'ko'))}
async function removeFolder(id){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['folders','projects'],'readwrite');
  tx.objectStore('folders').delete(id);
  const cursor=tx.objectStore('projects').openCursor();
  cursor.onsuccess=()=>{
   const c=cursor.result;
   if(c){if(c.value.folderId===id){c.value.folderId='';c.update(c.value)}c.continue()}
  };
  cursor.onerror=()=>{try{tx.abort()}catch(e){}};
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('폴더를 삭제하지 못했어요.'));
  tx.onabort=()=>reject(tx.error||Error('폴더 정리가 중단됐어요.'));
 });
}
async function importBatch({projects=[],assets=[],folders=[]}){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['folders','projects','assets'],'readwrite');
  try{
   const f=tx.objectStore('folders'),p=tx.objectStore('projects'),a=tx.objectStore('assets');
   folders.forEach(item=>f.add(item));
   projects.forEach(item=>p.add(item));
   assets.forEach(item=>a.add(item));
  }catch(e){try{tx.abort()}catch{}reject(e);return}
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('복원을 완료하지 못했어요.'));
  tx.onabort=()=>reject(tx.error||Error('복원을 중단했어요. 저장 내용은 변경되지 않았어요.'));
 });
}
return{open,projects,assets,folders,
 getProject:id=>get('projects',id),saveProject:p=>put('projects',p),deleteProject:id=>remove('projects',id),
 saveAsset:a=>put('assets',a),getAsset:id=>get('assets',id),deleteAsset:id=>remove('assets',id),
 saveFolder:f=>put('folders',f),deleteFolder:removeFolder,importBatch};

});
