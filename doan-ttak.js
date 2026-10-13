(() => {
'use strict';
const C=window.DoanCore, $=id=>document.getElementById(id);
if(!C)throw Error('도안 편집 도구를 불러오지 못했어요.');
const sheet=$('sheet');
let model=C.makeTemplate('vocabulary'),selected=null,drag=null,undo=[],redo=[],dirty=false,currentTemplate='vocabulary';
function message(s,bad=false){$('status').textContent=s;$('status').className='status'+(bad?' error':'');}
function snapshot(){return JSON.stringify(model);}
function record(before){
 if(snapshot()!==before){undo.push(before);if(undo.length>40)undo.shift();redo=[];dirty=true;}
 updateHistory();
}
function updateHistory(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length;}
function selection(){return model.objects.find(o=>o.id===selected)||null;}
function paint(){
 sheet.innerHTML='<rect width="595" height="842" fill="#fff"/>'+C.drawObjects(model);
 const obj=selection();
 if(obj){
  const pad=5,x=Math.min(obj.x,obj.x+obj.w)-pad,y=Math.min(obj.y,obj.y+obj.h)-pad;
  const w=Math.max(1,Math.abs(obj.w))+pad*2,h=Math.max(1,Math.abs(obj.h))+pad*2;
  const mark=document.createElementNS('http://www.w3.org/2000/svg','rect');
  for(const [key,val] of Object.entries({x,y,width:w,height:h,fill:'none',stroke:'#2563eb','stroke-width':2,'stroke-dasharray':'7 4','pointer-events':'none'}))mark.setAttribute(key,String(val));
  sheet.append(mark);
 }
}
function refreshPanel(){
 $('projectTitle').value=model.title;
 $('paperSize').value='A4';
 const o=selection();
 $('noSelection').hidden=!!o;
 $('selectedFields').hidden=!o;
 if(!o)return;
 const names={rect:'네모',ellipse:'동그라미',triangle:'세모',star:'별',line:'선',text:'글씨',image:'사진'};
 $('selectedType').textContent='선택: '+names[o.type];
 $('textField').hidden=o.type!=='text';
 $('fontField').hidden=o.type!=='text';
 const fields={shapeX:o.x,shapeY:o.y,shapeW:o.w,shapeH:o.h,shapeFill:o.fill==='none'?'#ffffff':o.fill,shapeStroke:o.stroke==='none'?'#ffffff':o.stroke,shapeFont:o.fontSize,shapeStrokeWidth:o.strokeWidth,shapeText:o.text||''};
 for(const [id,value] of Object.entries(fields))$(id).value=value;
}
function render(){paint();refreshPanel();updateHistory();}
function currentPoint(e){
 const ctm=sheet.getScreenCTM();
 if(!ctm)return{x:0,y:0};
 const pt=sheet.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
 const t=pt.matrixTransform(ctm.inverse());return{x:t.x,y:t.y};
}
sheet.addEventListener('pointerdown',e=>{
 if(e.button!==0&&e.pointerType==='mouse')return;
 const element=e.target.closest('[data-shape]');
 const o=element&&model.objects.find(x=>x.id===element.getAttribute('data-shape'));
 selected=o?o.id:null;
 refreshPanel();paint();
 if(!o)return;
 drag={id:o.id,start:currentPoint(e),x:o.x,y:o.y,before:snapshot(),moved:false};
 sheet.setPointerCapture(e.pointerId);
});
sheet.addEventListener('pointermove',e=>{
 if(!drag)return;
 const o=model.objects.find(x=>x.id===drag.id);if(!o)return;
 const here=currentPoint(e);
 const x=Math.round(drag.x+here.x-drag.start.x),y=Math.round(drag.y+here.y-drag.start.y);
 if(o.x===x&&o.y===y)return;
 o.x=x;o.y=y;drag.moved=true;paint();
});
function stopDrag(){if(!drag)return;const before=drag.before,changed=drag.moved;drag=null;if(changed){record(before);render();message('요소를 이동했어요.');}}
sheet.addEventListener('pointerup',stopDrag);
sheet.addEventListener('pointercancel',stopDrag);
sheet.addEventListener('lostpointercapture',stopDrag);
function setTemplate(id){
 if(!['vocabulary','emotion','schedule','name','geometry','blank'].includes(id))return;
 if(dirty&&!window.confirm('현재 도안이 바뀌어요. 저장하지 않은 작업을 계속 버릴까요?'))return;
 model=C.makeTemplate(id);selected=null;undo=[];redo=[];dirty=false;currentTemplate=id;
 document.querySelectorAll('[data-template]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.template===id)));
 render();message('도안을 선택했어요. 글씨와 도형을 눌러 편집해 보세요.');
}
document.querySelectorAll('[data-template]').forEach(b=>b.addEventListener('click',()=>setTemplate(b.dataset.template)));
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{
 if(model.objects.length>=200)return message('요소는 최대 200개까지 사용할 수 있어요.',true);
 const type=b.dataset.add,old=snapshot();
 let o;
 const center=(Math.max(10,595-140))/2;
 if(type==='text')o=C.text(center,400,140,60,'글씨를 입력하세요',24);
 else if(type==='rect')o=C.rect(center,380,140,100,'#e4f1ff','#4289b0',2,10);
 else if(type==='ellipse')o=C.ellipse(center,380,140,100,'#ffe7af','#b79442',2);
 else if(type==='triangle')o=C.triangle(center,380,140,100);
 else if(type==='star')o=C.star(center,380,130,130);
 else o=C.line(center,430,140,0,'#26384f',3);
 model.objects.push(o);selected=o.id;
 record(old);render();message('요소가 추가됐어요. 손가락이나 마우스로 이동할 수 있어요.');
}));
async function insertPhoto(file){
 if(model.objects.length>=200)throw Error('요소는 최대 200개까지 사용할 수 있어요.');
 if(!file||!['image/png','image/jpeg'].includes(file.type)||file.size>2000000||file.size<=0)
  throw Error('JPG·PNG 이미지는 2MB 이하만 넣을 수 있어요.');
 const uri=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(Error('사진을 읽지 못했어요.'));reader.readAsDataURL(file)});
 if(!C.safeImage(uri))throw Error('지원하지 않는 사진 형식이에요.');
 const total=model.objects.reduce((n,o)=>n+(o.src||'').length,0);
 if(total+uri.length>20000000)throw Error('현재 도안에 사진을 너무 많이 넣었어요.');
 const old=snapshot(),obj=C.imageShape(188,327,220,165,uri);
 model.objects.push(obj);selected=obj.id;record(old);render();
 message('사진을 도안에 넣었어요. 끌어서 위치를 바꿔 보세요.');
}
$('addPhoto').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 try{await insertPhoto(file)}catch(err){message(err.message||'사진을 넣지 못했어요.',true)}
});
const changes=[
 ['shapeX','x',-1000,1600],['shapeY','y',-1000,1600],['shapeW','w',1,1300],['shapeH','h',-1000,1300],
 ['shapeFont','fontSize',8,130],['shapeStrokeWidth','strokeWidth',0,25]
];
for(const [id,key,min,max] of changes){
 $(id).addEventListener('change',()=>{
  const o=selection();if(!o)return;
  const old=snapshot();o[key]=C.num($(id).value,min,max,o[key]);record(old);render();
 });
}
for(const [id,key] of [['shapeFill','fill'],['shapeStroke','stroke']]){
 $(id).addEventListener('change',()=>{const o=selection();if(!o)return;const old=snapshot();o[key]=$(id).value;record(old);paint();});
}
$('shapeText').addEventListener('change',()=>{
 const o=selection();if(!o||o.type!=='text')return;
 const old=snapshot();o.text=$('shapeText').value.slice(0,400);record(old);paint();
});
$('projectTitle').addEventListener('change',()=>{
 const old=snapshot();model.title=$('projectTitle').value.slice(0,80)||'교실 도안';record(old);refreshPanel();
});
$('paperSize').addEventListener('change',()=>{$('paperSize').value='A4';message('현재 인쇄 도안은 A4 크기로 제공해요.');});
function changeOrder(type){
 const o=selection();if(!o)return;
 const old=snapshot(),index=model.objects.indexOf(o);
 model.objects.splice(index,1);
 if(type==='top')model.objects.push(o);else model.objects.unshift(o);
 record(old);render();
}
$('bringForward').addEventListener('click',()=>changeOrder('top'));
$('sendBack').addEventListener('click',()=>changeOrder('back'));
$('duplicate').addEventListener('click',()=>{
 const o=selection();if(!o||model.objects.length>=200)return;
 const old=snapshot();const cp={...o,id:'copy-'+Date.now()+'-'+model.objects.length,x:o.x+12,y:o.y+12};
 model.objects.push(cp);selected=cp.id;record(old);render();message('요소를 복제했어요.');
});
function removeSelected(){
 const o=selection();if(!o)return;
 const old=snapshot();model.objects=model.objects.filter(x=>x.id!==selected);
 selected=null;record(old);render();message('선택한 요소를 지웠어요.');
}
$('deleteShape').addEventListener('click',removeSelected);
document.addEventListener('keydown',e=>{
 const node=document.activeElement?.tagName;
 if(['INPUT','TEXTAREA','SELECT'].includes(node))return;
 if(e.key==='Delete'||e.key==='Backspace'){if(selected){e.preventDefault();removeSelected();}}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();stepHistory(e.shiftKey?'redo':'undo');}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||!selected)return;
 e.preventDefault();const o=selection(),old=snapshot(),step=e.shiftKey?10:1;
 if(e.key==='ArrowLeft')o.x-=step;if(e.key==='ArrowRight')o.x+=step;
 if(e.key==='ArrowUp')o.y-=step;if(e.key==='ArrowDown')o.y+=step;
 record(old);render();
});
function stepHistory(direction){
 const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;
 if(!from.length)return;to.push(snapshot());
 model=JSON.parse(from.pop());selected=null;dirty=true;render();message(direction==='undo'?'이전 상태로 돌아갔어요.':'다시 실행했어요.');
}
$('undo').addEventListener('click',()=>stepHistory('undo'));
$('redo').addEventListener('click',()=>stepHistory('redo'));
function download(content,name,mime){
 const blob=content instanceof Blob?content:new Blob([content],{type:mime});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function filename(extension){
 return (model.title||'교실도안').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,70)+'.'+extension;
}
$('saveProject').addEventListener('click',()=>{
 download(JSON.stringify({version:1,...model},null,2),filename('json'),'application/json;charset=utf-8');dirty=false;message('편집 가능한 도안 원본을 저장했어요.');
});
$('loadProject').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>24000000)return message('도안 JSON 파일은 24MB 이하만 열 수 있어요.',true);
 if(dirty&&!confirm('지금 작업 중인 도안을 새 파일로 바꿀까요?'))return;
 try{const raw=JSON.parse(await file.text());const next=C.validateProject(raw);
  model=next;selected=null;undo=[];redo=[];dirty=false;currentTemplate='';
  document.querySelectorAll('[data-template]').forEach(b=>b.setAttribute('aria-pressed','false'));
  render();message('저장된 도안을 불러왔어요.');
 }catch(err){message('도안 파일을 읽지 못했어요: '+String(err.message||err),true);}
});
$('exportSvg').addEventListener('click',()=>{
 try{download(C.svg(model),filename('svg'),'image/svg+xml;charset=utf-8');message('SVG 도안을 저장했어요.');}
 catch(err){message('SVG 저장에 실패했어요: '+err.message,true);}
});
$('exportPng').addEventListener('click',async()=>{
 try{
  const svg=C.svg(model),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('그림을 읽을 수 없어요.'));image.src=url;});
  const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('캔버스를 열 수 없어요.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  URL.revokeObjectURL(url);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw Error('PNG 내보내기를 지원하지 않는 브라우저예요.');
  download(blob,filename('png'),'image/png');message('인쇄용 PNG 이미지를 저장했어요.');
 }catch(err){message('PNG 저장에 실패했어요: '+err.message,true);}
});
$('print').addEventListener('click',()=>{message('인쇄 창에서 PDF로 저장하거나 A4 용지로 인쇄해 주세요.');window.print();});
$('openAdvanced').addEventListener('click',async()=>{
 const content=$('advancedContent'),status=$('advancedStatus'),btn=$('openAdvanced');
 if(!content.hidden){content.hidden=true;btn.textContent='고급 편집기 실행';return;}
 content.hidden=false;btn.disabled=true;status.textContent='VectorCraft 설치 파일을 확인하는 중이에요.';
 try{
  const response=await fetch('assets/artcraft/vectorcraft/gulliver-install.json',{cache:'no-store'});
  if(!response.ok)throw Error('고급 편집기 배포 파일을 찾지 못했어요.');
  const manifest=await response.json();
  if(manifest.source!=='storytold/vectorcraft'||manifest.version!=='0.10.0')throw Error('지원하지 않는 VectorCraft 버전이에요.');
  $('advancedFrame').src='assets/artcraft/vectorcraft/index.html?lang=ko';
  status.textContent='고급 편집기 파일을 불러오고 있어요. 처음 실행할 때는 시간이 걸릴 수 있어요.';
  btn.textContent='고급 편집기 닫기';
 }catch(err){status.textContent=err.message||'고급 편집기를 실행하지 못했어요.';status.classList.add('error');}
 finally{btn.disabled=false;}
});
window.GulliverStudioAdapter={kind:'design',insertImage:insertPhoto,capture:()=>JSON.parse(JSON.stringify(model)),apply:raw=>{
 model=C.validateProject(raw);selected=null;undo=[];redo=[];dirty=false;render();
},rename:value=>{model.title=String(value).slice(0,80);dirty=true;render();}};
window.addEventListener('beforeunload',e=>{if(dirty&&!new URLSearchParams(location.search).has('studio')){e.preventDefault();e.returnValue='';}});
render();
})();
