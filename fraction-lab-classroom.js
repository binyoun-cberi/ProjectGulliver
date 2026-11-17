(function(root,factory){
 'use strict';
 const node=typeof module==='object'&&module.exports;
 const math=node?require('./fraction-lab-math.js'):root.FractionLabMath;
 const api=factory(math);
 if(node)module.exports=api;
 else root.FractionLabClassroom=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
 'use strict';
 const DENOMINATORS=Object.freeze([2,3,4,6,8,12]);
 const STORAGE_KEY='clasheet.fractionLab.teacherQuestions.v1';
 function isWhole(value){return Number.isInteger(value);}
 function validFraction(v){
  return Array.isArray(v)&&v.length===2&&isWhole(v[0])&&isWhole(v[1])&&
   DENOMINATORS.includes(v[1])&&v[0]>=1&&v[0]<=v[1];
 }
 function cleanText(value){
  return String(value||'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,120);
 }
 function composeQuestion(raw){
  if(!raw||!['add','subtract'].includes(raw.type)||!validFraction(raw.a)||!validFraction(raw.b))
   return {error:'분수와 연산 종류를 확인해 주세요. 분모는 2·3·4·6·8·12 중 하나이고 분자는 1부터 분모까지입니다.'};
  const a={n:raw.a[0],d:raw.a[1]},b={n:raw.b[0],d:raw.b[1]};
  if(raw.type==='subtract'&&a.n*b.d<b.n*a.d)
   return {error:'현재 단계에서는 음수가 나오는 뺄셈을 만들 수 없습니다. 첫 번째 분수를 더 크게 선택해 주세요.'};
  const answer=raw.type==='add'?M.add(a,b):M.subtract(a,b);
  const id=typeof raw.id==='string'&&/^q[0-9a-z_-]{1,32}$/i.test(raw.id)?raw.id:'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const grade=[3,4,5,6].includes(Number(raw.grade))?Number(raw.grade):4;
  const prompt=cleanText(raw.text)||a.n+'/'+a.d+(raw.type==='add'?' + ':' − ')+b.n+'/'+b.d+'의 결과를 조각으로 만들어 보세요.';
  return {id,type:raw.type,a:raw.a.slice(),b:raw.b.slice(),n:answer.n,d:answer.d,text:prompt,grade};
 }
 function readQuestions(store){
  try{
   const data=JSON.parse(store.getItem(STORAGE_KEY)||'[]');
   if(!Array.isArray(data))return [];
   const used=new Set(),list=[];
   for(const item of data.slice(0,100)){
    const q=composeQuestion(item);
    if(q.error||used.has(q.id))continue;
    used.add(q.id);list.push(q);
    if(list.length>=40)break;
   }
   return list;
  }catch{return [];}
 }
 function writeQuestions(store,list){
  if(!Array.isArray(list)||list.length>40)throw new RangeError('문제는 최대 40개까지 저장할 수 있습니다.');
  const safe=list.map(composeQuestion);
  if(safe.some(q=>q.error))throw new TypeError('올바르지 않은 문제는 저장할 수 없습니다.');
  store.setItem(STORAGE_KEY,JSON.stringify(safe));
  return safe;
 }
 function commonParts(q){
  const {denominator,first,second}=M.strip({n:q.a[0],d:q.a[1]},{n:q.b[0],d:q.b[1]});
  return {denominator,first,second};
 }
 function freshTransfer(q){
  return {converted:q.a[1]===q.b[1],movedA:[],movedB:[]};
 }
 function transferStatus(q,transfer){
  const {denominator,first,second}=commonParts(q);
  const movedA=transfer.movedA.length,movedB=transfer.movedB.length;
  const isMinus=q.type==='subtract';
  const finished=Boolean(transfer.converted&&(isMinus?movedB===second:movedA===first&&movedB===second));
  return {denominator,first,second,movedA,movedB,filled:isMinus?first-movedB:movedA+movedB,
   finished,required:isMinus?second:first+second};
 }
 function movePiece(q,transfer,source,index){
  if(!transfer.converted||!isWhole(index))return null;
  const {first,second}=commonParts(q),isMinus=q.type==='subtract';
  if(!['a','b'].includes(source)||(isMinus&&source==='a'))return null;
  const max=source==='a'?first:second;
  const key=source==='a'?'movedA':'movedB';
  if(index<0||index>=max||transfer[key].includes(index))return null;
  return {...transfer,[key]:transfer[key].concat(index)};
 }
 function undoMove(q,transfer,source,index){
  const key=source==='a'?'movedA':source==='b'?'movedB':null;
  if(!key||!transfer[key].includes(index))return null;
  return {...transfer,[key]:transfer[key].filter(v=>v!==index)};
 }
 function encodeQuestion(input){
  const q=composeQuestion(input);
  if(q.error)throw new TypeError(q.error);
  return [q.type==='add'?'a':'s',q.a[0],q.a[1],q.b[0],q.b[1],q.grade,encodeURIComponent(q.text)].join('.');
 }
 function decodeQuestion(token){
  if(typeof token!=='string'||token.length>2000)return null;
  const match=/^([as])\.(\d{1,2})\.(\d{1,2})\.(\d{1,2})\.(\d{1,2})\.([3-6])\.(.{0,1800})$/.exec(token);
  if(!match)return null;
  let text='';
  try{text=decodeURIComponent(match[7]);}catch{return null;}
  if(text.length>120)return null;
  const q=composeQuestion({id:'qshared',type:match[1]==='a'?'add':'subtract',
   a:[Number(match[2]),Number(match[3])],b:[Number(match[4]),Number(match[5])],
   grade:Number(match[6]),text});
  return q.error?null:q;
 }
 return Object.freeze({DENOMINATORS,STORAGE_KEY,composeQuestion,readQuestions,writeQuestions,
  commonParts,freshTransfer,transferStatus,movePiece,undoMove,encodeQuestion,decodeQuestion});
});
