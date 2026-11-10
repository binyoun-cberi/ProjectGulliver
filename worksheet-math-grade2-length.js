(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeTwoLength=api;})(globalThis,()=>{
'use strict';
// Scope: numerical reading, reasoning and unit conversions for second-grade
// length lessons; a printed exercise does not replace using an actual ruler.
const banks=[];
const people=['하린','민호','서아','도윤','가은','유나','준호','지수','태오','예린','민지','서준','다은','하윤','지호','윤서'];
const objects=['연필','색연필','색종이','막대','리본','필통','책','종이띠','블록','우유갑','실','끈','자','공책','카드','나무 조각'];
const unitAnswers=[
 ['연필 한 자루','약 15 cm','약 150 cm','약 1 cm'],
 ['지우개 한 개','약 4 cm','약 40 cm','약 1 m'],
 ['교실 문 높이','약 2 m','약 2 cm','약 20 m'],
 ['복도의 길이','약 20 m','약 20 cm','약 2 cm'],
 ['검지의 너비','약 2 cm','약 20 cm','약 2 m'],
 ['공책의 가로 길이','약 20 cm','약 2 cm','약 2 m'],
 ['방석의 한 변 길이','약 40 cm','약 4 cm','약 4 m'],
 ['운동화 한 짝 길이','약 23 cm','약 2 cm','약 23 m'],
 ['승용차의 전체 길이','약 4 m','약 4 cm','약 40 m'],
 ['밥숟가락의 길이','약 18 cm','약 1 cm','약 18 m'],
 ['작은 가로수의 높이','약 3 m','약 3 cm','약 30 m'],
 ['책상 높이','약 70 cm','약 7 cm','약 7 m'],
 ['교실의 가로 길이','약 7 m','약 7 cm','약 70 m'],
 ['어린이 칫솔 길이','약 18 cm','약 2 cm','약 18 m'],
 ['500 mL 물병의 높이','약 20 cm','약 2 cm','약 20 m'],
 ['실내화 한 짝 길이','약 20 cm','약 2 m','약 1 cm']
];
const howRuler=[
 ['물건의 왼쪽 끝이 자의 0 눈금에 놓여 있습니다.','물건의 오른쪽 끝이 가리키는 눈금을 읽는다','자가 굽어 있어도 그대로 읽는다','눈금 사이를 임의로 크게 그린다'],
 ['자의 0 눈금과 물건의 한쪽 끝이 어긋나 있습니다.','물건의 한쪽 끝을 0 눈금에 맞추어 다시 잰다','자의 길이를 마음대로 늘려 읽는다','눈금을 보지 않고 길이를 정한다'],
 ['물건의 길이를 cm로 잴 때 주의할 점은?','자를 물건에 곧게 대고 눈금을 확인한다','자를 대각선으로 기울여 잰다','자의 단위를 확인하지 않는다'],
 ['자로 긴 종이띠를 재려고 합니다.','종이띠를 펴 놓고 자를 나란히 댄다','종이띠를 구부린 채 잰다','종이띠 위에 자를 세워 둔다'],
 ['물건 끝이 자의 8 cm 눈금에 놓여 있습니다. 시작은 0 cm입니다.','물건의 길이를 8 cm라고 읽는다','물건의 길이를 0 cm라고 읽는다','물건의 길이를 80 cm라고 읽는다'],
 ['눈금을 읽을 때 눈이 자와 멀리 떨어져 있습니다.','눈금을 바르게 바라보며 다시 확인한다','아무 눈금이나 마음대로 고른다','자의 방향을 바꾸지 않고 뒤집어 쓴다'],
 ['자를 이용해 물건 두 개의 길이를 비교합니다.','같은 단위로 잰 길이를 비교한다','서로 다른 단위를 확인하지 않고 숫자만 비교한다','눈금 대신 물건의 색을 비교한다'],
 ['종이띠의 길이가 한 번에 자의 끝까지 닿지 않습니다.','잰 길이를 표시한 뒤 이어서 재고 더한다','첫 번째에 잰 길이만 전체 길이라고 한다','자의 길이가 바뀐다고 생각한다'],
 ['자에서 1 cm 간격은 어떤 부분인가요?','이웃한 센티미터 눈금 사이','자에 쓰인 모든 숫자를 더한 값','자의 두꺼운 부분'],
 ['물건 끝이 자의 12 cm 눈금에 놓여 있습니다. 시작은 0 cm입니다.','물건의 길이는 12 cm이다','물건의 길이는 12 m이다','물건의 길이는 1 cm이다'],
 ['길이가 다른 두 물건을 같은 자로 잽니다.','끝점과 단위를 같은 기준으로 확인한다','첫 번째 물건만 눈금을 읽는다','긴 물건은 자를 사용하지 않는다'],
 ['긴 리본의 길이를 자로 여러 번 나누어 잽니다.','잰 각 부분의 길이를 모두 더한다','마지막에 잰 부분만 길이라고 한다','길이를 더하지 않고 가장 큰 숫자만 쓴다'],
 ['자에서 0 cm와 5 cm 사이를 물건이 차지합니다.','5 cm만큼의 길이라고 읽는다','0 cm만큼이라고 읽는다','50 cm만큼이라고 읽는다'],
 ['종이의 모서리부터 끝까지 잽니다.','자의 한쪽 기준점을 종이의 모서리에 맞춘다','자를 종이와 떨어뜨려 놓는다','종이의 가운데부터 대충 잰다'],
 ['두 물건의 길이를 잴 때 다른 자를 사용했습니다.','눈금 단위가 같은지 확인한 뒤 비교한다','자마다 눈금 하나의 길이가 달라도 무시한다','단위 대신 자의 색을 비교한다'],
 ['책의 가로 길이를 재려고 합니다.','책의 가로 방향에 맞추어 자를 곧게 댄다','자의 길이를 추측해서 적는다','책을 움직이는 동안 눈금을 계속 읽는다']
];
function item(prompt,answer,w1,w2,explanation,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Equivalent-looking length answers '+prompt+' '+choices);
 if(explanation.length<16)throw Error('Missing length rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
function number(prompt,answer,step,unit,why,detail){return item(prompt,answer+unit,(answer+step)+unit,(answer+step*2)+unit,why,detail);}
function make(kind,i){
 const who=people[i],object=objects[i],a=3+i%5,b=6+i%7;
 switch(kind){
 case 'compare':{
  const x=5+i,y=x+3+i%4;
  return item(who+'가 잰 두 물건 중 더 긴 것은 무엇인가요?','나','가','길이가 같다',
   '가가 '+x+' cm, 나가 '+y+' cm이므로 더 긴 것은 나입니다.',
   '가의 길이: '+x+' cm / 나의 길이: '+y+' cm / 물건: '+object);
 }
 case 'nonstandard':{
  const piece=['똑같은 종이 클립','똑같은 작은 블록','똑같은 나무 토막','똑같은 종이띠 조각'][i%4],count=i+3;
  return number(object+'의 길이를 '+piece+'으로 재니 '+count+'개가 들어갔습니다. 측정한 길이는?',count,1,'개',
   '같은 크기의 단위 '+count+'개를 이어 놓았으므로 '+count+'개 길이입니다.','단위: '+piece+'. 사이에 틈이 없습니다.');
 }
 case 'one-centimeter':{
  const n=i+2,mode=i%2;return mode===0?
   number('자에서 0 cm부터 '+n+' cm까지의 간격은 몇 cm인가요?',n,1,' cm',
    '0 cm에서 '+n+' cm까지는 '+n+' cm 길이입니다.'):
   number('자에서 '+(n+1)+' cm부터 '+(n+5)+' cm까지의 간격은 몇 cm인가요?',4,1,' cm',
    '끝 눈금 '+(n+5)+'에서 시작 눈금 '+(n+1)+'을 빼면 4 cm입니다.','자로 잴 때 시작 눈금이 0이 아닐 수도 있습니다.');
 }
 case 'ruler-method':{
  const [s,a,b,c]=howRuler[i];return item('자를 이용해 길이를 재는 방법으로 알맞은 것은?',a,b,c,
   '길이를 바르게 재려면 자와 물건을 곧게 놓고 눈금의 시작·끝을 정확히 읽어야 합니다. '+a,s);
 }
 case 'ruler-read':{
  const start=i%3,end=start+i+4,answer=end-start;
  return number(who+'가 자에 '+object+'을 곧게 놓았습니다. 한쪽 끝이 '+start+' cm, 다른 끝이 '+end+' cm일 때 길이는?',answer,1,' cm',
   '끝 눈금에서 시작 눈금을 빼면 '+end+'-'+start+'='+answer+' cm입니다.','실제로 자를 조작하는 활동이 아닌 숫자로 읽는 연습입니다.');
 }
 case 'estimate':{
  const [thing,a,b,c]=unitAnswers[i];return item(thing+'의 길이를 어림한 것으로 가장 알맞은 것은?',a,b,c,
   thing+'의 크기를 생각하면 '+a+' 정도가 적절합니다. 실제 크기는 물건마다 조금 다를 수 있습니다.');
 }
 case 'meter-unit':{
  const n=2+Math.floor(i/2);
  return i%2===0?number(n+' m를 cm로 나타내면?',n*100,100,' cm',
     '1 m는 100 cm이므로 '+n+'×100='+(n*100)+' cm입니다.'):
    number(n*100+' cm를 m로 나타내면?',n,1,' m',
     '100 cm는 1 m이므로 '+(n*100)+' cm는 '+n+' m입니다.');
 }
 case 'ruler-read-advanced':{
  const start=i%4+1,end=start+i+7;
  return number('자로 길이를 재었더니 '+object+'이 '+start+' cm 눈금에서 시작해 '+end+' cm 눈금까지 닿았습니다. 길이는?',end-start,1,' cm',
   '시작 눈금이 0이 아니므로 '+end+'-'+start+'='+(end-start)+' cm로 계산합니다.');
 }
 case 'add-length':{
  const m1=1+i%3,c1=12+i*3,m2=1+i%2,c2=24+(i%5)*9,c=c1+c2,total=m1+m2+Math.floor(c/100),remaining=c%100;
  return item(m1+' m '+c1+' cm와 '+m2+' m '+c2+' cm를 이어 붙인 길이는?',
   total+' m '+remaining+' cm',total+' m '+(remaining+1)+' cm',(total+1)+' m '+remaining+' cm',
   '센티미터를 더한 값이 100 이상이면 100 cm를 1 m로 바꾸어 더합니다. 결과는 '+total+' m '+remaining+' cm입니다.');
 }
 case 'subtract-length':{
  const m1=4+i%3,c1=10+(i%4)*10,m2=1+i%2,c2=50+(i%5)*8;
  const total=(m1-m2-1)*100+(100+c1-c2),resm=Math.floor(total/100),resc=total%100;
  return item(m1+' m '+c1+' cm인 리본에서 '+m2+' m '+c2+' cm를 잘라 냈습니다. 남은 길이는?',
    resm+' m '+resc+' cm',resm+' m '+(resc+1)+' cm',(resm+1)+' m '+resc+' cm',
    '센티미터가 부족할 때 1 m를 100 cm로 바꾸어 뺍니다. 남은 길이는 '+resm+' m '+resc+' cm입니다.');
 }
 case 'estimate-meter':{
  const [thing,a,b,c]=unitAnswers[i];
  return item('1 m가 100 cm임을 생각하며 '+thing+'의 길이를 어림한 것으로 가장 알맞은 것은?',a,b,c,
   '물건의 크기와 m·cm 단위를 함께 살피면 '+a+' 정도가 알맞습니다.');
 }
 case 'estimate-check':{
  const estimate=10+i*2,real=estimate+(i%4+2),difference=real-estimate;
  return number(object+'의 길이를 '+estimate+' cm로 어림했는데 실제 기록은 '+real+' cm였습니다. 어림한 값과 실제 값의 차이는?',
   difference,1,' cm',
   real+' cm에서 '+estimate+' cm를 빼면 '+difference+' cm 차이입니다.','어림값을 실제 값과 비교해 보세요.');
 }
 default:throw Error('Unknown grade-two measurement '+kind);
 }
}
const curriculum=[
 [1,'길이 재기',[
  ['길이를 비교하는 방법을 알아볼까요','compare'],
  ['여러 가지 단위로 길이를 재어 볼까요','nonstandard'],
  ['1 cm를 알아볼까요','one-centimeter'],
  ['자로 길이를 재는 방법을 알아볼까요','ruler-method'],
  ['자로 길이를 재어 볼까요','ruler-read'],
  ['길이를 어림하고 어떻게 어림했는지 말해 볼까요','estimate']
 ]],
 [2,'길이 재기',[
  ['cm보다 더 큰 단위를 알아볼까요','meter-unit'],
  ['자로 길이를 재어 볼까요','ruler-read-advanced'],
  ['길이의 합을 구해 볼까요','add-length'],
  ['길이의 차를 구해 볼까요','subtract-length'],
  ['길이를 어림해 볼까요(1)','estimate-meter'],
  ['길이를 어림해 볼까요(2)','estimate-check']
 ]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 const id='math-g2-length-'+semester+'-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 창작 2학년 길이 개념 문제 · 실제 길이 재기 수행평가 아님'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail]))).size!==16)throw Error('Repeated measurement question '+id);
 banks.push({id,subject:'math',grades:[2],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
  label:lesson+' · 길이 개념과 계산',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Repeated grade-two length bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
