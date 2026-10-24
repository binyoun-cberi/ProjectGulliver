(function(){
  'use strict';
  const KEY='gulliver.activities.v1';
  const KINDS={timer:{name:'수업 흐름 타이머',icon:'🕘',href:'시간 도구.html'},quiz:{name:'낱말카드·퀴즈',icon:'🗂️',href:'플래시퀴즈메이커.html'},seating:{name:'교실 자리표',icon:'🎒',href:'자리 배정 프로그램.html'}};
  const uid=()=>window.crypto?.randomUUID?.()||'a_'+Date.now().toString(36)+Math.random().toString(36).slice(2);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const clean=(v,max=80)=>String(v??'').trim().slice(0,max);
  function read(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return {version:1,folders:Array.isArray(v?.folders)?v.folders:[],activities:Array.isArray(v?.activities)?v.activities.filter(a=>a&&KINDS[a.kind]&&a.id&&a.payload):[]}}
    catch{return {version:1,folders:[],activities:[]}}
  }
  function write(data){localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new CustomEvent('gulliver:activities-change'));return data}
  function list({trash=false,folder}={}){return read().activities.filter(a=>Boolean(a.archived)===trash&&(!folder||a.folderId===folder)).sort((a,b)=>b.updatedAt-a.updatedAt)}
  function get(id){return read().activities.find(a=>a.id===id&&!a.archived)||null}
  function save({id,kind,title,folderId='',payload}){
    if(!KINDS[kind]||!payload||typeof payload!=='object')throw Error('활동 형식을 확인해 주세요.');
    const data=read(),previous=id?data.activities.find(a=>a.id===id&&!a.archived):null;
    if(id&&(!previous||previous.kind!==kind))throw Error('저장할 활동을 다시 열어 주세요.');
    const value={id:previous?.id||uid(),kind,title:clean(title)||KINDS[kind].name,folderId:data.folders.some(f=>f.id===folderId)?folderId:'',payload:copy(payload),createdAt:previous?.createdAt||Date.now(),updatedAt:Date.now(),archived:false};
    if(previous)data.activities[data.activities.indexOf(previous)]=value;else data.activities.push(value);
    write(data);return value;
  }
  function change(id,patch){const data=read(),a=data.activities.find(a=>a.id===id);if(!a)return null;Object.assign(a,patch,{updatedAt:Date.now()});write(data);return a}
  function duplicate(id){const a=get(id);if(!a)return null;return save({...a,id:null,title:a.title+' (복사)'})}
  function folder(name){name=clean(name,40);if(!name)return null;const data=read();const old=data.folders.find(f=>f.name===name);if(old)return old;const f={id:uid(),name};data.folders.push(f);write(data);return f}
  function openUrl(a){return KINDS[a.kind].href+'?activity='+encodeURIComponent(a.id)}
  const templates=[
    {id:'lesson40',kind:'timer',title:'40분 수업',desc:'도입·활동·정리로 나눈 기본 시간표',payload:{title:'40분 수업',events:[{name:'도입',durationSec:300,color:'#635bff'},{name:'활동 1',durationSec:900,color:'#14a889'},{name:'활동 2',durationSec:900,color:'#e9a52b'},{name:'정리',durationSec:300,color:'#e56c7e'}]}},
    {id:'play10',kind:'timer',title:'놀이 정리 10분',desc:'마무리할 시간을 미리 보여주는 짧은 활동',payload:{title:'놀이를 마무리해요',events:[{name:'마지막 놀이',note:'놀이를 마무리해요',durationSec:420,color:'#14a889'},{name:'함께 정리',note:'놀잇감을 제자리에 놓아요',durationSec:180,color:'#635bff'}]}},
    {id:'countries',kind:'quiz',title:'세계 여러 나라',desc:'나라와 수도를 연결하는 낱말카드 6장',payload:{cards:[{front:'대한민국',back:'서울'},{front:'일본',back:'도쿄'},{front:'프랑스',back:'파리'},{front:'영국',back:'런던'},{front:'이탈리아',back:'로마'},{front:'이집트',back:'카이로'}]}},
    {id:'mathwords',kind:'quiz',title:'수학 낱말',desc:'도형과 연산을 복습하는 낱말카드 6장',payload:{cards:[{front:'삼각형',back:'변이 세 개인 도형'},{front:'사각형',back:'변이 네 개인 도형'},{front:'원',back:'중심에서 테두리까지 거리가 같은 도형'},{front:'덧셈',back:'두 수를 합하는 계산'},{front:'뺄셈',back:'한 수에서 다른 수를 빼는 계산'},{front:'곱셈',back:'같은 수를 여러 번 더하는 계산'}]}},
    {id:'seating20',kind:'seating',title:'기본 교실 자리표',desc:'5열 × 4줄 · 우리 반 명단으로 시작',payload:{cols:5,rows:4,layout:'individual',useClassroom:true}}
  ];
  function importBundle(value){
    if(value?.version!==1||!Array.isArray(value.activities)||!Array.isArray(value.folders))throw Error('클라시트 활동 백업 파일을 선택해 주세요.');
    const data=read(),folderMap=new Map();
    value.folders.slice(0,200).forEach(f=>{if(!clean(f?.name,40))return;let target=data.folders.find(x=>x.name===clean(f.name,40));if(!target){target={id:uid(),name:clean(f.name,40)};data.folders.push(target)}folderMap.set(f.id,target.id)});
    let count=0;
    value.activities.slice(0,500).forEach(a=>{if(!a||!KINDS[a.kind]||!a.payload||typeof a.payload!=='object')return;const now=Date.now();data.activities.push({id:uid(),kind:a.kind,title:clean(a.title)||KINDS[a.kind].name,folderId:folderMap.get(a.folderId)||'',payload:copy(a.payload),createdAt:now,updatedAt:now,archived:Boolean(a.archived)});count++});
    write(data);return count;
  }
  function download(){const blob=new Blob([JSON.stringify(read(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='클라시트_내활동_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function mount(adapter){
    let current=null;const params=new URLSearchParams(location.search),requested=params.get('activity'),preset=params.get('template');
    const shell=window.GulliverAppShell?.mount()?.actions||document.querySelector('.gulliver-shell-actions');
    const button=document.createElement('button');button.className='gulliver-shell-btn gt-action';button.type='button';button.textContent='활동 저장';
    const status=document.createElement('span');status.className='activity-current';
    let css=document.getElementById('activity-ui-style');if(!css){css=document.createElement('style');css.id='activity-ui-style';css.textContent='.activity-current{font:700 12px system-ui;color:#68758d;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.activity-save-dialog{border:1px solid #e1e4ec;border-radius:20px;padding:24px;width:min(440px,calc(100% - 24px));color:#25334a;box-shadow:0 20px 90px #25334a33;font-family:system-ui,sans-serif}.activity-save-dialog::backdrop{background:#18243c55}.activity-save-dialog h2{margin:0 0 8px}.activity-save-dialog p{font-size:13px;line-height:1.6;color:#69768c}.activity-save-dialog label{display:grid;gap:7px;font-size:13px;margin:16px 0}.activity-save-dialog input,.activity-save-dialog select{font:inherit;padding:11px;width:100%;border:1px solid #dce1ea;border-radius:10px}.activity-save-dialog .activity-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:20px}.activity-save-dialog button{font:700 13px system-ui;border:1px solid #dce1ea;border-radius:10px;padding:10px 14px;cursor:pointer;background:white;color:#35445c}.activity-save-dialog .primary{background:#635bff;color:white;border-color:#635bff}@media(max-width:700px){.activity-current{display:none}.gulliver-shell-btn{padding:8px 7px!important}.gulliver-shell-brand{font-size:11px!important}.gulliver-shell-actions{gap:4px!important}}';document.head.appendChild(css)}
    const dialog=document.createElement('dialog');dialog.className='activity-save-dialog';dialog.innerHTML='<h2>내 활동에 저장</h2><p>이름을 붙이면 홈에서 다시 열거나 복제할 수 있어요. 활동은 현재 브라우저에 저장됩니다.</p><form><label>활동 이름<input name="title" required maxlength="80" autocomplete="off"></label><label>폴더<select name="folder"></select></label><div class="activity-actions"><button type="button" data-cancel>취소</button><button type="button" data-copy>새 활동으로 저장</button><button class="primary" type="submit">저장</button></div></form>';document.body.appendChild(dialog);
    const form=dialog.querySelector('form'),title=form.elements.title,select=form.elements.folder,copyButton=dialog.querySelector('[data-copy]');
    const updateStatus=()=>{status.textContent=current?.title||'';status.title=current?.title||'';button.textContent='활동 저장'};
    function load(payload){adapter.apply(copy(payload));}
    try{
      if(requested){const a=get(requested);if(!a||a.kind!==adapter.kind)throw Error('이 활동을 찾을 수 없습니다. 같은 브라우저의 내 활동에서 다시 열어 주세요.');load(a.payload);current=a}
      else if(preset){const t=templates.find(t=>t.id===preset&&t.kind===adapter.kind);if(!t)throw Error('예시 활동을 찾을 수 없습니다.');load(t.payload);adapter.suggestedTitle=t.title}
      else if(params.get('new')==='1'){load(adapter.blank());}
    }catch(error){Gulliver.toast(error.message)}
    updateStatus();
    if(shell){shell.prepend(status,button)}else if(!window.GulliverAppShell?.embedded()){ const bar=document.createElement('div');bar.style.cssText='position:fixed;right:16px;top:12px;z-index:99999';bar.append(status,button);document.body.appendChild(bar)}
    button.onclick=()=>{
      title.value=current?.title||adapter.suggestedTitle||adapter.title?.()||KINDS[adapter.kind].name;
      select.replaceChildren();const base=document.createElement('option');base.value='';base.textContent='미분류';select.appendChild(base);read().folders.forEach(f=>{const o=document.createElement('option');o.value=f.id;o.textContent=f.name;select.appendChild(o)});select.value=current?.folderId||'';copyButton.hidden=!current;dialog.showModal();title.focus();title.select();
    };
    function persist(asCopy){if(!form.reportValidity())return;try{current=save({id:asCopy?null:current?.id,kind:adapter.kind,title:title.value,folderId:select.value,payload:adapter.capture()});history.replaceState(null,'',location.pathname+'?activity='+encodeURIComponent(current.id));updateStatus();dialog.close();Gulliver.toast('내 활동에 저장했습니다.')}catch(error){Gulliver.toast(error.message||'저장하지 못했습니다.')}}
    form.onsubmit=e=>{e.preventDefault();persist(false)};copyButton.onclick=()=>persist(true);dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
    return {getCurrent:()=>current};
  }
  window.ClassroomWorkspace={key:KEY,kinds:KINDS,read,list,get,save,change,duplicate,folder,openUrl,templates,importBundle,download,mount};
})();
