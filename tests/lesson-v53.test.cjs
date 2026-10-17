'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../lesson-core.js'),U=require('../studio-unified-core.js');
const validators={canvas:U.validate,slides:require('../balpyo-core.js').validateDeck,document:require('../munseo-core.js').validate,design:require('../doan-core.js').validateProject};
test('5.3 old lessons keep loading and new preparation fields survive normalizing and backup',()=>{
 const old={version:1,id:'old',title:'우리 반 역사',steps:[C.step('timer')],createdAt:1,updatedAt:2,position:0};
 const loaded=C.normalize(old,validators);
 assert.equal(loaded.goal,'');assert.equal(loaded.audience,'');assert.equal(loaded.steps[0].kind,'timer');
 const newer={...loaded,goal:'세 나라의 생활 알아보기',audience:'열매2반'};
 assert.equal(C.normalize(JSON.parse(JSON.stringify(newer)),validators).goal,'세 나라의 생활 알아보기');
 assert.equal(C.normalize(newer,validators).audience,'열매2반');
});
test('5.3 quiz cards can be edited, saved and later replayed as independent lesson copies',()=>{
 const lesson=C.blank();const cards=C.parseCards('대한민국 수도? | 서울\n우리 반 약속은? | 서로 도와요');
 lesson.steps.push(C.step('quiz',{cards}));
 assert.equal(cards.length,2);
 assert.deepEqual(cards[0],{front:'대한민국 수도?',back:'서울'});
 const copy=C.normalize(lesson,validators);
 assert.equal(copy.steps[0].payload.cards.length,2);
 cards[0].back='부산';assert.equal(copy.steps[0].payload.cards[0].back,'서울');
 assert.throws(()=>C.parseCards('구분자가 없는 카드'),/나눠/);
 assert.throws(()=>C.normalize({...lesson,steps:[C.step('quiz',{cards:[{front:'',back:'정답'}]})]},validators),/입력/);
 assert.throws(()=>C.normalize({...lesson,steps:[C.step('quiz',{cards:Array.from({length:61},()=>({front:'q',back:'a'}))})]},validators),/60개/);
});
test('5.3 timer activities expand into ordered stand-alone lesson steps without altering the source',()=>{
 const input=[{name:'도입',durationSec:300,note:'인사'},{name:'활동',durationSec:600},{name:'마무리',durationSec:120}];
 const original=JSON.stringify(input),steps=C.timerFromEvents(input);
 assert.deepEqual(steps.map(s=>s.seconds),[300,600,120]);
 assert.deepEqual(steps.map(s=>s.title),['도입','활동','마무리']);
 assert.equal(steps[0].notes,'인사');assert.notEqual(steps[0].id,steps[1].id);
 assert.equal(JSON.stringify(input),original);
 assert.throws(()=>C.timerFromEvents([{name:'시간',durationSec:999999}]),/시간/);
});
test('5.3 readiness checks only persistent or intentionally configured items',()=>{
 const lesson=C.blank(),quiz=C.step('quiz',{cards:[{front:'Q',back:'A'}]});
 const missing=C.step('video'),timer=C.step('timer'),canvas=C.step('canvas',U.starter('presentation'));
 lesson.steps=[quiz,missing,timer,canvas];
 assert.equal(C.readyCount(lesson.steps),3);
 missing.assetId='user-upload';assert.equal(C.readyCount(lesson.steps),4);
});
test('5.3 lesson view loads saved teacher activities and records goal, class and presenter notes',()=>{
 const html=fs.readFileSync('lesson.html','utf8'),js=fs.readFileSync('lesson-app.js','utf8');
 for(const field of ['lessonAudience','lessonGoal','createLessonFlow','lessonOverview','lessonPresenter','toggleLessonNotes'])
  assert.ok(html.includes('id="'+field+'"'),field);
 assert.match(html,/classroom-workspace\.js/);
 assert.match(js,/C\.timerFromEvents/);
 assert.match(js,/C\.normalizeCards/);
 assert.match(js,/save\(\);render\(\)/);
 assert.match(js,/s\.kind==='quiz'/);
 assert.match(js,/lesson\.audience=/);
 assert.match(js,/lesson\.goal=/);
});
