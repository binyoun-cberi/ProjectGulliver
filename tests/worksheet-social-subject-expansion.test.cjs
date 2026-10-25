'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const E=require('../worksheet-evidence-banks.js'),T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');

const newItems=E.banks.flatMap(b=>b.items.filter(q=>/^social-(?:geo|world-economy)-/.test(q.evidenceId)));
const targetLessons=T.catalog.filter(u=>u.subject==='social'&&u.grade===6&&u.semester===2).flatMap(u=>u.lessons.map(l=>({unit:u,lesson:l,binding:T.binding(u,l)})));
const identity=q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial,q.readingPassage]);

test('world geography, market, population and international banks add 700 grounded original items',()=>{
 assert.equal(newItems.length,700);
 assert.equal(newItems.filter(q=>q.evidenceId.startsWith('social-geo-')).length,275);
 assert.equal(newItems.filter(q=>q.evidenceId.startsWith('social-world-economy-')).length,425);
 assert.equal(new Set(newItems.map(q=>q.evidenceId)).size,newItems.length);
 for(const q of newItems){
  assert.ok(q.passageId&&q.passageTitle);
  assert.ok(q.detail.length>55);
  assert.equal(q.choices.length,3);
  assert.equal(new Set(q.choices).size,3);
  assert.ok(q.choices.includes(q.answer));
  assert.ok(q.explanation.length>10);
  assert.match(q.prompt,/「.+」/);
 }
});

test('every grade 6 term 2 textbook lesson has twenty non-repeating questions in all formats',()=>{
 assert.equal(targetLessons.length,32);
 let created=0;
 for(const {unit,lesson,binding} of targetLessons){
  assert.ok(binding,'unbound '+lesson.name);
  assert.ok(T.capacity(binding,'choice')>=20,'insufficient '+lesson.name);
  const choices=[];
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const opts={subject:'social',grade:6,semester:2,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed};
   const result=T.generate(opts,C);created++;
   assert.equal(result.items.length,20,lesson.name);
   assert.equal(new Set(result.items.map(identity)).size,20,lesson.name);
   for(const q of result.items){
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice'){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);}
    else assert.equal(q.choices.length,0);
   }
   if(responseFormat==='choice')choices.push(result.items.map(q=>q.evidenceId).sort().join(','));
  }
  assert.ok(new Set(choices).size>1,'alternative seeds repeat the same 20 questions: '+lesson.name);
 }
 assert.equal(created,288);
});

test('curriculum-specific prompts are used, and previously available questions remain',()=>{
 const examples=[
  ['세계의 다양한 지형 경관을 살펴볼까요',/지형·기후/],
  ['온대 기후 지역의 생활 모습을 살펴볼까요',/지형·기후/],
  ['무역을 하는 국가는 서로 어떤 관계일까요',/경제활동/],
  ['세계의 인구 분포 특징을 알아볼까요',/인구 분포/],
  ['지구촌 문제의 해결 방안을 생각해 볼까요',/지구촌 문제/]
 ];
 for(const [fragment,pattern] of examples){
  const x=targetLessons.find(x=>x.lesson.name.includes(fragment));
  assert.ok(x,fragment);
  const b=E.find(x.unit,x.lesson);
  assert.ok(b.items.some(q=>pattern.test(q.prompt)),fragment);
 }
 for(const id of ['world-terrain-life','world-climate-life','economic-work','economic-growth-effects','trade-reason','global-problems']){
  const b=E.banks.find(b=>b.id===id);assert.ok(b&&b.items.some(q=>!/^social-(?:geo|world-economy)-/.test(q.evidenceId)));
 }
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 const find=name=>html.indexOf('src="'+name+'.js');
 assert.ok(find('worksheet-social-geography')>0);
 assert.ok(find('worksheet-social-world-economy')>find('worksheet-social-geography'));
 assert.ok(find('worksheet-evidence-banks')>find('worksheet-social-world-economy'));
});
