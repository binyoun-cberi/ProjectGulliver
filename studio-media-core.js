(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverMediaCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VIDEO_MAX=15*1024*1024,MEDIA_COUNT=18,VIDEO_CLIPS=5,VIDEO_SECONDS=45;
const BEATS=16,TRACKS=['melody','bass','clap','hat'];
const VIDEO_MIME=['video/mp4','video/webm','video/quicktime','image/png','image/jpeg'];
const AUDIO_MIME=['audio/wav','audio/wave','audio/x-wav'];
function makeVideo(){return{title:'우리 반 활동 영상',format:'wide',caption:'우리 반의 즐거운 하루',clips:[],audio:null}}
function makeMusic(){return{title:'우리 반 음악',bpm:110,loops:2,notes:{melody:[0,4,7,12],bass:[0,8],clap:[4,12],hat:[0,2,4,6,8,10,12,14]},melodyPitch:64}}
function validateVideo(raw){
 if(!raw||!Array.isArray(raw.clips)||raw.clips.length>VIDEO_CLIPS)throw Error('영상은 최대 5개 장면까지 사용할 수 있어요.');
 const clips=raw.clips.map(c=>{
  if(!c||typeof c.mediaId!=='string'||!/^[\w-]{1,110}$/.test(c.mediaId)||!VIDEO_MIME.includes(c.mime))throw Error('영상 소재 정보가 올바르지 않아요.');
  const duration=Math.min(20,Math.max(.5,Number(c.duration)||3));
  const start=Math.max(0,Number(c.start)||0);
  return{mediaId:c.mediaId,mime:c.mime,name:String(c.name||'장면').slice(0,75),start,duration};
 });
 if(clips.reduce((n,c)=>n+c.duration,0)>VIDEO_SECONDS)throw Error('영상 길이는 45초 이하로 만들어 주세요.');
 let audio=null;
 if(raw.audio!==undefined&&raw.audio!==null){
  const a=raw.audio;
  if(!a||typeof a.mediaId!=='string'||!/^[\w-]{1,110}$/.test(a.mediaId)||a.mime!=='audio/wav')throw Error('배경음악 정보가 올바르지 않아요.');
  audio={mediaId:a.mediaId,mime:'audio/wav',name:String(a.name||'배경음악').slice(0,90),
   volume:Number.isFinite(a.volume)?Math.max(0,Math.min(1,a.volume)):0.7,loop:a.loop!==false};
 }
 return {title:String(raw.title||'활동 영상').slice(0,90),format:raw.format==='square'?'square':'wide',caption:String(raw.caption||'').slice(0,90),clips,audio};
}
function validateMusic(raw){
 if(!raw||typeof raw!=='object'||!raw.notes||Array.isArray(raw.notes))throw Error('음악 데이터가 올바르지 않아요.');
 const notes={};for(const k of TRACKS){
  if(!Array.isArray(raw.notes[k]))throw Error('악기 구성이 올바르지 않아요.');
  notes[k]=[...new Set(raw.notes[k].filter(n=>Number.isInteger(n)&&n>=0&&n<BEATS))].slice(0,BEATS).sort((a,b)=>a-b);
 }
 const bpm=Math.round(Number(raw.bpm)),loops=Math.round(Number(raw.loops)),pitch=Math.round(Number(raw.melodyPitch));
 return{title:String(raw.title||'우리 반 음악').slice(0,90),bpm:Number.isFinite(bpm)?Math.max(60,Math.min(180,bpm)):110,
 loops:Number.isFinite(loops)?Math.max(1,Math.min(8,loops)):2,notes,melodyPitch:Number.isFinite(pitch)?Math.max(48,Math.min(84,pitch)):64};
}
function fileAllowed(file){return!!file&&VIDEO_MIME.includes(file.type)&&file.size>0&&file.size<=VIDEO_MAX}
function mediaAllowed(file){return!!file&&[...VIDEO_MIME,...AUDIO_MIME].includes(file.type)&&file.size>0&&file.size<=VIDEO_MAX}
function audioAllowed(file){return!!file&&AUDIO_MIME.includes(file.type)&&Number.isFinite(file.size)&&file.size>44&&file.size<=VIDEO_MAX}
function durationOf(project){return validateVideo(project).clips.reduce((n,c)=>n+c.duration,0)}
return{VIDEO_MAX,MEDIA_COUNT,VIDEO_CLIPS,VIDEO_SECONDS,BEATS,TRACKS,VIDEO_MIME,AUDIO_MIME,audioAllowed,mediaAllowed,makeVideo,makeMusic,validateVideo,validateMusic,fileAllowed,durationOf};
});
