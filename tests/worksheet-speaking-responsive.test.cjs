'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const sizes=[[320,568],[360,640],[375,667],[390,844],[430,932],[568,320],[667,375],[844,390],[768,1024],[1024,768],[1440,900]];
test('speaking parts, transcript and controls fit portrait and landscape without scrolling', {skip:!chromium||!process.env.CHROME_BIN,timeout:360000},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const context=await browser.newContext();await context.addInitScript(()=>{const nativeSetTimeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>nativeSetTimeout(fn,ms===650?20:ms,...args);window.SpeechRecognition=class{start(){window.rec=this;this.onstart?.();}abort(){}};});
  await context.route('https://clasheet.test/**',async route=>{const file=path.resolve('.'+decodeURIComponent(new URL(route.request().url()).pathname));await route.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'application/javascript'});});
  const p=await context.newPage();let checks=0,splitSeen=false;
  async function fit(label){const data=await p.evaluate(()=>{const ids=['prompt','mic','speechStatus','heardBubble','heard','done'];return {w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,boxes:ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:e.scrollHeight,client:e.clientHeight};})};});assert.ok(data.sw<=data.w+1&&data.sh<=data.h+1,label+' document overflow '+JSON.stringify(data));for(const b of data.boxes){assert.ok(b.left>=-1&&b.right<=data.w+1&&b.top>=-1&&b.bottom<=data.h+1,label+' outside viewport '+JSON.stringify(b));assert.ok(b.scroll<=b.client+1,label+' clipped '+JSON.stringify(b));}checks++;}
  for(const language of ['korean','english']){
   await p.goto('https://clasheet.test/말하기.html');await p.selectOption('#language',language);await p.selectOption('#kind','custom');await p.selectOption('#count','5');
   const text=language==='korean'?['나는 학교에 가요.','친구들과 함께 도서관에서 책을 읽고 새롭게 알게 된 이야기를 나누어요. '.repeat(3).slice(0,120),'가'.repeat(120),'오늘은 날씨가 좋아요.','마지막 문제입니다.']:['Hello, I am Mina.','Today we will walk to the library and read a story together, then talk about our favorite part of the book.','Supercalifragilisticexpialidocious'.repeat(3),'I like books.','This is the last question.'];
   await p.fill('#text',text.join('\n'));await p.click('#setup button');const url=await p.inputValue('#link');
   for(const [width,height] of sizes){
    await p.setViewportSize({width,height});await p.goto(url);await p.evaluate(()=>sessionStorage.clear());await p.reload();await p.evaluate(()=>document.fonts.ready);await p.click('#start');
    for(let question=0;question<5;question++){
     await fit(`${language} ${width}x${height} q${question}`);if(process.env.WORKSHEET_QA_DIR&&question===1&&[390,568].includes(width)){fs.mkdirSync(process.env.WORKSHEET_QA_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.WORKSHEET_QA_DIR,`speaking-fit-${language}-${width}x${height}.png`)});}
     if(question===0){await p.click('#mic');await p.evaluate(()=>{const r=[{transcript:'아주 긴 인식 결과가 계속 이어집니다. '.repeat(30)}];r.isFinal=false;rec.onresult({results:[r]});});await fit('long transcript');await p.evaluate(()=>rec.onerror({error:'not-allowed'}));await fit('permission denied');}
     let parts=0;
     while(await p.locator('#run').isVisible()&&(await p.locator('#progress').textContent()).startsWith((question+1)+' /')){
      assert.ok(parts++<30,'part transition stalled');await p.click('#mic');await p.evaluate(()=>{const r=[{transcript:document.getElementById('prompt').textContent}];r.isFinal=true;rec.onresult({results:[r]});});await p.waitForTimeout(60);
      if(await p.locator('#run').isVisible())await fit('after correct part');
      if(parts>1)splitSeen=true;
     }
    }
    assert.equal(await p.locator('#summary').textContent(),'5 / 5');assert.equal(await p.locator('#skipped').textContent(),'넘긴 문제 0개');console.log(`${language} ${width}x${height} passed`);
   }
  }
  await p.setViewportSize({width:320,height:568});await p.goto('https://clasheet.test/말하기.html');await p.selectOption('#kind','custom');await p.selectOption('#count','5');await p.fill('#text',Array.from({length:5},(_,i)=>i+' '+('친구들과 함께 재미있는 책을 읽어요. '.repeat(6)).slice(0,115)).join('\n'));await p.click('#setup button');await p.goto(await p.inputValue('#link'));await p.click('#start');
  await p.click('#mic');await p.evaluate(()=>{const r=[{transcript:document.getElementById('prompt').textContent}];r.isFinal=true;rec.onresult({results:[r]});});await p.waitForTimeout(60);
  assert.match(await p.locator('#progress').textContent(),/^1 \/ 5/);assert.equal(await p.locator('.practice-heading').textContent(),'이어서 말해 보세요');const remaining=await p.locator('#prompt').textContent();
  await p.reload();await p.click('#start');assert.equal(await p.locator('#prompt').textContent(),remaining);await p.setViewportSize({width:568,height:320});await p.waitForTimeout(60);await fit('rotate during split question');assert.equal(await p.locator('.practice-heading').textContent(),'이어서 말해 보세요');
  for(let i=0;i<5;i++)await p.click('#done');assert.equal(await p.locator('#summary').textContent(),'0 / 5');assert.equal(await p.locator('#skipped').textContent(),'넘긴 문제 5개');
  assert.ok(splitSeen,'long questions must be split');console.log(`${checks} viewport and clipping checks passed`);
 }finally{await browser.close();}
});
