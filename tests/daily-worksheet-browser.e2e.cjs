'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const chrome = [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
test('worksheet editor generates and prints student/teacher versions in real Chromium', {skip: !chrome && 'Chromium or Google Chrome is required; set CHROME_BIN to run locally'}, async () => {
  fs.mkdirSync('test-artifacts', { recursive: true });
  const browser = await chromium.launch({
    executablePath: chrome, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href, { waitUntil: 'load' });
    await page.locator('[data-mode="practice"]').click();
    assert.equal(await page.locator('#questions > li').count(),0,'changing mode clears the previous worksheet');
    await page.selectOption('#grade', '3');
    await page.locator('#unitMixRows select').selectOption('g3-add:add-carry-two');
    await page.locator('#unitMixRows input').fill('20');
    await page.locator('button.daily-primary').click();
    assert.equal(await page.locator('#questions > li').count(), 20);
    assert.equal(await page.locator('#questions .result-answer').count(), 20);
    const original = await page.locator('.result-answer').first().evaluate(el => getComputedStyle(el).visibility);
    assert.equal(original, 'hidden', 'the student preview must not leak answers');
    await page.screenshot({ path: 'test-artifacts/worksheet-desktop.png', fullPage: true });
    await page.locator('#toggleAnswers').click();
    assert.equal(await page.locator('.result-answer').first().evaluate(el => getComputedStyle(el).visibility), 'visible');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.result-answer').first().evaluate(el => getComputedStyle(el).visibility), 'hidden', 'print must hide answers by default');
    const student = await page.pdf({ path: 'test-artifacts/worksheet-student.pdf', format: 'A4', printBackground: true });
    assert.ok(student.length > 1000 && student.subarray(0, 4).toString() === '%PDF');
    await page.evaluate(() => document.body.classList.add('print-answers'));
    assert.equal(await page.locator('.result-answer').first().evaluate(el => getComputedStyle(el).visibility), 'visible', 'teacher print reveals answers');
    const teacher = await page.pdf({ path: 'test-artifacts/worksheet-teacher.pdf', format: 'A4', printBackground: true });
    assert.ok(teacher.length > 1000 && teacher.subarray(0, 4).toString() === '%PDF');
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => document.body.classList.remove('print-answers'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-artifacts/worksheet-mobile.png', fullPage: true });
    await page.locator('.gx-worksheet-picker summary').click();await page.locator('[data-worksheet-subject="korean"]').click();
    await page.selectOption('#grade', '4');
    await page.locator('#unitMixRows select').selectOption('k4-reading:reading-set-literary');
    assert.equal(await page.locator('#topicSetting').isVisible(), false, 'comprehensive choices belong in the check list');
    await page.locator('#unitMixRows input').fill('20');
    await page.locator('button.daily-primary').click();
    assert.equal(await page.locator('#questions > li').count(), 20);
    assert.equal(await page.locator('#questions .reading-text').count(), 4);
    assert.equal(pageErrors.length, 0, 'browser runtime errors: ' + pageErrors.join(' / '));
  } finally {
    await browser.close();
  }
});



test('Korean reading and listening assessments render, answer and grade in real Chromium', {skip: !chrome && 'Chromium or Google Chrome is required; set CHROME_BIN to run locally'}, async () => {
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const base=pathToFileURL(path.resolve('문제지 만들기.html')).href;
  const params=topic=>new URLSearchParams({subject:'korean',grade:'3',mode:'practice',unit:'k3-reading',topic,type:topic+'-five',count:'5',seed:'42'}).toString();
  await page.goto(base+'?'+params('reading-assessment'),{waitUntil:'load'});
  assert.equal(await page.locator('#koreanAssessmentStudent').isVisible(),true);
  await page.locator('#koreanStudentCode').fill('A01');
  await page.locator('#koreanSaveOptIn').check();
  await page.locator('#koreanExamStart').click();
  assert.equal(await page.locator('.korean-exam-question').count(),5);
  assert.equal(await page.locator('.korean-exam-passage p').count(),1);
  assert.ok((await page.locator('.korean-exam-passage p').first().innerText()).length>120);
  for(let i=0;i<5;i++)await page.locator('.korean-exam-question').nth(i).locator('input[type="radio"]').first().check();
  await page.locator('#koreanExamSubmit').click();
  assert.match(await page.locator('#koreanExamResult').innerText(),/평가 결과 · \d+점/);
  assert.equal(await page.locator('.korean-exam-feedback').count(),5);
  const saved=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('clasheet-korean-assessment-results.v1')||'[]')}catch{return null}});
  if(saved){assert.equal(saved.length,1);assert.equal(saved[0].code,'A01');assert.equal(saved[0].mode,'읽기');assert.ok(saved[0].score>=0);}
  else assert.match(await page.locator('#koreanSaveStatus').innerText(),/저장하지 못했습니다/);
  await page.locator('#koreanExamRetry').click();
  assert.equal(await page.locator('.korean-exam-feedback').count(),0);

  await page.goto(base+'?'+params('listening-set'),{waitUntil:'load'});
  assert.equal(await page.locator('#koreanListeningControls').isVisible(),true);
  const voiceOptions=await page.evaluate(()=>{
    if(!window.speechSynthesis)return [];
    Object.defineProperty(window.speechSynthesis,'getVoices',{configurable:true,value:()=>[{lang:'ko-KR',name:'기본 한국어',voiceURI:'local'},{lang:'ko-KR',name:'Google 한국어',voiceURI:'google'}]});
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'));
    return [...document.querySelector('#koreanSpeechVoice').options].map(v=>v.textContent);
  });
  if(voiceOptions.length>1)assert.match(voiceOptions[1],/Google/);
  assert.equal(await page.locator('#koreanAssessmentStudent').isVisible(),true);
  const listeningPassage=await page.evaluate(()=>window.WorksheetEditor.getCurrent().items[0].readingPassage);
  assert.ok(listeningPassage.length>120);
  assert.equal((await page.locator('#questions').innerText()).includes(listeningPassage),false);
  await page.locator('#koreanExamStart').click();
  assert.equal(await page.locator('.korean-exam-question').count(),5);
  assert.equal((await page.locator('#koreanExamQuestions').innerText()).includes(listeningPassage),false);
  assert.equal(await page.locator('.korean-listening-transcript').first().isVisible(),false);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#koreanAssessmentStudent').isVisible(),false);
  assert.equal(await page.locator('#koreanListeningControls').isVisible(),false);
  assert.deepEqual(errors,[]);
 } finally {await browser.close()}
});
