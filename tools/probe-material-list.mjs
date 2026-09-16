// NỢ MỤC 5/8 — Kiểm chứng BẢNG DANH SÁCH VẬT TƯ ĐẦY ĐỦ: cột alias + nút CRUD disable theo quyền.
//
//   node tools/probe-material-list.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9991 + Math.floor(Math.random() * 9) + 100;
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-matlist-${Date.now()}`)}`, "--no-first-run",
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
console.log("  NỢ MỤC 5/8 — BẢNG DANH SÁCH VẬT TƯ ĐẦY ĐỦ");
console.log("═".repeat(74));

console.log("\n▸ Mở Danh mục vật tư gốc");
const expand = await ev(`(()=>{const sec=document.querySelector('[data-nav-group="material_master"]');
  if(!sec) return 'NO_GROUP'; const b=sec.querySelector(':scope > button');
  if(b && b.getAttribute('aria-expanded')==='false'){ b.click(); return 'EXPANDED'; } return 'ALREADY';})()`);
console.log("   nhóm: " + expand);
await sleep(1800);
const opened = await ev(`(()=>{const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="material_master"]');
  const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
  const kid=kids.find(e=>norm(e.textContent).includes('danh mục vật tư'));
  if(kid){ kid.click(); return 'OK'; }
  const all=[...document.querySelectorAll('button,a,[role=button]')];
  const el=all.find(e=>norm(e.textContent).includes('danh mục vật tư gốc'))||all.find(e=>norm(e.textContent).includes('danh mục vật tư'));
  if(!el) return 'NOT_FOUND'; el.click(); return 'OK';})()`);
check("Mở được màn Danh mục vật tư", opened === "OK", opened);
await sleep(3500);

const info = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.material-list-card');
  if(!root) return JSON.stringify({found:false});
  const t=root.querySelector('table');
  const heads=t?[...t.querySelectorAll('thead th')].map(x=>x.textContent.trim()):[];
  const rows=t?[...t.querySelectorAll('tbody tr')]:[];
  const aliasCells=rows.map(r=>{const tds=r.querySelectorAll('td');return tds[2]?tds[2].textContent.trim():'';});
  const btns=[...root.querySelectorAll('tbody .row-actions button')];
  const labels=[...new Set(btns.map(b=>b.textContent.trim()))];
  const disabled=btns.filter(b=>b.disabled).length;
  const filters=root.querySelectorAll('.material-list-filters select').length;
  const firstCode=rows[0]?rows[0].querySelector('td strong')?.textContent.trim():null;
  return JSON.stringify({found:true, heads, rowCount:rows.length, labels, btnCount:btns.length, disabled,
    filters, hasSearch: !!root.querySelector('input[aria-label="Tìm vật tư"]'),
    aliasSample: aliasCells.filter(Boolean).slice(0,3), firstCode});
})()`));
console.log("   " + JSON.stringify(info).slice(0, 420));

check("Bảng danh sách vật tư render", info.found === true);
check("Có cột 'Tên phụ (alias)'", (info.heads || []).some((h) => /tên phụ/i.test(h)), (info.heads || []).join(" | "));
check("Cột alias CÓ DỮ LIỆU", (info.aliasSample || []).length > 0, JSON.stringify(info.aliasSample));
check("Đủ 3 nút CRUD hiển thị", (info.labels || []).length >= 3, (info.labels || []).join(" · "));
check("Có tìm kiếm + ≥3 bộ lọc", info.hasSearch === true && (info.filters || 0) >= 3, `${info.filters} select`);
check("Mã vật tư theo dạng mới <HỆ>-<NHÓM>-<STT>",
  /^(DIEN|CTN|HVAC|ELV|PCCC|KHAC)-[A-Z0-9-]+-\d{3}$/.test(String(info.firstCode || "")), info.firstCode);

// ADMIN: mọi nút phải BẤM ĐƯỢC
check("Admin: nút CRUD không bị vô hiệu hoá", info.disabled === 0,
  `${info.btnCount} nút, ${info.disabled} bị disable`);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
