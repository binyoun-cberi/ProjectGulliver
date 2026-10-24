(()=>{'use strict';
const box=document.createElement('details');box.className='storage-status';box.setAttribute('aria-label','저장 상태');
const status=document.createElement('summary'),detail=document.createElement('p'),button=document.createElement('button');button.className='btn';button.type='button';button.textContent='브라우저 보관 요청';
detail.textContent='같은 주소·같은 브라우저 프로필에서 다시 열어 주세요. 시크릿 창, 브라우저 종료 시 사이트 데이터 삭제, 다른 주소에서는 기록이 이어지지 않을 수 있어요. 중요한 기록은 명단 탭의 ‘우리 반 백업’으로 파일도 보관해 주세요.';box.append(status,detail,button);document.querySelector('main>.hero').append(box);
async function check(){let available=false;const key='gulliver.storageCheck';try{const value=String(Date.now());localStorage.setItem(key,value);available=localStorage.getItem(key)===value;localStorage.removeItem(key)}catch{}
let persistent=false;try{persistent=await navigator.storage?.persisted?.()||false}catch{}
status.textContent=available?`이 기기에 저장 중${persistent?' · 보관 승인됨':''} · 저장 안내`:'저장 공간에 쓸 수 없습니다. 창을 닫기 전에 백업 파일을 내려받아 주세요.';
detail.textContent='저장 주소: '+(location.host||'로컬 파일')+'. 같은 주소·같은 브라우저에서 열어 주세요. 브라우저 데이터를 지우면 기록도 삭제될 수 있어요. 중요한 기록은 명단 탭에서 백업해 주세요.';box.open=!available;button.disabled=!available||persistent||!navigator.storage?.persist;button.hidden=persistent;}
button.onclick=async()=>{button.disabled=true;try{const granted=await navigator.storage.persist();await check();if(!granted)Gulliver.toast('보관 요청이 승인되지 않았습니다. 백업 파일도 보관해 주세요.')}catch{button.disabled=false;Gulliver.toast('이 브라우저에서는 보관 요청을 사용할 수 없습니다.')}};
window.addEventListener('pageshow',check);check();
})();
