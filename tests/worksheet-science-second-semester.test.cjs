'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js'),T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js'),fs=require('node:fs'),path=require('node:path');

const target=T.catalog.filter(u=>u.subject==='science'&&u.semester===2&&[3,4,6].includes(u.grade)).flatMap(u=>u.lessons.map(lesson=>({unit:u,lesson,binding:T.binding(u,lesson)})));
const banks=E.banks.filter(x=>x.scienceSecondSemester),items=banks.flatMap(b=>b.items.filter(q=>!q.scienceDepth));
const unique=q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial,q.readingPassage]);

test('all seventy-one second-semester lesson banks have twenty-five unique evidence items',()=>{
 assert.equal(target.length,71);
 assert.equal(banks.length,71);
 assert.equal(items.length,1775);
 assert.equal(new Set(items.map(q=>q.evidenceId)).size,1775);
 const grades={};
 for(const {unit,lesson,binding} of target){
  grades[unit.grade]=(grades[unit.grade]||0)+1;
  assert.equal(binding?.kind,'evidence',lesson.name);
  assert.equal(T.capacity(binding,'choice'),25+E.banks.find(b=>b.id===binding.bankId).items.filter(q=>q.scienceDepth).length,lesson.name);
  const b=banks.find(b=>b.id===binding.bankId);
  assert.ok(b,lesson.name);
  assert.equal(b.exactSemester,2);assert.equal(b.exactUnitName,unit.name);
  assert.equal(b.exactLessonName,lesson.name.replace(/^(?:[①-⑳]|\d+\.)\s*/, '').trim());
  assert.equal(b.items.filter(q=>!q.scienceDepth).length,25);
  assert.equal(new Set(b.items.filter(q=>!q.scienceDepth).map(q=>q.passageId)).size,5);
  assert.equal(b.items.filter(q=>!q.scienceDepth&&q.scienceMaterial?.kind==='table').length,1);
  const m=b.items[0].scienceMaterial;
  assert.equal(m.rows.length,5);for(const row of m.rows)assert.equal(row.length,m.headers.length);
 }
 assert.deepEqual(grades,{'3':28,'4':23,'6':20});
 for(const q of items){
  assert.ok(q.answer&&q.explanation?.length>10&&q.detail?.length>20,q.evidenceId);
  assert.equal(q.choices.length,3);
  assert.equal(new Set(q.choices).size,3,q.evidenceId);
  assert.ok(q.choices.includes(q.answer));
  assert.ok(q.passageId&&q.passageTitle);
 }
});

test('639 complete 20-question papers use exact objectives and vary selection across seeds',()=>{
 let generated=0,varied=0,tables=0;
 for(const {unit,lesson} of target){
  const signatures=[];
  for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){
   const result=T.generate({subject:'science',grade:unit.grade,semester:2,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},C);
   generated++;
   assert.equal(result.items.length,20,lesson.name);
   assert.equal(new Set(result.items.map(unique)).size,20,lesson.name);
   assert.ok(result.items.every(q=>q.answer&&q.explanation),lesson.name);
   if(responseFormat==='choice'){
    signatures.push(result.items.map(q=>q.evidenceId).sort().join(','));
    tables+=Number(result.items.some(q=>q.scienceMaterial?.kind==='table'));
    for(const q of result.items){assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));}
   }else{
    assert.ok(result.items.every(q=>q.choices.length===0));
    if(responseFormat==='essay')assert.ok(result.items.every(q=>q.modelExplanation===q.explanation&&/근거/.test(q.prompt)));
   }
  }
  varied+=Number(new Set(signatures).size>1);
 }
 assert.equal(generated,639);
 assert.equal(varied,71);
 assert.ok(tables>=165,'Expected at least one comparison table in most printouts');
});

test('all 197 science objectives now have at least 20 questions and no cross-semester leaks',()=>{
 const science=T.catalog.filter(u=>u.subject==='science');
 const lessons=science.flatMap(u=>u.lessons.map(lesson=>({u,lesson,binding:T.binding(u,lesson)})));
 assert.equal(lessons.length,197);
 for(const {u,lesson,binding} of lessons){
  assert.ok(binding,'Not linked: '+u.grade+'-'+u.semester+' '+lesson.name);
  assert.ok(T.capacity(binding,'choice')>=20,'Insufficient: '+u.grade+'-'+u.semester+' '+lesson.name);
  const id=binding.bankId;
  if(u.semester===2&&[3,4,6].includes(u.grade))assert.ok(id?.startsWith('science-sem2-'),lesson.name);
  else assert.ok(!id?.startsWith('science-sem2-'),u.grade+'-'+u.semester+' '+lesson.name);
 }
 const html=fs.readFileSync(path.resolve(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.indexOf('src="worksheet-science-second-semester.js')>0);
 assert.ok(html.indexOf('src="worksheet-science-second-semester.js')<html.indexOf('src="worksheet-evidence-banks.js'));
});
