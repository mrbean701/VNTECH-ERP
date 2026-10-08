// PROBE S03 (vòng 63) — HỒI QUY **TRONG PHẠM VI HR–TEAMS** sau các build mới của phiên khác:
//   ⭐ đăng nhập admin ⇒ mở «Hồ sơ nhân sự» ⇒ mở «Sửa hồ sơ» ⇒ KIỂM 2 TAB (⭐ bản vá CRITICAL C12 còn giữ?)
//   ⇒ rồi mở «Tổ đội»/Teams ⇒ xem màn có render không.
//   ⚠️ AN TOÀN: ⛔ KHÔNG bấm Lưu (chỉ mở/đọc) ⇒ ⛔ không ghi dữ liệu.
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:9000", USER = "admin", PASS = "Admin123456@";
const EV = "docs/dsh-mutil-session/SESSION_C/evidence";
mkdirSync(EV, { recursive: true });
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "cprobe-hr-" + Date.now());
const PORT = 9981;
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
// ⭐ bấm theo DANH SÁCH TRẮNG (luật 27) — sidebar/leaf/tab
const clickSidebar = (needle) =>
  "(function(){var b=[].slice.call(document.querySelectorAll('.sidebar button')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').indexOf(" +
  JSON.stringify(needle) + ")>=0;});if(!b)return 'NO';b.click();return 'OK';})()";
const VIS = "(function(s){return [].slice.call(document.querySelectorAll(s)).filter(function(e){var r=e.getBoundingClientRect();return r.width>2&&r.height>2;});})";

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
await sleep(3000);

// ① HỒ SƠ NHÂN SỰ
console.log("  mo nhom HANH CHINH - PHAP CHE: " + (await ev(clickSidebar("HÀNH CHÍNH"))));
await sleep(1500);
console.log("  mo muc «Hồ sơ nhân sự»: " + (await ev(clickSidebar("Hồ sơ nhân sự"))));
await sleep(2800);
const hrInfo = await ev("(function(){var t=" + VIS + "('tbody tr');return {dong:t.length, tieuDe:String((document.querySelector('h1,h2')||{}).textContent||'').trim().slice(0,40)};})()");
console.log("  ⭐ MÀN HR: " + JSON.stringify(hrInfo));
await shot("HRQ-1-danh-sach-ho-so.png");

// ② MỞ «Sửa hồ sơ» dòng đầu (⚠️ KHÔNG Lưu)
const openedRow = await ev("(function(){var trs=" + VIS + "('tbody tr');if(!trs.length)return 'KHONG_DONG';trs[0].click();return 'DA_CLICK_DONG';})()");
console.log("  click dong dau: " + openedRow);
await sleep(2400);
console.log("  co nut «Sửa hồ sơ»: " + (await ev("(function(){var bs=" + VIS + "('button');return bs.some(function(x){return /Sửa hồ sơ/i.test(String(x.textContent||''));});})()")));
const openedModal = await ev("(function(){var bs=" + VIS + "('button');var b=bs.find(function(x){return /Sửa hồ sơ/i.test(String(x.textContent||''));});if(!b)return 'KHONG_NUT';b.click();return 'DA_MO';})()");
console.log("  mo «Sửa hồ sơ»: " + openedModal);
await sleep(2400);
const FIELDS = "(function(){var e=document.querySelector('[data-vntech=\"hr-profile-edit\"]');if(!e)return null;var o={};for(var i=0;i<e.querySelectorAll('label').length;i++){var lab=e.querySelectorAll('label')[i];var t=String((lab.querySelector('span')||{}).textContent||'').trim();var inp=lab.querySelector('input,select');if(t&&inp)o[t]=String(inp.value||'').slice(0,24)+(inp.disabled?' [KHOA]':'');}return o;})()";
const tabUser = await ev(FIELDS);
console.log("  TAB USER (" + (tabUser ? Object.keys(tabUser).length : 0) + " o): " + JSON.stringify(tabUser));
console.log("  doi tab «Thông tin cá nhân»: " + (await ev("(function(){var e=document.querySelector('[data-vntech=\"hr-profile-edit\"]');if(!e)return 'KHONG_MODAL';var b=[].slice.call(e.querySelectorAll('button,[role=tab]')).find(function(x){return String(x.textContent||'').trim().indexOf('Thông tin cá nhân')===0;});if(!b)return 'KHONG_TAB';b.click();return 'OK';})()")));
await sleep(1500);
const tabPersonal = await ev(FIELDS);
console.log("  TAB CÁ NHÂN (" + (tabPersonal ? Object.keys(tabPersonal).length : 0) + " o): " + JSON.stringify(tabPersonal));
// ⭐ KIỂM CHỐNG TÁI DÙNG Ô (BUG-C12 phần 2): giá trị 2 tab PHẢI khác nhau ở các ô đặc trưng
const cccd = tabPersonal ? String(tabPersonal["Số CCCD/CMND"] || "") : "";
const maNV = tabUser ? String(tabUser["Mã nhân viên"] || "") : "";
console.log("  ⭐ CHỐNG TÁI DÙNG Ô: «Số CCCD/CMND»(tab cá nhân)=" + JSON.stringify(cccd) + " · «Mã nhân viên»(tab user)=" + JSON.stringify(maNV) + " ⇒ " + (cccd && cccd === maNV ? "🔴 TRÙNG (lỗi tái phát!)" : "✅ KHÁC nhau (đúng)"));
await shot("HRQ-2-modal-sua-ho-so.png");
// ③ KIỂM TAB TEAMS
await ev("(function(){var b=" + VIS + "('.modal button,.overlay button')[0];return 'x';})()");
await ev("(function(){var o=document.querySelector('.overlay');if(o){var bs=[].slice.call(o.querySelectorAll('button'));var x=bs.find(function(b){return /Hủy|Đóng|×/i.test(String(b.textContent||'').trim());});if(x)x.click();}}return 'ok';})()");
await sleep(1500);
console.log("  mo nhom TO DOI: " + (await ev(clickSidebar("TỔ ĐỘI"))));
await sleep(1800);
const leaves = await ev(VIS + "('.sidebar button').map(function(b){return String(b.querySelector('span')?b.querySelector('span').textContent:'').trim();}).filter(function(s){return s && s!==s.toUpperCase();})");
console.log("  muc con nhom TỔ ĐỘI: " + JSON.stringify(leaves));
let teamsOk = false;
for (const l of (Array.isArray(leaves) ? leaves : [])) {
  if (teamsOk) break;
  const r = await ev("(function(){var T=" + JSON.stringify(l) + ";var b=" + VIS + "('.sidebar button').find(function(x){return String(x.querySelector('span')?x.querySelector('span').textContent:'').trim()===T;});if(!b)return 'NO';b.click();return 'OK';})()");
  if (r !== "OK") continue;
  await sleep(2000);
  const info = await ev("(function(){return {tieuDe:String((document.querySelector('h1,h2')||{}).textContent||'').trim().slice(0,50), soBang:document.querySelectorAll('table').length};})()");
  console.log("     · «" + l + "» ⇒ " + JSON.stringify(info));
  if (info && info.soBang > 0) teamsOk = true;
}
await shot("HRQ-3-man-to-doi.png");
console.log("  ⭐ KET QUA TO DOI: " + (teamsOk ? "✅ co bang (render duoc)" : "⚠️ chua thay bang"));
try { ws.close(); } catch {}
try { child.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
