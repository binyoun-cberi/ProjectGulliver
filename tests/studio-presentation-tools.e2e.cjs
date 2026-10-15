'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8899,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<130;i++){try{if((await fetch(base+'studio-presentation-tools.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('test site unavailable')}
const inspect=frame=>frame.locator('body').evaluate(()=>({
 active:GulliverStudioAdapter.capture().active,
 pages:GulliverStudioAdapter.capture().pages.length,
 seconds:GulliverStudioAdapter.getSceneTime(),
 playing:GulliverStudioAdapter.isPlaying(),
 presenting:GulliverStudioAdapter.isPresentationActive(),
 fullscreen:document.fullscreenElement?.id||null,
 fallback:document.getElementById('stageView').classList.contains('lesson-fallback'),
 toolOpen:GulliverTeacherLive.isOpen()
}));
test('teacher tools open on current slide, pause timeline, import a page, return and resume in fullscreen and iPhone fallback',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const desktop=await browser.newContext({viewport:{width:1200,height:850}});
  const page=await desktop.newPage();page.setDefaultTimeout(18000);const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#lessonPresenterDock').waitFor({state:'attached'});
  await frame.locator('body').evaluate(()=>{
   const room=GulliverUnifiedCore.starter('blank');
   room.pages[0].duration=10;
   room.pages.push(GulliverUnifiedCore.makePage('오늘 활동',
      [GulliverUnifiedCore.element('text',{content:'오늘 함께 배우는 놀이',x:130,y:190,w:700,h:100})]));
   room.pages[1].duration=15;
   GulliverStudioAdapter.apply(room);
   GulliverStudioAdapter.seekPage(1);
   localStorage.setItem('classDashboardStateV2',JSON.stringify({
    currentTemp:35,goalTemp:80,records:[{reason:'친구 응원',student:'민',type:'up',amount:5,date:'10월 15일'}],
    plusReasons:[{id:1,text:'협력',amount:5}],minusReasons:[{id:2,text:'약속',amount:1}]
   }));
  });
  await frame.locator('#present').click();
  await frame.locator('#lessonPresenterDock').waitFor({state:'visible'});
  assert.match(await frame.locator('#lessonSlideCount').innerText(),/2\s*\/\s*2/);
  const initial=await inspect(frame);assert.equal(initial.presenting,true);assert.equal(initial.active,1);assert.equal(initial.playing,true);
  await frame.locator('#lessonOpenTools').click();
  await frame.locator('#lessonToolPicker').waitFor({state:'visible'});
  await frame.locator('[data-presenter-tool="praise"]').click();
  await frame.locator('#teacherLiveDialog').waitFor({state:'visible'});
  const paused=await inspect(frame);
  assert.equal(paused.toolOpen,true);assert.equal(paused.playing,false);assert.equal(paused.active,1);
  await new Promise(resolve=>setTimeout(resolve,450));
  const frozen=await inspect(frame);assert.ok(Math.abs(frozen.seconds-paused.seconds)<.08,'presentation clock pauses during native teacher tool');
  await frame.locator('#teacherCopyResult').click();
  await frame.locator('#teacherLiveDialog').waitFor({state:'hidden'});
  const restored=await inspect(frame);
  assert.equal(restored.pages,3,'praise page added non-destructively');
  assert.equal(restored.active,1,'returns to original live slide not generated snapshot');
  assert.equal(restored.playing,true,'resumes prior playback state');
  assert.equal(restored.presenting,true,'keeps fullscreen or immersive presentation active');
  assert.ok(Math.abs(restored.seconds-paused.seconds)<.65,'resumes near exact clock');
  assert.match(await frame.locator('#lessonSlideCount').innerText(),/2\s*\/\s*3/);
  await frame.locator('#lessonOpenTools').click();
  await frame.locator('[data-presenter-tool="qr"]').click();
  await frame.locator('#teacherLiveClose').click();
  const withoutImport=await inspect(frame);
  assert.equal(withoutImport.pages,3,'closing without import leaves slides unchanged');
  assert.equal(withoutImport.active,1);
  await frame.locator('#lessonPlayPause').click();
  const stopped=await inspect(frame);assert.equal(stopped.playing,false);
  await frame.locator('#lessonPrev').click();assert.equal((await inspect(frame)).active,0);
  await frame.locator('#lessonExit').click();
  await frame.locator('#lessonPresenterDock').waitFor({state:'hidden'});
  assert.equal((await inspect(frame)).presenting,false);

  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();phone.setDefaultTimeout(16000);
  phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(url,{waitUntil:'domcontentloaded'});
  const mf=phone.frameLocator('#editorFrame');
  await mf.locator('#lessonPresenterDock').waitFor({state:'attached'});
  await mf.locator('body').evaluate(()=>{
   const element=document.getElementById('stageView');
   element.requestFullscreen=()=>Promise.reject(new Error('iPhone Safari fullscreen unsupported'));
  });
  await mf.locator('#present').click();
  await mf.locator('#lessonPresenterDock').waitFor({state:'visible'});
  assert.equal((await inspect(mf)).fallback,true,'immersive fallback when iPhone fullscreen is unavailable');
  await mf.locator('#lessonOpenTools').click();
  await mf.locator('[data-presenter-tool="timer"]').click();
  assert.equal((await inspect(mf)).playing,false);
  await mf.locator('#teacherLiveClose').click();
  assert.equal((await inspect(mf)).presenting,true);
  assert.equal((await inspect(mf)).playing,true);
  await mf.locator('#lessonExit').click();
  assert.equal((await inspect(mf)).fallback,false);
  assert.equal((await inspect(mf)).playing,false);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
