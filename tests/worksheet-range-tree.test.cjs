'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const T=require('../worksheet-learning'),C=require('../daily-worksheet-core');let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'))}catch{}
const root=path.resolve(__dirname,'..'),raw=fs.readFileSync(path.join(root,'문제지 만들기.html'),'utf8'),scripts=[...raw.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1].split('?')[0]).filter(x=>x!=='gulliver-app-shell.js');
function load(search){const w=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://clasheet.test/worksheet'+search}).window;w.requestAnimationFrame=()=>0;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};for(const s of scripts)w.eval(fs.readFileSync(path.join(root,s),'utf8'));return w;}
function change(w,e,value){if(typeof e==='string')e=w.document.getElementById(e);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function submit(w){w.document.getElementById('sheetForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
test('math grades 1-6 mix available lessons across terms without repeating arithmetic, and restore by seed',()=>{
 for(let grade=1;grade<=6;grade++){const entries=[1,2].flatMap(term=>T.mixOptions('math',grade,term)),first=entries[0],second=entries.find(x=>x.semester!==first.semester)||entries[1],o={subject:'math',grade,semester:1,acrossSemesters:true,responseFormat:'short',seed:73,lessonMix:[{id:first.id,count:3},{id:second.id,count:7}]};
 const s=T.generateMixed(o,C);assert.equal(s.items.length,10);assert.equal(new Set(s.items.map(q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size,10);assert.equal(s.items.filter(q=>q.curriculumLesson===first.id).length,3);assert.equal(s.items.filter(q=>q.curriculumLesson===second.id).length,7);assert.deepEqual(T.generateMixed(o,C),s);assert.ok(s.curriculum.acrossSemesters);
 }
 const entries=T.mixOptions('math',3,1).filter(x=>x.binding.topic==='hundreds'),s=T.generateMixed({subject:'math',grade:3,semester:1,responseFormat:'short',seed:7,lessonMix:entries.slice(0,3).map(x=>({id:x.id,count:10}))},C);assert.equal(new Set(s.items.map(q=>q.prompt)).size,30);
});
test('all four subjects select lessons from a shared tree with counts, unit checks, ready states and clearing',{skip:!JSDOM},()=>{
 for(const subject of ['math','korean','social','science']){const w=load('?subject='+subject+'&grade=4'),d=w.document;assert.equal(d.querySelector('#learningMixSettings').hidden,false);assert.ok(d.querySelectorAll('[data-range-unit]').length);const boxes=[...d.querySelectorAll('[data-range-lesson]')].filter(x=>!x.disabled);
 change(w,boxes[0],true);assert.equal(d.querySelector('#learningMixEnabled').checked,true);assert.equal(d.querySelectorAll('#learningMixRows>div').length,1);assert.equal(d.querySelector('#count').disabled,true);
 const unitBox=d.querySelector('[data-range-unit]');assert.ok(unitBox.checked||unitBox.indeterminate);
 const before=d.querySelectorAll('[data-range-lesson]').length,pending=d.querySelector('.range-pending-toggle input');change(w,pending,true);assert.ok(d.querySelectorAll('[data-range-lesson]').length>=before);for(const box of d.querySelectorAll('[data-range-lesson]:disabled'))assert.match(box.closest('label').textContent,/준비 중/);
 d.querySelector('#clearLearningMix').click();assert.equal(d.querySelectorAll('#learningMixRows>div').length,0);assert.equal(d.querySelectorAll('[data-range-lesson]:checked').length,0);assert.equal(d.querySelector('button[type=submit]').disabled,true);
 }
});
test('math fraction and decimal selections cross terms, render exact quotas and survive reload/large print',{skip:!JSDOM},()=>{
 const w=load('?subject=math&grade=4'),d=w.document,entries=[1,2].flatMap(t=>T.mixOptions('math',4,t)),first=entries[0],second=entries.find(x=>x.semester===2);
 assert.equal(d.querySelector('#learningMixAcross').checked,true);change(w,d.querySelector(`[data-range-lesson="${first.id}"]`),true);change(w,d.querySelector(`[data-range-lesson="${second.id}"]`),true);
 const rows=[...d.querySelector('#learningMixRows').children];change(w,rows[0].querySelector('input'),3);change(w,rows[1].querySelector('input'),7);submit(w);assert.equal(d.querySelectorAll('#questions>li').length,10);assert.match(d.querySelector('#paperTitle').textContent,/수학.*여러 차시/);assert.ok(w.location.search.includes('mixTerms=all'));
 const content=d.querySelector('#questions').innerHTML;assert.equal(load(w.location.search).document.querySelector('#questions').innerHTML,content);change(w,'largePrint',true);assert.equal(d.querySelector('#questions').innerHTML,content);
 change(w,'learningMixAcross',false);assert.equal(d.querySelectorAll('#learningMixRows>div').length,1);assert.equal(d.querySelectorAll('#questions>li').length,0);
 change(w,'grade',5);assert.equal(d.querySelector('#learningMixEnabled').checked,false);
 const pending=load('?subject=math&grade=2&semester=1'),p=pending.document;const ready=p.querySelector('[data-range-lesson]:not(:disabled)');change(pending,ready,true);submit(pending);assert.equal(p.querySelectorAll('#questions>li').length,5);assert.equal(load(pending.location.search).document.querySelectorAll('#questions>li').length,5);
});
