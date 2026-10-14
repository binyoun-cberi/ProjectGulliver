/* Native clip preview inside the unified canvas; no ArtCraft iframe.
   Stage 1: MP4/WebM import, trim, autoplay-safe silent preview and IndexedDB backing.
   Exporting embedded video clips requires a later media-compositor integration. */
(() => {
'use strict';
const Core=window.GulliverUnifiedCore,Store=window.GulliverStudioStorage,Adapter=window.GulliverStudioAdapter;
const $=id=>document.getElementById(id);
if(!Core||!Store||!Adapter||!$('studioTimeline'))return;
const LIMIT=15*1024*1024,MIMES=['video/mp4','video/webm','video/quicktime'];
const controls=document.createElement('section');
controls.className='video-clip-tools';
controls.setAttribute('aria-label','현재 장면의 영상 클립');
controls.innerHTML=[
 '<div class="clip-tools-title"><strong>영상 클립</strong><small>같은 캔버스에서 불러오고 잘라 보기</small></div>',
 '<div class="clip-buttons"><label for="canvasVideoUpload" class="clip-import">＋ 영상 가져오기</label>',
 '<input id="canvasVideoUpload" type="file" accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime" hidden>',
 '<button type="button" id="canvasVideoRemove">영상 빼기</button></div>',
 '<div class="clip-info" id="canvasVideoName">이 장면에 연결한 영상이 없어요.</div>',
 '<div class="clip-adjust">',
 '<label>영상 시작 위치 (초)<input id="canvasVideoIn" type="number" min="0" max="86400" step=".1" value="0"></label>',
 '<label>재생 길이 (초)<input id="canvasVideoLength" type="number" min="1" max="20" step=".1" value="5"></label></div>',
 '<p class="clip-help">선택한 장면에 영상을 배경으로 배치해 글씨·그림을 위에 올릴 수 있어요. 15MB 이하 MP4·WebM·iPhone MOV(지원 코덱)를 사용할 수 있어요. 현재 단계에서는 <strong>음소거 미리보기</strong>를 제공하며 영상 클립의 내보내기는 아직 지원하지 않아요.</p>'
].join('');
$('studioTimeline').append(controls);
const fileInput=$('canvasVideoUpload'),remove=$('canvasVideoRemove'),inInput=$('canvasVideoIn'),
 lengthInput=$('canvasVideoLength'),nameLabel=$('canvasVideoName');
const preview=document.createElement('video');
preview.className='canvas-video-preview';
preview.setAttribute('playsinline','');
preview.setAttribute('webkit-playsinline','');
preview.preload='metadata';preview.muted=true;preview.loop=false;preview.controls=false;preview.hidden=true;
preview.setAttribute('aria-label','장면 영상 미리보기');
$('stage').prepend(preview);
let currentId='',currentUrl='',lastSourceDuration=0,serial=0,ready=false;
function project(){return Adapter.capture()}
function clip(){return Adapter.getSceneVideoClip?.()||null}
function release(){
 serial++;preview.pause();preview.removeAttribute('src');preview.load();preview.hidden=true;
 if(currentUrl)URL.revokeObjectURL(currentUrl);
 currentUrl='';currentId='';ready=false;lastSourceDuration=0;
}
async function persist(){
 // Clip changes contain file references: verify the managed project is committed.
 try{
  if(window.parent!==window&&window.parent.GulliverStudioBridge?.getState()?.activeKind==='canvas'){
   await window.parent.GulliverStudioBridge.sync(true);
   return true;
  }
  return false;
 }catch(e){notify('변경한 영상은 화면에 있지만 저장하지 못했어요. '+(e.message||e),true);return false}
}
function notify(message,error=false){
 const el=$('status');if(!el)return;el.textContent=message;el.style.color=error?'#b91c1c':'#51647a';
}
function controlsRefresh(meta){
 const value=meta||clip();
 nameLabel.textContent=value?value.name+' · 이 페이지 배경 영상':'이 장면에 연결한 영상이 없어요.';
 remove.disabled=!value;inInput.disabled=!value;lengthInput.disabled=!value;
 if(value&&document.activeElement!==inInput)inInput.value=value.inPoint;
 if(value&&document.activeElement!==lengthInput)lengthInput.value=value.duration;
}
async function mount(meta){
 if(!meta){release();return}
 if(currentId===meta.mediaId){
  if(ready&&preview.paused&&Math.abs(preview.currentTime-meta.inPoint)>0.08)preview.currentTime=meta.inPoint;
  return;
 }
 release();const request=serial,id=meta.mediaId;
 try{
  const record=await Adapter.getMedia(id);
  if(request!==serial)return;
  if(!record?.blob||record.mime!==meta.mime)throw Error('영상 파일 원본이 없습니다. 파일을 다시 연결해 주세요.');
  const url=URL.createObjectURL(record.blob);if(request!==serial){URL.revokeObjectURL(url);return}
  currentUrl=url;currentId=id;preview.src=url;preview.hidden=false;preview.muted=true;
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{cleanup();reject(Error('영상 정보를 불러오지 못했어요. 다른 파일을 사용해 주세요.'))},12000);
   const good=()=>{cleanup();resolve()},bad=()=>{cleanup();reject(Error('브라우저가 이 영상 형식을 재생하지 못해요.'))};
   const cleanup=()=>{clearTimeout(timeout);preview.removeEventListener('loadedmetadata',good);preview.removeEventListener('error',bad)};
   preview.addEventListener('loadedmetadata',good,{once:true});
   preview.addEventListener('error',bad,{once:true});
   preview.load();
  });
  if(request!==serial)return;
  lastSourceDuration=Number.isFinite(preview.duration)?preview.duration:0;
  ready=true;preview.currentTime=Math.min(Math.max(0,lastSourceDuration-.06),meta.inPoint);
 }catch(error){if(request===serial){release();notify('영상 미리보기: '+(error.message||error),true)}}
}
function refresh(){
 const meta=clip();controlsRefresh(meta);
 if(meta)mount(meta);
 else if(currentId)release();
}
function sync(local,playing,pageIndex){
 const meta=clip();
 if(project().active!==pageIndex)return;
 if(!meta||!ready||meta.mediaId!==currentId)return;
 const desired=meta.inPoint+Math.max(0,Math.min(local,meta.duration-.06));
 if(Math.abs(preview.currentTime-desired)>(playing ? .45 : .075)){
  try{preview.currentTime=Math.min(Math.max(0,lastSourceDuration-.06),desired)}catch(e){}
 }
 if(playing){if(preview.paused)preview.play().catch(()=>{})}
 else if(!preview.paused)preview.pause();
}
async function metadata(file){
 const url=URL.createObjectURL(file),el=document.createElement('video');
 try{
  el.preload='metadata';el.muted=true;el.playsInline=true;el.src=url;
  return await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{cleanup();reject(Error('영상 길이를 확인하지 못했어요.'))},12000);
   const ok=()=>{cleanup();resolve(el.duration)},err=()=>{cleanup();reject(Error('이 브라우저가 영상 코덱을 해석하지 못했어요.'))};
   const cleanup=()=>{clearTimeout(timeout);el.removeEventListener('loadedmetadata',ok);el.removeEventListener('error',err)};
   el.addEventListener('loadedmetadata',ok,{once:true});el.addEventListener('error',err,{once:true});el.load();
  });
 }finally{el.removeAttribute('src');el.load();URL.revokeObjectURL(url)}
}
async function importFile(file){
 if(!file||!MIMES.includes(file.type)||file.size<1||file.size>LIMIT)throw Error('15MB 이하 MP4·WebM·MOV 파일만 가져올 수 있어요.');
 if((await Store.media()).length>=18)throw Error('미디어 보관함의 18개 제한을 초과했어요. 사용하지 않는 원본을 정리해 주세요.');
 const duration=await metadata(file);
 if(!Number.isFinite(duration)||duration<1||duration>86400)throw Error('재생 길이가 올바르지 않은 영상이에요.');
 const entry={id:Core.id(),name:String(file.name||'장면 영상').slice(0,90),mime:file.type,
  blob:new Blob([file],{type:file.type}),createdAt:Date.now()};
 await Store.saveMedia(entry);
 const meta={mediaId:entry.id,name:entry.name,mime:entry.mime,inPoint:0,duration:Math.max(1,Math.min(20,Math.floor(duration*10)/10)),muted:true};
 Adapter.setSceneVideoClip(meta);
 const saved=await persist();
 notify(saved?'영상 클립을 장면에 연결하고 저장했어요. 재생해 확인하세요.':'영상 클립을 화면에 연결했어요. 저장 상태를 확인해 주세요.',!saved);
}
fileInput.addEventListener('change',async event=>{
 const file=event.target.files?.[0];event.target.value='';
 if(!file)return;
 try{await importFile(file)}catch(e){notify('영상 가져오기 실패: '+(e.message||e),true)}
});
remove.addEventListener('click',()=>{
 if(!clip())return;Adapter.setSceneVideoClip(null);persist().then(saved=>{
  notify(saved?'영상 배경을 제거하고 저장했어요. 원본은 미디어 보관함에 남아요.':'영상 배경을 제거했지만 자동 저장 상태를 확인해 주세요.',!saved);
 });
});
function changeTrim(origin){
 const old=clip();if(!old)return;
 const start=Number(inInput.value);let duration=Number(lengthInput.value);
 if(!Number.isFinite(start)||start<0||start>86400||!Number.isFinite(duration)||duration<1||duration>20){
  controlsRefresh(old);notify('시작 위치는 0초 이상, 재생 길이는 1~20초여야 해요.',true);return;
 }
 if(lastSourceDuration>0&&start+duration>lastSourceDuration+.051){
  // When users move the in-point, reduce the previous length automatically.
  duration=Math.floor((lastSourceDuration-start)*10)/10;
  if(duration<1){controlsRefresh(old);notify('남은 영상이 1초보다 짧아요.',true);return}
  lengthInput.value=String(duration);
 }
 Adapter.setSceneVideoClip({...old,inPoint:Math.round(start*10)/10,duration:Math.round(duration*10)/10});
 persist().then(saved=>notify(saved?
   (origin==='start'?'시작 위치를 변경하고 저장했어요.':'재생 길이를 변경하고 저장했어요.'):
   '클립은 변경됐지만 자동 저장 상태를 확인해 주세요.',!saved));
}
inInput.addEventListener('change',()=>changeTrim('start'));
lengthInput.addEventListener('change',()=>changeTrim('length'));
window.addEventListener('pagehide',release);
window.GulliverCanvasMedia={refresh,sync,release};
refresh();
})();