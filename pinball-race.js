/* CLASHEET · Pinball Race (standalone classroom game). */
(() => {
  'use strict';
  const C=window.ClasheetPinballCore, M=window.Matter;
  const $=id=>document.getElementById(id);
  const canvas=$('pinball-canvas'), ctx=canvas.getContext('2d');
  const roster=$('roster-input'), modeOptions=$('race-options');
  const teamNames=['파랑 팀','노랑 팀','초록 팀','보라 팀'];
  let current=null, startedAt=0, elapsedMs=0, lastFrame=0, accumulator=0, finishAfter=0;
  let toastDeadline=0, audio=null, muted=false;
  const state={mode:'winner',k:2,balanced:true,labels:[],world:null,allocator:null,counts:[],capacities:[],
    arrivals:[],finished:false,timeoutAnnounced:false};

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
    if(bridge)return bridge.join('\n');
    const own=readJson(C.OWN_KEY);
    if(own&&typeof own.names==='string')return own.names;
    const old=readJson(C.BUMPER_KEY);
    return typeof old?.names==='string'?old.names:'';
  }
  function syncMode() {
    const selected=document.querySelector('input[name="mode"]:checked');
    $('team-options').hidden=selected?.value!=='teams';
    $('start-btn').textContent=selected?.value==='teams'?'▶ 팀 나누기 시작':'▶ 레이스 시작';
    updateDescription();
  }
  function updateDescription() {
    const isTeams=document.querySelector('input[name="mode"]:checked')?.value==='teams';
    if(!current)$('play-description').textContent=isTeams?'팀이 가득 차면 다음 입구로 이동해요':'가장 먼저 골인하면 승리!';
  }
  function collectConfig() {
    const names=C.normalizeNames(roster.value);
    const mode=document.querySelector('input[name="mode"]:checked')?.value||'winner';
    const k=Number($('team-count').value), balanced=$('balanced').checked;
    if(mode==='teams'&&k>names.length)throw Error('팀 수보다 참가자가 적어요. 팀을 줄이거나 친구를 더 넣어 주세요.');
    const raw=$('team-labels').value.split(/[,，\n]/).map(s=>s.trim());
    const labels=Array.from({length:k},(_,i)=>raw[i]||teamNames[i]);
    if(new Set(labels).size!==labels.length)throw Error('서로 다른 팀 이름을 입력해 주세요.');
    return {names,mode,k,balanced,labels};
  }
  function saveConfig() {
    try {
      localStorage.setItem(C.OWN_KEY,JSON.stringify({names:roster.value,
        mode:document.querySelector('input[name="mode"]:checked')?.value,
        k:Number($('team-count').value),balanced:$('balanced').checked,labels:$('team-labels').value}));
    }catch(_){}
  }
  function stopRun(showSetup=true) {
    if(current?.world) M.Engine.clear(current.world.engine);
    current=null;state.world=null;state.finished=false;finishAfter=0;accumulator=0;
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
    $('play-title').textContent=state.mode==='teams'?'팀 나누기 레이스':'1등 뽑기 레이스';
    $('play-description').textContent='출발! 구슬을 응원해 주세요.';
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
      showToast(state.mode==='winner'?'🏆 '+ball.name+' 1등 도착!':'첫 도착! '+ball.name);
      playNote(880,.18);
    } else if(state.arrivals.length%3===0)playNote(630,.09);
    if(state.mode==='winner') {
      if(!finishAfter) finishAfter=performance.now()+1150;
    } else if(state.arrivals.length===current.total) {
      finishAfter=performance.now()+800;
    }
  }
  function resolveArrival() {
    if(!current||state.finished)return;
    const remaining=state.world.balls.filter(ball=>!ball.finished&&ball.body.position.y>=C.FINISH_Y);
    remaining.sort((a,b)=>b.body.position.y-a.body.position.y);
    for(const ball of remaining) {
      arrival(ball);
      if(state.mode==='winner')break;
    }
  }
  function timeoutRescue() {
    if(state.timeoutAnnounced)return;
    state.timeoutAnnounced=true;
    showToast('늦은 구슬은 회수 수로로 이동해요.');
    // Timeout fallback is explicit; no adjustment based on participant names/ranks.
    const left=state.world.balls.filter(b=>!b.finished).sort((a,b)=>b.body.position.y-a.body.position.y);
    for(const b of left){arrival(b);if(state.mode==='winner')break;}
  }
  function finish() {
    if(!current||state.finished)return;
    state.finished=true;
    $('result-overlay').hidden=false;
    const list=$('result-entries');list.replaceChildren();
    if(state.mode==='winner') {
      $('result-heading').textContent='오늘의 1등!';
      $('result-summary').textContent='핀볼을 가장 먼저 통과한 친구예요.';
      const winner=document.createElement('div');winner.className='winner-result';
      winner.textContent='🏆 '+(state.arrivals[0]?.name||'도착자 없음');
      list.append(winner);
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
  function drawBall(ball,now) {
    let x=ball.body.position.x,y=ball.body.position.y;
    if(ball.finishFx) {
      const fx=ball.finishFx, t=Math.min(1,(now-fx.started)/650);
      const eased=t*t*(3-2*t);
      x=fx.sx+(fx.tx-fx.sx)*eased;
      y=fx.sy+(fx.ty-fx.sy)*eased-Math.sin(t*Math.PI)*18;
    }
    ctx.save();
    ctx.shadowBlur=15;ctx.shadowColor=ball.color;
    const g=ctx.createRadialGradient(x-5,y-6,2,x,y,16);
    g.addColorStop(0,'#fff');g.addColorStop(.24,ball.color);g.addColorStop(1,ball.color);
    ctx.beginPath();ctx.arc(x,y,C.RADIUS+2,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.82)';ctx.lineWidth=2;ctx.stroke();
    ctx.font='900 16px "Malgun Gothic",system-ui';ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.lineWidth=5;ctx.strokeStyle='rgba(4,13,34,.95)';ctx.strokeText(ball.name,x,y-21,115);
    ctx.fillStyle='white';ctx.fillText(ball.name,x,y-21,115);
    ctx.restore();
  }
  function draw(now) {
    ctx.clearRect(0,0,C.W,C.H);
    drawBoard();
    if(!current) return;
    for(const body of current.world.staticBodies)drawBody(body);
    for(const ball of current.world.balls)drawBall(ball,now);
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if(toastDeadline&&now>toastDeadline){$('race-toast').classList.remove('show');toastDeadline=0;}
    if(current&&!state.finished){
      if(!lastFrame)lastFrame=now;
      const delta=Math.min(70,Math.max(0,now-lastFrame));
      accumulator+=delta;
      elapsedMs=now-startedAt;
      let steps=0;
      while(accumulator>=1000/60&&steps<5){
        current.world.step();accumulator-=1000/60;steps++;
      }
      resolveArrival();
      const cap=state.mode==='winner'?38000:44000;
      if(elapsedMs>=cap&&!state.timeoutAnnounced)timeoutRescue();
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
    }
    syncMode();
  }
  document.querySelectorAll('input[name="mode"]').forEach(el=>el.addEventListener('change',()=>{syncMode();saveConfig();}));
  [roster,$('team-count'),$('balanced'),$('team-labels')].forEach(el=>el.addEventListener('change',saveConfig));
  $('sample-btn').addEventListener('click',()=>{roster.value='민준\n서연\n도윤\n하은\n지호\n수아\n현우\n윤서';saveConfig();say('예시 명단을 넣었어요.');});
  $('clear-btn').addEventListener('click',()=>{roster.value='';saveConfig();say('');roster.focus();});
  $('classroom-btn').addEventListener('click',()=>{
    try {
      const students=window.Gulliver?.getClassroom?.()?.students||readJson('gulliver.classroom.v1')?.students||[];
      if(!students.length){say('우리 반에 저장한 학생이 없어요. 먼저 명단을 등록해 주세요.',true);return;}
      if(students.length>16){say('핀볼 레이스는 16명까지 가능해요. 필요한 친구만 골라 넣어 주세요.',true);return;}
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
