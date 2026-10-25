'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{pathToFileURL}=require('node:url'),path=require('node:path');
let chromium;try{({chromium}=require('playwright-core'))}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
test('short mixed calculation sheets use the A4 preview and print area, including resize and answer toggles',{timeout:120000,skip:!chromium||!chrome},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--single-process','--no-zygote','--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=pathToFileURL(path.resolve('문제지 만들기.html'));url.search=new URLSearchParams({subject:'math',grade:5,mode:'standard',standard:'6수01-01',count:5,format:'short',seed:73});
  await page.goto(url.href);await page.waitForFunction(()=>document.querySelector('#questionSheet.roomy-preview'));
  async function preview(){return page.evaluate(()=>{DailyWorksheetA4.refreshPreview();const sheet=document.querySelector('#questionSheet'),q=document.querySelector('#questions'),footer=sheet.querySelector('footer'),padding=parseFloat(getComputedStyle(sheet).paddingBottom);return {roomy:sheet.classList.contains('roomy-preview'),count:q.children.length,share:q.getBoundingClientRect().height/(sheet.getBoundingClientRect().bottom-padding-footer.getBoundingClientRect().height-q.getBoundingClientRect().top),overflow:footer.getBoundingClientRect().bottom>sheet.getBoundingClientRect().bottom-padding+1,lines:[...q.querySelectorAll('.answer-blank')].map(l=>l.getBoundingClientRect().bottom)};});}
  let layout=await preview();assert.equal(layout.count,5);assert.ok(layout.roomy);assert.ok(layout.share>.85);assert.equal(layout.overflow,false);
  await page.click('#toggleAnswers');layout=await preview();assert.equal(layout.overflow,false);await page.click('#toggleAnswers');
  await page.setViewportSize({width:390,height:900});layout=await preview();assert.equal(layout.roomy,false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  await page.setViewportSize({width:1440,height:1200});assert.equal((await preview()).roomy,true);
  await page.emulateMedia({media:'print'});const printed=await page.evaluate(()=>{const result=DailyWorksheetA4.compose(),p=document.querySelector('#printPages .print-paper'),q=p.querySelector('.print-question-list'),items=[...q.children];return {...result,columns:getComputedStyle(q).gridTemplateColumns.split(' ').length,share:(Math.max(...items.map(i=>i.getBoundingClientRect().bottom))-q.getBoundingClientRect().top)/(p.getBoundingClientRect().bottom-17*96/25.4-q.getBoundingClientRect().top),overflow:items.some(i=>i.getBoundingClientRect().bottom>p.getBoundingClientRect().bottom-11*96/25.4+1),leaks:items.flatMap(i=>[...i.querySelectorAll('.result-answer')]).some(a=>getComputedStyle(a).visibility!=='hidden'&&getComputedStyle(a).display!=='none')};});
  assert.equal(printed.ok,true);assert.equal(printed.pages,1);assert.equal(printed.columns,1);assert.ok(printed.share>.90);assert.equal(printed.overflow,false);assert.equal(printed.leaks,false);
  const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,1);
  await page.emulateMedia({media:'screen'});assert.equal((await preview()).roomy,true);
  await page.check('#largePrint');await page.waitForFunction(()=>document.querySelector('#questionSheet.roomy-preview'));assert.equal((await preview()).overflow,false);
  await page.evaluate(()=>WorksheetEditor.clear());assert.equal((await preview()).roomy,false);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
