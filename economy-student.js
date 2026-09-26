(() => {
  "use strict";
  const API = "https://gulliver-api.binyoun.workers.dev";
  let classCode = (new URLSearchParams(location.search).get("class") || "").toUpperCase();
  let key = "gulliver.economy.student." + classCode;
  let session = readSession();
  let data = null;

  const $ = id => document.getElementById(id);
  function readSession(){ try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; } }
  function saveSession(){ sessionStorage.setItem(key, JSON.stringify(session)); }
  function esc(v){ return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
  function money(n){ const c = data ? data.settings.currency : "뚝"; return Number(n || 0).toLocaleString("ko-KR") + " " + c; }
  function notify(text){ const el=$("toast"); el.textContent=text; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),1800); }
  function errorText(v){ return ({INVALID_CREDENTIALS:"번호 또는 PIN을 확인하세요.",TEMPORARILY_LOCKED:"로그인 실패가 반복되어 잠시 잠겼습니다.",UNAUTHORIZED:"로그인이 만료됐습니다.",INSUFFICIENT_FUNDS:"지갑 잔액이 부족합니다.",INSUFFICIENT_SAVINGS:"저축 잔액이 부족합니다.",CERTIFICATE_REQUIRED:"필요한 자격증이 없습니다.",OUT_OF_STOCK:"품절된 상품입니다.",CASE_NOT_APPEALABLE:"현재는 이의 신청할 수 없습니다."})[v] || v; }
  function caseStatus(v){ return ({pending:"처분 예정",confirmed:"확정",appealed:"이의 신청 중",upheld:"유지",cancelled:"취소",reversed:"취소·환급"})[v] || v; }

  async function api(action, method="GET", body){
    const code = (session && session.classCode) || classCode;
    const headers = {"content-type":"application/json"};
    if (session && session.token) headers.authorization = "Bearer " + session.token;
    const res = await fetch(API + "/api/economy/" + code + "/" + action, {
      method, headers, body: body ? JSON.stringify(body) : undefined
    });
    let out = {};
    try { out = await res.json(); } catch {}
    if (!res.ok) throw new Error(out.error || ("HTTP_" + res.status));
    return out;
  }

  async function login(){
    const code = $("classCode").value.trim().toUpperCase();
    const studentCode = $("studentCode").value.trim().padStart(2,"0");
    const pin = $("pin").value.trim();
    if (!code || !studentCode || !pin) return notify("접속 정보를 모두 입력하세요.");
    try {
      const res = await fetch(API + "/api/economy/" + code + "/login", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({studentCode, pin})
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || ("HTTP_" + res.status));
      classCode = code;
      key = "gulliver.economy.student." + classCode;
      session = {classCode, token:out.token};
      saveSession();
      history.replaceState(null,"",location.pathname+"?class="+classCode);
      await load();
    } catch (e) { notify(errorText(e.message)); }
  }

  function logout(){
    sessionStorage.removeItem(key);
    session = null;
    data = null;
    render();
  }

  async function load(){
    if (!session) return render();
    try {
      data = await api("student-state");
      render();
    } catch (e) {
      if (e.message === "UNAUTHORIZED") {
        sessionStorage.removeItem(key);
        session = null;
        data = null;
      }
      notify(errorText(e.message));
      render();
    }
  }

  async function saveMoney(direction){
    try {
      await api("student-save","POST",{direction,amount:Number($("bankAmount").value)});
      notify(direction === "deposit" ? "저축했습니다." : "지갑으로 꺼냈습니다.");
      await load();
    } catch (e) { notify(errorText(e.message)); }
  }

  async function applyJob(jobId){
    try {
      await api("student-apply","POST",{jobId});
      notify("지원서를 냈습니다.");
      await load();
    } catch (e) { notify(errorText(e.message)); }
  }

  async function buy(itemId){
    if (!confirm("이 상품을 구매할까요?")) return;
    try {
      const out = await api("student-buy","POST",{itemId});
      notify("구매 완료 · " + money(out.total));
      await load();
    } catch (e) { notify(errorText(e.message)); }
  }

  async function appeal(caseId){
    const text = prompt("선생님께 전달할 이의 신청 내용을 적어주세요.");
    if (text == null) return;
    try {
      await api("student-appeal","POST",{caseId,text});
      notify("이의 신청을 보냈습니다.");
      await load();
    } catch (e) { notify(errorText(e.message)); }
  }

  function render(){
    $("loginView").classList.toggle("hidden", !!data);
    $("walletView").classList.toggle("hidden", !data);
    if (!data) return;

    const s = data.student;
    $("className").textContent = data.className + " · " + session.classCode;
    $("studentName").textContent = s.name;
    $("cash").textContent = money(s.balance);
    $("savings").textContent = money(s.savings);
    const currentJob = data.jobs.find(j => j.id === s.jobId);
    $("jobLine").textContent = currentJob ? currentJob.name + " · 월급 " + money(currentJob.salary) : "직업 미배정";
    $("interestInfo").textContent = "현재 저축 이율은 월급 회차당 " + data.settings.savingsInterestRate + "%입니다.";

    $("txRows").innerHTML = data.transactions.length ? data.transactions.map(t =>
      '<div class="row"><div><strong>'+esc(t.reason||t.type)+'</strong><small>'+new Date(t.at).toLocaleString("ko-KR")+'</small></div><b>'+(t.amount>0?"+":"")+money(t.amount)+'</b></div>'
    ).join("") : '<div class="empty">아직 거래가 없습니다.</div>';

    const certMap = {};
    data.certificates.forEach(c => certMap[c.id] = c.name);
    $("jobRows").innerHTML = data.jobs.length ? data.jobs.map(j => {
      const reqs = (j.requiredCertificateIds||[]).map(id => certMap[id] || "자격증");
      const hired = (j.assignedStudentIds||[]).length + "/" + j.capacity;
      let action = "";
      if (j.id === s.jobId) action = '<span class="badge">현재 직업</span>';
      else if (j.applicant) action = '<span class="badge">지원 완료</span>';
      else if (j.qualified) action = '<button class="btn primary" data-apply="'+j.id+'">지원</button>';
      else action = '<span class="badge">자격 필요</span>';
      return '<div class="row"><div><strong>'+esc(j.name)+' · 월급 '+money(j.salary)+'</strong><small>'+esc(j.task||"")+' · 채용 '+hired+'</small><div>'+reqs.map(x=>'<span class="badge">'+esc(x)+'</span>').join(" ")+'</div></div><div>'+action+'</div></div>';
    }).join("") : '<div class="empty">등록된 직업이 없습니다.</div>';

    $("storeRows").innerHTML = data.items.length ? data.items.map(i => {
      const tax = Math.round(Number(i.price||0) * Number(data.settings.consumptionTaxRate||0) / 100);
      const total = Number(i.price||0) + tax;
      const sold = i.stock != null && Number(i.stock) <= 0;
      return '<div class="row"><div><strong>'+esc(i.name)+' · '+money(total)+'</strong><small>가격 '+money(i.price)+' + 소비세 '+money(tax)+' · '+(i.stock==null?"재고 무제한":"재고 "+i.stock+"개")+'</small></div><button class="btn '+(sold?"soft":"green")+'" '+(sold?"disabled":'data-buy="'+i.id+'"')+'>'+(sold?"품절":"구매")+'</button></div>';
    }).join("") : '<div class="empty">상품이 없습니다.</div>';

    $("lawRows").innerHTML = data.laws.length ? data.laws.map(l =>
      '<div class="row"><div><strong>'+esc(l.title)+'</strong><small>'+esc(l.description)+' · 기본 과태료 '+money(l.defaultFine)+' · '+esc(l.effectiveFrom)+' 시행</small></div></div>'
    ).join("") : '<div class="empty">등록된 법이 없습니다.</div>';

    $("caseRows").innerHTML = data.cases.length ? data.cases.map(c => {
      const law = data.laws.find(x => x.id === c.lawId);
      const can = ["confirmed","upheld"].includes(c.status);
      return '<div class="row"><div><strong>'+esc(law?law.title:"처분")+' · '+caseStatus(c.status)+'</strong><small>'+esc(c.note||"")+' · 과태료 '+money(c.appliedFine||c.proposedFine)+(c.appealText?" · 이의: "+esc(c.appealText):"")+'</small></div>'+(can?'<button class="btn soft" data-appeal="'+c.id+'">이의 신청</button>':"")+'</div>';
    }).join("") : '<div class="empty">처분 기록이 없습니다.</div>';

    document.querySelectorAll("[data-apply]").forEach(btn => btn.onclick = () => applyJob(btn.dataset.apply));
    document.querySelectorAll("[data-buy]").forEach(btn => btn.onclick = () => buy(btn.dataset.buy));
    document.querySelectorAll("[data-appeal]").forEach(btn => btn.onclick = () => appeal(btn.dataset.appeal));
  }

  document.querySelectorAll(".tab").forEach(btn => btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === btn));
    document.querySelectorAll(".panel").forEach(x => x.classList.toggle("active", x.id === "panel-" + btn.dataset.tab));
  });
  $("loginBtn").onclick = login;
  $("logoutBtn").onclick = logout;
  $("depositBtn").onclick = () => saveMoney("deposit");
  $("withdrawBtn").onclick = () => saveMoney("withdraw");
  $("classCode").value = classCode;
  if (session) load(); else render();
})();