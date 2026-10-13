'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const port=8772,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html');
async function serverReady(){
 for(let i=0;i<70;i++){
  try{if((await fetch(base+'studio-media-core.js')).ok)return}catch(e){}
  await new Promise(r=>setTimeout(r,200));
 }throw Error('정적 서버를 시작할 수 없어요.');
}
test('Chrome: 영상·음악 편집·WAV/WebM 내보내기·자동 저장·전체 미디어 백업 복원',{timeout:180000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await serverReady();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const profile=await browser.newContext({acceptDownloads:true});
  const page=await profile.newPage();page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#toolNav button').count(),7);
  await page.locator('#toolNav button[data-kind="music"]').click();
  // Official ArtCraft mode is selected automatically when vendored bundles exist.
  // This test intentionally exercises the original quick editor's WAV/WebM workflow.
  await page.frameLocator('#editorFrame').locator('#officialStatus')
   .filter({hasText:/편집기가 설치되어|고급 편집 설치 확인 중/}).waitFor();
  await page.frameLocator('#editorFrame').locator('#simpleMode').click();
  const iframe=page.frameLocator('#editorFrame');
  await iframe.locator('#titleInput').waitFor();
  await iframe.locator('[data-template="dance"]').click();
  await iframe.locator('#titleInput').fill('신나는 우리 반 음악');
  await iframe.locator('#titleInput').press('Tab');
  const cell=iframe.locator('[data-track="melody"][data-step="1"]');
  await cell.click();assert.equal(await cell.getAttribute('aria-pressed'),'true');
  const wavDownload=page.waitForEvent('download',{timeout:5000}).catch(error=>error);
  await iframe.locator('#exportWav').click();
  const msg=await iframe.locator('#msg').textContent();
  const wav=await wavDownload;
  if(wav instanceof Error){
   const js=await iframe.locator('body').evaluate(()=>({media:typeof window.GulliverMediaCore,music:typeof window.GulliverMusicCore,adapter:typeof window.GulliverStudioAdapter}));
   throw new Error('WAV export: '+wav.message+' / message: '+msg+' / modules: '+JSON.stringify(js));
  }
  const wavBytes=fs.readFileSync(await wav.path());
  assert.equal(wav.suggestedFilename().endsWith('.wav'),true);
  assert.equal(wavBytes.toString('ascii',0,4),'RIFF');
  await page.waitForFunction(async()=> (await GulliverStudioStorage.projects()).some(p=>p.kind==='music'&&p.title==='신나는 우리 반 음악'));

  await page.locator('#toolNav button[data-kind="video"]').click();
  // Official ArtCraft mode is selected automatically when vendored bundles exist.
  // This test intentionally exercises the original quick editor's WAV/WebM workflow.
  await page.frameLocator('#editorFrame').locator('#officialStatus')
   .filter({hasText:/편집기가 설치되어|고급 편집 설치 확인 중/}).waitFor();
  await page.frameLocator('#editorFrame').locator('#simpleMode').click();
  await iframe.locator('#titleInput').waitFor();
  await iframe.locator('#titleInput').fill('우리 반 가을 영상');
  await iframe.locator('#titleInput').press('Tab');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
  await iframe.locator('#clipFiles').setInputFiles({name:'활동사진.png',mimeType:'image/png',buffer:png});
  await iframe.locator('#clipList .clip').first().waitFor();
  await page.waitForFunction(async()=>{
   const ps=await GulliverStudioStorage.projects(),m=await GulliverStudioStorage.media();
   return ps.some(p=>p.kind==='video'&&p.payload.clips.length===1)&&m.length===1;
  });
  await iframe.locator('#cleanupMedia').click();
  await iframe.locator('#msg').filter({hasText:'미사용 영상 원본이 없어요'}).waitFor();
  assert.equal(await page.evaluate(async()=> (await GulliverStudioStorage.media()).length),1);

  const webmPromise=page.waitForEvent('download',{timeout:35000});
  await iframe.locator('#exportVideo').click();
  const webm=await webmPromise;
  assert.ok(webm.suggestedFilename().endsWith('.webm'));
  assert.ok(fs.statSync(await webm.path()).size>500,'영상 출력이 빈 파일이면 안 됨');

  await page.locator('[data-inspector="projects"]').click();
  const backupPromise=page.waitForEvent('download');
  await page.locator('#libraryBackup').click();
  const backup=await backupPromise;
  const body=fs.readFileSync(await backup.path());
  const archive=JSON.parse(body.toString('utf8'));
  assert.equal(archive.media.length,1);
  assert.equal(archive.projects.filter(p=>p.kind==='video').length,1);
  assert.equal(archive.projects.find(p=>p.kind==='video').title,'우리 반 가을 영상','영상 편집 제목이 백업에 유지되어야 함');
  assert.equal(archive.projects.filter(p=>p.kind==='music').length,1);

  const fresh=await browser.newContext(),restore=await fresh.newPage();restore.setDefaultTimeout(25000);
  const restoredErrors=[];restore.on('pageerror',e=>restoredErrors.push(e.message));
  await restore.goto(url,{waitUntil:'domcontentloaded'});
  restore.once('dialog',dialog=>dialog.accept());
  await restore.locator('#libraryRestore').setInputFiles({name:'media-backup.json',mimeType:'application/json',buffer:body});
  await restore.waitForFunction(async()=>{
   const projects=await GulliverStudioStorage.projects();
   return projects.length===2&&(await GulliverStudioStorage.media()).length===1;
  });
  const info=await restore.evaluate(async()=>{
   const projects=await GulliverStudioStorage.projects(),media=await GulliverStudioStorage.media();
   const p=projects.find(p=>p.kind==='video');
   return {music:projects.some(p=>p.kind==='music'),mediaStored:media.some(m=>m.id===p.payload.clips[0].mediaId)};
  });
  assert.deepEqual(info,{music:true,mediaStored:true});
  await restore.waitForFunction(()=>document.querySelector('#libraryCount')?.textContent?.includes('2개 작업'),{timeout:10000});
  const titles=await restore.locator('#projectList .project-item strong').allTextContents();
  const backupNames=await restore.evaluate(async()=> (await GulliverStudioStorage.projects()).map(x=>x.title));
  assert.ok(titles.includes('우리 반 가을 영상'),'복원 후 화면의 프로젝트 제목: '+JSON.stringify(titles)+' / DB 제목: '+JSON.stringify(backupNames));
  await restore.locator('#projectList .project-item').filter({hasText:'우리 반 가을 영상'}).getByRole('button',{name:'열기'}).click();
  const restoredFrame=restore.frameLocator('#editorFrame');
  await restoredFrame.locator('#clipList .clip').first().waitFor();
  assert.equal(await restoredFrame.locator('#previewImage').getAttribute('src')!==null,true);
  assert.deepEqual(errors,[],'원본 콘솔 오류: '+errors.join(' | '));
  assert.deepEqual(restoredErrors,[],'복원 콘솔 오류: '+restoredErrors.join(' | '));
  await fresh.close();
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
});
