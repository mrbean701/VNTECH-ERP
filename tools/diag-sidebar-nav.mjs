#!/usr/bin/env node
// CHẨN ĐOÁN: vì sao bấm menu KHÔNG chuyển màn? Soi cấu trúc THẬT của sidebar + thử bấm và theo dõi.
// ⛔ CHỈ ĐỌC.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = "admin", PASS = "Admin123456@";
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "vntech-diag", `edge-${Date.now()}`);
const PORT = 9400 + Math.floor(Math.random() * 300);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await (async () => { for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 60000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

await send("Page.enable"); await send("Runtime.enable");
// Bắt lỗi console để biết React có ném lỗi khi bấm hay không.
const errs = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error") errs.push(String(m.params.args?.[0]?.value || "").slice(0, 120)); if (m.method === "Runtime.exceptionThrown") errs.push("EXC: " + String(m.params?.exceptionDetails?.text || "").slice(0, 120)); });
await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
console.log("  login: " + (JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}")).ok);
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await sleep(2000);

console.log("  ── 1. APP SHELL / SIDEBAR ──");
console.log("  " + await ev(`(()=>{const a=document.querySelector(".app-shell,.app-root,body>div");const s=document.querySelector(".sidebar");
  return "appShell=" + (a?a.className:"?") + " | sidebar=" + (s?s.className:"KHONG CO") + " | sidebarW=" + (s?Math.round(s.getBoundingClientRect().width):0);})()`));

console.log("  ── 2. MỌI MỤC BẤM ĐƯỢC TRONG SIDEBAR (30 đầu) ──");
const items = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  return [...document.querySelectorAll(".sidebar button, .sidebar a, .sidebar [role=button]")].slice(0,30)
    .map(e=>({tag:e.tagName, cls:String(e.className||"").slice(0,34), t:n(e.textContent).slice(0,30), r:(x=>Math.round(x.width)+"x"+Math.round(x.height))(e.getBoundingClientRect()), vis:e.getBoundingClientRect().width>2}));})()`);
for (const it of items) console.log("     " + (it.vis ? "●" : "○") + " <" + it.tag + "> ." + it.cls + "  «" + it.t + "»  " + it.r);

console.log("  ── 3. THỬ BẤM «Phiếu đề nghị mua hàng» VÀ THEO DÕI 6 GIÂY ──");
const sig = () => ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  const act=n((document.querySelector(".sidebar .active")||{}).textContent).slice(0,36);
  const h=n((document.querySelector(".module-screen h1,.module-screen h2,.screen-title,h1")||{}).textContent).slice(0,40);
  const lbl=n((document.querySelector(".module-screen, .page, main")||{}).getAttribute?.("data-screen")||"");
  return act + " :: " + h + " :: " + lbl;})()`);
console.log("     TRƯỚC: " + await sig());
const clicked = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();const T=n("Phiếu đề nghị mua hàng");
  const all=[...document.querySelectorAll(".sidebar button, .sidebar a, .sidebar [role=button]")];
  const hit=all.filter(e=>n(e.textContent).includes(T));
  if(!hit.length) return "KHONG TIM THAY (" + all.length + " muc)";
  const el=hit[0];
  try{ el.dispatchEvent(new MouseEvent("mousedown",{bubbles:true})); el.dispatchEvent(new MouseEvent("mouseup",{bubbles:true})); el.click(); }catch(e){ return "LOI BAM: "+e.message; }
  return "DA BAM <" + el.tagName + "> ." + String(el.className||"").slice(0,30);})()`);
console.log("     " + clicked);
for (let i = 1; i <= 6; i++) { await sleep(1000); console.log("     +" + i + "s: " + await sig()); }
console.log("  ── 4. LỖI CONSOLE ──");
console.log("  " + (errs.length ? errs.slice(0, 6).join(" ⏐ ") : "✅ không có lỗi"));
process.exit(0);
