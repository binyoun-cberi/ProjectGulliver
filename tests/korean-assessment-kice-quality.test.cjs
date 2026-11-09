'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('../daily-worksheet-core.js');
const Bank=require('../data/korean-assessment-bank.js');
const Results=require('../worksheet-korean-assessment-results.js');

const tagged=['fact','cause','sequence','evidence','main','inference','application',
 'action','intent','structure','comparison','emotion','solution','safety','location','time','rule','condition'];
const get=id=>[1,3,5].flatMap(grade=>Bank.passages(grade)).find(p=>p.id==='kr-eval-'+id);

test('평가 요소 태그와 근거 해설이 모든 국어 평가 문항에 있다',()=>{
 for(let grade=1;grade<=6;grade++)for(const topic of ['reading-assessment','listening-set']){
  for(const type of [topic+'-five',topic+'-literary',topic+'-nonfiction']){
   for(const seed of [1,42,99])for(const count of [5,10,15,20]){
    const sheet=Core.generate({subject:'korean',grade,topic,type,seed,count,responseFormat:'choice'});
    assert.equal(sheet.items.length,count);
    const seen=new Set(),perGroup=new Map();
    for(const q of sheet.items){
      assert.match(q.readingGroup,/^kr-eval-/,'평가는 공통 출처·해설이 있는 지문만 사용');
      assert.ok(tagged.includes(q.koreanSkill),'평가 요소 태그: '+q.koreanSkill);
      assert.ok(q.explanation.length>9&&!/정답의 근거를 찾아보세요/.test(q.explanation));
      assert.ok(q.choices.includes(q.answer));
      assert.equal(new Set(q.choices).size,q.choices.length);
      assert.equal(q.choices.length,3);
      assert.ok(['literary','nonfiction'].includes(q.readingGenre));
      if(!perGroup.has(q.readingGroup))perGroup.set(q.readingGroup,[]);
      perGroup.get(q.readingGroup).push(q);
      if(q.readingPassage){
        seen.add(q.readingGroup);
        assert.equal(Boolean(q.listeningPassage),topic==='listening-set');
      }
    }
    assert.equal(seen.size,count/5);
    assert.equal(perGroup.size,count/5);
    assert.ok([...perGroup.values()].every(items=>items.length===5));
    if(type.endsWith('-literary'))assert.ok(sheet.items.every(q=>q.readingGenre==='literary'));
    else if(type.endsWith('-nonfiction'))assert.ok(sheet.items.every(q=>q.readingGenre==='nonfiction'));
    else if(count>=10){
     const lit=[...perGroup.values()].filter(items=>items[0].readingGenre==='literary').length;
     const non=perGroup.size-lit;
     assert.ok(Math.abs(lit-non)<=1,'장르 균형 오류: 학년 '+grade+', '+topic+', 시드 '+seed+', 문항 '+count+', 문학 '+lit+', 비문학 '+non);
    }
   }
  }
 }
});
test('기존 읽기 연습 기능과 원래 지문을 유지한다',()=>{
 for(let grade=1;grade<=6;grade++){
   assert.ok(Core.readingInventory(grade).length>=4);
   const sheet=Core.generate({subject:'korean',grade,topic:'reading-set',type:'reading-set-five',count:5,seed:77});
   assert.equal(sheet.items.length,5);
   assert.ok(sheet.items[0].readingPassage);
 }
});
test('저학년 관찰 증거와 중학년 안내 조건 적용 문항을 포함한다',()=>{
 const early=get('lost-pencil-announcement');
 assert.equal(early.questions[4].skill,'evidence');
 assert.match(early.questions[4].answer,/달 그림/);
 assert.match(early.passage,/달 모양 그림/);
 const middle=get('town-festival-notice');
 assert.equal(middle.questions[1].skill,'application');
 assert.match(middle.passage,/신청하지 않아도/);
 assert.match(middle.questions[1].explanation,/사전 신청/);
 assert.equal(middle.questions.filter(q=>q.skill==='time').length,2);
});
test('고학년은 자료 해석 한계, 비교, 민주적 의사결정과 상황 적용을 평가한다',()=>{
 const temp=get('one-week-temperature'),survey=get('survey-pet-choice'),vote=get('class-vote'),map=get('two-ways-map');
 assert.equal(temp.questions[3].skill,'evidence');
 assert.match(temp.questions[3].answer,/난방/);
 assert.match(temp.questions[3].explanation,/기록/);
 assert.equal(survey.questions[2].skill,'comparison');
 assert.equal(survey.questions[2].answer,'4명');
 assert.equal(vote.questions[4].skill,'application');
 assert.match(vote.questions[4].answer,/두 활동/);
 assert.equal(map.questions[4].skill,'application');
 assert.match(map.questions[4].answer,/그날의 길 상태/);
 for(const p of [temp,survey,vote,map]){
  assert.equal(p.questions.length,5);
  assert.equal(p.listeningQuestions.length,5);
  assert.equal(p.listeningQuestions.filter((q,i)=>q.prompt!==p.questions[i].prompt).length,2);
  assert.equal(p.reviewStatus,'수업 전 교사 검수 필요');
 }
});
test('국어 평가 결과에서 누락된 8개 요소는 내용 이해에 합쳐지지 않는다',()=>{
 const specs=[
   ['comparison','비교·대조'],['emotion','인물 마음 이해'],['solution','문제 해결'],['safety','안전 판단'],
   ['location','장소 파악'],['time','시간 정보 파악'],['rule','규칙 이해'],['condition','조건 판단']
 ];
 const questions=specs.map(([skill],i)=>({answer:'정답'+i,koreanSkill:skill}));
 const answers=questions.map((q,i)=>i%2===0?q.answer:'오답');
 const result=Results.summarize(questions,answers);
 assert.equal(result.correct,4);
 assert.equal(result.total,8);
 assert.equal(Object.keys(result.skills).length,8);
 for(const [skill,label] of specs){
   assert.ok(result.skills[skill]);
   assert.equal(result.skills[skill].total,1);
   assert.equal(Results.skillName(skill),label);
 }
 const saved=Results.makeRecord({code:'A06',grade:6,topic:'reading-assessment',summary:result,when:'2026-11-10T00:00:00Z'});
 assert.equal(Object.keys(saved.skills).length,8);
 assert.ok(!saved.skills.comprehension);
});
