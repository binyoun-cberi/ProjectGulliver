'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning'),C=require('../daily-worksheet-core'),E=require('../worksheet-evidence-banks');
function options(bankId){for(const u of T.catalog)for(const l of u.lessons)if(T.binding(u,l)?.bankId===bankId)return {subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20,seed:73};throw Error(bankId);}
test('all twenty-one history topics generate twenty OX, cloze and correction tasks with valid answers and saved replay',()=>{
 for(const bank of E.banks.filter(b=>b.items.some(q=>q.historyVolume)))for(const responseFormat of ['ox','cloze','correction'])for(const seed of [3,73]){
  const o={...options(bank.id),seed,responseFormat},s=T.generate(o,C);assert.equal(s.items.length,20);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,20);
  assert.deepEqual(T.generate({...o,itemIndexes:s.items.map(q=>q.poolIndex)},C),s);
  for(const q of s.items){const source=bank.items.find(x=>x.evidenceId===q.evidenceId);assert.ok(source);assert.deepEqual(q.choices,[]);
   if(responseFormat==='ox'){assert.equal(q.answer,q.oxProposal===source.answer?'O':'X');assert.ok(q.explanation.includes(source.answer));}
   if(responseFormat==='cloze'){assert.ok(q.detail.includes('〔'));assert.ok(!q.detail.includes(source.answer));assert.equal(q.answer,source.answer);assert.equal(q.detail,source.explanation.split(source.answer).join('〔                 〕'));}
   if(responseFormat==='correction'){assert.notEqual(q.oxProposal,source.answer);assert.ok(source.choices.includes(q.oxProposal));assert.equal(q.answer,source.answer);}
  }
  if(responseFormat==='ox')assert.deepEqual(s.items.reduce((a,q)=>(a[q.answer]++,a),{O:0,X:0}),{O:10,X:10});
 }
});
test('new history types stay in the selected standard and never appear for an unsupported lesson',()=>{
 for(const standardCode of ['6사04-01','6사04-02','6사04-03'])for(const responseFormat of ['ox','cloze','correction']){
  const b=T.lookupStandard('social',5,standardCode).binding,s=T.generate({subject:'social',grade:5,standardCode,count:20,seed:94,responseFormat},C);
  assert.equal(s.items.length,20);assert.ok(s.items.every(q=>b.ids.includes(q.evidenceId)));assert.ok(T.capacity(b,responseFormat)>=20);
 }
 for(const u of T.catalog)for(const l of u.lessons){const b=T.binding(u,l);if(b?.kind==='math'){assert.ok(!T.formats(b).some(([id])=>['ox','cloze','correction'].includes(id)));return;}}
});
