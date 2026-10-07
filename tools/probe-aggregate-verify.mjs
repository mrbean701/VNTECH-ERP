// USER 28/09/2026 — ĐO 4 THẺ DANH SÁCH TỔNG HỢP (số dòng + cột + tiêu đề).
// ⚠️ Dùng lại kỹ thuật điều hướng ĐÃ SỬA: duyệt từng nhóm cha (accordion) + vòng chờ,
//    mục con tên «Quản lý dự án», so khớp `includes`.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED] khong tim thay Edge"); process.exit(2); }
const profile = join(tmpdir(), "vntech-agg", `e-${Date.now()}`);
const PORT = 9100 + Math.floor(Math.random() * 150);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

let ws;
try {
  const u = await (async () => { for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
  ws = new WebSocket(u); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let s = 0; const p = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  const send = (me, pa = {}) => { const id = ++s; ws.send(JSON.stringify({ id, method: me, params: pa })); return new Promise((r, j) => { p.set(id, (x) => (x.error ? j(new Error("e")) : r(x.result))); setTimeout(() => p.has(id) && (p.delete(id), j(new Error("t"))), 60000); }); };
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
  const waitFor = async (e, ms = 25000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(e)) return true; } catch {} await sleep(300); } return false; };

  await send("Page.enable"); await send("Runtime.enable");
  await waitFor(`document.readyState==="complete" && !!document.body`, 30000);
  await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return await r.text();})()`);
  await send("Page.navigate", { url: BASE });
  await waitFor(`!!document.querySelector(".sidebar button.nav-parent")`, 30000);

  const CE = `(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    return [...document.querySelectorAll(".sidebar button")].some(b=>!b.classList.contains("nav-parent")&&nn(b.textContent).includes("quản lý dự án"));})()`;
  const n = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < n; i++) {
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}];if(b)b.click();})()`);
    const t = Date.now(); while (Date.now() - t < 4000) { if (await ev(CE)) break; await sleep(250); }
    if (await ev(CE)) break;
  }
  await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    [...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent"))
      .find(b=>nn(b.textContent).includes("quản lý dự án")).click();})()`);
  if (!await waitFor(`!!document.querySelector(".project-scope-tabs")`)) { console.log("  ✖ khong vao duoc man"); process.exit(1); }
  console.log("  vao man Danh sach du an: OK");

  for (const tab of ["Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"]) {
    const r = await ev(`(async()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      const T=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].find(b=>n(b.textContent)===${JSON.stringify(tab)});
      if(!T) return "KHONG CO TAB"; if(T.disabled) return "TAB BI KHOA";
      T.click(); await sleep(2000);
      const card=[...document.querySelectorAll(".card")].find(c=>c.querySelector("table"));
      if(!card) return "KHONG CO BANG";
      const head=(card.querySelector(".vt-card-head, .card-head, h2, h3")||{}).textContent||"";
      const note=card.querySelector(".vt-card-head .muted, .card-head .muted, .muted");
      const cols=[...card.querySelectorAll("thead th")].map(x=>n(x.textContent)).filter(Boolean);
      const rows=[...card.querySelectorAll("tbody tr")].filter(r=>r.querySelectorAll("td").length>1);
      const first=rows[0]?[...rows[0].querySelectorAll("td")].map(t=>n(t.textContent).slice(0,18)).filter(Boolean).slice(0,4).join(" / "):"(khong co dong)";
      return "dong="+rows.length+" | cot="+cols.length+" ["+cols.slice(0,6).join(" · ")+"]\\n        mau-dong-1: "+first;})()`);
    console.log("  [" + tab + "] " + r);
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
