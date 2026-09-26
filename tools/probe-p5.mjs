#!/usr/bin/env node
/**
 * Nghiệm thu ĐỢT P5 — PHÂN QUYỀN PHÒNG BAN · NGƯỜI DÙNG · CẤP BẬC.
 *   (1) Màn phân quyền có 11 tab, tab 5/6/7 đúng tên,
 *   (2) Tab "Phân quyền phòng ban": dropdown chỉ tên, bảng chức năng có đủ 6 quyền, nút cấp hàng loạt,
 *   (3) Tab "Phân quyền người dùng": bộ lọc tên/mã/phòng/chức danh + cột cảnh báo vượt quyền phòng ban,
 *   (4) Tab "Cấp bậc hệ thống": đủ 5 cấp bậc + cảnh báo khi chọn cấp bậc tự động toàn quyền,
 *   (5) BACKEND THẬT: lưu/thu hồi quyền phòng ban; CHẶN cấp quyền vượt phòng ban và
 *       XÁC NHẬN yêu cầu bị chặn KHÔNG làm mất quyền/phạm vi hiện có của người dùng,
 *   (6) Cấp bậc: gán được, chặn xóa cấp bậc đang có người giữ, khôi phục nguyên trạng,
 *   (7) Không phát sinh lỗi JS.
 *
 * Chạy: node tools/probe-p5.mjs [url] [user] [password]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const SHOT_DIR = join(tmpdir(), "vntech-artifacts");
mkdirSync(SHOT_DIR, { recursive: true });

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(2); }
const profile = join(tmpdir(), "vntech-artifacts", "probe-p5");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9361;
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
  if (c.result?.data) { const p = join(SHOT_DIR, `p5-${name}.png`); writeFileSync(p, Buffer.from(c.result.data, "base64")); return p; }
  return null;
};
const clean = () => errs.filter((x) => !/favicon|DevTools|Download the React|React DevTools/i.test(x));
let failures = 0;
const check = (ok, label, detail = "") => { console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`); if (!ok) failures++; };
const api = async (action, payload) => ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:${JSON.stringify(action)},...${JSON.stringify(payload)}})});const j=await r.json().catch(()=>({}));return {status:r.status,ok:r.ok,error:j.error||"",message:j.message||""}})()`);
const boot = async () => ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return j.data})()`);
/** Mở tab theo NHÃN (an toàn khi số tab thay đổi giữa các đợt). */
const openTab = async (label) => { const ok = await ev(`(()=>{const re=new RegExp(${JSON.stringify(label)},"i");const b=[...document.querySelectorAll('.permission-steps button')].find(x=>re.test(x.innerText||''));if(b){b.click();return 1}return 0})()`); await sleep(2400); return ok; };

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);
if (await ev(`!!document.querySelector('input[type="password"]')`)) { console.error("❌ Không đăng nhập được."); ws.close(); b.kill(); process.exit(1); }
console.log("✅ Đã đăng nhập\n");

errs = [];
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
await sleep(900);
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');const c=[...g.querySelectorAll('.nav-child')].find(x=>/phân quyền/i.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
await sleep(3500);

// ---- 1) 11 tab ----
console.log("═══ 1) CẤU TRÚC TAB ═══");
const tabs = await ev(`[...document.querySelectorAll('.permission-steps button')].map(b=>(b.innerText||'').replace(/^\\d+\\s*/,'').replace(/\\s+/g,' ').trim())`);
console.log(`     ${JSON.stringify(tabs)}`);
check(Array.isArray(tabs) && tabs.length >= 11, "Có ít nhất 11 tab", `${(tabs || []).length}`);
if (!Array.isArray(tabs) || !tabs.length) {
  console.log(`     ↳ .permission-steps: ${await ev(`document.querySelectorAll('.permission-steps').length`)}`);
  console.log(`     ↳ còn form login: ${await ev(`!!document.querySelector('input[type="password"]')`)}`);
  console.log(`     ↳ API trong trang: ${JSON.stringify(await ev(`(async()=>{try{const r=await fetch('/api/system');const t=await r.text();return {status:r.status,len:t.length,head:t.slice(0,120)}}catch(e){return {err:String(e)}}})()`))}`);
  console.log(`     ↳ 600 ký tự đầu body:\n${String(await ev(`document.body.innerText`)).slice(0, 600)}`);
}
check((tabs || [])[4] === "Phân quyền phòng ban", "Tab 5 = Phân quyền phòng ban", (tabs || [])[4] || "");
check((tabs || [])[5] === "Phân quyền người dùng", "Tab 6 = Phân quyền người dùng", (tabs || [])[5] || "");
check((tabs || [])[6] === "Cấp bậc hệ thống", "Tab 7 = Cấp bậc hệ thống", (tabs || [])[6] || "");

// ---- 2) Tab 5 ----
console.log("\n═══ 2) TAB 5 — PHÂN QUYỀN PHÒNG BAN ═══");
errs = [];
await openTab("Phân quyền phòng ban");
const deptInfo = JSON.parse(await ev(`(()=>{
  // MT2-P14-03c (#27) - DO DUNG MAU MOI (app/page.tsx:1824-1830): moi phong ban la 1 NUT chua <b>ma</b> + <small>ten</small>
  // + <span>"n" quyen</span> => innerText BAT DAU bang MA (vi du "AD-01 ...") nen regex cu (bat dau bang "Phong") tra 0.
  // Nhan CA select cu de khong pha ban cu.
  const sel=[...document.querySelectorAll('.card select')][0];
  if(sel && sel.options && sel.options.length>2) return JSON.stringify({names:[...sel.options].map(o=>o.textContent.trim()), codeInName:false, kind:'select'});
  const btns=[...document.querySelectorAll('.card button')].filter(b=>b.querySelector('small'));
  const rows=btns.map(b=>({code:((b.querySelector('b')||{}).innerText||'').trim(), name:((b.querySelector('small')||{}).innerText||'').trim()}));
  return JSON.stringify({names:rows.map(r=>r.name).filter(Boolean), codeInName:rows.some(r=>r.code && r.name && r.name.includes(r.code)), kind:'nut-ma-ten'});
})()`));
const deptOpts = deptInfo.names || [];
console.log(`     kiểu điều khiển: ${deptInfo.kind} · ${JSON.stringify(deptOpts.slice(0, 6))}`);
check(deptOpts.length > 2, "Có danh sách chọn phòng ban (mẫu mới: nút mã+tên)", `${deptOpts.length} phòng`);
check(deptOpts.some((o) => /Kế hoạch/.test(o)) && deptInfo.codeInName === false, "Danh sách hiển thị TÊN phòng ban (không kèm mã trong tên)");
console.log(`     ${JSON.stringify((deptOpts || []).slice(0, 6))}`);
check(Array.isArray(deptOpts) && deptOpts.length > 2, "Có dropdown chọn phòng ban", `${(deptOpts || []).length} lựa chọn`);
check((deptOpts || []).some((o) => /Phòng Kế hoạch/.test(o)), "Dropdown hiển thị TÊN phòng ban (không kèm mã)");
const capHeaders = (await ev(`[...document.querySelectorAll('.card table thead th')].map(e=>e.innerText.trim()).filter(Boolean)`) || []).map((x) => String(x).toLocaleLowerCase("vi"));
// CSS đặt text-transform:uppercase cho <th>/<button> nên innerText trả chữ HOA — so khớp không phân biệt hoa/thường.
["Xem", "Thao tác", "Tạo", "Sửa", "Duyệt", "Xuất"].forEach((c) => check(capHeaders.includes(c.toLocaleLowerCase("vi")), `Có cột quyền "${c}"`));
// MT2-P14-03c (#27): nut hang loat nay co nhan «Nhom Ke hoach / Nhom Du an / Nhom Tai chinh / Nhom Hanh chinh /
// Bo chon tat ca / Luu thay doi» (app/page.tsx:103-108) - ban cu chi khop «cap nhom» nen dem thieu. Van doi >=5 nut.
const bulkBtns = await ev(`[...document.querySelectorAll('.card button')].map(e=>e.innerText.trim()).filter(t=>/nhóm |bỏ chọn|lưu thay đổi/i.test(t))`);
check(bulkBtns.length >= 5, "Có nút cấp quyền hàng loạt theo nhóm + lưu (Nhóm … / Bỏ chọn tất cả / Lưu thay đổi)", bulkBtns.join(" | "));
const cbCount = await ev(`document.querySelectorAll('.card table input[type="checkbox"]').length`);
check(cbCount > 100, "Bảng có ô tick cho từng chức năng", `${cbCount} ô`);
await shot("tab5-phong-ban");
check(clean().length === 0, "Không lỗi JS ở tab 5", clean()[0] || "");

// ---- 3) Tab 6 ----
console.log("\n═══ 3) TAB 6 — PHÂN QUYỀN NGƯỜI DÙNG ═══");
errs = [];
await openTab("Phân quyền người dùng");
const filters = await ev(`[...document.querySelectorAll('.card input,.card select')].map(e=>e.placeholder||e.tagName).join(' | ')`);
console.log(`     bộ lọc: ${filters}`);
const hasSearch = await ev(`!!document.querySelector('.card input[type=search], .card input.admin-search, input[type=search]')`);
check(hasSearch === true, "Có ô tìm kiếm theo tên/mã/chức danh");
const filterSelects = await ev(`document.querySelectorAll('.card select').length`);
check(filterSelects >= 2, "Có bộ lọc phòng ban và cấp bậc", `${filterSelects} dropdown`);
const heads = (await ev(`[...document.querySelectorAll('.card table thead th')].map(e=>e.innerText.trim())`) || []).map((x) => String(x).toLocaleLowerCase("vi"));
["Mã NV", "Họ tên", "Phòng ban", "Chức danh", "Cấp bậc", "Cảnh báo"].forEach((h) => check(heads.includes(h.toLocaleLowerCase("vi")), `Có cột "${h}"`));
const rowCount = await ev(`document.querySelectorAll('.card table tbody tr').length`);
check(rowCount > 0, "Hiển thị ma trận quyền của người dùng", `${rowCount} dòng`);
// Thu hẹp bằng tìm kiếm
await ev(`(()=>{const i=document.querySelector('.card input[type=search], .card input.admin-search, input[type=search]');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i,'Kế hoạch');i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await sleep(1200);
const filtered = await ev(`document.querySelectorAll('.card table tbody tr').length`);
check(filtered > 0 && filtered < rowCount, "Tìm kiếm lọc được danh sách", `${rowCount} → ${filtered}`);
await ev(`(()=>{const i=document.querySelector('.card input[type=search], .card input.admin-search, input[type=search]');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}));return 1})()`);
await sleep(1000);
await ev(`(()=>{const b=[...document.querySelectorAll('.card button')].find(x=>/Chi tiết/.test(x.innerText||''));if(b){b.click();return 1}return 0})()`);
await sleep(1200);
const detail = await ev(`document.querySelectorAll('.card .pill').length`);
check(detail > 0, "Mở được chi tiết quyền của một người dùng");
const copyBtn = await ev(`[...document.querySelectorAll('.card button')].some(b=>/Sao chép từ phòng ban/.test(b.innerText||''))`);
check(copyBtn === true, "Có nút sao chép quyền từ phòng ban");
await shot("tab6-nguoi-dung");
check(clean().length === 0, "Không lỗi JS ở tab 6", clean()[0] || "");

// ---- 4) Tab 7 ----
console.log("\n═══ 4) TAB 7 — CẤP BẬC HỆ THỐNG ═══");
errs = [];
await openTab("Cấp bậc hệ thống");
const levelRows = await ev(`[...document.querySelectorAll('.card table tbody tr')].map(r=>[...r.querySelectorAll('td')].map(t=>t.innerText.replace(/\\s+/g,' ').trim())).filter(a=>a.length>3)`);
check(levelRows.length >= 5, "Liệt kê đủ 5 cấp bậc", `${levelRows.length}`);
levelRows.forEach((r) => console.log(`     · ${r[1]} · ${r[2].slice(0, 40)} · tự động toàn quyền: ${r[3]} · vượt cấp: ${r[4]} · ${r[5]} người`));
check(levelRows.some((r) => /có/i.test(r[3])), "Có cấp bậc tự động toàn quyền");
check(levelRows.some((r) => /có/i.test(r[4])), "Có cấp bậc được duyệt vượt cấp");
// Chọn cấp bậc ⇒ phải hiện thông báo
await ev(`(()=>{const sels=[...document.querySelectorAll('.card select')];const s=sels[sels.length-1];const set=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;const opt=[...s.options].find(o=>/Tổng giám đốc/.test(o.textContent));set.call(s,opt.value);s.dispatchEvent(new Event('change',{bubbles:true}));return 1})()`);
await sleep(1200);
const notice = await ev(`(()=>{const a=[...document.querySelectorAll('.card .inline-alert')].map(e=>e.innerText.replace(/\\s+/g,' '));return a.find(t=>/TỰ ĐỘNG có toàn quyền|DUYỆT VƯỢT CẤP/.test(t))||''})()`);
check(!!notice, "Chọn cấp bậc ⇒ hiện thông báo về quyền tự động và duyệt vượt cấp", String(notice).slice(0, 130));
await shot("tab7-cap-bac");
check(clean().length === 0, "Không lỗi JS ở tab 7", clean()[0] || "");

// ---- 5) Backend: quyền phòng ban ----
console.log("\n═══ 5) BACKEND — QUYỀN PHÒNG BAN ═══");
const data = await boot();
const deptPerms = data.departmentModulePermissions || [];
const kh = deptPerms.find((d) => String(d.organizationCode) === "KH");
check(Boolean(kh), "Bootstrap trả departmentModulePermissions kèm mã phòng", `${deptPerms.length} dòng`);
const khUnitId = kh?.organizationUnitId;
const khModules = new Set(deptPerms.filter((d) => d.organizationUnitId === khUnitId).map((d) => String(d.moduleKey)));
// (a) cấp một chức năng KH chưa có, rồi thu hồi
const testModule = "dept_legal_seal";
check(!khModules.has(testModule), "Chức năng thử nghiệm chưa thuộc phòng Kế hoạch", testModule);
const add = await api("save_department_permission", { organizationUnitId: khUnitId, moduleKey: testModule, canView: 1, canUse: 1 });
check(add?.ok === true, "Cấp quyền chức năng cho phòng ban", add?.message || add?.error || "");
let after = (await boot()).departmentModulePermissions || [];
check(after.some((d) => d.organizationUnitId === khUnitId && String(d.moduleKey) === testModule), "Quyền phòng ban đã được lưu thật");
const del = await api("delete_department_permission", { organizationUnitId: khUnitId, moduleKey: testModule });
check(del?.ok === true, "Thu hồi quyền phòng ban", del?.message || del?.error || "");
after = (await boot()).departmentModulePermissions || [];
check(!after.some((d) => d.organizationUnitId === khUnitId && String(d.moduleKey) === testModule), "Đã thu hồi sạch");

// ---- 6) Ràng buộc phòng ban + KHÔNG mất dữ liệu khi bị chặn ----
console.log("\n═══ 6) RÀNG BUỘC PHÒNG BAN (và không mất quyền khi bị chặn) ═══");
const khUser = (data.users || []).find((u) => u.organizationUnitId === khUnitId && String(u.role) !== "admin");
check(Boolean(khUser), "Tìm được người dùng thuộc phòng Kế hoạch", khUser?.fullName || "");
// MT2-P14-03c (#27) — VIẾT LẠI BƯỚC 6 (đã truy tận gốc ở §H.15.2): `assertDepartmentAllowsPermissions`
// có 3 CỬA THOÁT SỚM (admin/auto_grant_all · orgUnitId rỗng · **phòng CHƯA cấu hình quyền nào**).
// Bản cũ ⛔ không cấu hình phòng ⇒ rơi cửa ③ ⇒ lệnh được CHẤP NHẬN (đúng thiết kế) ⇒ probe báo ❌ OAN.
// Nay: (1) chụp SNAPSHOT quyền user → (2) CẤU HÌNH phòng trước → (3) xin module phòng ⛔ không có ⇒ BẮT BUỘC 400
// → (4) kiểm KHÔNG mất quyền/phạm vi → (5) DỌN trong `finally`: thu hồi quyền phòng + KHÔI PHỤC quyền user (#25).
const UID = JSON.stringify(khUser?.id || "");
const readState = async () => ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();const d=j.data||{};
  const perms=(d.allModulePermissions||[]).filter(x=>x.userId===${UID}).map(x=>({moduleKey:x.moduleKey,canView:Number(x.canView)||0,canUse:Number(x.canUse)||0,canCreate:Number(x.canCreate)||0,canEdit:Number(x.canEdit)||0,canApprove:Number(x.canApprove)||0,canExport:Number(x.canExport)||0}));
  const ps=(d.userScopes||[]).filter(x=>x.userId===${UID}).map(x=>({projectId:x.projectId,permission:x.permission||"read"}));
  const ws=(d.userWarehouseScopes||[]).filter(x=>x.userId===${UID}).map(x=>({warehouseId:x.warehouseId,permission:x.permission||"read"}));
  return {perms:perms.length,scopes:ps.length,wh:ws.length,modulePermissions:perms,projectScopes:ps,warehouseScopes:ws}})()`);
const snap = await readState();
console.log(`     trước: perms=${snap?.perms} scopes=${snap?.scopes} wh=${snap?.wh}`);
// ⚠️ ĐO LẠI TIỀN ĐỀ (23/09/2026 — §H.19): bản vá trước vẫn ❌ vì probe XIN cấp `dept_legal_correspondence`
// nhưng ĐO CSDL cho thấy phòng KH **ĐÃ CÓ** chức năng đó (`department_module_permissions`: active=1, can_view=1)
// ⇒ `assertDepartmentAllowsPermissions` CHO PHÉP là ĐÚNG ⇒ ⛔ KHÔNG phải lỗi sản phẩm, mà là TIỀN ĐỀ SAI.
// Nay: (a) khẳng định phòng ĐÃ được cấu hình (đo được), (b) xin chức năng mà phòng **CHẮC CHẮN không có**
// = `testModule` (đã kiểm `!khModules.has(testModule)` ở bước 5) ⇒ ràng buộc PHẢI chặn.
check(khModules.size > 0, "Phòng Kế hoạch ĐÃ được cấu hình quyền (tiền đề để ràng buộc có hiệu lực)", `${khModules.size} chức năng`);
check(!khModules.has(testModule), "Chức năng dùng để thử CHẶN không thuộc phòng Kế hoạch (đo được)", testModule);
try {
  const blocked = await api("save_user_access", {
    userId: khUser?.id, projectScopes: [], warehouseScopes: [],
    modulePermissions: [{ moduleKey: testModule, canView: 1, canUse: 1, canCreate: 1, canEdit: 1, canApprove: 1, canExport: 1 }],
  });
  check(blocked?.ok === false, `CHẶN cấp quyền mà phòng ban không có (${testModule})`, String(blocked?.error || "").slice(0, 140));
  const after = await readState();
  console.log(`     sau : perms=${after?.perms} scopes=${after?.scopes} wh=${after?.wh}`);
  check(after?.perms === snap?.perms, "Quyền chức năng KHÔNG bị mất khi yêu cầu bị chặn", `${snap?.perms} → ${after?.perms}`);
  check(after?.scopes === snap?.scopes, "Phạm vi dự án KHÔNG bị mất khi yêu cầu bị chặn", `${snap?.scopes} → ${after?.scopes}`);
  check(after?.wh === snap?.wh, "Phạm vi kho KHÔNG bị mất khi yêu cầu bị chặn", `${snap?.wh} → ${after?.wh}`);
} finally {
  const hasState = (snap?.modulePermissions?.length || 0) + (snap?.projectScopes?.length || 0) + (snap?.warehouseScopes?.length || 0) > 0;
  const restore = hasState
    ? await api("save_user_access", {
        userId: khUser?.id, projectScopes: snap.projectScopes || [], warehouseScopes: snap.warehouseScopes || [],
        modulePermissions: snap.modulePermissions || [],
      })
    : { ok: true };
  const back = await readState();
  check(restore?.ok === true && back?.perms === snap?.perms && back?.scopes === snap?.scopes,
    "DỌN DẸP: khôi phục quyền/phạm vi người dùng về TRẠNG THÁI ĐẦU (⛔ không để lại tác dụng phụ)",
    `perms ${snap?.perms} → ${back?.perms} · scopes ${snap?.scopes} → ${back?.scopes}`);
}

// ---- 7) Cấp bậc: gán + chặn xóa ----
console.log("\n═══ 7) CẤP BẬC — GÁN VÀ CHẶN XÓA ═══");
const levels = data.systemLevelCatalog || [];
check(levels.length >= 5, "Bootstrap trả systemLevelCatalog", `${levels.length} cấp bậc`);
const originalLevel = khUser?.systemLevelCode || "";
const assign = await api("set_user_system_level", { userId: khUser?.id, levelCode: "nhan_vien" });
check(assign?.ok === true, "Gán cấp bậc cho tài khoản", String(assign?.message || assign?.error || "").slice(0, 120));
const assignedLevel = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return (j.data.users||[]).find(x=>x.id===${JSON.stringify(khUser?.id || "")})?.systemLevelCode})()`);
check(assignedLevel === "nhan_vien", "Cấp bậc đã lưu thật", String(assignedLevel));
const delLevel = await api("delete_system_level", { levelId: (levels.find((l) => String(l.code) === "nhan_vien") || {}).id });
check(delLevel?.ok === false, "Chặn xóa cấp bậc đang có người giữ", String(delLevel?.error || "").slice(0, 120));
const restore = await api("set_user_system_level", { userId: khUser?.id, levelCode: originalLevel });
check(restore?.ok === true, `Khôi phục cấp bậc gốc (${originalLevel || "trống"})`, String(restore?.message || "").slice(0, 90));

console.log(`\n═══ KẾT LUẬN: ${failures === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${failures} mục)`} ═══`);
console.log(`Ảnh chụp: ${SHOT_DIR}`);
ws.close(); b.kill();
process.exit(failures === 0 ? 0 : 1);
