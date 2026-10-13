'use strict';
const testFn=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('../studio-media-core.js'),Music=require('../music-core.js'),C=require('../studio-core.js');
testFn('7개 제작실 중 음악·영상은 자동 저장 대상이고 파일 진입점이 존재',()=>{
 assert.equal(C.types().length,7);
 for(const kind of ['video','music']){assert.equal(C.managed(kind),true);assert.ok(fs.existsSync(C.TOOLS[kind].href));}
 assert.equal(C.detectLegacy(M.makeVideo()),'video');
 assert.equal(C.detectLegacy(M.makeMusic()),'music');
});
testFn('리듬박자와 악기 스텝은 16칸으로 제한하고 BPM과 길이를 보정',()=>{
 const x=M.makeMusic();x.bpm=999;x.loops=99;x.notes.hat=[0,0,18,-1,8];
 const y=M.validateMusic(x);
 assert.deepEqual(y.notes.hat,[0,8]);assert.equal(y.bpm,180);assert.equal(y.loops,8);
 assert.throws(()=>M.validateMusic({...x,notes:{hat:[]}}),/악기/);
});
testFn('음악 WAV가 재생 가능한 PCM RIFF 헤더와 유효한 데이터 크기를 생성',()=>{
 const bytes=Music.waveform(M.makeMusic());
 const text=(at,len)=>Buffer.from(bytes.slice(at,at+len)).toString('ascii');
 assert.equal(text(0,4),'RIFF');assert.equal(text(8,4),'WAVE');assert.equal(text(36,4),'data');
 const dv=new DataView(bytes.buffer);
 assert.equal(dv.getUint32(24,true),22050);
 assert.equal(dv.getUint32(40,true)+44,bytes.length);
 assert.ok(bytes.some((x,i)=>i>100&&x!==0),'음악 샘플은 무음이 아니어야 함');
});
testFn('영상은 최대 5장면/45초, 등록 미디어 형식을 검사',()=>{
 const v=M.makeVideo(),clip={mediaId:'id1',mime:'image/png',name:'교실',start:0,duration:4};
 v.clips.push(clip);assert.equal(M.durationOf(v),4);
 assert.equal(M.fileAllowed({type:'video/mp4',size:5000}),true);
 assert.equal(M.fileAllowed({type:'video/quicktime',size:1000}),false);
 assert.throws(()=>M.validateVideo({...v,clips:Array(6).fill(clip)}),/최대 5/);
 assert.throws(()=>M.validateVideo({...v,clips:[{...clip,mediaId:'../../../x'}]}),/올바르지/);
});
testFn('통합 백업에는 영상 원본과 음악 프로젝트 복원을 위한 미디어 스토어가 있다',()=>{
 const store=fs.readFileSync('studio-storage.js','utf8');
 const library=fs.readFileSync('studio-library.js','utf8');
 assert.match(store,/DB_VERSION=3/);assert.match(store,/createObjectStore\('media'/);
 assert.match(library,/mediaIdMap/);assert.match(library,/media:videoMedia/);
 assert.match(library,/await S\.importBatch\(\{projects:newProjects,assets:newAssets,folders:newFolders,media:newMedia\}\)/);
});
