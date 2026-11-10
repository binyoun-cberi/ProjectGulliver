'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Bank=require('../data/korean-assessment-bank.js');
const Core=require('../daily-worksheet-core.js');

const texts=[1,3,5].flatMap(grade=>Bank.passages(grade));
const passage=id=>{
 const p=texts.find(entry=>entry.id==='kr-eval-'+id);
 assert.ok(p,'missing passage '+id);
 return p;
};

test('국어 48편의 자연스러움 검토는 문제은행 크기와 읽기·듣기 독립 문항을 유지한다',()=>{
 assert.equal(texts.length,48);
 assert.equal(new Set(texts.map(p=>p.id)).size,48);
 for(const grade of [1,3,5])assert.equal(Bank.passages(grade).length,16);
 for(const p of texts){
  assert.ok(p.passage.length>=75);
  assert.equal(p.questions.length,5);
  assert.equal(p.listeningQuestions.length,5);
  assert.equal(p.listeningQuestions.filter((q,i)=>q.prompt!==p.questions[i].prompt).length,2);
  assert.equal(p.reviewStatus,'수업 전 교사 검수 필요');
  for(const q of [...p.questions,...p.listeningQuestions]){
   assert.equal(q.choices.length,3);
   assert.equal(q.choices[0],q.answer);
   assert.equal(new Set(q.choices).size,3);
   assert.ok(q.explanation.length>=9);
   assert.ok(q.skill);
  }
 }
});
test('문장 편집: 사건의 시점과 물리적 설정을 일치시킨다',()=>{
 assert.match(passage('two-friends-promise').passage,/다음 날 학교에 돌아온 민아/);
 assert.match(passage('chick-bridge').passage,/바람에 밀려갔지요/);
 assert.ok(!passage('chick-bridge').passage.includes('물살에 밀려'));
 assert.match(passage('two-ways-map').passage,/지도에 연필로 물에 잠긴 구간을 표시/);
 assert.match(passage('old-shoes').passage,/한 학년 아래인 학생/);
 assert.match(passage('tree-shade').passage,/벤치의 다리 하나가 부러져/);
});
test('문장 편집: 강요한 교훈보다 장면·대화·관찰의 근거를 제시한다',()=>{
 assert.match(passage('blue-drawing').passage,/“나 하늘 칠하고 빌려줄게/);
 assert.match(passage('fox-flattery-cheese').passage,/치즈를 먹는 여우를 내려다보았어요/);
 assert.match(passage('two-school-library').passage,/첫 장에 짧은 추천 글/);
 assert.match(passage('shared-mural').passage,/강가의 나무를 덧그렸어요/);
 assert.match(passage('museum-evidence').passage,/‘무늬가 있다’/);
 assert.match(passage('debate-second-try').passage,/“어디에 세울 거야/);
 const banned=[
  /이 이야기[는에서][^.]{0,50}교훈/,
  /깨달았어요[.!]/,
  /가상의 학교/,
  /다음은 가상/,
  /두 학생이 있다고 합시다/
 ];
 for(const p of texts)for(const pattern of banned)assert.doesNotMatch(p.passage,pattern,p.id);
});
test('직접 작성된 질문과 듣기 질문은 수정된 본문의 근거를 유지한다',()=>{
 const bench=passage('tree-shade');
 assert.equal(bench.questions[1].answer,'벤치');
 assert.match(bench.questions[4].explanation,/벤치가 부서져/);
 assert.equal(bench.listeningQuestions[4].answer,'산책하던 할머니');
 assert.match(bench.passage,/산책하던 할머니가 먼저/);
 assert.doesNotMatch(bench.listeningQuestions[4].prompt,/약속/);

 const dhamma=passage('dhammapada-peace');
 assert.doesNotMatch(dhamma.passage,/있다고 합시다/);
 assert.match(dhamma.listeningQuestions[4].answer,/속상했던 점/);
 assert.match(dhamma.passage,/무엇 때문에 속상했는지 차례로/);
 assert.notEqual(dhamma.listeningQuestions[4].answer,'언성을 낮추었다');

 const moon=passage('ai-answer-check');
 assert.match(moon.passage,/달 표면에서 통신 장치 없이/);
 assert.match(moon.questions[0].answer,/달 표면에서 통신 장치 없이/);
 assert.match(moon.questions[0].explanation,/통신 장치 없이/);

 const art=passage('shared-mural');
 assert.match(art.questions[1].answer,/복도 가운데/);
 assert.match(art.passage,/복도의 가운데/);
});
test('제목/인용 사례를 다듬은 뒤 모든 학년에서 읽기와 듣기 평가가 정상 생성된다',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','문제지 만들기.html'),'utf8');
 for(const file of ['data/korean-assessment-bank.js','data/korean-assessment-extra-early.js','data/korean-assessment-extra-middle.js','data/korean-assessment-extra-upper.js'])
  assert.ok(html.includes(file+'?v=20261110-human1'),'cache refresh '+file);
 for(let grade=1;grade<=6;grade++)for(const topic of ['reading-assessment','listening-set'])for(const count of [5,10,15,20]){
  const type=topic+'-five';
  const sheet=Core.generate({subject:'korean',grade,topic,type,count,seed:20261110});
  assert.equal(sheet.items.length,count);
  assert.equal(sheet.items.filter(q=>q.readingPassage).length,count/5);
  assert.equal(sheet.items.filter(q=>q.listeningPassage).length,topic==='listening-set'?count/5:0);
  assert.ok(sheet.items.every(q=>q.choices.includes(q.answer)));
 }
});