'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p)),dir=process.env.WORKSHEET_QA_DIR;
test('new modern readings and tables load in actual lesson and legacy pages, replay and fit A4',{skip:!chromium||!chrome||!fs.existsSync(chrome),timeout:120000},async()=>{
 const E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),D=require('../data/history-modern-depth');
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function fonts(){if(process.env.WORKSHEET_FONT_CSS){const f=process.env.WORKSHEET_FONT_CSS,css=fs.readFileSync(f,'utf8').replace(/url\(([^)]+)\)/g,(_,url)=>'url("'+pathToFileURL(path.resolve(path.dirname(f),url.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:css+'\nbody,body *{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}}
  if(dir)fs.mkdirSync(dir,{recursive:true});
  const base=pathToFileURL(path.resolve('문제지 만들기.html')).href;
  for(const bankId of new Set(D.items().map(q=>q.bankId))){
   const unit=T.catalog.find(u=>u.lessons.some(l=>T.binding(u,l)?.bankId===bankId)),lesson=unit.lessons.find(l=>T.binding(unit,l)?.bankId===bankId),binding=T.binding(unit,lesson);
   const pool=E.banks.find(b=>b.id===bankId).items.filter(q=>binding.ids.includes(q.evidenceId)),indexes=pool.map((q,i)=>q.modernDepth?i:-1).filter(i=>i>=0).slice(0,20);
   const url=base+'?'+new URLSearchParams({subject:'social',grade:'5',semester:'2',unit:unit.id,lesson:lesson.id,count:'20',format:'choice',seed:'42',pick:indexes.join(',')});
   await page.goto(url);await fonts();assert.equal(await page.locator('#questions>li').count(),20,bankId);assert.ok((await page.locator('#questions').textContent()).includes(D.items().find(q=>q.bankId===bankId).answer));
   assert.equal(await page.locator('#questions .inline-answer:visible').count(),0);const original=await page.locator('#questions').innerHTML();const saved=page.url();await page.goto(saved);await fonts();assert.equal(await page.locator('#questions').innerHTML(),original);
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),bankId);
   if(dir&&bankId==='republic-founding')await page.screenshot({path:path.join(dir,'history-government-mobile.png'),fullPage:true});
   await page.setViewportSize({width:1440,height:1000});if(dir&&bankId==='independence-1919')await page.screenshot({path:path.join(dir,'history-1919-desktop.png'),fullPage:true});
   await page.emulateMedia({media:'print'});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);
    const pack=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(pack.ok,bankId+': '+pack.issue);assert.equal(await page.locator('#printPages .print-question-list>li').count(),20);
    assert.equal(await page.locator('#printPages .inline-answer:visible').count(),teacher?20:0);
    if(dir&&bankId==='independence-1919')await page.locator('#printPages .print-paper').first().screenshot({path:path.join(dir,teacher?'history-1919-print-teacher.png':'history-1919-print-student.png')});
    if(dir&&bankId==='independence-1919')await page.pdf({path:path.join(dir,teacher?'history-1919-teacher.pdf':'history-1919-student.pdf'),format:'A4',printBackground:true});
   }
   await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-answers'));
  }
  await page.goto(base+'?subject=social&grade=5&topic=modern&type=modern-quiz&count=20&seed=42');assert.equal(await page.locator('#questions>li').count(),20);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
