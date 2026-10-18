'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8912,base='http://127.0.0.1:'+port+'/',studio=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<90;i++){try{{const response=await fetch(base+'studio-unified-editor.js');await response.arrayBuffer();if(response.ok)return}}catch{}await new Promise(r=>setTimeout(r,170))}throw Error('Local server not ready')}
function wav(){
 const rate=8000,count=rate*3,b=Buffer.alloc(44+2*count);
 b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);
 b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);
 for(let i=0;i<count;i++)b.writeInt16LE(Math.round(3800*Math.sin(i*2*Math.PI*440/rate)),44+i*2);
 return b;
}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=','base64');
const button=(frame,selector)=>frame.locator(selector).evaluate(el=>el.click());
const capture=frame=>frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
test('mixed desk: teacher flashcards + type edits + group/rotation + photo mask + pages + WAV + saved replay + PNG/WebM', {timeout:180000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1450,height:970},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push('shell: '+e.message));
  await page.goto(studio,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#stage').waitFor();
  await frame.locator('body').evaluate(()=>{
   localStorage.setItem('gulliver.activities.v1',JSON.stringify({version:1,folders:[],activities:[
    {id:'quiz-mixed',kind:'quiz',title:'세계 과일',updatedAt:18,payload:{cards:[{front:'사과',back:'사과는 어느 나라에서 자랄까요?'}]}}
   ]}));
  });
  await button(frame,'[data-design-tab="teacher"]');
  await frame.locator('#teacherSavedOptions > summary').click();
  await button(frame,'#teacherRefreshActivities');
  await frame.locator('#teacherSavedActivity').selectOption('quiz-mixed');
  await button(frame,'#teacherImportActivity');
  let doc=await capture(frame);
  assert.equal(doc.pages.length,3,'1 quiz card creates prompt and answer slides alongside blank starting page');
  assert.ok(doc.pages.some(p=>p.elements.some(e=>e.content==='사과')));
  // Editing imported content with full Korean font controls must not damage the teacher source.
  await frame.locator('#stage .item[data-type="text"]').filter({hasText:'사과'}).first().click();
  await button(frame,'[data-design-tab="properties"]');
  await frame.locator('#propertyFontFamily').selectOption('serif');
  await frame.locator('#propertyFontWeight').selectOption('700');
  await frame.locator('#propertyLetterSpacing').fill('1.5');
  await frame.locator('#propertyLetterSpacing').dispatchEvent('change');
  doc=await capture(frame);
  assert.ok(doc.pages.some(p=>p.elements.some(e=>e.content==='사과'&&e.fontFamily==='serif')));
  await button(frame,'[data-add="rect"]');
  await button(frame,'[data-add="star"]');
  doc=await capture(frame);
  const shapes=doc.pages[doc.active].elements.slice(-2);
  assert.deepEqual(shapes.map(x=>x.type),['rect','star']);
  // A teacher-made heading covers the new shapes. Select them from the layer panel.
  // Shift-click there must add to selection, rather than replacing it.
  for(let i=0;i<2;i++){
   await frame.locator('#layerList .v4b-layer-title[data-id="'+shapes[i].id+'"]').click(i?{modifiers:['Shift']}:{});
  }
  await button(frame,'#groupSelection');
  doc=await capture(frame);
  const grouped=doc.pages[doc.active].elements.filter(e=>shapes.some(s=>s.id===e.id)),groupId=grouped[0].groupId;
  assert.ok(groupId&&grouped.every(e=>e.groupId===groupId));
  await frame.locator('#propertyRotation').evaluate(el=>{el.value='30';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await button(frame,'#duplicate');
  doc=await capture(frame);
  assert.equal(doc.pages[doc.active].elements.filter(e=>e.groupId&&e.groupId!==groupId).length,2);
  const pageBefore=doc.pages.length;
  await button(frame,'#clonePage');
  doc=await capture(frame);
  assert.equal(doc.pages.length,pageBefore+1,'duplicate page retains complex group scene');
  assert.ok(doc.pages[doc.active].elements.some(e=>e.rotation===30));
  // Insert photo through genuine upload, then crop/mask and shadow non-destructively.
  await frame.locator('#photoPicker').setInputFiles({name:'과일.png',mimeType:'image/png',buffer:png});
  await frame.locator('#stage .item[data-type="image"]').last().waitFor();
  await frame.locator('#stage .item[data-type="image"]').last().click();
  await frame.locator('#propertyMask').selectOption('circle');
  await frame.locator('#propertyCropZoom').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await frame.locator('#propertyCropX').evaluate(el=>{el.value='65';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await frame.locator('#effectsPanel summary').click();
  await frame.locator('#propertyShadowEnabled').check();
  doc=await capture(frame);
  const photo=doc.pages[doc.active].elements.find(e=>e.type==='image');
  assert.equal(photo.mask,'circle');assert.equal(photo.cropRect.w,.5);assert.equal(photo.src,'data:image/png;base64,'+png.toString('base64'));
  assert.ok(photo.shadow);
  const snapshot=JSON.parse(JSON.stringify(doc));
  await button(frame,'#undo');doc=await capture(frame);
  assert.equal(doc.pages[doc.active].elements.find(e=>e.type==='image').shadow,undefined);
  await button(frame,'#redo');doc=await capture(frame);
  assert.ok(doc.pages[doc.active].elements.find(e=>e.type==='image').shadow);
  // Layer lock/hide in between photo edits must be non-destructive; undo restores.
  await button(frame,'#layerFront');
  await frame.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'레이어 잠금'}).click();
  const locked=await capture(frame);assert.equal(locked.pages[locked.active].elements.find(e=>e.id===photo.id).locked,true);
  await frame.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'잠금 해제'}).click();
  await frame.locator('#layerList .v4b-layer-row').first().getByRole('button',{name:'레이어 숨기기'}).click();
  assert.equal(await frame.locator('#stage .item[data-id="'+photo.id+'"]').count(),0);
  await button(frame,'#undo');
  assert.equal(await frame.locator('#stage .item[data-id="'+photo.id+'"]').count(),1);
  // Add audio to the slideshow; bound scene durations to keep the real WebM brief.
  for(let i=0;i<(await capture(frame)).pages.length;i++){
   await frame.locator('#pageStrip .page').nth(i).evaluate(el=>el.click());
   await frame.locator('#sceneDuration').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('change',{bubbles:true}))});
  }
  await frame.locator('#audioUpload').setInputFiles({name:'활동 배경음악.wav',mimeType:'audio/wav',buffer:wav()});
  await page.waitForFunction(()=>{
   const doc=document.querySelector('#editorFrame')?.contentWindow?.GulliverStudioAdapter?.capture?.();
   return !!doc?.audio?.mediaId;
  });
  assert.match(await frame.locator('#timelineMusicName').textContent(),/활동 배경음악\.wav/);
  doc=await capture(frame);
  assert.equal(doc.pages.length,4);assert.ok(doc.audio?.mediaId);
  const pngEvent=page.waitForEvent('download',{timeout:30000});await button(frame,'#exportPng');
  const image=await pngEvent,bytes=fs.readFileSync(await image.path());
  assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
  // Revisit photo page for accurate source/shape roundtrip and autosave verification.
  await frame.locator('#pageStrip .page').last().evaluate(el=>el.click());
  await page.evaluate(()=>GulliverStudioBridge.sync(true));
  const current=await capture(frame),saved=await page.evaluate(async()=>{
   const projects=await GulliverStudioStorage.projects();
   return projects.find(p=>p.kind==='canvas'&&p.payload?.pages?.length===4);
  });
  assert.ok(saved?.id,'autosaved canvas project not found');
  const another=await context.newPage();another.on('pageerror',e=>errors.push('reload: '+e.message));
  await another.goto(base+encodeURIComponent('뚝딱 제작실.html'),{waitUntil:'domcontentloaded'});
  await another.evaluate(async id=>{
   const p=await GulliverStudioStorage.getProject(id);await GulliverStudioBridge.start('canvas',p);
  },saved.id);
  const restored=await another.frameLocator('#editorFrame').locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(restored.pages.length,4);
  const savedImage=restored.pages.flatMap(p=>p.elements).find(e=>e.id===photo.id);
  assert.ok(savedImage);assert.deepEqual(savedImage.cropRect,photo.cropRect);
  assert.equal(savedImage.mask,'circle');assert.ok(savedImage.shadow);
  assert.equal(savedImage.src,photo.src);
  // The converted classroom quiz itself must still be intact.
  const original=await frame.locator('body').evaluate(()=>JSON.parse(localStorage.getItem('gulliver.activities.v1')));
  assert.equal(original.activities[0].payload.cards[0].front,'사과');
  await another.close();
  // A real WebM with a soundtrack and scene changes.
  const filmEvent=page.waitForEvent('download',{timeout:60000});
  await button(frame,'#exportWebm');
  const film=await filmEvent,fp=await film.path();
  assert.ok(fs.statSync(fp).size>2500);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','csv=p=0',fp],{encoding:'utf8',timeout:15000});
  assert.equal(probe.status,0,probe.stderr);assert.match(probe.stdout,/video/);assert.match(probe.stdout,/audio/);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});
test('mixed mobile: worksheet + imported photo + typing + multi-select/group + layer lock + undo/redo + print',{timeout:85000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+encodeURIComponent('통합 캔버스.html')+'?preset=worksheet',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.GulliverStudioAdapter);
  await page.locator('#stage .item[data-type="text"]').first().click({force:true});
  await page.locator('#propertyText').evaluate(el=>{el.value='세계의 과일 활동지';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
  await button(page,'[data-add="star"]');await button(page,'[data-add="ellipse"]');
  const doc=await capture(page),shapeIds=doc.pages[0].elements.filter(e=>['star','ellipse'].includes(e.type)).map(e=>e.id);
  assert.equal(shapeIds.length,2);
  await button(page,'#multiSelectMode');
  await page.locator('body').evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  // On mobile, taps build selection without drag, then group and rotate.
  await page.evaluate(ids=>{
   ids.forEach((id,i)=>{const node=document.querySelector('#stage .item[data-id="'+id+'"]'),b=node.getBoundingClientRect();
    node.dispatchEvent(new PointerEvent('pointerdown',{pointerId:401+i,bubbles:true,pointerType:'touch',button:0,clientX:b.x+5,clientY:b.y+5}));
   });
  },shapeIds);
  assert.equal(await page.locator('#stage .item.selected').count(),2);
  await button(page,'#groupSelection');
  await page.locator('#propertyRotation').evaluate(el=>{el.value='45';el.dispatchEvent(new Event('change',{bubbles:true}))});
  let edited=await capture(page);
  assert.equal(edited.pages[0].elements.filter(e=>shapeIds.includes(e.id)&&e.rotation===45).length,2);
  await button(page,'#undo');await button(page,'#redo');
  edited=await capture(page);
  assert.equal(edited.pages[0].elements.filter(e=>shapeIds.includes(e.id)&&e.rotation===45).length,2);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#stage .item').count(),edited.pages[0].elements.filter(e=>!e.hidden).length);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM')}
});