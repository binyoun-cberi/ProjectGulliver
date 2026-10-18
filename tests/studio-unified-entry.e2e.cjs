'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8847,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let i=0;i<90;i++){try{if((await fetch(base+'index.html')).ok)return}catch{}await new Promise(r=>setTimeout(r,170))}throw Error('Server unavailable')}
test('One canvas for blank, slides, worksheets; specialist editors stay explicit, lesson preparation remains available',{timeout:105000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.format-tile[href="lesson.html"]').waitFor();
  assert.ok(await page.locator('a[href="lesson.html"]').count()>=1,'Lesson preparation must remain reachable from home');
  for(const [preset,layout,expectElements] of [['blank','wide',0],['presentation','wide',3],['worksheet','a4',3]]){
   await page.goto(base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template='+preset,{waitUntil:'domcontentloaded'});
   const inner=page.frameLocator('#editorFrame');
   await inner.locator('#stage').waitFor();
   await page.waitForFunction(expected=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture?.().layout===expected,layout);
   assert.equal(await inner.locator('#stage .item').count(),expectElements,preset+' initial objects');
   assert.equal(await inner.locator('.design-nav').isVisible(),true,'Same canvas editing shell '+preset);
  }
  await page.locator('#canvasLibraryToggle').click();
  await page.locator('#canvasParentTools').click();
  assert.equal(await page.locator('body.canvas-library-open').count(),0,'Picker closes background library');
  await page.locator('#studioToolPicker [data-canvas-template="blank"]').click();
  await page.waitForFunction(()=>document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture?.().pages?.[0]?.elements?.length===0);
  assert.equal(await page.frameLocator('#editorFrame').locator('#stage .item').count(),0);
  await page.locator('#canvasParentTools').click();
  assert.equal(await page.locator('#studioToolPicker .picker-specialists[open]').count(),0);
  await page.locator('#studioToolPicker .picker-specialists summary').click();
  await page.locator('#studioToolPicker [data-kind="slides"]').waitFor();
  assert.equal(await page.locator('#studioToolPicker a[href="lesson.html"]').count(),0,'Lesson preparation is a separate workflow, not a specialist canvas tool');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});