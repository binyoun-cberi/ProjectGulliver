const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{test}=require('node:test');
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'))}catch{}
test('textbook settings preserve generation, reload, pending states, English and legacy URLs',{skip:!JSDOM&&'Set WORKSHEET_JSDOM to a jsdom module to run the DOM integration check'},()=>{
const root=path.resolve(__dirname,'..');const raw=fs.readFileSync(path.join(root,'문제지 만들기.html'),'utf8');
const scripts=[...raw.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1].split('?')[0]).filter(x=>x!=='gulliver-app-shell.js');
function load(search=''){const dom=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://clasheet.test/worksheet'+search});const w=dom.window;w.requestAnimationFrame=()=>0;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};for(const s of scripts)w.eval(fs.readFileSync(path.join(root,s),'utf8'));return w;}
function change(w,id,value){const e=w.document.getElementById(id);e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function submit(w){w.document.getElementById('sheetForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
let w=load('?subject=science&grade=6');let d=w.document;assert.equal(d.querySelector('#learningMode').value,'textbook');assert.equal(d.querySelectorAll('#questions > li').length,10);assert.ok(d.querySelector('.science-material'));assert.ok(w.location.search.includes('lesson='));let saved=w.location.search;let w2=load(saved);assert.equal(w2.document.querySelector('#questions').textContent,d.querySelector('#questions').textContent);
change(w,'textSemester','2');assert.equal(d.querySelectorAll('#questions > li').length,0);assert.equal(d.querySelector('#printOnly').disabled,true);assert.match(d.querySelector('#textPractice').textContent,/준비 중/);
change(w,'textSemester','1');submit(w);assert.equal(d.querySelectorAll('#questions > li').length,5);
change(w,'learningMode','practice');assert.equal(d.querySelector('#textbookControls').hidden,true);assert.equal(d.querySelector('#count').disabled,false);submit(w);assert.ok(d.querySelectorAll('#questions > li').length);
change(w,'learningMode','textbook');assert.equal(d.querySelector('#unitSetting').hidden,true);
const english=d.querySelector('input[name=subject][value=english]');english.checked=true;english.dispatchEvent(new w.Event('change',{bubbles:true}));submit(w);assert.ok(d.querySelectorAll('#questions > li').length);
w=load('?subject=math&grade=3&unit=g3-add&topic=hundreds&type=add-carry-two&count=20');assert.equal(w.document.querySelector('#learningMode').value,'practice');assert.equal(w.document.querySelectorAll('#questions > li').length,20);
change(w2,'count','1');submit(w2);const replay=load(w2.location.search);assert.equal(replay.document.querySelectorAll('#questions > li').length,1);replay.document.querySelector('#largePrint').checked=true;replay.document.querySelector('#largePrint').dispatchEvent(new replay.Event('change',{bubbles:true}));assert.ok(replay.location.search.includes('lesson='));
const social=load('?subject=social&grade=4');const st=social.WorksheetLearning;const su=st.catalog.find(u=>u.subject==='social'&&u.grade===4&&u.semester===1&&u.lessons.some(l=>st.binding(u,l)?.bankId==='map-scale'));const sl=su.lessons.find(l=>st.binding(su,l)?.bankId==='map-scale');change(social,'textUnit',su.id);change(social,'textLesson',sl.id);change(social,'count','5');submit(social);assert.equal(social.document.querySelectorAll('#questions > li').length,5);assert.ok(social.document.querySelector('.science-material table'));assert.equal(social.document.querySelectorAll('.choice-list').length,5);
const society=load('?subject=social&grade=3&semester=2');
const at=society.WorksheetLearning,au=at.catalog.find(u=>u.subject==='social'&&u.grade===3&&u.semester===2&&u.lessons.some(l=>at.binding(u,l)?.bankId==='aging-birth')),al=au.lessons.find(l=>at.binding(au,l)?.bankId==='aging-birth');
change(society,'textSemester','2');change(society,'textUnit',au.id);change(society,'textLesson',al.id);change(society,'count','5');submit(society);
assert.equal(society.document.querySelectorAll('#questions > li').length,5);assert.ok(society.document.querySelector('.science-material table'));assert.match(society.document.querySelector('#questions').textContent,/가상 마을/);
const savedSocial=load(society.location.search);assert.equal(savedSocial.document.querySelector('#questions').textContent,society.document.querySelector('#questions').textContent);
change(society,'textFormat','essay');submit(society);assert.equal(society.document.querySelectorAll('.choice-list').length,0);assert.match(society.document.querySelector('#questions').textContent,/근거/);
const history=load('?subject=social&grade=5&semester=2'),ht=history.WorksheetLearning,hu=ht.catalog.find(u=>u.lessons.some(l=>ht.binding(u,l)?.bankId==='goryeo-culture')),hl=hu.lessons.find(l=>ht.binding(hu,l)?.bankId==='goryeo-culture');
change(history,'textSemester','2');change(history,'textUnit',hu.id);change(history,'textLesson',hl.id);change(history,'textFormat','choice');change(history,'count','20');submit(history);
assert.equal(history.document.querySelectorAll('#questions > li').length,20);assert.ok(history.document.querySelector('.history-photo img'));assert.match(history.document.querySelector('.history-photo figcaption').textContent,/공공누리/);
change(history,'textFormat','essay');assert.ok(![...history.document.querySelector('#count').options].some(o=>o.value==='20'));submit(history);assert.ok(history.document.querySelectorAll('#questions > li').length);assert.equal(history.document.querySelectorAll('.choice-list').length,0);
console.log('PASS: textbook generation, table rendering, saved URL replay, semester pending, stale-print clearing, mode switch, English, legacy URL');

});
