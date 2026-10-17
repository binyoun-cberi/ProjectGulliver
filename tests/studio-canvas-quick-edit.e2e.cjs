'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8961,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('통합 캔버스.html')+'?preset=blank';
async function ready(){for(let i=0;i<90;i++){try{if((await fetch(base+'studio-canvas-quick-edit.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('local server not ready')}
async function seed(page){
 await page.evaluate(()=>{
  const C=GulliverUnifiedCore,p=C.starter('blank'),canvas=document.createElement('canvas');
  canvas.width=20;canvas.height=20;canvas.getContext('2d').fillRect(0,0,20,20);
  const src=canvas.toDataURL('image/png');
  p.pages[0].elements=[
   C.element('rect',{id:'shape',x:50,y:70,w:170,h:110,fill:'#cc3344'}),
   C.element('text',{id:'words',x:240,y:80,w:350,h:90,content:'가을 과일',fontSize:36}),
   C.element('image',{id:'photo',x:610,y:80,w:200,h:140,src})
  ];
  GulliverStudioAdapter.apply(p);
 });
}
test('PC contextual toolbar and unified menu: edit text/shape/photo, undo, clipboard, reorder, delete',{timeout:90000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1420,height:930}});page.setDefaultTimeout(13000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});await seed(page);
  const model=()=>page.evaluate(()=>GulliverStudioAdapter.capture());
  await page.locator('#stage .item[data-id="words"]').click();
  await page.locator('#canvasQuickEdit:not([hidden])').waitFor();
  assert.equal(await page.locator('#canvasQuickEdit').getAttribute('data-kind'),'text');
  await page.locator('[data-quick-input=fontFamily]').selectOption('serif');
  await page.locator('[data-quick-input=fontSize]').fill('54');
  await page.locator('[data-quick-input=fontSize]').dispatchEvent('change');
  await page.locator('[data-quick-action=bold]').click();
  let t=(await model()).pages[0].elements.find(e=>e.id==='words');
  assert.equal(t.fontFamily,'serif');assert.equal(t.fontSize,54);assert.equal(t.fontWeight,700);
  await page.locator('#stage .item[data-id="shape"]').click();
  await page.waitForFunction(()=>document.querySelector('#canvasQuickEdit')?.dataset.kind==='rect');
  assert.equal(await page.locator('#canvasQuickEdit').getAttribute('data-kind'),'rect');
  await page.locator('[data-quick-input=fill]').fill('#3388cc');
  await page.locator('[data-quick-action=border]').click();
  await page.locator('#canvasQuickBorder input').fill('7');
  await page.locator('#canvasQuickBorder input').dispatchEvent('change');
  let shape=(await model()).pages[0].elements.find(e=>e.id==='shape');
  assert.equal(shape.fill,'#3388cc');assert.equal(shape.borderWidth,7);
  await page.locator('#undo').click();shape=(await model()).pages[0].elements.find(e=>e.id==='shape');
  assert.notEqual(shape.borderWidth,7);
  await page.locator('#redo').click();
  assert.equal((await model()).pages[0].elements.find(e=>e.id==='shape').borderWidth,7);
  // Single right click contains both common actions and layer order.
  await page.locator('#stage .item[data-id="shape"]').click({button:'right'});
  assert.equal(await page.locator('#canvasUnifiedMenu').isVisible(),true);
  await page.locator('[data-canvas-action=copy]').click();
  await page.locator('#stage .item[data-id="shape"]').click({button:'right'});
  await page.locator('[data-canvas-action=paste]').click();
  assert.equal((await model()).pages[0].elements.length,4);
  let copied=(await model()).pages[0].elements[3];assert.equal(copied.fill,'#3388cc');
  // The pasted copy overlaps the original; select its uncovered corner.
  await page.locator('#stage .item[data-id="shape"]').click({button:'right',position:{x:6,y:6}});
  await page.locator('[data-canvas-action=front]').click();
  assert.equal((await model()).pages[0].elements.at(-1).id,'shape');
  await page.locator('#stage .item[data-id="photo"]').click();
  await page.waitForFunction(()=>document.querySelector('#canvasQuickEdit')?.dataset.kind==='image');
  assert.equal(await page.locator('#canvasQuickEdit').getAttribute('data-kind'),'image');
  await page.locator('[data-quick-input=mask]').selectOption('circle');
  assert.equal((await model()).pages[0].elements.find(e=>e.id==='photo').mask,'circle');
  await page.locator('[data-quick-action=crop]').click();
  assert.equal(await page.locator('#photoStylePanel').getAttribute('open'),'');
  await page.locator('#stage .item[data-id="shape"]').click();
  await page.locator('[data-quick-action=delete]').click();
  assert.equal((await model()).pages[0].elements.some(e=>e.id==='shape'),false);
  await page.locator('#undo').click();
  assert.equal((await model()).pages[0].elements.some(e=>e.id==='shape'),true);
  // Clipboard and canvas metadata survive project validation.
  const verified=await model();assert.equal(verified.pages.length,1);
  assert.deepEqual(errors,[],'browser exceptions: '+errors.join(' | '));
  console.log('CONTEXT_QUICK_DESKTOP '+JSON.stringify({font:t.fontFamily,size:t.fontSize,color:'#3388cc',undo:true,clipboard:true,layer:true,crop:true}));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('390px touch: selection toolbar and More menu stay reachable without horizontal viewport overflow',{timeout:90000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port+1),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const site='http://127.0.0.1:'+(port+1)+'/';
 try{
  for(let i=0;i<90;i++){try{if((await fetch(site+'studio-canvas-quick-edit.js')).ok)break}catch{}await new Promise(r=>setTimeout(r,160))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(site+encodeURIComponent('통합 캔버스.html')+'?preset=blank',{waitUntil:'domcontentloaded'});
  await seed(page);
  await page.locator('#stage .item[data-id="words"]').tap();
  await page.locator('#canvasQuickEdit:not([hidden])').waitFor();
  const metrics=await page.locator('#canvasQuickEdit').evaluate(el=>({visible:!!el.getClientRects().length,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:document.documentElement.clientWidth}));
  assert.ok(metrics.visible&&metrics.left>=0&&metrics.right<=metrics.viewport+1,JSON.stringify(metrics));
  await page.locator('[data-quick-action=more]').tap();
  assert.equal(await page.locator('#canvasUnifiedMenu').isVisible(),true);
  await page.locator('[data-canvas-action=duplicate]').tap();
  const doc=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(doc.pages[0].elements.length,4);
  await page.locator('#undo').tap();
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.length,3);
  console.log('CONTEXT_QUICK_MOBILE '+JSON.stringify({width:390,menu:true,duplicate:true,undo:true}));
 }finally{await browser?.close();server.kill('SIGTERM')}
});