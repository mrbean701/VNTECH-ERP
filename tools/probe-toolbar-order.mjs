#!/usr/bin/env node
// MASTER TASK 3 §IV.4 — CỔNG ĐO THỨ TỰ TOOLBAR CRUD (trên DOM thật).
//
// VÌ SAO CẦN: §IV.4 nêu THỨ TỰ chuẩn
//   Tạo mới → Sửa → Xóa/ngừng sử dụng → Tìm kiếm → Sắp xếp → Bộ lọc → Chọn phạm vi → Xuất Excel → thao tác phụ
// và toolbar phải là HÀNG NGANG (⛔ §IV.2: không được thành cột dọc lệch bên phải ở màn nhỏ).
// Đây là hành vi BỐ CỤC ⇒ chỉ đọc được trên trình duyệt, đọc mã nguồn KHÔNG đủ.
//
// CHỈ ĐỌC: không gọi action nghiệp vụ, không sửa dữ liệu.
//   node tools/probe-toolbar-order.mjs [base] [user] [pass] [menuLabel]
// exit 0 = ĐẠT · exit 1 = HẠNG · exit 2 = BLOCKED
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const MENU = process.argv[5] || "";

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }

const profile = join(tmpdir(), `vntech-mt3-toolbar-${Date.now()}`);
const PORT = 9800 + Math.floor(Math.random() * 150);
const child = spawn(exe, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu",
  "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

// ⚠️ BÀI HỌC: phải dùng CỔNG CỐ ĐỊNH + /json/list để lấy target **PAGE**.
//    (port 0 ⇒ ws là endpoint BROWSER ⇒ Page.navigate vô tác dụng.)
const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chưa mở cổng */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Không kết nối được CDP");
})();

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 60000); });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "lỗi JS");
  return r.result.value;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEASURE = `(()=>{
  const boxes=[...document.querySelectorAll(".list-toolbar")];
  const x=(e)=>e?Math.round(e.getBoundingClientRect().left):null;
  const measure=(tb)=>{
    const primary=tb.querySelector(".list-toolbar-primary");
    const controls=tb.querySelector(".list-toolbar-controls");
    const secondary=tb.querySelector(".list-toolbar-secondary");
    const kids=[...tb.children].filter(e=>getComputedStyle(e).display!=="none");
    const tops=new Set(kids.map(e=>Math.round(e.getBoundingClientRect().top)));
    const fields=[...tb.querySelectorAll(".list-toolbar-field")].map(x).filter(v=>v!==null);
    return {
      title:((tb.querySelector(".list-toolbar-title strong")||{}).textContent||"").trim(),
      hasPrimary:!!primary, hasSecondary:!!secondary,
      primaryX:x(primary), controlsX:x(controls), secondaryX:x(secondary),
      searchX:x(tb.querySelector(".list-toolbar-search")),
      sortX:x(tb.querySelector(".list-toolbar-sort")),
      fieldXs:fields,
      rowCount:tops.size,
      buttons:[...tb.querySelectorAll("button")].map(b=>String(b.textContent||"").trim()).filter(Boolean),
    };
  };
  return { found: boxes.length>0, count: boxes.length, viewport:{w:window.innerWidth,h:window.innerHeight}, toolbars: boxes.map(measure) };
})()`;

try {
  await send("Page.enable"); await send("Runtime.enable");
  await sleep(2500);
  const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});const t=await r.text();return JSON.stringify({status:r.status,body:t.slice(0,200)});})()`);
  const raw = JSON.parse(login || "{}");
  console.log(`   POST /api/system {action:"login"} → HTTP ${raw.status}`);
  let ok = false; try { ok = JSON.parse(raw.body || "{}").ok === true; } catch {}
  if (!ok) { console.error("[BLOCKED] Không đăng nhập được."); process.exit(2); }
  await send("Page.navigate", { url: BASE });
  for (let i = 0; i < 60; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(700); }

  const measured = [];
  // Nếu có tên m���c thì mở mục đó; nếu không thì QUÉT tất cả mục đang hiện trên sidebar.
  const labels = MENU ? [MENU] : await ev(`[...document.querySelectorAll(".sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")].map(e=>String(e.textContent||"").trim()).filter(t=>t && t.length<60).slice(0,10)`);
  for (const label of labels) {
    await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const t=n(${JSON.stringify(label)});
      const kids=[...document.querySelectorAll(".sidebar button, .sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")];
      const el=kids.find(e=>n(e.textContent)===t)||kids.find(e=>n(e.textContent).includes(t)); if(el) el.click(); return !!el;})()`);
    await sleep(1400);
    const r = await ev(MEASURE);
    if (r && r.found) measured.push({ label, ...r });
  }
  if (!measured.length) { const r = await ev(MEASURE); if (r && r.found) measured.push({ label: "(màn mặc định)", ...r }); }

  console.log("=== ĐO TOOLBAR (MT3 §IV.4) ===");
  console.log(JSON.stringify(measured.map(x => ({ label: x.label, viewport: x.viewport, count: x.count, toolbars: x.toolbars })), null, 2));

  const problems = [];
  let checked = 0;
  for (const page of measured) {
    for (const [i, t] of page.toolbars.entries()) {
      checked++;
      const id = `«${page.label}» toolbar#${i + 1}${t.title ? ` [${t.title}]` : ""}`;
      if (t.hasPrimary && t.primaryX !== null && t.controlsX !== null && t.primaryX > t.controlsX)
        problems.push(`${id}: §IV.4 — hành động chính (Tạo·Sửa·Xóa) phải TRƯỚC Tìm/Sắp xếp/Lọc`);
      if (t.searchX !== null && t.sortX !== null && t.searchX > t.sortX) problems.push(`${id}: §IV.4 — Tìm kiếm phải TRƯỚC Sắp xếp`);
      if (t.sortX !== null && t.fieldXs.some(v => v > t.sortX)) problems.push(`${id}: §IV.4 — Sắp xếp phải TRƯỚC Bộ lọc`);
      if (t.hasSecondary && t.secondaryX !== null && t.controlsX !== null && t.secondaryX < t.controlsX)
        problems.push(`${id}: §IV.4 — hành động phụ (Xuất Excel) phải ở CUỐI toolbar`);
      if (t.rowCount > 1) problems.push(`⛔ §IV.2: ${id} bị bẻ thành ${t.rowCount} hàng ở ${page.viewport.w}px — phải hàng ngang`);
    }
  }
  if (!checked) { console.error("❌ HẠNG: không đo được toolbar nào (mở sai màn?)."); process.exit(1); }
  if (problems.length) { console.error(`❌ HẠNG (${checked} toolbar):\n - ` + problems.join("\n - ")); process.exit(1); }
  console.log(`✅ ĐẠT  ${checked} toolbar trên ${measured.length} màn: [Tạo·Sửa·Xóa] → Tìm → Sắp xếp → Lọc → [Xuất Excel · phụ], hàng ngang, không vỡ cột dọc.`);
} finally {
  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
