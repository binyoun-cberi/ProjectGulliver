(()=>{
'use strict';
const isVideo=document.body.dataset.officialKind==='video';
const kind=isVideo?'filmcraft':'soundcraft';
const title=isVideo?'FilmCraft':'SoundCraft';
const root='assets/artcraft/'+kind+'/';
const shortName=isVideo?'영상':'음악';
const q=id=>document.getElementById(id);
const frame=q('officialEditorFrame');
const panel=q('officialEditorPanel');
const simple=q('simpleEditor');
const status=q('officialStatus');
const help=q('officialHelp');
const link=q('officialExternal');
const tabs=[q('simpleMode'),q('officialMode')];
let available=null,loaded=false,selected='simple';
function announce(text,error=false){
 status.textContent=text;
 status.dataset.state=error?'error':'ok';
}
function sendState(){
 try{
  if(window.parent!==window){
   window.parent.postMessage({type:'gulliver:official-media',kind:isVideo?'video':'music',advanced:selected==='official'},location.origin);
  }
 }catch(e){}
}
function show(mode){
 if(mode==='official'&&available!==true)return;
 selected=mode;
 simple.hidden=mode!=='simple';
 panel.hidden=mode!=='official';
 for(const tab of tabs)tab.setAttribute('aria-selected',String(tab===q(mode==='simple'?'simpleMode':'officialMode')));
 if(mode==='official'&&!loaded){
  // The vendor HTML is served from the same static origin; no media files
  // are uploaded to a remote website.
  frame.src=root+'index.html';
  loaded=true;
  announce(title+' 공식 웹 편집기를 여는 중이에요.');
 }
 sendState();
}
async function check(){
 q('officialMode').disabled=true;
 link.href=root+'index.html';
 help.textContent=title+' 공식 웹 편집기는 기존 간편 모드와 프로젝트 형식이 달라요. 고급 편집기의 작업은 프로그램 안에서 따로 저장하고 열어야 해요.';
 try{
  const response=await fetch(root+'gulliver-install.json',{cache:'no-store'});
  if(!response.ok)throw Error('아직 공식 웹 프로그램 설치가 끝나지 않았어요.');
  const info=await response.json();
  if(info.source!=='storytold/'+kind||!info.version)throw Error('공식 웹 파일의 출처를 확인하지 못했어요.');
  const index=await fetch(root+'index.html',{method:'HEAD'});
  if(!index.ok)throw Error('공식 편집기 HTML 파일이 없어요.');
  available=true;
  q('officialMode').disabled=false;
  q('officialMode').textContent='고급 편집 · '+title+' '+info.version;
  q('officialVersion').textContent='ArtCraft 공식 '+title+' '+info.version;
  announce('ArtCraft 공식 '+title+' 웹 편집기가 설치되어 있어요. 고급 편집을 선택해 주세요.');
 }catch(err){
  available=false;
  announce('간편 편집은 정상 사용 가능해요. 고급 편집 설치 확인 중: '+err.message,true);
 }
}
q('simpleMode').addEventListener('click',()=>show('simple'));
q('officialMode').addEventListener('click',()=>show('official'));
frame.addEventListener('load',()=>{
 if(selected==='official')announce(title+' 편집기 화면을 열었어요. 일부 기능은 브라우저 그래픽·오디오 지원에 따라 제한될 수 있어요.');
});
q('officialExternal').addEventListener('click',()=>sendState());
if(isVideo){
 q('simpleMode').textContent='간편 영상 · 45초 이내';
 q('officialDescription').textContent='공식 FilmCraft는 타임라인, 오디오, 자막, 색보정과 영상 출력을 지원해요. 간편 모드의 45초 상한을 적용하지 않아요. 큰 영상은 컴퓨터 성능에 따라 느려질 수 있어요.';
}else{
 q('simpleMode').textContent='간편 음악 · 16박자';
 q('officialDescription').textContent='공식 SoundCraft는 여러 오디오·MIDI 트랙, 녹음과 믹싱을 지원해요. 간편 모드의 16박자 제한과 별개로 작동해요.';
}
show('simple');check();
})();