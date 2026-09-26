#!/usr/bin/env node
// VNTECH ERP V5.3.0 — MT2-P5-01 + MT2-P5-02 (§3.1) — BẰNG CHỨNG **DOM LÚC CHẠY** (headless Edge/Chrome).
//
// VÌ SAO CÓ TỆP NÀY: `tests/p5-01-work-menu-dashboard.test.mjs` chỉ chứng minh ở TẦNG NGUỒN.
// Câu hỏi của §3.1 là: «bundle ĐANG PHỤC VỤ (:9000/:8787) có thật sự đưa DASHBOARD LÊN ĐẦU nhóm menu
// «Công việc» và click vào đó mở ĐÚNG tab Dashboard hay chưa?» ⇒ phải đo bằng trình duyệt THẬT.
//
// ĐO 3 ĐIỀU (đúng §3.1, ⛔ không tự thêm tiêu chí):
//   ① Nhóm menu «Công việc» có mục «Dashboard» ĐỨNG ĐẦU (§3.1 ②) — đọc DOM thật, in NGUYÊN VĂN thứ tự.
//   ② Click mục «Dashboard» ⇒ WorkCenter render + tab «Dashboard» ĐANG CHỌN (`aria-selected="true"`) (P5-01).
//   ③ ĐỐI CHỨNG ÂM: click mục «Cá nhân» ⇒ tab đang chọn ĐỔI sang «Cá nhân» ⇒ chứng minh phép đo PHÂN BIỆT
//      được tab, ⛔ không phải «thấy chữ Dashboard ở đâu cũng ĐẠT».
//
// CHỈ ĐỌC: probe chỉ GET + click điều hướng. ⛔ KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE, ⛔ không gọi action nghiệp vụ.
//
//   node tools/probe-p5-dashboard-menu.mjs [base] [user] [pass]
//
// exit 0 = ĐẠT (3/3) · exit 1 = HỎNG · exit 2 = BLOCKED (không đăng nhập / không render vỏ ứng dụng)

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/+$/, "");
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9901 + Math.floor(Math.random() * 90);
const ART = join(tmpdir(), "vntech-p5-dashboard");
mkdirSync(ART, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => existsSync(p));
if (!EDGE) {
  console.error("[BLOCKED] Không tìm thấy Microsoft Edge/Chrome headless trên máy này.");
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-p5-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

async function cdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch { /* chưa mở cổng */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của trình duyệt headless.");
}

const ws = new WebSocket(await cdp());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}
async function waitFor(expr, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await ev(`Boolean(${expr})`)) return true; } catch { /* trang đang chuyển */ }
    await sleep(300);
  }
  return false;
}
async function shot(name) {
  try { const r = await send("Page.captureScreenshot", { format: "png" }); const p = join(ART, name + ".png"); writeFileSync(p, Buffer.from(r.data, "base64")); return p; }
  catch { return "(không chụp được)"; }
}
let fails = 0;
function mark(name, ok, detail) {
  if (!ok) fails++;
  console.log(`  ${ok ? "✅ ĐẠT" : "❌ HỎNG"}  ${name}${detail ? "\n            " + detail : ""}`);
}

try {
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("  MT2-P5-01/P5-02 (§3.1) — ĐO DOM LÚC CHẠY: menu «Công việc» ⇄ tab Dashboard");
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(`  BASE=${BASE} · browser=${EDGE}`);

  // ⚠️ PHẢI nạp BASE trước: tab CDP có thể còn `about:blank` ⇒ `fetch("/api/system")` ⛔ không có base URL ⇒ TypeError.
  await send("Page.navigate", { url: BASE });
  await waitFor(`document.readyState==="complete"`, 30000);

  console.log("\n▸ ĐĂNG NHẬP bằng CHÍNH action `login` của ứng dụng");
  const loginHttp = await ev(`(async()=>{
    const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});
    return r.status;
  })()`);
  console.log(`   POST /api/system {action:"login"} → HTTP ${loginHttp}`);
  if (loginHttp !== 200) { console.log("  ⛔ BLOCKED — không có phiên đăng nhập."); process.exit(2); }

  let shell = false;
  for (let i = 0; i < 3 && !shell; i++) {
    await send("Page.navigate", { url: BASE });
    shell = await waitFor(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`, 30000);
  }
  if (!shell) { console.log("  ⛔ BLOCKED — vỏ ứng dụng KHÔNG render .sidebar/.nav-tree-group."); process.exit(2); }
  console.log("   ✅ Vỏ ứng dụng đã render");

  // ⓐ §3.1 ① — LỐI VÀO DASHBOARD ĐẦU TIÊN trong sidebar (mục «TỔNG QUAN ĐIỀU HÀNH» = `button.nav-dashboard-direct`)
  const firstItem = JSON.parse(await ev(`(()=>{
    const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
    const first=document.querySelector(".sidebar .tree-nav > *");
    return JSON.stringify({ cls:String(first&&first.className||""), text:norm(first&&first.textContent) });
  })()`));
  mark("§3.1 ① — mục ĐẦU TIÊN của sidebar là lối vào Dashboard (`nav-dashboard-direct`)",
    /nav-dashboard-direct/.test(firstItem.cls) && /TỔNG QUAN ĐIỀU HÀNH/i.test(firstItem.text),
    `phần tử đầu tiên: <${firstItem.cls}> «${firstItem.text}»`);

  // ⚠️ PHẢI SCOPE vào ĐÚNG tablist của WorkCenter (`.project-scope-tabs`) — trên trang còn tablist KHÁC
  //    (đã đo: truy vấn không scope trả về tab «Danh sách vật tư» của màn khác ngay từ đầu).
  const activeTab = async () => ev(`(()=>{
    const t=[...document.querySelectorAll('.project-scope-tabs [role="tab"][aria-selected="true"]')].map(e=>String(e.textContent||"").trim());
    return t.length?t[0]:null;
  })()`);
  const waitActiveTab = (label, ms = 25000) => waitFor(
    `[...document.querySelectorAll('.project-scope-tabs [role="tab"][aria-selected="true"]')].some(e=>String(e.textContent||"").trim()===${JSON.stringify(label)})`, ms);

  // ⓑ §3.1 ① — ĐO QUA ĐƯỜNG NHÓM MENU (đúng câu chữ §3.1): mở «Công việc» ⇒ bấm mục «Dashboard» ⇒ tab Dashboard.
  //    ⚠️ ĐO ĐƯỢC: mục «TỔNG QUAN ĐIỀU HÀNH» (`nav-dashboard-direct`) ⛔ KHÔNG mở WorkCenter (tablist rỗng)
  //    — nó là lối vào màn dashboard RIÊNG của vỏ ứng dụng; vì vậy phép đo TAB phải đi qua mục con «Dashboard».
  const p1 = await shot("p5-before-click");

  // ⓒ §3.1 ② — MỞ nhóm «Công việc» ⇒ mục «Dashboard» ĐỨNG ĐẦU nhóm (đọc DOM thật)
  // ⚠️ ĐO ĐƯỢC: menu là ACCORDION (mở nhóm này ⇒ nhóm khác đóng) ⇒ chỉ bấm ĐÚNG nhóm «Công việc».
  await ev(`(()=>{
    const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    const b=[...document.querySelectorAll(".sidebar button.nav-parent")].find(x=>norm(x.textContent).includes("công việc"));
    if(b) b.click(); return !!b; })()`);
  await sleep(2500);
  const order = JSON.parse(await ev(`(()=>{
    const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
    // ĐO THEO SECTION: mục con nằm trong div.nav-children của CHÍNH section nhóm đó.
    // ⚠️ BÀI HỌC: ⛔ KHÔNG viết backtick trong chú thích nằm TRONG template literal — nó ĐÓNG chuỗi sớm
    //    (đã trả giá: lỗi "tree is not defined" khi chú thích chứa tên lớp có backtick).
    const secs=[...document.querySelectorAll(".sidebar section.nav-tree-group")];
    const sec=secs.find(s=>norm(s.querySelector("button.nav-parent")?.textContent).toLowerCase().includes("công việc"));
    if(!sec) return JSON.stringify({found:false, groups:secs.map(s=>norm(s.querySelector("button.nav-parent")?.textContent))});
    const kids=[...sec.querySelectorAll(".nav-child")].map(e=>norm(e.textContent));
    return JSON.stringify({found:true, header:norm(sec.querySelector("button.nav-parent").textContent), kids});
  })()`));
  mark("§3.1 ② — nhóm «Công việc» (đã mở): mục ĐẦU TIÊN là «Dashboard»",
    order.found && order.kids[0] === "Dashboard",
    order.found ? `thứ tự DOM thật: ${order.kids.join(" → ") || "(rỗng)"}` : `KHÔNG thấy nhóm «Công việc»; các nhóm: ${JSON.stringify(order.groups)}`);

  // ⓓ §3.1 ① — BẤM mục con «Dashboard» của nhóm «Công việc» ⇒ WorkCenter hiện ĐÚNG tab «Dashboard»
  const clickedDash = await clickMenuChild("Dashboard");
  const dashTabOk = clickedDash && await waitActiveTab("Dashboard");
  mark("§3.1 ① — click mục «Dashboard» (nhóm Công việc) ⇒ tab «Dashboard» ĐANG CHỌN", Boolean(dashTabOk),
    `tab đang chọn: ${JSON.stringify(await activeTab())}`);
  const p2 = await shot("p5-dashboard-tab");

  // ⓔ ĐỐI CHỨNG ÂM — click mục con «Cá nhân» ⇒ tab đang chọn ĐỔI (chứng minh phép đo PHÂN BIỆT được tab)
  async function clickMenuChild(label) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await ev(`(()=>{
        const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
        const kids=[...document.querySelectorAll(".sidebar .nav-child")];
        const el=kids.find(e=>norm(e.textContent)===norm(${JSON.stringify(label)}));
        if(el){ el.click(); return "OK"; }
        [...document.querySelectorAll(".sidebar button.nav-parent")].forEach(b=>b.click());
        return "EXPANDED";
      })()`);
      if (r === "OK") return true;
      await sleep(1000);
    }
    return false;
  }
  const clickedPersonal = await clickMenuChild("Cá nhân");
  const personalTabOk = clickedPersonal && await waitActiveTab("Cá nhân", 20000);
  mark("ĐỐI CHỨNG ÂM — click mục «Cá nhân» ⇒ tab đang chọn ĐỔI sang «Cá nhân»", Boolean(personalTabOk),
    `tab đang chọn: ${JSON.stringify(await activeTab())}`);

  console.log(`\n  Ảnh bằng chứng: ${p1} · ${p2}`);
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(fails === 0
    ? "  KẾT LUẬN: §3.1 ĐẠT trên bundle ĐANG PHỤC VỤ (4/4) ✅"
    : `  KẾT LUẬN: ${fails} phép đo HỎNG ✗`);
} catch (e) {
  console.log(`  ⛔ BLOCKED — ${e && e.message ? e.message : e}`);
  process.exit(2);
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { child.kill(); } catch { /* ignore */ }
}
process.exit(fails === 0 ? 0 : 1);
