/* Run original classroom tools without leaving the editor, then import real saved outcomes.
 * The embedded tools are same-origin; editor/project storage is never overwritten. */
(()=>{
'use strict';
const A=window.GulliverStudioAdapter,S=window.GulliverTeacherSnapshots;
const pane=document.querySelector('.design-pane[data-pane="teacher"]');
if(!A||!S||!pane)return;
const tools=[
 {id:'praise',name:'칭찬 온도계',url:'칭찬 온도계.html',summary:'현재 온도·목표·최근 칭찬 기록'},
 {id:'qr',name:'QR 코드 만들기',url:'QR코드.html',summary:'생성한 실제 QR 그림과 내용'},
 {id:'roulette',name:'범퍼 룰렛',url:'범퍼 룰렛.html',summary:'실제로 진행된 레이스 결과'},
 {id:'vote',name:'우리 반 투표판',url:'우리반 선관위.html',summary:'선택지별 집계만, 개인 응답 제외'},
 {id:'timer',name:'수업 흐름 타이머',url:'지도안식 원형 타이머.html',summary:'저장한 수업 단계와 시간'},
 {id:'quiz',name:'낱말카드·퀴즈',url:'플래시퀴즈메이커.html',summary:'문제·정답 카드'},
 {id:'seating',name:'교실 자리 배정',url:'자리 배정 프로그램.html',summary:'저장한 자리표'},
 {id:'check',name:'학급췍',url:'학급췍.html',summary:'저장한 체크 상태'}
];
const read=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const bar=document.createElement('section');bar.className='teacher-live-tools';bar.id='teacherLiveTools';
bar.innerHTML=[
 '<div class="teacher-live-heading"><strong>수업 중 바로 사용하기</strong><small>여기서 도구를 실행하고, 결과를 지금 만들던 캔버스로 가져오세요.</small></div>',
 '<div class="teacher-live-grid" id="teacherLiveGrid"></div>',
 '<p class="teacher-live-note">실행 도구는 현재 편집기를 떠나지 않는 창에서 열려요. 수업자료로 추가되는 것은 실행 결과의 복사본이에요.</p>'
].join('');
pane.append(bar);
const dlg=document.createElement('dialog');dlg.id='teacherLiveDialog';dlg.className='teacher-live-dialog';dlg.setAttribute('aria-label','교사 도구 실행 창');
dlg.innerHTML=[
 '<div class="teacher-run-head"><div><strong id="teacherLiveTitle">교사 도구</strong><small id="teacherLiveDesc">원본 도구를 실행합니다</small></div>',
 '<div class="teacher-run-actions"><button type="button" id="teacherCopyResult">＋ 결과를 캔버스로</button><button type="button" id="teacherLiveClose">× 닫기</button></div></div>',
 '<p id="teacherLiveStatus" class="teacher-live-status" role="status">수업 도구를 준비하고 있어요.</p>',
 '<iframe id="teacherLiveFrame" title="실행 중인 교사 도구" referrerpolicy="same-origin" allow="camera; microphone; fullscreen" loading="eager"></iframe>'
].join('');
document.body.append(dlg);
const grid=bar.querySelector('#teacherLiveGrid'),frame=dlg.querySelector('#teacherLiveFrame'),
 status=dlg.querySelector('#teacherLiveStatus');
let current=null;
function info(msg,error=false){status.textContent=msg;status.classList.toggle('error',error)}
for(const item of tools){
 const b=document.createElement('button');b.type='button';b.className='teacher-live-tile';
 const title=document.createElement('strong');title.textContent=item.name;
 const desc=document.createElement('span');desc.textContent=item.summary;
 b.append(title,desc);b.addEventListener('click',()=>open(item.id));grid.append(b);
}
function open(id){
 const item=tools.find(x=>x.id===id);if(!item)return;
 current=item;
 dlg.querySelector('#teacherLiveTitle').textContent=item.name;
 dlg.querySelector('#teacherLiveDesc').textContent=item.summary;
 info('도구를 여는 중이에요. 사용을 마친 뒤 “결과를 캔버스로”를 누르세요.');
 dlg.showModal();
 const path=new URL(item.url,location.href);
 if(path.origin!==location.origin)throw Error('외부 도구는 이 창에 열 수 없어요.');
 frame.src=path.href;
}
function close(){
 frame.removeAttribute('src');
 if(dlg.open)dlg.close();
 current=null;
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
dlg.querySelector('#teacherCopyResult').addEventListener('click',()=>{
 if(!current)return;
 try{
  if(['timer','quiz','seating','check'].includes(current.id)){
   const selector={'timer':'timer','quiz':'flash','seating':'seating','check':'check'}[current.id];
   const button=pane.querySelector('[data-teacher-convert="'+selector+'"]');
   if(!button)throw Error('자료 변환 기능을 불러오지 못했어요.');
   // Reuse one tested editable-data converter and its existing validation.
   button.click();
   const msg=pane.querySelector('#teacherConvertStatus');
   if(msg?.classList.contains('error'))throw Error(msg.textContent);
   info('현재 작업의 뒤에 편집 가능한 페이지로 추가했어요. 편집 화면에서 확인하세요.');
   close();
   return;
  }
  const result=snapshot();
  const count=A.appendTeacherPages(result);
  info(result.description+' · '+count+'장 추가했어요.');
  close();
 }catch(e){info(e.message||String(e),true)}
});
dlg.querySelector('#teacherLiveClose').addEventListener('click',close);
dlg.addEventListener('cancel',()=>{frame.removeAttribute('src');current=null});
frame.addEventListener('load',()=>{if(dlg.open&&current)info('도구를 사용한 뒤 “＋ 결과를 캔버스로”를 눌러 주세요.')});
window.GulliverTeacherLive={open,close};
})();
