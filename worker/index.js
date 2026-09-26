import { DurableObject } from "cloudflare:workers";

const ROOM_TTL_MS = 48 * 60 * 60 * 1000;
const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROOM_CODE_LENGTH = 6;
const MAX_STUDENTS = 60;
const MAX_OPTIONS = 8;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function cleanText(value, max = 80) {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeOptions(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const result = [];
  for (const item of input.slice(0, MAX_OPTIONS)) {
    const name = cleanText(item?.name, 50);
    if (!name) continue;
    const id = String(item?.id ?? crypto.randomUUID());
    if (seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      name,
      colorId: Number.isFinite(Number(item?.colorId)) ? Number(item.colorId) : 1
    });
  }
  return result;
}

function normalizeStudents(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, MAX_STUDENTS)
    .map((item, index) => ({
      id: String(item?.id ?? index),
      name: cleanText(typeof item === "string" ? item : item?.name, 30)
    }))
    .filter((student) => student.name);
}

function makeRoomCode() {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => ROOM_CODE_ALPHABET[n % ROOM_CODE_ALPHABET.length]).join("");
}

function makeTeacherToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}

function roomStub(env, code) {
  const id = env.GULLIVER_ROOM.idFromName(code);
  return env.GULLIVER_ROOM.get(id);
}

async function forwardRoomRequest(request, env, code, endpoint) {
  const stub = roomStub(env, code);
  const url = new URL(request.url);
  url.hostname = "gulliver-room.internal";
  url.pathname = endpoint;
  const response = await stub.fetch(new Request(url.toString(), request));
  if (response.status === 101) return response;
  return withCors(response);
}

async function createRoom(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400, corsHeaders());
  }

  const title = cleanText(body?.title, 100) || "우리 반 투표";
  const options = normalizeOptions(body?.options);
  const students = normalizeStudents(body?.students);

  if (options.length < 2) return json({ error: "NEED_AT_LEAST_TWO_OPTIONS" }, 400, corsHeaders());
  if (!students.length) return json({ error: "NEED_STUDENTS" }, 400, corsHeaders());

  const teacherToken = makeTeacherToken();

  for (let attempt = 0; attempt < 12; attempt++) {
    const code = makeRoomCode();
    const expiresAt = Date.now() + ROOM_TTL_MS;
    const stub = roomStub(env, code);
    const response = await stub.fetch("https://gulliver-room.internal/init", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        title,
        options,
        students,
        teacherToken,
        createdAt: Date.now(),
        expiresAt
      })
    });

    if (response.status === 201) {
      return json({ ok: true, code, teacherToken, expiresAt }, 201, corsHeaders());
    }

    if (response.status !== 409) return withCors(response);
  }

  return json({ error: "ROOM_CODE_EXHAUSTED" }, 503, corsHeaders());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: "gulliver-api",
        version: 1,
        durableObjects: true,
        status: "ready"
      }, 200, corsHeaders());
    }

    if (request.method === "POST" && url.pathname === "/api/rooms") {
      return createRoom(request, env);
    }

    const match = url.pathname.match(/^\/api\/rooms\/([23456789A-HJ-NP-Z]{6})(?:\/(state|vote|reset|close|reopen|ws))?$/i);
    if (!match) return json({ error: "NOT_FOUND" }, 404, corsHeaders());

    const code = match[1].toUpperCase();
    const action = match[2] || "state";

    if (action === "state" && request.method === "GET") return forwardRoomRequest(request, env, code, "/state");
    if (action === "vote" && request.method === "POST") return forwardRoomRequest(request, env, code, "/vote");
    if (action === "reset" && request.method === "POST") return forwardRoomRequest(request, env, code, "/reset");
    if (action === "close" && request.method === "POST") return forwardRoomRequest(request, env, code, "/close");
    if (action === "reopen" && request.method === "POST") return forwardRoomRequest(request, env, code, "/reopen");
    if (action === "ws" && request.method === "GET") return forwardRoomRequest(request, env, code, "/ws");

    return json({ error: "METHOD_NOT_ALLOWED" }, 405, corsHeaders());
  }
};

export class GulliverRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.room = null;
    this.ctx.blockConcurrencyWhile(async () => {
      this.room = (await this.ctx.storage.get("room")) || null;
    });
  }

  isExpired() {
    return !this.room || Date.now() >= Number(this.room.expiresAt || 0);
  }

  ensureLive() {
    if (!this.room) return json({ error: "ROOM_NOT_FOUND" }, 404);
    if (this.isExpired()) return json({ error: "ROOM_EXPIRED" }, 410);
    return null;
  }

  isTeacher(request) {
    const auth = request.headers.get("authorization") || "";
    return auth === `Bearer ${this.room?.teacherToken || ""}`;
  }

  publicState() {
    const counts = {};
    for (const option of this.room.options) counts[option.id] = 0;
    for (const optionId of Object.values(this.room.votes || {})) {
      if (counts[optionId] !== undefined) counts[optionId]++;
    }

    return {
      type: "state",
      code: this.room.code,
      title: this.room.title,
      options: this.room.options,
      students: this.room.students,
      counts,
      votedCount: Object.keys(this.room.votes || {}).length,
      closed: Boolean(this.room.closed),
      expiresAt: this.room.expiresAt
    };
  }

  teacherState() {
    return { ...this.publicState(), votes: this.room.votes || {} };
  }

  async persistAndBroadcast() {
    await this.ctx.storage.put("room", this.room);
    this.broadcast();
  }

  broadcast() {
    for (const socket of this.ctx.getWebSockets()) {
      try {
        const attachment = socket.deserializeAttachment?.() || {};
        socket.send(JSON.stringify(attachment.role === "teacher" ? this.teacherState() : this.publicState()));
      } catch {
        try { socket.close(1011, "state update failed"); } catch {}
      }
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      if (this.room && !this.isExpired()) return json({ error: "ROOM_ALREADY_EXISTS" }, 409);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "INVALID_JSON" }, 400);
      }

      this.room = {
        version: 1,
        code: body.code,
        title: body.title,
        options: body.options,
        students: body.students,
        teacherToken: body.teacherToken,
        votes: {},
        closed: false,
        createdAt: body.createdAt,
        expiresAt: body.expiresAt
      };

      await this.ctx.storage.put("room", this.room);
      await this.ctx.storage.setAlarm(this.room.expiresAt);
      return json({ ok: true }, 201);
    }

    const liveError = this.ensureLive();
    if (liveError) return liveError;

    if (url.pathname === "/state" && request.method === "GET") {
      return json(this.isTeacher(request) ? this.teacherState() : this.publicState());
    }

    if (url.pathname === "/vote" && request.method === "POST") {
      if (this.room.closed) return json({ error: "ROOM_CLOSED" }, 409);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "INVALID_JSON" }, 400);
      }

      const studentId = String(body?.studentId ?? "");
      const student = this.room.students.find((s) => s.id === studentId);
      if (!student) return json({ error: "UNKNOWN_STUDENT" }, 400);

      const option = this.room.options.find((o) => String(o.id) === String(body?.optionId ?? ""));
      if (!option) return json({ error: "UNKNOWN_OPTION" }, 400);

      this.room.votes[student.id] = option.id;
      await this.persistAndBroadcast();

      return json({ ok: true, studentId: student.id, optionId: option.id, votedCount: Object.keys(this.room.votes).length });
    }

    if (url.pathname === "/reset" && request.method === "POST") {
      if (!this.isTeacher(request)) return json({ error: "UNAUTHORIZED" }, 401);
      this.room.votes = {};
      await this.persistAndBroadcast();
      return json({ ok: true });
    }

    if (url.pathname === "/close" && request.method === "POST") {
      if (!this.isTeacher(request)) return json({ error: "UNAUTHORIZED" }, 401);
      this.room.closed = true;
      await this.persistAndBroadcast();
      return json({ ok: true });
    }

    if (url.pathname === "/reopen" && request.method === "POST") {
      if (!this.isTeacher(request)) return json({ error: "UNAUTHORIZED" }, 401);
      this.room.closed = false;
      await this.persistAndBroadcast();
      return json({ ok: true });
    }

    if (url.pathname === "/ws" && request.method === "GET") {
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") {
        return json({ error: "WEBSOCKET_REQUIRED" }, 426);
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ role: "viewer" });
      server.send(JSON.stringify(this.publicState()));

      return new Response(null, { status: 101, webSocket: client });
    }

    return json({ error: "NOT_FOUND" }, 404);
  }

  async webSocketMessage(socket, message) {
    let data;
    try {
      data = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }

    if (data?.type === "auth" && data?.teacherToken === this.room?.teacherToken) {
      socket.serializeAttachment({ role: "teacher" });
      socket.send(JSON.stringify(this.teacherState()));
      return;
    }

    if (data?.type === "ping") {
      socket.send(JSON.stringify({ type: "pong", at: Date.now() }));
    }
  }

  webSocketClose() {}

  async alarm() {
    this.room = null;
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(JSON.stringify({ type: "expired" }));
        socket.close(1000, "room expired");
      } catch {}
    }
    await this.ctx.storage.deleteAll();
  }
}
