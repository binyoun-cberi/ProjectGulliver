'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const U=require('../studio-unified-core.js'),V=require('../studio-unified-video.js');
test('3.2 old canvas projects remain valid and export plan is deterministic',()=>{
 const legacy=U.starter('presentation');const p=V.plan(legacy);
 assert.equal(p.width,960);assert.equal(p.height,540);assert.equal(p.duration,5);
 const worksheet=U.starter('worksheet'),a=V.plan(worksheet);
 assert.equal(a.width,595);assert.equal(a.height,842);
 assert.equal(V.FPS,20);
});
test('3.2 refuses excessive 60+ second exports without dropping pages',()=>{
 const model=U.starter('blank');model.pages=[];
 for(let i=0;i<7;i++){const p=U.makePage('scene'+i);p.duration=10;model.pages.push(p)}
 assert.throws(()=>V.plan(model),/60초/);
 model.pages.splice(6,1);assert.equal(V.plan(model).duration,60);
});
test('3.2 renderer draws transitions, object opacity, animations and media safely',()=>{
 const project=U.starter('blank');project.pages[0].elements=[
  U.element('rect',{id:'box',x:20,y:10,w:120,h:90,fill:'#aaccff',opacity:.7,animation:'rise',delay:.25}),
  U.element('text',{id:'text',x:30,y:100,w:320,h:90,content:'첫 번째\n두 번째',animation:'fade'}),
  U.element('star',{id:'star',x:100,y:240,w:80,h:80}),
  U.element('ellipse',{id:'round',x:250,y:240,w:70,h:60}),
  U.element('triangle',{id:'tri',x:360,y:240,w:70,h:60}),
  U.element('line',{id:'line',x:90,y:300,w:220,h:25})
 ];
 project.pages[0].transition='fade';const p=U.validate(project),commands=[];
 const context=new Proxy({save(){},restore(){}},{get(target,key){
  if(key in target)return target[key];
  return(...args)=>commands.push([key,...args]);
 },set(target,key,value){target[key]=value;return true}});
 const initial=V.drawFrame(context,p,0,new Map());
 assert.equal(initial.index,0);
 assert.ok(commands.some(x=>x[0]==='fillText'&&x[1]==='첫 번째'));
 assert.ok(commands.some(x=>x[0]==='ellipse'));
 assert.ok(commands.some(x=>x[0]==='lineTo'));
 const next=U.makePage('slide two');next.duration=1;project.pages.push(next);
 assert.equal(V.drawFrame(context,U.validate(project),5.2,new Map()).index,1);
});
test('3.2 validates missing image resources and exact frame export format',()=>{
 const p=U.starter('blank');p.pages[0].elements=[U.element('image',{src:'data:image/png;base64,aGVsbG8='})];
 const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 assert.throws(()=>V.drawFrame(ctx,U.validate(p),.5,new Map()),/사진/);
 assert.equal(V.MAX_SECONDS,60);
});
