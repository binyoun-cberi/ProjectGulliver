'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'));}catch{}
test('dictation UI separates hidden answers, grade changes, saved selections and unsupported voices',{skip:!JSDOM},()=>{
 const raw=fs.readFileSync(path.join(__dirname,'../받아쓰기.html'),'utf8');
 function load(search,voiceList=[]){const dom=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{url:'https://clasheet.test/받아쓰기.html'+search,runScripts:'outside-only'}),w=dom.window;
  w.speechSynthesis={getVoices:()=>voiceList,cancel:()=>{},speak:u=>{w.lastSpoken=u;},resume:()=>{},addEventListener:()=>{}};w.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};w.print=()=>{w.printed=true;};
  for(const f of ['worksheet-dictation-topics.js','worksheet-dictation-data.js','worksheet-dictation-player.js','worksheet-dictation-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',f),'utf8'));return w;
 }
 const w=load('?grade=1&seed=42'),d=w.document;assert.equal(d.querySelectorAll('#dictWritingList>li').length,10);assert.equal(d.querySelector('#dictTeacher').open,false);assert.equal(w.lastSpoken,undefined);
 const original=d.querySelector('#dictAnswerList').textContent;const replay=load(w.location.search);assert.equal(replay.document.querySelector('#dictAnswerList').textContent,original);replay.close();
 d.querySelector('#dictTeacher').open=true;d.querySelector('#dictStart').click();assert.equal(d.querySelector('#dictTeacher').open,false);assert.equal(w.lastSpoken.lang,'ko-KR');assert.equal(d.querySelector('#dictRate').disabled,true);
 w.dispatchEvent(new w.Event('beforeprint'));assert.equal(d.querySelector('#dictStart').textContent,'이어서 시작');d.querySelector('#dictPrintTeacher').click();assert.ok(d.body.classList.contains('dictation-print-teacher'));w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.body.classList.contains('dictation-print-teacher'),false);
 const old=w.lastSpoken;d.querySelector('#dictGrade').value='6';d.querySelector('#dictGrade').dispatchEvent(new w.Event('change'));assert.match(d.querySelector('#gradeFocus').textContent,/복합문/);assert.notEqual(d.querySelector('#dictAnswerList').textContent,original);old.onend();assert.equal(d.querySelector('#dictStart').disabled,false);
 d.querySelector('#newDictation').click();assert.equal(new Set(new URL(w.location).searchParams.get('items').split(',')).size,10);w.close();
 const unavailable=load('?grade=3',[{lang:'en-US',name:'English',voiceURI:'en'}]);assert.equal(unavailable.document.querySelector('#dictStart').disabled,true);unavailable.document.querySelector('#dictPrintStudent').click();assert.equal(unavailable.printed,true);unavailable.close();
 const malformed=load('?grade=5&items=g1-1');assert.match(malformed.document.querySelector('#dictNotice').textContent,/새 10문장/);malformed.close();
 const themed=load('?grade=5&topic=friends&seed=42'),td=themed.document;
 assert.equal(td.querySelector('#dictTopic').value,'friends');assert.match(td.querySelector('#poolInfo').textContent,/10문장 한 묶음/);assert.match(td.querySelector('#newDictation').textContent,/순서/);
 assert.ok([...td.querySelectorAll('.dictation-word-focus')].every(el=>el.textContent.includes('친구·마음')));
 const themeReplay=load(themed.location.search);assert.equal(themeReplay.document.querySelector('#dictAnswerList').textContent,td.querySelector('#dictAnswerList').textContent);themeReplay.close();
 td.querySelector('#dictStart').click();const canceled=themed.lastSpoken;td.querySelector('#dictTopic').value='earth';td.querySelector('#dictTopic').dispatchEvent(new themed.Event('change'));canceled.onend();assert.match(td.querySelector('#dictStatus').textContent,/준비/);assert.ok([...td.querySelectorAll('.dictation-word-focus')].every(el=>el.textContent.includes('환경·생활')));themed.close();
});
