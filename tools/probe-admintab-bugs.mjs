#!/usr/bin/env node
/**
 * Tái hiện CHÍNH XÁC 2 lỗi người dùng báo trong màn "Phân quyền người dùng"
 * (tab 4 = "Phạm vi dự án & kho", tab 6 = "Ngoại lệ cá nhân").
 *
 * Cách làm: đăng nhập, mở thẳng màn phân quyền bằng cách bấm menu "PHÂN QUYỀN & CẤU HÌNH HỆ THỐNG",
 * rồi bấm từng tab và bắt console error + kiểm tra DOM.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
const profile = resolve(process.env.TEMP || ".", "vntech-artifacts", "probe-admintab");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9341;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1600,1100", "about:blank"],
  { stdio: "ignore" });
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
    errs.push((m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" "));
  if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    errs.push("EXCEPTION: " + (d.exception?.description || d.text || ""));
  }
};
const send = (method, params = {}) => new Promise((res) => { const my = ++id; pending.set(my, res); ws.send(JSON.stringify({ id: my, method, params })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(9000);
if ((await ev("document.body.innerText.length")) < 500) { console.log("❌ chưa đăng nhập được"); process.exit(1); }
console.log("✅ đã đăng nhập");

// mở màn Phân quyền: tìm nút có chữ "PHÂN QUYỀN"
const opened = await ev(`
  (()=>{
    const all=[...document.querySelectorAll('button,a,[role="button"],div[role="menuitem"]')];
    let el=all.find(x=>/PHÂN QUYỀN & CẤU HÌNH|Phân quyền người dùng/i.test(x.innerText||''));
    if(!el){ // mở menu cha trước
      const parent=all.find(x=>/QUẢN TRỊ HỆ THỐNG/i.test(x.innerText||''));
      parent&&parent.click();
      return 'đã mở menu cha, thử lại';
    }
    el.click(); return 'đã bấm: '+(el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,44);
  })()
`);
console.log("mở màn phân quyền:", opened);
await sleep(1500);
if (String(opened).includes("thử lại")) {
  const o2 = await ev(`
    (()=>{const all=[...document.querySelectorAll('button,a,[role="button"]')];
     const el=all.find(x=>/PHÂN QUYỀN & CẤU HÌNH|Phân quyền người dùng/i.test(x.innerText||''));
     if(!el)return 'vẫn không thấy';el.click();return 'đã bấm: '+(el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40)})()
  `);
  console.log("  →", o2);
  await sleep(4000);
}

const tabs = await ev(`[...document.querySelectorAll('.permission-steps button')].map(b=>b.innerText.replace(/\\s+/g,' ').trim())`);
console.log("\ntab:", JSON.stringify(tabs));

if (Array.isArray(tabs) && tabs.length) {
  console.log("\n═══ BẤM TỪNG TAB & BẮT LỖI ═══");
  for (let i = 0; i < tabs.length; i++) {
    errs.length = 0;
    await ev(`(()=>{const bs=[...document.querySelectorAll('.permission-steps button')];bs[${i}]&&bs[${i}].click();return 1})()`);
    await sleep(3500);
    const len = await ev("document.body.innerText.length");
    // Phát hiện "bị đá về trang login" bằng TIÊU ĐỀ trang login, không phải bằng sự tồn tại
    // của input[type=password] (các tab quản trị có ô mật khẩu SMTP/đổi mật khẩu nên dễ dương tính giả).
    const onLogin = await ev(`/Đăng nhập hệ thống/.test(document.body.innerText) && !document.querySelector('.permission-steps')`);
    const e = errs.filter((x) => !/favicon|DevTools|Download the React/i.test(x));
    const bad = e.length > 0 || onLogin || len < 100;
    console.log(`\n  ${bad ? "❌" : "✅"} TAB ${i + 1}: ${tabs[i].slice(0, 38)}`);
    console.log(`     body=${len} · về trang login=${onLogin} · số lỗi=${e.length}`);
    for (const x of e.slice(0, 3)) console.log(`     ↳ ${x.slice(0, 230)}`);
  }
}

ws.close(); b.kill(); await sleep(600);
try { rmSync(profile, { recursive: true, force: true }); } catch {}
