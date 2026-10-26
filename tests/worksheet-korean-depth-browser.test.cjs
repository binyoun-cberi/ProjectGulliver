'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p)),dir=process.env.WORKSHEET_QA_DIR;
test('expanded Korean objectives show 20 valid questions, preserve poems and print complete student and teacher papers',{skip:!chromium||!chrome,timeout:120000},async()=>{
 const T=require('../worksheet-learning'),E=require('../worksheet-evidence-banks'),targets=T.catalog.filter(u=>u.subject==='korean').flatMap(u=>u.lessons.map(l=>({u,l,b:T.binding(u,l)}))).filter(t=>t.b);
 const specs=[{grade:2,bank:'main-content'},{grade:3,bank:'fact-opinion'},{grade:5,profile:'figure',genre:'poetry'},{grade:5,profile:'figure',genre:'literary'},{grade:5,profile:'structure'},{grade:6,profile:'flow'}];
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));if(dir)fs.mkdirSync(dir,{recursive:true});
  async function fonts(){if(process.env.WORKSHEET_FONT_CSS){const f=process.env.WORKSHEET_FONT_CSS,css=fs.readFileSync(f,'utf8').replace(/url\(([^)]+)\)/g,(_,url)=>'url("'+pathToFileURL(path.resolve(path.dirname(f),url.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:css+'\nbody,body *{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}}
  for(const spec of specs){
   const t=targets.find(t=>t.u.grade===spec.grade&&(spec.bank?t.b.bankId===spec.bank:t.b.koreanProfile===spec.profile)&&(!spec.genre||t.b.pool.every(q=>q.readingGenre===spec.genre)));assert.ok(t);
   const pool=t.b.pool||E.banks.find(b=>b.id===t.b.bankId).items.filter(q=>t.b.ids.includes(q.evidenceId)),newIndexes=pool.map((q,i)=>q.koreanDepth||q.evidenceId.startsWith('kr-upper-depth-')?i:-1).filter(i=>i>=0),others=pool.map((_,i)=>i).filter(i=>!newIndexes.includes(i)),indexes=[...newIndexes,...others].slice(0,20),key=spec.bank||spec.profile+'-'+(spec.genre||'all');
   const url=pathToFileURL(path.resolve('문제지 만들기.html')).href+'?'+new URLSearchParams({subject:'korean',grade:t.u.grade,semester:t.u.semester,unit:t.u.id,lesson:t.l.id,count:'20',format:'choice',seed:'42',pick:indexes.join(',')});
   await page.goto(url);await fonts();assert.equal(await page.locator('#questions>li').count(),20);assert.equal(await page.locator('#questions .inline-answer:visible').count(),0);assert.equal(await page.locator('#count option[value="20"]').count(),1);
   if(spec.genre==='poetry')assert.equal(await page.locator('.reading-text p').first().evaluate(e=>getComputedStyle(e).whiteSpace),'pre-wrap');
   const original=await page.locator('#questions').innerHTML();await page.goto(page.url());await fonts();assert.equal(await page.locator('#questions').innerHTML(),original);
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),key);if(dir&&spec.genre==='poetry')await page.screenshot({path:path.join(dir,'korean-figurative-mobile.png'),fullPage:true});await page.setViewportSize({width:1440,height:1000});
   if(dir&&spec.profile==='structure')await page.screenshot({path:path.join(dir,'korean-structure-desktop.png'),fullPage:true});
   await page.emulateMedia({media:'print'});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);const result=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(result.ok,key+' '+result.issue);assert.equal(await page.locator('#printPages .print-question-list>li').count(),20);assert.equal(await page.locator('#printPages .inline-answer:visible').count(),teacher?20:0);
    if(dir&&spec.genre==='poetry'){await page.locator('#printPages .print-paper').first().screenshot({path:path.join(dir,teacher?'korean-poetry-teacher.png':'korean-poetry-student.png')});await page.pdf({path:path.join(dir,teacher?'korean-poetry-teacher.pdf':'korean-poetry-student.pdf'),format:'A4',printBackground:true});}
   }
   await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-answers'));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
