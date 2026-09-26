#!/usr/bin/env node
// MT2 (user 26/09/2026) — CỔNG ĐO DẢI PHÊ DUYỆT NGANG `o---o----o` Ở CỘT «PHIẾU ĐANG XỬ LÝ».
//
// VÌ SAO CẦN CỔNG NÀY: yêu cầu người dùng là tiến trình phê duyệt phải NẰM NGANG (`o---o----o----o`),
// TRẠNG THÁI ở TRÊN mỗi mốc, AI DUYỆT · PHÒNG BAN · THỜI GIAN ở DƯỚI mỗi mốc.
// ⛔ Test hợp đồng mã nguồn KHÔNG đủ: bố cục là thứ CHỈ computed style của trình duyệt mới chứng minh
// (kiểu cũ vẫn là `flex-direction: column` cho tới khi CSS mới thắng tranh chấp đặc biệt).
// ⇒ Cổng này mở Chrome/Edge HEADLESS THẬT, đăng nhập, mở «Trung tâm phê duyệt», đọc `getComputedStyle`.
//
// CHỈ ĐỌC: không INSERT/UPDATE/DELETE/ALTER, không gọi action nghiệp vụ.
//   node tools/probe-approval-horizontal.mjs [base] [user] [pass]
// exit 0 = ĐẠT · exit 1 = HẠNG · exit 2 = BLOCKED (không đăng nhập / không mở được màn)
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "giamdoc.demo";
const PASS = process.argv[4] || "Vntech@2026";
const ART = join(tmpdir(), "vntech-approval-horizontal");

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless trên máy này."); process.exit(2); }

// ⚠️ `sleep` phải KHAI BÁO TRƯỚC mọi thứ dùng nó (temporal dead zone) — đã gây
//    `ReferenceError: Cannot access 'sleep' before initialization` khi đặt sau vòng đợi CDP.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = join(ART, `edge-${Date.now()}`);
// ⚠️ BÀI HỌC ĐO ĐƯỢC (đã sai 1 lần): phải dùng CỔNG CỐ ĐỊNH + `/json/list` để lấy WS của target **PAGE**.
// Với `--remote-debugging-port=0`, dòng "DevTools listening on ws://…/devtools/browser/<id>" là endpoint
// **BROWSER** — gửi `Page.navigate` vào đó ⛔ KHÔNG có tác dụng (trang không bao giờ render ⇒ BLOCKED oan).
const PORT = 9333 + Math.floor(Math.random() * 500);
const child = spawn(exe, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* cổng chưa mở */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của trình duyệt headless.");
})();

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
// ⚠️ `send` trả về `msg.result` và REJECT khi CDP trả lỗi — nếu nuốt lỗi thì mọi `ev()` âm thầm trả
//    `undefined` ⇒ dễ kết luận BLOCKED oan. Căn theo bản đã chạy được (`probe-p2-ui-dom.mjs:89-100`).
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), reject(new Error(method + " timeout"))), 90000);
  });
}
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await sleep(2500);
  // ⚠️ BÀI HỌC ĐO ĐƯỢC (đã sai 2 lần): `.sidebar` **CHỈ xuất hiện SAU khi đăng nhập**.
  //   Thứ tự ĐÚNG (theo `probe-p2-ui-dom.mjs`): ① chờ trang nạp xong (màn ĐĂNG NHẬP) → ② login →
  //   ③ navigate lại → ④ chờ `.sidebar`. ⛔ Nếu chờ `.sidebar` TRƯỚC khi login thì luôn false ⇒ BLOCKED oan.
  let pageReady = false;
  for (let i = 0; i < 60; i++) {
    pageReady = await ev(`document.readyState==="complete" && !!document.body`);
    if (pageReady) break;
    await sleep(700);
  }
  if (!pageReady) { console.error("[BLOCKED] Trang không nạp xong."); process.exit(2); }
  const login = await ev(`(async()=>{
    const post=async(body)=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const txt=await r.text(); return {status:r.status, body:txt.slice(0,300)};};
    const res=await post({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}});
    return JSON.stringify(res);
  })()`);
  const loginRaw = JSON.parse(login || "{}");
  console.log(`   POST /api/system {action:"login"} → HTTP ${loginRaw.status} · ${String(loginRaw.body || "").slice(0, 200)}`);
  let ok = false;
  try { ok = JSON.parse(loginRaw.body || "{}").ok === true; } catch { ok = false; }
  if (!ok) { console.error("[BLOCKED] Không đăng nhập được. Phải dùng tài khoản CÓ phiếu chờ duyệt (VD: giamdoc.demo)."); process.exit(2); }
  await send("Page.navigate", { url: BASE });
  // ④ sau khi login thì `.sidebar` mới có — chờ nó thật sự xuất hiện (⛔ không chỉ `sleep` mù).
  let shellReady = false;
  for (let i = 0; i < 60; i++) {
    shellReady = await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`);
    if (shellReady) break;
    await sleep(700);
  }
  if (!shellReady) { console.error("[BLOCKED] Sau khi đăng nhập, vỏ ứng dụng (.sidebar) vẫn không render."); process.exit(2); }
  console.log("   ✅ vỏ ứng dụng đã render (.sidebar) sau khi đăng nhập");

  // Mở mục «Trung tâm phê duyệt» trong sidebar (nhóm có thể đang thu gọn).
  let navState = "";
  for (let i = 0; i < 4; i++) {
    navState = await ev(`(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const t=norm("Trung tâm phê duyệt");
      const kids=[...document.querySelectorAll(".sidebar button, .sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")];
      const el=kids.find(e=>norm(e.textContent)===t)||kids.find(e=>norm(e.textContent).includes(t));
      if(el){el.click();return "OK";}
      const closed=[...document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false");
      if(closed.length){closed.forEach(b=>b.click());return "EXPANDED";}
      return "NOT_FOUND";})()`);
    if (navState === "OK") break;
    await sleep(1200);
  }
  if (navState !== "OK") { console.error("[BLOCKED] Không mở được màn Trung tâm phê duyệt."); process.exit(2); }

  // Chờ khung «phiếu đang xử lý» (cột giữa) render.
  let ready = false;
  for (let i = 0; i < 30; i++) {
    ready = await ev(`!!document.querySelector(".approval-detail-pane")`);
    if (ready) break;
    await sleep(700);
  }
  if (!ready) { console.error("[BLOCKED] Màn phê duyệt không render .approval-detail-pane."); process.exit(2); }

  // ĐO computed style của dải các bước.
  const measure = await ev(`(()=>{const w=document.querySelector(".approval-flow-steps");
    if(!w) return {found:false};
    const ws=getComputedStyle(w); const steps=[...w.querySelectorAll(".approval-flow-step")];
    const first=steps[0]?getComputedStyle(steps[0]):null; const second=steps[1]||null;
    const rect=(e)=>e?e.getBoundingClientRect():null;
    const r1=rect(steps[0]), r2=rect(second);
    return {found:true, count:steps.length, flexDirection:ws.flexDirection, display:ws.display,
      overflowX:ws.overflowX, stepDirection:first?first.flexDirection:null,
      stepAlign:first?first.alignItems:null,
      sameRow: !!(r1&&r2&&Math.abs(r1.top-r2.top)<4), r1Top:r1?Math.round(r1.top):null, r2Top:r2?Math.round(r2.top):null,
      hasStatus: steps.map(s=>(s.querySelector("em")?String(s.querySelector("em").textContent||"").trim():"")).slice(0,6),
      hasApprover: steps.map(s=>(s.querySelector(".approval-person b")?String(s.querySelector(".approval-person b").textContent||"").trim():"")).slice(0,6),
      hasDeptOrStatus: steps.map(s=>(s.querySelector(".approval-person small")?String(s.querySelector(".approval-person small").textContent||"").trim():"")).slice(0,6),
      hasDecidedAt: steps.map(s=>(s.querySelector('[data-vntech="approval-step-decided-at"]')?String(s.querySelector('[data-vntech="approval-step-decided-at"]').textContent||"").trim():"")).slice(0,6),
      connectorAfter: steps.slice(0,-1).every(s=>getComputedStyle(s,"::after").content==="none"),
    };})()`);

  console.log("=== ĐO DẢI PHÊ DUYỆT NGANG (DOM THẬT) ===");
  console.log(JSON.stringify(measure, null, 2));

  const problems = [];
  if (!measure.found) problems.push("không thấy .approval-flow-steps");
  if (measure.flexDirection !== "row") problems.push(`dải phải flex-direction:row (đang: ${measure.flexDirection})`);
  if (measure.sameRow !== true) problems.push("các mốc phải CÙNG một hàng (sameRow=false)");
  if (!measure.hasStatus.some(Boolean)) problems.push("mỗi mốc phải có TRẠNG THÁI ở trên (thẻ em)");
  if (!measure.hasApprover.some(Boolean)) problems.push("phải có AI DUYỆT dưới mốc (.approval-person b)");
  if (!measure.hasDecidedAt.some(Boolean)) problems.push("phải có THỜI GIAN DUYỆT dưới mốc ([data-vntech=approval-step-decided-at])");
  if (measure.connectorAfter === false) problems.push("đường nối DỌC cũ (:after) vẫn còn — phải tắt");

  if (problems.length) { console.error("❌ HẠNG:\n - " + problems.join("\n - ")); process.exit(1); }
  console.log("✅ ĐẠT  Dải phê duyệt NGANG o---o: trạng thái TRÊN mốc, ai duyệt/phòng ban/thời gian DƯỚI mốc.");
} finally {
  try { ws.close(); } catch {}
  child.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
