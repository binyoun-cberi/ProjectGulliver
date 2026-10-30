/* Enrollment, direct paste and allocation settings share one roster stage. */
function renderRosterSummary(){
 const students=state.students,known=students.filter(s=>s.name.trim()).length,boys=students.filter(s=>s.gender==='남').length,girls=students.filter(s=>s.gender==='여').length;
 const before=students.filter(st=>studentTransferTiming(st)==='before').length,after=students.filter(st=>studentTransferTiming(st)==='after').length;
 $('rosterSummary').innerHTML='<strong>명단 '+students.length+'명</strong><span>이름 입력 '+known+'/'+students.length+'</span><span>남 '+boys+' · 여 '+girls+(students.length-boys-girls?' · 성별 미입력 '+(students.length-boys-girls):'')+'</span><span>새 '+state.classCount+'개 반</span>'+(before||after?'<span>편성 대상 '+(students.length-before)+'명 · 편성 전 전학 제외 '+before+'명 · 편성 후 전학 '+after+'명</span>':'');
}
function focusRosterEntry(){
 if(view!=='roster')showTab('roster');
 if(searchQuery){searchQuery='';$('searchStudent').value='';renderRoster()}
 const field=$('rosterBody').querySelector('[data-key="name"]');field?.focus();field?.select();
}
function installUnifiedRoster(){
 $('blankRosterSetup').addEventListener('toggle',()=>{if($('blankRosterSetup').open)renderSetup()});
}
