'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const browserInstalled=Boolean(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync));

test('Starting a lesson displays only the presentation, fits slide and controls, and restores editing',{timeout:90000,skip:!browserInstalled&&'Chrome/Chromium is not installed in this environment'},async()=>{
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
  await page.waitForFunction(()=>{const body=document.querySelector('#editorFrame')?.contentDocument?.body;return !!body?.classList.contains('common-work-presenting')});
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

test('Lesson student window receives only the current public slide, quiz answer reveal and timer state',{timeout:90000,skip:!browserInstalled&&'Chrome/Chromium is not installed in this environment'},async()=>{
 const base='http://127.0.0.1:8796/';
 const server=spawn('python3',['-m','http.server','8796','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<80;i++){try{const r=await fetch(base+'lesson.html');await r.arrayBuffer();if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext();
  await context.addInitScript(()=>{
   const Native=window.BroadcastChannel;if(!Native)return;
   window.__studentDisplayAudit=[];
   window.BroadcastChannel=function(name){const channel=new Native(name),post=channel.postMessage.bind(channel);channel.postMessage=data=>{if(String(name).startsWith('gulliver.student-display.v1.'))window.__studentDisplayAudit.push(data);return post(data)};return channel};
   window.BroadcastChannel.prototype=Native.prototype;
  });
  const teacher=await context.newPage();teacher.setDefaultTimeout(12000);
  await teacher.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  const lessonId=await teacher.evaluate(async()=>{
   const lesson=LessonCore.blank();lesson.title='비공개 수업 제목';lesson.goal='비공개 수업 목표 sentinel';lesson.audience='비공개 대상 sentinel';
   const deck=BalpyoCore.starter('lesson');deck.slides[0].title='학생에게 보여줄 제목';deck.slides[0].body='학생에게 보여줄 내용';deck.slides[0].notes='발표자 노트 sentinel';
   const slides=LessonCore.step('slides',deck);slides.notes='활동 메모 sentinel';
   const quiz=LessonCore.step('quiz',{cards:[{front:'학생 퀴즈 문제',back:'미공개 정답 sentinel'}]});quiz.notes='퀴즈 메모 sentinel';
   const timer=LessonCore.step('timer');timer.title='활동 타이머';timer.seconds=45;timer.notes='타이머 메모 sentinel';
   const video=LessonCore.step('video');video.title='미지원 영상';lesson.steps=[slides,quiz,timer,video];
   await LessonStorage.save(lesson);return lesson.id;
  });
  await teacher.goto(base+'lesson.html?lesson='+encodeURIComponent(lessonId),{waitUntil:'domcontentloaded'});
  await teacher.locator('#stepList .step-button').first().waitFor();
  await teacher.locator('#startLesson').click();
  const popup=context.waitForEvent('page');await teacher.locator('#studentDisplayOpen').click();const student=await popup;student.setDefaultTimeout(12000);
  await student.locator('#displayConnection[data-state="connected"]').waitFor();
  await student.locator('.lesson-run-slide h1').waitFor();
  assert.equal(await student.locator('.lesson-run-slide h1').textContent(),'학생에게 보여줄 제목');
  assert.equal(await student.locator('.lesson-run-slide p').textContent(),'학생에게 보여줄 내용');
  assert.match(await student.locator('#displayAnnouncement').textContent(),/학생에게 보여줄 제목/);
  await teacher.locator('#studentDisplayToggle').click();await student.getByText('선생님이 다음 자료를 준비하고 있어요').waitFor();
  await student.locator('#displayAnnouncement').getByText('선생님이 다음 자료를 준비하고 있어요').waitFor();
  await teacher.getByText('학생 화면을 가렸어요.',{exact:true}).waitFor();
  await teacher.locator('#studentDisplayToggle').click();await student.locator('.lesson-run-slide h1').waitFor();
  await teacher.setViewportSize({width:390,height:844});
  const mobile=await teacher.evaluate(()=>{const controls=document.querySelector('#studentDisplayControls').getBoundingClientRect(),previous=document.querySelector('#previous').getBoundingClientRect(),next=document.querySelector('#next').getBoundingClientRect();return{scrollWidth:document.documentElement.scrollWidth,controlsLeft:controls.left,controlsRight:controls.right,controlsTop:controls.top,navBottom:Math.max(previous.bottom,next.bottom)}});
  assert.ok(mobile.scrollWidth<=392,'teacher presenter overflows at 390px: '+JSON.stringify(mobile));assert.ok(mobile.controlsLeft>=0&&mobile.controlsRight<=392,'student controls leave mobile viewport: '+JSON.stringify(mobile));assert.ok(mobile.controlsTop>=mobile.navBottom-1,'student controls overlap presenter navigation: '+JSON.stringify(mobile));
  await teacher.setViewportSize({width:1280,height:800});
  const firstPayloads=await teacher.evaluate(()=>JSON.stringify(window.__studentDisplayAudit));
  for(const secret of ['비공개 수업 제목','비공개 수업 목표 sentinel','비공개 대상 sentinel','발표자 노트 sentinel','활동 메모 sentinel','미공개 정답 sentinel','퀴즈 메모 sentinel'])assert.ok(!firstPayloads.includes(secret),'private field leaked: '+secret);
  await teacher.locator('#next').click();await student.locator('.lesson-run-quiz h1').waitFor();
  assert.equal(await student.locator('.lesson-run-quiz h1').textContent(),'학생 퀴즈 문제');
  assert.equal(await student.getByText('미공개 정답 sentinel',{exact:true}).count(),0);
  await teacher.locator('.quiz-reveal').click();await student.getByText('미공개 정답 sentinel',{exact:true}).waitFor();
  assert.match(await student.locator('#displayAnnouncement').textContent(),/정답 공개.*미공개 정답 sentinel/);
  await teacher.locator('#next').click();await student.locator('.lesson-run-timer strong').waitFor();
  assert.equal(await student.getByText('미공개 정답 sentinel',{exact:true}).count(),0,'old answer must be cleared when advancing');
  await teacher.locator('#next').click();await student.getByText('이 자료는 학생 화면에서 지원되지 않아요').waitFor();
  await teacher.getByText('현재 자료는 학생 화면 미지원',{exact:false}).waitFor();
  await teacher.locator('#exitRun').click();await student.getByText('교사 화면 연결이 종료됐어요').waitFor();
  await teacher.locator('#startLesson').click();
  const pagesBeforeRestart=teacher.context().pages().length;
  await teacher.locator('#studentDisplayOpen').click();
  await student.locator('#displayConnection[data-state="connected"]').waitFor();
  assert.equal(teacher.context().pages().length,pagesBeforeRestart,'restarting a lesson should reuse the existing student display window');
  await teacher.locator('#exitRun').click();await student.getByText('교사 화면 연결이 종료됐어요').waitFor();
  await teacher.locator('#startLesson').click();
  await teacher.evaluate(()=>{window.open=()=>null});
  const blockedDialog=teacher.waitForEvent('dialog');await teacher.locator('#studentDisplayOpen').click();const dialog=await blockedDialog;assert.match(dialog.message(),/학생 화면 창이 차단/);await dialog.accept();
  assert.equal(await teacher.locator('body').evaluate(el=>el.classList.contains('running')),true,'popup failure must not stop the lesson');
  assert.equal(await teacher.locator('#fullScreen').isVisible(),true,'same-window full-screen fallback remains available');
  assert.match(await teacher.locator('#status').textContent(),/전체화면 버튼으로 수업을 계속/);
  await context.close();
 }finally{await browser?.close();server.kill()}
});
