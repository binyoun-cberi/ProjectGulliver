(function bootTimeToolsUI(){
  'use strict';
  const core=window.TimeToolsCore;
  if(!core){document.body.textContent='시간 도구를 불러오지 못했어요. 페이지를 새로고침해 주세요.';return;}
  const $=id=>document.getElementById(id);
  const key='gulliver.timeTools.v1';
  const safeRead=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
  const engine=core.createEngine(core.migrate(safeRead(key),safeRead('lessonCircleTimerV3'),safeRead('classUniversalClock.v2')));
  const modeLabels={clock:'현재 시각',timer:'타이머',stopwatch:'스톱워치',lesson:'수업 흐름',learn:'시계 읽기'};
  const styleLabels={ring:'원형',digital:'디지털',analog:'아날로그',bar:'막대형',sand:'모래시계'};
  let lastRecordMode='',lastStatus='',lastRunning=false,lastMode='',lastStyle='',lastPersist=0;
  const el=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  function notice(text){$('ttNotice').textContent=text;window.setTimeout(()=>{if($('ttNotice').textContent===text)$('ttNotice').textContent='';},3500);}
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(engine.save()));}catch{notice('설정 저장에 실패했어요. 브라우저 저장 공간을 확인해 주세요.');}
  }
  function svgClock(hour,minute,second,showSecond){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 300 300');svg.setAttribute('class','tt-analog');
    svg.setAttribute('role','img');svg.setAttribute('aria-label',`${hour}시 ${minute}분`);
    const part=(tag,attrs,text)=>{const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=String(text);svg.append(n);return n;};
    part('circle',{cx:150,cy:150,r:143,fill:'#fff',stroke:'#c4d0e6','stroke-width':4});
    for(let h=1;h<=12;h++){
      const r=h*Math.PI/6;
      part('text',{x:150+116*Math.sin(r),y:157-116*Math.cos(r),'text-anchor':'middle','font-size':22,'font-weight':800,fill:'#2f415c'},h);
    }
    for(let m=0;m<60;m++){
      const theta=m*Math.PI/30;
      const r1=m%5===0?132:136;
      part('line',{x1:150+r1*Math.sin(theta),y1:150-r1*Math.cos(theta),x2:150+141*Math.sin(theta),y2:150-141*Math.cos(theta),stroke:'#92a3bf','stroke-width':m%5===0?2.3:1});
    }
    const hand=(angle,length,color,width)=>{
      const theta=angle*Math.PI/180;
      part('line',{x1:150,y1:150,x2:150+length*Math.sin(theta),y2:150-length*Math.cos(theta),stroke:color,'stroke-width':width,'stroke-linecap':'round'});
    };
    hand(((hour%12)+minute/60)*30,78,'#2c3e60',9);
    hand((minute+second/60)*6,105,'#556be9',6);
    if(showSecond)hand(second*6,113,'#e26c68',2);
    part('circle',{cx:150,cy:150,r:6,fill:'#2c3e60'});
    return svg;
  }
  function paintFace(s){
    const face=$('ttFace');face.replaceChildren();
    const label=s.phase||modeLabels[s.mode];
    const main=s.mode==='clock'?`${String(s.hour).padStart(2,'0')}:${String(s.minute).padStart(2,'0')}:${String(s.second).padStart(2,'0')}`:
      s.mode==='learn'?(s.reveal?`${String(s.hour).padStart(2,'0')}:${String(s.minute).padStart(2,'0')}`:'몇 시일까요?'):
      core.format(s.timeMs,s.mode==='stopwatch');
    const status=s.mode==='lesson'?(s.note||s.next):s.mode==='timer'?`${core.format(s.totalMs)} 중 ${core.format(s.elapsedMs)} 지남`:s.mode==='stopwatch'?'시작을 누르면 시간이 흘러요.':s.mode==='clock'?'컴퓨터의 현재 시각':s.reveal?'정답을 확인했어요.':'시침과 분침을 읽어 보세요.';
    const progress=Math.min(100,Math.max(0,Number(s.progress)||0));
    function appendStrip(){
      if(s.mode!=='lesson')return;
      const bar=el('div','tt-lesson-strip');
      for(const [i,e] of s.events.entries()){
        const item=el('span');item.style.flex=String(e.durationSec);item.style.background=e.color;
        item.style.opacity=i<s.currentIndex?'.4':'1';
        item.title=`${e.name} · ${Math.round(e.durationSec/60)}분`;
        bar.append(item);
      }
      face.append(bar);
      face.append(el('div','tt-face-sub',`다음: ${s.next}`));
    }
    if(s.style==='analog'){
      face.append(svgClock(s.hour,s.minute,s.second,s.mode==='clock'));
      face.append(el('div','tt-face-label',main));
    }else if(s.style==='ring'){
      const ring=el('div','tt-ring');
      ring.style.background=`conic-gradient(${s.color} ${progress}%,#dce3f3 ${progress}%)`;
      const inner=el('div','tt-ring-inner');
      inner.append(el('div','tt-face-label',label),el('div','tt-number',main),el('div','tt-face-sub',s.status));
      ring.append(inner);face.append(ring);
      if(s.mode==='lesson')face.append(el('div','tt-face-sub',status));
    }else if(s.style==='digital'){
      const box=el('div','tt-display-face tt-digital');
      box.append(el('div','tt-face-label',label),el('div','tt-number',main),el('div','tt-face-sub',status));
      face.append(box);
    }else if(s.style==='sand'){
      face.append(el('div','tt-face-label',label),el('div','tt-sand',progress>=100?'⌛':'⏳'),el('div','tt-number',main),el('div','tt-face-sub',status));
    }else{
      face.append(el('div','tt-face-label',label),el('div','tt-number',main));
      const track=el('div','tt-track');const fill=el('div');fill.style.width=progress+'%';fill.style.background=s.color;track.append(fill);face.append(track,el('div','tt-face-sub',status));
    }
    appendStrip();
    $('ttStart').textContent=s.running?'Ⅱ 일시정지':'▶ 시작';
  }
  function renderStyles(){
    const wrap=$('ttStyles');wrap.replaceChildren(el('span','','표시 스타일'));
    for(const style of core.styles[engine.data.mode]){
      const b=el('button','',styleLabels[style]);b.type='button';b.dataset.style=style;b.setAttribute('aria-pressed',String(engine.data.styles[engine.data.mode]===style));
      b.onclick=()=>{engine.setStyle(style);persist();renderStyles();paintFace(engine.snapshot());};
      wrap.append(b);
    }
  }
  function renderRecords(){
    const mode=engine.data.mode;const list=$('ttRecords');list.replaceChildren();
    const records=engine.listRecords();
    if(!records.length)list.append(el('li','','아직 저장한 기록이 없어요.'));
    for(const [i,r] of records.entries()){
      const li=el('li');const label=el('span','',`${i+1}. ${r.name}`),value=el('b','',core.format(r.valueMs,mode==='stopwatch'));
      li.append(label,value);list.append(li);
    }
    lastRecordMode=mode;
  }
  function renderEvents(){
    const target=$('ttEvents');target.replaceChildren();
    for(const [i,e] of engine.data.events.entries()){
      const row=el('div','tt-event');row.dataset.index=String(i);
      const top=el('div','tt-event-top');
      const color=el('input');color.type='color';color.value=e.color;color.dataset.key='color';color.title='색상';
      const name=el('input');name.type='text';name.value=e.name;name.maxLength=40;name.dataset.key='name';name.setAttribute('aria-label',`${i+1}번 활동 이름`);
      const min=el('input');min.type='number';min.min='1';min.max='360';min.value=String(Math.max(1,Math.round(e.durationSec/60)));min.dataset.key='min';min.setAttribute('aria-label',`${i+1}번 활동 분`);
      const unit=el('span','','분');
      const del=el('button','', '삭제');del.type='button';del.disabled=engine.data.events.length<=1;del.title=`${e.name} 삭제`;
      del.onclick=()=>{if(!confirm(`‘${e.name}’ 활동을 삭제할까요?`))return;engine.updateEvents(engine.data.events.filter((_,n)=>n!==i));persist();renderEvents();paintFace(engine.snapshot());};
      top.append(color,name,min,unit,del);
      const note=el('input','tt-event-note');note.type='text';note.maxLength=80;note.placeholder='활동 안내 문구';note.value=e.note;note.dataset.key='note';note.setAttribute('aria-label',`${i+1}번 활동 안내`);
      row.append(top,note);
      row.addEventListener('change',ev=>{if(ev.target===del)return;syncEventsFromForm();});
      target.append(row);
    }
    const total=engine.data.events.reduce((n,e)=>n+e.durationSec,0);
    $('ttLessonTotal').textContent=`총 ${Math.floor(total/60)}분`;
    $('ttTitle').value=engine.data.title;
  }
  function syncEventsFromForm(){
    const rows=[...$('ttEvents').querySelectorAll('.tt-event')];
    const data=rows.map((row,i)=>{
      const get=k=>row.querySelector(`[data-key="${k}"]`).value;
      return {name:get('name'),note:get('note'),durationSec:Math.round(Number(get('min'))||1)*60,color:get('color')};
    });
    engine.updateEvents(data);persist();renderEvents();render();notice('시간표가 바뀌어 처음부터 시작하도록 설정했어요.');
  }
  function syncMode(){
    const mode=engine.data.mode;
    for(const b of $('ttModes').querySelectorAll('button'))b.setAttribute('aria-selected',String(b.dataset.mode===mode));
    for(const [id,visible] of [
      ['ttTimerSettings',mode==='timer'],['ttLessonSettings',mode==='lesson'],
      ['ttLearnSettings',mode==='learn'],['ttClockSettings',mode==='clock'],
      ['ttRecordsSection',['timer','stopwatch'].includes(mode)]
    ])$(id).hidden=!visible;
    for(const id of ['ttStart','ttReset'])$(id).hidden=['clock','learn'].includes(mode);
    for(const id of ['ttPlus','ttMinus'])$(id).hidden=!['timer','lesson'].includes(mode);
    $('ttNext').hidden=mode!=='lesson';
    $('ttKeyboard').textContent=['clock','learn'].includes(mode)?'표시 스타일과 시각을 선택할 수 있어요.':'Space 시작·정지 · R 초기화'+(mode==='lesson'?' · N 다음 활동':'');
    const t=engine.data.time.timer.durationMs/1000;
    $('ttMinute').value=Math.floor(t/60);$('ttSecond').value=Math.round(t%60);
    $('ttHour').value=engine.data.learn.hour;$('ttLearnMinute').value=engine.data.learn.minute;
    $('ttSound').checked=engine.data.soundOn;
    if(mode==='lesson')renderEvents();
    if(['timer','stopwatch'].includes(mode))renderRecords();
    renderStyles();lastMode=mode;
  }
  function render(){
    const s=engine.snapshot();
    if(s.mode!==lastMode)syncMode();
    if(s.style!==lastStyle){renderStyles();lastStyle=s.style;}
    paintFace(s);
    if(lastRunning&&!s.running&&(s.mode==='timer'||s.mode==='lesson')&&s.remainingMs===0){
      if(engine.data.soundOn)beep();
      notice('시간이 끝났어요.');
    }
    lastRunning=s.running;
  }
  let audio;
  function beep(){
    try{
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      audio=audio||new C();if(audio.state==='suspended')audio.resume().catch(()=>{});
      const oscillator=audio.createOscillator(),gain=audio.createGain();
      oscillator.frequency.value=760;gain.gain.setValueAtTime(.07,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.45);
      oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.48);
    }catch{}
  }
  function changed(action){action();persist();render();}
  $('ttModes').addEventListener('click',event=>{
    const b=event.target.closest('button[data-mode]');if(!b)return;
    changed(()=>engine.switchMode(b.dataset.mode));syncMode();
  });
  $('ttStart').onclick=()=>changed(()=>engine.toggle());
  $('ttReset').onclick=()=>{if(!confirm('현재 시계를 처음부터 다시 시작할까요?'))return;changed(()=>engine.reset());};
  $('ttPlus').onclick=()=>changed(()=>engine.adjust(60000));
  $('ttMinus').onclick=()=>changed(()=>engine.adjust(-60000));
  $('ttNext').onclick=()=>changed(()=>engine.next());
  $('ttPresets').addEventListener('click',event=>{const b=event.target.closest('[data-seconds]');if(b)changed(()=>engine.setDuration(Number(b.dataset.seconds)*1000));syncMode();});
  $('ttApply').onclick=()=>{
    const sec=Math.floor(Number($('ttMinute').value))*60+Math.floor(Number($('ttSecond').value));
    if(!Number.isFinite(sec)||sec<1||sec>21600){notice('1초부터 360분까지 입력해 주세요.');return;}
    changed(()=>engine.setDuration(sec*1000));syncMode();
  };
  $('ttTitle').addEventListener('input',()=>{engine.setTitle($('ttTitle').value);persist();});
  $('ttLesson40').onclick=()=>{changed(()=>engine.updateEvents(core.defaultEvents()));renderEvents();};
  $('ttLesson45').onclick=()=>{const e=core.defaultEvents();e[2].durationSec+=300;changed(()=>engine.updateEvents(e));renderEvents();};
  $('ttAddEvent').onclick=()=>{
    if(engine.data.events.length>=30){notice('활동은 최대 30개까지 만들 수 있어요.');return;}
    const arr=engine.data.events.concat({name:`활동 ${engine.data.events.length+1}`,note:'',durationSec:300,color:'#556be9'});
    changed(()=>engine.updateEvents(arr));renderEvents();
  };
  $('ttSetHands').onclick=()=>{
    const hour=Number($('ttHour').value),minute=Number($('ttLearnMinute').value);
    if(!Number.isInteger(hour)||hour<1||hour>12||!Number.isInteger(minute)||minute<0||minute>59){notice('1~12시, 0~59분으로 설정해 주세요.');return;}
    changed(()=>engine.setLearning(hour,minute));
  };
  $('ttReveal').onclick=()=>changed(()=>engine.setReveal(!engine.data.learn.reveal));
  $('ttRandom').onclick=()=>{
    const hour=1+Math.floor(Math.random()*12),minute=Math.floor(Math.random()*12)*5;
    changed(()=>engine.setLearning(hour,minute));$('ttHour').value=hour;$('ttLearnMinute').value=minute;
  };
  $('ttRecord').onclick=()=>{
    const name=$('ttStudentName').value;
    if(!engine.record(name)){notice('이름을 적고 시계를 진행한 뒤 기록해 주세요.');return;}
    $('ttStudentName').value='';persist();renderRecords();notice('기록을 저장했어요.');
  };
  $('ttClear').onclick=()=>{
    if(!engine.listRecords().length)return;
    if(!confirm('현재 모드의 기록을 모두 비울까요?'))return;
    engine.clearRecords();persist();renderRecords();
  };
  $('ttCsv').onclick=()=>{
    const rows=engine.listRecords();if(!rows.length){notice('내보낼 기록이 없어요.');return;}
    const csvValue=value=>{
      const s=String(value??'');
      const protectedValue=/^[=+\-@\t\r]/.test(s)?'\''+s:s;
      return '"'+protectedValue.replace(/"/g,'""')+'"';
    };
    const csv=[['순위','이름','기록','저장 시각'].map(csvValue).join(',')];
    rows.forEach((r,i)=>csv.push([i+1,r.name,core.format(r.valueMs,engine.data.mode==='stopwatch'),new Date(r.createdAt).toLocaleString('ko-KR')].map(csvValue).join(',')));
    const blob=new Blob(['\ufeff',csv.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`시간기록-${engine.data.mode}.csv`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('ttSound').onchange=()=>{engine.setSound($('ttSound').checked);persist();};
  $('ttStudent').onclick=()=>{
    if(!window.GulliverTeacherDisplay?.open())notice('학생 창을 열지 못했어요. 팝업을 허용하고 다시 눌러 주세요.');
  };
  document.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.altKey||event.metaKey||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
    const key=event.key.toLowerCase();
    if(event.code==='Space'&&!['clock','learn'].includes(engine.data.mode)){event.preventDefault();changed(()=>engine.toggle());}
    if(key==='r'&&!['clock','learn'].includes(engine.data.mode)){event.preventDefault();changed(()=>engine.reset());}
    if(key==='n'&&engine.data.mode==='lesson'){event.preventDefault();changed(()=>engine.next());}
  });
  window.GulliverTeacherDisplay?.register({
    kind:'timer',windowName:'gulliver-unified-clock',
    getSnapshot(){return engine.snapshot();}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();else persist();});
  window.addEventListener('pagehide',persist);
  syncMode();render();
  window.setInterval(()=>{
    const wasRunning=engine.data.running;
    render();
    if(wasRunning&&!engine.data.running)persist();
    if(Date.now()-lastPersist>=1000){lastPersist=Date.now();persist();}
  },250);
})();
