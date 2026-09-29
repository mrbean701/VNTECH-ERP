#!/usr/bin/env node
// USER 28/09/2026 (lần 3) — ĐO 9 MÀN ANH CHỈ: nhóm nút search/sort/filter/CRUD đang XẾP DỌC.
// SỬA LỖI ĐIỀU HƯỚNG của bản trước: bấm menu xong ĐO NGAY ⇒ màn chưa đổi ⇒ MỌI màn ra cùng kết quả.
//   Lần này: bấm → CHỜ tới khi màn ĐỔI THẬT (đọc nhãn mục đang active + tiêu đề màn) → mới đo.
// ⛔ CHỈ ĐỌC — không INSERT/UPDATE/DELETE, không gọi action nghiệp vụ.
//   node tools/probe-toolbar-vertical2.mjs [base] [user] [pass]
import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const ART = join(tmpdir(), "vntech-tv2");
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-${Date.now()}`);
const PORT = 9300 + Math.floor(Math.random() * 400);
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
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

// Chữ ký màn: nhãn mục sidebar đang active + tiêu đề màn.
const SIG = `(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  const act=n((document.querySelector(".sidebar .active")||{}).textContent).slice(0,40);
  const t=n((document.querySelector(".screen-title,.module-screen h1,.module-screen h2,.requests-screen h2,.card h2")||{}).textContent).slice(0,44);
  const first=n((document.querySelector(".module-screen .card, .approval-detail-pane, .requests-screen")||{}).textContent).slice(0,50);
  return act+"||"+t+"||"+first; })()`;

// ĐO khối nhiều HÀNG: ⛔ chỉ loại MENU + DANH SÁCH PHIẾU (KHÔNG loại toolbar/filter/actions).
const DETECT = `(()=>{
  const out=[];
  const vis=(e)=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>3&&r.height>3;};
  for (const el of document.querySelectorAll("div,section,footer,form,fieldset,header,nav")) {
    if(!vis(el)) continue;
    if(el.closest(".sidebar,.nav-tree-group,.nav-children,.tree-nav,.approval-queue-list")) continue;
    const cn=String(el.className||"").toLowerCase();
    if(/nav-|tree-nav|queue-list/.test(cn)) continue;
    const kids=[...el.children].filter(c=>vis(c)&&(c.matches("button,input,select,textarea")||c.matches("a.secondary,a.primary,a.export-mini")));
    if(kids.length<2) continue;
    const tops=[...new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/8)))].sort((a,b)=>a-b);
    if(tops.length<2) continue;
    const c=getComputedStyle(el); const r=el.getBoundingClientRect();
    out.push({ cls:String(el.className||"").slice(0,60), tag:el.tagName, n:kids.length, rows:tops.length,
      display:c.display, dir:c.flexDirection, wrap:c.flexWrap, cols:c.gridTemplateColumns.slice(0,60),
      w:Math.round(r.width), h:Math.round(r.height),
      texts:kids.map(k=>String(k.textContent||k.getAttribute("placeholder")||k.value||"").trim().replace(/\\s+/g," ").slice(0,18)).filter(Boolean).slice(0,8) });
  }
  return out; })()`;

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
const login = JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}");
if (login.ok !== true) { console.error("[BLOCKED] login fail"); process.exit(2); }
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await ev(`(()=>{document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent").forEach(b=>{if(b.getAttribute("aria-expanded")==="false")b.click();});})()`);
await sleep(1800);

// ⚠️ SỬA LỖI ĐIỀU HƯỚNG (đã chẩn đoán): 12 nhóm CHA đang ĐÓNG ⇒ KHÔNG có `.nav-child` trong DOM
//    ⇒ bấm `.nav-parent` chỉ MỞ/ĐÓNG chứ ⛔ không chuyển màn. Phải MỞ LẦN LƯỢT từng nhóm,
//    kiểm tra số mục con TRƯỚC/SAU mỗi lần bấm để ⛔ không bấm đúp (bấm đúp = đóng lại).
async function expandAllGroups() {
  const total = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < total; i++) {
    const cnt = () => ev(`document.querySelectorAll(".sidebar .nav-child, .sidebar .nav-children button").length`);
    const before = await cnt();
    const label = await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}];return b?String(b.textContent||"").trim().slice(0,26):"";})()`);
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`);
    await sleep(800);
    const after = await cnt();
    if (after <= before && label) {
      // bấm lần 1 bị ĐÓNG ⇒ bấm lần 2 để MỞ
      await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`);
      await sleep(800);
    }
    const now = await cnt();
    console.log("     mở nhóm " + (i + 1) + "/" + total + " «" + label + "» → mục con: " + before + " → " + now);
  }
}
await expandAllGroups();
const totalItems = await ev(`document.querySelectorAll(".sidebar button, .sidebar a").length`);
console.log("     TỔNG mục bấm được sau khi mở: " + totalItems);

const TARGETS = ["Quản lý dự án", "Danh sách dự án", "Nhà cung cấp", "Danh mục Nhà cung cấp", "Phiếu đề nghị mua hàng", "Mua hàng & PO", "Đơn hàng đã giao", "Nhập", "Cấp phát & hoàn trả", "Quản trị hệ thống"];
const report = [];

async function clickAndWait(label) {
  const before = await ev(SIG);
  const ok = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n(${JSON.stringify(label)});
    const all=[...document.querySelectorAll(".sidebar button")];
    const el=all.find(b=>n(b.textContent)===T)||all.find(b=>n(b.textContent).includes(T));
    if(!el) return false; el.click(); return true;})()`);
  if (!ok) return { changed: false, sig: before };
  for (let i = 0; i < 16; i++) { await sleep(600); const now = await ev(SIG); if (now !== before) return { changed: true, sig: now, before }; }
  return { changed: false, sig: await ev(SIG), before };
}

for (const t of TARGETS) {
  const r = await clickAndWait(t);
  await sleep(1400);
  const sig = String((r.sig || "")).split("||");
  console.log("  " + (r.changed ? "✅" : "⚠ ") + t + "  →  active=«" + sig[0] + "» · tiêu đề=«" + sig[1] + "»" + (r.changed ? "" : "   ⚠ KHÔNG ĐỔI MÀN"));
  let found = [];
  try { found = (await ev(DETECT)) || []; } catch {}
  for (const f of found) {
    console.log("      🔴 ." + f.cls + " · " + f.n + " điều khiển · " + f.rows + " HÀNG · " + f.display + " dir=" + f.dir + " cols=" + f.cols + " · " + f.w + "×" + f.h);
    console.log("         " + f.texts.join(" | "));
    report.push({ screen: t, active: sig[0], title: sig[1], ...f });
  }
  if (!found.length) console.log("      ✅ 0 khối nhiều hàng");

  // Quét các TAB trong màn (Tài khoản / Thông báo nằm trong Quản trị hệ thống)
  const tabs = await ev(`(()=>[...document.querySelectorAll("[class*=tabs] button,[class*=tabbar] button")].map(b=>String(b.textContent||"").trim().slice(0,24)).filter(Boolean).slice(0,10))()`);
  for (const tb of tabs || []) {
    const bok = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n(${JSON.stringify(tb)});
      const el=[...document.querySelectorAll("[class*=tabs] button,[class*=tabbar] button")].find(b=>n(b.textContent)===T); if(el){el.click();return true;} return false;})()`);
    if (!bok) continue;
    await sleep(2200);
    let ff = [];
    try { ff = (await ev(DETECT)) || []; } catch {}
    if (ff.length) {
      console.log("      🔴 TAB «" + tb + "» → " + ff.length + " khối nhiều HÀNG");
      for (const f of ff) {
        console.log("         ." + f.cls + " · " + f.n + " điều khiển · " + f.rows + " HÀNG · " + f.display + " dir=" + f.dir + " cols=" + f.cols + " · " + f.w + "×" + f.h);
        console.log("            " + f.texts.join(" | "));
        report.push({ screen: t + " → TAB «" + tb + "»", ...f });
      }
    } else console.log("      ✅ TAB «" + tb + "» → 0");
  }
}

console.log("  ══════ TỔNG: " + report.length + " khối nhiều HÀNG ══════");
const byClass = {};
for (const r of report) byClass[r.cls] = (byClass[r.cls] || 0) + 1;
for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) console.log("     " + v + "×  ." + k);
writeFileSync(join(ART, "ket-qua.json"), JSON.stringify(report, null, 2), "utf8");
process.exit(0);
