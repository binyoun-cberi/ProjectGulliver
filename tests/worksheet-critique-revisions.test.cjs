'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Core=require('../daily-worksheet-core.js');
const Column=require('../column-math.js');
const Science=require('../science-expansion.js');

test('grade 2 uses two-digit operands for column addition and subtraction, with correct grade options',()=>{
 const types=Core.types('math',2,'column').map(x=>x[0]);
 assert.deepEqual(types,['column-add2','column-sub2']);
 for(const type of types)for(const mode of ['any','yes','no'])for(const seed of [7,42,20261024]){
  const options={subject:'math',grade:2,topic:'column',type,columnMode:mode,count:12,seed};
  const sheet=Core.generate(options);
  assert.deepEqual(sheet,Core.generate(options));
  for(const item of sheet.items){
   const {a,b,op}=item.column;
   assert.ok(a>=10&&a<=99&&b>=10&&b<=99,type+'/'+seed+': '+a+op+b);
   assert.equal(item.answer, String(op==='+'?a+b:a-b));
   if(mode!=='any')assert.equal(Column.carries(a,b,op),mode==='yes');
  }
 }
 for(const type of ['column-add3','column-sub3','column-mul2','column-div3'])
  assert.throws(()=>Core.generate({subject:'math',grade:2,topic:'column',type,count:6,seed:7}));
});

test('existing grade 3 vertical arithmetic still keeps three-digit operands',()=>{
 for(const type of ['column-add3','column-sub3'])for(const mode of ['yes','no']){
  const sheet=Core.generate({subject:'math',grade:3,topic:'column',type,columnMode:mode,count:12,seed:42});
  for(const item of sheet.items){
   assert.ok(item.column.a>=100&&item.column.b>=100,type);
   assert.ok(item.column.a<=999&&item.column.b<=999,type);
  }
 }
});

test('aquarium inference includes an observed birth instead of inferring birth from counts alone',()=>{
 const q=Science.banks.living.find(x=>x.id==='living-inquiry-reproduction');
 assert.ok(q);
 const data=JSON.stringify(q.material);
 assert.match(q.prompt,/새 물고기를 넣지 않았다는 조건/);
 assert.match(data,/태어난 새끼/);
 assert.match(q.explanation,/몸길이나 먹이 양은 조사하지 않았/);
});

test('sample science distractors no longer assume physical impossibilities',()=>{
 const bank=Object.values(Science.banks).flat();
 const water=bank.find(x=>x.prompt.includes('물과 기름을 한 병에 넣어'));
 assert.ok(water);
 assert.equal(water.answer,'서로 다른 층을 이룬다');
 assert.ok(water.wrong.every(x=>!/새로운 금속|모두 증발/.test(x)));
 const temperature=Science.banks.heat.find(x=>x.id==='heat-7');
 assert.ok(temperature);
 assert.equal(temperature.answer,'둘 다 실내 온도에 가까워진다');
});

test('final science review does not restore rejected distractors',()=>{
 const oil=Science.banks['mixture-separation'].find(x=>x.id==='mixture-separation-8');
 assert.deepEqual(oil.wrong,['기름이 물에 고르게 녹아 투명해진다','시간이 지나도 층 없이 고르게 섞여 있다']);
 const habitat=Science.banks['environment-energy'].find(x=>x.id==='environment-energy-7');
 assert.deepEqual(habitat.wrong,['모든 동물의 먹이가 더 많아진다','나무와 풀이 사라져도 서식 장소는 그대로 유지된다']);
 const thermal=Science.banks.heat.find(x=>x.id==='heat-6');
 assert.ok(thermal.wrong.every(x=>!x.includes('항상 실내 온도')));
});
