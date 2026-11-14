(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeThreeMeasures=api;})(globalThis,()=>{
'use strict';
// Original grade-3/4 paper-answerable measurement and arithmetic estimation tasks.
// Existing grade-three length/time banks are intentionally retained, not overwritten.
// Actual scale and measuring-cup estimation performances remain separate.
const banks=[];
const people=['서아','준호','하린','민호','가은','지호','유나','도윤','태오','수아','지민','하윤','예린','서준','다은','윤서'];
const weightContext=[
 ['사과 한 개의 무게','약 200 g','약 200 kg','약 200 t'],['쌀 10 kg 포대 한 개의 무게','약 10 kg','약 10 g','약 10 t'],
 ['자동차 한 대의 무게','약 1 t','약 1 g','약 1 kg'],['가위 한 개의 무게','약 50 g','약 50 kg','약 50 t'],
 ['수박 한 통의 무게','약 5 kg','약 5 g','약 5 t'],['작은 종이 클립 한 개의 무게','약 1 g','약 1 kg','약 1 t'],
 ['승용차 한 대의 무게','약 1 t','약 1 kg','약 1 g'],['중간 크기 양배추 한 통의 무게','약 1 kg','약 1 g','약 1 t'],
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
function question(prompt,answer,wrong1,wrong2,explanation,detail){
 const choices=[answer,wrong1,wrong2].map(String);
 if(new Set(choices).size!==3)throw Error('Overlapping length/time choices '+prompt+' '+choices);
 if(explanation.length<20)throw Error('Short length/time rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
const round10=n=>Math.round(n/10)*10;
function make(kind,i){
 const who=people[i],j=Math.floor(i/2);
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
