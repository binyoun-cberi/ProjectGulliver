(()=>{
'use strict';
const A=window.GulliverStudioAdapter,C=window.GulliverActivityCore,K=window.GulliverActivityClassroom;
const pane=document.querySelector('.design-pane[data-pane="teacher"]');if(!A||!C||!pane)return;
const section=document.createElement('section');section.className='canvas-activities';
section.innerHTML='<h3>활동 추가</h3><p>캔버스에 놓고 바로 진행하세요.</p><div class="activity-add"></div><form class="activity-settings" hidden><h4>활동 설정</h4><label>제목<input name="title" maxlength="100"></label><label data-field="seconds">시간 (초)<input name="seconds" type="number" min="1" max="86400"></label><label data-field="value">QR 내용<textarea name="value" maxlength="1500"></textarea></label><label data-field="body">안내 내용<textarea name="body" maxlength="800" rows="5"></textarea></label><fieldset data-field="assignment"><legend>학생 배정</legend><label>배정 방식<select name="mode"><option value="groups">모둠</option><option value="seating">교실 자리</option><option value="roles">역할</option></select></label><button type="button" data-import-roster>우리 반 명단 불러오기</button><label>학생 이름 (한 줄에 한 명)<textarea name="students" rows="5"></textarea></label><label>모둠당 인원<input type="number" name="groupSize" min="1" max="20"></label><label>자리 가로 칸 수<input type="number" name="cols" min="1" max="12"></label><label>역할 (한 줄에 하나)<textarea name="roleNames" rows="3"></textarea></label><small>캔버스에서는 무작위로 배정해요. 고정 자리·기피 관계 등의 조건 배정은 아래 기존 도구에서 확정한 결과를 가져오세요.</small></fieldset><fieldset data-field="quiz"><legend>카드·퀴즈</legend><label>문제 | 정답 (한 줄에 한 문항)<textarea name="cards" rows="6" placeholder="대한민국의 수도는? | 서울"></textarea></label><button type="button" data-import-cards>저장한 낱말카드 불러오기</button><small>문항을 바꾸면 첫 문제부터 다시 시작해요.</small></fieldset><button type="submit">설정 적용</button><div class="activity-actions"></div><small data-clock-note>시간은 페이지를 옮겨도 계속 흘러갑니다. 저장 후 다시 열어도 이어집니다.</small></form>';
pane.prepend(section);
const form=section.querySelector('form'),cache=new Map();let selected=null;const feedback=document.createElement('p');feedback.setAttribute('role','status');form.append(feedback);const privatePreview=document.createElement('div');privatePreview.className='activity-private-preview';form.append(privatePreview);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
for(const kind of C.KINDS){const b=document.createElement('button');b.type='button';const preview=document.createElementNS('http://www.w3.org/2000/svg','svg');preview.setAttribute('viewBox','0 0 300 180');preview.setAttribute('aria-hidden','true');preview.innerHTML=svg({x:0,y:0,w:300,h:180,activity:C.clean({kind,...(kind==='quiz'?{cards:[{front:'오늘의 질문',back:'정답'}]}:{})})});const label=document.createElement('span');label.textContent=C.labels[kind];b.append(preview,label);b.dataset.addActivity=kind;b.onclick=()=>A.addActivity({kind});section.querySelector('.activity-add').append(b)}
function controls(host,e){const a=e.activity;const options=a.kind==='quiz'?[['previous','이전 문제'],['reveal',a.revealed?'문제 보기':'정답 공개'],['next','다음 문제'],['reset','처음부터']]:a.kind==='assignment'?[['assign',a.result.length?'무작위로 다시 배정':'무작위 배정'],['publish',a.published?'결과 가리기':'결과 공개'],['previous','이전 결과'],['next','다음 결과']]:[['start','시작'],['pause','일시정지'],['reset','초기화']];for(const [action,label] of options){const b=document.createElement('button');b.type='button';b.dataset.activityControl=action;b.textContent=label;b.disabled=a.kind==='quiz'?(!a.cards.length||action==='previous'&&a.index===0||action==='next'&&a.index===a.cards.length-1):a.kind==='assignment'?(action==='assign'?!a.students.length:action==='publish'?!a.result.length:!a.published||a.mode==='seating'||action==='previous'&&a.resultPage===0||action==='next'&&a.resultPage>=Math.ceil(a.result.length/6)-1):action==='start'?!!a.startedAt:action==='pause'?!a.startedAt:false;b.onclick=ev=>{ev.stopPropagation();try{A.controlActivity(e.id,action);feedback.textContent=action==='assign'?'배정했어요. 결과를 확인한 뒤 공개하세요.':''}catch(err){feedback.textContent=err.message}};host.append(b)}}
function qr(value){if(cache.has(value))return cache.get(value);if(typeof window.qrcode!=='function')throw Error('QR 생성기를 불러오지 못했어요.');const code=window.qrcode(0,'M');code.addData(value,'Byte');code.make();const n=code.getModuleCount(),size=n+8;let path='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(code.isDark(y,x))path+='M'+(x+4)+' '+(y+4)+'h1v1h-1z';const result={size,path};if(cache.size>40)cache.clear();cache.set(value,result);return result}
function qrSvg(value){const q=qr(value);return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+q.size+' '+q.size+'" role="img" aria-label="QR 코드"><rect width="100%" height="100%" fill="white"/><path d="'+q.path+'" fill="#17283f"/></svg>'}
function draw(node,e){const a=e.activity;node.classList.add('canvas-activity');node.style.fontSize='24px';const title=document.createElement('div');title.className='activity-title';title.textContent=a.title;node.append(title);
 const output=document.createElement('div');output.className='activity-output';if(['timer','stopwatch'].includes(a.kind))output.setAttribute('role','timer');
 if(['quiz','assignment'].includes(a.kind)){output.className='activity-visual';output.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+e.w+' '+e.h+'" preserveAspectRatio="none">'+commands(a,e.w,e.h)+'</svg>'}
 else if(a.kind==='qr'){try{output.innerHTML=qrSvg(a.value)}catch(err){output.textContent='QR 내용을 줄여 주세요.'}}
 else if(a.kind==='notice'){output.classList.add('activity-notice');output.textContent=a.body}
 else{output.dataset.activityClock=e.id;output.textContent=C.display(a);const actions=document.createElement('div');actions.className='activity-inline-controls';controls(actions,e);node.append(actions)}
 node.append(output);
}
function modeFields(){const mode=form.elements.mode.value;for(const [key,show] of Object.entries({groupSize:mode==='groups',cols:mode==='seating',roleNames:mode==='roles'}))form.elements[key].closest('label').hidden=!show}
form.elements.mode.addEventListener('change',modeFields);
function selection(e){
 const next=e?.type==='activity'?e:null;
 if(document.activeElement?.matches('input,textarea,select')&&form.contains(document.activeElement)&&selected?.id===next?.id)return;
 selected=next;form.hidden=!selected;if(!selected)return;const a=selected.activity;
 for(const k of ['title','seconds','value','body'])form.elements[k].value=a[k];
 const visible={seconds:a.kind==='timer',value:a.kind==='qr',body:a.kind==='notice',assignment:a.kind==='assignment',quiz:a.kind==='quiz'};
 for(const [k,show] of Object.entries(visible))form.querySelector('[data-field="'+k+'"]').hidden=!show;
 if(a.kind==='assignment'){form.elements.mode.value=a.mode;form.elements.students.value=a.students.map(s=>s.name).join('\n');form.elements.groupSize.value=a.groupSize;form.elements.cols.value=a.cols;form.elements.roleNames.value=a.roleNames.join('\n');modeFields()}
 if(a.kind==='quiz')form.elements.cards.value=a.cards.map(c=>c.front+' | '+c.back).join('\n');
 privatePreview.replaceChildren();
 if(a.kind==='assignment'&&a.result.length){const title=document.createElement('strong');title.textContent='교사용 결과 미리보기 · 공개 전에는 학생에게 보이지 않아요';if(a.source)title.textContent+=' · '+a.source;privatePreview.append(title);const names=new Map(a.students.map(s=>[s.id,s.name]));for(const row of a.result){const p=document.createElement('p');p.textContent=row.label+' · '+(row.memberIds.map(id=>names.get(id)).join(', ')||'빈자리');privatePreview.append(p)}}
 if(a.kind==='quiz'&&a.cards[a.index]){const p=document.createElement('p');p.textContent='교사용 정답: '+a.cards[a.index].back;privatePreview.append(p)}
 const actions=form.querySelector('.activity-actions');actions.replaceChildren();if(['timer','stopwatch','quiz','assignment'].includes(a.kind))controls(actions,selected);
 form.querySelector('[data-clock-note]').hidden=!['timer','stopwatch'].includes(a.kind);
}
form.onsubmit=event=>{
 event.preventDefault();if(!selected)return;let patch={...selected.activity};
 try{
  for(const key of ['title','seconds','value','body'])patch[key]=form.elements[key].value;
  if(Number(patch.seconds)!==selected.activity.seconds){patch.elapsed=0;patch.startedAt=0}
  if(patch.kind==='qr')qr(patch.value);
  if(patch.kind==='quiz'){const unchanged=form.elements.cards.value===selected.activity.cards.map(c=>c.front+' | '+c.back).join('\n');patch.cards=unchanged?selected.activity.cards:K.parseCards(form.elements.cards.value);if(JSON.stringify(patch.cards)!==JSON.stringify(selected.activity.cards)){patch.index=0;patch.revealed=false}}
  if(patch.kind==='assignment'){
   patch.students=K.studentsFromText(form.elements.students.value,patch.students);patch.mode=form.elements.mode.value;patch.groupSize=Number(form.elements.groupSize.value);patch.cols=Number(form.elements.cols.value);patch.roleNames=form.elements.roleNames.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
   const changed=['students','mode','groupSize','cols','roleNames'].some(key=>JSON.stringify(patch[key])!==JSON.stringify(selected.activity[key]));
   if(changed){patch.result=[];patch.resultPage=0;patch.published=false;patch.source=''}
  }
  A.updateActivity(selected.id,patch);feedback.textContent='설정을 적용했어요.';
 }catch(err){feedback.textContent=err.message||'입력한 내용을 확인해 주세요.'}
};
form.querySelector('[data-import-roster]').onclick=()=>{
 if(selected?.activity.kind!=='assignment')return;
 try{const students=K.students(window.Gulliver?.getClassroom()?.students||[]);if(!students.length)throw Error('우리 반에 저장한 명단이 없어요.');A.updateActivity(selected.id,{...selected.activity,students,result:[],resultPage:0,published:false,source:'우리 반 명단'});feedback.textContent=students.length+'명을 불러왔어요. 배정 방식을 확인해 주세요.'}catch(err){feedback.textContent=err.message}
};
form.querySelector('[data-import-cards]').onclick=()=>{
 if(selected?.activity.kind!=='quiz')return;
 try{const saved=JSON.parse(localStorage.getItem('flashQuizMakerPlusV3')||'null');if(saved?.sampleOnly||saved?.seededSample)throw Error('기본 예시 대신 직접 만든 낱말카드를 저장해 주세요.');const cards=K.cards(saved?.cards||[]);if(!cards.length)throw Error('저장한 낱말카드가 없어요.');A.updateActivity(selected.id,{...selected.activity,cards,index:0,revealed:false});feedback.textContent=cards.length+'문항을 불러왔어요.'}catch(err){feedback.textContent=err.message}
};
function commands(a,w,h){return K.visual(a,w,h).map(cmd=>cmd.type==='rect'?'<rect x="'+cmd.x+'" y="'+cmd.y+'" width="'+cmd.w+'" height="'+cmd.h+'" rx="6" fill="'+cmd.fill+'"/>':'<text x="'+cmd.x+'" y="'+cmd.y+'" font-family="sans-serif" font-size="'+cmd.size+'" text-anchor="middle" fill="'+cmd.fill+'">'+esc(cmd.text)+'</text>').join('')}
function svg(e){const a=e.activity;let body='<rect x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'" rx="16" fill="#ffffff" stroke="#cbd5e1"/>';const titleSize=Math.min(22,e.w/12);body+='<text x="'+(e.x+e.w/2)+'" y="'+(e.y+32)+'" text-anchor="middle" font-family="sans-serif" font-size="'+titleSize+'" fill="#475569">'+esc(a.title)+'</text>';
 if(['quiz','assignment'].includes(a.kind))body+='<g transform="translate('+e.x+' '+e.y+')">'+commands(a,e.w,e.h)+'</g>';
 else if(a.kind==='qr'){const q=qr(a.value),side=Math.max(1,Math.min(e.w-24,e.h-54));body+='<svg x="'+(e.x+(e.w-side)/2)+'" y="'+(e.y+46)+'" width="'+side+'" height="'+side+'" viewBox="0 0 '+q.size+' '+q.size+'"><rect width="100%" height="100%" fill="white"/><path d="'+q.path+'" fill="#17283f"/></svg>'}
 else if(a.kind==='notice'){const chars=Math.max(1,Math.floor((e.w-32)/18));let lines=[];for(const line of a.body.split('\n')){if(!line)lines.push('');else for(let i=0;i<line.length;i+=chars)lines.push(line.slice(i,i+chars))}for(const [i,line] of lines.slice(0,Math.max(0,Math.floor((e.h-56)/26))).entries())body+='<text x="'+(e.x+16)+'" y="'+(e.y+66+i*26)+'" font-family="sans-serif" font-size="18" fill="#17283f">'+esc(line)+'</text>'}
 else body+='<text x="'+(e.x+e.w/2)+'" y="'+(e.y+e.h*.67)+'" text-anchor="middle" font-family="sans-serif" font-size="'+Math.min(e.w/4.5,e.h/2.5)+'" fill="#17283f">'+C.display(a)+'</text>';return body}
window.GulliverCanvasActivities={draw,selection,svg};
setInterval(()=>{for(const e of A.getActiveActivities()){if(e.type!=='activity'||!['timer','stopwatch'].includes(e.activity.kind))continue;for(const node of document.querySelectorAll('[data-activity-clock]'))if(node.dataset.activityClock===e.id){node.textContent=C.display(e.activity);node.classList.toggle('activity-finished',e.activity.kind==='timer'&&C.elapsed(e.activity)>=e.activity.seconds*1000);if(e.activity.kind==='timer'&&e.activity.startedAt&&C.elapsed(e.activity)>=e.activity.seconds*1000)A.controlActivity(e.id,'pause')}}},250);
// The initial editor render precedes this module. Redraw any restored activities.
const first=A.getQuickSelection?.()[0];selection(first);
})();
