(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeOneNumberSense=api;})(globalThis,()=>{
'use strict';
// Grade-one counting, order, zero, place value, and parity: original short items.
// These use visible numeric records and words, not unprovided audio or pictures.
const banks=[];
const people=['서아','지호','하린','준호','가은','도윤','유나','민호','다은','태오','수아','지민','예린','하윤','윤서','서준'];
const objects=['구슬','딱지','블록','색연필','연필','지우개','리본','나뭇잎','단추','공깃돌','스티커','조약돌','색종이','카드','종이별','도토리'];
const items4=[['사과','배','귤','감'],['책','공책','연필','지우개'],['공','줄넘기','원반','고깔'],['꽃','나무','씨앗','풀'],['버스','기차','자동차','자전거'],['호랑이','토끼','고양이','강아지'],['하늘','바다','산','강'],['빨강','파랑','노랑','초록']];
const q=(prompt,answer,w1,w2,explanation,detail)=>{
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate grade-one options '+prompt+' '+choices);
 if(explanation.length<13)throw Error('Missing grade-one rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
};
const n=(prompt,answer,w1,w2,explanation,detail)=>q(prompt,String(answer),String(w1),String(w2),explanation,detail);
function make(kind,i){
 const name=people[i],o=objects[i];
 switch(kind){
 case 'one-five':{
  const count=i%5+1,wrong1=count%5+1,wrong2=(count+1)%5+1;
  return n(name+'가 '+o+'을/를 하나씩 세었습니다. 몇 개일까요?',count,wrong1,wrong2,
   '하나부터 '+count+'까지 차례로 세면 모두 '+count+'개입니다.','세어 볼 '+o+': '+'● '.repeat(count).trim());
 }
 case 'six-nine':{
  const count=6+i%4,wrong1=6+(i+1)%4,wrong2=6+(i+2)%4;
  return n(name+'가 '+o+'을/를 세었습니다. 모두 몇 개일까요?',count,wrong1,wrong2,
   '여섯부터 아홉까지의 수를 세면 '+count+'개입니다.','한 개씩 세어 보세요: '+'● '.repeat(count).trim());
 }
 case 'ordinal':{
  const group=items4[i%8],want=i%4;
  const nth=['첫째','둘째','셋째','넷째'][want],answer=group[want];
  return q('다음 순서에서 '+nth+'에 있는 것은 무엇인가요?',answer,group[(want+1)%4],group[(want+2)%4],
   '차례를 맨 앞부터 세면 '+nth+' 물건은 '+answer+'입니다.','차례: '+group.join(' → ')+' / '+name+'의 기록');
 }
 case 'order-nine':{
  const left=i%8+1;
  return n(name+'가 숫자를 차례대로 썼습니다. '+left+' 다음에 오는 수는?',left+1,left,left===1?3:left-1,
   left+' 다음에는 '+(left+1)+'이 옵니다.','연속된 자연수의 순서를 생각하세요. 기록 '+(i+1));
 }
 case 'one-bigger-smaller':{
  const v=i%7+2,up=i%2===0,ans=v+(up?1:-1);
  return n(v+'보다 1만큼 '+(up?'더 큰':'더 작은')+' 수는?',ans,v,up?v+2:v+1,
   up?v+'에서 하나 더 세면 '+ans+'입니다.':v+'에서 하나 거꾸로 세면 '+ans+'입니다.',
   name+'가 수직선의 이웃한 수를 확인했습니다.');
 }
 case 'zero':{
  const count=i%5+1;
  if(i%2===0)return n(name+'가 상자를 열었는데 '+o+'이/가 하나도 없었습니다. 이때 물건 수는?',0,1,2,
    '아무것도 없는 것은 수 0으로 나타냅니다.','빈 상자에는 '+o+'이/가 없습니다. 기록 '+(i+1));
  return n('빈 상자(0개)에 '+o+' '+count+'개를 넣었습니다. 이제 모두 몇 개인가요?',count,count+1,count+2,
    '0개에 '+count+'개를 더하면 '+count+'개입니다.','0+'+count+'='+count+'이므로 수가 늘어난 만큼만 셉니다.');
 }
 case 'after-nine':{
  if(i%2===0)return n(name+'가 '+o+'을/를 9개 세고 한 개를 더 찾았습니다. 모두 몇 개인가요?',10,9,8,
   '9개보다 하나 많으면 10개입니다.','9개와 1개를 합쳐 10개를 만듭니다. 기록 '+(i+1));
  return n(name+'가 '+o+'을/를 10개 모았는데 하나를 나누어 주었습니다. 남은 것은?',9,10,8,
   '10개에서 하나를 빼면 9개입니다.','10개는 9개보다 하나 많습니다. 기록 '+(i+1));
 }
 case 'teens':{
  const ones=i%9+1,val=10+ones;
  return n('10개씩 한 묶음과 '+o+' 낱개 '+ones+'개가 있습니다. 모두 몇 개인가요?',val,val+1,val-1,
   '10개와 '+ones+'개를 합하면 '+val+'개입니다.','십몇은 10과 낱개 수를 합해 나타냅니다.');
 }
 case 'split-teens':{
  const parts=i%9+1,val=10+parts;
  return n(name+'가 '+o+' '+val+'개를 10개 한 묶음과 낱개로 나누었습니다. 낱개는?',parts,parts+1,parts+2,
   val+'개에서 10개를 한 묶음으로 만들면 '+parts+'개가 남습니다.');
 }
 case 'bundles-ten':{
  const amount=i%5+1,ans=amount*10,wrong1=(amount%5+1)*10,wrong2=((amount+1)%5+1)*10;
  return n('10개씩 묶은 '+o+' 묶음이 '+amount+'개 있습니다. 모두 몇 개인가요?',ans,wrong1,wrong2,
   '10개짜리 '+amount+'묶음은 '+ans+'개입니다.','같은 크기의 10개 묶음으로 세었습니다. '+name+'의 기록');
 }
 case 'count-fifty':{
  const val=11+i*2,tens=Math.floor(val/10),ones=val%10;
  return n('10개짜리 묶음 '+tens+'개와 낱개 '+ones+'개를 합친 수는?',val,val+1,val+2,
   tens+'×10+'+ones+'='+val+'이므로 '+val+'입니다.',
   name+'가 '+o+'의 수를 세었습니다.');
 }
 case 'order-fifty':{
  const first=15+i*2,ans=first+1;
  return n('연속된 수 '+first+', □, '+(first+2)+'에서 □에 들어갈 수는?',ans,first,first+2,
   first+' 다음 수는 '+ans+'이고 그다음 수는 '+(first+2)+'입니다.','수는 1씩 커집니다. '+name+'의 문제');
 }
 case 'tens-sixty-ninety':{
  const groups=6+i%4,ans=groups*10,other1=(6+(i+1)%4)*10,other2=(6+(i+2)%4)*10;
  return n('10개씩 묶은 '+o+'이/가 '+groups+'묶음 있습니다. 모두 몇 개인가요?',ans,other1,other2,
   '10개 묶음이 '+groups+'개이므로 '+ans+'개입니다.','십 단위로 세기: '+name+'의 기록');
 }
 case 'upto-ninety-nine':{
  const val=40+i*3,tens=Math.floor(val/10),ones=val%10;
  return n('십의 자리 숫자가 '+tens+'이고 일의 자리 숫자가 '+ones+'인 수는?',val,val+1,val+2,
   tens+'개의 십과 '+ones+'개의 일은 '+val+'입니다.','자릿값을 생각해 쓰세요. '+name+'의 기록');
 }
 case 'order-ninety-nine':{
  const val=61+i*2,ans=val+1;
  return n('숫자 '+val+' 다음에 오는 수는?',ans,val,val+2,
   val+'에서 하나 더 세면 '+ans+'이 됩니다.','100보다 작은 수의 순서입니다. '+name+'의 연습');
 }
 case 'parity':{
  const val=20+i*3,ans=val%2===0?'짝수':'홀수',wrong=ans==='짝수'?'홀수':'짝수';
  return q('수 '+val+'은 짝수와 홀수 중 무엇인가요?',ans,wrong,'둘 다 해당한다',
   val+'개를 2개씩 묶으면 '+(val%2===0?'하나도 남지 않으므로 짝수':'하나가 남으므로 홀수')+'입니다.','짝을 두 개씩 지어 생각해 보세요. '+name+'의 문제');
 }
 default:throw Error('Unknown number sense lesson '+kind);
 }
}
const curriculum=[
 [1,'9까지의 수',[['1, 2, 3, 4, 5를 알아볼까요','one-five'],['6, 7, 8, 9를 알아볼까요','six-nine'],['순서를 알아볼까요','ordinal'],['수의 순서를 알아볼까요','order-nine'],['1만큼 더 큰 수와 1만큼 더 작은 수를 알아볼까요','one-bigger-smaller'],['0을 알아볼까요','zero']]],
 [1,'50까지의 수',[['9 다음 수를 알아볼까요','after-nine'],['십몇을 알아볼까요','teens'],['모으기와 가르기를 해 볼까요','split-teens'],['10개씩 묶어 세어 볼까요','bundles-ten'],['50까지의 수를 세어 볼까요','count-fifty'],['50까지 수의 순서를 알아볼까요','order-fifty']]],
 [2,'100까지의 수',[['60, 70, 80, 90을 알아볼까요','tens-sixty-ninety'],['99까지의 수를 알아볼까요','upto-ninety-nine'],['수의 순서를 알아볼까요','order-ninety-nine'],['짝수와 홀수를 알아볼까요','parity']]]
];
for(const [semester,unit,lessons] of curriculum)for(const [lesson,kind] of lessons){
 const id='math-g1-number-'+semester+'-'+kind;
 const rows=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
   sourceLabel:'클라시트 창작 1학년 수 세기 문항 · 실물 조작 평가 아님'}));
 const uniqueness=rows.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial]));
 if(new Set(uniqueness).size!==rows.length)throw Error('Duplicated counting example '+id);
 banks.push({id,subject:'math',grades:[1],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
   label:lesson+' · 수 감각과 수의 순서',pattern:/^$/,items:rows});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Repeated grade-one bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
