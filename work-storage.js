/* Canonical work records and compatibility projections share one IDB transaction. */
(()=>{
 'use strict';
 const C=window.GulliverWorkCore,S=window.GulliverStudioStorage,L=window.LessonStorage;
 if(!C||!S)return;
 const writer=crypto.randomUUID?.()||String(Date.now())+Math.random();
 const raw={projects:S.projects,getProject:S.getProject,saveProject:S.saveProject,deleteProject:S.deleteProject};
 const legacy=L?{...L}:null;
 function request(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function get(id){const db=await S.open();return request(db.transaction('works').objectStore('works').get(id))}
 async function list(){const db=await S.open();return (await request(db.transaction('works').objectStore('works').getAll())).sort((a,b)=>b.updatedAt-a.updatedAt)}
 function conflict(existing,expected){if(existing&&expected!==undefined&&existing.revision!==expected&&existing.writer!==writer)throw Error('이 작업이 다른 창에서 변경됐어요. 저장을 멈췄으니 최신 작업을 다시 열어 주세요.');}
 async function write(work,{expected,project,lesson,assets=[],add=false}={}){
  const clean=C.validate(work),db=await S.open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(['works','projects','workAssets'],'readwrite'),store=tx.objectStore('works');let result,failure;
   const r=store.get(clean.id);
   r.onsuccess=()=>{try{
    const old=r.result;conflict(old,expected);if(add&&old)throw Error('같은 번호의 작업이 이미 있어요.');
    result={...clean,revision:(old?.revision||0)+1,writer};store.put(result);
    for(const step of result.steps)if(step.project){const projection=C.projectView(result,step.project.id);tx.objectStore('projects').put(projection)}
    for(const asset of assets){if(!asset?.id||!(asset.blob instanceof Blob))throw Error('작업 원본 파일을 확인해 주세요.');tx.objectStore('workAssets')[add?'add':'put'](asset)}
   }catch(error){failure=error;tx.abort()}};
   tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(failure||tx.error||Error('작업을 저장하지 못했어요.'));tx.onabort=()=>reject(failure||tx.error||Error('작업 저장을 중단했어요. 기존 내용은 유지돼요.'));
  });
 }
 async function ensureProject(project){
  const id='project:'+project.id;let work=await get(project.workId||id);
  if(work&&work.steps.some(s=>s.project?.id===project.id)){const view=C.projectView(work,project.id);if(view.folderId!==(project.folderId||''))return write(C.fromProject({...view,folderId:project.folderId||''},work),{expected:work.revision});return work;}
  return write(C.fromProject(project),{expected:0});
 }
 async function saveProject(project){
  const id=project.workId||'project:'+project.id;let old=await get(id);
  if(old&&!old.steps.some(s=>s.project?.id===project.id))old=null;
  const work=C.fromProject(project,old);const result=await write(work,{expected:project.workRevision});return C.projectView(result,project.id);
 }
 async function loadLesson(id){
  const work=await get(id)||await get('lesson:'+id);if(work)return C.toLesson(work);
  const source=await legacy?.get(id);if(!source)return null;
  const files=[],ids=new Map();for(const id of C.requiredMedia(source)){
   const old=await legacy.asset(id),asset=old||await S.getMedia(id);if(!asset?.blob)throw Error('이 수업에 연결된 원본 파일이 없어요: '+id);if(old){const nextId=await legacyAssetId(id);ids.set(id,nextId);files.push({...asset,id:nextId})}else files.push(asset);
  }
  const saved=await write(C.fromLesson(C.remapMedia(source,ids)),{expected:0,assets:files});return C.toLesson(saved);
 }
 async function saveLesson(lesson,assets=[]){
  const old=await get(lesson.id)||await get('lesson:'+lesson.id),next=C.fromLesson(lesson,old);
  const work=await write(next,{expected:lesson.workRevision,assets});return C.toLesson(work);
 }
 async function asset(id){const db=await S.open();const stored=await request(db.transaction('workAssets').objectStore('workAssets').get(id));return stored||await S.getMedia(id)||await legacy?.asset(id)}
 async function putAsset(value){if(!value?.id||!(value.blob instanceof Blob))throw Error('작업 원본 파일을 확인해 주세요.');const db=await S.open();return new Promise((resolve,reject)=>{const tx=db.transaction('workAssets','readwrite');tx.objectStore('workAssets').put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
 async function legacyAssetId(id){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('gulliver-lessons-v1:'+id));return 'u-legacy-'+Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
 async function allAssets(){for(const old of await legacy?.allAssets()||[]){const id=await legacyAssetId(old.id);const db=await S.open();if(!await request(db.transaction('workAssets').objectStore('workAssets').get(id)))await putAsset({...old,id})}const db=await S.open();return request(db.transaction('workAssets').objectStore('workAssets').getAll());}
 async function lessons(){
  const sources=await legacy?.list()||[];for(const row of sources)if(!await get('lesson:'+row.id)&&!await get(row.id))await loadLesson(row.id);
  const records=await list();return records.filter(w=>C.lessonCompatible(w)&&(w.origin?.kind==='lesson'||w.steps.length>1)).map(C.toLesson);
 }
 S.saveProject=saveProject;
 S.getProject=async id=>{const p=await raw.getProject(id);if(!p)return p;const work=await ensureProject(p);return C.projectView(work,id)};
 S.projects=async()=>{const rows=await raw.projects();const result=[];for(const p of rows){const work=await ensureProject(p);const view=C.projectView(work,p.id);if(view)result.push(view)}return result.sort((a,b)=>b.updatedAt-a.updatedAt)};
 S.deleteProject=async id=>{const p=await raw.getProject(id),work=p?await get(p.workId||'project:'+id):null;if(work&&work.steps.length>1)throw Error('이 자료는 여러 활동이 있는 작업에 연결돼 있어요. 통합 작업에서 먼저 정리해 주세요.');const db=await S.open();return new Promise((resolve,reject)=>{const tx=db.transaction(['works','projects'],'readwrite');tx.objectStore('projects').delete(id);if(work)tx.objectStore('works').delete(work.id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})};
 if(L){L.get=loadLesson;L.save=saveLesson;L.bundle=(lesson,assets)=>saveLesson(lesson,assets);L.asset=asset;L.putAsset=putAsset;L.allAssets=allAssets;L.list=lessons;}
 window.GulliverWorkStorage={get,list,ensureProject,saveProject,loadLesson,saveLesson,asset,putAsset,write};
})();
