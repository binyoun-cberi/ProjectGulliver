'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('../studio-teacher-source.js'),T=require('../studio-teacher-core.js'),C=require('../studio-unified-core.js');
const lookup=data=>key=>data[key]||null;
test('source: current timer settings win over old activity; never substitute a fake timer',()=>{
 const store={'lessonCircleTimerV3':{title:'도구에서 만든 요리 활동',events:[{name:'재료 고르기',durationSec:240,color:'#6688AA'},{name:'정리',durationSec:95}]}};
 const out=B.prepare('timer',{read:lookup(store),layout:'wide'});
 assert.equal(out.pages.length,1);
 assert.match(JSON.stringify(out.pages),/재료 고르기/);
 assert.match(JSON.stringify(out.pages),/4분/);
 assert.doesNotMatch(JSON.stringify(out.pages),/도입 · 이야기 나누기/);
 assert.throws(()=>B.prepare('timer',{read:lookup({})}),/타이머에서 활동/);
 assert.match(JSON.stringify(B.prepare('timer',{live:{kind:'timer',title:'새 타이머',events:[{name:'현장 수정',durationSec:80}]},read:lookup(store)}).pages),/현장 수정/);
});
test('source: quiz imports the actual new cards, never silently loses a long deck',()=>{
 const stored={'flashQuizMakerPlusV3':{cards:[{front:'바다',back:'Sea'}]}};
 assert.match(JSON.stringify(B.prepare('quiz',{read:lookup(stored)}).pages),/Sea/);
 assert.match(JSON.stringify(B.prepare('quiz',{live:{kind:'quiz',cards:[{front:'새로운 낱말',back:'새 정답'}]},read:lookup(stored)}).pages),/새 정답/);
 assert.throws(()=>B.prepare('quiz',{read:lookup({})}),/문제와 정답/);
 assert.equal(T.quizCards(Array.from({length:19},(_,i)=>({front:'문제 '+i,back:'답 '+i}))).pages.length,38);
 assert.throws(()=>T.quizCards(Array.from({length:20},(_,i)=>({front:'문제 '+i,back:'답 '+i}))),/19장/);
});
test('source: seating requires actual allocation, validates student identity and handles 10×8 desk structure',()=>{
 const settings={cols:10,rows:8,activeSeats:Array(80).fill(true),students:[{id:'1',name:'민'},{id:'2',name:'진'}]};
 settings.activeSeats[12]=false;
 const assignment=Array(80).fill(null);assignment[0]='1';assignment[1]='2';
 const store={'gulliver.seating.v3':settings,'gulliver.seating.history.v1':[{cols:10,rows:8,seats:assignment}]};
 const out=B.prepare('seating',{layout:'wide',read:lookup(store)});
 assert.equal(out.pages.length,2);
 const all=out.pages.flatMap(p=>p.elements);
 assert.ok(all.some(e=>e.content==='민'));assert.ok(all.some(e=>e.content==='진'));
 assert.ok(all.some(e=>e.content==='사용 안 함'));
 const doc=C.starter('blank'),result=C.validate({...doc,pages:[...doc.pages,...out.pages]});
 assert.equal(result.pages.length,3);
 assert.ok(out.pages.every(p=>p.elements.length<=C.MAX_ITEMS));
 assert.throws(()=>B.prepare('seating',{read:lookup({'gulliver.seating.v3':settings})}),/확정된 자리/);
 assert.throws(()=>B.prepare('seating',{read:lookup({...store,'gulliver.seating.history.v1':[{cols:10,rows:8,seats:['removed_student',...Array(79).fill(null)]}]})}),/학생 명단/);
});
test('source: missing names cannot silently turn into invented class names or false check marks',()=>{
 const room={students:[{id:'1',name:'민'},{id:'2',name:'진'}]};
 const state={studentCount:2,studentNames:['민','진'],currentTheme:'과제',data:{과제:{1:true,2:false}}};
 const out=B.prepare('check',{read:lookup({classChecklistState:state}),room,layout:'a4'});
 assert.ok(JSON.stringify(out.pages).includes('민'));assert.ok(JSON.stringify(out.pages).includes('✓'));
 assert.throws(()=>B.prepare('check',{read:lookup({classChecklistState:{studentCount:3}}),room}),/학생 이름을 모두/);
 assert.throws(()=>B.prepare('check',{read:lookup({})}),/학생 이름/);
});
