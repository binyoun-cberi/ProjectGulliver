'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),assert=require('node:assert/strict'),{test}=require('node:test');
let chromium;try{({chromium}=require('playwright-core'))}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p)),dir=process.env.WORKSHEET_QA_DIR||'test-artifacts/worksheet-learning-mix';
test('social lesson mixing works on desktop/mobile and prints complete student/teacher sheets',{skip:!chrome||!chromium,timeout:90000},async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files',...(process.env.CI?[]:['--single-process','--no-zygote']),'--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=pathToFileURL(path.resolve('문제지 만들기.html')).href;await page.goto(base+'?subject=social&grade=5&semester=2');
 if(process.env.WORKSHEET_FONT_CSS){const fontCSS=fs.readFileSync(process.env.WORKSHEET_FONT_CSS,'utf8').replace(/url\(([^)]+)\)/g,(_,file)=>'url("'+pathToFileURL(path.resolve(path.dirname(process.env.WORKSHEET_FONT_CSS),file.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:fontCSS});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
 await page.locator('#textUnit').selectOption({index:1});assert.equal(await page.locator('#unitMixSettings').isVisible(),false);
 await page.locator('#learningMixSettings summary').click();await page.locator('#learningMixEnabled').check();await page.locator('#addLearningMix').click();
 const rows=page.locator('#learningMixRows>div'),ids=await page.evaluate(()=>{const o=WorksheetLearning.mixOptions('social',5,2);return [o[0].id,o.find(x=>x.unitId!==o[0].unitId&&WorksheetLearning.capacity(x.binding,'choice')>=7).id];});
 await rows.nth(0).locator('select').selectOption(ids[0]);await rows.nth(0).locator('input').fill('3');await rows.nth(1).locator('select').selectOption(ids[1]);await rows.nth(1).locator('input').fill('7');
 await page.locator('button.daily-primary').click();assert.equal(await page.locator('#questions>li').count(),10);assert.match(await page.locator('#questionSheet #paperTitle').textContent(),/여러 차시/);
 const saved=page.url(),content=await page.locator('#questions').textContent();await page.reload();if(process.env.WORKSHEET_FONT_CSS){const fontCSS=fs.readFileSync(process.env.WORKSHEET_FONT_CSS,'utf8').replace(/url\(([^)]+)\)/g,(_,file)=>'url("'+pathToFileURL(path.resolve(path.dirname(process.env.WORKSHEET_FONT_CSS),file.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:fontCSS});await page.addStyleTag({content:'body{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}assert.equal(await page.locator('#questions').textContent(),content);assert.equal(await rows.count(),2);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(dir,'social-mix-mobile.png'),fullPage:true});
 for(const teacher of [false,true]){await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);await page.emulateMedia({media:'print'});const result=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(result.ok,result.issue);assert.equal(await page.locator('#questions>li').count(),10);if(!teacher)assert.equal(await page.locator('.inline-answer:visible').count(),0);await page.pdf({path:path.join(dir,teacher?'social-mix-teacher.pdf':'social-mix-student.pdf'),format:'A4',printBackground:true});}
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-answers'));await page.setViewportSize({width:1440,height:1000});
 await page.locator('#largePrint').check();assert.equal(await page.locator('#questions').textContent(),content);assert.equal(new URL(page.url()).searchParams.get('lessonMix'),new URL(saved).searchParams.get('lessonMix'));
 await page.locator('#regenerate').click();assert.equal(await page.locator('#questions>li').count(),10);
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

test('five historical initial rows print 25 hints and mixed row formats remain independent',{skip:!chrome||!chromium,timeout:90000},async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files',...(process.env.CI?[]:['--single-process','--no-zygote']),'--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const eras=['prehistoric','ancient','goryeo','joseon','modern'],base=pathToFileURL(path.resolve('문제지 만들기.html')).href;
 await page.goto(base+'?subject=social&grade=5');await page.locator('[data-mode=practice]').click();await page.locator('#unitMixSettings summary').click();await page.locator('#unitMixEnabled').check();
 for(let i=1;i<5;i++)await page.locator('#addUnitMix').click();
 const rows=page.locator('#unitMixRows>div');for(let i=0;i<5;i++){await rows.nth(i).locator('select').selectOption(`s5-${eras[i]}:${eras[i]}-initial`);await rows.nth(i).locator('input').fill('5');}
 assert.equal(await page.locator('#responseSetting').isVisible(),false);await page.locator('button.daily-primary').click();assert.equal(await page.locator('#questions>li').count(),25);assert.equal(await page.locator('#questions .question-detail').count(),25);assert.ok((await page.locator('#questions .question-detail').allTextContents()).every(t=>t.startsWith('초성·빈칸 힌트:')));assert.equal(await page.locator('#questions .choice-list').count(),0);
 const contents=await page.locator('#questions').textContent(),url=page.url();await page.reload();assert.equal(await page.locator('#questions').textContent(),contents);assert.equal(await rows.count(),5);
 if(process.env.WORKSHEET_FONT_CSS){const css=fs.readFileSync(process.env.WORKSHEET_FONT_CSS,'utf8').replace(/url\(([^)]+)\)/g,(_,f)=>'url("'+pathToFileURL(path.resolve(path.dirname(process.env.WORKSHEET_FONT_CSS),f.replace(/["']/g,''))).href+'")');await page.addStyleTag({content:css+'\nbody{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
 for(const teacher of [false,true]){await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);await page.emulateMedia({media:'print'});const result=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(result.ok,result.issue);const count=await page.locator('#printPages .question-detail').count();assert.equal(count,25);if(!teacher)assert.equal(await page.locator('#printPages .inline-answer:visible').count(),0);await page.pdf({path:path.join(dir,teacher?'social-initial-25-teacher.pdf':'social-initial-25-student.pdf'),format:'A4',printBackground:true});}
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>document.body.classList.remove('print-answers'));await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(dir,'social-initial-25-mobile.png'),fullPage:true});
 await page.locator('#largePrint').check();assert.equal(await page.locator('#questions').textContent(),contents);assert.equal(new URL(page.url()).searchParams.get('unitMix'),new URL(url).searchParams.get('unitMix'));
 await rows.nth(1).locator('select').selectOption('s5-ancient:ancient-ox');await rows.nth(2).locator('select').selectOption('s5-goryeo:goryeo-short');await rows.nth(3).locator('select').selectOption('s5-joseon:joseon-quiz');await page.locator('button.daily-primary').click();assert.equal(await page.locator('#questions .question-detail').filter({hasText:'초성·빈칸 힌트:'}).count(),10);assert.equal(await page.locator('#questions .ox-statement').count(),5);assert.equal(await page.locator('#questions>li:not(.ox-question) .choice-list').count(),5);
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
