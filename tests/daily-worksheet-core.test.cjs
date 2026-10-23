'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SUBJECTS,generate,types,units}=require('../daily-worksheet-core.js');

test('unit selectors generate the requested arithmetic constraints and mixed order',()=>{
 assert.equal(units('math',3)[0].label,'1학기 · 덧셈과 뺄셈');
 assert.equal(types('math',5,'mixed').length,11);
 for(const topic of ['hundreds','addition'])for(const [type] of types('math',3,topic))for(const seed of [1,42,2026]){
  const sheet=generate({subject:'math',grade:3,topic,type,count:24,seed});
  assert.equal(sheet.items.length,24);
  for(const q of sheet.items){const [,left,operator,right]=q.prompt.match(/^(\d+) ([+−]) (\d+) =$/),a=Number(left),b=Number(right);assert.equal(Number(q.answer),operator==='+'?a+b:a-b);assert.ok(a>=100&&b>=(type.includes('-two-digit-')?10:100));if(type==='add-tens-none')assert.equal(a%100+b%100,0);
   let carry=0,n=0;for(const unit of [1,10,100]){const x=Math.floor(a/unit)%10,y=Math.floor(b/unit)%10,next=operator==='+'?x+y+carry>=10?1:0:x-carry<y?1:0;if(type.endsWith('-units')&&unit===1)assert.equal(next,1);if(type.endsWith('-tens')&&unit===1)assert.equal(next,0);if(type.endsWith('-tens')&&unit===10)assert.equal(next,1);n+=next;carry=next}assert.equal(n,type.endsWith('-two')?2:/-(one|carry|borrow|units|tens)$/.test(type)?1:0);
  }
 }
 for(const [type] of types('math',5,'mixed'))for(const seed of [1,42]){
  const sheet=generate({subject:'math',grade:5,topic:'mixed',type,count:15,seed});
  for(const q of sheet.items){const expression=q.prompt.slice(0,-2).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');assert.equal(Number(q.answer),Function(`return ${expression}`)())}
 }
 assert.throws(()=>generate({subject:'math',grade:5,topic:'mixed',count:5}));
 assert.throws(()=>generate({subject:'math',grade:3,topic:'hundreds',type:'sub-borrow-one',count:5}));
});

test('every listed unit type produces distinct, reproducible exercises with correct arithmetic',()=>{
 const rational=value=>{const [a,b]=value.split('/').map(Number);return b?a/b:a};
 for(const grade of [1,2,3,4,5,6])for(const unit of units('math',grade))for(const [type,,topic] of unit.types){
  const dense=/^(add-|sub-|small-|two-|times-)/.test(type)&&type!=='times-missing';
  for(const seed of [1,42,2026]){
   const options={subject:'math',grade,topic,type,count:dense?24:15,seed};
   const sheet=generate(options);assert.equal(sheet.items.length,options.count,`${grade}/${type}/${seed}`);
   assert.deepEqual(sheet,generate(options));assert.equal(new Set(sheet.items.map(q=>q.prompt)).size,options.count);
   for(const q of sheet.items){
    if(type==='times-missing'){const [,factor,product]=q.prompt.match(/^□ × (\d+) = (\d+)$/);assert.equal(Number(q.answer)*Number(factor),Number(product));continue}
    if(type.startsWith('mix-')){const expression=q.prompt.slice(0,-2).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');assert.equal(Number(q.answer),Function(`return ${expression}`)());continue}
    const [,a,operator,b]=q.prompt.match(/^([\d./]+) ([+−×÷]) ([\d./]+) =$/)||[];
    assert.ok(a&&b,`${type}: ${q.prompt}`);
    const left=rational(a),right=rational(b),expected=operator==='+'?left+right:operator==='−'?left-right:operator==='×'?left*right:left/right;
    if(operator==='÷'&&q.answer.includes(' … ')){const [quotient,remainder]=q.answer.split(' … ').map(Number);assert.equal(left,right*quotient+remainder);assert.ok(remainder<right)}
    else assert.ok(Math.abs(rational(q.answer)-expected)<1e-9,`${type}: ${q.prompt} → ${q.answer}`);
   }
  }
 }
});

test('five subjects expose only supported grades and topics, with complete unique sheets',()=>{
 assert.deepEqual(Object.keys(SUBJECTS),['korean','math','social','science','english']);
 for(const [subject,info] of Object.entries(SUBJECTS))for(const grade of info.grades)for(const [topic,,fromGrade,toGrade=6] of info.topics){
  if(grade<fromGrade||grade>toGrade)continue;
  if(['mixed','decimal'].includes(topic))continue;
  const dense=subject==='math'&&['addition','hundreds','multiplication'].includes(topic);
  for(const difficulty of ['basic','challenge'])for(const count of [5,10,15,...(dense?[24]:[])])for(const seed of [1,42,2026]){
   const sheet=generate({subject,topic,grade,count,seed,difficulty});
   assert.equal(sheet.items.length,count,`${subject}/${grade}/${topic}`);
   assert.equal(new Set(sheet.items.map(q=>q.prompt+'|'+q.answer+'|'+q.detail)).size,count);
   for(const q of sheet.items){assert.ok(q.prompt&&q.answer);if(q.choices.length){assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer))}}
  }
 }
});

test('social history units use evidence with an accountable answer and source',()=>{
 for(const grade of [3,4,5,6])for(const unit of units('social',grade))for(const [type,,topic] of unit.types){
  for(const seed of [1,42,2026]){
   const options={subject:'social',grade,topic,type,count:15,seed},sheet=generate(options);
   assert.deepEqual(sheet,generate(options));
   assert.equal(sheet.items.length,15);
   assert.equal(new Set(sheet.items.map(q=>q.detail)).size,15,`${grade}/${topic}/${seed}: 자료가 중복됨`);
   if(sheet.alignment)assert.match(sheet.alignment.code,/^\[[46]사\d{2}-\d{2}\]$/);
   else assert.ok(['joseon','modern'].includes(topic));
   for(const question of sheet.items){assert.ok(question.detail&&question.explanation&&question.explanation!==question.detail&&question.sourceLabel);assert.ok(question.choices.includes(question.answer));if(grade>=5)assert.match(question.source,/^https:\/\/contents\.history\.go\.kr\/mobile\/eh\/view\.do\?/);else assert.equal(question.source,'')}
  }
 }
 assert.throws(()=>generate({subject:'social',grade:4,topic:'goryeo',type:'goryeo-evidence',count:5}));
 assert.throws(()=>generate({subject:'social',grade:5,topic:'past',type:'past-evidence',count:5}));
});

test('regenerating social history selects different evidence and direct era sources',()=>{
 for(const grade of [3,5])for(const unit of units('social',grade)){
  const [type,,topic]=unit.types[0],options={subject:'social',grade,topic,type,count:15};
  const first=generate({...options,seed:1}),second=generate({...options,seed:2026});
  assert.notDeepEqual(new Set(first.items.map(q=>q.detail)),new Set(second.items.map(q=>q.detail)),topic);
  for(let seed=1;seed<=100;seed++){
   const sheet=generate({...options,seed});
   assert.equal(new Set(sheet.items.map(q=>q.detail)).size,15,`${topic}/${seed}`);
   for(const q of sheet.items){assert.ok(q.explanation.length>=20);if(topic==='modern')assert.match(q.source,/code=eh_age_(40|50)&levelId=/);if(q.source)assert.ok(!q.source.includes('/list.do?'))}
  }
 }
});

test('a worksheet number reproduces the same sheet and a new seed changes it',()=>{
 const options={subject:'science',grade:5,topic:'weather',count:10};
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
 for(const variant of ['tens','ones'])for(let seed=1;seed<=80;seed++){
  const sheet=generate({subject:'math',topic:'hundreds',grade:3,count:24,seed,variant});
  assert.equal(sheet.items.length,24);
  assert.equal(sheet.variant,variant);
  for(const q of sheet.items){
   const match=q.prompt.match(/^(\d+) \+ (\d+) =$/);assert.ok(match);
   const a=Number(match[1]),b=Number(match[2]);if(variant==='tens'){assert.equal(a%10,0);assert.equal(b%10,0)}
   assert.ok(a>=100&&b>=100&&a+b<1000);assert.ok(a%100+b%100<100);assert.ok(a%10+b%10<10);assert.equal(Number(q.answer),a+b);
  }
 }
});

test('the same variant and seed reproduce a sheet, and invalid variants fail',()=>{
 const options={subject:'math',grade:3,topic:'hundreds',count:24,seed:20261023};
 assert.deepEqual(generate({...options,variant:'ones'}),generate({...options,variant:'ones'}));
 assert.notDeepEqual(generate({...options,variant:'ones'}).items,generate({...options,variant:'tens'}).items);
 assert.throws(()=>generate({...options,variant:'unknown'}));
});

test('only reviewed math drills display a curriculum code, within the cited number range',()=>{
 for(const grade of [1,2,3,4])for(const topic of ['addition','multiplication','division','hundreds']){
  if(!SUBJECTS.math.topics.some(t=>t[0]===topic&&grade>=t[2]&&grade<=(t[3]??6)))continue;
  const sheet=generate({subject:'math',grade,topic,count:15,seed:2030});
  assert.match(sheet.alignment.code,/^\[[24]수01-\d{2}\]$/);
  for(const q of sheet.items){
   const numbers=q.prompt.match(/\d+/g).map(Number);
   if(topic==='addition'&&grade===2)assert.ok(numbers.every(n=>n<=99));
   if(topic==='addition'&&grade>=3)assert.ok(numbers.every(n=>n>=100&&n<=999));
   if(topic==='division'&&grade===3)assert.ok(numbers[1]<10&&numbers[0]<100);
   if(topic==='division'&&grade===4)assert.ok(numbers[1]>=10&&numbers[1]<=99&&numbers[0]<1000);
  }
 }
 assert.equal(generate({subject:'social',grade:3,topic:'direction',count:5,seed:2}).alignment,null);
});

test('reviewed language and science units carry scoped standards at the right grades',()=>{
 const cases=[
  ['korean',1,'mainidea','[2국02-03]'],['korean',2,'mainidea','[2국02-03]'],
  ['english',3,'words','[4영01-05]'],['english',4,'words','[4영01-05]'],
  ['english',5,'words','[6영01-03]'],['english',6,'words','[6영01-03]'],
  ['social',4,'economy','[4사07-02]'],
  ['science',3,'matter','[4과05-02]'],['science',4,'matter','[4과05-02]'],
  ['science',5,'weather','[6과06-01]'],['science',6,'weather','[6과06-01]']
 ];
 for(const [subject,grade,topic,code] of cases){
  const sheet=generate({subject,grade,topic,count:15,seed:104});
  assert.equal(sheet.alignment.code,code);
  assert.ok(sheet.alignment.source.startsWith('https://'));
  assert.equal(new Set(sheet.items.map(q=>q.detail||q.prompt+'|'+q.answer)).size,15);
 }
 assert.throws(()=>generate({subject:'science',grade:3,topic:'weather',count:5,seed:1}));
 assert.throws(()=>generate({subject:'korean',grade:3,topic:'mainidea',count:5,seed:1}));
 for(const seed of [1,42,2048]){
  const sheet=generate({subject:'korean',grade:1,topic:'mainidea',count:15,seed});
  assert.ok(sheet.items.every(q=>q.detail.includes('습니다.')&&q.choices.includes(q.answer)&&q.choices.length===3));
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
