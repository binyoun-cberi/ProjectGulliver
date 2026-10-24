(function classroomRound4Tests(){
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
const bus=require('../classroom-bus-audit.js'),{solveManitto}=require('../manitto-solver.js');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chromeReady=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
const origin='http://127.0.0.1:8991/';
test('bus seat audit checks every student, physical pairs, fixed and disabled seats',()=>{
 const students=['가','나','다','라'].map((name,i)=>({id:String(i),name}));
 const first={students,assignment:['0','1','2','3'],disabled:[false,false,false,false],fixedSeats:{'0':0},
     avoidPairs:[],togetherPairs:[['0','1']],sharedAvoidPairs:[]};
 assert.equal(bus.validateBusPlacement(first).ok,true);
 assert.equal(bus.validateBusPlacement({...first,assignment:['0','1','1',null]}).ok,false);
 assert.equal(bus.validateBusPlacement({...first,disabled:[true,false,false,false]}).ok,false);
 assert.equal(bus.validateBusPlacement({...first,assignment:['1','0','2','3']}).ok,false);
 assert.equal(bus.validateBusPlacement({...first,togetherPairs:[['0','2']]}).ok,false);
 assert.equal(bus.validateBusPlacement({...first,avoidPairs:[['0','1']]}).ok,false);
 assert.equal(bus.validateBusRules({students,togetherPairs:[['0','1'],['0','2']]}).ok,false);
 assert.equal(bus.validateBusRules({students,fixedSeats:{'0':1},disabled:[false,true]}).ok,false);
});
test('manitto matching is complete, never self-selects, and diagnoses impossible rules',()=>{
 for(let n=3;n<=45;n+=3){
  const people=Array.from({length:n},(_,i)=>'학생'+i);
  for(let r=0;r<8;r++){
   const result=solveManitto(people,[]);
   assert.equal(result.ok,true,JSON.stringify(result));
   assert.equal(Object.keys(result.matches).length,n);
   assert.equal(new Set(Object.values(result.matches)).size,n);
   for(const p of people)assert.notEqual(result.matches[p],p);
  }
 }
 const forced=solveManitto(['가','나','다','라'],[{drawer:'가',receiver:'나'},{drawer:'나',receiver:'다'}]);
 assert.equal(forced.ok,true);assert.equal(forced.matches['가'],'나');assert.equal(forced.matches['나'],'다');
 assert.equal(solveManitto(['가','나','다'],[{drawer:'가',receiver:'가'}]).ok,false);
 assert.equal(solveManitto(['가','나','다'],[{drawer:'가',receiver:'나'},{drawer:'다',receiver:'나'}]).ok,false);
 assert.equal(solveManitto(['가','나','다'],[{drawer:'가',receiver:'나'},{drawer:'다',receiver:'가'}]).ok,true);
 assert.equal(solveManitto(['가','나','다','라'],[{drawer:'가',receiver:'나'},{drawer:'다',receiver:'라'}]).ok,true);
});
test('Chrome teacher flows: manitto private reveal, bus full assignment, vote stored XSS safety and reconnect', {
timeout:180000,skip:!chromeReady&&'Chrome driver not installed'
},async()=>{
 const server=spawn('python3',['-m','http.server','8991','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'manitto-solver.js')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.equal(ready,true);
  browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(20000);
  await page.goto(origin+encodeURIComponent('마니또 배정 도우미.html'));
  await page.locator('#names-input').fill('가\n나\n다\n라');
  await page.getByRole('button',{name:/시작/}).first().click();
  await page.locator('#draw-view:not(.hidden)').waitFor();
  await page.locator('#student-grid button').first().click();
  await page.getByRole('button',{name:/네, 확인할게요/}).click();
  await page.locator('#draw-result:not(.hidden)').waitFor();
  const secret=await page.locator('#target-name').textContent();
  assert.ok(['가','나','다','라'].includes(secret));
  await page.locator('#close-result-btn').click();
  assert.equal(await page.locator('#target-name').textContent(),'');
  assert.equal(await page.locator('#modal.hidden').count(),1);

  await page.goto(origin+encodeURIComponent('버스 좌석 배치 프로그램.html'));
  await page.evaluate(()=>{
   const names=Array.from({length:8},(_,i)=>'학생'+(i+1));
   const rosterHints=names.map((name,i)=>({id:'student-'+i,name,gender:i%2?'F':'M'}));
   localStorage.setItem('gulliver.busSeating.v3',JSON.stringify({
     rosterHints,students:rosterHints,disabled:Array(40).fill(false),assignment:Array(40).fill(null),
     avoidPairs:[],togetherPairs:[['student-0','student-1']],fixedSeats:{'student-0':0},
     sameGender:false,historyMode:false,backRowDisabled:true
   }));
  });
  await page.reload();await page.locator('#generateBtn').click();
  await page.locator('#notice').getByText(/자리.*배치|조건.*반영|최근 기록/).waitFor();
  const outcome=await page.evaluate(()=>{
    const snapshot=window.GulliverTeacherLiveSnapshot();
    return {ids:snapshot.seats.filter(Boolean),size:snapshot.students.length};
  });
  assert.equal(outcome.ids.length,outcome.size);assert.equal(new Set(outcome.ids).size,outcome.size);
  await page.locator('#confirmBtn').click();
  assert.match(await page.locator('#notice').textContent(),/확정/);
  const snapshot=await page.evaluate(()=>window.GulliverTeacherLiveSnapshot());
  assert.equal(snapshot.confirmed,true);

  await page.goto(origin+encodeURIComponent('우리반 선관위.html'));
  const injected='<img src=x onerror="window.__voteInjected=true">';
  await page.evaluate(payload=>{
    localStorage.setItem('vote_board_v2',JSON.stringify({
      title:payload,cols:2,rows:2,students:[payload,'학생',null,null],
      options:[{id:1,name:payload,colorId:1},{id:2,name:'찬성',colorId:2}]
    }));
    localStorage.setItem('vote_board_v2_votes','{}');
  },injected);
  await page.reload();
  assert.equal(await page.locator('#seating-grid img,#options-list img').count(),0);
  assert.equal(await page.evaluate(()=>window.__voteInjected===true),false);
  assert.match(await page.locator('#options-list').textContent(),/<img/);
  await page.locator('#seating-grid').locator('[role="button"]').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#seating-grid').locator('[aria-label*="투표 기록 있음"]').count(),1);
  // Session tokens survive a transient offline state and remain private in storage.
  await page.evaluate(()=>localStorage.setItem('gulliver.onlineVote.teacher.v1',JSON.stringify({code:'ABCDEF',teacherToken:'test-secret'})));
  await page.reload();
  await page.locator('#online-status').getByText(/네트워크 연결 중단/).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gulliver.onlineVote.teacher.v1')).teacherToken),'test-secret');
  assert.equal(await page.locator('#online-code').textContent(),'ABCDEF');
 }finally{await browser?.close();server.kill('SIGTERM');}
});
})();
