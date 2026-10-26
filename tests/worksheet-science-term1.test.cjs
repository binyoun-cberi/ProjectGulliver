'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const targets=T.catalog.filter(u=>u.subject==='science'&&u.grade===5&&u.semester===1).flatMap(u=>u.lessons.map(lesson=>({unit:u,lesson,binding:T.binding(u,lesson)})));
const banks=E.banks.filter(b=>b.scienceTermOne),items=banks.flatMap(b=>b.items.filter(q=>!q.scienceDepth));
const identity=q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial,q.readingPassage]);

test('all twenty-six first-term science lessons have at least 25 independently supported questions',()=>{
 assert.equal(targets.length,26);
 assert.equal(banks.length,26);assert.equal(items.length,650);
 assert.equal(new Set(items.map(q=>q.evidenceId)).size,650);
 const groupCounts={};
 for(const {unit,lesson,binding} of targets){
  assert.equal(binding?.kind,'evidence',lesson.name);
  assert.equal(T.capacity(binding,'choice'),25+E.banks.find(b=>b.id===binding.bankId).items.filter(q=>q.scienceDepth).length,lesson.name);
  assert.equal(T.capacity(binding,'essay'),25+E.banks.find(b=>b.id===binding.bankId).items.filter(q=>q.scienceDepth).length,lesson.name);
  const bank=banks.find(x=>x.id===binding.bankId);
  assert.ok(bank,lesson.name);
  assert.equal(bank.exactUnitName,unit.name);
  assert.equal(bank.exactLessonName,lesson.name.replace(/^(?:[①-⑳]|\d+\.)\s*/, '').trim());
  assert.equal(bank.items.filter(q=>!q.scienceDepth).length,25);
  assert.equal(new Set(bank.items.filter(q=>!q.scienceDepth).map(q=>q.passageId)).size,5);
  assert.equal(bank.items.filter(q=>!q.scienceDepth&&q.scienceMaterial?.kind==='table').length,1);
  const table=bank.items[0].scienceMaterial;
  assert.ok(table.rows.length>=2&&table.headers.length>=2,lesson.name);
  for(const row of table.rows)assert.equal(row.length,table.headers.length);
  groupCounts[unit.name]=(groupCounts[unit.name]||0)+1;
 }
 assert.deepEqual(groupCounts,{'지층과 화석':6,'빛의 성질':5,'용해와 용액':7,'우리 몸의 구조와 기능':8});
 for(const q of items){
  assert.ok(q.detail?.length>=65,q.evidenceId);
  assert.ok(q.explanation?.length>10,q.evidenceId);
  assert.ok(q.answer&&q.passageTitle&&q.passageId);
  assert.equal(q.choices.length,3);
  assert.equal(new Set(q.choices).size,3,q.evidenceId);
  assert.ok(q.choices.includes(q.answer));
 }
});

test('twenty independent questions render without repetition for every first-term science objective',()=>{
 let generated=0,hasTable=0,variations=0;
 for(const {unit,lesson} of targets){
  const signatures=[];
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const s=T.generate({subject:'science',grade:5,semester:1,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},C);
   generated++;
   assert.equal(s.items.length,20,lesson.name);
   assert.equal(new Set(s.items.map(identity)).size,20,lesson.name);
   assert.ok(s.items.every(q=>q.answer&&q.explanation),lesson.name);
   if(responseFormat==='choice'){
    signatures.push(s.items.map(q=>q.evidenceId).sort().join(','));
    hasTable+=Number(s.items.some(q=>q.scienceMaterial?.kind==='table'));
    for(const q of s.items){assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));}
   }else{
    assert.ok(s.items.every(q=>q.choices.length===0));
    if(responseFormat==='essay')assert.ok(s.items.every(q=>q.modelExplanation===q.explanation&&/근거/.test(q.prompt)));
   }
  }
  if(new Set(signatures).size>1)variations++;
 }
 assert.equal(generated,234);
 assert.equal(variations,26);
 assert.equal(hasTable,78);
});

test('first term banks stay within their exact grade and semester, and load before the evidence registry',()=>{
 for(const unit of T.catalog.filter(x=>x.subject==='science'))for(const lesson of unit.lessons){
  const bankId=T.binding(unit,lesson)?.bankId;
  if(unit.grade===5&&unit.semester===1)assert.ok(bankId?.startsWith('science-term1-'),lesson.name);
  else assert.ok(!bankId?.startsWith('science-term1-'),unit.grade+'-'+unit.semester+' '+lesson.name);
 }
 const html=fs.readFileSync(path.resolve(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.indexOf('src="worksheet-science-term1.js')>0);
 assert.ok(html.indexOf('src="worksheet-science-term1.js')<html.indexOf('src="worksheet-evidence-banks.js'));
});
