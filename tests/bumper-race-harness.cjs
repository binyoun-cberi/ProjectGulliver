'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
module.exports=function harness(seed=1){
 let s=seed,clock=0,serial=0;const random=()=>((s=(1664525*s+1013904223)>>>0)/4294967296);
 const els=new Map(),storage=new Map(),alerts=[],timers=new Map();let teacherRows=[];
 const noop=()=>{};
 const ctx=new Proxy({measureText:t=>({width:String(t).length*12}),createLinearGradient:()=>({addColorStop:noop})},{get:(t,k)=>t[k]||noop,set:(t,k,v)=>(t[k]=v,true)});
 function el(id){
  if(els.has(id))return els.get(id);
  const e={id,value:'',checked:false,disabled:false,hidden:false,dataset:{},style:{},children:[],classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
   appendChild(child){this.children=this.children.filter(x=>x!==child);this.children.push(child);child.parent=this},
   remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)},
   querySelector(){return el('child')},querySelectorAll(q){return q==='[data-group-heading]'?this.children.filter(x=>x.dataset.groupHeading):[]},
   getContext:()=>ctx,getBoundingClientRect:()=>({width:1200,height:900}),width:1200,height:900};
  Object.defineProperty(e,'innerHTML',{set(v){this.children=[];this.html=v},get(){return this.html||''}});
  els.set(id,e);return e;
 }
 const math=Object.create(Math);math.random=random;
 function schedule(fn,delay,repeat=false){const id=++serial;timers.set(id,{fn,due:clock+delay,delay,repeat});return id;}
 const sandbox={console,Math:math,Date,performance:{now:()=>clock},window:{innerWidth:1200,innerHeight:900,addEventListener:noop,confirm:()=>true},document:{getElementById:el,querySelectorAll:q=>q==='.cheat-row'?teacherRows:[],createElement:()=>el('element'+(++serial)),head:{appendChild:noop}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:(fn,d)=>schedule(fn,d),clearTimeout:id=>timers.delete(id),setInterval:(fn,d)=>schedule(fn,d,true),clearInterval:id=>timers.delete(id),requestAnimationFrame:noop,alert:m=>alerts.push(m)};
 const c=vm.createContext(sandbox),run=source=>vm.runInContext(source,c);
 run(fs.readFileSync(root+'/vendor/matter.min.js','utf8'));run('window.Matter=Matter;');run(fs.readFileSync(root+'/bumper-race-core.js','utf8'));
 const html=fs.readFileSync(root+'/범퍼 룰렛.html','utf8');run([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function createMap(')));
 run('bindMatterEngine();initGame();playSound=()=>{};Runner.run=()=>{};Runner.stop=()=>{};');
 function start({n=100,k=4,names,labels,unique=false,balanced=false,close=true,purpose='assign',countdown=false,seconds=2,directed={}}={}){
  el('names-input').value=(names||Array.from({length:n},(_,i)=>'학생'+i)).join('\n');el('slots-input').value=(labels||Array.from({length:k},(_,i)=>'선택지'+i)).join('\n');el('game-purpose').value=purpose;el('one-marble-per-slot').checked=unique;el('balanced-teams').checked=balanced;el('close-race').checked=close;el('use-countdown').checked=countdown;el('countdown-seconds').value=String(seconds);
  teacherRows=Object.entries(directed).map(([name,label])=>({querySelector:q=>({value:q==='.cheat-name'?name:label})}));
  run('startGame()');
 }
 function tick(frames=1){for(let i=0;i<frames;i++){
  clock+=1000/60;
  for(const [id,t] of [...timers])if(clock>=t.due){if(t.repeat)t.due+=t.delay;else timers.delete(id);t.fn();}
  if(run("gameState==='playing'"))run('Engine.update(engine,1000/60)');
 }}
 return {run,start,tick,el,alerts,storage,get clock(){return clock},dispose(){run('Composite.clear(engine.world);Engine.clear(engine)')}};
};
