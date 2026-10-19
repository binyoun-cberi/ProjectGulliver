/* Teacher tools 6.0.1: send only opt-in, student-safe state to a second window. */
(() => {
  'use strict';
  const KINDS = new Set(['timer', 'lesson', 'seating', 'manitto', 'flashquiz']);
  const CHANNEL_PREFIX = 'gulliver.student-display.v1.';
  let adapter = null;
  let channel = null;
  let studentWindow = null;
  let interval = null;
  let session = '';
  let lastState = '';
  let lastSent = 0;

  const announce = () => window.dispatchEvent(new Event('gulliver:student-display-change'));
  const notice = message => {
    if (window.GulliverTeacherComponents?.notice) window.GulliverTeacherComponents.notice(message);
    else window.alert(message);
  };

  function register(options) {
    if (!options || !KINDS.has(options.kind) || typeof options.getSnapshot !== 'function') {
      throw new TypeError('학생 화면에 표시할 도구와 공개 정보를 지정해 주세요.');
    }
    adapter = options;
    announce();
  }

  function connected() { return Boolean(studentWindow && !studentWindow.closed && channel); }
  function send(type, payload) {
    if (channel) channel.postMessage({version: 1, token: session, kind: adapter.kind, type, payload});
  }
  function publish(force = false) {
    if (!connected()) { stop(); return; }
    try {
      const snapshot = adapter.getSnapshot();
      if (!snapshot || snapshot.kind !== adapter.kind) throw Error('학생용 내용의 종류가 일치하지 않아요.');
      const serialized = JSON.stringify(snapshot);
      if (serialized.length > 40000) throw Error('학생 화면 내용이 너무 커요.');
      const now = Date.now();
      if (force || serialized !== lastState || now - lastSent > 3000) {
        lastState = serialized;
        lastSent = now;
        send('state', snapshot);
      }
    } catch (error) {
      send('error', {message: '교사 화면에서 학생용 자료를 확인해 주세요.'});
      console.warn('학생 화면 갱신 실패', error);
    }
  }
  function stop() {
    if (interval) clearInterval(interval);
    interval = null;
    if (channel) {
      send('end', {});
      channel.close();
    }
    channel = null;
    studentWindow = null;
    session = '';
    lastState = '';
    announce();
  }
  function open() {
    if (!adapter) return false;
    if (connected()) { studentWindow.focus(); return true; }
    if (typeof BroadcastChannel !== 'function' || !window.crypto?.getRandomValues) {
      notice('이 브라우저에서는 두 화면 동기화를 지원하지 않아요. 최신 브라우저에서 다시 열어 주세요.');
      return false;
    }
    stop();
    const random = new Uint8Array(16);
    crypto.getRandomValues(random);
    session = [...random].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const url = new URL('gulliver-teacher-display.html', location.href);
    url.searchParams.set('kind', adapter.kind);
    url.searchParams.set('session', session);
    channel = new BroadcastChannel(CHANNEL_PREFIX + session);
    channel.onmessage = event => {
      const message = event.data;
      if (!message || message.version !== 1 || message.token !== session || message.kind !== adapter?.kind) return;
      if (message.type === 'hello') publish(true);
      if (message.type === 'action' && typeof adapter.onAction === 'function') {
        try { adapter.onAction(message.payload); }
        catch (error) { console.warn('학생 화면 요청 처리 실패', error); }
        publish(true);
      }
    };
    studentWindow = window.open(url.href, 'gulliver-student-' + adapter.kind, 'width=1280,height=800');
    if (!studentWindow) {
      stop();
      notice('학생 화면 창이 차단됐어요. 팝업을 허용하고 다시 눌러 주세요.');
      return false;
    }
    lastState = '';
    interval = setInterval(() => publish(), 500);
    publish(true);
    announce();
    return true;
  }
  window.addEventListener('beforeunload', () => {
    if (channel) send('end', {});
    if (interval) clearInterval(interval);
    channel?.close();
  });
  window.GulliverTeacherDisplay = Object.freeze({register, open, connected, supported: () => Boolean(adapter)});
})();
