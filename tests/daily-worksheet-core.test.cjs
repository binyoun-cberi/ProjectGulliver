'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SUBJECTS,generate}=require('../daily-worksheet-core.js');

test('five subjects expose only supported grades and topics, with complete unique sheets',()=>{
 assert.deepEqual(Object.keys(SUBJECTS),['korean','math','social','science','english']);
 for(const [subject,info] of Object.entries(SUBJECTS))for(const grade of info.grades)for(const [topic,,fromGrade,toGrade=6] of info.topics){
  if(grade<fromGrade||grade>toGrade)continue;
  const dense=subject==='math'&&['addition','hundreds','multiplication'].includes(topic);
  for(const difficulty of ['basic','challenge'])for(const count of [5,10,15,...(dense?[24]:[])])for(const seed of [1,42,2026]){
   const sheet=generate({subject,topic,grade,count,seed,difficulty});
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
  {subject:'math',grade:4,topic:'number',count:5},
  {subject:'math',grade:2,topic:'hundreds',count:24},
  {subject:'korean',grade:3,topic:'reading',count:24},
  {subject:'math',grade:3,topic:'division',count:24},
  {subject:'english',grade:3,topic:'unknown',count:5},
  {subject:'science',grade:3,topic:'weather',count:100},
  {subject:'math',grade:3,topic:'division',count:5,difficulty:'unknown'},
  {subject:'other',grade:3,topic:'weather',count:5}
 ])assert.throws(()=>generate(options));
});

test('24 three-digit addition questions have no carrying and keep correct answers',()=>{
 for(const difficulty of ['basic','challenge'])for(let seed=1;seed<=80;seed++){
  const sheet=generate({subject:'math',topic:'hundreds',grade:3,count:24,seed,difficulty});
  assert.equal(sheet.items.length,24);
  for(const q of sheet.items){
   const match=q.prompt.match(/^(\d+) \+ (\d+) =$/);assert.ok(match);
   const a=Number(match[1]),b=Number(match[2]);assert.equal(a%10,0);assert.equal(b%10,0);
   assert.ok(a>=100&&b>=100&&a+b<1000);assert.ok(a%100+b%100<100);assert.equal(Number(q.answer),a+b);
  }
 }
});

test('arithmetic and fraction answers correspond to printed expressions',()=>{
 for(const grade of SUBJECTS.math.grades)for(const topic of SUBJECTS.math.topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)&&['addition','multiplication','division','fraction'].includes(t[0])).map(t=>t[0]))for(const difficulty of ['basic','challenge']){
  const sheet=generate({subject:'math',grade,topic,count:15,seed:1024,difficulty});
  for(const q of sheet.items){
   if(topic==='fraction'){
    if(grade===3)assert.ok(q.prompt.includes(q.answer));
    else {const [left,operator,right]=q.prompt.replace(' =','').split(' ');const value=s=>{const [a,b]=s.split('/').map(Number);return a/b};const expected=operator==='×'?value(left)*value(right):value(left)+value(right);assert.ok(Math.abs(value(q.answer)-expected)<1e-10)}
   }else if(topic==='division'){
    const match=q.prompt.match(/^(\d+) ÷ (\d+) =$/),answer=q.answer.match(/^(\d+)(?: … (\d+))?$/);assert.ok(match&&answer);
    assert.equal(Number(match[1]),Number(match[2])*Number(answer[1])+Number(answer[2]||0));assert.ok(Number(answer[2]||0)<Number(match[2]));
   }else{const match=q.prompt.match(/^(\d+) ([+×−]) (\d+) =$/);assert.ok(match);const a=Number(match[1]),b=Number(match[3]);assert.equal(Number(q.answer),match[2]==='+'?a+b:match[2]==='×'?a*b:a-b)}
  }
 }
});

test('reading sheets do not repeat a passage and expose longer texts from grade 3',()=>{
 for(const grade of [1,2,3,4,5,6])for(const seed of [1,42,2026]){
  const items=generate({subject:'korean',grade,topic:'reading',count:15,seed}).items;
  assert.equal(new Set(items.map(q=>q.detail)).size,15);
  if(grade<=2)assert.ok(items.every(q=>q.detail.split('.').length<=2));
 }
 let long=0;for(let seed=1;seed<=20;seed++)long+=generate({subject:'korean',grade:3,topic:'reading',count:15,seed}).items.filter(q=>q.detail.split('.').length>2).length;
 assert.ok(long>20,'long passages are not reaching the worksheet');
});

test('grade 1 to 3 place-value and time questions have consistent answers',()=>{
 for(const grade of [1,2,3])for(const difficulty of ['basic','challenge']){
  for(const q of generate({subject:'math',topic:'number',grade,count:15,seed:101,difficulty}).items){
   const [first,second]=q.prompt.match(/\d+/g).map(Number);
   if(q.prompt.includes('묶으면')){const [units,remainder]=q.answer.match(/\d+/g).map(Number);assert.equal(first,units*second+remainder)}
   else if(q.prompt.includes('더 큰'))assert.equal(Number(q.answer),Math.max(first,second));
   else assert.equal(Number(q.answer),Math.floor(first/second)%10);
  }
  for(const q of generate({subject:'math',topic:'time',grade,count:15,seed:101,difficulty}).items){
   if(grade===2){const [hours,minutes]=q.prompt.match(/\d+/g).map(Number);assert.equal(q.answer,`${hours*60+minutes}분`)}
   if(grade===3){const [hours,minutes,elapsed]=q.prompt.match(/\d+/g).map(Number);const [endHour,endMinute]=q.answer.match(/\d+/g).map(Number);assert.equal(endHour*60+endMinute,hours*60+minutes+elapsed)}
  }
 }
});
