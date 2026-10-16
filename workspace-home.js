(function(){
'use strict';
const W=ClassroomWorkspace,tools=ClassroomTools,$=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATEGORIES=['전체','시간·수업 안내','뽑기·편성','퀴즈·놀이','학급 관리','자료·기록'];
const FORMATS=[
 ['presentation','발표 자료','canvas','▤','#ff6c29','한 화면 편집 · PDF로 인쇄','presentation'],
 ['worksheet','학습지·도안','canvas','◇','#09a96a','통합 캔버스 · 인쇄물','worksheet'],
 ['custom','빈 디자인','canvas','✦','#7750dc','글씨·사진·도형 자유롭게 편집','blank'],
 ['document','문서·안내장','document','≡','#367ce8','한글·워드 문서 만들기'],
 ['video','동영상','video','▶','#d54fc4','영상 만들고 편집하기'],
 ['picture','그림·사진','picture','▧','#188cba','사진과 그림 편집하기'],
 ['pdf','PDF','pdf','▣','#df5f69','PDF 합치기·나누기'],
 ['music','음악','music','♫','#7561d7','배경음악 만들고 편집하기']
];
function startTiles(){
 return '<div class="format-grid">'+FORMATS.map(f=>'<a class="format-tile" href="뚝딱 제작실.html?new='+f[2]+(f[6]?'&amp;template='+f[6]:'')+'" style="--format-accent:'+f[4]+'" aria-label="'+f[1]+' 만들기"><span class="format-symbol" aria-hidden="true">'+f[3]+'</span><strong>'+f[1]+'</strong><small>'+f[5]+'</small></a>').join('')+'</div>';
}
const requestedView=new URLSearchParams(location.search).get('view');
let view=['home','tools','activities','templates','favorites','trash'].includes(requestedView)?requestedView:'home',folderId='',category='전체',editAction=null,toastTimer;
const descriptions={home:['오늘은 무엇을 할까요?','수업을 시작하고, 자료를 만들고, 준비한 활동을 이어가세요.'],favorites:['즐겨찾기','자주 쓰는 도구를 모아 빠르게 꺼내 보세요.'],activities:['내 활동','이름을 붙여 저장한 수업 시간표, 낱말카드, 자리표를 모았어요.'],templates:['예시 활동','준비된 활동을 열고 우리 반에 맞게 바꿔 보세요.'],tools:['도구 찾기','필요한 도구를 한눈에 살펴보고 바로 실행하세요.'],trash:['보관함','보관한 활동은 다시 내 활동으로 복원할 수 있어요.']};
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
function templateCard(t){return '<article class="template-card"><a href="'+esc(W.kinds[t.kind].href+'?template='+t.id)+'">'+preview(t.kind,t.payload)+'<div class="card-info"><h3>'+esc(t.title)+'</h3><p>'+esc(t.desc)+'</p><p style="color:#6255e7;margin-top:10px;font-weight:750">이 예시로 시작하기 →</p></div></a></article>'}
function toolCard(t){const on=Gulliver.isFavorite(t.href);return '<article class="tool-row"><a class="tool-row-link" data-tool="'+esc(t.href)+'" href="'+esc(t.href)+'"><span class="tool-row-icon">'+esc(t.icon)+'</span><span class="tool-row-copy"><strong>'+esc(t.name)+'</strong><span>'+esc(t.subtitle||t.situation)+'</span></span><span class="tool-row-arrow" aria-hidden="true">↗</span></a><button class="star" data-star="'+esc(t.href)+'" aria-label="'+esc(t.name)+(on?' 즐겨찾기 해제':' 즐겨찾기 추가')+'" aria-pressed="'+on+'">'+(on?'★':'☆')+'</button></article>'}

function section(title,description,body,action=''){return '<section class="section"><div class="section-head"><div><h2>'+title+'</h2>'+(description?'<p>'+description+'</p>':'')+'</div>'+action+'</div>'+body+'</section>'}
function render(){
 document.body.classList.toggle('home-view',view==='home');
 const data=W.read(),currentFolder=data.folders.find(f=>f.id===folderId),titles=descriptions[view];$('pageTitle').textContent=currentFolder?currentFolder.name:titles[0];$('pageDescription').textContent=titles[1];
 document.querySelectorAll('.nav [data-view]').forEach(b=>b.setAttribute('aria-current',!folderId&&b.dataset.view===view?'page':'false'));
 document.querySelectorAll('.home-bottom-bar [data-view]').forEach(b=>b.setAttribute('aria-current',!folderId&&b.dataset.view===view?'page':'false'));
 $('folders').innerHTML=data.folders.length?data.folders.map(f=>'<button class="folder-link '+(f.id===folderId?'active':'')+'" data-folder="'+esc(f.id)+'">▱ '+esc(f.name)+'</button>').join(''):'<p style="font-size:11px;color:#a1a9b8;padding:0 13px;line-height:1.6">수업별로 활동을 모아 보세요.</p>';
 const room=Gulliver.getClassroom();$('classSummary').replaceChildren();$('classSummary').append(document.createTextNode('♧ '+room.className));const span=document.createElement('span');span.textContent=room.students.length?room.students.length+'명 · 명단 관리 →':'명단 등록하기 →';$('classSummary').append(span);
 document.querySelectorAll('.workspace-switch [data-view]').forEach(button=>button.setAttribute('aria-current',button.dataset.view===view?'page':'false'));
 $('search').placeholder=view==='home'?'무엇이 필요하세요? 도구와 내 활동을 검색해 보세요':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':view==='templates'?'예시 활동 검색':'내 활동 이름으로 검색';
 let html='';const activities=W.list({trash:view==='trash',folder:folderId}).filter(a=>matches(a.title+' '+W.kinds[a.kind].name));const filteredTools=tools.filter(t=>(view==='favorites'||!t.studioLegacy)&&(category==='전체'||t.category===category)&&matches(t.name+' '+t.situation+' '+t.tags.join(' ')));
 if(view==='activities'||view==='trash'){html=(view==='activities'?'<a class="studio-library-link activities-studio" href="뚝딱 제작실.html"><span class="studio-library-icon" aria-hidden="true">▦</span><span><strong>도안·발표·문서 등 내 작업 찾기</strong><small>제작실에서 만든 자료는 제작실의 내 작업에 보관돼요.</small></span><span aria-hidden="true">→</span></a>':'')+'<div class="activity-grid">'+activities.map(a=>activityCard(a,view==='trash')).join('')+'</div>';if(!activities.length)html=(view==='activities'?'<a class="studio-library-link activities-studio" href="뚝딱 제작실.html"><span class="studio-library-icon" aria-hidden="true">▦</span><span><strong>제작실에서 만든 자료 찾기</strong><small>도안·발표·문서 등은 제작실의 내 작업에 있어요.</small></span><span aria-hidden="true">→</span></a>':'')+'<div class="empty"><strong>'+($('search').value?'검색 결과가 없어요.':view==='trash'?'보관한 활동이 없어요.':'아직 저장한 활동이 없어요.')+'</strong>'+(view==='trash'?'보관한 활동은 여기에서 다시 복원할 수 있어요.':'타이머·퀴즈·자리표에서 이름을 붙여 저장해 보세요.')+'</div>';
 }else if(view==='templates'){const ts=W.templates.filter(t=>matches(t.title+' '+t.desc));html=ts.length?'<div class="template-grid">'+ts.map(templateCard).join('')+'</div>':'<div class="empty">검색 결과가 없어요.</div>';
 }else if(view==='home'||view==='tools'||view==='favorites'){
   const isHome=view==='home',query=$('search').value.trim();
   const templates=W.templates.filter(t=>matches(t.title+' '+t.desc));
   const favoriteItems=filteredTools.filter(t=>Gulliver.isFavorite(t.href));
   if(view==='favorites'){
     html=favoriteItems.length?'<div class="tool-list">'+favoriteItems.map(toolCard).join('')+'</div>':'<div class="empty"><strong>즐겨찾는 도구를 모아 보세요.</strong>도구 옆의 ☆을 누르면 여기에 표시됩니다.</div>';
     $('content').innerHTML=html;document.querySelector('.storage-note').hidden=true;return;
   }
   if(isHome&&!query){
     html+='<section class="home-block home-design"><div class="section-head"><div><h2>무엇을 만들까요?</h2><p>자료 종류를 고르면 바로 편집을 시작할 수 있어요.</p></div><a class="text-btn" href="뚝딱 제작실.html">제작실 보기 →</a></div>'+startTiles()+'</section>';
     html+=section('이어서 작업하기','타이머·퀴즈·자리표는 ‘내 활동’, 학습지·발표·영상은 제작실 ‘내 작업’에서 열어요.',
       (activities.length?'<div class="activity-grid recent-rail">'+activities.slice(0,3).map(a=>activityCard(a)).join('')+'</div>':'')+
       '<a class="studio-library-link" href="뚝딱 제작실.html"><span class="studio-library-icon" aria-hidden="true">▦</span><span><strong>제작실의 내 작업</strong><small>도안·발표·문서·영상·음악 작업을 확인해 보세요.</small></span><span aria-hidden="true">→</span></a>',
       '<button class="text-btn" data-view="activities">내 활동 보기 →</button>');
     if(templates.length)html+=section('수업 템플릿으로 시작','준비된 예시를 열어 우리 반에 맞게 수정하세요.',
       '<div class="template-grid home-template-grid">'+templates.slice(0,3).map(templateCard).join('')+'</div>',
       '<button class="text-btn" data-view="templates">모두 보기 →</button>');
     const featured=['수업 흐름 타이머','낱말카드·퀴즈','교실 자리 배정','범퍼 룰렛 레이스','성취기준·세특 도우미','이번 수업 알리미','영상 뚝딱','음악 뚝딱'];
     const selected=featured.map(n=>tools.find(t=>t.name===n)).filter(Boolean);
     html+=section('수업에 바로 쓰는 도구','필요한 순간에 바로 실행하는 교실 도구예요.',
       '<div class="tool-list home-tool-list">'+selected.map(toolCard).join('')+'</div>',
       '<button class="text-btn" data-view="tools">전체 도구 보기 →</button>');
     const quickNames=['영상 뚝딱','음악 뚝딱','뚝딱 제작실','QR 코드 도구','우리 반 투표판','수업 흐름 타이머','낱말카드·퀴즈','교실 자리 배정'];
     html+=section('기능 바로가기','자주 쓰는 편집기와 수업 도구를 바로 열어 보세요.',
       '<nav class="quick-tools" aria-label="기능 바로가기">'+quickNames.map(name=>tools.find(t=>t.name===name)).filter(Boolean).map(t=>'<a class="quick-tool" data-tool="'+esc(t.href)+'" href="'+esc(t.href)+'" style="--tool-accent:'+esc(t.accent)+'"><span class="quick-icon">'+esc(t.icon)+'</span><span>'+esc(t.name)+'</span></a>').join('')+'</nav>');

   }else if(isHome&&query){
     const results=activities.length+templates.length+filteredTools.length;
     if(activities.length)html+=section('내 활동 · '+activities.length+'개','','<div class="activity-grid">'+activities.map(a=>activityCard(a)).join('')+'</div>');
     if(templates.length)html+=section('수업 템플릿 · '+templates.length+'개','','<div class="template-grid home-template-grid">'+templates.map(templateCard).join('')+'</div>');
     if(filteredTools.length)html+=section('사용할 수 있는 도구 · '+filteredTools.length+'개','','<div class="tool-list">'+filteredTools.map(toolCard).join('')+'</div>');
     if(!results)html='<div class="empty"><strong>검색 결과가 없어요.</strong>다른 단어나 수업 자료 종류로 검색해 보세요.</div>';
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
 $('search').placeholder=view==='home'?'무엇이 필요하세요? 도구와 내 활동을 검색해 보세요':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':view==='templates'?'예시 활동 검색':'내 활동 이름으로 검색';
 document.querySelector('.storage-note').hidden=['home','tools','favorites'].includes(view);

 $('content').innerHTML=html;
}
function edit(title,label,value,action,move=false){editAction=action;$('editTitle').textContent=title;$('editLabel').textContent=label;$('editValue').hidden=move;$('editValue').required=!move;$('editFolder').hidden=!move;$('editValue').value=value||'';if(move){$('editFolder').innerHTML='<option value="">미분류</option>'+W.read().folders.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('');$('editFolder').value=value||''}$('editDialog').showModal();(move?$('editFolder'):$('editValue')).focus()}
function create(){$('createDialog').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;try{
 if(b.dataset.view)switchView(b.dataset.view);else if(b.dataset.folder)switchView('activities',b.dataset.folder);else if(b.dataset.category){category=b.dataset.category;render()}else if(b.hasAttribute('data-create'))create();else if(b.dataset.star){const t=tools.find(t=>t.href===b.dataset.star);if(t)Gulliver.toggleFavorite(t)}else if(b.dataset.tool){const t=tools.find(t=>t.href===b.dataset.tool);if(t)Gulliver.trackTool(t)}else if(b.dataset.duplicate){W.duplicate(b.dataset.duplicate);toast('활동을 복제했습니다.')}else if(b.dataset.archive){W.change(b.dataset.archive,{archived:true});toast('보관함으로 옮겼습니다. 언제든 복원할 수 있어요.')}else if(b.dataset.restore){W.change(b.dataset.restore,{archived:false});toast('내 활동으로 복원했습니다.')}else if(b.dataset.rename){const a=W.get(b.dataset.rename);if(a)edit('활동 이름 바꾸기','활동 이름',a.title,v=>W.change(a.id,{title:v.trim().slice(0,80)||a.title}))}else if(b.dataset.move){const a=W.get(b.dataset.move);if(a)edit('폴더로 옮기기','폴더 선택',a.folderId,v=>W.change(a.id,{folderId:v}),true)}
 }catch(error){toast(error.message||'변경 내용을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.')}});
$('editForm').onsubmit=e=>{e.preventDefault();try{editAction?.($('editFolder').hidden?$('editValue').value:$('editFolder').value);$('editDialog').close()}catch(error){toast(error.message||'저장하지 못했습니다.')}};$('editCancel').onclick=()=>$('editDialog').close();$('newFolder').onclick=()=>edit('폴더 만들기','폴더 이름','',name=>W.folder(name));$('createButton').onclick=create;$('topCreate').onclick=create;$('createDialog').querySelector('[data-close]').onclick=()=>$('createDialog').close();$('browseTemplates').onclick=()=>{$('createDialog').close();switchView('templates')};$('search').oninput=render;
try{document.body.classList.toggle('rail-expanded',localStorage.getItem('gulliver.railExpanded')==='true')}catch{}
function syncRail(){const expanded=document.body.classList.contains('rail-expanded');$('railToggle').setAttribute('aria-expanded',String(expanded));$('railToggle').setAttribute('aria-label',expanded?'메뉴 접기':'메뉴 펼치기')}
syncRail();$('railToggle').onclick=()=>{document.body.classList.toggle('rail-expanded');syncRail();try{localStorage.setItem('gulliver.railExpanded',String(document.body.classList.contains('rail-expanded')))}catch{}};
$('menuButton').onclick=()=>{const open=document.body.classList.toggle('menu-open');$('menuButton').setAttribute('aria-expanded',String(open))};$('scrim').onclick=()=>{document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')}});
$('backup').onclick=()=>{try{W.download()}catch{toast('백업 파일을 만들지 못했습니다.')}};$('restore').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('5MB 이하의 활동 백업 파일을 선택해 주세요.');const count=W.importBundle(JSON.parse(await file.text()));toast(count+'개 활동을 불러왔습니다. 기존 활동은 유지됩니다.')}catch(error){toast(error.message||'백업 파일을 확인해 주세요.')}finally{e.target.value=''}};
window.addEventListener('gulliver:activities-change',render);window.addEventListener('gulliver:favorites-change',render);window.addEventListener('gulliver:classroom-change',render);window.addEventListener('storage',render);render();
})();
