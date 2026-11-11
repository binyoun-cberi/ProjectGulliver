'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../worksheet-math-grade4-patterns.js');
const T=require('../worksheet-learning.js'),E=require('../worksheet-evidence-banks.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=M.banks(),get=k=>{const b=banks.find(x=>x.id.endsWith('-'+k));assert.ok(b,k);return b;};
test('seven grade-four algebra lessons have 112 distinct reliable original three-choice tasks',()=>{
 assert.equal(banks.length,7);assert.equal(banks.flatMap(b=>b.items).length,112);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[4]);
  assert.equal(b.exactSemester,2);assert.equal(b.exactUnitName,'규칙 찾기와 식 만들기');
  assert.equal(b.items.length,16);
  assert.ok(!targets.has(b.exactLessonName));targets.add(b.exactLessonName);
  const keys=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId));ids.add(q.evidenceId);
   const k=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!keys.has(k),b.id+' '+k);keys.add(k);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>14);assert.equal(q.knowledgeOnly,true);
   assert.match(q.sourceLabel,/창작/);
   assert.ok(!/을\/를|이\/가|을\(를\)|이\(가\)|NaN/.test(q.prompt+' '+q.explanation+' '+q.detail));
  }
 }
 assert.equal(ids.size,112);
 const copy=M.banks();copy[0].items[0].answer='modified';assert.notEqual(M.banks()[0].items[0].answer,'modified');
});
test('all seven exact grade-four semester-two textbook lessons generate ten seeded choice/short items',()=>{
 for(const b of banks){
  const u=T.units('math',4,2).find(u=>u.name===b.exactUnitName);assert.ok(u,b.id+' unit');
  const l=u.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(l,b.id+' lesson '+b.exactLessonName);
  assert.equal(E.find(u,l)?.id,b.id,b.id+' existing bank preserved');
  const binding=T.binding(u,l);assert.equal(binding?.kind,'evidence');assert.equal(binding?.bankId,b.id);
  assert.equal(T.capacity(binding,'choice'),16);assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'math',grade:4,semester:2,unitId:u.id,lessonId:l.id,responseFormat,seed,count:10};
   const sheet=T.generate(options,C);
   assert.deepEqual(T.generate(options,C),sheet);assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,l.id);assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,l.id);assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('numbers, growing figures and formulas correctly predict the next stage from visible observations',()=>{
 for(const q of get('number-sequence').items){
  const m=q.detail.match(/수 배열: (\d+) → (\d+) → (\d+) → □/);assert.ok(m,q.detail);
  const [a,b,c]=m.slice(1).map(Number);assert.equal(c-b,b-a);
  assert.equal(Number(q.answer),c+(b-a));
 }
 for(const q of get('figure-count').items){
  const m=[...q.detail.matchAll(/(\d+)단계 [■]+ \((\d+)개\)/g)];
  assert.equal(m.length,3,q.detail);
  const [a,b,c]=m.map(x=>Number(x[2]));assert.equal(c-b,b-a);
  assert.equal(q.answer,c+(b-a)+'개');
 }
 for(const q of get('figure-formula').items){
  const pictures=[...q.detail.matchAll(/(\d+)단계 [■]+ \((\d+)개\)/g)];
  assert.equal(pictures.length,3,q.detail);
  const expr=q.answer.match(/단계 수 × (\d+) \+ (\d+)/);assert.ok(expr);
  for(const m of pictures)assert.equal(Number(m[2]),Number(m[1])*Number(expr[1])+Number(expr[2]));
  for(const w of q.choices.slice(1)){
   const x=w.match(/단계 수 × (\d+) \+ (\d+)/);
   assert.ok(pictures.some(m=>Number(m[2])!==Number(m[1])*Number(x[1])+Number(x[2])),'wrong formula must disagree with evidence');
  }
 }
});
test('calculation sequences and equal-group equations have one and only one mathematically true result',()=>{
 for(const q of get('calculation-add').items){
  const m=q.detail.match(/(\d+) \+ (\d+) = □/);assert.ok(m,q.detail);
  assert.equal(q.answer,String(Number(m[1])+Number(m[2])));
 }
 for(const q of get('calculation-mul').items){
  const m=q.detail.match(/(\d+) × (\d+) = □/);assert.ok(m,q.detail);
  assert.equal(q.answer,String(Number(m[1])*Number(m[2])));
 }
 for(const q of get('same-quantity').items){
  const m=q.answer.match(/(\d+) × (\d+)/);assert.ok(m);
  const count=q.detail.match(/한 모둠에 (\d+)개씩 (\d+)모둠/);assert.ok(count);
  assert.deepEqual(m.slice(1).map(Number),count.slice(1).map(Number));
  const amount=Number(m[1])*Number(m[2]);
  assert.ok(q.detail.includes('모두 '+amount+'개'));
  assert.ok(q.choices.slice(1).every(w=>{
   const x=w.match(/^(\d+) ([+×]) (\d+)$/);
   return x&&(x[2]==='+'?Number(x[1])+Number(x[3]):Number(x[1])*Number(x[3]))!==amount;
  }));
 }
 for(const q of get('equation-check').items){
  const m=q.detail.match(/한 상자에 (\d+)개씩 (\d+)상자에 담고 낱개 (\d+)개/);assert.ok(m,q.detail);
  const each=Number(m[1]),groups=Number(m[2]),single=Number(m[3]),total=groups*each+single;
  assert.equal(q.answer,groups+' × '+each+' + '+single+' = '+total);
  assert.ok(q.choices[1].includes(groups+' + '+each+' + '+single+' = '+total));
  assert.ok(q.choices[2].includes(groups+' × ('+each+' + '+single+') = '+total));
  assert.notEqual(groups+each+single,total);
  assert.notEqual(groups*(each+single),total);
 }
});
test('grade-four pattern script is included before evidence bank initialization on printable page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade4-patterns.js'));
 assert.ok(html.indexOf('worksheet-math-grade4-patterns.js')<html.indexOf('worksheet-evidence-banks.js'));
});
