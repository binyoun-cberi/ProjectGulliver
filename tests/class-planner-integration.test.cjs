const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'반 편성 도우미.html'),'utf8');
const catalog=fs.readFileSync(path.join(root,'tools-catalog.js'),'utf8');
const start=html.indexOf('function validateAssignment(');
const end=html.indexOf('/* ENGINE_END */');
function engine(){
 assert.ok(start>0&&end>start,'순수 편성 엔진을 찾을 수 있어야 함');
 const scope={};vm.createContext(scope);vm.runInContext('function hasStudyScore(s){return Number.isFinite(s.level)&&s.level>=0}\n'+html.slice(start,end),scope);return scope;
}
function seed(n){let value=n|0;return()=>((value=Math.imul(1664525,value)+1013904223|0)>>>0)/4294967296}
function students(N){return Array.from({length:N},(_,i)=>({id:'student-'+i,name:'학생'+i,oldClass:String(i%4+1),gender:i%2?'여':'남',level:i%5+1,traits:i%4===0?['학습 지원']:[],fixed:0}));}
test('클라시트 교사 도구에 반 편성이 등록되고 분류가 유지됨',()=>{
 const ctx={window:{}};vm.runInNewContext(catalog,ctx);
 const t=ctx.window.ClassroomTools.find(x=>x.href==='반 편성 도우미.html');
 assert.ok(t);assert.equal(t.category,'뽑기·편성');assert.match(t.name,/반 편성/);
 assert.ok(html.includes('gulliver-app-shell.js'));
 assert.ok(html.includes('clasheet-mark.svg'));
});
test('내장 스크립트 문법과 인쇄/명단 입출력 구성',()=>{
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length);for(const match of scripts)new vm.Script(match[1]);
 for(const name of ['exportCsv','saveJson','openJson','generate','pairA','pairB'])assert.ok(html.includes('id="'+name+'"'),name);
 assert.match(html,/function csvCell\(x\)\{let s=/);
});
for(const n of [12,36,60,100])test(n+'명 자동 편성: 분리 조건 및 인원 균형 유지',()=>{
 const api=engine(),people=students(n),pairs=[{a:'student-0',b:'student-1'},{a:'student-0',b:'student-2'},{a:'student-3',b:'student-4'}];
 const output=api.generateCandidates(people,pairs,n<20?2:3,['학습 지원'],seed(1234));
 assert.ok(output.candidates?.length,output.error);
 for(const candidate of output.candidates){
  assert.equal(api.validateAssignment(people,pairs,candidate.assign).length,0);
  const counts=Array(n<20?2:3).fill(0);for(const s of people)counts[candidate.assign[s.id]-1]++;
  assert.ok(Math.max(...counts)-Math.min(...counts)<=2,counts.join(','));
 }
});
test('고정 반이 서로 충돌할 때 자동 편성을 거부함',()=>{
 const api=engine(),people=students(4);people[0].fixed=1;people[1].fixed=1;
 const result=api.generateCandidates(people,[{a:people[0].id,b:people[1].id}],2,[],seed(13));
 assert.match(result.error,/분리 조건/);
});
test('동명이인에게 개별 학생 ID를 부여할 수 있음',()=>{
 const api=engine(),people=students(12);people[0].name=people[1].name;
 const p=[{a:people[0].id,b:people[1].id}];const result=api.generateCandidates(people,p,3,[],seed(52));
 assert.ok(result.candidates?.length);for(const item of result.candidates)assert.notEqual(item.assign[people[0].id],item.assign[people[1].id]);
});

test('재현: 100명 4개 반, 여러 분리 관계와 20% 반 고정도 편성 가능한 경우는 찾아낸다',()=>{
 const E=engine(),n=100,k=4,rng=seed(3810),people=students(n);
 for(let i=0;i<Math.floor(n*.2);i++){const j=Math.floor(rng()*n);people[j].fixed=j%k+1;}
 const pairs=[],seen=new Set();
 for(let t=0;t<n*3;t++){
  let a=Math.floor(rng()*n),b=Math.floor(rng()*n);
  if(a%k===b%k||a===b)continue;
  const key=[a,b].sort((x,y)=>x-y).join('-');if(seen.has(key))continue;seen.add(key);
  pairs.push({a:people[a].id,b:people[b].id});
 }
 const outcome=E.generateCandidates(people,pairs,k,['학습 지원'],rng);
 assert.ok(outcome.candidates?.length,outcome.error);
 for(const candidate of outcome.candidates){
  assert.equal(E.validateAssignment(people,pairs,candidate.assign).length,0);
  const counts=Array(k).fill(0);for(const pupil of people)counts[candidate.assign[pupil.id]-1]++;
  assert.ok(Math.max(...counts)-Math.min(...counts)<=2);
 }
});
for(const [N,k] of [[150,5],[300,6],[500,10],[1000,10]]){
 test('대규모 '+N+'명 '+k+'개 반: 분리 조건과 반별 인원 보존',()=>{
  const E=engine(),rng=seed(2600+N),people=students(N);
  for(let i=0;i<Math.floor(N*.1);i++){const j=Math.floor(rng()*N);people[j].fixed=j%k+1;}
  const pairs=[],seen=new Set();
  for(let t=0;t<N;t++){const a=Math.floor(rng()*N),b=Math.floor(rng()*N);if(a%k===b%k||a===b)continue;const sig=[a,b].sort((x,y)=>x-y).join('-');if(seen.has(sig))continue;seen.add(sig);pairs.push({a:people[a].id,b:people[b].id});}
  const result=E.generateCandidates(people,pairs,k,['학습 지원'],rng);
  assert.ok(result.candidates?.length,result.error);
  for(const c of result.candidates){
   assert.equal(E.validateAssignment(people,pairs,c.assign).length,0);
   const count=Array(k).fill(0);people.forEach(p=>count[c.assign[p.id]-1]++);
   assert.ok(Math.max(...count)-Math.min(...count)<=1);
  }
 });
}

test('학습지표의 0.00, 소수점, 미입력과 옛 데이터 변환',()=>{
 const a=html.indexOf('function parseStudyScore('),b=html.indexOf('function hasStudyScore(',a);
 assert.ok(a>0&&b>a);
 const scope={};vm.createContext(scope);vm.runInContext(html.slice(a,b),scope);
 assert.equal(scope.parseStudyScore('0.00'),0);
 assert.equal(scope.parseStudyScore('83.75'),83.75);
 assert.equal(scope.parseStudyScore('92.126'),92.13);
 assert.equal(scope.parseStudyScore(''),null);
 assert.equal(scope.parseStudyScore(-1),null);
 assert.equal(scope.parseStudyScore(0,true),null);
 assert.equal(scope.parseStudyScore(3,true),3);
 for(const item of ['다문화','특수','쌍생아','분리조치','운동부','교권침해','성 사안','범법','연애관계','사회성'])assert.ok(html.includes(item));
 assert.match(html,/id="rosterHead"/);
 assert.match(html,/학습지표, 소수점 둘째 자리/);
});
test('실제 점수 0.00과 90.75가 포함된 편성 점수는 유한하며 분리조건 위반 없음',()=>{
 const api=engine(),people=students(36);
 people[0].level=0;people[1].level=90.75;people[2].level=null;
 const pairs=[{a:people[0].id,b:people[1].id}];
 const result=api.generateCandidates(people,pairs,3,['사회성'],seed(1978));
 assert.ok(result.candidates?.length,result.error);
 for(const c of result.candidates){
  assert.ok(Number.isFinite(c.score));
  assert.equal(api.validateAssignment(people,pairs,c.assign).length,0);
 }
});

test('학습지표 내림차순으로 3개 반 왕복 지그재그 순서를 정확히 지킨다',()=>{
 const E=engine(),list=Array.from({length:12},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:100-i,traits:[],fixed:0}));
 const out=E.generateCandidates(list,[],3,[],seed(12),{});
 assert.ok(out.candidates?.length,out.error);
 assert.deepEqual(list.map(s=>out.candidates[0].assign[s.id]),[1,2,3,3,2,1,1,2,3,3,2,1]);
});
test('4개 반 지그재그와 점수 미입력 마지막, 동점은 명단 순서 유지',()=>{
 const E=engine(),list=Array.from({length:16},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:i>13?null:100-Math.floor(i/2),traits:[],fixed:0}));
 const out=E.generateCandidates(list,[],4,[],seed(72),{});
 assert.ok(out.candidates?.length,out.error);
 assert.deepEqual(list.map(s=>out.candidates[0].assign[s.id]),[1,2,3,4,4,3,2,1,1,2,3,4,4,3,2,1]);
});
test('유의 사항별 반당 최대 인원을 초과하지 않으며 0명 제한도 적용',()=>{
 const E=engine(),list=Array.from({length:18},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:i%2?'여':'남',oldClass:String(i%3+1),level:99-i,traits:i%3===0?['사회성']:[],fixed:0}));
 const caps={'사회성':2,'운동부':0};
 const out=E.generateCandidates(list,[],3,['사회성','운동부'],seed(41),caps);
 assert.ok(out.candidates?.length,out.error);
 for(const c of out.candidates){
  assert.equal(E.validateAssignment(list,[],c.assign,caps).length,0);
  for(let room=1;room<=3;room++)assert.ok(list.filter(s=>c.assign[s.id]===room&&s.traits.includes('사회성')).length<=2);
 }
 list[0].traits.push('운동부');
 const unavoidable=E.generateCandidates(list,[],3,['사회성','운동부'],seed(41),caps);
 assert.ok(unavoidable.candidates?.length);assert.equal(E.preferencePenalty(list,unavoidable.candidates[0].assign,3,caps,[]).total,1);
});
test('총 학생 수가 반별 상한의 합을 넘으면 최소 초과로 배정',()=>{
 const E=engine(),list=Array.from({length:7},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:99-i,traits:['사회성'],fixed:0}));
 const out=E.generateCandidates(list,[],3,['사회성'],seed(4),{'사회성':2});
 assert.ok(out.candidates?.length,out.error);
 for(const c of out.candidates)assert.equal(E.preferencePenalty(list,c.assign,3,{'사회성':2},[]).total,1);
});
test('고정 반의 인원 상한을 넘으면 고정을 보존하며 초과를 최소화',()=>{
 const E=engine(),list=Array.from({length:12},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:99-i,traits:i<3?['사회성']:[],fixed:i<3?1:0}));
 const out=E.generateCandidates(list,[],3,['사회성'],seed(8),{'사회성':2});
 assert.ok(out.candidates?.length,out.error);assert.equal(E.preferencePenalty(list,out.candidates[0].assign,3,{'사회성':2},[]).total,1);
});

test('교사 우선 배치 5명을 유지하면서 남은 학생으로 학습지표 평균을 맞춘다',()=>{
 const E=engine(),list=Array.from({length:36},(_,i)=>({id:'pre'+i,name:'학생'+i,oldClass:String(i%3+1),gender:i%2?'남':'여',level:100-i,traits:[],fixed:i<5?1:0}));
 const result=E.generateCandidates(list,[],3,[],seed(215),{});
 assert.ok(result.candidates?.length,result.error);
 for(const c of result.candidates){
  for(let i=0;i<5;i++)assert.equal(c.assign[list[i].id],1,'교사 지정 배치 변경 금지');
  const averages=Array.from({length:3},(_,j)=>{
   const room=list.filter(st=>c.assign[st.id]===j+1);
   assert.equal(room.length,12);
   return room.reduce((sum,st)=>sum+st.level,0)/12;
  });
  assert.ok(Math.max(...averages)-Math.min(...averages)<=2.5,averages.join(','));
 }
});
test('일부 반을 거의 채운 교사 우선 배치를 그대로 두고 빈 칸 편성',()=>{
 const E=engine(),list=Array.from({length:60},(_,i)=>({id:'pre'+i,name:'학생'+i,oldClass:String(i%3+1),gender:i%2?'남':'여',level:i===0?0:90-i*.5,traits:i%7===0?['사회성']:[],fixed:i<17?1:0}));
 const result=E.generateCandidates(list,[],3,['사회성'],seed(90),{'사회성':4});
 assert.ok(result.candidates?.length,result.error);
 for(const c of result.candidates){
  assert.equal(E.validateAssignment(list,[],c.assign,{'사회성':4}).length,0);
  for(let i=0;i<17;i++)assert.equal(c.assign[list[i].id],1);
  const sizes=Array.from({length:3},(_,j)=>list.filter(st=>c.assign[st.id]===j+1).length);
  assert.deepEqual(sizes,[20,20,20]);
 }
});
test('교사가 지정한 직접 분리는 지키고 유의 사항 상한은 최대한 맞춘다',()=>{
 const E=engine(),list=Array.from({length:12},(_,i)=>({id:'pre'+i,name:'학생'+i,oldClass:'',gender:'',level:90-i,traits:i<2?['사회성']:[],fixed:i<2?1:0}));
 const pair=E.generateCandidates(list,[{a:list[0].id,b:list[1].id}],3,['사회성'],seed(42),{'사회성':2});
 assert.match(pair.error,/분리 조건/);
 const over=E.generateCandidates(list,[],3,['사회성'],seed(42),{'사회성':1});
 assert.ok(over.candidates?.length,over.error);assert.equal(E.preferencePenalty(list,over.candidates[0].assign,3,{'사회성':1},[]).total,1);
});
test('우선 배치 없는 기존 지그재그 동작을 유지',()=>{
 const E=engine(),list=Array.from({length:24},(_,i)=>({id:'s'+i,name:'학생'+i,oldClass:'',gender:'',level:100-i,traits:[],fixed:0}));
 const r=E.generateCandidates(list,[],4,[],seed(14),{});
 assert.ok(r.candidates?.length);
 assert.deepEqual(list.slice(0,8).map(st=>r.candidates[0].assign[st.id]),[1,2,3,4,4,3,2,1]);
});

function presetUI(people,pairs=[],caps={}){
 const scope=engine();Object.assign(scope,{state:{students:people,pairs,classCount:3,capRules:caps},presetSelected:new Set(people.map(st=>st.id)),presetUndo:null,findStudent:id=>people.find(st=>st.id===id),invalidate:()=>{},changeState:()=>{},renderPreset:()=>{},presetFeedback:()=>{}});
 vm.runInContext(html.slice(html.indexOf('function presetIssues('),html.indexOf('function presetFeedback(')),scope);
 vm.runInContext(html.slice(html.indexOf('function applyPresets('),html.indexOf('function presetVisibleStudents(')),scope);
 return scope;
}
test('일괄 배치 중 분리 충돌은 전체 복구하고 선택을 유지한다',()=>{
 const people=students(12),ui=presetUI(people,[{a:people[0].id,b:people[1].id}]);
 assert.equal(ui.applyPresets([people[0].id,people[1].id],1),false);
 assert.ok(people.every(st=>st.fixed===0));assert.equal(ui.presetSelected.size,12);assert.equal(ui.presetUndo,null);
});
test('일괄 배치 및 반 이동을 한 단계 되돌리고 자동 편성에 지정 반을 보존한다',()=>{
 const people=students(12),ui=presetUI(people),ids=people.slice(0,3).map(st=>st.id);
 assert.equal(ui.applyPresets(ids,1),true);assert.equal(ui.presetSelected.size,9);
 assert.equal(ui.applyPresets(ids,2),true);ui.undoPresets();assert.ok(people.slice(0,3).every(st=>st.fixed===1));
 const out=ui.generateCandidates(people,[],3,[],seed(25),{});assert.ok(out.candidates.length);
 for(const c of out.candidates)for(const id of ids)assert.equal(c.assign[id],1);
});
test('일괄 배치는 유의 사항 상한 초과를 허용하고 정원·되돌리기는 보호',()=>{
 const people=students(12),ui=presetUI(people,[],{'학습 지원':1});
 assert.equal(ui.applyPresets(people.slice(0,5).map(st=>st.id),1),false);assert.ok(people.every(st=>!st.fixed));
 assert.equal(ui.applyPresets([people[0].id,people[4].id],1),true);assert.equal(people[4].fixed,1);
 assert.equal(ui.applyPresets([people[0].id],1),true);people.pop();ui.undoPresets();assert.equal(people[0].fixed,1);assert.equal(ui.presetUndo,null);
});

function sheetEngine(){
 const a=html.indexOf('/* BULK_TABLE_START'),b=html.indexOf('/* BULK_TABLE_END */',a);
 assert.ok(a>0&&b>a,'엑셀 입력표 해석 함수를 찾을 수 있어야 함');
 const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);return ctx;
}
test('엑셀 복사 6학년 4개 반 96행: 비어 있는 이름과 학생별 유의 사항을 보존, 요약 행 제외',()=>{
 const sh=sheetEngine(),records=['학년\t반\t번호\t이름\t성별\t유의사항\t'];
 for(let room=1;room<=4;room++)for(let num=1;num<=24;num++){
  let note=room===1&&num===2?'다문화':room===1&&num===15?'다문화; 한부모':room===4&&num===17?'다문화(베트남)':'';
  records.push([6,room,num,'','',note,num===1?'남:10+여:14=24명':''].join('\t'));
 }
 records.push('\t\t\t\t\t\t총: 96명','\t\t\t\t\t\t','');
 const out=sh.bulkFormatRows(sh.parseSheetText(records.join('\n')));
 assert.equal(out.rows.length,96);
 assert.equal(out.rows[0][0],'6');assert.equal(out.rows[0][1],'1');
 assert.equal(out.rows[95][1],'4');assert.equal(out.rows[95][2],'24');
 assert.equal(out.rows[0][3],'');assert.equal(out.rows[0][6],'');
 assert.equal(out.rows[14][5],'다문화; 한부모');
 assert.equal(sh.bulkAttention(out.rows[14][5]).length,2);
 assert.equal(out.rows.filter(row=>row[3].trim()).length,0,'익명화된 이름을 임의로 생성하지 않음');
});
test('엑셀 인용부호 안 줄바꿈, 다문화 세부 표기와 학습지표를 올바르게 가져옴',()=>{
 const sh=sheetEngine();
 const contents='학년\t반\t번호\t이름\t성별\t유의사항\t학습지표\n6\t1\t15\t김가람\t여\t"다문화\n한부모"\t83.75\n6\t4\t17\t이별\t남\t다문화(베트남)\t0.00';
 const matrix=sh.bulkFormatRows(sh.parseSheetText(contents));
 assert.equal(matrix.rows.length,2);assert.equal(matrix.rows[0][5],'다문화\n한부모');
 assert.equal(matrix.rows[0][6],'83.75');assert.equal(matrix.rows[1][6],'0.00');
 assert.deepEqual(Array.from(sh.bulkAttention(matrix.rows[0][5])),['다문화','한부모']);
 assert.deepEqual(Array.from(sh.bulkAttention(matrix.rows[1][5])),['다문화','다문화(베트남)']);
});
test('마크다운 표의 <br> 복수 유의 사항, 머리말·합계·빈 행 제외',()=>{
 const sh=sheetEngine();
 const table='| 학년 | 반 | 번호 | 이름 | 성별 | 유의사항 |  |\n| --- | --- | --- | --- | --- | --- | --- |\n| 6 | 1 | 1 | 김하늘 | 여 | 다문화<br> 한부모 | 남:10+여:14=24명 |\n| 6 | 2 | 1 | 이도윤 | 남 | 운동부 | 남:11+여:13=24명 |\n| | | | | | | 총: 96명 |\n| | | | | | | |';
 const out=sh.bulkFormatRows(sh.parseSheetText(table));
 assert.equal(out.rows.length,2);
 assert.equal(out.rows[0][3],'김하늘');
 assert.deepEqual(Array.from(sh.bulkAttention(out.rows[0][5])),['다문화','한부모']);
 assert.equal(out.rows[1][6],'');
});
test('이전 형식의 학습지표 및 한 열 이름 붙여넣기와 호환됨',()=>{
 const sh=sheetEngine();
 let old=sh.bulkFormatRows(sh.parseSheetText('1반\t1\t김하늘\t여\t82.50\t사회성'));
 assert.equal(old.rows[0][1],'1반');assert.equal(old.rows[0][3],'김하늘');
 assert.equal(old.rows[0][6],'82.50');
 let names=sh.bulkFormatRows(sh.parseSheetText('김가람\n이별\n박하늘'));
 assert.deepEqual(Array.from(names.rows.map(row=>row[3])),['김가람','이별','박하늘']);
});
test('명단 입력표 컨트롤과 로컬 저장용 기존 학년 필드가 존재함',()=>{
 for(const id of ['rosterBody','rosterHead','rosterFillDown','rosterUndo','rosterFormatTools'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/oldGrade:String\(st\.oldGrade/);
 assert.match(html,/data-roster-cell/);
});

function sheetPasteAPI(){
 const a=html.indexOf('/* BULK_TABLE_START'),b=html.indexOf('/* BULK_TABLE_END */',a);
 assert.ok(a>0&&b>a);
 const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);
 return ctx;
}
function rectangle(r1,c1,r2=r1,c2=c1){return {anchor:{r:r1,c:c1},focus:{r:r2,c:c2}}}
test('Excel: 선택한 학년 열 전체에 단일 값 5를 붙여넣는다',()=>{
 const api=sheetPasteAPI(),list=Array.from({length:96},()=>Array(7).fill(''));
 const plan=api.bulkPastePlan('5',0),result=api.bulkPasteIntoRows(list,plan,rectangle(0,0,95,0));
 assert.equal(result.count,96);assert.ok(result.rows.every(row=>row[0]==='5'));
});
test('Excel: 이름 열에 96명 이름 한 열 붙여넣기, 학년 자동 적용',()=>{
 const api=sheetPasteAPI(),list=Array.from({length:12},()=>Array(7).fill(''));
 const names=Array.from({length:96},(_,i)=>'학생'+i).join('\r\n');
 const parsed=api.bulkPastePlan(names,3);
 assert.equal(parsed.full,false);assert.equal(parsed.column,3);assert.equal(parsed.rows.length,96);
 const result=api.bulkPasteIntoRows(list,parsed,rectangle(0,3), '5');
 assert.equal(result.rows.length,96);
 assert.ok(result.rows.every((row,i)=>row[0]==='5'&&row[3]==='학생'+i));
});
test('Excel: 이름 열 중간 빈칸과 단일 열 제목 처리',()=>{
 const api=sheetPasteAPI(),list=Array.from({length:7},()=>Array(7).fill(''));
 const plan=api.bulkPastePlan('이름\n김하늘\n\n이도윤\n박서연',3);
 assert.equal(plan.rows.length,4);
 const result=api.bulkPasteIntoRows(list,plan,rectangle(0,3));
 assert.deepEqual(Array.from(result.rows.slice(0,4).map(row=>row[3])),['김하늘','','이도윤','박서연']);
});
test('Excel: 선택 범위 첫 셀 아래로 채우기와 다시 복사/붙여넣기',()=>{
 const api=sheetPasteAPI(),list=Array.from({length:12},()=>Array(7).fill(''));
 list[0][1]='3';const selection=rectangle(0,1,9,1);
 const filled=api.bulkFillDownRows(list,selection);
 assert.equal(filled.count,9);assert.ok(filled.rows.slice(0,10).every(row=>row[1]==='3'));
 const names=['김하늘','이도윤','박서연'];
 names.forEach((name,i)=>filled.rows[i][3]=name);
 const clipboard=api.bulkSelectedTSV(filled.rows,rectangle(0,3,2,3));
 const pasted=api.bulkPasteIntoRows(filled.rows,api.bulkPastePlan(clipboard,3),rectangle(6,3));
 assert.deepEqual(Array.from(pasted.rows.slice(6,9).map(row=>row[3])),names);
});
test('Excel: 헤더 있는 전체 표와 이름만 한 열의 첫 셀 붙여넣기를 구분한다',()=>{
 const api=sheetPasteAPI();
 const full=api.bulkPastePlan('학년\t반\t번호\t이름\t성별\t유의사항\n5\t1\t1\t김하늘\t여\t다문화',0);
 assert.equal(full.full,true);assert.equal(full.rows[0][3],'김하늘');
 const names=api.bulkPastePlan('이름\n김하늘\n박서연',0);
 assert.equal(names.full,false);assert.equal(names.column,3);
 assert.deepEqual(Array.from(names.rows.map(row=>row[0])),['김하늘','박서연']);
 const grade=api.bulkNormalizedGrade('5학년');
 assert.equal(grade,'5');
});

function basketApi(){
 const a=html.indexOf('/* SEPARATION_BASKETS_START */'),b=html.indexOf('/* SEPARATION_BASKETS_END */',a);
 assert.ok(a>0&&b>a);
 const context={};vm.createContext(context);vm.runInContext(html.slice(a,b),context);return context;
}
test('바구니 3명은 세 학생이 모두 다른 반에 있어야 한다',()=>{
 const helper=basketApi(),api=engine(),people=students(36),ids=people.map(s=>s.id);
 const baskets=[{id:'A',name:'바구니 A',members:ids.slice(0,3)}];
 const pairs=helper.buildBasketPairs([],baskets);
 assert.equal(pairs.length,3);
 const result=api.generateCandidates(people,pairs,3,['학습 지원'],seed(713),{});
 assert.ok(result.candidates?.length,result.error);
 for(const c of result.candidates){
  assert.equal(new Set(ids.slice(0,3).map(id=>c.assign[id])).size,3);
  assert.equal(api.validateAssignment(people,pairs,c.assign).length,0);
 }
});
test('여러 바구니는 서로 독립되고 중복 관계는 한 번만 검사',()=>{
 const b=basketApi(),pairs=b.buildBasketPairs([{a:'a',b:'b'}],[
  {members:['a','b','c']},{members:['c','d']},{members:['a','c']}
 ]);
 assert.deepEqual(Array.from(pairs.map(x=>[x.a,x.b].sort().join(':'))).sort(),['a:b','a:c','b:c','c:d']);
});
test('바구니 저장 데이터는 삭제된 학생·중복 학생을 정리한다',()=>{
 const api=basketApi();
 const b=api.normalizeBaskets([{id:'one',name:'분리 바구니',members:['a','a','b','missing']},{id:'two',members:['b','c']}],new Set(['a','b','c']));
 assert.equal(b.length,2);
 assert.deepEqual(Array.from(b[0].members),['a','b']);
 assert.deepEqual(Array.from(b[1].members),['b','c']);
});
test('교사 우선 배치 ON/OFF 설정과 분리 바구니 입력 화면이 존재',()=>{
 for(const id of ['teacherPriorityOn','basketGrid','basketPool','basketSearch','addBasket','basketCount'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/teacherPriorityOn:false/);
 assert.match(html,/function activeStudents\(\)/);
 assert.match(html,/function effectivePairs\(\)/);
});

function moveReviewApi(){
 const a=html.indexOf('/* MOVE_REVIEW_START'),b=html.indexOf('/* MOVE_REVIEW_END */',a);
 assert.ok(a>0&&b>a,'학생 이동 검토 엔진을 찾을 수 있어야 함');
 const ctx=engine();
 vm.runInContext(html.slice(a,b),ctx);
 return ctx;
}
test('드래그 이동은 출발·도착 반의 남녀·다문화·특수 수와 학습 평균을 즉시 다시 계산',()=>{
 const api=moveReviewApi(),people=Array.from({length:12},(_,i)=>({
  id:'p'+i,name:'학생'+i,gender:i%2?'여':'남',level:i===0?0:70+i,
  oldClass:String(i%3+1),traits:i===0?['다문화','특수']:i===3?['다문화']:[],fixed:0
 }));
 const original=Object.fromEntries(people.map((st,i)=>[st.id,i%3+1]));
 const result=api.reviewStudentMove(people,[],original,3,['다문화','특수'],{},'p0',2,false);
 assert.equal(result.ok,true);
 assert.equal(original.p0,1,'기존 편성안은 검사 중 변경되면 안 됨');
 assert.equal(result.proposed.p0,2);
 assert.equal(result.before[0].total,4);assert.equal(result.after[0].total,3);
 assert.equal(result.before[1].total,4);assert.equal(result.after[1].total,5);
 assert.equal(result.before[0].boys,2);assert.equal(result.after[0].boys,1);
 assert.equal(result.before[1].boys,2);assert.equal(result.after[1].boys,3);
 assert.equal(result.before[0].traitCounts['다문화'],2);assert.equal(result.after[0].traitCounts['다문화'],1);
 assert.equal(result.before[1].traitCounts['다문화'],0);assert.equal(result.after[1].traitCounts['다문화'],1);
 assert.equal(result.after[1].traitCounts['특수'],1);
 assert.equal(result.before[0].levelN,4,'0.00점도 평가 인원에 포함');
 assert.equal(api.validateAssignment(people,[],result.proposed,{}).length,0);
});
test('분리 관계와 바구니에 걸리는 반 이동은 금지하고 결과를 변경하지 않음',()=>{
 const api=moveReviewApi(),people=Array.from({length:12},(_,i)=>({id:'p'+i,name:'학생'+i,gender:'',level:80+i,traits:[],fixed:0}));
 const assign=Object.fromEntries(people.map((st,i)=>[st.id,i%3+1]));
 const pairs=[{a:'p0',b:'p1'}];
 const result=api.reviewStudentMove(people,pairs,assign,3,[],{},'p0',2,false);
 assert.equal(result.ok,false);assert.match(result.error,/분리/);assert.equal(assign.p0,1);
});
test('반당 유의 사항 인원 상한 위반은 이동 중에도 차단',()=>{
 const api=moveReviewApi(),people=Array.from({length:12},(_,i)=>({id:'p'+i,name:'학생'+i,gender:i%2?'남':'여',level:80+i,traits:i<2?['다문화']:[],fixed:0}));
 const assign=Object.fromEntries(people.map((st,i)=>[st.id,i%3+1]));
 const result=api.reviewStudentMove(people,[],assign,3,['다문화'],{'다문화':1},'p0',2,false);
 assert.equal(result.ok,false);assert.match(result.error,/다문화/);assert.equal(assign.p0,1);
});
test('교사 우선 배치 ON은 고정 이동 차단, OFF는 저장한 고정정보를 무시',()=>{
 const api=moveReviewApi(),people=Array.from({length:12},(_,i)=>({id:'p'+i,name:'학생'+i,gender:'',level:80+i,traits:[],fixed:i===0?1:0}));
 const assign=Object.fromEntries(people.map((st,i)=>[st.id,i%3+1]));
 const blocked=api.reviewStudentMove(people,[],assign,3,[],{},'p0',2,true);
 assert.equal(blocked.ok,false);assert.match(blocked.error,/교사 우선/);
 const accepted=api.reviewStudentMove(people,[],assign,3,[],{},'p0',2,false);
 assert.equal(accepted.ok,true);
 const same=api.reviewStudentMove(people,[],assign,3,[],{},'p0',1,false);
 assert.equal(same.ok,false);
});
test('완성된 편성표의 드래그·이동 미리보기·되돌리기 인터페이스가 존재',()=>{
 for(const id of ['movePreview','moveHistoryResult','undoMove','moveSelection'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const attr of ['data-result-student','data-drop-class','data-select-move','data-drop-button'])assert.ok(html.includes(attr),attr);
 assert.match(html,/addEventListener\('dragstart'/);
 assert.match(html,/addEventListener\('drop'/);
 assert.match(html,/function undoResultMove\(/);
});

function stageZeroApi(){
 const a=html.indexOf('/* STAGE_ZERO_START'),b=html.indexOf('/* STAGE_ZERO_END */',a);
 assert.ok(a>0&&b>a,'0단계 학생 명단 생성 함수를 찾을 수 있어야 함');
 const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);return ctx;
}
test('0단계: 5학년 1~4반 남10 여14씩 입력하면 96개 학년·반·번호를 만듦',()=>{
 const api=stageZeroApi();
 const rows=api.stageZeroRows(Array.from({length:4},(_,i)=>({room:i+1,boys:10,girls:14})),4);
 const targets=api.stageZeroTargets(rows,4),plan=api.stageZeroReconcile([],'5',rows,(()=>{let i=0;return ()=>'p'+ ++i})());
 assert.equal(targets.total,96);
 assert.equal(targets.average.boys,10);
 assert.equal(targets.average.girls,14);
 assert.equal(targets.average.total,24);
 assert.equal(plan.students.length,96);
 assert.equal(plan.created,96);assert.equal(plan.preserved,0);
 assert.deepEqual(Array.from(plan.students.slice(0,2).map(x=>[x.oldGrade,x.oldClass,x.number,x.name,x.gender])),
   [['5','1반','1','',''],['5','1반','2','','']]);
 assert.deepEqual(Array.from(plan.students.slice(-1).map(x=>[x.oldGrade,x.oldClass,x.number])),[['5','4반','24']]);
});
test('0단계 인원을 늘리면 같은 반/번호에 기입된 이름·성별·유의 사항·고정 정보가 보존됨',()=>{
 const api=stageZeroApi(),rows=api.stageZeroRows([{room:1,boys:2,girls:1},{room:2,boys:2,girls:1}],2);
 let i=0,plan=api.stageZeroReconcile([],'5',rows,()=>'p'+(++i));
 plan.students[0].name='김하늘';plan.students[0].gender='여';plan.students[0].level=0;plan.students[0].traits=['다문화'];plan.students[0].fixed=2;
 rows[0].girls=2;
 const next=api.stageZeroReconcile(plan.students,'5',rows,()=>'p'+(++i));
 assert.equal(next.students.length,7);assert.equal(next.created,1);
 assert.equal(next.preserved,6);assert.equal(next.removed.length,0);
 assert.equal(next.students[0].id,'p1');assert.equal(next.students[0].name,'김하늘');
 assert.equal(next.students[0].gender,'여');assert.equal(next.students[0].level,0);
 assert.deepEqual(Array.from(next.students[0].traits),['다문화']);
 assert.equal(next.students[0].fixed,2);
 assert.ok(next.students.some(x=>x.oldClass==='1반'&&x.number==='4'&&x.name===''));
});
test('0단계 명단을 줄이면 제거 대상 명단을 반환해 사용자 확인을 거치게 함',()=>{
 const api=stageZeroApi(),rows=api.stageZeroRows([{room:1,boys:2,girls:1}],1);
 const old=api.stageZeroReconcile([],'5',rows,(()=>{let i=0;return ()=>'p'+ ++i})()).students;
 old[2].name='기존 학생';rows[0].boys=1;
 const next=api.stageZeroReconcile(old,'5',rows,()=> 'new');
 assert.equal(next.removed.length,1);assert.equal(next.removed[0].name,'기존 학생');
 assert.equal(next.students.length,2);assert.equal(old.length,3);
});
test('0단계 내년 학급 수 변경 시 남녀 평균과 반별 참고 목표 합계가 일치',()=>{
 const api=stageZeroApi(),rows=api.stageZeroRows([
  {room:1,boys:10,girls:14},{room:2,boys:11,girls:13},
  {room:3,boys:10,girls:14},{room:4,boys:10,girls:14}],4);
 const dist=api.stageZeroTargets(rows,5),sum=dist.rows.reduce((a,row)=>({boys:a.boys+row.boys,girls:a.girls+row.girls}),{boys:0,girls:0});
 assert.equal(dist.total,96);assert.equal(dist.rows.length,5);
 assert.equal(sum.boys,41);assert.equal(sum.girls,55);
 assert.equal(dist.average.boys,8.2);assert.equal(dist.average.girls,11);
 assert.ok(dist.rows.every(row=>row.boys+row.girls>=18&&row.boys+row.girls<=20));
});
test('0단계 인터페이스와 1단계 학년·반·번호 읽기 전용 표시',()=>{
 for(const id of ['view-roster','blankRosterSetup','rosterAdvanced','sourceGrade','sourceClassCount','sourceClassRows','sourceClassTotals','futureClassSummary','applySetup','rosterGenderSummary'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.doesNotMatch(html,/data-tab="setup"/);
 assert.match(html,/function stageZeroReconcile\(/);
 assert.match(html,/roster-identity/);
 assert.match(html,/data-key="name"/);
});

function plannerDashboardApi(){
 const start=html.indexOf('/* PLANNER_DASHBOARD_START'),end=html.indexOf('/* PLANNER_DASHBOARD_END */',start);
 assert.ok(start>0&&end>start);
 const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
 return ctx;
}
test('0단계 남녀 수와 실제 입력 학생의 성별을 서로 구별해 집계한다',()=>{
 const {plannerSummaryData}=plannerDashboardApi();
 const report=plannerSummaryData({
  sourceClasses:[{room:1,boys:10,girls:14},{room:2,boys:10,girls:14}],
  students:[
   {name:'김하늘',gender:'여',level:0,traits:['다문화(모)','특수']},
   {name:'이도윤',gender:'남',level:80,traits:['다문화','다문화(모)']},
   {name:'',gender:'',level:null,traits:[]}
  ]
 });
 assert.equal(report.total,48);assert.equal(report.planned.boys,20);assert.equal(report.planned.girls,28);
 assert.equal(report.registered,3);assert.equal(report.named,2);
 assert.equal(report.enteredBoys,1);assert.equal(report.enteredGirls,1);assert.equal(report.noGender,1);
 assert.equal(report.scored,2);assert.equal(report.avgScore,40);
 assert.equal(Object.fromEntries(report.tags).다문화,2);
 assert.equal(Object.fromEntries(report.tags).특수,1);
});
test('도움말·설정 버튼, 유의사항 편집, 완전히 숨겨지는 교사 우선배치 탭 구조',()=>{
 for(const id of ['openHelp','openSettings','plannerHelpDialog','plannerSettingsDialog','traitChips','newTrait','teacherPriorityOn','overviewDashboard'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/presetTab.hidden=!state.teacherPriorityOn/);
 assert.match(html,/aria-haspopup="dialog"/);
 assert.match(html,/data-tab="preset"/);
});

function pasteEngine(){
 const scope={};vm.createContext(scope);
 const parseStart=html.indexOf('function parseSheetText('),parseEnd=html.indexOf('/* PASTE_RANGE_START',parseStart);
 const begin=html.indexOf('/* ROSTER_EXCEL_PASTE_START'),end=html.indexOf('/* ROSTER_EXCEL_PASTE_END',begin);
 assert.ok(parseStart>0&&parseEnd>parseStart&&begin>0&&end>begin);
 vm.runInContext("function bulkClean(x){return String(x??'').trim()}; function parseStudyScore(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null};\n"+html.slice(parseStart,parseEnd)+"\n"+html.slice(begin,end),scope);
 return scope;
}
test('1단계 엑셀: 이름·성별·학습지표 3열을 헤더 포함하여 일괄 붙여넣기',()=>{
 const api=pasteEngine(),students=Array.from({length:96},(_,i)=>({
  id:'s'+i,oldGrade:'5',oldClass:(Math.floor(i/24)+1)+'반',number:String(i%24+1),
  name:'',gender:'',level:null,traits:[],note:'',fixed:0
 }));
 const ids=students.map(s=>s.id);
 const txt='이름\t성별\t학습지표\r\n김하늘\t여\t92.50\r\n이도윤\t남\t0.00\r\n박서연\t여\t85.25';
 const changes=api.rosterExcelChanges(txt,'name',ids,students);
 assert.equal(changes.errors.length,0);assert.equal(changes.header,true);assert.equal(changes.changes.length,3);
 assert.equal(changes.changes[0].next.name,'김하늘');
 assert.equal(changes.changes[0].next.gender,'여');
 assert.equal(changes.changes[0].next.level,92.5);
 assert.equal(changes.changes[1].next.level,0);
 assert.equal(changes.changes[0].next.oldGrade,'5');
 assert.equal(changes.changes[0].next.oldClass,'1반');
 assert.equal(changes.changes[0].next.number,'1');
 assert.equal(students[0].name,'','검증 중에는 기존 명단을 변경하지 않음');
});
test('1단계 엑셀: 성별·학습지표 열 단독 붙여넣기 및 잘못된 성별 일괄 취소',()=>{
 const api=pasteEngine(),students=[0,1,2,3].map(i=>({id:'s'+i,name:'기존'+i,gender:'',level:null,traits:[]}));
 const gender=api.rosterExcelChanges('남\t80.25\n여\t0.00','gender',students.map(x=>x.id),students);
 assert.equal(gender.errors.length,0);assert.equal(gender.changes[0].next.level,80.25);
 assert.equal(gender.changes[1].next.gender,'여');
 const scores=api.rosterExcelChanges('71.52\n65.25','level',students.map(x=>x.id),students);
 assert.equal(scores.errors.length,0);assert.equal(scores.changes[0].next.level,71.52);
 const invalid=api.rosterExcelChanges('다른이름\t알수없음\t82\n다른이름2\t여\t70','name',students.map(x=>x.id),students);
 assert.equal(invalid.errors.length,1);
 assert.equal(students[0].name,'기존0');
 const tooMany=api.rosterExcelChanges('일\n이\n삼','name',['s0','s1'],students);
 assert.equal(tooMany.errors.length,1);
});
test('예시 이름은 1000명까지 중복 없이 생성되며 기존 이름을 제외',()=>{
 const a=html.indexOf('/* DEMO_NAMES_START'),b=html.indexOf('/* DEMO_NAMES_END',a);
 assert.ok(a>0&&b>a);
 const api={};vm.createContext(api);vm.runInContext(html.slice(a,b),api);
 const names=Array.from(api.generateDemoNames(1000,['김하늘','이도윤']));
 assert.equal(names.length,1000);assert.equal(new Set(names).size,1000);
 assert.ok(!names.includes('김하늘')&&!names.includes('이도윤'));
 assert.ok(names.every(x=>/^[가-힣]{3}$/.test(x)));
});
test('0단계에 인원 상한이 표시되고, 3단계 검색 목록에 드롭다운이 없으며 바구니는 버튼·드래그로 조작',()=>{
 assert.match(html,/id="view-roster"[\s\S]*?id="rosterAdvanced"[\s\S]*?id="capRules"/);
 assert.match(html,/data-basket-pick/);
 assert.match(html,/data-basket-add-selected/);
 assert.doesNotMatch(html,/data-basket-assign/);
 assert.match(html,/id="fillDemoNames"/);
 assert.match(html,/trait-stat-track/);
});

test('1단계 입력 화면은 실시간 엑셀형 표 하나로 학년·반·번호도 편집',()=>{
 assert.match(html,/class="student-table roster-sheet"/);
 assert.match(html,/id="rosterFillDown"/);
 assert.match(html,/id="rosterUndo"/);
 assert.match(html,/ROSTER_COLUMNS.map/);
 for(const key of ['oldGrade','oldClass','number'])assert.ok(html.includes('data-key="'+key+'"'));
 assert.match(html,/data-roster-cell="traits"/);
 assert.doesNotMatch(html,/id="toggleBulk"/);
 assert.doesNotMatch(html,/id="bulkPanel"/);
 assert.doesNotMatch(html,/name="bulkMode"/);
 assert.match(html,/function rosterPasteText\(/);
 assert.match(html,/function rosterFillDown\(/);
 assert.match(html,/function rosterUndo\(/);
 assert.match(html,/function rosterSelectedTSV\(/);
});

function resultLayoutApi(){
 const start=html.indexOf('/* RESULTS_PRESENTATION_START'),end=html.indexOf('/* RESULTS_PRESENTATION_END */',start);
 assert.ok(start>0&&end>start,'반 편성표 내보내기 엔진');
 const scope={};vm.createContext(scope);const colors=html.slice(html.indexOf('/* STUDENT_NAME_COLORS_START'),html.indexOf('/* STUDENT_NAME_COLORS_END */'));vm.runInContext(colors+'\n'+html.slice(start,end),scope);return scope;
}
test('가로 비교형은 여러 반을 동일한 행의 독립된 엑셀 열로 복사하며 빈 학생칸은 비워 둠',()=>{
 const api=resultLayoutApi();
 const pupils=[
  {id:'a',name:'김하늘',oldGrade:'5',oldClass:'1반',number:'1',gender:'여',level:0,traits:['다문화'],note:'메모 A'},
  {id:'b',name:'박서준',oldGrade:'5',oldClass:'2반',number:'3',gender:'남',level:92.5,traits:[],note:''},
  {id:'c',name:'이지안',oldGrade:'5',oldClass:'1반',number:'4',gender:'여',level:89,traits:['사회성'],note:''},
  {id:'d',name:'최태민',oldGrade:'5',oldClass:'3반',number:'2',gender:'남',level:null,traits:['특수'],note:''}
 ];
 const candidate={assign:{a:1,b:2,c:1,d:4}};
 const table=Array.from(api.resultExportMatrix(pupils,candidate,4,'6',{1:'교사 A'},false,'compare'));
 assert.equal(table.length,4,'반 제목, 항목 제목, 최대 2명까지 2줄');
 assert.equal(table[0].length,24,'4반 × 6열');
 assert.equal(table[0][0],'6학년 1반 · 교사 A');
 assert.equal(table[0][6],'6학년 2반');
 assert.equal(table[1][0],'새 번호');
 assert.equal(table[1][6],'새 번호');
 assert.equal(table[2][1],'김하늘');
 assert.equal(table[2][4],'0.00');
 assert.equal(table[2][7],'박서준');
 assert.equal(table[2][19],'최태민');
 assert.equal(table[3][1],'이지안');
 assert.equal(table[3][7],'','인원이 적은 반은 같은 행의 빈 칸');
 assert.equal(table[3][13],'');
 const tsv=api.resultMatrixToTsv(table);
 assert.match(tsv,/김하늘/);assert.match(tsv,/\t박서준/);
 assert.equal(tsv.split('\r\n').length,4);
 assert.equal(pupils[0].name,'김하늘','자료 내보내기는 저장 명단을 변경하지 않음');
});
test('세로형은 반별 순서와 전체 학생을 보존하고 CSV/TSV에서 위험한 셀을 문자로 취급',()=>{
 const api=resultLayoutApi();
 const ppl=Array.from({length:96},(_,i)=>({
  id:'p'+i,name:i===0?'=1+1':'예시'+i,oldGrade:'5',oldClass:(i%4+1)+'반',number:String(i%24+1),gender:i%2?'여':'남',
  level:i%10===0?0:85,traits:i%5===0?['다문화']:[],note:'',fixed:0
 }));
 const assign=Object.fromEntries(ppl.map((st,i)=>[st.id,(i%4)+1]));
 const rows=api.resultExportMatrix(ppl,{assign},4,'6',{},false,'vertical');
 assert.equal(rows.length,97,'제목행 포함 모든 96명');
 assert.equal(rows[0][0],'새 학급');
 assert.equal(rows[1][0],'6학년 1반');
 assert.equal(rows[1][6],'=1+1');
 assert.equal(rows[1][8],'0.00');
 assert.match(api.resultMatrixToTsv(rows),/\'=1\+1/,'엑셀 수식 실행 예방');
});
test('인쇄는 세로 한 반 한 장, 가로 한 장 최대 4반으로 나눠 학생 누락 없이 렌더링',()=>{
 const api=resultLayoutApi(),ppl=Array.from({length:60},(_,i)=>({
  id:'p'+i,name:'학생'+i,oldGrade:'5',oldClass:'1반',number:String(i+1),gender:i%2?'여':'남',
  level:i%3===0?0:91.25,traits:i%7===0?['다문화']:[],note:i===0?'<script>':''
 }));
 const assign=Object.fromEntries(ppl.map((s,i)=>[s.id,i%6+1]));
 const counts=Array.from({length:6},(_,i)=>({
  total:10,boys:5,girls:5,levelN:10,levelSum:900,traitCounts:{다문화:1,특수:0}
 }));
 const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const tall=api.resultPrintTables(ppl,{assign},counts,6,'6',{},false,'vertical',escape);
 const wide=api.resultPrintTables(ppl,{assign},counts,6,'6',{},false,'compare',escape);
 assert.equal((tall.match(/class="print-page print-vertical"/g)||[]).length,6);
 assert.equal((wide.match(/class="print-page print-compare"/g)||[]).length,2);
 assert.equal((wide.match(/class="print-student"/g)||[]).length,60);
 assert.match(wide,/1~4반/);assert.match(wide,/5~6반/);
 assert.ok(!wide.includes('<script>'));
 assert.ok(wide.includes('&lt;script&gt;'));
});
test('가로/세로 전환과 엑셀 복사·인쇄 버튼은 결과 화면에 있고 선택이 저장됨',()=>{
 for(const key of ['resultVertical','resultCompare','copyResultExcel','exportCsv','print','resultPrintSheet'])assert.ok(html.includes('id="'+key+'"'),key);
 assert.match(html,/resultLayout:raw\.resultLayout==='compare'\?'compare':'vertical'/);
 assert.match(html,/data-layout="vertical"/);
 assert.match(html,/page:result-landscape/);
 assert.match(html,/page:result-portrait/);
 assert.match(html,/function setResultLayout\(/);
});

function nameColorApi(){
 const a=html.indexOf('/* STUDENT_NAME_COLORS_START'),b=html.indexOf('/* STUDENT_NAME_COLORS_END */',a);
 assert.ok(a>0&&b>a,'학생 이름 색상 유틸리티를 찾지 못함');
 const scope={};vm.createContext(scope);
 vm.runInContext(html.slice(a,b),scope);
 return scope;
}
test('학생별 이름 색상은 안전한 6자리 HEX만 저장하고 기본값은 무색',()=>{
 const a=nameColorApi();
 assert.equal(a.normalizeNameColor('#ffe0e6'),'#ffe0e6');
 assert.equal(a.normalizeNameColor(' #ABCDEF '),'#abcdef');
 assert.equal(a.normalizeNameColor('rgb(255,0,0)'),'');
 assert.equal(a.normalizeNameColor('red; color: white'),'');
 assert.equal(a.normalizeNameColor(''), '');
 assert.equal(a.normalizeNameColor(undefined),'');
 assert.equal(a.studentNameStyle(undefined),'');
 assert.equal(a.studentNameStyle('#ffead6'),'--student-name-bg:#ffead6;background-color:#ffead6;color:#16251e;');
});
test('짙은 사용자 지정 색은 흰색 글자, 밝은 배경은 어두운 글자로 대비 조절',()=>{
 const a=nameColorApi();
 assert.equal(a.nameColorTextColor('#162b4d'),'#ffffff');
 assert.equal(a.nameColorTextColor('#fff0b9'),'#16251e');
 assert.equal(a.nameColorTextColor('#ffffff'),'#16251e');
 assert.equal(a.nameColorTextColor('#000000'),'#ffffff');
});
test('1단계 이름 배경색, 최종 가로·세로 편성표, 인쇄와 백업에 동일한 학생별 색이 연결',()=>{
 for(const id of ['nameColorDialog','nameColorPalette','customNameColor','clearNameColor','nameColorPreview'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/color:normalizeNameColor\(st\.color\)/,'저장 자료를 불러올 때 색을 검증');
 assert.ok(html.includes('id="rosterFormatTools"'),'1단계 셀 서식 도구');
 assert.ok(html.includes('id="toggleResultRemote"'),'결과 단계 리모컨');
 assert.match(html,/style="\$\{studentNameStyle\(st\.color\)\}"/,'이름 칸 배경');
 assert.match(fs.readFileSync(path.join(__dirname,'..','class-planner-result-cards.js'),'utf8'),/style="\$\{studentNameStyle\(s\.color\)\+cellFormatStyle/,'완성된 반 이름 배경');
 assert.match(html,/studentNameStyle\(st\.color\)/,'인쇄 배경색');
 assert.match(html,/function changeStudentNameColor\(/);
});
