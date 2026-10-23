(function(){
'use strict';
const W=ClassroomWorkspace,tools=ClassroomTools,$=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATEGORIES=['전체','시간·수업 안내','뽑기·편성','퀴즈·놀이','학급 관리','자료·기록'];
const FORMATS=[['korean','국어','가','#e88460','낱말·띄어쓰기·읽기'],['math','수학','＋','#408ac4','연산·곱셈·분수'],['social','사회','◎','#da9742','방향·우리 사회·경제'],['science','과학','✳','#4aa98e','생물·물질·날씨'],['english','영어','A','#8564c8','낱말·문장·대화']];
function startTiles(){
 return '<div class="format-grid daily-subject-grid">'+FORMATS.map(f=>'<a class="format-tile" href="문제지 만들기.html?subject='+f[0]+'" style="--format-accent:'+f[3]+'" aria-label="'+f[1]+' 문제지 만들기"><span class="format-symbol" aria-hidden="true">'+f[2]+'</span><span class="format-copy"><strong>'+f[1]+'</strong><small>'+f[4]+'</small></span></a>').join('')+'</div>';
}
const requestedView=new URLSearchParams(location.search).get('view');
if(requestedView==='templates')location.replace('문제지 만들기.html');
let view=['home','tools','activities','favorites','trash'].includes(requestedView)?requestedView:'home',folderId='',category='전체',editAction=null,toastTimer;
const descriptions={home:['매일 수업','필요한 문제를 뽑고, 수업 도구를 바로 실행하세요.'],favorites:['즐겨찾기','자주 쓰는 교사 도구를 빠르게 꺼내 보세요.'],activities:['교실 활동','저장한 타이머·퀴즈·자리표를 다시 열어요.'],tools:['교사 도구','수업 준비와 진행에 필요한 도구를 골라 쓰세요.'],trash:['보관한 활동','보관한 활동은 교사 도구 활동 목록으로 복원할 수 있어요.']};
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
 $('search').placeholder=view==='home'?'교사 도구·활동 검색':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':'교사 도구 활동 이름으로 검색';
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
      html+='<section class="home-block home-design"><div class="section-head"><div><h2>오늘의 문제지 만들기</h2><p>교과를 고르고 같은 유형의 새 문제를 계속 뽑을 수 있어요.</p></div><a class="text-btn" href="문제지 만들기.html">문제지 만들기 →</a></div>'+startTiles()+'</section>';
      const featured=['수업 흐름 타이머','낱말카드·퀴즈','교실 자리 배정','우리 반 투표판'];
      const selected=featured.map(n=>tools.find(t=>t.name===n)).filter(Boolean);
      html+=section('수업 중 바로 사용','수업을 준비하거나 진행할 때 쓰는 도구예요.',
        '<div class="tool-list home-tool-list">'+selected.map(toolCard).join('')+'</div>',
        '<button class="text-btn" data-view="tools">도구 전체 보기 →</button>');
      if(favoriteItems.length)html+=section('즐겨찾는 수업 활동','','<div class="tool-list">'+favoriteItems.slice(0,4).map(toolCard).join('')+'</div>');
      const recent=W.list().slice(0,6);
      if(recent.length)html+=section('최근 교사 도구 활동','이 브라우저에 저장한 활동을 다시 열어요.','<div class="activity-grid">'+recent.map(a=>activityCard(a)).join('')+'</div>','<button class="text-btn" data-view="activities">활동 모두 보기 →</button>');
   }else if(isHome&&query){
     if(activities.length)html+=section('저장한 활동 · '+activities.length+'개','','<div class="activity-grid">'+activities.map(a=>activityCard(a)).join('')+'</div>');
     if(filteredTools.length)html+=section('사용할 수 있는 도구 · '+filteredTools.length+'개','','<div class="tool-list">'+filteredTools.map(toolCard).join('')+'</div>');
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
 $('search').placeholder=view==='home'?'교사 도구·활동 검색':view==='tools'||view==='favorites'?'도구 이름이나 필요한 일로 검색':'교사 도구 활동 이름으로 검색';
 document.querySelector('.storage-note').hidden=['home','tools','favorites'].includes(view);

 $('content').innerHTML=html;
}
function edit(title,label,value,action,move=false){editAction=action;$('editTitle').textContent=title;$('editLabel').textContent=label;$('editValue').hidden=move;$('editValue').required=!move;$('editFolder').hidden=!move;$('editValue').value=value||'';if(move){$('editFolder').innerHTML='<option value="">미분류</option>'+W.read().folders.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('');$('editFolder').value=value||''}$('editDialog').showModal();(move?$('editFolder'):$('editValue')).focus()}
function create(){location.href='문제지 만들기.html'}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;try{
 if(b.dataset.view)switchView(b.dataset.view);else if(b.dataset.folder)switchView('activities',b.dataset.folder);else if(b.dataset.category){category=b.dataset.category;render()}else if(b.hasAttribute('data-create'))create();else if(b.dataset.star){const t=tools.find(t=>t.href===b.dataset.star);if(t)Gulliver.toggleFavorite(t)}else if(b.dataset.tool){const t=tools.find(t=>t.href===b.dataset.tool);if(t)Gulliver.trackTool(t)}else if(b.dataset.duplicate){W.duplicate(b.dataset.duplicate);toast('활동을 복제했습니다.')}else if(b.dataset.archive){W.change(b.dataset.archive,{archived:true});toast('보관함으로 옮겼습니다. 언제든 복원할 수 있어요.')}else if(b.dataset.restore){W.change(b.dataset.restore,{archived:false});toast('내 활동으로 복원했습니다.')}else if(b.dataset.rename){const a=W.get(b.dataset.rename);if(a)edit('활동 이름 바꾸기','활동 이름',a.title,v=>W.change(a.id,{title:v.trim().slice(0,80)||a.title}))}else if(b.dataset.move){const a=W.get(b.dataset.move);if(a)edit('폴더로 옮기기','폴더 선택',a.folderId,v=>W.change(a.id,{folderId:v}),true)}
 }catch(error){toast(error.message||'변경 내용을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.')}});
$('editForm').onsubmit=e=>{e.preventDefault();try{editAction?.($('editFolder').hidden?$('editValue').value:$('editFolder').value);$('editDialog').close()}catch(error){toast(error.message||'저장하지 못했습니다.')}};$('editCancel').onclick=()=>$('editDialog').close();$('newFolder').onclick=()=>edit('폴더 만들기','폴더 이름','',name=>W.folder(name));$('createButton').onclick=create;$('topCreate').onclick=create;$('search').oninput=render;
try{document.body.classList.toggle('rail-expanded',localStorage.getItem('gulliver.railExpanded')==='true')}catch{}
function syncRail(){const expanded=document.body.classList.contains('rail-expanded');$('railToggle').setAttribute('aria-expanded',String(expanded));$('railToggle').setAttribute('aria-label',expanded?'메뉴 접기':'메뉴 펼치기')}
syncRail();$('railToggle').onclick=()=>{document.body.classList.toggle('rail-expanded');syncRail();try{localStorage.setItem('gulliver.railExpanded',String(document.body.classList.contains('rail-expanded')))}catch{}};
$('menuButton').onclick=()=>{const open=document.body.classList.toggle('menu-open');$('menuButton').setAttribute('aria-expanded',String(open))};$('scrim').onclick=()=>{document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');$('menuButton').setAttribute('aria-expanded','false')}});
$('backup').onclick=()=>{try{W.download()}catch{toast('백업 파일을 만들지 못했습니다.')}};$('restore').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw Error('5MB 이하의 활동 백업 파일을 선택해 주세요.');const count=W.importBundle(JSON.parse(await file.text()));toast(count+'개 활동을 불러왔습니다. 기존 활동은 유지됩니다.')}catch(error){toast(error.message||'백업 파일을 확인해 주세요.')}finally{e.target.value=''}};
window.addEventListener('gulliver:activities-change',render);window.addEventListener('gulliver:favorites-change',render);window.addEventListener('gulliver:classroom-change',render);window.addEventListener('storage',render);render();
})();
