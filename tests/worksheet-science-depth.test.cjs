'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-science-depth'),E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core');
const ids=[...new Set(D.items().map(q=>q.bankId))];
function target(id){for(const u of T.catalog)for(const l of u.lessons)if(T.binding(u,l)?.bankId===id)return {subject:'science',grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20};throw Error(id);}
test('160 new science questions reach eight precise objectives with 24 tables and eight diagrams',()=>{
 const rows=D.items();assert.equal(rows.length,160);assert.equal(ids.length,8);assert.equal(D.cases().length,32);assert.equal(new Set(rows.map(q=>q.evidenceId)).size,160);
 assert.equal(D.cases().filter(c=>c.material.kind==='table').length,24);assert.equal(D.cases().filter(c=>c.material.kind==='diagram').length,8);
 const grades={};for(const id of ids){const o=target(id),b=E.banks.find(b=>b.id===id);grades[o.grade]=(grades[o.grade]||0)+20;assert.equal(b.items.length,45);assert.equal(b.items.filter(q=>q.scienceDepth).length,20);assert.equal(new Set(b.items.map(q=>JSON.stringify([q.prompt,q.detail]))).size,45);}
 assert.deepEqual(grades,{3:40,4:40,5:40,6:40});
 for(const q of rows){assert.ok(q.detail.length>=45,q.evidenceId);assert.ok(q.explanation.length>15,q.evidenceId);assert.match(q.source,/^https:\/\//);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));const m=q.scienceMaterial;assert.ok(m.note.includes('학습')||m.note.includes('수업'));if(m.kind==='table')for(const row of m.rows)assert.equal(row.length,m.headers.length);else{assert.equal(m.viewBox,'0 0 480 160');assert.ok(m.body.includes('<text'));assert.doesNotMatch(m.body,/<script|onload=|https?:/);}}
 assert.equal(E.banks.filter(b=>b.subject==='science').flatMap(b=>b.items).length,5100);
});
test('each science target draws two disjoint full sheets in choice, short and essay formats',()=>{
 let sheets=0;
 for(const id of ids)for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101,2026]){
  const o={...target(id),responseFormat,seed},a=T.generate(o,C),b=T.generate({...o,seed:seed+1,excludeEvidenceIds:a.items.map(q=>q.evidenceId)},C);sheets+=2;
  assert.equal(a.items.length,20);assert.equal(b.items.length,20);assert.ok(b.items.every(q=>!a.items.some(x=>x.evidenceId===q.evidenceId)));
  for(const sheet of [a,b]){assert.deepEqual(T.generate({...o,seed:sheet.seed,itemIndexes:sheet.items.map(q=>q.poolIndex)},C),sheet);if(responseFormat!=='choice')assert.ok(sheet.items.every(q=>!q.choices.length));const groups=new Set();for(const q of sheet.items.filter(q=>q.scienceDepth)){if(groups.has(q.readingGroup)){assert.equal(q.scienceMaterial,undefined);assert.equal(q.readingPassage,undefined);}else{assert.ok(q.scienceMaterial&&q.readingPassage);groups.add(q.readingGroup);}}}
 }
 console.log('Science depth checked sheets:',sheets);
});
test('partial selections always carry their own table or diagram even when original first question is absent',()=>{
 for(const id of ids){const bank=E.banks.find(b=>b.id===id),indexes=bank.items.map((q,i)=>q.scienceDepth&&!q.evidenceId.endsWith('-1')?i:-1).filter(i=>i>=0).slice(-5),s=T.generate({...target(id),count:5,seed:42,responseFormat:'choice',itemIndexes:indexes},C),seen=new Set();for(const q of s.items){assert.ok(!q.evidenceId.endsWith('-1'));if(!seen.has(q.readingGroup)){assert.ok(q.scienceMaterial);assert.ok(q.readingPassage);seen.add(q.readingGroup);}else assert.equal(q.scienceMaterial,undefined);}}
});
test('numerical answers match the supplied records and cumulative and unit conversions stay distinct',()=>{
 const m=new Map(D.items().map(q=>[q.evidenceId,q]));
 for(const [key,answers] of Object.entries({'seed-time':['4개','4개'],'gas-syringe':['20 mL','20 mL'],'gas-release':['25 mL','13 mL'],'gas-model':[null,'절반'],'solution-limit':['25 g','20 g'],'solution-leftover':['15 g','5 g'],'heat-rod':[null,'12℃'],'heat-time':['31℃','13℃'],'speed-equal-time':['3 m/s','2 m/s'],'speed-equal-distance':['4 m/s','3 m/s',null,'1 m/s'],'speed-units':['6 m','3 m/s','4 m/s'],'speed-positions':['16 m','4 m/s','8 m']}))answers.forEach((a,i)=>{if(a)assert.equal(m.get('science-depth-'+key+'-'+(i+1)).answer,a);});
 assert.match(m.get('science-depth-solution-speed-4').answer,/알 수 없다/);assert.match(m.get('science-depth-gas-syringe-4').answer,/같은 공기/);assert.match(m.get('science-depth-pitch-ruler-4').answer,/알 수 없다/);
});
