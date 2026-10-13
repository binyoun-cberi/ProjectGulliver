'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const T=require('../studio-transfer-core.js');

test('공유 대상은 이미지를 지원하는 제작실로만 제한한다',()=>{
 assert.deepEqual(T.destinations('design'),['slides','document','pdf']);
 assert.deepEqual(T.destinations('slides'),['design','document','pdf']);
 assert.deepEqual(T.destinations('document'),[]);
 assert.deepEqual(T.destinations('pdf'),[]);
 assert.deepEqual(T.destinations('picture'),[]);
 for(const kind of T.destinations('design'))assert.equal(T.safeHandoff('design',kind).target,kind);
 assert.throws(()=>T.safeHandoff('document','pdf'),/전달/);
 assert.throws(()=>T.safeHandoff('design','design'),/전달/);
});
test('공유 파일명 정리 및 각 제작기 사진 제한을 유지',()=>{
 assert.equal(T.imageFilename('학급: 도안'),'학급_ 도안.png');
 assert.equal(T.imageFilename('우리/발표','jpeg'),'우리_발표.jpg');
 assert.equal(T.validImage({type:'image/png',size:2000000}),true);
 assert.equal(T.validImage({type:'image/jpeg',size:2000001}),false);
 assert.equal(T.validImage({type:'image/svg+xml',size:1000}),false);
});
test('이미지 전달은 원본 제작기의 검증된 어댑터와 기존 PDFLib 기능 연결',()=>{
 const doan=fs.readFileSync('doan-ttak.js','utf8');
 const slides=fs.readFileSync('balpyo-ttak.js','utf8');
 const pdf=fs.readFileSync('pdf-ttak.js','utf8');
 const app=fs.readFileSync('studio-app.js','utf8');
 const html=fs.readFileSync('뚝딱 제작실.html','utf8');
 assert.match(doan,/exportImage:exportDesignImage/);
 assert.match(slides,/exportImage:exportSlideImage/);
 assert.match(pdf,/insertImagePdf/);
 assert.match(pdf,/PDF\.PDFDocument\.create\(\)/);
 assert.match(app,/await adapter\.insertImage\(file\)/);
 assert.match(app,/await adapter\.insertImagePdf\(/);
 assert.match(app,/await S\.saveAsset\(asset\)/);
 for(const id of ['transferTarget','transferBar','sendToTool','saveImageToShelf','docPdfGuide'])
  assert.ok(html.includes('id="'+id+'"'),id);
});
