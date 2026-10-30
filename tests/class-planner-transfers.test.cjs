const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'반 편성 도우미.html'),'utf8');
function api(){const a={};vm.createContext(a);vm.runInContext('function hasStudyScore(s){return Number.isFinite(s.level)&&s.level>=0}\n'+html.slice(html.indexOf('function validateAssignment('),html.indexOf('/* ENGINE_END */'))+'\n'+html.slice(html.indexOf('/* MOVE_REVIEW_START'),html.indexOf('/* MOVE_REVIEW_END */'))+'\n'+fs.readFileSync(path.join(root,'class-planner-twins.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'class-planner-transfers.js'),'utf8'),a);return a}
const pupils=()=>Array.from({length:12},(_,i)=>({id:'s'+i,name:'학생'+i,oldClass:(i%3+1)+'반',gender:i%2?'남':'여',level:i*7,traits:[],fixed:0}));
const random=()=>{let n=42;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296)};
test('편성 전 전학은 명단 원본을 보존하면서 배정·고정·쌍생아·분리 관계 계산에서 제외',()=>{
 const a=api(),p=pupils();p[0].traits=['전학 예정'];p[0].transferTiming='before';p[0].fixed=1;p[0].name='';
 const out=a.generateTransferCandidates(p,[{a:'s0',b:'s1'}],3,[],random(),{},[],[{id:'g',members:['s0','s1'],rules:[{a:'s0',b:'s1',mode:'together'}]}]);
 assert.ok(out.candidates?.length,out.error);for(const c of out.candidates){assert.equal(c.assign.s0,undefined);assert.equal(Object.keys(c.assign).length,11)}assert.equal(p.length,12);assert.equal(p[0].fixed,1);
});
test('편성 후 전학은 성별·학습·기존 반·유의사항·바구니에서 중립이며 명시한 고정·분리는 유지',()=>{
 const a=api(),p=pupils();p[0]={...p[0],traits:['전학 예정','특수'],transferTiming:'after',gender:'남',level:99999,oldClass:'12반',fixed:1};
 const soft=[{a:'s0',b:'s1'}],first=a.generateTransferCandidates(p,[{a:'s0',b:'s1'}],3,['특수'],random(),{특수:0},soft,[]);
 const altered=p.map(st=>st.id==='s0'?{...st,gender:'여',level:0,oldClass:'1반',traits:['전학 예정','다문화']}:st),second=a.generateTransferCandidates(altered,[{a:'s0',b:'s1'}],3,['특수'],random(),{특수:0},soft,[]);
 assert.ok(first.candidates?.length,first.error);assert.deepEqual(JSON.parse(JSON.stringify(first)),JSON.parse(JSON.stringify(second)));
 for(const c of first.candidates){assert.equal(c.assign.s0,1);assert.notEqual(c.assign.s0,c.assign.s1)}
 assert.equal(p[0].level,99999);assert.equal(a.allocationSoftPairs(p,soft).length,0);
});
test('전학 예정 태그만 있으면 편성 후로 처리하며 전원 편성 전 전학은 빈 편성을 만들지 않는다',()=>{
 const a=api();assert.equal(a.studentTransferTiming({traits:['전학 예정']}),'after');assert.equal(a.studentTransferTiming({traits:[],transferTiming:'before'}),'');
 const p=pupils().map(st=>({...st,traits:['전학 예정'],transferTiming:'before'}));assert.match(a.generateTransferCandidates(p,[],3,[],random(),{},[],[]).error,/편성할 학생/);
});
