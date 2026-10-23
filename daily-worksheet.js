(()=>{'use strict';
const C=window.DailyWorksheetCore,$=id=>document.getElementById(id),form=$('sheetForm');
let current=null,answersVisible=false;const params=new URLSearchParams(location.search);
let subject=C.SUBJECTS[params.get('subject')]?params.get('subject'):'math';
const initialGrade=Number(params.get('grade')),initialTopic=params.get('topic'),initialCount=params.has('count')?Number(params.get('count')):null;
const seed=()=>{if(globalThis.crypto?.getRandomValues)return crypto.getRandomValues(new Uint32Array(1))[0];return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0};
function option(select,value,label){const o=document.createElement('option');o.value=String(value);o.textContent=label;select.append(o)}
for(const [key,info] of Object.entries(C.SUBJECTS)){
 const label=document.createElement('label'),input=document.createElement('input'),caption=document.createElement('span');input.type='radio';input.name='subject';input.value=key;input.checked=key===subject;caption.textContent=info.name;label.append(input,caption);$('subjectOptions').append(label);
}
function syncGrades(preferred,topic){const info=C.SUBJECTS[subject],grade=$('grade');grade.replaceChildren();info.grades.forEach(n=>option(grade,n,n+'학년'));grade.value=info.grades.includes(Number(preferred))?String(preferred):String(info.grades[0]);syncUnits(params.get('unit'),topic)}
function syncUnits(preferred,topic){const unit=$('unit'),grade=Number($('grade').value),special=C.units(subject,grade);unit.replaceChildren();special.forEach(u=>option(unit,u.id,u.label));option(unit,'general','기본 연습 · 단원 미지정');const matched=special.find(u=>u.types.some(([id])=>id===params.get('type')))||special.find(u=>u.topics.includes(topic));unit.value=preferred&&[...unit.options].some(o=>o.value===preferred)?preferred:matched?.id||special[0]?.id||'general';syncTopics(topic)}
function syncTopics(preferred){const topic=$('topic'),grade=Number($('grade').value),unit=C.units(subject,grade).find(u=>u.id===$('unit').value);topic.replaceChildren();C.SUBJECTS[subject].topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)&&(!unit||unit.topics.includes(t[0]))&&(unit||!['mixed','decimal','past','local','prehistoric','ancient','goryeo','joseon','modern','history-review','reading-set'].includes(t[0]))).forEach(t=>option(topic,t[0],t[1]));if([...topic.options].some(o=>o.value===preferred))topic.value=preferred;syncTypes(params.get('type'))}
function syncTypes(preferred){const type=$('type'),available=$('unit').value!=='general'?C.types(subject,Number($('grade').value),$('topic').value,$('unit').value):[];type.replaceChildren();available.forEach(([id,label],index)=>option(type,id,`${index+1}) ${label}`));$('typeSetting').hidden=!available.length;type.disabled=!available.length;if(available.some(([id])=>id===preferred))type.value=preferred}
function selectedEras(){return [...$('historyEraSetting').querySelectorAll('input:checked')].map(input=>input.value)}
function syncHistoryEras(){const mixed=subject==='social'&&$('topic').value==='history-mix';$('historyEraSetting').hidden=!mixed;$('historyEraSetting').disabled=!mixed}
function denseAvailable(){if(subject!=='math')return false;if(!$('typeSetting').hidden)return /^(add-|sub-|small-|two-|times-)/.test($('type').value)&&$('type').value!=='times-missing';return ['addition','hundreds','multiplication'].includes($('topic').value)}
function syncCount(preferred){const dense=denseAvailable();$('count').querySelector('[value="24"]').disabled=!dense;$('count').value=[5,10,15,...(dense?[24]:[])].includes(preferred)?String(preferred):dense?'24':'10'}
function syncDifficulty(){const typed=!$('typeSetting').hidden,hundreds=subject==='math'&&$('topic').value==='hundreds'&&!typed,math=subject==='math'&&!hundreds&&!typed;$('difficultySetting').hidden=!math;$('difficulty').disabled=!math;$('variantSetting').hidden=!hundreds;$('variant').disabled=!hundreds;if(!math)$('difficulty').value='basic';
 const standard=C.alignment(subject,$('topic').value,Number($('grade').value)),note=$('curriculumNote');note.replaceChildren();
 if(standard){note.append(document.createTextNode(`2022 개정 · ${standard.code} ${standard.summary} · ${standard.scope} `));const link=document.createElement('a');link.href=standard.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='기준 자료 보기';note.append(link)}
 else note.textContent='이 유형은 성취기준 연계를 검토 중입니다.';
}
syncGrades(initialGrade,initialTopic);syncCount(initialCount);
if(['basic','challenge'].includes(params.get('difficulty')))$('difficulty').value=params.get('difficulty');
if(['tens','ones'].includes(params.get('variant')))$('variant').value=params.get('variant');
syncDifficulty();
$('historyEraSetting').querySelectorAll('input').forEach(input=>{input.checked=params.has('eras')?params.get('eras').split(',').includes(input.value):true});syncHistoryEras();
$('largePrint').checked=params.get('large')==='1';
function setPreview(open){answersVisible=open;document.body.classList.toggle('show-inline-answers',open);$('toggleAnswers').textContent=open?'정답 닫기':'정답 보기';$('toggleAnswers').setAttribute('aria-expanded',String(open));
 for(const li of $('questions').children){if(li.classList.contains('calculation-item'))li.setAttribute('aria-label',li.dataset.prompt+(open?' 정답: '+li.dataset.answer:''));else li.querySelector('.inline-answer')?.setAttribute('aria-hidden',String(!open))}
}
function render(sheet){current=sheet;const dense=sheet.count===24&&sheet.subject==='math';$('sheetStatus').textContent='새 문제지 완성';$('sheetMeta').textContent=C.SUBJECTS[sheet.subject].name+' · '+sheet.grade+'학년 · '+(sheet.type?'세부 유형':sheet.difficulty==='challenge'?'도전':'기본')+' · '+sheet.items.length+'문항';$('paperTitle').textContent=sheet.title;$('sheetNumber').textContent='문제지 번호 '+sheet.seed.toString(36).toUpperCase();
 const questions=$('questions');questions.replaceChildren();
 questions.classList.toggle('calculation-grid',dense);$('questionSheet').classList.toggle('dense-paper',dense);
 $('paperInstruction').hidden=!dense;if(dense)$('paperInstruction').textContent=sheet.type?'계산해 보세요.':sheet.topic==='hundreds'?'받아올림 없이 덧셈을 하세요.':'계산해 보세요.';
 if(sheet.topic==='hundreds'&&!sheet.type)$('paperTitle').textContent+=' · '+(sheet.variant==='ones'?'B · 일의 자리까지':'A · 일의 자리가 0');
 $('paperStandard').hidden=!sheet.alignment;if(sheet.alignment)$('paperStandard').textContent=`2022 개정 성취기준 ${sheet.alignment.code} · ${sheet.alignment.scope}`;
 sheet.items.forEach((item,index)=>{
  const li=document.createElement('li');li.dataset.prompt=`${index+1}번. ${item.prompt}`;li.dataset.answer=item.answer;
  if(dense){
   const match=item.prompt.match(/^(\d+) ([+×−]) (\d+) =$/);
   if(!match)throw Error('세로셈으로 표시할 수 없는 문제가 있습니다.');
   li.className='calculation-item';
   const number=document.createElement('span');number.className='calculation-number';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');
   const stack=document.createElement('div');stack.className='vertical-operation';stack.setAttribute('aria-hidden','true');
   const top=document.createElement('span');top.className='operand';top.textContent=match[1];
   const bottom=document.createElement('span');bottom.className='operand second-operand';bottom.textContent=match[3];bottom.dataset.operator=match[2];
   const space=document.createElement('span');space.className='result-space result-answer';space.textContent=item.answer;space.setAttribute('aria-hidden','true');stack.append(top,bottom,space);li.append(number,stack);
  }else{
   if(['prehistoric','ancient','goryeo','joseon','modern','history-mix','history-review'].includes(sheet.topic))li.classList.add('history-question');
   if(item.readingGroup){li.classList.add('reading-question');if(item.readingPassage){li.classList.add('reading-start');if(index)li.classList.add('reading-next-page');const passage=document.createElement('section');passage.className='reading-text';const heading=document.createElement('h3');heading.textContent=item.readingTitle;const body=document.createElement('p');body.textContent=item.readingPassage;passage.append(heading,body);li.append(passage);const number=document.createElement('span');number.className='reading-first-number';number.textContent=String(index+1);number.setAttribute('aria-hidden','true');li.append(number)}}
   if(item.format==='matching'){
    li.classList.add('history-match');const row=document.createElement('div');row.className='match-row';const person=document.createElement('strong');person.textContent=item.prompt;const right=document.createElement('span');right.textContent=`${index+1}  ${item.right}`;row.append(person,right);li.append(row);
   }else{const prompt=document.createElement('strong');prompt.textContent=item.prompt;li.append(prompt)}
   if(item.format==='ordering'){const sequence=document.createElement('div');sequence.className='order-choices';item.orderChoices.forEach((event,i)=>{const box=document.createElement('span');box.textContent=`${i+1}  ${event}  □`;sequence.append(box)});li.append(sequence)}
   if(item.detail){const detail=document.createElement('p');detail.className='question-detail'+(sheet.topic==='direction'?' map-detail':'');if(item.sourceLabel){const label=document.createElement('small');label.className='evidence-label';label.textContent=item.source?'역사 자료를 바탕으로 재구성':'가상의 연습 자료';detail.append(label)}detail.append(document.createTextNode(item.detail));li.append(detail)}
   if(item.choices?.length){const list=document.createElement('ul');list.className='choice-list';item.choices.forEach((answer,i)=>{const choice=document.createElement('li');choice.textContent=['①','②','③','④'][i]+' '+answer;list.append(choice)});li.append(list)}
   else if(item.format!=='matching'){const line=document.createElement('span');line.className='answer-blank';line.setAttribute('aria-hidden','true');li.append(line)}
   const inlineAnswer=document.createElement('span');inlineAnswer.className='inline-answer result-answer';inlineAnswer.textContent='정답: '+(item.choices?.length?['①','②','③','④'][item.choices.indexOf(item.answer)]+' ':'')+item.answer;
   if(item.explanation){const why=document.createElement('small');why.className='answer-explanation';why.textContent='근거: '+item.explanation;inlineAnswer.append(why)}
   if(item.sourceLabel){const source=document.createElement(item.source?'a':'small');source.className='answer-source';source.textContent='자료: '+item.sourceLabel;if(item.source){source.href=item.source;source.target='_blank';source.rel='noopener noreferrer'}inlineAnswer.append(source)}
   if(item.sourceAges?.length>1){const ages=document.createElement('small');ages.className='answer-source';ages.textContent='시대별 자료: ';item.sourceAges.forEach((age,i)=>{const link=document.createElement('a');link.href=`https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_${age}`;link.textContent={'10':'선사·고대','20':'고려','30':'조선','40':'근대','50':'현대'}[age];link.target='_blank';link.rel='noopener noreferrer';if(i)ages.append(' · ');ages.append(link)});inlineAnswer.append(ages)}
   inlineAnswer.setAttribute('aria-hidden','true');li.append(inlineAnswer);
  }
  questions.append(li);
 });
 setPreview(answersVisible);
 const url=new URL(location.href);url.search=new URLSearchParams({subject:sheet.subject,grade:String(sheet.grade),unit:$('unit').value,topic:sheet.topic,...(sheet.type?{type:sheet.type}:{}),...(sheet.topic==='history-mix'?{eras:sheet.eras.join(',')}:{}),difficulty:sheet.difficulty,count:String(sheet.count),seed:String(sheet.seed),...(sheet.topic==='hundreds'&&!sheet.type?{variant:sheet.variant}:{}),...($('largePrint').checked?{large:'1'}:{})}).toString();history.replaceState(null,'',url.href);
 const qr=$('answerQr'),code=$('answerQrCode');code.replaceChildren();qr.hidden=true;
 if(/^https?:$/.test(url.protocol)&&typeof window.qrcode==='function')try{const generator=window.qrcode(0,'M');generator.addData(url.href,'Byte');generator.make();code.innerHTML=generator.createSvgTag(2,4);qr.hidden=false}catch(error){console.warn('문제지 QR을 생성할 수 없습니다.',error)}
}
function make(newSeed){try{const state={subject,grade:Number($('grade').value),topic:$('topic').value,type:$('typeSetting').hidden?'':$('type').value,eras:selectedEras(),difficulty:$('difficulty').value,variant:$('variant').value,count:Number($('count').value),seed:newSeed};render(C.generate(state))}catch(error){$('sheetStatus').textContent=error.message;$('sheetMeta').textContent=''}}
form.addEventListener('change',e=>{if(e.target.name==='subject'){subject=e.target.value;syncGrades($('grade').value);syncCount();syncDifficulty();syncHistoryEras()}else if(e.target.name==='grade'){syncUnits(null);syncCount();syncDifficulty();syncHistoryEras()}else if(e.target.name==='unit'){syncTopics();syncCount();syncDifficulty();syncHistoryEras()}else if(e.target.name==='topic'){syncTypes();syncCount();syncDifficulty();syncHistoryEras()}else if(e.target.name==='type'){syncCount();syncDifficulty()}});
form.addEventListener('submit',e=>{e.preventDefault();make(seed())});$('regenerate').onclick=()=>make(seed());
$('toggleAnswers').onclick=()=>setPreview(!answersVisible);
function print(withAnswers){if(!current)return;document.body.classList.toggle('print-answers',withAnswers);window.print()}
$('largePrint').addEventListener('change',()=>{document.body.classList.toggle('large-print',$('largePrint').checked);if(current)render(current)});
document.body.classList.toggle('large-print',$('largePrint').checked);
$('printOnly').onclick=()=>print(false);$('printWithAnswers').onclick=()=>print(true);
window.addEventListener('afterprint',()=>document.body.classList.remove('print-answers'));
make(Number.isFinite(Number(params.get('seed')))&&params.has('seed')?Number(params.get('seed')):seed());
})();
