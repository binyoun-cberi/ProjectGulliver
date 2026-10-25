'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../worksheet-learning'),E=require('../worksheet-evidence-banks'),C=require('../daily-worksheet-core');
const banks=E.banks.filter(b=>b.items.some(q=>q.historyVolume&&!q.joseonVolume));
function options(bankId){for(const u of T.catalog)for(const l of u.lessons)if(T.binding(u,l)?.bankId===bankId)return {subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:20,responseFormat:'choice'};throw Error(bankId);}
test('13 history targets each support at least two full twenty-question sheets',()=>{
 assert.equal(banks.length,13);assert.equal(banks.flatMap(b=>b.items.filter(q=>q.historyVolume)).length,485);
 const original=JSON.stringify(E.banks);
 for(const b of banks){assert.ok(b.items.length>=40,b.id);assert.ok(new Set(b.items.map(q=>q.prompt)).size>=40,b.id);
  for(const format of ['choice','short','essay'])for(let seed=1;seed<=12;seed++){
   const o={...options(b.id),responseFormat:format,seed},a=T.generate(o,C),ids=a.items.map(q=>q.evidenceId),next=T.generate({...o,seed:seed+100,excludeEvidenceIds:ids},C);
   assert.equal(a.items.length,20);assert.equal(new Set(ids).size,20);assert.equal(next.items.length,20);assert.ok(next.items.every(q=>!ids.includes(q.evidenceId)),b.id+' '+format);
   for(const s of [a,next]){const started=new Set();let group=null;for(const q of s.items){assert.ok(b.items.some(x=>x.evidenceId===q.evidenceId));if(q.readingGroup){if(q.readingGroup!==group){assert.ok(!started.has(q.readingGroup));assert.ok(q.readingPassage);started.add(q.readingGroup);group=q.readingGroup;}else assert.equal(q.readingPassage,undefined);assert.equal(q.detail,undefined);}else group=null;}}
  }
 }
 assert.equal(JSON.stringify(E.banks),original);
});
test('saved pool indexes replay exact questions and choices after an exclusion draw',()=>{
 const o={...options('goryeo-culture'),seed:840},first=T.generate(o,C),next=T.generate({...o,excludeEvidenceIds:first.items.map(q=>q.evidenceId)},C);
 assert.deepEqual(T.generate({...o,itemIndexes:next.items.map(q=>q.poolIndex)},C),next);
 for(const invalid of [Array(20).fill(0),Array(20).fill(9999),[1],Array.from({length:20},(_,i)=>i+.1)])assert.throws(()=>T.generate({...o,itemIndexes:invalid},C),/문항 구성/);
});
test('new readings are sourced paragraphs, with reviewed category choices and no synonymous duplicate options',()=>{
 const q=banks.flatMap(b=>b.items.filter(q=>q.historyVolume));assert.equal(new Set(q.map(q=>q.evidenceId)).size,485);assert.equal(new Set(q.map(q=>q.passageId)).size,97);
 for(const x of q){assert.ok(x.detail.length>=100);assert.ok(x.source.startsWith('https://'));assert.equal(new Set(x.choices).size,3);assert.ok(x.choices.includes(x.answer));assert.doesNotMatch(x.detail,/관찰 메모|학습 메모|TEMP/);}
 for(const synonyms of [['협력','협동'],['여러 자료','다양한 근거'],['저장','보관'],['발견 위치','출토 위치','발견 장소']])for(const x of q)assert.ok(x.choices.filter(c=>synonyms.includes(c)).length<2,x.prompt);
});
test('official standards aggregate only explicitly mapped history content and validate subject and grade',()=>{
 const expected={'6사04-01':['paleolithic','neolithic','bronze-age','gojoseon'],'6사04-02':['goguryeo','baekje','silla-gaya','silla-unification','balhae'],'6사04-03':['goryeo-founding','goryeo-society','goryeo-defense','goryeo-culture']};
 for(const [code,ids] of Object.entries(expected))for(const grade of [5,6]){
  const std=T.lookupStandard('social',grade,code);assert.ok(std.standard.statement.endsWith('추론한다.'));const allowed=new Set(E.banks.filter(b=>ids.includes(b.id)).flatMap(b=>b.items.map(q=>q.evidenceId)));
  const s=T.generate({subject:'social',grade,standardCode:code,count:20,responseFormat:'choice',seed:41},C);assert.equal(s.items.length,20);assert.ok(s.items.every(q=>allowed.has(q.evidenceId)));assert.equal(s.curriculum.standardCode,code);assert.equal(s.alignment.code,code);assert.ok(s.alignment.scope);
 }
 assert.equal(T.lookupStandard('social',4,'6사04-03'),null);assert.equal(T.lookupStandard('math',5,'6사04-03'),null);assert.throws(()=>T.generate({subject:'social',grade:4,standardCode:'6사04-03',count:20,seed:1},C));
});
test('available standards in all four subjects generate only their supported formats and capacities',()=>{
 for(const subject of ['social','math','science','korean'])for(let grade=1;grade<=6;grade++)for(const std of T.standards(subject,grade)){
  for(const [format] of T.formats(std.binding)){const count=Math.max(...T.counts(std.binding,format)),s=T.generate({subject,grade,standardCode:std.code,count,responseFormat:format,seed:938},C);assert.equal(s.items.length,count,std.code);assert.ok(s.items.every(q=>q.answer));}
 }
});
