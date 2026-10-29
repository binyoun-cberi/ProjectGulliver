/* Route-distance ranking and race camera. Inspired by lazygyu/roulette (MIT).
 * See docs/pinball-marble-reference.md for attribution and design differences. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ClasheetPinballView=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function makeProgressMap(bodies,{width,height,radius=11,cell=14}){
  const cols=Math.ceil(width/cell),rows=Math.ceil(height/cell)+1,total=cols*rows;
  const blocked=new Uint8Array(total),dist=new Float64Array(total);dist.fill(Infinity);
  const obstacles=bodies.filter(b=>b.label==='rail'||b.label==='island');
  function nearPolygon(x,y,body){
   if(x<body.bounds.min.x-radius||x>body.bounds.max.x+radius||y<body.bounds.min.y-radius||y>body.bounds.max.y+radius)return false;
   const v=body.vertices;let inside=false;
   for(let i=0,j=v.length-1;i<v.length;j=i++){
    const a=v[j],b=v[i],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
    if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<radius+1)return true;
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
   }
   return inside;
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)blocked[y*cols+x]=obstacles.some(b=>nearPolygon((x+.5)*cell,(y+.5)*cell,b))?1:0;
  const heap=[];
  function push(id,d){let i=heap.length;heap.push({id,d});while(i){const p=(i-1)>>1;if(heap[p].d<=d)break;heap[i]=heap[p];i=p;}heap[i]={id,d};}
  function pop(){const out=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].d<heap[j].d)j++;if(heap[j].d>=last.d)break;heap[i]=heap[j];i=j;}heap[i]=last;}return out;}
  for(let x=0;x<cols;x++){const id=(rows-1)*cols+x;if(!blocked[id]){dist[id]=0;push(id,0);}}
  while(heap.length){const a=pop();if(a.d!==dist[a.id])continue;const x=a.id%cols,y=Math.floor(a.id/cols);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;
    const id=ny*cols+nx;if(blocked[id]||(dx&&dy&&(blocked[y*cols+nx]||blocked[ny*cols+x])))continue;
    // Reversed search: a predecessor below us has to travel upward to reach us.
    const next=a.d+cell*Math.hypot(dx,dy)*(dy>0?3:1);
    if(next<dist[id]){dist[id]=next;push(id,next);}
   }
  }
  function distanceAt(x,y){
   if(y>=height)return 0;
   const gx=Math.max(0,Math.min(cols-1,Math.floor(x/cell))),gy=Math.max(0,Math.min(rows-1,Math.floor(y/cell)));
   const direct=dist[gy*cols+gx];if(Number.isFinite(direct))return direct;
   let best=Infinity;
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=gx+dx,ny=gy+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;best=Math.min(best,dist[ny*cols+nx]+Math.hypot(dx,dy)*cell);}
   return best;
  }
  return {distanceAt,cols,rows,cell,blocked,dist};
 }
 function rankBalls(balls,map){return balls.filter(b=>!b.finished).sort((a,b)=>(a.routeDistance??map.distanceAt(a.body.position.x,a.body.position.y))-(b.routeDistance??map.distanceAt(b.body.position.x,b.body.position.y))||a.index-b.index);}
 function createCamera(){
  const camera={x:450,y:250,zoom:1,subject:null,rival:null,slowMotion:1};let pending='',held=0,shown='';
  function reset(){camera.x=450;camera.y=250;camera.zoom=1;camera.subject=null;camera.rival=null;camera.slowMotion=1;pending='';shown='';held=0;}
  function update({ranked,focusedName=null,remaining=1,arrived=0,viewWidth,viewHeight,finishY,worldHeight,dt=16.67,finished=false}){
   if(!ranked.length||finished){camera.y=worldHeight-viewHeight/(2*camera.zoom);camera.slowMotion=1;return camera;}
   const focused=ranked.find(b=>b.name===focusedName);
   const nearFinish=(ranked[0].routeDistance??Infinity)<420;
   const index=focused?ranked.indexOf(focused):(arrived||nearFinish)?Math.max(0,Math.min(ranked.length-1,remaining-1)):0;
   const target=ranked[index],rival=ranked[index+1]||ranked[index-1];
   const key=String(target.index)+':'+String(rival?.index);
   if(pending===key)held+=dt;else{pending=key;held=dt;}
   const gone=!ranked.some(b=>b.index===camera.subject);
   if(!shown||gone||focused||held>=300){shown=key;camera.subject=target.index;camera.rival=rival?.index??null;}
   const a=ranked.find(b=>b.index===camera.subject)||target,b=ranked.find(b=>b.index===camera.rival);
   const scale=Math.max(.6,Math.min(1.4,Math.min(viewWidth/1000,viewHeight/700)));
   const gap=b?Math.hypot(a.body.position.x-b.body.position.x,a.body.position.y-b.body.position.y):0;
   const share=b&&gap<850;
   let x=share?(a.body.position.x+b.body.position.x)/2:a.body.position.x;
   let y=share?(a.body.position.y+b.body.position.y)/2+60:a.body.position.y+60;
   let zoom=Math.min(viewWidth/(share?Math.abs(a.body.position.x-b.body.position.x)+230:360),viewHeight/(share?Math.abs(a.body.position.y-b.body.position.y)+330:520));
   zoom=Math.max(.6*scale,Math.min(1.65*scale,zoom));
   // Show the entire fork while either competing marble is choosing a route.
   if(y>760&&y<1190){x=450;y=1000;zoom=Math.min(viewWidth*.82/740,viewHeight*.86/540);}
   const close=a.body.position.y>finishY-250&&b&&Math.abs(a.body.position.y-b.body.position.y)<220;
   if(close)zoom=Math.min(2*scale,zoom*1.2);
   const halfX=viewWidth/(zoom*2),halfY=viewHeight/(zoom*2);
   x=halfX>=450?450:Math.max(halfX-35,Math.min(900-halfX+35,x));
   y=Math.max(halfY-40,Math.min(worldHeight-halfY+30,y));
   const blend=1-Math.exp(-Math.min(dt,70)/150);
   camera.x+=(x-camera.x)*blend;camera.y+=(y-camera.y)*blend;camera.zoom+=(zoom-camera.zoom)*blend;
   camera.slowMotion=close?.55:1;
   return camera;
  }
  return {camera,reset,update};
 }
 return {makeProgressMap,rankBalls,createCamera};
});
