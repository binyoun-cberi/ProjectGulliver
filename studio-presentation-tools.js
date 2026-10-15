/* Classroom presenter dock. One canvas stays mounted while native teacher tools
 * run in an overlay; return to the exact slide/time without restarting the lesson. */
(()=>{
'use strict';
const A=window.GulliverStudioAdapter,L=window.GulliverTeacherLive;
const stageView=document.getElementById('stageView');
if(!stageView||!A||!L)return;
const liveTools=L.listTools?.()||[];
const dock=document.createElement('nav');
dock.id='lessonPresenterDock';dock.className='lesson-presenter-dock';
dock.setAttribute('aria-label','발표 중 수업 도구와 슬라이드 조작');
dock.innerHTML=[
 '<div class="lesson-presenter-main">',
 '<button type="button" id="lessonPrev" aria-label="이전 슬라이드">‹</button>',
 '<button type="button" id="lessonPlayPause" aria-label="슬라이드 재생 일시정지">⏸</button>',
 '<span id="lessonSlideCount" class="lesson-slide-count" aria-live="off">1 / 1</span>',
 '<button type="button" id="lessonNext" aria-label="다음 슬라이드">›</button>',
 '<button type="button" id="lessonOpenTools" class="lesson-open-tools" aria-expanded="false" aria-controls="lessonToolPicker">▣ 수업 도구</button>',
 '<button type="button" id="lessonExit" aria-label="발표 종료">× 종료</button>',
 '</div>',
 '<section id="lessonToolPicker" class="lesson-tool-picker" aria-label="수업 중 실행할 교사 도구" hidden>',
 '<div class="lesson-tool-picker-head"><strong>수업 도구</strong><span>도구 사용 후 원래 슬라이드로 돌아와요</span></div>',
 '<div class="lesson-tool-picker-grid" id="lessonToolPickerGrid"></div>',
 '</section>'
].join('');
stageView.append(dock);
const by=id=>document.getElementById(id);
const picker=by('lessonToolPicker'),toolsButton=by('lessonOpenTools');
let suspended=null;let lastActive=false,lastClock='',lastPageText='',lastPlaying=null;
const present=()=>A.isPresentationActive?.()||false;
function sync(force=false){
 const active=present();
 dock.classList.toggle('lesson-is-active',active);
 if(!active){setPicker(false);lastActive=false;lastClock='';lastPageText='';lastPlaying=null;return}
 if(!lastActive){lastActive=true;setPicker(false);force=true}
 const clock=by('timelineClock')?.textContent||'',pageText=by('pageStrip')?.querySelector('.page.active')?.textContent||'';
 const playing=A.isPlaying();
 if(!force&&clock===lastClock&&pageText===lastPageText&&playing===lastPlaying)return;
 lastClock=clock;lastPageText=pageText;lastPlaying=playing;
 const model=A.capture(),current=model.active;
 by('lessonSlideCount').textContent=(current+1)+' / '+model.pages.length;
 by('lessonPrev').disabled=current<=0;
 by('lessonNext').disabled=current>=model.pages.length-1;
 by('lessonPlayPause').textContent=A.isPlaying()?'⏸':'▶';
 by('lessonPlayPause').setAttribute('aria-label',A.isPlaying()?'슬라이드 일시정지':'슬라이드 재생');
}
function setPicker(visible){
 picker.hidden=!visible;
 toolsButton.setAttribute('aria-expanded',String(visible));
}
function enterFallback(){
 if(present())return true;
 stageView.classList.add('lesson-fallback');
 A.resizePresentation?.();
 sync();
 return true;
}
function exit(){
 setPicker(false);
 suspended=null;
 A.pause();
 stageView.classList.remove('lesson-fallback');
 if(document.fullscreenElement===stageView){
  Promise.resolve(document.exitFullscreen()).catch(()=>{}).finally(()=>{
   A.resizePresentation?.();sync();
  });
 }else {A.resizePresentation?.();sync()}
}
function movePage(direction){
 const m=A.capture(),next=Math.max(0,Math.min(m.pages.length-1,m.active+direction));
 if(next!==m.active)A.seekPage(next);
 sync();
}
function openTool(id){
 if(!present()||!liveTools.some(tool=>tool.id===id)||L.isOpen())return;
 const wasPlaying=A.isPlaying(),seconds=A.getSceneTime();
 suspended={seconds,wasPlaying,wasFullscreen:document.fullscreenElement===stageView};
 A.pause();setPicker(false);
 try{L.open(id)}
 catch(e){
  const memory=suspended;suspended=null;
  A.seekPresentationTime(memory.seconds);
  if(memory.wasPlaying)A.play();
  sync();throw e;
 }
}
function restoreAfterTool(){
 if(!suspended)return;
 const {seconds,wasPlaying,wasFullscreen}=suspended;
 suspended=null;
 // Some iOS/browser implementations drop fullscreen when a modal is shown.
 if(wasFullscreen&&document.fullscreenElement!==stageView)enterFallback();
 A.seekPresentationTime(seconds);
 if(wasPlaying)A.play();
 toolsButton.focus({preventScroll:true});
 sync();
}
function keyboard(event){
 if(L.isOpen())return;
 if(!present())return;
 const tag=event.target?.tagName;
 if(['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target?.isContentEditable)return;
 if(event.code==='KeyT'&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
  event.preventDefault();setPicker(picker.hidden);toolsButton.focus();return;
 }
 if(event.key==='Escape'&&!picker.hidden){
  event.preventDefault();event.stopImmediatePropagation();setPicker(false);toolsButton.focus();
 }
}
for(const item of liveTools){
 const b=document.createElement('button');
 b.type='button';b.dataset.presenterTool=item.id;b.className='lesson-presenter-tool';
 const title=document.createElement('strong');title.textContent=item.name;
 const sub=document.createElement('span');sub.textContent=item.summary;
 b.append(title,sub);
 b.addEventListener('click',()=>openTool(item.id));
 by('lessonToolPickerGrid').append(b);
}
by('lessonPrev').addEventListener('click',()=>movePage(-1));
by('lessonNext').addEventListener('click',()=>movePage(1));
by('lessonPlayPause').addEventListener('click',()=>{if(A.isPlaying())A.pause();else A.play();sync()});
toolsButton.addEventListener('click',()=>{setPicker(picker.hidden);sync()});
by('lessonExit').addEventListener('click',exit);
document.addEventListener('keydown',keyboard,true);
window.addEventListener('gulliver:teacher-live-close',restoreAfterTool);
document.addEventListener('fullscreenchange',()=>{
 if(suspended?.wasFullscreen&&document.fullscreenElement!==stageView)enterFallback();
 else if(!document.fullscreenElement&&!stageView.classList.contains('lesson-fallback')){suspended=null;setPicker(false)}
 A.resizePresentation?.();sync();
});
const observer=new MutationObserver(sync);
for(const id of ['timelineClock','timelinePlay','pageStrip']){
 const node=by(id);
 if(node)observer.observe(node,{childList:true,characterData:true,subtree:id==='pageStrip'});
}
document.addEventListener('click',event=>{
 if(!picker.hidden&&!event.target.closest('#lessonPresenterDock'))setPicker(false)
});
window.GulliverPresentationTools={enterFallback,exit,openTool,isActive:present,getSuspended:()=>suspended?{...suspended}:null};
sync();
})();
