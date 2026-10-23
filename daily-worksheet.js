(()=>{'use strict';
const C=window.DailyWorksheetCore,$=id=>document.getElementById(id),form=$('sheetForm');
let current=null;const params=new URLSearchParams(location.search);
let subject=C.SUBJECTS[params.get('subject')]?params.get('subject'):'math';
const initialGrade=Number(params.get('grade')),initialTopic=params.get('topic'),initialCount=Number(params.get('count'));
const seed=()=>{if(globalThis.crypto?.getRandomValues)return crypto.getRandomValues(new Uint32Array(1))[0];return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0};
function option(select,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;select.append(o)}
for(const [key,info] of Object.entries(C.SUBJECTS)){
 const label=document.createElement('label'),input=document.createElement('input'),caption=document.createElement('span');input.type='radio';input.name='subject';input.value=key;input.checked=key===subject;caption.textContent=info.name;label.append(input,caption);$('subjectOptions').append(label);
}
function syncGrades(preferred,topic){const info=C.SUBJECTS[subject],grade=$('grade');grade.replaceChildren();info.grades.forEach(n=>option(grade,n,n+'학년'));grade.value=info.grades.includes(Number(preferred))?String(preferred):String(info.grades[0]);syncTopics(topic)}
function syncTopics(preferred){const topic=$('topic'),grade=Number($('grade').value);topic.replaceChildren();C.SUBJECTS[subject].topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)).forEach(t=>option(topic,t[0],t[1]));if([...topic.options].some(o=>o.value===preferred))topic.value=preferred}
function syncDifficulty(){const math=subject==='math';$('difficultySetting').hidden=!math;$('difficulty').disabled=!math;if(!math)$('difficulty').value='basic'}
syncGrades(initialGrade,initialTopic);if([5,10,15].includes(initialCount))$('count').value=String(initialCount);
if(['basic','challenge'].includes(params.get('difficulty')))$('difficulty').value=params.get('difficulty');
syncDifficulty();
$('largePrint').checked=params.get('large')==='1';
function render(sheet){current=sheet;$('sheetStatus').textContent='새 문제지 완성';$('sheetMeta').textContent=C.SUBJECTS[sheet.subject].name+' · '+sheet.grade+'학년 · '+(sheet.difficulty==='challenge'?'도전':'기본')+' · '+sheet.items.length+'문항';$('paperTitle').textContent=sheet.title;$('answerTitle').textContent=sheet.title+' 정답';$('sheetNumber').textContent='문제지 번호 '+sheet.seed.toString(36).toUpperCase();
 const questions=$('questions'),answers=$('answers');questions.replaceChildren();answers.replaceChildren();
 sheet.items.forEach((item,index)=>{
  const li=document.createElement('li'),prompt=document.createElement('strong');prompt.textContent=item.prompt;li.append(prompt);
  if(item.detail){const detail=document.createElement('p');detail.className='question-detail'+(sheet.topic==='direction'?' map-detail':'');detail.textContent=item.detail;li.append(detail)}
  if(item.choices?.length){const list=document.createElement('ul');list.className='choice-list';item.choices.forEach((answer,i)=>{const choice=document.createElement('li');choice.textContent=['①','②','③','④'][i]+' '+answer;list.append(choice)});li.append(list)}
  else{const line=document.createElement('span');line.className='answer-blank';line.setAttribute('aria-hidden','true');li.append(line)}questions.append(li);
  const solution=document.createElement('li');const number=item.choices?.length?['①','②','③','④'][item.choices.indexOf(item.answer)]+' ':'';solution.textContent=number+item.answer;answers.append(solution);
 });
 const url=new URL(location.href);url.search=new URLSearchParams({subject:sheet.subject,grade:String(sheet.grade),topic:sheet.topic,difficulty:sheet.difficulty,count:String(sheet.count),seed:String(sheet.seed),...($('largePrint').checked?{large:'1'}:{})}).toString();history.replaceState(null,'',url.href);
}
function make(newSeed){try{const state={subject,grade:Number($('grade').value),topic:$('topic').value,difficulty:$('difficulty').value,count:Number($('count').value),seed:newSeed};render(C.generate(state))}catch(error){$('sheetStatus').textContent=error.message;$('sheetMeta').textContent=''}}
form.addEventListener('change',e=>{if(e.target.name==='subject'){subject=e.target.value;syncGrades($('grade').value);syncDifficulty()}else if(e.target.name==='grade')syncTopics($('topic').value)});
form.addEventListener('submit',e=>{e.preventDefault();make(seed())});$('regenerate').onclick=()=>make(seed());
$('toggleAnswers').onclick=()=>{const open=$('answerSheet').hidden;$('answerSheet').hidden=!open;$('toggleAnswers').textContent=open?'정답 닫기':'정답 보기';$('toggleAnswers').setAttribute('aria-expanded',String(open))};
function print(withAnswers){if(!current)return;document.body.classList.toggle('print-answers',withAnswers);window.print()}
$('largePrint').addEventListener('change',()=>{document.body.classList.toggle('large-print',$('largePrint').checked);if(current)render(current)});
document.body.classList.toggle('large-print',$('largePrint').checked);
$('printOnly').onclick=()=>print(false);$('printWithAnswers').onclick=()=>print(true);
window.addEventListener('afterprint',()=>document.body.classList.remove('print-answers'));
make(Number.isFinite(Number(params.get('seed')))&&params.has('seed')?Number(params.get('seed')):seed());
})();
