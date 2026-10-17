'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const port=8892,base='http://127.0.0.1:'+port+'/';
async function ready(){
 for(let n=0;n<70;n++){try{if((await fetch(base+'video-ttak.js')).ok)return}catch{}
  await new Promise(ok=>setTimeout(ok,180));}
 throw Error('Media v5.2 HTTP server did not start');
}
test('5.2 Chrome: thumbnails, reusing uploaded files, timeline resizing, beat scrub and default simple mode',{timeout:115000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();page.setDefaultTimeout(16000);
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(base+encodeURIComponent('영상 뚝딱.html'),{waitUntil:'domcontentloaded'});
  await page.locator('#simpleMode[aria-selected="true"]').waitFor();
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
  await page.locator('#clipFiles').setInputFiles({name:'봄꽃.png',mimeType:'image/png',buffer:png});
  await page.locator('#clipList .clip').first().waitFor();
  await page.locator('#mediaShelf .filename').filter({hasText:'봄꽃.png'}).waitFor();
  assert.equal(await page.locator('#timelineOverview .timeline-segment').count(),1);
  await page.locator('#selectedClipLength').evaluate(el=>{el.value='2.5';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForFunction(()=>window.GulliverStudioAdapter.capture().clips[0].duration===2.5);
  await page.locator('#timelineOverview .segment-grip').first().focus();
  await page.locator('#timelineOverview .segment-grip').first().press('ArrowRight');
  await page.waitForFunction(()=>window.GulliverStudioAdapter.capture().clips[0].duration===3);
  await page.locator('#mediaShelf button').first().click();
  await page.waitForFunction(()=>window.GulliverStudioAdapter.capture().clips.length===2);
  assert.equal(await page.evaluate(async()=> (await GulliverStudioStorage.media()).length),1,'existing image reused without copying data');
  assert.equal(await page.locator('#timelineOverview .timeline-segment').count(),2);
  await page.goto(base+encodeURIComponent('음악 뚝딱.html'),{waitUntil:'domcontentloaded'});
  await page.locator('#simpleMode[aria-selected="true"]').waitFor();
  assert.equal(await page.locator('#musicRuler button').count(),16);
  await page.locator('#musicRuler button[data-step="3"]').click();
  assert.equal(await page.locator('#musicRuler button.active').count(),1);
  assert.equal(await page.locator('#musicRuler button.active').getAttribute('data-step'),'3');
  await page.locator('#playMusic').click();
  await page.waitForFunction(()=>!!document.getElementById('audioPreview').getAttribute('src'));
  await page.locator('#musicScrub').evaluate(el=>{el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.waitForFunction(()=>document.getElementById('audioPreview').currentTime>1.3);
  assert.deepEqual(failures,[],'unexpected browser script errors');
 }finally{await browser?.close();server.kill('SIGTERM')}
});
