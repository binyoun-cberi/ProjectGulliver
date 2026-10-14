(()=>{
'use strict';
const C=window.GulliverUnifiedCore,S=window.GulliverStudioStorage,M=window.GulliverMediaCore,$=id=>document.getElementById(id);
if(!C||!S||!M)throw Error('타임라인 또는 로컬 오디오 저장소를 불러오지 못했어요.');
function create({getModel,getSelected,edit,showPage,notice,stage}){
 let seconds=0,playing=false,preview=false,raf=0,origin=0,blobUrl='',audio=null,loadedId='',disposed=false;
 const get=()=>getModel(),selectedElement=()=>get().pages[get().active]?.elements.find(e=>e.id===getSelected());
 const absoluteStart=index=>get().pages.slice(0,index).reduce((t,p)=>t+p.duration,0);
 const total=()=>C.totalDuration(get());
 const textTime=t=>{const n=Math.max(0,Math.floor(t));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
 function cleanMedia(){audio?.pause();if(audio){audio.src='';audio.load?.()}audio=null;loadedId='';if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=''}
 async function prepareAudio(){
  const bg=get().audio;if(!bg?.mediaId){cleanMedia();return null}
  if(loadedId===bg.mediaId&&audio)return audio;
  cleanMedia();
  const entry=await S.getMedia(bg.mediaId);
  if(!entry||entry.mime!=='audio/wav'||!M.audioAllowed(entry.blob))throw Error('배경음악 원본을 찾지 못했어요. WAV를 다시 선택해 주세요.');
  loadedId=bg.mediaId;blobUrl=URL.createObjectURL(entry.blob);
  audio=new Audio(blobUrl);audio.preload='auto';audio.loop=bg.loop;audio.volume=bg.volume;
  return audio;
 }
 function clearPreview(){
  stage.classList.remove('playing');
  stage.style.opacity='1';stage.style.translate='0px 0px';
  for(const node of stage.querySelectorAll('.item')){
   const spec=get().pages[get().active].elements.find(e=>e.id===node.dataset.id);
   node.style.opacity=String(spec?.opacity??1);node.style.translate='0px 0px';node.style.scale='1';
  }
 }
 function paint(t){
  preview=true;
  const m=get(),position=C.locateTime(m,t);
  if(m.active!==position.index)showPage(position.index);
  const page=m.pages[position.index],transition=C.transitionFrame(page,position.local);
  stage.style.opacity=String(transition.opacity);stage.style.translate=transition.slide+'px 0';
  for(const el of stage.querySelectorAll('.item')){
   const spec=page.elements.find(e=>e.id===el.dataset.id);if(!spec)continue;
   const result=C.animationFrame(spec,position.local);
   el.style.opacity=String(spec.opacity*result.opacity);
   el.style.translate=result.x+'px '+result.y+'px';el.style.scale=String(result.scale);
  }
  $('timelineProgress').value=String(Math.min(position.total,t));$('timelineProgress').max=String(Math.max(1,position.total));
  $('timelineClock').textContent=textTime(t)+' / '+textTime(position.total);
  for(const btn of $('sceneTrack').querySelectorAll('button[data-scene]')){
   btn.dataset.active=String(Number(btn.dataset.scene)===position.index);
  }
 }
 function syncPlayback(){
  $('timelinePlay').textContent=playing?'⏸ 일시정지':'▶ 재생';
  $('timelineStop').disabled=!playing&&seconds===0;
 }
 function tick(now){
  if(!playing)return;
  seconds=Math.min(total(),(now-origin)/1000);
  paint(seconds);
  if(seconds>=total()){stop(false);notice('마지막 장면까지 재생했어요.');return}
  raf=requestAnimationFrame(tick);
 }
 function pause(){
  if(!playing)return;
  playing=false;cancelAnimationFrame(raf);audio?.pause();
  syncPlayback();
 }
 function halt(){pause();seconds=absoluteStart(get().active);preview=false;clearPreview();syncPlayback()}
 function syncToActive(){seconds=absoluteStart(get().active);preview=false;clearPreview()}
 function stop(reset=true){
  pause();if(reset){seconds=0;preview=false}
  if(audio){audio.pause();try{audio.currentTime=0}catch(e){}}
  if(reset&&get().active!==0)showPage(0);
  if(preview)paint(seconds);else clearPreview();
  syncPlayback();
  $('timelineProgress').value=String(seconds);
  $('timelineClock').textContent=textTime(seconds)+' / '+textTime(total());
 }
 function seek(t){
  const wasPlaying=playing;
  if(wasPlaying)pause();
  seconds=Math.min(total(),Math.max(0,Number(t)||0));
  paint(seconds);
  if(audio){try{audio.currentTime=seconds}catch(e){}}
  if(wasPlaying)play();
  else syncPlayback();
 }
 function play(){
  if(playing)return;
  if(seconds>=total())seconds=0;
  playing=true;preview=true;stage.classList.add('playing');origin=performance.now()-seconds*1000;
  syncPlayback();raf=requestAnimationFrame(tick);
  // Audio is user-gesture-initiated; visual playback works when autoplay is restricted.
  prepareAudio().then(entry=>{
   if(!entry||!playing)return;
   entry.loop=get().audio.loop;entry.volume=get().audio.volume;
   try{entry.currentTime=seconds}catch(e){}
   return entry.play().catch(()=>notice('장면은 재생 중이에요. 브라우저가 음악 자동 재생을 제한했어요. 다시 재생을 눌러 보세요.',true));
  }).catch(e=>notice('음악을 불러오지 못했어요: '+(e.message||e),true));
 }
 function renderTrack(){
  const root=$('sceneTrack');root.replaceChildren();
  let offset=0;for(const [index,p] of get().pages.entries()){
   const start=offset;offset+=p.duration;
   const b=document.createElement('button');b.type='button';b.className='scene-part';
   b.dataset.scene=String(index);b.dataset.active=String(index===get().active);b.style.flexGrow=String(p.duration);
   b.textContent=(index+1)+'. '+p.name+' · '+p.duration+'초';
   b.title=(index+1)+'번째 장면 '+p.duration+'초부터 재생 위치 이동';
   b.addEventListener('click',()=>seek(start));root.append(b);
  }
 }
 function refresh(){
  if(disposed)return;
  renderTrack();
  const p=get().pages[get().active],selected=selectedElement();
  if(document.activeElement!==$('sceneDuration'))$('sceneDuration').value=p.duration;
  if(document.activeElement!==$('sceneTransition'))$('sceneTransition').value=p.transition;
  if(document.activeElement!==$('elementAnimation'))$('elementAnimation').value=selected?.animation||'none';
  if(document.activeElement!==$('elementDelay'))$('elementDelay').value=selected?.delay||0;
  $('elementAnimation').disabled=!selected;$('elementDelay').disabled=!selected;
  const sound=get().audio;
  $('timelineMusicName').textContent=sound?sound.name+' (로컬 WAV)':'배경음악 없음';
  $('audioVolume').value=sound?.volume??.7;$('audioLoop').checked=sound?.loop!==false;
  $('audioVolume').disabled=!sound;$('audioLoop').disabled=!sound;$('removeAudio').disabled=!sound;
  seconds=Math.min(seconds,total());
  if(preview)paint(seconds);
  else{
   clearPreview();$('timelineProgress').max=String(Math.max(1,total()));
   $('timelineProgress').value=String(seconds);
   $('timelineClock').textContent=textTime(seconds)+' / '+textTime(total());
   for(const b of $('sceneTrack').querySelectorAll('button[data-scene]'))b.dataset.active=String(Number(b.dataset.scene)===get().active);
  }
  syncPlayback();
 }
 async function refreshSoundShelf(){
  const files=(await S.media()).filter(row=>row.mime==='audio/wav'&&M.audioAllowed(row.blob));
  const select=$('audioFromShelf');const previous=select.value;
  select.replaceChildren(new Option('저장된 WAV 선택',''));
  for(const item of files)select.append(new Option(item.name+' · '+(item.blob.size/1024/1024).toFixed(1)+'MB',item.id));
  if(files.some(item=>item.id===previous))select.value=previous;
  else if(get().audio&&files.some(item=>item.id===get().audio.mediaId))select.value=get().audio.mediaId;
 }
 function updateAudio(entry){
  halt();cleanMedia();
  edit(()=>{get().audio=entry?{mediaId:entry.id,mime:'audio/wav',name:entry.name,volume:.7,loop:true}:null});
  refresh();notice(entry?'배경음악을 연결했어요. 재생을 눌러 확인해 주세요.':'배경음악을 제거했어요.');
 }
 async function importWav(file){
  if(!file)return;
  if(file.type!=='audio/wav'&&file.type!=='audio/wave'&&file.type!=='audio/x-wav')throw Error('WAV 파일만 사용할 수 있어요.');
  if(!M.audioAllowed(file))throw Error('배경음악은 15MB 이하의 WAV 파일이어야 해요.');
  const magic=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(String.fromCharCode(...magic.slice(0,4))!=='RIFF'||String.fromCharCode(...magic.slice(8,12))!=='WAVE')
   throw Error('WAV 파일 형식이 올바르지 않아요.');
  if((await S.media()).length>=M.MEDIA_COUNT)throw Error('미디어 보관함 최대 18개예요. 사용하지 않는 파일을 정리해 주세요.');
  const row={id:C.id(),name:file.name.slice(0,90)||'수업 음악.wav',mime:'audio/wav',
   blob:new Blob([file],{type:'audio/wav'}),createdAt:Date.now()};
  await S.saveMedia(row);
  updateAudio(row);await refreshSoundShelf();
 }
 function changed(target,fn){
  $(target).addEventListener('change',event=>{halt();fn(event);refresh()});
 }
 function onSceneDuration(){
  const duration=Number($('sceneDuration').value);
  if(!Number.isFinite(duration)||duration<1||duration>20)return notice('장면 길이는 1~20초 사이로 입력해 주세요.',true);
  edit(()=>{get().pages[get().active].duration=Math.round(duration*10)/10});refresh();
 }
 changed('sceneDuration',onSceneDuration);
 changed('sceneTransition',()=>{const v=$('sceneTransition').value;edit(()=>{get().pages[get().active].transition=v})});
 changed('elementAnimation',()=>{const v=$('elementAnimation').value;edit(()=>{selectedElement().animation=v})});
 changed('elementDelay',()=>{
  const value=Number($('elementDelay').value);
  if(!Number.isFinite(value)||value<0||value>20)return notice('등장 지연은 0~20초 사이로 입력해 주세요.',true);
  edit(()=>{selectedElement().delay=Math.round(value*10)/10});
 });
 $('timelinePlay').addEventListener('click',()=>{if(playing)pause();else play()});
 $('timelineStop').addEventListener('click',()=>stop());
 $('timelineProgress').addEventListener('input',event=>seek(event.target.value));
 $('audioUpload').addEventListener('change',event=>{
  const file=event.target.files?.[0];event.target.value='';
  importWav(file).catch(e=>notice('WAV 추가 실패: '+(e.message||e),true));
 });
 $('audioFromShelf').addEventListener('change',async event=>{
  const id=event.target.value;if(!id)return;
  try{const entry=await S.getMedia(id);if(!entry||entry.mime!=='audio/wav')throw Error('선택한 음악을 찾지 못했어요.');updateAudio(entry)}
  catch(e){notice(e.message||String(e),true)}
 });
 $('removeAudio').addEventListener('click',()=>{updateAudio(null);$('audioFromShelf').value=''});
 $('refreshAudio').addEventListener('click',()=>refreshSoundShelf().catch(e=>notice(e.message,true)));
 $('audioVolume').addEventListener('change',event=>{
  const value=Number(event.target.value);if(!get().audio)return;
  edit(()=>{get().audio.volume=value});if(audio)audio.volume=value;refresh();
 });
 $('audioLoop').addEventListener('change',event=>{
  if(!get().audio)return;
  edit(()=>{get().audio.loop=event.target.checked});if(audio)audio.loop=event.target.checked;refresh();
 });
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);cleanMedia()});
 refreshSoundShelf().catch(()=>{});
 refresh();
 return {refresh,stop,pause,play,halt,syncToActive,isPlaying:()=>playing,seek,refreshSoundShelf,dispose:()=>{stop();cleanMedia();disposed=true}};
}
window.GulliverUnifiedTimeline={create};
})();
