#!/usr/bin/env node
// USER 28/09/2026 (lần 4) — ĐO 9 MÀN ANH CHỈ. Đã sửa 2 lỗi của bản trước:
//   ① SIDEBAR LÀ ACCORDION: mở nhóm này thì ĐÓNG nhóm khác ⇒ phải MỞ LẠI ngay trước khi bấm mục con.
//   ② Kết quả trùng lặp (38 dòng .row-actions) ⇒ GỘP theo lớp + đếm số lần.
// ⛔ CHỈ ĐỌC.
import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = "admin", PASS = "Admin123456@";
const ART = join(tmpdir(), "vntech-tv3");
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-${Date.now()}`);
const PORT = 9500 + Math.floor(Math.random() * 300);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });
const wsUrl = await (async () => { for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

const DETECT = `(()=>{
  const out=[];
  const vis=(e)=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>3&&r.height>3;};
  for (const el of document.querySelectorAll("div,section,footer,form,fieldset,header")) {
    if(!vis(el)) continue;
    if(el.closest(".sidebar,.nav-tree-group,.nav-children,.tree-nav,.approval-queue-list")) continue;
    const cn=String(el.className||"").toLowerCase();
    if(/nav-|tree-nav|queue-list/.test(cn)) continue;
    const kids=[...el.children].filter(c=>vis(c)&&(c.matches("button,input,select,textarea")||c.matches("a.secondary,a.primary,a.export-mini")));
    if(kids.length<2) continue;
    const tops=[...new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/8)))].sort((a,b)=>a-b);
    // ĐẾM HÀNG ĐÚNG CÁCH: gom theo TÂM Y sai số 10px. Đếm theo top chia 8 là SAI vì nút và ô nhập
    // cao khác nhau ⇒ top lệch vài px ⇒ báo nhầm "2 HÀNG" cho thanh chỉ có MỘT hàng.
    const topsC=kids.map(k=>{const r=k.getBoundingClientRect();return r.top+r.height/2;}).sort((a,b)=>a-b);
    const rowsC=[topsC[0]];
    for(const cy of topsC.slice(1)) if(cy-rowsC[rowsC.length-1]>10) rowsC.push(cy);
    const rowsReal=rowsC.length;
    const rawRows=tops.length;
    if(rowsReal<2) continue;
    const c=getComputedStyle(el); const r=el.getBoundingClientRect();
    out.push({ cls:String(el.className||"").slice(0,58), n:kids.length, rows:rowsReal, rawRows,
      display:c.display, dir:c.flexDirection, wrap:c.flexWrap, cols:c.gridTemplateColumns.slice(0,52),
      w:Math.round(r.width), h:Math.round(r.height),
      texts:kids.map(k=>String(k.textContent||k.getAttribute("placeholder")||"").trim().replace(/\\s+/g," ").slice(0,16)).filter(Boolean).slice(0,7) });
  }
  return out; })()`;
const SIG = `(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  return n((document.querySelector(".sidebar .active")||{}).textContent).slice(0,36)+"::"+n((document.querySelector(".module-screen h1,.module-screen h2,.screen-title,h1")||{}).textContent).slice(0,40);})()`;

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
if (JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}").ok !== true) { console.error("[BLOCKED]"); process.exit(2); }
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await sleep(1500);

// MỞ nhóm chứa `label` (accordion) rồi bấm mục con. Trả về chữ ký màn.
async function goTo(label) {
  const before = await ev(SIG);
  // 1) mở lần lượt từng nhóm cha cho tới khi thấy mục tiêu
  const total = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < total; i++) {
    const found = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n(${JSON.stringify(label)});
      return [...document.querySelectorAll(".sidebar button")].some(b=>n(b.textContent).includes(T));})()`);
    if (found) break;
    const before2 = await ev(`document.querySelectorAll(".sidebar .nav-child,.sidebar .nav-children button").length`);
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`);
    await sleep(700);
    const after2 = await ev(`document.querySelectorAll(".sidebar .nav-child,.sidebar .nav-children button").length`);
    if (after2 <= before2) { await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`); await sleep(700); }
  }
  const ok = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n(${JSON.stringify(label)});
    const all=[...document.querySelectorAll(".sidebar button")];
    const el=all.find(b=>n(b.textContent)===T)||all.find(b=>n(b.textContent).includes(T));
    if(!el) return false; el.click(); return true;})()`);
  if (!ok) return { changed: false, sig: "KHONG TIM THAY MUC «" + label + "»" };
  for (let i = 0; i < 14; i++) { await sleep(600); const now = await ev(SIG); if (now !== before) return { changed: true, sig: now }; }
  return { changed: false, sig: await ev(SIG) };
}

const TARGETS = [
  ["Quản lý dự án", null], ["Nhà cung cấp", null], ["Phiếu đề nghị mua hàng", null],
  ["Mua hàng & PO", null], ["Đơn hàng đã giao", null], ["Nhập", null],
  ["Cấp phát & hoàn trả", null], ["Quản trị hệ thống", "Tài khoản"], ["Quản trị hệ thống", "Thông báo"],
];
const report = [];
const seenClass = new Map();

for (const [label, tab] of TARGETS) {
  const r = await goTo(label);
  await sleep(1500);
  console.log("  " + (r.changed ? "✅" : "⚠ ") + label + (tab ? " → TAB «" + tab + "»" : "") + "   [" + r.sig + "]");
  let cur = tab;
  if (tab) {
    const tok = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n(${JSON.stringify(tab)});
      const el=[...document.querySelectorAll("[class*=tabs] button,[class*=tabbar] button,[role=tablist] button")].find(b=>n(b.textContent).includes(T));
      if(el){el.click();return true;} return false;})()`);
    if (!tok) { console.log("      ⚠ KHÔNG tìm thấy tab «" + tab + "»"); continue; }
    await sleep(2500);
  }
  let found = [];
  try { found = (await ev(DETECT)) || []; } catch {}
  if (!found.length) { console.log("      ✅ 0 khối nhiều hàng"); continue; }
  const uniq = new Map();
  for (const f of found) { const k = f.cls; if (!uniq.has(k)) uniq.set(k, { ...f, count: 0 }); uniq.get(k).count++; }
  for (const [k, f] of uniq) {
    console.log("      🔴 ." + k + "  ×" + f.count + "  · " + f.n + " điều khiển · " + f.rows + " HÀNG · " + f.display + " dir=" + f.dir + " wrap=" + f.wrap + " cols=" + f.cols + " · " + f.w + "×" + f.h);
    console.log("         " + f.texts.join(" | "));
    seenClass.set(k, (seenClass.get(k) || 0) + f.count);
    report.push({ screen: label + (tab ? " → " + tab : ""), ...f });
  }
}
console.log("  ══════ GỘP TOÀN BỘ ══════");
for (const [k, v] of [...seenClass.entries()].sort((a, b) => b[1] - a[1])) console.log("     " + v + "×  ." + k);
writeFileSync(join(ART, "ket-qua.json"), JSON.stringify(report, null, 2), "utf8");
process.exit(0);
