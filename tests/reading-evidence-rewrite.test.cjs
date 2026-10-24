'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../daily-worksheet-core.js');

function findGroup(grade,type,title,responseFormat='choice'){
 for(let seed=1;seed<=100;seed++){
  const sheet=C.generate({subject:'korean',topic:'reading-set',grade,type,count:5,seed,responseFormat});
  if(sheet.items[0].readingTitle===title)return sheet.items;
 }
 throw Error('Unreachable passage: '+title);
}
test('rewritten passages are reachable in their grade bands, with complete answer keys',()=>{
 for(const [grade,type,title] of [
  [2,'reading-set-literary','작은 우산의 자리'],[2,'reading-set-nonfiction','책은 어떻게 찾을까'],
  [4,'reading-set-literary','비를 기다리는 돌계단'],[6,'reading-set-literary','고쳐 쓰지 않은 편지'],
  [6,'reading-set-nonfiction','도시가 더 뜨거운 까닭'],[6,'reading-set-nonfiction','빵 한 개의 이동']
 ]){
  const items=findGroup(grade,type,title);
  assert.equal(items.length,5);
  assert.equal(items.filter(q=>q.readingPassage).length,1);
  for(const q of items){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>20);
  }
  const essays=findGroup(grade,type,title,'essay');
  for(const q of essays){
   assert.match(q.prompt,/글이나 자료에서 근거를 찾아/);
   assert.equal(q.choices.length,0);
   assert.ok(q.modelExplanation.length>20);
  }
 }
});
test('heat observation keeps air temperature separate from surface temperature and limits its inference',()=>{
 const items=findGroup(6,'reading-set-nonfiction','도시가 더 뜨거운 까닭');
 assert.match(items[0].answer,/공기 온도/);
 assert.match(items[1].answer,/매일 2도/);
 assert.match(items[3].answer,/바닥 재료/);
 assert.match(items[4].answer,/다른 장소/);
});
test('letter recipient, unsent request and retrospective storage agree',()=>{
 const items=findGroup(6,'reading-set-literary','고쳐 쓰지 않은 편지');
 assert.match(items[0].answer,/어머니가 쓰고 아버지/);
 assert.match(items[0].readingPassage,/어머니가 부치지 못한 편지/);
 assert.match(items[3].answer,/간직할 기억/);
 assert.match(items[4].answer,/공구함 자리를 비운다/);
});
