'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../worksheet-math-lesson-depth');
const S=require('../worksheet-social-source-depth');
const E=require('../worksheet-evidence-banks');
const T=require('../worksheet-learning');
const C=require('../daily-worksheet-core');
const fs=require('node:fs'),path=require('node:path');

const mathLessons=['평균을 알아봐요','평균을 구해요','일이 일어날 가능성을 알아봐요','일이 일어날 가능성을 수로 나타내요'];
const socialLessons=['시간을 표현하는 말을','오래된 물건을 통해','일기와 편지를 통해','사진과 그림을 통해'];
const allLessons=T.catalog.flatMap(u=>u.lessons.map(l=>({unit:u,lesson:l,binding:T.binding(u,l)})));
const matching=(subject,grade,parts)=>allLessons.filter(x=>x.unit.subject===subject&&x.unit.grade===grade&&parts.some(part=>x.lesson.name.includes(part)));

test('original maths bank: four exact grade-five lessons, 25 complete questions each',()=>{
 const banks=M.banks();assert.equal(banks.length,4);
 const all=banks.flatMap(b=>b.items);assert.equal(all.length,100);
 assert.equal(new Set(all.map(q=>q.evidenceId)).size,100);
 for(const b of banks){
  assert.equal(b.items.length,25);assert.ok(mathLessons.includes(b.exactLessonName));
  assert.equal(b.exactUnitName,'평균과 가능성');assert.equal(b.exactSemester,2);
  assert.equal(new Set(b.items.map(q=>q.passageId)).size,5);
  for(const q of b.items){assert.ok(q.prompt&&q.answer&&q.explanation&&q.detail);assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));}
 }
 const copy=M.banks();copy[0].items[0].choices[0]='changed';assert.notEqual(M.banks()[0].items[0].choices[0],'changed');
});

test('original social bank: eighty age-appropriate fictional source questions',()=>{
 const items=S.items();assert.equal(items.length,80);assert.equal(new Set(items.map(q=>q.evidenceId)).size,80);
 const counts={};for(const q of items){counts[q.socialSourceFocus]=(counts[q.socialSourceFocus]||0)+1;assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));assert.ok(q.prompt&&q.explanation&&q.detail);assert.match(q.sourceLabel,/가상/);}
 assert.deepEqual(counts,{time:20,object:20,diary:20,photo:20});
 assert.equal(new Set(items.map(q=>q.passageId)).size,16);
 const copy=S.items();copy[0].choices[0]='changed';assert.notEqual(S.items()[0].choices[0],'changed');
});

test('all eight selected lessons can generate 20 nonduplicated questions in each answer mode',()=>{
 const targets=[...matching('math',5,mathLessons),...matching('social',3,socialLessons)];
 assert.equal(targets.length,8);
 let sheets=0;
 for(const {unit:u,lesson:l,binding:b} of targets){
  assert.ok(b,u.name+' / '+l.name);assert.equal(b.kind,'evidence');
  assert.ok(T.capacity(b,'choice')>=20,u.name+' / '+l.name);
  for(const format of ['choice','short','essay'])for(const seed of [7,42,101]){
   const opts={subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,responseFormat:format,count:20,seed};
   const sheet=T.generate(opts,C);assert.deepEqual(T.generate(opts,C),sheet);
   assert.equal(sheet.items.length,20);assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,20);
   for(const q of sheet.items){assert.ok(q.prompt&&q.answer&&q.explanation);if(format==='choice'){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);}else assert.equal(q.choices.length,0);}
   sheets++;
  }
 }
 assert.equal(sheets,72);
});

test('historical micro-lessons retain old source questions and do not leak into unrelated lessons',()=>{
 const matches=matching('social',3,socialLessons);
 for(const {unit:u,lesson:l,binding:b}of matches){const selected=E.find(u,l),old=E.banks.find(row=>row.id===b.bankId).items.filter(q=>!q.socialSourceFocus);
  assert.ok(selected.items.some(q=>old.some(o=>o.evidenceId===q.evidenceId)),l.name);
  const expected=l.name.includes('시간을 표현하는')?'time':l.name.includes('오래된 물건')?'object':l.name.includes('일기와 편지')?'diary':'photo';
  assert.ok(selected.items.filter(q=>q.socialSourceFocus).every(q=>q.socialSourceFocus===expected),l.name);
 }
 const unrelated=allLessons.filter(x=>x.unit.subject==='social'&&x.unit.grade===3&&x.binding&&['timeline','past-sources'].includes(x.binding.bankId)&&!socialLessons.some(word=>x.lesson.name.includes(word)));
 assert.ok(unrelated.length>0);for(const {unit:u,lesson:l} of unrelated)assert.ok(!E.find(u,l).items.some(q=>q.socialSourceFocus),l.name);
});

test('browser loads new content before evidence registration',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const src of ['worksheet-social-source-depth.js','worksheet-math-lesson-depth.js']){
  assert.ok(html.includes(src));assert.ok(html.indexOf(src)<html.indexOf('worksheet-evidence-banks.js'));
 }
});
