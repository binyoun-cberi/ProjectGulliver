'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Num=require('../worksheet-math-grade1-number-sense.js');
const Shape=require('../worksheet-math-grade1-shapes-patterns.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=[...Num.banks(),...Shape.banks()];
const byKind=kind=>{const found=banks.find(b=>b.id.endsWith('-'+kind));assert.ok(found,kind);return found;};
test('30 independent grade-one lesson banks contain 472 original, uniquely graded questions',()=>{
 assert.equal(Num.banks().length,16);
 assert.equal(Shape.banks().length,14);
 assert.equal(banks.length,30);
 assert.equal(banks.flatMap(b=>b.items).length,472);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[1]);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  assert.ok(b.items.length>=12&&b.items.length<=16);
  const keys=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!keys.has(key),b.id);keys.add(key);
   assert.equal(q.choices.length,3);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>=13);
   assert.match(q.sourceLabel,/창작/);
   assert.equal(q.knowledgeOnly,true);
   assert.ok(!/을\/를|이\/가|이\(가\)|과\(와\)/.test(q.prompt+' '+q.explanation));
  }
 }
 assert.equal(ids.size,472);
 const copy=Shape.banks();copy[0].items[0].answer='modified';
 assert.notEqual(Shape.banks()[0].items[0].answer,'modified');
});
test('all 30 grade-one textbook lessons map to their own question pool and generate exactly ten reproducible items',()=>{
 for(const b of banks){
  const unit=T.units('math',1,b.exactSemester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,'missing textbook unit '+b.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim()===b.exactLessonName);
  assert.ok(lesson,'missing lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,'wrong bank '+b.exactLessonName);
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence');
  assert.equal(binding?.bankId,b.id);
  assert.equal(T.capacity(binding,'choice'),b.items.length);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'math',grade:1,semester:b.exactSemester,unitId:unit.id,lessonId:lesson.id,responseFormat,count:10,seed};
   const sheet=T.generate(options,C);
   assert.deepEqual(T.generate(options,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   for(const row of sheet.items){
    assert.equal(row.curriculumLesson,lesson.id);
    assert.ok(row.answer&&row.explanation);
    if(responseFormat==='choice')assert.ok(row.choices.includes(row.answer));else assert.deepEqual(row.choices,[]);
   }
  }
 }
});
test('counting, tens, ordering, and parity agree with visible records and do not exceed stated grade-one ranges',()=>{
 for(const q of [...byKind('one-five').items,...byKind('six-nine').items]){
  const count=[...q.detail].filter(ch=>ch==='●').length;
  assert.equal(q.answer,String(count));
  assert.ok(count>=1&&count<=9);
 }
 for(const [i,q] of byKind('zero').items.entries())assert.equal(q.answer,String(i%2===0?0:i%5+1));
 for(const [i,q] of byKind('bundles-ten').items.entries())assert.equal(q.answer,String((i%5+1)*10));
 for(const [i,q] of byKind('tens-sixty-ninety').items.entries())assert.equal(q.answer,String((6+i%4)*10));
 for(const [i,q] of byKind('parity').items.entries()){
  const val=20+i*3;
  assert.equal(q.answer,val%2===0?'짝수':'홀수');
 }
 for(const [i,q] of byKind('order-fifty').items.entries())assert.equal(q.answer,String(16+i*2));
 for(const [i,q] of byKind('order-ninety-nine').items.entries())assert.equal(q.answer,String(62+i*2));
});
test('comparative length, mass, area, and capacity questions identify exactly the larger amount',()=>{
 for(const kind of ['longer','heavier','wider','capacity'])for(const q of byKind(kind).items){
  const matched=q.detail.match(/가.*?(\d+)(?:개|컵), 나는 (\d+)(?:개|컵)/);
  assert.ok(matched,q.detail);
  const a=Number(matched[1]),b=Number(matched[2]);
  assert.notEqual(a,b);
  assert.equal(q.answer,a>b?'가':'나');
  assert.ok(q.choices.includes('길이가 같다')||q.choices.includes('무게가 같다')||q.choices.includes('넓이가 같다')||q.choices.includes('들이가 같다'));
 }
});
test('hour and half-hour clock descriptions, number grids, and repeating patterns retain their correct next values',()=>{
 for(const kind of ['clock-hour','clock-half'])for(const [i,q]of byKind(kind).items.entries()){
  assert.equal(q.answer,kind==='clock-hour'?(i+1)+'시':(i+1)+'시 30분');
 }
 for(const [i,q]of byKind('number-grid-pattern').items.entries())assert.equal(q.answer,String(21+i*2));
 for(const q of byKind('repeating').items){
  const seq=q.detail.split(': ').pop().split(' → ');
  assert.equal(seq.at(-1),'?');
  assert.equal(q.answer,seq[1]);
 }
 for(const q of byKind('pattern-as-numbers').items)assert.equal(q.answer,'1, 2, 1, 2, 1, 2');
});
test('new grade-one scripts precede evidence registration in the existing A4 worksheet page',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const script of ['worksheet-math-grade1-number-sense.js','worksheet-math-grade1-shapes-patterns.js']){
  assert.ok(page.includes(script));
  assert.ok(page.indexOf(script)<page.indexOf('worksheet-evidence-banks.js'));
 }
});
