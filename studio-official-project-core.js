(function(root,factory){
'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverOfficialProjectCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TYPES=Object.freeze({
 video:{app:'FilmCraft',extension:'.fcproj',mime:'application/json'},
 music:{app:'SoundCraft',extension:'.scraftz',mime:'application/zip'}
});
const MAX_FILE_BYTES=95*1024*1024,MAX_ITEMS=30;
function kindForName(name){
 const n=String(name||'').toLowerCase();
 return Object.keys(TYPES).find(k=>n.endsWith(TYPES[k].extension))||null;
}
function safeName(name,kind){
 const c=TYPES[kind];if(!c)throw Error('지원하지 않는 고급 제작실이에요.');
 const n=String(name||'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,110);
 if(!n.toLowerCase().endsWith(c.extension))throw Error('공식 프로젝트는 '+c.extension+' 파일만 보관할 수 있어요.');
 return n;
}
function signature(kind,bytes){
 if(kind==='music')return bytes.length>=4&&bytes[0]===80&&bytes[1]===75&&[3,5,7].includes(bytes[2])&&[4,6,8].includes(bytes[3]);
 if(kind==='video'){
  if(bytes.length<2)return false;
  const n=Array.from(bytes).find(b=>![9,10,13,32,239,187,191].includes(b));
  return n===123; // FilmCraft's official .fcproj serialization is JSON.
 }
 return false;
}
async function validateFile(file,kind=kindForName(file?.name)){
 if(!TYPES[kind])throw Error('FilmCraft(.fcproj) 또는 SoundCraft(.scraftz) 파일만 지원해요.');
 safeName(file?.name,kind);
 if(!file||!Number.isFinite(file.size)||file.size<=4||file.size>MAX_FILE_BYTES)
  throw Error('프로젝트는 95MB 이하의 정상적인 원본 파일이어야 해요.');
 const bytes=new Uint8Array(await file.slice(0,96).arrayBuffer());
 if(!signature(kind,bytes))throw Error('파일 내용이 공식 '+TYPES[kind].extension+' 형식과 일치하지 않아요.');
 return kind;
}
function checkedMeta(value){
 if(!value||!TYPES[value.kind])throw Error('고급 프로젝트 종류가 올바르지 않아요.');
 const name=safeName(value.name,value.kind);
 if(typeof value.id!=='string'||value.id.length<1||value.id.length>110||!/^[-\\w]+$/.test(value.id))
  throw Error('고급 프로젝트 ID가 올바르지 않아요.');
 if(!Number.isFinite(value.size)||value.size<5||value.size>MAX_FILE_BYTES)throw Error('고급 프로젝트 용량이 올바르지 않아요.');
 return {id:value.id,kind:value.kind,name,title:String(value.title||name.replace(/\\.(fcproj|scraftz)$/i,'')).slice(0,100),
  size:value.size,updatedAt:Number.isFinite(value.updatedAt)?value.updatedAt:Date.now()};
}
function checkedBundle(value){
 if(!value||!TYPES[value.kind])throw Error('고급 작업 종류가 올바르지 않아요.');
 const name=safeName(value.name,value.kind);
 if(typeof value.data!=='string'||!value.data.startsWith('data:application/octet-stream;base64,'))
  throw Error('고급 작업의 백업 인코딩이 올바르지 않아요.');
 const encoded=value.data.slice('data:application/octet-stream;base64,'.length);
 if(encoded.length>Math.ceil(MAX_FILE_BYTES/3)*4+8||encoded.length<8||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))
  throw Error('고급 작업 백업 내용이 손상됐거나 너무 커요.');
 return{kind:value.kind,name,title:String(value.title||name).slice(0,100),data:value.data};
}
return {TYPES,MAX_FILE_BYTES,MAX_ITEMS,kindForName,safeName,signature,validateFile,checkedMeta,checkedBundle};
});
