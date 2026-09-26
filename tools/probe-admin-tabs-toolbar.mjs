// TASK-008 / U-09 ĐỢT 5 — KIỂM CHỨNG TOOLBAR 3 MÀN TRONG TAB QUẢN TRỊ
//
// VÌ SAO CẦN PROBE RIÊNG: ba màn này (UserPermissionMatrix · SystemLevelManager · AuditLogManager)
// nằm ở các BƯỚC 6, 7, 11 của màn Quản trị, phải bấm tab mới tới — chúng KHÔNG nằm trong bộ ảnh
// chuẩn nên cổng so ảnh KHÔNG kiểm được. Không có probe này thì thay đổi sẽ không có bằng chứng.
//
// Kiểm cho từng màn: có .list-toolbar thật trong DOM không, tiêu đề là gì, có ô tìm kiếm không,
// có bao nhiêu bộ lọc, có nút hành động không — và (quan trọng) ô tìm kiếm có LỌC THẬT không.
//
//   node tools/probe-admin-tabs-toolbar.mjs [base] [user] [pass]
import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9861 + Math.floor(Math.random() * 35);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-admtab-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,1000", BASE], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) { wsUrl = p.webSocketDebuggerUrl; break; } } catch {}
  await sleep(500);
}
if (!wsUrl) { console.error("Không kết nối được CDP của Edge."); process.exit(1); }
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

console.log("═".repeat(78));
console.log("  TASK-008 — TOOLBAR 3 MÀN TRONG TAB QUẢN TRỊ");
console.log("═".repeat(78));

console.log("\n▸ Mở Quản trị hệ thống");
const opened = await ev(`(()=>{const sec=document.querySelector('[data-nav-group="system_admin"]');
  if(!sec) return 'NO_GROUP';
  const p=sec.querySelector('.nav-parent')||sec.querySelector('button'); if(p) p.click();
  return 'OK';})()`);
await sleep(1200);
const nav = await ev(`(()=>{const sec=document.querySelector('[data-nav-group="system_admin"]');
  const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
  const k=kids[0]||sec.querySelector('.nav-parent'); if(!k) return 'NO_TARGET'; k.click();
  return 'CLICKED:'+(k.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40);})()`);
await sleep(3500);
check("Mở được màn Quản trị hệ thống", opened === "OK", nav);

// Ba màn cần kiểm: bước 6 · 7 · 11 (chỉ số mảng 5 · 6 · 10)
const TARGETS = [
  { step: 6, idx: 5, name: "UserPermissionMatrix", expect: "BỘ LỌC" },
  { step: 7, idx: 6, name: "SystemLevelManager", expect: "GÁN CẤP BẬC" },
  { step: 11, idx: 10, name: "AuditLogManager", expect: "BỘ LỌC" },
];

for (const t of TARGETS) {
  console.log(`\n▸ Bước ${t.step} — ${t.name}`);
  const clicked = await ev(`(()=>{const w=document.querySelector('.permission-steps'); if(!w) return 'NO_STEPS';
    const bs=[...w.querySelectorAll('button')]; const b=bs[${t.idx}]; if(!b) return 'NO_BUTTON('+bs.length+')';
    b.click(); return 'CLICKED:'+(b.innerText||'').trim().slice(0,30);})()`);
  await sleep(2500);
  const info = JSON.parse(await ev(`(()=>{
    // LƯU Ý: màn Quản trị có HAI tầng toolbar — toolbar tiêu đề của cả màn (thêm ở TASK-005) và
    // toolbar riêng của từng bước. querySelector lấy cái ĐẦU TIÊN nên dễ dò nhầm; phải lấy cái
    // CUỐI CÙNG trong DOM mới đúng toolbar của bước đang mở.
    const all=[...document.querySelectorAll('.list-toolbar')];
    const tb=all[all.length-1];
    if(!tb) return JSON.stringify({found:false,total:all.length});
    const title=(tb.querySelector('.list-toolbar-title strong')||{}).textContent||'';
    const note=(tb.querySelector('.list-toolbar-title span')||{}).textContent||'';
    const count=(tb.querySelector('.list-toolbar-count')||{}).textContent||'';
    const search=tb.querySelector('input[type="search"], .list-toolbar-search input');
    const sels=tb.querySelectorAll('.list-toolbar-field select').length;
    const btns=[...tb.querySelectorAll('.list-toolbar-actions button, .list-toolbar-actions label')].map(b=>(b.textContent||'').trim().slice(0,26));
    const tags=[...tb.querySelectorAll('.list-toolbar-controls > *')].map(e=>e.tagName);
    return JSON.stringify({found:true,total:all.length,title:title.trim(),note:note.trim(),count:count.trim(),
      hasSearch:!!search, searchPlaceholder: search?(search.placeholder||'').slice(0,40):'',
      selects:sels, buttons:btns, controls:tags.length});
  })()`));
  check(`${t.name}: có .list-toolbar riêng cho bước`, info.found === true, `${clicked} · tổng toolbar trên màn: ${info.total}`);
  if (!info.found) continue;
  check(`${t.name}: tiêu đề đúng`, info.title === t.expect, `đọc được: "${info.title}"`);
  check(`${t.name}: có vùng số lượng/mô tả`, Boolean(info.count || info.note), `${info.count} | ${info.note.slice(0, 60)}`);
  console.log(`      ô tìm kiếm: ${info.hasSearch ? "có" : "không"} · bộ lọc select: ${info.selects} · nút: ${info.buttons.join(" · ") || "(không)"}`);
}

// Kiểm ô tìm kiếm ở bước 6 phải LỌC THẬT (giống phép kiểm đã thêm ở probe-staff-full)
console.log("\n▸ Ô tìm kiếm ở bước 6 có lọc thật không");
await ev(`(()=>{const w=document.querySelector('.permission-steps'); const b=w?[...w.querySelectorAll('button')][5]:null; if(b) b.click(); return 1;})()`);
await sleep(2500);
const before = await ev(`(()=>{const a=[...document.querySelectorAll('.list-toolbar')]; const tb=a[a.length-1];
  const scope=tb?tb.closest('.stack')||tb.parentElement:document; return scope.querySelectorAll('table tbody tr').length;})()`);
const typed = await ev(`(()=>{const a=[...document.querySelectorAll('.list-toolbar')]; const tb=a[a.length-1];
  const i=tb?tb.querySelector('input[type="search"], .list-toolbar-search input'):null;
  if(!i) return 'NO_INPUT';
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  setter.call(i,'zzz_khong_ton_tai_zzz'); i.dispatchEvent(new Event('input',{bubbles:true})); return 'TYPED';})()`);
await sleep(1000);
const after = await ev(`(()=>{const a=[...document.querySelectorAll('.list-toolbar')]; const tb=a[a.length-1];
  const scope=tb?tb.closest('.stack')||tb.parentElement:document; return scope.querySelectorAll('table tbody tr').length;})()`);
await ev(`(()=>{const a=[...document.querySelectorAll('.list-toolbar')]; const tb=a[a.length-1];
  const i=tb?tb.querySelector('input[type="search"], .list-toolbar-search input'):null;
  if(i){const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; setter.call(i,''); i.dispatchEvent(new Event('input',{bubbles:true}));} return 1;})()`);
await sleep(600);
check("Ô tìm kiếm ở bước 6 LỌC THẬT", typed === "TYPED" && after < before,
  `nhập từ khóa không tồn tại: ${before} dòng → ${after} dòng`);

try { ws.close(); } catch { /* bỏ qua */ }
child.kill();

const bad = results.filter((r) => !r.ok).length;
console.log("\n" + "═".repeat(78));
console.log(bad === 0 ? `KẾT LUẬN: ĐẠT ✅ (${results.length} mục)` : `KẾT LUẬN: KHÔNG ĐẠT ❌ (${bad}/${results.length} mục)`);
console.log("═".repeat(78));
process.exit(bad === 0 ? 0 : 1);
