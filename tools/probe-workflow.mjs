#!/usr/bin/env node
/**
 * Nghiệm thu ĐỢT P4 — WORKFLOW ĐA LUỒNG.
 *   (1) Tab "Workflow phê duyệt" hiển thị danh sách quy trình + bước + người duyệt đích danh,
 *   (2) Mở được modal thêm quy trình với bộ chọn bước / cách xác nhận / người duyệt theo quyền,
 *   (3) Backend THẬT: tạo quy trình 2 bước (any_of nhiều người + all_of), đọc lại thấy đúng,
 *       rồi xóa sạch — chứng minh cấu hình được lưu chứ không chỉ là giao diện,
 *   (4) Chặn cấu hình sai: "single" mà chỉ định 2 người ⇒ phải báo lỗi,
 *   (5) Không phát sinh lỗi JS.
 *
 * Chạy: node tools/probe-workflow.mjs [url] [user] [password]
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
const profile = join(tmpdir(), "vntech-artifacts", "probe-workflow");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9359;
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
  if (c.result?.data) { const p = join(SHOT_DIR, `p4-${name}.png`); writeFileSync(p, Buffer.from(c.result.data, "base64")); return p; }
  return null;
};
const clean = () => errs.filter((x) => !/favicon|DevTools|Download the React|React DevTools/i.test(x));
let failures = 0;
const check = (ok, label, detail = "") => { console.log(`  ${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`); if (!ok) failures++; };

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);
if (await ev(`!!document.querySelector('input[type="password"]')`)) { console.error("❌ Không đăng nhập được."); ws.close(); b.kill(); process.exit(1); }
console.log("✅ Đã đăng nhập\n");

// Gọi API trong ngữ cảnh trang để dùng luôn cookie phiên
const api = async (action, payload) => ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:${JSON.stringify(action)},...${JSON.stringify(payload)}})});const j=await r.json().catch(()=>({}));return {status:r.status,ok:r.ok,error:j.error||"",message:j.message||""}})()`);

// ---- 1) Màn workflow ----
console.log("═══ 1) TAB WORKFLOW PHÊ DUYỆT ═══");
errs = [];
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
await sleep(900);
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');const c=[...g.querySelectorAll('.nav-child')].find(x=>/phân quyền/i.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
await sleep(3500);
await ev(`(()=>{const b=[...document.querySelectorAll('.permission-steps button')].find(x=>/Workflow/i.test(x.innerText||''));if(b)b.click();return 1})()`);
await sleep(2500);

const headerOk = await ev(`/Quy trình phê duyệt/.test(document.body.innerText)`);
check(headerOk === true, "Có mục “Quy trình phê duyệt”");
if (headerOk !== true) {
  const tabs = await ev(`[...document.querySelectorAll('.permission-steps button')].map(b=>(b.innerText||'').replace(/\\s+/g,' ').trim())`);
  console.log(`     ↳ tab hiện có: ${JSON.stringify(tabs)}`);
  console.log(`     ↳ số .menu-layout-group: ${await ev(`document.querySelectorAll('.menu-layout-group').length`)}`);
  console.log(`     ↳ còn form login: ${await ev(`!!document.querySelector('input[type="password"]')`)}`);
  console.log(`     ↳ 700 ký tự đầu body:\n${String(await ev(`document.body.innerText`)).slice(0, 700)}`);
}
const names = await ev(`[...document.querySelectorAll('.menu-layout-group header strong')].map(e=>e.innerText.trim())`);
check(Array.isArray(names) && names.length > 0, "Liệt kê được quy trình", (names || []).join(" | "));
check((names || []).some((n) => /Quy trình mua hàng chuẩn/.test(n)), "Thấy quy trình mặc định chuyển từ luồng cũ");
// Mở bước của quy trình đầu tiên
await ev(`(()=>{const btn=[...document.querySelectorAll('.menu-layout-group .row-actions button')].find(x=>/Xem bước/.test(x.innerText||''));if(btn){btn.click();return 1}return 0})()`);
await sleep(1500);
const stepInfo = await ev(`(()=>{
  const rows=[...document.querySelectorAll('.menu-layout-group table tbody tr')];
  return rows.map(r=>{const c=[...r.querySelectorAll('td')].map(t=>t.innerText.replace(/\\s+/g,' ').trim());return {buoc:c[0]||'',ten:c[1]||'',cach:c[2]||'',nguoi:c[4]||''}});
})()`);
check(Array.isArray(stepInfo) && stepInfo.length >= 5, "Quy trình mặc định có >= 5 bước", `${(stepInfo || []).length} bước`);
(stepInfo || []).forEach((s) => console.log(`     · ${s.buoc} · ${s.ten} · ${s.cach} · ND: ${s.nguoi}`));
check((stepInfo || []).every((s) => s.nguoi && !/Chưa chỉ định/.test(s.nguoi)), "Mọi bước đều có người duyệt đích danh");
await shot("tab-workflow");

// ---- 2) Modal thêm quy trình ----
console.log("\n═══ 2) MODAL THÊM QUY TRÌNH ═══");
errs = [];
await ev(`(()=>{const b=[...document.querySelectorAll('.card-head button')].find(x=>/Thêm quy trình/.test(x.innerText||''));if(b){b.click();return 1}return 0})()`);
await sleep(1800);
const modalTitle = await ev(`(document.querySelector('.modal header h2')||{}).innerText||''`);
check(/Thêm quy trình/.test(String(modalTitle)), "Mở được modal thêm quy trình", String(modalTitle));
const stepBlocks = await ev(`[...document.querySelectorAll('.modal .card .table-toolbar strong')].filter(e=>/^BƯỚC/.test(e.innerText.trim())).length`);
check(stepBlocks >= 1, "Modal có khối cấu hình bước", `${stepBlocks} bước`);
const modes = await ev(`(()=>{const s=document.querySelector('.modal select');const all=[...document.querySelectorAll('.modal select')].map(x=>[...x.options].map(o=>o.value));return all;})()`);
const flat = (modes || []).flat();
check(flat.includes("single") && flat.includes("any_of") && flat.includes("all_of"), "Có đủ 3 cách xác nhận single/any_of/all_of", flat.join(","));
const picker = await ev(`document.querySelectorAll('.modal .admin-mini-list button').length`);
check(picker > 0, "Có bộ chọn người duyệt theo quyền", `${picker} ứng viên`);
const hasPermBadge = await ev(`/Có quyền duyệt|Chưa có quyền duyệt/.test(document.querySelector('.modal').innerText)`);
check(hasPermBadge === true, "Ứng viên hiển thị trạng thái quyền duyệt");
await shot("modal-workflow");
const e2 = clean();
check(e2.length === 0, "Không lỗi JS khi mở modal", e2[0] || "");
await ev(`(()=>{const b=[...document.querySelectorAll('.modal .modal-footer button')].find(x=>/Hủy/.test(x.innerText||''));if(b){b.click();return 1}return 0})()`);
await sleep(900);

// ---- 3) Backend thật: tạo → đọc lại → xóa ----
console.log("\n═══ 3) BACKEND: TẠO – ĐỌC LẠI – XÓA ═══");
const ids = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return (j.data.users||[]).filter(u=>u.active).slice(0,4).map(u=>u.id)})()`);
check(Array.isArray(ids) && ids.length >= 3, "Lấy được danh sách người dùng để phân công", `${(ids || []).length} người`);
const [u1, u2, u3] = Array.isArray(ids) ? ids : [];
const created = await api("save_workflow", {
  code: "WF-P4TEST", name: "Quy trình kiểm chứng P4", description: "Tạo bởi probe tự động, sẽ xóa sau khi kiểm tra.",
  moduleKey: "requests", isDefault: 0, sortOrder: 99,
  stages: [
    { stepNo: 1, name: "Bước any_of hai người", approvalMode: "any_of", slaHours: 4, approverUserIds: [u1, u2] },
    { stepNo: 2, name: "Bước all_of hai người", approvalMode: "all_of", slaHours: 8, approverUserIds: [u2, u3] },
  ],
});
check(created?.ok === true, "Tạo quy trình 2 bước (any_of + all_of) thành công", created?.message || created?.error || "");
const found = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();const w=(j.data.workflowDefinitions||[]).find(x=>x.code==="WF-P4TEST");if(!w)return null;const st=(j.data.workflowSteps||[]).filter(s=>s.workflowId===w.id);const ap=(j.data.workflowStepApprovers||[]);return {id:w.id,steps:st.map(s=>({no:s.stepNo,mode:s.approvalMode,n:ap.filter(a=>a.stepId===s.id).length}))}})()`);
check(found !== null, "Đọc lại thấy quy trình vừa tạo trong bootstrap");
if (found) {
  console.log(`     · bước: ${JSON.stringify(found.steps)}`);
  check(found.steps.length === 2, "Lưu đúng 2 bước", `${found.steps.length}`);
  check(found.steps.some((s) => s.mode === "any_of" && s.n === 2), "Bước any_of giữ đúng 2 người duyệt");
  check(found.steps.some((s) => s.mode === "all_of" && s.n === 2), "Bước all_of giữ đúng 2 người duyệt");
}

// ---- 4) Chặn cấu hình sai ----
console.log("\n═══ 4) CHẶN CẤU HÌNH SAI ═══");
const bad = await api("save_workflow", {
  code: "WF-BADSINGLE", name: "Quy trình sai", moduleKey: "requests",
  stages: [{ stepNo: 1, name: "single nhưng 2 người", approvalMode: "single", slaHours: 8, approverUserIds: [u1, u2] }],
});
check(bad?.ok === false, "Chặn “single” mà chỉ định 2 người", bad?.error || "");
const noApprover = await api("save_workflow", {
  code: "WF-NOAPPROVER", name: "Quy trình thiếu người", moduleKey: "requests",
  stages: [{ stepNo: 1, name: "Bước không người duyệt", approvalMode: "any_of", slaHours: 8, approverUserIds: [] }],
});
check(noApprover?.ok === false, "Chặn bước không có người duyệt", noApprover?.error || "");

// ---- 5) Dọn dẹp ----
if (found?.id) {
  const del = await api("delete_workflow", { workflowId: found.id });
  check(del?.ok === true, "Xóa quy trình kiểm chứng", del?.message || del?.error || "");
  const gone = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();return !(j.data.workflowDefinitions||[]).some(x=>x.code==="WF-P4TEST")})()`);
  check(gone === true, "Đã xóa sạch khỏi hệ thống");
}
const prot = await api("delete_workflow", { workflowId: "WF-MUAHANG" });
check(prot?.ok === false, "Chặn xóa quy trình mặc định", prot?.error || "");

console.log(`\n═══ KẾT LUẬN: ${failures === 0 ? "ĐẠT ✅" : `KHÔNG ĐẠT ❌ (${failures} mục)`} ═══`);
console.log(`Ảnh chụp: ${SHOT_DIR}`);
ws.close(); b.kill();
process.exit(failures === 0 ? 0 : 1);
