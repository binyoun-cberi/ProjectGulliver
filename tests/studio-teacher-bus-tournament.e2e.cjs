'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8940,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'studio-teacher-next.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('server not ready')}
test('bus and tournament native creation, confirmation, edit, refresh, undo and save roundtrip',{timeout:180000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1370,height:950}}),page=await ctx.newPage();
  page.setDefaultTimeout(18000);await page.goto(studio,{waitUntil:'domcontentloaded'});
  const editor=page.frameLocator('#editorFrame'),toolFrame=editor.frameLocator('#teacherLiveFrame');
  await editor.locator('[data-design-tab="teacher"]').click();
  assert.equal(await editor.locator('.teacher-live-tile').count(),13);
  const open=async text=>{
   await editor.locator('.teacher-live-tile').filter({hasText:text}).click();
   await editor.locator('#teacherLiveDialog[open]').waitFor({state:'visible'});
  };
  const model=()=>editor.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  const importResult=async kind=>{
   const before=(await model()).pages.length;
   await editor.locator('#teacherCopyResult').click();
   await editor.locator('#teacherLiveDialog').waitFor({state:'hidden'});
   const p=await model();assert.ok(p.pages.length>before,kind+' did not import pages');
   assert.ok(p.pages.some(x=>x.teacherSource?.kind===kind),kind+' has no provenance');
   return p;
  };
  await open('버스 좌석 배치');
  await toolFrame.locator('#namesInput').fill('민\n진\n솔\n한');
  await toolFrame.locator('#generateBtn').click();
  await editor.locator('#teacherCopyResult').click();
  assert.match(await editor.locator('#teacherLiveStatus').textContent(),/이번 버스 자리 확정/);
  await toolFrame.locator('#confirmBtn').click();
  let p=await importResult('bus');
  const busPage=p.pages.find(x=>x.teacherSource?.kind==='bus');
  assert.ok(busPage.elements.length>=80);
  const seatNames=JSON.stringify(busPage.elements);
  for(const name of ['민','진','솔','한','사용 안 함','버스 앞'])assert.ok(seatNames.includes(name),name+' absent');
  const labeled=busPage.elements.filter(e=>Number.isInteger(e.busSeat));
  assert.equal(labeled.length,4,'only four real students have clickable seat metadata');
  const [one,two]=labeled.slice(0,2),originalBus=JSON.stringify(await page.evaluate(()=>{
   return JSON.parse(localStorage.getItem('gulliver.busSeating.v3')).assignment;
  }));
  await editor.locator('#busSwapBar').waitFor({state:'visible'});
  await editor.locator('#busSwapButton').click();
  assert.equal(await editor.locator('#busSwapButton').getAttribute('aria-pressed'),'true');
  await editor.locator('#stage .item[data-bus-seat="'+one.busSeat+'"]').click();
  assert.match(await editor.locator('#busSwapHint').textContent(),/두 번째 학생/);
  await editor.locator('#stage .item[data-bus-seat="'+two.busSeat+'"]').click();
  let afterSwap=await model(),edited=afterSwap.pages.find(x=>x.teacherSource?.kind==='bus').elements;
  assert.equal(edited.find(e=>e.busSeat===one.busSeat).content,two.content);
  assert.equal(edited.find(e=>e.busSeat===two.busSeat).content,one.content);
  assert.equal(JSON.stringify(await page.evaluate(()=>JSON.parse(localStorage.getItem('gulliver.busSeating.v3')).assignment)),originalBus,'canvas seat swap changed original native bus assignment');
  await editor.locator('#undo').click();
  afterSwap=await model();edited=afterSwap.pages.find(x=>x.teacherSource?.kind==='bus').elements;
  assert.equal(edited.find(e=>e.busSeat===one.busSeat).content,one.content);
  assert.equal(edited.find(e=>e.busSeat===two.busSeat).content,two.content);
  await editor.locator('#redo').click();
  edited=(await model()).pages.find(x=>x.teacherSource?.kind==='bus').elements;
  assert.equal(edited.find(e=>e.busSeat===one.busSeat).content,two.content);
  await editor.locator('#undo').click();
  await editor.locator('#busSwapButton').click();
  const busCount=p.pages.length;
  // A fresh confirmed assignment can replace the old bus diagram in-place.
  await open('버스 좌석 배치');
  await toolFrame.locator('#namesInput').fill('민\n진\n솔\n한\n다섯');
  await toolFrame.locator('#generateBtn').click();
  await toolFrame.locator('#confirmBtn').click();
  await editor.locator('#teacherRefreshResult').waitFor({state:'visible'});
  page.once('dialog',d=>d.accept());
  await editor.locator('#teacherRefreshResult').click();
  await editor.locator('#teacherLiveDialog').waitFor({state:'hidden'});
  p=await model();assert.equal(p.pages.length,busCount);
  assert.ok(JSON.stringify(p.pages).includes('다섯'));
  await editor.locator('#undo').click();
  assert.ok(!JSON.stringify((await model()).pages).includes('다섯'),'undo should restore original bus seats');
  // Tournament creates an unfinished bracket first, without made-up winners.
  await open('토너먼트 메이커');
  await toolFrame.locator('#entriesInput').fill('봄\n여름\n가을\n겨울');
  await toolFrame.locator('#tournamentTitle').fill('사계절 퀴즈');
  await editor.locator('#teacherCopyResult').click();
  assert.match(await editor.locator('#teacherLiveStatus').textContent(),/생성된 대진표/);
  await toolFrame.locator('#generateBtn').click();
  p=await importResult('tournament');
  const tournamentCount=p.pages.length,raw=JSON.stringify(p.pages);
  assert.ok(raw.includes('사계절 퀴즈'));assert.ok(raw.includes('결과 미정'));
  assert.ok(p.pages.some(x=>x.name.startsWith('진출 흐름')),'expected visual next-round connections');
  const connections=p.pages.find(x=>x.name.startsWith('진출 흐름'));
  assert.ok(connections.elements.some(x=>x.type==='rect'&&x.fill==='#8D79C9'),'no flow connector segments');

  assert.ok(!raw.includes('우승 봄')&&!raw.includes('우승 가을'));
  // Real winner selection in the original bracket, not a test-injected outcome.
  await open('토너먼트 메이커');
  for(let i=0;i<3;i++){
   await toolFrame.locator('#bracket .slot.pending').first().click();
  }
  await toolFrame.locator('#championDialog[open]').waitFor({state:'visible'});
  await toolFrame.locator('#closeChampionBtn').click();
  const native=await toolFrame.locator('body').evaluate(()=>window.GulliverTeacherLiveSnapshot());
  assert.ok(native.championId,'native bracket never determined a champion');
  const victor=native.participants.find(x=>x.id===native.championId).name;
  await editor.locator('#teacherRefreshResult').waitFor({state:'visible'});
  page.once('dialog',d=>d.accept());await editor.locator('#teacherRefreshResult').click();
  await editor.locator('#teacherLiveDialog').waitFor({state:'hidden'});
  p=await model();assert.equal(p.pages.length,tournamentCount,'refresh should not add pages');
  assert.ok(JSON.stringify(p.pages).includes('우승 '+victor),'confirmed champion must appear in refreshed page');
  assert.ok(p.pages.some(x=>x.name.startsWith('진출 흐름')),'round connectors vanished on refresh');

  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const saved=await page.evaluate(async()=>{const list=await GulliverStudioStorage.projects();return list.find(x=>x.kind==='canvas'&&x.payload?.pages?.some(p=>p.teacherSource?.kind==='tournament'))?.id});
  assert.ok(saved,'new content was not persisted');
  const another=await ctx.newPage();await another.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await another.evaluate(async id=>{const project=await GulliverStudioStorage.getProject(id);await GulliverStudioBridge.start('canvas',project)},saved);
  const reloaded=await another.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(reloaded.pages.length,p.pages.length);
  assert.ok(reloaded.pages.some(x=>x.teacherSource?.kind==='bus'));
  assert.ok(reloaded.pages.some(x=>x.teacherSource?.kind==='tournament'));
  console.log('BUS_TOURNAMENT_LINKED '+JSON.stringify({pages:reloaded.pages.length,tools:2,confirmedOnly:true,generatedAndRefreshed:true,saveReopen:true,champion:victor}));
 }finally{await browser?.close();server.kill('SIGTERM')}
});