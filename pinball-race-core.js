/* Clasheet Pinball Race: shared, testable fair-play rules and Matter.js board. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ClasheetPinballCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const W = 900, H = 690, FINISH_Y = 574, RADIUS = 11;
  const BRIDGE_KEY = 'clasheet.race-roster.v1';
  const OWN_KEY = 'clasheet.pinballRace.v1';
  const BUMPER_KEY = 'gulliver.bumperRoulette.v2';

  function normalizeNames(raw) {
    const names = (Array.isArray(raw) ? raw : String(raw || '').split(/\r?\n/))
      .map(x => String(x || '').trim()).filter(Boolean);
    if (names.length < 2 || names.length > 30) throw Error('참가자는 2~30명으로 입력해 주세요.');
    if (names.some(n => n.length > 24)) throw Error('이름은 24글자 이내로 입력해 주세요.');
    if (new Set(names).size !== names.length) throw Error('같은 이름이 있어요. 구별할 수 있도록 번호를 붙여 주세요.');
    return names;
  }
  function shuffled(items, random = Math.random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(random() * (i + 1)));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function makeCapacities(n, k, random = Math.random) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || n < 2 || n > 30 || k < 2 || k > 4 || k > n) {
      throw Error('참가자는 2~30명, 팀은 2~4개로 설정해 주세요.');
    }
    const caps = Array(k).fill(Math.floor(n / k));
    shuffled(Array.from({length:k},(_,i)=>i),random).slice(0,n % k).forEach(i => caps[i]++);
    return caps;
  }
  function createAllocator(n, k, random = Math.random) {
    const capacities = makeCapacities(n,k,random);
    const counts = Array(k).fill(0);
    const assignments = [];
    function assign(x) {
      if (assignments.length >= n) throw Error('모든 팀 배정이 끝났습니다.');
      const fraction = Math.max(0,Math.min(0.999999,Number.isFinite(x)?x:0.5));
      const open = counts.map((count,i) => ({i,count,capacity:capacities[i],center:(i+0.5)/k}))
        .filter(g => g.count < g.capacity);
      if (!open.length) throw Error('남은 팀 배정 칸이 없습니다.');
      const goal = open.reduce((best,g) => !best || Math.abs(g.center-fraction) < Math.abs(best.center-fraction) ? g : best, null);
      counts[goal.i]++;
      assignments.push(goal.i);
      return goal.i;
    }
    return { capacities, counts, assignments, assign, get complete(){return assignments.length===n;} };
  }
  function parseBridge(raw) {
    try {
      const data = JSON.parse(raw || 'null');
      if (!data || typeof data.updatedAt !== 'number' || Date.now()-data.updatedAt > 86400000 || data.updatedAt > Date.now()+300000) return null;
      return normalizeNames(data.names);
    } catch (_) { return null; }
  }
  function rosterPayload(names) {
    return JSON.stringify({names:normalizeNames(names).join('\n'),updatedAt:Date.now()});
  }
  function crossingOrder(balls) {
    return balls.filter(b=>!b.finished&&b.body.position.y>=FINISH_Y)
      .sort((a,b)=>crossingFraction(a)-crossingFraction(b)||a.index-b.index);
  }
  function crossingFraction(ball) {
    const previous=ball.previousY ?? ball.body.positionPrev.y;
    return Math.max(0,Math.min(1,(FINISH_Y-previous)/(ball.body.position.y-previous||1)));
  }
  function createWorld(Matter, names, random = Math.random) {
    const roster = normalizeNames(names);
    const { Engine, Bodies, Body, Composite, Events } = Matter;
    const engine = Engine.create({enableSleeping:false});
    engine.gravity.y = 0.065;
    const staticBodies=[], animated=[], impacts=[];
    const wall = {isStatic:true, friction:0.02, restitution:0.66,label:'rail',
      render:{fillStyle:'#43516e'}};
    function add(body) { staticBodies.push(body); return body; }
    function rail(x,y,w,h,angle=0) {
      return add(Bodies.rectangle(x,y,w,h,{...wall,angle}));
    }
    // Open-top funnel and safety side rails. No participant-specific geometry.
    rail(67,345,30,690); rail(833,345,30,690);
    rail(168,151,215,18,0.42); rail(732,151,215,18,-0.42);
    // Short central route meets a rotating gate; side routes remain open.

    const pegOpts={isStatic:true,restitution:1.2,friction:0,label:'peg',render:{fillStyle:'#8ea3c5'}};
    const bumperOpts={isStatic:true,restitution:1.44,friction:0,label:'bumper',render:{fillStyle:'#fda846'}};
    const pegs = [[180,230],[330,208],[480,227],[630,208],[755,245],
      [138,332],[265,345],[420,338],[573,345],[730,337],
      [210,460],[350,446],[545,451],[705,470]];
    for (const [x,y] of pegs) add(Bodies.circle(x,y,10,pegOpts));
    [[265,280,30],[645,288,30],[185,405,24],[715,405,24]].forEach(([x,y,r]) => add(Bodies.circle(x,y,r,bumperOpts)));
    // Short alternative routes: risky spinning middle versus slower side rails.
    // Lower section remains open: narrow V-shaped ramps can trap slow-moving balls.
    const spindle=add(Bodies.rectangle(450,305,150,19,{isStatic:true,restitution:1.15,
      label:'spinner',render:{fillStyle:'#78e0d3'}}));
    animated.push({body:spindle,angle:0,speed:0.047 + random()*0.018});
    const gates=add(Bodies.rectangle(450,500,190,15,{isStatic:true,restitution:1.35,
      label:'spinner',render:{fillStyle:'#b4a1ff'}}));
    animated.push({body:gates,angle:random()*Math.PI,speed:-(0.035+random()*0.015)});
    // A single finish sensor line, followed by UI capacity gates for team mode.
    const order=shuffled(roster,random);
    const columns=order.length;
    const colors=order.map((_,i)=>'hsl('+Math.round(i*137.508%360)+' 92% 68%)');
    const balls=order.map((name,index)=>{
      // All marbles start at the same height; roster order is shuffled independently.
      const col=index;
      const x=85 + (col+0.5)*(730/columns);
      const y=78;
      const body=Bodies.circle(x,y,RADIUS,{label:'ball',restitution:0.72,friction:0.004,
        frictionAir:0.005,density:0.0012,render:{fillStyle:colors[index]}});
      Body.setVelocity(body,{x:(random()-.5)*1.1,y:.2});
      return {name,index,body,color:colors[index],finished:false,team:null,finishFx:null,stallFrames:0};
    });
    Composite.add(engine.world,[...staticBodies,...balls.map(b=>b.body)]);
    // Bumpers deliver the SAME physical kick to everyone. Rank and participant names are never consulted.
    Events.on(engine,'collisionStart',event=>{
      for (const pair of event.pairs) {
        const ballBody=pair.bodyA.label==='ball'?pair.bodyA:pair.bodyB.label==='ball'?pair.bodyB:null;
        if (!ballBody) continue;
        const obstacle=pair.bodyA===ballBody?pair.bodyB:pair.bodyA;
        if (obstacle.label!=='bumper'&&obstacle.label!=='spinner') continue;
        const dx=ballBody.position.x-obstacle.position.x;
        const sign=Math.abs(dx)<3?(random()<.5?-1:1):Math.sign(dx);
        if(obstacle.label==='bumper'){
          const vel=ballBody.velocity;
          Body.setVelocity(ballBody,{x:Math.max(-3.8,Math.min(3.8,vel.x+sign*1.65)),y:Math.max(-2.5,vel.y-.85)});
        }
        if(impacts.length<160)impacts.push({x:ballBody.position.x,y:ballBody.position.y,
          type:obstacle.label,energy:Math.min(1.7,Math.max(.6,ballBody.speed/4))});
      }
    });
    let frame=0;
    function step() {
      frame++;
      for (const ball of balls) ball.previousY=ball.body.position.y;
      for (const part of animated) Body.setAngle(part.body,part.angle+part.speed*frame);
      Engine.update(engine,1000/60);
      // Universal stuck-ball recovery, independent of identity or rank.
      for (const ball of balls) {
        if (ball.finished) continue;
        const speed=ball.body.speed;
        ball.stallFrames=speed<.45?ball.stallFrames+1:0;
        if (ball.stallFrames>150) {
          Body.applyForce(ball.body,ball.body.position,{x:(random()-.5)*.00009,y:.00025});
        }
      }
    }
    return {engine,balls,staticBodies,animated,impacts,step,frame:()=>frame,finishY:FINISH_Y,W,H};
  }
  return {W,H,RADIUS,FINISH_Y,BRIDGE_KEY,OWN_KEY,BUMPER_KEY,normalizeNames,shuffled,
    makeCapacities,createAllocator,parseBridge,rosterPayload,crossingOrder,createWorld};
});
