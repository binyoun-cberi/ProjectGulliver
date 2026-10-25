(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WorksheetHanjaLevels=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Assignment membership: 대한검정회, 등급별 선정한자 (2026-07-29).
const source='https://www.hanja.ne.kr/board/board/content.asp?tb=inno_12&page=1&num=15&gisacode=';
const levels=[
 {
  "id": "8",
  "label": "8급",
  "total": 30,
  "characters": "九金南男女東六母木門父北四三西水十五月二人日一子弟七土八兄火"
 },
 {
  "id": "7",
  "label": "7급",
  "total": 50,
  "characters": "江口內年大目白山上小手外右入足左中靑出下"
 },
 {
  "id": "6",
  "label": "6급",
  "total": 70,
  "characters": "犬己林馬名百生石先姓心羊魚玉牛耳地千天川"
 },
 {
  "id": "pre5",
  "label": "준5급",
  "total": 100,
  "characters": "車巾古工今同力立末文方本夫不士夕世少食央王位衣字自正主寸向休"
 },
 {
  "id": "5",
  "label": "5급",
  "total": 250,
  "characters": "歌家各間强開去見京計高功空共科光敎交校區國軍近急旗記氣農多短答當對代道刀讀冬洞頭等登樂來老理里利萬每面命明毛無聞問物米民班半放番別步部分社事死色書線性成所首詩時示市植神身信新室安夜弱語言永英午用友原遠元有肉育銀音邑意作長場才田電前全朝祖晝住竹重直草村秋春親太通貝便平夏學韓漢合海行血形花話和活黃會孝後"
 },
 {
  "id": "pre4",
  "label": "준4급",
  "total": 400,
  "characters": "加可角感客格決結輕敬界考告苦曲公果過球郡貴根級吉能堂待德度圖童動落良歷例禮路勞綠流李亡買賣美朴反發法兵病福服奉冰仕史思使算相席雪省洗消速孫樹數宿順術習勝始式臣實失兒愛野藥陽洋漁億業如然溫要勇雲運院園油由飮醫以因任者昨章再在材的赤典展戰定庭第題族卒州注止知紙集參窓責淸體初充特表品風必河幸現號化畫訓凶黑"
 },
 {
  "id": "4",
  "label": "4급",
  "total": 600,
  "characters": "價甘減監改個擧件建健競景季故固骨課觀關廣橋久求救舊具局君規極給其基器技汽期念團端壇談到都島獨朗冷兩量旅練領令料類陸律望妹牧武未味倍變報婦富備比鼻費貧謝師査寫産賞商常序仙選鮮船善說星聖盛聲城誠歲勢束送授守是視試識氏惡眼案暗約養餘熱葉藝屋完往曜浴雨雄願爲偉恩義移姊將財災爭低貯敵傳切節店情停精政祭鳥助早調操存終種坐罪週增志至支進眞質次着察唱處鐵最祝蟲忠齒致則他打卓炭宅統退波板敗筆寒限香害許協惠好湖患回效"
 },
 {
  "id": "pre3",
  "label": "준3급",
  "total": 800,
  "characters": "街佳假干看甲康講降更巨檢儉潔經警慶庚耕境戒癸溪繼庫谷官究句群弓權歸均禁及起暖難納乃怒努丹單斷達隊徒斗豆得燈略連烈列錄論倫莫滿忘卯妙戊務尾密飯房防訪背拜罰伐丙保寶復伏否佛飛悲非舍巳絲寺散殺狀想床舌細稅掃笑素續俗松愁收修受純戌拾承息申辛若與逆硏煙營榮誤謠容遇圓員危酉遺乳乙陰應依貳異益引印認寅壹壬壯適專絶點接丁井製除制兆造尊宗走朱衆持指職辰創冊聽請丑取治針快脫探討破判片布暴包票解亥鄕虛驗賢呼戶貨候吸興希"
 },
 {
  "id": "3",
  "label": "3급",
  "total": 1000,
  "characters": "脚渴敢皆居乾堅鏡驚階鷄孤穀困坤窮勸卷勤幾旣但段卵覽浪郞涼露留柳晩忙麥免勉眠鳴暮墓茂舞墨勿杯凡犯逢扶浮朋秘私射傷霜尙喪象暑昔惜設損須秀誰雖壽叔淑崇乘施深甚我顔巖仰哀也揚讓於憶嚴余汝亦域硯悅炎迎吾悟烏瓦臥曰欲于宇又尤憂云源怨威遊猶儒唯柔幼吟泣矣議易已而忍仁慈腸栽哉著積轉錢靜貞頂淨帝諸從鐘宙酒卽曾證只枝之智盡執且此借昌採菜妻尺泉淺晴招推追就吹層泰痛投篇閉抱楓豊皮彼疲匹賀何恨閑恒刑乎虎或混婚紅華歡皇厚胸喜"
 }
];
const additional=`男|사내|남 門|문|문 江|강|강 內|안|내 外|바깥|외 右|오른|우 入|들|입 左|왼|좌 出|날|출 犬|개|견 己|몸|기 馬|말|마 名|이름|명 石|돌|석 姓|성|성 羊|양|양 魚|물고기|어 牛|소|우 車|수레|차 巾|수건|건 古|옛|고 工|장인|공 今|이제|금 立|설|립 末|끝|말 方|모|방 本|근본|본 夫|지아비|부 不|아니|불 士|선비|사 夕|저녁|석 世|세상|세 少|적을|소 食|밥|식 央|가운데|앙 位|자리|위 衣|옷|의 自|스스로|자 主|주인|주 寸|마디|촌 向|향할|향 休|쉴|휴 歌|노래|가 家|집|가 各|각각|각 强|강할|강 開|열|개 去|갈|거 見|볼|견 京|서울|경 計|셀|계 高|높을|고 功|공|공 空|빌|공 科|과목|과 敎|가르칠|교 交|사귈|교 區|구분할|구 國|나라|국 軍|군사|군 近|가까울|근 急|급할|급 旗|기|기 記|기록할|기 氣|기운|기 農|농사|농 多|많을|다 短|짧을|단 答|대답|답 當|마땅|당 對|대할|대 代|대신할|대 刀|칼|도 洞|골|동 頭|머리|두 等|무리|등 登|오를|등 樂|즐길|락 來|올|래 老|늙을|로 理|다스릴|리 里|마을|리 利|이로울|리 每|매양|매 面|낯|면 命|목숨|명 毛|터럭|모 無|없을|무 聞|들을|문 問|물을|문 物|물건|물 米|쌀|미 民|백성|민 班|나눌|반 半|반|반 放|놓을|방 番|차례|번 別|다를|별 步|걸음|보 部|떼|부 分|나눌|분 社|모일|사 事|일|사 死|죽을|사 色|빛|색 線|줄|선 性|성품|성 成|이룰|성 所|바|소 首|머리|수 詩|시|시 示|보일|시 市|저자|시 植|심을|식 神|귀신|신 身|몸|신 信|믿을|신 新|새|신 室|집|실 夜|밤|야 弱|약할|약 永|길|영 英|꽃부리|영 午|낮|오 用|쓸|용 原|언덕|원 遠|멀|원 元|으뜸|원 有|있을|유 肉|고기|육 育|기를|육 銀|은|은 音|소리|음 邑|고을|읍 意|뜻|의 作|지을|작 長|길|장 場|마당|장 才|재주|재 田|밭|전 電|번개|전 前|앞|전 朝|아침|조 祖|할아비|조 晝|낮|주 住|살|주 竹|대|죽 重|무거울|중 村|마을|촌 親|친할|친 太|클|태 通|통할|통 貝|조개|패 便|편할|편 平|평평할|평 韓|나라|한 漢|한수|한 合|합할|합 行|다닐|행 血|피|혈 形|모양|형 話|말씀|화 和|화할|화 活|살|활 黃|누를|황 會|모일|회 孝|효도|효 後|뒤|후`;
const upperDictionary=[
 {
  "character": "加",
  "meaning": "더할",
  "sound": "가"
 },
 {
  "character": "勞",
  "meaning": "수고로울",
  "sound": "로"
 },
 {
  "character": "始",
  "meaning": "처음",
  "sound": "시"
 },
 {
  "character": "典",
  "meaning": "법",
  "sound": "전"
 },
 {
  "character": "可",
  "meaning": "옳을",
  "sound": "가"
 },
 {
  "character": "綠",
  "meaning": "푸를",
  "sound": "록"
 },
 {
  "character": "式",
  "meaning": "법",
  "sound": "식"
 },
 {
  "character": "戰",
  "meaning": "싸움",
  "sound": "전"
 },
 {
  "character": "角",
  "meaning": "뿔",
  "sound": "각"
 },
 {
  "character": "流",
  "meaning": "흐를",
  "sound": "류"
 },
 {
  "character": "臣",
  "meaning": "신하",
  "sound": "신"
 },
 {
  "character": "展",
  "meaning": "펼",
  "sound": "전"
 },
 {
  "character": "感",
  "meaning": "느낄",
  "sound": "감"
 },
 {
  "character": "李",
  "meaning": "오얏",
  "sound": "리"
 },
 {
  "character": "實",
  "meaning": "열매",
  "sound": "실"
 },
 {
  "character": "庭",
  "meaning": "뜰",
  "sound": "정"
 },
 {
  "character": "客",
  "meaning": "손님",
  "sound": "객"
 },
 {
  "character": "亡",
  "meaning": "망할",
  "sound": "망"
 },
 {
  "character": "失",
  "meaning": "잃을",
  "sound": "실"
 },
 {
  "character": "定",
  "meaning": "정할",
  "sound": "정"
 },
 {
  "character": "格",
  "meaning": "격식",
  "sound": "격"
 },
 {
  "character": "買",
  "meaning": "살",
  "sound": "매"
 },
 {
  "character": "兒",
  "meaning": "아이",
  "sound": "아"
 },
 {
  "character": "題",
  "meaning": "제목",
  "sound": "제"
 },
 {
  "character": "決",
  "meaning": "결단할",
  "sound": "결"
 },
 {
  "character": "賣",
  "meaning": "팔",
  "sound": "매"
 },
 {
  "character": "愛",
  "meaning": "사랑",
  "sound": "애"
 },
 {
  "character": "第",
  "meaning": "차례",
  "sound": "제"
 },
 {
  "character": "結",
  "meaning": "맺을",
  "sound": "결"
 },
 {
  "character": "美",
  "meaning": "아름다울",
  "sound": "미"
 },
 {
  "character": "野",
  "meaning": "들",
  "sound": "야"
 },
 {
  "character": "族",
  "meaning": "겨레",
  "sound": "족"
 },
 {
  "character": "輕",
  "meaning": "가벼울",
  "sound": "경"
 },
 {
  "character": "朴",
  "meaning": "순박할",
  "sound": "박"
 },
 {
  "character": "藥",
  "meaning": "약",
  "sound": "약"
 },
 {
  "character": "卒",
  "meaning": "군사",
  "sound": "졸"
 },
 {
  "character": "敬",
  "meaning": "공경할",
  "sound": "경"
 },
 {
  "character": "反",
  "meaning": "돌이킬",
  "sound": "반"
 },
 {
  "character": "陽",
  "meaning": "볕",
  "sound": "양"
 },
 {
  "character": "州",
  "meaning": "고을",
  "sound": "주"
 },
 {
  "character": "界",
  "meaning": "지경",
  "sound": "계"
 },
 {
  "character": "發",
  "meaning": "필",
  "sound": "발"
 },
 {
  "character": "洋",
  "meaning": "큰바다",
  "sound": "양"
 },
 {
  "character": "注",
  "meaning": "물댈",
  "sound": "주"
 },
 {
  "character": "苦",
  "meaning": "괴로울",
  "sound": "고"
 },
 {
  "character": "法",
  "meaning": "법",
  "sound": "법"
 },
 {
  "character": "漁",
  "meaning": "고기잡을",
  "sound": "어"
 },
 {
  "character": "止",
  "meaning": "그칠",
  "sound": "지"
 },
 {
  "character": "考",
  "meaning": "상고할",
  "sound": "고"
 },
 {
  "character": "兵",
  "meaning": "군사",
  "sound": "병"
 },
 {
  "character": "億",
  "meaning": "억",
  "sound": "억"
 },
 {
  "character": "知",
  "meaning": "알",
  "sound": "지"
 },
 {
  "character": "告",
  "meaning": "알릴",
  "sound": "고"
 },
 {
  "character": "病",
  "meaning": "병",
  "sound": "병"
 },
 {
  "character": "業",
  "meaning": "일",
  "sound": "업"
 },
 {
  "character": "紙",
  "meaning": "종이",
  "sound": "지"
 },
 {
  "character": "曲",
  "meaning": "굽을",
  "sound": "곡"
 },
 {
  "character": "福",
  "meaning": "복",
  "sound": "복"
 },
 {
  "character": "如",
  "meaning": "같을",
  "sound": "여"
 },
 {
  "character": "集",
  "meaning": "모일",
  "sound": "집"
 },
 {
  "character": "公",
  "meaning": "공변될",
  "sound": "공"
 },
 {
  "character": "服",
  "meaning": "옷",
  "sound": "복"
 },
 {
  "character": "然",
  "meaning": "그럴",
  "sound": "연"
 },
 {
  "character": "參",
  "meaning": "참여할",
  "sound": "참"
 },
 {
  "character": "果",
  "meaning": "과실",
  "sound": "과"
 },
 {
  "character": "奉",
  "meaning": "받들",
  "sound": "봉"
 },
 {
  "character": "溫",
  "meaning": "따뜻할",
  "sound": "온"
 },
 {
  "character": "窓",
  "meaning": "창문",
  "sound": "창"
 },
 {
  "character": "過",
  "meaning": "지날",
  "sound": "과"
 },
 {
  "character": "冰",
  "meaning": "얼음",
  "sound": "빙"
 },
 {
  "character": "要",
  "meaning": "구할",
  "sound": "요"
 },
 {
  "character": "責",
  "meaning": "꾸짖을",
  "sound": "책"
 },
 {
  "character": "球",
  "meaning": "공",
  "sound": "구"
 },
 {
  "character": "仕",
  "meaning": "벼슬할",
  "sound": "사"
 },
 {
  "character": "勇",
  "meaning": "날쌜",
  "sound": "용"
 },
 {
  "character": "淸",
  "meaning": "맑을",
  "sound": "청"
 },
 {
  "character": "郡",
  "meaning": "고을",
  "sound": "군"
 },
 {
  "character": "思",
  "meaning": "생각",
  "sound": "사"
 },
 {
  "character": "雲",
  "meaning": "구름",
  "sound": "운"
 },
 {
  "character": "體",
  "meaning": "몸",
  "sound": "체"
 },
 {
  "character": "貴",
  "meaning": "귀할",
  "sound": "귀"
 },
 {
  "character": "史",
  "meaning": "역사",
  "sound": "사"
 },
 {
  "character": "運",
  "meaning": "움직일",
  "sound": "운"
 },
 {
  "character": "初",
  "meaning": "처음",
  "sound": "초"
 },
 {
  "character": "根",
  "meaning": "뿌리",
  "sound": "근"
 },
 {
  "character": "使",
  "meaning": "하여금",
  "sound": "사"
 },
 {
  "character": "園",
  "meaning": "동산",
  "sound": "원"
 },
 {
  "character": "充",
  "meaning": "채울",
  "sound": "충"
 },
 {
  "character": "級",
  "meaning": "등급",
  "sound": "급"
 },
 {
  "character": "算",
  "meaning": "셈",
  "sound": "산"
 },
 {
  "character": "院",
  "meaning": "집",
  "sound": "원"
 },
 {
  "character": "特",
  "meaning": "특별할",
  "sound": "특"
 },
 {
  "character": "吉",
  "meaning": "길할",
  "sound": "길"
 },
 {
  "character": "相",
  "meaning": "서로",
  "sound": "상"
 },
 {
  "character": "油",
  "meaning": "기름",
  "sound": "유"
 },
 {
  "character": "表",
  "meaning": "겉",
  "sound": "표"
 },
 {
  "character": "能",
  "meaning": "능할",
  "sound": "능"
 },
 {
  "character": "席",
  "meaning": "자리",
  "sound": "석"
 },
 {
  "character": "由",
  "meaning": "말미암을",
  "sound": "유"
 },
 {
  "character": "品",
  "meaning": "물건",
  "sound": "품"
 },
 {
  "character": "堂",
  "meaning": "집",
  "sound": "당"
 },
 {
  "character": "雪",
  "meaning": "눈",
  "sound": "설"
 },
 {
  "character": "飮",
  "meaning": "마실",
  "sound": "음"
 },
 {
  "character": "風",
  "meaning": "바람",
  "sound": "풍"
 },
 {
  "character": "待",
  "meaning": "기다릴",
  "sound": "대"
 },
 {
  "character": "省",
  "meaning": "살필",
  "sound": "성"
 },
 {
  "character": "醫",
  "meaning": "의원",
  "sound": "의"
 },
 {
  "character": "必",
  "meaning": "반드시",
  "sound": "필"
 },
 {
  "character": "德",
  "meaning": "덕",
  "sound": "덕"
 },
 {
  "character": "洗",
  "meaning": "씻을",
  "sound": "세"
 },
 {
  "character": "以",
  "meaning": "써",
  "sound": "이"
 },
 {
  "character": "河",
  "meaning": "물",
  "sound": "하"
 },
 {
  "character": "圖",
  "meaning": "그림",
  "sound": "도"
 },
 {
  "character": "消",
  "meaning": "사라질",
  "sound": "소"
 },
 {
  "character": "因",
  "meaning": "인할",
  "sound": "인"
 },
 {
  "character": "幸",
  "meaning": "다행",
  "sound": "행"
 },
 {
  "character": "度",
  "meaning": "법도",
  "sound": "도"
 },
 {
  "character": "速",
  "meaning": "빠를",
  "sound": "속"
 },
 {
  "character": "任",
  "meaning": "맡길",
  "sound": "임"
 },
 {
  "character": "現",
  "meaning": "나타날",
  "sound": "현"
 },
 {
  "character": "童",
  "meaning": "아이",
  "sound": "동"
 },
 {
  "character": "孫",
  "meaning": "손자",
  "sound": "손"
 },
 {
  "character": "者",
  "meaning": "놈",
  "sound": "자"
 },
 {
  "character": "號",
  "meaning": "이름",
  "sound": "호"
 },
 {
  "character": "動",
  "meaning": "움직일",
  "sound": "동"
 },
 {
  "character": "樹",
  "meaning": "나무",
  "sound": "수"
 },
 {
  "character": "昨",
  "meaning": "어제",
  "sound": "작"
 },
 {
  "character": "畫",
  "meaning": "그림",
  "sound": "화"
 },
 {
  "character": "落",
  "meaning": "떨어질",
  "sound": "락"
 },
 {
  "character": "數",
  "meaning": "셈",
  "sound": "수"
 },
 {
  "character": "章",
  "meaning": "글",
  "sound": "장"
 },
 {
  "character": "化",
  "meaning": "될,변화할",
  "sound": "화"
 },
 {
  "character": "良",
  "meaning": "어질",
  "sound": "량"
 },
 {
  "character": "宿",
  "meaning": "잠잘",
  "sound": "숙"
 },
 {
  "character": "再",
  "meaning": "두",
  "sound": "재"
 },
 {
  "character": "訓",
  "meaning": "가르칠",
  "sound": "훈"
 },
 {
  "character": "歷",
  "meaning": "지낼",
  "sound": "력"
 },
 {
  "character": "順",
  "meaning": "순할",
  "sound": "순"
 },
 {
  "character": "在",
  "meaning": "있을",
  "sound": "재"
 },
 {
  "character": "凶",
  "meaning": "흉할",
  "sound": "흉"
 },
 {
  "character": "例",
  "meaning": "법식",
  "sound": "례"
 },
 {
  "character": "術",
  "meaning": "재주",
  "sound": "술"
 },
 {
  "character": "材",
  "meaning": "재목",
  "sound": "재"
 },
 {
  "character": "黑",
  "meaning": "검을",
  "sound": "흑"
 },
 {
  "character": "禮",
  "meaning": "예도",
  "sound": "례"
 },
 {
  "character": "習",
  "meaning": "익힐",
  "sound": "습"
 },
 {
  "character": "的",
  "meaning": "과녁",
  "sound": "적"
 },
 {
  "character": "路",
  "meaning": "길",
  "sound": "로"
 },
 {
  "character": "勝",
  "meaning": "이길",
  "sound": "승"
 },
 {
  "character": "赤",
  "meaning": "붉을",
  "sound": "적"
 },
 {
  "character": "價",
  "meaning": "값",
  "sound": "가"
 },
 {
  "character": "久",
  "meaning": "오랠",
  "sound": "구"
 },
 {
  "character": "旅",
  "meaning": "나그네",
  "sound": "려"
 },
 {
  "character": "謝",
  "meaning": "사례할",
  "sound": "사"
 },
 {
  "character": "甘",
  "meaning": "달",
  "sound": "감"
 },
 {
  "character": "局",
  "meaning": "판",
  "sound": "국"
 },
 {
  "character": "練",
  "meaning": "익힐",
  "sound": "련"
 },
 {
  "character": "師",
  "meaning": "스승",
  "sound": "사"
 },
 {
  "character": "減",
  "meaning": "덜",
  "sound": "감"
 },
 {
  "character": "君",
  "meaning": "임금",
  "sound": "군"
 },
 {
  "character": "領",
  "meaning": "옷깃",
  "sound": "령"
 },
 {
  "character": "査",
  "meaning": "조사할",
  "sound": "사"
 },
 {
  "character": "監",
  "meaning": "볼",
  "sound": "감"
 },
 {
  "character": "規",
  "meaning": "법",
  "sound": "규"
 },
 {
  "character": "令",
  "meaning": "하여금,명령할",
  "sound": "령"
 },
 {
  "character": "産",
  "meaning": "낳을",
  "sound": "산"
 },
 {
  "character": "改",
  "meaning": "고칠",
  "sound": "개"
 },
 {
  "character": "極",
  "meaning": "다할",
  "sound": "극"
 },
 {
  "character": "料",
  "meaning": "헤아릴",
  "sound": "료"
 },
 {
  "character": "賞",
  "meaning": "상줄",
  "sound": "상"
 },
 {
  "character": "個",
  "meaning": "낱",
  "sound": "개"
 },
 {
  "character": "給",
  "meaning": "줄",
  "sound": "급"
 },
 {
  "character": "類",
  "meaning": "무리",
  "sound": "류"
 },
 {
  "character": "商",
  "meaning": "장사",
  "sound": "상"
 },
 {
  "character": "擧",
  "meaning": "들",
  "sound": "거"
 },
 {
  "character": "其",
  "meaning": "그",
  "sound": "기"
 },
 {
  "character": "陸",
  "meaning": "뭍",
  "sound": "륙"
 },
 {
  "character": "常",
  "meaning": "항상",
  "sound": "상"
 },
 {
  "character": "健",
  "meaning": "건강할",
  "sound": "건"
 },
 {
  "character": "器",
  "meaning": "그릇",
  "sound": "기"
 },
 {
  "character": "律",
  "meaning": "법",
  "sound": "률"
 },
 {
  "character": "序",
  "meaning": "차례",
  "sound": "서"
 },
 {
  "character": "件",
  "meaning": "사건",
  "sound": "건"
 },
 {
  "character": "期",
  "meaning": "기약할",
  "sound": "기"
 },
 {
  "character": "望",
  "meaning": "바랄",
  "sound": "망"
 },
 {
  "character": "選",
  "meaning": "가릴",
  "sound": "선"
 },
 {
  "character": "建",
  "meaning": "세울",
  "sound": "건"
 },
 {
  "character": "汽",
  "meaning": "물끓는김",
  "sound": "기"
 },
 {
  "character": "妹",
  "meaning": "아랫누이",
  "sound": "매"
 },
 {
  "character": "鮮",
  "meaning": "고울",
  "sound": "선"
 },
 {
  "character": "競",
  "meaning": "다툴",
  "sound": "경"
 },
 {
  "character": "技",
  "meaning": "재주",
  "sound": "기"
 },
 {
  "character": "牧",
  "meaning": "칠",
  "sound": "목"
 },
 {
  "character": "船",
  "meaning": "배",
  "sound": "선"
 },
 {
  "character": "景",
  "meaning": "볕",
  "sound": "경"
 },
 {
  "character": "基",
  "meaning": "터",
  "sound": "기"
 },
 {
  "character": "武",
  "meaning": "굳셀",
  "sound": "무"
 },
 {
  "character": "仙",
  "meaning": "신선",
  "sound": "선"
 },
 {
  "character": "季",
  "meaning": "철",
  "sound": "계"
 },
 {
  "character": "念",
  "meaning": "생각",
  "sound": "념"
 },
 {
  "character": "味",
  "meaning": "맛",
  "sound": "미"
 },
 {
  "character": "善",
  "meaning": "착할",
  "sound": "선"
 },
 {
  "character": "固",
  "meaning": "굳을",
  "sound": "고"
 },
 {
  "character": "團",
  "meaning": "둥글,모일",
  "sound": "단"
 },
 {
  "character": "未",
  "meaning": "아닐",
  "sound": "미"
 },
 {
  "character": "說",
  "meaning": "말씀",
  "sound": "설"
 },
 {
  "character": "故",
  "meaning": "연고",
  "sound": "고"
 },
 {
  "character": "端",
  "meaning": "바를",
  "sound": "단"
 },
 {
  "character": "倍",
  "meaning": "갑절",
  "sound": "배"
 },
 {
  "character": "星",
  "meaning": "별",
  "sound": "성"
 },
 {
  "character": "骨",
  "meaning": "뼈",
  "sound": "골"
 },
 {
  "character": "壇",
  "meaning": "제단",
  "sound": "단"
 },
 {
  "character": "變",
  "meaning": "변할",
  "sound": "변"
 },
 {
  "character": "聖",
  "meaning": "성스러울",
  "sound": "성"
 },
 {
  "character": "課",
  "meaning": "매길",
  "sound": "과"
 },
 {
  "character": "談",
  "meaning": "말씀",
  "sound": "담"
 },
 {
  "character": "報",
  "meaning": "갚을",
  "sound": "보"
 },
 {
  "character": "盛",
  "meaning": "성할",
  "sound": "성"
 },
 {
  "character": "關",
  "meaning": "관계할,빗장",
  "sound": "관"
 },
 {
  "character": "都",
  "meaning": "도읍",
  "sound": "도"
 },
 {
  "character": "富",
  "meaning": "부자",
  "sound": "부"
 },
 {
  "character": "聲",
  "meaning": "소리",
  "sound": "성"
 },
 {
  "character": "觀",
  "meaning": "볼",
  "sound": "관"
 },
 {
  "character": "島",
  "meaning": "섬",
  "sound": "도"
 },
 {
  "character": "婦",
  "meaning": "지어미,며느리",
  "sound": "부"
 },
 {
  "character": "城",
  "meaning": "재",
  "sound": "성"
 },
 {
  "character": "廣",
  "meaning": "넓을",
  "sound": "광"
 },
 {
  "character": "到",
  "meaning": "이를",
  "sound": "도"
 },
 {
  "character": "備",
  "meaning": "갖출",
  "sound": "비"
 },
 {
  "character": "誠",
  "meaning": "정성",
  "sound": "성"
 },
 {
  "character": "橋",
  "meaning": "다리",
  "sound": "교"
 },
 {
  "character": "獨",
  "meaning": "홀로",
  "sound": "독"
 },
 {
  "character": "比",
  "meaning": "견줄",
  "sound": "비"
 },
 {
  "character": "勢",
  "meaning": "권세",
  "sound": "세"
 },
 {
  "character": "具",
  "meaning": "갖출",
  "sound": "구"
 },
 {
  "character": "朗",
  "meaning": "밝을",
  "sound": "랑"
 },
 {
  "character": "費",
  "meaning": "쓸",
  "sound": "비"
 },
 {
  "character": "歲",
  "meaning": "해",
  "sound": "세"
 },
 {
  "character": "救",
  "meaning": "구원할",
  "sound": "구"
 },
 {
  "character": "冷",
  "meaning": "찰",
  "sound": "랭"
 },
 {
  "character": "鼻",
  "meaning": "코",
  "sound": "비"
 },
 {
  "character": "束",
  "meaning": "묶을",
  "sound": "속"
 },
 {
  "character": "求",
  "meaning": "구할",
  "sound": "구"
 },
 {
  "character": "兩",
  "meaning": "두",
  "sound": "량"
 },
 {
  "character": "貧",
  "meaning": "가난할",
  "sound": "빈"
 },
 {
  "character": "送",
  "meaning": "보낼",
  "sound": "송"
 },
 {
  "character": "舊",
  "meaning": "옛",
  "sound": "구"
 },
 {
  "character": "量",
  "meaning": "헤아릴",
  "sound": "량"
 },
 {
  "character": "寫",
  "meaning": "베낄,쓸",
  "sound": "사"
 },
 {
  "character": "授",
  "meaning": "줄",
  "sound": "수"
 },
 {
  "character": "守",
  "meaning": "지킬",
  "sound": "수"
 },
 {
  "character": "姊",
  "meaning": "맏누이",
  "sound": "자"
 },
 {
  "character": "志",
  "meaning": "뜻",
  "sound": "지"
 },
 {
  "character": "筆",
  "meaning": "붓",
  "sound": "필"
 },
 {
  "character": "視",
  "meaning": "볼",
  "sound": "시"
 },
 {
  "character": "將",
  "meaning": "장수",
  "sound": "장"
 },
 {
  "character": "至",
  "meaning": "이를",
  "sound": "지"
 },
 {
  "character": "寒",
  "meaning": "찰",
  "sound": "한"
 },
 {
  "character": "試",
  "meaning": "시험",
  "sound": "시"
 },
 {
  "character": "財",
  "meaning": "재물",
  "sound": "재"
 },
 {
  "character": "支",
  "meaning": "지탱할",
  "sound": "지"
 },
 {
  "character": "限",
  "meaning": "한정",
  "sound": "한"
 },
 {
  "character": "是",
  "meaning": "옳을",
  "sound": "시"
 },
 {
  "character": "災",
  "meaning": "재앙",
  "sound": "재"
 },
 {
  "character": "進",
  "meaning": "나아갈",
  "sound": "진"
 },
 {
  "character": "害",
  "meaning": "해칠",
  "sound": "해"
 },
 {
  "character": "識",
  "meaning": "알",
  "sound": "식"
 },
 {
  "character": "爭",
  "meaning": "다툴",
  "sound": "쟁"
 },
 {
  "character": "眞",
  "meaning": "참",
  "sound": "진"
 },
 {
  "character": "香",
  "meaning": "향기",
  "sound": "향"
 },
 {
  "character": "氏",
  "meaning": "성씨",
  "sound": "씨"
 },
 {
  "character": "低",
  "meaning": "낮을",
  "sound": "저"
 },
 {
  "character": "質",
  "meaning": "바탕",
  "sound": "질"
 },
 {
  "character": "許",
  "meaning": "허락할",
  "sound": "허"
 },
 {
  "character": "惡",
  "meaning": "악할",
  "sound": "악"
 },
 {
  "character": "貯",
  "meaning": "쌓을",
  "sound": "저"
 },
 {
  "character": "次",
  "meaning": "버금",
  "sound": "차"
 },
 {
  "character": "協",
  "meaning": "도울",
  "sound": "협"
 },
 {
  "character": "眼",
  "meaning": "눈",
  "sound": "안"
 },
 {
  "character": "敵",
  "meaning": "원수",
  "sound": "적"
 },
 {
  "character": "着",
  "meaning": "붙을",
  "sound": "착"
 },
 {
  "character": "惠",
  "meaning": "은혜",
  "sound": "혜"
 },
 {
  "character": "案",
  "meaning": "책상,생각",
  "sound": "안"
 },
 {
  "character": "傳",
  "meaning": "전할",
  "sound": "전"
 },
 {
  "character": "察",
  "meaning": "살필",
  "sound": "찰"
 },
 {
  "character": "好",
  "meaning": "좋을",
  "sound": "호"
 },
 {
  "character": "暗",
  "meaning": "어두울",
  "sound": "암"
 },
 {
  "character": "切",
  "meaning": "끊을,간절할",
  "sound": "절"
 },
 {
  "character": "唱",
  "meaning": "부를",
  "sound": "창"
 },
 {
  "character": "湖",
  "meaning": "호수",
  "sound": "호"
 },
 {
  "character": "約",
  "meaning": "맺을",
  "sound": "약"
 },
 {
  "character": "節",
  "meaning": "마디",
  "sound": "절"
 },
 {
  "character": "處",
  "meaning": "곳, 살",
  "sound": "처"
 },
 {
  "character": "患",
  "meaning": "근심",
  "sound": "환"
 },
 {
  "character": "養",
  "meaning": "기를",
  "sound": "양"
 },
 {
  "character": "店",
  "meaning": "가게",
  "sound": "점"
 },
 {
  "character": "鐵",
  "meaning": "쇠",
  "sound": "철"
 },
 {
  "character": "回",
  "meaning": "돌",
  "sound": "회"
 },
 {
  "character": "餘",
  "meaning": "남을",
  "sound": "여"
 },
 {
  "character": "情",
  "meaning": "뜻",
  "sound": "정"
 },
 {
  "character": "最",
  "meaning": "가장",
  "sound": "최"
 },
 {
  "character": "效",
  "meaning": "본받을",
  "sound": "효"
 },
 {
  "character": "熱",
  "meaning": "더울",
  "sound": "열"
 },
 {
  "character": "停",
  "meaning": "머무를",
  "sound": "정"
 },
 {
  "character": "祝",
  "meaning": "빌",
  "sound": "축"
 },
 {
  "character": "葉",
  "meaning": "잎",
  "sound": "엽"
 },
 {
  "character": "精",
  "meaning": "정기",
  "sound": "정"
 },
 {
  "character": "蟲",
  "meaning": "벌레",
  "sound": "충"
 },
 {
  "character": "藝",
  "meaning": "재주",
  "sound": "예"
 },
 {
  "character": "政",
  "meaning": "정사",
  "sound": "정"
 },
 {
  "character": "忠",
  "meaning": "충성",
  "sound": "충"
 },
 {
  "character": "屋",
  "meaning": "집",
  "sound": "옥"
 },
 {
  "character": "祭",
  "meaning": "제사",
  "sound": "제"
 },
 {
  "character": "致",
  "meaning": "이를",
  "sound": "치"
 },
 {
  "character": "完",
  "meaning": "완전할",
  "sound": "완"
 },
 {
  "character": "調",
  "meaning": "고를",
  "sound": "조"
 },
 {
  "character": "齒",
  "meaning": "이",
  "sound": "치"
 },
 {
  "character": "往",
  "meaning": "갈",
  "sound": "왕"
 },
 {
  "character": "助",
  "meaning": "도울",
  "sound": "조"
 },
 {
  "character": "則",
  "meaning": "법칙",
  "sound": "칙"
 },
 {
  "character": "曜",
  "meaning": "빛날",
  "sound": "요"
 },
 {
  "character": "鳥",
  "meaning": "새",
  "sound": "조"
 },
 {
  "character": "他",
  "meaning": "다를",
  "sound": "타"
 },
 {
  "character": "浴",
  "meaning": "목욕할",
  "sound": "욕"
 },
 {
  "character": "早",
  "meaning": "이를",
  "sound": "조"
 },
 {
  "character": "打",
  "meaning": "칠",
  "sound": "타"
 },
 {
  "character": "雨",
  "meaning": "비",
  "sound": "우"
 },
 {
  "character": "操",
  "meaning": "잡을",
  "sound": "조"
 },
 {
  "character": "卓",
  "meaning": "높을",
  "sound": "탁"
 },
 {
  "character": "雄",
  "meaning": "수컷",
  "sound": "웅"
 },
 {
  "character": "存",
  "meaning": "있을",
  "sound": "존"
 },
 {
  "character": "炭",
  "meaning": "숯",
  "sound": "탄"
 },
 {
  "character": "願",
  "meaning": "원할",
  "sound": "원"
 },
 {
  "character": "終",
  "meaning": "마칠",
  "sound": "종"
 },
 {
  "character": "宅",
  "meaning": "집",
  "sound": "택"
 },
 {
  "character": "偉",
  "meaning": "클",
  "sound": "위"
 },
 {
  "character": "種",
  "meaning": "씨",
  "sound": "종"
 },
 {
  "character": "統",
  "meaning": "거느릴",
  "sound": "통"
 },
 {
  "character": "爲",
  "meaning": "할",
  "sound": "위"
 },
 {
  "character": "坐",
  "meaning": "앉을",
  "sound": "좌"
 },
 {
  "character": "退",
  "meaning": "물러날",
  "sound": "퇴"
 },
 {
  "character": "恩",
  "meaning": "은혜",
  "sound": "은"
 },
 {
  "character": "罪",
  "meaning": "허물",
  "sound": "죄"
 },
 {
  "character": "波",
  "meaning": "물결",
  "sound": "파"
 },
 {
  "character": "義",
  "meaning": "옳을",
  "sound": "의"
 },
 {
  "character": "週",
  "meaning": "주일,돌",
  "sound": "주"
 },
 {
  "character": "板",
  "meaning": "널빤지",
  "sound": "판"
 },
 {
  "character": "移",
  "meaning": "옮길",
  "sound": "이"
 },
 {
  "character": "增",
  "meaning": "더할",
  "sound": "증"
 },
 {
  "character": "敗",
  "meaning": "패할",
  "sound": "패"
 },
 {
  "character": "街",
  "meaning": "거리",
  "sound": "가"
 },
 {
  "character": "谷",
  "meaning": "골",
  "sound": "곡"
 },
 {
  "character": "豆",
  "meaning": "콩",
  "sound": "두"
 },
 {
  "character": "罰",
  "meaning": "벌할",
  "sound": "벌"
 },
 {
  "character": "假",
  "meaning": "거짓",
  "sound": "가"
 },
 {
  "character": "官",
  "meaning": "벼슬",
  "sound": "관"
 },
 {
  "character": "得",
  "meaning": "얻을",
  "sound": "득"
 },
 {
  "character": "伐",
  "meaning": "칠",
  "sound": "벌"
 },
 {
  "character": "佳",
  "meaning": "아름다울",
  "sound": "가"
 },
 {
  "character": "究",
  "meaning": "궁구할",
  "sound": "구"
 },
 {
  "character": "燈",
  "meaning": "등잔",
  "sound": "등"
 },
 {
  "character": "丙",
  "meaning": "남녘",
  "sound": "병"
 },
 {
  "character": "干",
  "meaning": "방패",
  "sound": "간"
 },
 {
  "character": "句",
  "meaning": "글귀",
  "sound": "구"
 },
 {
  "character": "略",
  "meaning": "간략할",
  "sound": "략"
 },
 {
  "character": "寶",
  "meaning": "보배",
  "sound": "보"
 },
 {
  "character": "看",
  "meaning": "볼",
  "sound": "간"
 },
 {
  "character": "群",
  "meaning": "무리",
  "sound": "군"
 },
 {
  "character": "連",
  "meaning": "이을",
  "sound": "련"
 },
 {
  "character": "保",
  "meaning": "지킬",
  "sound": "보"
 },
 {
  "character": "甲",
  "meaning": "껍질,갑옷",
  "sound": "갑"
 },
 {
  "character": "弓",
  "meaning": "활",
  "sound": "궁"
 },
 {
  "character": "烈",
  "meaning": "매울,뜨거울",
  "sound": "렬"
 },
 {
  "character": "伏",
  "meaning": "엎드릴",
  "sound": "복"
 },
 {
  "character": "降",
  "meaning": "내릴",
  "sound": "강"
 },
 {
  "character": "權",
  "meaning": "권세",
  "sound": "권"
 },
 {
  "character": "列",
  "meaning": "벌일",
  "sound": "렬"
 },
 {
  "character": "復",
  "meaning": "돌아올",
  "sound": "복"
 },
 {
  "character": "講",
  "meaning": "익힐",
  "sound": "강"
 },
 {
  "character": "歸",
  "meaning": "돌아갈",
  "sound": "귀"
 },
 {
  "character": "錄",
  "meaning": "기록할",
  "sound": "록"
 },
 {
  "character": "否",
  "meaning": "아닐",
  "sound": "부"
 },
 {
  "character": "康",
  "meaning": "편안할",
  "sound": "강"
 },
 {
  "character": "均",
  "meaning": "고를",
  "sound": "균"
 },
 {
  "character": "論",
  "meaning": "논할",
  "sound": "론"
 },
 {
  "character": "佛",
  "meaning": "부처",
  "sound": "불"
 },
 {
  "character": "更",
  "meaning": "다시",
  "sound": "갱"
 },
 {
  "character": "禁",
  "meaning": "금할",
  "sound": "금"
 },
 {
  "character": "倫",
  "meaning": "인륜",
  "sound": "륜"
 },
 {
  "character": "飛",
  "meaning": "날",
  "sound": "비"
 },
 {
  "character": "巨",
  "meaning": "클",
  "sound": "거"
 },
 {
  "character": "及",
  "meaning": "미칠",
  "sound": "급"
 },
 {
  "character": "莫",
  "meaning": "없을",
  "sound": "막"
 },
 {
  "character": "悲",
  "meaning": "슬플",
  "sound": "비"
 },
 {
  "character": "檢",
  "meaning": "검사할",
  "sound": "검"
 },
 {
  "character": "起",
  "meaning": "일어날",
  "sound": "기"
 },
 {
  "character": "滿",
  "meaning": "찰",
  "sound": "만"
 },
 {
  "character": "非",
  "meaning": "아닐",
  "sound": "비"
 },
 {
  "character": "儉",
  "meaning": "검소할",
  "sound": "검"
 },
 {
  "character": "暖",
  "meaning": "따뜻할",
  "sound": "난"
 },
 {
  "character": "忘",
  "meaning": "잊을",
  "sound": "망"
 },
 {
  "character": "巳",
  "meaning": "뱀,지지",
  "sound": "사"
 },
 {
  "character": "潔",
  "meaning": "깨끗할",
  "sound": "결"
 },
 {
  "character": "難",
  "meaning": "어려울",
  "sound": "난"
 },
 {
  "character": "妙",
  "meaning": "묘할",
  "sound": "묘"
 },
 {
  "character": "絲",
  "meaning": "실",
  "sound": "사"
 },
 {
  "character": "警",
  "meaning": "경계할",
  "sound": "경"
 },
 {
  "character": "納",
  "meaning": "들일",
  "sound": "납"
 },
 {
  "character": "卯",
  "meaning": "토끼",
  "sound": "묘"
 },
 {
  "character": "寺",
  "meaning": "절",
  "sound": "사"
 },
 {
  "character": "慶",
  "meaning": "경사",
  "sound": "경"
 },
 {
  "character": "乃",
  "meaning": "이에",
  "sound": "내"
 },
 {
  "character": "戊",
  "meaning": "천간,별",
  "sound": "무"
 },
 {
  "character": "舍",
  "meaning": "집",
  "sound": "사"
 },
 {
  "character": "耕",
  "meaning": "밭갈",
  "sound": "경"
 },
 {
  "character": "怒",
  "meaning": "성낼",
  "sound": "노"
 },
 {
  "character": "務",
  "meaning": "힘쓸",
  "sound": "무"
 },
 {
  "character": "散",
  "meaning": "흩어질",
  "sound": "산"
 },
 {
  "character": "境",
  "meaning": "지경",
  "sound": "경"
 },
 {
  "character": "努",
  "meaning": "힘쓸",
  "sound": "노"
 },
 {
  "character": "尾",
  "meaning": "꼬리",
  "sound": "미"
 },
 {
  "character": "殺",
  "meaning": "죽일",
  "sound": "살"
 },
 {
  "character": "經",
  "meaning": "지날,글",
  "sound": "경"
 },
 {
  "character": "斷",
  "meaning": "끊을",
  "sound": "단"
 },
 {
  "character": "密",
  "meaning": "빽빽할",
  "sound": "밀"
 },
 {
  "character": "狀",
  "meaning": "모양",
  "sound": "상"
 },
 {
  "character": "庚",
  "meaning": "천간,별",
  "sound": "경"
 },
 {
  "character": "丹",
  "meaning": "붉을",
  "sound": "단"
 },
 {
  "character": "飯",
  "meaning": "밥",
  "sound": "반"
 },
 {
  "character": "想",
  "meaning": "생각",
  "sound": "상"
 },
 {
  "character": "戒",
  "meaning": "경계할",
  "sound": "계"
 },
 {
  "character": "單",
  "meaning": "홑",
  "sound": "단"
 },
 {
  "character": "防",
  "meaning": "막을",
  "sound": "방"
 },
 {
  "character": "床",
  "meaning": "평상",
  "sound": "상"
 },
 {
  "character": "溪",
  "meaning": "시내",
  "sound": "계"
 },
 {
  "character": "達",
  "meaning": "통달할",
  "sound": "달"
 },
 {
  "character": "房",
  "meaning": "방",
  "sound": "방"
 },
 {
  "character": "舌",
  "meaning": "혀",
  "sound": "설"
 },
 {
  "character": "繼",
  "meaning": "이을",
  "sound": "계"
 },
 {
  "character": "隊",
  "meaning": "무리",
  "sound": "대"
 },
 {
  "character": "訪",
  "meaning": "찾을",
  "sound": "방"
 },
 {
  "character": "細",
  "meaning": "가늘",
  "sound": "세"
 },
 {
  "character": "癸",
  "meaning": "천간,북방",
  "sound": "계"
 },
 {
  "character": "徒",
  "meaning": "무리",
  "sound": "도"
 },
 {
  "character": "背",
  "meaning": "등",
  "sound": "배"
 },
 {
  "character": "稅",
  "meaning": "세금",
  "sound": "세"
 },
 {
  "character": "庫",
  "meaning": "곳집",
  "sound": "고"
 },
 {
  "character": "斗",
  "meaning": "말",
  "sound": "두"
 },
 {
  "character": "拜",
  "meaning": "절",
  "sound": "배"
 },
 {
  "character": "掃",
  "meaning": "쓸",
  "sound": "소"
 },
 {
  "character": "笑",
  "meaning": "웃음",
  "sound": "소"
 },
 {
  "character": "危",
  "meaning": "위태할",
  "sound": "위"
 },
 {
  "character": "造",
  "meaning": "지을",
  "sound": "조"
 },
 {
  "character": "亥",
  "meaning": "돼지",
  "sound": "해"
 },
 {
  "character": "素",
  "meaning": "흴,본디",
  "sound": "소"
 },
 {
  "character": "遺",
  "meaning": "남길",
  "sound": "유"
 },
 {
  "character": "尊",
  "meaning": "높을",
  "sound": "존"
 },
 {
  "character": "解",
  "meaning": "풀",
  "sound": "해"
 },
 {
  "character": "續",
  "meaning": "이을",
  "sound": "속"
 },
 {
  "character": "酉",
  "meaning": "닭,지지",
  "sound": "유"
 },
 {
  "character": "宗",
  "meaning": "마루",
  "sound": "종"
 },
 {
  "character": "鄕",
  "meaning": "시골,마을",
  "sound": "향"
 },
 {
  "character": "俗",
  "meaning": "풍속",
  "sound": "속"
 },
 {
  "character": "乳",
  "meaning": "젖",
  "sound": "유"
 },
 {
  "character": "走",
  "meaning": "달릴",
  "sound": "주"
 },
 {
  "character": "虛",
  "meaning": "빌",
  "sound": "허"
 },
 {
  "character": "松",
  "meaning": "소나무",
  "sound": "송"
 },
 {
  "character": "乙",
  "meaning": "새",
  "sound": "을"
 },
 {
  "character": "朱",
  "meaning": "붉을",
  "sound": "주"
 },
 {
  "character": "驗",
  "meaning": "시험",
  "sound": "험"
 },
 {
  "character": "收",
  "meaning": "거둘",
  "sound": "수"
 },
 {
  "character": "陰",
  "meaning": "그늘",
  "sound": "음"
 },
 {
  "character": "衆",
  "meaning": "무리",
  "sound": "중"
 },
 {
  "character": "賢",
  "meaning": "어질",
  "sound": "현"
 },
 {
  "character": "愁",
  "meaning": "근심",
  "sound": "수"
 },
 {
  "character": "應",
  "meaning": "응할",
  "sound": "응"
 },
 {
  "character": "持",
  "meaning": "가질",
  "sound": "지"
 },
 {
  "character": "呼",
  "meaning": "부를",
  "sound": "호"
 },
 {
  "character": "修",
  "meaning": "닦을",
  "sound": "수"
 },
 {
  "character": "依",
  "meaning": "의지할",
  "sound": "의"
 },
 {
  "character": "指",
  "meaning": "손가락",
  "sound": "지"
 },
 {
  "character": "戶",
  "meaning": "지게문",
  "sound": "호"
 },
 {
  "character": "受",
  "meaning": "받을",
  "sound": "수"
 },
 {
  "character": "異",
  "meaning": "다를",
  "sound": "이"
 },
 {
  "character": "職",
  "meaning": "벼슬,직분",
  "sound": "직"
 },
 {
  "character": "貨",
  "meaning": "재화",
  "sound": "화"
 },
 {
  "character": "純",
  "meaning": "순수할",
  "sound": "순"
 },
 {
  "character": "貳",
  "meaning": "두",
  "sound": "이"
 },
 {
  "character": "辰",
  "meaning": "별,지지",
  "sound": "진"
 },
 {
  "character": "候",
  "meaning": "기후",
  "sound": "후"
 },
 {
  "character": "戌",
  "meaning": "개,지지",
  "sound": "술"
 },
 {
  "character": "益",
  "meaning": "더할",
  "sound": "익"
 },
 {
  "character": "創",
  "meaning": "비롯할",
  "sound": "창"
 },
 {
  "character": "吸",
  "meaning": "숨들이쉴",
  "sound": "흡"
 },
 {
  "character": "拾",
  "meaning": "주울",
  "sound": "습"
 },
 {
  "character": "引",
  "meaning": "끌",
  "sound": "인"
 },
 {
  "character": "冊",
  "meaning": "책",
  "sound": "책"
 },
 {
  "character": "興",
  "meaning": "일어날",
  "sound": "흥"
 },
 {
  "character": "承",
  "meaning": "이을",
  "sound": "승"
 },
 {
  "character": "印",
  "meaning": "도장",
  "sound": "인"
 },
 {
  "character": "聽",
  "meaning": "들을",
  "sound": "청"
 },
 {
  "character": "希",
  "meaning": "바랄",
  "sound": "희"
 },
 {
  "character": "息",
  "meaning": "숨쉴",
  "sound": "식"
 },
 {
  "character": "寅",
  "meaning": "범",
  "sound": "인"
 },
 {
  "character": "請",
  "meaning": "청할",
  "sound": "청"
 },
 {
  "character": "辛",
  "meaning": "매울",
  "sound": "신"
 },
 {
  "character": "認",
  "meaning": "알",
  "sound": "인"
 },
 {
  "character": "丑",
  "meaning": "소",
  "sound": "축"
 },
 {
  "character": "申",
  "meaning": "펼,지지",
  "sound": "신"
 },
 {
  "character": "壹",
  "meaning": "한",
  "sound": "일"
 },
 {
  "character": "取",
  "meaning": "가질",
  "sound": "취"
 },
 {
  "character": "若",
  "meaning": "같을,만약",
  "sound": "약"
 },
 {
  "character": "壬",
  "meaning": "천간,북방",
  "sound": "임"
 },
 {
  "character": "治",
  "meaning": "다스릴",
  "sound": "치"
 },
 {
  "character": "與",
  "meaning": "더불,줄",
  "sound": "여"
 },
 {
  "character": "壯",
  "meaning": "씩씩할",
  "sound": "장"
 },
 {
  "character": "針",
  "meaning": "바늘,침",
  "sound": "침"
 },
 {
  "character": "逆",
  "meaning": "거스를",
  "sound": "역"
 },
 {
  "character": "適",
  "meaning": "맞을",
  "sound": "적"
 },
 {
  "character": "快",
  "meaning": "쾌할",
  "sound": "쾌"
 },
 {
  "character": "硏",
  "meaning": "갈",
  "sound": "연"
 },
 {
  "character": "專",
  "meaning": "오로지",
  "sound": "전"
 },
 {
  "character": "脫",
  "meaning": "벗을",
  "sound": "탈"
 },
 {
  "character": "煙",
  "meaning": "연기",
  "sound": "연"
 },
 {
  "character": "絶",
  "meaning": "끊을",
  "sound": "절"
 },
 {
  "character": "探",
  "meaning": "찾을",
  "sound": "탐"
 },
 {
  "character": "營",
  "meaning": "경영할",
  "sound": "영"
 },
 {
  "character": "點",
  "meaning": "점",
  "sound": "점"
 },
 {
  "character": "討",
  "meaning": "칠",
  "sound": "토"
 },
 {
  "character": "榮",
  "meaning": "영화",
  "sound": "영"
 },
 {
  "character": "接",
  "meaning": "이을",
  "sound": "접"
 },
 {
  "character": "破",
  "meaning": "깨뜨릴",
  "sound": "파"
 },
 {
  "character": "誤",
  "meaning": "그릇될",
  "sound": "오"
 },
 {
  "character": "井",
  "meaning": "우물",
  "sound": "정"
 },
 {
  "character": "判",
  "meaning": "판단할",
  "sound": "판"
 },
 {
  "character": "謠",
  "meaning": "노래",
  "sound": "요"
 },
 {
  "character": "丁",
  "meaning": "장정,천간",
  "sound": "정"
 },
 {
  "character": "片",
  "meaning": "조각",
  "sound": "편"
 },
 {
  "character": "容",
  "meaning": "얼굴",
  "sound": "용"
 },
 {
  "character": "除",
  "meaning": "덜",
  "sound": "제"
 },
 {
  "character": "布",
  "meaning": "베,펼",
  "sound": "포"
 },
 {
  "character": "遇",
  "meaning": "만날",
  "sound": "우"
 },
 {
  "character": "制",
  "meaning": "마를,법도",
  "sound": "제"
 },
 {
  "character": "暴",
  "meaning": "사나울",
  "sound": "포"
 },
 {
  "character": "圓",
  "meaning": "둥글",
  "sound": "원"
 },
 {
  "character": "製",
  "meaning": "지을",
  "sound": "제"
 },
 {
  "character": "包",
  "meaning": "쌀",
  "sound": "포"
 },
 {
  "character": "員",
  "meaning": "인원",
  "sound": "원"
 },
 {
  "character": "兆",
  "meaning": "조",
  "sound": "조"
 },
 {
  "character": "票",
  "meaning": "표,쪽지",
  "sound": "표"
 },
 {
  "character": "脚",
  "meaning": "다리",
  "sound": "각"
 },
 {
  "character": "浪",
  "meaning": "물결",
  "sound": "랑"
 },
 {
  "character": "朋",
  "meaning": "벗",
  "sound": "붕"
 },
 {
  "character": "甚",
  "meaning": "심할",
  "sound": "심"
 },
 {
  "character": "渴",
  "meaning": "목마를",
  "sound": "갈"
 },
 {
  "character": "郞",
  "meaning": "사내",
  "sound": "랑"
 },
 {
  "character": "秘",
  "meaning": "숨길",
  "sound": "비"
 },
 {
  "character": "我",
  "meaning": "나",
  "sound": "아"
 },
 {
  "character": "敢",
  "meaning": "감히",
  "sound": "감"
 },
 {
  "character": "涼",
  "meaning": "서늘할",
  "sound": "량"
 },
 {
  "character": "私",
  "meaning": "사사로울",
  "sound": "사"
 },
 {
  "character": "顔",
  "meaning": "얼굴",
  "sound": "안"
 },
 {
  "character": "皆",
  "meaning": "다",
  "sound": "개"
 },
 {
  "character": "露",
  "meaning": "이슬",
  "sound": "로"
 },
 {
  "character": "射",
  "meaning": "쏠",
  "sound": "사"
 },
 {
  "character": "巖",
  "meaning": "바위",
  "sound": "암"
 },
 {
  "character": "居",
  "meaning": "살",
  "sound": "거"
 },
 {
  "character": "留",
  "meaning": "머무를",
  "sound": "류"
 },
 {
  "character": "傷",
  "meaning": "상할",
  "sound": "상"
 },
 {
  "character": "仰",
  "meaning": "우러를",
  "sound": "앙"
 },
 {
  "character": "乾",
  "meaning": "하늘",
  "sound": "건"
 },
 {
  "character": "柳",
  "meaning": "버들",
  "sound": "류"
 },
 {
  "character": "霜",
  "meaning": "서리",
  "sound": "상"
 },
 {
  "character": "哀",
  "meaning": "슬플",
  "sound": "애"
 },
 {
  "character": "堅",
  "meaning": "굳을",
  "sound": "견"
 },
 {
  "character": "晩",
  "meaning": "늦을",
  "sound": "만"
 },
 {
  "character": "尙",
  "meaning": "오히려,높을",
  "sound": "상"
 },
 {
  "character": "也",
  "meaning": "어조사",
  "sound": "야"
 },
 {
  "character": "鏡",
  "meaning": "거울",
  "sound": "경"
 },
 {
  "character": "忙",
  "meaning": "바쁠",
  "sound": "망"
 },
 {
  "character": "喪",
  "meaning": "초상,잃을",
  "sound": "상"
 },
 {
  "character": "揚",
  "meaning": "떨칠",
  "sound": "양"
 },
 {
  "character": "驚",
  "meaning": "놀랄",
  "sound": "경"
 },
 {
  "character": "麥",
  "meaning": "보리",
  "sound": "맥"
 },
 {
  "character": "象",
  "meaning": "코끼리",
  "sound": "상"
 },
 {
  "character": "讓",
  "meaning": "사양할",
  "sound": "양"
 },
 {
  "character": "鷄",
  "meaning": "닭",
  "sound": "계"
 },
 {
  "character": "免",
  "meaning": "면할",
  "sound": "면"
 },
 {
  "character": "暑",
  "meaning": "더울",
  "sound": "서"
 },
 {
  "character": "於",
  "meaning": "어조사",
  "sound": "어"
 },
 {
  "character": "階",
  "meaning": "섬돌",
  "sound": "계"
 },
 {
  "character": "眠",
  "meaning": "잠잘",
  "sound": "면"
 },
 {
  "character": "惜",
  "meaning": "아낄",
  "sound": "석"
 },
 {
  "character": "憶",
  "meaning": "생각할",
  "sound": "억"
 },
 {
  "character": "孤",
  "meaning": "외로울",
  "sound": "고"
 },
 {
  "character": "勉",
  "meaning": "힘쓸",
  "sound": "면"
 },
 {
  "character": "昔",
  "meaning": "옛",
  "sound": "석"
 },
 {
  "character": "嚴",
  "meaning": "엄할",
  "sound": "엄"
 },
 {
  "character": "穀",
  "meaning": "곡식",
  "sound": "곡"
 },
 {
  "character": "鳴",
  "meaning": "울",
  "sound": "명"
 },
 {
  "character": "設",
  "meaning": "베풀",
  "sound": "설"
 },
 {
  "character": "余",
  "meaning": "나",
  "sound": "여"
 },
 {
  "character": "困",
  "meaning": "곤할",
  "sound": "곤"
 },
 {
  "character": "暮",
  "meaning": "저물",
  "sound": "모"
 },
 {
  "character": "損",
  "meaning": "덜",
  "sound": "손"
 },
 {
  "character": "汝",
  "meaning": "너",
  "sound": "여"
 },
 {
  "character": "坤",
  "meaning": "땅",
  "sound": "곤"
 },
 {
  "character": "墓",
  "meaning": "무덤",
  "sound": "묘"
 },
 {
  "character": "誰",
  "meaning": "누구",
  "sound": "수"
 },
 {
  "character": "亦",
  "meaning": "또",
  "sound": "역"
 },
 {
  "character": "窮",
  "meaning": "다할",
  "sound": "궁"
 },
 {
  "character": "茂",
  "meaning": "무성할",
  "sound": "무"
 },
 {
  "character": "須",
  "meaning": "모름지기",
  "sound": "수"
 },
 {
  "character": "域",
  "meaning": "지경",
  "sound": "역"
 },
 {
  "character": "勸",
  "meaning": "권할",
  "sound": "권"
 },
 {
  "character": "舞",
  "meaning": "춤출",
  "sound": "무"
 },
 {
  "character": "壽",
  "meaning": "목숨",
  "sound": "수"
 },
 {
  "character": "硯",
  "meaning": "벼루",
  "sound": "연"
 },
 {
  "character": "卷",
  "meaning": "책",
  "sound": "권"
 },
 {
  "character": "墨",
  "meaning": "먹",
  "sound": "묵"
 },
 {
  "character": "雖",
  "meaning": "비록",
  "sound": "수"
 },
 {
  "character": "悅",
  "meaning": "기쁠",
  "sound": "열"
 },
 {
  "character": "勤",
  "meaning": "부지런할",
  "sound": "근"
 },
 {
  "character": "勿",
  "meaning": "말",
  "sound": "물"
 },
 {
  "character": "秀",
  "meaning": "빼어날",
  "sound": "수"
 },
 {
  "character": "炎",
  "meaning": "불꽃",
  "sound": "염"
 },
 {
  "character": "幾",
  "meaning": "몇",
  "sound": "기"
 },
 {
  "character": "杯",
  "meaning": "잔",
  "sound": "배"
 },
 {
  "character": "淑",
  "meaning": "맑을",
  "sound": "숙"
 },
 {
  "character": "迎",
  "meaning": "맞이할",
  "sound": "영"
 },
 {
  "character": "旣",
  "meaning": "이미",
  "sound": "기"
 },
 {
  "character": "凡",
  "meaning": "무릇",
  "sound": "범"
 },
 {
  "character": "叔",
  "meaning": "아재비",
  "sound": "숙"
 },
 {
  "character": "烏",
  "meaning": "까마귀",
  "sound": "오"
 },
 {
  "character": "但",
  "meaning": "다만",
  "sound": "단"
 },
 {
  "character": "犯",
  "meaning": "범할",
  "sound": "범"
 },
 {
  "character": "崇",
  "meaning": "높일",
  "sound": "숭"
 },
 {
  "character": "悟",
  "meaning": "깨달을",
  "sound": "오"
 },
 {
  "character": "段",
  "meaning": "층계,조각",
  "sound": "단"
 },
 {
  "character": "逢",
  "meaning": "만날",
  "sound": "봉"
 },
 {
  "character": "乘",
  "meaning": "탈",
  "sound": "승"
 },
 {
  "character": "吾",
  "meaning": "나",
  "sound": "오"
 },
 {
  "character": "卵",
  "meaning": "알",
  "sound": "란"
 },
 {
  "character": "扶",
  "meaning": "도울",
  "sound": "부"
 },
 {
  "character": "施",
  "meaning": "베풀",
  "sound": "시"
 },
 {
  "character": "瓦",
  "meaning": "기와",
  "sound": "와"
 },
 {
  "character": "覽",
  "meaning": "볼",
  "sound": "람"
 },
 {
  "character": "浮",
  "meaning": "뜰",
  "sound": "부"
 },
 {
  "character": "深",
  "meaning": "깊을",
  "sound": "심"
 },
 {
  "character": "臥",
  "meaning": "누울",
  "sound": "와"
 },
 {
  "character": "曰",
  "meaning": "가로",
  "sound": "왈"
 },
 {
  "character": "哉",
  "meaning": "어조사",
  "sound": "재"
 },
 {
  "character": "採",
  "meaning": "캘",
  "sound": "채"
 },
 {
  "character": "刑",
  "meaning": "형벌",
  "sound": "형"
 },
 {
  "character": "欲",
  "meaning": "하고자할",
  "sound": "욕"
 },
 {
  "character": "著",
  "meaning": "나타날",
  "sound": "저"
 },
 {
  "character": "妻",
  "meaning": "아내",
  "sound": "처"
 },
 {
  "character": "虎",
  "meaning": "범",
  "sound": "호"
 },
 {
  "character": "憂",
  "meaning": "근심",
  "sound": "우"
 },
 {
  "character": "積",
  "meaning": "쌓을",
  "sound": "적"
 },
 {
  "character": "尺",
  "meaning": "자",
  "sound": "척"
 },
 {
  "character": "乎",
  "meaning": "어조사",
  "sound": "호"
 },
 {
  "character": "尤",
  "meaning": "더욱",
  "sound": "우"
 },
 {
  "character": "轉",
  "meaning": "구를",
  "sound": "전"
 },
 {
  "character": "泉",
  "meaning": "샘",
  "sound": "천"
 },
 {
  "character": "或",
  "meaning": "혹",
  "sound": "혹"
 },
 {
  "character": "又",
  "meaning": "또",
  "sound": "우"
 },
 {
  "character": "錢",
  "meaning": "돈",
  "sound": "전"
 },
 {
  "character": "淺",
  "meaning": "얕을",
  "sound": "천"
 },
 {
  "character": "混",
  "meaning": "섞을",
  "sound": "혼"
 },
 {
  "character": "于",
  "meaning": "어조사",
  "sound": "우"
 },
 {
  "character": "靜",
  "meaning": "고요할",
  "sound": "정"
 },
 {
  "character": "晴",
  "meaning": "갤",
  "sound": "청"
 },
 {
  "character": "婚",
  "meaning": "혼인할",
  "sound": "혼"
 },
 {
  "character": "宇",
  "meaning": "집",
  "sound": "우"
 },
 {
  "character": "貞",
  "meaning": "곧을",
  "sound": "정"
 },
 {
  "character": "招",
  "meaning": "부를",
  "sound": "초"
 },
 {
  "character": "紅",
  "meaning": "붉을",
  "sound": "홍"
 },
 {
  "character": "云",
  "meaning": "이를",
  "sound": "운"
 },
 {
  "character": "淨",
  "meaning": "깨끗할",
  "sound": "정"
 },
 {
  "character": "推",
  "meaning": "가릴",
  "sound": "추"
 },
 {
  "character": "華",
  "meaning": "빛날",
  "sound": "화"
 },
 {
  "character": "源",
  "meaning": "근원",
  "sound": "원"
 },
 {
  "character": "頂",
  "meaning": "정수리,꼭대기",
  "sound": "정"
 },
 {
  "character": "追",
  "meaning": "쫓을",
  "sound": "추"
 },
 {
  "character": "歡",
  "meaning": "기쁠",
  "sound": "환"
 },
 {
  "character": "怨",
  "meaning": "원망할",
  "sound": "원"
 },
 {
  "character": "諸",
  "meaning": "모든",
  "sound": "제"
 },
 {
  "character": "就",
  "meaning": "나아갈",
  "sound": "취"
 },
 {
  "character": "皇",
  "meaning": "임금",
  "sound": "황"
 },
 {
  "character": "威",
  "meaning": "위엄",
  "sound": "위"
 },
 {
  "character": "帝",
  "meaning": "임금",
  "sound": "제"
 },
 {
  "character": "吹",
  "meaning": "불",
  "sound": "취"
 },
 {
  "character": "厚",
  "meaning": "두터울",
  "sound": "후"
 },
 {
  "character": "猶",
  "meaning": "같을,오히려",
  "sound": "유"
 },
 {
  "character": "鐘",
  "meaning": "쇠북",
  "sound": "종"
 },
 {
  "character": "層",
  "meaning": "층",
  "sound": "층"
 },
 {
  "character": "胸",
  "meaning": "가슴",
  "sound": "흉"
 },
 {
  "character": "遊",
  "meaning": "놀",
  "sound": "유"
 },
 {
  "character": "從",
  "meaning": "좇을",
  "sound": "종"
 },
 {
  "character": "泰",
  "meaning": "클",
  "sound": "태"
 },
 {
  "character": "喜",
  "meaning": "기쁠",
  "sound": "희"
 },
 {
  "character": "柔",
  "meaning": "부드러울",
  "sound": "유"
 },
 {
  "character": "酒",
  "meaning": "술",
  "sound": "주"
 },
 {
  "character": "痛",
  "meaning": "아플",
  "sound": "통"
 },
 {
  "character": "儒",
  "meaning": "선비",
  "sound": "유"
 },
 {
  "character": "宙",
  "meaning": "집",
  "sound": "주"
 },
 {
  "character": "投",
  "meaning": "던질",
  "sound": "투"
 },
 {
  "character": "幼",
  "meaning": "어릴",
  "sound": "유"
 },
 {
  "character": "卽",
  "meaning": "곧",
  "sound": "즉"
 },
 {
  "character": "篇",
  "meaning": "책",
  "sound": "편"
 },
 {
  "character": "唯",
  "meaning": "오직,허락할",
  "sound": "유"
 },
 {
  "character": "曾",
  "meaning": "일찍",
  "sound": "증"
 },
 {
  "character": "閉",
  "meaning": "닫을",
  "sound": "폐"
 },
 {
  "character": "吟",
  "meaning": "읊을",
  "sound": "음"
 },
 {
  "character": "證",
  "meaning": "증거",
  "sound": "증"
 },
 {
  "character": "抱",
  "meaning": "안을",
  "sound": "포"
 },
 {
  "character": "泣",
  "meaning": "울",
  "sound": "읍"
 },
 {
  "character": "枝",
  "meaning": "가지",
  "sound": "지"
 },
 {
  "character": "楓",
  "meaning": "단풍나무",
  "sound": "풍"
 },
 {
  "character": "矣",
  "meaning": "어조사",
  "sound": "의"
 },
 {
  "character": "之",
  "meaning": "갈",
  "sound": "지"
 },
 {
  "character": "豊",
  "meaning": "풍년",
  "sound": "풍"
 },
 {
  "character": "議",
  "meaning": "의논할",
  "sound": "의"
 },
 {
  "character": "只",
  "meaning": "다만",
  "sound": "지"
 },
 {
  "character": "皮",
  "meaning": "가죽",
  "sound": "피"
 },
 {
  "character": "而",
  "meaning": "말이을",
  "sound": "이"
 },
 {
  "character": "智",
  "meaning": "지혜",
  "sound": "지"
 },
 {
  "character": "彼",
  "meaning": "저",
  "sound": "피"
 },
 {
  "character": "易",
  "meaning": "쉬울",
  "sound": "이"
 },
 {
  "character": "盡",
  "meaning": "다할",
  "sound": "진"
 },
 {
  "character": "疲",
  "meaning": "피곤할",
  "sound": "피"
 },
 {
  "character": "已",
  "meaning": "이미",
  "sound": "이"
 },
 {
  "character": "執",
  "meaning": "잡을",
  "sound": "집"
 },
 {
  "character": "匹",
  "meaning": "짝",
  "sound": "필"
 },
 {
  "character": "仁",
  "meaning": "어질",
  "sound": "인"
 },
 {
  "character": "且",
  "meaning": "또",
  "sound": "차"
 },
 {
  "character": "何",
  "meaning": "어찌",
  "sound": "하"
 },
 {
  "character": "忍",
  "meaning": "참을",
  "sound": "인"
 },
 {
  "character": "借",
  "meaning": "빌릴",
  "sound": "차"
 },
 {
  "character": "賀",
  "meaning": "하례할",
  "sound": "하"
 },
 {
  "character": "慈",
  "meaning": "사랑",
  "sound": "자"
 },
 {
  "character": "此",
  "meaning": "이",
  "sound": "차"
 },
 {
  "character": "閑",
  "meaning": "한가할,문지방",
  "sound": "한"
 },
 {
  "character": "腸",
  "meaning": "창자",
  "sound": "장"
 },
 {
  "character": "昌",
  "meaning": "창성할",
  "sound": "창"
 },
 {
  "character": "恨",
  "meaning": "한할",
  "sound": "한"
 },
 {
  "character": "栽",
  "meaning": "심을",
  "sound": "재"
 },
 {
  "character": "菜",
  "meaning": "나물",
  "sound": "채"
 },
 {
  "character": "恒",
  "meaning": "항상",
  "sound": "항"
 }
];
const dictionary=[...additional.split(' ').map(x=>{const [character,meaning,sound]=x.split('|');return {character,meaning,sound}}),...upperDictionary];
return {source,levels,dictionary};
});
