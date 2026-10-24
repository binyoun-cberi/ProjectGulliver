/* One site frame for worksheets and classroom tools. */
(() => {
  'use strict';
  // Keep the release number aligned with package.json when publishing a new site release.
  const release = Object.freeze({version:'1.2.0', date:'2026-10-24', changes:['과학 17개 영역에 자료 해석 문항 104개 추가', '관찰 그림·비교표·그래프를 읽는 문제지', '같은 학습 목표의 반복과 정답 노출 개선']});
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
  function releaseBadge() {
    const details=element('details','gx-release'),summary=element('summary','gx-release-label','v'+release.version);
    summary.setAttribute('aria-label','사이트 버전 '+release.version+' · 최근 변경 내용');
    summary.title='현재 화면의 사이트 버전과 최근 변경 내용';
    const panel=element('section','gx-release-panel');panel.setAttribute('aria-label','사이트 버전 정보');
    panel.append(element('strong','','클라시트 v'+release.version));
    const date=element('time','','업데이트 · '+release.date.replaceAll('-','.'));date.dateTime=release.date;panel.append(date);
    const heading=element('p','','최근 변경 내용'),list=element('ul');for(const change of release.changes)list.append(element('li','',change));panel.append(heading,list);details.append(summary,panel);
    details.addEventListener('toggle',()=>{if(details.open)shell?.querySelectorAll('.gx-worksheet-picker[open]').forEach(picker=>{picker.open=false})});
    details.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;summary.focus()}});
    document.addEventListener('click',e=>{if(!details.contains(e.target))details.open=false});
    return details;
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
    const logo = element('img'); logo.src = 'clasheet-mark.svg?v=20261023-1'; logo.alt = ''; logo.width = 30; logo.height = 30;
    brand.append(logo, element('span', '', '클라시트'));
    const nav = element('nav', 'gulliver-nav gx-nav'); nav.setAttribute('aria-label', '클라시트 주요 메뉴');
    const selected = file === 'index.html' && new URLSearchParams(location.search).get('view') === 'tools' ? 'tools' : principal[file] || null;
    for (const [key, label, href] of sections) {
      if(key==='worksheet'){
        const picker=element('details','gx-worksheet-picker'),summary=element('summary','','문제지 ▾');summary.setAttribute('aria-label','문제지 과목 선택');
        if(key===selected)summary.setAttribute('aria-current','page');
        const menu=element('div','gx-subject-menu');menu.setAttribute('aria-label','문제지 과목');
        const subjects=[['korean','국어'],['math','수학'],['social','사회'],['science','과학'],['english','영어']];
        for(const [value,name] of subjects){const link=element('a','',name);link.href=href+'?subject='+value;link.dataset.worksheetSubject=value;
          link.onclick=e=>{if(file==='문제지 만들기.html'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){e.preventDefault();picker.open=false;window.dispatchEvent(new CustomEvent('gulliver:worksheet-subject',{detail:{subject:value}}));summary.focus();}};menu.append(link)}
        picker.append(summary,menu);nav.append(picker);
        picker.addEventListener('toggle',()=>{if(picker.open)shell?.querySelectorAll('.gx-release[open]').forEach(badge=>{badge.open=false})});
        document.addEventListener('click',e=>{if(!picker.contains(e.target))picker.open=false});
        picker.addEventListener('keydown',e=>{if(e.key==='Escape'){picker.open=false;summary.focus()}});
        continue;
      }
      const a = element('a', '', label); a.href = href;
      if (key === selected) a.setAttribute('aria-current', 'page');
      nav.append(a);
    }
    actions = element('div', 'gx-header-actions');
    inner.append(brand, nav, actions, releaseBadge()); shell.append(inner);
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
    document.title = document.title.replaceAll('뚝딱교실', '클라시트').replaceAll('매일 수업', '클라시트');
    if (!document.title.includes('클라시트')) document.title += ' · 클라시트';
    const icon = document.querySelector('link[rel="icon"]') || document.createElement('link');
    icon.rel = 'icon'; icon.type = 'image/svg+xml'; icon.href = 'clasheet-mark.svg?v=20261023-1';
    if (!icon.isConnected) document.head.append(icon);
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


