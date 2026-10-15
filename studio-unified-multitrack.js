/* Gulliver 3.4: non-destructive, local-first multitrack video / WAV / caption editing.
   All changes flow through GulliverStudioAdapter (history + autosave). */
(()=>{
'use strict';
const C=window.GulliverUnifiedCore,A=window.GulliverStudioAdapter,S=window.GulliverStudioStorage,$=id=>document.getElementById(id);
if(!C||!A||!S||!$('studioTimeline'))return;
const stage=$('stage'),assets=new Map(),waveCache=new Map();
const W=window.GulliverAudioWaveform;
let selected='',disposed=false,lastT=0,playing=false,serial=0;
const container=document.createElement('section');container.className='multi-editor';container.id='multiEditor';
container.innerHTML=[
 '<header class="multi-head"><div><strong>다중 트랙</strong><small>영상·음악·자막을 원하는 시간에 놓으세요</small></div><button type="button" id="multiEnable">다중 트랙 시작</button><button type="button" id="multiAddCaption" hidden>＋ 자막</button></header>',
 '<p class="multi-description">파일 목록에서 영상·음악을 누르면 트랙에 추가돼요. 막대 가운데는 이동, 양 끝은 자르기예요.</p>',
 '<div class="multi-ruler" id="multiRuler"><span>0초</span><span>중간</span><span>끝</span></div>',
 '<div id="multiRows" class="multi-rows" aria-label="영상 음악 자막 트랙"></div>',
 '<div class="multi-inspector" id="multiInspector" hidden></div>',
 '<p class="multi-hint">PC는 드래그, 모바일은 손가락으로 조절할 수 있어요. 저장 후 다시 열어도 유지됩니다.</p>'
].join('');
$('studioTimeline').prepend(container);
const rows=$('multiRows'),inspector=$('multiInspector');
const kindText={video:'영상',audio:'음악',caption:'자막'};
const limit=()=>Math.min(60,C.totalDuration(A.capture()));
const tracks=()=>A.getTracks?.()||[];
const enabled=()=>A.multitrackEnabled?.()||false;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const round=n=>Math.round(n*10)/10;
const isActive=(t,time)=>time>=t.start&&time<t.start+t.duration;
const showError=e=>{const status=$('status');status.textContent=(e?.message||String(e));status.style.color='#b91c1c'};
function nativeAsset(t){
 let asset=assets.get(t.id);if(asset){if(asset.mediaId===t.mediaId)return asset;release(t.id)}
 const entry={mediaId:t.mediaId,url:'',node:null,loading:true};assets.set(t.id,entry);
 if(t.kind==='caption')return entry;
 const order=++serial;
 S.getMedia(t.mediaId).then(row=>{
  if(disposed||assets.get(t.id)!==entry)return;
  if(!row?.blob||row.mime!==t.mime)throw Error(t.name+' 원본을 찾지 못했어요. ZIP 백업을 복원해 주세요.');
  entry.url=URL.createObjectURL(row.blob);
  const node=document.createElement(t.kind==='video'?'video':'audio');
  node.src=entry.url;node.preload='auto';node.muted=t.kind==='video'?t.muted:false;node.playsInline=true;node.loop=false;
  if(t.kind==='video'){
   node.className='multi-stage-video';node.dataset.trackId=t.id;node.hidden=true;node.setAttribute('aria-label',t.name);stage.append(node);
  }
  node.addEventListener('loadedmetadata',()=>sync(lastT,playing));
  entry.node=node;entry.loading=false;positionVideos();sync(lastT,playing);
 }).catch(showError);
 return entry;
}
function release(id){
 const asset=assets.get(id);if(!asset)return;
 asset.node?.pause?.();asset.node?.remove?.();if(asset.url)URL.revokeObjectURL(asset.url);
 assets.delete(id);
}
const clear=()=>{for(const id of [...assets.keys()])release(id)};
function positionVideos(){
 for(const track of tracks().filter(t=>t.kind==='video')){
  const asset=nativeAsset(track);if(!asset.node)continue;
  const video=asset.node;stage.append(video);
  Object.assign(video.style,{left:track.x+'px',top:track.y+'px',width:track.w+'px',height:track.h+'px',zIndex:String(2+track.stack)});
 }
}
function captionOverlay(){
 stage.querySelectorAll('.multi-stage-caption').forEach(n=>n.remove());
 for(const track of tracks().filter(t=>t.kind==='caption')){
  const div=document.createElement('div');div.className='multi-stage-caption';div.dataset.trackId=track.id;
  div.textContent=track.text;Object.assign(div.style,{
   left:track.x+'px',top:track.y+'px',width:track.w+'px',minHeight:track.h+'px',
   fontSize:track.fontSize+'px',color:track.color,zIndex:String(20+track.stack)
  });stage.append(div);
 }
}
function sync(time,isPlaying){
 lastT=Math.max(0,Number(time)||0);playing=!!isPlaying;
 const present=new Set(tracks().map(t=>t.id));
 for(const id of assets.keys())if(!present.has(id))release(id);
 for(const track of tracks()){
  if(track.kind==='caption'){
   const node=stage.querySelector('.multi-stage-caption[data-track-id="'+track.id+'"]');
   if(node)node.hidden=!isActive(track,lastT);
   continue;
  }
  const asset=nativeAsset(track),node=asset.node;
  if(!node)continue;
  const active=isActive(track,lastT);
  if(track.kind==='video')node.hidden=!active;
  if(!active){node.pause();continue}
  node.muted=track.kind==='video'?track.muted:false;
  node.volume=Math.max(0,Math.min(1,W?.amplitude?.(track,lastT-track.start)??track.volume));
  const wanted=track.trimStart+(lastT-track.start);
  if(node.readyState>=1&&Math.abs(node.currentTime-wanted)>(playing?.4:.08)){
   try{node.currentTime=clamp(wanted,0,Math.max(.01,node.duration-.05))}catch(e){}
  }
  if(playing&&node.paused)node.play().catch(()=>{});
  if(!playing&&!node.paused)node.pause();
 }
}
function refresh(){
 if(disposed)return;
 const active=enabled();
 $('multiEnable').hidden=active;$('multiAddCaption').hidden=!active;
 container.classList.toggle('is-disabled',!active);
 if(!active){rows.replaceChildren();inspector.hidden=true;clear();stage.querySelectorAll('.multi-stage-caption').forEach(n=>n.remove());return}
 const tMax=limit();
 $('multiRuler').lastElementChild.textContent=tMax+'초';
 $('multiRuler').children[1].textContent=Math.round(tMax/2)+'초';
 rows.replaceChildren();
 const data=tracks();
 for(const kind of ['video','audio','caption']){
  const group=document.createElement('div');group.className='multi-group';
  const title=document.createElement('div');title.className='multi-kind-title';title.textContent=kindText[kind]+' 트랙';
  group.append(title);
  const groupTracks=data.filter(t=>t.kind===kind);
  if(!groupTracks.length){const empty=document.createElement('div');empty.className='multi-empty';empty.textContent=kind==='caption'?'＋ 자막을 눌러 추가':'내 미디어 파일을 선택해 추가';group.append(empty)}
  for(const track of groupTracks){
   const lane=document.createElement('div');lane.className='multi-lane';
   const clip=document.createElement('button');clip.type='button';clip.className='multi-clip '+kind;clip.dataset.trackId=track.id;
   clip.setAttribute('aria-label',kindText[kind]+' '+track.name+' '+track.start+'초부터 '+track.duration+'초 동안');
   if(selected===track.id)clip.classList.add('selected');
   clip.style.left=(track.start/tMax*100)+'%';clip.style.width=(track.duration/tMax*100)+'%';
   const left=document.createElement('span');left.dataset.handle='left';left.className='multi-handle';left.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.className='multi-clip-name';label.textContent=track.kind==='caption'?track.text:track.name;
   const right=document.createElement('span');right.dataset.handle='right';right.className='multi-handle';right.setAttribute('aria-hidden','true');
   clip.append(left,label,right);
   if(kind==='audio'||kind==='video'&&!track.muted)attachWaveform(clip,track);
   installDrag(clip,lane,track);lane.append(clip);group.append(lane);
  }
  rows.append(group);
 }
 positionVideos();captionOverlay();drawInspector();sync(lastT,playing);
}
function attachWaveform(clip,track){
 if(!W||!track.mediaId)return;
 const canvas=document.createElement('canvas');canvas.className='multi-waveform';canvas.setAttribute('aria-hidden','true');
 clip.insertBefore(canvas,clip.querySelector('.multi-clip-name'));
 let entry=waveCache.get(track.mediaId);
 if(!entry){
  entry=S.getMedia(track.mediaId).then(row=>{
   if(!row?.blob)throw Error('업로드한 오디오 원본이 없어요.');
   return W.decodeMedia(row);
  }).catch(()=>null);
  waveCache.set(track.mediaId,entry);
 }
 entry.then(wave=>{
  if(!clip.isConnected)return;
  if(wave)W.draw(canvas,wave,track);
  else canvas.title='이 파일의 파형은 현재 브라우저에서 분석할 수 없어요.';
 });
}
function drawInspector(){
 inspector.replaceChildren();
 const track=tracks().find(t=>t.id===selected);
 inspector.hidden=!track;if(!track)return;
 const title=document.createElement('strong');title.textContent='선택한 '+kindText[track.kind]+' · '+track.name;inspector.append(title);
 const field=(label,val,handler,mode='number')=>{
  const wrap=document.createElement('label');wrap.textContent=label;
  const input=document.createElement(mode==='textarea'?'textarea':'input');
  if(mode!=='textarea')input.type=mode;
  input.value=String(val);if(mode==='number')input.step='.1';
  input.addEventListener('change',()=>{try{handler(mode==='number'?Number(input.value):input.value)}catch(e){showError(e);refresh()}});
  wrap.append(input);inspector.append(wrap);
 };
 if(track.kind==='caption'){
  field('자막 내용',track.text,v=>A.updateTrack(track.id,{text:v}),'textarea');
  field('글씨 크기',track.fontSize,v=>A.updateTrack(track.id,{fontSize:v}));
 }else{
  field('원본 시작 (초)',track.trimStart,v=>A.updateTrack(track.id,{trimStart:Math.max(0,v)}));
  const controls=document.createElement('div');controls.className='multi-audio-controls';
  if(track.kind==='video'){
   const toggle=document.createElement('label');toggle.className='multi-sound-toggle';
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!track.muted;
   checkbox.addEventListener('change',()=>A.updateTrack(track.id,{muted:!checkbox.checked}));
   toggle.append(checkbox,document.createTextNode('영상 원본 소리 사용'));
   controls.append(toggle);
  }
  const slider=document.createElement('label');slider.className='multi-volume-label';
  const volumeText=document.createElement('span');volumeText.textContent='음량 '+Math.round(track.volume*100)+'%';
  const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='100';volume.step='1';
  volume.value=String(Math.round(track.volume*100));
  volume.addEventListener('input',()=>{volumeText.textContent='음량 '+volume.value+'%'});
  volume.addEventListener('change',()=>A.updateTrack(track.id,{volume:Number(volume.value)/100}));
  slider.append(volumeText,volume);controls.append(slider);
  const fadeRow=document.createElement('div');fadeRow.className='multi-fades';
  for(const [fieldName,label] of [['fadeIn','페이드인'],['fadeOut','페이드아웃']]){
   const box=document.createElement('label');box.textContent=label+' (초)';
   const input=document.createElement('input');input.type='number';input.step='0.1';input.min='0';input.max=String(track.duration);input.value=String(track[fieldName]||0);
   input.addEventListener('change',()=>A.updateTrack(track.id,{[fieldName]:clamp(Number(input.value),0,track.duration)}));
   box.append(input);fadeRow.append(box);
  }
  controls.append(fadeRow);inspector.append(controls);
 }
 field('시작 위치 (초)',track.start,v=>A.updateTrack(track.id,{start:clamp(v,0,limit()-track.duration)}));
 field('클립 길이 (초)',track.duration,v=>A.updateTrack(track.id,{duration:clamp(v,.5,limit()-track.start)}));
 const actions=document.createElement('div');actions.className='multi-actions';
 const dup=document.createElement('button');dup.textContent='복제';dup.addEventListener('click',()=>{
  try{const end=track.start+track.duration;const start=end+track.duration<=limit()?end:0;selected=A.addTrack({...track,start});refresh()}catch(e){showError(e)}
 });
 const remove=document.createElement('button');remove.textContent='삭제';remove.addEventListener('click',()=>{A.removeTrack(track.id);selected='';refresh()});
 actions.append(dup,remove);inspector.append(actions);
}
function installDrag(clip,lane,track){
 let drag=null;
 clip.addEventListener('click',()=>{selected=track.id;drawInspector();rows.querySelectorAll('.multi-clip').forEach(c=>c.classList.toggle('selected',c.dataset.trackId===selected))});
 clip.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType!=='touch')return;
  const handle=e.target.closest('[data-handle]')?.dataset.handle||'move';
  drag={x:e.clientX,base:{...track},handle,span:lane.getBoundingClientRect().width||250};
  clip.setPointerCapture(e.pointerId);e.preventDefault();selected=track.id;
 });
 clip.addEventListener('pointermove',e=>{
  if(!drag)return;
  const difference=round((e.clientX-drag.x)/drag.span*limit()),d=drag.base;
  const patch=calculateDrag(d,drag.handle,difference,limit());
  clip.style.left=(patch.start/limit()*100)+'%';clip.style.width=(patch.duration/limit()*100)+'%';
 });
 clip.addEventListener('pointerup',e=>{
  if(!drag)return;
  const delta=round((e.clientX-drag.x)/drag.span*limit()),patch=calculateDrag(drag.base,drag.handle,delta,limit());drag=null;
  try{A.updateTrack(track.id,patch);selected=track.id;refresh()}catch(error){showError(error);refresh()}
 });
 clip.addEventListener('pointercancel',()=>{drag=null;refresh()});
}
function calculateDrag(t,handle,delta,total){
 if(handle==='move')return{start:round(clamp(t.start+delta,0,total-t.duration))};
 if(handle==='left'){
  const start=round(clamp(t.start+delta,0,t.start+t.duration-.5));
  return{start,duration:round(t.duration-(start-t.start)),trimStart:round(t.trimStart+(start-t.start))};
 }
 return{duration:round(clamp(t.duration+delta,.5,total-t.start))};
}
function enable(){A.expandTimeline();A.adoptLegacyMedia();refresh()}
function addFromMedia(row){
 if(!enabled())enable();
 if(!['video/mp4','video/webm','video/quicktime','audio/wav'].includes(row?.mime))throw Error('영상 또는 WAV 음악을 선택해 주세요.');
 A.expandTimeline();
 const total=limit(),kind=row.mime==='audio/wav'?'audio':'video';
 const existing=tracks().filter(t=>t.kind===kind);
 const latest=Math.max(0,...existing.map(t=>t.start+t.duration));
 const start=latest+1<total?round(latest):0;
 const duration=round(Math.min(kind==='audio'?6:3,total-start));
 const dims=C.LAYOUTS[A.capture().layout];
 const id=A.addTrack({kind,mediaId:row.id,mime:row.mime,name:row.name,start,duration,trimStart:0,
  volume:.7,x:kind==='video'?0:120,y:kind==='video'?0:120,
  w:kind==='video'?dims.w:480,h:kind==='video'?dims.h:180});
 selected=id;refresh();return id;
}
function adoptImported(){
 if(!enabled())return;
 A.adoptLegacyMedia();A.expandTimeline();selected=tracks().at(-1)?.id||'';refresh();
}
$('multiEnable').addEventListener('click',enable);
$('multiAddCaption').addEventListener('click',()=>{
 try{
  A.expandTimeline();
  const count=tracks().filter(t=>t.kind==='caption').length,total=limit(),start=Math.min(total-2,count*2),dims=C.LAYOUTS[A.capture().layout];
  selected=A.addTrack({kind:'caption',name:'자막 '+(count+1),text:'새 자막을 입력하세요',start,duration:2,
   x:Math.round(dims.w*.15),y:Math.round(dims.h*.72),w:Math.round(dims.w*.7),h:90,color:'#ffffff',fontSize:38});
  refresh();
 }catch(e){showError(e)}
});
window.addEventListener('pagehide',()=>{disposed=true;clear()});
window.GulliverMultiTrack={refresh,sync,addFromMedia,adoptImported,calculateDrag,isEnabled:enabled,enable};
refresh();
})();