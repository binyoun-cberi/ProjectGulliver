'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-dictation-data'),L=require('../worksheet-dictation-levels');
test('400 original items form forty complete ten-item levels with stable, isolated replay',()=>{
 const sets=L.sets(),ids=new Set(),texts=new Set();assert.equal(sets.length,40);
 for(const set of sets){
  const bank=D.bank(set.grade,set.topic);assert.equal(bank.length,10);
  assert.equal(D.topics(set.grade).find(t=>t.id===set.topic).label,'연습 '+set.label);
  for(const q of bank){assert.ok(!ids.has(q.id));ids.add(q.id);assert.ok(!texts.has(q.text));texts.add(q.text);assert.match(q.text,/[.!?]$/);assert.ok(q.text.length<=85);assert.equal(q.focus,set.focus);}
  const first=D.generate({grade:set.grade,topic:set.topic,seed:52});assert.equal(first.items.length,10);assert.equal(first.focus,set.focus);
  assert.deepEqual(D.generate({grade:set.grade,topic:set.topic,seed:52,itemIds:first.items.map(q=>q.id)}),first);
  assert.deepEqual(new Set(D.generate({grade:set.grade,topic:set.topic,seed:13}).items.map(q=>q.id)),new Set(bank.map(q=>q.id)));
  assert.throws(()=>D.generate({grade:set.grade,topic:set.topic,itemIds:D.bank(set.grade,'basic').slice(0,10).map(q=>q.id)}));
 }
 assert.equal(ids.size,400);assert.equal([1,2,3,4,5,6].reduce((n,g)=>n+D.bank(g).length,0),1180);
 for(const grade of [5,6]){assert.equal(D.topics(grade).some(t=>t.id.startsWith('level-')),false);assert.throws(()=>D.bank(grade,'level-1'),/주제/);}
 for(const topic of ['level-0','level-11','level-01'])assert.throws(()=>D.bank(1,topic),/주제/);
});
test('level 1 in first grade uses only syllables without final consonants',()=>{
 for(const q of D.bank(1,'level-1'))for(const ch of q.text){const code=ch.charCodeAt(0);if(code>=0xAC00&&code<=0xD7A3)assert.equal((code-0xAC00)%28,0,q.text);}
});
test('published basic IDs and saved mixed-topic URLs remain valid after expansion',()=>{
 for(let grade=1;grade<=6;grade++){
  const itemIds=Array.from({length:10},(_,i)=>`g${grade}-${i+1}`);
  assert.deepEqual(D.generate({grade,seed:42,itemIds}).items.map(q=>q.id),itemIds);
 }
});
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'));}catch{}
test('level selection updates grade-specific labels, prints level identity and restores saved selections',{skip:!JSDOM},()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
 const raw=fs.readFileSync(path.join(root,'받아쓰기.html'),'utf8');
 function load(search){
  const w=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{url:'https://clasheet.test/받아쓰기.html'+search,runScripts:'outside-only'}).window;
  w.speechSynthesis={getVoices:()=>[],cancel:()=>{},speak:u=>w.spoken=u,resume:()=>{},addEventListener:()=>{}};w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  for(const [,file] of raw.matchAll(/<script src="([^"]+)"/g)){const name=file.split('?')[0];if(name!=='gulliver-app-shell.js')w.eval(fs.readFileSync(path.join(root,name),'utf8'));}return w;
 }
 const w=load('?grade=1&topic=level-1&seed=42'),d=w.document;
 const change=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('change'));};
 assert.match(d.querySelector('#gradeFocus').textContent,/받침 없는/);assert.match(d.querySelector('#gradeFocus').textContent,/학교 급수표/);
 assert.match(d.querySelector('#dictSheetNumber').textContent,/연습 1급/);assert.equal(d.querySelectorAll('#dictWritingList>li').length,10);assert.equal(w.spoken,undefined);
 const saved=w.location.search,answer=d.querySelector('#dictAnswerList').textContent;
 const replay=load(saved);assert.equal(replay.document.querySelector('#dictAnswerList').textContent,answer);replay.close();
 change('dictGrade','2');assert.match(d.querySelector('#dictTopic option:checked').textContent,/받침과 조사/);assert.equal(d.querySelector('#dictTopic').value,'level-1');
 change('dictGrade','5');assert.equal(d.querySelector('#dictTopic').value,'all');assert.equal([...d.querySelector('#dictTopic').options].some(o=>o.value.startsWith('level-')),false);
 change('dictGrade','4');change('dictTopic','level-10');assert.match(d.querySelector('#dictSheetNumber').textContent,/연습 10급/);
 d.querySelector('#dictStart').click();assert.equal(w.spoken.lang,'ko-KR');assert.equal(d.querySelector('#dictTeacher').open,false);
 change('dictSubject','english');assert.equal(d.querySelector('#dictReferences').hidden,true);assert.equal(d.querySelector('#dictTopic').value,'all');
 change('dictSubject','korean');assert.equal(d.querySelector('#dictReferences').hidden,false);
 change('dictSource','custom');assert.equal(d.querySelector('#dictReferences').hidden,true);w.close();
});
