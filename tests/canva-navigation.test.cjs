'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('daily lesson home routes five subjects to the same worksheet generator',()=>{
 const html=read('index.html'),home=read('workspace-home.js'),shell=read('gulliver-app-shell.js');
 assert.match(html,/<title>매일 수업/);
 assert.match(html,/href="문제지 만들기\.html"/);
 assert.doesNotMatch(html,/id="createDialog"|id="browseTemplates"|data-view="templates"/);
 for(const key of ['korean','math','social','science','english'])assert.ok(home.includes("['"+key+"'"));
 assert.match(home,/href="문제지 만들기\.html\?subject=/);
 assert.match(shell,/\['worksheet', '문제지', '문제지 만들기\.html'\]/);
 assert.match(shell,/\['tools', '교사 도구', 'index\.html\?view=tools'\]/);
 assert.match(home,/id="unifiedHomeRecent"/);
 assert.doesNotMatch(home,/function allTemplates|function templateCard|else if\(view==='templates'\)/);
 assert.doesNotMatch(html,/workspace-template-catalog\.js|studio-unified-core\.js|studio-media-core\.js/);
 const library=read('내 보관함.html');
 assert.match(library,/href="문제지 만들기\.html">＋ 새 문제지 만들기/);
 assert.doesNotMatch(library,/href="뚝딱 제작실\.html">＋ 제작실에서 만들기/);
 assert.match(html,/workspace-experience\.css/);
});

test('Studio mobile panel and deep links use the existing editor bridge',()=>{
 const html=read('뚝딱 제작실.html'),js=read('studio-experience.js'),css=read('studio-experience.css');
 for(const name of ['studioMobileBar','studioToolPicker','studioBottomEdit','canvasMobileShade']){
  assert.ok(html.includes('id="'+name+'"'),name);
 }
 for(const name of ['home','tools','edit','projects','new']){
  assert.ok(html.includes('data-studio-action="'+name+'"'),name);
 }
 assert.match(html,/studio-experience\.css/);
 assert.match(html,/studio-experience\.js/);
 assert.match(js,/bridge\.start\(requested,null,'',preset\)/);
 assert.match(html,/data-canvas-template="worksheet"/);
 assert.match(js,/bridge\.start\(kind\)/);
 assert.match(js,/layout\?\.setRight\('projects'\)/);
 assert.match(css,/canvas-library-open \.sidebar/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
});

test('legacy video/audio editors remain intact but are absent from the daily home',()=>{
 const html=read('index.html'),home=read('workspace-home.js');
 for(const name of ['영상 뚝딱','음악 뚝딱']){
  assert.ok(fs.existsSync(path.join(__dirname,'..',name+'.html')));
  assert.doesNotMatch(html,new RegExp('href="'+name+'\\.html"'));
 }
 assert.match(home,/ClassroomTools\.filter/);
});
