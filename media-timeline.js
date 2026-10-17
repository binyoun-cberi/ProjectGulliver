(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.GulliverMediaTimeline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_SECONDS=45,MAX_CLIP=20,MIN_CLIP=.5;
function total(clips){return(clips||[]).reduce((sum,clip)=>sum+(Number(clip.duration)||0),0)}
function bounds(clips,index){
 if(!Array.isArray(clips)||index<0||index>=clips.length)throw Error('수정할 장면을 찾지 못했어요.');
 const available=MAX_SECONDS-total(clips)+Number(clips[index].duration);
 return{min:MIN_CLIP,max:Math.max(MIN_CLIP,Math.min(MAX_CLIP,available))};
}
function resize(clips,index,seconds){
 const range=bounds(clips,index),value=Number(seconds);
 if(!Number.isFinite(value))throw Error('장면 길이를 확인해 주세요.');
 const duration=Math.round(Math.min(range.max,Math.max(range.min,value))*10)/10;
 return clips.map((clip,i)=>i===index?{...clip,duration}:clip);
}
function dragDuration(clips,index,startSeconds,deltaPixels,width){
 const pixels=Number(width);
 if(!Number.isFinite(pixels)||pixels<=0)return resize(clips,index,startSeconds);
 return resize(clips,index,Number(startSeconds)+(Number(deltaPixels)||0)*MAX_SECONDS/pixels);
}
function segments(clips){
 let start=0;
 return(clips||[]).map((clip,index)=>{
  const seconds=Math.max(0,Number(clip.duration)||0);
  const info={index,start,end:start+seconds,seconds,left:start/MAX_SECONDS*100,width:seconds/MAX_SECONDS*100};
  start+=seconds;return info;
 });
}
function find(clips,time){
 const items=segments(clips);
 if(!items.length)return-1;
 const t=Math.max(0,Number(time)||0);
 const hit=items.find(x=>t>=x.start&&t<x.end);
 return hit?hit.index:items[items.length-1].index;
}
function stamp(seconds){
 const t=Math.max(0,Number(seconds)||0),min=Math.floor(t/60);
 return min+':'+String(Math.floor(t%60)).padStart(2,'0');
}
return{MAX_SECONDS,MIN_CLIP,MAX_CLIP,total,bounds,resize,dragDuration,segments,find,stamp};
});
