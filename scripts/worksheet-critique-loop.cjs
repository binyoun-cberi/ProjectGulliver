'use strict';
// Deterministic evidence collector. It does NOT conduct an autonomous AI debate
// or certify the educational correctness of the generated worksheets.
const fs = require('node:fs');
const path = require('node:path');

const SEEDS = [7, 42, 20261024];
const HISTORY_ERAS = ['prehistoric', 'ancient', 'goryeo', 'joseon', 'modern'];
const cue = /(?:이 기록|위 기록|다음 표|위 표|다음 자료|위 자료|이 그래프|다음 그래프|그림을 보고|사진을 보고)/;
const absolute = /(?:언제나|반드시|영원히|무조건|모두 사라|모두 폭발|항상 0)/;

function qualityRisks(question, subject) {
  const flags = [];
  const prompt = String(question.prompt || '').trim();
  const detail = String(question.detail || '').trim();
  const answer = String(question.answer ?? '').trim();
  const choices = Array.isArray(question.choices) ? question.choices.map(String) : [];
  const hasMaterial = Boolean(detail || question.scienceMaterial || question.readingGroup ||
    question.passage || question.image || question.photo || question.material || question.table ||
    question.orderChoices?.length || question.right);
  if (cue.test(prompt) && !hasMaterial) flags.push('자료 맥락 확인');
  if (subject !== 'math' && answer.length >= 3 && detail.includes(answer) &&
      /(?:무엇|어느|어떤|알맞|고르|쓰세요)/.test(prompt)) flags.push('자료에 정답 노출 의심');
  if (choices.length >= 3 && choices.filter(x => x !== answer && absolute.test(x)).length >= 2)
    flags.push('극단적 오답 선택지 의심');
  if ((question.responseFormat === 'essay' || question.format === 'essay') &&
      String(question.modelExplanation || '').trim().length < 12)
    flags.push('서술형 해설 부족 의심');
  return flags;
}

function optionsFor(C, subject, grade, topic, type) {
  const options = {subject, grade, topic, type};
  if (topic === 'history-mix') options.eras = HISTORY_ERAS;
  if (topic === 'math-mix') {
    options.mathTypes = C.units('math', grade)
      .filter(unit => unit.id !== 'g' + grade + '-mix' && unit.id !== 'column-practice')
      .flatMap(unit => unit.types.map(row => row[0]))
      .filter(id => id !== 'math-mix-worksheet')
      .slice(0, 4);
  }
  return options;
}

function buildCases(C, full = false) {
  const result = [];
  for (const [subject, info] of Object.entries(C.SUBJECTS)) {
    for (const grade of info.grades) {
      for (const [topic, , from, to = 6] of info.topics) {
        if (grade < from || grade > to) continue;
        const variants = C.units(subject, grade)
          .flatMap(unit => unit.types.filter(row => row[2] === topic).map(row => row[0]));
        const types = [...new Set(variants.length ? variants : [''])];
        for (const type of types) {
          const base = optionsFor(C, subject, grade, topic, type);
          const counts = C.supportedCounts(base);
          if (!counts.length) continue;
          const count = counts.includes(10) ? 10 : counts[0];
          // Quick: all grade/topic/type combinations, default answer format.
          // Full: all supported answer formats and more reproducibility seeds.
          const formats = full ? C.answerFormats(subject, topic).map(row => row[0]) : [];
          for (const format of (formats.length ? formats : [null])) {
            for (const seed of SEEDS.slice(0, full ? 3 : 2)) {
              result.push({...base, count, seed, ...(format ? {responseFormat:format} : {})});
            }
          }
        }
      }
    }
  }
  return result;
}

function review(C, {full = false} = {}) {
  const cases = buildCases(C, full);
  const result = {mode: full ? 'full' : 'quick', examined:0, questions:0,
    bySubject:{}, warningCounts:{}, samples:[], errors:[], cases:cases.length};
  const signatures = new Map();
  for (const options of cases) {
    const key = [options.subject,options.grade,options.topic,options.type,options.responseFormat || 'default'].join('/');
    let sheet;
    try { sheet = C.generate(options); }
    catch (e) { result.errors.push({key,seed:options.seed,problem:'생성 실패: '+e.message}); continue; }
    if (!sheet || !Array.isArray(sheet.items) || sheet.items.length !== options.count) {
      result.errors.push({key,seed:options.seed,problem:'문항 수 불일치'});
      continue;
    }
    const seen = new Set();
    if (!signatures.has(key)) signatures.set(key,new Set());
    const all = signatures.get(key);
    for (const [i, q] of sheet.items.entries()) {
      const prompt=String(q.prompt || '').trim(), answer=String(q.answer ?? '').trim();
      const signature=[prompt,String(q.detail||''),String(q.right||''),...(q.orderChoices||[]),String(q.oxProposal||''),String(q.originalAnswer||''),answer].join('|');
      if (!prompt || !answer) result.errors.push({key,seed:options.seed,index:i+1,problem:'문제 또는 정답 없음'});
      if (seen.has(signature)) result.errors.push({key,seed:options.seed,index:i+1,problem:'동일 문제지 내 중복'});
      seen.add(signature); all.add(signature);
      if (q.choices?.length && (!q.choices.includes(q.answer) || new Set(q.choices).size !== q.choices.length))
        result.errors.push({key,seed:options.seed,index:i+1,problem:'선택지 및 정답 불일치'});
      for (const flag of qualityRisks(q, options.subject)) {
        result.warningCounts[flag]=(result.warningCounts[flag]||0)+1;
        if (result.samples.length < 120) result.samples.push({
          key,seed:options.seed,index:i+1,flag,prompt:prompt.slice(0,180),
          detail:String(q.detail||'').slice(0,160),answer:answer.slice(0,80)
        });
      }
      result.questions++;
    }
    result.examined++;
    result.bySubject[options.subject] ??= {sheets:0,questions:0};
    result.bySubject[options.subject].sheets++;
    result.bySubject[options.subject].questions+=sheet.items.length;
  }
  result.novelty=[...signatures].map(([key, set])=>({key,unique:set.size})).sort((a,b)=>a.unique-b.unique).slice(0,30);
  return result;
}

function markdown(result) {
  const rows = Object.entries(result.bySubject).map(([k,v])=>'| '+k+' | '+v.sheets+' | '+v.questions+' |').join('\n');
  const warnings = Object.entries(result.warningCounts).map(([k,v])=>'| '+k+' | '+v+' |').join('\n') || '| 없음 | 0 |';
  const examples = result.samples.slice(0,40).map(x =>
    '- **'+x.flag+'** · '+x.key+' · seed '+x.seed+' · '+x.index+'번: '+x.prompt.replace(/\n/g,' ') +
    (x.detail ? ' / 자료: '+x.detail.replace(/\n/g,' ') : '')+' / 정답: '+x.answer.replace(/\n/g,' ')).join('\n');
  const errors = result.errors.slice(0,50).map(x=>'- '+x.key+' · seed '+x.seed+': '+x.problem).join('\n') || '- 자동 불변식 오류 없음';
  const weak = result.novelty.slice(0,15).map(x=>'- '+x.key+': 서로 다른 문항 '+x.unique+'개').join('\n');
  return [
    '# 클라시트 문제지 검수·비평 자료 ('+result.mode+')',
    '',
    '> 자동 수집한 **검토 후보**입니다. 실제 교육적 오류, 문항 타당도, 출처의 사실성, PDF 품질을 이 검사만으로 판정할 수 없습니다.',
    '',
    '- 구성 조합 '+result.cases+'개, 생성 성공 '+result.examined+'개, 확인 문항 '+result.questions+'개',
    '- 확정 오류 '+result.errors.length+'건, 비평 후보 '+Object.values(result.warningCounts).reduce((a,b)=>a+b,0)+'건',
    '',
    '## 과목별 표본',
    '| 과목 | 문제지 | 문항 |', '| --- | ---: | ---: |', rows,
    '',
    '## 교육적 위험 후보',
    '| 검토할 관점 | 발생 횟수 |','| --- | ---: |',warnings,
    '',
    '## 자동 검증 실패',
    errors,
    '',
    '## 교사가 읽고 도전자가 반론할 표본',
    examples || '- 자동으로 포착한 위험 신호는 없지만 수동 표본 검수는 반드시 수행해야 합니다.',
    '',
    '## 서로 다른 문제 수가 적은 구성 (여러 시드 통합)',
    weak || '- 검토 결과 없음',
    '',
    '## 토론 질문과 합의 절차',
    '1. 제안자: 문항의 학습 목표, 정답 근거, 문장·자료·풀이 공간을 설명한다.',
    '2. 도전자: 문항 원문과 시드에서 자료 불충분, 터무니없는 보기, 다른 정답 가능성, 지나친 반복을 반례로 제시한다.',
    '3. 조율자: 확정 오류·개선 필요·판단 보류를 분리하고 학년/단원/유형/시드/문항 번호를 남긴다.',
    '4. 수정 후 동일 시드와 새 시드로 각각 재생성하고 학생/교사용 PDF를 비교한다.',
    '5. 같은 방식으로 3회 반복하고 불일치·사실성 이슈는 자동 병합하지 않는다.',
    '',
    '※ 자동화에 LLM 토론 기능은 없습니다. 이 보고서는 사람이 독립적으로 비평하고 반론할 수 있는 검토 자료입니다.'
  ].join('\n')+'\n';
}

if (require.main === module) {
  const C=require('../daily-worksheet-core.js');
  const fsOut=path.resolve('test-artifacts/worksheet-critique');
  fs.mkdirSync(fsOut,{recursive:true});
  const r=review(C,{full:process.argv.includes('--full')});
  fs.writeFileSync(path.join(fsOut,'report.json'),JSON.stringify(r,null,2));
  fs.writeFileSync(path.join(fsOut,'review.md'),markdown(r));
  console.log('Worksheet critique: '+r.examined+'/'+r.cases+' sheets, '+r.questions+' questions, '+
    r.errors.length+' invariant errors; qualitative warnings only appear in report');
  if (r.errors.length) {
    const frequencies={};
    for(const issue of r.errors)frequencies[issue.problem]=(frequencies[issue.problem]||0)+1;
    console.error('Worksheet critique errors by category: '+JSON.stringify(frequencies));
    console.error('First failures: '+JSON.stringify(r.errors.slice(0,20)));
    process.exitCode=1;
  }
}
module.exports={qualityRisks,optionsFor,buildCases,review,markdown};
