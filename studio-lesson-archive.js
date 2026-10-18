(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.GulliverLessonArchive=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_LESSONS=200,MAX_ASSETS=180,MAX_LESSON_BYTES=200*1024*1024;
 const allowed=['audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm','video/mp4','video/webm','video/ogg','application/pdf'];
 function checkList(lessons,assets){
  if(!Array.isArray(lessons)||!Array.isArray(assets)||lessons.length>MAX_LESSONS||assets.length>MAX_ASSETS)throw Error('수업 백업은 수업 200개, 파일 180개까지만 담을 수 있어요.');
  const ids=new Set(),mediaIds=new Set();let size=0;
  for(const row of lessons){
   if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id)||!Array.isArray(row.steps))throw Error('수업 백업의 수업 목록이 손상됐어요.');
   ids.add(row.id);
  }
  for(const item of assets){
   if(!item||typeof item.id!=='string'||!item.id||mediaIds.has(item.id)||!allowed.includes(item.mime)
    ||!Number.isSafeInteger(item.size)||item.size<1||item.size>100*1024*1024)
    throw Error('수업 백업의 원본 파일 목록이 올바르지 않아요.');
   mediaIds.add(item.id);size+=item.size;
  }
  if(size>MAX_LESSON_BYTES)throw Error('수업 원본 파일의 합계가 200MB를 넘어요. 큰 수업은 원본을 개별 백업해 주세요.');
  for(const row of lessons)for(const step of row.steps){
   if(step.assetId&&!mediaIds.has(step.assetId))throw Error('수업에 연결한 원본 파일이 백업에서 빠졌어요: '+row.title);
   const wav=step.kind==='canvas'&&step.payload?.audio?.mediaId;
   if(wav&&!mediaIds.has(wav))throw Error('수업 캔버스에 사용한 음악 원본이 백업에서 빠졌어요: '+row.title);
  }
  return{lessons:lessons.length,assets:assets.length,bytes:size};
 }
 function prepare(lessons,assets,uid,normalize){
  checkList(lessons,assets);
  if(typeof uid!=='function'||typeof normalize!=='function')throw Error('수업 복원 도구를 사용할 수 없어요.');
  const idMap=new Map(),newAssets=assets.map(source=>{
   if(!(source.blob instanceof Blob)||source.blob.size!==source.size)throw Error('수업 원본 파일의 크기가 백업 기록과 달라요.');
   const id=uid();idMap.set(source.id,id);
   return{id,name:String(source.name||'원본 파일').slice(0,150),mime:source.mime,blob:source.blob};
  });
  const now=Date.now();
  const newLessons=lessons.map(row=>{
   const next=normalize(row);
   next.id=uid();next.createdAt=now;next.updatedAt=now;
   next.steps.forEach(step=>{
    step.id=uid();
    if(step.assetId)step.assetId=idMap.get(step.assetId);
    if(step.kind==='canvas'&&step.payload?.audio?.mediaId)step.payload.audio.mediaId=idMap.get(step.payload.audio.mediaId);
   });
   return next;
  });
  return{lessons:newLessons,assets:newAssets};
 }
 return{MAX_LESSONS,MAX_ASSETS,MAX_LESSON_BYTES,checkList,prepare};
});
