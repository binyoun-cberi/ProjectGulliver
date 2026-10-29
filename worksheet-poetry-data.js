(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetPoetry=api;})(globalThis,()=>{
'use strict';
const poems=[
{id:'seosi',title:'서시',author:'윤동주',difficulty:'중상 · 추상적인 낱말과 띄어쓰기',source:'https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1948년)/서시&oldid=387685',edition:'1948년 초판 전사본 기준 · 학습용 표기',changes:'우르러→우러러, 한점→한 점, 죽어가는것을→죽어 가는 것을',stanzas:[['죽는 날까지 하늘을 우러러','한 점 부끄럼이 없기를,','잎새에 이는 바람에도','나는 괴로워했다.','별을 노래하는 마음으로','모든 죽어 가는 것을 사랑해야지','그리고 나한테 주어진 길을','걸어가야겠다.'],['오늘 밤에도 별이 바람에 스치운다.']]},
{id:'new-road',title:'새로운 길',author:'윤동주',difficulty:'중 · 계절 낱말과 반복 표현',source:'https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1948년)/새로운_길&oldid=387756',edition:'1948년 초판 전사본 기준 · 학습용 표기',changes:'문들레→민들레',stanzas:[['내를 건너서 숲으로','고개를 넘어서 마을로'],['어제도 가고 오늘도 갈','나의 길 새로운 길'],['민들레가 피고 까치가 날고','아가씨가 지나고 바람이 일고'],['나의 길은 언제나 새로운 길','오늘도…… 내일도……'],['내를 건너서 숲으로','고개를 넘어서 마을로']]},
{id:'azalea',title:'진달래꽃',author:'김소월',difficulty:'상 · 옛말과 문학적 표현',source:'https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/진달래꽃&oldid=430575',edition:'1925년 시집 원문 전사본 기준 · 학습용 표기',changes:'옛한글을 현대 한글로 옮기고 띄어쓰기를 다듬음. 고히→고이, 말업시→말없이, 거름거름→걸음걸음 등. 원문의 문장 부호 없음은 유지.',stanzas:[['나 보기가 역겨워','가실 때에는','말없이 고이 보내드리우리다'],['영변에 약산','진달래꽃','아름 따다 가실 길에 뿌리우리다'],['가시는 걸음걸음','놓인 그 꽃을','사뿐히 즈려밟고 가시옵소서'],['나 보기가 역겨워','가실 때에는','죽어도 아니 눈물 흘리우리다']]}
];
poems.push(...[
  {
    "id": "snow",
    "title": "눈",
    "author": "윤동주",
    "difficulty": "하 · 겨울 낱말과 짧은 행",
    "source": "https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1955년)/눈&oldid=178477",
    "edition": "1955년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "추워 한다고→추워한다고, 덮어주는→덮어 주는, 이불인가바→이불인가 봐, 겨을→겨울, 나리지→내리지. 소오복이는 시적 표현으로 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "지난밤에",
        "눈이 소오복이 왔네"
      ],
      [
        "지붕이랑",
        "길이랑 밭이랑",
        "추워한다고",
        "덮어 주는 이불인가 봐"
      ],
      [
        "그러기에",
        "추운 겨울에만 내리지"
      ]
    ]
  },
  {
    "id": "chimney",
    "title": "굴뚝",
    "author": "윤동주",
    "difficulty": "중상 · 시골 생활과 옛말",
    "source": "https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1955년)/굴뚝&oldid=178538",
    "edition": "1955년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "산골작이→산골짜기, 오막사리→오막살이, 웨인연기→웬 연기, 굽는게지→굽는 게지 등 현대 표기·띄어쓰기 적용. 몽기몽기·한 커리·내는 시어/옛말로 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "산골짜기 오막살이 낮은 굴뚝엔",
        "몽기몽기 웬 연기 대낮에 솟나,",
        "감자를 굽는 게지 총각 애들이",
        "깜박깜박 검은 눈이 모여 앉아서"
      ],
      [
        "입술에 꺼멓게 숯을 바르고",
        "옛이야기 한 커리에 감자 하나씩.",
        "산골짜기 오막살이 낮은 굴뚝엔",
        "살랑살랑 솟아나네 감자 굽는 내."
      ]
    ]
  },
  {
    "id": "sparrow",
    "title": "참새",
    "author": "윤동주",
    "difficulty": "중 · 흉내 내는 말과 받침",
    "source": "https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1955년)/참새&oldid=178478",
    "edition": "1955년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "가을지난→가을 지난, 하이얀종이→하이얀 종이, 받아읽으며→받아 읽으며, 두발→두 발, 하로종일→하루 종일, 짹자한자 밖에는→짹 자 한 자밖에는, 더못쓰는걸→더 못 쓰는걸. 하이얀·째액째액은 시적 표현 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "가을 지난 마당은 하이얀 종이",
        "참새들이 글씨를 공부하지요.",
        "째액째액 입으로 받아 읽으며",
        "두 발로는 글씨를 연습하지요."
      ],
      [
        "하루 종일 글씨를 공부하여도",
        "짹 자 한 자밖에는 더 못 쓰는걸."
      ]
    ]
  },
  {
    "id": "sunflower-face",
    "title": "해바라기 얼굴",
    "author": "윤동주",
    "difficulty": "하 · 가족과 해바라기 비유",
    "source": "https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1955년)/해바라기_얼굴&oldid=178469",
    "edition": "1955년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "낱말과 문장 부호를 유지함. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "누나의 얼굴은",
        "해바라기 얼굴",
        "해가 금방 뜨자",
        "일터에 간다."
      ],
      [
        "해바라기 얼굴은",
        "누나의 얼굴",
        "얼굴이 숙어들어",
        "집으로 온다."
      ]
    ]
  },
  {
    "id": "river-family",
    "title": "엄마야 누나야",
    "author": "김소월",
    "difficulty": "하 · 자연 낱말과 반복",
    "source": "https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/엄마야_누나야&oldid=203761",
    "edition": "1925년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "반짝는→반짝이는, 금모래빛→금모랫빛. 나머지 표현과 문장 부호 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "엄마야 누나야 강변 살자,",
        "뜰에는 반짝이는 금모랫빛,",
        "뒷문 밖에는 갈잎의 노래",
        "엄마야 누나야 강변 살자."
      ]
    ]
  },
  {
    "id": "mountain-flowers",
    "title": "산유화",
    "author": "김소월",
    "difficulty": "중 · 자연과 반복 표현",
    "source": "https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/산유화&oldid=430577",
    "edition": "1925년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "출처의 현대어 표기 기준. 여름없이→여름 없이. 갈·사노라네 등 시적 표현 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "산에는 꽃 피네",
        "꽃이 피네",
        "갈 봄 여름 없이",
        "꽃이 피네"
      ],
      [
        "산에",
        "산에",
        "피는 꽃은",
        "저만치 혼자서 피어 있네"
      ],
      [
        "산에서 우는 작은 새요",
        "꽃이 좋아",
        "산에서",
        "사노라네"
      ],
      [
        "산에는 꽃 지네",
        "꽃이 지네",
        "갈 봄 여름 없이",
        "꽃이 지네"
      ]
    ]
  },
  {
    "id": "distant-day",
    "title": "먼 후일",
    "author": "김소월",
    "difficulty": "상 · 마음 표현과 인용 부호",
    "source": "https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/먼_후일&oldid=430584",
    "edition": "1925년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "출처 현대어 표기를 바탕으로 원문의 겹낫표 「 」를 유지함. 제목 후일은 원제 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "먼 훗날 당신이 찾으시면",
        "그때에 내 말이 「잊었노라」"
      ],
      [
        "당신이 속으로 나무라면",
        "「무척 그리다가 잊었노라」"
      ],
      [
        "그래도 당신이 나무라면",
        "「믿기지 않아서 잊었노라」"
      ],
      [
        "오늘도 어제도 아니 잊고",
        "먼 훗날 그때에 「잊었노라」"
      ]
    ]
  },
  {
    "id": "departing-road",
    "title": "가는 길",
    "author": "김소월",
    "difficulty": "상 · 옛말과 문장 연결",
    "source": "https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/가는_길&oldid=203684",
    "edition": "1925년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "산(山)·서산(西山)·강(江)의 한자 병기를 생략함. 원문의 여섯 마침표와 지저귑니다·흐릅디다려 등 시어 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "그립다",
        "말을 할까",
        "하니 그리워"
      ],
      [
        "그냥 갈까",
        "그래도",
        "다시 더 한 번......"
      ],
      [
        "저 산에도 까마귀, 들에 까마귀,",
        "서산에는 해 진다고",
        "지저귑니다."
      ],
      [
        "앞강물 뒷강물,",
        "흐르는 물은",
        "어서 따라오라고 따라가지고",
        "흘러도 연달아 흐릅디다려."
      ]
    ]
  },
  {
    "id": "cannot-forget",
    "title": "못 잊어",
    "author": "김소월",
    "difficulty": "상 · 옛말과 마음 표현",
    "source": "https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/못_잊어&oldid=203584",
    "edition": "1925년 시집 전사본 기준 · 학습용 표기·구절 묶음",
    "changes": "못잊어→못 잊어, 또한긋→또 한긋, 그립어→그리워. 인용 부호를 작은따옴표로 통일. 한긋·가라시구려 등 옛말 유지. 행의 순서는 출처를 따르며, 연 단위 연습의 묶음은 학습 분량에 맞춰 구성했습니다.",
    "stanzas": [
      [
        "못 잊어 생각이 나겠지요,",
        "그런대로 한세상 지내시구려,",
        "사노라면 잊힐 날 있으리다."
      ],
      [
        "못 잊어 생각이 나겠지요,",
        "그런대로 세월만 가라시구려,",
        "못 잊어도 더러는 잊히오리다."
      ],
      [
        "그러나 또 한긋 이렇지요,",
        "‘그리워 살뜰히 못 잊는데,",
        "어쩌면 생각이 떠지나요?’"
      ]
    ]
  }
]);
function list(){return JSON.parse(JSON.stringify(poems));}
function create({poem='seosi',mode='short',start=0,count=5}={}){
 const p=list().find(p=>p.id===poem);if(!p||!['short','stanza','blank'].includes(mode))throw Error('작품과 연습 방법을 골라 주세요.');
 const units=mode==='stanza'?p.stanzas.map(s=>s.join('\n')):p.stanzas.flat();
 start=Number(start);count=Number(count);if(!Number.isInteger(start)||start<0||start>=units.length||!Number.isInteger(count)||count<1||count>20)throw Error('시작 위치와 문제 수를 확인해 주세요.');
 const items=units.slice(start,start+count).map((text,i)=>({id:p.id+'-'+mode+'-'+(start+i+1),text,display:mode==='blank'?blank(text):'',lines:text.split('\n').length}));
 return {poem:p,mode,start,count:items.length,total:units.length,items};
}
function blank(text){return text.split('\n').map(line=>{const words=[...line.matchAll(/[가-힣]+/gu)];const target=words.reduce((a,b)=>!a||b[0].length>a[0].length?b:a,null);return target?line.slice(0,target.index)+'□'.repeat(target[0].length)+line.slice(target.index+target[0].length):line;}).join('\n');}
return {list,create};
});
