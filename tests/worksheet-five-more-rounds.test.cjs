'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../daily-worksheet-core.js');
const Column=require('../column-math.js');
const {review}=require('../scripts/worksheet-critique-loop.cjs');

test('round 1: English conversations use explicit clues for answers requiring a situation',()=>{
 for(const seed of [7,42,20261025]){
  const sheet=C.generate({subject:'english',grade:3,topic:'conversation',count:20,seed});
  assert.equal(sheet.items.length,20);
  assert.equal(new Set(sheet.items.map(item=>item.prompt)).size,20);
  for(const item of sheet.items){
   assert.ok(item.choices.includes(item.answer));
   assert.equal(new Set(item.choices).size,item.choices.length);
  }
  for(const [question,clue] of [
    ['What color is it?','파란 풍선'],
    ['Where is the library?','학교 옆'],
    ['What time is it?','세 시'],
    ['What day is it today?','월요일'],
    ['Where is my book?','책상 위'],
    ['How is the weather?','맑은 날씨']
  ]){
   const item=sheet.items.find(x=>x.prompt.includes('“'+question+'”'));
   assert.ok(item,'missing: '+question);
   assert.ok(item.prompt.includes(clue),'unanchored answer: '+question);
  }
 }
});

test('round 2: OX and writing format prompts do not retain choice commands',()=>{
 const combinations=[
  ['korean',3,'vocabulary','vocabulary-context'],
  ['english',3,'conversation',''],
  ['science',5,'ecosystem',''],
  ['social',3,'past','past-evidence'],
  ['social',5,'joseon','joseon-quiz']
 ];
 for(const [subject,grade,topic,type] of combinations){
  for(const responseFormat of ['ox','short','essay']){
   const opts={subject,grade,topic,type,count:10,seed:42,responseFormat};
   const sheet=C.generate(opts);
   assert.equal(sheet.items.length,10);
   for(const item of sheet.items){
    assert.doesNotMatch(item.prompt,/(?:고르세요|선택하세요)/,JSON.stringify(opts));
    if(responseFormat==='ox')assert.ok(['O','X'].includes(item.answer)&&item.oxProposal);
    else assert.equal(item.choices.length,0);
    if(responseFormat==='essay')assert.ok(item.prompt.includes('까닭')&&item.modelExplanation);
   }
  }
 }
});

test('round 3: every second-grade two-digit vertical addition stays at most 99',()=>{
 for(const mode of ['any','yes','no'])for(const seed of [7,42,20261025,1009]){
  const options={subject:'math',grade:2,topic:'column',type:'column-add2',columnMode:mode,count:12,seed};
  const sheet=C.generate(options);
  for(const {column:c} of sheet.items){
   assert.ok(c.a>=10&&c.a<=99&&c.b>=10&&c.b<=99);
   assert.ok(c.a+c.b<=99,'grade 2 result exceeds 99: '+c.a+'+'+c.b);
   if(mode!=='any')assert.equal(Column.carries(c.a,c.b,'+'),mode==='yes');
  }
 }
});

test('round 4: history and local evidence sheets use meaning-specific stems',()=>{
 for(const [topic,type] of [['past','past-evidence'],['local','local-evidence']]){
  const sheet=C.generate({subject:'social',grade:3,topic,type,count:20,seed:42});
  const prompts=new Set(sheet.items.map(x=>x.prompt));
  assert.ok(prompts.size>=3,topic+' repeats an uninformative question');
  assert.ok(sheet.items.every(x=>x.detail&&x.choices.includes(x.answer)));
  assert.ok(sheet.items.every(x=>!x.prompt.includes('자료에서 알 수 있는 것을 고르세요.')));
 }
});

test('round 5: the full critique runner treats format-instruction conflicts as definite errors',()=>{
 const fake={
  SUBJECTS:{korean:{grades:[3],topics:[['vocabulary','어휘',3]]}},
  units:()=>[],supportedCounts:()=>[5],answerFormats:()=>[],
  generate:()=>({items:Array.from({length:5},(_,i)=>({
    prompt:(i+1)+'번 문제에서 답을 고르세요.',answer:'A'+i,choices:[],
    responseFormat:'essay',format:'essay',modelExplanation:'학생의 근거를 확인한다.'
  }))})
 };
 const result=review(fake);
 assert.equal(result.examined,2);
 assert.equal(result.errors.filter(x=>x.problem==='답안 형식과 지시문 불일치').length,10);
});
