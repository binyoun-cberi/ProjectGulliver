'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../doan-core.js');

test('교실 도안 6개는 인쇄할 수 있는 A4 한 페이지 자료',()=>{
 for(const name of ['vocabulary','emotion','schedule','name','geometry','blank']){
   const p=D.makeTemplate(name);
   assert.equal(p.size,'A4');
   assert.ok(p.objects.length<=200);
   assert.match(D.svg(p),/width="210mm"/);
   assert.match(D.svg(p),/height="297mm"/);
 }
});
test('템플릿별 도형 수와 요소 중복 ID 없음',()=>{
 for(const kind of ['vocabulary','emotion','schedule','name','geometry','blank']){
   const ids=D.makeTemplate(kind).objects.map(o=>o.id);
   assert.equal(ids.length,new Set(ids).size);
 }
});
test('한글 텍스트를 XML으로 보존하고 위험한 문자열은 이스케이프',()=>{
 const p=D.makeTemplate('blank');
 p.objects.push(D.text(30,160,300,50,'안녕하세요 <script>alert("x")</script> & 마음',20));
 const xml=D.svg(p);
 assert.match(xml,/안녕하세요/);
 assert.ok(xml.includes('&lt;script&gt;'));
 assert.ok(!xml.includes('<script>'));
 assert.ok(xml.includes('&amp; 마음'));
});
test('불러오기 파일의 HTML, 외부 색상 값, 임의 유형은 제한',()=>{
 const p=D.makeTemplate('blank');
 p.objects=[{id:'evil',type:'text',x:10,y:20,w:180,h:80,text:'<img src=x onerror=alert(1)>',fill:'url(javascript:bad)'}];
 const loaded=D.validateProject(p);
 assert.equal(loaded.objects[0].fill,'#26384f');
 assert.notEqual(loaded.objects[0].id,'evil');
 assert.ok(!D.svg(loaded).includes('<img'));
 assert.throws(()=>D.validateProject({objects:[{type:'iframe'}]}));
});
test('도형은 200개까지만 불러올 수 있음',()=>{
 assert.throws(()=>D.validateProject({objects:Array.from({length:201},()=>({type:'rect'}))}));
});
test('A4 기본 SVG가 브라우저 독립적인 외부 참조 없는 파일',()=>{
 const p=D.makeTemplate('name'),x=D.svg(p);
 assert.ok(x.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(!x.includes('http://')||x.indexOf('http://www.w3.org/2000/svg')===12);
 assert.ok(x.includes('data-shape='));
});
