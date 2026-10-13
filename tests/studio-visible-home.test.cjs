'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('New video and music editors are visible as independent homepage tools',()=>{
 const code=fs.readFileSync('tools-catalog.js','utf8');
 const names=['영상 뚝딱','음악 뚝딱'];
 const before=code.slice(0,code.indexOf(']; const purposes=['));
 const purposes=code.slice(code.indexOf('const purposes=['),code.indexOf('];tools.forEach'));
 assert.equal((before.match(/\bname\s*:/g)||[]).length,(purposes.match(/"[^"]+"/g)||[]).length);
 for(const name of names){
  assert.equal((code.match(new RegExp('name:"'+name+'"','g'))||[]).length,1);
  assert.ok(code.includes('name:"'+name+'",subtitle:'),'visible top level name: '+name);
  assert.ok(!code.includes('name:"'+name+'",subtitle:'+name+',studioLegacy:true'));
  assert.ok(fs.existsSync(name+'.html'),'actual editor exists: '+name);
 }
 const home=fs.readFileSync('workspace-home.js','utf8');
 assert.ok(home.includes("'영상 뚝딱'"));
 assert.ok(home.includes("'음악 뚝딱'"));
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(html.includes('href="영상 뚝딱.html"'));
 assert.ok(html.includes('href="음악 뚝딱.html"'));
 assert.ok(html.includes('tools-catalog.js?v=20261013-videomusic-visible1'));
});
