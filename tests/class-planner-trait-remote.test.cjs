const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','class-planner-trait-remote.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','반 편성 도우미.html'),'utf8');
const escapeHtml=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function api(){const state={traits:['다문화','특수'],students:[{id:'a',name:'하늘',traits:['다문화'],note:'',fixed:0}],candidates:[{}],teacherPriorityOn:false};let undo=0,saves=0;const scope={state,escapeHtml,findStudent:id=>state.students.find(s=>s.id===id),rosterSaveUndo:()=>undo++,invalidate:()=>state.candidates=[],saveState:()=>saves++,renderRoster:()=>{},renderOverview:()=>{}};vm.createContext(scope);vm.runInContext(source,scope);return {scope,state,undo:()=>undo,saves:()=>saves}}
test('리모컨 적용은 원본 학생 객체를 보존하며 중복 항목을 만들지 않는다',()=>{
 const {scope}=api(),original={id:'a',traits:['다문화']};const updated=scope.setStudentTrait(original,'특수',true);
 assert.deepEqual(original.traits,['다문화']);assert.equal(updated.traits.length,2);
 assert.equal(scope.setStudentTrait(updated,'특수',true).traits.length,2);
 assert.equal(scope.setStudentTrait(updated,'특수',false).traits.length,1);
});
test('드롭/삭제는 저장·편성안 초기화·되돌리기에 연결되며 중복 드롭은 변경하지 않는다',()=>{
 const a=api();assert.equal(a.scope.changeRosterTrait('a','특수'),true);assert.equal(a.undo(),1);assert.equal(a.saves(),1);assert.equal(a.state.candidates.length,0);
 assert.equal(a.scope.changeRosterTrait('a','특수'),false);assert.equal(a.undo(),1);
 assert.equal(a.scope.changeRosterTrait('a','특수',false),true);assert.equal(a.undo(),2);
 assert.equal(a.scope.changeRosterTrait('missing','특수'),false);assert.equal(a.scope.changeRosterTrait('a','unknown'),false);
});
test('행에는 선택된 태그만 표시하고 악성 문자와 직접 입력·메모·고정 표시를 보존',()=>{
 const a=api(),row=a.scope.renderStudentTraits({id:'a',name:'<img>',traits:['<script>'],fixed:2,note:'내용'});
 assert.ok(row.includes('&lt;script&gt;'));assert.ok(!row.includes('<script>'));assert.ok(row.includes('data-remove-trait'));
 assert.ok(row.includes('hidden tabindex="-1" data-key="traitsText"'));assert.ok(row.includes('2반'));assert.ok(row.includes('data-note'));
 assert.ok(!row.includes('notice-picker'));assert.ok(!row.includes('checkbox'));
});
test('비모달 리모컨·드롭·터치 입력과 자산이 연결되고 기존 반복 선택창은 제거',()=>{
 for(const id of ['traitRemote','traitRemoteGrip','traitRemotePalette','traitRemoteSearch','toggleTraitRemote','traitRemoteFixed'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('class-planner-trait-remote.js'));assert.ok(html.includes('class-planner-trait-remote.css'));
 assert.ok(!html.includes('<details class="notice-picker">'));assert.ok(!html.includes('data-trait="${escapeHtml(t)}"'));
 for(const event of ['dragstart','dragover','drop','pointerdown','pointermove','pointerup','pointercancel'])assert.ok(source.includes("'"+event+"'"),event);
});
