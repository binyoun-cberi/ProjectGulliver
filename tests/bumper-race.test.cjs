'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../bumper-race-core.js'),harness=require('./bumper-race-harness.cjs');
const names=n=>Array.from({length:n},(_,i)=>'학생'+i),labels=k=>Array.from({length:k},(_,i)=>'선택지'+i);
function seeded(seed){let s=seed;return()=>((s=(1664525*s+1013904223)>>>0)/4294967296)}
test('physical slot permutation preserves weighted duplicate labels and does not favor one fixed position',()=>{
 const weighted=['발표','통과','통과','질문','통과','발표'];
 const random=seeded(307);
 const counts=Array.from({length:weighted.length},()=>({발표:0,통과:0,질문:0}));
 for(let i=0;i<12000;i++){
  const shuffled=C.shuffleSlots(weighted,random);
  assert.equal(shuffled.length,weighted.length);
  shuffled.forEach((label,position)=>counts[position][label]++);
 }
 assert.deepEqual(weighted,['발표','통과','통과','질문','통과','발표'],'Original teacher input must not be changed');
 for(const row of counts){
  for(const [label,weight] of [['발표',2],['통과',3],['질문',1]]){
   const expected=12000*weight/weighted.length;
   assert.ok(Math.abs(row[label]-expected)<expected*.11,label+' position bias: '+row[label]+' vs '+expected);
  }
 }
});
test('physical result slots change location each round and preserve all duplicates',()=>{
 const options=['발표','통과','통과','질문','통과','기타'];
 const observed=new Set();
 for(let seed=1;seed<=9;seed++){
  const t=harness(seed*491);t.start({n:8,labels:options});
  assert.deepEqual(t.alerts,[]);
  assert.equal(t.run('virtualGate'),false);
  const arranged=Array.from(t.run('slotZones.map(s=>s.text)'));
  assert.deepEqual(arranged.slice().sort(),options.slice().sort());
  observed.add(arranged.join('|'));
  t.dispose();
 }
 assert.ok(observed.size>=5,'Physical label layout should vary across races');
});
test('out-of-bounds finish positions resolve to the actual edge slot, never an arbitrary first-slot fallback',()=>{
 const t=harness(54);t.start({n:4,k:4});
 assert.equal(t.run('getSlotByX(-100).id'),0);
 assert.equal(t.run('getSlotByX(1200).id'),3);
 assert.equal(t.run('getSlotByX(1400).id'),3);
 assert.equal(t.run('getSlotByX(NaN)'),null);
 t.run('Body.setPosition(marbles[0].body,{x:1300,y:finishLineY+10});checkWinCondition(marbles[0]);');
 assert.equal(t.run('results[0].text === slotZones[slotZones.length-1].text'),true);
 t.dispose();
});
test('final approach spreads ordinary marbles but respects teacher-directed and unique-slot modes',()=>{
 for(const config of [
  {n:4,k:4},
  {n:4,k:4,directed:{학생0:'선택지2'}},
  {n:4,k:4,unique:true}
 ]){
  const t=harness(818);t.start(config);
  assert.deepEqual(t.alerts,[]);
  t.run('Body.setPosition(marbles[0].body,{x:600,y:slotZones[0].y-LAST_STAGE_SCATTER_HEIGHT+20}); Engine.update(engine,1000/60)');
  assert.equal(t.run('Boolean(marbles[0].finalScatterUsed)'),!config.unique&&!config.directed);
  assert.equal(t.run('resultPool.assigned.size'),0,'Physical finishing outcomes are not preselected');
  t.dispose();
 }
});

test('100 marbles spawn clear of ceiling, floor, walls and each other',()=>{
 for(const n of [1,2,22,23,44,45,80,100]){
 const t=harness(n);t.start({n,k:4});assert.deepEqual(t.alerts,[]);
 assert.equal(t.run(`marbles.every(m=>m.body.bounds.min.y>launchCeiling&&m.body.bounds.max.y<80&&m.body.bounds.min.x>170&&m.body.bounds.max.x<1030)`),true);
 assert.equal(t.run(`marbles.every((a,i)=>marbles.slice(i+1).every(b=>Math.hypot(a.body.position.x-b.body.position.x,a.body.position.y-b.body.position.y)>MARBLE_RADIUS*2))`),true);t.dispose();
 }
});
test('selection limits and repeated names are rejected before starting',()=>{
 for(const options of [{n:101},{k:201},{names:['가','가']},{n:3,k:2,unique:true},{n:10,k:4,unique:true,balanced:true}]){const t=harness();t.start(options);assert.ok(t.alerts.length);assert.equal(t.run('marbles.length'),0);t.dispose();}
});
test('unique tickets include repeated labels and reserve teacher assignments',()=>{
 for(let seed=1;seed<=100;seed++){
 const pool=C.createPool(names(100),labels(200),{unique:true,directed:{학생0:'선택지199',학생99:'선택지0'}},seeded(seed));
 const assigned=names(100).reverse().map(name=>pool.assign(name));assert.equal(new Set(assigned).size,100);assert.equal(pool.assigned.get('학생0'),199);assert.equal(pool.assigned.get('학생99'),0);assert.throws(()=>pool.assign('학생0'));
 }
 const pool=C.createPool(['가','나','다'],['통과','통과','당첨'],{unique:true,directed:{가:'통과',나:'통과'}});assert.notEqual(pool.assign('가'),pool.assign('나'));assert.equal(pool.assign('다'),2);
});
test('balanced groups preserve quotas including fixed students for 1..100 people',()=>{
 for(let n=1;n<=100;n++)for(const k of [1,4,6,20,100,200]){
 const pool=C.createPool(names(n),labels(k),{balanced:true,directed:{학생0:'선택지0'}},seeded(n+k));
 // Some groups may have zero capacity when there are fewer students; teacher reservation must fit.
 const counts=Array(k).fill(0);names(n).reverse().forEach(name=>counts[pool.assign(name)]++);
 assert.equal(counts.reduce((a,b)=>a+b,0),n);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
 }
});
test('more teacher-directed students than capacity is rejected',()=>{
 assert.throws(()=>C.createPool(names(100),labels(6),{balanced:true,directed:Object.fromEntries(names(18).map(n=>[n,'선택지0']))}));
});
test('100 actual arrivals survive save, search and grouped result views',()=>{
 const t=harness();t.start({n:100,k:200,unique:true,directed:{학생0:'선택지199'}});
 t.run('for(const m of marbles)checkWinCondition(m)');
 const saved=JSON.parse(t.storage.get('gulliver.roulette.lastResults.v1'));assert.equal(saved.results.length,100);assert.equal(saved.completed,true);assert.equal(new Set(saved.results.map(r=>r.name)).size,100);assert.equal(new Set(saved.results.map(r=>r.result)).size,100);assert.equal(saved.results.find(r=>r.name==='학생0').result,'선택지199');
 t.el('result-search').value='학생99';t.run('filterResults()');assert.equal(t.el('result-list').children.filter(e=>!e.hidden).length,1);
 t.el('result-search').value='';t.el('result-grouped').checked=true;t.run('filterResults()');assert.equal(t.el('result-list').children.filter(e=>e.dataset.groupHeading).length,100);t.run('renderLoop()');t.dispose();
});
test('both winner and assignment use the restored full-length bumper course',()=>{
 const t=harness(123);
 t.start({n:8,k:4,purpose:'assign'});
 assert.deepEqual(t.alerts,[]);
 const assignLength=t.run('finishLineY');
 assert.ok(assignLength>10000,'Assignment race must span the original long course');
 assert.equal(t.run('courseOpened'),false);
 t.run('engine.timing.timestamp=25000;Engine.update(engine,1000/60)');
 assert.equal(t.run('courseOpened'),false,'25 seconds must not clear the course');
 t.run('resetGame()');
 t.start({n:8,k:4,purpose:'winner'});
 assert.deepEqual(t.alerts,[]);
 assert.equal(t.run('finishLineY'),assignLength);
 t.dispose();
});
test('actual 100-player races finish through the physics gate, with no missing or duplicate results',{timeout:120000},()=>{
 for(const [k,unique,balanced] of [[4,false,false],[30,false,false],[100,true,false],[200,true,false],[6,false,true]])for(let seed=1;seed<=1;seed++){
  const t=harness(seed*100+k);t.start({n:100,k,unique,balanced});assert.deepEqual(t.alerts,[]);
  assert.equal(t.run('virtualGate'),balanced||k>16);
  const result=t.run('({finish:finishLineY,slotWidth:slotZones[0].width})');assert.ok(result.finish>0);
  for(let f=0;f<8100&&!t.run('isFinished');f++)t.tick();
  assert.equal(t.run('results.length'),100,`k=${k} seed=${seed}`);
  assert.equal(t.run('new Set(results.map(r=>r.marble.name)).size'),100);
  assert.equal(JSON.parse(t.storage.get('gulliver.roulette.lastResults.v1')).results.length,100);
  if(unique)assert.equal(t.run('new Set(results.map(r=>r.text)).size'),100);
  if(balanced){const counts=labels(k).map(label=>t.run(`results.filter(r=>r.text===${JSON.stringify(label)}).length`));assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}
  console.log(`100 players, ${k} options, seed ${seed}: ${(t.clock/1000).toFixed(2)}s`);t.dispose();
 }
});

test('winner countdown stores only real arrivals and reset cancels an old launch',()=>{
 const t=harness();t.start({n:4,k:2,purpose:'winner',countdown:true,seconds:1});
 t.run('checkWinCondition(marbles[0])');t.tick(65);
 assert.equal(t.run('isFinished'),true);assert.equal(t.run('results.length'),1);
 assert.equal(JSON.parse(t.storage.get('gulliver.roulette.lastResults.v1')).completed,false);
 t.run('resetGame()');t.start({n:100,k:200,unique:true});
 t.tick(60);assert.equal(t.run('Composite.allBodies(engine.world).includes(startBoxBottom)'),true);
 t.tick(65);assert.equal(t.run('Composite.allBodies(engine.world).includes(startBoxBottom)'),false);
 assert.equal(t.run('results.length'),0);t.dispose();
});
test('physical unique slots, directed results and repeat starts keep the right quotas',()=>{
 const t=harness();
 for(const config of [{n:8,k:8,unique:true,directed:{학생0:'선택지7'}},{n:100,k:6,balanced:true,directed:{학생0:'선택지5',학생1:'선택지5'}}]){
  t.run('resetGame()');t.start(config);assert.deepEqual(t.alerts,[]);
  for(let i=0;i<8100&&!t.run('isFinished');i++)t.tick();
  assert.equal(t.run('results.length'),config.n);
  assert.equal(t.run("results.find(r=>r.marble.name==='학생0').text"),config.k===8?'선택지7':'선택지5');
 }
 t.dispose();
});


test('balanced teams always use complete assignment instead of a winner countdown',()=>{
 const t=harness();t.start({n:100,k:6,purpose:'winner',balanced:true,countdown:true});
 assert.deepEqual(t.alerts,[]);assert.equal(t.run('gamePurpose'),'assign');assert.equal(t.run('useCountdown'),false);t.dispose();
});
