/* Teacher tools 6.0: one lightweight navigation frame around existing apps. */
(() => {
  'use strict';
  const tools = [
    ['지도안식 원형 타이머.html', '수업 흐름 타이머', '시간·안내', '🕘'],
    ['토너먼트 메이커.html', '토너먼트 메이커', '게임·이벤트', '🏆'],
    ['시간 경쟁 시스템.html', '타이머·스톱워치', '시간·안내', '⏱️'],
    ['자리 배정 프로그램.html', '교실 자리 배정', '학급 운영', '🎒'],
    ['QR코드.html', 'QR 코드 도구', '업무·편의', '📱'],
    ['교실용 마피아 게임.html', '교실용 마피아 게임', '게임·이벤트', '🕶️'],
    ['학급 배정 도우미.html', '학급 역할 배정', '학급 운영', '🧹'],
    ['잡아라 오늘의 정답.html', '잡아라! 오늘의 정답', '게임·이벤트', '🎯'],
    ['끝말잇기 게임.html', '랜덤 끝말잇기', '게임·이벤트', '🔤'],
    ['마니또 배정 도우미.html', '마니또 배정', '학급 운영', '🎁'],
    ['이번 수업 알리미.html', '이번 수업 알리미', '시간·안내', '📺'],
    ['우리반 선관위.html', '우리 반 투표판', '학급 운영', '🗳️'],
    ['칭찬 온도계.html', '학급 칭찬 온도계', '학급 운영', '🌡️'],
    ['학급췍.html', '제출·준비물 확인', '학급 운영', '✅'],
    ['폭탄돌리기.html', '폭탄 돌리기', '게임·이벤트', '💣'],
    ['버스 좌석 배치 프로그램.html', '버스 좌석 배치', '학급 운영', '🚌'],
    ['행운의 모둠 메이커.html', '모둠 만들기', '학급 운영', '🎰'],
    ['범퍼 룰렛.html', '범퍼 룰렛 레이스', '게임·이벤트', '🎡'],
    ['플래시퀴즈메이커.html', '낱말카드·퀴즈', '게임·이벤트', '🗂️'],
    ['뚝딱교육.html', '성취기준·세특 도우미', '업무·편의', '📚'],
    ['뚝딱영상.html', '수업 영상 보관함', '업무·편의', '🎬']
  ];
  const pathname = decodeURIComponent(location.pathname.split('/').pop() || '');
  const current = tools.find(([file]) => file === pathname);
  if (!current) return;

  function embeddedInCanvas() {
    if (window.parent === window || new URLSearchParams(location.search).get('studioEmbed') !== '1') return false;
    try { return window.parent.location.origin === location.origin && Boolean(window.parent.GulliverTeacherLive); }
    catch { return false; }
  }

  const LINKS = [
    ['홈', 'index.html'], ['제작실', '뚝딱 제작실.html'],
    ['내 보관함', '내 보관함.html'], ['수업 준비', 'lesson.html'],
    ['우리 반', '우리반.html']
  ];
  function link(name, href) {
    const a = document.createElement('a');
    a.textContent = name;
    a.href = href;
    return a;
  }
  function mount() {
    if (!document.body || document.querySelector('.gt-shell')) return;
    document.body.classList.add('gt-teacher-tool');
    document.body.dataset.gtTool = pathname;
    if (embeddedInCanvas()) {
      document.body.classList.add('gulliver-studio-embed');
      return;
    }
    const existing = document.querySelector('.gulliver-shell');
    const shell = existing || document.createElement('div');
    shell.className = 'gulliver-shell gt-shell';
    shell.setAttribute('role', 'banner');
    shell.replaceChildren();

    const inner = document.createElement('div'); inner.className = 'gt-inner';
    const brand = link('뚝딱교실', 'index.html'); brand.className = 'gt-brand';
    const brandIcon = document.createElement('span'); brandIcon.className = 'gt-brand-mark';
    brandIcon.textContent = '🧰'; brandIcon.setAttribute('aria-hidden', 'true');
    brand.prepend(brandIcon);
    const identity = document.createElement('div'); identity.className = 'gt-identity';
    const name = document.createElement('strong'); name.textContent = current[1];
    const category = document.createElement('span'); category.className = 'gt-category'; category.textContent = current[2];
    identity.append(name, category);

    const nav = document.createElement('nav'); nav.className = 'gt-nav'; nav.setAttribute('aria-label', '뚝딱교실 주요 메뉴');
    LINKS.forEach(([text, href]) => nav.append(link(text, href)));
    const actions = document.createElement('div'); actions.className = 'gt-actions';
    const help = document.createElement('details'); help.className = 'gt-help';
    const summary = document.createElement('summary'); summary.className = 'gt-action'; summary.textContent = '저장 안내';
    const panel = document.createElement('div'); panel.className = 'gt-help-panel';
    const panelTitle = document.createElement('strong'); panelTitle.textContent = '도구의 저장 상태';
    const saveStatus = document.createElement('p');
    saveStatus.textContent = '설정과 결과는 도구마다 저장 방식이 달라요. 기존 도구의 저장 버튼과 안내를 확인해 주세요. 내 보관함에 자동으로 들어간다는 뜻은 아니에요.';
    saveStatus.setAttribute('role', 'status');
    panel.append(panelTitle, saveStatus); help.append(summary, panel);
    const full = document.createElement('button'); full.type = 'button'; full.className = 'gt-action';
    full.dataset.gtFullscreen = '1'; full.textContent = '⛶ 교사창 확대';
    full.title = '설정과 명단이 있는 현재 교사 화면만 확대합니다. 학생용 화면은 별도 창으로 열어 주세요.';
    full.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else throw Error('지원하지 않음');
      } catch { window.GulliverTeacherComponents?.notice('이 브라우저에서는 전체화면을 사용할 수 없어요.'); }
    });
    document.addEventListener('fullscreenchange', () => {
      full.textContent = document.fullscreenElement ? '⛶ 확대 종료' : '⛶ 교사창 확대';
    });
    const mobile = document.createElement('details'); mobile.className = 'gt-mobile-links';
    const mobileToggle = document.createElement('summary'); mobileToggle.className = 'gt-action'; mobileToggle.textContent = '이동 ▾';
    const mobileMenu = document.createElement('nav'); mobileMenu.className = 'gt-mobile-menu'; mobileMenu.setAttribute('aria-label', '뚝딱교실 이동');
    LINKS.forEach(([text, href]) => mobileMenu.append(link(text, href)));
    mobile.append(mobileToggle, mobileMenu);
    actions.append(help, full, mobile);
    inner.append(brand, identity, nav, actions);
    shell.append(inner);
    let displayButton = null;
    function syncStudentDisplayButton() {
      const display = window.GulliverTeacherDisplay;
      if (!display?.supported?.()) return;
      if (!displayButton) {
        displayButton = document.createElement('button');
        displayButton.type = 'button';
        displayButton.className = 'gt-action gt-open-display';
        displayButton.title = '두 번째 모니터에 학생용 창을 엽니다. 교사용 설정은 보이지 않아요.';
        displayButton.addEventListener('click', () => display.open());
        actions.insertBefore(displayButton, full);
        shell.classList.add('gt-display-ready');
      }
      displayButton.dataset.open = String(display.connected());
      displayButton.textContent = display.connected() ? '📺 학생창 보기 ↗' : '📺 학생창 열기 ↗';
    }
    window.addEventListener('gulliver:student-display-change', syncStudentDisplayButton);
    syncStudentDisplayButton();
    if (!existing) {
      document.body.insertAdjacentElement('afterbegin', shell);
      window.Gulliver?.trackTool?.({name: current[1], href: pathname, icon: current[3]});
    }
    window.GulliverTeacherShell = Object.freeze({
      tool: current[1],
      updateSaveState(state, message) {
        const descriptions = {
          idle: '이 도구의 저장 버튼과 안내를 확인해 주세요.',
          saving: '저장하는 중…', saved: '현재 작업을 저장했어요.',
          error: '저장에 실패했어요. 도구의 안내를 확인해 주세요.'
        };
        if (!(state in descriptions)) throw new TypeError('알 수 없는 저장 상태입니다.');
        saveStatus.textContent = message == null ? descriptions[state] : String(message);
        panelTitle.textContent = state === 'error' ? '저장 문제' : '도구의 저장 상태';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})();
