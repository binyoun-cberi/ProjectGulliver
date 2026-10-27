'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
let server,browser,base;
function fileType(name){
  if(name.endsWith('.js'))return 'text/javascript; charset=utf-8';
  if(name.endsWith('.css'))return 'text/css; charset=utf-8';
  if(name.endsWith('.svg'))return 'image/svg+xml';
  if(name.endsWith('.json'))return 'application/json; charset=utf-8';
  if(name.endsWith('.png'))return 'image/png';
  return 'text/html; charset=utf-8';
}
test.before(async()=>{
  server=http.createServer((req,res)=>{
    let relative;
    try{relative=decodeURIComponent(new URL(req.url,'http://local.test').pathname).replace(/^\/+/,'')||'index.html';}
    catch(_){res.writeHead(400);res.end();return}
    const target=path.resolve(root,relative);
    if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return}
    fs.readFile(target,(err,data)=>{
      if(err){res.writeHead(404);res.end();return}
      res.writeHead(200,{'Content-Type':fileType(target)});res.end(data);
    });
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
});
test.after(async()=>{await browser?.close();if(server)await new Promise(ok=>server.close(ok));});
test('real Chrome: balanced teams complete, roster transfers into unchanged bumper roulette',async()=>{
  const page=await browser.newPage({viewport:{width:1360,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('.mode-choice').nth(1).click();
  await page.locator('#roster-input').fill('민준\n서연\n도윤\n하은\n지호\n수아\n현우\n윤서');
  await page.locator('#team-count').selectOption('3');
  await page.locator('#start-btn').click();
  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:48000});
  const labels=await page.locator('.group-result strong').allTextContents();
  assert.equal(labels.length,3);
  const counts=labels.map(s=>Number(s.match(/(\d+)명/)?.[1]));
  assert.equal(counts.reduce((a,b)=>a+b,0),8);
  assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
  const errorAtGame=errors.slice();
  await page.locator('a.result-route').click();
  await page.waitForURL(/범퍼/);
  const saved=await page.locator('#names-input').inputValue();
  assert.equal(saved.trim().split(/\r?\n/).length,8);
  assert.deepEqual(errorAtGame,[],'No uncaught browser errors during team race');
  await page.close();
});
test('real Chrome: first arrival wins and class list remains editable',async()=>{
  const page=await browser.newPage({viewport:{width:430,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('#roster-input').fill('가\n나\n다\n라');
  await page.locator('#start-btn').click();
  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:43000});
  assert.match(await page.locator('#result-heading').textContent(),/1등/);
  assert.match(await page.locator('.winner-result').textContent(),/가|나|다|라/);
  await page.locator('#edit-btn').click();
  assert.ok(await page.locator('#start-btn').isVisible());
  assert.deepEqual(errors,[]);
  await page.close();
});
