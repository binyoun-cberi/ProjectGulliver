(()=>{'use strict';let connection;
function open(){if(!connection)connection=new Promise((resolve,reject)=>{const r=indexedDB.open('gulliver-lessons-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('lessons',{keyPath:'id'});r.result.createObjectStore('assets',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('다른 수업 작업실 탭을 닫고 다시 시도해 주세요.'))}).catch(e=>{connection=null;throw e});return connection}
async function act(table,mode,fn){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(table,mode),r=fn(tx.objectStore(table));let value;r.onsuccess=()=>value=r.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||r.error);tx.onabort=()=>reject(tx.error||Error('저장이 중단됐어요.'))})}
async function allAssets(){return act('assets','readonly',store=>store.getAll())}
async function importBatch(lessons,assets){
 if(!Array.isArray(lessons)||!Array.isArray(assets))throw Error('수업 백업 목록이 올바르지 않아요.');
 const ids=new Set(),fileIds=new Set();
 for(const l of lessons){if(!l||typeof l.id!=='string'||!l.id||ids.has(l.id))throw Error('복원할 수업 번호가 중복되거나 올바르지 않아요.');ids.add(l.id)}
 for(const a of assets){if(!a||typeof a.id!=='string'||!a.id||fileIds.has(a.id)||!(a.blob instanceof Blob))throw Error('복원할 수업 원본 파일이 올바르지 않아요.');fileIds.add(a.id)}
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['lessons','assets'],'readwrite');
  try{
   for(const asset of assets)tx.objectStore('assets').add(asset);
   for(const lesson of lessons)tx.objectStore('lessons').add(lesson);
  }catch(e){tx.abort();reject(e);return}
  tx.oncomplete=()=>resolve({lessons:lessons.length,assets:assets.length});
  tx.onerror=()=>reject(tx.error||Error('수업 백업을 저장하지 못했어요.'));
  tx.onabort=()=>reject(tx.error||Error('수업 백업 복원이 중단됐어요. 수업과 파일은 변경되지 않았어요.'));
 });
}
async function bundle(lesson,assets){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(['lessons','assets'],'readwrite');assets.forEach(a=>tx.objectStore('assets').put(a));tx.objectStore('lessons').put(lesson);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
window.LessonStorage={bundle,allAssets,importBatch,list:async()=>{const rows=await act('lessons','readonly',s=>s.getAll());return rows.sort((a,b)=>b.updatedAt-a.updatedAt)},get:id=>act('lessons','readonly',s=>s.get(id)),save:value=>act('lessons','readwrite',s=>s.put(value)),asset:id=>act('assets','readonly',s=>s.get(id)),putAsset:value=>act('assets','readwrite',s=>s.put(value))};})();
