(()=>{'use strict';
const $=id=>document.getElementById(id),S=window.WorksheetSpeaking,R=window.WorksheetSpeakingRecognition,params=new URLSearchParams(location.search),student=params.get('student')==='1',Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
let sheet,queue=[],index=0,hard=[],finished=false,recognition=null,generation=0,finalText='',confirmed=[],paused=false,expired=false,deadline=0,autoTimer=null,transitioning=false,partOffset=0,pageText='';
const storageKey='clasheet-speaking:'+location.search+location.hash,notice=t=>$('notice').textContent=t;
function stop(){clearTimeout(autoTimer);autoTimer=null;transitioning=false;generation++;const old=recognition;recognition=null;if(old){try{old.abort();}catch{}}$('mic').setAttribute('aria-pressed','false');$('mic').textContent='탭하여 말하기';}
function valid(){if(expired)return false;try{R.expiry(params.get('issued'),params.get('expires'));return true;}catch(error){expired=true;stop();$('run').hidden=$('result').hidden=true;$('start').disabled=true;notice(error.message);return false;}}
function grades(){const english=$('language').value==='english';$('grade').replaceChildren(...(english?[3,4,5,6]:[1,2,3,4,5,6]).map(g=>new Option(g+'학년',g)));}
function type(){$('customLabel').hidden=$('kind').value!=='custom';$('gradeLabel').hidden=$('kind').value!=='sentence';}
if(params.get('language')==='english')$('language').value='english';
if(!student&&params.has('language')){document.querySelector('h1').textContent=$('language').value==='english'?'영어 스피킹':'국어 말하기';}
grades();type();$('language').onchange=grades;$('kind').onchange=type;
$('setup').onsubmit=e=>{e.preventDefault();$('share').hidden=true;notice('');try{
 const c=S.config({language:$('language').value,kind:$('kind').value,grade:$('grade').value,count:$('count').value,text:$('text').value,seed:crypto.getRandomValues(new Uint32Array(1))[0]});sheet=S.generate(c);
 const issued=Date.now(),lifetime=Number($('lifetime').value);if(![86400000,604800000].includes(lifetime))throw Error('유효기간을 골라 주세요.');
 $('shareSummary').textContent=(c.language==='english'?'영어 스피킹':'국어 말하기')+' · '+c.count+'문제 · '+new Date(issued+lifetime).toLocaleString('ko-KR')+'까지';
 $('taskList').replaceChildren(...sheet.items.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 const url=new URL(location.href);url.search=new URLSearchParams({student:'1',language:c.language,kind:c.kind,grade:c.grade,count:c.count,seed:c.seed,issued,expires:issued+lifetime});if(sheet.ids)url.searchParams.set('ids',sheet.ids.join(','));url.hash=c.kind==='custom'?encodeURIComponent(c.text):'';
 $('link').value=url.href;$('preview').href=url.href;$('qr').replaceChildren();$('qrNote').textContent='QR을 카메라로 찍거나 주소를 열어 주세요.';
 try{if(!/^https?:$/.test(url.protocol))throw Error();const code=qrcode(0,'M');code.addData(url.href,'Byte');code.make();$('qr').innerHTML=code.createSvgTag(4,4);$('qr').querySelector('svg').setAttribute('aria-label','학생용 말하기 과제 QR');}catch{$('qrNote').textContent='QR을 만들지 못했어요. 입력을 줄여 다시 만들거나 아래 주소를 공유해 주세요.';}$('share').hidden=false;
 }catch(error){notice(error.message);}};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('link').value);notice('학생용 주소를 복사했어요.');}catch{$('link').select();notice('주소를 선택했어요. 길게 눌러 복사해 주세요.');}};
function save(){try{sessionStorage.setItem(storageKey,JSON.stringify({queue,index,hard,finished,partOffset}));}catch{}}
function color(mask){const spans=[...$('prompt').querySelectorAll('.speech-token')];spans.forEach((span,i)=>{span.classList.toggle('matched',!!mask[i]);span.setAttribute('aria-label',span.textContent+(mask[i]?' 확인됨':' 아직 확인 안 됨'));});}
// Choose a readable prefix using the space left after the controls are laid out.
function fitPrompt(){
 const full=sheet.items[queue[index]],rest=full.slice(partOffset).trimStart(),el=$('prompt');
 const paint=text=>{el.replaceChildren(...R.tokens(text).flatMap((word,i)=>{const span=document.createElement('span');span.className='speech-token';span.textContent=word;return i?[document.createTextNode(' '),span]:[span];}));};
 let size=28;el.style.fontSize=size+'px';paint(rest);
 const fits=()=>!el.clientHeight||el.scrollHeight<=el.clientHeight+1;
 while(!fits()&&size>24){size-=2;el.style.fontSize=size+'px';}
 pageText=rest;
 if(!fits()){
  const words=rest.match(/\S+\s*/gu)||[];let count=words.length;
  while(count>1&&!fits()){count--;pageText=words.slice(0,count).join('').trimEnd();paint(pageText);}
  // An unusually long unbroken entry is split only when a whole word cannot fit.
  if(!fits()){const chars=Array.from(pageText);while(chars.length>1&&!fits()){chars.pop();pageText=chars.join('');paint(pageText);}}
 }
 const more=rest.length>pageText.length;
 document.querySelector('.practice-heading').textContent=partOffset?'이어서 말해 보세요':more?'나누어 말해 보세요':'소리 내어 말해 보세요';
 el.lang=sheet.config.language==='english'?'en':'ko';color(R.tokens(pageText).map(()=>false));
}
function showHeard(text){
 const el=$('heard');el.textContent=text||'말하면 여기에 보여요.';el.title=text||'';
 const chars=Array.from(text||'');while(chars.length>1&&el.clientHeight&&el.scrollHeight>el.clientHeight+1){chars.shift();el.textContent='…'+chars.join('');}
}
function completePart(){
 const full=sheet.items[queue[index]],rest=full.slice(partOffset),leading=rest.length-rest.trimStart().length;
 partOffset+=leading+pageText.length;
 if(full.slice(partOffset).trim()){render();return;}
 advance(false);
}
function render(){if(!valid())return;stop();paused=false;finalText='';confirmed=[];$('preparation').hidden=true;document.body.classList.toggle('practicing',!finished);$('heard').textContent='말하면 여기에 보여요.';$('start').hidden=true;$('run').hidden=finished;$('result').hidden=!finished;$('pause').hidden=false;$('resume').hidden=true;$('done').disabled=false;$('prompt').hidden=false;$('mic').hidden=false;
 if(finished){$('summary').textContent=(queue.length-hard.length)+' / '+queue.length;$('skipped').textContent='넘긴 문제 '+hard.length+'개';$('resultTitle').textContent=queue.length<sheet.items.length?'다시 연습 결과':'연습 결과';$('review').disabled=!hard.length;save();return;}
 $('progress').textContent=(index+1)+' / '+queue.length+' 문제';$('bar').max=queue.length;$('bar').value=index;
 fitPrompt();$('mic').disabled=!Speech;$('speechStatus').textContent=Speech?'파란 마이크를 누르고 말해 보세요.':'이 브라우저는 음성 인식을 지원하지 않아요. 다른 브라우저에서 열거나 다음 문제로 넘어가세요.';save();}
function begin(rows){if(!valid())return;queue=rows;index=0;partOffset=0;hard=[];finished=false;render();}
function advance(difficult){if(!valid()||finished||paused||transitioning)return;stop();if(difficult)hard.push(queue[index]);index++;partOffset=0;finished=index>=queue.length;render();}
$('start').onclick=()=>{if(!valid())return;if(!queue.length)begin(sheet.items.map((_,i)=>i));else render();};$('done').onclick=()=>advance(true);$('restart').onclick=()=>begin(sheet.items.map((_,i)=>i));$('review').onclick=()=>begin([...hard]);
$('pause').onclick=()=>{stop();paused=true;$('prompt').hidden=true;$('mic').hidden=true;$('done').disabled=$('mic').disabled=true;$('pause').hidden=true;$('resume').hidden=false;};$('resume').onclick=render;
$('mic').onclick=()=>{if(!valid()||paused||finished||!Speech)return;if(recognition){stop();color(confirmed);$('speechStatus').textContent='멈췄어요. 마이크를 눌러 다시 말할 수 있어요.';return;}
 stop();const ticket=generation;let rec;try{rec=new Speech();}catch{$('speechStatus').textContent='음성 인식을 시작하지 못했어요. 다른 브라우저에서 열어 주세요.';return;}recognition=rec;rec.lang=sheet.config.language==='english'?'en-US':'ko-KR';rec.continuous=true;rec.interimResults=true;
 const current=()=>recognition===rec&&ticket===generation&&!paused&&!finished&&valid();
 rec.onstart=()=>{if(!current())return;$('mic').setAttribute('aria-pressed','true');$('mic').textContent='탭하여 멈추기';$('speechStatus').textContent='듣고 있어요. 화면의 글을 말해 보세요.';};
 rec.onresult=event=>{if(!current())return;let sessionFinal='',interim='';for(let i=0;i<event.results.length;i++){const text=event.results[i][0]?.transcript||'';if(event.results[i].isFinal)sessionFinal+=' '+text;else interim+=' '+text;}showHeard((sessionFinal+' '+interim).trim());const base=rec.previousText||'';finalText=(base+' '+sessionFinal).trim();confirmed=R.match(pageText,finalText);const mask=R.match(pageText,finalText+' '+interim);color(mask);$('speechStatus').textContent=confirmed.length&&confirmed.every(Boolean)?'잘했어요! 다음 문제로 넘어가요.':'남은 말도 말해 보세요.';if(confirmed.length&&confirmed.every(Boolean)){stop();transitioning=true;$('done').disabled=$('mic').disabled=true;const ticket=generation;autoTimer=setTimeout(()=>{autoTimer=null;if(ticket!==generation||!valid()||paused||finished)return;transitioning=false;completePart();},650);}};
 rec.onerror=event=>{if(!current())return;const message={'not-allowed':'마이크 사용을 허용한 뒤 다시 눌러 주세요.','service-not-allowed':'이 브라우저에서 음성 인식 사용이 허용되지 않았어요.','audio-capture':'마이크를 찾지 못했어요. 기기의 마이크를 확인해 주세요.','no-speech':'말소리를 듣지 못했어요. 마이크를 눌러 다시 말해 주세요.','network':'음성 인식에 연결하지 못했어요. 인터넷을 확인해 주세요.'}[event.error]||'인식이 멈췄어요. 마이크를 눌러 다시 말해 주세요.';stop();color(confirmed);$('speechStatus').textContent=message;};
 rec.onend=()=>{if(!current())return;recognition=null;$('mic').setAttribute('aria-pressed','false');$('mic').textContent='탭하여 말하기';color(confirmed);$('speechStatus').textContent=confirmed.length&&confirmed.every(Boolean)?'잘했어요! 다음 문제로 넘어가요.':'인식이 끝났어요. 남은 말은 마이크를 눌러 다시 말해 주세요.';};
 rec.previousText=finalText;try{rec.start();}catch{stop();$('speechStatus').textContent='마이크를 시작하지 못했어요. 권한과 연결을 확인해 주세요.';}
};
if(student){document.body.classList.add('student');$('teacher').hidden=true;$('student').hidden=false;try{deadline=R.expiry(params.get('issued'),params.get('expires'));sheet=S.generate({...Object.fromEntries(params),text:decodeURIComponent(location.hash.slice(1))});$('expiresLabel').textContent=new Date(deadline).toLocaleString('ko-KR')+'까지 이용할 수 있어요.';let saved;try{saved=JSON.parse(sessionStorage.getItem(storageKey));}catch{}
 if(saved&&Array.isArray(saved.queue)&&saved.queue.length&&new Set(saved.queue).size===saved.queue.length&&saved.queue.every(i=>Number.isInteger(i)&&i>=0&&i<sheet.items.length)&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=saved.queue.length&&typeof saved.finished==='boolean'&&saved.finished===(saved.index===saved.queue.length)&&Array.isArray(saved.hard)&&new Set(saved.hard).size===saved.hard.length&&saved.hard.every(i=>saved.queue.slice(0,saved.index).includes(i))){({queue,index,hard,finished}=saved);if(Number.isInteger(saved.partOffset)&&saved.partOffset>=0&&!finished&&saved.partOffset<sheet.items[queue[index]].length)partOffset=saved.partOffset;$('start').textContent='이어서 연습';}
 document.querySelector('h1').textContent=sheet.config.language==='english'?'영어 스피킹':'국어 말하기';document.title=document.querySelector('h1').textContent+' | 클라시트';setInterval(()=>valid(),1000);
 }catch(error){expired=true;notice('과제 주소를 확인해 주세요. '+error.message);$('start').disabled=true;}}
let resizeFrame;function resizePractice(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(student&&sheet&&!finished&&!paused&&!expired&&!$('run').hidden&&!transitioning)render();});}window.addEventListener('resize',resizePractice);window.visualViewport?.addEventListener('resize',resizePractice);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(student&&!expired&&!finished&&!$('run').hidden)$('pause').click();}else if(student)valid();});window.addEventListener('pagehide',stop);
})();
