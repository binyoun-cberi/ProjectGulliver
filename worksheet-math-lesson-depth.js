(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathLessonDepth=api;})(globalThis,()=>{
'use strict';
// 2022-revised grade 5, semester 2: independent classroom examples, not textbook questions.
const averageContexts=[
 ['책 읽기 기록','네 학생이 일주일 동안 읽은 책 수','권',6],
 ['줄넘기 연습','네 학생이 같은 시간 동안 성공한 줄넘기 횟수','회',12],
 ['모둠의 수집 카드','네 친구가 가지고 있는 카드 수','장',10],
 ['화단 관찰','네 화분에서 관찰한 꽃의 수','송이',7],
 ['운동장 달리기','네 학생의 달리기 연습 횟수','회',9]
];
const calculationContexts=[
 ['과학 독서','네 학생의 읽은 쪽수','쪽',12],
 ['학급 재활용','네 모둠의 모은 빈 병 수','개',15],
 ['화단 모종','네 모둠이 심은 모종 수','개',8],
 ['체육 연습','네 날 동안 성공한 공 던지기 횟수','회',13],
 ['도서관 조사','네 날의 어린이 대출 권수','권',18]
];
const chanceContexts=[
 ['색 카드 상자','빨강 카드 3장과 파랑 카드 1장이 있다. 같은 크기의 카드 4장을 잘 섞어 한 장을 뽑는다.',3,1],
 ['공 뽑기','빨강 공 2개와 파랑 공 4개가 있다. 크기와 무게가 같은 공 6개를 섞어 한 개를 뽑는다.',2,4],
 ['두 색 회전판','크기가 같은 여덟 칸 중 빨강이 네 칸, 파랑이 네 칸인 회전판을 한 번 돌린다. 모든 칸에 멈출 가능성은 같다.',4,4],
 ['행운의 색 쪽지','같은 모양의 쪽지 6장 중 빨강이 1장, 파랑이 5장이다. 잘 섞어 한 장을 뽑는다.',1,5],
 ['색깔 타일 주머니','크기와 무게가 같은 타일 8개 중 빨강이 6개, 파랑이 2개이다. 보지 않고 한 개를 뽑는다.',6,2]
];
const fractionContexts=[
 ['도형 카드','같은 크기의 카드 네 장에 빨강 1장, 파랑 3장이 있다. 잘 섞어 한 장을 뽑는다.',1,3],
 ['구슬 주머니','크기와 무게가 같은 구슬 여섯 개 중 빨강 4개, 파랑 2개가 있다. 한 개를 뽑는다.',4,2],
 ['색깔 회전판','넓이가 같은 여덟 칸 중 빨강이 여섯 칸, 파랑이 두 칸이다. 회전판을 한 번 돌린다. 모든 칸에 멈출 가능성은 같다.',6,2],
 ['문양 쪽지','같은 모양의 쪽지 열 장 중 빨강이 다섯 장, 파랑이 다섯 장이다. 한 장을 무작위로 뽑는다.',5,5],
 ['알록달록 공','크기와 무게가 같은 공 여덟 개 중 빨강이 세 개, 파랑이 다섯 개이다. 한 개를 뽑는다.',3,5]
];
function gcd(a,b){while(b){const t=a%b;a=b;b=t;}return a;}
function fraction(n,d){if(n===0)return '0';if(n===d)return '1';const g=gcd(n,d);return (n/g)+'/'+(d/g);}
function choices(answer,wrong1,wrong2){const values=[String(answer),String(wrong1),String(wrong2)];if(new Set(values).size!==3)throw Error('Duplicate mathematics options: '+values.join(','));return values;}
const banks=[];
function addBank(id,lessonName,label,contexts,makeRows){const items=[];for(let k=0;k<contexts.length;k++){
 const {title,detail,rows}=makeRows(contexts[k]);if(rows.length!==5)throw Error(id+' scenario length mismatch');
 for(let j=0;j<rows.length;j++){const [prompt,answer,w1,w2,explanation]=rows[j];items.push({evidenceId:id+'-'+(k+1)+'-'+(j+1),mathReasoning:true,passageId:id+'-'+(k+1),passageTitle:title,detail,prompt,answer:String(answer),choices:choices(answer,w1,w2),explanation,sourceLabel:'클라시트 창작 수학 생활 자료 · 가상 상황'});}}
 banks.push({id,subject:'math',grades:[5],exactSemester:2,exactUnitName:'평균과 가능성',exactLessonName:lessonName,label,pattern:/^$/,items});
}
addBank('math-average-meaning','평균을 알아봐요','평균의 뜻과 자료의 변화 이해하기',averageContexts,([title,situation,unit,mean])=>{
 const values=[mean-3,mean-1,mean+1,mean+3],total=mean*4;
 const detail=situation+'를 차례로 기록했다: '+values.map(v=>v+unit).join(', ')+'. 각 자료는 한 학생 또는 한 화분에 해당한다.';
 return {title,detail,rows:[
 [title+'에서 전체를 네 곳에 똑같이 나누면 한 곳에 돌아가는 수는?',mean+unit,(mean+1)+unit,(mean+3)+unit,'총 '+total+unit+'을 네 곳에 똑같이 나누면 평균은 '+mean+unit+'입니다.'],
 [title+'에서 평균보다 큰 기록은 몇 개인가요?','2개','1개','3개',mean+'보다 큰 값은 '+(mean+1)+'과 '+(mean+3)+'로 두 개입니다.'],
 [title+'에서 전체 기록의 합은?',total+unit,(total-2)+unit,(total+4)+unit,'네 기록의 합은 '+total+unit+'입니다.'],
 [title+'에서 가장 큰 기록과 평균의 차이는?','3'+unit,'1'+unit,'4'+unit,'가장 큰 값은 '+(mean+3)+unit+'이고 평균은 '+mean+unit+'이므로 차이는 3'+unit+'입니다.'],
 [title+'에서 가장 큰 기록의 2'+unit+'을 가장 작은 기록으로 옮기면 평균은?',mean+unit,(mean-2)+unit,(mean+2)+unit,'한쪽의 것을 다른 쪽으로 옮겨도 네 기록의 합은 같으므로 평균은 변하지 않습니다.']
 ]};
});
addBank('math-average-calculate','평균을 구해요','평균 계산과 빠진 자료 구하기',calculationContexts,([title,situation,unit,mean])=>{
 const v=[mean-4,mean-2,mean+2,mean+4],total=mean*4;
 const detail=situation+'를 차례로 나타내면 '+v.map(x=>x+unit).join(', ')+'이다.';
 return {title,detail,rows:[
 [title+' 네 기록의 평균은?',mean+unit,(mean+2)+unit,(mean-2)+unit,'합 '+total+unit+'을 자료 수 4로 나누면 '+mean+unit+'입니다.'],
 [title+' 네 기록의 합계는?',total+unit,(total+4)+unit,(total-4)+unit,'네 기록을 더하면 '+total+unit+'입니다.'],
 [title+'에서 마지막 기록을 가리고 나머지 세 기록만 알려 주었습니다. 네 기록의 평균이 '+mean+unit+'이라면 마지막 기록은?',v[3]+unit,v[2]+unit,v[0]+unit,'네 자료의 합 '+total+unit+'에서 앞의 세 자료의 합 '+(total-v[3])+unit+'을 빼면 '+v[3]+unit+'입니다.'],
 [title+'에서 모든 기록이 각각 2'+unit+'씩 늘었다면 새 평균은?',(mean+2)+unit,mean+unit,(mean+8)+unit,'네 기록이 모두 2'+unit+'씩 늘면 평균도 2'+unit+' 늘어납니다.'],
 [title+'의 네 기록에 '+(mean+5)+unit+'짜리 새 기록 하나를 추가하면 다섯 기록의 평균은?',(mean+1)+unit,mean+unit,(mean+5)+unit,'합이 '+(total+mean+5)+unit+'이고 기록이 다섯 개이므로 평균은 '+(mean+1)+unit+'입니다.']
 ]};
});
addBank('math-chance-meaning','일이 일어날 가능성을 알아봐요','확실함·불가능함·가능성 비교',chanceContexts,([title,detail,red,blue])=>{
 const comparison=red>blue?'빨강':red<blue?'파랑':'두 색이 같다';
 const compareAnswer=red>blue?'빨강이 더 잘 나온다':red<blue?'파랑이 더 잘 나온다':'두 색의 가능성이 같다';
 const compareWrong=red>blue?'파랑이 더 잘 나온다':'빨강이 더 잘 나온다';
 const half=red>blue?'절반보다 크다':red<blue?'절반보다 작다':'절반과 같다';
 const halfWrong=red>blue?'절반보다 작다':'절반보다 크다';
 const count=red+blue;
 return {title,detail,rows:[
 [title+'에서 두 색 중 더 잘 나올 색을 바르게 설명한 것은?',compareAnswer,compareWrong,red===blue?'파랑이 더 잘 나온다':'두 색의 가능성이 같다','전체 '+count+'개 중 빨강 '+red+'개, 파랑 '+blue+'개이므로 '+(red===blue?'가능성이 같습니다.':comparison+'이 더 많이 나옵니다.')],
 [title+'에서 초록색이 나올 가능성은?','불가능하다','확실하다','절반이다','초록색은 한 개도 없으므로 나올 수 없습니다.'],
 [title+'에서 빨강 또는 파랑 중 하나가 나올 가능성은?','확실하다','불가능하다','절반이다','모든 결과가 빨강 또는 파랑이므로 반드시 둘 중 하나입니다.'],
 [title+'에서 빨강이 나올 가능성을 절반과 비교하면?',half,halfWrong,red===blue?'절반보다 작다':'절반과 같다','빨강 '+red+'개와 파랑 '+blue+'개를 비교하면 '+half+'고 판단할 수 있습니다.'],
 [title+'에서 첫 번째에 반드시 빨강이 나온다고 말할 수 있나요?','아니요, 두 색 모두 나올 수 있습니다','네, 빨강은 반드시 먼저 나옵니다','네, 파랑은 절대 나오지 않습니다','두 색 모두 실제로 있으므로 빨강이 반드시 나온다고 단정할 수 없습니다.']
 ]};
});
addBank('math-chance-number','일이 일어날 가능성을 수로 나타내요','가능성을 0부터 1까지의 수로 나타내기',fractionContexts,([title,detail,red,blue])=>{
 const all=red+blue,fr=fraction(red,all),fb=fraction(blue,all),comparison=red>blue?'1/2보다 크다':red<blue?'1/2보다 작다':'1/2과 같다';
 const optionList=[...new Set([fraction(red+1,all+1),fraction(blue+1,all+1),fraction(1,all),fraction(all-1,all),'0','1','1/2','1/4','3/4','2/3','1/3'])];
 function distractors(answer){return optionList.filter(x=>x!==answer).slice(0,2);}
 const [rw1,rw2]=distractors(fr),[bw1,bw2]=distractors(fb);
 return {title,detail,rows:[
 [title+'에서 빨강이 나올 가능성을 수로 나타낸 것은?',fr,rw1,rw2,'빨강 '+red+'개를 전체 '+all+'개로 나누어 '+fr+'로 나타냅니다.'],
 [title+'에서 파랑이 나올 가능성을 수로 나타낸 것은?',fb,bw1,bw2,'파랑 '+blue+'개를 전체 '+all+'개로 나누어 '+fb+'로 나타냅니다.'],
 [title+'에서 없는 초록색이 나올 가능성을 나타낸 수는?','0','1/2','1','초록색은 하나도 없어 가능성은 0입니다.'],
 [title+'에서 빨강 또는 파랑이 나올 가능성을 나타낸 수는?','1','0','1/2','모든 결과가 두 색 가운데 하나이므로 가능성은 1입니다.'],
 [title+'에서 빨강이 나올 가능성을 1/2과 비교한 것은?',comparison,red>blue?'1/2보다 작다':'1/2보다 크다',red===blue?'1/2보다 작다':'1/2과 같다','빨강은 '+red+'/'+all+'개이므로 가능성 '+fr+'은 '+comparison+'고 판단합니다.']
 ]};
});
function register(target){for(const bank of banks){if(target.some(b=>b.id===bank.id))throw Error('Duplicate math bank '+bank.id);target.push({...bank,items:bank.items.map(q=>({...q,choices:[...q.choices]}))});}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
