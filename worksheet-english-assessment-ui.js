(()=>{
 'use strict';
 const form=document.getElementById('sheetForm');
 const editor=window.WorksheetEditor;
 const host=document.querySelector('.daily-output');
 if(!form||!editor||!host)return;
 const panel=document.createElement('section');
 panel.id='englishListeningControls';
 panel.className='english-listening-controls';
 panel.hidden=true;
 panel.setAttribute('aria-label','영어 듣기 평가 교사용 재생 도구');
 panel.innerHTML='<div class="english-listening-heading"><div><strong>영어 듣기 평가 · 교사용 재생</strong><p>학생용 문제지에는 지문이 표시되지 않습니다. 교사는 아래에서 음성·대본을 관리합니다.</p></div><div class="english-listening-settings"><label>재생 횟수 <select id="englishReplayLimit"><option value="1">1회</option><option value="2" selected>2회</option><option value="3">3회</option></select></label><label>읽기 속도 <select id="englishSpeechRate"><option value="0.85">천천히 · 0.85배</option><option value="1" selected>보통 · 1배</option><option value="1.15">빠르게 · 1.15배</option></select></label><label>영어 음성 <select id="englishSpeechVoice" aria-label="영어 음성 선택"><option value="auto">자동 · Google 우선</option></select></label></div></div><div id="englishListeningPassages" class="english-listening-list"></div><p id="englishListeningNotice" class="english-listening-notice" role="status" aria-live="polite">음성은 사용 중인 브라우저의 영어 음성에 따라 조금 다르게 들릴 수 있습니다.</p>';
 host.before(panel);
 const replay=panel.querySelector('#englishReplayLimit');
 const rate=panel.querySelector('#englishSpeechRate');
 const voiceSelect=panel.querySelector('#englishSpeechVoice');
 const list=panel.querySelector('#englishListeningPassages');
 const notice=panel.querySelector('#englishListeningNotice');
 const synth=window.speechSynthesis;
 const available=Boolean(synth&&window.SpeechSynthesisUtterance);
 let active=null,playToken=0,items=[],counts=new Map();
 function announce(message){notice.textContent=message}
 function stop(){playToken++;if(synth)try{synth.cancel()}catch{};active=null;for(const card of list.children)card.classList.remove('speaking')}
 const isGoogleEnglish=voice=>Boolean(voice&&/^en(?:[-_]|$)/i.test(voice.lang)&&/Google/i.test(voice.name));
 function englishVoices(){
   try{return [...(synth?.getVoices()||[])].filter(v=>/^en(?:[-_]|$)/i.test(v.lang))}catch{return []}
 }
 function bestVoice(){
   const voices=englishVoices();
   if(voiceSelect.value!=='auto'){
     const chosen=voices.find(v=>v.voiceURI===voiceSelect.value);
     if(chosen)return chosen;
   }
   return voices.find(v=>isGoogleEnglish(v)&&/^en[-_]US/i.test(v.lang))||voices.find(isGoogleEnglish)||
     voices.find(v=>/Premium|Natural|Neural|Siri/i.test(v.name))||voices[0]||null;
 }
 function refreshVoices(){
   const previous=voiceSelect.value,voices=englishVoices();
   voices.sort((a,b)=>Number(isGoogleEnglish(b)&&/^en[-_]US/i.test(b.lang))*2+Number(isGoogleEnglish(b))-(Number(isGoogleEnglish(a)&&/^en[-_]US/i.test(a.lang))*2+Number(isGoogleEnglish(a))));
   voiceSelect.replaceChildren(new Option('자동 · Google 영어 우선','auto'));
   for(const v of voices)voiceSelect.add(new Option(v.name+' ('+v.lang+')',v.voiceURI));
   voiceSelect.value=voices.some(v=>v.voiceURI===previous)?previous:'auto';
   const chosen=bestVoice();
   if(!available)announce('이 브라우저에서 음성 재생을 사용할 수 없습니다. 교사용 대본을 이용해 주세요.');
   else if(!chosen)announce('Google 영어 음성이 아직 표시되지 않았어요. 음성 목록을 확인하는 중이며 기본 영어 음성을 사용할 수 있습니다.');
   else if(isGoogleEnglish(chosen))announce('Google 영어 음성을 우선 선택했습니다. 듣기 재생에서 확인해 주세요.');
   else announce('이 환경에서는 Google 영어 음성을 제공하지 않아 '+chosen.name+' 음성을 사용합니다. 음성 목록에서 직접 바꿀 수도 있습니다.');
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
   utterance.lang='en-US';utterance.rate=Number(rate.value);utterance.pitch=1;utterance.volume=1;
   const voice=bestVoice();if(voice)utterance.voice=voice;
   active={id,utterance};
   utterance.onstart=()=>{if(token===playToken){counts.set(id,n+1);announce('「'+p.title+'」을(를) '+(isGoogleEnglish(voice)?'Google 영어':voice?.name||'기본 영어')+' 음성으로 재생하고 있습니다.');updateButtons()}};
   utterance.onend=()=>{if(token===playToken){active=null;announce('「'+p.title+'」 재생이 끝났습니다.');updateButtons()}};
   utterance.onerror=e=>{if(token===playToken){active=null;announce('음성을 재생하지 못했습니다. 브라우저의 영어 음성과 소리 설정을 확인해 주세요.');updateButtons()}};
   try{
     synth.speak(utterance);updateButtons();
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
   const card=document.createElement('article');card.className='english-listening-card';card.dataset.passageId=p.id;
   const title=document.createElement('strong');title.textContent=(i+1)+'번 지문 · '+p.title;
   const buttons=document.createElement('div');buttons.className='english-listening-buttons';
   const playButton=document.createElement('button');playButton.type='button';playButton.dataset.action='play';playButton.onclick=()=>play(p.id);
   const pauseButton=document.createElement('button');pauseButton.type='button';pauseButton.dataset.action='pause';pauseButton.textContent='일시정지';pauseButton.onclick=()=>pause(p.id);
   const stopButton=document.createElement('button');stopButton.type='button';stopButton.dataset.action='stop';stopButton.textContent='중지';stopButton.onclick=()=>{stop();announce('음성을 중지했습니다.');updateButtons()};
   const details=document.createElement('details');details.className='english-listening-transcript';
   const summary=document.createElement('summary');summary.textContent='교사용 대본 보기';
   const body=document.createElement('p');body.textContent=p.passage;
   details.append(summary,body);
   buttons.append(playButton,pauseButton,stopButton);card.append(title,buttons,details);
   return card;
 }
 const student=document.createElement('section');
 student.id='englishAssessmentStudent';
 student.className='english-assessment-student';
 student.hidden=true;
 student.setAttribute('aria-label','영어 읽기·듣기 평가 학생 응시');
 student.innerHTML='<div class="english-student-heading"><div><strong id="englishStudentTitle">영어 평가 · 학생 응시</strong><p>문제를 화면에서 풀고 채점 결과를 확인할 수 있습니다. 인쇄용 문제지는 아래에 그대로 제공됩니다.</p></div><div class="english-student-actions"><button type="button" id="englishExamStart">학생 평가 시작</button><button type="button" id="englishExamSubmit" hidden>답안 제출 · 채점</button><button type="button" id="englishExamRetry" hidden>다시 풀기</button></div></div><div class="english-student-save"><label>학생 코드 <input id="englishStudentCode" type="text" maxlength="20" autocomplete="off" placeholder="예: A01" aria-label="실명 대신 사용할 학생 코드"></label><label class="english-student-optin"><input id="englishSaveOptIn" type="checkbox"> 채점 결과를 이 기기에만 저장</label><small>실명 대신 학생 코드를 사용하세요. 결과는 이 브라우저에만 저장되며 다른 기기와 자동 동기화되지 않습니다.</small></div><p class="english-student-info" id="englishStudentInfo" role="status" aria-live="polite"></p><div id="englishExamQuestions" class="english-exam-questions" hidden></div><div id="englishExamResult" class="english-exam-result" hidden role="status" aria-live="polite"></div><p id="englishSaveStatus" class="english-save-status" role="status" aria-live="polite"></p><details class="english-stored-results" id="englishStoredResults"><summary>교사용 · 이 기기에 저장된 평가 결과</summary><p>학생 코드를 사용한 기록만 보여 줍니다. 이 기기를 사용하는 사람은 기록을 볼 수 있으므로 공용 기기에서는 저장하지 않는 것을 권장합니다.</p><div class="english-stored-actions"><button type="button" id="englishDownloadResults">CSV 내보내기</button><button type="button" id="englishClearResults">저장 기록 모두 삭제</button></div><div id="englishSavedRows" class="english-saved-rows"></div></details>';
 host.before(student);
 const studentTitle=student.querySelector('#englishStudentTitle');
 const studentInfo=student.querySelector('#englishStudentInfo');
 const startButton=student.querySelector('#englishExamStart');
 const submitButton=student.querySelector('#englishExamSubmit');
 const retryButton=student.querySelector('#englishExamRetry');
 const examQuestions=student.querySelector('#englishExamQuestions');
 const examResult=student.querySelector('#englishExamResult');
 const studentCode=student.querySelector('#englishStudentCode');
 const saveOptIn=student.querySelector('#englishSaveOptIn');
 const saveStatus=student.querySelector('#englishSaveStatus');
 const savedRows=student.querySelector('#englishSavedRows');
 const storedPanel=student.querySelector('#englishStoredResults');
 const results=window.EnglishAssessmentResults;
 let assessment=null;
 function resetStudent(sheet){
   assessment=sheet?.subject==='english'&&['reading-assessment','listening-set'].includes(sheet.topic)?sheet:null;
   const supported=Boolean(assessment&&assessment.items.length&&assessment.items.every(q=>Array.isArray(q.choices)&&q.choices.length>=2));
   student.hidden=!assessment;student.classList.remove('in-progress');document.body.classList.remove('english-assessment-in-progress');
   examQuestions.hidden=true;examQuestions.replaceChildren();examResult.hidden=true;examResult.replaceChildren();
   startButton.hidden=false;submitButton.hidden=true;retryButton.hidden=true;startButton.disabled=!supported;
   studentCode.value='';saveOptIn.checked=false;saveStatus.textContent='';refreshSavedResults();
   if(!assessment)return;
   studentTitle.textContent=assessment.grade+'학년 영어 '+(assessment.topic==='listening-set'?'듣기':'읽기')+' 평가 · 학생 응시';
   studentInfo.textContent=supported?'총 '+assessment.items.length+'문항 · 답을 모두 고른 뒤 제출하면 바로 채점합니다.':'화면 응시는 객관식 문제 유형에서 이용할 수 있습니다. 다른 유형은 기존 문제지로 인쇄하세요.';
 }
 function buildExam(){
   if(!assessment)return;
   examQuestions.replaceChildren();
   let passageNumber=0;
   for(const [i,item] of assessment.items.entries()){
     const field=document.createElement('fieldset');field.className='english-exam-question';field.dataset.questionIndex=String(i);
     if(item.readingPassage){
       passageNumber++;
       const context=document.createElement('div');context.className='english-exam-passage';
       const heading=document.createElement('h3');heading.textContent='[지문 '+passageNumber+'] '+item.readingTitle;context.append(heading);
       if(assessment.topic!=='listening-set'){
         const passage=document.createElement('p');passage.textContent=item.readingPassage;context.append(passage);
       }else{
         const guide=document.createElement('p');guide.textContent='음성으로 들은 내용을 떠올리며 아래 문제를 푸세요.';context.append(guide);
       }
       examQuestions.append(context);
     }
     const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+item.prompt;field.append(legend);
     const choices=document.createElement('div');choices.className='english-exam-choices';
     for(const [j,option] of item.choices.entries()){
       const label=document.createElement('label');label.className='english-exam-choice';
       const input=document.createElement('input');input.type='radio';input.name='english-answer-'+i;input.value=option;
       const span=document.createElement('span');span.textContent=['①','②','③','④'][j]+' '+option;
       label.append(input,span);choices.append(label);
     }
     field.append(choices);examQuestions.append(field);
   }
 }
 function startExam(){
   if(!assessment||startButton.disabled)return;
   buildExam();student.classList.add('in-progress');document.body.classList.add('english-assessment-in-progress');
   startButton.hidden=true;retryButton.hidden=true;submitButton.hidden=false;examResult.hidden=true;examResult.replaceChildren();
   examQuestions.hidden=false;studentInfo.textContent='답을 모두 고른 뒤 제출하세요. 채점 전에는 정답이 표시되지 않습니다.';
   examQuestions.querySelector('input')?.focus();
 }
 function gradeExam(){
   if(!assessment)return;
   const fields=[...examQuestions.querySelectorAll('.english-exam-question')];
   const choices=fields.map(field=>field.querySelector('input:checked')?.value);
   const missing=choices.filter(v=>v===undefined).length;
   if(missing){studentInfo.textContent='답하지 않은 문제가 '+missing+'개 있습니다. 모두 답한 뒤 제출하세요.';return;}
   const summary=results?.summarize(assessment.items,choices);
   let correct=0;
   fields.forEach((field,i)=>{
     const item=assessment.items[i],isCorrect=choices[i]===item.answer;
     if(isCorrect)correct++;
     field.classList.toggle('correct',isCorrect);field.classList.toggle('incorrect',!isCorrect);
     for(const input of field.querySelectorAll('input'))input.disabled=true;
     const feedback=document.createElement('p');feedback.className='english-exam-feedback';
     feedback.textContent=(isCorrect?'정답입니다. ':'다시 살펴보세요. ')+'정답: '+item.answer+(item.explanation?' · 해설: '+item.explanation:'');
     field.append(feedback);
   });
   const percent=Math.round(100*correct/assessment.items.length);
   const heading=document.createElement('strong');heading.textContent='평가 결과 · '+percent+'점';
   const detail=document.createElement('p');detail.textContent='총 '+assessment.items.length+'문항 중 '+correct+'문항 정답 · '+(assessment.items.length-correct)+'문항 오답';
   examResult.replaceChildren(heading,detail);examResult.hidden=false;
   if(summary){
     const weak=results.weaknesses(summary.skills);
     if(weak!=='없음'){
       const hint=document.createElement('p');hint.className='english-exam-skill-hint';
       hint.textContent='참고할 평가 요소: '+weak+' (이번 평가의 오답을 바탕으로 한 참고 정보입니다.)';
       examResult.append(hint);
     }
   }
   if(saveOptIn.checked&&results){
     try{
       const record=results.makeRecord({code:studentCode.value.trim(),grade:assessment.grade,topic:assessment.topic,summary});
       results.save(window.localStorage,record);
       saveStatus.textContent='학생 코드 '+record.code+'의 결과를 이 기기에 저장했습니다.';
       refreshSavedResults();
     }catch(error){saveStatus.textContent='채점은 완료했지만 결과를 저장하지 못했습니다. '+error.message;}
   }else{saveStatus.textContent='결과는 이 기기에 저장하지 않았습니다.';}
   submitButton.hidden=true;retryButton.hidden=false;studentInfo.textContent='채점이 끝났습니다. 문항별 정답과 해설을 확인하거나 다시 풀 수 있습니다.';
 }

 function refreshSavedResults(){
   savedRows.replaceChildren();
   if(!results){savedRows.textContent='결과 저장 기능을 불러오지 못했습니다.';return}
   let records=[];
   try{records=results.read(window.localStorage)}catch{savedRows.textContent='기기 저장소를 읽을 수 없습니다.';return}
   if(!records.length){savedRows.textContent='아직 저장된 결과가 없습니다.';return}
   const table=document.createElement('table'),thead=document.createElement('thead'),tr=document.createElement('tr');
   for(const title of ['평가 일시','학생 코드','학년','영역','점수','보완 요소']){
     const th=document.createElement('th');th.scope='col';th.textContent=title;tr.append(th);
   }
   thead.append(tr);table.append(thead);
   const tbody=document.createElement('tbody');
   for(const item of records){
     const row=document.createElement('tr');
     for(const value of [new Date(item.at).toLocaleString('en-US'),item.code,item.grade+'학년',item.mode,item.score+'점 ('+item.correct+'/'+item.total+')',results.weaknesses(item.skills)]){
       const td=document.createElement('td');td.textContent=String(value);row.append(td);
     }
     tbody.append(row);
   }
   table.append(tbody);savedRows.append(table);
 }
 student.querySelector('#englishDownloadResults').addEventListener('click',()=>{
   if(!results)return;
   const records=results.read(window.localStorage);
   if(!records.length){saveStatus.textContent='내보낼 기록이 없습니다.';return}
   const csv=results.exportCSV(records);
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='clasheet-english-assessment-results.csv';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   saveStatus.textContent='학생 코드와 점수, 평가 요소가 담긴 CSV 파일을 내보냈습니다.';
 });
 student.querySelector('#englishClearResults').addEventListener('click',()=>{
   if(!results||!window.confirm('이 브라우저에 저장된 영어 평가 기록을 모두 삭제할까요? 삭제한 기록은 복구할 수 없습니다.'))return;
   try{results.clear(window.localStorage);refreshSavedResults();saveStatus.textContent='이 브라우저의 저장 기록을 모두 삭제했습니다.'}
   catch{saveStatus.textContent='저장 기록을 삭제하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.'}
 });
 storedPanel.addEventListener('toggle',()=>{if(storedPanel.open)refreshSavedResults()});

  startButton.addEventListener('click',startExam);
 submitButton.addEventListener('click',gradeExam);
 retryButton.addEventListener('click',startExam);

 function onRender(sheet){
   resetStudent(sheet);
   stop();counts=new Map();items=[];
   const listening=sheet?.subject==='english'&&sheet?.topic==='listening-set';
   panel.hidden=!listening;list.replaceChildren();
   if(!listening)return;
   items=sheet.items.filter(x=>x.readingPassage).map(x=>({id:x.readingGroup,title:x.readingTitle,passage:x.readingPassage}));
   items.forEach((item,i)=>list.append(cardFor(item,i)));
   refreshVoices();
   updateButtons();
 }
 replay.addEventListener('change',updateButtons);
 voiceSelect.addEventListener('change',()=>{if(active)stop();refreshVoices();updateButtons()});
 synth?.addEventListener?.('voiceschanged',refreshVoices);
 window.addEventListener('gulliver:english-assessment-render',e=>onRender(e.detail?.sheet));
 window.addEventListener('beforeunload',stop);
 form.addEventListener('change',e=>{
   if(['subject','grade','topic','type','unit'].includes(e.target.name)&&panel.hidden===false){
     stop();announce('조건을 바꾸었습니다. 문제지를 다시 만들면 듣기 도구가 갱신됩니다.');updateButtons();
   }
 });
 // Direct shortcuts inside the existing English subject controls, not a separate app.
 const tabs=document.querySelector('.learning-tabs');
 if(tabs){
   for(const [type,label] of [['reading-assessment','읽기 평가'],['listening-set','듣기 평가']]){
     const a=document.createElement('a');a.className='english-eval-shortcut';a.dataset.assessmentTopic=type;a.textContent=label;
     tabs.append(a);
   }
   function syncLinks(){
     const subject=form.querySelector('input[name="subject"]:checked')?.value;
     const grade=Math.max(3,Number(document.getElementById('grade').value)||3);
     for(const a of tabs.querySelectorAll('.english-eval-shortcut')){
       a.hidden=subject!=='english';
       a.href='문제지 만들기.html?'+new URLSearchParams({subject:'english',grade:String(grade),mode:'practice',
         unit:'e'+grade+'-assessment',topic:a.dataset.assessmentTopic,
         type:'en-'+a.dataset.assessmentTopic+'-five',count:'10',format:'choice'}).toString();
     }
   }
   form.addEventListener('change',syncLinks);
   syncLinks();
 }
 onRender(editor.getCurrent?.());
})();
