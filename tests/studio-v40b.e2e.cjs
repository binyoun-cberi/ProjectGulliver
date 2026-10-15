'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8898,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let n=0;n<100;n++){try{if((await fetch(base+'studio-unified-editor.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('Local server unavailable')}
test('4.0-B browser: group rotate, alignment, snap UI, layers and saved output',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(22000);
  await page.goto(base+encodeURIComponent('통합 캔버스.html')+'?preset=blank',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.GulliverStudioAdapter);
  await page.evaluate(()=>{
   const C=window.GulliverUnifiedCore,p=C.starter('blank');
   p.pages[0].elements=[
    C.element('rect',{id:'back',x:80,y:90,w:100,h:80,fill:'#ee0000'}),
    C.element('text',{id:'label',x:220,y:110,w:160,h:70,content:'우리 반 이름표'}),
    C.element('ellipse',{id:'circle',x:450,y:120,w:70,h:70,fill:'#00aa00'})
   ];
   GulliverStudioAdapter.apply(p);
  });
  await page.locator('#stage .item[data-id="back"]').click();
  await page.locator('#stage .item[data-id="label"]').click({modifiers:['Shift']});
  await page.locator('#groupSelection').evaluate(el=>el.click());
  let snap=await page.evaluate(()=>GulliverStudioAdapter.capture());
  const group=snap.pages[0].elements[0].groupId;assert.ok(group?.startsWith('g-'));
  await page.locator('#propertyRotation').evaluate(el=>{el.value='45';el.dispatchEvent(new Event('change',{bubbles:true}))});
  snap=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(snap.pages[0].elements[0].rotation,45);
  assert.equal(snap.pages[0].elements[1].rotation,45);
  assert.match(await page.locator('#stage .item[data-id="back"]').evaluate(el=>el.style.transform),/45deg/);
  assert.equal(await page.locator('#stage .rotate-grip').count(),1);
  await page.locator('#undo').evaluate(el=>el.click());
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[0].rotation,undefined);
  await page.locator('#redo').evaluate(el=>el.click());
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[0].rotation,45);
  await page.locator('#stage .item[data-id="back"]').click();
  assert.equal(await page.locator('#stage .item.selected').count(),2);
  await page.locator('[data-align="left"]').evaluate(el=>el.click());
  snap=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(Math.min(snap.pages[0].elements[0].x,snap.pages[0].elements[1].x),0);
  await page.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'레이어 잠금'}).click();
  snap=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(snap.pages[0].elements[2].locked,true);
  await page.locator('#stage .item[data-id="circle"]').click({force:true});
  assert.equal(await page.locator('#stage .item[data-id="circle"].selected').count(),0,'locked item must not be selected');
  await page.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'잠금 해제'}).click();
  await page.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'레이어 숨기기'}).click();
  assert.equal(await page.locator('#stage .item[data-id="circle"]').count(),0);
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[2].hidden,true);
  await page.locator('#undo').evaluate(el=>el.click());
  assert.equal(await page.locator('#stage .item[data-id="circle"]').count(),1);
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#exportPng').evaluate(el=>el.click());
  const image=await downloadEvent;assert.ok(image.suggestedFilename().endsWith('.png'));
  // A synthetic touch drag uses the same pointer handlers as real touch hardware.
  await page.locator('#stage .item[data-id="back"]').click();
  const angleBefore=(await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[0].rotation;
  await page.evaluate(()=>{
   const grip=document.querySelector('#stage .selection-frame .rotate-grip');
   if(!grip)throw Error('Group rotate handle missing');
   const b=grip.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;
   grip.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:501,pointerType:'touch',button:0,clientX:x,clientY:y}));
   window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:501,pointerType:'touch',clientX:x+80,clientY:y+60,shiftKey:true}));
   window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:501,pointerType:'touch',clientX:x+80,clientY:y+60}));
  });
  const angleAfter=(await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[0].rotation;
  assert.notEqual(angleAfter,angleBefore,'touch rotation handle must rotate the group');
  assert.equal((angleAfter-angleBefore)%15,0,'Shift drag snaps to 15° steps');
  assert.deepEqual(errors,[],'Unexpected page errors: '+errors.join('|'));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
