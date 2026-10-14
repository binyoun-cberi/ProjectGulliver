'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8843,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas';
async function ready(){for(let i=0;i<90;i++){try{if((await fetch(base+'studio-canvas-shell.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,160))}throw Error('Test server unavailable')}
test('Canva-style unified editor: PC left rail and mobile bottom-sheet editing use native canvas controls',{timeout:110000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1340,height:850},acceptDownloads:true});
  page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('.design-nav [data-design-tab="elements"]').waitFor();
  const desktop=await frame.locator('.editor-grid').evaluate(el=>{
    const rail=el.querySelector('.design-nav').getBoundingClientRect();
    const panel=el.querySelector('.design-panel').getBoundingClientRect();
    const work=el.querySelector('.work').getBoundingClientRect();
    return{railX:rail.x,panelX:panel.x,workX:work.x,width:rail.width};
  });
  assert.ok(desktop.railX<desktop.panelX&&desktop.panelX<desktop.workX,'PC rail → panel → canvas');
  await frame.locator('[data-design-tab="text"]').click();
  await frame.locator('.design-pane[data-pane="text"] .pane-action').first().click();
  await frame.locator('#stage .item.selected[data-type="text"]').waitFor();
  await frame.locator('.design-pane[data-pane="properties"]').waitFor({state:'visible'});
  await frame.locator('#propertyText').fill('우리 반 이야기');
  await frame.locator('#propertyText').press('Tab');
  await frame.locator('#stage .item').filter({hasText:'우리 반 이야기'}).waitFor();
  await frame.locator('[data-design-tab="export"]').click();
  const file=page.waitForEvent('download');
  await frame.locator('#exportPng').click();
  assert.ok((await file).suggestedFilename().endsWith('.png'));
  fs.mkdirSync('test-artifacts',{recursive:true});
  await page.screenshot({path:'test-artifacts/canva-shell-pc.png'});
  await page.setViewportSize({width:390,height:844});
  await frame.locator('.design-nav [data-design-tab="elements"]').click();
  const mobile=await frame.locator('.design-nav').evaluate(el=>{
   const rect=el.getBoundingClientRect();return{bottom:rect.bottom,height:rect.height,innerHeight:innerHeight};
  });
  assert.ok(mobile.bottom>=mobile.innerHeight-2&&mobile.height>=55,'phone dock pinned to iframe bottom');
  assert.equal(await page.locator('.studio-mobile-bar').isVisible(),false,'no duplicate bottom navigation');
  await frame.locator('.design-pane[data-pane="elements"] [data-add="rect"]').click();
  await frame.locator('#stage .item.selected[data-type="rect"]').waitFor();
  await frame.locator('.canvas-selection-bar').waitFor({state:'visible'});
  await frame.locator('.canvas-selection-bar button').first().click();
  await frame.locator('.design-pane[data-pane="properties"]').waitFor({state:'visible'});
  await frame.locator('#propertyFill').fill('#22aa88');
  await frame.locator('#propertyFill').press('Tab');
  const model=await frame.locator('body').evaluate(()=>window.GulliverStudioAdapter.capture());
  assert.ok(model.pages[model.active].elements.some(e=>e.type==='rect'&&e.fill.toLowerCase()==='#22aa88'),'native property control edits rectangle');
  await page.screenshot({path:'test-artifacts/canva-shell-mobile.png'});
  assert.deepEqual(errors,[],'Console errors: '+errors.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});