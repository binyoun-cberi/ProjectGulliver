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
 const scope={};vm.createContext(scope);vm.runInContext(html.slice(start,end),scope);return scope;
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
