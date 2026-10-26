(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetDictationCustom=api;})(globalThis,()=>{
'use strict';
function parse(text){
 if(typeof text!=='string'||text.length>3200)throw Error('한 줄에 한 문장씩, 최대 10문장·문장마다 120자까지 입력해 주세요.');
 const lines=text.replace(/\r\n?/g,'\n').split('\n').map(s=>s.trim()).filter(Boolean);
 if(!lines.length||lines.length>10)throw Error('한 줄에 한 문장씩 1~10문장을 입력해 주세요.');
 if(lines.some(s=>Array.from(s).length>120))throw Error('한 문장은 120자 이내로 줄여 주세요.');
 if(lines.some(s=>/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s)))throw Error('문장에 들어 있는 특수 제어 문자를 지워 주세요.');
 return lines;
}
function create({text,subject,grade,seed=1}){
 if(!['korean','english'].includes(subject)||!Number.isInteger(Number(grade))||Number(grade)<1||Number(grade)>6)throw Error('언어와 학년을 확인해 주세요.');
 const lines=parse(text);return {subject,grade:Number(grade),topic:'custom',topicLabel:'직접 입력',seed:Number(seed)>>>0,custom:true,focus:'입력한 문장을 순서대로 듣고 써요.',items:lines.map((text,i)=>({id:'custom-'+(i+1),text,topic:'custom',focus:'교사가 직접 입력한 문장'}))};
}
return {parse,create};
});
