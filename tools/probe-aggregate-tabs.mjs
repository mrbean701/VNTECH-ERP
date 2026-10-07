// USER 28/09/2026 — ĐO 4 THẺ DANH SÁCH TỔNG HỢP: bấm KHÔNG cần chọn dự án, đếm số dòng mỗi thẻ.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), "vntech-agg", `edge-${Date.now()}`);
const PORT = 9800 + Math.floor(Math.random() * 150);
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

// mo nhom cha roi bam muc con (bao loi neu that bai)
const navMsg = await ev(`(()=>{
  const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
  const p=[...document.querySelectorAll(".sidebar button.nav-parent")].find(b=>nn(b.textContent).includes("quản lý dự án"));
  if(!p) return "KHONG TIM THAY NHOM CHA";
  p.click();
  return "DA BAM NHOM CHA";
})()`);
await sleep(1500);
const kidMsg = await ev(`(()=>{
  const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
  const kids=[...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent"));
  const el=kids.find(b=>nn(b.textContent).includes("danh sách dự án"));
  if(!el) return "KHONG TIM THAY MUC CON ("+kids.length+")";
  el.click();
  return "DA BAM «"+nn(el.textContent)+"»";
})()`);
console.log("  dieu huong: " + navMsg + " -> " + kidMsg);
await sleep(3000);

const TABS = ["Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];
for (const t of TABS) {
  const r = await ev(`(async()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
    const tab=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].find(b=>n(b.textContent)===${JSON.stringify(t)});
    if(!tab) return "KHONG TIM THAY TAB";
    if(tab.disabled) return "🔴 TAB BỊ KHOÁ (disabled) — vi pham yeu cau";
    tab.click(); await new Promise(r=>setTimeout(r,2200));
    const n=s=>String(s||"").replace(/\\s+/g," ").trim();
    const tbl=document.querySelector(".table-wrap table, table");
    const rows=tbl?[...tbl.querySelectorAll("tbody tr")].filter(r=>r.querySelectorAll("td").length>1).length:0;
    const head=document.querySelector(".card h2,.card h3,.vt-card-head")||document.querySelector(".card");
    const cols=tbl?[...tbl.querySelectorAll("thead th")].map(h=>n(h.textContent)).filter(Boolean):[];
    return "OK · dong="+rows+" · tieuDe=«"+n((head||{}).textContent).slice(0,60)+"» · cot="+cols.slice(0,5).join(" / ");
  })()`);
  console.log("  [" + t + "] " + r);
}
process.exit(0);
