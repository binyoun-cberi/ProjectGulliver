const {test}=require('node:test'),assert=require('node:assert/strict');const {balancedPlan}=require('../daily-worksheet-pagination.js');
function counts(plan,units){return plan.map(([a,b])=>units.slice(a,b).reduce((n,u)=>n+u.length,0))}
test('twenty equal questions split ten/ten instead of thirteen/seven',()=>{const units=Array.from({length:20},()=>[{}]);const plan=balancedPlan(units,(a,b,first)=>b-a<=(first?13:15));assert.deepEqual(counts(plan,units),[10,10])});
test('small sheets stay on one page; minimum page count takes priority',()=>{for(const n of [5,6,8,10,12,20]){const units=Array.from({length:n},()=>[{}]);assert.deepEqual(counts(balancedPlan(units,()=>true),units),[n])}});
test('balance respects measured capacity rather than forcing ten per sheet',()=>{const units=Array.from({length:20},()=>[{}]);assert.deepEqual(counts(balancedPlan(units,(a,b,first)=>b-a<=(first?8:15)),units),[8,12])});
test('reading groups remain intact and in source order',()=>{const units=Array.from({length:4},()=>Array(5).fill({}));const plan=balancedPlan(units,(a,b)=>5*(b-a)<=10);assert.deepEqual(plan,[[0,2],[2,4]]);assert.deepEqual(counts(plan,units),[10,10])});
test('three-page partition differs by at most one for equal tasks',()=>{const units=Array.from({length:20},()=>[{}]);const c=counts(balancedPlan(units,(a,b)=>b-a<=8),units);assert.equal(c.length,3);assert.equal(c.reduce((a,b)=>a+b),20);assert.ok(Math.max(...c)-Math.min(...c)<=1)});
test('unfit questions return no plan so measured single-question fallback can handle them',()=>{assert.equal(balancedPlan([[{}]],()=>false),null)});
