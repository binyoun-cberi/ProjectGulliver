(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverActivityCore=api})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const KINDS=['timer','stopwatch','qr','notice'];
const labels={timer:'활동 타이머',stopwatch:'스톱워치',qr:'QR 코드',notice:'수업 안내'};
function clean(raw={}){
 if(!KINDS.includes(raw.kind))throw Error('지원하지 않는 활동이에요.');
 const num=(v,max)=>Math.max(0,Math.min(max,Number(v)||0));
 return {kind:raw.kind,title:String(raw.title??labels[raw.kind]).slice(0,100),body:String(raw.body??'오늘의 활동을 안내해 주세요.').slice(0,800),value:String(raw.value??'https://').slice(0,1500),seconds:Math.max(1,num(raw.seconds??300,86400)),elapsed:num(raw.elapsed,86400000),startedAt:num(raw.startedAt,1e15)};
}
function elapsed(a,now=Date.now()){return a.elapsed+(a.startedAt?Math.max(0,now-a.startedAt):0)}
function display(a,now=Date.now()){const ms=elapsed(a,now);const sec=a.kind==='timer'?Math.max(0,Math.ceil(a.seconds-ms/1000)):Math.floor(ms/1000);return Math.floor(sec/60).toString().padStart(2,'0')+':'+(sec%60).toString().padStart(2,'0')}
function control(a,action,now=Date.now()){a=clean(a);if(action==='reset')return {...a,elapsed:0,startedAt:0};if(action==='pause')return {...a,elapsed:elapsed(a,now),startedAt:0};if(action==='start'&&!a.startedAt){if(a.kind==='timer'&&elapsed(a,now)>=a.seconds*1000)a.elapsed=0;a.startedAt=now}return a}
function paint(ctx,e){const a=e.activity;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,e.w,e.h);ctx.strokeStyle='#cbd5e1';ctx.lineWidth=1;ctx.strokeRect(0,0,e.w,e.h);ctx.save();ctx.beginPath();ctx.rect(8,8,e.w-16,e.h-16);ctx.clip();ctx.textAlign='center';ctx.fillStyle='#475569';ctx.font='600 20px sans-serif';ctx.fillText(a.title,e.w/2,30,e.w-24);ctx.fillStyle='#17283f';
 if(a.kind==='qr'){if(typeof globalThis.qrcode!=='function')throw Error('QR 생성기를 불러오지 못했어요.');const q=globalThis.qrcode(0,'M');q.addData(a.value,'Byte');q.make();const n=q.getModuleCount(),side=Math.max(1,Math.min(e.w-24,e.h-54)),unit=side/(n+8),left=(e.w-side)/2;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))ctx.fillRect(left+(x+4)*unit,46+(y+4)*unit,unit+.02,unit+.02)}
 else if(a.kind==='notice'){ctx.font='500 18px sans-serif';ctx.textAlign='left';const count=Math.max(1,Math.floor((e.w-32)/18));let row=0;for(const line of a.body.split('\n')){if(!line)row++;for(let i=0;i<line.length;i+=count){ctx.fillText(line.slice(i,i+count),16,66+row*26);row++}}}
 else{ctx.font='700 '+Math.min(e.w/4.5,e.h/2.5)+'px sans-serif';ctx.fillText(display(a),e.w/2,e.h*.67,e.w-24)}ctx.restore();}
return {KINDS,labels,clean,elapsed,display,control,paint};
});
