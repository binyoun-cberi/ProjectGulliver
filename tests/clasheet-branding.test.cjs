const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=(name)=>fs.readFileSync(name,'utf8');
test('클라시트 브랜드가 홈, 문제지, 시간 도구, 학생 화면에 반영된다',()=>{
 for(const name of ['index.html','문제지 만들기.html','시간 도구.html','gulliver-teacher-display.html','우리반.html']){
  const page=read(name);
  assert.match(page,/클라시트/,name);
  assert.doesNotMatch(page,/매일 수업|뚝딱교실/,name);
  assert.match(page,/clasheet-mark\.svg/,name);
 }
 assert.match(read('workspace-home.js'),/home:\['오늘 수업, 여기서 시작하세요'/);
 assert.match(read('gulliver-app-shell.js'),/클라시트 주요 메뉴/);
 assert.match(read('gulliver-teacher-display-view.js'),/클라시트 · 학급 운영/);
 assert.match(read('gulliver-shared.js'),/클라시트/);
});
test('브랜드 변경 뒤에도 학급 기록 키와 백업 데이터 구조를 유지한다',()=>{
 assert.match(read('clasheet-mark.svg'),/<svg[\s\S]*<\/svg>/);
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.short_name,'클라시트');
 assert.equal(manifest.start_url,'./index.html');
 assert.match(read('classroom-workspace.js'),/gulliver\.activities\.v1/);
 assert.match(read('classroom-workspace.js'),/클라시트_내활동_/);
});
