'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../daily-worksheet-core.js');
const {qualityRisks,buildCases,review,markdown}=require('../scripts/worksheet-critique-loop.cjs');

test('qualitative signals are review candidates, not declarations of wrong answers',()=>{
  const context=qualityRisks({prompt:'이 기록이 보여 주는 특징은?',answer:'번식',choices:['번식','성장','호흡']},'science');
  assert.ok(context.includes('자료 맥락 확인'));
  const echo=qualityRisks({prompt:'위 설명에서 알맞은 것은?',detail:'물은 끓으면 수증기로 변한다.',answer:'수증기',choices:['수증기','산소','얼음']},'science');
  assert.ok(echo.includes('자료에 정답 노출 의심'));
  const distractors=qualityRisks({prompt:'옳은 설명은?',answer:'산소가 필요하다',choices:['산소가 필요하다','언제나 폭발한다','반드시 멈춘다']},'science');
  assert.ok(distractors.includes('극단적 오답 선택지 의심'));
  assert.deepEqual(qualityRisks({prompt:'그림을 보고 답하세요',detail:'실험 모습',answer:'씨앗',choices:['씨앗','나무','돌']},'science'),[]);
  assert.ok(qualityRisks({prompt:'왜 그럴까요?',answer:'규칙',format:'essay'},'korean').includes('서술형 해설 부족 의심'));
});

test('case matrix reaches every subject and supplies special mixed-mode prerequisites',()=>{
  const quick=buildCases(C,false),full=buildCases(C,true);
  assert.ok(quick.length>100);
  assert.ok(full.length>quick.length);
  assert.deepEqual(new Set(quick.map(x=>x.subject)),new Set(Object.keys(C.SUBJECTS)));
  assert.ok(quick.some(x=>x.topic==='history-mix'&&x.eras.length===5));
  assert.ok(quick.some(x=>x.topic==='math-mix'&&x.mathTypes.length>0));
  assert.ok(full.some(x=>x.responseFormat==='essay'&&x.subject==='science'));
  assert.ok(quick.every(x=>Number.isInteger(x.seed)&&x.count>0));
});

test('deterministic runner distinguishes invariant errors from pedagogical warnings',()=>{
  const fake={
    SUBJECTS:{science:{grades:[3],topics:[['matter','물질의 상태',3]]}},
    units:()=>[{types:[]}],supportedCounts:()=>[5],answerFormats:()=>[],
    generate:()=>({items:[
      {prompt:'이 기록을 보고 답하세요',answer:'정답',choices:['정답','오답']},
      {prompt:'다른 문제',answer:'A',choices:['A','B']},
      {prompt:'다른 문제',answer:'A',choices:['A','B']},
      {prompt:'네 번째',answer:'D',choices:['D','E']},
      {prompt:'다섯 번째',answer:'E',choices:['E','F']}
    ]})
  };
  const r=review(fake);
  assert.equal(r.examined,2);
  assert.equal(r.questions,10);
  assert.equal(r.errors.length,2);
  assert.ok(r.warningCounts['자료 맥락 확인']>0);
  assert.match(markdown(r),/문제지 검수·비평 자료/);
  assert.match(markdown(r),/자동 병합하지 않는다/);
});
