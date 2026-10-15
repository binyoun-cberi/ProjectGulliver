'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8889,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<130;i++){try{if((await fetch(base+'studio-teacher-live.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,120))}throw Error('server unavailable')}
test('live teaching tools import real saved results without losing project or source data',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const context=await browser.newContext({viewport:{width:1200,height:830}}),page=await context.newPage();
  page.setDefaultTimeout(20000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});const f=page.frameLocator('#editorFrame');
  await f.locator('[data-design-tab="teacher"]').click();
  await f.locator('#teacherLiveTools').waitFor({state:'visible'});
  await f.locator('[data-design-tab="teacher"]').evaluate(()=>{
    localStorage.setItem('classDashboardStateV2',JSON.stringify({currentTemp:24,goalTemp:60,records:[{reason:'함께 협력',amount:5,type:'up'}]}));
    localStorage.setItem('vote_board_v2',JSON.stringify({title:'과일 투표',options:[{id:1,name:'사과'},{id:2,name:'바나나'}]}));
    localStorage.setItem('vote_board_v2_votes',JSON.stringify({0:1,1:1,2:2}));
    localStorage.setItem('gulliver.roulette.lastResults.v1',JSON.stringify({completed:true,results:[{name:'학생 A',result:'발표'},{name:'학생 B',result:'정리'}]}));
  });
  await f.locator('.teacher-live-tile').filter({hasText:'칭찬 온도계'}).click();
  await f.locator('#teacherLiveDialog').waitFor({state:'visible'});
  await f.locator('#teacherLiveFrame').waitFor({state:'attached'});
  await f.locator('#teacherCopyResult').click();
  const praise=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(praise.pages.length,2);
  assert.ok(praise.pages[1].elements.some(e=>e.content==='24 / 60점'));
  assert.equal(await f.locator('#teacherLiveDialog').isVisible(),false);
  await f.locator('.teacher-live-tile').filter({hasText:'우리 반 투표판'}).click();
  await f.locator('#teacherCopyResult').click();
  const vote=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(vote.pages.length,3);
  assert.ok(JSON.stringify(vote.pages[2]).includes('2표'));
  assert.ok(!JSON.stringify(vote.pages[2]).includes('학생 A'));
  await f.locator('.teacher-live-tile').filter({hasText:'범퍼 룰렛'}).click();
  await f.locator('#teacherCopyResult').click();
  const roulette=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(roulette.pages.length,4);
  assert.ok(JSON.stringify(roulette.pages[3]).includes('학생 A'));
  // QR bridge: exercise a generated canvas artifact inside the real same-origin QR frame.
  await f.locator('.teacher-live-tile').filter({hasText:'QR 코드 만들기'}).click();
  await f.frameLocator('#teacherLiveFrame').locator('#qrCanvas').waitFor({state:'attached'});
  await f.locator('#teacherLiveFrame').evaluate(iframe=>{
   const qr=iframe.contentDocument?.getElementById('qrCanvas');
   if(!qr)throw Error('QR creator document not ready');
   qr.width=120;qr.height=120;
   qr.getContext('2d').fillRect(0,0,120,120);
   qr.dataset.generatedContent='https://example.org/teacher';qr.classList.add('show');
  });
  await f.locator('#teacherCopyResult').click();
  const qr=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(qr.pages.length,5);
  assert.ok(qr.pages[4].elements.some(e=>e.type==='image'&&e.src.startsWith('data:image/png;base64,')));
  assert.ok(qr.pages[4].elements.some(e=>e.type==='text'&&e.content==='https://example.org/teacher'));
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const savedId=await page.evaluate(async()=>{
   const list=await GulliverStudioStorage.projects();
   return list.find(p=>p.kind==='canvas'&&p.payload?.pages?.length===5)?.id||null;
  });assert.ok(savedId,'Autofiled 5-page project remains intact');
  await page.setViewportSize({width:390,height:844});
  await f.locator('[data-design-tab="teacher"]').click();
  await f.locator('.teacher-live-tile').filter({hasText:'칭찬 온도계'}).click();
  const diag=await f.locator('#teacherLiveDialog').boundingBox();
  assert.ok(diag&&diag.width>=375,'Mobile teaching dialog fills screen');
  await f.locator('#teacherLiveClose').click();
  const original=await f.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('classDashboardStateV2')));
  assert.equal(original.currentTemp,24,'Source app remains untouched');
  const tab=await context.newPage();tab.on('pageerror',e=>errs.push(e.message));
  await tab.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await tab.evaluate(async id=>{const p=await GulliverStudioStorage.getProject(id);await GulliverStudioBridge.start('canvas',p)},savedId);
  const saved=await tab.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(saved.pages.length,5);
  assert.deepEqual(errs,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
