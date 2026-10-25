'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../worksheet-evidence-banks.js'),T=require('../worksheet-learning.js'),C=require('../daily-worksheet-core.js');
test('original banks contain complete, independent evidence questions',()=>{
 assert.equal(E.banks.length,274);assert.equal(E.banks.reduce((n,b)=>n+b.items.filter(q=>!q.legacyHistoryId&&!q.legacyPhotoName&&!q.legacyMaterialId).length,0),5528);
 const ids=new Set();for(const b of E.banks)for(const q of b.items){
  assert.ok(!ids.has(b.id+q.evidenceId));ids.add(b.id+q.evidenceId);
  assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));
  assert.ok(q.knowledgeOnly&&q.source||q.detail?.length>15||q.scienceMaterial?.rows?.length||q.scienceMaterial?.body);assert.ok(q.explanation.length>10);
  if(q.scienceMaterial){const m=q.scienceMaterial;if(m.kind==='diagram'){assert.ok(m.body);assert.ok(m.viewBox);}else{assert.equal(m.kind,'table');for(const row of m.rows)assert.equal(row.length,m.headers.length);}}
 }
});
test('all authored banks are reachable from an actual lesson; specific past sources never borrow other evidence types',()=>{
 const reached=new Set(),cases=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||T.binding(u,l)?.kind!=='evidence')continue;reached.add(b.id);if(/일기와 편지|사진과 그림|오래된 물건|노래 가사와 신문/.test(l.name))cases.push([u,l,b]);}
 assert.deepEqual([...reached].sort(),E.banks.map(b=>b.id).sort());assert.ok(cases.length>=4);
 for(const [u,l,b] of cases){
  const s=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:b.items.length,responseFormat:'choice',seed:7},C);
  if(/일기와 편지/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-1']);
  if(/오래된 물건/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-3']);
  if(/사진과 그림/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId).sort(),['past-sources-2','past-sources-4']);
  if(/노래 가사와 신문/.test(l.name))assert.deepEqual(s.items.map(q=>q.evidenceId),['past-sources-5']);
 }
});
test('numeric answers and the limits of inference have evidence in the displayed records',()=>{
 const scale=E.banks.find(b=>b.id==='map-scale').items;
 assert.equal(scale[1].answer,'300 m');assert.match(scale[1].detail,/1 cm.*100 m.*3 cm/);
 assert.equal(scale[4].answer,'3 cm');assert.match(scale[4].detail,/200 m/);
 const buying=E.banks.find(b=>b.id==='reasonable-choice').items;
 const shipping=buying[1].scienceMaterial.rows;assert.ok(Number.parseInt(shipping[0][1])+Number.parseInt(shipping[0][2])<Number.parseInt(shipping[1][1])+Number.parseInt(shipping[1][2]));assert.equal(buying[1].answer,'가 가게');
 const water=E.banks.find(b=>b.id==='evaporation').items[4];const amounts=water.scienceMaterial.rows.map(r=>Number.parseInt(r[1])-Number.parseInt(r[2]));assert.deepEqual(amounts,[20,5]);assert.match(water.answer,/이 조건/);assert.match(water.explanation,/20 mL.*5 mL/);
});
test('essay conversion preserves source evidence and rationale without claiming an unshown picture',()=>{
 const before=JSON.stringify(E.banks);
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||T.binding(u,l)?.kind!=='evidence'||!T.formats(T.binding(u,l)).some(([f])=>f==='essay'))continue;
  const s=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:Math.min(5,T.binding(u,l).essayIds?.length??b.items.length),responseFormat:'essay',seed:42},C);
  for(const q of s.items){assert.match(q.prompt,/근거/);assert.equal(q.modelExplanation,q.explanation);assert.equal(q.choices.length,0);assert.ok(q.detail||q.scienceMaterial||q.readingGroup&&s.items.some(first=>first.readingGroup===q.readingGroup&&first.readingPassage));}
 }
 assert.equal(JSON.stringify(E.banks),before);
});
test('new social lessons use only evidence for their specific target and retain source limits',()=>{
 const added=['transport-types','transport-change','communication-types','communication-change','culture-respect','map-height','population-distribution','trade-reason'];
 const reached=new Map();
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;reached.set(l.id,b.id);
  const ids=b.items.map(q=>q.evidenceId);
  if(b.id==='transport-types')assert.deepEqual(ids,/옛날/.test(l.name)?['transport-types-1','transport-types-2']:['transport-types-3','transport-types-4','transport-types-5']);
  if(b.id==='transport-change')assert.deepEqual(ids,/불편/.test(l.name)?['transport-change-4','transport-change-5']:['transport-change-1','transport-change-2','transport-change-3']);
  if(b.id==='communication-types')assert.deepEqual(ids,/옛날/.test(l.name)?['communication-types-2','communication-types-3']:/오늘날/.test(l.name)?['communication-types-4','communication-types-5']:['communication-types-1']);
  if(b.id==='trade-reason'){const original=/무역이란/.test(l.name)?['trade-reason-1','trade-reason-5']:/이유/.test(l.name)?['trade-reason-2']:['trade-reason-3','trade-reason-4'];if(/무역이란/.test(l.name)){for(const id of original)assert.ok(ids.includes(id));assert.ok(ids.some(id=>id.startsWith('social-world-economy-trade-definition-')));}else assert.deepEqual(ids,original);}
 }
 assert.equal(reached.size,13); // Two original lessons now use exact independent world-economy banks.
 const population=E.banks.find(b=>b.id==='population-distribution').items;
 for(const q of population.slice(0,5))assert.match(q.scienceMaterial.note,/통계청.*2024년.*2025.*표 4/); // The original statistics remain intact; authored contextual cases follow.
 assert.equal(population[0].scienceMaterial.rows.reduce((n,r)=>n+parseFloat(r[1]),0),100);
 assert.equal(population[2].scienceMaterial.rows.reduce((n,r)=>n+parseFloat(r[1]),0),100);
 assert.match(population[3].explanation,/원인.*보여 주지는/);assert.match(population[4].explanation,/면적도 필요/);
});
test('second social expansion keeps benefits, responses, participation and environmental effects separate',()=>{
 const added=['social-life-change','aging-birth','customs','map-purpose','geographic-info','resident-participation','environment-use','urban-life'];
 const reached=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;reached.push(l.id);
  const ids=b.items.map(q=>q.evidenceId);
  if(b.id==='social-life-change')assert.deepEqual(ids,/대처/.test(l.name)?['social-life-change-3','social-life-change-4','social-life-change-5']:['social-life-change-1','social-life-change-2']);
  if(b.id==='environment-use')assert.deepEqual(ids,/변화/.test(l.name)?['environment-use-3']:/태도/.test(l.name)?['environment-use-4','environment-use-5']:['environment-use-1','environment-use-2']);
  if(b.id==='resident-participation'&&/태도/.test(l.name))assert.deepEqual(ids,['resident-participation-4']);
  if(b.id==='customs'&&/비교/.test(l.name))assert.deepEqual(ids,['customs-4']);
  if(b.id==='urban-life'&&/특색/.test(l.name))assert.deepEqual(ids,['urban-life-2','urban-life-3']);
 }
 assert.equal(reached.length,23);
 const age=E.banks.find(b=>b.id==='aging-birth').items;
 const rows=age[1].scienceMaterial.rows;assert.equal(rows[0][1],rows[1][1]);assert.ok(parseInt(rows[1][2])>parseInt(rows[0][2]));assert.match(age[1].answer,/비중이 커/);
 assert.match(age[4].explanation,/원인은 알 수 없/);
 const change=E.banks.find(b=>b.id==='environment-use').items[2];
 const [time,forest]=change.scienceMaterial.rows;assert.ok(parseInt(time[2])<parseInt(time[1]));assert.ok(parseInt(forest[2])<parseInt(forest[1]));assert.match(change.answer,/편리해졌지만 숲이 줄/);
});
test('sixth grade expansion separates economic, media and global problem evidence by objective',()=>{
 const added=['household-firm','economic-work','trade-cooperation','media-role','media-judgment','world-spatial-tools','global-problems','sustainable-future'];
 const targets=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;targets.push(l.id);assert.equal(u.grade,6);assert.equal(u.subject,'social');
  const ids=b.items.map(q=>q.evidenceId);
  if(b.id==='media-role')assert.deepEqual(ids,/미디어란/.test(l.name)?['media-role-1','media-role-2']:['media-role-3','media-role-4','media-role-5']);
  if(b.id==='media-judgment')assert.deepEqual(ids,/비판적/.test(l.name)?['media-judgment-1','media-judgment-2','media-judgment-3']:['media-judgment-4','media-judgment-5']);
  if(b.id==='world-spatial-tools'&&/디지털/.test(l.name))assert.deepEqual(ids,['world-spatial-tools-3','world-spatial-tools-4']);
  if(b.id==='world-spatial-tools'&&/활용/.test(l.name))assert.deepEqual(ids,['world-spatial-tools-5']);
  if(b.id==='global-problems'&&/겪고/.test(l.name)){for(const id of ['global-problems-1','global-problems-2'])assert.ok(ids.includes(id));assert.ok(ids.some(id=>id.startsWith('social-world-economy-global-challenges-')));}
  if(b.id==='economic-work'&&/기업은/.test(l.name))assert.deepEqual(ids,['economic-work-2','economic-work-5']);
 }
 assert.equal(targets.length,13); // Four original target lessons now use exact world-geography/economy banks.
 const q=E.banks.find(b=>b.id==='sustainable-future').items[2];const amounts=q.scienceMaterial.rows.map(r=>parseInt(r[1]));assert.equal(amounts[1]-amounts[0],5);assert.match(q.explanation,/5 L.*모든 가정/);
 const media=E.banks.find(b=>b.id==='media-judgment').items[2];assert.match(media.explanation,/서로 다른 관점/);
 const world=E.banks.find(b=>b.id==='world-spatial-tools').items[1];assert.match(world.explanation,/왜곡이 생길 수/);
});
test('geography expansion separates climate elements, landforms, regional causes and growth effects',()=>{
 const added=['korea-landforms','korea-season-climate','climate-disaster','regional-balance','world-terrain-life','world-climate-life','population-structure','economic-growth-effects'];
 const targets=[];for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;targets.push(l.id);
  const ids=b.items.map(q=>q.evidenceId);
  if(b.id==='korea-season-climate'&&/강수량의/.test(l.name))assert.deepEqual(ids,['korea-season-climate-4','korea-season-climate-5']);
  if(b.id==='korea-season-climate'&&/기온의/.test(l.name))assert.deepEqual(ids,['korea-season-climate-2','korea-season-climate-3']);
  if(b.id==='regional-balance'&&/원인/.test(l.name))assert.deepEqual(ids,['regional-balance-1']);
  if(b.id==='world-climate-life'&&/냉대와 한대/.test(l.name))assert.deepEqual(ids,['world-climate-life-4','world-climate-life-5']);
  if(b.id==='world-climate-life'&&/고산 기후/.test(l.name))assert.deepEqual(ids,['world-climate-life-6']);
  if(b.id==='korea-landforms'&&/해안/.test(l.name))assert.deepEqual(ids,['korea-landforms-4']);
  if(b.id==='economic-growth-effects'&&/문제를 합리적/.test(l.name))assert.deepEqual(ids,['economic-growth-effects-5']);
 }
 assert.equal(targets.length,16); // 12 original targets now resolve to more precise, lesson-specific geography/economy banks.
 const geo=T.catalog.filter(u=>u.subject==='social'&&u.grade===6&&u.semester===2).flatMap(u=>u.lessons.map(l=>T.binding(u,l))).filter(b=>b?.bankId?.startsWith('social-geo-'));assert.equal(geo.length,9);
 const climate=E.banks.find(b=>b.id==='korea-season-climate').items;assert.match(climate[3].scienceMaterial.note,/기상청.*1991~2020/);assert.match(climate[3].explanation,/54%/);assert.match(climate[4].explanation,/모든 지역의 모든 날/);
 const pop=E.banks.find(b=>b.id==='population-structure').items[2];assert.match(pop.explanation,/전체.*인구도/);
 const warming=E.banks.find(b=>b.id==='climate-disaster').items[1];assert.equal(parseInt(warming.scienceMaterial.rows[1][1])-parseInt(warming.scienceMaterial.rows[0][1]),1);assert.match(warming.explanation,/해마다.*제시되지/);
});
test('civics expansion separates rights cases, constitutional principles and public roles',()=>{
 const added=['law-constitution','rights-cases','rights-support','power-division','assembly-role','government-role','court-role','election-principles'];
 const targets=[];for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;targets.push(l.id);assert.equal(u.subject,'social');
  const ids=b.items.map(q=>q.evidenceId);
  if(b.id==='law-constitution')assert.deepEqual(ids,/헌법은/.test(l.name)?['law-constitution-3','law-constitution-4','law-constitution-5']:['law-constitution-1','law-constitution-2']);
  if(b.id==='rights-cases')assert.deepEqual(ids,/보장/.test(l.name)?['rights-cases-1','rights-cases-2']:['rights-cases-3','rights-cases-4','rights-cases-5']);
  if(b.id==='rights-support'&&/우리 사회/.test(l.name))assert.deepEqual(ids,['rights-support-2','rights-support-3']);
  if(b.id==='election-principles'&&/공정한/.test(l.name))assert.deepEqual(ids,['election-principles-3','election-principles-4']);
  if(b.id==='election-principles'&&/참여/.test(l.name))assert.deepEqual(ids,['election-principles-5']);
  if(b.id==='assembly-role')assert.equal(u.grade,6);if(b.id==='rights-cases')assert.equal(u.grade,5);
 }
 assert.equal(targets.length,15);
 const assembly=E.banks.find(b=>b.id==='assembly-role').items,government=E.banks.find(b=>b.id==='government-role').items,court=E.banks.find(b=>b.id==='court-role').items;
 assert.match(assembly[1].answer,/심의.*확정/);assert.match(assembly[1].detail,/정부는.*예산안을 국회에 제출/);
 assert.equal(government[1].answer,'정부');assert.match(government[1].detail,/편성한 뒤 국회에 제출/);
 assert.match(court[2].answer,/압력 없이 법에 따라/);assert.match(court[2].explanation,/마음대로 판단한다는 뜻이 아닙/);
});
test('early history evidence stays within each era and distinguishes traces from general claims',()=>{
 const added=['paleolithic','neolithic','bronze-age','gojoseon','goguryeo','baekje','silla-gaya','balhae'];
 const reached=[];for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;assert.equal(u.grade,5);assert.equal(u.semester,2);reached.push(b.id);
  const sheet=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:4,responseFormat:'choice',seed:42},C);
  assert.equal(sheet.items.length,4);assert.ok(sheet.items.every(q=>b.items.some(item=>item.evidenceId===q.evidenceId)));
  assert.equal(E.find({...u,grade:4},l),null);
 }
 assert.deepEqual(reached.sort(),added.sort());
 const bronze=E.banks.find(b=>b.id==='bronze-age').items;assert.match(bronze[1].answer,/함께 쓰/);assert.match(bronze[1].explanation,/즉시 모두 대체/);
 const go=E.banks.find(b=>b.id==='gojoseon').items;assert.match(go[2].explanation,/일부 기록.*알려지지 않은/);
 const wall=E.banks.find(b=>b.id==='goguryeo').items[0];assert.match(wall.detail,/무덤 안 벽과 천장/);assert.doesNotMatch(wall.detail,/실제 그림|제시하지/);
 const baekje=E.banks.find(b=>b.id==='baekje').items[0];assert.equal(baekje.answer,'한성 → 웅진 → 사비');
 const balhae=E.banks.find(b=>b.id==='balhae').items[3];const years=balhae.scienceMaterial.rows.map(r=>parseInt(r[1]));assert.ok(years[0]<years[1]);assert.match(balhae.answer,/고구려 멸망 → 발해 건국/);
});
test('Silla unification and Goryeo lessons keep periods, activities and event order distinct',()=>{
 const added=['silla-unification','goryeo-founding','goryeo-society','goryeo-defense','goryeo-culture'];
 const reached=[];for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!added.includes(b.id))continue;reached.push(b.id);assert.equal(u.grade,5);assert.equal(u.semester,2);
  const sheet=T.generate({subject:u.subject,grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:5,responseFormat:'choice',seed:42},C);assert.equal(sheet.items.length,5);assert.ok(sheet.items.every(q=>b.items.some(item=>item.evidenceId===q.evidenceId)));
 }
 assert.deepEqual(reached.sort(),added.sort());
 const unification=E.banks.find(b=>b.id==='silla-unification').items;const years=unification[0].scienceMaterial.rows.map(r=>parseInt(r[1]));assert.deepEqual(years,[660,668,676]);assert.match(unification[3].answer,/모든 영역까지.*것은 아니다/);
 const founding=E.banks.find(b=>b.id==='goryeo-founding').items[0];assert.deepEqual(founding.scienceMaterial.rows.map(r=>parseInt(r[1])),[918,936]);
 const defense=E.banks.find(b=>b.id==='goryeo-defense').items;assert.match(defense[0].answer,/협상/);assert.match(defense[1].answer,/강감찬.*거란/);assert.match(defense[3].answer,/주민들의 피해/);
 const culture=E.banks.find(b=>b.id==='goryeo-culture').items;assert.match(culture[0].answer,/다른 색 흙/);assert.match(culture[2].answer,/낱글자 활자를 조합/);
});
test('legacy history is reused without changing its bank, with photo rights and separate essay capacity',()=>{
 assert.equal(E.banks.reduce((n,b)=>n+b.items.length,0),5696);
 const original=C.historyItems('goryeo');const copy=C.historyItems('goryeo');copy[0].answer='changed';copy[0].choices[0]='changed';assert.deepEqual(C.historyItems('goryeo'),original);
 const used=E.banks.flatMap(b=>b.items.filter(q=>q.legacyHistoryId));assert.equal(used.length,139);assert.equal(new Set(used.map(q=>q.legacyHistoryId)).size,139);
 for(const b of E.banks){const known=b.items.filter(q=>q.legacyHistoryId);assert.equal(new Set(known.map(q=>q.answer.replace(/\s/g,''))).size,known.length);
  for(const q of known){const [topic,index]=q.legacyHistoryId.split('-');assert.equal(q.prompt,C.historyItems(topic)[Number(index)].prompt);assert.equal(q.answer,C.historyItems(topic)[Number(index)].answer);}
 }
 const photos=E.banks.flatMap(b=>b.items.filter(q=>q.photo));assert.equal(photos.length,18);for(const q of photos){assert.match(q.photo.license,/공공누리/);assert.ok(q.photo.credit);assert.ok(require('fs').existsSync(require('path').resolve(__dirname,'..',q.photo.src)));}
 const u=T.catalog.find(u=>u.lessons.some(l=>T.binding(u,l)?.bankId==='goryeo-culture')),l=u.lessons.find(l=>T.binding(u,l)?.bankId==='goryeo-culture'),b=T.binding(u,l);assert.equal(Math.max(...T.counts(b)),20);assert.equal(Math.max(...T.counts(b,'essay')),20);
 const options={subject:'social',grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,seed:42};
 assert.ok(T.generate({...options,count:20,responseFormat:'choice'},C).items.some(q=>q.photo));
 assert.equal(T.generate({...options,count:20,responseFormat:'essay'},C).items.length,20);
 assert.ok(T.generate({...options,count:5,responseFormat:'essay'},C).items.every(q=>!q.knowledgeOnly));
});
test('legacy material retains provenance while reviewed passages support the answers',()=>{
 const reused=E.banks.flatMap(b=>b.items.filter(q=>q.legacyMaterialId));assert.equal(reused.length,12);
 const before=C.historyEvidenceItems('modern');const copy=C.historyEvidenceItems('modern');copy[0].answer='changed';assert.deepEqual(C.historyEvidenceItems('modern'),before);
 for(const q of reused){const [topic,,index]=q.legacyMaterialId.split('-');const original=C.historyEvidenceItems(topic)[Number(index)];assert.ok(original);assert.equal(q.reviewedMaterial,true);assert.notEqual(q.detail,original.detail);assert.ok(q.explanation.length>15);assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));assert.ok(!q.knowledgeOnly);assert.ok(q.source);}
 const u=T.catalog.find(u=>u.lessons.some(l=>T.binding(u,l)?.bankId==='joseon-life')),l=u.lessons.find(l=>T.binding(u,l)?.bankId==='joseon-life');const b=T.binding(u,l);assert.equal(b.essayIds.length,42);assert.ok(T.formats(b).some(([f])=>f==='essay'));
 const s=T.generate({subject:'social',grade:5,semester:2,unitId:u.id,lessonId:l.id,count:2,responseFormat:'essay',seed:42,itemIndexes:[0,1]},C);assert.ok(s.items.every(q=>q.legacyMaterialId&&q.detail&&q.modelExplanation));
});
test('late Joseon and modernization lessons separate policy, chronology, reform intent and reach',()=>{
 const ids=['joseon-late-politics','joseon-opening','joseon-reforms','modern-daily-change'],reached=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!ids.includes(b.id))continue;reached.push(b.id);assert.equal(u.grade,5);assert.equal(u.semester,2);const binding=T.binding(u,l);assert.equal(binding.essayIds.length,b.id==='modern-daily-change'?5:45);
  for(const format of ['choice','short','essay']){const s=T.generate({subject:'social',grade:5,semester:2,unitId:u.id,lessonId:l.id,count:5,responseFormat:format,seed:24},C);assert.equal(s.items.length,5);if(format==='essay')assert.ok(s.items.every(q=>!q.knowledgeOnly&&q.source&&(q.detail||q.scienceMaterial||q.readingGroup)));}
 }
 assert.deepEqual(reached.sort(),ids.sort());
 const politics=E.banks.find(b=>b.id==='joseon-late-politics');assert.equal(politics.items.filter(q=>q.legacyHistoryId).length,2);assert.match(politics.items[2].detail,/두 필에서 한 필/);
 const opening=E.banks.find(b=>b.id==='joseon-opening');assert.deepEqual(opening.items[2].scienceMaterial.rows.map(r=>parseInt(r[0])),[1871,1876,1884]);assert.match(opening.items[3].explanation,/재판 권한/);
 const reform=E.banks.find(b=>b.id==='joseon-reforms');assert.match(reform.items[3].explanation,/생활.*다를/);assert.match(reform.items[4].explanation,/실제.*정착/);
 const modern=E.banks.find(b=>b.id==='modern-daily-change');assert.equal(modern.items[1].answer,'인천과 노량진 사이');assert.match(modern.items[4].explanation,/다른 지역/);
});
test('industrialization separates historical sequence, production share and lived experiences',()=>{
 const ids=['korea-industrialization','industrialization-life'],reached=[];
 for(const u of T.catalog)for(const l of u.lessons){const b=E.find(u,l);if(!b||!ids.includes(b.id))continue;reached.push(b.id);assert.equal(u.grade,6);assert.equal(u.semester,1);assert.equal(T.lookup('social',6,2,u.id,l.id),null);
  for(const responseFormat of ['choice','short','essay']){const s=T.generate({subject:'social',grade:6,semester:1,unitId:u.id,lessonId:l.id,count:6,responseFormat,seed:42},C);assert.equal(s.items.length,6);assert.equal(new Set(s.items.map(q=>q.evidenceId)).size,6);assert.ok(s.items.every(q=>q.source&&(q.detail||q.scienceMaterial||q.readingGroup)));}
 }
 assert.deepEqual(reached.sort(),ids.sort());
 const process=E.banks.find(b=>b.id==='korea-industrialization').items,life=E.banks.find(b=>b.id==='industrialization-life').items;
 assert.deepEqual(process[0].scienceMaterial.rows.map(r=>r[0]),['1960년대','1970년대']);
 const shares=process[3].scienceMaterial;assert.match(shares.title,/가상/);for(const c of [1,2])assert.equal(shares.rows.reduce((sum,r)=>sum+parseInt(r[c]),0),100);assert.match(process[3].explanation,/전체 생산액과 종사자 수가 없어/);assert.match(process[5].explanation,/완전히 교체/);
 for(const i of [1,2])assert.match(life[i].detail,/가상/);assert.match(life[3].scienceMaterial.title,/가상/);assert.match(life[4].detail,/긴 노동 시간/);assert.equal(life[5].scienceMaterial.rows.length,2);assert.match(life[5].explanation,/임금.*주택 부족/);
});
test('social passages stand alone and visual questions carry the actual drawing',()=>{
 const social=E.banks.filter(b=>b.subject==='social').flatMap(b=>b.items);
 for(const q of social){assert.doesNotMatch(q.detail||'',/메모:|사진 대신|실제 그림은 제시하지/);assert.doesNotMatch(q.scienceMaterial?.note||'',/학습을 위해 만든 예시 자료/);}
 const bus=social.find(q=>q.evidenceId==='past-sources-2');assert.match(bus.prompt,/그림/);assert.equal((bus.scienceMaterial.body.match(/class="waiting-person"/g)||[]).length,6);assert.match(bus.scienceMaterial.body,/버스/);assert.equal(bus.detail,undefined);
 for(const id of ['korea-landforms-1','korea-landforms-4']){const q=social.find(q=>q.evidenceId===id);assert.equal(q.scienceMaterial.kind,'diagram');assert.ok(!q.detail);}
 const tide=social.find(q=>q.evidenceId==='korea-landforms-4');assert.match(tide.scienceMaterial.body,/밀물 때/);assert.match(tide.scienceMaterial.body,/썰물 때/);assert.match(tide.answer,/밀물.*썰물/);
 const passage=social.find(q=>q.evidenceId==='goguryeo-2');assert.match(passage.detail,/활을 겨누는/);assert.equal(passage.answer,'말을 타고 활을 쏘며 사냥했다');
});
test('all remaining worksheet social targets are connected to specific three-question banks',()=>{
 const added=E.banks.filter(b=>b.completion);assert.equal(added.length,42);assert.equal(added.reduce((n,b)=>n+b.items.length,0),226);
 const seen=new Set();let targets=0;for(const u of T.catalog.filter(u=>u.subject==='social'))for(const l of u.lessons){const b=T.binding(u,l);assert.ok(b,l.name);const e=E.find(u,l);if(!e?.completion)continue;targets++;seen.add(e.id);assert.equal(e.items.length,e.worldPopulationExpanded?28:3);assert.equal(T.lookup('social',u.grade,u.semester===1?2:1,u.id,l.id),null);
  for(const responseFormat of ['choice','short','essay']){const sheet=T.generate({subject:'social',grade:u.grade,semester:u.semester,unitId:u.id,lessonId:l.id,count:3,responseFormat,seed:7},C);assert.equal(sheet.items.length,3);assert.ok(sheet.items.every(q=>e.items.some(r=>r.evidenceId===q.evidenceId)));}
 }
 assert.equal(targets,43);assert.equal(seen.size,42);
 const excluded=['우리가 살기 좋은 곳을 함께 표현해 볼까요','우리 지역의 역사를 체험해 볼까요','우리 지역의 역사를 소개해 볼까요','우리 지역을 소개해 볼까요','우리 국토 곳곳으로 여행을 떠나 볼까요','분단과 관련된 장소를 체험해 볼까요'];
 for(const name of excluded)assert.equal(T.isCoreLesson({name:'① '+name}),false,name);
 const maps=E.banks.find(b=>b.id==='social-fill-world-continents-oceans').items;assert.ok(maps.every(q=>q.scienceMaterial.kind==='diagram'&&q.scienceMaterial.body.includes('<path d="M')));assert.deepEqual(maps.map(q=>q.answer),['아시아','대서양','남아메리카']);
 const stat=E.banks.find(b=>b.id==='social-fill-populous-countries').items;assert.match(stat[0].scienceMaterial.title,/2024/);assert.match(stat[0].scienceMaterial.note,/INED/);assert.equal(stat[1].answer,'약 3000만 명');
 const density=E.banks.find(b=>b.id==='social-fill-world-population-density').items;assert.deepEqual(density[0].scienceMaterial.rows,[['싱가포르','8207명'],['몽골','2.3명']]);assert.match(density[0].scienceMaterial.note,/2024/);assert.equal(density[1].answer,'1 km²당 200명');
});
test('reviewed history asks about a specific person and uses comparable photo options',()=>{
 assert.equal(C.historyItems('goryeo')[21].prompt,'고려에서 수선사 결사를 이끈 승려는?');assert.equal(C.historyItems('modern')[21].prompt,'1920년 청산리 전투에서 북로군정서군을 이끈 인물은?');assert.match(C.historyItems('modern')[25].prompt,/서시/);assert.equal(C.historyItems('goryeo')[15].answer,'왕건');assert.match(C.historyItems('ancient')[13].prompt,/발해/);
 const photos=E.banks.flatMap(b=>b.items).filter(q=>q.legacyPhotoName);assert.equal(photos.length,17);
 for(const q of photos){assert.equal(new Set(q.choices).size,3);assert.ok(q.choices.includes(q.answer));if(q.answer!=='고인돌')assert.ok(!q.choices.includes('고인돌'),q.answer);}
 const p=Object.fromEntries(photos.map(q=>[q.answer,q]));assert.deepEqual(p['측우기'].choices,['측우기','앙부일구','자격루']);assert.deepEqual(p['종묘'].choices,['종묘','사직단','문묘']);assert.match(p['경복궁'].detail,/1395/);
 const materials=Object.fromEntries(E.banks.flatMap(b=>b.items.filter(q=>q.reviewedMaterial)).map(q=>[q.legacyMaterialId,q]));
 assert.match(materials['modern-evidence-0'].detail,/1919년 3월 1일/);assert.match(materials['modern-evidence-3'].detail,/1948년 5월 10일/);assert.match(materials['modern-evidence-5'].detail,/1950년 12월 흥남항/);assert.match(materials['modern-evidence-10'].detail,/강점기 후반/);
 assert.ok(!/사진과 구술 자료가 남아/.test(materials['modern-evidence-6'].detail));assert.match(materials['modern-evidence-6'].answer,/가족/);
});
