/* CLASHEET · Pinball Race (standalone classroom game). */
(() => {
  'use strict';
  const C=window.ClasheetPinballCore, M=window.Matter;
  const $=id=>document.getElementById(id);
  const canvas=$('pinball-canvas'), ctx=canvas.getContext('2d');
  const roster=$('roster-input'), modeOptions=$('race-options');
  const teamNames=['파랑 팀','노랑 팀','초록 팀','보라 팀'];
  let current=null, startedAt=0, elapsedMs=0, lastFrame=0, accumulator=0, finishAfter=0;
  let toastDeadline=0, audio=null, muted=false, lastRankPaint=0, lastImpactSound=0;
  const fx=[];
  const state={mode:'winner',k:2,balanced:true,labels:[],world:null,allocator:null,counts:[],capacities:[],
    arrivals:[],finished:false,timeoutAnnounced:false,target:1,speed:1.55};

  function say(message,bad=false) {
    $('form-message').textContent=message||'';
    $('form-message').style.color=bad?'#b83737':'#178365';
  }
  function showToast(message) {
    $('race-toast').textContent=message;
    $('race-toast').classList.add('show');
    toastDeadline=performance.now()+1700;
  }
  function playNote(freq=520,duration=.10) {
    if(muted)return;
    try {
      audio=audio||new (window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended') audio.resume().catch(()=>{});
      const o=audio.createOscillator(),g=audio.createGain();
      o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);
      g.gain.setValueAtTime(.045,audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
    } catch (_) {}
  }
  function readJson(key) {
    try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}
  }
  function preferredNames() {
    const bridge=C.parseBridge(localStorage.getItem(C.BRIDGE_KEY));
    if(bridge){
      try{localStorage.removeItem(C.BRIDGE_KEY);}catch(_){}
      return bridge.join('\n');
    }
    const own=readJson(C.OWN_KEY);
    if(own&&typeof own.names==='string')return own.names;
    const old=readJson(C.BUMPER_KEY);
    return typeof old?.names==='string'?old.names:'';
  }
  function syncMode() {
    const selected=document.querySelector('input[name="mode"]:checked');
    $('team-options').hidden=selected?.value!=='teams';
    $('winner-options').hidden=selected?.value==='teams';
    $('start-btn').textContent=selected?.value==='teams'?'▶ 팀 나누기 시작':'▶ 순위 뽑기 시작';
    updateDescription();
  }
  function updateDescription() {
    const isTeams=document.querySelector('input[name="mode"]:checked')?.value==='teams';
    if(!current)$('play-description').textContent=isTeams?'골인할 때마다 팀에 입장해요':'설정한 등수까지 골인하면 바로 종료!';
  }
  function collectConfig() {
    const names=C.normalizeNames(roster.value);
    const mode=document.querySelector('input[name="mode"]:checked')?.value||'winner';
    const k=Number($('team-count').value), balanced=$('balanced').checked;
    const target=Number($('finish-target').value);
    if(mode==='winner'&&(!Number.isInteger(target)||target<1||target>names.length))throw Error('종료 등수는 1부터 참가자 수('+names.length+'명)까지 정해 주세요.');
    const speed=Number($('race-speed').value);
    if(![1,1.55,1.9].includes(speed))throw Error('경기 속도를 다시 선택해 주세요.');
    if(mode==='teams'&&k>names.length)throw Error('팀 수보다 참가자가 적어요. 팀을 줄이거나 친구를 더 넣어 주세요.');
    const raw=$('team-labels').value.split(/[,，\n]/).map(s=>s.trim());
    const labels=Array.from({length:k},(_,i)=>raw[i]||teamNames[i]);
    if(new Set(labels).size!==labels.length)throw Error('서로 다른 팀 이름을 입력해 주세요.');
    return {names,mode,k,balanced,labels,target,speed};
  }
  function saveConfig() {
    try {
      localStorage.setItem(C.OWN_KEY,JSON.stringify({names:roster.value,
        mode:document.querySelector('input[name="mode"]:checked')?.value,
        k:Number($('team-count').value),balanced:$('balanced').checked,labels:$('team-labels').value,
        target:Number($('finish-target').value),speed:Number($('race-speed').value)}));
    }catch(_){}
  }
  function stopRun(showSetup=true) {
    if(current?.world) M.Engine.clear(current.world.engine);
    current=null;state.world=null;state.finished=false;finishAfter=0;accumulator=0;fx.length=0;
    $('live-rankings').hidden=true;
    $('live-rank-list').replaceChildren();
    $('result-overlay').hidden=true;
    $('stop-btn').hidden=true;
    $('start-btn').hidden=false;
    modeOptions.disabled=false;
    if(showSetup)$('pre-start').hidden=false;
    $('team-status').hidden=true;
    $('race-count').textContent='0 / 0 도착';
    $('race-clock').textContent='00:00';
    $('play-title').textContent='핀볼 아레나';
    updateDescription();
  }
  function showTeamStatus() {
    const box=$('team-status');
    box.replaceChildren();
    if(state.mode!=='teams'){box.hidden=true;return;}
    box.hidden=false;
    for(let i=0;i<state.k;i++){
      const card=document.createElement('div');
      card.className='gate-pill';
      const title=document.createElement('strong'),count=document.createElement('span');
      title.textContent=state.labels[i];
      count.textContent=String(state.counts[i])+' / '+(state.balanced?state.capacities[i]:'자유')+'명';
      card.append(title,count);box.append(card);
    }
  }
  function start() {
    let config;
    try {config=collectConfig();}catch(e){say(e.message,true);return;}
    saveConfig();stopRun(false);
    state.mode=config.mode;state.k=config.k;state.balanced=config.balanced;state.labels=config.labels;
    state.target=config.target;state.speed=config.speed;
    state.arrivals=[];state.finished=false;state.timeoutAnnounced=false;
    state.allocator=config.mode==='teams'&&config.balanced?C.createAllocator(config.names.length,config.k):null;
    state.counts=state.allocator?state.allocator.counts:Array(config.k).fill(0);
    state.capacities=state.allocator?state.allocator.capacities:Array(config.k).fill(Infinity);
    state.world=C.createWorld(M,config.names);
    current={world:state.world,total:config.names.length,launchedAt:performance.now(),roundDone:false};
    elapsedMs=0;startedAt=performance.now();lastFrame=startedAt;accumulator=0;finishAfter=0;
    $('result-overlay').hidden=true;$('pre-start').hidden=true;
    $('start-btn').hidden=true;$('stop-btn').hidden=false;modeOptions.disabled=true;
    $('race-count').textContent='0 / '+current.total+' 도착';
    $('play-title').textContent=state.mode==='teams'?'팀 나누기 레이스':'상위 '+state.target+'명 뽑기';
    $('play-description').textContent='⚡ 범퍼에 맞으면 튕겨 나가요!';
    $('live-rankings').hidden=false;
    updateLiveRankings();
    say('');showTeamStatus();showToast('핀볼 레이스 시작!');playNote(660,.2);
  }
  function chooseTeam(x) {
    if(state.balanced)return state.allocator.assign(x/C.W);
    const raw=Math.max(0,Math.min(state.k-1,Math.floor(x/C.W*state.k)));
    state.counts[raw]++;return raw;
  }
  function park(ball,team) {
    const isTeams=state.mode==='teams';
    const count=isTeams?state.counts[team]:state.arrivals.length+1;
    const center=isTeams?(team+.5)*C.W/state.k:C.W/2;
    const maxPerRow=isTeams?Math.max(2,Math.floor((C.W/state.k-24)/31)):5;
    const col=(count-1)%maxPerRow, row=Math.floor((count-1)/maxPerRow);
    const within=Math.min(maxPerRow,isTeams?state.capacities[team]||maxPerRow:maxPerRow);
    const cols=Math.min(within,maxPerRow);
    const tx=center+(col-(cols-1)/2)*30,ty=636+row*23;
    ball.finishFx={sx:ball.body.position.x,sy:ball.body.position.y,tx,ty,started:performance.now()};
    M.Composite.remove(state.world.engine.world,ball.body);
  }
  function arrival(ball) {
    if(ball.finished)return;
    const team=state.mode==='teams'?chooseTeam(ball.body.position.x):null;
    ball.finished=true;ball.team=team;
    state.arrivals.push({name:ball.name,color:ball.color,team,position:state.arrivals.length+1});
    park(ball,team);
    $('race-count').textContent=state.arrivals.length+' / '+current.total+' 도착';
    showTeamStatus();
    if(state.arrivals.length===1) {
      showToast('🏆 '+ball.name+' 1등 도착!');playNote(880,.18);
    } else {
      showToast(''+state.arrivals.length+'등 '+ball.name+' 골인!');
      if(state.arrivals.length%2===0)playNote(630+state.arrivals.length*8,.085);
    }
    if(state.mode==='winner'&&state.arrivals.length>=state.target) {
      finishAfter=performance.now()+850;
      $('play-description').textContent=state.target+'명 골인 · 경기 종료!';
    } else if(state.mode==='teams'&&state.arrivals.length===current.total) {
      finishAfter=performance.now()+800;
    }
    updateLiveRankings();
  }
  function resolveArrival() {
    if(!current||state.finished)return;
    const remaining=state.world.balls.filter(ball=>!ball.finished&&ball.body.position.y>=C.FINISH_Y);
    remaining.sort((a,b)=>b.body.position.y-a.body.position.y);
    for(const ball of remaining) {
      if(state.mode==='winner'&&state.arrivals.length>=state.target)break;
      arrival(ball);
    }
  }
  function timeoutRescue() {
    if(state.timeoutAnnounced)return;
    state.timeoutAnnounced=true;
    showToast('늦은 구슬은 회수 수로로 이동해요.');
    // Timeout fallback is explicit; no adjustment based on participant names/ranks.
    const left=state.world.balls.filter(b=>!b.finished).sort((a,b)=>b.body.position.y-a.body.position.y);
    for(const b of left){
      if(state.mode==='winner'&&state.arrivals.length>=state.target)break;
      arrival(b);
    }
  }
  function finish() {
    if(!current||state.finished)return;
    state.finished=true;
    $('result-overlay').hidden=false;
    const list=$('result-entries');list.replaceChildren();
    if(state.mode==='winner') {
      $('result-heading').textContent=state.target===1?'오늘의 1등!':'상위 '+state.target+'명 도착!';
      $('result-summary').textContent=state.target+'번째 구슬까지 골인해 경기가 끝났어요.';
      state.arrivals.slice(0,state.target).forEach((arrival,index)=>{
        const row=document.createElement('div');
        row.className=index===0?'winner-result':'person-result';
        row.textContent=(index===0?'🏆 ':index===1?'🥈 ':index===2?'🥉 ':'')+(index+1)+'등 · '+arrival.name;
        list.append(row);
      });
    } else {
      $('result-heading').textContent='팀 나누기 완료!';
      $('result-summary').textContent=state.balanced?
        '팀별 인원 차이를 최대 1명으로 맞췄어요.':
        '구슬이 도착한 입구대로 팀을 나눴어요.';
      for(let i=0;i<state.k;i++) {
        const group=document.createElement('div');group.className='group-result';
        const heading=document.createElement('strong'),members=document.createElement('small');
        const names=state.arrivals.filter(a=>a.team===i).map(a=>a.name);
        heading.textContent=state.labels[i]+' · '+names.length+'명';
        members.textContent=names.join(' · ')||'아직 없음';
        group.append(heading,members);list.append(group);
      }
    }
    $('play-description').textContent='경기가 끝났어요.';
    playNote(1040,.24);
  }
  function exportRoster() {
    const raw=roster.value;
    try {
      const names=C.normalizeNames(raw);
      localStorage.setItem(C.BRIDGE_KEY,C.rosterPayload(names));
      const previous=readJson(C.BUMPER_KEY)||{};
      previous.names=names.join('\n');
      localStorage.setItem(C.BUMPER_KEY,JSON.stringify(previous));
    } catch (_) {} // Don't overwrite the other game's saved roster on empty/invalid inputs.
  }
  function updateLiveRankings() {
    if(!current)return;
    const entries=state.world.balls.filter(b=>!b.finished).sort((a,b)=>b.body.position.y-a.body.position.y);
    const list=$('live-rank-list');list.replaceChildren();
    const top=entries.slice(0,5);
    top.forEach((b,i)=>{
      const li=document.createElement('li');
      const dot=document.createElement('i'),name=document.createElement('span'),pos=document.createElement('strong');
      dot.style.background=b.color;name.textContent=b.name;pos.textContent=(i+1)+'위';
      li.append(pos,dot,name);list.append(li);
    });
    if(!top.length){const li=document.createElement('li');li.textContent='모두 도착했어요!';list.append(li);}
  }
  function pullImpacts(now) {
    const impacts=state.world?.impacts;
    if(!impacts?.length)return;
    for(const event of impacts.splice(0,impacts.length)){
      const vx=event.type==='bumper'?2.7:1.7;
      fx.push({x:event.x,y:event.y,start:now,life:330,energy:event.energy,
        type:event.type,vx,color:event.type==='bumper'?'#ffca67':'#8dfff0'});
      if(now-lastImpactSound>105){playNote(event.type==='bumper'?410:580,.05);lastImpactSound=now;}
    }
    if(fx.length>90)fx.splice(0,fx.length-90);
  }
  function drawEffects(now) {
    for(let i=fx.length-1;i>=0;i--){
      const p=fx[i],t=(now-p.start)/p.life;
      if(t>=1){fx.splice(i,1);continue;}
      const radius=17+t*45*p.energy;
      ctx.save();
      ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=p.color;ctx.lineWidth=4*(1-t)+1;
      ctx.shadowBlur=18;ctx.shadowColor=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.stroke();
      for(let k=0;k<6;k++){
        const a=k*Math.PI/3+t*1.1,inner=radius*1.1,outer=inner+13*(1-t);
        ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*inner,p.y+Math.sin(a)*inner);
        ctx.lineTo(p.x+Math.cos(a)*outer,p.y+Math.sin(a)*outer);ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawPill(x,y,w,h,r=10) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  }
  function drawBoard() {
    const g=ctx.createLinearGradient(0,0,900,690);
    g.addColorStop(0,'#152444');g.addColorStop(.55,'#1c2b50');g.addColorStop(1,'#10182d');
    ctx.fillStyle=g;ctx.fillRect(0,0,C.W,C.H);
    ctx.save();
    for(let i=0;i<48;i++){
      ctx.beginPath();ctx.arc((i*157+91)%C.W,(i*83+39)%C.H,1.25,0,Math.PI*2);
      ctx.fillStyle='rgba(185,215,255,.18)';ctx.fill();
    }
    // Bright visible arcade zones and movement lanes, rather than an empty falling-ball board.
    const zones=[
      [118,252,'1 / 범퍼 난전','#fead5c'],
      [254,419,'2 / 회전 대결','#65e2cf'],
      [421,574,'3 / 결승 스프린트','#b7a1ff']
    ];
    for(const [top,bottom,label,color] of zones){
      ctx.fillStyle=color+'0D';drawPill(92,top,716,bottom-top,17);ctx.fill();
      ctx.fillStyle=color;ctx.textAlign='right';ctx.font='bold 13px system-ui';
      ctx.fillText(label,796,top+24);
    }
    for(let i=0;i<14;i++){
      const y=160+i*28;
      ctx.strokeStyle='rgba(255,255,255,.065)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(95,y);ctx.lineTo(130,y+11);ctx.stroke();
      ctx.beginPath();ctx.moveTo(772,y);ctx.lineTo(807,y+11);ctx.stroke();
    }
    ctx.strokeStyle='rgba(125,186,245,.20)';ctx.lineWidth=4;
    drawPill(46,32,808,637,32);ctx.stroke();
    ctx.font='900 19px system-ui';ctx.textAlign='center';ctx.fillStyle='rgba(235,244,255,.73)';
    ctx.fillText('PINBALL RACE',450,52);
    ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='bold 12px system-ui';
    ctx.fillText('START',92,103);
    ctx.beginPath();ctx.moveTo(80,C.FINISH_Y);ctx.lineTo(820,C.FINISH_Y);
    ctx.setLineDash([12,9]);ctx.strokeStyle='rgba(237,245,255,.74)';ctx.lineWidth=3;ctx.stroke();
    ctx.setLineDash([]);ctx.font='bold 13px system-ui';ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.fillText('FINISH',92,C.FINISH_Y-12);
    const teamCount=state.mode==='teams'?state.k:1;
    for(let i=0;i<teamCount;i++){
      const w=740/teamCount, x=80+i*w, full=state.mode==='teams'&&state.balanced&&state.counts[i]>=state.capacities[i];
      ctx.fillStyle=full?'rgba(225,123,94,.25)':'rgba(76,206,162,.13)';
      drawPill(x+5,597,w-10,75,10);ctx.fill();
      ctx.strokeStyle=full?'#f39b86':'#50d3a9';ctx.lineWidth=2;ctx.stroke();
      ctx.font='bold 13px system-ui';ctx.textAlign='center';
      ctx.fillStyle=full?'#ffc0af':'#b6ffe6';
      const label=state.mode==='teams'?state.labels[i]:'결승선';
      ctx.fillText(label,x+w/2,614,w-14);
      if(state.mode==='teams'){
        const message=full?'마감':state.balanced?state.counts[i]+' / '+state.capacities[i]:state.counts[i]+'명';
        ctx.font='bold 11px system-ui';ctx.fillText(message,x+w/2,667);
        if(full){
          ctx.beginPath();ctx.moveTo(x+12,590);ctx.lineTo(x+w-12,590);
          ctx.strokeStyle='#fda38d';ctx.lineWidth=7;ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  function drawBody(body) {
    const isCircle=Number.isFinite(body.circleRadius)&&body.circleRadius>0;
    const tint=body.render?.fillStyle||'#879bb9';
    ctx.save();
    ctx.shadowBlur=body.label==='bumper'?18:body.label==='spinner'?10:0;
    ctx.shadowColor=tint;
    ctx.beginPath();
    if(isCircle)ctx.arc(body.position.x,body.position.y,body.circleRadius,0,Math.PI*2);
    else {
      body.vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));
      ctx.closePath();
    }
    ctx.fillStyle=tint;ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.27)';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
  function drawBall(ball,now,showName=false) {
    let x=ball.body.position.x,y=ball.body.position.y;
    if(ball.finishFx) {
      const fx=ball.finishFx, t=Math.min(1,(now-fx.started)/650);
      const eased=t*t*(3-2*t);
      x=fx.sx+(fx.tx-fx.sx)*eased;
      y=fx.sy+(fx.ty-fx.sy)*eased-Math.sin(t*Math.PI)*18;
    }
    ctx.save();
    if(!ball.finished){
      const trace=ball.trace||[];
      trace.forEach((p,i)=>{
        ctx.globalAlpha=(i+1)/trace.length*.40;
        ctx.beginPath();ctx.arc(p.x,p.y,2+6*i/trace.length,0,Math.PI*2);
        ctx.fillStyle=ball.color;ctx.fill();
      });
      ctx.globalAlpha=1;
    }
    ctx.shadowBlur=19;ctx.shadowColor=ball.color;
    const g=ctx.createRadialGradient(x-5,y-6,2,x,y,16);
    g.addColorStop(0,'#fff');g.addColorStop(.24,ball.color);g.addColorStop(1,ball.color);
    ctx.beginPath();ctx.arc(x,y,C.RADIUS+2,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=2;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 10px system-ui';ctx.fillStyle='#101a30';ctx.fillText(String(ball.index+1),x,y+.5);
    if(showName||ball.finished){
      ctx.font='900 18px "Malgun Gothic",system-ui';ctx.textBaseline='bottom';
      ctx.lineWidth=5;ctx.strokeStyle='rgba(4,13,34,.95)';ctx.strokeText(ball.name,x,y-23,112);
      ctx.fillStyle='white';ctx.fillText(ball.name,x,y-23,112);
    }
    ctx.restore();
  }
  function draw(now) {
    ctx.clearRect(0,0,C.W,C.H);
    drawBoard();
    if(!current) return;
    for(const body of current.world.staticBodies)drawBody(body);
    const leaders=new Set(current.world.balls.filter(b=>!b.finished)
      .sort((a,b)=>b.body.position.y-a.body.position.y).slice(0,6));
    for(const ball of current.world.balls)drawBall(ball,now,leaders.has(ball));
    drawEffects(now);
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if(toastDeadline&&now>toastDeadline){$('race-toast').classList.remove('show');toastDeadline=0;}
    if(current&&!state.finished){
      if(!lastFrame)lastFrame=now;
      const delta=Math.min(70,Math.max(0,now-lastFrame));
      if(!finishAfter) accumulator+=delta*state.speed;
      elapsedMs=now-startedAt;
      let steps=0;
      while(!finishAfter&&accumulator>=1000/60&&steps<6){
        current.world.step();accumulator-=1000/60;steps++;
        if(current.world.frame()%2===0){
          for(const b of current.world.balls){
            if(b.finished)continue;
            const trace=b.trace||(b.trace=[]);
            trace.push({x:b.body.position.x,y:b.body.position.y});
            if(trace.length>11)trace.shift();
          }
        }
      }
      pullImpacts(now);
      if(!finishAfter)resolveArrival();
      if(now-lastRankPaint>175){updateLiveRankings();lastRankPaint=now;}
      const cap=state.mode==='winner'?35000:40000;
      if(!finishAfter&&elapsedMs>=cap&&!state.timeoutAnnounced)timeoutRescue();
      if(finishAfter&&now>=finishAfter)finish();
      $('race-clock').textContent=String(Math.floor(elapsedMs/60000)).padStart(2,'0')+':'+
        String(Math.floor(elapsedMs/1000)%60).padStart(2,'0');
    }
    lastFrame=now;
    draw(now);
  }
  function restore() {
    const old=readJson(C.OWN_KEY);
    roster.value=preferredNames();
    if(old) {
      if(old.mode==='teams')document.querySelector('input[name="mode"][value="teams"]').checked=true;
      if([2,3,4].includes(Number(old.k)))$('team-count').value=String(old.k);
      $('balanced').checked=old.balanced!==false;
      if(old.labels)$('team-labels').value=old.labels;
      if(Number.isInteger(old.target)&&old.target>=1&&old.target<=30)$('finish-target').value=String(old.target);
      if([1,1.55,1.9].includes(Number(old.speed)))$('race-speed').value=String(old.speed);
    }
    syncMode();
  }
  document.querySelectorAll('input[name="mode"]').forEach(el=>el.addEventListener('change',()=>{syncMode();saveConfig();}));
  [roster,$('team-count'),$('balanced'),$('team-labels'),$('finish-target'),$('race-speed')].forEach(el=>el.addEventListener('change',saveConfig));
  $('sample-btn').addEventListener('click',()=>{roster.value='민준\n서연\n도윤\n하은\n지호\n수아\n현우\n윤서';saveConfig();say('예시 명단을 넣었어요.');});
  $('clear-btn').addEventListener('click',()=>{roster.value='';saveConfig();say('');roster.focus();});
  $('classroom-btn').addEventListener('click',()=>{
    try {
      const students=window.Gulliver?.getClassroom?.()?.students||readJson('gulliver.classroom.v1')?.students||[];
      if(!students.length){say('우리 반에 저장한 학생이 없어요. 먼저 명단을 등록해 주세요.',true);return;}
      if(students.length>30){say('핀볼 레이스는 30명까지 가능해요. 필요한 친구만 골라 넣어 주세요.',true);return;}
      roster.value=students.map(s=>s.name).join('\n');saveConfig();say(students.length+'명을 불러왔어요.');
    }catch(_){say('우리 반 명단을 읽지 못했어요.',true);}
  });
  $('start-btn').addEventListener('click',start);
  $('stop-btn').addEventListener('click',()=>{stopRun();say('레이스를 중단하고 설정으로 돌아왔어요.');});
  $('again-btn').addEventListener('click',start);
  $('edit-btn').addEventListener('click',()=>stopRun());
  document.querySelectorAll('[data-bumper-switch]').forEach(link=>link.addEventListener('click',exportRoster));
  $('fullscreen-btn').addEventListener('click',async()=>{
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    }catch(_){say('전체 화면을 사용할 수 없는 브라우저예요.',true);}
  });
  if(!C||!M){say('핀볼 물리 엔진을 불러오지 못했습니다. 새로고침해 주세요.',true);$('start-btn').disabled=true;return;}
  restore();requestAnimationFrame(loop);
})();
