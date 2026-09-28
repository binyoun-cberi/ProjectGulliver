(()=>{
'use strict';
const KEY='gulliver.tournamentMaker.v1';
const $=id=>document.getElementById(id);
const ui={
  modeTabs:$('modeTabs'),title:$('tournamentTitle'),entries:$('entriesInput'),entryCount:$('entryCount'),
  entriesLabel:$('entriesLabel'),entryHint:$('entryHint'),loadClassroom:$('loadClassroomBtn'),makeTeams:$('makeTeamsBtn'),
  example:$('exampleBtn'),seedCount:$('seedCount'),shuffle:$('shuffleInput'),sizeInfo:$('bracketSizeInfo'),
  generate:$('generateBtn'),reset:$('resetBtn'),presentation:$('presentationBtn'),exitPresentation:$('exitPresentationBtn'),
  arena:$('arena'),arenaTitle:$('arenaTitle'),roundEyebrow:$('roundEyebrow'),countdown:$('countdown'),
  countdownBtn:$('countdownBtn'),undo:$('undoBtn'),bracket:$('bracket'),summary:$('bracketSummary'),
  championInline:$('championInline'),dialog:$('championDialog'),championTitle:$('championTitle'),
  championName:$('championName'),closeChampion:$('closeChampionBtn')
};
const defaults={mode:'individual',title:'우리 반 토너먼트',entries:'',seedCount:0,shuffle:true,bracket:null,history:[]};
let state={...defaults};
let countdownTimer=null;

function safeParse(raw,fallback){try{return raw?JSON.parse(raw):fallback}catch{return fallback}}
function uid(){return 'p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function shuffleArray(items){
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function parseEntries(){
  return String(ui.entries.value||'').split(/\r?\n|,/).map(v=>v.trim()).filter(Boolean).slice(0,64);
}
function nextPowerOfTwo(n){let p=2;while(p<n)p*=2;return p}
function previousPowerOfTwo(n){let p=1;while(p*2<=n)p*=2;return p}
function roundName(roundIndex,totalRounds,size){
  if(roundIndex===totalRounds-1)return '결승';
  const people=size/Math.pow(2,roundIndex);
  return people===4?'4강':people+'강';
}
function hasPreliminaryRound(b){
  if(!b?.rounds?.[0])return false;
  return b.rounds[0].matches.some(match=>Boolean(match.aId)!==Boolean(match.bId));
}
function displayRoundName(b,roundIndex){
  if(roundIndex===0&&hasPreliminaryRound(b))return '예선';
  return roundName(roundIndex,b.rounds.length,b.size);
}
function visibleMatchesForRound(b,roundIndex){
  const round=b.rounds[roundIndex];
  if(!round)return [];
  if(roundIndex!==0||!hasPreliminaryRound(b))return round.matches.map((match,index)=>({match,index}));
  return round.matches.map((match,index)=>({match,index})).filter(({match})=>match.aId&&match.bId);
}
function modeUnit(){
  if(state.mode==='individual')return '명';
  if(state.mode==='team')return '팀';
  return '개 후보';
}
function loadState(){
  const saved=safeParse(localStorage.getItem(KEY),null);
  if(!saved||typeof saved!=='object')return;
  state={...defaults,...saved};
  if(!['individual','team','worldcup'].includes(state.mode))state.mode='individual';
  if(!Array.isArray(state.history))state.history=[];
}
function saveState(){
  state.title=ui.title.value.trim().slice(0,40)||'우리 반 토너먼트';
  state.entries=ui.entries.value;
  state.seedCount=Number(ui.seedCount.value)||0;
  state.shuffle=Boolean(ui.shuffle.checked);
  localStorage.setItem(KEY,JSON.stringify(state));
}
function renderMode(){
  ui.modeTabs.querySelectorAll('[data-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===state.mode));
  if(state.mode==='individual'){
    ui.entriesLabel.textContent='참가자 · 한 줄에 한 명';
    ui.entryHint.textContent='2~64명까지 가능해요. 애매한 인원수는 자동으로 부전승 처리됩니다.';
    ui.makeTeams.hidden=false;ui.loadClassroom.hidden=false;
  }else if(state.mode==='team'){
    ui.entriesLabel.textContent='팀 · 한 줄에 한 팀';
    ui.entryHint.textContent='팀 이름 또는 “민수 · 서준”처럼 팀원을 한 줄에 적으세요.';
    ui.makeTeams.hidden=false;ui.loadClassroom.hidden=false;
  }else{
    ui.entriesLabel.textContent='후보 · 한 줄에 하나';
    ui.entryHint.textContent='음식, 책, 역사 인물, 캐릭터 등 무엇이든 후보로 넣을 수 있어요.';
    ui.makeTeams.hidden=true;ui.loadClassroom.hidden=true;
  }
  updateEntryMeta();
}
function updateEntryMeta(){
  const count=parseEntries().length;
  ui.entryCount.textContent=count+modeUnit();
  if(count<2){ui.sizeInfo.value='참가자를 입력하세요';return}
  const size=nextPowerOfTwo(count);
  if(size===count){
    ui.sizeInfo.value=size+'강 바로 시작';
  }else{
    const mainSize=previousPowerOfTwo(count);
    const prelimMatches=count-mainSize;
    ui.sizeInfo.value='예선 '+prelimMatches+'경기 → '+mainSize+'강';
  }
  const maxSeed=count>=4?4:count>=2?2:0;
  [...ui.seedCount.options].forEach(opt=>{opt.disabled=Number(opt.value)>maxSeed});
  if(Number(ui.seedCount.value)>maxSeed)ui.seedCount.value=String(maxSeed||0);
}
function participantById(id){
  return state.bracket?.participants?.find(p=>p.id===id)||null;
}
function currentSides(roundIndex,matchIndex){
  const b=state.bracket;if(!b)return {a:null,b:null,ready:false};
  const match=b.rounds[roundIndex].matches[matchIndex];
  if(roundIndex===0)return {a:match.aId||null,b:match.bId||null,ready:true};
  const prev=b.rounds[roundIndex-1].matches;
  const left=prev[matchIndex*2],right=prev[matchIndex*2+1];
  return {a:left?.winnerId||null,b:right?.winnerId||null,ready:Boolean(left?.resolved&&right?.resolved)};
}
function recalculate(){
  const b=state.bracket;if(!b)return;
  b.rounds.forEach((round,r)=>{
    round.matches.forEach((match,m)=>{
      const sides=currentSides(r,m);
      match.currentA=sides.a;match.currentB=sides.b;
      if(!sides.ready){match.resolved=false;match.winnerId=null;return}
      const valid=[sides.a,sides.b].filter(Boolean);
      if(valid.length<=1){match.winnerId=valid[0]||null;match.resolved=true;return}
      if(!valid.includes(match.winnerId))match.winnerId=null;
      match.resolved=Boolean(match.winnerId);
    });
  });
  const final=b.rounds.at(-1)?.matches?.[0];
  b.championId=final?.resolved?final.winnerId:null;
}
function buildPairs(participants,size,seedCount){
  const matchCount=size/2;
  const pairs=Array.from({length:matchCount},()=>[null,null]);
  let ordered=[...participants];
  const seeds=ordered.slice(0,seedCount);
  let rest=ordered.slice(seedCount);
  if(state.shuffle)rest=shuffleArray(rest);
  const seedMatchOrder=[0,matchCount-1,Math.floor(matchCount/2),Math.max(0,Math.floor(matchCount/2)-1)]
    .filter((v,i,a)=>v>=0&&v<matchCount&&a.indexOf(v)===i);
  seeds.forEach((p,i)=>{
    const matchIndex=seedMatchOrder[i]??i%matchCount;
    const side=i%2===0?0:1;
    if(!pairs[matchIndex][side])pairs[matchIndex][side]=p;
    else pairs[matchIndex][1-side]=p;
  });
  rest.forEach(p=>{
    let target=pairs.findIndex(pair=>!pair[0]&&!pair[1]);
    if(target<0)target=pairs.findIndex(pair=>!pair[0]||!pair[1]);
    if(target<0)return;
    if(!pairs[target][0])pairs[target][0]=p;else pairs[target][1]=p;
  });
  return pairs;
}
function createBracket(){
  const names=parseEntries();
  if(names.length<2){Gulliver.toast('참가자를 2명 이상 입력해 주세요.');ui.entries.focus();return}
  const participants=names.map(name=>({id:uid(),name:name.slice(0,40)}));
  const size=nextPowerOfTwo(participants.length);
  let seedCount=Math.min(Number(ui.seedCount.value)||0,participants.length);
  if(seedCount===4&&participants.length<4)seedCount=2;
  const pairs=buildPairs(participants,size,seedCount);
  const totalRounds=Math.log2(size);
  const rounds=[];
  rounds.push({matches:pairs.map((pair,i)=>({id:'r0m'+i,aId:pair[0]?.id||null,bId:pair[1]?.id||null,winnerId:null,resolved:false}))});
  for(let r=1;r<totalRounds;r++){
    rounds.push({matches:Array.from({length:size/Math.pow(2,r+1)},(_,i)=>({id:'r'+r+'m'+i,winnerId:null,resolved:false}))});
  }
  state.bracket={participants,size,rounds,championId:null,createdAt:Date.now()};
  state.history=[];
  recalculate();saveState();renderAll();
  const mainSize=previousPowerOfTwo(participants.length);
  const prelimMatches=participants.length-mainSize;
  Gulliver.toast(prelimMatches>0?'예선 '+prelimMatches+'경기 후 '+mainSize+'강으로 진행합니다.':size+'강 대진표를 만들었습니다.');
}
function winnerSnapshot(){
  return state.bracket.rounds.map(r=>r.matches.map(m=>m.winnerId||null));
}
function restoreSnapshot(snapshot){
  if(!state.bracket||!Array.isArray(snapshot))return;
  state.bracket.rounds.forEach((r,ri)=>r.matches.forEach((m,mi)=>{m.winnerId=snapshot[ri]?.[mi]||null}));
  recalculate();
}
function chooseWinner(roundIndex,matchIndex,participantId){
  const b=state.bracket;if(!b)return;
  const match=b.rounds[roundIndex]?.matches?.[matchIndex];if(!match)return;
  const sides=currentSides(roundIndex,matchIndex);
  if(!sides.ready||!sides.a||!sides.b||![sides.a,sides.b].includes(participantId))return;
  state.history.push(winnerSnapshot());if(state.history.length>30)state.history.shift();
  match.winnerId=participantId;match.resolved=true;
  recalculate();saveState();renderAll();
  const finalIndex=b.rounds.length-1;
  if(roundIndex===finalIndex&&b.championId)showChampion();
}
function undo(){
  const snapshot=state.history.pop();
  if(!snapshot){Gulliver.toast('되돌릴 승패가 없습니다.');return}
  restoreSnapshot(snapshot);saveState();renderAll();Gulliver.toast('직전 승패를 되돌렸습니다.');
}
function getCurrentMatch(){
  const b=state.bracket;if(!b)return null;
  for(let r=0;r<b.rounds.length;r++){
    for(let m=0;m<b.rounds[r].matches.length;m++){
      const match=b.rounds[r].matches[m];
      const sides=currentSides(r,m);
      if(sides.ready&&sides.a&&sides.b&&!match.resolved)return {r,m,match,sides};
    }
  }
  return null;
}
function slotButton(id,roundIndex,matchIndex,match){
  if(!id)return '<button class="slot empty" type="button" disabled><span class="slot-name">부전승</span><span class="bye">BYE</span></button>';
  const p=participantById(id);if(!p)return '';
  const isWinner=match.winnerId===id;
  const sides=currentSides(roundIndex,matchIndex);
  const selectable=sides.ready&&sides.a&&sides.b;
  return '<button class="slot '+(isWinner?'winner ':'')+(selectable&&!match.resolved?'pending':'')+'" type="button" data-win="'+roundIndex+','+matchIndex+','+id+'" '+(selectable?'':'disabled')+'>'+
    '<span class="slot-name">'+escapeHtml(p.name)+'</span><span class="slot-mark">'+(isWinner?'승리 ✓':selectable?'선택':'')+'</span></button>';
}
function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function renderBracket(){
  const b=state.bracket;
  if(!b){ui.bracket.innerHTML='<div class="empty-arena" style="padding:42px"><strong>대진표가 비어 있어요</strong>참가자를 입력하고 만들어 주세요.</div>';ui.summary.textContent='승자를 누르면 다음 라운드로 자동 진출합니다.';return}
  const visibleCounts=b.rounds.map((_,r)=>visibleMatchesForRound(b,r).length);
  const height=Math.max(430,Math.max(...visibleCounts,1)*104);
  ui.bracket.style.setProperty('--bracket-h',height+'px');
  ui.bracket.innerHTML=b.rounds.map((round,r)=>{
    const name=displayRoundName(b,r);
    const visible=visibleMatchesForRound(b,r);
    return '<section class="round"><div class="round-head">'+name+'</div><div class="round-matches">'+
      visible.map(({match,index:m},visibleIndex)=>{
        const sides=currentSides(r,m);
        if(!sides.ready){
          const waiting='<button class="slot empty" type="button" disabled><span class="slot-name">진출자 대기</span><span class="bye">WAIT</span></button>';
          return '<div class="match"><div class="match-label">'+name+' · '+(visibleIndex+1)+'경기</div>'+waiting+waiting+'</div>';
        }
        return '<div class="match"><div class="match-label">'+name+' · '+(visibleIndex+1)+'경기</div>'+slotButton(sides.a,r,m,match)+slotButton(sides.b,r,m,match)+'</div>';
      }).join('')+'</div></section>';
  }).join('');
  const champion=participantById(b.championId);
  ui.summary.textContent=champion?'대회가 끝났습니다. 🏆 '+champion.name+' 우승!':'승자를 누르면 다음 라운드로 자동 진출합니다.';
  ui.bracket.querySelectorAll('[data-win]').forEach(btn=>btn.addEventListener('click',()=>{
    const [r,m,id]=btn.dataset.win.split(',');chooseWinner(Number(r),Number(m),id);
  }));
}
function renderArena(){
  const b=state.bracket;
  const current=getCurrentMatch();
  const champion=b?participantById(b.championId):null;
  ui.championInline.innerHTML=champion?'<div class="champion-inline">🏆 '+escapeHtml(champion.name)+'</div>':'';
  if(!b){
    ui.roundEyebrow.textContent='READY';ui.arenaTitle.textContent='대진표를 만들어 주세요';
    ui.arena.innerHTML='<div class="empty-arena"><strong>아직 경기가 없어요</strong>왼쪽에서 참가자를 입력하고 대진표를 만들어 주세요.</div><div class="countdown" id="countdown" aria-live="assertive"></div>';
    ui.countdown=$('countdown');ui.countdownBtn.disabled=true;return;
  }
  if(champion){
    ui.roundEyebrow.textContent='CHAMPION';ui.arenaTitle.textContent=state.title||'토너먼트';
    ui.arena.innerHTML='<div class="empty-arena"><strong style="font-size:56px">🏆</strong><strong>'+escapeHtml(champion.name)+'</strong>최종 우승자가 결정되었습니다.</div><div class="countdown" id="countdown" aria-live="assertive"></div>';
    ui.countdown=$('countdown');ui.countdownBtn.disabled=true;return;
  }
  if(!current){
    ui.roundEyebrow.textContent='WAIT';ui.arenaTitle.textContent='다음 진출자를 기다리는 중';
    ui.arena.innerHTML='<div class="empty-arena"><strong>자동 진출 처리 중</strong>대진표에서 남은 경기를 확인해 주세요.</div><div class="countdown" id="countdown" aria-live="assertive"></div>';
    ui.countdown=$('countdown');ui.countdownBtn.disabled=true;return;
  }
  const pa=participantById(current.sides.a),pb=participantById(current.sides.b);
  const round=displayRoundName(b,current.r);
  const visible=visibleMatchesForRound(b,current.r);
  const visibleIndex=Math.max(0,visible.findIndex(item=>item.index===current.m));
  ui.roundEyebrow.textContent=round.toUpperCase();ui.arenaTitle.textContent=round+' · '+(visibleIndex+1)+'경기';
  ui.arena.innerHTML='<div class="versus">'+
    fighterHtml(pa,'A',current.r,current.m)+
    '<div class="vs">VS</div>'+
    fighterHtml(pb,'B',current.r,current.m)+
    '</div><div class="countdown" id="countdown" aria-live="assertive"></div>';
  ui.countdown=$('countdown');
  ui.arena.querySelectorAll('[data-arena-win]').forEach(btn=>btn.addEventListener('click',()=>chooseWinner(current.r,current.m,btn.dataset.arenaWin)));
  ui.countdownBtn.disabled=false;
}
function fighterHtml(p,side,r,m){
  return '<div class="fighter"><div class="eyebrow">PLAYER '+side+'</div><div class="fighter-name">'+escapeHtml(p?.name||'')+'</div><small>승리하면 다음 라운드로 진출</small><button class="win-btn" type="button" data-arena-win="'+p.id+'">🏆 승리</button></div>';
}
function renderControls(){
  ui.undo.disabled=!state.history.length;
  ui.presentation.textContent=document.body.classList.contains('presentation')?'🖥️ 교사 화면':'📺 학생 화면';
  ui.exitPresentation.hidden=!document.body.classList.contains('presentation');
}
function renderAll(){renderMode();renderBracket();renderArena();renderControls()}
function setMode(mode){
  if(!['individual','team','worldcup'].includes(mode))return;
  state.mode=mode;
  if(mode==='worldcup'&&ui.title.value==='우리 반 토너먼트')ui.title.value='우리 반 이상형 월드컵';
  else if(mode!=='worldcup'&&ui.title.value==='우리 반 이상형 월드컵')ui.title.value='우리 반 토너먼트';
  saveState();renderMode();
}
function loadClassroom(){
  const room=Gulliver.getClassroom();
  if(!room.students.length){Gulliver.toast('먼저 우리 반에서 학생 명단을 저장해 주세요.');return}
  ui.entries.value=room.students.map(s=>s.name).join('\n');
  if(!ui.title.value.trim()||ui.title.value==='우리 반 토너먼트')ui.title.value=room.className+' 토너먼트';
  updateEntryMeta();saveState();Gulliver.toast(room.className+' '+room.students.length+'명을 불러왔습니다.');
}
function makeRandomTeams(){
  const room=Gulliver.getClassroom();
  let names=room.students.map(s=>s.name);
  if(names.length<2)names=parseEntries();
  if(names.length<2){Gulliver.toast('팀으로 묶을 학생이 2명 이상 필요합니다.');return}
  names=shuffleArray(names);
  const teams=[];
  for(let i=0;i<names.length;i+=2){
    if(i===names.length-1&&teams.length){teams[teams.length-1]+=' · '+names[i];}
    else teams.push(names[i]+(names[i+1]?' · '+names[i+1]:''));
  }
  state.mode='team';ui.entries.value=teams.join('\n');ui.title.value=(room.className||'우리 반')+' 팀 토너먼트';
  saveState();renderMode();Gulliver.toast(teams.length+'개 팀을 만들었습니다.');
}
function loadExample(){
  if(state.mode==='worldcup')ui.entries.value=['🍕 피자','🍗 치킨','🍜 라면','🍔 햄버거','🍣 초밥','🥟 만두','🍝 파스타','🍙 김밥'].join('\n');
  else if(state.mode==='team')ui.entries.value=['번개 팀','무지개 팀','로켓 팀','별빛 팀','파도 팀','구름 팀'].join('\n');
  else ui.entries.value=['김하늘','이새봄','박도윤','최서윤','정시우','한지민','윤도현','오유나'].join('\n');
  updateEntryMeta();saveState();
}
function togglePresentation(){
  const on=!document.body.classList.contains('presentation');
  document.body.classList.toggle('presentation',on);renderControls();
  if(on)window.scrollTo({top:0,behavior:'smooth'});
}
function runCountdown(){
  const current=getCurrentMatch();if(!current||countdownTimer)return;
  const values=['3','2','1','START!'];let i=0;
  ui.countdown.textContent=values[i];ui.countdown.classList.add('show');ui.countdownBtn.disabled=true;
  countdownTimer=setInterval(()=>{
    i++;
    if(i>=values.length){
      clearInterval(countdownTimer);countdownTimer=null;
      setTimeout(()=>{ui.countdown?.classList.remove('show');ui.countdownBtn.disabled=!getCurrentMatch()},350);
      return;
    }
    if(ui.countdown)ui.countdown.textContent=values[i];
  },650);
}
function showChampion(){
  const champ=participantById(state.bracket?.championId);if(!champ)return;
  ui.championTitle.textContent=(state.title||'토너먼트')+' 우승!';
  ui.championName.textContent=champ.name;
  if(typeof ui.dialog.showModal==='function'&&!ui.dialog.open)ui.dialog.showModal();
  launchConfetti();
}
function launchConfetti(){
  const colors=['#6d5dfc','#e6a72f','#1fa97a','#e75d64','#4b90e2'];
  for(let i=0;i<70;i++){
    const el=document.createElement('i');el.className='confetti';
    el.style.left=(Math.random()*100)+'vw';el.style.background=colors[i%colors.length];
    el.style.setProperty('--drift',((Math.random()-.5)*260)+'px');el.style.animationDelay=(Math.random()*.55)+'s';
    el.style.transform='rotate('+(Math.random()*180)+'deg)';
    document.body.appendChild(el);setTimeout(()=>el.remove(),3200);
  }
}
function resetBracket(){
  if(state.bracket&&!confirm('현재 대진과 경기 결과를 지울까요? 참가자 목록은 남겨둡니다.'))return;
  state.bracket=null;state.history=[];saveState();renderAll();
}
ui.modeTabs.addEventListener('click',e=>{const btn=e.target.closest('[data-mode]');if(btn)setMode(btn.dataset.mode)});
ui.entries.addEventListener('input',()=>{updateEntryMeta();saveState()});
ui.title.addEventListener('input',saveState);ui.seedCount.addEventListener('change',()=>{updateEntryMeta();saveState()});ui.shuffle.addEventListener('change',saveState);
ui.loadClassroom.addEventListener('click',loadClassroom);ui.makeTeams.addEventListener('click',makeRandomTeams);ui.example.addEventListener('click',loadExample);
ui.generate.addEventListener('click',createBracket);ui.undo.addEventListener('click',undo);ui.reset.addEventListener('click',resetBracket);
ui.presentation.addEventListener('click',togglePresentation);ui.exitPresentation.addEventListener('click',togglePresentation);
ui.countdownBtn.addEventListener('click',runCountdown);ui.closeChampion.addEventListener('click',()=>ui.dialog.close());
ui.dialog.addEventListener('cancel',()=>{});
window.addEventListener('beforeunload',saveState);
loadState();
ui.title.value=state.title||defaults.title;ui.entries.value=state.entries||'';ui.seedCount.value=String(state.seedCount||0);ui.shuffle.checked=state.shuffle!==false;
recalculate();renderAll();
Gulliver.mountShell({title:'토너먼트 메이커',icon:'🏆'});
})();