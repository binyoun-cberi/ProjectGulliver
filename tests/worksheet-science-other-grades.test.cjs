'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js'),T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const targets=T.catalog.filter(u=>u.subject==='science'&&u.semester===1&&[3,4,6].includes(u.grade)).flatMap(u=>u.lessons.map(lesson=>({unit:u,lesson,binding:T.binding(u,lesson)})));
const banks=E.banks.filter(x=>x.scienceOtherGrades),items=banks.flatMap(b=>b.items);
const sig=q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial,q.readingPassage]);

test('all 73 other-grade first-semester science lessons are matched precisely',()=>{
 assert.equal(targets.length,73);assert.equal(banks.length,73);assert.equal(items.length,1825);
 assert.equal(new Set(items.map(q=>q.evidenceId)).size,1825);
 for(const {unit,lesson,binding} of targets){
  assert.equal(binding?.kind,'evidence',lesson.name);
  assert.equal(T.capacity(binding,'choice'),25,lesson.name);
  const b=banks.find(b=>b.id===binding.bankId);
  assert.ok(b,lesson.name);
  assert.equal(b.exactUnitName,unit.name);assert.equal(b.exactSemester,unit.semester);
  assert.equal(b.exactLessonName,lesson.name.replace(/^(?:[①-⑳]|\d+\.)\s*/, '').trim());
  assert.equal(b.items.length,25);
  assert.equal(new Set(b.items.map(x=>x.passageId)).size,5);
  assert.equal(b.items.filter(x=>x.scienceMaterial?.kind==='table').length,1);
  const m=b.items[0].scienceMaterial;
  assert.equal(m.rows.length,5);
  for(const row of m.rows)assert.equal(row.length,m.headers.length);
 }
 for(const q of items){
  assert.ok(q.answer&&q.explanation?.length>10&&q.detail?.length>20,q.evidenceId);
  assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3,q.evidenceId);
  assert.ok(q.choices.includes(q.answer));
  assert.ok(q.passageId&&q.passageTitle);
 }
});

test('every target can create 20 unique questions in all formats and three seeds',()=>{
 let generated=0,variant=0,tableSheets=0;
 for(const {unit,lesson} of targets){
  const choiceSigs=[];
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const paper=T.generate({subject:'science',grade:unit.grade,semester:1,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},C);
   generated++;
   assert.equal(paper.items.length,20,lesson.name);
   assert.equal(new Set(paper.items.map(sig)).size,20,lesson.name);
   for(const q of paper.items){
    assert.ok(q.answer&&q.explanation,lesson.name);
    if(responseFormat==='choice'){
     assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));
    }else {
     assert.equal(q.choices.length,0);
     if(responseFormat==='essay')assert.ok(q.modelExplanation===q.explanation&&/근거/.test(q.prompt));
    }
   }
   if(responseFormat==='choice'){
    choiceSigs.push(paper.items.map(q=>q.evidenceId).sort().join(','));
    tableSheets+=Number(paper.items.some(q=>q.scienceMaterial?.kind==='table'));
   }
  }
  variant+=Number(new Set(choiceSigs).size>1);
 }
 assert.equal(generated,657);
 assert.equal(variant,73);
 assert.ok(tableSheets>=175,'Expected observation tables in most generated sheets');
});

test('grade five banks remain intact and grade three four six new banks do not leak into semester two',()=>{
 for(const unit of T.catalog.filter(x=>x.subject==='science'))for(const lesson of unit.lessons){
  const id=T.binding(unit,lesson)?.bankId;
  if([3,4,6].includes(unit.grade)&&unit.semester===1)assert.ok(id?.startsWith('science-rework-'),lesson.name);
  else assert.ok(!id?.startsWith('science-rework-'),unit.grade+'-'+unit.semester+' '+lesson.name);
 }
 const html=fs.readFileSync(path.resolve(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.indexOf('src="worksheet-science-other-grades.js')>0);
 assert.ok(html.indexOf('src="worksheet-science-other-grades.js')<html.indexOf('src="worksheet-evidence-banks.js'));
 const gradeFive=T.catalog.filter(x=>x.subject==='science'&&x.grade===5);
 assert.equal(gradeFive.flatMap(x=>x.lessons).length,53);
 for(const unit of gradeFive)for(const lesson of unit.lessons)assert.equal(T.capacity(T.binding(unit,lesson),'choice'),25);
});
