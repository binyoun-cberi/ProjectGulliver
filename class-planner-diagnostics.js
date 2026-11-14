/* Read-only preflight: detects provable clashes, never claims exhaustive feasibility. */
function analyzePlannerConstraints(input={}){
 const students=Array.isArray(input.students)?input.students:[],k=Number(input.classCount)||0;
 const blocking=[],advisory=[],seen=new Set();
 const issue=(list,code,message,action)=>{if(seen.has(code)||list.length>=12)return;seen.add(code);list.push({code,message,action})};
 const label=s=>!s?'알 수 없는 학생':String(s.name||'(이름 없음)')+([s.oldClass,s.number?s.number+'번':''].filter(Boolean).length?' ('+[s.oldClass,s.number?s.number+'번':''].filter(Boolean).join(' ')+')':'');
 if(!Number.isInteger(k)||k<2||k>12)return {blocking:[],advisory:[{code:'class-count',message:'새 반 수를 2~12개 사이로 확인해 주세요.',action:'roster'}]};
 if(!students.length)return {blocking:[],advisory:[{code:'empty',message:'편성할 학생 명단이 없습니다.',action:'roster'}]};
 const byId=new Map(students.map(s=>[s.id,s])),parent=new Map(students.map(s=>[s.id,s.id]));
 function find(id){let root=id;while(parent.get(root)!==root)root=parent.get(root);while(parent.get(id)!==root){const next=parent.get(id);parent.set(id,root);id=next}return root}
 for(const p of input.together||[])if(byId.has(p.a)&&byId.has(p.b)&&p.a!==p.b)parent.set(find(p.a),find(p.b));
 const groups=new Map();
 for(const s of students){const root=find(s.id);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(s)}
 const limit=Math.ceil(students.length/k),fixedCount=Array(k).fill(0),fixedGroups=new Map();
 for(const [root,members] of groups){
  const fixed=[...new Set(members.filter(s=>Number.isInteger(s.fixed)&&s.fixed>=1&&s.fixed<=k).map(s=>s.fixed))];
  if(fixed.length>1)issue(blocking,'twin-fixed-'+root,members.map(label).join(' · ')+': 같은 반 관계인데 교사 지정 반이 서로 다릅니다.','preset');
  if(members.length>limit)issue(blocking,'twin-capacity-'+root,members.map(label).join(' · ')+': 같은 반 묶음 '+members.length+'명이 반별 목표 상한 '+limit+'명을 넘습니다.','rules');
  if(fixed.length===1){fixedGroups.set(root,fixed[0]);fixedCount[fixed[0]-1]+=members.length}
 }
 for(let i=0;i<k;i++)if(fixedCount[i]>limit)issue(blocking,'room-over-'+i,(i+1)+'반의 고정 배정 '+fixedCount[i]+'명이 반별 목표 상한 '+limit+'명을 넘습니다.','preset');
 const graph=new Map([...groups.keys()].map(id=>[id,new Set()]));
 const hard=Array.isArray(input.separations)?input.separations:[];
 for(const p of hard){
  if(!byId.has(p.a)||!byId.has(p.b)||p.a===p.b)continue;
  const a=find(p.a),b=find(p.b);
  if(a===b){issue(blocking,'same-and-apart-'+[p.a,p.b].sort().join('-'),label(byId.get(p.a))+' / '+label(byId.get(p.b))+': 같은 반 묶음과 다른 반 조건이 충돌합니다.','rules');continue}
  graph.get(a).add(b);graph.get(b).add(a);
  if(fixedGroups.get(a)&&fixedGroups.get(a)===fixedGroups.get(b)){
   issue(blocking,'fixed-pair-'+[a,b].sort().join('-'),label(byId.get(p.a))+' / '+label(byId.get(p.b))+': 서로 분리해야 하지만 '+fixedGroups.get(a)+'반에 함께 고정되어 있습니다.','preset');
  }
 }
 for(const [root,neighbors] of graph){
  if(fixedGroups.has(root)||!neighbors.size)continue;
  const unavailable=new Set([...neighbors].map(id=>fixedGroups.get(id)).filter(Boolean));
  if(unavailable.size===k)issue(blocking,'no-room-'+root,label(groups.get(root)[0])+' 학생을 배정할 반이 없습니다. 분리 대상들이 모든 반에 고정되어 있습니다.','preset');
 }
 // Discover a k+1 complete clique with a bounded search. No clique found is not proof of feasibility.
 let budget=7000,clique=null;
 const nodes=[...graph.keys()].filter(id=>graph.get(id).size>=k).sort((a,b)=>graph.get(a).size-graph.get(b).size);
 function visit(chosen,candidates){
  if(clique||budget--<=0)return;
  if(chosen.length===k+1){clique=chosen;return}
  if(chosen.length+candidates.length<k+1)return;
  for(let i=0;i<candidates.length&&!clique&&budget>0;i++){
   const id=candidates[i],next=candidates.slice(i+1).filter(v=>graph.get(id).has(v));
   visit([...chosen,id],next);
  }
 }
 for(const id of nodes){if(clique||budget<=0)break;visit([id],nodes.filter(v=>v>id&&graph.get(id).has(v)))}
 if(clique)issue(blocking,'separation-clique','서로 다른 반이 필요한 '+(k+1)+'개 학생 묶음에 비해 새 반은 '+k+'개입니다: '+clique.map(id=>label(groups.get(id)[0])).join(' · '),'rules');
 for(const [trait,raw] of Object.entries(input.capRules||{})){
  const max=Number(raw);if(!Number.isInteger(max)||max<0||raw===''||raw===null)continue;
  const related=students.filter(s=>(s.traits||[]).includes(trait));
  if(related.length>k*max)issue(advisory,'cap-total-'+trait,trait+' '+related.length+'명은 '+k+'개 반에 반당 '+max+'명 이하로 모두 분산할 수 없습니다. 이 상한은 선호 조건이므로 편성 결과를 검토하세요.','roster');
  const perRoom=Array(k).fill(0);
  for(const st of related){const room=fixedGroups.get(find(st.id));if(room)perRoom[room-1]++}
  for(let i=0;i<k;i++)if(perRoom[i]>max)issue(advisory,'cap-fixed-'+trait+'-'+i,trait+': '+(i+1)+'반 고정 학생만 '+perRoom[i]+'명으로 선호 상한 '+max+'명을 넘습니다.','preset');
 }
 return {blocking,advisory,summary:{students:students.length,classes:k,relationships:hard.length}};
}
function plannerDiagnosticsCurrent(){
 return analyzePlannerConstraints({students:activeStudents(),separations:allocationPairs(state.students,hardSeparationPairs()),together:allocationPairs(state.students,twinRelations(state.twinGroups).together),classCount:state.classCount,capRules:state.capRules});
}
let plannerDiagnosticStatus=null;
function clearPlannerDiagnostics(){plannerDiagnosticStatus=null}
function showPlannerDiagnostics(error=''){plannerDiagnosticStatus={report:plannerDiagnosticsCurrent(),error};renderPlannerDiagnostics()}
function renderPlannerDiagnostics(){
 const host=document.getElementById('plannerDiagnosticReport');
 if(!host)return;
 if(!plannerDiagnosticStatus){host.hidden=true;host.innerHTML='';return}
 const {report,error}=plannerDiagnosticStatus,issues=[...report.blocking,...report.advisory];
 const title=report.blocking.length?'확인된 편성 조건 충돌 '+report.blocking.length+'건':error?'명백한 조건 충돌은 발견하지 못했습니다.':'기본 조건 점검 결과';
 const safe=x=>escapeHtml(x),actions={preset:'교사 우선 배치 보기',rules:'분리·쌍생아 관계 보기',roster:'명단·상한 설정 보기'};
 host.hidden=false;
 host.innerHTML='<h3>'+title+'</h3>'+
 (error?'<p class="planner-diagnostic-error">자동 편성 안내: '+safe(error)+'</p>':'')+
 (issues.length?'<ul>'+issues.map(item=>'<li class="'+(report.blocking.includes(item)?'blocking':'advisory')+'"><span>'+(report.blocking.includes(item)?'확인된 충돌':'선호 조건 안내')+'</span><p>'+safe(item.message)+'</p><button type="button" class="btn small" data-diagnostic-go="'+item.action+'">'+actions[item.action]+'</button></li>').join('')+'</ul>':
 '<p>고정 배정·개별 분리·같은 반 묶음에서 즉시 판별 가능한 충돌을 찾지 못했습니다.</p>')+
 '<p class="planner-diagnostic-foot">일부 명백한 충돌만 확인하는 보조 점검입니다. 충돌이 없다는 것이 편성 가능함을 증명하지 않으며, 탐색 실패도 불가능을 증명하지 않습니다. 유의사항별 최대 인원은 선호 조건입니다. 학생 정보는 외부로 전송하지 않습니다.</p>';
}
function installPlannerDiagnostics(){
 const button=document.getElementById('checkConditions');if(!button)return;
 button.addEventListener('click',()=>{
  if(!state.students.length){showTab('roster');toast('먼저 학생을 입력해 주세요.');return}
  showPlannerDiagnostics();showTab('results');
 });
 document.getElementById('plannerDiagnosticReport').addEventListener('click',e=>{
  const go=e.target.closest('[data-diagnostic-go]');if(!go)return;
  if(go.dataset.diagnosticGo==='preset'&&!state.teacherPriorityOn){showTab('roster');return}
  showTab(go.dataset.diagnosticGo);
 });
}
