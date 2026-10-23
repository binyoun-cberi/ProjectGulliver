/* The host owns the work header; embedded engines keep editing and export actions. */
(()=>{'use strict';const $=id=>document.getElementById(id),bar=document.querySelector('header.bar');if(!bar)return;
document.body.classList.add('work-surface');
const actions=bar.querySelector('.actions'),initialActions=[...actions.children],primaryActions=document.createElement('div'),secondaryActions=document.createElement('div'),menu=document.createElement('details'),summary=document.createElement('summary');primaryActions.className='work-primary-actions';primaryActions.setAttribute('role','group');primaryActions.setAttribute('aria-label','주요 편집 도구');secondaryActions.className='work-secondary-actions';secondaryActions.setAttribute('role','group');secondaryActions.setAttribute('aria-label','수업 보조 도구');actions.replaceChildren(primaryActions,secondaryActions);initialActions.forEach(el=>primaryActions.append(el));menu.className='work-file-menu';summary.textContent='파일';menu.append(summary);const menuBody=document.createElement('div');menuBody.className='work-file-actions';menu.append(menuBody);
const syncWorkHeaderHeight=()=>document.documentElement.style.setProperty('--work-header-height',`${Math.ceil(bar.getBoundingClientRect().height)}px`);if('ResizeObserver'in window)new ResizeObserver(syncWorkHeaderHeight).observe(bar);else window.addEventListener('resize',syncWorkHeaderHeight);syncWorkHeaderHeight();
for(const child of [...$('editActions').children])if(!['lessonSaveState','saveLesson'].includes(child.id))menuBody.append(child);
$('editActions').prepend(menu);menuBody.addEventListener('click',e=>{if(e.target.closest('button,a,label'))queueMicrotask(()=>{menu.open=false})});
function control(id,text,fn){const b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;b.onclick=fn;(id==='workInfo'||id==='workNotes'||id==='workSequence'||id==='workStudent'?secondaryActions:primaryActions).append(b);return b}
function toggle(id,text,cls){const target=id==='workInfo'?$('lessonPlan'):document.querySelector(id==='workNotes'?'.right':'.left');if(!target.id)target.id=id+'Panel';const refresh=()=>b.setAttribute('aria-expanded',String(getComputedStyle(target).display!=='none'));const b=control(id,text,()=>{document.body.classList.toggle(cls);refresh()});b.setAttribute('aria-controls',target.id);refresh();window.addEventListener('resize',refresh);return b}
toggle('workInfo','수업 정보','show-work-info');toggle('workNotes','진행 메모','show-work-notes');toggle('workSequence','자료 순서','hide-work-sequence');
const student=control('workStudent','학생 화면',()=>engineButton('canvasStudentOpen'));student.hidden=true;
const redo=control('workRedo','↷',()=>engineButton('redo'));redo.setAttribute('aria-label','다시 실행');const undo=control('workUndo','↶',()=>engineButton('undo'));undo.setAttribute('aria-label','실행 취소');
const exportButton=control('workExport','내보내기',()=>{const child=$('editorFrame')?.contentWindow;if(child?.GulliverCanvasShell)child.GulliverCanvasShell.activate('export');else openExports(child)});
const saveState=$('lessonSaveState');if(saveState)actions.insertBefore(saveState,actions.firstChild);
const preview=$('previewStep');actions.append(preview);
const saveState=$('lessonSaveState');primaryActions.replaceChildren(saveState,undo,redo,exportButton,$('editActions'),$('startLesson'),$('exitRun'),$('fullScreen'),$('musicHost'),preview);secondaryActions.replaceChildren($('workSequence'),$('workNotes'),$('workInfo'),student);
const exportDialog=document.createElement('dialog');exportDialog.id='workExportDialog';document.body.append(exportDialog);
function openExports(child){const doc=child?.document,ids=['saveHwpx','saveDocx','savePdf','exportPptx','printDeck','print','exportSvg','exportPng'];exportDialog.replaceChildren();const heading=document.createElement('h2');heading.textContent='자료 내보내기';exportDialog.append(heading);for(const id of ids){const source=doc?.getElementById(id);if(!source)continue;const b=document.createElement('button');b.type='button';b.textContent=source.textContent;b.disabled=source.disabled;b.onclick=()=>{source.click();exportDialog.close()};exportDialog.append(b)}const original=document.createElement('button');original.type='button';original.textContent='전체 작업 원본';original.onclick=()=>{$('backupLesson').click();exportDialog.close()};exportDialog.append(original);const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>exportDialog.close();exportDialog.append(close);exportDialog.showModal()}
function engineButton(id){$('editorFrame')?.contentDocument?.getElementById(id)?.click()}
function bind(frame,adapter){
 const doc=frame.contentDocument;doc.body.classList.add('common-work-embedded');
 // The project title lives in the host and remains the single visible title.
 const local=doc.getElementById('designTitle');if(local)local.setAttribute('aria-label','현재 자료 이름');
 function update(){undo.disabled=!doc.getElementById('undo')||doc.getElementById('undo').disabled;redo.disabled=!doc.getElementById('redo')||doc.getElementById('redo').disabled;exportButton.disabled=false}
 student.hidden=!doc.getElementById('canvasStudentOpen');
 update();const observer=new MutationObserver(update);observer.observe(doc.body,{subtree:true,attributes:true,attributeFilter:['disabled']});
 frame.addEventListener('load',()=>observer.disconnect(),{once:true});adapter.resizePresentation?.();
}
window.GulliverWorkSurface={bind};
const nativeRender=()=>{const frame=$('editorFrame');undo.hidden=redo.hidden=!frame;exportButton.textContent=frame?'내보내기':'원본 내보내기'};
new MutationObserver(nativeRender).observe($('stage'),{childList:true});nativeRender();
})();
