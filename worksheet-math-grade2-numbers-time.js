(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeTwoNumbersTime=api;})(globalThis,()=>{
'use strict';
// Original grade-two paper exercises for place value and time concepts.
// Textual clock descriptions are not scored as actual clock-reading performance.
const banks=[];
const people=['수아','준호','하린','민재','지우','다은','서준','예린','가은','태오','민서','하윤','지민','도윤','하준','유나'];
const things=['구슬','도토리','스티커','색종이','딱지','블록','카드','단추','연필','조약돌','종이별','퍼즐 조각','씨앗','종이컵','공깃돌','바둑돌'];
const days=['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];
function item(prompt,answer,w1,w2,explanation,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicated options '+prompt+' '+choices);
 if(!explanation||explanation.length<10)throw Error('Missing explanation '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
const numeric=(prompt,answer,step,unit,explanation)=>item(prompt,answer+unit,(answer+step)+unit,(answer+step*2)+unit,explanation);
const number=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const clock=(h,m)=>h+'시 '+String(m).padStart(2,'0')+'분';
const digital=(h,m)=>h+':'+String(m).padStart(2,'0');
function make(kind,i){
 const n=i+2,who=people[i],what=things[i],h=2+i%8,tt=i%5+1,u=i%9+1;
 switch(kind){
 case 'one-hundred':{
  return i%2===0?item('10개씩 들어 있는 '+what+' 묶음이 10개 있습니다. 모두 몇 개인가요?','100개','10개','1,000개',
   '10개씩 10묶음이므로 10×10=100개입니다.'):
  numeric('100에서 '+n+'을 뺐다가 다시 '+n+'을 더하면 얼마인가요?',100,10,'',
   '같은 수를 빼고 다시 더하면 원래 수인 100입니다.');
 }
 case 'hundreds':{
  const count=i%8+2,ans=count*100;
  return i<8?numeric('100이 '+count+'개 모이면 얼마인가요?',ans,100,'',
   '100을 '+count+'번 더한 수는 '+ans+'입니다.'):
   numeric(count+'백을 숫자로 나타내면?',ans,100,'',
    count+'백은 100이 '+count+'개이므로 '+ans+'입니다.');
 }
 case 'three-digit':{
  const hundreds=Math.floor(i/5)+2,tens=i%5+1,ones=i%9+1,val=hundreds*100+tens*10+ones;
  return numeric('백이 '+hundreds+'개, 십이 '+tens+'개, 일이 '+ones+'개인 수는?',val,10,'',
   hundreds*100+'+'+tens*10+'+'+ones+'='+val+'입니다.');
 }
 case 'place-three':{
  const hundreds=Math.floor(i/5)+2,tens=i%5+3,ones=i%7+1,val=hundreds*100+tens*10+ones;
  const mode=i%3,digit=[hundreds,tens,ones][mode],answer=digit*[100,10,1][mode];
  const other=mode===0?[digit,digit*10]:mode===1?[digit,digit*100]:[digit*10,digit*100];
  return item('수 '+val+'에서 '+['백','십','일'][mode]+'의 자리 숫자 '+digit+'은 얼마를 나타내나요?',String(answer),String(other[0]),String(other[1]),
   ['백의 자리 숫자는 100의 개수를 나타냅니다.','십의 자리 숫자는 10의 개수를 나타냅니다.','일의 자리 숫자는 1의 개수를 나타냅니다.'][mode]);
 }
 case 'skip-three':{
  const start=200+i*13,step=[1,10,100][i%3],jumps=i%4+2,answer=start+step*jumps;
  return numeric(start+'에서 '+step+'씩 '+jumps+'번 뛰어 세면 어떤 수가 되나요?',answer,step,'',
   step+'을 '+jumps+'번 더하므로 '+start+'+'+(step*jumps)+'='+answer+'입니다.');
 }
 case 'compare-three':{
  const a=213+i*27,b=a+20+i%5,answer=i%2===0?b:a;
  return item('세 자리 수 '+(i%2===0?a:b)+'와 '+(i%2===0?b:a)+' 중 더 큰 수는 무엇인가요?',String(b),String(a),'크기가 같다',
   '백의 자리부터 차례로 비교하면 '+b+'가 '+a+'보다 큽니다.');
 }
 case 'one-thousand':{
  return i%2===0?item('100개씩 들어 있는 '+what+' 묶음이 10개 있습니다. 모두 몇 개인가요?','1,000개','100개','10,000개',
   '100개가 10묶음이므로 100×10=1,000개입니다.'):
   numeric('1,000에서 '+n+'을 뺐다가 다시 '+n+'을 더한 수는?',1000,100,'',
   '같은 수를 빼고 더하므로 다시 1,000이 됩니다.');
 }
 case 'thousands':{
  const k=i%8+2,ans=k*1000;
  return i<8?item('천이 '+k+'개면 숫자로 얼마인가요?',number(ans),number(ans+1000),number(ans+2000),
    '1,000이 '+k+'개이므로 '+number(ans)+'입니다.'):
   item(k+'천을 숫자로 나타내면?',number(ans),number(ans+1000),number(ans-1000),
    k+'천은 1,000이 '+k+'개이므로 '+number(ans)+'입니다.');
 }
 case 'four-digit':{
  const thousands=i%7+2,hundreds=Math.floor(i/7)+1,tens=i%5+1,ones=i%9+1;
  const value=thousands*1000+hundreds*100+tens*10+ones;
  return numeric('천이 '+thousands+'개, 백이 '+hundreds+'개, 십이 '+tens+'개, 일이 '+ones+'개인 수는?',value,10,'',
    thousands*1000+'+'+hundreds*100+'+'+tens*10+'+'+ones+'='+value+'입니다.');
 }
 case 'place-four':{
  const thousands=i%6+2,hundreds=i%5+3,tens=i%4+2,ones=i%7+1,val=thousands*1000+hundreds*100+tens*10+ones;
  const mode=i%4,digits=[thousands,hundreds,tens,ones],place=[1000,100,10,1][mode],answer=digits[mode]*place;
  return item(number(val)+'에서 '+['천','백','십','일'][mode]+'의 자리 숫자 '+digits[mode]+'은 얼마를 나타내나요?',
   number(answer),number(digits[mode]*(mode===3?10:1)),number(answer+place),
   ['천','백','십','일'][mode]+'의 자리는 '+number(place)+'의 개수를 나타내므로 '+number(answer)+'입니다.');
 }
 case 'skip-four':{
  const start=2200+i*121,step=[1,10,100,1000][i%4],jumps=i%3+2,ans=start+step*jumps;
  return numeric(number(start)+'에서 '+number(step)+'씩 '+jumps+'번 뛰어 세면?',ans,step,'',
   number(start)+'에 '+number(step*jumps)+'을 더하므로 '+number(ans)+'입니다.');
 }
 case 'compare-four':{
  const a=2310+i*111,b=a+100+i%7,ans=b;
  return item('네 자리 수 '+number(i%2===0?a:b)+'와 '+number(i%2===0?b:a)+' 중 더 큰 수는?',number(ans),number(a),'크기가 같다',
   '앞자리부터 비교하면 '+number(b)+'가 '+number(a)+'보다 큽니다.');
 }
 case 'clock-five':{
  const hour=i%12+1,minutes=(i%11+1)*5,next=hour===12?1:hour+1;
  return item('시계에서 시침은 '+hour+'과 '+next+' 사이에, 분침은 숫자 '+minutes/5+'를 가리킵니다. 시각은?',
   clock(hour,minutes),clock(hour,minutes/5),clock(next,minutes),
   '시침은 '+hour+'시를 지났고 분침이 '+minutes/5+'를 가리키므로 '+minutes+'분입니다.');
 }
 case 'clock-minute':{
  const hour=i%12+1,base=(i%10)*5,extra=i%4+1,minute=base+extra,next=hour===12?1:hour+1;
  return item('시침이 '+hour+'과 '+next+' 사이에 있고, 분침은 숫자 '+base/5+'에서 작은 눈금 '+extra+'칸 더 움직였습니다. 지금 시각은?',
   clock(hour,minute),clock(hour,base),clock(next,minute),
   '분침은 '+base+'분에서 '+extra+'분 더 움직였으므로 '+minute+'분입니다.');
 }
 case 'clock-writing':{
  const hour=i%12+1,min=(i%10)*5+1,display=digital(hour,min);
  return item('시각을 숫자와 쌍점(:)으로 나타내세요. '+clock(hour,min),display,digital(hour,min+1),digital(hour===12?1:hour+1,min),
   hour+'시 '+min+'분은 '+display+'로 나타냅니다.');
 }
 case 'hours':{
  const hours=i%8+1,minutes=hours*60;
  return i<8?numeric(hours+'시간은 몇 분인가요?',minutes,60,'분','1시간은 60분이므로 '+hours+'×60='+minutes+'분입니다.'):
   numeric(minutes+'분은 몇 시간인가요?',hours,1,'시간','60분이 1시간이므로 '+minutes+'분은 '+hours+'시간입니다.');
 }
 case 'elapsed':{
  const startHour=8+i%4,startMinute=5+i%4*10,duration=15+i*3;
  const all=startMinute+duration,finishHour=startHour+Math.floor(all/60),finishMinute=all%60;
  return item(clock(startHour,startMinute)+'부터 '+clock(finishHour,finishMinute)+'까지 걸린 시간은?',
   duration+'분',(duration+5)+'분',(duration-5)+'분',
   '시작 시각에서 끝 시각까지 지난 시간을 세면 '+duration+'분입니다.');
 }
 case 'day-hour':{
  if(i<8){const hour=i+2,answer=hour+12;
   return item('오후 '+hour+'시를 24시간제로 나타내면?',answer+'시',(answer-1)+'시',(answer+1)+'시',
    '오후 '+hour+'시에는 12시간을 더해 '+answer+'시로 나타냅니다.');
  }
  const afternoon=i-7,clock24=afternoon+12;
  return item('24시간제로 '+clock24+'시는 오후 몇 시인가요?','오후 '+afternoon+'시','오후 '+(afternoon+1)+'시','오후 '+(afternoon+2)+'시',
    '12를 빼면 오후 '+afternoon+'시입니다.');
 }
 case 'calendar':{
  const date=i+2,idx=(date-1)%7,ans=days[idx];
  return item('이달 1일이 월요일이라면 이달 '+date+'일은 무슨 요일인가요?',ans,days[(idx+1)%7],days[(idx+2)%7],
    '1일에서 '+(date-1)+'일이 지난 뒤의 요일을 7일마다 되풀이하여 찾으면 '+ans+'입니다.');
 }
 default:throw Error('Unknown grade-two topic '+kind);
 }
}
const curriculum=[
 [1,'세 자리 수',[['백을 알아볼까요','one-hundred'],['몇백을 알아볼까요','hundreds'],['세 자리 수를 알아볼까요','three-digit'],['각 자리의 숫자는 얼마를 나타낼까요','place-three'],['뛰어 세어 볼까요','skip-three'],['수의 크기를 비교해 볼까요','compare-three']]],
 [2,'네 자리 수',[['천을 알아볼까요','one-thousand'],['몇천을 알아볼까요','thousands'],['네 자리 수를 알아볼까요','four-digit'],['각 자리의 숫자는 얼마를 나타낼까요','place-four'],['뛰어 세어 볼까요','skip-four'],['수의 크기를 비교해 볼까요','compare-four']]],
 [2,'시각과 시간',[['몇 시 몇 분을 읽어 볼까요(1)','clock-five'],['몇 시 몇 분을 읽어 볼까요(2)','clock-minute'],['여러 가지 방법으로 시각을 읽어 볼까요','clock-writing'],['1시간을 알아볼까요','hours'],['걸린 시간을 알아볼까요','elapsed'],['하루의 시간을 알아볼까요','day-hour'],['달력을 알아볼까요','calendar']]]
];
for(const [semester,unit,lessons]of curriculum)for(const [name,kind]of lessons){
 const id='math-g2-places-'+semester+'-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
   sourceLabel:'클라시트 창작 초등 2학년 수학 문항 · 시계 모형 조작 실기 아님'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail]))).size!==16)throw Error('Duplicate lesson prompt '+id);
 banks.push({id,subject:'math',grades:[2],exactSemester:semester,exactUnitName:unit,exactLessonName:name,
  label:name+' · 기초 수 개념과 시각 문제',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate grade-two bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
