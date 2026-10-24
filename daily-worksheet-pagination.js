(function a4Pagination(){
'use strict';
const MM_PX=96/25.4;
let lastResult={ok:false,pages:0,issue:''};
const $=id=>document.getElementById(id);
function resolve(){return {source:$('questionSheet'),questions:$('questions'),stack:document.querySelector('.paper-stack')}}
function makePage(index,original){
 const article=document.createElement('article');
 article.className='paper print-paper';
 article.dataset.page=String(index+1);
 const topline=original.querySelector('.paper-topline')?.cloneNode(true);
 if(topline){
  if(index>0){const tag=topline.querySelector('span');if(tag)tag.textContent='문제지 이어서 · '+(index+1)+'쪽';}
  article.append(topline);
 }
 if(index===0){
  for(const selector of ['.answer-heading','#paperStandard','.student-line','#paperInstruction']){
   const node=original.querySelector(selector);
   if(node&&!node.hidden)article.append(node.cloneNode(true));
  }
 }else{
  const title=document.createElement('h2');title.className='print-continuation-title';
  title.textContent=($('paperTitle')?.textContent||'문제지')+' · 계속';article.append(title);
 }
 const list=document.createElement('ol');
 list.className='print-question-list '+($('questions')?.className||'');
 list.start=1;
 article.append(list);
 const footer=document.createElement('footer');footer.className='print-page-footer';
 article.append(footer);
 return {article,list,count:0};
}
function canFit(page){
 const r=page.article.getBoundingClientRect();
 // Reserve the footer and printer tolerance, including fractional CSS pixel rounding.
 const footerTop=r.bottom-11*MM_PX;
 const last=page.list.lastElementChild;
 return page.article.scrollHeight<=page.article.clientHeight+1 &&
   (!last||last.getBoundingClientRect().bottom<=footerTop+0.5);
}
function put(page,items){
 const clones=items.map(({node,index})=>{
  const clone=node.cloneNode(true);clone.value=index+1;clone.dataset.question=String(index+1);
  clone.classList.remove('reading-next-page');
  // Standards mappings and research process belong in teacher controls, not the child's worksheet.
  if(!document.body.classList.contains('print-answers'))clone.querySelectorAll('.answer-source,.reading-standard').forEach(el=>el.remove());
  return clone;
 });
 page.list.append(...clones);
 if(canFit(page)){page.count+=clones.length;return true}
 clones.forEach(n=>n.remove());
 return false;
}
function widenShortSheet(page){
 // Short, self-contained tasks should fill the paper with room for working.
 // Long passages, sources, illustrations and crowded teacher keys stay natural-sized.
 const items=[...page.list.children],total=items.length;
 if(total<1||total>10||items.some(item=>
   item.querySelector('.reading-text,.history-photo,svg,.history-match,.order-choices')||
   item.classList.contains('reading-question')||item.classList.contains('history-question')
 ))return;
 const list=page.list;
 const calculation=list.classList.contains('calculation-grid');
 const grid=calculation||list.classList.contains('compact-questions');
 page.article.classList.add('roomy-page');
 if(calculation&&total<=10)page.article.classList.add('roomy-calculations');
 // Determine the available writing area from the actual page, including headers.
 const top=list.getBoundingClientRect().top;
 const bottom=page.article.getBoundingClientRect().bottom-17*MM_PX;
 const rows=grid?Math.ceil(total/(calculation&&total>10?4:2)):total;
 const available=bottom-top;
 // Use most of the page, but retain comfortable gutters and bottom margin.
 const height=Math.floor(available*.89/rows);
 if(height<40){page.article.classList.remove('roomy-page','roomy-calculations');return}
 page.article.style.setProperty('--roomy-row-height',height+'px');
 if(!canFit(page)){
  // Never trade correct A4 printing for a full-looking page.
  page.article.classList.remove('roomy-page','roomy-calculations');
  page.article.style.removeProperty('--roomy-row-height');
 }
}
function pack(host,units,source){
 const pages=[];let page;
 const newPage=()=>{page=makePage(pages.length,source);pages.push(page);host.append(page.article);return page};
 newPage();
 function putSingle(entry){
  if(put(page,[entry]))return true;
  if(page.count){newPage();if(put(page,[entry]))return true}
  // An individual question should almost always fit on a fresh A4 sheet.
  // Apply a small typography reduction as a last resort, never clip content.
  for(const zoom of [.94,.88,.82,.76]){
   const cloned=entry.node.cloneNode(true);cloned.style.zoom=String(zoom);
   if(put(page,[{node:cloned,index:entry.index}]))return true;
  }
  return false;
 }
 for(const unit of units){
  if(put(page,unit))continue;
  if(page.count){newPage();if(put(page,unit))continue}
  // Long reading sets may span sheets, but a passage and each individual
  // question are kept intact. Other units are a single question.
  for(const entry of unit)if(!putSingle(entry))return {ok:false,issue:`${entry.index+1}번 문제가 A4 한 장보다 길어요. 지문이나 글자 크기를 조정해 주세요.`,pages:pages.length};
 }
 for(const [i,p] of pages.entries()){
  widenShortSheet(p);
  p.article.dataset.page=String(i+1);
  p.article.querySelector('.print-page-footer').textContent=($('sheetNumber')?.textContent||'문제지')+' · '+(i+1)+' / '+pages.length+'쪽';
 }
 return {ok:true,pages:pages.length,issue:''};
}
function groupItems(list){
 const li=[...list.children],units=[];let i=0;
 while(i<li.length){
  const first=li[i],group=[{node:first,index:i}],grouped=first.classList.contains('reading-start');
  if(grouped){
   let j=i+1;
   while(j<li.length&&li[j].classList.contains('reading-question')&&!li[j].classList.contains('reading-start')){
    group.push({node:li[j],index:j});j++;
   }
   i=j;
  }else i++;
  units.push(group);
 }
 return units;
}
function compose(){
 const {source,questions,stack}=resolve();
 if(!source||!questions||!stack)return {ok:false,issue:'문제지 화면을 찾을 수 없습니다.',pages:0};
 let host=$('printPages');
 if(!host){host=document.createElement('div');host.id='printPages';host.className='print-pages';host.setAttribute('aria-hidden','true');stack.append(host);}
 host.replaceChildren();
 host.classList.add('is-measuring');
 const units=groupItems(questions);
 try{
  lastResult=pack(host,units,source);
  if(!lastResult.ok){host.replaceChildren();}
  return lastResult;
 }finally{host.classList.remove('is-measuring')}
}
const api=Object.freeze({compose,getResult:()=>({...lastResult})});
if(typeof window!=='undefined')window.DailyWorksheetA4=api;
})();
