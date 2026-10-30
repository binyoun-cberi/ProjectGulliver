/* One student search serves every relationship editor in stage three. */
function twinMemberPlan(groups,traits,groupId,studentId){
 const group=groups.find(g=>g.id===groupId);
 if(!group)return {error:'쌍생아 묶음을 먼저 만들어 주세요.'};
 if(group.members.length>=3)return {error:'쌍생아 묶음에는 최대 3명까지 연결할 수 있습니다.'};
 if(groups.some(g=>g.members.includes(studentId)))return {error:'이미 쌍생아 묶음에 연결된 학생입니다.'};
 if(!traits.includes('쌍생아')&&traits.length>=64)return {error:'유의 사항 항목을 정리한 뒤 다시 연결하세요.'};
 return {groups:groups.map(g=>g===group?{...g,members:[...g.members,studentId]}:g),traits:traits.includes('쌍생아')?traits:[...traits,'쌍생아']};
}
function addSharedTwinMember(groupId,studentId){
 const student=findStudent(studentId);if(!student)return false;
 const plan=twinMemberPlan(state.twinGroups,state.traits,groupId,studentId);
 if(plan.error){toast(plan.error);return false}
 state.twinGroups=plan.groups;state.traits=plan.traits;
 if(!student.traits.includes('쌍생아'))student.traits.push('쌍생아');
 invalidate();changeState();return true;
}
function fillSharedPair(slot,studentId){
 if(!findStudent(studentId)||!['pairA','pairB'].includes(slot))return false;
 if($(slot==='pairA'?'pairB':'pairA').value===studentId){toast('서로 다른 학생 두 명을 선택해 주세요.');return false}
 $(slot).value=studentId;renderRulesRemoteControls();return true;
}
function renderRulesRemoteControls(){
 if(!$('rulesRemoteBody'))return;
 const student=findStudent(selectedBasketStudentId);
 document.querySelectorAll('[data-shared-twin-add]').forEach(button=>{
  const group=state.twinGroups.find(g=>g.id===button.dataset.sharedTwinAdd);
  button.disabled=!student||!group||group.members.length>=3||state.twinGroups.some(g=>g.members.includes(student.id));
 });
 document.querySelectorAll('[data-shared-pair-add]').forEach(button=>{
  const slot=button.dataset.sharedPairAdd;
  button.disabled=!student||$(slot).value===student.id||$(slot==='pairA'?'pairB':'pairA').value===student.id;
 });
}
function installRulesRemote(){
 const stage=$('view-rules'),head=stage.querySelector('.section-head'),zone=stage.querySelector('.basket-zone'),source=zone.querySelector('.basket-source');
 const twin=stage.querySelector('.twin-section'),form=stage.querySelector('.constraint-form'),pairHead=form.previousElementSibling;
 const workspace=document.createElement('div');workspace.className='rules-workspace';
 const targets=document.createElement('div');targets.className='rules-targets';
 const basketHead=document.createElement('div');basketHead.className='section-head';
 basketHead.append(head.querySelector('h2'),head.querySelector('.actions'));
 head.innerHTML='<div><h2>편성 조건 · 분리</h2><p>학생 찾기에서 선택하거나 끌어 놓아 관계를 연결하세요.</p></div>';
 const sourceHead=source.querySelector('.basket-source-head');
 sourceHead.querySelector('span').textContent='모든 관계에 사용';
 const collapse=document.createElement('button');collapse.type='button';collapse.className='btn small';collapse.id='toggleRulesRemote';collapse.textContent='접기';collapse.setAttribute('aria-expanded','true');collapse.setAttribute('aria-controls','rulesRemoteBody');sourceHead.append(collapse);
 const body=document.createElement('div');body.id='rulesRemoteBody';
 for(const child of [...source.children])if(child!==sourceHead)body.append(child);
 source.append(body);source.classList.add('rules-student-remote');source.setAttribute('aria-label','편성 관계 공통 학생 찾기');
 $('basketSearch').setAttribute('aria-label','관계에 연결할 학생 검색');
 targets.append(basketHead,$('basketNotice'),$('basketGrid'),twin,pairHead,form,$('pairList'));
 workspace.append(source,targets);zone.replaceWith(workspace);
 const position=()=>source.style.setProperty('--rules-remote-top',((document.querySelector('.gx-header')?.getBoundingClientRect().height||72)+(document.querySelector('.tabs')?.getBoundingClientRect().height||56)+12)+'px');
 position();window.addEventListener('resize',position);window.addEventListener('load',position);
 for(const id of ['pairA','pairB']){
  const label=$(id).closest('label');label.classList.add('rule-pair-drop');
  const hint=document.createElement('span');hint.className='rule-pair-pad';hint.dataset.rulePairDrop=id;hint.textContent='학생을 여기에 놓으세요';label.prepend(hint);
  const button=document.createElement('button');button.type='button';button.className='btn small';button.dataset.sharedPairAdd=id;button.textContent='선택 학생 연결';button.disabled=true;label.append(button);
  $(id).addEventListener('change',renderRulesRemoteControls);
 }
 collapse.addEventListener('click',()=>{body.hidden=!body.hidden;collapse.textContent=body.hidden?'펼치기':'접기';collapse.setAttribute('aria-expanded',String(!body.hidden))});
 stage.addEventListener('click',e=>{
  const twinButton=e.target.closest('[data-shared-twin-add]'),pairButton=e.target.closest('[data-shared-pair-add]');
  if(twinButton&&selectedBasketStudentId)addSharedTwinMember(twinButton.dataset.sharedTwinAdd,selectedBasketStudentId);
  if(pairButton&&selectedBasketStudentId)fillSharedPair(pairButton.dataset.sharedPairAdd,selectedBasketStudentId);
 });
 const dropTarget=node=>node.closest('[data-twin-group],[data-rule-pair-drop]');
 stage.addEventListener('dragover',e=>{const target=dropTarget(e.target);if(!target||!e.dataTransfer?.types.includes('text/plain'))return;e.preventDefault();e.dataTransfer.dropEffect='copy';target.classList.add('rule-drag-over')});
 stage.addEventListener('dragleave',e=>{const target=dropTarget(e.target);if(target&&!target.contains(e.relatedTarget))target.classList.remove('rule-drag-over')});
 stage.addEventListener('drop',e=>{
  const target=dropTarget(e.target),id=e.dataTransfer?.getData('text/plain');if(!target)return;
  target.classList.remove('rule-drag-over');if(!findStudent(id))return;e.preventDefault();
  if(target.dataset.twinGroup)addSharedTwinMember(target.dataset.twinGroup,id);
  else fillSharedPair(target.dataset.rulePairDrop,id);
 });
 stage.addEventListener('dragend',()=>stage.querySelectorAll('.rule-drag-over').forEach(el=>el.classList.remove('rule-drag-over')));
}
