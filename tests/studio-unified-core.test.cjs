'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Core=require('../studio-unified-core.js'),Studio=require('../studio-core.js');
test('3.0 starter and editable pages survive strict normalization',()=>{
 const value=Core.starter('presentation');
 assert.equal(value.layout,'wide');assert.equal(value.pages.length,1);
 assert.equal(value.pages[0].elements.filter(e=>e.type==='text').length,2);
 const cleaned=Core.validate(value);
 assert.equal(cleaned.format,Core.FORMAT);
 const packed=Studio.normalizeProject({id:'unified-1',kind:'canvas',title:'우리반',payload:cleaned});
 assert.equal(packed.kind,'canvas');
 assert.equal(Studio.detectLegacy(cleaned),'canvas');
 assert.equal(Studio.detectLegacy({slides:[]}),'slides','preserve original formats');
});
test('3.0 converts existing design into separately editable text and geometry',()=>{
 const legacy={title:'도형 그림카드',size:'A4',objects:[
  {id:'x',type:'text',x:30,y:35,w:220,h:70,text:'마음 카드',fontSize:34,fill:'#335577'},
  {id:'y',type:'ellipse',x:80,y:140,w:100,h:100,fill:'#ffe6a3',stroke:'#334455'}
 ]};
 const original=JSON.stringify(legacy),value=Core.fromLegacy('design',legacy);
 assert.equal(value.layout,'a4');assert.equal(value.pages[0].elements[0].content,'마음 카드');
 assert.equal(value.pages[0].elements[1].type,'ellipse');
 assert.equal(JSON.stringify(legacy),original,'source must not be mutated');
 assert.throws(()=>Core.fromLegacy('music',legacy),/도안·발표/);
});
test('3.0 converts slide strings and photos into distinct editable objects per page',()=>{
 const source={title:'세계 여러 나라',theme:'mint',slides:[
  {title:'오늘의 나라',body:'한국\n일본',eyebrow:'소개'},
  {title:'복습',body:'어느 나라일까요?'}
 ]};
 const converted=Core.fromLegacy('slides',source);
 assert.equal(converted.pages.length,2);assert.equal(converted.layout,'wide');
 assert.equal(converted.pages[0].elements.find(x=>x.id==='slide-0-title').content,'오늘의 나라');
 assert.equal(converted.pages[1].elements.find(x=>x.id==='slide-1-title').content,'복습');
 assert.throws(()=>Core.fromLegacy('slides',{slides:[]}),/확인/);
});
test('3.0 protects canvas schema, limits, and image data from invalid content',()=>{
 const value=Core.starter('blank');
 value.pages[0].elements.push(Core.element('image',{src:'https://evil.invalid/image.png'}));
 assert.throws(()=>Core.validate(value),/이미지/);
 value.pages[0].elements.pop();
 value.pages[0].elements=new Array(151).fill(0).map((_,i)=>Core.element('rect',{id:'rect-'+i}));
 assert.throws(()=>Core.validate(value),/요소/);
 value.pages[0].elements=[Core.element('text',{content:'<script>alert(1)</script>'})];
 assert.match(Core.validate(value).pages[0].elements[0].content,/script/);
 assert.throws(()=>Core.validate({...value,pages:[]}),/페이지/);
});
test('3.0 unified canvas registers as a managed workspace without removing old tools',()=>{
 const html=fs.readFileSync('뚝딱 제작실.html','utf8'),app=fs.readFileSync('studio-app.js','utf8');
 for(const kind of ['canvas','design','slides','document','video','music','pdf','picture'])
  assert.ok(Studio.TOOLS[kind],kind);
 assert.match(html,/studio-unified-core\.js/);
 assert.match(app,/importIntoCanvas/);
 assert.match(app,/통합에서 편집/);
 const editor=fs.readFileSync('studio-unified-editor.js','utf8');
 for(const expected of ['pointerdown','pointermove','exportImage','exportSlides','requestFullscreen','undoStack','pagePng'])
  assert.ok(editor.includes(expected),expected);
});
test('teacher name tags split into printable editable A4 pages',()=>{
 const names=Array.from({length:10},(_,i)=>'학생 '+(i+1));
 const project=Core.nameTags(names,4);
 assert.equal(project.layout,'a4');assert.equal(project.pages.length,3);
 assert.equal(project.pages[0].elements.length,12);
 assert.equal(project.pages[2].elements.length,6);
 assert.deepEqual(project.pages.flatMap(page=>page.elements.filter(item=>item.type==='text'&&item.content.startsWith('학생 ')).map(item=>item.content)),names);
 assert.equal(new Set(project.pages.flatMap(page=>page.elements.map(item=>item.id))).size,30);
 assert.throws(()=>Core.nameTags(Array(321).fill('이름'),8),/최대/);
});
