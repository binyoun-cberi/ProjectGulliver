'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8877,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<120;i++){try{if((await fetch(base+'studio-unified-multitrack-export.js')).ok)return}catch{}await sleep(160)}throw Error('server unavailable')}
function ff(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{encoding:null,maxBuffer:10*1024*1024});assert.equal(r.status,0,r.stderr?.toString());return r.stdout}
function rgb(file,sec){
 const out=ff(['-ss',String(sec),'-i',file,'-frames:v','1','-vf','scale=1:1','-f','rawvideo','-pix_fmt','rgb24','-']);
 return Array.from(out.subarray(0,3));
}
function level(file,sec){
 const out=ff(['-ss',String(sec),'-i',file,'-t','.3','-ac','1','-ar','8000','-f','s16le','-']);
 let total=0,count=0;for(let i=0;i+1<out.length;i+=2){total+=Math.abs(out.readInt16LE(i));count++}
 return total/Math.max(1,count);
}
test('3.5 export encodes independently timed video colors, two WAV files and overlaid captions',{timeout:130000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser,tmp;
 try{
  await ready();tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gulliver-v35-'));
  const media=[];
  for(const [color,i] of [['red',0],['green',1],['blue',2]]){
   const name=path.join(tmp,color+'.mp4');
   ff(['-f','lavfi','-i','color=c='+color+':s=160x90:r=12:d=2','-t','2','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','-an','-y',name]);
   media.push({id:'u-color-'+i,mime:'video/mp4',name:color+'.mp4',base64:fs.readFileSync(name).toString('base64')});
  }
  for(const [frequency,i] of [[400,0],[750,1]]){
   const name=path.join(tmp,'sound'+i+'.wav');
   ff(['-f','lavfi','-i','sine=frequency='+frequency+':duration=3','-ar','11025','-ac','1','-c:a','pcm_s16le','-y',name]);
   media.push({id:'u-sound-'+i,mime:'audio/wav',name:'sound'+i+'.wav',base64:fs.readFileSync(name).toString('base64')});
  }
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
  page.setDefaultTimeout(18000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await frame.locator('#exportWebm').waitFor();
  await page.evaluate(async ({media})=>{
   const editor=document.getElementById('editorFrame').contentWindow;
   for(const item of media){
    const bytes=Uint8Array.from(atob(item.base64),c=>c.charCodeAt(0));
    await GulliverStudioStorage.saveMedia({id:item.id,mime:item.mime,name:item.name,blob:new Blob([bytes],{type:item.mime}),createdAt:Date.now()});
   }
   const p=editor.GulliverStudioAdapter.capture();p.pages[0].duration=6;
   p.tracks=[
    ...[0,1,2].map((i)=>({id:'u-track-'+i,kind:'video',mediaId:'u-color-'+i,mime:'video/mp4',name:['빨강','초록','파랑'][i],start:i*2,duration:2,trimStart:0,x:0,y:0,w:960,h:540,stack:0})),
    ...[0,1].map((i)=>({id:'u-music-'+i,kind:'audio',mediaId:'u-sound-'+i,mime:'audio/wav',name:'배경음 '+i,start:i*2,duration:3,trimStart:0,volume:.8})),
    ...[0,1,2].map((i)=>({id:'u-caption-'+i,kind:'caption',name:'자막 '+i,text:'안녕 교실 '+i,start:i*2+.5,duration:1.2,x:80,y:420,w:800,h:75,fontSize:34,color:'#ffffff'}))
   ];
   editor.GulliverStudioAdapter.apply(p);
  },{media});
  await frame.locator('.multi-clip.video').first().waitFor();
  const capture=await frame.locator('body').evaluate(()=>GulliverStudioAdapter.capture());
  assert.equal(capture.tracks.length,8);
  const waitDownload=page.waitForEvent('download',{timeout:45000});
  await frame.locator('#exportWebm').click();
  const dl=await waitDownload,output=await dl.path();
  assert.match(dl.suggestedFilename(),/\.webm$/);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',output],{encoding:'utf8'});
  assert.equal(probe.status,0,probe.stderr);
  assert.deepEqual(JSON.parse(probe.stdout).streams.map(s=>s.codec_type).sort(),['audio','video']);
  const colors=[rgb(output,.6),rgb(output,2.6),rgb(output,4.6)];
  assert.ok(colors[0][0]>colors[0][1]*2&&colors[0][0]>colors[0][2]*2,'red frame '+colors[0]);
  assert.ok(colors[1][1]>colors[1][0]*1.5&&colors[1][1]>colors[1][2]*1.5,'green frame '+colors[1]);
  assert.ok(colors[2][2]>colors[2][0]*2&&colors[2][2]>colors[2][1]*2,'blue frame '+colors[2]);
  assert.ok(level(output,.5)>45,'first WAV audible');
  assert.ok(level(output,3.5)>45,'second WAV audible');
  assert.ok(level(output,5.5)<25,'no music after last clip');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM');if(tmp)fs.rmSync(tmp,{recursive:true,force:true})}
});
