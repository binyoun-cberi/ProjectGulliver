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
  assert.ok(Math.max(...counts)-Math.min(...counts)<=1,counts.join(','));
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
  assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
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
 assert.match(html,/학습지표 \(0\.00~/);
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
 assert.match(E.generateCandidates(list,[],3,['사회성','운동부'],seed(41),caps).error,/운동부/);
});
test('총 학생 수가 반별 상한의 합을 넘으면 구체적으로 안내',()=>{
 const E=engine(),list=Array.from({length:7},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:99-i,traits:['사회성'],fixed:0}));
 const out=E.generateCandidates(list,[],3,['사회성'],seed(4),{'사회성':2});
 assert.match(out.error,/사회성/);
 assert.match(out.error,/최대 2명/);
});
test('고정 반에 같은 유의 사항 학생이 최대 인원을 넘으면 거부',()=>{
 const E=engine(),list=Array.from({length:12},(_,i)=>({id:'rank'+i,name:'학생'+i,gender:'',oldClass:'',level:99-i,traits:i<3?['사회성']:[],fixed:i<3?1:0}));
 const out=E.generateCandidates(list,[],3,['사회성'],seed(8),{'사회성':2});
 assert.match(out.error,/1반/);assert.match(out.error,/사회성/);
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
test('교사가 먼저 지정한 반의 분리·상한 충돌은 명시적으로 거부',()=>{
 const E=engine(),list=Array.from({length:12},(_,i)=>({id:'pre'+i,name:'학생'+i,oldClass:'',gender:'',level:90-i,traits:i<2?['사회성']:[],fixed:i<2?1:0}));
 const pair=E.generateCandidates(list,[{a:list[0].id,b:list[1].id}],3,['사회성'],seed(42),{'사회성':2});
 assert.match(pair.error,/분리 조건/);
 const over=E.generateCandidates(list,[],3,['사회성'],seed(42),{'사회성':1});
 assert.match(over.error,/1반/);
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
test('일괄 배치 인원 초과·유의 사항 상한·변경된 명단의 되돌리기 방지',()=>{
 const people=students(12),ui=presetUI(people,[],{'학습 지원':1});
 assert.equal(ui.applyPresets(people.slice(0,5).map(st=>st.id),1),false);assert.ok(people.every(st=>!st.fixed));
 assert.equal(ui.applyPresets([people[0].id,people[4].id],1),false);assert.ok(people.every(st=>!st.fixed));
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
 for(const id of ['bulkGridBody','bulkAddRows','bulkFocus','bulkParseText','bulkPreview','bulkText','commitBulk'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/oldGrade:String\(st\.oldGrade/);
 assert.match(html,/data-bulk-r/);
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
