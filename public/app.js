/* آیهٔ روز — اسکریپت داشبورد (وانیلا، بدون وابستگی) */
"use strict";

let S = null;
let CUR = "overview";

const $ = (id) => document.getElementById(id);

const esc = (v) =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

const fa = (v) =>
  String(v == null ? "" : v).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function toast(msg, kind) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "show " + (kind || "");
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.className = ""; }, 4500);
}

function showModal(html) {
  $("modalBody").innerHTML = html;
  $("modal").classList.remove("hidden");
}
function hideModal() { $("modal").classList.add("hidden"); }

async function api(path, opts = {}) {
  opts.headers = Object.assign({ "content-type": "application/json" }, opts.headers || {});
  const res = await fetch(path, opts);
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (res.status === 401 && path !== "/api/login") { showLogin(); throw new Error("نشست منقضی شده است"); }
  if (!res.ok || data.error) throw new Error(data.error || ("خطای HTTP " + res.status));
  return data;
}
const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });

/* ────── ورود ────── */

function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
}
function showApp() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
}

/* ────── رندر ────── */

const statusPill = (st) =>
  st === "ok" ? '<span class="pill ok">موفق</span>'
    : st === "partial" ? '<span class="pill warn">ناقص</span>'
      : '<span class="pill err">ناموفق</span>';

const trg = (t) => (t === "cron" ? "خودکار" : t === "manual" ? "دستی" : "آزمایشی");
const stat = (k, v) => '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>";
const opt = (v, l, cur) => '<option value="' + v + '"' + (cur === v ? " selected" : "") + ">" + l + "</option>";

function switchTab(name) {
  CUR = name;
  document.querySelectorAll("#tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name)
  );
  ["overview", "channels", "settings", "history", "logs"].forEach((id) =>
    $("tab-" + id).classList.toggle("hidden", id !== name)
  );
}

function render() {
  renderOverview();
  renderChannels();
  renderSettings();
  renderHistory();
  renderLogs();
  switchTab(CUR);
}

/* ── نمای کلی ── */

function renderOverview() {
  let active = 0, total = 0;
  for (const id in S.channels) { total++; if (S.channels[id].enabled) active++; }
  const last = S.history[0];

  let h = '<div class="grid g3">';
  h += stat("وضعیت سرویس", S.settings.enabled === "1"
    ? '<span class="pill ok">فعال</span>' : '<span class="pill off">غیرفعال</span>');
  h += stat("ساعت ارسال", fa(S.settings.send_time) + " تهران");
  h += stat("اجرای بعدی", fa(S.nextRun.clock) + " · " + S.nextRun.jalali);
  h += stat("کانال‌های فعال", fa(active) + " از " + fa(total));
  h += stat("ارسال امروز", S.sentToday
    ? '<span class="pill ok">انجام شد</span>' : '<span class="pill warn">در انتظار</span>');
  h += stat("آخرین آیه", last ? esc(last.surah_name || "") + " " + fa(last.ayah || "") : "—");
  h += "</div>";

  h += '<div class="card" style="margin-top:16px">' +
    '<div class="chan-title">☘ آیهٔ امروز</div>' +
    '<div id="todayBox" class="hint">در حال دریافت…</div></div>';

  $("tab-overview").innerHTML = h;
  loadToday();
}

async function loadToday() {
  try {
    const d = await api("/api/preview");
    $("todayBox").innerHTML =
      '<p class="hint">' + esc(d.surahName) + " — آیهٔ " + fa(d.ayah) +
      ' <span class="mono">(' + esc(d.ref) + ')</span></p>' +
      '<pre class="msg">' + esc(d.message) + "</pre>";
  } catch (e) {
    $("todayBox").textContent = "خطا در دریافت آیه: " + e.message;
  }
}

/* ── کانال‌ها ── */

function renderChannels() {
  let h = '<div class="grid g2">';
  for (const id in S.channelDefs) {
    const def = S.channelDefs[id];
    const st = S.channels[id];
    h += '<div class="card">';
    h += '<div class="chan-head"><div class="chan-title">' + def.icon + " " + esc(def.label) + "</div>";
    h += st.configured
      ? '<span class="pill ok">تنظیم شده</span>'
      : '<span class="pill off">ناقص</span>';
    h += "</div>";
    h += '<p class="hint">' + esc(def.hint) + "</p>";
    h += '<label class="switch" style="margin-top:12px"><input type="checkbox" data-en="' + id + '"' +
      (st.enabled ? " checked" : "") + " /> ارسال خودکار روزانه فعال باشد</label>";

    for (const f of def.fields) {
      h += "<label>" + esc(f.label) + (f.required ? " *" : "") + "</label>";
      h += '<input type="' + (f.secret ? "password" : "text") + '" data-f="' + id + "." + f.key +
        '" value="' + esc(st.config[f.key] || "") + '" placeholder="' + esc(f.placeholder || "") +
        '" autocomplete="off" spellcheck="false" />';
    }

    h += '<div class="row" style="margin-top:16px">' +
      '<button class="btn sm primary" data-save="' + id + '">ذخیره</button>' +
      '<button class="btn sm" data-test="' + id + '">ارسال آزمایشی</button></div>';
    h += "</div>";
  }
  h += "</div>";
  h += '<p class="hint" style="margin-top:14px">مقادیر محرمانه با AES-GCM رمزنگاری و همیشه ماسک‌شده نمایش داده می‌شوند. برای حفظ مقدار فعلی، فیلد را دست‌نخورده بگذارید.</p>';
  $("tab-channels").innerHTML = h;
}

async function saveChan(id, btn) {
  const def = S.channelDefs[id];
  const cfg = {};
  for (const f of def.fields) {
    const input = document.querySelector('[data-f="' + id + "." + f.key + '"]');
    cfg[f.key] = input ? input.value : "";
  }
  const en = document.querySelector('[data-en="' + id + '"]');
  btn.disabled = true;
  try {
    await post("/api/channels/" + id, { enabled: en.checked, config: cfg });
    toast("تنظیمات " + def.label + " ذخیره شد", "ok");
    await refresh();
  } catch (e) {
    toast(e.message, "err");
  }
  btn.disabled = false;
}

async function testChan(id, btn) {
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "در حال ارسال…";
  try {
    const r = await post("/api/test/" + id, {});
    if (r.ok) toast("ارسال آزمایشی موفق بود ✔", "ok");
    else showModal('<h3 style="margin-top:0">ارسال آزمایشی ناموفق</h3><pre class="msg">' + esc(r.detail) + "</pre>");
  } catch (e) {
    toast(e.message, "err");
  }
  btn.disabled = false;
  btn.textContent = label;
}

/* ── تنظیمات ── */

function renderSettings() {
  const s = S.settings;
  let h = '<div class="grid g2">';

  h += '<div class="card"><div class="chan-title">⏰ زمان‌بندی</div>';
  h += '<label class="switch" style="margin-top:12px"><input type="checkbox" id="st_enabled"' +
    (s.enabled === "1" ? " checked" : "") + " /> ارسال خودکار روزانه فعال باشد</label>";
  h += '<label>ساعت ارسال (به وقت تهران)</label><input type="time" id="st_send_time" value="' + esc(s.send_time) + '" />';
  h += '<label>اختلاف با UTC بر‌حسب دقیقه (تهران = ۲۱۰)</label><input type="text" id="st_tz_offset" value="' + esc(s.tz_offset) + '" />';
  h += '<label>پنجرهٔ مجاز ارسال (دقیقه)</label><input type="text" id="st_window_minutes" value="' + esc(s.window_minutes) + '" />';
  h += '<p class="hint">کران هر ۵ دقیقه بیدار می‌شود؛ اگر در پنجرهٔ مجاز باشد و امروز چیزی ارسال نشده باشد، ارسال انجام می‌شود.</p></div>';

  h += '<div class="card"><div class="chan-title">🎯 انتخاب آیه</div>';
  h += "<label>روش انتخاب</label><select id=\"st_selection_mode\">" +
    opt("curated", "آیات منتخب (پیش‌فرض)", s.selection_mode) +
    opt("random", "تصادفی روزانه", s.selection_mode) +
    opt("sequential", "ترتیبی از ابتدای قرآن", s.selection_mode) +
    opt("custom", "فهرست دلخواه", s.selection_mode) + "</select>";
  h += '<label>مکان‌نمای حالت ترتیبی (۱ تا ۶۲۳۶)</label><input type="text" id="st_sequential_cursor" value="' + esc(s.sequential_cursor) + '" />';
  h += '<label>فهرست دلخواه — مثلاً: 2:255 18:110</label><textarea id="st_custom_list" spellcheck="false">' + esc(s.custom_list) + "</textarea></div>";

  h += '<div class="card"><div class="chan-title">📖 متن و ترجمه</div>';
  h += '<label>نسخهٔ متن عربی</label><input type="text" id="st_arabic_edition" value="' + esc(s.arabic_edition) + '" />';
  h += '<label>شناسهٔ ترجمه در alquran.cloud</label><input type="text" id="st_translation_edition" value="' + esc(s.translation_edition) + '" />';
  h += '<label>نام مترجم در متن پیام</label><input type="text" id="st_translation_label" value="' + esc(s.translation_label) + '" />';
  h += '<label class="switch"><input type="checkbox" id="st_include_arabic"' + (s.include_arabic === "1" ? " checked" : "") + " /> نمایش متن عربی</label>";
  h += '<label class="switch"><input type="checkbox" id="st_include_translation"' + (s.include_translation === "1" ? " checked" : "") + " /> نمایش ترجمه</label>";
  h += '<label class="switch"><input type="checkbox" id="st_include_link"' + (s.include_link === "1" ? " checked" : "") + " /> افزودن لینک quran.com</label>";
  h += '<label>هشتگ‌ها</label><input type="text" id="st_hashtags" value="' + esc(s.hashtags) + '" />';
  h += '<label>پانویس (اختیاری)</label><input type="text" id="st_footer" value="' + esc(s.footer) + '" /></div>';

  h += '<div class="card"><div class="chan-title">🔐 امنیت و نگهداری</div>';
  h += '<label>رمز فعلی</label><input type="password" id="pw_cur" autocomplete="current-password" />';
  h += '<label>رمز جدید (حداقل ۸ کاراکتر)</label><input type="password" id="pw_new" autocomplete="new-password" />';
  h += '<div class="row" style="margin-top:14px"><button class="btn sm" id="btnPw">تغییر رمز</button>';
  h += '<button class="btn sm ghost" id="btnUnlock">برداشتن قفل ارسال امروز</button></div>';
  h += '<p class="hint">با برداشتن قفل، کران می‌تواند امروز دوباره ارسال کند.</p></div>';

  h += '</div><div style="margin-top:18px"><button class="btn primary" id="btnSaveSettings">ذخیرهٔ تنظیمات</button></div>';

  $("tab-settings").innerHTML = h;
  $("btnSaveSettings").onclick = saveSettings;
  $("btnPw").onclick = changePw;
  $("btnUnlock").onclick = async () => {
    try { await post("/api/unlock-today"); toast("قفل امروز برداشته شد", "ok"); await refresh(); }
    catch (e) { toast(e.message, "err"); }
  };
}

async function saveSettings() {
  const texts = ["send_time", "tz_offset", "window_minutes", "selection_mode",
    "sequential_cursor", "custom_list", "arabic_edition", "translation_edition",
    "translation_label", "hashtags", "footer"];
  const flags = ["enabled", "include_arabic", "include_translation", "include_link"];
  const out = {};
  texts.forEach((k) => { const el = $("st_" + k); if (el) out[k] = el.value; });
  flags.forEach((k) => { const el = $("st_" + k); if (el) out[k] = el.checked ? "1" : "0"; });
  try {
    await post("/api/settings", { settings: out });
    toast("تنظیمات ذخیره شد", "ok");
    await refresh();
  } catch (e) { toast(e.message, "err"); }
}

async function changePw() {
  try {
    await post("/api/password", { current: $("pw_cur").value, next: $("pw_new").value });
    $("pw_cur").value = "";
    $("pw_new").value = "";
    toast("رمز عبور تغییر کرد", "ok");
  } catch (e) { toast(e.message, "err"); }
}

/* ── تاریخچه و لاگ ── */

function renderHistory() {
  if (!S.history.length) {
    $("tab-history").innerHTML = '<div class="card hint">هنوز ارسالی ثبت نشده است.</div>';
    return;
  }
  const byId = {};
  S.deliveries.forEach((d) => { (byId[d.send_id] = byId[d.send_id] || []).push(d); });

  let h = '<div class="card" style="padding:6px 12px"><table><thead><tr>' +
    "<th>زمان</th><th>آیه</th><th>نوع</th><th>وضعیت</th><th>کانال‌ها</th><th></th></tr></thead><tbody>";
  for (const r of S.history) {
    let chips = "";
    for (const d of byId[r.id] || []) {
      const def = S.channelDefs[d.channel];
      chips += '<span class="pill ' + (d.ok ? "ok" : "err") + '" title="' + esc(d.detail || "") + '">' +
        ((def && def.label) || d.channel) + "</span> ";
    }
    h += '<tr><td class="mono">' + esc(r.created_at) + "</td>" +
      "<td>" + esc(r.surah_name || "") + " " + fa(r.ayah) + '<div class="mono">' + esc(r.ref) + "</div></td>" +
      "<td>" + trg(r.trigger) + "</td><td>" + statusPill(r.status) + "</td><td>" + chips + "</td>" +
      '<td><button class="btn sm" data-view="' + r.id + '">متن</button></td></tr>';
  }
  h += "</tbody></table></div>";
  $("tab-history").innerHTML = h;
}

function renderLogs() {
  if (!S.logs.length) {
    $("tab-logs").innerHTML = '<div class="card hint">لاگی ثبت نشده است.</div>';
    return;
  }
  let h = '<div class="card" style="padding:6px 12px"><table><thead><tr>' +
    "<th>زمان</th><th>سطح</th><th>پیام</th></tr></thead><tbody>";
  for (const l of S.logs) {
    const cls = l.level === "error" ? "err" : l.level === "warn" ? "warn" : "ok";
    h += '<tr><td class="mono">' + esc(l.created_at) + "</td>" +
      '<td><span class="pill ' + cls + '">' + esc(l.level) + "</span></td><td>" + esc(l.message) +
      (l.meta ? '<div class="mono" style="max-height:80px;overflow:auto;opacity:.7">' + esc(l.meta) + "</div>" : "") +
      "</td></tr>";
  }
  h += "</tbody></table></div>";
  $("tab-logs").innerHTML = h;
}

/* ────── راه‌اندازی ────── */

async function refresh() {
  try { S = await api("/api/state"); render(); } catch (e) { /* ignore */ }
}

async function boot() {
  try { S = await api("/api/state"); }
  catch (e) { showLogin(); return; }
  showApp();
  $("ver").textContent = fa(S.version);
  $("subtitle").textContent = S.now.jalali + " · ساعت " + fa(S.now.clock) + " به وقت تهران";
  render();
}

function wire() {
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("loginErr").textContent = "";
    try {
      await post("/api/login", { password: $("pw").value });
      $("pw").value = "";
      await boot();
    } catch (err) { $("loginErr").textContent = err.message; }
  });

  $("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (b) switchTab(b.dataset.tab);
  });

  $("tab-channels").addEventListener("click", (e) => {
    const s = e.target.closest("[data-save]");
    if (s) return saveChan(s.getAttribute("data-save"), s);
    const t = e.target.closest("[data-test]");
    if (t) return testChan(t.getAttribute("data-test"), t);
  });

  $("tab-history").addEventListener("click", async (e) => {
    const v = e.target.closest("[data-view]");
    if (!v) return;
    try {
      const d = await api("/api/sends/" + v.getAttribute("data-view"));
      let det = "";
      for (const x of d.deliveries) det += (x.ok ? "✔ " : "✖ ") + x.channel + " — " + x.detail + "\n";
      showModal('<h3 style="margin-top:0">' + esc(d.send.surah_name || "") + " — آیهٔ " + fa(d.send.ayah) +
        '</h3><pre class="msg">' + esc(d.send.message || "") + '</pre><pre class="msg">' + esc(det) + "</pre>");
    } catch (err) { toast(err.message, "err"); }
  });

  $("btnLogout").onclick = async () => {
    await fetch("/api/logout", { method: "POST" });
    showLogin();
  };

  $("btnPreview").onclick = async () => {
    try {
      const d = await api("/api/preview");
      showModal('<h3 style="margin-top:0">پیش‌نمایش پیام امروز</h3>' +
        '<p class="hint">' + esc(d.surahName) + " — آیهٔ " + fa(d.ayah) + "</p>" +
        '<pre class="msg">' + esc(d.message) + "</pre>" +
        '<p class="hint">در X در ' + fa(d.tweets.length) + " توییت ارسال می‌شود.</p>");
    } catch (e) { toast(e.message, "err"); }
  };

  $("btnSend").onclick = async () => {
    if (!confirm("پیام امروز به همهٔ کانال‌های فعال ارسال شود؟")) return;
    const b = $("btnSend");
    b.disabled = true;
    b.textContent = "در حال ارسال…";
    try {
      const r = await post("/api/send-now", { markToday: true });
      let lines = "";
      for (const x of r.results) {
        const def = S.channelDefs[x.channel];
        lines += (x.ok ? "✔ " : "✖ ") + ((def && def.label) || x.channel) + " — " + x.detail + "\n";
      }
      showModal('<h3 style="margin-top:0">نتیجهٔ ارسال</h3><pre class="msg">' + esc(lines || "بدون نتیجه") + "</pre>");
      await refresh();
    } catch (e) { toast(e.message, "err"); }
    b.disabled = false;
    b.textContent = "ارسال فوری";
  };

  $("modalClose").onclick = hideModal;
  $("modal").addEventListener("click", (e) => { if (e.target.id === "modal") hideModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideModal(); });
}

wire();
boot();
