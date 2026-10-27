'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../bumper-race-core.js'),harness=require('./bumper-race-harness.cjs');
const names=n=>Array.from({length:n},(_,i)=>'학생'+i),labels=k=>Array.from({length:k},(_,i)=>'선택지'+i);
function seeded(seed){let s=seed;return()=>((s=(1664525*s+1013904223)>>>0)/4294967296)}
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
test('actual 100-player races finish through the physics gate, with no missing or duplicate results',{timeout:120000},()=>{
 for(const [k,unique,balanced] of [[4,false,false],[30,false,false],[100,true,false],[200,true,false],[6,false,true]])for(let seed=1;seed<=3;seed++){
  const t=harness(seed*100+k);t.start({n:100,k,unique,balanced});assert.deepEqual(t.alerts,[]);
  assert.equal(t.run('virtualGate'),balanced||k>16);
  const result=t.run('({finish:finishLineY,slotWidth:slotZones[0].width})');assert.ok(result.finish>0);
  for(let f=0;f<2700&&!t.run('isFinished');f++)t.tick();
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
  for(let i=0;i<2700&&!t.run('isFinished');i++)t.tick();
  assert.equal(t.run('results.length'),config.n);
  assert.equal(t.run("results.find(r=>r.marble.name==='학생0').text"),config.k===8?'선택지7':'선택지5');
 }
 t.dispose();
});
