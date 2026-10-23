(function bootTimeToolsCore() {
  'use strict';
  const modes = ['clock','timer','stopwatch','lesson','learn'];
  const styles = {
    clock:['analog','digital'], timer:['ring','digital','bar','sand'],
    stopwatch:['digital','ring','bar'], lesson:['ring','bar','digital'],
    learn:['analog','digital']
  };
  const palette = ['#556be9','#1b9d80','#e9a23b','#e26c68','#8868ce','#20a7bd'];
  const defaultEvents = () => [
    {name:'도입',note:'오늘 배울 내용을 살펴봐요',durationSec:300,color:palette[0]},
    {name:'활동 1',note:'함께 생각하고 활동해요',durationSec:900,color:palette[1]},
    {name:'활동 2',note:'배운 내용을 적용해요',durationSec:900,color:palette[2]},
    {name:'정리',note:'오늘 배운 내용을 돌아봐요',durationSec:300,color:palette[3]}
  ];
  const finite = (v,d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const clamp = (v,min,max) => Math.max(min,Math.min(max,finite(v,min)));
  const clean = (v,max=40) => String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
  const safeColor = (v,i=0) => /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : palette[i%palette.length];
  function sanitizeEvents(raw) {
    if (!Array.isArray(raw) || !raw.length) return defaultEvents();
    return raw.slice(0,30).map((e,i)=>({
      name:clean(e?.name,40)||`활동 ${i+1}`,
      note:clean(e?.note,80),
      durationSec:Math.round(clamp(e?.durationSec??finite(e?.duration,5)*60,10,21600)),
      color:safeColor(e?.color,i)
    }));
  }
  function records(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.slice(-200).map((item,i)=>({
      id:clean(item?.id,60)||`legacy-${i}`,
      name:clean(item?.name,25)||'이름 없음',
      valueMs:Math.round(clamp(item?.valueMs??item?.value,0,86400000)),
      createdAt:Math.round(clamp(item?.createdAt,0,9999999999999))
    }));
  }
  function normalize(raw) {
    const a = raw && typeof raw === 'object' ? raw : {};
    const mode=modes.includes(a.mode)?a.mode:'timer';
    const byMode={clock:'analog',timer:'ring',stopwatch:'digital',lesson:'ring',learn:'analog'};
    for(const key of modes) if(styles[key].includes(a.styles?.[key]))byMode[key]=a.styles[key];
    const time=a.time && typeof a.time==='object'?a.time:{};
    const timerDuration=Math.round(clamp(time.timer?.durationMs,1000,21600000));
    const schedule=sanitizeEvents(a.events);
    const total=schedule.reduce((s,e)=>s+e.durationSec*1000,0);
    return {
      version:1,mode,styles:byMode,soundOn:a.soundOn!==false,
      title:clean(a.title,60)||'오늘의 수업',events:schedule,
      time:{
        timer:{durationMs:timerDuration,elapsedMs:Math.round(clamp(time.timer?.elapsedMs,0,timerDuration))},
        stopwatch:{elapsedMs:Math.round(clamp(time.stopwatch?.elapsedMs,0,86400000))},
        lesson:{elapsedMs:Math.round(clamp(time.lesson?.elapsedMs,0,total))}
      },
      learn:{hour:Math.round(clamp(a.learn?.hour,1,12)),minute:Math.round(clamp(a.learn?.minute,0,59)),reveal:!!a.learn?.reveal},
      records:{timer:records(a.records?.timer),stopwatch:records(a.records?.stopwatch)},
      running:!!a.running && ['timer','stopwatch','lesson'].includes(mode),
      startedAt:Math.round(clamp(a.startedAt,0,9999999999999))
    };
  }
  function migrate(saved,circle,universal) {
    if(saved&&typeof saved==='object')return normalize(saved);
    const initial={};
    if(circle && typeof circle==='object') {
      initial.events=circle.events;
      initial.title=circle.title;
      initial.soundOn=circle.soundOn;
    }
    if(universal && typeof universal==='object') {
      initial.records={
        stopwatch:universal.stopwatch?.records,
        timer:universal.timer?.records
      };
      initial.time={
        timer:{
          durationMs:universal.timer?.duration??300000,
          elapsedMs:Math.max(0,finite(universal.timer?.duration,300000)-finite(universal.timer?.remaining,300000))
        },
        stopwatch:{elapsedMs:universal.stopwatch?.elapsed??0},
        lesson:{elapsedMs:0}
      };
    }
    return normalize(initial);
  }
  function format(ms,centiseconds=false) {
    const value=Math.max(0,finite(ms));
    const seconds=centiseconds?Math.floor(value/1000):Math.ceil(value/1000);
    const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
    const out= h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return centiseconds?`${out}.${String(Math.floor(value%1000/10)).padStart(2,'0')}`:out;
  }
  function lessonAt(events,elapsedMs) {
    let start=0;
    const total=events.reduce((s,e)=>s+e.durationSec*1000,0);
    const elapsed=clamp(elapsedMs,0,total);
    for(let i=0;i<events.length;i++){
      const end=start+events[i].durationSec*1000;
      if(elapsed<end)return {index:i,name:events[i].name,note:events[i].note,color:events[i].color,remainingMs:end-elapsed,startMs:start,endMs:end,next:events[i+1]?.name||'마무리'};
      start=end;
    }
    return {index:events.length-1,name:'수업 종료',note:'모든 활동을 마쳤어요',color:events.at(-1)?.color||palette[0],remainingMs:0,startMs:total,endMs:total,next:'마무리'};
  }
  function createEngine(initial,clock=()=>Date.now()) {
    let state=normalize(initial);
    const now=()=>Math.max(0,finite(clock(),Date.now()));
    if(state.running && !state.startedAt)state.startedAt=now();
    const duration=mode=>mode==='timer'?state.time.timer.durationMs:mode==='lesson'?state.events.reduce((n,e)=>n+e.durationSec*1000,0):86400000;
    function elapsed(mode=state.mode){
      const entry=state.time[mode];
      if(!entry)return 0;
      const running=state.running&&state.mode===mode;
      const raw=entry.elapsedMs+(running?Math.max(0,now()-state.startedAt):0);
      return clamp(raw,0,duration(mode));
    }
    function settle(){
      if(!state.running)return false;
      const mode=state.mode;
      const old=state.time[mode].elapsedMs;
      const value=elapsed(mode);
      const finished=(mode==='timer'||mode==='lesson')&&value>=duration(mode);
      if(finished){
        state.time[mode].elapsedMs=value;
        state.running=false;state.startedAt=0;
      }
      return finished&&old<duration(mode);
    }
    function pause(){
      if(!state.running)return;
      state.time[state.mode].elapsedMs=elapsed();
      state.running=false;state.startedAt=0;
    }
    function start(){
      if(!state.time[state.mode])return false;
      if(state.running)return true;
      if(elapsed()>=duration(state.mode))state.time[state.mode].elapsedMs=0;
      state.running=true;state.startedAt=now();
      return true;
    }
    function reset(){pause();if(state.time[state.mode])state.time[state.mode].elapsedMs=0;}
    function switchMode(mode){
      if(!modes.includes(mode))return false;
      pause();state.mode=mode;return true;
    }
    function setStyle(style){
      if(!styles[state.mode].includes(style))return false;
      state.styles[state.mode]=style;return true;
    }
    function setDuration(ms){
      pause();state.time.timer.durationMs=Math.round(clamp(ms,1000,21600000));
      state.time.timer.elapsedMs=0;
    }
    function adjust(ms){
      if(state.mode!=='timer'&&state.mode!=='lesson')return;
      pause();
      if(state.mode==='timer'){
        const remaining=Math.max(0,duration('timer')-elapsed('timer'));
        const next=Math.round(clamp(remaining+ms,1000,21600000));
        state.time.timer.durationMs=Math.round(clamp(state.time.timer.elapsedMs+next,1000,21600000));
      } else {
        const pos=lessonAt(state.events,elapsed('lesson'));
        state.events[pos.index].durationSec=Math.round(clamp(state.events[pos.index].durationSec+ms/1000,10,21600));
        state.time.lesson.elapsedMs=clamp(state.time.lesson.elapsedMs,0,duration('lesson'));
      }
    }
    function next(){
      if(state.mode!=='lesson')return;
      const wasRunning=state.running;pause();
      const pos=lessonAt(state.events,elapsed('lesson'));
      state.time.lesson.elapsedMs=pos.endMs;
      if(wasRunning && state.time.lesson.elapsedMs<duration('lesson'))start();
    }
    function updateEvents(input){
      pause();state.events=sanitizeEvents(input);state.time.lesson.elapsedMs=0;
    }
    function record(name){
      if(!['timer','stopwatch'].includes(state.mode))return false;
      const label=clean(name,25);
      if(!label)return false;
      const valueMs=state.mode==='timer'?elapsed('timer'):elapsed('stopwatch');
      if(valueMs<=0)return false;
      const list=state.records[state.mode];
      list.push({id:`r-${now()}-${list.length}`,name:label,valueMs:Math.round(valueMs),createdAt:now()});
      if(list.length>200)list.shift();
      return true;
    }
    function clearRecords(){if(state.records[state.mode])state.records[state.mode]=[];}
    function snapshot(){
      settle();
      const mode=state.mode;
      const total=duration(mode);
      const used=elapsed(mode);
      const phase=mode==='lesson'?lessonAt(state.events,used):null;
      const remaining=Math.max(0,total-used);
      const current=new Date(now());
      const hour=mode==='learn'?state.learn.hour:current.getHours();
      const minute=mode==='learn'?state.learn.minute:current.getMinutes();
      return {
        kind:'timer',unified:true,mode,style:state.styles[mode],
        title:state.title,running:state.running,
        status:state.running?'진행 중':(mode==='timer'||mode==='lesson')&&remaining===0?'종료':used?'일시정지':'준비',
        timeMs:mode==='timer'?remaining:mode==='lesson'?phase.remainingMs:mode==='stopwatch'?used:0,
        elapsedMs:used,totalMs:total,remainingMs:remaining,
        progress:mode==='timer'||mode==='lesson'?used/Math.max(1,total)*100:mode==='stopwatch'?used%60000/600:0,
        phase:phase?.name||({clock:'현재 시각',timer:'남은 시간',stopwatch:'진행 시간',learn:'시계 읽기'})[mode],
        note:phase?.note||'',next:phase?.next||'',
        currentIndex:phase?.index??-1,events:state.events.map(({name,durationSec,color})=>({name,durationSec,color})),
        color:phase?.color||'#556be9',hour,minute,second:current.getSeconds(),
        reveal:mode==='learn'&&state.learn.reveal
      };
    }
    function save(){
      settle();
      const data=JSON.parse(JSON.stringify(state));
      if(data.running) {
        data.time[data.mode].elapsedMs=elapsed();
        data.startedAt=now();
      }
      return data;
    }
    return {snapshot,save,elapsed,settle,pause,start,reset,switchMode,setStyle,setDuration,adjust,next,updateEvents,record,clearRecords,
      toggle(){if(state.running)pause();else start();},
      setTitle(v){state.title=clean(v,60)||'오늘의 수업';},
      setSound(v){state.soundOn=!!v;},
      setLearning(hour,minute){state.learn={hour:Math.round(clamp(hour,1,12)),minute:Math.round(clamp(minute,0,59)),reveal:false};},
      setReveal(v){state.learn.reveal=!!v;},
      get data(){return state;},
      listRecords(mode=state.mode){return (state.records[mode]||[]).slice().sort((a,b)=>a.valueMs-b.valueMs);}
    };
  }
  const api=Object.freeze({modes,styles,defaultEvents,sanitizeEvents,normalize,migrate,format,lessonAt,createEngine});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.TimeToolsCore=api;
})();
