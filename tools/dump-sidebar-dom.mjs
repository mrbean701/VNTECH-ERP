#!/usr/bin/env node
// CHẨN ĐOÁN (đọc-only) — in cấu trúc THẬT của `.sidebar` (tag + class + text ngắn) để viết selector ĐÚNG.
//   node tools/dump-sidebar-dom.mjs [base] [user] [pass]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/+$/, "");
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9801 + Math.floor(Math.random() * 90);
const ART = join(tmpdir(), "vntech-sidebar-dom"); mkdirSync(ART, { recursive: true });
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("no browser"); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-dom-${Date.now()}`)}`, "--no-first-run", "--disable-gpu", BASE], { stdio: "ignore" });
async function cdp() { for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch { } await sleep(500); } throw new Error("no cdp"); }
const ws = new WebSocket(await cdp());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
function send(method, params = {}) { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("timeout"))), 60000); }); }
async function ev(expr) { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; }
async function waitFor(expr, ms = 25000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await ev(`Boolean(${expr})`)) return true; } catch { } await sleep(300); } return false; }

await send("Page.navigate", { url: BASE });
await waitFor(`document.readyState==="complete"`, 30000);
const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
console.log("login HTTP", login);
await send("Page.navigate", { url: BASE });
await waitFor(`!!document.querySelector(".sidebar, .nav-tree-group")`, 40000);
await ev(`(()=>{[...document.querySelectorAll("button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false").forEach(b=>b.click());return true;})()`);
await sleep(1500);
const dump = await ev(`(()=>{
  const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
  const side=document.querySelector(".sidebar")||document.body;
  const rows=[...side.querySelectorAll("*")].slice(0,400).map(e=>e.tagName.toLowerCase()+"."+String(e.className||"").split(" ").filter(Boolean).slice(0,2).join(".")+" | "+norm(e.textContent).slice(0,40));
  const counts={};
  for(const e of side.querySelectorAll("*")){const k=e.tagName.toLowerCase()+"."+String(e.className||"").split(" ")[0];counts[k]=(counts[k]||0)+1;}
  return JSON.stringify({rowCount:rows.length, rows:rows.slice(0,120), counts:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,25)});
})()`);
const parsed = JSON.parse(dump);
console.log("── phổ biến (tag.class → số lượng) ──");
for (const [k, n] of parsed.counts) console.log(`  ${n.toString().padStart(3)}  ${k}`);
console.log("── 120 dòng đầu (tag.class | text) ──");
for (const r of parsed.rows) console.log("  " + r);

// ── BỔ SUNG: (1) mục con theo TỪNG nhóm menu; (2) màn hình sau khi bấm mục Dashboard đầu sidebar ──
const groups = JSON.parse(await ev(`(()=>{
  const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
  const out=[];
  for (const sec of document.querySelectorAll(".sidebar section.nav-tree-group")) {
    const h=sec.querySelector("button.nav-parent");
    out.push({ group:norm(h&&h.textContent), kids:[...sec.querySelectorAll(".nav-child")].map(e=>norm(e.textContent)) });
  }
  // mục con nằm NGOÀI section (nếu có) ⇒ gom theo thứ tự tài liệu
  const flat=[...document.querySelectorAll(".sidebar .nav-child")].map(e=>({
    label:norm(e.textContent),
    wrapper:String(e.closest(".nav-children")?"nav-children":"other"),
    inGroup:norm(e.closest(".nav-tree-group")?.querySelector("button.nav-parent")?.textContent||"")
  }));
  return JSON.stringify({groups:out, flat});
})()`));
console.log("── mục con theo TỪNG section nhóm ──");
for (const g of groups.groups) console.log(`  [${g.group}] → ${g.kids.join(" · ") || "(rỗng)"}`);
console.log("── .nav-child phẳng (nhãn | nơi chứa) ──");
for (const f of groups.flat) console.log(`  «${f.label}» | wrapper=${f.wrapper} | group=${f.inGroup || "(ngoài section)"}`);

await ev(`(()=>{const b=document.querySelector(".sidebar button.nav-dashboard-direct"); if(b) b.click(); return !!b;})()`);
await sleep(2500);
const mainInfo = JSON.parse(await ev(`(()=>{
  const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
  const main=document.querySelector("main")||document.body;
  const heads=[...document.querySelectorAll("h1,h2,h3,.card-head strong,.panel-title")].slice(0,6).map(e=>norm(e.textContent).slice(0,60));
  return JSON.stringify({
    mainCls:String(main.className||"").slice(0,160),
    hasWorkTabs:!!document.querySelector(".project-scope-tabs"),
    activeScopedTab:(()=>{const t=[...document.querySelectorAll('.project-scope-tabs [role="tab"][aria-selected="true"]')];return t.length?norm(t[0].textContent):null;})(),
    activeAnyTab:(()=>{const t=[...document.querySelectorAll('[role="tab"][aria-selected="true"]')];return t.length?norm(t[0].textContent):null;})(),
    headings:heads,
    firstCards:[...document.querySelectorAll("section.card")].slice(0,4).map(e=>norm(e.textContent).slice(0,70))
  });
})()`));
console.log("── SAU KHI BẤM mục Dashboard đầu sidebar ──");
console.log(JSON.stringify(mainInfo, null, 2));
ws.close(); child.kill();
