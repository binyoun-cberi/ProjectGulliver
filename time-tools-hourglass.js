(function hourglassModule(){
  'use strict';
  const ns='http://www.w3.org/2000/svg';
  const clamp=n=>Math.max(0,Math.min(100,Number.isFinite(Number(n))?Number(n):0));
  function makeSvg(){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 240 292');
    svg.setAttribute('class','tt-hourglass');
    svg.setAttribute('role','img');
    svg.setAttribute('focusable','false');
    const node=(tag,props,parent=svg)=>{
      const n=document.createElementNS(ns,tag);
      for(const [key,value] of Object.entries(props))n.setAttribute(key,String(value));
      parent.append(n);return n;
    };
    node('path',{d:'M49 35 H191 Q191 67 161 101 L125 140 Q120 145 125 150 L161 191 Q191 224 191 255 H49 Q49 224 79 191 L115 150 Q120 145 115 140 L79 101 Q49 67 49 35 Z',fill:'#effaff',stroke:'#94b4bc','stroke-width':4,'stroke-linejoin':'round'});
    node('path',{d:'M55 45 Q58 74 92 112 L119 140 M185 45 Q182 74 148 112 L121 140 M55 246 Q58 218 92 180 L119 152 M185 246 Q182 218 148 180 L121 152',fill:'none',stroke:'#ffffff','stroke-width':5,opacity:'.85','stroke-linecap':'round'});
    const top=node('path',{'data-part':'upper-sand',fill:'#e8b45d'});
    const bottom=node('path',{'data-part':'lower-sand',fill:'#dc9c3c'});
    const stream=node('path',{'data-part':'falling-sand',fill:'none',stroke:'#e2a74e','stroke-width':3.2,'stroke-linecap':'round','stroke-dasharray':'3 5'});
    node('path',{d:'M45 37 L195 37 M45 255 L195 255',fill:'none',stroke:'#4c7182','stroke-width':12,'stroke-linecap':'round'});
    node('path',{d:'M49 29 H191 M49 263 H191',fill:'none',stroke:'#b8d4db','stroke-width':6,'stroke-linecap':'round'});
    const shine=node('path',{d:'M67 53 Q72 79 87 94 M67 238 Q72 212 87 197',fill:'none',stroke:'#fff','stroke-width':6,'stroke-linecap':'round',opacity:'.7'});
    return {svg,top,bottom,stream,shine};
  }
  function update(view,progress,running){
    const p=clamp(progress)/100;
    const remaining=Math.sqrt(1-p);
    const topY=143-88*remaining;
    const topW=4+56*remaining;
    // Sand in the top chamber runs down to the neck. At 100%, it is empty.
    view.top.setAttribute('d',p>=1?'':`M${120-topW} ${topY} H${120+topW} L124 143 H116 Z`);
    // Lower chamber fills from its base; the surface rises at a nonlinear rate.
    const bottomY=152+92*Math.sqrt(1-p);
    const bottomW=4+56*(bottomY-152)/92;
    view.bottom.setAttribute('d',p<=0?'':`M${120-bottomW} ${bottomY} H${120+bottomW} L180 244 H60 Z`);
    const pouring=Boolean(running)&&p>0&&p<1;
    view.stream.setAttribute('d',pouring?`M120 145 V${Math.max(148,bottomY-2)}`:'');
    view.svg.dataset.progress=String(Math.round(p*100));
    view.svg.dataset.running=String(pouring);
    view.svg.setAttribute('aria-label',`모래시계 · ${Math.round((1-p)*100)}% 남음`);
    return view.svg;
  }
  function create(progress,running){
    const view=makeSvg();
    update(view,progress,running);
    view.svg.updateHourglass=(p,r)=>update(view,p,r);
    return view.svg;
  }
  const api=Object.freeze({create,clamp,geometry(progress){
    const p=clamp(progress)/100;
    return {upperLevel:143-88*Math.sqrt(1-p),lowerLevel:152+92*Math.sqrt(1-p)};
  }});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.TimeToolsHourglass=api;
})();
