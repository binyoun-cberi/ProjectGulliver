(()=>{
'use strict';
const C=window.GulliverMediaCore,M=window.GulliverMusicCore,$=id=>document.getElementById(id);
let model=C.makeMusic(),url='';
function notify(s,bad=false){$('msg').textContent=s;$('msg').style.color=bad?'#ac3b50':'#2d7b57';}
function rebuild(){
 model=C.validateMusic(model);
 for(const key of ['title','bpm','loops','melodyPitch'])$(key==='title'?'titleInput':key+'Input')?.setAttribute?.('data-connected','true');
 $('titleInput').value=model.title;$('bpmInput').value=model.bpm;$('loopsInput').value=model.loops;$('melodyPitch').value=model.melodyPitch;
 const grid=$('beatGrid');grid.replaceChildren();
 const label=document.createElement('span');grid.append(label);
 for(let i=0;i<C.BEATS;i++){const n=document.createElement('span');n.className='beat-head';n.textContent=String(i+1);grid.append(n)}
 for(const [track,name] of [['melody','멜로디'],['bass','베이스'],['clap','손뼉'],['hat','심벌즈']]){
  const text=document.createElement('span');text.className='track-label';text.textContent=name;grid.append(text);
  for(let i=0;i<C.BEATS;i++){
   const b=document.createElement('button');b.type='button';b.className='beat-button';b.dataset.track=track;b.dataset.step=String(i);
   b.setAttribute('aria-label',name+' '+(i+1)+'번째 박자');b.setAttribute('aria-pressed',String(model.notes[track].includes(i)));
   b.onclick=()=>{const steps=new Set(model.notes[track]);if(steps.has(i))steps.delete(i);else steps.add(i);model.notes[track]=[...steps].sort((a,b)=>a-b);b.setAttribute('aria-pressed',String(steps.has(i)));notify('박자를 변경했어요. WAV로 저장하거나 들어보세요.');};
   grid.append(b);
  }
 }
}
for(const [id,key] of [['titleInput','title'],['bpmInput','bpm'],['loopsInput','loops'],['melodyPitch','melodyPitch']]){
 $(id).addEventListener('input',e=>{const val=key==='title'?e.target.value:Number(e.target.value);model[key]=val;notify('설정을 변경했어요.');});
 $(id).addEventListener('change',()=>{model=C.validateMusic(model);rebuild()});
}
function stop(){const a=$('audioPreview');a.pause();a.currentTime=0;}
function renderAudio(){
 const bytes=M.waveform(C.validateMusic(model));
 return new Blob([bytes],{type:'audio/wav'});
}
$('playMusic').onclick=()=>{
 try{
  stop();if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(renderAudio());
  const a=$('audioPreview');a.src=url;a.play().catch(()=>notify('재생이 차단되었어요. 재생 버튼을 다시 눌러 주세요.',true));
  notify('현재 음악을 미리 듣고 있어요.');
 }catch(e){notify('음악 생성 오류: '+e.message,true)}
};
$('stopMusic').onclick=stop;
$('exportWav').onclick=()=>{
 try{
  const blob=renderAudio(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
  a.download=(model.title.replace(/[\\/:*?"<>|]/g,'_')||'우리 반 음악')+'.wav';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),20000);notify('WAV 음원을 만들었어요.');
 }catch(e){notify('저장 오류: '+e.message,true)}
};
for(const b of document.querySelectorAll('[data-template]'))b.onclick=()=>{
 model=C.validateMusic(M.presets()[b.dataset.template]);stop();rebuild();notify('선택한 음악으로 바꿨어요.');
};
window.GulliverStudioAdapter={kind:'music',capture:()=>JSON.parse(JSON.stringify(C.validateMusic(model))),
 apply:p=>{model=C.validateMusic(p);stop();rebuild()},rename:title=>{model.title=String(title).slice(0,90);rebuild()},exportAudio:renderAudio};
window.addEventListener('pagehide',()=>{stop();if(url)URL.revokeObjectURL(url)});
rebuild();
})();