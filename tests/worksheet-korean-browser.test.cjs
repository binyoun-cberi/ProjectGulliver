'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const T=require('../worksheet-learning'),K=require('../worksheet-korean-readings');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=process.env.CHROME_BIN;
test('Korean lessons render and replay their passages, print complete student and teacher copies, and fit mobile',{timeout:120000,skip:!chromium||!chrome},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--single-process','--no-zygote','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [grade,profile] of [[3,'poetry'],[4,'story'],[5,'nonfiction'],[6,'poetry']]){
   const u=T.catalog.find(u=>u.subject==='korean'&&u.grade===grade&&u.lessons.some(l=>K.find(u,l)?.koreanProfile===profile));
   const l=u.lessons.find(l=>K.find(u,l)?.koreanProfile===profile),url=pathToFileURL(path.resolve('문제지 만들기.html'));
   url.search=new URLSearchParams({subject:'korean',grade,semester:u.semester,unit:u.id,lesson:l.id,count:20,format:'choice',seed:42});
   await page.goto(url.href);await page.waitForFunction(()=>document.querySelectorAll('#questions > li').length===20);
   if(process.env.WORKSHEET_FONT_CSS){await page.addStyleTag({url:pathToFileURL(process.env.WORKSHEET_FONT_CSS).href});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
   const original=await page.locator('#questions').innerHTML();assert.equal(await page.locator('#questions .reading-text').count(),4);
   if(profile==='poetry')assert.equal(await page.locator('.reading-text p').first().evaluate(e=>getComputedStyle(e).whiteSpace),'pre-wrap');
   const saved=page.url();await page.goto(saved);assert.equal(await page.locator('#questions').innerHTML(),original);
   if(process.env.WORKSHEET_FONT_CSS){await page.addStyleTag({url:pathToFileURL(process.env.WORKSHEET_FONT_CSS).href});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
   if(process.env.WORKSHEET_QA_DIR)await page.locator('#questionSheet').screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,`korean-${grade}.png`)});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);await page.emulateMedia({media:'print'});
    const result=await page.evaluate(()=>{
     const composed=DailyWorksheetA4.compose(),papers=[...document.querySelectorAll('#printPages .print-paper')],items=papers.flatMap(p=>[...p.querySelectorAll('.print-question-list > li')]);
     return {...composed,count:items.length,passages:papers.flatMap(p=>[...p.querySelectorAll('.reading-text')]).length,
      overflow:papers.some(p=>[...p.querySelectorAll('.print-question-list > li')].some(li=>li.getBoundingClientRect().bottom>p.getBoundingClientRect().bottom-10*96/25.4+2)),
      answers:items.some(li=>[...li.querySelectorAll('.result-answer')].some(a=>getComputedStyle(a).visibility!=='hidden'&&getComputedStyle(a).display!=='none'))};
    });
    assert.equal(result.ok,true,result.issue);assert.equal(result.count,20);assert.equal(result.passages,4);assert.equal(result.overflow,false);assert.equal(result.answers,teacher);
    const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,result.pages);
    if(process.env.WORKSHEET_QA_DIR)fs.writeFileSync(path.join(process.env.WORKSHEET_QA_DIR,`korean-${grade}-${teacher?'teacher':'student'}.pdf`),pdf);
   }
   await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.setViewportSize({width:1440,height:1200});
  }
  const u=T.catalog.find(u=>u.subject==='korean'&&u.grade===5&&u.lessons.some(l=>l.name.trim()==='시에 나타난 비유적 표현 알기')),l=u.lessons.find(l=>l.name.trim()==='시에 나타난 비유적 표현 알기');
  const url=pathToFileURL(path.resolve('문제지 만들기.html'));url.search=new URLSearchParams({subject:'korean',grade:5,semester:u.semester,unit:u.id,lesson:l.id,count:20});await page.goto(url.href);
  assert.equal(await page.locator('#count option[value="20"]').count(),0);assert.match(await page.locator('#textPractice').textContent(),/최대 8문항/);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
