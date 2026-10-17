'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),N=require('../studio-teacher-next.js');
const ids=['a','b','c','d'],names=['민','진','솔','한'];
const students=ids.map((id,i)=>({id,name:names[i],needsFrontSeat:true,privateNote:'비공개'}));
const seats=Array(40).fill(null);ids.forEach((id,i)=>seats[i]=id);
const disabled=Array(40).fill(false);disabled[39]=true;
const bus={kind:'bus',confirmed:true,students,seats,disabled,avoidPairs:[['a','b']],fixedSeats:{a:0}};
const rounds=[{name:'4강',matches:[{aId:'a',bId:'b',winnerId:'a',resolved:true},{aId:'c',bId:'d',winnerId:'',resolved:false}]},{name:'결승',matches:[{aId:'a',bId:'',winnerId:'',resolved:false}]}];
const tourney={kind:'tournament',title:'가을 퀴즈 대회',participants:ids.map((id,i)=>({id,name:names[i]})),rounds,championId:null};
test('bus only imports fully confirmed 40 physical seats, aisle and unused seats are editable',()=>{
 for(const layout of ['wide','a4']){
  const data=N.bus(bus,{layout});
  assert.equal(data.pages.length,1);
  const out=JSON.stringify(data.pages);
  for(const t of [...names,'버스 앞','통로','사용 안 함','빈자리'])assert.ok(out.includes(t),t);
  for(const t of ['비공개','needsFrontSeat','avoidPairs','fixedSeats'])assert.ok(!out.includes(t),t);
  const rects=data.pages[0].elements.filter(e=>e.type==='rect');
  assert.ok(rects.length>=40);
  const model=C.validate({...C.starter('blank'),layout,pages:data.pages});
  assert.equal(model.pages.length,1);
  assert.ok(model.pages[0].elements.length<=150);
 }
 assert.throws(()=>N.bus({...bus,confirmed:false}),/이번 버스 자리 확정/);
 assert.throws(()=>N.bus({...bus,seats:[...seats.slice(0,4),seats[0],...seats.slice(5)]}),/중복/);
 assert.throws(()=>N.bus({...bus,disabled:[true,...disabled.slice(1)]}),/사용 불가/);
 assert.throws(()=>N.bus({...bus,seats:[null,...seats.slice(1)]}),/배정/);
});
test('tournament uses actual winners, unfinished matches stay unfinished; no guessed champions',()=>{
 for(const layout of ['wide','a4']){
  const data=N.tournament(tourney,{layout});
  const contents=JSON.stringify(data.pages);
  assert.ok(contents.includes('가을 퀴즈 대회'));
  assert.ok(contents.includes('승자  민'));
  assert.ok(contents.includes('결과 미정'));
  assert.ok(contents.includes('진출자 대기'));
  assert.ok(contents.includes('결승'));
  assert.ok(!contents.includes('우승 민'));
  assert.ok(data.pages.every(p=>p.elements.length<=150));
  C.validate({...C.starter('blank'),layout,pages:data.pages});
 }
 assert.throws(()=>N.tournament({...tourney,rounds:[]}),/생성된 대진표/);
 assert.throws(()=>N.tournament({...tourney,rounds:[{name:'결승',matches:[{aId:'a',bId:'b',winnerId:'nobody',resolved:true}]}]}),/존재하지 않는/);
 assert.throws(()=>N.tournament({...tourney,rounds:[{name:'결승',matches:[{aId:'a',bId:'b',winnerId:'c',resolved:true}]}]}),/실제 경기/);
 const completed={...tourney,championId:'a',rounds:[rounds[0],{name:'결승',matches:[{aId:'a',bId:'c',winnerId:'a',resolved:true}]}]};
 assert.match(JSON.stringify(N.tournament(completed).pages),/우승 민/);
});
test('64 entrants produce paginated printable editable bracket below 40-page and element caps',()=>{
 const names=Array.from({length:64},(_,i)=>({id:'x'+i,name:'학생 '+(i+1)}));
 let current=names.map(x=>x.id);
 const rounds=[];
 while(current.length>1){
  const matches=[];
  for(let i=0;i<current.length;i+=2)matches.push({aId:current[i],bId:current[i+1],winnerId:current[i],resolved:true});
  rounds.push({name:current.length+'강',matches});
  current=matches.map(m=>m.winnerId);
 }
 const payload={kind:'tournament',title:'교실 리그',participants:names,rounds,championId:current[0]};
 const data=N.tournament(payload,{layout:'wide'});
 assert.ok(data.pages.length>6&&data.pages.length<40);
 const verified=C.validate({...C.starter('blank'),pages:data.pages});
 assert.equal(verified.pages.length,data.pages.length);
});
test('bus and tournament linked provenance survives validation and denies unrecognized kinds',()=>{
 for(const kind of ['bus','tournament']){
  const page={...C.makePage('a',[C.element('text',{content:'sample'})]),teacherSource:{kind,instance:'teacher-bridge-123',snapshotAt:1781700000000,privateField:'secret'}};
  const project=C.validate({...C.starter('blank'),pages:[page]});
  assert.deepEqual(project.pages[0].teacherSource,{kind,instance:'teacher-bridge-123',snapshotAt:1781700000000});
  assert.equal(C.validate(JSON.parse(JSON.stringify(project))).pages[0].teacherSource.kind,kind);
 }
});