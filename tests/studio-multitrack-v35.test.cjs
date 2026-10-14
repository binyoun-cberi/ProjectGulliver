'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),V=require('../studio-unified-video.js'),M=require('../studio-unified-multitrack-export.js');
function demo(){
 const project=C.starter('blank');project.pages[0].duration=8;
 project.tracks=[
  {id:'u-video-red',kind:'video',mediaId:'u-file-1',mime:'video/mp4',name:'붉은 영상',start:0,duration:2,trimStart:0,x:0,y:0,w:960,h:540},
  {id:'u-video-blue',kind:'video',mediaId:'u-file-2',mime:'video/mp4',name:'파란 영상',start:2,duration:3,trimStart:0,x:0,y:0,w:960,h:540},
  {id:'u-wav-1',kind:'audio',mediaId:'u-wav-A',mime:'audio/wav',name:'첫 음악',start:0,duration:3,trimStart:0,volume:.4},
  {id:'u-wav-2',kind:'audio',mediaId:'u-wav-B',mime:'audio/wav',name:'두 번째 음악',start:2,duration:3,trimStart:0,volume:.8},
  {id:'u-subtitle',kind:'caption',text:'안녕 학교',name:'자막',start:1,duration:2,x:130,y:380,w:700,h:90,fontSize:38,color:'#ffffff'}
 ];return C.validate(project);
}
test('multitrack compositor respects each independent start, duration and overlay',()=>{
 const p=demo();
 assert.deepEqual(M.visuals(p,.5).map(x=>x.id),['u-video-red']);
 assert.deepEqual(M.visuals(p,1.5).map(x=>x.id),['u-video-red','u-subtitle']);
 assert.deepEqual(M.visuals(p,2.5).map(x=>x.id),['u-video-blue','u-subtitle']);
 assert.deepEqual(M.visuals(p,5.01),[]);
 assert.deepEqual(M.audible(p,2.5).map(x=>x.id),['u-wav-1','u-wav-2']);
 assert.deepEqual(M.audible(p,4.5).map(x=>x.id),['u-wav-2']);
 assert.equal(M.soundSchedule(p)[1].start,2);
 assert.equal(M.soundSchedule(p)[1].volume,.8);
 assert.equal(V.plan(p).duration,8);
});
test('unlinked or unsupported media are rejected by normal project validation',()=>{
 const p=demo();
 p.tracks[0].mime='application/octet-stream';
 assert.throws(()=>C.validate(p),/형식이 올바르지/);
});
