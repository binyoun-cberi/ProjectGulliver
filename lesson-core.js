(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LessonCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TYPES=['canvas','slides','document','design','video','audio','pdf','timer','quiz'];
const QUIZ_MAX=60;
const MAX_STEPS=60,MAX_FILE=100*1024*1024;
function id(){return globalThis.crypto?.randomUUID?.()||'lesson-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}
const text=(s,n=200)=>String(s??'').slice(0,n);
const number=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function step(kind,payload=null){if(!TYPES.includes(kind))throw Error('지원하지 않는 자료예요.');return{id:id(),kind,title:({canvas:'통합 캔버스',slides:'발표 자료',document:'문서',design:'도안',video:'영상',audio:'음악',pdf:'PDF',timer:'활동 시간',quiz:'낱말카드 퀴즈'})[kind],payload,assetId:'',start:0,end:0,volume:1,loop:false,background:false,seconds:300,notes:''}}
function blank(){return{version:1,id:id(),title:'새 수업',goal:'',audience:'',steps:[],createdAt:Date.now(),updatedAt:Date.now(),position:0}}
function normalizeCards(raw){
 if(!Array.isArray(raw)||raw.length>QUIZ_MAX)throw Error('퀴즈 카드는 최대 60개까지 넣을 수 있어요.');
 return raw.map(item=>{
  if(!item||typeof item!=='object')throw Error('퀴즈 카드 내용을 확인해 주세요.');
  const front=text(item.front||item.question,350).trim(),back=text(item.back||item.answer,350).trim();
  if(!front||!back)throw Error('퀴즈 문제와 정답을 모두 입력해 주세요.');
  return{front,back};
 });
}
function parseCards(raw){
 const lines=String(raw??'').split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean);
 if(lines.length>QUIZ_MAX)throw Error('퀴즈 카드는 최대 60개까지 만들 수 있어요.');
 return normalizeCards(lines.map(line=>{
  const mark=line.indexOf('|');
  if(mark<0)throw Error('문제와 정답은 | 로 나눠 주세요.');
  return{front:line.slice(0,mark),back:line.slice(mark+1)};
 }));
}
function timerFromEvents(raw){
 if(!Array.isArray(raw)||!raw.length)throw Error('저장한 수업 타이머에 활동 시간이 없어요.');
 if(raw.length>MAX_STEPS)throw Error('타이머의 활동 단계가 너무 많아요.');
 return raw.map(event=>{
  const sec=Math.round(Number(event?.durationSec));
  if(!Number.isFinite(sec)||sec<1||sec>7200)throw Error('타이머의 활동 시간은 1초~120분으로 설정해 주세요.');
  const next=step('timer');
  next.title=text(event.name,120).trim()||'활동 시간';
  next.notes=text(event.note,2000);
  next.seconds=sec;
  return next;
 });
}
function readyCount(steps){
 return (steps||[]).filter(s=>s.kind==='timer'||s.kind==='quiz'&&s.payload?.cards?.length||
 ['canvas','slides','document','design'].includes(s.kind)&&s.payload||
 ['video','audio','pdf'].includes(s.kind)&&s.assetId).length;
}
function normalize(raw,validators={}){
 if(!raw||raw.version!==1||!Array.isArray(raw.steps)||raw.steps.length>MAX_STEPS)throw Error('올바른 수업 원본이 아니에요. 최대 60개 활동을 넣을 수 있어요.');
 const ids=new Set();const steps=raw.steps.map(s=>{
  if(!s||!TYPES.includes(s.kind))throw Error('지원하지 않는 수업 자료가 있어요.');
  const copy=step(s.kind);copy.id=text(s.id,110)||id();if(ids.has(copy.id))throw Error('활동 번호가 중복돼요.');ids.add(copy.id);
  copy.title=text(s.title,120)||copy.title;copy.notes=text(s.notes,2000);copy.assetId=text(s.assetId,110);
  copy.start=number(s.start,0,86400,0);copy.end=number(s.end,0,86400,0);if(copy.end&&copy.end<=copy.start)throw Error('재생 끝은 시작보다 뒤여야 해요.');
  copy.volume=number(s.volume,0,1,1);copy.seconds=number(s.seconds,1,7200,300);copy.loop=!!s.loop;copy.background=s.kind==='audio'&&!!s.background;
  if(s.kind==='quiz')copy.payload={cards:normalizeCards(s.payload?.cards||[])};
  if(['canvas','slides','document','design'].includes(s.kind)){if(!s.payload||!validators[s.kind])throw Error('편집 자료를 확인할 수 없어요.');copy.payload=validators[s.kind](s.payload)}
  return copy;
 });
 return{version:1,id:text(raw.id,110)||id(),title:text(raw.title,100).trim()||'새 수업',goal:text(raw.goal,240),audience:text(raw.audience,100),steps,createdAt:number(raw.createdAt,1,Number.MAX_SAFE_INTEGER,Date.now()),updatedAt:number(raw.updatedAt,1,Number.MAX_SAFE_INTEGER,Date.now()),position:number(raw.position,0,Math.max(0,steps.length-1),0)};
}
function move(lesson,index,delta){const to=index+delta;if(to<0||to>=lesson.steps.length)return index;[lesson.steps[index],lesson.steps[to]]=[lesson.steps[to],lesson.steps[index]];return to}
function accepts(file,kind){const types={video:['video/mp4','video/webm','video/ogg'],audio:['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm'],pdf:['application/pdf']};return !!file&&file.size>0&&file.size<=MAX_FILE&&types[kind]?.includes(file.type)}
return{TYPES,MAX_STEPS,MAX_FILE,QUIZ_MAX,id,step,blank,normalize,normalizeCards,parseCards,timerFromEvents,readyCount,move,accepts};});
