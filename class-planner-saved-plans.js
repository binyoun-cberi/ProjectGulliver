/* Named class plans: lightweight assignments only, stored in existing browser/JSON state. */
const PLANNER_SAVED_PLAN_LIMIT=12;
let selectedSavedPlanId=null;
function normalizePlannerSavedPlans(raw){
 if(!Array.isArray(raw))return [];
 const seen=new Set(),out=[];
 for(const item of raw.slice(-PLANNER_SAVED_PLAN_LIMIT)){
  if(!item||typeof item!=='object'||!item.assign||typeof item.assign!=='object'||Array.isArray(item.assign))continue;
  const id=String(item.id||'').slice(0,90);
  const cls=Number(item.classCount);
  if(!id||seen.has(id)||!Number.isInteger(cls)||cls<2||cls>12)continue;
  const pairs=Object.entries(item.assign);
  if(!pairs.length||pairs.length>1000||pairs.some(([key,value])=>!key||key.length>100||!Number.isInteger(Number(value))||Number(value)<1||Number(value)>cls))continue;
  seen.add(id);
  const target=Array.isArray(item.target)&&item.target.length===cls?
   item.target.map(value=>Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1000?Number(value):0):[];
  out.push({
   id,name:String(item.name||'보관된 편성안').trim().slice(0,48)||'보관된 편성안',
   createdAt:String(item.createdAt||'').slice(0,35),classCount:cls,
   assign:Object.fromEntries(pairs.map(([key,value])=>[key,Number(value)])),target
  });
 }
 return out;
}
function plannerPlanRosterMatches(saved,students,k){
 if(!saved||saved.classCount!==k)return false;
 const ids=students.map(st=>st.id),assigned=Object.keys(saved.assign||{});
 if(assigned.length!==ids.length)return false;
 const own=new Set(assigned);
 return ids.every(id=>own.has(id));
}
function plannerPlanDiff(saved,current,students,k){
 if(!plannerPlanRosterMatches(saved,students,k))return null;
 const currentAssign=current?.assign||null,changes=[];
 if(currentAssign){
  for(const st of students){
   const from=Number(currentAssign[st.id]),to=Number(saved.assign[st.id]);
   if(from!==to)changes.push({id:st.id,name:st.name,from,to});
  }
 }
 return {changes,stored:candidateComparisonStats(students,saved.assign,k),current:currentAssign?candidateComparisonStats(students,currentAssign,k):null};
}
function plannerPlanRestoreProblems(saved,students,k,pairs,twinGroups,validate,checkTwin){
 if(!plannerPlanRosterMatches(saved,students,k))return ['저장 당시와 학생 구성 또는 새 반 수가 다릅니다.'];
 const violations=validate(students,pairs,saved.assign,{});
 const twinProblems=checkTwin(twinGroups,saved.assign);
 return [...violations,...twinProblems];
}
function currentPlannerSavedPlan(){
 const current=state.candidates[state.activeCandidate];
 if(!current)return null;
 const active=activeStudents(),assign=Object.fromEntries(active.map(st=>[st.id,current.assign[st.id]]));
 if(active.some(st=>!Number.isInteger(assign[st.id])||assign[st.id]<1||assign[st.id]>state.classCount))return null;
 const requested=String(document.getElementById('savedPlanName')?.value||'').trim();
 const timestamp=new Date().toISOString();
 return {
  id:'plan-'+makeId(),name:(requested||'편성안 '+String.fromCharCode(65+state.activeCandidate)+' · '+new Date().toLocaleString('ko-KR')).slice(0,48),
  createdAt:timestamp,classCount:state.classCount,assign,
  target:Array.isArray(current.target)?current.target.slice(0,state.classCount):[]
 };
}
function keepPlannerSavedPlan(plan){
 if(!plan||state.savedPlans.length>=PLANNER_SAVED_PLAN_LIMIT)return false;
 state.savedPlans.push(plan);
 return true;
}
function plannerSaveCurrent(){
 const snapshot=currentPlannerSavedPlan();
 if(!snapshot){toast('저장할 편성 결과가 없습니다. 먼저 자동 편성해 주세요.');return false}
 if(!keepPlannerSavedPlan(snapshot)){toast('편성안은 최대 12개까지 보관할 수 있습니다. 필요 없는 안을 삭제해 주세요.');return false}
 selectedSavedPlanId=snapshot.id;
 saveState();renderResults();toast('현재 편성안을 별도로 보관했습니다.');return true;
}
function plannerSavedPlanProblems(saved){
 return plannerPlanRestoreProblems(saved,activeStudents(),state.classCount,allocationPairs(state.students,hardSeparationPairs()),state.twinGroups,validateAssignment,twinAssignmentProblems);
}
function plannerRestorePlan(id){
 const saved=state.savedPlans.find(plan=>plan.id===id);
 if(!saved)return false;
 const problems=plannerSavedPlanProblems(saved);
 if(problems.length){toast('복원할 수 없습니다. '+problems[0]);renderSavedPlanPanel();return false}
 const current=state.candidates[state.activeCandidate],students=activeStudents();
 const diff=plannerPlanDiff(saved,current,students,state.classCount);
 if(diff&&current&&diff.changes.length===0){toast('이미 현재 편성안과 동일합니다.');return false}
 // Keep a durable pre-restore checkpoint, including across page reloads.
 if(current){
  const before=currentPlannerSavedPlan();
  if(!before)return false;
  before.name=('복원 전 · '+new Date().toLocaleString('ko-KR')).slice(0,48);
  if(!keepPlannerSavedPlan(before)){toast('복원 전 편성안을 보관할 자리가 없습니다. 저장된 편성안을 하나 삭제해 주세요.');return false}
 }
 const assign={...saved.assign},k=state.classCount;
 const target=saved.target.length===k?saved.target.slice():Array(k).fill(0).map((_,i)=>Math.floor(students.length/k)+(i<students.length%k?1:0));
 const score=calcScore(students,assign,k,state.traits,target,allocationOptions());
 const candidate={assign,target,score};
 if(current)state.candidates[state.activeCandidate]=candidate;
 else {state.candidates=[candidate];state.activeCandidate=0}
 moveUndoStack.length=0;moveLastResult=null;moveSelectedId=null;moveDraggingId=null;
 selectedSavedPlanId=id;
 clearReviewPreview();saveState();renderResults();
 toast('저장한 편성안을 복원했습니다. 복원 직전의 배정도 별도로 보관했습니다.');
 return true;
}
function plannerDeletePlan(id){
 const saved=state.savedPlans.find(plan=>plan.id===id);
 if(!saved||!confirm('「'+saved.name+'」 편성안을 삭제할까요? 삭제하면 되돌릴 수 없습니다.'))return false;
 state.savedPlans=state.savedPlans.filter(plan=>plan.id!==id);
 if(selectedSavedPlanId===id)selectedSavedPlanId=null;
 saveState();renderSavedPlanPanel();toast('보관한 편성안을 삭제했습니다.');return true;
}
function renderSavedPlanPanel(){
 const host=document.getElementById('savedPlansList');if(!host)return;
 const active=activeStudents(),k=state.classCount,current=state.candidates[state.activeCandidate];
 const input=document.getElementById('savedPlanName');
 const title=input?.value||'';
 document.getElementById('saveCurrentPlan').disabled=!current||state.savedPlans.length>=PLANNER_SAVED_PLAN_LIMIT;
 document.getElementById('savedPlanCounter').textContent=state.savedPlans.length+'/'+PLANNER_SAVED_PLAN_LIMIT+'개 보관';
 if(!state.savedPlans.length){host.innerHTML='<p class="saved-plan-empty">아직 보관한 편성안이 없습니다. 자동 편성 후 이름을 붙여 저장해 두면 협의 중에도 다시 불러올 수 있습니다.</p>';}
 else host.innerHTML=state.savedPlans.slice().reverse().map(saved=>{
  const ready=plannerPlanRosterMatches(saved,active,k);
  const problems=ready?plannerSavedPlanProblems(saved):['학생 구성 또는 새 반 수가 달라졌습니다.'];
  const stamp=new Date(saved.createdAt);
  const time=Number.isNaN(stamp.getTime())?'저장 시간 미상':stamp.toLocaleString('ko-KR');
  return '<article class="saved-plan-row"><div><strong>'+escapeHtml(saved.name)+'</strong>'+
   '<small>'+escapeHtml(time)+' · '+saved.classCount+'개 반'+(ready?'':' · 현재 명단과 불일치')+'</small>'+
   (problems.length?'<small class="saved-plan-warning">'+escapeHtml(problems[0])+'</small>':'')+
   '</div><div class="saved-plan-row-actions">'+
   '<button type="button" class="btn small" data-saved-compare="'+escapeHtml(saved.id)+'" '+(ready?'':'disabled')+'>비교</button>'+
   '<button type="button" class="btn small" data-saved-restore="'+escapeHtml(saved.id)+'" '+(problems.length?'disabled':'')+'>복원</button>'+
   '<button type="button" class="btn small danger" data-saved-delete="'+escapeHtml(saved.id)+'">삭제</button>'+
   '</div></article>';
 }).join('');
 const preview=document.getElementById('savedPlanComparison');
 const saved=state.savedPlans.find(plan=>plan.id===selectedSavedPlanId);
 const diff=saved&&plannerPlanDiff(saved,current,active,k);
 if(!diff){preview.hidden=true;preview.innerHTML='';return}
 const {changes,stored, current:now}=diff;
 const fmt=n=>n===null?'—':Number(n).toFixed(2);
 const metrics=[['반별 인원 차',now?.countGap,stored.countGap,'명'],
  ['성별 구성 편차',now?.genderGap,stored.genderGap,'명'],
  ['학습지표 평균 차',now?.averageGap,stored.averageGap,''],
  ['기존 반 쏠림',now?.originSpread,stored.originSpread,'명'],
  ['유의사항 쏠림',now?.traitSpread,stored.traitSpread,'명']];
 const value=(n,unit)=>n===undefined?'—':n===null?'—':unit?String(n)+unit:fmt(n);
 preview.hidden=false;
 preview.innerHTML='<h4>선택한 안 비교 · '+escapeHtml(saved.name)+'</h4>'+
 '<p>'+(now?'현재 편성에서 '+changes.length+'명이 다른 반으로 배정되어 있습니다.':'현재 편성 결과가 없습니다. 저장된 안을 복원할 수 있습니다.')+'</p>'+
 '<div class="saved-plan-metrics"><table><thead><tr><th>비교 지표</th><th>현재 편성</th><th>보관한 편성</th></tr></thead><tbody>'+
 metrics.map(([name,a,b,unit])=>'<tr><th>'+name+'</th><td>'+value(a,unit)+'</td><td>'+value(b,unit)+'</td></tr>').join('')+'</tbody></table></div>'+
 (changes.length?'<p class="saved-plan-difference">다르게 배정된 학생 (최대 10명 표시)</p><ul>'+
 changes.slice(0,10).map(row=>'<li>'+escapeHtml(row.name)+' · 현재 '+row.from+'반 → 저장 '+row.to+'반</li>').join('')+
 (changes.length>10?'<li>그 밖에 '+(changes.length-10)+'명</li>':'')+'</ul>':'')+
 '<p class="saved-plan-note">학습지표와 유의사항의 비교에는 현재 명단의 자료를 사용합니다. 복원은 현재 배정 조건을 다시 확인하며, 복원 직전의 편성안도 자동 보관합니다.</p>';
 if(input)input.value=title;
}
function installSavedPlanControls(){
 const host=document.getElementById('savedPlanPanel');if(!host)return;
 document.getElementById('saveCurrentPlan').addEventListener('click',plannerSaveCurrent);
 host.addEventListener('click',e=>{
  const b=e.target.closest('[data-saved-compare],[data-saved-restore],[data-saved-delete]');if(!b)return;
  if(b.dataset.savedCompare){selectedSavedPlanId=b.dataset.savedCompare;renderSavedPlanPanel()}
  else if(b.dataset.savedRestore)plannerRestorePlan(b.dataset.savedRestore);
  else if(b.dataset.savedDelete)plannerDeletePlan(b.dataset.savedDelete);
 });
}
