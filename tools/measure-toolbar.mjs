// USER 28/09/2026 — ĐO TOÁN thanh công cụ của một màn (dùng để xác minh "1 hàng hay nhiều hàng").
//
// ⚠️ BÀI HỌC: detector cũ đếm `Math.round(top/6)` rồi đếm số GIÁ TRỊ KHÁC NHAU.
//    Nếu các control khác CHIỀU CAO (vd select 46px, nút 34px) thì `top` lệch nhau vài px
//    ⇒ BÁO NHẦM "nhiều hàng". ⇒ Cách đúng: GOM THEO TÂM DỌC (±10px) và kiểm tra TRÀN NGANG.
//
// CÁCH DÙNG: node tools/measure-toolbar.mjs <BASE> "<tên mục menu>"
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const TARGET = (process.argv[3] || "Mua hàng & PO").toLowerCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
const profile = join(tmpdir(), "vntech-tb", `e-${Date.now()}`);
const PORT = 8550 + Math.floor(Math.random() * 20);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

let ws;
try {
  const u = await (async () => { for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
  ws = new WebSocket(u); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let s = 0; const p = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  const send = (me, pa = {}) => { const id = ++s; ws.send(JSON.stringify({ id, method: me, params: pa })); return new Promise((r, j) => { p.set(id, (x) => (x.error ? j(new Error("e")) : r(x.result))); setTimeout(() => p.has(id) && (p.delete(id), j(new Error("t"))), 60000); }); };
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
  const wf = async (e, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(e)) return true; } catch {} await sleep(300); } return false; };
  await send("Page.enable"); await send("Runtime.enable");
  await wf(`document.readyState==="complete" && !!document.body`, 30000);
  await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return await r.text();})()`);
  await send("Page.navigate", { url: BASE });
  if (!await wf(`!!document.querySelector(".sidebar button.nav-parent")`, 30000)) { console.log("  KHONG VAO MAN CHINH"); process.exit(1); }
  const n = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  let clicked = false;
  for (let g = 0; g < n && !clicked; g++) {
    for (let a = 0; a < 2; a++) {
      const before = await ev(`document.querySelectorAll(".sidebar button").length`);
      await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${g}];if(b)b.click();})()`);
      await sleep(480);
      if (await ev(`document.querySelectorAll(".sidebar button").length`) > before) {
        const r = await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
          const b=[...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent"))
            .find(x=>nn(x.textContent).includes(${JSON.stringify(TARGET)}));
          if(!b) return "KHONG CO"; b.click(); return "DA BAM";})()`);
        if (r === "DA BAM") { clicked = true; break; }
      }
    }
  }
  if (!clicked) { console.log("  KHONG TIM THAY MENU «" + TARGET + "»"); process.exit(1); }
  await sleep(2600);
  const m = await ev(`(()=>{
    const bars=[...document.querySelectorAll(".list-toolbar")];
    if(!bars.length) return {err:"khong co .list-toolbar"};
    return bars.map(b=>{
      const c=b.querySelector(".list-toolbar-controls");
      if(!c) return {loi:"khong co .list-toolbar-controls"};
      const cr=c.getBoundingClientRect();
      const items=[...c.children].map(k=>{const r=k.getBoundingClientRect();
        return {w:Math.round(r.width),h:Math.round(r.height),cy:Math.round(r.top+r.height/2),
          ten:(String(k.textContent||k.placeholder||k.tagName).split(" ").filter(Boolean).join(" ")).slice(0,16)};});
      // ⛔ GOM THEO TAM DOC (±10px) — KHONG dung thuoc tinh "top"
      //    (Sai khi cac control khac chieu cao ⇒ "top" lech nhau vai px ⇒ bao nham nhieu hang).
      const rows=[]; for(const it of items){const g=rows.find(r=>Math.abs(r.cy-it.cy)<=10);
        if(g){g.n++;g.ht+=it.h;} else rows.push({cy:it.cy,n:1,ht:it.h});}
      const cs=getComputedStyle(c);
      return {soDieuKhien:items.length, soHang:rows.length, cao:Math.round(cr.height),
        rong:Math.round(cr.width), scrollW:Math.round(c.scrollWidth), clientW:Math.round(c.clientWidth),
        tranNgang:Math.round(c.scrollWidth-c.clientWidth),
        flexWrap:cs.flexWrap, flexDir:cs.flexDirection, overflowX:cs.overflowX,
        mau:items.slice(0,5).map(i=>i.ten+" "+i.w+"x"+i.h),
        hang:rows.map(r=>"cy="+r.cy+" n="+r.n)};
    });
  })()`);
  console.log("  MAN: " + TARGET);
  if (m.err) { console.log("  " + m.err); process.exit(1); }
  for (const b of m) {
    if (b.loi) { console.log("  (thanh khong co controls)"); continue; }
    console.log("  ─────────────────────────────────────────");
    console.log("   so dieu khien : " + b.soDieuKhien);
    console.log("   SO HANG THAT  : " + b.soHang + (b.soHang === 1 ? "  ✅ 1 HANG" : "  🔴 " + b.soHang + " HANG"));
    console.log("   khoi         : " + b.rong + "x" + b.cao + "px · flex=" + b.flexDir + "/" + b.flexWrap + " · overflowX=" + b.overflowX);
    console.log("   TRAN NGANG   : " + b.tranNgang + "px" + (b.tranNgang > 0 ? "  (co cuon ngang — chấp nhận được)" : ""));
    console.log("   hang         : " + b.hang.join(" | "));
    console.log("   mau          : " + b.mau.join(" / "));
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
