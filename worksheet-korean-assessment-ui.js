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
 function onRender(sheet){
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
