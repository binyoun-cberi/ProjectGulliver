'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const BASE='http://127.0.0.1:8771/';
const URL=BASE+encodeURIComponent('뚝딱 제작실.html');
async function waitServer(){
 for(let i=0;i<80;i++){
  try{if((await fetch(BASE+'studio-library-core.js')).ok)return}catch{}
  await new Promise(r=>setTimeout(r,220))
 }
 throw Error('서버를 시작하지 못했어요.');
}
async function count(page){
 return page.evaluate(async()=>{
  const s=GulliverStudioStorage;
  return{projects:(await s.projects()).length,assets:(await s.assets()).length,folders:(await s.folders()).length,
   activities:ClassroomWorkspace.read().activities.length}
 });
}
test('Chrome: 프로젝트 폴더·검색·통합 백업·기기 변경 복원 및 기존 내 활동 보존',{timeout:150000},async()=>{
 const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await waitServer();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({acceptDownloads:true});
  const page=await ctx.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);
  await page.locator('#toolNav [data-kind="design"]').click();
  await page.locator('#proxy-projectTitle').waitFor();
  await page.locator('#proxy-projectTitle').fill('가을 활동 도안');
  await page.locator('#proxy-projectTitle').press('Tab');
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  await page.locator('[data-inspector="projects"]').click();
  page.once('dialog',d=>d.accept('세계 여러 나라'));
  await page.locator('#addLibraryFolder').click();
  await page.locator('#libraryFolder option').filter({hasText:'세계 여러 나라'}).waitFor();
  await page.locator('#projectList .project-item').filter({hasText:'가을 활동 도안'}).getByRole('button',{name:'폴더 이동'}).click();
  await page.locator('#folderMoveSelect').selectOption({label:'세계 여러 나라'});
  await page.locator('#folderForm button[type="submit"]').click();
  await page.locator('#libraryFolder').selectOption({label:'세계 여러 나라'});
  assert.equal(await page.locator('#projectList .project-item').count(),1);
  await page.locator('#librarySearch').fill('없는 자료');
  assert.equal(await page.locator('#projectList .project-item').count(),0);
  await page.locator('#librarySearch').fill('가을');
  assert.equal(await page.locator('#projectList .project-item').count(),1);

  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
  await page.locator('#assetUpload').setInputFiles({name:'가을사진.png',mimeType:'image/png',buffer:png});
  await page.evaluate(()=>localStorage.setItem('gulliver.activities.v1',JSON.stringify({
   version:1,folders:[{id:'legacyFolder',name:'놀이 수업'}],
   activities:[{id:'legacyQuiz',kind:'quiz',title:'세계 여러 나라 퀴즈',folderId:'legacyFolder',
     payload:{cards:[{front:'대한민국',back:'서울'}]},createdAt:1,updatedAt:2,archived:false}]
  })));
  await page.locator('#librarySearch').fill('');
  const save=page.waitForEvent('download');
  await page.locator('#libraryBackup').click();
  const downloaded=await save;
  assert.match(downloaded.suggestedFilename(),/전체백업/);
  const bytes=fs.readFileSync(await downloaded.path());
  const archive=JSON.parse(bytes.toString('utf8'));
  assert.equal(archive.format,'gulliver.studio.bundle');
  assert.equal(archive.projects.length,1);
  assert.equal(archive.folders.length,1);
  assert.equal(archive.assets.length,1);
  assert.ok(archive.assets[0].data.startsWith('data:image/png;base64,'));
  assert.equal(archive.activities.activities.length,1);

  // A fresh browser profile has no local project or activity storage.
  const fresh=await browser.newContext();
  const restored=await fresh.newPage();restored.setDefaultTimeout(20000);
  const errors2=[];restored.on('pageerror',e=>errors2.push(e.message));
  await restored.goto(URL);
  assert.deepEqual(await count(restored),{projects:0,assets:0,folders:0,activities:0});
  restored.once('dialog',d=>d.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'백업.json',mimeType:'application/json',buffer:bytes});
  await restored.waitForFunction(async()=>{
   const p=await GulliverStudioStorage.projects();
   return p.length===1&&ClassroomWorkspace.read().activities.length===1;
  });
  assert.deepEqual(await count(restored),{projects:1,assets:1,folders:1,activities:1});
  await restored.locator('#libraryFolder').selectOption({label:'세계 여러 나라'});
  await restored.locator('#librarySearch').fill('가을');
  assert.equal(await restored.locator('#projectList .project-item').count(),1);
  await restored.locator('#librarySearch').fill('');
  assert.ok((await restored.locator('#legacyActivityList').textContent()).includes('세계 여러 나라 퀴즈'));

  // Restore again: append copies, never replace existing project or image IDs.
  restored.once('dialog',d=>d.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'백업.json',mimeType:'application/json',buffer:bytes});
  await restored.waitForFunction(async()=> (await GulliverStudioStorage.projects()).length===2);
  assert.deepEqual(await count(restored),{projects:2,assets:2,folders:1,activities:2});

  const broken=Buffer.from(JSON.stringify({...archive,version:900}));
  await restored.locator('#libraryRestore').setInputFiles({name:'잘못된파일.json',mimeType:'application/json',buffer:broken});
  await restored.locator('#message').filter({hasText:'복원 실패'}).waitFor();
  assert.deepEqual(await count(restored),{projects:2,assets:2,folders:1,activities:2});
  assert.deepEqual(errors,[]);
  assert.deepEqual(errors2,[]);
  await fresh.close();
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
});
