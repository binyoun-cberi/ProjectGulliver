/* Classroom tools 6.2: opt-in preparation/result navigation, without touching legacy data. */
(() => {
  'use strict';
  function mount(options = {}) {
    if (!options.container || document.querySelector('.gt-v62-flow')) throw new TypeError('학급 운영 도구 영역을 확인해 주세요.');
    const bar = document.createElement('section');
    bar.className = 'gt-v62-flow';
    bar.setAttribute('aria-label', '학급 운영 단계');
    const info = document.createElement('div');
    info.className = 'gt-v62-info';
    const label = document.createElement('span');
    label.className = 'gt-v62-eyebrow';
    label.textContent = '학급 운영 · 6.2';
    const title = document.createElement('strong');
    title.textContent = options.title || '우리 반';
    const help = document.createElement('p');
    help.textContent = options.description || '명단과 조건은 교사 화면에, 공개 결과는 학생 화면에 표시해요.';
    info.append(label, title, help);
    const actions = document.createElement('div');
    actions.className = 'gt-v62-actions';
    function button(text, className, action) {
      const item = document.createElement('button');
      item.type = 'button'; item.textContent = text; item.className = className;
      item.addEventListener('click', action); actions.append(item); return item;
    }
    let step = 'prepare';
    const prepareButton = button('① 준비하기', 'gt-v62-button', () => setStep('prepare'));
    const resultButton = button(options.resultLabel || '② 결과 보기', 'gt-v62-button', () => setStep('result'));
    const studentButton = button('📺 학생 화면 열기 ↗', 'gt-v62-button gt-v62-student', () => window.GulliverTeacherDisplay?.open());
    bar.append(info, actions);
    options.container.prepend(bar);
    function setStep(next) {
      if (next !== 'prepare' && next !== 'result') return false;
      if (next === 'result' && options.onResult?.() === false) return false;
      if (next === 'prepare') options.onPrepare?.();
      step = next;
      document.body.classList.toggle('gt-v62-result', next === 'result');
      bar.dataset.step = step;
      prepareButton.setAttribute('aria-pressed', String(step === 'prepare'));
      resultButton.setAttribute('aria-pressed', String(step === 'result'));
      return true;
    }
    studentButton.hidden = !window.GulliverTeacherDisplay?.supported?.();
    window.addEventListener('gulliver:student-display-change', () => {
      studentButton.hidden = !window.GulliverTeacherDisplay?.supported?.();
      studentButton.textContent = window.GulliverTeacherDisplay?.connected?.() ? '📺 학생 화면 보기 ↗' : '📺 학생 화면 열기 ↗';
    });
    setStep('prepare');
    return Object.freeze({setStep, getStep: () => step});
  }
  window.GulliverTeacherClassroomFlow = Object.freeze({mount});
})();
