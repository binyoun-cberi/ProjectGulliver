(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeThreeConcepts=api;})(globalThis,()=>{
'use strict';
// Original grade-three textbook drills, scoped by exact unit, semester and lesson.
// Written exercises are explicitly not substitutes for physical drawing/measurement.
const banks=[];
function q(prompt,answer,w1,w2,explanation,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate answers: '+prompt+' '+choices);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
const num=(p,a,step,unit,why,detail)=>q(p,a+unit,(a+step)+unit,(a+2*step)+unit,why,detail);
const ids='ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
const kids=['하린','민호','서아','윤재','도윤','가은','하준','유나','수아','준호','지민','태오','다은','지호','소율','하윤'];
function make(kind,i){
 const n=i+2, k=i%4+2, child=kids[i], a=ids[i],b=ids[i+1],c=ids[i+2];
 switch(kind){
 case 'line':{
  const type=i%3,names=['선분','반직선','직선'];
  const detail=type===0?'두 점 '+a+'와 '+b+'가 양 끝점이며 두 점 사이만 곧게 잇습니다.':type===1?'점 '+a+'에서 시작하여 점 '+b+'를 지나 한 방향으로 끝없이 뻗습니다.':'점 '+a+'와 점 '+b+'를 지나 양쪽으로 끝없이 뻗습니다.';
  return q('설명에 맞는 선의 이름은?',names[type],names[(type+1)%3],names[(type+2)%3],
   ['두 끝점 사이의 곧은 부분은 선분입니다.','한 점에서 출발해 한쪽으로 끝없이 뻗은 선은 반직선입니다.','양쪽으로 끝없이 뻗은 곧은 선은 직선입니다.'][type],detail);
 }
 case 'angle':return q('각 ∠'+a+b+c+'의 꼭짓점은 어디인가요?','점 '+b,'점 '+a,'점 '+c,'각의 이름에서 가운데 글자가 꼭짓점이므로 '+b+'입니다.');
 case 'right-angle':{
  const examples=['책의 모서리','네모난 창틀의 모서리','직사각형 책상의 모서리','정사각형 종이의 모서리','모눈종이 가로줄과 세로줄이 만나는 부분','네모난 칠판의 모서리','사각형 타일의 직각 모서리','수첩의 모서리'];
  return q(child+'가 '+examples[i%8]+'를 살펴보았습니다. 두 선이 서로 직각으로 만날 때 만들어지는 각은?','직각','두 선이 휘어지는 부분','한 직선 위에 놓인 두 선',
   '두 선이 만나 직각을 이룬다면 그 각을 직각이라고 합니다.');
 }
 case 'right-triangle':{
  const answer=['가','나','다'][i%3],others=['가','나','다'].filter(x=>x!==answer);
  return q(child+'가 분류한 삼각형 중 직각삼각형은?',answer,others[0],others[1],
   answer+' 삼각형에는 직각이 한 개 있으므로 직각삼각형입니다.',
   '가: 직각 '+(answer==='가'?1:0)+'개 / 나: 직각 '+(answer==='나'?1:0)+'개 / 다: 직각 '+(answer==='다'?1:0)+'개');
 }
 case 'rectangle':{
  const x=n+3,y=n+6;return q('가로 '+x+' cm, 세로 '+y+' cm이고 네 각이 모두 직각인 사각형의 알맞은 이름은?','직사각형','직각삼각형','정삼각형',
   '네 각이 모두 직각인 사각형은 직사각형입니다. 이웃하는 변의 길이는 서로 다릅니다.');
 }
 case 'square':{
  const x=n+4;return q('네 변이 모두 '+x+' cm이고 네 각이 모두 직각인 사각형의 가장 구체적인 이름은?','정사각형','정삼각형','직각삼각형',
   '네 변의 길이가 모두 같고 네 각이 모두 직각이므로 정사각형입니다.');
 }
 case 'mm':return i%2===0?num(n+' cm는 몇 mm인가요?',n*10,10,' mm','1 cm=10 mm이므로 '+n+'×10='+n*10+' mm입니다.'):num(n*10+' mm는 몇 cm인가요?',n,1,' cm','10 mm=1 cm이므로 '+n+' cm입니다.');
 case 'km':return i%2===0?num(n+' km는 몇 m인가요?',n*1000,1000,' m','1 km=1000 m이므로 '+n+' km는 '+n*1000+' m입니다.'):num(n*1000+' m는 몇 km인가요?',n,1,' km','1,000 m=1 km이므로 '+n+' km입니다.');
 case 'estimate-length':{
  const contexts=[
  ['연필 한 자루','약 15 cm','약 15 mm','약 15 m'],
  ['교실 문 높이','약 2 m','약 2 mm','약 2 km'],
  ['칠판의 가로 길이','약 3 m','약 3 cm','약 3 km'],
  ['지우개 한 개 길이','약 5 cm','약 5 mm','약 5 m'],
  ['운동장 달리기 직선 구간','약 50 m','약 50 mm','약 50 km'],
  ['두 도시 사이의 도로 거리','약 100 km','약 100 cm','약 100 mm'],
  ['책가방의 높이','약 35 cm','약 35 mm','약 35 m'],
  ['교실 책상 높이','약 70 cm','약 70 mm','약 70 m'],
  ['복도 길이','약 30 m','약 30 cm','약 30 km'],
  ['30 cm 자의 길이','약 30 cm','약 30 mm','약 30 m'],
  ['운동화 한 짝 길이','약 25 cm','약 25 mm','약 25 m'],
  ['큰 가로수 높이','약 10 m','약 10 cm','약 10 mm'],
  ['색연필 길이','약 18 cm','약 18 mm','약 18 m'],
  ['일반적인 공책 가로 길이','약 20 cm','약 20 mm','약 20 m'],
  ['교실의 가로 길이','약 8 m','약 8 cm','약 8 km'],
  ['종이컵의 높이','약 10 cm','약 10 mm','약 10 m']
  ];
  const [thing,answer,w1,w2]=contexts[i];
  return q(thing+'를 어림한 길이로 가장 알맞은 것은?',answer,w1,w2,'실제 물건의 크기와 단위를 생각하면 '+answer+' 정도가 적절합니다.');
 }
 case 'seconds':return i%2===0?num(n+'분은 몇 초인가요?',n*60,60,'초','1분은 60초이므로 '+n*60+'초입니다.'):num(n*60+'초는 몇 분인가요?',n,1,'분','60초가 1분이므로 '+n+'분입니다.');
 case 'time-add':{
  const m=2+i%4,s=37+i%17,t=30+i%11,total=s+t,ans=(m+Math.floor(total/60))+'분 '+total%60+'초';
  return q(m+'분 '+s+'초에 '+t+'초를 더하면 얼마인가요?',ans,m+'분 '+total+'초',(m+Math.floor(total/60)+1)+'분 '+total%60+'초',
    s+'+'+t+'='+(s+t)+'초입니다. 60초를 1분으로 바꾸면 '+ans+'입니다.');
 }
 case 'time-sub':{
  const m=3+i%4,s=10+i%13,t=35+i%12,total=m*60+s-t,ans=Math.floor(total/60)+'분 '+total%60+'초';
  return q(m+'분 '+s+'초에서 '+t+'초를 빼면?',ans,m+'분 '+(t-s)+'초',(Math.floor(total/60)+1)+'분 '+total%60+'초',
    '1분을 60초로 바꾸어 빼면 '+ans+'입니다.');
 }
 case 'equal-part':{
  const parts=n+2;return q('빵 한 개를 똑같은 크기의 '+parts+'조각으로 나누었습니다. 한 조각은 빵 한 개의 얼마인가요?',
    '1/'+parts,parts+'/1','1/'+(parts+1),'전체를 같은 크기의 '+parts+'조각으로 나누었으므로 한 조각은 1/'+parts+'입니다.');
 }
 case 'fraction-basic':{
  const den=n+4,top=i%3+1,mode=i%2,correct=mode?top:den,wrong=mode?den:top;
  return q(top+'/'+den+'의 '+(mode?'분자':'분모')+'는 얼마인가요?',String(correct),String(wrong),String(correct+1),
   (mode?'분자는 선택한 부분의 수':'분모는 전체를 똑같이 나눈 수')+'를 뜻합니다.');
 }
 case 'fraction-parts':{
  const den=n+4,top=i%4+1;
  return q('같은 크기의 '+den+'칸 중 '+top+'칸을 색칠했습니다. 색칠한 부분을 나타낸 분수는?',top+'/'+den,den+'/'+top,(top+1)+'/'+den,
   '전체 '+den+'칸은 분모, 색칠한 '+top+'칸은 분자입니다.');
 }
 case 'unit-fraction':{
  const den=n+2;
  return q('단위분수 1/'+den+'의 분자는 얼마인가요?','1',String(den),'0',
   '단위분수는 분자가 1인 분수입니다. 따라서 1/'+den+'의 분자는 1입니다.');
 }
 case 'fraction-compare':{
  const den=n+4,top=i%3+1;
  return i%2===0?q(top+'/'+den+'과 '+(top+1)+'/'+den+' 중 큰 분수는?',(top+1)+'/'+den,top+'/'+den,'크기가 같다',
    '분모가 같으면 분자가 큰 분수가 더 큽니다.'):
   q('1/'+den+'과 1/'+(den+1)+' 중 큰 분수는?','1/'+den,'1/'+(den+1),'크기가 같다',
    '분자가 1로 같으면 분모가 작은 분수가 더 큽니다.');
 }
 case 'decimal-first':{
  const tenth=i%9+1;
  return i<9?q(tenth+'/10을 소수로 나타내면?','0.'+tenth,'0.0'+tenth,tenth+'.0',
    '분모가 10인 분수 '+tenth+'/10은 0.'+tenth+'입니다.'):
    q('0.'+tenth+'을 분수로 나타내면?',tenth+'/10',tenth+'/100','10/'+tenth,
    '소수 첫째 자리는 10분의 몇을 나타내므로 '+tenth+'/10입니다.');
 }
 case 'decimal-second':{
  const whole=n,tenth=i%9+1;
  return q(whole+'과 '+tenth+'/10을 합해 소수로 나타내면?',whole+'.'+tenth,(whole+1)+'.'+tenth,whole+'.0'+tenth,
   whole+'에 0.'+tenth+'을 더하면 '+whole+'.'+tenth+'입니다.');
 }
 case 'decimal-compare':{
  const whole=Math.floor(i/5),small=i%5+1,big=small+3;
  return q(whole+'.'+small+'과 '+whole+'.'+big+' 중 큰 수는?',whole+'.'+big,whole+'.'+small,'크기가 같다',
   '소수 첫째 자리에서 '+big+'가 '+small+'보다 크므로 '+whole+'.'+big+'가 더 큽니다.');
 }
 case 'circle-radius':{
  const r=n+2;return num('중심에서 원 위의 한 점까지의 거리가 '+r+' cm입니다. 이 원의 반지름은 몇 cm인가요?',r,1,' cm',
   '원의 중심에서 원 위의 점까지 이은 선분의 길이가 반지름입니다.');
 }
 case 'circle-diameter':{
  const r=n+2;return num('반지름 '+r+' cm인 원의 지름은 몇 cm인가요?',2*r,2,' cm',
   '지름은 반지름의 두 배이므로 '+r+'×2='+(2*r)+' cm입니다.');
 }
 case 'weight-compare':{
  const kg=n+1,grams=kg*1000+(i%2===0?500:-500),ans=i%2===0?'나':'가';
  return q('가와 나 중 더 무거운 물체는 무엇인가요?',ans,ans==='가'?'나':'가','무게가 같다',
   '1 kg=1000 g입니다. 가의 무게 '+kg*1000+' g과 나의 '+grams+' g을 비교하면 '+ans+'가 더 무겁습니다.',
   '가: '+kg+' kg / 나: '+grams+' g');
 }
 case 'weight-units':return i%2===0?num(n+' kg는 몇 g인가요?',n*1000,1000,' g',
    '1 kg는 1000 g이므로 '+n*1000+' g입니다.'):num(n+' t은 몇 kg인가요?',n*1000,1000,' kg',
    '1 t은 1000 kg이므로 '+n*1000+' kg입니다.');
 case 'weight-operate':{
  const kg=i%3+2,gram=200+i*10;
  if(i%2===0){const more=850+i*10,total=gram+more;
   return q(kg+' kg '+gram+' g에 '+more+' g을 더하면?',(kg+1)+' kg '+(total-1000)+' g',kg+' kg '+total+' g',(kg+2)+' kg '+(total-1000)+' g',
    '1,000 g을 1 kg으로 바꾸어 더하면 '+(kg+1)+' kg '+(total-1000)+' g입니다.');}
  return q(kg+' kg '+gram+' g에서 '+(gram-100)+' g을 빼면?',kg+' kg 100 g',kg+' kg '+(gram+(gram-100))+' g',(kg+1)+' kg 100 g',
   gram+'-'+(gram-100)+'=100 g이므로 '+kg+' kg 100 g이 남습니다.');
 }
 case 'capacity-compare':{
  const litres=n+1,ml=litres*1000+(i%2===0?500:-500),ans=i%2===0?'나':'가';
  return q('다음 두 물통 중 물이 더 많이 들어 있는 것은?',ans,ans==='가'?'나':'가','양이 같다',
    '가의 '+litres+' L는 '+litres*1000+' mL입니다. 이를 나의 '+ml+' mL와 비교합니다.',
    '가 물통: '+litres+' L / 나 물통: '+ml+' mL');
 }
 case 'capacity-units':return i%2===0?num(n+' L는 몇 mL인가요?',n*1000,1000,' mL',
    '1 L=1000 mL이므로 '+n*1000+' mL입니다.'):num(n*1000+' mL는 몇 L인가요?',n,1,' L',
    '1000 mL=1 L이므로 '+n+' L입니다.');
 case 'capacity-operate':{
  const litre=i%4+2,ml=250+i*10;
  if(i%2===0){const plus=800+i*5,total=ml+plus,ans=(litre+Math.floor(total/1000))+' L '+(total%1000)+' mL';
   return q(litre+' L '+ml+' mL에 '+plus+' mL를 더하면?',ans,litre+' L '+total+' mL',(litre+2)+' L '+total%1000+' mL',
    '1,000 mL를 1 L로 바꾸어 나타내면 '+ans+'입니다.');}
  const take=150+i*5,answer=ml-take;
  return q(litre+' L '+ml+' mL에서 '+take+' mL를 빼면?',litre+' L '+answer+' mL',litre+' L '+(ml+take)+' mL',(litre+1)+' L '+answer+' mL',
   'mL끼리 빼면 '+answer+' mL가 남으므로 '+litre+' L '+answer+' mL입니다.');
 }
 default:throw Error('Unknown skill '+kind);
 }
}
const list=[
 [1,'평면도형',[['선분, 반직선, 직선을 알아봐요','line'],['각을 알아봐요','angle'],['직각을 알아봐요','right-angle'],['직각삼각형을 알아봐요','right-triangle'],['직사각형을 알아봐요','rectangle'],['정사각형을 알아봐요','square']]],
 [1,'길이와 시간',[['mm를 알아봐요','mm'],['km를 알아봐요','km'],['길이를 어림해요','estimate-length'],['초를 알아봐요','seconds'],['시간의 덧셈과 뺄셈을 해요 (1)','time-add'],['시간의 덧셈과 뺄셈을 해요 (2)','time-sub']]],
 [1,'분수와 소수',[['전체를 똑같이 나누어요','equal-part'],['분수를 알아봐요','fraction-basic'],['분수로 나타내요','fraction-parts'],['단위분수를 알아봐요','unit-fraction'],['분수의 크기를 비교해요','fraction-compare'],['소수를 알아봐요 (1)','decimal-first'],['소수를 알아봐요 (2)','decimal-second'],['소수의 크기를 비교해요','decimal-compare']]],
 [2,'원',[['원의 중심과 반지름을 알아봐요','circle-radius'],['지름을 알아봐요','circle-diameter']]],
 [2,'무게와 들이',[['무게를 비교해요','weight-compare'],['kg, g, t을 알아봐요','weight-units'],['무게의 덧셈과 뺄셈을 해요','weight-operate'],['들이를 비교해요','capacity-compare'],['L, mL를 알아봐요','capacity-units'],['들이의 덧셈과 뺄셈을 해요','capacity-operate']]]
];
for(const [semester,unit,lessons]of list)for(const [lesson,kind]of lessons){
 const id='math-g3-basics-'+kind,amount=kind==='decimal-first'?18:16;
 const items=Array.from({length:amount},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),
  knowledgeOnly:true,sourceLabel:'클라시트 창작 수학 기본 문항 · 실제 측정·작도 아님'}));
 if(new Set(items.map(x=>JSON.stringify([x.prompt,x.detail]))).size!==amount)throw Error('Duplicate prompt '+id);
 banks.push({id,subject:'math',grades:[3],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
  label:lesson+' · 기본 개념과 계산',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate grade-three bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
