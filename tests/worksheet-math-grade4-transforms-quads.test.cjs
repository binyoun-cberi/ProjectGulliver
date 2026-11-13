'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../worksheet-math-grade4-transforms-quads.js');
const E=require('../worksheet-evidence-banks.js');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
const fs=require('node:fs'),path=require('node:path');
const banks=G.banks(),get=kind=>{const b=banks.find(x=>x.id==='math-g4-transform-'+kind);assert.ok(b,kind);return b;};
const location=(r,c)=>r+'행 '+c+'열';
function graphCell(q,kind){
 const body=q.scienceMaterial.body;
 let x,y;
 if(kind==='slide'){
  const m=body.match(/<polygon points="([\d.]+),([\d.]+) /);
  assert.ok(m,q.evidenceId);x=Number(m[1]);y=Number(m[2])+10;
 }else{
  const m=body.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="5"/);
  assert.ok(m,q.evidenceId);x=Number(m[1]);y=Number(m[2]);
 }
 const c=(x-68)/25+0.5,r=(y-32)/25+0.5;
 assert.ok(Number.isInteger(r)&&Number.isInteger(c));
 return [r,c];
}
test('six grade-four movement and quadrilateral lessons contain 96 sourced, uniquely answerable questions',()=>{
 assert.equal(banks.length,6);assert.equal(banks.flatMap(b=>b.items).length,96);
 const ids=new Set(),targets=new Set();
 for(const bank of banks){
  assert.equal(bank.subject,'math');assert.deepEqual(bank.grades,[4]);assert.equal(bank.items.length,16);
  const target=[bank.exactSemester,bank.exactUnitName,bank.exactLessonName].join('|');
  assert.ok(!targets.has(target),target);targets.add(target);
  const questions=new Set();
  for(const q of bank.items){
   assert.ok(!ids.has(q.evidenceId));ids.add(q.evidenceId);
   const key=JSON.stringify([q.prompt,q.detail||q.scienceMaterial]);
   assert.ok(!questions.has(key),'duplicate problem '+q.evidenceId);questions.add(key);
   assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);
   assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=18);
   assert.equal(q.knowledgeOnly,true);assert.match(q.sourceLabel,/창작/);
   assert.ok(!/NaN|undefined|을\/를|이\/가/.test(q.prompt+' '+q.explanation+' '+(q.detail||'')));
   if(q.scienceMaterial){
    assert.equal(q.scienceMaterial.kind,'diagram');assert.ok(q.scienceMaterial.body.length>200);
    assert.ok(!/<script|javascript:|onload=/.test(q.scienceMaterial.body));
   }else assert.ok(q.detail.length>12);
  }
 }
 assert.equal(ids.size,96);
 const copy=G.banks();copy[0].items[0].answer='incorrect';
 assert.notEqual(G.banks()[0].items[0].answer,'incorrect');
});
test('all six exact grade-four lessons map to the target semester and print ten reproducible choice/short items',()=>{
 for(const b of banks){
  const unit=T.units('math',4,b.exactSemester).find(u=>u.name===b.exactUnitName);
  assert.ok(unit,b.id+' missing unit');
  const lesson=unit.lessons.find(l=>l.name.trim().replace(/^\d+\.\s*/,'')===b.exactLessonName);
  assert.ok(lesson,b.id+' missing lesson');
  assert.equal(E.find(unit,lesson)?.id,b.id,b.id+' existing content overwritten');
  const bound=T.binding(unit,lesson);
  assert.equal(bound?.kind,'evidence');assert.equal(bound.bankId,b.id);
  assert.equal(T.capacity(bound,'choice'),16);
  assert.deepEqual(T.formats(bound).map(x=>x[0]),['choice','short']);
  for(const responseFormat of ['choice','short'])for(const seed of [7,42]){
   const opts={subject:'math',grade:4,semester:b.exactSemester,unitId:unit.id,lessonId:lesson.id,count:10,seed,responseFormat};
   const sheet=T.generate(opts,C);
   assert.deepEqual(T.generate(opts,C),sheet);assert.equal(sheet.items.length,10);
   assert.equal(sheet.curriculum.lessonId,lesson.id);
   assert.equal(new Set(sheet.items.map(x=>x.evidenceId)).size,10);
   for(const q of sheet.items){
    assert.equal(q.curriculumLesson,lesson.id);assert.ok(q.answer&&q.explanation);
    if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.deepEqual(q.choices,[]);
   }
  }
 }
});
test('slide and point movement answers reproduce the actual plotted SVG grid cell after displacement',()=>{
 for(const kind of ['slide','point'])for(const q of get(kind).items){
  const [r,c]=graphCell(q,kind);
  const m=q.prompt.match(/(오른쪽|왼쪽|위쪽|아래쪽)으로 (\d+)칸/);
  assert.ok(m,q.prompt);
  const amount=Number(m[2]),delta={'오른쪽':[0,amount],'왼쪽':[0,-amount],'위쪽':[-amount,0],'아래쪽':[amount,0]}[m[1]];
  const expected=location(r+delta[0],c+delta[1]);
  assert.equal(q.answer,expected,q.evidenceId);
  assert.ok(q.choices.every(choice=>/^[1-7]행 [1-7]열$/.test(choice)));
  assert.equal(new Set(q.choices).size,3);
 }
});
test('flipped triplet figures reverse precisely the order shown in the original SVG',()=>{
 for(const q of get('flip').items){
  const labels=[...q.scienceMaterial.body.matchAll(/<text x="[\d.]+" y="[\d.]+" text-anchor="middle" font-size="(?:14|16)" fill="#222">([^<]+)<\/text>/g)].map(x=>x[1]);
  assert.equal(labels.length,3,q.evidenceId);
  const expected=[...labels].reverse().join(' → ');
  assert.equal(q.answer,expected,q.evidenceId);
  assert.equal(new Set(labels).size,3);
  assert.notEqual(q.answer,labels.join(' → '));
 }
});
test('rotating a figure 90/180/270 degrees produces the sole mathematically correct direction',()=>{
 const dirs=['▲','▶','▼','◀'];
 for(const q of get('rotate').items){
  const initial=q.scienceMaterial.body.match(/font-size="73"[^>]*>([^<]+)<\/text>/);
  assert.ok(initial,q.evidenceId);
  const i=dirs.indexOf(initial[1]);assert.ok(i>=0);
  const step=q.prompt.includes('반시계 방향 90°')?3:q.prompt.includes('180°')?2:1;
  assert.equal(q.answer,dirs[(i+step)%4],q.evidenceId);
  assert.ok(q.choices.every(x=>dirs.includes(x)));
 }
});
test('every quadrilateral case describes enough facts for its exact category or square-property answer',()=>{
 const expected=['사다리꼴','평행사변형','마름모','직사각형','네 변의 길이가 같고 네 각이 모두 직각이다'];
 for(const [i,q]of get('quadrilaterals').items.entries()){
  assert.equal(q.answer,expected[i%5],q.evidenceId);
  if(i%5===0)assert.ok(q.detail.includes('다른 두 변은 평행하지 않습니다'));
  if(i%5===1)assert.ok(q.detail.includes('마주 보는 두 쌍의 변이 각각 평행'));
  if(i%5===2)assert.ok(q.detail.includes('네 변의 길이는 각각'));
  if(i%5===3)assert.ok(q.detail.includes('네 각은 모두 90°'));
  if(i%5===4)assert.ok(q.detail.includes('네 각이 모두 90°'));
 }
});
test('existing A4 worksheet builder loads the transform module before evidence bank registration',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../문제지 만들기.html'),'utf8');
 assert.ok(html.includes('worksheet-math-grade4-transforms-quads.js'));
 assert.ok(html.indexOf('worksheet-math-grade4-transforms-quads.js')<html.indexOf('worksheet-evidence-banks.js'));
});
