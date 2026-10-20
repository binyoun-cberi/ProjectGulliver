/* One-way, public-only projection of the active canvas page. */
(()=>{
 'use strict';
 const A=window.GulliverStudioAdapter,D=window.GulliverTeacherDisplay;
 const host=document.querySelector('.canvas-activities');if(!A||!D||!host)return;
 let hidden=false;
 D.register({kind:'canvas',getSnapshot:()=>hidden?{kind:'canvas',hidden:true}:A.getPublicCanvas()});
 const actions=document.createElement('div');actions.className='activity-display-actions';
 const open=document.createElement('button');open.type='button';open.id='canvasStudentOpen';open.textContent='학생 화면 열기';
 const hide=document.createElement('button');hide.type='button';hide.id='canvasStudentHide';hide.textContent='학생 화면 가리기';hide.setAttribute('aria-pressed','false');
 const status=document.createElement('span');status.className='activity-display-status';status.setAttribute('role','status');
 open.onclick=()=>D.open();
 hide.onclick=()=>{hidden=!hidden;hide.textContent=hidden?'학생 화면 다시 보이기':'학생 화면 가리기';hide.setAttribute('aria-pressed',String(hidden));status.textContent=hidden?'학생 화면을 가렸어요. 교사 화면에서 계속 준비할 수 있어요.':'현재 페이지의 공개 내용이 학생 화면에 표시돼요.'};
 const refresh=()=>{open.textContent=D.connected()?'학생 화면으로 이동':'학생 화면 열기';if(!hidden)status.textContent=D.connected()?'현재 페이지가 학생 화면과 연결돼 있어요.':'학생용 모니터에 별도 창을 열어 주세요.'};
 window.addEventListener('gulliver:student-display-change',refresh);
 actions.append(open,hide);host.prepend(actions,status);refresh();
})();
