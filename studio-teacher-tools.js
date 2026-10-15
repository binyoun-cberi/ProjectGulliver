/* Native teacher tools: import existing activities as editable canvas pages, not screenshots. */
(()=>{
'use strict';
const T=window.GulliverTeacherCanvas,A=window.GulliverStudioAdapter,G=window.Gulliver;
const pane=document.querySelector('.design-pane[data-pane="teacher"]');
if(!pane||!T||!A)return;
const root=document.createElement('section');
root.className='canvas-teacher-integrations';
root.innerHTML=[
 '<div class="teacher-intro"><strong>수업 도구를 캔버스로 가져오기</strong><p>저장한 활동을 편집 가능한 페이지로 복사해요. 원본 활동은 그대로 유지됩니다.</p></div>',
 '<div class="teacher-linked-group"><label for="teacherSavedActivity">내 활동</label><select id="teacherSavedActivity"><option value="">저장한 활동 선택</option></select>',
 '<div class="teacher-actions"><button type="button" id="teacherRefreshActivities">↻ 새로고침</button><button type="button" class="teacher-primary" id="teacherImportActivity">＋ 페이지로 추가</button></div></div>',
 '<div class="teacher-tool-grid">',
 '<button type="button" data-teacher-convert="flash"><strong>▤ 낱말카드</strong><span>문제와 정답을 각각 편집하는 슬라이드</span></button>',
 '<button type="button" data-teacher-convert="timer"><strong>◷ 수업 흐름표</strong><span>수업 타이머를 한 장짜리 안내판으로</span></button>',
 '<button type="button" data-teacher-convert="seating"><strong>▦ 교실 자리표</strong><span>저장된 배정 결과 또는 빈 자리표</span></button>',
 '<button type="button" data-teacher-convert="check"><strong>☑ 학급 체크판</strong><span>학급췍 기록을 편집 가능한 체크판으로</span></button></div>',
 '<div class="teacher-convert-status" id="teacherConvertStatus" role="status">새 페이지가 현재 작업의 뒤에 추가돼요.</div>',
 '<details class="teacher-original-tools"><summary>실시간 수업 도구 열기 ↗</summary>',
 '<p>게임·룰렛·타이머는 원래 도구에서 실행할 수 있어요. 편집 가능한 페이지와는 별개입니다.</p>',
 '<div class="teacher-original-links">',
 '<a href="지도안식 원형 타이머.html" target="_blank" rel="noopener noreferrer">수업 타이머</a>',
 '<a href="플래시퀴즈메이커.html" target="_blank" rel="noopener noreferrer">퀴즈 메이커</a>',
 '<a href="자리 배정 프로그램.html" target="_blank" rel="noopener noreferrer">자리 배정</a>',
 '<a href="학급췍.html" target="_blank" rel="noopener noreferrer">학급췍</a>',
 '<a href="칭찬 온도계.html" target="_blank" rel="noopener noreferrer">칭찬 온도계</a>',
 '<a href="범퍼 룰렛.html" target="_blank" rel="noopener noreferrer">범퍼 룰렛</a>',
 '<a href="QR코드.html" target="_blank" rel="noopener noreferrer">QR 코드</a></div></details>'
].join('');
pane.append(root);
const select=root.querySelector('#teacherSavedActivity'),status=root.querySelector('#teacherConvertStatus');
const safe=(key,backup)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??backup}catch{return backup}};
const room=()=>G?.getClassroom?.()||{className:'우리 반',students:[]};
const inform=(message,error=false)=>{status.textContent=message;status.classList.toggle('error',error)};
function activities(){
 const bundle=safe('gulliver.activities.v1',{});
 return (Array.isArray(bundle.activities)?bundle.activities:[])
 .filter(a=>a&&['quiz','timer','seating'].includes(a.kind)&&a.payload&&!a.archived)
 .sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,100);
}
function refresh(){
 const old=select.value,kind={quiz:'낱말카드',timer:'수업 타이머',seating:'자리표'};
 select.replaceChildren(new Option('저장한 활동 선택',''));
 for(const item of activities())select.append(new Option(kind[item.kind]+' · '+String(item.title||'제목 없는 활동').slice(0,60),item.id));
 if([...select.options].some(o=>o.value===old))select.value=old;
 inform(select.options.length>1?'내 활동 '+(select.options.length-1)+'개를 불러왔어요.':'내 활동이 없다면 아래 도구에서 새 자료를 만들 수 있어요.');
}
function add(builder){
 try{
  const layout=A.capture().layout,result=builder(layout);
  const count=A.appendTeacherPages(result);
  inform(result.description+' · '+count+'장 추가했어요. 원본은 유지돼요.');
  if(matchMedia('(max-width:700px)').matches)document.querySelector('.design-panel-close')?.click();
 }catch(e){inform(e.message||String(e),true)}
}
root.querySelector('#teacherRefreshActivities').addEventListener('click',refresh);
root.querySelector('#teacherImportActivity').addEventListener('click',()=>{
 const item=activities().find(a=>a.id===select.value);
 if(!item){inform('가져올 활동을 먼저 선택해 주세요.',true);return}
 add(layout=>T.convertActivity(item,{layout,students:room().students}));
});
const sampleTimer=[
 {name:'도입 · 이야기 나누기',durationSec:300,color:'#6654BD'},
 {name:'함께 활동하기',durationSec:900,color:'#16847C'},
 {name:'정리하고 나누기',durationSec:300,color:'#E6A04F'}
];
root.querySelectorAll('[data-teacher-convert]').forEach(button=>button.addEventListener('click',()=>{
 add(layout=>{
  const current=room(),key=button.dataset.teacherConvert;
  if(key==='flash'){
   const db=safe('flashQuizMakerPlusV3',{});
   if(!Array.isArray(db.cards)||!db.cards.length)throw Error('퀴즈 메이커에서 낱말카드를 저장한 뒤 사용해 주세요.');
   return T.quizCards(db.cards,{layout,title:'우리 반 낱말카드'});
  }
  if(key==='timer'){
   const previous=activities().find(a=>a.kind==='timer');
   return T.timerPlan(previous?.payload?.events||sampleTimer,{layout,title:previous?.title||'우리 반 수업 흐름표'});
  }
  if(key==='seating'){
   const settings=safe('gulliver.seating.v3',{});
   const config={cols:settings?.cols||5,rows:settings?.rows||4};
   const hist=safe('gulliver.seating.history.v1',[]);
   const latest=Array.isArray(hist)?hist[0]:null;
   const matching=latest?.cols===config.cols&&latest?.rows===config.rows&&Array.isArray(latest?.seats);
   const lookup=new Map((Array.isArray(settings?.students)?settings.students:current.students).map(s=>[String(s.id),s.name]));
   const seatNames=matching?latest.seats.map(id=>id?lookup.get(String(id))||'':''):[];
   return T.seatingPlan(config,{layout,title:matching?'최근 교실 자리표':'우리 반 자리표',students:current.students,seatNames});
  }
  if(key==='check'){
   const check=safe('classChecklistState',{});
   const stored=Array.isArray(check.studentNames)?check.studentNames.filter(Boolean):[];
   const students=stored.length?stored:current.students.map(s=>s.name);
   if(!students.length)throw Error('학급췍 또는 우리 반에서 학생 이름을 먼저 저장해 주세요.');
   const theme=String(check.currentTheme||'우리 반 체크판');
   const data=check.data?.[theme]||{};
   return T.checklist({theme,students,checks:students.map((_,i)=>Boolean(data[i+1]))},{layout,title:theme});
  }
  throw Error('연결하지 않은 도구예요.');
 });
}));
window.addEventListener('storage',e=>{if(!e.key||e.key==='gulliver.activities.v1')refresh()});
window.addEventListener('gulliver:activities-change',refresh);
refresh();
})();
