'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('../fraction-lab-math.js');

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
  const html=fs.readFileSync(path.join(root,'분수 실험실.html'),'utf8');
  assert.match(catalog,/name:\s*"분수 실험실"/);
  assert.match(catalog,/href:\s*"분수 실험실.html"/);
  assert.match(html,/fraction-lab-math.js/);
  assert.match(html,/button\('split'/);
  assert.match(html,/function startChallenge/);
  assert.match(html,/function check\(/);
  assert.match(html,/areaModel\(/);
});

test('화면 조작과 도전 성공 흐름을 가상 DOM에서 회귀 검증한다',()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'../분수 실험실.html'),'utf8');
  const script=html.match(/<script>\\s*([\\s\\S]*?)<\\/script>\\s*<\\/body>/)?.[1];
  assert.ok(script,'인라인 화면 코드가 있어야 합니다.');
  const handlers={},elements={};
  const document={
    getElementById(id){return elements[id]||(elements[id]={innerHTML:''});},
    addEventListener(name,callback){handlers[name]=callback;},
    querySelector(){return null;}
  };
  vm.runInNewContext(script,{window:{FractionLabMath:M},document,MouseEvent:function(){}},{timeout:3000});
  const click=(action,value,index)=>{
    const target={dataset:{action,value,index},closest(){return this;}};
    handlers.click({target});
  };
  const change=(field,value)=>handlers.change({target:{dataset:{field},value}});
  assert.match(elements.stage.innerHTML,/1\\/4/);
  click('split');
  assert.match(elements.stage.innerHTML,/2\\/8/);
  change('den',3);
  assert.match(elements.stage.innerHTML,/정확히 옮길 수 없어요/);
  click('undo');
  assert.match(elements.stage.innerHTML,/1\\/4/);
  click('topic','add');
  assert.match(elements.stage.innerHTML,/덧셈 연구/);
  click('operation','subtract');
  assert.match(elements.stage.innerHTML,/뺄셈 연구/);
  click('topic','product');
  assert.match(elements.stage.innerHTML,/area-grid/);
  click('topic','mixed');
  assert.match(elements.stage.innerHTML,/1과 1\\/4/);
  click('mode','explore');
  click('piece',undefined,0);
  click('check');
  assert.match(elements.stage.innerHTML,/정답입니다!/);
  click('next');
  assert.match(elements.controls.innerHTML,/도전 2 \\/ 4/);
});
