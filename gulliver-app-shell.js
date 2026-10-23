/* One site frame for worksheets and classroom tools. */
(() => {
  'use strict';
  const file = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  const sections = [
    ['home', '홈', 'index.html'], ['worksheet', '문제지', '문제지 만들기.html'], ['tools', '교사 도구', 'index.html?view=tools'],
    ['classroom', '우리 반', '우리반.html']
  ];
  const principal = {'index.html':'home', '문제지 만들기.html':'worksheet', '우리반.html':'classroom'};
  let shell, actions;
  function embedded() {
    if (window.parent === window) return false;
    try {
      if (window.parent.location.origin !== location.origin) return false;
      return Boolean(window.parent.GulliverTeacherLive);
    } catch { return false; }
  }
  function element(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function mount(options = {}) {
    if (!document.body || embedded()) return null;
    if (shell?.isConnected) return {shell, actions};
    document.body.classList.add('gx-app');
    document.body.dataset.gxPage = principal[file] || 'tool';
    // Remove the previous floating frame if an older caller ran first.
    document.querySelectorAll('.gulliver-shell:not(.gx-header)').forEach(node => node.remove());
    shell = element('header', 'gx-header gulliver-shell');
    shell.id = 'gulliverAppHeader';
    const inner = element('div', 'gx-header-inner');
    const brand = element('a', 'gx-brand'); brand.href = 'index.html';
    const logo = element('img'); logo.src = 'logo.png'; logo.alt = ''; logo.width = 30; logo.height = 30;
    brand.append(logo, element('span', '', '매일 수업'));
    const nav = element('nav', 'gulliver-nav gx-nav'); nav.setAttribute('aria-label', '매일 수업 주요 메뉴');
    const selected = file === 'index.html' && new URLSearchParams(location.search).get('view') === 'tools' ? 'tools' : principal[file] || null;
    for (const [key, label, href] of sections) {
      const a = element('a', '', label); a.href = href;
      if (key === selected) a.setAttribute('aria-current', 'page');
      nav.append(a);
    }
    actions = element('div', 'gx-header-actions');
    inner.append(brand, nav, actions); shell.append(inner);
    const skip = element('a', 'gx-skip', '작업 영역으로 건너뛰기'); skip.href = '#gulliverWork'; shell.prepend(skip);
    document.body.prepend(shell);
    const work = document.querySelector('main, .page, .dashboard-container, .app, .workspace');
    if (work) {
      if (!work.id) work.id = 'gulliverWork';
      work.classList.add('gx-work-target');
      if (!work.hasAttribute('tabindex')) work.tabIndex = -1;
      skip.href = '#' + work.id;
      skip.addEventListener('click', () => work.focus({preventScroll: false}));
    }
    return {shell, actions};
  }
  function refine(root = document) {
    if (embedded()) return;
    const scopes = root === document ? [document.body] : [root];
    for (const scope of scopes) {
      if (!scope?.querySelectorAll) continue;
      // Opt in controls without changing game pieces or student displays.
      const exclude = '.gx-header, #stage, .stage, .student-screen, .game-area, .race-area, .roulette-area, #view-flash, #view-quiz, #view-match';
      for (const button of scope.querySelectorAll('button, a.btn, a.button, label.btn, label.upload')) {
        if (button.closest(exclude) || button.matches('.gx-button, #drawerShade, .scrim, .control-btn, .tool-btn, .seat, .desk, .lever, .tab, .palette-tab, .step-button, [data-view], [data-tab], [data-category], [role="tab"]')) continue;
        button.classList.add('gx-button');
        if (button.matches('.danger, .btn-danger, .gt-button--danger') || /^(全部|全体)?(전체 초기화|학급정보 지우기|기록 지우기|테마 삭제|삭제)$/.test(button.textContent.trim())) button.classList.add('gx-danger');
        else if (button.matches('.primary, .btn-primary, .primary-btn, .gt-button--primary, .gt-v61-button--primary, .create, .btn.green') || /확정$/.test(button.textContent.trim())) button.classList.add('gx-primary');
      }
      for (const field of scope.querySelectorAll('input, select, textarea')) {
        if (field.closest(exclude) || field.matches('[type="hidden"], [type="checkbox"], [type="radio"], [type="color"], [type="range"], [type="file"]')) continue;
        field.classList.add('gx-input');
      }
    }
  }
  function init() {
    if (embedded()) { document.body.classList.add('gx-embedded'); return; }
    document.title = document.title.replaceAll('뚝딱교실', '매일 수업');
    mount();
    const titleSelectors = {
      home: '.welcome', classroom: 'main>.hero',
      tool: '.topline, .head, .hero, main.app>header, .topbar, .dashboard-container>header, body>div>header'
    };
    const heading = document.querySelector(titleSelectors[document.body.dataset.gxPage]);
    if (heading) {
      heading.classList.add('gx-page-heading');
      const title = heading.querySelector('h1');
      if (title && !title.childElementCount) title.textContent = title.textContent.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '');
    }
    document.querySelectorAll('.tabs').forEach(tabs => {
      if (!tabs.closest('#stage, .stage, .paper, .slide-surface')) tabs.classList.add('gx-tabs');
    });
    refine();
    // Only newly inserted controls need opt-in; drag/clock style changes never trigger this.
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1 && !node.closest('.gx-header')) refine(node.parentElement);
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }
  window.GulliverAppShell = Object.freeze({mount, embedded, refine});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
