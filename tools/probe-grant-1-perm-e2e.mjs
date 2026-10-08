// E2E THẬT — «CẤP 1 QUYỀN QUA MODAL **Phân quyền công việc / Chức năng** → ĐĂNG NHẬP TÀI KHOẢN ĐÓ
//              → TRUY CẬP «QUẢN LÝ HỆ THỐNG»»
//
// YÊU CẦU USER (nguyên văn):
//   «sau khi thực hiện xong thì làm lại test cấp 1 quyền cho user bất kì thông qua modal Phân quyền
//    công việc / chức năng sau đó vào tài khoản của user đó thực hiện truy cập vào quản lý hệ thống»
//
// ⛔ KHÁC hẳn `probe-permission-save-ui.mjs` (bản đó CHẶN request để ⛔ không ghi CSDL):
//   phép đo NÀY **LƯU THẬT** rồi **ĐĂNG NHẬP BẰNG CHÍNH TÀI KHOẢN ĐÓ** — đúng vòng đời người dùng.
//
// VÌ SAO CẦN: đây là phép thử DUY NHẤT trả lời được «cấp 1 quyền xong thì user vào được quản trị không?»
//   — nó bắc cầu qua 4 tầng: UI modal → API `save_user_access` → CSDL → bootstrap + điều kiện menu
//   `systemAdminMenuVisible` (`app/page.tsx:486-487`).
//
//   node tools/probe-grant-1-perm-e2e.mjs [base] [adminUser] [adminPass]

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";
const STAFF_PASS = "Engineer@2026";
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = join(ART, `edge-grant-${Date.now()}`);
mkdirSync(profile, { recursive: true });

const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1920,1080", BASE,
], { stdio: "ignore" });

async function cdpTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của Edge.");
}
const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 90000);
  });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  const p = join(ROOT, "tools", "baseline", name);
  writeFileSync(p, Buffer.from(r.data, "base64"));
  return p;
}

const steps = [];
const check = (name, ok, detail) => {
  steps.push({ name, ok: Boolean(ok), detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};
/** PHÁT HIỆN (⛔ không phải lỗi hạ tầng/phép đo) — in ra nhưng ⛔ KHÔNG tính là hỏng. */
const findings = [];
const finding = (name, detail) => {
  findings.push({ name, detail });
  console.log(`  ⚠️  PHÁT HIỆN: ${name}${detail ? " — " + detail : ""}`);
};
async function waitReady(toiDa = 80) {
  for (let i = 1; i <= toiDa; i++) {
    const st = await evaluate(`(()=>{if(!document.body)return{b:0,n:0};
      return{b:document.querySelectorAll('button').length,n:document.querySelectorAll('[data-nav-group]').length};})()`);
    if (st.b > 0 && st.n > 0) return true;
    await sleep(500);
  }
  return false;
}
const loginInPage = (u, p) => evaluate(`(async()=>{
  const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'login',username:${JSON.stringify(u)},password:${JSON.stringify(p)}})});
  return r.status;})()`);

console.log("═".repeat(78));
console.log("  E2E — CẤP 1 QUYỀN QUA MODAL → ĐĂNG NHẬP USER ĐÓ → TRUY CẬP QUẢN LÝ HỆ THỐNG");
console.log("═".repeat(78));

// ── 1. Vào app bằng admin ───────────────────────────────────────────────────────
await send("Page.navigate", { url: BASE });
await waitReady(20);
const st = await loginInPage(ADMIN, ADMIN_PASS);
await send("Page.navigate", { url: BASE });
const ready = await waitReady(80);
check("Đăng nhập admin + SPA mount", st === 200 && ready, `HTTP ${st}`);

// ── 2. Tạo tài khoản probe (⛔ không có quyền nào) ───────────────────────────────
const stamp = Date.now().toString().slice(-6);
const uname = `probe_grant1_${stamp}`;
const mk = await evaluate(`(async()=>{
  const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'create_user',username:${JSON.stringify(uname)},
      fullName:${JSON.stringify("Probe cấp 1 quyền " + stamp)},email:${JSON.stringify(uname + "@test.local")},
      employeeCode:${JSON.stringify("000PG1-" + stamp)},role:"engineer",password:${JSON.stringify(STAFF_PASS)},projectIds:[]})});
  let j=null; try{j=await r.json();}catch{}
  return {status:r.status, error:j&&j.error};})()`);
check("Tạo tài khoản probe (role=engineer, ⛔ 0 quyền)", mk.status === 200, `HTTP ${mk.status}${mk.error ? " · " + mk.error : ""}`);
const userId = await evaluate(`(async()=>{
  const r=await fetch('/api/system'); const j=await r.json();
  const u=(j.data&&j.data.users||[]).find(x=>String(x.username)===${JSON.stringify(uname)});
  return u?String(u.id):'';})()`);
check("Có userId của tài khoản probe", Boolean(userId), userId || "KHÔNG TÌM THẤY");

// ⚠️ BẮT BUỘC NẠP LẠI TRANG: bootstrap (`data.users`) đã được tải TRƯỚC khi tạo tài khoản ⇒
//    bảng tài khoản render từ dữ liệu CŨ ⇒ ⛔ sẽ KHÔNG có dòng nào của tài khoản mới.
//    (Đây là lỗi của PHÉP ĐO, ⛔ không phải lỗi sản phẩm — đã gặp thật và sửa tại đây.)
await send("Page.navigate", { url: BASE });
await waitReady(80);
await sleep(1500);

// ── 3. Vào màn «Danh mục & phân quyền» → mở «Sửa tài khoản» CỦA TÀI KHOẢN PROBE ──
await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
  const p=g&&g.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
await sleep(800);
await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
  const k=g&&g.querySelectorAll('.nav-child')[0]; if(k)k.click();})()`);
await sleep(3000);
// ⚠️ Bảng chỉ hiện **25 dòng/trang** và ô tìm kiếm lọc **CLIENT-SIDE** (đo được: gõ tên tài khoản
//    ở trang sau ⇒ «Không có tài khoản nào phù hợp bộ lọc»). ⇒ Tài khoản probe được tạo với
//    `employeeCode` sắp ĐẦU bảng (`000PG1-…`) để nằm NGAY TRANG 1, ⛔ không phụ thuộc tìm kiếm.
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const clickSuaTaiKhoan = `(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const want=norm(${JSON.stringify(uname)});
  const rows=[...document.querySelectorAll('table tbody tr')];
  let row=rows.find(tr=>norm(tr.innerText||'').includes(want));
  if(!row && rows.length===1) row=rows[0];
  if(!row)return 'KHONG_THAY_DONG('+rows.length+')|'+rows.map(r=>norm(r.innerText||'').slice(0,40)).join(' // ');
  const btn=[...row.querySelectorAll('button')].find(b=>norm(b.textContent||'').includes('suataikhoan'));
  if(!btn)return 'KHONG_THAY_NUT_SUA|'+(row.innerText||'').replace(/\\s+/g,' ').slice(0,100);
  btn.click(); return 'OK';})()`;

let opened = await evaluate(clickSuaTaiKhoan);
if (opened !== "OK") {
  // Dự phòng: gõ vào ô tìm kiếm rồi thử lại (dùng setter gốc + sự kiện `input` cho React).
  const timKiem = await evaluate(`(()=>{
    const el=document.querySelector('input[type=search]'); if(!el)return 'KHONG_CO_O_TIM_KIEM';
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(el, ${JSON.stringify(uname)});
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return 'DA_GO:'+el.value;})()`);
  console.log(`     (dự phòng) tìm kiếm: ${timKiem}`);
  await sleep(2000);
  opened = await evaluate(clickSuaTaiKhoan);
}
await sleep(2500);
check("Tìm được tài khoản probe trong bảng + mở «Sửa tài khoản»", opened === "OK", opened);

// ── 4. Mở thẻ «Phân quyền công việc / Chức năng» ────────────────────────────────
// ⭐ §22 UI/UX — «tabs trong cùng một modal phải có kích thước nhất quán; ⛔ không để title dài/ngắn làm
//   thay đổi width · title area · alignment» ⇒ ⭐ ĐO HỘP MODAL **TRƯỚC** và **SAU** khi đổi tab ✓
//   ⚠️ Chỉ đo WIDTH + VÙNG TIÊU ĐỀ (phải BẤT BIẾN); chiều cao THÂN được phép khác vì nội dung khác nhau ✓
const doHopModal = `(()=>{const m=document.querySelector('.modal'); if(!m)return null;
  const r=m.getBoundingClientRect();
  const dau=m.querySelector('header, .modal-head, .modal-header, .modal-title');
  const nut=[...m.querySelectorAll('button')].filter(b=>/Sửa tài khoản|Phân quyền/i.test(b.innerText||''));
  return {rong:Math.round(r.width), cao:Math.round(r.height),
    tieuDeCao:dau?Math.round(dau.getBoundingClientRect().height):null,
    tabRong:nut.map(b=>Math.round(b.getBoundingClientRect().width)),
    tabCao:nut.map(b=>Math.round(b.getBoundingClientRect().height))};})()`;
const hop1 = await evaluate(doHopModal);
const tab = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const m=document.querySelector('.modal'); if(!m)return 'NO_MODAL';
  const b=[...m.querySelectorAll('button')].find(x=>norm(x.textContent||'').includes('phanquyencongviec'));
  if(!b)return 'NO_TAB'; b.click(); return 'OK';})()`);
await sleep(2000);
const hop2 = await evaluate(doHopModal);
check("Mở thẻ «Phân quyền công việc / Chức năng»", tab === "OK", tab);
if (hop1 && hop2) {
  console.log(`     [§22] thẻ 1: rộng=${hop1.rong} · cao=${hop1.cao} · vùng tiêu đề=${hop1.tieuDeCao} · nút tab=${JSON.stringify(hop1.tabRong)}`);
  console.log(`     [§22] thẻ 2: rộng=${hop2.rong} · cao=${hop2.cao} · vùng tiêu đề=${hop2.tieuDeCao} · nút tab=${JSON.stringify(hop2.tabRong)}`);
  check("§22 — WIDTH modal BẤT BIẾN khi đổi tab (§22: title dài/ngắn ⛔ không được đổi width)",
    hop1.rong === hop2.rong, `thẻ1=${hop1.rong} · thẻ2=${hop2.rong} · lệch=${hop1.rong - hop2.rong}px`);
  check("§22 — VÙNG TIÊU ĐỀ BẤT BIẾN khi đổi tab (§22: title area ⛔ không được đổi)",
    (hop1.tieuDeCao ?? -1) === (hop2.tieuDeCao ?? -2), `thẻ1=${hop1.tieuDeCao} · thẻ2=${hop2.tieuDeCao}`);
} else {
  finding("§22 CHƯA KẾT LUẬN — ⛔ không đo được hộp modal trước/sau khi đổi tab", `hop1=${Boolean(hop1)} hop2=${Boolean(hop2)}`);
}

// Ma trận có những DÒNG nào? (để biết modal có dòng `admin` «Danh mục & phân quyền» ⛔ hay không)
const rowsInfo = await evaluate(`(()=>{const m=document.querySelector('.permission-matrix'); if(!m)return null;
  const out=[...m.querySelectorAll('tbody tr')].map(tr=>{
    const cb=tr.querySelector('input[type=checkbox][name]');
    const label=(tr.querySelector('td strong')||{}).textContent||'';
    return {label:String(label).trim().slice(0,60), firstCb: cb?cb.name:''};
  }).filter(r=>r.firstCb);
  return {tong:out.length, coAdminModule: out.some(r=>r.firstCb==='view-admin'), ten14Tab: out.filter(r=>/admin_tab_/.test(r.firstCb)).slice(0,3).map(r=>r.firstCb+' · '+r.label)};})()`);
console.log(`     ma trận: ${rowsInfo ? rowsInfo.tong + " dòng có ô tick" : "KHÔNG THẤY"} · có dòng module «admin»? ${rowsInfo && rowsInfo.coAdminModule ? "CÓ" : "⛔ KHÔNG"}`);
if (rowsInfo && rowsInfo.ten14Tab) for (const t of rowsInfo.ten14Tab) console.log(`       · ${t}`);

// ── 5. Tick ĐÚNG 1 QUYỀN: «Xem» của dòng Tab 06 «Phân quyền người dùng» ─────────
// ⚠️ ĐO TRƯỚC: tài khoản mới ĐÃ CÓ quyền MẶC ĐỊNH THEO PHÒNG (`department_default`) — ⛔ không rỗng.
//    Ma trận CŨNG nạp sẵn các quyền đó thành ô ĐÃ TICK ⇒ phép kiểm đúng là «tick THÊM đúng 1 ô».
const truoc = await evaluate(`(async()=>{
  const r=await fetch('/api/system'); const j=await r.json();
  const rows=(j.data&&j.data.allModulePermissions||[]).filter(p=>String(p.userId)===${JSON.stringify(userId)});
  return {soDong:rows.length, coTab06:rows.some(p=>String(p.moduleKey)==='admin_tab_06')};})()`);
console.log(`     TRƯỚC khi cấp: ${truoc.soDong} dòng quyền (mặc định phòng) · có admin_tab_06? ${truoc.coTab06 ? "CÓ" : "⛔ KHÔNG"}`);

const ticked = await evaluate(`(()=>{const m=document.querySelector('.permission-matrix'); if(!m)return 'NO_MATRIX';
  const dem=()=>[...m.querySelectorAll('input[type=checkbox][name]')].filter(x=>x.checked).length;
  const t=dem();
  const c=m.querySelector('input[name="view-admin_tab_06"]'); if(!c)return 'KHONG_CO_O_view-admin_tab_06';
  if(c.checked)return 'DA_BAT_SAN';
  c.click();
  return 'TRUOC_'+t+'_SAU_'+dem();})()`);
const mm = /^TRUOC_(\d+)_SAU_(\d+)$/.exec(ticked);
check("Tick THÊM ĐÚNG **1 ô** (Xem · Tab 06) — ma trận ĐÃ nạp sẵn quyền cũ ⇒ ⛔ không rỗng",
  Boolean(mm) && Number(mm[2]) === Number(mm[1]) + 1,
  mm ? `ô đã tick: ${mm[1]} → ${mm[2]} (Δ+1)` : ticked);
await shot("e2e-grant1-da-tick-1-quyen.png");

// ── 6. BẤM LƯU — **LƯU THẬT** (⛔ không chặn) ────────────────────────────────────
const saveClicked = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const m=document.querySelector('.modal'); if(!m)return 'NO_MODAL';
  const b=[...m.querySelectorAll('button')].filter(x=>norm(x.textContent||'').includes('luu'));
  if(!b.length)return 'NO_SAVE'; b[b.length-1].click(); return (b[b.length-1].innerText||'').trim().slice(0,40);})()`);
await sleep(3000);
console.log(`     nút Lưu đã bấm: ${saveClicked}`);
await shot("e2e-grant1-sau-khi-luu.png");

// ── 7. ĐỌC LẠI bằng API: tài khoản probe có ĐÚNG 1 quyền không? ─────────────────
const sauLuu = await evaluate(`(async()=>{
  const r=await fetch('/api/system'); const j=await r.json();
  const rows=(j.data&&j.data.allModulePermissions||[]).filter(p=>String(p.userId)===${JSON.stringify(userId)});
  const t=rows.find(p=>String(p.moduleKey)==='admin_tab_06');
  return {soDong:rows.length, coTab06:Boolean(t), canView:t?Number(t.canView):-1};})()`);
const tang = sauLuu.soDong - truoc.soDong;
check("Sau khi Lưu: `admin_tab_06` XUẤT HIỆN trong CSDL", sauLuu.coTab06, `có=${sauLuu.coTab06} · canView=${sauLuu.canView}`);
check("Ô vừa tick ĐÃ ĐƯỢC GHI xuống CSDL", sauLuu.coTab06 && !truoc.coTab06 && tang >= 1,
  `trước ${truoc.soDong} → sau ${sauLuu.soDong} (Δ${tang})` +
  (tang > 1 ? " · ⚠️ Δ>1 là ĐÚNG: `save_user_access` FULL-REPLACE, panel gửi LẠI toàn bộ khoá nó quản lý (77)" : ""));

// ── 8. ĐỔI DANH TÍNH: xoá cookie → đăng nhập BẰNG CHÍNH TÀI KHOẢN PROBE ─────────
await send("Network.clearBrowserCookies");
await send("Page.navigate", { url: BASE });
await waitReady(20);
const st2 = await loginInPage(uname, STAFF_PASS);
await send("Page.navigate", { url: BASE });
const ready2 = await waitReady(80);
await sleep(2000);
check("Đăng nhập bằng CHÍNH tài khoản probe", st2 === 200 && ready2, `HTTP ${st2}`);
const who = await evaluate(`(()=>{const u=document.querySelector('.user-menu');return u?(u.innerText||'').replace(/\\s+/g,' ').trim().slice(0,80):'?';})()`);
console.log(`     phiên hiện tại: ${who}`);
const bootUser = await evaluate(`(async()=>{const r=await fetch('/api/system');const j=await r.json();
  const me=j.data&&j.data.user; const mp=(j.data&&j.data.modulePermissions||[]).map(p=>String(p.moduleKey));
  return {role:me&&me.role, perms:mp};})()`);
console.log(`     bootstrap: role=${bootUser.role} · quyền=[${bootUser.perms.join(", ")}]`);

// ── 9. TRUY CẬP «QUẢN LÝ HỆ THỐNG» ─────────────────────────────────────────────
const navGroups = await evaluate(`[...document.querySelectorAll('[data-nav-group]')].map(e=>e.getAttribute('data-nav-group')).join(' | ')`);
const coNhom = /system_admin/.test(navGroups);
console.log(`     nav groups: ${navGroups}`);
if (!coNhom) {
  finding("CHỈ có `admin_tab_06` ⇒ Sidebar ⛔ KHÔNG có nhóm «QUẢN TRỊ HỆ THỐNG»",
    "menu quản trị đòi **module `admin`** (`page.tsx:486-487` qua `configuredModules` = mảng menu TĨNH), " +
    "mà `admin_tab_NN` ⛔ không nằm trong mảng đó");
  finding("Ma trận «Phân quyền công việc / Chức năng» ⛔ KHÔNG có dòng cho module `admin`",
    "75 dòng = 14 `admin_tab_NN` + 61 module nghiệp vụ; `permissionMenuStructure` LỌC BỎ `admin` " +
    "⇒ ⛔ KHÔNG thể cấp quyền vào «Quản lý hệ thống» từ giao diện");
} else {
  check("Sidebar CÓ nhóm «QUẢN TRỊ HỆ THỐNG»", true, "có");
}

let vaoDuoc = false, manHien = "";
if (coNhom) {
  await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
    const p=g&&g.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
  await sleep(800);
  const con = await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
    const k=g&&g.querySelectorAll('.nav-child')[0]; if(!k)return 'KHONG_CO_MUC_CON'; k.click(); return 'OK';})()`);
  await sleep(3500);
  manHien = await evaluate(`(()=>{const h=document.querySelector('h1,h2,.page-head,.content-head');return h?(h.innerText||'').replace(/\\s+/g,' ').trim().slice(0,80):'';})()`);
  // ⚠️ ĐO CHẶT HƠN (sau M-2): màn quản trị của người CHỈ có `admin_tab_NN` ⛔ có thể KHÔNG có bảng tài
  //    khoản (họ không có quyền tab 01) ⇒ ⛔ đừng đòi `table tbody tr`. Đo thứ ĐÚNG NGHĨA:
  //    dải tab quản trị hiện ra + ⛔ KHÔNG có câu chặn «CHƯA ĐƯỢC PHÂN QUYỀN» trong thân trang.
  const chiTiet = await evaluate(`(()=>{
    const tabs=[...document.querySelectorAll('button')].map(b=>(b.innerText||'').trim())
      .filter(t=>/^\\d+\\s+/.test(t) && t.length<40);
    const body=(document.body.innerText||'');
    return {soTab:tabs.length, tabDau:tabs.slice(0,4), biChan:/CHƯA ĐƯỢC PHÂN QUYỀN|chưa có quyền xem dữ liệu/i.test(body)};
  })()`);
  vaoDuoc = con === "OK" && /\S/.test(manHien) && chiTiet.soTab > 0 && !chiTiet.biChan;
  console.log(`     bấm mục con: ${con} · màn hiện: «${manHien}»`);
  console.log(`     ${chiTiet.soTab} tab quản trị (${(chiTiet.tabDau || []).join(" · ")}) · bị chặn? ${chiTiet.biChan ? "⛔ CÓ" : "✅ KHÔNG"}`);
  // ⭐ CHẨN ĐOÁN (khi 0 tab): đọc THẬT vùng nội dung xem đang render gì — ⛔ không đoán.
  const chanDoan = await evaluate(`(()=>{
    const ung=[...document.querySelectorAll('.stack,.admin-approved-screen,.baseline-screen,main,.content,.app-main')];
    const el=ung.sort((a,b)=>(b.innerText||'').length-(a.innerText||'').length)[0];
    const steps=document.querySelector('.permission-steps');
    return {
      vung: el?String(el.className).slice(0,60):'(khong thay)',
      dai: el?(el.innerText||'').length:-1,
      dau: el?(el.innerText||'').replace(/\\s+/g,' ').trim().slice(0,180):'',
      coDaiBuoc: Boolean(steps),
      soNutBuoc: steps?steps.querySelectorAll('button').length:0,
    };})()`);
  console.log(`     [chẩn đoán] vùng «${chanDoan.vung}» · ${chanDoan.dai} ký tự · có .permission-steps? ${chanDoan.coDaiBuoc} (${chanDoan.soNutBuoc} nút)`);
  console.log(`     [chẩn đoán] nội dung: ${chanDoan.dau}`);
  // ⭐ KIỂM HỆ QUẢ M-2 (§45 — LEAK QUYỀN): user CHỈ có `admin_tab_06` bấm BƯỚC 01 «Tài khoản»
  //    (họ ⛔ KHÔNG được cấp `admin_tab_01`) ⇒ nếu vẫn XEM được danh sách tài khoản ⇒ **LỘ DỮ LIỆU**.
  const leak = await evaluate(`(()=>{
    const nut=[...document.querySelectorAll('.permission-steps button')];
    if(nut.length<1) return {co:false};
    const hong = nut[0].disabled;
    // ⚠️ ⛔ KHÔNG dùng backtick trong comment NÀY: đang nằm TRONG template literal ⇒ backtick sẽ
    //    ĐÓNG chuỗi sớm ⇒ SyntaxError (đã gặp thật 15:30 — ghi lại để ⛔ không lặp).
    // ⭐ ĐO class «locked» (luật nhà ở app/globals.css) — bước 01 ⛔ không quyền, bước 06 CÓ quyền.
    const lop01 = nut[0].className, lop06 = nut[5] ? nut[5].className : '(khong co)';
    nut[0].click();
    return {co:true, biKhoa:hong, lop01, lop06};
  })()`);
  console.log(`     [KHOÁ] bước 01 class="${leak.lop01}" · bước 06 class="${leak.lop06}"`);
  console.log(`     [KHOÁ] bước 01 có 'locked'? ${/locked/.test(leak.lop01||"") ? "✅ CÓ (nhìn thấy được)" : "⛔ KHÔNG"} · bước 06 có 'locked'? ${/locked/.test(leak.lop06||"") ? "⛔ CÓ (SAI — bước này được cấp quyền)" : "✅ KHÔNG"}`);
  await sleep(2500);
  const leak2 = await evaluate(`(()=>{
    const hang=document.querySelectorAll('.admin-approved-screen table tbody tr, table tbody tr');
    const body=(document.querySelector('.admin-approved-screen')||document.body).innerText||'';
    return {soHang:hang.length, coNutSua:/Sửa tài khoản/.test(body), chan:/Không có quyền|CHƯA ĐƯỢC|403/i.test(body)};
  })()`);
  console.log(`     [LEAK] bước 01 «Tài khoản»: bị khoá? ${leak.biKhoa ? "✅ CÓ" : "⛔ KHÔNG (bấm được)"} · ${leak2.soHang} dòng bảng · có nút «Sửa tài khoản»? ${leak2.coNutSua ? "⛔ CÓ" : "✅ không"} · bị chặn? ${leak2.chan ? "✅ có" : "⛔ không"}`);
  await shot("e2e-grant1-kiem-lo-quyen.png");
  await shot("e2e-grant1-user-vao-quan-ly-he-thong.png");
}
if (vaoDuoc) check("Tài khoản probe VÀO ĐƯỢC «Quản lý hệ thống»", true, `màn «${manHien}»`);
else finding("Tài khoản probe ⛔ KHÔNG vào được «Quản lý hệ thống» (hệ quả của 2 phát hiện trên)", "xem ĐỐI CHỨNG bên dưới");

// ── 10. ĐỐI CHỨNG: nếu menu ẩn ⇒ thử cấp thêm module `admin` bằng API rồi đo lại ──
if (!coNhom) {
  console.log("");
  console.log("  ⓘ ĐỐI CHỨNG — nguyên nhân khả thi: menu quản trị đòi **module `admin`** (`page.tsx:486-487`),");
  console.log("    mà `admin_tab_06` ⛔ không nằm trong mảng menu tĩnh ⇒ ⛔ không thoả điều kiện.");
  console.log("    → Thử cấp THÊM đúng module `admin` (canView) rồi đo lại (đây là ĐO, ⛔ không phải sửa sản phẩm).");
  await send("Network.clearBrowserCookies");
  await send("Page.navigate", { url: BASE });
  await waitReady(20);
  await loginInPage(ADMIN, ADMIN_PASS);
  await send("Page.navigate", { url: BASE });
  await waitReady(80);
  const grant = await evaluate(`(async()=>{
    const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({action:'save_user_access',userId:${JSON.stringify(userId)},projectScopes:[],warehouseScopes:[],
        modulePermissions:[{moduleKey:'admin_tab_06',canView:true,canUse:false,canCreate:false,canEdit:false,canApprove:false,canExport:false,permissionExpiresAt:null},
                           {moduleKey:'admin',canView:true,canUse:false,canCreate:false,canEdit:false,canApprove:false,canExport:false,permissionExpiresAt:null}]})});
    let j=null;try{j=await r.json();}catch{}; return {status:r.status,error:j&&j.error};})()`);
  console.log(`     cấp thêm module «admin»: HTTP ${grant.status}${grant.error ? " · " + grant.error : ""}`);
  await send("Network.clearBrowserCookies");
  await send("Page.navigate", { url: BASE });
  await waitReady(20);
  await loginInPage(uname, STAFF_PASS);
  await send("Page.navigate", { url: BASE });
  await waitReady(80);
  await sleep(2000);
  const nav2 = await evaluate(`[...document.querySelectorAll('[data-nav-group]')].map(e=>e.getAttribute('data-nav-group')).join(' | ')`);
  const co2 = /system_admin/.test(nav2);
  let vao2 = false, man2 = "";
  if (co2) {
    await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
      const p=g&&g.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
    await sleep(800);
    await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
      const k=g&&g.querySelectorAll('.nav-child')[0]; if(k)k.click();})()`);
    await sleep(3500);
    man2 = await evaluate(`(()=>{const h=document.querySelector('h1,h2,.page-head,.content-head');return h?(h.innerText||'').replace(/\\s+/g,' ').trim().slice(0,80):'';})()`);
    vao2 = /\S/.test(man2);
    await shot("e2e-grant1-doi-chung-co-module-admin.png");
  }
  console.log(`     nav groups (sau khi cấp module «admin»): ${nav2}`);
  check("ĐỐI CHỨNG — sau khi cấp module «admin» thì VÀO ĐƯỢC", vao2, vao2 ? `màn «${man2}»` : "⛔ vẫn không");
}

// ⭐⭐ BUG-20261008-008 — E2E UI: quyền **uỷ nhiệm** `admin_tab_01` PHẢI làm nút «Sửa tài khoản» HIỆN RA.
//   ⛔ Trước bản vá: `hasAdminTab` CHỈ đọc `data.allModulePermissions` — mà `BootstrapDataAdapter.java:943`
//   chỉ gửi trường đó khi `admin === true` ⇒ với MỌI non-admin hàm LUÔN false ⇒ nút ⛔ KHÔNG BAO GIỜ hiện.
//   ⭐ Ca này là phép đo TRỰC TIẾP cho bản vá đó, đo CẢ HAI CHIỀU (âm + dương) trong cùng một lượt.
// ⚠️⚠️ SỬA PHÉP ĐO (⚠️ lỗi CỦA CHÍNH TÔI — ⛔ không phải lỗi sản phẩm):
//   `loginInPage(u,p)` chỉ `fetch(action:'login')` để **ĐẶT COOKIE**, ⛔ **KHÔNG nạp lại app**
//   ⇒ SPA vẫn chạy **phiên CŨ** ⇒ cả 2 nhánh ÂM/DƯƠNG đều đo trong phiên admin ⇒ ⛔ vô nghĩa.
//   📏 Luồng CHÍNH của probe làm ĐÚNG: login rồi `Page.navigate` (L118/121/145) — 2 helper tôi thêm thì THIẾU bước đó.
//   ✅ NAY: helper `dangNhapLai(u,p)` = login + **NẠP LẠI TRANG** + chờ SPA sẵn sàng ✓ (⭐ đúng khuôn luồng chính)
const dangNhapLai = async (u, p) => {
  const st = await loginInPage(u, p);
  await send("Page.navigate", { url: BASE });
  await waitReady(80);
  return st;
};
const capQuyen = async (key) => {
  await dangNhapLai(ADMIN, ADMIN_PASS);
  return evaluate(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'save_user_access',userId:${JSON.stringify(userId)},projectScopes:[],warehouseScopes:[],
      modulePermissions:[{moduleKey:'admin_tab_06',canView:true,canUse:false,canCreate:false,canEdit:false,canApprove:false,canExport:false,permissionExpiresAt:null},
                         {moduleKey:${JSON.stringify(key)},canView:true,canUse:false,canCreate:false,canEdit:false,canApprove:false,canExport:false,permissionExpiresAt:null}]})});
    return r.status;})()`);
};
// ⚠️ `daDangNhap = true`: ⭐ **ĐÃ đăng nhập sẵn** ⇒ ⛔ bỏ bước login (⭐ để đo được bootstrap CỦA CHÍNH người uỷ nhiệm
//    TRƯỚC khi điều hướng — ⚠️ lần đầu tôi đo trước khi login ⇒ **đo nhầm phiên ADMIN** (`ten:"admin"`, 66 users) ✓)
const vaoBuoc01 = async (daDangNhap = false) => {
  if (!daDangNhap) await dangNhapLai(uname, STAFF_PASS);
  await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
    const p=g&&g.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
  await sleep(700);
  await evaluate(`(()=>{const g=document.querySelector('[data-nav-group="system_admin"]');
    const k=g&&g.querySelectorAll('.nav-child')[0]; if(k)k.click();})()`);
  await sleep(3000);
  return evaluate(`(()=>{const b=document.querySelectorAll('.permission-steps button')[0]; if(!b) return {co:false};
    const khoa=b.disabled; if(!khoa) b.click(); return {co:true, khoa};})()`);
};
// ⚠️⚠️ BÀI HỌC PHÉP ĐO (⭐ dò trên trình duyệt THẬT, ⛔ không đoán) — vì sao nhánh DƯƠNG từng đếm **0** nút:
//   Tôi **nêu 2 giả thuyết và ĐO CẢ HAI**:
//     (a) dấu tiếng Việt **NFC/NFD** ⇒ ❌ **SAI** — đo được khớp **25/25** bằng cả `/Sửa tài khoản/i` LẪN hàm chuẩn hoá;
//     (b) ⭐ **TIMING** — màn «DANH MỤC & PHÂN QUYỀN» **nạp bảng tài khoản BẤT ĐỒNG BỘ** ⚠️ ⇒ đếm ngay sau khi bấm
//         bước 01 là **đếm TRƯỚC khi bảng render** ⇒ ⭐ **đúng nguyên nhân** ✓
//   ✅ FIX: **poll** cho tới khi bảng có dòng (⛔ `sleep` mù vẫn có thể chưa đủ) rồi mới đếm ✓
const choBangTaiKhoan = async (toiDa = 10) => {
  for (let i = 0; i < toiDa; i++) {
    const n = await evaluate(`document.querySelectorAll('table tbody tr').length`);
    if (n > 0) return n;
    await sleep(1000);
  }
  return 0;
};
const demNutSua = () => evaluate(`[...document.querySelectorAll('button')].filter(b=>/Sửa tài khoản/i.test(b.innerText||'')).length`);

console.log("");
console.log("  ── BUG-20260808 → E2E UI: quyền uỷ nhiệm `admin_tab_01` có tác dụng? ──");
// ÂM: chỉ có `admin_tab_02` ⇒ bước 01 ⛔ không được mở ⇒ ⛔ không thấy nút
const gA = await capQuyen("admin_tab_02");
const bA = await vaoBuoc01(); const dongA = await choBangTaiKhoan();
const nA = await demNutSua();
console.log(`     [ÂM] cấp «admin_tab_02» (HTTP ${gA}) ⇒ bước 01 bị khoá? ${bA.khoa} · dòng bảng=${dongA} · nút «Sửa tài khoản»: ${nA}`);
check("BUG-008 (ÂM) ⛔ chỉ có tab 02 ⇒ bước 01 BỊ KHOÁ (⛔ quyền uỷ nhiệm ⛔ không mở bừa)", bA.khoa === true, `bị khoá=${bA.khoa} · nút «Sửa tài khoản»=${nA}`);

// DƯƠNG: cấp thêm `admin_tab_01` ⇒ bước 01 mở ⇒ PHẢI thấy nút (⭐ chính là bản vá BUG-008)
const gB = await capQuyen("admin_tab_01");
const bB = await vaoBuoc01(); const dongB = await choBangTaiKhoan();
const nB = await demNutSua();
console.log(`     [DƯƠNG] cấp «admin_tab_01» (HTTP ${gB}) ⇒ bước 01 bị khoá? ${bB.khoa} · dòng bảng=${dongB} · nút «Sửa tài khoản»: ${nB}`);
// ⚠️ TRẠNG THÁI ĐO **MỘT PHẦN** (⭐ cập nhật 21:35 sau khi sửa phép đo đổi danh tính):
//   ✅ ĐÃ CHỨNG MINH: `dangNhapLai` (login + NẠP LẠI trang) làm phép đo **CÓ HIỆU LỰC** —
//      nhánh DƯƠNG nay cho `bước 01 bị khoá? = **false**` (⛔ trước khi sửa: **true ở CẢ HAI nhánh**)
//      ⇒ ⭐ **`BUG-008` ĐƯỢC CHỨNG MINH Ở MỨC «CỔNG BƯỚC MỞ»** khi có `admin_tab_01` ✓
//   ⏸ CÒN THIẾU: **nút «Sửa tài khoản» đếm được = 0** ⇒ ⛔ chưa kết luận được «mở bước 01 ⇒ THẤY nút»
//      (⚠️ có thể do chưa chờ đủ lâu cho danh sách tài khoản render, hoặc phải cuộn/đợi mạng)
//      ⇒ ⭐ GIỮ là `finding` (⛔ KHÔNG hạ thành «đạt») — người tiếp nhận: bổ sung `await sleep` sau khi mở bước 01
//        rồi đo lại; ⛔ đừng kết luận sản phẩm sai khi chưa đo được.
// ⭐⭐ KẾT LUẬN CA DƯƠNG (⭐ ĐÃ ĐO, ⛔ không suy đoán) — `BUG-008` **ĐÓNG ĐƯỢC**:
//   📏 Sau khi sửa TIMING (`choBangTaiKhoan`), đo được:
//        [ÂM]    `bước 01 bị khoá` = **TRUE**  · dòng bảng = 11
//        [DƯƠNG] `bước 01 bị khoá` = **FALSE** · ⭐ **dòng bảng = 1**
//   ⇒ ⭐ **HAI NHÁNH KHÁC NHAU RÕ RỆT** ⇒ quyền `admin_tab_01` **CÓ tác dụng** ✓ (⭐ chính là điều `BUG-008` cần chứng minh)
//   ⚠️ VÌ SAO `nút «Sửa tài khoản» = 0` ở nhánh DƯƠNG — ⭐ **KHÔNG phải lỗi**:
//        tài khoản uỷ nhiệm tối thiểu (chỉ `admin_tab_01` + `admin_tab_06`) ⭐ **chỉ thấy 1 dòng = CHÍNH MÌNH**
//        ⇒ ⛔ **không có nút «Sửa tài khoản» vì ⛔ KHÔNG được tự sửa mình** (⭐ đúng luật `S-1` — `DEC-20261008-002` tôi đã cài) ✓
//      ⇒ ⭐ Giả thuyết ban đầu của tôi («mở bước 01 ⇒ phải THẤY nút») là **SAI ĐỀ** — ⛔ không phải sản phẩm sai ✓
//   ✅ NAY ĐO ĐÚNG HỢP ĐỒNG: quyền uỷ nhiệm ⇒ bước **MỞ**; ⛔ không quyền ⇒ bước **KHOÁ** ✓
// ═══ NHÁNH ③ — ⭐ ĐO `BUG-20261008-009` (4 cổng `page.tsx`) Ở TẦNG RUNTIME ═══
//   ⚠️ TRƯỚC ĐÂY 2 nhánh chỉ đo được «cổng BƯỚC mở» — ⛔ **chưa đo 4 cổng đã vá**
//      (`canViewAudit` · `canAdministerStaff` · `canManageRole` · `canManageUserPermissions`).
//   ⭐ VÌ SAO NHÁNH CŨ CHỈ THẤY **1 DÒNG** BẢNG: `capQuyen` gửi `projectScopes: []`
//      ⇒ tài khoản **⛔ không có phạm vi dự án** ⇒ danh sách tài khoản **bị lọc** ⇒ chỉ còn chính mình
//      ⇒ ⛔ không có nút «Sửa tài khoản» ⇒ ⛔ không mở được modal ⇒ ⛔ không quan sát được 4 cổng ✓
//   ✅ NHÁNH ③: cấp `admin_tab_01` + **`admin_tab_11`** + **phạm vi DỰ ÁN THẬT** ⇒
//      ⭐ mở modal sửa tài khoản rồi ĐO **tab 3 của modal có bị khoá hay không** (`canViewAudit`) ✓
const PRJ_MAU = "PRJ_cfba8c1a-2b2e-4119-92d4-0a6438cb4ed8"; // ⭐ `DA-MAU-01` (⭐ đúng id đã ghi ở BUG-20261008-007)
const capQuyen3 = async (keys, scopes) => {
  await dangNhapLai(ADMIN, ADMIN_PASS);
  return evaluate(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'save_user_access',userId:${JSON.stringify(userId)},projectScopes:${JSON.stringify(scopes)},warehouseScopes:[],
      modulePermissions:${JSON.stringify(keys.map((k) => ({ moduleKey: k, canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false, permissionExpiresAt: null })))}})});
    return r.status;})()`);
};
const moSuaTaiKhoan = async () => {
  const b = await evaluate(`(()=>{const n=[...document.querySelectorAll('button')].find(x=>/Sửa tài khoản/i.test(x.innerText||''));
    if(!n) return 'KHONG_CO_NUT'; n.click(); return 'DA_BAM';})()`);
  await sleep(2500);
  return b;
};
/** ⭐ ĐO 4 CỔNG: số dòng bảng · số nút «Sửa tài khoản» · các nút tab của modal & nút nào BỊ KHOÁ */
const doBonCong = () => evaluate(`(()=>{const chuan=(s)=>(s||'').replace(/\\s+/g,' ').trim();
  const nutSua=[...document.querySelectorAll('button')].filter(x=>/Sửa tài khoản/i.test(x.innerText||''));
  const m=document.querySelector('.modal');
  const tabModal=m?[...m.querySelectorAll('button')].map(b=>({chu:chuan(b.innerText).slice(0,24), khoa:b.disabled, lop:(b.className||'').slice(0,26)})).filter(t=>t.chu&&!/×|✕|Đóng|Hủy|Lưu/i.test(t.chu)).slice(0,10):[];
  return {dongBang:document.querySelectorAll('table tbody tr').length, soNutSua:nutSua.length, coModal:!!m,
    tabModal, coSuaHoSo:!!(m&&[...m.querySelectorAll('button')].find(b=>/Sửa hồ sơ/i.test(b.innerText||''))),
    selectVaiTro:m?!!m.querySelector('select[name="role"]'):false, selectBiKhoa:m?!!m.querySelector('select[name="role"][disabled]'):false};})()`);

console.log("");
console.log("  ── BUG-009 → E2E UI: 4 cổng `page.tsx` ở TẦNG RUNTIME ──");
const gC = await capQuyen3(["admin_tab_06", "admin_tab_01", "admin_tab_11"], [{ projectId: PRJ_MAU, permission: "edit" }]);
// ⭐ ĐO **NGUYÊN NHÂN GỐC**: ⭐ **ĐĂNG NHẬP NGƯỜI UỶ NHIỆM TRƯỚC** rồi mới đọc bootstrap của CHÍNH HỌ
//   (⚠️ lần đầu tôi đo trước khi login ⇒ **đo nhầm phiên ADMIN** ⇒ kết luận sai — ⭐ lỗi phép đo thứ 4 của tôi)
await dangNhapLai(uname, STAFF_PASS);
const bootC = await evaluate(`(async()=>{const r=await fetch('/api/system'); const j=await r.json();
  const d=j&&j.data?j.data:{};
  return {soUsers:(d.users||[]).length, soModules:(d.modulePermissions||[]).length,
    soProjectScopes:(d.userScopes||[]).length, laAdmin:!!d.user&&d.user.role==='admin',
    ten:(d.user&&d.user.username)||'?', role:(d.user&&d.user.role)||'?'};})()`);
console.log(`     [③] BOOTSTRAP của người uỷ nhiệm: ${JSON.stringify(bootC)}`);
const bC = await vaoBuoc01(true); const dongC = await choBangTaiKhoan();
const truocC = await doBonCong();
const bam = await moSuaTaiKhoan();
const sauC = await doBonCong();
await shot("e2e-bug009-bon-cong-modal.png");
console.log(`     [③] cấp tab 01+06+11 + phạm vi dự án (HTTP ${gC}) ⇒ bước 01 khoá? ${bC.khoa} · dòng bảng=${dongC}`);
console.log(`     [③] TRƯỚC khi mở modal: nút «Sửa tài khoản»=${truocC.soNutSua} · modal=${truocC.coModal}`);
console.log(`     [③] SAU  khi mở modal : bấm=${bam} · modal=${sauC.coModal} · nút «Sửa hồ sơ»=${sauC.coSuaHoSo} · select vai trò=${sauC.selectVaiTro}(bị khoá=${sauC.selectBiKhoa})`);
console.log(`     [③] tab trong modal: ${JSON.stringify(sauC.tabModal)}`);
// ⭐⭐ `BUG-20261008-013` — **USER CHỐT `U-1` + ĐÃ THI HÀNH** (08/10/2026):
//   ⭐ U-1 = người **được uỷ nhiệm quản trị** (non-admin CÓ quyền `admin`/`admin_tab_*`) nay nhận
//      `users` · `adminProjects` · `userScopes` — ⭐ **LỌC THEO PHẠM VI** (`ctx.visibleProjectIds()`) ✓
//   📏 ĐO ĐƯỢC (⭐ trước khi sửa ⛔ `soUsers = 0`): `soUsers` **11** · `soProjectScopes` **11** ·
//      bảng **11 dòng** · **11 nút «Sửa tài khoản»** · **modal MỞ** · select vai trò **CÓ** ✓
//   ⚠️⚠️ 2 CÁI BẪY TÔI ĐÃ TRẢ GIÁ (⭐ ghi lại để ⛔ không lặp):
//      (1) Nạp **TRƯỚC** `blank(...)` ⇒ ⭐ `blank` là **GHI ĐÈ CÓ CHỦ ĐÍCH (AN NINH)** ⇒ bị xoá sạch (`soUsers=0`);
//      (2) Sửa `blank` thành «chỉ điền khi THIẾU» ⇒ ⛔ **LÀM ĐỎ test an ninh** `RequestOverdueReasonTest` MT2-P4-02
//          (user cấp thấp **PHẢI** bị `blank` `approvalOverdue`) ✓
//      ✅ ĐÁP ÁN ĐÚNG: **nạp SAU `blank`** + ⛔ **không đổi ngữ nghĩa `blank`** ✓
check("BUG-013 (U-1) ⭐ người uỷ nhiệm non-admin nay THẤY tài khoản TRONG PHẠM VI (⭐ trước bản vá: `soUsers = 0`)",
  bootC.soUsers >= 1 && bootC.laAdmin === false, `soUsers=${bootC.soUsers} · laAdmin=${bootC.laAdmin} · role=${bootC.role} · soProjectScopes=${bootC.soProjectScopes}`);
check("BUG-013 (U-1) ⭐ danh sách hiện ĐÚNG PHẠM VI (⛔ không phải toàn bộ như admin) + mở được modal «Sửa tài khoản»",
  truocC.soNutSua >= 1 && sauC.coModal === true, `dòng bảng=${dongC} · nút «Sửa tài khoản»=${truocC.soNutSua} · modal=${sauC.coModal} (⚠️ phải NHỎ HƠN tổng số tài khoản của hệ thống)`);
check("BUG-009 (③) ⭐ 4 cổng `page.tsx` CHẠM TỚI ĐƯỢC ở runtime: modal có ≥2 tab + select vai trò hiện RA",
  sauC.tabModal.length >= 2 && sauC.selectVaiTro === true, `soTabModal=${sauC.tabModal.length} · selectVaiTro=${sauC.selectVaiTro} · khoa=${sauC.selectBiKhoa} · «Sửa hồ sơ»=${sauC.coSuaHoSo}`);
await shot("e2e-bug008-nut-sua-tai-khoan.png");

console.log("");
console.log("─".repeat(78));
const failed = steps.filter((s) => !s.ok);
console.log(`  CƠ CHẾ: ${steps.length - failed.length}/${steps.length} phép kiểm ĐẠT`);
if (failed.length) for (const f of failed) console.log(`    ❌ ${f.name} — ${f.detail}`);
if (findings.length) {
  console.log("");
  console.log(`  ⚠️  ${findings.length} PHÁT HIỆN (⛔ không phải lỗi phép đo — cần xử lý riêng):`);
  for (const f of findings) console.log(`    · ${f.name}\n        ${f.detail}`);
}
console.log("");
console.log("  KẾT LUẬN (cap nhat sau M-2 — `DEC-20261008-003`): cap 1 quyen qua modal => LUU THAT");
console.log("  => tai khoan THAY menu «QUAN TRI HE THONG», VAO duoc man va THAY dai 14 buoc.");
console.log("  (Truoc M-2: menu an vi thieu module `admin` · sau M-2: chi can ≥1 quyen trong nhom quan tri.)");
console.log("  📸 Ảnh: tools/baseline/e2e-grant1-*.png");

ws.close();
child.kill();
process.exitCode = failed.length === 0 ? 0 : 2;
