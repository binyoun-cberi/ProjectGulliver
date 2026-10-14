(function(root,factory){
'use strict';
const api=factory(root);
if(typeof module==='object'&&module.exports)module.exports=api;
root.GulliverUnifiedVideo=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const MAX_SECONDS=60,FPS=20,BITRATE=1800000;
const FORMATS=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm;codecs=vp8','video/webm'];
function plan(project){
 const C=root.GulliverUnifiedCore||require('./studio-unified-core.js');
 const safe=C.validate(project),seconds=C.totalDuration(safe);
 if(seconds>MAX_SECONDS)throw Error('영상으로 저장할 수 있는 길이는 60초까지예요. 장면 시간을 줄여 주세요.');
 return{project:safe,duration:seconds,width:C.LAYOUTS[safe.layout].w,height:C.LAYOUTS[safe.layout].h};
}
function mimeType(){
 if(typeof root.MediaRecorder==='undefined')return '';
 return FORMATS.find(value=>root.MediaRecorder.isTypeSupported(value))||'';
}
function drawFrame(ctx,model,seconds,images=new Map()){
 const C=root.GulliverUnifiedCore||require('./studio-unified-core.js');
 const {w,h}=C.LAYOUTS[model.layout],position=C.locateTime(model,seconds),p=model.pages[position.index],transition=C.transitionFrame(p,position.local);
 ctx.save();ctx.clearRect(0,0,w,h);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
 ctx.globalAlpha=transition.opacity;ctx.translate(transition.slide,0);
 ctx.fillStyle=p.background;ctx.fillRect(0,0,w,h);
 for(const item of p.elements){
  const animation=C.animationFrame(item,position.local);
  ctx.save();
  ctx.globalAlpha*=item.opacity*animation.opacity;
  ctx.translate(item.x+item.w/2+animation.x,item.y+item.h/2+animation.y);
  ctx.scale(animation.scale,animation.scale);
  ctx.translate(-item.w/2,-item.h/2);
  ctx.fillStyle=item.fill;ctx.strokeStyle=item.stroke;ctx.lineWidth=2;
  if(item.type==='rect'){ctx.fillRect(0,0,item.w,item.h);ctx.strokeRect(0,0,item.w,item.h)}
  else if(item.type==='ellipse'){ctx.beginPath();ctx.ellipse(item.w/2,item.h/2,item.w/2,item.h/2,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  else if(item.type==='triangle'){ctx.beginPath();ctx.moveTo(item.w/2,0);ctx.lineTo(item.w,item.h);ctx.lineTo(0,item.h);ctx.closePath();ctx.fill();ctx.stroke()}
  else if(item.type==='star'){
   ctx.beginPath();
   for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=n%2?.43:1;
    const x=item.w/2+Math.cos(a)*item.w*r/2,y=item.h/2+Math.sin(a)*item.h*r/2;
    if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }ctx.closePath();ctx.fill();ctx.stroke();
  }else if(item.type==='line'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(item.w,item.h);ctx.lineWidth=3;ctx.stroke()}
  else if(item.type==='image'){
   const image=images.get(item.src);
   if(!image)throw Error('영상 장면에 포함된 사진을 읽지 못했어요.');
   const ratio=Math.min(item.w/image.width,item.h/image.height);
   const width=image.width*ratio,height=image.height*ratio;
   ctx.drawImage(image,(item.w-width)/2,(item.h-height)/2,width,height);
  }else if(item.type==='text'){
   ctx.fillStyle=item.fill;ctx.font='650 '+item.fontSize+'px sans-serif';
   ctx.textAlign=item.align==='left'?'left':item.align==='right'?'right':'center';
   ctx.textBaseline='middle';
   const lines=item.content.split('\n').slice(0,16);
   const lineHeight=item.fontSize*1.22,y0=item.h/2-(lines.length-1)*lineHeight/2;
   const x=item.align==='left'?0:item.align==='right'?item.w:item.w/2;
   for(let n=0;n<lines.length;n++)ctx.fillText(lines[n],x,y0+n*lineHeight,item.w);
  }
  ctx.restore();
 }
 ctx.restore();
 return position;
}
async function loadImages(project){
 const urls=new Set();
 for(const p of project.pages)for(const item of p.elements)if(item.type==='image')urls.add(item.src);
 const images=new Map();
 for(const src of urls){
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('영상에 포함된 사진을 해석하지 못했어요.'));img.src=src});
  if(!img.naturalWidth||!img.naturalHeight)throw Error('크기가 없는 사진이 있어요.');
  images.set(src,img);
 }
 return images;
}
async function exportWebM(project,{getMedia,onProgress=()=>{},signal}={}){
 const {project:safe,duration,width,height}=plan(project),mime=mimeType();
 if(!mime)throw Error('이 브라우저에서 WebM 영상 출력을 지원하지 않아요. PC Chrome 또는 Edge에서 이용해 주세요.');
 if(typeof root.document==='undefined')throw Error('브라우저에서만 영상을 만들 수 있어요.');
 if(signal?.aborted)throw Error('영상 저장이 취소됐어요.');
 let audioContext=null,source=null,recorder=null,stream=null,timer=0,visibilityListener=null,stopPromise=null;
 try{
  // Start decoding from the user-clicked export action; never upload any file.
  let decoded=null;
  if(safe.audio){
   if(typeof getMedia!=='function')throw Error('배경음악 저장소에 접근할 수 없어요.');
   const entry=await getMedia(safe.audio.mediaId);
   if(!entry||entry.mime!=='audio/wav'||!entry.blob||entry.blob.size<=44||entry.blob.size>15*1024*1024)
    throw Error('배경음악 WAV 원본이 이 기기에 없어요. 파일을 다시 연결해 주세요.');
   const Audio=root.AudioContext||root.webkitAudioContext;
   if(!Audio)throw Error('이 브라우저에서는 배경음악을 영상에 합칠 수 없어요.');
   audioContext=new Audio();
   try{decoded=await audioContext.decodeAudioData(await entry.blob.arrayBuffer())}
   catch(e){throw Error('WAV 배경음악을 디코딩하지 못했어요. PCM WAV를 사용해 주세요.')}
   if(!decoded.duration||!decoded.length)throw Error('내용이 없는 WAV 음악은 사용할 수 없어요.');
  }
  const images=await loadImages(safe);
  if(signal?.aborted)throw Error('영상 저장이 취소됐어요.');
  if(root.document.visibilityState==='hidden')throw Error('화면이 보이는 상태에서 영상으로 저장해 주세요.');
  const canvas=root.document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx||typeof canvas.captureStream!=='function')throw Error('이 브라우저에서 영상 캔버스를 녹화할 수 없어요.');
  drawFrame(ctx,safe,0,images);
  stream=canvas.captureStream(FPS);
  if(decoded){
   const output=audioContext.createMediaStreamDestination(),gain=audioContext.createGain();
   gain.gain.value=safe.audio.volume;
   source=audioContext.createBufferSource();source.buffer=decoded;source.loop=safe.audio.loop;
   source.connect(gain);gain.connect(output);
   const track=output.stream.getAudioTracks()[0];
   if(!track)throw Error('음악 녹음 트랙을 만들지 못했어요.');
   stream.addTrack(track);
  }
  const chunks=[];
  recorder=new root.MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:BITRATE});
  stopPromise=new Promise((resolve,reject)=>{
   recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data)};
   recorder.onerror=event=>reject(Error('영상 녹화 오류: '+(event.error?.message||'알 수 없는 오류')));
   recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:recorder.mimeType||mime});
    if(!blob.size)reject(Error('비어 있는 영상이 만들어졌어요. 다시 시도해 주세요.'));
    else resolve(blob);
   };
  });
  let aborted=false;
  const abort=()=>{aborted=true;if(recorder?.state==='recording')recorder.stop()};
  signal?.addEventListener('abort',abort,{once:true});
  visibilityListener=()=>{if(root.document.visibilityState==='hidden')abort()};
  root.document.addEventListener('visibilitychange',visibilityListener);
  await audioContext?.resume();
  if(signal?.aborted)abort();
  if(!aborted){
   recorder.start(250);
   source?.start();
   const start=root.performance.now();
   timer=root.setInterval(()=>{
    if(aborted)return;
    const t=Math.min(duration,(root.performance.now()-start)/1000);
    try{
     drawFrame(ctx,safe,t,images);onProgress(t/duration,t,duration);
     if(t>=duration&&recorder.state==='recording'){root.clearInterval(timer);recorder.stop()}
    }catch(e){aborted=true;root.clearInterval(timer);if(recorder.state==='recording')recorder.stop()}
   },1000/FPS);
  }
  const blob=aborted&&!stopPromise?null:await stopPromise;
  if(aborted||signal?.aborted)throw Error('영상 저장이 중단됐어요. 창을 닫지 않고 다시 실행해 주세요.');
  onProgress(1,duration,duration);
  return blob;
 }finally{
  if(timer)root.clearInterval(timer);
  if(visibilityListener)root.document.removeEventListener('visibilitychange',visibilityListener);
  if(recorder?.state==='recording')try{recorder.stop()}catch(e){}
  try{source?.stop()}catch(e){}
  stream?.getTracks().forEach(t=>t.stop());
  await audioContext?.close().catch(()=>{});
 }
}
return{FPS,MAX_SECONDS,plan,mimeType,drawFrame,exportWebM};
});
