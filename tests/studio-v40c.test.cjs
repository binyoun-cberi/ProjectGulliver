'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js');
const V=require('../studio-unified-video.js');
const fs=require('node:fs');
const PHOTO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/bdoAAAAASUVORK5CYII=';

test('4.0-C preserves Korean style and source image through save/reload',()=>{
 const doc=C.starter('blank');
 const group=C.groupId();
 doc.pages[0].elements=[
  C.element('text',{id:'han',content:'우리 반\n세계 여러 나라',fontFamily:'serif',fontWeight:800,italic:true,underline:true,lineHeight:1.5,letterSpacing:2,groupId:group}),
  C.element('image',{id:'picture',src:PHOTO,mask:'circle',cropRect:{x:.2,y:.25,w:.5,h:.5},
   borderWidth:3,shadow:{color:'#335577',x:4,y:5,blur:8},opacity:.65,groupId:group})
 ];
 const saved=C.validate(JSON.parse(JSON.stringify(doc)));
 assert.equal(saved.format,'gulliver.unified.canvas.v1');
 assert.equal(saved.pages[0].elements[0].fontFamily,'serif');
 assert.equal(saved.pages[0].elements[0].fontWeight,800);
 assert.equal(saved.pages[0].elements[0].italic,true);
 assert.equal(saved.pages[0].elements[0].underline,true);
 assert.equal(saved.pages[0].elements[0].lineHeight,1.5);
 assert.equal(saved.pages[0].elements[0].letterSpacing,2);
 assert.equal(saved.pages[0].elements[1].src,PHOTO,'crop never mutates the uploaded pixels');
 assert.equal(saved.pages[0].elements[1].mask,'circle');
 assert.deepEqual(saved.pages[0].elements[1].cropRect,{x:.2,y:.25,w:.5,h:.5});
 assert.deepEqual(saved.pages[0].elements[1].shadow,{color:'#335577',blur:8,x:4,y:5});
 assert.equal(saved.pages[0].elements[1].groupId,group);
 assert.deepEqual(C.validate(saved),saved);
});
test('4.0-C normalizes hostile style inputs without breaking 3.x documents',()=>{
 const legacy=C.starter('presentation');
 const original=C.validate(legacy);
 assert.equal(original.pages[0].elements[0].borderWidth,undefined);
 const text=C.element('text',{id:'type',fontFamily:'serif;alert(1)',fontWeight:9999,letterSpacing:Infinity,
   lineHeight:-5,shadow:{color:'javascript:alert(1)',blur:99,x:-88,y:60}});
 const picture=C.element('image',{id:'photo',src:PHOTO,mask:'<svg>',cropRect:{x:1,y:-40,w:-3,h:Infinity},borderWidth:-1});
 const doc=C.starter('blank');doc.pages[0].elements=[text,picture];
 const safe=C.validate(doc),t=safe.pages[0].elements[0],p=safe.pages[0].elements[1];
 assert.equal(t.fontFamily,'sans');
 assert.equal(t.fontWeight,600);assert.equal(t.lineHeight,1);assert.equal(t.letterSpacing,0);
 assert.equal(t.shadow.color,'#334155');assert.equal(t.shadow.blur,25);assert.equal(t.shadow.x,-20);
 assert.equal(p.mask,undefined);assert.ok(p.cropRect.x>=0&&p.cropRect.y>=0);
 assert.equal(p.borderWidth,0);
 assert.ok(C.fontStack('sans').includes('Malgun Gothic'));
});
test('4.0-C crop geometry respects image aspect, focus and reset behavior',()=>{
 const original=C.element('image',{w:200,h:100,src:PHOTO});
 const contain=C.imageFrame(original,100,100);
 assert.deepEqual(contain,{x:50,y:0,w:100,h:100});
 const cover=C.imageFrame({...original,mask:'circle'},100,100);
 assert.deepEqual(cover,{x:0,y:-50,w:200,h:200});
 const crop=C.imageFrame({...original,mask:'circle',cropRect:{x:.5,y:0,w:.5,h:.5}},100,100);
 assert.deepEqual(crop,{x:-200,y:-100,w:400,h:400});
 const after=C.imageFrame({...original,mask:'circle'},100,100);
 assert.deepEqual(after,cover);
});
test('4.0-C video renderer uses source-safe crop, masks, text decorations and effect API',()=>{
 const doc=C.starter('blank');
 doc.pages[0].elements=[C.element('image',{id:'img',src:PHOTO,x:20,y:25,w:140,h:140,mask:'rounded',
  cropRect:{x:.1,y:.1,w:.5,h:.5},borderWidth:2,shadow:{color:'#334155',x:2,y:3,blur:6}}),
 C.element('text',{id:'label',x:100,y:200,w:280,h:70,content:'교실 꾸미기',underline:true,fontFamily:'rounded',fontWeight:700,letterSpacing:1})];
 const calls=[],context=new Proxy({canvas:{}},{get(target,key){
  if(key in target)return target[key];
  return (...args)=>{calls.push({key,args});if(key==='measureText')return{width:14}};
 },set(target,key,value){target[key]=value;return true;}});
 const project=C.validate(doc);
 V.drawFrame(context,project,1,new Map([[PHOTO,{width:100,height:100}]]));
 assert.ok(calls.some(c=>c.key==='roundRect'),'rounded crop applies a clipping path');
 assert.ok(calls.some(c=>c.key==='clip'));
 assert.ok(calls.some(c=>c.key==='drawImage'));
 assert.ok(calls.some(c=>c.key==='fillText'));
 assert.ok(calls.some(c=>c.key==='stroke'),'text underline and picture border render');
});
test('4.0-C editor keeps previous tools and publishes all focused controls',()=>{
 const page=fs.readFileSync('통합 캔버스.html','utf8');
 const code=fs.readFileSync('studio-unified-editor.js','utf8');
 for(const id of ['propertyFontFamily','propertyFontWeight','propertyItalic','propertyUnderline','propertyLineHeight',
  'propertyLetterSpacing','propertyCropZoom','propertyCropX','propertyCropY','propertyMask',
  'propertyShadowEnabled','propertyBorderWidth','resetImageCrop'])assert.ok(page.includes('id="'+id+'"'),id);
 for(const name of ['GulliverStudioAdapter','exportWebm','teacher','drawItem','cropSettings','fontStack'])
  assert.ok(code.includes(name),name);
});