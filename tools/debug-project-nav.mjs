// Chẩn đoán: nhóm menu "QUẢN LÝ DỰ ÁN" có mở ra và render module con không?
const BASE = "http://127.0.0.1:9000";
const PORT = 9799;
const { spawn, spawnSync } = await import("node:child_process");
const { existsSync, mkdirSync } = await import("node:fs");
const { join } = await import("node:path");
const { tmpdir } = await import("node:os");
const ART = join(tmpdir(), "vntech-artifacts"); mkdirSync(ART, { recursive: true });
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, "edge-dbg-" + Date.now())}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,900", BASE], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
  await sleep(500);
}
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { pend.set(id, (m) => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("timeout"))), 60000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || "")); return r.result.value; };

await send("Page.enable"); await send("Runtime.enable");
await sleep(2500);
await ev(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'admin',password:'Admin123456@'})});return r.status;})()`);
await send("Page.navigate", { url: BASE });
await sleep(7000);

console.log("=== TRƯỚC khi bấm: các nhóm menu ===");
console.log(await ev(`(()=>{
  return JSON.stringify([...document.querySelectorAll('[data-nav-group]')].map(s=>({
    g:s.getAttribute('data-nav-group'), label:s.getAttribute('data-nav-label'),
    children:s.querySelectorAll('.nav-child').length,
    hasChildrenBox: !!s.querySelector('.nav-children')
  })), null, 1);
})()`));

console.log("\n=== bấm toggle nhóm site_command ===");
console.log(await ev(`(()=>{
  const sec=document.querySelector('[data-nav-group="site_command"]');
  if(!sec) return 'NO_SECTION';
  const btn=sec.querySelector(':scope > button');
  if(!btn) return 'NO_BUTTON';
  const before=btn.getAttribute('aria-expanded');
  btn.click();
  return 'clicked; aria-expanded trước='+before;
})()`));
await sleep(2000);
console.log(await ev(`(()=>{
  const sec=document.querySelector('[data-nav-group="site_command"]');
  const btn=sec.querySelector(':scope > button');
  return JSON.stringify({ariaExpanded:btn?btn.getAttribute('aria-expanded'):null,
    children:sec.querySelectorAll('.nav-child').length,
    childLabels:[...sec.querySelectorAll('.nav-child')].map(x=>x.textContent.trim()),
    innerHTML:(sec.textContent||'').replace(/\\s+/g,' ').slice(0,300)});
})()`));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
