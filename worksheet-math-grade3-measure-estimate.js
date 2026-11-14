(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeThreeMeasures=api;})(globalThis,()=>{
'use strict';
// Original grade-3/4 paper-answerable units, duration and estimation tasks.
// Exact source textbook names are preserved through evidence.find normalization.
// Actual ruler, stopwatch, scale and measuring-cup operations remain separate.
const banks=[];
const people=['서아','준호','하린','민호','가은','지호','유나','도윤','태오','수아','지민','하윤','예린','서준','다은','윤서'];
const items=['책갈피','리본','연필','색종이','끈','종이띠','모형','스티커','책','연습장','포장지','종이테이프','막대','띠','블록','카드'];
const lengthContext=[
 ['지우개 하나의 길이','약 4 cm','약 4 m','약 4 km'],['일반적인 교실 문의 높이','약 2 m','약 2 mm','약 2 km'],
 ['종이 클립 하나의 길이','약 3 cm','약 3 km','약 3 m'],['자동차 한 대의 길이','약 4 m','약 4 mm','약 4 km'],
 ['어린이용 연필 한 자루의 길이','약 15 cm','약 15 km','약 15 m'],['학교 운동장 한쪽의 길이','약 80 m','약 80 mm','약 80 km'],
 ['집과 학교 사이 도보 거리','약 1 km','약 1 mm','약 1 cm'],['공책 한 장의 두께','약 1 mm','약 1 m','약 1 km'],
 ['보통 연필심의 지름','약 2 mm','약 2 km','약 2 m'],['일반적인 책상 높이','약 70 cm','약 70 m','약 70 km'],
 ['야구공의 지름','약 7 cm','약 7 km','약 7 m'],['버스 한 대의 길이','약 10 m','약 10 mm','약 10 km'],
 ['교실 칠판의 가로 길이','약 3 m','약 3 mm','약 3 km'],['책가방의 가로 너비','약 30 cm','약 30 km','약 30 m'],
 ['도로에서 두 도시 사이 거리','약 40 km','약 40 mm','약 40 cm'],['그림 종이 한 장의 두께','약 1 mm','약 1 km','약 1 m']
];
const weightContext=[
 ['사과 한 개의 무게','약 200 g','약 200 kg','약 200 t'],['쌀 10 kg 포대 한 개의 무게','약 10 kg','약 10 g','약 10 t'],
 ['자동차 한 대의 무게','약 1 t','약 1 g','약 1 kg'],['가위 한 개의 무게','약 50 g','약 50 kg','약 50 t'],
 ['수박 한 통의 무게','약 5 kg','약 5 g','약 5 t'],['작은 종이 클립 한 개의 무게','약 1 g','약 1 kg','약 1 t'],
 ['승용차 한 대의 무게','약 1 t','약 1 mg','약 1 g'],['중간 크기 양배추 한 통의 무게','약 1 kg','약 1 g','약 1 t'],
 ['과일 한 알짜 귤의 무게','약 100 g','약 100 kg','약 100 t'],['책 한 권의 무게','약 300 g','약 300 kg','약 300 t'],
 ['고양이 한 마리의 무게','약 4 kg','약 4 g','약 4 t'],['일반적인 지우개 하나의 무게','약 20 g','약 20 kg','약 20 t'],
 ['보통 성인용 자전거 한 대의 무게','약 12 kg','약 12 g','약 12 t'],['작은 배낭에 든 교과서 몇 권의 무게','약 3 kg','약 3 g','약 3 t'],
 ['오렌지 한 개의 무게','약 200 g','약 200 kg','약 200 t'],['피아노 한 대의 무게','약 250 kg','약 250 g','약 250 t']
];
const volumeContext=[
 ['일반적인 티스푼 한 번에 담는 물의 양','약 5 mL','약 5 L','약 50 L'],['큰 생수병 한 병의 들이','약 2 L','약 2 mL','약 200 L'],
 ['우유 한 작은 팩의 들이','약 200 mL','약 200 L','약 2 mL'],['대형 물통 한 개의 들이','약 20 L','약 20 mL','약 2000 L'],
 ['종이컵 한 개의 들이','약 180 mL','약 180 L','약 18 L'],['커다란 욕조의 들이','약 200 L','약 200 mL','약 2 mL'],
 ['운동용 물병 한 개의 들이','약 500 mL','약 500 L','약 5 mL'],['작은 음료 캔 하나의 들이','약 250 mL','약 250 L','약 2 mL'],
 ['일반적인 양동이 한 개의 들이','약 10 L','약 10 mL','약 1000 L'],['빨대 한 모금 정도의 물의 양','약 10 mL','약 10 L','약 100 L'],
 ['가정용 1 L 우유 팩의 들이','약 1 L','약 1 mL','약 100 L'],['작은 주스팩 한 개의 들이','약 125 mL','약 125 L','약 1250 L'],
 ['생수 500 mL 병 한 개의 들이','약 500 mL','약 500 L','약 50 L'],['급식에서 사용하는 물컵 한 개의 들이','약 200 mL','약 200 L','약 20 L'],
 ['대형 물통에 담기는 물의 양','약 18 L','약 18 mL','약 1800 L'],['일반적인 세숫대야 한 개의 들이','약 5 L','약 5 mL','약 500 L']
];
const meter=n=>Math.floor(n/1000)+' km '+n%1000+' m';
const minute=n=>Math.floor(n/60)+'분 '+n%60+'초';
const hour=n=>Math.floor(n/60)+'시간 '+n%60+'분';
function question(prompt,answer,wrong1,wrong2,explanation,detail){
 const choices=[answer,wrong1,wrong2].map(String);
 if(new Set(choices).size!==3)throw Error('Overlapping length/time choices '+prompt+' '+choices);
 if(explanation.length<20)throw Error('Short length/time rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
const round10=n=>Math.round(n/10)*10;
function make(kind,i){
 const who=people[i],obj=items[i],mode=i%4,j=Math.floor(i/2);
 if(kind==='millimeter'){
  if(mode===0){
   const cm=3+i,mm=2+i%7,ans=cm*10+mm;
   return question(cm+' cm '+mm+' mm를 mm만으로 나타내면?',ans+' mm',(ans+1)+' mm',(ans+10)+' mm',
    '1 cm는 10 mm입니다. '+cm+' × 10 + '+mm+' = '+ans+'이므로 '+ans+' mm입니다.',
    who+'가 '+obj+'의 길이를 기록했습니다.');
  }
  if(mode===1){
   const mm=32+i*7,cm=Math.floor(mm/10),remain=mm%10;
   return question(mm+' mm를 몇 cm 몇 mm로 나타내면?',cm+' cm '+remain+' mm',(cm+1)+' cm '+remain+' mm',cm+' cm '+(remain+1)+' mm',
    '10 mm가 1 cm이므로 '+mm+' mm는 '+cm+' cm와 남은 '+remain+' mm입니다.',
    who+'가 잰 '+obj+'의 길이입니다.');
  }
  if(mode===2){
   const cm=3+j,mm=2+i%6,other=cm*10+mm+5,ans='나';
   return question('가와 나 중 더 긴 것은 무엇인가요?',ans,'가','길이가 같다',
    '가의 '+cm+' cm '+mm+' mm는 '+(cm*10+mm)+' mm입니다. 나의 '+other+' mm가 더 깁니다.',
    who+'의 비교 기록: 가 = '+cm+' cm '+mm+' mm / 나 = '+other+' mm');
  }
  const cm=2+j,mm=1+i%8,other=cm*10+mm-4;
  return question('가와 나 중 더 긴 것은 무엇인가요?','가','나','길이가 같다',
   '가의 '+cm+' cm '+mm+' mm는 '+(cm*10+mm)+' mm이고, 나의 '+other+' mm보다 깁니다.',
   who+'의 비교 기록: 가 = '+cm+' cm '+mm+' mm / 나 = '+other+' mm');
 }
 if(kind==='kilometer'){
  if(mode===0){
   const km=1+i%7,m=120+i*25,ans=km*1000+m;
   return question(km+' km '+m+' m를 m만으로 나타내면?',ans+' m',(ans+100)+' m',(ans+1000)+' m',
    '1 km는 1000 m입니다. '+km+' × 1000 + '+m+' = '+ans+' m입니다.',
    who+'가 이동 거리를 정리했습니다.');
  }
  if(mode===1){
   const km=2+i%6,m=170+(i*27)%800,ans=km*1000+m;
   return question(ans+' m를 km와 m로 바르게 나타낸 것은?',km+' km '+m+' m',(km+1)+' km '+m+' m',km+' km '+(m+100)+' m',
    '1000 m를 1 km로 묶으면 '+km+' km '+m+' m입니다.',
    who+'가 운동장 밖 이동 거리를 기록했습니다.');
  }
  if(mode===2){
   const km=1+i%8,remain=100+i*17,a=km*1000+remain,b=a+300;
   return question('두 길 중 더 긴 길은 무엇인가요?','나','가','두 길이 같다',
    '가의 길이는 '+a+' m이고, 나의 길이는 '+b+' m이므로 나가 더 깁니다.',
    who+'의 길이 자료: 가 = '+km+' km '+remain+' m / 나 = '+b+' m');
  }
  const km=1+i%6,remain=140+i*19,a=km*1000+remain,b=a-250;
  return question('두 길 중 더 긴 길은 무엇인가요?','가','나','두 길이 같다',
   '가의 길이는 '+a+' m이고, 나의 길이는 '+b+' m이므로 가가 더 깁니다.',
   who+'의 길이 자료: 가 = '+km+' km '+remain+' m / 나 = '+b+' m');
 }
 if(kind==='length-estimate'){
  const [object,ans,w1,w2]=lengthContext[i];
  return question('다음 길이를 어림한 값 중 가장 알맞은 것은?',ans,w1,w2,
    object+'는 보통 '+ans+' 정도의 길이입니다. 정확한 값은 실제 물건과 장소에 따라 달라집니다.',
    who+'가 어림할 대상: '+object+'. 주어진 세 값 중 크기와 단위가 알맞은 것을 고르세요.');
 }
 if(kind==='second'){
  if(i%2===0){
   const pos=j+1,sec=pos*5;
   return question('시계의 초침이 숫자 '+pos+'을 가리킬 때, 정각을 지나 몇 초인가요?',sec+'초',(sec+5)+'초',(sec+10)+'초',
    '초침은 숫자 한 칸마다 5초씩 움직이므로 '+pos+' × 5 = '+sec+'초입니다.',
    who+'가 시계의 12부터 초침을 따라 세었습니다.');
  }
  const mins=j+1,seconds=10+j*4,ans=mins*60+seconds;
  return question(mins+'분 '+seconds+'초를 초로만 나타내면?',ans+'초',(ans+10)+'초',(ans+60)+'초',
   '1분은 60초이므로 '+mins+' × 60 + '+seconds+' = '+ans+'초입니다.',
   who+'의 초 단위 시간 기록입니다.');
 }
 if(kind==='time-add'){
  if(i%2===0){
   const h1=1+i%4,m1=38+(i%5)*3,h2=1+Math.floor(i/4)%3,m2=30+(i%4)*4;
   const ans=(h1+h2)*60+m1+m2,show=hour(ans),bad=hour(ans+60),bad2=hour(ans+1);
   return question('다음 두 시간의 합은?',show,bad,bad2,
    '분끼리 더한 '+(m1+m2)+'분에서 60분을 1시간으로 바꾸면 '+show+'입니다.',
    who+'의 활동 시간: '+h1+'시간 '+m1+'분 + '+h2+'시간 '+m2+'분');
  }
  const min1=4+j,sec1=42+(j%4)*3,min2=2+j%4,sec2=29+(j%4)*5;
  const ans=(min1+min2)*60+sec1+sec2,show=minute(ans);
  return question('다음 두 시간의 합은?',show,minute(ans+60),minute(ans+1),
   '초끼리 더한 '+(sec1+sec2)+'초에서 60초를 1분으로 바꾸면 '+show+'입니다.',
   who+'의 활동 시간: '+min1+'분 '+sec1+'초 + '+min2+'분 '+sec2+'초');
 }
 if(kind==='time-sub'){
  if(i%2===0){
   const h1=4+Math.floor(i/4),m1=5+(i%4)*5,h2=1+i%3,m2=25+(i%5)*3;
   const ans=(h1-h2)*60+m1-m2,show=hour(ans);
   return question('다음 두 시간의 차는?',show,hour(ans+60),hour(ans+1),
    '분을 바로 뺄 수 없으므로 1시간을 60분으로 바꿔 계산합니다. 남는 시간은 '+show+'입니다.',
    who+'가 계산할 시간: '+h1+'시간 '+m1+'분 − '+h2+'시간 '+m2+'분');
  }
  const min1=6+j,sec1=5+(j%4)*3,min2=2+j%4,sec2=26+(j%4)*4;
  const ans=(min1-min2)*60+sec1-sec2,show=minute(ans);
  return question('다음 두 시간의 차는?',show,minute(ans+60),minute(ans+1),
    '초를 바로 뺄 수 없으므로 1분을 60초로 바꿔 계산합니다. 남는 시간은 '+show+'입니다.',
    who+'가 계산할 시간: '+min1+'분 '+sec1+'초 − '+min2+'분 '+sec2+'초');
 }
 if(kind==='weight-estimate'){
  const [object,ans,w1,w2]=weightContext[i];
  return question('물건의 무게를 어림한 값으로 가장 알맞은 것은?',ans,w1,w2,
   object+'의 무게를 나타내기에는 '+ans+' 정도가 적절합니다. 물건마다 실제 무게는 조금씩 다를 수 있습니다.',
   who+'가 비교한 대상: '+object+'. 세 값의 단위와 크기를 함께 비교하세요.');
 }
 if(kind==='capacity-estimate'){
  const [object,ans,w1,w2]=volumeContext[i];
  return question('물건의 들이를 어림한 값으로 가장 알맞은 것은?',ans,w1,w2,
   object+'의 들이를 생각하면 '+ans+' 정도가 알맞습니다. 실제 용기마다 들이는 다를 수 있습니다.',
   who+'가 비교한 용기: '+object+'. 세 값의 단위와 크기를 함께 비교하세요.');
 }
 if(kind==='estimate-three'){
  const a=248+i*19,b=126+i*7,add=i%2===0,ra=round10(a),rb=round10(b),ans=add?ra+rb:ra-rb;
  const op=add?'+':'−';
  return question('두 수를 각각 십의 자리까지 반올림한 뒤 계산한 어림값은?',String(ans),String(ans+10),String(ans+20),
   a+' → '+ra+', '+b+' → '+rb+'로 십의 자리까지 반올림합니다. '+ra+' '+op+' '+rb+' = '+ans+'입니다.',
   who+'의 계산: '+a+' '+op+' '+b+' (실제값과 어림값을 구분하세요.)');
 }
 if(kind==='estimate-four'){
  if(i%2===0){
   const a=34+i*7,b=22+(i%5)*7,ra=round10(a),rb=round10(b),ans=ra*rb;
   return question('두 수를 각각 십의 자리까지 반올림해 곱한 어림값은?',String(ans),String(ans+100),String(ans+200),
     a+' → '+ra+', '+b+' → '+rb+'로 반올림합니다. '+ra+' × '+rb+' = '+ans+'입니다.',
     who+'의 곱셈: '+a+' × '+b);
  }
  const divisor=20+(j%4)*10,quotient=10+2*j,rounded=divisor*quotient;
  const dividend=rounded+(j%2===0?4:-4),originalDivisor=divisor+(j%2===0?1:-1);
  return question('나누어지는 수와 나누는 수를 각각 십의 자리까지 반올림해 나눈 어림값은?',String(quotient),String(quotient+1),String(quotient+2),
    dividend+' → '+rounded+', '+originalDivisor+' → '+divisor+'로 반올림합니다. '+rounded+' ÷ '+divisor+' = '+quotient+'입니다.',
    who+'의 나눗셈: '+dividend+' ÷ '+originalDivisor);
 }
 throw Error('Unknown measurement/estimation focus '+kind);
}
const targets=[
 [3,1,'길이와 시간',[
  ['mm를 알아봐요','millimeter'],['km를 알아봐요','kilometer'],['길이를 어림해요','length-estimate'],
  ['초를 알아봐요','second'],['시간의 덧셈과 뺄셈을 해요 (1)','time-add'],
  ['시간의 덧셈과 뺄셈을 해요 (2)','time-sub']]],
 [3,2,'무게와 들이',[
  ['무게를 어림해요','weight-estimate'],['들이를 어림해요','capacity-estimate']]],
 [3,1,'덧셈과 뺄셈',[['어림셈을 해요','estimate-three']]],
 [4,1,'곱셈과 나눗셈',[['어림셈을 해요','estimate-four']]]
];
for(const [grade,semester,unit,lessons]of targets)for(const [lesson,kind]of lessons){
 const id='math-measure-estimate-g'+grade+'-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),
  knowledgeOnly:true,sourceLabel:'클라시트 창작 교과서 차시 연계 수학 문항 · 실물 측정 및 어림 수행은 별도'}));
 const keys=items.map(x=>JSON.stringify([x.prompt,x.detail||x.scienceMaterial]));
 if(new Set(keys).size!==16)throw Error('Repeated measurement context '+id);
 banks.push({id,subject:'math',grades:[grade],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
  label:lesson+' · 단위 관계·시간 계산·어림의 개념',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate measurement bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
