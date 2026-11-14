const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../class-planner-candidate-compare.js'),'utf8');
const html=fs.readFileSync(path.resolve(__dirname,'../반 편성 도우미.html'),'utf8');
function api(){
 const scope={};vm.createContext(scope);vm.runInContext(source,scope);return scope;
}
const people=[
 {id:'a',oldGrade:'5',oldClass:'1',gender:'남',level:90,traits:['특수']},
 {id:'b',oldGrade:'5',oldClass:'1',gender:'여',level:80,traits:[]},
 {id:'c',oldGrade:'5',oldClass:'1',gender:'남',level:70,traits:[]},
 {id:'d',oldGrade:'5',oldClass:'2',gender:'여',level:60,traits:['특수']},
 {id:'e',oldGrade:'5',oldClass:'2',gender:'남',level:null,traits:[]},
 {id:'f',oldGrade:'5',oldClass:'2',gender:'여',level:0,traits:[]}
];
const A={a:1,b:1,c:1,d:2,e:2,f:2};
const B={a:1,b:1,c:2,d:1,e:2,f:2};
test('결과 통계: 인원·성별·0점·미입력·기존 반 분산을 정확하게 계산',()=>{
 const result=api().candidateComparisonStats(people,A,2);
 assert.equal(result.assigned,6);
 assert.equal(result.coveredScores,5);
 assert.equal(result.coveredGender,6);
 assert.equal(result.countGap,0);
 assert.equal(result.genderGap,2);
 assert.equal(result.averageGap,50);
 assert.equal(result.originSpread,6);
 assert.equal(result.traitSpread,0);
 assert.equal(api().candidateComparisonStats(people,B,2).originSpread,2);
});
test('점수 없는 반에서는 평균 차를 임의로 0으로 표시하지 않음',()=>{
 const row=people.map(x=>({...x,level:x.id==='a'?0:null}));
 const result=api().candidateComparisonStats(row,A,2);
 assert.equal(result.coveredScores,1);
 assert.equal(result.averageGap,null);
});
test('전학 후 중립 정보는 원 반·성별·유의사항·학습 편차에 반영하지 않음',()=>{
 const neutral={id:'transfer',oldClass:'',gender:'',level:null,traits:[]};
 const result=api().candidateComparisonStats([...people,neutral],{...A,transfer:1},2);
 assert.equal(result.assigned,7);
 assert.equal(result.coveredGender,6);
 assert.equal(result.coveredScores,5);
 assert.equal(result.originSpread,6);
 assert.equal(result.traitSpread,0);
});
test('A/B/C 비교는 실제 변경 학생 수와 선택을 표시하고 접기 유지',()=>{
 const list=[{assign:A},{assign:B},{assign:A}];
 const output=api().candidateComparisonTable(people,list,2,1,false);
 assert.match(output,/data-candidate-compare="1" aria-pressed="true"/);
 assert.match(output,/A안과 다른 학생/);
 assert.match(output,/2명/);
 assert.doesNotMatch(output,/<details class="candidate-compare" open>/);
 assert.doesNotMatch(output,/<script/);
 assert.equal(api().candidateComparisonTable(people,[{assign:A}],2,0),'');
});
test('기존 편성 결과 흐름에 비교 모듈이 연결되고 인쇄는 가리지 않음',()=>{
 assert.match(html,/class-planner-candidate-compare\.js/);
 assert.match(html,/candidateComparisonTable\(activeStudents\(\),state\.candidates,state\.classCount,state\.activeCandidate/);
 assert.match(html,/data-candidate/);
 const css=fs.readFileSync(path.resolve(__dirname,'../class-planner-candidate-compare.css'),'utf8');
 assert.match(css,/@media print/);
});
