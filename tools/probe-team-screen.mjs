// PHASE 6 (`TM-01`…`TM-05`) — Kiểm chứng màn TỔ ĐỘI: danh sách 6 cột + chi tiết 6 tab.
//
// HỢP ĐỒNG (nguyên văn `docs/25_TODO_ROADMAP.md`):
//   `TM-01` danh sách «mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất»
//   `TM-02` thứ tự «ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng»
//   `TM-03` chi tiết «thông tin · nhân sự · dự án · kho · cấp phát · lịch sử»
//
// ⚠️ BẢN BUILD ĐANG PHỤC VỤ có thể CŨ HƠN nguồn (đợt PHASE 6 KHÔNG được phép `npm run build`): khi đó cổng này
// báo HỎNG ở các mục cấu trúc mới và ĐÓ LÀ ĐÚNG — hãy dựng lại bundle rồi chạy lại. Cổng ghi rõ
// `data-bundle` để phân biệt «nguồn sai» với «bundle chưa dựng lại».
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
console.log("  PHASE 6 — TỔ ĐỘI: DANH SÁCH 6 CỘT + CHI TIẾT 6 TAB");
console.log("═".repeat(74));
// Ghi rõ BUNDLE đang phục vụ (đợt PHASE 6 KHÔNG được phép `npm run build`) — nếu cấu trúc mới HỎNG thì đọc dòng
// này để phân biệt «nguồn sai» với «bundle chưa dựng lại».
const bundle = await ev(`(()=>{const s=[...document.querySelectorAll('script[src]')].map(x=>x.getAttribute('src')).filter(Boolean);
  return s.filter(x=>/page|index|main/.test(x)).slice(0,4).join(' · ');})()`);
console.log(`▸ Bundle đang phục vụ: ${bundle || "(không đọc được)"}`);
console.log("   Nếu các mục TM-01/TM-03 HỎNG mà nguồn đã đúng ⇒ bundle CŨ, cần dựng lại rồi chạy lại cổng này.");

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
  const sortNote=root.querySelector('[data-team-sort-note="TM-02"]');
  const srcNote=root.querySelector('[data-team-source-notes="TM-01"]');
  return JSON.stringify({found:true, heads, rows:t?t.querySelectorAll('tbody tr').length:0,
    hasSearch: !!root.querySelector('input[placeholder*="Tìm"]'),
    sortNote: sortNote?sortNote.textContent.trim():'', srcNote: srcNote?srcNote.textContent.trim():''});
})()`));
console.log("   " + JSON.stringify(listInfo).slice(0, 420));
check("Màn Tổ đội render (.team-management)", listInfo.found === true);
// `TM-01` — ĐÚNG 6 CỘT (đếm cả cột HÀNH ĐỘNG nếu có ⇒ kiểm theo NHÃN, không theo số cột thô).
const REQUIRED_COLUMNS = ["Mã tổ đội", "Tên tổ đội", "Trạng thái", "Thành viên", "Dự án", "Hoạt động gần nhất"];
for (const header of REQUIRED_COLUMNS) check(`Danh sách có cột «${header}»`, (listInfo.heads || []).some((h) => h === header), (listInfo.heads || []).join(" | "));
check("Có ô tìm kiếm", listInfo.hasSearch === true);
// `TM-02` — quy tắc ưu tiên phải HIỆN RA cho người dùng.
check("Có ghi chú quy tắc sắp xếp (TM-02)", /ĐANG HOẠT ĐỘNG/.test(listInfo.sortNote || "") && /ngừng/.test(listInfo.sortNote || ""), listInfo.sortNote);
// Không bịa số: khi payload thiếu nguồn thành viên thì phải có chữ «chưa có nguồn».
check("Có khối GHI NGUỒN của danh sách (TM-01)", (listInfo.srcNote || "").length > 20, (listInfo.srcNote || "").slice(0, 160));

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

// ⛔ ĐÃ GỠ 3 PHÉP KIỂM CŨ (MT2-P14-03c, 23/09/2026): chúng đòi bố cục **3 tab cũ** («Tổng quan» · «Thành viên»
// · «Đơn từ») — TRÁI với hợp đồng `TM-03` **ĐÚNG 6 TAB** ngay dưới (Thông tin · Nhân sự · Dự án · Kho ·
// Cấp phát · Lịch sử) và trái với màn Tổ đội đang chạy. Giữ lại duy nhất hợp đồng 6 tab (nguồn sự thật).
check("Có nút quay lại", det.hasBack === true);
// `TM-03` — ĐÚNG 6 TAB, đúng thứ tự nguyên văn. Nhãn có thể kèm ` (n)` khi tab có nguồn ⇒ so bằng `includes`.
const REQUIRED_TABS = ["Thông tin", "Nhân sự", "Dự án", "Kho", "Cấp phát", "Lịch sử"];
check("Chi tiết có ĐÚNG 6 tab (TM-03)", (det.tabs || []).length === 6, (det.tabs || []).join(" · "));
for (const [index, label] of REQUIRED_TABS.entries()) {
  check(`Tab thứ ${index + 1} là «${label}»`, String((det.tabs || [])[index] || "").includes(label), String((det.tabs || [])[index] || "(không có)"));
}

console.log("\n▸ Mở từng tab");
if (!det.found) {
  check("Bỏ qua mở tab vì chi tiết chưa mở được", false, "chi tiết không render");
} else {
for (const [i, label] of REQUIRED_TABS.entries()) {
  const r = await ev(`(()=>{const bs=[...document.querySelectorAll('.team-management .project-scope-tabs button')];
    if(!bs[${i}]) return 'NO_TAB'; bs[${i}].click(); return 'OK';})()`);
  await sleep(1300);
  const info = JSON.parse(await ev(`(()=>{const root=document.querySelector('.team-management');
    if(!root) return JSON.stringify({tables:0,rows:0,kpis:0});
    return JSON.stringify({tables:root.querySelectorAll('.table-wrap table').length,
      rows:root.querySelectorAll('.table-wrap tbody tr').length, kpis:root.querySelectorAll('.kpi').length,
      noSource:/chưa có nguồn/.test(root.textContent||'')});})()`));
  // Tab thiếu nguồn KHÔNG được coi là HỎNG: hợp đồng cho phép hiện «chưa có nguồn» + lý do.
  check(`Tab "${label}" mở được`, r === "OK", JSON.stringify(info));
}

// Tab «Nhân sự» (chỉ số 1) — nếu payload CÓ nguồn `teamMembers` thì bảng phải có cột ngày tham gia / ngày rời;
// nếu KHÔNG có nguồn (stack JS) thì phải thấy chữ «chưa có nguồn» — cả hai đều là kết quả ĐÚNG của hợp đồng.
await ev(`(()=>{const bs=[...document.querySelectorAll('.team-management .project-scope-tabs button')]; if(bs[1]) bs[1].click(); return 1;})()`);
await sleep(1200);
const staffTab = JSON.parse(await ev(`(()=>{const root=document.querySelector('.team-management');
  const t=root?root.querySelector('.table-wrap table'):null;
  return JSON.stringify({heads:t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[],
    noSource:/chưa có nguồn/.test(root?root.textContent||'':'')});})()`));
const hasSource = (staffTab.heads || []).some((h) => /ngày tham gia/i.test(h));
check("Tab Nhân sự: CÓ nguồn ⇒ có cột 'Ngày tham gia' / KHÔNG nguồn ⇒ hiện «chưa có nguồn»",
  hasSource || staffTab.noSource === true, JSON.stringify(staffTab));
}

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
