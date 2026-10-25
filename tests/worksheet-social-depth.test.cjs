'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js');
const C=require('../daily-worksheet-core.js');

const ids=[
 'place-help','reasonable-choice','exchange','democratic-decision','culture-respect',
 'map-purpose','geographic-info','environment-types','population-distribution',
 'power-division','assembly-role','government-role','court-role','household-firm',
 'trade-cooperation','population-structure','sustainable-future','aging-birth','communication-change'
];

test('expanded social banks have 20 distinct, evidence-grounded questions and valid distractors',()=>{
 const questionIds=new Set();
 for(const id of ids){
  const b=E.banks.find(x=>x.id===id);
  assert.ok(b,'missing '+id);
  assert.ok(b.items.length>=20,id);
  const prompts=new Set(b.items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial])));
  assert.equal(prompts.size,b.items.length,id+' duplicated content');
  for(const q of b.items){
   assert.ok(!questionIds.has(q.evidenceId),q.evidenceId);
   questionIds.add(q.evidenceId);
   assert.equal(q.choices.length,3,q.evidenceId);
   assert.equal(new Set(q.choices).size,3,q.evidenceId);
   assert.ok(q.choices.includes(q.answer),q.evidenceId);
   assert.ok(q.explanation.length>=11,q.evidenceId);
   assert.ok(q.detail?.length>15||q.scienceMaterial,q.evidenceId);
  }
 }
 const newlyAuthored=[...questionIds].filter(id=>id.startsWith('social-depth-'));
 assert.equal(newlyAuthored.length,285);
});

test('all lessons using expanded social banks support 20 real questions without repetition',()=>{
 let covered=0;
 for(const u of T.catalog.filter(x=>x.subject==='social'))for(const l of u.lessons){
  const b=T.binding(u,l);
  if(!ids.includes(b?.bankId))continue;
  covered++;
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const options={subject:'social',grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20,seed,responseFormat};
   const sheet=T.generate(options,C);
   assert.deepEqual(sheet,T.generate(options,C),'seed is not reproducible: '+l.name);
   assert.equal(sheet.items.length,20,l.name);
   assert.equal(new Set(sheet.items.map(q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size,20,l.name);
   for(const q of sheet.items){
    assert.ok(q.explanation,q.evidenceId);
    assert.ok(q.answer,q.evidenceId);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer),q.evidenceId);
    else assert.equal(q.choices.length,0,q.evidenceId);
   }
  }
 }
 assert.equal(covered,34);
});

test('social curriculum coverage is measured against actual selectable textbook lessons',()=>{
 const grades=new Map();
 for(const u of T.catalog.filter(u=>u.subject==='social'))for(const l of u.lessons){
  const b=T.binding(u,l),n=T.capacity(b,'choice');
  const r=grades.get(u.grade)||{total:0,ready:0};
  r.total++;if(n>=20)r.ready++;
  grades.set(u.grade,r);
 }
 assert.deepEqual([...grades.entries()],[ [3,{total:45,ready:7}],[4,{total:49,ready:19}],[5,{total:54,ready:22}],[6,{total:59,ready:8}] ]);
});

test('worksheet browser loads the supplemental bank before the evidence binding',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 const depth=html.indexOf('src="worksheet-social-depth.js');
 const evidence=html.indexOf('src="worksheet-evidence-banks.js');
 assert.ok(depth>=0&&evidence>depth);
});
