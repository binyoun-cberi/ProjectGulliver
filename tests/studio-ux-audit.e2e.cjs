'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8922,base='http://127.0.0.1:'+port+'/';
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'index.html')).ok)return}catch{}await new Promise(r=>setTimeout(r,160))}throw Error('UX site not ready')}
async function audit(page,area,device){
 const found=await page.evaluate(()=>{
  const vw=window.innerWidth,vh=window.innerHeight,dw=document.documentElement.scrollWidth,dh=document.documentElement.scrollHeight;
  const vis=n=>{if(!n)return false;const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0};
  const controls=[...document.querySelectorAll('button,a,summary,input[type=range],select')].filter(vis)
   .filter(n=>!n.closest('.page')&&!n.matches('a[href^="#"]'));
  const small=controls.map(n=>{const r=n.getBoundingClientRect();return{label:(n.getAttribute('aria-label')||n.title||n.innerText||n.id||n.tagName).replace(/\s+/g,' ').slice(0,43),w:Math.round(r.width),h:Math.round(r.height)}})
   .filter(x=>x.w<36||x.h<36);
  const fixed=[...document.querySelectorAll('nav,aside,header')].filter(vis).map(n=>({label:(n.getAttribute('aria-label')||n.className||n.id).slice(0,38),height:Math.round(n.getBoundingClientRect().height)})).slice(0,12);
  return{width:vw,height:vh,docWidth:dw,docHeight:dh,horizontalOverflow:dw-vw,visibleActions:controls.length,
   smallActions:small.length,small:small.slice(0,16),navs:fixed,title:document.title,
   primaryH1:[...document.querySelectorAll('h1')].filter(vis).map(n=>n.textContent.trim().slice(0,70)),bodyClasses:document.body.className};
 });
 console.log('UX_AUDIT '+JSON.stringify({area,device,...found}));
 await page.screenshot({path:'test-artifacts/ux-'+area+'-'+device+'.png',fullPage:false});
 assert.ok(found.visibleActions>2,area+' must expose usable actions');
 assert.ok(found.horizontalOverflow<=12,area+' must not overflow viewport: '+JSON.stringify(found));
 return found;
}
test('UX inspection: home to new canvas to panels on desktop/tablet/phone',{timeout:145000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();fs.mkdirSync('test-artifacts',{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  for(const [device,width,height] of [['desktop',1440,900],['laptop',1024,768],['tablet',768,1024],['phone',390,844],['small-phone',320,720]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:device==='phone',isMobile:device==='phone',deviceScaleFactor:1});
   const page=await context.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));page.setDefaultTimeout(20000);
   await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
   await page.locator('.format-tile[href*="template=blank"]').waitFor();
   await audit(page,'home',device);
   const headline=await page.locator('#pageTitle').textContent();
   assert.ok(headline.includes('오늘'),headline);
   const openDialog=device==='desktop'||device==='laptop'?'#createButton':'.home-bottom-bar [data-create]';
   await page.locator(openDialog).click();
   assert.ok(await page.locator('#createDialog[open]').count(),'New-project dialog opens at '+device);
   assert.equal(await page.locator('#createDialog .create-main a').count(),3);
   await page.locator('#createDialog [data-close]').click();
   // The primary home start flow should not require discovering legacy tools.
   await page.locator('.format-tile[href*="template=blank"]').click();
   await page.locator('#editorFrame').waitFor({state:'attached'});
   const frame=page.frameLocator('#editorFrame');await frame.locator('#stage').waitFor();
   await audit(page,'studio',device);
   {
    // Measure the embedded canvas independently from the outer studio shell.
    const obj=await frame.locator('body').evaluate(()=>{
     const stage=document.getElementById('stage').getBoundingClientRect();
     const rail=document.querySelector('.design-nav').getBoundingClientRect();
     const navButtons=[...document.querySelectorAll('[data-design-tab]')];
     return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,stageWidth:stage.width,railWidth:rail.width,
      categories:navButtons.map(b=>b.textContent.trim()),bodyClass:document.body.className};
    });
    console.log('UX_CANVAS '+JSON.stringify({device,...obj}));
   }
   await frame.locator('body').evaluate(()=>GulliverCanvasShell.activate('elements'));
   // Mobile bottom sheets animate into view. Wait for the first actionable control.
   await frame.locator('[data-pane="elements"] .shelf .insert-tools').waitFor({state:'visible'});
   for(const section of ['templates','teacher-tools','page-tools'])
    assert.equal(await frame.locator('[data-pane="elements"] .shelf .'+section).isVisible(),false,'duplicate '+section+' must not distract from insertion');
   await frame.locator('[data-design-tab="text"]').click();
   await frame.locator('.design-panel').waitFor();
   await frame.locator('[data-add="text"]').evaluate(el=>el.click());
   await frame.locator('#stage .item[data-type="text"]').first().waitFor();
   const selected=await frame.locator('#stage .item[data-type="text"]').count();
   assert.ok(selected>=1);
   // Ask where property controls live rather than relying on double click.
   await frame.locator('[data-design-tab="properties"]').click();
   assert.ok(await frame.locator('#propertyFontFamily').count());
   const extra=await frame.locator('body').evaluate(()=>({
    viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,selected:document.querySelectorAll('#stage .item.selected').length,
    activeTab:document.querySelector('[data-design-tab][aria-selected="true"]')?.dataset.designTab,
    accessibleLabels:[...document.querySelectorAll('.design-nav button')].map(x=>x.getAttribute('aria-label')),
    panelOpen:document.body.classList.contains('panel-open')
   }));
   console.log('UX_EDITOR '+JSON.stringify({device,...extra}));
   assert.deepEqual(errs,[]);
   await context.close();
  }
 }finally{await browser?.close();server.kill('SIGTERM')}
});