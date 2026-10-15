/* Editable teacher-material converters for the single Gulliver canvas.
   Live games/timers remain in their original tools; these are static editable snapshots. */
(function(root,factory){
 'use strict';
 const api=factory(root.GulliverUnifiedCore||(typeof require==='function'?require('./studio-unified-core.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverTeacherCanvas=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 if(!C)throw Error('통합 캔버스 엔진이 필요해요.');
 const limit=(v,max)=>String(v??'').trim().slice(0,max);
 const safeColor=(v,fallback)=>/^#[0-9a-fA-F]{6}$/.test(v||'')?v:fallback;
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||min));
 function drawing(layout){
  if(!C.LAYOUTS[layout])throw Error('캔버스 크기를 먼저 선택해 주세요.');
  const {w,h}=C.LAYOUTS[layout];
  const rect=(x,y,width,height,fill='#ffffff',stroke='#E2E8F0')=>C.element('rect',{
   x:Math.round(x),y:Math.round(y),w:Math.max(10,Math.round(width)),h:Math.max(10,Math.round(height)),
   fill:safeColor(fill,'#ffffff'),stroke:safeColor(stroke,'#E2E8F0')
  });
  const text=(content,x,y,width,height,size=28,fill='#23344F',align='center')=>C.element('text',{
   x:Math.round(x),y:Math.round(y),w:Math.max(10,Math.round(width)),h:Math.max(10,Math.round(height)),
   content:limit(content,800),fontSize:clamp(size,10,120),fill:safeColor(fill,'#23344F'),
   align:['left','center','right'].includes(align)?align:'center'
  });
  const page=(name,els,background='#FFFFFF')=>C.makePage(limit(name,60),els,safeColor(background,'#FFFFFF'));
  return{w,h,rect,text,page};
 }
 function header(d,title,subtitle,color='#F2EDFF'){
  const{w,h,rect,text}=d;
  return [
   rect(0,0,w,h*.17,color,color),
   text(title,w*.055,h*.03,w*.89,h*.084,Math.min(51,w*.058),'#28334D','left'),
   text(subtitle,w*.06,h*.112,w*.87,h*.036,Math.min(21,w*.026),'#52617C','left')
  ];
 }
 function quizCards(cards,{layout='wide',title='우리 반 낱말카드'}={}){
  if(!Array.isArray(cards))throw Error('낱말카드 데이터가 없어요.');
  const cleaned=cards.slice(0,16).map(card=>({
   front:limit(card?.front,180),back:limit(card?.back,300)
  })).filter(card=>card.front&&card.back);
  if(!cleaned.length)throw Error('앞면과 뒷면이 들어 있는 낱말카드가 필요해요.');
  const d=drawing(layout),pages=[];
  for(const [i,card] of cleaned.entries()){
   for(const answer of [false,true]){
    const word=answer?card.back:card.front;
    const subtitle=answer?'정답 · 읽고 이야기 나누기':'문제 · 함께 생각해 보기';
    const els=[
     ...header(d,title,subtitle,answer?'#E2F8EF':'#F2EDFF'),
     d.rect(d.w*.055,d.h*.22,d.w*.89,d.h*.56,'#FFFFFF','#D5DDEE'),
     d.text(word,d.w*.09,d.h*.28,d.w*.82,d.h*.36,
       word.length>100?24:word.length>55?31:word.length>25?38:Math.min(59,d.w*.07),
       '#243652'),
     d.text((i+1)+' / '+cleaned.length,d.w*.68,d.h*.87,d.w*.2,d.h*.055,17,'#6C7892','right')
    ];
    pages.push(d.page('카드 '+(i+1)+(answer?' 답':' 문제'),els));
   }
  }
  return{title:limit(title,90)||'낱말카드',pages,layout,description:cleaned.length+'개 낱말을 문제·정답 페이지로 변환'};
 }
 function timerPlan(events,{layout='wide',title='우리 반 수업 흐름표'}={}){
  if(!Array.isArray(events))throw Error('저장한 타이머 활동이 없어요.');
  const valid=events.slice(0,18).map(item=>({
   name:limit(item?.name||item?.title,62),
   note:limit(item?.note,110),
   durationSec:clamp(item?.durationSec??item?.duration,1,7200),
   color:safeColor(item?.color,'#704FCB')
  })).filter(item=>item.name);
  if(!valid.length)throw Error('단계가 1개 이상 있는 수업 타이머가 필요해요.');
  const d=drawing(layout),pages=[],perPage=layout==='a4'?9:7,rows=Math.ceil(valid.length/perPage);
  const fmt=s=>s%60?Math.floor(s/60)+'분 '+s%60+'초':Math.floor(s/60)+'분';
  for(let block=0;block<rows;block++){
   const group=valid.slice(block*perPage,(block+1)*perPage),els=header(d,title,'시간은 원본 수업 타이머의 설정을 복사한 값이에요.','#E9F8F5');
   const top=d.h*.215,step=d.h*.645/perPage,rowHeight=step*.79;
   for(const [i,item]of group.entries()){
    const y=top+i*step;
    els.push(d.rect(d.w*.065,y,d.w*.87,rowHeight,'#FFFFFF','#D7E9E4'));
    els.push(d.rect(d.w*.065,y,d.w*.016,rowHeight,item.color,item.color));
    els.push(d.text(item.name,d.w*.098,y+rowHeight*.09,d.w*.58,rowHeight*.46,
      layout==='a4'?22:26,'#263B46','left'));
    if(item.note)els.push(d.text(item.note,d.w*.1,y+rowHeight*.57,d.w*.58,rowHeight*.3,
      13,'#77858C','left'));
    els.push(d.text(fmt(item.durationSec),d.w*.7,y+rowHeight*.12,d.w*.23,rowHeight*.62,
      19,'#226F6C','right'));
   }
   pages.push(d.page('수업 흐름 '+(block+1),els));
  }
  return{title:limit(title,90)||'우리 반 수업 흐름표',pages,layout,description:valid.length+'개 수업 단계의 인쇄·발표용 흐름표'};
 }
 function seatingPlan(config,{layout='wide',title='우리 반 자리표',students=[],seatNames=[]}={}){
  const cols=clamp(config?.cols,1,8)|0,rows=clamp(config?.rows,1,8)|0;
  if(cols*rows>48)throw Error('자리표는 최대 48개 자리까지 만들 수 있어요.');
  const d=drawing(layout),els=header(d,title,'앞쪽(칠판)에서 바라본 자리표 · 글씨와 칸을 자유롭게 옮기세요','#EEF6FF');
  els.push(d.rect(d.w*.32,d.h*.182,d.w*.36,d.h*.055,'#E5EDF9','#C7D5E9'));
  els.push(d.text('칠판',d.w*.35,d.h*.187,d.w*.3,d.h*.04,17,'#4C6589'));
  const x0=d.w*.06,y0=d.h*.255,totalW=d.w*.88,totalH=d.h*.56;
  const cellW=totalW/cols,cellH=totalH/rows,gap=Math.min(9,cellW*.065,cellH*.1);
  for(let i=0;i<cols*rows;i++){
   const x=x0+(i%cols)*cellW+gap/2,y=y0+Math.floor(i/cols)*cellH+gap/2;
   els.push(d.rect(x,y,cellW-gap,cellH-gap,'#FFFFFF','#BFD1E9'));
   const name=limit(seatNames[i],25)||('자리 '+(i+1));
   els.push(d.text(name,x+4,y+5,cellW-gap-8,cellH-gap-10,
    name.length>8?14:Math.min(24,Math.max(12,cellW*.23)), '#27446D'));
  }
  const names=(Array.isArray(students)?students:[]).map(item=>limit(typeof item==='string'?item:item?.name,24)).filter(Boolean);
  if(names.length){
   els.push(d.text('우리 반: '+names.slice(0,24).join(' · '),d.w*.07,d.h*.852,d.w*.86,d.h*.085,
    12,'#667890','left'));
  }
  return{title:limit(title,90)||'우리 반 자리표',pages:[d.page('자리표',els)],layout,
   description:seatNames.some(Boolean)?'저장된 자리 배정 결과를 옮긴 자리표':'자리 배정을 임의로 만들지 않은 편집용 빈 자리표'};
 }
 function checklist({theme='우리 반 체크판',students=[],checks=[]},{layout='wide',title}={}){
  const names=(Array.isArray(students)?students:[]).slice(0,60).map(name=>limit(name,28)).filter(Boolean);
  if(!names.length)throw Error('체크판을 만들려면 학생 이름이 필요해요.');
  const d=drawing(layout),pages=[],perPage=layout==='a4'?14:10;
  for(let start=0;start<names.length;start+=perPage){
   const subset=names.slice(start,start+perPage),els=header(d,title||theme,'현재 저장 상태의 복사본 · 이 캔버스에서 자유롭게 수정','#FFF5E8');
   const step=d.h*.66/perPage,top=d.h*.205;
   for(let j=0;j<subset.length;j++){
    const idx=start+j,y=top+j*step;
    els.push(d.rect(d.w*.07,y,d.w*.86,step*.83,j%2?'#F9FBFF':'#FFFFFF','#E1E7EF'));
    els.push(d.text(subset[j],d.w*.11,y+step*.12,d.w*.56,step*.56,21,'#33445C','left'));
    els.push(d.text(checks[idx]?'✓':'□',d.w*.75,y+step*.11,d.w*.13,step*.58,23,
      checks[idx]?'#13856B':'#8592A5'));
   }
   pages.push(d.page('체크판 '+(pages.length+1),els));
  }
  return{title:limit(title||theme,90)||'학급 체크판',pages,layout,description:names.length+'명의 체크 상태를 편집 가능한 페이지로 복사'};
 }
 function convertActivity(activity,options={}){
  if(!activity||activity.archived||!activity.payload)throw Error('저장한 활동을 선택해 주세요.');
  const title=limit(activity.title,90),layout=options.layout||'wide';
  if(activity.kind==='quiz')return quizCards(activity.payload.cards,{layout,title});
  if(activity.kind==='timer')return timerPlan(activity.payload.events,{layout,title});
  if(activity.kind==='seating')return seatingPlan(activity.payload,{...options,layout,title});
  throw Error('이 활동은 아직 캔버스 자료로 변환할 수 없어요.');
 }
 return{quizCards,timerPlan,seatingPlan,checklist,convertActivity};
});
