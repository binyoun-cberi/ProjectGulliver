/* A work owns its editable material, activity order, and teacher-only notes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverWorkCore=api})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const FORMAT='gulliver.work.v1',EDITABLE=['canvas','design','slides','document'],PROJECTS=[...EDITABLE,'video','music'];
 const clone=value=>JSON.parse(JSON.stringify(value));
 const text=(v,max)=>String(v??'').slice(0,max);
 function validate(raw){
  if(raw?.format!==FORMAT||typeof raw.id!=='string'||!raw.id||raw.id.length>240||!Array.isArray(raw.steps)||raw.steps.length>60)throw Error('통합 작업 형식을 확인해 주세요.');
  const ids=new Set();for(const step of raw.steps){if(!step||typeof step.id!=='string'||!step.id||ids.has(step.id)||!['canvas','design','slides','document','video','music','audio','pdf','quiz','timer'].includes(step.kind))throw Error('작업의 활동 번호 또는 종류를 확인해 주세요.');ids.add(step.id);}
  const result=clone(raw);result.title=text(raw.title,100)||'새 작업';result.goal=text(raw.goal,240);result.audience=text(raw.audience,100);
  result.position=Math.max(0,Math.min(result.steps.length-1,Number(raw.position)||0));result.revision=Math.max(0,Math.floor(Number(raw.revision)||0));
  result.steps.forEach(s=>{s.notes=text(s.notes,2000);s.title=text(s.title,120);});return result;
 }
 function fromProject(project,existing){
  if(!project||!PROJECTS.includes(project.kind)||!project.id||!project.payload)throw Error('편집 자료를 확인해 주세요.');
  const now=Date.now(),work=existing?validate(existing):{format:FORMAT,id:'project:'+project.id,title:project.title,goal:'',audience:'',steps:[],position:0,createdAt:project.createdAt||now,updatedAt:project.updatedAt||now,revision:0,origin:{kind:'project',id:project.id}};
  const current=work.steps.find(s=>s.project?.id===project.id);
  const entry={...(current||{}),id:current?.id||'main',kind:project.kind,title:project.title,payload:clone(project.payload),notes:current?.notes||'',assetId:'',project:{id:project.id,kind:project.kind,folderId:project.folderId||'',createdAt:project.createdAt||now},editorPayload:true};
  if(current)work.steps[work.steps.indexOf(current)]=entry;else work.steps.push(entry);
  if(!current||work.steps.length===1)work.title=project.title;
  work.updatedAt=project.updatedAt||now;return validate(work);
 }
 function fromLesson(lesson,existing){
  if(!lesson||!lesson.id||!Array.isArray(lesson.steps))throw Error('수업 자료를 확인해 주세요.');
  const old=existing?validate(existing):null,prior=new Map((old?.steps||[]).map(s=>[s.id,s]));
  const steps=lesson.steps.map(s=>({...clone(s),...(prior.get(s.id)?.project?{project:prior.get(s.id).project,editorPayload:true}:{})}));
  // Removing a linked material from a lesson must not silently delete its original.
  for(const step of old?.steps||[])if(step.project&&!steps.some(s=>s.id===step.id))throw Error('연결된 원본 자료는 먼저 별도 작업으로 분리해야 삭제할 수 있어요.');
  return validate({format:FORMAT,id:old?.id||'lesson:'+lesson.id,title:lesson.title,goal:lesson.goal,audience:lesson.audience,steps,position:lesson.position,createdAt:old?.createdAt||lesson.createdAt||Date.now(),updatedAt:lesson.updatedAt||Date.now(),revision:old?.revision||0,origin:old?.origin||{kind:'lesson',id:lesson.id}});
 }
 function requiredMedia(lesson){const refs=new Set();for(const step of lesson.steps||[]){if(step.assetId)refs.add(step.assetId);const p=step.payload;if(!p)continue;if(p.audio?.mediaId)refs.add(p.audio.mediaId);for(const t of p.tracks||[])if(t.kind!=='caption'&&t.mediaId)refs.add(t.mediaId);for(const page of p.pages||[])if(page.videoClip?.mediaId)refs.add(page.videoClip.mediaId);for(const c of p.clips||[])if(c.mediaId)refs.add(c.mediaId)}return [...refs];}
 function remapMedia(lesson,map){const copy=clone(lesson),replace=id=>map.get(id)||id;for(const s of copy.steps||[]){s.assetId=replace(s.assetId);const p=s.payload;if(!p)continue;if(p.audio?.mediaId)p.audio.mediaId=replace(p.audio.mediaId);for(const t of p.tracks||[])if(t.mediaId)t.mediaId=replace(t.mediaId);for(const page of p.pages||[])if(page.videoClip?.mediaId)page.videoClip.mediaId=replace(page.videoClip.mediaId);for(const c of p.clips||[])if(c.mediaId)c.mediaId=replace(c.mediaId)}return copy;}
 function lessonCompatible(work){return work.steps.every(s=>!s.editorPayload||EDITABLE.includes(s.kind));}
 function toLesson(raw){const work=validate(raw);if(!lessonCompatible(work))throw Error('영상·음악 제작 원본은 아직 기존 편집기에서 열어 주세요.');return{version:1,id:work.id,title:work.title,goal:work.goal,audience:work.audience,steps:clone(work.steps),position:work.position,createdAt:work.createdAt,updatedAt:work.updatedAt,workRevision:work.revision,workId:work.id};}
 function projectView(raw,id){const work=validate(raw),s=work.steps.find(s=>s.project?.id===id);if(!s)return null;return{id,kind:s.kind,title:work.steps.length===1?work.title:s.payload?.title||s.title||work.title,payload:{...clone(s.payload),...(work.steps.length===1?{title:work.title}:{})},folderId:s.project.folderId||'',createdAt:s.project.createdAt||work.createdAt,updatedAt:work.updatedAt,workId:work.id,workStepId:s.id,workRevision:work.revision};}
 return{FORMAT,EDITABLE,PROJECTS,validate,fromProject,fromLesson,toLesson,projectView,lessonCompatible,requiredMedia,remapMedia};
});
