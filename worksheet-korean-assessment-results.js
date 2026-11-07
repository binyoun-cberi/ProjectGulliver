(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.KoreanAssessmentResults=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const KEY='clasheet-korean-assessment-results.v1',MAX_RECORDS=100;
 const SKILLS={fact:'정보 파악',cause:'원인과 결과',sequence:'순서 파악',evidence:'근거 찾기',main:'중심 내용',inference:'추론',application:'상황 적용',action:'행동 이해',intent:'글쓴이 의도',structure:'글의 구조',comprehension:'내용 이해'};
 function validCode(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,20}$/.test(value)}
 function skillName(key){return SKILLS[key]||SKILLS.comprehension}
 function summarize(items,selected){
   if(!Array.isArray(items)||!Array.isArray(selected)||items.length!==selected.length||!items.length)throw Error('채점 자료를 확인해 주세요.');
   const skills={},total=items.length;let correct=0;
   for(let i=0;i<items.length;i++){
     const item=items[i];
     if(!item||!item.answer||selected[i]===undefined)throw Error('답안을 모두 확인해 주세요.');
     const skill=SKILLS[item.koreanSkill]?item.koreanSkill:'comprehension';
     if(!skills[skill])skills[skill]={correct:0,total:0};
     skills[skill].total++;
     if(selected[i]===item.answer){skills[skill].correct++;correct++}
   }
   return {correct,total,score:Math.round(correct/total*100),skills};
 }
 function makeRecord({code,grade,topic,summary,when,id}){
   if(!validCode(code))throw Error('학생 코드는 영문·숫자·하이픈·밑줄 1~20자로 입력해 주세요. 실명은 권장하지 않습니다.');
   if(!Number.isInteger(grade)||grade<1||grade>6||!['reading-assessment','reading-set','listening-set'].includes(topic))
     throw Error('평가 종류와 학년을 확인해 주세요.');
   if(!summary||!Number.isInteger(summary.correct)||!Number.isInteger(summary.total)||summary.total<1||summary.correct<0||summary.correct>summary.total||summary.score!==Math.round(100*summary.correct/summary.total))
     throw Error('채점 결과가 올바르지 않습니다.');
   const stamp=when||new Date().toISOString();
   if(!Number.isFinite(Date.parse(stamp)))throw Error('평가 일시를 확인해 주세요.');
   const skillSummary={};
   for(const [key,stat] of Object.entries(summary.skills||{})){
     if(!SKILLS[key]||!Number.isInteger(stat.total)||!Number.isInteger(stat.correct)||stat.total<1||stat.correct<0||stat.correct>stat.total)throw Error('평가 요소를 확인해 주세요.');
     skillSummary[key]={correct:stat.correct,total:stat.total};
   }
   return {id:id||stamp+'-'+code+'-'+Math.random().toString(36).slice(2,8),at:stamp,code,grade,mode:topic==='listening-set'?'듣기':'읽기',score:summary.score,correct:summary.correct,total:summary.total,skills:skillSummary};
 }
 function read(storage){
   try{
     const parsed=JSON.parse(storage.getItem(KEY)||'[]');
     return Array.isArray(parsed)?parsed.filter(r=>r&&validCode(r.code)&&Number.isInteger(r.grade)&&r.grade>=1&&r.grade<=6&&Number.isInteger(r.score)&&r.score>=0&&r.score<=100&&['읽기','듣기'].includes(r.mode)).slice(0,MAX_RECORDS):[];
   }catch{return []}
 }
 function save(storage,record){
   if(!record||!validCode(record.code)||!Number.isInteger(record.grade)||!['읽기','듣기'].includes(record.mode))throw Error('저장할 평가 결과가 올바르지 않습니다.');
   const rows=[record,...read(storage).filter(r=>r.id!==record.id)].slice(0,MAX_RECORDS);
   storage.setItem(KEY,JSON.stringify(rows));
   return rows;
 }
 function clear(storage){storage.removeItem(KEY)}
 function weaknesses(skills){
   return Object.entries(skills||{}).filter(([key,stat])=>SKILLS[key]&&stat&&stat.correct<stat.total)
     .sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total))
     .map(([key])=>skillName(key)).join(' · ')||'없음';
 }
 function csvEscape(value){
   const str=String(value??'');
   const safe=/^[=+\-@\t\r]/.test(str)?'\''+str:str;
   return '"'+safe.replace(/"/g,'""')+'"';
 }
 function exportCSV(records){
   const header=['평가 일시','학생 코드','학년','영역','점수','정답 수','문항 수','보완 요소'];
   const lines=(Array.isArray(records)?records:[]).map(r=>[r.at,r.code,r.grade,r.mode,r.score,r.correct,r.total,weaknesses(r.skills)]);
   return '\ufeff'+[header,...lines].map(row=>row.map(csvEscape).join(',')).join('\r\n')+'\r\n';
 }
 return {KEY,MAX_RECORDS,skillName,validCode,summarize,makeRecord,read,save,clear,weaknesses,exportCSV};
});
