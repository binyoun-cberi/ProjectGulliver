/* Shared question data, roster assignments, and public-only activity content. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverActivityClassroom=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const LIMIT=120,MODES=['groups','seating','roles'];
 const text=(value,max=100)=>String(value??'').trim().slice(0,max);
 const integer=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.floor(Number(value)))):fallback;
 function cards(raw){
  if(!Array.isArray(raw)||raw.length>60)throw Error('문항은 최대 60개까지 넣을 수 있어요.');
  return raw.map(item=>{if(!item||typeof item!=='object')throw Error('문제와 정답을 확인해 주세요.');
   const front=text(item.front||item.question,350),back=text(item.back||item.answer,350);
   if(!front||!back)throw Error('문제와 정답을 모두 입력해 주세요.');return{front,back};});
 }
 function parseCards(raw){return cards(String(raw??'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(line=>{
  const at=line.indexOf('|');if(at<0)throw Error('문제와 정답은 | 로 나눠 주세요.');return{front:line.slice(0,at),back:line.slice(at+1)};
 }));}
 function students(raw){
  if(!Array.isArray(raw)||raw.length>LIMIT)throw Error('학생은 최대 120명까지 넣을 수 있어요.');
  const ids=new Set();return raw.map(s=>{const id=text(s?.id,90),name=text(s?.name,40);
   if(!id||!name||ids.has(id))throw Error('학생 이름과 중복 ID를 확인해 주세요.');ids.add(id);return{id,name};});
 }
 function studentsFromText(raw,previous=[]){
  const pool=previous.slice(),names=String(raw??'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  return students(names.map((name,i)=>{const index=pool.findIndex(s=>s.name===name),old=index<0?null:pool.splice(index,1)[0];return{id:old?.id||'manual-'+Date.now().toString(36)+'-'+i,name};}));
 }
 function cleanQuiz(raw){const list=cards(raw.cards||[]);return{cards:list,index:integer(raw.index,0,Math.max(0,list.length-1),0),revealed:raw.revealed===true};}
 function cleanAssignment(raw){
  const list=students(raw.students||[]),ids=new Set(list.map(s=>s.id)),used=new Set();
  if(raw.result!==undefined&&(!Array.isArray(raw.result)||raw.result.length>144))throw Error('배정 결과를 확인해 주세요.');
  const result=(raw.result||[]).map(row=>{if(!Array.isArray(row?.memberIds)||row.memberIds.length>LIMIT)throw Error('배정 결과의 학생을 확인해 주세요.');
   const memberIds=row.memberIds.map(id=>{id=String(id);if(!ids.has(id)||used.has(id))throw Error('배정 결과에 없거나 중복된 학생이 있어요.');used.add(id);return id;});
   return{label:text(row.label,60),memberIds};});
  if(result.length&&used.size!==list.length)throw Error('배정 결과에 빠진 학생이 있어요.');
  return{mode:MODES.includes(raw.mode)?raw.mode:'groups',students:list,groupSize:integer(raw.groupSize,1,20,4),cols:integer(raw.cols,1,12,5),
   roleNames:(Array.isArray(raw.roleNames)?raw.roleNames:['발표','기록','정리','준비']).slice(0,60).map(s=>text(s,40)).filter(Boolean),
   result,resultPage:integer(raw.resultPage,0,Math.max(0,Math.ceil(result.length/6)-1),0),published:raw.published===true&&result.length>0,
   source:text(raw.source,100)};
 }
 function assign(raw,random=Math.random){
  const a=cleanAssignment(raw);if(!a.students.length)throw Error('우리 반 명단을 불러오거나 학생 이름을 입력해 주세요.');
  if(a.mode==='roles'&&!a.roleNames.length)throw Error('역할을 한 개 이상 입력해 주세요.');
  const shuffled=a.students.map(s=>s.id);for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  let result=[];
  if(a.mode==='groups')for(let i=0;i<shuffled.length;i+=a.groupSize)result.push({label:(result.length+1)+'모둠',memberIds:shuffled.slice(i,i+a.groupSize)});
  else if(a.mode==='seating')result=Array.from({length:Math.ceil(shuffled.length/a.cols)*a.cols},(_,i)=>({label:Math.floor(i/a.cols)+1+'열 '+(i%a.cols+1)+'번',memberIds:shuffled[i]?[shuffled[i]]:[]}));
  else{result=a.roleNames.map(label=>({label,memberIds:[]}));shuffled.forEach((id,i)=>result[i%result.length].memberIds.push(id));}
  return{...a,result,resultPage:0,published:false,source:'캔버스 무작위 배정'};
 }
 function control(a,action){
  if(a.kind==='quiz'){
   if(action==='next'||action==='previous')return{...a,index:Math.max(0,Math.min(a.cards.length-1,a.index+(action==='next'?1:-1))),revealed:false};
   if(action==='reveal')return{...a,revealed:!a.revealed};if(action==='reset')return{...a,index:0,revealed:false};
  }
  if(a.kind==='assignment'){
   if(action==='assign')return{...a,...assign(a)};
   if(action==='publish')return{...a,published:!a.published&&a.result.length>0};
   if(action==='next'||action==='previous')return{...a,resultPage:Math.max(0,Math.min(Math.ceil(a.result.length/6)-1,a.resultPage+(action==='next'?1:-1)))};
  }return a;
 }
 function publicContent(a){
  if(a.kind==='quiz'){const card=a.cards[a.index];return{title:a.title,caption:card?`${a.index+1} / ${a.cards.length} · ${a.revealed?'정답':'문제'}`:'문항을 준비하고 있어요',text:card?(a.revealed?card.back:card.front):'잠시 기다려 주세요.'};}
  if(a.kind==='assignment'){
   if(!a.published||!a.result.length)return{title:a.title,caption:'배정 결과 공개 전',text:'선생님이 결과를 준비하고 있어요.'};
   const names=new Map(a.students.map(s=>[s.id,s.name]));const all=a.mode==='seating';
   return{title:a.title,caption:all?'▲ 교실 앞쪽':`${a.resultPage+1} / ${Math.ceil(a.result.length/6)}쪽`,cols:all?a.cols:undefined,
    rows:(all?a.result:a.result.slice(a.resultPage*6,a.resultPage*6+6)).map(row=>({label:row.label,names:row.memberIds.map(id=>names.get(id))}))};
  }return null;
 }
 // Public display commands are reused by DOM, SVG export and video rendering.
 function visual(a,w,h){
  const data=publicContent(a);if(!data)return[];const out=[],put=(type,props)=>out.push({type,...props});
  put('text',{x:w/2,y:54,size:13,text:data.caption,fill:'#64748b',align:'center'});
  if(!data.rows){const size=Math.min(a.kind==='quiz'?38:22,w/12,(h-70)/4),chars=Math.max(1,Math.floor((w-32)/size));let lines=[];
   for(const line of data.text.split('\n')){if(!line)lines.push('');else for(let i=0;i<line.length;i+=chars)lines.push(line.slice(i,i+chars));}
   const max=Math.max(1,Math.floor((h-80)/(size*1.35)));lines=lines.slice(0,max);lines.forEach((line,i)=>put('text',{x:w/2,y:85+i*size*1.35,size,text:line,fill:'#17283f',align:'center'}));
  }else{const cols=data.cols||2,rows=Math.ceil(data.rows.length/cols),cw=(w-32)/cols,ch=Math.max(1,h-76)/Math.max(1,rows);
   data.rows.forEach((row,i)=>{const x=16+(i%cols)*cw,y=68+Math.floor(i/cols)*ch;put('rect',{x:x+2,y:y+2,w:Math.max(1,cw-4),h:Math.max(1,ch-4),fill:'#f1f5f9'});
    const labelSize=Math.max(5,Math.min(13,ch/4));let nameSize=Math.max(6,Math.min(21,cw/7,ch/3));
    put('text',{x:x+cw/2,y:y+ch*.2,size:labelSize,text:row.label,fill:'#64748b',align:'center'});
    const wrap=size=>{const chars=Math.max(1,Math.floor((cw-16)/size)),lines=[];let line='';for(const name of row.names.length?row.names:['빈자리']){const combined=line?line+' · '+name:name;if(combined.length<=chars)line=combined;else{if(line)lines.push(line);line=name}}if(line)lines.push(line);return lines};
    let lines=wrap(nameSize);while(nameSize>6&&lines.length*nameSize*1.3>ch*.66){nameSize--;lines=wrap(nameSize)}
    const max=Math.max(1,Math.floor(ch*.66/(nameSize*1.3)));if(lines.length>max){lines=lines.slice(0,max);lines[max-1]+='…'}
    lines.forEach((line,j)=>put('text',{x:x+cw/2,y:y+ch*.4+j*nameSize*1.3,size:nameSize,text:line,fill:'#17283f',align:'center'}));
   });}
  return out;
 }
 function fromSnapshot(s){
  let mode=s.kind,result=[],list=[];
  if(['groups','roles','bus'].includes(mode)&&!s.confirmed)throw Error('원본 도구에서 배정 결과를 먼저 확정해 주세요.');
  if(mode==='groups'){list=(s.groups||[]).flat();result=(s.groups||[]).map((g,i)=>({label:(i+1)+'모둠',memberIds:g.map(s=>String(s.id))}));}
  else if(mode==='roles'){list=s.students||[];result=(s.roles||[]).map(r=>({label:r.name,memberIds:list.filter(p=>String(s.assignment?.[p.id])===String(r.id)).map(p=>String(p.id))}));}
  else if(mode==='seating'){list=s.students||[];const seats=s.assignment||[];if(!seats.some(Boolean))throw Error('원본 도구에서 자리를 먼저 배정해 주세요.');result=seats.map((id,i)=>({label:Math.floor(i/s.cols)+1+'열 '+(i%s.cols+1)+'번',memberIds:id?[String(id)]:[]}));}
  else throw Error('이 결과는 아직 활동 요소로 가져올 수 없어요.');
  if(!list.length||!result.length)throw Error('배정 결과가 없어요. 원본 도구에서 결과를 만들어 주세요.');
  return{kind:'assignment',title:({groups:'우리 반 모둠',roles:'우리 반 역할',seating:'우리 반 자리'})[mode],...cleanAssignment({mode,students:list,result,cols:s.cols,published:false,source:'기존 도구 배정 결과 · 다시 배정은 조건 없는 무작위'})};
 }
 return{cards,parseCards,students,studentsFromText,cleanQuiz,cleanAssignment,assign,control,publicContent,visual,fromSnapshot};
});
