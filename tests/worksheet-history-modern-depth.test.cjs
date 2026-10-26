'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../data/history-modern-depth'),E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core');
const bankIds=[...new Set(D.items().map(q=>q.bankId))];
function options(bankId){for(const u of T.catalog)for(const l of u.lessons)if(T.binding(u,l)?.bankId===bankId)return {subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20};throw Error(bankId);}
test('175 new questions are sourced, unique and reachable in seven weaker history areas',()=>{
 const rows=D.items();assert.equal(rows.length,175);assert.equal(bankIds.length,7);assert.equal(D.chapters().length,35);assert.equal(new Set(rows.map(q=>q.evidenceId)).size,175);assert.equal(new Set(rows.map(q=>q.prompt)).size,175);
 for(const id of bankIds){const b=E.banks.find(b=>b.id===id);assert.equal(b.items.filter(q=>q.modernDepth).length,25);assert.ok(b.items.length>=50);assert.equal(new Set(b.items.map(q=>q.prompt)).size,b.items.length,id);const o=options(id),binding=T.binding(T.catalog.find(u=>u.id===o.unitId),T.catalog.find(u=>u.id===o.unitId).lessons.find(l=>l.id===o.lessonId));assert.ok(rows.filter(q=>q.bankId===id).every(q=>binding.ids.includes(q.evidenceId)));}
 const tables=rows.filter(q=>q.scienceMaterial);assert.equal(tables.length,14);
 for(const q of rows){assert.ok(q.detail.length>=150,q.evidenceId);assert.ok(q.detail.includes(q.answer));assert.ok(q.explanation.includes(q.answer));assert.match(q.source,/^https:\/\/(contents.history.go.kr|theme.archives.go.kr)\//);assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));if(q.scienceMaterial){assert.ok(q.scienceMaterial.note.includes('학습'));for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}}
});
test('each expanded lesson draws two disjoint twenty-question sheets and restores exact selections',()=>{
 let draws=0;
 for(const bankId of bankIds)for(const responseFormat of ['choice','short','essay','initial','ox','cloze','correction'])for(const seed of [7,42,101,2026]){
  const o={...options(bankId),responseFormat,seed},first=T.generate(o,C),second=T.generate({...o,seed:seed+1,excludeEvidenceIds:first.items.map(q=>q.evidenceId)},C);draws+=2;
  assert.equal(first.items.length,20);assert.equal(second.items.length,20);assert.ok(second.items.every(q=>!first.items.some(p=>p.evidenceId===q.evidenceId)),bankId+'/'+responseFormat);
  for(const sheet of [first,second]){assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,20);assert.deepEqual(T.generate({...o,seed:sheet.seed,itemIndexes:sheet.items.map(q=>q.poolIndex)},C),sheet);for(const q of sheet.items){if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.equal(q.choices.length,0);}}
 }
 console.log('Modern depth checked sheets:',draws);
});
test('70 standalone facts also enter legacy modern quiz modes with their exact reference and explanation',()=>{
 const facts=D.items().filter(q=>q.legacy),inventory=C.historyItems('modern');assert.equal(facts.length,70);
 for(const q of facts){const x=inventory.find(x=>x.evidenceId===q.evidenceId);assert.ok(x,q.evidenceId);assert.equal(x.source,q.source);assert.equal(x.explanation,q.explanation);assert.equal(x.choices.length,3);}
 const seen=new Set();for(const grade of [5,6])for(const type of ['modern-quiz','modern-short','modern-ox','modern-initial'])for(let seed=1;seed<=24;seed++){
  const o={subject:'social',grade,topic:'modern',type,count:20,seed},sheet=C.generate(o);assert.equal(sheet.items.length,20);assert.deepEqual(C.generate(o),sheet);
  for(const x of sheet.items.filter(q=>q.modernDepth)){seen.add(x.evidenceId);const source=facts.find(q=>q.evidenceId===x.evidenceId);assert.equal(x.source,source.source);assert.equal(x.explanation,source.explanation);assert.equal(x.sourceEra,'modern');}
 }
 assert.equal(seen.size,70);
});
test('published original pool offsets are unchanged and public inventory is returned as copies',()=>{
 const old=C.historyItems('modern');assert.equal(old[21].answer,'김좌진');assert.match(old[25].prompt,/서시/);const copy=D.items();copy[0].choices[0]='changed';assert.notEqual(D.items()[0].choices[0],'changed');old.at(-1).choices[0]='changed';assert.notEqual(C.historyItems('modern').at(-1).choices[0],'changed');
});
