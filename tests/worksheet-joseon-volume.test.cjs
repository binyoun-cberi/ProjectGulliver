'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning'),C=require('../daily-worksheet-core'),E=require('../worksheet-evidence-banks');
const banks=E.banks.filter(b=>b.id.startsWith('joseon'));
function options(bankId){for(const u of T.catalog)for(const l of u.lessons)if(T.binding(u,l)?.bankId===bankId)return {subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20,seed:73};throw Error(bankId);}
test('eight Joseon topics retain old items and add forty distinct questions across eight original readings each',()=>{
 assert.equal(banks.length,8);const all=banks.flatMap(b=>b.items.filter(q=>q.joseonVolume));assert.equal(all.length,320);assert.equal(new Set(all.map(q=>q.evidenceId)).size,320);assert.equal(new Set(all.map(q=>q.passageId)).size,64);
 for(const b of banks){const q=b.items.filter(q=>q.joseonVolume);assert.equal(q.length,40);assert.equal(new Set(q.map(x=>x.prompt)).size,40);assert.ok(b.items.some(q=>!q.joseonVolume));
  for(const x of q){assert.ok(x.detail.length>=100);assert.ok(x.detail.includes(x.answer));assert.ok(x.explanation.includes(x.answer));assert.equal(new Set(x.choices).size,3);assert.ok(x.choices.includes(x.answer));assert.match(x.source,/^https:\/\/contents.history.go.kr\//);assert.doesNotMatch(x.detail,/관찰 메모|학습 메모|기록이 남아 있다/);}
 }
});
test('every Joseon topic supports twenty questions in all six formats and a fresh second sheet',()=>{
 for(const b of banks)for(const responseFormat of ['choice','short','essay','ox','cloze','correction'])for(const seed of [1,13,73]){
  const o={...options(b.id),responseFormat,seed},s=T.generate(o,C),ids=s.items.map(q=>q.evidenceId),next=T.generate({...o,seed:seed+700,excludeEvidenceIds:ids},C);
  assert.equal(s.items.length,20);assert.equal(new Set(ids).size,20);assert.ok(next.items.every(q=>!ids.includes(q.evidenceId)),b.id+'/'+responseFormat);assert.deepEqual(T.generate({...o,itemIndexes:s.items.map(q=>q.poolIndex)},C),s);
  for(const q of [...s.items,...next.items])assert.ok(b.items.some(x=>x.evidenceId===q.evidenceId));
 }
});
test('Joseon standards include only their explicitly selected topics and enable all six response formats',()=>{
 const expected={'6사05-01':['joseon-foundation','joseon-life'],'6사05-02':['joseon-late-culture','joseon-late-politics','joseon-opening','joseon-reforms','modern-daily-change']};
 for(const [standardCode,ids] of Object.entries(expected))for(const grade of [5,6]){
  const b=T.lookupStandard('social',grade,standardCode).binding,allowed=new Set(E.banks.filter(x=>ids.includes(x.id)).flatMap(x=>x.items.map(q=>q.evidenceId)));assert.equal(b.ids.length,allowed.size);
  for(const [responseFormat] of T.formats(b)){const s=T.generate({subject:'social',grade,standardCode,count:20,seed:4,responseFormat},C);assert.equal(s.items.length,20);assert.ok(s.items.every(q=>allowed.has(q.evidenceId)));}
 }
});
