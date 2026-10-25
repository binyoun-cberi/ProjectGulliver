'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-english-dictation'),P=require('../worksheet-dictation-player');
test('English grades have 160 complete unique sentences, translations and four ten-sentence themes',()=>{
 const seen=new Set();let previous=0;
 for(const grade of [3,4,5,6]){
  const bank=D.bank(grade);assert.equal(bank.length,40);const words=bank.reduce((n,q)=>n+q.text.split(/\s+/).length,0)/40;assert.ok(words>previous);previous=words;
  for(const q of bank){assert.ok(!seen.has(q.text));seen.add(q.text);assert.match(q.text,/^[A-Z].*[.!?]$/);assert.match(q.text,/^[\x20-\x7e]+$/);assert.ok(q.translation);assert.ok(q.focus);}
  for(const topic of D.topics(grade)){
   const sheet=D.generate({grade,topic:topic.id,seed:42});assert.equal(sheet.items.length,10);assert.equal(new Set(sheet.items.map(q=>q.id)).size,10);
   assert.deepEqual(D.generate({grade,topic:topic.id,seed:42,itemIds:sheet.items.map(q=>q.id)}),sheet);
   if(topic.id!=='all'){assert.equal(topic.count,10);assert.ok(sheet.items.every(q=>q.topic===topic.id));}
  }
  const first=D.generate({grade,seed:42}),second=D.generate({grade,seed:43,excludeIds:first.items.map(q=>q.id)});assert.ok(second.items.every(q=>!first.items.some(x=>x.id===q.id)));
 }
 for(const grade of [1,2,7])assert.throws(()=>D.bank(grade));assert.throws(()=>D.bank(3,'basic'));assert.throws(()=>D.generate({grade:3,itemIds:Array(10).fill('en-g3-school-1')}));assert.throws(()=>D.generate({grade:3,itemIds:D.bank(4).slice(0,10).map(q=>q.id)}));
});
test('English playback uses English numbering, selected voice and language for exactly thirty utterances',()=>{
 const spoken=[],voice={lang:'en-GB',voiceURI:'british'},items=D.generate({grade:6,seed:42}).items;
 const p=P.create({synth:{speak:u=>spoken.push(u),cancel:()=>{},resume:()=>{}},Utterance:class{constructor(text){this.text=text;}},setTimer:()=>0,clearTimer:()=>{}});
 p.load(items,{language:'en-GB',voice,repeatGap:0,nextGap:0});p.start();
 for(let i=0;i<30;i++){const u=spoken.at(-1);assert.equal(u.lang,'en-GB');assert.equal(u.voice,voice);assert.equal(u.text,(i%3===0?`Number ${Math.floor(i/3)+1}. `:'')+items[Math.floor(i/3)].text);assert.doesNotMatch(u.text,/[가-힣]/);u.onend();}
 assert.equal(spoken.length,30);assert.equal(p.snapshot().state,'complete');
});
