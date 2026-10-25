'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js'),T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
test('fifteen original banks contain seventy-five complete, independent evidence questions',()=>{
 assert.equal(E.banks.length,15);assert.equal(E.banks.reduce((n,b)=>n+b.items.length,0),75);
 const ids=new Set();for(const b of E.banks)for(const q of b.items){
  assert.ok(!ids.has(q.evidenceId));ids.add(q.evidenceId);
  assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));
  assert.ok(q.detail?.length>15||q.scienceMaterial?.rows.length);assert.ok(q.explanation.length>20);
  if(q.scienceMaterial){assert.equal(q.scienceMaterial.kind,'table');for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}
 }
});
test('all authored banks are reachable from an actual lesson; specific past sources never borrow other evidence types',()=>{
 const reached=new Set(),cases=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||T.binding(u,l)?.kind!=='evidence')continue;reached.add(b.id);if(/일기와 편지|사진과 그림|오래된 물건|노래 가사와 신문/.test(l.name))cases.push([u,l,b]);}
 assert.deepEqual([...reached].sort(),E.banks.map(b=>b.id).sort());assert.ok(cases.length>=4);
 for(const [u,l,b] of cases){
  const s=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:b.items.length,responseFormat:'choice',seed:7},C);
  if(/일기와 편지/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-1']);
  if(/오래된 물건/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-3']);
  if(/사진과 그림/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId).sort(),['past-sources-2','past-sources-4']);
  if(/노래 가사와 신문/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-5']);
 }
});
test('numeric answers and the limits of inference have evidence in the displayed records',()=>{
 const scale=E.banks.find(b=>b.id==='map-scale').items;
 assert.equal(scale[1].answer,'300 m');assert.match(scale[1].detail,/1 cm.*100 m.*3 cm/);
 assert.equal(scale[4].answer,'3 cm');assert.match(scale[4].detail,/200 m/);
 const buying=E.banks.find(b=>b.id==='reasonable-choice').items;
 const shipping=buying[1].scienceMaterial.rows;assert.ok(Number.parseInt(shipping[0][1])+Number.parseInt(shipping[0][2])<Number.parseInt(shipping[1][1])+Number.parseInt(shipping[1][2]));assert.equal(buying[1].answer,'가 가게');
 const water=E.banks.find(b=>b.id==='evaporation').items[4];const amounts=water.scienceMaterial.rows.map(r=>Number.parseInt(r[1])-Number.parseInt(r[2]));assert.deepEqual(amounts,[20,5]);assert.match(water.answer,/이 조건/);assert.match(water.explanation,/20 mL.*5 mL/);
});
test('essay conversion preserves source evidence and rationale without claiming an unshown picture',()=>{
 const before=JSON.stringify(E.banks);
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||T.binding(u,l)?.kind!=='evidence')continue;
  const s=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:Math.min(5,b.items.length),responseFormat:'essay',seed:42},C);
  for(const q of s.items){assert.match(q.prompt,/근거/);assert.equal(q.modelExplanation,q.explanation);assert.equal(q.choices.length,0);assert.ok(q.detail||q.scienceMaterial);}
 }
 assert.equal(JSON.stringify(E.banks),before);
});
