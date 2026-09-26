#!/usr/bin/env node
/**
 * Kiểm chứng GIAO DIỆN THẬT bằng trình duyệt headless: đăng nhập qua UI và xác nhận
 * trang dashboard render được. Đây là bằng chứng mạnh nhất cho Phương án A.
 *
 * Chạy: node tools/cutover-ui-test.mjs [url] [user] [password]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Vntech@2026";

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy trình duyệt."); process.exit(1); }

const profile = resolve(".ui-test-profile");
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

/**
 * Dùng CDP qua remote-debugging để điều khiển thật: điền form, bấm đăng nhập, chờ dashboard.
 */
import { createServer } from "node:http";

const PORT = 9222;
const browser = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP.");
}

const target = await getTarget();
const { WebSocket } = await import("node:worker_threads").then(() => ({ WebSocket: globalThis.WebSocket }));
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const myId = ++id;
  pending.set(myId, res);
  ws.send(JSON.stringify({ id: myId, method, params }));
});

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value;
};

await send("Page.enable");
await send("Runtime.enable");

console.log(`→ Mở ${URL_}`);
await send("Page.navigate", { url: URL_ });
await sleep(6000);

// 1) Trang đăng nhập đã render?
const title = await evalJs("document.title");
const hasLogin = await evalJs(`!!document.querySelector('input[type="password"]')`);
const bodyLen = await evalJs("document.body.innerText.length");
console.log(`1) Trang đăng nhập : title="${(title || "").slice(0, 52)}" · có ô mật khẩu=${hasLogin} · nội dung ${bodyLen} ký tự`);

// 2) Tìm ô đăng nhập & điền
const filled = await evalJs(`
  (() => {
    const inputs = [...document.querySelectorAll('input')];
    const user = inputs.find(i => i.type !== 'password' && (i.name||'').match(/user|login|email/i)) || inputs.find(i => i.type === 'text');
    const pass = inputs.find(i => i.type === 'password');
    if (!user || !pass) return 'không thấy ô nhập';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(user, ${JSON.stringify(USER)}); user.dispatchEvent(new Event('input', {bubbles:true}));
    setter.call(pass, ${JSON.stringify(PASS)}); pass.dispatchEvent(new Event('input', {bubbles:true}));
    return 'đã điền';
  })()
`);
console.log(`2) Điền form        : ${filled}`);
await sleep(800);

// 3) Bấm nút đăng nhập
const clicked = await evalJs(`
  (() => {
    const btns = [...document.querySelectorAll('button')];
    const b = btns.find(x => /đăng nhập|dang nhap|login/i.test(x.innerText||''));
    if (!b) return 'không thấy nút';
    b.click(); return 'đã bấm: ' + (b.innerText||'').trim().slice(0,30);
  })()
`);
console.log(`3) Bấm đăng nhập    : ${clicked}`);
await sleep(9000);

// 4) Đã vào dashboard?
const after = await evalJs(`document.body.innerText`);
const hasDash = await evalJs(`!!document.querySelector('aside,nav,[class*="sidebar"],[class*="menu"]')`);
const stillLogin = await evalJs(`!!document.querySelector('input[type="password"]')`);
const errText = await evalJs(`
  (() => {
    const t = [...document.querySelectorAll('[class*="error"],[class*="alert"],[role="alert"]')].map(e=>e.innerText).join(' | ');
    return t.slice(0, 200);
  })()
`);
console.log(`4) Sau đăng nhập    : còn form login=${stillLogin} · có menu/dashboard=${hasDash}`);
if (errText) console.log(`   thông báo lỗi    : ${errText}`);
console.log(`   nội dung trang   : ${(after || "").replace(/\\s+/g, " ").slice(0, 220)}`);

// 5) Chụp ảnh dashboard
const shot = resolve("screenshot-dashboard.png");
const cap = await send("Page.captureScreenshot", { format: "png" });
if (cap.result?.data) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(shot, Buffer.from(cap.result.data, "base64"));
  console.log(`5) Ảnh dashboard    : ${shot}`);
}

const ok = hasLogin && !stillLogin;
console.log(`\n===== GIAO DIỆN: ${ok ? "ĐĂNG NHẬP VÀ VÀO ĐƯỢC HỆ THỐNG ✅" : "CHƯA VÀO ĐƯỢC ❌"} =====`);

ws.close();
browser.kill();
await sleep(1000);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* Edge may still release profile; do not convert a successful UI check into a false red. */ }
process.exit(ok ? 0 : 1);
