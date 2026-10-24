/* Shared, opt-in building blocks for classroom tools. Does not touch legacy data. */
(() => {
  'use strict';
  const STATES = {
    idle: '저장 여부는 도구에서 확인하세요',
    saving: '저장하는 중…',
    saved: '저장했어요',
    error: '저장하지 못했어요'
  };

  function notice(message, {duration = 2800} = {}) {
    let node = document.querySelector('.gt-toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'gt-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      document.body.append(node);
    }
    node.textContent = String(message);
    node.hidden = false;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.hidden = true; }, duration);
    return node;
  }

  function createSaveStatus(initial = 'idle') {
    const node = document.createElement('span');
    node.className = 'gt-status';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    setSaveStatus(node, initial);
    return node;
  }
  function setSaveStatus(node, state = 'idle', message) {
    if (!node || !(state in STATES)) throw new TypeError('알 수 없는 저장 상태입니다.');
    node.dataset.state = state;
    node.textContent = message == null ? STATES[state] : String(message);
    return node;
  }

  /* Clicking is the only thing that returns actual names to the host tool.
   * Never inject rosters into a student-facing screen automatically. */
  function createClassroomPicker({onSelect, label = '우리 반 불러오기'} = {}) {
    if (typeof onSelect !== 'function') throw new TypeError('명단을 받을 함수를 지정해 주세요.');
    const box = document.createElement('div');
    box.className = 'gt-classroom-picker';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gt-button';
    button.textContent = '👥 ' + label;
    const info = document.createElement('span');
    info.className = 'gt-status';
    function updateCount() {
      const room = window.Gulliver?.getClassroom?.();
      info.textContent = room?.students?.length ? `${room.className} · ${room.students.length}명` : '저장된 명단 없음';
    }
    button.addEventListener('click', () => {
      const room = window.Gulliver?.getClassroom?.();
      if (!room?.students?.length) {
        notice('우리 반에서 명단을 먼저 등록해 주세요.');
        return;
      }
      // Copy the data so consumers cannot mutate the shared roster by reference.
      onSelect(room.students.map(student => ({...student})), room.className);
    });
    window.addEventListener('gulliver:classroom-change', updateCount);
    window.addEventListener('storage', event => {
      if (event.key === 'gulliver.classroom.v1') updateCount();
    });
    box.append(button, info);
    updateCount();
    return box;
  }

  function confirmAction({title = '확인할까요?', message = '', confirmText = '확인', cancelText = '취소'} = {}) {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog');
      dialog.className = 'gt-dialog';
      const heading = document.createElement('h2');
      heading.textContent = title;
      const description = document.createElement('p');
      description.textContent = message;
      const footer = document.createElement('div');
      footer.className = 'gt-dialog-actions';
      const cancel = document.createElement('button');
      cancel.className = 'gt-button';
      cancel.type = 'button';
      cancel.textContent = cancelText;
      const accept = document.createElement('button');
      accept.className = 'gt-button gt-button--primary';
      accept.type = 'button';
      accept.textContent = confirmText;
      footer.append(cancel, accept);
      dialog.append(heading, description, footer);
      document.body.append(dialog);
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        if (dialog.open) dialog.close();
        dialog.remove();
        resolve(value);
      };
      cancel.addEventListener('click', () => finish(false));
      accept.addEventListener('click', () => finish(true));
      dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else finish(window.confirm(`${title}\n${message}`));
    });
  }

  /* Only expose buttons with real supplied handlers. */
  function createResultActions({onPrint, onImage} = {}) {
    const group = document.createElement('div');
    group.className = 'gt-result-actions';
    const actions = [
      ['인쇄', onPrint], ['이미지 저장', onImage]
    ];
    actions.forEach(([label, handler]) => {
      if (typeof handler !== 'function') return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gt-button';
      button.textContent = label;
      button.addEventListener('click', () => handler());
      group.append(button);
    });
    return group;
  }

  window.GulliverTeacherComponents = Object.freeze({
    notice, createSaveStatus, setSaveStatus, createClassroomPicker,
    confirmAction, createResultActions
  });
})();
