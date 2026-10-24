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
function syncUnits(preferred,topic){const unit=$('unit'),grade=Number($('grade').value),special=C.units(subject,grade);unit.replaceChildren();special.forEach(u=>option(unit,u.id,u.label));option(unit,'general','전체 학습 내용에서 고르기');const matched=special.find(u=>u.types.some(([id])=>id===params.get('type')))||special.find(u=>u.topics.includes(topic));unit.value=preferred&&[...unit.options].some(o=>o.value===preferred)?preferred:matched?.id||special[0]?.id||'general';syncTopics(topic)}
function syncTopics(preferred){const topic=$('topic'),grade=Number($('grade').value),unit=C.units(subject,grade).find(u=>u.id===$('unit').value);topic.replaceChildren();C.SUBJECTS[subject].topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)&&(!unit||unit.topics.includes(t[0]))&&(unit||!['mixed','decimal','past','local','prehistoric','ancient','goryeo','joseon','modern','history-review','reading-set'].includes(t[0]))).forEach(t=>option(topic,t[0],t[1]));if([...topic.options].some(o=>o.value===preferred))topic.value=preferred;syncTypes(params.get('type'))}
function syncTypes(preferred){const type=$('type'),available=$('unit').value!=='general'?C.types(subject,Number($('grade').value),$('topic').value,$('unit').value):[];type.replaceChildren();available.forEach(([id,label],index)=>option(type,id,`${index+1}) ${label}`));$('typeSetting').hidden=!available.length;type.disabled=!available.length;if(available.some(([id])=>id===preferred))type.value=preferred}
function selectedEras(){return [...$('historyEraSetting').querySelectorAll('input:checked')].map(input=>input.value)}
function syncHistoryEras(){const mixed=subject==='social'&&$('topic').value==='history-mix';$('historyEraSetting').hidden=!mixed;$('historyEraSetting').disabled=!mixed}
function selectedMathTypes(){return [...$('mathTypeOptions').querySelectorAll('input:checked')].map(input=>input.value)}
function syncMathTypes(preferred){const mixed=subject==='math'&&$('topic').value==='math-mix',box=$('mathTypeSetting');box.hidden=!mixed;box.disabled=!mixed;if(!mixed)return;
 const options=$('mathTypeOptions'),prior=preferred||selectedMathTypes(),grade=Number($('grade').value),groups=C.units('math',grade).filter(unit=>unit.id!==`g${grade}-mix`);options.replaceChildren();let index=0;
 for(const unit of groups){const group=document.createElement('div');group.className='math-type-group';const heading=document.createElement('strong');heading.textContent=unit.label;group.append(heading);
  for(const [id,label] of unit.types){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=prior.length?prior.includes(id):index<3;row.append(input,document.createTextNode(' '+label));group.append(row);index++}options.append(group)}
}
function denseAvailable(){if(subject!=='math')return false;if(!$('typeSetting').hidden)return /^(add-|sub-|small-|two-|times-)/.test($('type').value)&&$('type').value!=='times-missing';return ['addition','hundreds','multiplication'].includes($('topic').value)}
function syncCount(preferred){
 const dense=denseAvailable(),counts=C.supportedCounts({subject,grade:Number($('grade').value),topic:$('topic').value,
  type:$('typeSetting').hidden?'':$('type').value,eras:selectedEras(),mathTypes:selectedMathTypes(),
  difficulty:$('difficulty').value,variant:$('variant').value});
 for(const option of $('count').options)option.disabled=!counts.includes(Number(option.value));
 const prior=Number($('count').value),fallback=dense?20:10;
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
syncMathTypes(params.has('mathTypes')?params.get('mathTypes').split(','):null);syncCount(initialCount);
$('largePrint').checked=params.get('large')==='1';
function appendMathText(node,value){const parts=String(value).split(/(\d+\/\d+)/g);for(const part of parts){const match=part.match(/^(\d+)\/(\d+)$/);if(!match){node.append(document.createTextNode(part));continue}const fraction=document.createElement('span'),top=document.createElement('span'),bottom=document.createElement('span');fraction.className='stacked-fraction';fraction.setAttribute('role','img');fraction.setAttribute('aria-label',`${match[2]}분의 ${match[1]}`);top.textContent=match[1];bottom.textContent=match[2];fraction.append(top,bottom);node.append(fraction)}}
function setPreview(open){answersVisible=open;document.body.classList.toggle('show-inline-answers',open);$('toggleAnswers').textContent=open?'정답 닫기':'정답 보기';$('toggleAnswers').setAttribute('aria-expanded',String(open));
 for(const li of $('questions').children){if(li.classList.contains('calculation-item'))li.setAttribute('aria-label',li.dataset.prompt+(open?' 정답: '+li.dataset.answer:''));else li.querySelector('.inline-answer')?.setAttribute('aria-hidden',String(!open))}
}
function render(sheet){
current=sheet;
const simpleOperation=item=>/^(\d+) ([+×−]) (\d+) =$/.test(item.prompt);
const mathVertical=sheet.subject==='math'&&sheet.items.length>=5&&sheet.items.every(simpleOperation);
const dense=mathVertical&&(sheet.type?/^(add-|sub-|small-|two-|times-)/.test(sheet.type)&&sheet.type!=='times-missing':['addition','hundreds','multiplication'].includes(sheet.topic));
const compact=!dense&&sheet.items.length>=5&&sheet.items.every(item=>
  !item.readingGroup&&!item.readingPassage&&!item.photo&&!item.shapeSides&&!item.sourceLabel&&
  !['matching','ordering'].includes(item.format)&&
  String(item.prompt||'').length<=100&&String(item.detail||'').length<=85&&
  (!item.choices||item.choices.length<=4&&item.choices.every(choice=>String(choice).length<=62))
);$('sheetStatus').textContent='문제지가 준비됐어요';$('sheetMeta').textContent=C.SUBJECTS[sheet.subject].name+' · '+sheet.grade+'학년 · '+sheet.items.length+'문제'+(sheet.difficulty==='challenge'?' · 도전 문제':'');$('paperTitle').textContent=sheet.title;$('sheetNumber').textContent='문제지 번호 '+sheet.seed.toString(36).toUpperCase();
 const questions=$('questions');questions.replaceChildren();
 questions.classList.toggle('calculation-grid',dense);questions.classList.toggle('compact-questions',compact);$('questionSheet').classList.toggle('dense-paper',dense);
 $('paperInstruction').hidden=!dense;if(dense)$('paperInstruction').textContent=sheet.type?'계산해 보세요.':sheet.topic==='hundreds'?'받아올림 없이 덧셈을 하세요.':'계산해 보세요.';
 if(sheet.topic==='hundreds'&&!sheet.type)$('paperTitle').textContent+=' · '+(sheet.variant==='ones'?'B · 일의 자리까지':'A · 일의 자리가 0');
 $('paperStandard').hidden=!sheet.alignment;if(sheet.alignment)$('paperStandard').textContent=`교사용 수업 참고 · ${sheet.alignment.code} · ${sheet.alignment.scope}`;
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
   }else{const prompt=document.createElement('strong');if(sheet.subject==='math')appendMathText(prompt,item.prompt);else prompt.textContent=item.prompt;li.append(prompt)}
   if(item.format==='ordering'){const sequence=document.createElement('div');sequence.className='order-choices';item.orderChoices.forEach((event,i)=>{const box=document.createElement('span');box.textContent=`${i+1}  ${event}  □`;sequence.append(box)});li.append(sequence)}
   if(item.shapeSides){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 120 110');svg.setAttribute('width','120');svg.setAttribute('height','110');svg.setAttribute('role','img');svg.setAttribute('aria-label',`변이 ${item.shapeSides}개인 도형`);const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');polygon.setAttribute('points',Array.from({length:item.shapeSides},(_,i)=>{const angle=-Math.PI/2+i*2*Math.PI/item.shapeSides;return `${60+42*Math.cos(angle)},${55+42*Math.sin(angle)}`}).join(' '));polygon.setAttribute('fill','#f6f3ff');polygon.setAttribute('stroke','#44318b');polygon.setAttribute('stroke-width','3');svg.append(polygon);li.append(svg)}
   if(item.photo){const figure=document.createElement('figure');figure.className='history-photo';const photo=document.createElement('img');photo.src=item.photo.src;photo.alt='관찰할 국가유산·자료 사진';photo.loading='eager';const caption=document.createElement('figcaption');const link=document.createElement('a');link.href=item.photo.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.photo.credit;caption.append(link);figure.append(photo,caption);li.append(figure)}
   if(item.detail){const detail=document.createElement('p');detail.className='question-detail'+(sheet.topic==='direction'?' map-detail':'');if(item.sourceLabel){const label=document.createElement('small');label.className='evidence-label';label.textContent=item.source?'자료를 살펴보고 답하세요.':'글을 읽고 답하세요.';detail.append(label)}detail.append(document.createTextNode(item.detail));li.append(detail)}
   if(item.choices?.length){const list=document.createElement('ul');list.className='choice-list';item.choices.forEach((answer,i)=>{const choice=document.createElement('li');if(sheet.subject==='math')appendMathText(choice,['①','②','③','④'][i]+' '+answer);else choice.textContent=['①','②','③','④'][i]+' '+answer;list.append(choice)});li.append(list)}
   else if(item.format!=='matching'){const line=document.createElement('span');line.className='answer-blank';line.setAttribute('aria-hidden','true');li.append(line)}
   const inlineAnswer=document.createElement('span');inlineAnswer.className='inline-answer result-answer';const answerText='정답: '+(item.choices?.length?['①','②','③','④'][item.choices.indexOf(item.answer)]+' ':'')+item.answer;if(sheet.subject==='math')appendMathText(inlineAnswer,answerText);else inlineAnswer.textContent=answerText;
   if(item.explanation){const why=document.createElement('small');why.className='answer-explanation';why.textContent='근거: '+item.explanation;inlineAnswer.append(why)}
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
 const url=new URL(location.href);url.search=new URLSearchParams({subject:sheet.subject,grade:String(sheet.grade),unit:$('unit').value,topic:sheet.topic,...(sheet.type?{type:sheet.type}:{}),...(sheet.topic==='history-mix'?{eras:sheet.eras.join(',')}:{}),...(sheet.topic==='math-mix'?{mathTypes:sheet.mathTypes.join(',')}:{}),difficulty:sheet.difficulty,count:String(sheet.count),seed:String(sheet.seed),...(sheet.topic==='hundreds'&&!sheet.type?{variant:sheet.variant}:{}),...($('largePrint').checked?{large:'1'}:{})}).toString();history.replaceState(null,'',url.href);
 const qr=$('answerQr'),code=$('answerQrCode');code.replaceChildren();qr.hidden=true;
 if(/^https?:$/.test(url.protocol)&&typeof window.qrcode==='function')try{const generator=window.qrcode(0,'M');generator.addData(url.href,'Byte');generator.make();code.innerHTML=generator.createSvgTag(2,4);qr.hidden=false}catch(error){console.warn('문제지 QR을 생성할 수 없습니다.',error)}
}
function make(newSeed){try{const state={subject,grade:Number($('grade').value),topic:$('topic').value,type:$('typeSetting').hidden?'':$('type').value,eras:selectedEras(),mathTypes:selectedMathTypes(),difficulty:$('difficulty').value,variant:$('variant').value,count:Number($('count').value),seed:newSeed};render(C.generate(state))}catch(error){console.warn('문제지 만들기:',error);$('sheetStatus').textContent='선택한 조건으로 문제를 만들지 못했어요. 문제 유형이나 문항 수를 바꾸어 다시 시도해 주세요.';$('sheetMeta').textContent=''}}
form.addEventListener('change',e=>{const name=e.target.name;if(name==='subject'){subject=e.target.value;syncGrades($('grade').value);syncHistoryEras();syncMathTypes([])}else if(name==='grade'){syncUnits(null);syncHistoryEras();syncMathTypes([])}else if(name==='unit'){syncTopics();syncHistoryEras();syncMathTypes()}else if(name==='topic'){syncTypes();syncHistoryEras();syncMathTypes()}if(['subject','grade','unit','topic','type'].includes(name))syncDifficulty();if(name!=='count'&&name!=='largePrint')syncCount(Number($('count').value))});
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
window.addEventListener('beforeprint',()=>{if(current)window.DailyWorksheetA4?.compose()});
window.addEventListener('afterprint',()=>document.body.classList.remove('print-answers'));
make(Number.isFinite(Number(params.get('seed')))&&params.has('seed')?Number(params.get('seed')):seed());
})();
