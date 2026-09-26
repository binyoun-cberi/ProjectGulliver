import { DurableObject } from "cloudflare:workers";

const MAX_STUDENTS = 50;
const SESSION_MS = 12 * 60 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[<>\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max || 80);
}

function cleanId(value) {
  return String(value == null ? "" : value).replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 80);
}

function number(value, min, max, fallback) {
  var n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback == null ? 0 : fallback;
  return Math.max(min == null ? 0 : min, Math.min(max == null ? Number.MAX_SAFE_INTEGER : max, n));
}

function token(bytes) {
  var data = new Uint8Array(bytes || 32);
  crypto.getRandomValues(data);
  return Array.from(data, function(n){ return n.toString(16).padStart(2, "0"); }).join("");
}

function code(length) {
  var data = new Uint8Array(length || 6);
  crypto.getRandomValues(data);
  return Array.from(data, function(n){ return ALPHABET[n % ALPHABET.length]; }).join("");
}

function pin() {
  var data = new Uint8Array(4);
  crypto.getRandomValues(data);
  var n = (((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]) >>> 0) % 900000;
  return String(100000 + n);
}

async function hash(value) {
  var digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), function(n){ return n.toString(16).padStart(2, "0"); }).join("");
}

function same(a, b) {
  a = String(a || "");
  b = String(b || "");
  var diff = a.length ^ b.length;
  var length = Math.max(a.length, b.length);
  for (var i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function bearer(request) {
  var auth = request.headers.get("authorization") || "";
  return auth.indexOf("Bearer ") === 0 ? auth.slice(7).trim() : "";
}

function settings(input) {
  input = input || {};
  return {
    currency: clean(input.currency, 12) || "뚝",
    openingBalance: number(input.openingBalance, 0, 100000, 100),
    incomeTaxRate: number(input.incomeTaxRate, 0, 100, 10),
    consumptionTaxRate: number(input.consumptionTaxRate, 0, 100, 10),
    savingsInterestRate: number(input.savingsInterestRate, 0, 20, 1),
    fineCapPercent: number(input.fineCapPercent, 0, 100, 30),
    paydayLabel: clean(input.paydayLabel, 20) || "금요일",
    storeRevenueToTreasury: input.storeRevenueToTreasury !== false
  };
}

function publicStudent(state, student) {
  var job = state.jobs.find(function(item){
    return Array.isArray(item.assignedStudentIds) && item.assignedStudentIds.indexOf(student.id) >= 0;
  });
  return {
    id: student.id,
    name: student.name,
    studentCode: student.studentCode,
    balance: Number(student.balance || 0),
    savings: Number(student.savings || 0),
    certificateIds: Array.isArray(student.certificateIds) ? student.certificateIds : [],
    jobId: job ? job.id : null
  };
}

function safeState(state) {
  return {
    version: state.version,
    code: state.code,
    className: state.className,
    settings: state.settings,
    treasury: state.treasury,
    students: state.students.map(function(student){ return publicStudent(state, student); }),
    certificates: state.certificates,
    jobs: state.jobs,
    items: state.items,
    laws: state.laws,
    cases: state.cases,
    payrollRuns: state.payrollRuns,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt
  };
}

function makeCors(response) {
  var headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: headers });
}

function stub(env, classCode) {
  return env.GULLIVER_ECONOMY.get(env.GULLIVER_ECONOMY.idFromName(classCode));
}

async function forward(request, env, classCode, action) {
  var target = new URL(request.url);
  target.hostname = "gulliver-economy.internal";
  target.pathname = "/" + action;
  return makeCors(await stub(env, classCode).fetch(new Request(target.toString(), request)));
}

async function createClass(request, env) {
  var body;
  try { body = await request.json(); } catch (_) { return json({ ok:false, error:"INVALID_JSON" }, 400); }
  var input = Array.isArray(body.students) ? body.students.slice(0, MAX_STUDENTS) : [];
  var normalized = input.map(function(item, index){
    return { id: cleanId(item && item.id) || String(index + 1), name: clean(item && item.name, 30) };
  }).filter(function(item){ return item.name; });
  if (!normalized.length) return json({ ok:false, error:"NEED_STUDENTS" }, 400);

  for (var attempt = 0; attempt < 12; attempt++) {
    var classCode = code(6);
    var teacherToken = token(24);
    var credentials = [];
    var prepared = [];
    for (var i = 0; i < normalized.length; i++) {
      var studentCode = String(i + 1).padStart(2, "0");
      var rawPin = pin();
      prepared.push({
        id: normalized[i].id,
        name: normalized[i].name,
        studentCode: studentCode,
        pinHash: await hash(classCode + ":" + studentCode + ":" + rawPin)
      });
      credentials.push({
        id: normalized[i].id,
        name: normalized[i].name,
        studentCode: studentCode,
        pin: rawPin
      });
    }

    var response = await stub(env, classCode).fetch("https://gulliver-economy.internal/init", {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify({
        code: classCode,
        className: clean(body.className, 50) || "우리 반",
        teacherToken: teacherToken,
        students: prepared,
        settings: settings(body.settings || {}),
        createdAt: Date.now()
      })
    });

    if (response.status === 201) {
      return json({
        ok:true,
        code:classCode,
        teacherToken:teacherToken,
        className:clean(body.className, 50) || "우리 반",
        studentCount:prepared.length,
        credentials:credentials
      }, 201);
    }
    if (response.status !== 409) return response;
  }
  return json({ ok:false, error:"CLASS_CODE_EXHAUSTED" }, 503);
}

export async function handleEconomyRequest(request, env) {
  var url = new URL(request.url);
  if (url.pathname === "/api/economy/classes") {
    if (request.method === "OPTIONS") return makeCors(new Response(null, { status:204 }));
    if (request.method !== "POST") return makeCors(json({ ok:false, error:"METHOD_NOT_ALLOWED" }, 405));
    return makeCors(await createClass(request, env));
  }

  var match = url.pathname.match(/^\/api\/economy\/([23456789A-HJ-NP-Z]{6})\/([a-z-]+)$/i);
  if (!match) return null;
  if (request.method === "OPTIONS") return makeCors(new Response(null, { status:204 }));
  var allowed = [
    "login","student-state","student-save","student-apply","student-appeal","student-buy",
    "teacher-state","teacher-settings","teacher-certificate","teacher-certificate-grant",
    "teacher-job","teacher-job-assign","teacher-payroll","teacher-manual","teacher-treasury",
    "teacher-item","teacher-law","teacher-case","teacher-case-decision","teacher-reset-pin","teacher-delete"
  ];
  var action = match[2].toLowerCase();
  if (allowed.indexOf(action) < 0) return makeCors(json({ ok:false, error:"NOT_FOUND" }, 404));
  return forward(request, env, match[1].toUpperCase(), action);
}

export class EconomyClass extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.state = null;
    this.ctx.blockConcurrencyWhile(async () => {
      this.state = (await this.ctx.storage.get("state")) || null;
    });
  }

  isTeacher(request) {
    return this.state && same(bearer(request), this.state.teacherToken);
  }

  async authStudent(request) {
    if (!this.state) return null;
    var raw = bearer(request);
    if (!/^[0-9a-f]{64}$/i.test(raw)) return null;
    var hashed = await hash(raw);
    var now = Date.now();
    return this.state.students.find(function(student){
      return student.sessionHash && Number(student.sessionExpiresAt || 0) > now && same(student.sessionHash, hashed);
    }) || null;
  }

  jobFor(studentId) {
    return this.state.jobs.find(function(job){
      return Array.isArray(job.assignedStudentIds) && job.assignedStudentIds.indexOf(studentId) >= 0;
    }) || null;
  }

  async transactions(limit, studentId) {
    var prefix = studentId ? "stx:" + studentId + ":" : "tx:";
    var list = await this.ctx.storage.list({
      prefix:prefix,
      reverse:true,
      limit:Math.min(500, Math.max(1, Number(limit || 80)))
    });
    return Array.from(list.values()).slice(0, Number(limit || 80));
  }

  async commit(items) {
    items = Array.isArray(items) ? items : [];
    this.state.updatedAt = Date.now();
    var puts = {};
    for (var i = 0; i < items.length; i++) {
      var seq = this.state.nextTx++;
      var key = "tx:" + String(seq).padStart(12, "0");
      var item = items[i] || {};
      var txValue = {
        id:String(seq),
        at:Date.now(),
        studentId:item.studentId || null,
        type:clean(item.type, 30) || "other",
        reason:clean(item.reason, 120),
        amount:Number(item.amount || 0),
        balance:item.balance == null ? null : Number(item.balance),
        savings:item.savings == null ? null : Number(item.savings),
        treasury:item.treasury == null ? null : Number(item.treasury),
        meta:item.meta && typeof item.meta === "object" ? item.meta : {}
      };
      puts[key] = txValue;
      if (item.studentId) puts["stx:" + item.studentId + ":" + String(seq).padStart(12, "0")] = txValue;
    }
    puts.state = this.state;
    await this.ctx.storage.put(puts);
  }

  fineAmount(student, requested) {
    var job = this.jobFor(student.id);
    var base = job ? Number(job.salary || 0) : Number(this.state.settings.openingBalance || 0);
    var cap = Math.floor(base * Number(this.state.settings.fineCapPercent || 0) / 100);
    var wanted = Math.max(0, Number(requested || 0));
    return Math.max(0, Math.min(wanted, cap, Number(student.balance || 0)));
  }

  async fetch(request) {
    var url = new URL(request.url);
    var action = url.pathname.replace(/^\/+/, "");

    if (action === "init" && request.method === "POST") {
      if (this.state) return json({ ok:false, error:"ECONOMY_EXISTS" }, 409);
      var init;
      try { init = await request.json(); } catch (_) { return json({ ok:false, error:"INVALID_JSON" }, 400); }
      var cfg = settings(init.settings || {});
      var students = Array.isArray(init.students) ? init.students.slice(0, MAX_STUDENTS) : [];
      if (!students.length) return json({ ok:false, error:"NEED_STUDENTS" }, 400);
      this.state = {
        version:2,
        code:clean(init.code, 12),
        className:clean(init.className, 50) || "우리 반",
        teacherToken:String(init.teacherToken || ""),
        settings:cfg,
        treasury:0,
        nextTx:1,
        students:students.map(function(student){
          return {
            id:cleanId(student.id),
            name:clean(student.name, 30),
            studentCode:clean(student.studentCode, 4),
            pinHash:String(student.pinHash || ""),
            failedAttempts:0,
            lockedUntil:0,
            sessionHash:null,
            sessionExpiresAt:0,
            balance:cfg.openingBalance,
            savings:0,
            certificateIds:[]
          };
        }),
        certificates:[],
        jobs:[],
        items:[],
        laws:[],
        cases:[],
        payrollRuns:[],
        createdAt:Number(init.createdAt || Date.now()),
        updatedAt:Date.now()
      };
      var opening = this.state.students.map(function(student){
        return { studentId:student.id, type:"opening", reason:"학급경제 시작금", amount:cfg.openingBalance, balance:student.balance };
      });
      await this.commit(opening);
      return json({ ok:true }, 201);
    }

    if (!this.state) return json({ ok:false, error:"CLASS_NOT_FOUND" }, 404);

    if (action === "login" && request.method === "POST") {
      var login;
      try { login = await request.json(); } catch (_) { return json({ ok:false, error:"INVALID_JSON" }, 400); }
      var studentCode = clean(login.studentCode, 4);
      var rawPin = String(login.pin || "");
      var student = this.state.students.find(function(item){ return item.studentCode === studentCode; });
      if (!student || !/^\d{6}$/.test(rawPin)) return json({ ok:false, error:"INVALID_CREDENTIALS" }, 401);
      var now = Date.now();
      if (Number(student.lockedUntil || 0) > now) {
        return json({ ok:false, error:"TEMPORARILY_LOCKED", retryAfterSec:Math.ceil((student.lockedUntil - now) / 1000) }, 429);
      }
      var expected = await hash(this.state.code + ":" + student.studentCode + ":" + rawPin);
      if (!same(expected, student.pinHash)) {
        student.failedAttempts = Number(student.failedAttempts || 0) + 1;
        if (student.failedAttempts >= MAX_FAILS) {
          student.failedAttempts = 0;
          student.lockedUntil = now + LOCK_MS;
        }
        await this.commit();
        return json({ ok:false, error:student.lockedUntil > now ? "TEMPORARILY_LOCKED" : "INVALID_CREDENTIALS" }, student.lockedUntil > now ? 429 : 401);
      }
      var session = token(32);
      student.failedAttempts = 0;
      student.lockedUntil = 0;
      student.sessionHash = await hash(session);
      student.sessionExpiresAt = now + SESSION_MS;
      await this.commit();
      return json({ ok:true, token:session, className:this.state.className, settings:this.state.settings, student:publicStudent(this.state, student) });
    }

    if (action.indexOf("student-") === 0) {
      var current = await this.authStudent(request);
      if (!current) return json({ ok:false, error:"UNAUTHORIZED" }, 401);

      if (action === "student-state" && request.method === "GET") {
        var tx = await this.transactions(24, current.id);
        var ownCases = this.state.cases.filter(function(item){ return item.studentId === current.id; }).slice(-20).reverse();
        return json({
          ok:true,
          className:this.state.className,
          settings:this.state.settings,
          student:publicStudent(this.state, current),
          certificates:this.state.certificates,
          jobs:this.state.jobs.map(function(job){
            var required = Array.isArray(job.requiredCertificateIds) ? job.requiredCertificateIds : [];
            return Object.assign({}, job, {
              applicant:Array.isArray(job.applicantIds) && job.applicantIds.indexOf(current.id) >= 0,
              qualified:required.every(function(id){ return current.certificateIds.indexOf(id) >= 0; })
            });
          }),
          items:this.state.items,
          laws:this.state.laws.filter(function(law){ return law.active !== false; }),
          cases:ownCases,
          transactions:tx
        });
      }

      var body = {};
      if (request.method === "POST") {
        try { body = await request.json(); } catch (_) { return json({ ok:false, error:"INVALID_JSON" }, 400); }
      }

      if (action === "student-save" && request.method === "POST") {
        var amount = number(body.amount, 1, 1000000, 0);
        var direction = body.direction === "withdraw" ? "withdraw" : "deposit";
        if (!amount) return json({ ok:false, error:"INVALID_AMOUNT" }, 400);
        var saveTx = [];
        if (direction === "deposit") {
          if (current.balance < amount) return json({ ok:false, error:"INSUFFICIENT_FUNDS" }, 409);
          current.balance -= amount;
          current.savings += amount;
          saveTx.push({ studentId:current.id, type:"savings", reason:"저축", amount:-amount, balance:current.balance, savings:current.savings });
        } else {
          if (current.savings < amount) return json({ ok:false, error:"INSUFFICIENT_SAVINGS" }, 409);
          current.savings -= amount;
          current.balance += amount;
          saveTx.push({ studentId:current.id, type:"savings", reason:"저축 인출", amount:amount, balance:current.balance, savings:current.savings });
        }
        await this.commit(saveTx);
        return json({ ok:true, student:publicStudent(this.state, current) });
      }

      if (action === "student-apply" && request.method === "POST") {
        var applyJob = this.state.jobs.find(function(item){ return item.id === cleanId(body.jobId); });
        if (!applyJob) return json({ ok:false, error:"JOB_NOT_FOUND" }, 404);
        var required = Array.isArray(applyJob.requiredCertificateIds) ? applyJob.requiredCertificateIds : [];
        if (!required.every(function(id){ return current.certificateIds.indexOf(id) >= 0; })) {
          return json({ ok:false, error:"CERTIFICATE_REQUIRED" }, 409);
        }
        applyJob.applicantIds = Array.isArray(applyJob.applicantIds) ? applyJob.applicantIds : [];
        if (applyJob.applicantIds.indexOf(current.id) < 0) applyJob.applicantIds.push(current.id);
        await this.commit();
        return json({ ok:true });
      }

      if (action === "student-appeal" && request.method === "POST") {
        var caseItem = this.state.cases.find(function(item){ return item.id === cleanId(body.caseId) && item.studentId === current.id; });
        if (!caseItem) return json({ ok:false, error:"CASE_NOT_FOUND" }, 404);
        if (["confirmed","upheld"].indexOf(caseItem.status) < 0) return json({ ok:false, error:"CASE_NOT_APPEALABLE" }, 409);
        caseItem.status = "appealed";
        caseItem.appealText = clean(body.text, 300);
        caseItem.appealedAt = Date.now();
        await this.commit();
        return json({ ok:true });
      }

      if (action === "student-buy" && request.method === "POST") {
        var shopItem = this.state.items.find(function(item){ return item.id === cleanId(body.itemId) && item.active !== false; });
        if (!shopItem) return json({ ok:false, error:"ITEM_NOT_FOUND" }, 404);
        if (shopItem.stock != null && Number(shopItem.stock) <= 0) return json({ ok:false, error:"OUT_OF_STOCK" }, 409);
        var salesTax = Math.round(Number(shopItem.price || 0) * Number(this.state.settings.consumptionTaxRate || 0) / 100);
        var total = Number(shopItem.price || 0) + salesTax;
        if (current.balance < total) return json({ ok:false, error:"INSUFFICIENT_FUNDS" }, 409);
        current.balance -= total;
        if (shopItem.stock != null) shopItem.stock = Math.max(0, Number(shopItem.stock) - 1);
        var buyTx = [{ studentId:current.id, type:"purchase", reason:shopItem.name + " 구매", amount:-total, balance:current.balance, meta:{ basePrice:shopItem.price, consumptionTax:salesTax } }];
        if (this.state.settings.storeRevenueToTreasury) {
          this.state.treasury += total;
          buyTx.push({ type:"treasury", reason:current.name + " 상점 구매 수입", amount:total, treasury:this.state.treasury });
        }
        await this.commit(buyTx);
        return json({ ok:true, total:total, tax:salesTax, student:publicStudent(this.state, current) });
      }

      return json({ ok:false, error:"METHOD_NOT_ALLOWED" }, 405);
    }

    if (action.indexOf("teacher-") === 0) {
      if (!this.isTeacher(request)) return json({ ok:false, error:"UNAUTHORIZED" }, 401);

      if (action === "teacher-state" && request.method === "GET") {
        return json({ ok:true, state:safeState(this.state), transactions:await this.transactions(80) });
      }

      var teacherBody = {};
      if (request.method === "POST") {
        try { teacherBody = await request.json(); } catch (_) { return json({ ok:false, error:"INVALID_JSON" }, 400); }
      }

      if (action === "teacher-settings") {
        this.state.settings = settings(Object.assign({}, this.state.settings, teacherBody.settings || {}));
        await this.commit();
        return json({ ok:true, settings:this.state.settings });
      }

      if (action === "teacher-certificate") {
        var certName = clean(teacherBody.name, 50);
        if (!certName) return json({ ok:false, error:"NAME_REQUIRED" }, 400);
        var cert = { id:crypto.randomUUID(), name:certName, description:clean(teacherBody.description, 180) };
        this.state.certificates.push(cert);
        await this.commit();
        return json({ ok:true, certificate:cert });
      }

      if (action === "teacher-certificate-grant") {
        var grantStudent = this.state.students.find(function(item){ return item.id === cleanId(teacherBody.studentId); });
        var grantCert = this.state.certificates.find(function(item){ return item.id === cleanId(teacherBody.certificateId); });
        if (!grantStudent || !grantCert) return json({ ok:false, error:"NOT_FOUND" }, 404);
        var grant = teacherBody.grant !== false;
        if (grant && grantStudent.certificateIds.indexOf(grantCert.id) < 0) grantStudent.certificateIds.push(grantCert.id);
        if (!grant) grantStudent.certificateIds = grantStudent.certificateIds.filter(function(id){ return id !== grantCert.id; });
        await this.commit();
        return json({ ok:true });
      }

      if (action === "teacher-job") {
        var jobName = clean(teacherBody.name, 50);
        if (!jobName) return json({ ok:false, error:"NAME_REQUIRED" }, 400);
        var requiredIds = Array.isArray(teacherBody.requiredCertificateIds) ? teacherBody.requiredCertificateIds.map(cleanId) : [];
        requiredIds = requiredIds.filter(function(id){ return this.state.certificates.some(function(certItem){ return certItem.id === id; }); }, this);
        var job = {
          id:crypto.randomUUID(),
          name:jobName,
          salary:number(teacherBody.salary, 0, 100000, 100),
          capacity:number(teacherBody.capacity, 1, 20, 1),
          task:clean(teacherBody.task, 200),
          requiredCertificateIds:requiredIds,
          applicantIds:[],
          assignedStudentIds:[]
        };
        this.state.jobs.push(job);
        await this.commit();
        return json({ ok:true, job:job });
      }

      if (action === "teacher-job-assign") {
        var assignStudent = this.state.students.find(function(item){ return item.id === cleanId(teacherBody.studentId); });
        var assignJob = this.state.jobs.find(function(item){ return item.id === cleanId(teacherBody.jobId); });
        if (!assignStudent || !assignJob) return json({ ok:false, error:"NOT_FOUND" }, 404);
        var requiredCerts = Array.isArray(assignJob.requiredCertificateIds) ? assignJob.requiredCertificateIds : [];
        if (!requiredCerts.every(function(id){ return assignStudent.certificateIds.indexOf(id) >= 0; })) return json({ ok:false, error:"CERTIFICATE_REQUIRED" }, 409);
        if (assignJob.assignedStudentIds.indexOf(assignStudent.id) < 0 && assignJob.assignedStudentIds.length >= assignJob.capacity) return json({ ok:false, error:"JOB_FULL" }, 409);
        this.state.jobs.forEach(function(item){ item.assignedStudentIds = (item.assignedStudentIds || []).filter(function(id){ return id !== assignStudent.id; }); });
        if (assignJob.assignedStudentIds.indexOf(assignStudent.id) < 0) assignJob.assignedStudentIds.push(assignStudent.id);
        assignJob.applicantIds = (assignJob.applicantIds || []).filter(function(id){ return id !== assignStudent.id; });
        await this.commit();
        return json({ ok:true });
      }

      if (action === "teacher-payroll") {
        var periodId = clean(teacherBody.periodId, 40);
        if (!periodId) return json({ ok:false, error:"PERIOD_REQUIRED" }, 400);
        if (this.state.payrollRuns.indexOf(periodId) >= 0) return json({ ok:false, error:"PAYROLL_ALREADY_RUN" }, 409);
        var incomeRate = Number(this.state.settings.incomeTaxRate || 0);
        var interestRate = Number(this.state.settings.savingsInterestRate || 0);
        var payrollTx = [];
        var grossTotal = 0, taxTotal = 0, interestTotal = 0, paidStudents = 0;
        for (var p = 0; p < this.state.students.length; p++) {
          var payStudent = this.state.students[p];
          var payJob = this.jobFor(payStudent.id);
          if (payJob) {
            var gross = Number(payJob.salary || 0);
            var incomeTax = Math.round(gross * incomeRate / 100);
            payStudent.balance += gross;
            payrollTx.push({ studentId:payStudent.id, type:"salary", reason:payJob.name + " 월급 · " + periodId, amount:gross, balance:payStudent.balance });
            payStudent.balance -= incomeTax;
            this.state.treasury += incomeTax;
            if (incomeTax) {
              payrollTx.push({ studentId:payStudent.id, type:"tax", reason:"소득세 " + incomeRate + "% · " + periodId, amount:-incomeTax, balance:payStudent.balance });
              payrollTx.push({ type:"treasury", reason:payStudent.name + " 소득세", amount:incomeTax, treasury:this.state.treasury });
            }
            grossTotal += gross;
            taxTotal += incomeTax;
            paidStudents++;
          }
          if (payStudent.savings > 0 && interestRate > 0) {
            var interest = Math.floor(payStudent.savings * interestRate / 100);
            if (interest > 0) {
              payStudent.savings += interest;
              interestTotal += interest;
              payrollTx.push({ studentId:payStudent.id, type:"interest", reason:"저축이자 " + interestRate + "% · " + periodId, amount:interest, savings:payStudent.savings });
            }
          }
        }
        this.state.payrollRuns.push(periodId);
        this.state.payrollRuns = this.state.payrollRuns.slice(-100);
        await this.commit(payrollTx);
        return json({ ok:true, summary:{ periodId:periodId, paidStudents:paidStudents, grossTotal:grossTotal, taxTotal:taxTotal, interestTotal:interestTotal, treasury:this.state.treasury } });
      }

      if (action === "teacher-manual") {
        var manualStudent = this.state.students.find(function(item){ return item.id === cleanId(teacherBody.studentId); });
        if (!manualStudent) return json({ ok:false, error:"STUDENT_NOT_FOUND" }, 404);
        var manualAmount = Math.trunc(Number(teacherBody.amount || 0));
        if (!manualAmount) return json({ ok:false, error:"INVALID_AMOUNT" }, 400);
        if (manualStudent.balance + manualAmount < 0) return json({ ok:false, error:"INSUFFICIENT_FUNDS" }, 409);
        manualStudent.balance += manualAmount;
        var toTreasury = manualAmount < 0 && teacherBody.toTreasury === true;
        var manualTx = [{ studentId:manualStudent.id, type:"manual", reason:clean(teacherBody.reason, 120) || "교사 거래", amount:manualAmount, balance:manualStudent.balance }];
        if (toTreasury) {
          this.state.treasury += Math.abs(manualAmount);
          manualTx.push({ type:"treasury", reason:manualStudent.name + " · " + (clean(teacherBody.reason, 80) || "징수"), amount:Math.abs(manualAmount), treasury:this.state.treasury });
        }
        await this.commit(manualTx);
        return json({ ok:true });
      }

      if (action === "teacher-treasury") {
        var treasuryAmount = number(teacherBody.amount, 1, 1000000, 0);
        if (!treasuryAmount) return json({ ok:false, error:"INVALID_AMOUNT" }, 400);
        if (this.state.treasury < treasuryAmount) return json({ ok:false, error:"INSUFFICIENT_TREASURY" }, 409);
        this.state.treasury -= treasuryAmount;
        await this.commit([{ type:"treasury", reason:clean(teacherBody.reason, 120) || "공공지출", amount:-treasuryAmount, treasury:this.state.treasury }]);
        return json({ ok:true, treasury:this.state.treasury });
      }

      if (action === "teacher-item") {
        var itemName = clean(teacherBody.name, 60);
        if (!itemName) return json({ ok:false, error:"NAME_REQUIRED" }, 400);
        var storeItem = {
          id:crypto.randomUUID(),
          name:itemName,
          price:number(teacherBody.price, 1, 100000, 10),
          stock:teacherBody.unlimited === true ? null : number(teacherBody.stock, 0, 10000, 0),
          active:true
        };
        this.state.items.push(storeItem);
        await this.commit();
        return json({ ok:true, item:storeItem });
      }

      if (action === "teacher-law") {
        var lawTitle = clean(teacherBody.title, 80);
        if (!lawTitle) return json({ ok:false, error:"TITLE_REQUIRED" }, 400);
        var law = {
          id:crypto.randomUUID(),
          title:lawTitle,
          description:clean(teacherBody.description, 240),
          defaultFine:number(teacherBody.defaultFine, 0, 100000, 10),
          effectiveFrom:clean(teacherBody.effectiveFrom, 30) || new Date().toISOString().slice(0, 10),
          active:teacherBody.active !== false
        };
        this.state.laws.push(law);
        await this.commit();
        return json({ ok:true, law:law });
      }

      if (action === "teacher-case") {
        var caseStudent = this.state.students.find(function(item){ return item.id === cleanId(teacherBody.studentId); });
        var caseLaw = this.state.laws.find(function(item){ return item.id === cleanId(teacherBody.lawId); });
        if (!caseStudent || !caseLaw) return json({ ok:false, error:"NOT_FOUND" }, 404);
        var occurredAt = clean(teacherBody.occurredAt, 30) || new Date().toISOString().slice(0, 10);
        if (caseLaw.effectiveFrom && occurredAt < caseLaw.effectiveFrom) return json({ ok:false, error:"LAW_NOT_IN_EFFECT" }, 409);
        var caseRecord = {
          id:crypto.randomUUID(),
          studentId:caseStudent.id,
          lawId:caseLaw.id,
          proposedFine:number(teacherBody.fine, 0, 100000, caseLaw.defaultFine),
          appliedFine:0,
          note:clean(teacherBody.note, 240),
          occurredAt:occurredAt,
          status:"pending",
          createdAt:Date.now(),
          decidedAt:null,
          appealText:""
        };
        this.state.cases.push(caseRecord);
        await this.commit();
        return json({ ok:true, case:caseRecord });
      }

      if (action === "teacher-reset-pin") {
        var resetStudent = this.state.students.find(function(item){ return item.id === cleanId(teacherBody.studentId); });
        if (!resetStudent) return json({ ok:false, error:"STUDENT_NOT_FOUND" }, 404);
        var freshPin = pin();
        resetStudent.pinHash = await hash(this.state.code + ":" + resetStudent.studentCode + ":" + freshPin);
        resetStudent.failedAttempts = 0;
        resetStudent.lockedUntil = 0;
        resetStudent.sessionHash = null;
        resetStudent.sessionExpiresAt = 0;
        await this.commit();
        return json({ ok:true, studentId:resetStudent.id, studentCode:resetStudent.studentCode, pin:freshPin });
      }

      if (action === "teacher-delete") {
        if (clean(teacherBody.confirmName, 50) !== this.state.className) return json({ ok:false, error:"CONFIRMATION_MISMATCH" }, 400);
        await this.ctx.storage.deleteAll();
        this.state = null;
        return json({ ok:true });
      }

      if (action === "teacher-case-decision") {
        var decisionCase = this.state.cases.find(function(item){ return item.id === cleanId(teacherBody.caseId); });
        if (!decisionCase) return json({ ok:false, error:"CASE_NOT_FOUND" }, 404);
        var decisionStudent = this.state.students.find(function(item){ return item.id === decisionCase.studentId; });
        if (!decisionStudent) return json({ ok:false, error:"STUDENT_NOT_FOUND" }, 404);
        var decision = clean(teacherBody.decision, 20);
        var caseTx = [];
        if (decision === "confirm" && decisionCase.status === "pending") {
          var fine = this.fineAmount(decisionStudent, decisionCase.proposedFine);
          decisionStudent.balance -= fine;
          this.state.treasury += fine;
          decisionCase.appliedFine = fine;
          decisionCase.status = "confirmed";
          decisionCase.decidedAt = Date.now();
          if (fine > 0) {
            caseTx.push({ studentId:decisionStudent.id, type:"fine", reason:"과태료 처분", amount:-fine, balance:decisionStudent.balance, meta:{ caseId:decisionCase.id, lawId:decisionCase.lawId } });
            caseTx.push({ type:"treasury", reason:decisionStudent.name + " 과태료", amount:fine, treasury:this.state.treasury, meta:{ caseId:decisionCase.id } });
          }
        } else if (decision === "cancel" && decisionCase.status === "pending") {
          decisionCase.status = "cancelled";
          decisionCase.decidedAt = Date.now();
        } else if (decision === "uphold" && decisionCase.status === "appealed") {
          decisionCase.status = "upheld";
          decisionCase.decidedAt = Date.now();
        } else if (decision === "reverse" && ["confirmed","appealed","upheld"].indexOf(decisionCase.status) >= 0) {
          var refund = Number(decisionCase.appliedFine || 0);
          decisionStudent.balance += refund;
          this.state.treasury -= refund;
          decisionCase.status = "reversed";
          decisionCase.decidedAt = Date.now();
          if (refund > 0) {
            caseTx.push({ studentId:decisionStudent.id, type:"fine-refund", reason:"과태료 처분 취소 환급", amount:refund, balance:decisionStudent.balance, meta:{ caseId:decisionCase.id } });
            caseTx.push({ type:"treasury", reason:decisionStudent.name + " 과태료 환급", amount:-refund, treasury:this.state.treasury, meta:{ caseId:decisionCase.id } });
          }
        } else {
          return json({ ok:false, error:"INVALID_CASE_TRANSITION" }, 409);
        }
        await this.commit(caseTx);
        return json({ ok:true, case:decisionCase });
      }

      return json({ ok:false, error:"METHOD_NOT_ALLOWED" }, 405);
    }

    return json({ ok:false, error:"NOT_FOUND" }, 404);
  }
}
