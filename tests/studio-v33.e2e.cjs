'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8815,base='http://127.0.0.1:'+port+'/';
fs.mkdirSync('test-artifacts',{recursive:true});
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'lesson-app.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,160))}throw Error('Lesson server unavailable')}
function wav(){const b=Buffer.alloc(44+8000*2);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(16000,40);return b}
test('3.3 Chrome: canvas lesson edit, audio backup, playback and fresh restore',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const ctx=await browser.newContext({acceptDownloads:true}),page=await ctx.newPage();page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  await page.locator('[data-add="canvas"]').click();
  const frame=page.frameLocator('#stage iframe');await frame.locator('[data-add="text"]').click();
  assert.equal(await frame.locator('#elementAnimation').isEnabled(),true);
  const placement=await frame.locator('#stage .item.selected').evaluate(node=>{
   const title=[...node.parentElement.querySelectorAll('.item')].find(item=>item.textContent==='우리 함께 배워요!');
   return{newY:parseFloat(node.style.top),titleBottom:parseFloat(title.style.top)+parseFloat(title.style.height)};
  });
  assert.ok(placement.newY>=placement.titleBottom,'new text should avoid the template title');
  await frame.locator('#propertyText').fill('오늘의 학습 목표');
  await frame.locator('#elementAnimation').selectOption('fade');
  await page.screenshot({path:'test-artifacts/lesson-canvas-desktop.png'});
  await frame.locator('#newPage').click();
  await frame.locator('#audioUpload').setInputFiles({name:'수업 음악.wav',mimeType:'audio/wav',buffer:wav()});
  await frame.locator('#timelineMusicName').filter({hasText:'수업 음악.wav'}).waitFor();
  await page.locator('#saveLesson').click();
  await page.waitForFunction(async()=>{
   const p=(await LessonStorage.list()).find(x=>x.steps.some(s=>s.kind==='canvas'&&s.payload.pages.length===2));
   return !!p?.steps[0].payload.audio&&!!(await LessonStorage.asset(p.steps[0].payload.audio.mediaId));
  });
  const download=page.waitForEvent('download');await page.locator('#backupLesson').click();
  const backup=fs.readFileSync(await (await download).path()),data=JSON.parse(backup);
  assert.equal(data.lesson.steps[0].payload.pages.length,2);assert.equal(data.assets.length,1);
  await page.locator('#previewStep').click();
  await page.locator('.canvas-play').waitFor({state:'visible'});
  await page.locator('.canvas-play').click();await page.locator('.canvas-play[aria-pressed="true"]').waitFor();
  await page.locator('.canvas-play').click();await page.locator('.canvas-play[aria-pressed="false"]').waitFor();
  await page.locator('#next').click();assert.match(await page.locator('#counter').innerText(),/2 \/ 2장/);
  await page.locator('#startLesson').click();await page.locator('body.running .canvas-play').waitFor();
  assert.match(await page.locator('#counter').innerText(),/1 \/ 2장/);
  await page.locator('#exitRun').click();
  const fresh=await browser.newContext(),restored=await fresh.newPage();restored.setDefaultTimeout(25000);
  await restored.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  await restored.locator('#restoreLesson').setInputFiles({name:'lesson.json',mimeType:'application/json',buffer:backup});
  await restored.locator('#status').filter({hasText:'수업 원본을 새 수업으로 불러왔어요'}).waitFor();
  const result=await restored.evaluate(async()=>{const p=(await LessonStorage.list()).find(x=>x.steps[0]?.kind==='canvas');return{pages:p.steps[0].payload.pages.length,asset:!!(await LessonStorage.asset(p.steps[0].payload.audio.mediaId))}});
  assert.deepEqual(result,{pages:2,asset:true});assert.deepEqual(errors,[]);
  await fresh.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('3.3 Chrome: name tags create all printable pages with distinct tool colors',{timeout:70000},async()=>{
 const printPort=8816,printBase='http://127.0.0.1:'+printPort+'/';
 const server=spawn('python3',['-m','http.server',String(printPort),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  for(let i=0;i<100;i++){try{if((await fetch(printBase+'studio-unified-editor.js')).ok)break}catch{}await new Promise(r=>setTimeout(r,160))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  await page.goto(printBase+encodeURIComponent('통합 캔버스.html'),{waitUntil:'domcontentloaded'});
  const backgrounds=await page.evaluate(()=>['.templates','.teacher-tools','.insert-tools','.page-tools','.timeline'].map(selector=>getComputedStyle(document.querySelector(selector)).backgroundColor));
  assert.equal(new Set(backgrounds).size,5);
  await page.locator('#nameTags').click();await page.locator('#rosterNames').fill(Array.from({length:10},(_,i)=>'학생 '+(i+1)).join('\n'));
  await page.locator('#rosterCount').selectOption('4');page.once('dialog',dialog=>dialog.accept());await page.locator('#createRoster').click();
  assert.equal(await page.locator('#pageStrip .page').count(),3);
  await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'test-artifacts/name-tags-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-artifacts/name-tags-mobile.png'});
  await page.evaluate(()=>{window.print=()=>{}});
  await page.locator('#printPdf').click();assert.equal(await page.locator('#printPages .print-sheet').count(),3);
  assert.match(await page.locator('#printPages').textContent(),/학생 10/);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  assert.equal(await page.locator('#printPages').count(),0);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
