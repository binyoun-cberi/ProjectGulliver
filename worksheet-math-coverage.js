(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathCoverage=api;})(globalThis,()=>{
'use strict';
// Original arithmetic word problems and number-data questions. These banks are
// attached only to exact textbook unit/lesson titles, never by broad keywords.
// The textbook table of contents is a navigation aid, not a copied question source.
const banks=[];
const gcd=(a,b)=>b?gcd(b,a%b):a;
const lcm=(a,b)=>a/gcd(a,b)*b;
const frac=(a,b)=>{const d=gcd(a,b);return b/d===1?String(a/d):(a/d)+'/'+(b/d);};
const money=n=>n.toLocaleString('ko-KR');
const nice=n=>Number(n.toFixed(2)).toString();
function number(prompt,answer,why,unit='',step=1){
 const a=Number(answer),alt=a-step>=0?a-step:a+2*step;
 return [prompt,nice(a)+unit,nice(a+step)+unit,nice(alt)+unit,why];
}
function choose(prompt,answer,wrong1,wrong2,why){return [prompt,String(answer),String(wrong1),String(wrong2),why];}
function make(kind,i){
 const n=i+2,a=(i%7)+3,b=(i%5)+2,t=(i%4)+2;
 switch(kind){
  case 'divisor':{
   const value=n*6;const wrong=[];for(let d=2;d<value;d++)if(value%d!==0&&d!==n)wrong.push(d);
   return choose(value+'의 약수인 수는 어느 것인가요?',n,wrong[i%wrong.length],wrong[(i+7)%wrong.length],value+'는 '+n+'×6이므로 '+n+'은 약수입니다.');
  }
  case 'multiple':return number(n+'의 '+t+'배는 얼마인가요?',n*t,n+'을 '+t+'번 더하면 '+(n*t)+'입니다.','',n);
  case 'gcd':return number(2*n+'과 '+3*n+'의 최대공약수는 얼마인가요?',n,'두 수는 각각 2×'+n+', 3×'+n+'이므로 최대공약수는 '+n+'입니다.');
  case 'lcm':return number(2*n+'과 '+3*n+'의 최소공배수는 얼마인가요?',6*n,'2와 3의 최소공배수 6에 '+n+'을 곱하면 '+6*n+'입니다.','',n);
  case 'equivalent':{
   const d=a+2,k=t;return choose(a+'/'+d+'와 크기가 같은 분수는 어느 것인가요?',a*k+'/'+(d*k),(a*k+1)+'/'+(d*k),(a*k)+'/'+(d*k+1),'분자와 분모에 똑같이 '+k+'를 곱해도 분수의 크기는 같습니다.');
  }
  case 'reduce':{
   const p=(n+2)*6,q=(n+4)*6,ans=frac(p,q);return choose(p+'/'+q+'를 기약분수로 나타내면 무엇인가요?',ans,(frac(p,q).split('/').map((v,j)=>j===0?String(Number(v)+1):v).join('/')),(frac(p,q).split('/').map((v,j)=>j===1?String(Number(v)+1):v).join('/')),'분자와 분모를 최대공약수로 나누면 '+ans+'입니다.');
  }
  case 'common-denominator':{
   const x=2*(n+2),y=3*(n+2),k=lcm(x,y);return number('1/'+x+'과 1/'+y+'를 통분할 때 사용할 수 있는 가장 작은 공통 분모는 얼마인가요?',k,'두 분모 '+x+', '+y+'의 최소공배수는 '+k+'입니다.','',a);
  }
  case 'compare-frac':return choose('1/'+(n+1)+'과 1/'+(n+2)+' 중 더 큰 분수는 무엇인가요?','1/'+(n+1),'1/'+(n+2),'크기가 같다','분자가 1로 같으면 분모가 작은 쪽이 더 큽니다.');
  case 'compare-decimal':{
   const p=(n+2)/10,q=(n+3)/10,left=i%2===0?'분수':'소수',right=left==='분수'?'소수':'분수';
   const lhs=left==='분수'?(n+2)+'/10':nice(q),rhs=right==='분수'?(n+2)+'/10':nice(q);
   return choose(lhs+'와 '+rhs+'의 크기를 비교한 결과로 알맞은 것은?',right==='소수'?'소수가 더 크다':'소수가 더 크다','분수가 더 크다','크기가 같다',(n+2)+'/10은 '+nice(p)+'이고 소수는 '+nice(q)+'이므로 소수가 더 큽니다.');
  }
  case 'perimeter-rectangle':{
   const x=n+3,y=b+2;return number('가로 '+x+' cm, 세로 '+y+' cm인 직사각형의 둘레는 몇 cm인가요?',2*(x+y),'가로와 세로를 각각 두 번 더하면 '+(2*(x+y))+' cm입니다.',' cm',2);
  }
  case 'perimeter-polygon':{
   const side=n+2,sides=(i%3)+3;return number('한 변이 '+side+' cm인 정'+['삼','사','오'][sides-3]+'각형의 둘레는 몇 cm인가요?',side*sides,'모든 변의 길이가 같으므로 '+side+'×'+sides+'='+(side*sides)+'입니다.',' cm',side);
  }
  case 'square-centimeter':{
   const x=n+2,y=b+2;return number('한 변이 1 cm인 정사각형을 가로 '+x+'개, 세로 '+y+'개로 빈틈없이 놓았습니다. 전체 넓이는 몇 cm²인가요?',x*y,'1 cm²인 칸 '+(x*y)+'개의 넓이는 '+(x*y)+' cm²입니다.',' cm²',x);
  }
  case 'area-rectangle':{
   const x=n+3,y=b+2;return number('가로 '+x+' cm, 세로 '+y+' cm인 직사각형의 넓이는 몇 cm²인가요?',x*y,x+'×'+y+'='+(x*y)+'이므로 넓이는 '+(x*y)+' cm²입니다.',' cm²',x);
  }
  case 'area-units':{
   const value=n;return i%2===0?number(value+' m²는 몇 cm²인가요?',value*10000,'1 m²는 10,000 cm²이므로 '+value+' m²는 '+money(value*10000)+' cm²입니다.',' cm²',10000):number(value+' km²는 몇 m²인가요?',value*1000000,'1 km²는 1,000,000 m²입니다.',' m²',1000000);
  }
  case 'area-parallelogram':{
   const base=n+2,height=b+2;return number('밑변 '+base+' cm, 높이 '+height+' cm인 평행사변형의 넓이는 몇 cm²인가요?',base*height,'평행사변형의 넓이는 밑변×높이입니다.',' cm²',base);
  }
  case 'area-triangle':{
   const base=2*(n+2),height=b+2;return number('밑변 '+base+' cm, 높이 '+height+' cm인 삼각형의 넓이는 몇 cm²인가요?',base*height/2,'밑변×높이÷2로 계산합니다.',' cm²',base/2);
  }
  case 'area-trapezoid':{
   const upper=n+2,lower=n+6,height=2*(b+1),ans=(upper+lower)*height/2;
   return number('윗변 '+upper+' cm, 아랫변 '+lower+' cm, 높이 '+height+' cm인 사다리꼴의 넓이는 몇 cm²인가요?',ans,'(윗변+아랫변)×높이÷2로 계산합니다.',' cm²',height);
  }
  case 'area-rhombus':{
   const x=2*(n+2),y=2*(b+2);return number('두 대각선의 길이가 '+x+' cm와 '+y+' cm인 마름모의 넓이는 몇 cm²인가요?',x*y/2,'두 대각선 길이의 곱을 2로 나눕니다.',' cm²',x);
  }
  case 'at-least':{
   const lo=10+n,hi=lo+6;return choose(lo+' 이상 '+hi+' 이하인 자연수는 어느 것인가요?',lo+3,lo-1,hi+1,lo+'과 '+hi+'도 범위에 포함되며 '+(lo+3)+'은 그 사이에 있습니다.');
  }
  case 'greater-than':{
   const lo=10+n,hi=lo+6;return choose(lo+' 초과 '+hi+' 미만인 자연수는 어느 것인가요?',lo+2,lo,hi,lo+'과 '+hi+'는 포함하지 않고 그 사이에 있는 수를 고릅니다.');
  }
  case 'range-application':{
   const min=20+n,max=min+7;return choose('도서관 체험은 '+min+'명 이상 '+max+'명 이하일 때 진행할 수 있습니다. 참가 인원 중 조건에 맞는 것은?',min+4+'명',(min-1)+'명',(max+1)+'명',(min+4)+'명은 정해진 범위에 들어갑니다.');
  }
  case 'ceiling':{
   const x=100+n*17;return number(x+'를 십의 자리까지 올림하면 얼마인가요?',Math.ceil(x/10)*10,'일의 자리에 0이 아닌 수가 있으면 다음 십의 자리 수로 올립니다.','',10);
  }
  case 'floor':{
   const x=100+n*17;return number(x+'를 십의 자리까지 버림하면 얼마인가요?',Math.floor(x/10)*10,'일의 자리 이하를 버리고 십의 자리까지 남깁니다.','',10);
  }
  case 'round':{
   const x=100+n*17;return number(x+'를 십의 자리까지 반올림하면 얼마인가요?',Math.round(x/10)*10,'일의 자리가 5 이상이면 올리고, 4 이하면 버립니다.','',10);
  }
  case 'round-application':{
   const x=105+n*17;return number('학생 '+x+'명의 수를 십의 자리까지 반올림하면 약 몇 명인가요?',Math.round(x/10)*10,'일의 자리를 기준으로 십의 자리까지 반올림합니다.','명',10);
  }
  case 'average-interpret':{
   const mean=n+6,values=[mean-3,mean-1,mean+1,mean+3],context=['책을 읽은 쪽수','받아쓰기 맞힌 낱말 수','식물의 잎 수','줄넘기 성공 횟수','모은 카드 수'][i%5];
   if(i%3===0)return number('네 학생의 '+context+'가 '+values.join(', ')+'입니다. 평균은 얼마인가요?',mean,'합계 '+(mean*4)+'를 4로 나누면 '+mean+'입니다.');
   if(i%3===1)return number('네 학생의 '+context+'가 '+values.join(', ')+'입니다. 평균보다 큰 기록은 몇 개인가요?',2,'평균 '+mean+'보다 큰 기록은 '+(mean+1)+'과 '+(mean+3)+'입니다.','개');
   return number('네 학생의 '+context+'가 '+values.join(', ')+'입니다. 각 기록에 2를 더하면 평균은 얼마인가요?',mean+2,'모든 자료에 2를 더하면 평균도 2만큼 커집니다.');
  }
  case 'chance-judgment':{
   const red=n+2,blue=red+(i%3===0?0:i%3===1?2:-1),detail='크기가 같은 빨강 카드 '+red+'장, 파랑 카드 '+blue+'장을 섞어 한 장을 뽑습니다.';
   const outcomes=['빨강이 나올 가능성이 더 크다','파랑이 나올 가능성이 더 크다','두 색의 가능성이 같다'];
   const answer=red>blue?outcomes[0]:blue>red?outcomes[1]:outcomes[2];
   return choose(detail+' 알맞은 판단은 무엇인가요?',answer,...outcomes.filter(x=>x!==answer),red+'장과 '+blue+'장을 비교하면 '+answer+'.');
  }
  case 'ratio':{
   const x=n+2,y=n+5;return choose('빨강 구슬 '+x+'개와 파랑 구슬 '+y+'개의 수를 빨강:파랑의 비로 나타내면?',x+':'+y,y+':'+x,x+':'+(x+y),'빨강의 수를 앞에, 파랑의 수를 뒤에 적습니다.');
  }
  case 'rate':{
   const base=(n+5)*10,compare=n+5;return choose('기준량이 '+base+'이고 비교하는 양이 '+compare+'일 때 비율은?', '0.1','0.01','10',compare+'÷'+base+'=0.1입니다.');
  }
  case 'rate-context':{
   const total=(n+4)*10,yes=(n+4)*2;return choose('학생 '+total+'명 중 '+yes+'명이 도보로 등교합니다. 전체 학생에 대한 도보 등교 학생의 비율은?', '0.2','0.5','2',yes+'÷'+total+'=0.2입니다.');
  }
  case 'percent':{
   const p=2*(n+1);return choose('비율 '+nice(p/100)+'를 백분율로 나타내면?',p+'%',(p+10)+'%',nice(p/100)+'%',nice(p/100)+'×100='+p+'%입니다.');
  }
  case 'percent-context':{
   const total=(n+5)*10,yes=(n+5)*3;return choose('전체 '+total+'명 중 '+yes+'명이 참여했습니다. 참여한 사람의 비율을 백분율로 나타내면?','30%','3%','70%',yes+'÷'+total+'×100=30%입니다.');
  }
  case 'surface-area':{
   const x=n+3,y=b+2,z=t+2,ans=2*(x*y+y*z+z*x);
   return number('가로 '+x+' cm, 세로 '+y+' cm, 높이 '+z+' cm인 직육면체의 겉넓이는 몇 cm²인가요?',ans,'세 쌍의 마주 보는 면을 더하면 2×('+x+'×'+y+'+'+y+'×'+z+'+'+z+'×'+x+')='+ans+'입니다.',' cm²',2);
  }
  case 'cubic-centimeter':{
   const x=n+2,y=b+2,z=t+2;return number('한 모서리의 길이가 1 cm인 정육면체를 가로 '+x+'개, 세로 '+y+'개, 높이 '+z+'개로 쌓았습니다. 부피는 몇 cm³인가요?',x*y*z,'1 cm³짜리 정육면체가 '+(x*y*z)+'개이므로 '+(x*y*z)+' cm³입니다.',' cm³',x);
  }
  case 'cuboid-volume':{
   const x=n+2,y=b+2,z=t+2;return number('가로 '+x+' cm, 세로 '+y+' cm, 높이 '+z+' cm인 직육면체의 부피는 몇 cm³인가요?',x*y*z,x+'×'+y+'×'+z+'='+(x*y*z)+' cm³입니다.',' cm³',x);
  }
  case 'cubic-meter':return number(n+' m³는 몇 cm³인가요?',n*1000000,'1 m³는 1,000,000 cm³입니다.',' cm³',1000000);
  case 'ratio-property':{
   const x=n+1,y=n+4,k=t;return choose(x+':'+y+'와 크기가 같은 비는 무엇인가요?',x*k+':'+y*k,(x*k)+':'+y,x+':'+y*k,'전항과 후항에 같은 수 '+k+'를 곱하면 비율이 같습니다.');
  }
  case 'ratio-apply':{
   const x=n+1,y=n+4,k=t;return number(x+':'+y+' = '+(x*k)+':□에서 □의 값은?',y*k,'비의 두 항에 같은 수 '+k+'를 곱합니다.');
  }
  case 'proportion':{
   const x=n+1,y=n+4,k=t;return choose(x+':'+y+' = '+(x*k)+':'+(y*k)+'를 나타내는 말로 알맞은 것은?','두 비의 비율이 같다','앞의 비율이 더 크다','뒤의 비율이 더 크다','전항과 후항에 모두 '+k+'를 곱했으므로 두 비율은 같습니다.');
  }
  case 'proportion-property':{
   const x=n+1,y=n+4,k=t;return number(x+':'+y+' = '+(x*k)+':□일 때 □의 값은?',y*k,'비례식에서 내항의 곱과 외항의 곱이 같으므로 □='+(y*k)+'입니다.');
  }
  case 'proportion-use':{
   const apples=n+2,baskets=3;return number('사과 '+apples+'개가 한 봉지에 들어 있습니다. 같은 수로 담은 '+baskets+'봉지에는 사과가 모두 몇 개인가요?',apples*baskets,apples+':1 = □:'+baskets+'에서 □='+(apples*baskets)+'입니다.','개',apples);
  }
  case 'proportion-share':{
   const k=n+2,total=5*k;return number(total+'개의 구슬을 두 모둠에 2:3으로 나눕니다. 첫째 모둠은 몇 개를 받나요?',2*k,'전체를 5부분으로 나누고 그중 2부분을 받으므로 '+(2*k)+'개입니다.','개',k);
  }
  case 'circle-ratio':{
   const d=n+3,c=nice(3.14*d);return choose('지름 '+d+' cm인 원의 원주를 지름으로 나눈 값으로 알맞은 것은? (원주율 3.14)','3.14','6.28','1.57','원주÷지름은 원주율로 약 3.14입니다.');
  }
  case 'circle-circumference':{
   const diameter=2*(n+2),cent=314*diameter/100;return number('지름 '+diameter+' cm인 원의 원주는 몇 cm인가요? (원주율 3.14)',cent,'지름×원주율은 '+diameter+'×3.14='+nice(cent)+'입니다.',' cm',3.14);
  }
  case 'circle-area-estimate':{
   const r=n+2,estimate=3*r*r;return number('반지름 '+r+' cm인 원의 넓이를 원주율을 3으로 어림하여 구하면 약 몇 cm²인가요?',estimate,'원 넓이≈반지름×반지름×3으로 어림하면 '+estimate+'입니다.',' cm²',r);
  }
  case 'circle-area':{
   const r=n+2,area=nice(3.14*r*r);return number('반지름 '+r+' cm인 원의 넓이는 몇 cm²인가요? (원주율 3.14)',area,'원 넓이='+r+'×'+r+'×3.14='+area+'입니다.',' cm²',3.14);
  }
  case 'circle-area-use':{
   const r=n+2,area=nice(3.14*r*r/2);return number('반지름 '+r+' cm인 반원의 넓이는 몇 cm²인가요? (원주율 3.14)',area,'원의 넓이를 구한 뒤 2로 나누면 '+area+'입니다.',' cm²',1.57);
  }
  default:throw Error('Unknown textbook maths goal '+kind);
 }
}
function add(grade,semester,unit,lessons,kind,label){
 for(const [index,lesson] of lessons.entries()){
  const id='math-coverage-'+grade+'-'+semester+'-'+kind+'-'+index;
  const items=Array.from({length:25},(_,i)=>{
   const [prompt,answer,w1,w2,explanation]=make(kind,i+index*2);
   const choices=[answer,w1,w2];
   if(!prompt||!answer||!explanation||new Set(choices).size!==3)throw Error('Invalid math problem '+id+' #'+i+': '+choices);
   return {evidenceId:id+'-'+(i+1),prompt,answer,choices,explanation,
    knowledgeOnly:true,sourceLabel:'클라시트 창작 수학 문제 · 교과서 문항 복제 없음'};
  });
  if(new Set(items.map(q=>q.prompt)).size!==items.length)throw Error('Repeated math prompt '+id);
  banks.push({id,subject:'math',grades:[grade],exactSemester:semester,exactUnitName:unit,
   exactLessonName:lesson,label,pattern:/^$/,items});
 }
}
const m=(g,s,u,ls,k,label)=>add(g,s,u,ls,k,label);
m(5,1,'약수와 배수',['약수를 알아봐요'],'divisor','약수 판별');
m(5,1,'약수와 배수',['배수를 알아봐요'],'multiple','배수 구하기');
m(5,1,'약수와 배수',['공약수와 최대공약수를 알아봐요'],'gcd','최대공약수 계산');
m(5,1,'약수와 배수',['공배수와 최소공배수를 알아봐요'],'lcm','최소공배수 계산');
m(5,1,'약분과 통분',['크기가 같은 분수를 알아봐요'],'equivalent','크기가 같은 분수');
m(5,1,'약분과 통분',['약분을 알아봐요'],'reduce','기약분수 구하기');
m(5,1,'약분과 통분',['통분을 알아봐요'],'common-denominator','최소공통분모');
m(5,1,'약분과 통분',['분수의 크기를 비교해요'],'compare-frac','단위분수의 크기 비교');
m(5,1,'약분과 통분',['분수와 소수의 크기를 비교해요'],'compare-decimal','분수와 소수의 크기 비교');
m(5,1,'다각형의 둘레와 넓이',['다각형의 둘레를 구해요 (1)'],'perimeter-rectangle','직사각형 둘레');
m(5,1,'다각형의 둘레와 넓이',['다각형의 둘레를 구해요 (2)'],'perimeter-polygon','정다각형 둘레');
m(5,1,'다각형의 둘레와 넓이',['cm²를 알아봐요'],'square-centimeter','제곱센티미터');
m(5,1,'다각형의 둘레와 넓이',['직사각형의 넓이를 구해요'],'area-rectangle','직사각형의 넓이');
m(5,1,'다각형의 둘레와 넓이',['m², km²를 알아봐요'],'area-units','넓이 단위 변환');
m(5,1,'다각형의 둘레와 넓이',['평행사변형의 넓이를 구해요'],'area-parallelogram','평행사변형의 넓이');
m(5,1,'다각형의 둘레와 넓이',['삼각형의 넓이를 구해요'],'area-triangle','삼각형의 넓이');
m(5,1,'다각형의 둘레와 넓이',['사다리꼴의 넓이를 구해요'],'area-trapezoid','사다리꼴의 넓이');
m(5,1,'다각형의 둘레와 넓이',['마름모의 넓이를 구해요'],'area-rhombus','마름모의 넓이');
m(5,2,'수의 범위와 어림하기',['이상과 이하를 알아봐요'],'at-least','이상과 이하 판별');
m(5,2,'수의 범위와 어림하기',['초과와 미만을 알아봐요'],'greater-than','초과와 미만 판별');
m(5,2,'수의 범위와 어림하기',['수의 범위를 활용해요'],'range-application','생활 속 수의 범위');
m(5,2,'수의 범위와 어림하기',['올림을 알아봐요'],'ceiling','십의 자리까지 올림');
m(5,2,'수의 범위와 어림하기',['버림을 알아봐요'],'floor','십의 자리까지 버림');
m(5,2,'수의 범위와 어림하기',['반올림을 알아봐요'],'round','십의 자리까지 반올림');
m(5,2,'수의 범위와 어림하기',['올림, 버림, 반올림을 활용해요'],'round-application','반올림 응용');
m(5,2,'평균과 가능성',['자료를 모아서 평균을 구하고 해석해요'],'average-interpret','평균 해석');
m(5,2,'평균과 가능성',['일이 일어날 가능성을 예상하고 판단해요'],'chance-judgment','가능성 판단');
m(6,1,'비와 비율',['두 양의 크기를 비교하고 비를 알아봐요'],'ratio','비 나타내기');
m(6,1,'비와 비율',['비율을 알아봐요'],'rate','비율 계산');
m(6,1,'비와 비율',['비율이 사용되는 경우를 알아봐요'],'rate-context','생활 속 비율');
m(6,1,'비와 비율',['백분율을 알아봐요'],'percent','비율을 백분율로');
m(6,1,'비와 비율',['백분율이 사용되는 경우를 알아봐요'],'percent-context','생활 속 백분율');
m(6,1,'직육면체의 겉넓이와 부피',['직육면체의 겉넓이를 알아봐요'],'surface-area','직육면체 겉넓이');
m(6,1,'직육면체의 겉넓이와 부피',['cm³를 알아봐요'],'cubic-centimeter','세제곱센티미터');
m(6,1,'직육면체의 겉넓이와 부피',['직육면체의 부피를 구해요'],'cuboid-volume','직육면체 부피');
m(6,1,'직육면체의 겉넓이와 부피',['m³를 알아봐요'],'cubic-meter','세제곱미터');
m(6,2,'비례식과 비례배분',['비의 성질을 알아봐요'],'ratio-property','비의 성질');
m(6,2,'비례식과 비례배분',['비의 성질을 이용해요'],'ratio-apply','비의 성질 적용');
m(6,2,'비례식과 비례배분',['비례식을 알아봐요'],'proportion','비례식 판단');
m(6,2,'비례식과 비례배분',['비례식의 성질을 알아봐요'],'proportion-property','비례식의 성질');
m(6,2,'비례식과 비례배분',['비례식을 활용해요'],'proportion-use','생활 속 비례식');
m(6,2,'비례식과 비례배분',['비례배분을 해요'],'proportion-share','비례배분');
m(6,2,'원의 둘레와 넓이',['원주와 원주율을 알아봐요'],'circle-ratio','원주율');
m(6,2,'원의 둘레와 넓이',['원주와 지름을 구해요'],'circle-circumference','원주 구하기');
m(6,2,'원의 둘레와 넓이',['원의 넓이를 어림해요'],'circle-area-estimate','원 넓이 어림');
m(6,2,'원의 둘레와 넓이',['원의 넓이를 구해요'],'circle-area','원 넓이 계산');
m(6,2,'원의 둘레와 넓이',['원의 넓이를 활용해요'],'circle-area-use','반원 넓이 적용');
function register(target){for(const bank of banks){if(target.some(b=>b.id===bank.id))throw Error('Duplicate math bank '+bank.id);target.push(bank);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
