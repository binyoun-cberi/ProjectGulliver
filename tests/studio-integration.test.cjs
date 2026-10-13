'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../studio-core.js');
const D=require('../doan-core.js');
const B=require('../balpyo-core.js');
const M=require('../munseo-core.js');

test('통합 제작실 여덟 모드는 모두 로컬 HTML 진입점을 가진다',()=>{
 const expected=['canvas','picture','pdf','design','slides','document','video','music'];
 assert.deepEqual(C.types(),expected);
 for(const kind of expected){
  const def=C.TOOLS[kind];
  assert.ok(def.name&&def.label&&def.href);
  assert.ok(fs.existsSync(def.href));
  assert.equal(def.href.startsWith('http'),false);
 }
 assert.equal(C.managed('canvas'),true);
 assert.equal(C.managed('design'),true);
 assert.equal(C.managed('slides'),true);
 assert.equal(C.managed('document'),true);
 assert.equal(C.managed('video'),true);
 assert.equal(C.managed('music'),true);
 assert.equal(C.managed('pdf'),false);
 assert.equal(C.managed('picture'),false);
});
test('기존 도안·발표·문서 JSON 프로젝트를 자동 인식하고 유형 충돌 차단',()=>{
 const fixtures=[['design',D.makeTemplate('emotion')],['slides',B.starter('quiz')],['document',M.template('notice')]];
 for(const [kind,payload] of fixtures){
  assert.equal(C.detectLegacy(payload),kind);
  const project=C.normalizeProject({id:'test-'+kind,kind,title:payload.title,payload,createdAt:1,updatedAt:2});
  assert.equal(project.payload.title,payload.title);
  assert.equal(project.kind,kind);
  assert.throws(()=>C.normalizeProject({kind:'pdf',payload}),/지원하지/);
 }
 assert.throws(()=>C.normalizeProject({kind:'design',payload:B.starter('lesson')}),/일치하지/);
});
test('개인정보가 있을 수 있는 프로젝트 제목 정리와 사진 업로드 제한',()=>{
 assert.equal(C.safeTitle('  활동\n기록  '),'활동 기록');
 assert.equal(C.safeTitle('', '수업자료'),'수업자료');
 assert.ok(C.recognizeAsset({name:'x.png',type:'image/png',size:500}));
 assert.ok(C.recognizeAsset({name:'x.jpg',type:'image/jpeg',size:2000000}));
 assert.equal(C.recognizeAsset({type:'image/svg+xml',size:120}),false);
 assert.equal(C.recognizeAsset({type:'image/png',size:2000001}),false);
 assert.equal(C.recognizeAsset({type:'image/png',size:0}),false);
});
test('도안에 넣은 PNG/JPEG가 SVG와 원본에 유지됨',()=>{
 const uri='data:image/png;base64,aGVsbG8=';
 const d=D.makeTemplate('blank');
 d.objects.push(D.imageShape(40,100,160,120,uri));
 const output=D.svg(d);
 assert.ok(output.includes('<image '));
 assert.ok(output.includes('href="'+uri+'"'));
 assert.ok(output.includes('preserveAspectRatio="xMidYMid meet"'));
 const restored=D.validateProject(d);
 assert.equal(restored.objects[restored.objects.length-1].src,uri);
});
test('도안으로 유해한 SVG/외부 URL을 가져오는 것을 차단',()=>{
 const d=D.makeTemplate('blank');
 d.objects.push({type:'image',x:0,y:0,w:100,h:100,src:'https://unknown.example/secret.png'});
 assert.throws(()=>D.validateProject(d));
 d.objects[0].src='data:image/svg+xml;base64,PHN2Zz4=';
 assert.throws(()=>D.validateProject(d));
});
test('홈에는 제작실 한 개만 노출하고 예전 다섯 개 편집 URL은 유지',()=>{
 const code=fs.readFileSync('tools-catalog.js','utf8');
 const toolCount=(code.slice(0,code.indexOf(']; const purposes=[')).match(/\bname\s*:/g)||[]).length;
 const categoryCount=(code.slice(code.indexOf('const purposes=['),code.indexOf('];tools.forEach')).match(/"[^"]+"/g)||[]).length;
 assert.equal(toolCount,categoryCount);
 assert.equal((code.match(/href:"뚝딱 제작실.html"/g)||[]).length,1);
 for(const name of ['그림 뚝딱','PDF 뚝딱','도안 뚝딱','발표 뚝딱','문서 뚝딱']){
  assert.ok(fs.existsSync(name+'.html'));
  assert.ok(code.includes('href:"'+name+'.html"'),'즐겨찾기 호환을 위해 기존 URL 유지: '+name);
 }
});
test('통합 화면의 JS 버튼과 폼 id를 선언',()=>{
 const html=fs.readFileSync('뚝딱 제작실.html','utf8');
 const code=fs.readFileSync('studio-app.js','utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const refs=[...code.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(refs.filter(id=>!ids.has(id)))],[]);
 for(const id of ['toolNav','editorFrame','projectList','assetList','manualSave','assetUpload','importProject'])
  assert.ok(ids.has(id));
});
test('도안·발표·문서는 통합 작업 저장 API 제공, 독립 저장 유지',()=>{
 for(const [path,kind] of [['doan-ttak.js','design'],['balpyo-ttak.js','slides'],['munseo-ttak.js','document']]){
  const code=fs.readFileSync(path,'utf8');
  assert.ok(code.includes("kind:'"+kind+"'"));
  assert.ok(code.includes('GulliverStudioAdapter'));
  assert.ok(code.includes('beforeunload'));
 }
});

test('1.2 공통 팔레트와 속성 도구는 실제 HTML 버튼/입력과 연동',()=>{
 const html=fs.readFileSync('뚝딱 제작실.html','utf8');
 const code=fs.readFileSync('studio-layout.js','utf8');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 const refs=[...code.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]);
 assert.deepEqual([...new Set(refs.filter(x=>!ids.has(x)))],[]);
 for(const id of ['studioPalette','templateList','insertList','pageList','inspectorProperties','inspectorFields','studioQuickBar','openPalette','openInspector','drawerShade'])
  assert.ok(ids.has(id),'공통 화면 컨트롤 누락: '+id);
 assert.ok(code.includes('native.dispatchEvent'));
 assert.ok(code.includes('studio-v12-embedded-style'));
 assert.ok(code.includes('setRight(\'properties\')'));
});
test('1.2 개별 저장·발표 버튼은 공통 툴바에서 원래 구현을 호출',()=>{
 const code=fs.readFileSync('studio-layout.js','utf8');
 const expected={
  '도안 뚝딱.html':['undo','redo','exportSvg','exportPng','print'],
  '발표 뚝딱.html':['previous','next','present','exportPptx','printDeck'],
  '문서 뚝딱.html':['undo','redo','saveHwpx','saveDocx','savePdf']
 };
 for(const [file,controls] of Object.entries(expected)){
  const html=fs.readFileSync(file,'utf8');
  for(const id of controls){
   assert.ok(html.includes('id="'+id+'"'),file+': '+id);
   assert.ok(code.includes("'"+id+"'"),'공통 툴바의 네이티브 버튼 연결 누락: '+id);
  }
 }
 assert.ok(code.includes('target.click()'),'기존 버튼이 직접 실행되어야 함');
});
