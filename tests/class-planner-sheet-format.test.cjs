const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','반 편성 도우미.html'),'utf8');
function api(){
 const scope={};vm.createContext(scope);
 const section=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end));
 vm.runInContext(section('/* STUDENT_NAME_COLORS_START','/* STUDENT_NAME_COLORS_END */')+'\n'+section('/* BULK_TABLE_START','/* BULK_TABLE_END */')+'\n'+section('/* STAGE_ZERO_START','/* STAGE_ZERO_END */')+'\n'+section('/* SETUP_SHEET_PASTE_START */','/* SETUP_SHEET_PASTE_END */')+'\n'+section('/* ROSTER_EXCEL_PASTE_START','/* ROSTER_EXCEL_PASTE_END */')+'\nfunction parseStudyScore(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:null}',scope);
 return scope;
}
test('0단계: 두 열, 제목 행과 기존 반 포함 붙여넣기를 지원하고 입력을 보존한다',()=>{
 const a=api(),original=[{room:1,boys:0,girls:0},{room:2,boys:0,girls:0}];
 const two=a.setupPastePlan('남학생\t여학생\n10\t14\n11\t13',0,0,original);
 assert.equal(two.rows[0].boys,10);assert.equal(two.rows[1].girls,13);assert.equal(original[0].boys,0);
 const withRoom=a.setupPastePlan('현재 반\t남학생\t여학생\n1반\t10\t14\n2반\t11\t13',0,0,original);
 assert.equal(withRoom.rows[1].boys,11);
 const middle=a.setupPastePlan('9',1,1,original);assert.equal(middle.rows[1].girls,9);assert.equal(middle.rows[0].girls,0);
});
test('0단계: 잘못된 값·행 초과·반 순서 충돌은 전체 적용을 취소한다',()=>{
 const a=api(),rows=[{room:1,boys:1,girls:2}];
 for(const text of ['-1\t2','1.5\t2','1001\t0','a\t2','1\t2\n3\t4','2반\t1\t2'])assert.ok(a.setupPastePlan(text,0,0,rows).error,text);
 assert.equal(rows[0].boys,1);
});
test('서식은 허용한 셀·6자리 HEX·실제 boolean만 저장하고 밑줄과 취소선을 함께 표시한다',()=>{
 const a=api();const f=a.normalizeCellFormats({name:{background:'#FFEEAA',bold:true,italic:true,underline:true,strike:true},gender:{background:'url(javascript:alert(1))',bold:'true'},unknown:{bold:true}});
 assert.equal(f.name.background,'#ffeeaa');assert.equal(f.gender.background,'');assert.equal(f.gender.bold,false);assert.equal(f.unknown,undefined);
 const css=a.cellFormatStyle(f.name);assert.match(css,/font-weight:700/);assert.match(css,/font-style:italic/);assert.match(css,/text-decoration:underline line-through/);
 assert.equal(a.normalizeCellFormats(null).name,undefined);
});
test('성별 열 단독 붙여넣기: 한 칸·여러 행과 한영 표기를 남·여로 정규화한다',()=>{
 const a=api(),students=Array.from({length:4},(_,i)=>({id:String(i),name:'학생',gender:'',traits:[]})),ids=students.map(s=>s.id);
 for(const [text,expected] of [['남','남'],['여자','여'],[' m ','남'],['F','여']]){
  const result=a.rosterExcelChanges(text,'gender',ids,students);assert.equal(result.errors.length,0);assert.equal(result.changes[0].next.gender,expected);
 }
 const result=a.rosterExcelChanges('성별\n남학생\n여학생\nMale\nFemale','gender',ids,students);
 assert.equal(result.errors.length,0);assert.equal(result.changes[3].next.gender,'여');
});
