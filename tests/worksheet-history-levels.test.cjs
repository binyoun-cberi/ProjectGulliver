'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../daily-worksheet-core');
const history=require('../worksheet-history-levels');

test('history difficulty quotas produce a repeatable sheet with distinct items and valid choices',()=>{
 const settings={count:40,counts:{low:0,middle:20,high:20},seed:42};
 const sheet=history.generate(settings,core);
 assert.deepEqual(sheet,history.generate(settings,core));
 assert.deepEqual(sheet.historyLevels,settings.counts);
 assert.equal(new Set(sheet.items.map(item=>item.id)).size,40);
 for(const level of ['middle','high']){
  const items=sheet.items.filter(item=>item.difficultyLevel===level);
  assert.equal(items.length,20);
  assert.equal(new Set(items.map(item=>item.era)).size,5);
  assert.ok(items.every(item=>item.detail&&item.explanation&&new Set(item.choices).size===4&&item.choices.includes(item.answer)));
 }
 const single=history.generate({count:1,counts:{low:1,middle:0,high:0},seed:42},core);
 assert.equal(single.items.length,1);
 assert.ok(core.historyItems(single.items[0].era).some(item=>item.id===single.items[0].id));
});

test('history difficulty quotas reject mismatched, over-capacity, and fractional counts',()=>{
 for(const settings of [
  {count:20,counts:{low:10,middle:5,high:4}},
  {count:21,counts:{low:0,middle:21,high:0}},
  {count:3,counts:{low:1.5,middle:1.5,high:0}},
  {count:41,counts:{low:40,middle:1,high:0}},
  {count:0,counts:{low:0,middle:0,high:0}},
 ])assert.throws(()=>history.generate(settings,core),/문항 수/);
});
