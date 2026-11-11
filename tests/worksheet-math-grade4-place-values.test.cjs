'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../worksheet-math-grade4-place-values.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js'),E=require('../worksheet-evidence-banks.js');
const fs=require('node:fs'),path=require('node:path');
const banks=M.banks(),get=k=>{const b=banks.find(b=>b.id.endsWith('-'+k));assert.ok(b,k);return b;};
const number=s=>Number(s.replaceAll(',',''));
test('eleven grade-four units provide 176 original and mathematically distinct answer choices',()=>{
 assert.equal(banks.length,11);assert.equal(banks.flatMap(b=>b.items).length,176);
 const ids=new Set(),targets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[4]);assert.equal(b.items.length,16);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!targets.has(target),'same target '+target);targets.add(target);
  const keys=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),'duplicate ID '+q.evidenceId);ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!keys.has(key),'duplicate problem '+b.id);keys.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=15);
   assert.match(q.sourceLabel,/창작/);assert.equal(q.knowledgeOnly,true);
   assert.ok(!/이\(가\)|을\/를|과\(와\)|NaN|undefined/.test(q.prompt+' '+q.explanation));
   if(['ten-thousand','five-digit','hundred-thousand','hundred-million','trillion','skip-count','hundredths','thousandths'].some(k=>b.id.endsWith('-'+k)))
    assert.equal(new Set(q.choices.map(number)).size,3,q.evidenceId);
  }
 }
 assert.equal(ids.size,176);
 const clone=M.banks();clone[0].items[0].answer='changed';assert.notEqual(M.banks()[0].items[0].answer,'changed');
});
test('eleven exact grade-four textbook lessons generate ten reproducible choice and short questions with original curriculum IDs',()=>{
 for(const b of banks){
  const unit=T.units('math',4,b.exactSemester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,b.id+' missing unit');
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' missing lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' matched wrong bank');
  const binding=T.binding(unit,lesson);
  assert.equal(binding?.kind,'evidence');assert.equal(binding?.bankId,b.id);
  assert.equal(T.capacity(binding,'choice'),16);assert.deepEqual(T.formats(binding).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const args={subject:'math',grade:4,semester:b.exactSemester,unitId:unit.id,lessonId:lesson.id,count:10,seed,responseFormat};
   const sheet=T.generate(args,C);
   assert.deepEqual(T.generate(args,C),sheet);assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('large-number answer generation respects man, eok and jo place values without unsafe integer rounding',()=>{
 for(const q of get('ten-thousand').items){
  const m=q.prompt.match(/1만짜리 묶음 (\d+)개와 낱수 (\d+)/);assert.ok(m);
  assert.equal(number(q.answer),Number(m[1])*10000+Number(m[2]));
 }
 for(const q of get('five-digit').items){
  const m=q.prompt.match(/만의 자리 (\d+), 천의 자리 (\d+), 백의 자리 (\d+), 십의 자리 (\d+), 일의 자리 (\d+)/);
  assert.ok(m,q.prompt);
  assert.equal(number(q.answer),Number(m[1])*10000+Number(m[2])*1000+Number(m[3])*100+Number(m[4])*10+Number(m[5]));
 }
 for(const q of get('hundred-thousand').items){
  const m=q.prompt.match(/(십만|백만|천만)이 (\d+)개/);assert.ok(m);
  const unit={'십만':1e5,'백만':1e6,'천만':1e7}[m[1]];
  assert.equal(number(q.answer),unit*Number(m[2]));
 }
 for(const q of get('hundred-million').items){
  const m=q.prompt.match(/(\d+)억 (\d+)만/);assert.ok(m);
  assert.equal(number(q.answer),Number(m[1])*1e8+Number(m[2])*1e4);
 }
 for(const q of get('trillion').items){
  const m=q.prompt.match(/(\d+)조 (\d+)억/);assert.ok(m);
  assert.equal(number(q.answer),Number(m[1])*1e12+Number(m[2])*1e8);
  assert.ok(Number.isSafeInteger(number(q.answer)));
 }
 for(const q of get('skip-count').items){
  const nums=q.detail.match(/수의 배열: (.*) \/ /)[1].split(' → ').slice(0,3).map(number);
  assert.equal(nums.length,3);assert.equal(nums[1]-nums[0],nums[2]-nums[1]);
  assert.equal(number(q.answer),nums[2]+nums[1]-nums[0]);
 }
 for(const q of get('big-compare').items){
  const m=q.detail.match(/가 = ([\d,]+) \/ 나 = ([\d,]+)/);assert.ok(m);
  assert.equal(q.answer,number(m[1])>number(m[2])?'가':'나');
 }
});
test('decimal-place and magnitude questions distinguish tenths, hundredths, and thousandths exactly',()=>{
 for(const q of get('hundredths').items){
  const n=Number(q.prompt.match(/0\.01이 (\d+)개/)[1]);assert.equal(q.answer,(n/100).toFixed(2));
 }
 for(const q of get('thousandths').items){
  const n=Number(q.prompt.match(/0\.001이 (\d+)개/)[1]);assert.equal(q.answer,(n/1000).toFixed(3));
 }
 for(const q of get('decimal-relations').items){
  const m=q.prompt.match(/([\d.]+)은 ([\d.]+)의 몇 배/);assert.ok(m,q.prompt);
  const ratio=Number(q.answer.replace('배',''));
  assert.ok(Math.abs(Number(m[1])/Number(m[2])-ratio)<1e-9,q.prompt);
  assert.ok(ratio===10||ratio===100);
 }
 for(const q of get('decimal-compare').items){
  const m=q.detail.match(/가 = ([\d.]+) \/ 나 = ([\d.]+)/);assert.ok(m,q.detail);
  const a=Number(m[1]),b=Number(m[2]),expected=a>b?'가':a<b?'나':'두 수는 같다';
  assert.equal(q.answer,expected,q.detail);
 }
 assert.ok(get('decimal-compare').items.some(q=>q.answer==='두 수는 같다'),'include trailing-zero equivalence');
});
test('script loads before existing evidence bank registration on printable worksheet page',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(page.includes('worksheet-math-grade4-place-values.js'));
 assert.ok(page.indexOf('worksheet-math-grade4-place-values.js')<page.indexOf('worksheet-evidence-banks.js'));
});
