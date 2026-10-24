(function bootTimeToolsCore() {
  'use strict';
  const modes = ['clock','timer','stopwatch','lesson','period','learn'];
  const styles = {
    clock:['analog','digital'], timer:['ring','digital','bar','sand'],
    stopwatch:['digital','ring','bar'], lesson:['ring','bar','digital'],
    period:['ring','digital','bar'],
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

  // Period mode follows the computer's local clock, unlike a pausable timer.
  function minutesOfDay(time) {
    if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return -1;
    return Number(time.slice(0,2))*60+Number(time.slice(3,5));
  }
  function toHHMM(minute) {
    const m=Math.floor(minute);
    return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  }
  function defaultPeriods(durationMin=40,breakMin=10,lunchMin=60) {
    const lesson=clamp(Math.round(durationMin),1,180);
    const between=clamp(Math.round(breakMin),0,60);
    const lunch=clamp(Math.round(lunchMin),0,180);
    const result=[];
    let time=9*60;
    for(let i=0;i<6;i++){
      result.push({name:`${i+1}교시`,start:toHHMM(time),durationMin:lesson});
      time+=lesson+(i===3?lunch:between);
    }
    return result;
  }
  function validatePeriods(input) {
    if(!Array.isArray(input)||input.length<1||input.length>12)
      return {ok:false,error:'교시는 1개부터 12개까지 설정할 수 있어요.'};
    const periods=[];
    for(const [i,item] of input.entries()){
      const start=minutesOfDay(item?.start);
      const duration=Number(item?.durationMin);
      if(start<0||!Number.isInteger(duration)||duration<1||duration>180||start+duration>1440)
        return {ok:false,error:`${i+1}번째 교시의 시작 시각이나 수업 시간(1~180분)을 확인해 주세요.`};
      periods.push({name:clean(item?.name,40)||`${i+1}교시`,start:item.start,durationMin:duration});
    }
    periods.sort((a,b)=>minutesOfDay(a.start)-minutesOfDay(b.start));
    for(let i=1;i<periods.length;i++)
      if(minutesOfDay(periods[i].start)<minutesOfDay(periods[i-1].start)+periods[i-1].durationMin)
        return {ok:false,error:'교시 시간이 서로 겹쳐요. 시작 시각과 수업 길이를 조정해 주세요.'};
    return {ok:true,periods};
  }
  function periodAt(input,epoch=Date.now()) {
    const checked=validatePeriods(input);
    const periods=checked.ok?checked.periods:defaultPeriods();
    const date=new Date(epoch);
    const t=(date.getHours()*3600+date.getMinutes()*60+date.getSeconds())*1000+date.getMilliseconds();
    const start=p=>minutesOfDay(p.start)*60000;
    const end=p=>start(p)+p.durationMin*60000;
    const result=(status,phase,note,next,remainingMs,totalMs,index,color)=>{
      const remaining=Math.max(0,remainingMs),total=Math.max(0,totalMs);
      return {
        status,phase,note,next,remainingMs:remaining,totalMs:total,
        progress:total?Math.min(100,Math.max(0,(total-remaining)/total*100)):(status==='after'?100:0),
        index,color
      };
    };
    const first=periods[0];
    if(t<start(first))return result('before','수업 시작 전',`${first.name} 시작까지`,first.name,start(first)-t,0,-1,'#687caa');
    for(const [i,p] of periods.entries()){
      const from=start(p),to=end(p),next=periods[i+1];
      if(t<from){
        const previous=periods[i-1],gapStart=end(previous),gap=from-gapStart;
        const lunch=gap>=30*60000;
        return result(lunch?'lunch':'break',lunch?'점심시간':'쉬는 시간',
          `${p.name} 시작까지`,p.name,from-t,gap,i-1,lunch?'#dc9239':'#199b83');
      }
      if(t<to)return result('class',p.name,`${p.start} 시작 · ${toHHMM(to/60000)} 종료`,
        next?.name||'오늘 수업 마무리',to-t,to-from,i,'#556be9');
    }
    return result('after','오늘 수업 종료','오늘 교시를 모두 마쳤어요.','내일 수업',0,0,periods.length-1,'#7785a2');
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
    const byMode={clock:'analog',timer:'ring',stopwatch:'digital',lesson:'ring',period:'ring',learn:'analog'};
    for(const key of modes) if(styles[key].includes(a.styles?.[key]))byMode[key]=a.styles[key];
    const time=a.time && typeof a.time==='object'?a.time:{};
    const timerDuration=Math.round(clamp(time.timer?.durationMs??300000,1000,21600000));
    const schedule=sanitizeEvents(a.events);
    const total=schedule.reduce((s,e)=>s+e.durationSec*1000,0);
    return {
      version:1,mode,styles:byMode,soundOn:a.soundOn!==false,
      title:clean(a.title,60)||'오늘의 수업',events:schedule,
      periods:validatePeriods(a.periods).ok?validatePeriods(a.periods).periods:defaultPeriods(),
      time:{
        timer:{durationMs:timerDuration,elapsedMs:Math.round(clamp(time.timer?.elapsedMs,0,timerDuration))},
        stopwatch:{elapsedMs:Math.round(clamp(time.stopwatch?.elapsedMs,0,86400000))},
        lesson:{elapsedMs:Math.round(clamp(time.lesson?.elapsedMs,0,total))}
      },
      learn:{hour:Math.round(clamp(a.learn?.hour??3,1,12)),minute:Math.round(clamp(a.learn?.minute??30,0,59)),reveal:!!a.learn?.reveal},
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
      const wasRunning=state.running;
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
      if(wasRunning && elapsed(state.mode)<duration(state.mode))start();
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
      const spent=elapsed(state.mode);
      if(spent<=0 || (state.mode==='timer' && spent>=duration('timer')))return false;
      // Countdown records represent remaining time; stopwatch records represent elapsed time.
      // This preserves the ranking semantics of classUniversalClock.v2.
      const valueMs=state.mode==='timer'?duration('timer')-spent:spent;
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
      const period=mode==='period'?periodAt(state.periods,now()):null;
      const remaining=Math.max(0,total-used);
      const current=new Date(now());
      const hour=mode==='learn'?state.learn.hour:current.getHours();
      const minute=mode==='learn'?state.learn.minute:current.getMinutes();
      return {
        kind:'timer',unified:true,mode,style:state.styles[mode],
        title:state.title,running:state.running,
        status:period?({before:'시작 전',class:'수업 중',break:'쉬는 시간',lunch:'점심시간',after:'종료'})[period.status]:state.running?'진행 중':(mode==='timer'||mode==='lesson')&&remaining===0?'종료':used?'일시정지':'준비',
        timeMs:period?period.remainingMs:mode==='timer'?remaining:mode==='lesson'?phase.remainingMs:mode==='stopwatch'?used:0,
        elapsedMs:period?period.totalMs-period.remainingMs:used,totalMs:period?period.totalMs:total,remainingMs:period?period.remainingMs:remaining,
        progress:period?period.progress:mode==='timer'||mode==='lesson'?used/Math.max(1,total)*100:mode==='stopwatch'?used%60000/600:0,
        phase:period?.phase||phase?.name||({clock:'현재 시각',timer:'남은 시간',stopwatch:'진행 시간',learn:'시계 읽기'})[mode],
        note:period?.note||phase?.note||'',next:period?.next||phase?.next||'',
        currentIndex:period?.index??phase?.index??-1,events:state.events.map(({name,durationSec,color})=>({name,durationSec,color})),
        periodStatus:period?.status||null,periods:period?state.periods.map(p=>({name:p.name,start:p.start,durationMin:p.durationMin})):[],
        color:period?.color||phase?.color||'#556be9',hour,minute,second:current.getSeconds(),
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
      setPeriods(input){
        const result=validatePeriods(input);
        if(!result.ok)return result;
        state.periods=result.periods;
        return {ok:true};
      },
      get data(){return state;},
      listRecords(mode=state.mode){return (state.records[mode]||[]).slice().sort((a,b)=>
        (mode==='timer' ? b.valueMs-a.valueMs : a.valueMs-b.valueMs) || a.createdAt-b.createdAt);}
    };
  }
  const api=Object.freeze({modes,styles,defaultEvents,defaultPeriods,validatePeriods,periodAt,sanitizeEvents,normalize,migrate,format,lessonAt,createEngine});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.TimeToolsCore=api;
})();
