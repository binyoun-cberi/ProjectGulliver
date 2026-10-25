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
function syncUnits(preferred,topic){const unit=$('unit'),grade=Number($('grade').value),special=C.units(subject,grade);unit.replaceChildren();special.forEach(u=>option(unit,u.id,u.label));option(unit,'general','전체 학습 내용에서 고르기');$('unitSetting').hidden=!special.length;const matched=special.find(u=>u.types.some(([id])=>id===params.get('type')))||special.find(u=>u.topics.includes(topic));unit.value=preferred&&[...unit.options].some(o=>o.value===preferred)?preferred:matched?.id||special[0]?.id||'general';syncTopics(topic)}
function syncTopics(preferred){const topic=$('topic'),grade=Number($('grade').value),unit=C.units(subject,grade).find(u=>u.id===$('unit').value);topic.replaceChildren();C.SUBJECTS[subject].topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)&&(!unit||unit.topics.includes(t[0]))&&(unit||!['mixed','decimal','past','local','prehistoric','ancient','goryeo','joseon','modern','history-review','reading-set'].includes(t[0]))).forEach(t=>option(topic,t[0],t[1]));if([...topic.options].some(o=>o.value===preferred))topic.value=preferred;$('topicSetting').hidden=Boolean(unit)&&topic.options.length===1;syncTypes(params.get('type'))}
function syncTypes(preferred){
 const type=$('type'),topic=$('topic').value,available=topic==='column'?C.types(subject,Number($('grade').value),topic):$('unit').value!=='general'?C.types(subject,Number($('grade').value),topic,$('unit').value):[];
 type.replaceChildren();available.forEach(([id,label])=>option(type,id,label));
 const chooseContent=subject==='math'||topic==='reading-set'||topic==='history-review';
 $('typeSetting').hidden=!available.length||!chooseContent;
 $('typeSetting').firstChild.textContent=subject==='math'?'수학 문제 유형':topic==='reading-set'?'읽을 글의 종류':'활동 종류';
 type.disabled=!available.length;
 if(available.some(([id])=>id===preferred)&&chooseContent)type.value=preferred;
 // When the legacy URL points to a historical OX or short bank, retain
 // its answer format but generate factual questions from the quiz bank.
 const previousFormat=$('responseFormat').value;
 syncAnswerFormats(previousFormat||params.get('format')||C.answerFormatFor(preferred,subject,topic));
}
function contentType(){return subject==='math'&&$('typeSetting').hidden?'':$('type').value}
function syncAnswerFormats(preferred){
 const control=$('responseSetting'),select=$('responseFormat'),available=C.answerFormats(subject,$('topic').value);
 select.replaceChildren();available.forEach(([id,label])=>option(select,id,label));
 const shown=subject!=='math'&&$('topic').value!=='history-review';
 control.hidden=!shown;select.disabled=!shown;
 if(available.some(([id])=>id===preferred))select.value=preferred;
}
function selectedEras(){return [...$('historyEraSetting').querySelectorAll('input:checked')].map(input=>input.value)}
function syncHistoryEras(){const mixed=subject==='social'&&$('topic').value==='history-mix';$('historyEraSetting').hidden=!mixed;$('historyEraSetting').disabled=!mixed}
function selectedMathTypes(){return [...$('mathTypeOptions').querySelectorAll('input:checked')].map(input=>input.value)}
function syncMathTypes(preferred){const mixed=subject==='math'&&$('topic').value==='math-mix',box=$('mathTypeSetting');box.hidden=!mixed;box.disabled=!mixed;if(!mixed)return;
 const options=$('mathTypeOptions'),prior=preferred||selectedMathTypes(),grade=Number($('grade').value),groups=C.units('math',grade).filter(unit=>unit.id!==`g${grade}-mix`&&unit.id!=='column-practice');options.replaceChildren();let index=0;
 for(const unit of groups){const group=document.createElement('div');group.className='math-type-group';const heading=document.createElement('strong');heading.textContent=unit.label;group.append(heading);
  for(const [id,label] of unit.types){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=prior.length?prior.includes(id):index<3;row.append(input,document.createTextNode(' '+label));group.append(row);index++}options.append(group)}
}
function mixPlan(){return [...$('unitMixRows').children].map(row=>({id:row.querySelector('select').value,count:Number(row.querySelector('input').value)}))}
function addMixRow(value){
 const options=C.mixOptions(subject,Number($('grade').value)),used=new Set(mixPlan().map(row=>row.id));
 const row=document.createElement('div');row.className='unit-mix-row';
 const label=document.createElement('label');label.textContent='단원 / 세부 유형';const select=document.createElement('select');select.name='mixUnit';
 for(const entry of options){let group=[...select.children].find(group=>group.label===entry.unit);if(!group){group=document.createElement('optgroup');group.label=entry.unit;select.append(group)}option(group,entry.id,entry.label)}
 select.value=value?.id||options.find(entry=>!used.has(entry.id))?.id||options[0]?.id||'';label.append(select);
 const amount=document.createElement('label');amount.textContent='문항 수';const input=document.createElement('input');input.type='number';input.name='mixCount';input.min='1';input.max='20';input.step='1';input.value=String(value?.count??5);amount.append(input);
 const remove=document.createElement('button');remove.type='button';remove.textContent='삭제';remove.setAttribute('aria-label','이 단원 삭제');remove.onclick=()=>{row.remove();updateMixTotal();updateFilterSummary()};
 row.append(label,amount,remove);$('unitMixRows').append(row);updateMixTotal();
}
function updateMixTotal(){const plan=mixPlan(),total=plan.reduce((n,row)=>n+row.count,0);$('unitMixTotal').textContent=plan.length+'개 유형 · 총 '+total+'문항';const active=$('unitMixEnabled').checked;form.classList.toggle('unit-mix-active',active);$('count').disabled=active;$('addUnitMix').disabled=plan.length>=20}
function resetMix(){ $('unitMixEnabled').checked=false;$('unitMixRows').replaceChildren();addMixRow();updateMixTotal() }
$('addUnitMix').onclick=()=>{addMixRow();updateFilterSummary()};
function denseAvailable(){if(subject!=='math')return false;if(!$('typeSetting').hidden)return /^(add-|sub-|small-|two-|times-)/.test($('type').value)&&$('type').value!=='times-missing';return ['addition','hundreds','multiplication'].includes($('topic').value)}
function syncCount(preferred){
 const column=subject==='math'&&$('topic').value==='column';$('columnSettings').hidden=!column;$('columnSettings').disabled=!column;$('columnModeLabel').textContent=$('type').value==='column-div3'?'나머지':['column-sub2','column-sub3'].includes($('type').value)?'받아내림':'받아올림';
 const dense=denseAvailable(),counts=C.supportedCounts({subject,grade:Number($('grade').value),topic:$('topic').value,
  type:contentType(),eras:selectedEras(),mathTypes:selectedMathTypes(),
  columnMode:$('columnMode').value,columnPlaces:$('columnPlaces').checked,difficulty:$('difficulty').value,variant:$('variant').value,responseFormat:subject==='math'?'':$('responseFormat').value});
 for(const option of $('count').options){option.disabled=!counts.includes(Number(option.value));option.hidden=column?![6,8,10,12].includes(Number(option.value)):[6,8,12].includes(Number(option.value));}
 const prior=Number($('count').value),fallback=column?12:dense?20:10;
 $('count').value=String(counts.includes(Number(preferred))?Number(preferred):counts.includes(prior)?prior:counts.includes(fallback)?fallback:counts[0]||5);
}
function syncDifficulty(){const typed=!$('typeSetting').hidden,hundreds=subject==='math'&&$('topic').value==='hundreds'&&!typed,math=subject==='math'&&!hundreds&&!typed;$('difficultySetting').hidden=!math;$('difficulty').disabled=!math;$('variantSetting').hidden=!hundreds;$('variant').disabled=!hundreds;if(!math)$('difficulty').value='basic';
 const standard=C.alignment(subject,$('topic').value,Number($('grade').value)),note=$('curriculumNote');note.replaceChildren();
 if(standard){note.append(document.createTextNode(`수업 준비 참고 · ${standard.code} ${standard.summary} · ${standard.scope} `));const link=document.createElement('a');link.href=standard.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='교육과정 원문 보기';note.append(link)}
 else note.textContent='학습 내용과 수업 목표를 확인한 뒤 문제를 사용해 주세요.';
}
syncGrades(initialGrade,initialTopic);
if(['basic','challenge'].includes(params.get('difficulty')))$('difficulty').value=params.get('difficulty');
if(['tens','ones'].includes(params.get('variant')))$('variant').value=params.get('variant');
syncDifficulty();
$('historyEraSetting').querySelectorAll('input').forEach(input=>{input.checked=params.has('eras')?params.get('eras').split(',').includes(input.value):true});syncHistoryEras();
if(['any','yes','no'].includes(params.get('columnMode'))) $('columnMode').value=params.get('columnMode');$('columnPlaces').checked=params.get('columnPlaces')==='1';
syncMathTypes(params.has('mathTypes')?params.get('mathTypes').split(','):null);syncCount(initialCount);
$('largePrint').checked=params.get('large')==='1';
resetMix();
if(params.has('unitMix'))try{const plan=JSON.parse(params.get('unitMix'));if(Array.isArray(plan)&&plan.length&&plan.length<=20){$('unitMixRows').replaceChildren();plan.forEach(addMixRow);$('unitMixEnabled').checked=true;$('unitMixSettings').open=true;updateMixTotal()}}catch{}

function appendMathText(node,value){const parts=String(value).split(/(\d+\/\d+)/g);for(const part of parts){const match=part.match(/^(\d+)\/(\d+)$/);if(!match){node.append(document.createTextNode(part));continue}const fraction=document.createElement('span'),top=document.createElement('span'),bottom=document.createElement('span');fraction.className='stacked-fraction';fraction.setAttribute('role','img');fraction.setAttribute('aria-label',`${match[2]}분의 ${match[1]}`);top.textContent=match[1];bottom.textContent=match[2];fraction.append(top,bottom);node.append(fraction)}}
function setPreview(open){answersVisible=open;document.body.classList.toggle('show-inline-answers',open);$('toggleAnswers').textContent=open?'정답 닫기':'정답 보기';$('toggleAnswers').setAttribute('aria-expanded',String(open));
 for(const li of $('questions').children){if(li.classList.contains('calculation-item'))li.setAttribute('aria-label',li.dataset.prompt+(open?' 정답: '+li.dataset.answer:''));else li.querySelector('.inline-answer')?.setAttribute('aria-hidden',String(!open))}
}
function renderColumn(li,item,index,places){
 li.classList.add('column-question');const q=item.column;
 const no=document.createElement('span');no.className='column-number';no.textContent=String(index+1);li.append(no);
 const grid=document.createElement('div');grid.className='column-cells';grid.setAttribute('role','img');grid.setAttribute('aria-label',item.prompt+' 계산 칸');
 function row(value,cls=''){for(const char of String(value).padStart(5,' ')){const cell=document.createElement('span');cell.className='column-cell '+cls;cell.textContent=char;grid.append(cell)}}
 if(places)row(' 천백십일','column-place');
 if(q.op==='÷'){
  row('','column-work');row(String(q.b)+')'+String(q.a),'column-division');row('','column-work');row('','column-work');row('','column-result');
 }else{row('','column-work');row(q.a);row(q.op+' '+q.b,'column-operation');row('','column-work');row('','column-result')}
 li.append(grid);const answer=document.createElement('span');answer.className='inline-answer result-answer';answer.textContent='정답: '+item.answer;answer.setAttribute('aria-hidden','true');li.append(answer);
}
function renderScienceMaterial(li,material){
 li.classList.add('science-question');const figure=document.createElement('figure');figure.className='science-material';
 const caption=document.createElement('figcaption');caption.textContent=material.title;figure.append(caption);
 if(material.kind==='diagram'){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',material.viewBox||'0 0 330 175');svg.setAttribute('role','img');svg.setAttribute('aria-label',material.title+' · 위치 관계를 나타낸 모형이며 실제 비율과 다를 수 있습니다.');
  svg.innerHTML=material.body;svg.setAttribute('aria-label',material.title+' · '+svg.textContent+' · 위치 관계를 나타낸 모형입니다.');figure.append(svg);
 }else{
  const table=document.createElement('table'),head=document.createElement('thead'),header=document.createElement('tr');
  for(const value of material.headers){const th=document.createElement('th');th.scope='col';th.textContent=value;header.append(th)}head.append(header);table.append(head);const body=document.createElement('tbody');
  for(const values of material.rows){const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=value;row.append(cell)}body.append(row)}table.append(body);figure.append(table);
 }
 if(material.note){const note=document.createElement('p');note.className='science-note';note.textContent=material.note;figure.append(note)}li.append(figure);
}
function render(sheet){
current=sheet;
const simpleOperation=item=>/^(\d+) ([+×−]) (\d+) =$/.test(item.prompt);
const column=sheet.topic==='column'||sheet.items.every(item=>item.column);
const mathVertical=!column&&sheet.subject==='math'&&sheet.items.length>=5&&sheet.items.every(simpleOperation);
const dense=mathVertical&&(sheet.type?/^(add-|sub-|small-|two-|times-)/.test(sheet.type)&&sheet.type!=='times-missing':['addition','hundreds','multiplication'].includes(sheet.topic));
const compact=!column&&!dense&&sheet.responseFormat!=='essay'&&sheet.items.length>=5&&sheet.items.every(item=>
  !item.scienceMaterial&&!item.readingGroup&&!item.readingPassage&&!item.photo&&!item.shapeSides&&!item.sourceLabel&&
  !['matching','ordering'].includes(item.format)&&
  String(item.prompt||'').length<=100&&String(item.detail||'').length<=85&&
  (!item.choices||item.choices.length<=4&&item.choices.every(choice=>String(choice).length<=62))
);$('sheetStatus').textContent='문제지가 준비됐어요';$('sheetMeta').textContent=C.SUBJECTS[sheet.subject].name+' · '+sheet.grade+'학년 · '+sheet.items.length+'문제'+(sheet.difficulty==='challenge'?' · 도전 문제':'');$('paperTitle').textContent=sheet.title;$('sheetNumber').textContent='문제지 번호 '+sheet.seed.toString(36).toUpperCase();
 const questions=$('questions');questions.replaceChildren();questions.classList.toggle('science-evidence',sheet.items.some(item=>item.scienceMaterial));
 questions.classList.toggle('photo-small',sheet.items.length<=6&&sheet.items.every(item=>item.photo));questions.classList.toggle('photo-questions',sheet.items.length>0&&sheet.items.every(item=>item.photo));questions.classList.toggle('column-questions',column);questions.classList.toggle('column-few',column&&sheet.count<=8);questions.classList.toggle('calculation-grid',dense);questions.classList.toggle('compact-questions',compact);$('questionSheet').classList.toggle('dense-paper',dense);
 $('paperInstruction').hidden=!(dense||column||sheet.subject==='science');if(sheet.subject==='science')$('paperInstruction').textContent='표와 그림은 학습용 예시 자료입니다. 자료를 살펴보고 답하세요.';if(column)$('paperInstruction').textContent='칸에 계산 과정을 쓰고 답을 구해 보세요.';if(dense)$('paperInstruction').textContent=sheet.type?'계산해 보세요.':sheet.topic==='hundreds'?'받아올림 없이 덧셈을 하세요.':'계산해 보세요.';
 if(sheet.topic==='hundreds'&&!sheet.type)$('paperTitle').textContent+=' · '+(sheet.variant==='ones'?'B · 일의 자리까지':'A · 일의 자리가 0');
 $('paperStandard').hidden=!sheet.alignment;if(sheet.alignment)$('paperStandard').textContent=`교사용 수업 참고 · ${sheet.alignment.code} · ${sheet.alignment.scope}`;
 sheet.items.forEach((item,index)=>{
  const li=document.createElement('li');if(item.format==='essay')li.classList.add('essay-question');if(item.format==='ox')li.classList.add('ox-question');li.dataset.prompt=`${index+1}번. ${item.prompt}`;li.dataset.answer=item.answer;
  if(item.column){renderColumn(li,item,index,sheet.columnPlaces);}
  else if(dense){
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
   }else{const prompt=document.createElement('strong');if(sheet.subject==='math')appendMathText(prompt,item.prompt);else prompt.textContent=item.prompt;li.append(prompt)}
   if(item.format==='ordering'){const sequence=document.createElement('div');sequence.className='order-choices';item.orderChoices.forEach((event,i)=>{const box=document.createElement('span');box.textContent=`${i+1}  ${event}  □`;sequence.append(box)});li.append(sequence)}
   if(item.shapeSides){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 120 110');svg.setAttribute('width','120');svg.setAttribute('height','110');svg.setAttribute('role','img');svg.setAttribute('aria-label',`변이 ${item.shapeSides}개인 도형`);const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');polygon.setAttribute('points',Array.from({length:item.shapeSides},(_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/item.shapeSides;return `${60+42*Math.cos(angle)},${55+42*Math.sin(angle)}`}).join(' '));polygon.setAttribute('fill','#f6f3ff');polygon.setAttribute('stroke','#44318b');polygon.setAttribute('stroke-width','3');svg.append(polygon);li.append(svg)}
   if(item.scienceMaterial){renderScienceMaterial(li,item.scienceMaterial);const figure=li.querySelector('.science-material'),prompt=li.querySelector(':scope > strong');if(prompt)li.insertBefore(figure,prompt)}
   if(item.photo){const figure=document.createElement('figure');figure.className='history-photo';const photo=document.createElement('img');photo.src=item.photo.src;photo.alt='관찰할 국가유산·자료 사진';photo.loading='eager';const caption=document.createElement('figcaption');const link=document.createElement('a');link.href=item.photo.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.photo.credit;caption.append(link);figure.append(photo,caption);li.append(figure)}
   if(item.detail){const detail=document.createElement('p');detail.className='question-detail'+(sheet.topic==='direction'?' map-detail':'');detail.append(document.createTextNode(item.detail));li.append(detail)}
   if(item.format==='ox'){const row=document.createElement('p');row.className='ox-statement';row.textContent='제시된 답: '+item.oxProposal;li.append(row)}
   if(item.choices?.length){const list=document.createElement('ul');list.className='choice-list';item.choices.forEach((answer,i)=>{const choice=document.createElement('li');if(sheet.subject==='math')appendMathText(choice,['①','②','③','④'][i]+' '+answer);else choice.textContent=['①','②','③','④'][i]+' '+answer;list.append(choice)});li.append(list)}
   else if(item.format!=='matching'){
    if(item.format==='essay'){const lines=document.createElement('div');lines.className='essay-writing';lines.setAttribute('aria-label','답과 까닭을 쓸 공간');li.append(lines)}
    else{const line=document.createElement('span');line.className='answer-blank';line.setAttribute('aria-hidden','true');li.append(line)}
   }
   const inlineAnswer=document.createElement('span');inlineAnswer.className='inline-answer result-answer';const answerText=(item.format==='essay'?'예시 답: ':'정답: ')+(item.choices?.length&&item.format!=='ox'?['①','②','③','④'][item.choices.indexOf(item.answer)]+' ':'')+item.answer;if(sheet.subject==='math')appendMathText(inlineAnswer,answerText);else inlineAnswer.textContent=answerText;
   if(item.format==='essay'&&item.modelExplanation){const why=document.createElement('small');why.className='answer-explanation';why.textContent='설명 참고: '+item.modelExplanation;inlineAnswer.append(why)}
   else if(item.explanation){const why=document.createElement('small');why.className='answer-explanation';why.textContent='근거: '+item.explanation;inlineAnswer.append(why)}
   if(item.sourceLabel){const source=document.createElement(item.source?'a':'small');source.className='answer-source';source.textContent='자료: '+item.sourceLabel;if(item.source){source.href=item.source;source.target='_blank';source.rel='noopener noreferrer'}inlineAnswer.append(source)}
   if(item.sourceAges?.length>1){const ages=document.createElement('small');ages.className='answer-source';ages.textContent='시대별 자료: ';item.sourceAges.forEach((age,i)=>{const link=document.createElement('a');link.href=`https://contents.history.go.kr/mobile/eh/list.do?code=eh_age_${age}`;link.textContent={'10':'선사·고대','20':'고려','30':'조선','40':'근대','50':'현대'}[age];link.target='_blank';link.rel='noopener noreferrer';if(i)ages.append(' · ');ages.append(link)});inlineAnswer.append(ages)}
   inlineAnswer.setAttribute('aria-hidden','true');li.append(inlineAnswer);
  }
  questions.append(li);
 });
 setPreview(answersVisible);
 // Refresh the measured student print layout after content (including images) changes.
 // The teacher copy is measured again with answers shown immediately before printing.
 requestAnimationFrame(()=>{
   if(current===sheet){
     const measured=window.DailyWorksheetA4?.compose();
     if(measured?.ok)$('sheetMeta').textContent=$('sheetMeta').textContent.replace(/ · 인쇄하면 약 \d+쪽$/,'')+' · 인쇄하면 약 '+measured.pages+'쪽';
     else if(measured&&!measured.ok)$('sheetStatus').textContent=measured.issue;
   }
 });
 const url=new URL(location.href);url.search=new URLSearchParams({subject:sheet.subject,grade:String(sheet.grade),unit:$('unit').value,topic:sheet.topic,...(sheet.unitMix?{unitMix:JSON.stringify(sheet.unitMix.map(({id,count})=>({id,count})))}:{}),...(sheet.type?{type:sheet.type}:{}),...(sheet.topic==='column'?{columnMode:sheet.columnMode,columnPlaces:sheet.columnPlaces?'1':'0'}:{}),...(sheet.responseFormat?{format:sheet.responseFormat}:{}),...(sheet.topic==='history-mix'?{eras:sheet.eras.join(',')}:{}),...(sheet.topic==='math-mix'?{mathTypes:sheet.mathTypes.join(',')}:{}),difficulty:sheet.difficulty,count:String(sheet.count),seed:String(sheet.seed),...(sheet.topic==='hundreds'&&!sheet.type?{variant:sheet.variant}:{}),...($('largePrint').checked?{large:'1'}:{})}).toString();history.replaceState(null,'',url.href);
 const qr=$('answerQr'),code=$('answerQrCode');code.replaceChildren();qr.hidden=true;
 if(/^https?:$/.test(url.protocol)&&typeof window.qrcode==='function')try{const generator=window.qrcode(0,'M');generator.addData(url.href,'Byte');generator.make();code.innerHTML=generator.createSvgTag(2,4);qr.hidden=false}catch(error){console.warn('문제지 QR을 생성할 수 없습니다.',error)}
}
function make(newSeed){try{const state={subject,grade:Number($('grade').value),topic:$('topic').value,type:contentType(),eras:selectedEras(),mathTypes:selectedMathTypes(),difficulty:$('difficulty').value,variant:$('variant').value,count:Number($('count').value),columnMode:$('columnMode').value,columnPlaces:$('columnPlaces').checked,seed:newSeed,responseFormat:subject==='math'?'':$('responseFormat').value};if($('unitMixEnabled').checked)state.unitMix=mixPlan();render(C.generate(state))}catch(error){console.warn('문제지 만들기:',error);$('sheetStatus').textContent=error.message||'선택한 조건으로 문제를 만들지 못했어요.';$('sheetMeta').textContent=''}}
function updateFilterSummary(){
 const name=C.SUBJECTS[subject].name;$('filterSubjectTitle').textContent=name+' 문제지 설정';
 const labels=[$('grade').selectedOptions[0]?.textContent,$('typeSetting').hidden?$('topic').selectedOptions[0]?.textContent:$('type').selectedOptions[0]?.textContent,$('count').value+'문항'];
 $('filterSelectionSummary').textContent=$('unitMixEnabled').checked?name+' · 여러 단원 · '+$('unitMixTotal').textContent:labels.filter(Boolean).join(' · ');
 document.querySelectorAll('[data-worksheet-subject]').forEach(link=>{if(link.dataset.worksheetSubject===subject)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
}
window.addEventListener('gulliver:worksheet-subject',e=>{const input=[...form.querySelectorAll('input[name="subject"]')].find(input=>input.value===e.detail?.subject);if(!input)return;input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));form.scrollIntoView({block:'start',behavior:'smooth'})});
form.addEventListener('change',e=>{const name=e.target.name;if(name==='subject'){subject=e.target.value;syncGrades($('grade').value);syncHistoryEras();syncMathTypes([])}else if(name==='grade'){syncUnits(null);syncHistoryEras();syncMathTypes([])}else if(name==='unit'){syncTopics();syncHistoryEras();syncMathTypes()}else if(name==='topic'){syncTypes();syncHistoryEras();syncMathTypes()}if(['subject','grade','unit','topic','type'].includes(name))syncDifficulty();if(['subject','grade'].includes(name))resetMix();updateMixTotal();if(name!=='count'&&name!=='largePrint')syncCount(Number($('count').value));updateFilterSummary();if(name!=='largePrint')$('sheetStatus').textContent='조건을 골랐어요. ‘문제지 만들기’를 눌러 반영하세요.'});
form.addEventListener('input',e=>{if(e.target.name==='mixCount'){updateMixTotal();updateFilterSummary();$('sheetStatus').textContent='문항 수를 바꿨어요. 문제지 만들기를 눌러 반영하세요.'}});
form.addEventListener('submit',e=>{e.preventDefault();make(seed())});$('regenerate').onclick=()=>make(seed());
$('toggleAnswers').onclick=()=>setPreview(!answersVisible);
async function print(withAnswers){
 if(!current)return;
 const images=[...$('questions').querySelectorAll('img')];
 try{
   await Promise.all(images.map(img=>img.decode()));
   if(images.some(img=>!img.naturalWidth))throw Error('missing image');
   await document.fonts?.ready;
 }catch{$('sheetStatus').textContent='사진을 불러오지 못해 인쇄를 멈췄어요. 새로고침 후 다시 시도해 주세요.';return}
 document.body.classList.toggle('print-answers',withAnswers);
 const result=window.DailyWorksheetA4?.compose();
 if(!result?.ok){
   $('sheetStatus').textContent=result?.issue||'A4 페이지를 만들 수 없어 인쇄를 중단했어요.';
   document.body.classList.remove('print-answers');return;
 }
 $('sheetStatus').textContent='인쇄할 문제지를 '+result.pages+'쪽으로 정리했어요.';
 window.print();
}
$('largePrint').addEventListener('change',()=>{document.body.classList.toggle('large-print',$('largePrint').checked);if(current)render(current)});
document.body.classList.toggle('large-print',$('largePrint').checked);
$('printOnly').onclick=()=>print(false);$('printWithAnswers').onclick=()=>print(true);
document.addEventListener('DOMContentLoaded',updateFilterSummary,{once:true});
window.addEventListener('beforeprint',()=>{if(current)window.DailyWorksheetA4?.compose()});
window.addEventListener('afterprint',()=>document.body.classList.remove('print-answers'));
window.WorksheetEditor={render,initialSearch:params.toString(),clear(){current=null;$('questions').replaceChildren();$('paperTitle').textContent='단원과 학습 내용을 골라 주세요.';$('sheetNumber').textContent='';$('answerQr').hidden=true;$('paperStandard').hidden=true;$('paperInstruction').hidden=true;}};
updateFilterSummary();
make(Number.isFinite(Number(params.get('seed')))&&params.has('seed')?Number(params.get('seed')):seed());
})();





