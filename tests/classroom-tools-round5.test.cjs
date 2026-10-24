(function classroomRound5Tests(){
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
const {validateCatchCards,validMotionHit}=require('../classroom-catch-rules.js');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const ready=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
const origin='http://127.0.0.1:8992/';
test('catch classifications reject duplicate labels, overlaps and empty answers',()=>{
 assert.equal(validateCatchCards(['2','4'],['1','3']).ok,true);
 assert.equal(validateCatchCards(['Blue'],[' blue ']).ok,false);
 assert.equal(validateCatchCards(['나비','나비'],['거미']).ok,false);
 assert.equal(validateCatchCards([],['거미']).ok,false);
 assert.equal(validMotionHit({x:200,y:180,w:90,h:65},[{x:200,y:180}],800,500),false);
 const cluster=Array.from({length:80},(_,i)=>({x:170+(i%10)*6,y:153+Math.floor(i/10)*6}));
 assert.equal(validMotionHit({x:200,y:180,w:90,h:65},cluster,800,500),true);
 assert.equal(validMotionHit({x:200,y:180,w:90,h:65},Array(390).fill({x:190,y:175}),800,500),false);
});
test('Chrome verifies praise undo + HTML safety, tournament winner history, and catch rule checks', {
 timeout:180000,skip:!ready&&'Chrome driver not available'
},async()=>{
 const server=spawn('python3',['-m','http.server','8992','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  let up=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'classroom-catch-rules.js')).ok){up=true;break;}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert.ok(up);
  browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:850},permissions:[]});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(12000);

  await page.goto(origin+encodeURIComponent('칭찬 온도계.html'));
  const injected='<img src=x onerror="window.__unsafe=true">';
  await page.evaluate(payload=>{
   const state={currentTemp:5,goalTemp:100,records:[{id:'old',type:'up',student:payload,reason:payload,date:'10월 24일',amount:5}],plusReasons:[{id:999,text:payload,amount:5}],minusReasons:[]};
   localStorage.setItem('classDashboardStateV2',JSON.stringify(state));
  },injected);
  await page.reload();
  assert.equal(await page.locator('#historyGrid img,#plusReasonList img').count(),0);
  assert.equal(await page.evaluate(()=>window.__unsafe===true),false);
  assert.equal(await page.locator('#plusReasonList .reason-title').first().textContent(),injected);
  await page.locator('#goalTempInput').fill('80');await page.locator('#applyGoalBtn').click();
  assert.equal(await page.locator('#goalTempInput').inputValue(),'80');
  await page.locator('#globalStudentName').fill('서진');
  await page.locator('#plusReasonList .praise-reason-main').first().click();
  assert.equal(await page.locator('#tempText').textContent(),'10');
  await page.locator('#undoPraiseBtn').click();
  assert.equal(await page.locator('#tempText').textContent(),'5');
  assert.equal(await page.locator('#historyGrid .history-item').count(),1);
  await page.reload();
  assert.equal(await page.locator('#tempText').textContent(),'5');
  assert.equal(await page.locator('#goalTempInput').inputValue(),'80');

  await page.goto(origin+encodeURIComponent('토너먼트 메이커.html'));
  await page.locator('#entriesInput').fill('가\n나\n다\n라');
  await page.locator('#generateBtn').click();
  await page.locator('#tournamentProgress').getByText(/남은 경기/).waitFor();
  const first=page.locator('#bracket [data-win]').first();
  await first.click();
  assert.equal(await page.locator('#undoBtn').isEnabled(),true);
  await page.locator('#undoBtn').click();
  assert.equal(await page.locator('#undoBtn').isDisabled(),true);
  assert.equal(await page.locator('#copyBracketBtn').isEnabled(),true);
  await page.reload();
  assert.equal(await page.locator('#copyBracketBtn').isEnabled(),true);
  assert.match(await page.locator('#bracketSummary').textContent(),/승자를 누르면/);

  await page.goto(origin+encodeURIComponent('잡아라 오늘의 정답.html'));
  await page.locator('#targetInput').fill('나비, 사과');
  await page.locator('#avoidInput').fill('나비, 거미');
  assert.equal(await page.locator('#btnStart').isDisabled(),true);
  assert.match(await page.locator('#catchRulesStatus').textContent(),/정답과 오답/);
  await page.locator('#avoidInput').fill('거미, 지렁이');
  assert.equal(await page.locator('#btnStart').isEnabled(),true);
  await page.locator('#cameraMode').uncheck();
  await page.locator('#btnStart').click();
  await page.locator('#gameScreen:not(.hidden)').waitFor();
  await page.locator('#btnPause').click();
  assert.equal(await page.locator('#btnPause').textContent(),'계속하기');
  await page.locator('#btnEnd').click();
  await page.locator('#resultModal:not(.hidden)').waitFor();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
})();
