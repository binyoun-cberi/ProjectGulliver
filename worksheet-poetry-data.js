(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetPoetry=api;})(globalThis,()=>{
'use strict';
const poems=[
{id:'seosi',title:'서시',author:'윤동주',difficulty:'중상 · 추상적인 낱말과 띄어쓰기',source:'https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1948년)/서시&oldid=387685',edition:'1948년 초판 전사본 기준 · 학습용 표기',changes:'우르러→우러러, 한점→한 점, 죽어가는것을→죽어 가는 것을',stanzas:[['죽는 날까지 하늘을 우러러','한 점 부끄럼이 없기를,','잎새에 이는 바람에도','나는 괴로워했다.','별을 노래하는 마음으로','모든 죽어 가는 것을 사랑해야지','그리고 나한테 주어진 길을','걸어가야겠다.'],['오늘 밤에도 별이 바람에 스치운다.']]},
{id:'new-road',title:'새로운 길',author:'윤동주',difficulty:'중 · 계절 낱말과 반복 표현',source:'https://ko.wikisource.org/w/index.php?title=하늘과_바람과_별과_시_(1948년)/새로운_길&oldid=387756',edition:'1948년 초판 전사본 기준 · 학습용 표기',changes:'문들레→민들레',stanzas:[['내를 건너서 숲으로','고개를 넘어서 마을로'],['어제도 가고 오늘도 갈','나의 길 새로운 길'],['민들레가 피고 까치가 날고','아가씨가 지나고 바람이 일고'],['나의 길은 언제나 새로운 길','오늘도…… 내일도……'],['내를 건너서 숲으로','고개를 넘어서 마을로']]},
{id:'azalea',title:'진달래꽃',author:'김소월',difficulty:'상 · 옛말과 문학적 표현',source:'https://ko.wikisource.org/w/index.php?title=진달래꽃_(시집)/진달래꽃&oldid=430575',edition:'1925년 시집 원문 전사본 기준 · 학습용 표기',changes:'옛한글을 현대 한글로 옮기고 띄어쓰기를 다듬음. 고히→고이, 말업시→말없이, 거름거름→걸음걸음 등. 원문의 문장 부호 없음은 유지.',stanzas:[['나 보기가 역겨워','가실 때에는','말없이 고이 보내드리우리다'],['영변에 약산','진달래꽃','아름 따다 가실 길에 뿌리우리다'],['가시는 걸음걸음','놓인 그 꽃을','사뿐히 즈려밟고 가시옵소서'],['나 보기가 역겨워','가실 때에는','죽어도 아니 눈물 흘리우리다']]}
];
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
