(function toolRegression(){
  'use strict';
  const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
  let chromium;try{({chromium}=require('playwright-core'));}catch{}
  const browserReady=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/usr/bin/google-chrome','/opt/google/chrome/chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
  const origin='http://127.0.0.1:8986/';
  test('flash quiz source rejects ambiguous prompts and offers four distinct choices',()=>{
    const module={exports:{}};
    require('node:vm').runInNewContext(fs.readFileSync('flash-quiz-quality.js','utf8'),{module,window:{}});
    const q=module.exports;
    const cards=[
      {front:'물',back:'water'},{front:'물',back:'liquid'},
      {front:'불',back:'fire'},{front:'산',back:'mountain'},
      {front:'강',back:'river'},{front:'숲',back:'forest'},
      {front:'돌',back:'stone'}
    ];
    const built=q.prepare(cards,'front');
    assert.equal(built.conflicting.length,1);
    assert.equal(built.eligible.length,5);
    assert.equal(built.uniqueAnswers,5);
    const options=q.options(built.eligible[0],built.eligible);
    assert.equal(options.length,4);
    assert.equal(new Set(options.map(q.key)).size,4);
    assert.ok(options.includes(built.eligible[0].back));
    const reversed=q.prepare([{front:'one',back:'뜻'},{front:'two',back:'뜻'},{front:'three',back:'의미'}],'back');
    assert.equal(reversed.conflicting.length,1);
    assert.equal(reversed.eligible.length,1);
  });
  test('QR generation marks previews stale, and checklist undo and quiz projection remain usable in Chrome',{
    timeout:180000,skip:!browserReady&&'Chrome driver/browser not available'
  },async()=>{
    const server=spawn('python3',['-m','http.server','8986','--bind','127.0.0.1'],{stdio:'ignore'});
    let browser;
    try{
      let ready=false;
      for(let i=0;i<100;i++){
        try{if((await fetch(origin+'tools-catalog.js')).ok){ready=true;break;}}catch{}
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.equal(ready,true);
      browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
      const context=await browser.newContext({viewport:{width:1280,height:900}});
      await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(origin).origin?route.continue():route.abort());
      const page=await context.newPage();page.setDefaultTimeout(15000);

      // 1. The teacher should never see two valid QR download buttons for stale content.
      await page.addInitScript(()=>{
        window.qrcode=()=>({addData(){},make(){},getModuleCount(){return 21},isDark(r,c){return (r+c)%3===0}});
      });
      await page.goto(origin+encodeURIComponent('QR코드.html'));
      await page.locator('#qrText').fill('첫번째 수업 링크');
      await page.locator('#generateBtn').click();
      assert.equal(await page.locator('#downloadBtn').isEnabled(),true);
      assert.equal(await page.locator('#qrFreshness').getAttribute('data-status'),'ready');
      await page.locator('#qrText').fill('변경된 수업 링크');
      assert.equal(await page.locator('#downloadBtn').isDisabled(),true);
      assert.equal(await page.locator('#qrCanvas.show').count(),0);
      assert.equal(await page.locator('#qrFreshness').getAttribute('data-status'),'stale');
      await page.locator('#generateBtn').click();
      assert.equal(await page.locator('#downloadBtn').isEnabled(),true);
      await page.locator('#darkColor').fill('#000080');
      assert.equal(await page.locator('#downloadBtn').isDisabled(),true);

      // 2. A conflicting word cannot show as a valid quiz question.
      await page.goto(origin+encodeURIComponent('플래시퀴즈메이커.html'));
      await page.evaluate(()=>{
        localStorage.setItem('flashQuizMakerPlusV3',JSON.stringify({
          cards:[
            {id:'bad-a',front:'같은 물음',back:'서로 다른 답 1'},
            {id:'bad-b',front:'같은 물음',back:'서로 다른 답 2'},
            ...['달','해','별','강','바다'].map((name,i)=>({id:'good-'+i,front:name,back:['달빛','햇빛','별빛','강물','바닷물'][i]}))
          ],known:[],sound:false,seededSample:false
        }));
      });
      await page.reload();
      await page.locator('[data-v61-start="quiz"]').click();
      await page.locator('#quizQualityNotice').getByText(/서로 다른 정답/).waitFor();
      const questions=[];
      for(let i=0;i<5;i++){
        questions.push(await page.locator('#quizQuestion').textContent());
        const choices=await page.locator('#choiceList .choice').allTextContents();
        assert.equal(choices.length,4);
        assert.equal(new Set(choices).size,4);
        await page.locator('#choiceList .choice').first().click();
        if(i<4)await page.locator('#nextQuizBtn').click();
      }
      assert.equal(new Set(questions).size,5);
      assert.ok(!questions.includes('같은 물음'));

      // 3. Existing checklist state survives, keyboard activation and undo work.
      await page.goto(origin+encodeURIComponent('학급췍.html'));
      await page.locator('#desk-grid .desk').first().waitFor();
      const first=page.locator('#desk-grid .desk').first();
      assert.equal(await first.getAttribute('aria-pressed'),'false');
      await first.focus();
      await page.keyboard.press('Space');
      assert.equal(await first.getAttribute('aria-pressed'),'true');
      assert.equal(await first.evaluate(e=>document.activeElement===e),true);
      assert.equal(await page.locator('#undoChecklistBtn').isEnabled(),true);
      await page.locator('#undoChecklistBtn').click();
      assert.equal(await first.getAttribute('aria-pressed'),'false');
      assert.equal(await page.locator('#undoChecklistBtn').isDisabled(),true);
      assert.match(await page.locator('#pendingTitle').textContent(),/25명/);
      await first.click();
      await page.reload();
      assert.equal(await page.locator('#desk-grid .desk').first().getAttribute('aria-pressed'),'true');
      await page.locator('.gt-open-display').click();
      const studentPages=context.pages().filter(p=>p!==page);
      if(studentPages.length){
        const student=studentPages.at(-1);
        await student.locator('#displayConnection[data-state="connected"]').waitFor();
        assert.equal(await student.locator('#pendingNames,#desk-grid').count(),0);
        await student.close();
      }
    }finally{await browser?.close();server.kill('SIGTERM');}
  });
})();
