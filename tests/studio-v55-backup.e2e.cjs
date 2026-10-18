'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8919,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let i=0;i<80;i++){try{if((await fetch(base+'studio-lesson-archive.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('server unavailable')}
test('5.5 Chrome ZIP: all saved studio projects, lessons and lesson PDF/WAV restore in fresh browser, preserving originals',{timeout:155000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({acceptDownloads:true});const page=await ctx.newPage();page.setDefaultTimeout(25000);
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.GulliverStudioZipBackup && !!window.LessonStorage);
  await page.evaluate(async()=>{
   const canvas=GulliverUnifiedCore.starter('presentation');
   await GulliverStudioStorage.saveProject({id:'source-canvas',kind:'canvas',title:'세계 여러 나라',payload:canvas,createdAt:1,updatedAt:2,folderId:''});
   const lesson=LessonCore.blank();lesson.id='source-lesson';lesson.title='세계 인사말 수업';lesson.goal='함께 인사한다';lesson.audience='열매1반';
   const pdf=LessonCore.step('pdf');pdf.assetId='source-pdf';pdf.title='인사말 활동지';
   const audio=LessonCore.step('audio');audio.assetId='source-wav';audio.title='인사말 음악';
   lesson.steps=[pdf,audio];await LessonStorage.save(lesson);
   await LessonStorage.putAsset({id:'source-pdf',name:'활동.pdf',mime:'application/pdf',blob:new Blob(['%PDF-1.4\n'],{type:'application/pdf'})});
   await LessonStorage.putAsset({id:'source-wav',name:'음악.wav',mime:'audio/wav',blob:new Blob(['RIFF0000WAVE'],{type:'audio/wav'})});
  });
  // ZIP archives created by 5.1 (version 2) still open with no lesson entries.
  const legacy=await page.evaluate(async()=>{
   const manifest={format:'gulliver.studio.zip',version:2,createdAt:new Date().toISOString(),
    projects:[],assets:[],media:[],official:[],folders:[],activities:null};
   const zip=await GulliverStudioZip.create([{path:'manifest.json',blob:new Blob([JSON.stringify(manifest)],{type:'application/json'})}]);
   const imported=await GulliverStudioZipBackup.loadZip(zip);
   return{version:imported.version,lessons:imported.lessons.length,assets:imported.lessonAssets.length};
  });
  assert.deepEqual(legacy,{version:2,lessons:0,assets:0});
  const promise=page.waitForEvent('download');
  await page.locator('#libraryZipBackup').evaluate(el=>el.click());
  const dl=await promise;const bytes=fs.readFileSync(await dl.path());assert.ok(bytes.length>1000);
  assert.ok(dl.suggestedFilename().endsWith('.zip'));
  const fresh=await browser.newContext();const restored=await fresh.newPage();restored.setDefaultTimeout(25000);
  const restoreErrors=[];restored.on('pageerror',e=>restoreErrors.push(e.message));
  await restored.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  restored.once('dialog',dialog=>dialog.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'모든 수업.zip',mimeType:'application/zip',buffer:bytes});
  await restored.locator('#message').filter({hasText:'통합 백업 복원 완료'}).waitFor({timeout:60000});
  const result=await restored.evaluate(async()=>{
   const lessons=await LessonStorage.list(),files=await LessonStorage.allAssets(),projects=await GulliverStudioStorage.projects();
   return{lessons:lessons.map(l=>({id:l.id,title:l.title,audience:l.audience,goal:l.goal,steps:l.steps.map(s=>({id:s.id,assetId:s.assetId}))})),
    files:files.map(a=>({id:a.id,name:a.name,type:a.blob?.type,size:a.blob?.size})),projects:projects.map(p=>({id:p.id,title:p.title}))};
  });
  assert.equal(result.lessons.length,1);
  assert.equal(result.projects.length,1);
  assert.equal(result.lessons[0].title,'세계 인사말 수업');
  assert.equal(result.lessons[0].audience,'열매1반');
  assert.equal(result.lessons[0].goal,'함께 인사한다');
  assert.equal(result.lessons[0].steps.length,2);
  assert.notEqual(result.lessons[0].id,'source-lesson');
  assert.notEqual(result.projects[0].id,'source-canvas');
  assert.notEqual(result.lessons[0].steps[0].assetId,'source-pdf');
  assert.equal(result.files.length,2);
  assert.ok(result.files.every(a=>result.lessons[0].steps.some(s=>s.assetId===a.id)));
  await restored.goto(base+'lesson.html?lesson='+encodeURIComponent(result.lessons[0].id),{waitUntil:'domcontentloaded'});
  await restored.waitForFunction(()=>document.querySelector('#lessonGoal')?.value==='함께 인사한다');
  assert.equal(await restored.locator('#stepList .step-button').count(),2);
  assert.deepEqual(errs,[]);assert.deepEqual(restoreErrors,[]);
  await restored.close();await fresh.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
