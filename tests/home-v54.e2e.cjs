'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const fs=require('node:fs');
const port=8896,base='http://127.0.0.1:'+port+'/';
async function ready(){
 for(let i=0;i<70;i++){try{if((await fetch(base+'workspace-home-v54.css')).ok)return}catch{}
  await new Promise(ok=>setTimeout(ok,160))}
 throw Error('Home 5.4 server did not start');
}
async function sizes(page){
 return page.evaluate(()=>{
  const rect=selector=>{const a=document.querySelector(selector)?.getBoundingClientRect();return a?{left:a.left,top:a.top,right:a.right,bottom:a.bottom,width:a.width,height:a.height}:null};
  const grid=document.querySelector('.format-grid');
  return {
   viewport:innerWidth,bodyScroll:document.documentElement.scrollWidth,
   content:rect('#content'),main:rect('.main'),
   formats:rect('.format-grid'),formatColumns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
   dashboard:rect('.home-dashboard'),
   templates:rect('.home-dashboard .section:first-child'),
   recent:rect('.home-dashboard .section:nth-child(2)'),
   tools:rect('.home-tool-list'),
   formatTiles:document.querySelectorAll('.format-tile').length,
   hasRecent:!!document.getElementById('unifiedHomeRecent'),
   hasLibrary:!!document.querySelector('.home-dashboard .studio-library-link'),
   cssLoaded:[...document.styleSheets].some(x=>x.href?.includes('workspace-home-v54.css'))
  };
 });
}
test('5.4 home fluid widths preserve all six actions at 2560, 1920, 1440, 1100, 768 and phone 390',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const viewports=[2560,1920,1440,1100,768,390];
  fs.mkdirSync('test-artifacts',{recursive:true});
  for(const width of viewports){
   await page.setViewportSize({width,height:width<800?844:1080});
   await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
   await page.locator('.home-dashboard .section').first().waitFor();
   await page.locator('#unifiedHomeRecent .unified-empty, #unifiedHomeRecent .unified-item').first().waitFor();
   const m=await sizes(page);
   assert.equal(m.cssLoaded,true,'5.4 CSS loaded at '+width);
   assert.equal(m.formatTiles,6,'all six create actions at '+width);
   assert.equal(m.hasRecent,true);
   assert.equal(m.hasLibrary,true);
   assert.ok(m.content.width>0);
   assert.ok(m.content.right<=width+1,'content extends past right edge '+width+': '+JSON.stringify(m));
   assert.ok(m.bodyScroll<=width+2,'horizontal page overflow at '+width+': '+JSON.stringify(m));
   assert.equal(m.formatColumns,width>=1400?6:3,'correct action columns at '+width);
   if(width>=1400){
    assert.ok(m.templates.right<m.recent.left,'desktop panels should be side by side at '+width);
    assert.ok(Math.abs(m.templates.top-m.recent.top)<8,'desktop panel headings aligned '+width);
    assert.ok(m.content.width>1100,'wide space should be used at '+width);
   }else{
    assert.ok(m.templates.bottom<m.recent.top+4,'stacked panels at '+width);
   }
   if(width===1920){
    assert.ok(m.content.width>=1450,'1920-wide monitor must not retain narrow 1200px max-width');
    await page.screenshot({path:'test-artifacts/home-v54-desktop-1920.png',fullPage:true});
    await page.locator('#railToggle').click();
    const expanded=await sizes(page);
    assert.equal(expanded.formatTiles,6);
    assert.ok(expanded.content.right<=width+1,'expanded sidebar should not overflow');
   }
   if(width===390){
    await page.screenshot({path:'test-artifacts/home-v54-mobile-390.png',fullPage:true});
    assert.ok(m.formats.width>=300,'phone action cards should remain usable');
   }
  }
  assert.deepEqual(errors,[],'browser runtime exceptions');
 }finally{await browser?.close();server.kill('SIGTERM')}
});
