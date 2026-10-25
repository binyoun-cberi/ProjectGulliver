(()=>{
'use strict';
const D=window.WorksheetDictationData,$=id=>document.getElementById(id),query=new URLSearchParams(location.search),synth=window.speechSynthesis;
let sheet,voices=[],voiceMissing=false,preference={};
try{preference=JSON.parse(localStorage.getItem('clasheet-dictation-settings')||'{}')||{};}catch{}
const controls={repeats:'dictRepeats',rate:'dictRate',repeatGap:'dictRepeatGap',nextGap:'dictNextGap'};
for(const [key,id] of Object.entries(controls)){const v=query.get(key)??preference[key];if([...$(id).options].some(o=>o.value===String(v)))$(id).value=String(v);}
if(/^[1-6]$/.test(query.get('grade')))$('dictGrade').value=query.get('grade');else if(/^[1-6]$/.test(String(preference.grade)))$('dictGrade').value=String(preference.grade);
for(const t of D.topics(Number($('dictGrade').value))){if(t.id==='all')continue;$('dictTopic').append(new Option(t.label,t.id));}
const initialTopic=query.get('topic')??preference.topic;if([...$('dictTopic').options].some(o=>o.value===initialTopic))$('dictTopic').value=initialTopic;
function settings(){return Object.fromEntries(Object.entries(controls).map(([key,id])=>[key,Number($(id).value)]));}
function save(){const options={...settings(),grade:Number($('dictGrade').value),topic:$('dictTopic').value};try{localStorage.setItem('clasheet-dictation-settings',JSON.stringify(options));}catch{}if(!sheet)return;const url=new URL(location.href);url.search=new URLSearchParams({...options,seed:sheet.seed,items:sheet.items.map(q=>q.id).join(',')});history.replaceState(null,'',url);}
function stateChanged(s){
 const active=['speaking','waiting'].includes(s.state),unavailable=!synth||!window.SpeechSynthesisUtterance||voiceMissing;
 $('dictPosition').textContent=`${s.index+1} / ${s.total||10} 문장`;
 $('dictRound').textContent=s.state==='idle'?'읽기 전':`${Math.min(s.round+(s.state==='speaking'?1:0),s.repeats)} / ${s.repeats}번 읽기`;
 $('dictProgress').value=s.state==='complete'?10:s.index+(s.round>=s.repeats?1:0);
 const messages={idle:'학생용 문제지를 준비하고 시작을 눌러 주세요.',speaking:`${s.index+1}번 문장을 읽고 있어요.`,waiting:s.phase==='repeat'?'들은 문장을 써 보세요. 잠시 뒤 한 번 더 읽어요.':'이 문장을 마저 써 보세요. 다음 문장을 준비하고 있어요.',paused:'일시정지했어요. 이어서 시작을 눌러 주세요.',complete:'10문장을 모두 읽었어요. 쓴 문장을 살펴보세요.',error:s.error};
 const message=unavailable?'한국어 음성 읽기를 사용할 수 없어요. 기기의 한국어 음성 설정을 확인해 주세요. 학생용·교사용 인쇄는 사용할 수 있어요.':messages[s.state];
 if($('dictStatus').textContent!==message)$('dictStatus').textContent=message;
 $('dictCountdown').textContent=s.state==='waiting'?`${s.remaining}초 뒤 ${s.phase==='repeat'?'같은 문장을 다시 읽어요':'다음 문장으로 넘어가요'}`:s.state==='paused'&&s.phase!=='speech'?`남은 쉬는 시간 ${s.remaining}초`:'';
 $('dictStart').textContent=s.state==='paused'?'이어서 시작':s.state==='complete'?'처음부터 다시 시작':s.state==='error'?'다시 시작':'시작';
 $('dictStart').disabled=active||unavailable;$('dictPause').disabled=!active;$('dictReplay').disabled=unavailable;
 $('dictPrevious').disabled=s.index===0;$('dictNext').disabled=s.index>=s.total-1;
 // Settings are applied as a complete new run, never midway through an utterance.
 for(const id of [...Object.values(controls),'dictVoice'])$(id).disabled=active||s.state==='paused';
}
const player=window.WorksheetDictationPlayer.create({synth,Utterance:window.SpeechSynthesisUtterance,onChange:stateChanged});
function reloadPlayer(){player.load(sheet.items,{...settings(),voice:voices.find(v=>v.voiceURI===$('dictVoice').value)||null});}
function render(){
 const size=D.bank(sheet.grade,sheet.topic).length;
 $('gradeFocus').textContent=sheet.focus;$('poolInfo').textContent=`${sheet.grade}학년 · ${sheet.topicLabel} · ${size===10?'10문장 한 묶음':size+'개 중 10문장'}`;
 $('newDictation').textContent=size===10?'↻ 이 주제의 10문장 순서 바꾸기':'↻ 다른 10문장 뽑기';
 $('backToKorean').href=`문제지 만들기.html?subject=korean&grade=${sheet.grade}`;
 $('dictPaperTitle').textContent=`${sheet.grade}학년 받아쓰기 · 10문장`;$('dictSheetNumber').textContent=`${sheet.topicLabel} · 문제지 번호 ${sheet.seed.toString(36).toUpperCase()}`;
 $('dictWritingList').replaceChildren();$('dictAnswerList').replaceChildren();$('dictTeacher').open=false;
 for(const q of sheet.items){const li=document.createElement('li'),lines=document.createElement('div'),answer=document.createElement('p');lines.className='dictation-lines';lines.setAttribute('aria-hidden','true');answer.className='dictation-answer';answer.textContent=q.text;li.append(lines,answer);$('dictWritingList').append(li);const check=document.createElement('li'),sentence=document.createElement('span'),note=document.createElement('small');sentence.textContent=q.text;note.className='dictation-word-focus';note.textContent=D.topics(sheet.grade).find(t=>t.id===q.topic).label+' · '+q.focus;check.append(sentence,note);$('dictAnswerList').append(check);}
 reloadPlayer();save();
}
function draw(){$('dictNotice').hidden=true;const seed=window.crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Date.now();sheet=D.generate({grade:Number($('dictGrade').value),topic:$('dictTopic').value,seed,excludeIds:sheet?.grade===Number($('dictGrade').value)?sheet.items.map(q=>q.id):[]});render();}
function refreshVoices(){
 let all=[];try{all=synth?.getVoices()||[];}catch{}
 voices=all.filter(v=>/^ko(?:[-_]|$)/i.test(v.lang));voiceMissing=all.length>0&&!voices.length;
 const selected=$('dictVoice').value;$('dictVoice').replaceChildren(new Option('기본 한국어 음성',''));
 for(const v of voices)$('dictVoice').append(new Option(v.name,v.voiceURI));if(voices.some(v=>v.voiceURI===selected))$('dictVoice').value=selected;
 $('voiceNote').textContent=voiceMissing?'기기의 음성 설정에서 한국어 음성을 추가한 뒤 다시 열어 주세요.':voices.length?'선택한 한국어 음성으로 읽어요. 시작 전 기기 소리를 확인해 주세요.':'기본 한국어 음성으로 시작합니다. 소리가 나지 않으면 기기의 한국어 음성 설정을 확인해 주세요.';
 if(sheet&&!['speaking','waiting','paused'].includes(player.snapshot().state))reloadPlayer();else stateChanged(player.snapshot());
}
try{sheet=D.generate({grade:Number($('dictGrade').value),topic:$('dictTopic').value,seed:query.has('seed')?Number(query.get('seed')):Date.now(),...(query.has('items')?{itemIds:query.get('items').split(',')}:{})});render();}
catch{draw();$('dictNotice').hidden=false;$('dictNotice').textContent='저장된 문장을 찾지 못해 이 학년의 새 10문장을 준비했어요.';}
refreshVoices();synth?.addEventListener('voiceschanged',refreshVoices);
$('dictGrade').onchange=draw;$('dictTopic').onchange=draw;$('newDictation').onclick=draw;
for(const id of [...Object.values(controls),'dictVoice'])$(id).onchange=()=>{reloadPlayer();save();};
$('dictStart').onclick=()=>{if($('dictTeacher').open)$('dictTeacher').open=false;player.start();};
$('dictPause').onclick=()=>player.pause();$('dictStop').onclick=()=>player.stop();$('dictPrevious').onclick=()=>player.jump(player.snapshot().index-1);$('dictNext').onclick=()=>player.jump(player.snapshot().index+1);$('dictReplay').onclick=()=>{ $('dictTeacher').open=false;player.repeat();};
function print(teacher){player.pause();document.body.classList.toggle('dictation-print-teacher',teacher);try{window.print();}catch{document.body.classList.remove('dictation-print-teacher');$('dictStatus').textContent='인쇄 창을 열지 못했어요. 브라우저의 인쇄 메뉴를 이용해 주세요.';}}
$('dictPrintStudent').onclick=()=>print(false);$('dictPrintTeacher').onclick=()=>print(true);
window.addEventListener('beforeprint',()=>player.pause());window.addEventListener('afterprint',()=>document.body.classList.remove('dictation-print-teacher'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();});window.addEventListener('pagehide',()=>player.stop());
})();
