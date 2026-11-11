(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeFourPlaceValues=api;})(globalThis,()=>{
'use strict';
// Original grade-4 paper questions for the 2022 textbook's large number and
// decimal-place lessons. Integer values remain below Number.MAX_SAFE_INTEGER.
const banks=[];
const kids=['지호','민지','서아','준호','가은','하린','도윤','유나','지수','서준','다은','태오','예린','하윤','민호','윤서'];
const comma=n=>n.toLocaleString('ko-KR');
const dec=(a,d)=>Number(a/d).toFixed(Math.round(Math.log10(d)));
function q(prompt,answer,w1,w2,explanation,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Repeated choice in '+prompt+': '+choices);
 if(explanation.length<15)throw Error('Explanation absent '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
function numeric(prompt,answer,wrong1,wrong2,why,detail){
 return q(prompt,comma(answer),comma(wrong1),comma(wrong2),why,detail);
}
function make(kind,i){
 const kid=kids[i],n=i+1;
 switch(kind){
 case 'ten-thousand':{
  const blocks=i%9+1,additional=(i*137)%10000,val=blocks*10000+additional;
  return numeric('1만이 '+blocks+'개 있고, 낱수 '+additional+'이(가) 더 있습니다. 이 수는?',val,val+10000,val+1000,
   '1만은 10,000이므로 '+comma(blocks*10000)+'과 '+comma(additional)+'을 합해 '+comma(val)+'입니다.',
   kid+'가 만 단위와 낱수를 합쳐 수를 만들었습니다.');
 }
 case 'five-digit':{
  const count=i%8+1,thousands=2+i%7,hundreds=i%9+1,tens=(i*3)%10,ones=i%10;
  const val=count*10000+thousands*1000+hundreds*100+tens*10+ones;
  return numeric('만의 자리 '+count+', 천의 자리 '+thousands+', 백의 자리 '+hundreds+', 십의 자리 '+tens+', 일의 자리 '+ones+'인 수는?',
   val,val+1000,val+100,'각 자리 숫자에 자릿값을 곱해 모두 더하면 '+comma(val)+'입니다.',
   kid+'가 다섯 자리 수의 자릿값을 정리했습니다.');
 }
 case 'hundred-thousand':{
  const place=[100000,1000000,10000000][i%3],names=['십만','백만','천만'],name=names[i%3],blocks=2+Math.floor(i/3),val=place*blocks;
  return numeric(name+'이 '+blocks+'개이면 얼마인가요?',val,val+place,val+2*place,
   name+' 하나는 '+comma(place)+'이므로 '+blocks+'개는 '+comma(val)+'입니다.',
   kid+'가 '+name+' 단위로 수를 묶어 셌습니다.');
 }
 case 'hundred-million':{
  const eok=i%8+1,man=11+i*31,val=eok*100000000+man*10000;
  return numeric(eok+'억 '+man+'만을 숫자로 나타내면?',val,val+10000,val+100000000,
   '1억은 100,000,000이고 1만은 10,000이므로 두 수를 합하면 '+comma(val)+'입니다.',
   kid+'가 억과 만 단위를 구분하여 적었습니다.');
 }
 case 'trillion':{
  const jo=i%8+1,eok=20+i*7,val=jo*1e12+eok*1e8;
  return numeric(jo+'조 '+eok+'억을 숫자로 나타내면?',val,val+1e8,val+1e12,
   '조 단위는 1,000,000,000,000, 억 단위는 100,000,000입니다. 합하면 '+comma(val)+'입니다.',
   kid+'가 조와 억 단위로 수를 구분했습니다.');
 }
 case 'skip-count':{
  const step=[10000,100000,1000000,100000000][i%4],start=(i+12)*step,ans=start+3*step;
  return numeric('규칙에 따라 뛰어 세었습니다. □에 들어갈 수는?',ans,ans+step,ans+2*step,
   '앞 수에 '+comma(step)+'을 더하는 규칙입니다. 따라서 다음 수는 '+comma(ans)+'입니다.',
   '수의 배열: '+[start,start+step,start+2*step].map(comma).join(' → ')+' → □ / '+kid+'의 기록');
 }
 case 'big-compare':{
  const scale=[10000,100000,100000000,1000000000000][i%4],a=(i+13)*scale+(i*13+91),b=a+(i%5+2)*scale;
  const left=i%2===0?a:b,right=i%2===0?b:a,answer=left>right?'가':'나';
  return q('가와 나 중 더 큰 수는 무엇인가요?',answer,answer==='가'?'나':'가','두 수가 같다',
   '가 '+comma(left)+'와 나 '+comma(right)+'에서 높은 자리부터 비교하면 '+answer+'가 더 큽니다.',
   kid+'의 기록: 가 = '+comma(left)+' / 나 = '+comma(right));
 }
 case 'hundredths':{
  const parts=11+i*5,ans=parts/100;
  return q('0.01이 '+parts+'개인 수는 무엇인가요?',dec(parts,100),dec(parts+1,100),dec(parts+10,100),
   '0.01을 '+parts+'개 모으면 '+dec(parts,100)+'입니다. 1/100의 자릿값을 생각하세요.',
   kid+'가 100등분한 단위를 세었습니다.');
 }
 case 'thousandths':{
  const parts=105+i*37;
  return q('0.001이 '+parts+'개인 수는 무엇인가요?',dec(parts,1000),dec(parts+1,1000),dec(parts+10,1000),
   '0.001을 '+parts+'개 모으면 '+dec(parts,1000)+'입니다. 소수 셋째 자리까지 확인합니다.',
   kid+'가 1000등분한 단위를 세었습니다.');
 }
 case 'decimal-relations':{
  const mode=i%4,units=2+Math.floor(i/4),ratio=mode<2?10:100;
  const den=[100,1000,1000,100][mode],large=units*ratio/den,small=units/den;
  const label=mode===0?'소수 첫째 자리와 둘째 자리':mode===1?'소수 둘째 자리와 셋째 자리':mode===2?'소수 첫째 자리와 셋째 자리':'자릿값이 100배 차이인 두 소수';
  return q(dec(large,1)+'은 '+dec(small,1)+'의 몇 배인가요?',
   ratio+'배',(ratio===10?100:10)+'배','1배',
   dec(small,1)+'을 '+ratio+'배 하면 '+dec(large,1)+'입니다. 높은 자리로 갈수록 자릿값이 커집니다.',
   kid+'의 기록: '+label+'를 비교합니다.');
 }
 case 'decimal-compare':{
  const mode=i%4,a=1+Math.floor(i/4),unit=a/10;
  let x,y;
  if(mode===0){x=unit+0.01;y=unit+0.03;}
  else if(mode===1){x=unit+0.13;y=unit+0.02;}
  else if(mode===2){x=unit;y=unit;}
  else{x=unit+0.001;y=unit;}
  const left=(mode===2?x.toFixed(1):x.toFixed(3));
  const right=(mode===2?y.toFixed(2):y.toFixed(3));
  const answer=Number(left)>Number(right)?'가':Number(left)<Number(right)?'나':'두 수는 같다';
  const wrong=['가','나','두 수는 같다'].filter(c=>c!==answer);
  return q('소수 가와 나의 크기를 비교하면?',answer,wrong[0],wrong[1],
   '가 '+left+'와 나 '+right+'를 자릿값별로 비교하면 '+(answer==='두 수는 같다'?'같은 크기':'더 큰 수는 '+answer)+'입니다.',
   kid+'의 기록: 가 = '+left+' / 나 = '+right);
 }
 default:throw Error('Unknown grade-four place-value topic '+kind);
 }
}
const curriculum=[
 [1,'큰 수',[
  ['1. 만을 알아봐요','ten-thousand'],['2. 다섯 자리 수를 알아봐요','five-digit'],['3. 십만, 백만, 천만을 알아봐요','hundred-thousand'],
  ['4. 억을 알아봐요','hundred-million'],['5. 조를 알아봐요','trillion'],['6. 큰 수의 뛰어 세기를 해요','skip-count'],
  ['7. 큰 수의 크기를 비교해요','big-compare']
 ]],
 [2,'소수의 덧셈과 뺄셈',[
  ['1. 소수 두 자리 수를 알아봐요','hundredths'],['2. 소수 세 자리 수를 알아봐요','thousandths'],
  ['3. 소수 사이의 관계를 알아봐요','decimal-relations'],['4. 소수의 크기를 비교해요','decimal-compare']
 ]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 const id='math-g4-places-'+kind,items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),
   knowledgeOnly:true,sourceLabel:'클라시트 창작 4학년 큰 수·소수 학습 자료 · 실물 조작 수행평가 아님'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial]))).size!==16)throw Error('Repeated problem '+id);
 banks.push({id,subject:'math',grades:[4],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson.replace(/^\d+\.\s*/, ''),
  label:lesson.replace(/^\d+\.\s*/, '')+' · 큰 수와 소수의 자릿값',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate grade-four bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
