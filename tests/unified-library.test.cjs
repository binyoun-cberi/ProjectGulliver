'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../unified-library.js');
test('indexes all existing stores without changing their records',()=>{
 const item={id:'p-1',kind:'canvas',title:'가을 활동지',updatedAt:150,payload:{pages:[]}};
 const original=JSON.stringify(item);
 const rows=core.entries({
  projects:[item,{id:'v-1',kind:'video',title:'운동회 영상',updatedAt:100}],
  official:[{id:'o-1',kind:'music',title:'고급 음악',updatedAt:101}],
  activities:[{id:'a-1',kind:'timer',title:'수업 타이머',updatedAt:120}],
  lessons:[{id:'l-1',title:'봄 수업',updatedAt:140}],
  assets:[{id:'i-1',name:'사과.png',createdAt:90}]
 });
 assert.equal(rows.length,6);
 assert.deepEqual(rows.map(x=>x.title),['가을 활동지','봄 수업','수업 타이머','고급 음악','운동회 영상','사과.png']);
 assert.equal(rows.find(x=>x.origin==='activities').category,'수업 도구');
 assert.equal(rows.find(x=>x.origin==='lessons').href,'lesson.html?lesson=l-1');
 assert.match(rows.find(x=>x.origin==='official').href,/official=music%3Ao-1/);
 assert.equal(JSON.stringify(item),original);
});
test('normalizes malformed entries and escapes URL IDs',()=>{
 const rows=core.entries({projects:[
  {id:'a #1',title:'찾기',kind:'canvas',updatedAt:10},
  {id:'',kind:'canvas',title:'버려야 함'},
  {id:'unknown',kind:'undefined',title:'지원하지 않음'}
 ]});
 assert.equal(rows.length,1);
 assert.equal(rows[0].href,'뚝딱 제작실.html?project=a%20%231');
});
test('filters by kind and search independently of source',()=>{
 const rows=core.entries({projects:[{id:'p',kind:'slides',title:'숲속 발표',updatedAt:10}],lessons:[{id:'l',title:'숲속 수업',updatedAt:20}],activities:[{id:'a',kind:'quiz',title:'숲속 퀴즈',updatedAt:5}]});
 assert.equal(core.filter(rows,'숲속','전체').length,3);
 assert.equal(core.filter(rows,'숲속','학습자료').length,1);
 assert.equal(core.filter(rows,'숲속','수업 도구').length,1);
 assert.equal(core.filter(rows,'없는 말','전체').length,0);
 assert.deepEqual(core.filter(rows,'','전체','old').map(x=>x.id),['a','p','l']);
});
