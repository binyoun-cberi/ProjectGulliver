'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../studio-unified-core.js'),N=require('../studio-teacher-next.js');
const lesson={kind:'lesson',subject:'국어',unit:'1. 동물',page:'12쪽',topic:'우리가 관찰한 동물',objective:'동물의 움직임을 관찰해 말한다',act1:'움직이기',act2:'보기',act3:'찾기',wrapup:'같이 발표하기',sampleOnly:false};
const roleState={kind:'roles',confirmed:true,roles:[{id:'r1',name:'칠판'},{id:'r2',name:'책'}],students:[{id:'s1',name:'봄'},{id:'s2',name:'진'}],assignment:{s1:'r1',s2:'r2'},fixed:{s1:'r1'},excluded:{s2:['r1']},prefs:['private']};
const groupState={kind:'groups',confirmed:true,groups:[[{id:'s1',name:'봄'},{id:'s2',name:'진'}],[{id:'s3',name:'솔'}]],secret:'should not copy'};
test('lesson import is editable and rejects the original sample lesson',()=>{
 for(const layout of ['wide','a4']){
  const r=N.lesson(lesson,{layout});assert.equal(r.pages.length,1);
  const txt=JSON.stringify(r.pages);
  for(const term of ['우리가 관찰한 동물','동물의 움직임을 관찰해 말한다','같이 발표하기','움직이기'])assert.ok(txt.includes(term),term);
  assert.ok(r.pages[0].elements.filter(e=>e.type==='text').length>=8);
  const doc=C.validate({...C.starter('blank'),layout,pages:r.pages});assert.equal(doc.pages.length,1);
 }
 assert.throws(()=>N.lesson({...lesson,sampleOnly:true}),/예시 수업/);
 assert.throws(()=>N.lesson({...lesson,topic:''}),/수업 주제/);
});
test('only confirmed actual class role assignments convert; private preferences/exclusions are never copied',()=>{
 assert.throws(()=>N.roles({...roleState,confirmed:false}),/이번 역할 확정/);
 assert.throws(()=>N.roles({...roleState,assignment:{s1:'r1'}}),/일부 학생/);
 const r=N.roles(roleState,{layout:'wide'});
 assert.equal(r.pages.length,1);assert.ok(JSON.stringify(r.pages).includes('칠판'));assert.ok(JSON.stringify(r.pages).includes('진'));
 assert.doesNotMatch(JSON.stringify(r.pages),/private|excluded|fixed|prefs/);
 const many={...roleState,roles:Array.from({length:42},(_,i)=>({id:'r'+i,name:'역할'+i})),students:Array.from({length:42},(_,i)=>({id:'s'+i,name:'학생'+i})),assignment:Object.fromEntries(Array.from({length:42},(_,i)=>['s'+i,'r'+i]))};
 assert.equal(N.roles(many,{layout:'wide'}).pages.length,9);
});
test('only fully confirmed groups convert to editable names, no private group constraints',()=>{
 assert.throws(()=>N.groups({...groupState,confirmed:false}),/이번 모둠 확정/);
 assert.throws(()=>N.groups({...groupState,groups:[groupState.groups[0],groupState.groups[0]]}),/중복/);
 const r=N.groups(groupState,{layout:'a4'});
 assert.equal(r.pages.length,1);
 const txt=JSON.stringify(r.pages);
 for(const term of ['봄','진','솔','1모둠','2모둠'])assert.ok(txt.includes(term),term);
 assert.doesNotMatch(txt,/secret/);
 const project=C.validate({...C.starter('worksheet'),pages:r.pages});
 assert.equal(project.layout,'a4');
});
test('linked-source provenance is whitelisted and retained through project validation and save reload',()=>{
 const r=N.lesson(lesson),page={...r.pages[0],teacherSource:{kind:'lesson',instance:'link-123',snapshotAt:1781800000000,private:'secret'}};
 const p=C.validate({...C.starter('blank'),pages:[page]});
 assert.deepEqual(p.pages[0].teacherSource,{kind:'lesson',instance:'link-123',snapshotAt:1781800000000});
 const reopened=C.validate(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(reopened.pages[0].teacherSource,p.pages[0].teacherSource);
 const invalid=C.validate({...C.starter('blank'),pages:[{...page,teacherSource:{kind:'secret',instance:'abc'}}]});
 assert.equal(invalid.pages[0].teacherSource,undefined);
});
