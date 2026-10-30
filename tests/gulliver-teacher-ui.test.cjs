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
    // New stage zero sets current grade/class counts before any student names.
    assert.equal(await page.locator('#view-setup').isVisible(),true);
    assert.equal(await page.locator('[data-tab="setup"]').getAttribute('aria-selected'),'true');
    await page.locator('#sourceGrade').fill('5');
    await page.locator('#sourceGrade').press('Tab');
    await page.locator('#sourceClassCount').fill('4');
    await page.locator('#sourceClassCount').press('Tab');
    await page.locator('#grade').fill('6');
    await page.locator('#grade').press('Tab');
    await page.locator('#classCount').fill('4');
    await page.locator('#classCount').press('Tab');
    for(let room=1;room<=4;room++)for(const [gender,value] of [['boys','10'],['girls','14']]){
      const input=page.locator('[data-source-room="'+room+'"][data-source-gender="'+gender+'"]');
      await input.fill(value);await input.press('Tab');
    }
    assert.match(await page.locator('#sourceClassTotals').textContent(),/96명/);
    assert.match(await page.locator('#overviewDashboard').textContent(),/96명/);
    assert.match(await page.locator('#overviewDashboard').textContent(),/남 40명/);
    assert.match(await page.locator('#overviewDashboard').textContent(),/여 56명/);
    assert.equal(await page.locator('#overviewDashboard .compact-room-list span').count(),4);
    assert.match(await page.locator('#overviewDashboard').textContent(),/유의 사항별 현황/);
    await page.screenshot({path:'test-artifacts/time-tools-planner-overview-desktop.png',fullPage:false});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('#plannerHelpDialog').isVisible(),false);
    const overviewBounds=await page.locator('#overviewDashboard').evaluate(el=>{
      const box=el.getBoundingClientRect();
      return {left:box.left,right:box.right,viewport:innerWidth};
    });
    assert.ok(overviewBounds.left>=0&&overviewBounds.right<=overviewBounds.viewport+2,
      '인포그래픽이 모바일 가로 화면 밖으로 벗어나면 안 됩니다.');
    assert.equal(await page.locator('#overviewDashboard .overview-pane').count(),2);
    await page.screenshot({path:'test-artifacts/time-tools-planner-overview-mobile.png',fullPage:false});
    await page.setViewportSize({width:1280,height:900});
    await page.locator('#openHelp').click();
    assert.equal(await page.locator('#plannerHelpDialog').isVisible(),true);
    await page.locator('#plannerHelpDialog details').nth(1).locator('summary').click();
    assert.match(await page.locator('#plannerHelpDialog').textContent(),/엑셀/);
    await page.locator('#helpDone').click();
    assert.equal(await page.locator('#plannerHelpDialog').isVisible(),false);
    assert.equal(await page.locator('[data-tab="preset"]').isVisible(),false,'OFF should hide optional teacher tab');

    assert.match(await page.locator('#futureClassSummary').textContent(),/남 10명/);
    assert.match(await page.locator('#futureClassSummary').textContent(),/여 14명/);
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('#applySetup').click();
    assert.equal(await page.locator('#view-roster').isVisible(),true);
    assert.equal(await page.locator('#rosterBody tr[data-student]').count(),96);
    assert.match(await page.locator('#rosterBody tr').first().locator('.roster-identity').textContent(),/5학년.*1반.*1번/);
    assert.match(await page.locator('#rosterBody tr').last().locator('.roster-identity').textContent(),/5학년.*4반.*24번/);
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="gender"]').inputValue(),'');
    // Excel 3-column paste and score-column paste, including headers and zero-point score.
    const threeColumns='이름\t성별\t학습지표\n김가람\t여\t92.50\n이도현\t남\t0.00\n박하진\t여\t74.25'.replaceAll('\\t','\t').replaceAll('\\n','\n');
    await page.locator('#rosterBody tr:first-child [data-key="name"]').evaluate((el,value)=>{
      const data=new DataTransfer();data.setData('text/plain',value);
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    },threeColumns);
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="name"]').inputValue(),'김가람');
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="gender"]').inputValue(),'여');
    assert.equal(await page.locator('#rosterBody tr:nth-child(2) [data-key="gender"]').inputValue(),'남');
    assert.equal(await page.locator('#rosterBody tr:nth-child(2) [data-key="level"]').inputValue(),'0.00');
    await page.locator('#rosterBody tr:nth-child(3) [data-key="level"]').evaluate(el=>{
      const data=new DataTransfer();data.setData('text/plain','85.25\n75.75');
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    });
    assert.equal(await page.locator('#rosterBody tr:nth-child(3) [data-key="level"]').inputValue(),'85.25');
    assert.equal(await page.locator('#rosterBody tr:nth-child(4) [data-key="level"]').inputValue(),'75.75');
    await page.locator('#rosterBody tr:first-child [data-key="name"]').evaluate(el=>{
      const data=new DataTransfer();data.setData('text/plain','다른이름\t알수없음\t99.99\n다른이름2\t남\t88.00');
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    });
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="name"]').inputValue(),'김가람','잘못된 붙여넣기는 전체 취소');

    const names96=Array.from({length:96},(_,i)=>'가상학생'+String(i+1).padStart(3,'0')).join('\r\n');
    await page.locator('#rosterBody tr:first-child [data-key="name"]').evaluate((el,text)=>{
      const data=new DataTransfer();data.setData('text/plain',text);
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    },names96);
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="name"]').inputValue(),'가상학생001');
    assert.equal(await page.locator('#rosterBody tr:last-child [data-key="name"]').inputValue(),'가상학생096');
    const savedStage=await page.evaluate(()=>({
      students:state.students.length,
      sourceClasses:state.sourceClasses.length,
      slots:state.students.filter(st=>st.oldGrade==='5'&&st.oldClass&&st.number).length
    }));
    assert.deepEqual(savedStage,{students:96,sourceClasses:4,slots:96});
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#view-roster').isVisible(),true);
    assert.equal(await page.locator('#rosterBody tr[data-student]').count(),96);
    assert.equal(await page.locator('#rosterBody tr:last-child [data-key="name"]').inputValue(),'가상학생096');
    // Settings can generate example names without changing gender, academic scores or original numbers.
    await page.locator('#openSettings').click();
    const beforeDemoNames=await page.evaluate(()=>state.students.map(st=>({gender:st.gender,level:st.level,oldClass:st.oldClass,number:st.number})));
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#replaceDemoNames').click();
    const exampleNames=await page.evaluate(()=>state.students.map(st=>st.name));
    assert.equal(new Set(exampleNames).size,96);
    assert.ok(exampleNames.every(x=>/^[가-힣]{3,4}$/.test(x)));
    assert.deepEqual(await page.evaluate(()=>state.students.map(st=>({gender:st.gender,level:st.level,oldClass:st.oldClass,number:st.number}))),beforeDemoNames);
    // Existing demo still replaces the current roster after explicit confirmation.
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#demo').click();
    assert.equal(await page.locator('#statStudents').textContent(),'36명');

    // Individual name colors are edited in the inline spreadsheet toolbar.
    const coloredStudentId=await page.evaluate(()=>state.students[0].id);
    const secondColoredStudentId=await page.evaluate(()=>state.students[1].id);
    await page.locator('#rosterBody [data-student="'+coloredStudentId+'"] [data-key="name"]').click();
    await page.locator('#rosterFillColor').fill('#ffe0e6');
    await page.locator('#rosterFillColor').dispatchEvent('change');
    assert.equal(await page.evaluate(id=>state.students.find(s=>s.id===id).color,coloredStudentId),'#ffe0e6');
    assert.match(await page.locator('#rosterBody [data-student="'+coloredStudentId+'"] [data-roster-cell="name"]').getAttribute('style'),/#ffe0e6/);
    await page.locator('#rosterBody [data-student="'+secondColoredStudentId+'"] [data-key="name"]').click();
    await page.locator('#rosterFillColor').fill('#162b4d');
    await page.locator('#rosterFillColor').dispatchEvent('change');
    assert.equal(await page.evaluate(id=>state.students.find(s=>s.id===id).color,secondColoredStudentId),'#162b4d');
    const nameColorsBeforeReload=await page.evaluate(()=>state.students.slice(0,2).map(s=>s.color));
    assert.deepEqual(nameColorsBeforeReload,['#ffe0e6','#162b4d']);
    await page.reload({waitUntil:'domcontentloaded'});
    assert.deepEqual(await page.evaluate(()=>state.students.slice(0,2).map(s=>s.color)),nameColorsBeforeReload);
    assert.match(await page.locator('#rosterBody [data-student="'+secondColoredStudentId+'"] [data-roster-cell="name"]').getAttribute('style'),/#162b4d/);

    const headings=await page.locator('#rosterHead th').allTextContents();
    assert.deepEqual(headings,['기존 학년 · 반 · 번호','이름','성별','학습지표','유의 사항']);
    const first=page.locator('#rosterBody tr').first();
    await first.locator('[data-key="level"]').fill('0.00');
    await first.locator('[data-key="level"]').press('Tab');
    await page.locator('#traitRemotePalette [data-remote-trait="다문화"]').dragTo(first.locator('[data-roster-cell="traits"]'));
    await page.locator('#traitRemotePalette [data-remote-trait="사회성"]').dragTo(first.locator('[data-key="name"]'));
    assert.equal(await first.locator('[data-remove-trait="다문화"]').count(),1);
    assert.equal(await first.locator('[data-remove-trait="사회성"]').count(),1);
    assert.equal(await page.locator('#rosterBody .notice-picker').count(),0);
    await page.locator('#openSettings').click();
    assert.equal(await page.locator('#plannerSettingsDialog').isVisible(),true);
    await page.locator('#newTrait').fill('돌봄 필요');
    await page.locator('#addTrait').click();
    assert.match(await page.locator('#traitChips').textContent(),/돌봄 필요/);
    await page.locator('#newTrait').fill('검수 임시');
    await page.locator('#addTrait').click();
    assert.match(await page.locator('#traitChips').textContent(),/검수 임시/);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#traitChips [data-delete-trait="검수 임시"]').click();
    assert.doesNotMatch(await page.locator('#traitChips').textContent(),/검수 임시/);
    await page.locator('#settingsDone').click();
    const nextFirst=page.locator('#rosterBody tr').first();
    await page.locator('#traitRemotePalette [data-remote-trait="돌봄 필요"]').dragTo(nextFirst.locator('[data-roster-cell="traits"]'));
    assert.equal(await nextFirst.locator('[data-remove-trait="돌봄 필요"]').count(),1);
    assert.equal(await nextFirst.locator('[data-key="level"]').inputValue(),'0.00');
    // Attention-category caps are configured in step zero, not the separation screen.
    await page.locator('[data-tab="setup"]').click();
    await page.locator('input[data-cap="운동부"]').fill('2');
    await page.locator('input[data-cap="운동부"]').press('Tab');
    assert.equal(await page.locator('input[data-cap="운동부"]').inputValue(),'2');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="setup"]').click();
    assert.equal(await page.locator('input[data-cap="운동부"]').inputValue(),'2','반당 인원 상한은 새로고침 후에도 보존해야 합니다.');
    await page.locator('[data-tab="rules"]').click();

    // Visual separation baskets: build two independent groups with draggable students.
    const basketIds=await page.evaluate(()=>state.students.slice(0,5).map(st=>st.id));
    await page.locator('#addBasket').click();
    assert.equal(await page.locator('#basketCount').textContent(),'1개');
    assert.equal(await page.locator('#basketPool select').count(),0,'학생 찾기에는 드롭다운이 없어야 함');
    await page.locator('#basketPool [data-basket-pick="'+basketIds[0]+'"]').click();
    await page.locator('[data-basket-drop]').first().locator('[data-basket-add-selected]').click();
    await page.locator('#basketPool [data-basket-pick="'+basketIds[1]+'"]').click();
    await page.locator('[data-basket-drop]').first().locator('[data-basket-add-selected]').click();
    await page.locator('#basketPool [data-drag-student="'+basketIds[2]+'"]').dragTo(page.locator('[data-basket-drop]').first());
    assert.equal(await page.locator('[data-basket-drop]').first().locator('.basket-chip').count(),3);
    await page.locator('#addBasket').click();
    assert.equal(await page.locator('#basketCount').textContent(),'2개');
    await page.locator('#basketPool [data-basket-pick="'+basketIds[3]+'"]').click();
    await page.locator('[data-basket-drop]').nth(1).locator('[data-basket-add-selected]').click();
    await page.locator('#basketPool [data-basket-pick="'+basketIds[4]+'"]').click();
    await page.locator('[data-basket-drop]').nth(1).locator('[data-basket-add-selected]').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="rules"]').click();
    assert.equal(await page.locator('[data-basket-drop]').count(),2);
    assert.equal(await page.locator('[data-basket-drop]').first().locator('.basket-chip').count(),3);
    assert.equal(await page.locator('[data-basket-drop]').nth(1).locator('.basket-chip').count(),2);
    // Schools without prior teacher choice start OFF; switching ON preserves future fixed picks.
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('#openSettings').click();
    await page.locator('#plannerSettingsDialog .priority-switch').click();
    await page.locator('#settingsDone').click();
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),true);
    assert.equal(await page.locator('[data-tab="preset"]').isVisible(),true,'ON should reveal teacher placement tab');

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
    assert.equal(await page.locator('#resultGrid [data-locked="true"]').count(),2,'교사 지정 학생은 결과에서 이동 불가');
    assert.match(await page.locator('#resultGrid').textContent(),/담당 담당교사 A/);
    const firstClass=await page.locator('[data-result-student="'+firstId+'"]').getAttribute('data-assigned-class');
    const secondClass=await page.locator('[data-result-student="'+secondId+'"]').getAttribute('data-assigned-class');
    assert.equal(firstClass,'1');
    assert.equal(secondClass,'2');
    await page.locator('[data-tab="roster"]').click();
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('[data-result-student="'+firstId+'"]').getAttribute('data-assigned-class'),'1');
    assert.equal(await page.locator('[data-result-student="'+secondId+'"]').getAttribute('data-assigned-class'),'2');

    assert.equal(await page.locator('#view-results').isVisible(),true,'편성 결과 화면으로 이동해야 합니다.');

    // Both class layout modes and printed output keep the original pupil color.
    const initialCandidateCount=await page.evaluate(()=>state.candidates.length);
    assert.match(await page.locator('#resultGrid [data-result-student="'+coloredStudentId+'"] .student-name-highlight').getAttribute('style'),/#ffe0e6/);
    assert.match(await page.locator('#resultGrid [data-result-student="'+secondColoredStudentId+'"] .student-name-highlight').getAttribute('style'),/#162b4d/);
    await page.locator('#resultGrid [data-result-student="'+coloredStudentId+'"] .student-name-highlight').click();
    if(!await page.locator('#traitRemote').isVisible())await page.locator('#toggleResultRemote').click();
    if(!await page.locator('#traitRemoteBody').isVisible())await page.locator('#collapseTraitRemote').click();
    await page.locator('#traitRemote [data-remote-color="#fff0b9"]').click();
    // Close the floating editor while exercising exports and native drag review.
    await page.locator('#closeTraitRemote').click();
    assert.equal(await page.evaluate(()=>state.candidates.length),initialCandidateCount,'색상만 변경하면 편성안을 다시 계산하지 않아야 함');
    assert.equal(await page.evaluate(id=>state.students.find(s=>s.id===id).color,coloredStudentId),'#fff0b9');
    await page.locator('#resultCompare').click();
    assert.match(await page.locator('#resultGrid [data-result-student="'+coloredStudentId+'"] .student-name-highlight').getAttribute('style'),/#fff0b9/);
    assert.match(await page.locator('#resultPrintSheet').innerHTML(),/#fff0b9/);
    await page.locator('#resultVertical').click();
    assert.match(await page.locator('#resultPrintSheet').innerHTML(),/#fff0b9/);
    await page.locator('[data-tab="roster"]').click();
    assert.match(await page.locator('#rosterBody [data-student="'+coloredStudentId+'"] [data-roster-cell="name"]').getAttribute('style'),/#fff0b9/);
    await page.locator('[data-tab="results"]').click();

    assert.ok(await page.locator('#alternatives .alt').count()>=1);
    assert.match(await page.locator('#validation').textContent(),/지정한 배정 조건 충족/);
    assert.match(await page.locator('#report').textContent(),/운동부 \(반당 최대 2명\)/);
    const [classCsv] = await Promise.all([page.waitForEvent('download'),page.locator('#exportCsv').click()]);
    assert.ok(classCsv.suggestedFilename().startsWith('반편성_결과_') && classCsv.suggestedFilename().endsWith('.csv'));
    const savedCsv=fs.readFileSync(await classCsv.path(),'utf8');
    assert.match(savedCsv,/담당교사 A/);
    assert.match(savedCsv,/교사 지정/);
    // The final class list offers vertical and same-row side-by-side comparison.
    assert.equal(await page.locator('#resultGrid').getAttribute('data-layout'),'vertical');
    assert.equal(await page.locator('#resultVertical').getAttribute('aria-pressed'),'true');
    const verticalMatrix=await page.evaluate(()=>selectedResultMatrix());
    assert.equal(verticalMatrix.length,await page.evaluate(()=>state.students.length+1));
    assert.equal(verticalMatrix[0][0],'새 학급');
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{
      configurable:true,value:{writeText:async value=>{window.__copiedResult=value}}
    }));
    await page.locator('#copyResultExcel').click();
    const copiedVertical=await page.evaluate(()=>window.__copiedResult);
    assert.match(copiedVertical,/새 학급\t담당 교사\t새 번호/);
    assert.ok(copiedVertical.includes('\r\n'));
    await page.locator('#resultCompare').click();
    assert.equal(await page.locator('#resultGrid').getAttribute('data-layout'),'compare');
    assert.equal(await page.locator('#resultCompare').getAttribute('aria-pressed'),'true');
    const positions=await page.locator('#resultGrid .class-card').evaluateAll(cards=>cards.map(el=>{
      const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width}
    }));
    assert.ok(positions.length>=2);
    assert.ok(positions.every(x=>Math.abs(x.top-positions[0].top)<4),'comparison class columns should line up');
    assert.ok(positions[1].left>positions[0].left+50,'next class appears to the right');
    const comparison=await page.evaluate(()=>selectedResultMatrix());
    assert.equal(comparison[0].length,positions.length*6);
    assert.equal(comparison[1][0],'새 번호');
    assert.equal(comparison[1][6],'새 번호');
    await page.locator('#copyResultExcel').click();
    const copiedCompare=await page.evaluate(()=>window.__copiedResult);
    assert.match(copiedCompare,/새 번호\t이름\t성별/);
    assert.match(copiedCompare,/6학년 1반/);
    const [wideDownload] = await Promise.all([page.waitForEvent('download'),page.locator('#exportCsv').click()]);
    assert.match(wideDownload.suggestedFilename(),/가로비교\.csv$/);
    const wideCsv=fs.readFileSync(await wideDownload.path(),'utf8');
    assert.match(wideCsv,/새 번호,이름,성별/);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('#resultPrintSheet').isVisible(),true);
    assert.equal(await page.locator('#resultGrid').isVisible(),false);
    assert.equal(await page.locator('#resultPrintSheet .print-compare').count(),Math.ceil(positions.length/4));
    assert.equal(await page.locator('#resultPrintSheet .print-vertical').count(),0);
    assert.match(await page.locator('#resultPrintSheet').textContent(),/남/);
    await page.emulateMedia({media:'screen'});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="results"]').click();
    assert.equal(await page.locator('#resultGrid').getAttribute('data-layout'),'compare','comparison view must be saved');
    await page.locator('#resultVertical').click();
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('#resultPrintSheet .print-vertical').count(),positions.length);
    assert.equal(await page.locator('#resultPrintSheet .print-compare').count(),0);
    await page.emulateMedia({media:'screen'});


    // All basket members must be placed into different classes, even with teacher-first OFF.
    const preserved=await page.evaluate(()=>state.students.filter(st=>st.fixed).map(st=>[st.id,st.fixed]));
    await page.locator('#openSettings').click();
    await page.locator('#plannerSettingsDialog .priority-switch').click();
    await page.locator('#settingsDone').click();
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('#resultGrid [data-locked="true"]').count(),0);
    const offState=await page.evaluate(()=>{
      const assigned=state.candidates[state.activeCandidate].assign;
      return {pins:state.students.filter(st=>st.fixed).map(st=>[st.id,st.fixed]),
        baskets:state.baskets.map(b=>b.members.map(id=>assigned[id]))};
    });
    assert.deepEqual(offState.pins,preserved,'OFF여도 저장된 교사 지정 기록은 남아야 함');
    for(const classes of offState.baskets)assert.equal(new Set(classes).size,classes.length,'같은 바구니 학생은 서로 다른 반');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#teacherPriorityOn').isChecked(),false);
    await page.locator('#openSettings').click();
    await page.locator('#plannerSettingsDialog .priority-switch').click();
    await page.locator('#settingsDone').click();
    await page.locator('#generateQuick').click();
    assert.equal(await page.locator('#resultGrid [data-locked="true"]').count(),2);




    // Drag-to-class review: use same-row comparison view, where both classes are visible at once.
    await page.locator('#resultCompare').click();
    // Keep source handles and class headers together below the sticky stage navigation.
    await page.evaluate(()=>{const grid=document.getElementById('resultGrid').getBoundingClientRect(),nav=document.querySelector('.tabs').getBoundingClientRect();window.scrollTo(0,scrollY+grid.top-nav.bottom-16)});
    const reviewChoice=await page.evaluate(()=>{
      const plan=state.candidates[state.activeCandidate];
      const visible=Array.from(document.querySelectorAll('#resultGrid .class-body')).flatMap(body=>Array.from(body.querySelectorAll('[data-result-student]')).slice(0,4)).map(el=>state.students.find(st=>st.id===el.dataset.resultStudent)).filter(Boolean);
      for(const preferTags of [true,false])for(const st of visible){
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
    await page.evaluate(()=>{
      window.__moveDragEvents=[];
      const root=document.getElementById('resultGrid');
      for(const type of ['dragstart','dragenter','dragover','drop','dragend']){
        root.addEventListener(type,e=>window.__moveDragEvents.push({
          type,target:e.target?.tagName,room:e.target?.closest?.('[data-drop-class]')?.dataset.dropClass||null,
          active:moveDraggingId,transfer:e.dataTransfer?.getData('text/plain')||'',source:e.target?.closest?.('[data-result-student]')?.dataset.resultStudent||'',prevented:e.defaultPrevented
        }),true);
      }
    });
    await page.locator('[data-result-student="'+reviewChoice.id+'"] .drag-handle').dragTo(page.locator('[data-drop-class="'+reviewChoice.to+'"] .class-top'),{sourcePosition:{x:7,y:9},targetPosition:{x:24,y:26}});
    const dragDiagnostics=await page.evaluate(()=>({
      history:window.__moveDragEvents.slice(0,25),
      assigned:state.candidates[state.activeCandidate].assign,
      undo:moveUndoStack.slice(),lastMove:moveLastResult?.analysis?.id||null,
      preview:document.getElementById('movePreview').textContent
    }));
    assert.equal(await page.locator('[data-result-student="'+reviewChoice.id+'"]').getAttribute('data-assigned-class'),String(reviewChoice.to),reviewChoice.id+' / '+JSON.stringify(dragDiagnostics.history)+' / '+JSON.stringify(dragDiagnostics.undo)+' / '+dragDiagnostics.preview);
    assert.match(await page.locator('#moveHistoryResult').textContent(),/최근 이동/);
    assert.match(await page.locator('#moveHistoryResult').textContent(),/학습지표 평균/);
    assert.match(await page.locator('#moveHistoryResult').textContent(),/다문화/);
    const changedMetrics=await page.evaluate(()=>reportData(state.candidates[state.activeCandidate]));
    assert.equal(changedMetrics[reviewChoice.from-1].total,startMetrics[reviewChoice.from-1].total-1);
    assert.equal(changedMetrics[reviewChoice.to-1].total,startMetrics[reviewChoice.to-1].total+1);
    assert.equal(await page.locator('#undoMove').isEnabled(),true);
    await page.locator('#undoMove').click();
    assert.equal(await page.locator('[data-result-student="'+reviewChoice.id+'"]').getAttribute('data-assigned-class'),String(reviewChoice.from));
    assert.match(await page.locator('#moveHistoryResult').textContent(),/되돌림 완료/);
    // In vertical mode the destination may be far away: use the touch-friendly select-and-move controls.
    await page.locator('#resultVertical').click();
    // Tablet workflow without native HTML drag support: select a pupil and tap destination.
    await page.setViewportSize({width:420,height:840});
    await page.locator('[data-result-student="'+reviewChoice.id+'"] [data-select-move]').click();
    assert.match(await page.locator('#moveSelection').textContent(),/이동할 학생/);
    await page.locator('[data-drop-button="'+reviewChoice.to+'"]').click();
    assert.equal(await page.locator('[data-result-student="'+reviewChoice.id+'"]').getAttribute('data-assigned-class'),String(reviewChoice.to));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="results"]').click();
    assert.equal(await page.locator('[data-result-student="'+reviewChoice.id+'"]').getAttribute('data-assigned-class'),String(reviewChoice.to),'drag changes persist after reload');
    await page.setViewportSize({width:1280,height:900});

    // One Excel-style roster replaces the duplicate pop-up bulk import mode.
    await page.locator('[data-tab="roster"]').click();
    assert.equal(await page.locator('#toggleBulk').count(),0,'no duplicate Excel-mode toggle');
    assert.equal(await page.locator('#bulkPanel').count(),0,'no separate Excel import panel');
    assert.equal(await page.locator('.roster-sheet').count(),1);
    assert.ok(await page.locator('#rosterBody tr[data-student]').count()>=3);
    const beforeIdentity=await page.evaluate(()=>state.students.map(s=>[s.id,s.oldGrade,s.oldClass,s.number]));
    const copied='이름\t성별\t학습지표\t유의 사항\n김하늘\t여\t92.50\t다문화; 사회성\n이도윤\t남\t0.00\t특수\n박서연\t여\t85.25\t사회성';
    await page.locator('#rosterBody tr:first-child [data-key="name"]').evaluate((el,value)=>{
      const data=new DataTransfer();data.setData('text/plain',value);
      el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
    },copied);
    assert.equal(await page.locator('#rosterBody tr:first-child [data-key="name"]').inputValue(),'김하늘');
    assert.equal(await page.locator('#rosterBody tr:nth-child(2) [data-key="gender"]').inputValue(),'남');
    assert.equal(await page.locator('#rosterBody tr:nth-child(2) [data-key="level"]').inputValue(),'0.00');
    assert.match(await page.locator('#rosterBody tr:first-child [data-key="traitsText"]').inputValue(),/다문화/);
    assert.deepEqual(await page.evaluate(()=>state.students.map(s=>[s.id,s.oldGrade,s.oldClass,s.number])),beforeIdentity);
    assert.equal(await page.locator('#rosterBody tr').count(),beforeIdentity.length,'no duplicate students created');
    // Select name cells and fill down in the one grid; undo must restore values.
    await page.locator('#rosterBody tr:first-child [data-key="name"]').click();
    await page.locator('#rosterBody tr:nth-child(3) [data-key="name"]').click({modifiers:['Shift']});
    assert.equal(await page.locator('#rosterFillDown').isEnabled(),true);
    const selectedTSV=await page.evaluate(()=>rosterSelectedTSV());
    assert.match(selectedTSV,/김하늘/);
    await page.locator('#rosterFillDown').click();
    assert.equal(await page.locator('#rosterBody tr:nth-child(3) [data-key="name"]').inputValue(),'김하늘');
    await page.locator('#rosterUndo').click();
    assert.equal(await page.locator('#rosterBody tr:nth-child(3) [data-key="name"]').inputValue(),'박서연');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('[data-tab="roster"]').click();
    assert.equal(await page.locator('#rosterBody tr:nth-child(2) [data-key="level"]').inputValue(),'0.00');
    assert.equal(await page.locator('#rosterBody tr:nth-child(3) [data-key="name"]').inputValue(),'박서연');

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


