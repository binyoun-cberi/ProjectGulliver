(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetMathGradeFourTransformations=api;})(globalThis,()=>{
'use strict';
// Original grade-4 paper problems about figures moving, flipping and rotating.
// An SVG grid depicts the initial shape; actual manipulation is not assessed.
const banks=[];
const names=['하린','도윤','지민','서아','준호','민호','가은','유나','지수','다은','서준','윤서','태오','예린','하윤','수아'];
const symbols=[
 ['●','▲','■'],['★','○','◇'],['가','나','다'],['♣','♡','☆'],['△','□','○'],['A','B','C'],
 ['봄','여름','가을'],['토끼','나비','별'],['돌','꽃','잎'],['X','Y','Z'],['1','2','3'],
 ['■','◇','○'],['바다','산','강'],['빨강','노랑','파랑'],['아','야','어'],['초록','보라','분홍']
];
const actionCases=[
 ['바둑돌을 방향을 바꾸지 않고 오른쪽 칸으로 옮겼습니다.','밀기'],
 ['양면 그림카드를 뒤집어 뒷면이 위로 보이게 했습니다.','뒤집기'],
 ['시곗바늘을 중심에 고정하고 시계 방향으로 움직였습니다.','돌리기'],
 ['종이 위 삼각형 모형을 방향 그대로 왼쪽으로 세 칸 옮겼습니다.','밀기'],
 ['종이모형을 좌우로 뒤집어 원래 보이던 면이 아래로 가게 했습니다.','뒤집기'],
 ['정사각형 모형을 한 점에 고정한 채 90° 회전시켰습니다.','돌리기'],
 ['화살표 스티커를 방향 그대로 위쪽으로 옮겼습니다.','밀기'],
 ['모양카드를 뒤집어 앞면 대신 뒷면이 보이게 했습니다.','뒤집기'],
 ['풍차의 날개가 가운데 축을 중심으로 회전했습니다.','돌리기'],
 ['운동장 지도에서 도형을 방향 그대로 아래쪽 칸으로 옮겼습니다.','밀기'],
 ['삼각형 모양 종이를 뒤집어 반대쪽 면이 보이게 했습니다.','뒤집기'],
 ['화살표 판을 중심점 주위로 180° 회전시켰습니다.','돌리기'],
 ['칠판의 모양 자석을 회전하지 않고 오른쪽으로 두 칸 옮겼습니다.','밀기'],
 ['양면 종이카드를 왼쪽과 오른쪽이 바뀌도록 뒤집었습니다.','뒤집기'],
 ['화살표 팻말을 한가운데를 중심으로 반시계 방향 90° 돌렸습니다.','돌리기'],
 ['지도에 놓은 모형을 회전하지 않고 왼쪽으로 한 칸 옮겼습니다.','밀기']
];
const rotateDirs=['▲','▶','▼','◀'];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function diag(title,body,viewBox='0 0 360 250'){return {kind:'diagram',title,viewBox,body};}
function gridBody(r,c,triangle){
 let svg='<rect x="0" y="0" width="360" height="250" fill="white"/>';
 for(let n=0;n<=7;n++){
  const x=68+n*25,y=32+n*25;
  svg+='<line x1="'+x+'" y1="32" x2="'+x+'" y2="207" stroke="#c2c2c2" stroke-width="1"/>';
  svg+='<line x1="68" y1="'+y+'" x2="243" y2="'+y+'" stroke="#c2c2c2" stroke-width="1"/>';
 }
 for(let n=1;n<=7;n++){
  svg+='<text x="'+(68+(n-.5)*25)+'" y="21" font-size="12" text-anchor="middle" fill="#222">'+n+'</text>';
  svg+='<text x="54" y="'+(32+(n-.5)*25+4)+'" font-size="12" text-anchor="end" fill="#222">'+n+'</text>';
 }
 const x=68+(c-.5)*25,y=32+(r-.5)*25;
 if(triangle){
  svg+='<polygon points="'+x+','+(y-10)+' '+(x-10)+','+(y+8)+' '+(x+10)+','+(y+8)+'" fill="#b6cadb" stroke="#333" stroke-width="1.5"/>';
  svg+='<text x="'+(x+9)+'" y="'+(y-8)+'" font-size="12" fill="#111">A</text>';
 }else{
  svg+='<circle cx="'+x+'" cy="'+y+'" r="5" fill="#526985"/>';
  svg+='<text x="'+(x+10)+'" y="'+(y-8)+'" font-size="12" fill="#111">A</text>';
 }
 svg+='<text x="68" y="226" font-size="12" fill="#333">위 숫자: 열, 왼쪽 숫자: 행</text>';
 return svg;
}
function sequenceDiagram(parts,vertical){
 let svg='<rect x="0" y="0" width="360" height="250" fill="white"/>';
 if(vertical){
  for(let i=0;i<3;i++){
   const y=38+i*49;svg+='<rect x="110" y="'+y+'" width="95" height="43" fill="#e1ecf3" stroke="#526474"/>';
   svg+='<text x="157" y="'+(y+27)+'" text-anchor="middle" font-size="16" fill="#222">'+esc(parts[i])+'</text>';
  }
  svg+='<line x1="55" y1="218" x2="266" y2="218" stroke="#526474" stroke-dasharray="7 5" stroke-width="2"/>';
  svg+='<text x="273" y="223" font-size="12" fill="#222">뒤집는 선</text>';
 }else{
  for(let i=0;i<3;i++){
   const x=35+i*60;svg+='<rect x="'+x+'" y="75" width="55" height="62" fill="#e1ecf3" stroke="#526474"/>';
   svg+='<text x="'+(x+27.5)+'" y="111" text-anchor="middle" font-size="14" fill="#222">'+esc(parts[i])+'</text>';
  }
  svg+='<line x1="240" y1="20" x2="240" y2="195" stroke="#526474" stroke-dasharray="7 5" stroke-width="2"/>';
  svg+='<text x="247" y="214" font-size="12" fill="#222">뒤집는 선</text>';
 }
 return svg;
}
function item(prompt,answer,w1,w2,explanation,scienceMaterial,detail){
 const choices=[answer,w1,w2].map(String);
 if(new Set(choices).size!==3)throw Error('Duplicate grade-four move answers '+prompt+' '+choices);
 if(explanation.length<18)throw Error('Missing movement rationale '+prompt);
 return {prompt,answer:String(answer),choices,explanation,...(scienceMaterial?{scienceMaterial}:{}),...(detail?{detail}:{})};
}
const loc=(r,c)=>r+'행 '+c+'열';
function make(kind,i){
 const actor=names[i];
 if(kind==='slide'||kind==='point'){
  const r=3+i%2,c=3+Math.floor(i/2)%2,amount=1+Math.floor(i/4)%2,dir=i%4;
  const dx=dir===0?amount:dir===1?-amount:0,dy=dir===2?-amount:dir===3?amount:0;
  const direction=['오른쪽','왼쪽','위쪽','아래쪽'][dir];
  const ar=r+dy,ac=c+dx;
  const halfdx=dir<2?(dir===0?1:-1):0,halfdy=dir>=2?(dir===2?-1:1):0;
  const w1=loc(r+halfdy,c+halfdx),w2=loc(r-dy,c-dx);
  const correct=loc(ar,ac);
  // When the displacement is one cell, the "one-cell movement" alternative
  // coincides with the answer. Use the untouched original position instead.
  const wrong1=amount===1?loc(r,c):w1;
  const prompt=kind==='slide'?'그림의 삼각형을 '+direction+'으로 '+amount+'칸 밀면 꼭짓점 A는 어느 칸에 있나요?':
    '그림에서 점 A를 '+direction+'으로 '+amount+'칸 옮기면 어느 칸에 있나요?';
  const why='원래 A는 '+loc(r,c)+'입니다. '+direction+'으로 '+amount+'칸 이동한 위치는 '+correct+'입니다.';
  return item(prompt,correct,wrong1,w2,why,diag(actor+'의 '+(kind==='slide'?'삼각형':'점')+' 위치',gridBody(r,c,kind==='slide')));
 }
 if(kind==='flip'){
  const parts=symbols[i],vertical=i%2===1,answer=[...parts].reverse().join(' → '),original=parts.join(' → '),shift=[parts[1],parts[2],parts[0]].join(' → ');
  const question=vertical?'그림을 아래쪽으로 뒤집어 위에서부터 읽을 때, 순서가 어떻게 바뀌나요?':
   '그림을 오른쪽으로 뒤집어 왼쪽부터 읽을 때, 순서가 어떻게 바뀌나요?';
  return item(question,answer,original,shift,
   '순서를 뒤집으면 처음과 끝의 자리가 바뀌므로 ‘'+answer+'’가 됩니다.',
   diag(actor+'의 '+(vertical?'위아래':'좌우')+' 뒤집기',sequenceDiagram(parts,vertical)));
 }
 if(kind==='rotate'){
  const start=i%4,turn=1+Math.floor(i/4)%3,correct=rotateDirs[(start+turn)%4];
  const alternatives=rotateDirs.filter(x=>x!==correct);
  const rotation=turn===1?'시계 방향 90°':turn===2?'180°':'반시계 방향 90°';
  const svg='<rect width="360" height="170" fill="white"/><circle cx="180" cy="87" r="57" fill="none" stroke="#bccbd7" stroke-width="1.5"/><text x="180" y="112" font-size="73" text-anchor="middle" fill="#354b63">'+esc(rotateDirs[start])+'</text><text x="180" y="157" font-size="12" text-anchor="middle" fill="#222">처음 방향</text>';
  return item('그림의 화살표를 '+rotation+'만큼 돌리면 어느 방향을 가리키나요?',
   correct,alternatives[0],alternatives[1],
   '처음 '+rotateDirs[start]+' 방향에서 '+rotation+' 회전한 뒤 가리키는 방향은 '+correct+'입니다.',
   diag(actor+'의 회전',svg,'0 0 360 170'));
 }
 if(kind==='object'){
  const [detail,answer]=actionCases[i],wrong=['밀기','뒤집기','돌리기'].filter(x=>x!==answer);
  const ex=answer==='밀기'?'도형의 모양과 향하는 방향을 그대로 두고 위치만 바꾼 것은 밀기입니다.':
   answer==='뒤집기'?'모양의 앞뒤 또는 좌우를 서로 반대로 바꾸는 것은 뒤집기입니다.':
   '한 점이나 축을 중심으로 방향을 회전시키는 것은 돌리기입니다.';
  return item('물건이나 도형을 움직인 방법으로 알맞은 것은?',answer,wrong[0],wrong[1],ex,undefined,actor+'의 관찰: '+detail);
 }
 if(kind==='quadrilaterals'){
  const mode=i%5,side=3+i,other=side+2,angle=60+i%3*10;
  if(mode===0)return item('설명에 가장 정확히 맞는 사각형은 무엇인가요?',
    '사다리꼴','평행사변형','정사각형',
    '마주 보는 변 가운데 한 쌍만 평행하고 다른 한 쌍은 평행하지 않아 사다리꼴입니다.',
    undefined,'사각형 '+String.fromCharCode(65+i)+': 윗변과 아랫변은 서로 평행합니다. 다른 두 변은 평행하지 않습니다. 윗변 '+side+' cm, 아랫변 '+other+' cm입니다.');
  if(mode===1)return item('설명에 가장 정확히 맞는 사각형은 무엇인가요?',
    '평행사변형','직사각형','정사각형',
    '마주 보는 두 쌍의 변이 각각 평행하지만, 네 각이 모두 직각은 아니고 이웃한 변의 길이도 다르므로 평행사변형입니다.',
    undefined,'사각형 '+String.fromCharCode(65+i)+': 마주 보는 두 쌍의 변이 각각 평행합니다. 이웃한 변은 '+side+' cm와 '+other+' cm, 한 각은 '+angle+'°입니다.');
  if(mode===2)return item('설명에 가장 정확히 맞는 사각형은 무엇인가요?',
    '마름모','직사각형','정사각형',
    '네 변의 길이가 모두 같고 한 각이 90°가 아니므로 마름모에 해당하며 직사각형·정사각형은 아닙니다.',
    undefined,'사각형 '+String.fromCharCode(65+i)+': 네 변의 길이는 각각 '+side+' cm입니다. 한 각의 크기는 '+angle+'°이며, 마주 보는 두 쌍의 변은 평행합니다.');
  if(mode===3)return item('설명에 가장 정확히 맞는 사각형은 무엇인가요?',
    '직사각형','정사각형','마름모',
    '네 각이 모두 직각이고 이웃한 두 변의 길이가 서로 달라 정사각형이 아닌 직사각형입니다.',
    undefined,'사각형 '+String.fromCharCode(65+i)+': 네 각은 모두 90°이고 이웃한 변의 길이는 '+side+' cm와 '+other+' cm입니다.');
  return item('정사각형의 성질을 모두 옳게 설명한 것은?',
   '네 변의 길이가 같고 네 각이 모두 직각이다','마주 보는 변 가운데 한 쌍만 평행하다','네 각 가운데 하나가 60°이다',
   '정사각형은 네 변의 길이가 모두 같고 네 각의 크기가 모두 90°입니다.',
   undefined,'사각형 '+String.fromCharCode(65+i)+': 네 변이 각각 '+side+' cm이고 네 각이 모두 90°입니다.');
 }
 throw Error('Unknown transform or quadrilateral lesson '+kind);
}
const curriculum=[
 [1,'평면도형의 이동',[
  ['평면도형을 밀어 봐요','slide'],['평면도형을 뒤집어 봐요','flip'],['평면도형을 돌려 봐요','rotate'],
  ['물건의 이동을 알아봐요','object'],['점의 이동을 알아봐요','point']]],
 [2,'사각형',[['여러 가지 사각형을 알아봐요','quadrilaterals']]]
];
for(const [semester,unit,lessons]of curriculum)for(const [lesson,kind]of lessons){
 // Grade 4: the movement unit is in semester 1; quadrilaterals in semester 2.
 const id='math-g4-transform-'+kind;
 const items=Array.from({length:16},(_,i)=>({...make(kind,i),evidenceId:id+'-'+(i+1),knowledgeOnly:true,
  sourceLabel:'클라시트 창작 4학년 도형 이해 문항 · 직접 밀기·뒤집기·작도하는 수행평가 아님'}));
 const unique=new Set(items.map(q=>JSON.stringify([q.prompt,q.detail||q.scienceMaterial])));
 if(unique.size!==16)throw Error('Repeated movement example '+id);
 banks.push({id,subject:'math',grades:[4],exactSemester:semester,exactUnitName:unit,exactLessonName:lesson,
   label:lesson+' · 도형의 이동·성질 이해',pattern:/^$/,items});
}
function register(target){for(const b of banks){if(target.some(x=>x.id===b.id))throw Error('Duplicate geometry bank '+b.id);target.push(b);}}
return {register,banks:()=>banks.map(b=>({...b,items:b.items.map(q=>({...q,choices:[...q.choices]}))}))};
});
