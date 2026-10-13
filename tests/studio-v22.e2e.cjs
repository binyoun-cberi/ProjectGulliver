'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const port=8781,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html');
async function ready(){
 for(let i=0;i<100;i++){
  try{if((await fetch(base+'studio-transfer-core.js')).ok)return}catch(e){}
  await new Promise(resolve=>setTimeout(resolve,180));
 }
 throw Error('2.2 검수용 로컬 서버를 열지 못했어요.');
}
test('2.2 Chrome: 발표 슬라이드 → 영상 4장면, 간편 음악 → 배경음악·실제 WebM, 전체 백업',
 {timeout:240000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({acceptDownloads:true});
  page.setDefaultTimeout(35000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const frame=page.frameLocator('#editorFrame');
  await page.locator('#toolNav [data-kind="slides"]').click();
  await page.locator('#proxy-slideTitle').waitFor();
  await page.locator('#sendAllSlides').click();
  await frame.locator('#simpleMode[aria-selected="true"]').waitFor();
  await page.waitForFunction(async()=>{
   const video=(await GulliverStudioStorage.projects()).find(p=>p.kind==='video'&&p.payload.clips.length===4);
   return Boolean(video);
  });
  assert.equal(await frame.locator('#clipList .clip').count(),4);
  assert.equal((await page.evaluate(async()=> (await GulliverStudioStorage.assets()).length))>=4,true);

  await page.locator('#toolNav [data-kind="music"]').click();
  await frame.locator('#simpleMode').click();
  await frame.locator('#titleInput').waitFor();
  await frame.locator('[data-template="dance"]').click();
  await page.locator('#transferTarget').selectOption('video');
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="video"][aria-current="true"]').waitFor();
  await frame.locator('#simpleMode[aria-selected="true"]').waitFor();
  // A previous video project exists from the slide transfer: require the new
  // handoff to finish saving, not merely any transient project snapshot.
  await page.locator('#message').filter({hasText:'배경음악을 영상 뚝딱에 전달했어요'}).waitFor();
  await page.waitForFunction(async()=>{
   return (await GulliverStudioStorage.projects()).some(p=>p.kind==='video'&&p.payload.audio?.mediaId);
  });
  const state=await page.evaluate(async()=>{
   const projects=await GulliverStudioStorage.projects(),media=await GulliverStudioStorage.media();
   const video=projects.find(p=>p.kind==='video'&&p.payload.audio?.mediaId);
   return{found:!!video,media:media.some(m=>m.id===video?.payload.audio?.mediaId&&m.mime==='audio/wav')};
  });
  assert.deepEqual(state,{found:true,media:true});
  await page.locator('[data-inspector="assets"]').click();
  await page.locator('#assetList .asset-item').first().getByRole('button',{name:'현재 도구에 넣기'}).click();
  await frame.locator('#clipList .clip').first().waitFor();
  await frame.locator('body').evaluate(()=>{
   const Original=window.MediaRecorder;
   window.MediaRecorder=class extends Original{
    constructor(stream,opts){super(stream,opts);window.__recordedAudioTracks=stream.getAudioTracks().length}
   };
  });
  const videoDownload=page.waitForEvent('download',{timeout:65000});
  await frame.locator('#exportVideo').click();
  const movie=await videoDownload;
  const bytes=fs.readFileSync(await movie.path());
  assert.ok(bytes.length>1000,'출력 WebM에 미디어가 없어요.');
  assert.ok(bytes[0]===0x1a&&bytes[1]===0x45,'WebM 파일 헤더가 올바르지 않아요.');
  assert.ok((await frame.locator('body').evaluate(()=>window.__recordedAudioTracks))>0,'영상과 함께 녹음된 오디오 트랙이 없어요.');

  const backup=page.waitForEvent('download',{timeout:25000});
  await page.locator('#libraryBackup').click();
  const archive=JSON.parse(fs.readFileSync(await (await backup).path(),'utf8'));
  const project=archive.projects.find(p=>p.kind==='video'&&p.payload.audio?.mediaId);
  assert.ok(project,'영상 프로젝트의 배경음악 참조가 백업에 포함되어야 해요.');
  assert.ok(archive.media.some(m=>m.id===project.payload.audio.mediaId&&m.mime==='audio/wav'),
   '음원 원본이 통합 백업에 포함되어야 해요.');
  assert.deepEqual(errors,[],'브라우저 오류: '+errors.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});
