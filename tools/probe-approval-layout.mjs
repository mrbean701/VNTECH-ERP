#!/usr/bin/env node
// USER 28/09/2026 — CỔNG ĐO BỐ CỤC MÀN «PHIẾU CHỜ DUYỆT» (đọc computed style THẬT trên trình duyệt).
// MỤC TIÊU: ① khung nhập BÌNH LUẬN bị lệch/chồng và lộ chữ «null»  ② 3 khung bên trái–giữa–phải
// có kích thước KHÁC NHAU. ⛔ CHỈ ĐỌC — không INSERT/UPDATE/DELETE, không gọi action nghiệp vụ.
//   node tools/probe-approval-layout.mjs [base] [user] [pass]
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "giamdoc.demo";
const PASS = process.argv[4] || "Vntech@2026";
const ART = join(tmpdir(), "vntech-approval-layout");
const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-${Date.now()}`);
const PORT = 9700 + Math.floor(Math.random() * 400);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });

const cleanup = () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
process.on("exit", cleanup);

const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP headless.");
})();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 90000); });
}
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

try {
  await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
  for (let i = 0; i < 60; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(700); }
  const login = JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}");
  console.log("  login: ok=" + login.ok);
  if (login.ok !== true) { console.error("[BLOCKED] Không đăng nhập được với " + USER); process.exit(2); }
  await send("Page.navigate", { url: BASE });
  for (let i = 0; i < 60; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(700); }
  for (let i = 0; i < 4; i++) {
    const st = await ev(`(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const t=norm("Trung tâm phê duyệt");
      const kids=[...document.querySelectorAll(".sidebar button, .sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")];
      const el=kids.find(e=>norm(e.textContent)===t)||kids.find(e=>norm(e.textContent).includes(t)); if(el){el.click();return "OK";}
      const closed=[...document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false");
      if(closed.length){closed.forEach(b=>b.click());return "EXPANDED";} return "NOT_FOUND";})()`);
    if (st === "OK") break; await sleep(1200);
  }
  for (let i = 0; i < 30; i++) { if (await ev(`!!document.querySelector(".approval-detail-pane")`)) break; await sleep(700); }
  await sleep(1500);

  const m = await ev(`(()=>{
    const R=(e)=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)};};
    const out={};
    // ① KHUNG BÌNH LUẬN
    const c=document.querySelector(".approval-comment");
    out.comment = c ? { rect:R(c), display:getComputedStyle(c).display, position:getComputedStyle(c).position,
      children:[...c.children].map(k=>({tag:k.tagName, cls:k.className, text:(k.textContent||"").trim().slice(0,40), rect:R(k), display:getComputedStyle(k).display, pos:getComputedStyle(k).position})) } : null;
    // ①b TÌM CHỮ "null" TRONG KHUNG GIỮA
    const pane=document.querySelector(".approval-detail-pane");
    if(pane){ const walk=document.createTreeWalker(pane,NodeFilter.SHOW_TEXT); let n; const hits=[];
      while((n=walk.nextNode())){ if((n.nodeValue||"").trim()==="null"||(n.nodeValue||"").trim()==="undefined"){ const el=n.parentElement; hits.push({tag:el.tagName, cls:el.className, rect:R(el), html:(el.outerHTML||"").slice(0,160)}); } }
      out.nullText=hits.slice(0,5); }
    // ② BA KHUNG
    const wb=document.querySelector(".approval-workbench")||document.querySelector(".baseline-approval-workbench");
    out.workbench = wb ? { cls:wb.className, alignItems:getComputedStyle(wb).alignItems, display:getComputedStyle(wb).display,
      cols:getComputedStyle(wb).gridTemplateColumns, rect:R(wb) } : null;
    out.panels = [...document.querySelectorAll(".approval-workbench > .card, .baseline-approval-workbench > .card")].map(p=>({cls:p.className.slice(0,60), rect:R(p), display:getComputedStyle(p).display}));
    return out; })()`);

  console.log("  ── ① KHUNG BÌNH LUẬN ──");
  if (!m.comment) console.log("  🔴 KHÔNG có .approval-comment (có thể user này không được phép duyệt)");
  else {
    console.log("  label: " + JSON.stringify(m.comment.rect) + " display=" + m.comment.display + " position=" + m.comment.position);
    for (const k of m.comment.children) console.log("     <" + k.tag + "> cls=\"" + k.cls + "\" " + JSON.stringify(k.rect) + " display=" + k.display + " pos=" + k.pos + " text=\"" + k.text + "\"");
    const s = m.comment.children.find(k => k.tag === "SPAN"), t = m.comment.children.find(k => k.tag === "TEXTAREA");
    if (s && t) { const overlap = !(t.rect.y >= s.rect.y + s.rect.h || t.rect.y + t.rect.h <= s.rect.y); console.log("     ⇒ CHỒNG LẤN: " + (overlap ? "🔴 CÓ" : "✅ không")); console.log("     ⇒ label cao " + s.rect.h + "px nhưng con vươn tới " + t.rect.y + " ⇒ tràn " + Math.max(0, (t.rect.y + t.rect.h) - (s.rect.y + s.rect.h)) + "px"); }
  }
  console.log("  ── ①b CHỮ null/undefined ──");
  console.log("  " + ((m.nullText || []).length ? JSON.stringify(m.nullText) : "✅ không tìm thấy"));
  console.log("  ── ② BA KHUNG ──");
  console.log("  workbench: " + (m.workbench ? m.workbench.cls + " · align-items=" + m.workbench.alignItems + " · cols=" + m.workbench.cols : "🔴 không tìm thấy"));
  for (const p of m.panels) console.log("     " + JSON.stringify(p.rect) + "  " + p.cls);
  if (m.panels.length >= 3) { const hs = m.panels.map(p => p.rect.h); const same = new Set(hs).size === 1; console.log("     ⇒ chiều cao: " + hs.join(" / ") + "  ⇒ " + (same ? "✅ BẰNG NHAU" : "🔴 KHÁC NHAU (lệch " + (Math.max(...hs) - Math.min(...hs)) + "px)")); }
  process.exit(0);
} catch (e) { console.error("[LỖI] " + e.message); process.exit(2); }
