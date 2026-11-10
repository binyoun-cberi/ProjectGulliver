(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeFourGeometry=api;})(globalThis,()=>{
'use strict';
// Original grade-four angle/shape questions. Visual drawing and protractor
// performance are deliberately NOT inferred from written descriptions.
const banks=[];
function q(prompt,answer,w1,w2,explanation,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate answer choices: '+prompt+' '+choices);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{})};
}
const num=(p,a,s,unit,why,detail)=>q(p,a+unit,(a+s)+unit,(a+2*s)+unit,why,detail);
const alpha='ABCDEFGHIJKLMNOPQRSTUVW'.split('');
function make(kind,i){
 const n=i+3,label=alpha[i],next=alpha[i+1],m=i%4+3;
 switch(kind){
 case 'angle-compare':{
  const a=20+i*4,b=a+15,ans=i%2===0?'나':'가';
  const left=i%2===0?a:b,right=i%2===0?b:a;
  return q('각 '+label+'와 각 '+next+' 중 더 큰 각은?',ans==='가'?label:next,ans==='가'?next:label,'두 각의 크기가 같다',
   '각 '+label+'는 '+left+'°, 각 '+next+'는 '+right+'°이므로 '+(left>right?label:next)+'가 더 큽니다.',
   '각 '+label+': '+left+'° / 각 '+next+': '+right+'°');
 }
 case 'angle-read':{
  const degree=20+i*7;
  return num('각도기에서 한 변을 0° 눈금에 맞추고 다른 변이 '+degree+'° 눈금을 가리켰습니다. 읽은 각도는?',degree,10,'°',
   '각의 한 변을 0°에 맞췄으므로 다른 변이 가리키는 '+degree+'°를 읽습니다.');
 }
 case 'acute-obtuse':{
  const mode=i%3,degree=mode===0?30+i*2:mode===1?105+i*3:90;
  const answer=mode===0?'예각':mode===1?'둔각':'직각';
  const others=['예각','둔각','직각'].filter(v=>v!==answer);
  return q('각 '+label+'의 크기가 '+degree+'°일 때, 어떤 각인가요?',answer,others[0],others[1],
   degree+'°는 '+(degree<90?'90°보다 작으므로 예각':degree>90?'90°보다 크고 180°보다 작으므로 둔각':'90°이므로 직각')+'입니다.');
 }
 case 'angle-estimate':{
  const clocks=[1,2,3,4,5,6,7,8,9,10,11,12],h=clocks[i%12],smaller=Math.min(h,12-h),ans=smaller*30;
  const first=ans===180?90:ans+30,second=ans===0?60:ans-30;
  return q('정각 '+h+'시의 시계에서 시침과 분침이 이루는 작은 쪽 각은 몇 도인가요?',ans+'°',first+'°',second+'°',
   '시계에서 이웃한 숫자 사이의 각은 30°이며 작은 쪽으로 '+smaller+'칸이므로 '+ans+'°입니다.');
 }
 case 'angle-add':{
  const a=30+i*3,b=20+i*2,mode=i%2;
  return mode===0?num(a+'°인 각과 '+b+'°인 각의 크기를 더하면?',a+b,5,'°',
   a+'°+'+b+'°='+(a+b)+'°입니다.'):
   num((a+b)+'°인 각에서 '+a+'°인 각을 빼면?',b,5,'°',
   (a+b)+'°-'+a+'°='+b+'°입니다.');
 }
 case 'triangle-angle-sum':{
  const a=35+i%5*5,b=45+i%7*4,ans=180-a-b;
  return num('삼각형의 두 각이 '+a+'°와 '+b+'°입니다. 나머지 한 각의 크기는?',ans,5,'°',
   '삼각형 세 각의 합은 180°이므로 180°-'+a+'°-'+b+'°='+ans+'°입니다.');
 }
 case 'quad-angle-sum':{
  const a=75+i%5*3,b=85+i%4*4,c=90+i%6*2,ans=360-a-b-c;
  return num('사각형의 세 각이 '+a+'°, '+b+'°, '+c+'°일 때 나머지 한 각의 크기는?',ans,10,'°',
   '사각형 네 각의 합은 360°입니다. 360-'+a+'-'+b+'-'+c+'='+ans+'°입니다.');
 }
 case 'triangle-classify':{
  const a=n+2,mode=i%3,lengths=mode===0?[a,a,a]:mode===1?[a,a,a+2]:[a,a+1,a+2];
  const ans=mode===0?'정삼각형':mode===1?'길이가 같은 변이 꼭 두 개인 삼각형':'세 변의 길이가 모두 다른 삼각형',
  wrong=['정삼각형','길이가 같은 변이 꼭 두 개인 삼각형','세 변의 길이가 모두 다른 삼각형'].filter(x=>x!==ans);
  return q('세 변의 길이가 각각 '+lengths.join(' cm, ')+' cm인 삼각형을 가장 구체적으로 설명한 것은?',ans,wrong[0],wrong[1],
   mode===0?'세 변의 길이가 모두 같으므로 정삼각형입니다.':mode===1?'두 변만 길이가 같으므로 이등변삼각형의 특징을 가집니다.':'세 변의 길이가 모두 다르므로 해당 설명에 맞습니다.');
 }
 case 'triangle-iso':{
  const a=30+i*2;return num('이등변삼각형의 한 밑각이 '+a+'°입니다. 다른 밑각의 크기는?',a,5,'°',
   '이등변삼각형의 두 밑각의 크기는 서로 같으므로 '+a+'°입니다.');
 }
 case 'triangle-equilateral':{
  const side=n+2;return num('한 변의 길이가 '+side+' cm인 정삼각형의 둘레는?',side*3,side,' cm',
   '정삼각형은 세 변의 길이가 같으므로 '+side+'×3='+(side*3)+' cm입니다.');
 }
 case 'triangle-acute-obtuse':{
  const mode=i%3;
  const a=mode===0?50+i%5*2:mode===1?100+i%5*4:90;
  const b=mode===0?60:mode===1?30:35+i%4*5,c=180-a-b;
  const ans=mode===0?'예각삼각형':mode===1?'둔각삼각형':'직각삼각형';
  const others=['예각삼각형','둔각삼각형','직각삼각형'].filter(x=>x!==ans);
  return q('세 각이 '+a+'°, '+b+'°, '+c+'°인 삼각형의 종류는?',ans,others[0],others[1],
   mode===0?'세 각 모두 90°보다 작으므로 예각삼각형입니다.':mode===1?'90°보다 큰 각이 있으므로 둔각삼각형입니다.':'90°인 각이 하나 있으므로 직각삼각형입니다.');
 }
 case 'perpendicular':{
  return q('직선 '+label+'와 직선 '+next+'가 만나 이루는 각이 90°입니다. 두 직선의 관계는?',
   '수직','평행','서로 만나지 않는다','서로 만나 직각을 이루는 두 직선은 서로 수직입니다.');
 }
 case 'parallel':{
  return q('직선 '+label+'와 직선 '+next+'를 아무리 길게 늘여도 만나지 않습니다. 같은 평면에 있는 두 직선의 관계는?',
   '평행','수직','직각으로 만난다','한 평면에서 서로 만나지 않는 두 직선은 평행합니다.');
 }
 case 'parallel-distance':{
  const short=n+2,long=short+4;
  return num('두 평행선 사이에 그은 수선의 길이는 '+short+' cm입니다. 두 평행선 사이의 거리는?',short,2,' cm',
   '평행선 사이의 거리는 두 직선에 수직인 선분의 길이인 '+short+' cm입니다.',
   '수선의 길이: '+short+' cm / 비스듬히 이은 선분의 길이: '+long+' cm');
 }
 case 'trapezoid':{
  const top=n+2,bottom=top+5;
  return q('사각형 '+label+'에서 윗변 '+top+' cm와 아랫변 '+bottom+' cm는 평행하고 나머지 마주 보는 변은 평행하지 않습니다. 이 도형의 이름은?',
   '사다리꼴','직사각형','마름모','마주 보는 변 중 한 쌍만 평행한 사각형은 사다리꼴입니다.');
 }
 case 'parallelogram':{
  const x=n+2,y=x+3;
  return q('사각형 '+label+'의 마주 보는 두 쌍의 변은 각각 평행하고, 이웃한 변의 길이는 '+x+' cm와 '+y+' cm이며 모든 각이 직각은 아닙니다. 가장 알맞은 이름은?',
   '평행사변형','직사각형','정사각형','마주 보는 두 쌍의 변이 각각 평행한 사각형이므로 평행사변형입니다.');
 }
 case 'rhombus':{
  const side=n+2;
  return q('사각형 '+label+'의 네 변 길이는 모두 '+side+' cm이고 한 각은 60°입니다. 가장 구체적인 이름으로 알맞은 것은?',
    '마름모','정사각형','직사각형','네 변이 모두 같으면서 직각이 없는 사각형이므로 정사각형이 아닌 마름모입니다.');
 }
 case 'poly':{
  const sides=i%6+3;return q('도형 '+label+'는 곧은 선분 '+sides+'개로 둘러싸인 닫힌 도형입니다. 이 도형을 무엇이라 하나요?','다각형','원','곡선',
   '곧은 선분으로만 둘러싸인 닫힌 평면도형은 다각형입니다.');
 }
 case 'regular-poly':{
  const nSides=i%4+3,side=n+2;return q('모든 변의 길이가 '+side+' cm로 같고 모든 각의 크기도 같은 '+nSides+'각형의 이름은?',
    '정다각형','곡선으로 이루어진 도형','서로 다른 변 길이와 각을 가진 다각형',
    '변의 길이가 모두 같고 각의 크기가 모두 같은 다각형을 정다각형이라고 합니다.');
 }
 case 'diagonal':{
  const ns=i%6+4,answer=ns-3;
  return num(ns+'각형의 한 꼭짓점에서 그을 수 있는 대각선은 몇 개인가요?',answer,1,'개',
   '자기 자신과 양옆 두 꼭짓점에는 대각선을 그을 수 없으므로 '+ns+'-3='+answer+'개입니다.',
   '대각선은 서로 이웃하지 않는 두 꼭짓점을 잇는 선분입니다. 꼭짓점 '+label+'에서 출발한다고 생각하세요.');
 }
 default:throw Error('Unknown grade-four kind '+kind);
 }
}
const curriculum=[
 [1,'각도',[['각의 크기를 비교해요','angle-compare'],['각의 크기를 재어요','angle-read'],['예각과 둔각을 알아봐요','acute-obtuse'],['각도를 어림해요','angle-estimate'],['각도의 합과 차를 구해요','angle-add'],['삼각형의 세 각의 크기의 합을 알아봐요','triangle-angle-sum'],['사각형의 네 각의 크기의 합을 알아봐요','quad-angle-sum']]],
 [2,'삼각형',[['삼각형을 분류해 봐요','triangle-classify'],['이등변삼각형, 정삼각형을 알아봐요','triangle-classify'],['이등변삼각형의 성질을 알아봐요','triangle-iso'],['정삼각형의 성질을 알아봐요','triangle-equilateral'],['예각삼각형, 둔각삼각형을 알아봐요','triangle-acute-obtuse']]],
 [2,'사각형',[['수직과 수선을 알아봐요','perpendicular'],['평행과 평행선을 알아봐요','parallel'],['평행선 사이의 거리를 알아봐요','parallel-distance'],['사다리꼴을 알아봐요','trapezoid'],['평행사변형을 알아봐요','parallelogram'],['마름모를 알아봐요','rhombus']]],
 [2,'다각형',[['다각형을 알아봐요','poly'],['정다각형을 알아봐요','regular-poly'],['대각선을 알아봐요','diagonal']]]
];
for(const [semester,unit,lessons] of curriculum)for(const [name,kind]of lessons){
 const id='math-g4-shapes-'+semester+'-'+kind+'-'+banks.length;
 const amount=kind==='angle-estimate'?12:16;
 const items=Array.from({length:amount},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
   sourceLabel:'클라시트 창작 수학 기본 개념 · 도형의 작도와 실제 측정은 평가하지 않음'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail]))).size!==amount)throw Error('Duplicate maths prompts '+id);
 banks.push({id,subject:'math',grades:[4],exactSemester:semester,exactUnitName:unit,exactLessonName:name,
   label:name+' · 기본 개념·수치 자료',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate maths bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
