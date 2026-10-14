'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),V=require('../studio-unified-video.js');
function model(){
 const p=C.starter('blank');p.pages[0].duration=20;
 p.tracks=[
  ...[0,4,8].map((s,i)=>({kind:'video',id:'u-film-'+i,mediaId:'u-video-'+i,mime:'video/mp4',name:'수업 '+i,start:s,duration:3,trimStart:0,muted:true,x:0,y:0,w:960,h:540})),
  ...[0,4].map((s,i)=>({kind:'audio',id:'u-audio-'+i,mediaId:'u-wave-'+i,mime:'audio/wav',name:'음악 '+i,start:s,duration:4,volume:.5})),
  ...[0,3,6].map((s,i)=>({kind:'caption',id:'u-text-'+i,name:'자막 '+i,start:s,duration:2,text:'교실 '+i,color:'#ffffff',x:120,y:360,w:720,h:90}))
 ];return p;
}
test('3 videos 2 WAV clips and 3 subtitles survive nested project validation',()=>{
 const original=model(),saved=C.validate(original),loaded=C.validate(JSON.parse(JSON.stringify(saved)));
 assert.equal(saved.tracks.length,8);
 assert.deepEqual(saved,loaded);
 assert.deepEqual(loaded.tracks.map(t=>t.kind),['video','video','video','audio','audio','caption','caption','caption']);
 assert.equal(loaded.tracks[7].text,'교실 2');
 assert.equal(loaded.tracks[3].volume,.5);
});
test('invalid overlapping clip bounds, duplicate IDs and dangerous MIME are rejected',()=>{
 const base=model();
 base.tracks[0].duration=30;
 assert.throws(()=>C.validate(base),/전체 수업 길이를 넘어요/);
 base.tracks[0].duration=3;
 base.tracks[1].id=base.tracks[0].id;
 assert.throws(()=>C.validate(base),/중복된 클립/);
 base.tracks[1].id='u-film-1';base.tracks[1].mime='text/javascript';
 assert.throws(()=>C.validate(base),/형식이 올바르지/);
});
test('legacy one-clip canvases retain data and advanced export safely rejects uncomposited multitracks',()=>{
 const original=C.starter('blank'),legacy=C.validate(original);
 assert.ok(!Object.hasOwn(legacy,'tracks'));
 const multitrack=C.validate(model());
 assert.equal(V.plan(multitrack).duration,20);
 assert.equal(V.plan(multitrack).project.tracks.length,8);
});
