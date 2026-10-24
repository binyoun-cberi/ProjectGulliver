(function classroomAllocationAudit(){
 'use strict';
 const s=v=>String(v??'');
 const unique=a=>[...new Set(a)];
 function seating(data){
  const {assignment=[],students=[],activeSeats=[],fixedSeats={},genderSeats={}}=data||{};
  const valid=new Set(students.map(x=>s(x.id))),seen=new Set(),issues=[];
  for(let i=0;i<assignment.length;i++){
   const id=assignment[i];if(!id)continue;
   if(!valid.has(s(id)))issues.push('명단에 없는 학생이 자리 '+(i+1)+'에 있어요.');
   if(seen.has(s(id)))issues.push('같은 학생이 두 번 배정됐어요.');seen.add(s(id));
   if(!activeSeats[i])issues.push('사용하지 않는 책상 '+(i+1)+'에 학생이 있어요.');
   const gender=genderSeats[i]||genderSeats[s(i)],student=students.find(x=>s(x.id)===s(id));
   if(gender && student?.gender!==gender)issues.push((student?.name||'학생')+'의 지정석 조건이 맞지 않아요.');
  }
  for(const [seat,studentId] of Object.entries(fixedSeats)){
   if(assignment[Number(seat)]!==studentId)issues.push('고정된 '+(Number(seat)+1)+'번 자리 조건을 지키지 못했어요.');
  }
  const missing=students.filter(x=>!seen.has(s(x.id)));
  if(missing.length)issues.push('배정되지 않은 학생 '+missing.length+'명: '+missing.slice(0,4).map(x=>x.name).join(', '));
  return {ok:issues.length===0,issues:unique(issues),assigned:seen.size,missing:missing.length};
 }
 function groupIssues(groups,avoidPairs=[],togetherPairs=[],fixedGroups={}){
  const index=new Map(),issues=[];
  groups.forEach((g,i)=>g.forEach(v=>index.set(s(v?.id??v),i+1)));
  for(const [a,b] of avoidPairs)if(index.has(s(a))&&index.get(s(a))===index.get(s(b)))issues.push('분리 조건 충돌');
  for(const [a,b] of togetherPairs)if(index.get(s(a))!==index.get(s(b)))issues.push('같이 묶기 조건 충돌');
  for(const [id,g] of Object.entries(fixedGroups))if(index.get(s(id))!==Number(g))issues.push('고정 모둠 조건 충돌');
  return unique(issues);
 }
 function roleFeasibility(students,roles,fixed={},excluded={}){
  const slots=[];
  for(const role of roles)for(let i=0;i<Math.min(100,Math.max(0,Number(role.count)||0));i++)slots.push(s(role.id));
  const allowed=students.map(student=>slots.map((role,i)=>{
   if(fixed[student.id]&&s(fixed[student.id])!==role)return -1;
   return (excluded[student.id]||[]).some(v=>s(v)===role)?-1:i;
  }).filter(i=>i>=0));
  const owner=Array(slots.length).fill(-1);
  function assign(person,visited){
   for(const slot of allowed[person]){
    if(visited.has(slot))continue;
    visited.add(slot);
    if(owner[slot]<0||assign(owner[slot],visited)){owner[slot]=person;return true}
   }
   return false;
  }
  const order=students.map((_,i)=>i).sort((a,b)=>allowed[a].length-allowed[b].length);
  const unassigned=[];
  for(const i of order)if(!assign(i,new Set()))unassigned.push(students[i]);
  return {ok:unassigned.length===0,unassigned:unassigned.map(x=>x.name),
    message:unassigned.length?'현재 필수·제외 조건과 역할 정원으로 배정할 수 없는 학생: '+unassigned.slice(0,5).map(x=>x.name).join(', ')+'. 필수 배정이나 제외 조건을 조정해 주세요.':''};
 }
 const api={seating,groupIssues,roleFeasibility};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.ClassroomAllocationAudit=api;
})();
