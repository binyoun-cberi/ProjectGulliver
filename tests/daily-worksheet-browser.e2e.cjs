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
    await page.waitForFunction(() => document.querySelector('#questions')?.children.length > 0);
    await page.selectOption('#grade', '3');
    await page.selectOption('#unit', 'g3-add');
    await page.selectOption('#topic', 'hundreds');
    await page.selectOption('#type', 'add-carry-two');
    await page.selectOption('#count', '20');
    await page.locator('button.daily-primary').click();
    assert.equal(await page.locator('#questions > li').count(), 20);
    assert.equal(await page.locator('#questions.calculation-grid > li').count(), 20);
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
    await page.locator('input[name="subject"][value="korean"]').check();
    await page.selectOption('#grade', '4');
    await page.selectOption('#unit', 'k4-reading');
    assert.equal(await page.locator('#topic').inputValue(), 'reading-set');
    assert.equal(await page.locator('#topicSetting').isVisible(), false, 'hide repeated learning-content selector when the unit has only one topic');
    await page.selectOption('#type', 'reading-set-literary');
    await page.selectOption('#count', '20');
    await page.locator('button.daily-primary').click();
    assert.equal(await page.locator('#questions > li').count(), 20);
    assert.equal(await page.locator('#questions .reading-text').count(), 4);
    assert.equal(pageErrors.length, 0, 'browser runtime errors: ' + pageErrors.join(' / '));
  } finally {
    await browser.close();
  }
});
