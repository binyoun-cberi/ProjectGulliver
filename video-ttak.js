(()=>{
'use strict';
const C=window.GulliverMediaCore,S=window.GulliverStudioStorage,$=id=>document.getElementById(id);
let model=C.makeVideo(),current=-1,urls=[],generation=0,playing=false,exporting=false,stopRequested=false;
const status=(s,bad=false)=>{$('msg').textContent=s;$('msg').style.color=bad?'#b3374f':'#277a56'};
const uuid=()=>crypto.randomUUID?.()||'media_'+Date.now().toString(36)+Math.random().toString(36).slice(2);
function freeUrls(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
function title(){return model.title.replace(/[\\/:*?"<>|]/g,'_')||'우리 반 영상'}
function duration(){return model.clips.reduce((n,c)=>n+c.duration,0)}
async function resolveClip(i){
 const clip=model.clips[i];if(!clip)return null;
 const media=await S.getMedia(clip.mediaId);
 if(!media||!media.blob)throw Error('저장된 영상 소재를 찾을 수 없어요. 파일을 다시 추가해 주세요.');
 return media;
}
async function showClip(i){
 const ticket=++generation;current=i;
 const v=$('previewVideo'),im=$('previewImage');v.pause();v.hidden=true;im.hidden=true;
 v.removeAttribute('src');v.load();im.removeAttribute('src');
 freeUrls();
 if(i<0||!model.clips[i]){$('placeholder').hidden=false;$('previewStatus').textContent='장면을 선택해 주세요.';return}
 const clip=model.clips[i],media=await resolveClip(i);
 if(ticket!==generation)return;
 const url=URL.createObjectURL(media.blob);urls.push(url);$('placeholder').hidden=true;
 if(clip.mime.startsWith('video/')){
  v.src=url;v.hidden=false;v.currentTime=clip.start;
 }else{im.src=url;im.hidden=false}
 $('previewStatus').textContent=(i+1)+'번째 장면 · '+clip.name+' · '+clip.duration.toFixed(1)+'초';
 $('previewCaption').textContent=model.caption;
 for(const x of document.querySelectorAll('#clipList .clip'))x.classList.toggle('active',Number(x.dataset.index)===i);
}
function rerender(){
 model=C.validateVideo(model);
 $('titleInput').value=model.title;$('captionInput').value=model.caption;$('formatInput').value=model.format;
 $('stage').classList.toggle('square',model.format==='square');
 $('previewCaption').textContent=model.caption;
 $('soundtrackName').textContent=model.audio?model.audio.name:'배경음악 없음';
 $('audioVolume').value=model.audio?model.audio.volume:0.7;
 $('audioLoop').checked=model.audio?model.audio.loop:true;
 $('removeAudio').disabled=!model.audio;
 const root=$('clipList');root.replaceChildren();
 $('durationTotal').textContent='('+duration().toFixed(1)+' / 45초)';
 model.clips.forEach((clip,i)=>{
  const card=document.createElement('article');card.className='clip'+(i===current?' active':'');card.dataset.index=String(i);
  const header=document.createElement('header'),name=document.createElement('strong');name.textContent=(i+1)+'. '+clip.name;
  const meta=document.createElement('small');meta.textContent=(clip.mime.startsWith('video/')?'영상':'사진')+' · '+clip.duration.toFixed(1)+'초';header.append(name,meta);card.append(header);
  const controls=document.createElement('div');controls.className='clip-controls';
  for(const [label,action] of [['보기',()=>showClip(i)],['↑',()=>move(i,-1)],['↓',()=>move(i,1)],['삭제',()=>removeClip(i)]]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=(label==='↑'&&i===0)||(label==='↓'&&i===model.clips.length-1);
   b.onclick=action;controls.append(b);
  }
  if(clip.mime.startsWith('video/')){
   const start=document.createElement('label');start.textContent='시작(초)';const inp=document.createElement('input');inp.type='number';inp.min='0';inp.step='.1';inp.value=clip.start;
   inp.addEventListener('change',()=>{const n=Math.max(0,Number(inp.value)||0);const old=clip.start;clip.start=n;validateEdit(()=>clip.start=old)});
   start.append(inp);controls.append(start);
  }
  const time=document.createElement('label');time.textContent='길이(초)';
  const number=document.createElement('input');number.type='number';number.min='.5';number.max='20';number.step='.5';number.value=clip.duration;
  number.addEventListener('change',()=>{const old=clip.duration;clip.duration=Number(number.value);validateEdit(()=>clip.duration=old)});
  time.append(number);controls.append(time);card.append(controls);root.append(card);
 });
 if(!model.clips.length){const p=document.createElement('p');p.textContent='아직 장면이 없어요. 사진·영상을 추가하면 순서를 바꿀 수 있어요.';root.append(p)}
}
function validateEdit(undo){
 try{model=C.validateVideo(model);if(duration()>45)throw Error('영상은 45초까지 만들 수 있어요.');rerender();status('장면을 수정했어요.');}
 catch(e){undo();rerender();status(e.message,true)}
}
function move(i,d){const next=i+d;if(next<0||next>=model.clips.length)return;[model.clips[i],model.clips[next]]=[model.clips[next],model.clips[i]];current=next;rerender();showClip(current).catch(e=>status(e.message,true))}
function removeClip(i){model.clips.splice(i,1);current=Math.min(current,model.clips.length-1);rerender();showClip(current).catch(e=>status(e.message,true))}
async function durationFromVideo(blob){
 const u=URL.createObjectURL(blob),video=document.createElement('video');video.preload='metadata';video.muted=true;video.src=u;
 try{
  await Promise.race([new Promise((ok,bad)=>{video.onloadedmetadata=ok;video.onerror=()=>bad(Error('재생할 수 없는 영상 형식이에요.'))}),new Promise((_,bad)=>setTimeout(()=>bad(Error('영상 정보를 확인하지 못했어요.')),12000))]);
  if(!Number.isFinite(video.duration)||video.duration<=0)throw Error('영상 길이를 확인하지 못했어요.');
  return Math.min(10,video.duration);
 }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(u)}
}
async function addAudio(file){
 if(!C.audioAllowed(file))throw Error('15MB 이하 WAV 파일만 배경음악으로 사용할 수 있어요.');
 if((await S.media()).length>=C.MEDIA_COUNT)throw Error('미디어 보관함이 가득 찼어요. 미사용 원본을 정리해 주세요.');
 const A=window.AudioContext||window.webkitAudioContext;
 if(!A)throw Error('이 브라우저에서는 WAV 음악 재생을 지원하지 않아요.');
 const check=new A();
 try{await check.decodeAudioData(await file.arrayBuffer())}
 catch(e){throw Error('재생할 수 없는 WAV 파일이에요.')}
 finally{await check.close()}
 const id=uuid(),name=String(file.name||'배경음악.wav').slice(0,90);
 await S.saveMedia({id,name,mime:'audio/wav',blob:new Blob([file],{type:'audio/wav'}),createdAt:Date.now()});
 model.audio={mediaId:id,name,mime:'audio/wav',volume:0.7,loop:true};
 rerender();status('배경음악을 연결했어요. WebM 저장 시 음악이 합쳐져요.');
}
async function attachStoredAudio(media){
 const stored=media?.id&&await S.getMedia(media.id);
 if(!stored||!C.audioAllowed(stored.blob))throw Error('전달한 배경음악을 저장소에서 찾지 못했어요.');
 model.audio={mediaId:stored.id,name:String(stored.name||'배경음악').slice(0,90),mime:'audio/wav',volume:0.7,loop:true};
 rerender();status('음악 뚝딱에서 만든 WAV를 배경음악으로 연결했어요.');
}
async function addClip(file){
 if(!C.fileAllowed(file))throw Error('15MB 이하 PNG·JPG·MP4·WebM 파일만 추가할 수 있어요.');
 if(model.clips.length>=C.VIDEO_CLIPS)throw Error('장면은 최대 5개까지예요.');
 const media=await S.media();if(media.length>=C.MEDIA_COUNT)throw Error('영상 보관함이 가득 찼어요. 18개 파일을 초과할 수 없어요.');
 let seconds=file.type.startsWith('video/')?await durationFromVideo(file):4;
 if(duration()+seconds>C.VIDEO_SECONDS)seconds=C.VIDEO_SECONDS-duration();
 if(seconds<.5)throw Error('영상 총 길이는 45초를 넘을 수 없어요.');
 const id=uuid();
 await S.saveMedia({id,name:String(file.name||'공유 이미지.png').slice(0,90),mime:file.type,blob:file,createdAt:Date.now()});
 model.clips.push({mediaId:id,name:String(file.name||'공유 이미지.png').slice(0,75),mime:file.type,start:0,duration:seconds});
 current=model.clips.length-1;rerender();await showClip(current);status('장면을 기기 보관함에 추가했어요.');
}
$('cleanupMedia').addEventListener('click',async()=>{
 try{
  const projects=await S.projects(),used=new Set(model.clips.map(c=>c.mediaId));
  if(model.audio)used.add(model.audio.mediaId);
  for(const p of projects)if(p.kind==='video'){
   for(const c of p.payload?.clips||[])used.add(c.mediaId);
   if(p.payload?.audio?.mediaId)used.add(p.payload.audio.mediaId);
  }
  const orphans=(await S.media()).filter(m=>!used.has(m.id));
  if(!orphans.length){status('지울 수 있는 미사용 영상 원본이 없어요.');return}
  if(!confirm('어느 작업에서도 사용하지 않는 원본 '+orphans.length+'개를 기기에서 지울까요?'))return;
  for(const m of orphans)await S.deleteMedia(m.id);
  status('사용하지 않는 원본 '+orphans.length+'개를 정리했어요. 다른 작업에서 사용하는 파일은 보존했어요.');
 }catch(e){status('정리 중 오류: '+(e.message||e),true)}
});
$('audioFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{await addAudio(file)}catch(err){status(err.message,true)}
});
$('audioVolume').addEventListener('input',e=>{if(model.audio){model.audio.volume=Number(e.target.value);status('배경음악 음량을 변경했어요.')}});
$('audioLoop').addEventListener('change',e=>{if(model.audio)model.audio.loop=e.target.checked});
$('removeAudio').addEventListener('click',()=>{model.audio=null;rerender();status('영상에서 배경음악을 제외했어요.')});
$('clipFiles').addEventListener('change',async e=>{
 const files=[...e.target.files||[]];e.target.value='';
 for(const f of files){try{await addClip(f)}catch(err){status(err.message,true);break}}
});
for(const [field,key] of [['titleInput','title'],['captionInput','caption'],['formatInput','format']]){
 $(field).addEventListener('input',e=>{model[key]=e.target.value;$('previewCaption').textContent=model.caption;$('stage').classList.toggle('square',model.format==='square')});
 $(field).addEventListener('change',()=>{model=C.validateVideo(model);rerender()});
}
function stop(){stopRequested=true;playing=false;$('previewVideo').pause();}
$('stopPreview').onclick=stop;
async function loadRenderable(clip){
 const media=await S.getMedia(clip.mediaId);if(!media)throw Error('영상 원본이 보이지 않아요.');
 const url=URL.createObjectURL(media.blob);let element;
 try{
  if(clip.mime.startsWith('video/')){
   element=document.createElement('video');element.muted=true;element.playsInline=true;element.preload='auto';element.src=url;
   await new Promise((ok,bad)=>{element.onloadedmetadata=ok;element.onerror=()=>bad(Error('영상을 열지 못했어요.'))});
   await new Promise((ok,bad)=>{element.onseeked=ok;try{element.currentTime=clip.start}catch(e){bad(e)}setTimeout(ok,600)});
  }else{
   element=new Image();element.src=url;await new Promise((ok,bad)=>{element.onload=ok;element.onerror=()=>bad(Error('이미지를 열지 못했어요.'))});
  }
  return{element,url,video:clip.mime.startsWith('video/')};
 }catch(e){URL.revokeObjectURL(url);throw e}
}
async function sequence(record=false){
 if(playing||exporting)return;playing=!record;exporting=record;stopRequested=false;
 const size=model.format==='square'?[540,540]:[720,405],canvas=document.createElement('canvas');
 canvas.width=size[0];canvas.height=size[1];const ctx=canvas.getContext('2d');
 if(!ctx){playing=false;exporting=false;throw Error('캔버스를 사용할 수 없어요.')}
 const wantAudio=!!model.audio;
 const formats=wantAudio?['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm']:
  ['video/webm;codecs=vp8','video/webm'];
 const mime=typeof MediaRecorder==='undefined'?'':formats.find(t=>MediaRecorder.isTypeSupported(t))||'';
 if(record&&(!mime||!canvas.captureStream)){playing=false;exporting=false;throw Error('이 브라우저에서는 WebM 영상 저장을 지원하지 않아요. PC Chrome을 사용해 주세요.')}
 const stream=record?canvas.captureStream(20):null;
 let recorder=null,chunks=[],stopped=null,audioCtx=null,audioSource=null;
 try{
 if(wantAudio){
  const stored=await S.getMedia(model.audio.mediaId);
  if(!stored?.blob)throw Error('배경음악 원본이 없어요. WAV를 다시 넣어 주세요.');
  const A=window.AudioContext||window.webkitAudioContext;
  if(!A)throw Error('이 브라우저에서는 음원을 합성할 수 없어요.');
  audioCtx=new A();
  const buffer=await audioCtx.decodeAudioData(await stored.blob.arrayBuffer());
  await audioCtx.resume();
  audioSource=audioCtx.createBufferSource();audioSource.buffer=buffer;audioSource.loop=model.audio.loop;
  const gain=audioCtx.createGain();gain.gain.value=model.audio.volume;
  audioSource.connect(gain);
  if(record){
   const mixed=audioCtx.createMediaStreamDestination();gain.connect(mixed);
   const track=mixed.stream.getAudioTracks()[0];stream.addTrack(track);
  }else gain.connect(audioCtx.destination);
 }
 if(record){
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
  stopped=new Promise((ok,bad)=>{recorder.onstop=()=>ok(new Blob(chunks,{type:'video/webm'}));recorder.onerror=e=>bad(Error('영상 기록이 중단되었어요.'))});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.start(200);status('영상을 만드는 중이에요. 이 창을 닫지 마세요.');
 }
 if(audioSource)audioSource.start();
  for(let j=0;j<model.clips.length&&!stopRequested;j++){
   const clip=model.clips[j],r=await loadRenderable(clip);
   try{
    await showClip(j);
    if(r.video){try{await r.element.play()}catch(e){throw Error('영상 재생을 시작하지 못했어요. '+e.message)}}
    const start=performance.now();
    while(!stopRequested&&(performance.now()-start)<clip.duration*1000){
     ctx.fillStyle='#17243c';ctx.fillRect(0,0,canvas.width,canvas.height);
     const media=r.element,w=media.videoWidth||media.naturalWidth,h=media.videoHeight||media.naturalHeight;
     if(w&&h){const k=Math.min(canvas.width/w,canvas.height/h);const rw=w*k,rh=h*k;ctx.drawImage(media,(canvas.width-rw)/2,(canvas.height-rh)/2,rw,rh)}
     if(model.caption){ctx.font='bold '+Math.round(canvas.height*.067)+'px sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#1b243b';ctx.strokeText(model.caption,canvas.width/2,canvas.height*.88,canvas.width*.92);ctx.fillStyle='#fff';ctx.fillText(model.caption,canvas.width/2,canvas.height*.88,canvas.width*.92)}
     await new Promise(ok=>setTimeout(ok,49));
    }
   }finally{if(r.video)r.element.pause();URL.revokeObjectURL(r.url)}
  }
  if(record){
   recorder.stop();const blob=await stopped;
   if(!blob.size)throw Error('빈 영상 파일이 만들어졌어요.');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=title()+'.webm';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   status(wantAudio?'배경음악이 포함된 WebM 영상을 저장했어요.':'WebM 영상을 저장했어요. 원본 영상 소리는 포함되지 않아요.');
  }else status('영상 미리보기가 끝났어요.');
 }finally{
  if(audioSource){try{audioSource.stop()}catch(e){}}
  if(record&&recorder?.state==='recording')recorder.stop();
  stream?.getTracks().forEach(t=>t.stop());
  if(audioCtx)await audioCtx.close().catch(()=>{});
  playing=false;exporting=false;
 }
}
$('previewPlay').onclick=()=>{if(!model.clips.length)return status('먼저 장면을 추가해 주세요.',true);sequence(false).catch(e=>status(e.message,true))};
$('exportVideo').onclick=()=>{if(!model.clips.length)return status('먼저 장면을 추가해 주세요.',true);sequence(true).catch(e=>status(e.message,true))};
window.GulliverStudioAdapter={kind:'video',capture:()=>JSON.parse(JSON.stringify(C.validateVideo(model))),
 apply:raw=>{stop();model=C.validateVideo(raw);current=model.clips.length?0:-1;rerender();showClip(current).catch(e=>status(e.message,true))},
 rename:label=>{model.title=String(label).slice(0,90);rerender()},
 insertImage:async file=>addClip(file),insertAudio:addAudio,attachStoredAudio};
window.addEventListener('pagehide',()=>{stop();freeUrls()});
rerender();})();