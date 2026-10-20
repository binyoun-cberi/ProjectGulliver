/* Run original classroom tools without leaving the editor, then import real saved outcomes.
 * The embedded tools are same-origin; editor/project storage is never overwritten. */
(()=>{
'use strict';
const A=window.GulliverStudioAdapter,S=window.GulliverTeacherSnapshots,N=window.GulliverTeacherNext;
const pane=document.querySelector('.design-pane[data-pane="teacher"]');
if(!A||!S||!N||!pane)return;
const tools=[
 {id:'bus',icon:'▥',name:'버스 좌석 배치',url:'버스 좌석 배치 프로그램.html',summary:'확정한 10열×4석 자리표·통로를 편집 가능한 도안으로'},
 {id:'tournament',icon:'♜',name:'토너먼트 메이커',url:'토너먼트 메이커.html',summary:'실제 경기 대진과 승패를 편집 가능한 대진표로'},
 {id:'lesson',icon:'▣',name:'이번 수업 알리미',url:'이번 수업 알리미.html',summary:'학습 목표·활동을 편집 가능한 안내판으로'},
 {id:'groups',icon:'▦',name:'모둠 만들기',url:'행운의 모둠 메이커.html',summary:'확정된 모둠별 이름표·모둠표 만들기'},
 {id:'roles',icon:'◇',name:'학급 역할 배정',url:'학급 배정 도우미.html',summary:'확정된 역할·담당자 표 만들기'},
 {id:'timer',icon:'◷',name:'수업 흐름 타이머',url:'지도안식 원형 타이머.html',summary:'단계를 운영하고 시간표로 추가'},
 {id:'quiz',icon:'▤',name:'낱말카드·퀴즈',url:'플래시퀴즈메이커.html',summary:'문제·정답 카드를 만들어 추가'},
 {id:'seating',icon:'▦',name:'교실 자리 배정',url:'자리 배정 프로그램.html',summary:'학생 자리를 배정하고 자리표 추가'},
 {id:'check',icon:'☑',name:'학급췍',url:'학급췍.html',summary:'준비물·과제를 확인하고 체크판 추가'},
 {id:'praise',icon:'☆',name:'칭찬 온도계',url:'칭찬 온도계.html',summary:'칭찬을 기록하고 현재 점수표 추가'},
 {id:'vote',icon:'▥',name:'우리 반 투표판',url:'우리반 선관위.html',summary:'투표를 진행하고 집계 결과 추가'},
 {id:'roulette',icon:'◎',name:'범퍼 룰렛',url:'범퍼 룰렛.html',summary:'레이스를 실행하고 실제 결과 추가'},
 {id:'qr',icon:'▧',name:'QR 코드 만들기',url:'QR코드.html',summary:'QR을 만들어 이미지로 추가'}
];
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const bar=document.createElement('section');bar.className='teacher-live-tools';bar.id='teacherLiveTools';
bar.innerHTML=[
 '<div class="teacher-live-heading"><strong>수업 도구</strong><small>실행 중인 도구에서 바로 수정하고, 원하는 결과를 자료에 추가하세요.</small></div>',
 '<div class="teacher-live-grid" id="teacherLiveGrid"></div>',
 '<p class="teacher-live-note">수업 도구를 닫아도 지금 만들던 자료는 그대로 남아요. ‘결과를 캔버스로’를 누르면 편집 가능한 복사본이 추가돼요.</p>'
].join('');
const native=pane.querySelector('.canvas-activities');if(native)native.after(bar);else pane.prepend(bar);
const dlg=document.createElement('dialog');dlg.id='teacherLiveDialog';dlg.className='teacher-live-dialog';dlg.setAttribute('aria-label','교사 도구 실행 창');
dlg.innerHTML=[
 '<div class="teacher-run-head"><div><strong id="teacherLiveTitle">교사 도구</strong><small id="teacherLiveDesc">원본 도구를 실행합니다</small></div>',
 '<div class="teacher-run-actions"><button type="button" id="teacherCopyResult">＋ 새 페이지로 추가</button><button type="button" id="teacherRefreshResult" hidden>↻ 기존 자료 갱신</button><button type="button" id="teacherLiveClose">× 닫기</button></div></div>',
 '<p id="teacherLiveStatus" class="teacher-live-status" role="status">수업 도구를 준비하고 있어요.</p>',
 '<iframe id="teacherLiveFrame" title="실행 중인 교사 도구" referrerpolicy="same-origin" allow="camera; microphone; fullscreen" loading="eager"></iframe>'
].join('');
document.body.append(dlg);
const grid=bar.querySelector('#teacherLiveGrid'),frame=dlg.querySelector('#teacherLiveFrame'),
 status=dlg.querySelector('#teacherLiveStatus');
let current=null;
const copyButton=dlg.querySelector('#teacherCopyResult'),refreshButton=dlg.querySelector('#teacherRefreshResult');
const nextKinds=['lesson','groups','roles','bus','tournament'];
function linked(){return current&&nextKinds.includes(current.id)?A.linkedTeacherSource?.(current.id):null}
function updateRefreshButton(){refreshButton.hidden=!linked();}
const directKinds=['timer','quiz','seating','check'];
function info(msg,error=false){status.textContent=msg;status.classList.toggle('error',error)}
for(const item of tools){
 const b=document.createElement('button');b.type='button';b.className='teacher-live-tile';
 const glyph=document.createElement('span');glyph.className='teacher-live-icon';glyph.textContent=item.icon;glyph.setAttribute('aria-hidden','true');
 const copy=document.createElement('span');copy.className='teacher-live-copy';
 const title=document.createElement('strong');title.textContent=item.name;
 const desc=document.createElement('span');desc.textContent=item.summary;
 copy.append(title,desc);b.append(glyph,copy);b.addEventListener('click',()=>open(item.id));grid.append(b);
}
function open(id){
 const item=tools.find(x=>x.id===id);if(!item)return;
 current=item;
 copyButton.disabled=true;
 refreshButton.hidden=true;
 dlg.querySelector('#teacherLiveTitle').textContent=item.name;
 dlg.querySelector('#teacherLiveDesc').textContent=item.summary;
 info('도구를 불러오는 중이에요. 도구 안에서 실제로 작업한 결과만 가져옵니다.');
 dlg.showModal();
 const path=new URL(item.url,location.href);
 if(path.origin!==location.origin)throw Error('외부 도구는 이 창에 열 수 없어요.');
 // The original app chooses compact navigation only when embedded by this canvas.
 path.searchParams.set('studioEmbed','1');
 frame.src=path.href;
 window.dispatchEvent(new CustomEvent('gulliver:teacher-live-open',{detail:{id:item.id}}));
}
function close(reason='close'){
 const previous=current;
 frame.removeAttribute('src');
 if(dlg.open)dlg.close();
 current=null;
 // On a phone, return directly to the imported canvas instead of leaving the
 // teacher-tools bottom sheet over the student's seat chart.
 if((reason==='import'||reason==='refresh')&&matchMedia('(max-width:700px)').matches)
  window.GulliverCanvasShell?.closePanel?.();
 window.dispatchEvent(new CustomEvent('gulliver:teacher-live-close',{detail:{id:previous?.id||null,reason}}));
}
function currentNext(){
 if(!current||!nextKinds.includes(current.id))throw Error('현재 열려 있는 수업 도구를 확인해 주세요.');
 const get=frame.contentWindow?.GulliverTeacherLiveSnapshot;
 if(typeof get!=='function')throw Error('도구가 아직 준비되지 않았어요.');
 const live=get();
 if(live?.kind!==current.id)throw Error('실행 중인 도구의 종류가 일치하지 않아요.');
 return N.convert(live,{layout:A.capture().layout});
}
function snapshot(){
 const layout=A.capture().layout;
 if(current.id==='praise'){
  const state=read('classDashboardStateV2');
  if(!state)throw Error('칭찬 온도계 기록이 없어요. 온도계에서 먼저 점수를 기록해 주세요.');
  return S.thermometer(state,{layout});
 }
 if(current.id==='roulette'){
  const record=read('gulliver.roulette.lastResults.v1');
  if(!record?.results?.length)throw Error('저장된 레이스 결과가 없어요. 범퍼 룰렛을 끝까지 실행해 주세요.');
  return S.roulette(record,{layout});
 }
 if(current.id==='vote'){
  const config=read('vote_board_v2'),votes=read('vote_board_v2_votes');
  const session=read('gulliver.onlineVote.teacher.v1');
  const summary=read('gulliver.vote.onlineSummary.v1');
  if(session?.code){
   if(!summary||String(summary.roomCode)!==String(session.code)||Date.now()-summary.createdAt>180000)
    throw Error('온라인 투표 최신 집계를 확인할 수 없어요. 투표판을 열고 결과가 갱신되면 다시 눌러 주세요.');
   return S.vote(null,null,{layout,onlineSummary:summary});
  }
  return S.vote(config,votes,{layout});
 }
 if(current.id==='qr'){
  let doc;
  try{doc=frame.contentDocument}catch{throw Error('같은 사이트의 QR 도구를 열어 주세요.')}
  const canvas=doc?.getElementById('qrCanvas'),value=canvas?.dataset?.generatedContent;
  if(!canvas||!value||!canvas.classList.contains('show'))throw Error('QR 도구에서 내용을 입력한 다음 “QR 생성”을 눌러 주세요.');
  return S.qr(canvas.toDataURL('image/png'),value,{layout});
 }
 return null;
}
copyButton.addEventListener('click',()=>{
 if(!current)return;
 try{
  if(nextKinds.includes(current.id)){
   const result=currentNext();
   const count=A.appendTeacherPages(result,{sourceKind:current.id});
   info(result.description+' · '+count+'장 추가했어요. 다음 실행 때 최신 결과로 교체할 수 있어요.');
   close('import');return;
  }
  if(directKinds.includes(current.id)){
   const get=frame.contentWindow?.GulliverTeacherLiveSnapshot;
   if(typeof get!=='function')throw Error('도구가 아직 준비되지 않았어요. 잠시 후 도구 안에서 결과를 확인해 주세요.');
   const live=get();
   const importer=window.GulliverTeacherImport;
   if(!importer?.recent)throw Error('수업자료 가져오기 기능을 찾지 못했어요.');
   const result=importer.recent(current.id,live);
   const count=A.appendTeacherPages(result);
   info(result.description+' · '+count+'장 추가했어요.');
   close('import');
   return;
  }
  const result=snapshot();
  const count=A.appendTeacherPages(result);
  info(result.description+' · '+count+'장 추가했어요.');
  close('import');
 }catch(e){info(e.message||String(e),true)}
});
refreshButton.addEventListener('click',()=>{
 if(!current||!nextKinds.includes(current.id)||!linked())return;
 try{
  const result=currentNext(); // Validate real, confirmed content before destructive confirmation.
  if(!confirm('이 도구에서 마지막으로 가져온 페이지를 최신 결과로 바꿀까요? 캔버스에서 따로 수정한 글씨도 교체됩니다. 실행 취소할 수 있어요.'))return;
  const count=A.refreshTeacherPages(current.id,result);
  info(count+'장의 연결된 자료를 최신 결과로 바꿨어요.');
  close('refresh');
 }catch(e){info(e.message||String(e),true)}
});
dlg.querySelector('#teacherLiveClose').addEventListener('click',()=>close('close'));
dlg.addEventListener('cancel',event=>{event.preventDefault();close('cancel')});
frame.addEventListener('load',()=>{if(dlg.open&&current){copyButton.disabled=false;updateRefreshButton();info(linked()?'수정한 결과를 새 페이지로 추가하거나, 이전에 가져온 페이지를 최신 결과로 바꿀 수 있어요.':'도구에서 작업한 뒤 “새 페이지로 추가”를 눌러 주세요. 예시·미확정 자료는 가져오지 않아요.')}});
window.GulliverTeacherLive={open,close,isOpen:()=>dlg.open,listTools:()=>tools.map(({id,name,summary})=>({id,name,summary}))};
})();
