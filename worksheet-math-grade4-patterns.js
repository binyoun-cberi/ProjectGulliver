(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeFourPatterns=api;})(globalThis,()=>{
'use strict';
// Grade 4 semester 2 number patterns, increasing figures and equivalent
// expressions. Original tasks show every pattern explicitly and assess the
// written reasoning rather than actual figure manipulation.
const banks=[];
const actors=['하린','준호','도윤','민지','가은','서아','태오','지수','민호','유나','서준','예린','다은','하윤','윤서','지호'];
const objects=['구슬','스티커','바둑돌','도토리','색종이','블록','종이별','연필','딱지','조약돌','카드','나뭇잎','단추','색연필','퍼즐 조각','쿠키'];
function q(prompt,answer,wrong1,wrong2,explanation,detail){
 const choices=[answer,wrong1,wrong2].map(String);
 if(new Set(choices).size!==3)throw Error('Two equivalent text choices '+prompt+' '+choices);
 if(explanation.length<15)throw Error('Missing rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,detail};
}
const formula=(step,offset)=>'단계 수 × '+step+' + '+offset;
function make(kind,i){
 const who=actors[i],object=objects[i];
 switch(kind){
 case 'number-sequence':{
  const start=11+i*3,step=2+i%5,ans=start+step*3;
  return q('□에 들어갈 알맞은 수를 구하세요.',
   String(ans),String(ans+step),String(ans+2*step),
   '같은 수 '+step+'씩 커집니다. '+(start+2*step)+' 다음에 '+step+'을 더하면 '+ans+'입니다.',
   who+'의 수 배열: '+[start,start+step,start+2*step].join(' → ')+' → □');
 }
 case 'figure-count':{
  const start=1+i%4,step=1+Math.floor(i/4),ans=start+3*step;
  return q('같은 방법으로 도형을 늘릴 때 4단계에 필요한 작은 정사각형은 몇 개인가요?',
   ans+'개',(ans+step)+'개',(ans+step*2)+'개',
   '단계마다 작은 정사각형이 '+step+'개 늘어납니다. 4단계는 '+ans+'개입니다.',
   who+'의 배열: 1단계 '+'■'.repeat(start)+' ('+start+'개), 2단계 '+'■'.repeat(start+step)+' ('+(start+step)+'개), 3단계 '+'■'.repeat(start+step*2)+' ('+(start+step*2)+'개)');
 }
 case 'figure-formula':{
  const step=1+i%4,offset=1+Math.floor(i/4);
  const picture=[1,2,3].map(n=>n+'단계 '+'■'.repeat(n*step+offset)+' ('+(n*step+offset)+'개)').join(' / ');
  return q('같은 규칙으로 도형을 늘립니다. 어느 단계에서나 필요한 작은 정사각형 수를 나타낸 식은?',
    formula(step,offset),formula(step+1,offset),formula(step,offset+1),
    '단계 수를 한 단계 늘릴 때 '+step+'개씩 많아지므로 식은 ‘'+formula(step,offset)+'’입니다.',
    who+'의 정사각형 배열: '+picture);
 }
 case 'calculation-add':{
  const a=2+i,b=3+i%6,step=1+i%4,s=(a+3*step)+(b+3*step);
  const earlier=[0,1,2].map(j=>(a+j*step)+' + '+(b+j*step)+' = '+((a+j*step)+(b+j*step)));
  return q('계산식의 규칙을 이어 갈 때 □에 들어갈 값은?',
   String(s),String(s+step),String(s+2*step),
   '두 더하는 수가 각각 '+step+'씩 커져 합은 '+(2*step)+'씩 커집니다. 다음 합은 '+s+'입니다.',
   who+'의 기록: '+earlier.join(' / ')+' / '+(a+3*step)+' + '+(b+3*step)+' = □');
 }
 case 'calculation-mul':{
  const multiplier=2+i%7,start=1+Math.floor(i/7),n=start+3,ans=multiplier*n;
  return q('곱셈식의 규칙을 따라 □에 들어갈 값을 구하세요.',
   String(ans),String(ans+multiplier),String(ans+2*multiplier),
   multiplier+'의 곱셈구구는 '+multiplier+'씩 커집니다. '+multiplier+' × '+n+' = '+ans+'입니다.',
   who+'의 기록: '+[0,1,2].map(j=>multiplier+' × '+(start+j)+' = '+(multiplier*(start+j))).join(' / ')+' / '+multiplier+' × '+n+' = □');
 }
 case 'same-quantity':{
  const groups=3+i%5,each=2+Math.floor(i/5),total=groups*each;
  return q('같은 양을 나타내는 식으로 알맞은 것은?',
   each+' × '+groups,each+' + '+groups,each+' × '+(groups+1),
   '한 모둠에 '+each+'개씩 '+groups+'모둠이므로 '+each+' × '+groups+' = '+total+'개입니다.',
   who+'의 활동 기록: 물건은 '+object+'입니다. 한 모둠에 '+each+'개씩 '+groups+'모둠을 만들었습니다. 모두 '+total+'개입니다.');
 }
 case 'equation-check':{
  const groups=3+i%5,each=3+Math.floor(i/5),single=1+i%4,total=groups*each+single;
  return q('상황을 바르게 나타내고 값도 옳게 계산한 식은?',
   groups+' × '+each+' + '+single+' = '+total,
   groups+' + '+each+' + '+single+' = '+total,
   groups+' × ('+each+' + '+single+') = '+total,
   '상자 '+groups+'개의 물건 수는 '+groups+' × '+each+'개이고 낱개 '+single+'개를 더해야 합니다. 따라서 '+total+'개입니다.',
   who+'의 활동 기록: '+object+' '+each+'개씩 '+groups+'상자에 담고 낱개 '+single+'개를 따로 두었습니다.');
 }
 default:throw Error('Unknown grade four patterns '+kind);
 }
}
const lessons=[
 ['1. 수의 배열에서 규칙을 찾아요','number-sequence'],
 ['2. 모양의 배열에서 규칙을 찾아 수로 나타내요','figure-count'],
 ['3. 모양의 배열에서 규칙을 찾아 식으로 나타내요','figure-formula'],
 ['4. 계산식에서 규칙을 찾아요 (1) ','calculation-add'],
 ['5. 계산식에서 규칙을 찾아요 (2) ','calculation-mul'],
 ['6. 같은 양을 식으로 나타내요','same-quantity'],
 ['7. 식이 옳은지 알아봐요','equation-check']
];
for(const [lesson,kind]of lessons){
 const id='math-g4-algebra-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),
   knowledgeOnly:true,sourceLabel:'클라시트 창작 4학년 수·모양 규칙·식 문항 · 실제 도형 제작 수행평가 아님'}));
 if(new Set(items.map(x=>JSON.stringify([x.prompt,x.detail]))).size!==16)throw Error('Duplicate figure/number pattern '+id);
 banks.push({id,subject:'math',grades:[4],exactSemester:2,exactUnitName:'규칙 찾기와 식 만들기',
  exactLessonName:lesson.trim().replace(/^\d+\.\s*/,''),label:lesson.trim().replace(/^\d+\.\s*/,'')+' · 수와 식의 규칙',pattern:/^$/,items});
}
function register(target){for(const bank of banks){if(target.some(x=>x.id===bank.id))throw Error('Duplicate grade-four pattern bank '+bank.id);target.push(bank);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
