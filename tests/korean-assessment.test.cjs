'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bank=require('../data/korean-assessment-bank.js');
const core=require('../daily-worksheet-core.js');
const curriculum=require('../worksheet-korean-readings.js');

test('공통 지문은행: 학년대별 4편, 모두 5문항, 유일한 정답과 출처',()=>{
  assert.deepEqual(bank.audit(),{passages:12,questions:60,grades:[1,2,3,4,5,6]});
  const unique=new Set();
  for(let grade=1;grade<=6;grade++){
    const passages=bank.passages(grade);
    assert.equal(passages.length,4);
    for(const p of passages){
      assert.ok(p.read&&p.listen);
      assert.ok(p.reviewStatus.includes('검수 필요'));
      assert.ok(p.sourceTitle);
      unique.add(p.id);
      assert.equal(p.questions.length,5);
      for(const q of p.questions){
        assert.equal(q.choices[0],q.answer);
        assert.equal(new Set(q.choices).size,3);
        assert.ok(q.explanation.length>8);
      }
    }
    const readingSets=bank.asReadingSets(grade,{mode:'read'}),listeningSets=bank.asReadingSets(grade,{mode:'listen'});
    assert.equal(readingSets.length,4);
    assert.equal(listeningSets.length,4);
    for(let i=0;i<4;i++){
      assert.equal(readingSets[i].passage,listeningSets[i].passage,'읽기/듣기는 지문 원문을 공유해야 합니다.');
      assert.ok(readingSets[i].questions.filter((q,j)=>q[0]!==listeningSets[i].questions[j][0]).length>=2,'듣기 전용 문항이 2개 이상 필요합니다.');
    }
  }
  assert.equal(unique.size,12);
});

test('기존 국어 단원에서 읽기와 듣기 평가를 고를 수 있다',()=>{
 for(let grade=1;grade<=6;grade++){
   const units=core.units('korean',grade);
   const u=units.find(v=>v.id==='k'+grade+'-reading');
   assert.ok(u);
   assert.ok(u.topics.includes('reading-set'));
   assert.ok(u.topics.includes('reading-assessment'));
   assert.ok(u.topics.includes('listening-set'));
   assert.ok(core.types('korean',grade,'reading-assessment',u.id).some(([id])=>id==='reading-assessment-five'));
   assert.ok(core.types('korean',grade,'listening-set',u.id).some(([id])=>id==='listening-set-five'));
 }
});

test('학년별 듣기 평가 20문항은 4개 지문에 5문항씩 묶이고 본문도 재생에 남는다',()=>{
 for(let grade=1;grade<=6;grade++)for(const seed of [1,42,999]){
   const sheet=core.generate({subject:'korean',grade,topic:'listening-set',type:'listening-set-five',count:20,seed,variant:'tens',difficulty:'basic',responseFormat:'choice'});
   assert.equal(sheet.items.length,20);
   const grouped=new Map();
   for(const q of sheet.items){
     assert.ok(q.readingGroup);
     if(!grouped.has(q.readingGroup))grouped.set(q.readingGroup,[]);
     grouped.get(q.readingGroup).push(q);
     assert.ok(q.choices.includes(q.answer));
   }
   assert.equal(grouped.size,4);
   for(const items of grouped.values()){
     assert.equal(items.length,5);
     assert.equal(items.filter(item=>item.readingPassage).length,1);
     assert.equal(items.filter(item=>item.listeningPassage).length,1);
   }
 }
});

test('단답형 듣기 평가와 읽기 평가 모두 생성되며 원본 지문은 변하지 않는다',()=>{
 for(let grade=1;grade<=6;grade++){
  const source=bank.passages(grade)[0].passage;
  const options={subject:'korean',grade,topic:'listening-set',type:'listening-set-five',count:5,seed:6,responseFormat:'short',variant:'tens',difficulty:'basic'};
  const hearing=core.generate(options);
  assert.equal(hearing.items.length,5);
  assert.ok(hearing.items.every(item=>!item.choices.length&&item.answer));
  const reading=core.generate({...options,topic:'reading-assessment',type:'reading-assessment-five'});
  assert.equal(reading.items.length,5);
  assert.ok(reading.items[0].readingPassage);
  assert.equal(bank.passages(grade)[0].passage,source);
 }
});

test('새 읽기·듣기 유형 모두 20문항과 자동 기본 유형을 지원한다',()=>{
 for(let grade=1;grade<=6;grade++)for(const topic of ['reading-assessment','listening-set']){
  const defaultSheet=core.generate({subject:'korean',grade,topic,count:5,seed:20});
  assert.equal(defaultSheet.items.length,5);
  for(const suffix of ['five','literary','nonfiction']){
   const type=topic+'-'+suffix,options={subject:'korean',grade,topic,type,count:20,seed:66};
   assert.ok(core.supportedCounts(options).includes(20),grade+'/'+type);
   const sheet=core.generate(options);
   assert.equal(sheet.items.length,20);
   assert.equal(new Set(sheet.items.map(q=>q.readingGroup)).size,4);
   assert.equal(sheet.items.filter(q=>q.readingPassage).length,4);
  }
 }
});

test('교과 차시 문제은행에도 같은 원전 지문이 재사용된다',()=>{
 for(let grade=3;grade<=6;grade++){
  const available=curriculum.inventory(grade);
  for(const p of bank.passages(grade)){
   const match=available.find(x=>x.id===p.id);
   assert.ok(match,'Missing shared passage '+p.id);
   assert.equal(match.passage,p.passage);
   assert.equal(match.questions.length,5);
   assert.equal(match.sourceLabel,p.sourceTitle);
  }
 }
});

test('학생용 듣기 인쇄물에는 대본 본문을 출력하지 않고 교사 도구는 인쇄에서 숨김',()=>{
 const renderer=fs.readFileSync(path.join(__dirname,'..','daily-worksheet.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'..','worksheet-korean-assessment.css'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'..','문제지 만들기.html'),'utf8');
 assert.match(renderer,/if\(sheet\.topic==='listening-set'\)\{const note=/);
 assert.match(renderer,/else\{const body=document\.createElement\('p'\);body\.textContent=item\.readingPassage/);
 assert.match(css,/@media print[\s\S]*\.korean-listening-controls[\s\S]*display:none!important/);
 assert.ok(html.indexOf('data/korean-assessment-bank.js')<html.indexOf('daily-worksheet-core.js'));
 assert.ok(html.includes('worksheet-korean-assessment-ui.js'));
 const student=fs.readFileSync(path.join(__dirname,'..','worksheet-korean-assessment-ui.js'),'utf8');
 assert.match(student,/function gradeExam\(\)/);
 assert.match(student,/koreanExamStart/);
 assert.match(student,/if\(assessment\.topic!=='listening-set'\)/);
 assert.match(css,/@media print[\s\S]*\.korean-assessment-student\{display:none!important/);
});
