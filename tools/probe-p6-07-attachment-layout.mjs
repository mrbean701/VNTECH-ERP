#!/usr/bin/env node
// VNTECH ERP V5.3.0 — MT2-P6-07 (§4.5) — ĐO THẬT: khối «TÀI LIỆU ĐÍNH KÈM» trong hồ sơ chi tiết có bị
// CHỒNG LÊN NHAU / TRÀN LAYOUT không, ở NHIỀU KÍCH THƯỚC MÀN HÌNH (headless Edge + CDP).
//
// Nguyên văn §4.5: «Fix: lỗi font · text overlap · input upload · responsive. ⛔ Không để label và file selector
//                  chồng lên nhau. Phải kiểm trên nhiều kích thước màn hình.»
// ĐO 3 NHÓM LỖI, mỗi nhóm 1 phép đo có THỂ SAI ĐƯỢC (⛔ không "có gì cũng ĐẠT"):
//   ① CHỒNG LÊN: rect(`.attachment-pick` — nhãn «Chọn ảnh / hồ sơ») GIAO rect(`input[type=file]`) > 0 px².
//   ② TRÀN NGANG: `scrollWidth > clientWidth + 1` ở `.attachment-panel` / `.approval-meta-pane` / `.approval-files`.
//   ③ CẮT CHỮ: text bị `overflow:hidden` + `scrollWidth > clientWidth` ở nhãn `.attachment-pick > span`.
//
// CHỈ ĐỌC: probe chỉ GET + click điều hướng + đổi viewport. ⛔ KHÔNG ghi dữ liệu, ⛔ không gọi action nghiệp vụ.
//   node tools/probe-p6-07-attachment-layout.mjs [base] [user] [pass]
// exit 0 = 4/4 viewport ĐẠT · exit 1 = có lỗi layout · exit 2 = BLOCKED (không đăng nhập / không tới được màn).

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = (process.argv[2] || "http://127.0.0.1:9000").replace(/\/+$/, "");
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9701 + Math.floor(Math.random() * 90);
const ART = join(tmpdir(), "vntech-p6-07-attachment");
mkdirSync(ART, { recursive: true });

// 4 kích thước §24 yêu cầu (desktop · laptop · smaller viewport).
const VIEWPORTS = [
  { label: "desktop 1600×1000", width: 1600, height: 1000 },
  { label: "laptop 1366×768", width: 1366, height: 768 },
  { label: "laptop nhỏ 1280×800", width: 1280, height: 800 },
  { label: "màn hẹp 1024×768", width: 1024, height: 768 },
];

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("[BLOCKED] Không tìm thấy Edge/Chrome headless."); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ART, `edge-p607-${Date.now()}`)}`, "--no-first-run",
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
  console.log("  MT2-P6-07 (§4.5) — ĐO LAYOUT KHỐI «TÀI LIỆU ĐÍNH KÈM» (hồ sơ chi tiết phê duyệt)");
  console.log("══════════════════════════════════════════════════════════════════════════════");
  await send("Page.navigate", { url: BASE });
  await waitFor(`location.protocol==="http:"`, 30000);
  // ⚠️ DÙNG URL TUYỆT ĐỐI: tab CDP có thể còn `about:blank` ⇒ `fetch("/api/system")` ném "Failed to fetch".
  const login = await ev(`(async()=>{const r=await fetch(${JSON.stringify(BASE + "/api/system")},{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
  console.log(`  Đăng nhập HTTP ${login} · BASE=${BASE}`);
  if (login !== 200) { console.log("  ⛔ BLOCKED — không có phiên."); process.exit(2); }

  await send("Page.navigate", { url: BASE });
  if (!await waitFor(`!!document.querySelector(".sidebar button.nav-parent")`, 40000)) { console.log("  ⛔ BLOCKED — vỏ ứng dụng không render."); process.exit(2); }
  // Vào màn phê duyệt — HỖ TRỢ CẢ 2 HÌNH DẠNG MENU (⚠️ P6-08 §4.6 đã đổi từ 2026-09-23):
  //   • MỚI: mục TRỰC TIẾP `.nav-single-direct[data-nav-single-group="approval_center"]` ⇒ bấm 1 lần;
  //   • CŨ : nhóm «PHÊ DUYỆT» (`.nav-parent`) ⇒ mục con «Trung tâm phê duyệt» (`.nav-child`).
  // ⛔ Không hard-code 1 hình dạng: probe phải chạy được cả trước và sau P6-08 (bài học regression §26).
  const clicked = await ev(`(()=>{const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    const direct=document.querySelector('.sidebar .nav-single-direct[data-nav-single-group="approval_center"]');
    if (direct) { direct.click(); return "direct"; }
    const b=[...document.querySelectorAll(".sidebar button.nav-parent")].find(x=>norm(x.textContent).includes("phê duyệt")); if(b) b.click();
    return "group"; })()`);
  await sleep(1500);
  const entered = clicked === "direct" ? true : await ev(`(()=>{const norm=(s)=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    const el=[...document.querySelectorAll(".sidebar .nav-child")].find(e=>norm(e.textContent).includes("trung tâm phê duyệt")); if(el){el.click();return true;} return false;})()`);
  console.log(`  Mở màn «Trung tâm phê duyệt»: ${entered ? `OK (đường ${clicked === "direct" ? "MỤC TRỰC TIẾP 1 lần bấm" : "nhóm + mục con"})` : "KHÔNG THẤY MỤC MENU"}`);
  if (!entered) { console.log("  ⛔ BLOCKED — không vào được màn phê duyệt."); process.exit(2); }
  const hasPanel = await waitFor(`!!document.querySelector(".approval-meta-pane .attachment-panel")`, 25000);
  if (!hasPanel) { console.log("  ⛔ BLOCKED — không thấy khối TÀI LIỆU ĐÍNH KÈM trong hồ sơ chi tiết (chưa chọn phiếu?)."); process.exit(2); }

  for (const vp of VIEWPORTS) {
    await send("Emulation.setDeviceMetricsOverride", { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
    await sleep(900);
    const m = JSON.parse(await ev(`(()=>{
      const r=(el)=>{ if(!el) return null; const b=el.getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height,r:b.right,b:b.bottom}; };
      const pick=document.querySelector(".approval-meta-pane .attachment-pick");
      const input=pick?pick.querySelector('input[type="file"]'):null;
      const label=pick?pick.querySelector("span"):null;
      const overlap=(a,b)=>{ if(!a||!b) return 0; const w=Math.min(a.r,b.r)-Math.max(a.x,b.x); const h=Math.min(a.b,b.b)-Math.max(a.y,b.y); return w>0&&h>0?Math.round(w*h):0; };
      const box=(sel)=>{ const el=document.querySelector(sel); if(!el) return null; return {overflow:el.scrollWidth-Math.max(0,el.clientWidth), sw:el.scrollWidth, cw:el.clientWidth}; };
      const pr=r(pick), ir=r(input), lr=r(label);
      return JSON.stringify({
        pick:pr, input:ir, label:lr,
        // ⚠️ PHẢI đo NHÃN-CHỮ (span) với Ô CHỌN TỆP — ⛔ KHÔNG đo label với input của CHÍNH nó
        // (input nằm TRONG label ⇒ luôn "chồng" ⇒ DƯƠNG TÍNH GIẢ; đúng lỗi đã mắc ở bản probe đầu).
        // ⛔ KHÔNG viết BACKTICK trong chú thích nằm TRONG template literal — sẽ ĐÓNG CHUỖI SỚM (đã trả giá 2 lần).
        overlapTextInput: overlap(lr,ir),
        labelClipped: label? (label.scrollWidth-Math.max(0,label.clientWidth)) : null,
        panel: box(".approval-meta-pane .attachment-panel"),
        meta: box(".approval-meta-pane"),
        files: box(".approval-files"),
        paneVisible: (()=>{ const p=document.querySelector(".approval-meta-pane"); if(!p) return false;
          const st=getComputedStyle(p); const b=p.getBoundingClientRect();
          return st.display!=="none" && st.visibility!=="hidden" && b.width>0 && b.height>0; })(),
        // CHẨN ĐOÁN: phần tử CON nào RỘNG HƠN khung đính kèm (để ⛔ không đoán mò khi sửa CSS).
        overflowKids: (()=>{ const pan=document.querySelector(".approval-meta-pane .attachment-panel"); if(!pan) return [];
          const w=pan.clientWidth; return [...pan.querySelectorAll("*")]
            .map(e=>({cls:String(e.className||"").split(" ").filter(Boolean).slice(0,2).join("."), sw:e.scrollWidth, ow:e.offsetWidth}))
            .filter(x=>(x.ow>w+1)||(x.sw>w+1)).slice(0,6); })(),
        // CHUỖI TỔ TIÊN của form tải tệp: biết CHÍNH XÁC khung nào ép form xuống 34px (⛔ không đoán mò).
        chain: (()=>{ const f=document.querySelector(".approval-meta-pane .file-upload"); if(!f) return [];
          const out=[]; let el=f;
          while (el && out.length<6) { const st=getComputedStyle(el);
            out.push({ tag:el.tagName.toLowerCase()+"."+String(el.className||"").split(" ").filter(Boolean).slice(0,2).join("."),
              display:st.display, width:Math.round(el.getBoundingClientRect().width), clientW:el.clientWidth,
              flex:st.flex, minW:st.minWidth, overflowX:st.overflowX,
              gtc:String(st.gridTemplateColumns||"").slice(0,60), gcol:String(st.gridColumn||"") });
            el=el.parentElement; }
          return out; })(),
        visible: !!(pr && pr.w>0 && pr.h>0)
      });
    })()`));
    const bad = [];
    if (!m.paneVisible) {
      // Khung hẹp: bố cục responsive có thể THU GỌN khung phải ⇒ ⛔ KHÔNG tính là lỗi layout, ghi rõ «N/A».
      console.log(`  ➖ N/A   viewport ${vp.label} — khung phải «HỒ SƠ CHI TIẾT» bị THU GỌN theo responsive (⛔ không đo được khối đính kèm ở kích thước này)`);
      continue;
    }
    if (!m.visible) bad.push("khối đính kèm KHÔNG hiển thị");
    if (m.overlapTextInput > 0) bad.push(`nhãn-chữ ⨯ ô chọn tệp CHỒNG ${m.overlapTextInput} px²`);
    for (const [k, v] of [["panel", m.panel], ["meta", m.meta], ["files", m.files]]) {
      if (v && v.overflow > 1) bad.push(`${k} TRÀN NGANG ${v.overflow}px (scrollWidth ${v.sw} > clientWidth ${v.cw})`);
    }
    if (m.labelClipped !== null && m.labelClipped > 1) bad.push(`nhãn bị CẮT CHỮ ${m.labelClipped}px`);
    // ⛔ CỔNG CHỐNG «ĐẠT GIẢ»: ô chọn tệp PHẢI đủ rộng để dùng được (≥60% bề rộng khối đính kèm).
    // (Đã trả giá: bản trước báo ĐẠT dù ô chọn tệp co còn 26px vì form bị nhét vào cột 34px.)
    const usable = m.input && m.panel && m.panel.cw > 0 && m.input.w >= m.panel.cw * 0.6;
    if (!usable) bad.push(`ô chọn tệp QUÁ HẸP: ${Math.round(m.input?.w || 0)}px < 60% của ${m.panel?.cw || 0}px`);
    mark(`viewport ${vp.label}`, bad.length === 0,      bad.length ? bad.join(" · ") + (m.overflowKids?.length ? ` · CON RỘNG QUÁ KHUNG: ${m.overflowKids.map((k)=>k.cls+" offset="+k.ow+" scroll="+k.sw).join(" | ")}` : "") : `nhãn-chữ ${Math.round(m.label?.w || 0)}×${Math.round(m.label?.h || 0)} · ô chọn tệp ${Math.round(m.input?.w || 0)}×${Math.round(m.input?.h || 0)} · chồng 0px² · không tràn`);
    if (m.chain?.length) console.log("            CHUỖI KHUNG: " + m.chain.map((c)=>`${c.tag}[${c.display} w=${c.width} clientW=${c.clientW} flex=${c.flex} minW=${c.minW} gtc=${c.gtc}]`).join(" ← "));
    if (bad.length) {
      const s = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(ART, `p607-${vp.width}.png`), Buffer.from(s.data, "base64"));
    }
  }
  console.log("══════════════════════════════════════════════════════════════════════════════");
  console.log(fails === 0 ? "  KẾT LUẬN: 4/4 kích thước ĐẠT — ⛔ không chồng nhãn/input, ⛔ không tràn ngang ✅"
    : `  KẾT LUẬN: ${fails} viewport HỎNG layout ✗ (ảnh chụp trong ${ART})`);
} catch (e) {
  console.log(`  ⛔ BLOCKED — ${e && e.message ? e.message : e}`);
  process.exit(2);
} finally {
  try { ws.close(); } catch { /* ignore */ }
  try { child.kill(); } catch { /* ignore */ }
}
process.exit(fails === 0 ? 0 : 1);
