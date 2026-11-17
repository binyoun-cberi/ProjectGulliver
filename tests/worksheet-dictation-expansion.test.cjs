'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const E=require('../worksheet-dictation-expansion'),D=require('../worksheet-dictation-data');

test('600 original dictation sentences are distributed as five 20-item practice topics per grade',()=>{
 const sets=E.sets(),all=new Set(),ids=new Set();
 assert.equal(sets.length,30);
 for(let grade=1;grade<=6;grade++){
  const selected=sets.filter(s=>s.grade===grade);
  assert.equal(selected.length,5);
  assert.equal(D.bank(grade).length,grade<=3?350:grade===4?310:210);
  const topics=E.topics(grade),idsForGrade=new Set(topics.map(t=>t.id));
  assert.equal(topics.length,5);assert.equal(idsForGrade.size,5);
  for(const s of selected){
   assert.equal(s.sentences.length,20,s.topic);
   assert.ok(s.focus&&s.label&&s.topic.startsWith('practice-'));
   assert.equal(D.topics(grade).find(t=>t.id===s.topic).count,20);
   const bank=D.bank(grade,s.topic);
   assert.equal(bank.length,20);
   for(const item of bank){
    assert.ok(!ids.has(item.id),item.id);ids.add(item.id);
    assert.ok(!all.has(item.text),item.text);all.add(item.text);
    assert.ok(/[.!?]$/.test(item.text));assert.ok(item.text.length<=135,item.text);
    assert.equal(item.focus,s.focus);
   }
   const one=D.generate({grade,topic:s.topic,seed:15}),other=D.generate({grade,topic:s.topic,seed:25,excludeIds:one.items.map(x=>x.id)});
   assert.equal(one.items.length,10);assert.equal(other.items.length,10);
   assert.equal(one.items.some(x=>other.items.some(y=>y.id===x.id)),false);
   assert.deepEqual(D.generate({grade,topic:s.topic,seed:15,itemIds:one.items.map(x=>x.id)}),one);
   assert.throws(()=>D.generate({grade,topic:s.topic,itemIds:D.bank(grade,'basic').slice(0,10).map(x=>x.id)}));
  }
 }
 assert.equal(all.size,600);
 const copy=E.sets();copy[0].sentences[0]='수정했습니다.';
 assert.notEqual(E.sets()[0].sentences[0],'수정했습니다.');
});

test('all Korean dictation items remain unique and published IDs stay restorable',()=>{
 const texts=new Set(),ids=new Set();
 for(let grade=1;grade<=6;grade++){
  for(const q of D.bank(grade)){
   assert.ok(!texts.has(q.text),'repeated sentence: '+q.text);
   assert.ok(!ids.has(q.id),'repeated ID: '+q.id);
   texts.add(q.text);ids.add(q.id);
  }
  const idsSaved=Array.from({length:10},(_,i)=>'g'+grade+'-'+(i+1));
  assert.deepEqual(D.generate({grade,itemIds:idsSaved}).items.map(x=>x.id),idsSaved);
 }
 assert.equal(texts.size,1780);assert.equal(ids.size,1780);
});

test('browser loads new bank before data and preserves existing dictation controls',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../받아쓰기.html'),'utf8');
 const extension=html.indexOf('worksheet-dictation-expansion.js');
 const data=html.indexOf('worksheet-dictation-data.js');
 assert.ok(extension>0&&data>extension);
 assert.match(html,/worksheet-dictation-player\.js/);
 assert.match(html,/worksheet-dictation-ui\.js/);
});
