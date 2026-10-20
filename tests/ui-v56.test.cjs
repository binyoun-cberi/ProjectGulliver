'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const paths={'홈':'index.html','제작실':'뚝딱 제작실.html','내 보관함':'내 보관함.html','수업 준비':'lesson.html'};
const names=['홈','만들기','내 보관함'];
test('principal screens share one navigation renderer instead of per-page menus',()=>{
 for(const path of [...Object.values(paths),'우리반.html']){
  const source=fs.readFileSync(path,'utf8');
  assert.match(source,/gulliver-app-shell\.js/,'missing application frame in '+path);
  assert.match(source,/gulliver-design\.css/,'missing shared controls in '+path);
  assert.doesNotMatch(source,/<nav class="gulliver-nav"/,'obsolete duplicate site menu in '+path);
 }
 const shell=fs.readFileSync('gulliver-app-shell.js','utf8');
 for(const label of [...names,'우리 반'])assert.ok(shell.includes("'"+label+"'"));
});
test('5.6 teacher-facing copy distinguishes four workspaces from local lists',()=>{
 const home=fs.readFileSync('index.html','utf8');
 const studio=fs.readFileSync('뚝딱 제작실.html','utf8');
 const library=fs.readFileSync('내 보관함.html','utf8');
 const lesson=fs.readFileSync('lesson.html','utf8');
 const css=fs.readFileSync('gulliver-ui-v56.css','utf8');
 assert.match(home,/전체 ZIP 백업/);
 assert.match(studio,/제작실 작업·소재함/);
 assert.match(library,/수업 준비에서 저장한 수업/);
 assert.match(lesson,/작업 열기/);
 assert.match(lesson,/보관함 자료 가져오기/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/body\.running>\.gulliver-nav/);
 const js=fs.readFileSync('studio-experience.js','utf8');
 assert.match(js,/bridge\.navigateAway\(\)/,'studio navigation must save before leaving');
 const lessonJs=fs.readFileSync('lesson-app.js','utf8');
 assert.match(lessonJs,/header\.bar a\[href\],\.gulliver-nav a\[href\]/);
});
