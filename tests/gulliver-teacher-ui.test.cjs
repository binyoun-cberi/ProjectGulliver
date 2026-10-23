'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
let chromium;
try { ({chromium} = require('playwright-core')); } catch { /* browser smoke runs after its driver is installed */ }

const catalog = {window: {}};
vm.runInNewContext(fs.readFileSync('tools-catalog.js', 'utf8'), catalog);
const teacherTools = catalog.window.ClassroomTools;
const base = 'http://127.0.0.1:8956/';
const bundledBrowser = Boolean(chromium && fs.existsSync(chromium.executablePath()));
const systemChrome = ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].some(file => fs.existsSync(file));

test('shared UI assets are connected to every cataloged teacher app exactly once', () => {
  assert.equal(teacherTools.length, 20);
  for (const tool of teacherTools) {
    const html = fs.readFileSync(tool.href, 'utf8');
    for (const asset of ['gulliver-teacher-ui.css', 'gulliver-teacher-components.js', 'gulliver-teacher-shell.js']) {
      assert.equal(html.split(asset).length - 1, 1, `${tool.href}: ${asset}`);
    }
  }
});

async function ready() {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base + 'gulliver-teacher-shell.js')).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('local teacher UI preview not ready');
}

test('6.0 standalone headers, student privacy, phone navigation and opt-in components', {
  timeout: 180000,
  skip: chromium && (bundledBrowser || systemChrome) ? false : 'Chrome/Chromium and its driver are not installed in this environment'
}, async () => {
  const server = spawn('python3', ['-m', 'http.server', '8956', '--bind', '127.0.0.1'], {stdio: 'ignore'});
  let browser;
  try {
    await ready();
    browser = await chromium.launch({...(!bundledBrowser ? {channel: 'chrome'} : {}), headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    // Exercise a disconnected-school scenario without waiting for third-party CDNs.
    await page.route('**/*', route => {
      const request = new URL(route.request().url());
      return request.origin === new URL(base).origin ? route.continue() : route.abort();
    });
    page.setDefaultTimeout(10000);
    for (const tool of teacherTools) {
      await page.goto(base + encodeURIComponent(tool.href), {waitUntil: 'domcontentloaded', timeout: 30000});
      const shell = page.locator('.gt-shell');
      await shell.waitFor({state: 'attached'});
      assert.equal(await page.locator('.gulliver-shell').count(), 1, tool.href);
      assert.equal(await shell.getByRole('navigation', {name: '클라시트 주요 메뉴'}).locator('a').count(), 4, tool.href);
      assert.ok(await page.locator('body').evaluate(node => node.classList.contains('gt-teacher-tool')));
      const status = await shell.locator('.gt-help-panel p').textContent();
      assert.match(status, /저장 방식이 달라요/, tool.href);
      assert.doesNotMatch(await shell.textContent(), /자동 저장됨|비밀번호|역할 배정 결과/);
    }
    await page.goto(base + encodeURIComponent('지도안식 원형 타이머.html'), {waitUntil: 'domcontentloaded'});
    await page.locator('.gt-shell').waitFor({state: 'attached'});
    await page.locator('body').evaluate(node => node.classList.add('student-view'));
    assert.equal(await page.locator('.gt-shell').isVisible(), false, 'student timer screen exposed teacher chrome');
    await page.locator('body').evaluate(node => node.classList.remove('student-view'));
    assert.equal(await page.locator('.gt-shell').isVisible(), true);
    assert.ok(await page.evaluate(() => window.GulliverTeacherComponents));
    const actionLabels = await page.evaluate(() => {
      const actions = GulliverTeacherComponents.createResultActions({onPrint() {}});
      return [...actions.querySelectorAll('button')].map(button => button.textContent);
    });
    assert.deepEqual(actionLabels, ['인쇄']);
    const save = await page.evaluate(() => {
      const status = GulliverTeacherComponents.createSaveStatus();
      const initial = status.textContent;
      GulliverTeacherComponents.setSaveStatus(status, 'saved');
      return {initial, saved: status.textContent};
    });
    assert.match(save.initial, /저장 여부는 도구에서 확인/);
    assert.equal(save.saved, '저장했어요');

    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.locator('.gx-nav').isVisible(), true);
    assert.equal(await page.locator('.gx-nav a').count(), 4);
    const overflow = await page.locator('.gx-header-inner').evaluate(node => node.scrollWidth > window.innerWidth + 2);
    assert.equal(overflow, false, 'phone teacher header extends beyond viewport');
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});
