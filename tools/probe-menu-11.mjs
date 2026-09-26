#!/usr/bin/env node
/**
 * Nghiệm thu ĐỢT P2: xác minh TRÊN UI THẬT rằng
 *   (1) sidebar dựng đủ 11 nhóm nghiệp vụ (không còn nhóm "Khác" hay nhóm rỗng),
 *   (2) màn "Phân quyền người dùng" có 8 tab, tab 1 = Nhân sự, tab 2 = Tổ chức,
 *   (3) mọi tab mở được và KHÔNG phát sinh lỗi JS.
 *
 * Chạy: node tools/probe-menu-11.mjs [url] [user] [password]
 * Ảnh chụp ghi ra %TEMP%/vntech-artifacts/ để không làm bẩn workspace.
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

const EXPECTED_GROUPS = [
  // ⚠️ MT2-P14-03c (23/09/2026) — VÁ TÊN NHÓM: nguồn `lib/menu-helpers.ts:101` ghi «NHÓM MENU «CÔNG VIỆC»
  // TÁCH THÀNH 5 MỤC» ⇒ nhãn hiện hành là **«CÔNG VIỆC»** (bản cũ để «CÔNG VIỆC CỦA TÔI» ⇒ ❌ OAN).
  "CÔNG VIỆC", "QUẢN LÝ DỰ ÁN", "MEP", "MUA HÀNG & CUNG ỨNG",
  "KHO VẬT TƯ", "TỔ ĐỘI", "TÀI CHÍNH – KẾ TOÁN", "HÀNH CHÍNH – PHÁP CHẾ",
  "BÁO CÁO", "DANH MỤC VẬT TƯ GỐC", "QUẢN TRỊ HỆ THỐNG",
];
// Danh sách tab CỐ ĐỊNH của màn phân quyền (12 tab tại đợt P6).
// Chỉ khẳng định các tab NÀY PHẢI CÓ MẶT — KHÔNG khẳng định tổng số, để việc thêm tab
// ở đợt sau không làm probe cũ báo lỗi sai.
// ⚠️ MT2-P14-03c (23/09/2026) — VÁ TÊN TAB 1 THEO AD-01: nguyên văn roadmap «Đổi tên **Nhân sự → Tài khoản**»
// (`app/screens/admin-governance-pure.ts` · `ADMIN_STEP_LABELS[0] = "Tài khoản"`). Bản cũ còn để «Nhân sự» ⇒ ❌ OAN.
const EXPECTED_TABS = ["Tài khoản", "Tổ chức", "Chức danh / vai trò", "Nhóm quyền nghiệp vụ",
  "Phân quyền phòng ban", "Phân quyền người dùng", "Cấp bậc hệ thống", "Phạm vi dự án & kho",
  "Workflow phê duyệt", "Ngoại lệ cá nhân", "Audit log", "Cấu hình hệ thống"];

const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(2); }
const profile = join(tmpdir(), "vntech-artifacts", "probe-menu11");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9353;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1600,1200", "about:blank"], { stdio: "ignore" });
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
  if (c.result?.data) { const p = join(SHOT_DIR, `menu11-${name}.png`); writeFileSync(p, Buffer.from(c.result.data, "base64")); return p; }
  return null;
};
const clean = () => errs.filter((x) => !/favicon|DevTools|Download the React|React DevTools/i.test(x));

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
};

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);

// ---- Đăng nhập -------------------------------------------------------------
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);
if (await ev(`!!document.querySelector('input[type="password"]')`)) {
  console.error("❌ Không đăng nhập được."); ws.close(); b.kill(); process.exit(1);
}
console.log("✅ Đã đăng nhập\n");

// ---- 1) Sidebar: 11 nhóm nghiệp vụ -----------------------------------------
console.log("═══ 1) SIDEBAR — NHÓM MENU ═══");
// LƯU Ý: toggleGroup() chỉ giữ MỘT nhóm mở tại một thời điểm, nên phải mở lần lượt
// từng nhóm rồi đếm con của chính nhóm đó (không bấm dồn rồi đếm chung).
const groupKeys = await ev(`[...document.querySelectorAll('.nav-tree-group[data-nav-group]')].map(e=>e.dataset.navGroup)`);
const dashDirect = await ev(`(document.querySelector('.nav-dashboard-direct span')||{}).innerText||''`);
console.log(`  • Nút trực tiếp: ${JSON.stringify(dashDirect)}`);
const groups = [];
for (const key of (groupKeys || [])) {
  await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="${key}"]');if(!g)return 0;g.querySelector('.nav-parent').click();return 1})()`);
  await sleep(600);
  const info = await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="${key}"]');if(!g)return null;return {key:g.dataset.navGroup,label:g.dataset.navLabel,children:g.querySelectorAll('.nav-child').length,direct:!g.querySelector('.nav-children')}})()`);
  if (info) { groups.push(info); console.log(`     - ${String(info.label).padEnd(26)} [${info.key}] · ${info.children} chức năng${info.direct ? " (liên kết trực tiếp)" : ""}`); }
}
const labels = groups.map((g) => String(g.label).trim());
const missing = EXPECTED_GROUPS.filter((x) => !labels.includes(x));
const extra = labels.filter((x) => x !== "Khác" && !EXPECTED_GROUPS.includes(x));
// material_master là liên kết trực tiếp (collapsible=0) nên KHÔNG render con — đúng thiết kế.
const DIRECT_LINK_GROUPS = ["DANH MỤC VẬT TƯ GỐC"];
const empty = groups.filter((g) => g.children === 0 && !DIRECT_LINK_GROUPS.includes(String(g.label).trim())).map((g) => g.label);
check(groups.length === EXPECTED_GROUPS.length, `Đúng ${EXPECTED_GROUPS.length} nhóm menu`, `thực tế ${groups.length}`);
check(missing.length === 0, "Không thiếu nhóm nào", missing.length ? "thiếu: " + missing.join(", ") : "");
check(extra.length === 0, "Không có nhóm lạ", extra.length ? "lạ: " + extra.join(", ") : "");
check(!labels.includes("Khác"), "Không còn nhóm tạm 'Khác'");
check(empty.length === 0, "Mọi nhóm đều có chức năng", empty.length ? "rỗng: " + empty.join(", ") : "");
const orphanFree = await ev(`[...document.querySelectorAll('.nav-tree-group[data-nav-group]')].every(g=>g.dataset.navGroup!=='department_management'&&g.dataset.navGroup!=='overview')`);
check(orphanFree === true, "Không còn nhóm cũ department_management / overview trong cây menu");
check(labels.includes("MEP"), "Có nhóm MEP tách riêng");
check(labels.includes("TÀI CHÍNH – KẾ TOÁN"), "Có nhóm Tài chính – Kế toán tách riêng");
check(labels.includes("HÀNH CHÍNH – PHÁP CHẾ"), "Có nhóm Hành chính – Pháp chế tách riêng");
check(labels.includes("CÔNG VIỆC"), "Có nhóm «CÔNG VIỆC» (nguồn: lib/menu-helpers.ts:101)");
const totalChildren = groups.reduce((s, g) => s + g.children, 0);
check(totalChildren >= 55, "Tổng chức năng hiển thị đủ (>=55)", `thực tế ${totalChildren}`);
await shot("sidebar");

// ---- 2) Màn phân quyền: 8 tab ----------------------------------------------
console.log("\n═══ 2) MÀN PHÂN QUYỀN NGƯỜI DÙNG — TAB ═══");
errs = [];
await ev(`(()=>{const g=[...document.querySelectorAll('.nav-tree-group[data-nav-group]')].find(e=>e.dataset.navGroup==='system_admin');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p&&p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
await sleep(800);
await ev(`(()=>{const g=[...document.querySelectorAll('.nav-tree-group[data-nav-group]')].find(e=>e.dataset.navGroup==='system_admin');const c=[...g.querySelectorAll('.nav-child')].find(x=>/phân quyền/i.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
await sleep(3500);
const tabs = await ev(`[...document.querySelectorAll('.permission-steps button')].map(b=>(b.innerText||'').replace(/\\s+/g,' ').trim())`);
if (!Array.isArray(tabs) || !tabs.length) {
  console.log("  ⚠️  Không tìm thấy .permission-steps — chuyển thẳng tới màn quản trị.");
}
const tabNames = (tabs || []).map((x) => String(x).replace(/^\d+\s*/, "").trim());
tabNames.forEach((x, i) => console.log(`     ${i + 1}. ${x}`));
// ⚠️ MT2-P14-03c (23/09/2026) — VÁ 2 KỲ VỌNG CŨ (⛔ KHÔNG hạ nhẹ: vẫn đòi ĐỦ mọi tab bắt buộc, chỉ ⛔ không khoá tổng số):
//  • tổng số tab: bản cũ đòi «ĐÚNG 12» — nhưng MT2-P12-01 đã THÊM tab «Thông báo» (12 → 13) ⇒ khoá tổng số là SAI
//    (chính chú thích đầu tệp đã ghi «⛔ KHÔNG khẳng định tổng số, để việc thêm tab ở đợt sau không làm probe cũ báo lỗi sai»).
//  • tab 1: «Nhân sự» → **«Tài khoản»** (AD-01).
check(tabNames.length >= EXPECTED_TABS.length, `Có ÍT NHẤT ${EXPECTED_TABS.length} tab (⛔ không khoá tổng số)`, `thực tế ${tabNames.length}`);
for (const want of EXPECTED_TABS) check(tabNames.includes(want), `Có tab "${want}"`);
check(tabNames[0] === "Tài khoản", 'Tab 1 là "Tài khoản" (AD-01: Nhân sự → Tài khoản)', tabNames[0] || "(trống)");
check(tabNames[1] === "Tổ chức", 'Tab 2 là "Tổ chức"', tabNames[1] || "(trống)");

// ---- 3) Mở từng tab, bắt lỗi JS --------------------------------------------
console.log("\n═══ 3) MỞ TỪNG TAB ═══");
for (let i = 0; i < tabNames.length; i++) {
  errs = [];
  const body = await ev(`(()=>{const b=[...document.querySelectorAll('.permission-steps button')][${i}];if(!b)return null;b.click();return 1})()`);
  await sleep(2200);
  const textLen = await ev(`document.body.innerText.length`);
  const e = clean();
  const ok = body === 1 && e.length === 0;
  check(ok, `Tab ${i + 1} "${tabNames[i]}" mở được, không lỗi JS`, `body=${textLen}${e.length ? " · " + e[0] : ""}`);
  if (i === 1) await shot("tab2-to-chuc");
}
await shot("admin-tabs");

console.log(`\n═══ KẾT LUẬN: ${failures === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${failures} mục)`} ═══`);
console.log(`Ảnh chụp: ${SHOT_DIR}`);
ws.close(); b.kill();
process.exit(failures === 0 ? 0 : 1);
