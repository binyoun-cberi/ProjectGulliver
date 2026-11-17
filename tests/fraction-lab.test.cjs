'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('../fraction-lab-math.js');
const C=require('../fraction-lab-classroom.js');

test('쪼개어도 색칠한 영역은 그대로 유지된다',()=>{
  const half=[true,false];
  const quarters=M.resample(half,4);
  const eighths=M.resample(quarters,8);
  assert.deepEqual(quarters,[true,true,false,false]);
  assert.deepEqual(eighths,[true,true,true,true,false,false,false,false]);
  assert.deepEqual(M.resample(eighths,2),half);
  assert.equal(M.colored(eighths)/eighths.length,0.5);
});
test('형태가 맞지 않는 분할은 색칠을 임의로 왜곡하지 않는다',()=>{
  assert.equal(M.resample([true,false,false],4),null);
  assert.equal(M.resample([true,false,true,false],2),null);
  assert.deepEqual(M.resample([false,false,false],8),Array(8).fill(false));
  assert.deepEqual(M.resample([true,true,true],6),Array(6).fill(true));
});
test('동치분수와 약분',()=>{
  assert.deepEqual(M.reduce(2,4),{n:1,d:2});
  assert.deepEqual(M.reduce(4,8),{n:1,d:2});
  assert.equal(M.equal({n:1,d:2},{n:4,d:8}),true);
  assert.equal(M.equal({n:1,d:2},{n:2,d:3}),false);
});
test('분모가 다른 덧셈·뺄셈에 공통 분모를 사용한다',()=>{
  assert.deepEqual(M.strip({n:1,d:2},{n:1,d:4}),{denominator:4,first:2,second:1});
  assert.deepEqual(M.add({n:1,d:2},{n:1,d:4}),{n:3,d:4});
  assert.deepEqual(M.add({n:1,d:3},{n:1,d:6}),{n:1,d:2});
  assert.deepEqual(M.subtract({n:3,d:4},{n:1,d:2}),{n:1,d:4});
});
test('넓이 곱셈과 가분수 묶기',()=>{
  assert.deepEqual(M.multiply({n:1,d:2},{n:2,d:3}),{n:1,d:3});
  assert.deepEqual(M.multiply({n:3,d:4},{n:2,d:3}),{n:1,d:2});
  assert.deepEqual(M.mixed(5,4),{whole:1,remainder:1,denominator:4});
  assert.deepEqual(M.mixed(8,4),{whole:2,remainder:0,denominator:4});
});
test('올바르지 않은 분수를 묵인하지 않는다',()=>{
  assert.throws(()=>M.reduce(1,0),RangeError);
  assert.throws(()=>M.subtract({n:1,d:4},{n:1,d:2}),RangeError);
  assert.throws(()=>M.resample([true,false],0),RangeError);
});
test('교사도구에 등록되고 자유 실험·도전 화면 요소가 존재한다',()=>{
  const root=path.resolve(__dirname,'..');
  const catalog=fs.readFileSync(path.join(root,'tools-catalog.js'),'utf8');
  const html=fs.readFileSync(path.join(root,'분수 실험실 심화.html'),'utf8');
  assert.match(catalog,/name:\s*"분수 실험실"/);
  assert.match(catalog,/href:\s*"분수 실험실.html"/);
  assert.match(fs.readFileSync(path.join(root,'분수 실험실.html'),'utf8'),/분수 실험실 심화.html/);
  assert.match(html,/fraction-lab-math.js/);
  assert.match(html,/fraction-lab-classroom.js/);
  assert.match(html,/교사 출제/);
  assert.match(html,/button\('split'/);
  assert.match(html,/function startChallenge/);
  assert.match(html,/function check\(/);
  assert.match(html,/areaModel\(/);
});

test('화면 조작과 도전 성공 흐름을 가상 DOM에서 회귀 검증한다',()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'../분수 실험실 심화.html'),'utf8');
  const script=html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/)?.[1];
  assert.ok(script,'인라인 화면 코드가 있어야 합니다.');
  const handlers={},elements={};
  const document={
    getElementById(id){return elements[id]||(elements[id]={innerHTML:'',value:''});},
    addEventListener(name,callback){handlers[name]=callback;},
    querySelector(){return null;}
  };
  const data=new Map();
  const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  vm.runInNewContext(script,{window:{FractionLabMath:M,FractionLabClassroom:C},document,localStorage,MouseEvent:function(){}},{timeout:3000});
  const click=(action,value,index)=>{
    const target={dataset:{action,value,index},closest(){return this;}};
    handlers.click({target});
  };
  const change=(field,value)=>handlers.change({target:{dataset:{field},value}});
  assert.match(elements.stage.innerHTML,/1\/4/);
  click('split');
  assert.match(elements.stage.innerHTML,/2\/8/);
  change('den',3);
  assert.match(elements.stage.innerHTML,/정확히 옮길 수 없어요/);
  click('undo');
  assert.match(elements.stage.innerHTML,/1\/4/);
  click('topic','add');
  assert.match(elements.stage.innerHTML,/덧셈 연구/);
  click('operation','subtract');
  assert.match(elements.stage.innerHTML,/뺄셈 연구/);
  click('topic','product');
  assert.match(elements.stage.innerHTML,/area-grid/);
  click('topic','mixed');
  assert.match(elements.stage.innerHTML,/1과 1\/4/);
  click('mode','explore');
  click('piece',undefined,0);
  click('check');
  assert.match(elements.stage.innerHTML,/정답입니다!/);
  click('next');
  assert.match(elements.controls.innerHTML,/도전 2 \/ 4/);
});

test('교사 출제: 정확한 덧셈·뺄셈 정답, 교육과정 분모 제한, 저장 검증',()=>{
 const add=C.composeQuestion({type:'add',a:[1,2],b:[1,4],text:'서로 다른 분모로 덧셈하기',grade:4});
 assert.deepEqual({n:add.n,d:add.d},{n:3,d:4});
 const subtract=C.composeQuestion({type:'subtract',a:[3,4],b:[1,2],grade:5});
 assert.deepEqual({n:subtract.n,d:subtract.d},{n:1,d:4});
 assert.ok(C.composeQuestion({type:'subtract',a:[1,4],b:[1,2]}).error);
 assert.ok(C.composeQuestion({type:'add',a:[0,4],b:[1,4]}).error);
 assert.ok(C.composeQuestion({type:'add',a:[1,0],b:[1,4]}).error);
 assert.ok(C.composeQuestion({type:'add',a:[1,5],b:[1,4]}).error);
 const saved=new Map();
 const store={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 C.writeQuestions(store,[add,subtract]);
 const loaded=C.readQuestions(store);
 assert.equal(loaded.length,2);
 assert.deepEqual(loaded.map(x=>x.n+'/'+x.d),['3/4','1/4']);
 assert.throws(()=>C.writeQuestions(store,Array.from({length:41},()=>add)),RangeError);
 assert.deepEqual(C.readQuestions({getItem(){return '{not-json';}}),[]);
 assert.ok(C.readQuestions(store).every(x=>x.text.length<=120));
});
test('조각 이동: 순서와 중복을 검증하고 공통 분모를 유지한다',()=>{
 const add=C.composeQuestion({type:'add',a:[1,2],b:[1,4]});
 const totals=C.commonParts(add);
 assert.deepEqual(totals,{denominator:4,first:2,second:1});
 let progress=C.freshTransfer(add);
 assert.equal(progress.converted,false);
 assert.equal(C.movePiece(add,progress,'a',0),null);
 progress={...progress,converted:true};
 progress=C.movePiece(add,progress,'a',0);
 assert.equal(C.movePiece(add,progress,'a',0),null);
 progress=C.movePiece(add,progress,'a',1);
 progress=C.movePiece(add,progress,'b',0);
 assert.equal(C.transferStatus(add,progress).finished,true);
 assert.equal(C.transferStatus(add,progress).filled,3);
 assert.equal(C.movePiece(add,progress,'b',1),null);
 progress=C.undoMove(add,progress,'b',0);
 assert.equal(C.transferStatus(add,progress).finished,false);
 const minus=C.composeQuestion({type:'subtract',a:[3,4],b:[1,2]});
 let sub={...C.freshTransfer(minus),converted:true};
 assert.equal(C.movePiece(minus,sub,'a',0),null);
 sub=C.movePiece(minus,sub,'b',0);
 sub=C.movePiece(minus,sub,'b',1);
 assert.equal(C.transferStatus(minus,sub).filled,1);
 assert.equal(C.transferStatus(minus,sub).finished,true);
});
test('교사 출제→학생 조각 이동→검수·삭제를 가상 화면으로 검증한다',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../분수 실험실 심화.html'),'utf8');
 const script=html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/)?.[1];
 assert.ok(script);
 const events={},elements={},saved=new Map();
 const document={
  getElementById(id){return elements[id]||(elements[id]={innerHTML:'',value:''});},
  addEventListener(name,cb){events[name]=cb;},
  querySelector(){return null;}
 };
 const localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 vm.runInNewContext(script,{window:{FractionLabMath:M,FractionLabClassroom:C},document,localStorage,MouseEvent:function(){}},{timeout:3000});
 const click=(action,data={})=>events.click({target:{dataset:{action,...data},closest(){return this;}}});
 const teach=(field,value)=>events.change({target:{dataset:{teacher:field},value}});
 click('mode',{value:'calc'});
 assert.match(elements.stage.innerHTML,/덧셈 조각 합치기/);
 click('transferPiece',{source:'a',index:'0'});
 click('transferPiece',{source:'b',index:'0'});
 click('transferPiece',{source:'b',index:'1'});
 click('check');
 assert.match(elements.stage.innerHTML,/정답입니다!/);
 assert.match(elements.controls.innerHTML,/성공 1문제/);
 click('undoTransfer');
 click('transferPiece',{source:'b',index:'1'});
 click('check');
 assert.match(elements.controls.innerHTML,/성공 1문제/); // 정답 재확인 후 중복 득점 불가
 click('mode',{value:'teacher'});
 teach('operation','subtract');
 teach('aD',4);teach('aN',3);teach('bD',2);teach('bN',1);
 elements.teacherText={value:'내가 만든 분수 문제'};
 click('saveTeacher');
 assert.match(elements.stage.innerHTML,/학생 문제 시작/);
 const question=JSON.parse([...saved.values()][0])[0];
 assert.equal(question.n,1);
 assert.equal(question.d,4);
 click('playTeacher',{id:question.id});
 assert.match(elements.stage.innerHTML,/뺄셈 조각 빼기/);
 click('convertTransfer');
 click('transferPiece',{source:'b',index:'0'});
 click('transferPiece',{source:'b',index:'1'});
 click('check');
 assert.match(elements.stage.innerHTML,/정답입니다!/);
 click('mode',{value:'teacher'});
 click('deleteTeacher',{id:question.id});
 assert.equal(JSON.parse([...saved.values()][0]).length,1);
 click('confirmDeleteTeacher',{id:question.id});
 assert.equal(JSON.parse([...saved.values()][0]).length,0);
});
