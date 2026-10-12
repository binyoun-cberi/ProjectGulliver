'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parsePages, splitRanges, outputName} = require('../pdf-ttak-core.js');

test('페이지 번호: 혼합 범위, 중복과 순서 보존', () => {
  assert.deepEqual(parsePages('3, 1-2,3,5', 5), [2,0,1,4]);
  assert.deepEqual(parsePages('1-3', 3), [0,1,2]);
  assert.deepEqual(parsePages('2', 3), [1]);
});
test('잘못된 페이지 입력 차단', () => {
  for(const input of ['', '1-', '1,,3', '0', '2-1', '1-10', '2.5', '1,foo', '-1']){
    assert.throws(()=>parsePages(input, 4), input);
  }
});
test('큰 범위를 제한하고 숫자가 아닌 전체 페이지 수를 거부', () => {
  assert.throws(()=>parsePages('1', 0));
  assert.throws(()=>parsePages('1-999', 5));
  assert.throws(()=>parsePages('1,'.repeat(501)+'1', 3));
});
test('PDF 나누기: 마지막 작은 묶음 포함', () => {
  assert.deepEqual(splitRanges(5,2), [[0,1],[2,3],[4]]);
  assert.deepEqual(splitRanges(3,3), [[0,1,2]]);
  assert.throws(()=>splitRanges(21,1));
  assert.throws(()=>splitRanges(3,0));
});
test('저장할 파일명 안전하게 다듬기', () => {
  assert.equal(outputName('수업자료.PDF','합치기'),'수업자료_합치기.pdf');
  assert.equal(outputName('../../학생:1.pdf','추출'), '.._.._학생_1_추출.pdf');
});
