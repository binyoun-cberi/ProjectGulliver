(function finalWaveTests(){
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{spawn}=require('node:child_process');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const available=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
const origin='http://127.0.0.1:8995/';
const read=path=>fs.readFileSync(path,'utf8');
test('curriculum inventory is internally consistent; no official fidelity claim is inferred',()=>{
 const context={};vm.runInNewContext(read('data-standards.js'),{window:context});
 const list=context.DD_STANDARDS_2022;
 assert.equal(list.length,447);
 assert.equal(new Set(list.map(x=>x.code)).size,list.length);
 assert.ok(list.every(x=>x.grade&&x.subject&&x.code&&x.achievement));
 const edu=read('뚝딱교육.html');
 assert.match(edu,/국가교육과정정보센터/);
 assert.match(edu,/observationNote/);
 assert.doesNotMatch(edu,/는 점이 인상적임/);
 assert.doesNotMatch(edu,/\$\{attitude\}며/);
 assert.doesNotMatch(edu,/\$\{attitude\}고/);
});
test('wordchain, bomb, roulette and mafia have explicit game safeguards',()=>{
 assert.match(read('끝말잇기 게임.html'),/submitInFlight/);
 assert.match(read('끝말잇기 게임.html'),/latest\.mission/);
 assert.match(read('폭탄돌리기.html'),/performance\.now\(\)/);
 assert.match(read('폭탄돌리기.html'),/randomQueue/);
 assert.match(read('범퍼 룰렛.html'),/무작위 추첨이 아닙니다/);
 assert.match(read('범퍼 룰렛.html'),/escapeDisplay\(res\.marble\.name\)/);
 assert.match(read('교실용 마피아 게임.html'),/String\(state\.setup\.password\)\.length<4/);
 assert.match(read('교실용 마피아 게임.html'),/closeTeacherPanel\(\);pauseTimer\(\)/);
});
test('Chrome runs wordchain, bomb and curriculum edits, and checks teacher privacy',{timeout:180000,skip:!available&&'Chrome driver/browser not available'},async()=>{
 const server=spawn('python3',['-m','http.server','8995','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  let up=false;
  for(let i=0;i<100;i++){try{if((await fetch(origin+'data-standards.js')).ok){up=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.equal(up,true);
  browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(12000);
  await page.goto(origin+encodeURIComponent('끝말잇기 게임.html'));
  await page.locator('#namesInput').fill('하나\n두리\n세나');
  await page.locator('#dictionaryOn').uncheck();
  await page.locator('#missionOn').check();
  await page.locator('#timerOn').uncheck();
  await page.locator('#startBtn').click();
  await page.evaluate(()=>{state.missionIndex=2;});
  await page.locator('#wordInput').fill('학교');
  await page.locator('#submitBtn').click();
  await page.locator('#chainFlow').getByText('학교').first().waitFor();
  const afterWord=await page.evaluate(()=>({score:state.blueScore+state.redScore,mission:state.records.at(-1).mission}));
  assert.equal(afterWord.mission,false);
  await page.locator('#missionSuccessBtn').click();
  const first=await page.evaluate(()=>state.blueScore+state.redScore);
  await page.locator('#missionSuccessBtn').click();
  assert.equal(await page.evaluate(()=>state.blueScore+state.redScore),first);
  await page.locator('#pauseBtn').click();
  assert.equal(await page.evaluate(()=>state.paused),true);
  await page.locator('#pauseBtn').click();
  assert.equal(await page.evaluate(()=>state.paused),false);

  await page.goto(origin+encodeURIComponent('폭탄돌리기.html'));
  await page.locator('#player-names').fill('하나\n두리\n세나');
  await page.locator('input[name="play-mode"][value="random"]').check();
  await page.locator('#time-limit').fill('5');
  await page.getByRole('button',{name:/게임 시작/}).click();
  const before=await page.evaluate(()=>currentPlayerIndex);
  await page.locator('#pass-btn').click();
  const next=await page.evaluate(()=>currentPlayerIndex);
  assert.notEqual(before,next);
  await page.locator('#pass-btn').click();
  const third=await page.evaluate(()=>currentPlayerIndex);
  assert.notEqual(third,next);assert.notEqual(third,before);
  await page.locator('#pause-btn').click();
  const frozen=await page.evaluate(()=>timeLeft);
  await page.waitForTimeout(240);
  assert.equal(await page.evaluate(()=>timeLeft),frozen);
  await page.locator('#pause-btn').click();
  await page.evaluate(()=>{deadline=performance.now()-5;gameLoop();});
  assert.equal(await page.locator('#result-screen.hidden').count(),0);
  assert.match(await page.locator('#result-screen').textContent(),/주인공/);

  await page.goto(origin+encodeURIComponent('뚝딱교육.html'));
  assert.match(await page.locator('body').textContent(),/공식 원문/);
  assert.equal(await page.locator('#eduCount').textContent(),'447개 성취기준');
  await page.locator('#studentName').fill('하늘');
  await page.locator('#observationNote').fill('관찰한 자료에서 공통점을 찾아 친구에게 설명함');
  await page.locator('#subjectFilter').selectOption({label:'국어'});
  await page.locator('#eduCards .standard-actions button').first().click();
  const generated=await page.locator('#sentenceOutput .sentence-text').first().textContent();
  assert.match(generated,/하늘 학생은/);
  assert.match(generated,/친구에게 설명함/);
  assert.doesNotMatch(generated,/함는|함며|돋보임며/);
  await page.locator('#sentenceOutput [data-action="favorite"]').first().click();
  assert.equal(await page.locator('#favoriteList .favorite-item').count(),1);
  await page.reload();
  assert.equal(await page.locator('#favoriteList .favorite-item').count(),1);
 }finally{await browser?.close();server.kill('SIGTERM');}
});
test('Chrome requires a teacher PIN before sharing mafia roles and labels directed roulette races',{timeout:180000,skip:!available&&'Chrome driver/browser not available'},async()=>{
 const server=spawn('python3',['-m','http.server','8996','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  let up=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8996/교실용%20마피아%20게임.html')).ok){up=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  assert.equal(up,true);
  browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8996'?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(13000);
  await page.goto('http://127.0.0.1:8996/'+encodeURIComponent('교실용 마피아 게임.html'));
  page.once('dialog',dlg=>dlg.accept());
  await page.getByRole('button',{name:'역할 배정하고 시작'}).click();
  assert.equal(await page.locator('#phaseLabel').textContent(),'준비 중');
  await page.locator('input[type="password"]').fill('6527');
  await page.getByRole('button',{name:'역할 배정하고 시작'}).click();
  assert.equal(await page.locator('#phaseLabel').textContent(),'역할 확인');
  assert.ok(await page.locator('#roleRevealBox.concealed').count()===1);
  await page.locator('#app button').filter({hasText:'역할 보기'}).first().click();
  assert.equal(await page.locator('#roleRevealBox.concealed').count(),1);
  await page.locator('#holdRoleBtn').dispatchEvent('pointerdown');
  assert.equal(await page.locator('#roleRevealBox.concealed').count(),0);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('#roleRevealBox.concealed').count(),1);
  await page.evaluate(()=>hideRoleModal());
  await page.goto('http://127.0.0.1:8996/'+encodeURIComponent('범퍼 룰렛.html'));
  await page.locator('#names-input').fill('하나\n둘');
  await page.locator('#slots-input').fill('질문\n통과');
  await page.locator('#cheat-list .cheat-name').first().fill('하나');
  await page.locator('#cheat-list .cheat-result').first().fill('질문');
  page.once('dialog',dlg=>dlg.accept());
  await page.locator('#start-btn').click();
  await page.locator('#directed-result-notice:not(.hidden)').waitFor();
  assert.match(await page.locator('#directed-result-notice').textContent(),/무작위 추첨이 아닙니다/);
 }finally{await browser?.close();server.kill('SIGTERM');}
});
})();
