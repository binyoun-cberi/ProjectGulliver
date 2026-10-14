'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Canva editor offers a desktop left rail, mobile bottom navigation and contextual tools',()=>{
 const html=read('통합 캔버스.html'),js=read('studio-canvas-shell.js'),css=read('studio-canvas-shell.css'),outer=read('studio-canvas-parent.css');
 assert.match(html,/studio-canvas-shell\.css/);
 assert.match(html,/studio-canvas-shell\.js/);
 assert.match(js,/dataset\.designTab/);
 for(const name of ['templates','elements','text','uploads','pages','motion','teacher','properties','export'])
  assert.ok(js.includes("id:'"+name+"'"),'navigation '+name);
 assert.match(js,/sourceClick\(/);
 assert.match(css,/grid-template-columns:70px 268px minmax\(0,1fr\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/\.design-nav\{position:fixed;inset:auto 0 0/);
 assert.match(css,/\.panel-open \.design-panel/);
 assert.match(css,/\.canvas-selection-bar/);
 assert.match(outer,/body\.studio-canvas \.studio-mobile-bar\{display:none/);
 assert.match(outer,/body\.studio-canvas \.shell>\.nav\{display:none/);
});
test('Native edit, project and export controls remain in original documents',()=>{
 const html=read('통합 캔버스.html');
 for(const id of ['stage','stageView','propertyText','propertyFill','newPage','clonePage','exportPng','printPdf','exportWebm','timelinePlay','rosterDialog'])
  assert.ok(html.includes('id="'+id+'"'),id+' preserved');
 const bridge=read('studio-experience.js');
 assert.match(bridge,/canvasParentBack/);
 assert.match(bridge,/canvasParentTools/);
});