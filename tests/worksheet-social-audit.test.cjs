'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const C=require('../daily-worksheet-core'),T=require('../worksheet-learning'),E=require('../worksheet-evidence-banks');
const eras=['prehistoric','ancient','goryeo','joseon','modern'];
const hint=answer=>Array.from(answer).map(c=>{const n=c.charCodeAt(0)-44032;return n>=0&&n<11172?'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[Math.floor(n/588)]:/[0-9]/.test(c)?'□':c;}).join('');
let JSDOM;try{({JSDOM}=require(process.env.WORKSHEET_JSDOM||'jsdom'))}catch{}
function load(search){const root=path.resolve(__dirname,'..'),raw=fs.readFileSync(path.join(root,'문제지 만들기.html'),'utf8'),dom=new JSDOM(raw.replace(/<script[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',url:'https://clasheet.test/worksheet'+search}),w=dom.window;w.requestAnimationFrame=()=>0;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};for(const [,src] of raw.matchAll(/<script src="([^"]+)"/g)){const file=src.split('?')[0];if(file!=='gulliver-app-shell.js')w.eval(fs.readFileSync(path.join(root,file),'utf8'));}return w;}
function change(w,id,value){const e=w.document.getElementById(id);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function submit(w){w.document.getElementById('sheetForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
test('historical initial hints match answers in every era, grade, format override and saved legacy type',()=>{
 for(const grade of [5,6])for(const era of eras)for(const responseFormat of ['','initial'])for(const seed of [7,42,101]){
 const o={subject:'social',grade,topic:era,type:era+'-initial',responseFormat,count:20,seed},s=C.generate(o);assert.deepEqual(C.generate(o),s);assert.equal(s.items.length,20);assert.equal(s.responseFormat,responseFormat);
 for(const q of s.items){assert.ok(C.initialAnswerAllowed(q.answer));assert.equal(q.detail,'초성·빈칸 힌트: '+hint(q.answer));assert.deepEqual(q.choices,[]);}
 }
 const s=C.generate({subject:'social',grade:5,topic:'history-mix',type:'history-mix-quiz',responseFormat:'initial',eras,count:20,seed:73});assert.ok(s.items.every(q=>q.detail==='초성·빈칸 힌트: '+hint(q.answer)));
});
test('five-era quotas preserve each selected answer format even under an opposite global format',()=>{
 for(const grade of [5,6])for(const global of ['choice','short','essay'])for(const suffix of ['quiz','ox','short','initial']){
 const o={subject:'social',grade,unitMix:eras.map(era=>({id:`s${grade}-${era}:${era}-${suffix}`,count:5})),responseFormat:global,seed:2723538565},s=C.generate(o);assert.equal(s.count,25);assert.equal(s.items.length,25);assert.deepEqual(C.generate(o),s);
 for(const era of eras)assert.equal(s.items.filter(q=>q.sourceTopic===era).length,5);
 for(const q of s.items){if(suffix==='initial')assert.equal(q.detail,'초성·빈칸 힌트: '+hint(q.answer));if(suffix==='quiz')assert.ok(q.choices.includes(q.answer));if(suffix==='short')assert.equal(q.choices.length,0);if(suffix==='ox'){assert.ok(['O','X'].includes(q.answer));assert.equal(q.answer==='O',q.oxProposal===q.originalAnswer);}}
 }
 const mixed=C.generate({subject:'social',grade:5,unitMix:eras.map((era,i)=>({id:`s5-${era}:${era}-${['initial','short','ox','quiz','initial'][i]}`,count:i+1})),responseFormat:'essay',seed:42});assert.equal(mixed.items.length,15);assert.ok(mixed.items[0].detail.startsWith('초성'));assert.equal(mixed.items.find(q=>q.sourceTopic==='goryeo').format,'ox');
});
test('all social evidence banks have complete unique options and rectangular tables',()=>{
 let questions=0;const banks=E.banks.filter(b=>b.subject==='social');for(const b of banks)for(const q of b.items){questions++;assert.ok(q.prompt&&q.answer&&q.explanation,q.evidenceId);assert.ok(q.choices.includes(q.answer),q.evidenceId);assert.equal(new Set(q.choices).size,q.choices.length,q.evidenceId);if(q.scienceMaterial?.headers)for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length,q.evidenceId);}
 assert.equal(banks.length,143);assert.equal(questions,2921);
});
test('every enabled social lesson and standard has valid answers, evidence, exact counts and reproducible selection',()=>{
 let lessons=0,sheets=0,standards=0;
 function check(o,b){const s=T.generate(o,C);sheets++;assert.equal(s.items.length,o.count);assert.deepEqual(T.generate(o,C),s);assert.equal(new Set(s.items.map(q=>q.evidenceId||JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size,o.count);
 for(const q of s.items){assert.ok(q.prompt&&q.answer&&q.explanation);assert.doesNotMatch(q.prompt,/undefined|\[object Object\]/);if(o.responseFormat==='choice'){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);}else assert.equal(q.choices.length,0);if(o.responseFormat==='initial')assert.ok(q.detail.endsWith('초성·빈칸 힌트: '+hint(q.answer)));if(q.scienceMaterial?.kind==='table')for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}
 }
 for(const u of T.catalog.filter(u=>u.subject==='social'))for(const l of u.lessons){const b=T.binding(u,l);if(!b)continue;lessons++;for(const [responseFormat] of T.formats(b))for(const seed of [7,42]){const count=T.counts(b,responseFormat).at(-1);if(count)check({subject:'social',grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,responseFormat,count,seed},b);}}
 for(const grade of [3,4,5,6])for(const s of T.standards('social',grade)){standards++;for(const [responseFormat] of T.formats(s.binding)){const count=T.counts(s.binding,responseFormat).at(-1);if(count)check({subject:'social',grade,standardCode:s.code,responseFormat,count,seed:42},s.binding);}}
 assert.equal(lessons,207);assert.ok(standards>20);console.log(JSON.stringify({lessons,standards,sheets}));
});
test('actual legacy social page preserves initial URL and all row types, and clears failed sheets',{skip:!JSDOM},()=>{
 const w=load('?subject=social&grade=5&topic=joseon&type=joseon-initial&format=short&count=10&seed=73'),d=w.document;assert.equal(d.querySelector('#responseFormat').value,'initial');assert.equal(d.querySelectorAll('#questions>li').length,10);assert.equal(d.querySelectorAll('#questions .question-detail').length,10);assert.ok([...d.querySelectorAll('#questions .question-detail')].every(e=>e.textContent.startsWith('초성')));
 const chooseHistory=format=>{const select=d.querySelector('#unitMixRows select');select.value='s5-joseon:joseon-'+format;select.dispatchEvent(new w.Event('change',{bubbles:true}));};chooseHistory('short');submit(w);assert.equal(d.querySelectorAll('#questions .question-detail').length,0);chooseHistory('ox');submit(w);assert.equal(d.querySelectorAll('#questions .ox-statement').length,10);chooseHistory('initial');submit(w);assert.equal(d.querySelectorAll('#questions .question-detail').length,10);
 const o={subject:'social',grade:5,unitMix:eras.map(era=>({id:`s5-${era}:${era}-initial`,count:5})),format:'choice',seed:2723538565};const a=load('?'+new URLSearchParams({subject:'social',grade:5,unitMix:JSON.stringify(o.unitMix),format:'choice',seed:o.seed})),ad=a.document;
 assert.equal(ad.querySelectorAll('#questions>li').length,25);assert.equal(ad.querySelectorAll('#questions .question-detail').length,25);assert.equal(ad.querySelector('#responseSetting').hidden,true);assert.equal(load(a.location.search).document.querySelector('#questions').innerHTML,ad.querySelector('#questions').innerHTML);
 a.console.warn=()=>{};const row=ad.querySelector('#unitMixRows input');row.value='100';row.dispatchEvent(new a.Event('input',{bubbles:true}));submit(a);assert.equal(ad.querySelectorAll('#questions>li').length,0);assert.equal(ad.querySelector('#printOnly').disabled,true);row.value='5';submit(a);assert.equal(ad.querySelectorAll('#questions>li').length,25);assert.equal(ad.querySelector('#printOnly').disabled,false);
});
