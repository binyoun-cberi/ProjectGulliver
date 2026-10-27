'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../worksheet-dictation-data'),P=require('../worksheet-dictation-player');
function harness(){
 let time=0,id=0;const timers=new Map(),spoken=[];let canceled=0;
 const synth={speak:u=>spoken.push(u),cancel:()=>{canceled++;},resume:()=>{}};
 const p=P.create({synth,Utterance:class{constructor(text){this.text=text;}},now:()=>time,setTimer:(fn,delay)=>{timers.set(++id,{fn,at:time+delay});return id;},clearTimer:i=>timers.delete(i)});
 function tick(ms){const end=time+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;timers.delete(next[0]);next[1].fn();}time=end;}
 return {p,spoken,tick,timers,end:()=>spoken.at(-1).onend(),get canceled(){return canceled;}};
}
test('six grade pools use separate complete sentences and preserve ten-item draws and replay',()=>{
 const all=new Set();let previous=0;
 for(let grade=1;grade<=6;grade++){
  const bank=D.bank(grade);assert.equal(bank.length,grade<=4?210:110);const average=bank.reduce((n,q)=>n+q.text.length,0)/bank.length;
  if(grade<=4){assert.ok(average>previous);previous=average;}else assert.ok(average>25,'upper grades also practice difficult words in shorter sentences');
  for(const q of bank){assert.ok(!all.has(q.text));all.add(q.text);assert.match(q.text,/[.!?]$/);assert.match(q.id,new RegExp('^g'+grade+'-'));}
  const first=D.generate({grade,seed:42}),second=D.generate({grade,seed:43,excludeIds:first.items.map(q=>q.id)});
  assert.equal(first.items.length,10);assert.equal(new Set(first.items.map(q=>q.id)).size,10);assert.ok(second.items.every(q=>!first.items.some(x=>x.id===q.id)));
  assert.deepEqual(D.generate({grade,seed:42,itemIds:first.items.map(q=>q.id)}),first);
 }
 assert.throws(()=>D.generate({grade:0}));assert.throws(()=>D.generate({grade:6,itemIds:['g1-1']}));assert.throws(()=>D.generate({grade:6,itemIds:Array(10).fill('g6-1')}));
});
test('ten sentences play exactly three times each, with separate waits starting only after speech ends',()=>{
 const h=harness(),items=D.generate({grade:2,seed:42}).items;h.p.load(items,{repeats:3,repeatGap:5,nextGap:10,rate:.85});h.p.start();assert.equal(h.spoken.length,1);
 h.tick(30000);assert.equal(h.spoken.length,1,'no overlapping or timed advance while speech continues');
 for(let i=0;i<30;i++){
  const current=h.spoken.at(-1);assert.equal(current.text,(i%3===0?`${Math.floor(i/3)+1}번. `:'')+items[Math.floor(i/3)].text);assert.equal(current.lang,'ko-KR');assert.equal(current.rate,.85);
  h.end();if(i===29)break;const wait=i%3===2?10000:5000;h.tick(wait-1);assert.equal(h.spoken.length,i+1);h.tick(1);assert.equal(h.spoken.length,i+2);
 }
 assert.equal(h.p.snapshot().state,'complete');h.tick(60000);assert.equal(h.spoken.length,30);assert.equal(h.timers.size,0);
});
test('all 48 grade/topic sets yield ten complete sentences and enforce topic/grade boundaries',()=>{
 for(let grade=1;grade<=6;grade++){
  const basic=D.bank(grade,'basic');assert.equal(basic.length,30);assert.deepEqual(basic.map(q=>q.id),Array.from({length:30},(_,i)=>`g${grade}-${i+1}`));
  const themes=D.topics(grade).filter(t=>!['all','basic'].includes(t.id)&&!t.id.startsWith('level-'));assert.equal(themes.length,8);
  for(const t of themes){
   assert.equal(t.count,10);const sheet=D.generate({grade,topic:t.id,seed:42});assert.equal(sheet.items.length,10);
   assert.ok(sheet.items.every(q=>q.topic===t.id&&q.focus&&/[.!?]$/.test(q.text)));
   assert.deepEqual(D.generate({grade,topic:t.id,seed:42,itemIds:sheet.items.map(q=>q.id)}),sheet);
   const other=D.bank(grade,'basic').slice(0,10).map(q=>q.id);assert.throws(()=>D.generate({grade,topic:t.id,itemIds:other}),/저장된/);
  }
  assert.throws(()=>D.bank(grade,'unknown'),/주제/);
 }
 const gradeSix=D.bank(6).map(q=>q.text).join(' ');for(const word of ['맞혔','맞추','쫓아','좇느라','지향','지양','간간이','금세'])assert.ok(gradeSix.includes(word),word);
});
test('pause preserves a remaining wait and canceled callbacks cannot advance the run',()=>{
 const h=harness();h.p.load(D.bank(1).slice(0,10),{repeatGap:10});h.p.start();const old=h.spoken[0];h.end();h.tick(3000);h.p.pause();assert.equal(h.p.snapshot().remaining,7);h.tick(20000);assert.equal(h.spoken.length,1);
 h.p.start();h.tick(6999);assert.equal(h.spoken.length,1);h.tick(1);assert.equal(h.spoken.length,2);
 h.p.pause();const round=h.p.snapshot().round;h.spoken[1].onend();assert.equal(h.p.snapshot().round,round);h.p.start();assert.equal(h.spoken.length,3);assert.equal(h.spoken[2].text,h.spoken[1].text);
 h.p.stop();old.onend();h.tick(60000);assert.equal(h.p.snapshot().state,'idle');assert.equal(h.p.snapshot().index,0);assert.equal(h.spoken.length,3);
});
test('one- and two-reading settings finish with no extra repetition',()=>{
 for(const repeats of [1,2]){
  const h=harness();h.p.load(D.bank(4).slice(0,10),{repeats,repeatGap:1,nextGap:2});h.p.start();
  for(let i=0;i<10*repeats;i++){h.end();if(i<10*repeats-1)h.tick((i+1)%repeats===0?2000:1000);}
  assert.equal(h.spoken.length,10*repeats);assert.equal(h.p.snapshot().state,'complete');h.tick(60000);assert.equal(h.spoken.length,10*repeats);
 }
});
test('jump, replay, new grade, errors and unavailable speech never leave a queued sentence running',()=>{
 const h=harness();h.p.load(D.bank(1).slice(0,10));h.p.start();h.p.jump(4);assert.match(h.spoken.at(-1).text,/^5번/);h.end();h.p.repeat();assert.equal(h.p.snapshot().round,0);
 const old=h.spoken.at(-1);h.p.load(D.bank(6).slice(0,10));old.onend();h.tick(60000);assert.equal(h.p.snapshot().state,'idle');h.p.start();assert.ok(h.spoken.at(-1).text.includes(D.bank(6)[0].text));
 h.spoken.at(-1).onerror({error:'language-unavailable'});assert.equal(h.p.snapshot().state,'error');h.tick(60000);assert.equal(h.p.snapshot().state,'error');
 h.p.start();h.tick(45000);assert.equal(h.p.snapshot().state,'error');
 const p=P.create({});p.load(D.bank(1).slice(0,10));p.start();assert.equal(p.snapshot().state,'error');
 assert.throws(()=>h.p.load(D.bank(1),{repeats:6}));
});

test('extended repetitions and long waits respect completion and paused remaining time',()=>{
 for(const repeats of [4,5]){
  const h=harness();h.p.load(D.bank(1).slice(0,2),{repeats,repeatGap:0,nextGap:300});h.p.start();
  for(let i=0;i<repeats;i++)h.end();
  assert.equal(h.p.snapshot().phase,'next');h.tick(90000);h.p.pause();assert.equal(h.p.snapshot().remaining,210);h.tick(500000);assert.equal(h.spoken.length,repeats);
  h.p.start();h.tick(209999);assert.equal(h.spoken.length,repeats);h.tick(1);
  for(let i=0;i<repeats;i++)h.end();assert.equal(h.spoken.length,repeats*2);assert.equal(h.p.snapshot().state,'complete');assert.equal(h.timers.size,0);
 }
 for(const options of [{repeats:0},{repeats:2.5},{repeatGap:301},{nextGap:-1},{nextGap:Infinity}])assert.throws(()=>harness().p.load(D.bank(1),options));
});
