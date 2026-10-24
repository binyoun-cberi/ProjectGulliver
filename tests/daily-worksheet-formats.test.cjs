'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path');const {pathToFileURL}=require('node:url');
const C=require('../daily-worksheet-core.js');
const sets=[
 {subject:'korean',topic:'vocabulary',type:'vocabulary-context',grade:4},
 {subject:'korean',topic:'reading-set',type:'reading-set-five',grade:4},
 {subject:'social',topic:'past',type:'past-evidence',grade:3},
 {subject:'social',topic:'prehistoric',type:'prehistoric-quiz',grade:5},
 {subject:'social',topic:'history-mix',type:'history-mix-quiz',grade:5,eras:['joseon','modern']},
 {subject:'science',topic:'plant-observation',grade:3},
 {subject:'science',topic:'matter',grade:3},
 {subject:'english',topic:'words',grade:3},
 {subject:'english',topic:'message-reading',grade:5}
];
test('unit/topic concerns WHAT to teach; a different list controls HOW to answer',()=>{
 for(const set of sets){
  const formats=C.answerFormats(set.subject,set.topic);
  assert.deepEqual(formats.map(([f])=>f),['choice','ox','short','essay'],set.subject+'/'+set.topic);
 }
 assert.deepEqual(C.answerFormats('math','addition'),[]);
 assert.deepEqual(C.answerFormats('english','sentence').map(x=>x[0]),['short']);
 assert.deepEqual(C.answerFormats('social','history-review').map(x=>x[0]),['activity']);
 assert.deepEqual(C.answerFormats('korean','spacing').map(x=>x[0]),['choice','ox','short']);
 const html=fs.readFileSync('문제지 만들기.html','utf8');
 assert.match(html,/id="typeSetting"/);assert.match(html,/id="responseSetting"/);
 assert.match(html,/name="responseFormat"/);
 const browser=fs.readFileSync('daily-worksheet.js','utf8');
 assert.match(browser,/topic==='reading-set'\?'읽을 글의 종류'/);
 assert.match(browser,/syncAnswerFormats/);
});
test('all four subjects generate real deterministic response formats without changing legacy content IDs',()=>{
 for(const set of sets){
  for(const format of ['choice','ox','short','essay']){
   const input={...set,count:10,seed:301,responseFormat:format};
   const sheet=C.generate(input);
   assert.equal(sheet.responseFormat,format);
   assert.equal(sheet.items.length,10,JSON.stringify(input));
   assert.deepEqual(sheet,C.generate(input),'seeded worksheets must be reproducible');
   const unique=new Set(sheet.items.map(item=>item.prompt+'|'+item.detail+'|'+(item.oxProposal||'')));
   assert.equal(unique.size,10,'questions remain distinct for '+JSON.stringify(input));
   for(const item of sheet.items){
    if(format==='choice'){assert.ok(item.choices.length>=2);assert.ok(item.choices.includes(item.answer));}
    if(format==='ox'){
     assert.deepEqual(item.choices,['O','X']);
     assert.ok(item.answer==='O'||item.answer==='X');
     assert.ok(item.oxProposal);
     assert.equal(item.answer==='O',item.originalAnswer===item.oxProposal,'OX truth must not be inverted');
    }
    if(format==='short'){
     assert.deepEqual(item.choices,[]);
     assert.ok(item.answer.length);
     assert.doesNotMatch(item.prompt,/고르세요[.]?$/);
    }
    if(format==='essay'){
     assert.deepEqual(item.choices,[]);
     assert.equal(item.format,'essay');
     assert.match(item.prompt,/까닭/);
     assert.ok(item.modelExplanation.length>8);
    }
   }
   if(format==='ox'){
    assert.equal(sheet.items.filter(item=>item.answer==='O').length,5,'half the statements must be correct');
    assert.equal(sheet.items.filter(item=>item.answer==='X').length,5,'half the statements must be false');
   }
  }
 }
});
test('legacy math and curriculum practice keep their original answer formats',()=>{
 const math=C.generate({subject:'math',topic:'addition',grade:1,count:10,seed:19});
 assert.ok(math.items.every(item=>!item.responseFormat));
 assert.throws(()=>C.generate({subject:'math',topic:'addition',grade:1,count:10,seed:19,responseFormat:'essay'}),/사용할 수 없/);
 const writing=C.generate({subject:'english',topic:'sentence',grade:3,count:5,seed:11,responseFormat:'short'});
 assert.ok(writing.items.every(item=>item.choices.length===0));
 assert.throws(()=>C.generate({subject:'english',topic:'sentence',grade:3,count:5,seed:11,responseFormat:'choice'}),/사용할 수 없/);
 const review=C.generate({subject:'social',topic:'history-review',type:'history-matching',grade:5,count:10,seed:17,responseFormat:'activity'});
 assert.ok(review.items.every(item=>item.format==='matching'));
 assert.throws(()=>C.generate({subject:'social',topic:'history-review',type:'history-matching',grade:5,count:10,seed:17,responseFormat:'ox'}),/사용할 수 없/);
});
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
test('browser dropdown and actual A4 student/teacher layouts reflect the selected format',{skip:!chrome&&'Chrome required',timeout:135000},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href,{waitUntil:'load'});
  await page.locator('input[name="subject"][value="korean"]').check();
  await page.selectOption('#grade','4');
  await page.selectOption('#unit','k4-vocabulary');
  await page.selectOption('#topic','vocabulary');
  assert.equal(await page.locator('#responseSetting').isVisible(),true);
  assert.equal(await page.locator('#topicSetting').isVisible(),true,'show actual multiple learning content choices');
  assert.equal(await page.locator('#typeSetting').isVisible(),false,'word banks are not response formats');
  assert.deepEqual(await page.locator('#responseFormat option').evaluateAll(nodes=>nodes.map(x=>x.textContent)),['객관식 (보기 고르기)','OX형','단답형','서술형']);
  for(const mode of ['ox','short','essay','choice']){
   await page.selectOption('#responseFormat',mode);
   await page.selectOption('#count','5');
   await page.locator('button.daily-primary').click();
   await page.waitForFunction(()=>document.querySelector('#questions')?.children.length===5);
   const classes=await page.locator('#questions > li').first().getAttribute('class')||'';
   if(mode==='ox')assert.match(classes,/ox-question/);
   if(mode==='essay')assert.match(classes,/essay-question/);
   if(mode==='essay')assert.equal(await page.locator('#questions .essay-writing').count(),5);
   if(mode==='short')assert.equal(await page.locator('#questions .choice-list').count(),0);
   const packed=await page.evaluate(()=>window.DailyWorksheetA4.compose());
   assert.ok(packed.ok,'A4 page composition succeeds for '+mode+': '+packed.issue);
   if(mode==='essay')assert.ok(packed.pages>=1);
  }
  await page.locator('input[name="subject"][value="math"]').check();
  assert.equal(await page.locator('#responseSetting').isVisible(),false);
  assert.equal(await page.locator('#typeSetting').isVisible(),true);
  await page.locator('input[name="subject"][value="english"]').check();
  assert.equal(await page.locator('#unitSetting').isVisible(),false,'do not show an empty unit selector for English');
  await page.selectOption('#grade','3');
  await page.selectOption('#topic','sentence');
  assert.deepEqual(await page.locator('#responseFormat option').evaluateAll(nodes=>nodes.map(x=>x.value)),['short']);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
