// GĐ4 — Kiểm chứng màn "CÔNG VIỆC": 3 tab + tự tạo việc cho bản thân + KPI.
//
//   node tools/probe-work-center.mjs [base] [user] [pass]
//
// Kiểm tra CẢ HAI chiều:
//   • UI: 3 tab mở được, có form tự tạo việc, có bảng KPI
//   • API: gọi thẳng create_self_work_item để xác nhận backend thật sự tạo được,
//     KHÔNG phụ thuộc việc bấm form (tránh test chỉ xanh vì UI hiện nút).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9701 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: Boolean(ok) });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};

// ---------- PHẦN API: xác nhận backend tạo được việc cá nhân ----------
console.log("═".repeat(74));
console.log("  GĐ4 — MÀN CÔNG VIỆC + TỰ TẠO VIỆC CHO BẢN THÂN");
console.log("═".repeat(74));
console.log("\n▸ Phần A — API (không phụ thuộc UI)");

const login = await fetch(BASE + "/api/system", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
check("Đăng nhập được", login.status === 200, "HTTP " + login.status);

async function post(action, payload = {}, extraCookie = cookie) {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: extraCookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}

const before = (await (await fetch(BASE + "/api/system", { headers: { cookie } })).json()).data?.workItems?.length ?? 0;

const stamp = new Date().toISOString().slice(0, 16);
const created = await post("create_self_work_item", {
  title: `[PROBE GĐ4] Việc tự tạo ${stamp}`,
  priority: "normal",
  requiredOutput: "Kiểm chứng tự tạo việc",
});
check("Gọi được create_self_work_item", created.status === 200,
  `HTTP ${created.status}${created.json?.error ? " · " + created.json.error : ""}`);

const after = (await (await fetch(BASE + "/api/system", { headers: { cookie } })).json()).data?.workItems?.length ?? 0;
check("Số nhiệm vụ TĂNG sau khi tạo", after > before, `${before} → ${after}`);

const d = (await (await fetch(BASE + "/api/system", { headers: { cookie } })).json()).data || {};
const mine = (d.workItems || []).filter((r) => /\[PROBE GĐ4\]/.test(String(r.title || "")));
const justCreated = mine[0];
check("Nhiệm vụ mới có mã CVCN- (việc cá nhân)", String(justCreated?.taskNo || "").startsWith("CVCN-"), justCreated?.taskNo);
check("Nhiệm vụ mới có departmentCode = CN", String(justCreated?.departmentCode || "") === "CN", justCreated?.departmentCode);
// ⚠️ SỬA BÁO OAN (MT2-P14-03c, 23/09/2026): payload THẬT của Java dùng **`assignedTo` / `assignedToName`**
// (đo trực tiếp trên API đang chạy: `assignedTo = USR_2f435847…` = `data.user.id`, `assignedToName = "Quản trị viên VNTECH"`).
// Bản cũ đọc `assigneeUserId`/`assigneeName` — 2 khoá ⛔ **không tồn tại** nên báo đỏ oan. Nay nhận cả 2 cách đặt tên.
const assigneeId = justCreated?.assignedTo ?? justCreated?.assigneeUserId;
const assigneeName = justCreated?.assignedToName ?? justCreated?.assigneeName;
check("Nhiệm vụ mới gán cho CHÍNH người tạo", String(assigneeId || "") === String(d.user?.id || ""),
  `${assigneeName} vs ${d.user?.fullName}`);
check("Bootstrap trả trường KPI (assignedAt/completedAt)", "assignedAt" in (justCreated || {}) && "completedAt" in (justCreated || {}),
  Object.keys(justCreated || {}).filter((k) => /At$/.test(k)).join(","));

// ---------- PHẦN UI: 3 tab ----------
console.log("\n▸ Phần B — Giao diện (trình duyệt thật)");
const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-work-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,900", BASE], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 60; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (p) { wsUrl = p.webSocketDebuggerUrl; break; }
  } catch {}
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

// Mở nhóm CÔNG VIỆC → module "Nhiệm vụ nhân viên đang làm"
const expand = await ev(`(()=>{
  const sec=document.querySelector('[data-nav-group="my_work"]');
  if(!sec) return 'NO_GROUP';
  const b=sec.querySelector(':scope > button');
  if(b && b.getAttribute('aria-expanded')==='false'){ b.click(); return 'EXPANDED'; }
  return 'ALREADY';
})()`);
console.log("   nhóm CÔNG VIỆC: " + expand);
await sleep(1800);

// ⚠️ CẬP NHẬT 23/09/2026 (MT2 §3.1 + T-01/P5-01): nhóm «CÔNG VIỆC» nay có **5 mục**
// («Dashboard» · «Cá nhân» · «Phòng ban» · «Giao việc» · «Báo cáo»), ⛔ không còn mục cũ
// «Nhiệm vụ nhân viên đang làm». Mở màn Công việc bằng mục **«Cá nhân»** (tab 1) và kiểm **5 tab**.
const opened = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const sec=document.querySelector('[data-nav-group="my_work"]');
  if(!sec) return 'NO_GROUP';
  const kids=[...sec.querySelectorAll('.nav-child')];
  const el=kids.find(e=>norm(e.textContent)==='cá nhân') || kids.find(e=>norm(e.textContent).includes('cá nhân'));
  if(!el) return 'NOT_FOUND:'+JSON.stringify(kids.map(x=>x.textContent.trim()));
  el.click(); return 'OK';
})()`);
check("Mở được màn Công việc từ menu (mục «Cá nhân»)", opened === "OK", opened);
await sleep(3000);

const ui = JSON.parse(await ev(`(()=>{
  const root=document.querySelector('.work-center');
  if(!root) return JSON.stringify({found:false});
  // FIX CHỌN PHẦN TỬ (MT2-P14-03c): selector .project-scope-tabs button bắt luôn nút của dải con BÊN TRONG
  // tab 1 (Của tôi / Được giao / Do tôi tạo) ⇒ chỉ lấy CON TRỰC TIẾP của dải tab ĐẦU TIÊN. (⛔ không dùng
  // dấu huyền trong chú thích nằm TRONG template literal của ev().)
  const strip=root.querySelector('.project-scope-tabs');
  const tabs=strip?[...strip.children].filter(e=>e.tagName==='BUTTON').map(x=>x.textContent.trim()):[];
  return JSON.stringify({ found:true, tabs,
    hasSelfForm: /tự tạo việc cho bản thân/i.test(root.textContent||''),
    hasKpiWords: /tỉ lệ hoàn thành/i.test(root.textContent||''),
    bars: root.querySelectorAll('.task-bar').length,
    tables: root.querySelectorAll('.table-wrap table').length });
})()`));
console.log("   " + JSON.stringify(ui).slice(0, 300));
check("Màn Công việc render (.work-center)", ui.found === true);
check("Có ĐÚNG 5 tab theo MT2 §3.1/T-01", (ui.tabs || []).length === 5, (ui.tabs || []).join(" · "));
check("5 tab đúng NHÃN + THỨ TỰ đã chốt", JSON.stringify(ui.tabs) === JSON.stringify(["Cá nhân","Phòng ban","Giao việc","Dashboard","Báo cáo"]), (ui.tabs || []).join(" · "));
check("Tab 1 có form tự tạo việc", ui.hasSelfForm === true);
check("Tab KPI có nội dung tỉ lệ hoàn thành", ui.hasKpiWords === true);

// mở từng tab — ⚠️ CẬP NHẬT 23/09/2026: 5 tab theo MT2 §3.1/T-01 (⛔ không còn 3 tab cũ)
console.log("\n▸ Mở từng tab");
for (const [i, label] of ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"].entries()) {
  const r = await ev(`(()=>{const strip=document.querySelector('.work-center .project-scope-tabs');
    const bs=strip?[...strip.children].filter(e=>e.tagName==='BUTTON'):[];
    if(!bs[${i}]) return 'NO_TAB'; bs[${i}].click(); return 'OK';})()`);
  await sleep(1300);
  // ⚠️ SỬA LỖI CÔNG CỤ (MT2-P14-03c, 23/09/2026): bản cũ gọi thẳng `root.querySelectorAll` khi
  // `document.querySelector('.work-center')` = **null** ⇒ ném TypeError làm probe CHẾT giữa đường,
  // ⛔ không in được kết luận. Nay trả `{root:false}` và báo ĐỎ có thông điệp rõ (màn chưa mở / selector đổi).
  const info = JSON.parse(await ev(`(()=>{const root=document.querySelector('.work-center');
    if(!root) return JSON.stringify({root:false});
    return JSON.stringify({root:true, tables:root.querySelectorAll('.table-wrap table').length,
      rows:root.querySelectorAll('.table-wrap tbody tr').length,
      bars:root.querySelectorAll('.task-bar').length,
      forms:root.querySelectorAll('form').length});})()`));
  check(`Tab "${label}" mở được`, r === "OK" && info.root === true, JSON.stringify(info));
}

// dọn dữ liệu probe
console.log("\n▸ Dọn dữ liệu probe");
const mysql = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const cleanup = spawnSync(mysql, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "-e", "DELETE FROM work_items WHERE title LIKE '[PROBE GĐ4]%';"], { encoding: "utf8" });
check("Xoá được nhiệm vụ probe", (cleanup.stdout || "").includes("") && cleanup.status === 0,
  "exit=" + cleanup.status);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("Ảnh chụp / profile: " + ART);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
