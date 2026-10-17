'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8897,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'studio-teacher-source.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('teacher site not ready')}
test('real launch of all 8 teacher tools and round-trip import to editable canvas with native user actions',{timeout:140000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();fs.mkdirSync('test-artifacts',{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1320,height:900},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(16000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});const f=page.frameLocator('#editorFrame');
  await f.locator('[data-design-tab="teacher"]').click();
  await f.locator('#teacherLiveTools').waitFor({state:'visible'});
  await f.locator('body').evaluate(()=>{
   localStorage.setItem('gulliver.classroom.v1',JSON.stringify({version:1,className:'우리반',students:[{id:'a',name:'봄'},{id:'b',name:'여름'}]}));
   localStorage.setItem('classDashboardStateV2',JSON.stringify({currentTemp:29,goalTemp:50,records:[{reason:'모둠 협력',type:'up',amount:4}],plusReasons:[],minusReasons:[]}));
   localStorage.setItem('vote_board_v2',JSON.stringify({title:'과일 선택',options:[{id:1,name:'사과'},{id:2,name:'배'}]}));
   localStorage.setItem('vote_board_v2_votes',JSON.stringify({0:1,1:2}));
   localStorage.setItem('gulliver.roulette.lastResults.v1',JSON.stringify({completed:true,results:[{name:'봄',result:'첫 번째'},{name:'여름',result:'두 번째'}]}));
  });
  const tool=async(name)=>{await f.locator('.teacher-live-tile').filter({hasText:name}).click();await f.locator('#teacherLiveDialog[open]').waitFor();await f.locator('#teacherCopyResult').waitFor({state:'visible'});await f.locator('#teacherCopyResult').isEnabled()||await f.locator('#teacherCopyResult').waitFor({state:'attached'});};
  const copy=async()=>{const before=(await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture())).pages.length;await f.locator('#teacherCopyResult').click();await f.locator('#teacherLiveDialog').waitFor({state:'hidden'});const doc=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());assert.ok(doc.pages.length>before);return doc.pages.slice(before)};
  // Timer app, edit the real native timeline (not a preseeded unrelated legacy activity).
  await tool('수업 흐름 타이머');
  const timer=f.frameLocator('#teacherLiveFrame');
  await timer.locator('#eventList .event-card').first().waitFor();
  await timer.locator('#mainTitle').fill('과일 탐험 수업');
  await timer.locator('#eventList .name-input').first().fill('사과 만져보기');
  const timerPages=await copy();assert.match(JSON.stringify(timerPages),/사과 만져보기/);
  assert.match(JSON.stringify(timerPages),/과일 탐험 수업/);
  assert.ok(!JSON.stringify(timerPages).includes('도입 · 이야기 나누기'));
  // The quiz runs inside the original app: add a card, then import the live deck.
  await tool('낱말카드·퀴즈');
  const quiz=f.frameLocator('#teacherLiveFrame');
  await quiz.locator('#singleFront').fill('새로운 과일 문제');
  await quiz.locator('#singleBack').fill('사과');
  await quiz.locator('#singleAddBtn').click();
  const quizPages=await copy();
  assert.ok(JSON.stringify(quizPages).includes('새로운 과일 문제'));
  // Seating requires a real generated assignment. Before generation, import must fail safely.
  await tool('교실 자리 배정');
  const seat=f.frameLocator('#teacherLiveFrame');
  await seat.locator('#studentName').fill('봄');await seat.locator('#addStudentBtn').click();
  await seat.locator('#studentName').fill('여름');await seat.locator('#addStudentBtn').click();
  const beforeSeat=(await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture())).pages.length;
  await f.locator('#teacherCopyResult').click();
  assert.match(await f.locator('#teacherLiveStatus').textContent(),/확정된 자리/);
  assert.equal((await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture())).pages.length,beforeSeat);
  await seat.locator('#generateBtn').click();
  const assignment=await seat.locator('body').evaluate(()=>GulliverTeacherLiveSnapshot());
  assert.equal(assignment.assignment.filter(Boolean).length,2);
  await seat.locator('#commitHistoryBtn').evaluate(el=>el.click());
  const seatPages=await copy();assert.ok(JSON.stringify(seatPages).includes('봄'));
  // Checklist: import class roster, check one item, then copy the real state.
  await tool('학급췍');
  const check=f.frameLocator('#teacherLiveFrame');
  await check.locator('#load-classroom-btn').click();
  await check.locator('#desk-grid .desk').first().click();
  const checkPages=await copy();assert.ok(JSON.stringify(checkPages).includes('봄'));
  assert.ok(JSON.stringify(checkPages).includes('✓'));
  // Additional 4 apps: load genuine same-origin pages and import real records.
  await tool('칭찬 온도계');await f.frameLocator('#teacherLiveFrame').locator('#tempText').waitFor();
  const praise=await copy();assert.ok(JSON.stringify(praise).includes('29 / 50점'));
  await tool('우리 반 투표판');await f.frameLocator('#teacherLiveFrame').locator('#options-list').waitFor();
  const vote=await copy();assert.ok(JSON.stringify(vote).includes('1표'));
  await tool('범퍼 룰렛');await f.frameLocator('#teacherLiveFrame').locator('#gameCanvas').waitFor();
  const roulette=await copy();assert.ok(JSON.stringify(roulette).includes('여름'));
  await tool('QR 코드 만들기');
  const qr=f.frameLocator('#teacherLiveFrame');
  const qrReady=await qr.locator('body').evaluate(()=>typeof window.qrcode==='function');
  if(qrReady){
   await qr.locator('#qrText').fill('https://example.org/orchard');
   await qr.locator('#generateBtn').click();
   await qr.locator('#qrCanvas.show').waitFor({state:'visible',timeout:10000});
   const qrPages=await copy();assert.ok(qrPages[0].elements.some(e=>e.type==='image'));
  }else{
   // This app downloads its QR engine from an external CDN. In offline CI,
   // check honest error handling instead of pretending a usable QR was generated.
   await qr.locator('#qrText').fill('https://example.org/orchard');
   await qr.locator('#generateBtn').click();
   assert.match(await qr.locator('#engineNotice').textContent(),/QR 생성 엔진을 불러오지 못했습니다/);
   await f.locator('#teacherCopyResult').click();
   assert.match(await f.locator('#teacherLiveStatus').textContent(),/QR 도구에서 내용을 입력/);
   await f.locator('#teacherLiveClose').click();
  }
  const all=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.ok(all.pages.length>=12,'full mixed class lesson lost pages');
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const saved=await page.evaluate(async()=>{const rows=await GulliverStudioStorage.projects();return rows.find(p=>p.kind==='canvas'&&p.payload?.pages?.length>=12)?.id});
  assert.ok(saved,'teacher mixed document was not saved');
  const other=await context.newPage();await other.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await other.evaluate(async id=>{const p=await GulliverStudioStorage.getProject(id);await GulliverStudioBridge.start('canvas',p)},saved);
  const reloaded=await other.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(reloaded.pages.length,all.pages.length);
  assert.deepEqual(errors,[]);
  console.log('TEACHER_ALL_8 '+JSON.stringify({pages:all.pages.length,tools:8,liveEdits:['timer','quiz','seating','check'],sources:['praise','vote','roulette','qr'],qrGenerated:qrReady,savedRestored:true}));
 }finally{await browser?.close();server.kill('SIGTERM')}
});