const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../class-planner-diagnostics.js'),'utf8');
function check(input){const scope={};vm.createContext(scope);vm.runInContext(source,scope);return scope.analyzePlannerConstraints(input)}
const p=(id,fixed=0,traits=[])=>({id,name:'학생'+id,oldClass:'1',number:id,fixed,traits});
const has=(result,code)=>result.blocking.some(item=>item.code.startsWith(code));
test('서로 분리할 학생이 같은 반에 고정된 충돌',()=>{
 const a=check({students:[p('a',1),p('b',1),p('c')],separations:[{a:'a',b:'b'}],classCount:2});
 assert.ok(has(a,'fixed-pair'));assert.match(a.blocking[0].message,/학생a/);
});
test('쌍생아가 서로 다른 반 고정 및 내부 분리',()=>{
 const a=check({students:[p('a',1),p('b',2),p('c'),p('d')],together:[{a:'a',b:'b'}],separations:[{a:'a',b:'b'}],classCount:2});
 assert.ok(has(a,'twin-fixed'));assert.ok(has(a,'same-and-apart'));
});
test('간접 같은 반 A=B=B=C에서 A≠C 충돌',()=>{
 const a=check({students:[p('a'),p('b'),p('c'),p('d')],together:[{a:'a',b:'b'},{a:'b',b:'c'}],separations:[{a:'a',b:'c'}],classCount:2});
 assert.ok(has(a,'same-and-apart'));assert.ok(has(a,'twin-capacity'));
});
test('묶음이 반별 목표 상한 초과',()=>{
 assert.ok(has(check({students:[p('a'),p('b'),p('c'),p('d')],together:[{a:'a',b:'b'},{a:'b',b:'c'}],classCount:2}),'twin-capacity'));
});
test('고정 배정 합계가 목표 상한 초과',()=>{
 assert.ok(has(check({students:[p('a',1),p('b',1),p('c',1),p('d')],classCount:2}),'room-over'));
});
test('모든 반을 분리 대상 고정 학생이 차지하는 경우',()=>{
 assert.ok(has(check({students:[p('a',1),p('b',2),p('c'),p('d')],separations:[{a:'a',b:'c'},{a:'b',b:'c'}],classCount:2}),'no-room'));
});
test('묶음도 분리 관계에서 한 정점으로 처리',()=>{
 assert.ok(has(check({students:[p('a'),p('b'),p('c',1),p('d',2),p('e'),p('f')],together:[{a:'a',b:'b'}],separations:[{a:'a',b:'c'},{a:'b',b:'d'}],classCount:2}),'no-room'));
});
test('2개 반에서는 삼각형 완전 분리 불가',()=>{
 assert.ok(has(check({students:[p('a'),p('b'),p('c'),p('d')],separations:[{a:'a',b:'b'},{a:'b',b:'c'},{a:'a',b:'c'}],classCount:2}),'separation-clique'));
});
test('유의사항 상한은 편성 불가가 아닌 선호 조건 안내',()=>{
 const a=check({students:[p('a',1,['특수']),p('b',1,['특수']),p('c',0,['특수']),p('d')],classCount:2,capRules:{'특수':1}});
 assert.ok(a.advisory.some(x=>x.code==='cap-total-특수'));assert.ok(a.advisory.some(x=>x.code==='cap-fixed-특수-0'));
 assert.equal(a.blocking.length,0);
});
test('유의사항 없고 고정 해제면 잘못된 충돌 보고 없음',()=>{
 const a=check({students:[p('a'),p('b')],classCount:2,capRules:{'특수':0}});
 assert.equal(a.advisory.length,0);assert.equal(a.blocking.length,0);
});
test('증명 못한 복잡한 경우는 불가능 단정하지 않음',()=>{
 const a=check({students:Array.from({length:20},(_,i)=>p(String(i))),separations:[{a:'0',b:'1'}],classCount:3});
 assert.equal(a.blocking.length,0);
});
test('잘못된 링크 무시·입력 변경 없음',()=>{
 const students=[p('a',1),p('b')],before=JSON.stringify(students);
 const a=check({students,separations:[{a:'a',b:'ghost'}],together:[{a:'b',b:'ghost'}],classCount:2});
 assert.equal(JSON.stringify(students),before);assert.equal(a.blocking.length,0);
});
test('UI 통합 연결 점검',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../반 편성 도우미.html'),'utf8');
 for(const re of [/id="checkConditions"/,/id="plannerDiagnosticReport"/,/class-planner-diagnostics\.js/,/renderPlannerDiagnostics\(\)/,/clearPlannerDiagnostics\(\)/])assert.match(html,re);
});
