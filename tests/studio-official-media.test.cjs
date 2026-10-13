'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const versions=[
 {name:'filmcraft',v:'0.7.2',sha:'48d4f48728fa6b5c028612a4b7f59a5832ff38d430c6a7bd417a2c77d75ae4f9',page:'영상 뚝딱.html'},
 {name:'soundcraft',v:'0.6.1',sha:'de78ec829b8c876bef748a792ba97a82aa37abdb0cd687156a7753220c6a1bef',page:'음악 뚝딱.html'}
];
test('ArtCraft original FilmCraft and SoundCraft release pins and licenses are declared',()=>{
 const script=fs.readFileSync('scripts/install-artcraft-media-web.sh','utf8');
 const workflow=fs.readFileSync('.github/workflows/vendor-artcraft-media.yml','utf8');
 for(const item of versions){
  assert.ok(script.includes('install_one '+item.name+' '+item.v+' '+item.sha));
  assert.ok(workflow.includes(item.sha));
  assert.ok(script.includes('LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md'));
  assert.ok(script.includes('hashlib.sha256'));
 }
});
test('Original Rust web app is not rebranded, custom quick editor is kept',()=>{
 const bridge=fs.readFileSync('studio-official-media.js','utf8');
 const parent=fs.readFileSync('studio-app.js','utf8');
 for(const item of versions){
  const html=fs.readFileSync(item.page,'utf8');
  assert.ok(html.includes('id="officialEditorFrame"'));
  assert.ok(html.includes('id="officialMode"'));
  assert.ok(html.includes('id="simpleMode"'));
  assert.ok(html.includes('id="simpleEditor"'));
  assert.ok(html.includes('studio-official-media.js'));
  assert.ok(html.includes('assets/artcraft/'+item.name+'/index.html'));
 }
 assert.match(bridge,/gulliver-install\.json/);
 assert.match(bridge,/show\('official'\)/);
 assert.match(parent,/gulliver:official-media/);
 assert.match(parent,/자동 동기화되지 않아요/);
});
test('Installed official web builds have matching SHA provenance and entrypoints',()=>{
 for(const item of versions){
  const folder=path.join('assets','artcraft',item.name);
  // Developers may not have the binary installed until the vendor action completes.
  if(!fs.existsSync(folder))continue;
  const manifest=JSON.parse(fs.readFileSync(path.join(folder,'gulliver-install.json'),'utf8'));
  assert.equal(manifest.version,item.v);
  assert.equal(manifest.release_sha256,item.sha);
  assert.equal(manifest.source,'storytold/'+item.name);
  assert.ok(fs.statSync(path.join(folder,'index.html')).size>200);
  for(const n of ['LICENSE-MIT','LICENSE-APACHE','NOTICE','ATTRIBUTION.md'])
   assert.ok(fs.statSync(path.join(folder,'licenses',n)).size>20);
 }
});
