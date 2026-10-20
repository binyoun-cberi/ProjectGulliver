'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), {spawn} = require('node:child_process');
const {chromium} = require('playwright-core');
const base = 'http://127.0.0.1:8963/';
const names = ['홈','만들기','내 보관함','우리 반'];
const catalog = {window:{}};
vm.runInNewContext(fs.readFileSync('tools-catalog.js','utf8'), catalog);
const principals = ['index.html','뚝딱 제작실.html','내 보관함.html','lesson.html','우리반.html'];
async function ready() {
  for (let i=0; i<60; i++) {
    try {if ((await fetch(base+'gulliver-app-shell.js')).ok) return;} catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('Interface preview did not start');
}
test('one consistent site frame, teacher controls, saved roster and safe editor navigation', {timeout:180000}, async()=>{
  const server = spawn('python3',['-m','http.server','8963','--bind','127.0.0.1'],{stdio:'ignore'});
  let browser;
  try {
    await ready();
    browser = await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    const context = await browser.newContext({viewport:{width:1536,height:960}});
    await context.route('**/*', route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror',e=>errors.push(e.message));
    const files = [...principals,...catalog.window.ClassroomTools.slice(8).map(tool=>tool.href),'영상 뚝딱.html','음악 뚝딱.html'];
    fs.mkdirSync('test-artifacts',{recursive:true});
    for (const width of [1536,390]) {
      await page.setViewportSize({width,height:width===390?844:960});
      for (const [i,file] of files.entries()) {
        await page.goto(base+encodeURIComponent(file),{waitUntil:'domcontentloaded'});
        const header = page.locator('.gx-header');if(file==='lesson.html'){await page.locator('header.bar').waitFor();assert.equal(await header.isVisible(),false);continue}await header.waitFor();
        assert.equal(await page.locator('.gulliver-shell').count(),1,file+' duplicated site frame');
        assert.deepEqual(await page.locator('.gx-nav a').allTextContents(),names,file+' routes');
        const bounds = await header.evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),scroll:el.scrollWidth,width:innerWidth}));
        assert.ok(bounds.rect.left>=0 && bounds.rect.right<=width+1 && bounds.scroll<=width+1,file+' header overflow at '+width);
        assert.ok(await page.locator('body').evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)>=document.querySelector('.gx-header').getBoundingClientRect().height-1),file+' content covered by header');
        for (const link of await page.locator('.gx-nav a').all()) assert.equal(await link.isVisible(),true,file+' hidden destination');
        if (principals.includes(file)) {
          assert.equal(await page.locator('.gx-nav [aria-current="page"]').textContent(),['홈','만들기','내 보관함','만들기','우리 반'][principals.indexOf(file)]);
        }
        assert.ok(await page.locator('.gt-open-display:visible, [data-gx-display-duplicate]:visible, .gt-v62-student:visible').count()<=1,file+' duplicate student-window launch');
        if (i<5 || file==='자리 배정 프로그램.html' || file==='행운의 모둠 메이커.html') {
          await page.screenshot({path:'test-artifacts/unified-interface-'+width+'-'+i+'.png'});
        }
      }
    }
    // Roster -> tool -> result remains the same saved data, despite new navigation and controls.
    await page.setViewportSize({width:1536,height:960});
    await page.goto(base+encodeURIComponent('우리반.html'),{waitUntil:'domcontentloaded'});
    await page.locator('#className').fill('통일성 검수반');
    await page.locator('#names').fill('가람\n나래\n다온\n라온');
    await page.locator('#saveBtn').click();
    await page.mouse.move(1,1);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#saveBtn')).backgroundColor==='rgb(105, 73, 211)');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#className').inputValue(),'통일성 검수반');
    assert.equal(await page.locator('#count').textContent(),'4');
    await page.goto(base+encodeURIComponent('자리 배정 프로그램.html'),{waitUntil:'domcontentloaded'});
    assert.equal(await page.evaluate(()=>Gulliver.getNames().join(',')),'가람,나래,다온,라온');
    await page.locator('body').evaluate(el=>el.classList.add('presentation'));
    assert.equal(await page.locator('.gx-header').isVisible(),false,'teacher frame exposed on presentation');
    await page.locator('body').evaluate(el=>el.classList.remove('presentation'));
    assert.equal(await page.locator('.gx-header').isVisible(),true);
    // The new header cannot bypass the studio's save-before-leaving guard.
    await page.goto(base+encodeURIComponent('뚝딱 제작실.html')+'?new=canvas&template=presentation',{waitUntil:'domcontentloaded'});
    const editor = page.frameLocator('#editorFrame');
    await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
    await editor.locator('#designTitle').fill('공통 메뉴 이동 검수');
    await editor.locator('#designTitle').press('Tab');
    assert.equal(await editor.locator('.gx-header').count(),0,'editor embedded another website frame');
    await page.locator('.gx-nav a[href="우리반.html"]').click();
    await page.waitForURL('**/'+encodeURIComponent('우리반.html'));
    await page.locator('.gx-nav a[href="내 보관함.html"]').click();
    await page.locator('#unifiedLibraryList .unified-item').filter({hasText:'공통 메뉴 이동 검수'}).waitFor();
    assert.deepEqual(errors,[],'application script errors');
    console.log('Verified '+files.length+' screens at desktop and phone widths, roster persistence, presentation privacy and saved editor navigation.');
  } finally {await browser?.close();server.kill('SIGTERM');}
});
