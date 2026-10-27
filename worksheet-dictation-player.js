(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetDictationPlayer=api;})(globalThis,()=>{
'use strict';
// One utterance at a time. Waits begin only after its real end event.
function create({synth,Utterance,setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now,onChange=()=>{}}){
 let items=[],settings={repeats:3,repeatGap:10,nextGap:20,rate:.85,voice:null,language:'ko-KR'},state='idle',index=0,round=0,phase='',timer=null,watchdog=null,token=0,deadline=0,remaining=0,error='',current=null;
 function snapshot(){return {state,index,round,total:items.length,repeats:settings.repeats,phase,remaining:Math.max(0,Math.ceil((state==='waiting'?deadline-now():remaining)/1000)),error};}
 function emit(){onChange(snapshot());}
 function clear(){token++;clearTimer(timer);clearTimer(watchdog);timer=watchdog=null;current=null;synth?.cancel();}
 function fail(message){clear();state='error';error=message;emit();}
 function speak(){
  clear();state='speaking';phase='';remaining=0;error='';const ticket=token;
  if(!synth||!Utterance){fail('이 브라우저에서는 음성 읽기를 사용할 수 없어요. 다른 브라우저에서 열어 주세요.');return;}
  const english=/^en(?:-|$)/i.test(settings.language),number=english?`Number ${index+1}. `:`${index+1}번. `;
  const u=new Utterance((round===0?number:'')+items[index].text);current=u;u.lang=settings.language;u.rate=settings.rate;if(settings.voice)u.voice=settings.voice;
  u.onend=()=>{if(ticket!==token||state!=='speaking')return;clearTimer(watchdog);watchdog=null;current=null;round++;
   if(round<settings.repeats)wait('repeat',settings.repeatGap*1000);
   else if(index<items.length-1)wait('next',settings.nextGap*1000);
   else{state='complete';phase='';emit();}
  };
  u.onerror=()=>{if(ticket===token&&state==='speaking')fail('음성을 읽지 못했어요. 선택한 언어의 음성과 기기 소리를 확인한 뒤 다시 시작해 주세요.');};
  watchdog=setTimer(()=>{if(ticket===token)fail('음성 응답이 늦어 멈췄어요. 기기 소리와 음성을 확인한 뒤 다시 시작해 주세요.');},45000);
  emit();try{synth.resume?.();synth.speak(u);}catch{fail('음성을 시작하지 못했어요. 다시 시작을 눌러 주세요.');}
 }
 function wait(next,ms){phase=next;state='waiting';remaining=ms;deadline=now()+ms;const ticket=token;
  function tick(){if(ticket!==token||state!=='waiting')return;remaining=Math.max(0,deadline-now());if(!remaining){if(phase==='next'){index++;round=0;}speak();return;}emit();timer=setTimer(tick,Math.min(250,remaining));}tick();
 }
 function pause(){if(!['speaking','waiting'].includes(state))return;const was=state;if(was==='waiting')remaining=Math.max(0,deadline-now());clear();state='paused';phase=was==='waiting'?phase:'speech';emit();}
 return {
  snapshot,
  load(rows,options={}){if(!Array.isArray(rows)||!rows.length||rows.some(q=>!q.text))throw Error('읽을 문장을 확인해 주세요.');clear();items=rows.map(q=>({...q}));settings={...settings,...options};
   if(!(Number.isInteger(settings.repeats)&&settings.repeats>=1&&settings.repeats<=5)||![settings.repeatGap,settings.nextGap].every(n=>Number.isFinite(n)&&n>=0&&n<=300)||!Number.isFinite(settings.rate)||settings.rate<.5||settings.rate>1.2)throw Error('읽기 설정을 확인해 주세요.');
   state='idle';index=round=0;phase='';remaining=0;error='';emit();},
  start(){if(!items.length||['speaking','waiting'].includes(state))return;if(state==='paused'){if(phase==='speech')speak();else wait(phase,remaining);return;}if(state==='complete'){index=round=0;}speak();},
  pause,
  stop(){clear();state='idle';index=round=0;phase='';remaining=0;error='';emit();},
  jump(next){if(!items.length)return;const active=['speaking','waiting'].includes(state);clear();index=Math.max(0,Math.min(items.length-1,next));round=0;remaining=0;error='';phase='';state='idle';if(active)speak();else emit();},
  repeat(){if(!items.length)return;clear();round=0;speak();}
 };
}
return {create};
});
