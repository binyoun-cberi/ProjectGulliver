/* Floating trait palette. Student records and undo remain owned by the roster. */
const TRAIT_REMOTE_MIME='application/x-clasheet-trait';
const traitRemoteUI={open:true,collapsed:typeof matchMedia==='function'&&matchMedia('(max-width: 700px)').matches,position:null,studentId:null,tag:null,dragTag:null,pointer:null,suppressClickUntil:0};
function setStudentTrait(student,tag,add){
 const next=new Set(student.traits||[]);add?next.add(tag):next.delete(tag);
 return {...student,traits:[...next]};
}
function changeRosterTrait(id,tag,add=true){
 const student=findStudent(id);
 if(!student||!state.traits.includes(tag)||student.traits.includes(tag)===add)return false;
 rosterSaveUndo();const updated=setStudentTrait(student,tag,add);
 state.students=state.students.map(st=>st.id===id?updated:st);
 traitRemoteUI.studentId=id;
 invalidate();saveState();renderRoster();renderOverview();
 return true;
}
function traitRemoteTarget(id){
 if(traitRemoteUI.studentId===id)return;
 traitRemoteUI.studentId=id;
 $('rosterBody').querySelectorAll('.trait-current-row').forEach(tr=>tr.classList.remove('trait-current-row'));
 $('rosterBody').querySelector('[data-student="'+CSS.escape(id)+'"]')?.classList.add('trait-current-row');
 renderTraitRemote();
}
function renderStudentTraits(st){
 return '<div class="student-trait-tags">'+st.traits.map(tag=>'<span class="student-trait-chip"><span>'+escapeHtml(tag)+'</span><button type="button" data-remove-trait="'+escapeHtml(tag)+'" aria-label="'+escapeHtml(st.name||'학생')+' '+escapeHtml(tag)+' 삭제">×</button></span>').join('')+
 (st.traits.length?'':'<span class="student-trait-placeholder">유의 사항 놓기</span>')+'</div>'+
 '<input hidden tabindex="-1" data-key="traitsText" value="'+escapeHtml(st.traits.join('; '))+'" aria-label="'+escapeHtml(st.name)+' 유의 사항 직접 입력">'+
 (st.fixed?'<span class="note-inline">◆ '+st.fixed+'반 '+(state.teacherPriorityOn?'고정':'지정 보관')+'</span>':'')+
 (st.note?'<button type="button" class="btn ghost small" data-note="'+escapeHtml(st.id)+'" aria-label="'+escapeHtml(st.name)+' 참고 메모 수정">메모</button>':'');
}
function saveTraitRemoteUI(){
 try{localStorage.setItem('classplanner-trait-remote-ui-v1',JSON.stringify({open:traitRemoteUI.open,collapsed:traitRemoteUI.collapsed,position:traitRemoteUI.position}))}catch{}
}
function positionTraitRemote(){
 const panel=$('traitRemote');if(panel.hidden)return;
 const box=panel.getBoundingClientRect(),point=traitRemoteUI.position||{x:box.left,y:box.top};
 const header=document.querySelector('.gx-header')?.getBoundingClientRect(),nav=document.querySelector('.tabs')?.getBoundingClientRect();
 const guard=(header?.bottom||0)+8,grip=$('traitRemoteGrip').getBoundingClientRect().height;
 const x=Math.max(8,Math.min(innerWidth-box.width-8,point.x));
 const desiredBody=traitRemoteUI.collapsed?0:Math.min(innerHeight*.62,500);
 let y=Math.max(guard,Math.min(innerHeight-grip-desiredBody-16,point.y)),bottom=innerHeight-8;
 if(nav&&nav.top<innerHeight-80&&nav.bottom>guard&&nav.right>x&&nav.left<x+box.width&&nav.top<y+box.height&&nav.bottom>y){
  if(innerHeight-nav.bottom>150)y=nav.bottom+8;
  else {y=guard;bottom=Math.max(guard+grip+70,nav.top-8)}
 }
 $('traitRemoteBody').style.maxHeight=Math.max(70,Math.min(innerHeight*.62,500,bottom-y-grip))+'px';
 const height=panel.getBoundingClientRect().height;y=Math.max(guard,Math.min(innerHeight-height-8,y));
 panel.style.left=x+'px';panel.style.top=y+'px';panel.style.right='auto';panel.style.bottom='auto';
}
function renderTraitRemote(){
 const panel=$('traitRemote');if(!panel)return;
 panel.hidden=view!=='roster'||!traitRemoteUI.open;
 $('toggleTraitRemote').setAttribute('aria-expanded',String(!panel.hidden));
 $('view-roster').classList.toggle('trait-remote-space',!panel.hidden&&!traitRemoteUI.collapsed);
 panel.classList.toggle('is-collapsed',traitRemoteUI.collapsed);
 $('traitRemoteBody').hidden=traitRemoteUI.collapsed;
 $('collapseTraitRemote').setAttribute('aria-expanded',String(!traitRemoteUI.collapsed));
 $('collapseTraitRemote').textContent=traitRemoteUI.collapsed?'펼치기':'접기';
 if(panel.hidden)return;
 if(traitRemoteUI.tag&&!state.traits.includes(traitRemoteUI.tag))traitRemoteUI.tag=null;
 const student=traitRemoteUI.studentId&&findStudent(traitRemoteUI.studentId);
 const shown=student&&$('rosterBody').querySelector('[data-student="'+CSS.escape(student.id)+'"]');
 if(!shown)traitRemoteUI.studentId=null;
 $('traitRemoteStudent').textContent=shown?studentTitle(student):'학생 행을 선택하세요';
 $('traitRemoteNote').disabled=!shown;
 $('traitRemoteFixedWrap').hidden=!state.teacherPriorityOn;
 $('traitRemoteFixed').disabled=!shown;
 $('traitRemoteFixed').innerHTML='<option value="0">미고정</option>'+Array.from({length:state.classCount},(_,i)=>'<option value="'+(i+1)+'" '+(shown&&student.fixed===i+1?'selected':'')+'>'+(i+1)+'반 고정</option>').join('');
 const q=$('traitRemoteSearch').value.trim().toLowerCase();
 $('traitRemotePalette').innerHTML=state.traits.filter(t=>t.toLowerCase().includes(q)).map(tag=>'<button type="button" draggable="true" data-remote-trait="'+escapeHtml(tag)+'" aria-pressed="'+(traitRemoteUI.tag===tag)+'">'+escapeHtml(tag)+'</button>').join('')||'<span class="muted">검색 결과 없음</span>';
 $('traitRemoteStatus').textContent=traitRemoteUI.tag?'선택: '+traitRemoteUI.tag+' · 학생 행에 놓거나 유의 사항 칸을 누르세요.':'버튼을 학생 행에 끌어 놓으세요.';
 if(traitRemoteUI.studentId)$('rosterBody').querySelector('[data-student="'+CSS.escape(traitRemoteUI.studentId)+'"]')?.classList.add('trait-current-row');
 positionTraitRemote();
}
function clearTraitDrop(){
 traitRemoteUI.dragTag=null;
 $('rosterBody').querySelectorAll('.trait-drop-target').forEach(tr=>tr.classList.remove('trait-drop-target'));
 document.querySelector('.trait-drag-ghost')?.remove();
}
function traitDropRow(node){const tr=node?.closest?.('tr[data-student]');return tr&&$('rosterBody').contains(tr)?tr:null}
function scrollTraitDrop(y){
 const wrap=$('rosterBody').closest('.roster-sheet-wrap'),box=wrap.getBoundingClientRect();
 if(y<box.top+42)wrap.scrollTop-=18;else if(y>box.bottom-42)wrap.scrollTop+=18;
 if(y<65)window.scrollBy(0,-14);else if(y>innerHeight-40)window.scrollBy(0,14);
}
function markTraitDrop(tr){
 $('rosterBody').querySelectorAll('.trait-drop-target').forEach(row=>{if(row!==tr)row.classList.remove('trait-drop-target')});
 tr?.classList.add('trait-drop-target');
}
function installTraitRemote(){
 try{const old=JSON.parse(localStorage.getItem('classplanner-trait-remote-ui-v1'));if(old){traitRemoteUI.open=old.open!==false;if(typeof old.collapsed==='boolean')traitRemoteUI.collapsed=old.collapsed;if(Number.isFinite(old.position?.x)&&Number.isFinite(old.position?.y))traitRemoteUI.position={x:old.position.x,y:old.position.y}}}catch{}
 $('toggleTraitRemote').addEventListener('click',()=>{traitRemoteUI.open=!traitRemoteUI.open;renderTraitRemote();saveTraitRemoteUI()});
 $('closeTraitRemote').addEventListener('click',()=>{traitRemoteUI.open=false;renderTraitRemote();saveTraitRemoteUI();$('toggleTraitRemote').focus()});
 $('collapseTraitRemote').addEventListener('click',()=>{traitRemoteUI.collapsed=!traitRemoteUI.collapsed;renderTraitRemote();saveTraitRemoteUI()});
 $('traitRemoteBody').addEventListener('click',e=>{const button=e.target.closest('[data-remote-color]');if(button){$('rosterFillColor').value=button.dataset.remoteColor;rosterApplyFormat('background',button.dataset.remoteColor)}});
 $('traitRemoteSearch').addEventListener('input',renderTraitRemote);
 $('traitRemote').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();traitRemoteUI.open=false;renderTraitRemote();saveTraitRemoteUI();$('toggleTraitRemote').focus()}});
 $('traitRemoteNote').addEventListener('click',()=>{const s=findStudent(traitRemoteUI.studentId);if(!s)return;noteStudentId=s.id;$('noteTitle').textContent=(s.name||'학생')+' 메모';$('noteText').value=s.note;$('noteDialog').showModal()});
 $('traitRemoteFixed').addEventListener('change',e=>{if(traitRemoteUI.studentId)tryPreset(traitRemoteUI.studentId,Number(e.target.value));renderTraitRemote()});
 $('traitRemotePalette').addEventListener('click',e=>{
  if(Date.now()<traitRemoteUI.suppressClickUntil)return;
  const button=e.target.closest('[data-remote-trait]');if(!button)return;
  traitRemoteUI.tag=traitRemoteUI.tag===button.dataset.remoteTrait?null:button.dataset.remoteTrait;
  if(matchMedia('(max-width: 700px)').matches&&traitRemoteUI.tag)traitRemoteUI.collapsed=true;
  renderTraitRemote();$('traitRemotePalette').querySelector('[data-remote-trait="'+CSS.escape(button.dataset.remoteTrait)+'"]')?.focus();
 });
 $('traitRemotePalette').addEventListener('dragstart',e=>{const button=e.target.closest('[data-remote-trait]');if(!button)return;traitRemoteUI.dragTag=button.dataset.remoteTrait;e.dataTransfer.setData(TRAIT_REMOTE_MIME,traitRemoteUI.dragTag);e.dataTransfer.effectAllowed='copy'});
 $('traitRemotePalette').addEventListener('dragend',clearTraitDrop);
 $('rosterBody').addEventListener('dragover',e=>{if(!traitRemoteUI.dragTag||!state.traits.includes(traitRemoteUI.dragTag))return;const tr=traitDropRow(e.target);if(!tr)return;e.preventDefault();e.dataTransfer.dropEffect='copy';markTraitDrop(tr);scrollTraitDrop(e.clientY)});
 $('rosterBody').addEventListener('dragleave',e=>{const tr=traitDropRow(e.target);if(tr&&!tr.contains(e.relatedTarget))tr.classList.remove('trait-drop-target')});
 $('rosterBody').addEventListener('drop',e=>{const tag=traitRemoteUI.dragTag||e.dataTransfer?.getData(TRAIT_REMOTE_MIME),tr=traitDropRow(e.target);if(!tr||!state.traits.includes(tag))return;e.preventDefault();e.stopPropagation();const id=tr.dataset.student;clearTraitDrop();changeRosterTrait(id,tag)});
 $('rosterBody').addEventListener('focusin',e=>{const tr=traitDropRow(e.target);if(tr)traitRemoteTarget(tr.dataset.student)});
 $('rosterBody').addEventListener('click',e=>{
  const tr=traitDropRow(e.target);if(!tr)return;
  traitRemoteTarget(tr.dataset.student);
  const remove=e.target.closest('[data-remove-trait]');if(remove){changeRosterTrait(tr.dataset.student,remove.dataset.removeTrait,false);return}
  if(traitRemoteUI.tag&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.target.closest('[data-roster-cell="traits"]')&&!e.target.closest('button,input,select'))changeRosterTrait(tr.dataset.student,traitRemoteUI.tag);
 });
 $('rosterBody').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-roster-cell="traits"]')&&traitRemoteUI.tag){e.preventDefault();changeRosterTrait(e.target.closest('[data-student]').dataset.student,traitRemoteUI.tag)}});
 $('rosterBody').addEventListener('dblclick',e=>{const td=e.target.closest('[data-roster-cell="traits"]');if(!td||e.target.closest('button'))return;const field=td.querySelector('[data-key="traitsText"]');field.hidden=false;field.focus();field.select()});
 $('rosterBody').addEventListener('focusout',e=>{if(e.target.dataset.key==='traitsText')e.target.hidden=true});
 // Touch/pen dragging uses pointer capture; a tap selects a button for tap-to-apply.
 $('traitRemotePalette').addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;const button=e.target.closest('[data-remote-trait]');if(!button)return;
  traitRemoteUI.pointer={kind:'tag',tag:button.dataset.remoteTrait,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};button.setPointerCapture(e.pointerId);
 });
 const grip=$('traitRemoteGrip');
 grip.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button'))return;e.preventDefault();const box=$('traitRemote').getBoundingClientRect();traitRemoteUI.pointer={kind:'panel',x:e.clientX,y:e.clientY,left:box.left,top:box.top,id:e.pointerId,moved:false};grip.setPointerCapture(e.pointerId)});
 grip.addEventListener('keydown',e=>{const direction={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];if(!direction)return;e.preventDefault();const b=$('traitRemote').getBoundingClientRect();traitRemoteUI.position={x:b.left+direction[0],y:b.top+direction[1]};positionTraitRemote();saveTraitRemoteUI()});
 document.addEventListener('pointermove',e=>{
  const pointer=traitRemoteUI.pointer;if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(Math.hypot(dx,dy)>6)pointer.moved=true;
  if(pointer.kind==='panel'){traitRemoteUI.position={x:pointer.left+dx,y:pointer.top+dy};positionTraitRemote();return}
  if(!pointer.moved)return;e.preventDefault();
  let ghost=document.querySelector('.trait-drag-ghost');if(!ghost){ghost=document.createElement('div');ghost.className='trait-drag-ghost';ghost.textContent=pointer.tag;document.body.append(ghost)}
  ghost.style.left=e.clientX+12+'px';ghost.style.top=e.clientY+12+'px';markTraitDrop(traitDropRow(document.elementFromPoint(e.clientX,e.clientY)));scrollTraitDrop(e.clientY);
 },{passive:false});
 function pointerEnd(e){
  const pointer=traitRemoteUI.pointer;if(!pointer||pointer.id!==e.pointerId)return;traitRemoteUI.pointer=null;
  if(pointer.kind==='panel'){saveTraitRemoteUI();return}
  const tr=pointer.moved&&e.type!=='pointercancel'?traitDropRow(document.elementFromPoint(e.clientX,e.clientY)):null;
  if(pointer.moved)traitRemoteUI.suppressClickUntil=Date.now()+450;
  clearTraitDrop();if(tr)changeRosterTrait(tr.dataset.student,pointer.tag);
 }
 document.addEventListener('pointerup',pointerEnd);document.addEventListener('pointercancel',pointerEnd);
 window.addEventListener('resize',positionTraitRemote);window.addEventListener('scroll',positionTraitRemote,{passive:true});
}
