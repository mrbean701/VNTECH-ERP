#!/usr/bin/env node
// USER 28/09/2026 (v2) — XÁC NHẬN: LABEL nằm TRÊN, TOOLBAR nằm DƯỚI, và các nút trong
// toolbar nằm NGANG 1 HÀNG. Đo trên các màn thật. ⛔ CHỈ ĐỌC.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "vntech-2tier", `edge-${Date.now()}`);
const PORT = 9600 + Math.floor(Math.random() * 300);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });
const wsUrl = await (async () => { for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

const SIG = `(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  return n((document.querySelector(".sidebar .active")||{}).textContent).slice(0,34)+"::"+n((document.querySelector(".module-screen h1,.module-screen h2,h1")||{}).textContent).slice(0,38);})()`;

// ĐO cấu trúc 2 tầng của .list-toolbar + số hàng của .list-toolbar-controls
const CHECK = `(()=>{
  const out=[];
  for (const bar of document.querySelectorAll(".list-toolbar")) {
    const t=bar.querySelector(":scope > .list-toolbar-title");
    const c=bar.querySelector(":scope > .list-toolbar-controls");
    if(!t||!c) continue;
    const rt=t.getBoundingClientRect(), rc=c.getBoundingClientRect();
    const cs=getComputedStyle(bar), cc=getComputedStyle(c);
    const kids=[...c.children].filter(k=>{const r=k.getBoundingClientRect();return r.width>3&&r.height>3;});
    const ctr=kids.map(k=>{const r=k.getBoundingClientRect();return r.top+r.height/2;}).sort((a,b)=>a-b);
    const rowsC=ctr.length?[ctr[0]]:[]; for(const y of ctr.slice(1)) if(y-rowsC[rowsC.length-1]>10) rowsC.push(y);
    out.push({ titleY:Math.round(rt.top), titleH:Math.round(rt.height),
               ctlY:Math.round(rc.top), ctlH:Math.round(rc.height),
               labelTren: rc.top >= rt.bottom - 2,
               chuyen: rc.top - Math.round(rt.bottom),
               barDir: cs.flexDirection, ctlWrap: cc.flexWrap, ctlDir: cc.flexDirection,
               soHang: rowsC.length, soDieuKhien: kids.length,
               ctlOverflowX: cc.overflowX,
               labelText: (t.textContent||"").trim().replace(/\\s+/g," ").slice(0,44) });
  }
  return out; })()`;

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
if (JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return await r.text();})()`) || "{}").ok !== true) { console.error("[BLOCKED]"); process.exit(2); }
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await sleep(1600);

const TARGETS = ["Nhà cung cấp", "Phiếu đề nghị mua hàng", "Mua hàng & PO", "Đơn hàng đã giao", "Vật tư", "Dự án"];
async function goTo(label) {
  const before = await ev(SIG);
  const nrm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const T = nrm(label);
  const total = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < total; i++) {
    const has = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      return [...document.querySelectorAll(".sidebar button")].some(b=>n(b.textContent).includes(${JSON.stringify(T)}));})()`);
    if (has) break;
    const b4 = await ev(`document.querySelectorAll(".sidebar .nav-child,.sidebar .nav-children button").length`);
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`);
    await sleep(700);
    const af = await ev(`document.querySelectorAll(".sidebar .nav-child,.sidebar .nav-children button").length`);
    if (af <= b4) { await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`); await sleep(700); }
  }
  const ok = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const T=${JSON.stringify(T)};
    const all=[...document.querySelectorAll(".sidebar button")];
    const el=all.find(b=>n(b.textContent)===T)||all.find(b=>n(b.textContent).includes(T));
    if(!el) return false; el.click(); return true;})()`);
  if (!ok) return false;
  for (let i = 0; i < 12; i++) { await sleep(600); if ((await ev(SIG)) !== before) return true; }
  return false;
}

for (const t of TARGETS) {
  const okNav = await goTo(t);
  await sleep(1500);
  const r = await ev(CHECK).catch(() => []);
  if (!r || !r.length) { console.log("  " + (okNav ? "✅" : "⚠ ") + t + " → không có .list-toolbar"); continue; }
  console.log("  " + (okNav ? "✅" : "⚠ ") + t + "  → " + r.length + " list-toolbar");
  for (const m of r) {
    console.log("      " + (m.labelTren ? "✅ LABEL Ở TRÊN" : "🔴 LABEL CHƯA Ở TRÊN") +
      "  · " + (m.soHang === 1 ? "✅ TOOLBAR 1 HÀNG" : "🔴 TOOLBAR " + m.soHang + " HÀNG") +
      "  · " + m.soDieuKhien + " điều khiển");
    console.log("         title y=" + m.titleY + " h=" + m.titleH + " → controls y=" + m.ctlY + " h=" + m.ctlH +
      " (cách nhau " + m.chuyen + "px) · bar=" + m.barDir + " · controls=" + m.ctlDir + "/" + m.ctlWrap + " · overflowX=" + m.ctlOverflowX);
    console.log("         «" + m.labelText + "»");
  }
}
process.exit(0);
