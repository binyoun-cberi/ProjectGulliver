(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeFourGraphs=api;})(globalThis,()=>{
'use strict';
// Original grade-four chart-reading and evidence-based chart-construction tasks.
// Diagrams contain real bars/connected plotted points, with visible units,
// labelled axes, and a consistent five-unit scale (no external survey claimed).
const banks=[];
const barCases=[
 ['우리 반이 좋아하는 과일','명',['사과','배','귤','감']],['도서관에서 읽은 책','권',['동화','과학','역사','시']],
 ['모둠이 모은 병뚜껑','개',['가','나','다','라']],['운동회 참가 학생','명',['달리기','줄넘기','공던지기','피구']],
 ['화단에서 심은 모종','개',['토마토','상추','고추','오이']],['학급에서 빌린 도서','권',['가반','나반','다반','라반']],
 ['선호하는 놀이','명',['윷놀이','딱지','보드게임','공놀이']],['분리배출한 플라스틱 병','개',['가조','나조','다조','라조']],
 ['교내 음악 활동 참여','명',['합창','악기','감상','창작']],['텃밭에서 딴 열매','개',['딸기','방울토마토','가지','고추']],
 ['주제별 읽기 기록','권',['동물','우주','역사','환경']],['체육 활동 신청','명',['수영','달리기','축구','체조']],
 ['모은 우유 팩','개',['1반','2반','3반','4반']],['방과 후 활동 신청','명',['미술','코딩','음악','체육']],
 ['학급 신문 기사 수','개',['환경','안전','과학','문화']],['학급 추천 도서 투표','명',['책가','책나','책다','책라']]
];
const lineCases=[
 ['요일별 대출 도서 수','권'],['요일별 운동장 참여 인원','명'],['요일별 모은 병뚜껑 수','개'],['요일별 독서 활동 시간','분'],
 ['요일별 식물 관찰 참가 인원','명'],['요일별 대출한 과학책','권'],['요일별 재활용 분류 물건','개'],['요일별 독서 동아리 참가 인원','명'],
 ['요일별 모은 종이컵','개'],['요일별 활동 기록 책갈피','개'],['요일별 과학 탐구 참가자','명'],['요일별 도서관 봉사 참가자','명'],
 ['요일별 만든 종이꽃','개'],['요일별 읽은 동시','편'],['요일별 모은 나뭇잎','장'],['요일별 독서 모임 참가자','명']
];
const days=['월','화','수','목','금'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const table=(title,headers,rows,note)=>({kind:'table',title,headers,rows,note:note||''});
const diagram=(title,body)=>({kind:'diagram',title,viewBox:'0 0 360 215',body});
function baseGrid(unit){
 let out='<rect x="0" y="0" width="360" height="215" rx="4" fill="white"/>';
 for(let v=0;v<=30;v+=5){
  const y=170-v*4;
  out+='<line x1="42" y1="'+y+'" x2="345" y2="'+y+'" stroke="#c6c6c6" stroke-width="0.7"/>';
  out+='<text x="34" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="#222">'+v+'</text>';
 }
 out+='<line x1="42" y1="45" x2="42" y2="170" stroke="#333" stroke-width="1.5"/>';
 out+='<line x1="42" y1="170" x2="345" y2="170" stroke="#333" stroke-width="1.5"/>';
 out+='<text x="8" y="19" font-size="13" fill="#222">단위: '+esc(unit)+'</text>';
 out+='<text x="8" y="32" font-size="11" fill="#333">세로 눈금: 5'+esc(unit)+'씩</text>';
 return out;
}
function barChart(title,unit,labels,values){
 let body=baseGrid(unit);
 for(let j=0;j<4;j++){
  const x=74+j*79,y=170-values[j]*4;
  body+='<rect x="'+(x-18)+'" y="'+y+'" width="36" height="'+(values[j]*4)+'" fill="#9db1c7" stroke="#445569" stroke-width="1"/>';
  body+='<text x="'+x+'" y="'+(y-6)+'" text-anchor="middle" font-size="11" fill="#222">'+values[j]+'</text>';
  body+='<text x="'+x+'" y="193" text-anchor="middle" font-size="11" fill="#222">'+esc(labels[j])+'</text>';
 }
 return diagram(title,body);
}
function lineChart(title,unit,values){
 let body=baseGrid(unit),pts=[];
 for(let j=0;j<5;j++){
  const x=66+j*66,y=170-values[j]*4;
  pts.push(x+','+y);
  body+='<text x="'+x+'" y="193" text-anchor="middle" font-size="12" fill="#222">'+days[j]+'</text>';
 }
 body+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="#42546b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
 for(let j=0;j<5;j++){
  const x=66+j*66,y=170-values[j]*4;
  body+='<circle cx="'+x+'" cy="'+y+'" r="4.8" fill="white" stroke="#334a63" stroke-width="2"/>';
  body+='<text x="'+x+'" y="'+(y-10)+'" text-anchor="middle" font-size="11" fill="#222">'+values[j]+'</text>';
 }
 return diagram(title,body);
}
const bValues=i=>[5+((i+2)%5)*5,5+((i*2+3)%5)*5,5+((i*3+1)%5)*5,5+((i*4+4)%5)*5];
const lValues=i=>Array.from({length:5},(_,j)=>5+((i*(j+1)+j*j+2*j)%5)*5);
function q(prompt,answer,w1,w2,explanation,scienceMaterial,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate chart choices '+prompt+' '+choices);
 if(!scienceMaterial||!['diagram','table'].includes(scienceMaterial.kind))throw Error('Chart evidence missing '+prompt);
 if(explanation.length<22)throw Error('Insufficient chart rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,scienceMaterial,...(detail?{detail}:{})};
}
function make(kind,i){
 const [barTitle,barUnit,labels]=barCases[i],values=bValues(i),bi=i%4,bj=(i+1)%4;
 const [lineTitle,lineUnit]=lineCases[i],lv=lValues(i),li=i%5,lj=(li+2)%5;
 if(kind==='bar-read'){
  const a=values[bi];
  return q('막대그래프에서 ‘'+labels[bi]+'’의 수를 읽으면 얼마인가요?',
   a+barUnit,(a+5)+barUnit,(a+10)+barUnit,
   '세로 눈금은 5'+barUnit+'씩 증가하고, ‘'+labels[bi]+'’ 막대의 높이는 '+a+barUnit+'입니다.',
   barChart(barTitle,barUnit,labels,values));
 }
 if(kind==='bar-plot'){
  const a=values[bi];
  return q('세로 눈금 한 칸을 5'+barUnit+'으로 정했습니다. ‘'+labels[bi]+'’의 막대를 몇 칸 높이로 그려야 하나요?',
   a/5+'칸',a/5+1+'칸',a/5+2+'칸',
   '‘'+labels[bi]+'’은 '+a+barUnit+'입니다. 5'+barUnit+'이 한 칸이므로 '+a+'÷5='+(a/5)+'칸을 그립니다.',
   table(barTitle+' 조사 자료',['종류','조사한 양'],labels.map((x,j)=>[x,values[j]+barUnit]),'그릴 막대그래프의 세로 눈금은 5'+barUnit+'씩입니다.'));
 }
 if(kind==='bar-collect'){
  const gap=Math.abs(values[bi]-values[bj]);
  return q('그림에 나타난 ‘'+labels[bi]+'’와 ‘'+labels[bj]+'’의 수 차이는 얼마인가요?',
   gap+barUnit,(gap+5)+barUnit,(gap+10)+barUnit,
   '‘'+labels[bi]+'’은 '+values[bi]+barUnit+', ‘'+labels[bj]+'’은 '+values[bj]+barUnit+'입니다. 차이는 '+gap+barUnit+'입니다.',
   barChart(barTitle,barUnit,labels,values));
 }
 if(kind==='bar-problem'){
  const total=values[bi]+values[bj];
  return q('막대그래프에서 ‘'+labels[bi]+'’와 ‘'+labels[bj]+'’를 합하면 모두 얼마인가요?',
   total+barUnit,(total+5)+barUnit,(total+10)+barUnit,
   '두 막대는 각각 '+values[bi]+barUnit+'과 '+values[bj]+barUnit+'입니다. 합은 '+total+barUnit+'입니다.',
   barChart(barTitle,barUnit,labels,values));
 }
 if(kind==='line-read'){
  const n=lv[li];
  return q('꺾은선그래프에서 '+days[li]+'요일의 기록은 얼마인가요?',
   n+lineUnit,(n+5)+lineUnit,(n+10)+lineUnit,
   days[li]+'요일의 점은 '+n+lineUnit+' 위치에 있습니다. 세로 눈금은 5'+lineUnit+'씩입니다.',
   lineChart(lineTitle,lineUnit,lv));
 }
 if(kind==='line-plot'){
  const n=lv[li];
  return q('다음 자료로 꺾은선그래프를 그립니다. '+days[li]+'요일의 점을 세로 눈금 몇 칸 높이에 찍어야 하나요?',
   n/5+'칸',n/5+1+'칸',n/5+2+'칸',
   days[li]+'요일은 '+n+lineUnit+'이고 눈금 한 칸은 5'+lineUnit+'이므로 '+n+'÷5='+(n/5)+'칸입니다.',
   table(lineTitle+' 기록',['요일','측정값'],days.map((d,j)=>[d,lv[j]+lineUnit]),'가로 눈금은 월요일부터 금요일까지, 세로 눈금은 5'+lineUnit+'씩입니다.'));
 }
 if(kind==='line-collect'){
  const diff=Math.abs(lv[li]-lv[lj]);
  return q('꺾은선그래프에서 '+days[li]+'요일과 '+days[lj]+'요일 기록의 차이는 얼마인가요?',
   diff+lineUnit,(diff+5)+lineUnit,(diff+10)+lineUnit,
   days[li]+'요일은 '+lv[li]+lineUnit+', '+days[lj]+'요일은 '+lv[lj]+lineUnit+'입니다. 차이는 '+diff+lineUnit+'입니다.',
   lineChart(lineTitle,lineUnit,lv));
 }
 if(kind==='line-problem'){
  const highest=Math.max(...lv),lowest=Math.min(...lv),gap=highest-lowest;
  return q('꺾은선그래프의 가장 큰 값과 가장 작은 값의 차이는 얼마인가요?',
   gap+lineUnit,(gap+5)+lineUnit,(gap+10)+lineUnit,
   '가장 큰 값은 '+highest+lineUnit+'이고 가장 작은 값은 '+lowest+lineUnit+'입니다. 차이는 '+gap+lineUnit+'입니다.',
   lineChart(lineTitle,lineUnit,lv));
 }
 if(kind==='graph-select'){
  const line=i%2===0,title=line?lineCases[i][0]:barCases[i][0],answer=line?'꺾은선그래프':'막대그래프';
  const detail=line?'같은 항목의 기록이 월요일부터 금요일까지 어떻게 변했는지를 선으로 연결해 보고자 합니다.':'서로 다른 네 종류의 수를 한눈에 비교할 수 있도록 막대의 높이로 나타내고자 합니다.';
  return q('조사 목적과 표현 방법에 가장 알맞은 그래프는 무엇인가요?',
   answer,line?'막대그래프':'꺾은선그래프','지형도',
   line?'시간의 흐름에 따른 수량 변화는 점을 선으로 연결한 꺾은선그래프로 나타낼 수 있습니다.':'서로 다른 종류별 수량을 막대의 높이로 비교할 때 막대그래프가 알맞습니다.',
   table('자료를 나타내려는 목적',['자료','목적'],[[title,detail]],'동일한 자료라도 목적에 따라 다른 그래프를 사용할 수 있습니다.'));
 }
 throw Error('Unknown chart lesson '+kind);
}
const targets=[
 [1,'막대그래프',[
  ['막대그래프를 알아봐요','bar-read'],['막대그래프로 나타내요','bar-plot'],
  ['자료를 모아서 막대그래프로 나타내고 해석해요','bar-collect'],
  ['막대그래프를 이용하여 문제를 해결해요','bar-problem']]],
 [2,'꺾은선그래프',[
  ['꺾은선그래프를 알아봐요','line-read'],['꺾은선그래프로 나타내요','line-plot'],
  ['자료를 모아서 꺾은선그래프로 나타내고 해석해요','line-collect'],
  ['꺾은선그래프를 이용하여 문제를 해결해요','line-problem'],
  ['알맞은 그래프를 알아봐요','graph-select']]]
];
for(const [semester,unit,lessons]of targets)for(const [lesson,kind]of lessons){
 const id='math-g4-charts-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 창작 4학년 수학 그림·표 자료(가상 조사) · 실제 조사·그리기 수행평가는 별도'}));
 const unique=new Set(items.map(q=>JSON.stringify([q.prompt,q.scienceMaterial])));
 if(unique.size!==items.length)throw Error('Repeated chart problem '+id);
 banks.push({id,subject:'math',grades:[4],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
  label:lesson+' · 실제 막대·꺾은선 그림과 수량 해석',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate grade-four chart bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
