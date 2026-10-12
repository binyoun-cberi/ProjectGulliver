(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.MunseoCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BLOCK_TYPES=['heading','paragraph','list','table','image','rule'];
const THEMES={
 blue:{name:'푸른 교실',accent:'#286EAB'},
 green:{name:'초록 교실',accent:'#247B70'},
 coral:{name:'따뜻한 교실',accent:'#B66A4F'},
 charcoal:{name:'깔끔한 문서',accent:'#38485B'}
};
const MAX_BLOCKS=90,MAX_JSON_BYTES=25*1024*1024;
let serial=0;
function block(type='paragraph',text='',options={}){
 return {id:'block-'+(++serial),type,text,rows:options.rows||[],src:options.src||'',caption:options.caption||''};
}
function p(s){return block('paragraph',s)}
function h(s){return block('heading',s)}
function list(s){return block('list',s)}
function table(rows){return block('table','',{rows})}
function image(src,caption=''){return block('image','',{src,caption})}
function template(kind='notice'){
 let title='',subtitle='',blocks=[];
 if(kind==='notice'){
  title='가정통신문';
  subtitle='학부모님께 안내드립니다';
  blocks=[
   p('학부모님, 안녕하세요?'),p('언제나 유치원 교육활동에 따뜻한 관심과 협조를 보내 주셔서 감사합니다.'),
   h('안내 사항'),list('일시: 20  년   월   일 (   )\n장소: \n대상: \n준비물: '),
   p('자세한 내용은 아래 사항을 참고해 주시기 바랍니다.'),
   table([['구분','내용'],['활동명',''],['운영 시간',''],['참고 사항','']]),
   p('궁금한 점이 있으시면 유치원으로 문의해 주세요. 감사합니다.'),
   p('20  년   월   일\n○○유치원')
  ];
 }else if(kind==='letter'){
  title='학급 소식';
  subtitle='우리 반 이야기';
  blocks=[
   p('학부모님, 안녕하세요?'),p('이번 주 우리 반에서 있었던 즐거운 배움과 놀이를 소개합니다.'),
   h('이번 주의 놀이'),p('친구들과 함께 살펴보고, 만들고, 이야기를 나누었습니다.'),
   h('함께 자란 모습'),p('스스로 도전하고 친구와 마음을 나누는 순간들이 있었습니다.'),
   h('가정에서 함께해 주세요'),list('아이의 이야기를 끝까지 들어 주세요.\n놀이에서 즐거웠던 순간을 함께 이야기해 주세요.'),
   p('다음 주에도 즐거운 배움이 이어지도록 하겠습니다.')
  ];
 }else if(kind==='lesson'){
  title='수업 활동계획';
  subtitle='활동을 계획하고 기록해요';
  blocks=[
   table([['활동명',''],['대상 / 인원',''],['활동 시간',''],['준비물','']]),
   h('활동 목표'),list('활동의 내용을 이해한다.\n스스로 선택하고 표현한다.'),
   h('활동 흐름'),table([['단계','주요 활동','지원 방법'],['도입','',''],['전개','',''],['마무리','','']]),
   h('관찰 및 평가'),p('참여 과정에서 나타난 표현, 선택, 상호작용의 변화를 기록합니다.')
  ];
 }else if(kind==='record'){
  title='놀이 관찰기록';
  subtitle='유아의 모습을 구체적으로 기록해요';
  blocks=[
   table([['관찰 일시',''],['장소',''],['관찰 대상',''],['활동 / 상황','']]),
   h('관찰 내용'),p('관찰한 행동과 상황을 사실 중심으로 기록합니다.'),
   h('의미와 해석'),p('관찰에서 확인된 흥미, 시도, 상호작용을 정리합니다.'),
   h('다음 지원 계획'),list('환경과 자료를 조정한다.\n선택과 의사표현 기회를 제공한다.')
  ];
 }else if(kind==='meeting'){
  title='협의회 기록';
  subtitle='논의한 내용과 실천할 일을 정리해요';
  blocks=[
   table([['회의 일시',''],['장소',''],['참석자',''],['안건','']]),
   h('논의 내용'),p('논의한 사항을 작성합니다.'),
   h('결정 사항'),list('결정 사항 1\n결정 사항 2'),
   h('추후 실천 계획'),table([['할 일','담당','기한'],['','',''],['','','']])
  ];
 }else{
  title='새 문서';subtitle='제목과 내용을 자유롭게 작성하세요';
  blocks=[p('여기에 문서 내용을 작성하세요.')];
 }
 return {version:1,title,subtitle,theme:'blue',blocks};
}
function textLimit(v,max=2000){return String(v??'').slice(0,max);}
function safeImage(s){
 const v=String(s||'');
 return /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<=3_000_000?v:'';
}
function validate(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.blocks)||raw.blocks.length<1||raw.blocks.length>MAX_BLOCKS)throw Error('문서에 지원되지 않는 요소가 있거나 요소 수가 너무 많아요.');
 let imageTotal=0;
 const blocks=raw.blocks.map((b,i)=>{
  if(!b||typeof b!=='object'||!BLOCK_TYPES.includes(b.type))throw Error('지원하지 않는 문서 요소가 있어요.');
  const rows=b.type==='table'&&Array.isArray(b.rows)?b.rows:[];
  if(b.type==='table'&&(!rows.length||rows.length>25||rows.some(r=>!Array.isArray(r)||r.length<1||r.length>5)))throw Error('표는 1~25행, 1~5열만 지원해요.');
  const img=b.type==='image'?safeImage(b.src):'';
  imageTotal+=img.length;
  return {id:'item-'+i,type:b.type,text:textLimit(b.text,4000),rows:rows.map(r=>r.map(v=>textLimit(v,500))),
   src:img,caption:textLimit(b.caption,180)};
 });
 if(imageTotal>20_000_000)throw Error('문서의 전체 그림 크기가 너무 커요.');
 return {version:1,title:textLimit(raw.title,120)||'새 문서',subtitle:textLimit(raw.subtitle,200),
  theme:Object.prototype.hasOwnProperty.call(THEMES,raw.theme)?raw.theme:'blue',blocks};
}
function filename(name,ext){
 return (textLimit(name,85)||'문서').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().replace(/^\.+$/,'문서')+'.'+ext;
}
function paragraphLines(text){
 return textLimit(text,4000).replace(/\r\n?/g,'\n').split('\n');
}
return {BLOCK_TYPES,THEMES,MAX_BLOCKS,MAX_JSON_BYTES,block,template,validate,safeImage,filename,paragraphLines};
});
