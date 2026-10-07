// USER 28/09/2026 — ĐO TRỰC TIẾP màn «DANH SÁCH DỰ ÁN»: số nút trong toolbar + DANH SÁCH TAB.
// Mục tiêu: xác nhận (a) đã bỏ filter «Phòng ban» (b) đã bỏ tab «Tổng quan».
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "vntech-prj", `edge-${Date.now()}`);
const PORT = 9700 + Math.floor(Math.random() * 200);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1596,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });
const wsUrl = await (async () => { for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
if (JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return await r.text();})()`) || "{}").ok !== true) { console.error("[BLOCKED]"); process.exit(2); }
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await sleep(1500);

// BẤM ĐÚNG NHÓM CHA rồi bấm mục con (accordion: mở nhóm này thì các nhóm khác đóng).
// ⚠️ Bài học: bấm mục con khi chưa mở nhóm ⇒ KHÔNG tồn tại trong DOM ⇒ phải mở trước.
const clicked = await ev(`(async()=>{
  const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const parent=[...document.querySelectorAll(".sidebar button.nav-parent")].find(b=>n(b.textContent).includes("quản lý dự án"));
  if(!parent) return "KHONG TIM THAY NHOM CHA";
  parent.click(); await sleep(1200);
  const kids=[...document.querySelectorAll(".sidebar button")]
    .filter(b=>!b.classList.contains("nav-parent")&&b.classList.contains("nav-child"));
  if(!kids.length) return "NHOM CHA DA BAM NHUNG KHONG CO .nav-child: "+[...document.querySelectorAll(".sidebar button")].map(b=>n(b.textContent)).join(" / ");
  const el=kids.find(b=>n(b.textContent).includes("danh sách dự án"))||kids[0];
  el.click(); return "DA BAM «"+n(el.textContent)+"» · nhan con: "+kids.map(b=>n(b.textContent)).join(" / ");
})()`);
await sleep(3500);
console.log("  danh sach du an: " + clicked);

const m = await ev(`(()=>{
  const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  const bar=document.querySelector(".list-toolbar");
  const tabs=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].map(b=>n(b.textContent));
  return {
    coToolbar: !!bar,
    tieuDe: bar ? n((bar.querySelector(".list-toolbar-title")||{}).textContent).slice(0,150) : "",
    dieuKhien: bar ? [...bar.querySelectorAll(".list-toolbar-controls > *")].map(k=>n(k.textContent)||k.getAttribute("placeholder")||k.tagName).slice(0,12) : [],
    nhanBoLoc: bar ? [...bar.querySelectorAll(".list-toolbar-field > span:first-child")].map(s=>n(s.textContent)) : [],
    coPhongBan: bar ? /Phòng ban|Tất cả phòng ban/.test(bar.textContent) : false,
    spanTrongDOM: bar ? bar.querySelectorAll(".list-toolbar-controls span").length : 0,
    spanDANGHIEN: bar ? [...bar.querySelectorAll(".list-toolbar-controls span")].filter(s=>{const r=s.getBoundingClientRect();return getComputedStyle(s).display!=="none"&&r.height>1&&r.width>1;}).length : 0,
    thanhCao: bar ? Math.round(bar.querySelector(".list-toolbar-controls").getBoundingClientRect().height) : 0,
    tabs: tabs,
    coTongQuan: tabs.includes("Tổng quan"),
  };})()`);
console.log("  ✅ co toolbar: " + m.coToolbar);
console.log("  tiêu đề: «" + m.tieuDe + "»");
console.log("  nhãn bộ lọc: " + (m.nhanBoLoc.join(" · ") || "(không có)"));
console.log("  ⛔ còn 'Phòng ban' trong toolbar? " + (m.coPhongBan ? "🔴 CÓ (CHƯA BỎ ĐƯỢC)" : "✅ KHÔNG — ĐÃ BỎ"));
console.log("  điều khiển toolbar: " + m.dieuKhien.join(" | "));
console.log("  TAB (" + m.tabs.length + "): " + m.tabs.join(" | "));
console.log("  span trong thanh: " + m.spanTrongDOM + " · ĐANG HIỂN THỊ: " + m.spanDANGHIEN + (m.spanDANGHIEN === 0 ? "  ✅ ĐÃ ẨN HẾT NHÃN" : "  🔴 còn hiện") + " · chiều cao thanh: " + m.thanhCao + "px");
console.log("  ⛔ còn tab 'Tổng quan'? " + (m.coTongQuan ? "🔴 CÓ (CHƯA BỎ ĐƯỢC)" : "✅ KHÔNG — ĐÃ BỎ"));
process.exit(0);
