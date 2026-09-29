// USER 28/09/2026 — ĐO NÚT TẠO theo 3 VAI (goal §12: admin · user thường · user không có quyền).
// Kiểm: nút «＋ Tạo Tổ đội» CHỈ hiện khi có quyền; modal «Tạo tổ đội dự án» mở được.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED] khong tim thay Edge"); process.exit(2); }

async function run(user, pass, label) {
  const profile = join(tmpdir(), "vntech-create", `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const PORT = 9300 + Math.floor(Math.random() * 300);
  const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
  const done = () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
  let ws;
  try {
    const wsUrl = await (async () => { for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
    ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let seq = 0; const pend = new Map();
    ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
    const send = (m, p = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method: m, params: p })); return new Promise((res, rej) => { pend.set(id, (x) => (x.error ? rej(new Error("e")) : res(x.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("t"))), 60000); }); };
    const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
    await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
    for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
    const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(user)},password:${JSON.stringify(pass)}})});return await r.text();})()`);
    const okLogin = /"ok":\s*true/.test(String(login));
    if (!okLogin) { console.log("  [" + label + "] DANG NHAP THAT BAI"); return; }
    await send("Page.navigate", { url: BASE });
    for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
    await sleep(1500);
    const nav = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      const p=[...document.querySelectorAll(".sidebar button.nav-parent")].find(b=>n(b.textContent).includes("quản lý dự án")); if(p)p.click(); return !!p;})()`);
    if (!nav) { console.log("  [" + label + "] khong mo duoc nhom 'Quan ly du an'"); return; }
    await sleep(1800);
    await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      const k=[...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent"));
      const e2=k.find(b=>n(b.textContent).includes("danh sách dự án"))||k[0]; if(e2)e2.click();})()`);
    await sleep(3200);
    // vào thẻ Tổ đội
    const r = await ev(`(async()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
      const tab=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].find(b=>n(b.textContent)==="Tổ đội");
      if(!tab) return "KHONG CO TAB 'To doi' · tabs=" + [...document.querySelectorAll(".project-scope-tabs [role=tab]")].map(b=>n(b.textContent)).join("/");
      if(tab.disabled) return "TAB BI KHOA (disabled) ⇒ LOI";
      tab.click(); await new Promise(x=>setTimeout(x,2500));
      const btn=[...document.querySelectorAll("button")].find(b=>/Tạo tổ đội/i.test(b.textContent||""));
      if(!btn) return "KHONG CO NUT 'Tao to doi' ⇒ an toan (user thieu quyen)";
      btn.click(); await new Promise(x=>setTimeout(x,1800));
      const modal=[...document.querySelectorAll(".overlay, .modal, .base-modal, [role=dialog]")].filter(e=>{const r=e.getBoundingClientRect();return r.width>200&&r.height>100;});
      const title=modal.length?(modal[0].querySelector("h1,h2,h3")||{}).textContent:"(khong co) nhanh voi";
      return "NUT TON TAI · BAM DUOC · MODAL=" + (modal.length?("CO · tieuDe=«"+String(title).trim().slice(0,40)+"»"):"KHONG MO") ;})()`);
    console.log("  [" + label + "] " + r);
  } catch (e) { console.log("  [" + label + "] loi: " + e.message); }
  finally { try { ws?.close(); } catch {} done(); }
}

await run("admin", "Admin123456@", "ADMIN");
await run("giamdoc.demo", "Vntech@2026", "USER THUONG (co the co quyen)");
process.exit(0);
