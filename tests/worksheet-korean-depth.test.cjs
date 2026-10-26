'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-korean-depth'),K=require('../worksheet-korean-readings'),T=require('../worksheet-learning'),E=require('../worksheet-evidence-banks'),C=require('../daily-worksheet-core');
const targets=T.catalog.filter(u=>u.subject==='korean').flatMap(u=>u.lessons.map(l=>({u,l,b:T.binding(u,l)}))).filter(t=>t.b);
const params=(t,extra={})=>({subject:'korean',grade:t.u.grade,semester:t.u.semester,unitId:t.u.id,lessonId:t.l.id,count:20,seed:42,responseFormat:'choice',...extra});
test('22 new original texts and forty basic tasks add 150 unique questions with explanatory evidence',()=>{
 const readings=D.readings(),items=D.items();assert.equal(readings.length,22);assert.equal(readings.filter(p=>p.genre==='poetry').length,8);assert.equal(readings.filter(p=>p.genre==='literary').length,8);assert.equal(readings.filter(p=>p.genre==='nonfiction').length,6);assert.equal(readings.reduce((n,p)=>n+p.questions.length,0)+items.length,150);
 assert.equal(new Set(K.authored().map(p=>p.id)).size,50);
 for(const p of readings){assert.ok(p.passage.length>=100,p.title);assert.equal(p.questions.length,5);assert.equal(p.skills.length,5);assert.equal(p.rationales.length,5);if(p.genre==='poetry')assert.ok(p.passage.includes('\n'));for(const [i,q]of p.questions.entries()){assert.equal(q.length,4);assert.equal(new Set(q.slice(1)).size,3);assert.ok(p.rationales[i].length>=20,p.title);}}
 for(const id of ['main-content','fact-opinion']){const b=E.banks.find(b=>b.id===id);assert.equal(b.items.length,25);assert.equal(b.items.filter(q=>q.koreanDepth).length,20);}
 assert.equal(new Set(items.map(q=>q.evidenceId)).size,40);for(const q of items){assert.ok(q.detail&&q.explanation);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));}
 const reached=new Set();for(const t of targets){const pool=t.b.pool||E.banks.find(b=>b.id===t.b.bankId)?.items.filter(q=>t.b.ids.includes(q.evidenceId))||[];for(const q of pool)if(q.evidenceId.startsWith('kr-upper-depth-')||q.koreanDepth)reached.add(q.evidenceId);}
 assert.equal(reached.size,150);
});
test('previously short Korean objectives now support twenty questions in all three answer formats',()=>{
 const selected=targets.filter(t=>['figure','structure','flow'].includes(t.b.koreanProfile)&&t.u.grade>=5||['main-content','fact-opinion'].includes(t.b.bankId));assert.ok(selected.length>=10);
 for(const t of selected)for(const responseFormat of ['choice','short','essay'])for(const seed of [7,42,101]){assert.ok(T.capacity(t.b,responseFormat)>=20,t.l.name);const o=params(t,{responseFormat,seed}),s=T.generate(o,C);assert.equal(s.items.length,20);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,20);assert.deepEqual(T.generate({...o,itemIndexes:s.items.map(q=>q.poolIndex)},C),s);if(responseFormat!=='choice')assert.ok(s.items.every(q=>q.choices.length===0));const seen=new Set();for(const q of s.items){if(!seen.has(q.readingGroup)){if(q.readingGroup)assert.ok(q.readingPassage);seen.add(q.readingGroup);}else assert.equal(q.readingPassage,undefined);}}
 for(const name of ['시에 나타난 비유적 표현 알기','이야기에 나타난 비유적 표현 알기']){const t=selected.find(t=>t.l.name.trim()===name),genre=name.startsWith('시에')?'poetry':'literary';assert.ok(t.b.pool.every(q=>q.koreanSkill==='figurative'&&q.readingGenre===genre));assert.equal(T.capacity(t.b,'choice'),genre==='poetry'?24:22);}
});
test('new texts retain their labels, line breaks and genre filters in lesson and standard selections',()=>{
 for(const p of D.readings()){const all=K.inventory(5).find(q=>q.id===p.id);assert.deepEqual(all,p);}
 const t=targets.find(t=>t.u.grade===5&&t.b.koreanProfile==='poetry'),pool=t.b.pool,indexes=pool.map((q,i)=>q.evidenceId.startsWith('kr-upper-depth-')?i:-1).filter(i=>i>=0).slice(0,20),s=T.generate(params(t,{itemIndexes:indexes}),C);assert.equal(new Set(s.items.map(q=>q.readingGroup)).size,4);assert.ok(s.items.filter(q=>q.readingPassage).every(q=>q.readingPassage.includes('\n')));
 const copy=D.readings();copy[0].questions[0][1]='changed';assert.notEqual(D.readings()[0].questions[0][1],'changed');
 assert.equal(K.find({subject:'korean',grade:1},{name:'시에 나타난 비유적 표현 알기'}),null);assert.equal(K.find({subject:'social',grade:5},{name:'시에 나타난 비유적 표현 알기'}),null);
});
