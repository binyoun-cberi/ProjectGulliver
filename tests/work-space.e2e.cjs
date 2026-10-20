'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core');
test('common workspace creates materials, opens shared originals, preserves order and notes on mobile',{timeout:60000},async()=>{
 const base='http://127.0.0.1:8785/',server=spawn('python3',['-m','http.server','8785','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  for(let i=0;i<80;i++){try{if((await fetch(base+'lesson.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'lesson.html?new=canvas&template=worksheet',{waitUntil:'networkidle'});
  await page.frameLocator('#editorFrame').locator('#stage').waitFor();
  await page.locator('#lessonTitle').fill('하나의 작업');await page.locator('#settings textarea').fill('교사 메모');await page.locator('[data-add=timer]').click();await page.locator('#saveLesson').click();
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#stepList .step-button').count(),2);await page.locator('#stepList .step-button').first().click();assert.equal(await page.locator('#settings textarea').inputValue(),'교사 메모');
  await page.evaluate(async()=>{const payload=GulliverUnifiedCore.starter('blank');await GulliverStudioStorage.saveProject({id:'common-source',kind:'canvas',title:'보관함 원본',payload,createdAt:1,updatedAt:2})});
  await page.goto(base+'lesson.html?project=common-source',{waitUntil:'networkidle'});await page.frameLocator('#editorFrame').locator('#stage').waitFor();await page.locator('#lessonTitle').fill('같은 원본 수정');await page.locator('#saveLesson').click();assert.equal(await page.evaluate(async()=>(await GulliverStudioStorage.getProject('common-source')).title),'같은 원본 수정');
  await page.locator('[data-add=timer]').click();await page.locator('#saveLesson').click();await page.locator('#openLesson').click();await page.locator('#libraryList button').filter({hasText:'같은 원본 수정'}).waitFor();assert.equal(await page.locator('#libraryList button').filter({hasText:'같은 원본 수정'}).count(),1);await page.locator('#closeLibrary').click();
  for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no page overflow at '+width)}
  assert.deepEqual(await page.locator('.gx-nav a').allTextContents(),['홈','만들기','내 보관함','우리 반']);assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill()}
});
