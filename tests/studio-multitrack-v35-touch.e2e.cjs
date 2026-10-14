'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8878,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let n=0;n<110;n++){try{if((await fetch(base+'studio-unified-multitrack.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('web server missing')}
test('mobile touch drag trims caption duration and repositions it without losing bottom controls',{timeout:80000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();page.setDefaultTimeout(14000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});
  const f=page.frameLocator('#editorFrame');
  await f.locator('[data-design-tab="motion"]').click();
  await f.locator('#multiEnable').click();
  await f.locator('#multiAddCaption').click();
  await f.locator('#multiAddCaption').click();
  assert.equal(await f.locator('.multi-clip.caption').count(),2);
  const initial=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture().tracks[0]);
  const grip=f.locator('.multi-clip.caption').first().locator('[data-handle="right"]');
  await grip.scrollIntoViewIfNeeded();
  const bb=await grip.boundingBox();assert.ok(bb&&bb.width>0,'Touchable right trim grip in mobile sheet');
  const cdp=await context.newCDPSession(page);
  const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}],modifiers:0});
  const x=bb.x+bb.width/2,y=bb.y+bb.height/2;
  await touch('touchStart',x,y);
  await touch('touchMove',x+12,y);
  await touch('touchMove',x+24,y);
  await touch('touchEnd',x+24,y);
  await f.locator('.multi-clip.caption').first().waitFor();
  const changed=await f.locator('body').evaluate(()=>GulliverStudioAdapter.capture().tracks[0]);
  assert.ok(changed.duration>initial.duration+.4,'touch drag lengthens caption: '+JSON.stringify({initial,changed}));
  const nav=await f.locator('.design-nav').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,visible:innerHeight}));
  assert.ok(nav.bottom>=nav.visible-2,'mobile nav stays bottom aligned');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
