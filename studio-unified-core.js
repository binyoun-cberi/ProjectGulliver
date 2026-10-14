(function(root,factory){
'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverUnifiedCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FORMAT='gulliver.unified.canvas.v1',MAX_PAGES=40,MAX_ITEMS=150,MAX_IMAGE=3000000;
const TYPES=['text','rect','ellipse','triangle','star','line','image'];
const LAYOUTS={wide:{w:960,h:540,label:'16:9 발표'},a4:{w:595,h:842,label:'A4 도안'}};
const ANIMATIONS=['none','fade','rise','zoom'],TRANSITIONS=['none','fade','slide'];
const MIN_DURATION=1,MAX_DURATION=20,ANIMATION_SECONDS=.65;
function id(){return 'u-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))}
function color(value,fallback='#253650'){return typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value:fallback}
function number(value,min,max,backup){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):backup}
function image(value){return typeof value==='string'&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)&&value.length<=MAX_IMAGE?value:''}
function text(value,max=800){return String(value??'').slice(0,max)}
function element(type,partial={}){
 if(!TYPES.includes(type))throw Error('지원하지 않는 편집 요소예요.');
 return{id:partial.id||id(),type,x:120,y:110,w:360,h:type==='text'?75:210,
  fill:type==='text'?'#253650':'#F1D98D',stroke:'#334155',fontSize:38,opacity:1,
  content:type==='text'?'글씨를 두 번 눌러 수정하세요':'',src:'',align:'center',animation:'none',delay:0,...partial};
}
function makePage(name='새 페이지',elements=[],background='#ffffff'){
 return{id:id(),name,background,elements,duration:5,transition:'none'};
}
function starter(kind='presentation'){
 if(kind==='worksheet')return{format:FORMAT,title:'나만의 활동지',layout:'a4',pages:[
  makePage('활동지',[element('text',{x:35,y:40,w:525,h:72,fontSize:38,content:'우리 반 활동지'}),
  element('text',{x:35,y:135,w:525,h:55,fontSize:21,content:'이름:                 날짜:'}),
  element('rect',{x:35,y:220,w:525,h:450,fill:'#F2F8FF',stroke:'#A9BCD1'})])],active:0};
 if(kind==='blank')return{format:FORMAT,title:'새 디자인',layout:'wide',pages:[makePage('빈 페이지')],active:0};
 return{format:FORMAT,title:'새 발표 자료',layout:'wide',pages:[
  makePage('표지',[element('rect',{x:70,y:105,w:820,h:335,fill:'#FFF5D6',stroke:'#FFF5D6'}),
  element('text',{x:130,y:160,w:700,h:90,fontSize:54,content:'우리 함께 배워요!'}),
  element('text',{x:160,y:280,w:640,h:72,fontSize:28,fill:'#725C48',content:'글씨와 그림을 직접 움직여 보세요'})],'#F5F8FF')],active:0};
}
function nameTags(names,perPage=8){
 if(![4,8].includes(perPage))throw Error('한 장에 4개 또는 8개의 이름표를 배치할 수 있어요.');
 if(!Array.isArray(names))throw Error('이름 목록을 확인해 주세요.');
 const cleaned=names.map(name=>String(name??'').trim()).filter(Boolean);
 if(cleaned.some(name=>name.length>16))throw Error('이름표에 들어갈 이름은 16자 이하로 입력해 주세요.');
 if(!cleaned.length||cleaned.length>MAX_PAGES*perPage)throw Error('이름을 1개 이상, 최대 '+(MAX_PAGES*perPage)+'개 입력해 주세요.');
 const rows=perPage/2,cellW=257,cellH=746/rows,pages=[];
 for(let offset=0;offset<cleaned.length;offset+=perPage){
  const elements=[];
  cleaned.slice(offset,offset+perPage).forEach((name,i)=>{
   const x=34+(i%2)*270,y=48+Math.floor(i/2)*cellH;
   const long=name.length>9,split=Math.ceil(name.length/2),label=long?name.slice(0,split)+'\n'+name.slice(split):name;
   const fontSize=long?25:Math.min(43,Math.max(24,Math.floor(220/name.length)));
   elements.push(element('rect',{x,y,w:cellW,h:cellH-12,fill:'#FFFFFF',stroke:'#B8C3D5'}));
   elements.push(element('text',{x:x+12,y:y+12,w:cellW-24,h:32,fontSize:17,fill:'#66758B',content:'우리 반 이름표'}));
   elements.push(element('text',{x:x+12,y:y+cellH/2-35,w:cellW-24,h:70,fontSize,content:label}));
  });
  pages.push(makePage('이름표 '+(pages.length+1),elements));
 }
 return validate({format:FORMAT,title:'우리 반 이름표',layout:'a4',pages,active:0});
}
function cleanElement(raw,i){
 if(!raw||!TYPES.includes(raw.type))throw Error('알 수 없는 편집 요소가 있어요.');
 const type=raw.type;
 const src=type==='image'?image(raw.src):'';
 if(type==='image'&&!src)throw Error('이미지 데이터가 없거나 크기가 너무 커요.');
 return{id:String(raw.id||'e-'+i).slice(0,90),type,
  x:number(raw.x,-1500,2500,0),y:number(raw.y,-1500,2500,0),
  w:number(raw.w,10,2000,100),h:number(raw.h,10,2000,80),
  fill:color(raw.fill,type==='text'?'#253650':'#F1D98D'),
  stroke:color(raw.stroke,'#334155'),fontSize:number(raw.fontSize,10,160,32),
  opacity:number(raw.opacity,0,1,1),content:text(raw.content),
  src,align:['left','center','right'].includes(raw.align)?raw.align:'center',
  animation:ANIMATIONS.includes(raw.animation)?raw.animation:'none',delay:number(raw.delay,0,MAX_DURATION,0)};
}
function cleanVideoClip(raw){
 if(raw==null)return null;
 if(!raw||typeof raw!=='object'||!/^u-[\w-]{1,110}$/.test(raw.mediaId||'')||
    !['video/mp4','video/webm'].includes(raw.mime))throw Error('영상 클립의 원본 정보가 올바르지 않아요.');
 return {mediaId:raw.mediaId,mime:raw.mime,
  name:text(raw.name||'영상 클립',90),inPoint:number(raw.inPoint,0,86400,0),
  duration:number(raw.duration,.5,MAX_DURATION,5),muted:raw.muted!==false};
}
function validate(raw){
 if(!raw||raw.format!==FORMAT||!LAYOUTS[raw.layout]||!Array.isArray(raw.pages)||raw.pages.length<1||raw.pages.length>MAX_PAGES)
  throw Error('통합 캔버스 프로젝트 형식 또는 페이지 수가 올바르지 않아요.');
 let imageBytes=0,ids=new Set();
 const pages=raw.pages.map((page,i)=>{
  if(!page||!Array.isArray(page.elements)||page.elements.length>MAX_ITEMS)throw Error((i+1)+'번째 페이지의 요소가 너무 많아요.');
  const elements=page.elements.map(cleanElement);
  for(const e of elements){if(ids.has(e.id))throw Error('중복된 요소 식별자가 있어요.');ids.add(e.id);imageBytes+=e.src.length}
  return{id:String(page.id||'p-'+i).slice(0,90),name:text(page.name,60)||'페이지 '+(i+1),
   background:color(page.background,'#ffffff'),elements,
   duration:number(page.duration,MIN_DURATION,MAX_DURATION,5),transition:TRANSITIONS.includes(page.transition)?page.transition:'none',
   ...(page.videoClip?{videoClip:cleanVideoClip(page.videoClip)}:{})};
 });
 if(imageBytes>18*1024*1024)throw Error('프로젝트 안의 이미지가 너무 많아요. 이미지를 줄여 주세요.');
 let audio=null;
 if(raw.audio!==undefined&&raw.audio!==null){
  const a=raw.audio;
  if(!a||typeof a.mediaId!=='string'||!/^[\w-]{1,110}$/.test(a.mediaId)||a.mime!=='audio/wav')throw Error('통합 캔버스의 배경음악 원본 정보가 잘못됐어요.');
  audio={mediaId:a.mediaId,mime:'audio/wav',name:text(a.name||'배경음악',90),
   volume:number(a.volume,0,1,.7),loop:a.loop!==false};
 }
 return{format:FORMAT,title:text(raw.title,90)||'통합 제작물',layout:raw.layout,pages,active:number(raw.active,0,pages.length-1,0)|0,audio};
}
function totalDuration(project){return project.pages.reduce((sum,p)=>sum+number(p.duration,MIN_DURATION,MAX_DURATION,5),0)}
function locateTime(project,seconds){
 const total=totalDuration(project),t=number(seconds,0,total,0);let at=0;
 for(let i=0;i<project.pages.length;i++){
  const d=number(project.pages[i].duration,MIN_DURATION,MAX_DURATION,5);
  if(t<at+d||i===project.pages.length-1)return{index:i,local:Math.min(d,Math.max(0,t-at)),start:at,total};
  at+=d;
 }
 return{index:0,local:0,start:0,total};
}
function animationFrame(element,local){
 const type=ANIMATIONS.includes(element.animation)?element.animation:'none',delay=number(element.delay,0,MAX_DURATION,0);
 const progress=Math.max(0,Math.min(1,(local-delay)/ANIMATION_SECONDS));
 const eased=1-Math.pow(1-progress,3);
 if(type==='fade')return{opacity:eased,x:0,y:0,scale:1};
 if(type==='rise')return{opacity:eased,x:0,y:(1-eased)*36,scale:1};
 if(type==='zoom')return{opacity:eased,x:0,y:0,scale:.8+.2*eased};
 return{opacity:1,x:0,y:0,scale:1};
}
function transitionFrame(page,local){
 const d=number(page.duration,MIN_DURATION,MAX_DURATION,5),mode=page.transition;
 const phase=Math.min(.5,d/3),progress=Math.max(0,Math.min(1,local/phase));
 if(mode==='fade')return{opacity:progress,slide:0};
 if(mode==='slide')return{opacity:1,slide:(1-progress)*55};
 return{opacity:1,slide:0};
}
function fromDesign(raw){
 if(!raw||!Array.isArray(raw.objects))throw Error('도안 프로젝트를 확인해 주세요.');
 if(raw.objects.length>MAX_ITEMS)throw Error('도안 요소가 한 페이지의 제한을 넘어요.');
 const elements=raw.objects.map((o,i)=>element(o.type,{id:'imported-'+i,x:o.x,y:o.y,w:Math.max(10,Math.abs(o.w||10)),h:Math.max(10,Math.abs(o.h||10)),fill:o.fill==='none'?'#ffffff':o.fill,
  stroke:o.stroke,fontSize:o.fontSize,content:o.text,src:o.src,align:o.align==='start'?'left':o.align==='end'?'right':'center'}));
 return validate({format:FORMAT,title:text(raw.title)||'가져온 도안',layout:'a4',
  pages:[makePage('도안 1',elements)],active:0});
}
function fromSlides(raw){
 if(!raw||!Array.isArray(raw.slides)||!raw.slides.length||raw.slides.length>MAX_PAGES)throw Error('발표 슬라이드를 확인해 주세요.');
 const theme={sky:['#F3F8FF','#19314B'],mint:['#F0FAF5','#173D39'],peach:['#FFF5EC','#543127'],midnight:['#16233B','#FFFFFF']}[raw.theme]||['#F3F8FF','#19314B'];
 const pages=raw.slides.map((s,i)=>{
  const els=[element('text',{id:'slide-'+i+'-title',x:70,y:95,w:820,h:100,fontSize:50,fill:theme[1],content:text(s.title,170)}),
  element('text',{id:'slide-'+i+'-body',x:92,y:220,w:776,h:170,fontSize:30,fill:theme[1],content:text(s.body,800)})];
  if(s.eyebrow)els.unshift(element('text',{id:'slide-'+i+'-eyebrow',x:100,y:36,w:760,h:44,fontSize:19,fill:theme[1],content:text(s.eyebrow,100)}));
  if(s.image)els.push(element('image',{id:'slide-'+i+'-image',x:620,y:242,w:270,h:230,src:s.image}));
  return makePage(text(s.title,60)||'슬라이드 '+(i+1),els,theme[0]);
 });
 return validate({format:FORMAT,title:text(raw.title,90)||'가져온 발표',layout:'wide',pages,active:0});
}
function fromLegacy(kind,payload){
 if(kind==='design')return fromDesign(payload);
 if(kind==='slides')return fromSlides(payload);
 throw Error('도안·발표 작업만 편집 가능한 캔버스로 변환할 수 있어요.');
}
return {FORMAT,LAYOUTS,MAX_PAGES,MAX_ITEMS,TYPES,ANIMATIONS,TRANSITIONS,MIN_DURATION,MAX_DURATION,id,color,image,element,makePage,starter,nameTags,validate,fromLegacy,totalDuration,locateTime,animationFrame,transitionFrame,cleanVideoClip};
});
