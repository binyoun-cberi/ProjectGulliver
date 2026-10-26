'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p)),dir=process.env.WORKSHEET_QA_DIR;
test('eight science targets show all shared tables and diagrams on desktop, phone and A4 without answer leaks',{skip:!chromium||!chrome,timeout:120000},async()=>{
 const E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),D=require('../worksheet-science-depth');
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));if(dir)fs.mkdirSync(dir,{recursive:true});
  async function fonts(){if(process.env.WORKSHEET_FONT_CSS){const f=process.env.WORKSHEET_FONT_CSS,css=fs.readFileSync(f,'utf8').replace(/url\(([^)]+)\)/g,(_,url)=>'url("'+pathToFileURL(path.resolve(path.dirname(f),url.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:css+'\nbody,body *{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}}
  for(const bankId of new Set(D.items().map(q=>q.bankId))){
   const unit=T.catalog.find(u=>u.lessons.some(l=>T.binding(u,l)?.bankId===bankId)),lesson=unit.lessons.find(l=>T.binding(unit,l)?.bankId===bankId),binding=T.binding(unit,lesson);
   const pool=E.banks.find(b=>b.id===bankId).items.filter(q=>binding.ids.includes(q.evidenceId)),indexes=pool.map((q,i)=>q.scienceDepth?i:-1).filter(i=>i>=0);
   const url=pathToFileURL(path.resolve('문제지 만들기.html')).href+'?'+new URLSearchParams({subject:'science',grade:unit.grade,semester:unit.semester,unit:unit.id,lesson:lesson.id,count:'20',format:'choice',seed:'42',pick:indexes.join(',')});
   await page.goto(url);await fonts();assert.equal(await page.locator('#questions>li').count(),20);assert.equal(await page.locator('#questions .science-material').count(),4);assert.equal(await page.locator('#questions .science-material table').count(),3);assert.equal(await page.locator('#questions .science-material svg').count(),1);assert.equal(await page.locator('#questions .inline-answer:visible').count(),0);
   const original=await page.locator('#questions').innerHTML();await page.goto(page.url());await fonts();assert.equal(await page.locator('#questions').innerHTML(),original);
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),bankId);
   if(dir&&unit.grade===6)await page.screenshot({path:path.join(dir,bankId+'-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});
   if(dir&&bankId==='science-term1-14')await page.screenshot({path:path.join(dir,'science-solution-desktop.png'),fullPage:true});
   await page.emulateMedia({media:'print'});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);const pack=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(pack.ok,bankId+' '+pack.issue);assert.equal(await page.locator('#printPages .print-question-list>li').count(),20);assert.equal(await page.locator('#printPages .science-material').count(),4);assert.equal(await page.locator('#printPages .inline-answer:visible').count(),teacher?20:0);
    if(dir&&bankId==='science-sem2-6-61'){await page.locator('#printPages .print-paper').last().screenshot({path:path.join(dir,teacher?'science-circuit-teacher.png':'science-circuit-student.png')});await page.pdf({path:path.join(dir,teacher?'science-circuit-teacher.pdf':'science-circuit-student.pdf'),format:'A4',printBackground:true});}
   }
   await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-answers'));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
