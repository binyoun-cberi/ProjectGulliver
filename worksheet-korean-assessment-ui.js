(()=>{
 'use strict';
 const form=document.getElementById('sheetForm');
 const editor=window.WorksheetEditor;
 const host=document.querySelector('.daily-output');
 if(!form||!editor||!host)return;
 const panel=document.createElement('section');
 panel.id='koreanListeningControls';
 panel.className='korean-listening-controls';
 panel.hidden=true;
 panel.setAttribute('aria-label','국어 듣기 평가 교사용 재생 도구');
 panel.innerHTML='<div class="korean-listening-heading"><div><strong>국어 듣기 평가 · 교사용 재생</strong><p>학생용 문제지에는 지문이 표시되지 않습니다. 교사는 아래에서 음성·대본을 관리합니다.</p></div><div class="korean-listening-settings"><label>재생 횟수 <select id="koreanReplayLimit"><option value="1">1회</option><option value="2" selected>2회</option><option value="3">3회</option></select></label><label>읽기 속도 <select id="koreanSpeechRate"><option value="0.85">천천히 · 0.85배</option><option value="1" selected>보통 · 1배</option><option value="1.15">빠르게 · 1.15배</option></select></label></div></div><div id="koreanListeningPassages" class="korean-listening-list"></div><p id="koreanListeningNotice" class="korean-listening-notice" role="status" aria-live="polite">음성은 사용 중인 브라우저의 한국어 음성에 따라 조금 다르게 들릴 수 있습니다.</p>';
 host.before(panel);
 const replay=panel.querySelector('#koreanReplayLimit');
 const rate=panel.querySelector('#koreanSpeechRate');
 const list=panel.querySelector('#koreanListeningPassages');
 const notice=panel.querySelector('#koreanListeningNotice');
 const synth=window.speechSynthesis;
 const available=Boolean(synth&&window.SpeechSynthesisUtterance);
 let active=null,playToken=0,items=[],counts=new Map();
 function announce(message){notice.textContent=message}
 function stop(){playToken++;if(synth)try{synth.cancel()}catch{};active=null;for(const card of list.children)card.classList.remove('speaking')}
 function bestVoice(){
   if(!synth)return null;
   const voices=synth.getVoices().filter(v=>/^ko(?:-|_)/i.test(v.lang));
   return voices.find(v=>/Google.*한국어|Google.*Korean/i.test(v.name))||
     voices.find(v=>/Premium|Natural|Neural|Siri/i.test(v.name))||voices[0]||null;
 }
 function updateButtons(){
   for(const card of list.children){
     const key=card.dataset.passageId,n=counts.get(key)||0,limit=Number(replay.value);
     const start=card.querySelector('[data-action="play"]');
     start.textContent='듣기 재생 '+n+'/'+limit;
     start.disabled=!available||n>=limit;
     card.querySelector('[data-action="pause"]').disabled=!available||active?.id!==key;
     card.querySelector('[data-action="stop"]').disabled=!available||active?.id!==key;
   }
 }
 function play(id){
   const p=items.find(p=>p.id===id);
   if(!p||!available)return;
   const n=counts.get(id)||0,limit=Number(replay.value);
   if(n>=limit){announce('설정된 재생 횟수를 모두 사용했어요. 새 문제지를 만들면 횟수가 초기화됩니다.');return}
   stop();
   const token=playToken;
   const utterance=new SpeechSynthesisUtterance(p.title+'. '+p.passage.replace(/\n+/g,' '));
   utterance.lang='ko-KR';utterance.rate=Number(rate.value);utterance.pitch=1;utterance.volume=1;
   const voice=bestVoice();if(voice)utterance.voice=voice;
   active={id,utterance};
   utterance.onstart=()=>{if(token===playToken){announce('「'+p.title+'」을(를) 재생하고 있습니다.');updateButtons()}};
   utterance.onend=()=>{if(token===playToken){active=null;announce('「'+p.title+'」 재생이 끝났습니다.');updateButtons()}};
   utterance.onerror=e=>{if(token===playToken){active=null;announce('음성을 재생하지 못했습니다. 브라우저의 한국어 음성과 소리 설정을 확인해 주세요.');updateButtons()}};
   try{
     synth.speak(utterance);counts.set(id,n+1);updateButtons();
     announce('「'+p.title+'」 음성 재생을 요청했습니다.');
   }catch{
     active=null;announce('이 브라우저에서는 음성을 재생할 수 없습니다.');updateButtons();
   }
 }
 function pause(id){
   if(!synth||active?.id!==id)return;
   try{
     if(synth.paused){synth.resume();announce('재생을 이어갑니다.')}
     else{synth.pause();announce('일시정지했습니다.')}
   }catch{announce('일시정지를 지원하지 않는 브라우저입니다.')}
   const card=[...list.children].find(c=>c.dataset.passageId===id);
   if(card)card.querySelector('[data-action="pause"]').textContent=synth.paused?'이어 듣기':'일시정지';
 }
 function cardFor(p,i){
   const card=document.createElement('article');card.className='korean-listening-card';card.dataset.passageId=p.id;
   const title=document.createElement('strong');title.textContent=(i+1)+'번 지문 · '+p.title;
   const buttons=document.createElement('div');buttons.className='korean-listening-buttons';
   const playButton=document.createElement('button');playButton.type='button';playButton.dataset.action='play';playButton.onclick=()=>play(p.id);
   const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.dataset.action='pause';pauseButton.textContent='일시정지';pauseButton.onclick=()=>pause(p.id);
   const stopButton=document.createElement('button');stopButton.type='button';stopButton.dataset.action='stop';stopButton.textContent='중지';stopButton.onclick=()=>{stop();announce('음성을 중지했습니다.');updateButtons()};
   const details=document.createElement('details');details.className='korean-listening-transcript';
   const summary=document.createElement('summary');summary.textContent='교사용 대본 보기';
   const body=document.createElement('p');body.textContent=p.passage;
   details.append(summary,body);
   buttons.append(playButton,pauseButton,stopButton);card.append(title,buttons,details);
   return card;
 }
 const student=document.createElement('section');
 student.id='koreanAssessmentStudent';
 student.className='korean-assessment-student';
 student.hidden=true;
 student.setAttribute('aria-label','국어 읽기·듣기 평가 학생 응시');
 student.innerHTML='<div class="korean-student-heading"><div><strong id="koreanStudentTitle">국어 평가 · 학생 응시</strong><p>문제를 화면에서 풀고 채점 결과를 확인할 수 있습니다. 인쇄용 문제지는 아래에 그대로 제공됩니다.</p></div><div class="korean-student-actions"><button type="button" id="koreanExamStart">학생 평가 시작</button><button type="button" id="koreanExamSubmit" hidden>답안 제출 · 채점</button><button type="button" id="koreanExamRetry" hidden>다시 풀기</button></div></div><p class="korean-student-info" id="koreanStudentInfo" role="status" aria-live="polite"></p><div id="koreanExamQuestions" class="korean-exam-questions" hidden></div><div id="koreanExamResult" class="korean-exam-result" hidden role="status" aria-live="polite"></div>';
 host.before(student);
 const studentTitle=student.querySelector('#koreanStudentTitle');
 const studentInfo=student.querySelector('#koreanStudentInfo');
 const startButton=student.querySelector('#koreanExamStart');
 const submitButton=student.querySelector('#koreanExamSubmit');
 const retryButton=student.querySelector('#koreanExamRetry');
 const examQuestions=student.querySelector('#koreanExamQuestions');
 const examResult=student.querySelector('#koreanExamResult');
 let assessment=null;
 function resetStudent(sheet){
   assessment=sheet?.subject==='korean'&&['reading-set','listening-set'].includes(sheet.topic)?sheet:null;
   const supported=Boolean(assessment&&assessment.items.length&&assessment.items.every(q=>Array.isArray(q.choices)&&q.choices.length>=2));
   student.hidden=!assessment;student.classList.remove('in-progress');document.body.classList.remove('korean-assessment-in-progress');
   examQuestions.hidden=true;examQuestions.replaceChildren();examResult.hidden=true;examResult.replaceChildren();
   startButton.hidden=false;submitButton.hidden=true;retryButton.hidden=true;startButton.disabled=!supported;
   if(!assessment)return;
   studentTitle.textContent=assessment.grade+'학년 국어 '+(assessment.topic==='listening-set'?'듣기':'읽기')+' 평가 · 학생 응시';
   studentInfo.textContent=supported?'총 '+assessment.items.length+'문항 · 답을 모두 고른 뒤 제출하면 바로 채점합니다.':'화면 응시는 객관식 문제 유형에서 이용할 수 있습니다. 다른 유형은 기존 문제지로 인쇄하세요.';
 }
 function buildExam(){
   if(!assessment)return;
   examQuestions.replaceChildren();
   let passageNumber=0;
   for(const [i,item] of assessment.items.entries()){
     const field=document.createElement('fieldset');field.className='korean-exam-question';field.dataset.questionIndex=String(i);
     if(item.readingPassage){
       passageNumber++;
       const context=document.createElement('div');context.className='korean-exam-passage';
       const heading=document.createElement('h3');heading.textContent='[지문 '+passageNumber+'] '+item.readingTitle;context.append(heading);
       if(assessment.topic==='reading-set'){
         const passage=document.createElement('p');passage.textContent=item.readingPassage;context.append(passage);
       }else{
         const guide=document.createElement('p');guide.textContent='음성으로 들은 내용을 떠올리며 아래 문제를 푸세요.';context.append(guide);
       }
       field.append(context);
     }
     const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+item.prompt;field.append(legend);
     const choices=document.createElement('div');choices.className='korean-exam-choices';
     for(const [j,option] of item.choices.entries()){
       const label=document.createElement('label');label.className='korean-exam-choice';
       const input=document.createElement('input');input.type='radio';input.name='korean-answer-'+i;input.value=option;
       const span=document.createElement('span');span.textContent=['①','②','③','④'][j]+' '+option;
       label.append(input,span);choices.append(label);
     }
     field.append(choices);examQuestions.append(field);
   }
 }
 function startExam(){
   if(!assessment||startButton.disabled)return;
   buildExam();student.classList.add('in-progress');document.body.classList.add('korean-assessment-in-progress');
   startButton.hidden=true;retryButton.hidden=true;submitButton.hidden=false;examResult.hidden=true;examResult.replaceChildren();
   examQuestions.hidden=false;studentInfo.textContent='답을 모두 고른 뒤 제출하세요. 채점 전에는 정답이 표시되지 않습니다.';
   examQuestions.querySelector('input')?.focus();
 }
 function gradeExam(){
   if(!assessment)return;
   const fields=[...examQuestions.querySelectorAll('.korean-exam-question')];
   const choices=fields.map(field=>field.querySelector('input:checked')?.value);
   const missing=choices.filter(v=>v===undefined).length;
   if(missing){studentInfo.textContent='답하지 않은 문제가 '+missing+'개 있습니다. 모두 답한 뒤 제출하세요.';return;}
   let correct=0;
   fields.forEach((field,i)=>{
     const item=assessment.items[i],isCorrect=choices[i]===item.answer;
     if(isCorrect)correct++;
     field.classList.toggle('correct',isCorrect);field.classList.toggle('incorrect',!isCorrect);
     for(const input of field.querySelectorAll('input'))input.disabled=true;
     const feedback=document.createElement('p');feedback.className='korean-exam-feedback';
     feedback.textContent=(isCorrect?'정답입니다. ':'다시 살펴보세요. ')+'정답: '+item.answer+(item.explanation?' · 해설: '+item.explanation:'');
     field.append(feedback);
   });
   const percent=Math.round(100*correct/assessment.items.length);
   const heading=document.createElement('strong');heading.textContent='평가 결과 · '+percent+'점';
   const detail=document.createElement('p');detail.textContent='총 '+assessment.items.length+'문항 중 '+correct+'문항 정답 · '+(assessment.items.length-correct)+'문항 오답';
   examResult.replaceChildren(heading,detail);examResult.hidden=false;
   submitButton.hidden=true;retryButton.hidden=false;studentInfo.textContent='채점이 끝났습니다. 문항별 정답과 해설을 확인하거나 다시 풀 수 있습니다.';
 }
 startButton.addEventListener('click',startExam);
 submitButton.addEventListener('click',gradeExam);
 retryButton.addEventListener('click',startExam);

 function onRender(sheet){
   resetStudent(sheet);
   stop();counts=new Map();items=[];
   const listening=sheet?.subject==='korean'&&sheet?.topic==='listening-set';
   panel.hidden=!listening;list.replaceChildren();
   if(!listening)return;
   items=sheet.items.filter(x=>x.readingPassage).map(x=>({id:x.readingGroup,title:x.readingTitle,passage:x.readingPassage}));
   items.forEach((item,i)=>list.append(cardFor(item,i)));
   announce(available?'음성은 브라우저의 한국어 TTS를 사용합니다. 교사용 대본을 확인할 수 있습니다.':'이 브라우저에서는 음성 합성을 사용할 수 없습니다. 대본은 확인할 수 있습니다.');
   updateButtons();
 }
 replay.addEventListener('change',updateButtons);
 window.addEventListener('gulliver:korean-assessment-render',e=>onRender(e.detail?.sheet));
 window.addEventListener('beforeunload',stop);
 form.addEventListener('change',e=>{
   if(['subject','grade','topic','type','unit'].includes(e.target.name)&&panel.hidden===false){
     stop();announce('조건을 바꾸었습니다. 문제지를 다시 만들면 듣기 도구가 갱신됩니다.');updateButtons();
   }
 });
 // Direct shortcuts inside the existing Korean subject controls, not a separate app.
 const tabs=document.querySelector('.learning-tabs');
 if(tabs){
   for(const [type,label] of [['reading-set','읽기 평가'],['listening-set','듣기 평가']]){
     const a=document.createElement('a');a.className='korean-eval-shortcut';a.dataset.assessmentTopic=type;a.textContent=label;
     tabs.append(a);
   }
   function syncLinks(){
     const subject=form.querySelector('input[name="subject"]:checked')?.value;
     const grade=Number(document.getElementById('grade').value)||3;
     for(const a of tabs.querySelectorAll('.korean-eval-shortcut')){
       a.hidden=subject!=='korean';
       a.href='문제지 만들기.html?'+new URLSearchParams({subject:'korean',grade:String(grade),mode:'practice',
         unit:'k'+grade+'-reading',topic:a.dataset.assessmentTopic,
         type:a.dataset.assessmentTopic+'-five',count:'10',format:'choice'}).toString();
     }
   }
   form.addEventListener('change',syncLinks);
   syncLinks();
 }
 onRender(editor.getCurrent?.());
})();
