'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../studio-core.js');
const L=require('../studio-library-core.js');
const D=require('../doan-core.js');
test('프로젝트 검색·종류·폴더·날짜·이름 정렬이 동작',()=>{
 const cases=[
  {title:'가을 발표',kind:'slides',folderId:'f1',updatedAt:3},
  {title:'가을 도안',kind:'design',folderId:'f2',updatedAt:1},
  {title:'봄 문서',kind:'document',folderId:'',updatedAt:2}
 ];
 assert.deepEqual(L.filterProjects(cases,{query:'가을'}).map(x=>x.kind),['slides','design']);
 assert.deepEqual(L.filterProjects(cases,{folder:'f2'}).map(x=>x.kind),['design']);
 assert.deepEqual(L.filterProjects(cases,{folder:'unfiled'}).map(x=>x.kind),['document']);
 assert.deepEqual(L.filterProjects(cases,{kind:'design'}).map(x=>x.kind),['design']);
 assert.deepEqual(L.filterProjects(cases,{sort:'old'}).map(x=>x.kind),['design','document','slides']);
 assert.deepEqual(L.filterProjects(cases,{sort:'name'}).map(x=>x.title),['가을 도안','가을 발표','봄 문서']);
});
test('기존 프로젝트를 읽고 저장해도 폴더 값이 유지',()=>{
 const p=C.normalizeProject({id:'old',kind:'design',title:'교실 도안',folderId:'folder_12',payload:D.makeTemplate('emotion')});
 assert.equal(p.folderId,'folder_12');
 assert.equal(C.normalizeProject({id:'old',kind:'design',title:'교실 도안',payload:D.makeTemplate('emotion')}).folderId,'');
});
test('통합 백업 버전·개수·사진 형식·위험한 확장자를 제한',()=>{
 const valid={format:L.MAGIC,version:1,folders:[],projects:[],assets:[],activities:{version:1,folders:[],activities:[]}};
 assert.deepEqual(L.checkedManifest(valid),valid);
 assert.deepEqual(L.summary(valid),{projects:0,assets:0,folders:0,activities:0,media:0});
 assert.throws(()=>L.checkedManifest({...valid,version:99}),/통합 백업/);
 assert.throws(()=>L.checkedManifest({...valid,projects:[] ,assets:[...Array(151)]}),/개수/);
 assert.throws(()=>L.checkedManifest({...valid,activities:{version:4,folders:[],activities:[]}}),/기존 내 활동/);
 assert.equal(L.dataUriValid('data:image/png;base64,aGVsbG8=','image/png'),true);
 assert.equal(L.dataUriValid('data:image/svg+xml;base64,PHN2Zz4=','image/svg+xml'),false);
 assert.equal(L.dataUriValid('https://school.example/photo.png','image/png'),false);
 assert.equal(L.folderName('  수업\n 자료  '),'수업  자료');
});
test('기존 도구 데이터와 신규 보관함 검색/복원 UI가 실제 연결',()=>{
 const html=fs.readFileSync('뚝딱 제작실.html','utf8');
 const js=fs.readFileSync('studio-library.js','utf8');
 for(const id of ['librarySearch','libraryFolder','librarySort','libraryKind','libraryBackup','libraryRestore','folderDialog','legacyActivityList']){
  assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(js.includes("'"+id+"'"),id);
 }
 assert.match(js,/S\.importBatch/);
 assert.match(js,/W\.importBundle/);
 assert.match(js,/await B\.sync\(true\)/);
 const storage=fs.readFileSync('studio-storage.js','utf8');
 assert.match(storage,/DB_VERSION=3/);
 assert.ok(storage.includes("db.transaction(['folders','projects','assets','media'],'readwrite')"));
});
