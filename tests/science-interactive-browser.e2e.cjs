'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let chromium;try{({chromium}=require('playwright-core'))}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
test('mobile QR labs and existing science worksheet A4 QR flow', {skip:!chromium||!chrome,timeout:90000},async()=>{
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400).end();return}
  const file=path.resolve(root,pathname.replace(/^\/+/,''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(body)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port,base='http://127.0.0.1:'+port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/과학%20탐구%20실험.html?lab=gas&seed=42',{waitUntil:'domcontentloaded'});
  await assert.doesNotReject(()=>page.locator('#title').waitFor({state:'visible'}));
  assert.match(await page.locator('#title').textContent(),/기체의 부피와 압력/);
  assert.match(await page.locator('#result').textContent(),/1\.00기압/);
  await page.locator('#save').click();await page.locator('#save').click();
  assert.match(await page.locator('#count').textContent(),/1 \/ 3/);
  await page.locator('#slider').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.match(await page.locator('#result').textContent(),/2\.00기압/);
  await page.locator('#save').click();
  await page.locator('#slider').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#save').click();
  assert.equal(await page.locator('#reveal').isEnabled(),true);
  await page.locator('#reveal').click();
  assert.match(await page.locator('#answer').textContent(),/반비례/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false);
  await page.goto(base+'/과학%20탐구%20실험.html?lab=temperature',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#result').textContent(),/평균 운동 속력 모형/);
  await page.locator('#slider').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.match(await page.locator('#selected').textContent(),/90°C/);
  assert.ok((await page.locator('#diagram').innerHTML()).includes('particle'));
  await page.goto(base+'/과학%20탐구%20실험.html?lab=reflection',{waitUntil:'domcontentloaded'});
  await page.locator('#slider').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.match(await page.locator('#result').textContent(),/반사각 45°/);
  assert.match(await page.locator('#diagram').getAttribute('aria-label'),/45°/);
  await page.setViewportSize({width:1365,height:900});
  await page.goto(base+'/문제지%20만들기.html?subject=science&grade=5&unit=science-matter&topic=matter&type=matter-practice&count=5&lab=1&seed=12',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.WorksheetEditor?.getCurrent()?.items?.length===5,{timeout:25000});
  assert.equal(await page.locator('#scienceInteractive').isChecked(),true);
  assert.equal(await page.locator('#questions .science-experiment-qr').count(),1);
  const qr=page.locator('#questions .science-experiment-link');assert.equal(await qr.count(),1);
  assert.match(await qr.getAttribute('href'),/lab=gas/);
  assert.equal(await qr.locator('svg').count(),1);
  assert.equal(await page.locator('#questions > li').count(),5);
  await page.locator('#toggleAnswers').click();
  assert.match(await page.locator('#questions .inline-answer').first().textContent(),/정답|예시 답/);
  const printed=await page.evaluate(()=>{const result=window.DailyWorksheetA4?.compose();return {result,qrCount:document.querySelectorAll('.print-paper .science-experiment-link svg').length}});
  assert.equal(printed.result?.ok,true,JSON.stringify(printed.result));
  assert.ok(printed.qrCount>=1);
  assert.deepEqual(errors,[],'Browser runtime errors: '+errors.join('; '));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
});
