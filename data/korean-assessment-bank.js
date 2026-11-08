(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KoreanAssessmentBank=api;
})(globalThis,()=>{
 'use strict';
 // Original Korean retellings/explanations. No copyrighted modern translations are reproduced.
 // A source reference verifies the cited original, not the final questions' classroom suitability.
 const entries=[];
 function add(band,id,genre,title,passage,source,questions){
   if(questions.length!==5)throw Error('Five questions required: '+id);
   entries.push({id:'kr-eval-'+id,band,genre,title,passage,
     listen:true,read:true,sourceTitle:source.title,sourceUrl:source.url||'',
     sourceRelation:source.relation||'창작',difficulty:source.difficulty||'보통',
     reviewStatus:'수업 전 교사 검수 필요',
     questions:questions.map(([prompt,answer,w1,w2,explanation,skill])=>({prompt,answer,choices:[answer,w1,w2],explanation,skill}))});
 }
 const original={title:'클라시트 창작 지문',relation:'창작'};
 add('early','sun-and-wind','literary','해와 바람',
 '해와 바람은 누가 더 힘이 센지 겨루었어요. 길을 걷던 사람이 두꺼운 외투를 입고 있었지요. 먼저 바람이 세게 불었어요. 사람은 외투가 날아갈까 봐 더 꼭 여몄어요. 이번에는 해가 따뜻하게 빛났어요. 몸이 따뜻해진 사람은 스스로 외투를 벗었어요.',
 {title:'이솝 우화 「북풍과 태양」',url:'https://www.read.gov/aesop/143.html',relation:'원전 줄거리를 초등용으로 재구성',difficulty:'기초'},[
 ['누가 먼저 외투를 벗기려고 했나요?','바람','해','구름','바람이 먼저 세게 불었다고 했습니다.','fact'],
 ['바람이 세게 불자 사람은 어떻게 했나요?','외투를 더 꼭 여몄다','외투를 벗었다','뛰어서 집에 갔다','추워진 사람은 외투를 단단히 여몄습니다.','cause'],
 ['사람이 외투를 벗은 때는 언제인가요?','해가 따뜻하게 비춘 뒤','바람이 처음 분 때','해가 구름 뒤로 숨은 때','해가 따뜻하게 비추자 스스로 외투를 벗었습니다.','sequence'],
 ['외투를 벗긴 것은 무엇인가요?','따뜻한 햇빛','센 바람','빗방울','마지막에 햇빛 때문에 더워져 외투를 벗었습니다.','fact'],
 ['이야기를 통해 생각할 수 있는 것은 무엇인가요?','부드러운 방법이 효과적일 때도 있다','큰 소리를 내면 언제나 이긴다','외투는 늘 벗고 다녀야 한다','강한 바람보다 따뜻한 햇빛이 목적을 이루었습니다.','inference']
 ]);
 add('early','lost-mitten','literary','장갑 한 짝',
 '학교 앞에서 지우는 빨간 장갑 한 짝을 주웠어요. 지우는 선생님께 장갑을 드렸어요. 선생님은 장갑을 발견한 곳을 적어 두었어요. 점심시간에 하린이가 장갑을 찾으러 왔어요. 하린이는 다른 한 짝을 보여 주었어요. 무늬가 똑같아서 하린이의 장갑인 줄 알 수 있었어요.',original,[
 ['지우가 주운 것은 무엇인가요?','빨간 장갑 한 짝','파란 모자','노란 우산','지우는 빨간 장갑 한 짝을 주웠습니다.','fact'],
 ['지우는 장갑을 누구에게 드렸나요?','선생님','하린이의 동생','경비 아저씨','지우는 선생님께 장갑을 드렸습니다.','fact'],
 ['선생님은 무엇을 적어 두었나요?','장갑을 발견한 곳','오늘의 급식 메뉴','교실의 온도','발견 장소를 적어 두었다고 했습니다.','fact'],
 ['장갑의 주인인지 어떻게 알았나요?','다른 한 짝의 무늬가 같아서','장갑이 아주 커서','선생님이 색을 바꿔서','하린이가 보여 준 다른 장갑의 무늬가 같았습니다.','evidence'],
 ['이 글에 어울리는 제목은 무엇인가요?','주인을 찾은 장갑','새 우산을 사는 날','잃어버린 책의 비밀','잃어버린 장갑이 주인에게 돌아가는 이야기입니다.','main']
 ]);
 add('early','library-guide','nonfiction','도서관 이용 안내',
 '우리 학교 도서관은 월요일부터 금요일까지 문을 열어요. 책은 한 번에 두 권까지 빌릴 수 있어요. 빌린 책은 일주일 안에 돌려주세요. 책을 읽을 때는 작은 목소리로 말하고, 책을 다 읽으면 정해진 자리에 놓아요. 찢어진 책을 발견하면 선생님께 알려주세요.',{...original,difficulty:'기초'},[
 ['도서관은 어느 요일에 문을 여나요?','월요일부터 금요일까지','토요일만','일요일만','도서관은 월요일부터 금요일까지 엽니다.','fact'],
 ['한 번에 몇 권까지 빌릴 수 있나요?','두 권','한 권','다섯 권','한 번에 두 권까지 빌릴 수 있다고 안내합니다.','fact'],
 ['빌린 책은 언제까지 돌려줘야 하나요?','일주일 안에','한 달 뒤에','방학이 끝나면','반납 기한은 일주일입니다.','fact'],
 ['찢어진 책을 발견하면 어떻게 하나요?','선생님께 알린다','책을 숨긴다','아무 말 없이 가져간다','안내문은 선생님께 알리라고 말합니다.','action'],
 ['이 글을 쓴 까닭은 무엇인가요?','도서관 이용 방법을 안내하려고','새 동화를 들려주려고','운동회 순서를 알려주려고','대출과 반납, 이용 예절을 안내하는 글입니다.','main']
 ]);
 add('early','seed-note','nonfiction','씨앗 관찰 일지',
 '월요일에 우리 반은 화분에 강낭콩을 심었어요. 흙이 마르면 물을 조금 주었어요. 목요일에는 흙 위로 작은 싹이 보였어요. 다음 주 월요일에는 잎이 두 장 나왔어요. 친구들은 날짜마다 본 모습을 그림으로 남겼어요. 우리는 씨앗이 자라는 모습을 차례대로 살펴보았어요.',original,[
 ['우리 반이 심은 것은 무엇인가요?','강낭콩','감자','사과나무','첫 문장에 강낭콩을 심었다고 나옵니다.','fact'],
 ['흙이 마르면 어떻게 했나요?','물을 조금 주었다','흙을 모두 버렸다','화분을 숨겼다','흙이 마를 때 조금씩 물을 주었습니다.','action'],
 ['싹을 처음 본 날은 언제인가요?','목요일','월요일','토요일','목요일에 작은 싹이 보였다고 했습니다.','sequence'],
 ['잎이 두 장 나온 것은 언제인가요?','다음 주 월요일','심은 날 아침','목요일보다 전날','다음 주 월요일에는 잎이 두 장 나왔습니다.','sequence'],
 ['친구들이 그림을 남긴 까닭은 무엇일까요?','자라는 변화를 비교하려고','화분을 감추려고','물을 주지 않으려고','날짜마다 모습을 기록하면 변화를 살필 수 있습니다.','inference']
 ]);
 add('middle','hillel','literary','한 발로 서서 배우는 지혜',
 '옛 유대교 전승에는 어떤 사람이 현자 힐렐에게 와서 “제가 한 발로 서 있는 동안 중요한 가르침을 알려 주세요.”라고 부탁한 이야기가 전해집니다. 힐렐은 자신이 싫어하는 일을 다른 사람에게 하지 말라는 뜻의 말을 들려주었습니다. 그리고 이 말만 듣고 끝내지 말고 더 배우라고 권했습니다. 이 이야기는 짧은 말이라도 생활 속에서 깊이 생각하고 실천해야 한다는 점을 떠올리게 합니다.',
 {title:'바빌로니아 탈무드 「샤바트」 31a',url:'https://www.sefaria.org/Shabbat.31a?lang=en&no_applink=1',relation:'전승의 핵심 내용을 초등용으로 요약'},[
 ['사람은 누구에게 질문했나요?','힐렐','어부','여관 주인','질문을 받은 현자는 힐렐입니다.','fact'],
 ['사람은 어떤 조건으로 가르침을 부탁했나요?','한 발로 서 있는 동안','밤새 걸어가는 동안','배를 타는 동안','한 발로 서 있는 짧은 동안 알려 달라고 했습니다.','fact'],
 ['힐렐이 전한 핵심 뜻은 무엇인가요?','내가 싫은 일을 남에게 하지 말자','항상 내 말만 따르자','다른 사람의 말을 듣지 말자','자신에게 싫은 일을 다른 사람에게 하지 말라고 했습니다.','main'],
 ['힐렐이 더 배우라고 한 까닭은 무엇일까요?','짧은 말의 뜻을 깊이 이해해야 해서','질문을 기억하지 못해서','걸음을 더 빨리 옮기게 하려고','핵심 말을 들은 뒤에도 배움을 이어 가라고 권했습니다.','inference'],
 ['이 이야기와 어울리는 생활 모습은 무엇인가요?','친구가 싫어하는 놀림을 멈춘다','친구의 물건을 허락 없이 가져간다','친구의 부탁은 늘 무시한다','다른 사람이 싫어할 행동을 삼가는 사례입니다.','application']
 ]);
 add('middle','samaritan','literary','길에서 만난 이웃',
 '오래된 성경 이야기에는 길에서 강도를 만나 다친 사람이 나옵니다. 몇몇 지나가던 사람은 그를 보고도 길을 계속 갔습니다. 그때 사마리아에서 온 여행자가 다친 사람을 발견했습니다. 여행자는 상처를 살피고 자신이 타던 짐승에 태워 여관까지 데려갔습니다. 다음 날에는 여관 주인에게 돌봄을 부탁하며 비용도 맡겼습니다. 이 이야기는 서로 모르는 사람이라도 어려움에 처하면 도울 수 있다는 장면을 보여 줍니다.',
 {title:'성경 「누가복음」 10장 30~37절, 선한 사마리아인의 비유',url:'https://bible.cbck.or.kr/Nab/Lk/10',relation:'원전 사건 순서를 초등용으로 재구성'},[
 ['길에서 도움이 필요했던 사람은 어떤 상태였나요?','강도를 만나 다쳤다','길을 잃고 신이 났다','짐을 다 팔았다','강도를 만나 다친 사람이 나옵니다.','fact'],
 ['여행자는 다친 사람을 어디로 데려갔나요?','여관','시장','성문','자신의 짐승에 태워 여관으로 데려갔습니다.','fact'],
 ['여행자가 다음 날 한 일은 무엇인가요?','돌봄을 부탁하고 비용을 맡겼다','상처를 숨기라고 했다','다친 사람을 길에 돌려보냈다','여관 주인에게 돌봄과 비용을 부탁했습니다.','sequence'],
 ['여행자의 행동에서 드러나는 마음은 무엇인가요?','어려운 사람을 돕고 싶은 마음','남의 일을 놀리고 싶은 마음','자신의 짐만 중요하다는 마음','여행자가 직접 돌보고 비용까지 맡긴 행동에서 짐작합니다.','inference'],
 ['이 글에서 말하는 이웃의 모습에 가장 가까운 것은 무엇인가요?','낯선 사람에게도 필요한 도움을 준 사람','같은 마을에서만 사는 사람','늘 함께 여행하는 사람','서로 몰라도 도움을 주는 행동을 중심으로 이야기가 전개됩니다.','main']
 ]);
 add('middle','fisherman-jar','literary','어부와 오래된 항아리',
 '옛 이야기 모음집인 천일야화에는 매일 정해진 횟수만 그물을 던지는 어부가 등장합니다. 어느 날 어부는 바다에서 뚜껑이 단단히 닫힌 구리 항아리를 건졌습니다. 뚜껑을 열자 연기처럼 나온 거대한 마신이 나타났습니다. 어부는 마신이 정말 그 작은 항아리 안에 들어 있었는지 믿기 어렵다고 말했습니다. 마신이 다시 항아리 안으로 들어가 보이자 어부는 뚜껑을 닫았습니다. 어부는 힘이 아니라 재치로 위험한 순간을 넘겼습니다.',
 {title:'「천일야화」 어부와 마신 이야기',url:'https://www.gutenberg.org/files/51252/51252-h/51252-h.htm',relation:'원전의 일부 사건을 초등용으로 축약'},[
 ['어부가 바다에서 건진 것은 무엇인가요?','구리 항아리','금으로 된 배','새 그물','뚜껑이 단단히 닫힌 구리 항아리를 건졌습니다.','fact'],
 ['항아리에서 나온 것은 무엇인가요?','거대한 마신','작은 물고기','두꺼운 책','연기처럼 나온 마신이 나타났습니다.','fact'],
 ['어부는 마신에게 무엇을 믿기 어렵다고 했나요?','작은 항아리 안에 들어 있었다는 것','바다에 물고기가 산다는 것','자신이 그물을 던졌다는 것','마신이 작은 항아리 안에 있었다는 말을 의심했습니다.','fact'],
 ['마신이 다시 항아리에 들어간 뒤 어부는 무엇을 했나요?','뚜껑을 닫았다','그물을 버렸다','마을로 먼저 돌아갔다','다시 들어간 모습을 본 어부가 뚜껑을 닫았습니다.','sequence'],
 ['어부가 위기를 넘긴 방법은 무엇인가요?','재치를 발휘했다','더 큰 힘으로 밀었다','도움을 기다리기만 했다','마신에게 직접 싸우지 않고 증명하도록 유도했습니다.','inference']
 ]);
 add('middle','garden-pond','nonfiction','학교 연못을 살펴보아요',
 '우리 학교 작은 연못에는 물속에서 자라는 식물과 여러 곤충이 살고 있습니다. 학생들은 연못을 조사하기 전에 물가에서 뛰지 않기로 약속했습니다. 관찰할 때는 동물을 함부로 잡지 않고, 발견한 장소와 모습을 기록했습니다. 연못 주변에 쓰레기가 많던 날에는 곤충을 관찰하기 어려웠습니다. 학생들은 한 번 본 모습만으로 결론을 내리지 않고, 날짜를 바꾸어 여러 차례 관찰한 뒤 기록을 비교했습니다.',
 original,[
 ['학생들이 조사 전에 한 약속은 무엇인가요?','물가에서 뛰지 않기','곤충을 모두 잡기','관찰 기록을 버리기','물가에서 뛰지 않기로 약속했습니다.','fact'],
 ['관찰할 때 기록한 것은 무엇인가요?','발견한 장소와 모습','어제의 숙제 점수','학교의 버스 번호','발견한 장소와 모습을 기록했습니다.','fact'],
 ['쓰레기가 많던 날에는 어떤 점이 어려웠나요?','곤충을 관찰하기 어려웠다','연못을 찾을 수 없었다','관찰 일지를 펼 수 없었다','쓰레기가 많던 날 곤충 관찰이 어려웠다고 했습니다.','cause'],
 ['여러 날 관찰한 까닭은 무엇인가요?','한 번의 관찰로 단정하지 않으려고','관찰 날짜를 잊으려고','연못을 더 크게 만들려고','날짜를 바꾸어 반복한 자료를 비교했습니다.','inference'],
 ['이 글의 중심 내용은 무엇인가요?','안전하고 정확하게 연못을 관찰하는 방법','연못에서 수영하는 방법','곤충을 많이 잡는 경기 방법','안전 약속과 관찰 기록, 반복 조사 방법을 설명합니다.','main']
 ]);
 add('upper','analects-reciprocity','nonfiction','상대의 입장에서 생각하기',
 '동아시아 고전인 논어에는 제자 자공이 공자에게 오래 지킬 수 있는 말을 물어보는 대목이 있습니다. 공자는 자신이 바라지 않는 일을 다른 사람에게 시키지 말라는 뜻으로 답했습니다. 이 말은 상대가 무엇을 싫어하는지 헤아리는 태도와 이어집니다. 다만 나에게 좋은 일이 상대에게도 무조건 좋은 것은 아닙니다. 예를 들어 혼자 공부하는 시간을 좋아하는 친구에게 갑자기 큰 소리로 응원하는 것이 도움이 되지 않을 수 있습니다. 그러므로 상대의 말을 듣고 상황을 살피는 일도 필요합니다.',
 {title:'「논어」 위령공편 15장 24절(통행본 장절 기준)',url:'https://confucius.page/analects-15-24/',relation:'고전의 대답을 설명하고 창작 사례를 덧붙임'},[
 ['자공은 공자에게 무엇을 물었나요?','오래 지킬 수 있는 말','새로운 길의 거리','시장 물건의 가격','자공은 오래 실천할 한마디를 물었습니다.','fact'],
 ['공자의 대답을 풀어 쓴 것으로 알맞은 것은 무엇인가요?','내가 원하지 않는 일을 남에게 하지 않는다','남이 원하는 것은 모두 똑같다','내가 좋아하면 남도 반드시 좋아한다','자신이 바라지 않는 일을 다른 사람에게 시키지 말라는 뜻입니다.','main'],
 ['큰 소리의 응원이 도움이 되지 않을 수 있는 까닭은 무엇인가요?','친구마다 원하는 방식이 다를 수 있어서','응원은 언제나 잘못된 행동이라서','공부는 반드시 혼자 해야 해서','상대가 원하는 방식이 다를 수 있다고 설명합니다.','inference'],
 ['글쓴이가 고전의 말을 설명한 뒤 덧붙인 내용은 무엇인가요?','상대의 말을 듣고 상황도 살펴야 한다','다른 사람의 의견을 묻지 말아야 한다','모두에게 같은 행동만 해야 한다','끝 문장에서 상대의 말을 듣고 상황을 살피는 일도 필요하다고 했습니다.','structure'],
 ['글의 주장에 가장 알맞은 실천은 무엇인가요?','친구에게 필요한 도움을 먼저 묻는다','친구가 싫어해도 계속 응원한다','내가 좋아하는 선물을 무조건 준다','상대의 뜻을 확인하는 행동이 본문의 설명과 연결됩니다.','application']
 ]);
 add('upper','quran-diversity','nonfiction','서로 다른 사람을 알아 가는 이유',
 '쿠란의 제49장 13절은 사람들이 여러 민족과 집단으로 이루어져 서로 알아 갈 수 있다는 내용을 담고 있습니다. 이 구절은 이슬람 경전 속에서 사람의 다양성을 말하는 대목입니다. 이 글은 그 의미를 문화 이해의 관점에서 살펴봅니다. 국제 교류 동아리 학생들은 서로 다른 나라의 식사 예절을 조사했습니다. 어떤 학생은 식사 도구가 다르면 이상하다고 말했지만, 다른 학생은 먼저 그 문화의 이유를 알아보자고 제안했습니다. 학생들은 서로에게 질문하고 자료를 확인하며 차이를 평가하기보다 이해하려 했습니다. 이것은 특정 신앙을 따르는지를 묻는 활동이 아니라 서로 다른 문화를 알아보는 활동입니다.',
 {title:'「쿠란」 49장 13절을 소개한 창작 설명문',url:'https://corpus.quran.com/translation.jsp?chapter=49&verse=13',relation:'경전 내용 소개와 창작 교실 사례를 구분'},[
 ['글에서 소개한 쿠란 구절의 주제는 무엇인가요?','서로 다른 사람들이 알아 가는 일','학교 운동장 넓이','물건의 정확한 가격','49장 13절에서 다양한 사람들이 서로 알아감을 말한다고 소개합니다.','main'],
 ['동아리 학생들은 무엇을 조사했나요?','나라별 식사 예절','나라별 시험 날짜','바다의 수심','서로 다른 나라의 식사 예절을 조사했습니다.','fact'],
 ['어떤 학생의 말에 다른 학생은 무엇을 제안했나요?','그 문화의 이유를 먼저 알아보자','다른 문화를 모두 피하자','조사를 당장 멈추자','다른 학생은 이유부터 알아보자고 했습니다.','sequence'],
 ['글에서 창작 사례로 제시한 것은 무엇인가요?','국제 교류 동아리의 식사 예절 조사','쿠란의 장과 절 번호','경전에 구절이 있다는 설명','동아리 교실 사례는 내용을 이해하기 위해 새로 만든 상황입니다.','evidence'],
 ['이 글의 의도로 가장 알맞은 것은 무엇인가요?','차이를 성급히 판단하지 않고 알아보게 한다','특정 신앙을 정답으로 선택하게 한다','모든 문화의 예절이 같다고 주장한다','마지막 부분에서 문화를 서로 알아보는 활동이라고 분명히 했습니다.','intent']
 ]);
 add('upper','dhammapada-peace','nonfiction','갈등을 풀어 가는 한 가지 방법',
 '불교 고전인 법구경의 제5게에는 미움이 또 다른 미움으로 사라지지 않는다는 뜻의 가르침이 있습니다. 이 말은 갈등을 무조건 참으라는 뜻으로만 이해할 필요는 없습니다. 예를 들어 모둠 발표를 준비하다 서로 심한 말을 한 두 학생이 있다고 합시다. 한 학생이 똑같이 심한 말로 되갚으면 다툼이 커질 수 있습니다. 두 사람은 먼저 언성을 낮추고 무엇이 속상했는지 차례대로 말했습니다. 문제가 계속된다면 선생님에게 도움을 청할 수도 있습니다. 이 교실 장면은 고전에 실제로 나오는 사건이 아니라 뜻을 생각해 보기 위해 만든 사례입니다.',
 {title:'「법구경」 제1장 제5게와 창작 사례',url:'https://www.dhammatalks.net/suttacentral/sc2016/sc/en/dhp.html',relation:'고전의 핵심 구절을 소개하고 창작 사례를 구분'},[
 ['법구경의 제5게에서 소개한 생각은 무엇인가요?','미움으로 미움을 없애기 어렵다','갈등은 반드시 혼자 해결한다','상대의 말은 듣지 않아도 된다','미움이 또 다른 미움으로 사라지지 않는다는 뜻을 소개했습니다.','main'],
 ['모둠에서 심한 말로 되갚으면 어떻게 될 수 있나요?','다툼이 더 커질 수 있다','다툼이 언제나 끝난다','발표 시간이 늘어난다','되갚는 말은 갈등을 키울 수 있다고 했습니다.','cause'],
 ['두 학생이 시도한 방법은 무엇인가요?','차례대로 속상했던 점을 말한다','함께 상대를 놀린다','서로의 말을 듣지 않는다','언성을 낮추고 차례로 이야기했다고 했습니다.','fact'],
 ['문제가 계속되면 누구에게 도움을 청할 수 있나요?','선생님','발표 자료 속 인물','가상의 심판','문제가 계속되면 선생님에게 도움을 청할 수 있습니다.','action'],
 ['이 글에서 창작된 부분은 무엇인가요?','모둠 발표 중 갈등을 푸는 교실 장면','법구경에 제5게가 있다는 점','고전의 제목','마지막 문장에서 교실 장면은 뜻을 설명하려고 만든 사례라고 했습니다.','evidence']
 ]);
 add('upper','news-photo','nonfiction','사진 한 장으로 알 수 있는 것',
 '학교 신문을 만드는 학생들이 공원에 사람이 가득한 사진을 발견했습니다. 한 학생은 “우리 마을 사람은 모두 이 공원을 좋아해.”라고 썼습니다. 다른 학생은 사진 속 사람만 보고 마을 전체의 생각을 알 수는 없다고 지적했습니다. 학생들은 촬영 날짜와 장소, 행사 유무를 확인했습니다. 사진이 축제 당일 오후에 찍혔다는 사실을 알고 나서는 평소에도 공원이 늘 붐비는지 따로 관찰하기로 했습니다. 최종 기사에는 “축제 당일 공원에 많은 사람이 모였다.”라고 적었습니다. 학생들은 사진에서 직접 확인한 사실과 아직 조사해야 할 주장을 구분했습니다.',
 original,[
 ['학생들이 처음 발견한 자료는 무엇인가요?','공원에 사람이 많은 사진','공원 사용료 표','학교 급식 메뉴','공원에 사람이 가득한 사진을 발견했습니다.','fact'],
 ['처음 쓴 문장이 적절하지 않은 까닭은 무엇인가요?','한 장의 사진으로 모든 사람의 생각을 알 수 없어서','사진에는 사람이 전혀 없어서','공원이 다른 나라에 있어서','사진 속 사람만으로 마을 전체의 생각을 단정할 수 없습니다.','inference'],
 ['학생들은 사진의 어떤 정보를 확인했나요?','촬영 날짜와 장소, 행사 여부','카메라의 판매 가격','기사 작성자의 키','촬영 날짜와 장소, 행사 유무를 확인했습니다.','evidence'],
 ['최종 기사가 바뀐 이유는 무엇인가요?','확인할 수 있는 사실만 쓰려고','사진을 지우기 위해서','축제가 열리지 않았기 때문에','축제 당일 사람이 많았다는 확인 가능한 사실로 고쳤습니다.','cause'],
 ['글의 중심 주장은 무엇인가요?','자료로 확인된 사실과 추측을 구분한다','사진 속 물건의 색만 기록한다','기사 제목은 항상 길게 쓴다','사진의 단서와 한계를 비교하며 사실과 주장을 나눕니다.','main']
 ]);
 // Reading and listening share one text, but the listening version includes
 // questions focused on remembered details, order and oral comprehension.
 // Each passage has two independently authored listening-only questions.
 const listenOverrides={
  'kr-eval-sun-and-wind':[
   [0,'들은 이야기에서 길을 걷던 사람은 무엇을 입고 있었나요?','두꺼운 외투','얇은 반팔옷','비옷','길을 걷던 사람은 두꺼운 외투를 입었습니다.','fact'],
   [4,'해가 사람에게 한 일은 무엇인가요?','따뜻하게 비추었다','차가운 바람을 불었다','비를 내렸다','해는 따뜻하게 빛나 사람이 외투를 벗게 했습니다.','sequence']
  ],
  'kr-eval-lost-mitten':[
   [0,'장갑의 주인이 찾아온 때는 언제였나요?','점심시간','아침 조회 시간','하교한 다음 날','점심시간에 하린이가 장갑을 찾으러 왔습니다.','fact'],
   [4,'하린이가 보여 준 물건은 무엇이었나요?','같은 무늬의 다른 장갑 한 짝','새로 산 빨간 우산','잃어버린 모자','다른 한 짝의 무늬가 같아서 주인을 확인할 수 있었습니다.','evidence']
  ],
  'kr-eval-library-guide':[
   [0,'도서관에서는 어떤 목소리로 말해야 하나요?','작은 목소리','아주 큰 목소리','노래하는 목소리','작은 목소리로 말하라는 안내가 있습니다.','action'],
   [4,'책을 다 읽으면 어떻게 해야 하나요?','정해진 자리에 놓는다','책을 책상 아래 숨긴다','아무 곳에 두고 간다','책을 다 읽은 뒤 정해진 자리에 놓으라고 했습니다.','action']
  ],
  'kr-eval-seed-note':[
   [0,'친구들은 식물의 모습을 무엇으로 남겼나요?','그림','노래','종이비행기','날짜마다 관찰한 모습을 그림으로 남겼습니다.','fact'],
   [4,'강낭콩을 화분에 처음 심은 날은 언제였나요?','월요일','목요일','다음 주 금요일','첫 월요일에 강낭콩을 심었습니다.','sequence']
  ],
  'kr-eval-hillel':[
   [0,'힐렐을 찾아온 사람은 무엇을 부탁했나요?','중요한 가르침을 짧게 알려 달라고','잃어버린 길을 알려 달라고','집을 지어 달라고','한 발로 서 있는 동안 중요한 가르침을 알려 달라고 했습니다.','fact'],
   [4,'힐렐이 짧은 말을 들려준 뒤 권한 일은 무엇인가요?','더 배우기','말을 모두 잊어버리기','질문을 그만하기','핵심 말을 들려준 뒤 더 배우라고 권했습니다.','sequence']
  ],
  'kr-eval-samaritan':[
   [0,'여행자는 다친 사람을 무엇에 태웠나요?','자신이 타던 짐승','큰 배','나무 수레','여행자는 자신이 타던 짐승에 다친 사람을 태웠습니다.','fact'],
   [4,'여행자가 돌봄을 부탁한 사람은 누구인가요?','여관 주인','강도','마을 우체부','다음 날 여관 주인에게 돌봄을 부탁했습니다.','fact']
  ],
  'kr-eval-fisherman-jar':[
   [0,'어부가 바다에서 하던 일은 무엇인가요?','그물 던지기','나무 심기','산에서 돌 캐기','어부는 정해진 횟수만 그물을 던졌습니다.','fact'],
   [4,'마신은 어부의 말을 듣고 무엇을 보여 주었나요?','다시 항아리 안으로 들어가는 모습','새 그물을 만드는 모습','배를 타고 떠나는 모습','마신은 항아리에 다시 들어가 자신이 들어갈 수 있음을 보여 주었습니다.','sequence']
  ],
  'kr-eval-garden-pond':[
   [0,'학생들이 살펴본 곳은 어디인가요?','학교의 작은 연못','학교 옥상','동네 운동장','학생들은 학교의 작은 연못을 조사했습니다.','fact'],
   [4,'학생들이 한 번만 관찰하지 않고 한 일은 무엇인가요?','날짜를 바꾸어 여러 번 관찰했다','기록 없이 한 번만 보았다','처음의 관찰을 모두 지웠다','날짜를 바꾸어 여러 차례 관찰한 결과를 비교했습니다.','sequence']
  ],
  'kr-eval-analects-reciprocity':[
   [0,'예시에서 친구가 좋아하는 시간은 무엇인가요?','혼자 공부하는 시간','큰 소리로 응원받는 시간','모두 함께 춤추는 시간','예시에 나온 친구는 혼자 공부하는 시간을 좋아합니다.','fact'],
   [4,'글에서 상대를 이해하기 위해 먼저 해 볼 행동은 무엇인가요?','상대의 말을 듣고 상황 살피기','내가 좋아하는 것만 강요하기','친구의 마음을 묻지 않기','마지막에 상대의 말을 듣고 상황을 살피라고 설명합니다.','application']
  ],
  'kr-eval-quran-diversity':[
   [0,'어떤 학생은 무엇이 다르면 이상하다고 말했나요?','식사 도구','교실 벽 색깔','날짜의 길이','어떤 학생은 식사 도구가 다르면 이상하다고 말했습니다.','fact'],
   [4,'학생들은 서로 다른 문화를 알아보려고 무엇을 했나요?','질문하고 자료를 확인했다','조사를 멈추었다','서로의 말을 막았다','서로에게 질문하고 자료를 확인하며 차이를 이해하려 했습니다.','action']
  ],
  'kr-eval-dhammapada-peace':[
   [0,'예시에 나온 두 학생은 무엇을 준비하고 있었나요?','모둠 발표','운동회 달리기','급식 시간','모둠 발표를 준비하다 심한 말을 주고받는 상황입니다.','fact'],
   [4,'학생들이 다툼을 풀려고 먼저 한 행동은 무엇인가요?','언성을 낮추었다','더 심하게 되갚았다','서로 도망갔다','두 학생은 먼저 언성을 낮추고 차례로 이야기했습니다.','sequence']
  ],
  'kr-eval-news-photo':[
   [0,'공원 사진은 언제 찍힌 것으로 밝혀졌나요?','축제 당일 오후','평일 이른 아침','겨울밤','사진은 축제 당일 오후에 찍힌 것으로 확인되었습니다.','fact'],
   [4,'학생들은 평소에도 공원이 붐비는지 알아보려고 무엇을 하기로 했나요?','따로 관찰하기','한 장의 사진만으로 단정하기','조사를 모두 그만두기','평소에도 공원이 붐비는지 따로 관찰하기로 했습니다.','inference']
  ]
 };
 for(const passage of entries){
   const overrides=listenOverrides[passage.id];
   if(!overrides||overrides.length!==2)throw Error('듣기 문항 미구성: '+passage.id);
   passage.listeningQuestions=passage.questions.map(q=>({...q,choices:[...q.choices]}));
   for(const [index,prompt,answer,w1,w2,explanation,skill] of overrides){
     passage.listeningQuestions[index]={prompt,answer,choices:[answer,w1,w2],explanation,skill};
   }
 }

 // Expanded passages use the same IDs, difficulty, questions and print/listen schema.
 // Load after legacy overrides so their independently authored oral questions are not replaced.
 const expansions=typeof module==='object'&&module.exports
   ?[require('./korean-assessment-extra-early.js'),require('./korean-assessment-extra-middle.js'),require('./korean-assessment-extra-upper.js')]
   :[globalThis.KoreanAssessmentExtraEarly,globalThis.KoreanAssessmentExtraMiddle,globalThis.KoreanAssessmentExtraUpper];
 const existingIds=new Set(entries.map(p=>p.id));
 for(const bandEntries of expansions){
   if(!Array.isArray(bandEntries))throw Error('국어 확장 지문 파일을 불러오지 못했습니다.');
   for(const p of bandEntries){
     if(existingIds.has(p.id))throw Error('중복된 국어 지문 ID: '+p.id);
     existingIds.add(p.id);
     entries.push(p);
   }
 }
 function inventory(){
   const bands={early:{literary:0,nonfiction:0},middle:{literary:0,nonfiction:0},upper:{literary:0,nonfiction:0}};
   for(const p of entries){if(!bands[p.band]||!['literary','nonfiction'].includes(p.genre))throw Error('국어 지문 학년군 또는 장르 오류: '+p.id);bands[p.band][p.genre]++}
   return JSON.parse(JSON.stringify({passages:entries.length,readingQuestions:entries.length*5,listeningAlternatives:entries.length*2,bands}));
 }

 function copy(value){return JSON.parse(JSON.stringify(value));}
 function passages(grade,{genre,mode}={}){
   const g=Number(grade),band=g<=2?'early':g<=4?'middle':'upper';
   if(!Number.isInteger(g)||g<1||g>6)throw Error('학년을 확인해 주세요.');
   return copy(entries.filter(p=>p.band===band&&(!genre||p.genre===genre)&&(!mode||p[mode])));
 }
 function asReadingSets(grade,{genre,mode}={}){
   return passages(grade,{genre,mode}).map(p=>({id:p.id,title:p.title,genre:p.genre,passage:p.passage,sourceLabel:p.sourceTitle,
     sourceUrl:p.sourceUrl,sourceRelation:p.sourceRelation,
     questions:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>[q.prompt,q.answer,...q.choices.slice(1)]),
     rationales:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>q.explanation),
      skills:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>q.skill)}));
 }
 function toAuthored(){
   return copy(entries.filter(p=>p.band!=='early').map(p=>({
     band:p.band==='middle'?'lower':'upper',id:p.id,genre:p.genre,title:p.title,passage:p.passage,
     sourceLabel:p.sourceTitle,sourceUrl:p.sourceUrl,sourceRelation:p.sourceRelation,
     questions:p.questions.map(q=>[q.prompt,q.answer,...q.choices.slice(1)]),
     rationales:p.questions.map(q=>q.explanation),skills:p.questions.map(q=>q.skill)
   })));
 }
 function audit(){
   const ids=new Set();
   for(const p of entries){
     if(ids.has(p.id)||!p.passage.trim()||p.questions.length!==5||!p.sourceTitle||!p.sourceRelation||p.reviewStatus!=='수업 전 교사 검수 필요')throw Error('지문 검증 실패: '+p.id);
     ids.add(p.id);
     if(p.listeningQuestions.length!==5||p.listeningQuestions.filter((q,i)=>q.prompt!==p.questions[i].prompt).length<2)throw Error('듣기 문항의 독립성 부족: '+p.id);
     for(const q of [...p.questions,...p.listeningQuestions]){
       if(!q.prompt||!q.explanation||!q.skill||q.choices.length!==3||new Set(q.choices).size!==3||
          q.choices[0]!==q.answer||!q.choices.every(Boolean))throw Error('문항 검증 실패: '+p.id);
     }
   }
   return {passages:entries.length,questions:entries.reduce((n,p)=>n+p.questions.length,0),grades:[1,2,3,4,5,6]};
 }
 audit();
 return {passages,asReadingSets,toAuthored,audit,inventory};
});
