'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../pinball-race-progress'),M=require('../vendor/matter.min');
test('route distance follows an opening instead of sorting by height',()=>{
 const wall=M.Bodies.rectangle(600,500,600,20,{isStatic:true,label:'rail'});
 const map=V.makeProgressMap([wall],{width:900,height:1000,radius:11});
 assert.ok(map.distanceAt(800,450)>map.distanceAt(100,420)+200);
 const ball=(index,x,y)=>({index,body:{position:{x,y}},finished:false});
 const ranked=V.rankBalls([ball(0,800,450),ball(1,100,420)],map);
 assert.deepEqual(ranked.map(b=>b.index),[1,0]);
});
const ball=(index,x,y,distance=1000)=>({index,name:'학생'+index,routeDistance:distance,body:{position:{x,y}},finished:false});
const input=ranked=>({ranked,remaining:1,viewWidth:1200,viewHeight:720,finishY:2200,worldHeight:2350,dt:16.67});
test('camera holds a subject through momentary rank noise and switches after persistence',()=>{
 const c=V.createCamera(),a=ball(0,300,650),b=ball(1,520,640);
 c.update(input([a,b]));assert.equal(c.camera.subject,0);
 for(let i=0;i<10;i++)c.update(input([b,a]));assert.equal(c.camera.subject,0);
 for(let i=0;i<15;i++)c.update(input([b,a]));assert.equal(c.camera.subject,1);
 c.update({...input([b,a]),focusedName:a.name});assert.equal(c.camera.subject,0);
 c.reset();assert.equal(c.camera.subject,null);
});
test('cutoff camera frames the competing last-place candidates, with shared slow motion',()=>{
 const c=V.createCamera(),balls=[ball(0,320,2190,10),ball(1,430,2140,60),ball(2,520,2120,80)];
 for(let i=0;i<100;i++)c.update({...input(balls),remaining:2,arrived:3});
 assert.equal(c.camera.subject,1);assert.equal(c.camera.rival,2);assert.equal(c.camera.slowMotion,.55);
 for(const b of balls.slice(1)){
  const x=(b.body.position.x-c.camera.x)*c.camera.zoom+600,y=(b.body.position.y-c.camera.y)*c.camera.zoom+360;
  assert.ok(x>0&&x<1200&&y>0&&y<720);
 }
});
