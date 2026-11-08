'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Results=require('../worksheet-korean-assessment-results.js');
const Bank=require('../data/korean-assessment-bank.js');
const Core=require('../daily-worksheet-core.js');
function mockStorage(){
 const values=new Map();
 return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};
}
test('평가 요소 집계는 문항 정오답만 계산하고 원문·답안을 기록하지 않는다',()=>{
 const sheet=Core.generate({subject:'korean',grade:5,topic:'listening-set',type:'listening-set-five',count:10,seed:43});
 const answers=sheet.items.map((q,i)=>i%2===0?q.answer:q.choices.find(x=>x!==q.answer));
 const sum=Results.summarize(sheet.items,answers);
 assert.equal(sum.score,50);assert.equal(sum.correct,5);assert.equal(sum.total,10);
 assert.equal(Object.values(sum.skills).reduce((n,s)=>n+s.total,0),10);
 const record=Results.makeRecord({code:'5A-01',grade:5,topic:'listening-set',summary:sum,when:'2026-11-07T12:00:00.000Z',id:'attempt-1'});
 assert.equal(record.code,'5A-01');assert.equal(record.mode,'듣기');
 assert.equal(record.score,50);assert.ok(record.skills);
 const serialized=JSON.stringify(record);
 assert.equal(serialized.includes(sheet.items[0].readingPassage),false);
 assert.equal(serialized.includes(sheet.items[0].prompt),false);
 assert.equal(serialized.includes('choices'),false);
});
test('학생 코드로만 저장하고 기록은 100개로 제한하며 전체 삭제할 수 있다',()=>{
 const storage=mockStorage();
 for(let i=0;i<125;i++){
  const record=Results.makeRecord({code:'S-'+i,grade:3,topic:'reading-assessment',summary:{correct:3,total:5,score:60,skills:{fact:{correct:1,total:2}}},when:'2026-11-07T12:00:00.000Z',id:'attempt-'+i});
  Results.save(storage,record);
 }
 const records=Results.read(storage);
 assert.equal(records.length,100);
 assert.equal(records[0].code,'S-124');assert.equal(records.at(-1).code,'S-25');
 assert.ok(Results.weaknesses(records[0].skills).includes('정보 파악'));
 Results.clear(storage);assert.deepEqual(Results.read(storage),[]);
});
test('실명, 스크립트, 코드 공백은 거부하고 잘못된 저장 데이터를 안전하게 처리한다',()=>{
 for(const code of ['홍길동','', '홍길동1','S 1','<img>','=1+1','A'.repeat(21)])
  assert.throws(()=>Results.makeRecord({code,grade:3,topic:'listening-set',summary:{correct:1,total:1,score:100,skills:{fact:{correct:1,total:1}}}}));
 const storage=mockStorage();storage.setItem(Results.KEY,'not-json');assert.deepEqual(Results.read(storage),[]);
 assert.throws(()=>Results.summarize([{answer:'하나',koreanSkill:'fact'}],[]));
});
test('CSV 내보내기는 엑셀 수식 주입 방지와 UTF-8 BOM을 적용한다',()=>{
 const csv=Results.exportCSV([{at:'=1+1',code:'S01',grade:3,mode:'듣기',score:100,correct:5,total:5,skills:{}}]);
 assert.ok(csv.startsWith('\ufeff'));
 assert.ok(csv.includes('"\'=1+1"'));
 assert.ok(csv.includes('"S01"'));
});
test('공통 지문은 읽기·듣기 공통이며 듣기에는 별도 문항과 평가 요소 태그가 있다',()=>{
 for(let g=1;g<=6;g++){
  const a=Bank.asReadingSets(g,{mode:'read'}),b=Bank.asReadingSets(g,{mode:'listen'});
  assert.equal(a.length,16);assert.equal(b.length,16);
  for(let i=0;i<16;i++){
   assert.equal(a[i].passage,b[i].passage);
   assert.equal(a[i].skills.length,5);assert.equal(b[i].skills.length,5);
   assert.ok(a[i].skills.every(Boolean)&&b[i].skills.every(Boolean));
   assert.ok(b[i].questions.filter((q,j)=>q[0]!==a[i].questions[j][0]).length>=2);
  }
 }
});
test('Google 한국어 우선순위와 음성 미제공 대체 안내가 구현되어 있다',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','worksheet-korean-assessment-ui.js'),'utf8');
 const dictation=fs.readFileSync(path.join(__dirname,'..','worksheet-dictation-ui.js'),'utf8');
 assert.match(ui,/voices\.find\(isGoogleKorean\)/);
 assert.match(ui,/synth\?\.addEventListener\?\.\('voiceschanged',refreshVoices\)/);
 assert.match(ui,/Google 한국어 음성을 제공하지 않아/);
 assert.match(dictation,/voices\.find\(v=>\/Google\/i\.test\(v\.name\)\)/);
});
