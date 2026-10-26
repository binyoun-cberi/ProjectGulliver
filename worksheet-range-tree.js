(()=>{'use strict';
function create(host,{onChange}){
 const search=document.createElement('input');search.type='search';search.placeholder='단원·차시 이름으로 찾기';search.setAttribute('aria-label','단원·차시 검색');
 const pendingLabel=document.createElement('label'),pending=document.createElement('input');pending.type='checkbox';pendingLabel.className='range-pending-toggle';pendingLabel.append(pending,document.createTextNode(' 준비 중 차시도 보기'));
 const toolbar=document.createElement('div');toolbar.className='range-tree-toolbar';toolbar.append(search,pendingLabel);
 const tree=document.createElement('div');tree.className='range-tree-list';tree.setAttribute('aria-label','학기·단원·차시 선택');
 const empty=document.createElement('p');empty.className='range-tree-empty';empty.textContent='선택할 수 있는 차시가 없어요. 학년이나 학기를 바꾸어 주세요.';host.append(toolbar,tree,empty);
 let units=[],plan=[],enabled=false,expanded=new Set();
 function sync(next,active){plan=next;enabled=active;const selected=new Set(active?next.map(x=>x.id):[]);
  for(const box of tree.querySelectorAll('[data-range-lesson]')){box.checked=selected.has(box.dataset.rangeLesson);box.closest('.range-lesson').classList.toggle('is-selected',box.checked);}
  for(const box of tree.querySelectorAll('[data-range-unit]')){const ids=units.find(u=>u.id===box.dataset.rangeUnit)?.lessons.filter(l=>l.ready).map(l=>l.id)||[],count=ids.filter(id=>selected.has(id)).length;box.checked=ids.length>0&&count===ids.length;box.indeterminate=count>0&&count<ids.length;}
 }
 function draw(){
  for(const detail of tree.querySelectorAll('details'))if(detail.open)expanded.add(detail.dataset.key);else expanded.delete(detail.dataset.key);
  tree.replaceChildren();let visible=0;const termGroups=new Map();for(const unit of units){if(!termGroups.has(unit.semester))termGroups.set(unit.semester,[]);termGroups.get(unit.semester).push(unit);}
  for(const [semester,list] of termGroups){const term=document.createElement('section'),heading=document.createElement('h3');heading.textContent=semester+'학기';term.append(heading);
   for(const unit of list){const q=search.value.trim().toLowerCase(),lessons=unit.lessons.filter(l=>(pending.checked||l.ready)&&(!q||(unit.name+' '+l.name).toLowerCase().includes(q)));if(!lessons.length)continue;visible+=lessons.length;
    const detail=document.createElement('details');detail.dataset.key=unit.id;detail.open=!!q||!plan.length&&tree.children.length===0&&term.children.length===1||expanded.has(unit.id)||plan.some(p=>lessons.some(l=>l.id===p.id));
    const summary=document.createElement('summary'),label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.dataset.rangeUnit=unit.id;check.disabled=!unit.lessons.some(l=>l.ready);check.setAttribute('aria-label',semester+'학기 '+unit.name+' 전체 선택');check.onclick=e=>e.stopPropagation();check.onchange=()=>onChange(unit.lessons.filter(l=>l.ready).map(l=>l.id),check.checked,true);label.onclick=e=>e.stopPropagation();label.append(check,document.createTextNode(unit.name));
    const total=document.createElement('small');total.textContent=unit.lessons.filter(l=>l.ready).length+'개 차시';summary.append(label,total);detail.append(summary);
    for(const lesson of lessons){const row=document.createElement('label');row.className='range-lesson';const input=document.createElement('input');input.type='checkbox';input.dataset.rangeLesson=lesson.id;input.disabled=!lesson.ready;input.setAttribute('aria-label',semester+'학기 '+unit.name+' · '+lesson.name);input.onchange=()=>onChange([lesson.id],input.checked,false);const name=document.createElement('span');name.textContent=lesson.name;const status=document.createElement('small');status.textContent=lesson.ready?'최대 '+lesson.capacity+'문항':'준비 중';row.append(input,name,status);detail.append(row);}
    term.append(detail);
   }
   if(term.children.length>1)tree.append(term);
  }
  empty.hidden=visible>0;sync(plan,enabled);
 }
 search.oninput=draw;pending.onchange=draw;
 return {reveal(){for(const box of tree.querySelectorAll('[data-range-lesson]:checked'))box.closest('details').open=true;},render(next){units=next;expanded=new Set();search.value='';draw();},sync};
}
window.WorksheetRangeTree={create};
})();
