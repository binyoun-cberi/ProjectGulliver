'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Data=require('../worksheet-math-grade2-data-patterns.js');
const Length=require('../worksheet-math-grade2-length.js');
const T=require('../worksheet-learning.js');
const E=require('../worksheet-evidence-banks.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=[...Data.banks(),...Length.banks()];
function find(kind){const r=banks.find(b=>b.id.endsWith('-'+kind));assert.ok(r,'missing bank '+kind);return r;}
test('27 exact grade-two lesson banks contain 432 separately sourced and uniquely answerable questions',()=>{
 assert.equal(Data.banks().length,15);
 assert.equal(Length.banks().length,12);
 assert.equal(banks.length,27);
 assert.equal(banks.flatMap(b=>b.items).length,432);
 const ids=new Set(),lessons=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');
  assert.deepEqual(b.grades,[2]);
  assert.equal(b.items.length,16);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!lessons.has(target),'duplicate lesson '+target);lessons.add(target);
  const prompts=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail,q.scienceMaterial]);
   assert.ok(!prompts.has(key),'repeated problem '+b.id);prompts.add(key);
   assert.equal(q.choices.length,3);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>=16);
   assert.equal(q.knowledgeOnly,true);
   assert.match(q.sourceLabel,/창작/);
   assert.ok(q.choices.every(s=>!/(NaN|undefined)/.test(s)));
   if(q.scienceMaterial){
    assert.equal(q.scienceMaterial.kind,'table');
    assert.ok(q.scienceMaterial.title);
    assert.ok(q.scienceMaterial.rows.length>=3);
   }
  }
 }
 assert.equal(ids.size,432);
 const copy=Data.banks();copy[0].items[0].answer='wrong';
 assert.notEqual(Data.banks()[0].items[0].answer,'wrong');
});
test('all 27 lessons exactly match the existing 2022 textbook and can generate deterministic choice/short sheets',()=>{
 for(const b of banks){
  const semester=b.exactSemester;
  const unit=T.units('math',2,semester).find(x=>x.name===b.exactUnitName);
  assert.ok(unit,b.id+' missing unit '+b.exactUnitName);
  const lesson=unit.lessons.find(x=>x.name.trim()===b.exactLessonName);
  assert.ok(lesson,b.id+' missing lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' evidence mismatch');
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence',b.id);
  assert.equal(binding?.bankId,b.id,b.id);
  assert.equal(T.capacity(binding,'choice'),16);
  assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const format of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'math',grade:2,semester,unitId:unit.id,lessonId:lesson.id,responseFormat:format,count:10,seed};
   const result=T.generate(options,C);
   assert.deepEqual(T.generate(options,C),result,b.id+' reproducibility');
   assert.equal(result.items.length,10);
   assert.equal(result.curriculum.lessonId,lesson.id);
   assert.equal(new Set(result.items.map(q=>q.evidenceId)).size,10);
   for(const row of result.items){
    assert.equal(row.curriculumLesson,lesson.id);
    assert.ok(row.answer&&row.explanation);
    if(format==='choice')assert.ok(row.choices.includes(row.answer));else assert.deepEqual(row.choices,[]);
   }
  }
 }
});
test('picture-graph and tally counts agree with each displayed source table',()=>{
 for(const kind of ['class-count','make-graph','read-graph','table-and-graph','survey-table','class-infer']){
  for(const q of find(kind).items){
   const chart=q.scienceMaterial;
   assert.ok(chart,kind+' '+q.evidenceId);
   const numeric=chart.rows.filter(r=>r[0]!=='전체').map(r=>({
    label:r[0],amount:/●/.test(r[1])?[...r[1]].filter(s=>s==='●').length:Number(r[1].replace('명',''))
   }));
   assert.equal(numeric.length,3);
   assert.ok(numeric.every(x=>x.amount>=1&&x.amount<=12));
   if(['class-count','make-graph'].includes(kind)){
    const name=q.prompt.match(/‘([^’]+)’/)[1];
    const expected=numeric.find(x=>x.label===name);
    assert.ok(expected);
    assert.equal(q.answer,expected.amount+'명');
   }else if(['class-infer','survey-table'].includes(kind)){
    const sum=numeric.reduce((s,x)=>s+x.amount,0);
    assert.equal(q.answer,sum+'명');
   }else if(kind==='table-and-graph'){
    assert.ok(q.answer.includes(numeric[0].label+' '+numeric[0].amount+'명'));
    assert.ok(q.answer.includes(numeric[1].label+' '+numeric[1].amount+'명'));
   }else if(kind==='read-graph'){
    const labels=[...q.prompt.matchAll(/‘([^’]+)’/g)].map(x=>x[1]);
    assert.equal(labels.length,2);
    const diff=Math.abs(numeric.find(x=>x.label===labels[0]).amount-numeric.find(x=>x.label===labels[1]).amount);
    assert.equal(q.answer,diff===0?'같다':diff+'명');
   }
  }
 }
});
test('repeating patterns follow the demonstrated period without skipping symbols',()=>{
 for(const kind of ['tile-pattern1','tile-pattern2','life-pattern']){
  for(const q of find(kind).items){
   const raw=q.detail.split(': ').pop().split(' → ');
   assert.equal(raw.at(-1),'?');
   const cycle=kind==='tile-pattern1'?2:kind==='tile-pattern2'?3:(raw.length-2)/2;
   assert.equal(q.answer,raw[(raw.length-2)%cycle]===raw[0]?raw[1]:raw[(raw.length-2)%cycle+1]);
   assert.ok(raw.length>=6);
  }
 }
});
test('metres/centimetres arithmetic and ruler positions have the correct unique physical quantities',()=>{
 const measure=s=>{const m=s.match(/^(\d+) m (\d+) cm$/);assert.ok(m,s);return Number(m[1])*100+Number(m[2]);};
 for(const kind of ['add-length','subtract-length']){
  for(const q of find(kind).items){
   const chunks=[...q.prompt.matchAll(/(\d+) m (\d+) cm/g)];
   assert.equal(chunks.length,2);
   const x=Number(chunks[0][1])*100+Number(chunks[0][2]);
   const y=Number(chunks[1][1])*100+Number(chunks[1][2]);
   const expected=kind==='add-length'?x+y:x-y;
   assert.equal(measure(q.answer),expected,q.prompt);
   assert.equal(new Set(q.choices.map(measure)).size,3,q.prompt);
  }
 }
 for(const kind of ['ruler-read','ruler-read-advanced','one-centimeter']){
  for(const q of find(kind).items){
   const m=q.prompt.match(/(\d+) cm(?:부터| 눈금에서 시작해 )\s*(\d+) cm(?:까지| 눈금까지)/);
   if(!m)continue;
   assert.equal(q.answer,Number(m[2])-Number(m[1])+' cm');
  }
 }
 for(const [i,q]of find('meter-unit').items.entries()){
  const n=2+Math.floor(i/2);
  assert.equal(q.answer,i%2===0?n*100+' cm':n+' m');
 }
 for(const [i,q]of find('estimate-check').items.entries()){
  assert.equal(q.answer,i%4+2+' cm');
 }
});
test('grade two new scripts are included before core evidence initialization on the printable worksheet page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 for(const script of ['worksheet-math-grade2-data-patterns.js','worksheet-math-grade2-length.js']){
  assert.ok(html.includes(script),script);
  assert.ok(html.indexOf(script)<html.indexOf('worksheet-evidence-banks.js'));
 }
});
