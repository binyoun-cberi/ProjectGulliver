'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
test('dictation audio controls, grade selection, hidden answers, six A4 student/teacher sheets and mobile entry link',{timeout:120000,skip:!chromium||!chrome},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__spoken=[];window.__cancels=0;
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'검사용 한국어 음성',lang:'ko-KR',voiceURI:'test-ko'}],addEventListener:()=>{},resume:()=>{},cancel:()=>{window.__cancels++;},speak:u=>window.__spoken.push(u)}});
   window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  });
  const base=pathToFileURL(path.resolve('받아쓰기.html'));
  await page.goto(base.href+'?grade=1&seed=42');await page.waitForSelector('#dictWritingList>li');assert.equal(await page.evaluate(()=>__spoken.length),0);
  await page.click('#dictStart');assert.equal(await page.evaluate(()=>__spoken.length),1);assert.equal(await page.evaluate(()=>__spoken[0].lang),'ko-KR');
  await page.click('#dictPause');await page.evaluate(()=>__spoken[0].onend());assert.match(await page.locator('#dictStatus').textContent(),/일시정지/);await page.click('#dictStart');assert.equal(await page.evaluate(()=>__spoken[0].text===__spoken[1].text),true);
  await page.selectOption('#dictGrade','6');assert.equal(await page.locator('#dictStart').isEnabled(),true);await page.evaluate(()=>__spoken[1].onend());assert.match(await page.locator('#dictStatus').textContent(),/준비/);
  await page.click('#dictTeacher summary');await page.click('#dictStart');assert.equal(await page.locator('#dictTeacher').evaluate(e=>e.open),false);await page.click('#dictStop');
  for(let grade=1;grade<=6;grade++){
   await page.goto(base.href+`?grade=${grade}&seed=42&topic=${grade===6?'first-semester':'all'}`);await page.waitForSelector('#dictWritingList>li');
   if(process.env.WORKSHEET_FONT_CSS){await page.addStyleTag({url:pathToFileURL(process.env.WORKSHEET_FONT_CSS).href});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
   const original=await page.locator('#dictAnswerList').textContent();assert.equal(await page.locator('#dictWritingList>li').count(),10);assert.equal(await page.locator('#dictTeacher').evaluate(e=>e.open),false);assert.equal(await page.locator('#dictWritingList .dictation-answer:visible').count(),0);
   const saved=page.url();await page.click('#newDictation');assert.notEqual(await page.locator('#dictAnswerList').textContent(),original);await page.goto(saved);assert.equal(await page.locator('#dictAnswerList').textContent(),original);
   if(grade===6){assert.equal(await page.locator('#dictTopic').inputValue(),'first-semester');assert.match(await page.locator('#newDictation').textContent(),/순서/);assert.equal(await page.locator('.dictation-word-focus').count(),10);}
   if(process.env.WORKSHEET_FONT_CSS){await page.addStyleTag({url:pathToFileURL(process.env.WORKSHEET_FONT_CSS).href});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
   if(process.env.WORKSHEET_QA_DIR&&[1,6].includes(grade))await page.screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,`dictation-${grade}-desktop.png`),fullPage:true});
   await page.emulateMedia({media:'print'});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('dictation-print-teacher',t),teacher);
    const visible=await page.locator('#dictWritingList .dictation-answer:visible').count();assert.equal(visible,teacher?10:0);
    assert.equal(await page.locator('#dictPaper').evaluate(p=>p.querySelector('footer').getBoundingClientRect().bottom<=p.getBoundingClientRect().bottom-12*96/25.4),true);
    const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,1,`${grade} teacher=${teacher}: one A4 page`);
    if(process.env.WORKSHEET_QA_DIR)fs.writeFileSync(path.join(process.env.WORKSHEET_QA_DIR,`dictation-${grade}-${teacher?'teacher':'student'}.pdf`),pdf);
   }
   await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
   if(process.env.WORKSHEET_QA_DIR&&grade===6)await page.screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,'dictation-mobile.png'),fullPage:true});
   await page.setViewportSize({width:1440,height:1100});
  }
  await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href+'?subject=korean&grade=3');const entry=page.locator('.dictation-link');assert.equal(await entry.isVisible(),true);assert.match(await entry.getAttribute('href'),/grade=3/);
  await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await entry.click();assert.match(page.url(),/grade=3/);assert.equal(await page.locator('#dictGrade').inputValue(),'3');assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
test('English dictation offers grades 3-6, English-only speech, translations and A4 student/teacher output',{timeout:120000,skip:!chromium||!chrome},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files',...(process.env.CI?[]:['--single-process','--no-zygote']),'--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-US',name:'Test English',voiceURI:'en'},{lang:'ko-KR',name:'Test Korean',voiceURI:'ko'}],cancel:()=>{},resume:()=>{},addEventListener:()=>{},speak:u=>window.__spoken.push(u)}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};});
  const base=pathToFileURL(path.resolve('받아쓰기.html')).href;
  for(const grade of [3,4,5,6]){
   await page.goto(base+`?subject=english&grade=${grade}&seed=42`);await page.waitForSelector('#dictWritingList>li');
   assert.deepEqual(await page.locator('#dictGrade option').evaluateAll(nodes=>nodes.map(n=>n.value)),['3','4','5','6']);assert.equal(await page.locator('.dictation-meaning').count(),10);assert.match(await page.locator('#dictPaperTitle').textContent(),/영어/);
   await page.click('#dictStart');assert.equal(await page.evaluate(()=>__spoken.at(-1).lang),'en-US');assert.match(await page.evaluate(()=>__spoken.at(-1).text),/^Number 1\./);assert.doesNotMatch(await page.evaluate(()=>__spoken.at(-1).text),/[가-힣]/);await page.click('#dictStop');
   if(process.env.WORKSHEET_FONT_CSS){await page.addStyleTag({url:pathToFileURL(process.env.WORKSHEET_FONT_CSS).href});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
   await page.emulateMedia({media:'print'});
   for(const teacher of [false,true]){
    await page.evaluate(t=>document.body.classList.toggle('dictation-print-teacher',t),teacher);assert.equal(await page.locator('#dictWritingList .dictation-answer:visible').count(),teacher?10:0);
    assert.equal(await page.locator('#dictPaper').evaluate(p=>p.querySelector('footer').getBoundingClientRect().bottom<=p.getBoundingClientRect().bottom-12*96/25.4),true);
    const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true});assert.equal([...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,1);
    if(process.env.WORKSHEET_QA_DIR)fs.writeFileSync(path.join(process.env.WORKSHEET_QA_DIR,`english-${grade}-${teacher?'teacher':'student'}.pdf`),pdf);
   }
   await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.setViewportSize({width:1440,height:1100});
  }
  await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href+'?subject=english&grade=4');assert.equal(await page.locator('.english-dictation-link').isVisible(),true);await page.locator('.english-dictation-link').click();assert.equal(await page.locator('#dictSubject').inputValue(),'english');assert.equal(await page.locator('#dictGrade').inputValue(),'4');
  await page.selectOption('#dictSubject','korean');assert.equal(await page.locator('#dictGrade option').count(),6);await page.click('#dictStart');assert.equal(await page.evaluate(()=>__spoken.at(-1).lang),'ko-KR');await page.click('#dictStop');
  await page.selectOption('#dictSubject','english');await page.locator('#dictTeacher summary').click();
  if(process.env.WORKSHEET_QA_DIR)await page.screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,'english-review-desktop.png'),fullPage:true});assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
