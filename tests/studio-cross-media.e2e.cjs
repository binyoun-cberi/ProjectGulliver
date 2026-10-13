'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const port=8789,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
async function ready(){
 for(let n=0;n<100;n++){try{if((await fetch(base+'studio-app.js')).ok)return}catch(e){}await new Promise(r=>setTimeout(r,150))}
 throw Error('Cannot start cross media test server');
}
test('Chrome: music WAV -> video WebM with audio -> whole backup/restore', {timeout:180000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#toolNav [data-kind="music"]').click();
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#simpleMode').click();
  await page.locator('#transferTarget').selectOption('video');
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="video"][aria-current="true"]').waitFor();
  await frame.locator('#simpleMode[aria-selected="true"]').waitFor();
  await frame.locator('#soundtrackName').filter({hasNotText:'배경음악 없음'}).waitFor({timeout:30000});
  let sound=await page.evaluate(async()=>{
   const p=(await GulliverStudioStorage.projects()).find(p=>p.kind==='video');
   return p?.payload.audio&&(await GulliverStudioStorage.getMedia(p.payload.audio.mediaId))?.mime;
  });
  assert.equal(sound,'audio/wav');
  await frame.locator('#audioVolume').fill('0.55');
  await frame.locator('#clipFiles').setInputFiles({name:'수업 사진.png',mimeType:'image/png',buffer:png});
  await frame.locator('#clipList .clip').first().waitFor({timeout:30000});
  await page.waitForFunction(async()=>{
   const p=(await GulliverStudioStorage.projects()).find(p=>p.kind==='video');
   return p?.payload.audio?.volume===0.55&&p.payload.clips.length===1;
  });
  const downloadPromise=page.waitForEvent('download',{timeout:65000});
  await frame.locator('#exportVideo').click();
  const out=await downloadPromise;
  const videoPath=await out.path();
  const size=fs.statSync(videoPath).size;
  assert.ok(size>2000,'Recorded WebM is unexpectedly small');
  assert.ok(out.suggestedFilename().endsWith('.webm'));
  const probed=cp.spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name:format=duration','-of','json',videoPath],{encoding:'utf8',timeout:20000});
  assert.equal(probed.status,0,'WebM probing failed: '+probed.stderr);
  const streams=JSON.parse(probed.stdout).streams;
  assert.ok(streams.some(x=>x.codec_type==='video'),'WebM video stream not found');
  assert.ok(streams.some(x=>x.codec_type==='audio'),'WebM background music stream not found');
  const backup=page.waitForEvent('download');
  await page.locator('#libraryBackup').click();
  const archive=JSON.parse(fs.readFileSync(await (await backup).path(),'utf8'));
  assert.equal(archive.media.filter(x=>x.mime==='audio/wav').length,1);
  assert.equal(archive.media.filter(x=>x.mime==='image/png').length,1);
  const video=archive.projects.find(x=>x.kind==='video');
  assert.ok(video.payload.audio);
  assert.equal(video.payload.clips.length,1);
  const next=await browser.newContext(),restored=await next.newPage();
  restored.setDefaultTimeout(30000);
  await restored.goto(url);
  restored.once('dialog',d=>d.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'cross-media.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});
  await restored.locator('#message').filter({hasText:'통합 백업 복원 완료'}).waitFor();
  const ok=await restored.evaluate(async()=>{
   const v=(await GulliverStudioStorage.projects()).find(x=>x.kind==='video');
   const media=await GulliverStudioStorage.media();
   return !!v?.payload.audio&&v.payload.clips.length===1&&
    media.some(x=>x.id===v.payload.audio.mediaId&&x.mime==='audio/wav')&&
    media.some(x=>x.id===v.payload.clips[0].mediaId);
  });
  assert.ok(ok,'Restored video must reference its audio and image media');
  assert.deepEqual(errors,[]);
  await next.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('Chrome: all presentation slides -> video and exported picture -> document',{timeout:150000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const frame=page.frameLocator('#editorFrame');
  await page.locator('#toolNav [data-kind="slides"]').click();
  await page.locator('#proxy-slideTitle').waitFor();
  await page.locator('#sendAllSlides').click();
  await page.locator('#toolNav [data-kind="video"][aria-current="true"]').waitFor();
  await frame.locator('#simpleMode[aria-selected="true"]').waitFor();
  await frame.locator('#clipList .clip').nth(3).waitFor({timeout:45000});
  const count=await page.evaluate(async()=>{
   const v=(await GulliverStudioStorage.projects()).find(x=>x.kind==='video');
   return v?.payload.clips.length;
  });
  assert.equal(count,4);
  await page.locator('#toolNav [data-kind="picture"]').click();
  await page.locator('#pictureShareFile').setInputFiles({name:'그림.png',mimeType:'image/png',buffer:png});
  await page.locator('#transferTarget').selectOption('document');
  // Leaving the standalone picture editor intentionally asks for confirmation.
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="document"][aria-current="true"]').waitFor();
  await frame.locator('#blocks .image img').first().waitFor({timeout:30000});
  assert.ok((await frame.locator('#blocks .image img').first().getAttribute('src')).startsWith('data:image/'));
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
