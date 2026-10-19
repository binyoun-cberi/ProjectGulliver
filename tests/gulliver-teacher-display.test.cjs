'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
let chromium;
try { ({chromium} = require('playwright-core')); } catch {}

const files = ['지도안식 원형 타이머.html', '이번 수업 알리미.html', '자리 배정 프로그램.html', '마니또 배정 도우미.html', '플래시퀴즈메이커.html'];
const base = 'http://127.0.0.1:8957/';
const browserInstalled = Boolean(chromium && (fs.existsSync(chromium.executablePath()) || ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].some(fs.existsSync)));

test('dual-monitor adapters are opt-in and the student window has no legacy storage or private result controls', () => {
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /gulliver-teacher-display\.js\?v=/, `${file}: controller script missing`);
  }
  const student = fs.readFileSync('gulliver-teacher-display-view.js', 'utf8');
  assert.doesNotMatch(student, /\b(localStorage|sessionStorage|finalMatches|GulliverTeacherLiveSnapshot)\b/);
  assert.doesNotMatch(fs.readFileSync('gulliver-teacher-display.html', 'utf8'), /gulliver-shared\.js|gulliver-teacher-shell\.js|cdn\./);
  const manitto = fs.readFileSync('마니또 배정 도우미.html', 'utf8');
  assert.match(manitto, /\.hidden\s*\{\s*display:\s*none\s*!important/);
});

test('6.1 pages keep their existing storage formats and use explicit preparation/presentation modes', () => {
  for (const file of [files[0], files[1], files[4]]) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /gulliver-teacher-v61\.css/, `${file}: 6.1 shared UI missing`);
    assert.match(html, /준비하기/, `${file}: preparation step missing`);
    for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
      if (match[1].trim()) new vm.Script(match[1], {filename: file});
    }
  }
  assert.match(fs.readFileSync(files[4], 'utf8'), /body\.v61-running \.topbar\{display:none!important\}/);
  assert.match(fs.readFileSync(files[0], 'utf8'), /lesson-circle-timer\.js\?v=20261019-v61/);
  assert.match(fs.readFileSync('lesson-circle-timer.js', 'utf8'), /const STORAGE_KEY = 'lessonCircleTimerV3'/);
  assert.match(fs.readFileSync(files[4], 'utf8'), /flashQuizMakerPlusV3/);
  assert.match(fs.readFileSync(files[1], 'utf8'), /lessonStorageKey/);
  assert.match(fs.readFileSync('gulliver-teacher-display.html', 'utf8'), /display-view\.js\?v=20261019-v6[12]/);
});

test('teacher controller only broadcasts an explicit public snapshot and accepts student action requests', () => {
  const channels = new Map();
  class MockChannel {
    constructor(name) {this.name = name; this.messages = []; channels.set(name, this);}
    postMessage(message) {this.messages.push(message);}
    close() {}
  }
  const events = new Map();
  let popupUrl = '';
  let studentRequest = null;
  const context = {
    window: {
      addEventListener(name, listener) {events.set(name, listener);},
      dispatchEvent() {},
      crypto: {getRandomValues(bytes) {bytes.fill(37);}},
      open(url) {popupUrl = url; return {closed: false, focus() {}};},
      alert() {},
    },
    BroadcastChannel: MockChannel, URL,
    location: {href: 'https://example.com/마니또 배정 도우미.html'},
    crypto: {getRandomValues(bytes) {bytes.fill(37);}},
    Event: class Event {constructor(type) {this.type = type;}},
    setInterval() {return 1;}, clearInterval() {}, Date, console,
  };
  vm.runInNewContext(fs.readFileSync('gulliver-teacher-display.js', 'utf8'), context);
  const display = context.window.GulliverTeacherDisplay;
  assert.equal(display.supported(), false);
  display.register({kind: 'manitto', getSnapshot: () => ({kind: 'manitto', started: true, students: [{name: '가', checked: false}]}), onAction: request => {studentRequest = request;}});
  assert.equal(display.open(), true);
  assert.match(popupUrl, /gulliver-teacher-display\.html\?kind=manitto&session=[a-f0-9]{32}/);
  const channel = [...channels.values()][0];
  const initial = channel.messages.find(message => message.type === 'state');
  assert.equal(initial.payload.students[0].name, '가');
  assert.ok(!('finalMatches' in initial.payload));
  channel.onmessage({data: {version: 1, token: initial.token, kind: 'manitto', type: 'action', payload: {action: 'request', name: '가'}}});
  assert.equal(studentRequest.name, '가');
  assert.equal(display.connected(), true);
});

async function ready() {
  for (let i = 0; i < 80; i++) {
    try {if ((await fetch(base + 'gulliver-teacher-display.js')).ok) return;} catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('local dual-screen test server is not ready');
}

test('second screen mirrors the timer, lesson board and seating without settings or secret assignments', {
  timeout: 180000,
  skip: !browserInstalled && 'Chrome/Chromium and its driver are not installed in this environment'
}, async () => {
  const server = spawn('python3', ['-m', 'http.server', '8957', '--bind', '127.0.0.1'], {stdio: 'ignore'});
  let browser;
  try {
    await ready();
    const options = fs.existsSync(chromium.executablePath()) ? {} : {channel: 'chrome'};
    browser = await chromium.launch({...options, headless: true, args: ['--no-sandbox']});
    const context = await browser.newContext({viewport: {width: 1366, height: 900}});
    // Simulate a weak school connection; private-state hiding must not depend on Tailwind CDN.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    for (const [file, selector, value, expected] of [
      [files[0], '#mainTitle', '두 화면 수학 수업', '두 화면 수학 수업'],
      [files[1], '#input-topic', '두 화면 학습 안내', '두 화면 학습 안내']
    ]) {
      await page.goto(base + encodeURIComponent(file));
      await page.locator('.gt-open-display').waitFor({state: 'visible'});
      const popupEvent = page.waitForEvent('popup');
      await page.locator('.gt-open-display').click();
      const popup = await popupEvent;
      await popup.locator('#displayConnection[data-state="connected"]').waitFor();
      await page.locator(selector).fill(value);
      await popup.locator('#displayStage').getByText(expected).waitFor();
      assert.equal(await popup.locator('.gt-shell, .settings, #control-panel').count(), 0);
      await popup.close();
    }
    await page.goto(base + encodeURIComponent(files[2]));
    await page.locator('.gt-open-display').waitFor({state: 'visible'});
    const seatPopupEvent = page.waitForEvent('popup');
    await page.locator('.gt-open-display').click();
    const seatPopup = await seatPopupEvent;
    await seatPopup.getByText('자리표를 준비하고 있어요').waitFor();
    for (const name of ['검수학생A', '검수학생B']) {
      await page.locator('#studentName').fill(name);
      await page.locator('#addStudentBtn').click();
    }
    await page.locator('#generateBtn').click();
    await seatPopup.getByText('검수학생A').waitFor();
    const publicText = await seatPopup.locator('body').innerText();
    assert.doesNotMatch(publicText, /앞자리 우선|떨어뜨려 놓기|성별 지정석|분리 규칙/);
    await seatPopup.close();
    await page.goto(base + encodeURIComponent(files[3]));
    await page.locator('.gt-open-display').waitFor({state: 'visible'});
    const manittoPopupEvent = page.waitForEvent('popup');
    await page.locator('.gt-open-display').click();
    const manittoPopup = await manittoPopupEvent;
    await page.locator('#names-input').fill('검수가, 검수나, 검수다');
    await page.getByRole('button', {name: '배정 완료 및 뽑기 시작!'}).click();
    await manittoPopup.getByRole('button', {name: '검수가'}).waitFor();
    assert.equal(await manittoPopup.getByText('전체 결과 모아보기').count(), 0);
    assert.equal(await manittoPopup.locator('#teacher-result-modal, #secret-panel').count(), 0);
    await manittoPopup.getByRole('button', {name: '검수가'}).click();
    await page.locator('#modal').waitFor({state: 'visible'});
    await manittoPopup.getByText('선생님이 비밀 결과를 확인 중이에요.', {exact: false}).waitFor();
    await manittoPopup.close();

    // Timer: editing panel disappears during the lesson, but pause/back remain on the teacher screen.
    await page.goto(base + encodeURIComponent(files[0]));
    assert.equal(await page.locator('#settingsPanel').isVisible(), true);
    await page.locator('#v61TimerStart').click();
    assert.equal(await page.locator('#app').evaluate(node => node.classList.contains('v61-executing')), true);
    assert.equal(await page.locator('#settingsPanel').isVisible(), false);
    assert.equal(await page.locator('#btnStartPause').isVisible(), true);
    const timerPopupEvent = page.waitForEvent('popup');
    await page.locator('#v61TimerStudent').click();
    const timerPopup = await timerPopupEvent;
    await timerPopup.locator('#displayConnection[data-state="connected"]').waitFor();
    assert.equal(await timerPopup.locator('#settingsPanel, .gt-shell, #eventList').count(), 0);
    await timerPopup.close();
    await page.locator('#v61TimerPrepare').click();
    assert.equal(await page.locator('#settingsPanel').isVisible(), true);

    // Lesson board: the editor and common header must both disappear when projecting from one window.
    await page.goto(base + encodeURIComponent(files[1]));
    await page.locator('#v61LessonPresent').click();
    assert.equal(await page.locator('body').evaluate(node => node.classList.contains('student-view')), true);
    assert.equal(await page.locator('#control-panel').isVisible(), false);
    assert.equal(await page.locator('.gt-shell').isVisible(), false);
    await page.locator('#v61LessonExit').click();
    assert.equal(await page.locator('#control-panel').isVisible(), true);

    // Flashcards: teacher management tabs never occupy the running view or the second screen.
    await page.goto(base + encodeURIComponent(files[4]));
    assert.equal(await page.locator('#v61Prepare').isVisible(), true);
    await page.locator('[data-v61-start="flash"]').click();
    assert.equal(await page.locator('.topbar').isVisible(), false);
    assert.equal(await page.locator('#v61Runbar').isVisible(), true);
    const front = await page.locator('#frontText').innerText();
    const back = await page.locator('#backText').innerText();
    const flashPopupEvent = page.waitForEvent('popup');
    await page.locator('#v61OpenStudent').click();
    const flashPopup = await flashPopupEvent;
    await flashPopup.locator('#displayConnection[data-state="connected"]').waitFor();
    await flashPopup.getByText(front, {exact: true}).waitFor();
    assert.equal(await flashPopup.getByText(back, {exact: true}).count(), 0, 'card back must stay hidden before flip');
    assert.equal(await flashPopup.locator('.gt-shell, .topbar, #cardBody, .gt-v61-runbar').count(), 0);
    await page.locator('#flashCard').click();
    await flashPopup.getByText(back, {exact: true}).waitFor();
    await page.locator('#v61ToPrep').click();
    assert.equal(await page.locator('.topbar').isVisible(), true);
    await page.locator('[data-v61-start="quiz"]').click();
    const question = await page.locator('#quizQuestion').innerText();
    await flashPopup.getByText(question, {exact: true}).waitFor();
    assert.equal(await flashPopup.locator('.flashquiz-choice.correct').count(), 0, 'answer must not be highlighted before teacher answers');
    await page.locator('#choiceList .choice').first().click();
    await flashPopup.locator('.flashquiz-choice.correct').first().waitFor();
    await flashPopup.close();

    await page.setViewportSize({width: 390, height: 844});
    await page.locator('#v61ToPrep').click();
    assert.equal(await page.locator('[data-v61-start="flash"]').isVisible(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'mobile preparation must not overflow horizontally');
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});
