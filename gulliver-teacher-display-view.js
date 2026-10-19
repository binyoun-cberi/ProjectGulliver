/* Student-only second window. No teacher settings, storage reads, or secret assignment maps. */
(() => {
  'use strict';
  try { window.opener = null; } catch {}
  const query = new URLSearchParams(location.search);
  const kind = query.get('kind') || '';
  const token = query.get('session') || '';
  const allowed = new Set(['timer', 'lesson', 'seating', 'manitto']);
  const stage = document.getElementById('displayStage');
  const connection = document.getElementById('displayConnection');
  const full = document.getElementById('displayFullscreen');
  let channel = null;
  let lastSeen = 0;
  let lastState = null;
  let selectedManitto = '';

  const element = (tag, className = '', content = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined && content !== null) node.textContent = String(content);
    return node;
  };
  const safeText = (value, fallback = '') => String(value == null ? fallback : value).slice(0, 500);
  const numeric = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const clock = seconds => {
    const n = Math.ceil(numeric(seconds, 0, 86400));
    const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = n % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  function waiting(title, message) {
    const wrap = element('section', 'display-waiting');
    wrap.append(element('div', 'waiting-symbol', '📺'), element('h1', '', title), element('p', '', message));
    stage.replaceChildren(wrap);
  }
  function setConnection(state, text) {
    if (connection.dataset.state === state && connection.textContent === text) return;
    connection.dataset.state = state;
    connection.textContent = text;
  }
  function send(type, payload = {}) {
    channel?.postMessage({version: 1, token, kind, type, payload});
  }

  function renderTimer(data) {
    const card = element('section', 'display-card');
    const eyebrow = element('div', 'display-eyebrow', '수업 흐름 타이머');
    const title = element('h1', 'display-title', safeText(data.title, '오늘의 수업'));
    const layout = element('div', 'timer-layout');
    const ring = element('div', 'timer-ring');
    const accent = /^#[0-9a-f]{6}$/i.test(data.color || '') ? data.color : '#6958dc';
    const progress = numeric(data.progress, 0, 100);
    ring.style.background = `conic-gradient(${accent} ${progress}%, #e4e7f3 ${progress}%)`;
    const center = element('div', 'timer-center');
    center.append(
      element('div', 'timer-status', safeText(data.status, '준비')),
      element('div', 'timer-label', safeText(data.phase, '도입')),
      element('div', 'timer-clock', clock(data.phaseRemaining)),
      element('div', 'timer-note', safeText(data.note))
    );
    ring.append(center);
    const info = element('div');
    info.append(
      element('div', 'timer-status', `${Math.floor(progress)}% 진행`),
      element('h2', 'display-title', `전체 ${clock(data.totalRemaining)} 남음`),
      element('p', 'timer-next', safeText(data.next, '다음 활동을 준비해요')),
      element('p', 'timer-summary', `수업 시간 ${clock(data.total)}`)
    );
    const phases = element('div', 'timer-phases');
    (Array.isArray(data.events) ? data.events : []).slice(0, 30).forEach((event, index) => {
      phases.append(element('span', 'timer-phase' + (index === data.currentIndex ? ' active' : ''), `${safeText(event.name)} · ${Math.ceil(numeric(event.durationSec, 0, 21600) / 60)}분`));
    });
    info.append(phases);
    layout.append(ring, info);
    card.append(eyebrow, title, layout);
    stage.replaceChildren(card);
  }

  function renderLesson(data) {
    const card = element('section', 'display-card lesson-card');
    card.dataset.subject = safeText(data.subject, '국어');
    const head = element('div', 'lesson-head');
    head.append(element('span', 'lesson-subject', safeText(data.subject, '수업')), element('span', 'lesson-page', safeText(data.page)));
    card.append(head,
      element('p', 'lesson-unit', safeText(data.unit)),
      element('h1', 'lesson-topic', safeText(data.topic, '오늘의 수업')));
    const objective = element('div', 'lesson-objective');
    objective.append(element('small', '', '🎯 학습 목표'), element('div', '', safeText(data.objective)));
    card.append(objective);
    const activities = element('div', 'lesson-activities');
    ['act1', 'act2', 'act3'].forEach((key, index) => {
      const item = element('div', 'lesson-activity');
      item.append(element('span', '', `활동 ${index + 1}`), element('strong', '', safeText(data[key])));
      activities.append(item);
    });
    card.append(activities, element('div', 'lesson-wrapup', `✨ 정리 · ${safeText(data.wrapup)}`));
    stage.replaceChildren(card);
  }

  function renderSeating(data) {
    if (!data.ready) {
      waiting('자리표를 준비하고 있어요', '교사 화면에서 학생을 배정하면 완성된 자리표만 여기에 나타나요.');
      return;
    }
    const cols = numeric(data.cols, 1, 12), rows = numeric(data.rows, 1, 12);
    const seats = Array.isArray(data.seats) ? data.seats : [];
    const card = element('section', 'display-card seating-card');
    card.append(element('h1', 'seating-head', '우리 반 자리표'), element('div', 'seating-board-label', '▲ 칠판 · 교탁'));
    const grid = element('div', 'seating-grid');
    grid.style.gridTemplateColumns = `repeat(${cols},minmax(0,1fr))`;
    for (let i = 0; i < cols * rows; i++) {
      const index = data.flipped ? (cols * rows - 1 - i) : i;
      const name = seats[index];
      grid.append(element('div', 'seating-seat' + (name === null ? ' unused' : name ? '' : ' empty'), name === null ? '' : safeText(name, '빈자리') || '빈자리'));
    }
    card.append(grid);
    stage.replaceChildren(card);
  }

  function renderManitto(data) {
    if (!data.started) {
      waiting('마니또를 준비하고 있어요', '교사 화면에서 배정을 마치면 이름표가 나타나요.');
      return;
    }
    const card = element('section', 'display-card manitto-card');
    card.append(element('div', 'display-eyebrow', '우리 반 마니또'), element('h1', 'display-title', '🎁 누가 먼저 뽑아 볼까요?'));
    card.append(element('p', 'display-subtitle', '자신의 이름을 누르면 선생님 화면에서 비밀 결과를 확인해요.'));
    const list = element('div', 'manitto-grid');
    const students = Array.isArray(data.students) ? data.students.slice(0, 100) : [];
    if (selectedManitto && students.some(s => s.name === selectedManitto && s.checked)) selectedManitto = '';
    students.forEach(student => {
      const name = safeText(student.name);
      const button = element('button', 'manitto-person', name + (student.checked ? ' · 확인 완료' : ''));
      button.type = 'button';
      button.disabled = Boolean(student.checked) || Boolean(selectedManitto);
      button.addEventListener('click', () => {
        selectedManitto = name;
        send('action', {action: 'request', name});
        renderManitto(data);
      });
      list.append(button);
    });
    card.append(list, element('div', 'manitto-request', selectedManitto ? `${selectedManitto} · 선생님이 비밀 결과를 확인 중이에요.` : '비밀 배정 관계는 선생님 화면에서만 확인해요.'));
    if (selectedManitto) {
      const reset = element('button', 'manitto-reset', '다른 이름 고르기');
      reset.type = 'button';
      reset.addEventListener('click', () => { selectedManitto = ''; renderManitto(data); });
      card.append(reset);
    }
    stage.replaceChildren(card);
  }

  function render(data) {
    if (!data || data.kind !== kind) return;
    if (kind === 'timer') renderTimer(data);
    else if (kind === 'lesson') renderLesson(data);
    else if (kind === 'seating') renderSeating(data);
    else if (kind === 'manitto') renderManitto(data);
  }
  full.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setConnection('disconnected', '전체화면을 열 수 없어요. F11 키를 사용해 주세요.'); }
  });
  document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement ? '⛶ 전체화면 닫기' : '⛶ 전체화면'; });

  if (!allowed.has(kind) || !/^[0-9a-f]{32}$/i.test(token) || typeof BroadcastChannel !== 'function') {
    setConnection('disconnected', '학생 화면을 연결할 수 없어요.');
    waiting('교사 화면에서 다시 열어 주세요', '주소를 직접 열거나 다른 브라우저에서 연 경우 연결되지 않아요.');
    return;
  }
  channel = new BroadcastChannel('gulliver.student-display.v1.' + token);
  channel.onmessage = event => {
    const message = event.data;
    if (!message || message.version !== 1 || message.token !== token || message.kind !== kind) return;
    if (message.type === 'state') {
      lastSeen = Date.now();
      lastState = message.payload;
      setConnection('connected', '● 교사 화면과 연결됨');
      render(lastState);
    } else if (message.type === 'end') {
      lastSeen = 0;
      lastState = null;
      setConnection('disconnected', '교사 화면 연결 종료');
      waiting('교사 화면 연결이 종료됐어요', '교사 화면에서 학생 창을 다시 열어 주세요.');
    } else if (message.type === 'error') {
      waiting('학생 화면을 갱신할 수 없어요', safeText(message.payload?.message));
    }
  };
  send('hello');
  const connectionTimer = setInterval(() => {
    if (lastSeen && Date.now() - lastSeen > 15000) {
      lastSeen = 0;
      lastState = null;
      selectedManitto = '';
      setConnection('disconnected', '교사 화면 연결 끊김');
      waiting('교사 화면과 연결이 끊겼어요', '교사 화면이 열려 있는지 확인해 주세요.');
    }
    if (!lastSeen) send('hello');
  }, 3000);
  window.addEventListener('beforeunload', () => { clearInterval(connectionTimer); channel?.close(); });
})();
