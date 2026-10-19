(() => {
'use strict';

const STORAGE_KEY = 'lessonCircleTimerV3';
const OLD_STORAGE_KEY = 'lessonCircleTimerV2';
const LEGACY_STORAGE_KEY = 'classTimerSettings';
const RUNTIME_KEY = 'lessonCircleTimerRuntimeV1';
const MAX_EVENTS = 30;
const MIN_DURATION = 10;
const MAX_DURATION = 6 * 60 * 60;
const palette = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#14B8A6','#F97316','#64748B'];

const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const stage = $('#stage');
const timerShell = $('#timerShell');
const canvas = $('#timerCanvas');
const ctx = canvas.getContext('2d');
const mainTitle = $('#mainTitle');
const eventList = $('#eventList');
const timeDisplay = $('#timeDisplay');
const phaseTimeDisplay = $('#phaseTimeDisplay');
const currentEventLabel = $('#currentEventLabel');
const currentEventNote = $('#currentEventNote');
const nextEventLabel = $('#nextEventLabel');
const studentTitle = $('#studentTitle');
const progressText = $('#progressText');
const runState = $('#runState');
const totalSummary = $('#totalSummary');
const countSummary = $('#countSummary');
const btnStartPause = $('#btnStartPause');
const btnSkip = $('#btnSkip');
const btnReset = $('#btnReset');
const btnMinusMinute = $('#btnMinusMinute');
const btnPlusMinute = $('#btnPlusMinute');
const btnSound = $('#btnSound');
const transitionBanner = $('#transitionBanner');
const toast = $('#toast');
const confirmBackdrop = $('#confirmBackdrop');
const finishBackdrop = $('#finishBackdrop');
const resumeBackdrop = $('#resumeBackdrop');

function makeId(){
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
}
function defaultEvents(){
  return [
    {id:makeId(),name:'도입',note:'오늘 배울 내용을 함께 확인해요',teacherNote:'',durationSec:5*60,warningSec:60,transitionSec:0,color:'#3B82F6'},
    {id:makeId(),name:'활동 1',note:'문제를 해결하며 핵심 개념을 익혀요',teacherNote:'',durationSec:15*60,warningSec:60,transitionSec:60,color:'#10B981'},
    {id:makeId(),name:'활동 2',note:'친구와 생각을 나누고 적용해요',teacherNote:'',durationSec:14*60,warningSec:60,transitionSec:60,color:'#F59E0B'},
    {id:makeId(),name:'정리 시간',note:'오늘 배운 내용을 돌아봐요',teacherNote:'',durationSec:4*60,warningSec:60,transitionSec:0,color:'#EF4444'}
  ];
}
const state = {
  events:defaultEvents(),
  elapsed:0,
  running:false,
  runStartedAt:0,
  elapsedAtStart:0,
  rafId:0,
  lastPhaseId:null,
  soundOn:true,
  panelCollapsed:false,
  zoom:1,
  finishShown:false,
  warnedSegmentKey:null,
  studentView:false
};

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function safeName(value,index=0){
  const text=String(value ?? '').replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,40);
  return text || `활동 ${index+1}`;
}
function safeColor(value,index=0){
  const color=String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : palette[index % palette.length];
}
function sanitizeEvents(raw){
  if(!Array.isArray(raw)) return defaultEvents();
  const ids=new Set();
  return raw.slice(0,MAX_EVENTS).map((ev,index)=>{
    let id=String(ev?.id || makeId());
    if(ids.has(id)) id=makeId();
    ids.add(id);
    let durationSec;
    if(Number.isFinite(Number(ev?.durationSec))) durationSec=Number(ev.durationSec);
    else durationSec=Number(ev?.duration || 5)*60;
    return {
      id,
      name:safeName(ev?.name,index),
      note:String(ev?.note||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,80),
      teacherNote:String(ev?.teacherNote||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,120),
      durationSec:clamp(Math.round(durationSec),MIN_DURATION,MAX_DURATION),
      warningSec:clamp(Math.round(Number(ev?.warningSec)||0),0,10*60),
      transitionSec:clamp(Math.round(Number(ev?.transitionSec)||0),0,15*60),
      color:safeColor(ev?.color,index)
    };
  });
}
function loadSettings(){
  let parsed=null;
  try{
    parsed=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  }catch(error){console.warn('설정 불러오기 실패',error);}
  if(!parsed){
    try{
      const old=JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || 'null');
      if(old) parsed={title:old.title,events:old.events,soundOn:old.soundOn,panelCollapsed:old.panelCollapsed,zoom:old.zoom};
    }catch(error){console.warn('이전 설정 변환 실패',error);}
  }
  if(!parsed){
    try{
      const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || 'null');
      if(legacy) parsed={title:legacy.title,events:legacy.events};
    }catch(error){console.warn('이전 설정 변환 실패',error);}
  }
  if(parsed){
    state.events=sanitizeEvents(parsed.events);
    if(typeof parsed.title==='string') mainTitle.value=parsed.title.slice(0,60);
    state.soundOn=parsed.soundOn !== false;
    state.panelCollapsed=parsed.panelCollapsed === true;
    state.zoom=clamp(Number(parsed.zoom)||1,.68,1.28);
  }
  app.classList.toggle('panel-collapsed',state.panelCollapsed);
  updateSoundButton();
}
function saveSettings(){
  const payload={
    title:mainTitle.value.slice(0,60),events:state.events,
    soundOn:state.soundOn,panelCollapsed:state.panelCollapsed,zoom:state.zoom
  };
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));}
  catch(error){showToast('설정을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');}
}
function scheduleSignature(){
  return JSON.stringify(state.events.map(e=>[e.id,e.durationSec,e.transitionSec,e.warningSec]));
}
function clearRuntime(){
  try{localStorage.removeItem(RUNTIME_KEY);}catch{}
}
function saveRuntime(){
  const total=totalSeconds();
  const elapsed=clamp(getElapsed(),0,total);
  if(!total||elapsed<=0||elapsed>=total){clearRuntime();return;}
  const payload={elapsed,running:state.running,savedAt:Date.now(),signature:scheduleSignature()};
  try{localStorage.setItem(RUNTIME_KEY,JSON.stringify(payload));}catch{}
}
let pendingRecovery=null;
function checkRuntimeRecovery(){
  let raw=null;
  try{raw=JSON.parse(localStorage.getItem(RUNTIME_KEY)||'null');}catch{}
  if(!raw||raw.signature!==scheduleSignature()||!Number.isFinite(Number(raw.elapsed))){clearRuntime();return}
  const age=Date.now()-Number(raw.savedAt||0);
  if(age<0||age>12*60*60*1000){clearRuntime();return}
  let elapsed=Number(raw.elapsed)||0;
  if(raw.running)elapsed+=(Date.now()-Number(raw.savedAt||Date.now()))/1000;
  elapsed=clamp(elapsed,0,totalSeconds());
  if(elapsed<=0||elapsed>=totalSeconds()){clearRuntime();return}
  pendingRecovery={elapsed,running:Boolean(raw.running)};
  $('#resumeMessage').textContent=`${formatClock(elapsed,false)}까지 진행한 기록이 있습니다. ${raw.running?'브라우저가 닫혀 있던 시간도 이어서 계산했습니다.':'일시정지했던 지점부터 이어갈 수 있습니다.'}`;
  resumeBackdrop.classList.remove('hidden');
}

function buildTimeline(){
  const timeline=[];
  state.events.forEach((event,index)=>{
    timeline.push({kind:'activity',event,index,durationSec:event.durationSec,key:'a:'+event.id});
    if(index<state.events.length-1 && event.transitionSec>0){
      timeline.push({kind:'transition',event,index,nextEvent:state.events[index+1],durationSec:event.transitionSec,key:'t:'+event.id});
    }
  });
  return timeline;
}
function totalSeconds(){return buildTimeline().reduce((sum,item)=>sum+item.durationSec,0);}
function getElapsed(now=performance.now()){
  if(!state.running) return state.elapsed;
  return state.elapsedAtStart+(now-state.runStartedAt)/1000;
}
function setElapsed(seconds){
  state.elapsed=clamp(Number(seconds)||0,0,totalSeconds());
  state.elapsedAtStart=state.elapsed;
  if(state.running) state.runStartedAt=performance.now();
}
function formatClock(seconds,useCeil=true){
  const safe=Math.max(0,useCeil?Math.ceil(seconds):Math.floor(seconds));
  const hours=Math.floor(safe/3600);
  const minutes=Math.floor((safe%3600)/60);
  const secs=safe%60;
  if(hours>0) return `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  return `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
function formatDurationCompact(seconds){
  const sec=Math.round(seconds);
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
  if(h) return `${h}시간 ${m}분`;
  if(s) return `${m}분 ${s}초`;
  return `${m}분`;
}
function phaseAt(elapsed){
  const timeline=buildTimeline();
  if(!timeline.length)return null;
  let start=0;
  for(let timelineIndex=0;timelineIndex<timeline.length;timelineIndex++){
    const segment=timeline[timelineIndex];
    const end=start+segment.durationSec;
    if(elapsed<end || (elapsed===0&&timelineIndex===0)){
      return {...segment,timelineIndex,start,end,remaining:Math.max(0,end-elapsed),elapsedInSegment:Math.max(0,elapsed-start)};
    }
    start=end;
  }
  return null;
}

function updateDisplay(now=performance.now()){
  const total=totalSeconds();
  const elapsed=clamp(getElapsed(now),0,total);
  const remaining=Math.max(0,total-elapsed);
  const phase=phaseAt(elapsed);
  totalSummary.textContent=formatDurationCompact(total);
  countSummary.textContent=`${state.events.length}개`;
  const percent=total?clamp(elapsed/total*100,0,100):0;
  progressText.textContent=`${Math.floor(percent)}% 진행 · 전체 ${formatDurationCompact(total)}`;
  studentTitle.textContent=mainTitle.value||'수업 타이머';

  if(!state.events.length || total===0){
    currentEventLabel.textContent='활동을 추가해 주세요';
    currentEventLabel.style.color='#526078';
    currentEventNote.textContent='';
    timeDisplay.textContent='00:00';
    phaseTimeDisplay.textContent='00:00';
    nextEventLabel.textContent='오른쪽 설정에서 수업 흐름을 만드세요';
    runState.textContent='시간표 없음';
    runState.className='run-state';
  }else if(elapsed>=total){
    currentEventLabel.textContent='모든 활동 완료';
    currentEventLabel.style.color='#4f46e5';
    currentEventNote.textContent='오늘 수업을 마무리해요';
    timeDisplay.textContent='00:00';
    phaseTimeDisplay.textContent='00:00';
    nextEventLabel.textContent='수업 시간이 종료되었습니다';
    runState.textContent='종료';
    runState.className='run-state finished';
  }else if(phase){
    if(phase.kind==='transition'){
      currentEventLabel.textContent='전환 시간';
      currentEventLabel.style.color='#64748b';
      currentEventNote.textContent=phase.nextEvent?`${phase.nextEvent.name} 준비`:'다음 활동 준비';
      nextEventLabel.textContent=phase.nextEvent?`다음: ${phase.nextEvent.name}`:'다음: 수업 종료';
    }else{
      currentEventLabel.textContent=phase.event.name;
      currentEventLabel.style.color=phase.event.color;
      currentEventNote.textContent=phase.event.note||'';
      const next=state.events[phase.index+1];
      nextEventLabel.textContent=next?`다음: ${phase.event.transitionSec>0?'전환 '+formatDurationCompact(phase.event.transitionSec)+' · ':''}${next.name}`:'다음: 수업 종료';
    }
    timeDisplay.textContent=formatClock(phase.remaining);
    phaseTimeDisplay.textContent=formatClock(remaining);
    if(state.running){runState.textContent='진행 중';runState.className='run-state running';}
    else if(elapsed>0){runState.textContent='일시정지';runState.className='run-state paused';}
    else{runState.textContent='준비';runState.className='run-state';}
  }
  btnStartPause.textContent=state.running?'Ⅱ':'▶';
  btnStartPause.setAttribute('aria-label',state.running?'타이머 일시정지':'타이머 시작');
  btnStartPause.disabled=total===0 || elapsed>=total;
  btnSkip.disabled=!phase || elapsed>=total;
  btnMinusMinute.disabled=!phase;
  btnPlusMinute.disabled=!phase;
  const titleClock=phase?formatClock(phase.remaining):formatClock(remaining);
  document.title=`${titleClock} · ${phase?.kind==='activity'?phase.event.name:(mainTitle.value||'수업 타이머')}`;
}

function hexToRgba(hex,alpha){
  const clean=safeColor(hex).slice(1);
  const r=parseInt(clean.slice(0,2),16),g=parseInt(clean.slice(2,4),16),b=parseInt(clean.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function fitCanvas(){
  const rect=timerShell.getBoundingClientRect();
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const width=Math.max(1,Math.round(rect.width));
  const height=Math.max(1,Math.round(rect.height));
  if(canvas.width!==Math.round(width*dpr) || canvas.height!==Math.round(height*dpr)){
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawTimer();
}
function fitTimerSize(){
  const rect=stage.getBoundingClientRect();
  const mobile=innerWidth<=720;
  const sideReserve=mobile?52:90;
  const verticalReserve=mobile?8:24;
  const base=Math.max(180,Math.min(rect.width-sideReserve,rect.height-verticalReserve,640));
  const size=Math.max(170,Math.min(base*state.zoom,rect.width-sideReserve,rect.height-4));
  timerShell.style.width=Math.floor(size)+'px';
  timerShell.style.height=Math.floor(size)+'px';
  requestAnimationFrame(fitCanvas);
}
function drawTimer(){
  const rect=timerShell.getBoundingClientRect();
  const width=rect.width,height=rect.height;
  if(!width||!height)return;
  ctx.clearRect(0,0,width,height);
  const cx=width/2,cy=height/2;
  const radius=Math.min(cx,cy)-Math.max(8,width*.018);
  const inner=radius*.67;
  const timeline=buildTimeline();
  const total=totalSeconds();
  const elapsed=clamp(getElapsed(),0,total);
  const phase=phaseAt(elapsed);

  ctx.save();
  ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);
  ctx.fillStyle='#dfe6f0';ctx.fill();
  ctx.restore();

  if(!timeline.length || total<=0){
    ctx.save();ctx.setLineDash([10,9]);ctx.lineWidth=Math.max(10,radius*.085);ctx.strokeStyle='#c7d1df';
    ctx.beginPath();ctx.arc(cx,cy,(radius+inner)/2,0,Math.PI*2);ctx.stroke();ctx.restore();return;
  }

  let angle=-Math.PI/2;
  let accumulated=0;
  timeline.forEach((segment)=>{
    const fraction=segment.durationSec/total;
    const endAngle=angle+fraction*Math.PI*2;
    const segmentEnd=accumulated+segment.durationSec;
    const isPast=elapsed>=segmentEnd;
    const isCurrent=phase&&phase.key===segment.key;
    const baseColor=segment.kind==='transition'?'#94A3B8':segment.event.color;
    const alpha=isPast?.20:(isCurrent?1:.64);

    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,radius,angle,endAngle);ctx.closePath();
    ctx.fillStyle=hexToRgba(baseColor,alpha);ctx.fill();

    if(isCurrent){
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius-3,angle+.006,endAngle-.006);
      ctx.lineWidth=Math.max(6,radius*.023);ctx.strokeStyle=hexToRgba(baseColor,.98);
      ctx.shadowColor=hexToRgba(baseColor,.58);ctx.shadowBlur=18;ctx.stroke();ctx.restore();
    }

    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius);
    ctx.lineWidth=Math.max(2,radius*.008);ctx.strokeStyle='rgba(255,255,255,.92)';ctx.stroke();

    const arcLength=(endAngle-angle)*((radius+inner)/2);
    if(arcLength>62){
      const mid=(angle+endAngle)/2,labelRadius=(radius+inner)/2;
      const x=cx+Math.cos(mid)*labelRadius,y=cy+Math.sin(mid)*labelRadius;
      ctx.save();ctx.translate(x,y);
      let rotation=mid+Math.PI/2;
      const normalized=(mid%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
      if(normalized>0&&normalized<Math.PI)rotation+=Math.PI;
      ctx.rotate(rotation);
      const fontSize=clamp(radius*.047,10,16);
      ctx.font=`800 ${fontSize}px system-ui,-apple-system,"Noto Sans KR",sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=isPast?'rgba(69,81,105,.48)':'#fff';
      ctx.shadowColor='rgba(19,28,47,.34)';ctx.shadowBlur=3;
      let label=segment.kind==='transition'?'전환':segment.event.name;
      const maxWidth=Math.max(32,arcLength-12);
      while(label.length>2&&ctx.measureText(label).width>maxWidth)label=label.slice(0,-1);
      if(segment.kind!=='transition'&&label!==segment.event.name)label=label.slice(0,-1)+'…';
      ctx.fillText(label,0,0);ctx.restore();
    }
    accumulated=segmentEnd;angle=endAngle;
  });

  if(phase&&elapsed>0&&elapsed<total){
    const progressAngle=-Math.PI/2+(elapsed/total)*Math.PI*2;
    const dotRadius=(radius+inner)/2;
    const dx=cx+Math.cos(progressAngle)*dotRadius,dy=cy+Math.sin(progressAngle)*dotRadius;
    ctx.save();ctx.beginPath();ctx.arc(dx,dy,Math.max(5,radius*.025),0,Math.PI*2);
    ctx.fillStyle='#fff';ctx.shadowColor='rgba(24,33,55,.45)';ctx.shadowBlur=8;ctx.fill();ctx.restore();
  }

  ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.lineWidth=1;ctx.strokeStyle='rgba(211,220,234,.9)';ctx.stroke();
}

let draggedEventId=null;
function renderEventList(){
  eventList.replaceChildren();
  const phase=phaseAt(clamp(getElapsed(),0,totalSeconds()));
  if(!state.events.length){
    const empty=document.createElement('div');
    empty.style.cssText='margin:auto;padding:26px 18px;text-align:center;color:#8d98aa;font-weight:750;line-height:1.65';
    empty.textContent='아직 활동이 없습니다. 아래 버튼으로 첫 활동을 추가하세요.';
    eventList.appendChild(empty);return;
  }
  state.events.forEach((event,index)=>{
    const card=document.createElement('div');
    card.className='event-card'+(phase&&phase.event?.id===event.id?' current':'');
    card.dataset.id=event.id;card.draggable=true;

    const drag=document.createElement('button');drag.type='button';drag.className='drag-handle';drag.textContent='⋮⋮';drag.title='드래그해서 순서 변경';drag.setAttribute('aria-label',event.name+' 순서 변경');

    const colorWrap=document.createElement('label');colorWrap.className='color-wrap';colorWrap.title='색상 변경';
    const preview=document.createElement('div');preview.className='color-preview';preview.style.backgroundColor=event.color;
    const color=document.createElement('input');color.type='color';color.className='color-input';color.value=event.color;color.dataset.action='color';color.setAttribute('aria-label',event.name+' 색상');
    colorWrap.append(preview,color);

    const fields=document.createElement('div');fields.className='event-fields';
    const name=document.createElement('input');name.type='text';name.className='name-input';name.value=event.name;name.maxLength=40;name.dataset.action='name';name.setAttribute('aria-label',(index+1)+'번째 활동 이름');
    const note=document.createElement('input');note.type='text';note.className='note-input';note.value=event.note||'';note.maxLength=80;note.dataset.action='note';note.placeholder='학생에게 보여줄 한 줄 안내';note.setAttribute('aria-label',event.name+' 학생 안내');
    const durationRow=document.createElement('div');durationRow.className='duration-row';
    const minutes=document.createElement('input');minutes.type='number';minutes.className='duration-input';minutes.min='0';minutes.max='360';minutes.value=String(Math.floor(event.durationSec/60));minutes.dataset.action='minutes';minutes.setAttribute('aria-label',event.name+' 분');
    const minText=document.createElement('span');minText.textContent='분';
    const seconds=document.createElement('input');seconds.type='number';seconds.className='duration-input';seconds.min='0';seconds.max='59';seconds.value=String(event.durationSec%60);seconds.dataset.action='seconds';seconds.setAttribute('aria-label',event.name+' 초');
    const secText=document.createElement('span');secText.textContent='초';
    durationRow.append(minutes,minText,seconds,secText);fields.append(name,note,durationRow);

    const actions=document.createElement('div');actions.className='card-actions';
    [['duplicate','⧉','복제'],['delete','×','삭제']].forEach(([action,text,label])=>{
      const button=document.createElement('button');button.type='button';button.className='icon-mini'+(action==='delete'?' delete':'');button.dataset.action=action;button.textContent=text;button.title=label;button.setAttribute('aria-label',event.name+' '+label);actions.appendChild(button);
    });

    const advanced=document.createElement('details');advanced.className='event-advanced';
    const summary=document.createElement('summary');summary.textContent='세부 설정 · 종료 전 알림 · 전환 시간 · 교사 메모';
    const grid=document.createElement('div');grid.className='advanced-grid';

    const warnLabel=document.createElement('label');warnLabel.textContent='종료 전 알림';
    const warn=document.createElement('select');warn.dataset.action='warning';
    [[0,'없음'],[30,'30초 전'],[60,'1분 전'],[120,'2분 전'],[180,'3분 전']].forEach(([value,label])=>{
      const opt=document.createElement('option');opt.value=String(value);opt.textContent=label;if(Number(event.warningSec)===value)opt.selected=true;warn.appendChild(opt);
    });warnLabel.appendChild(warn);

    const transitionLabel=document.createElement('label');transitionLabel.textContent=index===state.events.length-1?'전환 시간 · 마지막 활동':'다음 활동 전 전환';
    const transition=document.createElement('select');transition.dataset.action='transition';transition.disabled=index===state.events.length-1;
    [[0,'없음'],[30,'30초'],[60,'1분'],[90,'1분 30초'],[120,'2분'],[180,'3분']].forEach(([value,label])=>{
      const opt=document.createElement('option');opt.value=String(value);opt.textContent=label;if(Number(event.transitionSec)===value)opt.selected=true;transition.appendChild(opt);
    });transitionLabel.appendChild(transition);

    const memoLabel=document.createElement('label');memoLabel.className='memo-input';memoLabel.textContent='교사 메모 · 학생 화면에는 표시되지 않음';
    const memo=document.createElement('input');memo.type='text';memo.value=event.teacherNote||'';memo.maxLength=120;memo.placeholder='예: 발표 두 팀만 받고 바로 정리';memo.dataset.action='teacherNote';memoLabel.appendChild(memo);
    grid.append(warnLabel,transitionLabel,memoLabel);advanced.append(summary,grid);

    card.append(drag,colorWrap,fields,actions,advanced);
    eventList.appendChild(card);
  });
}

eventList.addEventListener('dragstart',(event)=>{
  const card=event.target.closest('.event-card');if(!card)return;
  draggedEventId=card.dataset.id;card.classList.add('dragging');
  event.dataTransfer.effectAllowed='move';
});
eventList.addEventListener('dragend',()=>{
  draggedEventId=null;eventList.querySelectorAll('.event-card').forEach(card=>card.classList.remove('dragging','drag-over'));
});
eventList.addEventListener('dragover',(event)=>{
  const card=event.target.closest('.event-card');if(!card||!draggedEventId||card.dataset.id===draggedEventId)return;
  event.preventDefault();eventList.querySelectorAll('.event-card').forEach(x=>x.classList.remove('drag-over'));card.classList.add('drag-over');
});
eventList.addEventListener('drop',(event)=>{
  const target=event.target.closest('.event-card');if(!target||!draggedEventId||target.dataset.id===draggedEventId)return;
  event.preventDefault();pauseForScheduleEdit();
  const from=state.events.findIndex(x=>x.id===draggedEventId),to=state.events.findIndex(x=>x.id===target.dataset.id);
  if(from<0||to<0)return;
  const [moved]=state.events.splice(from,1);state.events.splice(to,0,moved);
  refresh({list:true});showToast('활동 순서를 바꿨습니다.');
});

function refresh({list=false,save=true}={}){
  const total=totalSeconds();
  if(getElapsed()>total)setElapsed(total);
  updateDisplay();drawTimer();if(list)renderEventList();
  if(save){saveSettings();saveRuntime();}
}
function pauseForScheduleEdit(){
  if(!state.running)return false;
  pauseTimer(false);showToast('시간표 변경을 위해 타이머를 일시정지했습니다.');return true;
}
function findEventByCard(target){
  const card=target.closest('.event-card');
  return card?state.events.find(event=>event.id===card.dataset.id):null;
}

let audioContext=null;
function ensureAudio(){
  if(!state.soundOn)return null;
  if(!audioContext) audioContext=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume();
  return audioContext;
}
function playTone(frequency,duration=.13,type='sine',delay=0,gain=.07){
  const audio=ensureAudio();if(!audio)return;
  const start=audio.currentTime+delay;
  const oscillator=audio.createOscillator(),volume=audio.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
  volume.gain.setValueAtTime(.0001,start);volume.gain.exponentialRampToValueAtTime(gain,start+.015);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(volume);volume.connect(audio.destination);oscillator.start(start);oscillator.stop(start+duration+.03);
}
function soundStart(){playTone(440,.12,'triangle');playTone(660,.14,'triangle',.09);}
function soundPhase(){playTone(660,.14,'sine');playTone(880,.18,'sine',.12);}
function soundWarning(){playTone(880,.11,'triangle');playTone(988,.13,'triangle',.1);playTone(880,.11,'triangle',.22);}
function soundFinish(){[523,659,784,1047].forEach((f,i)=>playTone(f,.28,'triangle',i*.13,.08));}
function updateSoundButton(){btnSound.classList.toggle('active',state.soundOn);btnSound.textContent=state.soundOn?'♪':'×';btnSound.title=state.soundOn?'알림음 켜짐':'알림음 꺼짐';}

function phaseBanner(phase){
  if(!phase)return;
  if(phase.kind==='transition')showTransition('전환 시간',phase.nextEvent?`${phase.nextEvent.name} 준비`:'다음 활동을 준비하세요');
  else showTransition(phase.event.name,phase.event.note||'');
}
function startTimer(playStartSound=true){
  const total=totalSeconds();
  if(!total||getElapsed()>=total)return;
  setTeacherPhase(true);
  ensureAudio();
  state.elapsedAtStart=state.elapsed;state.runStartedAt=performance.now();state.running=true;state.finishShown=false;
  const phase=phaseAt(state.elapsed);state.lastPhaseId=phase?.key||null;state.warnedSegmentKey=null;
  if(playStartSound)soundStart();
  if(state.elapsed===0&&phase)phaseBanner(phase);
  updateDisplay();saveRuntime();cancelAnimationFrame(state.rafId);state.rafId=requestAnimationFrame(tick);
}
function pauseTimer(announce=true){
  if(state.running){state.elapsed=clamp(getElapsed(),0,totalSeconds());state.elapsedAtStart=state.elapsed;}
  state.running=false;cancelAnimationFrame(state.rafId);state.rafId=0;updateDisplay();drawTimer();saveRuntime();
  if(announce)showToast('타이머를 일시정지했습니다.');
}
function toggleTimer(){state.running?pauseTimer():startTimer();}
function tick(now){
  if(!state.running)return;
  const total=totalSeconds();
  const elapsed=getElapsed(now);
  if(elapsed>=total){finishTimer();return;}
  const phase=phaseAt(elapsed);
  if(phase&&phase.key!==state.lastPhaseId){
    state.lastPhaseId=phase.key;state.warnedSegmentKey=null;
    soundPhase();phaseBanner(phase);renderEventList();saveRuntime();
  }
  if(phase?.kind==='activity'&&phase.event.warningSec>0&&phase.remaining<=phase.event.warningSec&&state.warnedSegmentKey!==phase.key){
    state.warnedSegmentKey=phase.key;soundWarning();
    showTransition('마무리할 시간이에요',`${phase.event.name} · ${formatDurationCompact(phase.event.warningSec)} 남음`);
  }
  updateDisplay(now);drawTimer();state.rafId=requestAnimationFrame(tick);
}
function finishTimer(){
  state.elapsed=totalSeconds();state.elapsedAtStart=state.elapsed;state.running=false;cancelAnimationFrame(state.rafId);state.rafId=0;
  clearRuntime();updateDisplay();drawTimer();renderEventList();soundFinish();
  if(!state.finishShown){state.finishShown=true;$('#finishTime').textContent=formatClock(state.elapsed,false);finishBackdrop.classList.remove('hidden');$('#btnFinishClose').focus();}
}
function resetNow(){
  pauseTimer(false);setElapsed(0);state.lastPhaseId=null;state.warnedSegmentKey=null;state.finishShown=false;clearRuntime();
  finishBackdrop.classList.add('hidden');resumeBackdrop.classList.add('hidden');pendingRecovery=null;
  refresh({list:true,save:false});showToast('처음 상태로 돌아갔습니다.');
}
function requestReset(){
  if(getElapsed()<=0){resetNow();return;}
  openConfirm('처음부터 다시 시작할까요?','현재 진행 기록이 모두 지워지고 첫 활동으로 돌아갑니다.','초기화',resetNow,true);
}
function skipPhase(){
  const elapsed=getElapsed(),phase=phaseAt(elapsed);if(!phase)return;
  const wasRunning=state.running;if(wasRunning)pauseTimer(false);
  setElapsed(phase.end);
  if(state.elapsed>=totalSeconds()){finishTimer();return;}
  const next=phaseAt(state.elapsed);state.lastPhaseId=next?.key||null;state.warnedSegmentKey=null;
  soundPhase();phaseBanner(next);refresh({list:true,save:false});saveRuntime();
  if(wasRunning)startTimer(false);
}
function adjustCurrent(delta){
  const phase=phaseAt(getElapsed());if(!phase)return;
  pauseForScheduleEdit();
  if(phase.kind==='transition'){
    const minimum=Math.max(1,Math.ceil(phase.elapsedInSegment)+1);
    phase.event.transitionSec=clamp(Math.max(minimum,phase.event.transitionSec+delta),1,15*60);
  }else{
    const minimum=Math.max(MIN_DURATION,Math.ceil(phase.elapsedInSegment)+1);
    phase.event.durationSec=clamp(Math.max(minimum,phase.event.durationSec+delta),MIN_DURATION,MAX_DURATION);
  }
  refresh({list:true});
  showToast(delta>0?'현재 구간에 1분을 더했습니다.':'현재 구간을 1분 일찍 끝내도록 조정했습니다.');
}

let transitionTimer=0;
function showTransition(title,note=''){
  transitionBanner.replaceChildren();
  const strong=document.createElement('strong');strong.textContent=title;transitionBanner.appendChild(strong);
  if(note){const small=document.createElement('small');small.textContent=note;transitionBanner.appendChild(small);}
  transitionBanner.classList.add('show');clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>transitionBanner.classList.remove('show'),2200);
}
let toastTimer=0;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2100);}
let confirmAction=null;
function openConfirm(title,message,confirmText,action,danger=false){
  $('#confirmTitle').textContent=title;$('#confirmMessage').textContent=message;$('#btnConfirmOk').textContent=confirmText;$('#btnConfirmOk').classList.toggle('danger',danger);confirmAction=action;confirmBackdrop.classList.remove('hidden');$('#btnConfirmCancel').focus();
}
function closeConfirm(){confirmBackdrop.classList.add('hidden');confirmAction=null;}

function applyPreset(type){
  const presets={
    '40':[
      ['도입','오늘 배울 내용을 확인해요',5,'#3B82F6',60,0],
      ['활동 1','핵심 개념을 탐색해요',14,'#10B981',60,60],
      ['활동 2','생각을 적용하고 나눠요',13,'#F59E0B',60,60],
      ['정리','오늘 배운 내용을 돌아봐요',6,'#EF4444',60,0]
    ],
    '45':[
      ['도입','학습 문제를 확인해요',5,'#3B82F6',60,0],
      ['탐구 활동','자료를 살펴보고 생각을 만들어요',15,'#10B981',60,60],
      ['적용 활동','배운 내용을 새로운 문제에 적용해요',17,'#8B5CF6',60,60],
      ['정리','핵심 내용을 함께 정리해요',6,'#EF4444',60,0]
    ],
    'three':[
      ['도입','수업을 시작하고 학습 문제를 확인해요',5,'#3B82F6',60,0],
      ['전개','핵심 활동을 진행해요',30,'#10B981',120,0],
      ['정리','배운 내용을 돌아봐요',5,'#EF4444',60,0]
    ]
  };
  if(type==='clear'){
    openConfirm('모든 활동을 비울까요?','시간표의 모든 활동이 삭제됩니다.','모두 비우기',()=>{pauseTimer(false);state.events=[];setElapsed(0);clearRuntime();refresh({list:true});showToast('시간표를 비웠습니다.');},true);return;
  }
  const rows=presets[type];if(!rows)return;
  const label=type==='three'?'3단계 기본안':`${type}분 기본안`;
  openConfirm(`${label}을 적용할까요?`,'현재 시간표는 새 기본안으로 교체됩니다.','적용',()=>{
    pauseTimer(false);
    state.events=rows.map(([name,note,min,color,warningSec,transitionSec])=>({
      id:makeId(),name,note,teacherNote:'',durationSec:min*60,color,warningSec,transitionSec
    }));
    setElapsed(0);clearRuntime();refresh({list:true});showToast(`${label}을 적용했습니다.`);
  });
}

mainTitle.addEventListener('input',()=>{mainTitle.value=mainTitle.value.slice(0,60);saveSettings();});
btnStartPause.addEventListener('click',toggleTimer);
btnReset.addEventListener('click',requestReset);
btnSkip.addEventListener('click',skipPhase);
btnMinusMinute.addEventListener('click',()=>adjustCurrent(-60));
btnPlusMinute.addEventListener('click',()=>adjustCurrent(60));
$('#btnAddEvent').addEventListener('click',()=>{
  if(state.events.length>=MAX_EVENTS){showToast(`활동은 최대 ${MAX_EVENTS}개까지 만들 수 있습니다.`);return;}
  pauseForScheduleEdit();const index=state.events.length;state.events.push({id:makeId(),name:`새 활동 ${index+1}`,note:'',teacherNote:'',durationSec:5*60,warningSec:60,transitionSec:0,color:palette[index%palette.length]});refresh({list:true});
  requestAnimationFrame(()=>{eventList.scrollTop=eventList.scrollHeight;eventList.querySelector('.event-card:last-child .name-input')?.select();});
});

eventList.addEventListener('input',(event)=>{
  const item=findEventByCard(event.target);if(!item)return;
  const action=event.target.dataset.action;
  if(action==='name'){
    item.name=String(event.target.value).slice(0,40);drawTimer();updateDisplay();saveSettings();
  }else if(action==='note'){
    item.note=String(event.target.value).slice(0,80);updateDisplay();saveSettings();
  }else if(action==='teacherNote'){
    item.teacherNote=String(event.target.value).slice(0,120);saveSettings();
  }else if(action==='color'){
    item.color=safeColor(event.target.value);event.target.previousElementSibling.style.backgroundColor=item.color;drawTimer();updateDisplay();saveSettings();
  }
});
eventList.addEventListener('change',(event)=>{
  const item=findEventByCard(event.target);if(!item)return;
  const action=event.target.dataset.action;
  if(action==='name'){
    item.name=safeName(event.target.value,state.events.indexOf(item));
    event.target.value=item.name;updateDisplay();drawTimer();saveSettings();return;
  }
  if(action==='note'||action==='teacherNote'){saveSettings();return}
  if(action==='warning'){
    item.warningSec=clamp(Number(event.target.value)||0,0,10*60);saveSettings();state.warnedSegmentKey=null;return;
  }
  if(action==='transition'){
    pauseForScheduleEdit();item.transitionSec=clamp(Number(event.target.value)||0,0,15*60);refresh({list:true});return;
  }
  if(action!=='minutes'&&action!=='seconds')return;
  pauseForScheduleEdit();
  const card=event.target.closest('.event-card');
  const minutes=clamp(parseInt(card.querySelector('[data-action="minutes"]').value,10)||0,0,360);
  const seconds=clamp(parseInt(card.querySelector('[data-action="seconds"]').value,10)||0,0,59);
  item.durationSec=clamp(minutes*60+seconds,MIN_DURATION,MAX_DURATION);refresh({list:true});
});
eventList.addEventListener('click',(event)=>{
  const button=event.target.closest('button[data-action]');if(!button)return;
  const card=button.closest('.event-card');const index=state.events.findIndex(item=>item.id===card?.dataset.id);if(index<0)return;
  const action=button.dataset.action;
  if(action==='up'&&index>0){pauseForScheduleEdit();[state.events[index-1],state.events[index]]=[state.events[index],state.events[index-1]];refresh({list:true});}
  if(action==='down'&&index<state.events.length-1){pauseForScheduleEdit();[state.events[index+1],state.events[index]]=[state.events[index],state.events[index+1]];refresh({list:true});}
  if(action==='duplicate'){
    if(state.events.length>=MAX_EVENTS){showToast(`활동은 최대 ${MAX_EVENTS}개까지 만들 수 있습니다.`);return;}
    pauseForScheduleEdit();const source=state.events[index];state.events.splice(index+1,0,{...source,id:makeId(),name:(source.name+' 복사').slice(0,40)});refresh({list:true});
  }
  if(action==='delete'){
    const source=state.events[index];openConfirm(`‘${source.name}’ 활동을 삭제할까요?`,'삭제하면 전체 수업 시간도 함께 줄어듭니다.','삭제',()=>{pauseTimer(false);state.events.splice(index,1);setElapsed(Math.min(getElapsed(),totalSeconds()));refresh({list:true});showToast('활동을 삭제했습니다.');},true);
  }
});

function setStudentView(on){
  state.studentView=Boolean(on);
  document.body.classList.toggle('student-view',state.studentView);
  setTimeout(fitTimerSize,80);
  if(on)showToast('학생 화면입니다. Esc 또는 오른쪽 위 버튼으로 돌아올 수 있어요.');
}
function setTeacherPhase(running){
  const executing=Boolean(running);
  app.classList.toggle('v61-executing',executing);
  document.body.classList.toggle('presentation',executing);
  $('#v61TimerStep').textContent=executing?'② 실행하기':'① 준비하기';
  $('#v61TimerHeading').textContent=executing?'수업이 진행 중이에요':'오늘의 수업 시간표';
  $('#v61TimerPrepare').classList.toggle('hidden',!executing);
  $('#v61TimerStart').classList.toggle('hidden',executing);
  mainTitle.readOnly=executing;
  if(!executing){state.panelCollapsed=false;app.classList.remove('panel-collapsed');}
  requestAnimationFrame(fitTimerSize);
}
document.querySelector('.presets').addEventListener('click',(event)=>{const button=event.target.closest('[data-preset]');if(button)applyPreset(button.dataset.preset);});
$('#v61TimerStart').addEventListener('click',()=>{
  if(!totalSeconds()){showToast('시간표에 활동을 하나 이상 넣어 주세요.');return;}
  if(getElapsed()>=totalSeconds())resetNow();
  startTimer();
});
$('#v61TimerPrepare').addEventListener('click',()=>{pauseTimer(false);setTeacherPhase(false);});
$('#v61TimerStudent').addEventListener('click',()=>window.GulliverTeacherDisplay?.open());
$('#btnStudentView').addEventListener('click',()=>setStudentView(true));
$('#btnExitStudentView').addEventListener('click',()=>setStudentView(false));
btnSound.addEventListener('click',()=>{state.soundOn=!state.soundOn;updateSoundButton();if(state.soundOn){ensureAudio();soundStart();}saveSettings();});
$('#btnTogglePanel').addEventListener('click',()=>{state.panelCollapsed=!state.panelCollapsed;app.classList.toggle('panel-collapsed',state.panelCollapsed);saveSettings();setTimeout(fitTimerSize,260);});
$('#btnZoomIn').addEventListener('click',()=>{state.zoom=clamp(state.zoom+.1,.68,1.28);fitTimerSize();saveSettings();});
$('#btnZoomOut').addEventListener('click',()=>{state.zoom=clamp(state.zoom-.1,.68,1.28);fitTimerSize();saveSettings();});
$('#btnZoomReset').addEventListener('click',()=>{state.zoom=1;fitTimerSize();saveSettings();});
$('#btnFullscreen').addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();
  }catch(error){showToast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.');}
});
document.addEventListener('fullscreenchange',()=>{$('#btnFullscreen').classList.toggle('active',Boolean(document.fullscreenElement));setTimeout(fitTimerSize,80);});

$('#btnConfirmCancel').addEventListener('click',closeConfirm);
$('#btnConfirmOk').addEventListener('click',()=>{const action=confirmAction;closeConfirm();if(typeof action==='function')action();});
confirmBackdrop.addEventListener('click',(event)=>{if(event.target===confirmBackdrop)closeConfirm();});
$('#btnResumeReset').addEventListener('click',()=>{resumeBackdrop.classList.add('hidden');pendingRecovery=null;resetNow();});
$('#btnResumeContinue').addEventListener('click',()=>{
  if(!pendingRecovery){resumeBackdrop.classList.add('hidden');return}
  const recovery=pendingRecovery;pendingRecovery=null;resumeBackdrop.classList.add('hidden');
  state.elapsed=clamp(recovery.elapsed,0,totalSeconds());state.elapsedAtStart=state.elapsed;
  state.lastPhaseId=phaseAt(state.elapsed)?.key||null;state.warnedSegmentKey=null;
  refresh({list:true,save:false});
  if(recovery.running)startTimer(false);else saveRuntime();
  showToast('이전 수업 진행 지점으로 돌아왔습니다.');
});
$('#btnFinishClose').addEventListener('click',()=>{finishBackdrop.classList.add('hidden');});
$('#btnFinishReset').addEventListener('click',resetNow);

window.addEventListener('resize',fitTimerSize);
window.addEventListener('orientationchange',()=>setTimeout(fitTimerSize,180));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){saveRuntime();return}
  if(state.running){
    if(getElapsed()>=totalSeconds())finishTimer();else{updateDisplay();drawTimer();}
  }
});
window.addEventListener('beforeunload',saveRuntime);
document.addEventListener('keydown',(event)=>{
  const tag=document.activeElement?.tagName;
  const typing=tag==='INPUT'||tag==='TEXTAREA'||document.activeElement?.isContentEditable;
  if(event.key==='Escape'){
    if(state.studentView){setStudentView(false);return;}
    if(!resumeBackdrop.classList.contains('hidden')){return;}
    if(!confirmBackdrop.classList.contains('hidden')){closeConfirm();return;}
    if(!finishBackdrop.classList.contains('hidden')){finishBackdrop.classList.add('hidden');return;}
  }
  if(typing)return;
  const key=event.key.toLowerCase();
  if(event.code==='Space'){event.preventDefault();toggleTimer();}
  else if(key==='n'){skipPhase();}
  else if(key==='r'){requestReset();}
  else if(key==='f'){$('#btnFullscreen').click();}
  else if(key==='s'){if(app.classList.contains('v61-executing'))$('#v61TimerPrepare').click();else $('#btnTogglePanel').click();}
});

loadSettings();
renderEventList();
updateDisplay();
requestAnimationFrame(fitTimerSize);
Gulliver.mountShell({title:'수업 흐름 타이머',icon:'🕘',reserveSpace:false});
document.body.classList.add('with-gulliver-shell');
ClassroomWorkspace.mount({kind:'timer',title:()=>mainTitle.value,
  capture:()=>({title:mainTitle.value,events:state.events,soundOn:state.soundOn,panelCollapsed:state.panelCollapsed,zoom:state.zoom}),
  blank:()=>({title:'새 수업',events:defaultEvents()}),
  apply(data){
    if(!Array.isArray(data.events)||!data.events.length)throw Error('시간표에 활동을 하나 이상 넣어 주세요.');
    pauseTimer(false);state.events=sanitizeEvents(data.events);mainTitle.value=String(data.title||'새 수업').slice(0,60);
    state.soundOn=data.soundOn!==false;state.panelCollapsed=Boolean(data.panelCollapsed);state.zoom=clamp(Number(data.zoom)||1,.68,1.28);
    app.classList.toggle('panel-collapsed',state.panelCollapsed);updateSoundButton();resetNow();saveSettings();requestAnimationFrame(fitTimerSize);
  }
});
window.GulliverTeacherLiveSnapshot=()=>({kind:'timer',title:mainTitle.value,events:state.events.map(({name,note,durationSec,color})=>({name,note,durationSec,color}))});
window.GulliverTeacherDisplay?.register({
  kind:'timer',
  getSnapshot(){
    const total=totalSeconds(),elapsed=clamp(getElapsed(),0,total),phase=phaseAt(elapsed);
    const active=phase?.kind==='activity'?phase.event:null;
    const next=phase?.nextEvent||state.events[(phase?.index??-1)+1];
    return{
      kind:'timer',title:mainTitle.value||'오늘의 수업',
      phase:elapsed>=total&&total?'수업 종료':phase?.kind==='transition'?'전환 시간':active?.name||'수업 준비',
      note:phase?.kind==='transition'?(next?.name||'다음 활동')+' 준비':active?.note||'',
      phaseRemaining:phase?.remaining||0,totalRemaining:Math.max(0,total-elapsed),total,
      progress:total?elapsed/total*100:0,color:active?.color||'#6958dc',
      currentIndex:phase?.index??-1,
      next:next?'다음: '+next.name:'다음: 수업 마무리',
      status:elapsed>=total&&total?'종료':state.running?'진행 중':elapsed?'일시정지':'준비',
      events:state.events.map(({name,durationSec})=>({name,durationSec}))
    };
  }
});
if(!new URLSearchParams(location.search).has('activity')&&!new URLSearchParams(location.search).has('template')&&!new URLSearchParams(location.search).has('new'))checkRuntimeRecovery();
})();

try{
  if(window.Gulliver && typeof window.Gulliver.mountShell==='function'){
    window.Gulliver.mountShell({title:"수업 흐름 타이머",icon:"🕘",reserveSpace:false});
    document.body.classList.add('with-gulliver-shell');
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
}catch(error){
  console.warn('공용 도구 메뉴를 불러오지 못했지만 타이머는 계속 사용할 수 있습니다.',error);
}
