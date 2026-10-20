/* Student-only second window. No teacher settings, storage reads, or secret assignment maps. */
(() => {
  'use strict';
  try { window.opener = null; } catch {}
  const query = new URLSearchParams(location.search);
  const kind = query.get('kind') || '';
  const token = query.get('session') || '';
  const allowed = new Set(['timer', 'lesson', 'seating', 'manitto', 'flashquiz', 'bus', 'groups', 'roles', 'check', 'vote', 'praise', 'canvas']);
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

  function renderFlashQuiz(data) {
    if (data.mode === 'manage') {
      waiting('낱말카드를 준비하고 있어요', '선생님이 카드를 고르고 학습을 시작하면 이곳에 표시돼요.');
      return;
    }
    const card = element('section', 'display-card flashquiz-display');
    const modes = {flash:'낱말카드',quiz:'4지선다 퀴즈',match:'짝 맞추기'};
    card.append(element('div', 'display-eyebrow', '낱말카드·퀴즈'),element('h1','display-title',modes[data.mode]||'우리 반 낱말 학습'));
    if (data.empty || data.mode === 'flash' && !data.total) {
      card.append(element('p','display-subtitle','학습할 카드를 준비하고 있어요.'));
    } else if (data.mode === 'flash') {
      const number=element('div','flashquiz-counter',`${numeric(data.index,0,2000)} / ${numeric(data.total,0,2000)}`);
      const cardFace=element('div','flashquiz-face'+(data.flipped?' revealed':''));
      cardFace.append(element('span','flashquiz-face-label',data.flipped?'뒷면 · 정답':'앞면 · 문제'),
        element('div','flashquiz-face-text',safeText(data.flipped?data.back:data.front)));
      card.append(number,cardFace,element('p','flashquiz-guide','선생님이 카드를 넘기거나 뒤집으면 함께 바뀌어요.'));
    } else if (data.mode === 'quiz') {
      if (data.done) {
        const result=element('div','flashquiz-result');
        result.append(element('span','','🎉 퀴즈 완료!'),element('strong','',`${numeric(data.total,0,2000)}문제 · ${numeric(data.score,0,1000000).toLocaleString()}점`));
        card.append(result);
      } else {
        card.append(element('div','flashquiz-counter',`문제 ${numeric(data.index,0,2000)} / ${numeric(data.total,0,2000)} · 점수 ${numeric(data.score,0,1000000)}`),
          element('div','flashquiz-question',safeText(data.question)));
        const choices=element('div','flashquiz-choices');
        (Array.isArray(data.choices)?data.choices:[]).slice(0,4).forEach(item=>{
          choices.append(element('div','flashquiz-choice'+(item.correct?' correct':item.wrong?' wrong':''),safeText(item.text)));
        });
        card.append(choices,element('div','flashquiz-feedback',data.answered?safeText(data.feedback):'어느 번호가 정답일까요?'));
      }
    } else if (data.mode === 'match') {
      card.append(element('div','flashquiz-counter',`남은 짝 ${numeric(data.remaining,0,100)} · 실수 ${numeric(data.mistakes,0,1000)} · ${safeText(data.time,'00:00.0')}`));
      const board=element('div','flashquiz-matchboard');
      const grid=element('div','flashquiz-matchcolumns');
      const left=element('div','flashquiz-matchcol');
      const right=element('div','flashquiz-matchcol');
      const leftNodes=[],rightNodes=[];
      (Array.isArray(data.left)?data.left:[]).slice(0,12).forEach(item=>{
        const node=element('div','flashquiz-matchitem'+(item.matched?' matched':''),safeText(item.text));left.append(node);leftNodes.push(node);
      });
      (Array.isArray(data.right)?data.right:[]).slice(0,12).forEach(item=>{
        const node=element('div','flashquiz-matchitem'+(item.matched?' matched':''),safeText(item.text));right.append(node);rightNodes.push(node);
      });
      const paths=document.createElementNS('http://www.w3.org/2000/svg','svg');
      paths.classList.add('flashquiz-matchlines');paths.setAttribute('aria-hidden','true');
      grid.append(left,right);board.append(grid,paths);card.append(board);
      stage.replaceChildren(card);
      requestAnimationFrame(()=>{
        if(!board.isConnected)return;
        const bounds=board.getBoundingClientRect();paths.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
        (Array.isArray(data.links)?data.links:[]).forEach(link=>{
          const a=leftNodes[link.left],b=rightNodes[link.right];if(!a||!b)return;
          const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
          const x1=x.right-bounds.left,y1=x.top+x.height/2-bounds.top,x2=y.left-bounds.left,y2=y.top+y.height/2-bounds.top;
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d',`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`);
          path.setAttribute('stroke','#16a34a');path.setAttribute('fill','none');path.setAttribute('stroke-width','5');path.setAttribute('stroke-linecap','round');paths.append(path);
        });
      });
      return;
    }
    stage.replaceChildren(card);
  }

  function classroomCard(title, subtitle) {
    const card = element('section', 'display-card classroom-card');
    card.append(element('div', 'display-eyebrow', '뚝딱교실 · 학급 운영'), element('h1', 'display-title', title));
    if (subtitle) card.append(element('p', 'classroom-subtitle', subtitle));
    return card;
  }

  function renderBus(data) {
    if (!data.ready) {
      waiting('버스 자리표를 준비하고 있어요', '선생님이 자리를 배정하면 이 화면에 자리표가 나타나요.');
      return;
    }
    const card = classroomCard('🚌 우리 반 버스 자리표', '▲ 운전석 · 앞쪽');
    const board = element('div', 'classroom-bus-grid');
    (Array.isArray(data.seats) ? data.seats : []).slice(0, 40).forEach((name, index) => {
      if (index % 4 === 0) board.append(element('div', 'classroom-row-no', `${Math.floor(index / 4) + 1}열`));
      board.append(element('div', 'classroom-bus-seat' + (name === null ? ' disabled' : ''), name === null ? '—' : safeText(name, '빈자리') || '빈자리'));
      if (index % 4 === 1) board.append(element('div', 'classroom-bus-aisle', '통로'));
    });
    card.append(board); stage.replaceChildren(card);
  }

  function renderGroups(data) {
    if (!data.started) {
      waiting('모둠을 준비하고 있어요', '선생님이 모둠을 만들고 공개하면 이 화면에도 하나씩 나타나요.');
      return;
    }
    const total = numeric(data.total, 0, 100), revealed = numeric(data.revealed, 0, total);
    const card = classroomCard('🎰 우리 반 모둠', `${revealed} / ${total} 모둠 공개`);
    const grid = element('div', 'classroom-group-grid');
    (Array.isArray(data.groups) ? data.groups : []).slice(0, revealed).forEach(group => {
      const block = element('section', 'classroom-group');
      block.append(element('h2', '', safeText(group.title)), element('div', 'classroom-group-members'));
      const members = block.lastChild;
      (Array.isArray(group.members) ? group.members : []).slice(0, 20).forEach(name => members.append(element('span', 'classroom-member', safeText(name))));
      grid.append(block);
    });
    if (revealed < total) grid.append(element('div', 'classroom-group unpublished', `🔒 남은 ${total - revealed}모둠은 아직 공개 전이에요`));
    card.append(grid); stage.replaceChildren(card);
  }

  function renderRoles(data) {
    if (!data.ready) {
      waiting('역할 배정 결과를 준비하고 있어요', '선생님이 모든 학생의 역할을 배정하면 이 화면에 공개돼요.');
      return;
    }
    const card = classroomCard('🧹 우리 반 1인 1역', '우리 반의 새로운 역할을 확인해요.');
    const grid = element('div', 'classroom-group-grid');
    (Array.isArray(data.roles) ? data.roles : []).slice(0, 40).forEach(role => {
      const block = element('section', 'classroom-group');
      block.append(element('h2', '', safeText(role.name)));
      const names = element('div', 'classroom-group-members');
      (Array.isArray(role.members) ? role.members : []).slice(0, 45).forEach(name => names.append(element('span', 'classroom-member', safeText(name))));
      if (!names.childElementCount) names.append(element('span', 'classroom-empty', '아직 배정 없음'));
      block.append(names); grid.append(block);
    });
    card.append(grid); stage.replaceChildren(card);
  }

  function renderCheck(data) {
    const total = numeric(data.total, 0, 100), checked = Math.min(total, numeric(data.checked, 0, 100));
    const percent = total ? Math.round(checked / total * 100) : 0;
    const card = classroomCard(`✅ ${safeText(data.theme, '제출·준비물 확인')}`, '학생별 상태는 선생님만 확인해요.');
    const score = element('div', 'classroom-score');
    score.append(element('strong', '', `${checked} / ${total}명`), element('span', '', `${percent}% 완료`));
    const track = element('div', 'classroom-progress-track');
    const fill = element('div', 'classroom-progress-fill'); fill.style.width = `${percent}%`; track.append(fill);
    card.append(score, track); stage.replaceChildren(card);
  }

  function renderVote(data) {
    const card = classroomCard(`🗳️ ${safeText(data.title, '우리 반 투표')}`, `${numeric(data.total, 0, 1000)}표 집계`);
    const options = element('div', 'classroom-vote-options');
    const max = Math.max(1, ...(Array.isArray(data.options) ? data.options : []).map(option => numeric(option.count, 0, 1000)));
    (Array.isArray(data.options) ? data.options : []).slice(0, 10).forEach(option => {
      const row = element('div', 'classroom-vote-row');
      const head = element('div', 'classroom-vote-head');
      head.append(element('strong', '', safeText(option.name)), element('span', '', `${numeric(option.count, 0, 1000)}표`));
      const track = element('div', 'classroom-progress-track');
      const fill = element('div', 'classroom-progress-fill vote-fill');
      fill.style.width = `${numeric(option.count, 0, 1000) / max * 100}%`;
      track.append(fill); row.append(head, track); options.append(row);
    });
    card.append(options); stage.replaceChildren(card);
  }

  function renderPraise(data) {
    const value = numeric(data.value, 0, 99999), goal = Math.max(1, numeric(data.goal, 1, 99999));
    const percent = Math.min(100, Math.round(value / goal * 100));
    const card = classroomCard('🌡️ 우리 반 칭찬 온도계', '함께 모은 우리 반 온도를 확인해요.');
    const score = element('div', 'classroom-score praise-score');
    score.append(element('strong', '', `${value}°`), element('span', '', `목표 ${goal}° · ${percent}% 달성`));
    const track = element('div', 'classroom-progress-track praise-track');
    const fill = element('div', 'classroom-progress-fill praise-fill'); fill.style.width = `${percent}%`; track.append(fill);
    card.append(score, track, element('p', 'classroom-cheer', value >= goal ? '🎉 목표 달성! 우리 반 최고!' : '조금씩 함께 올려봐요!'));
    stage.replaceChildren(card);
  }

  function renderCanvas(data) {
    if(data.hidden){waiting('잠시 기다려 주세요', '선생님이 다음 활동을 준비하고 있어요.');return;}
    if(data.unsupported){waiting('영상 수업을 준비해 주세요', '이 장면의 영상은 교사 화면에서 재생해 주세요.');return;}
    if(typeof data.svg!=='string'||data.svg.length>8000000||!data.svg.startsWith('<svg ')){waiting('수업 자료를 기다리고 있어요','교사 화면에서 페이지를 확인해 주세요.');return;}
    let image=stage.querySelector('.display-canvas-image');
    if(!image){image=element('img','display-canvas-image');stage.replaceChildren(image);}
    image.alt=safeText(data.title,'수업 화면');
    // Render as an image: no scripts, teacher controls, or private activity model.
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(data.svg);
  }

  function render(data) {
    if (!data || data.kind !== kind) return;
    if (kind === 'canvas') renderCanvas(data);
    else if (kind === 'timer') renderTimer(data);
    else if (kind === 'lesson') renderLesson(data);
    else if (kind === 'seating') renderSeating(data);
    else if (kind === 'manitto') renderManitto(data);
    else if (kind === 'flashquiz') renderFlashQuiz(data);
    else if (kind === 'bus') renderBus(data);
    else if (kind === 'groups') renderGroups(data);
    else if (kind === 'roles') renderRoles(data);
    else if (kind === 'check') renderCheck(data);
    else if (kind === 'vote') renderVote(data);
    else if (kind === 'praise') renderPraise(data);
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
