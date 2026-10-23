(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DailyWorksheetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SUBJECTS={
 korean:{name:'국어',grades:[1,2,3,4,5,6],topics:[['opposite','반대말 찾기',1],['spacing','바른 띄어쓰기',2],['reading','글 읽고 답하기',1],['mainidea','짧은 글의 중심 내용',1,2]]},
 math:{name:'수학',grades:[1,2,3,4,5,6],topics:[['addition','덧셈과 뺄셈',1],['number','수의 자리와 크기',1,3],['time','시각과 시간',1,3],['hundreds','세 자리 수 덧셈 · 받아올림 없음',3,3],['multiplication','곱셈',2],['division','나눗셈',3],['fraction','분수',3],['mixed','자연수의 혼합 계산',5,5]]},
 social:{name:'사회',grades:[3,4,5,6],topics:[['direction','방향과 위치',3],['community','우리 사회의 일',3],['economy','생산과 소비',4]]},
 science:{name:'과학',grades:[3,4,5,6],topics:[['living','생물과 비생물',3],['matter','물질의 상태',3],['weather','날씨 관찰 도구',5]]},
 english:{name:'영어',grades:[3,4,5,6],topics:[['words','기본 낱말',3],['sentence','문장 만들기',3],['conversation','상황에 맞는 대답',3]]}
};
// Semester labels are a browsing aid based on common unit names; textbook order varies.
const MATH_UNITS={
 3:[{id:'g3-add',label:'1학기 · 덧셈과 뺄셈',topics:['hundreds','addition'],types:[
  ['add-tens-none','몇백 + 몇백 (받아올림 없음)'],['add-ones-none','세 자리 + 세 자리 (받아올림 없음)'],
  ['add-carry-one','세 자리 + 세 자리 (받아올림 1번)'],['add-carry-two','세 자리 + 세 자리 (받아올림 2번)'],
  ['sub-borrow-none','세 자리 − 세 자리 (받아내림 없음)'],['sub-borrow-one','세 자리 − 세 자리 (받아내림 1번)'],['sub-borrow-two','세 자리 − 세 자리 (받아내림 2번)']]}],
 5:[{id:'g5-mixed',label:'1학기 · 자연수의 혼합 계산',topics:['mixed'],types:[
  ['mix-add-sub','덧셈과 뺄셈의 혼합 계산'],['mix-mul-div','곱셈과 나눗셈의 혼합 계산'],
  ['mix-four','사칙연산의 혼합 계산'],['mix-parentheses','괄호가 있는 혼합 계산']]}]
};
function units(subject,grade){return subject==='math'?(MATH_UNITS[grade]||[]):[]}
function types(subject,grade,topic){return units(subject,grade).flatMap(unit=>unit.topics.includes(topic)?unit.types.filter(([id])=>grade!==3||id.startsWith(topic==='hundreds'?'add-':'sub-')):[])}
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
 social:{economy:{4:['[4사07-02]','생산·소비 활동과 지역 간 교류 탐색']}},
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
 const scope=math?'이 문제지는 성취기준 중 계산 연습만 다룹니다.':subject==='korean'?'이 문제지는 짧은 글의 중심 내용 고르기만 다룹니다.':subject==='science'&&topic==='matter'?'이 문제지는 물질의 상태 분류만 다룹니다.':subject==='science'?'이 문제지는 기상 관찰 도구 고르기만 다룹니다.':subject==='social'?'이 문제지는 생산과 소비의 구별만 다룹니다.':'이 문제지는 글로 제시된 낱말의 뜻 고르기만 다룹니다.';
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
function available(topic,grade){return grade>=topic[2]&&grade<=(topic[3]??6)}
function carrying(a,b){for(let unit=1;unit<=Math.max(a,b);unit*=10)if(Math.floor(a/unit)%10+Math.floor(b/unit)%10>=10)return true;return false}
function carryCount(a,b,subtract=false){let carry=0,count=0;for(let unit=1;unit<=100;unit*=10){const x=Math.floor(a/unit)%10,y=Math.floor(b/unit)%10;if(subtract){const next=x-carry<y?1:0;count+=next;carry=next}else{const next=x+y+carry>=10?1:0;count+=next;carry=next}}return count}
function typedArithmetic(type,r){
 const add=type.startsWith('add-'),target=type.endsWith('-two')?2:type.endsWith('-one')?1:0,tens=type==='add-tens-none';
 for(let attempt=0;attempt<10000;attempt++){
  const a=tens?int(1,8,r)*100:int(100,899,r),b=tens?int(1,9-Math.floor(a/100),r)*100:int(100,899,r);
  if(add&&a+b>=1000||!add&&a<=b||carryCount(a,b,!add)!==target)continue;
  return{prompt:`${a} ${add?'+':'−'} ${b} =`,answer:String(add?a+b:a-b),choices:[]};
 }
 throw Error('선택한 유형의 문제를 만들지 못했어요.');
}
function mixedArithmetic(type,r){
 const a=int(12,89,r),b=int(11,49,r),c=int(2,9,r),d=int(2,9,r);
 if(type==='mix-add-sub'){const start=a+b+c,ops=r()<.5?[`${start} − ${b} + ${c}`,start-b+c]:[`${a} + ${b} − ${c}`,a+b-c];return{prompt:ops[0]+' =',answer:String(ops[1]),choices:[]}}
 if(type==='mix-mul-div'){const x=c*d;return{prompt:`${x} × ${b} ÷ ${c} =`,answer:String(d*b),choices:[]}}
 if(type==='mix-four')return{prompt:`${a} + ${b} × ${c} − ${d} =`,answer:String(a+b*c-d),choices:[]};
 return{prompt:`(${a} + ${b}) × ${c} − ${d} =`,answer:String((a+b)*c-d),choices:[]};
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
 const info=SUBJECTS[subject],year=Number(grade),size=Number(count),validTypes=types(subject,year,topic),selected=validTypes.find(entry=>entry[0]===type),dense=subject==='math'&&(['addition','hundreds','multiplication'].includes(topic)||Boolean(selected&&topic!=='mixed'));
 if(!info||!info.grades.includes(year)||!info.topics.some(t=>t[0]===topic&&available(t,year))||![5,10,15,...(dense?[24]:[])].includes(size)||!['basic','challenge'].includes(difficulty)||!['tens','ones'].includes(variant)||type&&!selected||topic==='mixed'&&!selected)throw Error('학년·교과·유형을 다시 선택해 주세요.');
 const random=rng(seed),items=[],seen=new Set(),seenPassages=new Set();let attempts=0;
 while(items.length<size&&attempts++<3000){const candidate=selected?(topic==='mixed'?mixedArithmetic(type,random):typedArithmetic(type,random)):item(subject,topic,year,random,difficulty,variant),key=candidate.prompt+'|'+candidate.answer+'|'+(candidate.detail||'');if(seen.has(key)||topic==='reading'&&seenPassages.has(candidate.detail))continue;seen.add(key);if(topic==='reading')seenPassages.add(candidate.detail);items.push(candidate)}
 if(items.length<size)throw Error('이 유형에서는 서로 다른 문제를 충분히 만들지 못했어요. 문항 수를 줄여 주세요.');
 return{subject,topic,type,grade:year,count:size,difficulty,variant:topic==='hundreds'?variant:'tens',seed:Number(seed)>>>0,title:year+'학년 '+info.name+' · '+(selected?selected[1]:info.topics.find(t=>t[0]===topic)[1]),alignment:topic==='mixed'?null:alignment(subject,topic,year),items};
}
return{SUBJECTS,generate,alignment,units,types};
});
