// USER 28/09/2026 — PROBE ĐIỀU HƯỚNG SIDEBAR BỀN VỮNG.
// ⚠️ LÝ DO VIẾT LẠI: probe cũ dùng `sleep` CỐ ĐỊNH sau khi bấm nhóm cha.
//    Sidebar là ACCORDION (mở nhóm này thì ĐÓNG nhóm khác) + render bất đồng bộ
//    ⇒ sleep 1,2–1,8s là KHÔNG ĐỦ ⇒ mục con chưa có trong DOM ⇒ probe báo sai.
// ⚠️ BÀI HỌC: với UI bất đồng bộ phải VÒNG CHỜ (poll) theo điều kiện, không ngủ đại trà.
//
// Hàm `waitFor(expr, ms)` trả về true/false — dùng cho MỌI bước.
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const LABEL = process.argv[3] || "admin";
const USER = LABEL === "user" ? "giamdoc.demo" : "admin";
const PASS = LABEL === "user" ? "Vntech@2026" : "Admin123456@";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED] khong tim thay Edge"); process.exit(2); }

const profile = join(tmpdir(), "vntech-nav", `e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
const PORT = 9300 + Math.floor(Math.random() * 300);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
const done = () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} };
process.on("exit", done);

let ws;
try {
  const wsUrl = await (async () => {
    for (let i = 0; i < 80; i++) {
      try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {}
      await sleep(500);
    } throw new Error("no CDP");
  })();
  ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0; const pend = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const send = (m, p = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method: m, params: p }));
    return new Promise((res, rej) => { pend.set(id, (x) => (x.error ? rej(new Error("e")) : res(x.result)));
      setTimeout(() => pend.has(id) && (pend.delete(id), rej(new Error("timeout " + m))), 60000); }); };
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  /** ⛔ THAY THẾ CHO `sleep` CỐ ĐỊNH: chờ tới khi biểu thức trả true. */
  const waitFor = async (expr, ms = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(300); }
    return false;
  };

  await send("Page.enable"); await send("Runtime.enable");
  if (!await waitFor(`document.readyState==="complete" && !!document.body`, 30000)) { console.log("  ✖ trang khong load"); process.exit(1); }

  const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"login",username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return (await r.text()).slice(0,80);})()`);
  console.log("  dang nhap [" + LABEL + "] " + USER + ": " + String(login).slice(0, 46));

  await send("Page.navigate", { url: BASE });
  if (!await waitFor(`!!document.querySelector(".sidebar button.nav-parent")`, 30000)) { console.log("  ✖ khong co sidebar"); process.exit(1); }

  // ── BƯỚC 1: mở nhóm chứa «Danh sách dự án» ────────────────────────────────
  // ⚠️ BÀI HỌC (đo 28/09, 2 lần):
  //   ① Sidebar là ACCORDION — mở nhóm này thì ĐÓNG nhóm khác ⇒ phải mở đúng nhóm cha.
  //   ② Mục con KHÔNG mang class `nav-child` ⇒ lọc theo class là SAI.
  // Cách chắc chắn: duyệt TỪNG nhóm cha, sau mỗi lần bấm thì VÒNG CHỜ xem mục con có xuất hiện không.
  const CHILD_EXPR = `(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    return [...document.querySelectorAll(".sidebar button")].some(b=>!b.classList.contains("nav-parent")&&nn(b.textContent).includes("quản lý dự án"));})()`;
  const groupCount = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  let hasKid = false, foundBy = "";
  for (let i = 0; i < groupCount && !hasKid; i++) {
    const label = await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim();
      const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; return b?nn(b.textContent):"";})()`);
    await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${i}]; if(b) b.click();})()`);
    const t0 = Date.now();
    while (Date.now() - t0 < 6000) { if (await ev(CHILD_EXPR)) { hasKid = true; foundBy = label; break; } await sleep(300); }
  }
  console.log("  duyet " + groupCount + " nhom cha · " + (hasKid ? "OK tim thay muc con o nhom «" + foundBy + "»" : "✖ KHONG tim thay muc con"));
  if (!hasKid) { console.log("  DANH SACH: " + await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim();
    return [...document.querySelectorAll(".sidebar button")].map(b=>nn(b.textContent)).join(" | ");})()`)); process.exit(1); }

  // ── BƯỚC 2: bấm mục con, VÒNG CHỜ dải thẻ dự án xuất hiện ───────────────
  await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim().toLowerCase();
    [...document.querySelectorAll(".sidebar button")].filter(b=>!b.classList.contains("nav-parent"))
      .find(b=>nn(b.textContent).includes("quản lý dự án")).click();})()`);
  const onScreen = await waitFor(`!!document.querySelector(".project-scope-tabs")`, 25000);
  console.log("  vao man Danh sach du an: " + (onScreen ? "OK" : "✖ khong thay .project-scope-tabs"));
  if (!onScreen) { console.log("  DOM co: " + (await ev(`document.querySelector(".project-management")?"co .project-management":"khong co"`))); process.exit(1); }

  const tabs = await ev(`(()=>{const n=s=>String(s||"").replace(/\\s+/g," ").trim();
    return [...document.querySelectorAll(".project-scope-tabs [role=tab]")].map(b=>n(b.textContent));})()`);
  console.log("  TAB: " + tabs.join(" | "));
  console.log("  === TRANG THAI BUTTON (CHI TIET) ===");

  // ── BƯỚC 3: từng thẻ — bấm, VÒNG CHỜ, rồi bấm nút tạo và VÒNG CHỜ modal ──
  const PLAN = [["Danh sách dự án", "Tạo dự án"], ["Tổ đội", "Tạo tổ đội"], ["Kho", "Tạo kho"], ["Ban chỉ huy", "Tạo Ban chỉ huy"]];
  for (const [tab, btn] of PLAN) {
    const res = await ev(`(async()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim();
      const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
      const T=[...document.querySelectorAll(".project-scope-tabs [role=tab]")].find(b=>nn(b.textContent)===${JSON.stringify(tab)});
      if(!T) return "KHONG CO TAB";
      if(T.disabled) return "TAB BI KHOA (disabled)";
      T.click();
      for(let i=0;i<60;i++){ await sleep(200);
        const b=[...document.querySelectorAll("button")].find(x=>nn(x.textContent).includes(${JSON.stringify(btn)}));
        if(b) { if(b.disabled) return "NUT TON TAI NHUNG BI VO HIEU (thieu quyen) — an toan";
          console.log("    ["+${JSON.stringify(tab)}"] nut「"+${JSON.stringify(btn)}」TIEN TICH=1 khong bi khoa");
          b.click(); for(let j=0;j<50;j++){ await sleep(200);
            const m=[...document.querySelectorAll(".overlay,.modal,[role=dialog],.base-modal")].filter(e=>{const r=e.getBoundingClientRect();return r.width>200&&r.height>80;});
            if(m.length){ const ttl=(m[0].querySelector("h1,h2,h3")||{}).textContent; return "MO DUOC · tieuDe=«"+String(ttl||"").trim().slice(0,40)+"»"; } }
          return "BAM ROI nhung modal KHONG MO"; } }
      return "KHONG CO NUT «"+${JSON.stringify(btn)}+"» (user thieu quyen — an toan)"; })()`);
    console.log("  [" + tab + "] nut「" + btn + "」-> " + res);
    // đóng modal nếu mở
    await ev(`(()=>{const b=[...document.querySelectorAll("button")].find(x=>/huỷ|đóng|✕|×/i.test(String(x.textContent||"").trim())||/close/i.test(x.className||""));
      if(b)b.click();})()`);
    await sleep(600);
  }
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} done(); }
