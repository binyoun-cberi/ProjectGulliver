(function timeToolsBrowserSmoke(){
  'use strict';
  const test=require('node:test');
  const assert=require('node:assert/strict');
  const fs=require('node:fs');
  const {spawn}=require('node:child_process');
  let chromium;
  try{({chromium}=require('playwright-core'));}catch{}
  const base='http://127.0.0.1:8972/';
  const browserInstalled=Boolean(chromium && (fs.existsSync(chromium.executablePath())||['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));
  async function ready(){
    for(let i=0;i<100;i++){
      try{if((await fetch(base+'time-tools-core.js')).ok)return;}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw Error('time tools smoke server did not start');
  }
  test('the classroom tool synchronizes its selected mode, style and countdown in two windows',{
    timeout:180000,skip:!browserInstalled&&'Chrome/Chromium is not installed'
  },async()=>{
    const server=spawn('python3',['-m','http.server','8972','--bind','127.0.0.1'],{stdio:'ignore'});
    let browser;
    try{
      await ready();
      browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
      const context=await browser.newContext({viewport:{width:1320,height:850}});
      await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
      const page=await context.newPage();
      page.setDefaultTimeout(15000);
      await page.goto(base+encodeURIComponent('시간 도구.html'));
      await page.locator('#ttFace .tt-ring').waitFor();
      const studentWindowPromise=page.waitForEvent('popup');
      await page.locator('#ttStudent').click();
      const student=await studentWindowPromise;
      await student.locator('#displayConnection[data-state="connected"]').waitFor();
      await student.locator('.tt-student-ring').waitFor();
      await page.locator('#ttStyles [data-style="digital"]').click();
      await student.locator('.tt-student-digital').waitFor();
      await page.locator('#ttPresets [data-seconds="60"]').click();
      await student.locator('.tt-student-number').getByText('01:00').waitFor();
      await page.locator('#ttStart').click();
      await student.waitForFunction(()=>document.querySelector('.tt-student-number')?.textContent!=='01:00',{timeout:8000});
      await page.locator('#ttStart').click();
      await page.locator('[data-mode="clock"]').click();
      await student.locator('.tt-student-analog').waitFor();
      await page.locator('[data-mode="learn"]').click();
      await page.locator('#ttHour').fill('11');
      await page.locator('#ttLearnMinute').fill('25');
      await page.locator('#ttSetHands').click();
      await page.locator('#ttReveal').click();
      await student.locator('.tt-student-number').getByText('11:25').waitFor();
      await page.locator('[data-mode="period"]').click();
      await student.locator('.tt-student-events .tt-student-event').first().waitFor();
      assert.equal(await page.locator('#ttPeriodRows .tt-period-row').count(),6);
      assert.equal(await student.locator('.tt-student-events .tt-student-event').count(),6);
      await page.locator('#ttPeriodPresets [data-duration="45"]').click();
      await page.locator('#ttPeriodRows .tt-period-row').first().locator('[data-field="start"]').fill('08:50');
      await page.locator('#ttPeriodApply').click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gulliver.timeTools.v1')).periods[0].start),'08:50');
      await page.locator('#ttStyles [data-style="bar"]').click();
      await student.locator('.tt-student-track').waitFor();
      assert.equal(await student.locator('#ttPeriodSettings,#ttPeriodRows').count(),0);
      assert.equal(await student.locator('#ttEvents,#ttRecords,#ttStudentName').count(),0);
      await student.close();
    }finally{
      await browser?.close();
      server.kill('SIGTERM');
    }
  });
})();
