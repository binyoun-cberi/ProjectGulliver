"use strict";
function validateBusPlacement({students=[],assignment=[],disabled=[],fixedSeats={},avoidPairs=[],togetherPairs=[],sharedAvoidPairs=[]}={}){
 const ids=new Set(students.map(x=>String(x.id)));
 const occupied=new Set(),issues=[];
 const mate=i=>i%4===0?i+1:i%4===1?i-1:i%4===2?i+1:i-1;
 const near=(a,b)=>a>=0&&b>=0&&a!==b&&Math.abs(Math.floor(a/4)-Math.floor(b/4))<=1&&Math.abs(a%4-b%4)<=1;
 for(let i=0;i<assignment.length;i++){const id=assignment[i];if(!id)continue;const key=String(id);
   if(!ids.has(key))issues.push('명단에 없는 학생이 있어요.');
   if(occupied.has(key))issues.push('같은 학생이 여러 자리에 있어요.');
   occupied.add(key);if(disabled[i])issues.push('사용하지 않는 좌석에 학생이 있어요.');
 }
 for(const student of students)if(!occupied.has(String(student.id)))issues.push(student.name+' 학생의 자리가 비어 있어요.');
 for(const [id,pos] of Object.entries(fixedSeats)){
   if(ids.has(id)&&String(assignment[Number(pos)]||'')!==id)issues.push('고정 자리 조건을 확인해 주세요: '+(students.find(x=>String(x.id)===id)?.name||id));
 }
 const index=id=>assignment.findIndex(v=>v!=null&&String(v)===String(id));
 for(const [a,b] of [...avoidPairs,...sharedAvoidPairs])if(near(index(a),index(b)))issues.push('분리 조건을 위반했어요.');
 for(const [a,b] of togetherPairs){const ai=index(a),bi=index(b);if(ai>=0&&bi>=0&&mate(ai)!==bi)issues.push('같이 앉기 조건을 위반했어요.');}
 return {ok:issues.length===0,issues:[...new Set(issues)],assigned:occupied.size};
}
function validateBusRules({students=[],disabled=[],fixedSeats={},avoidPairs=[],togetherPairs=[]}={}){
 const issues=[],togetherCount=new Map();
 for(const [a,b] of togetherPairs){togetherCount.set(String(a),(togetherCount.get(String(a))||0)+1);togetherCount.set(String(b),(togetherCount.get(String(b))||0)+1);
   if(avoidPairs.some(([c,d])=>[String(c),String(d)].sort().join('|')===[String(a),String(b)].sort().join('|')))issues.push('같은 두 학생에게 동석과 분리를 동시에 지정했어요.');
 }
 for(const [id,n] of togetherCount)if(n>1)issues.push((students.find(x=>String(x.id)===id)?.name||id)+' 학생에게 동석 상대가 여러 명 지정돼 있어요. 두 좌석의 한계 때문에 동시에 배정할 수 없어요.');
 for(const [id,pos] of Object.entries(fixedSeats))if(disabled[Number(pos)])issues.push((students.find(x=>String(x.id)===id)?.name||id)+' 학생의 고정 자리가 사용 불가예요.');
 return {ok:issues.length===0,issues:[...new Set(issues)]};
}
const api=Object.freeze({validateBusPlacement,validateBusRules});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.GulliverBusAudit=api;
