'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks');
const T=require('../worksheet-learning');
const C=require('../daily-worksheet-core');
const G3=require('../worksheet-korean-grade3-language');
const G4=require('../worksheet-korean-grade4-language');
const G56=require('../worksheet-korean-upper-language');
const fs=require('node:fs'),path=require('node:path');
const banks=[...G3.banks(),...G4.banks(),...G56.banks()];
test('21 textbook-specific Korean language banks offer 252 independently keyed and explained examples',()=>{
 assert.equal(G3.banks().length,5);assert.equal(G4.banks().length,5);assert.equal(G56.banks().length,11);
 assert.equal(banks.length,21);
 const ids=new Set(),targets=new Set();let count=0;
 for(const b of banks){
  assert.equal(b.subject,'korean');
  assert.ok([3,4,5,6].includes(b.grades[0]));
  assert.equal(b.items.length,12);
  const target=[...b.grades,b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),'repeated curriculum target '+target);targets.add(target);
  const prompts=new Set();
  for(const q of b.items){
   count++;assert.ok(!ids.has(q.evidenceId),'reused item ID '+q.evidenceId);ids.add(q.evidenceId);
   const k=JSON.stringify([q.prompt,q.detail]);
   assert.ok(!prompts.has(k),'duplicated worksheet prompt '+b.id);prompts.add(k);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>=12);
   assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
   assert.ok(!/undefined|NaN/.test(JSON.stringify(q)));
  }
 }
 assert.equal(count,252);assert.equal(ids.size,252);
 const clone=G3.banks();clone[0].items[0].choices[0]='잘못된 선택지';
 assert.notEqual(G3.banks()[0].items[0].choices[0],'잘못된 선택지');
});
test('all 21 target lessons match source curriculum and print 10 stable, strictly local items in two formats',()=>{
 for(const bank of banks){
  const grade=bank.grades[0],semester=bank.exactSemester;
  const unit=T.units('korean',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,bank.id+': missing exact unit '+bank.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim()===bank.exactLessonName);
  assert.ok(lesson,bank.id+': missing exact lesson '+bank.exactLessonName);
  const actual=E.find(unit,lesson);
  assert.equal(actual?.id,bank.id,'incorrect bank assigned: '+bank.exactLessonName);
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence',bank.id);
  assert.equal(binding?.bankId,bank.id,bank.exactLessonName);
  assert.equal(T.capacity(binding,'choice'),12);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const params={subject:'korean',grade,semester,unitId:unit.id,lessonId:lesson.id,
    responseFormat,seed,count:10};
   const worksheet=T.generate(params,C);
   assert.deepEqual(T.generate(params,C),worksheet,'seed is not deterministic');
   assert.equal(worksheet.items.length,10,bank.id);
   assert.equal(worksheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(worksheet.items.map(q=>q.evidenceId)).size,10);
   for(const q of worksheet.items){
    assert.equal(q.curriculumLesson,lesson.id);
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));
    else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('fictional source data, referral pronouns and idioms have useful supporting information',()=>{
 const sources=banks.filter(b=>b.id.includes('source-'));
 assert.equal(sources.length,2);
 assert.ok(sources.flatMap(b=>b.items).every(q=>/가상/.test(q.detail)));
 const dictionary=banks.find(b=>b.id.endsWith('-dictionary-sense'));
 assert.ok(dictionary);
 assert.ok(dictionary.items.every(q=>q.detail&&q.explanation));
 const idioms=banks.find(b=>b.id.endsWith('-idioms'));
 assert.ok(idioms&&idioms.items.some(q=>q.prompt.includes('발이 넓다')));
 assert.ok(idioms.items.some(q=>q.prompt.includes('눈코 뜰 새 없다')));
 const online=banks.find(b=>b.id.endsWith('-online-features'));
 assert.ok(online.items.some(q=>/표정|말투/.test(q.answer)));
});
test('new Korean language question sources precede evidence-bank initialization on the existing print page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const src of ['worksheet-korean-grade3-language.js','worksheet-korean-grade4-language.js','worksheet-korean-upper-language.js']){
  assert.ok(html.includes(src),'missing script '+src);
  assert.ok(html.indexOf(src)<html.indexOf('worksheet-evidence-banks.js'),'late script '+src);
 }
});
