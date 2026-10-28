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
  assert.equal(teacherTools.length, 23);
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
      assert.equal(await shell.getByRole('navigation', {name: '클라시트 주요 메뉴'}).locator(':scope > a, :scope > details > summary').count(), 4, tool.href);
      assert.ok(await page.locator('body').evaluate(node => node.classList.contains('gt-teacher-tool')));
      assert.equal(await shell.locator('.gx-release-label').textContent(),'v1.2.0');
      const status = await shell.locator('.gt-help-panel p').textContent();
      assert.match(status, /저장 방식이 달라요/, tool.href);
      assert.doesNotMatch(await shell.textContent(), /자동 저장됨|비밀번호|역할 배정 결과/);
    }
    // Real browser smoke: demo import -> generate -> result preview -> download.
    await page.goto(base + encodeURIComponent('반 편성 도우미.html'), {waitUntil: 'domcontentloaded'});
    await page.locator('#demo').click();
    assert.equal(await page.locator('#statStudents').textContent(),'36명');
    const headings=await page.locator('#rosterHead th').allTextContents();
    assert.deepEqual(headings,['기존 반','번호','이름','성별','학습지표 (0.00~)','유의 사항']);
    const first=page.locator('#rosterBody tr').first();
    await first.locator('[data-key="level"]').fill('0.00');
    await first.locator('[data-key="level"]').press('Tab');
    await first.locator('.notice-picker summary').click();
    await first.locator('input[data-trait="다문화"]').check();
    await first.locator('input[data-trait="사회성"]').check();
    assert.equal(await first.locator('input[data-trait="다문화"]').isChecked(),true);
    assert.equal(await first.locator('input[data-trait="사회성"]').isChecked(),true);
    await first.locator('.notice-picker summary').click();
    await page.locator('#newTrait').fill('돌봄 필요');
    await page.locator('#addTrait').click();
    const nextFirst=page.locator('#rosterBody tr').first();
    await nextFirst.locator('.notice-picker summary').click();
    await nextFirst.locator('input[data-trait="돌봄 필요"]').check();
    await nextFirst.locator('.notice-picker summary').click();
    assert.equal(await nextFirst.locator('[data-key="level"]').inputValue(),'0.00');
    // Teacher-defined note ceiling is stored and applied to snake allocation.
    await page.locator('[data-tab="rules"]').click();
    await page.locator('input[data-cap="운동부"]').fill('2');
    await page.locator('input[data-cap="운동부"]').press('Tab');
    assert.equal(await page.locator('input[data-cap="운동부"]').inputValue(),'2');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="rules"]').click();
    assert.equal(await page.locator('input[data-cap="운동부"]').inputValue(),'2','반당 인원 상한은 새로고침 후에도 보존해야 합니다.');

    // Visual separation baskets: build two independent groups with draggable students.
    const basketIds=await page.evaluate(()=>state.students.slice(0,5).map(st=>st.id));
    await page.locator('#addBasket').click();
    assert.equal(await page.locator('#basketCount').textContent(),'1개');
    await page.locator('[data-basket-drop]').first().locator('[data-basket-add]').selectOption(basketIds[0]);
    await page.locator('[data-basket-drop]').first().locator('[data-basket-add]').selectOption(basketIds[1]);
    await page.locator('#basketPool [data-drag-student="'+basketIds[2]+'"]').dragTo(page.locator('[data-basket-drop]').first());
    assert.equal(await page.locator('[data-basket-drop]').first().locator('.basket-chip').count(),3);
    await page.locator('#addBasket').click();
    assert.equal(await page.locator('#basketCount').textContent(),'2개');
    await page.locator('[data-basket-drop]').nth(1).locator('[data-basket-add]').selectOption(basketIds[3]);
    await page.locator('[data-basket-drop]').nth(1).locator('[data-basket-add]').selectOption(basketIds[4]);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="rules"]').click();
    assert.equal(await page.locator('[data-basket-drop]').count(),2);
    assert.equal(await page.locator('[data-basket-drop]').first().locator('.basket-chip').count(),3);
    assert.equal(await page.locator('[data-basket-drop]').nth(1).locator('.basket-chip').count(),2);
    // Schools without prior teacher choice start OFF; switching ON preserves future fixed picks.
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('.priority-switch').click();
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),true);

    // Teacher-first workflow: reserve willing teachers' pupils, then fill vacancies.
    await page.locator('[data-tab="preset"]').click();
    assert.equal(await page.locator('#presetRemaining').textContent(),'36명');
    const firstId=await page.locator('#presetUnassigned [data-preset]').first().getAttribute('data-preset');
    await page.locator('#presetUnassigned [data-preset]').first().selectOption('1');
    assert.equal(await page.locator('#presetCount').textContent(),'1명 확정');
    await page.locator('input[data-teacher-class="1"]').fill('담당교사 A');
    await page.locator('input[data-teacher-class="1"]').press('Tab');
    const secondId=await page.locator('#presetUnassigned [data-preset]').first().getAttribute('data-preset');
    await page.locator('select[data-place-class="2"]').selectOption(secondId);
    assert.equal(await page.locator('#presetCount').textContent(),'2명 확정');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="preset"]').click();
    assert.equal(await page.locator('input[data-teacher-class="1"]').inputValue(),'담당교사 A');
    assert.equal(await page.locator('#presetCount').textContent(),'2명 확정');
    await page.locator('#fillRemaining').click();
    assert.equal(await page.locator('#view-results').isVisible(),true);
    assert.equal(await page.locator('#resultGrid select[data-move]:disabled').count(),2,'교사 지정 학생은 결과에서 이동 불가');
    assert.match(await page.locator('#resultGrid').textContent(),/담당 담당교사 A/);
    const firstClass=await page.locator('select[data-move="'+firstId+'"]').inputValue();
    const secondClass=await page.locator('select[data-move="'+secondId+'"]').inputValue();
    assert.equal(firstClass,'1');
    assert.equal(secondClass,'2');
    await page.locator('[data-tab="roster"]').click();
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('select[data-move="'+firstId+'"]').inputValue(),'1');
    assert.equal(await page.locator('select[data-move="'+secondId+'"]').inputValue(),'2');

    assert.equal(await page.locator('#view-results').isVisible(),true,'편성 결과 화면으로 이동해야 합니다.');
    assert.ok(await page.locator('#alternatives .alt').count()>=1);
    assert.match(await page.locator('#validation').textContent(),/조건 위반 없음/);
    assert.match(await page.locator('#report').textContent(),/운동부 \(반당 최대 2명\)/);
    const [classCsv] = await Promise.all([page.waitForEvent('download'),page.locator('#exportCsv').click()]);
    assert.ok(classCsv.suggestedFilename().startsWith('반편성_결과_') && classCsv.suggestedFilename().endsWith('.csv'));
    const savedCsv=fs.readFileSync(await classCsv.path(),'utf8');
    assert.match(savedCsv,/담당교사 A/);
    assert.match(savedCsv,/교사 지정/);

    // All basket members must be placed into different classes, even with teacher-first OFF.
    const preserved=await page.evaluate(()=>state.students.filter(st=>st.fixed).map(st=>[st.id,st.fixed]));
    await page.locator('.priority-switch').click();
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('#resultGrid select[data-move]:disabled').count(),0);
    const offState=await page.evaluate(()=>{
      const assigned=state.candidates[state.activeCandidate].assign;
      return {pins:state.students.filter(st=>st.fixed).map(st=>[st.id,st.fixed]),
        baskets:state.baskets.map(b=>b.members.map(id=>assigned[id]))};
    });
    assert.deepEqual(offState.pins,preserved,'OFF여도 저장된 교사 지정 기록은 남아야 함');
    for(const classes of offState.baskets)assert.equal(new Set(classes).size,classes.length,'같은 바구니 학생은 서로 다른 반');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('.priority-switch').click();
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('#resultGrid select[data-move]:disabled').count(),2);




    // Drag-to-class review: totals, sex, multicultural and learning score update immediately.
    const reviewChoice=await page.evaluate(()=>{
      const plan=state.candidates[state.activeCandidate];
      for(const preferTags of [true,false])for(const st of state.students){
        if(st.fixed||(preferTags&&!st.traits.includes('다문화')))continue;
        const from=plan.assign[st.id];
        for(let to=1;to<=state.classCount;to++){
          const result=previewResultMove(st.id,to);
          if(result?.ok)return {id:st.id,from,to,hasMulticultural:st.traits.includes('다문화')};
        }
      }
      return null;
    });
    assert.ok(reviewChoice,'at least one legal drag movement must exist');
    const originalReport=await page.evaluate(()=>state.candidates[state.activeCandidate].assign);
    const startMetrics=await page.evaluate(()=>reportData(state.candidates[state.activeCandidate]));
    assert.match(await page.locator('#report').textContent(),/다문화/);
    assert.match(await page.locator('#report').textContent(),/특수/);
    await page.locator('[data-result-student="'+reviewChoice.id+'"]').dragTo(page.locator('[data-drop-class="'+reviewChoice.to+'"]'));
    assert.equal(await page.locator('select[data-move="'+reviewChoice.id+'"]').inputValue(),String(reviewChoice.to));
    assert.match(await page.locator('#moveHistoryResult').textContent(),/최근 이동/);
    assert.match(await page.locator('#moveHistoryResult').textContent(),/학습지표 평균/);
    assert.match(await page.locator('#moveHistoryResult').textContent(),/다문화/);
    const changedMetrics=await page.evaluate(()=>reportData(state.candidates[state.activeCandidate]));
    assert.equal(changedMetrics[reviewChoice.from-1].total,startMetrics[reviewChoice.from-1].total-1);
    assert.equal(changedMetrics[reviewChoice.to-1].total,startMetrics[reviewChoice.to-1].total+1);
    assert.equal(await page.locator('#undoMove').isEnabled(),true);
    await page.locator('#undoMove').click();
    assert.equal(await page.locator('select[data-move="'+reviewChoice.id+'"]').inputValue(),String(reviewChoice.from));
    assert.match(await page.locator('#moveHistoryResult').textContent(),/되돌림 완료/);
    // Tablet workflow without native HTML drag support: select a pupil and tap destination.
    await page.setViewportSize({width:420,height:840});
    await page.locator('[data-result-student="'+reviewChoice.id+'"] [data-select-move]').click();
    assert.match(await page.locator('#moveSelection').textContent(),/이동할 학생/);
    await page.locator('[data-drop-button="'+reviewChoice.to+'"]').click();
    assert.equal(await page.locator('select[data-move="'+reviewChoice.id+'"]').inputValue(),String(reviewChoice.to));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="results"]').click();
    assert.equal(await page.locator('select[data-move="'+reviewChoice.id+'"]').inputValue(),String(reviewChoice.to),'drag changes persist after reload');
    await page.setViewportSize({width:1280,height:900});

    // Real Excel-like grid: paste a header, quoted multiline attention notes, and a summary column.
    await page.locator('[data-tab="roster"]').click();
    await page.locator('#toggleBulk').click();
    const workbook='학년\t반\t번호\t이름\t성별\t유의사항\t\n6\t1\t1\t\t\t\t남:10+여:14=24명\n6\t1\t2\t김하늘\t여\t"다문화\n한부모"\t\n6\t2\t1\t이도윤\t남\t다문화(모)\t\n\t\t\t\t\t\t총: 96명';
    await page.locator('[data-bulk-r="0"][data-bulk-c="0"]').evaluate((element,raw)=>{
      const data=new DataTransfer();data.setData('text/plain',raw);
      element.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    },workbook);
    assert.match(await page.locator('#bulkPreview').textContent(),/입력된 학생 행 3개/);
    assert.match(await page.locator('#bulkPreview').textContent(),/이름 미입력 1행/);
    assert.equal(await page.locator('[data-bulk-r="1"][data-bulk-c="5"]').inputValue(),'다문화\n한부모');
    await page.locator('[data-bulk-r="0"][data-bulk-c="3"]').fill('박서연');
    assert.match(await page.locator('#bulkPreview').textContent(),/이름 입력 완료 3명/);
    await page.locator('input[name="bulkMode"][value="replace"]').check();
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#commitBulk').click();
    assert.equal(await page.locator('#statStudents').textContent(),'3명');
    const importState=await page.evaluate(()=>state.students.map(st=>({grade:st.oldGrade,oldClass:st.oldClass,name:st.name,traits:st.traits})));
    assert.deepEqual(importState.map(st=>st.name),['박서연','김하늘','이도윤']);
    assert.equal(importState[1].grade,'6');
    assert.equal(importState[2].oldClass,'2반');
    assert.ok(importState[1].traits.includes('다문화')&&importState[1].traits.includes('한부모'));
    assert.ok(importState[2].traits.includes('다문화(모)'));
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#statStudents').textContent(),'3명');
    await page.locator('#toggleBulk').click();
    await page.locator('#bulkRawPanel summary').click();
    await page.locator('#bulkText').fill('| 학년 | 반 | 번호 | 이름 | 성별 | 유의사항 |\n| --- | --- | --- | --- | --- | --- |\n| 6 | 4 | 1 | 최가람 | 여 | 한부모<br> 다문화 |');
    await page.locator('#bulkParseText').click();
    assert.equal(await page.locator('[data-bulk-r="0"][data-bulk-c="3"]').inputValue(),'최가람');
    assert.equal(await page.locator('[data-bulk-r="0"][data-bulk-c="5"]').inputValue(),'한부모\n 다문화');

    // Regression: a teacher fills grade 5 for every row, then pastes an Excel names-only column.
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#bulkClearGrid').click();
    await page.locator('#bulkAdd50Rows').click();
    assert.equal(await page.locator('#bulkRowCount').textContent(),'62행');
    await page.locator('#bulkFillGrade').fill('5학년');
    await page.locator('#bulkFillGradeAll').click();
    assert.equal(await page.locator('[data-bulk-r="0"][data-bulk-c="0"]').inputValue(),'5');
    assert.equal(await page.locator('[data-bulk-r="61"][data-bulk-c="0"]').inputValue(),'5');
    const columnNames=['김하늘','이도윤','박서연','최유리'].join('\r\n');
    await page.locator('[data-bulk-r="0"][data-bulk-c="3"]').evaluate((el,raw)=>{
      const clipboard=new DataTransfer();clipboard.setData('text/plain',raw);
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:clipboard,bubbles:true,cancelable:true}));
    },columnNames);
    assert.equal(await page.locator('[data-bulk-r="0"][data-bulk-c="3"]').inputValue(),'김하늘');
    assert.equal(await page.locator('[data-bulk-r="3"][data-bulk-c="3"]').inputValue(),'최유리');
    assert.equal(await page.locator('[data-bulk-r="3"][data-bulk-c="0"]').inputValue(),'5');
    // Shift-click range selection followed by fill-down and undo.
    await page.locator('[data-bulk-r="0"][data-bulk-c="1"]').fill('2');
    await page.locator('[data-bulk-r="0"][data-bulk-c="1"]').click();
    await page.locator('[data-bulk-r="3"][data-bulk-c="1"]').click({modifiers:['Shift']});
    await page.locator('#bulkFillDown').click();
    assert.equal(await page.locator('[data-bulk-r="3"][data-bulk-c="1"]').inputValue(),'2');
    await page.locator('#bulkUndo').click();
    assert.equal(await page.locator('[data-bulk-r="3"][data-bulk-c="1"]').inputValue(),'');
    // One pasted value fills a selected multi-cell range, as in Excel.
    await page.locator('[data-bulk-r="0"][data-bulk-c="4"]').click();
    await page.locator('[data-bulk-r="3"][data-bulk-c="4"]').click({modifiers:['Shift']});
    await page.locator('[data-bulk-r="3"][data-bulk-c="4"]').evaluate(el=>{
      const data=new DataTransfer();data.setData('text/plain','여');
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    });
    assert.equal(await page.locator('[data-bulk-r="0"][data-bulk-c="4"]').inputValue(),'여');
    assert.equal(await page.locator('[data-bulk-r="3"][data-bulk-c="4"]').inputValue(),'여');


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
    assert.equal(await page.locator('.gx-nav > a, .gx-nav > details > summary').count(), 4);
    const overflow = await page.locator('.gx-header-inner').evaluate(node => node.scrollWidth > window.innerWidth + 2);
    assert.equal(overflow, false, 'phone teacher header extends beyond viewport');
    await page.locator('.gx-release-label').click();assert.equal(await page.locator('.gx-release-panel').isVisible(),true);
    assert.match(await page.locator('.gx-release-panel').textContent(),/2026.10.24/);
    assert.ok(await page.evaluate(()=>{const r=document.querySelector('.gx-release-panel').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth}));
    await page.screenshot({path:'test-artifacts/time-tools-version-mobile.png',fullPage:false});
    await page.keyboard.press('Escape');assert.equal(await page.locator('.gx-release-panel').isVisible(),false);
    await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.ok(await page.evaluate(()=>{const boxes=['.gx-brand','.gx-header-actions','.gx-release'].map(s=>document.querySelector(s).getBoundingClientRect());for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)return false}return true}),'narrow header controls overlap');
    await page.screenshot({path:'test-artifacts/time-tools-version-narrow.png',fullPage:false});

    await page.setViewportSize({width:1440,height:900});await page.locator('.gx-release-label').click();
    assert.ok(await page.evaluate(()=>{const b=document.querySelector('.gx-release').getBoundingClientRect(),n=document.querySelector('.gx-nav').getBoundingClientRect();return b.x>=n.right&&b.right<=innerWidth}));
    await page.screenshot({path:'test-artifacts/time-tools-version-desktop.png',fullPage:false});
    await page.locator('.gx-worksheet-picker summary').click();assert.equal(await page.locator('.gx-release-panel').isVisible(),false);
    await page.keyboard.press('Escape');
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.gx-release-label').isVisible(),false);

  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});


