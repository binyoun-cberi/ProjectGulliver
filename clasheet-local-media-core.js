(function mediaCore(){
'use strict';
const kinds={image:['image/png','image/jpeg','image/webp','image/gif'],video:['video/mp4','video/webm','video/quicktime'],audio:['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm']};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):a));
const kind=m=>Object.entries(kinds).find(([,types])=>types.includes(String(m||'').toLowerCase()))?.[0]||'';
function validateFile(f){
 const type=kind(f?.type);
 if(!type)throw Error('사진(PNG·JPG·WebP·GIF), 영상(MP4·WebM·MOV), 음악(MP3·WAV·OGG)만 지원해요.');
 if(!Number.isFinite(f.size)||f.size<1||f.size>15*1024*1024)throw Error('파일 하나는 15MB 이하여야 해요.');
 return {name:String(f.name||'미디어').replace(/[\u0000-\u001f]/g,'').slice(0,100),kind:type,mime:f.type,size:f.size};
}
function cleanLayer(v){
 if(!v||!['image','video','text'].includes(v.kind))return null;
 const id=String(v.id||'').slice(0,80),assetId=String(v.assetId||'').slice(0,80);
 if(!id||(v.kind!=='text'&&!assetId))return null;
 const w=clamp(v.w,50,960),h=clamp(v.h,35,540);
 return {id,assetId,kind:v.kind,text:String(v.text||'').slice(0,240),x:clamp(v.x,0,960-w),y:clamp(v.y,0,540-h),w,h,
 trimStart:clamp(v.trimStart,0,3600),trimEnd:clamp(v.trimEnd,0,3600)};
}
const cleanScene=o=>({items:(Array.isArray(o?.items)?o.items:[]).slice(0,50).map(cleanLayer).filter(Boolean)});
const api={kinds,kind,clamp,validateFile,cleanLayer,cleanScene};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.ClasheetLocalMediaCore=Object.freeze(api);
})();
