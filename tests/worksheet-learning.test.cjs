'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
test('all forty subject/grade/semester combinations preserve source headings and exclude supplements',()=>{
 const combinations=new Set(),ids=new Set();let lessons=0;
 for(const u of T.catalog){
  combinations.add([u.subject,u.grade,u.semester].join('/'));
  assert.ok(!/\[보완\]|부도|수업보조/.test(u.name));assert.match(u.source,/revisionCode=2022/);
  assert.ok(!ids.has(u.id));ids.add(u.id);
  for(const l of u.lessons){assert.ok(!ids.has(l.id));ids.add(l.id);assert.ok(l.name);lessons++;}
 }
 assert.equal(combinations.size,40);assert.equal(T.catalog.length,229);assert.equal(lessons,1973);
});
test('every enabled learning target generates exactly its requested count and format, deterministically',()=>{
 const coverage={};
 for(const u of T.catalog)for(const l of u.lessons){
  const b=T.binding(u,l);if(!b)continue;coverage[u.subject]=(coverage[u.subject]||0)+1;
  for(const count of T.counts(b))for(const [responseFormat] of T.formats(b))for(const seed of [7,42]){
   const o={subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count,seed,responseFormat};
   const s=T.generate(o,C);assert.deepEqual(s,T.generate(o,C));assert.equal(s.items.length,count);
   assert.equal(new Set(s.items.map(q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size,count);
   assert.equal(s.curriculum.lessonId,l.id);assert.equal(s.alignment,null);
   for(const q of s.items){assert.equal(q.curriculumLesson,l.id);assert.ok(q.answer);assert.ok(q.explanation);if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.equal(q.choices.length,0);}
  }
 }
 assert.deepEqual(Object.keys(coverage).sort(),['korean','math','science','social']);console.log('Ready learning targets:',coverage);
});
test('pending lessons, wrong semesters, invalid formats and over-capacity requests cannot fall back',()=>{
 const u=T.catalog.find(u=>u.lessons.some(l=>!T.binding(u,l))),l=u.lessons.find(l=>!T.binding(u,l));
 const o={subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:5,seed:42};
 assert.throws(()=>T.generate(o,C),/준비 중/);
 assert.throws(()=>T.generate({...o,semester:u.semester===1?2:1},C),/다시 골라/);
 const v=T.catalog.find(u=>u.lessons.some(l=>T.binding(u,l)?.kind==='science')),w=v.lessons.find(l=>T.binding(v,l)?.kind==='science');
 const ready={subject:v.subject,grade:v.grade,semester:v.semester,unitId:v.id,lessonId:w.id,count:20,seed:42,responseFormat:'choice'};
 assert.throws(()=>T.generate(ready,C),/문항 수/);assert.throws(()=>T.generate({...ready,count:1,responseFormat:'ox'},C),/문제 유형/);
});
