(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.GulliverUnifiedLibraryCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const labels={canvas:'통합 캔버스',design:'도안',slides:'발표',document:'문서',video:'영상',music:'음악',timer:'수업 타이머',quiz:'퀴즈·낱말카드',seating:'자리 배정',lesson:'수업',asset:'사진 소재'};
 const icons={canvas:'▧',design:'◇',slides:'▤',document:'≡',video:'▶',music:'♫',timer:'◷',quiz:'?',seating:'▦',lesson:'▣',asset:'▧'};
 const categories=['전체','학습자료','수업 도구','영상·음악','수업','사진·파일'];
 function entries(input){
  const source=input||{},result=[];
  function append(items,origin){
   if(!Array.isArray(items))return;
   for(const p of items){
    if(!p||typeof p.id!=='string'||!p.id)continue;
    const kind=origin==='lessons'?'lesson':origin==='assets'?'asset':p.kind;
    if(!labels[kind])continue;
    const category=kind==='lesson'?'수업':kind==='asset'?'사진·파일':origin==='official'||kind==='video'||kind==='music'?'영상·음악':['timer','quiz','seating'].includes(kind)?'수업 도구':'학습자료';
    const updatedAt=Number(p.updatedAt||p.createdAt)||0;
    const title=String(p.title||p.name||labels[kind]).trim().slice(0,160)||labels[kind];
    const href=origin==='activities'?null:origin==='lessons'?'lesson.html?lesson='+encodeURIComponent(p.id):origin==='assets'?'뚝딱 제작실.html?library=assets':origin==='official'?'뚝딱 제작실.html?official='+encodeURIComponent(kind+':'+p.id):(['canvas','design','slides','document'].includes(kind)?'lesson.html?project=':'뚝딱 제작실.html?project=')+encodeURIComponent(p.id);
    result.push({previewKind:kind==='lesson'?p.steps?.find(s=>s.payload)?.kind:kind,previewPayload:kind==='lesson'?p.steps?.find(s=>s.payload)?.payload:p.payload,workId:p.workId||'',key:origin+':'+p.id,id:p.id,kind,origin,category,title,updatedAt,href,icon:icons[kind],label:labels[kind],blob:origin==='assets'?p.blob:null,status:origin==='official'?'보관한 사본 · 자동 갱신 안 됨':origin==='assets'?'소재함 · 기기 저장':origin==='lessons'?'기기 저장 · 수업별 백업':origin==='activities'?'직접 저장한 활동':'자동 저장 · 기기 저장'});
   }
  }
  append(source.projects,'projects');append(source.official,'official');append(source.activities,'activities');append(source.lessons,'lessons');append(source.assets,'assets');
  const linked=new Set(result.filter(r=>r.origin==='lessons'&&r.workId).map(r=>r.workId));for(let i=result.length-1;i>=0;i--)if(result[i].origin==='projects'&&linked.has(result[i].workId))result.splice(i,1);
  result.sort((a,b)=>b.updatedAt-a.updatedAt||a.title.localeCompare(b.title,'ko'));
  return result;
 }
 function filter(items,query,category,sort){
  const term=String(query||'').trim().toLocaleLowerCase('ko').replace(/\s+/g,'');
  const selected=categories.includes(category)?category:'전체';
  const found=items.filter(p=>(selected==='전체'||p.category===selected)&&(!term||(p.title+' '+p.label+' '+p.category).toLocaleLowerCase('ko').replace(/\s+/g,'').includes(term)));
  if(sort==='name')found.sort((a,b)=>a.title.localeCompare(b.title,'ko'));
  else if(sort==='old')found.sort((a,b)=>a.updatedAt-b.updatedAt);
  return found;
 }
 return {labels,categories,entries,filter};
});
(function(){
 'use strict';
 if(typeof document==='undefined')return;
 const C=window.GulliverUnifiedLibraryCore,$=id=>document.getElementById(id);
 if(!C)return;
 const W=window.ClassroomWorkspace,S=window.GulliverStudioStorage,L=window.LessonStorage;
 let fullRows=[],urls=[],homeGeneration=0,searchGeneration=0,searchTimer=null,refreshGeneration=0;
 function element(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
 function date(value){return value?new Date(value).toLocaleDateString('ko-KR'):'날짜 정보 없음'}
 function target(row){return row.origin==='activities'?W.openUrl({kind:row.kind,id:row.id}):row.href}
 function assetUrlsClear(){urls.forEach(url=>URL.revokeObjectURL(url));urls=[]}
 async function collectResult(includeAssets){
  const jobs=[
   ['projects',()=>S.projects()],
   ['official',()=>S.official()],
   ['activities',()=>W.list()],
   ['lessons',()=>L.list()]
  ];
  if(includeAssets)jobs.push(['assets',()=>S.assets()]);
  const settled=await Promise.all(jobs.map(async ([name,fn])=>{try{return{name,data:await fn()}}catch(error){return{name,error}}}));
  const data={},errors=[];
  for(const r of settled){
   if(r.error){data[r.name]=[];errors.push(r.name)}else data[r.name]=r.data;
  }
  return {rows:C.entries(data),errors};
 }
 async function collect(includeAssets){return (await collectResult(includeAssets)).rows}
 function card(row,compact){
  const article=element('article',compact?'unified-item compact':'unified-item');
  const thumb=element('span','unified-preview '+row.kind);
  if(row.origin==='assets'&&row.blob instanceof Blob){
   const url=URL.createObjectURL(row.blob);urls.push(url);
   const img=element('img');img.src=url;img.alt='';thumb.append(img);
  }else{let preview=null;try{preview=window.GulliverWorkPreview?.make(row.previewKind,row.previewPayload)}catch{}if(preview){thumb.append(preview);thumb.classList.add('has-work-preview')}else thumb.textContent=row.icon;}
  const info=element('span','unified-info');
  info.append(element('strong','',row.title),element('small','',row.label+' · '+date(row.updatedAt)));
  if(!compact)info.append(element('small','storage-type',row.status));
  const link=element('a','unified-open');
  link.href=target(row);link.setAttribute('aria-label',row.title+' 열기');
  link.append(thumb,info,element('span','unified-arrow','→'));
  article.append(link);
  if(row.origin==='assets'&&row.blob instanceof Blob&&!compact){
   const btn=element('button','unified-download','사진 내려받기');
   btn.type='button';
   btn.addEventListener('click',()=>{
    const u=URL.createObjectURL(row.blob),a=element('a');
    a.href=u;a.download=row.title;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);
   });
   article.append(btn);
  }
  return article;
 }
 async function renderHome(){
  const root=$('unifiedHomeRecent');if(!root)return;
  const gen=++homeGeneration;
  root.replaceChildren(element('p','unified-empty','이 기기에 저장한 자료를 확인하는 중이에요.'));
  const result=await collectResult(false);if(gen!==homeGeneration||!root.isConnected)return;
  assetUrlsClear();root.replaceChildren();
  if(!result.rows.length)root.append(element('p','unified-empty',result.errors.length?'일부 보관함을 읽지 못했어요. 보관함에서 상태를 확인해 주세요.':'아직 저장한 자료가 없어요. 아래에서 첫 자료를 만들어 보세요.'));
  else for(const row of result.rows.slice(0,8))root.append(card(row,false));
 }
 function renderHomeSearch(query){
  const root=$('homeSavedSearchResults');if(!root)return;
  const term=String(query||'').trim().slice(0,160),gen=++searchGeneration;
  clearTimeout(searchTimer);root.dataset.query=term;root.setAttribute('aria-busy','true');
  root.replaceChildren(element('p','unified-empty','저장 자료를 검색할게요.'));
  searchTimer=setTimeout(async()=>{
   const result=await collectResult(true);
   if(gen!==searchGeneration||!root.isConnected||root.dataset.query!==term)return;
   assetUrlsClear();root.replaceChildren();root.setAttribute('aria-busy','false');
   const rows=C.filter(result.rows,term,'전체');
   if(result.errors.length){
    const warning=element('p','home-search-warning','일부 저장소를 읽지 못해 결과가 빠졌을 수 있어요.');warning.setAttribute('role','status');root.append(warning);
   }
   if(!rows.length){
    const empty=element('p','unified-empty',result.errors.length?'읽을 수 있는 저장 자료에서 검색 결과를 찾지 못했어요.':'저장한 자료에서 검색 결과가 없어요.');root.append(empty);
    return;
   }
   const count=element('p','home-search-count','저장한 자료 '+rows.length+'개');root.append(count);
   const groups=['학습자료','수업 도구','영상·음악','수업','사진·파일'];
   for(const group of groups){
    const matches=rows.filter(row=>row.category===group);if(!matches.length)continue;
    const section=element('section','home-search-group'),heading=element('h3','',group+' · '+matches.length);
    const list=element('div','home-search-grid');matches.slice(0,40).forEach(row=>list.append(card(row,true)));
    section.append(heading,list);root.append(section);
   }
   if(rows.length>200){const note=element('p','home-search-warning','검색 결과가 많아 최근 수정한 자료 200개만 보여드려요.');root.append(note)}
  },220);
 }
 function update(){
  const list=$('unifiedLibraryList');if(!list)return;
  assetUrlsClear();list.replaceChildren();
  const selected=document.querySelector('[data-library-category][aria-pressed="true"]')?.dataset.libraryCategory||'전체';
  const results=C.filter(fullRows,$('unifiedSearch').value,selected,$('unifiedSort').value);
  $('unifiedCount').textContent='전체 '+fullRows.length+'개 중 '+results.length+'개 표시';
  if(!results.length)list.append(element('p','unified-empty',fullRows.length?'검색 조건에 맞는 자료가 없어요.':'이 기기에 저장한 자료가 아직 없어요.'));
  else results.slice(0,500).forEach(row=>list.append(card(row,false)));
 }
 async function refresh(){
  const status=$('unifiedStatus');if(!status)return;
  const gen=++refreshGeneration;status.textContent='내 기기의 저장 자료를 불러오는 중이에요.';
  const result=await collectResult(true);if(gen!==refreshGeneration)return;
  fullRows=result.rows;
  status.textContent=result.errors.length?'일부 저장소('+result.errors.join(', ')+')를 읽지 못했어요. 다른 브라우저·기기에서 만든 자료는 여기에 보이지 않아요.':'이 브라우저에 저장한 자료를 모았어요. 다른 기기와 자동 동기화되지 않아요.';
  update();
 }
 function init(){
  if(!$('unifiedLibraryList'))return;
  for(const b of document.querySelectorAll('[data-library-category]')){
   b.addEventListener('click',()=>{
    document.querySelectorAll('[data-library-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));update();
   });
  }
  const initialQuery=new URLSearchParams(location.search).get('q');
  if(initialQuery)$('unifiedSearch').value=initialQuery.slice(0,160);
  $('unifiedSearch').addEventListener('input',update);
  $('unifiedSort').addEventListener('change',update);
  $('unifiedRefresh').addEventListener('click',refresh);
  window.addEventListener('pageshow',refresh);
  window.addEventListener('gulliver:activities-change',refresh);
  refresh();
 }
 window.GulliverUnifiedLibraryUI={collect,renderHome,renderHomeSearch,refresh};
 init();
})();
