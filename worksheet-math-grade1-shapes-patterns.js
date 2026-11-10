(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeOneShapesPatterns=api;})(globalThis,()=>{
'use strict';
// Paper-friendly grade-one comparisons and visible shape / pattern / clock data.
// This verifies understanding; not actual weighing, measuring, drawing or model construction.
const banks=[];
const names=['민호','하린','지호','예린','가은','서준','수아','도윤','민지','준호','하윤','유나','지민','다은','서아','윤서'];
const objects=['연필','리본','끈','종이띠','색연필','막대','띠','책갈피','빨대','천 조각','나무 조각','색종이','공책','수첩','풀','자'];
const shapes3=[
 ['주사위','상자 모양'],['공','공 모양'],['음료수 캔','둥근기둥 모양'],['네모난 선물 상자','상자 모양'],
 ['탁구공','공 모양'],['원통형 연필꽂이','둥근기둥 모양'],['네모난 블록','상자 모양'],['야구공','공 모양'],
 ['원통형 종이통','둥근기둥 모양'],['네모난 신발 상자','상자 모양'],['둥근 유리 구슬','공 모양'],
 ['원통형 밀폐 용기','둥근기둥 모양'],['네모난 과자 상자','상자 모양'],['배구공','공 모양'],
 ['원기둥 모양 휴지심','둥근기둥 모양'],['정육면체 장난감','상자 모양']
];
const shapes2=[
 ['정사각형 종이','□ 모양'],['세모 모양 조각','△ 모양'],['동그란 접시의 바닥','○ 모양'],['네 변이 같은 정사각형 표지','□ 모양'],
 ['삼각형 깃발','△ 모양'],['원 모양 배지','○ 모양'],['정사각형 스티커','□ 모양'],['삼각형 카드','△ 모양'],
 ['둥근 동전의 앞면','○ 모양'],['정사각형 모양 그림 틀','□ 모양'],['세모 모양 퍼즐 조각','△ 모양'],
 ['원형 종이 조각','○ 모양'],['정사각형 창문 그림','□ 모양'],['삼각형 안전 표지 그림','△ 모양'],
 ['원형 고리의 바깥 테두리','○ 모양'],['정사각형 타일','□ 모양']
];
const cycles=[
 ['빨강','파랑','노랑'],['○','△','□'],['사과','배','귤'],['가','나','다'],
 ['해','달','별'],['꽃','나무','풀'],['봄','여름','가을'],['가위','바위','보'],
 ['●','○','△'],['동그라미','세모','네모'],['독서','놀이','휴식'],['빨간 원','파란 원','노란 원'],
 ['A','B','C'],['새','나비','잠자리'],['고양이','강아지','토끼'],['유리컵','물병','주전자']
];
const q=(prompt,answer,w1,w2,explanation,detail,scienceMaterial)=>{
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Conflicting grade-one options '+prompt+' '+choices);
 if(explanation.length<13)throw Error('Missing elementary explanation '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(detail?{detail}:{}),...(scienceMaterial?{scienceMaterial}:{})};
};
function v(i){const a=4+i%7,b=a+2+i%4;return i%2===0?[a,b]:[b,a];}
function compare(i,kind){
 const [a,b]=v(i),ans=a>b?'가':'나',person=names[i],obj=objects[i];
 if(kind==='length')return q('같은 크기 칸으로 잰 두 '+obj+' 중 더 긴 것은?',ans,ans==='가'?'나':'가','길이가 같다',
   '같은 크기의 칸을 더 많이 차지한 '+ans+'의 길이가 더 깁니다.',
   person+'의 기록: 가는 같은 칸 '+a+'개, 나는 '+b+'개 길이입니다.');
 if(kind==='weight')return q('같은 무게의 추로 잰 두 물건 중 더 무거운 것은?',ans,ans==='가'?'나':'가','무게가 같다',
   '같은 무게의 추를 '+(ans==='가'?a:b)+'개 쓴 '+ans+'가 더 무겁습니다.',
   person+'의 기록: 가의 무게는 같은 추 '+a+'개, 나는 '+b+'개와 같습니다.');
 if(kind==='area')return q('같은 크기의 네모 칸으로 덮은 두 종이 중 더 넓은 것은?',ans,ans==='가'?'나':'가','넓이가 같다',
   '같은 크기의 칸을 더 많이 덮는 '+ans+'가 더 넓습니다.',
   person+'의 기록: 가는 같은 칸 '+a+'개, 나는 '+b+'개로 빈틈없이 덮었습니다.');
 return q('똑같은 컵으로 채운 두 물통 중 더 많이 담을 수 있는 것은?',ans,ans==='가'?'나':'가','들이가 같다',
   '같은 크기의 컵으로 더 많은 양이 들어간 '+ans+'의 들이가 큽니다.',
   person+'의 기록: 가는 물 '+a+'컵, 나는 '+b+'컵으로 가득 찼습니다.');
}
function make(kind,i){
 const who=names[i];
 switch(kind){
 case 'solid-find':{
  const [object,answer]=shapes3[i],other=['상자 모양','공 모양','둥근기둥 모양'].filter(x=>x!==answer);
  return q('다음 물체는 어떤 모양에 가까울까요?',answer,other[0],other[1],
   object+'는 '+answer+'에 가까운 물체입니다.','물체: '+object+' / '+who+'가 살펴보았습니다.');
 }
 case 'solid-properties':{
  const kind=i%3,answers=['상자 모양','둥근기둥 모양','공 모양'],a=answers[kind],other=answers.filter(x=>x!==a);
  const descriptions=[
   '평평한 면이 여럿 있고 모서리가 있습니다.',
   '서로 마주 보는 둥근 바닥이 두 개 있으며 옆면이 둥글게 이어집니다.',
   '모든 방향으로 둥글고 모서리가 없습니다.'
  ];
  return q('설명에 가장 잘 맞는 입체 모양은?',a,other[0],other[1],
   '설명된 특징은 '+a+'에서 볼 수 있습니다.',
   who+'의 설명: '+descriptions[kind]+' (관찰 기록 '+(i+1)+')');
 }
 case 'longer':return compare(i,'length');
 case 'heavier':return compare(i,'weight');
 case 'wider':return compare(i,'area');
 case 'capacity':return compare(i,'capacity');
 case 'flat-find':{
  const [object,answer]=shapes2[i],other=['□ 모양','△ 모양','○ 모양'].filter(x=>x!==answer);
  return q('다음 물건에서 볼 수 있는 평면 모양은?',answer,other[0],other[1],
   '물건의 윤곽을 살피면 '+answer+'에 해당합니다.','물건: '+object+' / '+who+'의 관찰');
 }
 case 'flat-properties':{
  const style=i%3,answers=['□ 모양','△ 모양','○ 모양'],answer=answers[style],other=answers.filter(x=>x!==answer);
  const hints=[
   '네 변의 길이가 같고 네 각이 모두 직각인 평면 모양입니다.',
   '곧은 변 세 개로 둘러싸인 평면 모양입니다.',
   '곧은 변이나 꼭짓점 없이 둥근 테두리로 둘러싸인 평면 모양입니다.'
  ];
  return q('설명에 맞는 평면 모양은?',answer,other[0],other[1],
   '모양의 변과 꼭짓점 특징을 보면 '+answer+'이 알맞습니다.',
   who+'의 설명: '+hints[style]+' (문제 '+(i+1)+')');
 }
 case 'clock-hour':{
  const h=i+1,wrong1=h===12?1:h+1,wrong2=h>=11?h-2:h+2;
  return q('분침은 숫자 12를 가리킵니다. 시침의 끝은 숫자 '+h+'에 있습니다. 몇 시인가요?',
   h+'시',wrong1+'시',wrong2+'시',
   '분침이 12이고 시침이 '+h+'에 있으므로 '+h+'시입니다.','정각의 시계 모습을 글로 설명한 문제입니다.');
 }
 case 'clock-half':{
  const h=i+1,next=h===12?1:h+1;
  return q('분침은 숫자 6에 있습니다. 시침은 '+h+'시를 지나 다음 정각을 향하고 있습니다. 몇 시인가요?',
   h+'시 30분',h+'시',next+'시 30분',
   '분침이 6이면 30분이고 시침은 '+h+'을 지났으므로 '+h+'시 30분입니다.','30분이 지난 시계 모습을 글로 설명한 문제입니다.');
 }
 case 'repeating':{
  const trio=cycles[i],sequence=[trio[0],trio[1],trio[0],trio[1],trio[0]];
  return q('이 규칙을 이어 갈 때 다음에 나올 것은?',trio[1],trio[0],trio[2],
   '‘'+trio[0]+'’ 다음에는 ‘'+trio[1]+'’이 차례로 반복됩니다.',
   who+'가 만든 배열: '+sequence.join(' → ')+' → ?');
 }
 case 'number-line-pattern':{
  const step=i%3+1,start=6+i,answer=start+3*step;
  return q('수의 배열에서 □에 들어갈 수는?',String(answer),String(answer+step),String(answer+step*2),
   step+'씩 커지는 수의 배열이므로 □에는 '+answer+'이 들어갑니다.',
   '수 배열: '+start+', '+(start+step)+', '+(start+step*2)+', □ (기록 '+(i+1)+')');
 }
 case 'number-grid-pattern':{
  const top=11+i*2,below=top+10;
  return q('100까지의 수 배열표에서 바로 아래 칸에 놓이는 수는?',String(below),String(top+1),String(top+2),
   '같은 열에서 한 줄 내려가면 10만큼 커집니다. '+top+'보다 10 큰 수는 '+below+'입니다.',
   '수 배열표 일부: 위쪽 칸 '+top+' / 바로 아래 칸 □ / '+who+'의 기록');
 }
 case 'pattern-as-numbers':{
  const trio=cycles[i],a=trio[0],b=trio[1];
  return q('반복되는 무늬를 '+a+'=1, '+b+'=2로 나타냈습니다. 알맞은 수의 배열은?',
   '1, 2, 1, 2, 1, 2','1, 1, 2, 2, 1, 2','2, 2, 1, 1, 2, 1',
   a+'와 '+b+'가 번갈아 나오므로 1과 2가 번갈아 나타납니다.',
   who+'의 무늬: '+[a,b,a,b,a,b].join(' → '));
 }
 default:throw Error('Unknown grade-one shapes or pattern '+kind);
 }
}
const curriculum=[
 [1,'여러 가지 모양',[['여러 가지 모양을 찾아볼까요','solid-find'],['여러 가지 모양을 알아볼까요','solid-properties']]],
 [1,'비교하기',[['어느 것이 더 길까요','longer'],['어느 것이 더 무거울까요','heavier'],['어느 것이 더 넓을까요','wider'],['어느 것에 더 많이 담을 수 있을까요','capacity']]],
 [2,'모양과 시각',[['□, △, ○ 모양을 찾아볼까요','flat-find'],['□, △, ○ 모양을 알아볼까요','flat-properties'],['몇 시를 알아볼까요','clock-hour'],['몇 시 30분을 알아볼까요','clock-half']]],
 [2,'규칙 찾기',[['규칙을 찾아볼까요','repeating'],['수 배열에서 규칙을 찾아볼까요','number-line-pattern'],['수 배열표에서 규칙을 찾아볼까요','number-grid-pattern'],['규칙을 여러 가지 방법으로 나타내 볼까요','pattern-as-numbers']]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 const id='math-g1-shapes-'+semester+'-'+kind,amount=kind.startsWith('clock-')?12:16;
 const items=Array.from({length:amount},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 창작 1학년 수학 개념 문제 · 실물 비교·시계 모형·도형 조작 수행평가 아님'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial]))).size!==amount)throw Error('Duplicated grade-one task '+id);
 banks.push({id,subject:'math',grades:[1],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
   label:lesson+' · 모양·비교·시간·규칙 이해',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Repeated grade-one shape bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
