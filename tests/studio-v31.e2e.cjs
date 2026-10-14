'use strict';
// Legacy engine regression tests trigger original action nodes directly because
// the responsive editor now exposes those actions through category panels.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8811,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html');
async function serverReady(){for(let i=0;i<100;i++){try{if((await fetch(base+'studio-unified-timeline.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,160))}throw Error('3.1 test server unavailable')}
function wav(){
 const samples=8000,buffer=Buffer.alloc(44+samples*2);
 buffer.write('RIFF',0);buffer.writeUInt32LE(36+samples*2,4);buffer.write('WAVE',8);buffer.write('fmt ',12);
 buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);
 buffer.writeUInt32LE(8000,24);buffer.writeUInt32LE(16000,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);
 buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(6000*Math.sin(i*2*Math.PI*220/8000)),44+i*2);
 return buffer;
}
test('3.1 Chrome: edit timed scenes, fade objects, loop WAV, play across pages and persist to ZIP',{timeout:155000},async()=>{
 const http=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
  page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(studio,{waitUntil:'domcontentloaded'});
  await page.locator('#toolNav button[data-kind="canvas"]').click();
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#sceneDuration').waitFor();
  await frame.locator('#sceneDuration').fill('1');
  await frame.locator('#sceneDuration').press('Tab');
  await frame.locator('#newPage').evaluate(el=>el.click());
  await frame.locator('#sceneDuration').fill('1.5');
  await frame.locator('#sceneDuration').press('Tab');
  await frame.locator('#sceneTransition').selectOption('fade');
  await frame.locator('[data-add="text"]').evaluate(el=>el.click());
  await frame.locator('#elementAnimation').selectOption('rise');
  await frame.locator('#elementDelay').fill('.5');
  await frame.locator('#elementDelay').press('Tab');
  assert.equal(await frame.locator('#sceneTrack button[data-scene]').count(),2);
  assert.match(await frame.locator('#sceneTrack').innerText(),/1초/);
  await frame.locator('#audioUpload').setInputFiles({name:'한빛반 음악.wav',mimeType:'audio/wav',buffer:wav()});
  await frame.locator('#timelineMusicName').filter({hasText:'한빛반 음악.wav'}).waitFor();
  await frame.locator('#audioVolume').fill('0.4');
  await frame.locator('#audioVolume').dispatchEvent('change');
  await frame.locator('#audioLoop').uncheck();
  const before=await frame.locator('#elementAnimation').inputValue();
  assert.equal(before,'rise');
  let state=await frame.locator('#stage').evaluate(el=>{
   const m=window.GulliverStudioAdapter.capture();
   return {duration:m.pages.map(x=>x.duration),effect:m.pages[1].elements[0].animation,delay:m.pages[1].elements[0].delay,audio:m.audio,
    previewOpacity:el.style.opacity};
  });
  assert.deepEqual(state.duration,[1,1.5]);assert.equal(state.effect,'rise');assert.equal(state.delay,.5);
  assert.equal(state.audio.volume,.4);assert.equal(state.audio.loop,false);
  await frame.locator('#timelinePlay').evaluate(el=>el.click());
  await frame.locator('#sceneTrack button[data-scene="1"][data-active="true"]').waitFor({timeout:9000});
  await frame.locator('#timelinePlay').filter({hasText:'재생'}).waitFor({state:'attached',timeout:9000});
  await frame.locator('#timelineStop').click();
  await frame.locator('#sceneTrack button[data-scene="0"][data-active="true"]').waitFor();
  // Existing 2.x/3.0 autosave stores scene animation and audio reference.
  await page.waitForFunction(async()=>{
   const projects=await GulliverStudioStorage.projects();
   const p=projects.find(x=>x.kind==='canvas'&&x.payload.pages.length===2);
   return !!p?.payload.audio&&p.payload.pages[1].elements[0].animation==='rise';
  });
  await page.locator('#navHome').evaluate(el=>el.click());
  const downloaded=page.waitForEvent('download');
  await page.locator('#libraryZipBackup').click();
  const zip=fs.readFileSync(await (await downloaded).path());
  assert.ok(zip.length>wav().length);assert.ok(zip.includes(Buffer.from('RIFF')));
  const second=await browser.newContext();const restored=await second.newPage();restored.setDefaultTimeout(25000);
  await restored.goto(studio,{waitUntil:'domcontentloaded'});
  restored.once('dialog',dialog=>dialog.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'timed-scenes.zip',mimeType:'application/zip',buffer:zip});
  await restored.locator('#message').filter({hasText:'통합 백업 복원 완료'}).waitFor();
  const after=await restored.evaluate(async()=>{
   const S=GulliverStudioStorage,projects=await S.projects(),p=projects.find(x=>x.kind==='canvas');
   const media=await S.getMedia(p.payload.audio.mediaId);
   return{pages:p.payload.pages.map(x=>x.duration),effect:p.payload.pages[1].elements[0].animation,
    volume:p.payload.audio.volume,loop:p.payload.audio.loop,soundBytes:media?.blob.size,mime:media?.mime};
  });
  assert.deepEqual(after,{pages:[1,1.5],effect:'rise',volume:.4,loop:false,soundBytes:wav().length,mime:'audio/wav'});
  await restored.locator('#projectList .project-item').getByRole('button',{name:'열기'}).first().click();
  const playing=restored.frameLocator('#editorFrame');await playing.locator('#timelineMusicName').filter({hasText:'한빛반 음악'}).waitFor();
  assert.deepEqual(errors,[]);
  await second.close();
 }finally{await browser?.close();http.kill('SIGTERM')}
});
