/* Compare generated class plans without changing allocation, student data, or saved settings. */
function candidateComparisonStats(students,assign,classCount){
 const k=Math.max(1,Math.min(12,Math.trunc(Number(classCount)||1)));
 const rooms=Array.from({length:k},()=>({total:0,boys:0,girls:0,scored:0,scoreSum:0}));
 const origins=new Map(),traits=new Map();
 let coveredGender=0,coveredScores=0,assigned=0;
 const add=(map,key,index)=>{
  if(!map.has(key))map.set(key,Array(k).fill(0));
  map.get(key)[index]++;
 };
 for(const st of students||[]){
  const room=Number(assign?.[st.id]);
  if(!Number.isInteger(room)||room<1||room>k)continue;
  const i=room-1,r=rooms[i];r.total++;assigned++;
  if(st.gender==='남'||st.gender==='여'){
   r[st.gender==='남'?'boys':'girls']++;coveredGender++;
  }
  if(Number.isFinite(st.level)&&st.level>=0){
   r.scored++;r.scoreSum+=st.level;coveredScores++;
  }
  const source=String(st.oldClass||'').trim();
  if(source)add(origins,String(st.oldGrade||'').trim()+'|'+source,i);
  for(const tag of new Set(Array.isArray(st.traits)?st.traits:[])){
   if(typeof tag==='string'&&tag.trim())add(traits,tag,i);
  }
 }
 const spread=values=>values.length?Math.max(...values)-Math.min(...values):0;
 const distribution=map=>Array.from(map.values()).reduce((sum,counts)=>sum+spread(counts),0);
 const averages=rooms.filter(r=>r.scored>0).map(r=>r.scoreSum/r.scored);
 return {
  assigned,coveredGender,coveredScores,
  countGap:spread(rooms.map(r=>r.total)),
  genderGap:spread(rooms.map(r=>r.girls-r.boys)),
  averageGap:rooms.every(r=>r.scored>0)&&rooms.length>1?spread(averages):null,
  originSpread:distribution(origins),
  traitSpread:distribution(traits)
 };
}
function candidateComparisonTable(students,candidates,classCount,activeIndex,expanded=true){
 if(!Array.isArray(candidates)||candidates.length<2)return '';
 const base=candidates[0].assign||{},list=students||[];
 const valid=n=>Number.isInteger(n)&&n>=1&&n<=classCount;
 const scores=candidates.map((candidate,index)=>{
  const assign=candidate.assign||{};
  const stats=candidateComparisonStats(list,assign,classCount);
  const changed=index===0?0:list.filter(st=>{
   const a=Number(base[st.id]),b=Number(assign[st.id]);
   return valid(a)&&valid(b)&&a!==b;
  }).length;
  return {stats,changed};
 });
 const numeric=(n,unit)=>String(n)+unit;
 const tableRows=scores.map(({stats:s,changed},i)=>{
  const current=i===activeIndex;
  return '<tr'+(current?' class="candidate-comparison-current"':'')+'>'+
   '<th scope="row"><button type="button" data-candidate-compare="'+i+'" aria-pressed="'+current+'">편성안 '+String.fromCharCode(65+i)+(current?' · 선택 중':'')+'</button></th>'+
   '<td>'+numeric(s.countGap,'명')+'</td>'+
   '<td>'+numeric(s.genderGap,'명')+'</td>'+
   '<td>'+(s.averageGap===null?'—':s.averageGap.toFixed(2))+'</td>'+
   '<td>'+numeric(s.originSpread,'명')+'</td>'+
   '<td>'+numeric(s.traitSpread,'명')+'</td>'+
   '<td>'+(i===0?'기준':numeric(changed,'명'))+'</td>'+
   '</tr>';
 }).join('');
 const coverage=scores[0].stats;
 return '<details class="candidate-compare"'+(expanded?' open':'')+'>'+
  '<summary>편성안 균형 비교 <span>A·B·C안을 수치로 비교하기</span></summary>'+
  '<div class="candidate-compare-scroll"><table><caption>편성안별 균형 비교 (수치가 작을수록 분산이 고른 참고 지표)</caption>'+
  '<thead><tr><th scope="col">편성안</th><th scope="col">인원 차</th><th scope="col">성별 구성 편차</th><th scope="col">학습 평균 차</th><th scope="col">기존 반 쏠림</th><th scope="col">유의사항 쏠림</th><th scope="col">A안과 다른 학생</th></tr></thead>'+
  '<tbody>'+tableRows+'</tbody></table></div>'+
  '<p class="candidate-compare-note">인원 차는 가장 많은 반과 적은 반의 인원 차, 성별 구성 편차는 반별 (여−남) 차이의 범위입니다. 기존 반·유의사항 쏠림은 각 항목의 반별 최대−최소 인원을 합산한 비교 지표입니다. 학습 평균은 점수 입력 학생만 사용하며, 점수가 없는 반이 있으면 —로 표시합니다. '+
  '성별 입력 '+coverage.coveredGender+'/'+coverage.assigned+'명 · 학습지표 입력 '+coverage.coveredScores+'/'+coverage.assigned+'명. 지표만으로 최적안을 단정하지 말고 분리 조건과 유의사항을 함께 확인하세요.</p></details>';
}
