'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
test('all forty subject/grade/semester combinations preserve source headings and exclude supplements',()=>{
 const combinations=new Set(),ids=new Set();let lessons=0;
 for(const u of T.sourceCatalog){
  combinations.add([u.subject,u.grade,u.semester].join('/'));
  assert.ok(!/\[보완\]|부도|수업보조/.test(u.name));assert.match(u.source,/revisionCode=2022/);
  assert.ok(!ids.has(u.id));ids.add(u.id);
  for(const l of u.lessons){assert.ok(!ids.has(l.id));ids.add(l.id);assert.ok(l.name);lessons++;}
 }
 assert.equal(combinations.size,40);assert.equal(T.sourceCatalog.length,229);assert.equal(lessons,1973);
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


test('structural activities are absent from selectable lessons, while substantive objectives stay',()=>{
 const all=T.catalog.flatMap(u=>u.lessons);
 assert.equal(all.length,1333);
 for(const lesson of all)assert.ok(T.isCoreLesson(lesson));
 for(const name of ['단원 도입/주제 도입','주제 도입','단원 마무리 / 과학으로 통하는 세상_예시','준비하기','실천하는 과학_작품 만들기','문제로 마무리'])assert.equal(T.isCoreLesson({name}),false,name);
 assert.equal(T.isCoreLesson({name:'발표에 활용할 자료 찾기',section:' 실천하기 '}),false);
 for(const name of ['이야기를 읽고 일이 일어난 차례 정리하기','소개할 내용 정리하기','소비 생활을 실천하기 위한 방법을 알아볼까요','중심 내용을 찾으며 독서 계획 실천하기'])assert.equal(T.isCoreLesson({name}),true,name);
 const visibleIds=new Set(all.map(l=>l.id));
 for(const unit of T.sourceCatalog)for(const lesson of unit.lessons)if(!T.isCoreLesson(lesson)){
  assert.ok(!visibleIds.has(lesson.id));assert.equal(T.lookup(unit.subject,unit.grade,unit.semester,unit.id,lesson.id),null);
 }
});
