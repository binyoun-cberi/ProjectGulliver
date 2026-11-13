'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
let server,browser,base;
const screenshots=process.env.PINBALL_SCREENSHOTS;
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
test('real Chrome: balanced teams complete, roster transfers into unchanged bumper roulette',async()=>{
  const page=await browser.newPage({viewport:{width:1360,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('.mode-choice').nth(1).click();
  await page.locator('#roster-input').fill('민준\n서연\n도윤\n하은\n지호\n수아\n현우\n윤서');
  await page.locator('#team-count').selectOption('3');
  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#pre-start').isVisible(),false,'Settings must leave the table when racing');
  assert.equal(await page.locator('#race-options').isVisible(),false);
  assert.equal(await page.locator('#race-toast,#camera-status').count(),0,'No commentary overlays');

  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:65000});
  const labels=await page.locator('.group-result strong').allTextContents();
  assert.equal(labels.length,3);
  const counts=labels.map(s=>Number(s.match(/(\d+)명/)?.[1]));
  assert.equal(counts.reduce((a,b)=>a+b,0),8);
  assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
  const errorAtGame=errors.slice();
  await page.locator('a.result-route').click();
  await page.waitForURL(url=>decodeURIComponent(url.pathname).includes('범퍼 룰렛.html'),{timeout:12000});
  const saved=await page.locator('#names-input').inputValue();
  assert.equal(saved.trim().split(/\r?\n/).length,8);
  await page.locator('[data-pinball-switch]').first().click();
  await page.waitForURL(url=>decodeURIComponent(url.pathname).includes('핀볼 레이스.html'),{timeout:12000});
  assert.equal((await page.locator('#roster-input').inputValue()).trim().split(/\r?\n/).length,8);
  assert.deepEqual(errorAtGame,[],'No uncaught browser errors during team race');
  await page.close();
});
test('real Chrome: first arrival wins and class list remains editable',async()=>{
  const page=await browser.newPage({viewport:{width:430,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('#roster-input').fill('가\n나\n다\n라');
  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#pre-start').isVisible(),false,'Settings must leave the table when racing');
  assert.equal(await page.locator('#race-options').isVisible(),false);
  assert.equal(await page.locator('#race-toast,#camera-status').count(),0,'No commentary overlays');

  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:60000});
  assert.match(await page.locator('#result-heading').textContent(),/1등/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  if(screenshots)await page.screenshot({path:path.join(screenshots,'pinball-mobile-result.png')});
  assert.match(await page.locator('.winner-result').textContent(),/가|나|다|라/);
  await page.locator('#edit-btn').click();
  assert.ok(await page.locator('#start-btn').isVisible());
  assert.ok(await page.locator('#pre-start').isVisible());
  assert.equal(await page.locator('#roster-input').inputValue(),'가\n나\n다\n라');
  assert.equal(await page.locator('#race-options').isDisabled(),false);

  assert.deepEqual(errors,[]);
  await page.close();
});

test('real Chrome: rank cutoff selects exactly the requested top seven out of 30', {timeout:90000}, async()=>{
  const page=await browser.newPage({viewport:{width:1450,height:930}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const students=Array.from({length:30},(_,i)=>'참가자'+(i+1));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('#roster-input').fill(students.join('\n'));
  await page.locator('#finish-target').fill('7');
  await page.locator('#race-speed').selectOption('1.9');
  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#pre-start').isVisible(),false,'Settings must leave the table when racing');
  assert.equal(await page.locator('#race-options').isVisible(),false);
  assert.equal(await page.locator('#race-toast,#camera-status').count(),0,'No commentary overlays');

  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:50000});
  const places=await page.locator('#result-entries > div').allTextContents();
  assert.equal(places.length,7,'Stop at seventh arrival; do not include eighth');
  assert.ok(places.every((t,i)=>t.includes((i+1)+'등')));
  const selected=places.map(t=>t.split(' · ').at(-1));
  assert.equal(new Set(selected).size,7,'Every participant appears once');
  assert.ok(selected.every(x=>students.includes(x)));
  assert.match(await page.locator('#race-count').textContent(),/^7 \/ 30 도착$/);
  assert.equal(await page.locator('#marble-legend-list .marble-legend-item').count(),30);
  assert.deepEqual(errors,[]);
  await page.close();
});

test('real Chrome: thirty players are evenly divided among four teams', {timeout:90000}, async()=>{
  const page=await browser.newPage({viewport:{width:1380,height:920}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  await page.locator('.mode-choice').nth(1).click();
  await page.locator('#roster-input').fill(Array.from({length:30},(_,i)=>'학생'+(i+1)).join('\n'));
  await page.locator('#team-count').selectOption('4');
  await page.locator('#race-speed').selectOption('1.9');
  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#pre-start').isVisible(),false,'Settings must leave the table when racing');
  assert.equal(await page.locator('#race-options').isVisible(),false);
  assert.equal(await page.locator('#race-toast,#camera-status').count(),0,'No commentary overlays');

  const focus=page.locator('#marble-legend-list button').first();
  await page.locator('#marble-legend summary').click();
  await focus.click();
  assert.equal(await focus.getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(10000);
  if(screenshots)await page.screenshot({path:path.join(screenshots,'pinball-follow.png')});
  await focus.click();
  assert.equal(await focus.getAttribute('aria-pressed'),'false');
  await page.waitForTimeout(7000);
  if(screenshots)await page.screenshot({path:path.join(screenshots,'pinball-lower-course.png')});
  await page.locator('#result-overlay:not([hidden])').waitFor({timeout:53000});
  const labels=await page.locator('.group-result strong').allTextContents();
  const counts=labels.map(v=>Number(v.match(/(\d+)명/)?.[1]));
  assert.equal(counts.length,4);
  assert.equal(counts.reduce((sum,n)=>sum+n,0),30);
  assert.equal(Math.max(...counts)-Math.min(...counts),1);
  assert.match(await page.locator('#race-count').textContent(),/^30 \/ 30 도착$/);
  if(screenshots)await page.screenshot({path:path.join(screenshots,'pinball-team-results.png')});
  assert.deepEqual(errors,[]);
  await page.close();
});

for(const viewport of [{width:1450,height:930},{width:768,height:1024},{width:430,height:920}]){
 test('immersive marble-race setup and stop: '+viewport.width,async()=>{
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/핀볼 레이스.html',{waitUntil:'load'});
  assert.ok(await page.locator('.arena-surface #pre-start').isVisible());
  const startBox=await page.locator('#start-btn').boundingBox();
  assert.ok(startBox.y>=0&&startBox.y+startBox.height<=viewport.height,'Start stays inside the screen');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#roster-input').fill('가\n나\n다\n라');
  await page.locator('#finish-target').fill('3');
  if(screenshots)await page.screenshot({path:path.join(screenshots,'cabinet-setup-'+viewport.width+'.png')});
  if(screenshots&&viewport.width===430)console.log('PINBALL_SETUP_JPEG:'+Buffer.from(await page.screenshot({type:'jpeg',quality:55})).toString('base64'));

  await page.locator('#start-btn').click();
  assert.equal(await page.locator('#pre-start').isVisible(),false);
  assert.ok(await page.locator('#pinball-canvas').isVisible());
  const boardBox=await page.locator('#pinball-canvas').boundingBox();
  assert.ok(boardBox.width>=viewport.width*.95,'Race uses the screen width');
  assert.ok(boardBox.height>=viewport.height*.75,'Race uses the screen height');
  assert.equal(await page.locator('.arena-surface #live-rankings').count(),1);

  assert.ok(await page.locator('#stop-btn').isVisible());
  assert.equal(await page.locator('#marble-legend').getAttribute('open'),null);
  await page.waitForTimeout(3000);
  if(screenshots)await page.screenshot({path:path.join(screenshots,'cabinet-race-'+viewport.width+'.png')});
  if(screenshots&&viewport.width===1450)console.log('PINBALL_RACE_JPEG:'+Buffer.from(await page.screenshot({type:'jpeg',quality:45})).toString('base64'));

  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#stop-btn').click();
  assert.ok(await page.locator('#pre-start').isVisible());
  assert.equal(await page.locator('#roster-input').inputValue(),'가\n나\n다\n라');
  assert.equal(await page.locator('#finish-target').inputValue(),'3');
  assert.equal(await page.locator('#stop-btn').isVisible(),false);
  assert.deepEqual(errors,[]);await page.close();
 });
}
