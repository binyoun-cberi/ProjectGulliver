'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SUBJECTS,generate}=require('../daily-worksheet-core.js');

test('five subjects expose only supported grades and topics, with complete unique sheets',()=>{
 assert.deepEqual(Object.keys(SUBJECTS),['korean','math','social','science','english']);
 for(const [subject,info] of Object.entries(SUBJECTS))for(const grade of info.grades)for(const [topic,,fromGrade] of info.topics){
  if(grade<fromGrade)continue;
  for(const count of [5,10,15])for(const seed of [1,42,2026]){
   const sheet=generate({subject,topic,grade,count,seed});
   assert.equal(sheet.items.length,count,`${subject}/${grade}/${topic}`);
   assert.equal(new Set(sheet.items.map(q=>q.prompt+'|'+q.answer+'|'+q.detail)).size,count);
   for(const q of sheet.items){assert.ok(q.prompt&&q.answer);if(q.choices.length){assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer))}}
  }
 }
});

test('a worksheet number reproduces the same sheet and a new seed changes it',()=>{
 const options={subject:'science',grade:4,topic:'weather',count:10};
 assert.deepEqual(generate({...options,seed:31415}),generate({...options,seed:31415}));
 assert.notDeepEqual(generate({...options,seed:31415}).items,generate({...options,seed:27182}).items);
});

test('invalid grade, unavailable topic, and excessive item count are rejected',()=>{
 for(const options of [
  {subject:'social',grade:1,topic:'direction',count:5},
  {subject:'math',grade:1,topic:'fraction',count:5},
  {subject:'english',grade:3,topic:'unknown',count:5},
  {subject:'science',grade:3,topic:'weather',count:100},
  {subject:'other',grade:3,topic:'weather',count:5}
 ])assert.throws(()=>generate(options));
});

test('arithmetic answers correspond to printed expressions',()=>{
 for(const grade of SUBJECTS.math.grades)for(const topic of SUBJECTS.math.topics.filter(t=>grade>=t[2]).map(t=>t[0])){
  const sheet=generate({subject:'math',grade,topic,count:15,seed:1024});
  for(const q of sheet.items){
   if(topic==='fraction'){
    if(grade===3)assert.ok(q.prompt.includes(q.answer));
    else {const [left,operator,right]=q.prompt.replace(' =','').split(' ');const value=s=>{const [a,b]=s.split('/').map(Number);return a/b};const expected=operator==='×'?value(left)*value(right):value(left)+value(right);assert.ok(Math.abs(value(q.answer)-expected)<1e-10)}
   }else{const match=q.prompt.match(/^(\d+) ([+×−]) (\d+) =$/);assert.ok(match);const a=Number(match[1]),b=Number(match[3]);assert.equal(Number(q.answer),match[2]==='+'?a+b:match[2]==='×'?a*b:a-b)}
  }
 }
});
