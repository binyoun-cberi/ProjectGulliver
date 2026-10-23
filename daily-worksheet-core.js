(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DailyWorksheetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SUBJECTS={
 korean:{name:'국어',grades:[1,2,3,4,5,6],topics:[['opposite','반대말 찾기',1],['spacing','바른 띄어쓰기',2],['reading','짧은 글 읽기',3]]},
 math:{name:'수학',grades:[1,2,3,4,5,6],topics:[['addition','덧셈과 뺄셈',1],['multiplication','곱셈',2],['fraction','분수',3]]},
 social:{name:'사회',grades:[3,4,5,6],topics:[['direction','방향과 위치',3],['community','우리 사회의 일',3],['economy','생산과 소비',4]]},
 science:{name:'과학',grades:[3,4,5,6],topics:[['living','생물과 비생물',3],['matter','물질의 상태',3],['weather','날씨 관찰',3]]},
 english:{name:'영어',grades:[3,4,5,6],topics:[['words','기본 낱말',3],['sentence','문장 만들기',3],['conversation','상황에 맞는 대답',3]]}
};
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
function bankQuestion(bank,r,make){return make(pick(bank,r))}
function item(subject,topic,grade,r){
 if(subject==='korean'){
  if(topic==='opposite'){const [word,answer]=pick(OPPOSITES,r);const pool=OPPOSITES.flat().filter(v=>v!==word&&v!==answer);return choice('‘'+word+'’의 반대말은 무엇인가요?',answer,[answer,...shuffle(pool,r).slice(0,3)],r)}
  if(topic==='spacing'){const [correct,wrong]=pick(SPACING,r);return choice('바르게 띄어 쓴 문장을 고르세요.',correct,[correct,wrong],r)}
  const [passage,question,answer,options]=pick(READING,r);return choice(question,answer,options,r,passage);
 }
 if(subject==='math'){
  if(topic==='addition'){const cap=grade===1?20:grade===2?100:grade===3?1000:grade===4?10000:100000;const a=int(1,Math.floor(cap*.65),r),b=int(1,Math.floor(cap*.32),r),minus=r()<.5;return minus?{prompt:`${a+b} − ${b} =`,answer:String(a),choices:[]}:{prompt:`${a} + ${b} =`,answer:String(a+b),choices:[]}}
  if(topic==='multiplication'){const a=grade===2?int(2,9,r):grade===3?int(11,99,r):int(12,199,r),b=grade===2?int(2,9,r):grade===3?int(2,9,r):int(11,29,r);return{prompt:`${a} × ${b} =`,answer:String(a*b),choices:[]}}
  const denominator=int(3,12,r),a=int(1,denominator-1,r),b=int(1,denominator-1,r);
  if(grade===3){const second=b===a?(b%(denominator-1))+1:b;return choice(`두 분수 중 더 큰 것은?  ${a}/${denominator}  ·  ${second}/${denominator}`,a>second?`${a}/${denominator}`:`${second}/${denominator}`,[`${a}/${denominator}`,`${second}/${denominator}`],r)}
  const other=grade===4?denominator:int(3,10,r),num=grade===6?a*b:a*other+b*denominator,den=grade===6?denominator*other:denominator*other,gcd=(x,y)=>y?gcd(y,x%y):x,g=gcd(num,den);return{prompt:grade===6?`${a}/${denominator} × ${b}/${other} =`:`${a}/${denominator} + ${b}/${other} =`,answer:`${num/g}/${den/g}`,choices:[]};
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
function generate({subject,topic,grade,count=10,seed=Date.now()}){
 const info=SUBJECTS[subject],year=Number(grade),size=Number(count);if(!info||!info.grades.includes(year)||!info.topics.some(t=>t[0]===topic&&year>=t[2])||![5,10,15].includes(size))throw Error('학년·교과·유형을 다시 선택해 주세요.');
 const random=rng(seed),items=[],seen=new Set();let attempts=0;
 while(items.length<size&&attempts++<1000){const candidate=item(subject,topic,year,random),key=candidate.prompt+'|'+candidate.answer+'|'+(candidate.detail||'');if(seen.has(key))continue;seen.add(key);items.push(candidate)}
 if(items.length<size)throw Error('이 유형에서는 서로 다른 문제를 충분히 만들지 못했어요. 문항 수를 줄여 주세요.');
 return{subject,topic,grade:year,count:size,seed:Number(seed)>>>0,title:info.name+' · '+info.topics.find(t=>t[0]===topic)[1],items};
}
return{SUBJECTS,generate};
});
