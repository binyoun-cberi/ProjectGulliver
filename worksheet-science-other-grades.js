(function(root,factory){const fn=factory();if(typeof module==='object'&&module.exports)module.exports=fn;else root.WorksheetScienceOtherGrades=fn;})(globalThis,()=>{'use strict';
const LESSONS=[];
function register({bank}){
 const list=[];
 const prompts=[
  ['「%s」 관찰 기록에 실제로 나타난 것은 무엇인가요?','「%s」에서 확인된 변화는 무엇인가요?','「%s」의 결과를 제대로 읽은 것은 무엇인가요?','「%s」에서 직접 관찰한 내용은 무엇인가요?','「%s」의 측정·관찰 결과는 무엇인가요?'],
  ['「%s」 결과를 과학적으로 설명하면 무엇인가요?','「%s」와 관련된 성질은 무엇인가요?','「%s」 자료를 뒷받침하는 설명은 무엇인가요?','「%s」에서 나타난 원리로 알맞은 것은 무엇인가요?','「%s」에서 얻을 수 있는 결론은 무엇인가요?'],
  ['「%s」의 실험 조건이나 조사 상황은 무엇인가요?','「%s」 자료가 관찰한 조건은 무엇인가요?','「%s」에서 비교한 상태는 무엇인가요?','「%s」에서 바꾸거나 살펴본 조건은 무엇인가요?','「%s」의 관찰 환경으로 맞는 것은 무엇인가요?'],
  ['「%s」에서 기록하지 않은 내용은 무엇인가요?','「%s」 자료만으로 확인할 수 없는 것은 무엇인가요?','「%s」 기록의 한계로 맞는 것은 무엇인가요?','「%s」에서 추가 확인이 필요한 정보는 무엇인가요?','「%s」 자료에 없는 값이나 사실은 무엇인가요?'],
  ['「%s」 자료를 보완할 탐구는 무엇인가요?','「%s」에 이어 살펴볼 활동으로 알맞은 것은 무엇인가요?','「%s」에서 더 알아보는 방법은 무엇인가요?','「%s」의 결과를 확인할 추가 관찰은 무엇인가요?','「%s」에서 직접 조사할 만한 다음 단계는 무엇인가요?']
 ];
 for(const [grade,semester,unit,lesson,caseRows] of LESSONS){
  if(caseRows.length!==5)throw Error('Need 5 source cases '+grade+'-'+semester+' '+lesson);
  const rows=[],id='science-rework-'+grade+'-'+semester+'-'+list.length;
  for(let i=0;i<caseRows.length;i++){
   const [title,condition,observation,principle,unknown,next]=caseRows[i];
   if([title,condition,observation,principle,unknown,next].some(v=>typeof v!=='string'||v.length<6))throw Error('Incomplete source '+lesson+' '+title);
   const detail='[관찰 자료 · '+title+'] '+condition+' '+observation+' 이 관찰은 '+principle+'';
   const answers=[observation,principle,condition,unknown,next];
   for(let j=0;j<5;j++){
    const options=j===3?[observation,condition]:caseRows.filter((_,k)=>k!==i).map(c=>c[[2,3,1,4,5][j]]).filter(x=>x!==answers[j]);
    const wrong=[...new Set(options)].slice(0,2);
    if(wrong.length!==2)throw Error('Duplicate evidence choices '+lesson+' '+i+'/'+j);
    const explanations=['자료에 적힌 실제 변화는 ','이 관찰의 과학적 해석은 ','이 사례에서 제시된 관찰 조건은 ','자료에 기록되지 않아 직접 알 수 없는 것은 ','이 상황과 연결되는 추가 탐구는 '];
    rows.push([prompts[j][i].replace('%s',title),answers[j],...wrong,detail,explanations[j]+'‘'+answers[j]+'’입니다.']);
   }
  }
  const b=bank(id,'science',[grade],/^(?!)$/,unit+' · '+lesson,rows);
  b.exactUnitName=unit;b.exactLessonName=lesson;b.exactSemester=semester;b.scienceOtherGrades=true;
  b.items[0].scienceMaterial={kind:'table',title:'관찰 비교 · '+lesson,headers:['사례','조사 상황','관찰 결과'],rows:caseRows.map(c=>[c[0],c[1],c[2]]),note:'초등 과학 수업용으로 구성한 예시 관찰 기록. 실제 관측·실험 자료는 현장 조건에 따라 달라질 수 있습니다.'};
  for(let i=0;i<b.items.length;i++){const c=caseRows[Math.floor(i/5)];b.items[i].passageId=id+'-case-'+(Math.floor(i/5)+1);b.items[i].passageTitle=c[0];}
  list.push(b);
 }
 return list;
}
return register;
});