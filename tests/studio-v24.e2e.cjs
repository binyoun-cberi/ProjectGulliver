'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8797,base='http://127.0.0.1:'+port+'/',url=base+encodeURIComponent('뚝딱 제작실.html');
const film=Buffer.from('{"filmcraft":"수업 활동","schema":15}'),sound=Buffer.from([80,75,3,4,1,2,3,4,5,6,7,8,9]);
async function serverReady(){
 for(let i=0;i<100;i++){try{if((await fetch(base+'studio-zip-core.js')).ok)return}catch{}
  await new Promise(r=>setTimeout(r,150))}
 throw Error('ZIP test server unavailable');
}
test('Chrome: ZIP native projects + WAV + image survive backup/restore and reject corrupt ZIP atomically',{timeout:165000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({acceptDownloads:true}),page=await ctx.newPage();
  page.setDefaultTimeout(30000);
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#officialImport').setInputFiles([
   {name:'수업 영상.fcproj',mimeType:'application/json',buffer:film},
   {name:'음악 세션.scraftz',mimeType:'application/zip',buffer:sound}
  ]);
  await page.locator('#officialProjectList .project-item').nth(1).waitFor();
  await page.evaluate(async()=>{
   await GulliverStudioStorage.saveMedia({id:'aud1',name:'수업 소리.wav',mime:'audio/wav',
    blob:new Blob([new Uint8Array([82,73,70,70,1,2,3,4,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,64,31,0,0,128,62,0,0,2,0,16,0,100,97,116,97,0,0,0,0])],{type:'audio/wav'}),createdAt:Date.now()});
   await GulliverStudioStorage.saveAsset({id:'image1',name:'수업 사진.png',mime:'image/png',
    blob:new Blob([new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4,5,6])],{type:'image/png'}),createdAt:Date.now()});
  });
  const exporting=page.waitForEvent('download',{timeout:80000});
  await page.locator('#libraryZipBackup').click();
  const exported=await exporting,pack=fs.readFileSync(await exported.path());
  assert.ok(exported.suggestedFilename().endsWith('.zip'));
  assert.ok(pack.subarray(0,4).equals(Buffer.from([80,75,3,4])));
  // The WAV and PNG bytes are stored as binary, not as long base64 strings.
  assert.ok(pack.includes(Buffer.from([137,80,78,71,13,10,26,10])));
  const other=await browser.newContext(),restored=await other.newPage();
  restored.setDefaultTimeout(30000);await restored.goto(url,{waitUntil:'domcontentloaded'});
  restored.once('dialog',d=>d.accept());
  await restored.locator('#libraryRestore').setInputFiles({name:'studio-backup.zip',mimeType:'application/zip',buffer:pack});
  await restored.locator('#message').filter({hasText:'통합 백업 복원 완료'}).waitFor();
  const state=await restored.evaluate(async()=>{
   const S=GulliverStudioStorage,official=await S.official(),assets=await S.assets(),media=await S.media();
   return {official:official.length,asset:assets.length,media:media.length,
    filmText:await official.find(x=>x.kind==='video').blob.text(),
    wav:media.some(x=>x.mime==='audio/wav'&&x.blob.size>40)};
  });
  assert.deepEqual(state,{official:2,asset:1,media:1,filmText:film.toString(),wav:true});
  const countBefore=await restored.evaluate(async()=>[await GulliverStudioStorage.official(),await GulliverStudioStorage.assets()].map(a=>a.length));
  const wrong=Buffer.from(pack),needle=Buffer.from([137,80,78,71,13,10,26,10]),pos=wrong.indexOf(needle);
  assert.ok(pos>0,'Expected original PNG bytes in ZIP');
  wrong[pos+4]^=255;
  await restored.locator('#libraryRestore').setInputFiles({name:'tampered.zip',mimeType:'application/zip',buffer:wrong});
  await restored.locator('#message').filter({hasText:'백업 복원 실패'}).waitFor();
  assert.deepEqual(await restored.evaluate(async()=>[await GulliverStudioStorage.official(),await GulliverStudioStorage.assets()].map(a=>a.length)),countBefore);
  assert.deepEqual(pageErrors,[]);
  await other.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('Chrome with mobile touch viewport: 25MiB SoundCraft uses OPFS or safe fallback, survives reopen',{timeout:160000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await serverReady();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(30000);await page.goto(url);
  const before=await page.evaluate(async()=>{
   const S=GulliverStudioStorage;
   const blob=new Blob([new Uint8Array([80,75,3,4]),new Uint8Array(25*1024*1024)],{type:'application/zip'});
   await S.saveOfficial({id:'native-big',kind:'music',name:'대용량.scraftz',title:'대용량',
    size:blob.size,blob,createdAt:Date.now(),updatedAt:Date.now(),folderId:''});
   const db=await S.open(),raw=await new Promise((res,rej)=>{
    const r=db.transaction('official').objectStore('official').get('native-big');
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
   });
   const got=await S.getOfficial('native-big'),info=await S.storageInfo();
   return {opfs:info.opfs,hasKey:!!raw.opfsKey,inline:!!raw.blob,byteLength:got.blob.size};
  });
  assert.equal(before.byteLength,25*1024*1024+4);
  if(before.opfs){assert.ok(before.hasKey,'Large files should use OPFS on supported browsers');assert.equal(before.inline,false)}
  else assert.equal(before.inline,true,'Fallback must keep the real original Blob in IndexedDB');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(async()=>(await GulliverStudioStorage.getOfficial('native-big')).blob.size),25*1024*1024+4);
  await page.locator('#storageRefresh').tap();
  await page.locator('#studioStorageInfo').filter({hasText:'공식 원본'}).waitFor();
  const zipDownload=page.waitForEvent('download',{timeout:80000});
  await page.locator('#libraryZipBackup').tap();
  const dl=await zipDownload,bytes=fs.statSync(await dl.path()).size;
  assert.ok(bytes>25*1024*1024);
  assert.ok(bytes<30*1024*1024,'ZIP should not base64 inflate the 25MiB file');
 }finally{await browser?.close();server.kill('SIGTERM')}
});
