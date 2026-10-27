(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorksheetSpeakingRecognition=api;})(globalThis,()=>{
'use strict';
function normalize(text){return String(text).normalize('NFC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}']/gu,'');}
function tokens(text){return String(text).trim().split(/\s+/).filter(Boolean);}
// Ordered one-to-one matching: repeating one word cannot satisfy several positions.
function match(expected,heard){const a=tokens(expected).map(normalize),b=tokens(heard).map(normalize).filter(Boolean),dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]&&a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0;const mask=a.map(()=>false);while(i<a.length&&j<b.length){if(a[i]&&a[i]===b[j]){mask[i]=true;i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}return mask;}
function expiry(issued,expires,now=Date.now()){const start=Number(issued),end=Number(expires);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<=0||![86400000,604800000].includes(end-start)||start>now+300000)throw Error('유효기간이 올바르지 않은 과제 주소예요. 선생님께 새 QR을 요청해 주세요.');if(now>=end)throw Error('과제 유효기간이 끝났어요. 선생님께 새 QR을 요청해 주세요.');return end;}
return {normalize,tokens,match,expiry};
});
