'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../worksheet-math-grade2-numbers-time');
const E=require('../worksheet-evidence-banks');
const T=require('../worksheet-learning');
const C=require('../daily-worksheet-core');
const fs=require('node:fs'),path=require('node:path');
const banks=M.banks();
test('19 exact second-grade textbook lessons offer 304 distinct authored, fully answered questions',()=>{
 assert.equal(banks.length,19);assert.equal(banks.reduce((n,b)=>n+b.items.length,0),304);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[2]);assert.equal(b.items.length,16);
  const key=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(key),key);targets.add(key);
  const prompts=new Set();
  for(const item of b.items){
   assert.ok(!ids.has(item.evidenceId));ids.add(item.evidenceId);
   const q=JSON.stringify([item.prompt,item.detail]);
   assert.ok(!prompts.has(q));prompts.add(q);
   assert.equal(item.choices.length,3);assert.equal(new Set(item.choices).size,3);
   assert.ok(item.choices.includes(item.answer));
   assert.ok(item.explanation.length>10);assert.match(item.sourceLabel,/창작/);
   assert.equal(item.knowledgeOnly,true);
  }
 }
 assert.equal(ids.size,304);
 const clone=M.banks();clone[0].items[0].answer='changed';
 assert.notEqual(M.banks()[0].items[0].answer,'changed');
});
test('each new grade-two lesson uses its own exact unit and can reproduce ten worksheet questions',()=>{
 for(const bank of banks){
  const grade=2,semester=bank.exactSemester;
  const unit=T.units('math',grade,semester).find(u=>u.name===bank.exactUnitName);
  assert.ok(unit,'unit missing '+bank.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim()===bank.exactLessonName);
  assert.ok(lesson,'lesson missing '+bank.exactLessonName);
  const found=E.find(unit,lesson);assert.equal(found?.id,bank.id,'wrong evidence for '+bank.exactLessonName);
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.bankId,bank.id);assert.equal(binding?.kind,'evidence');
  assert.equal(T.capacity(binding,'choice'),16);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'math',grade,semester,unitId:unit.id,lessonId:lesson.id,responseFormat,count:10,seed};
   const sheet=T.generate(options,C);assert.deepEqual(T.generate(options,C),sheet);
   assert.equal(sheet.items.length,10);assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   for(const row of sheet.items){assert.equal(row.curriculumLesson,lesson.id);
    assert.ok(row.answer&&row.explanation);
    if(responseFormat==='choice')assert.ok(row.choices.includes(row.answer));else assert.deepEqual(row.choices,[]);
   }
  }
 }
});
test('clock and calendar arithmetic uses correct minute positions, 24-hour time and weekday rolls',()=>{
 const bank=k=>banks.find(b=>b.id.endsWith('-'+k));
 for(const [i,q]of bank('clock-five').items.entries()){
  const hour=i%12+1,min=(i%11+1)*5;
  assert.equal(q.answer,hour+'시 '+String(min).padStart(2,'0')+'분');
 }
 for(const [i,q]of bank('clock-minute').items.entries()){
  const hour=i%12+1,min=(i%10)*5+i%4+1;
  assert.equal(q.answer,hour+'시 '+String(min).padStart(2,'0')+'분');
 }
 for(const [i,q]of bank('calendar').items.entries()){
  assert.equal(q.answer,['월요일','화요일','수요일','목요일','금요일','토요일','일요일'][(i+1)%7]);
 }
 for(const [i,q]of bank('day-hour').items.entries()){
  const expected=i<8?(i+14)+'시':'오후 '+(i-7)+'시';
  assert.equal(q.answer,expected);
 }
});
test('new grade two scripts load before evidence initialization on the printable worksheet page',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(page.includes('worksheet-math-grade2-numbers-time.js'));
 assert.ok(page.indexOf('worksheet-math-grade2-numbers-time.js')<page.indexOf('worksheet-evidence-banks.js'));
});
