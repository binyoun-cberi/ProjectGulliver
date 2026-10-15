/* Device-specific navigation for the existing unified canvas.
   No duplicate editor implementation: all actions reuse the native buttons. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const grid=document.querySelector('.editor-grid'),top=document.querySelector('.top-tools');
const stage=$('stage'),shelf=document.querySelector('.shelf'),properties=document.querySelector('.properties');
const timeline=$('studioTimeline');
if(!grid||!top||!stage||!shelf||!properties||!timeline)return;
const mobileQuery=matchMedia('(max-width:700px)');
const isMobile=()=>mobileQuery.matches;
const categories=[
 {id:'templates',label:'템플릿',icon:'▤',detail:'출발점을 고르고 자유롭게 바꿔 보세요.'},
 {id:'elements',label:'요소',icon:'◇',detail:'도형과 그림 요소를 눌러 추가하세요.'},
 {id:'text',label:'텍스트',icon:'T',detail:'글씨를 추가하거나, 선택한 글씨를 수정할 수 있어요.'},
 {id:'uploads',label:'업로드',icon:'⇧',detail:'기기에 저장된 사진을 자료에 추가하세요.'},
 {id:'pages',label:'페이지',icon:'▦',detail:'페이지를 추가하거나 크기를 변경하세요.'},
 {id:'motion',label:'영상·음악',icon:'▶',detail:'페이지 순서와 재생 시간, 음악을 설정해요.'},
 {id:'teacher',label:'교사 도구',icon:'☷',detail:'우리 반 명단으로 수업자료를 한 번에 만들어요.'},
 {id:'properties',label:'편집',icon:'✎',detail:'선택한 글씨와 도형의 모양을 바꿔 보세요.'},
 {id:'export',label:'내보내기',icon:'↥',detail:'완성한 자료를 파일로 저장하거나 발표하세요.'}
];
function make(tag,cls,text){
 const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
}
const rail=make('nav','design-nav');
rail.setAttribute('aria-label','편집 도구');
const panel=make('aside','design-panel');
panel.id='designPanel';panel.setAttribute('aria-label','선택한 편집 도구');
const handle=make('span','canvas-pane-handle');handle.setAttribute('aria-hidden','true');
const head=make('header','design-panel-head'),heading=make('h2','', '요소');
heading.id='designPanelTitle';
const close=make('button','design-panel-close','×');close.type='button';close.setAttribute('aria-label','도구 패널 닫기');
head.append(heading,close);panel.append(handle,head);
const panes=new Map(),buttons=new Map();
let active='';
for(const item of categories){
 const b=make('button','');
 b.type='button';b.dataset.designTab=item.id;b.setAttribute('aria-controls','designPanel');
 b.setAttribute('aria-selected','false');b.setAttribute('aria-label',item.label);
 const icon=make('span','design-glyph',item.icon);
 icon.setAttribute('aria-hidden','true');
 b.append(icon,make('span','',item.label));rail.append(b);buttons.set(item.id,b);
 const section=make('section','design-pane');section.dataset.pane=item.id;section.hidden=true;
 const description=make('p','pane-description',item.detail);section.append(description);
 panel.append(section);panes.set(item.id,section);
 b.addEventListener('click',()=>toggle(item.id));
}
const shade=make('button','canvas-pane-shade');
shade.type='button';shade.setAttribute('aria-label','도구 패널 닫기');
grid.prepend(rail);rail.after(panel);grid.append(shade);

function sourceClick(selector){
 const native=document.querySelector(selector);
 if(!native||native.disabled)return false;
 native.click();return true;
}
function actionsPane(name){const root=make('div','pane-actions');panes.get(name).append(root);return root}
function shortcut(root,label,glyph,selector,opts={}){
 const button=make('button','pane-action'+(opts.danger?' danger':''));
 button.type='button';
 const icon=make('span','pane-icon',glyph);icon.setAttribute('aria-hidden','true');
 button.append(icon,make('span','',label));
 button.addEventListener('click',()=>{
  const did=sourceClick(selector);
  if(!did)return;
  if(isMobile()&&opts.closeAfter!==false)closePanel();
  if(opts.thenProps)queueMicrotask(()=>activate('properties'));
 });
 root.append(button);return button;
}
function note(name,text){
 panes.get(name).append(make('p','pane-note',text));
}
function renderFormats(){
 const container=panes.get('pages');
 const original=document.querySelector('.format-tools');if(original)container.append(original);
}
const templateButtons=actionsPane('templates');
shortcut(templateButtons,'발표 자료로 시작','▤','[data-template="presentation"]');
shortcut(templateButtons,'A4 학습지로 시작','▧','[data-template="worksheet"]');
shortcut(templateButtons,'빈 디자인으로 시작','＋','[data-template="blank"]');
note('templates','템플릿을 변경하면 현재 페이지 구성이 바뀌어요. 실행 취소로 되돌릴 수 있어요.');
panes.get('elements').append(shelf);
shelf.addEventListener('click',event=>{
 if(!event.target.closest('[data-add]'))return;
 // On phones, inserting an object returns to the canvas instead of trapping
 // users behind the tool sheet.
 if(isMobile())queueMicrotask(closePanel);
});

const textButtons=actionsPane('text');
shortcut(textButtons,'텍스트 상자 추가','T','[data-add="text"]',{thenProps:true});
const textEdit=make('button','pane-action');
textEdit.type='button';textEdit.innerHTML='<span class="pane-icon" aria-hidden="true">✎</span><span>선택한 글씨 편집</span>';
textEdit.addEventListener('click',()=>activate('properties'));textButtons.append(textEdit);
note('text','캔버스의 글씨를 두 번 누르면 화면에서 바로 수정할 수 있어요.');
const uploadButtons=actionsPane('uploads');
shortcut(uploadButtons,'기기에서 사진 선택','⇧','#addPhoto',{closeAfter:false});
note('uploads','PNG·JPG 파일만 지원하며 사진당 최대 2MB예요. 선택한 사진은 현재 페이지에 추가돼요.');
$('photoPicker')?.addEventListener('change',()=>{if(isMobile())closePanel()});
renderFormats();
const pageButtons=actionsPane('pages');
shortcut(pageButtons,'새 페이지 추가','＋','#newPage');
shortcut(pageButtons,'현재 페이지 복제','▣','#clonePage');
shortcut(pageButtons,'현재 페이지 삭제','×','#removePage',{danger:true});
note('pages','캔버스 아래의 작은 페이지를 누르면 해당 장으로 이동해요.');
panes.get('motion').append(timeline);
const teacherButtons=actionsPane('teacher');
shortcut(teacherButtons,'우리 반 이름표 만들기','▦','#nameTags',{closeAfter:false});
note('teacher','우리 반 명단을 불러와 이름표를 한 번에 만든 다음 각각 수정할 수 있어요.');
const propRoot=panes.get('properties');
propRoot.append(properties);
const propsHelp=make('div','pane-actions');
shortcut(propsHelp,'선택 요소 복제','▣','#duplicate',{closeAfter:false});
shortcut(propsHelp,'선택 요소 삭제','×','#delete',{danger:true,closeAfter:false});
propRoot.append(propsHelp);
panes.get('export').append(document.querySelector('.output-tools'));
note('export','PNG와 PDF, WebM 영상을 현재 기기에 저장할 수 있어요. 영상은 파일 생성이 끝날 때까지 이 창을 열어 두세요.');

const topActions=make('div','design-top-actions');
const undo=$('undo'),redo=$('redo'),present=$('present');
if(undo){undo.textContent='↶';undo.title='실행 취소';topActions.append(undo)}
if(redo){redo.textContent='↷';redo.title='다시 실행';topActions.append(redo)}
if(present){present.textContent='▶ 발표';present.classList.add('design-present');topActions.append(present)}
const exportButton=make('button','design-export','↥ 내보내기');
exportButton.type='button';exportButton.addEventListener('click',()=>activate('export'));
topActions.append(exportButton);top.append(topActions);
const selection=make('div','canvas-selection-bar');selection.hidden=true;selection.setAttribute('aria-label','선택 요소 빠른 편집');
const propertyButton=make('button','','✎ 편집');
propertyButton.type='button';propertyButton.addEventListener('click',()=>activate('properties'));
const duplicateButton=make('button','','복제');duplicateButton.type='button';duplicateButton.addEventListener('click',()=>sourceClick('#duplicate'));
const deleteButton=make('button','','삭제');deleteButton.type='button';deleteButton.addEventListener('click',()=>sourceClick('#delete'));
const multiButton=make('button','','＋ 선택');multiButton.type='button';multiButton.title='여러 개 선택 켜기/끄기';multiButton.addEventListener('click',()=>sourceClick('#multiSelectMode'));
const groupButton=make('button','','묶기');groupButton.type='button';groupButton.addEventListener('click',()=>sourceClick('#groupSelection'));
const ungroupButton=make('button','','풀기');ungroupButton.type='button';ungroupButton.addEventListener('click',()=>sourceClick('#ungroupSelection'));
selection.append(propertyButton,multiButton,groupButton,ungroupButton,duplicateButton,deleteButton);document.querySelector('.canvas-app').append(selection);
const labels=new Map(categories.map(c=>[c.id,c.label]));
function activate(id){
 if(!panes.has(id))return;
 active=id;
 document.body.classList.remove('panel-collapsed');
 document.body.classList.add('panel-open');
 for(const [key,pane] of panes)pane.hidden=key!==id;
 for(const [key,button] of buttons)button.setAttribute('aria-selected',String(key===id));
 heading.textContent=labels.get(id);
 panel.scrollTop=0;
 window.dispatchEvent(new Event('resize'));
}
function closePanel(){
 document.body.classList.remove('panel-open');
 if(!isMobile())document.body.classList.add('panel-collapsed');
 else document.body.classList.remove('panel-collapsed');
 active='';
 for(const [key,pane] of panes)pane.hidden=true;
 for(const [,button] of buttons)button.setAttribute('aria-selected','false');
 window.dispatchEvent(new Event('resize'));
}
function toggle(id){
 if(active===id&&(isMobile()?document.body.classList.contains('panel-open'):!document.body.classList.contains('panel-collapsed')))closePanel();
 else activate(id);
}
mobileQuery.addEventListener?.('change',closePanel);
close.addEventListener('click',closePanel);
shade.addEventListener('click',closePanel);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&document.body.classList.contains('panel-open')&&!document.querySelector('dialog[open]'))closePanel();
});
const updateSelection=()=>{
 const chosen=stage.querySelector('.item.selected');
 const multiActive=$('multiSelectMode')?.getAttribute('aria-pressed')==='true';
 selection.hidden=(!chosen&&!multiActive)||stage.classList.contains('playing');
 multiButton.setAttribute('aria-pressed',String(multiActive));
 groupButton.disabled=stage.querySelectorAll('.item.selected').length<2;
 ungroupButton.disabled=$('ungroupSelection')?.disabled!==false;
 if(chosen&&!isMobile()&&!document.body.classList.contains('panel-collapsed')&&active==='elements'){
  // Selecting an element reveals editing controls on desktop, without covering the canvas.
  activate('properties');
 }
};
new MutationObserver(updateSelection).observe(stage,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
stage.addEventListener('pointerup',()=>queueMicrotask(updateSelection));
const onViewport=()=>{
 if(isMobile()){
  // When moving from desktop to phone, begin with a clear canvas. The first
  // bottom-toolbar tap should open the sheet, not unexpectedly close it.
  closePanel();
 }else{
  if(active){document.body.classList.add('panel-open');document.body.classList.remove('panel-collapsed')}
  else activate('elements');
 }
 updateSelection();
};
mobileQuery.addEventListener?.('change',onViewport);
if(isMobile())closePanel();else activate('elements');
updateSelection();
requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
window.GulliverCanvasShell={activate,closePanel,getActive:()=>active};
})();
