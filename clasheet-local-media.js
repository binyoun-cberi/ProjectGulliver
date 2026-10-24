(function mediaApp(){
'use strict';
const C=window.ClasheetLocalMediaCore,$=id=>document.getElementById(id),KEY='clasheet.localMedia.scene.v1';
let db,files=[],scene={items:[]},selected='',objectUrls=new Map(),drag=null;
const uniqueId=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
const byId=id=>files.find(f=>f.id===id),chosen=()=>scene.items.find(i=>i.id===selected);
const msg=(text,bad=false)=>{$('status').textContent=text;$('status').dataset.bad=String(bad)};
function create(tag,txt,cls=''){const e=document.createElement(tag);if(txt!==undefined)e.textContent=String(txt);if(cls)e.className=cls;return e}
function button(label,fn,cls=''){const e=create('button',label,cls);e.type='button';e.onclick=fn;return e}
function fileUrl(item){if(!item)return'';if(!objectUrls.has(item.id))objectUrls.set(item.id,URL.createObjectURL(item.blob));return objectUrls.get(item.id)}
function openDB(){return new Promise((resolve,reject)=>{
 const req=indexedDB.open('clasheet.localMedia.v1',1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('저장 공간을 사용할 수 없어요.'));
})}
function op(method,arg,mode='readonly'){return new Promise((resolve,reject)=>{
 const tx=db.transaction('files',mode),q=tx.objectStore('files')[method](arg);
 q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||Error('파일 저장에 실패했어요.'));
 tx.onabort=()=>reject(tx.error||Error('저장 공간이 부족해요.'));
})}
function save(){try{localStorage.setItem(KEY,JSON.stringify(C.cleanScene(scene)))}catch{msg('장면 배치를 저장할 수 없어요. 저장 공간을 확인해 주세요.',true)}}
function getScene(){try{scene=C.cleanScene(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{scene={items:[]};msg('장면 기록이 손상돼 기본 화면으로 열었어요.',true)}}
function preview(file){
 const body=$('previewBody');body.replaceChildren();
 const kind=file.kind;
 const el=document.createElement(kind==='image'?'img':kind==='video'?'video':'audio');
 el.src=fileUrl(file);el.setAttribute('aria-label',file.name);
 if(kind!=='image'){el.controls=true;el.preload='metadata';}if(kind==='video')el.playsInline=true;
 body.append(el);$('previewTitle').textContent=file.name;$('previewDialog').showModal();
}
function download(file){
 const a=create('a');a.href=fileUrl(file);a.download=file.name;document.body.append(a);a.click();a.remove();
}
async function deleteAsset(file){
 if(!confirm('이 원본 파일과 연결된 장면 레이어를 삭제할까요?'))return;
 try{await op('delete',file.id,'readwrite');
 if(objectUrls.has(file.id)){URL.revokeObjectURL(objectUrls.get(file.id));objectUrls.delete(file.id);}
 files=files.filter(f=>f.id!==file.id);scene.items=scene.items.filter(i=>i.assetId!==file.id);
 if(!scene.items.some(i=>i.id===selected))selected='';save();renderShelf();renderStage();msg('원본 파일을 삭제했어요.');
 }catch(e){msg(e.message,true)}
}
function renderShelf(){
 const shelf=$('shelf');shelf.replaceChildren();$('count').textContent=files.length+'개 · '+(files.reduce((n,f)=>n+f.size,0)/1048576).toFixed(1)+'MB / 60MB';
 $('empty').hidden=files.length>0;
 for(const f of files){
  const card=create('article',undefined,'asset');
  const thumb=create('div',undefined,'thumb');
  if(f.kind==='image'){const img=create('img');img.src=fileUrl(f);img.alt='';thumb.append(img)}
  else thumb.append(create('strong',f.kind==='video'?'▶':'♫'));
  const info=create('div',undefined,'asset-info');info.append(create('strong',f.name),create('small',({image:'사진',video:'영상',audio:'음악'})[f.kind]+' · '+(f.size/1048576).toFixed(1)+'MB'));
  const controls=create('div',undefined,'asset-actions');
  if(f.kind!=='audio')controls.append(button('장면에 넣기',()=>addLayer(f.kind,f.id),'asset-add'));
  controls.append(button('보기',()=>preview(f)),button('원본 저장',()=>download(f)),button('삭제',()=>deleteAsset(f)));
  card.append(thumb,info,controls);shelf.append(card);
 }
}
async function upload(list){
 let added=0;
 for(const file of Array.from(list||[])){
  try{
   const safe=C.validateFile(file);
   if(files.length>=40||files.reduce((n,f)=>n+f.size,0)+file.size>60*1024*1024)throw Error('최대 40개·총 60MB까지만 보관할 수 있어요.');
   const saved={...safe,id:uniqueId(),blob:file,at:new Date().toISOString()};
   await op('put',saved,'readwrite');files.unshift(saved);added++;
  }catch(e){msg(file.name+' · '+e.message,true)}
 }
 renderShelf();if(added)msg(added+'개 파일을 이 브라우저에 보관했어요.');
}
function addLayer(kind,assetId='',value=''){
 if(scene.items.length>=50)return msg('한 장면은 50개 레이어까지 지원해요.',true);
 const i=C.cleanLayer({id:uniqueId(),kind,assetId,text:value,x:80+60*(scene.items.length%5),y:85+35*(scene.items.length%5),w:kind==='text'?310:390,h:kind==='text'?65:220});
 scene.items.push(i);selected=i.id;save();renderStage();msg('장면에 추가했어요. 드래그 또는 화살표 키로 움직일 수 있어요.');
}
function paint(el,i){
 el.style.left=i.x/960*100+'%';el.style.top=i.y/540*100+'%';el.style.width=i.w/960*100+'%';el.style.height=i.h/540*100+'%';
}
function makeLayer(i,index){
 const layer=create('div',undefined,'layer'+(selected===i.id?' selected':''));
 layer.dataset.id=i.id;layer.tabIndex=0;layer.setAttribute('role','group');layer.setAttribute('aria-label',(i.kind==='text'?i.text:byId(i.assetId)?.name||'미디어')+' · '+(index+1)+'번째 레이어');
 paint(layer,i);
 if(i.kind==='text')layer.append(create('span',i.text,'layer-text'));
 else{
  const f=byId(i.assetId);if(f){const media=create(i.kind==='image'?'img':'video');media.src=fileUrl(f);media.draggable=false;
   if(i.kind==='video'){media.muted=true;media.playsInline=true;media.preload='metadata';media.addEventListener('loadedmetadata',()=>{if(i.trimStart)media.currentTime=i.trimStart;});media.addEventListener('timeupdate',()=>{if(i.trimEnd>i.trimStart&&media.currentTime>=i.trimEnd){media.pause();media.currentTime=i.trimStart;}})}
   layer.append(media);
  }else layer.append(create('span','원본 없음'));
 }
 const handle=button('↘',()=>{},'resize');handle.tabIndex=-1;handle.setAttribute('aria-label','레이어 크기 조절');layer.append(handle);
 layer.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();selected=i.id;
  drag={id:i.id,x:e.clientX,y:e.clientY,lx:i.x,ly:i.y,w:i.w,h:i.h,resize:!!e.target.closest('.resize')};
  layer.setPointerCapture(e.pointerId);layer.classList.add('selected');updateControls();
 });
 layer.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==i.id)return;
  const rect=$('stage').getBoundingClientRect(),dx=(e.clientX-drag.x)*960/rect.width,dy=(e.clientY-drag.y)*540/rect.height;
  if(drag.resize){i.w=C.clamp(drag.w+dx,50,960-i.x);i.h=C.clamp(drag.h+dy,35,540-i.y);}
  else{i.x=C.clamp(drag.lx+dx,0,960-i.w);i.y=C.clamp(drag.ly+dy,0,540-i.h);}
  paint(layer,i);
 });
 function finish(){if(drag?.id!==i.id)return;drag=null;save();renderStage();}
 layer.addEventListener('pointerup',finish);layer.addEventListener('pointercancel',finish);
 layer.onclick=e=>{e.stopPropagation();selected=i.id;renderStage()};
 layer.onkeydown=e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
  selected=i.id;const n=e.shiftKey?20:4;
  i.x=C.clamp(i.x+(e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0),0,960-i.w);
  i.y=C.clamp(i.y+(e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0),0,540-i.h);
  save();renderStage();$('stage').querySelector('[data-id="'+i.id+'"]')?.focus();
 };
 return layer;
}
function updateControls(){
 const i=chosen();
 for(const id of ['front','back','removeLayer'])$(id).disabled=!i;
 $('background').disabled=!i||i.kind!=='image';
 $('trim').hidden=!i||i.kind!=='video';
 if(i?.kind==='video'){$('trimStart').value=i.trimStart;$('trimEnd').value=i.trimEnd;}
 $('layersCount').textContent=scene.items.length+'개 레이어';
}
function renderStage(){
 $('stage').replaceChildren(...scene.items.map((i,index)=>makeLayer(i,index)));
 updateControls();
}
function order(offset){
 const idx=scene.items.findIndex(i=>i.id===selected);if(idx<0)return;
 const to=C.clamp(idx+offset,0,scene.items.length-1);
 if(to===idx)return;const [item]=scene.items.splice(idx,1);scene.items.splice(to,0,item);save();renderStage();
}
function makeBackground(){
 const idx=scene.items.findIndex(i=>i.id===selected),item=scene.items[idx];
 if(!item||item.kind!=='image')return;
 item.x=0;item.y=0;item.w=960;item.h=540;scene.items.splice(idx,1);scene.items.unshift(item);save();renderStage();msg('사진을 장면 배경으로 지정했어요.');
}
function exportLayout(){
 const blob=new Blob([JSON.stringify({format:KEY,scene:C.cleanScene(scene)},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=create('a');link.href=url;link.download='클라시트_장면배치.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 msg('장면 배치만 내보냈어요. 원본 파일은 보관함에서 따로 저장해야 해요.');
}
async function init(){
 try{
  db=await openDB();files=await op('getAll');files.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  getScene();scene.items=scene.items.filter(i=>i.kind==='text'||byId(i.assetId));
  renderShelf();renderStage();msg('미디어 원본은 서버로 전송되지 않고 이 브라우저에 저장돼요.');
 }catch(e){msg('파일 보관함을 열지 못했어요. 브라우저 저장 설정을 확인해 주세요. '+e.message,true);$('upload').disabled=true;return;}
 $('upload').onchange=async e=>{await upload(e.target.files);e.target.value=''};
 $('addText').onclick=()=>{const t=prompt('장면에 넣을 글씨를 입력하세요.','오늘의 수업');if(t?.trim())addLayer('text','',t.slice(0,240))};
 $('front').onclick=()=>order(1);$('back').onclick=()=>order(-1);$('background').onclick=makeBackground;
 $('removeLayer').onclick=()=>{const i=scene.items.findIndex(i=>i.id===selected);if(i<0)return;scene.items.splice(i,1);selected='';save();renderStage()};
 $('clearStage').onclick=()=>{if(!confirm('현재 장면을 비울까요? 원본 파일은 보존됩니다.'))return;scene.items=[];selected='';save();renderStage()};
 $('exportLayout').onclick=exportLayout;$('closePreview').onclick=()=>$('previewDialog').close();$('previewDialog').addEventListener('close',()=>$('previewBody').replaceChildren());
 $('stage').onclick=e=>{if(e.target===$('stage')){selected='';renderStage()}};
 for(const id of ['trimStart','trimEnd'])$(id).onchange=()=>{
  const i=chosen();if(!i||i.kind!=='video')return;
  const a=Number($('trimStart').value)||0,b=Number($('trimEnd').value)||0;
  if(a<0||b<0||b>0&&b<=a){msg('종료 지점은 시작 지점보다 커야 해요.',true);return;}
  i.trimStart=a;i.trimEnd=b;save();msg('영상 재생 범위만 저장했어요. 원본 영상은 변경되지 않아요.');
 };
 window.ClasheetLocalMedia=Object.freeze({state:()=>({files:files.map(x=>({id:x.id,name:x.name,kind:x.kind})),scene:C.cleanScene(scene)})});
}
window.addEventListener('beforeunload',()=>{for(const url of objectUrls.values())URL.revokeObjectURL(url)});
init();
})();
