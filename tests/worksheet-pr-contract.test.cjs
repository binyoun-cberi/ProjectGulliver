'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePrBody } = require('../scripts/worksheet-pr-contract.cjs');
const valid = [
  '## 요구사항 및 범위\n교과별 생성 기능 수정 시 변경 범위를 문서로 정하고 인쇄 상태까지 검증한다. 수업 도구의 다른 기능에는 영향을 주지 않는다.',
  '## 합의된 스펙\n완료 기준: 변경된 문제 유형마다 고정된 시드로 정답과 중복을 검증하고, 화면과 인쇄 상태가 동일한 결과를 표시해야 한다.',
  '## 검증 계획과 결과\n실행 명령: node --test tests/daily-worksheet-core.test.cjs. 재현: 학년을 변경하고 생성한 뒤 답안을 확인하며 실제 증거는 워크플로에서 기록한다.',
  '## 도전자 검토\n반론·위험: 정답을 화면에 감춘다고 인쇄에서도 감춰진다는 보장은 없다. 근거: 브라우저의 print 미디어 CSS를 별도 검증한다.',
  '## 조율자 판정\n현재 판정: CI 확인 전 리뷰 요청. 판정 근거: 테스트와 브라우저 검증을 분리했다. 사람이 확인할 사항: 실제 출력의 가독성.'
].join('\n\n');
test('five substantiated handoff sections satisfy contract', () => assert.deepEqual(validatePrBody(valid), []));
test('missing debate evidence is rejected', () => {
  assert.ok(validatePrBody(valid.replace(/## 도전자 검토[\s\S]*?(?=## 조율자 판정)/, '')).some(s => s.includes('도전자')));
});
test('placeholders and blank sections cannot pass', () => {
  assert.ok(validatePrBody(valid.replace('반론·위험: 정답', '반론·위험: TODO 정답')).some(s => s.includes('미작성')));
  assert.ok(validatePrBody(valid.replace(/완료 기준:[^\n]*/, '완료 기준:')).some(s => s.includes('부족')));
});
test('unstructured or empty body cannot pass', () => {
  assert.ok(validatePrBody('').length >= 5);
  assert.ok(validatePrBody('모두 괜찮습니다.').length >= 5);
});
