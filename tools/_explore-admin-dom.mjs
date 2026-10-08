// THĂM DÒ DOM — màn «Danh mục & phân quyền» (system_admin) để CHỌN SELECTOR CÓ BẰNG CHỨNG.
// ⛔ Không đoán selector: in ra cấu trúc THẬT rồi mới viết probe E2E.
//
//   node tools/_explore-admin-dom.mjs [base] [user] [pass]

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = join(tmpdir(), `edge-explore-${Date.now()}`);
mkdirSync(profile, { recursive: true });

const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1920,1080", BASE,
], { stdio: "ignore" });

async function cdpTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của Edge.");
}

const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 90000);
  });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

console.log("═══ THĂM DÒ DOM MÀN QUẢN TRỊ ═══");

/** Chờ SPA mount xong: có ít nhất 1 <button> hoặc nav. Trả về số lần thử. */
async function waitReady(nhan, toiDa = 40) {
  for (let i = 1; i <= toiDa; i++) {
    const st = await evaluate(`(()=>{
      if(!document.body) return {b:0,n:0,t:0,ready:document.readyState||'?'};
      const b=document.querySelectorAll('button').length;
      const n=document.querySelectorAll('[data-nav-group],nav,.sidebar').length;
      const t=(document.body.innerText||'').length;
      return {b,n,t,ready:document.readyState};})()`);
    if (st.b > 0 || st.n > 0) return { i, ...st };
    await sleep(500);
  }
  return null;
}

// 1) Đăng nhập bằng fetch (đặt cookie) rồi NẠP LẠI trang
await send("Page.navigate", { url: BASE });
console.log("  chờ trang đầu:", JSON.stringify(await waitReady("lan1", 20)));
const login = await evaluate(`(async()=>{
  const r = await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});
  return r.status;})()`);
console.log("  đăng nhập (fetch):", login);
await send("Page.navigate", { url: BASE });
const rdy = await waitReady("lan2", 60);
console.log("  chờ sau đăng nhập:", JSON.stringify(rdy));
await sleep(2500);

const who = await evaluate(`(()=>{const u=document.querySelector('.user-menu');return u?u.innerText.replace(/\\s+/g,' ').trim().slice(0,80):'KHONG THAY .user-menu';})()`);
console.log("  phiên hiện tại:", who);
const bodyTxt = await evaluate(`(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,220)`);
console.log("  body text     :", bodyTxt);
const navGroups = await evaluate(`[...document.querySelectorAll('[data-nav-group]')].map(e=>e.getAttribute('data-nav-group')).join(' | ')`);
console.log("  nav groups    :", navGroups);

// 2) Bung nhóm system_admin + bấm con đầu
const expand = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="system_admin"]');
  if(!s)return 'NO_GROUP';
  const p=s.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click(); return 'OK';})()`);
await sleep(800);
const nav = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="system_admin"]');if(!s)return 'NO_GROUP';
  const kids=[...s.querySelectorAll('.nav-child')];
  if(!kids.length){const p=s.querySelector('.nav-parent');p.click();return 'DIRECT';}
  const k=kids[0]; k.click(); return 'CLICKED:'+k.innerText.replace(/\\s+/g,' ').trim().slice(0,50);})()`);
console.log("  điều hướng:", expand, "|", nav);
await sleep(3000);

// 3) DUMP cấu trúc
const dump = await evaluate(`(()=>{
  const out = {};
  out.title = (document.querySelector('h1,h2,.page-head,.content-head')||{}).innerText || '';
  out.tabs = [...document.querySelectorAll('[role="tab"],.tab,.tabs button,.admin-tab,[data-admin-tab]')]
    .map(e=>({tag:e.tagName, cls:String(e.className).slice(0,60), txt:(e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,50)}));
  out.buttons = [...document.querySelectorAll('button')]
    .map(e=>({cls:String(e.className).slice(0,40), txt:(e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,45)}))
    .filter(b=>b.txt).slice(0,60);
  out.th = [...document.querySelectorAll('table th')].map(e=>(e.innerText||'').replace(/\\s+/g,' ').trim().slice(0,25)).slice(0,20);
  out.rows = document.querySelectorAll('table tbody tr').length;
  out.checkboxes = [...document.querySelectorAll('input[type=checkbox]')].map(e=>e.name).filter(Boolean).slice(0,12);
  out.hasPermMatrix = Boolean(document.querySelector('.permission-matrix'));
  out.matrixCb = [...document.querySelectorAll('.permission-matrix input[type=checkbox]')].map(e=>e.name).filter(Boolean).slice(0,8);
  return out;})()`);

console.log("\n  TIÊU ĐỀ       :", dump.title.replace(/\s+/g, " ").trim().slice(0, 100));
console.log("  CÓ MA TRẬN    :", dump.hasPermMatrix, "| dòng bảng:", dump.rows);
console.log("  TAB           :", JSON.stringify(dump.tabs, null, 0).slice(0, 700));
console.log("\n  NÚT (60 đầu)  :");
for (const b of dump.buttons) console.log(`      [${b.cls}] "${b.txt}"`);
console.log("\n  TH bảng       :", dump.th.join(" | "));
console.log("  checkbox name :", dump.checkboxes.join(", "));
console.log("  matrix cb name:", dump.matrixCb.join(", "));

// 4) Tìm mọi thứ chứa chữ khoá
const keys = await evaluate(`(()=>{
  const want=['nhân sự','nhansu','sửa tài khoản','phân quyền','người dùng','tài khoản'];
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
  const hits=[];
  for(const el of document.querySelectorAll('button,a,label,[role="tab"],.tab,li')){
    const t=norm(el.innerText||'');
    if(!t||t.length>60)continue;
    if(want.some(w=>t.includes(norm(w)))) hits.push({tag:el.tagName,cls:String(el.className).slice(0,45),txt:(el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,45)});
  }
  return hits.slice(0,30);})()`);
console.log("\n  PHẦN TỬ CHỨA TỪ KHOÁ:");
for (const h of keys) console.log(`      ${h.tag} [${h.cls}] "${h.txt}"`);

ws.close();
child.kill();
process.exit(0);
