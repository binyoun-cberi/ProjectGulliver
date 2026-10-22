'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const base='http://127.0.0.1:8777/';
async function ready(){for(let i=0;i<100;i++){try{const response=await fetch(base+'studio-activity-core.js');await response.arrayBuffer();if(response.ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('server unavailable')}
async function svg(page){return page.locator('.display-canvas-image').evaluate(e=>decodeURIComponent(e.src.slice(e.src.indexOf(',')+1)))}
async function contains(page,text){await page.waitForFunction(text=>{const image=document.querySelector('.display-canvas-image');return image&&decodeURIComponent(image.src.slice(image.src.indexOf(',')+1)).replace(/<[^>]*>/g,'').includes(text)},text)}
test('배정·퀴즈·타이머를 두 모니터에서 조작하고 비공개 정보를 전송하지 않음',{timeout:60000},async()=>{
 const server=spawn('python3',['-m','http.server','8777','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({...(process.env.GULLIVER_CHROME_PATH?{executablePath:process.env.GULLIVER_CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1400,height:960}}),teacher=await context.newPage(),errors=[];
  teacher.on('pageerror',e=>errors.push(e.message));
  await teacher.goto(base+encodeURIComponent('통합 캔버스.html')+'?preset=blank',{waitUntil:'networkidle'});
  await teacher.locator('[data-design-tab="teacher"]').click();
  await teacher.evaluate(()=>Gulliver.saveClassroom({className:'활동 검증반',students:Array.from({length:7},(_,i)=>({id:'s'+i,name:'검증학생'+i}))}));
  await teacher.locator('[data-add-activity="assignment"]').click();
  await teacher.locator('[data-import-roster]').click();
  await teacher.locator('[name="groupSize"]').fill('3');
  await teacher.locator('.activity-settings button[type="submit"]').click();
  await teacher.locator('[data-activity-control="assign"]').click();
  const assigned=await teacher.evaluate(()=>GulliverStudioAdapter.getActiveActivities()[0].activity);
  assert.equal(assigned.result.length,3);assert.equal(assigned.published,false);
  assert.ok((await teacher.locator('.activity-private-preview').textContent()).includes('검증학생0'));
  const popup=context.waitForEvent('page');await teacher.locator('#canvasStudentOpen').click();const student=await popup;
  student.on('pageerror',e=>errors.push(e.message));
  await contains(student,'선생님이 결과를 준비');assert.ok(!(await svg(student)).includes('검증학생'));
  await teacher.locator('[data-activity-control="publish"]').click();await contains(student,'검증학생0');
  await teacher.locator('[data-activity-control="assign"]').click();await contains(student,'선생님이 결과를 준비');assert.ok(!(await svg(student)).includes('검증학생'));
  await teacher.locator('[data-add-activity="quiz"]').click();
  await teacher.locator('[name="cards"]').fill('첫 번째 질문 | 비공개정답가\n두 번째 질문 | 비공개정답나');
  await teacher.locator('.activity-settings button[type="submit"]').click();await contains(student,'첫 번째 질문');assert.ok(!(await svg(student)).includes('비공개정답'));
  await teacher.locator('[data-activity-control="reveal"]').click();await contains(student,'비공개정답가');assert.ok(!(await svg(student)).includes('비공개정답나'));
  await teacher.locator('[data-activity-control="next"]').click();await contains(student,'두 번째 질문');assert.ok(!(await svg(student)).includes('비공개정답'));
  // Save/restore retains both the stable student IDs and quiz progress.
  const restored=await teacher.evaluate(async()=>{const a=GulliverStudioAdapter,model=JSON.parse(JSON.stringify(a.capture()));a.apply(model);return{ids:a.getActiveActivities()[0].activity.students.map(s=>s.id),index:a.getActiveActivities()[1].activity.index,size:(await a.exportImage()).size}});
  assert.deepEqual(restored.ids,Array.from({length:7},(_,i)=>'s'+i));assert.equal(restored.index,1);assert.ok(restored.size>1000);
  await teacher.locator('#canvasStudentHide').click();await student.getByRole('heading',{name:'잠시 기다려 주세요',exact:true}).waitFor();assert.equal(await student.locator('.display-canvas-image').count(),0);
  await teacher.locator('#canvasStudentHide').click();await contains(student,'두 번째 질문');
  await teacher.locator('[data-add-activity="timer"]').click();await teacher.locator('[name="seconds"]').fill('10');await teacher.locator('.activity-settings button[type="submit"]').click();await teacher.locator('.activity-settings [data-activity-control="start"]').click();await student.waitForFunction(()=>{const e=document.querySelector('.display-canvas-image');return e&&/>00:0[1-9]</.test(decodeURIComponent(e.src))});await teacher.locator('.activity-settings [data-activity-control="pause"]').click();
  // Page changes project the new page rather than leaving the old quiz visible.
  await teacher.locator('[data-design-tab="pages"]').click();await teacher.locator('[data-pane="pages"]').waitFor({state:'visible'});await teacher.getByRole('button',{name:'새 페이지 추가',exact:false}).click();await student.waitForFunction(()=>{const e=document.querySelector('.display-canvas-image');return e&&!decodeURIComponent(e.src).includes('두 번째 질문')});
  await teacher.setViewportSize({width:390,height:844});await teacher.locator('[data-design-tab="teacher"]').click();await teacher.locator('[data-add-activity="assignment"]').waitFor({state:'visible'});assert.ok(await teacher.locator('.canvas-activities').evaluate(e=>e.getBoundingClientRect().width<=innerWidth));
  assert.deepEqual(errors,[]);await teacher.close({runBeforeUnload:true});await student.getByRole('heading',{name:'교사 화면 연결이 종료됐어요'}).waitFor();
 }finally{await browser?.close();server.kill()}
});
