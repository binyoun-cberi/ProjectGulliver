(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeThreeFractionGraph=api;})(globalThis,()=>{
'use strict';
// Original 2022 grade 3 semester 2 concept tasks. Readable pictographs carry
// their own scale. Paper-only concepts do not certify physical production.
const banks=[];
const things=['쿠키','색종이','책갈피','사과 조각','구슬','바둑돌','리본','색연필','콩','스티커','종이별','단추','종이컵','꽃잎','딱지','초콜릿 조각'];
const colors=['빨강','파랑','노랑','초록','보라','주황','하양','검정','분홍','남색','연두','갈색','은색','금색','하늘색','회색'];
const graphSubjects=['대출한 책','운동장 놀이 참여자','모은 건전지','심은 묘목','재활용한 빈 병','참가한 학생','수거한 종이컵','도서관 방문자','기부한 물건','텃밭의 새싹','모은 스티커','산책에 참여한 사람','대출 도서','발표 참가자','만든 책갈피','모은 플라스틱 뚜껑'];
const symbols=['●','◆','■'];
const table=(title,headers,rows,note)=>({kind:'table',title,headers,rows,note});
function q(prompt,answer,w1,w2,explanation,detail,scienceMaterial){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate choices '+prompt+' '+choices.join('/'));
 if(explanation.length<15)throw Error('Missing explanation '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{}),...(scienceMaterial?{scienceMaterial}:{})};
}
const GCD=(a,b)=>b?GCD(b,a%b):a;
const fract=(a,d)=>a+'/'+d;
const detailShapes=(a,d)=>'같은 크기로 나눈 '+d+'칸: '+'■'.repeat(a)+'□'.repeat(d-a)+' (■는 색칠한 칸입니다.)';
function make(kind,i){
 const thing=things[i],n=i+2,den=4+i%6,top=1+i%(den-1);
 switch(kind){
 case 'equal-part':{
   const total=3+i%6,part=1+i%(total-1);
   return q('전체를 같은 크기로 나누었을 때 색칠한 부분을 나타낸 분수는?',
    fract(part,total),fract(total,part),fract(part+1,total),
    '전체 '+total+'칸 중 색칠한 '+part+'칸은 '+part+'/'+total+'입니다.',
    detailShapes(part,total));
 }
 case 'fraction-of-set':{
   const d=2+i%6,k=2+i%4,p=1+i%(d-1),total=d*k,answer=p*k;
   return q('전체 '+total+'개 중 '+p+'/'+d+'만큼에 해당하는 '+thing+'의 수는?',
     answer+'개',(answer+k)+'개',(answer-k)+'개',
     '전체 '+total+'개를 '+d+'개의 같은 묶음으로 나누면 한 묶음에 '+k+'개입니다. '+p+'묶음이므로 '+answer+'개입니다.',
     thing+'을/를 '+d+'묶음으로 똑같이 나누었습니다.');
 }
 case 'part-of-whole':{
   const total=5+i%7,part=1+i%(total-1);
   return q('다음 자료에서 선택한 부분은 전체의 얼마인가요?',
     part+'/'+total,(part+1)+'/'+total,total+'/'+part,
     '전체 '+total+'개 중 '+part+'개를 선택했으므로 '+part+'/'+total+'입니다.',
     thing+' 전체 '+total+'개에서 '+part+'개를 선택했습니다. 전체를 기준으로 분수를 쓰세요.');
 }
 case 'fraction-kinds1':{
   const d=3+i%7, numerator=i%2===0?d-1:d+1,answer=i%2===0?'진분수':'가분수';
   return q('분수 '+numerator+'/'+d+'은 어떤 분수인가요?',answer,answer==='진분수'?'가분수':'진분수','대분수',
    '분자가 분모보다 '+(numerator<d?'작으면 진분수':'크거나 같으면 가분수')+'입니다.',
    '분자 '+numerator+', 분모 '+d+'를 비교해 보세요. 기록 '+(i+1));
 }
 case 'fraction-kinds2':{
   const d=3+i%6,whole=1+i%4,t=1+i%(d-1);
   return q('대분수 '+whole+'와 '+t+'/'+d+'를 가분수로 나타내면?',
     (whole*d+t)+'/'+d,(whole*d+t+1)+'/'+d,(whole+t)+'/'+d,
     '자연수 '+whole+'은 '+(whole*d)+'/'+d+'이고 여기에 '+t+'/'+d+'를 더하면 '+(whole*d+t)+'/'+d+'입니다.',
     '대분수는 자연수와 진분수를 합한 수입니다. '+thing+' 기록 '+(i+1));
 }
 case 'convert-mixed':{
   const d=3+i%6,whole=1+i%5,t=1+i%(d-1),num=d*whole+t;
   return q('가분수 '+num+'/'+d+'를 대분수로 바르게 나타낸 것은?',
     whole+'와 '+t+'/'+d,(whole+1)+'와 '+t+'/'+d,whole+'와 '+(t+1)+'/'+d,
     num+'을 '+d+'로 나누면 몫 '+whole+', 나머지 '+t+'이므로 '+whole+'와 '+t+'/'+d+'입니다.',
     '전체 '+thing+'을/를 같은 크기의 '+d+'조각씩 한 묶음으로 생각하세요.');
 }
 case 'fraction-compare':{
   const d=3+i%5,a=1+i%d,b=d+1+i%d,answer=b+'/'+d;
   return q('두 분수 '+a+'/'+d+'와 '+b+'/'+d+' 중 더 큰 분수는?',
    answer,a+'/'+d,'두 분수의 크기가 같다',
    '분모가 '+d+'로 같으므로 분자가 큰 '+b+'/'+d+'가 더 큽니다.',
    '같은 크기의 한 조각을 기준으로 비교합니다. '+thing+' 문제 '+(i+1));
 }
 case 'graph-read':{
   const scale=i%2===0?2:5,v=[2+i%5,3+(i*2)%5,1+(i*3)%5],names=['가','나','다'];
   const idx=i%3,correct=v[idx]*scale;
   return q('그림그래프에서 '+names[idx]+'의 수는 얼마인가요?',
    correct+'개',(correct+scale)+'개',(correct+2*scale)+'개',
    '기호 하나는 '+scale+'개이므로 '+names[idx]+'의 기호 '+v[idx]+'개는 '+correct+'개를 뜻합니다.',
    undefined,table(graphSubjects[i]+' 조사 그림그래프',['모둠','그림'],names.map((nm,j)=>[nm,symbols[i%3].repeat(v[j])]),symbols[i%3]+' 하나는 '+scale+'개입니다.'));
 }
 case 'graph-draw':{
   const scale=i%2===0?2:5,v=[2+i%6,3+(i*3)%6,1+(i*5)%6],idx=i%3,count=v[idx]*scale,symbol=symbols[i%3];
   return q('그림그래프를 완성할 때 '+['가','나','다'][idx]+'의 칸에 '+symbol+' 기호를 몇 개 그려야 하나요?',
    v[idx]+'개',(v[idx]+1)+'개',(v[idx]+2)+'개',
    count+'개를 기호 하나당 '+scale+'개로 나타내면 '+v[idx]+'개의 기호가 필요합니다.',
    undefined,table(graphSubjects[i]+'을/를 정리할 자료',['모둠','조사한 수'],[['가',v[0]*scale+'개'],['나',v[1]*scale+'개'],['다',v[2]*scale+'개']],
      '그림그래프의 범례: '+symbol+' 하나는 '+scale+'개입니다.'));
 }
 case 'graph-interpret':{
   const scale=i%3===0?2:i%3===1?5:10;
   const a=2+i%5,b=4+(i*2)%5,c=1+(i*3)%5,names=['가','나','다'],counts=[a,b,c],k=i%3,j=(k+1)%3;
   const diff=Math.abs(counts[k]-counts[j])*scale;
   const prompt=names[k]+'와 '+names[j]+'의 조사한 수 차이는 얼마인가요?';
   return q(prompt,diff+'명',(diff+scale)+'명',(diff+2*scale)+'명',
     names[k]+' '+(counts[k]*scale)+'명과 '+names[j]+' '+(counts[j]*scale)+'명의 차이는 '+diff+'명입니다.',
     undefined,table(graphSubjects[i]+' 조사 그림그래프',['모둠','참여 인원'],names.map((nm,z)=>[nm,'●'.repeat(counts[z])]),'● 하나는 '+scale+'명입니다.'));
 }
 default:throw Error('Unknown grade-three fraction/graph kind '+kind);
 }
}
const curriculum=[
 [2,'분수',[['1. 전체를 똑같이 나누고 분수로 나타내요','equal-part'],['2. 전체의 분수만큼은 얼마인지 알아봐요','fraction-of-set'],
  ['3. 부분은 전체의 얼마인지 알아봐요','part-of-whole'],['4. 여러 가지 분수를 알아봐요 (1)','fraction-kinds1'],
  ['5. 여러 가지 분수를 알아봐요 (2)','fraction-kinds2'],['6. 대분수와 가분수를 바꾸어 나타내요','convert-mixed'],
  ['7. 분수의 크기를 비교해요','fraction-compare']]],
 [2,'그림그래프',[['1. 그림그래프를 알아봐요','graph-read'],['2. 그림그래프로 나타내요','graph-draw'],
   ['3. 자료를 모아서 그림그래프로 나타내고 해석해요','graph-interpret']]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 const id='math-g3-fraction-graph-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),
   knowledgeOnly:true,sourceLabel:'클라시트 창작 3학년 분수·그림그래프 자료 · 실제 그리기 수행을 대체하지 않음'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial]))).size!==16)throw Error('Repeated question '+id);
 banks.push({id,subject:'math',grades:[3],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
  label:lesson.replace(/^\d+\.\s*/, '')+' · 분수·그림그래프 개념',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate grade3 bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
