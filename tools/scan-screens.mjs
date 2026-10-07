// USER 28/09/2026 — QUÉT nhiều màn: tìm nhóm nút nằm DỌC và toolbar nhiều hàng.
// ⚠️ BÀI HỌC TỪ 2 LẦN THẤT BẠI: ⛔ KHÔNG gom danh sách mục con TRƯỚC.
//    Sidebar là ACCORDION ⇒ duyệt hết 11 nhóm thì chỉ nhóm cuối còn mở, mục con biến mất khỏi DOM.
//    ⇒ ĐÚNG CÁCH: với TỪNG mục đích, mở nhóm cha (quét tới khi thấy mục con) rồi BẤM NGAY.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe".replace("\\", "\\")].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED]"); process.exit(2); }
const profile = join(tmpdir(), "vntech-s2", `e-${Date.now()}`);
const PORT = 8900 + Math.floor(Math.random() * 80);
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
  const groupCount = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  console.log("  so nhom cha: " + groupCount);

  /** Với mục đích `TXT`: mở từng nhóm cha, thấy mục con thì BẤM NGAY. Trả về thông điệp. */
  async function go(TXT) {
    for (let g = 0; g < groupCount; g++) {
      await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${g}];if(b)b.click();})()`);
      await sleep(450);
      const hit = await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
        const b=[...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent"))
          .find(x=>nn(x.textContent).includes(${JSON.stringify(TXT.toLowerCase())}));
        if(!b) return "KHONG CO"; b.click(); return "DA BAM";})()`);
      if (hit === "DA BAM") return "OK";
    }
    return "KHONG TIM THAY TRONG " + groupCount + " NHOM";
  }

  // ĐO: cụm điều khiển chồng theo trục Y (nhiều hàng) — đo trực tiếp, không đoán class.
  const SCAN = `(()=>{
    const n=s=>String(s||"").replace(/\\s+/g," ").trim();
    const side=document.querySelector(".sidebar, .nav-tree, nav");
    const nodes=[...document.querySelectorAll("button, input, select, textarea")]
      .filter(e=>{ if(side&&side.contains(e))return false;
        const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
        if(e.closest("table, .table-wrap, .data-table"))return false;  // ⛔ BO QUA O TRONG BANG
        return r.width>4&&r.height>4&&cs.display!=="none"&&cs.visibility!=="hidden"
          && !e.closest(".overlay, .modal, [role=dialog]"); });
    // KHU-VI-CHI-TUNG-CHA: chi ket luan layout khi hai phan tu cung MOT KHUNG CHA.
    // ⛔ KHONG gom theo X toan trang — phan tu o hai khoi khac nhau (thanh cong cu <-> khoi phan trang)
    //    cung X nhung khac Y la BINH THUONG, khong phai 'chong hang'.
    const groups=new Map();
  for(const e of nodes){
      const p=e.parentElement; if(!p) continue;
      const key=p.tagName+"|"+(p.className||"")+"|"+p.children.length;
      if(!groups.has(key)) groups.set(key,{p,items:[]});
      groups.get(key).items.push(e);
    }
    const bad=[];
    for(const {p,items} of groups.values()){
      if(items.length<2) continue;
      // Gom theo truc Y (cung hang) roi dem so HANG trong khoi cha do
      const rows=[]; for(const e of items){ const y=Math.round(e.getBoundingClientRect().top);
        const r=rows.find(k=>Math.abs(k.y-y)<=10); if(r)r.n++; else rows.push({y,n:1}); }
      if(rows.length>1) bad.push({khung:(p.className||p.tagName).toString().slice(0,34),
        hang:rows.length, soNut:items.length,
        mau:items.slice(0,3).map(e=>n(e.textContent||e.placeholder||e.tagName).slice(0,16))});
    }
    const bars=[...document.querySelectorAll(".list-toolbar")].map(b=>{const c=b.querySelector(".list-toolbar-controls");
      if(!c) return null; const r=c.getBoundingClientRect(); const tops=new Set([...c.children].map(k=>Math.round(k.getBoundingClientRect().top/6)));
      return {cao:Math.round(r.height), soHang:tops.size, dieuKhien:c.children.length};}).filter(Boolean);
    const t=[...document.querySelectorAll(".project-scope-tabs,[role=tablist] [role=tab],.admin-subtabs button")].map(x=>n(x.textContent));
    return {bad, bars, tieuDe:t.slice(0,8).join(" | ")};
  })()`;

  const WANT = process.argv.slice(3);
  for (const t of WANT) {
    const r = await go(t);
    if (r !== "OK") { console.log("  [" + t + "] " + r); continue; }
    await sleep(2200);
    const m = await ev(SCAN);
    const bTxt = m.bars.map((b) => (b.soHang > 1 ? "🔴" + b.cao + "px/" + b.soHang + "hàng" : "✅" + b.cao + "px")).join(" ") || "(khong co toolbar)";
    console.log("  [" + t + "] nut-doc=" + m.bad.length + (m.bad.length ? " 🔴 " + JSON.stringify(m.bad.slice(0, 2)) : " ✅") + " | " + bTxt);
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
