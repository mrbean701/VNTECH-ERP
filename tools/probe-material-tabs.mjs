// MỤC 5/8 — Kiểm chứng DANH MỤC VẬT TƯ chuyển từ khối thu gọn (<details>) SANG TAB.
//
//   node tools/probe-material-tabs.mjs [base] [user] [pass]
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9901 + Math.floor(Math.random() * 90);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (n, ok, d) => { results.push({ n, ok: Boolean(ok) }); console.log(`  ${ok ? "✅" : "❌"} ${n}${d ? " — " + d : ""}`); };

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-mat-${Date.now()}`)}`, "--no-first-run",
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
console.log("  MỤC 5/8 — DANH MỤC VẬT TƯ DẠNG TAB");
console.log("═".repeat(74));

console.log("\n▸ Mở màn Danh mục vật tư gốc");
const expand = await ev(`(()=>{const sec=document.querySelector('[data-nav-group="material_master"]');
  if(!sec) return 'NO_GROUP';
  const b=sec.querySelector(':scope > button');
  if(b && b.getAttribute('aria-expanded')==='false'){ b.click(); return 'EXPANDED'; }
  return 'ALREADY';})()`);
console.log("   nhóm DANH MỤC VẬT TƯ GỐC: " + expand);
await sleep(1800);

const opened = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  // Ưu tiên mục con; nếu nhóm không có con thì bấm thẳng nút nhóm
  const sec=document.querySelector('[data-nav-group="material_master"]');
  const kids=sec?[...sec.querySelectorAll('.nav-child')]:[];
  const kid=kids.find(e=>norm(e.textContent).includes('danh mục vật tư'));
  if(kid){ kid.click(); return 'OK:child'; }
  const all=[...document.querySelectorAll('button,a,.nav-item,[role=button]')];
  const el=all.find(e=>norm(e.textContent).includes('danh mục vật tư gốc')) || all.find(e=>norm(e.textContent).includes('danh mục vật tư'));
  if(!el) return 'NOT_FOUND';
  el.click(); return 'OK:direct';
})()`);
check("Mở được màn Danh mục vật tư", String(opened).startsWith("OK"), opened);
await sleep(3000);

const bar = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.material-catalog-screen');
  if(!root) return JSON.stringify({found:false});
  const tabs=[...root.querySelectorAll('.project-scope-tabs button')].map(x=>x.textContent.trim());
  return JSON.stringify({found:true, tabs, activeTab: root.getAttribute('data-active-tab')});
})()`));
console.log("   " + JSON.stringify(bar).slice(0, 260));
check("Màn danh mục vật tư render", bar.found === true);
check("Có thanh TAB (3 tab)", (bar.tabs || []).length === 3, (bar.tabs || []).join(" · "));
check("Tab 1 = Danh mục vật tư", /danh mục vật tư/i.test((bar.tabs || [])[0] || ""), (bar.tabs || [])[0]);
check("Tab 2 = So sánh/Đối chiếu BOQ", /boq/i.test((bar.tabs || [])[1] || ""), (bar.tabs || [])[1]);
check("Tab 3 = Soát trùng Alias", /alias/i.test((bar.tabs || [])[2] || ""), (bar.tabs || [])[2]);

// Đo khối nào đang HIỆN (display khác none)
const visibleIn = async () => JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.material-catalog-screen');
  if(!root) return JSON.stringify([]);
  return JSON.stringify([...root.querySelectorAll('details[data-tab]')]
    .filter(d=>getComputedStyle(d).display!=='none')
    .map(d=>d.getAttribute('data-tab')));
})()`));

const v0 = await visibleIn();
check("Tab 1 hiện đúng 1 khối", v0.length === 1 && v0[0] === "0", "đang hiện: [" + v0.join(",") + "]");
check("Tiêu đề khối thu gọn đã ẩn (chế độ tab)", await ev(`(()=>{const s=document.querySelector('.material-catalog-screen details[data-tab] > summary');
  return s?getComputedStyle(s).display==='none':true;})()`) === true);

console.log("\n▸ Bấm sang từng tab");
for (const [i, label] of ["So sánh/BOQ", "Soát trùng Alias", "Danh mục vật tư"].entries()) {
  const idx = [1, 2, 0][i];
  const r = await ev(`(()=>{const bs=[...document.querySelectorAll('.material-catalog-screen .project-scope-tabs button')];
    if(!bs[${idx}]) return 'NO_TAB'; bs[${idx}].click(); return 'OK';})()`);
  await sleep(900);
  const v = await visibleIn();
  check(`Chuyển sang tab "${label}" → chỉ khối ${idx} hiện`, r === "OK" && v.length === 1 && v[0] === String(idx),
    `click=${r} hiện=[${v.join(",")}]`);
}

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
