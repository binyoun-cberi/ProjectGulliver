const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','class-planner-rules-remote.js'),'utf8');
function api(){const a={};vm.createContext(a);vm.runInContext(script,a);return a}
test('공통 학생 찾기는 쌍생아 묶음을 복사해 연결하고 원본을 보존한다',()=>{
 const a=api(),groups=[{id:'a',members:['one'],rules:[]}],out=a.twinMemberPlan(groups,[],'a','two');
 assert.equal(out.error,undefined);assert.deepEqual(Array.from(out.groups[0].members),['one','two']);assert.deepEqual(groups[0].members,['one']);assert.ok(out.traits.includes('쌍생아'));
});
test('같은 묶음·다른 묶음의 중복과 네 번째 학생·항목 한도는 연결하지 않는다',()=>{
 const a=api(),groups=[{id:'a',members:['one','two','three']},{id:'b',members:['four']}];
 for(const [id,student] of [['a','five'],['b','four'],['b','one'],['missing','five']])assert.ok(a.twinMemberPlan(groups,[],id,student).error);
 assert.ok(a.twinMemberPlan([{id:'a',members:[]}],Array.from({length:64},(_,i)=>'항목'+i),'a','one').error);
});
test('공통 검색의 개별 분리 슬롯은 동일 학생 중복을 막고 기존 선택을 유지한다',()=>{
 const a=api(),fields={pairA:{value:'one'},pairB:{value:'two'}};a.$=id=>fields[id];a.findStudent=id=>['one','two','three'].includes(id);a.toast=()=>{};vm.runInContext('renderRulesRemoteControls=()=>{}',a);
 assert.equal(a.fillSharedPair('pairA','two'),false);assert.equal(fields.pairA.value,'one');assert.equal(a.fillSharedPair('pairA','three'),true);assert.equal(fields.pairA.value,'three');assert.equal(a.fillSharedPair('pairB','missing'),false);
});
