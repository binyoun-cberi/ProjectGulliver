(function flashQuizQuality(){
  'use strict';
  function text(value){return String(value??'').replace(/\s+/g,' ').trim();}
  function key(value){return text(value).toLocaleLowerCase('ko-KR');}
  function script(value){
    const v=text(value);
    if(/^[0-9\s.,\-+/%]+$/.test(v))return 'number';
    if(/[가-힣]/.test(v))return 'hangul';
    if(/[A-Za-z]/.test(v))return 'latin';
    return 'other';
  }
  // Skip conflicting source prompts; don't teach a randomly chosen "correct"
  // answer where one identical question maps to multiple different meanings.
  function prepare(cards,direction='front'){
    const dir=direction==='back'?'back':'front',answerKey=dir==='front'?'back':'front';
    const groups=new Map();
    for(const card of Array.isArray(cards)?cards:[]){
      const prompt=text(card?.[dir]),answer=text(card?.[answerKey]);
      if(!prompt||!answer)continue;
      const k=key(prompt),g=groups.get(k)||{answers:new Set(),cards:[]};
      g.answers.add(key(answer));g.cards.push({...card,[dir]:prompt,[answerKey]:answer});
      groups.set(k,g);
    }
    const eligible=[],conflicting=[];
    for(const [prompt,g] of groups.entries()){
      if(g.answers.size===1)eligible.push(g.cards[0]);
      else conflicting.push(prompt);
    }
    const distinctAnswers=new Set(eligible.map(c=>key(c[answerKey])));
    return {eligible,conflicting,uniqueAnswers:distinctAnswers.size,answerKey,questionKey:dir};
  }
  function options(card,eligible,direction='front',random=Math.random){
    const answerKey=direction==='back'?'front':'back',answer=text(card?.[answerKey]);
    if(!answer)return [];
    const correctKey=key(answer);
    const seen=new Set([correctKey]);
    const pool=[];
    for(const candidate of eligible){
      const value=text(candidate?.[answerKey]),k=key(value);
      if(!value||seen.has(k))continue;
      seen.add(k);
      // Prefer similar written forms; semantic distractor quality still
      // depends on a well-curated teacher-authored deck.
      const distance=Math.abs([...value].length-[...answer].length);
      pool.push({value,score:(script(value)===script(answer)?0:10)+distance+random()*.35});
    }
    pool.sort((a,b)=>a.score-b.score);
    const picked=pool.slice(0,3).map(v=>v.value);
    if(picked.length!==3)return [];
    const choices=[answer,...picked];
    for(let i=choices.length-1;i>0;i--){
      const j=Math.floor(random()*(i+1));
      [choices[i],choices[j]]=[choices[j],choices[i]];
    }
    return choices;
  }
  const api=Object.freeze({prepare,options,key});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.FlashQuizQuality=api;
})();
