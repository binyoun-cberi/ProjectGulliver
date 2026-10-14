'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js');
test('3.1 old 3.0 canvas files load with safe playback defaults',()=>{
 const old=C.starter('presentation');
 delete old.audio;
 for(const p of old.pages){delete p.duration;delete p.transition;for(const e of p.elements){delete e.animation;delete e.delay}}
 const restored=C.validate(old);
 assert.equal(restored.audio,null);
 assert.equal(restored.pages[0].duration,5);
 assert.equal(restored.pages[0].transition,'none');
 assert.ok(restored.pages[0].elements.every(e=>e.animation==='none'&&e.delay===0));
});
test('3.1 timing locates variable length scenes and clamps duration',()=>{
 const p=C.starter('presentation');p.pages[0].duration=2.5;
 p.pages.push(C.makePage('둘째'));p.pages[1].duration=4;
 const clean=C.validate(p);
 assert.equal(C.totalDuration(clean),6.5);
 assert.deepEqual(C.locateTime(clean,0),{index:0,local:0,start:0,total:6.5});
 assert.deepEqual(C.locateTime(clean,2.5),{index:1,local:0,start:2.5,total:6.5});
 assert.deepEqual(C.locateTime(clean,5),{index:1,local:2.5,start:2.5,total:6.5});
 assert.equal(C.locateTime(clean,100).local,4);
 p.pages[0].duration=99;p.pages[1].duration=-4;
 const clamped=C.validate(p);assert.equal(clamped.pages[0].duration,20);assert.equal(clamped.pages[1].duration,1);
});
test('3.1 object fade/rise/zoom effects respect delays and end in editable state',()=>{
 const source=C.element('text',{animation:'rise',delay:1});
 assert.deepEqual(C.animationFrame(source,.9),{opacity:0,x:0,y:36,scale:1});
 assert.equal(C.animationFrame(source,2).opacity,1);
 assert.equal(C.animationFrame(source,2).y,0);
 assert.deepEqual(C.animationFrame({...source,animation:'none'},0),{opacity:1,x:0,y:0,scale:1});
 assert.equal(C.animationFrame({...source,animation:'zoom'},1).scale,.8);
 assert.equal(C.animationFrame({...source,animation:'zoom'},3).scale,1);
 const page=C.makePage();page.transition='fade';page.duration=5;
 assert.equal(C.transitionFrame(page,0).opacity,0);
 assert.equal(C.transitionFrame(page,1).opacity,1);
 page.transition='slide';assert.equal(C.transitionFrame(page,0).slide,55);
 assert.equal(C.transitionFrame(page,1).slide,0);
});
test('3.1 rejects invalid music references, clamps settings, and preserves WAV metadata',()=>{
 const p=C.starter('blank');
 p.audio={mediaId:'wav_1',mime:'audio/wav',name:'한빛반 음악',volume:.45,loop:false};
 p.pages[0].elements=[C.element('text',{animation:'fade',delay:.5})];
 const restored=C.validate(p);
 assert.deepEqual(restored.audio,{...p.audio,trimStart:0,trimDuration:60});
 assert.equal(restored.pages[0].elements[0].delay,.5);
 assert.throws(()=>C.validate({...p,audio:{...p.audio,mediaId:'../danger'}}),/배경음악/);
 assert.throws(()=>C.validate({...p,audio:{...p.audio,mime:'audio/mpeg'}}),/배경음악/);
 p.pages[0].transition='bogus';p.pages[0].elements[0].animation='bogus';
 assert.equal(C.validate(p).pages[0].transition,'none');
 assert.equal(C.validate(p).pages[0].elements[0].animation,'none');
});
