'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),M=require('../studio-unified-multitrack-export.js'),W=require('../studio-unified-waveform.js');
test('audio mix settings persist across old and new projects',()=>{
 const p=C.starter('blank');p.pages[0].duration=12;
 p.tracks=[
  {id:'u-video-1',kind:'video',mediaId:'u-file-1',mime:'video/mp4',name:'교육 영상',start:0,duration:5,muted:false,volume:.65,fadeIn:1,fadeOut:1,x:0,y:0,w:960,h:540},
  {id:'u-audio-1',kind:'audio',mediaId:'u-wav-1',mime:'audio/wav',name:'음악',start:2,duration:5,volume:.4,fadeIn:.5,fadeOut:1}
 ];
 const safe=C.validate(p),loaded=C.validate(JSON.parse(JSON.stringify(safe)));
 assert.deepEqual(safe,loaded);
 assert.equal(loaded.tracks[0].muted,false);assert.equal(loaded.tracks[0].volume,.65);
 assert.equal(loaded.tracks[0].fadeIn,1);assert.equal(loaded.tracks[0].fadeOut,1);
 assert.equal(M.audible(loaded,2.5).length,2);
 assert.equal(M.gainAt(loaded.tracks[0],0),0);
 assert.equal(M.gainAt(loaded.tracks[0],.5),.325);
 assert.equal(M.gainAt(loaded.tracks[0],2),.65);
 assert.equal(M.gainAt(loaded.tracks[0],4.5),.325);
 assert.equal(M.gainAt(loaded.tracks[0],5),0);
 assert.equal(M.gainAt({...loaded.tracks[0],muted:true},2),0);
 const previous=C.starter('blank');previous.tracks=[{id:'u-video-1',kind:'video',mediaId:'u-file-1',mime:'video/mp4',duration:2,muted:true,start:0}];
 assert.equal(C.validate(previous).tracks[0].fadeIn,0);
 assert.equal(C.validate(previous).tracks[0].fadeOut,0);
});
test('audio gain automation follows the saved clip start and fades',()=>{
 const calls=[];
 const gain={setValueAtTime:(v,t)=>calls.push(['set',v,t]),linearRampToValueAtTime:(v,t)=>calls.push(['ramp',v,t])};
 M.applyFadeAutomation(gain,{volume:.8,duration:3,fadeIn:.5,fadeOut:1},10);
 assert.deepEqual(calls,[['set',0,10],['ramp',.8,10.5],['set',.8,12],['ramp',0,13]]);
});
test('waveform extracts real samples, represents silence, fades the displayed outline',()=>{
 assert.deepEqual(W.computePeaks(new Float32Array([0,0,.75,-1,.2,.1,0,0]),4).map(x=>Math.round(x*100)/100),[0,1,.2,0]);
 assert.deepEqual(W.computePeaks(new Float32Array(256),16),Array(16).fill(0));
 assert.equal(W.amplitude({duration:4,fadeIn:1,fadeOut:1,volume:.6},.5),.3);
 assert.equal(W.amplitude({duration:4,fadeIn:1,fadeOut:1,volume:.6},3.5),.3);
 assert.equal(W.amplitude({duration:4,fadeIn:1,fadeOut:1,volume:.6},4),0);
});
