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
 assert.equal(banks.length,143);assert.equal(questions,3081);
});
test('every enabled social lesson and standard has valid answers, evidence, exact counts and reproducible selection',()=>{
 let lessons=0,sheets=0,standards=0;
 function check(o,b){const s=T.generate(o,C);sheets++;assert.equal(s.items.length,o.count);assert.deepEqual(T.generate(o,C),s);assert.equal(new Set(s.items.map(q=>q.evidenceId||JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size,o.count);
 for(const q of s.items){assert.ok(q.prompt&&q.answer&&q.explanation);assert.doesNotMatch(q.prompt,/undefined|\[object Object\]/);assert.doesNotMatch(q.prompt,/관련|가까운 것은|무엇을 보여 주나요/,q.evidenceId||q.prompt);if(o.responseFormat==='choice'){assert.ok(q.choices.includes(q.answer));assert.equal(new Set(q.choices).size,q.choices.length);}else assert.equal(q.choices.length,0);if(o.responseFormat==='initial')assert.ok(q.detail.endsWith('초성·빈칸 힌트: '+hint(q.answer)));if(q.scienceMaterial?.kind==='table')for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}
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

test('social question bank quality: no answer leakage or meaningless related-to prompts',()=>{
 const normalize=value=>String(value??'').replace(/[\s‘’“”"'·.,!?()\[\]]/g,'');
 const vague=/(?:관련된\s*(?:나라는|국가는|것은)|까닭과\s*관련된|모습과\s*관련된|무엇과\s*관련되)/;
 const failures=[];
 const check=(id,prompt,answer)=>{
  const p=normalize(prompt),a=normalize(answer);
  if(a.length>=2&&p.includes(a))failures.push(id+' 정답 노출: '+prompt+' → '+answer);
  if(vague.test(prompt))failures.push(id+' 모호한 질문: '+prompt);
 };
 for(const bank of E.banks.filter(b=>b.subject==='social'))for(const q of bank.items)check(q.evidenceId,q.prompt,q.answer);
 for(const era of eras)for(const q of C.historyItems(era))check('history-'+q.id,q.prompt,q.answer);
 assert.deepEqual(failures,[],failures.join('\n'));
});

test('five-pass social audit: local reading answers, distractors, explanations and historical targets',()=>{
 const root=path.resolve(__dirname,'..');
 const loadCases=name=>{
  const raw=fs.readFileSync(path.join(root,name),'utf8');
  const match=raw.match(/const cases=(\[[^\n]*\]);/);
  assert.ok(match,'case data missing: '+name);
  return JSON.parse(match[1]);
 };
 let checked=0;
 for(const name of ['worksheet-social-local-life-depth.js','worksheet-social-past-local-depth.js']){
  for(const group of loadCases(name))for(const [index,row] of group.rows.entries()){
   const [prompt,answer,wrong1,wrong2,explanation]=row;
   assert.equal(new Set([answer,wrong1,wrong2]).size,3,name+':'+group.key+':'+index);
   assert.ok(prompt&&answer&&explanation,name+':'+group.key+':'+index);
   assert.ok(!String(prompt).includes(answer),name+' answer in prompt: '+prompt);
   assert.doesNotMatch(explanation,/자료에서 .+와 관련된 내용을 확인할 수 있습니다/);
   assert.doesNotMatch(wrong1+'|'+wrong2,/비행기 수리|전기 발전소|미래의 날씨|전자책으로만|현대 플라스틱/);
   checked++;
  }
 }
 assert.equal(checked,160);
 const core=fs.readFileSync(path.join(root,'daily-worksheet-core.js'),'utf8');
 assert.match(core,/645년 당나라의 공격에 맞서 안시성을 지켜 낸 나라는/);
 assert.doesNotMatch(core,/고구려와 당의 전쟁에서 안시성 싸움과 관련된 나라는/);
 const joseon=fs.readFileSync(path.join(root,'worksheet-joseon-volume.js'),'utf8');
 assert.doesNotMatch(joseon,/경국대전으로 알아보기 알맞은 내용/);
 const history=fs.readFileSync(path.join(root,'worksheet-history-volume.js'),'utf8');
 assert.doesNotMatch(history,/돌을 다루는 솜씨와 탑의 구조를 통해 무엇을 살필 수 있나요/);
});


test('social question stems specify a concrete historical, civic or geographic target',()=>{
 const vague=/관련|가까운 것은|무엇을 보여 주나요/;
 const matches=[];
 for(const bank of E.banks.filter(bank=>bank.subject==='social'))for(const q of bank.items)if(vague.test(q.prompt))matches.push(bank.id+': '+q.prompt);
 for(const era of eras)for(const q of C.historyItems(era))if(vague.test(q.prompt))matches.push(era+': '+q.prompt);
 assert.deepEqual(matches,[],matches.join('\n'));
 const root=path.resolve(__dirname,'..');
 for(const name of ['worksheet-social-local-life-depth.js','worksheet-social-past-local-depth.js']){
  const raw=fs.readFileSync(path.join(root,name),'utf8');
  const match=raw.match(/const cases=(\[[^\n]*\]);/);
  assert.ok(match,name);
  const groups=JSON.parse(match[1]);
  for(const group of groups)for(const row of group.rows)assert.doesNotMatch(row[0],vague,name+':'+group.key);
 }
});

test('rewritten social prompts preserve their intended specific answers',()=>{
 const questions=E.banks.filter(b=>b.subject==='social').flatMap(b=>b.items);
 const cases=[
  [/귀주 대첩에서 고려군을 지휘한 장수/, '강감찬 — 거란군'],
  [/흥남 철수 당시 피란민들이 겪은 어려움/, '전쟁으로 살던 곳을 떠나 안전한 곳을 찾아야 했던 어려움'],
  [/냉대 지역 주민들이 집의 보온과 난방/, '길고 추운 겨울에 대비할 필요']
 ];
 for(const [pattern,answer] of cases){const matching=questions.filter(q=>pattern.test(q.prompt));assert.equal(matching.length,1,String(pattern));assert.equal(matching[0].answer,answer);}
});


test('social prompts do not pre-answer by defining the correct choice in the stem',()=>{
 const core=fs.readFileSync(path.resolve(__dirname,'../daily-worksheet-core.js'),'utf8');
 assert.match(core,/고려 시대에 《직지》를 제작할 때 사용한 인쇄 기술은 무엇인가요/);
 assert.doesNotMatch(core,/직지를 만들 때 금속으로 만든 글자들을 조합해 찍어 낸/);
 assert.match(core,/경제적·군사적 목적을 바르게 묶은 것은 무엇인가요/);
 const gaya=E.banks.filter(b=>b.subject==='social').flatMap(b=>b.items).find(q=>q.prompt.includes('낙동강 유역에서 성장한 가야 여러 나라의 대표적인 경제활동'));
 assert.ok(gaya,'a specific Gaya economy question is required');
 assert.equal(gaya.answer,'철을 생산하고 다른 지역과 교류한 일');
 assert.equal(new Set(gaya.choices).size,gaya.choices.length);
});


test('entire 3081-item social pool passes deep uniqueness and grounded historical anchors',()=>{
 const auditor=require('../scripts/worksheet-social-deep-audit.cjs');
 const audit=auditor.examine();
 assert.equal(audit.summary.banks,143);
 assert.equal(audit.summary.questions,3081);
 assert.equal(audit.summary.passedAnchors,auditor.HISTORY_FACTS.length,
  JSON.stringify(audit.historyChecks.filter(x=>!x.pass)));
 const out=path.resolve(__dirname,'../test-artifacts/worksheet-critique');
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'social-deep-audit.json'),JSON.stringify(audit,null,2));
 fs.writeFileSync(path.join(out,'social-deep-audit.md'),auditor.markdown(audit));
 assert.deepEqual(audit.fatal,[],JSON.stringify(audit.fatal.slice(0,25),null,2));
});
