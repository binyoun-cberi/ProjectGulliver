'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),T=require('../studio-teacher-core.js');
const check=(result)=>{
 assert.ok(result.pages.length);
 const trial=C.starter('blank'),merged=C.validate({...trial,layout:result.layout,
   pages:[...trial.pages,...result.pages],active:trial.pages.length});
 assert.equal(merged.pages.length,result.pages.length+1);
 const first=merged.pages[1];
 assert.ok(first.elements.every(e=>e.id&&C.TYPES.includes(e.type)));
 return merged;
};
test('saved flashcards create independently editable question and answer slides',()=>{
 const out=T.quizCards([{front:'삼각형',back:'세 개의 변'},{front:'덧셈',back:'합을 구하는 계산'}],{layout:'wide'});
 assert.equal(out.pages.length,4);
 const p=check(out);assert.ok(p.pages[1].elements.some(e=>e.type==='text'&&e.content==='삼각형'));
 assert.ok(p.pages[2].elements.some(e=>e.type==='text'&&e.content==='세 개의 변'));
 assert.notEqual(p.pages[1].elements[0].id,p.pages[2].elements[0].id);
});
test('lesson timer events from saved activity produce printable editable stage schedule',()=>{
 const activity={id:'activity1',kind:'timer',title:'오늘의 수업',payload:{events:[{name:'놀이',durationSec:420,color:'#00AAFF'},{name:'정리',durationSec:180}]}};
 const result=T.convertActivity(activity,{layout:'a4'});
 assert.equal(result.pages.length,1);assert.ok(check(result).pages[1].elements.some(e=>e.content==='7분'));
});
test('seating never invents an assignment, but uses explicitly supplied saved seats',()=>{
 const blank=T.seatingPlan({cols:3,rows:2},{layout:'wide',students:['민','진']});
 const p=check(blank).pages[1];assert.ok(p.elements.some(e=>e.content==='자리 1'));
 assert.ok(!p.elements.some(e=>e.content==='민'));
 const saved=T.seatingPlan({cols:2,rows:2},{layout:'a4',seatNames:['민','진','','솔']});
 assert.ok(check(saved).pages[1].elements.some(e=>e.content==='민'));
 assert.ok(check(saved).pages[1].elements.some(e=>e.content==='솔'));
});
test('checklist copies supplied student status and supports multiple A4 pages',()=>{
 const names=Array.from({length:26},(_,i)=>'학생 '+(i+1)),checks=names.map((_,i)=>i%2===0);
 const out=T.checklist({theme:'준비물 확인',students:names,checks},{layout:'a4'});
 assert.equal(out.pages.length,2);const merged=check(out);assert.ok(merged.pages[1].elements.some(e=>e.content==='✓'));
});
test('oversized, malformed or empty activity inputs are rejected explicitly',()=>{
 assert.throws(()=>T.quizCards([],{}),/낱말카드/);
 assert.throws(()=>T.convertActivity({kind:'roulette',payload:{}},{layout:'wide'}),/변환/);
 assert.throws(()=>T.checklist({students:[]}),/학생/);
 assert.equal(T.seatingPlan({cols:8,rows:8}).pages.length,1);
 assert.ok(T.seatingPlan({cols:10,rows:8}).pages.every(p=>p.elements.length<=150));
});
