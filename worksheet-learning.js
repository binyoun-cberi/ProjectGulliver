(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./data/worksheet-textbooks.js'):root.WorksheetTextbooks,typeof module==='object'&&module.exports?require('./science-expansion.js'):root.ScienceExpansion,typeof module==='object'&&module.exports?require('./worksheet-evidence-banks.js'):root.WorksheetEvidence);if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetLearning=api;})(globalThis,(sourceCatalog,science,evidence)=>{
'use strict';
// Preserve source titles; exclude bookend corners and reviewed live performances.
// Keep paper-answerable reading, writing and calculation; omit tasks requiring
// external searching, discussion, presentation or physical/digital production.
const performanceTitles=new Set([
 '바른 자세로 발표하기','자신이 경험한 일이 잘 드러나게 발표하기','자신의 경험 발표하기',
 '글쓴이의 생각에 대한 자신의 생각 발표하기','작품에서 느낀 재미나 감동 발표하기',
 '글과 그림을 활용하여 발표하기','친구들 앞에서 자신 있게 발표하기','자료를 활용하여 발표하기',
 '연극하기','온라인 전시회를 열어 복합양식 매체 자료 감상하기',
 '바람직한 매체 사용 알림 활동 하기','바람직한 매체 사용 알림 활동 결과 공유하기'
]);
function isCoreLesson(lesson){
 const name=lesson.name.trim();
 if(performanceTitles.has(name))return false;
 const target=name.replace(/^(?:[①-⑳]|\d+\.)\s*/, '');
 if(['우리가 살기 좋은 곳을 함께 표현해 볼까요','우리 지역의 역사를 체험해 볼까요','우리 지역의 역사를 소개해 볼까요','우리 지역을 소개해 볼까요','우리 국토 곳곳으로 여행을 떠나 볼까요','분단과 관련된 장소를 체험해 볼까요'].includes(target))return false;
 if(/전시회.*열|연극하기|캠페인.*공유|작품.*만들|결과.*공유|조사하여 발표|고쳐 쓰고 공유/.test(target))return false;
 if(/인터넷에서|발표에 활용할 자료 찾기|정보 검색|정보를 검색|매체.*(?:글 쓰기|소통하기|표현하기)|매체의 특성에 알맞게 글 쓰기|매체 자료 만들기|뉴스 만들기/.test(target))return false;
 if(/(?:전자석|측정기|규칙|모양|표지판|카드).*만들|칠교판으로.*모양|여러 가지 모양으로 만들어|이야기를 만들어|곱셈표를 만들어/.test(target))return false;
 if(/놀이\s*(?:하기|를 해)|장터를 계획|식습관.*(?:계획|실천)|활동에 참여|독서 계획|정보 검색.*계획|역사 체험 계획/.test(target))return false;
 if(/(?:절차에 따라|협력하며|의견을 조정하며).*토의하기|독서 토의|문제 해결을 위한 토의|문제에 대하여 토론하기|지역.*조사해|국가유산을 조사해|사례를 조사해|렌즈를 조사해|안전장치를 조사해|사용되는 예를 조사해|상황 조사하기/.test(target))return false;
 return !/^(?:단원 열기|단원 도입|주제 도입|단원 마무리|실력 쑥쑥 단원 마무리|실천하는 과학|과학 속으로|생각 폴짝)(?:$|[\s/_])/.test(name)
  && !/^수학이랑 (?:확인해요|만들어요)(?:$|\s|[（(])/.test(name)
  && !/^(?:준비하기|정리하기|마무리하기|실천하기|배울 내용 살펴보기|배운 내용 실천하기|함께하는 수학|해결하는 수학|문제로 마무리)$/.test(name);
}
const catalog=sourceCatalog.map(unit=>({...unit,lessons:unit.lessons.filter(isCoreLesson)})).filter(unit=>unit.lessons.length);

// Bind only the learning target named by the public lesson heading. Never fill
// an unmapped lesson with an entire subject bank or a neighbouring grade.
const scienceRules=[
 [/뿌리.*(?:구조|기능)/,'animals',[12]],[/줄기.*(?:구조|기능)/,'animals',[13,18]],
 [/잎.*(?:양분|광합성)/,'animals',[14]],[/꽃.*(?:구조|기능)/,'animals',[15]],
 [/소화기관/,'human-body',[1,2,3,4]],[/순환기관/,'human-body',[7,8]],
 [/호흡기관/,'human-body',[5,6]],[/배설기관/,'human-body',[18]],
 [/뼈와 근육|몸.*움직/,'human-body',[9,10]],
 [/빛.*나아가/,'light-sound',[2]],[/지구의 자전|낮과 밤/,'space',[1,2,8,9]],
 [/지구의 공전/,'space',[3,4]],
 [/같은 시간.*빠르기|빠르기를 속력/,'speed',[]],
 [/설탕.*녹|용질.*용매|용해.*뜻/,'solution',[1,2,3]],
 [/용액의 진하기|진하기.*비교/,'solution',[10,11,12]],
 [/물의 양.*녹|온도.*녹는 양|용해.*양/,'solution',[7,8,9]],
 [/거름|걸러/,'mixture-separation',[5,6,13]],
];
const emotions=[
 ['발표 순서가 다가오자 민지는 준비한 종이를 꼭 쥐었다. 여러 번 읽은 첫 문장도 자꾸 다시 확인했다.','민지','긴장된다','기다리기 지루하다','일이 끝나 홀가분하다','종이를 꼭 쥐고 첫 문장을 반복 확인하는 행동'],
 ['준호는 며칠째 풀리지 않던 퍼즐의 마지막 조각을 끼웠다. 의자에서 벌떡 일어나 두 팔을 들었다.','준호','기쁘고 뿌듯하다','결과가 걱정스럽다','친구에게 서운하다','마지막 조각을 끼운 뒤 두 팔을 드는 행동'],
 ['서윤이는 친구와 함께 가기로 한 소풍에서 혼자 도시락을 폈다. 아파서 못 온 친구의 자리를 자꾸 돌아보았다.','서윤','친구가 없어 아쉽다','혼자 먹어서 신이 난다','친구에게 화가 난다','못 온 친구의 자리를 자꾸 돌아보는 행동'],
 ['도윤이는 동생의 손을 놓친 뒤 걸음을 멈췄다. 주위를 둘러보며 동생의 이름을 몇 번이고 불렀다.','도윤','동생이 걱정된다','동생이 자랑스럽다','놀이가 끝나 아쉽다','동생을 찾으며 이름을 반복해 부르는 행동'],
 ['지아는 함께 만든 모형이 부서진 것을 보았다. 다시 붙이려다 손을 내려놓고 한참 모형만 바라보았다.','지아','속상하다','새 모형이 궁금하다','친구를 만나 반갑다','부서진 모형을 고치려다 손을 내려놓는 행동'],
 ['민호는 빌려 간 책을 구겨서 돌려주었다. 친구와 눈이 마주치자 고개를 숙이며 작은 목소리로 미안하다고 말했다.','민호','미안하다','고맙다','억울하다','고개를 숙이고 미안하다고 사과하는 행동'],
 ['수아는 멀리서 달려오는 할머니를 보자 손을 크게 흔들었다. 신발도 제대로 신지 못한 채 문 앞으로 달려갔다.','수아','반갑다','걱정스럽다','서운하다','손을 크게 흔들며 맞으러 달려가는 행동'],
 ['유나는 약속한 시각이 지나도록 운동장 문만 바라보았다. 친구가 오자 웃는 대신 왜 늦었는지 물었다.','유나','기다리게 되어 서운하다','함께 놀아서 뿌듯하다','혼자 있고 싶어 즐겁다','오랫동안 기다린 뒤 늦은 까닭을 묻는 행동'],
];
function units(subject,grade,semester){return catalog.filter(u=>u.subject===subject&&u.grade===Number(grade)&&u.semester===Number(semester))}
function binding(unit,lesson){
 if(!isCoreLesson(lesson))return null;
 const n=lesson.name;
 const extra=evidence.find(unit,lesson);if(extra)return {kind:'evidence',bankId:extra.id,ids:extra.items.map(q=>q.evidenceId),essayIds:extra.items.filter(q=>!q.knowledgeOnly).map(q=>q.evidenceId),label:extra.label};
 if(unit.subject==='math'){
  const g=unit.grade;
  if(g===3&&/세 자리 수의 덧셈/.test(n))return {kind:'math',topic:'hundreds',type:'add-ones-none',label:'세 자리 수 덧셈 · 받아올림 없는 계산'};
  if(g===3&&/세 자리 수의 뺄셈/.test(n))return {kind:'math',topic:'addition',type:'sub-borrow-none',label:'세 자리 수 뺄셈 · 받아내림 없는 계산'};
  if(g===2&&/곱셈구구|[2-9]단/.test(n)&&/곱셈구구/.test(unit.name))return {kind:'table',label:'해당 단의 곱셈구구'};
  if(g===3&&/나눗셈의 몫/.test(n))return {kind:'division',label:'곱셈구구 범위의 나눗셈'};
  if(g>=3&&/두 자리 수.*한 자리 수.*계산/.test(n)&&/곱셈/.test(unit.name))return {kind:'math',topic:'multiplication',type:'times-two-one',label:'두 자리 수 × 한 자리 수'};
  if(g===4&&/분수.*덧셈/.test(n)&&/덧셈/.test(unit.name))return {kind:'math',topic:'fraction',type:'fraction-add-same',label:'분모가 같은 분수의 덧셈'};
  if(g===4&&/분수.*뺄셈/.test(n)&&/뺄셈/.test(unit.name))return {kind:'math',topic:'fraction',type:'fraction-sub-same',label:'분모가 같은 분수의 뺄셈'};
  if(g===1&&/수.*크기.*비교/.test(n)&&/9까지|50까지|100까지/.test(unit.name))return {kind:'numbers',max:/100/.test(unit.name)?100:/50/.test(unit.name)?50:9,label:'수의 크기 비교'};
  if(g===5&&/자연수의 혼합 계산/.test(unit.name)&&/계산해요/.test(n)){
   const type=/\(\s*\)/.test(n)?'mix-parentheses':/덧셈.*뺄셈.*곱셈.*나눗셈/.test(n)?'mix-four':/덧셈.*뺄셈.*곱셈/.test(n)?'mix-add-mul':/덧셈.*뺄셈.*나눗셈/.test(n)?'mix-sub-div':/곱셈.*나눗셈/.test(n)?'mix-mul-div':'mix-add-sub';
   return {kind:'math',topic:'mixed',type,label:'선택한 연산이 섞인 계산'};
  }
  if(g>=4&&/분수.*(?:덧셈|뺄셈)/.test(unit.name)&&/분수의 (?:덧셈|뺄셈)/.test(n))return {kind:'fraction',op:/뺄셈/.test(n)?'−':'+',same:g===4,label:g===4?'분모가 같은 진분수 계산':'분모가 다른 진분수 계산'};
  if(g===6&&/\(분수\)÷\(자연수\)/.test(n))return {kind:'fraction',op:'÷',naturalRight:true,label:'진분수 ÷ 자연수'};
  if(g===6&&/\(분수\)÷\(분수\)/.test(n))return {kind:'fraction',op:'÷',same:false,label:'진분수 ÷ 진분수'};
  if(g===5&&/\(분수\)×\(자연수\)/.test(n))return {kind:'fraction',op:'×',naturalRight:true,label:'진분수 × 자연수'};
  if(g===5&&/\(자연수\)×\(분수\)/.test(n))return {kind:'fraction',op:'×',naturalLeft:true,label:'자연수 × 진분수'};
  if(g>=4&&/소수/.test(unit.name)&&/소수.*(?:덧셈|뺄셈)/.test(n))return {kind:'decimal',op:/뺄셈/.test(n)?'−':'+',places:/두 자리/.test(n)?2:1,label:'소수의 덧셈·뺄셈'};
 }
 if(unit.subject==='science'){
  for(const [pattern,topic,ids] of scienceRules)if(pattern.test(n)){
   if(topic==='speed'&&unit.name==='물체의 운동')return {kind:'speed',label:'거리·시간 기록으로 속력 비교'};
   // A heading must also belong to the right textbook unit, especially for
   // broad words such as "몸" and "낮과 밤".
   const allowed={animals:/식물의 구조와 기능/, 'human-body':/우리 몸의 구조와 기능/,space:/지구의 운동/,'light-sound':/빛의 성질/,solution:/용해와 용액/,'mixture-separation':/혼합물의 분리/};
   if(!allowed[topic]?.test(unit.name))continue;
   return {kind:'science',topic,ids:ids.map(i=>topic+'-'+i),label:'차시 내용과 연결한 개념·근거 확인'};
  }
 }
 if(unit.subject==='social'&&/방위표|방위/.test(n))return {kind:'direction',label:'방위표를 이용한 위치 읽기'};
 if(unit.subject==='social'&&/생산.*소비|소비.*생산|경제활동의 의미/.test(n))return {kind:'economy',label:'생활 사례에서 생산과 소비 구분'};
 if(unit.subject==='korean'&&/인물.*마음|마음.*짐작/.test(n+' '+lesson.section))return {kind:'emotion',label:'행동과 말에서 인물의 마음 짐작하기'};
 if(unit.subject==='korean'&&/겪은 일.*(?:글|쓰기)|일기.*쓰기|일기 글감/.test(n))return {kind:'writing',label:'겪은 일과 생각이 드러나는 글 쓰기'};
 return null;
}
function lookup(subject,grade,semester,unitId,lessonId){const unit=units(subject,grade,semester).find(u=>u.id===unitId),lesson=unit?.lessons.find(l=>l.id===lessonId);return unit&&lesson?{unit,lesson,binding:binding(unit,lesson)}:null}
function formats(b){return !b?[]:b.kind==='writing'?[['essay','서술형']]:b.essayIds&&!b.essayIds.length?[['choice','객관식'],['short','단답형']]:['math','fraction','decimal','table','division','numbers','speed'].includes(b.kind)?[['short','단답형']]:[['choice','객관식'],['short','단답형'],['essay','서술형']]}
function counts(b,responseFormat){if(!b)return [];const max=responseFormat==='essay'&&b.essayIds?b.essayIds.length:['science','evidence'].includes(b.kind)?b.ids.length:b.kind==='emotion'?emotions.length:b.kind==='writing'?6:b.kind==='table'?9:b.kind==='economy'?12:20;return [1,2,3,4,5,6,8,10,15,20].filter(n=>n<=max)}
function rng(seed){let n=(Number(seed)>>>0)||1;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
function shuffled(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function generate(options,C){
 const {subject,grade,semester,unitId,lessonId,count,seed,responseFormat='short'}=options;
 const selected=lookup(subject,grade,semester,unitId,lessonId);if(!selected)throw Error('학년·학기·단원·학습 내용을 다시 골라 주세요.');
 const {unit,lesson,binding:b}=selected;if(!b)throw Error('이 학습 내용의 문제는 준비 중이에요. 다른 학습 내용을 골라 주세요.');
 if(!counts(b,responseFormat).includes(Number(count))||!formats(b).some(([f])=>f===responseFormat))throw Error('선택한 학습 내용의 문제 유형과 문항 수를 확인해 주세요.');
 const r=rng(seed),int=(a,z)=>a+Math.floor(r()*(z-a+1));let items=[];
 if(b.kind==='evidence'){const bank=evidence.banks.find(row=>row.id===b.bankId);items=shuffled(bank.items.filter(q=>(responseFormat==='essay'&&b.essayIds?b.essayIds:b.ids).includes(q.evidenceId)),r).slice(0,Number(count)).map(q=>({...q,choices:shuffled(q.choices,r)}));}
 else if(b.kind==='math'){
  const s=C.generate({subject:'math',grade,topic:b.topic,type:b.type,count:[5,10,15,20].find(n=>n>=Number(count)),seed});items=s.items.slice(0,Number(count)).map(q=>({...q,explanation:q.explanation||(b.topic==='hundreds'||b.topic==='addition'?'같은 자리끼리 계산합니다. '+q.prompt+' '+q.answer:b.topic==='fraction'?'분모를 확인하고 분자를 계산한 뒤 약분합니다. '+q.prompt+' '+q.answer:'연산 순서와 식을 확인하여 계산합니다. '+q.prompt+' '+q.answer)}));
 }else if(b.kind==='science'){
  const bank=science.banks[b.topic];items=shuffled(b.ids.map(id=>{const q=bank.find(q=>q.id===id);if(!q)throw Error('연결된 과학 문제를 확인해 주세요.');return {prompt:q.prompt,answer:q.answer,choices:shuffled([q.answer,...q.wrong],r),explanation:q.explanation,...(q.material?{scienceMaterial:q.material}:{}),scienceId:q.id}}),r).slice(0,Number(count));
 }else if(b.kind==='emotion')items=shuffled(emotions,r).slice(0,Number(count)).map(([detail,person,answer,w1,w2,evidence])=>({prompt:`글에서 ${person}의 마음으로 알맞은 것은 무엇인가요?`,detail,answer,choices:shuffled([answer,w1,w2],r),explanation:`${evidence}에서 ‘${answer}’라는 마음을 짐작할 수 있습니다.`}));
 else if(b.kind==='writing')items=shuffled(['친구와 함께했던 일','처음 해 보았던 일','누군가에게 도움을 받았던 일','뜻대로 되지 않았던 일','가족과 함께했던 일','혼자 힘으로 끝냈던 일'],r).slice(0,Number(count)).map(theme=>({prompt:`${theme}을 떠올려 일이 일어난 순서와 그때의 생각이나 느낌이 드러나게 써 보세요.`,answer:'자신이 겪은 일과 생각이나 느낌을 씁니다.',choices:[],explanation:'확인할 내용: 실제 경험을 골랐는지, 일이 일어난 순서가 드러나는지, 그때의 생각이나 느낌을 썼는지 살펴봅니다. 표현과 경험은 학생마다 다를 수 있습니다.'}));
 else {const seen=new Set();let tries=0;while(items.length<Number(count)&&tries++<2000){let q;
  if(b.kind==='speed'){const time=int(2,9),a=int(2,12),z=a+int(1,8);q={prompt:'같은 시간 동안 이동한 두 물체 중 평균 속력이 더 큰 물체는 무엇인가요?',scienceMaterial:{kind:'table',title:'이동 기록',headers:['물체','이동 거리','걸린 시간'],rows:[['가',a*time+' m',time+'초'],['나',z*time+' m',time+'초']]},answer:'나',choices:[],explanation:`걸린 시간이 ${time}초로 같을 때 더 멀리 간 나의 평균 속력이 더 큽니다.`};if(r()<.5){q.scienceMaterial.rows.reverse();q.scienceMaterial.rows.forEach((row,i)=>row[0]=i?'나':'가');q.answer='가';q.explanation=`걸린 시간이 ${time}초로 같을 때 더 멀리 간 가의 평균 속력이 더 큽니다.`}}
  if(b.kind==='fraction'){
   let d=int(3,12),e=b.same?d:int(3,12),a=int(1,d-1),z=int(1,e-1);if(b.naturalRight){e=1;z=int(2,9)}if(b.naturalLeft){d=1;a=int(2,9)}
   if(b.op==='−'&&a*e<z*d){[a,z]=[z,a];[d,e]=[e,d]}
   const num=b.op==='+'?a*e+z*d:b.op==='−'?a*e-z*d:b.op==='×'?a*z:a*e,den=b.op==='÷'?d*z:d*e,gcd=(a,z)=>z?gcd(z,a%z):a,g=gcd(num,den),answer=num===0?'0':den/g===1?String(num/g):`${num/g}/${den/g}`,left=d===1?String(a):`${a}/${d}`,right=e===1?String(z):`${z}/${e}`;
   q={prompt:`${left} ${b.op} ${right} =`,answer,choices:[],explanation:`계산한 분수 ${num}/${den}을 약분하면 ${answer}입니다.`};
  }
  if(b.kind==='decimal'){const scale=10**b.places;let a=int(1,90*scale),z=int(1,90*scale);if(b.op==='−'&&a<z)[a,z]=[z,a];const value=b.op==='+'?a+z:a-z;q={prompt:`${a/scale} ${b.op} ${z/scale} =`,answer:String(value/scale),choices:[],explanation:'소수점의 자리를 맞추어 같은 자리끼리 계산합니다.'}}
  if(b.kind==='division'){const a=int(2,9),z=int(2,9);q={prompt:`${a*z} ÷ ${a} =`,answer:String(z),choices:[],explanation:`${a} × ${z} = ${a*z}이므로 몫은 ${z}입니다.`}}
  if(b.kind==='table'){const match=lesson.name.match(/([2-9])단/),a=match?Number(match[1]):int(2,9),z=int(1,9);q={prompt:`${a} × ${z} =`,answer:String(a*z),choices:[],explanation:`${a}씩 ${z}묶음은 ${a*z}입니다.`}}
  if(b.kind==='numbers'){const a=int(1,b.max-1),z=int(a+1,b.max);q={prompt:`${a}와 ${z} 중 더 큰 수를 쓰세요.`,answer:String(z),choices:[],explanation:`수를 차례대로 셀 때 ${z}가 ${a}보다 뒤에 나옵니다.`}}
  if(b.kind==='direction'){const place=shuffled(['도서관','소방서','공원','박물관','우체국','병원'],r)[0],dirs=['북쪽','동쪽','남쪽','서쪽'],d=int(0,3),map=['·','·','·','·','학교','·','·','·','·'];map[[1,5,7,3][d]]=place;q={prompt:`학교에서 ${place}은 어느 방향에 있나요?`,detail:'북 ↑\n'+[0,3,6].map(i=>map.slice(i,i+3).join('  |  ')).join('\n'),answer:dirs[d],choices:shuffled(dirs,r),explanation:`방위표의 북쪽을 위로 두면 ${place}은 학교의 ${dirs[d]}에 있습니다.`}}
  if(b.kind==='economy'){const goods=shuffled(['빵','가방','의자','옷','공책','도자기'],r)[0],object=goods+((goods.charCodeAt(goods.length-1)-0xAC00)%28?'을':'를'),prod=r()<.5;q={prompt:'다음 사례는 생산과 소비 중 무엇에 해당하나요?',detail:prod?`가게에 팔 ${object} 만들었습니다.`:`필요한 ${object} 사서 사용했습니다.`,answer:prod?'생산':'소비',choices:shuffled(['생산','소비'],r),explanation:prod?'판매할 물건을 만드는 것은 생산 활동입니다.':'필요한 물건을 사서 사용하는 것은 소비 활동입니다.'}}
  if(!q)throw Error('연결된 문제 유형을 확인해 주세요.');const key=JSON.stringify([q.prompt,q.detail,q.scienceMaterial]);if(seen.has(key))continue;seen.add(key);items.push(q);
 }if(items.length!==Number(count))throw Error('겹치지 않는 문제가 부족해요. 문항 수를 줄여 주세요.');}
 items=items.map(q=>{if(responseFormat==='choice')return q;const prompt=q.prompt.replace(/알맞은 것은 무엇인가요\?/,'알맞은 답을 쓰세요.').replace(/중 무엇에 해당하나요\?/,'중 어디에 해당하는지 쓰세요.');if(responseFormat==='essay')return {...q,prompt:b.kind==='writing'?q.prompt:prompt+' 글이나 자료에서 근거를 찾아 까닭도 설명해 보세요.',choices:[],format:'essay',modelExplanation:q.explanation};return {...q,prompt,choices:[],format:'short'}});
 const curriculum={revision:'2022',semester:Number(semester),unitId,lessonId,unit:unit.name,lesson:lesson.name,practice:b.label,source:unit.source,book:unit.book};
 return {subject,grade:Number(grade),topic:'textbook-learning',type:'',count:Number(count),seed:Number(seed)>>>0,difficulty:'basic',responseFormat,alignment:null,title:`${grade}학년 ${semester}학기 · ${unit.name}`,curriculum,items:items.map(q=>({...q,curriculumLesson:lessonId}))};
}
return {catalog,sourceCatalog,isCoreLesson,units,binding,lookup,formats,counts,generate};
});
