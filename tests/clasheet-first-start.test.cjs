'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
let chromium;try{({chromium}=require('playwright-core'))}catch{}
const chrome=Boolean(chromium&&[process.env.CHROME_BIN,chromium.executablePath(),'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/opt/google/chrome/chrome'].some(x=>x&&fs.existsSync(x)));
test('first use routes into real current tools without restoring retired canvas source',()=>{
 const home=fs.readFileSync('workspace-home.js','utf8'),html=fs.readFileSync('index.html','utf8');
 for(const target of ['문제지 만들기.html','이번 수업 알리미.html','플래시퀴즈메이커.html']){assert.ok(home.includes('href="'+target+'"'));assert.ok(fs.existsSync(target));}
 assert.match(home,/clasheet.firstStart.dismissed.v1/);
 assert.ok(!fs.existsSync('lesson-app.js')&&!fs.existsSync('work-surface.js'));
 assert.match(html,/workspace-home.js/);
});
test('Chrome first use: links and dismiss persist on 390px screen',{timeout:100000,skip:!chrome&&'system Chrome unavailable'},async()=>{
 const server=spawn('python3',['-m','http.server','8997','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8997/index.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:8997/index.html');
  await page.locator('#firstStartTitle').waitFor();
  assert.equal(await page.locator('.first-start-card').count(),3);
  const widths=await page.locator('.first-start').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
  assert.ok(widths.scroll<=widths.client+1,JSON.stringify(widths));
  assert.equal(await page.locator('.first-start-card').first().getAttribute('href'),'문제지 만들기.html');
  await page.locator('[data-dismiss-first-start]').click();
  assert.equal(await page.locator('#firstStartTitle').count(),0);
  await page.reload();
  assert.equal(await page.locator('#firstStartTitle').count(),0);
  await page.locator('#menuButton').click();
  await page.locator('.sidebar button[data-view="tools"]').click();
  assert.ok(await page.locator('.tool-row-link').count()>10);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
