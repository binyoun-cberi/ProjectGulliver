/* Clasheet Pinball Race: shared, testable fair-play rules and Matter.js board. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ClasheetPinballCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const W = 900, H = 2350, FINISH_Y = 2200, RADIUS = 11;
  const P=typeof module==='object'&&module.exports?require('./pinball-race-progress.js'):window.ClasheetPinballView;
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
    engine.gravity.y = 0.09;
    const staticBodies=[], animated=[], impacts=[];
    const wall = {isStatic:true, friction:0.02, restitution:0.66,label:'rail',
      render:{fillStyle:'#43516e'}};
    function add(body) { staticBodies.push(body); return body; }
    function rail(x,y,w,h,angle=0) {
      return add(Bodies.rectangle(x,y,w,h,{...wall,angle}));
    }
    // A connected channel: gather, split around an island, merge, then race the final gate.
    // Every wall is rendered from the same body used by the physics engine.
    const left=[[65,-120],[65,380],[240,650],[90,880],[90,1150],[235,1370],[125,1580],[125,1880],[225,2050],[65,2190],[65,2350]];
    const right=[[835,-120],[835,440],[700,660],[810,880],[810,1150],[670,1370],[775,1580],[775,1880],[675,2050],[835,2190],[835,2350]];
    function channel(points){
      for(let i=1;i<points.length;i++){
        const [ax,ay]=points[i-1],[bx,by]=points[i];
        rail((ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay)+10,16,Math.atan2(by-ay,bx-ax)).friction=0;
      }
    }
    channel(left);channel(right);rail(450,-135,900,20);
    rail(300,450,520,18,.28).friction=0;
    rail(580,1530,420,18,-.3).friction=0;
    add(Bodies.fromVertices(450,970,[{x:450,y:780},{x:560,y:910},{x:560,y:1040},{x:450,y:1160},{x:340,y:1040},{x:340,y:910}],{...wall,label:'island',render:{fillStyle:'#172d43'}}));
    const pegOpts={isStatic:true,restitution:.8,friction:0,label:'peg',render:{fillStyle:'#829bb5'}};
    const bumperOpts={isStatic:true,restitution:1.2,friction:0,label:'bumper',render:{fillStyle:'#ffad66'}};
    for(const [x,y] of [[640,580],[290,720],[610,720],[200,980],[650,960],[665,1090],[360,1260],[580,1290],[260,1650],[620,1740]]){
      add(Bodies.circle(x,y,y<1200?25:21,bumperOpts));
    }
    for(const [x,y] of [[340,280],[470,300],[600,285],[380,615],[500,680],[180,1120],[700,1190],[400,1430],[300,1770],[440,1830],[600,1810],[390,2050],[510,2070]])add(Bodies.circle(x,y,10,pegOpts));
    for(const [x,y,width,speed] of [[460,330,180,.035],[235,1000,150,-.032],[450,1340,250,.025],[430,1720,190,-.032],[450,1850,450,.018],[450,1990,205,.028]]){
      const paddle=add(Bodies.rectangle(x,y,width,17,{isStatic:true,label:'spinner',render:{fillStyle:y>1900?'#baa4ff':'#67d9c6'}}));
      paddle.friction=0;animated.push({body:paddle,angle:random()*Math.PI,speed});
    }
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
    const progress=P.makeProgressMap(staticBodies,{width:W,height:FINISH_Y,radius:RADIUS});
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
          const kick=obstacle.position.y>1800?.7:3.2;
          Body.setVelocity(ballBody,{x:Math.max(-3.8,Math.min(3.8,vel.x+sign*(kick===.85?1.65:2.4))),y:Math.max(-4.2,vel.y-kick)});
        }
        if(impacts.length<160)impacts.push({x:ballBody.position.x,y:ballBody.position.y,
          type:obstacle.label,energy:Math.min(1.7,Math.max(.6,ballBody.speed/4))});
      }
    });
    let frame=0;
    function step() {
      frame++;
      for (const ball of balls) ball.previousY=ball.body.position.y;
      for (const part of animated) {
        Body.setAngle(part.body,part.angle+part.speed*frame);
      }
      Engine.update(engine,1000/60);
      // Universal stuck-ball recovery, independent of identity or rank.
      for (const ball of balls) {
        if (ball.finished) continue;
        const raw=progress.distanceAt(ball.body.position.x,ball.body.position.y);
        ball.routeDistance=Number.isFinite(ball.routeDistance)?ball.routeDistance+(raw-ball.routeDistance)*.18:raw;
        const speed=ball.body.speed;
        ball.stallFrames=speed<.45?ball.stallFrames+1:0;
        if (ball.stallFrames>150) {
          Body.applyForce(ball.body,ball.body.position,{x:(random()-.5)*.00009,y:.00025});
        }
      }
    }
    return {engine,balls,staticBodies,animated,impacts,progress,ranked:()=>P.rankBalls(balls,progress),step,frame:()=>frame,finishY:FINISH_Y,W,H};
  }
  return {W,H,RADIUS,FINISH_Y,BRIDGE_KEY,OWN_KEY,BUMPER_KEY,normalizeNames,shuffled,
    makeCapacities,createAllocator,parseBridge,rosterPayload,crossingOrder,createWorld};
});
