(()=>{
'use strict';
const S=window.GulliverStudioStorage,B=window.GulliverStudioBridge,$=id=>document.getElementById(id);
if(!S||!B)return;
const format=n=>{
 if(!Number.isFinite(n)||n<=0)return '0MB';
 return(n/(1024*1024)).toLocaleString('ko-KR',{maximumFractionDigits:1})+'MB';
};
async function refresh(){
 const target=$('studioStorageInfo');
 try{
  const info=await S.storageInfo(),quota=info.quota,percent=quota?Math.round(info.usage/quota*100):null;
  target.textContent='저장 공간 '+format(info.usage)+(quota?' / '+format(quota)+' ('+percent+'%)':' / 브라우저 한도 확인 불가')+
   ' · 공식 원본 '+format(info.officialBytes)+' ('+info.officialCount+'개)'+
   ' · 영상·음원 '+format(info.mediaBytes)+
   ' · 이미지 '+format(info.assetBytes)+
   ' · 대용량 원본 저장: '+(info.opfs?'OPFS 사용 가능':'IndexedDB 대체 사용')+
   ' · 보호 요청: '+(info.persisted?'허용됨':'미허용 또는 확인 불가');
  if(percent!==null&&percent>=75)target.textContent+=' · 저장 공간이 부족할 수 있어요. ZIP을 내려받아 보관해 주세요.';
  $('storagePersist').disabled=info.persisted;
 }catch(e){target.textContent='저장 공간을 확인하지 못했어요: '+(e.message||e)}
}
$('storageRefresh').addEventListener('click',()=>refresh());
$('storagePersist').addEventListener('click',async()=>{
 const button=$('storagePersist');button.disabled=true;
 try{
  const ok=await S.requestPersistentStorage();
  B.status(ok?'이 브라우저가 저장 공간 보호 요청을 허용했어요. 중요한 자료는 ZIP으로도 보관하세요.':'브라우저가 저장 공간 보호 요청을 허용하지 않았어요. ZIP 파일을 별도로 보관해 주세요.',!ok);
 }catch(e){B.status('저장 공간 보호 요청 실패: '+(e.message||e),true)}
 finally{await refresh()}
});
refresh();
})();
