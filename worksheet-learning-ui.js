(()=>{'use strict';
const T=window.WorksheetLearning,C=window.DailyWorksheetCore,E=window.WorksheetEditor,$=id=>document.getElementById(id),form=$('sheetForm');
const query=new URLSearchParams(E.initialSearch),legacy=!!query.get('topic')&&!query.has('lesson')&&!query.has('standard');
const box=document.createElement('section');box.className='textbook-flow';box.setAttribute('aria-label','문제지 학습 범위');
box.innerHTML=`<div class="learning-mode-bar"><div class="learning-tabs" role="group" aria-label="만들기 기준"><button type="button" data-mode="textbook">차시별</button><button type="button" data-mode="standard">성취기준별</button><button type="button" data-mode="practice">종합 연습</button></div><select id="learningMode" aria-label="학습 범위" hidden><option value="textbook">차시별</option><option value="standard">성취기준별</option><option value="practice">기존 연습</option></select><span id="textPractice" aria-live="polite"></span></div><div id="textbookControls"><label class="semester-control">학기<select id="textSemester"><option value="1">1학기</option><option value="2">2학기</option></select></label><label class="unit-control">단원<select id="textUnit"></select></label><label class="lesson-control">차시<select id="textLesson"></select></label><label class="standard-control" hidden>성취기준<select id="textStandard"></select><span id="selectedStandard"></span></label><label class="format-control">유형<select id="textFormat"></select></label><details class="learning-source"><summary>출처·연결 범위</summary><p id="textCoverage"></p><a id="textSource" target="_blank" rel="noopener noreferrer">원문 보기</a><p>연결된 문제만 제공합니다. 도입·마무리, 제작·발표·검색 활동은 차시 목록에서 제외했습니다.</p></details></div>`;
$('grade').closest('label').after(box);$('grade').closest('label').classList.add('grade-control');$('count').closest('label').classList.add('count-control');
const hiddenIds=['unitSetting','topicSetting','historyEraSetting','mathTypeSetting','typeSetting','responseSetting','difficultySetting','variantSetting','columnSettings','unitMixSettings','curriculumNote'];
let active=false,subject='',chosen=null,displayedSeed=null,lastIds=[],lastKey='';
const priorCounts=new WeakMap();form.addEventListener('change',e=>{if(active)priorCounts.set(e,$('count').value);},true);
function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
const standardMode=()=>$('learningMode').value==='standard';
function selected(){return standardMode()?T.lookupStandard(subject,Number($('grade').value),$('textStandard').value):T.lookup(subject,Number($('grade').value),Number($('textSemester').value),$('textUnit').value,$('textLesson').value)}
function key(){return [subject,$('grade').value,$('learningMode').value,standardMode()?$('textStandard').value:$('textLesson').value,$('textFormat').value].join(':')}
function clear(message){displayedSeed=null;E.clear();$('sheetStatus').textContent=message;$('sheetMeta').textContent='';for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=true;}
function summary(){if(active)$('filterSelectionSummary').textContent=`${$('grade').value}학년 · ${standardMode()?'성취기준별':$('textSemester').value+'학기'} · ${$('count').value||0}문항`;}
function counts(preferred){
 chosen=selected();const b=chosen?.binding,prior=preferred??$('count').value,available=T.counts(b,$('textFormat').value);$('count').replaceChildren();
 for(const n of available)option($('count'),String(n),n+'문항');if(available.includes(Number(prior)))$('count').value=prior;else if(available.length)$('count').value=String(available.includes(5)?5:available.at(-1));
 $('count').disabled=!b;$('textFormat').disabled=!b;form.querySelector('button[type="submit"]').disabled=!b;
 const total=b?.ids?T.capacity(b,$('textFormat').value):null;
 $('textPractice').textContent=!b?'연결된 문제 준비 중':total?`문제 ${total}개 · 최대 ${available.at(-1)}문항`:'계산 조건을 바꾸어 새 문제 생성';
 $('selectedStandard').textContent=chosen?.standard?.statement||'';for(const id of ['textUnit','textLesson','textStandard'])$(id).title=$(id).selectedOptions[0]?.textContent||'';
 $('textSource').href=chosen?.unit.source||'#';$('textCoverage').textContent=standardMode()?chosen?.standard.coverage.join(' · ')||'연결된 문제가 없습니다.':'2022 개정 · 미래엔 공개 목차. 교과서에 따라 이름과 순서가 다를 수 있습니다.';summary();
}
function formats(preferred){const control=$('textFormat');control.replaceChildren();for(const [id,label] of T.formats(selected()?.binding))option(control,id,label);if([...control.options].some(o=>o.value===preferred))control.value=preferred;counts()}
function lessons(preferred){const unit=T.units(subject,$('grade').value,$('textSemester').value).find(u=>u.id===$('textUnit').value),select=$('textLesson');select.replaceChildren();
 for(const l of unit?.lessons||[])option(select,l.id,l.name+(T.binding(unit,l)?'':' · 준비 중'));
 if([...select.options].some(o=>o.value===preferred))select.value=preferred;else{const ready=unit?.lessons.find(l=>T.binding(unit,l));if(ready)select.value=ready.id;}formats(query.get('format'));
}
function units(preferred,lesson){const select=$('textUnit');select.replaceChildren();const all=T.units(subject,$('grade').value,$('textSemester').value);for(const u of all)option(select,u.id,(u.number?u.number+' · ':'')+u.name);if(all.some(u=>u.id===preferred))select.value=preferred;else{const ready=all.find(u=>u.lessons.some(l=>T.binding(u,l)));if(ready)select.value=ready.id;}lessons(lesson);}
function standards(preferred){const select=$('textStandard');select.replaceChildren();for(const s of T.standards(subject,$('grade').value))option(select,s.code,`[${s.code}] ${s.statement}`);select.disabled=!select.options.length;if(!select.options.length)option(select,'','연결된 성취기준 준비 중');if([...select.options].some(o=>o.value===preferred))select.value=preferred;formats(query.get('format'));}
function make(seed,{replay=false,preserve=false}={}){
 if(!active)return;try{
  const k=key(),params={subject,grade:Number($('grade').value),semester:Number($('textSemester').value),unitId:$('textUnit').value,lessonId:$('textLesson').value,count:Number($('count').value),seed,responseFormat:$('textFormat').value,...(standardMode()?{standardCode:$('textStandard').value}:{})};
  if(replay&&query.has('pick'))params.itemIndexes=query.get('pick').split(',').map(Number);
  else if(preserve&&lastKey===k)params.itemIndexes=lastIndexes;
  else if(lastKey===k)params.excludeEvidenceIds=lastIds;
  const s=T.generate(params,C);E.render(s);displayedSeed=s.seed;lastKey=k;lastIds=s.items.map(q=>q.evidenceId).filter(Boolean);lastIndexes=s.items.every(q=>Number.isInteger(q.poolIndex))?s.items.map(q=>q.poolIndex):undefined;
  $('sheetMeta').textContent=`${s.grade}학년 · ${standardMode()?'['+s.curriculum.standardCode+']':s.curriculum.semester+'학기 · '+s.curriculum.lesson} · ${s.items.length}문항`;
  for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;
  const range=standardMode()?{mode:'standard',standard:$('textStandard').value}:{semester:String(s.curriculum.semester),unit:s.curriculum.unitId,lesson:s.curriculum.lessonId};
  const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:String(s.grade),...range,count:String(s.count),format:s.responseFormat,seed:String(s.seed),...(lastIndexes?{pick:lastIndexes.join(',')}:{}),...($('largePrint').checked?{large:'1'}:{})});history.replaceState(null,'',url);
 }catch(e){clear(e.message)}
}
let lastIndexes;
function sync(initial=false){
 subject=form.querySelector('input[name="subject"]:checked').value;active=!['english','hanja'].includes(subject)&&$('learningMode').value!=='practice';
 form.classList.toggle('compact-learning',active);box.hidden=['english','hanja'].includes(subject);$('textbookControls').hidden=!active;
 for(const button of box.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===$('learningMode').value));
 for(const cls of ['semester-control','unit-control','lesson-control'])box.querySelector('.'+cls).hidden=standardMode();box.querySelector('.standard-control').hidden=!standardMode();
 for(const id of hiddenIds)if(active)$(id).hidden=true;
 if(!active){$('unitMixSettings').hidden=subject==='hanja';$('curriculumNote').hidden=false;form.querySelector('button[type="submit"]').disabled=false;for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;return;}
 if(standardMode())standards(initial?query.get('standard'):null);else units(initial?query.get('unit'):null,initial?query.get('lesson'):null);
 clear(chosen?.binding?'범위를 골랐어요. 문제지 만들기를 눌러 주세요.':'이 범위의 문제는 준비 중이에요.');
}
for(const button of box.querySelectorAll('[data-mode]'))button.onclick=()=>{$('learningMode').value=button.dataset.mode;$('learningMode').dispatchEvent(new Event('change',{bubbles:true}));};
$('learningMode').value=legacy?'practice':query.get('mode')==='standard'?'standard':'textbook';$('textSemester').value=query.get('semester')==='2'?'2':'1';
form.addEventListener('change',e=>{if(e.target.id==='learningMode'&&e.target.value==='practice'||e.target.name==='subject'&&['english','hanja'].includes(e.target.value)){$('count').replaceChildren();for(const n of [6,8,12,5,10,15,20])option($('count'),String(n),n+'문항');$('count').value=e.target.value==='hanja'?'5':'10';$('count').disabled=false;}},true);
const newSeed=()=>window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now();
form.addEventListener('submit',e=>{if(!active)return;e.preventDefault();e.stopImmediatePropagation();make(newSeed())},true);
const regenerate=$('regenerate').onclick;$('regenerate').onclick=()=>active?make(newSeed()):regenerate();
form.addEventListener('change',e=>{
 if(e.target.id==='learningMode'){if(e.target.value==='practice')$('grade').dispatchEvent(new Event('change',{bubbles:true}));else sync();return;}
 if(['subject','grade'].includes(e.target.name)){sync();return;}if(!active)return;
 if(e.target.id==='largePrint'){if(displayedSeed!==null)make(displayedSeed,{preserve:true});return;}
 if(e.target.id==='textSemester')units();else if(e.target.id==='textUnit')lessons();else if(['textLesson','textStandard'].includes(e.target.id))formats();else if(e.target.id==='textFormat')counts();
 if(['textSemester','textUnit','textLesson','textStandard','textFormat'].includes(e.target.id))clear(chosen?.binding?'범위를 바꿨어요. 문제지 만들기를 눌러 주세요.':'이 범위의 문제는 준비 중이에요.');
 counts(priorCounts.get(e));summary();
});
sync(true);if(active){if(T.counts(chosen?.binding,$('textFormat').value).includes(Number(query.get('count'))))$('count').value=query.get('count');if(query.has('lesson')&&query.get('lesson')!==selected()?.lesson.id)clear('저장된 단원과 차시를 찾지 못했어요. 다시 골라 주세요.');else if(query.has('standard')&&query.get('standard')!==selected()?.standard?.code)clear('저장된 성취기준을 찾지 못했어요. 다시 골라 주세요.');else if(chosen?.binding)make(query.has('seed')?Number(query.get('seed')):Date.now(),{replay:true});}
})();
