'use strict';
// Audits the full social evidence pool. All semantic warnings are review candidates,
// not claims that a machine can independently verify every historical fact.
const fs=require('node:fs');
const path=require('node:path');
const E=require('../worksheet-evidence-banks.js');
const C=require('../daily-worksheet-core.js');
const ERAS=['prehistoric','ancient','goryeo','joseon','modern'];
const normalized=value=>String(value??'').normalize('NFKC').replace(/[\s.,!?'":;“”‘’(){}·—–\-]/g,'');
const absolute=/(?:반드시|무조건|모두|전혀|절대로|항상|언제나|자동으로|영원히|한 번도)/;
const vague=/(?:관련된\s*(?:나라는|국가는|것은)|까닭과\s*관련된|관련이\s*있나요|가까운\s*것은|무엇을\s*보여\s*주나요)/;
const HISTORY_FACTS=[
 {match:/귀주 대첩에서 고려군을 지휘한 장수/,answer:'강감찬 — 거란군',
  reference:'https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_20'},
 {match:/갑오개혁 때 과부가 다시 혼인/,answer:'재가 허용',
  reference:'https://contents.history.go.kr/mobile/ta/view.do?levelId=ta_m71_0080_0030_0030_0010'},
 {match:/신민회가 활동하던 시기 민족 교육/,answer:'대성학교와 오산학교',
  reference:'https://contents.history.go.kr/front/ta/print.do?levelId=ta_m71_0090_0030_0010_0030'},
 {match:/1920년 봉오동 전투에서/,answer:'홍범도',
  reference:'https://contents.history.go.kr/mobile/ta/view.do?levelId=ta_m71_0100_0030_0010_0020'},
 {match:/1920년 김좌진·홍범도 등이 이끈/,answer:'청산리 대첩',
  reference:'https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_i403400'},
 {match:/고조선의 청동기 문화를 연구할 때/,answer:'비파형 동검',
  reference:'https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_10'},
 {match:/초기 고구려가 성장한 지역/,answer:'압록강 일대',
  reference:'https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_10'},
 {match:/흥남 철수 당시 피란민들이 겪은 어려움/,answer:'전쟁으로 살던 곳을 떠나 안전한 곳을 찾아야 했던 어려움',
  reference:'https://unarchives.mpva.go.kr/contents/xmas'}
];
function examine(){
 const banks=E.banks.filter(b=>b.subject==='social');
 const all=banks.flatMap(b=>b.items.map(q=>({bank:b.id,...q})));
 const fatal=[],candidate=[],historyChecks=[];
 const fail=(id,kind,description)=>fatal.push({id,kind,description});
 const warn=(id,kind,description)=>candidate.push({id,kind,description});
 for(const q of all){
  const id=q.evidenceId||q.bank;
  const prompt=String(q.prompt||'');
  const answer=String(q.answer||'');
  const choices=Array.isArray(q.choices)?q.choices.map(String):[];
  const clean=choices.map(normalized),a=normalized(answer);
  if(!prompt||!answer)fail(id,'missing-question-or-answer',prompt);
  if(choices.length!==3||!choices.includes(answer))fail(id,'invalid-choices',choices.join(' / '));
  if(new Set(clean).size!==clean.length)fail(id,'duplicate-normalized-choice',choices.join(' / '));
  if(a.length>=2&&normalized(prompt).includes(a))fail(id,'answer-in-question',prompt);
  if(vague.test(prompt))fail(id,'vague-question',prompt);
  const wrong=choices.filter(x=>x!==answer);
  if(wrong.length===2&&wrong.every(x=>absolute.test(x)))fail(id,'two-giveaway-options',wrong.join(' / '));
  if(wrong.some(x=>normalized(x).length>=4&&a.includes(normalized(x))))
   warn(id,'choice-overlap','Answer: '+answer+'; choices: '+wrong.join(' / '));
  if(prompt.length<10)warn(id,'short-question',prompt);
 }
 for(const era of ERAS)for(const q of C.historyItems(era)){
  const a=normalized(q.answer),p=normalized(q.prompt);
  if(a.length>=2&&p.includes(a))fail('legacy-'+era,'history-answer-in-question',q.prompt);
  if(vague.test(q.prompt))fail('legacy-'+era,'history-vague-question',q.prompt);
 }
 for(const spec of HISTORY_FACTS){
  const found=all.filter(q=>spec.match.test(q.prompt));
  const pass=found.length===1&&found[0].answer===spec.answer;
  historyChecks.push({question:spec.match.source,expectedAnswer:spec.answer,pass,count:found.length,reference:spec.reference});
  if(!pass)fail('historical-anchor','fact-check-mismatch',spec.match.source+' → '+(found[0]?.answer||'no question'));
 }
 const byGrade=Object.fromEntries([3,4,5,6].map(grade=>[grade,banks.filter(b=>b.grades.includes(grade)).reduce((sum,b)=>sum+b.items.length,0)]));
 const summary={banks:banks.length,questions:all.length,historyEras:ERAS.length,byGrade,errors:fatal.length,warnings:candidate.length,historicalAnchors:historyChecks.length,passedAnchors:historyChecks.filter(x=>x.pass).length};
 return {summary,fatal,candidate,historyChecks};
}
function markdown(audit){
 const {summary,fatal,candidate,historyChecks}=audit;
 const count=(xs,key)=>Object.entries(xs.reduce((a,x)=>(a[x[key]]=(a[x[key]]||0)+1,a),{})).map(([k,v])=>'| '+k+' | '+v+' |').join('\n')||'| 없음 | 0 |';
 const examples=xs=>xs.slice(0,30).map(q=>'- '+q.id+' · '+q.kind+' · '+q.description).join('\n')||'- 없음';
 return [
 '# 클라시트 사회 문제은행 정답·선택지·사실성 검수',
 '',
 '> **자동 검사의 경계**: 아래의 결함 수는 기계적으로 검증 가능한 부분만 포함하며, 3,081개 문항의 내용상 유일 정답과 모든 역사적 사실을 원전 대조해 확증했다는 뜻이 아닙니다.',
 '',
 '- 사회 은행 '+summary.banks+'개, 실제 등록 문항 '+summary.questions+'개',
 '- 정형·정답 노출·선택지 판별 검사에서 확인된 오류 '+summary.errors+'개',
 '- 추가 사람 검토 후보 '+summary.warnings+'개',
 '- 역사 핵심 사실 앵커 '+summary.passedAnchors+'/'+summary.historicalAnchors+'개 일치',
 '',
 '## 자동 오류', '| 유형 | 건수 |','| --- | ---: |',count(fatal,'kind'),'',
 '## 추가 검토 후보', '| 유형 | 건수 |','| --- | ---: |',count(candidate,'kind'),'',
 '## 역사 앵커 확인',...historyChecks.map(x=>'- '+(x.pass?'통과':'실패')+' · '+x.question+' → '+x.expectedAnswer+' · '+x.reference),'',
 '## 우선 재검토 표본',examples([...fatal,...candidate]),'',
 '## 필수 수작업 검수 기준',
 '- 각 차시의 학생에게 제시되는 자료만으로 하나의 답을 고를 수 있는지 확인할 것',
 '- 각 오답이 지나치게 명백한 거짓이나 정답과 동의어가 아닌지 확인할 것',
 '- 사료가 아닌 가상 사례·재구성 표를 실제 역사적 증언으로 소개하지 않았는지 확인할 것',
 '- 역사 인물, 연도, 제도, 행정구역, 사건의 인과 관계를 공신력 있는 사료 및 교과서와 대조할 것',
 ''
 ].join('\n');
}
if(require.main===module){
 const audit=examine();
 const dest=path.resolve(__dirname,'../test-artifacts/worksheet-critique');
 fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'social-deep-audit.json'),JSON.stringify(audit,null,2));
 fs.writeFileSync(path.join(dest,'social-deep-audit.md'),markdown(audit));
 console.log('[social audit] '+JSON.stringify(audit.summary));
 if(audit.fatal.length){console.error(JSON.stringify(audit.fatal.slice(0,30),null,2));process.exitCode=1;}
}
module.exports={examine,markdown,HISTORY_FACTS};
