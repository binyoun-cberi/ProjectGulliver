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
  // Persist a REAL original FilmCraft project in the unified browser vault,
  // then reload the standalone official editor through the 2.3 deep link.
  const savedNativeId=await page.evaluate(async()=>{
   const bytes=await document.getElementById('officialEditorFrame').contentWindow.filmcraft.readFile('/exports/gulliver-qa-project.fcproj');
   const blob=new Blob([bytes],{type:'application/json'});
   const id='official-film-qa-'+Date.now();
   await GulliverStudioStorage.saveOfficial({id,kind:'video',name:'gulliver-qa-project.fcproj',title:'실제 영상 원본',
    size:blob.size,blob,createdAt:Date.now(),updatedAt:Date.now(),folderId:''});
   return id;
  });
  await page.goto(BASE+encodeURIComponent('영상 뚝딱.html')+'?officialId='+encodeURIComponent(savedNativeId),{waitUntil:'domcontentloaded'});
  // Detect success or an actionable error quickly; record the native loader
  // state instead of waiting silently for a missing success string.
  try{
   await page.waitForFunction(()=>{
    const el=document.querySelector('#officialStatus');
    return /FilmCraft에서 열었어요|고급 작업 재열기 실패|실행을 확인하지 못했어요/.test(el?.textContent||'');
   },null,{timeout:90000});
  }catch(e){console.log('FILMCRAFT 2.3 REOPEN WAIT',String(e))}
  const nativeDiagnostics=await page.evaluate(async()=>{
   const element=document.getElementById('officialStatus'),frame=document.getElementById('officialEditorFrame');
   const w=frame?.contentWindow,native=await GulliverStudioStorage.official();
   return {status:element?.textContent,state:element?.dataset.state,frameSrc:frame?.getAttribute('src'),
    mode:document.getElementById('officialMode')?.getAttribute('aria-selected'),
    native:native.map(x=>({id:x.id,name:x.name,bytes:x.blob?.size})),
    load:w?.filmcraftLoad||null,hasApi:!!w?.filmcraft?.openProject};
  });
  console.log('FILMCRAFT 2.3 REOPEN DIAGNOSTICS',JSON.stringify(nativeDiagnostics).slice(0,4000));
  assert.match(nativeDiagnostics.status||'',/프로젝트를 FilmCraft에서 열었어요/);
  const reopenedNative=await page.frameLocator('#officialEditorFrame').locator('body').evaluate(async()=>{
   const state=await window.filmcraft.inspect();
   return {active:state.activeSequence,crash:window.filmcraftLoad.fatal||null};
  });
  assert.equal(reopenedNative.crash,null,'Reloading the vault copy crashed FilmCraft');
  console.log('FILMCRAFT 2.3 VAULT REOPEN',JSON.stringify(reopenedNative).slice(0,1500));
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
  await frame.locator('#soundcraft_canvas').click({position:{x:420,y:170}});
  await page.keyboard.press('Control+s');
  await sleep(400);
  const savePopupPng=await frame.locator('#soundcraft_canvas').screenshot();
  fs.writeFileSync('/tmp/soundcraft-save-qa.png',savePopupPng);
  cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','/tmp/soundcraft-save-qa.png',
    '-vf','scale=700:-1','-q:v','12','/tmp/soundcraft-save-qa.jpg']);
  const savePromise=page.waitForEvent('download',{timeout:15000}).catch(error=>error);
  await page.keyboard.press('Enter');
  const session=await savePromise;
  if(session instanceof Error)throw new Error('SoundCraft Ctrl+S dialog did not save .scraftz: '+session.message);
  const sessionBytes=fs.readFileSync(await session.path());
  assert.ok(session.suggestedFilename().endsWith('.scraftz'),
    'SoundCraft should export a portable session bundle: '+session.suggestedFilename());
  assert.equal(sessionBytes.subarray(0,2).toString('ascii'),'PK','SoundCraft saved session must be ZIP');
  console.log('SOUNDCRAFT SESSION SAVED',JSON.stringify({file:session.suggestedFilename(),bytes:sessionBytes.length}));
  // Store the REAL SoundCraft session bundle without altering the original WASM.
  const originalSoundBundle='tests/fixtures/soundcraft-qa.scraftz';
  fs.writeFileSync(originalSoundBundle,sessionBytes);
  await page.locator('#officialProjectUpload').setInputFiles(originalSoundBundle);
  await page.waitForFunction(async()=>{
   const native=await GulliverStudioStorage.official();
   return native.some(x=>x.kind==='music'&&x.blob.size>1000000);
  },null,{timeout:90000});
  const savedDetails=await page.evaluate(async()=>{
   const rows=await GulliverStudioStorage.official();
   return {status:document.getElementById('officialStatus')?.textContent,
    native:rows.map(x=>({name:x.name,size:x.size,blobSize:x.blob?.size,opfs:!!x.opfsKey}))};
  });
  console.log('SOUNDCRAFT 2.4 OPFS ARCHIVE',JSON.stringify(savedDetails));
  assert.ok(savedDetails.native.some(x=>x.size===sessionBytes.length),
   'Saved SoundCraft must retain the exact 66MB original: '+JSON.stringify(savedDetails));

  // SoundCraft's official web shell supports dropping a session bundle
  // anywhere on its canvas; unlike Ctrl+O this path needs no OS picker.
  const restoredPath='tests/fixtures/soundcraft-qa.scraftz';
  fs.writeFileSync(restoredPath,sessionBytes);
  const drop=await frame.locator('#soundcraft_canvas').evaluate(async element=>{
   const result=await fetch('/tests/fixtures/soundcraft-qa.scraftz');
   if(!result.ok)throw Error('Test bundle HTTP status: '+result.status);
   const bytes=await result.blob();
   const file=new File([bytes],'Midnight Groove.scraftz',{type:'application/zip'});
   const dt=new DataTransfer();dt.items.add(file);
   element.dispatchEvent(new DragEvent('dragenter',{bubbles:true,cancelable:true,dataTransfer:dt}));
   element.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));
   element.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
   return{file:file.name,size:file.size,count:dt.files.length};
  });
  assert.equal(drop.count,1,'Native canvas drop failed to attach its session file');
  await sleep(2100);
  assert.equal(await frame.locator('#soundcraft_loading').count(),0,
    'SoundCraft restarted/froze after opening the saved session');
  const reopenPng=await frame.locator('#soundcraft_canvas').screenshot();
  fs.writeFileSync('/tmp/soundcraft-reopen-qa.png',reopenPng);
  cp.spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','/tmp/soundcraft-reopen-qa.png',
    '-vf','scale=700:-1','-q:v','12','/tmp/soundcraft-reopen-qa.jpg']);
  console.log('SOUNDCRAFT_REOPEN_JPEG='+fs.readFileSync('/tmp/soundcraft-reopen-qa.jpg').toString('base64'));
  console.log('SOUNDCRAFT SESSION REOPEN DROP',JSON.stringify(drop));

  assert.equal(failures.filter(x=>/RuntimeError|panic|unreachable/i.test(x)).length,0,
    'WASM startup crash detected: '+failures.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
