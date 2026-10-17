/* Native teacher tools: import existing activities as editable canvas pages, not screenshots. */
(()=>{
'use strict';
const T=window.GulliverTeacherCanvas,S=window.GulliverTeacherSource,A=window.GulliverStudioAdapter,G=window.Gulliver;
const pane=document.querySelector('.design-pane[data-pane="teacher"]');
if(!pane||!T||!S||!A)return;
const root=document.createElement('section');
root.className='canvas-teacher-integrations';
root.innerHTML=[
 '<div class="teacher-intro"><strong>교사 도구 실행 · 결과 가져오기</strong><p>아래 도구를 직접 실행한 뒤, 실제 결과를 지금 만들던 자료에 추가할 수 있어요. 원본은 바뀌지 않아요.</p></div>',
 '<div class="teacher-linked-group"><label for="teacherSavedActivity">기존에 저장한 활동 가져오기</label><select id="teacherSavedActivity"><option value="">저장한 활동 선택</option></select>',
 '<div class="teacher-actions"><button type="button" id="teacherRefreshActivities">↻ 새로고침</button><button type="button" class="teacher-primary" id="teacherImportActivity">＋ 페이지로 추가</button></div></div>',
 '<div class="teacher-tool-grid">',
 '<button type="button" data-teacher-convert="flash"><strong>▤ 낱말카드 가져오기</strong><span>마지막으로 저장한 문제·정답 카드</span></button>',
 '<button type="button" data-teacher-convert="timer"><strong>◷ 수업 시간표 가져오기</strong><span>수업 타이머에서 실제 설정한 단계</span></button>',
 '<button type="button" data-teacher-convert="seating"><strong>▦ 확정 자리표 가져오기</strong><span>배정한 학생과 사용하지 않는 자리까지</span></button>',
 '<button type="button" data-teacher-convert="check"><strong>☑ 학급 체크판 가져오기</strong><span>학생별 실제 완료 상태를 복사</span></button></div>',
 '<div class="teacher-convert-status" id="teacherConvertStatus" role="status">가져온 결과는 새 페이지로 추가돼요. 저장된 기록이 없으면 예시를 대신 넣지 않아요.</div>',
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
const kinds={flash:'quiz',timer:'timer',seating:'seating',check:'check'};
function recent(kind,live=null){
 const classroom=room();
 return S.prepare(kind,{layout:A.capture().layout,read:key=>safe(key,null),room:classroom,live});
}
root.querySelectorAll('[data-teacher-convert]').forEach(button=>button.addEventListener('click',()=>{
 const kind=kinds[button.dataset.teacherConvert];
 add(()=>recent(kind));
}));
window.GulliverTeacherImport={recent};
window.addEventListener('storage',e=>{if(!e.key||e.key==='gulliver.activities.v1')refresh()});
window.addEventListener('gulliver:activities-change',refresh);
refresh();
})();
