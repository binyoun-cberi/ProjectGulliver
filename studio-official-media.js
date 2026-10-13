(()=>{
'use strict';
const isVideo=document.body.dataset.officialKind==='video';
const kind=isVideo?'filmcraft':'soundcraft';
const title=isVideo?'FilmCraft':'SoundCraft';
const root='assets/artcraft/'+kind+'/';
const shortName=isVideo?'영상':'음악';
const q=id=>document.getElementById(id);
const Store=window.GulliverStudioStorage,Official=window.GulliverOfficialProjectCore;
const requestedOfficialId=new URLSearchParams(location.search).get('officialId')||'';
let restoredOfficial=false,restoringOfficial=false;
const frame=q('officialEditorFrame'),panel=q('officialEditorPanel'),simple=q('simpleEditor');
const status=q('officialStatus'),help=q('officialHelp'),link=q('officialExternal');
const tabs=[q('simpleMode'),q('officialMode')];
let available=null,loaded=false,selected='simple',ready=false,loadingSince=0,checker=null,loadError='',relPath='index.html';
const restoreQuick=new URLSearchParams(location.search).get('editor')==='simple';
let userSelectedMode=false;
const TIMEOUT_MS=90000;
function announce(message,state='ok'){
 status.textContent=message;status.dataset.state=state==='error'?'error':state;
}
function sendState(){
 if(window.parent===window)return;
 try{window.parent.postMessage({type:'gulliver:official-media',kind:isVideo?'video':'music',advanced:selected==='official',ready},location.origin)}catch(e){}
}
function informParent(){
 if(window.parent!==window)try{window.parent.postMessage({type:'gulliver:official-saved',kind:isVideo?'video':'music'},location.origin)}catch(e){}
}
const uid=()=>crypto.randomUUID?.()||'official_'+Date.now().toString(36)+Math.random().toString(36).slice(2);
async function storeNative(file){
 if(!Official||!Store)throw Error('공식 작업 보관함이 준비되지 않았어요.');
 const expected=isVideo?'video':'music';await Official.validateFile(file,expected);
 if((await Store.official()).length>=Official.MAX_ITEMS)throw Error('고급 작업 보관함은 최대 30개예요. 기존 항목을 내려받아 보관하고 정리해 주세요.');
 const now=Date.now(),record={id:uid(),kind:expected,name:Official.safeName(file.name,expected),title:file.name.replace(/\.(fcproj|scraftz)$/i,''),size:file.size,createdAt:now,updatedAt:now,blob:new Blob([file],{type:Official.TYPES[expected].mime})};
 await Store.saveOfficial(record);informParent();
 announce(record.name+' 파일을 내 작업에 보관했어요. 고급 편집 과정은 자동 동기화되지 않으니 수정 후 다시 저장해 주세요.','ready');
 return record;
}
async function loadNative(id){
 if(restoredOfficial||restoringOfficial||!ready)return;
 restoringOfficial=true;
 try{
  if(!/^[\w-]{1,110}$/.test(id))throw Error('고급 프로젝트 ID가 올바르지 않아요.');
  const record=await Store.getOfficial(id),expected=isVideo?'video':'music';
  if(!record||record.kind!==expected)throw Error('이 기기의 작업 보관함에서 원본을 찾지 못했어요.');
  await Official.validateFile(new File([record.blob],record.name,{type:record.blob.type}),expected);
  const w=frame.contentWindow;
  if(isVideo){
   if(typeof w?.filmcraft?.openProject!=='function')throw Error('FilmCraft 프로젝트 열기 기능을 불러오지 못했어요.');
   await w.filmcraft.openProject(new File([record.blob],record.name,{type:'application/json'}));
   announce('“'+record.name+'” 프로젝트를 FilmCraft에서 열었어요. 원본 영상·사진이 누락되었다면 별도로 다시 연결해 주세요.','ready');
  }else{
   const canvas=frame.contentDocument?.getElementById('soundcraft_canvas');
   if(!canvas)throw Error('SoundCraft 편집 화면이 준비되지 않았어요.');
   const data=new w.DataTransfer();data.items.add(new w.File([record.blob],record.name,{type:'application/zip'}));
   for(const type of ['dragenter','dragover','drop'])canvas.dispatchEvent(new w.DragEvent(type,{bubbles:true,cancelable:true,dataTransfer:data}));
   announce('“'+record.name+'”을 SoundCraft 편집기로 전달했어요. 화면에서 실제 트랙·오디오가 복원됐는지 확인해 주세요.','ready');
  }
  restoredOfficial=true;
 }catch(e){announce('고급 작업 재열기 실패: '+(e.message||e)+'. 파일을 내려받아 공식 편집기에서 직접 열 수도 있어요.','error')}
 finally{restoringOfficial=false}
}
async function saveFilmcraft(){
 if(!isVideo||!ready)throw Error('FilmCraft 실행 준비 후 저장해 주세요.');
 const film=frame.contentWindow.filmcraft;
 const filename='FilmCraft-'+new Date().toISOString().replace(/[:.]/g,'-')+'.fcproj';
 const path='/exports/'+filename;
 await film.execute('file.saveAs',{path});
 const bytes=await film.readFile(path);
 if(!bytes?.length)throw Error('FilmCraft 프로젝트 내보내기가 비어 있어요.');
 await storeNative(new File([bytes],filename,{type:'application/json'}));
}
function stopChecking(){if(checker!==null){clearInterval(checker);checker=null}}
function capabilities(){
 const gl=(()=>{try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}})();
 return {
  secureContext:window.isSecureContext,webAssembly:typeof WebAssembly!=='undefined',
  webgl2:gl,webgpu:!!navigator.gpu,webcodecs:typeof VideoDecoder!=='undefined',
  audioContext:typeof (window.AudioContext||window.webkitAudioContext)!=='undefined',
  mediaDevices:!!navigator.mediaDevices,crossOriginIsolated:window.crossOriginIsolated,
  userAgent:navigator.userAgent
 };
}
function runtime(){
 try{
  const w=frame.contentWindow,d=frame.contentDocument;
  if(!w||!d||!d.body)return {ready:false,error:'편집기 화면 문서가 아직 준비되지 않았어요.'};
  if(isVideo){
   const load=w.filmcraftLoad||{};
   const crash=String(load.fatal||'');
   const fail=String(load.error||'');
   const fatalVisible=d.getElementById('fatal')?.classList.contains('on');
   return {
    ready:!!(load.readyMs&&w.filmcraft&&!crash&&!fatalVisible),
    error:crash||fail||'',
    startupMs:load.readyMs||null,wasmMs:load.wasmMs||null,
    fatalVisible:!!fatalVisible,
    diagnostics:typeof w.filmcraft?.info==='function'?'Control API available':'API waiting'
   };
  }
  const loading=d.getElementById('soundcraft_loading');
  const text=loading?.textContent||'';
  const error=/SoundCraft failed to start:/i.test(text)?text:'';
  return {ready:!loading&&!!d.getElementById('soundcraft_canvas'),
   error,wasmBindings:!!w.wasmBindings,loaderVisible:!!loading};
 }catch(e){return{ready:false,error:'편집기 상태를 읽지 못했어요: '+String(e)}}
}
function showTroubleshooting(){
 q('officialRetry').hidden=false;
 q('officialWebgl').hidden=false;
 q('officialCpu').hidden=!isVideo;
}
function poll(){
 if(selected!=='official'||!loaded)return;
 const r=runtime();
 if(r.ready){
  if(!ready){
   ready=true;stopChecking();
   q('officialRetry').hidden=false;
   q('officialWebgl').hidden=false;
   q('officialCpu').hidden=!isVideo;
   announce(title+' 실행 준비 완료. 고급 프로그램 안에서 파일을 편집하고 별도로 저장해 주세요.','ready');
   sendState();
   if(requestedOfficialId)loadNative(requestedOfficialId).catch(e=>announce('고급 프로젝트를 열지 못했어요: '+e.message,'error'));
  }
  return;
 }
 if(r.error || Date.now()-loadingSince>TIMEOUT_MS){
  loadError=r.error||'90초 안에 프로그램을 시작하지 못했어요.';
  ready=false;stopChecking();showTroubleshooting();
  announce(title+' 실행을 확인하지 못했어요: '+loadError+'. 다시 시작 또는 WebGL 호환 모드를 시도하세요.','error');
 }else{
  announce(title+' WebAssembly 프로그램을 초기화하는 중… 이 기기에서 첫 실행은 시간이 걸릴 수 있어요.','loading');
 }
}
function start(mode='normal'){
 stopChecking();ready=false;restoredOfficial=false;loaded=true;loadingSince=Date.now();loadError='';
 const query=mode==='webgl'?'?webgl':mode==='cpu'?'?cpu':'';
 relPath='index.html'+query;
 frame.src=root+relPath;
 q('officialRetry').hidden=true;q('officialWebgl').hidden=true;q('officialCpu').hidden=true;
 announce(title+' 공식 프로그램을 시작하는 중…','loading');
 checker=setInterval(poll,800);sendState();
}
function show(mode){
 if(mode==='official'&&available!==true)return;
 selected=mode;
 simple.hidden=mode!=='simple';panel.hidden=mode!=='official';
 for(const tab of tabs)tab.setAttribute('aria-selected',String(tab===q(mode==='simple'?'simpleMode':'officialMode')));
 if(mode==='official'){
  if(!loaded)start();
  else if(!ready&&!checker){loadingSince=Date.now();checker=setInterval(poll,800)}
 }
 else stopChecking();
 sendState();
}
async function diagnose(){
 const r=runtime(),caps=capabilities();
 let info=null;
 if(isVideo&&r.ready){
  try{info=await Promise.race([
   Promise.resolve(frame.contentWindow.filmcraft.info()),
   new Promise((_,reject)=>setTimeout(()=>reject(Error('성능 점검 시간 초과')),6000))
  ])}catch(e){info={error:String(e)}}
 }
 const report={app:title,build:document.getElementById('officialVersion').textContent,
   mode:selected,entry:frame.getAttribute('src')||null,
   ready:r.ready,loadError,capabilities:caps,runtime:r,
   filmcraftInfo:info,checkedAt:new Date().toISOString()};
 const block=q('officialDiagnosticReport');
 block.textContent=JSON.stringify(report,null,2);
 block.hidden=false;
 return report;
}
async function check(){
 q('officialMode').disabled=true;link.href=root+'index.html';
 help.textContent=title+' 공식 프로그램은 간편 제작기와 저장 형식이 달라요. 프로젝트 파일은 공식 프로그램 안에서 별도로 저장해 주세요.';
 try{
  const response=await fetch(root+'gulliver-install.json',{cache:'no-store'});
  if(!response.ok)throw Error('공식 웹 프로그램 설치가 끝나지 않았어요.');
  const manifest=await response.json();
  if(manifest.source!=='storytold/'+kind||!manifest.version)throw Error('원본 실행 파일의 출처를 확인할 수 없어요.');
  const entry=await fetch(root+'index.html',{method:'HEAD'});
  if(!entry.ok)throw Error('공식 편집기 HTML 파일을 찾지 못했어요.');
  available=true;q('officialMode').disabled=false;
  q('officialMode').textContent='고급 편집 · '+title+' '+manifest.version;
  q('officialVersion').textContent='ArtCraft 공식 '+title+' '+manifest.version;
  // Do not replace an explicitly chosen mode, or hide a saved quick project
  // behind the separately stored official WASM editor after async verification.
  if((requestedOfficialId||!restoreQuick)&&!userSelectedMode)show('official');
 }catch(e){
  available=false;announce('간편 편집은 정상 사용 가능해요. 고급 프로그램 확인 실패: '+e.message,'error');
 }
}
q('officialProjectUpload').addEventListener('change',async e=>{
 const files=Array.from(e.target.files||[]);e.target.value='';
 for(const file of files){try{await storeNative(file)}catch(err){announce('파일을 보관하지 못했어요: '+(err.message||err),'error');break}}
});
q('officialSaveNow').hidden=!isVideo;
q('officialSaveNow').addEventListener('click',async()=>{
 const btn=q('officialSaveNow');btn.disabled=true;
 try{await saveFilmcraft()}catch(e){announce('FilmCraft 원본 저장 실패: '+(e.message||e),'error')}
 finally{btn.disabled=false}
});
q('simpleMode').addEventListener('click',()=>{userSelectedMode=true;show('simple')});
q('officialMode').addEventListener('click',()=>{userSelectedMode=true;show('official')});
q('officialRetry').addEventListener('click',()=>start());
q('officialWebgl').addEventListener('click',()=>start('webgl'));
q('officialCpu').addEventListener('click',()=>{if(isVideo)start('cpu')});
q('officialDiagnostics').addEventListener('click',()=>{diagnose().catch(e=>announce('환경 점검 실패: '+e.message,'error'))});
frame.addEventListener('load',()=>{if(selected==='official')poll()});
window.addEventListener('pagehide',stopChecking);
if(isVideo){
 q('simpleMode').textContent='간편 영상 · 45초 이내';
 q('officialDescription').textContent='공식 FilmCraft는 간편 모드의 45초 제한과 관계없이 편집해요. 웹 브라우저·코덱·기기 성능에 따라 긴 영상의 출력 가능 범위가 달라요.';
}else{
 q('simpleMode').textContent='간편 음악 · 16박자';
 q('officialDescription').textContent='SoundCraft는 다중 트랙 오디오·MIDI 편집 도구예요. 소리를 들으려면 편집기 내부를 클릭해 오디오 재생을 허용해야 할 수 있어요.';
}
show('simple');check();
})();