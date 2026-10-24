'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SUBJECTS, generate, supportedCounts, units, alignment } = require('../daily-worksheet-core.js');

const seeds = [7, 42, 20261023];
const forbidden = /(?:^|[^a-z])(?:undefined|NaN|Infinity|null)(?:[^a-z]|$)/i;
function assertQuestionQuality(q, label) {
  assert.equal(typeof q.prompt, 'string', label);
  assert.ok(q.prompt.trim().length > 0, label + ' empty prompt');
  assert.ok(String(q.answer ?? '').trim().length > 0, label + ' empty answer');
  for (const field of ['prompt', 'answer', 'detail', 'explanation', 'sourceLabel']) {
    assert.ok(!forbidden.test(String(q[field] ?? '')), label + ' invalid token in ' + field);
  }
  if (q.choices?.length) {
    assert.equal(new Set(q.choices).size, q.choices.length, label + ' duplicate choices');
    assert.ok(q.choices.includes(q.answer), label + ' answer absent from choices');
  }
  if (q.source) {
    const link = new URL(q.source);
    assert.equal(link.protocol, 'https:', label + ' insecure evidence link');
  }
}
test('challenger checks seeded repeatability, coverage, answer presence, and unique exercises', () => {
  let reviewed = 0;
  for (const [subject, info] of Object.entries(SUBJECTS)) {
    for (const grade of info.grades) {
      for (const [topic, , fromGrade, toGrade = 6] of info.topics) {
        if (grade < fromGrade || grade > toGrade) continue;
        const matchingUnits = units(subject, grade).flatMap(unit =>
          unit.types.filter(entry => entry[2] === topic).map(([type]) => type)
        );
        const variants = matchingUnits.length ? matchingUnits : [''];
        for (const type of variants) {
          for (const seed of seeds) {
            const options = { subject, grade, topic, type, count: 10, seed, difficulty: 'basic', ...(topic==='history-mix'?{eras:['prehistoric','ancient','goryeo','joseon','modern']}:{}), ...(topic==='math-mix'?{mathTypes:units('math',grade).filter(unit=>unit.id!==`g${grade}-mix`).flatMap(unit=>unit.types.map(([id])=>id)).slice(0,3)}:{}) };
            const label = [subject, grade, topic, type || 'general', seed].join('/');
            const first = generate(options), second = generate(options);
            assert.deepEqual(first, second, label + ' must be reproducible');
            assert.equal(first.items.length, 10, label + ' count');
            const signatures = new Set();
            first.items.forEach((q, index) => {
              assertQuestionQuality(q, label + '#' + index);
              signatures.add([q.prompt, q.detail ?? '', q.right ?? '', ...(q.orderChoices ?? []), q.answer].join('|'));
            });
            assert.equal(signatures.size, first.items.length, label + ' duplicate questions');
            if (first.alignment) {
              assert.match(first.alignment.code, /^\[(?:2|4|6)[가-힣]{1,2}\d{2}-\d{2}\]$/, label + ' malformed curriculum ID');
              assert.equal(new URL(first.alignment.source).protocol, 'https:');
              assert.ok(first.alignment.scope?.trim(), label + ' missing alignment limitation');
            }
            reviewed++;
          }
        }
      }
    }
  }
  assert.ok(reviewed >= 200, 'coverage matrix unexpectedly shrank: ' + reviewed);
  console.log('Checked ' + reviewed + ' generated worksheet variants against independent challenger invariants');
});

test('unreviewed curriculum links remain visibly unaligned instead of inventing an ID', () => {
  for (const [subject, grade, topic] of [
    ['social', 3, 'direction'],
    ['math', 5, 'mixed'],
    ['math', 6, 'decimal'],
    ['korean', 3, 'reading']
  ]) {
    assert.equal(alignment(subject, topic, grade), null);
  }
});

test('every offered grade and question type supports twenty distinct exercises', () => {
  for (const [subject, info] of Object.entries(SUBJECTS)) for (const grade of info.grades) {
    for (const [topic, , from, to = 6] of info.topics) {
      if (grade < from || grade > to) continue;
      const types = units(subject, grade).flatMap(unit => unit.types.filter(entry => entry[2] === topic).map(([id]) => id));
      for (const type of types.length ? types : ['']) {
        const options = {subject, grade, topic, type,
          eras: ['prehistoric','ancient','goryeo','joseon','modern'],
          mathTypes: units('math', grade).flatMap(unit => unit.types.map(([id]) => id)).filter(id => id !== 'math-mix-worksheet')};
        assert.ok(supportedCounts(options).includes(20), `${subject}/${grade}/${topic}/${type} 20 unavailable`);
        for (const seed of [7,42,20261024]) {
          const sheet = generate({...options, count:20, seed});
          assert.equal(sheet.items.length,20);
          const signatures = sheet.items.map(q => [q.prompt,q.detail,q.right,...(q.orderChoices||[]),q.answer].join('|'));
          assert.equal(new Set(signatures).size,20,`${subject}/${grade}/${topic}/${type}/${seed}`);
        }
      }
    }
  }
});

test('count availability reflects actual selected history eras and math types', () => {
 const history={subject:'social',grade:5,topic:'history-mix',type:'history-mix-quiz'};
 assert.deepEqual(supportedCounts({...history,eras:[]}),[]);
 assert.ok(supportedCounts({...history,eras:['goryeo']}).includes(20));
 const math={subject:'math',grade:3,topic:'math-mix',type:'math-mix-worksheet'};
 assert.deepEqual(supportedCounts({...math,mathTypes:[]}),[]);
 assert.ok(supportedCounts({...math,mathTypes:['add-carry-one','sub-borrow-one']}).includes(20));
});
