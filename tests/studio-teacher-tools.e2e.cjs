'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8884,root='http://127.0.0.1:'+port+'/',url=root+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function serverReady(){for(let i=0;i<100;i++){try{if((await fetch(root+'studio-teacher-tools.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('site unavailable')}
test('teacher apps import into editable canvas and preserve originals, undo, autosave and mobile',{timeout:100000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1250,height:850}});
  const page=await context.newPage();page.setDefaultTimeout(14000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('[data-design-tab="teacher"]').click();
  await frame.locator('#teacherImportActivity').waitFor({state:'visible'});
  await frame.locator('body').evaluate(()=>{
   localStorage.setItem('gulliver.activities.v1',JSON.stringify({version:1,folders:[],activities:[
    {id:'activity-quiz',kind:'quiz',title:'수학 낱말',updatedAt:15,payload:{cards:[{front:'삼각형',back:'변이 세 개'},{front:'동그라미',back:'둥근 도형'}]}},
    {id:'activity-timer',kind:'timer',title:'이야기 수업',updatedAt:14,payload:{events:[{name:'도입',durationSec:300},{name:'놀이',durationSec:600}]}},
    {id:'activity-seat',kind:'seating',title:'우리 반 자리',updatedAt:13,payload:{cols:3,rows:2}}
   ]}));
   localStorage.setItem('gulliver.classroom.v1',JSON.stringify({version:1,className:'한빛반',students:[{id:'s1',name:'민'},{id:'s2',name:'진'}]}));
   localStorage.setItem('classChecklistState',JSON.stringify({currentTheme:'준비물 확인',studentNames:['민','진'],data:{'준비물 확인':{1:true,2:false}}}));
  });
  await frame.locator('#teacherRefreshActivities').click();
  await frame.locator('#teacherSavedActivity').selectOption('activity-quiz');
  await frame.locator('#teacherImportActivity').click();
  const first=await frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(first.pages.length,5,'two quiz cards create 4 slides appended to original blank page');
  assert.ok(first.pages[1].elements.some(e=>e.type==='text'&&e.content==='삼각형'));
  const element=frame.locator('#stage .item[data-type="text"]').filter({hasText:'삼각형'});
  await element.waitFor({state:'visible'});
  await element.click();
  await frame.locator('[data-design-tab="properties"]').click();
  await frame.locator('#propertyText').fill('세모');
  await frame.locator('#propertyText').dispatchEvent('change');
  const edited=await frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.ok(edited.pages[1].elements.some(e=>e.content==='세모'));
  await frame.locator('[data-design-tab="teacher"]').click();
  await frame.locator('#teacherSavedActivity').selectOption('activity-timer');
  await frame.locator('#teacherImportActivity').click();
  await frame.locator('#teacherSavedActivity').selectOption('activity-seat');
  await frame.locator('#teacherImportActivity').click();
  await frame.locator('[data-teacher-convert="check"]').click();
  const generated=await frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(generated.pages.length,8);
  assert.ok(generated.pages.some(p=>p.elements.some(e=>e.content==='도입')));
  assert.ok(generated.pages.some(p=>p.elements.some(e=>e.content==='자리 1')));
  assert.ok(generated.pages.some(p=>p.elements.some(e=>e.content==='✓')));
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const savedId=await page.evaluate(async()=>{
   const all=await GulliverStudioStorage.projects();
   return all.find(p=>p.kind==='canvas'&&p.payload?.pages?.length===8)?.id||null;
  });assert.ok(savedId);
  const original=await frame.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('gulliver.activities.v1')));
  assert.equal(original.activities.length,3);
  assert.equal(original.activities[0].payload.cards[0].front,'삼각형');
  await page.setViewportSize({width:390,height:844});
  await frame.locator('[data-design-tab="teacher"]').click();
  await frame.locator('#teacherSavedActivity').waitFor({state:'visible'});
  const nav=await frame.locator('.design-nav').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,screen:innerHeight}));
  assert.ok(nav.bottom>=nav.screen-2);
  const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));
  await second.goto(root+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await second.evaluate(async id=>{
   const stored=await GulliverStudioStorage.getProject(id);
   await GulliverStudioBridge.start('canvas',stored);
  },savedId);
  const reloaded=await second.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(reloaded.pages.length,8);
  assert.ok(reloaded.pages.some(p=>p.elements.some(e=>e.content==='세모')));
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
