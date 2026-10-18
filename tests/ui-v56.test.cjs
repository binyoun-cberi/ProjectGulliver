'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const paths={'홈':'index.html','제작실':'뚝딱 제작실.html','내 보관함':'내 보관함.html','수업 준비':'lesson.html'};
const names=['홈','제작실','내 보관함','수업 준비'];
test('5.6 every principal screen has the same four workspaces, in the same order',()=>{
 for(const [name,path] of Object.entries(paths)){
  const s=fs.readFileSync(path,'utf8');
  assert.match(s,/gulliver-ui-v56\.css/,'missing design system in '+path);
  const nav=s.match(/<nav class="gulliver-nav"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav,'missing shared navigation '+name);
  const a=[...nav[1].matchAll(/<a href="([^"]+)"([^>]*)><span class="gulliver-nav-symbol"[^>]*>[^<]*<\/span><span>([^<]+)<\/span><\/a>/g)];
  assert.equal(a.length,4,name+' must expose all 4 main destinations');
  assert.deepEqual(a.map(x=>x[3]),names,'inconsistent naming or order '+name);
  assert.equal(a.filter(x=>x[2].includes('aria-current="page"')).length,1,'only current workspace is selected '+name);
  assert.equal(a.find(x=>x[2].includes('aria-current="page"'))[3],name);
  assert.ok(s.includes('gulliver-location-note'),name+' current-location hint missing');
 }
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
 assert.match(lesson,/저장한 수업/);
 assert.match(lesson,/보관함 자료 가져오기/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/body\.running>\.gulliver-nav/);
 const js=fs.readFileSync('studio-experience.js','utf8');
 assert.match(js,/bridge\.navigateAway\(\)/,'studio navigation must save before leaving');
 const lessonJs=fs.readFileSync('lesson-app.js','utf8');
 assert.match(lessonJs,/header\.bar a\[href\],\.gulliver-nav a\[href\]/);
});
