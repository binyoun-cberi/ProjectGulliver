'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bank=require('../data/korean-assessment-bank.js');
const core=require('../daily-worksheet-core.js');
const extra={
 early:require('../data/korean-assessment-extra-early.js'),
 middle:require('../data/korean-assessment-extra-middle.js'),
 upper:require('../data/korean-assessment-extra-upper.js')
};
const originalIds=['sun-and-wind','lost-mitten','library-guide','seed-observation','shabbat-kindness','good-samaritan','fisherman-jinni','pond-exploration','analects-empathy','quran-culture','dhammapada-peace','news-photo'];
test('국어 확장 지문은행은 학년대별 16편, 전체 48편으로 증가한다',()=>{
 const audit=bank.audit(),inventory=bank.inventory();
 assert.deepEqual(audit,{passages:48,questions:240,grades:[1,2,3,4,5,6]});
 assert.equal(inventory.passages,48);
 assert.equal(inventory.readingQuestions,240);
 assert.equal(inventory.listeningAlternatives,96);
 for(const band of ['early','middle','upper']){
  assert.equal(extra[band].length,12,band);
  assert.equal(extra[band].filter(x=>x.genre==='literary').length,6,band+' literary');
  assert.equal(extra[band].filter(x=>x.genre==='nonfiction').length,6,band+' nonfiction');
  assert.equal(inventory.bands[band].literary+inventory.bands[band].nonfiction,16,band);
 }
});
test('기존 지문 12편을 유지하고 확장 지문/문항은 원본 데이터가 훼손되지 않는다',()=>{
 const ids=new Set();
 for(let grade=1;grade<=6;grade++){
  const p=bank.passages(grade),read=bank.asReadingSets(grade,{mode:'read'}),listen=bank.asReadingSets(grade,{mode:'listen'});
  assert.equal(p.length,16);assert.equal(read.length,16);assert.equal(listen.length,16);
  for(let i=0;i<p.length;i++){
   const e=p[i];
   ids.add(e.id);
   assert.equal(read[i].id,listen[i].id);
   assert.equal(read[i].passage,listen[i].passage);
   assert.equal(e.questions.length,5);
   assert.equal(e.listeningQuestions.length,5);
   assert.equal(read[i].questions.length,5);
   assert.equal(listen[i].questions.length,5);
   assert.equal(e.read,true);assert.equal(e.listen,true);
   assert.equal(e.reviewStatus,'수업 전 교사 검수 필요');
   assert.ok(e.passage.length>=75,'지문 길이: '+e.id);
   assert.equal(e.listeningQuestions.filter((q,j)=>q.prompt!==e.questions[j].prompt).length,2);
   for(const q of [...e.questions,...e.listeningQuestions]){
    assert.equal(q.choices.length,3);
    assert.equal(new Set(q.choices).size,3);
    assert.ok(q.choices.includes(q.answer));
    assert.ok(q.explanation.length>=9);
    assert.ok(q.skill);
   }
  }
 }
 assert.equal(ids.size,48);
 for(const id of ['kr-eval-sun-and-wind','kr-eval-lost-mitten','kr-eval-news-photo'])
  assert.ok(ids.has(id),'기존 지문 삭제 금지: '+id);
 const passage=bank.passages(2)[0],before=passage.passage;
 passage.passage='변경된 본문';
 assert.equal(bank.passages(2)[0].passage,before,'원본 보호 복사');
});
test('이솝 원전 각색 표기를 포함하고 창작 자료는 실제 안내/측정으로 혼동하지 않는다',()=>{
 const sourceChecked={
  'kr-eval-lion-little-mouse':'007',
  'kr-eval-crow-water-jar':'012',
  'kr-eval-country-city-mice':'004',
  'kr-eval-dog-water-reflection':'026',
  'kr-eval-fox-flattery-cheese':'027'
 };
 for(const e of Object.values(extra).flat()){
  assert.ok(e.sourceTitle);
  assert.ok(e.sourceRelation);
  assert.ok(e.id.startsWith('kr-eval-'));
  assert.ok(!/\b(TODO|TBD|FIXME)\b/.test(e.passage));
  if(sourceChecked[e.id]){
   assert.ok(e.sourceUrl.includes('/aesop/'+sourceChecked[e.id]),e.id);
   assert.match(e.sourceRelation,/각색/);
  }else{
   assert.equal(e.sourceRelation,'창작');
   assert.equal(e.sourceUrl,'');
  }
 }
 for(const id of ['town-festival-notice','one-week-temperature','star-club-notice']){
  const e=Object.values(extra).flat().find(x=>x.id==='kr-eval-'+id);
  assert.ok(e&&/가상|가정한/.test(e.passage),id+' 자료의 가상성');
 }
});
test('모든 학년·장르의 읽기·듣기 평가에서 5~20문항을 안정적으로 생성한다',()=>{
 for(const grade of [1,2,3,4,5,6])for(const topic of ['reading-assessment','listening-set']){
  for(const suffix of ['five','literary','nonfiction']){
   const type=topic+'-'+suffix,base={subject:'korean',grade,topic,type,seed:129,responseFormat:'choice'};
   assert.deepEqual(core.supportedCounts(base),[5,10,15,20],grade+'/'+type);
   for(const count of [5,10,15,20]){
    const sheet=core.generate({...base,count,seed:count+129});
    assert.equal(sheet.items.length,count);
    assert.equal(sheet.items.filter(x=>x.readingPassage).length,count/5);
    assert.equal(new Set(sheet.items.map(x=>x.readingGroup)).size,count/5);
    assert.ok(sheet.items.every(x=>Array.isArray(x.choices)&&x.choices.includes(x.answer)));
    if(topic==='listening-set')assert.equal(sheet.items.filter(x=>x.listeningPassage).length,count/5);
   }
  }
 }
});
test('기존 인쇄·듣기 화면은 확장 데이터 파일을 공유하고 웹 로드 순서가 보장된다',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','문제지 만들기.html'),'utf8');
 for(const name of ['early','middle','upper']){
  const file='data/korean-assessment-extra-'+name+'.js';
  assert.ok(html.includes(file),file);
  assert.ok(html.indexOf(file)<html.indexOf('data/korean-assessment-bank.js'),'지문 확장 파일 선로딩: '+name);
 }
 const ui=fs.readFileSync(path.join(__dirname,'..','worksheet-korean-assessment-ui.js'),'utf8');
 assert.match(ui,/koreanListeningControls/);
 assert.match(ui,/if\(assessment\.topic!=='listening-set'\)/);
 const c=fs.readFileSync(path.join(__dirname,'..','daily-worksheet.js'),'utf8');
 assert.match(c,/if\(sheet\.topic==='listening-set'\)\{const note=/);
});
