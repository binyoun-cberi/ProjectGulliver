'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const studioCore=require('../studio-core.js');

test('Canva-style home has real linked formats with matching studio implementations',()=>{
 const html=read('index.html'),home=read('workspace-home.js'),css=read('workspace-experience.css');
 const formats=[...home.matchAll(/\['(?:presentation|worksheet|document|video|music)','[^']+','([^']+)'/g)].map(x=>x[1]);
 assert.deepEqual(formats,['canvas','canvas','document','video','music']);
 formats.forEach(kind=>assert.ok(studioCore.TOOLS[kind],kind+' editor exists'));
 for(const preset of ['blank','presentation','worksheet']){
  assert.ok(html.includes('href="뚝딱 제작실.html?new=canvas&amp;template='+preset+'"'));
 }
 for(const kind of ['slides','document','design','picture','pdf','video','music']){
  assert.ok(html.includes('href="뚝딱 제작실.html?new='+kind+'"'));
 }
 assert.match(html,/href="lesson\.html"/);
 // The shared site navigation links to the lesson workspace. It is not an
 // additional editor mode inside the specialist tool picker.
 const studio=read('뚝딱 제작실.html');
 assert.match(studio,/class="gulliver-nav"[\\s\\S]*?href="lesson\\.html"/);
 const picker=studio.slice(studio.indexOf('<dialog class="studio-picker"'));
 assert.doesNotMatch(picker,/data-studio-action="lesson"|data-canvas-template="lesson"/);
 assert.match(html,/class="home-bottom-bar"/);
 assert.match(html,/workspace-experience\.css/);
 assert.match(home,/templates\.slice\(0,2\)/);
 assert.match(home,/studio-library-link/);
 assert.match(css,/@media\(max-width:460px\)/);
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

test('Separate video/audio native editors remain reachable',()=>{
 const html=read('index.html'),home=read('workspace-home.js');
 for(const name of ['영상 뚝딱','음악 뚝딱']){
  assert.ok(home.includes(name==='영상 뚝딱'?"'video','영상'":"'music','음악'"));
  assert.ok(html.includes('href="'+name+'.html"'));
 }
});