'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8893,base='http://127.0.0.1:'+port+'/';
async function ready(){
 for(let n=0;n<70;n++){try{if((await fetch(base+'lesson-app.js')).ok)return}catch{}
 await new Promise(resolve=>setTimeout(resolve,180));}
 throw Error('Lesson 5.3 server did not start');
}
test('5.3 Chrome: plan a lesson, import saved teacher activities, teach a quiz, reopen saved lesson',{timeout:130000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(18000);
  const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto(base+'lesson.html',{waitUntil:'domcontentloaded'});
  if(!await page.locator('#lessonGoal').isVisible())await page.locator('#workInfo').click();await page.locator('#lessonGoal').fill('친구와 함께 인사말 알아보기');
  if(!await page.locator('#lessonAudience').isVisible())await page.locator('#workInfo').click();await page.locator('#lessonAudience').fill('열매 1반');
  await page.locator('[data-add="quiz"]').click();
  if(!await page.locator('#settings textarea').first().isVisible())await page.locator('#workNotes').click();await page.locator('#settings textarea').last().fill('한국 수도? | 서울\n일본 수도? | 도쿄');
  await page.locator('#settings textarea').last().press('Tab');
  await page.waitForFunction(()=>document.querySelectorAll('.quiz-view .quiz-question').length===1);
  await page.locator('.quiz-reveal').click();
  await page.locator('.quiz-answer:not([hidden])').waitFor();
  await page.evaluate(()=>{
   ClassroomWorkspace.save({kind:'timer',title:'우리 반 수업 시간표',payload:{events:[{name:'인사하기',durationSec:60},{name:'공동 놀이',durationSec:120}]}});
   ClassroomWorkspace.save({kind:'quiz',title:'저장한 인사 퀴즈',payload:{cards:[{front:'Bonjour는 어느 나라?',back:'프랑스'}]}});
  });
  await page.locator('#fromStudio').click();
  await page.locator('#libraryDialog').waitFor();
  await page.locator('#libraryList button.import-source').filter({hasText:'저장한 인사 퀴즈'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#stepList .step-button').length===2);
  await page.locator('#fromStudio').click();
  await page.locator('#libraryList button.import-source').filter({hasText:'우리 반 수업 시간표'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#stepList .step-button').length===4);
  const id=await page.evaluate(()=>new URL(location.href).searchParams.get('lesson'));
  assert.ok(id);
  await page.waitForFunction(async id=>(await LessonStorage.get(id))?.steps?.length===4,id);
  const record=await page.evaluate(async id=>await LessonStorage.get(id),id);
  assert.equal(record.goal,'친구와 함께 인사말 알아보기');assert.equal(record.audience,'열매 1반');
  assert.deepEqual(record.steps.map(x=>x.kind),['quiz','quiz','timer','timer']);
  await page.locator('#stepList .step-button').first().click();
  await page.locator('#startLesson').click();
  await page.locator('body.running').waitFor();
  await page.locator('.quiz-view .quiz-question').filter({hasText:'한국 수도?'}).waitFor();
  await page.locator('.quiz-reveal').click();
  await page.locator('.quiz-answer:not([hidden])').filter({hasText:'서울'}).waitFor();
  await page.locator('#next').click();
  await page.locator('.quiz-view .quiz-question').filter({hasText:'일본 수도?'}).waitFor();
  await page.locator('#exitRun').click();
  await page.goto(base+'lesson.html?lesson='+encodeURIComponent(id),{waitUntil:'domcontentloaded'});
  if(!await page.locator('#lessonAudience').isVisible())await page.locator('#workInfo').click();await page.locator('#lessonAudience').waitFor();
  await page.waitForFunction(()=>document.querySelector('#lessonGoal')?.value==='친구와 함께 인사말 알아보기');
  assert.equal(await page.locator('#stepList .step-button').count(),4);
  assert.deepEqual(exceptions,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('5.3 Chrome: guided intro/activity/closing creates three editable steps',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server','8894','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  const url='http://127.0.0.1:8894/';
  for(let i=0;i<70;i++){try{if((await fetch(url+'lesson-core.js')).ok)break}catch{}await new Promise(resolve=>setTimeout(resolve,180))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  await page.goto(url+'lesson.html',{waitUntil:'domcontentloaded'});
  await page.locator('#createLessonFlow').click();
  await page.waitForFunction(()=>document.querySelectorAll('#stepList .step-button').length===3);
  assert.deepEqual(await page.locator('#stepList .step-button strong').allTextContents(),['도입 · 오늘의 배움','활동 · 함께 해 보기','마무리 · 돌아보기']);
  await page.waitForFunction(async()=>{const id=new URL(location.href).searchParams.get('lesson');return (await LessonStorage.get(id))?.steps?.length===3});
  const steps=await page.evaluate(async()=>{
   const id=new URL(location.href).searchParams.get('lesson');const row=await LessonStorage.get(id);return row.steps;
  });
  assert.equal(steps.length,3);assert.ok(steps.every(s=>s.kind==='canvas'&&s.payload?.pages?.length));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
