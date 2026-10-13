'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8793,base='http://127.0.0.1:'+port+'/';
const studio=base+encodeURIComponent('뚝딱 제작실.html');
const json=Buffer.from(JSON.stringify({project:'FilmCraft archive fixture',sequences:[],version:1}));
const zip=Buffer.from([80,75,3,4,20,0,0,0,0,0,0,0,0,0,0,0,0,0]);
async function serverReady(){
 for(let i=0;i<90;i++){try{if((await fetch(base+'studio-storage.js')).ok)return}catch{}
  await new Promise(ok=>setTimeout(ok,180))}
 throw Error('Studio server unavailable');
}
test('Chrome: native FilmCraft/SoundCraft vault, original downloads, complete backup and reopen route', {timeout:165000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({acceptDownloads:true});const page=await ctx.newPage();
  page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(studio,{waitUntil:'domcontentloaded'});
  await page.locator('#officialImport').setInputFiles([
   {name:'아침 영상.fcproj',mimeType:'application/json',buffer:json},
   {name:'음악 세션.scraftz',mimeType:'application/zip',buffer:zip}
  ]);
  await page.locator('#officialProjectList .project-item').nth(1).waitFor();
  const before=await page.evaluate(async()=>{
   const items=await GulliverStudioStorage.official();
   return {length:items.length,types:items.map(x=>x.kind).sort(),projects:(await GulliverStudioStorage.projects()).length};
  });
  assert.deepEqual(before,{length:2,types:['music','video'],projects:0});
  const movie=page.locator('#officialProjectList .project-item').filter({hasText:'아침 영상'});
  page.once('dialog',d=>d.accept('가을 프로젝트'));
  await page.locator('#addLibraryFolder').click();
  await movie.getByRole('button',{name:'폴더 이동'}).click();
  await page.locator('#folderMoveSelect').selectOption({label:'가을 프로젝트'});
  await page.locator('#folderForm button[type="submit"]').click();
  await page.waitForFunction(async()=>{
   const f=(await GulliverStudioStorage.folders()).find(x=>x.name==='가을 프로젝트');
   return !!f&&(await GulliverStudioStorage.official()).some(x=>x.kind==='video'&&x.folderId===f.id);
  });
  const filePromise=page.waitForEvent('download');
  await movie.getByRole('button',{name:'원본 내려받기'}).click();
  const file=await filePromise;assert.ok(file.suggestedFilename().endsWith('.fcproj'));
  assert.deepEqual(fs.readFileSync(await file.path()),json);
  const backupPromise=page.waitForEvent('download');
  await page.locator('#libraryBackup').click();
  const backup=JSON.parse(fs.readFileSync(await (await backupPromise).path(),'utf8'));
  assert.equal(backup.official.length,2);
  assert.equal(backup.version,1); // Preserve compatibility with v1 bundles.
  assert.ok(backup.official.some(x=>x.kind==='video'&&x.folderId),'Folder association is backed up');
  assert.ok(backup.official.some(x=>x.name.endsWith('.scraftz')));
  await movie.getByRole('button',{name:'열기'}).click();
  await page.locator('#toolNav [data-kind="video"][aria-current="true"]').waitFor();
  const src=await page.locator('#editorFrame').getAttribute('src');
  assert.match(src,/officialId=/);
  assert.equal(await page.evaluate(async()=>(await GulliverStudioStorage.projects()).length),0,
   'Reopening native projects must not create empty quick-edit projects');
  const next=await browser.newContext();const restored=await next.newPage();
  restored.setDefaultTimeout(30000);
  await restored.goto(studio,{waitUntil:'domcontentloaded'});
  restored.once('dialog',d=>d.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'full-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await restored.locator('#message').filter({hasText:'통합 백업 복원 완료'}).waitFor();
  const after=await restored.evaluate(async()=>{
   const rows=await GulliverStudioStorage.official();
   const film=rows.find(x=>x.kind==='video'),sound=rows.find(x=>x.kind==='music');
   return {length:rows.length,video:await film.blob.text(),zip:Array.from(new Uint8Array(await sound.blob.slice(0,4).arrayBuffer()))};
  });
  assert.equal(after.length,2);assert.equal(after.video,json.toString());
  assert.deepEqual(after.zip,[80,75,3,4]);
  assert.deepEqual(errors,[],'Browser errors: '+errors.join(' | '));
  await next.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
