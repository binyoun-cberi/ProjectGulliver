/* Direct roster entry grows only after a validated paste and updates stage-zero counts. */
function newRosterStudent(students,grade,id){
 const last=students[students.length-1],room=stageZeroRoom(last?.oldClass)||1;
 const number=1+Math.max(0,...students.filter(s=>stageZeroRoom(s.oldClass)===room).map(s=>Number(s.number)||0));
 return {id,oldGrade:String(last?.oldGrade||grade||'5'),oldClass:room+'반',number:String(number),name:'',gender:'',level:null,traits:[],fixed:0,note:''};
}
function expandedRosterPaste(text,startKey,ids,students,grade,idFactory,allowGrowth=true){
 const plan=rosterExcelPastePlan(text,startKey),next=students.slice(),targets=ids.filter(id=>students.some(s=>s.id===id));
 const needed=Math.max(0,plan.rows.length-targets.length);
 if(needed&&(!allowGrowth||!plan.mapping.includes('name')))return {errors:['학생 자리가 부족합니다. 검색을 해제하거나 이름 열과 함께 붙여넣어 주세요.']};
 if(next.length+needed>1000)return {errors:['학생 명단은 최대 1000명까지 입력할 수 있습니다.']};
 for(let i=0;i<needed;i++){const st=newRosterStudent(next,grade,idFactory());next.push(st);targets.push(st.id)}
 const result=rosterExcelChanges(text,startKey,targets,next);
 if(result.errors.length)return result;
 const updated=new Map(result.changes.map(x=>[x.id,x.next]));
 return {...result,students:next.map(st=>updated.get(st.id)||st),created:needed};
}
function sourceSummaryFromRoster(students){
 const max=Math.max(1,...students.map(st=>stageZeroRoom(st.oldClass)||1));
 const rows=Array.from({length:Math.min(12,max)},(_,i)=>({room:i+1,boys:0,girls:0,unknown:0}));
 for(const st of students){const room=stageZeroRoom(st.oldClass)||1,row=rows[room-1];if(!row)continue;if(st.gender==='남')row.boys++;else if(st.gender==='여')row.girls++;else row.unknown++}
 return rows;
}
function syncSourceFromRoster(){
 state.sourceClasses=sourceSummaryFromRoster(state.students);
 state.sourceClassCount=state.sourceClasses.length;
 const grade=state.students.find(st=>/^(?:[1-9]|1[0-2])$/.test(st.oldGrade||''))?.oldGrade;
 if(grade){const previous=state.sourceGrade;state.sourceGrade=String(grade);if(!state.setupCompleted||state.grade===String(Math.min(12,Number(previous)+1)))state.grade=String(Math.min(12,Number(grade)+1));}
 state.setupCompleted=state.students.length>0;
}
