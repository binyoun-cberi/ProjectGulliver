'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const E=require('../worksheet-evidence-banks.js'),M=require('../worksheet-math-grade3-fraction-graphs.js');
const fs=require('node:fs'),path=require('node:path');
const banks=M.banks(),byKind=k=>{const b=banks.find(x=>x.id.endsWith('-'+k));assert.ok(b,k);return b;};
test('ten grade-three second-semester fraction and picture-graph banks contain 160 valid distinct cases',()=>{
 assert.equal(banks.length,10);assert.equal(banks.flatMap(b=>b.items).length,160);
 const ids=new Set(),lessons=new Set();
 for(const b of banks){
  assert.deepEqual(b.grades,[3]);assert.equal(b.subject,'math');assert.equal(b.exactSemester,2);
  assert.equal(b.items.length,16);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!lessons.has(target),target);lessons.add(target);
  const keys=new Set();
  for(const q of b.items){
   assert.ok(!ids.has(q.evidenceId),q.evidenceId);ids.add(q.evidenceId);
   const k=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!keys.has(k),b.id+' '+k);keys.add(k);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>14);assert.match(q.sourceLabel,/창작/);assert.equal(q.knowledgeOnly,true);
   assert.ok(!/을\/를|이\/가|과\(와\)/.test(q.prompt+' '+q.explanation+' '+(q.detail||'')),q.evidenceId);
  }
 }
 assert.equal(ids.size,160);
 const clone=M.banks();clone[0].items[0].answer='changed';
 assert.notEqual(M.banks()[0].items[0].answer,'changed');
});
test('ten 2022 textbook lessons match exactly and support real seeded choice/short generation',()=>{
 for(const bank of banks){
  const u=T.units('math',3,2).find(x=>x.name===bank.exactUnitName);assert.ok(u,bank.id);
  const l=u.lessons.find(x=>x.name.trim()===bank.exactLessonName);assert.ok(l,bank.id+' '+bank.exactLessonName);
  assert.equal(E.find(u,l)?.id,bank.id,bank.id+' clobbered');
  const b=T.binding(u,l);assert.equal(b?.kind,'evidence');assert.equal(b.bankId,bank.id);
  assert.equal(T.capacity(b,'choice'),16);
  assert.deepEqual(T.formats(b).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const options={subject:'math',grade:3,semester:2,unitId:u.id,lessonId:l.id,count:10,responseFormat,seed};
   const sheet=T.generate(options,C);
   assert.deepEqual(T.generate(options,C),sheet);assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,l.id);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   for(const row of sheet.items){
    assert.equal(row.curriculumLesson,l.id);
    assert.ok(row.answer&&row.explanation);
    if(responseFormat==='choice')assert.ok(row.choices.includes(row.answer));else assert.deepEqual(row.choices,[]);
   }
  }
 }
});
test('equal partitions, fractional sets, improper/mixed conversion and fraction ordering are mathematically sound',()=>{
 for(const q of byKind('equal-part').items){
  const d=q.detail;
  const black=[...d].filter(x=>x==='■').length,white=[...d].filter(x=>x==='□').length;
  assert.equal(q.answer,black+'/'+(black+white));assert.ok(black>=1&&white>=1);
 }
 for(const q of byKind('fraction-of-set').items){
  const m=q.prompt.match(/전체 (\d+)개 중 (\d+)\/(\d+)/);
  assert.ok(m,q.prompt);assert.equal(q.answer,Number(m[1])*Number(m[2])/Number(m[3])+'개');
 }
 for(const q of byKind('part-of-whole').items){
  const m=q.detail.match(/전체 (\d+)개에서 (\d+)개/);assert.ok(m,q.detail);
  assert.equal(q.answer,m[2]+'/'+m[1]);
 }
 for(const q of byKind('fraction-kinds1').items){
  const [num,den]=q.prompt.match(/분수 (\d+)\/(\d+)/).slice(1).map(Number);
  assert.equal(q.answer,num<den?'진분수':'가분수');
 }
 for(const q of byKind('fraction-kinds2').items){
  const m=q.prompt.match(/대분수 (\d+)와 (\d+)\/(\d+)|대분수 (\d+)과 (\d+)\/(\d+)/);
  assert.ok(m,q.prompt);
  const nums=m.slice(1).filter(Boolean).map(Number),[whole,top,den]=nums;
  assert.equal(q.answer,(whole*den+top)+'/'+den);
 }
 for(const q of byKind('convert-mixed').items){
  const [num,den]=q.prompt.match(/가분수 (\d+)\/(\d+)/).slice(1).map(Number);
  assert.ok(q.answer.startsWith(String(Math.floor(num/den))));
  assert.ok(q.answer.endsWith((num%den)+'/'+den));
 }
 for(const q of byKind('fraction-compare').items){
  const [an,ad,bn,bd]=q.prompt.match(/(\d+)\/(\d+)와 (\d+)\/(\d+)/).slice(1).map(Number);
  assert.equal(ad,bd);
  assert.equal(q.answer,(an>bn?an:bn)+'/'+ad);
 }
});
test('chart labels and pictograph keys yield the sole correct numerical choices',()=>{
 for(const kind of ['graph-read','graph-draw','graph-interpret'])for(const q of byKind(kind).items){
  const chart=q.scienceMaterial;
  assert.equal(chart?.kind,'table');assert.equal(chart.rows.length,3);
  const m=chart.note.match(/하나는 (\d+)(개|명)/);assert.ok(m,chart.note);
  const scale=Number(m[1]);
  if(kind==='graph-read'){
   const label=q.prompt.match(/(가|나|다)의 수/)[1];
   const symbols=chart.rows.find(row=>row[0]===label)[1];
   assert.equal(q.answer,[...symbols].length*scale+'개');
  }
  if(kind==='graph-draw'){
   const label=q.prompt.match(/(가|나|다)의 칸/)[1];
   const count=Number(chart.rows.find(row=>row[0]===label)[1].replace('개',''));
   assert.equal(q.answer,count/scale+'개');
  }
  if(kind==='graph-interpret'){
   const [,a,b]=q.prompt.match(/(가|나|다)와 (가|나|다)의 조사한 수/);
   const x=chart.rows.find(row=>row[0]===a)[1].length;
   const y=chart.rows.find(row=>row[0]===b)[1].length;
   assert.equal(q.answer,Math.abs(x-y)*scale+'명');
  }
  assert.equal(new Set(q.choices).size,3);
 }
});
test('new grade-three unit scripts are loaded before initial evidence registration on print page',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(page.includes('worksheet-math-grade3-fraction-graphs.js'));
 assert.ok(page.indexOf('worksheet-math-grade3-fraction-graphs.js')<page.indexOf('worksheet-evidence-banks.js'));
});
