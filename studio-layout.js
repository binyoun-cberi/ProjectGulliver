(() => {
'use strict';
// Studio 1.2 keeps original tool inputs and actions as the single source of
// truth. Shared controls proxy user actions into those original editors.
const $=id=>document.getElementById(id);
const fields={
 design:[
  ['projectTitle','도안 이름'],['shapeText','선택한 글씨'],['shapeX','가로 위치'],['shapeY','세로 위치'],
  ['shapeW','너비'],['shapeH','높이'],['shapeFill','채우기 색'],['shapeStroke','테두리 색'],
  ['shapeFont','글씨 크기'],['shapeStrokeWidth','테두리 굵기']
 ],
 slides:[
  ['deckTitle','발표 제목'],['layout','슬라이드 종류'],['eyebrow','작은 제목'],
  ['slideTitle','슬라이드 제목'],['slideBody','슬라이드 내용'],
  ['theme','전체 색상'],['slideNotes','진행 메모']
 ],
 document:[['titleInput','문서 제목'],['subtitleInput','부제목'],['themeInput','문서 강조색']]
};
const buttons={
 design:{
  quick:[['undo','↶'],['redo','↷'],['exportSvg','SVG 저장'],['exportPng','PNG 저장'],['print','PDF·인쇄']],
  add:[['[data-add="text"]','글씨'],['[data-add="rect"]','네모'],['[data-add="ellipse"]','동그라미'],
   ['[data-add="triangle"]','세모'],['[data-add="star"]','별'],['[data-add="line"]','선'],['#addPhoto','사진 넣기']],
  selected:[['duplicate','선택 요소 복제'],['bringForward','앞으로 가져오기'],['sendBack','뒤로 보내기'],['deleteShape','삭제']]
 },
 slides:{
  quick:[['previous','← 이전'],['next','다음 →'],['present','▶ 발표'],['exportPptx','PPTX 저장'],['printDeck','PDF·인쇄']],
  add:[['#addSlide','+ 슬라이드'],['#duplicateSlide','현재 슬라이드 복제'],['#slideImage','사진 넣기']],
  selected:[['removeImage','슬라이드 사진 지우기'],['deleteSlide','슬라이드 삭제']]
 },
 document:{
  quick:[['undo','↶'],['redo','↷'],['saveHwpx','HWPX 저장'],['saveDocx','DOCX 저장'],['savePdf','PDF·인쇄']],
  add:[['#addHeading','소제목'],['#addParagraph','본문'],['#addList','목록'],
   ['#addTable','표'],['#addRule','구분선'],['#addImage','사진 넣기']],
  selected:[['moveUp','선택 요소 위로'],['moveDown','선택 요소 아래로'],['removeBlock','선택 요소 삭제']]
 }
};
let kind='',child=null,refreshTimer=null,fieldControls=new Map(),buttonPairs=[],paletteTab='templates',rightTab='projects',pageSignature='',templateSignature='';
const managed=k=>['design','slides','document'].includes(k);
const doc=()=>child?.contentDocument;
function make(tag,cl,text){const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=String(text);return n}
function refreshSoon(){setTimeout(refresh,40);setTimeout(refresh,220)}
function clickNative(selector){
 const d=doc();if(!d)return false;
 const target=d.querySelector(selector);
 if(!target||target.disabled)return false;
 target.click();refreshSoon();
 return true;
}
function nativeButton(label,selector,cl='palette-button'){
 const btn=make('button',cl,label);btn.type='button';btn.dataset.native=selector;
 btn.addEventListener('click',()=>{if(!clickNative(selector))btn.disabled=true;closeDrawer()});
 return btn;
}
function setPalette(tab){
 paletteTab=tab;
 for(const key of ['templates','add','pages']){
  const panel=$('palette'+key[0].toUpperCase()+key.slice(1));
  panel.hidden=key!==tab;
  const button=document.querySelector('[data-palette="'+key+'"]');
  button?.setAttribute('aria-selected',String(key===tab));
 }
}
function setRight(tab){
 if(tab==='properties'&&!managed(kind))tab='projects';
 rightTab=tab;
 document.querySelectorAll('[data-inspector]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.inspector===tab)));
 $('inspectorProperties').hidden=tab!=='properties';
 $('inspectorProjects').hidden=tab!=='projects';
 $('inspectorAssets').hidden=tab!=='assets';
}
function closeDrawer(){
 $('studioPalette').classList.remove('is-open');
 document.querySelector('.sidebar')?.classList.remove('is-open');
 $('drawerShade').hidden=true;
}
function openDrawer(which){
 if(!managed(kind))return;
 closeDrawer();
 if(which==='palette')$('studioPalette').classList.add('is-open');
 else document.querySelector('.sidebar')?.classList.add('is-open');
 $('drawerShade').hidden=false;
}
function clear(){
 clearInterval(refreshTimer);refreshTimer=null;kind='';child=null;
 fieldControls.clear();buttonPairs=[];pageSignature='';templateSignature='';
 for(const name of ['templateList','insertList','pageList','inspectorFields','inspectorActions','studioQuickBar'])$(name).replaceChildren();
 $('studioQuickBar').hidden=true;$('studioPalette').hidden=true;
 $('openPalette').hidden=true;$('openInspector').hidden=true;
 document.body.classList.remove('studio-managed');
 document.querySelectorAll('[data-inspector="properties"]').forEach(b=>b.disabled=true);
 setRight('projects');closeDrawer();
}
function toolChanged(k){
 if(!managed(k)){clear();return}
 // The previous iframe is removed during navigation; mount after its load.
 kind=k;
 document.body.classList.add('studio-managed');
 $('studioPalette').hidden=false;$('studioQuickBar').hidden=false;
 $('openPalette').hidden=false;$('openInspector').hidden=false;
 document.querySelectorAll('[data-inspector="properties"]').forEach(b=>b.disabled=false);
 setRight('properties');
}
function embedStyle(){
 const d=doc();if(!d||d.getElementById('studio-v12-embedded-style'))return;
 const css=d.createElement('style');css.id='studio-v12-embedded-style';
 css.textContent=`
  @media screen {
   body>.workspace{display:block!important;grid-template-columns:1fr!important;max-width:none!important;width:100%!important;margin:0!important;padding:4px!important;background:#fff!important}
   body>.workspace>aside.panel,body>.workspace>.sidebar,body>.workspace>.templates-panel{display:none!important}
   body>.workspace>section.editor-col,body>.workspace>section.editor,body>.workspace>section.center{display:block!important;width:100%!important;max-width:none!important;min-width:0!important}
   body>.workspace nav.toolbar{display:none!important}
   body>.workspace .sheet-box,body>.workspace .slide-surface,body>.workspace .paper-scroller{margin:0!important;padding:12px!important}
   body>.workspace .paper{box-shadow:0 5px 24px #15243d17!important}
  }`;
 d.head.append(css);
}
function rebuildQuick(){
 const root=$('studioQuickBar');root.replaceChildren();buttonPairs=[];
 for(const [id,label] of buttons[kind].quick){
  const target=doc().getElementById(id);
  if(!target)continue;
  const action=nativeButton(label,'#'+id,'btn'+(label.includes('저장')?' soft':''));
  action.disabled=!!target.disabled;root.append(action);buttonPairs.push([action,target]);
 }
}
function rebuildTemplates(){
 const root=$('templateList');root.replaceChildren();
 const selectors=kind==='slides'?'[data-starter]':'[data-template]';
 const targets=[...doc().querySelectorAll(selectors)];
 if(!targets.length){root.append(make('p','palette-empty','현재 도구는 별도의 템플릿을 제공하지 않아요.'));return}
 targets.forEach(t=>{
  const button=make('button','palette-button',t.textContent.trim());
  button.type='button';button.dataset.target=t.dataset.starter||t.dataset.template;
  button.addEventListener('click',()=>{t.click();refreshSoon();closeDrawer()});
  root.append(button);
 });
}
function rebuildAdd(){
 const root=$('insertList');root.replaceChildren();
 for(const [selector,label] of buttons[kind].add){
  if(doc().querySelector(selector))root.append(nativeButton(label,selector));
 }
 if(kind!=='slides')$('paletteTabPages').disabled=true;
 else $('paletteTabPages').disabled=false;
}
function rebuildFields(){
 const root=$('inspectorFields'),actions=$('inspectorActions');
 root.replaceChildren();actions.replaceChildren();fieldControls.clear();buttonPairs=[];
 for(const [id,label] of fields[kind]){
  const native=doc().getElementById(id);if(!native)continue;
  const row=make('div','inspector-field'),heading=make('label','',label);
  const field=native.tagName==='SELECT'?make('select'):make(native.tagName==='TEXTAREA'?'textarea':'input');
  field.id='proxy-'+id;heading.htmlFor=field.id;
  if(native.tagName==='SELECT'){
   [...native.options].forEach(opt=>{const o=make('option','',opt.textContent);o.value=opt.value;field.append(o)});
  }else if(native.tagName==='TEXTAREA'){field.rows=3;field.maxLength=native.maxLength>0?native.maxLength:4000}
  else{
   field.type=native.type||'text';
   if(native.maxLength>0)field.maxLength=native.maxLength;
   if(native.min)field.min=native.min;if(native.max)field.max=native.max;if(native.step)field.step=native.step;
  }
  field.addEventListener('input',()=>{
   if(native.disabled)return;
   native.value=field.value;
   native.dispatchEvent(new child.contentWindow.Event('input',{bubbles:true}));
   if(field.type==='color'||field.tagName==='SELECT')native.dispatchEvent(new child.contentWindow.Event('change',{bubbles:true}));
  });
  field.addEventListener('change',()=>{
   if(native.disabled)return;
   native.value=field.value;
   native.dispatchEvent(new child.contentWindow.Event('change',{bubbles:true}));
   refreshSoon();
  });
  row.append(heading,field);root.append(row);
  fieldControls.set(id,{source:native,proxy:field,row});
 }
 for(const [id,label] of buttons[kind].selected){
  const n=doc().getElementById(id);if(!n)continue;
  const b=nativeButton(label,'#'+id);
  actions.append(b);
  buttonPairs.push([b,n]);
 }
}
function rebuildPages(){
 const root=$('pageList');root.replaceChildren();
 if(kind==='slides'){
  const targets=[...doc().querySelectorAll('#slidesList .thumb-title')];
  if(!targets.length){root.append(make('p','palette-empty','발표 슬라이드가 아직 없어요.'));return}
  targets.forEach((t,i)=>{
   const b=make('button','palette-button palette-slide');
   b.type='button';b.dataset.selected=String(t.getAttribute('aria-current')==='true');
   b.append(make('span','',(i+1)+'. '+t.textContent.replace(/^\d+\.\s*/,'').trim()));
   b.addEventListener('click',()=>{t.click();refreshSoon();closeDrawer()});
   root.append(b);
  });
 }else{
  root.append(make('p','palette-empty',kind==='document'?'문서 페이지는 내용에 맞춰 자동으로 이어져요.':'도안은 A4 한 쪽 단위로 만들 수 있어요.'));
 }
}
function refresh(){
 if(!managed(kind)||!doc())return;
 try{
  const d=doc();
  for(const {source,proxy,row} of fieldControls.values()){
   const invisible=!!source.closest('[hidden]');
   row.hidden=invisible;
   proxy.disabled=!!source.disabled;
   if(document.activeElement!==proxy&&proxy.value!==source.value)proxy.value=source.value;
  }
  for(const [b,n] of buttonPairs)b.disabled=!!n.disabled;
  const desc=kind==='design'?(d.getElementById('selectedType')?.textContent.trim()||'도안에서 개체를 선택하면 위치·색상과 크기를 수정할 수 있어요.')
   :kind==='document'?(d.getElementById('selectionDescription')?.textContent.trim()||'문서의 본문·표를 직접 누르면 수정할 수 있어요.')
   :(d.getElementById('currentCounter')?.textContent.trim()||'슬라이드를 선택하면 내용을 수정할 수 있어요.');
  $('inspectorDescription').textContent=desc;
  const templateValue=[...d.querySelectorAll(kind==='slides'?'[data-starter]':'[data-template]')];
  const selected=templateValue.map(x=>x.getAttribute('aria-pressed')==='true'||x.classList.contains('selected')?'1':'0').join('');
  if(selected!==templateSignature){
   templateSignature=selected;
   [...$('templateList').children].forEach((btn,i)=>{if(btn.tagName==='BUTTON')btn.setAttribute('aria-pressed',selected[i]==='1'?'true':'false')});
  }
  const pages=[...d.querySelectorAll('#slidesList .thumb-title')];
  const sign=pages.map(n=>n.textContent+'|'+n.getAttribute('aria-current')).join('\n');
  if(sign!==pageSignature){pageSignature=sign;rebuildPages()}
 }catch(e){$('inspectorDescription').textContent='편집기 상태를 확인할 수 없어요. 새 창에서 편집을 계속할 수 있어요.'}
}
function mount(k,frame){
 if(!managed(k))return clear();
 clearInterval(refreshTimer);kind=k;child=frame;toolChanged(k);
 if(!doc()?.body)return;
 embedStyle();rebuildQuick();rebuildTemplates();rebuildAdd();rebuildFields();rebuildPages();
 setPalette('templates');setRight('properties');refresh();
 const d=doc();
 for(const event of ['click','change','input','pointerup','keyup'])d.addEventListener(event,refreshSoon,{passive:true});
 refreshTimer=setInterval(refresh,600);
}
document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>setPalette(b.dataset.palette)));
document.querySelectorAll('[data-inspector]').forEach(b=>b.addEventListener('click',()=>setRight(b.dataset.inspector)));
$('openPalette').addEventListener('click',()=>openDrawer('palette'));
$('openInspector').addEventListener('click',()=>openDrawer('sidebar'));
$('drawerShade').addEventListener('click',closeDrawer);
document.querySelectorAll('[data-close-panels]').forEach(b=>b.addEventListener('click',closeDrawer));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
window.GulliverStudioLayout={mount,toolChanged,reset:clear,refresh,setPalette,setRight};
clear();
})();