#!/usr/bin/env node
// VNTECH ERP V5.3.0 — MT2-P6-08 (§4.6) — ĐO THẬT: MENU CHỈ CÓ 1 MỤC phải MỞ TRỰC TIẾP (⛔ không lồng 2 cấp).
//
// Nguyên văn §4.6: «Menu chỉ có 1 item ⇒ click “Trung tâm phê duyệt” ⇒ mở trực tiếp màn hình,
//                  ⛔ không lồng “Trung tâm phê duyệt → Trung tâm phê duyệt”.»
// ĐO 3 ĐIỀU, mỗi điều có thể SAI ĐƯỢC (⛔ không "có gì cũng ĐẠT"):
//   ① KHÔNG còn nhóm 2 cấp: `.nav-tree-group[data-nav-group="approval_center"]` phải VẮNG.
//   ② CÓ mục trực tiếp: `.nav-single-direct[data-nav-single-group="approval_center"]` nhãn «TRUNG TÂM PHÊ DUYỆT».
//   ③ MỘT lần bấm: click mục trực tiếp ⇒ `active === "approvals"` (màn phê duyệt hiện, có `.approval-workbench`).
//
// CHỈ ĐỌC (GET + click điều hướng, ⛔ không gọi action nghiệp vụ). node tools/probe-p6-08-menu-single-item.mjs [base]
// exit 0 = 3/3 ĐẠT · exit 1 = có lỗi · exit 2 = BLOCKED (không đăng nhập / vỏ UI không render).

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/+$/, "");
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9801 + Math.floor(Math.random() * 90);
const ART = join(tmpdir(), "vntech-p6-08-menu");
mkdirSync(ART, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-p608-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,1000", BASE], { stdio: "ignore" });

async function cdp() {
  for (let i = 0; i < 60; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch { /* chưa mở cổng */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP.");
}
const ws = new WebSocket(await cdp());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 60000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(expr, ms = 25000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await ev(`Boolean(${expr})`)) return true; } catch { /* đang chuyển trang */ } await sleep(300); }
  return false;
}
let fails = 0;
const mark = (name, ok, detail) => { if (!ok) fails++; console.log(`  ${ok ? "✅ ĐẠT" : "❌ HỎNG"}  ${name}${detail ? "\n            " + detail : ""}`); };

try {
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log("  MT2-P6-08 (§4.6) — ĐO MENU «CHỈ 1 MỤC ⇒ MỞ TRỰC TIẾP» (Trung tâm phê duyệt)");
  console.log("══════════════════════════════════════════════════════════════════════════════");
  await send("Page.navigate", { url: BASE });
  await waitFor(`location.protocol==="http:"`, 30000);
  const login = await ev(`(async()=>{const r=await fetch(${JSON.stringify(BASE + "/api/system")},{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
  console.log(`  Đăng nhập HTTP ${login} · BASE=${BASE}`);
  if (login !== 200) { console.log("  ⛔ BLOCKED — không có phiên."); process.exit(2); }
  await send("Page.navigate", { url: BASE });
  if (!await waitFor(`!!document.querySelector(".sidebar nav.tree-nav")`, 40000)) { console.log("  ⛔ BLOCKED — vỏ ứng dụng không render."); process.exit(2); }
  await sleep(1200);

  const men = JSON.parse(await ev(`(()=>{
    const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim();
    const nested=document.querySelector('.sidebar .nav-tree-group[data-nav-group="approval_center"]');
    const direct=[...document.querySelectorAll(".sidebar .nav-single-direct")].map((b)=>({ group:b.getAttribute("data-nav-single-group"), label:norm(b.textContent) }));
    const target=document.querySelector('.sidebar .nav-single-direct[data-nav-single-group="approval_center"]');
    const kids=nested?[...nested.querySelectorAll(".nav-children button")].map((b)=>norm(b.textContent)):[];
    return JSON.stringify({ hasNested:!!nested, nestedChildren:kids, directCount:direct.length, direct, targetLabel:target?norm(target.textContent):null, targetBox:target?(()=>{const r=target.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};})():null });
  })()`));

  mark("① KHÔNG còn nhóm 2 cấp `approval_center` (.nav-tree-group)", !men.hasNested,
    men.hasNested ? `vẫn còn nhóm lồng với ${men.nestedChildren.length} mục con: ${men.nestedChildren.join(" | ")}` : "không còn `.nav-tree-group[data-nav-group=approval_center]` ✅");
  const labelOk = /trung tâm phê duyệt/i.test(String(men.targetLabel || ""));
  mark("② CÓ mục TRỰC TIẾP nhãn «Trung tâm phê duyệt»", !!men.targetLabel && labelOk,
    `nhãn đo được: «${men.targetLabel || "(không có)"}» · kích thước ${men.targetBox ? men.targetBox.w + "×" + men.targetBox.h : "—"}`);

  // ③ MỘT lần bấm ⇒ màn phê duyệt hiện ra.
  const clicked = await ev(`(()=>{const b=document.querySelector('.sidebar .nav-single-direct[data-nav-single-group="approval_center"]');
    if(!b) return false; b.click(); return true;})()`);
  const opened = clicked && await waitFor(`!!document.querySelector(".approval-workbench") || !!document.querySelector(".approval-files")`, 25000);
  const path = await ev(`location.pathname + location.search`);
  mark("③ MỘT lần bấm ⇒ MỞ TRỰC TIẾP màn phê duyệt", !!opened,
    opened ? `đã hiện khối màn phê duyệt (không cần bung nhóm) · URL=${path}` : `sau 1 lần bấm vẫn KHÔNG thấy màn phê duyệt · URL=${path}`);
  if (!opened) { const s = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(ART, "p608-click.png"), Buffer.from(s.data, "base64")); }

  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(fails === 0 ? "  KẾT LUẬN: 3/3 ĐẠT — menu 1 mục mở TRỰC TIẾP, ⛔ không lồng 2 cấp ✅"
    : `  KẾT LUẬN: ${fails} mục HỎNG ✗ (ảnh chụp trong ${ART})`);
} catch (e) {
  console.log(`  ⛔ BLOCKED — ${e && e.message ? e.message : e}`);
  process.exit(2);
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { child.kill(); } catch { /* ignore */ }
}
process.exit(fails === 0 ? 0 : 1);
