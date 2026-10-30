/* Keep transfer records intact; allocation uses an independent neutral view. */
function studentTransferTiming(student){return student?.traits?.includes('전학 예정')?(student.transferTiming==='before'?'before':'after'):''}
function allocationStudents(students,teacherPriorityOn=true){
 return students.filter(st=>studentTransferTiming(st)!=='before').map(st=>({
  ...st,fixed:teacherPriorityOn?st.fixed:0,
  ...(studentTransferTiming(st)==='after'?{oldClass:'',gender:'',level:null,traits:[]}:{}),
 }));
}
function allocationSoftPairs(students,pairs){const ids=new Set(students.filter(st=>!studentTransferTiming(st)).map(st=>st.id));return pairs.filter(p=>ids.has(p.a)&&ids.has(p.b))}
function allocationPairs(students,pairs){const ids=new Set(students.filter(st=>studentTransferTiming(st)!=='before').map(st=>st.id));return pairs.filter(p=>ids.has(p.a)&&ids.has(p.b))}
function generateTransferCandidates(students,pairs,k,traits,random,caps,softPairs,groups,weights={},teacherPriorityOn=true){
 const active=allocationStudents(students,teacherPriorityOn),ids=new Set(active.map(st=>st.id));
 if(!active.length)return {error:'편성할 학생이 없습니다. 편성 전 전학 여부를 확인해 주세요.'};
 return generateTwinCandidates(active,allocationPairs(students,pairs),k,traits,random,caps,allocationSoftPairs(students,softPairs),normalizeTwinGroups(groups,ids),weights);
}
function reviewTransferMove(students,pairs,assign,k,traits,caps,id,to,teacherPriorityOn,softPairs,together,weights){
 const active=allocationStudents(students,teacherPriorityOn),result=reviewStudentMove(active,allocationPairs(students,pairs),assign,k,traits,caps,id,to,teacherPriorityOn,allocationSoftPairs(students,softPairs),allocationPairs(students,together),weights);
 if(result.ok){const actual=students.filter(st=>studentTransferTiming(st)!=='before');result.before=reviewClassStats(actual,assign,k,traits);result.after=reviewClassStats(actual,result.proposed,k,traits);result.student=students.find(st=>st.id===id)}
 return result;
}
function installTransferControls(){
 $('remoteTransferTiming').addEventListener('change',e=>{
  const student=findStudent(traitRemoteUI.studentId);if(!student)return;
  rosterSaveUndo();student.transferTiming=e.target.value==='before'?'before':'after';
  invalidate();changeState();
 });
}
