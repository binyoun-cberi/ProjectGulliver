'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Three=require('../worksheet-korean-literacy-grade3.js');
const Four=require('../worksheet-korean-literacy-grade4.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=[...Three.banks(),...Four.banks()];
test('23 grade-three and grade-four Korean lesson banks contain 276 original items and unique answers',()=>{
 assert.equal(Three.banks().length,11);assert.equal(Four.banks().length,12);
 assert.equal(banks.length,23);
 assert.equal(banks.reduce((sum,b)=>sum+b.items.length,0),276);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'korean');assert.ok([3,4].includes(b.grades[0]));
  assert.equal(b.items.length,12);
  assert.ok(b.exactUnitName&&b.exactLessonName);
  const target=[b.grades[0],b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),'repeated lesson target '+target);targets.add(target);
  const prompts=new Set();
  for(const item of b.items){
   assert.ok(!ids.has(item.evidenceId),'repeated ID '+item.evidenceId);ids.add(item.evidenceId);
   const key=JSON.stringify([item.prompt,item.detail]);assert.ok(!prompts.has(key),'repeated prompt '+b.id);
   prompts.add(key);
   assert.equal(item.choices.length,3);assert.equal(new Set(item.choices).size,3);
   assert.ok(item.choices.includes(item.answer));assert.ok(item.explanation.length>=14);
   assert.equal(item.knowledgeOnly,true);assert.match(item.sourceLabel,/창작/);
   assert.ok(!item.prompt.includes('이/가'),'unpolished Korean prompt');
   assert.ok(!item.prompt.includes('소리를 듣고')&&!item.prompt.includes('그림을 보고'));
  }
 }
 assert.equal(ids.size,276);
 const clone=Four.banks();clone[0].items[0].answer='changed';assert.notEqual(Four.banks()[0].items[0].answer,'changed');
});
test('23 exact Korean 2022 textbook lessons can generate reproducible 10-question choice and short worksheets',()=>{
 for(const bank of banks){
  const grade=bank.grades[0],semester=bank.exactSemester;
  const unit=T.units('korean',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,bank.id+': cannot locate unit '+bank.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim()===bank.exactLessonName);
  assert.ok(lesson,bank.id+': cannot locate lesson '+bank.exactLessonName);
  const evidence=E.find(unit,lesson);
  assert.equal(evidence?.id,bank.id,'incorrect evidence link '+bank.id);
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence');
  assert.equal(binding.bankId,bank.id);
  assert.equal(T.capacity(binding,'choice'),12);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const opts={subject:'korean',grade,semester,unitId:unit.id,lessonId:lesson.id,seed,count:10,responseFormat};
   const sheet=T.generate(opts,C);
   assert.deepEqual(T.generate(opts,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('language assessment items have a concrete basis and avoid confusion between noun categories and context',()=>{
 const get=id=>banks.find(b=>b.id.endsWith('-'+id));
 const a=get('wordtypes').items;
 assert.match(a[7].prompt,/물건의 이름/);
 assert.match(a[10].prompt,/장소의 이름/);
 const support=get('support').items;
 assert.ok(support.every(q=>q.detail.startsWith('중심 문장:')));
 assert.ok(support.every(q=>!q.choices.slice(1).includes(q.answer)));
 const b=get('source').items;
 assert.ok(b.every(q=>q.detail.length>=18));
 const c=get('reference').items;
 assert.ok(c.every(q=>q.detail&&q.detail.length>=20));
 assert.match(c[0].detail,/민호는 낡은 시계를 선물로 받았다/);
 const compare=get('compare').items;
 assert.ok(compare.every(q=>q.detail.includes('가:')&&q.detail.includes('나:')));
});
test('grade-three and grade-four literary skills are integrated before worksheet evidence-bank initialization',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const name of ['worksheet-korean-literacy-grade3.js','worksheet-korean-literacy-grade4.js']){
  assert.ok(html.includes(name));
  assert.ok(html.indexOf(name)<html.indexOf('worksheet-evidence-banks.js'));
 }
});
