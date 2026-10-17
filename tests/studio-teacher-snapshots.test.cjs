'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),S=require('../studio-teacher-snapshots.js');
function valid(result){
 const old=C.starter('blank');
 return C.validate({...old,layout:result.layout,pages:[...old.pages,...result.pages],active:1});
}
test('praise progress is calculated exclusively from genuine saved score and goal',()=>{
 const out=S.thermometer({currentTemp:47,goalTemp:80,records:[{reason:'친구를 도와줌',type:'up',amount:5}]},{layout:'a4'});
 const p=valid(out).pages[1];
 assert.ok(p.elements.some(e=>e.content==='47 / 80점'));
 assert.ok(p.elements.some(e=>e.content==='목표 달성 59%'));
 assert.ok(p.elements.some(e=>e.content.includes('친구를 도와줌')));
 assert.throws(()=>S.thermometer(null),/기록이 없어요/);
});
test('voting produces aggregated counts, never leaks voter identity or tokens',()=>{
 const config={title:'우리 반 간식',students:['A학생','B학생'],options:[{id:1,name:'사과'},{id:2,name:'바나나'}]};
 const out=S.vote(config,{0:1,1:2,2:1},{layout:'wide'});
 const model=valid(out),data=JSON.stringify(model.pages[1]);
 assert.match(data,/사과/);assert.match(data,/2표/);assert.match(data,/1표/);
 assert.doesNotMatch(data,/A학생|B학생|teacherToken|studentId|votes/);
 assert.throws(()=>S.vote(config,{}),/집계된 투표가 없어요/);
});
test('online vote summary uses current aggregates, not local stale votes',()=>{
 const out=S.vote(null,null,{layout:'a4',onlineSummary:{title:'선택',options:[{name:'한라봉',count:3},{name:'사과',count:2}]}});
 assert.equal(valid(out).pages.length,2);
 assert.match(JSON.stringify(out.pages),/3표/);
});
test('roulette cannot report fabricated outcomes or unfinished arrivals',()=>{
 assert.throws(()=>S.roulette({results:[]}),/결과가 없어요/);
 const out=S.roulette({completed:false,results:[{name:'민',result:'당첨'},{name:'진',result:'발표'}]},{layout:'wide'});
 const data=JSON.stringify(valid(out).pages[1]);
 assert.match(data,/민/);assert.match(data,/진/);assert.match(data,/부분 결과/);
 assert.doesNotMatch(data,/솔/);
});
test('QR canvas receives actual image data separately from editable explanatory text',()=>{
 // A valid PNG image payload is required; no fake QR text-only rectangle is accepted.
 assert.throws(()=>S.qr('', 'https://example.org'),/QR 이미지가 없거나/);
 const png='data:image/png;base64,'+Buffer.from('test').toString('base64');
 const out=S.qr(png,'https://example.org',{layout:'wide'});
 const p=valid(out).pages[1];
 assert.ok(p.elements.some(e=>e.type==='image'&&e.src===png));
 assert.ok(p.elements.some(e=>e.type==='text'&&e.content==='https://example.org'));
});

test('praise above goal is not silently capped; the history tells teachers when some records are omitted',()=>{
 const r=S.thermometer({currentTemp:115,goalTemp:100,records:Array.from({length:7},(_,i)=>({reason:'기록 '+i,type:'up',amount:5}))});
 const data=JSON.stringify(r.pages);
 assert.match(data,/115 \/ 100점/);assert.match(data,/115%/);assert.match(data,/최근 4건 \/ 전체 7건/);
});
test('vote includes every valid choice and Wi-Fi QR does not write a plaintext password on canvas',()=>{
 const opts=Array.from({length:14},(_,i)=>({id:i+1,name:'선택 '+(i+1)}));
 const counts=Object.fromEntries(opts.map((_,i)=>[i,i+1]));
 const out=S.vote({title:'여러 선택지',options:opts},counts);
 assert.equal(out.pages.length,2);
 assert.match(JSON.stringify(out.pages),/선택 14/);
 const png='data:image/png;base64,'+Buffer.from('test').toString('base64');
 const wifi=S.qr(png,'WIFI:T:WPA;S:classroom;P:SECRET_1234;;');
 const page=JSON.stringify(wifi.pages);
 assert.doesNotMatch(page,/SECRET_1234/);
 assert.match(page,/Wi-Fi 연결용 QR/);
});
