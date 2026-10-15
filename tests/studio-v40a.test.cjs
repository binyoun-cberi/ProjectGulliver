'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../studio-unified-core.js');

function fixture(){
 const value=C.starter('blank');
 value.pages[0].elements=[
  C.element('text',{id:'label',x:20,y:30,w:150,h:50,content:'우리 반',fontSize:30}),
  C.element('rect',{id:'border',x:10,y:20,w:190,h:100}),
  C.element('ellipse',{id:'badge',x:210,y:30,w:60,h:60})
 ];
 return value;
}
test('4.0-A: group geometry transforms preserve all child types and content',()=>{
 const project=fixture(),group=C.groupId();
 for(const item of project.pages[0].elements)item.groupId=group;
 const original=C.validate(project),items=original.pages[0].elements;
 assert.equal(new Set(items.map(e=>e.groupId)).size,1);
 const bounds=C.selectionBounds(items);
 assert.deepEqual(bounds,{x:10,y:20,w:260,h:100});
 const moved=C.transformSelection(items,bounds,{x:30,y:50,w:520,h:200});
 assert.equal(moved[0].content,'우리 반');assert.equal(moved[0].type,'text');
 assert.deepEqual([moved[0].x,moved[0].y,moved[0].w,moved[0].h,moved[0].fontSize],[50,70,300,100,60]);
 assert.equal(moved[2].type,'ellipse');assert.equal(moved[2].x,430);
 original.pages[0].elements=moved;
 const saved=JSON.parse(JSON.stringify(C.validate(original)));
 assert.equal(saved.pages[0].elements[0].groupId,group);
 assert.deepEqual(C.validate(saved),saved,'serialized project round-trips');
});
test('4.0-A: normalized legacy objects and optional fields remain compatible',()=>{
 const legacy=fixture(),out=C.validate(legacy);
 assert.equal(out.format,'gulliver.unified.canvas.v1');
 assert.equal(out.pages[0].elements.some(e=>e.groupId),false);
 const image=C.element('rect',{id:'round',rotation:360,locked:true,hidden:true,groupId:'invalid'});
 legacy.pages[0].elements.push(image);
 const clean=C.validate(legacy).pages[0].elements[3];
 assert.equal(clean.rotation,180);assert.equal(clean.locked,true);assert.equal(clean.hidden,true);
 assert.equal(clean.groupId,undefined);
});
test('4.0-A: orphan groups disappear and reused group IDs across pages are isolated',()=>{
 const value=fixture(),group=C.groupId();
 value.pages[0].elements[0].groupId=group;value.pages[0].elements[1].groupId=group;
 const page2=JSON.parse(JSON.stringify(value.pages[0]));page2.id='page-2';
 page2.elements=page2.elements.map(e=>({...e,id:'copy-'+e.id}));
 value.pages.push(page2);
 const normalized=C.validate(value);
 const one=normalized.pages[0].elements[0].groupId,two=normalized.pages[1].elements[0].groupId;
 assert.ok(one.startsWith('g-'));assert.ok(two.startsWith('g-'));assert.notEqual(one,two);
 normalized.pages[0].elements.splice(1,1);
 assert.equal(C.validate(normalized).pages[0].elements[0].groupId,undefined);
 const invalid=fixture();invalid.pages[0].elements[0].id=invalid.pages[0].elements[1].id;
 assert.throws(()=>C.validate(invalid),/중복/);
});
