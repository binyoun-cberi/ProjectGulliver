'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'));}catch{}
test('dictation UI separates hidden answers, grade changes, saved selections and unsupported voices',{skip:!JSDOM},()=>{
 const raw=fs.readFileSync(path.join(__dirname,'../받아쓰기.html'),'utf8');
 function load(search,voiceList=[]){const dom=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{url:'https://clasheet.test/받아쓰기.html'+search,runScripts:'outside-only'}),w=dom.window;
  w.speechSynthesis={getVoices:()=>voiceList,cancel:()=>{},speak:u=>{w.lastSpoken=u;},resume:()=>{},addEventListener:()=>{}};w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};w.print=()=>{w.printed=true;};
  for(const f of ['worksheet-dictation-topics.js','worksheet-dictation-levels.js','worksheet-dictation-data.js','worksheet-english-dictation.js','worksheet-dictation-player.js','worksheet-dictation-custom.js','worksheet-dictation-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));return w;
 }
 for(const subject of ['korean','english']){
 const timed=load('?subject='+subject+'&grade=3&seed=42&repeats=5&repeatGap=120&nextGap=300&rate=0.5'),d=timed.document;
 for(const [id,value] of [['dictRepeats','5'],['dictRepeatGap','120'],['dictNextGap','300'],['dictRate','0.5']])assert.equal(d.getElementById(id).value,value);
 assert.deepEqual([...d.getElementById('dictRepeats').options].map(o=>o.value),['1','2','3','4','5']);
 const saved=load(timed.location.search);assert.equal(saved.document.getElementById('dictNextGap').value,'300');saved.close();
 assert.equal(JSON.parse(timed.localStorage.getItem('clasheet-dictation-settings')).repeats,5);
 d.getElementById('dictStart').click();assert.equal(timed.lastSpoken.rate,.5);assert.match(d.getElementById('dictRound').textContent,/5번/);timed.close();
 }
 const oldCount=load('?grade=1&seed=42&repeats=10');assert.equal(oldCount.document.getElementById('dictRepeats').value,'3');oldCount.close();
 for(const [grade,topic] of [[1,'batchim-nasal'],[1,'batchim-stop'],[2,'batchim-spelling'],[2,'batchim-link'],[3,'batchim-double-one'],[3,'batchim-double-two']]){
 const focused=load('?grade='+grade+'&topic='+topic+'&seed=42'),fd=focused.document;assert.equal(fd.getElementById('dictTopic').value,topic);assert.match(fd.getElementById('poolInfo').textContent,/20개 중 10문장/);assert.equal(fd.querySelectorAll('#dictWritingList>li').length,10);assert.match(fd.getElementById('gradeFocus').textContent,/받침/);
 const saved=load(focused.location.search);assert.equal(saved.document.getElementById('dictAnswerList').textContent,fd.getElementById('dictAnswerList').textContent);saved.close();focused.close();
 }
 const w=load('?grade=1&seed=42'),d=w.document;assert.equal(d.querySelectorAll('#dictWritingList>li').length,10);assert.equal(d.querySelector('#dictTeacher').open,false);assert.equal(w.lastSpoken,undefined);
 const original=d.querySelector('#dictAnswerList').textContent;const replay=load(w.location.search);assert.equal(replay.document.querySelector('#dictAnswerList').textContent,original);replay.close();
 d.querySelector('#dictTeacher').open=true;d.querySelector('#dictStart').click();assert.equal(d.querySelector('#dictTeacher').open,false);assert.equal(w.lastSpoken.lang,'ko-KR');assert.equal(d.querySelector('#dictRate').disabled,true);
 w.dispatchEvent(new w.Event('beforeprint'));assert.equal(d.querySelector('#dictStart').textContent,'이어서 시작');d.querySelector('#dictPrintTeacher').click();assert.ok(d.body.classList.contains('dictation-print-teacher'));w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.body.classList.contains('dictation-print-teacher'),false);
 const old=w.lastSpoken;d.querySelector('#dictGrade').value='6';d.querySelector('#dictGrade').dispatchEvent(new w.Event('change'));assert.match(d.querySelector('#gradeFocus').textContent,/복합문/);assert.notEqual(d.querySelector('#dictAnswerList').textContent,original);old.onend();assert.equal(d.querySelector('#dictStart').disabled,false);
 d.querySelector('#newDictation').click();assert.equal(new Set(new URL(w.location).searchParams.get('items').split(',')).size,10);w.close();
 const unavailable=load('?grade=3',[{lang:'en-US',name:'English',voiceURI:'en'}]);assert.equal(unavailable.document.querySelector('#dictStart').disabled,true);unavailable.document.querySelector('#dictPrintStudent').click();assert.equal(unavailable.printed,true);unavailable.close();
 const malformed=load('?grade=5&items=g1-1');assert.match(malformed.document.querySelector('#dictNotice').textContent,/새 10문장/);malformed.close();
 const english=load('?subject=english&grade=4&topic=school&seed=42',[{lang:'en-GB',name:'English',voiceURI:'en-gb'},{lang:'ko-KR',name:'한국어',voiceURI:'ko'}]),ed=english.document;
 assert.equal(ed.querySelector('#dictSubject').value,'english');assert.deepEqual([...ed.querySelector('#dictGrade').options].map(o=>o.value),['3','4','5','6']);assert.equal(ed.querySelectorAll('.dictation-meaning').length,10);assert.equal(ed.querySelectorAll('#dictVoice option').length,2);
 ed.querySelector('#dictVoice').value='en-gb';ed.querySelector('#dictVoice').dispatchEvent(new english.Event('change'));ed.querySelector('#dictStart').click();assert.equal(english.lastSpoken.lang,'en-GB');assert.match(english.lastSpoken.text,/^Number 1\./);assert.doesNotMatch(english.lastSpoken.text,/[가-힣]/);
 const englishReplay=load(english.location.search,[{lang:'en-US',name:'English',voiceURI:'en'}]);assert.equal(englishReplay.document.querySelector('#dictAnswerList').textContent,ed.querySelector('#dictAnswerList').textContent);englishReplay.close();
 const staleEnglish=english.lastSpoken;ed.querySelector('#dictSubject').value='korean';ed.querySelector('#dictSubject').dispatchEvent(new english.Event('change'));staleEnglish.onend();assert.equal(ed.querySelector('#dictSubject').value,'korean');ed.querySelector('#dictStart').click();assert.equal(english.lastSpoken.lang,'ko-KR');english.close();
 const themed=load('?grade=5&topic=friends&seed=42'),td=themed.document;
 assert.equal(td.querySelector('#dictTopic').value,'friends');assert.match(td.querySelector('#poolInfo').textContent,/10문장 한 묶음/);assert.match(td.querySelector('#newDictation').textContent,/순서/);
 assert.ok([...td.querySelectorAll('.dictation-word-focus')].every(el=>el.textContent.includes('친구·마음')));
 const themeReplay=load(themed.location.search);assert.equal(themeReplay.document.querySelector('#dictAnswerList').textContent,td.querySelector('#dictAnswerList').textContent);themeReplay.close();
 td.querySelector('#dictStart').click();const canceled=themed.lastSpoken;td.querySelector('#dictTopic').value='earth';td.querySelector('#dictTopic').dispatchEvent(new themed.Event('change'));canceled.onend();assert.match(td.querySelector('#dictStatus').textContent,/준비/);assert.ok([...td.querySelectorAll('.dictation-word-focus')].every(el=>el.textContent.includes('환경·생활')));themed.close();
});
