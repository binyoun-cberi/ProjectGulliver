(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PDF = window.PDFLib, core = window.PdfTtakCore;
  const entries = [];
  const links = [];
  let mode = 'merge', active = false, nextId = 0;
  const maxFile = 70 * 1024 * 1024, maxTotal = 150 * 1024 * 1024;
  const modes = ['merge', 'extract', 'split', 'rotate', 'advanced'];
  const labels = {merge:'PDF 합치기',extract:'페이지 골라 저장',split:'PDF 나누기',rotate:'페이지 회전',advanced:'고급 PDF 편집'};
  const mime = 'application/pdf';
  function notice(message, kind = '') {
    $('message').textContent = message;
    $('message').className = 'message' + (kind ? ' ' + kind : '');
  }
  function formatSize(bytes) { return bytes < 1048576 ? Math.ceil(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB'; }
  function setActive(value) { active = value; render(); }
  function clearOutputs() {
    for (const url of links) URL.revokeObjectURL(url);
    links.length = 0;
    $('outputs').replaceChildren();
    $('results').hidden = true;
  }
  function revokeOnClose() { for(const url of links) URL.revokeObjectURL(url); }
  window.addEventListener('pagehide', revokeOnClose);
  async function addFiles(files) {
    if (!PDF || !core) return notice('PDF 처리 도구를 불러오지 못했어요. 페이지를 다시 열어 주세요.', 'error');
    if (active) return;
    const selected = Array.from(files || []);
    if (!selected.length) return;
    setActive(true);
    clearOutputs();
    const errors = [];
    let added = 0;
    for (const file of selected) {
      const currentSize = entries.reduce((n, e) => n + e.file.size, 0);
      if (!/\.pdf$/i.test(file.name) && file.type !== mime) { errors.push(file.name + ': PDF 파일만 넣어 주세요.'); continue; }
      if (file.size === 0 || file.size > maxFile || currentSize + file.size > maxTotal) { errors.push(file.name + ': 파일 크기를 확인해 주세요. (개별 70MB, 전체 150MB 이내)'); continue; }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdf = await PDF.PDFDocument.load(bytes, {updateMetadata:false});
        const count = pdf.getPageCount();
        if (!count) throw Error('빈 PDF');
        entries.push({id:++nextId, file, bytes, pages:count});
        added += 1;
      } catch(e) {
        errors.push(file.name + ': 파일이 손상됐거나 암호로 보호되었을 수 있어요.');
      }
      // Allow the UI to repaint between large files.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    setActive(false);
    $('inputFiles').value = '';
    notice(errors.length ? (added ? added + '개 추가했어요. ' : '') + errors.join(' ') : added + '개 파일을 준비했어요.', errors.length ? 'error' : 'success');
  }
  function move(index, diff) {
    const dst = index + diff;
    if (active || dst < 0 || dst >= entries.length) return;
    [entries[index], entries[dst]] = [entries[dst],entries[index]];
    clearOutputs(); render();
  }
  function renderList() {
    const list = $('fileList');
    list.replaceChildren();
    $('fileEmpty').hidden = entries.length > 0;
    $('fileCount').textContent = entries.length + '개 파일 · ' + entries.reduce((n,e)=>n+e.pages,0) + '쪽';
    entries.forEach((entry, i) => {
      const li = document.createElement('li'); li.className = 'file-row';
      const name = document.createElement('div'); name.className = 'file-name';
      const strong = document.createElement('strong'); strong.textContent = entry.file.name;
      const small = document.createElement('small'); small.textContent = entry.pages + '쪽 · ' + formatSize(entry.file.size);
      name.append(strong, small);
      const actions = document.createElement('div'); actions.className = 'file-actions';
      for(const [symbol, title, effect, disabled] of [
        ['↑','위로 이동',()=>move(i,-1),i===0],
        ['↓','아래로 이동',()=>move(i,1),i===entries.length-1],
        ['×','목록에서 삭제',()=>{entries.splice(i,1);clearOutputs();render();},false]
      ]) {
        const b = document.createElement('button'); b.type='button'; b.textContent=symbol; b.title=title; b.setAttribute('aria-label', entry.file.name + ' ' + title);
        b.disabled=active||disabled; b.addEventListener('click', effect); actions.append(b);
      }
      li.append(name,actions);list.append(li);
    });
  }
  function render() {
    renderList();
    modes.forEach(id => {
      const target = $('mode-'+id);
      target.hidden = id !== mode;
      const tab = $('tab-'+id);
      tab.classList.toggle('selected',id === mode);
      tab.setAttribute('aria-selected',String(id === mode));
    });
    const source = $('sourceFile');
    const lastSelected = source.value;
    source.replaceChildren();
    entries.forEach(e=>{
      const op = document.createElement('option');op.value=String(e.id);op.textContent=e.file.name+' ('+e.pages+'쪽)';source.append(op);
    });
    if(entries.some(e=>String(e.id)===lastSelected))source.value=lastSelected;
    const entry = entries.find(e=>String(e.id)===source.value) || entries[0];
    $('sourceDesc').textContent = entry ? '선택한 PDF: '+entry.pages+'쪽' : '먼저 PDF 파일을 추가해 주세요.';
    $('run').hidden = mode==='advanced';
    $('run').disabled = active || !entries.length || (mode==='merge' && entries.length < 2) || !PDF || !core;
    $('run').textContent = active ? '처리 중…' : labels[mode]+' 실행';
    $('clearFiles').disabled = active || !entries.length;
    $('inputFiles').disabled = active;
    $('fileDrop').classList.toggle('disabled', active);
  }
  function selectedFile() {
    const id = Number($('sourceFile').value);
    return entries.find(e=>e.id===id) || entries[0];
  }
  function renderOutput(output) {
    const url = URL.createObjectURL(new Blob([output.bytes], {type:mime}));
    links.push(url);
    const a = document.createElement('a');
    a.className='result-link';a.href=url;a.download=output.filename;
    a.textContent=output.filename + ' · '+formatSize(output.bytes.length);
    a.setAttribute('aria-label',output.filename+' PDF 내려받기');
    $('outputs').append(a);
  }
  async function copySelection(from, pages) {
    const destination = await PDF.PDFDocument.create();
    const copies = await destination.copyPages(from, pages);
    copies.forEach(page=>destination.addPage(page));
    return destination;
  }
  async function run() {
    if(active || !entries.length || !PDF || !core || mode==='advanced')return;
    clearOutputs(); setActive(true);
    notice('PDF를 처리하고 있어요. 파일 크기에 따라 잠시 걸릴 수 있어요.');
    try {
      const file = selectedFile();
      const outputs=[];
      if(mode==='merge') {
        if(entries.length<2)throw Error('합칠 PDF 파일을 두 개 이상 넣어 주세요.');
        const result=await PDF.PDFDocument.create();
        for(const e of entries) {
          const input=await PDF.PDFDocument.load(e.bytes,{updateMetadata:false});
          const pages=await result.copyPages(input,input.getPageIndices());
          pages.forEach(page=>result.addPage(page));
        }
        outputs.push({filename:'합친_수업자료.pdf',bytes:await result.save()});
      } else {
        if(!file)throw Error('PDF를 하나 선택해 주세요.');
        const original=await PDF.PDFDocument.load(file.bytes,{updateMetadata:false});
        if(mode==='extract') {
          const picked=core.parsePages($('extractPages').value,original.getPageCount());
          const pdf=await copySelection(original,picked);
          outputs.push({filename:core.outputName(file.file.name,'선택페이지'),bytes:await pdf.save()});
        }
        if(mode==='split') {
          const step=Number($('splitEvery').value);
          for (const [i,range] of core.splitRanges(original.getPageCount(),step).entries()) {
            const part=await copySelection(original,range);
            outputs.push({filename:core.outputName(file.file.name,'나누기_'+String(i+1).padStart(2,'0')),bytes:await part.save()});
          }
        }
        if(mode==='rotate') {
          const input=$('rotatePages').value.trim();
          const selected=input?core.parsePages(input,original.getPageCount()):original.getPageIndices();
          const pdf=await copySelection(original,original.getPageIndices());
          const degrees=Number($('rotation').value);
          for(const i of selected) {
            const p=pdf.getPage(i);
            p.setRotation(PDF.degrees(((p.getRotation().angle||0)+degrees)%360));
          }
          outputs.push({filename:core.outputName(file.file.name,'회전'),bytes:await pdf.save()});
        }
      }
      for(const output of outputs)renderOutput(output);
      $('results').hidden=false;
      notice(outputs.length + '개 PDF가 준비됐어요. 아래 파일을 눌러 기기에 저장하세요.','success');
      $('results').scrollIntoView({behavior:'smooth',block:'nearest'});
    } catch(e) {
      notice(e?.message || 'PDF를 처리하지 못했어요. 다른 PDF로 다시 시도해 주세요.', 'error');
    } finally {setActive(false);}
  }
  function showMode(value) {
    if(active||!modes.includes(value))return;
    mode=value;clearOutputs();render();
  }
  $('inputFiles').addEventListener('change',event=>addFiles(event.target.files));
  const drop=$('fileDrop');
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');addFiles(e.dataTransfer.files);});
  $('clearFiles').addEventListener('click',()=>{if(active)return;entries.length=0;clearOutputs();render();notice('파일 목록을 비웠어요.');});
  $('sourceFile').addEventListener('change',()=>{
    const selected=selectedFile();
    $('sourceDesc').textContent = selected?'선택한 PDF: '+selected.pages+'쪽':'';
    clearOutputs();
  });
  modes.forEach(value=>$('tab-'+value).addEventListener('click',()=>showMode(value)));
  $('run').addEventListener('click',run);
  const frame=$('advancedFrame');
  $('launchAdvanced').addEventListener('click',()=>{
    if(frame.dataset.started)return;
    frame.src='assets/artcraft/pdfcraft/index.html';
    frame.dataset.started='yes';
    $('launchAdvanced').hidden=true;
    $('advancedBox').hidden=false;
  });
  // Separate mode does not silently upload files to the native PdfCraft editor.
  $('advancedOpen').href='assets/artcraft/pdfcraft/index.html';
  if(!PDF)notice('PDF 간편 도구가 아직 배포되지 않았어요. 새로고침 후 다시 시도해 주세요.','error');
  render();
})();
