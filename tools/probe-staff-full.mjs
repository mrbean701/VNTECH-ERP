// MỤC 7/8 — Kiểm chứng DANH SÁCH NHÂN SỰ FULL MÀN: bảng toàn ngang + CRUD + search/sort/filter.
//
//   node tools/probe-staff-full.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9961 + Math.floor(Math.random() * 35);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-staff-${Date.now()}`)}`, "--no-first-run",
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
console.log("  MỤC 7/8 — DANH SÁCH NHÂN SỰ FULL MÀN");
console.log("═".repeat(74));

console.log("\n▸ Mở Quản trị hệ thống → tab Nhân sự");
await ev(`(()=>{const sec=document.querySelector('[data-nav-group="system_admin"]');
  const b=sec?sec.querySelector(':scope > button'):null;
  if(b && b.getAttribute('aria-expanded')==='false') b.click(); return 1;})()`);
await sleep(1800);
const nav = await ev(`(()=>{const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="system_admin"]');
  const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
  const el=kids.find(e=>norm(e.textContent).includes('quản trị'))||kids[0];
  if(!el) return 'NOT_FOUND'; el.click(); return 'OK';})()`);
check("Mở được Quản trị hệ thống", nav === "OK", nav);
await sleep(3500);

// tab Nhân sự (mặc định là tab 1)
const info = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.staff-full');
  if(!root) return JSON.stringify({found:false});
  const t=root.querySelector('table');
  const heads=t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[];
  const rows=t?t.querySelectorAll('tbody tr').length:0;
  const filters=root.querySelectorAll('.staff-full-filters select').length;
  const hasSearch=!!root.querySelector('input[aria-label="Tìm nhân sự"]');
  const actionBtns=[...root.querySelectorAll('tbody .row-actions button')].map(b=>b.textContent.trim());
  const w=Math.round(root.getBoundingClientRect().width);
  const card=root.closest('.card');
  const cw=card?Math.round(card.getBoundingClientRect().width):0;
  const tbl=root.querySelector('.table-wrap');
  const tw=tbl?Math.round(tbl.getBoundingClientRect().width):0;
  return JSON.stringify({found:true, heads, rows, filters, hasSearch,
    actionBtns:[...new Set(actionBtns)], rootW:w, cardW:cw, tableW:tw, winW:window.innerWidth,
    pager: !!root.querySelector('.table-pagination')});
})()`));
console.log("   " + JSON.stringify(info).slice(0, 400));

check("Danh sách nhân sự render (.staff-full)", info.found === true);
check("Là BẢNG có tiêu đề (không còn mini-list)", (info.heads || []).length >= 8, (info.heads || []).join(" | "));
check("Có ô tìm kiếm", info.hasSearch === true);
check("Có ≥3 bộ lọc", (info.filters || 0) >= 3, `${info.filters} select`);
check("Có phân trang", info.pager === true);
check("Nút CRUD đủ 3 (Hồ sơ/Sửa/Quyền)", (info.actionBtns || []).length >= 3, (info.actionBtns || []).join(" · "));

// Kiểm tra FULL MÀN: bảng phải chiếm gần hết chiều ngang cửa sổ
const ratio = info.winW ? info.tableW / info.winW : 0;
check("Bảng chiếm toàn màn hình (không bị chia đôi)", ratio >= 0.6,
  `bảng ${info.tableW}px / cửa sổ ${info.winW}px = ${Math.round(ratio * 100)}%`);

// lọc thử
console.log("\n▸ Thử bộ lọc + sắp xếp");
const before = info.rows;
const filtered = await ev(`(()=>{
  const sels=[...document.querySelectorAll('.staff-full-filters select')];
  const statusSel=sels.find(s=>s.getAttribute('aria-label')==='Lọc trạng thái');
  if(!statusSel) return 'NO_SELECT';
  statusSel.value='LOCKED';
  statusSel.dispatchEvent(new Event('change',{bubbles:true}));
  return 'OK';})()`);
await sleep(1200);
const afterFilter = JSON.parse(await ev(`(()=>{
  const t=document.querySelector('.staff-full tbody');
  const rows=t?[...t.querySelectorAll('tr')]:[];
  const realRows=rows.filter(r=>r.querySelector('.row-actions'));
  return JSON.stringify({total:rows.length, real:realRows.length});})()`));
check("Bộ lọc trạng thái có tác dụng", filtered === "OK" && afterFilter.total !== before,
  `trước ${before} dòng → sau lọc "Đã khoá": ${afterFilter.real} nhân sự (${afterFilter.total} dòng)`);

// TRẢ LẠI bộ lọc "Tất cả" trước khi thử modal — nếu lọc về 0 người thì không còn dòng để bấm
await ev(`(()=>{
  const sels=[...document.querySelectorAll('.staff-full-filters select')];
  const statusSel=sels.find(s=>s.getAttribute('aria-label')==='Lọc trạng thái');
  if(statusSel){ statusSel.value='ALL'; statusSel.dispatchEvent(new Event('change',{bubbles:true})); }
  return 1;})()`);
await sleep(1200);
const restored = await ev(`(()=>{const t=document.querySelector('.staff-full tbody');return t?t.querySelectorAll('tr .row-actions').length:0;})()`);
console.log(`   đã bỏ lọc: ${restored} dòng có nút thao tác`);

// mở modal CRUD từ nút "Hồ sơ"
const modal = await ev(`(()=>{const b=document.querySelector('.staff-full tbody .row-actions button');
  if(!b) return 'NO_BUTTON'; b.click(); return 'CLICKED';})()`);
await sleep(2000);
const modalOpen = await ev(`Boolean(document.querySelector('.overlay, .drawer, .modal'))`);
check("Bấm nút CRUD mở được hộp thoại dùng chung", modal === "CLICKED" && modalOpen === true,
  `click=${modal} mở=${modalOpen}`);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
