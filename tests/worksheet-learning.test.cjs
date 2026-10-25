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
 assert.equal(all.length,1226);
 for(const lesson of all)assert.ok(T.isCoreLesson(lesson));
 for(const name of ['단원 도입/주제 도입','주제 도입','단원 마무리 / 과학으로 통하는 세상_예시','준비하기','실천하는 과학_작품 만들기','문제로 마무리'])assert.equal(T.isCoreLesson({name}),false,name);
 for(const section of [' 실천하기 ','정리하기','단원 열기'])for(const name of ['발표에 활용할 자료 찾기','인터넷에서 믿을 만한 자료 찾기','매체의 특성을 고려하며 글 쓰기'])assert.equal(T.isCoreLesson({name,section}),false,name);
 for(const name of ['자료를 활용하여 발표하기','연극하기','온라인 전시회를 열어 복합양식 매체 자료 감상하기','바람직한 매체 사용 알림 활동 결과 공유하기','바람직한 매체 사용 알림 활동 하기','수학이랑 만들어요(주사위로 10을 만들어 볼까요)','수학이랑 확인해요(곱셈구구 문제를 해결해 볼까요)'])assert.equal(T.isCoreLesson({name}),false,name);
 for(const name of ['지층은 어떻게 만들어질까요','화석은 어떻게 만들어질까요','물체는 무엇으로 만들어졌을까요','10을 만들어 더해 볼까요','□가 사용된 식을 만들고 □의 값을 구해 볼까요','받침이 있는 글자 바르게 쓰기','흉내 내는 말을 넣어 문장 만들기','토론의 절차와 규칙 이해하기'])assert.equal(T.isCoreLesson({name}),true,name);
 for(const name of ['이야기를 읽고 일이 일어난 차례 정리하기','소개할 내용 정리하기','소비 생활을 실천하기 위한 방법을 알아볼까요','중심 내용 찾기'])assert.equal(T.isCoreLesson({name}),true,name);
 for(const name of ['전자석 만들기','4. 전자석을 만들어 볼까요','규칙 만들기','규칙을 만들어 볼까요(1)','칠교판으로 모양 만들기','작품 만들기','캠페인 결과 공유하기','전시회 열기','태양 고도 측정기를 만들어 볼까요','고유어를 활용한 사례를 조사하여 발표하기','신뢰성 있는 뉴스 만들기','의도를 생각하며 복합양식 매체 자료 만들기'])assert.equal(T.isCoreLesson({name}),false,name);
 const visibleIds=new Set(all.map(l=>l.id));
 for(const unit of T.sourceCatalog)for(const lesson of unit.lessons)if(!T.isCoreLesson(lesson)){
  assert.equal(T.binding(unit,lesson),null);assert.ok(!visibleIds.has(lesson.id));assert.equal(T.lookup(unit.subject,unit.grade,unit.semester,unit.id,lesson.id),null);
 }
});
