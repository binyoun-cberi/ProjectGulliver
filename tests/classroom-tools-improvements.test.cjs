(function classroomToolImprovementTests(){
  'use strict';
  const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
  const {spawn}=require('node:child_process');
  let chromium;try{({chromium}=require('playwright-core'));}catch{}
  const base='http://127.0.0.1:8983/';
  const available=Boolean(chromium&&(fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
  test('lesson board stages, student projection and video HTML safety are connected',()=>{
    const lesson=fs.readFileSync('이번 수업 알리미.html','utf8');
    const viewer=fs.readFileSync('gulliver-teacher-display-view.js','utf8');
    const video=fs.readFileSync('뚝딱영상.html','utf8');
    const workspace=fs.readFileSync('classroom-workspace.js','utf8');
    const clock=fs.readFileSync('시간 도구.html','utf8');
    assert.equal((lesson.match(/data-stage="(?:all|intro|act[123]|wrapup)"/g)||[]).length,6);
    assert.match(lesson,/lessonStageKey/);
    assert.match(viewer,/lesson-focus-activity/);
    assert.match(lesson,/lesson-notice-flow\.css/);
    assert.match(video,/safeVideoCards\(list\)/);
    assert.doesNotMatch(video,/\$\{v\.title\}<\/h3>/);
    assert.match(workspace,/timer:\{name:'수업 흐름 타이머',icon:'🕘',href:'시간 도구\.html'/);
    assert.match(clock,/classroom-workspace\.js\?v=/);
    const core=fs.readFileSync('time-tools-ui.js','utf8');
    assert.match(core,/ClassroomWorkspace\?\.mount/);
  });
  test('video backups cannot inject markup; lesson stage is synchronized and saved timer snapshots reopen', {
    timeout:180000,skip:!available&&'Chrome is not available'
  },async()=>{
    const server=spawn('python3',['-m','http.server','8983','--bind','127.0.0.1'],{stdio:'ignore'});
    let browser;
    try{
      let ready=false;
      for(let i=0;i<100;i++){
        try{if((await fetch(base+'gulliver-shared.js')).ok){ready=true;break;}}catch{}
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      assert.equal(ready,true);
      browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
      const context=await browser.newContext({viewport:{width:1280,height:850}});
      await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
      const page=await context.newPage();page.setDefaultTimeout(15000);
      await page.goto(base+encodeURIComponent('뚝딱영상.html'));
      const bad='<img src=x onerror="window.__executed=true">';
      await page.evaluate(text=>{
        localStorage.setItem('dd_video_board_v2',JSON.stringify([
          {id:"abc'",title:text,memo:'<script>window.__executed=true</script>',
           tags:['<svg onload="window.__executed=true">'],
           url:'https://youtu.be/dQw4w9WgXcQ',videoId:'dQw4w9WgXcQ'},
          {id:'evil',title:'위험한 주소',url:'javascript:alert(1)',videoId:'dQw4w9WgXcQ'}
        ]));
      },bad);
      await page.reload();
      assert.equal(await page.locator('.video-card').count(),2);
      assert.equal(await page.locator('.video-card h3').first().textContent(),bad);
      assert.equal(await page.locator('.video-card svg,.video-card script').count(),0);
      assert.equal(await page.evaluate(()=>window.__executed===true),false);
      assert.equal(await page.locator('.video-card').nth(1).locator('a:visible').count(),0);
      assert.match(await page.locator('.video-card').first().locator('a').getAttribute('href'),/^https:\/\/www\.youtube\.com\/watch\?v=/);
      await page.goto(base+encodeURIComponent('시간 도구.html'));
      const id=await page.evaluate(()=>{
        const item=window.ClassroomWorkspace.save({kind:'timer',title:'기존 저장 수업',payload:{
          title:'기존 저장 수업',events:[{name:'다시 시작하기',durationSec:420,note:'간단한 활동',color:'#556be9'}]
        }});
        return item.id;
      });
      await page.goto(base+encodeURIComponent('시간 도구.html')+'?activity='+encodeURIComponent(id));
      await page.locator('#ttEvents .tt-event').first().waitFor();
      assert.equal(await page.locator('#ttEvents .tt-event').count(),1);
      assert.equal(await page.locator('#ttTitle').inputValue(),'기존 저장 수업');
      assert.equal(await page.locator('#ttModes [data-mode="lesson"]').getAttribute('aria-selected'),'true');
      await page.goto(base+encodeURIComponent('이번 수업 알리미.html'));
      await page.locator('#input-topic').fill('가을 날씨 관찰하기');
      const popupEvent=page.waitForEvent('popup');
      await page.locator('.gt-open-display').click();
      const student=await popupEvent;
      await student.locator('#displayConnection[data-state="connected"]').waitFor();
      await page.locator('#lessonStageTabs [data-stage="act2"]').click();
      await student.locator('.lesson-card[data-lesson-stage="act2"] .lesson-focus-activity').waitFor();
      assert.equal(await student.locator('.lesson-activities,.lesson-objective,.lesson-wrapup').count(),0);
      assert.match(await student.locator('.lesson-topic').textContent(),/가을 날씨 관찰하기/);
      await page.locator('#lessonStageNext').click();
      await student.locator('.lesson-card[data-lesson-stage="act3"]').waitFor();
      await page.locator('#lessonStageTabs [data-stage="wrapup"]').click();
      await student.locator('.lesson-card[data-lesson-stage="wrapup"] .lesson-wrapup').waitFor();
      await page.locator('#lessonStageTabs [data-stage="intro"]').click();
      await student.locator('.lesson-card[data-lesson-stage="intro"] .lesson-objective').waitFor();
      await page.reload();
      assert.equal(await page.locator('#board').getAttribute('data-lesson-stage'),'intro');
      assert.equal(await page.locator('#input-topic').inputValue(),'가을 날씨 관찰하기');
      await page.setViewportSize({width:390,height:844});
      assert.equal(await page.locator('#lessonStageTabs [data-stage]').count(),6);
      const width=await page.locator('#lessonStageTabs').evaluate(n=>({scroll:n.scrollWidth,client:n.clientWidth}));
      assert.ok(width.scroll<=width.client+2,'stage controls overflow on phone');
      await student.close();
    }finally{
      await browser?.close();
      server.kill('SIGTERM');
    }
  });
})();
