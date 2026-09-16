#!/usr/bin/env node
/**
 * Xem UI THẬT đang hiển thị gì: đăng nhập, chụp dashboard, rồi đi qua vài màn hình
 * chính để phát hiện dữ liệu không hiển thị / lỗi mã hoá / lỗi JS.
 *
 * Chạy: node tools/probe-ui-data.mjs [url] [user] [password]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const SHOT = process.argv[5] || "ui-shot";

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
const profile = resolve(process.env.TEMP || ".", "vntech-artifacts", "probe-ui");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9351;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1600,1200", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tgt() {
  for (let i = 0; i < 40; i++) { try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const p = l.find((x) => x.type === "page"); if (p?.webSocketDebuggerUrl) return p;
  } catch {} await sleep(500); } throw new Error("no cdp");
}
const t = await tgt();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const errs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    errs.push((m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  if (m.method === "Runtime.exceptionThrown")
    errs.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || "").slice(0, 200));
};
const send = (m, p = {}) => new Promise((res) => { const my = ++id; pending.set(my, res); ws.send(JSON.stringify({ id: my, method: m, params: p })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => {
  const c = await send("Page.captureScreenshot", { format: "png" });
  if (c.result?.data) { writeFileSync(`${SHOT}-${name}.png`, Buffer.from(c.result.data, "base64")); return true; }
  return false;
};

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);

await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);

const len = await ev("document.body.innerText.length");
const onLogin = await ev(`!!document.querySelector('input[type="password"]')`);
console.log(`đăng nhập: body=${len} · còn form login=${onLogin}`);
if (onLogin) { console.log("❌ KHÔNG đăng nhập được"); ws.close(); b.kill(); process.exit(1); }
console.log("✅ đã đăng nhập\n");

console.log("═══ DASHBOARD HIỂN THỊ GÌ ═══");
console.log((await ev("document.body.innerText"))?.split("\n").filter(Boolean).slice(0, 45).join("\n"));
console.log("\n═══ THẺ SỐ LIỆU (KPI) ═══");
console.log(await ev(`
  [...document.querySelectorAll('[class*="card"],[class*="stat"],[class*="kpi"],[class*="summary"]')]
    .map(e=>(e.innerText||'').replace(/\\s+/g,' ').trim())
    .filter(s=>s && s.length<80).slice(0,14).join('\\n')
`));
await shot("dashboard");

console.log("\n═══ LỖI JS TRÊN DASHBOARD ═══");
const de = errs.filter((x) => !/favicon|DevTools|Download the React/i.test(x));
console.log(de.length ? de.slice(0, 5).map((x) => "  ↳ " + x).join("\n") : "  (không có)");

// Đi qua các màn hình chính để xem có dữ liệu không
console.log("\n═══ ĐI QUA CÁC MÀN HÌNH CHÍNH ═══");
const screens = ["QUẢN LÝ DỰ ÁN", "DANH MỤC VẬT TƯ GỐC", "MUA HÀNG", "KHO VẬT TƯ", "QUẢN TRỊ HỆ THỐNG"];
for (const s of screens) {
  errs.length = 0;
  const r = await ev(`
    (()=>{
      const all=[...document.querySelectorAll('button,a,[role="button"]')];
      let el=all.find(x=>new RegExp(${JSON.stringify(s)},"i").test(x.innerText||''));
      if(!el) return 'không thấy mục';
      el.click(); return 'đã bấm';
    })()
  `);
  await sleep(4000);
  const body = (await ev("document.body.innerText")) || "";
  // đếm "dòng dữ liệu" thô: số dòng có nội dung trong bảng
  const rows = await ev(`document.querySelectorAll('tbody tr').length`);
  const emptyMsg = /không có dữ liệu|chưa có|trống|không tìm thấy/i.test(body);
  const e = errs.filter((x) => !/favicon|DevTools/i.test(x));
  console.log(`\n  ${e.length ? "❌" : (rows > 0 ? "✅" : "⚠️ ")} ${s}  (${r})`);
  console.log(`     hàng bảng=${rows} · có thông báo trống=${emptyMsg} · lỗi=${e.length}`);
  for (const x of e.slice(0, 2)) console.log(`     ↳ ${x}`);
  if (e.length === 0 && rows === 0) {
    console.log(`     nội dung: ${body.replace(/\s+/g, " ").slice(0, 150)}`);
  }
}

ws.close(); b.kill(); await sleep(600);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
console.log("\n(ảnh chụp: " + SHOT + "-dashboard.png)");
