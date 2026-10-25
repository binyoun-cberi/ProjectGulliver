'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');

const target=T.catalog.filter(u=>u.subject==='science'&&u.grade===5&&u.semester===2).flatMap(u=>u.lessons.map(lesson=>({unit:u,lesson,binding:T.binding(u,lesson)})));
const scienceBanks=E.banks.filter(b=>b.scienceInvestigation);
const scienceItems=scienceBanks.flatMap(b=>b.items);

test('27 grade-five term-two targets get independent banks with 25 questions and primary records',()=>{
 assert.equal(target.length,27);assert.equal(scienceBanks.length,27);assert.equal(scienceItems.length,675);
 assert.equal(new Set(scienceItems.map(q=>q.evidenceId)).size,675);
 for(const row of target){
  assert.equal(row.binding.kind,'evidence',row.lesson.name);
  assert.equal(T.capacity(row.binding,'choice'),25,row.lesson.name);
  const bank=E.banks.find(b=>b.id===row.binding.bankId);
  assert.equal(bank.exactUnitName,row.unit.name);assert.equal(bank.exactLessonName,row.lesson.name.replace(/^\d+\.\s*/,''));assert.equal(bank.items.length,25);
  assert.equal(new Set(bank.items.map(q=>q.passageId)).size,5);
  assert.equal(bank.items.filter(q=>q.scienceMaterial?.kind==='table').length,1);
  const m=bank.items[0].scienceMaterial;
  assert.ok(m.headers.length>=2&&m.rows.length>=2,m.title);
  for(const dataRow of m.rows)assert.equal(dataRow.length,m.headers.length);
 }
 for(const q of scienceItems){
  assert.ok(q.detail.length>=65,q.evidenceId);
  assert.ok(q.answer&&q.explanation.length>12);
  assert.equal(q.choices.length,3);
  assert.equal(new Set(q.choices).size,3);
  assert.ok(q.choices.includes(q.answer));
  assert.ok(q.passageId&&q.passageTitle);
 }
});

test('all science grade-five term-two lessons generate 20 diverse supported questions in three formats',()=>{
 let tested=0,tableSheets=0;
 for(const {unit,lesson,binding} of target){
  assert.ok(binding);
  const signatures=[];
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const s=T.generate({subject:'science',grade:5,semester:2,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},C);
   tested++;
   assert.equal(s.items.length,20,lesson.name);
   assert.equal(new Set(s.items.map(q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial,q.readingPassage]))).size,20,lesson.name);
   assert.ok(s.items.every(q=>q.answer&&q.explanation),lesson.name);
   if(responseFormat==='choice'){
    signatures.push(s.items.map(q=>q.evidenceId).sort().join(','));
    tableSheets+=Number(s.items.some(q=>q.scienceMaterial?.kind==='table'));
    for(const q of s.items){assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));}
   }else {
    assert.ok(s.items.every(q=>q.choices.length===0));
    if(responseFormat==='essay')assert.ok(s.items.every(q=>q.modelExplanation===q.explanation&&/근거/.test(q.prompt)));
   }
  }
  assert.ok(new Set(signatures).size>1,lesson.name+' does not vary between seeds');
 }
 assert.equal(tested,243);
 assert.ok(tableSheets>=60,'expected frequent data tables in selected worksheets');
});

test('new lessons are selected precisely, no science bank leaks into another grade or term',()=>{
 for(const u of T.catalog.filter(u=>u.subject==='science'))for(const l of u.lessons){
  const bank=T.binding(u,l)?.bankId;
  if(u.grade===5&&u.semester===2)assert.match(bank,/^science-term2-/);
  else assert.ok(!bank?.startsWith('science-term2-'),u.grade+' '+u.semester+' '+l.name);
 }
 const page=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 const script=page.indexOf('src="worksheet-science-term2.js');
 const evidence=page.indexOf('src="worksheet-evidence-banks.js');
 assert.ok(script>=0&&script<evidence,'data script needs to load before the evidence registry');
});
