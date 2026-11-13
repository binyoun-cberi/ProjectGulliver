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
  for(const s of ['가','가\n가',Array.from({length:31},(_,i)=>i).join('\n')]) {
    assert.throws(()=>core.normalizeNames(s));
  }
});
test('all possible class and team sizes balance exactly; no slot overflows',()=>{
  for(let n=2;n<=30;n++)for(let k=2;k<=Math.min(4,n);k++)for(let seed=0;seed<60;seed++){
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
    const names=Array.from({length:seed%3===0?30:seed%2===0?16:8},(_,i)=>'학생'+i);
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

test('thirty simultaneous marbles have collision-free spawn positions and independent identifiers',()=>{
 const M=require('../vendor/matter.min.js');
 const world=core.createWorld(M,Array.from({length:30},(_,i)=>'참가자'+(i+1)),seeded(420));
 assert.equal(world.balls.length,30);
 for(let i=0;i<30;i++)for(let j=0;j<i;j++){
   const a=world.balls[i].body.position,b=world.balls[j].body.position;
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=core.RADIUS*2.05,'Start spawn overlap '+i+'/'+j);
 }
 assert.ok(Array.isArray(world.impacts));
 M.Engine.clear(world.engine);
});
test('the two game types have distinct settings for finishing rank versus balanced teams',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../핀볼 레이스.html'),'utf8');
 const script=fs.readFileSync(path.join(__dirname,'../pinball-race.js'),'utf8');
 assert.match(html,/id="finish-target" min="1" max="30"/);
 assert.match(html,/id="race-speed"/);
 assert.match(script,/state\.arrivals\.length>=state\.target/);
 assert.match(script,/if\(state\.mode==='winner'&&state\.arrivals\.length>=state\.target\)break/);
 assert.match(script,/mode==='teams'&&state\.arrivals\.length===current\.total/);
 assert.match(html,/id="live-rankings"/);
 assert.doesNotMatch(script,/cheatData|teacherResults/);
});

test('crossings use within-step time, not final depth or roster order',()=>{
 const ball=(index,previousY,y)=>({index,previousY,finished:false,body:{position:{y}}});
 // A crosses at .8, B at .2; A ends deeper but B arrived first.
 const a=ball(0,core.FINISH_Y-24,core.FINISH_Y+6),b=ball(1,core.FINISH_Y-2,core.FINISH_Y+8);
 assert.deepEqual(core.crossingOrder([a,b]).map(b=>b.index),[1,0]);
 b.finished=true;assert.deepEqual(core.crossingOrder([a,b]).map(b=>b.index),[0]);
});
test('30-player races finish naturally within seventy simulation seconds',()=>{
 const M=require('../vendor/matter.min.js');
 for(let seed=1;seed<=24;seed++){
   const world=core.createWorld(M,Array.from({length:30},(_,i)=>'학생'+i),seeded(seed));
   assert.equal(new Set(world.balls.map(b=>b.body.position.y)).size,1);
   let count=0,firstFrame=null;
   for(let frame=0;frame<4200&&count<30;frame++){
     world.step();
     for(const b of core.crossingOrder(world.balls)){
       if(firstFrame===null)firstFrame=frame;
       b.finished=true;count++;M.Composite.remove(world.engine.world,b.body);
     }
   }
   assert.equal(count,30,'natural finish, seed '+seed);
   assert.ok(firstFrame>=12*60,'Extended route must prevent an early straight fall to the finish');
   M.Engine.clear(world.engine);
 }
});

test('sparse races also finish by real crossings on the extended course',()=>{
 const M=require('../vendor/matter.min.js');
 for(const n of [2,4,8,16])for(let seed=1;seed<=6;seed++){
  const w=core.createWorld(M,Array.from({length:n},(_,i)=>'학생'+i),seeded(n*100+seed));let count=0;
  for(let f=0;f<4800&&count<n;f++){
   w.step();for(const ball of core.crossingOrder(w.balls)){ball.finished=true;count++;M.Composite.remove(w.engine.world,ball.body);}
  }
  assert.equal(count,n,`n=${n}, seed=${seed}`);M.Engine.clear(w.engine);
 }
});

test('30-player races have sustained leadership changes before the first finish',()=>{
 const M=require('../vendor/matter.min.js');let swaps=0;
 for(let seed=1;seed<=30;seed++){
  const w=core.createWorld(M,Array.from({length:30},(_,i)=>'학생'+i),seeded(seed));
  let leader=null,candidate=null,held=0,finished=false;
  for(let f=0;f<4200&&!finished;f++){
   w.step();
   if(f>210){
    const next=w.ranked()[0].index;
    if(candidate===next)held++;else{candidate=next;held=1;}
    if(held===30&&leader!==candidate){if(leader!==null)swaps++;leader=candidate;}
   }
   finished=core.crossingOrder(w.balls).length>0;
  }
  assert.equal(finished,true);M.Engine.clear(w.engine);
 }
 // Route-distance ranking removes false changes caused by simply moving downward on a detour.
 assert.ok(swaps>=60,'The course must permit sustained lead changes with route-distance ranking');
});
