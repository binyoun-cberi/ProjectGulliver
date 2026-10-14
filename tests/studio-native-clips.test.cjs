'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Core=require('../studio-unified-core.js');
const Video=require('../studio-unified-video.js');
const read=name=>fs.readFileSync(name,'utf8');
test('native video clips persist through canvas normalization without changing older projects',()=>{
 const plain=Core.validate(Core.starter('blank'));
 assert.equal(Object.hasOwn(plain.pages[0],'videoClip'),false,'old projects keep their original shape');
 const p=Core.starter('presentation');p.pages[0].videoClip={mediaId:'u-video-1234',mime:'video/mp4',
  name:'바닷가 수업.mp4',inPoint:1.5,duration:2.5,muted:true};
 const safe=Core.validate(p);
 assert.deepEqual(safe.pages[0].videoClip,p.pages[0].videoClip);
 assert.equal(Core.validate(safe).pages[0].videoClip.inPoint,1.5);
 assert.throws(()=>Core.validate({...p,pages:[{...p.pages[0],videoClip:{...p.pages[0].videoClip,mediaId:'../bad'}}]}),/영상 클립/);
 assert.throws(()=>Core.validate({...p,pages:[{...p.pages[0],videoClip:{...p.pages[0].videoClip,mime:'application/javascript'}}]}),/영상 클립/);
});
test('WebM exporter fails clearly for embedded video until compositing is ready',()=>{
 const p=Core.starter('blank');p.pages[0].videoClip={mediaId:'u-video-1234',mime:'video/webm',name:'수업.webm',inPoint:0,duration:2,muted:true};
 assert.throws(()=>Video.plan(p),/영상 클립의 합성 출력은 아직 지원하지 않아요/);
 const html=read('통합 캔버스.html');
 assert.match(html,/studio-unified-clips\.js/);
 const widget=read('studio-unified-clips.js');
 for(const token of ['canvasVideoUpload','canvasVideoIn','canvasVideoLength','canvasVideoRemove','Adapter.setSceneVideoClip','Store.saveMedia','15*1024*1024'])
  assert.ok(widget.includes(token),token);
 const lib=read('studio-library.js');
 assert.match(lib,/통합 캔버스 영상 클립 원본이 백업에 빠져 있어요/);
});
