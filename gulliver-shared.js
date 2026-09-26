(function(){
  'use strict';
  const KEYS={
    classroom:'gulliver.classroom.v1',
    profiles:'gulliver.classroomProfiles.v1',
    relations:'gulliver.classroomRelations.v1',
    operations:'gulliver.classroomHistory.v1',
    recent:'gulliver.recentTools.v1',
    favorites:'gulliver.favoriteTools.v1'
  };
  const safeParse=(raw,fallback)=>{try{return raw?JSON.parse(raw):fallback}catch{return fallback}};
  const uid=()=> 's_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function cleanName(v){return String(v||'').replace(/[<>]/g,'').trim().slice(0,30)}
  function normalizeStudents(items){
    const seenIds=new Set(),out=[];
    (Array.isArray(items)?items:[]).forEach((item)=>{
      const src=typeof item==='string'?{name:item}:item||{};
      const name=cleanName(src.name);
      if(!name)return;
      let id=String(src.id||uid());
      while(seenIds.has(id))id=uid();
      seenIds.add(id);
      out.push({id,name,gender:src.gender==='M'||src.gender==='F'?src.gender:''});
    });
    return out;
  }
  function defaultClassroom(){return {version:1,className:'우리 반',students:[],updatedAt:null}}
  function getClassroom(){
    const data=safeParse(localStorage.getItem(KEYS.classroom),null);
    if(!data) return defaultClassroom();
    return {
      version:1,
      className:cleanName(data.className)||'우리 반',
      students:normalizeStudents(data.students),
      updatedAt:data.updatedAt||null
    };
  }
  function saveClassroom(data){
    const value={
      version:1,
      className:cleanName(data&&data.className)||'우리 반',
      students:normalizeStudents(data&&data.students),
      updatedAt:new Date().toISOString()
    };
    localStorage.setItem(KEYS.classroom,JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('gulliver:classroom-change',{detail:value}));
    return value;
  }
  function parseStudentLine(value){
    let raw=String(value||'').trim();
    let gender='';
    if(/\((남|남자|m)\)\s*$/i.test(raw)){gender='M';raw=raw.replace(/\((남|남자|m)\)\s*$/i,'').trim()}
    else if(/\((여|여자|f)\)\s*$/i.test(raw)){gender='F';raw=raw.replace(/\((여|여자|f)\)\s*$/i,'').trim()}
    return {name:raw,gender};
  }
  function setNames(names,className){
    const current=getClassroom();
    const queues=new Map();
    current.students.forEach(s=>{
      const key=s.name+'|'+(s.gender||'');
      if(!queues.has(key))queues.set(key,[]);
      queues.get(key).push(s);
    });
    const students=String(names||'').split(/\r?\n|,/).map(parseStudentLine).filter(s=>cleanName(s.name)).map(s=>{
      const key=cleanName(s.name)+'|'+(s.gender||'');
      const old=(queues.get(key)||[]).shift();
      return {id:old?.id||uid(),name:s.name,gender:s.gender};
    });
    const saved=saveClassroom({className:className||current.className,students});
    pruneClassroomMeta(saved.students.map(s=>s.id));
    return saved;
  }
  function getNames(){return getClassroom().students.map(s=>s.name)}
  function getNamesText(){return getNames().join('\n')}
  function clearClassroom(){
    localStorage.removeItem(KEYS.classroom);
    localStorage.removeItem(KEYS.profiles);
    localStorage.removeItem(KEYS.relations);
    localStorage.removeItem(KEYS.operations);
    window.dispatchEvent(new CustomEvent('gulliver:classroom-change',{detail:defaultClassroom()}));
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||min));
  function defaultProfile(){
    return {participation:3,responsibility:3,presentationBurden:3,frontSeat:false,leader:false,note:'',updatedAt:null};
  }
  function normalizeProfile(value){
    const src=value&&typeof value==='object'?value:{};
    return {
      participation:clamp(src.participation??3,1,5),
      responsibility:clamp(src.responsibility??3,1,5),
      presentationBurden:clamp(src.presentationBurden??3,1,5),
      frontSeat:Boolean(src.frontSeat),
      leader:Boolean(src.leader),
      note:String(src.note||'').slice(0,1000),
      updatedAt:src.updatedAt||null
    };
  }
  function getProfiles(){
    const room=getClassroom(),raw=safeParse(localStorage.getItem(KEYS.profiles),{});
    const out={};
    room.students.forEach(s=>{out[String(s.id)]=normalizeProfile(raw&&raw[String(s.id)])});
    return out;
  }
  function getStudentProfile(id){return normalizeProfile(getProfiles()[String(id)])}
  function saveProfiles(profiles){
    const ids=new Set(getClassroom().students.map(s=>String(s.id))),out={};
    Object.entries(profiles&&typeof profiles==='object'?profiles:{}).forEach(([id,value])=>{
      if(ids.has(String(id)))out[String(id)]=normalizeProfile(value);
    });
    localStorage.setItem(KEYS.profiles,JSON.stringify(out));
    window.dispatchEvent(new CustomEvent('gulliver:classroom-meta-change'));
    return out;
  }
  function updateStudentProfile(id,patch){
    id=String(id);const profiles=getProfiles();
    profiles[id]=normalizeProfile({...profiles[id],...(patch||{}),updatedAt:new Date().toISOString()});
    return saveProfiles(profiles)[id];
  }
  function relationKey(a,b){return [String(a),String(b)].sort().join('|')}
  const RELATION_TAGS=new Set(['avoid','conflict','chatter','playful','cooperate']);
  function normalizeRelation(value){
    const src=value&&typeof value==='object'?value:{};
    const a=String(src.a||''),b=String(src.b||'');
    return {
      a,b,
      tags:[...new Set((Array.isArray(src.tags)?src.tags:[]).filter(t=>RELATION_TAGS.has(t)))],
      strength:clamp(src.strength??2,1,3),
      scope:['month','term','always'].includes(src.scope)?src.scope:'term',
      note:String(src.note||'').slice(0,500),
      updatedAt:src.updatedAt||new Date().toISOString(),
      expiresAt:src.expiresAt||null
    };
  }
  function relationExpiry(scope,now=Date.now()){
    if(scope==='always')return null;
    const days=scope==='month'?31:180;
    return new Date(now+days*86400000).toISOString();
  }
  function isRelationActive(rel){
    return !rel.expiresAt || new Date(rel.expiresAt).getTime()>Date.now();
  }
  function getRelations(includeExpired=false){
    const ids=new Set(getClassroom().students.map(s=>String(s.id)));
    const raw=safeParse(localStorage.getItem(KEYS.relations),{});
    const out=[];
    Object.values(raw&&typeof raw==='object'?raw:{}).forEach(value=>{
      const rel=normalizeRelation(value);
      if(!rel.a||!rel.b||rel.a===rel.b||!ids.has(rel.a)||!ids.has(rel.b)||!rel.tags.length)return;
      if(includeExpired||isRelationActive(rel))out.push(rel);
    });
    return out;
  }
  function saveRelations(items){
    const ids=new Set(getClassroom().students.map(s=>String(s.id))),out={};
    (Array.isArray(items)?items:Object.values(items||{})).forEach(value=>{
      const rel=normalizeRelation(value);
      if(!ids.has(rel.a)||!ids.has(rel.b)||rel.a===rel.b||!rel.tags.length)return;
      out[relationKey(rel.a,rel.b)]=rel;
    });
    localStorage.setItem(KEYS.relations,JSON.stringify(out));
    window.dispatchEvent(new CustomEvent('gulliver:classroom-meta-change'));
    return Object.values(out);
  }
  function upsertRelation(a,b,data){
    a=String(a);b=String(b);const list=getRelations(true).filter(r=>relationKey(r.a,r.b)!==relationKey(a,b));
    const scope=['month','term','always'].includes(data?.scope)?data.scope:'term';
    const rel=normalizeRelation({...(data||{}),a,b,scope,updatedAt:new Date().toISOString(),expiresAt:relationExpiry(scope)});
    if(rel.tags.length)list.push(rel);
    return saveRelations(list).find(r=>relationKey(r.a,r.b)===relationKey(a,b))||null;
  }
  function removeRelation(a,b){return saveRelations(getRelations(true).filter(r=>relationKey(r.a,r.b)!==relationKey(a,b)))}
  function getRelation(a,b){return getRelations().find(r=>relationKey(r.a,r.b)===relationKey(a,b))||null}
  function relationPenalty(a,b,context='group'){
    const rel=getRelation(a,b);if(!rel)return 0;
    const s=rel.strength;
    let total=0;
    rel.tags.forEach(tag=>{
      if(context==='seat'){
        if(tag==='avoid')total+=1500*s;
        else if(tag==='conflict')total+=900*s;
        else if(tag==='chatter')total+=300*s;
        else if(tag==='playful')total+=220*s;
        else if(tag==='cooperate')total-=35*s;
      }else if(context==='group'){
        if(tag==='avoid')total+=5000*s;
        else if(tag==='conflict')total+=1800*s;
        else if(tag==='chatter')total+=420*s;
        else if(tag==='playful')total+=300*s;
        else if(tag==='cooperate')total-=90*s;
      }
    });
    return total;
  }
  function getOperations(limit=60){return safeParse(localStorage.getItem(KEYS.operations),[]).filter(Boolean).slice(0,Math.max(1,limit))}
  function recordOperation(type,data={}){
    const item={id:'op_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:String(type||'other'),at:Date.now(),data};
    const next=[item,...getOperations(199)].slice(0,200);
    localStorage.setItem(KEYS.operations,JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('gulliver:classroom-meta-change'));
    return item;
  }
  function clearOperations(){localStorage.removeItem(KEYS.operations);window.dispatchEvent(new CustomEvent('gulliver:classroom-meta-change'))}
  function pruneClassroomMeta(validIds){
    const ids=new Set((validIds||[]).map(String));
    const profiles=getProfiles(),nextProfiles={};
    Object.entries(profiles).forEach(([id,p])=>{if(ids.has(id))nextProfiles[id]=p});
    localStorage.setItem(KEYS.profiles,JSON.stringify(nextProfiles));
    const relations=getRelations(true).filter(r=>ids.has(r.a)&&ids.has(r.b));
    const map={};relations.forEach(r=>map[relationKey(r.a,r.b)]=r);
    localStorage.setItem(KEYS.relations,JSON.stringify(map));
  }
  function exportClassroomBundle(){
    return {version:2,classroom:getClassroom(),profiles:getProfiles(),relations:getRelations(true),operations:getOperations(200)};
  }
  function importClassroomBundle(data){
    if(data&&data.classroom){
      const room=saveClassroom(data.classroom);
      saveProfiles(data.profiles||{});
      saveRelations(data.relations||[]);
      if(Array.isArray(data.operations))localStorage.setItem(KEYS.operations,JSON.stringify(data.operations.slice(0,200)));
      return room;
    }
    return saveClassroom(data||{});
  }

    function getRecent(){return safeParse(localStorage.getItem(KEYS.recent),[]).filter(Boolean).slice(0,8)}
  function trackTool(tool){
    if(!tool||!tool.href) return;
    const item={name:String(tool.name||document.title||'도구'),href:String(tool.href),icon:String(tool.icon||'🧰'),at:Date.now()};
    const next=[item,...getRecent().filter(x=>x.href!==item.href)].slice(0,8);
    localStorage.setItem(KEYS.recent,JSON.stringify(next));
  }
  function getFavorites(){return safeParse(localStorage.getItem(KEYS.favorites),[]).filter(Boolean)}
  function isFavorite(href){return getFavorites().some(x=>x.href===href)}
  function toggleFavorite(tool){
    const current=getFavorites();
    const found=current.some(x=>x.href===tool.href);
    const next=found?current.filter(x=>x.href!==tool.href):[{name:tool.name,href:tool.href,icon:tool.icon||'🧰'},...current].slice(0,24);
    localStorage.setItem(KEYS.favorites,JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('gulliver:favorites-change',{detail:next}));
    return !found;
  }
  function injectStyles(){
    if(document.getElementById('gulliver-shared-style')) return;
    const style=document.createElement('style');style.id='gulliver-shared-style';
    style.textContent=`
      .gulliver-shell{position:fixed;z-index:99999;top:8px;left:50%;transform:translateX(-50%);width:min(1180px,calc(100% - 24px));font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}
      .gulliver-shell-inner{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 10px 8px 14px;border:1px solid rgba(148,163,184,.22);border-radius:16px;background:rgba(255,255,255,.94);box-shadow:0 8px 24px rgba(15,23,42,.07);backdrop-filter:blur(12px)}
      .gulliver-shell-left,.gulliver-shell-actions{display:flex;align-items:center;gap:8px;min-width:0}
      .gulliver-shell-brand{font-weight:900;font-size:13px;color:#475569;text-decoration:none;white-space:nowrap}
      .gulliver-shell-sep{color:#cbd5e1}
      .gulliver-shell-title{font-weight:850;font-size:13px;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .gulliver-shell-btn{appearance:none;border:1px solid #e2e8f0;background:#fff;color:#334155;text-decoration:none;padding:8px 11px;border-radius:10px;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;line-height:1}
      .gulliver-shell-btn:hover{background:#f8fafc;border-color:#cbd5e1}
      .gulliver-shell-btn.primary{background:#4f46e5;color:#fff;border-color:#4f46e5}
      .gulliver-import-btn{appearance:none;border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;padding:9px 12px;border-radius:10px;font:800 13px/1 "Pretendard","Malgun Gothic",sans-serif;cursor:pointer}
      .gulliver-import-btn:hover{background:#e0e7ff}
      .gulliver-toast{position:fixed;left:50%;bottom:24px;z-index:100000;transform:translate(-50%,12px);padding:11px 16px;border-radius:999px;background:#0f172a;color:#fff;font:800 13px/1.25 "Pretendard","Malgun Gothic",sans-serif;box-shadow:0 12px 30px rgba(15,23,42,.24);opacity:0;pointer-events:none;transition:.18s ease}
      .gulliver-toast.show{opacity:1;transform:translate(-50%,0)}
      @media(max-width:640px){.gulliver-shell{width:calc(100% - 16px);top:6px}.gulliver-shell-inner{padding:7px 8px}.gulliver-shell-sep,.gulliver-shell-title{display:none}.gulliver-shell-btn{padding:8px 9px}.gulliver-shell-btn .wide{display:none}}
    `;
    document.head.appendChild(style);
  }
  function toast(msg){
    injectStyles();
    let el=document.querySelector('.gulliver-toast');
    if(!el){el=document.createElement('div');el.className='gulliver-toast';document.body.appendChild(el)}
    el.textContent=msg;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),1700);
  }
  function mountShell(options={}){
    if(document.querySelector('.gulliver-shell')) return;
    injectStyles();
    const wrap=document.createElement('div');wrap.className='gulliver-shell';
    wrap.innerHTML=`<div class="gulliver-shell-inner">
      <div class="gulliver-shell-left">
        <a class="gulliver-shell-brand" href="index.html">🧰 교실 뚝딱도구</a>
        <span class="gulliver-shell-sep">/</span>
        <span class="gulliver-shell-title"></span>
      </div>
      <div class="gulliver-shell-actions">
        <a class="gulliver-shell-btn" href="우리반.html">👥 <span class="wide">우리 반</span></a>
        <button class="gulliver-shell-btn" type="button" data-gulliver-full>⛶ <span class="wide">전체화면</span></button>
        <a class="gulliver-shell-btn primary" href="index.html">⌂ <span class="wide">홈</span></a>
      </div>
    </div>`;
    wrap.querySelector('.gulliver-shell-title').textContent=options.title||document.title.replace(/\s*[|·-].*$/,'');
    wrap.querySelector('[data-gulliver-full]').addEventListener('click',async()=>{
      try{
        if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }catch{toast('이 브라우저에서는 전체화면을 사용할 수 없습니다.')}
    });
    document.body.insertAdjacentElement('afterbegin',wrap);
    if(options.track!==false) trackTool({name:options.title||document.title,href:location.pathname.split('/').pop()||'index.html',icon:options.icon||'🧰'});
  }
  function makeImportButton(label='우리 반 명단 불러오기'){
    injectStyles();
    const b=document.createElement('button');b.type='button';b.className='gulliver-import-btn';b.textContent='👥 '+label;return b;
  }
  window.Gulliver={
    keys:KEYS,getClassroom,saveClassroom,setNames,getNames,getNamesText,clearClassroom,
    getProfiles,getStudentProfile,saveProfiles,updateStudentProfile,getRelations,saveRelations,upsertRelation,removeRelation,getRelation,relationPenalty,
    getOperations,recordOperation,clearOperations,exportClassroomBundle,importClassroomBundle,
    getRecent,trackTool,getFavorites,isFavorite,toggleFavorite,mountShell,makeImportButton,toast,normalizeStudents
  };
})();