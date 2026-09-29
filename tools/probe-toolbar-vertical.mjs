#!/usr/bin/env node
// USER 28/09/2026 (lần 2) — ĐO ĐÚNG 9 MÀN anh chỉ: nhóm nút/lọc search-sort-filter-CRUD đang XẾP DỌC.
// ⛔ Bộ dò TRƯỚC SAI vì lọc bỏ mọi lớp chứa chữ "list" ⇒ bỏ qua chính `.list-toolbar`.
//    Lần này: chỉ loại MENU (sidebar) và DANH SÁCH PHIẾU (.queue-list / .nav-*), KHÔNG loại "toolbar/filter/actions".
// CHỈ ĐỌC — không INSERT/UPDATE/DELETE, không gọi action nghiệp vụ.
//   node tools/probe-toolbar-vertical.mjs [base] [user] [pass]
import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const ART = join(tmpdir(), "vntech-toolbar-v");
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-${Date.now()}`);
const PORT = 9200 + Math.floor(Math.random() * 400);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await (async () => {
  for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); }
  throw new Error("no CDP");
})();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || "")); return r.result.value; };

// ĐO: tìm mọi khối trong vùng nội dung (⛔ trừ sidebar/menu/danh sách phiếu) có ≥2 phần tử điều khiển
// (button/input/select) mà chúng trải trên >1 HÀNG.
const DETECT = `(()=>{
  const out=[];
  const vis=(e)=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>3&&r.height>3;};
  const CTRL="button,input,select,textarea,a.secondary,a.primary";
  for (const el of document.querySelectorAll("div,section,footer,form,fieldset,header")) {
    if(!vis(el)) continue;
    if(el.closest(".sidebar,.nav-tree-group,.nav-children,.tree-nav,.approval-queue-list,.modal-overlay .edm-tabs")) continue;
    const cn=String(el.className||"").toLowerCase();
    if(/nav-|tree-|queue-list|app-shell|screen-grid|layout-root|^card$/.test(cn) && !/toolbar|filter|action|control/.test(cn)) continue;
    const kids=[...el.children].filter(c=>c.matches(CTRL)&&vis(c));
    if(kids.length<2) continue;
    const tops=[...new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/8)))].sort((a,b)=>a-b);
    if(tops.length<2) continue;                        // 1 hàng ⇒ ĐẠT
    const c=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    out.push({ cls:String(el.className||"").slice(0,64), tag:el.tagName, n:kids.length, rows:tops.length,
      display:c.display, dir:c.flexDirection, wrap:c.flexWrap, cols:c.gridTemplateColumns.slice(0,64),
      h:Math.round(r.height), w:Math.round(r.width),
      texts:kids.map(k=>String(k.textContent||k.getAttribute("placeholder")||k.value||"").trim().replace(/\\s+/g," ").slice(0,20)).filter(Boolean).slice(0,8) });
  }
  return out; })()`;

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
const login = JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}");
if (login.ok !== true) { console.error("[BLOCKED] login fail"); process.exit(2); }
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await ev(`(()=>{document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent").forEach(b=>{if(b.getAttribute("aria-expanded")==="false")b.click();});})()`);
await sleep(1600);

const TARGETS = [
  "Quản lý dự án", "Danh sách dự án", "Nhà cung cấp", "Danh mục Nhà cung cấp",
  "Phiếu đề nghị mua hàng", "Mua hàng & PO", "Đơn hàng đã giao", "Nhập",
  "Cấp phát & hoàn trả", "Trung tâm phê duyệt", "Quản trị hệ thống",
];
const clickText = (t) => `(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim();const T=norm(${JSON.stringify(t)});
  const all=[...document.querySelectorAll(".sidebar button")];
  const el=all.find(b=>norm(b.textContent)===T)||all.find(b=>norm(b.textContent).includes(T));
  if(!el) return false; el.click(); return true;})()`;

const report = [];
for (const t of TARGETS) {
  const ok = await ev(clickText(t));
  await sleep(2600);
  let found = [];
  try { found = (await ev(DETECT)) || []; } catch { found = []; }
  if (found.length) {
    console.log("  🔴 " + t + "  → " + found.length + " khối nhiều HÀNG");
    for (const f of found) {
      console.log("      ." + f.cls + " · " + f.n + " điều khiển · " + f.rows + " HÀNG · display=" + f.display + " dir=" + f.dir + " wrap=" + f.wrap + " cols=" + f.cols + " · " + f.w + "×" + f.h);
      console.log("         " + f.texts.join(" | "));
      report.push({ screen: t, ...f });
    }
  } else {
    console.log("  ✅ " + t + "  → 0 khối nhiều hàng");
  }
  // Quét thêm các TAB trong màn (vd Quản trị hệ thống → Tài khoản / Thông báo)
  const tabs = await ev(`(()=>[...document.querySelectorAll("[class*=tabs] button,[class*=tabbar] button")].map(b=>String(b.textContent||"").trim().slice(0,24)).filter(Boolean).slice(0,12))()`);
  for (const tb of tabs || []) {
    const tok = await ev(`(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim();const T=norm(${JSON.stringify(tb)});
      const el=[...document.querySelectorAll("[class*=tabs] button,[class*=tabbar] button")].find(b=>norm(b.textContent)===T); if(el){el.click();return true;} return false;})()`);
    if (!tok) continue;
    await sleep(2000);
    let ff = [];
    try { ff = (await ev(DETECT)) || []; } catch { ff = []; }
    if (ff.length) {
      console.log("  🔴 " + t + " → TAB «" + tb + "»  → " + ff.length + " khối nhiều HÀNG");
      for (const f of ff) {
        console.log("      ." + f.cls + " · " + f.n + " điều khiển · " + f.rows + " HÀNG · dir=" + f.dir + " cols=" + f.cols + " · " + f.w + "×" + f.h);
        console.log("         " + f.texts.join(" | "));
        report.push({ screen: t + " → TAB «" + tb + "»", ...f });
      }
    } else console.log("  ✅ " + t + " → TAB «" + tb + "»  → 0");
  }
}

console.log("  ══════ TỔNG: " + report.length + " khối nhiều HÀNG ══════");
const byClass = {};
for (const r of report) { byClass[r.cls] = (byClass[r.cls] || 0) + 1; }
for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) console.log("     " + v + "×  ." + k);
writeFileSync(join(ART, "ket-qua.json"), JSON.stringify(report, null, 2), "utf8");
console.log("  (chi tiết: " + join(ART, "ket-qua.json") + ")");
process.exit(0);
