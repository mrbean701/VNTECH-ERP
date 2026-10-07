// USER 28/09/2026 — Do gate quyen cua 4 nut tren trinh duyet THAT (admin).
// ⚠️ Ket qua truoc: admin KHONG THAY nut ⇒ canCreateProject = false ⇒ can GATE SAI.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "vntech-gate", `e-${Date.now()}`);
const PORT = 9200 + Math.floor(Math.random() * 200);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });
let ws;
try {
  const u = await (async () => { for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("x"); })();
  ws = new WebSocket(u); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let s = 0; const p = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  const send = (me, pa = {}) => { const id = ++s; ws.send(JSON.stringify({ id, method: me, params: pa })); return new Promise((r, j) => { p.set(id, (x) => (x.error ? j(new Error("e")) : r(x.result))); setTimeout(() => p.has(id) && (p.delete(id), j(new Error("t"))), 60000); }); };
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
  const waitFor = async (e, ms = 25000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(e)) return true; await sleep(300); } return false; };
  await send("Page.enable"); await send("Runtime.enable");
  await waitFor(`document.readyState==="complete" && !!document.body`, 30000);
  await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"giamdoc.demo",password:"Vntech@2026"})});return await r.text();})()`);
  await send("Page.navigate", { url: BASE });
  await waitFor(`!!document.querySelector(".sidebar button.nav-parent")`, 30000);
  const CE = `(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    return [...document.querySelectorAll(".sidebar button")].some(b=>!b.classList.contains("nav-parent")&&nn(b.textContent).includes("quản lý dự án"));})()`;
  const n = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < n; i++) { await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}];if(b)b.click();})()`); const t = Date.now(); while (Date.now() - t < 4000) { if (await ev(CE)) break; await sleep(250); } if (await ev(CE)) break; }
  await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();[...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent")).find(b=>nn(b.textContent).includes("quản lý dự án")).click();})()`);
  await waitFor(`!!document.querySelector(".project-scope-tabs")`);
  await sleep(800);

  // Doc DUU LIEU bootstrap de kiem tra gate
  console.log("  --- SOI GATE CHI TIET (GATE-DETAIL) ---");
  const d = await ev(`(async()=>{const r=await fetch("/api/system");const j=await r.json();const x=j.data||j;
    const u=x.user||{}; const perms=(x.modulePermissions||[]).map(p=>p.key||p.moduleKey||p.module).join(",");
    return {user:u.username||u.name, role:u.role, isAdminLike:/admin/i.test(String(u.role||""))||/admin/i.test(String(u.username||"")),
      moduleCount:(x.modulePermissions||[]).length, perms:perms.slice(0,200)};})()`);
  console.log("  USER: " + d.user + " · role=" + d.role);
  console.log("  modulePermissions: " + d.moduleCount + " muc -> " + d.perms);

  // Soi tung thẻ
  for (const tab of ["Danh sách dự án", "Tổ đội", "Kho", "Ban chỉ huy"]) {
    const r = await ev(`(async()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim();
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      const T=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].find(b=>nn(b.textContent)===${JSON.stringify(tab)});
      if(!T) return "KHONG CO TAB"; T.click(); await sleep(1500);
      const btns=[...document.querySelectorAll("button")].map(b=>({t:nn(b.textContent),d:b.disabled,ti:b.getAttribute("title")||""})).filter(x=>/tạo/i.test(x.t));
      return JSON.stringify(btns);})()`);
    console.log("  [" + tab + "] " + r);
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
