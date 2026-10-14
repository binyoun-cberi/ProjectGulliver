/* Visual media shelf and direct editing tools for the unified canvas. */
(()=>{
'use strict';
const C=window.GulliverUnifiedCore,S=window.GulliverStudioStorage,A=window.GulliverStudioAdapter,M=window.GulliverCanvasMedia,$=id=>document.getElementById(id);
if(!C||!S||!A||!M||!$('stage')||!$('studioTimeline'))return;
const stage=$('stage'),preview=stage.querySelector('.canvas-video-preview');
const panel=document.createElement('section');panel.className='easy-media';panel.setAttribute('aria-label','미디어 파일과 업로드');
panel.innerHTML=[
 '<header><strong>내 미디어</strong><small>썸네일과 파일명을 눌러 선택하세요</small></header>',
 '<div class="easy-import"><label for="easyMediaPicker">＋ 파일 가져오기 <span>⌄</span></label><input id="easyMediaPicker" type="file" accept=".mp4,.webm,.mov,.wav,.png,.jpg,.jpeg,video/*,audio/wav,image/png,image/jpeg" hidden multiple><button type="button" id="easyRefresh">새로고침</button></div>',
 '<div class="easy-drop" id="easyDrop">파일을 여기로 끌어놓아도 돼요 <small>영상 · 음악 · 사진</small></div>',
 '<div class="easy-progress" id="easyProgress" hidden role="status"><div><strong id="easyProgressName"></strong><span id="easyPercent">0%</span></div><progress id="easyProgressBar" max="100" value="0"></progress><small id="easyStep">파일 읽는 중</small></div>',
 '<div id="easyFiles" class="easy-files" aria-label="올린 미디어 목록"></div>',
 '<button type="button" id="easyEditVideo" class="easy-edit-video">↗ 화면에서 영상 크기 조절</button>'
].join('');
$('studioTimeline').prepend(panel);
const files=$('easyFiles'),picker=$('easyMediaPicker'),drop=$('easyDrop'),urls=new Map();
const setProgress=(name,value,step)=>{$('easyProgress').hidden=false;$('easyProgressName').textContent=name;$('easyPercent').textContent=value+'%';$('easyProgressBar').value=value;$('easyStep').textContent=step};
function kind(row){if(row.mime?.startsWith('video/'))return'video';if(row.mime==='audio/wav')return'audio';if(row.mime?.startsWith('image/'))return'image';return''}
function clearURLs(){for(const u of urls.values())URL.revokeObjectURL(u);urls.clear()}
async function refreshFiles(){
 clearURLs();files.replaceChildren();
 const rows=(await S.media()).filter(row=>kind(row)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 if(!rows.length){const p=document.createElement('p');p.className='easy-empty';p.textContent='아직 업로드한 파일이 없어요.';files.append(p);return}
 for(const row of rows){
  const button=document.createElement('button');button.type='button';button.className='easy-file';
  const thumb=document.createElement('span');thumb.className='easy-thumb';
  if(kind(row)!=='audio'){
   const url=URL.createObjectURL(row.blob);urls.set(row.id,url);
   const media=document.createElement(kind(row)==='video'?'video':'img');media.src=url;
   if(kind(row)==='video'){media.preload='metadata';media.muted=true;media.playsInline=true}
   thumb.append(media);
  }else thumb.textContent='♫';
  const text=document.createElement('span');text.className='easy-file-info';
  const strong=document.createElement('strong');strong.textContent=row.name;
  const small=document.createElement('small');small.textContent=({video:'영상',audio:'음악',image:'사진'})[kind(row)]+' · '+(row.blob.size/1048576).toFixed(1)+' MB';
  text.append(strong,small);button.append(thumb,text);
  button.addEventListener('click',async()=>{
   try{
    if(kind(row)==='video'){await M.attachStored(row);startLayout(true)}
    else if(kind(row)==='audio'){
     const select=$('audioFromShelf');$('refreshAudio').click();
     await new Promise(resolve=>setTimeout(resolve,200));
     select.value=row.id;select.dispatchEvent(new Event('change',{bubbles:true}));
    }else await A.insertImage(new File([row.blob],row.name,{type:row.mime}));
    for(const child of files.querySelectorAll('.easy-file'))child.classList.remove('is-active');
    button.classList.add('is-active');
   }catch(e){M.notify('파일을 불러오지 못했어요: '+(e.message||e),true)}
  });
  files.append(button);
 }
}
function readFile(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onprogress=e=>{if(e.lengthComputable)setProgress(file.name,Math.min(90,Math.round(e.loaded/e.total*90)),'기기에서 읽는 중')};
  reader.onerror=()=>reject(Error('파일 읽기에 실패했어요.'));
  reader.onload=()=>resolve(new File([reader.result],file.name,{type:file.type}));
  reader.readAsArrayBuffer(file);
 });
}
async function importOne(original){
 setProgress(original.name,0,'가져오기 시작');
 if(!original.size||original.size>15*1048576)throw Error('파일 크기는 15MB 이하여야 해요.');
 const file=await readFile(original);setProgress(file.name,92,'편집기에 연결 중');
 if(file.type.startsWith('video/'))await M.importFile(file);
 else if(['audio/wav','audio/x-wav','audio/wave'].includes(file.type)){
  const input=$('audioUpload'),transfer=new DataTransfer();
  transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,350));
 }else if(['image/png','image/jpeg'].includes(file.type)){
  await A.insertImage(file);
  if((await S.media()).length<18)await S.saveMedia({id:C.id(),name:file.name.slice(0,90),mime:file.type,blob:file,createdAt:Date.now()});
 }else throw Error('MP4·MOV·WebM·WAV·JPG·PNG만 사용할 수 있어요.');
 setProgress(file.name,100,'업로드 완료');await refreshFiles();
}
async function importMany(list){
 for(const f of [...list])try{await importOne(f)}catch(e){setProgress(f.name,0,'오류: '+(e.message||e));M.notify(e.message||String(e),true);return}
}
picker.addEventListener('change',e=>{const chosen=[...(e.target.files||[])];e.target.value='';importMany(chosen)});
$('easyRefresh').addEventListener('click',refreshFiles);
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging')});
drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');importMany(e.dataTransfer?.files||[])});
const track=document.createElement('div');track.className='easy-time-tracks';
track.innerHTML=[
 '<header><strong>타임라인</strong><small>막대의 양끝을 움직여 보세요</small></header>',
 '<div class="easy-track-label">▣ 영상 <span id="easyVideoTime"></span></div>',
 '<div class="easy-track-lane" id="easyVideoLane"><div class="easy-track-bar video" id="easyVideoBar"><span class="easy-handle" data-side="start"></span><strong id="easyVideoLabel"></strong><span class="easy-handle" data-side="end"></span></div></div>',
 '<div class="easy-track-label">♫ 음악 <span id="easyMusicTime"></span></div>',
 '<div class="easy-track-lane" id="easyMusicLane"><div class="easy-track-bar audio" id="easyMusicBar"><span class="easy-handle" data-side="start"></span><strong id="easyMusicLabel"></strong><span class="easy-handle" data-side="end"></span></div></div>',
 '<p class="easy-track-hint">영상은 양끝을 잡아 자르고, 음악은 아래 음량 조절과 반복 설정을 사용할 수 있어요.</p>'
].join('');
$('studioTimeline').append(track);
function updateTrack(){
 const clip=A.getSceneVideoClip(),audio=A.capture().audio;
 $('easyVideoBar').hidden=!clip;$('easyMusicBar').hidden=!audio;
 if(clip){$('easyVideoLabel').textContent=clip.name;$('easyVideoTime').textContent=clip.inPoint.toFixed(1)+' ~ '+(clip.inPoint+clip.duration).toFixed(1)+'초';$('easyVideoBar').style.width=Math.max(16,clip.duration/20*100)+'%'}
 if(audio){$('easyMusicLabel').textContent=audio.name;$('easyMusicTime').textContent='볼륨 '+Math.round(audio.volume*100)+'%'}
}
let trim=null;
$('easyVideoBar').addEventListener('pointerdown',e=>{
 const grip=e.target.closest('[data-side]'),clip=A.getSceneVideoClip();if(!grip||!clip)return;
 e.preventDefault();trim={side:grip.dataset.side,clip,x:e.clientX,width:$('easyVideoLane').getBoundingClientRect().width||260};
 e.currentTarget.setPointerCapture(e.pointerId);
});
$('easyVideoBar').addEventListener('pointermove',e=>{
 if(!trim)return;const dx=(e.clientX-trim.x)/trim.width*20;
 const length=trim.side==='end'?Math.max(1,Math.min(20,trim.clip.duration+dx)):Math.max(1,trim.clip.duration-dx);
 $('easyVideoBar').style.width=Math.max(16,length/20*100)+'%';
});
$('easyVideoBar').addEventListener('pointerup',e=>{
 if(!trim)return;const {side,clip,x,width}=trim;trim=null;
 const dx=Math.round((e.clientX-x)/width*200)/10;
 let start=clip.inPoint,length=clip.duration;
 if(side==='start'){start=Math.max(0,start+dx);length=Math.max(1,length-(start-clip.inPoint))}
 else length=Math.max(1,Math.min(20,length+dx));
 $('canvasVideoIn').value=start.toFixed(1);$('canvasVideoLength').value=length.toFixed(1);
 $('canvasVideoIn').dispatchEvent(new Event('change',{bubbles:true}));$('canvasVideoLength').dispatchEvent(new Event('change',{bubbles:true}));
 updateTrack();
});
$('easyVideoBar').addEventListener('pointercancel',()=>{trim=null;updateTrack()});
const selection=document.createElement('div');selection.className='easy-video-selection';selection.hidden=true;
selection.innerHTML='<span>영상 이동 · 모서리에서 크기 조절</span><b class="easy-video-grip"></b>';
stage.append(selection);let layout=false,drag=null;
function position(el,clip){Object.assign(el.style,{left:Math.round(clip.x)+'px',top:Math.round(clip.y)+'px',width:Math.round(clip.w)+'px',height:Math.round(clip.h)+'px'})}
function placeVideo(){
 const clip=A.getSceneVideoClip();if(!clip){selection.hidden=true;return}
 position(preview,clip);position(selection,clip);
 const items=[...stage.querySelectorAll('.item')],index=Math.max(0,Math.min(items.length,clip.stack||0));
 if(index<items.length)stage.insertBefore(preview,items[index]);else stage.insertBefore(preview,selection);
 stage.append(selection);selection.hidden=!layout;
}
function startLayout(value){layout=!!value;placeVideo();$('easyEditVideo').textContent=layout?'✓ 영상 배치 완료':'↗ 화면에서 영상 크기 조절'}
$('easyEditVideo').addEventListener('click',()=>startLayout(!layout));
selection.addEventListener('pointerdown',e=>{
 const clip=A.getSceneVideoClip();if(!clip)return;e.preventDefault();
 const dims=C.LAYOUTS[A.capture().layout],scale=stage.getBoundingClientRect().width/dims.w;
 drag={x:e.clientX,y:e.clientY,base:{x:clip.x,y:clip.y,w:clip.w,h:clip.h},scale,resize:!!e.target.closest('.easy-video-grip')};
 selection.setPointerCapture(e.pointerId);
});
selection.addEventListener('pointermove',e=>{
 if(!drag)return;const d=drag,b={...d.base},dx=(e.clientX-d.x)/d.scale,dy=(e.clientY-d.y)/d.scale;
 if(d.resize){b.w=Math.max(60,b.w+dx);b.h=Math.max(40,b.h+dy)}else{b.x+=dx;b.y+=dy}
 position(preview,b);position(selection,b);
});
selection.addEventListener('pointerup',e=>{
 if(!drag)return;const d=drag;drag=null,b={...d.base},dx=(e.clientX-d.x)/d.scale,dy=(e.clientY-d.y)/d.scale;
 if(d.resize){b.w=Math.max(60,b.w+dx);b.h=Math.max(40,b.h+dy)}else{b.x+=dx;b.y+=dy}
 A.setSceneVideoLayout(b);placeVideo();
});
selection.addEventListener('pointercancel',()=>{drag=null;placeVideo()});
const menu=document.createElement('div');menu.className='easy-layer-menu';menu.hidden=true;menu.setAttribute('role','menu');
menu.innerHTML='<strong>레이어 순서</strong><button data-action="front">맨 앞으로</button><button data-action="up">한 칸 앞으로</button><button data-action="down">한 칸 뒤로</button><button data-action="back">맨 뒤로</button><button data-action="background">사진을 배경으로</button>';
document.body.append(menu);let layerTarget='';
function openMenu(id,x,y,isImage){layerTarget=id;menu.querySelector('[data-action="background"]').hidden=!isImage;menu.hidden=false;menu.style.left=Math.max(8,Math.min(innerWidth-190,x))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-250,y))+'px'}
selection.addEventListener('contextmenu',e=>{e.preventDefault();openMenu('__video__',e.clientX,e.clientY,false)});
stage.addEventListener('contextmenu',e=>{const el=e.target.closest('.item');if(!el)return;e.preventDefault();openMenu(el.dataset.id,e.clientX,e.clientY,el.dataset.type==='image')});
menu.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
 if(action==='background')A.setImageAsBackground(layerTarget);else A.arrangeMediaLayer(layerTarget,action);
 menu.hidden=true;placeVideo();
});
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target))menu.hidden=true});
const prior=M.refresh.bind(M);M.placeVideo=placeVideo;M.refresh=()=>{prior();placeVideo();updateTrack()};
$('audioVolume').addEventListener('input',updateTrack);
window.addEventListener('pagehide',clearURLs);
refreshFiles().catch(()=>{});placeVideo();updateTrack();
})();
