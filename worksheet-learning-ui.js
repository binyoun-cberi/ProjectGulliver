(()=>{'use strict';
const T=window.WorksheetLearning,C=window.DailyWorksheetCore,E=window.WorksheetEditor,$=id=>document.getElementById(id),form=$('sheetForm');
const query=new URLSearchParams(E.initialSearch),legacy=!!query.get('topic')&&!query.has('lesson');
const box=document.createElement('section');box.className='textbook-flow';box.setAttribute('aria-label','교과서 단원과 학습 내용');
box.innerHTML='<label>학습 범위<select id="learningMode"><option value="textbook">교과서 단원에서 고르기</option><option value="practice">기존 연습에서 고르기</option></select></label><div id="textbookControls"><label>학기<select id="textSemester"><option value="1">1학기</option><option value="2">2학기</option></select></label><label>단원<select id="textUnit"></select></label><label>학습 내용<select id="textLesson"></select></label><p id="textPractice" aria-live="polite"></p><label>문제 유형<select id="textFormat"></select></label><details><summary>단원 출처와 수업 참고</summary><p>2022 개정 · 미래엔 공개 목차 기준입니다. 교과서에 따라 이름과 순서가 다를 수 있어요. 문제지로 풀고 답을 확인할 수 있는 학습 내용을 표시합니다. 도입·마무리, 제작·발표·공유, 인터넷 검색과 현장 조사 활동은 제외합니다.</p><a id="textSource" target="_blank" rel="noopener noreferrer">교과서 단원·차시 목록 보기</a><p>성취기준은 기존 연습의 수업 참고에서 확인할 수 있어요. 단원 연결은 확인한 학습 내용부터 제공합니다.</p></details></div>';
$('grade').closest('label').after(box);
const hiddenIds=['unitSetting','topicSetting','historyEraSetting','mathTypeSetting','typeSetting','responseSetting','difficultySetting','variantSetting','columnSettings','unitMixSettings','curriculumNote'];
let active=false,subject='',chosen=null,displayedSeed=null;
function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
function selected(){return T.lookup(subject,Number($('grade').value),Number($('textSemester').value),$('textUnit').value,$('textLesson').value)}
function clear(message){displayedSeed=null;E.clear();$('sheetStatus').textContent=message;$('sheetMeta').textContent='';for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=true;}
function summary(){if(!active)return;$('filterSelectionSummary').textContent=`${$('grade').value}학년 ${$('textSemester').value}학기 · ${chosen?.unit.name||'단원 선택'} · ${$('count').value}문항`;}
function counts(){
 chosen=selected();const b=chosen?.binding,prior=$('count').value,available=T.counts(b,$('textFormat').value);$('count').replaceChildren();
 for(const n of available)option($('count'),String(n),n+'문항');if(available.includes(Number(prior)))$('count').value=prior;else if(available.includes(5))$('count').value='5';
 $('count').disabled=!b;$('textFormat').disabled=!b;form.querySelector('button[type="submit"]').disabled=!b;
 $('textPractice').textContent=b?b.label+' · 선택한 차시와 연결한 연습이에요.': '이 학습 내용의 문제는 준비 중이에요. 다른 학습 내용을 골라 주세요.';
 $('textSource').href=chosen?.unit.source||'#';summary();
}
function formats(preferred){const control=$('textFormat');control.replaceChildren();for(const [id,label] of T.formats(selected()?.binding))option(control,id,label);if([...control.options].some(o=>o.value===preferred))control.value=preferred;counts()}
function lessons(preferred){const unit=T.units(subject,$('grade').value,$('textSemester').value).find(u=>u.id===$('textUnit').value),select=$('textLesson');select.replaceChildren();
 for(const l of unit?.lessons||[])option(select,l.id,(l.section?l.section+' · ':'')+l.name+(T.binding(unit,l)?'':' · 준비 중'));
 if([...select.options].some(o=>o.value===preferred))select.value=preferred;else{const ready=unit?.lessons.find(l=>T.binding(unit,l));if(ready)select.value=ready.id;}
 formats(query.get('format'));
}
function units(preferred,lesson){const select=$('textUnit');select.replaceChildren();const all=T.units(subject,$('grade').value,$('textSemester').value);
 for(const u of all)option(select,u.id,(u.number?u.number+' · ':'')+u.name);
 if(all.some(u=>u.id===preferred))select.value=preferred;else{const ready=all.find(u=>u.lessons.some(l=>T.binding(u,l)));if(ready)select.value=ready.id;}
 lessons(lesson);
}
function make(seed){
 if(!active)return;try{const s=T.generate({subject,grade:Number($('grade').value),semester:Number($('textSemester').value),unitId:$('textUnit').value,lessonId:$('textLesson').value,count:Number($('count').value),seed,responseFormat:$('textFormat').value},C);E.render(s);displayedSeed=s.seed;
  $('sheetMeta').textContent=`${s.grade}학년 ${s.curriculum.semester}학기 · ${s.curriculum.lesson} · ${s.items.length}문항`;
  for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;
  const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:String(s.grade),semester:String(s.curriculum.semester),unit:s.curriculum.unitId,lesson:s.curriculum.lessonId,count:String(s.count),format:s.responseFormat,seed:String(s.seed),...($('largePrint').checked?{large:'1'}:{})});history.replaceState(null,'',url);
 }catch(e){clear(e.message)}
}
function sync(initial=false){
 subject=form.querySelector('input[name="subject"]:checked').value;active=subject!=='english'&&$('learningMode').value==='textbook';
 box.hidden=subject==='english';$('textbookControls').hidden=!active;
 for(const id of hiddenIds){if(active)$(id).hidden=true;}
 if(!active){$('unitMixSettings').hidden=false;$('curriculumNote').hidden=false;form.querySelector('button[type="submit"]').disabled=false;for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;return;}
 units(initial?query.get('unit'):null,initial?query.get('lesson'):null);
 clear(chosen?.binding?'학습 내용을 골랐어요. 문제지 만들기를 눌러 주세요.':'이 학습 내용의 문제는 준비 중이에요.');
}
$('learningMode').value=legacy?'practice':'textbook';$('textSemester').value=query.get('semester')==='2'?'2':'1';
form.addEventListener('change',e=>{if(e.target.id==='learningMode'&&e.target.value==='practice'||e.target.name==='subject'&&e.target.value==='english'){
 $('count').replaceChildren();for(const n of [6,8,12,5,10,15,20])option($('count'),String(n),n+'문항');$('count').value='10';$('count').disabled=false;
}},true);
form.addEventListener('submit',e=>{if(!active)return;e.preventDefault();e.stopImmediatePropagation();make(window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now())},true);
const regenerate=$('regenerate').onclick;$('regenerate').onclick=()=>active?make(window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now()):regenerate();
form.addEventListener('change',e=>{
 if(e.target.id==='learningMode'){
  if(e.target.value==='practice'){$('grade').dispatchEvent(new Event('change',{bubbles:true}));}else sync();return;
 }
 if(['subject','grade'].includes(e.target.name)){sync();return;}if(!active)return;
 if(e.target.id==='largePrint'){if(displayedSeed!==null)make(displayedSeed);return;}
 if(e.target.id==='textSemester')units();else if(e.target.id==='textUnit')lessons();else if(e.target.id==='textLesson')formats();else if(e.target.id==='textFormat')counts();
 if(['textSemester','textUnit','textLesson','textFormat'].includes(e.target.id))clear(chosen?.binding?'학습 내용을 바꿨어요. 문제지 만들기를 눌러 주세요.':'이 학습 내용의 문제는 준비 중이에요.');
 // The original editor updates its legacy count list on change. Restore this
 // lesson's bounded choices afterwards; never reuse the legacy bank capacity.
 if(e.target.id!=='largePrint')counts();summary();
});
sync(true);if(active){if(T.counts(chosen?.binding,$('textFormat').value).includes(Number(query.get('count'))))$('count').value=query.get('count');if(query.has('lesson')&&query.get('lesson')!==selected()?.lesson.id)clear('저장된 단원과 학습 내용을 찾지 못했어요. 다시 골라 주세요.');else if(chosen?.binding)make(query.has('seed')?Number(query.get('seed')):Date.now());}
})();
