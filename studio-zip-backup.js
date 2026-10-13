(()=>{
'use strict';
const S=window.GulliverStudioStorage,Z=window.GulliverStudioZip,L=window.GulliverStudioLibraryCore,
 C=window.GulliverStudioCore,O=window.GulliverOfficialProjectCore,M=window.GulliverMediaCore,
 W=window.ClassroomWorkspace,B=window.GulliverStudioBridge,$=id=>document.getElementById(id);
if(!S||!Z||!L||!C||!O||!M||!W||!B)throw Error('ZIP 보관함을 준비하지 못했어요.');
let busy=false;
function binaryPath(kind,i,ext){return kind+'/'+i+'.'+ext}
async function exportZip(){
 if(busy)return;busy=true;const btn=$('libraryZipBackup'),original=btn.textContent;
 btn.disabled=true;btn.textContent='ZIP 백업 만드는 중…';
 B.status('원본 자료를 ZIP 전체 백업에 담고 있어요. 저장이 끝날 때까지 이 창을 닫지 마세요.');
 try{
  if(C.managed(B.getState().activeKind))await B.sync(true);
  const projects=(await S.projects()).map(C.normalizeProject),assets=await S.assets(),media=await S.media(),
   official=await S.official(),folders=await S.folders(),activities=W.read();
  // Validate counts and legacy activity model before producing a misleading success.
  L.checkedManifest({format:L.MAGIC,version:L.VERSION,projects,assets,media,official,folders,activities});
  const files=[],images=[],clips=[],originals=[];
  for(const [i,asset] of assets.entries()){
   if(!C.recognizeAsset(asset.blob))throw Error('소재함의 이미지가 올바르지 않아요: '+asset.name);
   const path=binaryPath('assets',i,asset.mime==='image/jpeg'?'jpg':'png');
   files.push({path,blob:asset.blob});
   images.push({name:C.assetName(asset.name),mime:asset.mime,createdAt:asset.createdAt||Date.now(),file:path,size:asset.blob.size});
  }
  for(const [i,item] of media.entries()){
   if(!M.mediaAllowed(item.blob)||item.blob.type!==item.mime)throw Error('동영상·WAV 원본을 확인해 주세요: '+item.name);
   const path=binaryPath('media',i,'bin');
   files.push({path,blob:item.blob});
   clips.push({id:item.id,name:String(item.name||'영상 소재').slice(0,90),mime:item.mime,
    createdAt:item.createdAt||Date.now(),file:path,size:item.blob.size});
  }
  for(const [i,p] of official.entries()){
   await O.validateFile(new File([p.blob],p.name,{type:p.blob.type}),p.kind);
   const path=binaryPath('official',i,p.kind==='video'?'fcproj':'scraftz');
   files.push({path,blob:p.blob});
   originals.push({id:p.id,kind:p.kind,name:p.name,title:p.title,size:p.blob.size,folderId:p.folderId||'',
    createdAt:p.createdAt,updatedAt:p.updatedAt,file:path});
  }
  const manifest={format:'gulliver.studio.zip',version:2,createdAt:new Date().toISOString(),
   folders,projects,assets:images,media:clips,official:originals,activities};
  const text=JSON.stringify(manifest);
  if(new Blob([text]).size>24*1024*1024)throw Error('ZIP 프로젝트 설명 데이터가 24MB를 넘어요.');
  const estimated=new Blob([text]).size+files.reduce((sum,item)=>sum+item.blob.size+270,350);
  if(estimated>Z.MAX_BYTES)throw Error('ZIP 백업 512MB 한도를 넘어요. 큰 공식 프로젝트는 개별 다운로드해 주세요.');
  const blob=await Z.create([{path:'manifest.json',blob:new Blob([text],{type:'application/json'})},...files]);
  B.download(blob,'뚝딱제작실-전체백업-'+new Date().toISOString().slice(0,10)+'.zip','application/zip');
  B.status('ZIP 전체 백업을 내려받았어요. '+projects.length+'개 간편 작업, '+official.length+'개 공식 원본, '+media.length+'개 미디어 원본을 모두 포함했어요. 백업 파일은 안전한 곳에 보관해 주세요.');
 }catch(e){B.status('ZIP 전체 백업 실패: '+(e.message||e),true)}
 finally{busy=false;btn.disabled=false;btn.textContent=original}
}
async function loadZip(blob){
 const zip=await Z.open(blob),manifest=JSON.parse(await zip.readText('manifest.json'));
 if(!manifest||manifest.format!=='gulliver.studio.zip'||manifest.version!==2)
  throw Error('뚝딱 제작실 2.4 ZIP 전체 백업 파일이 아니에요.');
 // Reuse existing strict array/count checks while keeping the v1 JSON reader.
 L.checkedManifest({...manifest,format:L.MAGIC,version:L.VERSION});
 const paths=new Set(['manifest.json']);
 async function checkedBlob(entry,folder){
  if(!entry||typeof entry.file!=='string'||!entry.file.startsWith(folder+'/')||
    paths.has(entry.file)||!Number.isSafeInteger(entry.size)||entry.size<0)
   throw Error('ZIP 구성 파일 연결이 손상됐어요.');
  paths.add(entry.file);
  const file=await zip.readBlob(entry.file); // CRC32 checks all bytes before writing data.
  if(file.size!==entry.size)throw Error('ZIP 구성 파일 크기가 기록과 다릅니다: '+entry.file);
  return file;
 }
 const images=[],clips=[],originals=[];
 for(const item of manifest.assets){
  const blob=await checkedBlob(item,'assets');
  const normalized=new Blob([blob],{type:item.mime});
  if(!C.recognizeAsset(normalized))throw Error('ZIP 이미지 원본이 올바르지 않아요.');
  images.push({...item,blob:normalized});
 }
 for(const item of manifest.media||[]){
  const blob=await checkedBlob(item,'media');
  const normalized=new Blob([blob],{type:item.mime});
  if(!M.mediaAllowed(normalized))throw Error('ZIP 영상·음원 파일이 올바르지 않아요.');
  clips.push({...item,blob:normalized});
 }
 for(const item of manifest.official||[]){
  const blob=await checkedBlob(item,'official');
  const normalized=new Blob([blob],{type:O.TYPES[item.kind]?.mime||'application/octet-stream'});
  await O.validateFile(new File([normalized],item.name,{type:normalized.type}),item.kind);
  originals.push({...item,blob:normalized});
 }
 if(zip.names().length!==paths.size)throw Error('ZIP 백업에 목록에 없는 파일이 포함되어 있어요.');
 return {...manifest,assets:images,media:clips,official:originals};
}
$('libraryZipBackup').addEventListener('click',exportZip);
window.GulliverStudioZipBackup={exportZip,loadZip};
})();
