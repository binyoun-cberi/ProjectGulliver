'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Bank=require('../worksheet-math-grade3-operations-geometry.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=Bank.banks(),get=k=>{const b=banks.find(x=>x.id==='math-g3-ops-'+k);assert.ok(b,k);return b;};
const number=s=>Number(s.match(/\d+/)[0]);
test('eight exact grade-three semester-one/two banks contain 128 original, distinct and uniquely answerable problems',()=>{
 assert.equal(banks.length,8);assert.equal(banks.flatMap(b=>b.items).length,128);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[3]);assert.equal(b.items.length,16);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  const keys=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!keys.has(key),'Repeated task '+q.evidenceId);keys.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=22);
   assert.match(q.sourceLabel,/창작/);assert.equal(q.knowledgeOnly,true);
   assert.ok(!/NaN|undefined|을\/를|이\/가|과\(와\)/.test(q.prompt+' '+q.explanation+' '+(q.detail||'')));
  }
 }
 assert.equal(ids.size,128);
 const copy=Bank.banks();copy[0].items[0].answer='changed';assert.notEqual(Bank.banks()[0].items[0].answer,'changed');
});
test('all eight new targets exactly map to original textbook lesson IDs and generate 10 seeded choice/short items',()=>{
 for(const b of banks){
  const unit=T.units('math',3,b.exactSemester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,b.id+' missing unit');
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' missing lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' bank mapping incorrect');
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence');assert.equal(binding.bankId,b.id);
  assert.equal(T.capacity(binding,'choice'),16);
  assert.deepEqual(T.formats(binding).map(([x])=>x),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const args={subject:'math',grade:3,semester:b.exactSemester,unitId:unit.id,lessonId:lesson.id,seed,responseFormat,count:10};
   const sheet=T.generate(args,C);
   assert.deepEqual(T.generate(args,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('equal-sharing and measuring-out groups represent two distinct but correct uses of division',()=>{
 for(const q of get('share').items){
  const m=q.prompt.match(/물건 (\d+)개를 (\d+)명에게/);assert.ok(m,q.prompt);
  const total=Number(m[1]),people=Number(m[2]);
  assert.equal(total%people,0);assert.equal(q.answer,total/people+'개');
  assert.match(q.detail,/같은 수를 받습니다/);
 }
 for(const q of get('groups').items){
  const m=q.prompt.match(/물건 (\d+)개를 한 묶음에 (\d+)개씩/);assert.ok(m,q.prompt);
  const total=Number(m[1]),size=Number(m[2]);
  assert.equal(total%size,0);assert.equal(q.answer,total/size+'묶음');
  assert.match(q.detail,/남는 물건 없이/);
 }
 for(const q of get('inverse').items){
  const m=q.prompt.match(/(\d+) × (\d+) = (\d+).*?(\d+) ÷ (\d+)/);assert.ok(m,q.prompt);
  const [a,b,total,d,divisor]=m.slice(1).map(Number);
  assert.equal(a*b,total);assert.equal(total,d);assert.equal(a,divisor);
  assert.equal(q.answer,String(total/divisor));
 }
});
test('three two-digit multiplication levels produce exact products or a correct partition into partial products',()=>{
 for(const [i,q]of get('multiplication1').items.entries()){
  const m=q.prompt.match(/곱셈 (\d+) × (\d+)/);assert.ok(m,q.prompt);
  const [a,b]=m.slice(1).map(Number),pa=a%10,ta=Math.floor(a/10),pb=b%10,tb=Math.floor(b/10);
  assert.equal(q.answer,String(a*b));
  assert.ok(pa*pb<10,'unexpected ones carry');
  assert.ok((ta*pb+pa*tb)<10,'unexpected tens carry');
  assert.ok(ta*tb<10,'unexpected hundreds carry');
  assert.equal(new Set(q.choices.map(Number)).size,3);
 }
 for(const [i,q]of get('multiplication2').items.entries()){
  const m=q.prompt.match(/곱셈 (\d+) × (\d+)|^(\d+) × (\d+)의 값을/);
  assert.ok(m,q.prompt);
  const nums=m.slice(1).filter(Boolean).map(Number),[a,b]=nums;
  const tens=Math.floor(b/10)*10,ones=b%10;
  if(i%2===0){
   assert.equal(q.answer,a+' × '+tens+' + '+a+' × '+ones);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.slice(1).every(w=>w!==q.answer));
  }else{
   assert.equal(q.answer,String(a*b));assert.equal(a*tens+a*ones,a*b);
  }
 }
 for(const q of get('multiplication3').items){
  const m=q.prompt.match(/곱셈 (\d+) × (\d+)/);assert.ok(m,q.prompt);
  const [a,b]=m.slice(1).map(Number);
  assert.equal(q.answer,String(a*b));
  assert.equal(q.explanation.includes(String(a*b)),true);
  assert.ok(q.choices.slice(1).every(w=>Number(w)!==a*b));
 }
});
test('verification tasks follow divisor times quotient plus remainder, with a remainder smaller than the divisor',()=>{
 for(const q of get('verify-division').items){
  const m=q.prompt.match(/(\d+) ÷ (\d+) = (\d+) … (\d+)/);assert.ok(m,q.prompt);
  const [dividend,divisor,quotient,remainder]=m.slice(1).map(Number);
  assert.ok(remainder>0&&remainder<divisor);
  assert.equal(divisor*quotient+remainder,dividend);
  assert.equal(q.answer,divisor+' × '+quotient+' + '+remainder+' = '+dividend);
  assert.ok(q.choices[1].includes('−'));
  assert.ok(q.choices[2].includes('('));
  assert.notEqual(divisor*quotient-remainder,dividend);
  assert.notEqual(divisor*(quotient+remainder),dividend);
 }
});
test('original diagram-backed line questions show an actual connected straight or curved line matching its label',()=>{
 const b=get('line-classification');
 assert.equal(b.exactUnitName,'평면도형');
 let straight=0,curved=0;
 for(const q of b.items){
  const diag=q.scienceMaterial;assert.equal(diag?.kind,'diagram');
  assert.equal(diag.viewBox,'0 0 360 150');
  assert.ok(diag.body.includes('선 ㉠'));
  assert.ok(!/<script|javascript:|onload=/.test(diag.body));
  const straightShape=diag.body.includes('<line '),curvedShape=diag.body.includes('<path ');
  assert.notEqual(straightShape,curvedShape,q.evidenceId);
  if(straightShape){straight++;assert.equal(q.answer,'곧은 선');}
  else{curved++;assert.equal(q.answer,'굽은 선');}
 }
 assert.equal(straight,8);assert.equal(curved,8);
});
test('new grade-three operation script loads before the evidence-bank factory on printable A4 page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade3-operations-geometry.js'));
 assert.ok(html.indexOf('worksheet-math-grade3-operations-geometry.js')<html.indexOf('worksheet-evidence-banks.js'));
});
