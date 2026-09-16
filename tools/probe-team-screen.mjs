// GĐ5 — Kiểm chứng màn TỔ ĐỘI: danh sách + chi tiết 3 tab (Tổng quan / Thành viên / Đơn từ).
//
//   node tools/probe-team-screen.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9801 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-team-${Date.now()}`)}`, "--no-first-run",
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
  return new Promise((res, rej) => { pend.set(id, (m) => m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result));
    setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("timeout"))), 60000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value; };

await send("Page.enable"); await send("Runtime.enable");
await sleep(2500);
await ev(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
await send("Page.navigate", { url: BASE });
await sleep(7000);

console.log("═".repeat(74));
console.log("  GĐ5 — TỔ ĐỘI: DANH SÁCH + CHI TIẾT");
console.log("═".repeat(74));

console.log("\n▸ Mở màn Tổ đội");
// Module `teams` nằm ở nhóm menu TỔ ĐỘI (theo groupKey trong DB module_catalog).
// Phải bấm ĐÚNG nhóm đó rồi chờ React render xong mới tìm mục con — bấm nhiều toggle
// trong cùng một tick sẽ bị React gộp state và cho kết quả không như ý.
const expand = await ev(`(()=>{
  const sec=document.querySelector('[data-nav-group="teams"]');
  if(!sec) return 'NO_GROUP';
  const b=sec.querySelector(':scope > button');
  if(b && b.getAttribute('aria-expanded')==='false'){ b.click(); return 'EXPANDED'; }
  return 'ALREADY';
})()`);
console.log("   nhóm TỔ ĐỘI: " + expand);
await sleep(2000);

const opened = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="teams"]');
  if(!sec) return 'NO_GROUP';
  const kids=[...sec.querySelectorAll('.nav-child')];
  const el=kids.find(e=>norm(e.textContent).includes('tổ đội'));
  if(!el) return 'NOT_FOUND:'+JSON.stringify(kids.map(x=>x.textContent.trim()));
  el.click(); return 'OK';
})()`);
check("Mở được màn Tổ đội", opened === "OK", opened);
await sleep(3000);

const listInfo = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.team-management');
  if(!root) return JSON.stringify({found:false});
  const t=root.querySelector('.table-wrap table');
  const heads=t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[];
  return JSON.stringify({found:true, heads, rows:t?t.querySelectorAll('tbody tr').length:0,
    hasSearch: !!root.querySelector('input[placeholder*="Tìm"]')});
})()`));
console.log("   " + JSON.stringify(listInfo).slice(0, 300));
check("Màn Tổ đội render (.team-management)", listInfo.found === true);
check("Có cột 'Thành viên'", (listInfo.heads || []).some((h) => /thành viên/i.test(h)), (listInfo.heads || []).join(" | "));
check("Có cột 'Dự án'", (listInfo.heads || []).some((h) => /dự án/i.test(h)));
check("Có ô tìm kiếm", listInfo.hasSearch === true);

console.log("\n▸ Mở chi tiết tổ đội");
const clicked = await ev(`(()=>{const b=[...document.querySelectorAll('.team-management tbody button')].find(x=>/chi tiết/i.test(x.textContent));
  if(!b) return 'NO_BUTTON'; b.click(); return 'CLICKED';})()`);
check("Bấm được nút Chi tiết", clicked === "CLICKED", clicked);
await sleep(2500);

const det = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.team-management');
  if(!root) return JSON.stringify({found:false});
  const tabs=[...root.querySelectorAll('.project-scope-tabs button')].map(x=>x.textContent.trim());
  return JSON.stringify({found:true, tabs, hasBack: !!root.querySelector('.page-back'),
    hasMemberDates: /ngày tham gia/i.test(root.textContent||''),
    hasJoinLeave: /ngày rời/i.test(root.textContent||'')});
})()`));
console.log("   " + JSON.stringify(det));

check("Chi tiết có 3 tab", (det.tabs || []).length === 3, (det.tabs || []).join(" · "));
for (const t of ["Tổng quan", "Thành viên"]) check(`Có tab "${t}"`, (det.tabs || []).some((x) => x.includes(t)));
check("Có tab Đơn từ", (det.tabs || []).some((x) => /đơn từ/i.test(x)), (det.tabs || []).join(" · "));
check("Có nút quay lại", det.hasBack === true);

console.log("\n▸ Mở từng tab");
if (!det.found) {
  check("Bỏ qua mở tab vì chi tiết chưa mở được", false, "chi tiết không render");
} else {
for (const [i, label] of ["Tổng quan", "Thành viên", "Đơn từ"].entries()) {
  const r = await ev(`(()=>{const bs=[...document.querySelectorAll('.team-management .project-scope-tabs button')];
    if(!bs[${i}]) return 'NO_TAB'; bs[${i}].click(); return 'OK';})()`);
  await sleep(1300);
  const info = JSON.parse(await ev(`(()=>{const root=document.querySelector('.team-management');
    if(!root) return JSON.stringify({tables:0,rows:0,kpis:0});
    return JSON.stringify({tables:root.querySelectorAll('.table-wrap table').length,
      rows:root.querySelectorAll('.table-wrap tbody tr').length, kpis:root.querySelectorAll('.kpi').length});})()`));
  check(`Tab "${label}" mở được`, r === "OK", JSON.stringify(info));
}

// tab Thành viên có cột ngày tham gia / ngày rời không
await ev(`(()=>{const bs=[...document.querySelectorAll('.team-management .project-scope-tabs button')]; if(bs[1]) bs[1].click(); return 1;})()`);
await sleep(1200);
const memHeads = JSON.parse(await ev(`(()=>{const t=document.querySelector('.team-management .table-wrap table');
  return JSON.stringify(t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[]);})()`));
check("Tab Thành viên có cột 'Ngày tham gia'", (memHeads || []).some((h) => /ngày tham gia/i.test(h)), (memHeads || []).join(" | "));
check("Tab Thành viên có cột 'Ngày rời'", (memHeads || []).some((h) => /ngày rời/i.test(h)));
}

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
