#!/usr/bin/env node
// VNTECH ERP V5.3.0 — PHASE 2 · BẰNG CHỨNG **DOM LÚC CHẠY** CHO 5 DẤU UI MỚI.
//
// VÌ SAO CÓ TỆP NÀY: các test hợp đồng đã có (`tests/p2-d1-pr-child-po.test.mjs`, `p2-d3-grn-to-po.test.mjs`,
// `p2-d4-approval-timeline.test.mjs`) chỉ CHỨNG MINH Ở TẦNG NGUỒN (`data-vntech=…` có trong `.tsx`).
// Tầng nguồn KHÔNG trả lời được câu hỏi của PHASE 2: «bundle ĐANG PHỤC VỤ (:8787 / :9000) đã chứa UI mới
// hay chưa?». Tệp này đo bằng CHROME/EDGE HEADLESS THẬT: đăng nhập, điều hướng, chờ selector, đọc DOM —
// rồi in NGUYÊN VĂN nội dung text của từng dấu.
//
// 5 DẤU PHẢI THẤY TRÊN DOM LÚC CHẠY:
//   1. `request-child-pos`        — chi tiết PHIẾU ĐỀ NGHỊ (PR), khối «Đơn mua (PO) sinh từ phiếu này» (§20).
//   2. `request-child-pos-empty`  — nhánh «Chưa có PO nào.» khi PR CHƯA phát sinh PO.
//   3. `grn-source-po`            — chi tiết PHIẾU NHẬP (GRN), khối «Đơn mua (PO) nguồn» (D3 §21, chiều NGƯỢC).
//   4. `approval-step-decided-at` — dải duyệt (màn Trung tâm phê duyệt), «Thời điểm duyệt: …» (D4 §19).
//   5. `approval-step-comment`    — dải duyệt, «Bình luận: …» (D4 §19).
//
// CÁCH TRÍCH ASSET (đây là chỗ bước grep thủ công trước đó làm SAI): HTML KHÔNG tham chiếu chunk chính bằng
// `<script src=…>`. Chunk lớn (`/assets/page-*.js`) được tham chiếu bằng `<link rel="modulepreload" href=…>`.
// Vì vậy tệp này (a) trích MỌI `src`/`href` trỏ tới `.js` trong HTML bất kể thẻ nào, VÀ (b) đối chiếu với
// danh sách asset mà TRANG THẬT SỰ NẠP (`performance.getEntriesByType("resource")`) để không bỏ sót chunk
// nạp động (`import()`).
//
// DỮ LIỆU ĐO: probe KHÔNG hardcode số phiếu — nó lấy chính payload bootstrap của ứng dụng
// (`GET /api/system` → `data`) để CHỌN ứng viên (PR có PO con / PR không có PO con / phiếu chờ duyệt có
// bước đã duyệt kèm bình luận) rồi in ra id đã chọn. Nhờ vậy probe không lệch khi dữ liệu demo đổi.
//
// CHỈ ĐỌC: probe chỉ GET + đọc DOM. KHÔNG INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE, KHÔNG gọi action nghiệp vụ.
//
//   node tools/probe-p2-ui-dom.mjs [base] [user] [pass]
//
// exit 0 = ĐẠT (5/5 dấu có trên DOM + asset đang phục vụ chứa đủ 5 chuỗi)
// exit 1 = HỎNG (màn tới được nhưng THIẾU dấu)
// exit 2 = BLOCKED (không đăng nhập / không tới được màn / màn không render dải cần đo)

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/+$/, "");
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9701 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-p2-ui-dom");
mkdirSync(ART, { recursive: true });

// 5 dấu phải thấy — GIỮ NGUYÊN thứ tự bảng yêu cầu.
const KEYS = [
  "request-child-pos",
  "request-child-pos-empty",
  "grn-source-po",
  "approval-step-decided-at",
  "approval-step-comment",
];

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => existsSync(p));
if (!EDGE) {
  console.error("[BLOCKED] Không tìm thấy Microsoft Edge/Chrome headless trên máy này.");
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-p2-${Date.now()}`)}`, "--no-first-run",
  "--no-default-browser-check", "--disable-gpu", "--window-size=1600,1000", BASE,
], { stdio: "ignore" });

async function cdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch { /* chưa mở cổng */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của trình duyệt headless.");
}

const ws = new WebSocket(await cdp());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}
async function waitFor(expr, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await ev(`Boolean(${expr})`)) return true; } catch { /* trang đang chuyển */ }
    await sleep(300);
  }
  return false;
}
async function nav(url) {
  await send("Page.navigate", { url });
  await sleep(1500);
  return waitFor(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`, 30000);
}
async function shot(name) {
  try {
    const r = await send("Page.captureScreenshot", { format: "png" });
    const p = join(ART, name + ".png");
    writeFileSync(p, Buffer.from(r.data, "base64"));
    return p;
  } catch { return "(không chụp được)"; }
}
/** Đọc NGUYÊN VĂN MỌI phần tử mang dấu `data-vntech` trên DOM hiện tại (một màn có thể có nhiều dòng). */
async function captureAll(marker) {
  const raw = await ev(`(()=>{
    const els=[...document.querySelectorAll('[data-vntech="${marker}"]')];
    return JSON.stringify({found:els.length>0,count:els.length,items:els.map(el=>({
      text:(el.textContent||"").replace(/\\s+/g," ").trim(),
      tag:el.tagName.toLowerCase(),
      parent:el.parentElement?String(el.parentElement.className||""):"",
      html:String(el.outerHTML||"").slice(0,320)
    }))});
  })()`);
  return JSON.parse(raw);
}
/** In bằng chứng của một dấu: số lần xuất hiện + NGUYÊN VĂN text của từng lần. */
function showEvidence(marker, cap) {
  console.log(`   ▸ [data-vntech="${marker}"] — số lần xuất hiện trên DOM: ${cap.count}`);
  for (const [i, it] of cap.items.entries()) {
    console.log(`     ${i + 1}) <${it.tag} class="${it.parent}"> "${it.text}"`);
    console.log(`        outerHTML(320): ${it.html}`);
  }
}
/** Dấu «có DỮ LIỆU THẬT» = không phải nhánh «chưa có nguồn» (đúng hợp đồng «KHÔNG BỊA» của D4). */
const hasRealSource = (cap) => cap.items.some((it) => it.text && !/chưa có nguồn/.test(it.text));
/**
 * ĐỐI CHỨNG ÂM — chứng minh phép chọn `[data-vntech=…]` PHÂN BIỆT ĐƯỢC theo màn, không phải "có gì cũng ĐẠT":
 * trên màn đang xét, các dấu của MÀN KHÁC bắt buộc phải VẮNG.
 */
async function doiChungAm(nhan, khongDuocCo) {
  const raw = await ev(`JSON.stringify(${JSON.stringify(khongDuocCo)}.map(k=>({
    k, n:document.querySelectorAll('[data-vntech="'+k+'"]').length
  })))`);
  const list = JSON.parse(raw);
  const ok = list.every((x) => x.n === 0);
  mark(`Đối chứng âm (${nhan}): các dấu của MÀN KHÁC vắng mặt trên DOM`, ok,
    list.map((x) => `${x.k}=${x.n}`).join(" · "));
  return ok;
}

const markerResult = new Map(); // marker -> "CÓ" | "KHÔNG" | "BLOCKED"
let assetOk = false;
let assetUrl = null;
const assetHits = new Map();
let blocked = null;
function mark(name, ok, detail) {
  console.log(`  ${ok ? "✅ ĐẠT" : "❌ HỎNG"}  ${name}${detail ? "\n            " + detail : ""}`);
}
function block(name, reason) {
  blocked = { name, reason };
  for (const k of KEYS) if (name.includes(`[${k}]`)) markerResult.set(k, "BLOCKED");
  console.log(`  ⛔ BLOCKED  ${name}\n            LÝ DO: ${reason}`);
}

/**
 * PHẦN A — chứng minh ASSET JS ĐANG PHỤC VỤ có chứa 5 chuỗi dấu.
 * Chạy ĐỘC LẬP với phần DOM: kể cả khi lái DOM thất bại, kết quả grep asset vẫn có giá trị.
 */
async function assetProof() {
  console.log("\n" + "─".repeat(100));
  console.log("PHẦN A — ASSET JS ĐANG PHỤC VỤ (trích URL ĐÚNG: script src + link modulepreload/preload)");
  console.log("─".repeat(100));
  const html = await (await fetch(BASE + "/")).text();
  const htmlTagRefs = [...html.matchAll(/<(script|link)\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /\.js(\?|"|'|\s|$)/i.test(t));
  console.log(`  GET ${BASE}/ → 200 · ${html.length} bytes`);
  console.log("  Thẻ HTML tham chiếu asset JS (NGUYÊN VĂN):");
  for (const t of [...new Set(htmlTagRefs)]) console.log("    " + t);
  const fromHtml = [...new Set(htmlTagRefs.flatMap((t) => [...t.matchAll(/(?:src|href)="([^"]+\.js[^"]*)"/g)].map((m) => m[1])))];

  // Danh sách asset TRANG THẬT SỰ NẠP (gồm cả chunk `import()` nạp động).
  let fromRuntime = [];
  try {
    fromRuntime = JSON.parse(await ev(`JSON.stringify(
      performance.getEntriesByType("resource").map(e=>e.name).filter(u=>/\\.js(\\?|$)/.test(u))
    )`));
  } catch (e) {
    console.log(`  (không đọc được performance resource của trang: ${e.message})`);
  }
  console.log(`  HTML tham chiếu ${fromHtml.length} asset · TRANG THẬT SỰ NẠP ${fromRuntime.length} asset JS`);
  const toUrl = (u) => (/^https?:/i.test(u) ? u : BASE + (u.startsWith("/") ? u : "/" + u));
  const assetUrls = [...new Set([...fromHtml.map(toUrl), ...fromRuntime])];
  for (const url of assetUrls) {
    let status = 0; let bytes = 0; let text = "";
    try {
      const res = await fetch(url);
      status = res.status;
      text = await res.text();
      bytes = Buffer.byteLength(text, "utf8");
    } catch (e) {
      console.log(`  ${url} → LỖI TẢI: ${e.message}`);
      continue;
    }
    const found = KEYS.filter((k) => text.includes(k));
    assetHits.set(url, found);
    console.log(`  · ${status} · ${String(bytes).padStart(8)} bytes · ${found.length}/5 dấu · ${url}`);
    for (const k of KEYS) {
      if (found.includes(k)) console.log(`        ✔ chứa chuỗi "${k}"`);
    }
  }
  assetOk = [...assetHits.values()].some((f) => KEYS.every((k) => f.includes(k)));
  assetUrl = [...assetHits.entries()].find(([, f]) => KEYS.every((k) => f.includes(k)))?.[0] || null;
  mark("Asset JS ĐANG PHỤC VỤ chứa ĐỦ 5/5 chuỗi dấu", assetOk,
    assetUrl ? `URL chứa đủ 5/5: ${assetUrl}` : "KHÔNG asset nào chứa đủ 5 chuỗi — xem bảng trên");
}

/** Mở vỏ ứng dụng, chịu được một nhịp tải chậm: thử lại tối đa 3 lần. */
async function openApp() {
  for (let i = 1; i <= 3; i++) {
    await send("Page.navigate", { url: BASE });
    if (await waitFor(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`, 45000)) return i;
    console.log(`   (lần ${i}: vỏ ứng dụng chưa render sau 45s — thử lại)`);
    await sleep(2500);
  }
  return 0;
}

console.log("═".repeat(100));
console.log("  PHASE 2 — BẰNG CHỨNG DOM LÚC CHẠY · 5 dấu UI mới · VNTECH ERP V5.3.0");
console.log("═".repeat(100));
console.log(`  BASE (đo DOM) : ${BASE}`);
console.log(`  Tài khoản     : ${USER}`);
console.log(`  Trình duyệt   : ${EDGE}`);
console.log(`  Ảnh chụp      : ${ART}`);

try {
  await send("Page.enable"); await send("Runtime.enable");
  await sleep(2500);

  // PHẦN A chạy TRƯỚC phần DOM để bằng chứng asset không phụ thuộc việc lái DOM thành công.
  try { await assetProof(); }
  catch (e) { block("PHẦN A — asset", `không hoàn tất được phép grep asset: ${e && e.message ? e.message : e}`); }

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  console.log("\n▸ ĐĂNG NHẬP bằng CHÍNH action `login` của ứng dụng");
  const loginHttp = await ev(`(async()=>{
    const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});
    return r.status;
  })()`);
  console.log(`   POST /api/system {action:"login"} → HTTP ${loginHttp}`);
  if (loginHttp !== 200) {
    blocked = { name: "đăng nhập", reason: `POST /api/system {action:"login"} trả HTTP ${loginHttp}` };
    for (const k of KEYS) markerResult.set(k, "BLOCKED");
    console.log(`\n  ⛔ BLOCKED — đăng nhập thất bại (HTTP ${loginHttp}). Không thể đo DOM khi chưa có phiên.`);
    throw Object.assign(new Error("login failed"), { hard: true });
  }
  const shellAttempts = await openApp();
  if (!shellAttempts) {
    blocked = { name: "vỏ ứng dụng", reason: "sau 3 lần nạp lại (45s/lần) ứng dụng vẫn KHÔNG render .sidebar/.nav-tree-group" };
    for (const k of KEYS) markerResult.set(k, "BLOCKED");
    console.log(`\n  ⛔ BLOCKED — ${blocked.reason}`);
    throw Object.assign(new Error("no shell"), { hard: true });
  }
  console.log(`   ✅ Vỏ ứng dụng đã render (có .sidebar) — ở lần nạp thứ ${shellAttempts}`);

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  console.log("\n▸ CHỌN ỨNG VIÊN từ chính payload bootstrap của ứng dụng (KHÔNG hardcode số phiếu)");
  const picked = JSON.parse(await ev(`(async()=>{
    const boot=await (await fetch("/api/system")).json();
    const d=(boot&&boot.data)||{};
    const pos=Array.isArray(d.purchaseOrders)?d.purchaseOrders:[];
    const receipts=Array.isArray(d.receipts)?d.receipts:[];
    const requests=Array.isArray(d.requests)?d.requests:[];
    const poIdSet=new Set(pos.map(p=>String(p.id)));
    const poReqIds=new Set(pos.map(p=>String(p.requestId||"")).filter(Boolean));
    const receiptPoIds=new Set(receipts.map(r=>String(r.purchaseOrderId||"")).filter(Boolean));
    // (A) PR có PO con, và trong PO con có PO ĐÃ CÓ phiếu nhập ⇒ đi tiếp được PR → PO → GRN.
    const childOf=(id)=>pos.filter(p=>String(p.requestId)===String(id));
    const withChild=requests.filter(r=>childOf(r.id).some(p=>receiptPoIds.has(String(p.id))));
    const prChild=withChild[0]||null;
    const prChildPo=prChild?childOf(prChild.id).find(p=>receiptPoIds.has(String(p.id)))||null:null;
    // (B) PR KHÔNG có PO con.
    const noChild=requests.filter(r=>String(r.status)==="approved"&&!poReqIds.has(String(r.id)));
    // (C) Phiếu CHỜ DUYỆT có bước ĐÃ DUYỆT kèm decidedAt VÀ comment (để text in ra là dữ liệu thật).
    const rich=requests.filter(r=>String(r.status)==="pending_approval"&&(r.approvals||[]).some(a=>a.status==="approved"&&a.decidedAt&&a.comment));
    const richFirst=rich.sort((a,b)=>(b.approvals||[]).filter(x=>x.comment).length-(a.approvals||[]).filter(x=>x.comment).length)[0]||null;
    return JSON.stringify({
      counts:{requests:requests.length,purchaseOrders:pos.length,receipts:receipts.length},
      prChild:prChild?{id:String(prChild.id),no:String(prChild.requestNo)}:null,
      prChildPo:prChildPo?{id:String(prChildPo.id),no:String(prChildPo.poNo||prChildPo.id)}:null,
      prNoChild:noChild[0]?{id:String(noChild[0].id),no:String(noChild[0].requestNo)}:null,
      approvalReq:richFirst?{id:String(richFirst.id),no:String(richFirst.requestNo)}:null
    });
  })()`));
  console.log("   bootstrap: " + JSON.stringify(picked.counts));
  console.log("   PR có PO con (→GRN) : " + JSON.stringify(picked.prChild) + " · PO con có phiếu nhập: " + JSON.stringify(picked.prChildPo));
  console.log("   PR KHÔNG có PO con  : " + JSON.stringify(picked.prNoChild));
  console.log("   Phiếu chờ duyệt có bước đã duyệt + bình luận: " + JSON.stringify(picked.approvalReq));

  // ────────────────────────────────────────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(100));
  console.log("PHẦN B — DOM LÚC CHẠY: 3 MÀN · 5 DẤU");
  console.log("─".repeat(100));

  // —— DẤU 1+2: chi tiết PHIẾU ĐỀ NGHỊ (deep link `?request=<id>` do chính ứng dụng hỗ trợ) ——
  async function openRequestDrawer(cand, nhan, marker) {
    if (!cand) { block(`[${marker}] ${nhan}`, "payload bootstrap không có ứng viên phù hợp (xem mục chọn ứng viên ở trên)"); return false; }
    const url = `${BASE}/?request=${encodeURIComponent(cand.id)}`;
    console.log(`\n▸ ${nhan}: mở ${cand.no} bằng ${url}`);
    if (!(await nav(url))) { block(`[${marker}] ${nhan}`, `trang không render vỏ ứng dụng sau khi mở ${url}`); return false; }
    const ok = await waitFor(`document.querySelector('[data-vntech="request-child-pos"]')`, 25000);
    if (!ok) {
      const has = await ev(`document.querySelectorAll('[data-vntech]').length`);
      block(`[${marker}] ${nhan}`, `mở ${url} nhưng KHÔNG thấy [data-vntech="request-child-pos"] trong DOM (số dấu data-vntech hiện có: ${has})`);
      return false;
    }
    console.log(`   ✅ Đã mở chi tiết phiếu đề nghị (thấy khối [data-vntech="request-child-pos"])`);
    return true;
  }
  async function doRequestDetail(cand, nhan, marker) {
    if (!(await openRequestDrawer(cand, nhan, marker))) return false;
    const rows = await ev(`document.querySelectorAll('[data-vntech="child-po-row"]').length`);
    const cap = await captureAll(marker);
    console.log(`   Số dòng PO con ([data-vntech="child-po-row"]): ${rows}`);
    showEvidence(marker, cap);
    console.log(`   Ảnh chụp: ${await shot(`p2-${marker}`)}`);
    markerResult.set(marker, cap.found ? "CÓ" : "KHÔNG");
    mark(`[${marker}] có trên DOM lúc chạy — ${nhan} (${cand.no})`, cap.found === true);
    await doiChungAm(nhan, ["grn-source-po", "approval-step-decided-at", "approval-step-comment"]);
    return true;
  }

  await doRequestDetail(picked.prChild, "chi tiết PHIẾU ĐỀ NGHỊ có PO con (§20)", "request-child-pos");
  await doRequestDetail(picked.prNoChild, "chi tiết PHIẾU ĐỀ NGHỊ KHÔNG có PO con (nhánh «Chưa có PO nào»)", "request-child-pos-empty");

  // —— DẤU 3: chi tiết PHIẾU NHẬP (GRN) — đi PR → PO con → GRN bằng CHÍNH nút có data-vntech ——
  if (picked.prChild && picked.prChildPo) {
    console.log(`\n▸ chi tiết PHIẾU NHẬP (GRN) — click-through PR → PO con → GRN (nút data-vntech, KHÔNG nhảy tắt)`);
    const reopen = await openRequestDrawer(picked.prChild, "mở lại PR để bấm vào PO con", "grn-source-po");
    if (reopen) {
      const clickedPo = await ev(`(()=>{
        const rows=[...document.querySelectorAll('[data-vntech="child-po-row"]')];
        const want=${JSON.stringify(String(picked.prChildPo.no))};
        const row=rows.find(r=>String(r.textContent||"").includes(want))||rows[0];
        if(!row) return "NO_ROW";
        const b=row.querySelector('[data-vntech="child-po-open"]');
        if(!b) return "NO_BUTTON";
        b.click(); return "OK";
      })()`);
      console.log(`   bấm [data-vntech="child-po-open"] của PO con ${picked.prChildPo.no} → ${clickedPo}`);
      if (clickedPo === "OK") {
        const poOpen = await waitFor(`document.querySelector('[data-vntech="po-grn-list"]')`, 20000);
        console.log(`   màn chi tiết PO mở được ([data-vntech="po-grn-list"]): ${poOpen}`);
        if (poOpen) {
          const clickedGrn = await ev(`(()=>{
            const b=document.querySelector('[data-vntech="po-grn-open"]');
            if(!b) return "NO_BUTTON:"+document.querySelectorAll('[data-vntech^="po-grn"]').length;
            b.click(); return "OK";
          })()`);
          console.log(`   bấm [data-vntech="po-grn-open"] → ${clickedGrn}`);
          const grnOpen = await waitFor(`document.querySelector('[data-vntech="grn-source-po"]')`, 20000);
          if (grnOpen) {
            const cap = await captureAll("grn-source-po");
            showEvidence("grn-source-po", cap);
            console.log(`   Ảnh chụp: ${await shot("p2-grn-source-po")}`);
            markerResult.set("grn-source-po", cap.found ? "CÓ" : "KHÔNG");
            mark('[grn-source-po] có trên DOM lúc chạy — chi tiết PHIẾU NHẬP (D3 §21)', cap.found === true);
            await doiChungAm("chi tiết PHIẾU NHẬP (GRN)", ["request-child-pos", "request-child-pos-empty", "approval-step-decided-at"]);
          } else {
            const dump = await ev(`(()=>{const d=document.querySelector(".receipt-drawer");return d?String(d.textContent||"").replace(/\\s+/g," ").slice(0,200):"KHONG_CO_DRAWER";})()`);
            block("[grn-source-po]", `mở được chi tiết phiếu nhập nhưng KHÔNG thấy dấu này trong DOM. Nội dung drawer: ${dump}`);
          }
        } else {
          block("[grn-source-po]", "bấm [data-vntech=child-po-open] nhưng màn chi tiết PO (po-grn-list) không render");
        }
      } else {
        block("[grn-source-po]", `không bấm được [data-vntech="child-po-open"] (kết quả: ${clickedPo})`);
      }
    }
  } else {
    block("[grn-source-po]", "bootstrap không có cặp (PR có PO con · PO con có phiếu nhập) nên không dựng được đường PR→PO→GRN");
  }

  // —— DẤU 4+5: dải duyệt ở màn «Trung tâm phê duyệt» ——
  console.log(`\n▸ dải duyệt (mục 19 / D4) — màn «Trung tâm phê duyệt»`);
  if (!(await nav(BASE))) {
    block("[approval-step-decided-at] + [approval-step-comment]", "không quay lại được vỏ ứng dụng để mở menu");
  } else {
    // Mở đúng nhóm menu chứa mục «Trung tâm phê duyệt» (nhóm có thể đang thu gọn) rồi bấm mục con.
    let navResult = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      navResult = await ev(`(()=>{
        const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
        const target=norm("Trung tâm phê duyệt");
        const kids=[...document.querySelectorAll(".sidebar .nav-child")];
        const el=kids.find(e=>norm(e.textContent)===target)||kids.find(e=>norm(e.textContent).includes(target));
        if(el){ el.click(); return "OK"; }
        const closed=[...document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent")].filter(b=>b.getAttribute("aria-expanded")==="false");
        if(closed.length){ closed.forEach(b=>b.click()); return "EXPANDED"; }
        return "NOT_FOUND:"+JSON.stringify(kids.map(x=>String(x.textContent||"").trim()));
      })()`);
      if (navResult === "OK") break;
      await sleep(1200);
    }
    console.log(`   bấm mục menu «Trung tâm phê duyệt» → ${navResult.startsWith("NOT_FOUND") ? "KHÔNG THẤY MỤC MENU" : navResult}`);
    if (navResult === "OK") {
      const paneOpen = await waitFor(`document.querySelector(".approval-detail-pane")`, 20000);
      if (!paneOpen) {
        block("[approval-step-decided-at] + [approval-step-comment]", "mở được màn phê duyệt nhưng KHÔNG render .approval-detail-pane (không có phiếu chờ duyệt nào trong phạm vi?)");
      } else {
        if (picked.approvalReq) {
          const picked2 = await ev(`(()=>{
            const want=${JSON.stringify(String(picked.approvalReq.no))};
            const bs=[...document.querySelectorAll(".approval-queue-list button")];
            const b=bs.find(x=>String(x.textContent||"").includes(want));
            if(!b) return "NOT_IN_QUEUE:"+bs.length;
            b.click(); return "OK";
          })()`);
          console.log(`   chọn phiếu ${picked.approvalReq.no} trong hàng đợi → ${picked2}`);
          if (picked2 === "OK") {
            await waitFor(`document.querySelector(".approval-detail-pane h2") && String(document.querySelector(".approval-detail-pane h2").textContent).includes(${JSON.stringify(String(picked.approvalReq.no))})`, 15000);
            // Đóng drawer chi tiết phiếu (nếu click hàng đợi đã mở nó) để ảnh chụp thấy rõ dải duyệt.
            await ev(`(()=>{const b=document.querySelector("button.page-back");if(b){b.click();return true;}return false;})()`);
            await sleep(1200);
          }
        }
        const headline = await ev(`(()=>{const h=document.querySelector(".approval-detail-pane h2");return h?String(h.textContent||"").trim():"(không có h2)";})()`);
        console.log(`   Phiếu đang xử lý trên dải duyệt: ${headline}`);
        const capAt = await captureAll("approval-step-decided-at");
        const capCm = await captureAll("approval-step-comment");
        showEvidence("approval-step-decided-at", capAt);
        showEvidence("approval-step-comment", capCm);
        console.log(`   Dòng có DỮ LIỆU THẬT (không phải nhánh «chưa có nguồn»): ` +
          `thời điểm duyệt=${capAt.items.filter((i) => !/chưa có nguồn/.test(i.text)).length} · ` +
          `bình luận=${capCm.items.filter((i) => !/chưa có nguồn/.test(i.text)).length}`);
        console.log(`   Ảnh chụp: ${await shot("p2-approval-timeline")}`);
        markerResult.set("approval-step-decided-at", capAt.found ? "CÓ" : "KHÔNG");
        markerResult.set("approval-step-comment", capCm.found ? "CÓ" : "KHÔNG");
        mark("[approval-step-decided-at] có trên DOM lúc chạy — dải duyệt, «Thời điểm duyệt» (D4 §19)", capAt.found === true);
        mark("[approval-step-comment] có trên DOM lúc chạy — dải duyệt, «Bình luận» (D4 §19)", capCm.found === true);
        mark("Dải duyệt có ít nhất một bước in RA DỮ LIỆU THẬT (thời điểm duyệt + bình luận đọc từ payload)",
          hasRealSource(capAt) && hasRealSource(capCm),
          `thời điểm: ${capAt.items.map((i) => i.text).find((t) => !/chưa có nguồn/.test(t)) || "(không dòng nào có nguồn)"}\n            bình luận: ${capCm.items.map((i) => i.text).find((t) => !/chưa có nguồn/.test(t)) || "(không dòng nào có nguồn)"}`);
        await doiChungAm("dải duyệt (Trung tâm phê duyệt)", ["request-child-pos", "request-child-pos-empty", "grn-source-po"]);
      }
    } else {
      block("[approval-step-decided-at] + [approval-step-comment]", `không tìm thấy mục menu «Trung tâm phê duyệt» trong sidebar — ${navResult}`);
    }
  }
} catch (e) {
  if (!blocked) blocked = { name: "probe", reason: `lỗi khi chạy phép đo: ${e && e.message ? e.message : e}` };
  console.log(`\n  ⛔ BLOCKED — ${blocked.name}: ${blocked.reason}`);
}

// ────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(100));
console.log("KẾT QUẢ 5 DẤU DOM LÚC CHẠY");
const co = (k) => markerResult.get(k) === "CÓ";
for (const k of KEYS) {
  const st = markerResult.get(k) || "BLOCKED";
  console.log(`  [${k}]`.padEnd(34) + `→ ${st === "CÓ" ? "CÓ ✔" : st === "KHÔNG" ? "KHÔNG ✗" : "BLOCKED ⛔"}`);
}
const soCo = KEYS.filter(co).length;
console.log(`\n  Số dấu thấy trên DOM: ${soCo}/5 · Asset JS đang phục vụ chứa đủ 5 chuỗi dấu: ${assetOk ? "CÓ ✔" : "KHÔNG ✗"}`);
if (assetUrl) console.log(`  Asset chứa đủ 5/5: ${assetUrl}`);
console.log(`  Ảnh chụp / profile trình duyệt: ${ART}`);
console.log("═".repeat(100));

try { ws.close(); } catch { /* ignore */ }
try { child.kill(); } catch { /* ignore */ }
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });

const exitCode = soCo === 5 && assetOk ? 0 : blocked ? 2 : 1;
console.log(exitCode === 0 ? "KẾT LUẬN: ĐẠT ✅ — 5/5 dấu có thật trên DOM của bundle ĐANG PHỤC VỤ." :
  exitCode === 2 ? "KẾT LUẬN: BLOCKED ⛔ — xem lý do nguyên văn ở trên." :
    "KẾT LUẬN: KHÔNG ĐẠT ❌ — xem các dòng HỎNG ở trên.");
process.exit(exitCode);
