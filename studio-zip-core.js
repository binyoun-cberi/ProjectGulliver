(function(root,factory){
'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
root.GulliverStudioZip=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// ZIP STORE, no compression and no ZIP64. Files remain binary blobs: no base64 inflation.
// CRC is calculated in fixed 1MiB slices. The resulting Blob references each original Blob.
const MAX_BYTES=512*1024*1024,MAX_ENTRIES=800,CHUNK=1024*1024;
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
function crcStep(crc,bytes){for(let i=0;i<bytes.length;i++)crc=table[(crc^bytes[i])&255]^(crc>>>8);return crc>>>0}
async function crcBlob(blob){
 let crc=0xffffffff;
 for(let at=0;at<blob.size;at+=CHUNK)crc=crcStep(crc,new Uint8Array(await blob.slice(at,Math.min(at+CHUNK,blob.size)).arrayBuffer()));
 return(crc^0xffffffff)>>>0;
}
function assertPath(path){
 if(typeof path!=='string'||path.length>190||!path||path.startsWith('/')||path.includes('\\')||
  !path.split('/').every(part=>part&&part!=='.'&&part!=='..'&&/^[a-zA-Z0-9._-]+$/.test(part)))
  throw Error('ZIP 파일 경로가 올바르지 않아요.');
 return path;
}
function header(length){return new Uint8Array(length)}
function writeLocal(name,bytes,blob,crc){
 const out=header(30+bytes.length),v=new DataView(out.buffer);v.setUint32(0,0x04034b50,true);
 v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(8,0,true);
 v.setUint32(14,crc,true);v.setUint32(18,blob.size,true);v.setUint32(22,blob.size,true);
 v.setUint16(26,bytes.length,true);out.set(bytes,30);return out;
}
function writeCentral(bytes,blob,crc,offset){
 const out=header(46+bytes.length),v=new DataView(out.buffer);v.setUint32(0,0x02014b50,true);
 v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);
 v.setUint32(16,crc,true);v.setUint32(20,blob.size,true);v.setUint32(24,blob.size,true);
 v.setUint16(28,bytes.length,true);v.setUint32(42,offset,true);out.set(bytes,46);return out;
}
async function create(entries){
 if(!Array.isArray(entries)||entries.length<1||entries.length>MAX_ENTRIES)throw Error('ZIP 파일 목록이 너무 많거나 비어 있어요.');
 let offset=0,dirBytes=0;const chunks=[],directory=[],seen=new Set();
 for(const item of entries){
  const path=assertPath(item.path),blob=item.blob;
  if(seen.has(path))throw Error('ZIP에 같은 파일 이름이 반복돼요: '+path);seen.add(path);
  if(!(blob instanceof Blob)||!Number.isSafeInteger(blob.size)||blob.size>MAX_BYTES)throw Error('ZIP 원본이 올바르지 않아요.');
  const name=enc.encode(path);
  const crc=await crcBlob(blob),local=writeLocal(path,name,blob,crc),central=writeCentral(name,blob,crc,offset);
  chunks.push(local,blob);directory.push(central);dirBytes+=central.length;
  offset+=local.length+blob.size;
  if(offset+dirBytes+22>MAX_BYTES)throw Error('ZIP 전체 백업은 최대 512MB예요. 큰 파일은 개별 저장해 주세요.');
 }
 const end=header(22),v=new DataView(end.buffer);
 v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
 v.setUint32(12,dirBytes,true);v.setUint32(16,offset,true);
 chunks.push(...directory,end);return new Blob(chunks,{type:'application/zip'});
}
async function open(blob){
 if(!(blob instanceof Blob)||blob.size<22||blob.size>MAX_BYTES)throw Error('ZIP 백업의 크기가 올바르지 않아요. (최대 512MB)');
 const tailOffset=Math.max(0,blob.size-65557),tail=new Uint8Array(await blob.slice(tailOffset).arrayBuffer()),tv=new DataView(tail.buffer);
 let last=-1;for(let i=tail.length-22;i>=0;i--)if(tv.getUint32(i,true)===0x06054b50&&
  i+22+tv.getUint16(i+20,true)===tail.length){last=i;break}
 if(last<0)throw Error('ZIP의 중앙 파일 목록을 찾지 못했어요.');
 const count=tv.getUint16(last+10,true),countDisk=tv.getUint16(last+8,true),
  size=tv.getUint32(last+12,true),offset=tv.getUint32(last+16,true);
 if(!count||count>MAX_ENTRIES||count!==countDisk||tv.getUint16(last+4,true)!==0||tv.getUint16(last+6,true)!==0||
  count===0xffff||offset===0xffffffff||size===0xffffffff||offset+size>tailOffset+last)
  throw Error('지원하지 않는 ZIP 형식이나 손상된 파일 목록이에요.');
 const dir=new Uint8Array(await blob.slice(offset,offset+size).arrayBuffer()),dv=new DataView(dir.buffer);
 const files=new Map();let at=0;
 for(let i=0;i<count;i++){
  if(at+46>dir.length||dv.getUint32(at,true)!==0x02014b50)throw Error('ZIP 파일 목록이 손상됐어요.');
  const flags=dv.getUint16(at+8,true),method=dv.getUint16(at+10,true),crc=dv.getUint32(at+16,true),
   packed=dv.getUint32(at+20,true),original=dv.getUint32(at+24,true),nl=dv.getUint16(at+28,true),
   extra=dv.getUint16(at+30,true),comment=dv.getUint16(at+32,true),localAt=dv.getUint32(at+42,true);
  if(flags&1||method!==0||packed!==original||original>MAX_BYTES||nl>190||at+46+nl+extra+comment>dir.length)
   throw Error('ZIP 압축·암호화 방식이 지원되지 않거나 파일이 손상됐어요.');
  let name;try{name=assertPath(dec.decode(dir.slice(at+46,at+46+nl)))}catch(e){throw Error('ZIP 내부 파일 이름이 올바르지 않아요.')}
  if(files.has(name))throw Error('ZIP에 중복 파일이 있어요: '+name);
  if(localAt+30>offset)throw Error('ZIP 데이터 위치가 손상됐어요.');
  const lv=new DataView(await blob.slice(localAt,localAt+30).arrayBuffer());
  if(lv.getUint32(0,true)!==0x04034b50||lv.getUint16(8,true)!==0)throw Error('ZIP 원본 파일 헤더가 올바르지 않아요.');
  const ln=lv.getUint16(26,true),le=lv.getUint16(28,true),dataStart=localAt+30+ln+le;
  if(dataStart+packed>offset)throw Error('ZIP 파일 범위가 손상됐어요.');
  let realName;try{realName=dec.decode(new Uint8Array(await blob.slice(localAt+30,localAt+30+ln).arrayBuffer()))}catch(e){throw Error('ZIP 파일 이름을 해석하지 못했어요.')}
  if(realName!==name)throw Error('ZIP 파일 이름 정보가 일치하지 않아요.');
  files.set(name,{crc,start:dataStart,size:original});
  at+=46+nl+extra+comment;
 }
 if(at!==dir.length)throw Error('ZIP 파일 목록 끝부분이 손상됐어요.');
 return {
  names:()=>[...files.keys()],
  has:path=>files.has(path),
  async readBlob(path){
   const f=files.get(assertPath(path));if(!f)throw Error('ZIP 백업에서 원본을 찾지 못했어요: '+path);
   const source=blob.slice(f.start,f.start+f.size);
   if(await crcBlob(source)!==f.crc)throw Error('ZIP 원본의 무결성 검사에 실패했어요: '+path);
   return source;
  },
  async readText(path){
   const part=await this.readBlob(path);
   if(part.size>25*1024*1024)throw Error('ZIP 구성 정보가 너무 커요.');
   return await part.text();
  }
 };
}
return {MAX_BYTES,MAX_ENTRIES,crcBlob,create,open,assertPath};
});
