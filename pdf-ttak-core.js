(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PdfTtakCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function parsePages(text, total) {
    const n = Number(total);
    if (!Number.isSafeInteger(n) || n < 1) throw new Error('페이지 수가 올바르지 않아요.');
    const input = String(text == null ? '' : text).replace(/\s/g, '');
    if (!input) throw new Error('페이지 번호를 입력해 주세요. 예: 1-3,5');
    const tokens = input.split(',');
    if (tokens.length > 500) throw new Error('페이지 범위가 너무 많아요.');
    const used = new Set(), pages = [];
    for (const token of tokens) {
      const range = /^(\d+)(?:-(\d+))?$/.exec(token);
      if (!range) throw new Error('페이지 번호는 1-3,5처럼 입력해 주세요.');
      const start = Number(range[1]), end = range[2] ? Number(range[2]) : start;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end > n) {
        throw new Error('페이지 번호를 확인해 주세요. 1부터 ' + n + '까지 사용할 수 있어요.');
      }
      for (let page = start; page <= end; page++) {
        if (!used.has(page)) { used.add(page); pages.push(page - 1); }
      }
    }
    return pages;
  }
  function splitRanges(total, every) {
    const n = Number(total), e = Number(every);
    if (!Number.isSafeInteger(n) || n < 1 || !Number.isSafeInteger(e) || e < 1) throw new Error('나눌 페이지 수를 확인해 주세요.');
    if (Math.ceil(n / e) > 20) throw new Error('한 번에 20개 이하의 PDF가 만들어지도록 페이지 수를 늘려 주세요.');
    const chunks = [];
    for (let start = 0; start < n; start += e) {
      chunks.push(Array.from({ length: Math.min(e, n - start) }, (_, i) => start + i));
    }
    return chunks;
  }
  function outputName(name, suffix) {
    const base = String(name || '수업자료').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').trim().slice(0, 80) || '수업자료';
    return base + '_' + String(suffix || '편집').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_') + '.pdf';
  }
  return { parsePages, splitRanges, outputName };
});
