/* Explicit, reversible coloring of names for one selected school trait. */
function traitNameColorChanges(students,tag,color,result=false){
 if(color!==''&&!/^#[0-9a-f]{6}$/i.test(color))return {error:'이름 배경색을 확인해 주세요.',changes:[]};
 color=color.toLowerCase();
 return {changes:students.filter(st=>st.traits.includes(tag)&&((st.color||'')!==color||(st.cellFormats?.name?.background||'')!==color)).map(st=>({
  before:{id:st.id,color:st.color||'',format:st.cellFormats?.name?{...st.cellFormats.name}:null},
  next:{...st,color,cellFormats:{...st.cellFormats,name:{...(result?resultNameFormat(st):st.cellFormats?.name),background:color}}}
 }))};
}
function renderTraitColorControls(){
 const select=$('traitColorTag');if(!select)return;
 const selected=select.value;
 select.innerHTML='<option value="">유의 사항 선택</option>'+state.traits.map(tag=>'<option value="'+escapeHtml(tag)+'">'+escapeHtml(tag)+' ('+state.students.filter(st=>st.traits.includes(tag)).length+'명)</option>').join('');
 if(state.traits.includes(selected))select.value=selected;
 const count=state.students.filter(st=>st.traits.includes(select.value)).length;
 $('traitColorCount').textContent=select.value?'전체 명단 중 '+count+'명의 이름 배경색':'색칠할 유의 사항을 선택하세요.';
 $('applyTraitColor').disabled=!count;$('clearTraitColor').disabled=!count;
}
function applyTraitNameColor(color){
 const tag=$('traitColorTag').value;if(!state.traits.includes(tag))return false;
 const plan=traitNameColorChanges(state.students,tag,color,view==='results');
 if(plan.error){toast(plan.error);return false}
 if(!plan.changes.length){toast('변경할 이름 색상이 없습니다.');return false}
 if(view==='results'){
  resultFormatUndo.push({batch:plan.changes.map(change=>change.before)});
  if(resultFormatUndo.length>60)resultFormatUndo.shift();
 }else rosterSaveUndo();
 const updates=new Map(plan.changes.map(change=>[change.next.id,change.next]));
 state.students=state.students.map(st=>updates.get(st.id)||st);
 saveState();if(view==='results')renderResults();else renderRoster();
 toast(tag+' 학생 '+plan.changes.length+'명의 이름 색상을 '+(color?'적용':'해제')+'했습니다.');return true;
}
function installTraitColors(){
 $('traitColorTag').addEventListener('change',renderTraitColorControls);
 $('applyTraitColor').addEventListener('click',()=>applyTraitNameColor($('traitBatchColor').value));
 $('clearTraitColor').addEventListener('click',()=>applyTraitNameColor(''));
 $('traitColorTools').addEventListener('toggle',()=>positionTraitRemote());
}
