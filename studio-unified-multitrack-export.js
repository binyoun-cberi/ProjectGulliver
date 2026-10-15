/* Gulliver 3.5: browser-native WebM compositor for independently timed clips.
   No remote uploads. Requires Chrome/Edge MediaRecorder + canvas.captureStream + Web Audio. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverMultitrackExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const Core=root.GulliverUnifiedCore||(typeof require==='function'?require('./studio-unified-core.js'):null);
 const active=(track,t)=>t>=track.start&&t<track.start+track.duration;
 const visuals=(model,t)=>((model.tracks||[]).filter(x=>(x.kind==='video'||x.kind==='caption')&&active(x,t))).sort((a,b)=>a.stack-b.stack);
 const audible=(model,t)=>((model.tracks||[]).filter(x=>(x.kind==='audio'||(x.kind==='video'&&!x.muted))&&active(x,t)));
 function gainAt(track,elapsed){
  if(elapsed<0||elapsed>=track.duration||track.muted&&track.kind==='video')return 0;
  const attack=track.fadeIn>0?Math.min(1,elapsed/track.fadeIn):1;
  const release=track.fadeOut>0?Math.min(1,(track.duration-elapsed)/track.fadeOut):1;
  return Math.max(0,(track.volume??.7)*Math.min(attack,release));
 }
 function applyFadeAutomation(gain,track,startAt){
  const fadeIn=Math.min(track.duration,track.fadeIn||0);
  const fadeOut=Math.min(track.duration-fadeIn,track.fadeOut||0);
  const base=track.volume??.7;
  gain.setValueAtTime(fadeIn?0:base,startAt);
  if(fadeIn)gain.linearRampToValueAtTime(base,startAt+fadeIn);
  if(fadeOut){
   gain.setValueAtTime(base,startAt+track.duration-fadeOut);
   gain.linearRampToValueAtTime(0,startAt+track.duration);
  }
 }
 const soundSchedule=(model)=>((model.tracks||[]).filter(t=>t.kind==='audio').map(t=>({
  id:t.id,mediaId:t.mediaId,start:t.start,duration:t.duration,trimStart:t.trimStart,volume:t.volume,fadeIn:t.fadeIn,fadeOut:t.fadeOut
 })));
 function waitFor(el,event,label,timeout=16000){
  return new Promise((resolve,reject)=>{
   const timer=root.setTimeout(()=>{cleanup();reject(Error(label+' 파일을 읽는 시간이 초과됐어요. 다른 코덱을 사용해 주세요.'))},timeout);
   const ok=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(Error(label+' 파일을 이 브라우저가 재생하지 못해요.'))};
   function cleanup(){root.clearTimeout(timer);el.removeEventListener(event,ok);el.removeEventListener('error',fail)}
   el.addEventListener(event,ok,{once:true});el.addEventListener('error',fail,{once:true});
  });
 }
 async function prepareVideo(project,getMedia,signal){
  const videos=new Map(),blobs=new Map(),urls=new Map();
  const release=()=>{
   for(const node of videos.values()){node.pause();node.removeAttribute('src');node.load()}
   for(const url of urls.values())URL.revokeObjectURL(url);
  };
  try{
   for(const track of project.tracks.filter(x=>x.kind==='video')){
    if(signal?.aborted)throw Error('영상 출력이 취소됐어요.');
    let url=urls.get(track.mediaId);
    if(!url){
     const file=await getMedia(track.mediaId);
     if(!file?.blob||file.mime!==track.mime||file.blob.size<1||file.blob.size>15*1048576)throw Error(track.name+' 원본 영상이 이 기기에 없어요.');
     blobs.set(track.mediaId,file.blob);
     url=URL.createObjectURL(file.blob);urls.set(track.mediaId,url);
    }
    // One decoding element per clip, including duplicated source files: they can overlap.
    const node=root.document.createElement('video');
    node.muted=true;node.playsInline=true;node.preload='auto';
    const loaded=waitFor(node,'loadedmetadata',track.name);
    node.src=url;node.load();await loaded;
    if(!Number.isFinite(node.duration)||node.duration<track.trimStart+track.duration-.10)throw Error(track.name+' 클립이 원본 영상의 길이를 넘어요. 클립을 줄여 주세요.');
    const target=Math.max(0,track.trimStart);
    if(target>.01){
     const sought=waitFor(node,'seeked',track.name);
     node.currentTime=target;await sought;
    }
    if(node.readyState<2)await waitFor(node,'loadeddata',track.name);
    videos.set(track.id,node);
   }
   return{videos,release};
  }catch(e){release();throw e}
 }
 function drawVideo(ctx,track,movie){
  if(!movie||movie.readyState<2||!movie.videoWidth||!movie.videoHeight)throw Error(track.name+' 영상 프레임을 읽을 수 없어요.');
  const ratio=Math.max(track.w/movie.videoWidth,track.h/movie.videoHeight);
  const sw=track.w/ratio,sh=track.h/ratio;
  ctx.save();ctx.beginPath();ctx.rect(track.x,track.y,track.w,track.h);ctx.clip();
  ctx.drawImage(movie,(movie.videoWidth-sw)/2,(movie.videoHeight-sh)/2,sw,sh,track.x,track.y,track.w,track.h);
  ctx.restore();
 }
 function drawCaption(ctx,track){
  ctx.save();ctx.font='900 '+track.fontSize+'px sans-serif';ctx.fillStyle=track.color;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
  const lines=track.text.split('\n').slice(0,6),lineHeight=track.fontSize*1.18;
  const y0=track.y+track.h/2-(lines.length-1)*lineHeight/2;
  lines.forEach((line,i)=>ctx.fillText(line,track.x+track.w/2,y0+i*lineHeight,track.w));
  ctx.restore();
 }
 function drawOverlays(ctx,project,t,players){
  for(const track of visuals(project,t)){
   if(track.kind==='caption')drawCaption(ctx,track);
   else drawVideo(ctx,track,players.get(track.id));
  }
 }
 async function prepareAudio(project,getMedia,audioContext){
  const decoded=new Map();
  for(const clip of project.tracks.filter(t=>t.kind==='audio')){
   if(decoded.has(clip.mediaId))continue;
   const media=await getMedia(clip.mediaId);
   if(!media?.blob||media.mime!=='audio/wav'||media.blob.size<44||media.blob.size>15*1048576)
    throw Error(clip.name+' 음악 원본을 찾을 수 없어요. WAV 파일을 다시 추가해 주세요.');
   let buffer;
   try{buffer=await audioContext.decodeAudioData(await media.blob.arrayBuffer())}
   catch(e){throw Error(clip.name+' 음악을 해석하지 못했어요. PCM WAV 파일을 사용해 주세요.')}
   decoded.set(clip.mediaId,buffer);
  }
  const scheduled=project.tracks.filter(t=>t.kind==='audio').map(t=>({
   track:t,buffer:decoded.get(t.mediaId)
  }));
  for(const {track,buffer} of scheduled)if(buffer.duration<track.trimStart+track.duration-.05)
   throw Error(track.name+' 음악의 재생 구간이 원본 길이를 넘어요. 끝 손잡이를 줄여 주세요.');
  return scheduled;
 }
 async function exportWebM(raw,{getMedia,onProgress=()=>{},signal}={}){
  if(!Core)throw Error('통합 캔버스 엔진을 불러오지 못했어요.');
  const project=Core.validate(raw);
  const V=root.GulliverUnifiedVideo;
  if(!V||!project.tracks?.length)throw Error('다중 트랙 편집 상태를 확인할 수 없어요.');
  if(typeof getMedia!=='function')throw Error('업로드한 원본 파일 저장소에 접근할 수 없어요.');
  if(project.tracks.filter(x=>x.kind==='video').length>8||project.tracks.filter(x=>x.kind==='audio').length>8)
   throw Error('영상과 음악은 각각 최대 8개까지 합성할 수 있어요. 클립을 줄여 주세요.');
  const {duration,width,height}=V.plan(project),mime=V.mimeType();
  if(!mime)throw Error('이 기기는 WebM 합성 출력을 지원하지 않아요. PC Chrome 또는 Edge에서 사용해 주세요.');
  if(signal?.aborted)throw Error('영상 저장이 취소됐어요.');
  let videoAssets=null,audioContext=null,stream=null,recorder=null,timer=null,visibilityListener=null;
  const soundSources=[],videoGains=new Map(),chunks=[];
  let cancelled=false,renderError=null;
  const abort=()=>{cancelled=true;if(recorder?.state==='recording')recorder.stop()};
  try{
   videoAssets=await prepareVideo(project,getMedia,signal);
   const Audio=root.AudioContext||root.webkitAudioContext;
   const needAudio=project.tracks.some(t=>t.kind==='audio'||(t.kind==='video'&&!t.muted));
   if(needAudio&&!Audio)throw Error('영상 원본 소리와 배경음악을 이 브라우저에서 합칠 수 없어요.');
   let sound=[];
   if(needAudio){
    audioContext=new Audio();
    sound=await prepareAudio(project,getMedia,audioContext);
   }
   if(root.document.visibilityState==='hidden')throw Error('화면이 보이는 상태에서 저장해 주세요.');
   if(signal?.aborted)throw Error('영상 저장이 취소됐어요.');
   const canvas=root.document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx||!canvas.captureStream)throw Error('이 브라우저는 화면 영상 합성을 지원하지 않아요.');
   const frame=t=>{
    V.drawFrame(ctx,project,t,images,undefined,{
     beforeElements:()=>{
      for(const track of visuals(project,t))if(track.kind==='video')drawVideo(ctx,track,videoAssets.videos.get(track.id));
     }
    });
    for(const track of visuals(project,t))if(track.kind==='caption')drawCaption(ctx,track);
   };
   function syncVideo(t,isPlaying){
    for(const clip of project.tracks.filter(x=>x.kind==='video')){
     const player=videoAssets.videos.get(clip.id);
     if(!player)continue;
     if(!active(clip,t)){if(!player.paused)player.pause();continue}
     const target=clip.trimStart+(t-clip.start);
     if(Math.abs(player.currentTime-target)>.3)try{player.currentTime=Math.min(player.duration-.05,Math.max(0,target))}catch(e){}
     if(isPlaying&&player.paused)player.play().catch(()=>{});
    }
   }
   const images=await V.loadImages(project);
   syncVideo(0,false);frame(0);
   stream=canvas.captureStream(V.FPS);
   if(audioContext){
    const out=audioContext.createMediaStreamDestination();
    for(const {track,buffer} of sound){
     const node=audioContext.createBufferSource(),gain=audioContext.createGain();
     node.buffer=buffer;gain.gain.value=track.volume;
     node.connect(gain);gain.connect(out);soundSources.push({node,track,gain});
    }
    for(const track of project.tracks.filter(t=>t.kind==='video'&&!t.muted)){
     const movie=videoAssets.videos.get(track.id);
     // A source belongs to a single decoded video instance so overlapping clips mix independently.
     movie.muted=false;
     const sourceNode=audioContext.createMediaElementSource(movie),gain=audioContext.createGain();
     gain.gain.value=0;sourceNode.connect(gain);gain.connect(out);
     videoGains.set(track.id,gain);
    }
    const audioTrack=out.stream.getAudioTracks()[0];
    if(!audioTrack)throw Error('음악 트랙을 합성하지 못했어요.');
    stream.addTrack(audioTrack);
   }
   recorder=new root.MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});
   const stopped=new Promise((resolve,reject)=>{
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    recorder.onerror=e=>reject(Error('영상 인코딩 오류: '+(e.error?.message||'알 수 없는 문제')));
    recorder.onstop=()=>{
     const blob=new Blob(chunks,{type:recorder.mimeType||mime});
     if(!blob.size)reject(Error('비어 있는 영상이 만들어졌어요.'));else resolve(blob);
    };
   });
   signal?.addEventListener('abort',abort,{once:true});
   visibilityListener=()=>{if(root.document.visibilityState==='hidden')abort()};
   root.document.addEventListener('visibilitychange',visibilityListener);
   await audioContext?.resume();
   if(signal?.aborted)abort();
   if(cancelled)throw Error('영상 저장이 취소됐어요.');
   recorder.start(250);
   const start=root.performance.now(),audioStart=audioContext?.currentTime||0;
   for(const {node,track,gain} of soundSources){
    applyFadeAutomation(gain.gain,track,audioStart+track.start);
    node.start(audioStart+track.start,track.trimStart,track.duration);
   }
   syncVideo(0,true);
   timer=root.setInterval(()=>{
    if(cancelled)return;
    const t=Math.min(duration,(root.performance.now()-start)/1000);
    try{
     syncVideo(t,true);
     for(const track of project.tracks.filter(t=>t.kind==='video'&&!t.muted)){
      const node=videoGains.get(track.id);
      if(node)node.gain.setValueAtTime(gainAt(track,t-track.start),audioContext.currentTime);
     }
     frame(t);onProgress(t/duration,t,duration);
     if(t>=duration&&recorder.state==='recording'){root.clearInterval(timer);recorder.stop()}
    }catch(e){
     renderError=e;cancelled=true;root.clearInterval(timer);
     if(recorder.state==='recording')recorder.stop();
    }
   },1000/V.FPS);
   const result=await stopped;
   if(renderError)throw Error('영상 합성 중 문제가 생겼어요: '+renderError.message);
   if(cancelled||signal?.aborted)throw Error('영상 저장이 취소됐어요.');
   onProgress(1,duration,duration);
   return result;
  }finally{
   if(timer!==null)root.clearInterval(timer);
   signal?.removeEventListener('abort',abort);
   if(visibilityListener)root.document.removeEventListener('visibilitychange',visibilityListener);
   if(recorder?.state==='recording')try{recorder.stop()}catch(e){}
   for(const {node} of soundSources)try{node.stop()}catch(e){}
   stream?.getTracks().forEach(t=>t.stop());
   await audioContext?.close().catch(()=>{});
   videoAssets?.release();
  }
 }
 return{active,visuals,audible,soundSchedule,drawOverlays,exportWebM,gainAt,applyFadeAutomation};
});
