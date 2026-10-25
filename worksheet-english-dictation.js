(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetEnglishDictation=api;})(globalThis,()=>{
'use strict';
const labels=[['school','학교·친구'],['home','하루·가족'],['food','음식·가게'],['outside','날씨·바깥활동']];
const focus={3:'익숙한 낱말과 짧은 문장 · I am, This is, I like',4:'질문과 대답 · can, have, 위치와 수 표현',5:'일상과 시간 · 현재형, 빈도 표현, 이유와 부탁',6:'경험과 계획 · 과거형, 미래 표현, 비교와 문장 연결'};
const sets=[];
function add(grade,topic,rows){if(rows.length!==10)throw Error('Ten English sentences required');sets.push({grade,topic,rows});}
add(3,'school',[
 ['Hello, I am Mina.','안녕, 나는 미나야.'],['This is my pencil.','이것은 내 연필이야.'],['Open your book.','책을 펴세요.'],['Close the door.','문을 닫으세요.'],['Please sit down.','앉아 주세요.'],
 ['I have a bag.','나는 가방이 있어.'],['It is a red pen.','그것은 빨간 펜이야.'],['You are my friend.','너는 내 친구야.'],['Look at the board.','칠판을 보세요.'],['See you tomorrow.','내일 만나.']
]);
add(3,'home',[
 ['This is my mom.','이분은 우리 엄마야.'],['He is my brother.','그는 내 남자 형제야.'],['She is my sister.','그녀는 내 여자 형제야.'],['I am happy.','나는 행복해.'],['I am tired.','나는 피곤해.'],
 ['Good night, Dad.','아빠, 안녕히 주무세요.'],['Wash your hands.','손을 씻으세요.'],['It is my bed.','그것은 내 침대야.'],['I love my family.','나는 우리 가족을 사랑해.'],['Come here, please.','여기로 와 주세요.']
]);
add(3,'food',[
 ['I like apples.','나는 사과를 좋아해.'],['I want some milk.','나는 우유를 좀 마시고 싶어.'],['I am hungry.','나는 배가 고파.'],['Here is your cake.','네 케이크 여기 있어.'],['Thank you very much.','정말 고마워.'],
 ['It is a banana.','그것은 바나나야.'],['I like rice.','나는 밥을 좋아해.'],['This soup is hot.','이 수프는 뜨거워.'],['Let us eat.','우리 먹자.'],['I want some water.','나는 물을 좀 마시고 싶어.']
]);
add(3,'outside',[
 ['It is sunny.','날씨가 화창해.'],['It is cold today.','오늘은 추워.'],['Look at the sky.','하늘을 봐.'],['I see a bird.','새 한 마리가 보여.'],['It is a big tree.','그것은 큰 나무야.'],
 ['The dog is small.','그 개는 작아.'],['I can run.','나는 달릴 수 있어.'],['Let us play.','우리 놀자.'],['The ball is blue.','그 공은 파란색이야.'],['I like summer.','나는 여름을 좋아해.']
]);
add(4,'school',[
 ['What is your name?','너의 이름은 뭐니?'],['Can you draw a cat?','고양이를 그릴 수 있니?'],['I can sing very well.','나는 노래를 아주 잘할 수 있어.'],['My ruler is on the desk.','내 자는 책상 위에 있어.'],['Do you have a notebook?','공책을 가지고 있니?'],
 ['I have two yellow pencils.','나는 노란 연필 두 자루를 가지고 있어.'],['Please listen to your friend.','친구의 말을 들어 주세요.'],['The books are in my bag.','책들은 내 가방 안에 있어.'],['Let us read this story.','우리 이 이야기를 읽자.'],['May I use your eraser?','네 지우개를 써도 되니?']
]);
add(4,'home',[
 ['What time is it now?','지금 몇 시니?'],['It is time for bed.','잠자리에 들 시간이야.'],['My father is in the kitchen.','우리 아빠는 부엌에 계셔.'],['I get up at seven.','나는 일곱 시에 일어나.'],['I brush my teeth every morning.','나는 매일 아침 이를 닦아.'],
 ['The cat is under the chair.','그 고양이는 의자 아래에 있어.'],['Please put away your toys.','장난감을 정리해 주세요.'],['We watch a movie together.','우리는 함께 영화를 봐.'],['My sister likes this song.','내 여자 형제는 이 노래를 좋아해.'],['There are four cups on the table.','탁자 위에 컵이 네 개 있어.']
]);
add(4,'food',[
 ['Do you like orange juice?','오렌지주스를 좋아하니?'],['I would like some bread.','빵을 좀 먹고 싶어요.'],['How many cookies do you want?','쿠키 몇 개를 원하니?'],['This sandwich is for you.','이 샌드위치는 네 거야.'],['I do not like spicy food.','나는 매운 음식을 좋아하지 않아.'],
 ['Please give me a spoon.','숟가락을 하나 주세요.'],['The apples are in the basket.','사과들은 바구니 안에 있어.'],['These grapes are very sweet.','이 포도는 아주 달아.'],['I eat lunch at school.','나는 학교에서 점심을 먹어.'],['Would you like some more rice?','밥을 좀 더 먹겠니?']
]);
add(4,'outside',[
 ['How is the weather today?','오늘 날씨는 어떠니?'],['It is raining outside now.','지금 밖에 비가 오고 있어.'],['Please take your umbrella with you.','우산을 챙겨 가세요.'],['I can ride a bike.','나는 자전거를 탈 수 있어.'],['We play soccer after school.','우리는 방과 후에 축구를 해.'],
 ['The park is next to the library.','공원은 도서관 옆에 있어.'],['There is a duck in the pond.','연못에 오리 한 마리가 있어.'],['Let us make a snowman.','우리 눈사람을 만들자.'],['The flowers are pink and white.','꽃들은 분홍색과 흰색이야.'],['I want to go to the beach.','나는 바닷가에 가고 싶어.']
]);
add(5,'school',[
 ['My favorite subject is science.','내가 가장 좋아하는 과목은 과학이야.'],['We have music class on Tuesday.','우리는 화요일에 음악 수업이 있어.'],['Could you say that again, please?','다시 한번 말씀해 주시겠어요?'],['I go to the library twice a week.','나는 일주일에 두 번 도서관에 가.'],['We are making a poster for our class.','우리는 우리 반을 위한 포스터를 만들고 있어.'],
 ['Please write your name at the top.','맨 위에 이름을 써 주세요.'],['I usually finish my homework before dinner.','나는 보통 저녁 식사 전에 숙제를 마쳐.'],['She enjoys reading books about animals.','그녀는 동물에 관한 책 읽기를 즐겨.'],['Which book would you like to read?','어떤 책을 읽고 싶니?'],['I want to be a teacher someday.','나는 언젠가 선생님이 되고 싶어.']
]);
add(5,'home',[
 ['I help my parents on the weekend.','나는 주말에 부모님을 도와드려.'],['My brother is washing the dishes now.','내 남자 형제는 지금 설거지를 하고 있어.'],['I always feed my dog before breakfast.','나는 항상 아침 식사 전에 개에게 먹이를 줘.'],['What do you usually do after dinner?','너는 저녁 식사 후에 보통 무엇을 하니?'],['We sometimes take a walk in the evening.','우리는 가끔 저녁에 산책을 해.'],
 ['I need to clean my room today.','나는 오늘 내 방을 청소해야 해.'],['My grandmother tells us interesting stories.','우리 할머니는 우리에게 재미있는 이야기를 들려주셔.'],['There is a family photo above the sofa.','소파 위쪽에 가족사진이 있어.'],['I am looking for my other sock.','나는 양말의 다른 한 짝을 찾고 있어.'],['Please turn off the light before you leave.','나가기 전에 불을 꺼 주세요.']
]);
add(5,'food',[
 ['How much is this chicken sandwich?','이 치킨 샌드위치는 얼마인가요?'],['I would like a small cup of juice.','작은 컵으로 주스 한 잔을 주세요.'],['May I have a glass of water?','물 한 잔 주시겠어요?'],['I like this soup because it is warm.','나는 이 수프가 따뜻해서 좋아.'],['We need three eggs to make the cake.','케이크를 만들려면 달걀 세 개가 필요해.'],
 ['Please wash the vegetables before you cook.','요리하기 전에 채소를 씻어 주세요.'],['My favorite snack is yogurt with fruit.','내가 가장 좋아하는 간식은 과일을 넣은 요구르트야.'],['I usually bring my own water bottle.','나는 보통 내 물병을 가지고 다녀.'],['Would you like your sandwich with cheese?','샌드위치에 치즈를 넣어 드릴까요?'],['Let us buy only what we need.','우리 필요한 것만 사자.']
]);
add(5,'outside',[
 ['What are you going to do this Saturday?','이번 토요일에 무엇을 할 거니?'],['I am going to visit the museum.','나는 박물관을 방문할 거야.'],['The bus stop is across from the bank.','버스 정류장은 은행 맞은편에 있어.'],['Go straight and turn left at the corner.','곧장 가다가 모퉁이에서 왼쪽으로 도세요.'],['It is too windy to fly a kite today.','오늘은 바람이 너무 세서 연을 날리기 어려워.'],
 ['We can see many stars on a clear night.','맑은 밤에는 별을 많이 볼 수 있어.'],['My friends enjoy playing basketball at the park.','내 친구들은 공원에서 농구하는 것을 즐겨.'],['Please wait until the bus stops.','버스가 멈출 때까지 기다려 주세요.'],['I wear a helmet when I ride my bike.','나는 자전거를 탈 때 안전모를 써.'],['The weather is getting warmer every day.','날씨가 날마다 더 따뜻해지고 있어.']
]);
add(6,'school',[
 ['I borrowed this book from the library yesterday.','나는 어제 도서관에서 이 책을 빌렸어.'],['Our class is going to visit a science museum next week.','우리 반은 다음 주에 과학관을 방문할 거야.'],['I was nervous, but my friends listened carefully.','나는 긴장했지만 친구들이 주의 깊게 들어 주었어.'],['What did you learn from the story we read?','우리가 읽은 이야기에서 무엇을 배웠니?'],['This problem is easier than the last one.','이 문제는 지난번 문제보다 더 쉬워.'],
 ['Could you explain how you found the answer?','어떻게 답을 찾았는지 설명해 주겠니?'],['I practiced every day because I wanted to improve.','나는 더 잘하고 싶어서 매일 연습했어.'],['We will work together to finish the project.','우리는 과제를 마치기 위해 함께 일할 거야.'],['You should check your work before you hand it in.','제출하기 전에 네가 한 것을 확인하는 게 좋아.'],['My friend helped me when I did not understand.','내가 이해하지 못했을 때 친구가 도와주었어.']
]);
add(6,'home',[
 ['I made breakfast for my family last Sunday.','나는 지난 일요일에 가족을 위해 아침을 만들었어.'],['My sister was sleeping when I came home.','내가 집에 왔을 때 내 여자 형제는 자고 있었어.'],['We are going to move to a new house soon.','우리는 곧 새집으로 이사할 거야.'],['I will call you after I finish my homework.','숙제를 마치고 너에게 전화할게.'],['What did you do during the summer vacation?','여름방학 동안 무엇을 했니?'],
 ['I stayed with my grandparents for three days.','나는 조부모님과 사흘 동안 지냈어.'],['This photo reminds me of our trip to the beach.','이 사진을 보면 바닷가 여행이 떠올라.'],['My brother is taller than he was last year.','내 남자 형제는 작년보다 키가 커졌어.'],['I could not find my keys, so I asked for help.','나는 열쇠를 찾을 수 없어서 도움을 요청했어.'],['Let us make a plan before the holiday begins.','휴일이 시작되기 전에 우리 계획을 세우자.']
]);
add(6,'food',[
 ['We bought fresh vegetables at the market this morning.','우리는 오늘 아침 시장에서 신선한 채소를 샀어.'],['I would like a sandwich without any onions, please.','양파를 빼고 샌드위치를 만들어 주세요.'],['This bowl is larger than the one I used yesterday.','이 그릇은 내가 어제 썼던 그릇보다 더 커.'],['I tried the new dish, and it tasted delicious.','나는 새 요리를 먹어 보았는데 맛있었어.'],['How many people are coming to dinner tonight?','오늘 저녁 식사에 몇 명이 올 예정이니?'],
 ['We should check the date before we buy the milk.','우유를 사기 전에 날짜를 확인하는 게 좋아.'],['I saved some money to buy a present for my friend.','나는 친구의 선물을 사려고 돈을 조금 모았어.'],['The store was closed, so we went to another one.','가게가 닫혀 있어서 우리는 다른 가게에 갔어.'],['Please tell me if there is anything you cannot eat.','먹을 수 없는 것이 있으면 말해 주세요.'],['I will bring enough fruit for everyone to share.','모두가 나누어 먹을 만큼 충분한 과일을 가져올게.']
]);
add(6,'outside',[
 ['We canceled the picnic because it rained all morning.','오전 내내 비가 와서 우리는 소풍을 취소했어.'],['The park was quieter than I expected it to be.','공원은 내가 예상했던 것보다 더 조용했어.'],['If it is sunny tomorrow, we will play outside.','내일 날씨가 화창하면 우리는 밖에서 놀 거야.'],['I took a different road to avoid the traffic.','나는 교통 체증을 피하려고 다른 길로 갔어.'],['Do you know how to get to the train station?','기차역에 어떻게 가는지 알고 있니?'],
 ['We picked up the trash before we left the beach.','우리는 바닷가를 떠나기 전에 쓰레기를 주웠어.'],['I saw a rainbow while I was walking home.','나는 집으로 걸어가는 동안 무지개를 보았어.'],['You should put on sunscreen before going outside.','밖에 나가기 전에 자외선 차단제를 바르는 게 좋아.'],['My friends and I are planning a camping trip.','친구들과 나는 캠핑 여행을 계획하고 있어.'],['We will meet at the entrance at nine tomorrow.','우리는 내일 아홉 시에 입구에서 만날 거야.']
]);
function bank(grade,topic='all'){
 const g=Number(grade);if(![3,4,5,6].includes(g))throw Error('영어 받아쓰기는 3~6학년 중에서 골라 주세요.');
 if(topic!=='all'&&!labels.some(([id])=>id===topic))throw Error('영어 받아쓰기 주제를 다시 골라 주세요.');
 return sets.filter(s=>s.grade===g&&(topic==='all'||s.topic===topic)).flatMap(s=>s.rows.map(([text,translation],i)=>({id:`en-g${g}-${s.topic}-${i+1}`,text,translation,topic:s.topic,focus:focus[g]})));
}
function topics(grade){bank(grade);return [{id:'all',label:'모든 주제',count:40},...labels.map(([id,label])=>({id,label,count:10}))];}
function generate({grade,topic='all',seed=1,excludeIds=[],itemIds}={}){
 const all=bank(grade,topic);let items;
 if(itemIds!==undefined){if(!Array.isArray(itemIds)||itemIds.length!==10||new Set(itemIds).size!==10||itemIds.some(id=>!all.some(q=>q.id===id)))throw Error('저장된 영어 받아쓰기 문장을 확인해 주세요.');items=itemIds.map(id=>all.find(q=>q.id===id));}
 else{let n=(Number(seed)>>>0)||1;const pool=[...all];for(let i=pool.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}const old=new Set(excludeIds);pool.sort((a,b)=>Number(old.has(a.id))-Number(old.has(b.id)));items=pool.slice(0,10);}
 return {grade:Number(grade),subject:'english',topic,topicLabel:topic==='all'?'모든 주제':labels.find(([id])=>id===topic)[1],seed:Number(seed)>>>0,focus:focus[Number(grade)],items};
}
return {bank,topics,generate,focus:grade=>{bank(grade);return focus[Number(grade)];}};
});
