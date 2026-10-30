const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'반 편성 도우미.html'),'utf8'),XLSX=require('../class-planner-xlsx.min.js');
const segment=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b));
function api(){const scope={XLSX};vm.createContext(scope);vm.runInContext(segment('/* STAGE_ZERO_START','/* STAGE_ZERO_END */')+'\n'+segment('/* BULK_TABLE_START','/* BULK_TABLE_END */')+'\n'+segment('function parseStudyScore(','function hasStudyScore(')+'\n'+segment('/* ROSTER_EXCEL_PASTE_START','/* ROSTER_EXCEL_PASTE_END */')+'\n'+fs.readFileSync(path.join(root,'class-planner-direct-input.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'class-planner-excel.js'),'utf8'),scope);return scope}
const pupil=(id,n=1)=>({id,oldGrade:'5',oldClass:'1반',number:String(n),name:'학생'+n,gender:'남',level:0,traits:['학교항목'],fixed:2,note:'메모',color:'#ffeeaa'});
const factory=()=>{let n=0;return ()=>'new'+ ++n};
function book(rows){const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['기존 학년','기존 반','기존 번호','이름','성별','학습지표','유의 사항'],...rows]),'명단');return book}
test('실제 XLSX 양식 왕복: 숫자·0점·학교 유의 사항과 기존 ID/메모/색을 보존',()=>{
 const a=api(),old=pupil('old'),workbook=a.rosterExcelWorkbook([old],'5');
 const data=XLSX.write(workbook,{type:'buffer',bookType:'xlsx',compression:true});
 assert.equal(data[0],80);assert.equal(data[1],75);
 const read=XLSX.read(data,{type:'buffer'}),out=a.rosterExcelImportPlan(read,[old],['학교항목'],'5',factory());
 assert.equal(out.errors.length,0);assert.equal(out.students[0].id,'old');assert.equal(out.students[0].level,0);assert.equal(out.students[0].note,'메모');assert.equal(out.students[0].color,'#ffeeaa');assert.equal(out.removed,0);assert.equal(read.Sheets['명단'].A2.t,'n');
});
test('파일 행 순서가 바뀌어도 학생 식별정보로 연결하고 새 유의 사항을 중복 없이 등록',()=>{
 const a=api(),old=[pupil('one'),pupil('two',2)],out=a.rosterExcelImportPlan(book([[5,1,2,'둘','여',90,'급식지원; 통학지원'],[5,1,1,'하나','남','','급식지원']]),old,[],'5',factory());
 assert.equal(out.errors.length,0);assert.equal(out.students[0].id,'two');assert.equal(out.students[1].id,'one');assert.equal(out.students[1].level,null);assert.deepEqual(Array.from(out.newTraits),['급식지원','통학지원']);
});
test('빈 양식 행은 제외하며 오류·중복·64항목 초과는 전체 거부',()=>{
 const a=api(),id=factory(),old=[pupil('old')];
 assert.ok(a.rosterExcelImportPlan(a.rosterExcelWorkbook([],'5'),old,[],'5',id).errors.length);
 for(const rows of [[[13,1,1,'잘못됨','남',0,'']],[[5,1,1,'중복','남',0,''],[5,1,1,'중복2','여',0,'']],[[5,1,1,'성별','미상',0,'']]])assert.ok(a.rosterExcelImportPlan(book(rows),old,[],'5',id).errors.length);
 assert.ok(a.rosterExcelImportPlan(book([[5,1,1,'추가','여',0,'신규']]),old,Array.from({length:64},(_,i)=>'항목'+i),'5',id).errors.length);
 assert.equal(old[0].name,'학생1');
});
test('기존 학년·반·번호 연속 붙여넣기와 개별 열 붙여넣기',()=>{
 const a=api(),old=[pupil('one'),pupil('two',2)],ids=old.map(s=>s.id);
 const out=a.rosterExcelChanges('6\t2\t21\n6학년\t3반\t22번','oldGrade',ids,old);
 assert.equal(out.errors.length,0);assert.equal(out.changes[1].next.number,'22');assert.equal(out.changes[0].next.oldGrade,'6');
 assert.equal(a.rosterExcelChanges('기존 번호\n9\n10','number',ids,old).changes[1].next.number,'10');
});
test('명단 통계는 표 위에서 접고 펼치며 양식·업로드 버튼을 제공',()=>{
 assert.ok(html.indexOf('id="rosterOverview"')<html.indexOf('id="rosterHead"'));
 for(const key of ['oldGrade','oldClass','number'])assert.ok(html.includes('data-roster-cell="'+key+'"'));
 for(const id of ['downloadRosterTemplate','uploadRosterExcel','rosterExcelDialog'])assert.ok(html.includes('id="'+id+'"'));
});

test('엑셀 전학 시기 열은 전학 예정 태그와 함께 왕복하고 잘못된 시기는 거부',()=>{
 const a=api(),p={...pupil('old'),traits:['전학 예정'],transferTiming:'before'},workbook=a.rosterExcelWorkbook([p],'5');
 const out=a.rosterExcelImportPlan(workbook,[p],['전학 예정'],'5',factory());assert.equal(out.errors.length,0);assert.equal(out.students[0].transferTiming,'before');
 workbook.Sheets['명단'].H2={t:'s',v:'잘못됨'};assert.ok(a.rosterExcelImportPlan(workbook,[p],['전학 예정'],'5',factory()).errors.length);
});

test('명단이 없어도 학년·반·번호부터 붙여넣어 이름을 입력할 자리를 만든다',()=>{
 const a=api(),out=a.expandedRosterPaste('5\t2\t1\n5\t2\t2','oldGrade',[],[],'5',factory());
 assert.equal(out.errors.length,0);assert.equal(out.students.length,2);assert.equal(out.students[1].oldClass,'2반');assert.equal(out.students[1].number,'2');assert.equal(out.students[1].name,'');
});
