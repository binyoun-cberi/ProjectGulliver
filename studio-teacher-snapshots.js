/* Teacher result snapshots: source applications remain the sole authority for live results.
 * Only aggregated vote counts are copied; never fabricate a winner or seat allocation. */
(function(root,factory){
 'use strict';
 const api=factory(root.GulliverUnifiedCore||(typeof require==='function'?require('./studio-unified-core.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GulliverTeacherSnapshots=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 if(!C)throw Error('공통 캔버스 엔진을 불러오지 못했어요.');
 const clean=(x,max=110)=>String(x??'').replace(/[<>]/g,'').trim().slice(0,max);
 const safeNumber=(x,min=0,max=10000)=>{const n=Number(x);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0};
 const layoutOf=(name='wide')=>{if(!C.LAYOUTS[name])throw Error('지원하지 않는 페이지 크기예요.');return C.LAYOUTS[name]};
 function basic(layout,title,subtitle,color='#F5F1FE'){
  const {w,h}=layoutOf(layout),els=[];
  const rect=(x,y,width,height,fill='#FFFFFF',stroke='#E0E2E8')=>{
   const e=C.element('rect',{x:Math.round(x),y:Math.round(y),w:Math.round(width),h:Math.round(height),fill,stroke});els.push(e);return e;
  };
  const text=(str,x,y,width,height,fontSize=26,fill='#28324B',align='center')=>{
   const e=C.element('text',{x:Math.round(x),y:Math.round(y),w:Math.round(width),h:Math.round(height),
     fontSize:Math.round(fontSize),fill,align,content:clean(str,780)});els.push(e);return e;
  };
  rect(0,0,w,h*.2,color,color);
  text(title,w*.06,h*.044,w*.88,h*.08,Math.min(48,w*.052),'#293352','left');
  text(subtitle,w*.065,h*.13,w*.86,h*.052,Math.min(19,w*.028),'#56657D','left');
  const page=(name)=>C.makePage(name,els,'#FFFFFF');
  return{w,h,els,rect,text,page};
 }
 function thermometer(raw,{layout='wide'}={}){
  if(!raw||typeof raw!=='object')throw Error('칭찬 온도계에 저장한 기록이 없어요.');
  const goal=safeNumber(raw.goalTemp,1,10000)||100,current=Math.min(goal,safeNumber(raw.currentTemp,0,goal));
  const d=basic(layout,'우리 반 칭찬 온도계','실제 저장된 온도 · 수업자료로 복사','#E7F8EF');
  d.rect(d.w*.08,d.h*.27,d.w*.84,d.h*.14,'#EFF7F4','#CFE7D8');
  if(current>0)d.rect(d.w*.08,d.h*.27,d.w*.84*(current/goal),d.h*.14,'#35AC84','#35AC84');
  d.text(current+' / '+goal+'점',d.w*.17,d.h*.275,d.w*.66,d.h*.12,Math.min(47,d.w*.06),'#234D47');
  const percentage=Math.round(current/goal*100);
  d.text('목표 달성 '+percentage+'%',d.w*.18,d.h*.45,d.w*.64,d.h*.13,Math.min(32,d.w*.04),'#215F4D');
  const records=Array.isArray(raw.records)?raw.records:[];
  const list=records.slice(0,4).map(item=>clean(item.reason||'칭찬',48)+(item.type==='up'?' +':' −')+safeNumber(item.amount,0,200)+'점');
  list.forEach((entry,i)=>d.text(entry,d.w*.09,d.h*(.63+i*.069),d.w*.82,d.h*.064,Math.min(18,d.w*.026),'#50667A','left'));
  return{layout,title:'칭찬 온도계',pages:[d.page('칭찬 온도계')],description:'기록된 온도 '+current+'/'+goal+'점'};
 }
 function vote(config,votes,{layout='wide',onlineSummary=null}={}){
  const options=onlineSummary?onlineSummary.options:config?.options;
  if(!Array.isArray(options)||!options.length)throw Error('투표 선택지가 저장되지 않았어요.');
  let counts=[];
  if(onlineSummary){
   counts=options.slice(0,12).map(x=>({name:clean(x.name,80),count:safeNumber(x.count,0,100000)}));
  }else{
   const selections=votes&&typeof votes==='object'?Object.values(votes):[];
   counts=options.slice(0,12).map(item=>({name:clean(item?.name,80),count:selections.filter(v=>String(v)===String(item.id)).length}));
  }
  const total=counts.reduce((s,x)=>s+x.count,0);
  if(!total)throw Error('집계된 투표가 없어요. 먼저 투표판에서 투표를 진행해 주세요.');
  const title=clean(onlineSummary?.title||config?.title||'우리 반 투표',90);
  const d=basic(layout,title,'선택지별 합계 '+total+'표 · 학생별 투표 내용은 포함하지 않아요','#EEF1FF');
  const per=layout==='a4'?10:7,pages=[];
  for(let offset=0;offset<counts.length;offset+=per){
   const item=offset===0?d:basic(layout,title,'선택지별 득표수 · '+total+'표','#EEF1FF');
   const group=counts.slice(offset,offset+per),step=item.h*.65/per;
   group.forEach((row,i)=>{
    const y=item.h*.255+i*step,pct=row.count/total;
    item.rect(item.w*.07,y,item.w*.87,step*.76,'#F7F8FE','#DCE4F1');
    if(row.count)item.rect(item.w*.07,y,item.w*.87*pct,step*.76,'#CAD8FA','#CAD8FA');
    item.text(row.name,item.w*.085,y+step*.06,item.w*.62,step*.63,Math.min(22,item.w*.028),'#25375B','left');
    item.text(row.count+'표 ('+Math.round(pct*100)+'%)',item.w*.73,y+step*.08,item.w*.19,step*.61,Math.min(18,item.w*.025),'#384F83','right');
   });
   pages.push(item.page('투표 결과 '+(pages.length+1)));
  }
  return{layout,title,pages,description:'개별 응답을 포함하지 않은 집계 결과 '+total+'표'};
 }
 function roulette(record,{layout='wide'}={}){
  const outcomes=Array.isArray(record?.results)?record.results.slice(0,80):[];
  if(!outcomes.length)throw Error('범퍼 룰렛의 저장된 레이스 결과가 없어요. 먼저 레이스를 완료해 주세요.');
  const pages=[],per=layout==='a4'?10:7;
  for(let offset=0;offset<outcomes.length;offset+=per){
   const d=basic(layout,'범퍼 룰렛 결과',record.completed?'최근 완료된 레이스의 실제 결과':'마지막 레이스의 부분 결과 · 미도착자 있음','#FFF1E6');
   const step=d.h*.64/per;
   outcomes.slice(offset,offset+per).forEach((item,i)=>{
    const y=d.h*.24+i*step;
    d.rect(d.w*.065,y,d.w*.87,step*.78,'#FFFFFF','#F1DCCC');
    d.text((offset+i+1)+'. '+clean(item.name,42),d.w*.087,y+step*.07,d.w*.5,step*.6,Math.min(21,d.w*.026),'#3C3C52','left');
    d.text(clean(item.result,65),d.w*.6,y+step*.07,d.w*.31,step*.6,Math.min(20,d.w*.025),'#94522C','right');
   });
   pages.push(d.page('룰렛 결과 '+(pages.length+1)));
  }
  return{layout,title:'범퍼 룰렛 결과',pages,description:outcomes.length+'명의 레이스 결과를 캔버스로 복사'};
 }
 function qr(image,encodedText,{layout='wide'}={}){
  if(!C.image(image))throw Error('생성된 QR 이미지가 없거나 이미지 크기가 커요. QR 도구에서 먼저 코드를 만들어 주세요.');
  const label=clean(encodedText,500);
  if(!label)throw Error('QR에 담긴 내용이 없어요. QR을 다시 생성해 주세요.');
  const d=basic(layout,'수업 QR 코드','QR 그림은 이동·크기 조절 가능 · 내용을 바꾸려면 QR을 다시 생성하세요','#EDF4FE');
  const size=Math.min(d.w*.59,d.h*.60,440);
  d.els.push(C.element('image',{x:Math.round((d.w-size)/2),y:Math.round(d.h*.22),w:Math.round(size),h:Math.round(size),src:image}));
  d.text(label,d.w*.075,d.h*.84,d.w*.85,d.h*.1,Math.min(18,d.w*.025),'#536580');
  return{layout,title:'수업 QR 코드',pages:[d.page('QR 코드')],description:'실제로 생성된 QR 그림과 내용을 별도 요소로 추가'};
 }
 return{thermometer,vote,roulette,qr};
});
