'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const fs=require('node:fs');

const URL='http://127.0.0.1:8765/'+encodeURIComponent('뚝딱 제작실.html');

async function waitServer(){
 for(let i=0;i<60;i++){
  try{const r=await fetch('http://127.0.0.1:8765/studio-core.js');if(r.ok)return}catch(e){}
  await new Promise(r=>setTimeout(r,250));
 }
 throw Error('Local HTTP studio server did not start');
}
async function savedProject(page,title){
 await page.waitForFunction(async expected=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('gulliver-studio-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction('projects','readonly');
   const r=tx.objectStore('projects').getAll();
   r.onsuccess=()=>resolve(r.result.some(x=>x.title===expected));
   r.onerror=()=>reject(r.error);
  })}finally{db.close()}
 },title,{timeout:18000});
}
test('실제 Chromium: 자동 저장/새로고침 복원/사진 소재 삽입/JSON 가져오기', {timeout:180000},async()=>{
 const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await waitServer();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  page.setDefaultTimeout(18000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  await page.locator('#toolNav button[data-kind="design"]').click();
  const frame=page.frameLocator('#editorFrame');
  await page.locator('#proxy-projectTitle').waitFor();
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('studio-managed')),true);
  assert.equal(await page.locator('#studioPalette').isVisible(),true);
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor({timeout:15000});
  await page.locator('#proxy-projectTitle').fill('저장 복원 자동검사 도안');
  await page.locator('#proxy-projectTitle').press('Tab');
  // New shared add palette operates the underlying native design tools.
  await page.locator('[data-palette="add"]').click();
  await page.locator('#insertList').getByRole('button',{name:'글씨'}).click();
  await page.locator('#proxy-shapeText').waitFor();
  await page.locator('#proxy-shapeText').fill('공통 편집 패널 테스트');
  await page.locator('#proxy-shapeText').press('Tab');
  assert.ok((await frame.locator('#sheet').textContent()).includes('공통 편집 패널 테스트'));
  await savedProject(page,'저장 복원 자동검사 도안');

  // Upload to common shelf, inject without constructing DataTransfer (iOS-safe).
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
  await page.locator('#assetUpload').setInputFiles({name:'test-pixel.png',mimeType:'image/png',buffer:png});
  await page.locator('[data-inspector="assets"]').click();
  await page.locator('#assetList .asset-item').first().waitFor();
  await page.locator('#assetList .asset-item .tiny.open').first().click();
  await frame.locator('#sheet image').first().waitFor();
  assert.ok((await frame.locator('#sheet image').first().getAttribute('href')).startsWith('data:image/png;base64,'));
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  await page.waitForTimeout(700);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-inspector="projects"]').click();
  await page.locator('#projectList .project-item').filter({hasText:'저장 복원 자동검사 도안'}).first().waitFor();
  await page.locator('#projectList .project-item').filter({hasText:'저장 복원 자동검사 도안'}).first().getByRole('button',{name:'열기'}).click();
  await page.locator('#proxy-projectTitle').waitFor();
  assert.equal(await page.locator('#proxy-projectTitle').inputValue(),'저장 복원 자동검사 도안');
  assert.ok((await frame.locator('#sheet').textContent()).includes('공통 편집 패널 테스트'));
  assert.equal(await frame.locator('#sheet image').count(),1);

  // Slides: actual iframe editing and persisted project.
  await page.locator('#toolNav button[data-kind="slides"]').click();
  const slides=page.frameLocator('#editorFrame');
  await page.locator('#proxy-deckTitle').waitFor();
  await page.locator('#templateList').getByRole('button',{name:'우리 반 퀴즈'}).click();
  await page.locator('#proxy-deckTitle').fill('자동검사 발표');
  await page.locator('[data-palette="pages"]').click();
  assert.ok(await page.locator('#pageList .palette-slide').count()>=3);
  await savedProject(page,'자동검사 발표');

  // Document: edit a real form and commit it to IndexedDB.
  await page.locator('#toolNav button[data-kind="document"]').click();
  const document=page.frameLocator('#editorFrame');
  await page.locator('#proxy-titleInput').waitFor();
  await page.locator('[data-palette="add"]').click();
  await page.locator('#insertList').getByRole('button',{name:'소제목'}).click();
  await document.locator('#blocks .heading').last().waitFor();
  await page.locator('#proxy-titleInput').fill('자동검사 가정통신문');
  await page.locator('#proxy-titleInput').press('Tab');
  await savedProject(page,'자동검사 가정통신문');
  // Editing through the shared inspector must retain the document's Undo/Redo history.
  await page.locator('#studioQuickBar [data-native="#undo"]').click();
  await page.waitForFunction(()=>document.querySelector('#proxy-titleInput')?.value==='가정통신문');
  await page.locator('#studioQuickBar [data-native="#redo"]').click();
  await page.waitForFunction(()=>document.querySelector('#proxy-titleInput')?.value==='자동검사 가정통신문');

  // Existing standalone JSON imported from a different editor should be
  // committed even without a subsequent keystroke.
  await page.locator('#importProject').setInputFiles({
   name:'old-project.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({title:'가져온 새 문서',version:1,theme:'blue',subtitle:'검수',blocks:[{type:'paragraph',text:'한글 내용'}]}))
  });
  await savedProject(page,'가져온 새 문서');

  // Exported backup is a complete JSON project, not just the old format.
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-inspector="projects"]').click();
  await page.locator('#exportProject').click();
  const download=await downloadPromise;
  assert.ok(download.suggestedFilename().endsWith('.gulliver.json'));
  const file=await download.path();
  const backup=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(backup.kind,'document');
  assert.equal(backup.payload.title,'가져온 새 문서');
  // A failed IndexedDB write must prevent editor switching and expose a warning.
  await page.evaluate(()=>{
   window.GulliverStudioStorage.saveProject=async()=>{throw new Error('가상 저장 공간 오류')};
  });
  await page.locator('[data-inspector="properties"]').click();
  await page.locator('#proxy-titleInput').fill('저장 실패 보호 테스트');
  await page.locator('#toolNav button[data-kind="design"]').click();
  await page.locator('#saveStatus').filter({hasText:'저장 실패'}).waitFor();
  assert.equal(await page.locator('#toolNav button[data-kind="document"]').getAttribute('aria-current'),'true');
  // Narrow viewport: both common drawers must be reachable and closeable.
  await page.setViewportSize({width:390,height:844});
  await page.locator('#openPalette').click();
  assert.equal(await page.locator('#studioPalette').getAttribute('class'),'studio-palette is-open');
  await page.locator('[data-palette="templates"]').click();
  await page.locator('#drawerShade').click({position:{x:350,y:500}});
  assert.ok(!(await page.locator('#studioPalette').getAttribute('class')).includes('is-open'));
  await page.locator('#openInspector').click();
  assert.ok((await page.locator('.sidebar').getAttribute('class')).includes('is-open'));
  await page.locator('[data-inspector="assets"]').click();
  await page.locator('#drawerShade').click({position:{x:10,y:500}});
  assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join(' | '));
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
});
