/* Explicit sibling relationships: every pair in a triplet has its own policy. */
function normalizeTwinGroups(value,validIds){
 const seen=new Set();return (Array.isArray(value)?value:[]).slice(0,100).filter(g=>g&&typeof g==='object').map((g,i)=>{
  let id=String(g.id||'twins-'+i);while(seen.has(id))id+='-';seen.add(id);
  const members=[...new Set((Array.isArray(g.members)?g.members:[]).filter(id=>typeof id==='string'&&validIds.has(id)))].slice(0,3);
  const rules=[],keys=new Set();for(const r of Array.isArray(g.rules)?g.rules:[]){if(!r||!members.includes(r.a)||!members.includes(r.b)||r.a===r.b||!['together','apart'].includes(r.mode))continue;const key=JSON.stringify([r.a,r.b].sort());if(keys.has(key))continue;keys.add(key);rules.push({a:r.a,b:r.b,mode:r.mode})}
  return {id,members,rules};
 });
}
function twinRelations(groups){const together=[],apart=[];for(const group of groups||[])for(const r of group.rules||[])if(group.members.includes(r.a)&&group.members.includes(r.b)&&r.a!==r.b){if(r.mode==='together')together.push({a:r.a,b:r.b});if(r.mode==='apart')apart.push({a:r.a,b:r.b})}return {together,apart}}
function twinAssignmentProblems(groups,assign){const problems=[];const r=twinRelations(groups);for(const p of r.together)if(assign[p.a]&&assign[p.b]&&assign[p.a]!==assign[p.b])problems.push('쌍생아 같은 반 조건 위반');for(const p of r.apart)if(assign[p.a]&&assign[p.a]===assign[p.b])problems.push('쌍생아 다른 반 조건 위반');return problems}
function generateTwinCandidates(students,pairs,k,traits,random,caps,softPairs,groups,weights={}){
 const relations=twinRelations(groups),hard=[...pairs,...relations.apart];
 if(!relations.together.length)return generateCandidates(students,hard,k,traits,random,caps,softPairs,weights);
 const parent=new Map(students.map(s=>[s.id,s.id])),find=id=>{let p=id;while(parent.get(p)!==p)p=parent.get(p);while(parent.get(id)!==id){const next=parent.get(id);parent.set(id,p);id=next}return p};
 for(const p of relations.together)if(parent.has(p.a)&&parent.has(p.b))parent.set(find(p.a),find(p.b));
 for(const p of hard)if(parent.has(p.a)&&parent.has(p.b)&&find(p.a)===find(p.b))return {error:'같은 반으로 묶은 쌍생아 사이에 다른 반 조건이 있습니다. 3단계의 관계를 확인해 주세요.'};
 const components=new Map();for(const s of students){const root=find(s.id);if(!components.has(root))components.set(root,[]);components.get(root).push(s)}
 const blocks=[...components.values()].filter(g=>g.length>1),limit=Math.ceil(students.length/k);
 for(const block of blocks){if(new Set(block.filter(s=>s.fixed).map(s=>s.fixed)).size>1)return {error:'같은 반 쌍생아가 서로 다른 반에 고정되어 있습니다. 교사 우선 배치를 확인해 주세요.'};if(block.length>limit)return {error:'같은 반으로 묶은 쌍생아 수가 반별 인원을 넘습니다. 반 수나 쌍생아 조건을 확인해 주세요.'}}
 const members=new Set(blocks.flat().map(s=>s.id)),assign=Object.fromEntries(students.filter(s=>s.fixed&&!members.has(s.id)).map(s=>[s.id,s.fixed])),counts=Array(k).fill(0);
 for(const room of Object.values(assign))counts[room-1]++;
 if(counts.some(n=>n>limit))return {error:'반별 적정 인원보다 고정 배정 학생이 많습니다. 새 반 고정을 수정해 주세요.'};
 blocks.sort((a,b)=>Number(b.some(s=>s.fixed))-Number(a.some(s=>s.fixed))||b.length-a.length);
 const candidates=[],seen=new Set();let nodes=0,leaves=0;
 function search(index){
  if(++nodes>24000||leaves>=8)return;
  if(index===blocks.length){leaves++;const pinned=students.map(s=>members.has(s.id)?{...s,fixed:assign[s.id]}:s),result=generateCandidates(pinned,hard,k,traits,random,caps,softPairs,weights);for(const c of result.candidates||[]){const signature=students.map(s=>c.assign[s.id]).join(',');if(!seen.has(signature)){seen.add(signature);candidates.push(c)}}return}
  const block=blocks[index],fixed=block.find(s=>s.fixed)?.fixed;
  const rooms=(fixed?[fixed]:Array.from({length:k},(_,i)=>i+1)).map(room=>{
   let cost=counts[room-1]*10+random()*8;const combined={...assign};for(const s of block)combined[s.id]=room;
   for(const [tag,cap] of Object.entries(caps||{})){const n=students.filter(s=>combined[s.id]===room&&s.traits.includes(tag)).length;cost+=Math.max(0,n-cap)*1000}
   for(const p of softPairs||[])if(combined[p.a]===room&&combined[p.b]===room)cost+=1000*normalizeAllocationWeights(weights).basket;
   return {room,cost};
  }).sort((a,b)=>a.cost-b.cost);
  for(const {room} of rooms){if(counts[room-1]+block.length>limit)continue;for(const s of block)assign[s.id]=room;
   const invalid=hard.some(p=>assign[p.a]&&assign[p.a]===assign[p.b]);
   if(!invalid){counts[room-1]+=block.length;search(index+1);counts[room-1]-=block.length}
   for(const s of block)delete assign[s.id];if(nodes>24000||leaves>=8)break;
  }
 }
 search(0);
 if(!candidates.length)return {error:'쌍생아 관계·분리 조건·반 고정을 지키는 편성안을 찾지 못했습니다. 3단계의 관계를 확인해 주세요.'};
 candidates.sort((a,b)=>{const pa=preferencePenalty(students,a.assign,k,caps,softPairs,weights),pb=preferencePenalty(students,b.assign,k,caps,softPairs,weights);return pa.total-pb.total||pa.square-pb.square||a.score-b.score});
 return {candidates:candidates.slice(0,3),successes:candidates.length};
}
const twinSearch=new Map();
function twinMemberOptions(group){const used=new Set((state.twinGroups||[]).flatMap(g=>g.members)),query=(twinSearch.get(group.id)||'').toLowerCase();return '<option value="">연결할 학생 선택</option>'+state.students.filter(s=>!used.has(s.id)&&studentTitle(s).toLowerCase().includes(query)).sort((a,b)=>Number(b.traits.includes('쌍생아'))-Number(a.traits.includes('쌍생아'))||a.name.localeCompare(b.name,'ko')).map(s=>'<option value="'+escapeHtml(s.id)+'">'+escapeHtml(studentTitle(s))+'</option>').join('')}
function renderTwinGroups(){
 const groups=state.twinGroups||[];$('twinCount').textContent=groups.length+'묶음';
 $('twinGroups').innerHTML=groups.map((g,index)=>{
  const pairs=[];for(let i=0;i<g.members.length;i++)for(let j=i+1;j<g.members.length;j++)pairs.push([g.members[i],g.members[j]]);
  return '<article class="twin-card" data-twin-group="'+escapeHtml(g.id)+'"><div class="twin-card-head"><strong>쌍생아 '+(index+1)+' <small>'+g.members.length+'/3명</small></strong><button type="button" class="btn ghost small" data-twin-delete="'+escapeHtml(g.id)+'">묶음 삭제</button></div><div class="twin-members">'+g.members.map(id=>'<span>'+escapeHtml(studentTitle(findStudent(id)))+'<button type="button" data-twin-remove="'+escapeHtml(id)+'" aria-label="'+escapeHtml(studentTitle(findStudent(id)))+' 관계에서 제외">×</button></span>').join('')+'</div>'+(g.members.length<3?'<div class="twin-add"><input type="search" data-twin-search="'+escapeHtml(g.id)+'" aria-label="쌍생아 학생 검색" placeholder="이름·기존 반 검색" value="'+escapeHtml(twinSearch.get(g.id)||'')+'"><select data-twin-member="'+escapeHtml(g.id)+'" aria-label="쌍생아 학생 연결">'+twinMemberOptions(g)+'</select></div>':'')+'<div class="twin-pairs">'+pairs.map(([a,b])=>{const mode=g.rules.find(r=>r.a===a&&r.b===b||r.a===b&&r.b===a)?.mode||'any';return '<label><span>'+escapeHtml(findStudent(a)?.name||a)+' ↔ '+escapeHtml(findStudent(b)?.name||b)+'</span><select data-twin-rule="'+escapeHtml(g.id)+'" data-a="'+escapeHtml(a)+'" data-b="'+escapeHtml(b)+'" aria-label="'+escapeHtml(studentTitle(findStudent(a)))+' · '+escapeHtml(studentTitle(findStudent(b)))+' 배정 관계">'+[['any','제한 없음'],['together','같은 반'],['apart','다른 반']].map(([value,label])=>'<option value="'+value+'" '+(mode===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'}).join('')+'</div>'+(g.members.length<2?'<p class="helper">쌍생아 학생을 두 명 이상 연결하세요.</p>':'')+'</article>';
 }).join('')||'<p class="helper">쌍생아 묶음을 만들고 함께 태어난 학생들을 연결하세요.</p>';
}
function installTwinGroups(){
 $('addTwinGroup').addEventListener('click',()=>{if((state.twinGroups||[]).length>=100){toast('쌍생아 묶음은 최대 100개입니다.');return}state.twinGroups.push({id:makeId(),members:[],rules:[]});invalidate();changeState()});
 $('twinGroups').addEventListener('input',e=>{const id=e.target.dataset.twinSearch;if(!id)return;twinSearch.set(id,e.target.value);const group=state.twinGroups.find(g=>g.id===id);e.target.closest('[data-twin-group]').querySelector('[data-twin-member]').innerHTML=twinMemberOptions(group)});
 $('twinGroups').addEventListener('change',e=>{
  const id=e.target.dataset.twinMember||e.target.dataset.twinRule,group=state.twinGroups.find(g=>g.id===id);if(!group)return;
  if(e.target.dataset.twinMember){const student=findStudent(e.target.value);if(!student||group.members.length>=3||state.twinGroups.some(g=>g.members.includes(student.id)))return;if(!state.traits.includes('쌍생아')){if(state.traits.length>=64){toast('유의 사항 항목을 정리한 뒤 다시 연결하세요.');return}state.traits.push('쌍생아')}group.members.push(student.id);if(!student.traits.includes('쌍생아'))student.traits.push('쌍생아');twinSearch.delete(id)}
  else {const {a,b}=e.target.dataset;group.rules=group.rules.filter(r=>!(r.a===a&&r.b===b||r.a===b&&r.b===a));if(['together','apart'].includes(e.target.value))group.rules.push({a,b,mode:e.target.value})}
  invalidate();changeState();
 });
 $('twinGroups').addEventListener('click',e=>{const remove=e.target.closest('[data-twin-remove]'),del=e.target.closest('[data-twin-delete]');if(del)state.twinGroups=state.twinGroups.filter(g=>g.id!==del.dataset.twinDelete);else if(remove){const group=state.twinGroups.find(g=>g.id===remove.closest('[data-twin-group]').dataset.twinGroup);group.members=group.members.filter(id=>id!==remove.dataset.twinRemove);group.rules=group.rules.filter(r=>r.a!==remove.dataset.twinRemove&&r.b!==remove.dataset.twinRemove)}else return;invalidate();changeState()});
}
