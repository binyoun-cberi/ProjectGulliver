/* Result cards share the roster's persistent name styles; assignments stay untouched. */
const resultFormatUndo=[];
function resultNameFormat(student){return {...student?.cellFormats?.name,bold:student?.cellFormats?.name?.bold!==false,background:student?.color||''}}
function resultFormatCells(){const id=traitRemoteUI.resultStudentId;return findStudent(id)?[[id,'name']]:[]}
function renderResultStudent(s,number,room){
 const locked=!!(state.teacherPriorityOn&&s.fixed),id=escapeHtml(s.id),selected=traitRemoteUI.resultStudentId===s.id;
 const original=[s.oldClass,s.number?s.number+'번':''].filter(Boolean).join(' ');
 return `<div class="assigned ${moveSelectedId===s.id?'move-selected':''} ${selected?'format-selected':''}" style="${state.showSourceColors!==false?'--source-color:'+sourceRoomColor(s)+';':''}" data-result-student="${id}" data-assigned-class="${room}" data-locked="${locked}" draggable="${!locked}" aria-label="${escapeHtml(studentTitle(s))}"><div class="person"><div class="student-line"><div class="drag-handle student-number" data-select-move="${id}" role="button" tabindex="0" aria-pressed="${moveSelectedId===s.id}" aria-label="${escapeHtml(s.name)} ${number}번 · ${locked?'고정 학생, 색상 선택':'선택 또는 드래그하여 이동'}" title="${locked?'교사 우선 배치로 고정':'번호를 잡아 다른 반으로 이동 · 클릭하여 선택'}">${number}</div><b class="student-name-highlight" style="${studentNameStyle(s.color)+cellFormatStyle(resultNameFormat(s))}">${escapeHtml(s.name)}${locked?' <span class="warning-dot" title="교사 우선 배치로 고정">◆</span>':''}</b><span class="student-gender" aria-label="성별 ${escapeHtml(s.gender||'미입력')}">${escapeHtml(s.gender||'—')}</span></div><div class="student-traits-line"><span class="student-line-label">유의사항</span><span class="student-traits-value">${s.traits.length?s.traits.map(t=>'<span>'+escapeHtml(t)+(t==='전학 예정'?' · 편성 후':'')+'</span>').join(''):'<span class="no-traits">—</span>'}</span></div><small class="student-origin">${escapeHtml(original?'기존 '+original:'기존 반·번호 미입력')}${hasStudyScore(s)?' · 학습 '+escapeHtml(studyText(s.level)):''}</small></div></div>`;
}
function selectResultStudent(id,toggle=false){
 const student=findStudent(id);if(!student)return;
 traitRemoteUI.resultStudentId=id;
 moveSelectedId=state.teacherPriorityOn&&student.fixed?null:(toggle&&moveSelectedId===id?null:id);
 document.querySelectorAll('#resultGrid [data-result-student]').forEach(card=>{
  card.classList.toggle('format-selected',card.dataset.resultStudent===id);
  card.classList.toggle('move-selected',card.dataset.resultStudent===moveSelectedId);
  card.querySelector('[data-select-move]').setAttribute('aria-pressed',String(card.dataset.resultStudent===moveSelectedId));
 });
 document.querySelectorAll('[data-drop-button]').forEach(button=>{const room=Number(button.dataset.dropButton);button.disabled=!moveSelectedId||state.candidates[state.activeCandidate]?.assign[moveSelectedId]===room;button.textContent=button.disabled?'여기로 이동':'선택한 학생 여기로 이동'});
 renderReviewMoveTools();clearReviewPreview();renderTraitRemote();
}
function applyResultNameFormat(property,value){
 const student=findStudent(traitRemoteUI.resultStudentId);if(!student){toast('먼저 학생 카드를 선택하세요.');return false}
 const before=resultNameFormat(student);if(value===undefined)value=!before[property];
 if(before[property]===value)return false;
 resultFormatUndo.push({id:student.id,color:student.color||'',format:{...student.cellFormats?.name}});
 if(resultFormatUndo.length>60)resultFormatUndo.shift();
 student.cellFormats={...student.cellFormats,name:{...before,[property]:value}};
 if(property==='background')student.color=value;
 saveState();renderResults();return true;
}
function undoResultNameFormat(){
 const previous=resultFormatUndo.pop();
 if(previous?.batch){
  for(const item of previous.batch){const st=findStudent(item.id);if(!st)continue;st.color=item.color;const formats={...st.cellFormats};if(item.format)formats.name=item.format;else delete formats.name;st.cellFormats=formats;}
  saveState();renderResults();return;
 }
 const student=previous&&findStudent(previous.id);if(!student)return;
 student.color=previous.color;student.cellFormats={...student.cellFormats,name:previous.format};
 traitRemoteUI.resultStudentId=student.id;saveState();renderResults();
}
