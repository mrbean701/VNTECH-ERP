#!/usr/bin/env node
/**
 * Nghiệm thu ĐỢT P6 — AUDIT LOG.
 *   (1) Màn phân quyền có 12 tab, tab 11 = "Audit log",
 *   (2) Tab Audit log có KPI + bộ lọc (từ khóa / người dùng / chức năng / khoảng ngày / xóa lọc),
 *   (3) BACKEND THẬT: thao tác thay đổi dữ liệu ⇒ sinh bản ghi nhật ký có ĐỦ ngữ cảnh
 *       (người thực hiện, vai trò, phòng ban, cấp bậc, chức năng, quyền đã dùng, chi tiết),
 *   (4) Đăng nhập KHÔNG sinh nhật ký (nằm trong danh sách bỏ qua),
 *   (5) Mở chi tiết một bản ghi xem được dữ liệu gửi lên,
 *   (6) Không phát sinh lỗi JS.
 *
 * Chạy: node tools/probe-p6.mjs [url] [user] [password]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const SHOT_DIR = join(tmpdir(), "vntech-artifacts");
mkdirSync(SHOT_DIR, { recursive: true });

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(2); }
const profile = join(tmpdir(), "vntech-artifacts", "probe-p6");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9365;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1600,1400", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 40; i++) { try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((x) => x.type === "page"); if (page?.webSocketDebuggerUrl) return page;
  } catch {} await sleep(500); }
  throw new Error("Không kết nối được CDP của Edge.");
}
const t = await target();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0; const pending = new Map(); let errs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    errs.push((m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 220));
  if (m.method === "Runtime.exceptionThrown")
    errs.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || "").slice(0, 220));
};
const send = (method, params = {}) => new Promise((res) => { const my = ++seq; pending.set(my, res); ws.send(JSON.stringify({ id: my, method, params })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => {
  const c = await send("Page.captureScreenshot", { format: "png" });
  if (c.result?.data) { const p = join(SHOT_DIR, `p6-${name}.png`); writeFileSync(p, Buffer.from(c.result.data, "base64")); return p; }
  return null;
};
const clean = () => errs.filter((x) => !/favicon|DevTools|Download the React|React DevTools/i.test(x));
let failures = 0;
const check = (ok, label, detail = "") => { console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`); if (!ok) failures++; };
const api = async (action, payload) => ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:${JSON.stringify(action)},...${JSON.stringify(payload)}})});const j=await r.json().catch(()=>({}));return {status:r.status,ok:r.ok,error:j.error||"",message:j.message||""}})()`);
const audits = async () => ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return j.data.audits||[]})()`);
/** Mở tab theo NHÃN (an toàn khi số tab thay đổi giữa các đợt). */
const openTab = async (label) => { const ok = await ev(`(()=>{const re=new RegExp(${JSON.stringify(label)},"i");const b=[...document.querySelectorAll('.permission-steps button')].find(x=>re.test(x.innerText||''));if(b){b.click();return 1}return 0})()`); await sleep(2400); return ok; };

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(8000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(11000);
if (await ev(`!!document.querySelector('input[type="password"]')`)) { console.error("❌ Không đăng nhập được."); ws.close(); b.kill(); process.exit(1); }
console.log("✅ Đã đăng nhập\n");

// ---- 1) Sinh dữ liệu nhật ký bằng thao tác thật ----
console.log("═══ 1) SINH NHẬT KÝ BẰNG THAO TÁC THẬT ═══");
const before = await audits();
console.log(`     số bản ghi trước: ${before.length}`);
const beforeIds = new Set(before.map((a) => String(a.id)));
const data = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return {levels:j.data.systemLevelCatalog||[],depts:j.data.organizationUnits||[],users:j.data.users||[]}})()`);
const lvl = (data.levels || []).find((l) => String(l.code) === "giao_dich_probe") || null;
// (a) tạo cấp bậc mới → có save_system_level
const code = `probe_${Date.now().toString().slice(-6)}`;
const created = await api("save_system_level", { code, name: "Cấp bậc kiểm chứng P6", description: "Tạo bởi probe, sẽ xóa sau.", rank: 5, sortOrder: 5 });
check(created?.ok === true, "Tạo cấp bậc để sinh nhật ký", created?.message || created?.error || "");
// (b) lấy tổ chức đầu tiên cấp/thu hồi quyền → có save_department_permission + delete_department_permission
const dept = (data.depts || []).find((o) => o.unitType === "department");
const dep = await api("save_department_permission", { organizationUnitId: dept?.id, moduleKey: "dept_plan_alerts", canView: 1, canUse: 1 });
check(dep?.ok === true, "Cấp quyền phòng ban để sinh nhật ký", dep?.message || dep?.error || "");
await api("delete_department_permission", { organizationUnitId: dept?.id, moduleKey: "dept_plan_alerts" });
await sleep(1500);

const after = await audits();
console.log(`     số bản ghi sau : ${after.length}`);
// ⚠️ MT2-P14-03c (#27) — VÁ CÁCH ĐO: `BootstrapDataAdapter` trả `data.audits` với **`ORDER BY al.occurred_at DESC LIMIT 100`**
// ⇒ khi đã đủ 100 dòng thì **SO SỐ LƯỢNG KHÔNG BAO GIỜ TĂNG**. Cách đúng: so **ID dòng MỚI** (không có trong tập trước)
// — ⛔ KHÔNG hạ nhẹ: vẫn bắt buộc phải có bản ghi mới + đủ 3 hành động (2 phép kiểm dưới).
const fresh = after.filter((a) => !beforeIds.has(String(a.id)));
check(fresh.length > 0, "Thao tác thay đổi dữ liệu SINH RA bản ghi nhật ký (so ID dòng MỚI — ⛔ không so số lượng vì LIMIT 100)",
  `${before.length} → ${after.length} · mới ${fresh.length}`);
check(fresh.length >= 3, "Ghi đủ các thao tác vừa thực hiện", `${fresh.length} bản ghi mới`);
const actions = fresh.map((a) => String(a.action));
["save_system_level", "save_department_permission", "delete_department_permission"].forEach((a) =>
  check(actions.includes(a), `Có nhật ký cho hành động "${a}"`));
check(!actions.includes("login"), "Đăng nhập KHÔNG sinh nhật ký (đúng danh sách bỏ qua)");

// ---- 2) Ngữ cảnh đầy đủ ----
console.log("\n═══ 2) NGỮ CẢNH NGƯỜI THỰC HIỆN ═══");
const sample = fresh.find((a) => String(a.action) === "save_system_level") || fresh[0] || {};
console.log(`     mẫu: ${JSON.stringify({ action: sample.action, userName: sample.userName, userRole: sample.userRole, department: sample.department, systemLevel: sample.systemLevel, moduleKey: sample.moduleKey, permissionUsed: sample.permissionUsed, changeDetail: sample.changeDetail, ip: sample.ipAddress }).slice(0, 400)}`);
check(!!sample.userName, "Có TÊN người thực hiện", String(sample.userName || ""));
check(!!sample.userRole, "Có VAI TRÒ", String(sample.userRole || ""));
check(!!sample.permissionUsed, "Có QUYỀN ĐÃ DÙNG", String(sample.permissionUsed || ""));
check(!!sample.changeDetail, "Có MÔ TẢ THAY ĐỔI đọc được", String(sample.changeDetail || "").slice(0, 90));
check(!!sample.occurredAt, "Có THỜI GIAN", String(sample.occurredAt || ""));
check(!!sample.ipAddress, "Có ĐỊA CHỈ IP", String(sample.ipAddress || ""));
check(!!sample.afterJson && String(sample.afterJson).includes("{"), "Có DỮ LIỆU GỬI LÊN (afterJson)");
const adminUser = (data.users || []).find((u) => String(u.role) === "admin");
if (String(sample.userId || "") === String(adminUser?.id || "")) {
  check(String(sample.systemLevel || "") === "tong_giam_doc", "Có CẤP BẬC của người thực hiện (P5)", String(sample.systemLevel || ""));
}

// ---- 3) UI ----
console.log("\n═══ 3) TAB AUDIT LOG ═══");
errs = [];
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
await sleep(900);
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');const c=[...g.querySelectorAll('.nav-child')].find(x=>/phân quyền/i.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
await sleep(3500);
const tabs = await ev(`[...document.querySelectorAll('.permission-steps button')].map(b=>(b.innerText||'').replace(/^\\d+\\s*/,'').replace(/\\s+/g,' ').trim())`);
// ⚠️ MT2-P14-03c (#27) — BỎ KHOÁ TỔNG SỐ TAB: MT2-P12-01 đã THÊM tab «Thông báo» (12 → 13) và tab «Audit log»
// KHÔNG còn ở vị trí 11 ⇒ nay khẳng định theo **TÊN TAB** (⛔ không khoá vị trí/tổng số) nhưng VẪN đòi ≥12 tab.
check(Array.isArray(tabs) && tabs.length >= 12, "Có ÍT NHẤT 12 tab (⛔ không khoá tổng số)", `${(tabs || []).length}`);
check((tabs || []).includes("Audit log"), 'Có tab "Audit log" (theo TÊN, ⛔ không theo vị trí)',
  `vị trí ${((tabs || []).indexOf("Audit log") + 1) || 0}/${(tabs || []).length}`);
await openTab("Audit log");
const headOk = await ev(`/Nhật ký kiểm toán/.test(document.body.innerText)`);
check(headOk === true, "Mở được mục “Nhật ký kiểm toán”");
const kpi = await ev(`document.querySelectorAll('.kpi-grid .card, .kpi').length`);
check(kpi > 0, "Có thẻ số liệu tổng quan");
const filters = await ev(`(()=>{const c=[...document.querySelectorAll('.card')].find(x=>/Nhật ký kiểm toán/.test(x.innerText||''));if(!c)return null;return {search:!!c.querySelector('input[type=search], input.admin-search'),selects:c.querySelectorAll('select').length,dates:c.querySelectorAll('input[type=date]').length,clear:[...c.querySelectorAll('button')].some(b=>/Xóa lọc/i.test(b.innerText||''))}})()`);
// ⚠️ MT2-P14-03c (#27): ô tìm kiếm nay do component DÙNG CHUNG `ListToolbar` render (`ListToolbar.tsx:83` `type="search"`)
// ⇒ nhận CẢ `input[type=search]` lẫn lớp cũ `input.admin-search` (⛔ không hạ nhẹ: vẫn đòi CÓ ô tìm kiếm thật).
check(filters?.search === true, "Có ô tìm kiếm (qua ListToolbar dùng chung)");
check((filters?.selects || 0) >= 2, "Có lọc theo người dùng và chức năng", `${filters?.selects} dropdown`);
check((filters?.dates || 0) === 2, "Có lọc khoảng ngày", `${filters?.dates} ô ngày`);
check(filters?.clear === true, "Có nút xóa lọc");
const rows = await ev(`document.querySelectorAll('.card table tbody tr').length`);
check(rows > 0, "Bảng nhật ký có dữ liệu", `${rows} dòng`);
// Mở chi tiết
await ev(`(()=>{const b=[...document.querySelectorAll('.card table tbody button')].find(x=>/Xem/.test(x.innerText||''));if(b){b.click();return 1}return 0})()`);
await sleep(1200);
const detail = await ev(`(()=>{const t=document.querySelectorAll('.card textarea').length;const a=[...document.querySelectorAll('.card .inline-alert')].map(e=>e.innerText).join(' ');return {areas:t,hasEntity:/Đối tượng:/.test(a)}})()`);
check((detail?.areas || 0) > 0, "Mở chi tiết xem được dữ liệu gửi lên", `${detail?.areas} khung dữ liệu`);
check(detail?.hasEntity === true, "Chi tiết có thông tin đối tượng bị tác động");
await shot("tab11-audit-log");
check(clean().length === 0, "Không lỗi JS ở tab Audit log", clean()[0] || "");

// ---- 4) Lọc ----
console.log("\n═══ 4) BỘ LỌC ═══");
const total = await ev(`document.querySelectorAll('.card table tbody tr').length`);
await ev(`(()=>{
  // MT2-P14-03c (#27) - VA BUOC GO TU KHOA: ban cu dung lop CU .card input.admin-search nen khong tim thay input
  // => khong go duoc => danh sach khong loc (101 -> 101, bao OAN). Nay nhan CA input[type=search] (ListToolbar.tsx:83)
  // lan lop cu; van BAT BUOC go that + ban su kien React de loc that (khong ha nhe phep kiem).
  // (khong dung dau huyen trong chu thich nam TRONG template literal cua ev)
  const i=document.querySelector('.card input[type=search], .card input.admin-search, input[type=search]');
  if(!i) return 'NO_INPUT';
  const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  s.call(i,'save_system_level');
  i.dispatchEvent(new Event('input',{bubbles:true}));
  return 'TYPED';
})()`);
await sleep(1200);
const filtered = await ev(`document.querySelectorAll('.card table tbody tr').length`);
check(filtered > 0 && filtered < total, "Tìm kiếm lọc được nhật ký", `${total} → ${filtered}`);

// ---- 5) Dọn dẹp ----
console.log("\n═══ 5) DỌN DẸP ═══");
const levels = (await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return j.data.systemLevelCatalog||[]})()`)) || [];
const mine = levels.find((l) => String(l.code) === code);
if (mine) {
  const del = await api("delete_system_level", { levelId: mine.id });
  check(del?.ok === true, "Xóa cấp bậc kiểm chứng", del?.message || del?.error || "");
}
const left = ((await audits()) || []).filter((a) => String(a.changeDetail || "").includes(code));
console.log(`     còn ${left.length} bản ghi nhật ký nhắc tới cấp bậc kiểm chứng (nhật ký là append-only, giữ lại để truy vết).`);

console.log(`\n═══ KẾT LUẬN: ${failures === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${failures} mục)`} ═══`);
console.log(`Ảnh chụp: ${SHOT_DIR}`);
ws.close(); b.kill();
process.exit(failures === 0 ? 0 : 1);
