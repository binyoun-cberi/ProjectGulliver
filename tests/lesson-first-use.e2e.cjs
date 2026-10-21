'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');

test('mobile first use has visible creation, starter choice and compact tools; saved lessons reopen',{timeout:90000},async()=>{
 const base='http://127.0.0.1:8797/';
 const server=spawn('python3',['-m','http.server','8797','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<80;i++){try{if((await fetch(base+'lesson.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  await page.locator('.work-starter-primary').waitFor();
  assert.equal(await page.locator('#createMaterial').isVisible(),true);
  assert.equal(await page.locator('#saveLesson').isVisible(),true);
  assert.equal(await page.locator('#mobileWorkMore>summary').isVisible(),true);
  assert.equal(await page.locator('#startLesson').isVisible(),false);
  const init=await page.evaluate(()=>{
   const r=el=>el.getBoundingClientRect();
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    starter:r(document.querySelector('.work-starter-primary')).toJSON(),
    header:r(document.querySelector('header.bar')).toJSON(),actions:r(document.querySelector('header.bar .actions')).toJSON()};
  });
  assert.ok(init.scrollWidth<=init.width+2,JSON.stringify(init));
  assert.ok(init.starter.top>init.header.bottom&&init.starter.bottom<844,'first-create must be above the fold: '+JSON.stringify(init));
  assert.ok(init.actions.right<=390+2,'mobile toolbar overflow: '+JSON.stringify(init));
  await page.locator('.work-starter-primary').click();
  assert.equal(await page.locator('#createMaterialDialog').isVisible(),true);
  assert.equal(await page.locator('#createMaterialDialog [data-create-kind]').count(),10);
  await page.locator('#createMaterialDialog [data-create-preset=worksheet]').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.kind==='canvas');
  assert.equal(await page.locator('.work-starter').count(),0);
  assert.equal(await page.locator('#startLesson').isEnabled(),true);
  assert.equal(await page.locator('#startLesson').isVisible(),true);
  assert.equal(await page.locator('#stepList .step-button').count(),1);
  await page.locator('#createMaterial').click();
  await page.locator('#createMaterialDialog [data-create-kind=document]').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.kind==='document');
  assert.equal(await page.locator('#stepList .step-button').count(),2);
  await page.locator('#mobileWorkMore>summary').click();
  await page.locator('#workSequence').click();
  assert.equal(await page.locator('.layout>.left').isVisible(),true);
  await page.locator('#mobileWorkMore>summary').click();
  await page.locator('#workSequence').click();
  assert.equal(await page.locator('.layout>.left').isVisible(),false);
  await page.locator('#lessonTitle').fill('첫 수업 검증');
  await page.locator('#saveLesson').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#stepList')?.children.length===2);
  assert.equal(await page.locator('#lessonTitle').inputValue(),'첫 수업 검증');
  await page.setViewportSize({width:1440,height:900});
  assert.equal(await page.locator('#mobileWorkMore').isVisible(),false);
  assert.equal(await page.locator('#workSequence').isVisible(),true);
  assert.ok(await page.locator('#createMaterial').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill()}
});
