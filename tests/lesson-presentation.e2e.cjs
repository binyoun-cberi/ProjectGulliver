'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');

test('Starting a lesson displays only the presentation, fits slide and controls, and restores editing',{timeout:90000},async()=>{
 const base='http://127.0.0.1:8796/';
 const server=spawn('python3',['-m','http.server','8796','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<80;i++){try{const r=await fetch(base+'lesson.html');await r.arrayBuffer();if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'lesson.html?new=canvas&template=presentation',{waitUntil:'domcontentloaded'});
  let frame=page.frameLocator('#editorFrame');
  await frame.locator('#canvasFit').waitFor();
  await page.locator('[data-add=timer]').click();
  await page.locator('#stepList .step-button').first().click();
  await page.locator('#workNotes').click();
  await page.locator('#settings textarea').first().fill('교사용 비공개 메모');
  await page.locator('#workNotes').click();

  await page.locator('#startLesson').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentDocument?.body.classList.contains('common-work-presenting'));
  for(const [width,height] of [[1920,1080],[1440,900],[768,900],[390,844]]){
   await page.setViewportSize({width,height});
   await page.waitForTimeout(180);
   const v=await page.evaluate(()=>{
    const iframe=document.querySelector('#editorFrame'),doc=iframe.contentDocument;
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const display=selector=>getComputedStyle(doc.querySelector(selector)).display;
    return {slide:rect(doc.querySelector('#stage')),view:rect(doc.querySelector('#stageView')),
     iframe:rect(iframe),nav:display('.design-nav'),panel:display('.design-panel'),
     zoom:display('.canvas-zoom'),top:display('.top-tools'),pages:display('#pageStrip'),
     controls:rect(document.querySelector('#runbar')),notes:rect(document.querySelector('#lessonPresenter')),
     rootWidth:document.documentElement.scrollWidth,hasPresenter:doc.body.classList.contains('common-work-presenting')};
   });
   assert.equal(v.hasPresenter,true,'presentation class persists at '+width);
   for(const name of ['nav','panel','zoom','top','pages'])assert.equal(v[name],'none',name+' visible at '+width);
   assert.ok(v.slide.width>v.view.width*.4&&v.slide.height>80,'slide is too small at '+width+': '+JSON.stringify(v));
   assert.ok(v.slide.right<=v.view.right+4&&v.slide.x>=v.view.x-4,'slide does not fit horizontally at '+width+': '+JSON.stringify(v));
   assert.ok(v.slide.bottom<=v.view.bottom+4&&v.slide.y>=v.view.y-4,'slide does not fit vertically at '+width+': '+JSON.stringify(v));
   assert.ok(v.iframe.bottom<=v.controls.y+2,'iframe covers the lesson navigation at '+width+': '+JSON.stringify(v));
   assert.ok(v.controls.bottom<=height+2,'lesson navigation is below viewport at '+width+': '+JSON.stringify(v));
   assert.ok(v.rootWidth<=width+2,'horizontal overflow at '+width);
  }
  await page.locator('#toggleLessonNotes').click();
  assert.equal(await page.locator('#lessonPresenterNotes').isVisible(),true);
  assert.match(await page.locator('#lessonPresenterNotes').textContent(),/교사용 비공개 메모/);
  await page.locator('#next').click();
  await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.kind==='timer');
  await page.locator('#previous').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentDocument?.body.classList.contains('common-work-presenting'));
  await page.locator('#exitRun').click();
  frame=page.frameLocator('#editorFrame');
  await frame.locator('.design-nav').waitFor({state:'visible'});
  assert.equal(await frame.locator('.canvas-zoom').isVisible(),true);
  assert.equal(await frame.locator('body').evaluate(el=>el.classList.contains('common-work-presenting')),false);
  await page.locator('#previewStep').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentDocument?.body.classList.contains('common-work-presenting'));
  assert.equal(await page.frameLocator('#editorFrame').locator('.design-nav').isVisible(),false);
  await page.locator('#previewStep').click();
  await page.frameLocator('#editorFrame').locator('.design-nav').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill()}
});
