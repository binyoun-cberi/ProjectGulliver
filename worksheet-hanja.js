(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WorksheetHanja=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LEVELS=typeof module==='object'&&module.exports?require('./worksheet-hanja-levels.js'):globalThis.WorksheetHanjaLevels;
const LEGACY_CHARACTERS=[
[1,`一|한|일 二|두|이 三|석|삼 四|넉|사 五|다섯|오 六|여섯|육 七|일곱|칠 八|여덟|팔 九|아홉|구 十|열|십 日|날|일 月|달|월 火|불|화 水|물|수 木|나무|목 金|쇠|금 土|흙|토 山|메|산 川|내|천 人|사람|인 大|큰|대 小|작을|소 上|윗|상 下|아래|하 中|가운데|중 口|입|구 目|눈|목 手|손|수 足|발|족 耳|귀|이`],
[3,`父|아버지|부 母|어머니|모 兄|형|형 弟|아우|제 子|아들|자 女|여자|녀 王|임금|왕 玉|구슬|옥 白|흰|백 靑|푸를|청 赤|붉을|적 百|일백|백 千|일천|천 萬|일만|만 年|해|년 生|날|생 學|배울|학 校|학교|교 先|먼저|선 友|벗|우 東|동녘|동 西|서녘|서 南|남녘|남 北|북녘|북 天|하늘|천 地|땅|지 雨|비|우 雲|구름|운 花|꽃|화 草|풀|초`],
[5,`春|봄|춘 夏|여름|하 秋|가을|추 冬|겨울|동 風|바람|풍 雪|눈|설 海|바다|해 江|강|강 林|수풀|림 森|수풀|삼 明|밝을|명 光|빛|광 心|마음|심 力|힘|력 文|글월|문 字|글자|자 讀|읽을|독 書|글|서 言|말씀|언 語|말씀|어 時|때|시 間|사이|간 道|길|도 正|바를|정 直|곧을|직 安|편안|안 全|온전|전 公|공평할|공 共|함께|공 同|한가지|동`]
].flatMap(([minGrade,text])=>text.split(' ').map(token=>{const [character,meaning,sound]=token.split('|');return {character,meaning,sound,minGrade}}));
const lookup=new Map([...LEGACY_CHARACTERS,...LEVELS.dictionary].map(x=>[x.character,x]));
const CHARACTERS=LEVELS.levels.flatMap(level=>Array.from(level.characters).map(character=>{const item=lookup.get(character);if(!item||!item.meaning||!item.sound)throw Error('한자 훈·음 확인 필요: '+character);return {character,meaning:item.meaning,sound:item.sound,level:level.id}}));
// Original child-friendly definitions and classroom examples.
const IDIOMS=[
[1,`一石二鳥|일석이조|한 일로 두 가지 이익을 얻음.|걸어서 도서관에 가니 운동도 하고 책도 빌려 일석이조였어요.|한:일,돌:석,두:이,새:조
一擧兩得|일거양득|한 가지 일을 하여 두 가지 이익을 얻음.|텃밭을 가꾸며 채소도 얻고 식물도 배워 일거양득이에요.|한:일,들:거,두:량,얻을:득
七轉八起|칠전팔기|여러 번 실패해도 포기하지 않고 다시 힘을 냄.|자전거 타기에 실패해도 칠전팔기의 마음으로 다시 도전했어요.|일곱:칠,구를:전,여덟:팔,일어날:기
十匙一飯|십시일반|여러 사람이 조금씩 힘을 보태어 한 사람을 도움.|친구들이 십시일반으로 성금을 모았어요.|열:십,숟가락:시,한:일,밥:반
有備無患|유비무환|미리 준비하면 걱정할 일이 없음.|비 소식에 우산을 챙겼더니 유비무환이었어요.|있을:유,갖출:비,없을:무,근심:환
作心三日|작심삼일|굳게 결심한 마음이 오래가지 못함.|매일 책을 읽겠다는 약속이 작심삼일이 되지 않게 노력해요.|지을:작,마음:심,석:삼,날:일
自業自得|자업자득|자기가 한 일의 결과를 자기가 받음.|준비물을 챙기지 않아 수업이 불편해진 것은 자업자득이었어요.|스스로:자,일:업,스스로:자,얻을:득
以心傳心|이심전심|말하지 않아도 서로의 마음을 알아차림.|친구와 이심전심으로 같은 선물을 골랐어요.|써:이,마음:심,전할:전,마음:심
同苦同樂|동고동락|괴로움과 즐거움을 함께함.|우리 모둠은 연극을 준비하며 동고동락했어요.|한가지:동,쓸:고,한가지:동,즐길:락
大器晩成|대기만성|큰 인물이 되기까지는 오랜 노력과 시간이 필요함.|지금은 서툴러도 대기만성을 생각하며 꾸준히 연습해요.|큰:대,그릇:기,늦을:만,이룰:성
一心同體|일심동체|여러 사람이 한마음으로 굳게 뭉침.|우리 팀은 일심동체가 되어 이어달리기를 했어요.|한:일,마음:심,한가지:동,몸:체
千差萬別|천차만별|여러 가지가 서로 크게 다름.|친구들이 그린 미래의 집은 천차만별이었어요.|일천:천,어긋날:차,일만:만,다를:별
百發百中|백발백중|쏘거나 던진 것이 매번 목표에 맞음.|여러 번 연습하니 공이 백발백중으로 바구니에 들어갔어요.|일백:백,쏠:발,일백:백,가운데:중
東問西答|동문서답|물음과 관계없는 엉뚱한 대답을 함.|이름을 물었는데 나이를 말해 동문서답이 되었어요.|동녘:동,물을:문,서녘:서,대답:답
天高馬肥|천고마비|하늘이 높고 말이 살찌는 풍요로운 가을을 이름.|맑은 가을 하늘을 보니 천고마비라는 말이 떠올라요.|하늘:천,높을:고,말:마,살찔:비
山海珍味|산해진미|산과 바다에서 나는 재료로 만든 귀하고 맛있는 음식.|잔칫상에 산해진미가 차려졌어요.|메:산,바다:해,보배:진,맛:미
春夏秋冬|춘하추동|봄·여름·가을·겨울의 네 계절.|춘하추동에 따라 학교 화단의 모습이 달라져요.|봄:춘,여름:하,가을:추,겨울:동
男女老少|남녀노소|남자와 여자, 노인과 어린이를 모두 이름.|마을 축제에는 남녀노소가 함께 모였어요.|사내:남,여자:녀,늙을:로,적을:소
家家戶戶|가가호호|집집마다 모두.|마을 사람들이 가가호호 꽃을 심었어요.|집:가,집:가,집:호,집:호
三三五五|삼삼오오|서너 명이나 대여섯 명씩 무리를 지은 모양.|친구들이 삼삼오오 모여 이야기를 나눴어요.|석:삼,석:삼,다섯:오,다섯:오`],
[3,`溫故知新|온고지신|옛것을 익혀 새로운 지식이나 깨달음을 얻음.|옛 다리의 구조를 살피며 온고지신의 자세로 새 다리를 구상했어요.|따뜻할:온,옛:고,알:지,새:신
切磋琢磨|절차탁마|학문이나 인격을 부지런히 갈고닦음.|친구와 서로 조언하며 절차탁마했어요.|끊을:절,갈:차,쫄:탁,갈:마
苦盡甘來|고진감래|어려운 일이 지나면 즐거운 일이 옴.|오랫동안 연습한 곡을 연주하니 고진감래가 떠올랐어요.|쓸:고,다할:진,달:감,올:래
結草報恩|결초보은|은혜를 잊지 않고 갚음.|어려울 때 받은 도움을 결초보은의 마음으로 기억해요.|맺을:결,풀:초,갚을:보,은혜:은
見物生心|견물생심|물건을 보면 가지고 싶은 마음이 생김.|장난감 가게 앞을 지나니 견물생심이었어요.|볼:견,물건:물,날:생,마음:심
過猶不及|과유불급|지나친 것은 모자란 것만큼 좋지 않음.|화분에 물을 너무 많이 주지 말라는 말에서 과유불급을 배웠어요.|지날:과,같을:유,아니:불,미칠:급
井底之蛙|정저지와|자기가 아는 좁은 세상만 전부라고 여김.|다른 지역을 여행하며 정저지와에서 벗어나고 싶어요.|우물:정,밑:저,갈:지,개구리:와
馬耳東風|마이동풍|남의 말에 귀를 기울이지 않고 흘려들음.|안전 수칙을 마이동풍으로 넘겨서는 안 돼요.|말:마,귀:이,동녘:동,바람:풍
畫龍點睛|화룡점정|가장 중요한 부분을 마무리하여 일을 완성함.|벽화에 마지막 눈동자를 그려 넣으니 화룡점정이 되었어요.|그림:화,용:룡,점:점,눈동자:정
雪上加霜|설상가상|어려운 일 위에 또 어려운 일이 겹침.|비가 쏟아지는데 우산까지 망가져 설상가상이었어요.|눈:설,윗:상,더할:가,서리:상`],
[5,`塞翁之馬|새옹지마|좋고 나쁜 일은 쉽게 판단하기 어려우며 서로 바뀔 수 있음.|실패한 경험이 새 기회가 되어 새옹지마라는 말을 실감했어요.|변방:새,늙은이:옹,갈:지,말:마
愚公移山|우공이산|꾸준히 노력하면 큰일도 이룰 수 있음.|매일 조금씩 연습하며 우공이산의 마음을 배워요.|어리석을:우,공평할:공,옮길:이,메:산
靑出於藍|청출어람|제자가 스승보다 더 뛰어나게 됨.|제자의 훌륭한 연주에 스승은 청출어람이라며 기뻐했어요.|푸를:청,날:출,어조사:어,쪽:람
易地思之|역지사지|상대방의 처지에서 생각함.|다툰 친구의 마음을 역지사지로 생각해 봤어요.|바꿀:역,땅:지,생각:사,갈:지
脣亡齒寒|순망치한|서로 의지하는 관계에서 한쪽이 어려워지면 다른 쪽도 영향을 받음.|함께 물을 쓰는 두 마을은 순망치한의 관계예요.|입술:순,망할:망,이:치,찰:한
大同小異|대동소이|작은 차이는 있으나 대체로 같음.|두 모둠이 낸 의견은 대동소이했어요.|큰:대,한가지:동,작을:소,다를:이
因果應報|인과응보|행동에 따라 그에 맞는 결과를 받음.|이야기 속 인물이 자기 행동의 결과를 맞는 모습에서 인과응보를 떠올렸어요.|인할:인,열매:과,응할:응,갚을:보
臥薪嘗膽|와신상담|목표를 이루려고 어려움을 참고 견딤.|실패를 겪은 선수가 와신상담하며 훈련했어요.|누울:와,섶:신,맛볼:상,쓸개:담
錦上添花|금상첨화|좋은 일에 또 좋은 일이 더해짐.|소풍 날 날씨도 맑고 꽃까지 활짝 피어 금상첨화였어요.|비단:금,윗:상,더할:첨,꽃:화
不恥下問|불치하문|자기보다 나이나 지위가 낮은 사람에게 묻는 일을 부끄러워하지 않음.|선생님도 모르는 것은 학생에게 묻는 불치하문의 자세를 보여 주셨어요.|아니:불,부끄러워할:치,아래:하,물을:문`]
].flatMap(([minGrade,text])=>text.split('\n').map(row=>{const [characters,reading,definition,example,labels]=row.split('|');return {characters,reading,definition,example,minGrade,letters:Array.from(characters).map((character,i)=>{const [meaning,sound]=labels.split(',')[i].split(':');return {character,meaning,sound}})}}));
function pool(topic,level='8'){
 if(topic==='hanja-trace'){const i=LEVELS.levels.findIndex(x=>x.id===String(level));if(i<0)return [];const allowed=new Set(LEVELS.levels.slice(0,i+1).map(x=>x.id));return CHARACTERS.filter(x=>allowed.has(x.level))}
 if(topic==='idiom-trace')return IDIOMS.filter(x=>level==='all'||x.minGrade===({basic:1,extended:3,advanced:5}[level]));
 return [];
}
function generate({subject='hanja',topic='hanja-trace',grade=1,hanjaLevel='8',idiomLevel='all',count=5,seed=42,responseFormat='trace'}){
 grade=Number(grade);count=Number(count);seed=Number(seed)>>>0;responseFormat=responseFormat||'trace';
 const idiom=topic==='idiom-trace',level=idiom?idiomLevel:String(hanjaLevel),assigned=LEVELS.levels.find(x=>x.id===level);
 if(subject!=='hanja'||!Number.isInteger(grade)||grade<1||grade>6||![5,10,15,20].includes(count)||!['trace','blank'].includes(responseFormat)||!idiom&&!assigned||idiom&&!['all','basic','extended','advanced'].includes(level))throw Error('급수와 연습 방법을 다시 골라 주세요.');
 const entries=pool(topic,level).map(x=>({...x}));if(entries.length<count)throw Error('선택한 범위의 개수에 맞게 연습 개수를 줄여 주세요.');
 let state=seed;const random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};
 for(let i=entries.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]]}
 const scope=idiom?({all:'전체',basic:'기초',extended:'확장',advanced:'심화'}[level]):'대한검정회 '+assigned.label;
 return {subject,topic,grade,hanjaLevel:String(hanjaLevel),idiomLevel,scope,count,seed,responseFormat,difficulty:'basic',variant:'tens',type:'',alignment:null,title:`${scope} · ${idiom?'사자성어':'한자'} 따라쓰기`,items:entries.slice(0,count).map(x=>({prompt:idiom?x.reading:`${x.meaning} ${x.sound}`,answer:idiom?x.characters:x.character,choices:[],tracing:{...x,idiom,blank:responseFormat==='blank'},explanation:idiom?x.definition:`${x.character} · ${x.meaning} ${x.sound}`}))};
}
return {characters:CHARACTERS,idioms:IDIOMS,levels:LEVELS.levels,source:LEVELS.source,pool,generate};
});
