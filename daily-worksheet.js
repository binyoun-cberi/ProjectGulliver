(()=>{'use strict';
const C=window.DailyWorksheetCore,$=id=>document.getElementById(id),form=$('sheetForm');
let current=null;const params=new URLSearchParams(location.search);
let subject=C.SUBJECTS[params.get('subject')]?params.get('subject'):'math';
const initialGrade=Number(params.get('grade')),initialTopic=params.get('topic'),initialCount=params.has('count')?Number(params.get('count')):null;
const seed=()=>{if(globalThis.crypto?.getRandomValues)return crypto.getRandomValues(new Uint32Array(1))[0];return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0};
function option(select,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;select.append(o)}
for(const [key,info] of Object.entries(C.SUBJECTS)){
 const label=document.createElement('label'),input=document.createElement('input'),caption=document.createElement('span');input.type='radio';input.name='subject';input.value=key;input.checked=key===subject;caption.textContent=info.name;label.append(input,caption);$('subjectOptions').append(label);
}
function syncGrades(preferred,topic){const info=C.SUBJECTS[subject],grade=$('grade');grade.replaceChildren();info.grades.forEach(n=>option(grade,n,n+'학년'));grade.value=info.grades.includes(Number(preferred))?String(preferred):String(info.grades[0]);syncTopics(topic)}
function syncTopics(preferred){const topic=$('topic'),grade=Number($('grade').value);topic.replaceChildren();C.SUBJECTS[subject].topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)).forEach(t=>option(topic,t[0],t[1]));if([...topic.options].some(o=>o.value===preferred))topic.value=preferred}
function denseAvailable(){return subject==='math'&&['addition','hundreds','multiplication'].includes($('topic').value)}
function syncCount(preferred){const dense=denseAvailable();$('count').querySelector('[value="24"]').disabled=!dense;$('count').value=[5,10,15,...(dense?[24]:[])].includes(preferred)?String(preferred):dense?'24':'10'}
function syncDifficulty(){const hundreds=subject==='math'&&$('topic').value==='hundreds',math=subject==='math'&&!hundreds;$('difficultySetting').hidden=!math;$('difficulty').disabled=!math;$('variantSetting').hidden=!hundreds;$('variant').disabled=!hundreds;if(!math)$('difficulty').value='basic';
 const standard=C.alignment(subject,$('topic').value,Number($('grade').value)),note=$('curriculumNote');note.replaceChildren();
 if(standard){note.append(document.createTextNode(`2022 개정 · ${standard.code} ${standard.summary} · 계산 연습 `));const link=document.createElement('a');link.href=standard.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='원문 보기';note.append(link)}
 else note.textContent='이 유형은 성취기준 연계를 검토 중입니다.';
}
syncGrades(initialGrade,initialTopic);syncCount(initialCount);
if(['basic','challenge'].includes(params.get('difficulty')))$('difficulty').value=params.get('difficulty');
if(['tens','ones'].includes(params.get('variant')))$('variant').value=params.get('variant');
syncDifficulty();
$('largePrint').checked=params.get('large')==='1';
function render(sheet){current=sheet;const dense=sheet.count===24&&sheet.subject==='math';$('sheetStatus').textContent='새 문제지 완성';$('sheetMeta').textContent=C.SUBJECTS[sheet.subject].name+' · '+sheet.grade+'학년 · '+(sheet.difficulty==='challenge'?'도전':'기본')+' · '+sheet.items.length+'문항';$('paperTitle').textContent=sheet.title;$('answerTitle').textContent=sheet.title+' 정답';$('sheetNumber').textContent='문제지 번호 '+sheet.seed.toString(36).toUpperCase();
 const questions=$('questions'),answers=$('answers');questions.replaceChildren();answers.replaceChildren();
 questions.classList.toggle('calculation-grid',dense);answers.classList.toggle('calculation-answers',dense);$('questionSheet').classList.toggle('dense-paper',dense);$('answerSheet').classList.toggle('dense-paper',dense);
 $('paperInstruction').hidden=!dense;if(dense)$('paperInstruction').textContent=sheet.topic==='hundreds'?'받아올림 없이 덧셈을 하세요.':'계산해 보세요.';
 if(sheet.topic==='hundreds')$('paperTitle').textContent+=' · '+(sheet.variant==='ones'?'B · 일의 자리까지':'A · 일의 자리가 0');
 $('paperStandard').hidden=!sheet.alignment;if(sheet.alignment)$('paperStandard').textContent=`2022 개정 성취기준 ${sheet.alignment.code} · ${sheet.alignment.scope}`;
 sheet.items.forEach((item,index)=>{
  const li=document.createElement('li');
  if(dense){
   const match=item.prompt.match(/^(\d+) ([+×−]) (\d+) =$/);
   if(!match)throw Error('세로셈으로 표시할 수 없는 문제가 있습니다.');
   li.className='calculation-item';li.setAttribute('aria-label',`${index+1}번. ${item.prompt}`);
   const number=document.createElement('span');number.className='calculation-number';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');
   const stack=document.createElement('div');stack.className='vertical-operation';stack.setAttribute('aria-hidden','true');
   const top=document.createElement('span');top.className='operand';top.textContent=match[1];
   const bottom=document.createElement('span');bottom.className='operand second-operand';bottom.textContent=match[3];bottom.dataset.operator=match[2];
   const space=document.createElement('span');space.className='result-space';stack.append(top,bottom,space);li.append(number,stack);
  }else{
   const prompt=document.createElement('strong');prompt.textContent=item.prompt;li.append(prompt);
   if(item.detail){const detail=document.createElement('p');detail.className='question-detail'+(sheet.topic==='direction'?' map-detail':'');detail.textContent=item.detail;li.append(detail)}
   if(item.choices?.length){const list=document.createElement('ul');list.className='choice-list';item.choices.forEach((answer,i)=>{const choice=document.createElement('li');choice.textContent=['①','②','③','④'][i]+' '+answer;list.append(choice)});li.append(list)}
   else{const line=document.createElement('span');line.className='answer-blank';line.setAttribute('aria-hidden','true');li.append(line)}
  }
  questions.append(li);
  const solution=document.createElement('li');const number=item.choices?.length?['①','②','③','④'][item.choices.indexOf(item.answer)]+' ':'';solution.textContent=number+item.answer;answers.append(solution);
 });
 const url=new URL(location.href);url.search=new URLSearchParams({subject:sheet.subject,grade:String(sheet.grade),topic:sheet.topic,difficulty:sheet.difficulty,count:String(sheet.count),seed:String(sheet.seed),...(sheet.topic==='hundreds'?{variant:sheet.variant}:{}),...($('largePrint').checked?{large:'1'}:{})}).toString();history.replaceState(null,'',url.href);
 const qr=$('answerQr'),code=$('answerQrCode');code.replaceChildren();qr.hidden=true;
 if(/^https?:$/.test(url.protocol)&&typeof window.qrcode==='function')try{const generator=window.qrcode(0,'M');generator.addData(url.href,'Byte');generator.make();code.innerHTML=generator.createSvgTag(2,4);qr.hidden=false}catch(error){console.warn('문제지 QR을 생성할 수 없습니다.',error)}
}
function make(newSeed){try{const state={subject,grade:Number($('grade').value),topic:$('topic').value,difficulty:$('difficulty').value,variant:$('variant').value,count:Number($('count').value),seed:newSeed};render(C.generate(state))}catch(error){$('sheetStatus').textContent=error.message;$('sheetMeta').textContent=''}}
form.addEventListener('change',e=>{if(e.target.name==='subject'){subject=e.target.value;syncGrades($('grade').value);syncCount();syncDifficulty()}else if(e.target.name==='grade'){syncTopics($('topic').value);syncCount();syncDifficulty()}else if(e.target.name==='topic'){syncCount();syncDifficulty()}});
form.addEventListener('submit',e=>{e.preventDefault();make(seed())});$('regenerate').onclick=()=>make(seed());
$('toggleAnswers').onclick=()=>{const open=$('answerSheet').hidden;$('answerSheet').hidden=!open;$('toggleAnswers').textContent=open?'정답 닫기':'정답 보기';$('toggleAnswers').setAttribute('aria-expanded',String(open))};
function print(withAnswers){if(!current)return;document.body.classList.toggle('print-answers',withAnswers);window.print()}
$('largePrint').addEventListener('change',()=>{document.body.classList.toggle('large-print',$('largePrint').checked);if(current)render(current)});
document.body.classList.toggle('large-print',$('largePrint').checked);
$('printOnly').onclick=()=>print(false);$('printWithAnswers').onclick=()=>print(true);
window.addEventListener('afterprint',()=>document.body.classList.remove('print-answers'));
make(Number.isFinite(Number(params.get('seed')))&&params.has('seed')?Number(params.get('seed')):seed());
})();
