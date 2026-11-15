const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const compare=fs.readFileSync(path.join(root,'class-planner-candidate-compare.js'),'utf8');
const source=fs.readFileSync(path.join(root,'class-planner-saved-plans.js'),'utf8');
const html=fs.readFileSync(path.join(root,'반 편성 도우미.html'),'utf8');
function api(){const scope={};vm.createContext(scope);vm.runInContext(compare+'\n'+source,scope);return scope}
const pupil=(id,oldClass='1',fixed=0)=>({id,name:'학생'+id,oldClass,gender:id==='a'?'남':'여',level:50,traits:[],fixed});
const pupils=[pupil('a'),pupil('b'),pupil('c','2'),pupil('d','2')];
const oldAssign={a:1,b:1,c:2,d:2};
const newAssign={a:2,b:1,c:2,d:2};
const snap=(assign=oldAssign)=>({id:'save-1',name:'협의 1차',createdAt:'2026-11-15T01:00:00.000Z',classCount:2,assign,target:[2,2]});
test('기존 페이지 로드와 저장 데이터 정규화·결과 패널 연결',()=>{
 for(const mark of ['id="savedPlanPanel"','id="saveCurrentPlan"','id="savedPlansList"','id="savedPlanComparison"','class-planner-saved-plans.js','class-planner-saved-plans.css'])assert.ok(html.includes(mark),mark);
 assert.match(html,/savedPlans:normalizePlannerSavedPlans\(raw.savedPlans\)/);
 assert.match(html,/savedPlans:\[\]/);assert.match(html,/renderSavedPlanPanel\(\);renderPlannerDiagnostics/);
 assert.match(html,/installSavedPlanControls\(\)/);
});
test('이전 백업에는 보관 정보 없어도 빈 배열',()=>{
 assert.equal(api().normalizePlannerSavedPlans(undefined).length,0);
});
test('보관 이름, 날짜, 배정·목표 보존 및 낯선 데이터 제거',()=>{
 const value=api().normalizePlannerSavedPlans([snap(),{id:'bad',classCount:2,assign:{a:10}},snap()]);
 assert.equal(value.length,1);assert.equal(value[0].name,'협의 1차');assert.equal(value[0].assign.a,1);
 assert.equal(value[0].target.length,2);
});
test('명단이 1000명 넘거나 반 수가 잘못된 백업은 거부',()=>{
 const big=Object.fromEntries(Array.from({length:1001},(_,i)=>['s'+i,1]));
 assert.equal(api().normalizePlannerSavedPlans([{id:'a',classCount:2,assign:big},{id:'b',classCount:0,assign:{x:1}}]).length,0);
});
test('보관함은 최근 12개까지만 로드',()=>{
 const plans=Array.from({length:15},(_,i)=>({...snap(),id:'p'+i}));
 const list=api().normalizePlannerSavedPlans(plans);
 assert.equal(list.length,12);assert.equal(list[0].id,'p3');assert.equal(list[11].id,'p14');
});
test('정확히 같은 학생 ID와 반 수에서만 비교·복원 허용',()=>{
 const p=api();assert.equal(p.plannerPlanRosterMatches(snap(),pupils,2),true);
 assert.equal(p.plannerPlanRosterMatches(snap(),pupils,3),false);
 assert.equal(p.plannerPlanRosterMatches(snap(),pupils.slice(1),2),false);
 assert.equal(p.plannerPlanRosterMatches(snap(),[...pupils,pupil('e')],2),false);
});
test('학생 이름이 바뀌어도 동일 ID의 보관한 안 비교 가능',()=>{
 const p=api(),changed=pupils.map(x=>({...x,name:'수정'+x.name}));
 assert.equal(p.plannerPlanRosterMatches(snap(),changed,2),true);
});
test('한 명이 다른 반이 된 결과와 균형 변화',()=>{
 const diff=api().plannerPlanDiff(snap(),{assign:newAssign},pupils,2);
 assert.equal(diff.changes.length,1);
 assert.equal(diff.changes[0].id,'a');assert.equal(diff.changes[0].from,2);assert.equal(diff.changes[0].to,1);
 assert.equal(diff.stored.countGap,0);assert.equal(diff.current.countGap,2);
});
test('현재 후보가 없을 때에도 보관된 안 지표 확인 가능',()=>{
 const diff=api().plannerPlanDiff(snap(),null,pupils,2);
 assert.equal(diff.current,null);assert.equal(diff.changes.length,0);
});
test('잘못된 명단이면 복원 차단',()=>{
 const errors=api().plannerPlanRestoreProblems(snap(),pupils.slice(1),2,[],[],()=>[],()=>[]);
 assert.match(errors[0],/학생 구성/);
});
test('현행 고정/분리 및 쌍생아 규칙을 검증하는 복원 보호',()=>{
 const p=api();
 const rule=(students,pairs,assign)=>students.filter(s=>s.fixed&&assign[s.id]!==s.fixed).map(s=>'고정 충돌');
 const errors=p.plannerPlanRestoreProblems(snap(),[pupil('a','1',2),...pupils.slice(1)],2,[],[],rule,()=>[]);
 assert.deepEqual([...errors],['고정 충돌']);
 const twin=p.plannerPlanRestoreProblems(snap(),pupils,2,[],[],()=>[],()=>['쌍생아 충돌']);
 assert.deepEqual([...twin],['쌍생아 충돌']);
});
test('저장 스냅샷은 새 학생 정보를 복제하지 않고 ID별 배정만 포함',()=>{
 const normalized=api().normalizePlannerSavedPlans([snap()]);
 const plain=JSON.stringify(normalized);
 assert.equal(plain.includes('학생a'),false);
 assert.ok(!('students' in normalized[0]));
});
