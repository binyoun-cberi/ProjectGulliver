(function(root,factory){'use strict';const api=factory(root.GulliverMediaCore||require('./studio-media-core.js'));if(typeof module==='object'&&module.exports)module.exports=api;root.GulliverMusicCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const RATE=22050;
function presets(){
 return {
  welcome:{title:'안녕하세요, 환영해요',bpm:112,loops:2,melodyPitch:64,notes:{melody:[0,3,4,7,8,12],bass:[0,8],clap:[4,12],hat:[0,2,4,6,8,10,12,14]}},
  dance:{title:'신나는 놀이 시간',bpm:128,loops:4,melodyPitch:69,notes:{melody:[0,2,4,6,8,10,12,14],bass:[0,4,8,12],clap:[4,12],hat:[0,2,4,6,8,10,12,14]}},
  calm:{title:'조용한 정리 시간',bpm:82,loops:2,melodyPitch:60,notes:{melody:[0,4,7,11,15],bass:[0,8],clap:[],hat:[0,4,8,12]}}
 };
}
function waveform(p){
 const project=C.validateMusic(p),step=.25*60/project.bpm,total=project.loops*16*step;
 const n=Math.ceil((total+.5)*RATE),data=new Float32Array(n);
 const seedNoise=i=>{const x=Math.sin(i*12.9898+78.233)*43758.5453;return (x-Math.floor(x))*2-1;};
 for(let loop=0;loop<project.loops;loop++)for(const track of C.TRACKS)for(const slot of project.notes[track]){
  const begin=(loop*16+slot)*step,start=Math.round(begin*RATE);
  const length=track==='hat'?.08:track==='clap'?.2:track==='bass'?.28:.35;
  const count=Math.round(length*RATE);
  for(let i=0;i<count&&start+i<n;i++){
   const t=i/RATE,envelope=Math.exp(-t*(track==='hat'?50:track==='clap'?17:track==='bass'?10:7));
   let v=0;
   if(track==='melody'){
    const sequence=[0,2,4,7,9,7,4,2],semi=sequence[(slot>>1)%sequence.length];
    const hz=440*Math.pow(2,(project.melodyPitch+semi-69)/12);
    v=(Math.sin(2*Math.PI*hz*t)+.28*Math.sin(4*Math.PI*hz*t))*.22*envelope;
   }else if(track==='bass'){
    const hz=110*Math.pow(2,(project.melodyPitch-60)/12);
    v=Math.sin(2*Math.PI*hz*t)*.24*envelope;
   }else if(track==='clap'){v=seedNoise(start+i)*.2*envelope;}
   else{v=seedNoise(start+i)*.09*envelope;}
   data[start+i]+=v;
  }
 }
 const bytes=new Uint8Array(44+n*2),view=new DataView(bytes.buffer);
 const ascii=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 ascii(0,'RIFF');view.setUint32(4,36+n*2,true);ascii(8,'WAVE');ascii(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,RATE,true);view.setUint32(28,RATE*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
 ascii(36,'data');view.setUint32(40,n*2,true);
 for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,data[i]));view.setInt16(44+i*2,Math.round(v*32767),true);}
 return bytes;
}
return{RATE,presets,waveform};
});
