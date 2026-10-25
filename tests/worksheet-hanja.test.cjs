'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),C=require('../daily-worksheet-core'),H=require('../worksheet-hanja');
test('hanja and idiom sheets preserve complete unique level-based content in both practice modes',()=>{
 assert.equal(H.characters.length,250);assert.equal(H.idioms.length,40);
 assert.equal(new Set(H.characters.map(x=>x.character)).size,250);
 assert.equal(new Set(H.idioms.map(x=>x.characters)).size,40);
 for(const x of H.idioms){assert.equal(x.letters.length,4);assert.equal(x.letters.map(l=>l.character).join(''),x.characters);assert.ok(x.definition&&x.example);for(const l of x.letters)assert.ok(l.meaning&&l.sound)}
 for(const hanjaLevel of H.levels.map(x=>x.id))for(const topic of ['hanja-trace','idiom-trace'])for(const responseFormat of ['trace','blank'])for(const count of [5,10,15,20]){
  const options={subject:'hanja',hanjaLevel,topic,responseFormat,count,seed:2026},sheet=C.generate(options);
  assert.deepEqual(sheet,C.generate(options));assert.equal(sheet.items.length,count);assert.equal(new Set(sheet.items.map(q=>q.answer)).size,count);
  for(const q of sheet.items){assert.ok(H.pool(topic,topic==='hanja-trace'?hanjaLevel:'all').some(x=>(x.character||x.characters)===q.answer));assert.equal(q.tracing.blank,responseFormat==='blank');assert.equal(q.tracing.idiom,topic==='idiom-trace')}
  assert.equal(sheet.alignment,null);
 }
 assert.notDeepEqual(C.generate({subject:'hanja',grade:5,topic:'idiom-trace',seed:42}),C.generate({subject:'hanja',grade:5,topic:'idiom-trace',seed:43}));
 for(const options of [{hanjaLevel:'4'},{grade:7},{count:24},{topic:'unknown'},{responseFormat:'choice'}])assert.throws(()=>H.generate(options));
});
test('the bundled practice font is shipped with its license',()=>{
 assert.ok(fs.statSync('assets/fonts/hanja-tracing.otf').size>1000);
 assert.match(fs.readFileSync('assets/fonts/NotoSerifCJK-OFL.txt','utf8'),/SIL OPEN FONT LICENSE/);
});

test('official assignment counts are cumulative and idiom ranges remain separate',()=>{
 for(const [level,count] of [['8',30],['7',50],['6',70],['pre5',100],['5',250]])assert.equal(H.pool('hanja-trace',level).length,count);
 for(const [character,level] of [['南','8'],['江','7'],['犬','6'],['車','pre5'],['國','5']])assert.equal(H.characters.find(x=>x.character===character).level,level);
 assert.ok(!H.pool('hanja-trace','8').some(x=>x.character==='江'));
 assert.ok(!H.pool('hanja-trace','7').some(x=>x.character==='犬'));
 for(const [level,count] of [['all',40],['basic',20],['extended',10],['advanced',10]])assert.equal(H.pool('idiom-trace',level).length,count);
 assert.throws(()=>H.generate({topic:'idiom-trace',idiomLevel:'advanced',count:20}));
 const o={topic:'hanja-trace',hanjaLevel:'7',count:20,seed:42};assert.deepEqual(H.generate({...o,grade:1}).items,H.generate({...o,grade:6}).items);
});
