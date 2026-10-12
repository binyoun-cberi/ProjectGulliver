'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../balpyo-core.js');

test('교사용 발표 템플릿은 모두 1~40장이고 한글 기본값을 제공한다',()=>{
 for(const k of ['lesson','picture','quiz','routine','blank']){
  const deck=C.starter(k);
  assert.ok(deck.slides.length>=1&&deck.slides.length<=40);
  assert.ok(deck.slides.every(s=>C.LAYOUTS.includes(s.layout)&&s.id));
  assert.equal(deck.theme,'sky');
  assert.ok(deck.slides[0].title.length>0);
 }
});
test('불러오기: 텍스트 길이와 임의 필드를 제한한다',()=>{
 const raw={title:'제목'.repeat(150),theme:'javascript:bad',slides:[{id:'x',layout:'iframe',title:'안녕'.repeat(200),body:'몸'.repeat(1900),notes:'메모'.repeat(2200),image:'https://evil.example/image'}]};
 const parsed=C.validateDeck(raw);
 assert.equal(parsed.theme,'sky');
 assert.equal(parsed.slides[0].layout,'content');
 assert.equal(parsed.slides[0].image,'');
 assert.ok(parsed.slides[0].title.length<=170&&parsed.slides[0].body.length<=1400);
 assert.ok(parsed.slides[0].notes.length<=2000);
 assert.notEqual(parsed.slides[0].id,'x');
 assert.equal(parsed.title.length,90);
});
test('슬라이드는 40장까지 허용하며 빈 배열/임의 구조를 거절',()=>{
 assert.throws(()=>C.validateDeck({slides:[]}));
 assert.throws(()=>C.validateDeck({slides:Array.from({length:41},()=>({layout:'content'}))}));
 assert.throws(()=>C.validateDeck({slides:'bad'}));
});
test('이미지 입력은 제한된 데이터 URL만 허용',()=>{
 assert.equal(C.imageSafe('https://example.com/x.png'),'');
 assert.equal(C.imageSafe('data:image/svg+xml;base64,AAAA'),'');
 assert.equal(C.imageSafe('data:image/png;base64,AAAA'),'data:image/png;base64,AAAA');
 assert.equal(C.imageSafe('data:image/jpeg;base64,AAAA'),'data:image/jpeg;base64,AAAA');
});
test('PPTX/JSON 저장 파일 이름을 정리한다',()=>{
 assert.equal(C.filename('우리 반: 과학/수업','pptx'),'우리 반_ 과학_수업.pptx');
 assert.equal(C.filename('발표','json'),'발표.json');
});
test('내용 목록은 빈 줄을 제거하고 항목을 제한한다',()=>{
 const list=C.lines('첫 번째\n\n 두 번째 \n세 번째');
 assert.deepEqual(list,['첫 번째','두 번째','세 번째']);
});
