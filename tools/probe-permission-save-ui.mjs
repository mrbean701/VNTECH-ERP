// NGHIỆM THU UI THẬT — «bấm Lưu có gửi đủ khoá không?» (BUG-20261008-001)
//
// VÌ SAO PHẢI CHẠY BẰNG TRÌNH DUYỆT THẬT:
//   Lỗi là FRONTEND dựng payload thiếu 16 khoá. Test đọc mã chỉ chứng minh được *hình dạng mã*;
//   phép đo này chứng minh **payload trình duyệt THỰC SỰ gửi** — đúng thứ đã hỏng.
//
// CÁCH ĐO (⛔ không vòng quanh, ⛔ không sửa dữ liệu người thật):
//   1. Mở app bằng Edge headless (CDP), đăng nhập admin.
//   2. Vào «QUẢN TRỊ HỆ THỐNG › DANH MỤC & PHÂN QUYỀN» → bấm «Sửa tài khoản» ở dòng đầu.
//   3. Mở thẻ «Phân quyền công việc / chức năng» (đúng modal user báo).
//   4. CÀI BẪY `window.fetch`: khi thấy `save_user_access` thì **ghi lại body rồi CHẶN**
//      (trả 200 giả) ⇒ ⛔ KHÔNG ghi gì vào CSDL người thật, nhưng vẫn thấy payload thật.
//   5. Tick `view-admin_tab_01` (khoá đã từng bị bỏ) + `view-purchasing` (khoá vốn vẫn được gửi).
//   6. Bấm «Lưu» ⇒ đọc payload đã bắt.
//   7. KHẲNG ĐỊNH: payload có ĐỦ 77 khoá (bằng số ô tick panel vẽ), trong đó `admin_tab_01`
//      = true. Trước bản vá payload chỉ có 61 khoá và ⛔ KHÔNG có `admin_tab_01`.
//
//   node tools/probe-permission-save-ui.mjs [base] [user] [pass]

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = join(tmpdir(), `edge-permsave-${Date.now()}`);
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

const steps = [];
const check = (name, ok, detail) => {
  steps.push({ name, ok: Boolean(ok), detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
};

console.log("═".repeat(76));
console.log("  NGHIỆM THU UI THẬT — payload «Lưu bảng phân quyền» có đủ khoá?");
console.log("═".repeat(76));

// ── 1. Đăng nhập + chờ SPA mount ────────────────────────────────────────────────
async function waitReady(toiDa = 60) {
  for (let i = 1; i <= toiDa; i++) {
    const st = await evaluate(`(()=>{if(!document.body)return{b:0,n:0};
      return {b:document.querySelectorAll('button').length,n:document.querySelectorAll('[data-nav-group]').length};})()`);
    if (st.b > 0 && st.n > 0) return true;
    await sleep(500);
  }
  return false;
}
await send("Page.navigate", { url: BASE });
await waitReady(20);
const loginStatus = await evaluate(`(async()=>{
  const r=await fetch('/api/system',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});
  return r.status;})()`);
await send("Page.navigate", { url: BASE });
const ready = await waitReady(80);
check("Đăng nhập admin + SPA mount", loginStatus === 200 && ready, `HTTP ${loginStatus}`);

// ── 2. Vào màn «Danh mục & phân quyền» ─────────────────────────────────────────
await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="system_admin"]');
  const p=s&&s.querySelector('.nav-parent'); if(p&&p.getAttribute('aria-expanded')==='false')p.click();})()`);
await sleep(800);
const navRes = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="system_admin"]');if(!s)return 'NO_GROUP';
  const k=s.querySelectorAll('.nav-child')[0]; if(!k)return 'NO_CHILD'; k.click(); return 'OK';})()`);
await sleep(3000);
check("Vào màn «Danh mục & phân quyền»", navRes === "OK", navRes);

// ── 3. Mở modal «Sửa tài khoản» ở dòng đầu ─────────────────────────────────────
const openEdit = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const btn=[...document.querySelectorAll('button')].find(b=>norm(b.textContent||'').includes('suataikhoan'));
  if(!btn)return 'NO_EDIT_BUTTON';
  if(btn.disabled)return 'DISABLED';
  btn.click(); return 'OK';})()`);
await sleep(2500);
check("Mở modal «Sửa tài khoản»", openEdit === "OK", openEdit);

const modalInfo = await evaluate(`(()=>{const m=document.querySelector('.modal');
  if(!m)return 'NO_MODAL';
  return {title:(m.querySelector('header')||{}).innerText||'', tabs:[...m.querySelectorAll('button')]
    .map(b=>(b.innerText||'').replace(/\\s+/g,' ').trim()).filter(t=>t&&t.length<48).slice(0,14)};})()`);
console.log("     modal:", JSON.stringify(modalInfo).slice(0, 300));

// ── 4. Mở thẻ «Phân quyền công việc / chức năng» ───────────────────────────────
const openTab = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const m=document.querySelector('.modal'); if(!m)return 'NO_MODAL';
  const b=[...m.querySelectorAll('button')].find(x=>norm(x.textContent||'').includes('phanquyencongviec'));
  if(!b)return 'NO_TAB('+[...m.querySelectorAll('button')].map(x=>(x.innerText||'').trim()).filter(Boolean).join('|').slice(0,160)+')';
  b.click(); return 'OK';})()`);
await sleep(2000);
check("Mở thẻ «Phân quyền công việc / chức năng»", openTab === "OK", openTab);

const matrixOk = await evaluate(`(()=>{const m=document.querySelector('.permission-matrix');
  if(!m)return 'NO_MATRIX';
  const cb=[...m.querySelectorAll('input[type=checkbox]')];
  return {rows:m.querySelectorAll('tbody tr').length, cb:cb.length, hasAdminTab:cb.some(c=>c.name==='view-admin_tab_01')};})()`);
check("Ma trận hiện ra + CÓ ô `admin_tab_01`", typeof matrixOk === "object" && matrixOk.hasAdminTab,
  typeof matrixOk === "object" ? `${matrixOk.rows} dòng · ${matrixOk.cb} ô tick` : String(matrixOk));

// ── 5. CÀI BẪY fetch — bắt payload rồi CHẶN (⛔ không ghi CSDL) ─────────────────
const trap = await evaluate(`(()=>{
  window.__cap=null;
  if(!window.__origFetch){ window.__origFetch=window.fetch; }
  window.fetch=function(...a){
    try{
      const [u,o]=a; const body=o&&o.body;
      if(String(u).includes('/api/system') && typeof body==='string' && body.includes('save_user_access')){
        window.__cap=body;
        return Promise.resolve(new Response(JSON.stringify({ok:true,message:'CHAN_BOI_PROBE'}),{status:200,headers:{'content-type':'application/json'}}));
      }
    }catch(e){}
    return window.__origFetch.apply(this,a);
  };
  return 'TRAP_SET';})()`);
check("Cài bẫy fetch (chặn ghi CSDL)", trap === "TRAP_SET", trap);

// ── 6. Tick `admin_tab_01` (khoá từng bị bỏ) + `purchasing` (khoá vốn vẫn gửi) ─
const tick = await evaluate(`(()=>{
  const m=document.querySelector('.permission-matrix'); if(!m)return 'NO_MATRIX';
  const set=(name,val)=>{const c=m.querySelector('input[name="'+name+'"]'); if(!c)return name+':KHONG_CO_O';
    if(c.checked!==val){ c.click(); } return name+':'+(m.querySelector('input[name="'+name+'"]').checked?'BAT':'TAT');};
  return [set('view-admin_tab_01',true), set('view-purchasing',true)].join(' | ');})()`);
await sleep(700);
check("Tick `view-admin_tab_01` + `view-purchasing`", /admin_tab_01:BAT/.test(tick), tick);

// ── 7. CHỤP tập khoá panel vẽ NGAY LÚC MODAL CÒN MỞ (sau khi bấm Lưu modal sẽ đóng) ──
const panelKeys = await evaluate(`(()=>{const m=document.querySelector('.permission-matrix');
  if(!m)return [];
  return [...new Set([...m.querySelectorAll('input[type=checkbox][name]')]
    .map(c=>c.name.replace(/^(view|use|create|edit|approve|export)-/,'')))];})()`);
check("Chụp được tập khoá panel vẽ (lúc modal còn mở)", panelKeys.length > 0, `${panelKeys.length} khoá`);

// ── 8. Bấm «Lưu» ───────────────────────────────────────────────────────────────
const save = await evaluate(`(()=>{
  const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const m=document.querySelector('.modal'); if(!m)return 'NO_MODAL';
  const btns=[...m.querySelectorAll('button')].filter(b=>norm(b.textContent||'').includes('luu'));
  if(!btns.length)return 'NO_SAVE('+[...m.querySelectorAll('button')].map(x=>(x.innerText||'').trim()).filter(Boolean).join('|').slice(0,160)+')';
  btns[btns.length-1].click(); return 'CLICKED:'+(btns[btns.length-1].innerText||'').trim().slice(0,40);})()`);
await sleep(2500);
console.log("     nút Lưu:", save);

const cap = await evaluate(`window.__cap`);
check("BẪY BẮT ĐƯỢC payload `save_user_access`", Boolean(cap), cap ? `${String(cap).length} byte` : "KHÔNG bắt được");

if (cap) {
  /** @type {{modulePermissions?: {moduleKey:string,canView:boolean}[]}} */
  const payload = JSON.parse(cap);
  const rows = payload.modulePermissions || [];
  const byKey = new Map(rows.map((r) => [String(r.moduleKey), r]));

  const adminTab = byKey.get("admin_tab_01");
  const pur = byKey.get("purchasing");

  console.log("");
  console.log(`  📏 PAYLOAD: ${rows.length} dòng · panel vẽ ${panelKeys.length} khoá`);
  check("Payload GỬI `admin_tab_01` (khoá đã từng bị bỏ)", Boolean(adminTab), adminTab ? JSON.stringify(adminTab) : "THIẾU");
  check("`admin_tab_01`.canView = true (đúng ô vừa tick)", Boolean(adminTab && adminTab.canView === true),
    adminTab ? `canView=${adminTab.canView}` : "—");
  check("Payload vẫn gửi khoá thường `purchasing`", Boolean(pur), pur ? `canView=${pur.canView}` : "THIẾU");
  check("Payload PHỦ ĐỦ tập khoá panel vẽ (⛔ không thiếu khoá nào)", rows.length >= panelKeys.length,
    `${rows.length} ≥ ${panelKeys.length}`);

  const sent = new Set(rows.map((r) => String(r.moduleKey)));
  const missing = panelKeys.filter((k) => !sent.has(k));
  check("⛔ KHÔNG khoá nào bị bỏ sót", missing.length === 0, missing.length ? `THIẾU: ${missing.join(", ")}` : "0 khoá thiếu");

  // ĐỐI CHỨNG ÂM: biểu thức CŨ (`configuredModules`) sẽ bỏ đúng 16 khoá này.
  const adminTabsSent = rows.filter((r) => /^admin_tab_\d{2}$/.test(String(r.moduleKey))).length;
  check("ĐỦ 14 khoá `admin_tab_NN` trong payload (biểu thức cũ gửi 0)", adminTabsSent === 14, `${adminTabsSent}/14`);
}

console.log("");
console.log("─".repeat(76));
const failed = steps.filter((s) => !s.ok);
console.log(failed.length === 0
  ? `  ✅ NGHIỆM THU ĐẠT — ${steps.length}/${steps.length} phép kiểm`
  : `  ❌ NGHIỆM THU HỎNG — ${steps.length - failed.length}/${steps.length} đạt · hỏng: ${failed.map((f) => f.name).join(" · ")}`);
console.log("  ⚠️  Request đã bị CHẶN ở tầng fetch ⇒ ⛔ KHÔNG có dữ liệu người thật nào bị ghi.");

ws.close();
child.kill();
process.exitCode = failed.length === 0 ? 0 : 2;
