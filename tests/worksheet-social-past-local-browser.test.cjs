'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
test('expanded social lessons preserve 20 questions, saved URLs, mobile and teacher/student print',{skip:!chromium||!process.env.CHROME_BIN,timeout:120000},async()=>{
 const T=require('../worksheet-learning'),E=require('../worksheet-evidence-banks'),browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const u of T.catalog.filter(u=>u.subject==='social'&&u.grade===3))for(const l of u.lessons){const b=T.binding(u,l);if(!b||!E.banks.find(e=>e.id===b.bankId)?.items.some(q=>q.socialPastLocal))continue;
 const url=pathToFileURL(path.resolve('문제지 만들기.html'));url.search=new URLSearchParams({subject:'social',grade:3,semester:u.semester,unit:u.id,lesson:l.id,count:20,format:'choice',seed:42});await page.goto(url.href);assert.equal(await page.locator('#questions>li').count(),20);const html=await page.locator('#questions').innerHTML();await page.goto(page.url());assert.equal(await page.locator('#questions').innerHTML(),html);
 await page.setViewportSize({width:390,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({media:'print'});
 for(const teacher of [false,true]){await page.evaluate(t=>document.body.classList.toggle('print-answers',t),teacher);const result=await page.evaluate(()=>DailyWorksheetA4.compose());assert.ok(result.ok,result.issue);assert.equal(await page.locator('#printPages .print-question-list>li').count(),20);assert.equal(await page.locator('#printPages .inline-answer:visible').count(),teacher?20:0);}
 await page.emulateMedia({media:'screen'});
 }assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
