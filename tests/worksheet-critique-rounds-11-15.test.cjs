'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../daily-worksheet-core.js');
const Science=require('../science-expansion.js');
const {qualityRisks,review}=require('../scripts/worksheet-critique-loop.cjs');

test('11: all reading-set essay questions, not just the first, ask for evidence in the passage',()=>{
 for(const grade of [1,2,3,4,5,6])for(const count of [5,10,20]){
  for(const seed of [7,42,20261025]){
   const sheet=C.generate({subject:'korean',topic:'reading-set',type:'reading-set-five',grade,count,seed,responseFormat:'essay'});
   assert.equal(sheet.items.length,count);
   for(const item of sheet.items){
    assert.ok(item.readingGroup,grade+'/'+count+' missing reading group');
    assert.match(item.prompt,/글이나 자료에서 근거를 찾아/);
    assert.match(item.prompt,/까닭/);
    assert.ok(item.modelExplanation);
   }
   assert.equal(sheet.items.filter(item=>item.readingPassage).length,count/5);
  }
 }
});

test('12: early Korean reading uses situation, causal evidence and teacher explanations',()=>{
 for(const grade of [1,2])for(const seed of [7,42,20261025]){
  const sheet=C.generate({subject:'korean',topic:'reading',grade,count:20,seed});
  assert.equal(sheet.items.length,20);
  assert.equal(new Set(sheet.items.map(q=>q.detail)).size,20);
  const cases=[
   ['우산을 챙긴 이유','비에 젖지 않으려고'],
   ['도서관에 다시 간 까닭','빌린 책을 돌려주려고'],
   ['물을 주기로 한 근거','흙이 말라 있는 상태'],
   ['활동의 순서','정리와 청소를 한 뒤 쉬었다'],
   ['날마다 흙을 살펴본 까닭','씨앗이 자라는 환경을 살피려고'],
   ['장갑을 선생님께 맡긴 까닭','주인이 장갑을 찾도록 도우려고'],
   ['계절의 변화를 짐작한 근거','가지에 새싹이 돋은 모습'],
   ['브레이크를 확인한 까닭','안전하게 멈출 수 있는지 알아보려고']
  ];
  for(const [stem,answer] of cases){
   const q=sheet.items.find(item=>item.prompt.includes(stem));
   assert.ok(q,'missing short reading: '+stem);
   assert.equal(q.answer,answer);
   assert.ok(q.detail.length>28);
   assert.ok(q.explanation?.length>18);
   assert.ok(q.choices.includes(q.answer));
  }
 }
});

test('13: revised science evidence questions preserve final answers and specific explanations',()=>{
 const cases=[
  ['mixture-separation','mixture-separation-17','일부 고형물','하수 처리 모형'],
  ['mixture-separation','mixture-separation-18','튀거나 흘러넘치는','유리 막대를 타고'],
  ['electricity','electricity-2','회로가 끊어져','스위치를 열자'],
  ['electricity','electricity-6','함께 꺼진다','직렬로 연결'],
  ['environment-energy','environment-energy-8','서식지에 영향','하천에 놓아주려'],
  ['environment-energy','environment-energy-18','오염시키면','플라스틱 용기'],
  ['light-sound','light-sound-16','전달 매질','진공'],
  ['weather-process','weather-process-14','지구 자전','기압 차이']
 ];
 for(const [topic,id,reason,context] of cases){
  const q=Science.banks[topic].find(item=>item.id===id);
  assert.ok(q,id);
  assert.match(q.prompt,new RegExp(context));
  assert.ok(q.explanation.includes(reason),id+' explanation mismatch: '+q.explanation);
  assert.equal(q.wrong.length,2,id);
  assert.equal(new Set([q.answer,...q.wrong]).size,3,id);
  assert.ok(q.wrong.every(x=>!/모두 곧바로 돌|반드시 폭발|모두 기체/.test(x)));
 }
});

test('14: social evidence does not infer present conditions from old photos alone',()=>{
 const found=[];
 for(const seed of [1,7,11,42,99,20261025]){
  for(const topic of ['past','local']){
   const sheet=C.generate({subject:'social',topic,grade:3,count:20,seed});
   found.push(...sheet.items);
  }
 }
 const oldRoad=found.find(q=>q.detail.includes('손수레 5대와 자동차 1대'));
 assert.ok(oldRoad,'two-period transport photo comparison absent');
 assert.match(oldRoad.detail,/오늘 사진에는/);
 assert.match(oldRoad.answer,/두 시기에/);
 assert.ok(oldRoad.choices.includes(oldRoad.answer));
 const school=found.find(q=>q.detail.includes('같은 축척의 옛 지도'));
 assert.ok(school,'same-scale school comparison absent');
 assert.match(school.answer,/가능성이 있습니다/);
 const ledger=found.find(q=>q.detail.includes('판매 가격은 빠져'));
 assert.ok(ledger,'merchant ledger data limits absent');
 assert.ok(ledger.choices.includes('장부만으로 각 물건의 정확한 판매 가격을 계산할 수 있습니다.'));
});

test('15: reviewer highlights unsupported historical claims and missing reading evidence',()=>{
 const invented=qualityRisks({prompt:'자료를 보고 설명하세요.',detail:'옛 사진에는 손수레가 세 대 있습니다.',answer:'지금과 달라졌다.',choices:[]},'social');
 assert.ok(invented.includes('자료 범위를 넘은 시대 비교 의심'));
 const grounded=qualityRisks({prompt:'두 사진을 비교하세요.',detail:'옛 사진 손수레 3대, 오늘 사진 손수레 1대',answer:'지금은 손수레가 줄었다.',choices:[]},'social');
 assert.ok(!grounded.includes('자료 범위를 넘은 시대 비교 의심'));
 const withoutPassage=qualityRisks({prompt:'이 글의 주제를 쓰세요.',answer:'안전',choices:[]},'korean');
 assert.ok(withoutPassage.includes('독해 지문 누락 의심'));
 const normal=review(C);
 assert.equal(normal.errors.length,0,JSON.stringify(normal.errors.slice(0,5)));
});
