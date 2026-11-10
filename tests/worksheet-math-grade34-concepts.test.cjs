'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../worksheet-math-grade3-concepts');
const B=require('../worksheet-math-grade4-geometry');
const E=require('../worksheet-evidence-banks');
const T=require('../worksheet-learning');
const C=require('../daily-worksheet-core');
const fs=require('node:fs'),path=require('node:path');
const banks=[...A.banks(),...B.banks()];
test('49 grade 3–4 banks contain 782 original, uniquely identified and answerable items',()=>{
 assert.equal(A.banks().length,28);assert.equal(B.banks().length,21);
 assert.equal(banks.length,49);
 const ids=new Set(),targets=new Set(),total=banks.reduce((n,b)=>n+b.items.length,0);
 assert.equal(total,782);
 for(const b of banks){
  assert.ok([3,4].includes(b.grades[0]));
  const target=[b.grades[0],b.exactSemester,b.exactUnitName,b.exactLessonName].join('/');
  assert.ok(!targets.has(target),'duplicate target '+target);targets.add(target);
  assert.ok(b.items.length>=12&&b.items.length<=20);
  const prompts=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),'duplicate ID '+q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail]);assert.ok(!prompts.has(key),'duplicate problem '+b.id);prompts.add(key);
   assert.equal(q.choices.length,3);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>=15);
   assert.match(q.sourceLabel,/창작/);
   assert.ok(q.knowledgeOnly);
   assert.ok(!q.choices.some(c=>/NaN|undefined/.test(c)));
  }
 }
 assert.equal(ids.size,782);
 const copy=A.banks();copy[0].items[0].answer='wrong';assert.notEqual(A.banks()[0].items[0].answer,'wrong');
});
test('each bank is reached by its exact 2022 textbook lesson and supports reproducible selected worksheets',()=>{
 for(const b of banks){
  const grade=b.grades[0],semester=b.exactSemester;
  const unit=T.units('math',grade,semester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,'unit missing: '+b.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.replace(/^\d+\.\s*/,'').trim()===b.exactLessonName);
  assert.ok(lesson,'lesson missing: '+b.exactLessonName);
  const e=E.find(unit,lesson);
  assert.equal(e?.id,b.id,'wrong exact bank for '+b.exactLessonName);
  const bound=T.binding(unit,lesson);
  assert.equal(bound?.kind,'evidence');
  assert.equal(bound?.bankId,b.id);
  assert.deepEqual(T.formats(bound).map(x=>x[0]),['choice','short']);
  assert.equal(T.capacity(bound,'choice'),b.items.length);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const args={subject:'math',grade,semester,unitId:unit.id,lessonId:lesson.id,
    count:Math.min(10,b.items.length),seed,responseFormat};
   const sheet=T.generate(args,C);
   assert.deepEqual(T.generate(args,C),sheet);
   assert.equal(sheet.items.length,args.count);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,args.count);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.ok(sheet.items.every(x=>x.curriculumLesson===lesson.id&&x.answer&&x.explanation));
   for(const x of sheet.items){if(responseFormat==='choice')assert.ok(x.choices.includes(x.answer));else assert.deepEqual(x.choices,[]);}
  }
 }
});
test('distractors for seconds, metric units, weight and capacity are not equivalent quantities',()=>{
 const kinds=['time-add','time-sub','weight-operate','capacity-operate'];
 function amount(input,first,second,ratio){
  const m=input.match(new RegExp('(\\d+)\\s*'+first+'\\s*(\\d+)\\s*'+second));
  assert.ok(m,input);return Number(m[1])*ratio+Number(m[2]);
 }
 for(const b of banks.filter(b=>kinds.some(k=>b.id.endsWith('-'+k)))){
  for(const row of b.items){
   const unit=b.id.endsWith('time-add')||b.id.endsWith('time-sub')?['분','초',60]:
    b.id.endsWith('weight-operate')?['kg','g',1000]:['L','mL',1000];
   const quantities=row.choices.map(x=>amount(x,...unit));
   assert.equal(new Set(quantities).size,3,row.prompt+' '+row.choices);
  }
 }
});
test('grade 4 geometry examples satisfy angle sums and shape classification',()=>{
 const byKind=kind=>banks.find(b=>b.id.includes('math-g4-shapes-')&&b.id.includes('-'+kind+'-'));
 for(const row of byKind('triangle-acute-obtuse').items){
  const angles=[...row.prompt.matchAll(/(\d+)°/g)].map(x=>Number(x[1]));
  assert.equal(angles.reduce((s,v)=>s+v,0),180);
  const t=angles.includes(90)?'직각삼각형':angles.some(x=>x>90)?'둔각삼각형':'예각삼각형';
  assert.equal(row.answer,t);
 }
 for(const row of byKind('angle-estimate').items){
  const h=Number(row.prompt.match(/정각 (\d+)시/)[1]);
  assert.equal(row.answer,Math.min(h,12-h)*30+'°');
 }
});
test('grade 3–4 new scripts are loaded before evidence registration on the print page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const name of ['worksheet-math-grade3-concepts.js','worksheet-math-grade4-geometry.js']){
  assert.ok(html.includes(name),name);
  assert.ok(html.indexOf(name)<html.indexOf('worksheet-evidence-banks.js'));
 }
});
