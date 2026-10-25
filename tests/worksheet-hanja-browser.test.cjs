'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),fs=require('node:fs');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/opt/google/chrome/chrome'].find(p=>p&&fs.existsSync(p));
test('hanja tracing prints whole A4 exercises, survives reload and subject switches, and fits mobile',{timeout:120000,skip:!chromium||!chrome},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--single-process','--no-zygote','--disable-gpu']});
 try{
 if(process.env.WORKSHEET_QA_DIR)fs.mkdirSync(process.env.WORKSHEET_QA_DIR,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const topic of ['hanja-trace','idiom-trace'])for(const count of [5,10,15,20])for(const large of [false,true]){
  const url=pathToFileURL(path.resolve('문제지 만들기.html'));url.search=new URLSearchParams({subject:'hanja',hanjaLevel:'3',topic,count:String(count),seed:'42',...(large?{large:'1'}:{})});
  await page.goto(url.href);await page.waitForFunction(n=>document.querySelectorAll('#questions > li').length===n,count);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#grade').isVisible(),false);assert.doesNotMatch(await page.locator('#questionSheet #paperTitle').innerText(),/학년/);assert.ok(!new URL(page.url()).searchParams.has('grade'));
  assert.equal(await page.locator('.textbook-flow').isVisible(),false);assert.equal(await page.locator('#unitMixSettings').isVisible(),false);
  assert.equal(await page.locator('#responseFormat').inputValue(),'trace');
  assert.ok(await page.evaluate(()=>document.fonts.check('24px "Clasheet Hanja Practice"','學')));
  await page.emulateMedia({media:'print'});
  const result=await page.evaluate(()=>{const r=DailyWorksheetA4.compose();return {...r,count:document.querySelectorAll('#printPages .hanja-practice').length,overflow:[...document.querySelectorAll('#printPages .print-paper')].some(p=>[...p.querySelectorAll('.hanja-cell')].some(c=>c.getBoundingClientRect().right>p.getBoundingClientRect().right+1||c.getBoundingClientRect().bottom>p.getBoundingClientRect().bottom-10*96/25.4))}});
  assert.equal(result.ok,true,result.issue);assert.equal(result.count,count);assert.equal(result.overflow,false);
  await page.emulateMedia({media:'screen'});
  if(count===5&&!large){
   const original=await page.locator('#questions').innerHTML(),saved=page.url();await page.goto(saved);assert.equal(await page.locator('#questions').innerHTML(),original);
   if(process.env.WORKSHEET_QA_DIR){await page.emulateMedia({media:'print'});await page.evaluate(()=>DailyWorksheetA4.compose());await page.locator('#printPages .print-paper').first().screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,topic+'.png')});await page.emulateMedia({media:'screen'});}
   await page.emulateMedia({media:'print'});const expected=await page.evaluate(()=>DailyWorksheetA4.compose());const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:false});assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,expected.pages);await page.emulateMedia({media:'screen'});
  }
 }
 await page.selectOption('#idiomLevel','advanced');assert.equal(await page.locator('#count').inputValue(),'10');await page.locator('#sheetForm').evaluate(f=>f.requestSubmit());assert.match(await page.locator('#questionSheet #paperTitle').innerText(),/심화/);
 await page.selectOption('#responseFormat','blank');await page.locator('#sheetForm').evaluate(f=>f.requestSubmit());assert.equal(await page.locator('#questions .trace').count(),0);assert.ok(await page.locator('#questions .empty').count()>0);
 // Exercise actual navigation, including returning from the textbook UI.
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('gulliver:worksheet-subject',{detail:{subject:'korean'}})));
 assert.equal(await page.locator('.textbook-flow').isVisible(),true);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('gulliver:worksheet-subject',{detail:{subject:'hanja'}})));
 await page.locator('#sheetForm').evaluate(f=>f.requestSubmit());assert.ok(await page.locator('#questions .hanja-practice').count()>0);
 for(const [level,label] of [['8','8급'],['pre4','준4급'],['4','4급'],['pre3','준3급'],['3','3급']]){await page.selectOption('#hanjaLevel',level);await page.locator('#sheetForm').evaluate(f=>f.requestSubmit());assert.match(await page.locator('#questionSheet #paperTitle').innerText(),new RegExp(label));const saved=page.url();assert.equal(new URL(saved).searchParams.get('hanjaLevel'),level);const original=await page.locator('#questions').innerHTML();await page.goto(saved);assert.equal(await page.locator('#questions').innerHTML(),original);}
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
