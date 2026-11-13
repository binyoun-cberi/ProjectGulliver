'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Graph=require('../worksheet-math-grade4-bar-line-graphs.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=Graph.banks(),bank=kind=>{const b=banks.find(x=>x.id==='math-g4-charts-'+kind);assert.ok(b,kind);return b;};
const num=s=>Number(s.match(/\d+/)[0]);
function bars(svg){
 const rects=[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="36" height="(\d+)" /g)];
 const labels=[...svg.matchAll(/<text x="(\d+)" y="193" text-anchor="middle" font-size="11" fill="#222">([^<]+)<\/text>/g)];
 assert.equal(rects.length,4);assert.equal(labels.length,4);
 return Object.fromEntries(labels.map((m,i)=>[m[2],Number(rects[i][3])/4]));
}
function lines(svg){
 const points=svg.match(/<polyline points="([^"]+)"/);assert.ok(points,'No connected plotted points');
 const yvalues=points[1].split(' ').map(s=>(170-Number(s.split(',')[1]))/4);
 assert.equal(yvalues.length,5);
 assert.ok(yvalues.every(v=>Number.isInteger(v)&&v>=0&&v<=30));
 return Object.fromEntries(['월','화','수','목','금'].map((d,i)=>[d,yvalues[i]]));
}
test('nine independent grade-four chart lessons provide 144 original, unique and valid questions',()=>{
 assert.equal(banks.length,9);assert.equal(banks.flatMap(x=>x.items).length,144);
 const seenIds=new Set(),seenTargets=new Set();
 for(const b of banks){
  assert.equal(b.subject,'math');assert.deepEqual(b.grades,[4]);assert.equal(b.items.length,16);
  const target=[b.exactSemester,b.exactUnitName,b.exactLessonName].join('|');
  assert.ok(!seenTargets.has(target),target);seenTargets.add(target);
  const uniqueQuestions=new Set();
  for(const q of b.items){
   assert.ok(!seenIds.has(q.evidenceId));seenIds.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.scienceMaterial]);
   assert.ok(!uniqueQuestions.has(key),b.id);uniqueQuestions.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));
   assert.ok(q.explanation.length>=22);assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
   assert.ok(!/NaN|undefined|을\/를|이\/가/.test(q.prompt+' '+q.explanation));
   const sm=q.scienceMaterial;assert.ok(['diagram','table'].includes(sm.kind));
   if(sm.kind==='diagram'){
    assert.equal(sm.viewBox,'0 0 360 215');assert.ok(sm.body.includes('<line '));
    assert.match(sm.body,/>단위: [^<]+<\/text>/);
    for(let n=0;n<=30;n+=5)assert.ok(sm.body.includes('>'+n+'</text>'),'missing axis tick '+n);
    assert.ok(!/<script|onload=|javascript:/.test(sm.body));
   }else {
    assert.equal(sm.headers.length,2);assert.ok(sm.rows.length>=1);
   }
  }
 }
 assert.equal(seenIds.size,144);
 const copy=Graph.banks();copy[0].items[0].answer='changed';assert.notEqual(Graph.banks()[0].items[0].answer,'changed');
});
test('nine exact grade-four lessons are reachable and deterministically generate ten choice and short questions',()=>{
 for(const b of banks){
  const unit=T.units('math',4,b.exactSemester).find(u=>u.name===b.exactUnitName);assert.ok(unit,b.id+' unit');
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' lesson '+b.exactLessonName);
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' evidence bank mismatch');
  const bound=T.binding(unit,lesson);assert.equal(bound?.kind,'evidence');assert.equal(bound.bankId,b.id);
  assert.equal(T.capacity(bound,'choice'),16);assert.deepEqual(T.formats(bound).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const opts={subject:'math',grade:4,semester:b.exactSemester,unitId:unit.id,lessonId:lesson.id,seed,count:10,responseFormat};
   const sheet=T.generate(opts,C);
   assert.deepEqual(T.generate(opts,C),sheet);assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(q=>q.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);assert.ok(q.answer&&q.explanation&&q.scienceMaterial);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('every bar chart uses four actual drawn columns and answers match graphic heights and scale',()=>{
 for(const kind of ['bar-read','bar-collect','bar-problem'])for(const q of bank(kind).items){
  const bs=bars(q.scienceMaterial.body),unit=q.scienceMaterial.body.match(/단위: ([^<]+)/)[1];
  assert.ok(Object.values(bs).every(v=>v%5===0&&v>0));
  const names=[...q.prompt.matchAll(/‘([^’]+)’/g)].map(m=>m[1]);
  const expected=kind==='bar-read'?bs[names[0]]:kind==='bar-collect'?Math.abs(bs[names[0]]-bs[names[1]]):bs[names[0]]+bs[names[1]];
  assert.ok(Number.isFinite(expected),q.prompt);
  assert.equal(q.answer,expected+unit,q.evidenceId);
 }
 for(const q of bank('bar-plot').items){
  const unit=q.scienceMaterial.rows[0][1].replace(/\d+/g,''),label=q.prompt.match(/‘([^’]+)’/)[1];
  const found=q.scienceMaterial.rows.find(r=>r[0]===label);
  assert.ok(found);assert.equal(q.answer,num(found[1])/5+'칸');
  assert.ok(q.scienceMaterial.note.includes('5'+unit));
 }
});
test('each line chart includes five plotted, joined dots with values matching questions',()=>{
 for(const kind of ['line-read','line-collect','line-problem'])for(const q of bank(kind).items){
  const ys=lines(q.scienceMaterial.body),unit=q.scienceMaterial.body.match(/단위: ([^<]+)/)[1];
  const dates=[...q.prompt.matchAll(/([월화수목금])요일/g)].map(m=>m[1]);
  const vals=Object.values(ys);
  const expected=kind==='line-read'?ys[dates[0]]:kind==='line-collect'?Math.abs(ys[dates[0]]-ys[dates[1]]):Math.max(...vals)-Math.min(...vals);
  assert.ok(Number.isFinite(expected),q.prompt);assert.equal(q.answer,expected+unit,q.evidenceId);
 }
 for(const q of bank('line-plot').items){
  const d=q.prompt.match(/([월화수목금])요일/)[1];
  const found=q.scienceMaterial.rows.find(row=>row[0]===d);
  assert.ok(found,q.prompt);assert.equal(q.answer,num(found[1])/5+'칸');
  assert.match(q.scienceMaterial.note,/5/);
 }
});
test('graph selection questions distinguish reading trends across time from comparing categories',()=>{
 for(const [i,q]of bank('graph-select').items.entries()){
  const desc=q.scienceMaterial.rows[0][1];
  assert.equal(q.answer,i%2===0?'꺾은선그래프':'막대그래프');
  assert.ok(i%2===0?desc.includes('월요일부터 금요일까지'):desc.includes('막대의 높이'));
  assert.ok(q.choices.some(x=>x!==q.answer));
 }
});
test('chart script is integrated before the existing evidence bank on printable worksheet page',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade4-bar-line-graphs.js'));
 assert.ok(html.indexOf('worksheet-math-grade4-bar-line-graphs.js')<html.indexOf('worksheet-evidence-banks.js'));
});
