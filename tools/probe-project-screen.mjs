// GĐ3 — Kiểm chứng màn QUẢN LÝ DỰ ÁN: danh sách + chi tiết 4 tab.
//
//   node tools/probe-project-screen.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9601 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-proj-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,900", BASE,
], { stdio: "ignore" });

async function cdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của Edge.");
}
const ws = new WebSocket(await cdp());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 60000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

await send("Page.enable"); await send("Runtime.enable");
await sleep(2500);
await ev(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
await send("Page.navigate", { url: BASE });
await sleep(7000);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok) });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};

console.log("═".repeat(74));
console.log("  GĐ3 — QUẢN LÝ DỰ ÁN: DANH SÁCH + CHI TIẾT");
console.log("═".repeat(74));

// Mở nhóm menu "QUẢN LÝ DỰ ÁN" rồi vào module con "Quản lý dự án".
// LƯU Ý: nhãn nhóm và nhãn module TRÙNG NHAU sau khi đổi tên ⇒ phải bấm `.nav-child`
// (mục con) chứ không phải nút tiêu đề nhóm.
console.log("\n▸ Mở màn Quản lý dự án");
const expandInfo = await ev(`(()=>{
  const sec=document.querySelector('[data-nav-group="site_command"]');
  if(!sec) return 'NO_SECTION';
  const btn=sec.querySelector(':scope > button');
  if(btn && btn.getAttribute('aria-expanded')==='false'){ btn.click(); return 'EXPANDED'; }
  return 'ALREADY_OPEN';
})()`);
console.log("   " + expandInfo);
await sleep(1800);

const opened = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="site_command"]');
  if(!sec) return 'NO_SECTION';
  const kids=[...sec.querySelectorAll('.nav-child')];
  const el=kids.find(e=>norm(e.textContent)==='quản lý dự án')||kids.find(e=>norm(e.textContent).includes('quản lý dự án'));
  if(!el) return 'NOT_FOUND:'+JSON.stringify(kids.map(x=>x.textContent.trim()));
  el.click(); return 'OK';
})()`);
check("Mở được màn Quản lý dự án", opened === "OK", opened);
await sleep(3000);

// đo bảng danh sách
const listInfo = JSON.parse(await ev(`(()=>{
  const t=document.querySelector('.project-management .table-wrap table');
  if(!t) return JSON.stringify({found:false});
  const heads=[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim());
  const rows=[...t.querySelectorAll('tbody tr')];
  const first=rows[0]?[...rows[0].querySelectorAll('td')].map(x=>x.textContent.trim()):[];
  return JSON.stringify({found:true, heads, rowCount:rows.length, first,
    hasSearch: !!document.querySelector('.project-management input[placeholder*="Tìm"]'),
    sortOptions: [...document.querySelectorAll('.project-management select')].length});
})()`));
console.log("   " + JSON.stringify(listInfo).slice(0, 320));

check("Có bảng danh sách dự án", listInfo.found === true, `${listInfo.rowCount ?? 0} dòng`);
check("Có cột 'Kết thúc dự kiến'", (listInfo.heads || []).some((h) => /kết thúc/i.test(h)), (listInfo.heads || []).join(" | "));
check("Có cột 'Tiến độ' (chậm tiến độ)", (listInfo.heads || []).some((h) => /tiến độ/i.test(h)));
check("Có ô tìm kiếm", listInfo.hasSearch === true);
check("Có bộ sắp xếp", (listInfo.sortOptions || 0) >= 2, `${listInfo.sortOptions} select`);

// mở chi tiết dự án đầu tiên
console.log("\n▸ Mở chi tiết một dự án");
const detailClicked = await ev(`(()=>{
  const b=[...document.querySelectorAll('.project-management tbody button')].find(x=>/chi tiết/i.test(x.textContent));
  if(!b) return 'NO_BUTTON';
  b.click(); return 'CLICKED';
})()`);
check("Bấm được nút Chi tiết", detailClicked === "CLICKED", detailClicked);
await sleep(2500);

const detailInfo = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.project-management');
  if(!root) return JSON.stringify({found:false});
  const tabs=[...root.querySelectorAll('.project-scope-tabs button')].map(x=>x.textContent.trim());
  const back=root.querySelector('.page-back');
  const body=root.textContent||'';
  return JSON.stringify({
    found:true, tabs, hasBack: !!back,
    overdueShown: /chậm \\d+ ngày/i.test(body),
    onTimeShown: /đúng hạn/i.test(body),
    startShown: /ngày bắt đầu/i.test(body),
  });
})()`));
console.log("   " + JSON.stringify(detailInfo));

check("Chi tiết có 5 tab (gồm Ban chỉ huy)", (detailInfo.tabs || []).length === 5, (detailInfo.tabs || []).join(" · "));
for (const t of ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"]) {
  check(`Có tab "${t}"`, (detailInfo.tabs || []).includes(t));
}
check("Có nút quay lại danh sách", detailInfo.hasBack === true);

// lần lượt mở từng tab, đếm nội dung
console.log("\n▸ Mở từng tab");
for (const [i, label] of ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"].entries()) {
  const r = await ev(`(()=>{
    const bs=[...document.querySelectorAll('.project-management .project-scope-tabs button')];
    if(!bs[${i}]) return 'NO_TAB';
    bs[${i}].click(); return 'OK';
  })()`);
  await sleep(1200);
  const info = JSON.parse(await ev(`(()=>{
    const root=document.querySelector('.project-management');
    const tables=[...root.querySelectorAll('.table-wrap table')];
    const kpis=[...root.querySelectorAll('.kpi')];
    return JSON.stringify({tables:tables.length, rows:tables.reduce((s,t)=>s+t.querySelectorAll('tbody tr').length,0), kpis:kpis.length, bytes:(root.textContent||'').length});
  })()`));
  check(`Tab "${label}" mở được`, r === "OK", JSON.stringify(info));
}

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("Ảnh chụp / profile: " + ART);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
