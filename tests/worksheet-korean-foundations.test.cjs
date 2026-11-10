'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const B=require('../worksheet-korean-foundations.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=B.banks();

test('25 independent Korean grade 1–2 foundational lesson banks contain exactly keyed questions',()=>{
 assert.equal(banks.length,25);
 const ids=new Set(),targets=new Set();let items=0;
 for(const b of banks){
  assert.equal(b.subject,'korean');assert.ok([1,2].includes(b.grades[0]));
  assert.ok(b.items.length>=10&&b.items.length<=20);
  const target=[...b.grades,b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target));targets.add(target);
  const keys=new Set();
  for(const q of b.items){
   items++;assert.ok(!ids.has(q.evidenceId));ids.add(q.evidenceId);
   assert.ok(!keys.has(JSON.stringify([q.prompt,q.detail])));keys.add(JSON.stringify([q.prompt,q.detail]));
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>10);
   assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
  }
 }
 assert.equal(items,379);
 const next=B.banks();next[0].items[0].choices[0]='changed';
 assert.notEqual(B.banks()[0].items[0].choices[0],'changed');
});
test('25 Korean foundational lessons match exact textbook source and generate reproducible basic worksheets',()=>{
 let total=0;
 for(const bank of banks){
  const grade=bank.grades[0],semester=bank.exactSemester;
  const unit=T.units('korean',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,bank.id+': missing unit');
  const lesson=unit.lessons.find(l=>l.name.trim()===bank.exactLessonName);
  assert.ok(lesson,bank.id+': missing lesson');
  const bound=T.binding(unit,lesson);
  assert.ok(bound,bank.id+': binding missing');
  assert.equal(bound.kind,'evidence');assert.equal(bound.bankId,bank.id);
  assert.equal(T.capacity(bound,'choice'),bank.items.length);
  assert.deepEqual(T.formats(bound).map(row=>row[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const opts={subject:'korean',grade,semester,unitId:unit.id,lessonId:lesson.id,count:10,seed,responseFormat};
   const sheet=T.generate(opts,C);assert.deepEqual(T.generate(opts,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   assert.ok(sheet.items.every(x=>x.curriculumLesson===lesson.id&&x.answer&&x.explanation));
   for(const x of sheet.items)if(responseFormat==='choice')assert.ok(x.choices.includes(x.answer));else assert.deepEqual(x.choices,[]);
  }
  total++;
 }
 assert.equal(total,25);
});
test('phonics and spelling stay truthful to visible Hangul spelling rather than unstated audio',()=>{
 const find=(kind)=>banks.find(b=>b.id.includes('-'+kind+'-'));
 assert.equal(find('syllable-count').items.find(q=>q.prompt.includes('안녕하세요')).answer,'5개');
 assert.equal(find('consonant').items.find(q=>q.prompt.includes('‘아’')).answer,'ㅇ');
 assert.equal(find('batchim').items.find(q=>q.prompt.includes('‘꽃’')).answer,'ㅊ');
 assert.equal(find('double-final').items.find(q=>q.prompt.includes('‘값’')).answer,'ㅄ');
 assert.ok(banks.every(b=>b.items.every(q=>!q.prompt.includes('소리를 듣고')&&!q.prompt.includes('그림을 보고'))));
});
test('HTML loads foundation module before evidence initialization',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 const a=html.indexOf('worksheet-korean-foundations.js'),b=html.indexOf('worksheet-evidence-banks.js');
 assert.ok(a>0&&a<b);
});
