(function classroomAuditTests(){
 'use strict';
 const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
 const {spawn}=require('node:child_process');
 let chromium;try{({chromium}=require('playwright-core'));}catch{}
 const canChrome=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
 const origin='http://127.0.0.1:8988/';
 test('allocation audit blocks missing pupils, duplicate seats, broken fixed groups and infeasible role capacity',()=>{
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync('classroom-allocation-audit.js','utf8'),{module,window:{}});
  const audit=module.exports;
  const pupils=[{id:'a',name:'가',gender:'F'},{id:'b',name:'나',gender:'M'}];
  let x=audit.seating({assignment:['a','b'],students:pupils,activeSeats:[true,true],fixedSeats:{0:'a'},genderSeats:{}});
  assert.equal(x.ok,true);
  x=audit.seating({assignment:['a','a'],students:pupils,activeSeats:[true,true],fixedSeats:{0:'b'},genderSeats:{1:'M'}});
  assert.equal(x.ok,false);assert.equal(x.missing,1);assert.ok(x.issues.length>=3);
  assert.equal(audit.groupIssues([['a','b'],['c','d']],[['a','b']],[],{}).length,1);
  assert.equal(audit.groupIssues([['a','b'],['c','d']],[],[['a','c']],{}).length,1);
  assert.equal(audit.groupIssues([['a','b'],['c','d']],[],[],{a:2}).length,1);
  let feasibility=audit.roleFeasibility([{id:'a',name:'가'},{id:'b',name:'나'},{id:'c',name:'다'}],
   [{id:'r1',count:1},{id:'r2',count:2}],{}, {a:['r2'],b:['r2']});
  assert.equal(feasibility.ok,false);assert.match(feasibility.message,/배정할 수 없는 학생/);
  feasibility=audit.roleFeasibility([{id:'a',name:'가'},{id:'b',name:'나'},{id:'c',name:'다'}],
   [{id:'r1',count:1},{id:'r2',count:2}],{}, {a:['r2']});
  assert.equal(feasibility.ok,true);
 });
 test('teacher browser blocks invalid seat publication and unsafe group swaps and explains role conflicts',{
  timeout:180000,skip:!canChrome&&'Chrome/browser driver not installed'
 },async()=>{
  const server=spawn('python3',['-m','http.server','8988','--bind','127.0.0.1'],{stdio:'ignore'});
  let browser;
  try{
   let ready=false;
   for(let i=0;i<100;i++){
    try{if((await fetch(origin+'classroom-allocation-audit.js')).ok){ready=true;break;}}catch{}
    await new Promise(res=>setTimeout(res,100));
   }
   assert.equal(ready,true);
   browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
   const context=await browser.newContext({viewport:{width:1340,height:860}});
   await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
   const page=await context.newPage();page.setDefaultTimeout(15000);
   await page.goto(origin+encodeURIComponent('자리 배정 프로그램.html'));
   await page.evaluate(()=>{
    const people=Array.from({length:8},(_,i)=>({id:'seat-'+i,name:'학생'+(i+1),gender:i%2?'F':'M'}));
    localStorage.setItem('gulliver.seating.v3',JSON.stringify({
      students:people,cols:4,rows:2,layout:'individual',activeSeats:Array(8).fill(true),
      fixedSeats:{0:'seat-0'},genderSeats:{0:'M'},frontIds:[],rules:[]}));
   });
   await page.reload();
   await page.locator('#generateBtn').click();
   await page.locator('#notice').getByText(/배치 완료/).waitFor();
   assert.equal(await page.evaluate(()=>{
    const ids=window.GulliverTeacherLiveSnapshot().assignment.filter(Boolean);
    return ids.length===8&&new Set(ids).size===8;
   }),true);
   await page.locator('#seatGrid .seat').first().click();
   await page.locator('#seatGrid .seat').nth(1).click();
   assert.match(await page.locator('#notice').textContent(),/지정 자리|움직일 수 없|고정/);
   assert.equal(await page.evaluate(()=>window.GulliverTeacherLiveSnapshot().assignment[0]),'seat-0');

   // Group setup: a transitive "together" chain contradicts separation.
   await page.goto(origin+encodeURIComponent('행운의 모둠 메이커.html'));
   await page.evaluate(()=>{
    const names=['가','나','다','라','마','바','사','아'];
    const rosterHints=names.map((name,i)=>({id:'group-'+i,name,gender:''}));
    localStorage.setItem('gulliver.groupMaker.v4',JSON.stringify({
      names:names.join('\n'),rosterHints,groupSize:4,genderMode:'random',sound:false,
      togetherPairs:[['group-0','group-1'],['group-1','group-2']],
      avoidPairs:[['group-0','group-2']],leaders:[],fixedGroups:{'group-0':1}
    }));
   });
   await page.reload();
   await page.locator('#conditionPreview').getByText(/가·다/).waitFor();
   await page.locator('#startBtn').click();
   assert.equal(await page.locator('#slotScreen.active').count(),0);
   await page.locator('[data-del-avoid="0"]').click();
   const afterRemove=await page.locator('#conditionPreview').textContent();
   assert.match(afterRemove,/사전 확인 완료/,'condition preview after removing separation pair: '+afterRemove);
   await page.locator('#startBtn').click();
   await page.locator('#slotScreen.active').waitFor();
   await page.locator('#revealAllBtn').click();
   assert.match(await page.locator('#groupAuditSummary').textContent(),/필수 조건 충족/);
   const first=page.locator('#groupGrid [data-member="group-0"]');
   const inOther=page.locator('#groupGrid .group-card').nth(1).locator('[data-member]').first();
   await first.click();await inOther.click();
   assert.match(await page.locator('#resultNotice').textContent(),/교환을 취소/);
   assert.equal(await page.locator('#groupGrid .group-card').first().locator('[data-member="group-0"]').count(),1);

   // Hall-style capacity conflict: all roles have enough total slots, yet
   // two students can only take a single shared role slot.
   await page.goto(origin+encodeURIComponent('학급 배정 도우미.html'));
   await page.evaluate(()=>{
    localStorage.setItem('gulliver.classRoles.v4',JSON.stringify({
      roles:[{id:'r1',name:'칠판',count:1},{id:'r2',name:'분리수거',count:2}],
      students:[{id:'a',name:'가',prefs:['r1','','']},{id:'b',name:'나',prefs:['r1','','']},{id:'c',name:'다',prefs:['r2','','']}],
      fixed:{},excluded:{a:['r2'],b:['r2']},assignment:{},tab:'results'
    }));
   });
   await page.reload();await page.locator('#runBtn').click();
   assert.match(await page.locator('#resultNotice').textContent(),/배정할 수 없는 학생/);
   await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('gulliver.classRoles.v4'));s.excluded.b=[];
    localStorage.setItem('gulliver.classRoles.v4',JSON.stringify(s));
   });
   await page.reload();await page.locator('#runBtn').click();
   await page.locator('#roleFairnessSummary').getByText(/1지망/).waitFor();
   assert.equal(await page.locator('#resultGrid .assigned').count(),3);
   await page.setViewportSize({width:390,height:844});
   const s=await page.locator('#roleFairnessSummary').evaluate(n=>({width:n.scrollWidth,client:n.clientWidth}));
   assert.ok(s.width<=s.client+2);
  }finally{await browser?.close();server.kill('SIGTERM');}
 });
})();
