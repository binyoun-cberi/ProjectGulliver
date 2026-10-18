'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../studio-lesson-archive.js');
const make=()=>({version:1,id:'lesson1',title:'사계절 수업',goal:'계절 구별',audience:'한빛반',position:0,createdAt:1,updatedAt:2,steps:[
 {id:'step1',kind:'pdf',assetId:'pdf-1'},{id:'step2',kind:'audio',assetId:'wav-1'}]});
test('5.5 archive rejects missing lesson media, repeated IDs and inflated sizes before writing',()=>{
 const lesson=make(),assets=[{id:'pdf-1',size:25,mime:'application/pdf'},{id:'wav-1',size:22,mime:'audio/wav'}];
 assert.deepEqual(A.checkList([lesson],assets),{lessons:1,assets:2,bytes:47});
 assert.throws(()=>A.checkList([lesson],assets.slice(0,1)),/빠졌/);
 assert.throws(()=>A.checkList([lesson,lesson],assets),/중복|손상/);
 assert.throws(()=>A.checkList([lesson],[assets[0],assets[0]]),/원본 파일/);
 assert.throws(()=>A.checkList([lesson],[{...assets[0],size:101*1024*1024},assets[1]]),/원본 파일/);
 assert.throws(()=>A.checkList([],Array.from({length:181},(_,i)=>({id:String(i),size:1,mime:'audio/wav'}))),/180개/);
});
test('5.5 a fresh restore remaps lesson, step and binary IDs but does not touch originals',()=>{
 const row=make(),original=JSON.stringify(row);
 const assets=[{id:'pdf-1',name:'활동지.pdf',mime:'application/pdf',size:3,blob:new Blob(['pdf'],{type:'application/pdf'})},
 {id:'wav-1',name:'노래.wav',mime:'audio/wav',size:3,blob:new Blob(['wav'],{type:'audio/wav'})}];
 let counter=0;const n=()=> 'new-'+(++counter);
 const staged=A.prepare([row],assets,n,v=>structuredClone(v));
 assert.equal(staged.lessons[0].id,'new-3');
 assert.deepEqual(staged.lessons[0].steps.map(s=>s.assetId),['new-1','new-2']);
 assert.equal(staged.lessons[0].goal,'계절 구별');
 assert.equal(staged.lessons[0].steps[0].id,'new-4');
 assert.equal(staged.assets[0].blob,assets[0].blob);
 assert.equal(JSON.stringify(row),original);
 assert.throws(()=>A.prepare([row],[{...assets[0],size:1},assets[1]],n,structuredClone),/크기/);
});
