"use strict";
function validateCatchCards(targets,avoids){
 const clean=items=>(Array.isArray(items)?items:[]).map(v=>String(v).trim()).filter(Boolean);
 const t=clean(targets),a=clean(avoids);
 if(!t.length||!a.length)return {ok:false,error:'잡을 카드와 피할 카드를 각각 하나 이상 입력해 주세요.'};
 const normalize=v=>v.replace(/\s+/g,' ').toLocaleLowerCase('ko-KR');
 const ta=new Set(t.map(normalize)),aa=new Set(a.map(normalize));
 const collision=[...ta].filter(v=>aa.has(v));
 if(collision.length)return {ok:false,error:'같은 카드가 정답과 오답에 모두 있어요: '+collision.slice(0,4).join(', ')};
 const dup=[t,a].map(values=>values.filter((v,i)=>values.findIndex(x=>normalize(x)===normalize(v))!==i));
 if(dup.some(arr=>arr.length))return {ok:false,error:'같은 분류에 중복 카드가 있어요: '+dup.flat().slice(0,3).join(', ')};
 return {ok:true,error:''};
}
function validMotionHit(obj,motions,screenWidth,screenHeight){
 if(!obj||!Array.isArray(motions)||motions.length>360||motions.length<5)return false;
 if(obj.y<0||obj.y>screenHeight)return false;
 const xMin=obj.x-obj.w*.5,xMax=obj.x+obj.w*.5,yMin=obj.y-obj.h*.5,yMax=obj.y+obj.h*.5;
 let count=0;const cells=new Set();
 for(const p of motions){
  if(p.x<xMin||p.x>xMax||p.y<yMin||p.y>yMax)continue;
  count++;cells.add(Math.floor(p.x/18)+':'+Math.floor(p.y/18));
 }
 const minimum=Math.max(7,Math.min(18,Math.ceil((obj.w*obj.h/Math.max(1,screenWidth*screenHeight))*320)));
 return count>=minimum&&cells.size>=3;
}
const api=Object.freeze({validateCatchCards,validMotionHit});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.ClassroomCatchRules=api;
