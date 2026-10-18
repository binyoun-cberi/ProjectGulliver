'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8991,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let n=0;n<80;n++){try{if((await fetch(base+'index.html')).ok)return}catch{}
 await new Promise(resolve=>setTimeout(resolve,150))}throw Error('QA server not ready')}
test('Classroom journey: home -> canvas create/save -> unified library -> edit -> lesson import/run -> lesson backup/reopen',{timeout:160000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1536,height:960},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.format-tile[href*="template=presentation"]').click();
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#stage').waitFor();
  // Wait for the outer studio to attach its adapter and finish its first autosave,
  // not just for the iframe to define GulliverStudioAdapter.
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.kind==='canvas');
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  // Exercise the actual editable field: parent autosave relies on input/change events.
  await frame.locator('#designTitle').fill('종합 검수 발표 자료');
  await frame.locator('#designTitle').press('Tab');
  // Canvas uses autosave in this mode; the manual-save control is intentionally
  // hidden. Poll the actual IndexedDB result from Node instead of Playwright's
  // browser-context waitForFunction(async () => ...), which can pass on a Promise.
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  for(let i=0;i<50;i++){
   const exists=await page.evaluate(async()=> (await GulliverStudioStorage.projects()).some(x=>x.title==='종합 검수 발표 자료'));
   if(exists)break;
   if(i===49)throw Error('Changed canvas title was not autosaved within 10s');
   await new Promise(resolve=>setTimeout(resolve,200));
  }
  const state=await page.evaluate(async()=>({
   stored:(await GulliverStudioStorage.projects()).map(x=>({id:x.id,title:x.title,kind:x.kind,pageCount:x.payload?.pages?.length,updatedAt:x.updatedAt})),
   editor:document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture?.()?.title,
   label:document.querySelector('#saveStatus')?.textContent
  }));
  console.log('AUDIT_CANVAS_SAVE',JSON.stringify(state));
  const source=await page.evaluate(async()=> (await GulliverStudioStorage.projects()).find(x=>x.title==='종합 검수 발표 자료'));
  assert.ok(source?.payload?.pages?.length,'saved project must contain canvas pages: '+JSON.stringify({kind:source?.kind,payloadKeys:Object.keys(source?.payload||{}),pageLength:source?.payload?.pages?.length,found:!!source}));
  await page.goto(base+encodeURIComponent('내 보관함.html'),{waitUntil:'domcontentloaded'});
  await page.locator('#unifiedLibraryList .unified-item').filter({hasText:'종합 검수 발표 자료'}).waitFor();
  await page.locator('#unifiedLibraryList .unified-item').filter({hasText:'종합 검수 발표 자료'}).locator('a.unified-open').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture?.().title==='종합 검수 발표 자료');
  await page.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  await page.locator('#lessonAudience').fill('종합 검수 반');
  await page.locator('#lessonGoal').fill('준비한 자료를 수업에 활용한다');
  await page.locator('#fromStudio').click();
  const importSource=page.locator('#libraryList button.import-source').filter({hasText:'종합 검수 발표 자료'});
  await importSource.waitFor();await importSource.click();
  await page.locator('#status').filter({hasText:'수업을 이 브라우저에 저장했어요'}).waitFor();
  const lessonId=await page.evaluate(()=>new URL(location.href).searchParams.get('lesson'));
  const lesson=await page.evaluate(async id=>LessonStorage.get(id),lessonId);
  assert.equal(lesson.steps[0].kind,'canvas');
  assert.equal(lesson.steps[0].payload.title,'종합 검수 발표 자료');
  assert.equal(lesson.goal,'준비한 자료를 수업에 활용한다');
  assert.equal(lesson.audience,'종합 검수 반');
  const original=await page.evaluate(async id=>GulliverStudioStorage.getProject(id),source.id);
  assert.equal(original.title,source.title,'importing the lesson must not mutate source project');
  await page.locator('#startLesson').click();
  await page.locator('body.running').waitFor();
  await page.frameLocator('iframe.editor-frame').locator('#stage').waitFor();
  await page.locator('#exitRun').click();
  const promise=page.waitForEvent('download');
  await page.locator('#backupLesson').click();
  const dl=await promise;
  assert.match(dl.suggestedFilename(),/\.lesson\.json$/);
  const archive=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
  assert.equal(archive.format,'gulliver-lesson');
  assert.equal(archive.lesson.id,lessonId);
  assert.equal(archive.lesson.steps[0].kind,'canvas');
  await page.goto(base+encodeURIComponent('내 보관함.html'),{waitUntil:'domcontentloaded'});
  const saved=page.locator('#unifiedLibraryList .unified-item').filter({hasText:'새 수업'});
  await saved.first().waitFor();
  await saved.first().locator('a.unified-open').click();
  await page.waitForFunction(expected=>new URL(location.href).searchParams.get('lesson')===expected,lessonId);
  await page.locator('#lessonGoal').waitFor();
  await page.waitForFunction(()=>document.getElementById('lessonGoal')?.value==='준비한 자료를 수업에 활용한다');
  assert.equal(await page.locator('#stepList .step-button').count(),1);
  assert.deepEqual(errors,[],'no page script error on cross-tool journey');
 }finally{await browser?.close();server.kill('SIGTERM')}
});
