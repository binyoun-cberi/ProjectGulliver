const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{test}=require('node:test');
const T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'))}catch{}
const root=path.resolve(__dirname,'..'),raw=fs.readFileSync(path.join(root,'문제지 만들기.html'),'utf8');
const scripts=[...raw.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1].split('?')[0]).filter(x=>x!=='gulliver-app-shell.js');
function load(search=''){const dom=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://clasheet.test/worksheet'+search});const w=dom.window;w.requestAnimationFrame=()=>0;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};for(const s of scripts)w.eval(fs.readFileSync(path.join(root,s),'utf8'));return w;}
function change(w,id,value){const e=typeof id==='string'?w.document.getElementById(id):id;if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function submit(w){w.document.getElementById('sheetForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
function plan(grade,semester){const opts=T.mixOptions('social',grade,semester),first=opts.find(x=>T.capacity(x.binding,'choice')>=3),second=opts.find(x=>x.id!==first.id&&T.capacity(x.binding,'choice')>=7);return [first,second].map((x,i)=>({id:x.id,count:i?7:3}));}
test('all social grades and semesters mix current lesson banks with exact per-lesson quotas',()=>{
 for(const grade of [3,4,5,6])for(const semester of [1,2]){
 const lessonMix=plan(grade,semester),args={subject:'social',grade,semester,lessonMix,seed:123,responseFormat:'choice'},s=T.generateMixed(args,C);
 assert.equal(s.items.length,10);assert.equal(s.items.filter(x=>x.curriculumLesson===lessonMix[0].id).length,3);assert.equal(s.items.filter(x=>x.curriculumLesson===lessonMix[1].id).length,7);
 assert.deepEqual(T.generateMixed(args,C),s);
 const next=T.generateMixed({...args,seed:456,excludeEvidenceIds:s.items.map(q=>q.evidenceId)},C);
 assert.deepEqual(T.generateMixed({...args,seed:456,mixedItemIndexes:next.mixedItemIndexes},C).items,next.items);
 }
 const p=plan(5,2);assert.throws(()=>T.generateMixed({subject:'social',grade:5,semester:2,lessonMix:[p[0],p[0]]},C),/같은 차시/);
 assert.throws(()=>T.generateMixed({subject:'social',grade:5,semester:2,lessonMix:[{...p[0],count:21}]},C),/문항 수/);
 assert.throws(()=>T.generateMixed({subject:'social',grade:3,semester:1,lessonMix:p},C),/차시/);
});
test('social mixing controls survive selection changes and generate, replay, resize, redraw and reset correctly',{skip:!JSDOM},()=>{
 const w=load('?subject=social&grade=5&semester=2'),d=w.document;
 change(w,'textUnit',d.querySelector('#textUnit').options[1].value);
 assert.equal(d.querySelector('#unitMixSettings').hidden,true,'legacy mixing must remain hidden after any textbook change');
 change(w,'learningMixEnabled',true);d.querySelector('#addLearningMix').click();
 const p=plan(5,2),rows=[...d.querySelector('#learningMixRows').children];
 rows.forEach((row,i)=>{change(w,row.querySelector('select'),p[i].id);change(w,row.querySelector('input'),p[i].count);});
 assert.equal(d.querySelector('#count').disabled,true);assert.equal(d.querySelector('#count').value,'10');assert.equal(d.querySelector('button[type=submit]').disabled,false);
 let qrUrl;const originalQR=w.qrcode;w.qrcode=(...args)=>{const q=originalQR(...args),add=q.addData;q.addData=(data,...rest)=>{qrUrl=data;return add.call(q,data,...rest);};return q;};
 submit(w);assert.equal(qrUrl,w.location.href);assert.equal(d.querySelectorAll('#questions>li').length,10);assert.match(d.querySelector('#paperTitle').textContent,/여러 차시/);
 const content=d.querySelector('#questions').innerHTML,replay=load(w.location.search);assert.equal(replay.document.querySelector('#questions').innerHTML,content);assert.equal(replay.document.querySelector('#learningMixEnabled').checked,true);
 change(w,'largePrint',true);assert.equal(d.querySelector('#questions').innerHTML,content);
 d.querySelector('#regenerate').click();assert.equal(d.querySelectorAll('#questions>li').length,10);assert.equal(load(w.location.search).document.querySelector('#questions').innerHTML,d.querySelector('#questions').innerHTML);
 change(w,rows[1].querySelector('select'),p[0].id);assert.equal(d.querySelector('button[type=submit]').disabled,true);assert.equal(d.querySelectorAll('#questions>li').length,0);assert.equal(d.querySelector('#printOnly').disabled,true);
 change(w,rows[1].querySelector('select'),p[1].id);change(w,rows[1].querySelector('input'),20);change(w,rows[0].querySelector('input'),20);assert.equal(d.querySelector('button[type=submit]').disabled,false);submit(w);assert.equal(d.querySelectorAll('#questions>li').length,40);
 change(w,rows[0].querySelector('input'),21);assert.equal(d.querySelector('button[type=submit]').disabled,true);
 change(w,'textSemester','1');assert.equal(d.querySelector('#learningMixEnabled').checked,false);assert.equal(d.querySelector('#textUnit').disabled,false);
 d.querySelector('[data-mode=practice]').click();assert.equal(d.querySelector('#unitMixSettings').hidden,false);assert.equal(d.querySelector('#learningMixSettings').hidden,true);
 change(w,'unitMixEnabled',true);d.querySelector('#addUnitMix').click();submit(w);assert.equal(d.querySelectorAll('#questions>li').length,10);assert.match(d.querySelector('#paperTitle').textContent,/여러 단원/);
 d.querySelector('[data-mode=textbook]').click();assert.equal(d.querySelector('#unitMixSettings').hidden,true);assert.equal(d.querySelector('#learningMixSettings').hidden,false);assert.equal(d.querySelector('#sheetForm').classList.contains('unit-mix-active'),false);
});
