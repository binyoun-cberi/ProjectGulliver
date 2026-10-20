'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const O=require('../studio-official-project-core.js'),L=require('../studio-library-core.js');
function file(bytes,name,type='application/octet-stream'){return new File([bytes],name,{type})}
test('2.3 accepts genuine file signatures and refuses misleading extensions or overlarge files',async()=>{
 assert.equal(O.kindForName('학교.fcproj'),'video');
 assert.equal(O.kindForName('녹음.SCRAFTZ'),'music');
 assert.equal(await O.validateFile(file(Buffer.from('{"name":"수업","clips":[]}'),'수업.fcproj')),'video');
 assert.equal(await O.validateFile(file(Buffer.from([80,75,3,4,0,0,0,0]),'소리.scraftz')),'music');
 await assert.rejects(O.validateFile(file(Buffer.from('not JSON'),'fake.fcproj')),/형식/);
 await assert.rejects(O.validateFile(file(Buffer.from('{"ok":true}'),'fake.scraftz')),/형식/);
 await assert.rejects(O.validateFile(file(Buffer.from('{"ok":true}'),'wrong.txt')),/지원/);
 await assert.rejects(O.validateFile(file(Buffer.alloc(0),'empty.fcproj')),/95MB/);
 assert.ok(!O.safeName('../../secret.fcproj','video').includes('/'));
});
test('2.3 backup accepts older version-one manifests, limits archive count',()=>{
 const old={format:L.MAGIC,version:L.VERSION,projects:[],assets:[],folders:[],media:[],activities:{version:1,folders:[],activities:[]}};
 assert.deepEqual(L.checkedManifest(old),old);
 assert.equal(L.summary(old).official,0);
 const value={...old,official:[{kind:'music',name:'song.scraftz',data:'data:application/octet-stream;base64,UEsDBAAAAAA='}]};
 assert.equal(L.checkedManifest(value).official.length,1);
 assert.throws(()=>L.checkedManifest({...old,official:new Array(31).fill({})}),/개수/);
 assert.ok(O.checkedBundle(value.official[0]));
 assert.throws(()=>O.checkedBundle({...value.official[0],data:'data:text/plain;base64,UEsDBAAAAAA='}),/인코딩/);
});
test('2.3 official WASM wrapper integrates save/open but does not claim autosave',()=>{
 const bridge=fs.readFileSync('studio-official-media.js','utf8'),main=fs.readFileSync('studio-app.js','utf8');
 const library=fs.readFileSync('studio-library.js','utf8'),store=fs.readFileSync('studio-storage.js','utf8');
 const html=fs.readFileSync('뚝딱 제작실.html','utf8');
 assert.match(store,/DB_VERSION=5/);assert.match(store,/createObjectStore\('official'/);
 assert.match(store,/staged\.forEach\(item=>o\.add\(item\.data\)\)/);
 assert.match(bridge,/filmcraft\.openProject/);assert.match(bridge,/film\.execute\('file\.saveAs'/);
 assert.match(bridge,/new w\.DragEvent/);assert.match(bridge,/requestedOfficialId/);
 assert.match(main,/openingOfficialId/);assert.match(main,/return; \/\/ Original native project runs/);
 assert.match(library,/official:newOfficial/);assert.match(library,/nativeToUri/);assert.match(library,/uriToNative/);
 for(const id of ['officialImport','officialProjectList'])assert.match(html,new RegExp('id="'+id+'"'));
});
