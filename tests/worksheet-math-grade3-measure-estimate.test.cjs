'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Bank=require('../worksheet-math-grade3-measure-estimate.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=Bank.banks();
const kind=k=>{const b=banks.find(b=>b.id.endsWith('-'+k));assert.ok(b,'Missing bank '+k);return b;};
const round10=n=>Math.round(n/10)*10;
function duration(value){
 const h=value.match(/^(\d+)시간 (\d+)분$/);
 if(h)return {unit:'minutes',value:Number(h[1])*60+Number(h[2])};
 const s=value.match(/^(\d+)분 (\d+)초$/);
 if(s)return {unit:'seconds',value:Number(s[1])*60+Number(s[2])};
 assert.fail('Unrecognized duration '+value);
}
test('10 independent grade-3/4 targets contain 160 original, non-repeating and uniquely graded items',()=>{
 assert.equal(banks.length,10);assert.equal(banks.flatMap(x=>x.items).length,160);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.equal(b.items.length,16);
  assert.ok([3,4].includes(b.grades[0]));
  assert.equal(b.grades.length,1);
  const target=[b.grades[0],b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  const questions=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),'Repeated evidenceId '+q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!questions.has(key),'Repeated item '+q.evidenceId);questions.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=20);
   assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
   assert.ok(!/NaN|undefined|이\(가\)|을\/를|이\/가/.test(q.prompt+' '+q.explanation+' '+(q.detail||'')));
  }
 }
 assert.equal(ids.size,160);
 const copy=Bank.banks();copy[0].items[0].answer='modified';
 assert.notEqual(Bank.banks()[0].items[0].answer,'modified');
});
test('all 10 exact textbook lessons generate deterministic ten-item choice and short worksheets with no old-bank overrides',()=>{
 for(const b of banks){
  const grade=b.grades[0],semester=b.exactSemester;
  const unit=T.units('math',grade,semester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,b.id+' lacks unit '+b.exactUnitName);
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' lacks lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' did not bind exact bank');
  const binding=T.binding(unit,lesson);assert.equal(binding?.kind,'evidence');
  assert.equal(binding.bankId,b.id);assert.equal(T.capacity(binding,'choice'),16);
  assert.deepEqual(T.formats(binding).map(row=>row[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const args={subject:'math',grade,semester,unitId:unit.id,lessonId:lesson.id,responseFormat,seed,count:10};
   const sheet=T.generate(args,C);
   assert.deepEqual(T.generate(args,C),sheet);
   assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(row=>row.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);
    assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('millimeters, centimeters, meters and kilometers match all original comparison records',()=>{
 for(const [i,q]of kind('millimeter').items.entries()){
  if(i%4===0){
   const [,cm,mm]=q.prompt.match(/(\d+) cm (\d+) mm를 mm/);
   assert.equal(q.answer,Number(cm)*10+Number(mm)+' mm');
  }else if(i%4===1){
   const mm=Number(q.prompt.match(/^(\d+) mm/)[1]);
   assert.equal(q.answer,Math.floor(mm/10)+' cm '+mm%10+' mm');
  }else{
   const [,cm,mm,b]=q.detail.match(/가 = (\d+) cm (\d+) mm \/ 나 = (\d+) mm/);
   const a=Number(cm)*10+Number(mm);
   assert.equal(q.answer,a>Number(b)?'가':a<Number(b)?'나':'길이가 같다');
  }
 }
 for(const [i,q]of kind('kilometer').items.entries()){
  if(i%4===0){
   const [,km,m]=q.prompt.match(/(\d+) km (\d+) m를 m/);
   assert.equal(q.answer,Number(km)*1000+Number(m)+' m');
  }else if(i%4===1){
   const whole=Number(q.prompt.match(/^(\d+) m/)[1]);
   assert.equal(q.answer,Math.floor(whole/1000)+' km '+whole%1000+' m');
  }else{
   const [,km,m,b]=q.detail.match(/가 = (\d+) km (\d+) m \/ 나 = (\d+) m/);
   const a=Number(km)*1000+Number(m);
   assert.equal(q.answer,a>Number(b)?'가':a<Number(b)?'나':'두 길이 같다');
  }
 }
});
test('second-hand readings, minute conversions, carrying and borrowing honor base sixty',()=>{
 for(const [i,q]of kind('second').items.entries()){
  if(i%2===0)assert.equal(q.answer,Number(q.prompt.match(/초침이 숫자 (\d+)/)[1])*5+'초');
  else{
   const [,m,s]=q.prompt.match(/(\d+)분 (\d+)초를 초/);
   assert.equal(q.answer,Number(m)*60+Number(s)+'초');
  }
 }
 for(const calc of ['time-add','time-sub'])for(const q of kind(calc).items){
  const expr=q.detail.split(': ')[1];
  const chunks=expr.split(calc==='time-add'?' + ':' − ');
  assert.equal(chunks.length,2,expr);
  const a=duration(chunks[0]),b=duration(chunks[1]),ans=duration(q.answer);
  assert.equal(a.unit,b.unit);assert.equal(a.unit,ans.unit);
  assert.equal(ans.value,calc==='time-add'?a.value+b.value:a.value-b.value,q.evidenceId);
  assert.ok(ans.value>=0);assert.ok(!/시간 6\d+분|분 6\d+초/.test(q.answer));
  for(const w of q.choices.slice(1))assert.notEqual(duration(w).value,ans.value);
  assert.match(q.explanation,calc==='time-add'?/60(분|초)을 1(시간|분)/:/60(분|초)로 바꿔 계산/);
 }
});
test('estimate tasks state concrete objects and do not imply that actual measurement was observed',()=>{
 for(const k of ['length-estimate','weight-estimate','capacity-estimate']){
  const b=kind(k);
  assert.equal(b.items.length,16);
  const labels=new Set();
  for(const q of b.items){
   assert.match(q.prompt,/어림/);assert.match(q.answer,/^약 /);
   assert.match(q.explanation,/실제|보통/);
   assert.ok(q.detail.includes(': '));
   const target=q.detail.split(': ')[1].split('.')[0];
   assert.ok(!labels.has(target),'Repeated estimation object '+target);labels.add(target);
   const vals=q.choices.map(s=>s.replace(/^약 /,''));
   assert.equal(new Set(vals).size,3);
   assert.ok(vals.every(s=>/^(?:\d+(?:\.\d+)?) (?:mm|cm|m|km|g|kg|t|mL|L)$/.test(s)));
  }
 }
});
test('grade-three addition/subtraction and grade-four multiplication/division estimates match independently rounded operands',()=>{
 for(const q of kind('estimate-three').items){
  const [,a,op,b]=q.detail.match(/(\d+) ([+−]) (\d+)/);
  const x=round10(Number(a)),y=round10(Number(b));
  assert.equal(q.answer,String(op==='+'?x+y:x-y));
  assert.equal(new Set(q.choices.map(Number)).size,3);
 }
 for(const q of kind('estimate-four').items){
  const m=q.detail.match(/(\d+) ([×÷]) (\d+)/);
  assert.ok(m,q.detail);
  const [,a,op,b]=m,x=round10(Number(a)),y=round10(Number(b));
  const expected=op==='×'?x*y:x/y;
  assert.equal(Number(q.answer),expected,q.evidenceId);
  assert.ok(Number.isInteger(expected));
  assert.equal(new Set(q.choices.map(Number)).size,3);
 }
});
test('the new measurement module loads before evidence initialization on the printable worksheet page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade3-measure-estimate.js'));
 assert.ok(html.indexOf('worksheet-math-grade3-measure-estimate.js')<html.indexOf('worksheet-evidence-banks.js'));
});
