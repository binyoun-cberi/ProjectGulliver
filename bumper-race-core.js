/* Shared limits, launch layout and allocation rules for Bumper Roulette. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ClasheetBumperCore=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const MAX_PEOPLE=100,MAX_OPTIONS=200,PHYSICAL_OPTIONS=16;
 function shuffle(values,random=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function launchLayout(n){
  if(!Number.isInteger(n)||n<1||n>MAX_PEOPLE)throw Error('참가자는 1~100명으로 입력해 주세요.');
  const columns=Math.min(n,22),spacing=32.5,rows=Math.ceil(n/columns);
  const ceiling=45-(rows-1)*spacing-45;
  return {ceiling,positions:Array.from({length:n},(_,i)=>({x:600+(i%columns-(columns-1)/2)*spacing,y:45-Math.floor(i/columns)*spacing}))};
 }
 function createPool(names,labels,{unique=false,balanced=false,directed={}}={},random=Math.random){
  if(!names.length||names.length>MAX_PEOPLE||!labels.length||labels.length>MAX_OPTIONS)throw Error('참가자는 1~100명, 선택지는 1~200개로 입력해 주세요.');
  if(new Set(names).size!==names.length)throw Error('동명이인은 번호를 붙여 구분해 주세요.');
  if(unique&&balanced)throw Error('결과 중복 금지와 모둠 균등 배정 중 하나를 선택해 주세요.');
  if(unique&&labels.length<names.length)throw Error('결과 중복 금지는 참가자 수 이상의 선택지가 필요해요.');
  let tickets=labels.map((_,i)=>i);
  if(balanced){
   const groups=[...new Set(labels)].map(label=>labels.indexOf(label));
   const base=Math.floor(names.length/groups.length),extraCount=names.length%groups.length;
   const fixed=new Map(groups.map(i=>[i,0]));
   for(const label of Object.values(directed)){
    const index=labels.indexOf(label);if(index<0)throw Error('교사 지정 결과를 확인해 주세요.');
    fixed.set(index,fixed.get(index)+1);
   }
   if([...fixed.values()].some(count=>count>base+1))throw Error('교사 지정 학생 수가 모둠 정원을 넘어요.');
   const required=groups.filter(i=>fixed.get(i)>base);
   if(required.length>extraCount)throw Error('교사 지정 학생을 유지하면서 균등하게 나눌 수 없어요.');
   const extras=new Set([...required,...shuffle(groups.filter(i=>!required.includes(i)),random).slice(0,extraCount-required.length)]);
   tickets=groups.flatMap(i=>Array(Math.floor(names.length/groups.length)+(extras.has(i)?1:0)).fill(i));
  }
  const reservations=new Map(),remaining=[...tickets],assigned=new Map();
  for(const [name,label] of Object.entries(directed)){
   if(!names.includes(name)||!labels.includes(label))throw Error('교사 지정 결과의 학생과 선택지를 확인해 주세요.');
   if(unique||balanced){
    const at=remaining.findIndex(i=>labels[i]===label);
    if(at<0)throw Error("'"+label+"'에 지정한 학생이 배정 가능한 자리보다 많아요.");
    reservations.set(name,remaining.splice(at,1)[0]);
   }else reservations.set(name,labels.indexOf(label));
  }
  function assign(name){
   if(!names.includes(name)||assigned.has(name))throw Error('참가자 결과가 중복되거나 명단에 없습니다.');
   let index;
   if(reservations.has(name))index=reservations.get(name);
   else if(unique||balanced){if(!remaining.length)throw Error('남은 결과 자리가 없습니다.');index=remaining.splice(Math.floor(random()*remaining.length),1)[0];}
   else index=tickets[Math.floor(random()*tickets.length)];
   assigned.set(name,index);return index;
  }
  return {assign,assigned,virtual:balanced||labels.length>PHYSICAL_OPTIONS};
 }
 return {MAX_PEOPLE,MAX_OPTIONS,PHYSICAL_OPTIONS,launchLayout,createPool};
});
