'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process'),{chromium}=require('playwright-core');
const port=8891,base='http://127.0.0.1:'+port+'/',site=base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=blank';
async function ready(){for(let i=0;i<120;i++){try{if((await fetch(base+'studio-unified-waveform.js')).ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw Error('site unavailable')}
function ff(args){const p=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{encoding:null,maxBuffer:10485760});assert.equal(p.status,0,p.stderr?.toString());return p.stdout}
function level(file,sec,hz){
 const b=ff(['-ss',String(sec),'-i',file,'-t','0.25','-af','bandpass=f='+hz+':width_type=h:width=90','-ac','1','-ar','8000','-f','s16le','-']);
 let sum=0,n=0;for(let k=0;k+1<b.length;k+=2){const v=b.readInt16LE(k);sum+=v*v;n++}return Math.sqrt(sum/Math.max(1,n));
}
test('3.6 original MP4 soundtrack and separate WAV mix with fades and visible real waveform',{timeout:135000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});let browser,tmp;
 try{
  await ready();tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gulliver-v36-'));const vid=path.join(tmp,'original.mp4'),wav=path.join(tmp,'background.wav');
  ff(['-f','lavfi','-i','color=c=blue:s=160x90:r=12:d=5','-f','lavfi','-i','sine=frequency=480:duration=5','-t','5','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart','-y',vid]);
  ff(['-f','lavfi','-i','sine=frequency=880:duration=4','-ac','1','-ar','11025','-c:a','pcm_s16le','-y',wav]);
  const media=[{id:'u-v36-video',name:'original.mp4',mime:'video/mp4',base64:fs.readFileSync(vid).toString('base64')},{id:'u-v36-wav',name:'background.wav',mime:'audio/wav',base64:fs.readFileSync(wav).toString('base64')}];
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage({viewport:{width:1250,height:850},acceptDownloads:true});page.setDefaultTimeout(20000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(site,{waitUntil:'domcontentloaded'});const frame=page.frameLocator('#editorFrame');await frame.locator('[data-design-tab="motion"]').click();
  await page.evaluate(async media=>{
   const editor=document.querySelector('#editorFrame').contentWindow;
   for(const item of media){
    const bytes=Uint8Array.from(atob(item.base64),x=>x.charCodeAt(0));
    await GulliverStudioStorage.saveMedia({id:item.id,name:item.name,mime:item.mime,blob:new Blob([bytes],{type:item.mime}),createdAt:Date.now()});
   }
   const p=editor.GulliverStudioAdapter.capture();p.pages[0].duration=6;
   p.tracks=[
    {id:'u-v36-trackvideo',kind:'video',mediaId:'u-v36-video',mime:'video/mp4',name:'원본 목소리',start:0,duration:5,trimStart:0,volume:1,muted:false,fadeIn:1,fadeOut:1,x:0,y:0,w:960,h:540,stack:0},
    {id:'u-v36-trackwav',kind:'audio',mediaId:'u-v36-wav',mime:'audio/wav',name:'배경음악',start:2,duration:2,trimStart:0,volume:.5,fadeIn:.5,fadeOut:.5}
   ];
   editor.GulliverStudioAdapter.apply(p);
  },media);
  await frame.locator('.multi-clip.audio').first().waitFor({state:'visible'});
  await frame.locator('.multi-clip.audio').first().click();
  await frame.locator('.multi-volume-label input[type="range"]').waitFor({state:'visible'});
  const wavDrawn=await frame.locator('.multi-clip.audio .multi-waveform').evaluate(async el=>{
   for(let i=0;i<50;i++){if(el.width>0&&el.height>0)return true;await new Promise(resolve=>setTimeout(resolve,100))}return false;
  });assert.equal(wavDrawn,true,'WAV must display a decoded source waveform');
  await frame.locator('.multi-clip.video').first().click();
  assert.equal(await frame.locator('.multi-sound-toggle input').isChecked(),true,'original soundtrack enabled');
  await frame.locator('[data-design-tab="export"]').click();
  const wait=page.waitForEvent('download',{timeout:55000});await frame.locator('#exportWebm').click();
  const dl=await wait,output=await dl.path();assert.match(dl.suggestedFilename(),/\.webm$/);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',output],{encoding:'utf8'});
  assert.equal(probe.status,0,probe.stderr);assert.deepEqual(JSON.parse(probe.stdout).streams.map(s=>s.codec_type).sort(),['audio','video']);
  const initial=level(output,.1,480),middle=level(output,1.5,480),end=level(output,4.7,480);
  assert.ok(middle>initial*1.5+10,'original sound fade in: '+JSON.stringify({initial,middle,end}));
  assert.ok(middle>end*1.5+10,'original sound fade out: '+JSON.stringify({initial,middle,end}));
  const before=level(output,1.4,880),during=level(output,3,880),after=level(output,4.5,880);
  assert.ok(during>before*1.8+12,'WAV mixed over original soundtrack: '+JSON.stringify({before,during,after}));
  assert.ok(during>after*1.8+12,'WAV ends at its own clip boundary');
  assert.deepEqual(errs,[]);
 }finally{await browser?.close();server.kill('SIGTERM');if(tmp)fs.rmSync(tmp,{recursive:true,force:true})}
});
