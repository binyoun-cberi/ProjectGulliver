'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Bank=require('../worksheet-math-grade3-measure-estimate.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=Bank.banks();
const kind=k=>{const b=banks.find(b=>b.id.endsWith('-'+k));assert.ok(b,'Missing bank '+k);return b;};
const round10=n=>Math.round(n/10)*10;
test('four uncovered grade-3/4 estimation lessons contain 64 original, non-repeating and uniquely graded items',()=>{
 assert.equal(banks.length,4);assert.equal(banks.flatMap(x=>x.items).length,64);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.equal(b.items.length,16);
  assert.ok([3,4].includes(b.grades[0]));
  assert.equal(b.grades.length,1);
  const target=[b.grades[0],b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  const questions=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),'Repeated evidenceId '+q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!questions.has(key),'Repeated item '+q.evidenceId);questions.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=20);
   assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
   assert.ok(!/NaN|undefined|이\(가\)|을\/를|이\/가/.test(q.prompt+' '+q.explanation+' '+(q.detail||'')));
  }
 }
 assert.equal(ids.size,64);
 const copy=Bank.banks();copy[0].items[0].answer='modified';
 assert.notEqual(Bank.banks()[0].items[0].answer,'modified');
});
test('all four uncovered textbook lessons generate deterministic ten-item choice and short worksheets without overriding existing work',()=>{
 for(const b of banks){
  const grade=b.grades[0],semester=b.exactSemester;
  const unit=T.units('math',grade,semester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,b.id+' lacks unit '+b.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' lacks lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' did not bind exact bank');
  const binding=T.binding(unit,lesson);assert.equal(binding?.kind,'evidence');
  assert.equal(binding.bankId,b.id);assert.equal(T.capacity(binding,'choice'),16);
  assert.deepEqual(T.formats(binding).map(row=>row[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const args={subject:'math',grade,semester,unitId:unit.id,lessonId:lesson.id,responseFormat,seed,count:10};
   const sheet=T.generate(args,C);
   assert.deepEqual(T.generate(args,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(row=>row.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('six previously connected grade-three length/time lessons remain bound to their original, reviewed banks',()=>{
 const unit=T.units('math',3,1).find(u=>u.name==='길이와 시간');
 assert.ok(unit);
 const preserved={
  'mm를 알아봐요':'math-g3-basics-mm',
  'km를 알아봐요':'math-g3-basics-km',
  '길이를 어림해요':'math-g3-basics-estimate-length',
  '초를 알아봐요':'math-g3-basics-seconds',
  '시간의 덧셈과 뺄셈을 해요 (1)':'math-g3-basics-time-add',
  '시간의 덧셈과 뺄셈을 해요 (2)':'math-g3-basics-time-sub'
 };
 for(const [label,id]of Object.entries(preserved)){
  const l=unit.lessons.find(x=>x.name.trim().replace(/^\\d+\\.\\s*/,'')===label);
  assert.ok(l,'missing existing length/time target '+label);
  assert.equal(E.find(unit,l)?.id,id,label);
  assert.equal(T.binding(unit,l)?.bankId,id,label+' must not be overridden');
 }
});
test('estimate tasks state concrete objects and do not imply that actual measurement was observed',()=>{
 for(const k of ['length-estimate','weight-estimate','capacity-estimate']){
  const b=kind(k);
  assert.equal(b.items.length,16);
  const labels=new Set();
  for(const q of b.items){
   assert.match(q.prompt,/어림/);assert.match(q.answer,/^약 /);
   assert.match(q.explanation,/실제|보통/);
   assert.ok(q.detail.includes(': '));
   const target=q.detail.split(': ')[1].split('.')[0];
   assert.ok(!labels.has(target),'Repeated estimation object '+target);labels.add(target);
   const vals=q.choices.map(s=>s.replace(/^약 /,''));
   assert.equal(new Set(vals).size,3);
   assert.ok(vals.every(s=>/^(?:\d+(?:\.\d+)?) (?:mm|cm|m|km|g|kg|t|mL|L)$/.test(s)));
  }
 }
});
test('grade-three addition/subtraction and grade-four multiplication/division estimates match independently rounded operands',()=>{
 for(const q of kind('estimate-three').items){
  const [,a,op,b]=q.detail.match(/(\d+) ([+−]) (\d+)/);
  const x=round10(Number(a)),y=round10(Number(b));
  assert.equal(q.answer,String(op==='+'?x+y:x-y));
  assert.equal(new Set(q.choices.map(Number)).size,3);
 }
 for(const q of kind('estimate-four').items){
  const m=q.detail.match(/(\d+) ([×÷]) (\d+)/);
  assert.ok(m,q.detail);
  const [,a,op,b]=m,x=round10(Number(a)),y=round10(Number(b));
  const expected=op==='×'?x*y:x/y;
  assert.equal(Number(q.answer),expected,q.evidenceId);
  assert.ok(Number.isInteger(expected));
  assert.equal(new Set(q.choices.map(Number)).size,3);
 }
});
test('the new estimation module loads before evidence initialization on the printable worksheet page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade3-measure-estimate.js'));
 assert.ok(html.indexOf('worksheet-math-grade3-measure-estimate.js')<html.indexOf('worksheet-evidence-banks.js'));
});
