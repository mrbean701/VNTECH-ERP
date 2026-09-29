#!/usr/bin/env node
// USER 28/09/2026 — TÌM NHÓM NÚT CHỨC NĂNG ĐANG XẾP DỌC (cần chuyển sang HÀNG NGANG).
// ⛔ Quét tĩnh cho nhiều nhiễu (khớp cả nhãn). ⇒ ĐO THẬT: duyệt sidebar, mỗi màn tìm phần tử
//    có ≥2 <button> CON TRỰC TIẾP mà hình chữ nhật của chúng chồng theo trục X (tức xếp DỌC).
// CHỈ ĐỌC — không INSERT/UPDATE/DELETE, không gọi action nghiệp vụ.
//   node tools/probe-vertical-button-groups.mjs [base] [user] [pass] [maxScreens]
import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const MAXS = Number(process.argv[5] || 14);
const ART = join(tmpdir(), "vntech-vbtn");
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-${Date.now()}`);
const PORT = 9100 + Math.floor(Math.random() * 400);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1605,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

const wsUrl = await (async () => {
  for (let i = 0; i < 70; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); }
  throw new Error("no CDP");
})();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => { pend.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error(method + " timeout"))), 90000); }); };
const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || "")); return r.result.value; };

// Hàm dò: chạy trong trang.
const DETECT = `(()=>{
  const out=[];
  const vis=(e)=>{const s=getComputedStyle(e);return s.display!=="none"&&s.visibility!=="hidden"&&e.getBoundingClientRect().width>4&&e.getBoundingClientRect().height>4;};
  for (const el of document.querySelectorAll("div,section,footer,form,fieldset")) {
    if(!vis(el)) continue;
    if(el.closest(".sidebar,.nav-tree-group,.nav-children,.tree-nav")) continue;
    const cn=String(el.className||"").toLowerCase();
    if(/nav|menu|queue|list|scroll|table|tree|pager|tabbar/.test(cn)) continue;
    if(el.tagName!=="FOOTER" && !el.closest("footer,[class*=action],[class*=footer],[class*=controls],[class*=toolbar]")) continue;
    const btns=[...el.children].filter(c=>c.tagName==="BUTTON"&&vis(c));
    if(btns.length<2) continue;
    const actionLike=btns.every(b=>{const t=String(b.textContent||"").trim();const cls=String(b.className||"");return t.length<=28||/primary|secondary|danger|reject|supplement|ghost|link|export|mini|action|btn/i.test(cls);});
    if(!actionLike) continue;
    const rs=btns.map(b=>b.getBoundingClientRect());
    // XẾP DỌC = các nút chồng nhau theo trục X (khoảng giao X > 40% bề rộng nhỏ nhất) VÀ tâm Y tăng dần
    const overlapX=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
    let vertical=true;
    for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){
      const ov=overlapX(rs[i],rs[j]);
      if(ov < 0.4*Math.min(rs[i].width,rs[j].width)) { vertical=false; }
    }
    const ys=rs.map(r=>Math.round(r.top));
    const increasing=ys.every((y,k)=>k===0||y>=ys[k-1]-2);
    if(vertical&&increasing){
      const c=getComputedStyle(el);
      out.push({ cls:String(el.className||"").slice(0,70), tag:el.tagName, n:btns.length,
                 display:c.display, dir:c.flexDirection, cols:c.gridTemplateColumns.slice(0,60),
                 texts:btns.map(b=>String(b.textContent||"").trim().replace(/\\s+/g," ").slice(0,26)),
                 rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(el.getBoundingClientRect()) });
    }
  }
  return out; })()`;

await send("Page.enable"); await send("Runtime.enable"); await sleep(2500);
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.body`)) break; await sleep(600); }
const login = JSON.parse(await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return await r.text();})()`) || "{}");
console.log("  login ok=" + login.ok);
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 70; i++) { if (await ev(`document.readyState==="complete" && !!document.querySelector(".sidebar, .nav-tree-group")`)) break; await sleep(600); }
await sleep(1200);

// Mở hết nhóm sidebar để lấy danh sách màn.
await ev(`(()=>{document.querySelectorAll(".sidebar .nav-tree-group > button.nav-parent").forEach(b=>{if(b.getAttribute("aria-expanded")==="false")b.click();});})()`);
await sleep(1500);
const items = await ev(`(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim();
  return [...document.querySelectorAll(".sidebar button")].map((b,i)=>({i, t:norm(b.textContent).slice(0,44)}))
    .filter(x=>x.t && !/^[\\d\\s·]+$/.test(x.t));})()`);
console.log("  muc sidebar: " + items.length);

const all = [];
const seen = new Set();
for (let k = 0; k < Math.min(items.length, MAXS); k++) {
  const label = items[k].t;
  const clicked = await ev(`(()=>{const norm=s=>String(s||"").replace(/\\s+/g," ").trim();const t=norm(${JSON.stringify(label)});
    const el=[...document.querySelectorAll(".sidebar button")].find(b=>norm(b.textContent).slice(0,44)===t); if(el){el.click();return true;} return false;})()`);
  if (!clicked) continue;
  await sleep(2600);
  const title = await ev(`(()=>{const h=document.querySelector(".screen-title,.module-screen h1,.module-screen h2,.card h2,h1");return h?String(h.textContent||"").trim().slice(0,46):"";})()`);
  let found = [];
  try { found = (await ev(DETECT)) || []; } catch { found = []; }
  for (const f of found) {
    const key = f.cls + "|" + f.n;
    if (seen.has(key)) continue;
    seen.add(key);
    all.push({ screen: title || label, ...f });
  }
  if (found.length) console.log("  ⚠ " + (title || label) + "  → " + found.length + " nhóm nút DỌC");
}

console.log("  ══════ TỔNG HỢP: " + all.length + " NHÓM NÚT ĐANG XẾP DỌC ══════");
for (const a of all) {
  console.log("  🔴 [" + a.screen + "]");
  console.log("      ." + a.cls + " · " + a.n + " nút · display=" + a.display + " · flex-direction=" + a.dir + " · cols=" + a.cols);
  console.log("      nút: " + a.texts.join(" | "));
}
if (!all.length) console.log("  ✅ KHÔNG tìm thấy nhóm nút nào xếp dọc.");
writeFileSync(join(ART, "ket-qua.json"), JSON.stringify(all, null, 2), "utf8");
console.log("  (lưu chi tiết: " + join(ART, "ket-qua.json") + ")");
process.exit(0);
