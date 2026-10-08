// ĐO (chỉ ĐỌC, ⛔ không lưu): ma trận «Phân quyền công việc / Chức năng» có DÒNG để cấp
// **module `admin`** («Danh mục & phân quyền») — thứ mà menu «QUẢN TRỊ HỆ THỐNG» đòi
// (`app/page.tsx:486-487`) — ⛔ hay không? Và bảng tài khoản có ô TÌM KIẾM / phân trang không?
//
//   node tools/_probe-matrix-rows.mjs [base] [adminUser] [adminPass]

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Edge."); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = join(tmpdir(), `edge-mrows-${Date.now()}`);
mkdirSync(profile, { recursive: true });
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--window-size=1920,1080", BASE], { stdio: "ignore" });

async function cdpTarget() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const p = (await r.json()).find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl; } catch {}
    await sleep(500);
  }
  throw new Error("CDP fail");
}
const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 90000); });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function waitReady(n = 80) {
  for (let i = 0; i < n; i++) {
    const st = await evaluate(`(()=>{if(!document.body)return{b:0,n:0};
      return{b:document.querySelectorAll('button').length,n:document.querySelectorAll('[data-nav-group]').length};})()`);
    if (st.b > 0 && st.n > 0) return true;
    await sleep(500);
  }
  return false;
}

await send("Page.navigate", { url: BASE }); await waitReady(20);
await evaluate(`(async()=>{await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({action:'login',username:${JSON.stringify(ADMIN)},password:${JSON.stringify(ADMIN_PASS)}})})})()`);
await send("Page.navigate", { url: BASE }); await waitReady(80);
await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
  const p=g&&g.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
await sleep(800);
await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
  const k=g&&g.querySelectorAll('.nav-child')[0]; if(k)k.click();})()`);
await sleep(3000);

// ① Bảng tài khoản: có ô tìm kiếm / phân trang không?
const toolbar = await evaluate(`(()=>{
  const ins=[...document.querySelectorAll('input')].map(i=>({type:i.type,ph:i.placeholder||'',name:i.name||'',cls:String(i.className).slice(0,40)}));
  const pager=[...document.querySelectorAll('button,a')].map(b=>(b.innerText||'').trim()).filter(t=>/^(‹|»|‹‹|»»|\\d+|Trang|Sau|Trước)/i.test(t)).slice(0,12);
  const rows=document.querySelectorAll('table tbody tr').length;
  const t1=document.querySelector('table tbody tr');
  return {inputs:ins.slice(0,10), pager, rows, dongDau:(t1?t1.innerText.replace(/\\s+/g,' ').slice(0,80):'')};})()`);
console.log("═══ BẢNG TÀI KHOẢN ═══");
console.log(`  số dòng hiện: ${toolbar.rows} · dòng đầu: ${toolbar.dongDau}`);
console.log(`  input: ${JSON.stringify(toolbar.inputs)}`);
console.log(`  pager: ${JSON.stringify(toolbar.pager)}`);

// ② Mở «Sửa tài khoản» dòng đầu → thẻ phân quyền → DUMP mọi dòng có ô tick
const open = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const row=document.querySelector('table tbody tr'); if(!row)return 'NO_ROW';
  const b=[...row.querySelectorAll('button')].find(x=>norm(x.textContent||'').includes('suataikhoan'));
  if(!b)return 'NO_BTN'; b.click(); return 'OK';})()`);
await sleep(2500);
await evaluate(`(()=>{const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const m=document.querySelector('.modal'); if(!m)return;
  const b=[...m.querySelectorAll('button')].find(x=>norm(x.textContent||'').includes('phanquyencongviec')); if(b)b.click();})()`);
await sleep(2000);

const rows = await evaluate(`(()=>{const m=document.querySelector('.permission-matrix'); if(!m)return null;
  return [...m.querySelectorAll('tbody tr')].map(tr=>{
    const cb=tr.querySelector('input[type=checkbox][name]');
    if(!cb)return null;
    const strong=tr.querySelector('td strong');
    return {cb:cb.name, nhan: strong?String(strong.textContent).trim().slice(0,55):''};
  }).filter(Boolean);})()`);
console.log("");
console.log("═══ MA TRẬN «Phân quyền công việc / Chức năng» ═══");
if (!rows) { console.log("  ⛔ KHÔNG THẤY ma trận (open=" + open + ")"); }
else {
  const khoa = [...new Set(rows.map((r) => r.cb.replace(/^(view|use|create|edit|approve|export)-/, "")))];
  console.log(`  ${rows.length} dòng có ô tick · ${khoa.length} khoá chức năng phân biệt`);
  console.log(`  ⭐ CÓ dòng module «admin» («Danh mục & phân quyền»)? ${khoa.includes("admin") ? "✅ CÓ" : "⛔ KHÔNG"}`);
  const tabRows = rows.filter((r) => /admin_tab_/.test(r.cb));
  console.log("  dòng admin_tab_NN: " + tabRows.length);
  for (const r of tabRows.slice(0, 4)) console.log(`     · ${r.cb} · ${r.nhan}`);
  console.log("  ── 20 khoá đầu ──");
  for (const k of khoa.slice(0, 20)) console.log(`     · ${k}`);
}
ws.close(); child.kill(); process.exit(0);
