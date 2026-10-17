/* Convert genuine classroom notice and confirmed roster assignments to editable pages. */
(function(root,factory){
 const api=factory(root.GulliverUnifiedCore||(typeof require==='function'?require('./studio-unified-core.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverTeacherNext=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 if(!C)throw Error('편집 가능한 캔버스 엔진이 필요해요.');
 const clean=(s,max=100)=>String(s??'').trim().slice(0,max);
 const cap=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||min));
 const hex=(value,fallback)=>/^#[0-9a-fA-F]{6}$/.test(value||'')?value:fallback;
 function board(layout,title,subtitle,color){
  const bounds=C.LAYOUTS[layout];if(!bounds)throw Error('지원하지 않는 캔버스 크기예요.');
  const w=bounds.w,h=bounds.h;
  const text=(value,x,y,wi,he,size=22,tint='#24344F',align='left')=>C.element('text',{
   x:Math.round(x),y:Math.round(y),w:Math.max(10,Math.round(wi)),h:Math.max(10,Math.round(he)),
   content:clean(value,800),fontSize:cap(size,10,105),fill:hex(tint,'#24344F'),align});
  const rect=(x,y,wi,he,fill='#FFFFFF',stroke=fill)=>C.element('rect',{
   x:Math.round(x),y:Math.round(y),w:Math.max(10,Math.round(wi)),h:Math.max(10,Math.round(he)),fill:hex(fill,'#FFFFFF'),stroke:hex(stroke,fill)});
  const base=[rect(0,0,w,h*.17,color),text(title,w*.06,h*.035,w*.88,h*.085,Math.min(51,w*.055)),text(subtitle,w*.06,h*.12,w*.88,h*.04,16,'#53647C')];
  return{w,h,text,rect,base,page:(name,els,bg='#FFFFFF')=>C.makePage(name,els,bg)};
 }
 function lesson(snapshot,{layout='wide'}={}){
  if(snapshot?.kind!=='lesson')throw Error('수업 알리미를 먼저 실행해 주세요.');
  const subject=clean(snapshot.subject,28),unit=clean(snapshot.unit,120),book=clean(snapshot.page,75),
    topic=clean(snapshot.topic,160),objective=clean(snapshot.objective,420),wrapup=clean(snapshot.wrapup,180);
  const activities=[snapshot.act1,snapshot.act2,snapshot.act3].map(x=>clean(x,200)).filter(Boolean);
  if(snapshot.sampleOnly)throw Error('지금은 예시 수업이에요. 원본 알리미에서 수업 내용 중 하나 이상을 수정해 주세요.');
  if(!topic||!objective)throw Error('수업 주제와 학습 목표를 입력해 주세요.');
  const tint={'국어':'#F2EAFF','수학':'#E8F4FF','사회':'#E9F9EE','과학':'#ECEBFF','체육':'#FFF0EB','음악':'#FFF0F7','미술':'#FFF3F6','영어':'#E8F9FA'}[subject]||'#ECF3FF';
  const d=board(layout,topic,(subject||'우리 수업')+'  ·  '+(unit||'수업 안내'),tint),{w,h,rect,text}=d,els=[...d.base];
  if(book)els.push(text(book,w*.65,h*.13,w*.29,h*.035,14,'#53647C','right'));
  const top=h*.22;
  els.push(rect(w*.065,top,w*.87,h*.185,'#F0F6FE','#CFE0F4'));
  els.push(text('오늘의 학습 목표',w*.09,top+h*.025,w*.8,h*.047,18,'#315A82'));
  els.push(text(objective,w*.095,top+h*.08,w*.81,h*.09,objective.length>90?19:26,'#223A59'));
  const activitiesTop=h*.447,blockGap=w*.018,blockW=(w*.87-blockGap*2)/3,blockH=h*.265;
  for(let i=0;i<3;i++){
   const x=w*.065+i*(blockW+blockGap),name=activities[i]||'';
   els.push(rect(x,activitiesTop,blockW,blockH,'#FFFFFF','#DEE6F1'));
   els.push(text('활동 '+(i+1),x+13,activitiesTop+h*.023,blockW-26,h*.05,17,'#62759C'));
   if(name)els.push(text(name,x+13,activitiesTop+h*.085,blockW-26,h*.145,name.length>40?18:22,'#263954'));
  }
  els.push(rect(w*.065,h*.755,w*.87,h*.12,'#FFF6E8','#F1DEC1'));
  els.push(text('마무리',w*.09,h*.768,w*.2,h*.043,16,'#886142'));
  els.push(text(wrapup||'오늘 배운 내용 나누기',w*.26,h*.773,w*.66,h*.074,21,'#674A35'));
  return{title:topic,layout,pages:[d.page('이번 수업 알리미',els)],description:'학습 주제·목표·활동이 각각 수정 가능한 안내판 1장'};
 }
 function roles(snapshot,{layout='wide'}={}){
  if(snapshot?.kind!=='roles')throw Error('학급 역할 배정 도구를 먼저 실행해 주세요.');
  if(!snapshot.confirmed)throw Error('학급 역할 배정 도구에서 결과를 만든 뒤 ‘이번 역할 확정’을 눌러 주세요.');
  const students=Array.isArray(snapshot.students)?snapshot.students:[];
  const roleDefs=Array.isArray(snapshot.roles)?snapshot.roles:[];
  if(!students.length||!roleDefs.length||students.length>120||roleDefs.length>60)throw Error('학생 또는 역할 목록을 확인해 주세요. 최대 학생 120명·역할 60개예요.');
  const ids=new Set(students.map(s=>String(s.id)));
  if(ids.size!==students.length||students.some(s=>!clean(s.name,40)))throw Error('학생 이름과 중복 여부를 확인해 주세요.');
  const assignments=snapshot.assignment||{},defs=new Map(roleDefs.map(r=>[String(r.id),clean(r.name,40)]));
  if(Object.keys(assignments).length!==students.length||students.some(s=>!defs.has(String(assignments[s.id]))))throw Error('확정한 배정에서 일부 학생·역할을 찾지 못했어요.');
  const groups=roleDefs.map(r=>({name:clean(r.name,40),names:students.filter(s=>String(assignments[s.id])===String(r.id)).map(s=>clean(s.name,40))})).filter(r=>r.names.length);
  const perPage=layout==='a4'?7:5,pages=[],d=board(layout,'우리 반 역할표','확정된 역할 배정 · 학생 희망·제외 조건은 넣지 않아요','#F1F0FF');
  const {w,h,rect,text}=d;
  for(let off=0;off<groups.length;off+=perPage){
   const chunk=groups.slice(off,off+perPage),els=[...d.base],step=h*.67/perPage;
   for(const [j,entry]of chunk.entries()){
    const y=h*.215+j*step;
    els.push(rect(w*.065,y,w*.87,step*.86,j%2?'#F7F9FD':'#FFFFFF','#DBE2EF'));
    els.push(text(entry.name,w*.09,y+step*.1,w*.25,step*.6,entry.name.length>15?16:21,'#4B3C89'));
    const names=entry.names.join('  ·  ');
    els.push(text(names,w*.35,y+step*.12,w*.56,step*.6,names.length>68?14:names.length>40?17:21,'#26364F'));
   }
   pages.push(d.page('역할표 '+(pages.length+1),els));
  }
  return{title:'우리 반 역할표',layout,pages,description:students.length+'명의 확정된 역할표 '+pages.length+'장'};
 }
 function groups(snapshot,{layout='wide'}={}){
  if(snapshot?.kind!=='groups')throw Error('모둠 만들기 도구를 먼저 실행해 주세요.');
  if(!snapshot.confirmed)throw Error('모둠을 모두 공개한 뒤 ‘이번 모둠 확정’을 눌러 주세요.');
  const list=Array.isArray(snapshot.groups)?snapshot.groups:[];
  if(!list.length||list.length>40)throw Error('확정된 모둠 목록을 확인해 주세요. 최대 40개 모둠이에요.');
  const used=new Set(),cleaned=list.map((members,i)=>{
   if(!Array.isArray(members)||!members.length||members.length>20)throw Error((i+1)+'모둠의 인원 정보를 확인해 주세요.');
   return members.map(student=>{
    const id=String(student?.id||''),name=clean(student?.name,36);
    if(!id||!name||used.has(id))throw Error('모둠에서 학생이 빠졌거나 중복됐어요.');
    used.add(id);return name;
   });
  });
  const perPage=layout==='a4'?5:4,pages=[],d=board(layout,'우리 반 모둠표','확정된 학생 명단 · 각 모둠을 자유롭게 편집할 수 있어요','#E6F8F2');
  const {w,h,text,rect}=d;
  for(let off=0;off<cleaned.length;off+=perPage){
   const slice=cleaned.slice(off,off+perPage),els=[...d.base],rows=Math.ceil(slice.length/2);
   const gap=w*.025,x0=w*.065,y0=h*.225,cardW=(w*.87-gap)/2,cardH=(h*.655-(rows-1)*gap)/rows;
   for(let i=0;i<slice.length;i++){
    const x=x0+(i%2)*(cardW+gap),y=y0+Math.floor(i/2)*(cardH+gap),members=slice[i],number=off+i+1;
    els.push(rect(x,y,cardW,cardH,'#FFFFFF','#CDE5D9'));
    els.push(rect(x,y,cardW,cardH*.235,'#EAF8F0','#EAF8F0'));
    els.push(text(number+'모둠',x+15,y+cardH*.035,cardW-30,cardH*.16,22,'#12654A'));
    const names=members.join('  ·  ');
    els.push(text(names,x+18,y+cardH*.3,cardW-36,cardH*.61,names.length>48?16:names.length>26?20:24,'#30445B'));
   }
   pages.push(d.page('모둠표 '+(pages.length+1),els));
  }
  return{title:'우리 반 모둠표',layout,pages,description:used.size+'명의 확정된 모둠표 '+pages.length+'장'};
 }
 function bus(snapshot,{layout='wide'}={}){
  if(snapshot?.kind!=='bus')throw Error('버스 자리 배정 도구를 먼저 실행해 주세요.');
  if(!snapshot.confirmed)throw Error('버스 좌석을 만든 뒤 ‘이번 버스 자리 확정’을 눌러 주세요.');
  const students=Array.isArray(snapshot.students)?snapshot.students:[],
   seats=Array.isArray(snapshot.seats)?snapshot.seats:[],
   disabled=Array.isArray(snapshot.disabled)?snapshot.disabled:[];
  if(!students.length||students.length>40||seats.length!==40||disabled.length!==40)
   throw Error('버스 좌석 40칸과 학생 명단을 확인해 주세요.');
  const byId=new Map(students.map(st=>[String(st.id),clean(st.name,32)]));
  if(byId.size!==students.length||[...byId.values()].some(n=>!n))throw Error('학생 정보가 누락되거나 중복됐어요.');
  const taken=new Set();
  for(let i=0;i<40;i++){
   const id=seats[i];
   if(!id)continue;
   const key=String(id);
   if(disabled[i]||!byId.has(key)||taken.has(key))throw Error('확정된 자리표에 중복·없는 학생 또는 사용 불가 좌석이 있어요.');
   taken.add(key);
  }
  if(taken.size!==students.length)throw Error('일부 학생이 배정되지 않았어요. 원본에서 다시 확정해 주세요.');
  const d=board(layout,'버스 좌석 배치도','확정된 좌석 · 위쪽이 버스 앞 · 가운데는 통로','#E8F4FF');
  const {w,h,rect,text}=d,els=[...d.base];
  els.push(rect(w*.07,h*.19,w*.86,h*.055,'#DDEAF8','#C0D6EC'));
  els.push(text('버스 앞  ·  운전석',w*.2,h*.194,w*.6,h*.043,layout==='a4'?15:17,'#2B5074','center'));
  const xs=[.072,.263,.567,.758].map(x=>w*x),cellW=w*.169;
  const y0=h*.275,rowStep=h*.0605,cellH=rowStep*.86;
  els.push(rect(w*.475,y0-h*.01,w*.05,rowStep*9.95,'#F1F5F9','#F1F5F9'));
  for(let row=0;row<10;row++){
   const y=y0+row*rowStep;
   for(let col=0;col<4;col++){
    const idx=row*4+col,id=seats[idx],unusable=Boolean(disabled[idx]);
    const name=unusable?'사용 안 함':id?byId.get(String(id)):'빈자리';
    const fill=unusable?'#E9EAF0':id?'#EEF7FF':'#FFFFFF',color=unusable?'#818699':id?'#203F66':'#7B899B';
    const x=xs[col];
    els.push(rect(x,y,cellW,cellH,fill,unusable?'#D0D5DF':'#B5C9DD'));
    const label=text(name,x+4,y+2,cellW-8,cellH-3,
     name.length>9?layout==='a4'?12:11:name.length>5?layout==='a4'?15:13:layout==='a4'?19:16,color,'center');
    // Only a real occupied seat can participate in the in-canvas two-person swap.
    if(id&&!unusable)label.busSeat=idx;
    els.push(label);
   }
   if(row===3||row===5)els.push(text(row===3?'통':'로',w*.481,y,w*.038,cellH,layout==='a4'?15:12,'#64748B','center'));
  }
  els.push(text('좌석 수 '+(40-disabled.filter(Boolean).length)+'석 · 배정 '+taken.size+'명',w*.14,h*.918,w*.72,h*.038,layout==='a4'?13:16,'#52677F','center'));
  return{title:'버스 좌석 배치도',layout,pages:[d.page('버스 자리표',els)],description:'학생 '+taken.size+'명의 확정된 10열×4석 버스 자리표 · 통로와 사용 불가 좌석 보존'};
 }
 function tournament(snapshot,{layout='wide'}={}){
  if(snapshot?.kind!=='tournament')throw Error('토너먼트 메이커에서 대진표를 먼저 만들어 주세요.');
  const names=Array.isArray(snapshot.participants)?snapshot.participants:[],
   rounds=Array.isArray(snapshot.rounds)?snapshot.rounds:[];
  if(names.length<2||names.length>64||!rounds.length||rounds.length>7)
   throw Error('2~64명(팀)의 생성된 대진표가 필요해요.');
  const dict=new Map(names.map(p=>[String(p.id),clean(p.name,40)]));
  if(dict.size!==names.length||[...dict.values()].some(n=>!n))throw Error('대진표에 중복되거나 빈 참가자 정보가 있어요.');
  let count=0;
  const valid=rounds.map((r,ri)=>{
   const matches=Array.isArray(r.matches)?r.matches:[];
   if(!matches.length||matches.length>32)throw Error('대진의 경기 수가 올바르지 않아요.');
   count+=matches.length;
   return matches.map((m,mi)=>{
    const a=m.aId?String(m.aId):'',b=m.bId?String(m.bId):'',
     winner=m.winnerId?String(m.winnerId):'';
    if((a&&!dict.has(a))||(b&&!dict.has(b))||(winner&&!dict.has(winner)))
     throw Error('대진표에 존재하지 않는 참가자 또는 승자가 있어요.');
    if(winner&&!m.resolved)throw Error('승부 상태와 승자 정보가 일치하지 않아요.');
    if(winner&&winner!==a&&winner!==b)throw Error('진출자가 실제 경기 참가자와 일치하지 않아요.');
    const label=ri===rounds.length-1?'결승':clean(r.name,28)||((ri+1)+'라운드');
    return{label,index:mi+1,a:a?dict.get(a):'',b:b?dict.get(b):'',
     winner:winner?dict.get(winner):'',resolved:Boolean(m.resolved),bye:Boolean(m.resolved&&(!a||!b))};
   });
  });
  if(count>64)throw Error('경기가 64개를 넘어요. 대진표를 확인해 주세요.');
  const champion=snapshot.championId?dict.get(String(snapshot.championId)):null;
  if(snapshot.championId&&!champion)throw Error('대진표 우승자를 찾지 못했어요.');
  const title=clean(snapshot.title,60)||'우리 반 토너먼트';
  const pages=[],perPage=layout==='a4'?8:6;
  for(let ri=0;ri<valid.length;ri++){
   const matches=valid[ri];
   for(let start=0;start<matches.length;start+=perPage){
    const group=matches.slice(start,start+perPage),section=matches[0].label;
    const d=board(layout,title,section+' · '+(start+1)+'~'+(start+group.length)+'경기'+(champion?' · 우승 '+champion:' · 경기 진행 중'),'#FFF3DE');
    const {w,h,rect,text}=d,els=[...d.base],cols=2,rows=Math.ceil(group.length/2),
     gapX=w*.026,gapY=h*.035,cardW=(w*.87-gapX)/2,
     cardH=(h*.68-gapY*(rows-1))/rows;
    for(let i=0;i<group.length;i++){
     const m=group[i],x=w*.065+(i%cols)*(cardW+gapX),y=h*.225+Math.floor(i/cols)*(cardH+gapY);
     els.push(rect(x,y,cardW,cardH,'#FFFFFF','#E5D6B9'));
     els.push(text(m.label+' · '+m.index+'경기',x+10,y+cardH*.055,cardW-20,cardH*.19,16,'#93672A'));
     els.push(text((m.a||'진출자 대기')+'  :  '+(m.b|| (m.a&&m.resolved?'부전승':'진출자 대기')),
       x+10,y+cardH*.32,cardW-20,cardH*.29,
       m.a.length+m.b.length>28?14:layout==='a4'?17:19,'#2B3B52'));
     els.push(text(m.winner?('승자  '+m.winner):'결과 미정',
       x+10,y+cardH*.70,cardW-20,cardH*.21,16,m.winner?'#137A55':'#8290A4'));
    }
    pages.push(d.page(section+' '+(start/perPage+1),els));
   }
  }
  if(pages.length>40)throw Error('대진표가 캔버스 40페이지 제한을 넘어요.');
  return{title,layout,pages,description:count+'경기 · '+pages.length+'장 대진표'+(champion?' · 우승 '+champion:' · 미완료 경기는 대기로 표시')};
 }
 function convert(snapshot,options){
  if(snapshot?.kind==='lesson')return lesson(snapshot,options);
  if(snapshot?.kind==='roles')return roles(snapshot,options);
  if(snapshot?.kind==='groups')return groups(snapshot,options);
  if(snapshot?.kind==='bus')return bus(snapshot,options);
  if(snapshot?.kind==='tournament')return tournament(snapshot,options);
  throw Error('지원하지 않는 교사 도구 결과예요.');
 }
 return{lesson,roles,groups,bus,tournament,convert};
});