const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','반 편성 도우미.html'),'utf8'),direct=fs.readFileSync(path.join(__dirname,'..','class-planner-direct-input.js'),'utf8');
const segment=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
function api(){const state={sourceGrade:'5',grade:'6',setupCompleted:false,students:[]};const scope={state};vm.createContext(scope);vm.runInContext(segment('/* STAGE_ZERO_START','/* STAGE_ZERO_END */')+'\n'+segment('/* BULK_TABLE_START','/* BULK_TABLE_END */')+'\n'+segment('function parseStudyScore(','function hasStudyScore(')+'\n'+segment('/* ROSTER_EXCEL_PASTE_START','/* ROSTER_EXCEL_PASTE_END */')+'\n'+direct,scope);return scope}
const factory=()=>{let n=0;return ()=>'s'+ ++n};
test('0단계 없이 1단계의 가상 첫 칸에 붙이면 실제 행만 생성하고 반·번호·성별을 인식',()=>{
 const a=api(),out=a.expandedRosterPaste('학년\t반\t번호\t이름\t성별\t학습지표\n6\t1\t3\t김하늘\t여\t0\n6\t2\t7\t이솔\t남\t92.50','name',['roster-new-row'],[],'5',factory());
 assert.equal(out.errors.length,0);assert.equal(out.created,2);assert.equal(out.students.length,2);assert.equal(out.students[0].oldGrade,'6');assert.equal(out.students[0].oldClass,'1반');assert.equal(out.students[1].number,'7');assert.equal(out.students[0].level,0);
 a.state.students=out.students;a.syncSourceFromRoster();assert.equal(a.state.sourceGrade,'6');assert.equal(a.state.grade,'7');assert.equal(a.state.sourceClassCount,2);assert.equal(a.state.sourceClasses[0].girls,1);assert.equal(a.state.sourceClasses[1].boys,1);
});
test('이름만 붙여넣어도 미입력 성별을 추정하지 않고 총원·명단 틀에 포함',()=>{
 const a=api(),out=a.expandedRosterPaste('김하늘\n박솔\n이별','name',[],[],'5',factory());a.state.students=out.students;a.syncSourceFromRoster();
 assert.equal(a.state.sourceClasses[0].unknown,3);assert.equal(a.state.sourceClasses[0].boys,0);assert.equal(a.state.sourceClasses[0].girls,0);
 assert.equal(a.stageZeroTargets(a.state.sourceClasses,3).total,3);assert.equal(a.stageZeroReconcile(out.students,'5',a.state.sourceClasses,()=> 'new').students.length,3);
 out.students[0].gender='여';a.syncSourceFromRoster();assert.equal(a.state.sourceClasses[0].unknown,2);assert.equal(a.state.sourceClasses[0].girls,1);
});
test('기존 행을 넘는 붙여넣기는 행을 추가하며 기존 색·서식·메모를 보존',()=>{
 const a=api(),original=[{id:'old',oldGrade:'5',oldClass:'2반',number:'1',name:'기존',gender:'남',traits:['특수'],color:'#ffeeaa',note:'기록',fixed:2}];
 const out=a.expandedRosterPaste('새이름\t여\n추가이름\t남','name',['old'],original,'5',factory());assert.equal(out.students.length,2);assert.equal(out.students[0].color,'#ffeeaa');assert.equal(out.students[0].note,'기록');assert.equal(out.students[0].fixed,2);assert.equal(out.students[1].oldClass,'2반');assert.equal(out.students[1].number,'2');assert.equal(original[0].name,'기존');
});
test('잘못된 메타데이터·성별·검색 중 확장·1000명 초과는 원본 변경 없이 거부',()=>{
 const a=api(),id=factory();
 for(const text of ['이름\t성별\n김\t미상','반\t이름\n13\t김'])assert.ok(a.expandedRosterPaste(text,'name',[],[],'5',id).errors.length);
 assert.ok(a.expandedRosterPaste('김\n이','name',[],[],'5',id,false).errors.length);
 assert.ok(a.expandedRosterPaste(Array(1001).fill('김').join('\n'),'name',[],[],'5',id).errors.length);
});
test('제목 없는 학년·반·번호·이름·성별·유의 사항·점수 표와 단일 이름 열 호환',()=>{
 const a=api(),out=a.expandedRosterPaste('6\t3\t2\t김하늘\t여\t특수\t91.5','name',[],[],'5',factory());assert.equal(out.students[0].oldGrade,'6');assert.equal(out.students[0].oldClass,'3반');assert.equal(out.students[0].traits[0],'특수');assert.equal(out.students[0].level,91.5);
});
