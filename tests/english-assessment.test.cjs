'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Bank=require('../data/english-assessment-bank.js');
const Core=require('../daily-worksheet-core.js');
const Results=require('../worksheet-english-assessment-results.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const store=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}};
test('원본 영어 16편/80문항, 듣기 전용 32문항, 3–6학년 검수 상태',()=>{
 assert.deepEqual(Bank.audit(),{passages:16,questions:80,listeningSpecific:32,grades:[3,4,5,6]});
 const ids=new Set();
 for(let g=3;g<=6;g++){
  const p=Bank.passages(g);assert.equal(p.length,8);assert.equal(p.filter(x=>x.genre==='literary').length,4);assert.equal(p.filter(x=>x.genre==='nonfiction').length,4);
  for(const entry of p){
   assert.match(entry.reviewStatus,/검수 필요/);assert.equal(entry.sourceRelation,'original');
   ids.add(entry.id);
   const alt=entry.questions.filter((q,i)=>q.prompt!==entry.listeningQuestions[i].prompt);
   assert.equal(alt.length,2);assert.equal(entry.questions.length,5);
   for(const q of [...entry.questions,...entry.listeningQuestions]){
    assert.ok(q.explanation.length>8);
    assert.ok(q.skill);
    assert.equal(new Set(q.choices).size,3);
    assert.equal(q.choices.filter(x=>x===q.answer).length,1);
   }
  }
 }
 assert.equal(ids.size,16);assert.throws(()=>Bank.passages(2));
});
test('영어 평가가 별도 앱이 아닌 기존 교과/단원/유형에 통합된다',()=>{
 for(let g=3;g<=6;g++){
  const units=Core.units('english',g),found=units.find(u=>u.id==='e'+g+'-assessment');assert.ok(found);
  assert.ok(found.topics.includes('reading-assessment')&&found.topics.includes('listening-set'));
  for(const topic of ['reading-assessment','listening-set']){
   assert.ok(Core.SUBJECTS.english.topics.some(t=>t[0]===topic));
   assert.ok(Core.types('english',g,topic,found.id).some(([id])=>id==='en-'+topic+'-five'));
   const generated=Core.generate({subject:'english',grade:g,topic,count:5,seed:42,responseFormat:'choice'});
   assert.equal(generated.items.length,5);
  }
 }
 assert.equal(Core.units('english',2).length,0);
});
test('학년별 읽기·듣기 5·10·15·20문항, 문학·비문학 분리 및 듣기 대본 유지',()=>{
 for(let g=3;g<=6;g++)for(const topic of ['reading-assessment','listening-set'])for(const kind of ['five','literary','nonfiction']){
  const type='en-'+topic+'-'+kind,base={subject:'english',grade:g,topic,type,seed:123};
  assert.deepEqual(Core.supportedCounts(base),[5,10,15,20],JSON.stringify(base));
  for(const count of [5,10,20]){
   const sheet=Core.generate({...base,count,responseFormat:'choice'});
   assert.equal(sheet.items.length,count);
   assert.equal(sheet.items.filter(i=>i.readingPassage).length,count/5);
   const groups=new Set(sheet.items.map(i=>i.readingGroup));assert.equal(groups.size,count/5);
   assert.ok(sheet.items.every(i=>i.choices.includes(i.answer)&&i.englishSkill));
   for(const first of sheet.items.filter(i=>i.readingPassage)){
    assert.ok(first.readingPassage.length>100);
    assert.ok(first.readingTitle);
    assert.equal(Boolean(first.listeningPassage),topic==='listening-set');
    if(kind==='literary')assert.equal(first.readingGenre,'literary');
    if(kind==='nonfiction')assert.equal(first.readingGenre,'nonfiction');
   }
  }
 }
});
test('읽기·듣기는 같은 지문을 공유하며 각 지문마다 듣기 질문이 두 개 변경된다',()=>{
 for(let g=3;g<=6;g++){
  const readSets=Bank.asReadingSets(g,{mode:'read'}),listenSets=Bank.asReadingSets(g,{mode:'listen'});
  for(let i=0;i<8;i++){
   assert.equal(readSets[i].passage,listenSets[i].passage);
   assert.equal(readSets[i].questions.filter((row,j)=>row[0]!==listenSets[i].questions[j][0]).length,2);
  }
 }
});
test('선택지형과 단답형은 기존 채점/인쇄와 호환되며 한국어 평가를 회귀시키지 않는다',()=>{
 for(const topic of ['reading-assessment','listening-set']){
  const sheet=Core.generate({subject:'english',grade:4,topic,count:5,seed:37,responseFormat:'short'});
  assert.ok(sheet.items.every(i=>i.choices.length===0&&i.answer));
 }
 const korean=Core.generate({subject:'korean',grade:3,topic:'listening-set',count:5,seed:42});
 assert.equal(korean.items.length,5);assert.ok(korean.items[0].readingPassage);
});
test('영어 결과는 국어와 별도 저장소를 쓰며 실명·미동의 저장 방지와 내보내기를 제공한다',()=>{
 const worksheet=Core.generate({subject:'english',grade:6,topic:'listening-set',count:10,seed:88});
 const selected=worksheet.items.map((q,i)=>i%2?q.choices.find(v=>v!==q.answer):q.answer);
 const summary=Results.summarize(worksheet.items,selected);
 assert.equal(summary.correct,5);assert.equal(summary.total,10);assert.equal(summary.score,50);
 const s=store(),record=Results.makeRecord({code:'B06',topic:'listening-set',grade:6,summary,when:'2026-11-08T12:00:00Z',id:'en-1'});
 Results.save(s,record);
 assert.equal(Results.read(s)[0].mode,'듣기');
 assert.equal(Results.read(s)[0].code,'B06');
 assert.equal(s.getItem(Results.KEY).includes(worksheet.items[0].readingPassage),false);
 assert.ok(Results.KEY.includes('english')&&!Results.KEY.includes('korean'));
 const csv=Results.exportCSV(Results.read(s));
 assert.ok(csv.startsWith('\ufeff')&&csv.includes('"B06"'));
 for(const bad of ['홍길동','A 10','<script>'])
  assert.throws(()=>Results.makeRecord({code:bad,topic:'listening-set',grade:6,summary}));
 Results.clear(s);assert.deepEqual(Results.read(s),[]);
});
test('학생용 대본 은닉, Google 영어 TTS 우선순위와 재생 설정을 포함한다',()=>{
 const ui=read('worksheet-english-assessment-ui.js'),css=read('worksheet-english-assessment.css');
 const html=read('문제지 만들기.html'),renderer=read('daily-worksheet.js'),dictation=read('worksheet-dictation-ui.js');
 assert.ok(html.indexOf('data/english-assessment-bank.js')<html.indexOf('daily-worksheet-core.js'));
 assert.match(ui,/utterance\.lang='en-US'/);
 assert.match(ui,/isGoogleEnglish\(v\)&&\/\^en\[-_\]US\/i/);
 assert.match(ui,/if\(assessment\.topic!=='listening-set'\)/);
 assert.match(ui,/englishStudentCode/);
 assert.match(ui,/englishSaveOptIn/);
 assert.match(ui,/englishListeningControls/);
 assert.match(renderer,/if\(sheet\.topic==='listening-set'\)\{const note=/);
 assert.match(css,/@media print[\s\S]*\.english-listening-controls[\s\S]*display:none!important/);
 assert.match(dictation,/subject==='english'\)voices\.sort/);
});
