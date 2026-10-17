'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8918,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
const ids=['timer','quiz','seating','check','praise','vote','roulette','qr'];
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(base+'gulliver-shared.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,160))}throw Error('teacher site not ready')}
test('all 8 original teaching apps use compact in-canvas mode while standalone keeps navigation',{timeout:170000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();fs.mkdirSync('test-artifacts',{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const overflows=[];
  for(const [name,width,height]of [['desktop',1280,870],['mobile',390,844]]){
   const ctx=await browser.newContext({viewport:{width,height},hasTouch:name==='mobile',isMobile:name==='mobile'});
   const page=await ctx.newPage();page.setDefaultTimeout(18000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(studio,{waitUntil:'domcontentloaded'});
   const frame=page.frameLocator('#editorFrame');
   await frame.locator('[data-design-tab="teacher"]').click();
   await frame.locator('#teacherLiveTools').waitFor({state:'visible'});
   const drawer=frame.locator('#teacherSavedOptions');
   assert.equal(await drawer.getAttribute('open'),null,'duplicate saved sources are collapsed by default');
   assert.equal(await frame.locator('.teacher-live-tile').count(),11,'8 original tools plus 3 new integrations');
   for(const id of ids){
    const button=frame.locator('.teacher-live-tile').filter({hasText:({
     timer:'수업 흐름 타이머',quiz:'낱말카드·퀴즈',seating:'교실 자리 배정',check:'학급췍',
     praise:'칭찬 온도계',vote:'우리 반 투표판',roulette:'범퍼 룰렛',qr:'QR 코드 만들기'})[id]});
    await button.click();await frame.locator('#teacherLiveDialog[open]').waitFor();
    const nested=frame.frameLocator('#teacherLiveFrame');
    await nested.locator('body.gulliver-studio-embed').waitFor({state:'attached',timeout:20000});
    const metrics=await nested.locator('body').evaluate(()=>{
     const vw=innerWidth,vh=innerHeight;
     const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
     const controls=[...document.querySelectorAll('button,input,select,textarea,a[href]')].filter(visible).filter(el=>!el.closest('#gulliver-student-names'));
     const tiny=controls.map(el=>{const r=el.getBoundingClientRect();return {label:(el.getAttribute('aria-label')||el.title||el.innerText||el.id).slice(0,32),width:Math.round(r.width),height:Math.round(r.height)}}).filter(x=>x.width<40||x.height<40);
     return{
      width:vw,height:vh,docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
      topPadding:getComputedStyle(document.body).paddingTop,
      duplicateShells:document.querySelectorAll('.gulliver-shell').length,
      headings:[...document.querySelectorAll('h1,h2')].filter(visible).map(el=>el.textContent.trim().slice(0,50)).slice(0,8),
      buttons:controls.length,tiny:tiny.slice(0,14),tinyCount:tiny.length
     };
    });
    console.log('TEACHER_NATIVE_SCREEN '+JSON.stringify({tool:id,device:name,...metrics}));
    assert.equal(metrics.duplicateShells,0,id+' should not show extra Gulliver header');
    if(metrics.docWidth-metrics.width>16)overflows.push({device:name,tool:id,pixels:metrics.docWidth-metrics.width});
    assert.ok(metrics.buttons>1,id+' native tool controls inaccessible');
    await page.screenshot({path:'test-artifacts/teacher-'+name+'-'+id+'.png',animations:'disabled',timeout:12000});
    await frame.locator('#teacherLiveClose').click();
    await frame.locator('#teacherLiveDialog').waitFor({state:'hidden'});
   }
   assert.deepEqual(errors,[],name+' should not trigger parent page errors');
   await ctx.close();
  }
  const context=await browser.newContext({viewport:{width:1000,height:750}});
  const standalone=await context.newPage();
  await standalone.goto(base+encodeURIComponent('지도안식 원형 타이머.html'),{waitUntil:'domcontentloaded'});
  await standalone.locator('.gulliver-shell').waitFor({state:'visible'});
  assert.equal(await standalone.locator('body.gulliver-studio-embed').count(),0,'normal tool page keeps its own navigation');
  await context.close();
  console.log('TEACHER_OVERFLOWS '+JSON.stringify(overflows));
  assert.deepEqual(overflows,[],'Original tools must not overflow mobile or desktop');
 }finally{await browser?.close();server.kill('SIGTERM')}
});