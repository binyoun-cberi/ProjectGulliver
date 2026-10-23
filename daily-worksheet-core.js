(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DailyWorksheetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SUBJECTS={
 korean:{name:'국어',grades:[1,2,3,4,5,6],topics:[['opposite','반대말 찾기',1],['spacing','바른 띄어쓰기',2],['reading','글 읽고 답하기',1],['mainidea','짧은 글의 중심 내용',1,2]]},
 math:{name:'수학',grades:[1,2,3,4,5,6],topics:[['addition','덧셈과 뺄셈',1],['number','수의 자리와 크기',1,3],['time','시각과 시간',1,3],['hundreds','세 자리 수 덧셈',3,3],['multiplication','곱셈',2],['division','나눗셈',3],['fraction','분수',3],['mixed','자연수의 혼합 계산',5,5],['decimal','소수의 계산',5,6]]},
 social:{name:'사회',grades:[3,4,5,6],topics:[['direction','방향과 위치',3],['community','우리 사회의 일',3],['economy','생산과 소비',4],['past','생활 속 옛 모습',3,4],['local','지역의 변화',3,4],['prehistoric','선사와 고조선',5],['ancient','삼국과 남북국',5],['goryeo','고려',5],['joseon','조선',5],['modern','근현대',5]]},
 science:{name:'과학',grades:[3,4,5,6],topics:[['living','생물과 비생물',3],['matter','물질의 상태',3],['weather','날씨 관찰 도구',5]]},
 english:{name:'영어',grades:[3,4,5,6],topics:[['words','기본 낱말',3],['sentence','문장 만들기',3],['conversation','상황에 맞는 대답',3]]}
};
// Semester labels are a browsing aid based on common unit names; textbook order varies.
const MATH_UNITS={
 1:[
  {id:'g1-sum',label:'1학기 · 덧셈과 뺄셈',topics:['addition'],types:[['small-add-10','10 이하의 덧셈','addition'],['small-sub-10','10 이하의 뺄셈','addition']]},
  {id:'g1-sum2',label:'2학기 · 덧셈과 뺄셈',topics:['addition'],types:[['small-add-20-no','20 이하의 덧셈 (받아올림 없음)','addition'],['small-add-20-carry','20 이하의 덧셈 (받아올림 있음)','addition'],['small-sub-20-no','20 이하의 뺄셈 (받아내림 없음)','addition'],['small-sub-20-borrow','20 이하의 뺄셈 (받아내림 있음)','addition']]}
 ],
 2:[
  {id:'g2-sum',label:'1학기 · 덧셈과 뺄셈',topics:['addition'],types:[['two-add-none','두 자리 수 덧셈 (받아올림 없음)','addition'],['two-add-carry','두 자리 수 덧셈 (받아올림 있음)','addition'],['two-sub-none','두 자리 수 뺄셈 (받아내림 없음)','addition'],['two-sub-borrow','두 자리 수 뺄셈 (받아내림 있음)','addition']]},
  {id:'g2-times',label:'2학기 · 곱셈구구',topics:['multiplication'],types:[['times-table','곱셈구구 연습','multiplication'],['times-missing','곱셈구구의 빈칸 찾기','multiplication']]}
 ],
 3:[
  {id:'g3-add',label:'1학기 · 덧셈과 뺄셈',topics:['hundreds','addition'],types:[
   ['add-tens-none','몇백 + 몇백 (받아올림 없음)','hundreds'],['add-ones-none','세 자리 + 세 자리 (받아올림 없음)','hundreds'],
   ['add-carry-one','세 자리 + 세 자리 (받아올림 1번)','hundreds'],['add-carry-units','세 자리 + 세 자리 (일의 자리 받아올림)','hundreds'],['add-carry-tens','세 자리 + 세 자리 (십의 자리 받아올림)','hundreds'],['add-carry-two','세 자리 + 세 자리 (받아올림 2번)','hundreds'],
   ['add-two-digit-no','세 자리 + 두 자리 (받아올림 없음)','hundreds'],['add-two-digit-carry','세 자리 + 두 자리 (받아올림 있음)','hundreds'],
   ['sub-borrow-none','세 자리 − 세 자리 (받아내림 없음)','addition'],['sub-borrow-one','세 자리 − 세 자리 (받아내림 1번)','addition'],['sub-borrow-units','세 자리 − 세 자리 (일의 자리 받아내림)','addition'],['sub-borrow-tens','세 자리 − 세 자리 (십의 자리 받아내림)','addition'],['sub-borrow-two','세 자리 − 세 자리 (받아내림 2번)','addition'],['sub-two-digit-no','세 자리 − 두 자리 (받아내림 없음)','addition'],['sub-two-digit-borrow','세 자리 − 두 자리 (받아내림 있음)','addition']]},
  {id:'g3-division',label:'1학기 · 나눗셈',topics:['division'],types:[['divide-two-one','두 자리 수 ÷ 한 자리 수 (나머지 없음)','division'],['divide-remainder','두 자리 수 ÷ 한 자리 수 (나머지 있음)','division']]},
  {id:'g3-times',label:'2학기 · 곱셈',topics:['multiplication'],types:[['times-two-one','두 자리 수 × 한 자리 수','multiplication'],['times-three-one','세 자리 수 × 한 자리 수','multiplication']]}
 ],
 4:[
  {id:'g4-operations',label:'1학기 · 곱셈과 나눗셈',topics:['multiplication','division'],types:[['times-two-two','두 자리 수 × 두 자리 수','multiplication'],['divide-three-one','세 자리 수 ÷ 한 자리 수','division'],['divide-three-two','세 자리 수 ÷ 두 자리 수','division']]},
  {id:'g4-fraction',label:'2학기 · 분수의 덧셈과 뺄셈',topics:['fraction'],types:[['fraction-add-same','분모가 같은 분수의 덧셈','fraction'],['fraction-sub-same','분모가 같은 분수의 뺄셈','fraction']]}
 ],
 5:[
  {id:'g5-mixed',label:'1학기 · 자연수의 혼합 계산',topics:['mixed'],types:[['mix-add-sub','덧셈과 뺄셈의 혼합 계산','mixed'],['mix-mul-div','곱셈과 나눗셈의 혼합 계산','mixed'],['mix-add-mul','덧셈과 곱셈의 혼합 계산','mixed'],['mix-sub-div','뺄셈과 나눗셈의 혼합 계산','mixed'],['mix-four','사칙연산의 혼합 계산','mixed'],['mix-parentheses','괄호가 있는 덧셈·뺄셈 계산','mixed'],['mix-paren-mul','괄호가 있는 곱셈·나눗셈 계산','mixed'],['mix-paren-add-mul','괄호가 있는 덧셈·곱셈 계산','mixed'],['mix-paren-sub-div','괄호가 있는 뺄셈·나눗셈 계산','mixed'],['mix-paren-four','괄호가 있는 사칙연산','mixed'],['mix-nested','중첩 괄호의 혼합 계산','mixed']]},
  {id:'g5-fraction',label:'1학기 · 약분과 통분·분수의 계산',topics:['fraction'],types:[['fraction-add-diff','분모가 다른 분수의 덧셈','fraction'],['fraction-sub-diff','분모가 다른 분수의 뺄셈','fraction']]},
  {id:'g5-decimal',label:'2학기 · 소수의 곱셈',topics:['decimal'],types:[['decimal-mul-int','소수 × 자연수','decimal'],['decimal-mul-dec','소수 × 소수','decimal']]}
 ],
 6:[
  {id:'g6-fraction',label:'1학기 · 분수의 나눗셈',topics:['fraction'],types:[['fraction-div-int','분수 ÷ 자연수','fraction'],['fraction-div-frac','분수 ÷ 분수','fraction']]},
  {id:'g6-decimal',label:'2학기 · 소수의 나눗셈',topics:['decimal'],types:[['decimal-div-int','소수 ÷ 자연수','decimal'],['decimal-div-dec','소수 ÷ 소수','decimal']]}
 ]
};
const SOCIAL_UNITS={
 3:[{id:'s3-past',label:'생활 속 옛 모습',topics:['past'],types:[['past-evidence','옛 물건으로 생활 추론','past']]},{id:'s3-local',label:'우리 지역의 변화',topics:['local'],types:[['local-evidence','옛날과 오늘 자료 비교','local']]}],
 4:[{id:'s4-past',label:'생활 속 옛 모습',topics:['past'],types:[['past-evidence','옛 물건으로 생활 추론','past']]},{id:'s4-local',label:'우리 지역의 변화',topics:['local'],types:[['local-evidence','옛날과 오늘 자료 비교','local']]}],
 5:[['prehistoric','선사와 고조선'],['ancient','삼국과 남북국'],['goryeo','고려'],['joseon','조선'],['modern','근현대']].map(([id,label])=>({id:'s5-'+id,label,topics:[id],types:[[id+'-evidence','자료에서 근거 찾기',id]]})),
 6:[['prehistoric','선사와 고조선'],['ancient','삼국과 남북국'],['goryeo','고려'],['joseon','조선'],['modern','근현대']].map(([id,label])=>({id:'s6-'+id,label,topics:[id],types:[[id+'-evidence','자료에서 근거 찾기',id]]}))
};
function units(subject,grade){return subject==='math'?(MATH_UNITS[grade]||[]):subject==='social'?(SOCIAL_UNITS[grade]||[]):[]}
function types(subject,grade,topic,unitId){return units(subject,grade).filter(unit=>!unitId||unit.id===unitId).flatMap(unit=>unit.types.filter(entry=>entry[2]===topic).map(([id,label])=>[id,label]))}
// Verified against the 2022 mathematics curriculum (MOE notice 2022-33, appendix 8).
// These are practice links, not a claim that a sheet assesses the entire standard.
const CURRICULUM_SOURCE='https://ncic.re.kr/inv/org/download.do?orgType=ogi4&seq=10003559&year=2022';
const MATH_ALIGNMENT={
 addition:{1:['[2수01-06]','두 자리 수 범위의 덧셈과 뺄셈 계산'],2:['[2수01-06]','두 자리 수 범위의 덧셈과 뺄셈 계산'],3:['[4수01-03]','세 자리 수의 덧셈과 뺄셈 계산'],4:['[4수01-03]','세 자리 수의 덧셈과 뺄셈 계산']},
 hundreds:{3:['[4수01-03]','세 자리 수의 덧셈과 뺄셈 계산']},
 multiplication:{2:['[2수01-11]','곱셈구구와 한 자리 수의 곱셈'],3:['[4수01-04]','곱하는 수가 한두 자리인 곱셈'],4:['[4수01-04]','곱하는 수가 한두 자리인 곱셈']},
 division:{3:['[4수01-06]','한 자리 수로 나누는 계산'],4:['[4수01-07]','두 자리 수로 나누는 계산']}
};
const OTHER_ALIGNMENT={
 korean:{mainidea:{1:['[2국02-03]','글의 중심 내용 확인'],2:['[2국02-03]','글의 중심 내용 확인']}},
 social:{economy:{4:['[4사07-02]','생산·소비 활동과 지역 간 교류 탐색']},past:{3:['[4사02-02]','옛 물건과 자료로 생활 모습 탐색'],4:['[4사02-02]','옛 물건과 자료로 생활 모습 탐색']},local:{3:['[4사02-03]','자료를 통해 지역의 변화 탐색'],4:['[4사02-03]','자료를 통해 지역의 변화 탐색']},prehistoric:{5:['[6사04-01]','선사 시대 유물로 생활 모습 추론'],6:['[6사04-01]','선사 시대 유물로 생활 모습 추론']},ancient:{5:['[6사04-02]','고대의 문화유산과 역사 자료 탐색'],6:['[6사04-02]','고대의 문화유산과 역사 자료 탐색']},goryeo:{5:['[6사04-03]','고려의 역사 자료 탐색'],6:['[6사04-03]','고려의 역사 자료 탐색']}},
 science:{matter:{3:['[4과05-02]','고체·액체·기체의 성질 관찰과 비교'],4:['[4과05-02]','고체·액체·기체의 성질 관찰과 비교']},weather:{5:['[6과06-01]','기상 요소 조사와 생활에 미치는 영향'],6:['[6과06-01]','기상 요소 조사와 생활에 미치는 영향']}},
 english:{words:{3:['[4영01-05]','쉬운 낱말·어구·문장의 의미 이해'],4:['[4영01-05]','쉬운 낱말·어구·문장의 의미 이해'],5:['[6영01-03]','낱말·어구·문장의 의미 이해'],6:['[6영01-03]','낱말·어구·문장의 의미 이해']}}
};
const OTHER_SOURCES={
 korean:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202401091000514080.pdf',
 science:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202411110127574203.pdf',
 english:'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202312210923589990.pdf',
 social:'https://www.nise.go.kr/ebook/src/viewer/download.php?host=main&no=1&site=20240819_172144'
};
function alignment(subject,topic,grade){const math=subject==='math',match=math?MATH_ALIGNMENT[topic]?.[grade]:OTHER_ALIGNMENT[subject]?.[topic]?.[grade];if(!match)return null;
 const scope=math?'이 문제지는 성취기준 중 계산 연습만 다룹니다.':subject==='korean'?'이 문제지는 짧은 글의 중심 내용 고르기만 다룹니다.':subject==='science'&&topic==='matter'?'이 문제지는 물질의 상태 분류만 다룹니다.':subject==='science'?'이 문제지는 기상 관찰 도구 고르기만 다룹니다.':subject==='social'&&topic!=='economy'?'이 문제지는 짧은 자료에서 근거를 찾는 연습만 다룹니다. 성취기준 전체를 평가하지 않습니다.':subject==='social'?'이 문제지는 생산과 소비의 구별만 다룹니다.':'이 문제지는 글로 제시된 낱말의 뜻 고르기만 다룹니다.';
 const source=math?CURRICULUM_SOURCE:subject==='science'&&topic==='weather'?'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202502201106162700.pdf':subject==='english'&&grade>=5?'https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202411110130211774.pdf':OTHER_SOURCES[subject];
 return{code:match[0],summary:match[1],source,scope}}
const OPPOSITES=[['크다','작다'],['높다','낮다'],['길다','짧다'],['빠르다','느리다'],['밝다','어둡다'],['따뜻하다','차갑다'],['무겁다','가볍다'],['넓다','좁다'],['많다','적다'],['가깝다','멀다'],['기쁘다','슬프다'],['시작','끝'],['앞','뒤'],['안','밖'],['위','아래'],['열다','닫다'],['주다','받다'],['들어가다','나오다'],['깨끗하다','더럽다'],['쉽다','어렵다']];
const SPACING=[
 ['할 수 있어요.','할수 있어요.'],['갈 수 없어요.','갈수 없어요.'],['먹을 수 있어요.','먹을수 있어요.'],['읽을 수 있어요.','읽을수 있어요.'],
 ['할 줄 알아요.','할줄 알아요.'],['갈 줄 몰라요.','갈줄 몰라요.'],['볼 줄 알아요.','볼줄 알아요.'],['쓸 줄 알아요.','쓸줄 알아요.'],
 ['한 개를 골라요.','한개를 골라요.'],['두 명이 와요.','두명이 와요.'],['세 장을 주세요.','세장을 주세요.'],['네 마리가 있어요.','네마리가 있어요.'],
 ['집에 갈 거예요.','집에 갈거예요.'],['밥을 먹을 거예요.','밥을 먹을거예요.'],['내일 비가 올 거예요.','내일 비가 올거예요.'],['친구가 올 거예요.','친구가 올거예요.'],
 ['책을 읽는 중이에요.','책을 읽는중이에요.'],['그림을 그리는 중이에요.','그림을 그리는중이에요.'],['집에 가는 길이에요.','집에 가는길이에요.'],['학교에 오는 길이에요.','학교에 오는길이에요.']
];
const READING=[
 ['민지는 비가 와서 우산을 챙겼습니다.','민지가 우산을 챙긴 까닭은?','비가 와서',['비가 와서','해가 뜨거워서','눈이 와서']],
 ['준호는 도서관에서 빌린 책을 다 읽고 반납했습니다.','준호가 책을 반납한 곳은?','도서관',['도서관','운동장','병원']],
 ['화분의 흙이 말라서 소라는 물을 주었습니다.','소라가 화분에 물을 준 까닭은?','흙이 말라서',['흙이 말라서','꽃이 피어서','바람이 불어서']],
 ['우리 반은 교실을 청소한 뒤 함께 쉬었습니다.','우리 반이 쉰 때는?','청소한 뒤',['청소한 뒤','청소하기 전','등교하기 전']],
 ['다람쥐는 도토리를 모아 나무 구멍에 넣었습니다.','다람쥐가 도토리를 넣은 곳은?','나무 구멍',['나무 구멍','연못','꽃밭']],
 ['지우는 친구에게 연필을 빌리고 사용한 뒤 돌려주었습니다.','지우가 연필을 사용한 뒤 한 일은?','돌려주었습니다',['돌려주었습니다','버렸습니다','숨겼습니다']],
 ['기차가 늦게 와서 승객들은 역에서 기다렸습니다.','승객들이 역에서 기다린 까닭은?','기차가 늦게 와서',['기차가 늦게 와서','표를 잃어서','비가 와서']],
 ['아침에는 추웠지만 낮에는 따뜻해져서 외투를 벗었습니다.','외투를 벗은 때는?','낮',['낮','아침','밤']],
 ['현수는 씨앗을 심고 매일 흙의 상태를 살펴보았습니다.','현수가 심은 것은?','씨앗',['씨앗','나무','꽃병']],
 ['유나는 길에서 주운 장갑을 선생님께 가져다드렸습니다.','유나가 선생님께 가져다드린 것은?','장갑',['장갑','우산','가방']],
 ['해가 질 무렵, 아이들은 운동장에서 공놀이를 마치고 집으로 돌아갔습니다.','아이들이 공놀이를 한 곳은?','운동장',['운동장','도서관','교실']],
 ['수연은 동생이 넘어지자 손을 잡아 일으켜 주었습니다.','수연이 동생을 도운 방법은?','손을 잡아 일으켜 주었습니다',['손을 잡아 일으켜 주었습니다','물을 가져왔습니다','신발을 찾아 주었습니다']],
 ['아버지는 시장에서 산 배추로 저녁에 김치를 담갔습니다.','아버지가 배추를 산 곳은?','시장',['시장','학교','공원']],
 ['나무에 새싹이 돋자 준이는 봄이 왔음을 느꼈습니다.','준이가 봄이 왔다고 느낀 까닭은?','새싹이 돋아서',['새싹이 돋아서','눈이 내려서','낙엽이 져서']],
 ['은서는 고장 난 자전거를 수리한 뒤 다시 타고 놀았습니다.','은서가 다시 자전거를 타기 전에 한 일은?','자전거를 수리했습니다',['자전거를 수리했습니다','자전거를 팔았습니다','자전거를 빌렸습니다']],
 ['할머니는 손자에게 옛날 사진을 보여 주며 가족 이야기를 들려주셨습니다.','할머니가 보여 주신 것은?','옛날 사진',['옛날 사진','새 책','그림 지도']]
];
// Each passage has several checked questions, while a sheet uses a passage only once.
const READING_PASSAGES=[
 ['토요일 아침에 하린이는 할머니와 시장에 갔습니다. 할머니는 사과 세 개를 사고, 하린이는 집에서 먹을 빵을 골랐습니다. 두 사람은 비가 오기 전에 집으로 돌아왔습니다.',[
  ['하린이가 시장에서 고른 것은?','빵',['빵','사과','우산']],['두 사람이 비가 오기 전에 한 일은?','집으로 돌아왔습니다',['집으로 돌아왔습니다','공원에 갔습니다','책을 읽었습니다']]]],
 ['민호는 화분을 창가에 두었습니다. 며칠 뒤 흙이 바싹 마른 것을 보고 물을 주었습니다. 다음 날 민호는 잎이 싱싱해진 모습을 보았습니다.',[
  ['민호가 화분에 물을 준 까닭은?','흙이 말랐기 때문입니다',['흙이 말랐기 때문입니다','잎이 떨어졌기 때문입니다','창문이 열렸기 때문입니다']],['물을 준 다음 날 잎은 어떻게 되었나요?','싱싱해졌습니다',['싱싱해졌습니다','시들었습니다','노랗게 변했습니다']]]],
 ['체육 시간에 우리 반은 운동장으로 나갔습니다. 먼저 몸을 풀고 모둠별로 공을 주고받았습니다. 활동이 끝나자 공을 정리하고 손을 씻었습니다.',[
  ['공을 주고받기 전에 한 일은?','몸을 풀었습니다',['몸을 풀었습니다','손을 씻었습니다','공을 정리했습니다']],['활동이 끝난 뒤 한 일은?','공을 정리하고 손을 씻었습니다',['공을 정리하고 손을 씻었습니다','운동장으로 나갔습니다','몸을 풀었습니다']]]],
 ['지수는 도서관에서 동물 책을 빌렸습니다. 집에서 책을 읽다가 모르는 낱말에 표시했습니다. 다음 날 선생님께 뜻을 여쭌 뒤 책을 다시 읽었습니다.',[
  ['지수가 표시한 것은?','모르는 낱말',['모르는 낱말','동물 그림','책 제목']],['지수가 선생님께 여쭌 것은?','낱말의 뜻',['낱말의 뜻','책을 빌리는 방법','도서관 문을 여는 시간']]]],
 ['아침에는 하늘이 맑았습니다. 점심때 검은 구름이 몰려오자 서윤이는 교실 창문을 닫았습니다. 잠시 뒤 비가 내려 운동장 놀이가 취소되었습니다.',[
  ['서윤이가 창문을 닫은 때는?','점심때',['점심때','아침','저녁']],['운동장 놀이가 취소된 까닭은?','비가 내려서',['비가 내려서','바람이 멈춰서','아침에 맑아서']]]],
 ['도윤이는 버스 정류장에서 길을 잃은 동생을 만났습니다. 함께 안내판에서 목적지를 확인한 뒤 알맞은 버스를 기다렸습니다. 버스가 오자 동생과 나란히 탔습니다.',[
  ['버스를 기다리기 전에 확인한 것은?','목적지',['목적지','급식 메뉴','책 제목']],['도윤이가 함께 버스를 탄 사람은?','동생',['동생','할머니','선생님']]]],
 ['학교 텃밭에 심은 상추가 자랐습니다. 우리 반은 큰 잎만 골라 따고 작은 잎은 더 자라도록 남겨 두었습니다. 수확한 상추는 깨끗이 씻어 나누었습니다.',[
  ['우리 반이 남겨 둔 잎은?','작은 잎',['작은 잎','큰 잎','마른 잎']],['상추를 수확한 뒤 한 일은?','씻어서 나누었습니다',['씻어서 나누었습니다','다시 심었습니다','상자에 숨겼습니다']]]],
 ['수빈이는 친구와 종이비행기를 접었습니다. 첫 번째 비행기는 금세 떨어졌습니다. 날개를 조금 넓게 다시 접었더니 두 번째 비행기는 더 멀리 날아갔습니다.',[
  ['두 번째 비행기가 더 멀리 날아가기 전에 바꾼 것은?','날개를 넓게 접었습니다',['날개를 넓게 접었습니다','종이를 적셨습니다','비행기를 버렸습니다']],['먼저 접은 비행기는 어떻게 되었나요?','금세 떨어졌습니다',['금세 떨어졌습니다','더 멀리 날아갔습니다','나무에 걸렸습니다']]]]
];
const COMMUNITY=[
 ['아픈 사람을 진찰하고 치료하는 일','의사'],['불이 난 곳에서 사람을 구하는 일','소방관'],['도서관에서 책을 정리하고 이용을 돕는 일','사서'],
 ['편지와 소포를 배달하는 일','우편 집배원'],['농작물을 기르는 일','농부'],['버스를 운전하여 승객을 태우는 일','버스 기사'],
 ['법을 어긴 일을 조사하고 시민의 안전을 지키는 일','경찰관'],['건물이 안전하게 지어지도록 설계하는 일','건축가'],
 ['음식을 만들고 손님에게 제공하는 일','요리사'],['가게에서 물건을 판매하는 일','판매원'],
 ['동물이 아플 때 진찰하고 치료하는 일','수의사'],['기상 자료를 살펴 날씨를 예보하는 일','기상 예보관'],
 ['학생에게 배움을 가르치고 도와주는 일','교사'],['그림을 그려 책의 내용을 표현하는 일','삽화가'],
 ['기계를 점검하고 고치는 일','정비사'],['새로운 사실을 조사하여 기사로 알리는 일','기자']
];
const ECONOMY=[
 ['농부가 사과를 길러 수확했습니다.','생산'],['제과사가 빵을 만들었습니다.','생산'],['공장에서 연필을 만들었습니다.','생산'],
 ['목수가 책상을 만들었습니다.','생산'],['어부가 바다에서 물고기를 잡았습니다.','생산'],['작가가 책을 썼습니다.','생산'],
 ['가족이 빵을 사서 먹었습니다.','소비'],['학생이 공책을 사서 사용했습니다.','소비'],['버스를 타고 요금을 냈습니다.','소비'],
 ['동생이 우유를 마셨습니다.','소비'],['가족이 영화표를 사서 영화를 보았습니다.','소비'],['새 연필을 사서 글씨를 썼습니다.','소비'],
 ['공장에서 신발을 만들었습니다.','생산'],['농부가 벼를 길렀습니다.','생산'],['학생이 산 빵을 먹었습니다.','소비'],['가족이 산 옷을 입었습니다.','소비']
];
const MAIN_IDEAS=[
 ["비가 오자 민지는 우산을 폈습니다. 집에 갈 때까지 옷이 젖지 않았습니다.", "민지는 우산으로 비를 피했습니다."],
 ["준호는 도서관에서 책을 빌렸습니다. 읽은 뒤에는 제자리에 돌려놓았습니다.", "준호는 빌린 책을 읽고 돌려놓았습니다."],
 ["화분의 흙이 말랐습니다. 소라는 물을 주고 창가에 놓았습니다.", "소라는 화분을 돌보았습니다."],
 ["우리 반은 책상을 닦았습니다. 바닥도 쓸어 교실이 깨끗해졌습니다.", "우리 반은 교실을 청소했습니다."],
 ["다람쥐는 도토리를 주웠습니다. 먹고 남은 것은 나무 구멍에 모아 두었습니다.", "다람쥐는 도토리를 모아 두었습니다."],
 ["지우는 친구에게 연필을 빌렸습니다. 다 쓰고 고맙다고 말하며 돌려주었습니다.", "지우는 빌린 연필을 돌려주었습니다."],
 ["기차가 늦게 왔습니다. 승객들은 역에서 기다렸다가 기차에 올랐습니다.", "승객들은 늦은 기차를 기다렸습니다."],
 ["아침에는 추워서 외투를 입었습니다. 낮에는 따뜻해져 외투를 벗었습니다.", "날씨가 따뜻해져 외투를 벗었습니다."],
 ["현수는 씨앗을 심었습니다. 날마다 흙을 살피고 물을 주었습니다.", "현수는 심은 씨앗을 돌보았습니다."],
 ["유나는 길에서 장갑을 주웠습니다. 주인을 찾으려고 선생님께 가져갔습니다.", "유나는 주운 장갑의 주인을 찾으려 했습니다."],
 ["아이들은 운동장에서 공을 찼습니다. 해가 지자 공을 챙겨 집으로 갔습니다.", "아이들은 공놀이를 마치고 집으로 갔습니다."],
 ["동생이 넘어지자 수연이 손을 내밀었습니다. 동생은 그 손을 잡고 일어났습니다.", "수연은 넘어진 동생을 도왔습니다."],
 ["아버지는 시장에서 배추를 샀습니다. 집에 와서 씻고 김치를 담갔습니다.", "아버지는 배추로 김치를 담갔습니다."],
 ["나뭇가지에 새싹이 돋았습니다. 준이는 봄이 왔다고 느꼈습니다.", "준이는 새싹을 보고 봄을 느꼈습니다."],
 ["자전거가 고장 나서 탈 수 없었습니다. 은서는 바퀴를 고친 뒤 다시 탔습니다.", "은서는 자전거를 고쳐 다시 탔습니다."],
 ["할머니는 옛날 사진을 꺼냈습니다. 사진을 보며 가족 이야기를 들려주셨습니다.", "할머니는 사진을 보며 가족 이야기를 하셨습니다."]
];
const LIVING=[['참새','생물'],['강아지','생물'],['소나무','생물'],['민들레','생물'],['버섯','생물'],['지렁이','생물'],['개미','생물'],['이끼','생물'],['콩나물','생물'],['고양이','생물'],['돌멩이','비생물'],['유리컵','비생물'],['책상','비생물'],['장난감 자동차','비생물'],['물','비생물'],['공기','비생물'],['연필','비생물'],['종이','비생물'],['모래','비생물'],['자전거','비생물']];
const MATTER=[['얼음','고체'],['돌','고체'],['소금','고체'],['나무 책상','고체'],['유리컵','고체'],['연필','고체'],['물','액체'],['우유','액체'],['식용유','액체'],['주스','액체'],['식초','액체'],['간장','액체'],['공기','기체'],['수증기','기체'],['산소','기체'],['이산화 탄소','기체'],['헬륨','기체']];
const WEATHER=[
 ['기온을 재는 도구','온도계'],['비가 내린 양을 재는 도구','우량계'],['바람이 불어오는 방향을 재는 도구','풍향계'],['바람의 빠르기를 재는 도구','풍속계'],
 ['오늘의 기온을 알고 싶을 때','온도계'],['밤새 내린 비의 양을 알고 싶을 때','우량계'],['바람이 어느 쪽에서 오는지 알고 싶을 때','풍향계'],['바람이 얼마나 빠르게 부는지 알고 싶을 때','풍속계'],
 ['운동장 바람의 방향을 알고 싶을 때','풍향계'],['비 오는 날 강수량을 조사할 때','우량계'],['현재 공기의 온도를 재고 싶을 때','온도계'],['태풍이 올 때 바람의 빠르기를 재고 싶을 때','풍속계'],
 ['어제와 오늘의 기온을 비교하고 싶을 때','온도계'],['빗물이 얼마나 모였는지 재고 싶을 때','우량계'],['바람이 불어오는 쪽을 관찰할 때','풍향계'],['바람의 세기를 수치로 비교하고 싶을 때','풍속계']
];
const WORDS=[['apple','사과'],['book','책'],['school','학교'],['water','물'],['friend','친구'],['family','가족'],['cat','고양이'],['dog','개'],['sun','태양'],['moon','달'],['tree','나무'],['flower','꽃'],['milk','우유'],['pencil','연필'],['chair','의자'],['table','탁자'],['happy','행복한'],['small','작은'],['big','큰'],['blue','파란색'],['red','빨간색'],['yellow','노란색'],['morning','아침'],['night','밤']];
const SENTENCES=[
 ['나는 사과를 좋아해요.','I like apples.','I / like / apples.'],['이것은 내 책이에요.','This is my book.','This / is / my / book.'],
 ['나는 물을 마셔요.','I drink water.','I / drink / water.'],['그녀는 내 친구예요.','She is my friend.','She / is / my / friend.'],
 ['하늘은 파래요.','The sky is blue.','The / sky / is / blue.'],['나는 학교에 가요.','I go to school.','I / go / to / school.'],
 ['이것은 고양이예요.','This is a cat.','This / is / a / cat.'],['나는 책을 읽어요.','I read a book.','I / read / a / book.'],
 ['그는 우유를 마셔요.','He drinks milk.','He / drinks / milk.'],['우리는 행복해요.','We are happy.','We / are / happy.'],
 ['나는 빨간 사과를 봐요.','I see a red apple.','I / see / a / red / apple.'],['이것은 작은 개예요.','This is a small dog.','This / is / a / small / dog.'],
 ['우리는 학교에 가요.','We go to school.','We / go / to / school.'],['그것은 파란 책이에요.','It is a blue book.','It / is / a / blue / book.'],
 ['나는 강아지를 좋아해요.','I like dogs.','I / like / dogs.'],['이것은 내 연필이에요.','This is my pencil.','This / is / my / pencil.']
];
const CONVERSATIONS=[
 ['How are you?','I am fine.',['I am fine.','It is a book.','It is blue.']],['What is your name?','My name is Mina.',['My name is Mina.','I am ten.','It is sunny.']],
 ['What color is it?','It is blue.',['It is blue.','I am hungry.','It is a dog.']],['Do you like apples?','Yes, I do.',['Yes, I do.','It is red.','My name is Mina.']],
 ['Where is the library?','It is next to the school.',['It is next to the school.','It is a pencil.','I like milk.']],
 ['How old are you?','I am ten years old.',['I am ten years old.','I am fine.','It is ten o’clock.']],
 ['What time is it?','It is three o’clock.',['It is three o’clock.','It is a chair.','I am three.']],
 ['Can you swim?','Yes, I can.',['Yes, I can.','Yes, it is.','Yes, I do.']],['What is this?','It is a pencil.',['It is a pencil.','I am happy.','It is Monday.']],
 ['How is the weather?','It is sunny.',['It is sunny.','I am seven.','It is a book.']],
 ['What day is it today?','It is Monday.',['It is Monday.','It is a pencil.','I am ten.']],
 ['Are you hungry?','Yes, I am.',['Yes, I am.','Yes, I do.','Yes, it is.']],
 ['Where is my book?','It is on the desk.',['It is on the desk.','It is sunny.','I am fine.']],
 ['What do you want?','I want water.',['I want water.','I am seven.','It is Friday.']],
 ['Thank you.','You are welcome.',['You are welcome.','I am sorry.','Good night.']],
 ['Good morning!','Good morning!',['Good morning!','Good night!','Goodbye!']]
];
function rng(seed){let state=(Number(seed)>>>0)||1;return()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}}
function pick(list,r){return list[Math.floor(r()*list.length)]}
function shuffle(list,r){const copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function int(min,max,r){return min+Math.floor(r()*(max-min+1))}
function choice(prompt,answer,options,r,detail=''){return{prompt,answer,choices:shuffle([...new Set(options)],r),detail}}
// Original, short classroom evidence prompts. Historical facts are cross-checkable in the
// National Institute of Korean History elementary history collection; local cases are fictional.
const HISTORY_BASE='https://contents.history.go.kr/front/newEh/list.do?code=';
const SOCIAL_EVIDENCE={
 past:{source:'',cards:[
  ['옛 다리미는 안에 달군 숯을 넣어 천을 눌렀습니다.','전기를 쓰지 않고 열을 얻었습니다.','전기 콘센트에 꽂았습니다.','물을 얼려 옷을 폈습니다.'],
  ['옛 우물가에서는 사람들이 두레박으로 물을 길었습니다.','생활에 필요한 물을 직접 길었습니다.','수도꼭지를 틀었습니다.','물을 배달하는 차를 탔습니다.'],
  ['옛 사진에는 같은 길에 자동차보다 손수레가 많이 보입니다.','물건을 옮기는 수단이 지금과 달랐습니다.','자동차만 이용했습니다.','길에 아무도 다니지 않았습니다.'],
  ['옛 편지는 종이에 글을 쓰고 우표를 붙여 보냈습니다.','소식을 전하는 데 종이와 우편을 썼습니다.','휴대 전화로 사진을 보냈습니다.','영상 통화를 했습니다.'],
  ['옛 교실 사진에는 칠판 앞에 학생들이 함께 앉아 있습니다.','사진으로 당시 교실 모습을 살펴볼 수 있습니다.','사진만으로 모든 학생의 생각을 알 수 있습니다.','사진이 미래의 교실을 보여 줍니다.'],
  ['할머니는 어릴 때 연탄을 갈아 끼워 방을 데웠다고 말씀하셨습니다.','구술 자료로 옛 난방 방식을 알 수 있습니다.','모든 집에서 지금도 연탄만 씁니다.','말씀만으로 정확한 연도를 알 수 있습니다.'],
  ['옛 장부에는 시장에서 판 물건과 날짜가 적혀 있습니다.','기록으로 당시 거래를 조사할 수 있습니다.','장부가 물건의 냄새까지 알려 줍니다.','장부는 미래의 가격표입니다.'],
  ['옛 사진에는 사람들이 빨랫감을 냇가에서 씻고 있습니다.','빨래하는 장소와 방법을 추론할 수 있습니다.','모든 집에 세탁기가 있었습니다.','사진만으로 모두의 직업을 알 수 있습니다.']
 ]},
 local:{source:'',cards:[
  ['옛 지도에는 논이 있던 자리에 오늘 지도에는 아파트가 있습니다.','땅을 이용하는 모습이 달라졌습니다.','논의 위치가 전혀 바뀌지 않았습니다.','옛 지도에 아파트가 있었습니다.'],
  ['옛 사진에는 흙길이, 같은 장소의 오늘 사진에는 포장도로가 보입니다.','길의 모습이 달라졌습니다.','오늘 사진이 더 오래되었습니다.','사진으로 길의 폭을 정확히 재야만 합니다.'],
  ['옛 지도에는 작은 나루터가, 오늘 지도에는 강을 건너는 다리가 있습니다.','강을 건너는 시설이 달라졌습니다.','옛날에는 다리만 이용했습니다.','강이 사라졌습니다.'],
  ['옛 신문에는 시장이 월요일마다 섰다고 쓰여 있고 오늘 안내에는 매일 연다고 적혀 있습니다.','시장 운영 날짜가 달라졌습니다.','옛 시장도 매일 열렸습니다.','오늘은 월요일에만 엽니다.'],
  ['옛 사진 속 빈터에 오늘은 도서관이 서 있습니다.','지역의 시설이 달라졌습니다.','도서관은 옛 사진에도 있습니다.','빈터는 언제나 그대로였습니다.'],
  ['옛 기록에는 배로 건너던 길을 오늘은 버스로 이동한다고 적혀 있습니다.','이동 수단이 달라졌습니다.','오늘도 배만 이용합니다.','버스가 배보다 먼저 있었습니다.'],
  ['옛 지도에 표시된 작은 학교가 오늘 지도에는 큰 학교로 나타납니다.','같은 장소의 학교 규모가 달라졌을 수 있습니다.','지도만으로 학생 수를 정확히 알 수 있습니다.','학교가 언제나 작았습니다.'],
  ['옛 사진에는 공장 굴뚝이, 오늘 사진에는 공원이 같은 자리에 보입니다.','공간의 쓰임이 달라졌습니다.','오늘도 공장이 그대로 있습니다.','옛 사진에 공원이 보입니다.']
 ]},
 prehistoric:{source:HISTORY_BASE+'eh_age_10',cards:[
  ['암사동 집터에는 땅을 파서 만든 움집 흔적이 남았습니다.','사람들이 이곳에 살았습니다.','이곳에서 철도를 놓았습니다.','이곳에서 책을 인쇄했습니다.'],
  ['암사동 유적에서 그물추가 발견되었습니다.','물고기를 잡는 데 그물을 썼을 수 있습니다.','비행기를 만들었습니다.','한글을 가르쳤습니다.'],
  ['암사동 유적에서 갈돌과 갈판이 발견되었습니다.','곡식을 갈아 먹었을 수 있습니다.','쇠를 녹였습니다.','기계를 운전했습니다.'],
  ['빗살무늬 토기는 음식을 담거나 조리하는 데 쓰였습니다.','토기를 생활에 이용했습니다.','금속으로 만든 그릇입니다.','전기로 작동했습니다.'],
  ['강가의 신석기 집터에서 여러 생활 도구가 함께 나왔습니다.','같은 장소에서 생활한 흔적을 살펴볼 수 있습니다.','집터만으로 주민의 이름을 알 수 있습니다.','도구는 모두 현대 물건입니다.'],
  ['청동기 시대 고인돌 아래에서 무덤 구조가 발견되었습니다.','고인돌을 무덤으로 사용했습니다.','고인돌은 전기 발전소였습니다.','고인돌은 우편함이었습니다.'],
  ['큰 고인돌을 만들려면 무거운 돌을 함께 옮겨야 했습니다.','여러 사람의 협력이 필요했을 수 있습니다.','한 사람이 종이로 만들었습니다.','현대 중장비가 반드시 있었습니다.'],
  ['유적에서 나온 유물은 만들어진 시대와 사용 흔적을 함께 살핍니다.','유물의 특징을 근거로 생활 모습을 추론합니다.','유물 하나로 모든 사람의 삶을 단정합니다.','유물의 색만 보고 시대를 확정합니다.']
 ]},
 ancient:{source:HISTORY_BASE+'eh_age_10',cards:[
  ['고구려 고분 벽화에는 당시 사람들이 그린 인물과 생활 장면이 남아 있습니다.','그림을 통해 당시 모습을 조사할 수 있습니다.','그림만으로 모든 사람의 생각을 알 수 있습니다.','벽화는 오늘 촬영한 사진입니다.'],
  ['무령왕릉에서는 무덤 주인을 알려 주는 기록이 발견되었습니다.','기록과 유물을 함께 살펴 무덤을 연구합니다.','무덤 주인을 마음대로 정합니다.','무덤 기록은 생활과 관계없습니다.'],
  ['무령왕릉에서 나온 물건과 묘지는 함께 발견된 자료입니다.','여러 자료를 비교해 해석할 수 있습니다.','물건의 개수만으로 모든 역사를 알 수 있습니다.','묘지는 현대 광고입니다.'],
  ['고분에서 나온 장신구는 당시의 제작 기술을 살필 단서가 됩니다.','유물의 재료와 모양을 조사합니다.','장신구가 왕의 말을 녹음했습니다.','장신구만으로 정확한 날씨를 압니다.'],
  ['삼국의 유적은 서로 다른 지역에서 발견됩니다.','출토 장소를 살펴 각 나라의 흔적을 조사합니다.','발견 장소는 언제나 중요하지 않습니다.','유적은 모두 같은 날 만들어졌습니다.'],
  ['절터에서 발견된 기와는 건물의 흔적을 알려 줍니다.','유물과 터를 함께 살펴 건물을 추론합니다.','기와만으로 건물의 모든 사람을 알 수 있습니다.','기와는 현대 플라스틱입니다.'],
  ['옛 비석의 글은 당시 사람들이 남긴 기록입니다.','글의 내용과 세워진 맥락을 함께 읽습니다.','비석에 적힌 말은 비교할 필요가 없습니다.','비석은 미래의 뉴스입니다.'],
  ['옛 무덤의 벽화와 출토품은 종류가 다른 자료입니다.','자료를 비교하면 추론의 근거가 늘어납니다.','한 가지 자료만 반드시 참입니다.','자료의 종류가 다르면 비교할 수 없습니다.']
 ]},
 goryeo:{source:HISTORY_BASE+'eh_age_20',cards:[
  ['고려청자는 흙으로 빚고 유약을 입혀 구웠습니다.','도자기 제작 기술을 살필 수 있습니다.','종이로 만든 그릇입니다.','현대 플라스틱입니다.'],
  ['고려의 팔만대장경은 나무판에 글자를 새겨 만들었습니다.','목판 인쇄에 필요한 기술과 노력을 살필 수 있습니다.','전자책으로만 남았습니다.','바위에 그림만 그렸습니다.'],
  ['대장경 목판에는 여러 글자가 거꾸로 새겨져 있습니다.','찍어 낸 글자가 바르게 보이도록 했습니다.','글을 읽지 못하게 하려 했습니다.','목판을 거울로 사용했습니다.'],
  ['고려 시대 금속활자로 찍은 책이 전해집니다.','금속활자 인쇄를 연구할 근거입니다.','컴퓨터 프린터를 사용했습니다.','책을 전혀 만들지 않았습니다.'],
  ['고려의 수도 개경과 관련한 기록이 남아 있습니다.','기록을 통해 수도의 모습을 조사할 수 있습니다.','기록만으로 모든 거리의 길이를 압니다.','개경은 오늘의 지명입니다.'],
  ['고려 시대의 불상과 절터가 전해집니다.','종교와 관련된 문화유산을 조사합니다.','모든 사람의 직업을 알아냅니다.','현대 놀이 기구의 흔적입니다.'],
  ['청자와 목판은 서로 다른 재료로 만든 고려의 유물입니다.','재료와 쓰임을 비교할 수 있습니다.','두 유물 모두 종이로만 만들었습니다.','두 유물은 같은 기능만 했습니다.'],
  ['옛 책의 간행 기록은 만든 때와 목적을 밝히는 단서가 됩니다.','유물과 기록을 함께 확인합니다.','책 표지만 보고 모든 내용을 단정합니다.','간행 기록은 필요 없는 자료입니다.']
 ]},
 joseon:{source:HISTORY_BASE+'eh_age_30',cards:[
  ['조선의 향교는 지역에서 유학을 가르치는 교육 공간이었습니다.','유학 교육의 흔적을 살필 수 있습니다.','비행기 정비 장소였습니다.','전화 교환소였습니다.'],
  ['조선의 과거 시험은 관리 선발과 관련이 있었습니다.','관리 선발 방식을 조사할 수 있습니다.','모든 주민이 자동으로 관리가 되었습니다.','기계를 평가하는 시험이었습니다.'],
  ['세종 때 창제된 훈민정음의 해례에는 글자의 원리가 설명되어 있습니다.','문자의 원리를 기록에서 확인할 수 있습니다.','글자가 자연에서 저절로 생겼습니다.','해례는 현대 문자 메시지입니다.'],
  ['조선 시대 실록에는 나라에서 있었던 일이 기록되어 있습니다.','당시 기록을 살펴 사건을 조사합니다.','실록만으로 모든 사람의 생각을 압니다.','실록은 미래 예측서입니다.'],
  ['조선 후기의 풍속화에는 당시 사람들의 모습이 그려져 있습니다.','그림에서 생활 모습을 살펴볼 수 있습니다.','그림이 정확한 사진과 같습니다.','그림만으로 모든 사람의 이름을 압니다.'],
  ['조선 후기 장시에는 사람들이 물건을 사고팔았습니다.','교환과 거래의 모습을 살필 수 있습니다.','장시에서는 아무도 물건을 팔지 않았습니다.','모든 거래가 전자 결제였습니다.'],
  ['개항기 항구와 관련한 기록에는 외국과의 교류가 나타납니다.','교류가 늘어난 배경을 조사할 수 있습니다.','외국과의 접촉이 전혀 없었습니다.','기록은 오늘 작성되었습니다.'],
  ['옛 사진과 문서는 개항 무렵의 변화를 보여 주는 서로 다른 자료입니다.','두 자료를 비교해 변화를 조사합니다.','사진만 보고 문서를 버립니다.','문서의 날짜는 확인하지 않습니다.']
 ]},
 modern:{source:HISTORY_BASE+'eh_age_50',cards:[
  ['일제 강점기 독립운동 선언서에는 독립을 바라는 뜻이 담겨 있습니다.','선언서에서 운동의 목적을 확인할 수 있습니다.','선언서가 전쟁의 모든 일을 설명합니다.','선언서는 오늘의 광고입니다.'],
  ['3·1 운동 당시 여러 지역의 사람들이 독립 만세를 외쳤습니다.','운동이 여러 곳으로 퍼졌음을 살필 수 있습니다.','오직 한 장소에서만 일어났습니다.','운동과 독립은 관계없습니다.'],
  ['독립운동가의 편지에는 당시의 생각과 상황이 담길 수 있습니다.','편지 작성자와 날짜를 확인하며 읽습니다.','편지만으로 모든 사람의 생각을 압니다.','편지는 모두 같은 사람이 썼습니다.'],
  ['1945년 광복을 알리는 당시 신문 기사가 남아 있습니다.','기사가 작성된 때와 내용을 살펴봅니다.','기사는 사건보다 수백 년 앞서 쓰였습니다.','신문의 날짜는 중요하지 않습니다.'],
  ['광복 직후의 사진에는 거리에서 기뻐하는 사람들이 보입니다.','사진에서 당시의 한 장면을 볼 수 있습니다.','사진만으로 모든 사람의 마음을 압니다.','사진은 미래의 거리입니다.'],
  ['한국 전쟁 시기의 피란 기록에는 살던 곳을 떠난 경험이 담겨 있습니다.','전쟁이 사람들의 생활에 끼친 영향을 살핍니다.','전쟁 중에 아무도 이동하지 않았습니다.','기록은 전쟁과 관계없습니다.'],
  ['전쟁 전후의 가족 사진과 구술 자료가 남아 있습니다.','사진과 증언을 비교해 삶의 변화를 조사합니다.','한 장의 사진이 모든 가족을 대표합니다.','구술 자료는 확인할 필요가 없습니다.'],
  ['같은 사건의 신문과 개인 일기는 서로 다른 관점의 자료입니다.','자료를 비교하고 작성자를 확인합니다.','자료는 모두 같은 관점으로 쓰입니다.','날짜를 확인하지 않아도 됩니다.']
 ]}
};
function socialEvidence(topic,r){const bank=SOCIAL_EVIDENCE[topic],index=int(0,bank.cards.length-1,r),[detail,answer,wrong1,wrong2]=bank.cards[index],variant=int(0,1,r);
 return {...choice(variant?'이 자료를 바탕으로 가장 타당한 설명을 고르세요.':'자료에서 알 수 있는 것을 고르세요.',answer,[answer,wrong1,wrong2],r,detail),explanation:`자료의 ‘${detail}’라는 단서를 바탕으로 ${answer}`,source:bank.source,sourceLabel:bank.source?'국사편찬위원회 초등 역사 자료':'교실용 가상 자료'};
}
function available(topic,grade){return grade>=topic[2]&&grade<=(topic[3]??6)}
function carrying(a,b){for(let unit=1;unit<=Math.max(a,b);unit*=10)if(Math.floor(a/unit)%10+Math.floor(b/unit)%10>=10)return true;return false}
function carryCount(a,b,subtract=false){let carry=0,count=0;for(let unit=1;unit<=100;unit*=10){const x=Math.floor(a/unit)%10,y=Math.floor(b/unit)%10;if(subtract){const next=x-carry<y?1:0;count+=next;carry=next}else{const next=x+y+carry>=10?1:0;count+=next;carry=next}}return count}
function typedArithmetic(type,r){
 const add=type.startsWith('add-')||type.includes('-add-'),target=type.endsWith('-two')?2:/-(one|carry|borrow|units|tens)$/.test(type)?1:0,tens=type==='add-tens-none',small=type.startsWith('small-'),two=type.startsWith('two-'),short=type.includes('-two-digit-');
 for(let attempt=0;attempt<10000;attempt++){
  const cap=small?(type.includes('-10')?10:20):two?99:999;
  const a=tens?int(1,8,r)*100:int(small?2:two?10:100,small?cap:two?89:899,r);
  const b=tens?int(1,9-Math.floor(a/100),r)*100:int(small?1:short?10:two?10:100,small?cap:short?99:two?89:899,r);
  if(add&&a+b>cap||!add&&a<=b||carryCount(a,b,!add)!==target)continue;
  if(type.endsWith('-units')&&(add?a%10+b%10<10:a%10>=b%10))continue;
  if(type.endsWith('-tens')&&(add?a%10+b%10>=10:a%10<b%10))continue;
  return{prompt:`${a} ${add?'+':'−'} ${b} =`,answer:String(add?a+b:a-b),choices:[]};
 }
 throw Error('선택한 유형의 문제를 만들지 못했어요.');
}
function typedMultiplication(type,r){
 const table=type==='times-table'||type==='times-missing',a=int(table?2:type==='times-three-one'?100:10,table?9:type==='times-three-one'?299:89,r),b=int(type==='times-two-two'?10:2,type==='times-two-two'?19:9,r);
 return{prompt:type==='times-missing'?`□ × ${b} = ${a*b}`:`${a} × ${b} =`,answer:String(type==='times-missing'?a:a*b),choices:[]};
}
function typedDivision(type,r){
 const divisor=int(type==='divide-three-two'?11:2,type==='divide-three-two'?19:9,r),min=type.startsWith('divide-three')?100:20,max=type.startsWith('divide-three')?999:99;
 const quotient=int(Math.ceil(min/divisor),Math.floor((max-(type==='divide-remainder'?divisor-1:0))/divisor),r),remainder=type==='divide-remainder'?int(1,divisor-1,r):0;
 return{prompt:`${divisor*quotient+remainder} ÷ ${divisor} =`,answer:String(quotient)+(remainder?' … '+remainder:''),choices:[]};
}
function gcd(a,b){return b?gcd(b,a%b):a}
function fractionText(a,b){const divisor=gcd(a,b),numerator=a/divisor,denominator=b/divisor;return denominator===1?String(numerator):`${numerator}/${denominator}`}
function typedFraction(type,r){
 if(type.endsWith('-same')){const den=int(5,12,r),a=int(type.includes('-sub-')?2:1,den-2,r),b=int(1,type.includes('-sub-')?a-1:den-1-a,r);return{prompt:`${a}/${den} ${type.includes('-sub-')?'−':'+'} ${b}/${den} =`,answer:fractionText(type.includes('-sub-')?a-b:a+b,den),choices:[]}}
 const den=int(3,9,r),other=int(3,9,r),a=int(1,den-1,r),b=int(1,other-1,r);
 if(type==='fraction-div-int'){const divisor=int(2,6,r);return{prompt:`${a}/${den} ÷ ${divisor} =`,answer:fractionText(a,den*divisor),choices:[]}}
 if(type==='fraction-div-frac')return{prompt:`${a}/${den} ÷ ${b}/${other} =`,answer:fractionText(a*other,den*b),choices:[]};
 if(type.endsWith('-diff')&&den===other||type==='fraction-sub-diff'&&a*other<=b*den)return typedFraction(type,r);
 return{prompt:`${a}/${den} ${type==='fraction-sub-diff'?'−':'+'} ${b}/${other} =`,answer:fractionText(type==='fraction-sub-diff'?a*other-b*den:a*other+b*den,den*other),choices:[]};
}
function decimalText(tenths){return String(tenths/10)}
function typedDecimal(type,r){
 const a=int(11,89,r),b=int(type.endsWith('-int')?2:11,type.endsWith('-int')?9:49,r);
 if(type.startsWith('decimal-mul'))return{prompt:`${decimalText(a)} × ${type.endsWith('-int')?b:decimalText(b)} =`,answer:String(a*b/(type.endsWith('-int')?10:100)),choices:[]};
 const quotient=int(2,19,r),divisor=type.endsWith('-int')?b:b/10;
 const dividend=Number((quotient*divisor/10).toFixed(2));
 return{prompt:`${dividend} ÷ ${divisor} =`,answer:String(quotient/10),choices:[]};
}
function typedMath(type,r){
 if(/^(add-|sub-|small-|two-)/.test(type))return typedArithmetic(type,r);
 if(type.startsWith('times-'))return typedMultiplication(type,r);
 if(type.startsWith('divide-'))return typedDivision(type,r);
 if(type.startsWith('mix-'))return mixedArithmetic(type,r);
 if(type.startsWith('fraction-'))return typedFraction(type,r);
 if(type.startsWith('decimal-'))return typedDecimal(type,r);
 throw Error('지원하지 않는 세부 유형입니다.');
}
function mixedArithmetic(type,r){
 const a=int(12,89,r),b=int(11,49,r),c=int(2,9,r),d=int(2,9,r);
 if(type==='mix-add-sub'){const start=a+b+c,ops=r()<.5?[`${start} − ${b} + ${c}`,start-b+c]:[`${a} + ${b} − ${c}`,a+b-c];return{prompt:ops[0]+' =',answer:String(ops[1]),choices:[]}}
 if(type==='mix-mul-div'){const x=c*d;return{prompt:`${x} × ${b} ÷ ${c} =`,answer:String(d*b),choices:[]}}
 if(type==='mix-add-mul')return{prompt:`${a} + ${b} × ${c} =`,answer:String(a+b*c),choices:[]};
 if(type==='mix-sub-div')return{prompt:`${a} − ${c*d} ÷ ${c} =`,answer:String(a-d),choices:[]};
 if(type==='mix-four')return{prompt:`${a} + ${b} × ${c} − ${d} =`,answer:String(a+b*c-d),choices:[]};
 if(type==='mix-parentheses')return{prompt:`${a+b} − (${b} − ${c}) =`,answer:String(a+c),choices:[]};
 if(type==='mix-paren-mul')return{prompt:`${c*d} × (${b*c} ÷ ${c}) =`,answer:String(c*d*b),choices:[]};
 if(type==='mix-paren-add-mul')return{prompt:`(${a} + ${b}) × ${c} =`,answer:String((a+b)*c),choices:[]};
 if(type==='mix-paren-sub-div')return{prompt:`(${b+c*d} − ${b}) ÷ ${c} =`,answer:String(d),choices:[]};
 if(type==='mix-paren-four')return{prompt:`(${a} + ${b}) × ${c} − ${d} =`,answer:String((a+b)*c-d),choices:[]};
 return{prompt:`${a} + (${b} − (${c} + ${d})) =`,answer:String(a+b-c-d),choices:[]};
}
function arithmetic(grade,difficulty,r){
 const cap=grade===1?(difficulty==='basic'?10:20):grade===2?99:grade<=4?999:100000;
 let a,b;
 for(let i=0;i<300;i++){
  a=int(grade===1?1:grade<=2?10:grade<=4?100:10,Math.floor(cap*(grade<=4&&grade>=3?.7:.75)),r);
  b=int(grade<=4&&grade>=3?100:1,Math.min(cap-a,Math.floor(cap*(grade<=4&&grade>=3?.3:.45))),r);
  if(grade>3||carrying(a,b)===(difficulty==='challenge'))break;
 }
 const minus=r()<.5;
 return minus?{prompt:`${a+b} − ${b} =`,answer:String(a),choices:[]}:{prompt:`${a} + ${b} =`,answer:String(a+b),choices:[]};
}
function item(subject,topic,grade,r,difficulty,variant){
 if(subject==='korean'){
  if(topic==='opposite'){const [word,answer]=pick(OPPOSITES,r);const pool=OPPOSITES.flat().filter(v=>v!==word&&v!==answer);return choice('‘'+word+'’의 반대말은 무엇인가요?',answer,[answer,...shuffle(pool,r).slice(0,3)],r)}
  if(topic==='spacing'){const [correct,wrong]=pick(SPACING,r);return choice('바르게 띄어 쓴 문장을 고르세요.',correct,[correct,wrong],r)}
  if(topic==='mainidea'){const [passage,answer]=pick(MAIN_IDEAS,r),others=MAIN_IDEAS.map(v=>v[1]).filter(v=>v!==answer);return choice('이 글의 중심 내용은 무엇인가요?',answer,[answer,...shuffle(others,r).slice(0,2)],r,passage)}
  if(grade<=2||r()<.35){const [passage,question,answer,options]=pick(READING,r);return choice(question,answer,options,r,passage)}
  const [passage,questions]=pick(READING_PASSAGES,r),[question,answer,options]=pick(questions,r);return choice(question,answer,options,r,passage);
 }
 if(subject==='math'){
  if(topic==='addition')return arithmetic(grade,difficulty,r);
  if(topic==='hundreds'){
   const hundreds=int(1,8,r),tens=int(0,9,r),ones=variant==='ones'?int(0,9,r):0,a=hundreds*100+tens*10+ones;
   const b=int(1,9-hundreds,r)*100+int(0,9-tens,r)*10+(variant==='ones'?int(0,9-ones,r):0);
   return{prompt:`${a} + ${b} =`,answer:String(a+b),choices:[]};
  }
  if(topic==='number'){
   const unit=grade===1?10:grade===2?100:1000,n=grade===1?int(10,99,r):grade===2?int(100,999,r):int(1000,9999,r);
   if(difficulty==='basic')return{prompt:`수 ${n}. ${unit}씩 묶으면 몇 묶음이고, 얼마가 남나요?`,answer:`${Math.floor(n/unit)}묶음, ${n%unit}`,choices:[]};
   const other=grade===1?int(10,99,r):grade===2?int(100,999,r):int(1000,9999,r);
   if(other===n)return{prompt:`${n}에서 ${unit}의 자리 숫자는?`,answer:String(Math.floor(n/unit)%10),choices:[]};
   return choice(`둘 중 더 큰 수를 고르세요. ${n} / ${other}`,String(Math.max(n,other)),[String(n),String(other)],r);
  }
  if(topic==='time'){
   const hour=int(1,grade===1?12:11,r);
   if(grade===1){const half=r()<(difficulty==='challenge'?.8:.5),next=hour%12+1;return choice(`긴바늘은 ${half?'6':'12'}에 있습니다. 짧은바늘은 ${hour}${half?'~'+next+' 사이':'에'} 있습니다. 몇 시 몇 분인가요?`,`${hour}시 ${half?30:0}분`,[`${hour}시 ${half?30:0}분`,`${hour}시 ${half?0:30}분`,`${next}시 ${half?30:0}분`],r)}
   if(grade===2){const minute=int(1,difficulty==='challenge'?11:5,r)*(difficulty==='challenge'?5:10);return{prompt:`${hour}시간 ${minute}분은 모두 몇 분인가요?`,answer:`${hour*60+minute}분`,choices:[]}}
   const start=int(8,15,r),elapsed=int(1,difficulty==='challenge'?5:2,r)*10;
   return{prompt:`${start}시 ${difficulty==='challenge'?40:10}분부터 ${elapsed}분이 지났습니다. 몇 시 몇 분인가요?`,answer:`${start+Math.floor((elapsed+(difficulty==='challenge'?40:10))/60)}시 ${(elapsed+(difficulty==='challenge'?40:10))%60}분`,choices:[]};
  }
  if(topic==='multiplication'){
   const a=grade===2?int(difficulty==='challenge'?5:2,9,r):grade===3?int(difficulty==='challenge'?40:11,difficulty==='challenge'?99:39,r):int(12,difficulty==='challenge'?199:99,r);
   const b=grade===2?int(2,9,r):grade===3?int(difficulty==='challenge'?6:2,difficulty==='challenge'?9:5,r):int(difficulty==='challenge'?11:2,difficulty==='challenge'?29:9,r);
   return{prompt:`${a} × ${b} =`,answer:String(a*b),choices:[]};
  }
  if(topic==='division'){
   const divisor=grade===3?int(2,9,r):int(grade===4?10:2,grade===4?12:29,r),quotient=int(grade===3?2:5,grade===3?9:grade===4?30:99,r),remainder=difficulty==='challenge'?int(1,divisor-1,r):0;
   return{prompt:`${divisor*quotient+remainder} ÷ ${divisor} =`,answer:`${quotient}${remainder?' … '+remainder:''}`,choices:[]};
  }
  const denominator=int(3,difficulty==='challenge'?12:8,r),a=int(1,denominator-1,r),b=int(1,denominator-1,r);
  if(grade===3){const second=b===a?(b%(denominator-1))+1:b;return choice(`두 분수 중 더 큰 것은?  ${a}/${denominator}  ·  ${second}/${denominator}`,a>second?`${a}/${denominator}`:`${second}/${denominator}`,[`${a}/${denominator}`,`${second}/${denominator}`],r)}
  const other=grade===4||grade===5&&difficulty==='basic'?denominator:int(3,difficulty==='challenge'?12:8,r),num=grade===6?a*b:a*other+b*denominator,den=denominator*other,gcd=(x,y)=>y?gcd(y,x%y):x,g=gcd(num,den);return{prompt:grade===6?`${a}/${denominator} × ${b}/${other} =`:`${a}/${denominator} + ${b}/${other} =`,answer:`${num/g}/${den/g}`,choices:[]};
 }
 if(subject==='social'){
  if(topic==='direction'){const place=pick(['도서관','공원','병원','우체국','시장','체육관','박물관','소방서'],r),dir=pick(['북쪽','남쪽','동쪽','서쪽'],r),position={북쪽:1,남쪽:7,동쪽:5,서쪽:3},map=Array(9).fill('·');map[4]='학교';map[position[dir]]=place;return choice(`지도에서 학교를 기준으로 '${place}'은 어느 방향에 있나요?`,dir,['북쪽','남쪽','동쪽','서쪽'],r,'북 ↑\n'+[0,3,6].map(i=>map.slice(i,i+3).map(v=>v.padEnd(5,' ')).join(' │ ')).join('\n'))}
  if(topic==='community'){const [job,answer]=pick(COMMUNITY,r);return choice(`${job}을 하는 사람은 누구인가요?`,answer,[answer,...shuffle(COMMUNITY.map(v=>v[1]).filter(v=>v!==answer),r).slice(0,3)],r)}
  const [scenario,answer]=pick(ECONOMY,r);return choice(`다음은 생산과 소비 중 무엇에 해당하나요?  ${scenario}`,answer,['생산','소비'],r);
 }
 if(subject==='science'){
  if(topic==='living'){const [thing,answer]=pick(LIVING,r);return choice(`‘${thing}’은(는) 생물인가요, 비생물인가요?`,answer,['생물','비생물'],r)}
  if(topic==='matter'){const [thing,answer]=pick(MATTER,r);return choice(`실온에서 ‘${thing}’의 상태는 무엇인가요?`,answer,['고체','액체','기체'],r)}
  const [task,answer]=pick(WEATHER,r);return choice(`'${task}'에 알맞은 관찰 도구는 무엇인가요?`,answer,['온도계','우량계','풍향계','풍속계'],r);
 }
 if(topic==='words'){const [word,answer]=pick(WORDS,r);return choice(`‘${word}’의 뜻을 고르세요.`,answer,[answer,...shuffle(WORDS.map(v=>v[1]).filter(v=>v!==answer),r).slice(0,3)],r)}
 if(topic==='sentence'){const [meaning,answer,words]=pick(SENTENCES,r);return{prompt:`‘${meaning}’에 맞게 낱말을 배열해 영어 문장을 쓰세요.`,answer,choices:[],detail:words}}
 const [question,answer,options]=pick(CONVERSATIONS,r);return choice(`다음 말에 알맞은 대답을 고르세요.  “${question}”`,answer,options,r);
}
function generate({subject,topic,grade,count=10,seed=Date.now(),difficulty='basic',variant='tens',type=''}){
 const info=SUBJECTS[subject],year=Number(grade),size=Number(count),selected=types(subject,year,topic).find(entry=>entry[0]===type),dense=subject==='math'&&(selected? /^(add-|sub-|small-|two-|times-)/.test(type)&&type!=='times-missing':['addition','hundreds','multiplication'].includes(topic));
 if(!info||!info.grades.includes(year)||!info.topics.some(t=>t[0]===topic&&available(t,year))||![5,10,15,...(dense?[24]:[])].includes(size)||!['basic','challenge'].includes(difficulty)||!['tens','ones'].includes(variant)||type&&!selected||['mixed','decimal'].includes(topic)&&!selected)throw Error('학년·교과·유형을 다시 선택해 주세요.');
 const random=rng(seed),items=[],seen=new Set(),seenPassages=new Set();let attempts=0;
 while(items.length<size&&attempts++<3000){const candidate=subject==='social'&&SOCIAL_EVIDENCE[topic]?socialEvidence(topic,random):selected?typedMath(type,random):item(subject,topic,year,random,difficulty,variant),key=candidate.prompt+'|'+candidate.answer+'|'+(candidate.detail||'');if(seen.has(key)||topic==='reading'&&seenPassages.has(candidate.detail))continue;seen.add(key);if(topic==='reading')seenPassages.add(candidate.detail);items.push(candidate)}
 if(items.length<size)throw Error('이 유형에서는 서로 다른 문제를 충분히 만들지 못했어요. 문항 수를 줄여 주세요.');
 return{subject,topic,type,grade:year,count:size,difficulty,variant:topic==='hundreds'?variant:'tens',seed:Number(seed)>>>0,title:year+'학년 '+info.name+' · '+(selected?selected[1]:info.topics.find(t=>t[0]===topic)[1]),alignment:['mixed','decimal'].includes(topic)?null:alignment(subject,topic,year),items};
}
return{SUBJECTS,generate,alignment,units,types};
});
