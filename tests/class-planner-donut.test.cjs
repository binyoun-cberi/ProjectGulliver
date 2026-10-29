const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','반 편성 도우미.html'),'utf8');
const api={};vm.createContext(api);vm.runInContext(html.slice(html.indexOf('/* OVERVIEW_DONUT_START'),html.indexOf('/* OVERVIEW_DONUT_END */')),api);
const fixture=()=>({sourceClasses:[{room:1},{room:2},{room:3}],classCount:2,traits:['다문화','특수','사회성'],capRules:{특수:2},students:[
 {id:'a',oldClass:'1반',traits:['다문화','다문화(모)','특수']},
 {id:'b',oldClass:'1반',traits:['특수']},
 {id:'c',oldClass:'2반',traits:['다문화']},
 {id:'d',oldClass:'',traits:['사회성']}
],candidates:[{assign:{a:2,b:1,c:2,d:1}}],activeCandidate:0});
test('반별: 한 학생의 같은 항목은 한 번, 서로 다른 항목은 각 한 건으로 집계',()=>{
 const d=api.overviewDonutData(fixture(),'class');
 assert.equal(d.cards.length,4);assert.equal(d.cards[0].total,3);assert.equal(d.cards[0].pupils,2);assert.equal(d.cards[0].unit,'건');
 assert.equal(d.cards[0].entries.find(e=>e.label==='다문화').count,1);
 assert.equal(d.cards[0].entries.find(e=>e.label==='특수').count,2);
 assert.equal(d.cards[2].total,0);assert.equal(d.cards[3].title,'반 미입력');
});
test('유의 사항별: 전체 인원을 기존 반별로 나누고 0명 반·미입력 반도 보존',()=>{
 const d=api.overviewDonutData(fixture(),'trait');
 const multi=d.cards.find(c=>c.title==='다문화');assert.equal(multi.total,2);assert.equal(multi.unit,'명');
 assert.deepEqual(Array.from(multi.entries,e=>e.count),[1,1,0,0]);
 assert.equal(d.cards.find(c=>c.title==='특수').cap,2);
});
test('편성 결과 기준은 기존 반 대신 현재 편성안의 배정을 사용',()=>{
 const f=fixture(),d=api.overviewDonutData(f,'trait','result');assert.equal(d.useResult,true);
 assert.deepEqual(Array.from(d.cards[0].entries,e=>e.count),[0,2]);
 f.candidates=[];assert.equal(api.overviewDonutData(f,'trait','result').useResult,false);
});
test('빈 데이터와 64개 유의 사항도 유효한 원그래프 데이터이며 합계가 일치',()=>{
 assert.equal(api.overviewDonutGradient([]),'#e8eeeb');
 const f=fixture();f.traits=Array.from({length:64},(_,i)=>'항목'+i);f.students=Array.from({length:1000},(_,i)=>({id:String(i),oldClass:(i%12+1)+'반',traits:f.traits.slice(0,i%64+1)}));
 const classes=api.overviewDonutData(f,'class'),traits=api.overviewDonutData(f,'trait');
 assert.equal(classes.cards.length,12);assert.equal(traits.cards.find(c=>c.title==='항목0').total,1000);
 for(const card of classes.cards)assert.equal(card.total,card.entries.reduce((n,e)=>n+e.count,0));
 assert.match(api.overviewDonutGradient([{color:'#123456',count:1},{color:'#abcdef',count:3}]),/#123456 0\.00000% 25\.00000%,#abcdef 25\.00000% 100\.00000%/);
});
test('항목 추가·인원 변경에도 기존 항목과 기존 반의 색은 유지',()=>{
 const f=fixture(),before=api.overviewDonutData(f,'class');
 assert.notEqual(before.cards[0].entries[0].color,before.cards[0].entries[1].color);
 assert.equal(before.cards[0].entries[0].color,before.cards[1].entries[0].color);
 f.students[0].traits.push('사회성');const after=api.overviewDonutData(f,'class');
 for(const e of before.cards[0].entries)assert.equal(after.cards[0].entries.find(x=>x.label===e.label).color,e.color);
});
