(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeThreeOperations=api;})(globalThis,()=>{
'use strict';
// Original lesson-specific grade-three paper questions: equal sharing, making
// groups, inverse operations, 2-digit multiplication, checking remainders, and
// visibly straight/curved lines. No geometric construction is claimed.
const banks=[];
const people=['서아','도윤','민호','하린','가은','지수','준호','유나','태오','예린','민지','다은','윤서','서준','하윤','지호'];
const objects=['구슬','딱지','색연필','모형','스티커','종이별','도토리','블록','책갈피','종이컵','카드','나뭇잎','조약돌','단추','퍼즐 조각','꽃잎'];
const answers=(prompt,correct,w1,w2,why,detail,scienceMaterial)=>{
 const choices=[String(correct),String(w1),String(w2)];
 if(new Set(choices).size!==3)throw Error('Conflicting choices '+prompt+' '+choices);
 if(why.length<22)throw Error('Explanation too short '+prompt);
 return {prompt,answer:String(correct),choices,explanation:why,...(detail?{detail}:{}),...(scienceMaterial?{scienceMaterial}:{})};
};
function make(kind,i){
 const person=people[i],thing=objects[i],j=Math.floor(i/2);
 if(kind==='share'){
  const group=2+i%7,each=3+Math.floor(i/7)*2+(i%3),total=group*each;
  return answers('물건 '+total+'개를 '+group+'명에게 똑같이 나누어 주면 한 명당 몇 개씩 받나요?',
    each+'개',(each+1)+'개',(each+2)+'개',
    '전체 '+total+'개를 '+group+'명이 똑같이 나누므로 '+total+' ÷ '+group+' = '+each+'개입니다.',
    person+'의 나눔 상황: 물건은 '+thing+'입니다. 사람마다 같은 수를 받습니다.');
 }
 if(kind==='groups'){
  const size=2+i%6,group=4+Math.floor(i/6)+(i%4),total=size*group;
  return answers('물건 '+total+'개를 한 묶음에 '+size+'개씩 담으면 몇 묶음이 되나요?',
   group+'묶음',(group+1)+'묶음',(group+2)+'묶음',
   '전체 '+total+'개를 '+size+'개씩 묶으므로 '+total+' ÷ '+size+' = '+group+'묶음입니다.',
   person+'의 모둠 정리: 물건은 '+thing+'입니다. 남는 물건 없이 모두 묶습니다.');
 }
 if(kind==='inverse'){
  const a=2+i%7,b=3+Math.floor(i/7)*2+(i%3),total=a*b;
  return answers('곱셈식 '+a+' × '+b+' = '+total+'을 이용하면 '+total+' ÷ '+a+'의 몫은 무엇인가요?',
   String(b),String(b+1),String(b+2),
   a+' × '+b+' = '+total+'이므로 곱셈과 나눗셈의 관계를 이용하면 '+total+' ÷ '+a+' = '+b+'입니다.',
   person+'가 확인한 곱셈과 나눗셈의 관계입니다. 자료 '+thing+' (연습 '+(i+1)+').');
 }
 if(kind==='multiplication1'){
  // Deliberately no carrying: 20..23 × 10..13.
  const a=20+i%4,b=10+Math.floor(i/4),ans=a*b,ten=a*10,unit=a*(b%10);
  return answers('올림이 생기지 않는 곱셈 '+a+' × '+b+'의 값은 무엇인가요?',
   String(ans),String(ans+10),String(ans+100),
   b+' = 10 + '+(b%10)+'으로 나누어 '+a+' × 10 = '+ten+', '+a+' × '+(b%10)+' = '+unit+'을 더하면 '+ans+'입니다.',
   person+'가 나누어 계산한 두 부분의 곱: '+ten+'과 '+unit+'.');
 }
 if(kind==='multiplication2'){
  const a=27+(i%8)*3,b=12+Math.floor(i/8)*4+(i%4),tens=Math.floor(b/10)*10,ones=b%10,part1=a*tens,part2=a*ones,product=a*b;
  if(i%2===0)return answers('곱셈 '+a+' × '+b+'를 두 부분의 곱으로 나누어 계산할 때 옳은 식은?',
   a+' × '+tens+' + '+a+' × '+ones,
   a+' × '+(tens/10)+' + '+a+' × '+ones,
   a+' × '+tens+' + '+a+' × '+(ones+1),
   '곱하는 수 '+b+'는 '+tens+' + '+ones+'입니다. 따라서 '+part1+' + '+part2+' = '+product+'가 되게 계산해야 합니다.',
   person+'의 계산 계획: '+a+' × ('+tens+' + '+ones+').');
  return answers(a+' × '+b+'의 값을 부분 곱을 이용해 구하면?',
   String(product),String(product+10),String(product+100),
   a+' × '+tens+' = '+part1+'과 '+a+' × '+ones+' = '+part2+'를 더하면 '+product+'입니다.',
   person+'가 나눈 두 부분의 곱: '+part1+'과 '+part2+'.');
 }
 if(kind==='multiplication3'){
  const a=58+i*2,b=34+(i%7)*5,product=a*b,tens=Math.floor(b/10)*10,ones=b%10;
  const p1=a*tens,p2=a*ones,wrongWithoutPlace=a*Math.floor(b/10)+p2;
  return answers('두 자리 수의 곱셈 '+a+' × '+b+'을 계산한 값은?',
   String(product),String(wrongWithoutPlace),String(product+10),
   b+'는 '+tens+' + '+ones+'입니다. '+a+' × '+tens+' = '+p1+', '+a+' × '+ones+' = '+p2+'이므로 '+p1+' + '+p2+' = '+product+'입니다.',
   people[i]+'의 계산: 십의 자리에 대한 곱을 구할 때 자릿값을 잊지 마세요.');
 }
 if(kind==='verify-division'){
  const d=3+i%6,quotient=4+i%5,remain=1+i%(d-1),total=d*quotient+remain;
  const equal=d+' × '+quotient+' + '+remain+' = '+total;
  const negative=d+' × '+quotient+' − '+remain+' = '+total;
  const parentheses=d+' × ('+quotient+' + '+remain+') = '+total;
  return answers(total+' ÷ '+d+' = '+quotient+' … '+remain+'의 계산이 맞는지 확인하는 식은?',
   equal,negative,parentheses,
   '나누는 수 × 몫 + 나머지 = 나누어지는 수입니다. '+d+' × '+quotient+' + '+remain+' = '+total+'이고 나머지는 '+d+'보다 작으므로 바른 계산입니다.',
   person+'의 계산을 검토합니다. 원래 물건: '+thing+'.');
 }
 if(kind==='line-classification'){
  const straight=i%2===0,offset=10+i*3,x1=30+offset,y1=30+i%4*9,x2=325-offset,y2=100+i%5*7;
  const shape=straight?
   '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#2b4158" stroke-width="4" stroke-linecap="round"/>':
   '<path d="M '+x1+' '+y1+' Q 180 '+(5+i%3*4)+' '+x2+' '+y2+'" fill="none" stroke="#2b4158" stroke-width="4" stroke-linecap="round"/>';
  const material={kind:'diagram',title:person+'의 선 ㉠',viewBox:'0 0 360 150',body:'<rect x="0" y="0" width="360" height="150" fill="white"/>'+shape+'<text x="180" y="143" text-anchor="middle" font-size="15" fill="#222">선 ㉠</text>'};
  const ans=straight?'곧은 선':'굽은 선',wrong=straight?'굽은 선':'곧은 선';
  return answers('그림에 그려진 선 ㉠의 모양을 바르게 분류한 것은?',
   ans,wrong,'끊어진 선',
   straight?'선의 두 끝을 잇는 부분이 휘어지지 않고 곧으므로 곧은 선입니다.':'선의 중간이 부드럽게 휘어져 있으므로 굽은 선입니다.',
   undefined,material);
 }
 throw Error('Unknown grade-three operation '+kind);
}
const targets=[
 [1,'평면도형',[['선을 분류해요','line-classification']]],
 [1,'나눗셈',[
  ['나눗셈식을 알아봐요 (1)','share'],['나눗셈식을 알아봐요 (2)','groups'],
  ['곱셈과 나눗셈의 관계를 알아봐요','inverse']]],
 [2,'곱셈',[
  ['(두 자리 수)×(두 자리 수)를 계산해요 (1)','multiplication1'],
  ['(두 자리 수)×(두 자리 수)를 계산해요 (2)','multiplication2'],
  ['(두 자리 수)×(두 자리 수)를 계산해요 (3)','multiplication3']]],
 [2,'나눗셈',[['계산이 맞는지 확인해요','verify-division']]]
];
for(const [semester,unit,lessons]of targets)for(const [lesson,kind]of lessons){
 const id='math-g3-ops-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 자체 창작 3학년 연산·선 분류 문항 · 실제 선 그리기 활동은 별도'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial]))).size!==16)throw Error('Repeated operation case '+id);
 banks.push({id,subject:'math',grades:[3],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
   label:lesson+' · 계산 원리와 근거 확인',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate operation bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
