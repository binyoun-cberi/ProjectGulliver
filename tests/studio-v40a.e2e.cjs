'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8897,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let i=0;i<80;i++){try{if((await fetch(base+'studio-unified-editor.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('Local server not ready')}
test('4.0-A browser: select, group, move, resize, save, ungroup, undo/redo and touch multiselect',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:1050},hasTouch:true});
  page.setDefaultTimeout(20000);
  await page.goto(base+encodeURIComponent('통합 캔버스.html')+'?preset=blank',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.GulliverStudioAdapter);
  await page.evaluate(()=>{
   const C=window.GulliverUnifiedCore,value=C.starter('blank');
   value.pages[0].elements=[
    C.element('text',{id:'label',x:40,y:40,w:200,h:65,content:'우리 반'}),
    C.element('rect',{id:'border',x:310,y:70,w:150,h:100}),
    C.element('ellipse',{id:'mark',x:550,y:90,w:100,h:100})
   ];
   window.GulliverStudioAdapter.apply(value);
  });
  for(const [i,id] of ['label','border','mark'].entries())
   await page.locator('#stage .item[data-id="'+id+'"]').click(i?{modifiers:['Shift']}:{});
  assert.equal(await page.locator('#stage .item.selected').count(),3);
  assert.equal(await page.locator('#selectionCount').innerText(),'3개 선택됨');
  await page.locator('#groupSelection').evaluate(el=>el.click());
  let doc=await page.evaluate(()=>GulliverStudioAdapter.capture());
  const group=doc.pages[0].elements[0].groupId;
  assert.ok(group?.startsWith('g-'));
  assert.deepEqual(doc.pages[0].elements.map(e=>e.groupId),[group,group,group]);
  const label=page.locator('#stage .item[data-id="label"]');
  const pos=await label.boundingBox();
  await page.mouse.move(pos.x+pos.width/2,pos.y+pos.height/2);
  await page.mouse.down();await page.mouse.move(pos.x+pos.width/2+32,pos.y+pos.height/2+20,{steps:5});await page.mouse.up();
  doc=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.ok(doc.pages[0].elements[0].x>40,'group should move together');
  const before=doc.pages[0].elements[1].w,grip=await page.locator('#stage .selection-frame .grip').boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.mouse.down();await page.mouse.move(grip.x+grip.width/2+55,grip.y+grip.height/2+25,{steps:5});await page.mouse.up();
  doc=await page.evaluate(()=>GulliverStudioAdapter.capture());
  assert.ok(doc.pages[0].elements[1].w>before,'group resize scales children');
  const snapshot=JSON.parse(JSON.stringify(doc));
  await page.evaluate(saved=>GulliverStudioAdapter.apply(saved),snapshot);
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[1].groupId,group);
  await page.locator('#stage .item[data-id="label"]').click();
  assert.equal(await page.locator('#stage .item.selected').count(),3,'click on group selects all members');
  await page.locator('#ungroupSelection').evaluate(el=>el.click());
  assert.ok((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.every(e=>!e.groupId));
  await page.locator('#undo').evaluate(el=>el.click());
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements[0].groupId,group);
  await page.locator('#redo').evaluate(el=>el.click());
  assert.ok((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.every(e=>!e.groupId));
  await page.locator('#multiSelectMode').evaluate(el=>el.click());
  await page.evaluate(()=>{
   for(const id of ['label','mark']){
    const el=document.querySelector('#stage .item[data-id="'+id+'"]'),b=el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id==='label'?41:42,pointerType:'touch',clientX:b.x+10,clientY:b.y+10}));
   }
  });
  assert.equal(await page.locator('#stage .item.selected').count(),2,'touch multi-select adds items');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#stage .item.selected').count(),0);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
