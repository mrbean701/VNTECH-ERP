// PROBE S03 (vòng 59, chẩn đoán) — TÀI KHOẢN ⛔ KHÔNG PHẢI ADMIN (`giamdoc.demo`, director, có `admin_tab_01`+`06`+`11`)
//   nhìn thấy GÌ trong khu vực QUẢN TRỊ HỆ THỐNG? (⚠️ nghi cùng lớp `BUG-C13`: mục/tab bị ẩn oan)
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:9000";
const USER = "giamdoc.demo", PASS = "Vntech@2026";
const EV = "docs/dsh-mutil-session/SESSION_C/evidence";
mkdirSync(EV, { recursive: true });
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "cprobe-nav-" + Date.now());
const PORT = 9975;
const child = spawn(exe, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
  "--no-first-run", "--disable-gpu", "--window-size=1500,950", BASE], { stdio: "ignore" });
const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json();
      const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("CDP fail");
})();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (x) => (x.error ? rej(new Error("CDPERR")) : res(x.result)));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error("TIMEOUT")); } }, 30000);
  });
};
const ev = async (expr) => {
  try {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    return r.exceptionDetails ? "JSERR" : r.result.value;
  } catch { return "ERR"; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  try { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(EV, name), Buffer.from(r.data, "base64")); console.log("  ANH: " + name); } catch {}
};
await send("Page.enable");
await send("Runtime.enable");
for (let i = 0; i < 40; i++) { if ((await ev("document.readyState==='complete'")) === true) break; await sleep(500); }
for (let a = 0; a < 3; a++) {
  const st = await ev("(async function(){try{var r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:" + JSON.stringify(USER) + ",password:" + JSON.stringify(PASS) + "})});return r.status;}catch(e){return 0;}})()");
  if (st === 200) break;
  await sleep(1500);
}
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 60; i++) { if ((await ev("!!document.querySelector('.sidebar')")) === true) break; await sleep(700); }
await sleep(3200);
console.log("=== A. NHOM MENU ma tai khoan nay THAY ===");
console.log("  " + JSON.stringify(await ev("[].slice.call(document.querySelectorAll('.sidebar button')).map(function(b){return String(b.querySelector('span')?b.querySelector('span').textContent:'').trim();}).filter(function(s){return s && s===s.toUpperCase();})")));
await ev("(function(){var b=[].slice.call(document.querySelectorAll('.sidebar button')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').indexOf('QUẢN TRỊ HỆ THỐNG')>=0;});if(b)b.click();return 'ok';})()");
await sleep(2000);
console.log("=== B. MUC con sau khi mo nhom QUAN TRI ===");
console.log("  " + JSON.stringify(await ev("[].slice.call(document.querySelectorAll('.sidebar button')).map(function(b){return String(b.querySelector('span')?b.querySelector('span').textContent:'').trim();}).filter(function(s){return s && s!==s.toUpperCase();})")));
await ev("(function(){var b=[].slice.call(document.querySelectorAll('.sidebar button')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').indexOf('Danh mục')>=0;});if(b)b.click();return 'ok';})()");
await sleep(3400);
console.log("=== C. TAB / NUT tren man QUAN TRI (nhan that) ===");
console.log("  " + JSON.stringify(await ev("[].slice.call(document.querySelectorAll('button,[role=tab]')).map(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim();}).filter(function(t){return t && t.length<46;}).slice(0,40)")));
console.log("=== D. tieu de man + co chu «nguoi dung» khong? ===");
console.log("  tieu de: " + JSON.stringify(await ev("[].slice.call(document.querySelectorAll('h1,h2,h3')).map(function(x){return String(x.textContent||'').trim().slice(0,60);}).slice(0,8)")));
const probeTxt = await ev("(function(){var t=document.body.innerText;return {coTuKhoaNguoiDung:/người dùng|tài khoản/i.test(t), coBang:/<table|<tbody/i.test(document.body.innerHTML), soDongBang:document.querySelectorAll('tbody tr').length, coProbe:t.indexOf('probe_')>=0};})()");
console.log("  " + JSON.stringify(probeTxt));
console.log("=== E. tab nao chua bang nguoi dung? (thu tung tab) ===");
const tabs = await ev("[].slice.call(document.querySelectorAll('button,[role=tab]')).map(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim();}).filter(function(t){return t && t.length<46;}).slice(0,40)");
for (const t of (Array.isArray(tabs) ? tabs : [])) {
  const r = await ev("(function(){var T=" + JSON.stringify(t) + ";var b=[].slice.call(document.querySelectorAll('button,[role=tab]')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim()===T;});if(!b)return 'NO';b.click();return 'OK';})()");
  if (r !== "OK") continue;
  await sleep(900);
  const info = await ev("(function(){return {dong:document.querySelectorAll('tbody tr').length, coProbe:document.body.innerText.indexOf('probe_')>=0, chuDau:String(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,80)};})()");
  console.log("   · «" + t + "» ⇒ dong=" + (info && info.dong) + " · coProbe=" + (info && info.coProbe));
}
await shot("PA1-0-man-quan-tri-tai-khoan-director.png");
try { ws.close(); } catch {}
try { child.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
