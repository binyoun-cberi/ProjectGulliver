'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../worksheet-math-coverage.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');

const banks=M.banks();
test('math coverage banks contain 47 exact lesson targets and 1175 nonduplicated, valid original questions',()=>{
 assert.equal(banks.length,47);
 const ids=new Set(),scopes=new Set();
 for(const bank of banks){
  assert.equal(bank.subject,'math');
  assert.equal(bank.items.length,25);
  const key=[bank.grades[0],bank.exactSemester,bank.exactUnitName,bank.exactLessonName].join('/');
  assert.ok(!scopes.has(key),'Duplicate exact lesson '+key);scopes.add(key);
  const prompts=new Set();
  for(const item of bank.items){
   assert.ok(!ids.has(item.evidenceId));ids.add(item.evidenceId);
   assert.ok(!prompts.has(item.prompt),'Duplicate question '+key);prompts.add(item.prompt);
   assert.equal(item.choices.length,3);assert.equal(new Set(item.choices).size,3);
   assert.ok(item.choices.includes(item.answer));assert.ok(item.explanation.length>=12);
   assert.equal(item.knowledgeOnly,true);
   assert.match(item.sourceLabel,/창작/);
  }
 }
 assert.equal(ids.size,1175);
 const cloned=M.banks();cloned[0].items[0].choices[0]='tampered';
 assert.notEqual(M.banks()[0].items[0].choices[0],'tampered');
});
test('all 47 maths lessons resolve only to an exact textbook lesson, with 20-question worksheet output',()=>{
 let enabled=0;
 for(const bank of banks){
  const grade=bank.grades[0],semester=bank.exactSemester,unit=T.units('math',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,bank.id+': missing exact textbook unit');
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^(?:[①-⑳]|\d+\.)\s*/,'').trim()===bank.exactLessonName);
  assert.ok(lesson,bank.id+': missing exact textbook lesson');
  const binding=T.binding(unit,lesson);
  assert.ok(binding,bank.id+': not ready');assert.equal(binding.kind,'evidence');
  assert.equal(binding.bankId,bank.id);assert.equal(T.capacity(binding,'choice'),25);
  assert.equal(T.capacity(binding,'short'),25);
  assert.deepEqual(T.formats(binding).map(row=>row[0]),['choice','short']);
  for(const format of ['choice','short'])for(const seed of [7,42]){
   const opts={subject:'math',grade,semester,unitId:unit.id,lessonId:lesson.id,responseFormat:format,count:20,seed};
   const result=T.generate(opts,C);assert.deepEqual(T.generate(opts,C),result);
   assert.equal(result.items.length,20);assert.equal(new Set(result.items.map(x=>x.evidenceId)).size,20);
   assert.equal(result.curriculum.lessonId,lesson.id);
   for(const item of result.items){
    assert.equal(item.curriculumLesson,lesson.id);
    assert.ok(item.explanation);assert.ok(item.answer);
    if(format==='choice')assert.ok(item.choices.includes(item.answer));
    else assert.deepEqual(item.choices,[]);
   }
  }
  const wrongUnit=T.units('math',grade,semester).find(u=>u.id!==unit.id);
  if(wrongUnit&&wrongUnit.lessons.some(l=>l.id===lesson.id))throw Error('Nonunique lesson');
  enabled++;
 }
 assert.equal(enabled,47);
});
test('math bank integration retains only exact grades and semesters',()=>{
 for(const b of banks){
  const unit=T.units('math',b.grades[0],b.exactSemester).find(u=>u.name===b.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'').trim()===b.exactLessonName);
  const sameNamedWrongUnit=T.units('math',b.grades[0],b.exactSemester).filter(u=>u.id!==unit.id&&u.lessons.some(l=>l.name===lesson.name));
  for(const wrong of sameNamedWrongUnit)assert.notEqual(E.find(wrong,lesson)?.id,b.id);
  assert.ok(!E.banks.some(x=>x.id===b.id&&x.grades[0]!==b.grades[0]));
 }
});
test('browser includes coverage file before evidence bank initialization',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 const coverage=html.indexOf('worksheet-math-coverage.js'),evidence=html.indexOf('worksheet-evidence-banks.js');
 assert.ok(coverage>0&&evidence>coverage);
});
