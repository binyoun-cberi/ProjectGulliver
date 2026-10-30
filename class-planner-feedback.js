/* Teacher preferences and deterministic source-class colors. */
const SOURCE_ROOM_COLORS=['#dcecf8','#f7dfcb','#e3e5fa','#d8eee2','#f7dfe9','#f2eccb','#e3def2','#d4eeee','#f2dfd3','#e7edce','#e2e8ee','#f2dfef'];
function sourceRoomColor(student){
 const match=String(student?.oldClass||'').match(/\d+/);if(!match)return '#e8ecef';
 return SOURCE_ROOM_COLORS[(Number(match[0])-1+SOURCE_ROOM_COLORS.length)%SOURCE_ROOM_COLORS.length];
}
function sourceRoomLabel(student){return (student.oldGrade?student.oldGrade+'학년 ':'')+(student.oldClass||'반 미입력')}
function renderFeedbackSettings(){
 const definitions=[['oldClass','기존 같은 반 분리','기존 반 학생들을 새 반에 고르게 분산'],['basket','분리바구니 중요도','바구니 안의 학생을 다른 반으로 배정'],['learning','학습지표 중요도','반별 학습지표 균형'],['gender','남녀 비율 중요도','반별 남녀 비율 균형']];
 for(const id of ['allocationWeightsSetup','allocationWeightsSettings']){
  const host=$(id);if(!host)continue;
  if(!host.firstElementChild)host.innerHTML=definitions.map(([key,label,hint])=>'<label class="allocation-weight"><span><strong>'+label+'</strong><output data-weight-output="'+key+'">1배</output></span><input type="range" min="0" max="5" step="1" value="1" data-allocation-weight="'+key+'" aria-label="'+label+'"><small>'+hint+'</small></label>').join('')+'<button type="button" class="btn small" data-reset-weights>기본 중요도로</button>';
 }
 const weights=normalizeAllocationWeights(state.allocationWeights);
 document.querySelectorAll('[data-allocation-weight]').forEach(input=>{input.value=String(weights[input.dataset.allocationWeight])});
 document.querySelectorAll('[data-weight-output]').forEach(output=>{const n=weights[output.dataset.weightOutput];output.textContent=n?n+'배':'사용 안 함'});
}
function renderSourceColorLegend(){
 $('showSourceColors').checked=state.showSourceColors!==false;
 const host=$('sourceColorLegend'),candidate=state.candidates[state.activeCandidate];
 host.hidden=!candidate||state.showSourceColors===false;
 if(host.hidden){host.innerHTML='';return}
 const originals=new Map();for(const student of state.students)if(candidate.assign[student.id])originals.set(sourceRoomLabel(student),student);
 host.innerHTML='<span>기존 반</span>'+[...originals].sort(([a],[b])=>a.localeCompare(b,'ko',{numeric:true})).map(([label,student])=>'<span class="source-room-key" style="--source-color:'+sourceRoomColor(student)+'"><i aria-hidden="true"></i>'+escapeHtml(label)+'</span>').join('');
}
function installFeedbackSettings(){
 document.addEventListener('input',e=>{const key=e.target.dataset.allocationWeight;if(!key)return;const n=Number(e.target.value);e.target.closest('.allocation-weight').querySelector('output').textContent=n?n+'배':'사용 안 함'});
 document.addEventListener('change',e=>{const key=e.target.dataset.allocationWeight;if(!key)return;state.allocationWeights=normalizeAllocationWeights({...state.allocationWeights,[key]:Number(e.target.value)});invalidate();saveState();render();toast('중요도를 저장했습니다. 자동 편성에 적용됩니다.')});
 document.addEventListener('click',e=>{if(!e.target.closest('[data-reset-weights]'))return;state.allocationWeights=normalizeAllocationWeights();invalidate();saveState();render()});
 $('showSourceColors').addEventListener('change',e=>{state.showSourceColors=e.target.checked;saveState();renderResults()});
}
