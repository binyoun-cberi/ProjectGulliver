'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core');
const added=E.banks.flatMap(b=>b.items).filter(q=>q.modernVolume);
const targets=T.catalog.filter(u=>u.subject==='social'&&u.grade===5&&u.semester===2).flatMap(unit=>unit.lessons.map(lesson=>({unit,lesson,binding:T.binding(unit,lesson)}))).filter(r=>r.binding.ids.some(id=>id.startsWith('modern-volume-')));
test('nine weak grade-5 history lessons gain 225 original questions and eighteen rectangular teaching tables',()=>{
 assert.equal(added.length,225);assert.equal(targets.length,9);assert.equal(new Set(added.map(q=>q.evidenceId)).size,225);assert.equal(new Set(added.map(q=>q.prompt)).size,225);
 const focuses=[...new Set(added.map(q=>q.lessonFocus))];assert.equal(focuses.length,9);for(const focus of focuses){assert.equal(added.filter(q=>q.lessonFocus===focus).length,25);assert.ok(added.filter(q=>q.lessonFocus===focus&&C.initialAnswerAllowed(q.answer)).length>=20);}
 const tables=added.filter(q=>q.scienceMaterial);assert.equal(tables.length,18);
 for(const q of added){assert.ok(q.detail.length>=30,q.evidenceId);assert.ok(q.explanation.length>=20,q.evidenceId);assert.equal(new Set(q.choices).size,3,q.evidenceId);assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.includes(q.answer),q.evidenceId);assert.match(q.source,/^https:\/\/(contents.history.go.kr|theme.archives.go.kr)\//);if(q.scienceMaterial)for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}
});
test('every grade-5 term-2 lesson now generates twenty exact unique questions in every advertised format',()=>{
 let lessons=0,sheets=0;
 for(const unit of T.catalog.filter(u=>u.subject==='social'&&u.grade===5&&u.semester===2))for(const lesson of unit.lessons){lessons++;const b=T.binding(unit,lesson);for(const [responseFormat] of T.formats(b)){assert.ok(T.capacity(b,responseFormat)>=20,lesson.name+' '+responseFormat);for(const seed of [7,42,101]){const params={subject:'social',grade:5,semester:2,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},s=T.generate(params,C);sheets++;assert.equal(s.items.length,20);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,20);assert.deepEqual(T.generate(params,C),s);for(const q of s.items){if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.equal(q.choices.length,0);if(responseFormat==='initial')assert.ok(q.detail.includes(C.initialHint(q.answer)));if(responseFormat==='cloze')assert.ok(q.detail.includes('〔'));if(responseFormat==='essay')assert.ok(q.modelExplanation);}}}}
 assert.equal(lessons,30);console.log({lessons,sheets});
});
test('war-life and war-impact lesson selections have disjoint banks and mixed/replayed sheets preserve exact quotas',()=>{
 const war=targets.filter(r=>r.binding.bankId==='korean-war');assert.equal(war.length,2);assert.ok(war[0].binding.ids.every(id=>!war[1].binding.ids.includes(id)));
 for(const r of war){const expected=/피해와 영향/.test(r.lesson.name)?'war-impact':'war-life';assert.ok(E.banks.find(b=>b.id==='korean-war').items.filter(q=>r.binding.ids.includes(q.evidenceId)).every(q=>q.lessonFocus===expected));}
 const lessonMix=targets.map(r=>({id:r.lesson.id,count:3}));
 for(const responseFormat of ['choice','short','essay','initial','ox','cloze','correction']){const params={subject:'social',grade:5,semester:2,lessonMix,responseFormat,seed:77},s=T.generateMixed(params,C);assert.equal(s.items.length,27);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,27);assert.deepEqual(T.generateMixed({...params,mixedItemIndexes:s.mixedItemIndexes},C),s);for(const row of lessonMix)assert.equal(s.items.filter(q=>q.curriculumLesson===row.id).length,3);}
 const standards=T.standards('social',5);for(const code of ['6사05-02','6사06-01','6사06-02'])assert.ok(standards.find(s=>s.code===code).binding.ids.some(id=>id.startsWith('modern-volume-')));
});


test('web-compared modern-history questions use same-era distractors and uniquely grounded answers',()=>{
 const outOfPeriod=/고구려|백제|신라|고려|발해|고인돌|청동기|청동검|토기|왕릉|궁예|왕건|단군|화랑|조선의 과거|과거 시험|삼국 시대|삼별초|이순신/;
 const impossible=added.filter(q=>q.choices.slice(1).some(w=>outOfPeriod.test(w)));
 assert.deepEqual(impossible.map(q=>({id:q.evidenceId,prompt:q.prompt,wrong:q.choices.slice(1)})),[]);
 const cases=[
  ['헤이그 특사가 알리려 한 것은 무엇인가요?','을사늑약의 부당함',['강화도 조약의 관세 개정을 요청하는 일','러일 전쟁에 대한제국이 참전하겠다고 선언하는 일']],
  ['도쿄에서 일본 왕을 향해 폭탄을 던진 인물은 누구인가요?','이봉창',['윤봉길','김상옥']],
  ['김구가 조직한 의열 투쟁 단체는 무엇인가요?','한인 애국단',['의열단','조선어 학회']],
  ['1948년 5·10 총선거로 뽑은 사람들은 누구인가요?','제헌 국회의원',['대통령','부통령']],
  ['대한민국 초대 대통령은 누구인가요?','이승만',['김구','김규식']],
  ['38도선 북쪽에 들어온 군대는 어느 나라 군대였나요?','소련',['미국','영국']],
  ['국군과 함께 전쟁에 참여한 여러 나라의 군대는 무엇인가요?','유엔군',['북한군','중국군']],
  ['임시 정부가 1940년 창설한 군대는 무엇인가요?','한국광복군',['조선의용대','대한독립군']]
 ];
 for(const [prompt,answer,wrong] of cases){
  const found=added.filter(q=>q.prompt===prompt);
  assert.equal(found.length,1,prompt);
  assert.equal(found[0].answer,answer,prompt);
  assert.deepEqual(found[0].choices.slice(1),wrong,prompt);
  assert.equal(new Set(found[0].choices).size,3,prompt);
 }
});
test('social map and population questions use competing geographic evidence rather than irrelevant trivia',()=>{
 const all=E.banks.filter(b=>b.subject==='social').flatMap(b=>b.items);
 const checks=[
  ['다른 지역으로 가는 버스 노선을 알아보려면 어떤 자료가 필요한가요?',/지형도|인구 분포도/],
  ['동네의 병원 위치를 찾을 때 먼저 확인할 정보는 무엇인가요?',/시설 지도|인구 분포도/],
  ['우리나라 인구 분포의 특징을 살피는 데 알맞은 자료는 무엇인가요?',/한 가구 인원|면적만/],
  ['저출산을 나타내는 자료는 무엇인가요?',/고령 인구 비율|한 가족의 자녀 수/]
 ];
 for(const [prompt,pattern] of checks){
  const found=all.filter(q=>q.prompt===prompt);
  assert.equal(found.length,1,prompt);
  assert.match(found[0].choices.slice(1).join(' | '),pattern,prompt);
  assert.equal(new Set(found[0].choices).size,3,prompt);
 }
});
