'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../munseo-core.js');
const H=require('../munseo-hwpx-core.js');

test('교사용 6개 문서 틀을 HWPX용 의미 있는 HTML로 변환',()=>{
 for(const template of ['notice','letter','lesson','record','meeting','blank']){
  const doc=C.validate(C.template(template));
  const html=H.toHtml(doc);
  assert.ok(html.startsWith('<!doctype html><html lang="ko">'));
  assert.ok(html.includes('<h1>'+doc.title+'</h1>'));
  assert.ok(html.includes('</body></html>'));
 }
});
test('가정통신문과 관찰기록의 제목·한글 본문·표가 포함됨',()=>{
 const notice=H.toHtml(C.template('notice'));
 const record=H.toHtml(C.template('record'));
 assert.ok(notice.includes('가정통신문'));
 assert.ok(notice.includes('<table><tbody>'));
 assert.ok(notice.includes('<th>구분</th>'));
 assert.ok(record.includes('관찰 내용'));
});
test('붙여넣은 HTML/XSS 문자열을 반드시 escape',()=>{
 const doc=C.template('blank');
 doc.title='알림 <script>alert("hi")</script>';
 doc.blocks=[
  {type:'heading',text:'놀이 & 배움'},
  {type:'paragraph',text:'<img onerror="alert(1)">\n감사합니다'},
  {type:'table',rows:[['열1','열2'],['<script>','\" 특수문자']]},
  {type:'list',text:'활동 A\n<iframe>\n활동 B'}
 ];
 const html=H.toHtml(C.validate(doc));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<iframe>'));
 assert.ok(!html.includes('<img onerror'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('놀이 &amp; 배움'));
 assert.ok(html.includes('감사합니다'));
});
test('이미지는 PNG/JPG 데이터 URI만 변환',()=>{
 const doc=C.template('blank');
 doc.blocks=[{type:'image',src:'https://school.example/secret.png',caption:'우리 반'}];
 assert.ok(!H.toHtml(doc).includes('<img'));
 doc.blocks[0].src='data:image/png;base64,aGVsbG8=';
 const html=H.toHtml(doc);
 assert.ok(html.includes('<img src="data:image/png;base64,aGVsbG8="'));
 assert.ok(html.includes('우리 반'));
});
test('문서 모델 없이 변환을 호출하면 오류',()=>{
 assert.throws(()=>H.toHtml(null));
 assert.throws(()=>H.toHtml({blocks:'bad'}));
});
