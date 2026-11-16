(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.FractionLabMath=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function integer(x){return Number.isInteger(x);}
  function gcd(a,b){
    a=Math.abs(a);b=Math.abs(b);
    while(b){const r=a%b;a=b;b=r;}
    return a||1;
  }
  function lcm(a,b){return a/gcd(a,b)*b;}
  function assertFraction(n,d){
    if(!integer(n)||!integer(d)||d<=0||n<0) throw new RangeError('분수는 0 이상의 정수 분자와 양의 정수 분모가 필요합니다.');
  }
  function reduce(n,d){
    assertFraction(n,d);
    if(n===0)return {n:0,d:1};
    const g=gcd(n,d);return {n:n/g,d:d/g};
  }
  function equal(a,b){
    assertFraction(a.n,a.d);assertFraction(b.n,b.d);
    return a.n*b.d===b.n*a.d;
  }
  function add(a,b){
    assertFraction(a.n,a.d);assertFraction(b.n,b.d);
    return reduce(a.n*b.d+b.n*a.d,a.d*b.d);
  }
  function subtract(a,b){
    assertFraction(a.n,a.d);assertFraction(b.n,b.d);
    const n=a.n*b.d-b.n*a.d;
    if(n<0)throw new RangeError('현재 단계에서는 음수 결과를 지원하지 않습니다.');
    return reduce(n,a.d*b.d);
  }
  function multiply(a,b){
    assertFraction(a.n,a.d);assertFraction(b.n,b.d);
    return reduce(a.n*b.n,a.d*b.d);
  }
  function mixed(n,d){
    assertFraction(n,d);
    return {whole:Math.floor(n/d),remainder:n%d,denominator:d};
  }
  // 같은 위치의 색칠을 정확하게 보존할 수 있을 때만 조각 수를 변경한다.
  // 공통 최소 단위로 확대한 뒤 새 조각 전체가 한 색인지 확인한다.
  function resample(mask,targetDenominator){
    if(!Array.isArray(mask)||!mask.length||mask.some(x=>typeof x!=='boolean')
      ||!integer(targetDenominator)||targetDenominator<1||targetDenominator>48)
      throw new RangeError('올바른 분할 정보가 필요합니다.');
    const unit=lcm(mask.length,targetDenominator);
    const oldSpan=unit/mask.length,newSpan=unit/targetDenominator;
    const units=Array.from({length:unit},(_,i)=>mask[Math.floor(i/oldSpan)]);
    const result=[];
    for(let i=0;i<targetDenominator;i++){
      const block=units.slice(i*newSpan,(i+1)*newSpan);
      if(block.some(v=>v!==block[0]))return null;
      result.push(block[0]);
    }
    return result;
  }
  function colored(mask){
    if(!Array.isArray(mask))throw new TypeError('분할 정보가 필요합니다.');
    return mask.filter(Boolean).length;
  }
  function strip(a,b){
    assertFraction(a.n,a.d);assertFraction(b.n,b.d);
    const common=lcm(a.d,b.d);
    return {denominator:common,first:a.n*(common/a.d),second:b.n*(common/b.d)};
  }
  return Object.freeze({gcd,lcm,reduce,equal,add,subtract,multiply,mixed,resample,colored,strip});
});
