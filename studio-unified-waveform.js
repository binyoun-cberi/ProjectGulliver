/* Real decoded audio waveform peaks for the native multitrack timeline.
   Uses built-in Web Audio only; returns no invented waveform if the codec is unsupported. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverAudioWaveform=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 function computePeaks(samples,buckets=128){
  if(!samples?.length||buckets<1||buckets>1024)throw Error('파형 표본이 올바르지 않아요.');
  const out=[],n=samples.length;
  for(let i=0;i<buckets;i++){
   const start=Math.floor(i*n/buckets),end=Math.max(start+1,Math.floor((i+1)*n/buckets));
   let peak=0;
   for(let j=start;j<Math.min(end,n);j++){
    const v=Math.abs(samples[j]);
    if(Number.isFinite(v)&&v>peak)peak=v;
   }
   out.push(Math.min(1,peak));
  }
  return out;
 }
 function amplitude(track,local){
  if(local<0||local>=track.duration)return 0;
  const attack=track.fadeIn>0?Math.min(1,local/track.fadeIn):1;
  const release=track.fadeOut>0?Math.min(1,(track.duration-local)/track.fadeOut):1;
  return Math.max(0,(track.volume??.7)*Math.min(attack,release));
 }
 function draw(canvas,source,track){
  const rect=canvas.getBoundingClientRect(),width=Math.max(30,Math.round(rect.width* Math.min(2,root.devicePixelRatio||1))),height=30;
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,width,height);
  const peaks=source.peaks,ratio=Math.max(.01,source.duration||1),columns=Math.max(8,Math.min(width/2|0,180)),full=peaks.length;
  ctx.fillStyle=track.kind==='video'?'rgba(255,255,255,.75)':'rgba(229,255,244,.95)';
  for(let x=0;x<columns;x++){
   const sec=track.trimStart+track.duration*x/columns;
   const index=Math.min(full-1,Math.max(0,Math.floor(sec/ratio*full)));
   const amplitude=peaks[index]||0;
   const envelope=amplitude*Math.min(1,track.fadeIn?track.duration*x/columns/track.fadeIn:1,
     track.fadeOut?track.duration*(1-x/columns)/track.fadeOut:1);
   const bar=Math.max(1,envelope*(height-4)),px=Math.floor(x*width/columns),step=Math.max(1,Math.floor(width/columns)-1);
   ctx.fillRect(px,(height-bar)/2,step,bar);
  }
 }
 async function decodeMedia(row){
  const Audio=root.AudioContext||root.webkitAudioContext;
  if(!Audio||!row?.blob)throw Error('이 기기에서 오디오 파형을 해석할 수 없어요.');
  const audio=new Audio();
  try{
   const decoded=await audio.decodeAudioData(await row.blob.arrayBuffer());
   if(!decoded.length||!decoded.duration)throw Error('소리가 없는 파일이에요.');
   // 128 compressed envelopes; discard the AudioBuffer immediately to avoid retaining large files.
   const channel=decoded.getChannelData(0);
   return{peaks:computePeaks(channel,192),duration:decoded.duration};
  }finally{await audio.close().catch(()=>{})}
 }
 return{computePeaks,amplitude,draw,decodeMedia};
});
