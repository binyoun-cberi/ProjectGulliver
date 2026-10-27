'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-dictation-data'),L=require('../worksheet-dictation-levels');
test('six focused batchim topics offer 180 original sentences, disjoint draws and exact saved replay',()=>{
 const sets=L.batchim(),texts=new Set();assert.equal(sets.length,6);
 for(const set of sets){const bank=D.bank(set.grade,set.topic);assert.equal(bank.length,30);assert.equal(D.topics(set.grade).find(t=>t.id===set.topic).label,set.label);
 for(const q of bank){assert.ok(!texts.has(q.text),q.text);texts.add(q.text);assert.ok(q.focus);assert.match(q.text,/[.!?]$/);assert.ok(q.text.length<=55);}
 const a=D.generate({grade:set.grade,topic:set.topic,seed:42}),b=D.generate({grade:set.grade,topic:set.topic,seed:43,excludeIds:a.items.map(q=>q.id)});assert.equal(a.items.length,10);assert.ok(b.items.every(q=>!a.items.some(x=>x.id===q.id)));assert.deepEqual(D.generate({grade:set.grade,topic:set.topic,seed:42,itemIds:a.items.map(q=>q.id)}),a);
 for(const grade of [1,2,3,4,5,6].filter(g=>g!==set.grade))assert.throws(()=>D.bank(grade,set.topic));
 }assert.equal(texts.size,180);const copy=L.batchim();copy[0].sentences[0]='changed';assert.notEqual(L.batchim()[0].sentences[0],'changed');
});
