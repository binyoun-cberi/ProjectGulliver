const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'반 편성 도우미.html'),'utf8');
function api(){const a={};vm.createContext(a);vm.runInContext('function hasStudyScore(s){return Number.isFinite(s.level)&&s.level>=0}\n'+html.slice(html.indexOf('function validateAssignment('),html.indexOf('/* ENGINE_END */'))+'\n'+html.slice(html.indexOf('/* STAGE_ZERO_START'),html.indexOf('/* STAGE_ZERO_END */'))+'\n'+fs.readFileSync(path.join(root,'class-planner-twins.js'),'utf8'),a);return a}
function fixture(a,reverse=false){const boys=[8,8,8,7,8,8],seen=Array(6).fill(0),assign={};return {assign,students:Array.from({length:103},(_,i)=>{const room=a.snakeClass(i,6,0)%6+1;assign['s'+i]=room;const boy=seen[room-1]++<boys[room-1];return {id:'s'+i,name:'학생'+i,gender:boy!==reverse?'남':'여',level:null,oldClass:'',traits:[],fixed:0}})}}
function stats(students,assign,k=6){return Array.from({length:k},(_,i)=>{const list=students.filter(st=>assign[st.id]===i+1);return {n:list.length,gap:list.filter(st=>st.gender==='여').length-list.filter(st=>st.gender==='남').length}})}
function seed(){let n=42;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296)}
test('47남·56여 103명: 7:10 집중을 1·1·1·2·2·2 차이로 분산하고 총원 차이는 2명 이하',()=>{
 const a=api(),{students:p,assign}=fixture(a),before=JSON.stringify(p);
 for(const reverse of [false,true]){
  const f=fixture(a,reverse),out=a.generateCandidates(f.students,[],6,[],seed());assert.ok(out.candidates?.length,out.error);
  const rows=stats(f.students,out.candidates[0].assign);
  assert.deepEqual(rows.map(r=>Math.abs(r.gap)).sort(),[1,1,1,2,2,2]);assert.deepEqual(rows.map(r=>r.n).sort((a,b)=>a-b),[16,17,17,17,18,18]);assert.equal(rows.reduce((n,r)=>n+r.n,0),103);
 }
 assert.equal(JSON.stringify(p),before);assert.deepEqual(stats(p,assign).map(r=>r.gap),[2,1,1,3,1,1]);
});
test('성비 중요도 0은 추가 인원 이동을 하지 않고 변경되지 않은 편성안을 반환',()=>{
 const a=api(),{students:p,assign}=fixture(a),candidate={assign,target:[18,17,17,17,17,17],score:0};
 assert.equal(a.polishGenderGap(p,[],6,[],{},[],candidate,{gender:0}),candidate);
 const out=a.generateCandidates(p,[],6,[],seed(),{},[],{gender:0});for(const c of out.candidates){const n=stats(p,c.assign).map(r=>r.n);assert.ok(Math.max(...n)-Math.min(...n)<=1)}
});
test('고정·개별 분리·쌍생아 동반/분리·유의사항 상한은 성비 보정에서도 유지',()=>{
 const a=api(),{students:p}=fixture(a);p[0].fixed=1;p[2].traits=['지원'];p[5].traits=['지원'];
 const pairs=[{a:'s0',b:'s2'}],groups=[{id:'twins',members:['s0','s1','s2'],rules:[{a:'s0',b:'s1',mode:'together'},{a:'s1',b:'s2',mode:'apart'}]}];
 const out=a.generateTwinCandidates(p,pairs,6,['지원'],seed(),{지원:1},[],groups,{gender:5});assert.ok(out.candidates?.length,out.error);
 for(const c of out.candidates){assert.equal(c.assign.s0,1);assert.equal(c.assign.s1,1);assert.notEqual(c.assign.s2,1);assert.equal(a.validateAssignment(p,pairs,c.assign,{지원:1}).length,0);const n=stats(p,c.assign).map(r=>r.n);assert.ok(Math.max(...n)-Math.min(...n)<=2)}
});
test('반별 인원 참고 목표도 같은 차이 기준과 성별 미입력 총수를 보존',()=>{
 const a=api(),out=a.stageZeroTargets([{boys:47,girls:56,unknown:0}],6),gaps=Array.from(out.rows,r=>r.girls-r.boys);
 assert.deepEqual(gaps.sort(),[1,1,1,2,2,2]);assert.equal(out.rows.reduce((n,r)=>n+r.boys,0),47);assert.equal(out.rows.reduce((n,r)=>n+r.girls,0),56);
 const unknown=a.stageZeroTargets([{boys:0,girls:0,unknown:17}],6);assert.equal(unknown.rows.reduce((n,r)=>n+r.unknown,0),17);
});

test('학생 수가 적어도 성비를 맞추려고 비어 있는 반을 새로 만들지 않는다',()=>{
 const a=api(),p=Array.from({length:3},(_,i)=>({id:'small'+i,name:'학생'+i,gender:i?'여':'남',level:null,oldClass:'',traits:[],fixed:0}));
 const out=a.generateCandidates(p,[],3,[],seed());for(const c of out.candidates)assert.deepEqual(stats(p,c.assign,3).map(r=>r.n),[1,1,1]);
 const target=a.stageZeroTargets([{boys:1,girls:2,unknown:0}],3);assert.deepEqual(Array.from(target.rows,r=>r.boys+r.girls),[1,1,1]);
});
