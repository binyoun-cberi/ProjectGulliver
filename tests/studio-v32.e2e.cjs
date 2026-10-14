'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8814,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html');
async function serverReady(){
 for(let i=0;i<100;i++){try{if((await fetch(base+'studio-unified-video.js')).ok)return}catch{}
  await new Promise(done=>setTimeout(done,160))}
 throw Error('3.2 local server unavailable');
}
function wav(){
 const rate=8000,length=rate*3,file=Buffer.alloc(44+length*2);
 file.write('RIFF',0);file.writeUInt32LE(36+length*2,4);file.write('WAVE',8);
 file.write('fmt ',12);file.writeUInt32LE(16,16);file.writeUInt16LE(1,20);file.writeUInt16LE(1,22);
 file.writeUInt32LE(rate,24);file.writeUInt32LE(rate*2,28);file.writeUInt16LE(2,32);file.writeUInt16LE(16,34);
 file.write('data',36);file.writeUInt32LE(length*2,40);
 for(let i=0;i<length;i++)file.writeInt16LE(Math.round(3500*Math.sin(2*Math.PI*440*i/rate)),44+i*2);
 return file;
}
function probe(path){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height:format=duration','-of','json',path],{encoding:'utf8'});
 if(p.status!==0)throw Error('ffprobe: '+p.stderr);
 return JSON.parse(p.stdout);
}
test('3.2 Chrome exports actual changing video frames AND WAV track without a server',{timeout:150000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
  page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(studio,{waitUntil:'domcontentloaded'});
  await page.locator('#toolNav button[data-kind="canvas"]').click();
  const f=page.frameLocator('#editorFrame');await f.locator('#exportWebm').waitFor();
  await f.locator('#sceneDuration').fill('1');
  await f.locator('#sceneDuration').press('Tab');
  await f.locator('#newPage').click();
  await f.locator('#sceneDuration').fill('1.5');
  await f.locator('#sceneDuration').press('Tab');
  await f.locator('#sceneTransition').selectOption('slide');
  await f.locator('[data-add="rect"]').click();
  await f.locator('#elementAnimation').selectOption('zoom');
  await f.locator('#elementDelay').fill('.2');await f.locator('#elementDelay').press('Tab');
  await f.locator('#audioUpload').setInputFiles({name:'발표음악.wav',mimeType:'audio/wav',buffer:wav()});
  await f.locator('#timelineMusicName').filter({hasText:'발표음악.wav'}).waitFor();
  const exportPromise=page.waitForEvent('download',{timeout:45000});
  await f.locator('#exportWebm').click();
  const exportFile=await exportPromise,output=await exportFile.path();
  assert.match(exportFile.suggestedFilename(),/\.webm$/);
  const info=probe(output),streamTypes=info.streams.map(s=>s.codec_type);
  assert.ok(streamTypes.includes('video'),'WEBM missing video stream: '+JSON.stringify(info));
  assert.ok(streamTypes.includes('audio'),'WEBM missing WAV-mixed audio stream: '+JSON.stringify(info));
  const video=info.streams.find(s=>s.codec_type==='video');
  assert.equal(video.width,960);assert.equal(video.height,540);
  // Chrome MediaRecorder live WebM does not always write a Duration header.
  // Validate actual encoded video packet presentation times instead.
  const packets=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','packet=pts_time','-of','csv=p=0',output],{encoding:'utf8'});
  assert.equal(packets.status,0,'Packet probe failed: '+packets.stderr);
  const times=packets.stdout.split('\\n').map(x=>Number.parseFloat(x)).filter(Number.isFinite);
  const lastFrame=Math.max(...times);
  assert.ok(lastFrame>=1.5,'Video stream ends too early: '+lastFrame);
  assert.ok(lastFrame<5,'Unexpected video stream length: '+lastFrame);
  assert.ok(fs.statSync(output).size>3000,'Video export is unexpectedly tiny');
  const md5=spawnSync('ffmpeg',['-v','error','-i',output,'-vf','fps=2,scale=64:36','-f','framemd5','-'],{encoding:'utf8'});
  assert.equal(md5.status,0,'ffmpeg frame inspect: '+md5.stderr);
  const signatures=md5.stdout.split('\n').filter(line=>line&&!line.startsWith('#')).map(line=>line.split(',').at(-1).trim());
  assert.ok(new Set(signatures).size>1,'Scene transitions must result in visually changing video frames');
  await f.locator('#videoProgressPanel').waitFor({state:'hidden'});
  await f.locator('#status').filter({hasText:'WebM 영상을 저장했어요'}).waitFor();
  const saved=await page.evaluate(async()=>{
   const projects=await GulliverStudioStorage.projects();
   return projects.some(p=>p.kind==='canvas'&&p.payload.pages.length===2&&p.payload.audio);
  });
  assert.ok(saved,'Export should not discard editable pages or WAV references');
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('3.2 Chrome cancel interrupts capture and no-audio WebM stays supported',{timeout:95000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({acceptDownloads:true}),page=await ctx.newPage();page.setDefaultTimeout(20000);
  await page.goto(studio,{waitUntil:'domcontentloaded'});await page.locator('#toolNav button[data-kind="canvas"]').click();
  const f=page.frameLocator('#editorFrame');
  await f.locator('#exportWebm').click();
  await f.locator('#cancelWebm').click();
  await f.locator('#status').filter({hasText:'영상 저장 실패'}).waitFor();
  await f.locator('#cancelWebm').waitFor({state:'hidden'});
  await f.locator('#sceneDuration').fill('1');await f.locator('#sceneDuration').press('Tab');
  const download=page.waitForEvent('download',{timeout:40000});
  await f.locator('#exportWebm').click();
  const info=probe(await (await download).path());
  assert.ok(info.streams.some(x=>x.codec_type==='video'));
  assert.ok(!info.streams.some(x=>x.codec_type==='audio'));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
