#!/usr/bin/env node
// MASTER TASK 3 §IV.2 / §VII — CỔNG ĐO RESPONSIVE Ở 5 MỨC RỘNG BẮT BUỘC: 320 · 375 · 768 · 1024 · 1440 px.
//
// TIÊU CHÍ ĐO (theo đúng MT3 §IV.2, ⛔ không tự phát):
//   1. Không tràn viewport            → document.scrollWidth <= window.innerWidth (+1px dung sai)
//   2. Không che nội dung/nút        → không có phần tử nào tràn sang phải quá viewport
//   3. Bảng rộng cuộn TRONG vùng bảng → .table-wrap phải overflow-x:auto|scroll
//   4. Tab dài cuộn ngang            → vùng tab overflow-x:auto khi nội dung dài hơn vùng
//   5. Modal không vượt viewport      → .modal/.drawer chiều rộng <= viewport
//   6. Toolbar không thành CỘT DỌC lệch phải → nút trong toolbar phải nằm ngang khi đủ rộng
//
// CHỈ ĐỌC: không gọi action nghiệp vụ, không sửa dữ liệu.
//   node tools/probe-responsive-5widths.mjs [base] [user] [pass] [menuLabel]
// exit 0 = ĐẠT · exit 1 = HẠNG · exit 2 = BLOCKED
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const MENU = process.argv[5] || "";
const WIDTHS = [320, 375, 768, 1024, 1440];
const HEIGHT = 900;

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }

const profile = join(tmpdir(), `vntech-mt3-resp-${Date.now()}`);
const PORT = 9700 + Math.floor(Math.random() * 150);
const child = spawn(exe, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu",
  `--window-size=${WIDTHS[WIDTHS.length - 1]},${HEIGHT}`, BASE,
], { stdio: "ignore" });

// ⚠️ BÀI HỌC: dùng CỐ ĐỊNH port + /json/list để lấy target **PAGE** (port 0 ⇒ endpoint browser).
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

// Đo TRONG trình duyệt ở từng bề rộng (⛔ không đoán bằng CSS).
const MEASURE = (w) => `(()=>{
  const vw=window.innerWidth;
  const docW=document.documentElement.scrollWidth;
  // ⚠️ MT3 §IV.2 CHO PHÉP bảng rộng "cuộn trong vùng bảng" ⇒ phần tử nằm trong một vùng CUỘN
  //    (overflow-x auto/scroll) KHÔNG phải lỗi tràn ⇒ phải loại trừ, nếu không sẽ báo đỏ giả.
  const inScroller=(el)=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
      const cs=getComputedStyle(p); if(cs.overflowX==="auto"||cs.overflowX==="scroll") return true;} return false;};
  const over=[...document.querySelectorAll("body *")].filter(el=>{
    const r=el.getBoundingClientRect();
    if(r.width===0||r.height===0) return false;
    const cs=getComputedStyle(el);
    if(cs.position==="fixed") return false;
    if(r.right<=vw+1.5) return false;
    if(inScroller(el)) return false;           // ⛔ vùng bảng/tab cuộn được ⇒ không tính là tràn
    return true;
  }).slice(0,5).map(el=>({tag:el.tagName.toLowerCase(),cls:String(el.className||"").slice(0,48),right:Math.round(el.getBoundingClientRect().right)}));
  // 2) bảng: vùng bọc phải cuộn được
  const wrap=document.querySelector(".table-wrap");
  // 3) vùng tab
  const tabbar=document.querySelector(".project-scope-tabs, .inventory-tabs, .switch-tabs, [role='tablist']");
  // 4) modal/drawer nếu đang mở
  const modal=document.querySelector(".modal, .drawer");
  // 5) toolbar: các nút có cùng hàng không
  const tb=document.querySelector(".list-toolbar, .table-toolbar");
  const btnRows= tb? [...tb.querySelectorAll("button")].map(b=>Math.round(b.getBoundingClientRect().top)) : [];
  return { vw, docW, overflowBy: docW-vw, over, hasWrap:!!wrap,
    wrapScroll: wrap? getComputedStyle(wrap).overflowX : null,
    hasTabbar:!!tabbar, tabScroll: tabbar? getComputedStyle(tabbar).overflowX : null,
    tabOverflows: tabbar? tabbar.scrollWidth>tabbar.clientWidth+2 : null,
    hasModal:!!modal, modalW: modal? Math.round(modal.getBoundingClientRect().width):null,
    hasToolbar:!!tb, distinctBtnRows: new Set(btnRows).size, btnCount: btnRows.length,
    collapseToggleVisible: (()=>{const b=document.querySelector("[data-vntech='sidebar-collapse-toggle']");
      if(!b) return false; const r=b.getBoundingClientRect(); return r.width>0&&r.height>0;})() };
})()`;

try {
  await send("Page.enable"); await send("Runtime.enable");
  // ⚠️ BÀI HỌC: phải CHỜ trang sẵn sàng + THỬ LẠI trước khi fetch, nếu không sẽ "Failed to fetch".
  for (let i = 0; i < 40; i++) {
    const ready = await ev(`(()=>{try{return document.readyState==="complete" && !!document.body;}catch{return false;}})()`);
    if (ready) break;
    await sleep(500);
  }
  let logged = null;
  for (let attempt = 0; attempt < 3 && !logged; attempt++) {
    const login = await ev(`(async()=>{try{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});const t=await r.text();return JSON.stringify({status:r.status,body:t.slice(0,200)});}catch(e){return JSON.stringify({status:0,body:String((e&&e.message)||"fetch error")});}})()`);
    const raw = JSON.parse(login || "{}");
    if (attempt === 0) console.log(`   POST /api/system {action:"login"} → HTTP ${raw.status}`);
    let ok = false; try { ok = raw.status === 200 && JSON.parse(raw.body || "{}").ok === true; } catch {}
    if (ok) logged = raw; else { console.log(`   thử lại (${raw.status} ${String(raw.body).slice(0, 60)})`); await sleep(1500); }
  }
  if (!logged) { console.error("[BLOCKED] Không đăng nhập được."); process.exit(2); }
  await send("Page.navigate", { url: BASE });
  for (let i = 0; i < 60; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(700); }
  if (MENU) {
    for (let i = 0; i < 8; i++) {
      const done = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const t=n(${JSON.stringify(MENU)});
        const kids=[...document.querySelectorAll(".sidebar button, .sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")];
        const el=kids.find(e=>n(e.textContent)===t)||kids.find(e=>n(e.textContent).includes(t));
        if(el){el.click();return true;}
        const closed=[...document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false");
        if(closed.length){closed.forEach(b=>b.click());return false;}
        return false;})()`);
      if (done) break;
      await sleep(900);
    }
    await sleep(2000);
  }

  const report = [];
  for (const w of WIDTHS) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: HEIGHT, deviceScaleFactor: 1, mobile: w < 768 });
    await sleep(900);
    report.push({ width: w, ...(await ev(MEASURE(w))) });
  }
  await send("Emulation.clearDeviceMetricsOverride", {});

  console.log("=== ĐO RESPONSIVE 5 MỨC RỘNG (MT3 §IV.2) ===");
  for (const r of report) {
    console.log(`--- ${r.width}px --- scrollW=${r.docW} (tràn ${r.overflowBy}px) · bảng cuộn=${r.wrapScroll} · tab cuộn=${r.tabScroll}${r.tabOverflows ? " (đang tràn ngang, đã cuộn)" : ""} · modal=${r.hasModal ? r.modalW + "px" : "—"} · toolbar ${r.btnCount} nút/${r.distinctBtnRows} hàng · nút thu gọn menu=${r.collapseToggleVisible ? "hiện" : "ẩn"}`);
    if (r.over.length) for (const o of r.over) console.log(`    ⛔ TRÀN: <${o.tag} class="${o.cls}"> right=${o.right}px > ${r.width}px`);
  }

  const problems = [];
  for (const r of report) {
    if (r.overflowBy > 1) problems.push(`${r.width}px: tràn ngang ${r.overflowBy}px`);
    if (r.hasWrap && r.wrapScroll !== "auto" && r.wrapScroll !== "scroll") problems.push(`${r.width}px: vùng bảng .table-wrap phải cuộn ngang (hiện ${r.wrapScroll})`);
    if (r.hasModal && r.modalW > r.vw + 1) problems.push(`${r.width}px: modal rộng ${r.modalW}px > viewport ${r.vw}px`);
    if (r.hasTabbar && r.tabOverflows && r.tabScroll !== "auto" && r.tabScroll !== "scroll") problems.push(`${r.width}px: dải tab tràn ngang nhưng không cuộn được (${r.tabScroll})`);
    if (r.hasToolbar && r.btnCount >= 3 && r.distinctBtnRows > 1) problems.push(`${r.width}px: toolbar vỡ thành ${r.distinctBtnRows} hàng (⛔ §IV.2 không được lệch cột dọc)`);
  }
  if (problems.length) { console.error("❌ HẠNG:\n - " + problems.join("\n - ")); process.exit(1); }
  console.log(`✅ ĐẠT  Cả ${WIDTHS.length} mức rộng (${WIDTHS.join(" · ")} px): không tràn viewport · bảng cuộn trong vùng · tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc.`);
} finally {
  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
