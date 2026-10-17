'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../media-timeline.js');
const text=name=>fs.readFileSync(new URL('../'+name,'file://'+__filename),'utf8');
const sample=[{mediaId:'a',mime:'image/png',name:'사진',duration:4,start:0},{mediaId:'b',mime:'video/mp4',name:'영상',duration:12,start:1},{mediaId:'c',mime:'image/jpeg',name:'활동',duration:3,start:0}];
test('5.2 clip resize clamps to 0.5~20 seconds without changing other clips or mutating source',()=>{
 const snapshot=JSON.stringify(sample);
 let result=P.resize(sample,1,25);
 assert.equal(result[1].duration,20);
 assert.equal(result[0].duration,4);assert.equal(result[2].duration,3);
 assert.equal(JSON.stringify(sample),snapshot);
 result=P.resize(sample,1,-80);
 assert.equal(result[1].duration,.5);
 assert.equal(P.total(result),7.5);
 assert.throws(()=>P.resize(sample,7,1),/찾지 못/);
});
test('5.2 total duration never exceeds 45 seconds during drag',()=>{
 const clips=[{duration:20},{duration:18},{duration:5}];
 assert.equal(P.bounds(clips,2).max,7);
 assert.equal(P.resize(clips,2,20)[2].duration,7);
 assert.equal(P.total(P.dragDuration(clips,2,5,10000,400)),45);
 assert.equal(P.dragDuration(clips,0,20,-10000,400)[0].duration,.5);
 assert.ok(P.total(P.dragDuration(clips,0,20,180,400))<=45);
 assert.equal(P.total(P.dragDuration(clips,0,20,18,0)),43);
});
test('5.2 visual clip positions and selection preserve precise boundaries',()=>{
 const positions=P.segments(sample);
 assert.equal(positions[0].left,0);
 assert.equal(positions[0].width,4/45*100);
 assert.equal(positions[1].left,4/45*100);
 assert.equal(P.find(sample,3.99),0);
 assert.equal(P.find(sample,4),1);
 assert.equal(P.find(sample,16),2);
 assert.equal(P.find([],5),-1);
 assert.equal(P.stamp(65.5),'1:05');
});
test('5.2 editing UI links reusable media, two timelines and explicit save notices',()=>{
 const video=text('영상 뚝딱.html'),music=text('음악 뚝딱.html'),
       vjs=text('video-ttak.js'),mjs=text('music-ttak.js'),mode=text('studio-official-media.js');
 for(const html of [video,music]){
  assert.match(html,/media-editors-v52\.css/);
  assert.match(html,/workflow-save/);
  assert.match(html,/내 보관함/);
 }
 assert.match(video,/id="mediaShelf"/);
 assert.match(video,/id="timelineOverview"/);
 assert.match(video,/id="selectedClipLength"/);
 assert.match(video,/media-timeline\.js/);
 assert.match(vjs,/P\.dragDuration/);
 assert.match(vjs,/S\.getMedia/);
 assert.match(music,/id="musicRuler"/);
 assert.match(music,/id="musicScrub"/);
 assert.match(mjs,/audioPreview.*addEventListener/);
 assert.match(mode,/requestedAdvanced&&!userSelectedMode/);
 assert.doesNotMatch(mode,/requestedOfficialId\|\|!restoreQuick/);
});
