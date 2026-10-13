'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Zip=require('../studio-zip-core.js');
function b(value){return new Blob([value],{type:'application/octet-stream'})}
test('2.4 binary ZIP produces standard STORE archive and roundtrips binary data',async()=>{
 const a=b(new Uint8Array([0,1,2,0,254,255,32])),text=new Blob(['{"version":2}']);
 const pack=await Zip.create([{path:'manifest.json',blob:text},{path:'official/0.scraftz',blob:a}]);
 assert.equal(pack.type,'application/zip');
 const raw=new Uint8Array(await pack.slice(0,4).arrayBuffer());
 assert.deepEqual([...raw],[80,75,3,4]);
 const reader=await Zip.open(pack);
 assert.deepEqual(reader.names(),['manifest.json','official/0.scraftz']);
 assert.equal(await reader.readText('manifest.json'),'{"version":2}');
 assert.deepEqual([...new Uint8Array(await (await reader.readBlob('official/0.scraftz')).arrayBuffer())],[0,1,2,0,254,255,32]);
});
test('2.4 ZIP refuses modified data, path traversal and duplicate entries',async()=>{
 const pack=await Zip.create([{path:'manifest.json',blob:b('plaintext')},{path:'assets/0.png',blob:b([1,2,3,4])}]);
 const bytes=new Uint8Array(await pack.arrayBuffer());bytes[30+'manifest.json'.length+2]^=255;
 const reader=await Zip.open(b(bytes));
 await assert.rejects(reader.readText('manifest.json'),/무결성/);
 await assert.rejects(Zip.create([{path:'../secret',blob:b('A')}]),/경로/);
 await assert.rejects(Zip.create([{path:'same.txt',blob:b('A')},{path:'same.txt',blob:b('B')}]),/반복/);
 await assert.rejects(Zip.open(b('not-a-zip')),/크기|중앙/);
});
test('2.4 ZIP preserves Korean filenames in JSON metadata and does not base64 binary',async()=>{
 const manifest=JSON.stringify({title:'우리반 영상',name:'학교.scraftz'});
 const pack=await Zip.create([{path:'manifest.json',blob:new Blob([manifest])},{path:'official/0.scraftz',blob:b([80,75,3,4])}]);
 const reader=await Zip.open(pack);
 assert.deepEqual(JSON.parse(await reader.readText('manifest.json')),{title:'우리반 영상',name:'학교.scraftz'});
 assert.equal((await reader.readBlob('official/0.scraftz')).size,4);
});
