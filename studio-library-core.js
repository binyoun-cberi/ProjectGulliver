(function(root,factory){
'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
root.GulliverStudioLibraryCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAGIC='gulliver.studio.bundle',VERSION=1;
const MAX_BUNDLE_BYTES=120*1024*1024;
const MAX_PROJECTS=500,MAX_ASSETS=150,MAX_FOLDERS=100,MAX_OFFICIAL=30;
const orderBy=new Set(['recent','old','name']);
function folderName(value){
 return String(value??'').trim().replace(/[\x00-\x1f]/g,' ').slice(0,45);
}
function filterProjects(projects,{query='',folder='all',kind='all',sort='recent'}={}){
 const needle=String(query).trim().toLocaleLowerCase('ko');
 const arr=projects.filter(p=>{
  if(folder!=='all'&&(folder==='unfiled'?Boolean(p.folderId):p.folderId!==folder))return false;
  if(kind!=='all'&&p.kind!==kind)return false;
  return !needle||(p.title+' '+p.kind).toLocaleLowerCase('ko').includes(needle);
 });
 const mode=orderBy.has(sort)?sort:'recent';
 return arr.sort((a,b)=>mode==='name'?a.title.localeCompare(b.title,'ko'):mode==='old'?a.updatedAt-b.updatedAt:b.updatedAt-a.updatedAt);
}
function checkedManifest(value){
 if(!value||value.format!==MAGIC||value.version!==VERSION)throw Error('뚝딱 제작실의 통합 백업 파일이 아니에요.');
 if(!Array.isArray(value.projects)||!Array.isArray(value.assets)||!Array.isArray(value.folders))throw Error('백업 목록이 손상됐어요.');
 if(value.projects.length>MAX_PROJECTS||value.assets.length>MAX_ASSETS||value.folders.length>MAX_FOLDERS||(value.media&&(!Array.isArray(value.media)||value.media.length>18))||(value.official&&(!Array.isArray(value.official)||value.official.length>MAX_OFFICIAL)))
  throw Error('한 번에 복원할 수 있는 자료 개수를 넘었어요.');
 if(value.activities!==null&&value.activities!==undefined&&(
   value.activities.version!==1||!Array.isArray(value.activities.activities)||!Array.isArray(value.activities.folders)
 ))throw Error('기존 내 활동 백업 형식을 확인해 주세요.');
 if(value.activities?.activities?.length>500||value.activities?.folders?.length>200)
  throw Error('기존 내 활동의 백업 개수가 너무 많아요.');
 return value;
}
function dataUriValid(uri,mime){
 return typeof uri==='string'&&['image/png','image/jpeg'].includes(mime)
  &&uri.startsWith('data:'+mime+';base64,')
  &&/^[A-Za-z0-9+/]*={0,2}$/.test(uri.slice(uri.indexOf(',')+1))
  &&uri.length<=2800000;
}
function summary(bundle){
 return {projects:bundle.projects.length,assets:bundle.assets.length,
  folders:bundle.folders.length,activities:bundle.activities?.activities?.length||0,media:bundle.media?.length||0,official:bundle.official?.length||0};
}
return{MAGIC,VERSION,MAX_BUNDLE_BYTES,MAX_PROJECTS,MAX_ASSETS,MAX_FOLDERS,MAX_OFFICIAL,folderName,filterProjects,checkedManifest,dataUriValid,summary};
});
