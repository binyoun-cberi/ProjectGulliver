(function(root,factory){
'use strict';const result=factory();if(typeof module==='object'&&module.exports)module.exports=result;
root.GulliverStudioTransfer=result;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FROM=Object.freeze({
 canvas:['design','document','pdf','video'],
 design:['slides','document','pdf','video'],
 slides:['design','document','pdf','video'],
 picture:['document','video'],
 music:['video']
});
const DEST_NAMES=Object.freeze({design:'도안 뚝딱',slides:'발표 뚝딱',document:'문서 뚝딱',pdf:'PDF 뚝딱',video:'영상 뚝딱'});
const MAX_IMAGE_BYTES=2000000;
function destinations(kind){return [...(FROM[kind]||[])];}
function eligible(source,target){return destinations(source).includes(target);}
function imageFilename(title,type='png'){
 const base=String(title||'수업자료').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,75)||'수업자료';
 return base+'.'+(type==='jpeg'?'jpg':'png');
}
function validImage(value){
 return !!value&&['image/png','image/jpeg'].includes(value.type)&&Number.isFinite(value.size)&&value.size>0&&value.size<=MAX_IMAGE_BYTES;
}
function safeHandoff(source,target){
 if(!eligible(source,target))throw Error('해당 제작실끼리는 이미지를 전달할 수 없어요.');
 return {source,target};
}
return{FROM,DEST_NAMES,MAX_IMAGE_BYTES,destinations,eligible,imageFilename,validImage,safeHandoff};
});
