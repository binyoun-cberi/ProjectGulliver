'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Five=require('../worksheet-korean-literacy-grade5.js');
const Six=require('../worksheet-korean-literacy-grade6.js');
const T=require('../worksheet-learning.js');
const E=require('../worksheet-evidence-banks.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=[...Five.banks(),...Six.banks()];
test('13 exact upper-grade Korean lesson banks contain 156 original, unambiguous questions',()=>{
 assert.equal(Five.banks().length,8);assert.equal(Six.banks().length,5);
 assert.equal(banks.length,13);
 assert.equal(banks.flatMap(b=>b.items).length,156);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'korean');assert.ok([5,6].includes(b.grades[0]));assert.equal(b.items.length,12);
  const target=[b.grades[0],b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  const prompts=new Set();
  for(const row of b.items){
   assert.ok(!ids.has(row.evidenceId),row.evidenceId);ids.add(row.evidenceId);
   const key=JSON.stringify([row.prompt,row.detail]);
   assert.ok(!prompts.has(key),b.id);prompts.add(key);
   assert.equal(row.choices.length,3);assert.equal(new Set(row.choices).size,3);
   assert.ok(row.choices.includes(row.answer));assert.ok(row.explanation.length>14);
   assert.equal(row.knowledgeOnly,true);assert.match(row.sourceLabel,/창작/);
   assert.ok(!row.prompt.includes('소리를 듣고')&&!row.prompt.includes('그림을 보고'));
  }
 }
 assert.equal(ids.size,156);
 const cloned=Five.banks();cloned[0].items[0].choices[0]='changed';
 assert.notEqual(Five.banks()[0].items[0].choices[0],'changed');
});
test('all upper-grade banks match one textbook lesson each and create deterministic objective and short responses',()=>{
 for(const bank of banks){
  const grade=bank.grades[0],semester=bank.exactSemester;
  const unit=T.units('korean',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,bank.id+' unit unavailable');
  const lesson=unit.lessons.find(l=>l.name.trim()===bank.exactLessonName);
  assert.ok(lesson,bank.id+' lesson unavailable');
  assert.equal(E.find(unit,lesson)?.id,bank.id);
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence');
  assert.equal(binding?.bankId,bank.id);
  assert.equal(T.capacity(binding,'choice'),12);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'korean',grade,semester,unitId:unit.id,lessonId:lesson.id,seed,count:10,responseFormat};
   const sheet=T.generate(options,C);
   assert.deepEqual(T.generate(options,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   for(const row of sheet.items){
    assert.equal(row.curriculumLesson,lesson.id);assert.ok(row.answer&&row.explanation);
    if(responseFormat==='choice')assert.ok(row.choices.includes(row.answer));
    else assert.deepEqual(row.choices,[]);
   }
  }
 }
});
test('omitted dialogue replies, supported word classes, native Korean values, and respectful interviews align with lesson names',()=>{
 const get=s=>banks.find(b=>b.id.endsWith('-'+s));
 const omitted=get('omission').items;
 assert.ok(omitted.every(x=>x.detail.includes('가:')&&x.detail.includes('나:')));
 assert.ok(omitted.every(x=>!x.detail.includes('나: '+x.answer+'을 가져올 거야.')));
 assert.match(omitted[0].detail,/나: 어제 빌린 과학책\./);
 const travel=get('travel').items;
 assert.ok(travel.every(x=>['여정','견문','감상'].includes(x.answer)));
 const native=get('native').items;
 assert.equal(native.length,12);
 assert.ok(native.every(x=>x.detail.includes('‘')&&x.answer.length>=18));
 assert.ok(native.every(x=>x.explanation.includes('한자어와 외래어도')));
 const debate=get('debate');
 assert.equal(debate.exactLessonName,'토론의 절차와 규칙 이해하기');
 assert.ok(debate.items.every(x=>x.prompt.includes('토론의 절차')));
});
test('new script files precede evidence registration in worksheet HTML',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const name of ['worksheet-korean-literacy-grade5.js','worksheet-korean-literacy-grade6.js']){
  assert.ok(html.includes(name));assert.ok(html.indexOf(name)<html.indexOf('worksheet-evidence-banks.js'));
 }
});
