'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../studio-unified-core.js'),V=require('../studio-unified-video.js');
const item=(id,x,y,w=60,h=30,more={})=>C.element('rect',{id,x,y,w,h,...more});
test('4.0-B rotation applies around group centroid and persists in v1 format',()=>{
 const a=item('a',0,0,20,20),b=item('b',80,0,20,20),both=C.rotateSelection([a,b],90);
 assert.equal(both[0].rotation,90);assert.equal(both[1].rotation,90);
 assert.equal(both[0].x,40);assert.equal(both[0].y,-40);
 assert.equal(both[1].x,40);assert.equal(both[1].y,40);
 assert.equal(C.normalizeAngle(270),-90);
 const project=C.starter('blank');const group=C.groupId();project.pages[0].elements=both.map(e=>({...e,groupId:group}));
 const saved=C.validate(JSON.parse(JSON.stringify(project)));assert.equal(saved.pages[0].elements[0].rotation,90);
 assert.equal(saved.pages[0].elements[1].groupId,group);
});
test('4.0-B alignment and distribution keep correct gaps and stable order',()=>{
 const items=[item('a',10,20,20,10),item('b',48,50,20,10),item('c',110,90,20,10)];
 assert.deepEqual(C.alignSelection([items[0]],'center',{w:200,h:100})[0].x,90);
 assert.deepEqual(C.alignSelection(items,'left').map(x=>x.x),[10,10,10]);
 assert.deepEqual(C.alignSelection(items,'middle').map(x=>x.y),[50,50,50]);
 assert.deepEqual(C.distributeSelection(items,'horizontal').map(x=>x.x),[10,60,110]);
 assert.deepEqual(C.distributeSelection(items,'vertical').map(x=>x.y),[20,55,90]);
});
test('4.0-B snapping works for page center, peer edge and can be bypassed by caller',()=>{
 const p=C.snapSelection({x:93,y:25,w:20,h:20},[],{w:200,h:100},8);
 assert.equal(p.x,90);assert.deepEqual(p.guides,[{axis:'x',position:100}]);
 const peer=item('peer',50,80,20,20);
 const q=C.snapSelection({x:72,y:101,w:30,h:20},[peer],{w:300,h:250},4);
 assert.equal(q.x,70);assert.equal(q.y,100);
 const rotated=C.rotatedBounds(item('rot',10,20,40,20,{rotation:90}));
 assert.deepEqual({x:rotated.x,y:rotated.y,w:rotated.w,h:rotated.h},{x:20,y:10,w:20.000000000000004,h:40});
});
test('4.0-B layer order retains all IDs; locked and hidden survive serialization',()=>{
 const a=item('a',0,0),b=item('b',20,0),c=item('c',40,0),d=item('d',60,0);
 assert.deepEqual(C.reorderLayers([a,b,c,d],['b','c'],'up').map(x=>x.id),['a','d','b','c']);
 assert.deepEqual(C.reorderLayers([a,b,c,d],['b','c'],'down').map(x=>x.id),['b','c','a','d']);
 assert.deepEqual(C.reorderLayers([a,b,c,d],['b','c'],'front').map(x=>x.id),['a','d','b','c']);
 const project=C.starter('blank');project.pages[0].elements=[{...a,locked:true,hidden:true,rotation:65},{...b,rotation:35}];
 const safe=C.validate(project);
 assert.equal(safe.pages[0].elements[0].locked,true);assert.equal(safe.pages[0].elements[0].hidden,true);
 assert.equal(safe.pages[0].elements[0].rotation,65);
 const turns=[];const context=new Proxy({},{get(_,key){if(key==='canvas')return {};return (...args)=>{turns.push([key,...args])}}});
 V.drawFrame(context,safe,0,new Map());
 assert.equal(turns.filter(x=>x[0]==='rotate').length,1);
 assert.ok(Math.abs(turns.find(x=>x[0]==='rotate')[1]-35*Math.PI/180)<1e-9);
});
