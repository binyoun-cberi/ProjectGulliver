const {test}=require('node:test');const assert=require('node:assert/strict');
const A=require('../studio-activity-core.js'),C=require('../studio-unified-core.js');
test('활동 타이머 시작·정지·재개·초기화',()=>{let a=A.clean({kind:'timer',seconds:10});a=A.control(a,'start',1000);assert.equal(A.display(a,4500),'00:07');a=A.control(a,'pause',4500);assert.equal(A.display(a,9000),'00:07');a=A.control(a,'start',9000);assert.equal(A.display(a,16000),'00:00');a=A.control(a,'reset',16000);assert.equal(A.display(a,20000),'00:10')});
test('스톱워치와 활동 저장 복원·복제',()=>{const project=C.starter('blank');for(const kind of A.KINDS)project.pages[0].elements.push(C.element('activity',{activity:A.clean({kind,title:'모둠 활동',value:'https://example.org/한글'})}));const restored=C.validate(JSON.parse(JSON.stringify(project)));assert.equal(restored.pages[0].elements.length,A.KINDS.length);assert.equal(restored.pages[0].elements[2].activity.value,'https://example.org/한글');assert.equal(A.display(A.control(A.clean({kind:'stopwatch'}),'start',1000),62000),'01:01')});
test('잘못된 활동과 과도한 값 검증',()=>{assert.throws(()=>A.clean({kind:'unknown'}));assert.equal(A.clean({kind:'timer',seconds:-3}).seconds,1);assert.equal(A.clean({kind:'qr',value:'가'.repeat(2000)}).value.length,1500)});
const K=require('../studio-activity-classroom.js');
test('학생 배정은 모든 학생을 한 번 배정하고 다시 배정하면 비공개로 돌아감',()=>{
 const students=Array.from({length:11},(_,i)=>({id:'s'+i,name:'학생'+i}));
 for(const mode of ['groups','seating','roles']){const a=A.clean({kind:'assignment',mode,students,groupSize:4,cols:4});const b=A.control(a,'assign');assert.equal(b.published,false);const ids=b.result.flatMap(r=>r.memberIds);assert.equal(ids.length,11);assert.equal(new Set(ids).size,11);const shown=A.control(b,'publish');assert.equal(shown.published,true);assert.equal(A.control(shown,'assign').published,false);assert.ok(K.publicContent(shown).rows);assert.ok(!JSON.stringify(K.publicContent(b)).includes('학생0'));}
});
test('문제 이동은 정답을 다시 가리고 공개 데이터에 다른 정답을 담지 않음',()=>{
 let a=A.clean({kind:'quiz',cards:[{front:'질문1',back:'비밀정답1'},{front:'질문2',back:'비밀정답2'}]});assert.ok(!JSON.stringify(K.publicContent(a)).includes('비밀정답'));a=A.control(a,'reveal');assert.equal(K.publicContent(a).text,'비밀정답1');a=A.control(a,'next');assert.equal(a.revealed,false);assert.equal(K.publicContent(a).text,'질문2');assert.ok(!JSON.stringify(K.publicContent(a)).includes('비밀정답'));
});
test('기존 배정 결과는 조건·희망 정보를 복사하지 않고 실제 결과만 사용',()=>{
 const activity=K.fromSnapshot({kind:'groups',confirmed:true,groups:[[{id:'a',name:'가'},{id:'b',name:'나'}]],avoidPairs:[['a','b']],secret:'개인정보'});assert.equal(activity.students.length,2);assert.equal(activity.published,false);assert.ok(!JSON.stringify(activity).includes('개인정보'));assert.throws(()=>K.fromSnapshot({kind:'groups',confirmed:false,groups:[]}));assert.throws(()=>K.cleanAssignment({students:[{id:'a',name:'가'}],result:[{label:'1',memberIds:['unknown']}]}));
});
test('수업 준비와 캔버스가 같은 문항 형식과 검증을 사용',()=>{
 const Lesson=require('../lesson-core.js');assert.deepEqual(K.parseCards('수도는? | 서울'),Lesson.parseCards('수도는? | 서울'));assert.throws(()=>K.parseCards('정답 없는 문제'));assert.throws(()=>K.cards(Array(61).fill({front:'가',back:'나'})));
});
test('모둠 이름을 사람 단위로 줄바꿈해 일반 화면에서 누락하지 않음',()=>{const students=Array.from({length:7},(_,i)=>({id:'s'+i,name:'검증학생'+i}));const a=A.control(A.control(A.clean({kind:'assignment',students,groupSize:3}),'assign'),'publish');const rendered=K.visual(a,860,420).filter(c=>c.type==='text').map(c=>c.text).join('');for(const s of students)assert.ok(rendered.includes(s.name));});
