'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-social-past-local-depth'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core'),E=require('../worksheet-evidence-banks');
test('80 original local-life questions reach four exact grade-three lessons with 23 independent choices',()=>{
 const items=D.items();assert.equal(items.length,80);assert.equal(new Set(items.map(q=>q.evidenceId)).size,80);assert.equal(new Set(items.map(q=>q.passageId)).size,16);
 for(const q of items){assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));assert.ok(q.detail.length>50);assert.ok(q.explanation.length>12);}
 const targets=T.catalog.flatMap(u=>u.lessons.map(l=>({u,l,b:T.binding(u,l)}))).filter(t=>t.b&&E.banks.find(b=>b.id===t.b.bankId)?.items.some(q=>q.socialPastLocal));assert.equal(targets.length,4);
 const used=new Set();for(const {u,l,b}of targets){assert.equal(u.subject,'social');assert.equal(u.grade,3);assert.equal(u.semester,1);assert.equal(T.capacity(b,'choice'),23);
 for(const format of ['choice','short','essay'])for(const seed of [7,42,101]){const options={subject:'social',grade:3,semester:1,unitId:u.id,lessonId:l.id,count:20,responseFormat:format,seed};const s=T.generate(options,C);assert.equal(s.items.length,20);assert.deepEqual(T.generate(options,C),s);for(const q of s.items)if(q.evidenceId?.startsWith('social-past-local-'))used.add(q.evidenceId);}
 }assert.equal(used.size,80);const copy=D.items();copy[0].choices[0]='changed';assert.notEqual(D.items()[0].choices[0],'changed');
});
