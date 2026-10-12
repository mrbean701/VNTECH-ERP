// PROBE S03 (vòng 60, lần 4) — KIỂM PA-1 END-TO-END bằng tài khoản ⛔ KHÔNG PHẢI admin.
//   ⭐ ÁP 3 BÀI HỌC: (26) chỉ tin phần HIỂN THỊ · (27) chỉ bấm theo DANH SÁCH TRẮNG · (⭐) IN chẩn đoán TRƯỚC khi bấm.
//   ⭐ AN TOÀN: chỉ mở tài khoản `probe_permsave_*` (tài khoản thử) và bấm Lưu **IDEMPOTENT** (⛔ không tick/đổi ô nào).
//   ⛔ NẾU không tìm thấy thẻ phân quyền/nút Lưu ⇒ TỰ DỪNG (⛔ không bấm bừa).
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:9000";
const USER = "giamdoc.demo", PASS = "Vntech@2026";
const TARGET = "probe_permsave_016264";
const EV = "docs/dsh-mutil-session/SESSION_C/evidence";
mkdirSync(EV, { recursive: true });
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "cprobe-pa1b-" + Date.now());
const PORT = 9979;
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
const net = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Network.responseReceived" && /\/api\/system/.test(m.params?.response?.url || "")) {
    net.push(m.params.response.status);
  }
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
// ⭐ CHI phan tu HIEN THI (bai hoc 26)
const VIS = "(function(s){return [].slice.call(document.querySelectorAll(s)).filter(function(e){var r=e.getBoundingClientRect();return r.width>2&&r.height>2;});})";
const clickSidebar = (needle) =>
  "(function(){var b=[].slice.call(document.querySelectorAll('.sidebar button')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').indexOf(" +
  JSON.stringify(needle) + ")>=0;});if(!b)return 'NO';b.click();return 'OK';})()";

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
for (let i = 0; i < 40; i++) { if ((await ev("document.readyState==='complete'")) === true) break; await sleep(500); }
for (let a = 0; a < 3; a++) {
  const st = await ev("(async function(){try{var r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:" + JSON.stringify(USER) + ",password:" + JSON.stringify(PASS) + "})});return r.status;}catch(e){return 0;}})()");
  if (st === 200) { console.log("  dang nhap: HTTP 200"); break; }
  await sleep(1500);
}
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 60; i++) { if ((await ev("!!document.querySelector('.sidebar')")) === true) break; await sleep(700); }
await sleep(3200);
console.log("  buoc1: " + (await ev(clickSidebar("QUẢN TRỊ HỆ THỐNG"))));
await sleep(1800);
console.log("  buoc2: " + (await ev(clickSidebar("Danh mục"))));
await sleep(3600);

// ⭐ A. IN TAT CA nhan (khong bam)
const labels = await ev(VIS + "('button,[role=tab]').map(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim();})");
console.log("=== A. NHAN HIEN THI (" + (Array.isArray(labels) ? labels.length : 0) + ") ===");
console.log("  " + JSON.stringify((Array.isArray(labels) ? labels : []).slice(0, 30)));
console.log("=== B. TAB trong vung .tabs (hien thi) ===");
const tabLabels = await ev(VIS + "('.tabs button,[role=tab],.tab-strip button').map(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim();})");
console.log("  " + JSON.stringify(tabLabels));
console.log("=== C. dong bang HIEN THI ===");
console.log("  " + JSON.stringify(await ev("(function(){var t=" + VIS + "('tbody tr');return {dong:t.length, coProbe:t.some(function(x){return String(x.textContent||'').indexOf('probe_')>=0;}), coUser:t.some(function(x){return /giamdoc|e2e\\.|probe_/.test(String(x.textContent||''));})};})()")));

// ⭐ D. CHI BAM theo DANH SACH TRANG (bai hoc 27) — ⛔ khong bao gio bam «BAO LOI»
const WHITE = ["Người dùng", "Tài khoản", "Danh mục người dùng", "Phân quyền người dùng", "Người dùng & phân quyền"];
let opened = false;
for (const w of WHITE) {
  if (opened) break;
  const r = await ev("(function(){var T=" + JSON.stringify(w) + ";var bs=" + VIS + "('button,[role=tab]');var b=bs.find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim()===T;});if(!b)return 'NO';b.click();return 'OK';})()");
  if (r !== "OK") continue;
  console.log("  ✅ bam tab trang: «" + w + "»");
  await sleep(1600);
  const info = await ev("(function(){var t=" + VIS + "('tbody tr');return {dong:t.length, coProbe:t.some(function(x){return String(x.textContent||'').indexOf('probe_')>=0;})};})()");
  console.log("     ⇒ dong hien thi=" + (info && info.dong) + " · coProbe=" + (info && info.coProbe));
  if (info && info.coProbe) opened = true;
}
if (!opened) {
  console.log("  ⛔ KHONG thay danh sach nguoi dung (co tai khoan probe) ⇒ ⛔ DUNG, ⛔ khong bam Luu");
  await shot("PA1-4-man-quan-tri-director.png");
} else {
  await shot("PA1-4-danh-sach-nguoi-dung.png");
  console.log("  mo dong " + TARGET + ": " + (await ev("(function(){var T=" + JSON.stringify(TARGET) + ";var trs=" + VIS + "('tbody tr');var r=trs.find(function(x){return String(x.textContent||'').indexOf(T)>=0;});if(!r)return 'KHONG_DONG';var b=[].slice.call(r.querySelectorAll('button')).find(function(x){return /Sửa|Xem|Phân quyền|Quyền/i.test(String(x.textContent||''));});if(!b){r.click();return 'CLICK_DONG';}b.click();return 'OK';})()")));
  await sleep(2800);
  console.log("  tab trong modal (hien thi): " + JSON.stringify(await ev(VIS + "('.modal button,.modal [role=tab],[role=tab]').map(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim();}).filter(function(t){return t&&t.length<46;}).slice(0,16)")));
  for (const w of ["Phân quyền công việc / Chức năng", "Phân quyền công việc", "Chức năng", "Phân quyền"]) {
    const r = await ev("(function(){var T=" + JSON.stringify(w) + ";var bs=" + VIS + "('.modal button,.modal [role=tab],[role=tab],button');var b=bs.find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').trim()===T;});if(!b)return 'NO';b.click();return 'OK';})()");
    if (r === "OK") { console.log("  ✅ mo the: «" + w + "»"); break; }
  }
  await sleep(2400);
  const panel = await ev("(function(){var t=" + VIS + "('.modal .card,.modal section,.modal') ;var txt=t.length?String(t[0].innerText||''):'';return {coBang:/MA TRẬN|Chọn tất cả|Bỏ chọn tất cả/i.test(txt), chuDau:txt.replace(/\\s+/g,' ').slice(0,120)};})()");
  console.log("  the phan quyen: " + JSON.stringify(panel));
  await shot("PA1-5-the-phan-quyen.png");
  if (!panel || panel.coBang !== true) {
    console.log("  ⛔ KHONG thay bang phan quyen ⇒ ⛔ DUNG, ⛔ khong bam Luu");
  } else {
    const btn = await ev("(function(){var bs=" + VIS + "('.modal button');var b=bs.find(function(x){return /^Lưu/i.test(String(x.textContent||'').trim());});if(!b)return 'KHONG_NUT_LUU';b.click();return 'DA_BAM:'+String(b.textContent||'').trim().slice(0,24);})()");
    console.log("  bam Luu (idempotent): " + btn);
    await sleep(4500);
    console.log("  thong bao: " + JSON.stringify(await ev(VIS + "('.inline-alert,.toast,[class*=alert]').map(function(x){return String(x.textContent||'').replace(/\\s+/g,' ').trim();}).filter(function(t){return t.length>6;}).slice(0,3)")));
    await shot("PA1-6-sau-khi-luu.png");
  }
}
console.log("");
console.log("=== PHAN HOI MANG (status) ===");
console.log("  " + JSON.stringify(net));
console.log("  ⇒ co 403: " + net.includes(403));
try { ws.close(); } catch {}
try { child.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
