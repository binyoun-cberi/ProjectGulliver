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
function widenLegacyShortSheet(page){
 // Short, self-contained tasks should fill the paper with room for working.
 // Long passages, sources, illustrations and crowded teacher keys stay natural-sized.
 const items=[...page.list.children],total=items.length;
 if(page.list.matches('.column-questions,.science-evidence'))return;
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
function packGreedy(host,units,source){
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
// Contiguous partitions preserve reading sets and source order. Fit checks use actual DOM geometry.
function balancedPlan(units,fits,nearEven=false){
 const n=units.length,prefix=[0];for(const u of units)prefix.push(prefix.at(-1)+u.length);
 for(let pages=1;pages<=n;pages++){
  const target=prefix[n]/pages,dp=Array.from({length:pages+1},()=>Array(n+1).fill(null));dp[0][0]={cost:0,ends:[]};
  for(let p=1;p<=pages;p++)for(let end=p;end<=n;end++)for(let start=p-1;start<end;start++){
   const prior=dp[p-1][start];if(!prior||!fits(start,end,p===1))continue;
   const count=prefix[end]-prefix[start];if(nearEven&&(count<Math.ceil(target-1)||count>Math.floor(target+1)))continue;
   const cost=prior.cost+(count-target)**2;
   if(!dp[p][end]||cost<dp[p][end].cost)dp[p][end]={cost,ends:[...prior.ends,end]};
  }
  if(dp[pages][n]){let start=0;return dp[pages][n].ends.map(end=>{const range=[start,end];start=end;return range})}
 }
 return null;
}
function widenShortSheet(page){
 widenLegacyShortSheet(page);
 if(page.article.classList.contains('roomy-page'))return;
 const list=page.list,items=[...list.children];if(!items.length)return;
 const limit=page.article.getBoundingClientRect().bottom-17*MM_PX;
 const lastBottom=Math.max(...items.map(x=>x.getBoundingClientRect().bottom));
 const free=limit-lastBottom;if(free<24)return;
 const originals=items.map(x=>x.getAttribute('style')),listStyle=list.getAttribute('style');
 const columns=getComputedStyle(list).display==='grid';
 const rows=[];
 for(const item of items){const y=item.getBoundingClientRect().top;let row=rows.find(r=>Math.abs(r.y-y)<2);if(!row){row={y,items:[]};rows.push(row)}row.items.push(item)}
 // Add writing room, without enlarging pictures, shrinking fonts or changing the question order.
 const extra=Math.floor(free*.9/(columns?rows.length:items.length));
 if(extra<1)return;
 if(columns){const heights=rows.map(row=>Math.max(...row.items.map(item=>item.getBoundingClientRect().height))+extra);list.style.setProperty('grid-template-rows',heights.map(h=>h+'px').join(' '),'important');list.style.setProperty('grid-auto-rows','auto','important')}
 else for(const item of items){const padding=parseFloat(getComputedStyle(item).paddingBottom)||0;item.style.setProperty('padding-bottom',(padding+extra)+'px','important')}
 if(!canFit(page)){if(listStyle===null)list.removeAttribute('style');else list.setAttribute('style',listStyle);items.forEach((item,i)=>{if(originals[i]===null)item.removeAttribute('style');else item.setAttribute('style',originals[i])});return}
 page.article.classList.add('spread-page');
}
function questionsAreScience(source){return source.querySelector('#questions')?.classList.contains('science-evidence')||false}
function pack(host,originalUnits,source){
 const cache=new Map();
 function measure(entries,first){const page=makePage(first?0:1,source);host.append(page.article);const ok=put(page,entries);page.article.remove();return ok}
 // Only split a passage group if it cannot fit intact even on a continuation sheet.
 const units=originalUnits.flatMap((unit,index)=>measure(unit,false)&&(index>0||measure(unit,true))?[unit]:unit.map(entry=>[entry]));
 const fits=(start,end,first)=>{const key=[start,end,first].join(':');if(!cache.has(key))cache.set(key,measure(units.slice(start,end).flat(),first));return cache.get(key)};
 const plan=balancedPlan(units,fits,questionsAreScience(source));
 if(!plan)return packGreedy(host,originalUnits,source);
 const counts=[];
 for(const [i,[start,end]] of plan.entries()){
  const page=makePage(i,source);host.append(page.article);const entries=units.slice(start,end).flat();
  if(!put(page,entries)){host.replaceChildren();return packGreedy(host,originalUnits,source)}
  counts.push(entries.length);widenShortSheet(page);
  page.article.querySelector('.print-page-footer').textContent=($('sheetNumber')?.textContent||'문제지')+' · '+(i+1)+' / '+plan.length+'쪽';
 }
 return {ok:true,pages:plan.length,counts,issue:''};
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
if(typeof module==='object'&&module.exports)module.exports={balancedPlan};
})();



