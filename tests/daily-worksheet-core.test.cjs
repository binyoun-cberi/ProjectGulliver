'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {SUBJECTS,generate,types,units}=require('../daily-worksheet-core.js');

test('science and English contextual reading yields twenty distinct sourced-by-context exercises per grade band',()=>{
 for(const [subject,topic,grades] of [['science','plant-observation',[3,4]],['science','ecosystem',[5,6]],['english','short-reading',[3,4]],['english','message-reading',[5,6]]]){
  for(const grade of grades)for(const seed of [1,42,2026]){
   const options={subject,topic,grade,count:20,seed},sheet=generate(options);
   assert.deepEqual(sheet,generate(options));
   assert.equal(new Set(sheet.items.map(q=>q.detail)).size,20);
   for(const q of sheet.items){assert.ok(q.detail&&q.explanation);assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer))}
  }
  for(const grade of [3,4,5,6].filter(g=>!grades.includes(g)))assert.throws(()=>generate({subject,topic,grade,count:5}));
 }
});

test('social expansion keeps at least 29 themed prompts and offers history answers without initials',()=>{
 const lower=['map-symbol','natural','human','cultural','family','community-rules','local-gov','transport'];
 const upper=['korea-geography','democracy','rights','government','market','world-geography','international','environment','contemporary'];
 for(const [grade,topics] of [[3,lower],[5,upper]])for(const topic of topics){
  const prompts=new Set();
  for(let seed=1;seed<=100;seed++)for(const q of generate({subject:'social',grade,topic,count:15,seed}).items){
   prompts.add(q.prompt);assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));
  }
  assert.equal(prompts.size,29,`${topic}: 확장한 질문이 생성되지 않음`);
 }
 for(const grade of [5,6])for(const topic of ['prehistoric','ancient','goryeo','joseon','modern']){
  const named=types('social',grade,topic);
  assert.ok(named.some(([type])=>type===topic+'-short'));
  const prompts=new Set();
  for(let seed=1;seed<=100;seed++){
   const sheet=generate({subject:'social',grade,topic,type:topic+'-short',count:15,seed});
   for(const q of sheet.items){prompts.add(q.prompt);assert.deepEqual(q.choices,[]);assert.equal(q.detail,'');assert.ok(q.answer);assert.ok(q.source&&q.explanation)}
  }
  assert.ok(prompts.size>=25,`${topic}: 역사 질문의 실질적 풀이 범위가 좁음`);
 }
});

test('expanded social bank reaches beyond one 15-question sheet and Korean reading offers seven passages per band',()=>{
 const lower=['map-symbol','natural','human','cultural','family','community-rules','local-gov','transport'];
 const upper=['korea-geography','democracy','rights','government','market','world-geography','international','environment','contemporary'];
 for(const [grade,topics] of [[3,lower],[5,upper]])for(const topic of topics){
  const prompts=new Set();
  for(let seed=1;seed<=30;seed++)for(const q of generate({subject:'social',grade,topic,count:15,seed}).items){
   prompts.add(q.prompt);assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));
  }
  assert.ok(prompts.size>=21,`${topic}: 새 문제지에서 같은 질문이 너무 빨리 반복됨`);
 }
 for(const grade of [3,5]){
  const groups=new Set();
  for(let seed=1;seed<=50;seed++)for(const q of generate({subject:'korean',grade,topic:'reading-set',type:'reading-set-five',count:15,seed}).items)groups.add(q.readingGroup);
  assert.ok(groups.size>=7,`${grade}학년 독해 지문 수가 부족함`);
 }
});

test('unit selectors generate the requested arithmetic constraints and mixed order',()=>{
 assert.equal(units('math',3)[1].label,'1학기 · 덧셈과 뺄셈');
 assert.equal(types('math',5,'mixed').length,11);
 for(const topic of ['hundreds','addition'])for(const [type] of types('math',3,topic))for(const seed of [1,42,2026]){
  const sheet=generate({subject:'math',grade:3,topic,type,count:20,seed});
  assert.equal(sheet.items.length,20);
  for(const q of sheet.items){const [,left,operator,right]=q.prompt.match(/^(\d+) ([+−]) (\d+) =$/),a=Number(left),b=Number(right);assert.equal(Number(q.answer),operator==='+'?a+b:a-b);assert.ok(a>=100&&b>=(type.includes('-two-digit-')?10:100));if(type==='add-tens-none')assert.equal(a%100+b%100,0);
   let carry=0,n=0;for(const unit of [1,10,100]){const x=Math.floor(a/unit)%10,y=Math.floor(b/unit)%10,next=operator==='+'?x+y+carry>=10?1:0:x-carry<y?1:0;if(type.endsWith('-units')&&unit===1)assert.equal(next,1);if(type.endsWith('-tens')&&unit===1)assert.equal(next,0);if(type.endsWith('-tens')&&unit===10)assert.equal(next,1);n+=next;carry=next}assert.equal(n,type.endsWith('-two')?2:/-(one|carry|borrow|units|tens)$/.test(type)?1:0);
  }
 }
 for(const [type] of types('math',5,'mixed'))for(const seed of [1,42]){
  const sheet=generate({subject:'math',grade:5,topic:'mixed',type,count:15,seed});
  for(const q of sheet.items){const expression=q.prompt.slice(0,-2).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');assert.equal(Number(q.answer),Function(`return ${expression}`)())}
 }
 assert.throws(()=>generate({subject:'math',grade:5,topic:'mixed',count:5}));
 assert.throws(()=>generate({subject:'math',grade:3,topic:'hundreds',type:'sub-borrow-one',count:5}));
});

test('every listed unit type produces distinct, reproducible exercises with correct arithmetic',()=>{
 const rational=value=>{const [a,b]=value.split('/').map(Number);return b?a/b:a};
 for(const grade of [1,2,3,4,5,6])for(const unit of units('math',grade))for(const [type,,topic] of unit.types){
  if(topic==='math-mix')continue;
  const dense=/^(add-|sub-|small-|two-|times-)/.test(type)&&type!=='times-missing';
  for(const seed of [1,42,2026]){
   const options={subject:'math',grade,topic,type,count:dense?20:15,seed};
   const sheet=generate(options);assert.equal(sheet.items.length,options.count,`${grade}/${type}/${seed}`);
   assert.deepEqual(sheet,generate(options));assert.equal(new Set(sheet.items.map(q=>q.prompt)).size,options.count);
   for(const q of sheet.items){
    if(type==='times-missing'){const [,factor,product]=q.prompt.match(/^□ × (\d+) = (\d+)$/);assert.equal(Number(q.answer)*Number(factor),Number(product));continue}
    if(type.startsWith('mix-')){const expression=q.prompt.slice(0,-2).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');assert.equal(Number(q.answer),Function(`return ${expression}`)());continue}
    const [,a,operator,b]=q.prompt.match(/^([\d./]+) ([+−×÷]) ([\d./]+) =$/)||[];
    assert.ok(a&&b,`${type}: ${q.prompt}`);
    const left=rational(a),right=rational(b),expected=operator==='+'?left+right:operator==='−'?left-right:operator==='×'?left*right:left/right;
    if(operator==='÷'&&q.answer.includes(' … ')){const [quotient,remainder]=q.answer.split(' … ').map(Number);assert.equal(left,right*quotient+remainder);assert.ok(remainder<right)}
    else assert.ok(Math.abs(rational(q.answer)-expected)<1e-9,`${type}: ${q.prompt} → ${q.answer}`);
   }
  }
 }
});

test('five subjects expose only supported grades and topics, with complete unique sheets',()=>{
 assert.deepEqual(Object.keys(SUBJECTS),['korean','math','social','science','english']);
 for(const [subject,info] of Object.entries(SUBJECTS))for(const grade of info.grades)for(const [topic,,fromGrade,toGrade=6] of info.topics){
  if(grade<fromGrade||grade>toGrade)continue;
  if(['mixed','decimal','history-review','history-mix','math-mix','reading-set'].includes(topic))continue;
  const dense=subject==='math'&&['addition','hundreds','multiplication'].includes(topic);
  for(const difficulty of ['basic','challenge'])for(const count of [5,10,15,...(dense?[20]:[])])for(const seed of [1,42,2026]){
   const sheet=generate({subject,topic,grade,count,seed,difficulty});
   assert.equal(sheet.items.length,count,`${subject}/${grade}/${topic}`);
   assert.equal(new Set(sheet.items.map(q=>q.prompt+'|'+q.answer+'|'+q.detail)).size,count);
   for(const q of sheet.items){assert.ok(q.prompt&&q.answer);if(q.choices.length){assert.equal(new Set(q.choices).size,q.choices.length);assert.ok(q.choices.includes(q.answer))}}
  }
 }
});

test('social units generate sourced history quizzes and local evidence exercises',()=>{
 for(const grade of [3,4,5,6])for(const unit of units('social',grade))for(const [type,,topic] of unit.types){
  if(!['past','local','prehistoric','ancient','goryeo','joseon','modern','history-review'].includes(topic))continue;
  for(const seed of [1,42,2026]){
   const options={subject:'social',grade,topic,type,count:15,seed},sheet=generate(options);
   assert.deepEqual(sheet,generate(options));
   assert.equal(sheet.items.length,15);
   assert.equal(new Set(sheet.items.map(q=>topic==='history-review'?q.format==='ordering'?q.orderChoices.join('|'):q.prompt:grade>=5?q.prompt:q.detail)).size,15,`${grade}/${topic}/${seed}: 문제가 중복됨`);
   if(sheet.alignment)assert.match(sheet.alignment.code,/^\[[46]사\d{2}-\d{2}\]$/);
   else assert.ok(['joseon','modern','history-review'].includes(topic));
   for(const question of sheet.items){assert.ok(question.explanation&&question.sourceLabel);if(grade>=5){assert.match(question.source,/^https:\/\/contents\.history\.go\.kr\/mobile\/eh\/list\.do\?/);assert.ok(!question.prompt.includes('자료에서 알 수 있는 것을'));assert.ok(!/세트장|놀이공원|텔레비전/.test(question.prompt+' '+question.choices.join(' ')));if(topic==='history-review'){if(type==='history-matching')assert.ok(question.right&&question.answer.includes('번 · '));else assert.ok(question.orderChoices.length===4&&/^[1-4] → [1-4] → [1-4] → [1-4]$/.test(question.answer))}else if(type.endsWith('-initial'))assert.ok(question.detail.includes('힌트:'));else if(type.endsWith('-short'))assert.ok(!question.detail&&!question.choices.length);else assert.ok(question.choices.includes(question.answer))}else{assert.ok(question.detail&&question.choices.includes(question.answer));assert.equal(question.source,'')}}
  }
 }
 assert.throws(()=>generate({subject:'social',grade:4,topic:'goryeo',type:'goryeo-evidence',count:5}));
 assert.throws(()=>generate({subject:'social',grade:5,topic:'past',type:'past-evidence',count:5}));
});

test('regenerating history changes questions while retaining answer and source',()=>{
 for(const grade of [3,5])for(const unit of units('social',grade)){
  const [type,,topic]=unit.types[0],options={subject:'social',grade,topic,type,count:15};
  if(!['past','local','prehistoric','ancient','goryeo','joseon','modern','history-review'].includes(topic))continue;
  const first=generate({...options,seed:1}),second=generate({...options,seed:2026});
  assert.notDeepStrictEqual(first.items,second.items,topic);
  for(let seed=1;seed<=100;seed++){
   const sheet=generate({...options,seed});
   assert.equal(new Set(sheet.items.map(q=>topic==='history-review'?q.format==='ordering'?q.orderChoices.join('|'):q.prompt:grade>=5?q.prompt:q.detail)).size,15,`${topic}/${seed}`);
  for(const q of sheet.items){assert.ok(q.explanation);if(grade>=5){assert.match(q.source,/code=eh_age_(10|20|30|40|50)/);if(topic!=='history-review')assert.ok(q.choices.includes(q.answer))}}
  }
 }
});

test('history matching and ordering keep their printed answers consistent',()=>{
 const chronology=['고조선의 등장','신라 건국','고구려 건국','백제 건국','금관가야 건국','광개토 대왕 즉위','백제 사비 천도','백제 멸망','고구려 멸망','발해 건국','장보고 청해진 설치','고려 건국','귀주 대첩','고려 강화도 천도','직지 인쇄','조선 건국','훈민정음 반포','임진왜란','병자호란','수원 화성 완공','동학 농민 운동','독립신문 창간','대한제국 선포','국권 피탈','3·1 운동','대한민국 임시 정부 수립','광주 학생 항일 운동','광복','대한민국 정부 수립','6·25 전쟁 시작','정전 협정','4·19 혁명','5·18 민주화 운동','6월 민주 항쟁'];
 for(const count of [5,10,15])for(const seed of [1,42,2026]){
  const matching=generate({subject:'social',grade:5,topic:'history-review',type:'history-matching',count,seed}).items;
  const right=matching.map(q=>q.right);assert.equal(new Set(right).size,count);
  for(const q of matching){const [number]=q.answer.split('번');assert.equal(right[Number(number)-1],q.answer.split(' · ')[1]);assert.ok(q.prompt&&q.source)}
  const ordering=generate({subject:'social',grade:5,topic:'history-review',type:'history-order',count,seed}).items;
  for(const q of ordering){const indices=q.answer.split(' → ').map(Number);assert.deepEqual([...indices].sort(),[1,2,3,4]);const expected=indices.map(i=>q.orderChoices[i-1]);assert.deepEqual(expected,[...q.orderChoices].sort((a,b)=>chronology.indexOf(a)-chronology.indexOf(b)));assert.equal(q.explanation,expected.join(' → '))}
 }
});

test('a history quiz sheet does not repeat a correct answer',()=>{
 for(const topic of ['prehistoric','ancient','goryeo','joseon','modern'])for(const suffix of ['quiz','short','initial'])for(let seed=1;seed<=200;seed++){
  const items=generate({subject:'social',grade:5,topic,type:`${topic}-${suffix}`,count:15,seed}).items;
  assert.equal(new Set(items.map(item=>item.answer)).size,items.length,`${topic}-${suffix}/${seed}`);
 }
});

test('checked history eras alone contribute balanced, reproducible questions',()=>{
 for(const grade of [5,6]){
  assert.ok(units('social',grade).some(unit=>unit.topics.includes('history-mix')));
  for(const eras of [['ancient'],['goryeo','joseon'],['prehistoric','ancient','goryeo','joseon','modern']])for(const suffix of ['quiz','short','initial','ox'])for(const seed of [1,42,2026]){
   const options={subject:'social',grade,topic:'history-mix',type:`history-mix-${suffix}`,eras,count:15,seed},sheet=generate(options);
   assert.deepEqual(sheet,generate(options));assert.deepEqual(sheet.eras,eras);assert.equal(sheet.items.length,15);
   if(suffix!=='ox')assert.equal(new Set(sheet.items.map(q=>q.answer)).size,15);
   if(eras.length===1)assert.ok(sheet.items.every(q=>q.source.includes(`eh_age_${eras[0]==='prehistoric'||eras[0]==='ancient'?'10':eras[0]==='goryeo'?'20':eras[0]==='joseon'?'30':'40'}`)||eras[0]==='modern'&&q.source.includes('eh_age_50')));
   if(eras.length>1){const sources=sheet.items.map(q=>q.source.match(/eh_age_(\d+)/)[1]);for(const age of [...new Set(eras.map(era=>({prehistoric:'10',ancient:'10',goryeo:'20',joseon:'30',modern:'40'})[era]))])assert.ok(sources.includes(age))}
  }
 }
 for(const eras of [[],['ancient','ancient'],['future']])assert.throws(()=>generate({subject:'social',grade:5,topic:'history-mix',type:'history-mix-quiz',eras,count:10,seed:1}));
});

test('selected math exercise types are mixed evenly within the grade',()=>{
 for(const grade of [1,2,3,4,5,6]){
  const available=units('math',grade).filter(unit=>unit.id!==`g${grade}-mix`).flatMap(unit=>unit.types.map(([id])=>id));
  for(const mathTypes of [[available[0]],[...available.slice(0,Math.min(3,available.length))]])for(const seed of [1,42,2026]){
   const options={subject:'math',grade,topic:'math-mix',type:'math-mix-worksheet',mathTypes,count:15,seed},sheet=generate(options);
   assert.deepEqual(sheet,generate(options));assert.deepEqual(sheet.mathTypes,mathTypes);assert.equal(sheet.alignment,null);
   assert.equal(new Set(sheet.items.map(q=>q.prompt)).size,15);
   for(const skill of mathTypes)assert.ok(sheet.items.filter(q=>q.skill===skill).length>=Math.floor(15/mathTypes.length));
  }
  assert.throws(()=>generate({subject:'math',grade,topic:'math-mix',type:'math-mix-worksheet',mathTypes:['unknown'],seed:1}));
 }
 assert.throws(()=>generate({subject:'math',grade:1,topic:'math-mix',type:'math-mix-worksheet',mathTypes:[],seed:1}));
 assert.throws(()=>generate({subject:'math',grade:1,topic:'math-mix',type:'math-mix-worksheet',mathTypes:['small-add-10','small-add-10'],seed:1}));
 assert.throws(()=>generate({subject:'math',grade:1,topic:'math-mix',type:'math-mix-worksheet',mathTypes:['fraction-div-frac'],seed:1}));
});

test('Korean context words and five-question reading sets print with their own answers',()=>{
 for(const grade of [3,4,5,6]){
  const topics=grade>=5?['vocabulary','idiom','hanja']:['vocabulary','idiom'];
  for(const topic of topics){const [type]=types('korean',grade,topic)[0];for(const seed of [1,42,2026]){
   const sheet=generate({subject:'korean',grade,topic,type,count:15,seed});assert.equal(sheet.items.length,15);
   assert.equal(new Set(sheet.items.map(q=>q.detail+'|'+q.prompt)).size,15);
   for(const item of sheet.items){assert.ok(item.detail.includes('.'));assert.equal(item.choices.length,4);assert.ok(item.choices.includes(item.answer))}
  }}
  for(const count of [5,10,15,20]){const sheet=generate({subject:'korean',grade,topic:'reading-set',type:'reading-set-five',count,seed:42});assert.equal(sheet.items.length,count);
   const groups=[...new Set(sheet.items.map(q=>q.readingGroup))];assert.equal(groups.length,count/5);
   for(const group of groups){const questions=sheet.items.filter(q=>q.readingGroup===group);assert.equal(questions.length,5);assert.equal(questions.filter(q=>q.readingPassage).length,1);assert.ok(questions[0].readingPassage.length>150);for(const q of questions)assert.ok(q.choices.includes(q.answer))}
  }
 }
 assert.throws(()=>generate({subject:'korean',grade:2,topic:'hanja',type:'hanja-meaning',count:5}));
 assert.throws(()=>generate({subject:'korean',grade:5,topic:'reading-set',count:5}));
});

test('curated Korean literary and nonfiction texts have complete five-question evidence sets',()=>{
 for(const grade of [1,2]){
  const all=new Set();
  for(const [type,genre] of [['reading-set-literary','literary'],['reading-set-nonfiction','nonfiction']]){
   const titles=new Set();
   for(let seed=1;seed<=30;seed++){
    const sheet=generate({subject:'korean',grade,topic:'reading-set',type,count:15,seed});
    assert.equal(new Set(sheet.items.map(q=>q.readingGroup)).size,3);
    for(const q of sheet.items){assert.equal(q.readingGenre,genre);assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=10);titles.add(q.readingGroup);all.add(q.readingGroup);if(q.readingPassage)assert.ok(q.readingPassage.length>=120)}
   }
   assert.equal(titles.size,grade===1?4:6);
  }
  assert.equal(all.size,grade===1?8:12);
 }
 for(const grade of [3,4,5,6]){
  const all=new Set();
  for(const [type,genre] of [['reading-set-literary','literary'],['reading-set-nonfiction','nonfiction']]){
   const titles=new Set();
   for(let seed=1;seed<=60;seed++){
    const sheet=generate({subject:'korean',grade,topic:'reading-set',type,count:15,seed});
    assert.equal(sheet.items.length,15);assert.equal(new Set(sheet.items.map(q=>q.readingGroup)).size,3);
    for(const q of sheet.items){assert.equal(q.readingGenre,genre);assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.choices.includes(q.answer));assert.ok(q.explanation.length>=18);assert.doesNotMatch(q.explanation,/내용과 비교해 보세요/);titles.add(q.readingGroup);all.add(q.readingGroup);if(q.readingPassage)assert.ok(q.readingPassage.length>=140,q.readingGroup)}
   }
   assert.equal(titles.size,grade%2?5:7,`${grade}/${type}`);
  }
  assert.equal(all.size,grade%2?10:14);
  const mixed=generate({subject:'korean',grade,topic:'reading-set',type:'reading-set-five',count:15,seed:24});assert.ok(mixed.items.every(q=>q.readingGenre==='literary'||q.readingGenre==='nonfiction'));
  const brief=generate({subject:'korean',grade,topic:'reading-set',type:'reading-set-brief',count:15,seed:24});assert.ok(brief.items.every(q=>q.readingGenre==='brief'));
 }
});

test('twenty-question Korean reading follows grade bands and keeps four distinct passages',()=>{
 for(const grade of [1,2,3,4,5,6])for(const type of ['reading-set-literary','reading-set-nonfiction','reading-set-five']){
  const titles=new Set(),standards=new Set();
  for(let seed=1;seed<=40;seed++){
   const sheet=generate({subject:'korean',grade,topic:'reading-set',type,count:20,seed});
   assert.equal(sheet.items.length,20);
   assert.equal(new Set(sheet.items.map(item=>item.readingGroup)).size,4);
   for(const item of sheet.items)if(item.readingPassage){titles.add(item.readingTitle);assert.ok(item.readingStandard);standards.add(item.readingStandard)}
  }
  const count=grade<=2?(grade===1?4:6):(grade%2?5:7);
  if(type!=='reading-set-five')assert.equal(titles.size,count,`${grade}/${type}`);
  const band=grade<=2?'2국':grade<=4?'4국':'6국';assert.ok([...standards].every(code=>code.startsWith('['+band)));
 }
 assert.throws(()=>generate({subject:'korean',grade:4,topic:'reading-set',type:'reading-set-five',count:24}));
});

test('social geography, civic, economy and world themes offer distinct grade-banded sheets',()=>{
 const lower=['map-symbol','natural','human','cultural','family','community-rules','local-gov','transport'];
 const upper=['korea-geography','democracy','rights','government','market','world-geography','international','environment','contemporary'];
 for(const [grades,topics] of [[[3,4],lower],[[5,6],upper]])for(const grade of grades)for(const topic of topics){const [type]=types('social',grade,topic)[0];for(const seed of [1,42,2026]){
  const sheet=generate({subject:'social',grade,topic,type,count:15,seed});assert.equal(sheet.items.length,15,`${grade}/${topic}`);assert.equal(new Set(sheet.items.map(q=>q.prompt)).size,15);
  assert.equal(sheet.alignment,null);for(const q of sheet.items){assert.ok(q.prompt&&q.answer);assert.equal(q.choices.length,3);assert.ok(q.choices.includes(q.answer));assert.doesNotMatch(q.choices.join(' '),/세트장|지구의 자전 정지|계절의 소멸|바다가 사라짐/)}
 }}
 for(const topic of upper)assert.throws(()=>generate({subject:'social',grade:4,topic,type:`${topic}-quiz`,count:5}));
});

test('a worksheet number reproduces the same sheet and a new seed changes it',()=>{
 const options={subject:'science',grade:5,topic:'weather',count:10};
 assert.deepEqual(generate({...options,seed:31415}),generate({...options,seed:31415}));
 assert.notDeepEqual(generate({...options,seed:31415}).items,generate({...options,seed:27182}).items);
});

test('invalid grade, unavailable topic, and excessive item count are rejected',()=>{
 for(const options of [
  {subject:'social',grade:1,topic:'direction',count:5},
  {subject:'math',grade:1,topic:'fraction',count:5},
  {subject:'math',grade:4,topic:'number',count:5},
  {subject:'math',grade:2,topic:'hundreds',count:24},
  {subject:'korean',grade:3,topic:'reading',count:24},
  {subject:'math',grade:3,topic:'division',count:24},
  {subject:'english',grade:3,topic:'unknown',count:5},
  {subject:'science',grade:3,topic:'weather',count:100},
  {subject:'math',grade:3,topic:'division',count:5,difficulty:'unknown'},
  {subject:'other',grade:3,topic:'weather',count:5}
 ])assert.throws(()=>generate(options));
});

test('20 three-digit addition questions have no carrying and keep correct answers',()=>{
 for(const variant of ['tens','ones'])for(let seed=1;seed<=80;seed++){
  const sheet=generate({subject:'math',topic:'hundreds',grade:3,count:20,seed,variant});
  assert.equal(sheet.items.length,20);
  assert.equal(sheet.variant,variant);
  for(const q of sheet.items){
   const match=q.prompt.match(/^(\d+) \+ (\d+) =$/);assert.ok(match);
   const a=Number(match[1]),b=Number(match[2]);if(variant==='tens'){assert.equal(a%10,0);assert.equal(b%10,0)}
   assert.ok(a>=100&&b>=100&&a+b<1000);assert.ok(a%100+b%100<100);assert.ok(a%10+b%10<10);assert.equal(Number(q.answer),a+b);
  }
 }
});

test('the same variant and seed reproduce a sheet, and invalid variants fail',()=>{
 const options={subject:'math',grade:3,topic:'hundreds',count:20,seed:20261023};
 assert.deepEqual(generate({...options,variant:'ones'}),generate({...options,variant:'ones'}));
 assert.notDeepEqual(generate({...options,variant:'ones'}).items,generate({...options,variant:'tens'}).items);
 assert.throws(()=>generate({...options,variant:'unknown'}));
});

test('only reviewed math drills display a curriculum code, within the cited number range',()=>{
 for(const grade of [1,2,3,4])for(const topic of ['addition','multiplication','division','hundreds']){
  if(!SUBJECTS.math.topics.some(t=>t[0]===topic&&grade>=t[2]&&grade<=(t[3]??6)))continue;
  const sheet=generate({subject:'math',grade,topic,count:15,seed:2030});
  assert.match(sheet.alignment.code,/^\[[24]수01-\d{2}\]$/);
  for(const q of sheet.items){
   const numbers=q.prompt.match(/\d+/g).map(Number);
   if(topic==='addition'&&grade===2)assert.ok(numbers.every(n=>n<=99));
   if(topic==='addition'&&grade>=3)assert.ok(numbers.every(n=>n>=100&&n<=999));
   if(topic==='division'&&grade===3)assert.ok(numbers[1]<10&&numbers[0]<100);
   if(topic==='division'&&grade===4)assert.ok(numbers[1]>=10&&numbers[1]<=99&&numbers[0]<1000);
  }
 }
 assert.equal(generate({subject:'social',grade:3,topic:'direction',count:5,seed:2}).alignment,null);
});

test('reviewed language and science units carry scoped standards at the right grades',()=>{
 const cases=[
  ['korean',1,'mainidea','[2국02-03]'],['korean',2,'mainidea','[2국02-03]'],
  ['english',3,'words','[4영01-05]'],['english',4,'words','[4영01-05]'],
  ['english',5,'words','[6영01-03]'],['english',6,'words','[6영01-03]'],
  ['social',4,'economy','[4사07-02]'],
  ['science',3,'matter','[4과05-02]'],['science',4,'matter','[4과05-02]'],
  ['science',5,'weather','[6과06-01]'],['science',6,'weather','[6과06-01]']
 ];
 for(const [subject,grade,topic,code] of cases){
  const sheet=generate({subject,grade,topic,count:15,seed:104});
  assert.equal(sheet.alignment.code,code);
  assert.ok(sheet.alignment.source.startsWith('https://'));
  assert.equal(new Set(sheet.items.map(q=>q.detail||q.prompt+'|'+q.answer)).size,15);
 }
 assert.throws(()=>generate({subject:'science',grade:3,topic:'weather',count:5,seed:1}));
 assert.throws(()=>generate({subject:'korean',grade:3,topic:'mainidea',count:5,seed:1}));
 for(const seed of [1,42,2048]){
  const sheet=generate({subject:'korean',grade:1,topic:'mainidea',count:15,seed});
  assert.ok(sheet.items.every(q=>q.detail.includes('습니다.')&&q.choices.includes(q.answer)&&q.choices.length===3));
 }
});

test('arithmetic and fraction answers correspond to printed expressions',()=>{
 for(const grade of SUBJECTS.math.grades)for(const topic of SUBJECTS.math.topics.filter(t=>grade>=t[2]&&grade<=(t[3]??6)&&['addition','multiplication','division','fraction'].includes(t[0])).map(t=>t[0]))for(const difficulty of ['basic','challenge']){
  const sheet=generate({subject:'math',grade,topic,count:15,seed:1024,difficulty});
  for(const q of sheet.items){
   if(topic==='fraction'){
    if(grade===3)assert.ok(q.prompt.includes(q.answer));
    else {const [left,operator,right]=q.prompt.replace(' =','').split(' ');const value=s=>{const [a,b]=s.split('/').map(Number);return a/b};const expected=operator==='×'?value(left)*value(right):value(left)+value(right);assert.ok(Math.abs(value(q.answer)-expected)<1e-10)}
   }else if(topic==='division'){
    const match=q.prompt.match(/^(\d+) ÷ (\d+) =$/),answer=q.answer.match(/^(\d+)(?: … (\d+))?$/);assert.ok(match&&answer);
    assert.equal(Number(match[1]),Number(match[2])*Number(answer[1])+Number(answer[2]||0));assert.ok(Number(answer[2]||0)<Number(match[2]));
   }else{const match=q.prompt.match(/^(\d+) ([+×−]) (\d+) =$/);assert.ok(match);const a=Number(match[1]),b=Number(match[3]);assert.equal(Number(q.answer),match[2]==='+'?a+b:match[2]==='×'?a*b:a-b)}
  }
 }
});

test('reading sheets do not repeat a passage and expose longer texts from grade 3',()=>{
 for(const grade of [1,2,3,4,5,6])for(const seed of [1,42,2026]){
  const items=generate({subject:'korean',grade,topic:'reading',count:15,seed}).items;
  assert.equal(new Set(items.map(q=>q.detail)).size,15);
  if(grade<=2)assert.ok(items.every(q=>q.detail.split('.').length<=2));
 }
 let long=0;for(let seed=1;seed<=20;seed++)long+=generate({subject:'korean',grade:3,topic:'reading',count:15,seed}).items.filter(q=>q.detail.split('.').length>2).length;
 assert.ok(long>20,'long passages are not reaching the worksheet');
});

test('grade 1 to 3 place-value and time questions have consistent answers',()=>{
 for(const grade of [1,2,3])for(const difficulty of ['basic','challenge']){
  for(const q of generate({subject:'math',topic:'number',grade,count:15,seed:101,difficulty}).items){
   const [first,second]=q.prompt.match(/\d+/g).map(Number);
   if(q.prompt.includes('묶으면')){const [units,remainder]=q.answer.match(/\d+/g).map(Number);assert.equal(first,units*second+remainder)}
   else if(q.prompt.includes('더 큰'))assert.equal(Number(q.answer),Math.max(first,second));
   else assert.equal(Number(q.answer),Math.floor(first/second)%10);
  }
  for(const q of generate({subject:'math',topic:'time',grade,count:15,seed:101,difficulty}).items){
   if(grade===2){const [hours,minutes]=q.prompt.match(/\d+/g).map(Number);assert.equal(q.answer,`${hours*60+minutes}분`)}
   if(grade===3){const [hours,minutes,elapsed]=q.prompt.match(/\d+/g).map(Number);const [endHour,endMinute]=q.answer.match(/\d+/g).map(Number);assert.equal(endHour*60+endMinute,hours*60+minutes+elapsed)}
  }
 }
});
