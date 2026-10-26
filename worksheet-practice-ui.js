(()=>{'use strict';
const C=window.DailyWorksheetCore,M=window.WorksheetPractice,$=id=>document.getElementById(id),form=$('sheetForm'),box=$('unitMixSettings'),body=box.querySelector('.unit-mix-body');
const panel=document.createElement('div');panel.className='practice-range-layout';
const selected=document.createElement('section');selected.className='practice-selection';selected.setAttribute('aria-label','선택한 연습 유형');
const heading=document.createElement('h3');heading.textContent='선택한 유형';selected.append(heading,$('unitMixRows'),$('addUnitMix'),$('unitMixTotal'));
const clear=document.createElement('button');clear.type='button';clear.textContent='선택 비우기';clear.id='clearPracticeRange';selected.append(clear);
const tree=document.createElement('section');tree.className='range-tree';tree.setAttribute('aria-label','종합 학습 범위');
const title=document.createElement('h3');title.textContent='학습 범위 선택';
const search=document.createElement('input');search.type='search';search.placeholder='단원·유형 이름으로 찾기';search.setAttribute('aria-label','종합 단원·유형 검색');
const tools=document.createElement('div');tools.className='range-tree-toolbar';tools.append(search);
const list=document.createElement('div');list.className='range-tree-list';const note=document.createElement('p');note.className='practice-message';note.setAttribute('aria-live','polite');
tree.append(title,tools,list,note);panel.append(selected,tree);body.append(panel);
let scope='',active=false,expanded=new Set();
const subject=()=>form.querySelector('[name=subject]:checked').value;
const isPractice=()=>['math','korean','social','science'].includes(subject())&&$('learningMode').value==='practice';
const options=()=>C.mixOptions(subject(),Number($('grade').value));
function invalidate(){window.WorksheetEditor.clear();for(const id of ['regenerate','toggleAnswers','printOnly','printWithAnswers'])$(id).disabled=true;$('sheetStatus').textContent='범위를 바꿨어요. 문제지 만들기를 눌러 주세요.';}
function commit(plan){M.setPlan(plan);invalidate();sync();}
function choose(ids,checked,bulk){let plan=M.plan();if(checked){const add=ids.filter(id=>!plan.some(p=>p.id===id));if(plan.length+add.length>20){note.textContent='한 번에 최대 20개 유형을 선택할 수 있어요. 범위를 나누어 선택해 주세요.';draw();return;}plan=plan.concat(add.map(id=>({id,count:bulk?1:5})));}else plan=plan.filter(p=>!ids.includes(p.id));commit(plan);}
function draw(){
 for(const d of list.querySelectorAll('details'))if(d.open)expanded.add(d.dataset.unit);else expanded.delete(d.dataset.unit);
 list.replaceChildren();const plan=M.plan(),groups=new Map(),q=search.value.trim().toLowerCase();
 for(const entry of options()){if(!groups.has(entry.unit))groups.set(entry.unit,[]);groups.get(entry.unit).push(entry);}
 for(const [unit,entries] of groups){const shown=entries.filter(e=>(unit+' '+e.label).toLowerCase().includes(q));if(!shown.length)continue;
  const detail=document.createElement('details');detail.dataset.unit=unit;detail.open=!!q||expanded.has(unit)||entries.some(e=>plan.some(p=>p.id===e.id))||list.children.length===0;
  const summary=document.createElement('summary'),label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.practiceUnit=unit;check.setAttribute('aria-label',unit+' 전체 선택');const n=entries.filter(e=>plan.some(p=>p.id===e.id)).length;check.checked=n===entries.length;check.indeterminate=n>0&&n<entries.length;label.onclick=e=>e.stopPropagation();check.onchange=()=>choose(entries.map(e=>e.id),check.checked,true);label.append(check,document.createTextNode(unit));const count=document.createElement('small');count.textContent=entries.length+'개 유형';summary.append(label,count);detail.append(summary);
  for(const e of shown){const row=document.createElement('label');row.className='range-lesson';const input=document.createElement('input');input.type='checkbox';input.dataset.practiceType=e.id;input.checked=plan.some(p=>p.id===e.id);input.onchange=()=>choose([e.id],input.checked,false);row.classList.toggle('is-selected',input.checked);const name=document.createElement('span');name.textContent=e.label;row.append(input,name);detail.append(row);}list.append(detail);
 }
 if(!list.children.length){const p=document.createElement('p');p.textContent='일치하는 단원·유형이 없어요.';list.append(p);}
}
function sync(){
 const next=isPractice();form.classList.toggle('practice-range-mode',next);if(!next){active=false;scope='';return;}
 const nextScope=subject()+':'+$('grade').value;
 if(!active||scope!==nextScope||!$('unitMixEnabled').checked){search.value='';expanded.clear();if(!$('unitMixEnabled').checked){const entry=options().find(e=>e.type&&e.type===$('type').value)||options().find(e=>e.topic===$('topic').value)||options()[0];M.setPlan(entry?[{id:entry.id,count:Math.min(entry.topic==='column'?12:20,Number($('count').value)||5)}]:[]);}scope=nextScope;}
 active=true;box.hidden=false;box.open=true;
 for(const select of $('unitMixRows').querySelectorAll('select')){for(const option of select.options){const entry=options().find(e=>e.id===option.value);if(entry)option.textContent=entry.unit+' · '+entry.label;}select.title=select.selectedOptions[0]?.textContent||'';}
 const plan=M.plan(),total=plan.reduce((n,r)=>n+r.count,0),valid=plan.length>0&&plan.length<=20&&new Set(plan.map(r=>r.id)).size===plan.length&&total<=40&&plan.every(r=>options().some(e=>e.id===r.id)&&Number.isInteger(r.count)&&r.count>0&&r.count<=(options().find(e=>e.id===r.id)?.topic==='column'?12:20));
 form.querySelector('[type=submit]').disabled=!valid; note.textContent=valid?'단원 전체 또는 원하는 유형을 체크하세요. 최대 20개 유형·총 40문항입니다.':'유형을 선택하고 총 40문항 안에서 문항 수를 정해 주세요.';
 $('textPractice').textContent='여러 단원과 유형을 한 문제지로 모아요';draw();
}
clear.onclick=()=>commit([]);search.oninput=draw;
form.addEventListener('change',e=>{sync();if(active&&e.target.id!=='largePrint')invalidate();});form.addEventListener('input',e=>{if(active&&e.target.name==='mixCount'){sync();invalidate();}});
// The legacy remove/add buttons update the same rows without a form change.
selected.addEventListener('click',e=>{if(e.target.tagName==='BUTTON'&&e.target!==clear){sync();if(active)invalidate();}});
sync();
})();
