// MỤC 6/8 — Kiểm chứng PHÂN QUYỀN PHÒNG BAN: danh sách phòng ban + checkbox + nút 1 hàng.
//
//   node tools/probe-dept-perm.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9931 + Math.floor(Math.random() * 60);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-dept-${Date.now()}`)}`, "--no-first-run",
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
console.log("  MỤC 6/8 — PHÂN QUYỀN PHÒNG BAN");
console.log("═".repeat(74));

console.log("\n▸ Mở Quản trị hệ thống → tab Phân quyền phòng ban");
await ev(`(()=>{const sec=document.querySelector('[data-nav-group="system_admin"]');
  const b=sec?sec.querySelector(':scope > button'):null;
  if(b && b.getAttribute('aria-expanded')==='false') b.click(); return 1;})()`);
await sleep(1800);
const nav = await ev(`(()=>{const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="system_admin"]');
  const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
  const el=kids.find(e=>norm(e.textContent).includes('quản trị'))||kids[0];
  if(!el) return 'NOT_FOUND:'+JSON.stringify(kids.map(x=>x.textContent.trim()));
  el.click(); return 'OK';})()`);
check("Mở được Quản trị hệ thống", nav === "OK", nav);
await sleep(3500);

// bấm tab "Phân quyền phòng ban"
const tabClick = await ev(`(()=>{const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const bs=[...document.querySelectorAll('button')];
  const b=bs.find(x=>norm(x.textContent)==='phân quyền phòng ban')||bs.find(x=>norm(x.textContent).includes('phân quyền phòng ban'));
  if(!b) return 'NO_TAB'; b.click(); return 'OK';})()`);
check("Mở được tab Phân quyền phòng ban", tabClick === "OK", tabClick);
await sleep(2500);

const info = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.dept-perm-card');
  if(!root) return JSON.stringify({found:false});
  const list=root.querySelector('.dept-perm-list');
  const items=list?[...list.querySelectorAll('button')]:[];
  const sel=list?list.querySelector('button.active'):null;
  const actions=root.querySelector('.dept-perm-actions');
  const abtns=actions?[...actions.querySelectorAll('button')]:[];
  const heights=abtns.map(b=>Math.round(b.getBoundingClientRect().height));
  const tops=abtns.map(b=>Math.round(b.getBoundingClientRect().top));
  const cbs=root.querySelectorAll('.dept-perm-main input[type=checkbox]');
  return JSON.stringify({
    found:true,
    deptItems: items.length,
    hasSelected: !!sel,
    selectedLabel: sel?sel.textContent.trim().slice(0,40):null,
    hasDropdown: !!root.querySelector('.dept-perm-main select, .dept-perm-card select'),
    actionCount: abtns.length,
    actionHeights: [...new Set(heights)],
    actionRows: [...new Set(tops)].length,
    checkboxes: cbs.length,
    hasOldLabel: /CHỌN PHÒNG BAN/.test(root.textContent||'')
  });
})()`));
console.log("   " + JSON.stringify(info).slice(0, 330));

check("Khối phân quyền phòng ban render", info.found === true);
check("Có cột DANH SÁCH PHÒNG BAN", (info.deptItems || 0) >= 1, `${info.deptItems} phòng`);
check("Mặc định chọn sẵn 1 phòng", info.hasSelected === true, info.selectedLabel);
check("KHÔNG còn dropdown chọn phòng ban", info.hasDropdown === false);
check("Nhãn cũ 'CHỌN PHÒNG BAN' đã bỏ", info.hasOldLabel === false);
check("Quyền là CHECKBOX", (info.checkboxes || 0) > 0, `${info.checkboxes} checkbox`);
check("Nút chức năng cùng chiều cao", (info.actionHeights || []).length === 1,
  "cao: " + JSON.stringify(info.actionHeights));
check("Nút chức năng nằm trên 1 hàng", (info.actionRows || 99) === 1,
  `${info.actionRows} hàng · ${info.actionCount} nút`);

// bấm sang phòng khác → nội dung phải đổi
console.log("\n▸ Bấm sang phòng ban khác");
const switchRes = await ev(`(()=>{
  const list=document.querySelector('.dept-perm-list');
  const bs=list?[...list.querySelectorAll('button')]:[];
  if(bs.length<2) return 'ONLY_ONE';
  const before=document.querySelector('.dept-perm-context strong')?.textContent||'';
  bs[1].click();
  return 'CLICKED|'+before;})()`);
await sleep(1200);
const after = await ev(`(()=>{const el=document.querySelector('.dept-perm-context strong');return el?el.textContent:null;})()`);
const beforeLabel = String(switchRes).split("|")[1] || "";
check("Bấm phòng khác đổi được ngữ cảnh", switchRes === "ONLY_ONE" || (after && after !== beforeLabel),
  `${beforeLabel} → ${after}`);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
