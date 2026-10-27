'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
let server,browser,base;
const screenshots=process.env.BUMPER_SCREENSHOTS;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
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

for(const config of [
 {n:100,k:4,unique:false,balanced:false,width:1360},
 {n:100,k:200,unique:true,balanced:false,width:1360},
 {n:100,k:6,unique:false,balanced:true,width:430}
])test('browser: '+JSON.stringify(config),{timeout:90000},async()=>{
 const page=await browser.newPage({viewport:{width:config.width,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/범퍼 룰렛.html',{waitUntil:'load'});
 await page.locator('#start-btn').waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.getElementById('start-btn').disabled);
 const names=Array.from({length:config.n},(_,i)=>'참가자'+(i+1));
 await page.locator('#names-input').fill(names.join('\n'));
 await page.locator('#slots-input').fill(Array.from({length:config.k},(_,i)=>'모둠'+(i+1)).join('\n'));
 await page.locator('#game-purpose').selectOption('assign');
 if(config.unique)await page.locator('#one-marble-per-slot').check();
 if(config.balanced)await page.locator('#balanced-teams').check();
 await page.locator('#start-btn').click();
 await page.locator('#setup-panel').waitFor({state:'hidden'});
 assert.ok(await page.locator('#allocation-live').isVisible());
 await page.waitForTimeout(4000);
 if(screenshots)await page.screenshot({path:path.join(screenshots,'race-'+config.k+'-'+config.width+'.png')});
 await page.waitForFunction(()=>!document.getElementById('result-modal').classList.contains('hidden'),null,{timeout:60000});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gulliver.roulette.lastResults.v1')));
 assert.equal(saved.completed,true);assert.equal(saved.results.length,100);
 assert.equal(new Set(saved.results.map(r=>r.name)).size,100);
 if(config.unique)assert.equal(new Set(saved.results.map(r=>r.result)).size,100);
 if(config.balanced){const counts=Array.from({length:config.k},(_,i)=>saved.results.filter(r=>r.result==='모둠'+(i+1)).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}
 await page.locator('#result-search').fill('참가자100');
 assert.equal(await page.locator('#result-list > div:visible').count(),1);
 await page.locator('#result-search').fill('');
 await page.locator('#result-grouped').check();
 assert.equal(await page.locator('#result-list > div:visible').count(),100);
 assert.ok(await page.locator('#result-list h3').count()>0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 if(screenshots)await page.screenshot({path:path.join(screenshots,'result-'+config.k+'-'+config.width+'.png')});
 assert.deepEqual(errors,[]);await page.close();
});
