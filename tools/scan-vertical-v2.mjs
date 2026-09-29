// USER 28/09/2026 — QUÉT TỔNG QUAN nhiều màn: tìm nhóm nút nằm DỌC và toolbar > 1 hàng.
// ⚠️ BÀI HỌC ĐÃ MẮC (sai sót cũ): detector phải loại `.sidebar`/menu/queue-list,
//    và phải LO được class chứa "list" (`.list-toolbar` chính là class cần đo).
//    Cách ổn định hơn: đo TRỰC TIẾP khoảng cách giữa 2 node cùng hàng — không cần đoán class.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED]"); process.exit(2); }
const profile = join(tmpdir(), "vntech-scan", `e-${Date.now()}`);
const PORT = 9000 + Math.floor(Math.random() * 90);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

// ĐO THẬT: cụm button/input/select nào CHỒNG LÊN NHAU (nhiều hàng) — bỏ qua sidebar.
// Cách dò ổn định: gom theo CỐT X (cùng cột trái) rồi đếm số cụm theo trục Y.
const SCAN = `(()=>{
  const n=s=>String(s||"").replace(/\\s+/g," ").trim();
  const side=document.querySelector(".sidebar, .nav-tree, nav");
  const nodes=[...document.querySelectorAll("button, .export-mini, input[type=date], select, a.export-mini")]
    .filter(e=>{ if(side&&side.contains(e))return false;
      const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
      return r.width>4&&r.height>4&&cs.visibility!=="hidden"&&cs.display!=="none"; });
  // Gom theo cột trái (x) ± 12px
  const cols=[]; for(const e of nodes){ const x=Math.round(e.getBoundingClientRect().left);
    const c=cols.find(k=>Math.abs(k-x)<=12); if(c)c.items.push(e); else cols.push({x,items:[e]}); }
  const vertical=[];
  for(const c of cols){ if(c.items.length<2) continue;
    // Gộp theo trục Y (cùng hàng) ± 10px rồi đếm số HÀNG
    const rows=[]; for(const e of c.items){ const y=Math.round(e.getBoundingClientRect().top);
      const r=rows.find(k=>Math.abs(k.y-y)<=10); if(r)r.n++; else rows.push({y,n:1}); }
    if(rows.length>1) vertical.push({x:c.x, hang:rows.length, n:c.items.length,
      mau:c.items.slice(0,3).map(e=>n(e.textContent||e.placeholder||e.tagName).slice(0,14))});
  }
  // Toolbar > 1 hàng?
  const bars=[...document.querySelectorAll(".list-toolbar, .table-toolbar")];
  const bar=[];
  for(const b of bars){ const ctr=b.querySelector(".list-toolbar-controls");
    if(!ctr) continue; const r=ctr.getBoundingClientRect();
    const items=[...ctr.children].map(k=>k.getBoundingClientRect());
    const tops=new Set(items.map(i=>Math.round(i.top/6)));
    bar.push({cao:Math.round(r.height), soHang:tops.size, dieuKhien:items.length});
  }
  const tabs=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].map(t=>n(t.textContent));
  return {ten:tabs.length?tabs.join(" | "):(document.querySelector("h1,h2")||{}).textContent?.slice(0,50)||"?",
    nutDoc:vertical, bar};
})()`;

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

  // Liệt kê toàn bộ mục con (duyệt từng nhóm cha, accordion)
  const CE = `(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    return [...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent")).map(b=>nn(b.textContent));})()`;
  const all = new Set();
  const n = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  for (let i = 0; i < n; i++) {
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}];if(b)b.click();})()`);
    await sleep(500);
    (await ev(CE)).forEach((x) => all.add(x));
  }
  const targets = [...all].filter((x) => x && !/^«/.test(x));
  console.log("  SO MAN TRONG SIDEBAR: " + targets.length);

  const WANT = ["quản lý dự án", "tiến độ dự án", "nhập", "cấp phát", "tổ đội", "tài khoản", "thông báo", "kho vật tư"];
  for (const t of targets) {
    if (!WANT.some((w) => t.includes(w))) continue;
    // Mo lai nhom cha chua muc nay (accordion da dong sau khi duyet het)
    await ev(`(async()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      for(let i=0;i<12;i++){ const p=[...document.querySelectorAll(".sidebar button.nav-parent")].find(b=>{const kids=[...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent"));return false;});
        const groups=document.querySelectorAll(".sidebar button.nav-parent");
        for(let g=0;g<groups.length;g++){ groups[g].click(); await sleep(350);
          const has=[...document.querySelectorAll(".sidebar button")].some(x=>!x.classList.contains("nav-parent")&&nn(x.textContent)===${JSON.stringify(t)});
          if(has) return true; }
        return false;})()`);
    const ok = await ev(`(async()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      const b=[...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent"))
        .find(x=>nn(x.textContent)===${JSON.stringify(t)});
      if(!b) return "KHONG TIM THAY"; b.click(); await sleep(2200); return "OK";})()`);
    if (ok !== "OK") { console.log("  [" + t + "] " + ok); continue; }
    const m = await ev(SCAN);
    const bad = m.nutDoc.length;
    const barTxt = m.bar.map((b) => (b.soHang > 1 ? "🔴" + b.cao + "px/" + b.soHang + "hàng" : "✅" + b.cao + "px")).join(" ");
    console.log("  [" + t + "] nut-doc=" + bad + (bad ? " 🔴 " + JSON.stringify(m.nutDoc.slice(0, 2)) : " ✅") + " | toolbar: " + (barTxt || "(khong co)"));
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
