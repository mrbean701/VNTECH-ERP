#!/usr/bin/env node
/**
 * Nghiệm thu ĐỢT P3 — HỒ SƠ NHÂN SỰ CHI TIẾT.
 * Kiểm tra trên UI THẬT rằng:
 *   (1) tab "Nhân sự" (Quản trị) bấm vào một dòng ⇒ mở panel chi tiết,
 *   (2) panel có đủ: chức danh · phòng ban · liên hệ · cá nhân · dự án đã/đang tham gia,
 *   (3) dự án đang tham gia xếp TRƯỚC dự án đã kết thúc (và dự án cũ bị làm mờ),
 *   (4) màn "Hồ sơ nhân sự" (Hành chính – Pháp chế) bấm vào dòng ⇒ mở panel + có "Đơn từ & giấy tờ",
 *   (5) mọi thao tác KHÔNG phát sinh lỗi JS.
 *
 * Chạy: node tools/probe-user-profile.mjs [url] [user] [password]
 * Ảnh chụp ghi ra %TEMP%/vntech-artifacts/.
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
const profile = join(tmpdir(), "vntech-artifacts", "probe-userprofile");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9355;
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
  if (c.result?.data) { const p = join(SHOT_DIR, `p3-${name}.png`); writeFileSync(p, Buffer.from(c.result.data, "base64")); return p; }
  return null;
};
const clean = () => errs.filter((x) => !/favicon|DevTools|Download the React|React DevTools/i.test(x));

let failures = 0;
const check = (ok, label, detail = "") => { console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`); if (!ok) failures++; };
const modalTitle = () => ev(`(document.querySelector('.modal header h2')||{}).innerText||''`);
const closeModal = async () => { await ev(`(()=>{const b=document.querySelector('.modal header button');if(b){b.click();return 1}return 0})()`); await sleep(700); };

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);
if (await ev(`!!document.querySelector('input[type="password"]')`)) { console.error("❌ Không đăng nhập được."); ws.close(); b.kill(); process.exit(1); }
console.log("✅ Đã đăng nhập\n");

// Mở một nhóm menu rồi bấm chức năng con theo nhãn (không phân biệt hoa/thường)
async function gotoModule(groupKey, childLabel) {
  await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="${groupKey}"]');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
  await sleep(900);
  return ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="${groupKey}"]');const re=new RegExp(${JSON.stringify(childLabel)},"i");const c=[...g.querySelectorAll('.nav-child')].find(x=>re.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
}

// ---------- 1) Tab "Nhân sự" trong Quản trị ----------
console.log("═══ 1) TAB NHÂN SỰ (QUẢN TRỊ) ═══");
errs = [];
await gotoModule("system_admin", "PHÂN QUYỀN");
await sleep(3500);
await ev(`(()=>{const b=[...document.querySelectorAll('.permission-steps button')][0];if(b)b.click();return 1})()`);
await sleep(2000);
const userCards = await ev(`document.querySelectorAll('.admin-mini-list button').length`);
check(userCards > 0, "Tab Nhân sự có danh sách người dùng bấm được", `${userCards} dòng`);
await ev(`(()=>{const b=document.querySelector('.admin-mini-list button');if(b){b.click();return 1}return 0})()`);
await sleep(2200);
let title = await modalTitle();
check(/Hồ sơ nhân sự/i.test(String(title)), "Bấm vào một dòng người dùng ⇒ mở panel hồ sơ chi tiết", String(title) || "(không mở)");
const sections = await ev(`[...document.querySelectorAll('.modal .card-head h2')].map(e=>e.innerText.trim())`);
const sec = Array.isArray(sections) ? sections : [];
sec.forEach((s) => console.log(`     · mục: ${s}`));
check(sec.some((s) => /Thông tin cá nhân/i.test(s)), "Panel có mục Thông tin cá nhân");
check(sec.some((s) => /Dự án đã và đang tham gia/i.test(s)), "Panel có mục Dự án đã và đang tham gia");
check(sec.some((s) => /Thao tác gần đây/i.test(s)), "Panel có mục Thao tác gần đây");
check(!sec.some((s) => /Đơn từ & giấy tờ/i.test(s)), "Panel ở Quản trị KHÔNG hiện mục Đơn từ (đúng yêu cầu)");
const bodyText = String(await ev(`(()=>{const m=document.querySelector('.modal');if(!m)return '';const b=m.querySelector('.modal-body');return (b&&b.innerText)||m.innerText||''})()`));
console.log(`     (độ dài văn bản panel: ${bodyText.length} ký tự)`);
// CSS đặt text-transform:uppercase cho <th> nên innerText trả chữ HOA — so khớp không phân biệt hoa/thường.
const bodyLower = bodyText.toLocaleLowerCase("vi");
for (const field of ["Mã nhân viên", "Chức danh", "Phòng ban", "Email", "Số CCCD/CMND", "Trình độ học vấn", "Ngày vào làm"]) {
  check(bodyLower.includes(field.toLocaleLowerCase("vi")), `Panel có trường "${field}"`);
}
const e1 = clean();
check(e1.length === 0, "Không lỗi JS khi mở panel", e1[0] || "");
await shot("panel-quan-tri");

// ---------- 2) Dự án: đang tham gia trước, đã kết thúc sau ----------
console.log("\n═══ 2) THỨ TỰ DỰ ÁN ĐÃ/ĐANG THAM GIA ═══");
const order = await ev(`(()=>{
  const cards=[...document.querySelectorAll('.modal .card')];
  const c=cards.find(x=>/Dự án đã và đang tham gia/.test((x.querySelector('.card-head h2')||{}).innerText||''));
  if(!c)return null;
  const dimmed=[...c.querySelectorAll('.admin-mini-list > div')].map(d=>({
    text:(d.querySelector('strong')||{}).innerText||'',
    opacity: getComputedStyle(d).opacity,
    pill: (d.querySelector('.pill')||{}).innerText||''
  }));
  const bars=[...c.querySelectorAll('.table-toolbar strong')].map(e=>e.innerText.trim());
  return {dimmed, bars};
})()`);
if (order) {
  order.dimmed.forEach((d) => console.log(`     · ${d.text} · ${d.pill} · opacity=${d.opacity}`));
  console.log(`     · thanh phân cách: ${JSON.stringify(order.bars)}`);
  const activeIdx = order.dimmed.findIndex((d) => /Đang tham gia/.test(d.pill));
  const endedIdx = order.dimmed.findIndex((d) => /Đã kết thúc/.test(d.pill));
  if (activeIdx !== -1 && endedIdx !== -1) {
    check(activeIdx < endedIdx, "Dự án đang tham gia xếp TRƯỚC dự án đã kết thúc", `đang=${activeIdx}, kết thúc=${endedIdx}`);
    check(Number(order.dimmed[endedIdx].opacity) < 1, "Dự án đã kết thúc được làm mờ", `opacity=${order.dimmed[endedIdx].opacity}`);
  } else {
    console.log("     ℹ️  Dữ liệu hiện chỉ có dự án đang hoạt động — bỏ qua kiểm tra thứ tự/màu xám.");
  }
  check(order.dimmed.length > 0, "Panel liệt kê được dự án của nhân sự", `${order.dimmed.length} dự án`);
} else {
  check(false, "Không đọc được khối dự án trong panel");
}
await closeModal();

// ---------- 3) Màn "Hồ sơ nhân sự" (Hành chính – Pháp chế) ----------
console.log("\n═══ 3) MÀN HỒ SƠ NHÂN SỰ (HÀNH CHÍNH – PHÁP CHẾ) ═══");
errs = [];
const okNav = await gotoModule("hr_legal", "Hồ sơ nhân sự");
check(okNav === 1, "Mở được chức năng Hồ sơ nhân sự", okNav === 1 ? "" : "không tìm thấy mục menu");
await sleep(3000);
const hrRows = await ev(`(()=>{const card=[...document.querySelectorAll('.card')].find(c=>/Hồ sơ nhân sự/.test((c.querySelector('.card-head h2')||{}).innerText||''));return card?card.querySelectorAll('tbody tr').length:-1})()`);
check(hrRows > 0, "Bảng hồ sơ nhân sự có dòng bấm được", `${hrRows} dòng`);
await ev(`(()=>{const card=[...document.querySelectorAll('.card')].find(c=>/Hồ sơ nhân sự/.test((c.querySelector('.card-head h2')||{}).innerText||''));const tr=card&&card.querySelector('tbody tr');if(tr){tr.click();return 1}return 0})()`);
await sleep(2200);
title = await modalTitle();
check(/Hồ sơ nhân sự/i.test(String(title)), "Bấm vào dòng ⇒ mở panel hồ sơ chi tiết", String(title) || "(không mở)");
const sec2 = await ev(`[...document.querySelectorAll('.modal .card-head h2')].map(e=>e.innerText.trim())`);
const sec2a = Array.isArray(sec2) ? sec2 : [];
sec2a.forEach((s) => console.log(`     · mục: ${s}`));
check(sec2a.some((s) => /Đơn từ & giấy tờ/i.test(s)), "Panel ở bộ phận Nhân sự CÓ mục Đơn từ & giấy tờ");
const e2 = clean();
check(e2.length === 0, "Không lỗi JS ở màn Hồ sơ nhân sự", e2[0] || "");
await shot("panel-nhan-su");

console.log(`\n═══ KẾT LUẬN: ${failures === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${failures} mục)`} ═══`);
console.log(`Ảnh chụp: ${SHOT_DIR}`);
ws.close(); b.kill();
process.exit(failures === 0 ? 0 : 1);
