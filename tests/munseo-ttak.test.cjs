'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../munseo-core.js');
test('유치원용 문서 템플릿 6종은 A4 편집 가능 데이터이다',()=>{
 for(const kind of ['notice','letter','lesson','record','meeting','blank']){
  const data=M.template(kind);
  assert.ok(data.title.length>0);
  assert.ok(data.blocks.length>0&&data.blocks.length<=90);
  assert.deepEqual(M.validate(data).blocks.map(b=>b.type),data.blocks.map(b=>b.type));
 }
});
test('학생 안내문 한글을 보존하고 불필요한 구조를 제거한다',()=>{
 const raw={title:'관찰기록',theme:'javascript:alert(1)',blocks:[
  {id:'external-id',type:'heading',text:'학생의 성장'},
  {id:'bad',type:'paragraph',text:'사랑해요 & 감사합니다',onclick:'evil'},
 ]};
 const doc=M.validate(raw);
 assert.equal(doc.theme,'blue');
 assert.equal(doc.blocks[0].text,'학생의 성장');
 assert.equal(doc.blocks[1].text,'사랑해요 & 감사합니다');
 assert.equal(doc.blocks[0].id,'item-0');
 assert.ok(!('onclick' in doc.blocks[1]));
});
test('빈 문서, 과도한 요소, 허용되지 않는 요소를 거부한다',()=>{
 assert.throws(()=>M.validate({blocks:[]}));
 assert.throws(()=>M.validate({blocks:Array.from({length:91},()=>({type:'paragraph'}))}));
 assert.throws(()=>M.validate({blocks:[{type:'iframe'}]}));
});
test('표는 1~25행, 1~5열로 제한한다',()=>{
 assert.throws(()=>M.validate({blocks:[{type:'table',rows:[]}]}));
 assert.throws(()=>M.validate({blocks:[{type:'table',rows:[['a','b','c','d','e','f']]}]}));
 const rows=[['항목','내용'],['놀이','도형']];
 assert.deepEqual(M.validate({blocks:[{type:'table',rows}]}).blocks[0].rows,rows);
});
test('외부 이미지 URL과 SVG 데이터 URL을 사용하지 않는다',()=>{
 assert.equal(M.safeImage('https://example.com/a.png'),'');
 assert.equal(M.safeImage('data:image/svg+xml;base64,PHN2Zz4='),'');
 assert.equal(M.safeImage('data:image/png;base64,AAAA'),'data:image/png;base64,AAAA');
 assert.equal(M.safeImage('data:image/jpeg;base64,AAAA'),'data:image/jpeg;base64,AAAA');
});
test('한국어 파일명과 경로 구분자 처리',()=>{
 assert.equal(M.filename('우리반: 가정통신문','docx'),'우리반_ 가정통신문.docx');
 assert.equal(M.filename('수업/관찰','json'),'수업_관찰.json');
});
