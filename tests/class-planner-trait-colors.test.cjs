const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'class-planner-trait-colors.js'),'utf8');
const people=()=>[{id:'a',traits:['학교A'],color:'',cellFormats:{}},{id:'b',traits:['학교B'],color:'#e9edf2',cellFormats:{}},{id:'c',traits:['학교A','학교B'],color:'#f8d4d4',cellFormats:{name:{bold:true,italic:true,background:'#f8d4d4'},number:{underline:true}}}];
function api(view='results'){
 const state={students:people(),traits:['학교A','학교B'],candidates:[{assign:{a:1,b:2,c:1},target:[2,1],score:17}],activeCandidate:0};
 let undo=0,saved=0;const fields={traitColorTag:{value:'학교A'}};
 const a={state,view,$:id=>fields[id],findStudent:id=>state.students.find(st=>st.id===id),traitRemoteUI:{},rosterSaveUndo:()=>undo++,saveState:()=>saved++,renderResults:()=>{},renderRoster:()=>{},toast:()=>{}};
 vm.createContext(a);vm.runInContext(fs.readFileSync(path.join(root,'class-planner-result-cards.js'),'utf8')+'\n'+source,a);return {a,state,fields,undo:()=>undo,saved:()=>saved};
}
test('항목이 겹친 학생도 한 번만 색칠하고 다른 학생·서식·원본은 보존',()=>{
 const {a}=api(),p=people(),before=JSON.stringify(p),out=a.traitNameColorChanges(p,'학교A','#D5E9F8');
 assert.equal(out.changes.length,2);assert.equal(out.changes[1].next.color,'#d5e9f8');assert.equal(out.changes[1].next.cellFormats.name.bold,true);assert.equal(out.changes[1].next.cellFormats.name.italic,true);assert.equal(out.changes[1].next.cellFormats.number.underline,true);assert.equal(JSON.stringify(p),before);
 assert.ok(a.traitNameColorChanges(p,'학교A','url(bad)').error);assert.equal(a.traitNameColorChanges(p,'없는항목','#d5e9f8').changes.length,0);
});
test('결과의 항목별 색상·중첩 항목 적용·해제를 한 번씩 되돌리고 모든 편성안은 유지',()=>{
 const x=api(),{a,state,fields}=x,assignment=JSON.stringify(state.candidates),before=JSON.stringify(state.students);
 assert.equal(a.applyTraitNameColor('#d5e9f8'),true);fields.traitColorTag.value='학교B';assert.equal(a.applyTraitNameColor('#dcebd8'),true);
 assert.equal(state.students[0].color,'#d5e9f8');assert.equal(state.students[2].color,'#dcebd8');
 a.undoResultNameFormat();assert.equal(state.students[1].color,'#e9edf2');assert.equal(state.students[2].color,'#d5e9f8');
 fields.traitColorTag.value='학교A';a.applyTraitNameColor('');assert.equal(state.students[0].color,'');assert.equal(state.students[1].color,'#e9edf2');
 a.undoResultNameFormat();a.undoResultNameFormat();assert.equal(JSON.stringify(state.students),before);assert.equal(JSON.stringify(state.candidates),assignment);assert.equal(x.undo(),0);
});
test('명단에서는 한 번의 되돌리기 기록을 남기고 동일 색상·없는 항목은 기록하지 않는다',()=>{
 const x=api('roster');assert.equal(x.a.applyTraitNameColor('#d5e9f8'),true);assert.equal(x.undo(),1);assert.equal(x.a.applyTraitNameColor('#d5e9f8'),false);assert.equal(x.undo(),1);x.fields.traitColorTag.value='없는항목';assert.equal(x.a.applyTraitNameColor('#d5e9f8'),false);assert.equal(x.undo(),1);
});
