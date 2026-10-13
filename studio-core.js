(function(root,factory){
'use strict';
const lib=factory();
if(typeof module==='object'&&module.exports)module.exports=lib;
root.GulliverStudioCore=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TOOLS=Object.freeze({
 canvas:{name:'통합',label:'통합 캔버스',icon:'🧩',href:'통합 캔버스.html',export:'글씨·도형·사진·여러 페이지 직접 편집 · PNG·PDF',managed:true},
 picture:{name:'그림',label:'그림 뚝딱',icon:'🎨',href:'그림 뚝딱.html',export:'이미지 편집·내보내기',managed:false},
 pdf:{name:'PDF',label:'PDF 뚝딱',icon:'📄',href:'PDF 뚝딱.html',export:'PDF 합치기·나누기',managed:false},
 design:{name:'도안',label:'도안 뚝딱',icon:'✂️',href:'도안 뚝딱.html',export:'SVG · PNG · PDF',managed:true},
 slides:{name:'발표',label:'발표 뚝딱',icon:'📽️',href:'발표 뚝딱.html',export:'PPTX · PDF',managed:true},
 document:{name:'문서',label:'문서 뚝딱',icon:'📝',href:'문서 뚝딱.html',export:'HWPX · DOCX · PDF',managed:true},
 video:{name:'영상',label:'영상 뚝딱',icon:'🎬',href:'영상 뚝딱.html',export:'장면 편집 · WebM 영상',managed:true},
 music:{name:'음악',label:'음악 뚝딱',icon:'🎵',href:'음악 뚝딱.html',export:'리듬 만들기 · WAV 음악',managed:true}
});
const MAX_PROJECT_BYTES=26*1024*1024,MAX_ASSET_BYTES=2000000;
function types(){return Object.keys(TOOLS);}
function managed(kind){return Boolean(TOOLS[kind]?.managed);}
function safeTitle(value,fallback='이름 없는 작업'){
 const s=String(value??'').trim().replace(/[\x00-\x1f]/g,' ').slice(0,100);
 return s||fallback;
}
function detectLegacy(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 if(raw.format==='gulliver.unified.canvas.v1'&&Array.isArray(raw.pages)&&raw.pages.length<=40)return'canvas';
 if(Array.isArray(raw.objects)&&raw.objects.length<=200)return'design';
 if(Array.isArray(raw.slides)&&raw.slides.length<=40)return'slides';
 if(Array.isArray(raw.blocks)&&raw.blocks.length<=90)return'document';
 if(Array.isArray(raw.clips)&&raw.clips.length<=5)return'video';
 if(raw.notes&&typeof raw.notes==='object'&&!Array.isArray(raw.notes)&&Array.isArray(raw.notes.melody))return'music';
 return null;
}
function normalizeProject(value){
 if(!value||typeof value!=='object'||!managed(value.kind)||typeof value.payload!=='object'||!value.payload||Array.isArray(value.payload))throw Error('지원하지 않는 제작실 프로젝트입니다.');
 if(detectLegacy(value.payload)!==value.kind)throw Error('프로젝트 종류와 문서 형식이 일치하지 않습니다.');
 const date=v=>Number.isFinite(v)&&v>0?v:Date.now();
 return{id:String(value.id||'').slice(0,110),kind:value.kind,title:safeTitle(value.title,TOOLS[value.kind].name+' 작업'),
  payload:value.payload,folderId:typeof value.folderId==='string'?value.folderId.slice(0,110):'',createdAt:date(value.createdAt),updatedAt:date(value.updatedAt)};
}
function recognizeAsset(file){
 return !!file&&['image/png','image/jpeg'].includes(file.type)&&Number.isFinite(file.size)&&file.size>0&&file.size<=MAX_ASSET_BYTES;
}
function assetName(name){return safeTitle(name,'이미지').slice(0,80)}
return{TOOLS,MAX_PROJECT_BYTES,MAX_ASSET_BYTES,types,managed,safeTitle,detectLegacy,normalizeProject,recognizeAsset,assetName};
});
