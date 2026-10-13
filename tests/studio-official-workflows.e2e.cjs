'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cp=require('node:child_process');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const PORT=8779,BASE='http://127.0.0.1:'+PORT+'/',FILENAME='tests/fixtures/studio-qa.mp4';
const TARGETS=[
 ['영상 뚝딱.html','filmcraft'],
 ['음악 뚝딱.html','soundcraft']
];
function sleep(ms){return new Promise(done=>setTimeout(done,ms))}
async function serve(){
 const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{stdio:'ignore'});
 for(let i=0;i<70;i++){
  try{if((await fetch(BASE+'studio-official-media.js')).ok)return server}catch(e){}
  await sleep(170);
 }
 server.kill();
 throw Error('Local test site failed to start');
}
async function statusReady(page,frame,timeout=120000){
 await page.locator('#officialStatus[data-state="ready"]').waitFor({timeout});
 return await frame.locator('body').evaluate(()=>{
  const film=window.filmcraftLoad||{};
  return {filmReady:!!film.readyMs,filmFatal:film.fatal||null,
   soundReady:!document.querySelector('#soundcraft_loading'),
   canvas:document.querySelector('canvas')?.getBoundingClientRect().toJSON()||null};
 });
}
test('FilmCraft: verified WASM startup, real video import, new sequence, H.264 export, project file save and reopen',
 {timeout:420000},async()=>{
 const server=await serve();let browser=null;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1550,height:920}});
  const page=await context.newPage();page.setDefaultTimeout(55000);
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(BASE+encodeURIComponent(TARGETS[0][0]),{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#officialEditorFrame');
  const ready=await statusReady(page,frame);
  assert.ok(ready.filmReady,'FilmCraft startup signal absent');
  assert.equal(ready.filmFatal,null);
  assert.ok(ready.canvas.width>300&&ready.canvas.height>200,'Canvas did not get its drawing dimensions');
  const cap=await page.evaluate(()=>document.getElementById('officialDiagnosticReport').hidden);
  assert.equal(cap,true);
  await page.locator('#officialDiagnostics').click();
  await page.locator('#officialDiagnosticReport:not([hidden])').waitFor();
  const report=JSON.parse(await page.locator('#officialDiagnosticReport').textContent());
  assert.ok(report.runtime.startupMs>0);
  assert.ok(report.filmcraftInfo&&typeof report.filmcraftInfo==='object');
  console.log('FILMCRAFT RUNTIME',JSON.stringify({startupMs:report.runtime.startupMs,
   info:report.filmcraftInfo,capabilities:report.capabilities}).slice(0,2500));

  const imported=await frame.locator('body').evaluate(async (_element,path)=>{
   const importInfo=await window.filmcraft.importUrl('/'+path);
   const item=importInfo.items?.[0];
   if(item===undefined)throw Error('No imported clips '+JSON.stringify(importInfo));
   const sequence=await window.filmcraft.execute('file.newSequence',{fromItem:item,name:'뚝딱 2.1 영상 검수'});
   const inspected=await window.filmcraft.inspect();
   return {importInfo,sequence,sequenceActive:inspected.activeSequence,backend:window.filmcraft.info()};
  },FILENAME);
  assert.ok(imported.importInfo.items?.length>0,'Real H.264/AAC import must return at least one item');
  assert.ok(imported.sequence,'New sequence command must return a result');
  console.log('FILMCRAFT IMPORT',JSON.stringify(imported).slice(0,2700));

  await frame.locator('body').evaluate(async()=>{
   await window.filmcraft.request('ui.playback',{action:'play'});
  });
  await sleep(1100);
  const playback=await frame.locator('body').evaluate(async()=>{
   const i=await window.filmcraft.inspect();
   await window.filmcraft.request('ui.playback',{action:'stop'});
   return {playhead:i.playhead,playback:i.playback};
  });
  console.log('FILMCRAFT PLAYBACK',JSON.stringify(playback));

  const mediaDownload=page.waitForEvent('download',{timeout:275000});
  const exportResult=await frame.locator('body').evaluate(async()=>{
   return await window.filmcraft.execute('file.exportMedia',
    {format:'h264',path:'/exports/gulliver-qa-video.mp4',bitrateKbps:800});
  });
  assert.ok(exportResult?.job!==undefined,'Export must create a real render job');
  console.log('FILMCRAFT EXPORT START',JSON.stringify(exportResult));
  const exportStatus=await frame.locator('body').evaluate(async (_element,job)=>{
   const until=Date.now()+230000;
   while(Date.now()<until){
    const jobs=await window.filmcraft.execute('jobs.list');
    const found=jobs.find(j=>j.id===job);
    if(found?.finished)return found;
    await new Promise(done=>setTimeout(done,500));
   }
   throw Error('Export job did not finish in 230 seconds');
  },exportResult.job);
  assert.ok(exportStatus.finished,'Export job must finish');
  assert.ok(!exportStatus.error,'Render error: '+JSON.stringify(exportStatus));
  const exported=await mediaDownload;
  const mp4=fs.readFileSync(await exported.path());
  assert.ok(mp4.length>1000,'H.264 output unexpectedly empty');
  assert.ok(mp4.subarray(4,8).toString('ascii')==='ftyp','Exported file is not MP4');
  console.log('FILMCRAFT EXPORT RESULT',JSON.stringify({job:exportStatus,filename:exported.suggestedFilename(),bytes:mp4.length}).slice(0,3000));
  const ff=cp.spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name','-of','json',await exported.path()],{encoding:'utf8',timeout:15000});
  assert.equal(ff.status,0,'ffprobe could not read output: '+ff.stderr);
  const probe=JSON.parse(ff.stdout);
  assert.ok(probe.streams.some(s=>s.codec_type==='video'),'MP4 lacks a video stream');
  assert.ok(Number(probe.format.duration)>0,'MP4 duration must be positive');

  // Browser file-format roundtrip. .fcproj should contain project JSON and
  // reference imported local media; a browser reopen must not crash.
  const saveResult=await frame.locator('body').evaluate(async()=>{
   const response=await window.filmcraft.execute('file.saveAs',{path:'/exports/gulliver-qa-project.fcproj'});
   const files=await window.filmcraft.files();
   return{response,found:files.filter(f=>String(f.path).includes('gulliver-qa-project.fcproj'))};
  });
  console.log('FILMCRAFT PROJECT SAVE',JSON.stringify(saveResult).slice(0,2000));
  assert.ok(saveResult.found.length,'Expected generated FilmCraft project file');
  const reopened=await frame.locator('body').evaluate(async()=>{
   const payload=await window.filmcraft.readFile('/exports/gulliver-qa-project.fcproj');
   const file=new File([payload],'gulliver-qa-project.fcproj',{type:'application/json'});
   const opened=await window.filmcraft.openProject(file);
   return{opened,bytes:payload.length,fatal:window.filmcraftLoad.fatal||null};
  });
  assert.ok(reopened.bytes>100,'Project file too small');
  assert.equal(reopened.fatal,null,'Project reopen caused a WASM fatal error');
  console.log('FILMCRAFT REOPEN',JSON.stringify(reopened));
  assert.equal(failures.filter(x=>/RuntimeError|panic|unreachable/i.test(x)).length,0,
    'WASM crash detected: '+failures.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('SoundCraft: compiled WASM opens real egui, audio context resumes after gesture and diagnostic state is accurate',
 {timeout:155000},async()=>{
 const server=await serve();let browser=null;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1450,height:900}});
  const page=await context.newPage();
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(BASE+encodeURIComponent(TARGETS[1][0]),{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#officialEditorFrame');
  const ready=await statusReady(page,frame);
  assert.ok(ready.soundReady,'SoundCraft loading overlay did not clear after Rust app startup');
  const uiPng=await frame.locator('#soundcraft_canvas').screenshot({timeout:30000});
  fs.writeFileSync('/tmp/soundcraft-qa.png',uiPng);
  const jpegResult=cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',
    '-i','/tmp/soundcraft-qa.png','-vf','scale=700:-1','-q:v','12','/tmp/soundcraft-qa.jpg']);
  assert.equal(jpegResult.status,0,'Screenshot compression failed');
  console.log('SOUNDCRAFT_QA_JPEG='+fs.readFileSync('/tmp/soundcraft-qa.jpg').toString('base64'));

  assert.ok(ready.canvas.width>300&&ready.canvas.height>200,'SoundCraft canvas has no area');
  const bindings=await frame.locator('body').evaluate(()=>({bindings:!!window.wasmBindings,
    canvasWidth:document.querySelector('#soundcraft_canvas').width,
    hasLoading:!!document.querySelector('#soundcraft_loading')}));
  assert.ok(bindings.bindings,'SoundCraft WebAssembly bindings missing');
  assert.equal(bindings.hasLoading,false);
  // AudioContext is created by the original SoundCraft WebAssembly code;
  // clicking inside this iframe is the supported gesture to resume WebAudio.
  await frame.locator('canvas').click({position:{x:320,y:80}});
  await sleep(700);
  await page.locator('#officialDiagnostics').click();
  const report=JSON.parse(await page.locator('#officialDiagnosticReport').textContent());
  assert.equal(report.runtime.ready,true);
  assert.equal(report.runtime.loaderVisible,false);
  assert.equal(report.capabilities.audioContext,true);
  console.log('SOUNDCRAFT RUNTIME',JSON.stringify(report).slice(0,2400));
  assert.equal(failures.filter(x=>/RuntimeError|panic|unreachable/i.test(x)).length,0,
    'WASM startup crash detected: '+failures.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
