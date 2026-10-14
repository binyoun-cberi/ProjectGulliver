'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8853,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<95;i++){try{if((await fetch(base+'studio-unified-clips.js')).ok)return}catch{}await sleep(160)}throw Error('Site not available')}
test('inline canvas video: import MP4, trim, play, autosave, recover source; fail closed on export',{timeout:125000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser,tmp;
 try{
  await ready();
  tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gulliver-clip-'));
  const video=path.join(tmp,'intro.mp4');
  const ff=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc=size=160x90:rate=12','-t','4','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-an','-y',video],{encoding:'utf8'});
  assert.equal(ff.status,0,'ffmpeg: '+ff.stderr);
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1250,height:820}});
  page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('[data-design-tab="motion"]').click();
  await frame.locator('#canvasVideoUpload').setInputFiles(video);
  await frame.locator('#canvasVideoName').filter({hasText:'intro.mp4'}).waitFor();
  await page.waitForFunction(()=>{
   const adapter=document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter;
   return adapter?.capture().pages[0]?.videoClip?.name==='intro.mp4';
  });
  await page.waitForFunction(async()=>{
   const items=await GulliverStudioStorage.projects();
   return items.some(p=>p.kind==='canvas'&&p.payload.pages[0]?.videoClip?.mime==='video/mp4');
  });
  const stored=await page.evaluate(async()=>{
   const p=await GulliverStudioStorage.projects(),m=await GulliverStudioStorage.media();
   const project=p.find(x=>x.kind==='canvas'&&x.payload.pages[0]?.videoClip);
   return{mime:project?.payload.pages[0].videoClip?.mime,videoBytes:m.find(x=>x.mime==='video/mp4')?.blob?.size||0,projects:p.map(x=>({kind:x.kind,id:x.id,video:x.payload?.pages?.[0]?.videoClip||null})),media:m.map(x=>({mime:x.mime,id:x.id,size:x.blob?.size}))};
  });
  console.log('Saved video debug:',JSON.stringify(stored));
  assert.equal(stored.mime,'video/mp4');assert.ok(stored.videoBytes>500);
  await frame.locator('#canvasVideoIn').fill('1');
  await frame.locator('#canvasVideoIn').press('Tab');
  await frame.locator('#canvasVideoLength').fill('2');
  await frame.locator('#canvasVideoLength').press('Tab');
  const trim=await frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture().pages[0]);
  assert.equal(trim.videoClip.inPoint,1);assert.equal(trim.videoClip.duration,2);assert.equal(trim.duration,2);
  await frame.locator('#timelinePlay').evaluate(el=>el.click());
  await frame.locator('.canvas-video-preview').evaluate(el=>new Promise((resolve,reject)=>{
   if(el.readyState>=2){resolve()}else{el.addEventListener('loadeddata',resolve,{once:true});setTimeout(()=>reject(Error('video frame not decoded')),12000)}
  }));
  await frame.locator('#timelineStop').evaluate(el=>el.click());
  await frame.locator('#exportWebm').evaluate(el=>el.click());
  await frame.locator('#status').filter({hasText:'영상 클립의 합성 출력은 아직 지원하지 않아요'}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await frame.locator('[data-design-tab="motion"]').click();
  const dock=await frame.locator('.design-nav').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight}));
  assert.ok(dock.bottom>=dock.height-2);
  await frame.locator('#canvasVideoRemove').click();
  await page.waitForFunction(()=>!document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture().pages[0]?.videoClip);
  const left=await page.evaluate(async()=>(await GulliverStudioStorage.media()).filter(m=>m.mime==='video/mp4').length);
  assert.equal(left,1,'Removing from page retains original in media shelf');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM');if(tmp)fs.rmSync(tmp,{recursive:true,force:true})}
});