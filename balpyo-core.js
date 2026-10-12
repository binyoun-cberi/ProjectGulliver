(function(root,factory){
'use strict';
const lib=factory();
if(typeof module==='object'&&module.exports)module.exports=lib;
root.BalpyoCore=lib;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const THEMES={
  sky:{name:'하늘빛',accent:'#3578B7',background:'#F3F8FF',foreground:'#19314B',muted:'#58738A'},
  mint:{name:'초록빛',accent:'#167E77',background:'#F0FAF5',foreground:'#173D39',muted:'#58756C'},
  peach:{name:'햇살빛',accent:'#B75D45',background:'#FFF5EC',foreground:'#543127',muted:'#8A6958'},
  midnight:{name:'밤하늘',accent:'#F0C86F',background:'#16233B',foreground:'#FFFFFF',muted:'#C4D1E5'}
};
const LAYOUTS=['title','content','question','picture','closing'];
const MAX_SLIDES=40,MAX_JSON_BYTES=45*1024*1024;
let next=0;
function slide(layout='content',title='',body='',eyebrow='',notes=''){
 return {id:'slide-'+(++next),layout,title,body,eyebrow,notes,image:''};
}
function starter(kind='lesson'){
 let title='새 발표 자료',slides=[];
 if(kind==='lesson'){
  title='오늘의 수업';
  slides=[
   slide('title','오늘은 무엇을 배울까요?','함께 보고, 이야기하고, 해 봐요!','수업을 시작해요','도입에서 오늘의 배움 내용을 소개해요.'),
   slide('content','오늘의 약속','친구의 말을 들어요\n차례를 지켜요\n서로 도와줘요','함께 지켜요'),
   slide('question','생각해 볼까요?','어떤 생각이 떠오르나요?','질문 시간'),
   slide('closing','오늘 배운 것을 떠올려요','기억에 남는 것을 이야기해요.','마무리')
  ];
 }else if(kind==='picture'){
  title='그림으로 배우는 시간';
  slides=[
   slide('title','그림을 살펴봐요','그림 속에는 무엇이 보일까요?','그림 수업'),
   slide('picture','자세히 관찰해요','이곳에 그림을 넣어 보세요.','관찰'),
   slide('question','무슨 일이 일어났을까요?','그림을 보며 자유롭게 말해요.','이야기'),
   slide('closing','우리의 생각 모으기','새롭게 알게 된 것을 말해요.','마무리')
  ];
 }else if(kind==='quiz'){
  title='즐거운 퀴즈';
  slides=[
   slide('title','우리 반 퀴즈 시간','함께 풀어 봐요!','퀴즈'),
   slide('question','첫 번째 문제','정답은 무엇일까요?','문제 1'),
   slide('question','두 번째 문제','친구와 함께 생각해요.','문제 2'),
   slide('closing','정말 잘했어요!','도전한 우리 모두에게 박수!','마무리')
  ];
 }else if(kind==='routine'){
  title='하루 일과 안내';
  slides=[
   slide('title','오늘의 하루','차근차근 함께해요.','우리 반 일과'),
   slide('content','오늘의 순서','등원하기\n자유롭게 놀이하기\n간식 먹기\n바깥놀이\n집으로 돌아가기','하루 순서'),
   slide('picture','다음에는 무엇을 할까요?','활동 사진을 넣어 보세요.','활동 살펴보기'),
   slide('closing','오늘도 수고했어요','내일 또 만나요!','인사')
  ];
 }else{
  title='나만의 발표';
  slides=[slide('title','발표 제목','부제목을 입력해 보세요.','나만의 발표')];
 }
 return {version:1,title,theme:'sky',slides};
}
function safeText(v,length=600){return String(v??'').slice(0,length);}
function imageSafe(value){
 const s=String(value||'');
 return /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(s)&&s.length<=3_000_000?s:'';
}
function normalizeSlide(raw,i){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error((i+1)+'번째 슬라이드 정보가 올바르지 않아요.');
 return {id:'imported-'+i,layout:LAYOUTS.includes(raw.layout)?raw.layout:'content',
 title:safeText(raw.title,170),body:safeText(raw.body,1400),eyebrow:safeText(raw.eyebrow,100),
 notes:safeText(raw.notes,2000),image:imageSafe(raw.image)};
}
function validateDeck(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.slides))throw Error('올바른 발표 자료 파일이 아니에요.');
 if(raw.slides.length<1||raw.slides.length>MAX_SLIDES)throw Error('슬라이드 수는 1~40장이어야 해요.');
 const slides=raw.slides.map(normalizeSlide);
 return {version:1,title:safeText(raw.title,90)||'나만의 발표',theme:Object.hasOwn(THEMES,raw.theme)?raw.theme:'sky',slides};
}
function filename(name,ext){
 return (safeText(name,70)||'발표자료').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().replace(/^\.+$/,'발표자료')+'.'+ext;
}
function lines(body){return safeText(body,1400).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,12);}
function slideSummary(item){return safeText(item.title,170)||({title:'표지',content:'내용',question:'질문',picture:'그림',closing:'마무리'}[item.layout]||'슬라이드');}
return{THEMES,LAYOUTS,MAX_SLIDES,MAX_JSON_BYTES,slide,starter,validateDeck,imageSafe,filename,lines,slideSummary};
});
