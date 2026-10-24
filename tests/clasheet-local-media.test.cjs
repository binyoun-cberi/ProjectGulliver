'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
const core=require('../clasheet-local-media-core.js');
test('safe media formats, quotas and scene geometry',()=>{
 assert.equal(core.kind('image/png'),'image');assert.equal(core.kind('audio/wav'),'audio');
 assert.throws(()=>core.validateFile({name:'bad.exe',size:200,type:'application/javascript'}),/지원/);
 assert.throws(()=>core.validateFile({name:'huge.png',size:16000000,type:'image/png'}),/15MB/);
 assert.equal(core.cleanLayer({kind:'image',id:'z',assetId:'a',x:-40,y:999,w:960,h:540}).x,0);
 assert.equal(core.cleanScene({items:[null,{id:'x',kind:'text',text:'<script>',w:300,h:60}]}).items.length,1);
 assert.ok(fs.readFileSync('내 미디어.html','utf8').includes('브라우저에만 저장'));
});
test('Chrome saves real image bytes, edits layers and restores after reload',{timeout:120000},async()=>{
 const {chromium}=require('playwright-core');
 const server=spawn('python3',['-m','http.server','8998','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8998/내%20미디어.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('http://127.0.0.1:8998/'+encodeURIComponent('내 미디어.html'));
  await page.locator('#status').getByText(/브라우저에 저장/).waitFor();
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==','base64');
  await page.locator('#upload').setInputFiles({name:'수업사진.png',mimeType:'image/png',buffer:png});
  await page.locator('.asset').first().getByText('수업사진.png').waitFor();
  await page.locator('.asset-add').first().click();
  assert.equal(await page.locator('#stage .layer').count(),1);
  await page.locator('#stage .layer').first().focus();await page.keyboard.press('ArrowRight');
  const before=await page.evaluate(()=>ClasheetLocalMedia.state());
  assert.ok(before.scene.items[0].x>80);
  page.once('dialog',dlg=>dlg.accept('우리 수업'));
  await page.locator('#addText').click();
  assert.equal(await page.locator('#stage .layer').count(),2);
  await page.locator('#back').click();
  await page.reload();
  await page.locator('.asset').first().getByText('수업사진.png').waitFor();
  const after=await page.evaluate(()=>ClasheetLocalMedia.state());
  assert.equal(after.files.length,1);assert.equal(after.scene.items.length,2);
  assert.ok(after.scene.items.some(x=>x.kind==='text'&&x.text==='우리 수업'));
  assert.ok((await page.locator('#stage').evaluate(el=>el.scrollWidth-el.clientWidth))<=1);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
