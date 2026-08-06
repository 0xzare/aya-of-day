/**
 * آیهٔ روز | Aya of the Day — v2
 * ---------------------------------------------------------------
 * ارسال روزانهٔ یک آیهٔ منتخب از قرآن کریم با ترجمهٔ آیت‌الله قرائتی
 * به تلگرام، بله، ایتا، روبیکا و X (توییتر).
 *
 *   scheduled()  → Cron Trigger هر ۵ دقیقه؛ ارسال در ساعت تنظیم‌شده (وقت تهران)
 *   fetch()      → داشبورد مدیریتی و API
 *
 * © Ali Zare Shahi — GPL-3.0
 */

/* ══════════════════  ۱) ثابت‌ها  ══════════════════ */

const VERSION = "2.0.0";
const SESSION_COOKIE = "aod_session";
const SESSION_TTL = 60 * 60 * 12; // ۱۲ ساعت
const QURAN_API = "https://api.alquran.cloud/v1";
const TOTAL_AYAT = 6236;
const MASK = "\u2022\u2022\u2022\u2022";

/** تعداد آیات هر سوره (۱..۱۱۴) */
const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** فهرست آیات منتخب — حالت پیش‌فرض */
const CURATED_REFS = (
  "1:1 1:2 1:5 1:6 2:2 2:45 2:110 2:152 2:153 2:155 2:156 2:157 2:177 2:186 " +
  "2:195 2:216 2:255 2:256 2:261 2:263 2:267 2:277 2:286 3:8 3:26 3:31 3:92 " +
  "3:103 3:110 3:133 3:134 3:139 3:159 3:173 3:185 3:190 3:200 4:58 4:59 " +
  "4:86 4:135 5:2 5:8 5:32 5:35 6:59 6:162 7:26 7:31 7:56 7:96 7:180 7:199 " +
  "7:204 8:2 8:24 8:29 8:46 8:53 9:105 9:119 9:128 10:57 10:62 11:88 11:112 " +
  "11:114 12:87 13:11 13:28 14:7 14:34 15:9 16:90 16:97 16:125 16:128 17:9 " +
  "17:23 17:24 17:32 17:36 17:37 17:70 17:82 17:110 18:23 18:28 18:46 " +
  "18:110 19:96 20:14 20:25 20:114 20:124 21:107 22:32 22:46 22:78 23:1 " +
  "23:2 23:8 23:96 23:118 24:22 24:35 24:55 25:63 25:74 26:83 26:88 26:89 " +
  "28:77 28:83 29:2 29:45 29:69 30:21 30:30 30:41 31:17 31:18 31:22 33:21 " +
  "33:35 33:41 33:70 33:71 35:5 35:10 35:28 36:82 39:9 39:10 39:53 40:60 " +
  "41:30 41:33 41:34 42:23 42:38 42:40 43:32 45:13 47:7 47:19 48:29 49:6 " +
  "49:10 49:11 49:12 49:13 50:16 51:56 53:39 55:13 55:60 57:4 57:20 58:11 " +
  "59:18 59:19 59:21 59:22 59:23 59:24 61:2 61:3 61:10 61:11 62:9 62:10 " +
  "63:9 64:11 64:16 65:2 65:3 66:6 67:2 68:4 70:19 70:22 73:20 76:8 76:9 " +
  "89:27 89:28 89:29 89:30 90:12 90:13 90:17 91:9 91:10 92:5 92:6 92:7 " +
  "93:9 93:10 93:11 94:5 94:6 95:4 96:1 96:2 96:3 96:4 96:5 99:7 99:8 " +
  "102:1 103:1 103:2 103:3 107:4 107:5 107:6 107:7 109:6 112:1 112:2 " +
  "112:3 112:4"
).split(" ").filter(Boolean);

/** تعریف کانال‌ها — داشبورد فرم‌ها را از روی همین می‌سازد */
const CHANNEL_DEFS = {
  telegram: {
    label: "تلگرام",
    icon: "\u2708\uFE0F",
    hint: "توکن از @BotFather. ربات باید ادمین کانال باشد.",
    fields: [
      { key: "bot_token", label: "توکن ربات", secret: true, required: true },
      { key: "chat_id", label: "شناسهٔ کانال", required: true, placeholder: "@mychannel یا -100..." },
      { key: "base_url", label: "آدرس API (اختیاری)", placeholder: "https://api.telegram.org" },
    ],
  },
  bale: {
    label: "بله",
    icon: "\uD83D\uDCAC",
    hint: "بازوی بله را از @botfather در ble.ir بسازید.",
    fields: [
      { key: "bot_token", label: "توکن بازو", secret: true, required: true },
      { key: "chat_id", label: "شناسهٔ کانال", required: true, placeholder: "@mychannel یا شناسهٔ عددی" },
      { key: "base_url", label: "آدرس API (اختیاری)", placeholder: "https://tapi.bale.ai" },
    ],
  },
  eitaa: {
    label: "ایتا",
    icon: "\uD83D\uDFE0",
    hint: "از سرویس ایتایار (eitaayar.ir) توکن بگیرید.",
    fields: [
      { key: "token", label: "توکن ایتایار", secret: true, required: true },
      { key: "chat_id", label: "شناسهٔ کانال", required: true, placeholder: "mychannel (بدون @)" },
      { key: "title", label: "عنوان پیام (اختیاری)" },
      { key: "base_url", label: "آدرس API (اختیاری)", placeholder: "https://eitaayar.ir/api" },
    ],
  },
  rubika: {
    label: "روبیکا",
    icon: "\uD83D\uDFE3",
    hint: "ربات را با BotFather روبیکا بسازید (rubika.ir/botapi).",
    fields: [
      { key: "bot_token", label: "توکن ربات", secret: true, required: true },
      { key: "chat_id", label: "شناسهٔ چت/کانال", required: true },
      { key: "base_url", label: "آدرس API (اختیاری)", placeholder: "https://botapi.rubika.ir/v3" },
    ],
  },
  twitter: {
    label: "توییتر (X)",
    icon: "\uD835\uDD4F",
    hint: "در developer.x.com دسترسی App را Read and Write کنید، سپس Access Token بسازید.",
    fields: [
      { key: "api_key", label: "API Key", secret: true, required: true },
      { key: "api_secret", label: "API Secret", secret: true, required: true },
      { key: "access_token", label: "Access Token", secret: true, required: true },
      { key: "access_secret", label: "Access Token Secret", secret: true, required: true },
    ],
  },
};

const CHANNEL_IDS = Object.keys(CHANNEL_DEFS);

const DEFAULT_SETTINGS = {
  enabled: "1",
  send_time: "20:00",
  tz_offset: "210",           // Asia/Tehran = UTC+03:30 (بدون DST)
  window_minutes: "30",
  selection_mode: "curated",  // curated | random | sequential | custom
  sequential_cursor: "1",
  custom_list: "",
  arabic_edition: "quran-uthmani",
  translation_edition: "fa.gharaati",
  translation_label: "آیت‌الله قرائتی",
  include_arabic: "1",
  include_translation: "1",
  include_link: "1",
  hashtags: "#قرآن #آیه_روز",
  footer: "",
  admin_password_hash: "",
};

const PUBLIC_SETTING_KEYS = Object.keys(DEFAULT_SETTINGS).filter(
  (k) => k !== "admin_password_hash"
);

/* ════════════════  ۲) کمک‌ابزارهای پایه  ════════════════ */

const ENC = new TextEncoder();
const DEC = new TextDecoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function b64(bytes) {
  const a = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}
function unb64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64u(bytes) {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64u(str) {
  return unb64(str.replace(/-/g, "+").replace(/_/g, "/"));
}
function eqStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ── رمزنگاری ── */

async function hmacBytes(secret, msg, hash = "SHA-256") {
  const key = await crypto.subtle.importKey(
    "raw", ENC.encode(secret), { name: "HMAC", hash }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ENC.encode(msg)));
}

async function pbkdf2(password, saltB64, iterations) {
  const key = await crypto.subtle.importKey(
    "raw", ENC.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: unb64(saltB64), iterations, hash: "SHA-256" }, key, 256
  );
  return b64(bits);
}
async function hashPassword(password) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  return "pbkdf2$100000$" + salt + "$" + (await pbkdf2(password, salt, 100000));
}
async function verifyPassword(password, stored) {
  if (!stored || stored.indexOf("pbkdf2$") !== 0) return false;
  const parts = stored.split("$");
  const test = await pbkdf2(password, parts[2], Number(parts[1]) || 100000);
  return eqStr(test, parts[3]);
}

async function aesKey(env) {
  const material = env.ENCRYPTION_KEY || env.SESSION_SECRET || "aya-of-day-dev-key";
  const digest = await crypto.subtle.digest("SHA-256", ENC.encode(material));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptJSON(env, obj) {
  const key = await aesKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENC.encode(JSON.stringify(obj)));
  return "v1." + b64u(iv) + "." + b64u(new Uint8Array(ct));
}
async function decryptJSON(env, blob) {
  if (!blob) return {};
  if (blob.indexOf("v1.") !== 0) {
    try { return JSON.parse(blob); } catch (e) { return {}; }
  }
  try {
    const p = blob.split(".");
    const key = await aesKey(env);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(p[1]) }, key, unb64u(p[2]));
    return JSON.parse(DEC.decode(pt));
  } catch (e) {
    return {};
  }
}

/* ── نشست ── */

async function makeSession(env) {
  const payload = b64u(ENC.encode(JSON.stringify({
    v: 1, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  })));
  const sig = b64u(await hmacBytes(env.SESSION_SECRET || "dev-secret", payload));
  return payload + "." + sig;
}
async function readSession(env, token) {
  if (!token || token.indexOf(".") < 0) return null;
  const [payload, sig] = token.split(".");
  const expect = b64u(await hmacBytes(env.SESSION_SECRET || "dev-secret", payload));
  if (!eqStr(sig, expect)) return null;
  try {
    const data = JSON.parse(DEC.decode(unb64u(payload)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch (e) {
    return null;
  }
}
function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}
function sessionCookie(value, maxAge) {
  return SESSION_COOKIE + "=" + encodeURIComponent(value) +
    "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + maxAge;
}

/* ── تاریخ و زمان ── */

function pad2(n) { return String(n).padStart(2, "0"); }

function localNow(offsetMin, at) {
  const off = Number(offsetMin) || 210;
  const d = new Date((at || Date.now()) + off * 60000);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const hh = d.getUTCHours(), mm = d.getUTCMinutes();
  return {
    y, m, d: day, hh, mm,
    minutes: hh * 60 + mm,
    dayKey: y + "-" + pad2(m) + "-" + pad2(day),
    clock: pad2(hh) + ":" + pad2(mm),
  };
}

/** میلادی ← شمسی (الگوریتم jalaali-js) */
function toJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

function faNum(x) {
  return String(x).replace(/[0-9]/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[Number(d)]);
}
function jalaliLabel(t) {
  const j = toJalali(t.y, t.m, t.d);
  return faNum(j[2]) + " " + JALALI_MONTHS[j[1] - 1] + " " + faNum(j[0]);
}

/* ════════════════  ۳) لایهٔ دیتا (D1)  ════════════════ */

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS channels (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, config TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS daily_locks (day_key TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE TABLE IF NOT EXISTS sends (id INTEGER PRIMARY KEY AUTOINCREMENT, day_key TEXT NOT NULL, ref TEXT NOT NULL, surah INTEGER NOT NULL, ayah INTEGER NOT NULL, surah_name TEXT, arabic TEXT, translation TEXT, message TEXT, trigger TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_sends_created ON sends (created_at DESC)",
  "CREATE TABLE IF NOT EXISTS deliveries (id INTEGER PRIMARY KEY AUTOINCREMENT, send_id INTEGER NOT NULL, channel TEXT NOT NULL, ok INTEGER NOT NULL, detail TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_deliveries_send ON deliveries (send_id)",
  "CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, level TEXT NOT NULL, message TEXT NOT NULL, meta TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
  "CREATE INDEX IF NOT EXISTS idx_logs_created ON logs (created_at DESC)",
];

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  schemaReady = true;
}

async function getSettings(env) {
  const rows = (await env.DB.prepare("SELECT key, value FROM settings").all()).results || [];
  const s = Object.assign({}, DEFAULT_SETTINGS);
  for (const r of rows) s[r.key] = r.value;
  return s;
}
async function setSetting(env, key, value) {
  await env.DB.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).bind(key, String(value == null ? "" : value)).run();
}

async function getChannels(env) {
  const rows = (await env.DB.prepare("SELECT id, enabled, config FROM channels").all()).results || [];
  const map = {};
  for (const id of CHANNEL_IDS) map[id] = { id, enabled: false, config: {} };
  for (const r of rows) {
    if (!map[r.id]) continue;
    map[r.id].enabled = Number(r.enabled) === 1;
    map[r.id].config = await decryptJSON(env, r.config);
  }
  return map;
}
async function saveChannel(env, id, enabled, config) {
  const blob = await encryptJSON(env, config);
  await env.DB.prepare(
    "INSERT INTO channels (id, enabled, config, updated_at) VALUES (?, ?, ?, datetime('now')) " +
    "ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled, config = excluded.config, updated_at = excluded.updated_at"
  ).bind(id, enabled ? 1 : 0, blob).run();
}

async function log(env, level, message, meta) {
  try {
    await env.DB.prepare("INSERT INTO logs (level, message, meta) VALUES (?, ?, ?)")
      .bind(level, String(message).slice(0, 500), meta ? JSON.stringify(meta).slice(0, 2000) : null)
      .run();
  } catch (e) { /* لاگ نباید مسیر اصلی را بشکند */ }
}

/* ════════════════  ۴) انتخاب و دریافت آیه  ════════════════ */

function validRef(ref) {
  const p = String(ref).split(":");
  const s = Number(p[0]), a = Number(p[1]);
  return Number.isInteger(s) && Number.isInteger(a) && s >= 1 && s <= 114 && a >= 1 && a <= AYAH_COUNTS[s - 1];
}
function numberToRef(n) {
  let rem = ((Number(n) - 1) % TOTAL_AYAT + TOTAL_AYAT) % TOTAL_AYAT + 1;
  for (let s = 0; s < 114; s++) {
    if (rem <= AYAH_COUNTS[s]) return (s + 1) + ":" + rem;
    rem -= AYAH_COUNTS[s];
  }
  return "1:1";
}
function dayIndex(dayKey) {
  return Math.floor(Date.parse(dayKey + "T00:00:00Z") / 86400000);
}
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickRef(settings, dayKey) {
  const mode = settings.selection_mode || "curated";
  if (mode === "random") {
    return numberToRef((hash32(dayKey + "|aya-of-day") % TOTAL_AYAT) + 1);
  }
  if (mode === "sequential") {
    return numberToRef(Number(settings.sequential_cursor) || 1);
  }
  if (mode === "custom") {
    const list = String(settings.custom_list || "").split(/[\s,\u060C\n]+/).filter(validRef);
    if (list.length) return list[Math.abs(dayIndex(dayKey)) % list.length];
  }
  const curated = CURATED_REFS.filter(validRef);
  return curated[Math.abs(dayIndex(dayKey)) % curated.length];
}

async function fetchAyah(ref, settings) {
  const editions = [
    settings.arabic_edition || "quran-uthmani",
    settings.translation_edition || "fa.gharaati",
  ].join(",");
  const url = QURAN_API + "/ayah/" + encodeURIComponent(ref) + "/editions/" + editions;
  let lastError = "unknown";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        cf: { cacheTtl: 21600, cacheEverything: true },
      });
      if (!res.ok) { lastError = "HTTP " + res.status; continue; }
      const body = await res.json();
      if (body.code !== 200 || !Array.isArray(body.data) || !body.data.length) {
        lastError = "پاسخ نامعتبر از API";
        continue;
      }
      const ar = body.data.find((d) => d.edition && d.edition.type === "quran") || body.data[0];
      const tr = body.data.find((d) => d.edition && d.edition.type === "translation");
      return {
        ref,
        surah: ar.surah.number,
        ayah: ar.numberInSurah,
        surahName: ar.surah.name,
        surahEnglish: ar.surah.englishName,
        number: ar.number,
        juz: ar.juz,
        page: ar.page,
        arabic: ar.text,
        translation: tr ? tr.text : "",
        translationEdition: tr ? tr.edition.identifier : "",
      };
    } catch (e) {
      lastError = String((e && e.message) || e);
    }
  }
  throw new Error("دریافت آیه از alquran.cloud ناموفق بود: " + lastError);
}

function buildMessage(v, s, t) {
  const out = [];
  out.push("\uD83C\uDF3F آیهٔ روز — " + jalaliLabel(t));
  if (s.include_arabic === "1" && v.arabic) out.push("", v.arabic);
  out.push("", "\uD83D\uDCD6 " + v.surahName + " — آیهٔ " + faNum(v.ayah));
  if (s.include_translation === "1" && v.translation) {
    out.push("", "\u270D\uFE0F ترجمهٔ " + (s.translation_label || "") + ":", v.translation);
  }
  if (s.include_link === "1") {
    out.push("", "\uD83D\uDD17 https://quran.com/" + v.surah + "/" + v.ayah);
  }
  if (s.hashtags) out.push("", s.hashtags);
  if (s.footer) out.push(s.footer);
  return out.join("\n").trim();
}

/* ════════════════  ۵) ارسال به کانال‌ها  ════════════════ */

async function readBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return { raw: text.slice(0, 300) }; }
}
function fail(status, data) {
  return { ok: false, detail: "HTTP " + status + " \u00B7 " + JSON.stringify(data).slice(0, 350) };
}
function missing(cfg, keys) {
  const gone = keys.filter((k) => !cfg[k]);
  return gone.length ? "مقادیر لازم تنظیم نشده: " + gone.join("، ") : null;
}

/** تلگرام و بله از یک API مشترک پیروی می‌کنند */
async function sendTelegramLike(base, token, chatId, text) {
  const res = await fetch(base.replace(/\/+$/, "") + "/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  const data = await readBody(res);
  if (data && data.ok) {
    return { ok: true, detail: "message_id=" + ((data.result && data.result.message_id) || "?") };
  }
  return fail(res.status, data);
}

async function sendEitaa(cfg, text) {
  const base = (cfg.base_url || "https://eitaayar.ir/api").replace(/\/+$/, "");
  const form = new URLSearchParams();
  form.set("chat_id", cfg.chat_id);
  form.set("text", text);
  if (cfg.title) form.set("title", cfg.title);
  const res = await fetch(base + "/" + cfg.token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await readBody(res);
  if (data && (data.ok === true || data.ok === "true")) return { ok: true, detail: "ok" };
  return fail(res.status, data);
}

async function sendRubika(cfg, text) {
  const base = (cfg.base_url || "https://botapi.rubika.ir/v3").replace(/\/+$/, "");
  const res = await fetch(base + "/" + cfg.bot_token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: cfg.chat_id, text }),
  });
  const data = await readBody(res);
  const status = data && (data.status || data.Status);
  if (String(status).toUpperCase() === "OK") {
    return { ok: true, detail: JSON.stringify(data.data || {}).slice(0, 150) };
  }
  return fail(res.status, data);
}

/* ── X (توییتر): OAuth 1.0a با Web Crypto ── */

function pct(str) {
  return encodeURIComponent(String(str)).replace(
    /[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}
async function oauth1Header(method, url, cfg) {
  const params = {
    oauth_consumer_key: cfg.api_key,
    oauth_nonce: b64u(crypto.getRandomValues(new Uint8Array(16))),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: cfg.access_token,
    oauth_version: "1.0",
  };
  const normalized = Object.keys(params).sort()
    .map((k) => pct(k) + "=" + pct(params[k])).join("&");
  const baseString = method.toUpperCase() + "&" + pct(url) + "&" + pct(normalized);
  const signingKey = pct(cfg.api_secret) + "&" + pct(cfg.access_secret);
  params.oauth_signature = b64(await hmacBytes(signingKey, baseString, "SHA-1"));
  return "OAuth " + Object.keys(params).sort()
    .map((k) => pct(k) + '="' + pct(params[k]) + '"').join(", ");
}

function splitTweets(text, limit) {
  const cap = limit || 262;
  const clean = String(text).trim();
  if (Array.from(clean).length <= 280) return [clean];
  const tokens = clean.split(/(\s+)/);
  const chunks = [];
  let cur = "";
  for (let token of tokens) {
    while (Array.from(token).length > cap) {
      if (cur.trim()) { chunks.push(cur.trim()); cur = ""; }
      const arr = Array.from(token);
      chunks.push(arr.slice(0, cap).join(""));
      token = arr.slice(cap).join("");
    }
    if (Array.from(cur + token).length > cap && cur.trim()) {
      chunks.push(cur.trim());
      cur = token.replace(/^\s+/, "");
    } else {
      cur += token;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  const total = chunks.length;
  return chunks.map((c, i) => c + "\n(" + (i + 1) + "/" + total + ")");
}

async function sendTwitter(cfg, text) {
  const url = "https://api.twitter.com/2/tweets";
  const parts = splitTweets(text);
  const ids = [];
  let replyTo = null;
  for (let i = 0; i < parts.length; i++) {
    const payload = { text: parts[i] };
    if (replyTo) payload.reply = { in_reply_to_tweet_id: replyTo };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: await oauth1Header("POST", url, cfg),
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await readBody(res);
    if (!res.ok || !data.data || !data.data.id) {
      return {
        ok: false,
        detail: "بخش " + (i + 1) + "/" + parts.length + " \u00B7 HTTP " + res.status +
          " \u00B7 " + JSON.stringify(data).slice(0, 300),
      };
    }
    replyTo = data.data.id;
    ids.push(data.data.id);
  }
  return { ok: true, detail: "tweets=" + ids.join(",") };
}

async function sendToChannel(id, cfg, message) {
  let gone;
  switch (id) {
    case "telegram":
      gone = missing(cfg, ["bot_token", "chat_id"]);
      if (gone) return { ok: false, detail: gone };
      return sendTelegramLike(cfg.base_url || "https://api.telegram.org", cfg.bot_token, cfg.chat_id, message);
    case "bale":
      gone = missing(cfg, ["bot_token", "chat_id"]);
      if (gone) return { ok: false, detail: gone };
      return sendTelegramLike(cfg.base_url || "https://tapi.bale.ai", cfg.bot_token, cfg.chat_id, message);
    case "eitaa":
      gone = missing(cfg, ["token", "chat_id"]);
      if (gone) return { ok: false, detail: gone };
      return sendEitaa(cfg, message);
    case "rubika":
      gone = missing(cfg, ["bot_token", "chat_id"]);
      if (gone) return { ok: false, detail: gone };
      return sendRubika(cfg, message);
    case "twitter":
      gone = missing(cfg, ["api_key", "api_secret", "access_token", "access_secret"]);
      if (gone) return { ok: false, detail: gone };
      return sendTwitter(cfg, message);
    default:
      return { ok: false, detail: "کانال ناشناخته" };
  }
}

/* ════════════════  ۶) هستهٔ ارسال  ════════════════ */

async function buildToday(env, settings) {
  const s = settings || (await getSettings(env));
  const t = localNow(s.tz_offset);
  const ref = pickRef(s, t.dayKey);
  const verse = await fetchAyah(ref, s);
  return { settings: s, now: t, verse, message: buildMessage(verse, s, t) };
}

async function dispatch(env, options) {
  const opts = options || {};
  const trigger = opts.trigger || "manual";
  const only = opts.only || null;

  const built = await buildToday(env);
  const s = built.settings, t = built.now, verse = built.verse, message = built.message;

  const channels = await getChannels(env);
  const targets = only ? [only] : CHANNEL_IDS.filter((id) => channels[id] && channels[id].enabled);

  if (!targets.length) {
    await log(env, "warn", "هیچ کانال فعالی وجود ندارد", { trigger });
    return { status: "failed", ref: verse.ref, verse, message, results: [], error: "هیچ کانال فعالی وجود ندارد" };
  }

  const settled = await Promise.all(targets.map(async (id) => {
    try {
      const r = await sendToChannel(id, (channels[id] && channels[id].config) || {}, message);
      return { channel: id, ok: !!r.ok, detail: r.detail || "" };
    } catch (e) {
      return { channel: id, ok: false, detail: String((e && e.message) || e) };
    }
  }));

  const okCount = settled.filter((r) => r.ok).length;
  const status = okCount === settled.length ? "ok" : okCount > 0 ? "partial" : "failed";

  const inserted = await env.DB.prepare(
    "INSERT INTO sends (day_key, ref, surah, ayah, surah_name, arabic, translation, message, trigger, status) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    t.dayKey, verse.ref, verse.surah, verse.ayah, verse.surahName,
    verse.arabic, verse.translation, message, trigger, status
  ).run();

  const sendId = inserted.meta && inserted.meta.last_row_id;
  if (sendId) {
    await env.DB.batch(settled.map((r) =>
      env.DB.prepare("INSERT INTO deliveries (send_id, channel, ok, detail) VALUES (?, ?, ?, ?)")
        .bind(sendId, r.channel, r.ok ? 1 : 0, String(r.detail || "").slice(0, 500))
    ));
  }

  await log(
    env,
    status === "ok" ? "info" : status === "partial" ? "warn" : "error",
    "ارسال (" + trigger + ") — آیهٔ " + verse.ref,
    { status, results: settled }
  );

  if (s.selection_mode === "sequential" && trigger !== "test" && okCount > 0) {
    await setSetting(env, "sequential_cursor", ((Number(s.sequential_cursor) || 1) % TOTAL_AYAT) + 1);
  }

  return { status, ref: verse.ref, verse, message, results: settled, sendId };
}

async function runScheduled(env) {
  await ensureSchema(env);
  const s = await getSettings(env);
  if (s.enabled !== "1") return;

  const t = localNow(s.tz_offset);
  const hm = String(s.send_time || "20:00").split(":");
  const target = (Number(hm[0]) || 0) * 60 + (Number(hm[1]) || 0);
  const windowMin = Math.max(5, Number(s.window_minutes) || 30);
  const delta = t.minutes - target;
  if (delta < 0 || delta > windowMin) return;

  const lock = await env.DB
    .prepare("INSERT OR IGNORE INTO daily_locks (day_key) VALUES (?)")
    .bind(t.dayKey).run();
  if (!lock.meta || lock.meta.changes === 0) return; // امروز قبلاً ارسال شده

  try {
    const result = await dispatch(env, { trigger: "cron" });
    if (result.status === "failed") {
      // قفل را آزاد کن تا تیک بعدی دوباره تلاش کند
      await env.DB.prepare("DELETE FROM daily_locks WHERE day_key = ?").bind(t.dayKey).run();
    }
  } catch (e) {
    await env.DB.prepare("DELETE FROM daily_locks WHERE day_key = ?").bind(t.dayKey).run();
    await log(env, "error", "خطا در اجرای کران", { error: String((e && e.message) || e) });
  }

  // نگه‌داشت: قفل‌های قدیمی را پاک کن
  await env.DB.prepare("DELETE FROM daily_locks WHERE day_key < ?")
    .bind(localNow(s.tz_offset, Date.now() - 30 * 86400000).dayKey).run();
}

function nextRunISO(s) {
  const off = Number(s.tz_offset) || 210;
  const hm = String(s.send_time || "20:00").split(":");
  const target = (Number(hm[0]) || 0) * 60 + (Number(hm[1]) || 0);
  const t = localNow(off);
  let addMinutes = target - t.minutes;
  if (addMinutes <= 0) addMinutes += 1440;
  const at = Date.now() + addMinutes * 60000;
  const local = localNow(off, at);
  return { iso: new Date(at).toISOString(), clock: local.clock, jalali: jalaliLabel(local), inMinutes: addMinutes };
}

/* ════════════════  ۷) API  ════════════════ */

function maskConfig(id, cfg) {
  const def = CHANNEL_DEFS[id];
  const out = {};
  for (const f of def.fields) {
    const val = cfg[f.key];
    if (!val) { out[f.key] = ""; continue; }
    out[f.key] = f.secret ? MASK + String(val).slice(-4) : String(val);
  }
  return out;
}
function mergeConfig(id, oldCfg, incoming) {
  const def = CHANNEL_DEFS[id];
  const out = Object.assign({}, oldCfg);
  for (const f of def.fields) {
    if (!(f.key in incoming)) continue;
    const val = incoming[f.key];
    if (val === null) { delete out[f.key]; continue; }
    const str = String(val);
    if (f.secret && str.indexOf(MASK) === 0) continue; // تغییر نکرده
    if (str === "") { delete out[f.key]; continue; }
    out[f.key] = str.trim();
  }
  return out;
}

async function adminPasswordHash(env) {
  const s = await getSettings(env);
  if (s.admin_password_hash) return s.admin_password_hash;
  if (env.ADMIN_PASSWORD) {
    const h = await hashPassword(env.ADMIN_PASSWORD);
    await setSetting(env, "admin_password_hash", h);
    return h;
  }
  return "";
}

async function requireAuth(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await readSession(env, token);
  return !!session;
}

async function handleAPI(request, env, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const body = method === "POST" || method === "PUT"
    ? await request.json().catch(() => ({}))
    : {};

  /* ── عمومی ── */

  if (path === "/health") {
    return json({ ok: true, service: "aya-of-day", version: VERSION, time: new Date().toISOString() });
  }

  if (path === "/api/today" && method === "GET") {
    const built = await buildToday(env);
    return json({
      ok: true,
      date: { jalali: jalaliLabel(built.now), gregorian: built.now.dayKey },
      ref: built.verse.ref,
      surah: { number: built.verse.surah, name: built.verse.surahName, english: built.verse.surahEnglish },
      ayah: built.verse.ayah,
      arabic: built.verse.arabic,
      translation: built.verse.translation,
      translator: built.settings.translation_label,
      link: "https://quran.com/" + built.verse.surah + "/" + built.verse.ayah,
    });
  }

  if (path === "/api/login" && method === "POST") {
    const stored = await adminPasswordHash(env);
    if (!stored) return json({ error: "رمز مدیر تنظیم نشده است. متغیر ADMIN_PASSWORD را تنظیم کنید." }, 500);
    const ok = await verifyPassword(String(body.password || ""), stored);
    if (!ok) {
      await log(env, "warn", "تلاش ناموفق برای ورود", { ip: request.headers.get("cf-connecting-ip") });
      return json({ error: "رمز عبور نادرست است" }, 401);
    }
    const token = await makeSession(env);
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(token, SESSION_TTL) });
  }

  if (path === "/api/logout") {
    return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
  }

  /* ── نیازمند ورود ── */

  if (!(await requireAuth(request, env))) {
    return json({ error: "unauthorized" }, 401);
  }

  if (path === "/api/state" && method === "GET") {
    const s = await getSettings(env);
    const channels = await getChannels(env);
    const t = localNow(s.tz_offset);

    const publicSettings = {};
    for (const k of PUBLIC_SETTING_KEYS) publicSettings[k] = s[k];

    const channelState = {};
    for (const id of CHANNEL_IDS) {
      const required = CHANNEL_DEFS[id].fields.filter((f) => f.required).map((f) => f.key);
      const cfg = channels[id].config || {};
      channelState[id] = {
        enabled: channels[id].enabled,
        config: maskConfig(id, cfg),
        configured: required.every((k) => !!cfg[k]),
      };
    }

    const history = (await env.DB.prepare(
      "SELECT id, day_key, ref, surah_name, ayah, trigger, status, created_at FROM sends ORDER BY id DESC LIMIT 30"
    ).all()).results || [];
    const sendIds = history.map((h) => h.id);
    let deliveries = [];
    if (sendIds.length) {
      deliveries = (await env.DB.prepare(
        "SELECT send_id, channel, ok, detail FROM deliveries WHERE send_id IN (" +
        sendIds.map(() => "?").join(",") + ")"
      ).bind(...sendIds).all()).results || [];
    }
    const logs = (await env.DB.prepare(
      "SELECT id, level, message, meta, created_at FROM logs ORDER BY id DESC LIMIT 60"
    ).all()).results || [];

    return json({
      ok: true,
      version: VERSION,
      now: { clock: t.clock, jalali: jalaliLabel(t), dayKey: t.dayKey },
      nextRun: nextRunISO(s),
      settings: publicSettings,
      channelDefs: CHANNEL_DEFS,
      channels: channelState,
      history,
      deliveries,
      logs,
      sentToday: !!(await env.DB.prepare("SELECT day_key FROM daily_locks WHERE day_key = ?").bind(t.dayKey).first()),
    });
  }

  if (path === "/api/settings" && method === "POST") {
    const incoming = body.settings || {};
    const writes = [];
    for (const k of PUBLIC_SETTING_KEYS) {
      if (!(k in incoming)) continue;
      let v = String(incoming[k] == null ? "" : incoming[k]);
      if (k === "send_time" && !/^\d{1,2}:\d{2}$/.test(v)) {
        return json({ error: "قالب ساعت ارسال باید HH:MM باشد" }, 400);
      }
      if (k === "send_time") {
        const p = v.split(":");
        v = pad2(Math.min(23, Math.max(0, Number(p[0]) || 0))) + ":" + pad2(Math.min(59, Math.max(0, Number(p[1]) || 0)));
      }
      writes.push(setSetting(env, k, v));
    }
    await Promise.all(writes);
    await log(env, "info", "تنظیمات به‌روز شد");
    return json({ ok: true });
  }

  const channelMatch = path.match(/^\/api\/channels\/([a-z]+)$/);
  if (channelMatch && method === "POST") {
    const id = channelMatch[1];
    if (!CHANNEL_DEFS[id]) return json({ error: "کانال ناشناخته" }, 404);
    const channels = await getChannels(env);
    const merged = mergeConfig(id, channels[id].config || {}, body.config || {});
    const enabled = body.enabled == null ? channels[id].enabled : !!body.enabled;
    await saveChannel(env, id, enabled, merged);
    await log(env, "info", "تنظیمات کانال ذخیره شد: " + id, { enabled });
    return json({ ok: true, config: maskConfig(id, merged), enabled });
  }

  const testMatch = path.match(/^\/api\/test\/([a-z]+)$/);
  if (testMatch && method === "POST") {
    const id = testMatch[1];
    if (!CHANNEL_DEFS[id]) return json({ error: "کانال ناشناخته" }, 404);
    const result = await dispatch(env, { trigger: "test", only: id });
    const r = result.results[0] || { ok: false, detail: "بدون نتیجه" };
    return json({ ok: r.ok, detail: r.detail, ref: result.ref });
  }

  if (path === "/api/preview" && method === "GET") {
    const built = await buildToday(env);
    return json({
      ok: true,
      ref: built.verse.ref,
      surahName: built.verse.surahName,
      ayah: built.verse.ayah,
      message: built.message,
      tweets: splitTweets(built.message),
    });
  }

  if (path === "/api/send-now" && method === "POST") {
    const result = await dispatch(env, { trigger: "manual" });
    if (body.markToday) {
      const t = localNow((await getSettings(env)).tz_offset);
      await env.DB.prepare("INSERT OR IGNORE INTO daily_locks (day_key) VALUES (?)").bind(t.dayKey).run();
    }
    return json({ ok: result.status !== "failed", status: result.status, ref: result.ref, results: result.results });
  }

  if (path === "/api/password" && method === "POST") {
    const current = String(body.current || "");
    const next = String(body.next || "");
    if (next.length < 8) return json({ error: "رمز جدید باید حداقل ۸ کاراکتر باشد" }, 400);
    const stored = await adminPasswordHash(env);
    if (!(await verifyPassword(current, stored))) return json({ error: "رمز فعلی نادرست است" }, 401);
    await setSetting(env, "admin_password_hash", await hashPassword(next));
    await log(env, "info", "رمز مدیر تغییر کرد");
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(await makeSession(env), SESSION_TTL) });
  }

  if (path === "/api/unlock-today" && method === "POST") {
    const t = localNow((await getSettings(env)).tz_offset);
    await env.DB.prepare("DELETE FROM daily_locks WHERE day_key = ?").bind(t.dayKey).run();
    return json({ ok: true });
  }

  const sendMatch = path.match(/^\/api\/sends\/(\d+)$/);
  if (sendMatch && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM sends WHERE id = ?").bind(Number(sendMatch[1])).first();
    if (!row) return json({ error: "یافت نشد" }, 404);
    const dels = (await env.DB.prepare("SELECT channel, ok, detail FROM deliveries WHERE send_id = ?")
      .bind(row.id).all()).results || [];
    return json({ ok: true, send: row, deliveries: dels });
  }

  return json({ error: "not found" }, 404);
}

/* ════════════════  ۸) ورودی ورکر  ════════════════ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (!env.DB) {
        return json({ error: "اتصال D1 (binding با نام DB) تنظیم نشده است" }, 500);
      }
      await ensureSchema(env);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        return new Response(renderDashboard(), {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (url.pathname === "/robots.txt") {
        return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
      }
      if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
        return await handleAPI(request, env, url);
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      const message = String((err && err.message) || err);
      try { await log(env, "error", "خطای درخواست: " + url.pathname, { error: message }); } catch (e) {}
      return json({ error: message }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runScheduled(env).catch(async (e) => {
        try { await log(env, "error", "cron ناموفق", { error: String((e && e.message) || e) }); } catch (x) {}
      })
    );
  },
};

/* ════════════════  ۹) داشبورد  ════════════════ */

function renderDashboard() {
  return DASHBOARD_HTML;
}

const DASHBOARD_HTML = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>آیهٔ روز — داشبورد مدیریتی</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='88'>☘</text></svg>" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" />
<style>
*{box-sizing:border-box}
:root{
 --bg:#080f1a; --panel:#0f1a2b; --panel2:#152538; --line:#22364f;
 --txt:#e8eef8; --muted:#8aa0bd; --accent:#2dd4a7; --accent-d:#159c78;
 --ok:#34d399; --warn:#fbbf24; --err:#f87171; --r:14px;
}
html,body{margin:0;padding:0}
body{
 background:radial-gradient(1100px 520px at 85% -12%,#12405c 0%,var(--bg) 58%) fixed;
 color:var(--txt);font-family:Vazirmatn,system-ui,-apple-system,"Segoe UI",sans-serif;
 min-height:100vh;font-size:14.5px;line-height:1.85;
}
.hidden{display:none !important}
.wrap{max-width:1080px;margin:0 auto;padding:22px 16px 70px}
.center{min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:linear-gradient(180deg,var(--panel) 0%,var(--panel2) 100%);
 border:1px solid var(--line);border-radius:var(--r);padding:20px;
 box-shadow:0 18px 40px rgba(0,0,0,.35)}
.brand{display:flex;align-items:center;gap:12px}
.brand .logo{font-size:30px;filter:drop-shadow(0 0 12px rgba(45,212,167,.5))}
.brand h1{margin:0;font-size:19px;font-weight:800;letter-spacing:-.3px}
.brand p{margin:0;color:var(--muted);font-size:12.5px}
header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn{background:var(--panel2);color:var(--txt);border:1px solid var(--line);
 border-radius:10px;padding:8px 14px;font:inherit;font-size:13px;cursor:pointer;transition:.15s}
.btn:hover{border-color:var(--accent);transform:translateY(-1px)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn.primary{background:linear-gradient(180deg,var(--accent) 0%,var(--accent-d) 100%);
 color:#04211a;border-color:transparent;font-weight:700}
.btn.ghost{background:transparent;color:var(--muted)}
.btn.sm{padding:5px 11px;font-size:12px}
.tabs{display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid var(--line);margin-bottom:18px;padding-bottom:2px}
.tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--muted);
 padding:9px 14px;font:inherit;font-size:13.5px;cursor:pointer;white-space:nowrap}
.tabs button.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:700}
.grid{display:grid;gap:14px}
.g2{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.stat .k{color:var(--muted);font-size:12px;margin-bottom:3px}
.stat .v{font-size:19px;font-weight:800}
label{display:block;color:var(--muted);font-size:12.5px;margin:12px 0 5px}
input[type=text],input[type=password],input[type=time],select,textarea{
 width:100%;background:#0a1524;border:1px solid var(--line);border-radius:10px;
 color:var(--txt);padding:9px 12px;font:inherit;font-size:13.5px;outline:none}
input:focus,select:focus,textarea:focus{border-color:var(--accent)}
textarea{min-height:80px;resize:vertical;line-height:1.9}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.switch{display:inline-flex;align-items:center;gap:8px;cursor:pointer;color:var(--txt);font-size:13.5px}
.switch input{width:auto;accent-color:var(--accent);width:17px;height:17px}
.pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:700}
.pill.ok{background:rgba(52,211,153,.16);color:var(--ok)}
.pill.warn{background:rgba(251,191,36,.16);color:var(--warn)}
.pill.err{background:rgba(248,113,113,.16);color:var(--err)}
.pill.off{background:rgba(138,160,189,.14);color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:right;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;font-size:12px}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;direction:ltr;text-align:left}
.chan-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.chan-title{display:flex;align-items:center;gap:9px;font-weight:800;font-size:15px}
.hint{color:var(--muted);font-size:12px;margin:6px 0 0}
.arabic{font-size:20px;line-height:2.4;text-align:center;padding:14px 6px;
 border-radius:12px;background:rgba(45,212,167,.05);border:1px solid var(--line)}
#toast{position:fixed;bottom:22px;inset-inline-start:22px;background:var(--panel2);
 border:1px solid var(--line);border-radius:11px;padding:11px 16px;font-size:13px;
 opacity:0;transform:translateY(12px);transition:.25s;pointer-events:none;z-index:50;max-width:80vw}
#toast.show{opacity:1;transform:none}
#toast.err{border-color:var(--err);color:var(--err)}
#toast.ok{border-color:var(--ok);color:var(--ok)}
#modal{position:fixed;inset:0;background:rgba(3,8,15,.72);display:flex;align-items:center;
 justify-content:center;padding:18px;z-index:60;backdrop-filter:blur(3px)}
.modal-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);
 padding:20px;max-width:640px;width:100%;max-height:84vh;overflow:auto;position:relative}
#modalClose{position:absolute;inset-inline-end:12px;top:10px;background:none;border:0;
 color:var(--muted);font-size:18px;cursor:pointer}
pre.msg{white-space:pre-wrap;background:#0a1524;border:1px solid var(--line);
 border-radius:10px;padding:14px;font-family:Vazirmatn,sans-serif;font-size:13.5px;line-height:2.1}
.err-txt{color:var(--err);font-size:12.5px;min-height:18px;margin:8px 0 0}
footer{color:var(--muted);font-size:12px;text-align:center;margin-top:28px}
footer a{color:var(--accent);text-decoration:none}
</style>
</head>
<body>

<div id="login" class="wrap center">
  <form class="card" id="loginForm" style="max-width:340px;width:100%">
    <div class="brand" style="margin-bottom:6px">
      <span class="logo">☘</span>
      <div><h1>آیهٔ روز</h1><p>داشبورد مدیریتی</p></div>
    </div>
    <label for="pw">رمز عبور</label>
    <input type="password" id="pw" autocomplete="current-password" required />
    <div class="err-txt" id="loginErr"></div>
    <button class="btn primary" type="submit" style="width:100%;margin-top:10px">ورود</button>
  </form>
</div>

<div id="app" class="wrap hidden">
  <header>
    <div class="brand">
      <span class="logo">☘</span>
      <div><h1>آیهٔ روز</h1><p id="subtitle">داشبورد مدیریتی</p></div>
    </div>
    <div class="actions">
      <button class="btn sm" id="btnPreview">پیش‌نمایش</button>
      <button class="btn sm primary" id="btnSend">ارسال فوری</button>
      <button class="btn sm ghost" id="btnLogout">خروج</button>
    </div>
  </header>

  <nav class="tabs" id="tabs">
    <button data-tab="overview" class="active">نمای کلی</button>
    <button data-tab="channels">کانال‌ها</button>
    <button data-tab="settings">تنظیمات</button>
    <button data-tab="history">تاریخچه</button>
    <button data-tab="logs">لاگ</button>
  </nav>

  <section id="tab-overview"></section>
  <section id="tab-channels" class="hidden"></section>
  <section id="tab-settings" class="hidden"></section>
  <section id="tab-history" class="hidden"></section>
  <section id="tab-logs" class="hidden"></section>

  <footer>آیهٔ روز · نسخهٔ <span id="ver"></span> · <a href="https://github.com/0xzare/aya-of-day-worker" target="_blank" rel="noopener">مخزن کد</a></footer>
</div>

<div id="toast"></div>
<div id="modal" class="hidden">
  <div class="modal-card"><button id="modalClose">✕</button><div id="modalBody"></div></div>
</div>

<script>
var S = null;
var CUR = "overview";

function $(id){ return document.getElementById(id); }
function esc(v){
  return String(v == null ? "" : v).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function fa(v){
  return String(v == null ? "" : v).replace(/[0-9]/g, function(d){
    return "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9"[Number(d)];
  });
}
function toast(msg, kind){
  var t = $("toast");
  t.textContent = msg;
  t.className = "show " + (kind || "");
  clearTimeout(t._h);
  t._h = setTimeout(function(){ t.className = 