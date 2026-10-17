/* One trustworthy path from classroom apps to editable canvas pages.
 * Never use another app's older activity or a fabricated sample when importing a live tool. */
(function(root,factory){
 'use strict';
 const api=factory(root.GulliverTeacherCanvas||(typeof require==='function'?require('./studio-teacher-core.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverTeacherSource=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(T){
 'use strict';
 if(!T)throw Error('교사 자료 변환 기능이 필요해요.');
 const parse=(read,key)=>{try{return read(key)||null}catch{return null}};
 const studentsOf=room=>Array.isArray(room?.students)?room.students:[];
 const own=Object.prototype.hasOwnProperty;
 function prepare(kind,{layout='wide',read=()=>null,room={},live=null}={}){
  const snapshot=live?.kind===kind?live:null;
  if(kind==='quiz'){
   const cards=snapshot?.cards||parse(read,'flashQuizMakerPlusV3')?.cards;
   if(!Array.isArray(cards)||!cards.length)throw Error('낱말카드 도구에서 문제와 정답을 먼저 만들어 주세요.');
   return T.quizCards(cards,{layout,title:'우리 반 낱말카드'});
  }
  if(kind==='timer'){
   const state=snapshot||parse(read,'lessonCircleTimerV3');
   if(!Array.isArray(state?.events)||!state.events.length)throw Error('수업 타이머에서 활동과 시간을 먼저 설정해 주세요.');
   return T.timerPlan(state.events,{layout,title:String(state.title||'우리 반 수업 흐름표')});
  }
  if(kind==='seating'){
   const state=snapshot||parse(read,'gulliver.seating.v3')||{};
   const cols=Number(state.cols)||5,rows=Number(state.rows)||4;
   const students=Array.isArray(state.students)&&state.students.length?state.students:studentsOf(room);
   const last=(parse(read,'gulliver.seating.history.v1')||[])[0];
   // Only the same grid and the same named students may be used.
   const recorded=snapshot
    ?(Array.isArray(snapshot.assignment)&&snapshot.assignment.some(Boolean)?{cols,rows,seats:snapshot.assignment}:null)
    :last;
   const matches=recorded?.cols===cols&&recorded?.rows===rows
     &&Array.isArray(recorded.seats)&&recorded.seats.length===cols*rows;
   const lookup=new Map(students.map(s=>[String(s.id),String(s.name||'')]));
   const unknown=matches&&recorded.seats.some(id=>id&&!lookup.has(String(id)));
   if(unknown)throw Error('저장된 자리표의 학생 명단과 현재 명단이 달라요. 자리 배정 화면에서 이름을 다시 확인해 주세요.');
   if(!matches)throw Error('확정된 자리 배정이 없어요. 자리 배정 도구에서 배치를 만든 뒤 ‘이 자리 확정’을 눌러 주세요.');
   const seatNames=recorded.seats.map(id=>id?lookup.get(String(id))||'':'');
   if(!seatNames.some(Boolean))throw Error('배정된 학생이 없어요. 자리표를 확정한 다음 다시 눌러 주세요.');
   return T.seatingPlan({cols,rows,activeSeats:state.activeSeats},{layout,
    title:'우리 반 자리표',students,seatNames});
  }
  if(kind==='check'){
   const state=snapshot||parse(read,'classChecklistState')||{};
   const all=Array.isArray(state.studentNames)?state.studentNames:[];
   const roster=studentsOf(room).map(s=>s.name).filter(Boolean);
   const count=Number(state.studentCount)||all.length;
   const names=Array.from({length:count},(_,i)=>String(all[i]||roster[i]||'').trim());
   if(!names.length||names.some(x=>!x))throw Error('체크판의 학생 이름을 모두 입력하거나 ‘우리 반 불러오기’를 먼저 눌러 주세요.');
   const theme=String(state.currentTheme||'우리 반 체크판');
   const data=state.data?.[theme]||{};
   return T.checklist({theme,students:names,checks:names.map((_,i)=>own.call(data,i+1)&&data[i+1]===true)},{layout,title:theme});
  }
  throw Error('지원하지 않는 교사 도구예요.');
 }
 return{prepare};
});