'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks'),T=require('../worksheet-learning'),C=require('../daily-worksheet-core');
const added=E.banks.flatMap(b=>b.items).filter(q=>q.modernVolume);
const targets=T.catalog.filter(u=>u.subject==='social'&&u.grade===5&&u.semester===2).flatMap(unit=>unit.lessons.map(lesson=>({unit,lesson,binding:T.binding(unit,lesson)}))).filter(r=>r.binding.ids.some(id=>id.startsWith('modern-volume-')));
test('nine weak grade-5 history lessons gain 225 original questions and eighteen rectangular teaching tables',()=>{
 assert.equal(added.length,225);assert.equal(targets.length,9);assert.equal(new Set(added.map(q=>q.evidenceId)).size,225);assert.equal(new Set(added.map(q=>q.prompt)).size,225);
 const focuses=[...new Set(added.map(q=>q.lessonFocus))];assert.equal(focuses.length,9);for(const focus of focuses){assert.equal(added.filter(q=>q.lessonFocus===focus).length,25);assert.ok(added.filter(q=>q.lessonFocus===focus&&C.initialAnswerAllowed(q.answer)).length>=20);}
 const tables=added.filter(q=>q.scienceMaterial);assert.equal(tables.length,18);
 for(const q of added){assert.ok(q.detail.length>=30,q.evidenceId);assert.ok(q.explanation.length>=20,q.evidenceId);assert.equal(new Set(q.choices).size,3,q.evidenceId);assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.includes(q.answer),q.evidenceId);assert.match(q.source,/^https:\/\/(contents.history.go.kr|theme.archives.go.kr)\//);if(q.scienceMaterial)for(const row of q.scienceMaterial.rows)assert.equal(row.length,q.scienceMaterial.headers.length);}
});
test('every grade-5 term-2 lesson now generates twenty exact unique questions in every advertised format',()=>{
 let lessons=0,sheets=0;
 for(const unit of T.catalog.filter(u=>u.subject==='social'&&u.grade===5&&u.semester===2))for(const lesson of unit.lessons){lessons++;const b=T.binding(unit,lesson);for(const [responseFormat] of T.formats(b)){assert.ok(T.capacity(b,responseFormat)>=20,lesson.name+' '+responseFormat);for(const seed of [7,42,101]){const params={subject:'social',grade:5,semester:2,unitId:unit.id,lessonId:lesson.id,count:20,responseFormat,seed},s=T.generate(params,C);sheets++;assert.equal(s.items.length,20);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,20);assert.deepEqual(T.generate(params,C),s);for(const q of s.items){if(responseFormat==='choice')assert.ok(q.choices.includes(q.answer));else assert.equal(q.choices.length,0);if(responseFormat==='initial')assert.ok(q.detail.includes(C.initialHint(q.answer)));if(responseFormat==='cloze')assert.ok(q.detail.includes('〔'));if(responseFormat==='essay')assert.ok(q.modelExplanation);}}}}
 assert.equal(lessons,30);console.log({lessons,sheets});
});
test('war-life and war-impact lesson selections have disjoint banks and mixed/replayed sheets preserve exact quotas',()=>{
 const war=targets.filter(r=>r.binding.bankId==='korean-war');assert.equal(war.length,2);assert.ok(war[0].binding.ids.every(id=>!war[1].binding.ids.includes(id)));
 for(const r of war){const expected=/피해와 영향/.test(r.lesson.name)?'war-impact':'war-life';assert.ok(E.banks.find(b=>b.id==='korean-war').items.filter(q=>r.binding.ids.includes(q.evidenceId)).every(q=>q.lessonFocus===expected));}
 const lessonMix=targets.map(r=>({id:r.lesson.id,count:3}));
 for(const responseFormat of ['choice','short','essay','initial','ox','cloze','correction']){const params={subject:'social',grade:5,semester:2,lessonMix,responseFormat,seed:77},s=T.generateMixed(params,C);assert.equal(s.items.length,27);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,27);assert.deepEqual(T.generateMixed({...params,mixedItemIndexes:s.mixedItemIndexes},C),s);for(const row of lessonMix)assert.equal(s.items.filter(q=>q.curriculumLesson===row.id).length,3);}
 const standards=T.standards('social',5);for(const code of ['6사05-02','6사06-01','6사06-02'])assert.ok(standards.find(s=>s.code===code).binding.ids.some(id=>id.startsWith('modern-volume-')));
});
