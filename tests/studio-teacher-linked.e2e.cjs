'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8926,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'studio-teacher-next.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('server did not start')}
test('three real teaching tools create editable linked pages, refresh in-place, undo, save and reopen',{timeout:160000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1360,height:950}});
  const page=await ctx.newPage();page.setDefaultTimeout(18000);
  await page.goto(studio,{waitUntil:'domcontentloaded'});
  const shell=page.frameLocator('#editorFrame');
  await shell.locator('[data-design-tab="teacher"]').click();
  const canvas=()=>shell.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  const tool=async text=>{
   await shell.locator('.teacher-live-tile').filter({hasText:text}).click();
   await shell.locator('#teacherLiveDialog[open]').waitFor({state:'visible'});
   await shell.locator('#teacherCopyResult').waitFor({state:'visible'});
  };
  const native=shell.frameLocator('#teacherLiveFrame');
  const copied=async(kind)=>{
   const before=(await canvas()).pages.length;
   await shell.locator('#teacherCopyResult').click();
   await shell.locator('#teacherLiveDialog').waitFor({state:'hidden'});
   const after=await canvas();
   assert.ok(after.pages.length>before,kind+' did not add real pages');
   assert.ok(after.pages.some(p=>p.teacherSource?.kind===kind),kind+' source association lost');
   return after;
  };
  await tool('이번 수업 알리미');
  await native.locator('#input-topic').waitFor({state:'visible'});
  await shell.locator('#teacherCopyResult').click();
  assert.match(await shell.locator('#teacherLiveStatus').textContent(),/예시 수업/);
  await native.locator('#input-topic').fill('가을 과일 탐험');
  let r=await copied('lesson');
  assert.match(JSON.stringify(r.pages),/가을 과일 탐험/);
  const lessonCount=r.pages.length;
  await tool('이번 수업 알리미');
  await native.locator('#input-topic').fill('새로운 과일 관찰');
  await shell.locator('#teacherRefreshResult').waitFor({state:'visible'});
  page.once('dialog',dialog=>dialog.accept());
  await shell.locator('#teacherRefreshResult').click();
  await shell.locator('#teacherLiveDialog').waitFor({state:'hidden'});
  r=await canvas();
  assert.equal(r.pages.length,lessonCount,'refresh should replace, never duplicate');
  assert.match(JSON.stringify(r.pages),/새로운 과일 관찰/);
  assert.doesNotMatch(JSON.stringify(r.pages),/가을 과일 탐험/);
  await shell.locator('#undo').click();
  r=await canvas();assert.match(JSON.stringify(r.pages),/가을 과일 탐험/);
  // Roles: actual UI, first generate, then explicitly confirm.
  await tool('학급 역할 배정');
  const roles=native;
  await roles.locator('[data-tab="students"]').click();
  await roles.locator('#studentNames').fill('봄,진');
  await roles.locator('#addStudentsBtn').click();
  await roles.locator('[data-tab="results"]').click();
  await roles.locator('#runBtn').click();
  await shell.locator('#teacherCopyResult').click();
  assert.match(await shell.locator('#teacherLiveStatus').textContent(),/이번 역할 확정/);
  await roles.locator('#confirmBtn').click();
  r=await copied('roles');assert.match(JSON.stringify(r.pages),/봄/);
  // Group maker runs and reveals all members before confirmation.
  await tool('모둠 만들기');
  const groups=native;
  await groups.locator('#studentsInput').fill('봄\n진\n솔\n한');
  await groups.locator('#groupSize').fill('2');
  await groups.locator('#startBtn').click();
  await groups.locator('#revealAllBtn').click();
  await shell.locator('#teacherCopyResult').click();
  assert.match(await shell.locator('#teacherLiveStatus').textContent(),/이번 모둠 확정/);
  await groups.locator('#confirmBtn').click();
  r=await copied('groups');
  assert.match(JSON.stringify(r.pages),/1모둠/);assert.match(JSON.stringify(r.pages),/솔/);
  assert.ok(r.pages.length>=4);
  // Do not lose provenance through project persistence and reopening.
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const saved=await page.evaluate(async()=>{const items=await GulliverStudioStorage.projects();return items.find(x=>x.kind==='canvas'&&x.payload?.pages?.some(p=>p.teacherSource?.kind==='groups'))?.id});
  assert.ok(saved,'project containing linked materials not saved');
  const other=await ctx.newPage();await other.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await other.evaluate(async id=>{const p=await GulliverStudioStorage.getProject(id);await GulliverStudioBridge.start('canvas',p)},saved);
  const reopened=await other.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(reopened.pages.length,r.pages.length);
  for(const kind of ['lesson','roles','groups'])assert.ok(reopened.pages.some(p=>p.teacherSource?.kind===kind),kind+' lost after reload');
  console.log('TEACHER_LINKED_ROUNDTRIP '+JSON.stringify({pages:r.pages.length,teachers:3,refreshed:true,savedReopened:true}));
 }finally{await browser?.close();server.kill('SIGTERM')}
});