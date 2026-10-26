(()=>{'use strict';
const T=window.WorksheetLearning,C=window.DailyWorksheetCore,E=window.WorksheetEditor,$=id=>document.getElementById(id),form=$('sheetForm');
const query=new URLSearchParams(E.initialSearch),legacy=(!!query.get('topic')||query.has('unitMix'))&&!query.has('lesson')&&!query.has('standard')&&!query.has('lessonMix');
const box=document.createElement('section');box.className='textbook-flow';box.setAttribute('aria-label','문제지 학습 범위');
box.innerHTML=`<div class="learning-mode-bar"><div class="learning-tabs" role="group" aria-label="만들기 기준"><button type="button" data-mode="textbook">차시별</button><button type="button" data-mode="standard">성취기준별</button><button type="button" data-mode="practice">종합 연습</button></div><select id="learningMode" aria-label="학습 범위" hidden><option value="textbook">차시별</option><option value="standard">성취기준별</option><option value="practice">기존 연습</option></select><span id="textPractice" aria-live="polite"></span></div><div id="textbookControls"><label class="semester-control">학기<select id="textSemester"><option value="1">1학기</option><option value="2">2학기</option></select></label><label class="unit-control">단원<select id="textUnit"></select></label><label class="lesson-control">차시<select id="textLesson"></select></label><label class="standard-control" hidden>성취기준<select id="textStandard"></select><span id="selectedStandard"></span></label><label class="format-control">유형<select id="textFormat"></select></label><details class="learning-source"><summary>출처·연결 범위</summary><p id="textCoverage"></p><a id="textSource" target="_blank" rel="noopener noreferrer">원문 보기</a><p>연결된 문제만 제공합니다. 도입·마무리, 제작·발표·검색 활동은 차시 목록에서 제외했습니다.</p></details></div>`;
$('grade').closest('label').after(box);$('grade').closest('label').classList.add('grade-control');$('count').closest('label').classList.add('count-control');
const dictationLink=document.createElement('a');dictationLink.className='dictation-link';dictationLink.textContent='받아쓰기 · 음성 읽기';box.querySelector('.learning-tabs').append(dictationLink);
const englishDictationLink=document.createElement('a');englishDictationLink.className='english-dictation-link';englishDictationLink.textContent='영어 받아쓰기 · 듣고 쓰기';englishDictationLink.hidden=true;$('grade').closest('label').after(englishDictationLink);
const hiddenIds=['unitSetting','topicSetting','historyEraSetting','mathTypeSetting','typeSetting','responseSetting','difficultySetting','variantSetting','columnSettings','unitMixSettings','curriculumNote'];
let active=false,subject='',chosen=null,displayedSeed=null,lastIds=[],lastKey='',initialMixInvalid=false,rangeSubject='';
const mixBox=document.createElement('details');mixBox.className='unit-mix-settings';mixBox.id='learningMixSettings';
mixBox.innerHTML=`<summary>학습 범위 선택 · 여러 단원·차시 섞기</summary><div class="unit-mix-body"><label class="print-option"><input type="checkbox" id="learningMixEnabled"> 여러 차시에서 문제 뽑기</label><p>차시 목록에서 원하는 범위를 체크하고, 담은 차시별 문항 수를 정하세요. 총 40문항까지 만들 수 있어요.</p><label class="print-option"><input type="checkbox" id="learningMixAcross"> 1·2학기 함께 보기</label><div class="learning-range-layout"><section class="range-selection" aria-label="담은 차시"><h3>담은 차시</h3><div id="learningMixRows"></div><div class="range-selection-actions"><button type="button" id="addLearningMix">차시 추가</button><button type="button" id="addCurrentLearningMix">현재 차시 담기</button><button type="button" id="clearLearningMix">선택 비우기</button></div><output id="learningMixTotal" aria-live="polite"></output></section><section id="learningRangeTree" class="range-tree" aria-label="차시 목록"></section></div></div>`;
box.after(mixBox);
const mixing=()=>active&&['math','korean','social','science'].includes(subject)&&!standardMode()&&$('learningMixEnabled').checked;
const mixPlan=()=>[...$('learningMixRows').children].map(row=>({id:row.querySelector('select').value,count:Number(row.querySelector('input').value)}));
function mixEntries(){return ($('learningMixAcross').checked?[1,2]:[Number($('textSemester').value)]).flatMap(term=>T.mixOptions(subject,$('grade').value,term))}
function mixChanged(e){if(e?.target.closest('#learningRangeTree'))return;if(e?.target.id==='learningMixEnabled'&&$('learningMixEnabled').checked&&!mixPlan().length&&mixEntries().length){const current=mixEntries().find(x=>x.id===$('textLesson').value)||mixEntries()[0];addMixRow({id:current.id,count:Math.min(5,T.capacity(current.binding,$('textFormat').value))});}if(e?.target.id==='learningMixAcross'){const saved=mixPlan(),allowed=new Set(mixEntries().map(x=>x.id));$('learningMixRows').replaceChildren();saved.filter(x=>allowed.has(x.id)).forEach(addMixRow);refreshTree();}mixFormats();clear('범위를 바꿨어요. 문제지 만들기를 눌러 주세요.');}
function addMixRow(value){
 const entries=mixEntries(),used=new Set(mixPlan().map(row=>row.id)),row=document.createElement('div');row.className='learning-mix-row';
 const label=document.createElement('label');label.textContent='단원 / 차시';const select=document.createElement('select');select.setAttribute('aria-label','섞을 차시');
 for(const entry of entries){const groupName=entry.semester+'학기 · '+entry.label.split(' · ')[0];let group=[...select.children].find(g=>g.label===groupName);if(!group){group=document.createElement('optgroup');group.label=groupName;select.append(group);}option(group,entry.id,entry.label);}
 select.value=value?.id||entries.find(x=>!used.has(x.id))?.id||entries[0]?.id||'';label.append(select);
 const amount=document.createElement('label');amount.textContent='문항 수';const input=document.createElement('input');input.type='number';input.min='1';input.max='20';input.step='1';input.value=String(value?.count??Math.min(5,T.capacity(entries.find(x=>x.id===select.value)?.binding,'choice')));input.setAttribute('aria-label','차시별 문항 수');amount.append(input);const limit=document.createElement('small');limit.className='mix-capacity';amount.append(limit);
 const remove=document.createElement('button');remove.type='button';remove.textContent='삭제';remove.setAttribute('aria-label','이 차시 삭제');remove.onclick=()=>{row.remove();mixChanged();};row.append(label,amount,remove);$('learningMixRows').append(row);
}
function mixFormats(){
 if(!mixing()){formats($('textFormat').value);return;}
 const entries=mixEntries(),rows=mixPlan(),bindings=rows.map(row=>entries.find(x=>x.id===row.id)?.binding),prior=$('textFormat').value;
 const common=bindings.length&&bindings.every(Boolean)?T.formats(bindings[0]).filter(([id])=>bindings.every(b=>T.formats(b).some(([f])=>f===id))):[];
 $('textFormat').replaceChildren();for(const [id,label] of common)option($('textFormat'),id,label);if(common.some(([id])=>id===prior))$('textFormat').value=prior;counts();
}
function resetLearningMix(){
 $('learningMixEnabled').checked=false;$('learningMixRows').replaceChildren();mixBox.open=false;refreshTree();
}
const rangeTree=window.WorksheetRangeTree.create($('learningRangeTree'),{onChange(ids,checked,bulk){
 if(!mixing()){$('learningMixRows').replaceChildren();$('learningMixEnabled').checked=true;}
 for(const id of ids){const row=[...$('learningMixRows').children].find(r=>r.querySelector('select').value===id);if(checked&&!row)addMixRow({id,count:bulk?1:Math.min(5,T.capacity(mixEntries().find(x=>x.id===id)?.binding,$('textFormat').value))});else if(!checked&&row)row.remove();}
 mixBox.open=true;mixChanged();
}});
function refreshTree(){const terms=$('learningMixAcross').checked?[1,2]:[Number($('textSemester').value)];const units=terms.flatMap(term=>T.units(subject,$('grade').value,term)).map(u=>({id:u.id,name:u.name,semester:u.semester,lessons:u.lessons.map(l=>{const b=T.binding(u,l);return {id:l.id,name:l.name,ready:Boolean(b),capacity:Math.min(20,Math.max(0,...T.formats(b).map(([f])=>T.capacity(b,f))))};})}));rangeTree.render(units);}
$('addCurrentLearningMix').onclick=()=>{const id=$('textLesson').value;if(!mixEntries().some(x=>x.id===id))return;if(!mixing())$('learningMixRows').replaceChildren();$('learningMixEnabled').checked=true;if(!mixPlan().some(x=>x.id===id))addMixRow({id,count:Math.min(5,T.capacity(selected()?.binding,$('textFormat').value))});mixBox.open=true;mixChanged();};
$('clearLearningMix').onclick=()=>{$('learningMixRows').replaceChildren();mixChanged();};
$('addLearningMix').onclick=()=>{if(!mixing())$('learningMixRows').replaceChildren();$('learningMixEnabled').checked=true;addMixRow();mixChanged();};
mixBox.addEventListener('change',mixChanged);
mixBox.addEventListener('input',e=>{if(e.target.type==='number')mixChanged();});
const priorCounts=new WeakMap();form.addEventListener('change',e=>{if(active)priorCounts.set(e,$('count').value);},true);
function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)}
const standardMode=()=>$('learningMode').value==='standard';
function selected(){return standardMode()?T.lookupStandard(subject,Number($('grade').value),$('textStandard').value):T.lookup(subject,Number($('grade').value),Number($('textSemester').value),$('textUnit').value,$('textLesson').value)}
function key(){return [subject,$('grade').value,$('learningMode').value,mixing()?JSON.stringify(mixPlan()):standardMode()?$('textStandard').value:$('textLesson').value,$('textFormat').value].join(':')}
function clear(message){displayedSeed=null;E.clear();$('sheetStatus').textContent=message;$('sheetMeta').textContent='';for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=true;}
function summary(){if(mixing()){$('filterSelectionSummary').textContent=`${$('grade').value}학년 · ${$('textSemester').value}학기 · 여러 차시 · ${mixPlan().reduce((n,row)=>n+row.count,0)}문항`;return;}if(active)$('filterSelectionSummary').textContent=`${$('grade').value}학년 · ${standardMode()?'성취기준별':$('textSemester').value+'학기'} · ${$('count').value||0}문항`;}
function counts(preferred){
 chosen=selected();const b=chosen?.binding,prior=preferred??$('count').value,available=T.counts(b,$('textFormat').value);$('count').replaceChildren();
 for(const n of available)option($('count'),String(n),n+'문항');if(available.includes(Number(prior)))$('count').value=prior;else if(available.length)$('count').value=String(available.includes(5)?5:available.at(-1));
 $('count').disabled=!b;$('textFormat').disabled=!b;form.querySelector('button[type="submit"]').disabled=!b;
 const total=b?.ids?T.capacity(b,$('textFormat').value):null;
 $('textPractice').textContent=!b?'연결된 문제 준비 중':total?`문제 ${total}개 · 최대 ${available.at(-1)}문항`:'계산 조건을 바꾸어 새 문제 생성';
 $('selectedStandard').textContent=chosen?.standard?.statement||'';for(const id of ['textUnit','textLesson','textStandard'])$(id).title=$(id).selectedOptions[0]?.textContent||'';
 $('textSource').href=chosen?.unit.source||'#';$('textCoverage').textContent=standardMode()?chosen?.standard.coverage.join(' · ')||'연결된 문제가 없습니다.':'2022 개정 · 미래엔 공개 목차. 교과서에 따라 이름과 순서가 다를 수 있습니다.';
 if(mixing()){const rows=mixPlan(),entries=mixEntries(),total=rows.reduce((n,row)=>n+row.count,0),valid=rows.length>0&&rows.length<=40&&new Set(rows.map(row=>row.id)).size===rows.length&&Number.isInteger(total)&&total>0&&total<=40&&rows.every(row=>{const b=entries.find(x=>x.id===row.id)?.binding;return b&&Number.isInteger(row.count)&&row.count>=1&&row.count<=20&&row.count<=T.capacity(b,$('textFormat').value);})&&!!$('textFormat').value;
 $('count').replaceChildren();option($('count'),String(total),total+'文항');$('count').disabled=true;$('textFormat').disabled=!$('textFormat').options.length;form.querySelector('button[type=submit]').disabled=!valid;$('learningMixTotal').textContent=rows.length+'개 차시 · 총 '+total+'문항';$('textPractice').textContent=valid?'선택한 차시별 문항 수를 반영해요':'차시 중복·문항 수·공통 문제 유형을 확인해 주세요.';
 for(const row of $('learningMixRows').children){const b=entries.find(x=>x.id===row.querySelector('select').value)?.binding;const max=Math.min(20,T.capacity(b,$('textFormat').value));row.querySelector('input').max=String(max);row.querySelector('.mix-capacity').textContent='최대 '+max+'문항';}
 }
 $('addLearningMix').disabled=$('learningMixRows').children.length>=Math.min(40,mixEntries().length);
 $('addCurrentLearningMix').disabled=!selected()?.binding;rangeTree.sync(mixPlan(),mixing());$('textUnit').disabled=mixing();$('textLesson').disabled=mixing();summary();
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
  if(!mixing()&&replay&&query.has('pick'))params.itemIndexes=query.get('pick').split(',').map(Number);
  else if(!mixing()&&preserve&&lastKey===k)params.itemIndexes=lastIndexes;
  else if(!preserve&&lastKey===k)params.excludeEvidenceIds=lastIds;
  if(mixing()){params.lessonMix=mixPlan();params.acrossSemesters=$('learningMixAcross').checked;if(preserve)params.mixedItemIndexes=lastMixIndexes;else if(replay&&query.has('mixPick'))params.mixedItemIndexes=JSON.parse(query.get('mixPick'));}const s=mixing()?T.generateMixed(params,C):T.generate(params,C);E.render(s);displayedSeed=s.seed;lastKey=k;lastMixIndexes=s.mixedItemIndexes;lastIds=s.items.map(q=>q.evidenceId).filter(Boolean);lastIndexes=!mixing()&&s.items.every(q=>Number.isInteger(q.poolIndex))?s.items.map(q=>q.poolIndex):undefined;
  $('sheetMeta').textContent=`${s.grade}학년 · ${standardMode()?'['+s.curriculum.standardCode+']':(s.curriculum.acrossSemesters?'1·2학기':s.curriculum.semester+'학기')+' · '+s.curriculum.lesson} · ${s.items.length}문항`;
  for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;
  const range=mixing()?{semester:String(s.curriculum.semester),lessonMix:JSON.stringify(s.lessonMix),...(s.curriculum.acrossSemesters?{mixTerms:'all'}:{}),...(s.mixedItemIndexes?{mixPick:JSON.stringify(s.mixedItemIndexes)}:{})}:standardMode()?{mode:'standard',standard:$('textStandard').value}:{semester:String(s.curriculum.semester),unit:s.curriculum.unitId,lesson:s.curriculum.lessonId};
  const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:String(s.grade),...range,count:String(s.count),format:s.responseFormat,seed:String(s.seed),...(lastIndexes?{pick:lastIndexes.join(',')}:{}),...($('largePrint').checked?{large:'1'}:{})});history.replaceState(null,'',url);
 }catch(e){clear(e.message)}
}
let lastIndexes,lastMixIndexes;
function sync(initial=false){
 subject=form.querySelector('input[name="subject"]:checked').value;active=!['english','hanja'].includes(subject)&&$('learningMode').value!=='practice';
 dictationLink.hidden=subject!=='korean';dictationLink.href='받아쓰기.html?subject=korean&grade='+$('grade').value;
 englishDictationLink.hidden=subject!=='english';englishDictationLink.href='받아쓰기.html?subject=english&grade='+$('grade').value;
 if(active){$('unitMixEnabled').checked=false;form.classList.remove('unit-mix-active');}
 form.classList.toggle('compact-learning',active);box.hidden=['english','hanja'].includes(subject);$('textbookControls').hidden=!active;mixBox.hidden=!active||standardMode()||!['math','korean','social','science'].includes(subject);$('unitMixSettings').hidden=active||subject==='hanja';
 for(const button of box.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===$('learningMode').value));
 for(const cls of ['semester-control','unit-control','lesson-control'])box.querySelector('.'+cls).hidden=standardMode();box.querySelector('.standard-control').hidden=!standardMode();
 for(const id of hiddenIds)if(active)$(id).hidden=true;
 if(!active){$('unitMixSettings').hidden=subject==='hanja';$('curriculumNote').hidden=false;form.querySelector('button[type="submit"]').disabled=false;for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=false;return;}
 if(initial||rangeSubject!==subject){$('learningMixAcross').checked=subject==='math'||initial&&query.get('mixTerms')==='all';rangeSubject=subject;}
 resetLearningMix();if(initial&&query.has('lessonMix')){try{const rows=JSON.parse(query.get('lessonMix'));if(!Array.isArray(rows)||!rows.length||rows.length>40||rows.some(row=>!mixEntries().some(e=>e.id===row.id)))throw Error();$('learningMixRows').replaceChildren();rows.forEach(addMixRow);$('learningMixEnabled').checked=true;mixBox.open=true;}catch{$('learningMixEnabled').checked=false;initialMixInvalid=true;}}
 if(standardMode())standards(initial?query.get('standard'):null);else units(initial?query.get('unit'):null,initial?query.get('lesson'):null);
 if(mixing()){mixFormats();if(initial)rangeTree.reveal();}
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
 if(e.target.id==='textSemester'){if(mixing()&&$('learningMixAcross').checked){units();mixFormats();}else{units();resetLearningMix();}}else if(e.target.id==='textUnit')lessons();else if(['textLesson','textStandard'].includes(e.target.id))formats();else if(e.target.id==='textFormat')counts();
 if(['textSemester','textUnit','textLesson','textStandard','textFormat'].includes(e.target.id))clear(chosen?.binding?'범위를 바꿨어요. 문제지 만들기를 눌러 주세요.':'이 범위의 문제는 준비 중이에요.');
 counts(priorCounts.get(e));$('unitMixSettings').hidden=true;summary();
});
sync(true);if(active){if(!mixing()&&T.counts(chosen?.binding,$('textFormat').value).includes(Number(query.get('count'))))$('count').value=query.get('count');if(initialMixInvalid)clear('저장된 여러 차시 설정을 찾지 못했어요. 다시 골라 주세요.');else if(query.has('lesson')&&query.get('lesson')!==selected()?.lesson.id)clear('저장된 단원과 차시를 찾지 못했어요. 다시 골라 주세요.');else if(query.has('standard')&&query.get('standard')!==selected()?.standard?.code)clear('저장된 성취기준을 찾지 못했어요. 다시 골라 주세요.');else if(chosen?.binding||mixing())make(query.has('seed')?Number(query.get('seed')):Date.now(),{replay:true});}
})();
