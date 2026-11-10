(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeTwoDataPatterns=api;})(globalThis,()=>{
'use strict';
// Original grade-two classification, charts, and pattern-reading questions.
// Every plotted unit has an explicit key, and no physical block-building is claimed.
const banks=[];
const topics=['좋아하는 과일','자주 이용하는 놀이 장소','읽고 싶은 책','선호하는 운동','심고 싶은 꽃','좋아하는 계절','좋아하는 간식','집에서 기르는 식물','좋아하는 동물','가고 싶은 체험 장소','즐겨 듣는 노래 종류','좋아하는 교통수단','교실에서 키울 식물','운동회 종목','즐겨 먹는 채소','좋아하는 색깔'];
const categories=[
 ['사과','배','귤'],['운동장','도서관','놀이터'],['동화','과학책','역사책'],['축구','달리기','줄넘기'],
 ['장미','해바라기','국화'],['봄','여름','가을'],['고구마','옥수수','떡'],['선인장','허브','다육식물'],
 ['강아지','고양이','토끼'],['박물관','미술관','동물원'],['동요','민요','연주곡'],['버스','기차','자전거'],
 ['강낭콩','토마토','상추'],['이어달리기','피구','줄넘기'],['당근','오이','호박'],['빨강','파랑','초록']
];
const table=(title,headers,rows,note)=>({kind:'table',title,headers,rows,note:note||''});
const q=(prompt,answer,b,c,explanation,detail,scienceMaterial)=>{
 const choices=[answer,b,c].map(String);
 if(new Set(choices).size!==3)throw Error('Same choices: '+prompt+' '+choices);
 const record={prompt,answer:String(answer),choices,explanation};
 if(detail)record.detail=detail;
 if(scienceMaterial)record.scienceMaterial=scienceMaterial;
 if(explanation.length<16)throw Error('Short explanation '+prompt);
 return record;
};
function counts(i){return [i%5+3,(i*2)%5+2,(i*3)%5+1];}
const chart=(i,values,style='count')=>{
 const a=categories[i];return style==='symbol'?
  table(topics[i]+'을/를 조사한 그림그래프',['종류','조사 결과'],a.map((x,k)=>[x,'●'.repeat(values[k])]),'● 하나는 1명입니다.'):
  table(topics[i]+'을/를 조사한 표',['종류','학생 수'],a.map((x,k)=>[x,values[k]+'명']));
};
const total=arr=>arr.reduce((n,v)=>n+v,0);
function make(kind,i){
 const names=categories[i],values=counts(i),sum=total(values),selected=i%3,cur=values[selected],topic=topics[i];
 const at=(j)=>names[(selected+j)%3];
 switch(kind){
 case 'why-classify':{
  const cases=[
   ['빨간 블록과 파란 블록을 서로 다른 상자에 넣었습니다.','물건의 색깔','물건의 모양','물건의 개수'],
   ['동그란 단추와 네모난 단추를 나누었습니다.','물건의 모양','물건의 무게','물건의 색깔'],
   ['먹는 도구와 글을 쓰는 도구를 나누었습니다.','물건의 쓰임','물건의 색깔','물건의 길이'],
   ['큰 돌과 작은 돌을 나누었습니다.','물건의 크기','물건의 이름','물건의 쓰임'],
   ['노란 연필과 초록 연필을 나누었습니다.','물건의 색깔','물건의 길이','물건의 쓰임'],
   ['세모 조각과 네모 조각을 나누었습니다.','물건의 모양','물건의 가격','물건의 크기'],
   ['옷과 주방용품을 따로 정리했습니다.','물건의 쓰임','물건의 색깔','물건의 크기'],
   ['긴 리본과 짧은 리본을 나누었습니다.','물건의 크기','물건의 모양','물건의 색깔'],
   ['하얀 구슬과 검은 구슬을 나누었습니다.','물건의 색깔','물건의 무게','물건의 재료'],
   ['별 모양과 하트 모양 스티커를 나누었습니다.','물건의 모양','물건의 쓰임','물건의 크기'],
   ['놀이 도구와 청소 도구를 나누었습니다.','물건의 쓰임','물건의 가격','물건의 모양'],
   ['길이가 긴 막대와 짧은 막대를 나누었습니다.','물건의 크기','물건의 쓰임','물건의 이름'],
   ['갈색 종이와 흰색 종이를 나누었습니다.','물건의 색깔','물건의 무게','물건의 쓰임'],
   ['둥근 접시와 네모난 접시를 나누었습니다.','물건의 모양','물건의 무게','물건의 개수'],
   ['마시는 데 쓰는 컵과 음식을 먹는 데 쓰는 젓가락을 나누었습니다.','물건의 쓰임','물건의 재료','물건의 색깔'],
   ['키가 큰 인형과 작은 인형을 나누었습니다.','물건의 크기','물건의 색깔','물건의 이름']
  ];
  const [detail,answer,b,c]=cases[i];return q('다음은 어떤 기준으로 분류한 것인가요?',answer,b,c,'물건들을 구별한 공통 특징은 ‘'+answer+'’입니다.',detail);
 }
 case 'criterion':{
  const record=[...Array(values[0]).fill(names[0]),...Array(values[1]).fill(names[1]),...Array(values[2]).fill(names[2])];
  return q('이 자료를 '+topic+'에 따라 분류했습니다. ‘'+names[selected]+'’를 고른 학생은 몇 명인가요?',
   cur+'명',(cur+1)+'명',(cur+2)+'명',
   '‘'+names[selected]+'’로 분류되는 자료를 하나씩 세면 '+cur+'명입니다.',
   '조사한 응답: '+record.join(', '));
 }
 case 'class-count':{
  const data=chart(i,values);
  return q('표에서 ‘'+names[selected]+'’를 고른 학생은 몇 명인가요?',
   cur+'명',(cur+1)+'명',(cur+2)+'명',
   '표의 ‘'+names[selected]+'’ 행에 '+cur+'명이라고 적혀 있습니다.',
   '같은 항목끼리 모은 '+topic+' 조사 자료입니다.',data);
 }
 case 'class-infer':{
  const v=[...values];
  // The construction can produce ties; ask about total instead to keep a unique answer.
  return q('표에 나온 조사에 참여한 학생 수를 모두 더하면?',
   sum+'명',(sum+1)+'명',(sum+2)+'명',
   '세 항목의 학생 수를 더하면 '+values.join('+')+'='+sum+'명입니다.',
   undefined,chart(i,v));
 }
 case 'make-table':{
  const raw=names.flatMap((x,k)=>Array(values[k]).fill(x));
  return q('다음 응답 자료를 표로 정리했습니다. ‘'+names[selected]+'’ 칸에 넣을 수는?',
   cur+'명',(cur+1)+'명',(cur+2)+'명',
   '기록에서 ‘'+names[selected]+'’를 고른 학생은 '+cur+'명이므로 표에 '+cur+'명을 적습니다.',
   '응답 기록: '+raw.join(', '),
   table(topic+'을/를 정리할 표',['응답','학생 수'],names.map((x,k)=>[x,k===selected?'?':values[k]+'명'])));
 }
 case 'survey-table':{
  const n=values[0]+values[1]+values[2];
  return q('한 사람당 하나만 고르게 조사했습니다. 표에 빠진 ‘전체’ 칸의 수는?',
   n+'명',(n+1)+'명',(n+2)+'명',
   '한 사람마다 한 가지를 선택하였으므로 '+values.join('+')+'='+n+'명입니다.',
   '하나만 선택하는 '+topic+' 조사입니다.',
   table(topic+'의 조사 결과',['응답','학생 수'],[...names.map((x,k)=>[x,values[k]+'명']),['전체','?']]));}
 case 'make-graph':{
  return q('● 하나가 1명을 나타냅니다. ‘'+names[selected]+'’를 고른 학생 수는?',
   cur+'명',(cur+1)+'명',(cur+2)+'명',
   '‘'+names[selected]+'’ 행에 있는 ●의 개수는 '+cur+'개이므로 '+cur+'명입니다.',
   undefined,chart(i,values,'symbol'));
 }
 case 'read-graph':{
  const j=(selected+1)%3,diff=Math.abs(values[selected]-values[j]);
  // Use the comparison between two plotted bars; actual quantities are always explicit.
  if(values[selected]===values[j])return q('그림그래프에서 ‘'+names[selected]+'’와 ‘'+names[j]+'’의 학생 수를 비교하면?',
    '같다','첫 번째가 1명 더 많다','두 번째가 1명 더 많다',
    '두 항목 모두 '+values[selected]+'명이므로 학생 수가 같습니다.',undefined,chart(i,values,'symbol'));
  return q('그림그래프에서 ‘'+names[selected]+'’와 ‘'+names[j]+'’의 학생 수 차이는?',
   diff+'명',(diff+1)+'명',(diff+2)+'명',
   values[selected]+'명과 '+values[j]+'명을 비교하면 '+diff+'명 차이입니다.',
   undefined,chart(i,values,'symbol'));
 }
 case 'table-and-graph':{
  const s=values[0],b=values[1],c=values[2];
  return q('다음 그래프를 보고 표에 적을 수 있는 내용으로 알맞은 것은?',
   names[0]+' '+s+'명, '+names[1]+' '+b+'명',
   names[0]+' '+(s+1)+'명, '+names[1]+' '+b+'명',
   names[0]+' '+s+'명, '+names[1]+' '+(b+1)+'명',
   '● 하나가 1명이므로 그래프의 첫째 항목은 '+s+'명, 둘째 항목은 '+b+'명입니다.',
   undefined,chart(i,values,'symbol'));
 }
 case 'tile-pattern1':{
  const abc=[['빨강','파랑'],['동그라미','세모'],['해','별'],['삼각형','사각형'],['하양','검정'],['나비','꽃'],
   ['○','□'],['큰 별','작은 별'],['빨강 원','노랑 원'],['○','△'],['검은 돌','흰 돌'],['봄','여름'],
   ['햇빛','그늘'],['검은 삼각형','하얀 삼각형'],['가','나'],['산','바다']][i];
  const order=Array.from({length:5},(_,j)=>abc[j%2]);return q('다음 배열에서 ‘?’에 올 알맞은 무늬는?',abc[1],abc[0],'▲',
   '‘'+abc[0]+' → '+abc[1]+'’이 반복되므로 ‘'+abc[0]+'’ 다음은 ‘'+abc[1]+'’입니다.',
   '무늬 배열: '+order.join(' → ')+' → ?');
 }
 case 'tile-pattern2':{
  const abc=[['빨강','노랑','파랑'],['○','△','□'],['사과','배','귤'],['가','나','다'],
   ['별','달','해'],['하양','검정','회색'],['봄','여름','가을'],['1','2','3'],
   ['고양이','강아지','토끼'],['구름','바람','비'],['콩','팥','깨'],['A','B','C'],
   ['3','5','7'],['토끼','거북','개구리'],['가위','바위','보'],['빨간 원','노란 원','파란 원']][i];
  return q('세 가지가 차례대로 되풀이됩니다. 다음에 올 것은?',abc[1],abc[0],abc[2],
   '‘'+abc.join(' → ')+'’ 순서가 반복되므로 첫 번째 ‘'+abc[0]+'’ 다음은 ‘'+abc[1]+'’입니다.',
   '무늬 배열: '+[...abc,...abc,abc[0]].join(' → ')+' → ?');
 }
 case 'stack-pattern':{
  const first=i%4+1,step=Math.floor(i/4)+1,a=first+3*step;
  return q('블록을 쌓을 때 각 단계에 쓴 블록 수가 규칙적으로 변합니다. 4단계의 블록 수는?',
   a+'개',(a+step)+'개',(a+2*step)+'개',
   '처음 '+first+'개에서 단계마다 '+step+'개씩 늘어나므로 '+a+'개입니다.',
   '1단계 '+first+'개, 2단계 '+(first+step)+'개, 3단계 '+(first+step*2)+'개. 관찰자 '+(i+1)+'가 기록했습니다.');
 }
 case 'addition-pattern':{
  const a=i%7+2,b=i%6+3,c=i%4+2,ans=(a+2)+b;
  return q('다음 덧셈표의 빈칸은 얼마인가요?',
   String(ans),String(ans+1),String(ans+2),
   '더하는 수 '+b+'은 같고 다른 수가 1씩 늘어납니다. '+(a+2)+'+'+b+'='+ans+'입니다.',
   '덧셈표: '+a+'+'+b+'='+(a+b)+', '+(a+1)+'+'+b+'='+(a+b+1)+', '+(a+2)+'+'+b+'=? (기록 '+(i+1)+')');
 }
 case 'multiplication-pattern':{
  const dan=i%7+2,k=i%5+2,ans=dan*(k+2);
  return q('곱셈표에서 '+dan+'씩 늘어나는 규칙을 따를 때 다음 값은?',
   String(ans),String(ans+dan),String(ans+dan*2),
   dan+'단의 곱은 '+dan+'씩 늘어납니다. '+dan+'×'+(k+2)+'='+ans+'입니다.',
   dan+'×'+k+'='+(dan*k)+', '+dan+'×'+(k+1)+'='+(dan*(k+1))+', '+dan+'×'+(k+2)+'=? (기록 '+(i+1)+')');
 }
 case 'life-pattern':{
  const cycles=[['월','화','수'],['딸기','바나나','포도'],['빨강','파랑','노랑'],['독서','산책','운동'],
   ['봄','여름','가을','겨울'],['장미','국화','튤립'],['해','달','별'],['청소','급식','도서관'],
   ['기차','버스','자전거'],['아침','점심','저녁'],['○','□','△'],['빨강','노랑','파랑'],
   ['모래','흙','자갈'],['손뼉','무릎','책상'],['공부','휴식','정리'],['가','나','다','라']][i];
  const first=Array.from({length:cycles.length*2+1},(_,j)=>cycles[j%cycles.length]);
  const answer=cycles[1];
  const distractors=[cycles[0],cycles[cycles.length-1]];
  return q('생활에서 반복되는 규칙을 살펴보세요. 다음 차례는 무엇인가요?',answer,...distractors,
   '‘'+cycles.join(' → ')+'’ 순서가 되풀이되므로 ‘'+cycles[0]+'’ 다음 차례는 ‘'+answer+'’입니다.',
   '반복 기록: '+first.join(' → ')+' → ?');
 }
 default:throw Error('Unknown grade-two data or pattern skill '+kind);
 }
}
const curriculum=[
 [1,'분류하기',[['분류는 어떻게 할까요','why-classify'],['기준에 따라 분류해 볼까요','criterion'],['분류하고 세어 볼까요','class-count'],['분류한 결과를 말해 볼까요','class-infer']]],
 [2,'표와 그래프',[['자료를 분류하여 표로 나타내 볼까요','make-table'],['자료를 조사하여 표로 나타내 볼까요','survey-table'],['자료를 분류하여 그래프로 나타내 볼까요','make-graph'],['표와 그래프를 보고 무엇을 알 수 있을까요','read-graph'],['표와 그래프로 나타내 볼까요','table-and-graph']]],
 [2,'규칙 찾기',[['무늬에서 규칙을 찾아볼까요(1)','tile-pattern1'],['무늬에서 규칙을 찾아볼까요(2)','tile-pattern2'],['쌓은 모양에서 규칙을 찾아볼까요','stack-pattern'],['덧셈표에서 규칙을 찾아볼까요','addition-pattern'],['곱셈표에서 규칙을 찾아볼까요','multiplication-pattern'],['생활에서 규칙을 찾아볼까요','life-pattern']]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 const id='math-g2-data-'+semester+'-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 창작 2학년 수학 분류·표·규칙 문제 · 실제 조사·쌓기 수행평가 아님'}));
 if(new Set(items.map(q=>JSON.stringify([q.prompt,q.detail,q.scienceMaterial]))).size!==items.length)throw Error('Repeated item '+id);
 banks.push({id,subject:'math',grades:[2],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
   label:lesson+' · 자료 읽기와 규칙 찾기',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Repeated grade-two data bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
