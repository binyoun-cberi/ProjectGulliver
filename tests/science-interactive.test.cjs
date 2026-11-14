'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const B=require('../science-interactive-bank.js');
const base=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
test('gas: ideal gas pressure rises as volume shrinks at constant temperature',()=>{
 assert.equal(B.pressureAt(24),1);assert.equal(B.pressureAt(12),2);assert.equal(B.pressureAt(8),3);
 assert.throws(()=>B.pressureAt(0));assert.throws(()=>B.pressureAt(-2));
});
test('temperature: particle speed model uses absolute temperature and is monotone',()=>{
 assert.equal(B.particleSpeed(20),1);
 assert.ok(B.particleSpeed(90)>B.particleSpeed(50));
 assert.ok(B.particleSpeed(50)>B.particleSpeed(10));
 assert.throws(()=>B.particleSpeed(-300));
});
test('reflection: angle measured against the normal is unchanged',()=>{
 for(const value of B.LABS.reflection.values)assert.equal(B.reflectionAt(value),value);
 assert.throws(()=>B.reflectionAt(100));
});
test('three distinct recorded observations, no duplicate counting or fourth result',()=>{
 let records=[];for(const v of [24,24,12,8,16])records=B.record(records,'gas',v);
 assert.deepEqual(records,[24,12,8]);assert.throws(()=>B.record(records,'gas',99));
});
test('opt-in enrich replaces only eligible science units, preserving sheet and item count',()=>{
 const sheet={subject:'science',grade:5,topic:'unit-mix',seed:345,count:4,items:[
  {prompt:'a',sourceTopic:'matter',answer:'a'},
  {prompt:'b',sourceTopic:'heat',answer:'b'},
  {prompt:'c',sourceTopic:'light-sound',answer:'c'},
  {prompt:'d',sourceTopic:'animals',answer:'d'}
 ]};
 const result=B.enrich(sheet);
 assert.equal(result.items.length,4);assert.deepEqual(result.interactiveScience,['gas','temperature','reflection']);
 assert.deepEqual(result.items.map(x=>x.interactiveExperiment?.id||null),['gas','temperature','reflection',null]);
 assert.equal(result.items[3],sheet.items[3]);assert.equal(sheet.items[0].prompt,'a');
 assert.equal(B.enrich(result),result);
 for(const item of result.items.slice(0,3)){assert.equal(item.format,'essay');assert.ok(item.modelExplanation);assert.ok(item.detail);assert.deepEqual(item.choices,[])}
});
test('not-science, younger grades, and ineligible topics are not changed',()=>{
 for(const sheet of [
  {subject:'math',grade:6,topic:'matter',items:[{prompt:'a'}]},
  {subject:'science',grade:4,topic:'matter',items:[{prompt:'a'}]},
  {subject:'science',grade:6,topic:'animals',items:[{prompt:'a'}]}
 ])assert.equal(B.enrich(sheet),sheet);
});
test('lab link is same-origin, stable, and has no student or teacher identity query',()=>{
 const link=B.linkFor('https://example.org/class/문제지 만들기.html?subject=science&student=abc','reflection',4294967298);
 const url=new URL(link);assert.equal(url.origin,'https://example.org');assert.equal(decodeURIComponent(url.pathname),'/class/과학 탐구 실험.html');
 assert.equal(url.searchParams.get('lab'),'reflection');assert.equal(url.searchParams.get('seed'),'2');assert.equal(url.searchParams.has('student'),false);
 assert.throws(()=>B.linkFor('https://example.org/a','unknown',4));
});
test('worksheet and page integrate lab bank, qrcode, print styling, and no remote data submission',()=>{
 const worksheet=read('문제지 만들기.html'),ui=read('daily-worksheet.js'),page=read('과학 탐구 실험.html'),css=read('science-interactive-worksheet.css');
 assert.match(worksheet,/id="scienceInteractive"/);
 assert.ok(worksheet.indexOf('science-interactive-bank.js')<worksheet.indexOf('daily-worksheet.js'));
 assert.match(ui,/ScienceInteractiveBank\.enrich/);
 assert.match(ui,/generator\.createSvgTag/);
 assert.match(ui,/url\.searchParams\.set\('lab','1'\)/);
 assert.match(ui,/interactiveExperiment/);
 assert.match(page,/science-interactive-bank\.js/);
 assert.match(page,/id="slider"/);assert.match(page,/id="prediction"/);assert.match(page,/id="conclusion"/);
 assert.match(css,/@media print/);
 assert.doesNotMatch(page,/fetch\s*\(|XMLHttpRequest|localStorage\.setItem/);
});
test('embedded lab script and updated worksheet JS are syntactically valid',()=>{
 const page=read('과학 탐구 실험.html'),script=page.match(/<script>\s*([\s\S]*?)<\/script>/);
 assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script[1]));
 assert.doesNotThrow(()=>new vm.Script(read('daily-worksheet.js')));
});
