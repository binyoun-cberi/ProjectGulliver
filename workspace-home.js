(function(){
'use strict';
const W=ClassroomWorkspace,tools=ClassroomTools,$=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATEGORIES=['전체','시간·수업 안내','뽑기·편성','퀴즈·놀이','학급 관리','자료·기록'];
const FORMATS=[['korean','국어','가','#e88460','낱말·띄어쓰기·읽기'],['math','수학','＋','#408ac4','연산·곱셈·분수'],['social','사회','◎','#da9742','방향·우리 사회·경제'],['science','과학','✳','#4aa98e','생물·물질·날씨'],['english','영어','A','#8564c8','낱말·문장·대화'],['hanja','한자·사자성어','字','#a47e46','급수별 한자·따라쓰기']];
const FIRST_START_KEY='clasheet.firstStart.dismissed.v1';
function firstStartVisible(){
 try{return W.list().length===0&&localStorage.getItem(FIRST_START_KEY)!=='1';}catch{return W.list().length===0}
}
function firstStart(){
 return '<section class="first-start" aria-labelledby="firstStartTitle"><div class="first-start-head"><div><span class="first-start-eyebrow">첫 사용 안내</span><h2 id="firstStartTitle">처음이라면 이렇게 시작해요</h2><p>필요한 자료를 만들고, 수업에 맞는 도구를 골라 보세요.</p></div><button class="first-start-close" type="button" data-dismiss-first-start aria-label="첫 사용 안내 닫기">안내 닫기 ×</button></div><div class="first-start-links">'+
 '<a class="first-start-card" href="문제지 만들기.html"><span aria-hidden="true">▤</span><strong>문제지 만들기</strong><small>학년과 교과를 고른 뒤 인쇄</small></a>'+
 '<a class="first-start-card" href="이번 수업 알리미.html"><span aria-hidden="true">◷</span><strong>수업 화면 준비</strong><small>학습 목표와 활동 순서 표시</small></a>'+
 '<a class="first-start-card" href="플래시퀴즈메이커.html"><span aria-hidden="true">▧</span><strong>퀴즈·낱말카드</strong><small>학생용 카드와 퀴즈 제작</small></a>'+
 '</div><p class="first-start-foot">수업 중 쓸 도구는 아래에서 언제든 다시 찾을 수 있어요.</p></section>';
}
function startTiles(){
 return '<div class="format-grid daily-subject-grid">'+FORMATS.map(f=>'<a class="format-tile" href="문제지 만들기.html?subject='+f[0]+'" style="--format-accent:'+f[3]+'" aria-label="'+f[1]+' 문제지 만들기"><span class="format-symbol" aria-hidden="true">'+f[2]+'</span><span class="format-copy"><strong>'+f[1]+'</strong><small>'+f[4]+'</small></span></a>').join('')+'</div>';
}
function materialLinks(){return [
 ...FORMATS.map(f=>({name:f[1]+' 문제지',icon:f[2],description:f[4],tags:'문제지 학습지 인쇄 '+(f[0]==='hanja'?'한자 사자성어 따라쓰기 급수':''),href:'문제지 만들기.html?subject='+f[0]})),
 {name:'국어 받아쓰기',icon:'가',description:'학년별 문장 · 음성으로 듣고 쓰기',tags:'한글 한국어 국어 받아쓰기 TTS',href:'받아쓰기.html?subject=korean'},
 {name:'국어 말하기',icon:'말',description:'QR로 접속해 한 문제씩 소리 내어 말해요',tags:'국어 한국어 말하기 읽기 음성',href:'말하기.html?language=korean'},
 {name:'영어 스피킹',icon:'Say',description:'단어와 문장을 말하며 영어를 연습해요',tags:'영어 스피킹 speaking 말하기',href:'말하기.html?language=english'},
 {name:'영어 받아쓰기',icon:'A',description:'영어 문장 · 음성으로 듣고 쓰기',tags:'영어 받아쓰기 듣기 TTS',href:'받아쓰기.html?subject=english'}
];}
function homeMaterials(){return '<div class="home-materials">'+
 '<section class="home-worksheet-panel" aria-labelledby="homeWorksheetTitle"><div class="home-panel-heading"><div><span class="home-eyebrow">학습 자료 준비</span><h2 id="homeWorksheetTitle">오늘의 문제지</h2><p>과목을 고르고, 수업에 맞는 범위를 담아 보세요.</p></div><a class="home-panel-link" href="문제지 만들기.html">문제지 만들기 <span aria-hidden="true">↗</span></a></div>'+startTiles()+'<div class="home-worksheet-foot"><span>차시별 · 성취기준별 · 여러 단원 종합</span><span>A4 인쇄</span></div></section>'+
 '<section class="home-dictation-panel" aria-labelledby="homeDictationTitle"><span class="home-eyebrow">듣고 쓰는 연습</span><h2 id="homeDictationTitle">받아쓰기</h2><p>한 문장씩 듣고, 내 속도에 맞춰 써요.</p>'+materialLinks().filter(m=>m.href.startsWith('받아쓰기.html')).map(m=>'<a class="home-dictation-link" href="'+m.href+'"><span class="home-dictation-symbol" aria-hidden="true">'+m.icon+'</span><span><strong>'+m.name+'</strong><small>'+m.description+'</small></span><span aria-hidden="true">→</span></a>').join('')+'<div class="home-audio-note"><span class="home-sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span>문장마다 1~5번 반복<br>읽는 속도와 기다리는 시간 조절</span></div></section><section class="home-dictation-panel home-speaking-panel"><span class="home-eyebrow">소리 내어 말하는 연습</span><h2>말하기 · 스피킹</h2><p>QR로 접속하고, 내 속도로 한 문제씩 말해요.</p>'+materialLinks().filter(m=>m.href.startsWith('말하기.html')).map(m=>'<a class="home-dictation-link" href="'+m.href+'"><span class="home-dictation-symbol" aria-hidden="true">'+m.icon+'</span><span><strong>'+m.name+'</strong><small>'+m.description+'</small></span><span aria-hidden="true">→</span></a>').join('')+'</section></div>';}
const requestedView=new URLSearchParams(location.search).get('view');
if(requestedView==='templates')location.replace('문제지 만들기.html');
let view=['home','tools','activities','favorites','trash'].includes(requestedView)?requestedView:'home',folderId='',category='전체',editAction=null,toastTimer;
const descriptions={home:['오늘 수업, 여기서 시작하세요','문제지와 받아쓰기를 만들고, 필요한 수업 도구를 바로 열어요.'],favorites:['즐겨찾기','자주 쓰는 교사 도구를 빠르게 꺼내 보세요.'],activities:['교실 활동','저장한 타이머·퀴즈·자리표를 다시 열어요.'],tools:['교사 도구','수업 준비와 진행에 필요한 도구를 골라 쓰세요.'],trash:['보관한 활동','보관한 활동은 교사 도구 활동 목록으로 복원할 수 있어요.']};
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2500)}
function matches(text){const q=$('search').value.toLowerCase().replace(/\s+/g,'');return !q||String(text).toLowerCase().replace(/\s+/g,'').includes(q)}
function switchView(next,folder=''){view=next;folderId=folder;category='전체';$('search').value='';document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false');history.replaceState(null,'',location.pathname+(view==='activities'?'?view=activities':view==='home'?'':'?view='+encodeURIComponent(view)));render();window.scrollTo({top:0,behavior:'smooth'})}
function preview(kind,data){
 if(kind==='timer'){const events=Array.isArray(data.events)?data.events:[],total=events.reduce((n,e)=>n+Math.max(0,Number(e.durationSec)||0),0);let end=0;const colors=events.map((e,i)=>{const start=end;end+=total?Math.max(0,Number(e.durationSec)||0)/total*360:0;const color=/^#[0-9a-f]{6}$/i.test(e.color)?e.color:['#635bff','#14a889','#e9a52b','#e56c7e'][i%4];return color+' '+start+'deg '+end+'deg'}).join(',')||'#ded9ff 0deg 360deg';return '<div class="preview timer"><div class="timer-ring" style="background:conic-gradient('+colors+')"><div class="timer-core">'+Math.round(total/60)+'<small>분 · '+events.length+'개 활동</small></div></div><div class="timer-events">'+events.slice(0,4).map(e=>esc(e.name)).join('<br>')+'</div></div>'}
 if(kind==='quiz'){const cards=Array.isArray(data.cards)?data.cards:[];return '<div class="preview quiz"><div class="flash-preview"><strong>'+esc(cards[0]?.front||'새 낱말카드')+'</strong><span>'+esc(cards[0]?.back||'단어와 뜻을 넣어 보세요')+'</span></div></div>'}
 const cols=Math.max(1,Math.min(6,Number(data.cols)||5)),rows=Math.max(1,Math.min(6,Number(data.rows)||4)),students=Array.isArray(data.students)?data.students:[],assigned=Array.isArray(data.assignment)?data.assignment:[];return '<div class="preview seating"><div class="board-label">칠판</div><div class="seat-preview" style="grid-template-columns:repeat('+cols+',1fr)">'+Array.from({length:cols*rows},(_,i)=>'<span class="mini-seat">'+esc(students.find(s=>s.id===assigned[i])?.name||'')+'</span>').join('')+'</div></div>';
}
function summary(a){const p=a.payload;return a.kind==='timer'?((p.events||[]).length+'개 활동'):a.kind==='quiz'?((p.cards||[]).length+'장 카드'):((p.students||[]).length+'명 · '+p.cols+'열 × '+p.rows+'줄')}
function activityCard(a,trash=false){const f=W.read().folders.find(f=>f.id===a.folderId);return '<article class="activity-card">'+(trash?preview(a.kind,a.payload):'<a href="'+esc(W.openUrl(a))+'" aria-label="'+esc(a.title)+' 열기">'+preview(a.kind,a.payload)+'</a>')+'<div class="card-info"><h3>'+esc(a.title)+'</h3><p>'+esc(summary(a))+' · '+esc(f?.name||'미분류')+' · '+new Date(a.updatedAt).toLocaleDateString('ko-KR')+'</p></div><div class="card-actions">'+(trash?'<button class="open" data-restore="'+esc(a.id)+'">복원하기</button>':'<a href="'+esc(W.openUrl(a))+'">열기 →</a><button data-rename="'+esc(a.id)+'">이름</button><button data-move="'+esc(a.id)+'">폴더</button><button data-duplicate="'+esc(a.id)+'">복제</button><button data-archive="'+esc(a.id)+'">보관</button>')+'</div></article>'}
function toolIcon(t){
 const shapes={
 '시간 도구.html':'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
 '이번 수업 알리미.html':'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21l4-5 4 5M7 8h7M7 12h10"/>',
 '플래시퀴즈메이커.html':'<rect x="5" y="6" width="15" height="15" rx="2"/><path d="M16 3H5a3 3 0 0 0-3 3v11M9 11h7M9 15h4"/>',
 '자리 배정 프로그램.html':'<rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="4" width="7" height="6" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/>'
 };
 return shapes[t.href]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shapes[t.href]+'</svg>':esc(t.icon);
}
function toolCard(t){const on=Gulliver.isFavorite(t.href);return '<article class="tool-row"><a class="tool-row-link" data-tool="'+esc(t.href)+'" href="'+esc(t.href)+'"><span class="tool-row-icon" aria-hidden="true">'+toolIcon(t)+'</span><span class="tool-row-copy"><strong>'+esc(t.name)+'</strong><span>'+esc(t.subtitle||t.situation)+'</span></span><span class="tool-row-arrow" aria-hidden="true">↗</span></a><button class="star" data-star="'+esc(t.href)+'" aria-label="'+esc(t.name)+(on?' 즐겨찾기 해제':' 즐겨찾기 추가')+'" aria-pressed="'+on+'">'+(on?'★':'☆')+'</button></article>'}

function section(title,description,body,action=''){return '<section class="section"><div class="section-head"><div><h2>'+title+'</h2>'+(description?'<p>'+description+'</p>':'')+'</div>'+action+'</div>'+body+'</section>'}
function render(){
 const searchStatus=$('homeSearchStatus');if(searchStatus)searchStatus.textContent='';
 const topNav=document.querySelector('.gx-nav');if(topNav)for(const a of topNav.querySelectorAll(':scope > a')){const href=a.getAttribute('href');if(href==='index.html'||href==='index.html?view=tools'){if(href===(view==='tools'?'index.html?view=tools':view==='home'?'index.html':null))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
 document.body.classList.toggle('home-view',view==='home');
 const data=W.read(),currentFolder=data.folders.find(f=>f.id===folderId),titles=descriptions[view];$('pageTitle').textContent=currentFolder?currentFolder.name:titles[0];$('pageDescription').textContent=titles[1];
 document.querySelectorAll('.nav [data-view]').forEach(b=>b.setAttribute('aria-current',!folderId&&b.dataset.view===view?'page':'false'));
 document.querySelectorAll('.home-bottom-bar [data-view]').forEach(b=>b.setAttribute('aria-current',!folderId&&b.dataset.view===view?'page':'false'));
 $('folders').innerHTML=data.folders.length?data.folders.map(f=>'<button class="folder-link '+(f.id===folderId?'active':'')+'" data-folder="'+esc(f.id)+'">▱ '+esc(f.name)+'</button>').join(''):'<p style="font-size:11px;color:#a1a9b8;padding:0 13px;line-height:1.6">수업별로 활동을 모아 보세요.</p>';
 const room=Gulliver.getClassroom();$('classSummary').replaceChildren();$('classSummary').append(document.createTextNode('♧ '+room.className));const span=document.createElement('span');span.textContent=room.students.length?room.students.length+'명 · 명단 관리 →':'명단 등록하기 →';$('classSummary').append(span);
 document.querySelectorAll('.workspace-switch [data-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.view===view?'page':'false'));
 $('search').placeholder=view==='home'?'과목, 받아쓰기, 교사 도구 검색':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':'교사 도구 활동 이름으로 검색';
 let html='';const activities=W.list({trash:view==='trash',folder:folderId}).filter(a=>matches(a.title+' '+W.kinds[a.kind].name));const filteredTools=tools.filter(t=>(category==='전체'||t.category===category)&&matches(t.name+' '+t.situation+' '+t.tags.join(' ')));
 if(view==='activities'||view==='trash'){html='<div class="activity-grid">'+activities.map(a=>activityCard(a,view==='trash')).join('')+'</div>';if(!activities.length)html='<div class="empty"><strong>'+($('search').value?'검색 결과가 없어요.':view==='trash'?'보관한 활동이 없어요.':'아직 저장한 활동이 없어요.')+'</strong>'+(view==='trash'?'보관한 활동은 여기에서 다시 복원할 수 있어요.':'타이머·퀴즈·자리표에서 이름을 붙여 저장해 보세요.')+'</div>';
 }else if(view==='home'||view==='tools'||view==='favorites'){
   const isHome=view==='home',query=$('search').value.trim();
   const favoriteItems=filteredTools.filter(t=>Gulliver.isFavorite(t.href));
   if(view==='favorites'){
     html=favoriteItems.length?'<div class="tool-list">'+favoriteItems.map(toolCard).join('')+'</div>':'<div class="empty"><strong>즐겨찾는 도구를 모아 보세요.</strong>도구 옆의 ☆을 누르면 여기에 표시됩니다.</div>';
     $('content').innerHTML=html;document.querySelector('.storage-note').hidden=true;return;
   }
   if(isHome&&!query){
      html+=homeMaterials();
      if(favoriteItems.length)html+=section('즐겨찾는 도구','별표로 골라 둔 도구를 바로 열어요.','<div class="tool-list home-favorites">'+favoriteItems.slice(0,4).map(toolCard).join('')+'</div>','<button class="text-btn" data-view="favorites">즐겨찾기 모두 보기 →</button>');
      const featured=['시간 도구.html','이번 수업 알리미.html','플래시퀴즈메이커.html','자리 배정 프로그램.html'];
      const selected=featured.map(href=>tools.find(t=>t.href===href)).filter(Boolean);
      html+=section('수업 중 바로 사용','시간 안내부터 퀴즈, 자리 배정까지.','<div class="tool-list home-tool-list">'+selected.map(toolCard).join('')+'</div>','<button class="text-btn" data-view="tools">교사 도구 모두 보기 →</button>');
      const recentTools=Gulliver.getRecent().map(r=>tools.find(t=>t.href===r.href)).filter(Boolean).slice(0,4);
      if(recentTools.length)html+=section('최근 사용한 도구','','<div class="home-recent-tools">'+recentTools.map(t=>'<a data-tool="'+esc(t.href)+'" href="'+esc(t.href)+'"><span aria-hidden="true">'+toolIcon(t)+'</span><strong>'+esc(t.name)+'</strong><span aria-hidden="true">↗</span></a>').join('')+'</div>');
      const recent=W.list().slice(0,3);
      html+=section('저장한 활동 이어하기','이 브라우저에 저장한 타이머·퀴즈·자리표예요.',recent.length?'<div class="activity-grid">'+recent.map(a=>activityCard(a)).join('')+'</div>':'<div class="home-saved-empty"><span aria-hidden="true">▱</span><div><strong>다시 쓸 활동은 이름을 붙여 저장해 두세요.</strong><p>도구에서 저장한 활동을 여기에서 이어서 열 수 있어요.</p></div><button class="text-btn" data-view="tools">도구 둘러보기 →</button></div>','<button class="text-btn" data-view="activities">저장한 활동 모두 보기 →</button>');
      if(firstStartVisible())html+=firstStart();
   }else if(isHome&&query){
     const materials=materialLinks().filter(m=>matches(m.name+' '+m.description+' '+m.tags));
     if(materials.length)html+=section('문제지·받아쓰기 · '+materials.length+'개','','<div class="home-search-materials">'+materials.map(m=>'<a href="'+esc(m.href)+'"><span class="home-result-icon" aria-hidden="true">'+m.icon+'</span><span><strong>'+m.name+'</strong><small>'+m.description+'</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>');
     if(activities.length)html+=section('저장한 활동 · '+activities.length+'개','','<div class="activity-grid">'+activities.map(a=>activityCard(a)).join('')+'</div>');
     if(filteredTools.length)html+=section('사용할 수 있는 도구 · '+filteredTools.length+'개','','<div class="tool-list">'+filteredTools.map(toolCard).join('')+'</div>');
     if(!materials.length&&!activities.length&&!filteredTools.length)html='<div class="empty"><strong>검색 결과가 없어요.</strong>과목 이름이나 타이머·자리·받아쓰기처럼 필요한 일을 입력해 보세요.</div>';
   }else{
     const favorites=Gulliver.getFavorites().map(f=>tools.find(t=>t.href===f.href)).filter(Boolean);
     if(favorites.length&&!query&&category==='전체')html+='<div class="favorite-strip"><span>★ 즐겨찾기</span>'+favorites.map(t=>'<a data-tool="'+esc(t.href)+'" href="'+esc(t.href)+'">'+esc(t.icon)+' '+esc(t.name)+'</a>').join('')+'</div>';
     html+='<div class="browse-controls"><div class="chips">'+CATEGORIES.map(c=>'<button class="chip '+(c===category?'active':'')+'" data-category="'+esc(c)+'" aria-pressed="'+(c===category)+'">'+esc(c)+'</button>').join('')+'</div><span class="tool-count">'+filteredTools.length+'개 도구</span></div>';
     const groups=category==='전체'?CATEGORIES.slice(1):[category];
     groups.forEach(group=>{const items=filteredTools.filter(t=>t.category===group);if(items.length)html+='<section class="tool-group"><h2>'+esc(group)+'<small>'+items.length+'</small></h2><div class="tool-list">'+items.map(toolCard).join('')+'</div></section>'});
     if(!filteredTools.length)html+='<div class="empty"><strong>검색 결과가 없어요.</strong>다른 검색어나 분류로 찾아보세요.</div>';
   }
 }
 document.querySelectorAll('.workspace-switch [data-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.view===view?'page':'false'));
 $('search').placeholder=view==='home'?'과목, 받아쓰기, 교사 도구 검색':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':'교사 도구 활동 이름으로 검색';
 document.querySelector('.storage-note').hidden=['home','tools','favorites'].includes(view);

 $('content').innerHTML=html;
 const status=$('homeSearchStatus');if(status)status.textContent=$('search').value.trim()?$('content').querySelectorAll('.tool-row,.activity-card,.home-search-materials>a').length+'개 검색 결과':'';
}
function edit(title,label,value,action,move=false){editAction=action;$('editTitle').textContent=title;$('editLabel').textContent=label;$('editValue').hidden=move;$('editValue').required=!move;$('editFolder').hidden=!move;$('editValue').value=value||'';if(move){$('editFolder').innerHTML='<option value="">미분류</option>'+W.read().folders.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('');$('editFolder').value=value||''}$('editDialog').showModal();(move?$('editFolder'):$('editValue')).focus()}
function create(){location.href='문제지 만들기.html'}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;try{
 if(b.hasAttribute('data-dismiss-first-start')){try{localStorage.setItem(FIRST_START_KEY,'1')}catch{}render()}else if(b.dataset.view)switchView(b.dataset.view);else if(b.dataset.folder)switchView('activities',b.dataset.folder);else if(b.dataset.category){category=b.dataset.category;render()}else if(b.hasAttribute('data-create'))create();else if(b.dataset.star){const t=tools.find(t=>t.href===b.dataset.star);if(t)Gulliver.toggleFavorite(t)}else if(b.dataset.tool){const t=tools.find(t=>t.href===b.dataset.tool);if(t)Gulliver.trackTool(t)}else if(b.dataset.duplicate){W.duplicate(b.dataset.duplicate);toast('활동을 복제했습니다.')}else if(b.dataset.archive){W.change(b.dataset.archive,{archived:true});toast('보관함으로 옮겼습니다. 언제든 복원할 수 있어요.')}else if(b.dataset.restore){W.change(b.dataset.restore,{archived:false});toast('내 활동으로 복원했습니다.')}else if(b.dataset.rename){const a=W.get(b.dataset.rename);if(a)edit('활동 이름 바꾸기','활동 이름',a.title,v=>W.change(a.id,{title:v.trim().slice(0,80)||a.title}))}else if(b.dataset.move){const a=W.get(b.dataset.move);if(a)edit('폴더로 옮기기','폴더 선택',a.folderId,v=>W.change(a.id,{folderId:v}),true)}
 }catch(error){toast(error.message||'변경 내용을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.')}});
$('editForm').onsubmit=e=>{e.preventDefault();try{editAction?.($('editFolder').hidden?$('editValue').value:$('editFolder').value);$('editDialog').close()}catch(error){toast(error.message||'저장하지 못했습니다.')}};$('editCancel').onclick=()=>$('editDialog').close();$('newFolder').onclick=()=>edit('폴더 만들기','폴더 이름','',name=>W.folder(name));$('createButton').onclick=create;$('topCreate').onclick=create;$('search').oninput=render;
try{document.body.classList.toggle('rail-expanded',localStorage.getItem('gulliver.railExpanded')==='true')}catch{}
function syncRail(){const expanded=document.body.classList.contains('rail-expanded');$('railToggle').setAttribute('aria-expanded',String(expanded));$('railToggle').setAttribute('aria-label',expanded?'메뉴 접기':'메뉴 펼치기')}
syncRail();$('railToggle').onclick=()=>{document.body.classList.toggle('rail-expanded');syncRail();try{localStorage.setItem('gulliver.railExpanded',String(document.body.classList.contains('rail-expanded')))}catch{}};
$('menuButton').onclick=()=>{const open=document.body.classList.toggle('menu-open');$('menuButton').setAttribute('aria-expanded',String(open))};$('scrim').onclick=()=>{document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')}});
$('backup').onclick=()=>{try{W.download()}catch{toast('백업 파일을 만들지 못했습니다.')}};$('restore').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('5MB 이하의 활동 백업 파일을 선택해 주세요.');const count=W.importBundle(JSON.parse(await file.text()));toast(count+'개 활동을 불러왔습니다. 기존 활동은 유지됩니다.')}catch(error){toast(error.message||'백업 파일을 확인해 주세요.')}finally{e.target.value=''}};
window.addEventListener('gulliver:activities-change',render);window.addEventListener('gulliver:favorites-change',render);window.addEventListener('gulliver:classroom-change',render);window.addEventListener('storage',render);render();
})();
