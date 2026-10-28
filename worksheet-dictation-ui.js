(()=>{
'use strict';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),synth=window.speechSynthesis;
let sheet,voices=[],voiceMissing=false,preference={},manualVoice=false;
const Custom=window.WorksheetDictationCustom,customStore='clasheet-dictation-custom-sheets.v1',draftStore='clasheet-dictation-custom-drafts.v1';
const customMode=()=>$('dictSource').value==='custom';
$('dictSource').value=query.get('mode')==='custom'?'custom':'bank';
function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
function saveDraft(){const drafts=stored(draftStore,{});try{localStorage.setItem(draftStore,JSON.stringify({...drafts,[subject]:$('dictCustomText').value}));}catch{}}
function loadDraft(){const drafts=stored(draftStore,{});$('dictCustomText').value=typeof drafts[subject]==='string'?drafts[subject].slice(0,3200):'';}
function customControls(){document.querySelector('.dictation-intro h1').textContent=customMode()?'내 문장으로 받아쓰기':'열 문장, 차근차근 받아쓰기';document.body.classList.toggle('custom-dictation',customMode());$('dictCustomEditor').hidden=!customMode();$('dictReferences').hidden=customMode()||$('dictSubject').value==='english';for(const id of ['dictTopic','dictTopicLabel','newDictation'])$(id).hidden=customMode();$('dictTopic').disabled=customMode();$('dictCustomText').placeholder=subject==='english'?'This is my pencil.\nWe play together.':'친구와 함께 걸어요.\n책을 소중히 다뤄요.';let count=$('dictCustomText').value.split(/\r?\n/).filter(s=>s.trim()).length;try{Custom.parse($('dictCustomText').value);$('applyCustomDictation').disabled=false;$('dictCustomCount').textContent=count+' / 10문장 · 입력 순서대로 만들어요.';}catch(e){$('applyCustomDictation').disabled=true;$('dictCustomCount').textContent=e.message;}}
try{preference=JSON.parse(localStorage.getItem('clasheet-dictation-settings')||'{}')||{};}catch{}
const controls={repeats:'dictRepeats',rate:'dictRate',repeatGap:'dictRepeatGap',nextGap:'dictNextGap'};
for(const [key,id] of Object.entries(controls)){const v=query.get(key)??preference[key];if([...$(id).options].some(o=>o.value===String(v)))$(id).value=String(v);}
const languages={korean:{name:'국어',voice:'한국어',lang:'ko-KR',grades:[1,2,3,4,5,6],data:window.WorksheetDictationData},english:{name:'영어',voice:'영어',lang:'en-US',grades:[3,4,5,6],data:window.WorksheetEnglishDictation}};
// URLs saved before language selection existed are Korean, even after English use.
let subject=query.get('subject')==='english'?'english':query.get('subject')==='korean'||query.has('grade')||query.has('items')?'korean':preference.subject==='english'?'english':'korean';
let D=languages[subject].data;
function configureLanguage(grade,topic){
 const config=languages[subject];D=config.data;$('dictSubject').value=subject;
 const grades=customMode()?[1,2,3,4,5,6]:config.grades;$('dictGrade').replaceChildren(...grades.map(g=>new Option(g+'학년',String(g))));
 if(grades.includes(Number(grade)))$('dictGrade').value=String(grade);
 $('dictTopic').replaceChildren(...D.topics(config.grades.includes(Number($('dictGrade').value))?Number($('dictGrade').value):config.grades[0]).map(t=>new Option(t.label,t.id)));
 if([...$('dictTopic').options].some(o=>o.value===topic))$('dictTopic').value=topic;
 $('dictTopicLabel').textContent=subject==='korean'?'주제 · 연습 급수':'주제';
 $('dictVoiceLabel').textContent=config.voice+' 음성';document.querySelector('.dictation-intro .eyebrow').textContent='클라시트 · '+config.name;document.body.classList.toggle('english-dictation',subject==='english');
 $('dictTeacherNote').textContent=subject==='english'?'영어 문장을 확인해 주세요. 대문자·띄어쓰기·문장 부호도 살펴보세요. 뜻과 문장 부호의 이름은 음성으로 읽지 않습니다.':'수업 전에 문장과 띄어쓰기를 확인해 주세요. 마침표와 쉼표는 문장에 맞게 쓰되 음성으로 따로 읽지 않습니다.';
 document.querySelector('.dictation-instruction').textContent=subject==='english'?'영어 문장을 듣고 써 보세요. 대문자와 띄어쓰기, 문장 부호도 살펴보세요.':'문장을 듣고 띄어쓰기에 유의해 바르게 써 보세요.';
}
configureLanguage(query.get('grade')??preference.grade,query.get('topic')??preference.topic);
function settings(){return Object.fromEntries(Object.entries(controls).map(([key,id])=>[key,Number($(id).value)]));}
function save(){const options={...settings(),subject,grade:Number($('dictGrade').value),topic:$('dictTopic').value};try{localStorage.setItem('clasheet-dictation-settings',JSON.stringify(options));}catch{}if(!sheet)return;const url=new URL(location.href);if(sheet.custom){if(!sheet.customId)sheet.customId=subject+'-'+Date.now().toString(36)+'-'+sheet.seed.toString(36);const value={id:sheet.customId,subject,grade:sheet.grade,text:sheet.items.map(q=>q.text).join('\n'),seed:sheet.seed};let records=stored(customStore,[]);if(!Array.isArray(records))records=[];try{localStorage.setItem(customStore,JSON.stringify([value,...records.filter(r=>r&&r.id!==value.id)]));}catch{$('dictNotice').hidden=false;$('dictNotice').textContent='문제지는 만들었지만 브라우저에 저장하지 못했어요. 새로고침 전에 입력한 문장을 따로 보관해 주세요.';}url.search=new URLSearchParams({...options,mode:'custom',custom:sheet.customId,seed:sheet.seed});}else url.search=new URLSearchParams({...options,seed:sheet.seed,items:sheet.items.map(q=>q.id).join(',')});history.replaceState(null,'',url);}
function stateChanged(s){
 const total=sheet?.items.length||0;
 const active=['speaking','waiting'].includes(s.state),unavailable=!synth||!window.SpeechSynthesisUtterance||voiceMissing;
 $('dictPosition').textContent=`${total?s.index+1:0} / ${total} 문장`;
 $('dictRound').textContent=s.state==='idle'?'읽기 전':`${Math.min(s.round+(s.state==='speaking'?1:0),s.repeats)} / ${s.repeats}번 읽기`;
 $('dictProgress').max=total||10;$('dictProgress').value=!sheet?0:s.state==='complete'?total:s.index+(s.round>=s.repeats?1:0);
 const messages={idle:'학생용 문제지를 준비하고 시작을 눌러 주세요.',speaking:`${s.index+1}번 문장을 읽고 있어요.`,waiting:s.phase==='repeat'?'들은 문장을 써 보세요. 잠시 뒤 한 번 더 읽어요.':'이 문장을 마저 써 보세요. 다음 문장을 준비하고 있어요.',paused:'일시정지했어요. 이어서 시작을 눌러 주세요.',complete:total+'문장을 모두 읽었어요. 쓴 문장을 살펴보세요.',error:s.error};
 const message=!sheet?'입력한 문장으로 문제지를 만든 뒤 시작해 주세요.':unavailable?`${languages[subject].voice} 음성 읽기를 사용할 수 없어요. 기기의 ${languages[subject].voice} 음성 설정을 확인해 주세요. 학생용·교사용 인쇄는 사용할 수 있어요.`:messages[s.state];
 if($('dictStatus').textContent!==message)$('dictStatus').textContent=message;
 $('dictCountdown').textContent=s.state==='waiting'?`${s.remaining}초 뒤 ${s.phase==='repeat'?'같은 문장을 다시 읽어요':'다음 문장으로 넘어가요'}`:s.state==='paused'&&s.phase!=='speech'?`남은 쉬는 시간 ${s.remaining}초`:'';
 $('dictStart').textContent=s.state==='paused'?'이어서 시작':s.state==='complete'?'처음부터 다시 시작':s.state==='error'?'다시 시작':'시작';
 $('dictStart').disabled=!sheet||active||unavailable;$('dictPause').disabled=!active;$('dictReplay').disabled=!sheet||unavailable;
 $('dictPrevious').disabled=!sheet||s.index===0;$('dictNext').disabled=!sheet||s.index>=s.total-1;for(const id of ['dictPrintStudent','dictPrintTeacher','dictStop'])$(id).disabled=!sheet;
 // Settings are applied as a complete new run, never midway through an utterance.
 for(const id of [...Object.values(controls),'dictVoice'])$(id).disabled=active||s.state==='paused';
}
const player=window.WorksheetDictationPlayer.create({synth,Utterance:window.SpeechSynthesisUtterance,onChange:stateChanged});
function reloadPlayer(){if(!sheet)return;const voice=voices.find(v=>v.voiceURI===$('dictVoice').value)||null;player.load(sheet.items,{...settings(),voice,language:voice?.lang||languages[subject].lang});}
function render(){
 const size=sheet.custom?sheet.items.length:D.bank(sheet.grade,sheet.topic).length;
 $('gradeFocus').textContent=sheet.focus+(subject==='korean'&&/^level-/.test(sheet.topic)?' · 클라시트 연습 급수입니다. 학교 급수표와는 다를 수 있어요.':'');$('poolInfo').textContent=sheet.custom?`${sheet.grade}학년 · 직접 입력 · ${size}문장`:`${sheet.grade}학년 · ${sheet.topicLabel} · ${size===10?'10문장 한 묶음':size+'개 중 10문장'}`;
 $('newDictation').textContent=size===10?'↻ 이 주제의 10문장 순서 바꾸기':'↻ 다른 10문장 뽑기';
 $('backToKorean').href=`문제지 만들기.html?subject=${subject}&grade=${sheet.grade}`;$('backToKorean').textContent=languages[subject].name+' 문제지로 돌아가기 →';
 $('dictPaperTitle').textContent=`${sheet.grade}학년 ${subject==='english'?'영어 ':''}받아쓰기 · ${sheet.items.length}문장`;$('dictSheetNumber').textContent=`${sheet.topicLabel} · 문제지 번호 ${sheet.seed.toString(36).toUpperCase()}`;
 $('dictWritingList').replaceChildren();$('dictAnswerList').replaceChildren();$('dictTeacher').open=false;
 const topicNames=sheet.custom?new Map([['custom','직접 입력']]):new Map(D.topics(sheet.grade).map(t=>[t.id,t.label]));
 for(const q of sheet.items){
  const li=document.createElement('li'),lines=document.createElement('div'),answer=document.createElement('p');lines.className='dictation-lines';lines.setAttribute('aria-hidden','true');answer.className='dictation-answer';answer.lang=subject==='english'?'en':'ko';answer.textContent=q.text;li.append(lines,answer);$('dictWritingList').append(li);
  const check=document.createElement('li'),sentence=document.createElement('span'),note=document.createElement('small');sentence.textContent=q.text;sentence.lang=answer.lang;note.className='dictation-word-focus';note.textContent=topicNames.get(q.topic)+' · '+q.focus;check.append(sentence);
  if(q.translation){const meaning=document.createElement('small');meaning.className='dictation-meaning';meaning.textContent=q.translation;check.append(meaning);}
  check.append(note);$('dictAnswerList').append(check);
 }
 $('dictPrintStudent').textContent='학생용 '+sheet.items.length+'문장 쓰기 인쇄';reloadPlayer();save();
}
function draw(){if(customMode()){applyCustom();return;}$('dictNotice').hidden=true;const seed=window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now();sheet=D.generate({grade:Number($('dictGrade').value),topic:$('dictTopic').value,seed,excludeIds:sheet?.grade===Number($('dictGrade').value)?sheet.items.map(q=>q.id):[]});render();}
function refreshVoices(){
 let all=[];try{all=synth?.getVoices()||[];}catch{}
 const korean=subject==='korean',prefix=korean?/^ko(?:[-_]|$)/i:/^en(?:[-_]|$)/i;
 voices=all.filter(v=>prefix.test(v.lang));
 if(korean)voices.sort((a,b)=>Number(/google/i.test(b.name+' '+b.voiceURI))-Number(/google/i.test(a.name+' '+a.voiceURI)));
 voiceMissing=korean?!voices.length:all.length>0&&!voices.length;
 const selected=$('dictVoice').value;
 $('dictVoice').replaceChildren(...(korean?[]:[new Option('기본 영어 음성','')]));
 for(const v of voices)$('dictVoice').append(new Option(v.name+' ('+v.lang+')',v.voiceURI));
 if(voices.some(v=>v.voiceURI===selected)&&(!korean||manualVoice))$('dictVoice').value=selected;
 if(korean&&!voices.length)$('dictVoice').append(new Option('한국어 목소리를 불러오는 중이에요',''));
 const label=languages[subject].voice;
 $('voiceNote').textContent=korean?(voices.length?(/google/i.test(voices.find(v=>v.voiceURI===$('dictVoice').value)?.name||'')?'Google 한국어 목소리로 읽어요.':(voices.some(v=>/google/i.test(v.name+' '+v.voiceURI))?'선택한 한국어 목소리로 읽어요.':'이 기기에는 Google 한국어 목소리가 없어 제공되는 한국어 목소리로 읽어요.')):'한국어 목소리가 나타나지 않으면 기기의 음성 설정을 확인한 뒤 다시 열어 주세요.'):(voiceMissing?`기기의 음성 설정에서 ${label} 음성을 추가한 뒤 다시 열어 주세요.`:voices.length?`선택한 ${label} 음성으로 읽어요. 시작 전 기기 소리를 확인해 주세요.`:`기본 ${label} 음성으로 시작합니다. 소리가 나지 않으면 기기의 ${label} 음성 설정을 확인해 주세요.`);
 if(sheet&&!['speaking','waiting','paused'].includes(player.snapshot().state))reloadPlayer();else stateChanged(player.snapshot());
}
function clearCustom(){player.stop();sheet=null;$('dictWritingList').replaceChildren();$('dictAnswerList').replaceChildren();$('dictTeacher').open=false;$('dictPaperTitle').textContent='직접 입력 문장을 준비해 주세요';$('dictSheetNumber').textContent='';$('gradeFocus').textContent='입력한 문장을 순서대로 듣고 써요.';$('poolInfo').textContent='';stateChanged(player.snapshot());}
function applyCustom(){try{const seed=window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now();const next=Custom.create({text:$('dictCustomText').value,subject,grade:Number($('dictGrade').value),seed});sheet=next;saveDraft();$('dictNotice').hidden=true;render();}catch(e){clearCustom();$('dictNotice').hidden=false;$('dictNotice').textContent=e.message;}customControls();}
customControls();loadDraft();customControls();
if(customMode()){
 const records=stored(customStore,[]),record=Array.isArray(records)&&records.find(r=>r&&r.id===query.get('custom')&&r.subject===subject);
 try{if(!record)throw Error('missing');sheet=Custom.create({...record,text:record.text});sheet.customId=record.id;$('dictGrade').value=String(sheet.grade);$('dictCustomText').value=record.text;render();customControls();}
 catch{clearCustom();if(query.has('custom')){$('dictNotice').hidden=false;$('dictNotice').textContent='이 브라우저에서 저장된 직접 입력 문제지를 찾지 못했어요. 사용할 문장을 입력해 주세요.';}}
}else{
 try{sheet=D.generate({grade:Number($('dictGrade').value),topic:$('dictTopic').value,seed:query.has('seed')?Number(query.get('seed')):Date.now(),...(query.has('items')?{itemIds:query.get('items').split(',')}:{})});render();}
 catch{draw();$('dictNotice').hidden=false;$('dictNotice').textContent='저장된 문장을 찾지 못해 이 학년의 새 10문장을 준비했어요.';}
}
$('dictSource').onchange=()=>{player.stop();const grade=$('dictGrade').value,topic=$('dictTopic').value;configureLanguage(grade,topic);$('dictNotice').hidden=true;customControls();if(customMode()){loadDraft();customControls();clearCustom();const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:$('dictGrade').value,mode:'custom'});history.replaceState(null,'',url);}else draw();};
$('dictCustomText').oninput=()=>{saveDraft();clearCustom();customControls();$('dictNotice').hidden=true;const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:$('dictGrade').value,mode:'custom'});history.replaceState(null,'',url);};
$('applyCustomDictation').onclick=applyCustom;
refreshVoices();synth?.addEventListener('voiceschanged',refreshVoices);
$('dictSubject').onchange=()=>{const grade=$('dictGrade').value,topic=$('dictTopic').value;player.stop();subject=$('dictSubject').value;manualVoice=false;sheet=null;configureLanguage(grade,topic);customControls();refreshVoices();if(customMode()){loadDraft();customControls();clearCustom();const url=new URL(location.href);url.search=new URLSearchParams({subject,grade:$('dictGrade').value,mode:'custom'});history.replaceState(null,'',url);}else draw();};
$('dictGrade').onchange=()=>{const topic=$('dictTopic').value;configureLanguage($('dictGrade').value,topic);draw();};$('dictTopic').onchange=draw;$('newDictation').onclick=draw;
for(const id of [...Object.values(controls),'dictVoice'])$(id).onchange=()=>{if(id==='dictVoice'){manualVoice=true;$('voiceNote').textContent='선택한 목소리로 읽어요.';}reloadPlayer();save();};
$('dictStart').onclick=()=>{if(!sheet)return;if($('dictTeacher').open)$('dictTeacher').open=false;player.start();};
$('dictPause').onclick=()=>player.pause();$('dictStop').onclick=()=>player.stop();$('dictPrevious').onclick=()=>player.jump(player.snapshot().index-1);$('dictNext').onclick=()=>player.jump(player.snapshot().index+1);$('dictReplay').onclick=()=>{ $('dictTeacher').open=false;player.repeat();};
function print(teacher){if(!sheet)return;player.pause();document.body.classList.toggle('dictation-print-teacher',teacher);try{window.print();}catch{document.body.classList.remove('dictation-print-teacher');$('dictStatus').textContent='인쇄 창을 열지 못했어요. 브라우저의 인쇄 메뉴를 이용해 주세요.';}}
$('dictPrintStudent').onclick=()=>print(false);$('dictPrintTeacher').onclick=()=>print(true);
window.addEventListener('beforeprint',()=>player.pause());window.addEventListener('afterprint',()=>document.body.classList.remove('dictation-print-teacher'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});window.addEventListener('pagehide',()=>player.stop());
})();
