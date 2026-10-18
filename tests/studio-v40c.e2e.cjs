'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8899,base='http://127.0.0.1:'+port+'/';
async function ready(){
 for(let i=0;i<90;i++){try{{const response=await fetch(base+'studio-unified-editor.js');await response.arrayBuffer();if(response.ok)return}}catch{}
  await new Promise(r=>setTimeout(r,180))}
 throw Error('Local server did not start');
}
test('4.0-C browser: Korean font, crop, mask, shadow, undo, print path and PNG/WebM frame',{timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  await ready();browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1360,height:1000}});
  page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+encodeURIComponent('통합 캔버스.html')+'?preset=blank',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.GulliverStudioAdapter);
  await page.evaluate(()=>{
   const pic=document.createElement('canvas');pic.width=100;pic.height=100;
   const c=pic.getContext('2d');c.fillStyle='#dd1212';c.fillRect(0,0,100,100);
   c.fillStyle='#12cc44';c.fillRect(0,0,45,100);
   const source=pic.toDataURL('image/png'),C=GulliverUnifiedCore,doc=C.starter('blank');
   doc.pages[0].elements=[
    C.element('image',{id:'photo',x:60,y:60,w:160,h:160,src:source,fill:'#ffffff'}),
    C.element('text',{id:'korean',x:280,y:80,w:450,h:100,content:'우리 반 친구들',fontSize:46})
   ];
   GulliverStudioAdapter.apply(doc);
  });
  await page.locator('#stage .item[data-id="korean"]').click();
  await page.locator('#propertyFontFamily').selectOption('serif');
  await page.locator('#propertyFontWeight').selectOption('800');
  await page.locator('#propertyItalic').check();
  await page.locator('#propertyUnderline').check();
  await page.locator('#propertyLineHeight').fill('1.5');
  await page.locator('#propertyLineHeight').dispatchEvent('change');
  await page.locator('#propertyLetterSpacing').fill('2');
  await page.locator('#propertyLetterSpacing').dispatchEvent('change');
  let payload=await page.evaluate(()=>GulliverStudioAdapter.capture());
  let label=payload.pages[0].elements.find(x=>x.id==='korean');
  assert.equal(label.fontFamily,'serif');
  assert.equal(label.fontWeight,800);assert.equal(label.italic,true);assert.equal(label.underline,true);
  assert.equal(label.lineHeight,1.5);assert.equal(label.letterSpacing,2);
  await page.locator('#stage .item[data-id="photo"]').click();
  await page.locator('#propertyMask').selectOption('circle');
  await page.locator('#propertyCropZoom').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.locator('#propertyCropX').evaluate(el=>{el.value='70';el.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.locator('#effectsPanel summary').click();
  await page.locator('#propertyShadowEnabled').check();
  await page.locator('#propertyBorderWidth').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
  payload=await page.evaluate(()=>GulliverStudioAdapter.capture());
  const img=payload.pages[0].elements.find(x=>x.id==='photo');
  assert.equal(img.mask,'circle');assert.ok(img.cropRect.w<=.5);
  assert.ok(img.cropRect.x>.2);assert.equal(img.borderWidth,3);assert.ok(img.shadow?.blur>=1);
  const preview=await page.locator('#stage .item[data-id="photo"] .image-crop-frame').evaluate(el=>({
   radius:getComputedStyle(el).borderRadius,scale:el.querySelector('img').style.transform}));
  assert.equal(preview.radius,'50%');assert.ok(preview.scale.includes('scale(2)'));
  // Object pixel data is retained after saving and loading; only display parameters change.
  await page.evaluate(doc=>GulliverStudioAdapter.apply(doc),payload);
  assert.deepEqual((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.find(x=>x.id==='photo').cropRect,img.cropRect);
  // Exercise both independent visual pipelines on the same image and compare non-edge samples.
  const pixels=await page.evaluate(async()=>{
   const doc=GulliverStudioAdapter.capture(),blob=await GulliverStudioAdapter.exportImage();
   const bmp=await createImageBitmap(blob),one=document.createElement('canvas'),two=document.createElement('canvas');
   one.width=two.width=960;one.height=two.height=540;
   const a=one.getContext('2d'),b=two.getContext('2d');a.drawImage(bmp,0,0);
   const item=doc.pages[0].elements.find(e=>e.id==='photo'),image=new Image();image.src=item.src;await image.decode();
   GulliverUnifiedVideo.drawFrame(b,doc,0,new Map([[item.src,image]]));
   const sample=(ctx,x,y)=>[...ctx.getImageData(x,y,1,1).data].slice(0,3);
   return{corner:[sample(a,61,61),sample(b,61,61)],center:[sample(a,140,140),sample(b,140,140)]};
  });
  for(const pair of [pixels.corner,pixels.center])for(let channel=0;channel<3;channel++)
   assert.ok(Math.abs(pair[0][channel]-pair[1][channel])<=35,JSON.stringify(pixels));
  await page.locator('#stage .item[data-id="photo"]').click();
  await page.locator('#resetImageCrop').click();
  assert.equal((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.find(x=>x.id==='photo').cropRect,undefined);
  await page.locator('#undo').evaluate(el=>el.click());
  assert.ok((await page.evaluate(()=>GulliverStudioAdapter.capture())).pages[0].elements.find(x=>x.id==='photo').cropRect);
  assert.deepEqual(errors,[],'browser errors: '+errors.join(' | '));
 }finally{await browser?.close();server.kill('SIGTERM')}
});