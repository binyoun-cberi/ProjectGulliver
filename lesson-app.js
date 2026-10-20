(()=>{'use strict';
const C=LessonCore,S=LessonStorage,$=id=>document.getElementById(id),validators={canvas:GulliverUnifiedCore.validate,slides:BalpyoCore.validateDeck,document:MunseoCore.validate,design:DoanCore.validateProject};
let lesson=C.blank(),selected=0,running=false,slideIndex=0,frame=null,frameStepId='',ready=false,renderToken=0,saveTimer,saveQueue=Promise.resolve(),stageUrls=[],clock=null,remaining=0,musicUrl='',fileTarget='',previewing=false,quizRevealed=false,saveVersion=0,savedVersion=0,savingCount=0,saveFailed=false;
const labels={canvas:'통합 캔버스',slides:'발표',document:'문서',design:'도안',video:'영상',audio:'음악',pdf:'PDF',timer:'타이머',quiz:'퀴즈'};
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function status(text,error=false){$('status').textContent=text;$('status').className=error?'error':''}
function saveIndicator(state,label){
 const el=$('lessonSaveState');if(!el)return;
 el.dataset.state=state;el.textContent=label;
}
function current(){return lesson.steps[selected]}
function stepReady(s){return C.readyCount([s])>0}
function renderOverview(){const total=lesson.steps.length,ready=C.readyCount(lesson.steps);$('lessonOverview').textContent=total?total+'개 활동 · 준비됨 '+ready+'개':'수업 자료 0개';$('lessonAudience').value=lesson.audience||'';$('lessonGoal').value=lesson.goal||''}
function capture(){if(frame&&ready&&frameStepId===current()?.id&&!running&&!previewing){const a=frame.contentWindow?.GulliverStudioAdapter;if(a&&a.kind===current()?.kind)current().payload=validators[a.kind](a.capture())}}
function remember(){lesson.position=selected;lesson.updatedAt=Date.now();history.replaceState(null,'',location.pathname+'?lesson='+encodeURIComponent(lesson.id))}
async function ensureCanvasMedia(){
 for(const ref of C.requiredMedia(lesson)){
  if(await S.asset(ref.id))continue;
  const entry=ref.kind==='pdf'?null:await GulliverStudioStorage.getMedia(ref.id);
  if(!entry?.blob||!C.accepts({type:entry.mime,size:entry.blob.size},ref.kind))
   throw Error('수업에 필요한 '+(ref.kind==='video'?'영상':ref.kind==='audio'?'음악':'PDF')+' 원본을 찾지 못했어요. 자료를 다시 연결해 주세요.');
  await S.putAsset({id:ref.id,name:entry.name,mime:entry.mime,blob:entry.blob});
 }
}
async function save(){
 clearTimeout(saveTimer);const revision=saveVersion;savingCount++;
 saveIndicator('saving','저장 중…');
 try{
  capture();remember();await ensureCanvasMedia();
  const copy=C.normalize(lesson,validators);
  saveQueue=saveQueue.catch(()=>{}).then(()=>S.save(copy));
  const saved=await saveQueue;if(saved?.workRevision!==undefined&&lesson.id===copy.id){lesson.id=saved.id;lesson.workRevision=saved.workRevision;remember()}saveFailed=false;savedVersion=Math.max(savedVersion,revision);
  if(saveVersion===savedVersion)saveIndicator('saved','기기에 저장됨');
  else saveIndicator('pending','변경 사항 저장 대기 중…');
  status('작업을 이 브라우저에 저장했어요.');return true;
 }catch(e){
  saveFailed=true;saveIndicator('error','저장 실패 · 원본 확인');
  status('저장하지 못했어요. 원본 백업으로 보관해 주세요. '+e.message,true);return false;
 }finally{savingCount=Math.max(0,savingCount-1)}
}
function schedule(){
 saveVersion++;clearTimeout(saveTimer);
 saveIndicator('pending','변경 사항 저장 대기 중…');
 saveTimer=setTimeout(()=>save(),650);
}
function button(text,fn,cls=''){const b=node('button',cls,text);b.type='button';b.onclick=fn;return b}
function field(parent,label,tag,value,fn,type='text'){const l=node('label','',label),input=node(tag);if(tag==='input')input.type=type;input.value=value??'';input.oninput=()=>fn(input.value);input.onchange=()=>fn(input.value);if(tag==='textarea')input.rows=5;l.append(input);parent.append(l);return input}
function cleanupStage(){clearInterval(clock);clock=null;frame?.contentWindow?.GulliverStudioAdapter?.pause?.();for(const media of $('stage').querySelectorAll('audio,video'))media.pause();stageUrls.forEach(URL.revokeObjectURL);stageUrls=[];frame=null;frameStepId='';ready=false;renderToken++;$('stage').replaceChildren();$('stage').classList.remove('editor')}
function stopMusic(){const audio=$('musicHost').querySelector('audio');audio?.pause();$('musicHost').replaceChildren();$('musicHost').hidden=true;if(musicUrl)URL.revokeObjectURL(musicUrl);musicUrl=''}
function renderList(){const root=$('stepList');root.replaceChildren();lesson.steps.forEach((s,i)=>{const b=button('',()=>choose(i),'step-button'),copy=node('span');b.setAttribute('aria-current',String(i===selected));b.dataset.kind=s.kind;copy.append(node('strong','',s.title),node('small','',labels[s.kind]));const ready=node('span','step-ready'+(stepReady(s)?'':' missing'),stepReady(s)?'준비':s.kind==='quiz'?'문제 필요':'파일 필요');b.append(node('span','number',String(i+1)),copy,ready);root.append(b)});if(!lesson.steps.length)root.append(node('p','muted','자료를 추가하면 여기에 순서대로 나타나요.'));renderOverview()}
function renderSettings(){const root=$('settings');root.replaceChildren();const s=current();if(!s){root.append(node('p','muted','왼쪽에서 첫 자료를 추가해 주세요.'));return}
 field(root,'활동 이름','input',s.title,v=>{s.title=v.slice(0,120)||labels[s.kind];renderList();$('stepTitle').textContent=s.title;schedule()});
 field(root,'진행 메모','textarea',s.notes,v=>{s.notes=v.slice(0,2000);schedule()});
 if(['audio','video'].includes(s.kind)){
  const start=field(root,'재생 시작 (초)','input',s.start,v=>{const n=Number(v);if(!Number.isFinite(n)||n<0||n>86400||s.end&&n>=s.end){status('시작은 0초 이상이며 끝보다 앞이어야 해요.',true);start.value=s.start;return}s.start=n;schedule()},'number');start.min=0;start.max=86400;
  const end=field(root,'재생 끝 (초 · 0이면 끝까지)','input',s.end,v=>{const n=Number(v);if(!Number.isFinite(n)||n<0||n>86400||n&&n<=s.start){status('끝은 시작보다 뒤여야 해요.',true);end.value=s.end;return}s.end=n;schedule()},'number');end.min=0;end.max=86400;
  const volume=field(root,'음량','input',s.volume,v=>{s.volume=Number(v);schedule()},'range');volume.min=0;volume.max=1;volume.step=.05;
  for(const [key,label] of [['loop','구간 반복'],...(s.kind==='audio'?[['background','다음 활동에도 배경음악 이어 재생']]:[])]){const l=node('label','checks'),check=node('input');check.type='checkbox';check.checked=s[key];check.onchange=()=>{s[key]=check.checked;schedule()};l.append(check,document.createTextNode(label));root.append(l)}
 }
 if(s.kind==='quiz'){const label=node('label','', '퀴즈 카드 (한 줄에 문제 | 정답)'),textarea=node('textarea');textarea.rows=7;textarea.placeholder='대한민국의 수도는? | 서울';textarea.value=(s.payload?.cards||[]).map(c=>c.front+' | '+c.back).join('\n');textarea.onchange=()=>{try{const cards=C.parseCards(textarea.value);if(!cards.length)throw Error('퀴즈 카드를 하나 이상 넣어 주세요.');s.payload={cards};slideIndex=0;quizRevealed=false;schedule();renderStage();renderList();status('퀴즈 카드를 수업에 저장했어요.')}catch(e){status(e.message,true)}};label.append(textarea);root.append(label);root.append(node('p','muted','문제와 정답 사이에 | 를 넣어 주세요. 줄바꿈으로 여러 카드를 추가할 수 있어요.'))}
 if(s.kind==='timer'){const input=field(root,'활동 시간 (초)','input',s.seconds,v=>{s.seconds=Math.min(7200,Math.max(1,Number(v)||300));schedule();renderStage()},'number');input.min=1;input.max=7200}
 if(['audio','video','pdf'].includes(s.kind))root.append(button(s.assetId?'파일 바꾸기':'파일 넣기',()=>pickMedia(s)));
 const controls=node('div','mini-actions');for(const [delta,label] of [[-1,'위로'],[1,'아래로']]){const b=button(label,()=>{capture();selected=C.move(lesson,selected,delta);save();render()});b.disabled=selected+delta<0||selected+delta>=lesson.steps.length;controls.append(b)}
 controls.append(button('복제',()=>{if(lesson.steps.length>=C.MAX_STEPS)return status('활동은 60개까지 넣을 수 있어요.',true);capture();const copy=structuredClone(s);copy.id=C.id();copy.title+=' (복사)';lesson.steps.splice(selected+1,0,copy);selected++;save();render()}));
 controls.append(button('수업에서 빼기',()=>{capture();lesson.steps.splice(selected,1);selected=Math.max(0,Math.min(selected,lesson.steps.length-1));save();render()}));root.append(controls);
 if(['canvas','slides','document','design'].includes(s.kind))root.append(node('p','muted',s.kind==='canvas'?'캔버스의 글씨·사진·장면을 이 수업에서 다시 수정할 수 있어요.':'파일 내보내기는 가운데 편집기의 PPTX·PDF·HWPX·DOCX 저장 버튼을 사용하세요.'));
}
function render(){renderList();renderSettings();$('lessonTitle').value=lesson.title;$('startLesson').disabled=!lesson.steps.length;renderStage();}
function updateRunbar(){const s=current(),deck=s?.kind==='slides'?s.payload.slides:s?.kind==='canvas'?s.payload.pages:s?.kind==='quiz'?s.payload?.cards:null;$('runbar').hidden=!(running||previewing);$('counter').textContent=deck?`${selected+1} / ${lesson.steps.length} · ${slideIndex+1} / ${deck.length}장`:`${selected+1} / ${lesson.steps.length}`;$('previous').disabled=selected===0&&slideIndex===0;$('next').disabled=selected===lesson.steps.length-1&&(!deck||slideIndex===deck.length-1)}
async function choose(index){capture();selected=index;slideIndex=0;quizRevealed=false;previewing=false;save();render()}
function slidePage(s){const theme=BalpyoCore.THEMES[s.payload.theme],item=s.payload.slides[slideIndex],page=node('section','slide-page');page.style.background=theme.background;page.style.color=theme.foreground;if(item.eyebrow)page.append(node('small','',item.eyebrow));page.append(node('h1','',item.title));if(item.image){const img=node('img');img.src=item.image;img.alt=item.title;page.append(img)}page.append(node('p','',item.body));return page}
function documentPage(s){const page=node('article','document-page');page.append(node('h1','',s.payload.title),node('p','muted',s.payload.subtitle));s.payload.blocks.forEach(b=>{if(b.type==='table'){const table=node('table');b.rows.forEach(row=>{const tr=node('tr');row.forEach(text=>tr.append(node('td','',text)));table.append(tr)});page.append(table)}else if(b.type==='image'){const img=node('img');img.src=b.src;img.alt=b.caption;page.append(img,node('p','muted',b.caption))}else if(b.type==='list'){const list=node('ul');b.text.split('\n').filter(Boolean).forEach(text=>list.append(node('li','',text)));page.append(list)}else page.append(node(b.type==='heading'?'h2':b.type==='rule'?'hr':'p','',b.text))});return page}
function applyMedia(media,s){media.controls=true;media.volume=s.volume;media.preload='metadata';media.onloadedmetadata=()=>{if(s.start>=media.duration){status('설정한 시작 시간이 파일 길이보다 길어요.',true);return}media.currentTime=s.start};media.ontimeupdate=()=>{if(!media.paused&&media.currentTime<s.start-.1)media.currentTime=s.start;if(s.end&&media.currentTime>=s.end){if(s.loop){media.currentTime=s.start;media.play().catch(()=>{})}else media.pause()}};media.onended=()=>{if(s.loop){media.currentTime=s.start;media.play().catch(()=>{})}};media.onerror=()=>status('이 브라우저에서 파일을 재생하지 못했어요. 다른 형식의 파일을 사용해 주세요.',true)}
async function renderStage(){cleanupStage();const signature=renderToken,s=current(),stage=$('stage');document.body.classList.toggle('canvas-step',s?.kind==='canvas');stage.dataset.kind=s?.kind||'';$('previewStep').hidden=!s||!['canvas','slides','document','design'].includes(s.kind)||running;$('previewStep').textContent=previewing?'편집으로 돌아가기':'자료 미리보기';$('stepTitle').textContent=s?.title||'작업할 자료를 선택하세요';$('modeHint').textContent=s?.kind==='slides'&&!running&&!previewing?'슬라이드 편집 · PPTX 내보내기':'';updateRunbar();
 $('lessonPresenter').hidden=!(running||previewing)||!s;
 $('lessonPresenterNotes').hidden=true;$('toggleLessonNotes').setAttribute('aria-expanded','false');$('lessonPresenterNotes').textContent=s?.notes||'진행 메모가 없어요. 편집 화면에서 활동 설정에 메모를 적어 보세요.';
 if(!s){const box=node('div','empty');box.append(node('h1','','만들고, 바로 수업하세요.'),node('p','','발표 자료와 문서, 영상, 음악을 한 수업에 담아 보세요. 왼쪽에서 자료를 추가하세요. 같은 화면에서 편집하고 순서와 진행 메모를 정할 수 있어요.'));stage.append(box);return}
 if(s.kind==='canvas'){
  const f=node('iframe','editor-frame');f.id='editorFrame';let play=null;frame=f;frameStepId=s.id;f.title='통합 캔버스 '+(running||previewing?'수업 화면':'편집기');stage.classList.add('editor');
  f.onload=()=>{if(signature!==renderToken||frame!==f)return;try{
   const a=f.contentWindow.GulliverStudioAdapter;if(a?.kind!=='canvas')throw Error('통합 캔버스를 연결하지 못했어요.');
   a.setMediaProvider(async id=>await S.asset(id)||GulliverStudioStorage.getMedia(id));
   a.setMediaSink(async row=>S.putAsset({id:row.id,name:row.name,mime:row.mime,blob:new Blob([row.blob],{type:row.mime})}));
   a.apply(s.payload);
   if(running||previewing){
    const style=f.contentDocument.createElement('style');style.textContent='.activity-inline-controls{display:none!important}.top-tools,.shelf,.properties,#pageStrip,#status,.timeline{display:none!important}.editor-grid{display:block!important;min-height:0!important}.work{min-height:100vh;justify-content:center;padding:12px!important}#stageView{align-items:center}';f.contentDocument.head.append(style);
    a.onPageChange(i=>{if(signature===renderToken){slideIndex=i;updateRunbar()}});
    a.onPlaybackChange(playing=>{if(play){play.textContent=playing?'⏸ 일시정지':'▶ 장면 재생';play.setAttribute('aria-pressed',String(playing))}});
    a.seekPage(slideIndex);
   }else{
    ready=true;for(const type of ['input','change','pointerup','keyup'])f.contentDocument.addEventListener(type,schedule,{passive:true});
   }
   if(play)play.disabled=false;
   status(running?'장면을 재생하거나 이전·다음으로 이동하세요.':'통합 캔버스를 이 수업에서 편집할 수 있어요.');
  }catch(e){status(e.message,true)}};
  f.src='통합 캔버스.html?lesson=1';stage.append(f);
  if(running||previewing){play=button('▶ 장면 재생',()=>{const a=f.contentWindow?.GulliverStudioAdapter;if(a?.isPlaying())a.pause();else a?.play()},'canvas-play');play.disabled=true;play.setAttribute('aria-pressed','false');stage.append(play)}
  return;
 }
 if(['slides','document','design'].includes(s.kind)){
  if(running||previewing){if(s.kind==='slides')stage.append(slidePage(s));else if(s.kind==='document')stage.append(documentPage(s));else{const page=node('div','design-page');page.innerHTML=DoanCore.svg(DoanCore.validateProject(s.payload));stage.append(page)}return}
  const f=node('iframe','editor-frame');f.id='editorFrame';frame=f;frameStepId=s.id;f.title=labels[s.kind]+' 편집기';stage.classList.add('editor');f.onload=()=>{if(signature!==renderToken||frame!==f)return;try{const a=f.contentWindow.GulliverStudioAdapter;if(!a||a.kind!==s.kind)throw Error('편집기를 연결하지 못했어요.');a.apply(s.payload);const doc=f.contentDocument,style=doc.createElement('style');style.textContent='body>header,body>section.hero,body>section.intro,body>footer,body>section.advanced,body>.advanced{display:none!important}body{margin:0!important}body>.workspace{margin:0!important;max-width:none!important;padding:12px!important;grid-template-columns:170px minmax(0,1fr) 200px!important}@media(max-width:1100px){body>.workspace{display:flex!important;flex-direction:column!important}}';doc.head.append(style);ready=true;for(const type of ['input','change','pointerup','keyup'])doc.addEventListener(type,schedule,{passive:true});status('자료를 편집할 수 있어요. 변경 내용은 수업에 자동 저장돼요.')}catch(e){status(e.message,true)}};f.src=GulliverStudioCore.TOOLS[s.kind].href+'?studio=1';stage.append(f);return;
 }
 if(s.kind==='quiz'){
  const cards=s.payload?.cards||[],view=node('section','quiz-view');
  view.append(node('span','quiz-counter',cards.length?'카드 '+(slideIndex+1)+' / '+cards.length:'카드를 준비해 주세요'));
  if(cards.length){
   const card=cards[Math.min(slideIndex,cards.length-1)];
   view.append(node('div','quiz-question',card.front));
   const answer=node('div','quiz-answer',card.back);answer.hidden=!quizRevealed;view.append(answer);
   view.append(button(quizRevealed?'정답 가리기':'정답 보기',()=>{quizRevealed=!quizRevealed;renderStage()},'quiz-reveal'));
   view.append(node('span','quiz-hint','정답을 확인하고 이전·다음 버튼으로 카드를 넘겨 보세요.'));
   if(!running&&!previewing){
    const nav=node('div','quiz-navigation');
    const before=button('← 이전 카드',()=>{slideIndex=Math.max(0,slideIndex-1);quizRevealed=false;renderStage()});
    const after=button('다음 카드 →',()=>{slideIndex=Math.min(cards.length-1,slideIndex+1);quizRevealed=false;renderStage()});
    before.disabled=slideIndex<=0;after.disabled=slideIndex>=cards.length-1;
    nav.append(before,after);view.append(nav);
   }
  }else view.append(node('p','muted','오른쪽 활동 설정에서 문제와 정답을 먼저 입력해 주세요.'));
  stage.append(view);updateRunbar();return;
 }
 if(s.kind==='timer'){remaining=s.seconds;const box=node('div'),timer=node('div','timer-view'),title=node('p','',s.title);function tick(){timer.textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');if(!remaining){clearInterval(clock);clock=null;title.textContent='활동 시간이 끝났어요.'}}tick();const controls=node('div','timer-actions');controls.append(button('시작 / 멈춤',()=>{if(clock){clearInterval(clock);clock=null}else{if(remaining<=0)remaining=s.seconds;clock=setInterval(()=>{remaining=Math.max(0,remaining-1);tick()},1000)}}),button('다시 시작',()=>{clearInterval(clock);clock=null;remaining=s.seconds;title.textContent=s.title;tick()}));box.append(title,timer,controls);stage.append(box);return}
 if(!s.assetId){stage.append(node('p','muted','활동 설정에서 '+labels[s.kind]+' 파일을 넣어 주세요.'));return}
 stage.append(node('p','loading','파일을 불러오고 있어요…'));try{const asset=await S.asset(s.assetId);if(signature!==renderToken)return;if(!asset)throw Error('파일을 찾지 못했어요. 원본 백업을 불러오거나 파일을 다시 넣어 주세요.');stage.replaceChildren();const url=URL.createObjectURL(asset.blob);stageUrls.push(url);
  if(s.kind==='pdf'){const f=node('iframe','pdf');f.title=s.title;f.src=url;stage.append(f);stage.append(node('p','muted','PDF는 원본 화면으로 보여줘요. 내용 수정은 PDF 제작 도구에서 할 수 있어요.'));return}
  if(s.kind==='audio'&&s.background&&running){stopMusic();musicUrl=URL.createObjectURL(asset.blob);const media=node('audio');media.src=musicUrl;applyMedia(media,s);$('musicHost').append(node('span','',s.title),media,button('음악 끄기',stopMusic));$('musicHost').hidden=false;stage.append(node('p','','배경음악을 재생한 뒤 다음 활동으로 이동하세요. 음악은 계속 이어집니다.'));return}
  const media=node(s.kind);media.src=url;applyMedia(media,s);stage.append(media);
 }catch(e){if(signature===renderToken){stage.replaceChildren(node('p','muted',e.message));status(e.message,true)}}
}
function add(kind,payload){if(lesson.steps.length>=C.MAX_STEPS)return status('한 수업에는 활동 60개까지 넣을 수 있어요.',true);capture();const s=C.step(kind,payload||({canvas:()=>GulliverUnifiedCore.starter('presentation'),slides:()=>BalpyoCore.starter('lesson'),document:()=>MunseoCore.template('blank'),design:()=>DoanCore.makeTemplate('blank'),quiz:()=>({cards:[]})}[kind]?.()));if(s.payload?.title)s.title=s.payload.title;lesson.steps.push(s);selected=lesson.steps.length-1;previewing=false;save();render();if(['audio','video','pdf'].includes(kind))pickMedia(s)}
function pickMedia(s){fileTarget=s.id;const input=$('mediaFile');input.accept={video:'video/mp4,video/webm,video/ogg',audio:'audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm',pdf:'application/pdf'}[s.kind];input.click()}
$('mediaFile').onchange=async e=>{const file=e.target.files[0],id=fileTarget,lessonId=lesson.id;e.target.value='';const s=lesson.steps.find(s=>s.id===id);if(!file||!s)return;if(!C.accepts(file,s.kind))return status('지원하는 '+labels[s.kind]+' 파일을 선택해 주세요. 파일당 최대 100MB예요.',true);try{const asset={id:C.id(),name:file.name,mime:file.type,blob:file};await S.putAsset(asset);if(lesson.id!==lessonId)return;s.assetId=asset.id;s.title=file.name.slice(0,120);await save();render();status('파일을 수업에 넣었어요. 재생 버튼을 눌러 확인해 주세요.')}catch(e){status('파일을 넣지 못했어요. '+e.message,true)}};
function importActivity(p){
 if(!p||!['quiz','timer'].includes(p.kind))throw Error('지금은 저장한 퀴즈와 타이머를 수업으로 가져올 수 있어요.');
 const added=p.kind==='quiz'?(()=>{
  const cards=C.normalizeCards(p.payload?.cards||[]);
  if(!cards.length)throw Error('퀴즈에 문제 카드가 없어요. 원본 활동을 먼저 작성해 주세요.');
  const s=C.step('quiz',{cards});s.title=String(p.title||'퀴즈').slice(0,120);return[s];
 })():C.timerFromEvents(p.payload?.events);
 if(lesson.steps.length+added.length>C.MAX_STEPS)throw Error('한 수업에는 활동 60개까지 넣을 수 있어요.');
 capture();
 lesson.steps.splice(selected+1,0,...added);
 selected+=1;slideIndex=0;quizRevealed=false;previewing=false;
 save();render();status('저장한 '+(p.kind==='quiz'?'퀴즈 '+added[0].payload.cards.length+'장':'타이머 '+added.length+'단계')+'을 수업에 복사했어요. 원본은 그대로 유지돼요.');
}
async function library(mode){
 if(!await save())return;
 $('libraryTitle').textContent=mode==='lessons'?'저장한 작업':'내 보관함에서 수업 자료 가져오기';
 const root=$('libraryList');root.replaceChildren(node('p','muted','불러오는 중…'));
 $('libraryDialog').showModal();
 try{
  if(mode==='lessons'){
   const items=await S.list(),seen=new Set(items.map(p=>p.id));
   for(const project of await GulliverStudioStorage.projects())if(['canvas','slides','document','design'].includes(project.kind)){const work=await GulliverWorkStorage.ensureProject(project);if(!seen.has(work.id)){items.push(await S.get(work.id));seen.add(work.id)}}
   items.sort((a,b)=>b.updatedAt-a.updatedAt);root.replaceChildren();
   if(!items.length)root.append(node('p','muted','저장한 작업이 없어요.'));
   for(const p of items){
    const b=button('',()=>{try{capture();lesson=C.normalize(p,validators);selected=lesson.position;slideIndex=0;quizRevealed=false;previewing=false;remember();render();$('libraryDialog').close()}catch(e){status(e.message,true)}},'import-source');
    b.append(node('strong','',p.title),node('small','',String(p.steps?.length||0)+'개 활동 · 기기 저장'));root.append(b);
   }
   return;
  }
  const [projects,activities]=await Promise.all([
   GulliverStudioStorage.projects(),
   Promise.resolve(typeof ClassroomWorkspace==='undefined'?[]:ClassroomWorkspace.list())
  ]);
  root.replaceChildren();
  const own=projects.filter(p=>['canvas','slides','document','design'].includes(p.kind));
  if(own.length){
   root.append(node('div','import-group','내가 만든 편집 자료'));
   for(const p of own){
    const b=button('',()=>{try{add(p.kind,validators[p.kind](structuredClone(p.payload)));$('libraryDialog').close();status('제작실 자료를 수업에 복사했어요. 원본은 그대로 유지돼요.')}catch(e){status(e.message,true)}},'import-source');
    b.append(node('strong','',p.title),node('small','',labels[p.kind]+' · 수업 안에서 이어서 편집'));root.append(b);
   }
  }
  const supports=activities.filter(a=>['timer','quiz'].includes(a.kind));
  if(supports.length){
   root.append(node('div','import-group','저장한 교사 활동'));
   for(const p of supports){
    const b=button('',()=>{try{importActivity(p);$('libraryDialog').close()}catch(e){status(e.message,true)}},'import-source');
    b.append(node('strong','',p.title),node('small','',p.kind==='quiz'?'낱말카드·퀴즈 · 문제와 정답 복사':'수업 타이머 · 각 활동 시간을 순서대로 복사'));root.append(b);
   }
  }
  const seating=activities.filter(a=>a.kind==='seating');
  if(seating.length){
   root.append(node('div','import-group','자리표 · 원본 도구에서 열기'));
   for(const p of seating){
    const link=node('a','external-tool','↗ '+p.title+' (별도 창)');
    link.href=ClassroomWorkspace.openUrl(p);link.target='_blank';link.rel='noopener noreferrer';
    root.append(link);
   }
  }
  if(!own.length&&!supports.length&&!seating.length)root.append(node('p','muted','저장한 자료가 아직 없어요. 제작실 또는 교사 도구에서 먼저 저장하면 여기에서 선택할 수 있어요.'));
 }catch(e){root.replaceChildren(node('p','muted',e.message))}
}
function download(data,name){const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_')+'.lesson.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000)}
function base64(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
$('backupLesson').onclick=async()=>{try{capture();await ensureCanvasMedia();const clean=C.normalize(lesson,validators),assets=[];let bytes=0;for(const id of new Set(C.requiredMedia(clean).map(ref=>ref.id))){const a=await S.asset(id);if(!a)throw Error('수업에 연결한 파일을 찾지 못했어요. 파일을 다시 넣어 주세요.');bytes+=a.blob.size;if(bytes>200*1024*1024)throw Error('백업할 영상·음악의 합계가 200MB를 넘어요. 파일을 줄여 주세요.');assets.push({id,name:a.name,mime:a.mime,data:await base64(a.blob)})}download({format:'gulliver-lesson',version:1,lesson:clean,assets},clean.title);status('영상·음악을 포함한 수업 원본을 내려받았어요.')}catch(e){status(e.message,true)}};
$('restoreLesson').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>300*1024*1024)throw Error('수업 원본은 최대 300MB까지 불러올 수 있어요.');const raw=JSON.parse(await file.text());if(raw.format!=='gulliver-lesson'||raw.version!==1||!Array.isArray(raw.assets)||raw.assets.length>60)throw Error('뚝딱교실의 수업 원본을 선택해 주세요.');const copy=C.normalize(raw.lesson,validators),map=new Map(),assets=[];let total=0;for(const a of raw.assets){if(!a||typeof a.data!=='string'||a.data.length>140*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(a.data)||map.has(a.id))throw Error('파일 데이터가 올바르지 않아요.');const bytes=Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)),blob=new Blob([bytes],{type:a.mime});const kind=C.requiredMedia(copy).find(ref=>ref.id===a.id)?.kind||null;if(!C.accepts({type:a.mime,size:blob.size},kind))throw Error('수업에 지원하지 않는 파일이 포함돼 있어요.');total+=blob.size;if(total>200*1024*1024)throw Error('수업의 파일 합계가 200MB를 넘어요.');const id=C.id();map.set(a.id,id);assets.push({id,name:String(a.name||'파일').slice(0,150),mime:a.mime,blob})}copy.steps.forEach(s=>{if(s.assetId){if(!map.has(s.assetId))throw Error('수업에 필요한 파일이 빠져 있어요.');s.assetId=map.get(s.assetId)}if(s.kind==='canvas'&&s.payload){
 if(s.payload.audio?.mediaId){const old=s.payload.audio.mediaId;if(!map.has(old))throw Error('캔버스 배경음악이 백업에서 빠졌어요.');s.payload.audio.mediaId=map.get(old)}
 for(const track of s.payload.tracks||[])if(track.kind!=='caption'&&track.mediaId){if(!map.has(track.mediaId))throw Error('캔버스 트랙 원본이 백업에 없어요.');track.mediaId=map.get(track.mediaId)}
 for(const page of s.payload.pages||[])if(page.videoClip?.mediaId){if(!map.has(page.videoClip.mediaId))throw Error('캔버스 영상 원본이 백업에 없어요.');page.videoClip.mediaId=map.get(page.videoClip.mediaId)}
}});if(!await save())return;copy.id=C.id();copy.createdAt=copy.updatedAt=Date.now();await S.bundle(copy,assets);lesson=copy;selected=copy.position;previewing=false;remember();render();status('수업 원본을 새 수업으로 불러왔어요. 기존 수업은 유지됩니다.')}catch(e){status('불러오지 못했어요. '+e.message,true)}};
$('lessonAudience').oninput=e=>{lesson.audience=e.target.value.slice(0,100);schedule()};
$('lessonGoal').oninput=e=>{lesson.goal=e.target.value.slice(0,240);schedule()};
$('createLessonFlow').onclick=()=>{
 if(lesson.steps.length>C.MAX_STEPS-3)return status('활동은 최대 60개까지 넣을 수 있어요.',true);
 if(lesson.steps.length&&!confirm('현재 수업의 마지막에 도입·활동·마무리 3단계를 추가할까요? 기존 자료는 유지해요.'))return;
 capture();
 const stages=[
  ['도입 · 오늘의 배움','오늘의 주제와 관심을 나누어요.'],
  ['활동 · 함께 해 보기','함께 탐색하거나 직접 해 보는 활동을 진행해요.'],
  ['마무리 · 돌아보기','오늘 배운 것과 느낀 점을 나누어요.']
 ];
 for(const [title,notes] of stages){
  const st=C.step('canvas',GulliverUnifiedCore.starter('presentation'));st.title=title;st.notes=notes;lesson.steps.push(st);
 }
 selected=lesson.steps.length-3;slideIndex=0;quizRevealed=false;previewing=false;
 save();render();status('도입·활동·마무리 수업 틀을 만들었어요. 각 장면을 바로 편집할 수 있어요.');
};
$('lessonTitle').oninput=e=>{lesson.title=e.target.value.slice(0,100)||'새 수업';schedule()};$('saveLesson').onclick=save;$('newLesson').onclick=async()=>{if(!await save())return;lesson=C.blank();selected=0;previewing=false;remember();render();status('새 수업을 준비했어요.')};$('openLesson').onclick=()=>library('lessons');$('fromStudio').onclick=()=>library('studio');$('closeLibrary').onclick=()=>$('libraryDialog').close();document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
$('previewStep').onclick=()=>{capture();previewing=!previewing;slideIndex=0;renderStage()};
$('startLesson').onclick=async()=>{if(!lesson.steps.length)return;if(!await save())return;previewing=false;running=true;slideIndex=0;quizRevealed=false;document.body.classList.add('running');$('runTitle').textContent=lesson.title;$('runTitle').hidden=false;$('startLesson').hidden=true;$('exitRun').hidden=false;$('fullScreen').hidden=false;renderStage()};
$('exitRun').onclick=()=>{running=false;stopMusic();document.body.classList.remove('running');$('runTitle').hidden=true;$('startLesson').hidden=false;$('exitRun').hidden=true;$('fullScreen').hidden=true;save();render();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})};$('fullScreen').onclick=()=>{(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>status('전체 화면을 사용할 수 없어요.',true))};
function advance(delta){const s=current(),pages=s?.kind==='slides'?s.payload.slides:s?.kind==='canvas'?s.payload.pages:s?.kind==='quiz'?s.payload?.cards:null;if(pages&&slideIndex+delta>=0&&slideIndex+delta<pages.length){slideIndex+=delta;quizRevealed=false;renderStage();return}const target=selected+delta;if(target<0||target>=lesson.steps.length)return;selected=target;quizRevealed=false;const next=current();slideIndex=delta<0?(next.kind==='slides'?next.payload.slides.length-1:next.kind==='canvas'?next.payload.pages.length-1:next.kind==='quiz'?(next.payload?.cards?.length||1)-1:0):0;save();renderStage()}
$('previous').onclick=()=>advance(-1);$('next').onclick=()=>advance(1);document.addEventListener('keydown',e=>{if(!(running||previewing)||['INPUT','TEXTAREA','SELECT','AUDIO','VIDEO'].includes(e.target.tagName)||e.target.closest('button'))return;if(e.key==='ArrowRight'){e.preventDefault();advance(1)}if(e.key==='ArrowLeft'){e.preventDefault();advance(-1)}if(e.key==='Escape'&&running)$('exitRun').click()});
$('toggleLessonNotes').onclick=()=>{
 const text=$('lessonPresenterNotes'),button=$('toggleLessonNotes');
 text.hidden=!text.hidden;button.setAttribute('aria-expanded',String(!text.hidden));
 button.textContent=text.hidden?'진행 메모 보기':'진행 메모 닫기';
};
// Navigation inside the site waits for a completed save, including any source file
// imported by the teacher. If it fails, keep the editor open rather than lose work.
document.addEventListener('click',async e=>{
 const link=e.target.closest('header.bar a[href],.gulliver-nav a[href],.gx-brand');
 if(!link||e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||link.target==='_blank')return;
 e.preventDefault();
 if(link.getAttribute('aria-current')==='page')return;
 const destination=link.href;
 if(await save())location.assign(destination);
});
window.addEventListener('beforeunload',event=>{
 if(saveFailed||savingCount||saveVersion>savedVersion){
  event.preventDefault();event.returnValue='';
 }
});
window.addEventListener('pagehide',()=>{
 try{capture();remember();S.save(C.normalize(lesson,validators)).catch(()=>{})}catch{}
});
(async()=>{try{const params=new URLSearchParams(location.search),projectId=params.get('project');let id=params.get('work')||params.get('lesson');if(projectId){const project=await GulliverStudioStorage.getProject(projectId);if(!project)throw Error('저장한 자료를 찾지 못했어요.');if(!['canvas','slides','document','design'].includes(project.kind))throw Error('이 자료는 내 보관함의 전문 편집기에서 열어 주세요.');const work=await GulliverWorkStorage.ensureProject(project);id=work.id;}if(id){const stored=await S.get(id);if(!stored)throw Error('이 브라우저에 저장된 수업을 찾지 못했어요. 원본 파일을 불러와 주세요.');lesson=C.normalize(stored,validators);selected=lesson.position}else if(['canvas','slides','document','design'].includes(params.get('new'))){const kind=params.get('new'),payload=kind==='canvas'?GulliverUnifiedCore.starter(params.get('template')||'blank'):undefined;add(kind,payload);return}render()}catch(e){render();status(e.message,true)}})();
})();
