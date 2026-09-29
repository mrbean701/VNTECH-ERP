// USER 28/09/2026 — Do TOAN that trong trinh duyet cho .supplier-admin-row.
// ⛔ Khong doan: can biet be ngang thuc te, tong chieu rong 9 cot, va style da ap dung.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "vntech-meas", `e-${Date.now()}`);
const PORT = 8850 + Math.floor(Math.random() * 40);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });
let ws;
try {
  const u = await (async () => { for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("x"); })();
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
  const g = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < g; i++) {
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}];if(b)b.click();})()`);
    await sleep(450);
    const hit = await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      const b=[...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent")).find(x=>nn(x.textContent)==="nhà cung cấp");
      if(!b) return 0; b.click(); return 1;})()`);
    if (hit === 1) break;
  }
  await sleep(2500);
  const m = await ev(`(()=>{
    const row=document.querySelector(".supplier-admin-row");
    if(!row) return "KHONG CO .supplier-admin-row";
    const r=row.getBoundingClientRect(), cs=getComputedStyle(row);
    const kids=[...row.children].map(k=>{const kr=k.getBoundingClientRect();return {tag:k.tagName,w:Math.round(kr.width),h:Math.round(kr.height),y:Math.round(kr.top)};});
    const rows=new Set(kids.map(k=>k.y));
    const par=row.parentElement, pr=par?par.getBoundingClientRect():null;
    return { beNgang:Math.round(r.width), beCao:Math.round(r.height),
      display:cs.display, cols:cs.gridTemplateColumns, autoFlow:cs.gridAutoFlow, gap:cs.gap,
      soDong:rows.size, soCon:kids.length, tongChieuRongCon:kids.reduce((s,k)=>s+k.w,0),
      beCha:pr?Math.round(pr.width):null, classCha:par?String(par.className).slice(0,40):"",
      mau:kids.slice(0,4).map(k=>k.tag+" "+k.w+"x"+k.h+" @"+k.y) };
  })()`);
  console.log("  DO THAT .supplier-admin-row:");
  console.log("   " + (typeof m === "string" ? m : JSON.stringify(m, null, 1).split("\n").join("\n   ")));
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
