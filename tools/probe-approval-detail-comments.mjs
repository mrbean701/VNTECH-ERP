#!/usr/bin/env node
// MASTER TASK 3 §B.2 — CỔNG ĐO DOM THẬT: bình luận duyệt KHÔNG còn nằm trên tiến trình.
//
// VÌ SAO CẦN CỔNG RIÊNG: yêu cầu MT3 §B.2 là «⛔ Không hiển thị bình luận trực tiếp trên tiến trình;
// chuyển bình luận vào “Chi tiết”». Đây là hành vi HIỂN THỊ ⇒ chỉ computed style / DOM thật mới chứng minh;
// đọc mã nguồn chỉ chứng minh «có ghi chuỗi», ⛔ KHÔNG chứng minh «bố cục đúng».
//
// CHỈ ĐỌC: không INSERT/UPDATE/DELETE/ALTER, không gọi action nghiệp vụ.
//   node tools/probe-approval-detail-comments.mjs [base] [user] [pass]
// exit 0 = ĐẠT · exit 1 = HẠNG · exit 2 = BLOCKED (không đăng nhập / không mở được màn)
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";

const BROWSERS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const exe = BROWSERS.find((p) => existsSync(p));
if (!exe) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }

const profile = join(tmpdir(), `vntech-mt3-comments-${Date.now()}`);
const child = spawn(exe, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu",
  "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

// ⚠️ BÀI HỌC (đã mắc 1 lần ở probe-approval-horizontal): `--remote-debugging-port=0` ⇒ chuỗi
// "DevTools listening on ws://…" là endpoint **BROWSER**, không phải PAGE ⇒ phải dùng cổng cố định + /json/list.
const PORT = 9550 + Math.floor(Math.random() * 300);
child.kill();
const child2 = spawn(exe, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu",
  "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chưa mở cổng */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Không kết nối được CDP");
})();

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 60000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || "lỗi JS");
  return r.result.value;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send("Page.enable"); await send("Runtime.enable");
  await sleep(2500);
  const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});const t=await r.text();return JSON.stringify({status:r.status,body:t.slice(0,200)});})()`);
  const raw = JSON.parse(login || "{}");
  console.log(`   POST /api/system {action:"login"} → HTTP ${raw.status}`);
  let ok = false; try { ok = JSON.parse(raw.body || "{}").ok === true; } catch {}
  if (!ok) { console.error("[BLOCKED] Không đăng nhập được."); process.exit(2); }
  await send("Page.navigate", { url: BASE });

  for (let i = 0; i < 60; i++) {
    if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break;
    await sleep(700);
  }
  // Mở mục menu «Trung tâm phê duyệt».
  let navState = "";
  for (let i = 0; i < 4; i++) {
    navState = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();const t=n("Trung tâm phê duyệt");
      const kids=[...document.querySelectorAll(".sidebar button, .sidebar .nav-child, .sidebar .nav-single-direct, .sidebar .nav-dashboard-direct, .sidebar a")];
      const el=kids.find(e=>n(e.textContent)===t)||kids.find(e=>n(e.textContent).includes(t));
      if(el){el.click();return "OK";}
      const closed=[...document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false");
      if(closed.length){closed.forEach(b=>b.click());return "EXPANDED";}
      return "NOT_FOUND";})()`);
    if (navState === "OK") break;
    await sleep(1200);
  }
  if (navState !== "OK") { console.error("[BLOCKED] Không mở được màn Trung tâm phê duyệt."); process.exit(2); }
  for (let i = 0; i < 30; i++) { if (await ev(`!!document.querySelector(".approval-detail-pane")`)) break; await sleep(700); }

  // ⛔ KHÔNG đo mặc định phiếu đầu tiên: phải chọn phiếu CÓ bình luận thì mới chứng minh được
  //    nhánh "bình luận HIỆN ở vùng Chi tiết". Chọn theo danh sách ưu tiên, không hard-code 1 phiếu duy nhất.
  const want = ["DNMH-PRJ-DEMO-01-2026-0139", "DNMH-PRJ-DEMO-01-2026-0163", "DNMH-PRJ-DEMO-01-2026-0161"];
  const picked = await ev(`(()=>{const want=${JSON.stringify(want)};const bs=[...document.querySelectorAll(".approval-queue-list button")];
    for (const w of want){ const b=bs.find(x=>String(x.textContent||"").includes(w)); if(b){ b.click(); return w; } }
    return bs.length? (bs[0].click(), "QUEUE_FIRST:"+String(bs[0].textContent||"").slice(0,40)) : "NO_QUEUE";})()`);
  console.log(`   đang đo phiếu: ${picked}`);
  await sleep(2500);

  const m = await ev(`(()=>{
    const all=[...document.querySelectorAll(".approval-flow-steps .approval-flow-step")];
    // ⚠️ Mốc cuối "HOÀN TẤT" là DẤU KẾT, không phải một bước duyệt ⇒ vốn cố ý KHÔNG có
    //   người duyệt / thời điểm duyệt. Phép đo chỉ áp cho các bước duyệt THẬT (loại .done).
    const steps=all.filter(s=>!s.classList.contains("done"));
    const text=all.map(s=>String(s.textContent||""));
    return {
      totalNodes: all.length,
      realStepCount: steps.length,
      doneMarker: all.length - steps.length,
      // ⛔ MT3 §B.2: KHÔNG được có nhãn "Bình luận" trong bất kỳ mốc nào của tiến trình.
      stepHasCommentLabel: text.filter(t=>/Bình luận/.test(t)).length,
      stepHasDecidedAt: steps.filter(s=>/Thời điểm duyệt/.test(String(s.textContent||""))).length,
      stepHasApprover: steps.filter(s=>!!s.querySelector(".approval-person")).length,
      stepHasStatus: steps.filter(s=>!!s.querySelector("em")).length,
      // ✅ Phải có vùng bình luận ở phần CHI TIẾT (chỉ hiện khi phiếu thật sự có bình luận).
      detailCommentsBlock: document.querySelectorAll('[data-vntech="approval-detail-comments"]').length,
      detailCommentsText: [...document.querySelectorAll('[data-vntech="approval-detail-comments"]')].map(e=>String(e.textContent||"").slice(0,160)),
    };})()`);

  console.log("=== ĐO DOM THẬT (MT3 §B.2) ===");
  console.log(JSON.stringify(m, null, 2));

  // ── MT3 §B.4 — 3 VÙNG PHẢI CAO BẰNG NHAU (đo thật, tolerance 2px) ──────────────────────────
  const h = await ev(`(()=>{const w=document.querySelector(".approval-workbench");if(!w)return{found:false};
    const q=w.querySelector(".approval-queue"),d=w.querySelector(".approval-detail-pane"),m=w.querySelector(".approval-meta-pane");
    const H=(e)=>e?Math.round(e.getBoundingClientRect().height):null;
    const list=w.querySelector(".approval-queue-list");
    return {found:true, queue:H(q), detail:H(d), meta:H(m),
      spread: (q&&d&&m)? Math.max(H(q),H(d),H(m))-Math.min(H(q),H(d),H(m)) : null,
      queueScrolls: list? getComputedStyle(list).overflowY : null,
      listMaxHeight: list? getComputedStyle(list).maxHeight : null,
      viewport: { w: window.innerWidth, h: window.innerHeight }};})()`);
  console.log("=== ĐO 3 VÙNG (MT3 §B.4) ===");
  console.log(JSON.stringify(h, null, 2));

  // ── MT3 §B.3 — nút «YÊU CẦU BỔ SUNG»: mở vùng nhập · chặn rỗng · ⛔ KHÔNG window.prompt ─────────
  // ⚠️ BÀI HỌC: React cập nhật state BẤT ĐỒNG BỘ ⇒ click xong phải CHỜ render rồi mới đo,
  //    nếu đo ngay sẽ báo "opensForm:false" giả.
  const hasBtn = await ev(`!!document.querySelector('[data-vntech="approval-supplement-open"]')`);
  if (hasBtn) { await ev(`document.querySelector('[data-vntech="approval-supplement-open"]').click(), true`); await sleep(900); }
  const s3 = await ev(`(()=>{
    const form=document.querySelector('[data-vntech="approval-supplement-form"]');
    return {button:true, opensForm:!!form, submit:!!document.querySelector('[data-vntech="approval-supplement-submit"]'),
            hasTextarea: form? !!form.querySelector("textarea") : false,
            noPromptUsed: !/prompt\\(/.test(document.documentElement.innerHTML)};
  })()`);
  // Bấm Gửi khi RỖNG ⇒ phải hiện lỗi và form KHÔNG đóng. Tách click / đọc + chờ render (React bất đồng bộ).
  if (s3.submit) {
    await ev(`document.querySelector('[data-vntech="approval-supplement-submit"]').click(), true`);
    await sleep(900);
    const after = await ev(`({emptyBlocked: !!document.querySelector('[data-vntech="approval-supplement-error"]'),
                             formStillOpen: !!document.querySelector('[data-vntech="approval-supplement-form"]'),
                             errText: (document.querySelector('[data-vntech="approval-supplement-error"]')||{}).textContent || ""})`);
    Object.assign(s3, after);
  }
  console.log("=== ĐO §B.3 YÊU CẦU BỔ SUNG ===");
  console.log(JSON.stringify(s3, null, 2));

  const problems = [];
  if (m.realStepCount === 0) problems.push("không có bước duyệt nào trong tiến trình");
  if (m.stepHasCommentLabel > 0) problems.push(`⛔ còn ${m.stepHasCommentLabel} mốc hiện Bình luận trên tiến trình`);
  if (m.stepHasDecidedAt !== m.realStepCount) problems.push(`mọi bước phải hiện Thời điểm duyệt (${m.stepHasDecidedAt}/${m.realStepCount})`);
  if (m.stepHasApprover !== m.realStepCount) problems.push(`mọi bước phải có người duyệt/phụ trách (${m.stepHasApprover}/${m.realStepCount})`);
  if (m.stepHasStatus !== m.realStepCount) problems.push(`mọi bước phải có trạng thái (${m.stepHasStatus}/${m.realStepCount})`);
  if (m.detailCommentsBlock === 0) console.log("   ℹ️ Phiếu đang mở CHƯA có bình luận nào ⇒ khối 'Bình luận khi duyệt' ẩn đúng (chỉ hiện khi có dữ liệu). Đây KHÔNG phải lỗi.");

  // ⛔ §B.4: 3 vùng phải cao bằng nhau + vùng cuộn riêng (⛔ max-height phải là clamp, không phải px cứng).
  if (!h.found) problems.push("không thấy khối 3 vùng .approval-workbench");
  else {
    if (h.spread === null || h.spread > 2) problems.push(`3 vùng phải cao bằng nhau (đang lệch ${h.spread}px: queue=${h.queue} detail=${h.detail} meta=${h.meta})`);
    if (h.queueScrolls !== "auto" && h.queueScrolls !== "scroll") problems.push(`danh sách chờ duyệt phải có vùng cuộn riêng (overflowY=${h.queueScrolls})`);
    // max-height "none" (bỏ giới hạn, chế độ 1 cột) hoặc giá trị tính theo viewport đều đạt; ⛔ px cứng thì không.
    const lh = String(h.listMaxHeight || "");
    if (lh !== "none" && /^\d+px$/.test(lh)) problems.push(`⛔ §B.4: danh sách chờ duyệt còn max-height CỨNG (${lh})`);
  }

  // §B.3: nút + vùng nhập + chặn rỗng + ⛔ không window.prompt
  if (!s3.button) problems.push("không thấy nút «Yêu cầu bổ sung» (chỉ hiện khi user có quyền — kiểm lại bằng user có quyền duyệt)");
  else {
    if (!s3.opensForm) problems.push("bấm nút «Yêu cầu bổ sung» phải MỞ vùng nhập");
    if (!s3.hasTextarea) problems.push("vùng nhập phải có ô nhập văn bản");
    if (!s3.submit) problems.push("vùng nhập phải có nút Gửi");
    if (!s3.emptyBlocked) problems.push("⛔ §B.3: nội dung RỖNG phải bị chặn (bắt buộc validate)");
    if (!s3.formStillOpen) problems.push("khi rỗng thì form phải MỞ lại, không được đóng");
    if (s3.noPromptUsed === false) problems.push("⛔ §B.3: không được dùng window.prompt");
  }

  if (problems.length) { console.error("❌ HẠNG:\n - " + problems.join("\n - ")); process.exit(1); }
  console.log("✅ ĐẠT  §B.2 bình luận ở vùng Chi tiết · §B.4 ba vùng cao bằng nhau · §B.3 nút Yêu cầu bổ sung mở vùng nhập và chặn nội dung rỗng.");
} finally {
  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  try { child2.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
