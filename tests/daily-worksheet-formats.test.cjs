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
  await page.locator('.gx-worksheet-picker summary').click();await page.locator('[data-worksheet-subject="korean"]').click();
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
  await page.locator('.gx-worksheet-picker summary').click();await page.locator('[data-worksheet-subject="math"]').click();
  assert.equal(await page.locator('#responseSetting').isVisible(),false);
  assert.equal(await page.locator('#typeSetting').isVisible(),true);
  await page.locator('.gx-worksheet-picker summary').click();await page.locator('[data-worksheet-subject="english"]').click();
  assert.equal(await page.locator('#unitSetting').isVisible(),false,'do not show an empty unit selector for English');
  await page.selectOption('#grade','3');
  await page.selectOption('#topic','sentence');
  assert.deepEqual(await page.locator('#responseFormat option').evaluateAll(nodes=>nodes.map(x=>x.value)),['short']);
  assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});


test('worksheet subject navigation and horizontal settings work on desktop and mobile',{skip:(!chrome||!chromium)&&'Chrome required',timeout:90000},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href,{waitUntil:'load'});
 async function geometry(){return page.evaluate(()=>{const s=document.getElementById('sheetForm').getBoundingClientRect(),o=document.querySelector('.daily-output').getBoundingClientRect();return {settings:{x:s.x,y:s.y,width:s.width,bottom:s.bottom},output:{x:o.x,y:o.y,width:o.width}}})}
 let rect=await geometry();assert.ok(rect.settings.width>1100,'settings should span the workspace');assert.ok(rect.output.y>=rect.settings.bottom,'preview belongs below settings');assert.ok(Math.abs(rect.settings.width-rect.output.width)<3);
 assert.equal(await page.locator('.subject-source').isVisible(),false,'subject belongs in top navigation');
 await page.locator('.gx-worksheet-picker summary').click();assert.equal(await page.locator('.gx-subject-menu a').count(),5);await page.locator('[data-worksheet-subject="english"]').click();
 assert.equal(await page.locator('#filterSubjectTitle').textContent(),'영어 문제지 설정');assert.equal(await page.locator('.gx-worksheet-picker').getAttribute('open'),null);
 await page.selectOption('#grade','5');await page.selectOption('#topic','message-reading');await page.selectOption('#count','20');await page.locator('button.daily-primary').click();
 assert.equal(await page.locator('#questions>li').count(),20);assert.match(await page.locator('#questionSheet #paperTitle').textContent(),/영어/);assert.match(await page.locator('#filterSelectionSummary').textContent(),/20문항/);
 await page.locator('.gx-worksheet-picker summary').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.gx-worksheet-picker').getAttribute('open'),null);
 await page.screenshot({path:'test-artifacts/worksheet-horizontal-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.locator('.gx-worksheet-picker summary').click();await page.locator('[data-worksheet-subject="science"]').click();
 assert.equal(await page.locator('#filterSubjectTitle').textContent(),'과학 문제지 설정');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 rect=await geometry();assert.ok(rect.output.y>=rect.settings.bottom);await page.screenshot({path:'test-artifacts/worksheet-horizontal-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('collapsible unit quotas generate exact counts, survive reload and print on mobile',{skip:(!chrome||!chromium)&&'Chrome required',timeout:90000},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href,{waitUntil:'load'});
 assert.equal(await page.locator('#unitMixSettings').getAttribute('open'),null);
 await page.locator('#unitMixSettings summary').click();await page.locator('#unitMixEnabled').check();await page.locator('#addUnitMix').click();
 const rows=page.locator('.unit-mix-row');await rows.nth(0).locator('input').fill('3');await rows.nth(1).locator('input').fill('7');
 await page.locator('button.daily-primary').click();assert.equal(await page.locator('#questions>li').count(),10);assert.match(await page.locator('#questionSheet #paperTitle').textContent(),/여러 단원/);
 assert.equal(await page.locator('#count').isDisabled(),true);const url=page.url();assert.ok(url.includes('unitMix='));
 await page.reload();assert.equal(await rows.count(),2);assert.equal(await rows.nth(1).locator('input').inputValue(),'7');assert.equal(await page.locator('#questions>li').count(),10);
 const packed=await page.evaluate(()=>window.DailyWorksheetA4.compose());assert.ok(packed.ok,packed.issue);
 await page.emulateMedia({media:'print'});await page.pdf({path:'test-artifacts/worksheet-unit-mix-student.pdf',format:'A4',printBackground:true});
 await page.evaluate(()=>{document.body.classList.add('print-answers');window.DailyWorksheetA4.compose()});await page.pdf({path:'test-artifacts/worksheet-unit-mix-teacher.pdf',format:'A4',printBackground:true});
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'test-artifacts/worksheet-unit-mix-mobile.png',fullPage:true});
 await rows.nth(1).locator('button').click();assert.equal(await rows.count(),1);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
