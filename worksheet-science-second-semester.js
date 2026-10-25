(function(root,factory){const register=factory();if(typeof module==='object'&&module.exports)module.exports=register;else root.WorksheetScienceSecondSemesters=register;})(globalThis,()=>{'use strict';
const RECORDS=[];
function register({bank}){
 const result=[];
 const texts=[
  ['「%s」 자료에서 실제 확인한 내용은?','「%s」에서 직접 본 결과는?','「%s」 관찰 기록의 사실은?','「%s」에서 측정하거나 본 결과는?','「%s」 기록과 일치하는 내용은?'],
  ['「%s」 관찰을 바르게 해석한 것은?','「%s」 결과를 설명하는 과학 개념은?','「%s」 자료에서 추론한 내용은?','「%s」에서 적용되는 원리는?','「%s」를 설명한 것으로 알맞은 것은?'],
  ['「%s」의 관찰 조건은?','「%s」에서 조사한 조건은?','「%s」에 제시된 실험 상황은?','「%s」에서 바꾼 조건은?','「%s」에서 비교한 상황은?'],
  ['「%s」 기록만으로 알 수 없는 내용은?','「%s」에 나타나지 않은 정보는?','「%s」 자료만으로 단정할 수 없는 것은?','「%s」에서 아직 확인되지 않은 것은?','「%s」만으로 측정할 수 없는 정보는?'],
  ['「%s」에 이어서 할 탐구로 알맞은 것은?','「%s」의 결과를 더 알아볼 방법은?','「%s」를 확인할 후속 조사로 알맞은 것은?','「%s」를 확장해 탐구할 방법은?','「%s」의 자료를 보완하는 활동은?']
 ];
 for(const [grade,unit,lesson,cases] of RECORDS){
  if(cases.length!==5)throw Error('Five cases required '+lesson);
  const id='science-sem2-'+grade+'-'+result.length,rows=[];
  for(let i=0;i<5;i++){
   const [title,condition,observed,inference,unknown,followup]=cases[i],answers=[observed,inference,condition,unknown,followup];
   if(cases[i].length!==6||cases[i].some(x=>typeof x!=='string'||x.length<2))throw Error('Bad source '+lesson+'/'+i);
   const detail='[수업용 관찰 · '+title+'] '+condition+' '+observed+' 이와 관련하여 '+inference;
   for(let j=0;j<5;j++){
    let wrong=j===3?[condition,observed]:cases.filter((_,k)=>k!==i).map(c=>c[[2,3,1,4,5][j]]).filter(x=>x!==answers[j]);
    wrong=[...new Set(wrong)].slice(0,2);
    if(wrong.length!==2||wrong.includes(answers[j]))throw Error('Invalid distractors '+lesson+' '+i+'/'+j);
    const explanatory=['관찰 결과','과학적 해석','관찰·실험 조건','자료의 한계','이어지는 탐구'][j];
    rows.push([texts[j][i].replace('%s',title),answers[j],wrong[0],wrong[1],detail,explanatory+'를 구분하면 ‘'+answers[j]+'’입니다.']);
   }
  }
  const b=bank(id,'science',[grade],/^(?!)$/,unit+' · '+lesson,rows);
  b.exactSemester=2;b.exactUnitName=unit;b.exactLessonName=lesson;b.scienceSecondSemester=true;
  b.items[0].scienceMaterial={kind:'table',title:lesson+' · 관찰 비교',headers:['관찰','활동 조건','기록된 사실'],rows:cases.map(c=>[c[0],c[1],c[2]]),note:'학습 내용을 설명하기 위해 구성한 예시 관찰입니다. 실제 측정값과 다를 수 있습니다.'};
  b.items.forEach((q,i)=>{q.passageId=id+'-'+Math.floor(i/5);q.passageTitle=cases[Math.floor(i/5)][0];});
  result.push(b);
 }
 return result;
}
return register;
});