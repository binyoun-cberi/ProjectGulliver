'use strict';
const fs = require('node:fs');

const SECTIONS = [
  '요구사항 및 범위',
  '합의된 스펙',
  '검증 계획과 결과',
  '도전자 검토',
  '조율자 판정'
];
const PLACEHOLDER = /\b(?:TBD|TODO|FIXME|PLACEHOLDER|FILL ME)\b|작성해\s*주세요|추후\s*작성|여기에\s*입력/i;

function validatePrBody(input) {
  const errors = [];
  const body = String(input || '').replace(/<!--[\s\S]*?-->/g, '');
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map(match => ({
    title: match[1].trim(),
    start: match.index + match[0].length,
    headingAt: match.index
  }));
  for (let i = 0; i < SECTIONS.length; i++) {
    const title = SECTIONS[i];
    const index = headings.findIndex(h => h.title === title);
    if (index < 0) {
      errors.push('필수 항목 누락: ' + title);
      continue;
    }
    const end = headings[index + 1]?.headingAt ?? body.length;
    const text = body.slice(headings[index].start, end)
      .replace(/^[-*]\s*/gm, '')
      .replace(/\[[ xX]\]/g, '')
      .trim();
    if (text.length < 40) errors.push('검증 가능한 설명이 부족함: ' + title);
    if (PLACEHOLDER.test(text)) errors.push('미작성 표시가 남음: ' + title);
  }
  const spec = getSection(body, headings, '합의된 스펙');
  const review = getSection(body, headings, '도전자 검토');
  const evidence = getSection(body, headings, '검증 계획과 결과');
  const verdict = getSection(body, headings, '조율자 판정');
  if (spec && !/완료\s*기준/.test(spec)) errors.push('완료 기준을 명시해야 합니다.');
  if (review && (!/반론|위험/.test(review) || !/근거/.test(review))) errors.push('도전자 반론·위험 및 근거가 필요합니다.');
  if (evidence && !/실행\s*명령|테스트/.test(evidence)) errors.push('테스트 계획/명령이 필요합니다.');
  if (verdict && !/판정/.test(verdict)) errors.push('조율자 판정이 필요합니다.');
  return errors;
}
function getSection(body, headings, title) {
  const index = headings.findIndex(h => h.title === title);
  if (index < 0) return '';
  return body.slice(headings[index].start, headings[index + 1]?.headingAt ?? body.length);
}
if (require.main === module) {
  const source = process.env.PR_BODY || (process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : '');
  const errors = validatePrBody(source);
  if (errors.length) {
    console.error('[worksheet contract] 검증 실패:\n- ' + errors.join('\n- '));
    process.exitCode = 1;
  } else console.log('[worksheet contract] 스펙·검토·판정 항목이 작성되어 있습니다. (내용의 사실성은 별도 검증)');
}
module.exports = { validatePrBody, SECTIONS };
