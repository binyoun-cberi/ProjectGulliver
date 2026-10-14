'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8803,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html');
async function ready(){for(let i=0;i<90;i++){try{if((await fetch(base+'studio-unified-editor.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,180))}throw Error('Server unavailable')}
test('3.0 browser: editable page, drag, resize, text, undo/redo, PNG and persistence',{timeout:120000},async()=>{
 const http=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();
  page.setDefaultTimeout(22000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#toolNav button[data-kind="canvas"]').click();
  const frame=page.frameLocator('#editorFrame');await frame.locator('#stage .item').first().waitFor();
  assert.equal(await frame.locator('#stage .item').count(),3);
  await frame.locator('[data-add="text"]').click();
  assert.equal(await frame.locator('#stage .item').count(),4);
  const selected=frame.locator('#stage .item.selected');
  await selected.dblclick();
  await frame.locator('#editText').fill('안녕, 한빛반!');
  await frame.locator('#editText').press('Tab');
  await frame.locator('#stage .item').filter({hasText:'안녕, 한빛반!'}).waitFor();
  let original=await frame.locator('#stage .item').filter({hasText:'안녕, 한빛반!'}).evaluate(n=>parseInt(n.style.left));
  let geom=await frame.locator('#stage .item').filter({hasText:'안녕, 한빛반!'}).boundingBox();
  await page.mouse.move(geom.x+45,geom.y+25);
  await page.mouse.down();await page.mouse.move(geom.x+85,geom.y+50,{steps:6});await page.mouse.up();
  let moved=await frame.locator('#stage .item').filter({hasText:'안녕, 한빛반!'}).evaluate(n=>parseInt(n.style.left));
  assert.ok(moved>original,'Dragging must update the editable object position');
  const widthBefore=await frame.locator('#stage .item.selected').evaluate(n=>parseInt(n.style.width));
  const grip=await frame.locator('#stage .item.selected .grip').boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.mouse.down();await page.mouse.move(grip.x+grip.width/2+32,grip.y+grip.height/2+19,{steps:6});await page.mouse.up();
  const widthAfter=await frame.locator('#stage .item.selected').evaluate(n=>parseInt(n.style.width));
  assert.ok(widthAfter>widthBefore,'Dragging the resize grip must increase width');
  await frame.locator('#duplicate').click();assert.equal(await frame.locator('#stage .item').count(),5);
  await frame.locator('#undo').click();assert.equal(await frame.locator('#stage .item').count(),4);
  await frame.locator('#redo').click();assert.equal(await frame.locator('#stage .item').count(),5);
  await frame.locator('#newPage').click();assert.equal(await frame.locator('#pageStrip .page').count(),2);
  await frame.locator('#stage .item').first().waitFor({state:'detached'});
  await frame.locator('[data-add="rect"]').click();assert.equal(await frame.locator('#stage .item').count(),1);
  const pngDownload=page.waitForEvent('download');
  await frame.locator('#exportPng').click();
  const png=await pngDownload;assert.ok(png.suggestedFilename().endsWith('.png'));
  assert.deepEqual([...fs.readFileSync(await png.path()).subarray(0,8)],[137,80,78,71,13,10,26,10]);
  // PNG/JPG photos remain independent editable elements and rasterize to PNG.
  const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
  await frame.locator('#photoPicker').setInputFiles({name:'우리반.png',mimeType:'image/png',buffer:photo});
  await frame.locator('#stage .item[data-type="image"]').waitFor();
  const photoDownload=page.waitForEvent('download');
  await frame.locator('#exportPng').click();
  const withPhoto=await photoDownload;
  assert.ok(fs.statSync(await withPhoto.path()).size>100);
  // Cross-frame common autosave writes both pages, undo changes and text.
  await page.waitForFunction(async()=>{
   const data=await GulliverStudioStorage.projects();
   return data.some(x=>x.kind==='canvas'&&x.payload.pages.length===2&&x.payload.pages[0].elements.some(e=>e.content==='안녕, 한빛반!'));
  });
  await page.locator('#navHome').click();
  await page.locator('#projectList .project-item').filter({hasText:'새 발표 자료'}).getByRole('button',{name:'열기'}).click();
  await frame.locator('#pageStrip .page').nth(1).waitFor();
  assert.equal(await frame.locator('#pageStrip .page').count(),2);
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
 }finally{await browser?.close();http.kill('SIGTERM')}
});
test('3.0 browser: original design/slide projects are preserved on editable conversion',{timeout:120000},async()=>{
 const http=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext(),page=await ctx.newPage();page.setDefaultTimeout(22000);
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   const S=GulliverStudioStorage,now=Date.now();
   await S.saveProject({id:'old-design',kind:'design',title:'원본 도안',createdAt:now,updatedAt:now,payload:{title:'원본 도안',size:'A4',objects:[
    {id:'a',type:'text',x:30,y:50,w:320,h:65,text:'감정 카드',fontSize:32,fill:'#26384f'},
    {id:'b',type:'rect',x:40,y:120,w:200,h:100,fill:'#ffddaa',stroke:'#aabbcc'}]}});
   await S.saveProject({id:'old-slides',kind:'slides',title:'원본 발표',createdAt:now,updatedAt:now,payload:{version:1,title:'원본 발표',theme:'sky',slides:[
    {title:'우리의 여행',body:'함께 배워요',eyebrow:'세계 여러 나라'},
    {title:'다음 활동',body:'어디로 갈까요?'}]}});
   await GulliverStudioBridge.refreshProjects();
  });
  const design=page.locator('#projectList .project-item').filter({hasText:'원본 도안'});
  await design.getByRole('button',{name:'통합에서 편집'}).click();
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#stage .item').filter({hasText:'감정 카드'}).waitFor();
  assert.equal(await frame.locator('#layout').inputValue(),'a4');
  await page.waitForFunction(async()=>(await GulliverStudioStorage.projects()).length===3);
  await page.getByRole('button',{name:'내 작업·소재함'}).click();
  await page.locator('.sidebar').waitFor({state:'visible'});
  const slide=page.locator('#projectList .project-item').filter({hasText:'원본 발표'});
  await slide.getByRole('button',{name:'통합에서 편집'}).click();
  await frame.locator('#pageStrip .page').nth(1).waitFor();
  await frame.locator('#stage .item').filter({hasText:'우리의 여행'}).waitFor();
  await page.waitForFunction(async()=>(await GulliverStudioStorage.projects()).length===4);
  const state=await page.evaluate(async()=>{
   const v=await GulliverStudioStorage.projects();
   return {origins:v.filter(p=>['old-design','old-slides'].includes(p.id)).map(p=>p.kind).sort(),
    copies:v.filter(p=>p.kind==='canvas').map(p=>p.payload.pages.length).sort()};
  });
  assert.deepEqual(state,{origins:['design','slides'],copies:[1,2]});
 }finally{await browser?.close();http.kill('SIGTERM')}
});
