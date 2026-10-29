const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','반 편성 도우미.html'),'utf8');
const api={};vm.createContext(api);vm.runInContext('function hasStudyScore(s){return Number.isFinite(s.level)&&s.level>=0}\n'+html.slice(html.indexOf('function validateAssignment('),html.indexOf('/* ENGINE_END */'))+'\n'+html.slice(html.indexOf('/* SEPARATION_BASKETS_START'),html.indexOf('/* SEPARATION_BASKETS_END */'))+'\n'+html.slice(html.indexOf('/* MOVE_REVIEW_START'),html.indexOf('/* MOVE_REVIEW_END */')),api);
function seed(n){return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296)}
function pupils(n){return Array.from({length:n},(_,i)=>({id:'s'+i,name:'학생'+i,gender:i%2?'남':'여',level:100-i,oldClass:(i%3+1)+'반',traits:[],fixed:0}))}
function objective(list,assign,k,caps,soft){return api.preferencePenalty(list,assign,k,caps,soft)}
function checkHard(list,pairs,c,k){assert.equal(Object.keys(c.assign).length,list.length);assert.equal(api.validateAssignment(list,pairs,c.assign,{}).length,0);const counts=Array.from({length:k},(_,i)=>list.filter(s=>c.assign[s.id]===i+1).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1,counts.join(','))}
test('상한 합계를 1~2명 넘겨도 중단하지 않고 초과를 균등하게 최소화',()=>{
 for(const n of [7,8]){const list=pupils(n);list.forEach(s=>s.traits=['특수']);const out=api.generateCandidates(list,[],3,['특수'],seed(n),{특수:2});assert.ok(out.candidates?.length,out.error);for(const c of out.candidates){checkHard(list,[],c,3);assert.equal(objective(list,c.assign,3,{특수:2},[]).total,n-6);assert.equal(objective(list,c.assign,3,{특수:2},[]).square,n-6)}}
});
test('5인 바구니: 2·3·4·5개 반에 가장 적은 겹침으로 배정, 6번째 추가는 UI에서 차단',()=>{
 const list=pupils(10),soft=api.buildBasketPairs([],[{members:list.slice(0,5).map(s=>s.id)}]);
 for(const [k,min] of [[2,4],[3,2],[4,1],[5,0]]){const out=api.generateCandidates(list,[],k,[],seed(k),{},soft);assert.ok(out.candidates?.length,out.error);for(const c of out.candidates){checkHard(list,[],c,k);assert.equal(objective(list,c.assign,k,{},soft).total,min)}}
 assert.match(html,/if\(basket.members.length>=5\)/);assert.match(html,/b.members.length>=5\?'disabled'/);assert.ok(html.includes('${b.members.length} / 5명'));
});
test('교사 고정으로 상한을 넘겨도 고정을 보존하고 추가 초과는 만들지 않는다',()=>{
 const list=pupils(12);list.slice(0,4).forEach((s,i)=>{s.traits=['특수'];if(i<3)s.fixed=1});const out=api.generateCandidates(list,[],3,['특수'],seed(90),{특수:2});assert.ok(out.candidates?.length,out.error);
 for(const c of out.candidates){checkHard(list,[],c,3);assert.equal(objective(list,c.assign,3,{특수:2},[]).total,1);assert.equal(c.assign.s0,1);assert.notEqual(c.assign.s3,1)}
});
test('직접 지정한 분리 관계는 바구니 선호보다 우선하며 고정 충돌은 거부',()=>{
 const list=pupils(8),hard=[{a:'s0',b:'s1'}],soft=api.buildBasketPairs([],[{members:['s0','s1','s2','s3','s4']}]);
 const out=api.generateCandidates(list,hard,2,[],seed(4),{},soft);assert.ok(out.candidates?.length,out.error);for(const c of out.candidates)checkHard(list,hard,c,2);
 list[0].fixed=1;list[1].fixed=1;assert.match(api.generateCandidates(list,hard,2,[],seed(4),{},soft).error,/분리 조건/);
});
test('짝수로 나누어 떨어지지 않는 명단의 고정 정원과 0명 제한을 처리',()=>{
 const list=pupils(7);list.slice(0,3).forEach(s=>s.fixed=1);list[0].traits=['운동부'];
 const out=api.generateCandidates(list,[],3,['운동부'],seed(7),{운동부:0});assert.ok(out.candidates?.length,out.error);checkHard(list,[],out.candidates[0],3);assert.equal(objective(list,out.candidates[0].assign,3,{운동부:0},[]).total,1);
});
function brute(list,hard,k,caps,soft){
 const assign={},counts=Array(k).fill(0),floor=Math.floor(list.length/k),ceil=Math.ceil(list.length/k);let best={total:Infinity,square:Infinity};
 function visit(i){if(i===list.length){if(counts.some(n=>n<floor)||api.validateAssignment(list,hard,assign,{}).length)return;const p=objective(list,assign,k,caps,soft);if(api.preferenceLess(p,best))best=p;return}
 const s=list[i];for(let c=1;c<=k;c++){if(counts[c-1]>=ceil||(s.fixed&&s.fixed!==c))continue;assign[s.id]=c;counts[c-1]++;if(!hard.some(p=>assign[p.a]&&assign[p.a]===assign[p.b]))visit(i+1);counts[c-1]--;delete assign[s.id]}}
 visit(0);return best;
}
test('작은 명단 24종: 겹치는 항목·바구니·고정·직접 분리의 전수 최적값과 일치',()=>{
 for(let run=1;run<=24;run++){
  const random=seed(run),list=pupils(8),k=run%2+2,caps={A:run%3,B:1},hard=run%4===0?[{a:'s0',b:'s1'}]:[];
  for(const s of list)s.traits=['A','B'].filter(()=>random()<.55);if(run%3===0)list[0].fixed=1;
  const baskets=[{members:['s0','s1','s2','s3','s4']},{members:['s2','s5','s6']}],soft=api.buildBasketPairs([],baskets).filter(p=>!hard.some(h=>[h.a,h.b].sort().join() === [p.a,p.b].sort().join()));
  const expected=brute(list,hard,k,caps,soft),out=api.generateCandidates(list,hard,k,['A','B'],random,caps,soft);assert.ok(out.candidates?.length,out.error);
  for(const c of out.candidates){checkHard(list,hard,c,k);const p=objective(list,c.assign,k,caps,soft);assert.equal(p.total,expected.total,'total seed '+run);assert.equal(p.square,expected.square,'spread seed '+run)}
 }
});
test('1000명·12반·40개 5인 바구니에서도 누락 없이 제한 합계의 최소 초과만 허용',()=>{
 const list=pupils(1000);list.forEach((s,i)=>{s.traits=i<49?['특수']:[]});const soft=api.buildBasketPairs([],Array.from({length:40},(_,i)=>({members:list.slice(i*5,i*5+5).map(s=>s.id)})));
 const begin=Date.now(),out=api.generateCandidates(list,[],12,['특수'],seed(500),{특수:4},soft);assert.ok(out.candidates?.length,out.error);for(const c of out.candidates){checkHard(list,[],c,12);assert.equal(objective(list,c.assign,12,{특수:4},soft).total,1)}assert.ok(Date.now()-begin<10000,'large roster bounded');
});
test('이미 초과가 있는 결과도 초과를 늘리지 않는 수동 이동을 허용',()=>{
 const list=pupils(8);list.forEach(s=>s.traits=['특수']);const assign={s0:1,s1:1,s2:1,s3:2,s4:2,s5:2,s6:3,s7:3};
 const before=JSON.stringify(assign),result=api.reviewStudentMove(list,[],assign,3,['특수'],{특수:2},'s0',3,false);
 assert.equal(result.ok,true);assert.equal(JSON.stringify(assign),before);
 assert.equal(api.reviewStudentMove(list,[],assign,3,['특수'],{특수:2},'s6',1,false).ok,false);
});
