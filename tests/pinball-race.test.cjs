'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const core=require('../pinball-race-core.js');

function seeded(seed) {
  let s=seed>>>0;
  return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};
}
test('participant limits, duplicates and blank lines are validated',()=>{
  assert.deepEqual(core.normalizeNames('가\n \n나\n다'),['가','나','다']);
  for(const s of ['가','가\n가',Array.from({length:17},(_,i)=>i).join('\n')]) {
    assert.throws(()=>core.normalizeNames(s));
  }
});
test('all possible class and team sizes balance exactly; no slot overflows',()=>{
  for(let n=2;n<=16;n++)for(let k=2;k<=Math.min(4,n);k++)for(let seed=0;seed<60;seed++){
    const random=seeded(seed+1000*n+10*k);
    const allocator=core.createAllocator(n,k,random);
    for(let i=0;i<n;i++) {
      const x=random();
      const team=allocator.assign(x);
      assert.ok(team>=0&&team<k);
      assert.ok(allocator.counts[team]<=allocator.capacities[team]);
    }
    assert.equal(allocator.assignments.length,n);
    assert.equal(allocator.counts.reduce((a,b)=>a+b,0),n);
    assert.ok(Math.max(...allocator.counts)-Math.min(...allocator.counts)<=1);
    assert.deepEqual(allocator.counts,allocator.capacities);
    assert.throws(()=>allocator.assign(.4));
  }
});
test('roster transfer never carries preset winner or team assignments',()=>{
  const transfer=core.rosterPayload('한\n빛');
  assert.deepEqual(core.parseBridge(transfer),['한','빛']);
  assert.equal(JSON.parse(transfer).teamResults,undefined);
  assert.equal(core.parseBridge(JSON.stringify({names:'한\n빛',updatedAt:Date.now()-90000000})),null);
});
test('new tool is registered independently and old roulette retains its settings',()=>{
  const catalog=fs.readFileSync(path.join(__dirname,'../tools-catalog.js'),'utf8');
  const old=fs.readFileSync(path.join(__dirname,'../범퍼 룰렛.html'),'utf8');
  const pinball=fs.readFileSync(path.join(__dirname,'../핀볼 레이스.html'),'utf8');
  assert.match(catalog,/name:\s*"핀볼 레이스"/);
  assert.match(catalog,/href:\s*"핀볼 레이스.html"/);
  assert.match(old,/id="game-purpose"/);
  assert.match(old,/id="close-race"/);
  assert.match(old,/data-pinball-switch/);
  assert.match(pinball,/data-bumper-switch/);
  assert.match(pinball,/vendor\/matter.min.js/);
  assert.match(pinball,/pinball-race-core.js/);
  assert.match(pinball,/pinball-race.js/);
});
test('pinball JavaScript has valid syntax',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../pinball-race.js'),'utf8');
  assert.doesNotThrow(()=>new vm.Script(source));
});
test('Matter.js board supports multiple runs without changing old roulette',()=>{
  const M=require('../vendor/matter.min.js');
  for(let seed=1;seed<=12;seed++) {
    const names=Array.from({length:seed%2===0?16:8},(_,i)=>'학생'+i);
    const world=core.createWorld(M,names,seeded(seed));
    for(let frame=0;frame<420;frame++) world.step();
    assert.equal(world.balls.length,names.length);
    for(const ball of world.balls) {
      assert.ok(Number.isFinite(ball.body.position.x));
      assert.ok(Number.isFinite(ball.body.position.y));
    }
    M.World.clear(world.engine.world,false);
    M.Engine.clear(world.engine);
  }
});
