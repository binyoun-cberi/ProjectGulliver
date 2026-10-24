"use strict";
function solveManitto(participants,rules=[],random=Math.random){
 const names=[...new Set((Array.isArray(participants)?participants:[]).map(x=>String(x).trim()).filter(Boolean))];
 if(names.length<3)return {ok:false,error:'학생 이름을 최소 3명 이상 입력해 주세요.'};
 const namesSet=new Set(names),fixed=new Map(),used=new Set();
 for(const rule of rules){
  const from=String(rule?.drawer||''),to=String(rule?.receiver||'');
  if(!from&&!to)continue;
  if(!from||!to)return {ok:false,error:'비밀 규칙에 선택하지 않은 학생이 있어요. 학생 두 명을 모두 선택하거나 해당 규칙을 삭제해 주세요.'};
  if(!namesSet.has(from)||!namesSet.has(to))return {ok:false,error:'비밀 규칙에 명단에 없는 학생이 있어요.'};
  if(from===to)return {ok:false,error:'자기 자신을 마니또로 뽑을 수 없어요.'};
  if(fixed.has(from)&&fixed.get(from)!==to)return {ok:false,error:from+' 학생에게 서로 다른 마니또가 고정돼 있어요.'};
  if(used.has(to)&&fixed.get(from)!==to)return {ok:false,error:to+' 학생이 여러 명에게 중복 배정되도록 지정돼 있어요.'};
  fixed.set(from,to);used.add(to);
 }
 const pick=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
 const remainder=pick(names.filter(n=>!fixed.has(n)));
 const free=names.filter(n=>!used.has(n));
 const map=new Map();
 function augment(from,seen){
  const candidates=pick(free.filter(to=>to!==from));
  for(const to of candidates){
   if(seen.has(to))continue;seen.add(to);
   if(!map.has(to)||augment(map.get(to),seen)){map.set(to,from);return true;}
  }
  return false;
 }
 for(const person of remainder){
  if(!augment(person,new Set()))return {ok:false,error:'현재 고정 규칙으로 모든 학생을 서로 다르게 배정할 수 없어요. 고정 규칙을 줄여 주세요.'};
 }
 const matches=Object.fromEntries(fixed);
 for(const [receiver,drawer] of map)matches[drawer]=receiver;
 return {ok:true,matches};
}
if(typeof module!=="undefined"&&module.exports)module.exports={solveManitto};
if(typeof window!=="undefined")window.GulliverManittoSolver=Object.freeze({solveManitto});
