'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8926,base='http://127.0.0.1:'+port+'/';
const screens=[['index.html','홈'],['뚝딱 제작실.html','제작실'],['내 보관함.html','내 보관함'],['lesson.html','수업 준비']];
async function ready(){
 for(let i=0;i<85;i++){
  try{const response=await fetch(base+'gulliver-ui-v56.css');await response.arrayBuffer();if(response.ok)return}catch{}
  await new Promise(ok=>setTimeout(ok,170));
 }
 throw Error('5.6 page server did not start');
}
test('5.6 Chrome shows identical workspace routes and usable active navigation from phone to wide desktop',{timeout:130000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('test-artifacts',{recursive:true});
  for(const width of [390,768,1440,1920]){
   await page.setViewportSize({width,height:width<=768?844:1000});
   for(const [path,name] of screens){
    await page.goto(base+encodeURIComponent(path),{waitUntil:'domcontentloaded'});
    const tabs=page.locator('.gulliver-nav a');
    await tabs.first().waitFor();
    assert.equal(await tabs.count(),4,name+' tabs at '+width+'px');
    assert.deepEqual(await tabs.allTextContents(),['⌂홈','✎제작실','▦내 보관함','▤수업 준비']);
    assert.equal(await tabs.filter({hasText:name}).first().getAttribute('aria-current'),'page');
    const m=await page.evaluate(()=>{
     const nav=document.querySelector('.gulliver-nav'),bbox=nav.getBoundingClientRect();
     const tabs=[...nav.querySelectorAll('a')].map(a=>a.getBoundingClientRect());
     return{w:innerWidth,left:bbox.left,right:bbox.right,width:bbox.width,
       links:tabs.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),
       style:!![...document.styleSheets].find(s=>s.href?.includes('gulliver-ui-v56.css')),
       brand:getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),
       scrollWidth:document.documentElement.scrollWidth};
    });
    assert.ok(m.style,'global CSS loaded on '+name);
    assert.equal(m.brand,'#6949d3','theme token mismatch on '+name);
    assert.ok(m.left>=-1&&m.right<=width+1,'global menu overflows viewport '+name+' '+width+' '+JSON.stringify(m));
    assert.ok(m.links.every(x=>x.right<=m.right+1&&x.left>=m.left-1),'link outside nav '+name+' '+width);
    assert.ok(m.links.every(x=>x.bottom-x.top>=32),'touch target too short '+name+' '+width);
    if((width===390||width===1920)&&path==='lesson.html'){
     await page.screenshot({path:'test-artifacts/ui-v56-'+width+'.png',fullPage:true});
    }
   }
  }
  assert.deepEqual(errors,[],'uncaught errors while browsing four workspaces');
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('5.6 Chrome preserves a live canvas on navigation to unified library and new lesson edits on exit',{timeout:125000},async()=>{
 const server=spawn('python3',['-m','http.server','8927','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 const url='http://127.0.0.1:8927/';
 try{
  for(let n=0;n<80;n++){try{const r=await fetch(url+'index.html');await r.arrayBuffer();if(r.ok)break}catch{}await new Promise(ok=>setTimeout(ok,140))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:950}});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  await page.goto(url+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=presentation',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#designTitle').waitFor();
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  await frame.locator('#designTitle').fill('공통 메뉴 이동 검수 자료');
  await frame.locator('#designTitle').press('Tab');
  await page.locator('.gulliver-nav a[href="내 보관함.html"]').click();
  await page.waitForURL(/%EB%82%B4|내.*보관함/,{timeout:25000});
  await page.locator('#unifiedLibraryList .unified-item').filter({hasText:'공통 메뉴 이동 검수 자료'}).waitFor();
  await page.locator('.gulliver-nav a[href="lesson.html"]').click();
  await page.waitForURL(/lesson\.html/);
  await page.locator('#lessonGoal').fill('수업 이동해도 목표가 저장된다');
  await page.locator('#lessonAudience').fill('한빛반');
  await page.locator('.gulliver-nav a[href="내 보관함.html"]').click();
  await page.waitForURL(/%EB%82%B4|내.*보관함/);
  const result=await page.evaluate(async()=>{
   const lessons=await LessonStorage.list();
   const projects=await GulliverStudioStorage.projects();
   return{lessons:lessons.map(l=>({goal:l.goal,audience:l.audience})),
    projects:projects.map(p=>p.title)};
  });
  assert.ok(result.lessons.some(l=>l.goal==='수업 이동해도 목표가 저장된다'&&l.audience==='한빛반'));
  assert.ok(result.projects.includes('공통 메뉴 이동 검수 자료'));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
