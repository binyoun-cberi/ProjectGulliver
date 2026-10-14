'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8874,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<95;i++){try{if((await fetch(base+'studio-unified-multitrack.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('server unavailable')}
test('v3.4 saves, reopens and edits three videos, two WAV tracks and three captions on PC/mobile',{timeout:140000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser,dir;
 try{
  await ready();dir=fs.mkdtempSync(path.join(os.tmpdir(),'gulliver-multi-'));
  const video=path.join(dir,'class.mp4'),wave=path.join(dir,'voice.wav');
  for(const [file,args] of [[video,['-f','lavfi','-i','testsrc=size=160x90:rate=12','-t','3','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-an']],
                             [wave,['-f','lavfi','-i','sine=frequency=380:duration=4','-ac','1','-ar','11025','-c:a','pcm_s16le']]]){
   const p=spawnSync('ffmpeg',['-v','error',...args,'-y',file],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
  }
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext({viewport:{width:1280,height:850}}),page=await context.newPage();
  page.setDefaultTimeout(18000);const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});
  const f=page.frameLocator('#editorFrame');
  await f.locator('[data-design-tab="motion"]').click();
  await f.locator('#multiEnable').click();
  await f.locator('#multiAddCaption').waitFor({state:'visible'});
  await f.locator('#easyMediaPicker').setInputFiles(video);
  await f.locator('.easy-file').filter({hasText:'class.mp4'}).waitFor();
  const videoCard=f.locator('.easy-file').filter({hasText:'class.mp4'});
  await videoCard.click();await videoCard.click();
  await f.locator('#easyMediaPicker').setInputFiles(wave);
  await f.locator('.easy-file').filter({hasText:'voice.wav'}).waitFor();
  await f.locator('.easy-file').filter({hasText:'voice.wav'}).click();
  for(let i=0;i<3;i++)await f.locator('#multiAddCaption').click();
  const tracks=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture().tracks);
  assert.equal(tracks.filter(x=>x.kind==='video').length,3);
  assert.equal(tracks.filter(x=>x.kind==='audio').length,2);
  assert.equal(tracks.filter(x=>x.kind==='caption').length,3);
  const caption=f.locator('.multi-clip.caption').first();
  await caption.click();
  await f.locator('#multiInspector textarea').fill('함께 배우는 우리 반');
  await f.locator('#multiInspector textarea').press('Tab');
  const edited=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(edited.tracks.find(x=>x.kind==='caption').text,'함께 배우는 우리 반');
  const grip=f.locator('.multi-clip.video').first().locator('[data-handle="right"]');
  await grip.scrollIntoViewIfNeeded();
  const box=await grip.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2-22,box.y+box.height/2,{steps:6});
  await page.mouse.up();
  const trimmed=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture().tracks.find(x=>x.kind==='video').duration);
  assert.ok(trimmed<3&&trimmed>=.5,'Video trim handle updates project state');
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const savedId=await page.evaluate(async()=>{
   const all=await GulliverStudioStorage.projects();
   const result=all.find(p=>p.kind==='canvas'&&p.payload?.tracks?.length===8);
   return result?.id||null;
  });
  assert.ok(savedId,'Autofiled canvas contains all eight tracks');
  await page.setViewportSize({width:390,height:844});
  await f.locator('[data-design-tab="motion"]').click();
  await f.locator('.multi-clip.caption').first().waitFor({state:'visible'});
  const nav=await f.locator('.design-nav').evaluate(n=>({bottom:n.getBoundingClientRect().bottom,screen:innerHeight}));
  assert.ok(nav.bottom>=nav.screen-2,'Mobile bottom menu stays pinned');
  const second=await context.newPage();second.on('pageerror',e=>exceptions.push(e.message));
  await second.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await second.evaluate(async id=>{
    const p=await GulliverStudioStorage.getProject(id);
    await GulliverStudioBridge.start('canvas',p);
  },savedId);
  const reopened=second.frameLocator('#editorFrame');
  await reopened.locator('.multi-clip.caption').first().waitFor({state:'attached'});
  const restored=await reopened.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(restored.tracks.length,8);
  assert.equal(restored.tracks.find(t=>t.kind==='caption').text,'함께 배우는 우리 반');
  assert.ok(restored.tracks.find(t=>t.kind==='video').duration<3);
  assert.equal(await second.locator('.studio-mobile-bar').isVisible(),false,'No duplicate external editor navigation on desktop');
  assert.deepEqual(exceptions,[]);
 }finally{await browser?.close();server.kill('SIGTERM');if(dir)fs.rmSync(dir,{recursive:true,force:true})}
});