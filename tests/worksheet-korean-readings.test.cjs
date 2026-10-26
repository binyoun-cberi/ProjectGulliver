'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const K=require('../worksheet-korean-readings'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core');
const targets=T.catalog.filter(u=>u.subject==='korean').flatMap(unit=>unit.lessons.map(lesson=>({unit,lesson,binding:K.find(unit,lesson)}))).filter(t=>t.binding);
function options(t,extra={}){return {subject:'korean',grade:t.unit.grade,semester:t.unit.semester,unitId:t.unit.id,lessonId:t.lesson.id,count:20,responseFormat:'choice',seed:42,...extra};}
test('new readings and reused readings have complete questions, distinct choices and reviewed explanations',()=>{
 const original=K.authored();assert.equal(original.length,50);assert.equal(original.filter(p=>p.genre==='poetry').length,24);
 assert.equal(new Set(original.map(p=>p.id)).size,50);
 for(const p of original){
  assert.equal(p.questions.length,5);assert.equal(p.rationales.length,5);assert.equal(p.skills.length,5);
  assert.ok(p.passage.length>65,p.title);if(p.genre==='poetry')assert.ok(p.passage.includes('\n'),p.title);
  for(const [i,q] of p.questions.entries()){assert.ok(q[0]);assert.equal(new Set(q.slice(1)).size,q.length-1,p.title);assert.ok(p.rationales[i].length>10,p.title);assert.ok(p.skills[i]);}
 }
 for(const grade of [3,4,5,6])for(const p of K.inventory(grade)){
  assert.ok(!p.minGrade||p.minGrade<=grade,p.title);
  assert.equal(p.questions.length,p.skills.length);assert.equal(p.questions.length,p.rationales.length);
  for(const explanation of p.rationales)assert.ok(explanation.length>10,p.title);
 }
 const cloned=C.readingInventory(4),first=cloned[0].title;cloned[0].title='changed';assert.equal(C.readingInventory(4)[0].title,first);
 assert.throws(()=>C.readingInventory(7),/学年|학년/);
});
test('all 32 explicit lesson rules are reachable without enabling unrelated activities',()=>{
 assert.equal(targets.length,32);assert.equal(K.rules.length,32);
 for(const [grade,name] of K.rules)assert.ok(targets.some(t=>t.unit.grade===grade&&t.lesson.name.trim()===name),name);
 const all=T.catalog.filter(u=>u.subject==='korean');
 assert.equal(all.flatMap(u=>u.lessons.filter(l=>T.binding(u,l))).length,47);
 assert.equal(K.find({subject:'korean',grade:5},{name:'뉴스나 면담 영상 보기'}),null);
 assert.equal(K.find({subject:'social',grade:5},{name:K.rules[0][1]}),null);
 for(const t of targets)for(const [format] of T.formats(t.binding)){
  const n=Math.max(...T.counts(t.binding,format));const sheet=T.generate(options(t,{count:n,responseFormat:format}),C);
  assert.equal(sheet.items.length,n);assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,n);
  const groups=new Set();for(const q of sheet.items){
   if(!groups.has(q.readingGroup)){assert.ok(q.readingPassage);assert.ok(q.readingTitle);groups.add(q.readingGroup);}else assert.equal(q.readingPassage,undefined);
   assert.ok(q.answer);assert.ok(q.explanation);assert.equal(q.choices.length>0,format==='choice');
  }
 }
});
test('full story, explanation and poetry pools support two fresh twenty-question sheets and saved replay',()=>{
 for(const t of targets.filter(t=>['story','nonfiction','poetry'].includes(t.binding.koreanProfile))){
  const first=T.generate(options(t),C),ids=first.items.map(q=>q.evidenceId);
  const second=T.generate(options(t,{seed:43,excludeEvidenceIds:ids}),C);
  assert.equal(second.items.length,20);assert.ok(second.items.every(q=>!ids.includes(q.evidenceId)));
  assert.deepEqual(T.generate(options(t,{seed:43,itemIndexes:second.items.map(q=>q.poolIndex)}),C),second);
 }
});
test('narrow figurative lessons retain genre and skill filters and expose their actual capacity',()=>{
 for(const name of ['시에 나타난 비유적 표현 알기','이야기에 나타난 비유적 표현 알기']){
  const t=targets.find(t=>t.lesson.name.trim()===name),genre=name.startsWith('시에')?'poetry':'literary';
  assert.ok(t.binding.pool.every(q=>q.readingGenre===genre&&q.koreanSkill==='figurative'));
  assert.ok(T.counts(t.binding,'choice').includes(20));const sheet=T.generate(options(t),C);assert.equal(sheet.items.length,20);
 }
 for(const grade of [3,4,5,6])for(const s of T.standards('korean',grade).filter(s=>K.standardCoverage(s.code).length)){
  const newItems=s.binding.pool.filter(q=>q.evidenceId.startsWith('kr-'));
  assert.deepEqual(newItems.map(q=>q.evidenceId),K.standardPool(s.code,grade).map(q=>q.evidenceId));
  const allowed=new Set(K.inventory(grade).map(p=>p.title));assert.ok(newItems.every(q=>allowed.has(q.passageTitle)));
 }
});
